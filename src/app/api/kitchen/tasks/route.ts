import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim()
    const category = searchParams.get('category')?.trim()
    const status = searchParams.get('status')?.trim()
    const staffName = searchParams.get('staffName')?.trim()
    const shift = searchParams.get('shift')?.trim()

    const where: any = {}

    if (date) where.date = date
    if (category && category !== 'ALL') where.category = category
    if (status && status !== 'ALL') where.status = status
    if (shift && shift !== 'ALL') where.shift = shift
    if (staffName) {
      where.staffName = { contains: staffName, mode: 'insensitive' }
    }

    const tasks = await prisma.kitchenTaskLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      include: {
        mealLog: {
          select: {
            id: true,
            token: true,
            _count: { select: { feedbacks: true } }
          }
        }
      }
    })

    // Compute stats for the given date (or overall)
    const allForDate = await prisma.kitchenTaskLog.findMany({
      where: date ? { date } : {},
      select: { category: true, status: true, servings: true }
    })

    const stats = {
      total: allForDate.length,
      meals: allForDate.filter(t => t.category === 'MEAL').length,
      salads: allForDate.filter(t => t.category === 'SALAD').length,
      cleaning: allForDate.filter(t => t.category === 'CLEANING').length,
      prep: allForDate.filter(t => t.category === 'PREP').length,
      bakery: allForDate.filter(t => t.category === 'BAKERY').length,
      pending: allForDate.filter(t => t.status === 'PENDING').length,
      approved: allForDate.filter(t => t.status === 'APPROVED').length,
      rejected: allForDate.filter(t => t.status === 'REJECTED').length,
      totalServings: allForDate.reduce((acc, t) => acc + (t.servings || 0), 0)
    }

    return NextResponse.json({ success: true, tasks, stats })
  } catch (error: any) {
    console.error('Kitchen tasks GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()

    const {
      date,
      staffName,
      staffRole,
      timeFrom,
      timeTo,
      shift = '1-Smena',
      category = 'MEAL',
      title,
      description,
      servings,
      itemsUsed,
      cleaningArea,
      cleaningAgent,
      photos
    } = body

    if (!staffName?.trim() || !staffRole?.trim() || !title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Xodim ismi, lavozimi va ish nomi to'ldirilishi shart!" },
        { status: 400 }
      )
    }

    const taskDate = date || new Date().toISOString().slice(0, 10)
    let mealLogId: number | null = null

    // If it's a MEAL and itemsUsed is provided, also create a MealLog so staff can vote via QR!
    if (category === 'MEAL') {
      try {
        const token = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(23, 59, 59, 999)

        const createdMeal = await prisma.mealLog.create({
          data: {
            mealName: title.trim(),
            cookedDate: taskDate,
            shift: shift || '1-Smena',
            preparedBy: staffName.trim(),
            ingredients: typeof itemsUsed === 'string' ? itemsUsed : JSON.stringify(itemsUsed || []),
            notes: description || null,
            servings: servings ? parseInt(String(servings), 10) : null,
            token,
            expiresAt
          }
        })
        mealLogId = createdMeal.id
      } catch (err) {
        console.warn('Could not auto-create MealLog for voting:', err)
      }
    }

    const newTask = await prisma.kitchenTaskLog.create({
      data: {
        date: taskDate,
        staffName: staffName.trim(),
        staffRole: staffRole.trim(),
        timeFrom: timeFrom?.trim() || '08:00',
        timeTo: timeTo?.trim() || '17:00',
        shift: shift || '1-Smena',
        category,
        title: title.trim(),
        description: description?.trim() || null,
        servings: servings ? parseInt(String(servings), 10) : null,
        itemsUsed: typeof itemsUsed === 'string' ? itemsUsed : JSON.stringify(itemsUsed || []),
        cleaningArea: cleaningArea?.trim() || null,
        cleaningAgent: cleaningAgent?.trim() || null,
        photos: typeof photos === 'string' ? photos : JSON.stringify(photos || []),
        status: 'PENDING',
        mealLogId
      }
    })

    return NextResponse.json({ success: true, task: newTask })
  } catch (error: any) {
    console.error('Kitchen task POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

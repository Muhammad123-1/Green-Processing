import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function checkIsExpired(cookedDate: string, expiresAt?: Date | null): boolean {
  const now = new Date()
  if (expiresAt && now > new Date(expiresAt)) return true
  // Check Tashkent calendar date (UTC+5)
  const tashkentToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(now)
  return cookedDate < tashkentToday
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const token = searchParams.get('token')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (token) {
      const log = await prisma.mealLog.findUnique({
        where: { token },
        include: {
          feedbacks: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
      if (!log) {
        return NextResponse.json({ error: 'Ovqat topilmadi' }, { status: 404 })
      }
      return NextResponse.json({
        ...log,
        isExpired: checkIsExpired(log.cookedDate, log.expiresAt)
      })
    }

    const where: Record<string, unknown> = {}
    if (date) where.cookedDate = date

    const logs = await prisma.mealLog.findMany({
      where,
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const enrichedLogs = logs.map(log => {
      const totalFeedback = log.feedbacks.length
      const goodCount = log.feedbacks.filter(f => f.rating === 'GOOD').length
      const avgCount = log.feedbacks.filter(f => f.rating === 'AVERAGE').length
      const badCount = log.feedbacks.filter(f => f.rating === 'BAD').length

      return {
        ...log,
        isExpired: checkIsExpired(log.cookedDate, log.expiresAt),
        feedbackStats: {
          total: totalFeedback,
          good: goodCount,
          average: avgCount,
          bad: badCount,
          goodPct: totalFeedback > 0 ? Math.round((goodCount / totalFeedback) * 100) : 0
        }
      }
    })

    return NextResponse.json(enrichedLogs)
  } catch (error) {
    console.error('Error fetching meal logs:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mealName, cookedDate, shift, preparedBy, ingredients, notes, servings } = body

    if (!mealName || !cookedDate || !preparedBy) {
      return NextResponse.json({ error: "Majburiy maydonlar to'ldirilmagan" }, { status: 400 })
    }
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Kamida 1 ta mahsulot qo'shing" }, { status: 400 })
    }

    // Har bir yangi ovqat uchun unikal 1-kunlik token yaratish
    const token = crypto.randomBytes(8).toString('hex')
    // Ushbu kunning so'nggi daqiqasi (Toshkent vaqti bilan 23:59:59.999+05:00)
    // Ertasi kuniga o'tishi bilan token muddati avtomatik tugaydi
    const expiresAt = new Date(`${cookedDate}T23:59:59.999+05:00`)

    const log = await prisma.mealLog.create({
      data: {
        mealName: mealName.trim(),
        cookedDate,
        shift: shift || '1-Smena',
        preparedBy: preparedBy.trim(),
        ingredients: JSON.stringify(ingredients),
        notes: notes?.trim() || null,
        servings: servings ? parseInt(servings) : null,
        token,
        expiresAt
      }
    })

    return NextResponse.json({
      ...log,
      isExpired: false
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating meal log:', error)
    return NextResponse.json({ error: 'Jurnalni saqlashda xatolik' }, { status: 500 })
  }
}

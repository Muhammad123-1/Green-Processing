import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: fetch daily food samples by date or all
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim()

    const where: any = {}
    if (date && date !== 'ALL') {
      where.date = date
    }

    const samples = await prisma.dailyFoodSampleLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { orderNumber: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json({ success: true, samples })
  } catch (error: any) {
    console.error('Error fetching daily food samples:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: create a new food sample record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      date = new Date().toISOString().slice(0, 10),
      dishName,
      sampleTime = '09:05',
      sampleWeight = '100 гр',
      containerCondition = 'Идиш тоза, дезинфекция қилинган',
      fridgeTime = '09:15',
      fridgeTemp = '+2°C...+6°C',
      expiryTime = '48 соат',
      responsiblePerson = 'Жуманова Ч.Э.',
      signature = 'Жуманова Ч.Э.',
      status = 'APPROVED',
      notes = ''
    } = body

    if (!dishName?.trim()) {
      return NextResponse.json({ success: false, error: 'Taom nomi kiritilishi shart' }, { status: 400 })
    }

    const countForDate = await prisma.dailyFoodSampleLog.count({
      where: { date }
    })

    const sample = await prisma.dailyFoodSampleLog.create({
      data: {
        date,
        orderNumber: countForDate + 1,
        dishName: dishName.trim(),
        sampleTime: sampleTime.trim(),
        sampleWeight: sampleWeight.trim(),
        containerCondition: containerCondition.trim(),
        fridgeTime: fridgeTime.trim(),
        fridgeTemp: fridgeTemp.trim(),
        expiryTime: expiryTime.trim(),
        responsiblePerson: responsiblePerson.trim(),
        signature: signature?.trim() || responsiblePerson.trim(),
        status,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({ success: true, sample })
  } catch (error: any) {
    console.error('Error creating food sample:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: update an existing food sample
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    const sample = await prisma.dailyFoodSampleLog.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, sample })
  } catch (error: any) {
    console.error('Error updating food sample:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: delete sample
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    await prisma.dailyFoodSampleLog.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting food sample:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

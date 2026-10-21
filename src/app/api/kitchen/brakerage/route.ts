import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 3 initial sample records from the official sheet if database is empty
const INITIAL_DEMO_RECORDS = [
  {
    date: '2026-04-27',
    orderNumber: 1,
    mealName: 'Скалетти макаронные вар.',
    prepTime: '9:10',
    chairmanSign: 'Иминов С.М.',
    member1Sign: 'Зимина Л.Г.',
    member2Sign: 'Расулов А.А.',
    qcInspectorSign: 'Камбарова А.М.',
    medicalStaffSign: 'Жуманова Ч.Э.',
    organoleptic: 'Ташқи кўриниши сариқ, ўз тинимли ранг, ёғ томчилари пушти рангли, всего, татиб кўрилганда нормальные тузими юмшок. пишган.',
    temperature: '+80°C',
    notes: 'Яхши, истеъмолга рухсат этилади.',
    status: 'APPROVED'
  },
  {
    date: '2026-04-27',
    orderNumber: 2,
    mealName: 'Педивее с мясом',
    prepTime: '9:13',
    chairmanSign: 'Иминов С.М.',
    member1Sign: 'Зимина Л.Г.',
    member2Sign: 'Расулов А.А.',
    qcInspectorSign: 'Камбарова А.М.',
    medicalStaffSign: 'Жуманова Ч.Э.',
    organoleptic: 'Ташқи кўриниши сариқ, гўшта в макароны яши аралашган, мазали, мазаси нормал, тузими юмшоқ, стандартда.',
    temperature: '+92°C',
    notes: 'Яхши, истеъмолга рухсат этилади.',
    status: 'APPROVED'
  },
  {
    date: '2026-04-27',
    orderNumber: 3,
    mealName: 'Св. помидоры и огурцы',
    prepTime: '9:15',
    chairmanSign: 'Иминов С.М.',
    member1Sign: 'Зимина Л.Г.',
    member2Sign: 'Расулов А.А.',
    qcInspectorSign: 'Камбарова А.М.',
    medicalStaffSign: 'Жуманова Ч.Э.',
    organoleptic: 'Ташқи кўриниши янги, помидор в бодрящем состоянии, ширали, табиий таъмда, нормальные тузими.',
    temperature: '+2°C',
    notes: 'Яхши, истеъмолга рухсат этилади.',
    status: 'APPROVED'
  }
]

// GET: fetch brakerage logs by date or all
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim()

    // Auto-seed demo data if table is completely empty
    const totalCount = await (prisma as any).kitchenBrakerageLog.count()
    if (totalCount === 0) {
      await (prisma as any).kitchenBrakerageLog.createMany({
        data: INITIAL_DEMO_RECORDS
      })
    }

    const where: any = {}
    if (date && date !== 'ALL') {
      where.date = date
    }

    const logs = await (prisma as any).kitchenBrakerageLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { orderNumber: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    console.error('Error fetching brakerage logs:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: create a new inspection record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      date = new Date().toISOString().slice(0, 10),
      mealName,
      prepTime = '09:00',
      chairmanSign = 'Иминов С.М.',
      member1Sign = 'Зимина Л.Г.',
      member2Sign = 'Расулов А.А.',
      qcInspectorSign = 'Камбарова А.М.',
      medicalStaffSign = 'Жуманова Ч.Э.',
      organoleptic = 'Ташқи кўриниши яхши, таъми меъёрида, тўлиқ пишган.',
      temperature = '+85°C',
      notes = 'Яхши, истеъмолга рухсат этилади.',
      status = 'APPROVED'
    } = body

    if (!mealName?.trim()) {
      return NextResponse.json({ success: false, error: 'Taom nomi kiritilishi shart' }, { status: 400 })
    }

    // Determine next orderNumber for this date
    const countForDate = await (prisma as any).kitchenBrakerageLog.count({
      where: { date }
    })

    const newLog = await (prisma as any).kitchenBrakerageLog.create({
      data: {
        date,
        orderNumber: countForDate + 1,
        mealName: mealName.trim(),
        prepTime: prepTime.trim(),
        chairmanSign: chairmanSign?.trim() || null,
        member1Sign: member1Sign?.trim() || null,
        member2Sign: member2Sign?.trim() || null,
        qcInspectorSign: qcInspectorSign?.trim() || null,
        medicalStaffSign: medicalStaffSign?.trim() || null,
        organoleptic: organoleptic.trim(),
        temperature: temperature.trim(),
        notes: notes?.trim() || null,
        status: status === 'REJECTED' ? 'REJECTED' : 'APPROVED'
      }
    })

    return NextResponse.json({ success: true, log: newLog })
  } catch (error: any) {
    console.error('Error creating brakerage log:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: update existing inspection record
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID topilmadi' }, { status: 400 })
    }

    const updated = await (prisma as any).kitchenBrakerageLog.update({
      where: { id: Number(id) },
      data
    })

    return NextResponse.json({ success: true, log: updated })
  } catch (error: any) {
    console.error('Error updating brakerage log:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: remove inspection record
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID topilmadi' }, { status: 400 })
    }

    await (prisma as any).kitchenBrakerageLog.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting brakerage log:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

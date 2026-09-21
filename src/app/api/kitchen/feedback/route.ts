import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '30')
    const where: Record<string, unknown> = {}
    if (date) where.date = date

    const feedbacks = await prisma.mealFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: days * 10
    })

    const stats = {
      total: feedbacks.length,
      good: feedbacks.filter(f => f.rating === 'GOOD').length,
      average: feedbacks.filter(f => f.rating === 'AVERAGE').length,
      bad: feedbacks.filter(f => f.rating === 'BAD').length,
    }

    return NextResponse.json({ feedbacks, stats })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rating, comment, date, mealName } = body

    if (!rating || !['GOOD', 'AVERAGE', 'BAD'].includes(rating)) {
      return NextResponse.json({ error: "Noto'g'ri baho" }, { status: 400 })
    }

    const feedback = await prisma.mealFeedback.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        date: date || new Date().toISOString().slice(0, 10),
        mealName: mealName || null
      }
    })

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Bahoni saqlashda xatolik' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const where: Record<string, unknown> = {}
    if (date) where.cookedDate = date
    const logs = await prisma.mealLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mealName, cookedDate, shift, preparedBy, ingredients, notes, servings } = body
    if (!mealName || !cookedDate || !preparedBy) {
      return NextResponse.json({ error: 'Majburiy maydonlar toldirilmagan' }, { status: 400 })
    }
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Kamida 1 ta mahsulot qoshing' }, { status: 400 })
    }
    const log = await prisma.mealLog.create({
      data: {
        mealName,
        cookedDate,
        shift: shift || '1-Smena',
        preparedBy,
        ingredients: JSON.stringify(ingredients),
        notes: notes || null,
        servings: servings ? parseInt(servings) : null
      }
    })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Jurnalni saqlashda xatolik' }, { status: 500 })
  }
}

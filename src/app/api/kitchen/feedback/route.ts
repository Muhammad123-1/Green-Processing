import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function checkIsExpired(cookedDate: string, expiresAt?: Date | null): boolean {
  const now = new Date()
  if (expiresAt && now > new Date(expiresAt)) return true
  const tashkentToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(now)
  return cookedDate < tashkentToday
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '30')

    // Agar token so'ralgan bo'lsa - xodimlar shu token orqali ovqat ma'lumotini ko'radi
    if (token) {
      const mealLog = await prisma.mealLog.findUnique({
        where: { token },
        select: {
          id: true,
          mealName: true,
          cookedDate: true,
          shift: true,
          preparedBy: true,
          servings: true,
          expiresAt: true
        }
      })

      if (!mealLog) {
        return NextResponse.json({ error: "Bunday havola mavjud emas" }, { status: 404 })
      }

      const isExpired = checkIsExpired(mealLog.cookedDate, mealLog.expiresAt)

      return NextResponse.json({
        mealLog,
        isExpired
      })
    }

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
    console.error('Error in kitchen feedback GET:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rating, comment, date, mealName, token } = body

    if (!rating || !['GOOD', 'AVERAGE', 'BAD'].includes(rating)) {
      return NextResponse.json({ error: "Noto'g'ri baho tanlangan" }, { status: 400 })
    }

    let resolvedMealLogId: number | null = null
    let resolvedMealName = mealName || null
    let resolvedDate = date || new Date().toISOString().slice(0, 10)

    // Token bo'yicha tekshirish
    if (token) {
      const meal = await prisma.mealLog.findUnique({
        where: { token }
      })

      if (!meal) {
        return NextResponse.json({ error: "Bunday havola topilmadi yoki noto'g'ri" }, { status: 404 })
      }

      // 1 kunlik amal qilish muddatini tekshirish (ertasi kuniga o'tishi bilan bloklanadi)
      const isExpired = checkIsExpired(meal.cookedDate, meal.expiresAt)
      if (isExpired) {
        return NextResponse.json({
          error: "Ushbu ovqat uchun baholash muddati tugagan! Baholash faqat tayyorlangan kuni amal qiladi."
        }, { status: 403 })
      }

      resolvedMealLogId = meal.id
      resolvedMealName = meal.mealName
      resolvedDate = meal.cookedDate
    }

    const feedback = await prisma.mealFeedback.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        date: resolvedDate,
        mealName: resolvedMealName,
        mealLogId: resolvedMealLogId
      }
    })

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 })
  } catch (error) {
    console.error('Error saving meal feedback:', error)
    return NextResponse.json({ error: 'Bahoni saqlashda xatolik yuz berdi' }, { status: 500 })
  }
}

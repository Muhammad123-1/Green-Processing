import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { autoSyncShopReportForDates } from '@/lib/shopReportSync'

export const dynamic = 'force-dynamic'

/**
 * Endpoint to auto-archive daily shop reports (Kirim, Chiqim, Ortib qolgan qoldiqlar).
 * Gathers arrivals, material dispatches, and GP outputs for the last 30 days (plus today).
 * Saves clean DayReport into ShopExpense.balances.report.
 * Automatically run periodically, on demand, or at day change.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    const nowUz = new Date(Date.now() + 5 * 3600 * 1000)
    const todayUz = nowUz.toISOString().slice(0, 10)

    const archiveFrom = new Date(nowUz)
    archiveFrom.setUTCDate(archiveFrom.getUTCDate() - 30)
    const archiveFromStr = archiveFrom.toISOString().slice(0, 10)

    const [arrivals, expenses] = await Promise.all([
      prisma.shopArrival.findMany({
        where: { date: { gte: archiveFromStr, lte: todayUz } },
        select: { date: true },
      }),
      prisma.shopExpense.findMany({
        where: { date: { gte: archiveFromStr, lte: todayUz } },
        select: { date: true },
      }),
    ])

    const dateSet = new Set<string>()
    dateSet.add(todayUz)
    arrivals.forEach((a) => { if (a.date) dateSet.add(a.date) })
    expenses.forEach((e) => { if (e.date) dateSet.add(e.date) })

    const sortedDates = Array.from(dateSet).sort()
    const processedCount = await autoSyncShopReportForDates(sortedDates)

    return NextResponse.json({
      success: true,
      todayUz,
      processedCount,
      dates: sortedDates,
    })
  } catch (error: any) {
    console.error('Auto archive error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}

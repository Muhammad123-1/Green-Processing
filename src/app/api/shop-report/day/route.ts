import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { isDateStr, sanitizeDayReport, hasReportData } from '@/lib/shopReport'

export const dynamic = 'force-dynamic'

/**
 * Save the daily workshop report (Tab 3) for one date.
 * Body: { date: 'YYYY-MM-DD', report: { matrix, outputs, balances } }
 * Stored in ShopExpense.balances.report, so imported data in
 * materials / matrix / outputs is left untouched.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const date = body?.date
    if (!isDateStr(date)) {
      return NextResponse.json({ error: "Sana noto'g'ri" }, { status: 400 })
    }

    const report = sanitizeDayReport(body?.report)
    const now = new Date().toISOString()
    const existing = await prisma.shopExpense.findUnique({ where: { date } })
    const prevBalances = ((existing?.balances as any) || {}) as Record<string, any>

    const balances: Record<string, any> = { ...prevBalances }
    if (hasReportData(report)) {
      balances.report = { ...report, updatedAt: now, updatedBy: session.name }
    } else {
      // Everything cleared by the user -> remove the saved report for this day
      delete balances.report
    }

    if (existing) {
      await prisma.shopExpense.update({ where: { date }, data: { balances } })
    } else {
      await prisma.shopExpense.create({ data: { date, materials: {}, balances } })
    }

    return NextResponse.json({ success: true, date, updatedAt: now, updatedBy: session.name })
  } catch (error: any) {
    console.error('Shop day report save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

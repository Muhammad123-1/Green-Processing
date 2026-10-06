import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { applyExpenseRow, isDateStr } from '@/lib/shopReport'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Расход" rows (one row per date).
 * Body: { rows: [{ date, iceberg, tomatoes, ... }] }
 * Existing materials that are not part of the table are preserved, and the
 * daily workshop report stored in balances.report is never touched here.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const rows: any[] = Array.isArray(body?.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ success: true, saved: 0 })

    const invalid = rows.filter((r) => !isDateStr(r?.date))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Sana noto'g'ri yoki kiritilmagan (${invalid.length} ta qator)` },
        { status: 400 }
      )
    }

    // If the same date appears twice, the last edited row wins
    const byDate = new Map<string, any>()
    rows.forEach((r) => byDate.set(r.date, r))

    const now = new Date().toISOString()
    let saved = 0

    await prisma.$transaction(
      async (tx) => {
        for (const [date, row] of byDate) {
          const existing = await tx.shopExpense.findUnique({ where: { date } })
          const materials = applyExpenseRow(existing?.materials, row)
          const prevBalances = ((existing?.balances as any) || {}) as Record<string, any>
          const balances = {
            ...prevBalances,
            expenseMeta: { updatedBy: session.name, updatedAt: now },
          }

          if (existing) {
            await tx.shopExpense.update({ where: { date }, data: { materials, balances } })
          } else {
            await tx.shopExpense.create({ data: { date, materials, balances } })
          }
          saved++
        }
      },
      { timeout: 60000, maxWait: 10000 }
    )

    return NextResponse.json({ success: true, saved })
  } catch (error: any) {
    console.error('Shop expenses save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { applyGPRow, isDateStr } from '@/lib/shopReport'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Выпуск ГП" rows (one row per date).
 * Body: { rows: [{ date, iceberg, tomatoes, ... }] }
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

    const byDate = new Map<string, any>()
    rows.forEach((r) => byDate.set(r.date, r))

    const now = new Date().toISOString()
    let saved = 0

    await prisma.$transaction(
      async (tx) => {
        for (const [date, row] of byDate) {
          const existing = await tx.shopExpense.findUnique({ where: { date } })
          const outputs = applyGPRow(existing?.outputs, row)
          const prevBalances = ((existing?.balances as any) || {}) as Record<string, any>
          const balances = {
            ...prevBalances,
            gpMeta: { updatedBy: session.name, updatedAt: now },
          }

          if (existing) {
            await tx.shopExpense.update({ where: { date }, data: { outputs, balances } })
          } else {
            await tx.shopExpense.create({ data: { date, outputs, balances, materials: {} } })
          }
          saved++
        }
      },
      { timeout: 60000, maxWait: 10000 }
    )

    return NextResponse.json({ success: true, saved })
  } catch (error: any) {
    console.error('Shop GP save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

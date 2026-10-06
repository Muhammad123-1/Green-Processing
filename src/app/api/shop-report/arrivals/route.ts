import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { isDateStr, toNum } from '@/lib/shopReport'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Приход" rows.
 * Body: { rows: [{ id?, date, nomenclature, quantity, supplier, batch }] }
 * Rows with an id are updated, rows without an id are created.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const rows: any[] = Array.isArray(body?.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ success: true, updated: 0, created: 0 })

    const invalid = rows.filter((r) => !isDateStr(r?.date))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Sana noto'g'ri yoki kiritilmagan (${invalid.length} ta qator)` },
        { status: 400 }
      )
    }

    let updated = 0
    let created = 0

    await prisma.$transaction(
      async (tx) => {
        for (const r of rows) {
          const data = {
            date: r.date as string,
            nomenclature: String(r.nomenclature ?? '').trim(),
            quantity: toNum(r.quantity),
            supplier: String(r.supplier ?? '').trim(),
            batch: String(r.batch ?? '').trim(),
          }
          const id = Number(r.id)
          if (Number.isInteger(id) && id > 0) {
            await tx.shopArrival.update({ where: { id }, data })
            updated++
          } else {
            await tx.shopArrival.create({ data })
            created++
          }
        }
      },
      { timeout: 60000, maxWait: 10000 }
    )

    return NextResponse.json({ success: true, updated, created })
  } catch (error: any) {
    console.error('Shop arrivals save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

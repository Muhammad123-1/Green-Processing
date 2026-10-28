import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { isDateStr, toNum } from '@/lib/shopReport'
import { getNextShopArrivalBatch, normalizeProductKey, parseDateToYearMonth } from '@/lib/batchNumbering'

export const dynamic = 'force-dynamic'

/**
 * Save edited / newly added "Приход" rows.
 * Body: { rows: [{ id?, date, nomenclature, quantity, supplier, batch }] }
 * Rows with an id are updated, rows without an id are created.
 * Automatically generates sequential batch numbers per product and month if batch is left blank or "auto".
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
        // Track generated batch numbers for same product in same month during this batch request
        const inFlightBatches = new Map<string, number>()

        for (const r of rows) {
          const nom = String(r.nomenclature ?? '').trim()
          const cleanNom = normalizeProductKey(nom)
          let batchStr = String(r.batch ?? '').trim()
          const dateStr = String(r.date ?? '').trim()

          // If batch is empty or explicitly 'auto', calculate the next sequential monthly number
          if (cleanNom && (!batchStr || batchStr.toLowerCase() === 'auto')) {
            const { yearMonth } = parseDateToYearMonth(dateStr)
            const key = `${cleanNom}:::${yearMonth}`

            if (!inFlightBatches.has(key)) {
              const nextVal = await getNextShopArrivalBatch(nom, dateStr, tx)
              const nextNum = parseInt(nextVal, 10) || 1
              inFlightBatches.set(key, nextNum)
              batchStr = String(nextNum)
            } else {
              const nextNum = (inFlightBatches.get(key) || 1) + 1
              inFlightBatches.set(key, nextNum)
              batchStr = String(nextNum)
            }
          }

          const data = {
            date: dateStr,
            nomenclature: nom,
            quantity: toNum(r.quantity),
            supplier: String(r.supplier ?? '').trim(),
            batch: batchStr,
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

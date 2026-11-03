import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { parseDateToYearMonth, normalizeProductKey } from '@/lib/batchNumbering'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    let arrivals = await prisma.shopArrival.findMany({
      orderBy: [{ date: 'desc' }, { id: 'desc' }]
    })
    const expenses = await prisma.shopExpense.findMany({ orderBy: { date: 'desc' } })

    // Check if any arrivals are missing batch numbers
    const needsBatch = arrivals.some(a => !a.batch || a.batch.trim() === '')
    if (needsBatch) {
      // Sort chronologically ascending to assign batch numbers in sequence: 1, 2, 3...
      const sorted = [...arrivals].sort((a, b) => {
        const da = a.date || ''
        const db = b.date || ''
        if (da !== db) return da.localeCompare(db)
        return a.id - b.id
      })

      const monthlyCounters = new Map<string, number>()
      const updates: { id: number; batch: string }[] = []

      for (const a of sorted) {
        const nom = normalizeProductKey(a.nomenclature)
        if (!nom) continue
        const { yearMonth } = parseDateToYearMonth(a.date)
        const key = `${nom}:::${yearMonth}`

        let cur = monthlyCounters.get(key) || 0
        if (a.batch && a.batch.trim() !== '') {
          const num = parseInt(a.batch.trim(), 10)
          if (!isNaN(num) && num > cur) {
            cur = num
            monthlyCounters.set(key, cur)
          }
        } else {
          cur += 1
          monthlyCounters.set(key, cur)
          const assignedBatch = String(cur)
          a.batch = assignedBatch
          updates.push({ id: a.id, batch: assignedBatch })
        }
      }

      // Persist generated batches to PostgreSQL in the background
      if (updates.length > 0) {
        ;(async () => {
          try {
            const chunkSize = 150
            for (let i = 0; i < updates.length; i += chunkSize) {
              const chunk = updates.slice(i, i + chunkSize)
              const whenCases = chunk.map(u => `WHEN ${u.id} THEN '${u.batch.replace(/'/g, "''")}'`).join(' ')
              const ids = chunk.map(u => u.id).join(',')
              await prisma.$executeRawUnsafe(`
                UPDATE "ShopArrival"
                SET "batch" = CASE "id" ${whenCases} END
                WHERE "id" IN (${ids});
              `)
            }
          } catch (err) {
            console.error('Error auto-backfilling arrival batches:', err)
          }
        })()
      }
    }

    return NextResponse.json({ arrivals, expenses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR'
    if (!isAdmin) {
      return NextResponse.json(
        { error: "To'liq bazani yangilash va o'chirish faqat Administrator tomonidan amalga oshirilishi mumkin!" },
        { status: 403 }
      )
    }

    const body = await req.json()

    if (body.arrivals && body.arrivals.length > 0) {
      await prisma.shopArrival.deleteMany()
      await prisma.shopArrival.createMany({
        data: body.arrivals.map((a: any) => ({
          date: a.date || '',
          nomenclature: a.nomenclature || '',
          quantity: Number(a.quantity) || 0,
          supplier: a.supplier || '',
          batch: a.batch ? String(a.batch).trim() : null
        }))
      })
    }

    if (body.expenses && body.expenses.length > 0) {
      await prisma.shopExpense.deleteMany()
      const dataToInsert = body.expenses.map((exp: any) => ({
        date: exp.date,
        materials: exp.materials || {}
      }))
      await prisma.shopExpense.createMany({
        data: dataToInsert
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

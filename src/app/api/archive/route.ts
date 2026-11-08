import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function safeParse(str: string | null | undefined) {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

const ALLOWED_TYPES = new Set(['ALL', 'ARRIVAL', 'EXPENSE', 'REPORT', 'QC'])

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '20', 10)
    const typeParam = (searchParams.get('type') || 'ALL').toUpperCase()
    const rawDate = searchParams.get('date')?.trim() || ''

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam)
    const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 20 : limitParam))
    const offset = (page - 1) * limit
    const type = ALLOWED_TYPES.has(typeParam) ? typeParam : 'ALL'

    // Validate date format YYYY-MM-DD
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : ''

    let baseUnion = `
      SELECT 'ARRIVAL' as kind, id, date, "createdAt" FROM "ShopArrival"
      UNION ALL
      SELECT 'EXPENSE' as kind, id, date, "createdAt" FROM "ShopExpense"
      UNION ALL
      SELECT 'REPORT' as kind, id, date, ("createdAt" + interval '1 millisecond') as "createdAt" 
        FROM "ShopExpense" 
        WHERE (matrix IS NOT NULL AND matrix::text != '{}') 
           OR (outputs IS NOT NULL AND outputs::text != '{}')
      UNION ALL
      SELECT 'QC' as kind, id, date, "createdAt" FROM "DailyQCChecklist"
    `

    if (type === 'ARRIVAL') {
      baseUnion = `SELECT 'ARRIVAL' as kind, id, date, "createdAt" FROM "ShopArrival"`
    } else if (type === 'EXPENSE') {
      baseUnion = `SELECT 'EXPENSE' as kind, id, date, "createdAt" FROM "ShopExpense"`
    } else if (type === 'REPORT') {
      baseUnion = `SELECT 'REPORT' as kind, id, date, ("createdAt" + interval '1 millisecond') as "createdAt" 
        FROM "ShopExpense" 
        WHERE (matrix IS NOT NULL AND matrix::text != '{}') 
           OR (outputs IS NOT NULL AND outputs::text != '{}')`
    } else if (type === 'QC') {
      baseUnion = `SELECT 'QC' as kind, id, date, "createdAt" FROM "DailyQCChecklist"`
    }

    const whereClause = date ? `WHERE date = $1` : ''
    const countQuery = `
      WITH unified_events AS (
        ${baseUnion}
      )
      SELECT count(*)::int as total
      FROM unified_events
      ${whereClause}
    `

    const pageQuery = `
      WITH unified_events AS (
        ${baseUnion}
      )
      SELECT kind, id, date, "createdAt"
      FROM unified_events
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [countRows, pageRows] = (await Promise.all([
      date ? prisma.$queryRawUnsafe(countQuery, date) : prisma.$queryRawUnsafe(countQuery),
      date ? prisma.$queryRawUnsafe(pageQuery, date) : prisma.$queryRawUnsafe(pageQuery)
    ])) as [any[], any[]]

    const total = countRows[0]?.total || 0

    // Separate IDs by kind
    const arrivalIds: number[] = []
    const expenseIds: number[] = []
    const qcIds: number[] = []

    for (const r of pageRows) {
      if (r.kind === 'ARRIVAL') arrivalIds.push(r.id)
      else if (r.kind === 'EXPENSE' || r.kind === 'REPORT') expenseIds.push(r.id)
      else if (r.kind === 'QC') qcIds.push(r.id)
    }

    const [arrivals, expenses, checklists] = await Promise.all([
      arrivalIds.length > 0 ? prisma.shopArrival.findMany({ where: { id: { in: arrivalIds } } }) : [],
      expenseIds.length > 0 ? prisma.shopExpense.findMany({ where: { id: { in: expenseIds } } }) : [],
      qcIds.length > 0
        ? prisma.dailyQCChecklist.findMany({
            where: { id: { in: qcIds } },
            include: { user: { select: { name: true, username: true, role: true } } }
          })
        : []
    ])

    const arrivalMap = new Map(arrivals.map(a => [a.id, a]))
    const expenseMap = new Map(expenses.map(e => [e.id, e]))
    const qcMap = new Map(checklists.map(c => [c.id, c]))

    const events: any[] = []

    for (const row of pageRows) {
      if (row.kind === 'ARRIVAL') {
        const a = arrivalMap.get(row.id)
        if (!a) continue
        events.push({
          id: `arr_${a.id}`,
          type: 'ARRIVAL',
          date: a.date,
          title: 'Xomashyo qabul qilindi (Kirim)',
          desc: `${a.nomenclature} - ${a.quantity} kg (${a.supplier || "Noma'lum"})`,
          author: 'Excel import',
          createdAt: a.createdAt,
          payload: {
            Sana: a.date,
            Nomenklatura: a.nomenclature,
            'Miqdor (kg)': a.quantity,
            'Yetkazib beruvchi': a.supplier || '—',
            Partiya: a.batch || '—'
          }
        })
      } else if (row.kind === 'EXPENSE') {
        const e = expenseMap.get(row.id)
        if (!e) continue
        const materials = (e.materials as any) || {}
        events.push({
          id: `exp_${e.id}`,
          type: 'EXPENSE',
          date: e.date,
          title: 'Ishlab chiqarish (Chiqim)',
          desc: `Kunlik sarf-xarajatlar: ${Object.keys(materials).length} ta xomashyo/material`,
          author: 'Excel import',
          createdAt: e.createdAt,
          payload: { Sarflangan: materials }
        })
      } else if (row.kind === 'REPORT') {
        const e = expenseMap.get(row.id)
        if (!e) continue
        const matrix = (e.matrix as any) || {}
        const outputs = (e.outputs as any) || {}
        const balances = (e.balances as any) || {}
        events.push({
          id: `rep_${e.id}`,
          type: 'REPORT',
          date: e.date,
          title: 'Ishlab chiqarish hisoboti (Tsex)',
          desc: `Xomashyo: ${Object.keys(matrix).length} ta, tayyor mahsulot: ${Object.keys(outputs).length} ta`,
          author: 'Excel import',
          createdAt: row.createdAt,
          payload: {
            'Xomashyo sarfi (matritsa)': matrix,
            'Tayyor mahsulot (Выход ГП)': outputs,
            Qoldiqlar: balances
          }
        })
      } else if (row.kind === 'QC') {
        const c = qcMap.get(row.id)
        if (!c) continue
        const { formData, user } = c as any
        const authorName = c.inspector || user?.name || user?.username || "Noma'lum"
        events.push({
          id: `qc_${c.id}`,
          type: 'QC',
          date: c.date,
          title: 'Sifat nazorati (QC) — kunlik chek-list',
          desc: `Tekshiruvchi: ${authorName}. Smena: ${c.shift}. Holat: ${c.status}`,
          author: authorName,
          createdAt: c.createdAt,
          payload: {
            Sana: c.date,
            Smena: c.shift,
            Liniya: c.lineName || '—',
            Partiya: c.batchNumber || '—',
            'Brak (kg)': c.rejectedKg ?? '—',
            'Jami chiqish (quti)': c.totalOutputBox ?? '—',
            Nazoratchi: c.supervisor || '—',
            Tekshiruvchi: authorName,
            Holat: c.status,
            'Chek-list ma\'lumotlari': safeParse(formData)
          }
        })
      }
    }

    return NextResponse.json({
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Archive fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 })
  }
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const takeCount = date ? 200 : 75

    const [arrivals, expenses, checklists] = await Promise.all([
      prisma.shopArrival.findMany({
        where: date ? { date } : {},
        orderBy: { createdAt: 'desc' },
        take: takeCount
      }),
      prisma.shopExpense.findMany({
        where: date ? { date } : {},
        orderBy: { date: 'desc' },
        take: takeCount
      }),
      prisma.dailyQCChecklist.findMany({
        where: date ? { date } : {},
        orderBy: { createdAt: 'desc' },
        take: takeCount,
        include: { user: { select: { name: true, username: true, role: true } } }
      })
    ])

    const events: any[] = []

    arrivals.forEach(a => {
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
    })

    expenses.forEach(e => {
      const materials = (e.materials as any) || {}
      const matrix = (e.matrix as any) || {}
      const outputs = (e.outputs as any) || {}
      const balances = (e.balances as any) || {}

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

      if (Object.keys(matrix).length > 0 || Object.keys(outputs).length > 0) {
        events.push({
          id: `rep_${e.id}`,
          type: 'REPORT',
          date: e.date,
          title: 'Ishlab chiqarish hisoboti (Tsex)',
          desc: `Xomashyo: ${Object.keys(matrix).length} ta, tayyor mahsulot: ${Object.keys(outputs).length} ta`,
          author: 'Excel import',
          createdAt: new Date(new Date(e.createdAt).getTime() + 1),
          payload: {
            'Xomashyo sarfi (matritsa)': matrix,
            'Tayyor mahsulot (Выход ГП)': outputs,
            Qoldiqlar: balances
          }
        })
      }
    })

    checklists.forEach(c => {
      const { formData, user, ...rest } = c as any
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
    })

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(events)
  } catch (error) {
    console.error('Archive fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 })
  }
}

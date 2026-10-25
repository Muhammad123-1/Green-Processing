import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')?.trim()

    // 1. Get all available dates from ShopExpense
    const allExpenses = await prisma.shopExpense.findMany({
      select: { date: true },
      orderBy: { date: 'desc' },
    })

    const availableDates = Array.from(new Set(allExpenses.map((e) => e.date).filter(Boolean)))
    const activeDate = dateParam || availableDates[0] || new Date().toISOString().split('T')[0]

    // 2. Fetch ShopExpense for activeDate
    const expense = await prisma.shopExpense.findFirst({
      where: { date: activeDate },
    })

    // Also check arrivals for that date
    const arrivals = await prisma.shopArrival.findMany({
      where: { date: activeDate },
      orderBy: { nomenclature: 'asc' },
    })

    const outputs: Record<string, { kg: number; korobki?: number; upakovki?: number }> = (expense?.outputs as any) || {}

    // Parse products from outputs
    const productList = Object.entries(outputs).map(([name, val]: [string, any]) => {
      const kg = typeof val === 'object' && val !== null ? val.kg || 0 : typeof val === 'number' ? val : 0
      const boxes = typeof val === 'object' && val !== null ? val.korobki || 0 : 0
      const packs = typeof val === 'object' && val !== null ? val.upakovki || 0 : 0
      return {
        product: name,
        total: kg,
        boxes,
        packs,
      }
    })

    const totalKg = productList.reduce((sum, p) => sum + p.total, 0)
    const totalBoxes = productList.reduce((sum, p) => sum + p.boxes, 0)
    const totalPacks = productList.reduce((sum, p) => sum + p.packs, 0)

    const arrivalsList = arrivals.map((a) => ({
      id: a.id,
      product: a.nomenclature,
      quantity: a.quantity || 0,
      supplier: a.supplier || 'Noma\'lum',
      batch: a.batch || '-',
    }))
    const totalArrivalsKg = arrivalsList.reduce((sum, a) => sum + a.quantity, 0)

    return NextResponse.json({
      activeDate,
      availableDates,
      products: productList,
      totalKg,
      totalBoxes,
      totalPacks,
      arrivals: arrivalsList,
      totalArrivalsKg,
    })
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 })
  }
}

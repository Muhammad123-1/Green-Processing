import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period')?.trim().toLowerCase() || 'day') as 'day' | 'week' | 'month' | 'year'
    const dateParam = searchParams.get('date')?.trim()
    const monthParam = searchParams.get('month')?.trim()
    const yearParam = searchParams.get('year')?.trim()

    // 1. Get all available dates from ShopExpense to determine available periods
    const allExpenses = await prisma.shopExpense.findMany({
      select: { date: true },
      orderBy: { date: 'desc' },
    })

    const availableDates = Array.from(new Set(allExpenses.map((e) => e.date).filter(Boolean)))
    const availableMonths = Array.from(
      new Set(
        availableDates
          .map((d) => (d.length >= 7 ? d.substring(0, 7) : ''))
          .filter(Boolean)
      )
    )
    const availableYears = Array.from(
      new Set(
        availableDates
          .map((d) => (d.length >= 4 ? d.substring(0, 4) : ''))
          .filter(Boolean)
      )
    )

    // 2. Determine target filter based on period
    const activeDate = dateParam || availableDates[0] || new Date().toISOString().split('T')[0]
    const activeMonth = monthParam || (dateParam ? dateParam.substring(0, 7) : availableMonths[0] || '2026-10')
    const activeYear = yearParam || (dateParam ? dateParam.substring(0, 4) : availableYears[0] || '2026')

    let whereExp: any = {}
    let whereArr: any = {}
    let periodLabel = ''
    let startDate = ''
    let endDate = ''

    if (period === 'day') {
      whereExp = { date: activeDate }
      whereArr = { date: activeDate }
      periodLabel = activeDate
      startDate = activeDate
      endDate = activeDate
    } else if (period === 'week') {
      const end = new Date(activeDate + 'T12:00:00Z')
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
      startDate = start.toISOString().split('T')[0]
      endDate = end.toISOString().split('T')[0]
      whereExp = { date: { gte: startDate, lte: endDate } }
      whereArr = { date: { gte: startDate, lte: endDate } }
      periodLabel = `${startDate} — ${endDate} (7 kunlik)`
    } else if (period === 'month') {
      whereExp = { date: { startsWith: activeMonth } }
      whereArr = { date: { startsWith: activeMonth } }
      periodLabel = `${activeMonth} (Oylik)`
      startDate = `${activeMonth}-01`
      endDate = `${activeMonth}-31`
    } else if (period === 'year') {
      whereExp = { date: { startsWith: activeYear } }
      whereArr = { date: { startsWith: activeYear } }
      periodLabel = `${activeYear}-yil (Yillik)`
      startDate = `${activeYear}-01-01`
      endDate = `${activeYear}-12-31`
    }

    // 3. Query ShopExpenses and ShopArrivals for the calculated range
    const [expenses, arrivals] = await Promise.all([
      prisma.shopExpense.findMany({
        where: whereExp,
        orderBy: { date: 'desc' },
      }),
      prisma.shopArrival.findMany({
        where: whereArr,
        orderBy: { date: 'desc' },
      }),
    ])

    // 4. Aggregate finished products (outputs)
    const productMap = new Map<string, { product: string; total: number }>()
    const dailyOutputMap = new Map<string, number>()

    expenses.forEach((exp) => {
      const outputs = (exp.outputs as Record<string, any>) || {}
      let dayKg = 0
      Object.entries(outputs).forEach(([name, val]) => {
        const kg = typeof val === 'object' && val !== null ? val.kg || 0 : typeof val === 'number' ? val : 0
        if (!productMap.has(name)) {
          productMap.set(name, { product: name, total: 0 })
        }
        const cur = productMap.get(name)!
        cur.total += kg
        dayKg += kg
      })
      dailyOutputMap.set(exp.date, (dailyOutputMap.get(exp.date) || 0) + dayKg)
    })

    const productList = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        total: Math.round(p.total * 10) / 10,
      }))
      .sort((a, b) => b.total - a.total)

    const totalKg = Math.round(productList.reduce((sum, p) => sum + p.total, 0) * 10) / 10

    // 5. Aggregate arrivals
    const arrivalMap = new Map<string, { product: string; quantity: number; count: number; suppliers: Set<string>; batches: Set<string> }>()
    const dailyArrivalMap = new Map<string, number>()

    arrivals.forEach((a) => {
      const nom = (a.nomenclature || 'Xomashyo').trim()
      const qty = a.quantity || 0
      if (!arrivalMap.has(nom)) {
        arrivalMap.set(nom, {
          product: nom,
          quantity: 0,
          count: 0,
          suppliers: new Set(),
          batches: new Set(),
        })
      }
      const item = arrivalMap.get(nom)!
      item.quantity += qty
      item.count += 1
      if (a.supplier) item.suppliers.add(a.supplier.trim())
      if (a.batch) item.batches.add(a.batch.trim())
      dailyArrivalMap.set(a.date, (dailyArrivalMap.get(a.date) || 0) + qty)
    })

    const aggregatedArrivals = Array.from(arrivalMap.values())
      .map((a) => ({
        product: a.product,
        quantity: Math.round(a.quantity * 10) / 10,
        count: a.count,
        suppliers: Array.from(a.suppliers).join(', ') || '-',
        batches: Array.from(a.batches).slice(0, 3).join(', ') || '-',
      }))
      .sort((a, b) => b.quantity - a.quantity)

    const totalArrivalsKg = Math.round(aggregatedArrivals.reduce((sum, a) => sum + a.quantity, 0) * 10) / 10

    // Individual arrivals list (for day view or detail modal)
    const arrivalsList = arrivals.map((a) => ({
      id: a.id,
      date: a.date,
      product: a.nomenclature,
      quantity: a.quantity || 0,
      supplier: a.supplier || "Noma'lum",
      batch: a.batch || '-',
    }))

    // Build timeline / trend for charts
    const allDatesInPeriod = Array.from(new Set([...dailyOutputMap.keys(), ...dailyArrivalMap.keys()])).sort()
    const timeline = allDatesInPeriod.map((dt) => ({
      date: dt,
      outputKg: Math.round((dailyOutputMap.get(dt) || 0) * 10) / 10,
      arrivalKg: Math.round((dailyArrivalMap.get(dt) || 0) * 10) / 10,
    }))

    return NextResponse.json({
      period,
      periodLabel,
      startDate,
      endDate,
      activeDate,
      activeMonth,
      activeYear,
      availableDates,
      availableMonths,
      availableYears,
      operationalDaysCount: expenses.length,
      products: productList,
      totalKg,
      arrivals: period === 'day' ? arrivalsList : aggregatedArrivals,
      individualArrivals: arrivalsList.slice(0, 100),
      totalArrivalsKg,
      timeline,
    })
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 })
  }
}

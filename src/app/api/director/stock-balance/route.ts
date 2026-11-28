import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import dailyStockData from '@/data/dailyStockLedger.json'
import { matchSyrye12Key } from '@/lib/shopReport'

interface StockItem {
  name: string
  unit: string
  price: number
  startStock: number
  inflow: number | null
  outflow: number | null
  kitchenTransfer: number | null
  endStock: number
  weeklyAvg: number
  weeksRemaining: number | string
  sum: number
  isHighlight?: boolean
  isConsumable?: boolean
}

interface TableData {
  id: string
  type: 'daily' | 'weekly'
  title: string
  dayRu?: string
  dayUz?: string
  isoDate?: string
  startDate?: string
  endDate?: string
  sheetName: string
  items: StockItem[]
  vegetableCount: number
  totalVegetables: StockItem | null
  boxes: StockItem | null
  hypochlorite: StockItem | null
  grandTotalSum: number
  notes: string[]
  isLiveDb?: boolean
}

const PRODUCT_DEFS = [
  { key: 'iceberg', name: 'Айсберг', unit: 'кг', fallbackPrice: 17222.99 },
  { key: 'tomato', name: 'Помидоры', unit: 'кг', fallbackPrice: 27828.15 },
  { key: 'onion', name: 'Лук', unit: 'кг', fallbackPrice: 9500.0 },
  { key: 'cucumber', name: 'Огурцы', unit: 'кг', fallbackPrice: 24000.0 },
  { key: 'lemon', name: 'Лимоны', unit: 'кг', fallbackPrice: 36500.0 },
  { key: 'celery', name: 'Сельдерей', unit: 'кг', fallbackPrice: 50000.0 },
  { key: 'rukkola', name: 'Руккола', unit: 'кг', fallbackPrice: 50000.0 },
  { key: 'lolloRosso', name: 'Лолло Россо', unit: 'кг', fallbackPrice: 57872.08 },
  { key: 'spinach', name: 'Шпинат', unit: 'кг', fallbackPrice: 50000.0 },
  { key: 'mint', name: 'Мята', unit: 'кг', fallbackPrice: 59512.2 },
  { key: 'cabbage', name: 'Капуста белокачанная', unit: 'кг', fallbackPrice: 5000.0 },
  { key: 'carrot', name: 'Морковь красная', unit: 'кг', fallbackPrice: 11700.0 },
]

const DAY_NAMES: Record<number, { uz: string; ru: string }> = {
  0: { uz: 'Yakshanba', ru: 'воскресенье' },
  1: { uz: 'Dushanba', ru: 'понедельник' },
  2: { uz: 'Seshanba', ru: 'вторник' },
  3: { uz: 'Chorshanba', ru: 'среда' },
  4: { uz: 'Payshanba', ru: 'четверг' },
  5: { uz: 'Juma', ru: 'пятница' },
  6: { uz: 'Shanba', ru: 'суббота' },
}

const MONTH_NAMES_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
]

// Dynamic table builder from PostgreSQL DB records for a single day
async function buildLiveTableFromDb(date: string): Promise<TableData | null> {
  const expense = await prisma.shopExpense.findUnique({ where: { date } })
  const arrivals = await prisma.shopArrival.findMany({ where: { date } })

  if (!expense && arrivals.length === 0) {
    return null
  }

  // Determine day and sheet name
  const d = new Date(date + 'T12:00:00Z')
  const dayOfWeek = isNaN(d.getDay()) ? 1 : d.getDay()
  const monthIdx = isNaN(d.getMonth()) ? 10 : d.getMonth()
  const yearNum = isNaN(d.getFullYear()) ? 2026 : d.getFullYear()
  const dayInfo = DAY_NAMES[dayOfWeek] || { uz: 'Dushanba', ru: 'понедельник' }
  const sheetName = `${MONTH_NAMES_RU[monthIdx]} ${yearNum}`
  const [yyyy, mm, dd] = date.split('-')
  const title = `на ${dd}.${mm}.${yyyy}`

  // Parse DB balance structures
  const b = ((expense?.balances || {}) as any)
  const startMap = b.start || b.report?.balances?.start || {}
  const endMap = b.end || b.report?.balances?.end || {}
  const expMap = b.expense || b.report?.balances?.expense || {}
  const materials = (expense?.materials || {}) as Record<string, any>
  const kitchenMap = b.kitchen || {}
  const consumables = b.consumables || {}

  // Aggregate arrivals by canonical key
  const arrMap: Record<string, number> = {}
  for (const a of arrivals) {
    const k = matchSyrye12Key(a.nomenclature) || a.nomenclature
    arrMap[k] = (arrMap[k] || 0) + Number(a.quantity || 0)
  }

  // Calculate 28-day rolling average consumption from DB for weeklyAvg
  const past28Days = new Date(d.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const recentExpenses = await prisma.shopExpense.findMany({
    where: { date: { gte: past28Days, lte: date } },
    select: { balances: true, materials: true }
  })

  const rollingExpenseSum: Record<string, number> = {}
  for (const rec of recentExpenses) {
    const rb = (rec.balances || {}) as any
    const rExp = rb.expense || rb.report?.balances?.expense || {}
    for (const p of PRODUCT_DEFS) {
      rollingExpenseSum[p.key] = (rollingExpenseSum[p.key] || 0) + Number(rExp[p.key] || 0)
    }
  }

  // Baseline table prices and notes fallback (if historical day matches)
  const baselineTable = (dailyStockData.tables as any[]).find(t => t.id === date || t.isoDate === date)
  const baselineItemMap: Record<string, any> = {}
  if (baselineTable?.items) {
    baselineTable.items.forEach((it: any) => {
      baselineItemMap[it.name] = it
    })
  }

  // Build items for all 12 core vegetables
  const items: StockItem[] = PRODUCT_DEFS.map((p) => {
    const baseline = baselineItemMap[p.name]
    const price = baseline?.price && baseline.price > 0 ? baseline.price : p.fallbackPrice

    const startStock = startMap[p.key] !== undefined && startMap[p.key] !== null
      ? Math.round(Number(startMap[p.key]) * 100) / 100
      : (baseline?.startStock || 0)

    const inflow = arrMap[p.key]
      ? Math.round(arrMap[p.key] * 100) / 100
      : (baseline?.inflow || null)

    let outflow = expMap[p.key] !== undefined && expMap[p.key] !== null
      ? Math.round(Number(expMap[p.key]) * 100) / 100
      : null
    if (outflow === null && materials[p.name] !== undefined) {
      outflow = Math.round(Number(materials[p.name]) * 100) / 100
    }
    if (outflow === null && baseline?.outflow) {
      outflow = baseline.outflow
    }

    const kitchenTransfer = kitchenMap[p.key] !== undefined && kitchenMap[p.key] !== null
      ? Math.round(Number(kitchenMap[p.key]) * 100) / 100
      : (baseline?.kitchenTransfer || null)

    let endStock = endMap[p.key] !== undefined && endMap[p.key] !== null
      ? Math.round(Number(endMap[p.key]) * 100) / 100
      : (startStock + (inflow || 0) - (outflow || 0) - (kitchenTransfer || 0))

    endStock = Math.max(0, Math.round(endStock * 100) / 100)

    // Weekly average
    const recentSum = rollingExpenseSum[p.key] || 0
    let weeklyAvg = recentSum > 0 ? Math.round((recentSum / 4) * 10) / 10 : (baseline?.weeklyAvg || 0)
    if (weeklyAvg === 0 && outflow && outflow > 0) {
      weeklyAvg = Math.round(outflow * 7 * 10) / 10
    }

    // Weeks remaining
    let weeksRemaining: number | string = '-'
    if (weeklyAvg > 0 && endStock > 0) {
      weeksRemaining = Math.round((endStock / weeklyAvg) * 100) / 100
    }

    const sum = Math.round(endStock * price * 100) / 100

    return {
      name: p.name,
      unit: p.unit,
      price,
      startStock,
      inflow,
      outflow,
      kitchenTransfer,
      endStock,
      weeklyAvg,
      weeksRemaining,
      sum,
      isHighlight: false,
      isConsumable: false,
    }
  })

  // Total for vegetables (Всего)
  let totalStart = 0
  let totalInflow = 0
  let totalOutflow = 0
  let totalKitchen = 0
  let totalEnd = 0
  let totalWeeklyAvg = 0
  let totalSum = 0

  items.forEach(it => {
    totalStart += it.startStock
    totalInflow += it.inflow || 0
    totalOutflow += it.outflow || 0
    totalKitchen += it.kitchenTransfer || 0
    totalEnd += it.endStock
    totalWeeklyAvg += it.weeklyAvg
    totalSum += it.sum
  })

  const totalVegetables: StockItem = {
    name: 'Всего',
    unit: 'кг',
    price: Math.round(items.reduce((acc, it) => acc + it.price, 0)),
    startStock: Math.round(totalStart * 100) / 100,
    inflow: totalInflow > 0 ? Math.round(totalInflow * 100) / 100 : null,
    outflow: totalOutflow > 0 ? Math.round(totalOutflow * 100) / 100 : null,
    kitchenTransfer: totalKitchen > 0 ? Math.round(totalKitchen * 100) / 100 : null,
    endStock: Math.round(totalEnd * 100) / 100,
    weeklyAvg: Math.round(totalWeeklyAvg * 10) / 10,
    weeksRemaining: totalWeeklyAvg > 0 ? Math.round((totalEnd / totalWeeklyAvg) * 100) / 100 : '-',
    sum: Math.round(totalSum * 100) / 100,
    isHighlight: true,
  }

  // Consumables: Boxes (Коробка)
  const boxBaseline = baselineTable?.boxes
  const boxOutflow = Number(materials['Коробка'] || materials['Коробки'] || materials['КОРОБКИ'] || boxBaseline?.outflow || 0)
  const boxEndStock = consumables.box !== undefined ? Number(consumables.box) : (boxBaseline?.endStock || 14000)
  const boxStartStock = boxEndStock + boxOutflow
  const boxPrice = boxBaseline?.price || 5000
  const boxWeeklyAvg = boxBaseline?.weeklyAvg || (boxOutflow > 0 ? boxOutflow * 6 : 2340)
  const boxWeeks = boxWeeklyAvg > 0 ? Math.round((boxEndStock / boxWeeklyAvg) * 100) / 100 : '-'

  const boxes: StockItem = {
    name: 'Коробка',
    unit: 'шт',
    price: boxPrice,
    startStock: Math.round(boxStartStock),
    inflow: boxBaseline?.inflow || null,
    outflow: boxOutflow > 0 ? Math.round(boxOutflow) : null,
    kitchenTransfer: null,
    endStock: Math.round(boxEndStock),
    weeklyAvg: boxWeeklyAvg,
    weeksRemaining: boxWeeks,
    sum: Math.round(boxEndStock * boxPrice),
    isConsumable: true,
  }

  // Consumables: Hypochlorite (Гипохлорид)
  const hypBaseline = baselineTable?.hypochlorite
  const hypOutflow = Number(materials['Гипохлорид'] || materials['Хлор'] || materials['ХЛОР'] || hypBaseline?.outflow || 0)
  const hypEndStock = consumables.chlorine !== undefined ? Number(consumables.chlorine) : (hypBaseline?.endStock || 900)
  const hypStartStock = hypEndStock + hypOutflow
  const hypPrice = hypBaseline?.price || 7000
  const hypWeeklyAvg = hypBaseline?.weeklyAvg || (hypOutflow > 0 ? hypOutflow * 6 : 131)
  const hypWeeks = hypWeeklyAvg > 0 ? Math.round((hypEndStock / hypWeeklyAvg) * 100) / 100 : '-'

  const hypochlorite: StockItem = {
    name: 'Гипохлорид',
    unit: 'кг',
    price: hypPrice,
    startStock: Math.round(hypStartStock * 100) / 100,
    inflow: hypBaseline?.inflow || null,
    outflow: hypOutflow > 0 ? Math.round(hypOutflow * 100) / 100 : null,
    kitchenTransfer: null,
    endStock: Math.round(hypEndStock * 100) / 100,
    weeklyAvg: hypWeeklyAvg,
    weeksRemaining: hypWeeks,
    sum: Math.round(hypEndStock * hypPrice),
    isConsumable: true,
  }

  const grandTotalSum = Math.round((totalSum + boxes.sum + hypochlorite.sum) * 100) / 100

  return {
    id: date,
    type: 'daily',
    title,
    dayRu: dayInfo.ru,
    dayUz: dayInfo.uz,
    isoDate: date,
    startDate: date,
    endDate: date,
    sheetName,
    items,
    vegetableCount: items.length,
    totalVegetables,
    boxes,
    hypochlorite,
    grandTotalSum,
    notes: baselineTable?.notes || [],
    isLiveDb: true,
  }
}

// Dynamic range table builder from PostgreSQL DB records for weekly / monthly / yearly / custom ranges
async function buildPeriodTableFromDb(
  startDate: string,
  endDate: string,
  periodType: string = 'weekly'
): Promise<TableData | null> {
  const [expenses, arrivals, pastExpenses] = await Promise.all([
    prisma.shopExpense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' }
    }),
    prisma.shopArrival.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' }
    }),
    prisma.shopExpense.findMany({
      where: {
        date: {
          gte: new Date(new Date(endDate + 'T12:00:00Z').getTime() - 28 * 86400000).toISOString().split('T')[0],
          lte: endDate
        }
      },
      select: { balances: true, materials: true }
    })
  ])

  if (expenses.length === 0 && arrivals.length === 0) {
    const baseline = (dailyStockData.tables as TableData[]).find(t => t.id === `${startDate}_${endDate}` || t.id.startsWith(startDate))
    return baseline || null
  }

  // Calculate 28-day rolling average consumption
  const rollingExpenseSum: Record<string, number> = {}
  for (const rec of pastExpenses) {
    const rb = ((rec.balances || {}) as any)
    const rExp = rb.expense || rb.report?.balances?.expense || {}
    for (const p of PRODUCT_DEFS) {
      rollingExpenseSum[p.key] = (rollingExpenseSum[p.key] || 0) + Number(rExp[p.key] || 0)
    }
  }

  // Aggregate arrivals in range
  const arrMap: Record<string, number> = {}
  for (const a of arrivals) {
    const k = matchSyrye12Key(a.nomenclature) || a.nomenclature
    arrMap[k] = (arrMap[k] || 0) + Number(a.quantity || 0)
  }

  // Aggregate expenses and kitchen transfers in range
  const expMap: Record<string, number> = {}
  const kitchenMap: Record<string, number> = {}
  let boxOutflowTotal = 0
  let hypOutflowTotal = 0

  for (const e of expenses) {
    const b = ((e.balances || {}) as any)
    const eExp = b.expense || b.report?.balances?.expense || {}
    const eKit = b.kitchen || {}
    const mats = (e.materials || {}) as Record<string, any>

    for (const p of PRODUCT_DEFS) {
      let val = Number(eExp[p.key] || 0)
      if (!val && mats[p.name]) val = Number(mats[p.name])
      expMap[p.key] = (expMap[p.key] || 0) + val
      kitchenMap[p.key] = (kitchenMap[p.key] || 0) + Number(eKit[p.key] || 0)
    }

    boxOutflowTotal += Number(mats['Коробка'] || mats['Коробки'] || mats['КОРОБКИ'] || 0)
    hypOutflowTotal += Number(mats['Гипохлорид'] || mats['Хлор'] || mats['ХЛОР'] || 0)
  }

  // Start balances from first day in range (or baseline table)
  const firstExpense = expenses[0]
  const lastExpense = expenses[expenses.length - 1]
  const firstB = ((firstExpense?.balances || {}) as any)
  const startMap = firstB.start || firstB.report?.balances?.start || {}

  // End balances from last day in range
  const lastB = ((lastExpense?.balances || {}) as any)
  const endMap = lastB.end || lastB.report?.balances?.end || {}
  const lastConsumables = lastB.consumables || {}

  // Baseline table fallbacks for prices
  const baselineTable = (dailyStockData.tables as any[]).find(t => t.id === `${startDate}_${endDate}`)
    || (dailyStockData.tables as any[]).find(t => t.isoDate === endDate)
    || (dailyStockData.tables as any[]).find(t => t.id === '2026-11-25')

  const baselineItemMap: Record<string, any> = {}
  if (baselineTable?.items) {
    baselineTable.items.forEach((it: any) => { baselineItemMap[it.name] = it })
  }

  // Build items for all 12 core vegetables
  const items: StockItem[] = PRODUCT_DEFS.map((p) => {
    const baseline = baselineItemMap[p.name]
    const price = baseline?.price && baseline.price > 0 ? baseline.price : p.fallbackPrice

    const startStock = startMap[p.key] !== undefined && startMap[p.key] !== null
      ? Math.round(Number(startMap[p.key]) * 100) / 100
      : (baseline?.startStock || 0)

    const inflow = arrMap[p.key] ? Math.round(arrMap[p.key] * 100) / 100 : (baseline?.inflow || null)
    const outflow = expMap[p.key] ? Math.round(expMap[p.key] * 100) / 100 : (baseline?.outflow || null)
    const kitchenTransfer = kitchenMap[p.key] ? Math.round(kitchenMap[p.key] * 100) / 100 : (baseline?.kitchenTransfer || null)

    let endStock = endMap[p.key] !== undefined && endMap[p.key] !== null
      ? Math.round(Number(endMap[p.key]) * 100) / 100
      : (startStock + (inflow || 0) - (outflow || 0) - (kitchenTransfer || 0))

    endStock = Math.max(0, Math.round(endStock * 100) / 100)

    const recentSum = rollingExpenseSum[p.key] || 0
    let weeklyAvg = recentSum > 0 ? Math.round((recentSum / 4) * 10) / 10 : (baseline?.weeklyAvg || 0)
    if (weeklyAvg === 0 && outflow && outflow > 0) {
      weeklyAvg = Math.round((outflow / Math.max(1, expenses.length)) * 6 * 10) / 10
    }

    let weeksRemaining: number | string = '-'
    if (weeklyAvg > 0 && endStock > 0) {
      weeksRemaining = Math.round((endStock / weeklyAvg) * 100) / 100
    }

    const sum = Math.round(endStock * price * 100) / 100

    return {
      name: p.name,
      unit: p.unit,
      price,
      startStock,
      inflow,
      outflow,
      kitchenTransfer,
      endStock,
      weeklyAvg,
      weeksRemaining,
      sum,
      isHighlight: false,
      isConsumable: false,
    }
  })

  // Total for vegetables (Всего)
  let totalStart = 0
  let totalInflow = 0
  let totalOutflow = 0
  let totalKitchen = 0
  let totalEnd = 0
  let totalWeeklyAvg = 0
  let totalSum = 0

  items.forEach(it => {
    totalStart += it.startStock
    totalInflow += it.inflow || 0
    totalOutflow += it.outflow || 0
    totalKitchen += it.kitchenTransfer || 0
    totalEnd += it.endStock
    totalWeeklyAvg += it.weeklyAvg
    totalSum += it.sum
  })

  const totalVegetables: StockItem = {
    name: 'Всего',
    unit: 'кг',
    price: Math.round(items.reduce((acc, it) => acc + it.price, 0)),
    startStock: Math.round(totalStart * 100) / 100,
    inflow: totalInflow > 0 ? Math.round(totalInflow * 100) / 100 : null,
    outflow: totalOutflow > 0 ? Math.round(totalOutflow * 100) / 100 : null,
    kitchenTransfer: totalKitchen > 0 ? Math.round(totalKitchen * 100) / 100 : null,
    endStock: Math.round(totalEnd * 100) / 100,
    weeklyAvg: Math.round(totalWeeklyAvg * 10) / 10,
    weeksRemaining: totalWeeklyAvg > 0 ? Math.round((totalEnd / totalWeeklyAvg) * 100) / 100 : '-',
    sum: Math.round(totalSum * 100) / 100,
    isHighlight: true,
  }

  // Consumables: Boxes (Коробка)
  const boxBaseline = baselineTable?.boxes
  const boxEndStock = lastConsumables.box !== undefined ? Number(lastConsumables.box) : (boxBaseline?.endStock || 14000)
  const boxStartStock = boxEndStock + boxOutflowTotal
  const boxPrice = boxBaseline?.price || 5000
  const boxWeeklyAvg = boxBaseline?.weeklyAvg || 2340
  const boxWeeks = boxWeeklyAvg > 0 ? Math.round((boxEndStock / boxWeeklyAvg) * 100) / 100 : '-'

  const boxes: StockItem = {
    name: 'Коробка',
    unit: 'шт',
    price: boxPrice,
    startStock: Math.round(boxStartStock),
    inflow: boxBaseline?.inflow || null,
    outflow: boxOutflowTotal > 0 ? Math.round(boxOutflowTotal) : null,
    kitchenTransfer: null,
    endStock: Math.round(boxEndStock),
    weeklyAvg: boxWeeklyAvg,
    weeksRemaining: boxWeeks,
    sum: Math.round(boxEndStock * boxPrice),
    isConsumable: true,
  }

  // Consumables: Hypochlorite (Гипохлорид)
  const hypBaseline = baselineTable?.hypochlorite
  const hypEndStock = lastConsumables.chlorine !== undefined ? Number(lastConsumables.chlorine) : (hypBaseline?.endStock || 900)
  const hypStartStock = hypEndStock + hypOutflowTotal
  const hypPrice = hypBaseline?.price || 7000
  const hypWeeklyAvg = hypBaseline?.weeklyAvg || 131
  const hypWeeks = hypWeeklyAvg > 0 ? Math.round((hypEndStock / hypWeeklyAvg) * 100) / 100 : '-'

  const hypochlorite: StockItem = {
    name: 'Гипохлорид',
    unit: 'кг',
    price: hypPrice,
    startStock: Math.round(hypStartStock * 100) / 100,
    inflow: hypBaseline?.inflow || null,
    outflow: hypOutflowTotal > 0 ? Math.round(hypOutflowTotal * 100) / 100 : null,
    kitchenTransfer: null,
    endStock: Math.round(hypEndStock * 100) / 100,
    weeklyAvg: hypWeeklyAvg,
    weeksRemaining: hypWeeks,
    sum: Math.round(hypEndStock * hypPrice),
    isConsumable: true,
  }

  const grandTotalSum = Math.round((totalSum + boxes.sum + hypochlorite.sum) * 100) / 100

  // Date formatting for title
  const [sY, sM, sD] = startDate.split('-')
  const [eY, eM, eD] = endDate.split('-')
  const monthIdx = parseInt(eM, 10) - 1
  const sheetName = `${MONTH_NAMES_RU[monthIdx]} ${eY}`

  return {
    id: `${startDate}_${endDate}`,
    type: 'weekly',
    title: `${sD}.${sM}.${sY} - ${eD}.${eM}.${eY}`,
    startDate,
    endDate,
    isoDate: `${startDate}_${endDate}`,
    sheetName,
    items,
    vegetableCount: items.length,
    totalVegetables,
    boxes,
    hypochlorite,
    grandTotalSum,
    notes: baselineTable?.notes || [],
    isLiveDb: true,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // e.g. 2026-11-28, 2026-11-23_2026-11-28, 2026-11-01_2026-11-30, all_2026-11-28
    const periodParam = searchParams.get('period') // today, week, month, year, all, custom
    const startParam = searchParams.get('startDate')
    const endParam = searchParams.get('endDate')

    const baseTables = dailyStockData.tables as TableData[]
    const baseAvailableDates = [...(dailyStockData.availableDates as any[])]

    // 1. Discover recent active dates in PostgreSQL DB
    const [recentExpenses, recentArrivalDates] = await Promise.all([
      prisma.shopExpense.findMany({
        select: { date: true, updatedAt: true },
        orderBy: { date: 'desc' },
        take: 60,
      }),
      prisma.shopArrival.findMany({
        select: { date: true },
        distinct: ['date'],
        orderBy: { date: 'desc' },
        take: 60,
      }),
    ])

    const dbDatesSet = new Set<string>()
    recentExpenses.forEach(e => dbDatesSet.add(e.date))
    recentArrivalDates.forEach(a => dbDatesSet.add(a.date))

    // Prepend any new DB dates that aren't already in availableDates
    const existingIds = new Set(baseAvailableDates.map(d => d.id))
    const newDbDates = Array.from(dbDatesSet)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort((a, b) => b.localeCompare(a))

    for (const dStr of newDbDates) {
      if (!existingIds.has(dStr)) {
        const d = new Date(dStr + 'T12:00:00Z')
        const dayOfWeek = isNaN(d.getDay()) ? 1 : d.getDay()
        const monthIdx = isNaN(d.getMonth()) ? 10 : d.getMonth()
        const yearNum = isNaN(d.getFullYear()) ? 2026 : d.getFullYear()
        const dayInfo = DAY_NAMES[dayOfWeek] || { uz: 'Dushanba', ru: 'понедельник' }
        const [yyyy, mm, dd] = dStr.split('-')

        baseAvailableDates.unshift({
          id: dStr,
          type: 'daily',
          title: `на ${dd}.${mm}.${yyyy}`,
          dayUz: dayInfo.uz,
          dayRu: dayInfo.ru,
          isoDate: dStr,
          sheetName: `${MONTH_NAMES_RU[monthIdx]} ${yearNum}`,
          grandTotalSum: 0,
          isLiveDb: true,
        })
        existingIds.add(dStr)
      } else {
        const found = baseAvailableDates.find(d => d.id === dStr)
        if (found) found.isLiveDb = true
      }
    }

    const latestActiveDate = newDbDates[0] || '2026-11-28'
    let targetDate = dateParam || ''

    // If today is requested, resolve to latest active DB date
    if (periodParam === 'today' || targetDate === 'today' || !targetDate) {
      targetDate = latestActiveDate
    }

    let selectedTable: TableData | null = null

    // 2. CHECK RANGE QUERIES (week, month, year, all, custom)
    let rangeStart: string | null = null
    let rangeEnd: string | null = null

    if (targetDate.startsWith('all_') || periodParam === 'all' || targetDate === 'all') {
      rangeStart = '2025-08-30'
      rangeEnd = latestActiveDate
    } else if (targetDate.includes('_')) {
      const parts = targetDate.split('_')
      rangeStart = parts[0]
      rangeEnd = parts[1]
    } else if (periodParam === 'custom' && startParam && endParam) {
      rangeStart = startParam
      rangeEnd = endParam
    } else if (periodParam === 'year' && targetDate.length === 4) {
      rangeStart = `${targetDate}-01-01`
      rangeEnd = `${targetDate}-12-31`
    }

    if (rangeStart && rangeEnd) {
      try {
        selectedTable = await buildPeriodTableFromDb(rangeStart, rangeEnd, periodParam || 'weekly')
      } catch (err) {
        console.error(`Failed to build period table for ${rangeStart}_${rangeEnd}:`, err)
      }
    }

    // 3. SINGLE DATE QUERIES
    if (!selectedTable && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      if (dbDatesSet.has(targetDate)) {
        try {
          selectedTable = await buildLiveTableFromDb(targetDate)
        } catch (err) {
          console.error(`Failed to build live table for ${targetDate}:`, err)
        }
      }
    }

    // 4. FALLBACK TO BASELINE TABLE FROM dailyStockLedger.json
    if (!selectedTable) {
      selectedTable = baseTables.find(t => t.id === targetDate || t.isoDate === targetDate || t.title.includes(targetDate)) || null
    }

    // 5. ULTIMATE FALLBACK TO LATEST TABLE
    if (!selectedTable) {
      if (dbDatesSet.has(latestActiveDate)) {
        selectedTable = await buildLiveTableFromDb(latestActiveDate)
      }
      if (!selectedTable) {
        selectedTable = baseTables.find(t => t.id === '2026-11-25') || baseTables[baseTables.length - 1]
      }
    }

    // Update grandTotalSum in availableDates for targetDate if live
    if (selectedTable && selectedTable.isLiveDb) {
      const matchOpt = baseAvailableDates.find(d => d.id === selectedTable?.id)
      if (matchOpt) {
        matchOpt.grandTotalSum = selectedTable.grandTotalSum
      }
    }

    return NextResponse.json({
      success: true,
      currentTable: selectedTable,
      availableDates: baseAvailableDates,
      totalTables: baseAvailableDates.length,
      isLiveDb: Boolean(selectedTable?.isLiveDb),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in director stock-balance API:', error)
    return NextResponse.json({ success: false, error: 'Failed to load stock balance data' }, { status: 500 })
  }
}

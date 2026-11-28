import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const FALLBACK_PRICES: Record<string, number> = {
  'Айсберг': 17222.99,
  'Помидоры': 27828.15,
  'Лук': 9500.0,
  'Огурцы': 24000.0,
  'Лимоны': 36500.0,
  'Айсберг (листовой)': 17222.99,
  'Сельдерей': 50000.0,
  'Руккола': 50000.0,
  'Лолло Россо': 57872.08,
  'Шпинат': 50000.0,
  'Мята': 59512.2,
  'Капуста белокачанная': 5000.0,
  'Морковь красная': 11700.0,
  'Шампиньоны': 45000.0,
  'Перец Калифорния': 35000.0,
  'Коробка': 5000.0,
  'Гипохлорид': 7000.0,
}

function matchToStandardProduct(name: string): string | null {
  if (!name) return null
  const n = name.trim().toLowerCase()
  if (n.includes('листов') && n.includes('айсберг')) return 'Айсберг (листовой)'
  if (n.includes('айсберг')) return 'Айсберг'
  if (n.includes('томат') || n.includes('помидор')) return 'Помидоры'
  if (n.includes('лук')) return 'Лук'
  if (n.includes('огур')) return 'Огурцы'
  if (n.includes('лимон')) return 'Лимоны'
  if (n.includes('сельдерей')) return 'Сельдерей'
  if (n.includes('руккола') || n.includes('руккала')) return 'Руккола'
  if (n.includes('лолло') || n.includes('rosso')) return 'Лолло Россо'
  if (n.includes('шпинат')) return 'Шпинат'
  if (n.includes('мята')) return 'Мята'
  if (n.includes('капуст')) return 'Капуста белокачанная'
  if (n.includes('морков')) return 'Морковь красная'
  if (n.includes('шампиньон')) return 'Шампиньоны'
  if (n.includes('перец')) return 'Перец Калифорния'
  if (n.includes('коробк')) return 'Коробка'
  if (n.includes('хлор') || n.includes('гипохлорид')) return 'Гипохлорид'
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')

// Format Date to DD.MM.YYYY
const formatDMY = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`

// Format Date to YYYY-MM-DD
const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Director or Admin only
    const allowedRoles = ['DIRECTOR', 'ADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dataFilePath = path.join(process.cwd(), 'src/data/directorDynamics.json')
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'Dynamics data not found' }, { status: 404 })
    }

    const rawData = fs.readFileSync(dataFilePath, 'utf8')
    const parsed = JSON.parse(rawData)

    // Ensure weekly structure exists
    if (!parsed.weekly) {
      parsed.weekly = {
        periods: [],
        expenseKg: [],
        expenseSum: [],
        gpKg: [],
        wastePercent: [],
        notes: [],
      }
    }

    // Fetch all ShopExpense records from DB (especially recent ones)
    const allExpenses = await prisma.shopExpense.findMany({
      orderBy: { date: 'asc' },
      select: { date: true, materials: true, outputs: true, balances: true }
    })

    // 1. DYNAMIC WEEKLY AGGREGATION & EXPANSION
    // Baseline weeks end at 2026-11-21. Discover all weeks in DB past 2026-11-21
    const postBaselineExpenses = allExpenses.filter(e => e.date > '2026-11-21')

    if (postBaselineExpenses.length > 0) {
      // Group post-baseline expenses into Monday-to-Saturday weeks
      const weekGroups: Record<string, { from: string; to: string; label: string; records: typeof postBaselineExpenses }> = {}

      for (const exp of postBaselineExpenses) {
        const d = new Date(exp.date + 'T12:00:00Z')
        const dayOfWeek = d.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Monday of this week
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(d)
        monday.setDate(d.getDate() + diffToMonday)
        const saturday = new Date(monday)
        saturday.setDate(monday.getDate() + 5)

        const fromStr = formatYMD(monday)
        const toStr = formatYMD(saturday)
        const weekKey = `${fromStr}_${toStr}`
        const weekLabel = `${formatDMY(monday)} - ${formatDMY(saturday)}`

        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = { from: fromStr, to: toStr, label: weekLabel, records: [] }
        }
        weekGroups[weekKey].records.push(exp)
      }

      // Sort discovered new weeks chronologically
      const sortedNewWeeks = Object.values(weekGroups).sort((a, b) => a.from.localeCompare(b.from))

      for (const nWeek of sortedNewWeeks) {
        // If not already in parsed.weekly.periods, add it
        const periodIdx = parsed.weekly.periods.findIndex((p: string) => p.includes(formatDMY(new Date(nWeek.from + 'T12:00:00Z'))) || p.includes(nWeek.from))
        const isNewPeriod = periodIdx === -1

        if (isNewPeriod) {
          parsed.weekly.periods.push(nWeek.label)
        }

        const targetPeriodIndex = isNewPeriod ? parsed.weekly.periods.length - 1 : periodIdx

        // Aggregate materials kg and outputs kg for this week
        const weekKgMap: Record<string, number> = {}
        const weekGgMap: Record<string, number> = {}

        for (const exp of nWeek.records) {
          const mats = (exp.materials || {}) as Record<string, any>
          for (const [mName, mQty] of Object.entries(mats)) {
            const std = matchToStandardProduct(mName)
            if (std) {
              weekKgMap[std] = (weekKgMap[std] || 0) + Number(mQty || 0)
            }
          }

          const outs = (exp.outputs || {}) as Record<string, any>
          for (const [oName, oVal] of Object.entries(outs)) {
            const std = matchToStandardProduct(oName)
            if (std) {
              let kg = 0
              if (typeof oVal === 'number') kg = oVal
              else if (oVal && typeof oVal === 'object') {
                kg = Number(oVal.kg || oVal.total || oVal.weight || oVal.quantity || 0)
              }
              weekGgMap[std] = (weekGgMap[std] || 0) + kg
            }
          }
        }

        // Update parsed.weekly.expenseKg
        let weekTotalVegKg = 0
        for (const p of parsed.weekly.expenseKg) {
          const isTotal = p.name === 'Всего'
          const isBox = p.name === 'Коробка'
          const isHyp = p.name === 'Гипохлорид'
          if (!isTotal) {
            const kg = Math.round((weekKgMap[p.name] || 0) * 100) / 100
            if (isNewPeriod) {
              p.weekly.push(kg)
            } else {
              p.weekly[targetPeriodIndex] = kg
            }
            if (!isBox && !isHyp) weekTotalVegKg += kg
            p.total = Math.round(p.weekly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
            p.weeklyAvg = Math.round((p.total / p.weekly.length) * 100) / 100
          }
        }

        const totalRowKg = parsed.weekly.expenseKg.find((p: any) => p.name === 'Всего')
        if (totalRowKg) {
          const roundedTotal = Math.round(weekTotalVegKg * 100) / 100
          if (isNewPeriod) totalRowKg.weekly.push(roundedTotal)
          else totalRowKg.weekly[targetPeriodIndex] = roundedTotal
          totalRowKg.total = Math.round(totalRowKg.weekly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
          totalRowKg.weeklyAvg = Math.round((totalRowKg.total / totalRowKg.weekly.length) * 100) / 100
        }

        // Update parsed.weekly.expenseSum
        let weekTotalVegSum = 0
        for (const p of parsed.weekly.expenseSum) {
          const isTotal = p.name === 'Всего'
          const isBox = p.name === 'Коробка'
          const isHyp = p.name === 'Гипохлорид'
          if (!isTotal) {
            const kg = weekKgMap[p.name] || 0
            const price = FALLBACK_PRICES[p.name] || 15000
            const sum = Math.round(kg * price)
            if (isNewPeriod) {
              p.weekly.push(sum)
            } else {
              p.weekly[targetPeriodIndex] = sum
            }
            if (!isBox && !isHyp) weekTotalVegSum += sum
            p.total = Math.round(p.weekly.reduce((a: number, b: number) => a + (b || 0), 0))
            p.weeklyAvg = Math.round(p.total / p.weekly.length)
          }
        }

        const totalRowSum = parsed.weekly.expenseSum.find((p: any) => p.name === 'Всего')
        if (totalRowSum) {
          if (isNewPeriod) totalRowSum.weekly.push(weekTotalVegSum)
          else totalRowSum.weekly[targetPeriodIndex] = weekTotalVegSum
          totalRowSum.total = Math.round(totalRowSum.weekly.reduce((a: number, b: number) => a + (b || 0), 0))
          totalRowSum.weeklyAvg = Math.round(totalRowSum.total / totalRowSum.weekly.length)
        }

        // Update parsed.weekly.gpKg
        let weekTotalGpKg = 0
        for (const p of parsed.weekly.gpKg) {
          const isTotal = p.name === 'Всего'
          if (!isTotal) {
            const kg = Math.round((weekGgMap[p.name] || 0) * 100) / 100
            if (isNewPeriod) p.weekly.push(kg)
            else p.weekly[targetPeriodIndex] = kg
            weekTotalGpKg += kg
            p.total = Math.round(p.weekly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
            p.weeklyAvg = Math.round((p.total / p.weekly.length) * 100) / 100
          }
        }

        const totalRowGp = parsed.weekly.gpKg.find((p: any) => p.name === 'Всего')
        if (totalRowGp) {
          const roundedGp = Math.round(weekTotalGpKg * 100) / 100
          if (isNewPeriod) totalRowGp.weekly.push(roundedGp)
          else totalRowGp.weekly[targetPeriodIndex] = roundedGp
          totalRowGp.total = Math.round(totalRowGp.weekly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
          totalRowGp.weeklyAvg = Math.round((totalRowGp.total / totalRowGp.weekly.length) * 100) / 100
        }

        // Update parsed.weekly.wastePercent
        for (const p of parsed.weekly.wastePercent) {
          const isTotal = p.name === 'Всего' || p.name.includes("o'rtacha")
          const inKg = weekKgMap[p.name] || 0
          const outKg = weekGgMap[p.name] || 0
          let pct = inKg > 0 ? Math.max(0, Math.min(100, Math.round((1 - outKg / inKg) * 1000) / 10)) : 0
          if (isTotal) {
            pct = weekTotalVegKg > 0 ? Math.max(0, Math.min(100, Math.round((1 - weekTotalGpKg / weekTotalVegKg) * 1000) / 10)) : 21.7
          }
          if (isNewPeriod) p.weekly.push(pct)
          else p.weekly[targetPeriodIndex] = pct
        }
      }
    }

    // 2. DYNAMIC MONTHLY AGGREGATION & EXPANSION
    // Aggregate by month for November (index 10) and subsequent months
    const novExpenses = allExpenses.filter(e => e.date.startsWith('2026-11'))
    if (novExpenses.length > 0) {
      const novKgMap: Record<string, number> = {}
      const novGgMap: Record<string, number> = {}

      for (const exp of novExpenses) {
        const mats = (exp.materials || {}) as Record<string, any>
        for (const [mName, mQty] of Object.entries(mats)) {
          const std = matchToStandardProduct(mName)
          if (std) novKgMap[std] = (novKgMap[std] || 0) + Number(mQty || 0)
        }
        const outs = (exp.outputs || {}) as Record<string, any>
        for (const [oName, oVal] of Object.entries(outs)) {
          const std = matchToStandardProduct(oName)
          if (std) {
            let kg = 0
            if (typeof oVal === 'number') kg = oVal
            else if (oVal && typeof oVal === 'object') {
              kg = Number(oVal.kg || oVal.total || oVal.weight || oVal.quantity || 0)
            }
            novGgMap[std] = (novGgMap[std] || 0) + kg
          }
        }
      }

      // Update expenseKg monthly[10]
      let novTotalVegKg = 0
      for (const p of parsed.expenseKg) {
        const isTotal = p.name === 'Всего'
        const isBox = p.name === 'Коробка'
        const isHyp = p.name === 'Гипохлорид'
        if (!isTotal) {
          const kg = Math.round((novKgMap[p.name] || 0) * 100) / 100
          if (Array.isArray(p.monthly)) {
            p.monthly[10] = kg
            p.total = Math.round(p.monthly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
          }
          if (!isBox && !isHyp) novTotalVegKg += kg
        }
      }

      const totalRowMonthKg = parsed.expenseKg.find((p: any) => p.name === 'Всего')
      if (totalRowMonthKg && Array.isArray(totalRowMonthKg.monthly)) {
        totalRowMonthKg.monthly[10] = Math.round(novTotalVegKg * 100) / 100
        totalRowMonthKg.total = Math.round(totalRowMonthKg.monthly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
      }

      // Update expenseSum monthly[10]
      let novTotalVegSum = 0
      for (const p of parsed.expenseSum) {
        const isTotal = p.name === 'Всего'
        const isBox = p.name === 'Коробка'
        const isHyp = p.name === 'Гипохлорид'
        if (!isTotal) {
          const kg = novKgMap[p.name] || 0
          const price = FALLBACK_PRICES[p.name] || 15000
          const sum = Math.round(kg * price)
          if (Array.isArray(p.monthly)) {
            p.monthly[10] = sum
            p.total = Math.round(p.monthly.reduce((a: number, b: number) => a + (b || 0), 0))
          }
          if (!isBox && !isHyp) novTotalVegSum += sum
        }
      }

      const totalRowMonthSum = parsed.expenseSum.find((p: any) => p.name === 'Всего')
      if (totalRowMonthSum && Array.isArray(totalRowMonthSum.monthly)) {
        totalRowMonthSum.monthly[10] = novTotalVegSum
        totalRowMonthSum.total = Math.round(totalRowMonthSum.monthly.reduce((a: number, b: number) => a + (b || 0), 0))
      }

      // Update gpKg monthly[10]
      let novTotalGpKg = 0
      for (const p of parsed.gpKg) {
        const isTotal = p.name === 'Всего'
        if (!isTotal) {
          const kg = Math.round((novGgMap[p.name] || 0) * 100) / 100
          if (Array.isArray(p.monthly)) {
            p.monthly[10] = kg
            p.total = Math.round(p.monthly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
          }
          novTotalGpKg += kg
        }
      }

      const totalRowMonthGp = parsed.gpKg.find((p: any) => p.name === 'Всего')
      if (totalRowMonthGp && Array.isArray(totalRowMonthGp.monthly)) {
        totalRowMonthGp.monthly[10] = Math.round(novTotalGpKg * 100) / 100
        totalRowMonthGp.total = Math.round(totalRowMonthGp.monthly.reduce((a: number, b: number) => a + (b || 0), 0) * 100) / 100
      }

      // Update wastePercent monthly[10]
      for (const p of parsed.wastePercent) {
        const isTotal = p.name === 'Всего' || p.name.includes("o'rtacha")
        const inKg = novKgMap[p.name] || 0
        const outKg = novGgMap[p.name] || 0
        let pct = inKg > 0 ? Math.max(0, Math.min(100, Math.round((1 - outKg / inKg) * 1000) / 10)) : 0
        if (isTotal) {
          pct = novTotalVegKg > 0 ? Math.max(0, Math.min(100, Math.round((1 - novTotalGpKg / novTotalVegKg) * 1000) / 10)) : 21.7
        }
        if (Array.isArray(p.monthly)) {
          p.monthly[10] = pct
        }
      }
    }

    // 3. EXECUTIVE KPIS RECALCULATION
    const totalRowSum = parsed.expenseSum.find((item: any) => item.name === 'Всего')
    const totalAllSum = parsed.expenseSum.find((item: any) => item.name.includes('Итого с упаковкой'))
    const totalSum = totalRowSum ? totalRowSum.total : 12249591585
    const totalWithConsumables = totalAllSum ? totalAllSum.total : 12727038315

    const totalRowKg = parsed.expenseKg.find((item: any) => item.name === 'Всего')
    const totalKg = totalRowKg ? totalRowKg.total : 624459.21

    const totalRowGp = parsed.gpKg.find((item: any) => item.name === 'Всего')
    const totalGpKg = totalRowGp ? totalRowGp.total : 489034.78

    const yieldEfficiency = totalKg > 0 ? Math.round((totalGpKg / totalKg) * 1000) / 10 : 78.3
    const avgWastePercent = Math.round((100 - yieldEfficiency) * 10) / 10

    const boxRow = parsed.expenseKg.find((item: any) => item.name.toLowerCase().includes('коробка'))
    const boxSumRow = parsed.expenseSum.find((item: any) => item.name.toLowerCase().includes('коробка'))

    const hypoRow = parsed.expenseKg.find((item: any) => item.name.toLowerCase().includes('гипохлорид'))
    const hypoSumRow = parsed.expenseSum.find((item: any) => item.name.toLowerCase().includes('гипохлорид'))

    const summary = {
      totalVegetableSum: totalSum,
      totalWithConsumables,
      totalVegetableKg: totalKg,
      totalFinishedGoodsKg: totalGpKg,
      yieldEfficiency,
      avgWastePercent,
      boxCount: boxRow ? boxRow.total : 83224,
      boxSum: boxSumRow ? boxSumRow.total : 444472040,
      hypoKg: hypoRow ? hypoRow.total : 5340.63,
      hypoSum: hypoSumRow ? hypoSumRow.total : 32974690,
      monthsCount: 11,
      notesCount: parsed.notes?.length || 11
    }

    return NextResponse.json({
      success: true,
      summary,
      months: parsed.months,
      expenseKg: parsed.expenseKg,
      expenseSum: parsed.expenseSum,
      gpKg: parsed.gpKg,
      wastePercent: parsed.wastePercent,
      notes: parsed.notes,
      weekly: parsed.weekly,
      weeklyPeriods: parsed.weekly?.periods || parsed.weeklyPeriods,
      weeklyExpenseKg: parsed.weekly?.expenseKg || parsed.weeklyExpenseKg,
    })
  } catch (error: any) {
    console.error('Error fetching director dynamics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

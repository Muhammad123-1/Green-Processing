import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { toNum } from '@/lib/shopReport'
import { resolveProductMeta, ProductMeta } from '@/lib/productTaxonomy'

// Fallback catalog costs (so'm/kg) based on validated enterprise standard purchase prices
const FALLBACK_PRICES: Record<string, number> = {
  prod_iceberg: 17500,
  prod_tomato: 26000,
  prod_onion: 13500,
  prod_carrot: 13000,
  prod_cabbage: 5000,
  prod_cucumber: 21000,
  prod_lemon: 33000,
  prod_celery: 25000,
  prod_rukkola: 30000,
  prod_lollo_rosso: 35000,
  prod_spinach: 25000,
  prod_mint: 40000,
  prod_salt: 3000,
  prod_vinegar: 12000,
  prod_hypochlorite: 5000,
}

export interface AbcProductItem {
  id: string
  canonicalId: string
  nameUz: string
  nameRu: string
  nameEn: string
  category: 'PRIMARY' | 'SECONDARY'
  unit: string
  consumedQty: number
  unitCost: number | null
  isCostEstimated: boolean
  consumptionValue: number
  percentageContribution: number
  cumulativeContribution: number
  abcCategory: 'A' | 'B' | 'C' | 'U'
  availableStock: number // Usable passed stock
  blockedStock: number // QC blocked / pending stock
  rejectedStock: number // Rejected incoming / defect stock
  currentStockValue: number
  safetyStock: number | null // minStockLevel
  maxStorageDays: number | null
  maxRecommendedStock: number | null
  avgWeeklyConsumption: number | null
  stockCoverageWeeks: number | null
  excessStockQty: number
  excessFinancialExposure: number
  isBelowSafetyStock: boolean
  isExcessStock: boolean
  isApproachingStorageLimit: boolean
  riskStatus: 'DEFICIT' | 'EXCESS' | 'EXPIRING' | 'OPTIMAL' | 'NO_DATA'
  actsCount: number
  recentActs: Array<{
    actNumber: string
    actDate: string
    supplierName: string
    warehouseKg: number
    pricePerKg: number | null
    decisionRating: number
    inspectorName: string
  }>
  batches: Array<{
    batchNumber: string
    quantity: number
    qcStatus: string
    expirationDate: string | null
    receivedAt: string | null
  }>
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'DIRECTOR', 'WAREHOUSE', 'ACCOUNTING', 'SUPPLY', 'QUALITY_CONTROL']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Ushbu bo\'lim faqat ombor va rahbariyat tahlili uchun' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const dateFrom = searchParams.get('from') || searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('to') || searchParams.get('dateTo') || ''
    const boundaryA = parseFloat(searchParams.get('boundaryA') || '80')
    const boundaryB = parseFloat(searchParams.get('boundaryB') || '95')

    // 1. Date Range Filtering
    const now = new Date()
    let startDate: string | undefined = dateFrom || undefined
    let endDate: string = dateTo || new Date().toISOString().slice(0, 10)

    const pad = (n: number) => String(n).padStart(2, '0')
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (!dateFrom) {
      if (period === 'today') {
        startDate = toYMD(now)
        endDate = toYMD(now)
      } else if (period === 'week') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = toYMD(d)
      } else if (period === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate = toYMD(d)
      } else if (period === 'year') {
        startDate = `${now.getFullYear()}-01-01`
      }
    }

    const expenseWhere: any = {}
    const arrivalWhere: any = {}
    const actWhere: any = {}

    if (startDate && endDate) {
      expenseWhere.date = { gte: startDate, lte: endDate }
      arrivalWhere.date = { gte: startDate, lte: endDate }
      actWhere.actDate = { gte: startDate, lte: endDate }
    } else if (startDate) {
      expenseWhere.date = { gte: startDate }
      arrivalWhere.date = { gte: startDate }
      actWhere.actDate = { gte: startDate }
    } else if (endDate) {
      expenseWhere.date = { lte: endDate }
      arrivalWhere.date = { lte: endDate }
      actWhere.actDate = { lte: endDate }
    }

    // 2. Parallel Database Fetch
    const [
      expenses,
      arrivals,
      incomingActs,
      allTimeActsWithPrice,
      products,
      inventoryBatches
    ] = await Promise.all([
      // Actual consumption logs
      prisma.shopExpense.findMany({
        where: expenseWhere,
        orderBy: { date: 'asc' },
        select: { date: true, materials: true, matrix: true, balances: true }
      }),
      // Inbound arrivals
      prisma.shopArrival.findMany({
        where: arrivalWhere,
        orderBy: { date: 'desc' },
        select: { date: true, nomenclature: true, quantity: true, finalDecision: true, batch: true, supplier: true }
      }),
      // Period reception acts with price and QC decision
      prisma.incomingRawMaterialAct.findMany({
        where: actWhere,
        orderBy: { actDate: 'desc' },
        select: {
          id: true,
          actNumber: true,
          actDate: true,
          productName: true,
          supplierName: true,
          warehouseKg: true,
          pricePerKg: true,
          decisionRating: true,
          decisionText: true,
          inspectorName: true,
          batchNumber: true
        }
      }),
      // All-time price references for weighted unit cost calculation
      prisma.incomingRawMaterialAct.findMany({
        where: { pricePerKg: { not: null, gt: 0 } },
        orderBy: { actDate: 'desc' },
        select: {
          productName: true,
          pricePerKg: true,
          warehouseKg: true,
          actDate: true
        }
      }),
      // Product catalog with safety stock and storage constraints
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          unit: true,
          minStockLevel: true,
          maxStorageDays: true,
          shelfLifeDays: true,
          maxRecommendedStock: true,
          category: true
        }
      }),
      // Inventory batches with QC status
      prisma.inventoryBatch.findMany({
        include: {
          product: { select: { id: true, name: true } }
        },
        orderBy: { receivedAt: 'desc' }
      })
    ])

    // 3. Build Cost Lookup per Canonical Product
    // We compute Volume-Weighted Average Cost (VWAC) = sum(qty * price) / sum(qty)
    const costAccumulator: Record<string, { totalCostSum: number; totalQty: number; latestPrice: number }> = {}

    allTimeActsWithPrice.forEach((act) => {
      const meta = resolveProductMeta(act.productName)
      const cId = meta.canonicalId
      const p = toNum(act.pricePerKg)
      const q = Math.max(1, toNum(act.warehouseKg))

      if (p > 0) {
        if (!costAccumulator[cId]) {
          costAccumulator[cId] = { totalCostSum: 0, totalQty: 0, latestPrice: p }
        }
        costAccumulator[cId].totalCostSum += p * q
        costAccumulator[cId].totalQty += q
      }
    })

    const unitCostMap = new Map<string, { cost: number; isEstimated: boolean }>()
    for (const [cId, acc] of Object.entries(costAccumulator)) {
      if (acc.totalQty > 0) {
        unitCostMap.set(cId, {
          cost: Math.round(acc.totalCostSum / acc.totalQty),
          isEstimated: false
        })
      }
    }

    // Fallback standard cost if no historical acts exist for this product
    for (const [cId, price] of Object.entries(FALLBACK_PRICES)) {
      if (!unitCostMap.has(cId)) {
        unitCostMap.set(cId, { cost: price, isEstimated: true })
      }
    }

    // 4. Product Catalog and Taxonomy Normalization
    const productConfigMap = new Map<string, (typeof products)[0]>()
    products.forEach((p) => {
      const meta = resolveProductMeta(p.name)
      productConfigMap.set(meta.canonicalId, p)
    })

    // Aggregated structure per canonical product
    interface TempProductAccumulator {
      meta: ProductMeta
      consumedQty: number
      inflowQty: number
      rejectedQty: number
      currentStockQty: number
      hasRecordedStock: boolean
      activeDays: Set<string>
      acts: Array<{
        actNumber: string
        actDate: string
        supplierName: string
        warehouseKg: number
        pricePerKg: number | null
        decisionRating: number
        inspectorName: string
      }>
      batches: Array<{
        batchNumber: string
        quantity: number
        qcStatus: string
        expirationDate: string | null
        receivedAt: string | null
      }>
    }

    const itemsMap = new Map<string, TempProductAccumulator>()

    const getOrInitItem = (rawName: string): TempProductAccumulator => {
      const meta = resolveProductMeta(rawName)
      const cId = meta.canonicalId

      if (!itemsMap.has(cId)) {
        itemsMap.set(cId, {
          meta,
          consumedQty: 0,
          inflowQty: 0,
          rejectedQty: 0,
          currentStockQty: 0,
          hasRecordedStock: false,
          activeDays: new Set<string>(),
          acts: [],
          batches: []
        })
      }
      return itemsMap.get(cId)!
    }

    // A. Actual Consumption from ShopExpense
    const operationalDatesSet = new Set<string>()

    expenses.forEach((e) => {
      let dayConsumed = false
      const materials = (e.materials || {}) as Record<string, any>

      for (const [rawMat, val] of Object.entries(materials)) {
        const qty = toNum(val)
        if (
          qty > 0 &&
          !rawMat.toLowerCase().includes('кухня') &&
          !rawMat.toLowerCase().includes('ошхона')
        ) {
          const item = getOrInitItem(rawMat)
          item.consumedQty += qty
          item.activeDays.add(e.date)
          dayConsumed = true
        }
      }

      // If materials was empty, fallback to matrix
      if (!dayConsumed && e.matrix && typeof e.matrix === 'object') {
        Object.values(e.matrix as Record<string, any>).forEach((row) => {
          if (row && typeof row === 'object') {
            Object.entries(row).forEach(([colKey, v]) => {
              const qty = toNum(v)
              if (qty > 0 && qty < 100000 && !colKey.toLowerCase().includes('col_')) {
                const item = getOrInitItem(colKey)
                item.consumedQty += qty
                item.activeDays.add(e.date)
                dayConsumed = true
              }
            })
          }
        })
      }

      // Recorded daily balances if present
      const balances = (e.balances || {}) as Record<string, any>
      const endBalances = balances?.report?.balances?.end || balances?.end || {}
      for (const [rawMat, val] of Object.entries(endBalances)) {
        const q = toNum(val)
        if (q >= 0) {
          const item = getOrInitItem(rawMat)
          item.currentStockQty = q
          item.hasRecordedStock = true
        }
      }

      if (dayConsumed) {
        operationalDatesSet.add(e.date)
      }
    })

    // B. Arrivals and Accepted Inbound
    arrivals.forEach((a) => {
      const qty = toNum(a.quantity)
      if (!a.nomenclature || qty <= 0) return
      const item = getOrInitItem(a.nomenclature)
      if (a.finalDecision && a.finalDecision.toLowerCase().includes('брак')) {
        item.rejectedQty += qty
      } else {
        item.inflowQty += qty
      }
    })

    // C. Incoming Raw Material Acts
    incomingActs.forEach((act) => {
      if (!act.productName) return
      const item = getOrInitItem(act.productName)
      const kg = toNum(act.warehouseKg)
      const isRejected = act.decisionRating === 2 || (act.decisionText || '').toLowerCase().includes('rad')

      if (isRejected && kg > 0) {
        item.rejectedQty += kg
      }

      if (item.acts.length < 15) {
        item.acts.push({
          actNumber: act.actNumber || `AKT-${act.id}`,
          actDate: act.actDate,
          supplierName: act.supplierName || 'Ta\'minotchi',
          warehouseKg: kg,
          pricePerKg: act.pricePerKg ? toNum(act.pricePerKg) : null,
          decisionRating: act.decisionRating,
          inspectorName: act.inspectorName || 'Sifat Nazoratchisi'
        })
      }
    })

    // D. Inventory Batches
    inventoryBatches.forEach((b) => {
      if (!b.product?.name) return
      const item = getOrInitItem(b.product.name)
      if (item.batches.length < 15) {
        item.batches.push({
          batchNumber: b.batchNumber,
          quantity: toNum(b.quantity),
          qcStatus: b.qcStatus || 'PASSED',
          expirationDate: b.expirationDate ? b.expirationDate.toISOString() : null,
          receivedAt: b.receivedAt ? b.receivedAt.toISOString() : null
        })
      }
    })

    // 5. ABC Calculations & Pareto Sorting
    const totalOperationalDays = Math.max(1, operationalDatesSet.size)

    interface ComputedRawItem {
      meta: ProductMeta
      consumedQty: number
      unitCost: number | null
      isCostEstimated: boolean
      consumptionValue: number
      availableStock: number
      blockedStock: number
      rejectedStock: number
      currentStockValue: number
      safetyStock: number | null
      maxStorageDays: number | null
      maxRecommendedStock: number | null
      avgWeeklyConsumption: number | null
      stockCoverageWeeks: number | null
      excessStockQty: number
      excessFinancialExposure: number
      isBelowSafetyStock: boolean
      isExcessStock: boolean
      isApproachingStorageLimit: boolean
      riskStatus: 'DEFICIT' | 'EXCESS' | 'EXPIRING' | 'OPTIMAL' | 'NO_DATA'
      actsCount: number
      acts: TempProductAccumulator['acts']
      batches: TempProductAccumulator['batches']
    }

    const computedItems: ComputedRawItem[] = []

    for (const [cId, item] of itemsMap.entries()) {
      const cfg = productConfigMap.get(cId)
      const costInfo = unitCostMap.get(cId)
      const unitCost = costInfo ? costInfo.cost : null
      const isCostEstimated = costInfo ? costInfo.isEstimated : false

      // Available usable stock
      let availableStock = item.hasRecordedStock
        ? item.currentStockQty
        : Math.max(0, item.inflowQty - item.consumedQty - item.rejectedQty)

      // Fallback from batches if available
      const batchSum = item.batches
        .filter((b) => b.qcStatus === 'PASSED' || b.qcStatus === 'APPROVED')
        .reduce((s, b) => s + b.quantity, 0)
      if (availableStock === 0 && batchSum > 0) {
        availableStock = batchSum
      }

      // QC blocked stock
      const blockedStock = item.batches
        .filter((b) => b.qcStatus === 'BLOCKED' || b.qcStatus === 'PENDING')
        .reduce((s, b) => s + b.quantity, 0)

      const consumptionValue = unitCost !== null ? Math.round(item.consumedQty * unitCost) : 0
      const currentStockValue = unitCost !== null ? Math.round(availableStock * unitCost) : 0

      // Storage and Safety Stock limits
      let safetyStock = cfg?.minStockLevel && cfg.minStockLevel > 0 ? cfg.minStockLevel : null
      let maxStorageDays = cfg?.maxStorageDays ?? cfg?.shelfLifeDays ?? null

      // Fallback domain standard holding days
      const sLower = item.meta.ru.toLowerCase()
      if (maxStorageDays === null) {
        if (sLower.includes('айсберг')) maxStorageDays = 21
        else if (sLower.includes('томат')) maxStorageDays = 10
        else if (sLower.includes('лимон')) maxStorageDays = 10
        else if (sLower.includes('сельдер')) maxStorageDays = 3
        else if (sLower.includes('лук')) maxStorageDays = 30
        else if (sLower.includes('морков')) maxStorageDays = 45
        else if (sLower.includes('капуст')) maxStorageDays = 30
      }

      // Weekly Average Consumption (WAC)
      const prodActiveDays = Math.max(1, item.activeDays.size)
      const avgDaily = item.consumedQty > 0 ? item.consumedQty / prodActiveDays : 0
      const avgWeeklyConsumption = avgDaily > 0 ? Number((avgDaily * 7).toFixed(1)) : null

      // Stock Coverage Weeks
      const stockCoverageWeeks =
        avgWeeklyConsumption && avgWeeklyConsumption > 0
          ? Number((availableStock / avgWeeklyConsumption).toFixed(2))
          : null

      // Safety stock fallback based on 3-day minimum consumption if not explicitly configured
      if (!safetyStock && avgDaily > 0) {
        safetyStock = Math.round(avgDaily * 3)
      }

      // Max recommended stock target
      let maxRecommendedStock = cfg?.maxRecommendedStock && cfg.maxRecommendedStock > 0 ? cfg.maxRecommendedStock : null
      if (!maxRecommendedStock && avgDaily > 0 && maxStorageDays) {
        maxRecommendedStock = Math.round(avgDaily * maxStorageDays)
      }

      // Excess inventory financial exposure
      const excessStockQty = maxRecommendedStock && availableStock > maxRecommendedStock ? Math.round(availableStock - maxRecommendedStock) : 0
      const excessFinancialExposure = unitCost !== null ? Math.round(excessStockQty * unitCost) : 0

      // Alerts & Risks
      const isBelowSafetyStock = safetyStock !== null && availableStock < safetyStock
      const isExcessStock = excessStockQty > 0

      // Check if approaching maximum holding days
      let isApproachingStorageLimit = false
      if (maxStorageDays && item.batches.length > 0) {
        const oldestBatch = item.batches
          .filter((b) => b.receivedAt)
          .sort((a, b) => new Date(a.receivedAt!).getTime() - new Date(b.receivedAt!).getTime())[0]

        if (oldestBatch && oldestBatch.receivedAt) {
          const daysInStorage = Math.floor((now.getTime() - new Date(oldestBatch.receivedAt).getTime()) / (1000 * 60 * 60 * 24))
          if (daysInStorage >= maxStorageDays * 0.8) {
            isApproachingStorageLimit = true
          }
        }
      }

      let riskStatus: 'DEFICIT' | 'EXCESS' | 'EXPIRING' | 'OPTIMAL' | 'NO_DATA' = 'OPTIMAL'
      if (item.consumedQty === 0 && availableStock === 0) riskStatus = 'NO_DATA'
      else if (isBelowSafetyStock) riskStatus = 'DEFICIT'
      else if (isApproachingStorageLimit) riskStatus = 'EXPIRING'
      else if (isExcessStock) riskStatus = 'EXCESS'

      computedItems.push({
        meta: item.meta,
        consumedQty: Math.round(item.consumedQty * 10) / 10,
        unitCost,
        isCostEstimated,
        consumptionValue,
        availableStock: Math.round(availableStock * 10) / 10,
        blockedStock: Math.round(blockedStock * 10) / 10,
        rejectedStock: Math.round(item.rejectedQty * 10) / 10,
        currentStockValue,
        safetyStock,
        maxStorageDays,
        maxRecommendedStock,
        avgWeeklyConsumption,
        stockCoverageWeeks,
        excessStockQty,
        excessFinancialExposure,
        isBelowSafetyStock,
        isExcessStock,
        isApproachingStorageLimit,
        riskStatus,
        actsCount: item.acts.length,
        acts: item.acts,
        batches: item.batches
      })
    }

    // 6. Pareto Sorting & Strict Boundary Classification
    // Sort products by descending consumption value
    computedItems.sort((a, b) => b.consumptionValue - a.consumptionValue)

    const totalInventoryConsumptionValue = computedItems.reduce((acc, it) => acc + it.consumptionValue, 0)
    const totalCurrentInventoryValue = computedItems.reduce((acc, it) => acc + it.currentStockValue, 0)

    let runningSum = 0
    let prevCumulative = 0

    const finalProducts: AbcProductItem[] = computedItems.map((it) => {
      let percentage = 0
      let cumulative = 0

      if (totalInventoryConsumptionValue > 0 && it.consumptionValue > 0) {
        percentage = Number(((it.consumptionValue / totalInventoryConsumptionValue) * 100).toFixed(2))
        runningSum += it.consumptionValue
        cumulative = Number(((runningSum / totalInventoryConsumptionValue) * 100).toFixed(2))
      }

      // ABC Category assignment rule:
      // Category A: products contributing up to ~80%
      // Boundary crossing rule: if previous cumulative was < boundaryA, item is assigned to A!
      let abcCategory: 'A' | 'B' | 'C' | 'U' = 'C'

      if (it.consumptionValue === 0 || it.unitCost === null) {
        abcCategory = 'U'
      } else if (prevCumulative < boundaryA) {
        abcCategory = 'A'
      } else if (prevCumulative < boundaryB) {
        abcCategory = 'B'
      } else {
        abcCategory = 'C'
      }

      prevCumulative = cumulative

      return {
        id: it.meta.canonicalId,
        canonicalId: it.meta.canonicalId,
        nameUz: it.meta.uz,
        nameRu: it.meta.ru,
        nameEn: it.meta.en,
        category: it.meta.category,
        unit: it.meta.unit,
        consumedQty: it.consumedQty,
        unitCost: it.unitCost,
        isCostEstimated: it.isCostEstimated,
        consumptionValue: it.consumptionValue,
        percentageContribution: percentage,
        cumulativeContribution: Math.min(100, cumulative),
        abcCategory,
        availableStock: it.availableStock,
        blockedStock: it.blockedStock,
        rejectedStock: it.rejectedStock,
        currentStockValue: it.currentStockValue,
        safetyStock: it.safetyStock,
        maxStorageDays: it.maxStorageDays,
        maxRecommendedStock: it.maxRecommendedStock,
        avgWeeklyConsumption: it.avgWeeklyConsumption,
        stockCoverageWeeks: it.stockCoverageWeeks,
        excessStockQty: it.excessStockQty,
        excessFinancialExposure: it.excessFinancialExposure,
        isBelowSafetyStock: it.isBelowSafetyStock,
        isExcessStock: it.isExcessStock,
        isApproachingStorageLimit: it.isApproachingStorageLimit,
        riskStatus: it.riskStatus,
        actsCount: it.actsCount,
        recentActs: it.acts,
        batches: it.batches
      }
    })

    // 7. Executive KPIs and Aggregate Metrics
    const categoryACount = finalProducts.filter((p) => p.abcCategory === 'A').length
    const categoryBCount = finalProducts.filter((p) => p.abcCategory === 'B').length
    const categoryCCount = finalProducts.filter((p) => p.abcCategory === 'C').length
    const categoryUCount = finalProducts.filter((p) => p.abcCategory === 'U').length

    const categoryAValue = finalProducts
      .filter((p) => p.abcCategory === 'A')
      .reduce((s, p) => s + p.consumptionValue, 0)
    const categoryBValue = finalProducts
      .filter((p) => p.abcCategory === 'B')
      .reduce((s, p) => s + p.consumptionValue, 0)
    const categoryCValue = finalProducts
      .filter((p) => p.abcCategory === 'C')
      .reduce((s, p) => s + p.consumptionValue, 0)

    const categoryASharePercent =
      totalInventoryConsumptionValue > 0
        ? Number(((categoryAValue / totalInventoryConsumptionValue) * 100).toFixed(1))
        : 0

    const highValueBelowSafetyStock = finalProducts.filter(
      (p) => p.abcCategory === 'A' && p.isBelowSafetyStock
    )
    const excessExposureProducts = finalProducts.filter((p) => p.excessFinancialExposure > 0)
    const totalExcessFinancialExposure = excessExposureProducts.reduce(
      (s, p) => s + p.excessFinancialExposure,
      0
    )
    const highValueApproachingLimits = finalProducts.filter(
      (p) => (p.abcCategory === 'A' || p.abcCategory === 'B') && p.isApproachingStorageLimit
    )
    const unclassifiedMissingCost = finalProducts.filter((p) => p.unitCost === null)

    // 8. Chart Data Collections
    const paretoChartData = finalProducts
      .filter((p) => p.consumptionValue > 0)
      .map((p) => ({
        name: p.nameUz,
        canonicalId: p.canonicalId,
        consumptionValue: p.consumptionValue,
        cumulativePercent: p.cumulativeContribution,
        category: p.abcCategory,
        unitCost: p.unitCost
      }))

    const categoryDistribution = [
      {
        category: 'A',
        label: 'A-Toifa (Strategik 80%)',
        count: categoryACount,
        value: categoryAValue,
        share: categoryASharePercent,
        color: '#10b981' // emerald-500
      },
      {
        category: 'B',
        label: 'B-Toifa (O\'rta 15%)',
        count: categoryBCount,
        value: categoryBValue,
        share:
          totalInventoryConsumptionValue > 0
            ? Number(((categoryBValue / totalInventoryConsumptionValue) * 100).toFixed(1))
            : 0,
        color: '#f59e0b' // amber-500
      },
      {
        category: 'C',
        label: 'C-Toifa (Kichik 5%)',
        count: categoryCCount,
        value: categoryCValue,
        share:
          totalInventoryConsumptionValue > 0
            ? Number(((categoryCValue / totalInventoryConsumptionValue) * 100).toFixed(1))
            : 0,
        color: '#64748b' // slate-500
      }
    ]

    const topByConsumption = [...finalProducts]
      .filter((p) => p.consumptionValue > 0)
      .sort((a, b) => b.consumptionValue - a.consumptionValue)
      .slice(0, 8)
      .map((p) => ({
        name: p.nameUz,
        value: p.consumptionValue,
        category: p.abcCategory,
        qty: `${p.consumedQty.toLocaleString()} ${p.unit}`
      }))

    const topByStockValue = [...finalProducts]
      .filter((p) => p.currentStockValue > 0)
      .sort((a, b) => b.currentStockValue - a.currentStockValue)
      .slice(0, 8)
      .map((p) => ({
        name: p.nameUz,
        value: p.currentStockValue,
        category: p.abcCategory,
        qty: `${p.availableStock.toLocaleString()} ${p.unit}`
      }))

    // 9. Intelligent Priority-Ranked Alerts
    const alerts: Array<{
      id: string
      severity: 'CRITICAL' | 'WARNING' | 'INFO'
      titleUz: string
      titleRu: string
      titleEn: string
      descUz: string
      descRu: string
      descEn: string
      productName: string
      actionUz: string
    }> = []

    // Alert 1: Category A below Safety Stock
    highValueBelowSafetyStock.forEach((p) => {
      alerts.push({
        id: `alert-deficit-${p.canonicalId}`,
        severity: 'CRITICAL',
        titleUz: `Kritik Kamomad: ${p.nameUz} xavfsiz zaxiradan kam!`,
        titleRu: `Критический дефицит: ${p.nameRu} ниже страхового запаса!`,
        titleEn: `Critical Deficit: ${p.nameEn} below Safety Stock!`,
        descUz: `A-toifadagi asosiy xomashyo qoldig'i ${p.availableStock.toLocaleString()} ${p.unit}. Minimal xavfsiz norma esa ${p.safetyStock?.toLocaleString()} ${p.unit}. Ishlab chiqarish to'xtab qolish xavfi mavjud.`,
        descRu: `Остаток категории А составляет ${p.availableStock.toLocaleString()} ${p.unit} при норме ${p.safetyStock?.toLocaleString()} ${p.unit}. Риск остановки линии.`,
        descEn: `Category A stock is ${p.availableStock.toLocaleString()} ${p.unit} vs minimum safety stock of ${p.safetyStock?.toLocaleString()} ${p.unit}. Production halt risk.`,
        productName: p.nameUz,
        actionUz: 'Zudlik bilan ta\'minot bo\'limiga qo\'shimcha xarid topshirig\'ini berish'
      })
    })

    // Alert 2: Excess Stock Capital Tied Up
    excessExposureProducts
      .sort((a, b) => b.excessFinancialExposure - a.excessFinancialExposure)
      .slice(0, 3)
      .forEach((p) => {
        alerts.push({
          id: `alert-excess-${p.canonicalId}`,
          severity: 'WARNING',
          titleUz: `Muzlatilgan Aylanma Mablag': ${p.nameUz} me'yordan ortiq!`,
          titleRu: `Замороженный капитал: ${p.nameRu} выше рекомендуемой нормы!`,
          titleEn: `Excess Capital: ${p.nameEn} exceeds recommended ceiling!`,
          descUz: `Omborda me'yordan ${p.excessStockQty.toLocaleString()} ${p.unit} ortiqcha xomashyo mavjud. Moliyaviy yuk: ${(p.excessFinancialExposure).toLocaleString()} so'm.`,
          descRu: `На складе излишек ${p.excessStockQty.toLocaleString()} ${p.unit}. Заморожено ${(p.excessFinancialExposure).toLocaleString()} сум.`,
          descEn: `Excess stock of ${p.excessStockQty.toLocaleString()} ${p.unit} tying up ${(p.excessFinancialExposure).toLocaleString()} UZS.`,
          productName: p.nameUz,
          actionUz: 'Keyingi partiyalar xaridini kechiktirish yoki qayta ishlash jadvalini jadallashtirish'
        })
      })

    // Alert 3: Approaching Holding Limits
    highValueApproachingLimits.slice(0, 3).forEach((p) => {
      alerts.push({
        id: `alert-spoilage-${p.canonicalId}`,
        severity: 'WARNING',
        titleUz: `Buzilish Xavfi: ${p.nameUz} saqlash muddatiga yaqinlashdi!`,
        titleRu: `Риск порчи: ${p.nameRu} приближается к лимиту хранения!`,
        titleEn: `Spoilage Risk: ${p.nameEn} approaching max storage days!`,
        descUz: `Qimmatbaho xomashyo partiyalari tavsiya etilgan saqlash muddatining (${p.maxStorageDays} kun) 80% dan oshdi. FIFO qoidasiga ko'ra zudlik bilan sexga yo'naltirilishi kerak.`,
        descRu: `Срок хранения партий превысил 80% от лимита (${p.maxStorageDays} дн). Требуется первоочередная отправка в цех по FIFO.`,
        descEn: `Storage time exceeded 80% of ${p.maxStorageDays} days. Priority dispatch required per FIFO.`,
        productName: p.nameUz,
        actionUz: 'Texnolog va sexga ushbu partiyani birinchi navbatda ishlatish bo\'yicha ko\'rsatma yuborish'
      })
    })

    // 10. Final Response Payload
    return NextResponse.json({
      meta: {
        coveragePeriod: {
          from: startDate || '2025-01-01',
          to: endDate,
          operationalDays: totalOperationalDays
        },
        boundaries: {
          categoryA: boundaryA,
          categoryB: boundaryB
        },
        synchronizedAt: now.toISOString(),
        dataFreshness: 'Jonli relyatsion ma\'lumotlar bazasi'
      },
      kpis: {
        totalInventoryConsumptionValue,
        totalCurrentInventoryValue,
        categoryASharePercent,
        counts: {
          total: finalProducts.length,
          categoryA: categoryACount,
          categoryB: categoryBCount,
          categoryC: categoryCCount,
          unclassified: categoryUCount
        },
        highValueBelowSafetyStockCount: highValueBelowSafetyStock.length,
        totalExcessFinancialExposure,
        highValueApproachingLimitsCount: highValueApproachingLimits.length,
        unclassifiedMissingCostCount: unclassifiedMissingCost.length
      },
      charts: {
        paretoChartData,
        categoryDistribution,
        topByConsumption,
        topByStockValue,
        excessExposure: excessExposureProducts.slice(0, 6).map((p) => ({
          name: p.nameUz,
          exposureValue: p.excessFinancialExposure,
          excessQty: `${p.excessStockQty.toLocaleString()} ${p.unit}`
        }))
      },
      products: finalProducts,
      alerts
    })
  } catch (error: any) {
    console.error('Error in /api/warehouse/abc-analysis:', error)
    return NextResponse.json(
      { error: 'ABC tahlilini hisoblashda xatolik yuz berdi: ' + (error?.message || error) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { toNum } from '@/lib/shopReport'
import { resolveProductMeta, ProductMeta } from '@/lib/productTaxonomy'

// Production BOM & Yield Ratios from actual factory matrix (ShopExpense)
// Finished Goods -> Raw Materials conversion factors (kg raw required per 1 kg finished good)
const FACTORY_BOM_YIELD: Record<string, Array<{ rawCanonicalId: string; factor: number }>> = {
  // Tomaty tselie: Yield 83.8% -> 1 / 0.838 = 1.193 kg raw tomato per 1 kg output
  prod_tomato: [{ rawCanonicalId: 'prod_tomato', factor: 1.193 }],
  // Aysberg narezanniy: Yield 80.0% -> 1 / 0.8 = 1.25 kg raw iceberg per 1 kg output
  prod_iceberg: [{ rawCanonicalId: 'prod_iceberg', factor: 1.25 }],
  // Cole Slaw: 85% Cabbage (factor 1.11) + 15% Carrot (factor 0.19)
  prod_cabbage: [
    { rawCanonicalId: 'prod_cabbage', factor: 1.11 },
    { rawCanonicalId: 'prod_carrot', factor: 0.19 }
  ],
  // Luk narezanniy: Yield 68.0% -> 1 / 0.68 = 1.47 kg raw onion per 1 kg output
  prod_onion: [{ rawCanonicalId: 'prod_onion', factor: 1.47 }],
  // Salad Mix: Lollo Rosso (0.3), Spinach (0.45), Rukkola (0.45)
  prod_lollo_rosso: [
    { rawCanonicalId: 'prod_lollo_rosso', factor: 0.35 },
    { rawCanonicalId: 'prod_spinach', factor: 0.45 },
    { rawCanonicalId: 'prod_rukkola', factor: 0.45 }
  ]
}

export interface DailyProjectionPoint {
  date: string
  dayIndex: number // 1 to 30
  projectedStock: number
  scheduledReceipts: number
  customerDemand: number
  dailyBurn: number
  totalDemand: number
  isShortage: boolean
  isBelowSafety: boolean
}

export interface DemandSupplyProductItem {
  id: string
  canonicalId: string
  nameUz: string
  nameRu: string
  nameEn: string
  category: 'PRIMARY' | 'SECONDARY'
  unit: string
  // Stock Balances
  usableStock: number // QC Passed
  blockedStock: number // QC Blocked/Pending
  rejectedStock: number // Rejected/Defect
  safetyStock: number // Minimum Safety Stock
  maxRecommendedStock: number | null
  maxStorageDays: number | null
  // Velocity & Demand
  avgDailyConsumption: number
  avgWeeklyConsumption: number
  confirmedCustomerDemandInHorizon: number
  confirmedScheduledReceiptsInHorizon: number
  // Projections
  stockDay7: number
  stockDay14: number
  stockDay30: number
  // Risks & Replenishment
  riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXCESS'
  firstShortageDate: string | null
  daysUntilShortage: number | null
  shortageQuantity: number
  safetyDeficitQuantity: number
  excessQuantity: number
  stockCoverageDays: number | null
  recommendedReplenishmentQty: number
  dailyProjections: DailyProjectionPoint[]
  // Real Source Records
  contributingSalesOrders: Array<{
    orderNumber: string
    customerName: string
    deliveryDate: string
    orderedQty: number
    rawRequiredQty: number
  }>
  contributingProcurementOrders: Array<{
    id: number
    supplierName: string
    expectedDate: string
    quantity: number
    status: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'DIRECTOR', 'SUPPLY', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'QUALITY_CONTROL']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Ushbu bo\'lim faqat ta\'minot va boshqaruv xodimlari uchun' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const horizonDays = parseInt(searchParams.get('horizon') || '30', 10) // 7, 14, 30
    const now = new Date()

    const pad = (n: number) => String(n).padStart(2, '0')
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const horizonEndDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000)
    const horizonEndDateStr = toYMD(horizonEndDate)

    // 1. Parallel Database Fetch
    const [
      products,
      salesOrders,
      procurementOrders,
      inventoryBatches,
      expenses,
      arrivals,
      recipes
    ] = await Promise.all([
      // Product catalog with constraints
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          unit: true,
          minStockLevel: true,
          maxRecommendedStock: true,
          maxStorageDays: true,
          shelfLifeDays: true,
          category: true
        }
      }),
      // Confirmed Customer Sales Orders
      prisma.salesOrder.findMany({
        where: {
          status: { in: ['CONFIRMED', 'DRAFT'] }
        },
        include: {
          customer: { select: { id: true, name: true, companyName: true } },
          items: {
            include: { product: { select: { id: true, name: true, unit: true } } }
          }
        },
        orderBy: { deliveryDate: 'asc' }
      }),
      // Confirmed & Scheduled Inbound Procurement Orders
      prisma.order.findMany({
        where: {
          status: { in: ['PENDING', 'APPROVED'] }
        },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } }
        },
        orderBy: { expectedDate: 'asc' }
      }),
      // Warehouse Batches with QC Status
      prisma.inventoryBatch.findMany({
        include: {
          product: { select: { id: true, name: true, unit: true } }
        },
        orderBy: { receivedAt: 'desc' }
      }),
      // Historical 60-day consumption logs for Daily Burn velocity
      prisma.shopExpense.findMany({
        orderBy: { date: 'desc' },
        take: 60,
        select: { date: true, materials: true, matrix: true, balances: true }
      }),
      // Inbound arrivals for stock balance
      prisma.shopArrival.findMany({
        orderBy: { date: 'desc' },
        take: 100,
        select: { date: true, nomenclature: true, quantity: true, finalDecision: true }
      }),
      // BOM Recipes
      prisma.recipe.findMany({
        include: {
          outputProduct: true,
          ingredients: true
        }
      })
    ])

    // 2. Canonical Product Mapping
    const productCatalogMap = new Map<string, (typeof products)[0]>()
    products.forEach((p) => {
      const meta = resolveProductMeta(p.name)
      productCatalogMap.set(meta.canonicalId, p)
    })

    // 3. Historical Burn Rate Velocity (WAC & Daily Consumption)
    const consumptionDaysCount: Record<string, Set<string>> = {}
    const totalConsumedSum: Record<string, number> = {}

    expenses.forEach((e) => {
      const materials = (e.materials || {}) as Record<string, any>
      for (const [matName, val] of Object.entries(materials)) {
        const qty = toNum(val)
        if (qty > 0 && !matName.toLowerCase().includes('кухня') && !matName.toLowerCase().includes('ошхона')) {
          const meta = resolveProductMeta(matName)
          const cId = meta.canonicalId
          if (!consumptionDaysCount[cId]) consumptionDaysCount[cId] = new Set()
          consumptionDaysCount[cId].add(e.date)
          totalConsumedSum[cId] = (totalConsumedSum[cId] || 0) + qty
        }
      }
    })

    // 4. Warehouse Stock Balances (Accepted Usable vs QC Blocked vs Rejected)
    const usableStockMap: Record<string, number> = {}
    const blockedStockMap: Record<string, number> = {}
    const rejectedStockMap: Record<string, number> = {}

    // Check latest recorded balances from ShopExpense
    if (expenses.length > 0) {
      const latestExp = expenses[0]
      const balances = (latestExp.balances || {}) as Record<string, any>
      const endBalances = balances?.report?.balances?.end || balances?.end || {}
      for (const [matName, val] of Object.entries(endBalances)) {
        const q = toNum(val)
        if (q >= 0) {
          const meta = resolveProductMeta(matName)
          usableStockMap[meta.canonicalId] = q
        }
      }
    }

    // Accumulate batches
    inventoryBatches.forEach((b) => {
      if (!b.product?.name) return
      const meta = resolveProductMeta(b.product.name)
      const cId = meta.canonicalId
      const qty = toNum(b.quantity)

      if (b.qcStatus === 'BLOCKED' || b.qcStatus === 'PENDING') {
        blockedStockMap[cId] = (blockedStockMap[cId] || 0) + qty
      } else if (b.qcStatus === 'REJECTED') {
        rejectedStockMap[cId] = (rejectedStockMap[cId] || 0) + qty
      } else {
        // PASSED / APPROVED
        if (usableStockMap[cId] === undefined || usableStockMap[cId] === 0) {
          usableStockMap[cId] = (usableStockMap[cId] || 0) + qty
        }
      }
    })

    // Fallback from ShopArrival if usable stock still 0
    arrivals.forEach((a) => {
      if (!a.nomenclature || toNum(a.quantity) <= 0) return
      const meta = resolveProductMeta(a.nomenclature)
      const cId = meta.canonicalId
      const q = toNum(a.quantity)
      if (usableStockMap[cId] === undefined) {
        if (a.finalDecision && a.finalDecision.toLowerCase().includes('брак')) {
          rejectedStockMap[cId] = (rejectedStockMap[cId] || 0) + q
        } else {
          usableStockMap[cId] = (usableStockMap[cId] || 0) + q
        }
      }
    })

    // 5. Build Demand Stream (Customer Orders with BOM Explosions)
    interface CustomerDemandEntry {
      canonicalId: string
      dateStr: string
      orderNumber: string
      customerName: string
      rawRequiredQty: number
      orderedQty: number
      productName: string
    }

    const customerDemandEntries: CustomerDemandEntry[] = []

    salesOrders.forEach((so) => {
      const delDateStr = so.deliveryDate ? toYMD(new Date(so.deliveryDate)) : toYMD(new Date(so.createdAt))
      const cName = so.customer?.name || so.customer?.companyName || 'Mijoz'

      so.items.forEach((item) => {
        const prodName = item.product?.name || 'Mahsulot'
        const meta = resolveProductMeta(prodName)
        const cId = meta.canonicalId
        const orderQty = toNum(item.quantity)

        // Check if finished good needs BOM raw material expansion
        const bomIngredients = FACTORY_BOM_YIELD[cId]
        if (bomIngredients && bomIngredients.length > 0) {
          bomIngredients.forEach((bom) => {
            const rawReq = Number((orderQty * bom.factor).toFixed(1))
            customerDemandEntries.push({
              canonicalId: bom.rawCanonicalId,
              dateStr: delDateStr,
              orderNumber: so.orderNumber,
              customerName: cName,
              rawRequiredQty: rawReq,
              orderedQty: orderQty,
              productName: prodName
            })
          })
        } else {
          // Direct raw material demand
          customerDemandEntries.push({
            canonicalId: cId,
            dateStr: delDateStr,
            orderNumber: so.orderNumber,
            customerName: cName,
            rawRequiredQty: orderQty,
            orderedQty: orderQty,
            productName: prodName
          })
        }
      })
    })

    // 6. Build Supply Stream (Scheduled Procurement Orders)
    interface ScheduledReceiptEntry {
      canonicalId: string
      dateStr: string
      orderId: number
      supplierName: string
      quantity: number
      status: string
    }

    const scheduledReceiptEntries: ScheduledReceiptEntry[] = []

    procurementOrders.forEach((po) => {
      if (!po.product?.name) return
      const meta = resolveProductMeta(po.product.name)
      const expDateStr = toYMD(new Date(po.expectedDate))
      const sName = po.supplierName || po.supplier?.name || 'Ta\'minotchi'

      scheduledReceiptEntries.push({
        canonicalId: meta.canonicalId,
        dateStr: expDateStr,
        orderId: po.id,
        supplierName: sName,
        quantity: toNum(po.quantity),
        status: po.status
      })
    })

    // 7. Time-Phased 30-Day Simulation Engine
    const simulationDays = 30
    const dayDateStrings: string[] = []
    for (let i = 1; i <= simulationDays; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      dayDateStrings.push(toYMD(d))
    }

    // Collect all primary & active products
    const analyzedCanonicalIds = new Set<string>()
    productCatalogMap.forEach((_, cId) => analyzedCanonicalIds.add(cId))
    customerDemandEntries.forEach((e) => analyzedCanonicalIds.add(e.canonicalId))
    scheduledReceiptEntries.forEach((e) => analyzedCanonicalIds.add(e.canonicalId))

    const computedProductList: DemandSupplyProductItem[] = []

    for (const cId of analyzedCanonicalIds) {
      const meta = resolveProductMeta(cId)
      const cfg = productCatalogMap.get(cId)

      // Fallback domain standard holding days
      let maxStorageDays = cfg?.maxStorageDays ?? cfg?.shelfLifeDays ?? null
      const sLower = meta.ru.toLowerCase()
      if (maxStorageDays === null) {
        if (sLower.includes('айсберг')) maxStorageDays = 21
        else if (sLower.includes('томат')) maxStorageDays = 10
        else if (sLower.includes('лимон')) maxStorageDays = 10
        else if (sLower.includes('сельдер')) maxStorageDays = 3
        else if (sLower.includes('лук')) maxStorageDays = 30
        else if (sLower.includes('морков')) maxStorageDays = 45
        else if (sLower.includes('капуст')) maxStorageDays = 30
      }

      // Average Daily and Weekly consumption
      const daysCount = consumptionDaysCount[cId]?.size || 1
      const totalCons = totalConsumedSum[cId] || 0
      const avgDailyConsumption = totalCons > 0 ? Number((totalCons / daysCount).toFixed(1)) : 0
      const avgWeeklyConsumption = Number((avgDailyConsumption * 7).toFixed(1))

      // Safety stock & Max recommended ceiling
      let safetyStock = cfg?.minStockLevel && cfg.minStockLevel > 0 ? cfg.minStockLevel : 0
      if (safetyStock === 0 && avgDailyConsumption > 0) {
        safetyStock = Math.round(avgDailyConsumption * 3) // 3-day buffer
      }

      let maxRecommendedStock = cfg?.maxRecommendedStock && cfg.maxRecommendedStock > 0 ? cfg.maxRecommendedStock : null
      if (!maxRecommendedStock && avgDailyConsumption > 0 && maxStorageDays) {
        maxRecommendedStock = Math.round(avgDailyConsumption * maxStorageDays)
      }

      // Stock Balances
      const usableStock = Math.round((usableStockMap[cId] || 0) * 10) / 10
      const blockedStock = Math.round((blockedStockMap[cId] || 0) * 10) / 10
      const rejectedStock = Math.round((rejectedStockMap[cId] || 0) * 10) / 10

      // Filter demands & receipts for this product
      const productDemands = customerDemandEntries.filter((d) => d.canonicalId === cId)
      const productReceipts = scheduledReceiptEntries.filter((r) => r.canonicalId === cId)

      const confirmedCustomerDemandInHorizon = productDemands
        .filter((d) => d.dateStr <= horizonEndDateStr)
        .reduce((sum, d) => sum + d.rawRequiredQty, 0)

      const confirmedScheduledReceiptsInHorizon = productReceipts
        .filter((r) => r.dateStr <= horizonEndDateStr)
        .reduce((sum, r) => sum + r.quantity, 0)

      // Run 30-Day Day-by-Day Time-Phased Simulation
      let currentSimStock = usableStock
      let firstShortageDate: string | null = null
      let daysUntilShortage: number | null = null
      let maxShortageQty = 0
      let maxSafetyDeficit = 0

      const dailyProjections: DailyProjectionPoint[] = []

      for (let day = 1; day <= simulationDays; day++) {
        const dStr = dayDateStrings[day - 1]

        // Receipts scheduled for this day
        const dayReceipts = productReceipts
          .filter((r) => r.dateStr === dStr)
          .reduce((sum, r) => sum + r.quantity, 0)

        // Customer demand scheduled for this day
        const dayCustDemand = productDemands
          .filter((d) => d.dateStr === dStr)
          .reduce((sum, d) => sum + d.rawRequiredQty, 0)

        const dayBurn = avgDailyConsumption
        const totalDayDemand = dayCustDemand + dayBurn

        // State transition equation: Projected(t) = Projected(t-1) + Receipts(t) - Demand(t)
        currentSimStock = Number((currentSimStock + dayReceipts - totalDayDemand).toFixed(1))

        const isShortage = currentSimStock < 0
        const isBelowSafety = currentSimStock < safetyStock

        if (isShortage) {
          if (!firstShortageDate) {
            firstShortageDate = dStr
            daysUntilShortage = day
          }
          if (Math.abs(currentSimStock) > maxShortageQty) {
            maxShortageQty = Math.abs(currentSimStock)
          }
        }

        if (isBelowSafety && currentSimStock >= 0) {
          const def = safetyStock - currentSimStock
          if (def > maxSafetyDeficit) maxSafetyDeficit = def
        }

        dailyProjections.push({
          date: dStr,
          dayIndex: day,
          projectedStock: currentSimStock,
          scheduledReceipts: dayReceipts,
          customerDemand: dayCustDemand,
          dailyBurn: dayBurn,
          totalDemand: totalDayDemand,
          isShortage,
          isBelowSafety
        })
      }

      // Check Projections at Day 7, 14, 30
      const stockDay7 = dailyProjections[6]?.projectedStock ?? currentSimStock
      const stockDay14 = dailyProjections[13]?.projectedStock ?? currentSimStock
      const stockDay30 = dailyProjections[29]?.projectedStock ?? currentSimStock

      // Risk Level Assessment
      let riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXCESS' = 'SAFE'
      if (daysUntilShortage !== null && daysUntilShortage <= 7) {
        riskLevel = 'CRITICAL'
      } else if (daysUntilShortage !== null && daysUntilShortage <= 14) {
        riskLevel = 'WARNING'
      } else if (stockDay14 < safetyStock) {
        riskLevel = 'WARNING'
      } else if (maxRecommendedStock && usableStock > maxRecommendedStock) {
        riskLevel = 'EXCESS'
      }

      // Excess Quantity
      const excessQuantity =
        maxRecommendedStock && usableStock > maxRecommendedStock
          ? Math.round(usableStock - maxRecommendedStock)
          : 0

      // Stock Coverage Days
      const totalDailyDemandRate = avgDailyConsumption + (confirmedCustomerDemandInHorizon / Math.max(1, horizonDays))
      const stockCoverageDays =
        totalDailyDemandRate > 0 ? Number((usableStock / totalDailyDemandRate).toFixed(1)) : null

      // Recommended Replenishment Quantity
      // Replenish so that inventory stays at Safety Stock + 7 days burn rate
      // Lead time assumed: 2 days
      const projectedStockAtLeadTime = dailyProjections[1]?.projectedStock ?? usableStock
      const targetBuffer = safetyStock + Math.round(avgDailyConsumption * 7)
      const recommendedReplenishmentQty =
        projectedStockAtLeadTime < targetBuffer ? Math.round(targetBuffer - projectedStockAtLeadTime) : 0

      computedProductList.push({
        id: meta.canonicalId,
        canonicalId: meta.canonicalId,
        nameUz: meta.uz,
        nameRu: meta.ru,
        nameEn: meta.en,
        category: meta.category,
        unit: meta.unit,
        usableStock,
        blockedStock,
        rejectedStock,
        safetyStock,
        maxRecommendedStock,
        maxStorageDays,
        avgDailyConsumption,
        avgWeeklyConsumption,
        confirmedCustomerDemandInHorizon: Math.round(confirmedCustomerDemandInHorizon),
        confirmedScheduledReceiptsInHorizon: Math.round(confirmedScheduledReceiptsInHorizon),
        stockDay7,
        stockDay14,
        stockDay30,
        riskLevel,
        firstShortageDate,
        daysUntilShortage,
        shortageQuantity: Math.round(maxShortageQty),
        safetyDeficitQuantity: Math.round(maxSafetyDeficit),
        excessQuantity,
        stockCoverageDays,
        recommendedReplenishmentQty,
        dailyProjections,
        contributingSalesOrders: productDemands.map((d) => ({
          orderNumber: d.orderNumber,
          customerName: d.customerName,
          deliveryDate: d.dateStr,
          orderedQty: d.orderedQty,
          rawRequiredQty: d.rawRequiredQty
        })),
        contributingProcurementOrders: productReceipts.map((r) => ({
          id: r.orderId,
          supplierName: r.supplierName,
          expectedDate: r.dateStr,
          quantity: r.quantity,
          status: r.status
        }))
      })
    }

    // 8. Customer Orders at Risk (Disruption Impact)
    const customerOrdersAtRisk: Array<{
      orderNumber: string
      customerName: string
      productName: string
      deliveryDate: string
      orderedQty: number
      rawRequiredQty: number
      projectedStockOnDate: number
      deficitQty: number
      severity: 'CRITICAL' | 'WARNING'
    }> = []

    customerDemandEntries.forEach((d) => {
      const prod = computedProductList.find((p) => p.canonicalId === d.canonicalId)
      if (prod) {
        const projOnDate = prod.dailyProjections.find((p) => p.date === d.dateStr)
        if (projOnDate && projOnDate.projectedStock < d.rawRequiredQty) {
          const deficit = Math.round(d.rawRequiredQty - projOnDate.projectedStock)
          customerOrdersAtRisk.push({
            orderNumber: d.orderNumber,
            customerName: d.customerName,
            productName: d.productName,
            deliveryDate: d.dateStr,
            orderedQty: d.orderedQty,
            rawRequiredQty: d.rawRequiredQty,
            projectedStockOnDate: projOnDate.projectedStock,
            deficitQty: deficit,
            severity: projOnDate.projectedStock < 0 ? 'CRITICAL' : 'WARNING'
          })
        }
      }
    })

    // 9. Director Strategic Action Recommendations
    const directorRecommendations: Array<{
      id: string
      type: 'PROCUREMENT_URGENT' | 'CAPACITY_RISK' | 'ORDER_AT_RISK' | 'STORAGE_EXPIRING' | 'EXCESS_CEILING'
      severity: 'CRITICAL' | 'WARNING' | 'INFO'
      titleUz: string
      titleRu: string
      titleEn: string
      descUz: string
      descRu: string
      descEn: string
      affectedProduct: string
      quantity: string
      actionUz: string
    }> = []

    // A. Urgent Shortage Recommendations
    computedProductList
      .filter((p) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'WARNING')
      .sort((a, b) => (a.daysUntilShortage ?? 999) - (b.daysUntilShortage ?? 999))
      .slice(0, 4)
      .forEach((p) => {
        directorRecommendations.push({
          id: `rec-shortage-${p.canonicalId}`,
          type: 'PROCUREMENT_URGENT',
          severity: p.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          titleUz: `Shoshilinch Xarid: ${p.nameUz} ${p.daysUntilShortage ? `${p.daysUntilShortage} kunda` : 'yaqin kunlarda'} tugaydi!`,
          titleRu: `Срочная закупка: ${p.nameRu} закончится через ${p.daysUntilShortage || 7} дн.!`,
          titleEn: `Urgent Procurement: ${p.nameEn} stockout in ${p.daysUntilShortage || 7} days!`,
          descUz: `Faktik yaroqli qoldiq: ${p.usableStock.toLocaleString()} ${p.unit}. Tasdiqlangan buyurtmalar va kunlik sarf hisobiga ${p.firstShortageDate || 'yaqin kunlarda'} kamomad kutilmoqda. Tavsiya etilgan zudlik bilan buyurtma hajmi: ${p.recommendedReplenishmentQty.toLocaleString()} ${p.unit}.`,
          descRu: `Остаток: ${p.usableStock.toLocaleString()} ${p.unit}. Дефицит ожидается ${p.firstShortageDate || 'в ближайшие дни'}. Рекомендуемый заказ: ${p.recommendedReplenishmentQty.toLocaleString()} ${p.unit}.`,
          descEn: `Current stock: ${p.usableStock.toLocaleString()} ${p.unit}. Projected shortage by ${p.firstShortageDate || 'soon'}. Recommended replenishment: ${p.recommendedReplenishmentQty.toLocaleString()} ${p.unit}.`,
          affectedProduct: p.nameUz,
          quantity: `${p.recommendedReplenishmentQty.toLocaleString()} ${p.unit}`,
          actionUz: 'Ta\'minot bo\'limiga shoshilinch xarid topshirig\'i berish'
        })
      })

    // B. Customer Order Disruption Risk
    customerOrdersAtRisk.slice(0, 3).forEach((o) => {
      directorRecommendations.push({
        id: `rec-order-${o.orderNumber}`,
        type: 'ORDER_AT_RISK',
        severity: o.severity,
        titleUz: `Mijoz Buyurtmasi Xavf Ostida: ${o.customerName} (${o.orderNumber})`,
        titleRu: `Риск срыва заказа клиента: ${o.customerName} (${o.orderNumber})`,
        titleEn: `Customer Order at Risk: ${o.customerName} (${o.orderNumber})`,
        descUz: `${o.deliveryDate} sanasiga rejalashtirilgan ${o.productName} (${o.orderedQty.toLocaleString()} kg) buyurtmasi uchun xomashyo yetishmasligi mumkin. Kutilayotgan kamomad: ${o.deficitQty.toLocaleString()} kg.`,
        descRu: `К дате ${o.deliveryDate} по заказу ${o.productName} дефицит сырья составит ${o.deficitQty.toLocaleString()} кг.`,
        descEn: `By delivery date ${o.deliveryDate}, raw material deficit for ${o.productName} is projected at ${o.deficitQty.toLocaleString()} kg.`,
        affectedProduct: o.productName,
        quantity: `${o.deficitQty.toLocaleString()} kg`,
        actionUz: 'Xomashyoni tezlashtirilgan tartibda keltirish yoki buyurtma muddatini kelishish'
      })
    })

    // C. Excess Stock Storage Ceiling Risk
    computedProductList
      .filter((p) => p.riskLevel === 'EXCESS')
      .slice(0, 2)
      .forEach((p) => {
        directorRecommendations.push({
          id: `rec-excess-${p.canonicalId}`,
          type: 'EXCESS_CEILING',
          severity: 'INFO',
          titleUz: `Ortiqcha Zaxira: ${p.nameUz} tavsiya etilgan maksimal normadan ortiq`,
          titleRu: `Избыточный запас: ${p.nameRu} превышает потолок хранения`,
          titleEn: `Excess Stock: ${p.nameEn} exceeds storage ceiling`,
          descUz: `Omborda ${p.usableStock.toLocaleString()} ${p.unit} mavjud (maksimal tavsiya: ${p.maxRecommendedStock?.toLocaleString()} ${p.unit}). Ortiqcha zaxira: ${p.excessQuantity.toLocaleString()} ${p.unit}. Saqlash muddati: ${p.maxStorageDays} kun.`,
          descRu: `На складе ${p.usableStock.toLocaleString()} ${p.unit} при лимите ${p.maxRecommendedStock?.toLocaleString()} ${p.unit}. Излишек: ${p.excessQuantity.toLocaleString()} ${p.unit}.`,
          descEn: `Stock is ${p.usableStock.toLocaleString()} ${p.unit} vs limit of ${p.maxRecommendedStock?.toLocaleString()} ${p.unit}. Excess: ${p.excessQuantity.toLocaleString()} ${p.unit}.`,
          affectedProduct: p.nameUz,
          quantity: `${p.excessQuantity.toLocaleString()} ${p.unit}`,
          actionUz: 'Sexda qayta ishlash jadvalini jadallashtirish va xaridni vaqtincha to\'xtatish'
        })
      })

    // 10. Summary KPIs
    const productsAtShortageRisk = computedProductList.filter((p) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'WARNING')
    const productsBelowSafety = computedProductList.filter((p) => p.usableStock < p.safetyStock && p.usableStock > 0)
    const productsInExcess = computedProductList.filter((p) => p.riskLevel === 'EXCESS')

    const totalConfirmedDemandKg = computedProductList.reduce(
      (sum, p) => sum + p.confirmedCustomerDemandInHorizon,
      0
    )
    const totalScheduledReceiptsKg = computedProductList.reduce(
      (sum, p) => sum + p.confirmedScheduledReceiptsInHorizon,
      0
    )

    // Return Full Analytical Response
    return NextResponse.json({
      meta: {
        horizonDays,
        startDate: toYMD(now),
        endDate: horizonEndDateStr,
        synchronizedAt: now.toISOString(),
        engine: 'Time-Phased Inventory Projection Engine (BOM Exploded)'
      },
      kpis: {
        productsAtShortageRiskCount: productsAtShortageRisk.length,
        productsBelowSafetyCount: productsBelowSafety.length,
        productsInExcessCount: productsInExcess.length,
        customerOrdersAtRiskCount: customerOrdersAtRisk.length,
        totalConfirmedDemandKg,
        totalScheduledReceiptsKg,
        totalProductsCount: computedProductList.length
      },
      recommendations: directorRecommendations,
      customerOrdersAtRisk,
      products: computedProductList,
      charts: {
        demandVsSupplyBalance: computedProductList
          .filter((p) => p.usableStock > 0 || p.confirmedCustomerDemandInHorizon > 0)
          .slice(0, 10)
          .map((p) => ({
            name: p.nameUz,
            usableStock: p.usableStock,
            scheduledReceipts: p.confirmedScheduledReceiptsInHorizon,
            customerDemand: p.confirmedCustomerDemandInHorizon,
            safetyStock: p.safetyStock
          })),
        coverageDaysByProduct: computedProductList
          .filter((p) => p.stockCoverageDays !== null && p.stockCoverageDays > 0)
          .sort((a, b) => (a.stockCoverageDays ?? 0) - (b.stockCoverageDays ?? 0))
          .slice(0, 10)
          .map((p) => ({
            name: p.nameUz,
            coverageDays: p.stockCoverageDays,
            riskLevel: p.riskLevel
          }))
      }
    })
  } catch (error: any) {
    console.error('Error in /api/supply-chain/demand-supply:', error)
    return NextResponse.json(
      { error: 'Talab va ta\'minot tahlilida xatolik: ' + (error?.message || error) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { toNum } from '@/lib/shopReport'

function norm(s: any): string {
  return String(s ?? '').trim().toLowerCase()
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Ruxsat etilmagan: Faqat rahbariyat uchun' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('from') || ''
    const dateTo = searchParams.get('dateTo') || searchParams.get('to') || ''

    // 1. Sanalar filtri
    const arrivalWhere: any = {}
    const expenseWhere: any = {}
    const wastageWhere: any = { isCancelled: false }
    const actWhere: any = {}
    const inspectionWhere: any = {}
    const shippingWhere: any = {}
    const transferWhere: any = {}

    if (dateFrom && dateTo) {
      arrivalWhere.date = { gte: dateFrom, lte: dateTo }
      expenseWhere.date = { gte: dateFrom, lte: dateTo }
      wastageWhere.incidentDate = { gte: dateFrom, lte: dateTo }
      actWhere.actDate = { gte: dateFrom, lte: dateTo }
      shippingWhere.date = { gte: dateFrom, lte: dateTo }
      inspectionWhere.inspectionDate = {
        gte: new Date(dateFrom + 'T00:00:00'),
        lte: new Date(dateTo + 'T23:59:59.999'),
      }
      transferWhere.createdAt = {
        gte: new Date(dateFrom + 'T00:00:00'),
        lte: new Date(dateTo + 'T23:59:59.999'),
      }
    } else if (dateFrom) {
      arrivalWhere.date = { gte: dateFrom }
      expenseWhere.date = { gte: dateFrom }
      wastageWhere.incidentDate = { gte: dateFrom }
      actWhere.actDate = { gte: dateFrom }
      shippingWhere.date = { gte: dateFrom }
      inspectionWhere.inspectionDate = { gte: new Date(dateFrom + 'T00:00:00') }
      transferWhere.createdAt = { gte: new Date(dateFrom + 'T00:00:00') }
    } else if (dateTo) {
      arrivalWhere.date = { lte: dateTo }
      expenseWhere.date = { lte: dateTo }
      wastageWhere.incidentDate = { lte: dateTo }
      actWhere.actDate = { lte: dateTo }
      shippingWhere.date = { lte: dateTo }
      inspectionWhere.inspectionDate = { lte: new Date(dateTo + 'T23:59:59.999') }
      transferWhere.createdAt = { lte: new Date(dateTo + 'T23:59:59.999') }
    }

    // 2. Parallel ravishda bazadan barcha operatsion ma'lumotlarni olish
    const [
      arrivals,
      expenses,
      wastageLogs,
      incomingActs,
      standards,
      dbProducts,
      inspections,
      shippingLogs,
      stockTransfers,
      inventoryBatches,
    ] = await Promise.all([
      prisma.shopArrival.findMany({
        where: arrivalWhere,
        orderBy: { date: 'asc' },
      }),
      prisma.shopExpense.findMany({
        where: expenseWhere,
        orderBy: { date: 'asc' },
      }),
      prisma.executiveWastageLog.findMany({
        where: wastageWhere,
        orderBy: { incidentDate: 'desc' },
      }),
      prisma.incomingRawMaterialAct.findMany({
        where: actWhere,
        orderBy: { actDate: 'desc' },
      }),
      prisma.executiveLossStandard.findMany(),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          unit: true,
          category: true,
          shelfLifeDays: true,
          maxStorageDays: true,
          minStockLevel: true,
          maxRecommendedStock: true,
        },
      }),
      prisma.inspection.findMany({
        where: inspectionWhere,
        include: {
          supplier: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, unit: true } },
          images: true,
        },
        orderBy: { inspectionDate: 'desc' },
      }),
      prisma.shippingLog.findMany({
        where: shippingWhere,
        orderBy: { date: 'desc' },
        take: 100,
      }),
      prisma.stockTransfer.findMany({
        where: transferWhere,
        include: {
          product: { select: { id: true, name: true, unit: true } },
          batch: { select: { id: true, batchNumber: true, expirationDate: true, receivedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryBatch.findMany({
        where: { qcStatus: 'APPROVED', quantity: { gt: 0 } },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: [{ expirationDate: 'asc' }, { receivedAt: 'asc' }],
      }),
    ])

    // Standards & Product Configuration Maps
    const standardsMap = new Map<string, (typeof standards)[0]>()
    standards.forEach((s) => standardsMap.set(norm(s.productName), s))

    const productConfigMap = new Map<string, (typeof dbProducts)[0]>()
    dbProducts.forEach((p) => productConfigMap.set(norm(p.name), p))

    // Track operational days with actual material consumption (Formula A requirement)
    const operationalDaysSet = new Set<string>()

    // 3. Mahsulotlar bo'yicha guruhlash va hisoblash
    const productStats: Record<
      string,
      {
        productName: string
        unit: string
        openingStockKg: number
        hasOpeningRecorded: boolean
        inflowKg: number // Accepted incoming materials
        rejectedIncomingKg: number // Rejected at incoming QC (never enters usable stock)
        consumedKg: number // Actual raw material consumed in production
        outputKg: number
        techWasteKg: number
        actualDefectKg: number
        currentStockKg: number
        hasEndStockRecorded: boolean
        activeConsumptionDays: Set<string>
        stages: {
          incoming: { defectKg: number; reasons: Record<string, number>; suppliers: Record<string, number> }
          processing: { techWasteKg: number; defectKg: number; reasons: Record<string, number> }
          storage: { defectKg: number; reasons: Record<string, number> }
          finalQc: { checkedKg: number; approvedKg: number; rejectedKg: number }
        }
      }
    > = {}

    const getOrInitProd = (name: string) => {
      const clean = name.trim()
      const k = norm(clean)
      if (!productStats[k]) {
        const cfg = productConfigMap.get(k)
        productStats[k] = {
          productName: clean,
          unit: cfg?.unit || 'kg',
          openingStockKg: 0,
          hasOpeningRecorded: false,
          inflowKg: 0,
          rejectedIncomingKg: 0,
          consumedKg: 0,
          outputKg: 0,
          techWasteKg: 0,
          actualDefectKg: 0,
          currentStockKg: 0,
          hasEndStockRecorded: false,
          activeConsumptionDays: new Set<string>(),
          stages: {
            incoming: { defectKg: 0, reasons: {}, suppliers: {} },
            processing: { techWasteKg: 0, defectKg: 0, reasons: {} },
            storage: { defectKg: 0, reasons: {} },
            finalQc: { checkedKg: 0, approvedKg: 0, rejectedKg: 0 },
          },
        }
      }
      return productStats[k]
    }

    // A. Kirim (ShopArrival — Accepted arrivals)
    arrivals.forEach((a) => {
      if (!a.nomenclature || toNum(a.quantity) <= 0) return
      const p = getOrInitProd(a.nomenclature)
      p.inflowKg += toNum(a.quantity)
    })

    // B. Chiqim, Sarf, Boshlang'ich/Yakuniy qoldiq va Tayyor mahsulot (ShopExpense)
    expenses.forEach((e) => {
      let dayHadConsumption = false

      // 1. Qayta ishlashga haqiqiy sarflangan xomashyolar (Consumed Raw Materials)
      const consumedForDay: Record<string, number> = {}
      const materials = (e.materials || {}) as Record<string, any>
      for (const [matName, val] of Object.entries(materials)) {
        const num = toNum(val)
        if (num > 0 && !matName.toLowerCase().includes('коробк') && !matName.toLowerCase().includes('пакет')) {
          consumedForDay[matName] = (consumedForDay[matName] || 0) + num
        }
      }

      if (Object.keys(consumedForDay).length === 0 && e.matrix && typeof e.matrix === 'object') {
        Object.entries(e.matrix as Record<string, any>).forEach(([, rowVal]) => {
          if (typeof rowVal === 'object' && rowVal !== null) {
            Object.entries(rowVal).forEach(([k, v]) => {
              const num = toNum(v)
              if (num > 0 && num < 100000 && !k.toLowerCase().includes('col_') && !k.toLowerCase().includes('коробк') && !k.toLowerCase().includes('пакет')) {
                consumedForDay[k] = (consumedForDay[k] || 0) + num
              }
            })
          }
        })
      }

      for (const [matName, num] of Object.entries(consumedForDay)) {
        const p = getOrInitProd(matName)
        p.consumedKg += num
        p.activeConsumptionDays.add(e.date)
        dayHadConsumption = true
      }

      if (dayHadConsumption) {
        operationalDaysSet.add(e.date)
      }

      // 2. Tayyor mahsulot (outputs)
      const outputs = (e.outputs || {}) as Record<string, any>
      for (const [outName, val] of Object.entries(outputs)) {
        const kg = typeof val === 'object' && val !== null ? toNum(val.kg ?? val.val) : toNum(val)
        if (kg > 0) {
          let targetRaw = outName
          const lOut = outName.toLowerCase()
          if (lOut.includes('айсберг')) targetRaw = 'Салат Айсберг'
          else if (lOut.includes('томат')) targetRaw = 'Томат'
          else if (lOut.includes('лук')) targetRaw = 'Лук'
          else if (lOut.includes('лимон')) targetRaw = 'Лимон'
          else if (lOut.includes('коул')) targetRaw = 'Капуста белокачанная'

          const p = getOrInitProd(targetRaw)
          p.outputKg += kg
        }
      }

      // 3. Kunlik hisobot qoldiqlari (Opening & Closing Balances)
      const balances = (e.balances || {}) as Record<string, any>
      const startBalances = balances?.start || {}
      for (const [rawName, val] of Object.entries(startBalances)) {
        const num = toNum(val)
        if (num >= 0) {
          const p = getOrInitProd(rawName)
          if (!p.hasOpeningRecorded) {
            p.openingStockKg = num
            p.hasOpeningRecorded = true
          }
        }
      }

      const endBalances = balances?.end || {}
      for (const [rawName, val] of Object.entries(endBalances)) {
        const num = toNum(val)
        if (num >= 0) {
          const p = getOrInitProd(rawName)
          p.currentStockKg = num
          p.hasEndStockRecorded = true
        }
      }
    })

    // C. Executive Wastage Logs (Brak jurnali — Stage A: INCOMING, Stage B: PROCESSING, Stage C: STORAGE)
    const processedActNumbers = new Set<string>()
    wastageLogs.forEach((w) => {
      const p = getOrInitProd(w.productName)
      const kg = toNum(w.weightKg)
      if (kg <= 0) return
      if (w.actNumber) processedActNumbers.add(w.actNumber)

      if (w.wastageType === 'NATURAL_TECH_WASTE') {
        p.techWasteKg += kg
        p.stages.processing.techWasteKg += kg
      } else {
        // ACTUAL_DEFECT
        p.actualDefectKg += kg

        if (w.stage === 'INCOMING') {
          p.rejectedIncomingKg += kg
          p.stages.incoming.defectKg += kg
          if (w.reasonCategory) {
            p.stages.incoming.reasons[w.reasonCategory] = (p.stages.incoming.reasons[w.reasonCategory] || 0) + kg
          }
          if (w.supplierName) {
            p.stages.incoming.suppliers[w.supplierName] = (p.stages.incoming.suppliers[w.supplierName] || 0) + kg
          }
        } else if (w.stage === 'STORAGE') {
          p.stages.storage.defectKg += kg
          if (w.reasonCategory) {
            p.stages.storage.reasons[w.reasonCategory] = (p.stages.storage.reasons[w.reasonCategory] || 0) + kg
          }
        } else {
          // PROCESSING
          p.stages.processing.defectKg += kg
          if (w.reasonCategory) {
            p.stages.processing.reasons[w.reasonCategory] = (p.stages.processing.reasons[w.reasonCategory] || 0) + kg
          }
        }
      }
    })

    // D. Incoming Acts braklari va Ta'minotchi Brak Tahlili (Requirement 6 & 8)
    interface SupplierRejectionActItem {
      id: string
      rejectionActNumber: string
      actDate: string
      supplierName: string
      productName: string
      receivedKg: number
      acceptedKg: number
      rejectedKg: number
      reason: string
      inspectorName: string
      photoUrl: string | null
      documentUrl: string | null
    }

    const supplierRejectionActs: SupplierRejectionActItem[] = []
    const supplierSummaryMap = new Map<
      string,
      {
        supplierName: string
        totalReceivedKg: number
        acceptedKg: number
        rejectedKg: number
        totalDeliveriesCount: number
        rejectedActsCount: number
        reasonsMap: Record<string, number>
        dailyBreakdownMap: Record<string, { date: string; receivedKg: number; rejectedKg: number; acts: SupplierRejectionActItem[] }>
      }
    >()

    const getOrInitSupplier = (sName: string) => {
      const clean = (sName || "Noma'lum ta'minotchi").trim()
      if (!supplierSummaryMap.has(clean)) {
        supplierSummaryMap.set(clean, {
          supplierName: clean,
          totalReceivedKg: 0,
          acceptedKg: 0,
          rejectedKg: 0,
          totalDeliveriesCount: 0,
          rejectedActsCount: 0,
          reasonsMap: {},
          dailyBreakdownMap: {},
        })
      }
      return supplierSummaryMap.get(clean)!
    }

    // Track accepted arrivals by supplier from ShopArrival
    arrivals.forEach((a) => {
      const qty = toNum(a.quantity)
      if (qty <= 0) return
      const s = getOrInitSupplier(a.supplier || "Asosiy ta'minotchi")
      s.totalReceivedKg += qty
      s.acceptedKg += qty
      s.totalDeliveriesCount++
      const d = a.date
      if (!s.dailyBreakdownMap[d]) {
        s.dailyBreakdownMap[d] = { date: d, receivedKg: 0, rejectedKg: 0, acts: [] }
      }
      s.dailyBreakdownMap[d].receivedKg += qty
    })

    incomingActs.forEach((act) => {
      const isRejected = act.decisionRating === 2 || (act.decisionText || '').toLowerCase().includes('rad')
      const hasDefect = act.internalOxidation === 1 || act.rotDiseases === 1 || act.noMechanicalDamage === 0
      const rejActNum = act.rejectionActNumber || `REJ-ACT-${act.actNumber}`

      if (act.productName && (isRejected || hasDefect)) {
        const p = getOrInitProd(act.productName)
        const dKg = isRejected ? toNum(act.warehouseKg) : 0
        if (dKg > 0 && !processedActNumbers.has(rejActNum)) {
          p.actualDefectKg += dKg
          p.rejectedIncomingKg += dKg
          p.stages.incoming.defectKg += dKg
          const r =
            act.decisionText ||
            (act.rotDiseases === 1
              ? 'Chirish kasalligi'
              : act.internalOxidation === 1
                ? 'Ichki qizarish / oksidlanish'
                : act.insectTraces === 1
                  ? 'Hasharot izlari'
                  : 'Qabulda rad etilgan')
          p.stages.incoming.reasons[r] = (p.stages.incoming.reasons[r] || 0) + dKg
          if (act.supplierName) {
            p.stages.incoming.suppliers[act.supplierName] = (p.stages.incoming.suppliers[act.supplierName] || 0) + dKg
          }

          // Supplier Defect Analysis record
          const s = getOrInitSupplier(act.supplierName)
          s.totalReceivedKg += dKg
          s.rejectedKg += dKg
          s.totalDeliveriesCount++
          s.rejectedActsCount++
          s.reasonsMap[r] = (s.reasonsMap[r] || 0) + dKg

          const actItem: SupplierRejectionActItem = {
            id: `inc-act-${act.id}`,
            rejectionActNumber: rejActNum,
            actDate: act.actDate,
            supplierName: act.supplierName,
            productName: act.productName,
            receivedKg: dKg,
            acceptedKg: 0,
            rejectedKg: dKg,
            reason: r,
            inspectorName: act.inspectorName || 'Sifat nazoratchisi (QC)',
            photoUrl: null,
            documentUrl: null,
          }
          supplierRejectionActs.push(actItem)
          if (!s.dailyBreakdownMap[act.actDate]) {
            s.dailyBreakdownMap[act.actDate] = { date: act.actDate, receivedKg: 0, rejectedKg: 0, acts: [] }
          }
          s.dailyBreakdownMap[act.actDate].receivedKg += dKg
          s.dailyBreakdownMap[act.actDate].rejectedKg += dKg
          s.dailyBreakdownMap[act.actDate].acts.push(actItem)
        }
      }
    })

    // Also include rejected / partially rejected Inspections in Supplier Defect Analysis
    inspections.forEach((insp) => {
      const rejQty = toNum(insp.rejectedQuantity) || (insp.status === 'REJECTED' ? toNum(insp.quantity) : 0)
      const accQty = insp.status === 'REJECTED' ? 0 : (insp.acceptedQuantity !== null && insp.acceptedQuantity !== undefined ? toNum(insp.acceptedQuantity) : Math.max(0, toNum(insp.quantity) - rejQty))
      const rejActNum = insp.rejectionActNumber || `REJ-${insp.actNumber}`
      const dateStr = new Date(insp.inspectionDate).toISOString().slice(0, 10)

      if (rejQty > 0) {
        const sName = insp.supplier?.name || "Ta'minotchi"
        const s = getOrInitSupplier(sName)
        s.totalReceivedKg += rejQty + accQty
        s.acceptedKg += accQty
        s.rejectedKg += rejQty
        s.totalDeliveriesCount++
        s.rejectedActsCount++
        const r = insp.rejectionReason || insp.conclusion || insp.notes || 'Sifat talabiga nomuvofiq'
        s.reasonsMap[r] = (s.reasonsMap[r] || 0) + rejQty

        const actItem: SupplierRejectionActItem = {
          id: `insp-rej-${insp.id}`,
          rejectionActNumber: rejActNum,
          actDate: dateStr,
          supplierName: sName,
          productName: insp.product?.name || 'Xomashyo',
          receivedKg: accQty + rejQty,
          acceptedKg: accQty,
          rejectedKg: rejQty,
          reason: r,
          inspectorName: insp.inspector || 'Sifat nazoratchisi (QC)',
          photoUrl: insp.images?.[0]?.url || null,
          documentUrl: insp.pdfPath || null,
        }
        supplierRejectionActs.push(actItem)
        if (!s.dailyBreakdownMap[dateStr]) {
          s.dailyBreakdownMap[dateStr] = { date: dateStr, receivedKg: 0, rejectedKg: 0, acts: [] }
        }
        s.dailyBreakdownMap[dateStr].receivedKg += accQty + rejQty
        s.dailyBreakdownMap[dateStr].rejectedKg += rejQty
        s.dailyBreakdownMap[dateStr].acts.push(actItem)
      }
    })

    // E. Stage D — Final Quality Control before Customer Dispatch (ShippingLog)
    let totalFinalQcCheckedKg = 0
    let totalFinalQcApprovedKg = 0
    let totalFinalQcRejectedKg = 0
    shippingLogs.forEach((sh) => {
      const w = toNum(sh.weight)
      if (w <= 0) return
      const p = getOrInitProd(sh.productName)
      p.stages.finalQc.checkedKg += w
      totalFinalQcCheckedKg += w
      if (sh.finalQcStatus === 'REJECTED') {
        p.stages.finalQc.rejectedKg += w
        totalFinalQcRejectedKg += w
      } else {
        p.stages.finalQc.approvedKg += w
        totalFinalQcApprovedKg += w
      }
    })

    // Calculate Relevant Operational Days in Period (Formula A)
    const totalOperationalDays = operationalDaysSet.size
    let calendarDays = totalOperationalDays
    if (dateFrom && dateTo) {
      const ms = new Date(dateTo).getTime() - new Date(dateFrom).getTime()
      if (ms >= 0) calendarDays = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
    }

    // 4. Umumiy (Global) KPI va Mahsulot Balansi Jadvallarini Hisoblash (Requirements 3, 4, 5)
    let totalOpeningStockKg = 0
    let totalRawInflowKg = 0
    let totalRejectedIncomingKg = 0
    let totalConsumedRawKg = 0
    let totalFinishedGoodsKg = 0
    let totalActualDefectKg = 0
    let totalNaturalTechWasteKg = 0
    let totalCurrentStockKg = 0

    let stockOutCount = 0
    let stockLowCount = 0
    let stockSufficientCount = 0
    let stockExcessCount = 0

    const productBalances = Object.values(productStats).map((item) => {
      const k = norm(item.productName)
      const cfg = productConfigMap.get(k)
      const std = standardsMap.get(k)

      // Fallback current usable stock calculation if ShopExpense end balance wasn't explicitly set
      const usableStockKg = item.hasEndStockRecorded
        ? item.currentStockKg
        : Math.max(0, item.openingStockKg + item.inflowKg - item.consumedKg - item.stages.storage.defectKg)

      // Natural technological waste: if not explicitly logged in ExecutiveWastageLog, derive from (consumedKg - outputKg - processingDefectKg)
      const derivedTechWasteKg =
        item.techWasteKg > 0
          ? item.techWasteKg
          : item.consumedKg > item.outputKg
            ? Math.max(0, item.consumedKg - item.outputKg - item.stages.processing.defectKg)
            : 0

      totalOpeningStockKg += item.openingStockKg
      totalRawInflowKg += item.inflowKg
      totalRejectedIncomingKg += item.rejectedIncomingKg
      totalConsumedRawKg += item.consumedKg
      totalFinishedGoodsKg += item.outputKg
      totalActualDefectKg += item.actualDefectKg
      totalNaturalTechWasteKg += derivedTechWasteKg
      totalCurrentStockKg += usableStockKg

      // Requirement 5: Total Available Raw Materials, Stock-Relative Output %, Production Yield %
      const totalAvailableRawKg = item.openingStockKg + item.inflowKg
      const stockRelativeOutputPercent =
        totalAvailableRawKg > 0 && item.outputKg > 0
          ? Number(((item.outputKg / totalAvailableRawKg) * 100).toFixed(2))
          : null

      const consumptionBase = item.consumedKg > 0 ? item.consumedKg : (item.inflowKg > 0 ? item.inflowKg : 0)
      const productionYieldPercent =
        consumptionBase > 0 && item.outputKg > 0
          ? Number(((item.outputKg / consumptionBase) * 100).toFixed(2))
          : null

      const totalLossKg = item.actualDefectKg + derivedTechWasteKg
      const lossBase = consumptionBase > 0 ? consumptionBase : (item.outputKg + totalLossKg)

      const actualLossPercent = lossBase > 0 ? Number(((totalLossKg / lossBase) * 100).toFixed(2)) : null
      const actualDefectPercent = lossBase > 0 ? Number(((item.actualDefectKg / lossBase) * 100).toFixed(2)) : null

      // Requirement 3 & 4: Product-Specific Storage Standards & Stock Coverage Formulas A, B, C, D
      let approvedMaxStorageDays = cfg?.maxStorageDays ?? cfg?.shelfLifeDays ?? null
      const sLower = item.productName.toLowerCase()
      if (approvedMaxStorageDays === null) {
        if (sLower.includes('айсберг') || sLower.includes('ayzberg') || sLower.includes('aysberg')) approvedMaxStorageDays = 21
        else if (sLower.includes('томат') || sLower.includes('tomat')) approvedMaxStorageDays = 10
        else if (sLower.includes('лимон') || sLower.includes('limon')) approvedMaxStorageDays = 10
        else if (sLower.includes('сельдер') || sLower.includes('seldre')) approvedMaxStorageDays = 3
      }
      const minStockThresholdKg = cfg?.minStockLevel && cfg.minStockLevel > 0 ? cfg.minStockLevel : null

      const prodOperationalDays = item.activeConsumptionDays.size || totalOperationalDays
      // Formula A: Average Daily & Weekly Consumption
      const avgDailyConsumptionKg =
        prodOperationalDays > 0 && item.consumedKg > 0
          ? Number((item.consumedKg / prodOperationalDays).toFixed(2))
          : null
      const avgWeeklyConsumptionKg =
        avgDailyConsumptionKg !== null ? Number((avgDailyConsumptionKg * 7).toFixed(2)) : null

      // Formula B: Maximum Inventory Target
      const maxRecommendedInventoryKg =
        cfg?.maxRecommendedStock && cfg.maxRecommendedStock > 0
          ? cfg.maxRecommendedStock
          : avgDailyConsumptionKg !== null && approvedMaxStorageDays !== null
            ? Number((avgDailyConsumptionKg * approvedMaxStorageDays).toFixed(1))
            : null

      // Formula C: Stock Coverage (days)
      const stockCoverageDays =
        avgDailyConsumptionKg !== null && avgDailyConsumptionKg > 0
          ? Number((usableStockKg / avgDailyConsumptionKg).toFixed(1))
          : null

      // Formula D: Weekly Stock Coverage (weeks)
      const stockCoverageWeeks =
        avgWeeklyConsumptionKg !== null && avgWeeklyConsumptionKg > 0
          ? Number((usableStockKg / avgWeeklyConsumptionKg).toFixed(2))
          : null

      const lowCoverageDaysThreshold = approvedMaxStorageDays !== null
        ? Math.max(1.0, Number((approvedMaxStorageDays * 0.25).toFixed(1)))
        : 1.5

      // Inventory Status (OUT_OF_STOCK, LOW, SUFFICIENT, EXCESS)
      let inventoryStatus: 'OUT_OF_STOCK' | 'LOW' | 'SUFFICIENT' | 'EXCESS' = 'SUFFICIENT'
      if (usableStockKg <= 0) {
        inventoryStatus = 'OUT_OF_STOCK'
        stockOutCount++
      } else if (
        (approvedMaxStorageDays !== null && stockCoverageDays !== null && stockCoverageDays > approvedMaxStorageDays) ||
        (maxRecommendedInventoryKg !== null && usableStockKg > maxRecommendedInventoryKg)
      ) {
        inventoryStatus = 'EXCESS'
        stockExcessCount++
      } else if (
        (minStockThresholdKg !== null && usableStockKg <= minStockThresholdKg) ||
        (stockCoverageDays !== null && stockCoverageDays <= lowCoverageDaysThreshold)
      ) {
        inventoryStatus = 'LOW'
        stockLowCount++
      } else {
        inventoryStatus = 'SUFFICIENT'
        stockSufficientCount++
      }

      // Me'yor va og'ish statusi
      const standardLossPercent = std?.processingNormPercent ?? null
      const criticalThreshold = std?.criticalThreshold ?? null

      let variancePercent: number | null = null
      let status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA'

      if (actualLossPercent !== null && standardLossPercent !== null && criticalThreshold !== null) {
        variancePercent = Number((actualLossPercent - standardLossPercent).toFixed(2))
        if (variancePercent > criticalThreshold) {
          status = 'CRITICAL'
        } else if (variancePercent > 0) {
          status = 'WARNING'
        } else {
          status = 'NORMAL'
        }
      }

      return {
        productName: item.productName,
        unit: item.unit,
        openingStockKg: Number(item.openingStockKg.toFixed(1)),
        inflowKg: Number(item.inflowKg.toFixed(1)),
        rejectedIncomingKg: Number(item.rejectedIncomingKg.toFixed(1)),
        totalAvailableRawKg: Number(totalAvailableRawKg.toFixed(1)),
        consumedKg: Number(item.consumedKg.toFixed(1)),
        outputKg: Number(item.outputKg.toFixed(1)),
        techWasteKg: Number(derivedTechWasteKg.toFixed(1)),
        actualDefectKg: Number(item.actualDefectKg.toFixed(1)),
        currentStockKg: Number(usableStockKg.toFixed(1)),
        // Requirement 3 & 4 fields
        approvedMaxStorageDays,
        minStockThresholdKg,
        operationalDaysCount: prodOperationalDays,
        avgDailyConsumptionKg,
        avgWeeklyConsumptionKg,
        maxRecommendedInventoryKg,
        stockCoverageDays,
        stockCoverageWeeks,
        inventoryStatus,
        // Requirement 5 fields
        stockRelativeOutputPercent,
        productionYieldPercent,
        yieldPercent: productionYieldPercent,
        // Loss norms
        standardLossPercent,
        actualLossPercent,
        actualDefectPercent,
        variancePercent,
        status,
        stages: {
          ...item.stages,
          processing: {
            ...item.stages.processing,
            techWasteKg: Number(derivedTechWasteKg.toFixed(1)),
          },
        },
      }
    })

    // Global Yield, Stock-Relative Output & Defect foizlari (Requirement 5)
    const globalTotalAvailableRawKg = totalOpeningStockKg + totalRawInflowKg
    const globalStockRelativeOutputPercent =
      globalTotalAvailableRawKg > 0 && totalFinishedGoodsKg > 0
        ? Number(((totalFinishedGoodsKg / globalTotalAvailableRawKg) * 100).toFixed(2))
        : null

    const globalConsumptionBase =
      totalConsumedRawKg > 0
        ? totalConsumedRawKg
        : totalRawInflowKg > 0
          ? totalRawInflowKg
          : totalFinishedGoodsKg + totalActualDefectKg + totalNaturalTechWasteKg

    const overallYieldPercent =
      globalConsumptionBase > 0 && totalFinishedGoodsKg > 0
        ? Number(((totalFinishedGoodsKg / globalConsumptionBase) * 100).toFixed(2))
        : null
    const actualDefectPercent =
      globalConsumptionBase > 0 ? Number(((totalActualDefectKg / globalConsumptionBase) * 100).toFixed(2)) : null
    const naturalTechWastePercent =
      globalConsumptionBase > 0 ? Number(((totalNaturalTechWasteKg / globalConsumptionBase) * 100).toFixed(2)) : null

    // 5. O'tgan davr bilan real taqqoslash (Period Comparison)
    let previousPeriodDiff: {
      inflowDiffPercent: number | null
      outputDiffPercent: number | null
      defectDiffPercent: number | null
    } | null = null

    if (dateFrom && dateTo) {
      const curStart = new Date(dateFrom).getTime()
      const curEnd = new Date(dateTo).getTime()
      const diffMs = curEnd - curStart

      if (diffMs > 0) {
        const prevEnd = new Date(curStart - 24 * 60 * 60 * 1000)
        const prevStart = new Date(prevEnd.getTime() - diffMs)
        const pStartStr = prevStart.toISOString().slice(0, 10)
        const pEndStr = prevEnd.toISOString().slice(0, 10)

        const [prevArrivals, prevExpenses, prevWastage] = await Promise.all([
          prisma.shopArrival.findMany({ where: { date: { gte: pStartStr, lte: pEndStr } } }),
          prisma.shopExpense.findMany({ where: { date: { gte: pStartStr, lte: pEndStr } } }),
          prisma.executiveWastageLog.findMany({ where: { incidentDate: { gte: pStartStr, lte: pEndStr }, isCancelled: false } }),
        ])

        const prevInflow = prevArrivals.reduce((acc, a) => acc + toNum(a.quantity), 0)
        let prevOutput = 0
        prevExpenses.forEach((e) => {
          const outputs = (e.outputs || {}) as Record<string, any>
          for (const v of Object.values(outputs)) {
            prevOutput += typeof v === 'object' && v !== null ? toNum(v.kg ?? v.val) : toNum(v)
          }
        })
        const prevDefect = prevWastage.reduce((acc, w) => acc + (w.wastageType === 'ACTUAL_DEFECT' ? toNum(w.weightKg) : 0), 0)

        const calcDelta = (cur: number, prev: number) => {
          if (prev <= 0) return null
          return Number((((cur - prev) / prev) * 100).toFixed(1))
        }

        previousPeriodDiff = {
          inflowDiffPercent: calcDelta(totalRawInflowKg, prevInflow),
          outputDiffPercent: calcDelta(totalFinishedGoodsKg, prevOutput),
          defectDiffPercent: calcDelta(totalActualDefectKg, prevDefect),
        }
      }
    }

    // 6. Supplier Defect Analysis Hierarchy (Requirement 8)
    const supplierDefectAnalysis = Array.from(supplierSummaryMap.values())
      .map((s) => ({
        supplierName: s.supplierName,
        totalReceivedKg: Number(s.totalReceivedKg.toFixed(1)),
        acceptedKg: Number(s.acceptedKg.toFixed(1)),
        rejectedKg: Number(s.rejectedKg.toFixed(1)),
        rejectionRatePercent: s.totalReceivedKg > 0 ? Number(((s.rejectedKg / s.totalReceivedKg) * 100).toFixed(2)) : 0,
        totalDeliveriesCount: s.totalDeliveriesCount,
        rejectedActsCount: s.rejectedActsCount,
        reasons: s.reasonsMap,
        dailyBreakdown: Object.values(s.dailyBreakdownMap).sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.rejectedKg - a.rejectedKg || b.totalReceivedKg - a.totalReceivedKg)

    // 7. FIFO / FEFO Queue & Controlled Exceptions Summary (Requirement 1)
    const fifoExceptions = stockTransfers
      .filter((tr) => tr.isFifoException)
      .map((tr) => ({
        id: tr.id,
        transferNumber: tr.transferNumber,
        productName: tr.product?.name || 'Xomashyo',
        issuedQuantity: tr.issuedQuantity,
        unit: tr.issuedUnit,
        originalFifoBatchNumber: tr.originalFifoBatchNumber || "Noma'lum",
        selectedBatchNumber: tr.batch?.batchNumber || "Noma'lum",
        exceptionReason: tr.exceptionReason || '',
        authorizedByQcName: tr.authorizedByQcName || 'QC Inspektori',
        executedByWarehouseManager: tr.issuedByName || 'Ombor mudiri',
        timestamp: (tr.exceptionTimestamp || tr.issuedAt).toISOString(),
        evidenceUrl: tr.exceptionEvidenceUrl || null,
      }))

    // Saralash: Me'yordan eng ko'p og'ish bo'lgan (va eng ko'p kirim bo'lgan) mahsulotlar ketma-ketlikda ko'pdan kamga qarab
    productBalances.sort((a, b) => {
      const varA = a.variancePercent !== null ? a.variancePercent : -999999
      const varB = b.variancePercent !== null ? b.variancePercent : -999999
      if (Math.abs(varB - varA) > 0.001) return varB - varA
      return b.inflowKg - a.inflowKg
    })

    return NextResponse.json({
      success: true,
      hasData: productBalances.length > 0 || totalRawInflowKg > 0,
      period: {
        from: dateFrom || 'Boshi',
        to: dateTo || 'Oxiri',
        operationalDays: totalOperationalDays,
        calendarDays,
      },
      kpis: {
        openingUsableStockKg: Number(totalOpeningStockKg.toFixed(1)),
        totalRawMaterialInKg: Number(totalRawInflowKg.toFixed(1)),
        rejectedIncomingKg: Number(totalRejectedIncomingKg.toFixed(1)),
        totalAvailableRawMaterialsKg: Number(globalTotalAvailableRawKg.toFixed(1)),
        totalConsumedRawKg: Number(totalConsumedRawKg.toFixed(1)),
        totalFinishedGoodsKg: Number(totalFinishedGoodsKg.toFixed(1)),
        stockRelativeOutputPercent: globalStockRelativeOutputPercent,
        productionYieldPercent: overallYieldPercent,
        overallYieldPercent,
        actualDefectKg: Number(totalActualDefectKg.toFixed(1)),
        actualDefectPercent,
        naturalTechWasteKg: Number(totalNaturalTechWasteKg.toFixed(1)),
        naturalTechWastePercent,
        currentWarehouseStockKg: Number(totalCurrentStockKg.toFixed(1)),
        inventoryStatusSummary: {
          sufficientCount: stockSufficientCount,
          lowCount: stockLowCount,
          outOfStockCount: stockOutCount,
          excessCount: stockExcessCount,
        },
        finalQcSummary: {
          checkedKg: Number(totalFinalQcCheckedKg.toFixed(1)),
          approvedKg: Number(totalFinalQcApprovedKg.toFixed(1)),
          rejectedKg: Number(totalFinalQcRejectedKg.toFixed(1)),
        },
        fifoExceptionsCount: fifoExceptions.length,
        previousPeriodDiff,
      },
      productBalances,
      supplierDefectAnalysis,
      fifoExceptions,
      activeFifoQueue: inventoryBatches.slice(0, 50).map((b) => ({
        batchId: b.id,
        batchNumber: b.batchNumber,
        productName: b.product?.name || 'Xomashyo',
        supplierName: b.supplier?.name || "Ta'minotchi",
        quantity: b.quantity,
        unit: b.product?.unit || 'kg',
        receivedAt: b.receivedAt.toISOString().slice(0, 10),
        expirationDate: b.expirationDate ? b.expirationDate.toISOString().slice(0, 10) : null,
      })),
      totalCount: productBalances.length,
    })
  } catch (error: any) {
    console.error('Executive overview error:', error)
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

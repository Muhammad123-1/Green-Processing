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
    const filterProduct = searchParams.get('product') || ''

    // 1. Sanalar filtri
    const arrivalWhere: any = {}
    const expenseWhere: any = {}
    const wastageWhere: any = { isCancelled: false }
    const actWhere: any = {}

    if (dateFrom && dateTo) {
      arrivalWhere.date = { gte: dateFrom, lte: dateTo }
      expenseWhere.date = { gte: dateFrom, lte: dateTo }
      wastageWhere.incidentDate = { gte: dateFrom, lte: dateTo }
      actWhere.actDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      arrivalWhere.date = { gte: dateFrom }
      expenseWhere.date = { gte: dateFrom }
      wastageWhere.incidentDate = { gte: dateFrom }
      actWhere.actDate = { gte: dateFrom }
    } else if (dateTo) {
      arrivalWhere.date = { lte: dateTo }
      expenseWhere.date = { lte: dateTo }
      wastageWhere.incidentDate = { lte: dateTo }
      actWhere.actDate = { lte: dateTo }
    }

    // 2. Parallel ravishda bazadan barcha operatsion ma'lumotlarni olish
    const [
      arrivals,
      expenses,
      wastageLogs,
      incomingActs,
      standards,
      dbProducts,
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
        select: { id: true, name: true, unit: true, category: true },
      }),
    ])

    // Standards Map (nomi bo'yicha)
    const standardsMap = new Map<string, (typeof standards)[0]>()
    standards.forEach((s) => standardsMap.set(norm(s.productName), s))

    // 3. Mahsulotlar bo'yicha guruhlash va hisoblash
    const productStats: Record<string, {
      productName: string
      unit: string
      inflowKg: number
      outputKg: number
      techWasteKg: number
      actualDefectKg: number
      currentStockKg: number
      stages: {
        incoming: { defectKg: number; reasons: Record<string, number>; suppliers: Record<string, number> }
        processing: { techWasteKg: number; defectKg: number; reasons: Record<string, number> }
        storage: { defectKg: number; reasons: Record<string, number> }
      }
    }> = {}

    const getOrInitProd = (name: string) => {
      const clean = name.trim()
      const k = norm(clean)
      if (!productStats[k]) {
        productStats[k] = {
          productName: clean,
          unit: 'kg',
          inflowKg: 0,
          outputKg: 0,
          techWasteKg: 0,
          actualDefectKg: 0,
          currentStockKg: 0,
          stages: {
            incoming: { defectKg: 0, reasons: {}, suppliers: {} },
            processing: { techWasteKg: 0, defectKg: 0, reasons: {} },
            storage: { defectKg: 0, reasons: {} },
          },
        }
      }
      return productStats[k]
    }

    // A. Kirim (ShopArrival)
    arrivals.forEach((a) => {
      if (!a.nomenclature || toNum(a.quantity) <= 0) return
      const p = getOrInitProd(a.nomenclature)
      p.inflowKg += toNum(a.quantity)
    })

    // B. Chiqim va Tayyor mahsulot (ShopExpense)
    expenses.forEach((e) => {
      // 1. Qayta ishlashga sarflangan materiallar
      const materials = (e.materials || {}) as Record<string, any>
      for (const [matName, val] of Object.entries(materials)) {
        const num = toNum(val)
        if (num > 0) {
          const p = getOrInitProd(matName)
          // Masalan sarflangan xomashyo
          // techWaste bu sarf va chiqim o'rtasidagi farq yoki texnologik chiqindi
        }
      }

      // 2. Tayyor mahsulot (outputs)
      const outputs = (e.outputs || {}) as Record<string, any>
      for (const [outName, val] of Object.entries(outputs)) {
        const kg = typeof val === 'object' && val !== null ? toNum(val.kg ?? val.val) : toNum(val)
        if (kg > 0) {
          // Mos keluvchi xomashyoga bog'lash (masalan "Салат Айсберг нарезанный" -> "Салат Айсберг")
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

      // 3. Kunlik hisobot qoldiqlari
      const balances = (e.balances || {}) as Record<string, any>
      const endBalances = balances?.end || {}
      for (const [rawName, val] of Object.entries(endBalances)) {
        const num = toNum(val)
        if (num >= 0) {
          const p = getOrInitProd(rawName)
          p.currentStockKg = num // oxirgi saqlangan qoldiq
        }
      }
    })

    // C. Executive Wastage Logs (Brak jurnali)
    wastageLogs.forEach((w) => {
      const p = getOrInitProd(w.productName)
      const kg = toNum(w.weightKg)
      if (kg <= 0) return

      if (w.wastageType === 'NATURAL_TECH_WASTE') {
        p.techWasteKg += kg
        p.stages.processing.techWasteKg += kg
      } else {
        // ACTUAL_DEFECT
        p.actualDefectKg += kg

        if (w.stage === 'INCOMING') {
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

    // D. Incoming Acts braklari (agar rad etilgan yoki brak bo'lsa)
    incomingActs.forEach((act) => {
      const isRejected = act.decisionRating === 2 || (act.decisionText || '').toLowerCase().includes('rad')
      const hasDefect = act.internalOxidation === 1 || act.rotDiseases === 1 || act.noMechanicalDamage === 0
      if (act.productName && (isRejected || hasDefect)) {
        const p = getOrInitProd(act.productName)
        const dKg = isRejected ? toNum(act.warehouseKg) : 0
        if (dKg > 0) {
          p.actualDefectKg += dKg
          p.stages.incoming.defectKg += dKg
          const r = act.decisionText || (act.rotDiseases === 1 ? 'Chirish kasalligi' : 'Qabulda rad etilgan')
          p.stages.incoming.reasons[r] = (p.stages.incoming.reasons[r] || 0) + dKg
          if (act.supplierName) {
            p.stages.incoming.suppliers[act.supplierName] = (p.stages.incoming.suppliers[act.supplierName] || 0) + dKg
          }
        }
      }
    })

    // 4. Umumiy (Global) KPI larni hisoblash
    let totalRawInflowKg = 0
    let totalFinishedGoodsKg = 0
    let totalActualDefectKg = 0
    let totalNaturalTechWasteKg = 0
    let totalCurrentStockKg = 0

    // Mahsulotlar jadvali uchun qatorlarni yig'ish
    const productBalances = Object.values(productStats).map((item) => {
      totalRawInflowKg += item.inflowKg
      totalFinishedGoodsKg += item.outputKg
      totalActualDefectKg += item.actualDefectKg
      totalNaturalTechWasteKg += item.techWasteKg
      totalCurrentStockKg += item.currentStockKg

      const totalLossKg = item.actualDefectKg + item.techWasteKg
      const lossBase = item.inflowKg > 0 ? item.inflowKg : (item.outputKg + totalLossKg)

      // Foizlar: maxraj 0 bo'lsa null (NO_DATA)
      const actualLossPercent = lossBase > 0 ? (totalLossKg / lossBase) * 100 : null
      const actualDefectPercent = lossBase > 0 ? (item.actualDefectKg / lossBase) * 100 : null
      const yieldPercent = lossBase > 0 && item.outputKg > 0 ? (item.outputKg / lossBase) * 100 : null

      // Me'yor va status
      const std = standardsMap.get(norm(item.productName))
      const standardLossPercent = std?.processingNormPercent ?? 12.0
      const criticalThreshold = std?.criticalThreshold ?? 5.0

      let variancePercent: number | null = null
      let status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA'

      if (actualLossPercent !== null) {
        variancePercent = actualLossPercent - standardLossPercent
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
        inflowKg: Number(item.inflowKg.toFixed(1)),
        outputKg: Number(item.outputKg.toFixed(1)),
        techWasteKg: Number(item.techWasteKg.toFixed(1)),
        actualDefectKg: Number(item.actualDefectKg.toFixed(1)),
        currentStockKg: Number(item.currentStockKg.toFixed(1)),
        standardLossPercent,
        actualLossPercent: actualLossPercent !== null ? Number(actualLossPercent.toFixed(2)) : null,
        actualDefectPercent: actualDefectPercent !== null ? Number(actualDefectPercent.toFixed(2)) : null,
        yieldPercent: yieldPercent !== null ? Number(yieldPercent.toFixed(2)) : null,
        variancePercent: variancePercent !== null ? Number(variancePercent.toFixed(2)) : null,
        status,
        stages: item.stages,
      }
    })

    // Global Yield va Defect foizlari
    const globalBase = totalRawInflowKg > 0 ? totalRawInflowKg : (totalFinishedGoodsKg + totalActualDefectKg + totalNaturalTechWasteKg)
    const overallYieldPercent = globalBase > 0 && totalFinishedGoodsKg > 0 ? (totalFinishedGoodsKg / globalBase) * 100 : null
    const actualDefectPercent = globalBase > 0 ? (totalActualDefectKg / globalBase) * 100 : null
    const naturalTechWastePercent = globalBase > 0 ? (totalNaturalTechWasteKg / globalBase) * 100 : null

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
      period: { from: dateFrom || 'Boshi', to: dateTo || 'Oxiri' },
      kpis: {
        totalRawMaterialInKg: Number(totalRawInflowKg.toFixed(1)),
        totalFinishedGoodsKg: Number(totalFinishedGoodsKg.toFixed(1)),
        overallYieldPercent: overallYieldPercent !== null ? Number(overallYieldPercent.toFixed(2)) : null,
        actualDefectKg: Number(totalActualDefectKg.toFixed(1)),
        actualDefectPercent: actualDefectPercent !== null ? Number(actualDefectPercent.toFixed(2)) : null,
        naturalTechWasteKg: Number(totalNaturalTechWasteKg.toFixed(1)),
        naturalTechWastePercent: naturalTechWastePercent !== null ? Number(naturalTechWastePercent.toFixed(2)) : null,
        currentWarehouseStockKg: Number(totalCurrentStockKg.toFixed(1)),
        previousPeriodDiff,
      },
      productBalances,
      totalCount: productBalances.length,
    })
  } catch (error: any) {
    console.error('Executive overview error:', error)
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

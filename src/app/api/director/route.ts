import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Configurable thresholds from query or defaults
    const discrepancyThreshold = parseFloat(searchParams.get('discrepancyThreshold') || '3') // %
    const minYieldThreshold = parseFloat(searchParams.get('minYieldThreshold') || '85') // %
    const maxRejectThreshold = parseFloat(searchParams.get('maxRejectThreshold') || '10') // %

    // Calculate date filter
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date = new Date()

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
    } else if (period === 'custom' && from) {
      startDate = new Date(from + 'T00:00:00')
      if (to) {
        endDate = new Date(to + 'T23:59:59.999')
      }
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}

    // Parallel queries across all operational departments
    const [
      users,
      inspections,
      totalInspectionsCount,
      dailyChecklists,
      totalChecklistsCount,
      stockTransfers,
      products,
      productionOrders,
      salesOrders,
      shopArrivals,
      surveys,
      logs,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.inspection.findMany({
        where: dateFilter,
        include: {
          supplier: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.inspection.count({ where: dateFilter }),
      prisma.dailyQCChecklist.findMany({
        where: dateFilter,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.dailyQCChecklist.count({ where: dateFilter }),
      prisma.stockTransfer.findMany({
        where: dateFilter,
        include: {
          product: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          unit: true,
          minStockLevel: true,
          batches: {
            select: { id: true, batchNumber: true, quantity: true, qcStatus: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.productionOrder.findMany({
        where: dateFilter,
        include: {
          recipe: { include: { outputProduct: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.salesOrder.findMany({
        where: dateFilter,
        include: {
          customer: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.shopArrival.findMany({
        orderBy: { id: 'desc' },
        take: 100,
      }),
      prisma.survey.findMany({
        include: {
          responses: {
            include: { answers: true },
            take: 50,
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.log.findMany({
        where: dateFilter,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])

    // -------------------------------------------------------------------------
    // 1. ARRIVALS & RAW MATERIAL KPIS
    // -------------------------------------------------------------------------
    let totalArrivalQuantityKg = 0
    let acceptedArrivalQuantityKg = 0
    let rejectedArrivalQuantityKg = 0
    let rejectedCount = 0

    inspections.forEach((insp) => {
      const q = insp.quantity || 0
      totalArrivalQuantityKg += q
      if (insp.status === 'ACCEPTED') {
        acceptedArrivalQuantityKg += q
      } else if (insp.status === 'REJECTED') {
        rejectedArrivalQuantityKg += q
        rejectedCount++
      } else {
        acceptedArrivalQuantityKg += insp.releasedQuantity || q
      }
    })

    // If inspections table is empty, compute from shop arrivals
    if (totalArrivalQuantityKg === 0 && shopArrivals.length > 0) {
      shopArrivals.forEach((sa) => {
        totalArrivalQuantityKg += sa.quantity || 0
      })
      acceptedArrivalQuantityKg = totalArrivalQuantityKg
    }

    const arrivalRejectionRate =
      totalArrivalQuantityKg > 0 ? (rejectedArrivalQuantityKg / totalArrivalQuantityKg) * 100 : 0

    // -------------------------------------------------------------------------
    // 2. PRODUCTION & DAILY QC CHECKLIST KPIS
    // -------------------------------------------------------------------------
    let totalOutputBoxes = 0
    let totalChecklistRejectedKg = 0

    dailyChecklists.forEach((chk) => {
      totalOutputBoxes += chk.totalOutputBox || 0
      totalChecklistRejectedKg += chk.rejectedKg || 0
    })

    let totalPlannedOutput = 0
    let totalActualOutput = 0
    let avgYieldPercent = 0
    let yieldCount = 0

    productionOrders.forEach((po) => {
      totalPlannedOutput += po.plannedOutput || 0
      totalActualOutput += po.actualOutput || 0
      if (po.yieldPercent) {
        avgYieldPercent += po.yieldPercent
        yieldCount++
      }
    })
    avgYieldPercent = yieldCount > 0 ? avgYieldPercent / yieldCount : 0

    // -------------------------------------------------------------------------
    // 3. WAREHOUSE & STOCK STATUS (TRAFFIC LIGHT)
    // -------------------------------------------------------------------------
    let sufficientCount = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    const productStockDetails = products.map((prod) => {
      const currentStock = prod.batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
      const minStock = prod.minStockLevel || 0

      let status: 'SUFFICIENT' | 'LOW' | 'OUT_OF_STOCK' = 'SUFFICIENT'
      if (currentStock <= 0) {
        status = 'OUT_OF_STOCK'
        outOfStockCount++
      } else if (minStock > 0 && currentStock <= minStock) {
        status = 'LOW'
        lowStockCount++
      } else {
        sufficientCount++
      }

      return {
        id: prod.id,
        name: prod.name,
        unit: prod.unit || 'kg',
        currentStock,
        minStock,
        status,
        batchCount: prod.batches.length,
      }
    })

    // Stock transfers discrepancy calculation
    let totalTransfersIssuedKg = 0
    let totalTransfersReceivedKg = 0
    let totalTransfersDiscrepancyKg = 0

    stockTransfers.forEach((tr) => {
      totalTransfersIssuedKg += tr.issuedQuantity || 0
      totalTransfersReceivedKg += tr.receivedQuantity || 0
      totalTransfersDiscrepancyKg += tr.discrepancy || 0
    })

    // -------------------------------------------------------------------------
    // 4. SALES & SHIPMENTS
    // -------------------------------------------------------------------------
    let totalSalesRevenue = 0
    salesOrders.forEach((so) => {
      if (so.status !== 'CANCELLED') {
        totalSalesRevenue += so.totalAmount || 0
      }
    })

    // -------------------------------------------------------------------------
    // 5. SURVEYS & CUSTOMER SATISFACTION
    // -------------------------------------------------------------------------
    let totalSurveyResponses = 0
    let totalSurveyRatingSum = 0
    let totalSurveyRatingCount = 0

    surveys.forEach((s) => {
      s.responses.forEach((resp) => {
        totalSurveyResponses++
        resp.answers.forEach((ans) => {
          const val = parseFloat(ans.answerValue)
          if (!isNaN(val) && val >= 1 && val <= 5) {
            totalSurveyRatingSum += val
            totalSurveyRatingCount++
          }
        })
      })
    })

    const avgSurveyRating =
      totalSurveyRatingCount > 0 ? totalSurveyRatingSum / totalSurveyRatingCount : 0
    const surveySatisfactionPercent = (avgSurveyRating / 5) * 100

    // -------------------------------------------------------------------------
    // 6. EMPLOYEE ACTIVITY SUMMARY ("KIM NIMA ISH QILGAN")
    // -------------------------------------------------------------------------
    const employeeActivityMap: Record<
      number,
      {
        userId: number
        name: string
        username: string
        role: string
        inspectionsCount: number
        checklistsCount: number
        transfersCount: number
        logsCount: number
        totalActions: number
        lastActionAt: string | null
      }
    > = {}

    users.forEach((u) => {
      employeeActivityMap[u.id] = {
        userId: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        inspectionsCount: 0,
        checklistsCount: 0,
        transfersCount: 0,
        logsCount: 0,
        totalActions: 0,
        lastActionAt: null,
      }
    })

    inspections.forEach((insp) => {
      if (insp.inspectorId && employeeActivityMap[insp.inspectorId]) {
        employeeActivityMap[insp.inspectorId].inspectionsCount++
        employeeActivityMap[insp.inspectorId].totalActions++
        if (
          !employeeActivityMap[insp.inspectorId].lastActionAt ||
          new Date(insp.createdAt) > new Date(employeeActivityMap[insp.inspectorId].lastActionAt!)
        ) {
          employeeActivityMap[insp.inspectorId].lastActionAt = insp.createdAt.toISOString()
        }
      }
    })

    dailyChecklists.forEach((chk) => {
      if (chk.inspectorId && employeeActivityMap[chk.inspectorId]) {
        employeeActivityMap[chk.inspectorId].checklistsCount++
        employeeActivityMap[chk.inspectorId].totalActions++
        if (
          !employeeActivityMap[chk.inspectorId].lastActionAt ||
          new Date(chk.createdAt) > new Date(employeeActivityMap[chk.inspectorId].lastActionAt!)
        ) {
          employeeActivityMap[chk.inspectorId].lastActionAt = chk.createdAt.toISOString()
        }
      }
    })

    stockTransfers.forEach((tr) => {
      if (tr.issuedById && employeeActivityMap[tr.issuedById]) {
        employeeActivityMap[tr.issuedById].transfersCount++
        employeeActivityMap[tr.issuedById].totalActions++
      }
      if (tr.receivedById && employeeActivityMap[tr.receivedById]) {
        employeeActivityMap[tr.receivedById].transfersCount++
        employeeActivityMap[tr.receivedById].totalActions++
      }
    })

    logs.forEach((lg) => {
      if (lg.userId && employeeActivityMap[lg.userId]) {
        employeeActivityMap[lg.userId].logsCount++
        employeeActivityMap[lg.userId].totalActions++
        if (
          !employeeActivityMap[lg.userId].lastActionAt ||
          new Date(lg.createdAt) > new Date(employeeActivityMap[lg.userId].lastActionAt!)
        ) {
          employeeActivityMap[lg.userId].lastActionAt = lg.createdAt.toISOString()
        }
      }
    })

    const employeeStats = Object.values(employeeActivityMap).sort(
      (a, b) => b.totalActions - a.totalActions
    )

    // -------------------------------------------------------------------------
    // 7. SUSPICIOUS ALERTS EVALUATION
    // -------------------------------------------------------------------------
    interface AlertItem {
      id: string
      type: 'CRITICAL' | 'WARNING' | 'ATTENTION'
      section: string
      title: string
      description: string
      responsiblePerson: string
      date: string
      value: string
      threshold: string
    }

    const alerts: AlertItem[] = []

    // A. Stock transfer discrepancy alerts
    stockTransfers.forEach((tr) => {
      const issued = tr.issuedQuantity || 0
      const disc = tr.discrepancy || 0
      if (issued > 0 && disc > 0) {
        const pct = (disc / issued) * 100
        if (pct >= discrepancyThreshold) {
          alerts.push({
            id: `transfer-${tr.id}`,
            type: 'CRITICAL',
            section: 'Ombor',
            title: `Ombordan berishda nomuvofiqlik (kamomad: ${pct.toFixed(1)}%)`,
            description: `${tr.product?.name || 'Mahsulot'}: Sklad chiqardi ${issued} ${tr.issuedUnit}, oshxona/tsex qabul qildi ${tr.receivedQuantity} ${tr.issuedUnit}. Kamomad farqi: ${disc} ${tr.issuedUnit}. Sababi: ${tr.discrepancyReason || "Izoh yo'q"}`,
            responsiblePerson: tr.issuedByName || tr.receivedByName || 'Omborchi',
            date: tr.createdAt.toISOString(),
            value: `${pct.toFixed(1)}% (${disc} kg)`,
            threshold: `${discrepancyThreshold}%`,
          })
        }
      }
    })

    // B. Production yield drop alerts
    productionOrders.forEach((po) => {
      if (po.yieldPercent && po.yieldPercent < minYieldThreshold) {
        alerts.push({
          id: `prod-${po.id}`,
          type: 'WARNING',
          section: 'Ishlab chiqarish',
          title: `Chiqish normasi (Yield) past: ${po.yieldPercent}%`,
          description: `Retsept: ${po.recipe?.outputProduct?.name || 'BOM'}. Reja: ${po.plannedOutput}, Amalda: ${po.actualOutput}. Chiqish foizi normadan kam.`,
          responsiblePerson: po.supervisorName || 'Sex ustasi',
          date: po.createdAt.toISOString(),
          value: `${po.yieldPercent}%`,
          threshold: `${minYieldThreshold}%`,
        })
      }
    })

    // C. Daily QC Checklists with high reject
    dailyChecklists.forEach((chk) => {
      if (chk.rejectedKg && chk.rejectedKg > 0 && chk.totalOutputBox) {
        const estTotalKg = chk.totalOutputBox * 10 + chk.rejectedKg
        const rejPct = (chk.rejectedKg / estTotalKg) * 100
        if (rejPct >= maxRejectThreshold) {
          alerts.push({
            id: `qc-chk-${chk.id}`,
            type: 'WARNING',
            section: 'Sifat nazorati',
            title: `Smena davomida yuqori brak darajasi: ${chk.rejectedKg} kg`,
            description: `Smena: ${chk.shift}, Liniya: ${chk.lineName || '1-liniya'}, Partiya №: ${chk.batchNumber || '-'}. Chiqish: ${chk.totalOutputBox} quti, Brak: ${chk.rejectedKg} kg (${rejPct.toFixed(1)}%).`,
            responsiblePerson: chk.inspector || chk.supervisor || 'Nazoratchi',
            date: chk.createdAt.toISOString(),
            value: `${chk.rejectedKg} kg (${rejPct.toFixed(1)}%)`,
            threshold: `${maxRejectThreshold}%`,
          })
        }
      }
    })

    // D. Low / Out of stock alerts
    productStockDetails.forEach((prod) => {
      if (prod.status === 'OUT_OF_STOCK') {
        alerts.push({
          id: `stock-out-${prod.id}`,
          type: 'CRITICAL',
          section: 'Ombor',
          title: `Omborda mahsulot qolmagan: ${prod.name}`,
          description: `Hozirgi qoldiq: 0 ${prod.unit}. Minimal talab: ${prod.minStock} ${prod.unit}. Ishlab chiqarish to'xtab qolish xavfi mavjud.`,
          responsiblePerson: 'Ombor mudiri',
          date: new Date().toISOString(),
          value: `0 ${prod.unit}`,
          threshold: `Min ${prod.minStock} ${prod.unit}`,
        })
      } else if (prod.status === 'LOW') {
        alerts.push({
          id: `stock-low-${prod.id}`,
          type: 'ATTENTION',
          section: 'Ombor',
          title: `Mahsulot minimal me'yordan kamayib ketdi: ${prod.name}`,
          description: `Hozirgi qoldiq: ${prod.currentStock} ${prod.unit}. Minimal belgilangan zaxira: ${prod.minStock} ${prod.unit}. Ta'minotga buyurtma berish lozim.`,
          responsiblePerson: 'Ombor / Ta\'minot',
          date: new Date().toISOString(),
          value: `${prod.currentStock} ${prod.unit}`,
          threshold: `${prod.minStock} ${prod.unit}`,
        })
      }
    })

    return NextResponse.json({
      period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate.toISOString(),
      thresholds: {
        discrepancyThreshold,
        minYieldThreshold,
        maxRejectThreshold,
      },
      kpis: {
        arrivals: {
          totalKg: totalArrivalQuantityKg,
          acceptedKg: acceptedArrivalQuantityKg,
          rejectedKg: rejectedArrivalQuantityKg,
          rejectionRate: arrivalRejectionRate,
          totalCount: totalInspectionsCount || shopArrivals.length,
          rejectedCount,
        },
        production: {
          totalOutputBoxes,
          rejectedKg: totalChecklistRejectedKg,
          checklistsCount: totalChecklistsCount,
          ordersCount: productionOrders.length,
          avgYieldPercent,
          plannedOutput: totalPlannedOutput,
          actualOutput: totalActualOutput,
        },
        warehouse: {
          totalProductsCount: products.length,
          sufficientCount,
          lowStockCount,
          outOfStockCount,
          transfersCount: stockTransfers.length,
          transfersIssuedKg: totalTransfersIssuedKg,
          transfersReceivedKg: totalTransfersReceivedKg,
          transfersDiscrepancyKg: totalTransfersDiscrepancyKg,
        },
        sales: {
          ordersCount: salesOrders.length,
          revenue: totalSalesRevenue,
        },
        surveys: {
          responsesCount: totalSurveyResponses,
          avgRating: avgSurveyRating,
          satisfactionPercent: surveySatisfactionPercent,
        },
        employees: {
          totalUsers: users.length,
          activeUsersWithActions: employeeStats.filter((e) => e.totalActions > 0).length,
        },
      },
      alerts,
      details: {
        productStockDetails,
        recentChecklists: dailyChecklists.slice(0, 30),
        recentInspections: inspections.slice(0, 30),
        recentTransfers: stockTransfers.slice(0, 30),
        recentProductionOrders: productionOrders.slice(0, 30),
        recentSalesOrders: salesOrders.slice(0, 30),
        recentShopArrivals: shopArrivals.slice(0, 30),
        employeeStats,
        recentSurveys: surveys.slice(0, 10),
      },
    })
  } catch (error: any) {
    console.error('Error fetching director dashboard stats:', error)
    return NextResponse.json({ error: error.message || 'Statistikani yuklashda xatolik' }, { status: 500 })
  }
}

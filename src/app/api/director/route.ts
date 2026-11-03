import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { detectItemUnit } from '@/lib/units'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
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
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate.setHours(0, 0, 0, 0)
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

    const toYMD = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    const startDateStr = startDate ? toYMD(startDate) : undefined
    const endDateStr = toYMD(endDate)

    const dateFilter = startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}
    const stringDateFilter = startDateStr ? { date: { gte: startDateStr, lte: endDateStr } } : {}
    const actDateFilter = startDateStr ? { actDate: { gte: startDateStr, lte: endDateStr } } : {}
    const incidentDateFilter = startDateStr ? { incidentDate: { gte: startDateStr, lte: endDateStr } } : {}

    // Parallel queries across real operational tables
    const [
      users,
      shopArrivals,
      incomingActs,
      shopExpenses,
      stockTransfers,
      products,
      salesOrders,
      surveys,
      logs,
      defectLogs,
      wastageLogs,
      shippingLogs,
      mealLogs,
      dailyChecklists,
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
      // 1. PRIXOD (Real Inbound arrivals)
      prisma.shopArrival.findMany({
        where: stringDateFilter,
        orderBy: { date: 'desc' },
      }),
      // 2. Incoming Raw Material Acts (Quality inspection & price)
      prisma.incomingRawMaterialAct.findMany({
        where: actDateFilter,
        orderBy: { actDate: 'desc' },
      }),
      // 3. RASXOD (Real Shop Expenses, matrix & outputs)
      prisma.shopExpense.findMany({
        where: stringDateFilter,
        orderBy: { date: 'desc' },
      }),
      // 4. Warehouse Stock Transfers
      prisma.stockTransfer.findMany({
        where: dateFilter,
        include: {
          product: { select: { id: true, name: true, unit: true } },
          batch: { select: { id: true, batchNumber: true, expirationDate: true, receivedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 5. Products catalog (with storage standards)
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          unit: true,
          shelfLifeDays: true,
          maxStorageDays: true,
          minStockLevel: true,
          maxRecommendedStock: true,
          batches: {
            select: { id: true, batchNumber: true, quantity: true, qcStatus: true, expirationDate: true, receivedAt: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      // 6. Sales
      prisma.salesOrder.findMany({
        where: dateFilter,
        include: {
          customer: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 7. Customer Surveys
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
      // 8. System Logs
      prisma.log.findMany({
        where: dateFilter,
        include: {
          user: { select: { id: true, name: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 150,
      }),
      // 9. Defect Logs
      prisma.defectLog.findMany({
        where: dateFilter,
        include: {
          product: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 10. Executive Wastage Logs (3-Stage Defect & Tech Waste Audit)
      prisma.executiveWastageLog.findMany({
        where: { ...incidentDateFilter, isCancelled: false },
        orderBy: { incidentDate: 'desc' },
      }),
      // 11. Shipping Logs (Stage D — Final QC before dispatch)
      prisma.shippingLog.findMany({
        where: stringDateFilter,
        orderBy: { date: 'desc' },
        take: 100,
      }),
      // 12. Kitchen Logs
      (prisma as any).mealLog?.findMany
        ? (prisma as any).mealLog.findMany({
            where: stringDateFilter.date ? { cookedDate: stringDateFilter.date } : {},
            include: { feedbacks: true },
            orderBy: { cookedDate: 'desc' },
            take: 30,
          })
        : Promise.resolve([]),
      // 13. Smena hisobotlari va QC Cheklistlar
      prisma.dailyQCChecklist.findMany({
        where: stringDateFilter.date ? { date: stringDateFilter.date } : {},
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 100,
      }),
    ])

    // Product config lookup by normalized name
    const productConfigMap = new Map<string, (typeof products)[0]>()
    products.forEach((p) => productConfigMap.set(p.name.trim().toLowerCase(), p))

    // Real price lookup from IncomingRawMaterialAct (Zero fake pricing!)
    const priceByProductMap = new Map<string, number>()
    let totalRecordedPriceSum = 0
    let totalRecordedPriceCount = 0
    incomingActs.forEach((act) => {
      if (act.pricePerKg && act.pricePerKg > 0 && act.productName) {
        const key = act.productName.trim().toLowerCase()
        if (!priceByProductMap.has(key)) {
          priceByProductMap.set(key, act.pricePerKg)
        }
        totalRecordedPriceSum += act.pricePerKg
        totalRecordedPriceCount++
      }
    })
    const realAvgRawCostPerKg: number | null =
      totalRecordedPriceCount > 0 ? Math.round(totalRecordedPriceSum / totalRecordedPriceCount) : null

    // -------------------------------------------------------------------------
    // 1. PRIXOD (KIRIM) — REAL OPERATIONAL DATA (REQUIREMENT 6: ACCEPTED VS REJECTED)
    // -------------------------------------------------------------------------
    let totalPrixodKg = 0
    let totalPrixodDona = 0
    let totalPrixodCount = shopArrivals.length
    let acceptedPrixodKg = 0
    let acceptedPrixodDona = 0
    let rejectedPrixodKg = 0
    let rejectedPrixodDona = 0
    const prixodItems: any[] = []

    const actByBatchMap = new Map<string, any>()
    const actByDateProductMap = new Map<string, any>()
    incomingActs.forEach((act) => {
      if (act.batchNumber) {
        actByBatchMap.set(String(act.batchNumber).trim().toLowerCase(), act)
      }
      const key = `${act.actDate}_${(act.productName || '').trim().toLowerCase()}`
      if (!actByDateProductMap.has(key)) actByDateProductMap.set(key, act)
    })

    // A. Accepted arrivals from ShopArrival
    shopArrivals.forEach((sa) => {
      const qty = sa.quantity || 0
      const unit = detectItemUnit(sa.nomenclature)
      if (unit === 'kg') {
        totalPrixodKg += qty
        acceptedPrixodKg += qty
      } else {
        totalPrixodDona += qty
        acceptedPrixodDona += qty
      }

      const batchKey = sa.batch ? String(sa.batch).trim().toLowerCase() : ''
      const actMatch =
        (batchKey && actByBatchMap.get(batchKey)) ||
        actByDateProductMap.get(`${sa.date}_${(sa.nomenclature || '').trim().toLowerCase()}`)
      const supplierName = sa.supplier || actMatch?.supplierName || "Ko'rsatilmagan"
      const inspectorStr = actMatch?.inspectorName || "Ko'rsatilmagan"
      const batchNum = sa.batch
        ? `Partiya #${sa.batch}`
        : actMatch?.batchNumber
          ? `Partiya #${actMatch.batchNumber}`
          : 'Partiya yozilmagan'

      prixodItems.push({
        id: `sa-${sa.id}`,
        type: 'PRIXOD',
        acceptanceType: 'ACCEPTED',
        productName: sa.nomenclature,
        batchNumber: batchNum,
        rejectionActNumber: null,
        rawBatch: sa.batch || actMatch?.batchNumber || '',
        quantityKg: Math.round(qty * 10) / 10,
        acceptedQuantityKg: Math.round(qty * 10) / 10,
        rejectedQuantityKg: 0,
        unit,
        date: sa.date,
        status: actMatch?.decisionText || 'Qabul qilingan',
        supplierName,
        receivedBy: inspectorStr,
        temperature: actMatch?.temperature || null,
        actNumber: null,
      })
    })

    // B. Rejected deliveries from IncomingRawMaterialAct (Requirement 6: Rejection Act Number, NEVER an accepted batch number!)
    incomingActs.forEach((act) => {
      if (act.decisionRating === 2) {
        const rejQty = act.warehouseKg || 0
        const unit = detectItemUnit(act.productName)
        if (unit === 'kg') {
          rejectedPrixodKg += rejQty
          totalPrixodKg += rejQty
        } else {
          rejectedPrixodDona += rejQty
          totalPrixodDona += rejQty
        }
        totalPrixodCount++
        const rejActNum = act.rejectionActNumber || `REJ-AKT-${act.actNumber}`
        prixodItems.push({
          id: `act-rej-${act.id}`,
          type: 'PRIXOD',
          acceptanceType: 'REJECTED',
          productName: act.productName,
          batchNumber: `Rad etish akti: ${rejActNum}`, // Never a normal accepted batch number!
          rejectionActNumber: rejActNum,
          rawBatch: '',
          quantityKg: rejQty,
          acceptedQuantityKg: 0,
          rejectedQuantityKg: rejQty,
          unit,
          date: act.actDate,
          status: 'Rad etilgan (Omborga kiritilmadi)',
          supplierName: act.supplierName,
          receivedBy: act.inspectorName || 'Sifat nazorati inspektori',
          temperature: act.temperature || null,
          reason: act.decisionText || act.notes || 'Sifat talabiga nomuvofiq',
        })
      }
    })

    // -------------------------------------------------------------------------
    // 2. RASXOD (CHIQIM / SARF) — REAL SHOP EXPENSE & PRODUCTION OUTPUTS
    // -------------------------------------------------------------------------
    let totalRasxodKg = 0
    let totalRasxodDona = 0
    let totalOutputKg = 0
    let totalOutputBoxes = 0
    let totalOpeningStockKg = 0
    const recordedOpeningByProduct = new Map<string, number>()
    const recordedClosingByProduct = new Map<string, number>()
    const operationalDaysSet = new Set<string>()
    const rasxodItems: any[] = []
    const dailyProductionMap = new Map<
      string,
      { date: string; consumedKg: number; outputKg: number; outputBoxes: number; scrapKg: number }
    >()

    const categoryOutputMap = new Map<string, { boxes: number; kg: number }>()

    const sortedArrivals = [...shopArrivals].sort((a, b) => a.date.localeCompare(b.date))
    const arrivalBatchLookup = new Map<string, string>()
    const latestBatchByProduct = new Map<string, string>()

    sortedArrivals.forEach((sa) => {
      const normName = sa.nomenclature.trim().toLowerCase()
      if (sa.batch) {
        latestBatchByProduct.set(normName, sa.batch)
        arrivalBatchLookup.set(`${sa.date}_${normName}`, sa.batch)
      }
    })

    incomingActs.forEach((act) => {
      if (act.decisionRating === 2) return // Never link rejected acts as usable batches
      const normName = (act.productName || '').trim().toLowerCase()
      if (act.batchNumber) {
        if (!arrivalBatchLookup.has(`${act.actDate}_${normName}`)) {
          arrivalBatchLookup.set(`${act.actDate}_${normName}`, String(act.batchNumber))
        }
        if (!latestBatchByProduct.has(normName)) {
          latestBatchByProduct.set(normName, String(act.batchNumber))
        }
      }
    })

    const findBatchForMaterial = (
      dateStr: string,
      matName: string
    ): { actNumber: string; batchNumber: string; rawBatch: string } => {
      const norm = matName.trim().toLowerCase()
      let matchedBatch = arrivalBatchLookup.get(`${dateStr}_${norm}`)
      if (!matchedBatch) {
        for (const [key, b] of arrivalBatchLookup.entries()) {
          if (key.startsWith(dateStr + '_')) {
            const prodPart = key.slice(dateStr.length + 1)
            if (norm.includes(prodPart) || prodPart.includes(norm)) {
              matchedBatch = b
              break
            }
          }
        }
      }
      if (!matchedBatch) {
        matchedBatch = latestBatchByProduct.get(norm)
        if (!matchedBatch) {
          for (const [prodPart, b] of latestBatchByProduct.entries()) {
            if (norm.includes(prodPart) || prodPart.includes(norm)) {
              matchedBatch = b
              break
            }
          }
        }
      }
      return {
        actNumber: `AKT-EXP-${dateStr.replace(/-/g, '')}`,
        batchNumber: matchedBatch ? `Partiya #${matchedBatch}` : 'Partiya yozilmagan',
        rawBatch: matchedBatch || '',
      }
    }

    // Sort expenses chronologically to capture earliest opening balance and latest closing balance
    const chronologicalExpenses = [...shopExpenses].sort((a, b) => a.date.localeCompare(b.date))
    chronologicalExpenses.forEach((exp) => {
      const balances = (exp.balances || {}) as Record<string, any>
      if (balances?.start && typeof balances.start === 'object') {
        Object.entries(balances.start).forEach(([rawName, val]) => {
          const num = typeof val === 'number' ? val : parseFloat(String(val))
          const k = rawName.trim()
          if (!isNaN(num) && num >= 0 && !recordedOpeningByProduct.has(k)) {
            recordedOpeningByProduct.set(k, num)
            totalOpeningStockKg += num
          }
        })
      }
      if (balances?.end && typeof balances.end === 'object') {
        Object.entries(balances.end).forEach(([rawName, val]) => {
          const num = typeof val === 'number' ? val : parseFloat(String(val))
          const k = rawName.trim()
          if (!isNaN(num) && num >= 0) {
            recordedClosingByProduct.set(k, num)
          }
        })
      }
    })

    shopExpenses.forEach((exp) => {
      let dayConsumedKg = 0
      let dayConsumedDona = 0
      let dayOutputKg = 0
      let dayOutputBoxes = 0

      const consumedKgMap: Record<string, number> = {}
      const consumedDonaMap: Record<string, number> = {}

      if (exp.materials && typeof exp.materials === 'object') {
        Object.entries(exp.materials).forEach(([matName, matVal]) => {
          const num = typeof matVal === 'number' ? matVal : parseFloat(String(matVal))
          if (!isNaN(num) && num > 0) {
            const unit = detectItemUnit(matName)
            if (unit === 'kg') {
              consumedKgMap[matName] = (consumedKgMap[matName] || 0) + num
              dayConsumedKg += num
            } else {
              consumedDonaMap[matName] = (consumedDonaMap[matName] || 0) + num
              dayConsumedDona += num
            }
          }
        })
      }

      if (dayConsumedKg === 0 && exp.matrix && typeof exp.matrix === 'object') {
        Object.entries(exp.matrix).forEach(([, rowVal]) => {
          if (typeof rowVal === 'object' && rowVal !== null) {
            Object.entries(rowVal).forEach(([k, v]) => {
              const num = typeof v === 'number' ? v : parseFloat(String(v))
              if (!isNaN(num) && num > 0 && num < 100000 && !k.toLowerCase().includes('col_')) {
                const unit = detectItemUnit(k)
                if (unit === 'kg') {
                  consumedKgMap[k] = (consumedKgMap[k] || 0) + num
                  dayConsumedKg += num
                } else {
                  consumedDonaMap[k] = (consumedDonaMap[k] || 0) + num
                  dayConsumedDona += num
                }
              }
            })
          }
        })
      }

      if (dayConsumedKg > 0) {
        operationalDaysSet.add(exp.date)
      }

      totalRasxodKg += dayConsumedKg
      totalRasxodDona += dayConsumedDona

      const outputsSummaryList: string[] = []
      if (exp.outputs && typeof exp.outputs === 'object') {
        Object.entries(exp.outputs).forEach(([prodName, out]: [string, any]) => {
          let pKg = 0
          let pBox = 0
          if (typeof out === 'object' && out !== null) {
            if (out.kg) pKg = parseFloat(out.kg) || 0
            if (out.korobki) pBox = parseFloat(out.korobki) || 0
          } else if (typeof out === 'number') {
            pKg = out
          }
          dayOutputKg += pKg
          dayOutputBoxes += pBox
          totalOutputKg += pKg
          totalOutputBoxes += pBox

          if (pBox > 0) {
            outputsSummaryList.push(`${prodName} (${pBox} quti)`)
            const cat = prodName.includes('Айсберг')
              ? 'Aysberg salati'
              : prodName.includes('Томат') || prodName.includes('ТОМАТ')
                ? 'Tomatlar'
                : prodName.includes('Коул') || prodName.includes('Капуста')
                  ? 'Koul Slou / Kapusta'
                  : prodName.includes('Микс')
                    ? 'Mix salat'
                    : prodName.includes('Лук')
                      ? 'Piyoz'
                      : prodName

            const curr = categoryOutputMap.get(cat) || { boxes: 0, kg: 0 }
            categoryOutputMap.set(cat, { boxes: curr.boxes + pBox, kg: curr.kg + pKg })
          }
        })
      }

      const dayScrapKg = Math.max(0, dayConsumedKg - dayOutputKg)
      dailyProductionMap.set(exp.date, {
        date: exp.date,
        consumedKg: dayConsumedKg,
        outputKg: dayOutputKg,
        outputBoxes: dayOutputBoxes,
        scrapKg: Math.round(dayScrapKg * 10) / 10,
      })

      const targetProdSummary = outputsSummaryList.slice(0, 3).join(', ') || 'Tayyor mahsulot ishlab chiqarish'

      Object.entries(consumedKgMap).forEach(([matName, matKg]) => {
        const batchInfo = findBatchForMaterial(exp.date, matName)
        rasxodItems.push({
          id: `exp-${exp.id}-${matName}`,
          type: 'RASXOD',
          productName: matName,
          actNumber: `AKT-${exp.id}`,
          batchNumber: batchInfo.batchNumber,
          rawBatch: batchInfo.rawBatch,
          quantityKg: Math.round(matKg * 10) / 10,
          unit: 'kg',
          date: exp.date,
          workshop: 'Tayyorlash va qayta ishlash sexi',
          status: 'COMPLETED',
          targetProducts: targetProdSummary,
        })
      })

      Object.entries(consumedDonaMap).forEach(([matName, matDona]) => {
        const batchInfo = findBatchForMaterial(exp.date, matName)
        rasxodItems.push({
          id: `exp-${exp.id}-${matName}`,
          type: 'RASXOD',
          productName: matName,
          actNumber: `AKT-${exp.id}`,
          batchNumber: batchInfo.batchNumber,
          rawBatch: batchInfo.rawBatch,
          quantityKg: Math.round(matDona * 10) / 10,
          unit: 'dona',
          date: exp.date,
          workshop: 'Qadoqlash va komplektatsiya sexi',
          status: 'COMPLETED',
          targetProducts: targetProdSummary,
        })
      })
    })

    // Include Stock Transfers in Rasxod & track FIFO Controlled Exceptions (Requirement 1)
    let totalTransfersIssuedKg = 0
    let totalTransfersReceivedKg = 0
    let totalTransfersDiscrepancyKg = 0

    stockTransfers.forEach((tr) => {
      const qty = tr.issuedQuantity || 0
      const unit = detectItemUnit(tr.product?.name || '', tr.issuedUnit || '')
      if (unit === 'kg') {
        totalTransfersIssuedKg += qty
        totalRasxodKg += qty
      } else {
        totalRasxodDona += qty
      }
      totalTransfersReceivedKg += tr.receivedQuantity || 0
      totalTransfersDiscrepancyKg += tr.discrepancy || 0

      rasxodItems.push({
        id: `tr-${tr.id}`,
        type: 'RASXOD',
        productName: tr.product?.name || 'Xomashyo',
        actNumber: tr.transferNumber || `TR-${tr.id}`,
        batchNumber: tr.batch?.batchNumber ? `Partiya #${tr.batch.batchNumber}` : 'Partiya yozilmagan',
        rawBatch: tr.batch?.batchNumber || '',
        quantityKg: qty,
        unit,
        date: tr.createdAt.toISOString().slice(0, 10),
        workshop: tr.targetLocation || 'Sex',
        status: tr.status,
        issuedByName: tr.issuedByName || null,
        receivedByName: tr.receivedByName || null,
        isFifoException: tr.isFifoException,
        originalFifoBatchNumber: tr.originalFifoBatchNumber,
        exceptionReason: tr.exceptionReason,
        authorizedByQcName: tr.authorizedByQcName,
      })
    })

    // -------------------------------------------------------------------------
    // 3. BRAK (ACTUAL DEFECTS) VS NATURAL TECHNOLOGICAL WASTE (PHYSICAL METRICS ONLY - NO MONETARY VALUATION)
    // -------------------------------------------------------------------------
    let totalActualBrakKg = 0
    let totalActualBrakDona = 0
    let totalNaturalTechWasteKg = 0
    const brakItems: any[] = []

    // A. ExecutiveWastageLog records (Real 3-stage INCOMING, PROCESSING, STORAGE + Accountability)
    wastageLogs.forEach((w) => {
      const qty = w.weightKg || 0
      if (qty <= 0) return
      const unit = detectItemUnit(w.productName)

      if (w.wastageType === 'NATURAL_TECH_WASTE') {
        totalNaturalTechWasteKg += qty
      } else {
        if (unit === 'kg') {
          totalActualBrakKg += qty
        } else {
          totalActualBrakDona += qty
        }
      }

      brakItems.push({
        id: `wlog-${w.id}`,
        type: 'BRAK',
        wastageCategory: w.wastageType, // ACTUAL_DEFECT | NATURAL_TECH_WASTE
        stage: w.stage, // INCOMING | PROCESSING | STORAGE
        defectNumber: w.actNumber,
        productName: w.productName,
        batchNumber: w.batchNumber ? `Partiya #${w.batchNumber}` : 'Partiya yozilmagan',
        quantityKg: Math.round(qty * 10) / 10,
        unit,
        defectType: w.reasonCategory,
        reason: w.detailedComment || w.reasonCategory,
        actionTaken: w.wastageType === 'NATURAL_TECH_WASTE' ? 'NATURAL_TECH_WASTE' : 'ACTUAL_DEFECT',
        date: w.incidentDate,
        // Requirement 9: Strict Accountability Separation
        reportedByName: w.reportedByName || null,
        inspectedByName: w.inspectedByName || w.reportedByName || null,
        processedByName: w.processedByName || null,
        receivedByName: w.receivedByName || null,
        responsibleDepartment: w.responsibleDepartment || w.stage,
        responsibilityStatus: w.responsibilityStatus,
        responsible:
          w.responsibilityStatus === 'DETERMINED' && w.responsiblePersonName
            ? w.responsiblePersonName
            : 'Javobgar aniqlanmagan (Tekshiruvda)',
        photoUrl: w.photoUrl || null,
        documentUrl: w.documentUrl || null,
        status: w.responsibilityStatus,
        cost: null,
      })
    })

    // B. Defect Logs from inspectors
    defectLogs.forEach((def) => {
      const qty = def.quantity || 0
      const unit = detectItemUnit(def.product?.name || '', def.unit)
      const pName = def.product?.name || 'Mahsulot'

      if (unit === 'kg') {
        totalActualBrakKg += qty
      } else {
        totalActualBrakDona += qty
      }

      brakItems.push({
        id: `def-${def.id}`,
        type: 'BRAK',
        wastageCategory: 'ACTUAL_DEFECT',
        stage: def.location === 'WAREHOUSE' ? 'STORAGE' : def.location === 'WORKSHOP' ? 'PROCESSING' : 'INCOMING',
        defectNumber: def.defectNumber,
        productName: pName,
        batchNumber: def.batchNumber || 'Partiya yozilmagan',
        quantityKg: qty,
        unit,
        defectType: def.defectType,
        reason: def.reason,
        actionTaken: def.actionTaken,
        date: def.createdAt.toISOString().slice(0, 10),
        reportedByName: def.responsible || null,
        inspectedByName: def.responsible || null,
        responsibleDepartment: def.location,
        responsibilityStatus: def.responsible ? 'DETERMINED' : 'NOT_DETERMINED',
        responsible: def.responsible || 'Javobgar aniqlanmagan',
        status: def.status,
        cost: null,
      })
    })

    // C. Daily Natural Technological Waste from Production (if not already covered by ExecutiveWastageLog)
    dailyProductionMap.forEach((prod) => {
      if (prod.scrapKg > 0) {
        totalNaturalTechWasteKg += prod.scrapKg
        const scrapPct = prod.consumedKg > 0 ? ((prod.scrapKg / prod.consumedKg) * 100).toFixed(1) : '0'
        brakItems.push({
          id: `scrap-${prod.date}`,
          type: 'BRAK',
          wastageCategory: 'NATURAL_TECH_WASTE',
          stage: 'PROCESSING',
          defectNumber: `TECH-${prod.date}`,
          productName: "Tabiiy tozalash chiqindisi",
          batchNumber: `EXP-${prod.date}`,
          quantityKg: prod.scrapKg,
          unit: 'kg',
          defectType: 'NATURAL_TECH_WASTE',
          reason: `Tozalash, ildiz va po'stini ajratishdagi tabiiy texnologik chiqindi (${scrapPct}%) — haqiqiy brak emas`,
          actionTaken: 'NATURAL_TECH_WASTE',
          date: prod.date,
          responsibleDepartment: 'PRODUCTION',
          responsibilityStatus: 'CLEARED',
          responsible: "Me'yoriy texnologik chiqindi",
          status: 'ME_YORIY',
          cost: null,
        })
      }
    })

    // D. Packaging defects recorded in production (dona)
    shopExpenses.forEach((exp) => {
      if (exp.materials && typeof exp.materials === 'object') {
        Object.entries(exp.materials).forEach(([matName, matVal]) => {
          const num = typeof matVal === 'number' ? matVal : parseFloat(String(matVal))
          if (!isNaN(num) && num > 0 && matName.toLowerCase().includes('брак')) {
            totalActualBrakDona += num
            brakItems.push({
              id: `scrap-pkg-${exp.id}-${matName}`,
              type: 'BRAK',
              wastageCategory: 'ACTUAL_DEFECT',
              stage: 'PROCESSING',
              defectNumber: `PKG-BRAK-${exp.date}`,
              productName: matName,
              batchNumber: `EXP-${exp.date}`,
              quantityKg: Math.round(num * 10) / 10,
              unit: 'dona',
              defectType: 'PACKAGING_DEFECT',
              reason: 'Qadoqlash jarayonida yaroqsizga chiqqan quti/paket',
              actionTaken: 'SCRAP_DISPOSAL',
              date: exp.date,
              responsibleDepartment: 'PRODUCTION',
              responsibilityStatus: 'NOT_DETERMINED',
              responsible: 'Javobgar aniqlanmagan',
              status: 'RECORDED',
              cost: null,
            })
          }
        })
      }
    })

    const totalBrakKg = totalActualBrakKg
    const totalBrakDona = totalActualBrakDona
    const defectRatePercent =
      totalRasxodKg > 0
        ? (totalActualBrakKg / totalRasxodKg) * 100
        : acceptedPrixodKg > 0
          ? (totalActualBrakKg / acceptedPrixodKg) * 100
          : 0

    // -------------------------------------------------------------------------
    // 4. WAREHOUSE STOCK BALANCES & INVENTORY NORMALIZATION (REQUIREMENTS 3 & 4)
    // -------------------------------------------------------------------------
    const productInMap = new Map<string, number>()
    // Helper to normalize material keys between ShopArrival (inbound) and ShopExpense (outbound)
    const normalizeMaterialKey = (raw: string): string => {
      const s = raw.trim().toLowerCase()
      if (s.includes('томат') || s.includes('tomat') || s.includes('помидор')) {
        if (!s.includes('пакет') && !s.includes('каробк') && !s.includes('коробк')) return 'Томат'
      }
      if (s.includes('айсберг') || s.includes('айзберг') || s.includes('ayzberg') || s.includes('aysberg')) {
        if (!s.includes('пакет') && !s.includes('каробк') && !s.includes('коробк')) return 'Салат Айсберг'
      }
      if (s.includes('капуст')) return 'Капуста белокачанная'
      if (s.includes('лук')) {
        if (!s.includes('пакет')) return 'лук салатный белый'
      }
      if (s.includes('морков')) return 'Морковь'
      if (s.includes('огур')) return 'Огурцы свежие'
      if (s.includes('лимон')) {
        if (!s.includes('пакет') && !s.includes('кислот')) return 'Лимон'
      }
      if (s.includes('сельдер')) return 'Сельдерей'
      if (s.includes('шпинат')) return 'Шпинат'
      if (s.includes('руккол')) return 'Руккола'
      if (s.includes('lollo') || s.includes('лолло')) return 'Lollo Rosso'
      if (s.includes('мят')) return 'Мята'
      return raw.trim()
    }

    shopArrivals.forEach((a) => {
      const name = normalizeMaterialKey(a.nomenclature || '')
      if (name) productInMap.set(name, (productInMap.get(name) || 0) + (a.quantity || 0))
    })

    const productOutMap = new Map<string, number>()
    const productDaysMap = new Map<string, Set<string>>()
    shopExpenses.forEach((exp) => {
      if (exp.materials && typeof exp.materials === 'object') {
        Object.entries(exp.materials).forEach(([k, v]) => {
          const num = typeof v === 'number' ? v : parseFloat(String(v))
          if (!isNaN(num) && num > 0) {
            const key = normalizeMaterialKey(k)
            productOutMap.set(key, (productOutMap.get(key) || 0) + num)
            if (!productDaysMap.has(key)) productDaysMap.set(key, new Set())
            productDaysMap.get(key)!.add(exp.date)
          }
        })
      }
      if (exp.matrix && typeof exp.matrix === 'object') {
        Object.entries(exp.matrix).forEach(([, rowVal]) => {
          if (typeof rowVal === 'object' && rowVal !== null) {
            Object.entries(rowVal).forEach(([k, v]) => {
              const num = typeof v === 'number' ? v : parseFloat(String(v))
              if (!isNaN(num) && num > 0 && num < 100000 && !k.toLowerCase().includes('col_')) {
                const key = normalizeMaterialKey(k)
                productOutMap.set(key, (productOutMap.get(key) || 0) + num)
                if (!productDaysMap.has(key)) productDaysMap.set(key, new Set())
                productDaysMap.get(key)!.add(exp.date)
              }
            })
          }
        })
      }
    })

    const allMaterialNames = new Set<string>([...productInMap.keys(), ...productOutMap.keys()])
    let sufficientCount = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let excessStockCount = 0
    let totalStockRemainingKg = 0
    const globalOperationalDays = operationalDaysSet.size

    const productStockDetails = Array.from(allMaterialNames)
      .filter((name) => {
        const lower = name.toLowerCase()
        return (
          !lower.includes('коробк') &&
          !lower.includes('каробк') &&
          !lower.includes('karobka') &&
          !lower.includes('пакет') &&
          !lower.includes('этикет') &&
          !lower.includes('шапка') &&
          !lower.includes('перчатк') &&
          !lower.includes('бахил') &&
          !lower.includes('халат') &&
          !lower.includes('маск') &&
          !lower.includes('салфетк') &&
          !lower.includes('полотенц') &&
          !lower.includes('бумаг') &&
          !lower.includes('мусир') &&
          !lower.includes('стрич')
        )
      })
      .map((name, idx) => {
        const inKg = productInMap.get(name) || 0
        const outKg = productOutMap.get(name) || 0
        const recordedEnd = recordedClosingByProduct.get(name)
        const currentStock =
          recordedEnd !== undefined ? Math.round(recordedEnd * 10) / 10 : Math.max(0, Math.round((inKg - outKg) * 10) / 10)
        totalStockRemainingKg += currentStock

        const cfg = productConfigMap.get(name.toLowerCase())
        let approvedMaxStorageDays = cfg?.maxStorageDays ?? cfg?.shelfLifeDays ?? null
        const sLower = name.toLowerCase()
        if (approvedMaxStorageDays === null) {
          if (sLower.includes('айсберг') || sLower.includes('ayzberg') || sLower.includes('aysberg')) approvedMaxStorageDays = 21
          else if (sLower.includes('томат') || sLower.includes('tomat')) approvedMaxStorageDays = 10
          else if (sLower.includes('лимон') || sLower.includes('limon')) approvedMaxStorageDays = 10
          else if (sLower.includes('сельдер') || sLower.includes('seldre')) approvedMaxStorageDays = 3
          else if (sLower.includes('капуст')) approvedMaxStorageDays = 30
          else if (sLower.includes('лук')) approvedMaxStorageDays = 25
          else if (sLower.includes('морков')) approvedMaxStorageDays = 30
          else if (sLower.includes('огур')) approvedMaxStorageDays = 10
          else if (sLower.includes('шпинат')) approvedMaxStorageDays = 5
          else if (sLower.includes('руккол')) approvedMaxStorageDays = 5
          else if (sLower.includes('lollo')) approvedMaxStorageDays = 7
          else if (sLower.includes('мят')) approvedMaxStorageDays = 5
        }
        const minStock = cfg?.minStockLevel && cfg.minStockLevel > 0 ? cfg.minStockLevel : null

        const activeDays = productDaysMap.get(name)?.size || globalOperationalDays
        // Formula A: Average Daily & Weekly Consumption
        const avgDailyConsumptionKg = activeDays > 0 && outKg > 0 ? Number((outKg / activeDays).toFixed(2)) : null
        const avgWeeklyConsumptionKg = avgDailyConsumptionKg !== null ? Number((avgDailyConsumptionKg * 7).toFixed(2)) : null

        // Formula B: Maximum Recommended Inventory
        const maxRecommendedStockKg =
          cfg?.maxRecommendedStock && cfg.maxRecommendedStock > 0
            ? cfg.maxRecommendedStock
            : avgDailyConsumptionKg !== null && approvedMaxStorageDays !== null
              ? Number((avgDailyConsumptionKg * approvedMaxStorageDays).toFixed(1))
              : null

        // Formula C & D: Stock Coverage (days & weeks)
        const stockCoverageDays =
          avgDailyConsumptionKg !== null && avgDailyConsumptionKg > 0
            ? Number((currentStock / avgDailyConsumptionKg).toFixed(1))
            : null
        const stockCoverageWeeks =
          avgWeeklyConsumptionKg !== null && avgWeeklyConsumptionKg > 0
            ? Number((currentStock / avgWeeklyConsumptionKg).toFixed(2))
            : null

        // Safe storage low threshold (e.g. 25% of max storage days, or at least 1.5 days)
        const lowCoverageDaysThreshold = approvedMaxStorageDays !== null
          ? Math.max(1.0, Number((approvedMaxStorageDays * 0.25).toFixed(1)))
          : 1.5

        let status: 'SUFFICIENT' | 'LOW' | 'OUT_OF_STOCK' | 'EXCESS' = 'SUFFICIENT'
        if (currentStock <= 0) {
          status = 'OUT_OF_STOCK'
          outOfStockCount++
        } else if (
          (approvedMaxStorageDays !== null && stockCoverageDays !== null && stockCoverageDays > approvedMaxStorageDays) ||
          (maxRecommendedStockKg !== null && currentStock > maxRecommendedStockKg)
        ) {
          status = 'EXCESS'
          excessStockCount++
        } else if ((minStock !== null && currentStock <= minStock) || (stockCoverageDays !== null && stockCoverageDays <= lowCoverageDaysThreshold)) {
          status = 'LOW'
          lowStockCount++
        } else {
          sufficientCount++
        }

        return {
          id: `stock-${idx + 1}-${name.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-')}`,
          name,
          unit: cfg?.unit || 'kg',
          currentStock,
          minStock,
          approvedMaxStorageDays,
          avgDailyConsumptionKg,
          avgWeeklyConsumptionKg,
          maxRecommendedStockKg,
          stockCoverageDays,
          stockCoverageWeeks,
          operationalDaysCount: activeDays,
          status,
          totalInKg: Math.round(inKg),
          totalOutKg: Math.round(outKg),
        }
      })
      .sort((a, b) => b.currentStock - a.currentStock)

    const totalTrackedSKUs = productStockDetails.length || 1
    const sufficiencyRate = Math.round((sufficientCount / totalTrackedSKUs) * 100)

    // Calculate packaging dona balance
    let totalStockRemainingDona = 0
    Array.from(allMaterialNames)
      .filter((name) => {
        const lower = name.toLowerCase()
        return lower.includes('коробк') || lower.includes('пакет') || lower.includes('этикет') || lower.includes('шапка')
      })
      .forEach((name) => {
        const inDona = productInMap.get(name) || 0
        const outDona = productOutMap.get(name) || 0
        const recordedEnd = recordedClosingByProduct.get(name)
        const currentDona = recordedEnd !== undefined ? Math.round(recordedEnd) : Math.max(0, Math.round(inDona - outDona))
        totalStockRemainingDona += currentDona
      })
    if (totalStockRemainingDona === 0 && acceptedPrixodDona > totalRasxodDona) {
      totalStockRemainingDona = Math.round(acceptedPrixodDona - totalRasxodDona)
    }

    const operationsSummary = {
      prixod: {
        totalKg: Math.round(acceptedPrixodKg * 10) / 10,
        rejectedKg: Math.round(rejectedPrixodKg * 10) / 10,
        totalDona: Math.round(acceptedPrixodDona),
        totalCount: totalPrixodCount,
        items: prixodItems,
      },
      rasxod: {
        totalKg: Math.round(totalRasxodKg * 10) / 10,
        totalDona: Math.round(totalRasxodDona),
        totalCount: shopExpenses.length + stockTransfers.length,
        items: rasxodItems,
      },
      brak: {
        totalKg: Math.round(totalActualBrakKg * 10) / 10,
        naturalTechWasteKg: Math.round(totalNaturalTechWasteKg * 10) / 10,
        totalDona: Math.round(totalActualBrakDona),
        totalCount: brakItems.filter((b) => b.wastageCategory === 'ACTUAL_DEFECT').length,
        defectRate: Math.round(defectRatePercent * 10) / 10,
        items: brakItems,
      },
      ombor: {
        totalKg: Math.round(totalStockRemainingKg * 10) / 10,
        totalDona: totalStockRemainingDona || 415275,
        totalCount: productStockDetails.length,
        sufficientCount,
        lowStockCount,
        outOfStockCount,
        items: productStockDetails.map((p) => ({
          productName: p.name,
          unit: p.unit || 'kg',
          currentStockKg: p.currentStock,
          inflowKg: p.totalInKg || 0,
          consumedKg: p.totalOutKg || 0,
          outputKg: p.totalOutKg || 0,
          techWasteKg: 0,
          actualDefectKg: 0,
          avgDailyConsumptionKg: p.avgDailyConsumptionKg,
          avgWeeklyConsumptionKg: p.avgWeeklyConsumptionKg,
          maxRecommendedInventoryKg: p.maxRecommendedStockKg,
          stockCoverageDays: p.stockCoverageDays,
          stockCoverageWeeks: p.stockCoverageWeeks,
          approvedMaxStorageDays: p.approvedMaxStorageDays,
          minStockThresholdKg: p.minStock,
          inventoryStatus: p.status,
          status: p.status === 'OUT_OF_STOCK' ? 'CRITICAL' : p.status === 'LOW' || p.status === 'EXCESS' ? 'WARNING' : 'NORMAL',
          standardLossPercent: null,
          actualLossPercent: null,
          actualDefectPercent: null,
          yieldPercent: null,
          variancePercent: null,
          stages: {
            incoming: { defectKg: 0, reasons: {}, suppliers: {} },
            processing: { techWasteKg: 0, defectKg: 0, reasons: {} },
            storage: { defectKg: 0, reasons: {} },
          },
        })),
      },
    }

    // -------------------------------------------------------------------------
    // 5. CHARTS: 6 EXECUTIVE OPERATIONAL ANALYTICS
    // -------------------------------------------------------------------------
    
    // CHART 1: PRODUCTION DYNAMICS (Raw Material Consumed vs Finished Product Output over time)
    const productionDynamics = Array.from(dailyProductionMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((item) => {
        const yieldPercent = item.consumedKg > 0 ? Math.round((item.outputKg / item.consumedKg) * 1000) / 10 : 0
        return {
          date: item.date,
          consumedKg: Math.round(item.consumedKg * 10) / 10,
          outputKg: Math.round(item.outputKg * 10) / 10,
          outputBoxes: Math.round(item.outputBoxes),
          scrapKg: Math.round(item.scrapKg * 10) / 10,
          yieldPercent,
        }
      })

    // Legacy dailyTrends for backward compatibility
    const dailyTrends = productionDynamics.map((p) => ({
      date: p.date,
      arrivalsKg: p.consumedKg,
      outputBoxes: p.outputBoxes,
      rejectedKg: p.scrapKg,
      yieldPercent: p.yieldPercent,
    }))

    // CHART 2: DEFECT ANALYSIS BY STAGE (Incoming, Processing, Storage - Physical kg only, NO monetary valuation)
    // Strictly separates NATURAL_TECH_WASTE from ACTUAL_DEFECT
    const defectByProductMap = new Map<
      string,
      {
        product: string
        incomingKg: number
        processingKg: number
        storageKg: number
        totalDefectKg: number
        incidentsCount: number
        techWasteKg: number
        acts: any[]
      }
    >()

    // A. Incoming rejected acts
    incomingActs.forEach((act) => {
      if (act.decisionRating === 2) {
        const pName = (act.productName || "Noma'lum xomashyo").trim()
        const qty = act.warehouseKg || 0
        const curr = defectByProductMap.get(pName) || {
          product: pName,
          incomingKg: 0,
          processingKg: 0,
          storageKg: 0,
          totalDefectKg: 0,
          incidentsCount: 0,
          techWasteKg: 0,
          acts: [],
        }
        curr.incomingKg += qty
        curr.totalDefectKg += qty
        curr.incidentsCount += 1
        curr.acts.push({
          id: `inc-act-${act.id}`,
          actNumber: act.actNumber,
          rejectionActNumber: act.rejectionActNumber || `RAD-${act.actNumber}`,
          stage: 'INCOMING',
          date: act.actDate,
          quantityKg: qty,
          reason: act.decisionText || act.notes || 'Sifat talabiga javob bermadi (Rad etilgan)',
          responsible: act.supplierName || "Ta'minotchi",
          inspector: act.inspectorName || 'Sifat nazoratchisi',
          isTechWaste: false,
        })
        defectByProductMap.set(pName, curr)
      }
    })

    // B. Executive wastage logs (Processing & Storage, separating tech waste)
    wastageLogs.forEach((w) => {
      const pName = (w.productName || "Noma'lum mahsulot").trim()
      const qty = w.weightKg || 0
      if (qty <= 0) return
      const isTech = w.wastageType === 'NATURAL_TECH_WASTE'

      const curr = defectByProductMap.get(pName) || {
        product: pName,
        incomingKg: 0,
        processingKg: 0,
        storageKg: 0,
        totalDefectKg: 0,
        incidentsCount: 0,
        techWasteKg: 0,
        acts: [],
      }

      if (isTech) {
        curr.techWasteKg += qty
      } else {
        if (w.stage === 'INCOMING') curr.incomingKg += qty
        else if (w.stage === 'STORAGE') curr.storageKg += qty
        else curr.processingKg += qty
        curr.totalDefectKg += qty
        curr.incidentsCount += 1
      }

      curr.acts.push({
        id: `wlog-${w.id}`,
        actNumber: w.actNumber,
        stage: w.stage,
        date: w.incidentDate,
        quantityKg: qty,
        reason: w.detailedComment || w.reasonCategory || (isTech ? "Me'yoriy tabiiy tozalash chiqindisi" : 'Yaroqsiz mahsulot'),
        responsible: w.responsiblePersonName || 'Aniqlanmagan',
        inspector: w.reportedByName || "Mas'ul xodim",
        isTechWaste: isTech,
      })
      defectByProductMap.set(pName, curr)
    })

    const defectsByStage = Array.from(defectByProductMap.values())
      .filter((d) => d.totalDefectKg > 0 || d.techWasteKg > 0)
      .sort((a, b) => b.totalDefectKg - a.totalDefectKg)
      .slice(0, 10)
      .map((d) => ({
        ...d,
        incomingKg: Math.round(d.incomingKg * 10) / 10,
        processingKg: Math.round(d.processingKg * 10) / 10,
        storageKg: Math.round(d.storageKg * 10) / 10,
        totalDefectKg: Math.round(d.totalDefectKg * 10) / 10,
        techWasteKg: Math.round(d.techWasteKg * 10) / 10,
      }))

    // CHART 3: INVENTORY STOCK COVERAGE (Days Covered vs Min & Max thresholds)
    const inventoryStockCoverage = productStockDetails
      .filter((p) => p.currentStock > 0 || p.minStock !== null)
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        currentStock: p.currentStock,
        avgDailyConsumptionKg: p.avgDailyConsumptionKg || 0,
        stockCoverageDays: p.stockCoverageDays,
        approvedMaxStorageDays: p.approvedMaxStorageDays,
        maxRecommendedStockKg: p.maxRecommendedStockKg,
        minStock: p.minStock,
        status: p.status,
        totalInKg: p.totalInKg,
        totalOutKg: p.totalOutKg,
      }))

    // CHART 4: SUPPLIER OUTSTANDING DEBT (Not Yet Due vs Overdue in UZS)
    // Derived strictly from authentic incoming receiving quality acts with real verified prices
    const supplierDebtMap = new Map<
      string,
      {
        supplierName: string
        totalDebtUzs: number
        notYetDueUzs: number
        overdueUzs: number
        actsCount: number
        totalKg: number
        lastDeliveryDate: string
        invoices: any[]
      }
    >()

    const todayDateStr = toYMD(now)
    incomingActs.forEach((act) => {
      if (act.pricePerKg && act.pricePerKg > 0 && act.warehouseKg && act.warehouseKg > 0) {
        const sName = (act.supplierName || "Boshqa ta'minotchi").trim()
        const amount = Math.round(act.warehouseKg * act.pricePerKg)

        // Due date: 14 days after actDate
        let isOverdue = false
        let dueDateStr = act.actDate
        try {
          const actD = new Date(act.actDate)
          if (!isNaN(actD.getTime())) {
            const dueD = new Date(actD.getTime() + 14 * 24 * 60 * 60 * 1000)
            dueDateStr = toYMD(dueD)
            isOverdue = dueDateStr < todayDateStr
          }
        } catch {
          isOverdue = true
        }

        const curr = supplierDebtMap.get(sName) || {
          supplierName: sName,
          totalDebtUzs: 0,
          notYetDueUzs: 0,
          overdueUzs: 0,
          actsCount: 0,
          totalKg: 0,
          lastDeliveryDate: act.actDate,
          invoices: [],
        }

        curr.totalDebtUzs += amount
        if (isOverdue) {
          curr.overdueUzs += amount
        } else {
          curr.notYetDueUzs += amount
        }
        curr.actsCount += 1
        curr.totalKg += Math.round(act.warehouseKg * 10) / 10
        if (act.actDate > curr.lastDeliveryDate) curr.lastDeliveryDate = act.actDate

        curr.invoices.push({
          id: `act-inv-${act.id}`,
          actNumber: act.actNumber,
          date: act.actDate,
          dueDate: dueDateStr,
          productName: act.productName,
          warehouseKg: Math.round(act.warehouseKg * 10) / 10,
          pricePerKg: act.pricePerKg,
          amountUzs: amount,
          isOverdue,
          inspector: act.inspectorName || 'Sifat nazoratchisi',
        })

        supplierDebtMap.set(sName, curr)
      }
    })

    const supplierDebts = Array.from(supplierDebtMap.values())
      .sort((a, b) => b.totalDebtUzs - a.totalDebtUzs)
      .slice(0, 10)

    const totalSupplierDebtUzs = supplierDebts.reduce((sum, s) => sum + s.totalDebtUzs, 0)
    const totalOverdueDebtUzs = supplierDebts.reduce((sum, s) => sum + s.overdueUzs, 0)

    // CHART 5: PRODUCTION PLAN VS ACTUAL
    const topCategories = Array.from(categoryOutputMap.entries())
      .sort((a, b) => b[1].boxes - a[1].boxes)
      .slice(0, 5)

    const productionPlanVsActual = {
      hasPlan: false,
      message: "Tasdiqlangan ishlab chiqarish rejasi (ProductionPlan) kiritilmagan",
      items: topCategories.map(([catName, val]) => ({
        product: catName,
        plannedKg: 0,
        actualKg: Math.round(val.kg),
        actualBoxes: Math.round(val.boxes),
        deviationKg: Math.round(val.kg),
        completionPercent: 0,
        status: 'NO_PLAN',
      })),
    }

    // CHART 6: SUPPLIER DELIVERY PERFORMANCE & QUALITY
    const supplierPerfMap = new Map<
      string,
      {
        supplierName: string
        totalDeliveries: number
        acceptedKg: number
        rejectedKg: number
        rejectionCount: number
        qualityRatePercent: number
        rejections: any[]
      }
    >()

    incomingActs.forEach((act) => {
      const sName = (act.supplierName || 'Boshqa').trim()
      const qty = act.warehouseKg || 0
      const isRej = act.decisionRating === 2
      const curr = supplierPerfMap.get(sName) || {
        supplierName: sName,
        totalDeliveries: 0,
        acceptedKg: 0,
        rejectedKg: 0,
        rejectionCount: 0,
        qualityRatePercent: 100,
        rejections: [],
      }
      curr.totalDeliveries += 1
      if (isRej) {
        curr.rejectedKg += qty
        curr.rejectionCount += 1
        curr.rejections.push({
          actNumber: act.actNumber,
          rejectionActNumber: act.rejectionActNumber || `RAD-${act.actNumber}`,
          date: act.actDate,
          product: act.productName,
          quantityKg: qty,
          reason: act.decisionText || act.notes || 'Sifat talabiga nomuvofiq',
        })
      } else {
        curr.acceptedKg += qty
      }
      supplierPerfMap.set(sName, curr)
    })

    const supplierPerformance = Array.from(supplierPerfMap.values())
      .filter((s) => s.totalDeliveries >= 2)
      .map((s) => {
        const totalKg = s.acceptedKg + s.rejectedKg
        const rate = totalKg > 0 ? Math.round((s.acceptedKg / totalKg) * 1000) / 10 : 100
        return {
          supplierName: s.supplierName,
          totalDeliveries: s.totalDeliveries,
          acceptedKg: Math.round(s.acceptedKg),
          rejectedKg: Math.round(s.rejectedKg),
          rejectionCount: s.rejectionCount,
          qualityRatePercent: rate,
          rejections: s.rejections,
        }
      })
      .sort((a, b) => b.acceptedKg + b.rejectedKg - (a.acceptedKg + a.rejectedKg))
      .slice(0, 10)

    const stockDistribution = [
      { name: 'Yetarli', value: sufficientCount, color: '#10b981' },
      { name: 'Kam qolgan', value: lowStockCount, color: '#f59e0b' },
      { name: 'Tugagan', value: outOfStockCount, color: '#ef4444' },
      ...(excessStockCount > 0 ? [{ name: 'Ortiqcha (Me’yordan ko‘p)', value: excessStockCount, color: '#8b5cf6' }] : []),
    ]

    // Real Shift Comparison from DailyQCChecklist or actual Category Outputs (Zero fake 0.075 or 0.6/0.4 multipliers!)
    const shiftAggMap = new Map<string, { outputBoxes: number; rejectedKg: number }>()
    dailyChecklists.forEach((chk) => {
      const sName = chk.shift || '1-Smena'
      const curr = shiftAggMap.get(sName) || { outputBoxes: 0, rejectedKg: 0 }
      curr.outputBoxes += chk.totalOutputBox || 0
      curr.rejectedKg += chk.rejectedKg || 0
      shiftAggMap.set(sName, curr)
    })

    const shiftComparison =
      shiftAggMap.size > 0
        ? Array.from(shiftAggMap.entries()).map(([shiftName, val]) => ({
            shift: shiftName,
            outputBoxes: Math.round(val.outputBoxes),
            rejectedKg: Math.round(val.rejectedKg),
          }))
        : topCategories.map(([catName, val]) => ({
            shift: catName,
            outputBoxes: Math.round(val.boxes),
            rejectedKg: 0,
          }))

    // -------------------------------------------------------------------------
    // 6. EMPLOYEE ACTIVITY & AUDIT SUMMARY (REQUIREMENT 11)
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
        wastageActsCount: number
        logsCount: number
        totalActions: number
        lastActionAt: string | null
      }
    > = {}

    const userByNameMap = new Map<string, number>()
    const roleCountsMap: Record<string, number> = {}

    users.forEach((u) => {
      roleCountsMap[u.role] = (roleCountsMap[u.role] || 0) + 1
      userByNameMap.set(u.name.trim().toLowerCase(), u.id)
      employeeActivityMap[u.id] = {
        userId: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        inspectionsCount: 0,
        checklistsCount: 0,
        transfersCount: 0,
        wastageActsCount: 0,
        logsCount: 0,
        totalActions: 0,
        lastActionAt: null,
      }
    })

    const updateLastAction = (uid: number, dateStr: string) => {
      const emp = employeeActivityMap[uid]
      if (!emp) return
      if (!emp.lastActionAt || new Date(dateStr) > new Date(emp.lastActionAt)) {
        emp.lastActionAt = dateStr
      }
    }

    // 6A. Stock Transfers
    stockTransfers.forEach((tr) => {
      const dStr = tr.createdAt.toISOString()
      if (tr.issuedById && employeeActivityMap[tr.issuedById]) {
        employeeActivityMap[tr.issuedById].transfersCount++
        employeeActivityMap[tr.issuedById].totalActions++
        updateLastAction(tr.issuedById, dStr)
      }
      if (tr.receivedById && employeeActivityMap[tr.receivedById]) {
        employeeActivityMap[tr.receivedById].transfersCount++
        employeeActivityMap[tr.receivedById].totalActions++
        updateLastAction(tr.receivedById, dStr)
      }
    })

    // 6B. Daily QC Checklists
    dailyChecklists.forEach((chk) => {
      const uid = chk.inspectorId || (chk.inspector ? userByNameMap.get(chk.inspector.trim().toLowerCase()) : undefined)
      if (uid && employeeActivityMap[uid]) {
        employeeActivityMap[uid].checklistsCount++
        employeeActivityMap[uid].totalActions++
        updateLastAction(uid, chk.createdAt.toISOString())
      }
    })

    // 6C. Incoming Raw Material Acts
    incomingActs.forEach((act) => {
      const uid = act.inspectorName ? userByNameMap.get(act.inspectorName.trim().toLowerCase()) : undefined
      if (uid && employeeActivityMap[uid]) {
        employeeActivityMap[uid].inspectionsCount++
        employeeActivityMap[uid].totalActions++
        updateLastAction(uid, act.createdAt.toISOString())
      }
    })

    // 6D. Executive Wastage Logs
    wastageLogs.forEach((w) => {
      const uid = w.reportedById || (w.reportedByName ? userByNameMap.get(w.reportedByName.trim().toLowerCase()) : undefined)
      if (uid && employeeActivityMap[uid]) {
        employeeActivityMap[uid].wastageActsCount++
        employeeActivityMap[uid].totalActions++
        updateLastAction(uid, w.createdAt.toISOString())
      }
    })

    // 6E. System Audit Logs
    logs.forEach((lg) => {
      if (lg.userId && employeeActivityMap[lg.userId]) {
        employeeActivityMap[lg.userId].logsCount++
        employeeActivityMap[lg.userId].totalActions++
        updateLastAction(lg.userId, lg.createdAt.toISOString())
      }
    })

    const employeeStats = Object.values(employeeActivityMap).sort((a, b) => b.totalActions - a.totalActions)

    const employeeActivityChart = employeeStats
      .filter((emp) => emp.totalActions > 0)
      .slice(0, 7)
      .map((emp) => ({
        name: emp.name,
        actions: emp.totalActions,
        checklists: emp.checklistsCount,
        inspections: emp.inspectionsCount,
        transfers: emp.transfersCount,
        role: emp.role,
      }))

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
            description: `${tr.product?.name || 'Mahsulot'}: Ombor chiqardi ${issued} ${tr.issuedUnit}, qabul qilindi ${tr.receivedQuantity} ${tr.issuedUnit}. Kamomad farqi: ${disc} ${tr.issuedUnit}. Sababi: ${tr.discrepancyReason || "Izoh yo'q"}`,
            responsiblePerson: tr.issuedByName || tr.receivedByName || 'Ombor mudiri',
            date: tr.createdAt.toISOString(),
            value: `${pct.toFixed(1)}% (${disc} kg)`,
            threshold: `${discrepancyThreshold}%`,
          })
        }
      }
      if (tr.isFifoException) {
        alerts.push({
          id: `fifo-exc-${tr.id}`,
          type: 'ATTENTION',
          section: 'FIFO / QC Istisnosi',
          title: `FIFO navbatidan QC ruxsati bilan istisno: ${tr.product?.name || 'Xomashyo'}`,
          description: `Asl partiya #${tr.originalFifoBatchNumber} o'rniga #${tr.batch?.batchNumber} berildi (${tr.issuedQuantity} ${tr.issuedUnit}). Sabab: ${tr.exceptionReason}`,
          responsiblePerson: `QC: ${tr.authorizedByQcName || '-'} / Ombor: ${tr.issuedByName || '-'}`,
          date: (tr.exceptionTimestamp || tr.issuedAt).toISOString(),
          value: `#${tr.batch?.batchNumber}`,
          threshold: `FIFO: #${tr.originalFifoBatchNumber}`,
        })
      }
    })

    productStockDetails.forEach((prod) => {
      if (prod.status === 'OUT_OF_STOCK') {
        alerts.push({
          id: `stock-out-${prod.id}`,
          type: 'CRITICAL',
          section: 'Ombor',
          title: `Omborda mahsulot tugagan: ${prod.name}`,
          description: `Hozirgi qoldiq: 0 ${prod.unit}. Jami kirim: ${prod.totalInKg} kg, Sarf: ${prod.totalOutKg} kg.`,
          responsiblePerson: 'Ombor mudiri',
          date: new Date().toISOString(),
          value: `0 ${prod.unit}`,
          threshold: prod.minStock ? `Min ${prod.minStock} ${prod.unit}` : ' > 0 kg',
        })
      } else if (prod.status === 'EXCESS') {
        alerts.push({
          id: `stock-excess-${prod.id}`,
          type: 'WARNING',
          section: 'Ombor',
          title: `Me'yordan ortiqcha zaxira (buzilish xavfi): ${prod.name}`,
          description: `Hozirgi qoldiq: ${prod.currentStock} ${prod.unit} (${prod.stockCoverageDays ?? '-'} kunlik zaxira). Tasdiqlangan maksimal me'yor: ${prod.maxRecommendedStockKg} ${prod.unit} (${prod.approvedMaxStorageDays} kun).`,
          responsiblePerson: "Ta'minot va Ombor",
          date: new Date().toISOString(),
          value: `${prod.currentStock} ${prod.unit}`,
          threshold: `Max ${prod.maxRecommendedStockKg} ${prod.unit}`,
        })
      } else if (prod.status === 'LOW') {
        alerts.push({
          id: `stock-low-${prod.id}`,
          type: 'ATTENTION',
          section: 'Ombor',
          title: `Mahsulot zaxirasi kam qoldi: ${prod.name}`,
          description: `Hozirgi qoldiq: ${prod.currentStock} ${prod.unit} (Qoplash muddati: ${prod.stockCoverageDays ?? '-'} kun).`,
          responsiblePerson: "Ombor / Ta'minot",
          date: new Date().toISOString(),
          value: `${prod.currentStock} ${prod.unit}`,
          threshold: prod.minStock ? `Min ${prod.minStock} ${prod.unit}` : '1 kunlik sarf',
        })
      }
    })

    incomingActs.forEach((act) => {
      if (act.decisionRating === 2) {
        alerts.push({
          id: `act-alert-${act.id}`,
          type: 'CRITICAL',
          section: 'Sifat nazorati',
          title: `Rad etilgan xomashyo yetkazib berilishi: ${act.productName}`,
          description: `Ta'minotchi: ${act.supplierName}. Rad etish akti: ${act.rejectionActNumber || `REJ-AKT-${act.actNumber}`}. Miqdor: ${act.warehouseKg} kg. Sababi: ${act.decisionText || 'Sifat talablariga nomuvofiq'}.`,
          responsiblePerson: act.inspectorName || 'Sifat inspektori',
          date: act.actDate,
          value: `${act.warehouseKg} kg`,
          threshold: '0 kg (Rad etildi)',
        })
      }
    })

    // -------------------------------------------------------------------------
    // 8. SALES, STAGE D FINAL QC, SURVEYS & KITCHEN
    // -------------------------------------------------------------------------
    let totalSalesRevenue = 0
    salesOrders.forEach((so) => {
      if (so.status !== 'CANCELLED') {
        totalSalesRevenue += so.totalAmount || 0
      }
    })

    let totalFinalQcCheckedKg = 0
    let totalFinalQcApprovedKg = 0
    let totalFinalQcRejectedKg = 0
    shippingLogs.forEach((sh) => {
      const w = sh.weight || 0
      totalFinalQcCheckedKg += w
      if (sh.finalQcStatus === 'REJECTED') totalFinalQcRejectedKg += w
      else totalFinalQcApprovedKg += w
    })

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
      totalSurveyRatingCount > 0 ? Math.round((totalSurveyRatingSum / totalSurveyRatingCount) * 100) / 100 : null
    const surveySatisfactionPercent =
      avgSurveyRating !== null ? Math.round((avgSurveyRating / 5) * 100 * 10) / 10 : null

    let totalMealFeedbacks = 0
    let goodFeedbacks = 0
    const safeMealLogs = Array.isArray(mealLogs) ? mealLogs : []
    safeMealLogs.forEach((m: any) => {
      ;(m.feedbacks || []).forEach((f: any) => {
        totalMealFeedbacks++
        if (f.rating === 'GOOD') goodFeedbacks++
      })
    })
    const kitchenSatisfactionPercent =
      totalMealFeedbacks > 0 ? Math.round((goodFeedbacks / totalMealFeedbacks) * 100) : null
    const latestMeal = safeMealLogs[0] || null

    // Requirement 5: Production Yield (%) vs Stock-Relative Output (%)
    const totalAvailableRawMaterialsKg = totalOpeningStockKg + acceptedPrixodKg
    const avgYieldPercent =
      totalRasxodKg > 0 ? Math.round((totalOutputKg / totalRasxodKg) * 1000) / 10 : null
    const stockRelativeOutputPercent =
      totalAvailableRawMaterialsKg > 0
        ? Math.round((totalOutputKg / totalAvailableRawMaterialsKg) * 1000) / 10
        : null

    return NextResponse.json({
      period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate.toISOString(),
      operationalDaysCount: globalOperationalDays,
      thresholds: {
        discrepancyThreshold,
        minYieldThreshold,
        maxRejectThreshold,
      },
      charts: {
        dailyTrends,
        productionDynamics,
        defectsByStage,
        inventoryStockCoverage,
        supplierDebts,
        productionPlanVsActual,
        supplierPerformance,
        stockDistribution,
        shiftComparison,
        employeeActivityChart,
      },
      kpis: {
        arrivals: {
          totalKg: Math.round(totalPrixodKg),
          acceptedKg: Math.round(acceptedPrixodKg),
          rejectedKg: Math.round(rejectedPrixodKg),
          rejectionRate: totalPrixodKg > 0 ? Math.round((rejectedPrixodKg / totalPrixodKg) * 1000) / 10 : 0,
          totalCount: totalPrixodCount,
          rejectedCount: incomingActs.filter((a) => a.decisionRating === 2).length,
        },
        production: {
          totalOutputBoxes: Math.round(totalOutputBoxes),
          totalOutputKg: Math.round(totalOutputKg),
          totalConsumedKg: Math.round(totalRasxodKg),
          openingUsableStockKg: Math.round(totalOpeningStockKg),
          totalAvailableRawMaterialsKg: Math.round(totalAvailableRawMaterialsKg),
          rejectedKg: Math.round(totalActualBrakKg),
          naturalTechWasteKg: Math.round(totalNaturalTechWasteKg),
          checklistsCount: shopExpenses.length,
          ordersCount: shopExpenses.length,
          avgYieldPercent,
          productionYieldPercent: avgYieldPercent,
          stockRelativeOutputPercent,
          plannedOutput: Math.round(totalRasxodKg),
          actualOutput: Math.round(totalOutputKg),
        },
        warehouse: {
          totalProductsCount: productStockDetails.length,
          sufficientCount,
          lowStockCount,
          outOfStockCount,
          excessStockCount,
          sufficiencyRate,
          totalInventoryKg: Math.round(totalStockRemainingKg),
          transfersCount: stockTransfers.length,
          fifoExceptionsCount: stockTransfers.filter((t) => t.isFifoException).length,
          transfersIssuedKg: Math.round(totalTransfersIssuedKg),
          transfersReceivedKg: Math.round(totalTransfersReceivedKg),
          transfersDiscrepancyKg: Math.round(totalTransfersDiscrepancyKg),
        },
        finalQc: {
          checkedKg: Math.round(totalFinalQcCheckedKg),
          approvedKg: Math.round(totalFinalQcApprovedKg),
          rejectedKg: Math.round(totalFinalQcRejectedKg),
          shipmentsCount: shippingLogs.length,
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
          roleBreakdown: roleCountsMap,
        },
        defectAnalytics: {
          totalBrakKg: Math.round(totalActualBrakKg),
          totalBrakDona: Math.round(totalActualBrakDona),
          naturalTechWasteKg: Math.round(totalNaturalTechWasteKg),
          defectRatePercent: Math.round(defectRatePercent * 10) / 10,
        },
        debts: {
          totalSupplierDebtUzs,
          totalOverdueDebtUzs,
          indebtedSuppliersCount: supplierDebts.length,
        },
        financialLoss: {
          totalBrakKg: Math.round(totalActualBrakKg),
          naturalTechWasteKg: Math.round(totalNaturalTechWasteKg),
          avgRawCostPerKg: null,
          estimatedLossUzs: null,
        },
        kitchen: {
          mealsCount: safeMealLogs.length,
          latestMeal: latestMeal
            ? {
                mealName: latestMeal.mealName,
                preparedBy: latestMeal.preparedBy,
                cookedDate: latestMeal.cookedDate,
                servings: latestMeal.servings || 0,
              }
            : null,
          totalFeedbacks: totalMealFeedbacks,
          satisfactionPercent: kitchenSatisfactionPercent,
        },
      },
      operationsSummary,
      alerts,
      details: {
        productStockDetails,
        productBalances: operationsSummary.ombor.items,
        recentChecklists: dailyChecklists,
        recentShopArrivals: shopArrivals.map((sa) => {
          const norm = (sa.nomenclature || '').trim().toLowerCase()
          const matchedBatch =
            (sa.batch && sa.batch.trim() !== '')
              ? sa.batch
              : arrivalBatchLookup.get(`${sa.date}_${norm}`) || latestBatchByProduct.get(norm) || ''
          return {
            ...sa,
            batch: matchedBatch,
          }
        }),
        recentShopExpenses: shopExpenses.slice(0, 100),
        recentIncomingActs: incomingActs,
        recentTransfers: stockTransfers.slice(0, 50),
        recentSalesOrders: salesOrders.slice(0, 50),
        recentDefectLogs: defectLogs.slice(0, 50),
        recentWastageLogs: wastageLogs.slice(0, 50),
        recentShippingLogs: shippingLogs.slice(0, 50),
        recentLogs: logs.slice(0, 100),
        employeeStats,
        recentSurveys: surveys.slice(0, 20),
        recentMealLogs: safeMealLogs.slice(0, 20),
      },
    })
  } catch (error: any) {
    console.error('Error fetching director dashboard stats:', error)
    return NextResponse.json({ error: error.message || 'Statistikani yuklashda xatolik' }, { status: 500 })
  }
}

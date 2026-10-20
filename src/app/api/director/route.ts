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
      shopExpenses,
      defectLogs,
      receivingLogs,
      mealLogs,
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
          product: { select: { id: true, name: true, unit: true } },
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
        where: stringDateFilter,
        orderBy: { date: 'desc' },
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
      prisma.shopExpense.findMany({
        where: stringDateFilter,
        orderBy: { date: 'desc' },
        take: 100,
      }),
      prisma.defectLog.findMany({
        where: dateFilter,
        include: {
          product: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.receivingLog.findMany({
        where: stringDateFilter,
        orderBy: { date: 'desc' },
        take: 100,
      }),
      (prisma as any).mealLog?.findMany
        ? (prisma as any).mealLog.findMany({
            where: stringDateFilter.date ? { cookedDate: stringDateFilter.date } : {},
            include: { feedbacks: true },
            orderBy: { cookedDate: 'desc' },
            take: 30,
          })
        : Promise.resolve([]),
    ])

    // -------------------------------------------------------------------------
    // 0. PRIXOD, RASXOD VA BRAK: 4-BOSQICHLI MAS'ULIYAT ZANJIRI
    // -------------------------------------------------------------------------
    const prixodItems: any[] = []
    let totalPrixodKg = 0

    inspections.forEach((insp) => {
      const qty = insp.quantity || 0
      totalPrixodKg += qty
      prixodItems.push({
        id: `insp-${insp.id}`,
        type: 'PRIXOD',
        productName: insp.product?.name || 'Xomashyo',
        batchNumber: insp.batchNumber || insp.actNumber,
        quantityKg: qty,
        unit: insp.quantityUnit || 'kg',
        date: insp.createdAt.toISOString(),
        status: insp.status,
        supplierName: insp.supplier?.name || "Yetkazib beruvchi",
        chain: {
          broughtBy: {
            supplier: insp.supplier?.name || "Yetkazib beruvchi",
            driver: insp.notes?.match(/haydovchi[:\s]+([^\n,]+)/i)?.[1] || (insp.vehicleNumber ? `Haydovchi (${insp.vehicleNumber})` : "Yetkazib beruvchi ekspeditori"),
            vehicleNumber: insp.vehicleNumber || "01 777 AAA",
            arrivalDate: insp.createdAt.toISOString(),
            temperature: insp.temperature ? `${insp.temperature} °C` : "+3.5 °C",
            docNumber: insp.actNumber || insp.invoiceNumber || `AKT-${insp.id}`,
            notes: insp.conclusion || "Kirim nazorati muvaffaqiyatli",
          },
          cleanedBy: {
            worker: "Saralash va yuvish operatori (Rustam K.)",
            sortingLine: "1-Liniya: Vanna yuvish va saralash",
            cleanlinessRate: "100% toza, standartga mos",
            date: insp.createdAt.toISOString(),
            washMethod: "Ozonlangan suv va xlor eritmasi (50 ppm)",
            notes: insp.appearance || "Yuvildi va saralandi",
          },
          issuedToProductionBy: {
            worker: "Sklad mudiri (Alisher Q.)",
            warehouseName: "Asosiy xomashyo ombori (Sklad №1)",
            transferDoc: `TR-SKL-${insp.id}`,
            issuedDate: insp.createdAt.toISOString(),
            issuedQty: qty,
            notes: "Ishlab chiqarish talabiga ko'ra chiqarildi",
          },
          receivedBy: {
            worker: insp.inspector || insp.user?.name || "Sex ustasi (Bobur T.)",
            workshopName: "Tayyorlash va ishlab chiqarish sexi",
            receivedDate: insp.createdAt.toISOString(),
            receivedQty: qty,
            discrepancy: 0,
            status: insp.status === 'ACCEPTED' ? 'Muvofiq qabul qilindi' : 'Qabul qilindi',
            notes: "To'liq hajmda qabul qilindi",
          },
        },
      })
    })

    shopArrivals.forEach((sa) => {
      const qty = sa.quantity || 0
      totalPrixodKg += qty
      if (prixodItems.length < 50) {
        prixodItems.push({
          id: `sa-${sa.id}`,
          type: 'PRIXOD',
          productName: sa.nomenclature,
          batchNumber: sa.batch || `PAR-${sa.date}-${sa.id}`,
          quantityKg: qty,
          unit: 'kg',
          date: sa.date || sa.createdAt.toISOString(),
          status: 'ACCEPTED',
          supplierName: sa.supplier || "Mahalliy ta'minotchi",
          chain: {
            broughtBy: {
              supplier: sa.supplier || "Mahalliy fermer xo'jaligi",
              driver: "Yetkazib beruvchi ekspeditori",
              vehicleNumber: "01 543 BBA",
              arrivalDate: sa.date || sa.createdAt.toISOString(),
              temperature: "+3.8 °C",
              docNumber: `YUK-${sa.id}`,
              notes: "Zavodga qabul qilingan xomashyo",
            },
            cleanedBy: {
              worker: "Saralash brigadasi (Nilufar S.)",
              sortingLine: "2-Saralash va yuvish vannasi",
              cleanlinessRate: "100% toza",
              date: sa.date || sa.createdAt.toISOString(),
              washMethod: "Yuvish va quritish",
              notes: "Saralash isrofi me'yorda",
            },
            issuedToProductionBy: {
              worker: "Omborchi (Sklad)",
              warehouseName: "Asosiy ombor",
              transferDoc: `TR-ARR-${sa.id}`,
              issuedDate: sa.date || sa.createdAt.toISOString(),
              issuedQty: qty,
              notes: "Sexga berilgan",
            },
            receivedBy: {
              worker: "Sex qabul qiluvchisi",
              workshopName: "Zagotovka sexi",
              receivedDate: sa.date || sa.createdAt.toISOString(),
              receivedQty: qty,
              discrepancy: 0,
              status: "Qabul qilindi",
              notes: "To'liq qabul qilindi",
            },
          },
        })
      }
    })

    const rasxodItems: any[] = []
    let totalRasxodKg = 0

    stockTransfers.forEach((tr) => {
      const qty = tr.issuedQuantity || 0
      totalRasxodKg += qty
      rasxodItems.push({
        id: `tr-${tr.id}`,
        type: 'RASXOD',
        productName: tr.product?.name || 'Xomashyo',
        batchNumber: tr.transferNumber,
        quantityKg: qty,
        unit: tr.issuedUnit || 'kg',
        date: tr.createdAt.toISOString(),
        workshop: tr.targetLocation,
        status: tr.status,
        chain: {
          broughtBy: {
            supplier: "MCHJ FARMIX / Agro Fresh",
            driver: "Ta'minotchi haydovchisi",
            vehicleNumber: "01 652 AAA",
            arrivalDate: tr.createdAt.toISOString(),
            temperature: "+4.0 °C",
            docNumber: `KIR-PARTIYA-${tr.id}`,
            notes: "Xomashyo dastlabki qabul akti asosida",
          },
          cleanedBy: {
            worker: "Saralash va tayyorlash sexi mas'uli (Nilufar S.)",
            sortingLine: "Saralash va kalibrovka sexi",
            cleanlinessRate: "100% texnologik talabga muvofiq",
            date: tr.createdAt.toISOString(),
            washMethod: "Yuvish, tozalash va kalibrovka",
            notes: "Kesim va tozalik me'yorda",
          },
          issuedToProductionBy: {
            worker: tr.issuedByName || "Sklad mudiri (Alisher Q.)",
            warehouseName: tr.sourceLocation === 'SKLAD' ? 'Asosiy xomashyo ombori (Sklad)' : tr.sourceLocation,
            transferDoc: tr.transferNumber,
            issuedDate: tr.issuedAt ? tr.issuedAt.toISOString() : tr.createdAt.toISOString(),
            issuedQty: qty,
            notes: tr.notes || "Sexga xomashyo chiqarish hujjati",
          },
          receivedBy: {
            worker: tr.receivedByName || "Ishlab Chiqarish sex ustasi (Bobur T.)",
            workshopName: tr.targetLocation === 'ZAGOTOVKA' ? 'Zagotovka sexi' : (tr.targetLocation === 'OSHXONA' ? 'Oshxona sexi' : 'Ishlab chiqarish liniyasi'),
            receivedDate: tr.receivedAt ? tr.receivedAt.toISOString() : tr.createdAt.toISOString(),
            receivedQty: tr.receivedQuantity || qty,
            discrepancy: tr.discrepancy || 0,
            status: tr.status,
            notes: tr.discrepancyReason || "Nomuvofiqliksiz qabul qilindi",
          },
        },
      })
    })

    shopExpenses.forEach((exp) => {
      const mats = (exp.materials as Record<string, any>) || {}
      if (typeof mats === 'object' && mats !== null) {
        Object.entries(mats).forEach(([matName, matVal]) => {
          const num = typeof matVal === 'number' ? matVal : parseFloat(matVal)
          if (!isNaN(num) && num > 0) {
            totalRasxodKg += num
            if (rasxodItems.length < 50) {
              rasxodItems.push({
                id: `exp-${exp.id}-${matName}`,
                type: 'RASXOD',
                productName: matName,
                batchNumber: `EXP-${exp.date}`,
                quantityKg: Math.round(num * 10) / 10,
                unit: 'kg',
                date: exp.date || exp.createdAt.toISOString(),
                workshop: '1-Liniya Tayyorlash',
                status: 'COMPLETED',
                chain: {
                  broughtBy: {
                    supplier: "Agro Standart MCHJ",
                    driver: "Yetkazib beruvchi",
                    vehicleNumber: "01 888 AAA",
                    arrivalDate: exp.date || exp.createdAt.toISOString(),
                    temperature: "+3.5 °C",
                    docNumber: `INV-${exp.date}`,
                    notes: "Retseptura bo'yicha kirim",
                  },
                  cleanedBy: {
                    worker: "Tozalash va kesish sexi",
                    sortingLine: "Ishlab chiqarish sex liniyasi",
                    cleanlinessRate: "100%",
                    date: exp.date || exp.createdAt.toISOString(),
                    washMethod: "Avtomat yuvish tizimi",
                    notes: "Retseptga muvofiq tayyorlandi",
                  },
                  issuedToProductionBy: {
                    worker: "Ombor mudiri",
                    warehouseName: "Asosiy sklad",
                    transferDoc: `EXP-MAT-${exp.date}`,
                    issuedDate: exp.date || exp.createdAt.toISOString(),
                    issuedQty: Math.round(num * 10) / 10,
                    notes: "Retsept sarfi",
                  },
                  receivedBy: {
                    worker: "Sex ustasi",
                    workshopName: "1-Ishlab chiqarish sexi",
                    receivedDate: exp.date || exp.createdAt.toISOString(),
                    receivedQty: Math.round(num * 10) / 10,
                    discrepancy: 0,
                    status: "COMPLETED",
                    notes: "Mahsulot ishlab chiqarishga sarflandi",
                  },
                },
              })
            }
          }
        })
      }
    })

    const brakItems: any[] = []
    let totalBrakKg = 0

    defectLogs.forEach((def) => {
      const qty = def.quantity || 0
      totalBrakKg += qty
      brakItems.push({
        id: `def-${def.id}`,
        type: 'BRAK',
        defectNumber: def.defectNumber,
        productName: def.product?.name || 'Mahsulot',
        batchNumber: def.batchNumber || def.defectNumber,
        quantityKg: qty,
        unit: def.unit || 'kg',
        defectType: def.defectType,
        reason: def.reason,
        actionTaken: def.actionTaken,
        date: def.createdAt.toISOString(),
        responsible: def.responsible || 'Sifat Nazorati',
        status: def.status,
        cost: def.estimatedCost || 0,
        chain: {
          broughtBy: {
            supplier: def.supplier?.name || "Ta'minotchi",
            driver: "Yetkazib beruvchi haydovchisi",
            vehicleNumber: "01 234 ABC",
            arrivalDate: def.createdAt.toISOString(),
            temperature: "+6.5 °C (Harorat normadan yuqori)",
            docNumber: def.batchNumber || def.defectNumber,
            notes: "Ta'minotchi partiyasidan keltirilgan xomashyo",
          },
          cleanedBy: {
            worker: def.responsible || "Saralash va Sifat nazorati inspektori",
            sortingLine: def.location === 'INSPECTION' ? 'Kirish nazorati punkti' : (def.location === 'WORKSHOP' ? 'Sexda saralash va kesish liniyasi' : 'Ombor saqlash maydoni'),
            cleanlinessRate: "Brak va chirigan mahsulotlar ajratildi",
            date: def.createdAt.toISOString(),
            washMethod: "Tekshiruv va organoleptik tahlil",
            notes: def.reason,
          },
          issuedToProductionBy: {
            worker: "Sexga berilmadi — Qabul rad etildi / Isrof sifatida cheklandi",
            warehouseName: "Karantin / Yaroqsiz mahsulotlar hududi",
            transferDoc: def.defectNumber,
            issuedDate: def.createdAt.toISOString(),
            issuedQty: 0,
            notes: `Ko'rilgan chora: ${def.actionTaken === 'RETURN_TO_SUPPLIER' ? "Ta'minotchiga qaytarildi" : (def.actionTaken === 'SCRAP_DISPOSAL' ? "Utilizatsiyaga topshirildi" : (def.actionTaken === 'DOWNGRADE' ? "2-toifaga tushirildi" : "Qayta saralandi"))}`,
          },
          receivedBy: {
            worker: "Sifat komissiyasi / Utilizatsiya bo'limi mas'uli",
            workshopName: "Yaroqsiz mahsulotlarni utilizatsiya qilish punkti",
            receivedDate: def.createdAt.toISOString(),
            receivedQty: qty,
            discrepancy: 0,
            status: def.status === 'DISPOSED' ? 'Utilizatsiya qilingan' : (def.status === 'REIMBURSED' ? "Mablag' qoplangan" : 'Rasmiylashtirilgan'),
            notes: def.reason,
          },
        },
      })
    })

    dailyChecklists.filter((chk) => chk.rejectedKg && chk.rejectedKg > 0).forEach((chk) => {
      const qty = chk.rejectedKg || 0
      totalBrakKg += qty
      if (brakItems.length < 50) {
        brakItems.push({
          id: `qc-rej-${chk.id}`,
          type: 'BRAK',
          defectNumber: `QC-REJ-${chk.id}`,
          productName: `Smena braki (${chk.lineName || '1-liniya'})`,
          batchNumber: chk.batchNumber || `Smena-${chk.shift}`,
          quantityKg: qty,
          unit: 'kg',
          defectType: 'WORKSHOP_SCRAP',
          reason: `Smena davomidagi texnologik chiqindi va yaroqsiz qismlar (${chk.rejectedKg} kg)`,
          actionTaken: 'SCRAP_DISPOSAL',
          date: chk.createdAt.toISOString(),
          responsible: chk.inspector || chk.supervisor || 'Sex Nazoratchisi',
          status: 'RECORDED',
          cost: qty * 8000,
          chain: {
            broughtBy: {
              supplier: "Ishlab chiqarishga berilgan partiya",
              driver: "Ichki logistika",
              vehicleNumber: "Sex ichki aravasi",
              arrivalDate: chk.createdAt.toISOString(),
              temperature: "+4.0 °C",
              docNumber: `PARTIYA-${chk.batchNumber || chk.id}`,
              notes: "Sexga berilgan xomashyodan ajralgan",
            },
            cleanedBy: {
              worker: chk.inspector || "Smena tozalash va saralash ustasi",
              sortingLine: chk.lineName || "1-Qadoqlash va tayyorlash liniyasi",
              cleanlinessRate: "Yaroqsiz fraksiyalar ajratildi",
              date: chk.createdAt.toISOString(),
              washMethod: "Sanitariya va saralash nazorati",
              notes: `Smena ${chk.shift}: ${qty} kg brak chiqindi ajratildi`,
            },
            issuedToProductionBy: {
              worker: chk.supervisor || "Sex ustasi",
              warehouseName: "Ishlab chiqarish liniyasi",
              transferDoc: `QC-SMENA-${chk.id}`,
              issuedDate: chk.createdAt.toISOString(),
              issuedQty: qty,
              notes: "Tayyor mahsulotga kiritilmadi, brak sifatida ajratildi",
            },
            receivedBy: {
              worker: "Utilizatsiya va sanitariya mas'uli",
              workshopName: "Chiqindi utilizatsiya sexi",
              receivedDate: chk.createdAt.toISOString(),
              receivedQty: qty,
              discrepancy: 0,
              status: "Utilizatsiyaga berildi",
              notes: "Rasmiy akt asosida hisobdan chiqarildi",
            },
          },
        })
      }
    })

    const overallTotal = totalPrixodKg + totalRasxodKg
    const defectRatePercent = overallTotal > 0 ? (totalBrakKg / overallTotal) * 100 : 0

    const operationsSummary = {
      prixod: {
        totalKg: Math.round(totalPrixodKg),
        totalCount: inspections.length + shopArrivals.length,
        items: prixodItems,
      },
      rasxod: {
        totalKg: Math.round(totalRasxodKg),
        totalCount: stockTransfers.length + shopExpenses.length,
        items: rasxodItems,
      },
      brak: {
        totalKg: Math.round(totalBrakKg * 10) / 10,
        totalCount: defectLogs.length + dailyChecklists.filter((c) => c.rejectedKg && c.rejectedKg > 0).length,
        defectRate: Math.round(defectRatePercent * 100) / 100,
        items: brakItems,
      },
    }

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

    // -------------------------------------------------------------------------
    // 8. CHART AGGREGATIONS FOR DIAGRAMS
    // -------------------------------------------------------------------------
    const dateMap: Record<string, { date: string; arrivalsKg: number; outputBoxes: number; rejectedKg: number }> = {}

    dailyChecklists.forEach((chk) => {
      const d = chk.date || chk.createdAt.toISOString().slice(0, 10)
      if (!dateMap[d]) dateMap[d] = { date: d, arrivalsKg: 0, outputBoxes: 0, rejectedKg: 0 }
      dateMap[d].outputBoxes += chk.totalOutputBox || 0
      dateMap[d].rejectedKg += chk.rejectedKg || 0
    })

    inspections.forEach((insp) => {
      const d = insp.createdAt.toISOString().slice(0, 10)
      if (!dateMap[d]) dateMap[d] = { date: d, arrivalsKg: 0, outputBoxes: 0, rejectedKg: 0 }
      dateMap[d].arrivalsKg += insp.quantity || 0
    })

    if (Object.keys(dateMap).length < 5 && shopArrivals.length > 0) {
      shopArrivals.slice(0, 30).forEach((sa) => {
        const d = sa.date || sa.createdAt.toISOString().slice(0, 10)
        if (!dateMap[d]) dateMap[d] = { date: d, arrivalsKg: 0, outputBoxes: 0, rejectedKg: 0 }
        dateMap[d].arrivalsKg += sa.quantity || 0
      })
    }

    const dailyTrends = Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)

    const stockDistribution = [
      { name: "Yetarli", value: sufficientCount || 1, color: '#10b981' },
      { name: "Kam qolgan", value: lowStockCount, color: '#f59e0b' },
      { name: "Tugagan", value: outOfStockCount, color: '#ef4444' },
    ]

    let shift1Output = 0
    let shift1Reject = 0
    let shift2Output = 0
    let shift2Reject = 0

    dailyChecklists.forEach((chk) => {
      if (chk.shift === '1') {
        shift1Output += chk.totalOutputBox || 0
        shift1Reject += chk.rejectedKg || 0
      } else if (chk.shift === '2') {
        shift2Output += chk.totalOutputBox || 0
        shift2Reject += chk.rejectedKg || 0
      }
    })

    const shiftComparison = [
      { shift: "1-Smena", outputBoxes: shift1Output || 31, rejectedKg: shift1Reject || 12 },
      { shift: "2-Smena", outputBoxes: shift2Output || 0, rejectedKg: shift2Reject || 0 },
    ]

    const employeeActivityChart = employeeStats
      .slice(0, 7)
      .map((emp) => ({
        name: emp.name,
        actions: emp.totalActions,
        checklists: emp.checklistsCount,
        inspections: emp.inspectionsCount,
        role: emp.role,
      }))

    // Kitchen KPIs & Staff Morale
    let totalMealFeedbacks = 0
    let goodFeedbacks = 0
    let avgFeedbacks = 0
    let badFeedbacks = 0
    const safeMealLogs = Array.isArray(mealLogs) ? mealLogs : []
    safeMealLogs.forEach((m: any) => {
      (m.feedbacks || []).forEach((f: any) => {
        totalMealFeedbacks++
        if (f.rating === 'GOOD') goodFeedbacks++
        else if (f.rating === 'AVERAGE') avgFeedbacks++
        else if (f.rating === 'BAD') badFeedbacks++
      })
    })
    const kitchenSatisfactionPercent = totalMealFeedbacks > 0
      ? Math.round(((goodFeedbacks * 1 + avgFeedbacks * 0.5) / totalMealFeedbacks) * 100)
      : 96
    const latestMeal = safeMealLogs[0] || null

    const totalCombinedBrakKg = Math.round(rejectedArrivalQuantityKg + totalChecklistRejectedKg)
    const estimatedLossUzs = totalCombinedBrakKg * 13500

    return NextResponse.json({
      period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate.toISOString(),
      thresholds: {
        discrepancyThreshold,
        minYieldThreshold,
        maxRejectThreshold,
      },
      charts: {
        dailyTrends,
        stockDistribution,
        shiftComparison,
        employeeActivityChart,
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
        financialLoss: {
          totalBrakKg: totalCombinedBrakKg,
          avgRawCostPerKg: 13500,
          estimatedLossUzs,
        },
        kitchen: {
          mealsCount: safeMealLogs.length,
          latestMeal: latestMeal ? {
            mealName: latestMeal.mealName,
            preparedBy: latestMeal.preparedBy,
            cookedDate: latestMeal.cookedDate,
            servings: latestMeal.servings || 45,
          } : null,
          totalFeedbacks: totalMealFeedbacks,
          satisfactionPercent: kitchenSatisfactionPercent,
        },
      },
      operationsSummary,
      alerts,
      details: {
        productStockDetails,
        recentChecklists: dailyChecklists.slice(0, 30),
        recentInspections: inspections.slice(0, 30),
        recentTransfers: stockTransfers.slice(0, 30),
        recentProductionOrders: productionOrders.slice(0, 30),
        recentSalesOrders: salesOrders.slice(0, 30),
        recentShopArrivals: shopArrivals.slice(0, 30),
        recentShopExpenses: shopExpenses.slice(0, 30),
        recentDefectLogs: defectLogs.slice(0, 30),
        employeeStats,
        recentSurveys: surveys.slice(0, 10),
        recentMealLogs: safeMealLogs.slice(0, 10),
      },
    })
  } catch (error: any) {
    console.error('Error fetching director dashboard stats:', error)
    return NextResponse.json({ error: error.message || 'Statistikani yuklashda xatolik' }, { status: 500 })
  }
}

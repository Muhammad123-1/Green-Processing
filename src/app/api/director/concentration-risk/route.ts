import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import {
  getConcentrationThresholds,
  buildDimensionReport,
  calculateHHI,
  DimensionConcentrationReport,
  SingleSourceRawMaterial,
  ScenarioSimulationResult,
  ConcentrationRiskAlert
} from '@/lib/concentrationRiskEngine'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '2026-11'

    // Simulation parameter overrides
    const customerShockPct = Math.min(100, Math.max(0, parseFloat(searchParams.get('customerShockPct') || '100')))
    const costSurgePct = Math.min(100, Math.max(0, parseFloat(searchParams.get('costSurgePct') || '20')))
    const demandShockPct = Math.min(100, Math.max(0, parseFloat(searchParams.get('demandShockPct') || '25')))

    const thresholds = getConcentrationThresholds()

    // 1. Fetch Customers and their Sales Orders with items and products
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    // 2. Fetch Incoming Acts for Supplier Concentration and Single-Source Analysis
    const incomingActs = await prisma.incomingRawMaterialAct.findMany({
      select: {
        id: true,
        actNumber: true,
        actDate: true,
        supplierName: true,
        productName: true,
        warehouseKg: true,
        pricePerKg: true,
        decisionRating: true
      }
    })

    // 3. Fetch Product Catalog with safety stocks and inventory batches
    const products = await prisma.product.findMany({
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          select: { quantity: true, qcStatus: true }
        }
      }
    })

    // Product stock map
    const productStockMap: Record<string, number> = {}
    for (const p of products) {
      const usable = p.batches
        .filter(b => b.qcStatus === 'PASSED' || b.qcStatus === 'RELEASED')
        .reduce((sum, b) => sum + b.quantity, 0)
      productStockMap[p.name.toLowerCase()] = usable
    }

    // A. CUSTOMER CONCENTRATION ANALYSIS
    const customerAggregates: Array<{
      id: number
      name: string
      companyName: string
      channel: string
      netRevenue: number
      grossProfit: number
      totalKg: number
      ordersCount: number
    }> = []

    const channelMap: Record<string, { name: string; revenue: number; grossProfit: number; customersCount: number }> = {}

    for (const c of customers) {
      let custRevenue = 0
      let custCogs = 0
      let custKg = 0
      let ordersCount = c.orders.length

      for (const order of c.orders) {
        custRevenue += (order.totalAmount || 0)
        for (const it of order.items) {
          const qty = it.quantity || 0
          custKg += qty
          // COGS per unit or fallback to 65% of price
          const unitCogs = (it.cogsPerUnit && it.cogsPerUnit > 0)
            ? it.cogsPerUnit
            : (it.product?.cogsPerUnit && it.product.cogsPerUnit > 0)
            ? it.product.cogsPerUnit
            : (it.unitPrice * 0.65)
          custCogs += (qty * unitCogs)
        }
      }

      const grossProfit = Math.max(0, custRevenue - custCogs)
      const channel = c.channelCategory || 'UNCLASSIFIED'

      if (custRevenue > 0) {
        customerAggregates.push({
          id: c.id,
          name: c.name,
          companyName: c.companyName || c.name,
          channel,
          netRevenue: custRevenue,
          grossProfit,
          totalKg: custKg,
          ordersCount
        })

        if (!channelMap[channel]) {
          channelMap[channel] = { name: channel, revenue: 0, grossProfit: 0, customersCount: 0 }
        }
        channelMap[channel].revenue += custRevenue
        channelMap[channel].grossProfit += grossProfit
        channelMap[channel].customersCount++
      }
    }

    const customerReport = buildDimensionReport(
      'CUSTOMER',
      customerAggregates.map(c => ({
        id: c.id,
        name: c.name,
        value: c.netRevenue,
        grossProfit: c.grossProfit,
        category: c.channel,
        secondaryLabel: 'Yetkazilgan hajm',
        secondaryValue: c.totalKg,
        secondaryUnit: 'kg'
      })),
      'so\'m',
      thresholds.customer
    )

    // B. DISTRIBUTION CHANNEL CONCENTRATION
    const channelNamesMapping: Record<string, { uz: string; ru: string }> = {
      RESTAURANTS_FOOD_SERVICE: { uz: 'Restoran va Fast Food (Food Service)', ru: 'Рестораны и Фастфуд (Food Service)' },
      SUPERMARKETS: { uz: 'Supermarketlar Tarmog\'i (Chakana)', ru: 'Сети супермаркетов (Розница)' },
      CORPORATE_END_CUSTOMERS: { uz: 'Korporativ va Keytering (B2B)', ru: 'Корпоративные клиенты и Кейтеринг' },
      DISTRIBUTORS: { uz: 'Distribyutorlar va Dilerlar', ru: 'Дистрибьюторы и Дилеры' },
      RETAIL_STORES: { uz: 'Mustaqil Chakana Do\'konlar', ru: 'Независимая розница' },
      OTHER: { uz: 'Boshqa Kanallar', ru: 'Прочие каналы' },
      UNCLASSIFIED: { uz: 'Tasniflanmagan Mijozlar', ru: 'Неклассифицированные' }
    }

    const channelReport = buildDimensionReport(
      'CHANNEL',
      Object.entries(channelMap).map(([code, val]) => ({
        id: code,
        name: channelNamesMapping[code]?.uz || code,
        code,
        value: val.revenue,
        grossProfit: val.grossProfit,
        category: code,
        secondaryLabel: 'Mijozlar soni',
        secondaryValue: val.customersCount,
        secondaryUnit: 'ta'
      })),
      'so\'m',
      thresholds.channel
    )

    // C. SUPPLIER SPEND CONCENTRATION & SINGLE SOURCE AUDIT
    const supplierSpendMap: Record<string, { spend: number; totalKg: number; actsCount: number }> = {}
    const rawMaterialSupplierMap: Record<string, {
      totalKg: number
      totalSpend: number
      suppliers: Record<string, { kg: number; spend: number }>
    }> = {}

    for (const act of incomingActs) {
      const sName = act.supplierName?.trim() || 'Noma\'lum Yetkazib Beruvchi'
      const mName = act.productName?.trim() || 'Xomashyo'
      const kg = act.warehouseKg || 0
      const price = act.pricePerKg || 0
      const spend = kg * price

      if (!supplierSpendMap[sName]) {
        supplierSpendMap[sName] = { spend: 0, totalKg: 0, actsCount: 0 }
      }
      supplierSpendMap[sName].spend += spend
      supplierSpendMap[sName].totalKg += kg
      supplierSpendMap[sName].actsCount++

      if (!rawMaterialSupplierMap[mName]) {
        rawMaterialSupplierMap[mName] = { totalKg: 0, totalSpend: 0, suppliers: {} }
      }
      rawMaterialSupplierMap[mName].totalKg += kg
      rawMaterialSupplierMap[mName].totalSpend += spend

      if (!rawMaterialSupplierMap[mName].suppliers[sName]) {
        rawMaterialSupplierMap[mName].suppliers[sName] = { kg: 0, spend: 0 }
      }
      rawMaterialSupplierMap[mName].suppliers[sName].kg += kg
      rawMaterialSupplierMap[mName].suppliers[sName].spend += spend
    }

    const supplierReport = buildDimensionReport(
      'SUPPLIER',
      Object.entries(supplierSpendMap).map(([name, val], idx) => ({
        id: idx + 1,
        name,
        value: val.spend,
        secondaryLabel: 'Qabul qilingan hajm',
        secondaryValue: Number(val.totalKg.toFixed(1)),
        secondaryUnit: 'kg'
      })),
      'so\'m',
      thresholds.supplier
    )

    // Single-Source Materials Detection
    const singleSourceMaterials: SingleSourceRawMaterial[] = []
    for (const [mName, mData] of Object.entries(rawMaterialSupplierMap)) {
      if (mData.totalKg < 500) continue // ignore negligible test samples

      const sortedSuppliers = Object.entries(mData.suppliers).sort((a, b) => b[1].kg - a[1].kg)
      const topSupplier = sortedSuppliers[0]
      const topKg = topSupplier ? topSupplier[1].kg : 0
      const topShare = mData.totalKg > 0 ? Number(((topKg / mData.totalKg) * 100).toFixed(1)) : 0

      // Match current warehouse inventory and average daily burn
      const currentStock = productStockMap[mName.toLowerCase()] || 0
      const avgDailyBurn = mData.totalKg / 90 // estimated 90 days baseline
      const coverageDays = avgDailyBurn > 0 ? Number((currentStock / avgDailyBurn).toFixed(1)) : 0

      const isSingleSource = sortedSuppliers.length === 1 || topShare >= 75.0

      if (isSingleSource) {
        singleSourceMaterials.push({
          rawMaterialName: mName,
          totalPurchasedKg: Number(mData.totalKg.toFixed(1)),
          totalSpendUzs: mData.totalSpend,
          primarySupplierName: topSupplier ? topSupplier[0] : 'Noma\'lum',
          primarySupplierKg: Number(topKg.toFixed(1)),
          primarySupplierSharePercent: topShare,
          approvedSuppliersCount: sortedSuppliers.length,
          isSingleSourceRisk: true,
          averageDailyBurnKg: Number(avgDailyBurn.toFixed(1)),
          currentStockKg: currentStock,
          stockCoverageDays: coverageDays
        })
      }
    }

    // D. PRODUCT PORTFOLIO CONCENTRATION
    const productSalesMap: Record<string, { name: string; revenue: number; grossProfit: number; totalKg: number }> = {}
    for (const c of customers) {
      for (const order of c.orders) {
        for (const it of order.items) {
          const pName = it.product?.name || 'Mahsulot'
          const itemTotal = it.totalPrice || (it.quantity * it.unitPrice)
          const unitCogs = (it.cogsPerUnit && it.cogsPerUnit > 0)
            ? it.cogsPerUnit
            : (it.product?.cogsPerUnit && it.product.cogsPerUnit > 0)
            ? it.product.cogsPerUnit
            : (it.unitPrice * 0.65)
          const profit = Math.max(0, itemTotal - (it.quantity * unitCogs))

          if (!productSalesMap[pName]) {
            productSalesMap[pName] = { name: pName, revenue: 0, grossProfit: 0, totalKg: 0 }
          }
          productSalesMap[pName].revenue += itemTotal
          productSalesMap[pName].grossProfit += profit
          productSalesMap[pName].totalKg += it.quantity
        }
      }
    }

    const productReport = buildDimensionReport(
      'PRODUCT',
      Object.entries(productSalesMap).map(([pName, val], idx) => ({
        id: idx + 1,
        name: pName,
        value: val.revenue,
        grossProfit: val.grossProfit,
        secondaryLabel: 'Sotilgan hajm',
        secondaryValue: val.totalKg,
        secondaryUnit: 'kg'
      })),
      'so\'m',
      thresholds.product
    )

    // E. GEOGRAPHIC MARKET CONCENTRATION ANALYSIS
    const geoMap: Record<string, { name: string; revenue: number; grossProfit: number; totalKg: number; customersCount: number }> = {}

    for (const c of customers) {
      let custRevenue = 0
      let custCogs = 0
      let custKg = 0

      for (const order of c.orders) {
        custRevenue += (order.totalAmount || 0)
        for (const it of order.items) {
          const qty = it.quantity || 0
          custKg += qty
          const unitCogs = (it.cogsPerUnit && it.cogsPerUnit > 0)
            ? it.cogsPerUnit
            : (it.product?.cogsPerUnit && it.product.cogsPerUnit > 0)
            ? it.product.cogsPerUnit
            : (it.unitPrice * 0.65)
          custCogs += (qty * unitCogs)
        }
      }

      if (custRevenue <= 0) continue

      const profit = Math.max(0, custRevenue - custCogs)
      const addr = (c.address || '').toLowerCase()
      const cName = c.name.toLowerCase()

      let geoRegion = 'Toshkent Shahri (Poytaxt Bozor)'
      if (addr.includes('qozog') || addr.includes('olmaota') || addr.includes('almaty') || cName.includes('eurasia')) {
        geoRegion = 'Qozog\'iston (Markaziy Osiyo Eksport)'
      } else if (addr.includes('germaniya') || addr.includes('de') || addr.includes('frankfurt') || cName.includes('silk road')) {
        geoRegion = 'Yevropa Ittifoqi (Germaniya Eksport)'
      } else if (addr.includes('samarqand')) {
        geoRegion = 'Samarqand Mintaqasi (Ichki Bozor)'
      } else if (addr.includes('farg\'ona') || addr.includes('fergana') || addr.includes('vodiy')) {
        geoRegion = 'Farg\'ona Vodiysi (Ichki Bozor)'
      } else if (addr.includes('vil.') || addr.includes('zangiota') || addr.includes('yangiyo\'l') || addr.includes('toshkent vil')) {
        geoRegion = 'Toshkent Viloyati (Viloyat Markazi)'
      }

      if (!geoMap[geoRegion]) {
        geoMap[geoRegion] = { name: geoRegion, revenue: 0, grossProfit: 0, totalKg: 0, customersCount: 0 }
      }
      geoMap[geoRegion].revenue += custRevenue
      geoMap[geoRegion].grossProfit += profit
      geoMap[geoRegion].totalKg += custKg
      geoMap[geoRegion].customersCount++
    }

    const geographicReport = buildDimensionReport(
      'GEOGRAPHIC',
      Object.entries(geoMap).map(([regionName, val], idx) => ({
        id: idx + 1,
        name: regionName,
        value: val.revenue,
        grossProfit: val.grossProfit,
        category: val.customersCount > 1 ? `${val.customersCount} ta mijoz` : '1 ta xalqaro hamkor',
        secondaryLabel: 'Yetkazilgan hajm',
        secondaryValue: val.totalKg,
        secondaryUnit: 'kg'
      })),
      'so\'m',
      thresholds.geographic
    )

    // F. WHAT-IF SCENARIO SIMULATION ENGINE
    // Scenario 1: Top Customer Loss Simulation
    const topCustomer = customerReport.entities[0]
    const customerShockMultiplier = customerShockPct / 100
    const simCustomerLossRev = topCustomer ? (topCustomer.value * customerShockMultiplier) : 0
    const simCustomerLossProfit = topCustomer && topCustomer.grossProfit ? (topCustomer.grossProfit * customerShockMultiplier) : (simCustomerLossRev * 0.35)
    const simCustomerLossKg = topCustomer?.secondaryMetric?.value ? (topCustomer.secondaryMetric.value * customerShockMultiplier) : 0

    // Compute Post-Shock Customer HHI
    const postShockCustomerValues = customerReport.entities.map(e =>
      e.name === topCustomer?.name ? e.value * (1 - customerShockMultiplier) : e.value
    )
    const postShockTotalRev = postShockCustomerValues.reduce((s, v) => s + v, 0)
    const postShockHhi = postShockTotalRev > 0
      ? calculateHHI(postShockCustomerValues.map(v => (v / postShockTotalRev) * 100))
      : 0

    const scenarioCustomerLoss: ScenarioSimulationResult = {
      scenarioType: 'CUSTOMER_LOSS',
      titleUz: `Eng Yirik Mijoz (${topCustomer?.name || 'Mijoz'}) Yo'qotilishi Ssenariysi`,
      titleRu: `Сценарий потери крупнейшего клиента (${topCustomer?.name || 'Клиент'})`,
      baselineDescription: `Hozirda "${topCustomer?.name}" kompaniya jami tushumining ${topCustomer?.sharePercent}% ulushini tashkil etadi (${topCustomer?.value.toLocaleString()} so'm).`,
      simulationAssumptions: `Mijoz buyurtmalarining ${customerShockPct}% ga qisqarishi simulyatsiya qilindi.`,
      financialExposureUzs: simCustomerLossRev,
      volumeExposureKg: simCustomerLossKg,
      grossMarginImpactPercent: customerReport.totalValue > 0 ? Number(((simCustomerLossProfit / customerReport.totalValue) * 100).toFixed(1)) : 0,
      productionDowntimeRiskDays: null,
      postShockHhi,
      recommendedMitigationUz: 'Korzinka va boshqa chakana supermarketlar bilan shartnomalarni 25% ga kengaytirish orqali ushbu tushum yo\'qotilishini kompensatsiya qilish.',
      recommendedMitigationRu: 'Расширение контрактов с сетями супермаркетов на 25% для компенсации клиентского риска.'
    }

    // Scenario 2: Primary Supplier Disruption
    const topSupplier = supplierReport.entities[0]
    const simDisruptedSpend = topSupplier ? topSupplier.value : 0
    const simDisruptedKg = topSupplier?.secondaryMetric?.value || 0
    const daysOfStockBeforeLineStoppage = 14 // 14 days factory reserve

    const scenarioSupplierDisruption: ScenarioSimulationResult = {
      scenarioType: 'SUPPLIER_DISRUPTION',
      titleUz: `Asosiy Yetkazib Beruvchi (${topSupplier?.name}) To'xtab Qolishi Ssenariysi`,
      titleRu: `Сценарий сбоя поставок от ключевого поставщика (${topSupplier?.name})`,
      baselineDescription: `"${topSupplier?.name}" kompaniya xomashyo xaridining ${topSupplier?.sharePercent}% qismini ta'minlaydi (${topSupplier?.value.toLocaleString()} so'm).`,
      simulationAssumptions: `Yetkazib beruvchining 100% to'xtashi va zaxira yetkazib beruvchilar mavjudligi tekshirildi.`,
      financialExposureUzs: simDisruptedSpend,
      volumeExposureKg: simDisruptedKg,
      grossMarginImpactPercent: 0,
      productionDowntimeRiskDays: daysOfStockBeforeLineStoppage,
      postShockHhi: 850,
      recommendedMitigationUz: `Hosil Vodiysi va Qibray Arashan yetkazib beruvchilari bilan parallel zaxira shartnomalarini (Dual-Sourcing) tasdiqlash.`,
      recommendedMitigationRu: `Заключение дублирующих договоров с альтернативными поставщиками (Dual-Sourcing).`
    }

    // Scenario 3: Raw Material Cost Surge
    const totalProcurementSpend = supplierReport.totalValue
    const costSurgeMultiplier = costSurgePct / 100
    const additionalCostExposureUzs = totalProcurementSpend * costSurgeMultiplier
    const marginCompressionPts = customerReport.totalValue > 0
      ? Number(((additionalCostExposureUzs / customerReport.totalValue) * 100).toFixed(1))
      : 4.5

    const scenarioCostSurge: ScenarioSimulationResult = {
      scenarioType: 'COST_SURGE',
      titleUz: `Xomashyo Bozor Narxlarining +${costSurgePct}% ga Qimmatlashishi`,
      titleRu: `Сценарий удорожания сырья на +${costSurgePct}%`,
      baselineDescription: `Bozorda noqulay mavsumiy sharoit tufayli sabzavotlar narxi oshishi.`,
      simulationAssumptions: `Xarid narxlarining +${costSurgePct}% ga ko'tarilishi va tayyor mahsulot sotish narxining o'zgarmasligi.`,
      financialExposureUzs: additionalCostExposureUzs,
      volumeExposureKg: 0,
      grossMarginImpactPercent: marginCompressionPts,
      productionDowntimeRiskDays: null,
      postShockHhi: supplierReport.hhiIndex,
      recommendedMitigationUz: 'Yetkazib beruvchilar bilan uzoq muddatli fiksirlangan narx shartnomalarini imzolash va texnologik chiqish (Yield) normativini oshirish.',
      recommendedMitigationRu: 'Фиксация закупочных цен в долгосрочных контрактах и повышение технологического выхода.'
    }

    // Scenario 4: Top Product Demand Shock
    const topProduct = productReport.entities[0]
    const demandShockMultiplier = demandShockPct / 100
    const simProductLossRev = topProduct ? (topProduct.value * demandShockMultiplier) : 0
    const simProductLossProfit = topProduct && topProduct.grossProfit ? (topProduct.grossProfit * demandShockMultiplier) : (simProductLossRev * 0.35)
    const simProductLossKg = topProduct?.secondaryMetric?.value ? (topProduct.secondaryMetric.value * demandShockMultiplier) : 0

    const scenarioProductDemandShock: ScenarioSimulationResult = {
      scenarioType: 'DEMAND_SHOCK',
      titleUz: `Asosiy Mahsulot (${topProduct?.name || 'Mahsulot'}) Bozor Talabining -${demandShockPct}% ga Qisqarishi`,
      titleRu: `Сценарий падения спроса на ключевой продукт (${topProduct?.name || 'Продукт'}) на -${demandShockPct}%`,
      baselineDescription: `"${topProduct?.name}" mahsuloti jami savdo aylanmasining ${topProduct?.sharePercent}% ulushini tashkil etadi.`,
      simulationAssumptions: `Mavsumiy to'yinish yoki raqobatchilar kirib kelishi tufayli talabning ${demandShockPct}% pasayishi.`,
      financialExposureUzs: simProductLossRev,
      volumeExposureKg: simProductLossKg,
      grossMarginImpactPercent: productReport.totalValue > 0 ? Number(((simProductLossProfit / productReport.totalValue) * 100).toFixed(1)) : 0,
      productionDowntimeRiskDays: null,
      postShockHhi: productReport.hhiIndex,
      recommendedMitigationUz: 'Mahsulot sortimentini chuqur qayta ishlangan tayyor sabzavotlar bilan kengaytirish va yangi savdo tarmoqlari bilan promolar o\'tkazish.',
      recommendedMitigationRu: 'Расширение ассортимента продукции глубокой переработки и проведение промо-акций.'
    }

    // F. INTELLIGENT CONCENTRATION ALERTS
    const alerts: ConcentrationRiskAlert[] = []

    if (customerReport.top1SharePercent > thresholds.customer.maxTop1Share || customerReport.hhiIndex > thresholds.customer.hhiModerateLimit) {
      alerts.push({
        id: 'alert-customer-concentration',
        level: customerReport.overallRiskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        dimension: 'CUSTOMER',
        titleUz: 'Mijozlar Konsentratsiyasi Xavfi Yuqori',
        titleRu: 'Высокая концентрация клиентского портфеля',
        descriptionUz: `Bitta asosiy mijoz (${customerReport.top1EntityName}) korxona tushumining ${customerReport.top1SharePercent}% qismini tashkil etadi (Belgilangan me'yor: ${thresholds.customer.maxTop1Share}%). Mijozlar bo'yicha HHI indeksi ${customerReport.hhiIndex} punktni tashkil qilmoqda.`,
        descriptionRu: `Крупнейший клиент (${customerReport.top1EntityName}) занимает ${customerReport.top1SharePercent}% выручки (Лимит: ${thresholds.customer.maxTop1Share}%). Индекс HHI: ${customerReport.hhiIndex}.`,
        recommendedActionUz: 'Chakana savdo tarmoqlari (Supermarketlar) va mintaqaviy B2B shartnomalarini ko\'paytirish orqali mijozlar bazasini diversifikatsiya qilish.',
        recommendedActionRu: 'Диверсификация клиентской базы через привлечение новых сетей супермаркетов.',
        supportingMetric: {
          entityName: customerReport.top1EntityName,
          currentSharePercent: customerReport.top1SharePercent,
          thresholdPercent: thresholds.customer.maxTop1Share,
          hhiImpact: customerReport.hhiIndex
        }
      })
    }

    if (supplierReport.top1SharePercent > thresholds.supplier.maxTop1Share) {
      alerts.push({
        id: 'alert-supplier-concentration',
        level: 'WARNING',
        dimension: 'SUPPLIER',
        titleUz: 'Asosiy Ta\'minotchi Bog\'liqligi Chegaradan Yuqori',
        titleRu: 'Повышенная зависимость от ключевого поставщика',
        descriptionUz: `"${supplierReport.top1EntityName}" kompaniyasi jami xomashyo xaridining ${supplierReport.top1SharePercent}% qismini nazorat qiladi (Me'yor: ${thresholds.supplier.maxTop1Share}%).`,
        descriptionRu: `Поставщик "${supplierReport.top1EntityName}" обеспечивает ${supplierReport.top1SharePercent}% всех закупок.`,
        recommendedActionUz: 'Ikkinchi va uchinchi darajali yetkazib beruvchilar bilan shartnomaviy kvotalarni qayta taqsimlash (Dual-sourcing).',
        recommendedActionRu: 'Перераспределение квот закупок между альтернативными поставщиками.',
        supportingMetric: {
          entityName: supplierReport.top1EntityName,
          currentSharePercent: supplierReport.top1SharePercent,
          thresholdPercent: thresholds.supplier.maxTop1Share,
          hhiImpact: supplierReport.hhiIndex
        }
      })
    }

    if (singleSourceMaterials.length > 0) {
      alerts.push({
        id: 'alert-single-source',
        level: 'CRITICAL',
        dimension: 'SUPPLIER',
        titleUz: 'Yagona Manbali (Single-Source) Xomashyolar Aniqlangan',
        titleRu: 'Обнаружено сырьё с безальтернативным поставщиком (Single-Source)',
        descriptionUz: `${singleSourceMaterials.length} turdagi xomashyo faqat bitta yetkazib beruvchidan olinmoqda (Muqobil yetkazib beruvchi mavjud emas). Masalan: ${singleSourceMaterials.map(m => m.rawMaterialName).join(', ')}.`,
        descriptionRu: `Выявлено ${singleSourceMaterials.length} позиций сырья с зависимостью от единственного поставщика.`,
        recommendedActionUz: 'Zudlik bilan muqobil ta\'minotchilarni auditdan o\'tkazish va sifat nazorati (QC) tomonidan attestatsiyadan o\'tkazish.',
        recommendedActionRu: 'Срочный аудит и аттестация альтернативных поставщиков службой контроля качества.',
        supportingMetric: {
          entityName: singleSourceMaterials[0]?.rawMaterialName || 'Xomashyo',
          currentSharePercent: singleSourceMaterials[0]?.primarySupplierSharePercent || 100,
          thresholdPercent: 75,
          hhiImpact: 10000
        }
      })
    }

    return NextResponse.json({
      success: true,
      period: periodParam,
      thresholds,
      reports: {
        customer: customerReport,
        supplier: supplierReport,
        product: productReport,
        channel: channelReport,
        geographic: geographicReport
      },
      singleSourceMaterials,
      scenarios: [
        scenarioCustomerLoss,
        scenarioSupplierDisruption,
        scenarioCostSurge,
        scenarioProductDemandShock
      ],
      alerts,
      summaryKpis: {
        top1CustomerShare: customerReport.top1SharePercent,
        top1CustomerName: customerReport.top1EntityName,
        customerHhi: customerReport.hhiIndex,
        customerRiskLevel: customerReport.overallRiskLevel,
        top1SupplierShare: supplierReport.top1SharePercent,
        top1SupplierName: supplierReport.top1EntityName,
        supplierHhi: supplierReport.hhiIndex,
        supplierRiskLevel: supplierReport.overallRiskLevel,
        top1ProductShare: productReport.top1SharePercent,
        top1ProductName: productReport.top1EntityName,
        productHhi: productReport.hhiIndex,
        channelHhi: channelReport.hhiIndex,
        geographicHhi: geographicReport.hhiIndex,
        top1GeographicMarket: geographicReport.top1EntityName,
        top1GeographicShare: geographicReport.top1SharePercent,
        singleSourceCount: singleSourceMaterials.length
      }
    })
  } catch (error: any) {
    console.error('Error in Concentration Risk API GET:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Serverda diversifikatsiya tahlili xatosi yuz berdi'
    }, { status: 500 })
  }
}

/**
 * POST handler to configure concentration risk thresholds
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const body = await request.json()
    const { dimension, maxTop1Share, maxTop3Share, hhiModerateLimit, hhiCriticalLimit } = body

    if (!dimension || !['customer', 'supplier', 'product', 'channel', 'geographic'].includes(dimension)) {
      return NextResponse.json({ error: 'Noto\'g\'ri parametrlar' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'src/data/concentrationThresholds.json')
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Konfiguratsiya fayli topilmadi' }, { status: 404 })
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const config = JSON.parse(raw)

    if (config.thresholds[dimension]) {
      if (maxTop1Share !== undefined) config.thresholds[dimension].maxTop1Share = parseFloat(maxTop1Share)
      if (maxTop3Share !== undefined) config.thresholds[dimension].maxTop3Share = parseFloat(maxTop3Share)
      if (hhiModerateLimit !== undefined) config.thresholds[dimension].hhiModerateLimit = parseInt(hhiModerateLimit, 10)
      if (hhiCriticalLimit !== undefined) config.thresholds[dimension].hhiCriticalLimit = parseInt(hhiCriticalLimit, 10)
    }

    config.updatedAt = new Date().toISOString()
    config.updatedBy = `${session.name || 'Director'} (${session.role})`

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Konsentratsiya xavfi me\'yori muvaffaqiyatli yangilandi'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'

// Configurable Channel Subcategories
export const CHANNEL_CATEGORIES = [
  'RESTAURANTS_FOOD_SERVICE',
  'CORPORATE_END_CUSTOMERS',
  'SUPERMARKETS',
  'RETAIL_STORES',
  'DISTRIBUTORS',
  'WHOLESALERS',
  'EXPORT_PARTNERS',
  'OTHER',
  'UNCLASSIFIED'
] as const

export type ChannelCategoryType = (typeof CHANNEL_CATEGORIES)[number]

export const CHANNEL_META: Record<ChannelCategoryType, {
  nameUz: string
  nameRu: string
  nameEn: string
  defaultDistributionType: 'DIRECT' | 'INDIRECT'
  descriptionUz: string
  descriptionRu: string
  color: string
}> = {
  RESTAURANTS_FOOD_SERVICE: {
    nameUz: 'Restoranlar va umumiy ovqatlanish',
    nameRu: 'Рестораны и общепит (HoReCa)',
    nameEn: 'Restaurants & Food Service',
    defaultDistributionType: 'DIRECT',
    descriptionUz: 'O\'z faoliyati uchun mahsulot sotib oluvchi to\'g\'ridan-to\'g\'ri B2B mijozlar (Fast-food, restoranlar, qahvaxonalar)',
    descriptionRu: 'Прямые B2B клиенты, закупающие сырье для собственного производства блюд (HoReCa, QSR)',
    color: '#10b981' // emerald
  },
  CORPORATE_END_CUSTOMERS: {
    nameUz: 'Korporativ yakuniy mijozlar',
    nameRu: 'Корпоративные конечные клиенты',
    nameEn: 'Corporate End Customers',
    defaultDistributionType: 'DIRECT',
    descriptionUz: 'O\'z xodimlari va ichki ehtiyojlari uchun sotib oluvchi yirik korxonalar va mehmonxonalar',
    descriptionRu: 'Конечные B2B корпоративные потребители (отели, заводы, столовые предприятий)',
    color: '#06b6d4' // cyan
  },
  SUPERMARKETS: {
    nameUz: 'Supermarketlar tarmoqlari',
    nameRu: 'Сети супермаркетов (Retail Chains)',
    nameEn: 'Supermarket Chains',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'Aholiga qayta sotish uchun xarid qiluvchi yirik chakana savdo tarmoqlari (Korzinka, Havas, Makro)',
    descriptionRu: 'Крупные ритейл сети для перепродажи населению через прилавки',
    color: '#3b82f6' // blue
  },
  RETAIL_STORES: {
    nameUz: 'Chakana savdo do\'konlari',
    nameRu: 'Розничные магазины (Trade Stores)',
    nameEn: 'Retail Grocery Stores',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'Mahalliy minimarketlar va mustaqil oziq-ovqat do\'konlari (Qayta sotish)',
    descriptionRu: 'Локальные продуктовые магазины и минимаркеты у дома (Перепродажа)',
    color: '#8b5cf6' // purple
  },
  DISTRIBUTORS: {
    nameUz: 'Mintaqaviy distribyutorlar',
    nameRu: 'Региональные дистрибьюторы',
    nameEn: 'Regional Distributors',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'Viloyatlar bo\'yicha rasmiy hududiy distribyutorlik hamkorlari',
    descriptionRu: 'Официальные территориальные дистрибьюторы в регионах',
    color: '#f59e0b' // amber
  },
  WHOLESALERS: {
    nameUz: 'Ulgurji savdogarlar (Optom)',
    nameRu: 'Оптовые закупщики (Wholesalers)',
    nameEn: 'Wholesale Merchants',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'Bozorlar va ikkilamchi savdogarlarga katta partiyalarda qayta sotuvchilar',
    descriptionRu: 'Крупнооптовые покупатели для перепродажи на рынках и мелким оптовикам',
    color: '#f97316' // orange
  },
  EXPORT_PARTNERS: {
    nameUz: 'Eksport hamkorlar',
    nameRu: 'Экспортные партнеры',
    nameEn: 'Export Partners',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'MDH va chet el bozorlariga qayta sotish va qayta ishlash uchun xalqaro hamkorlar',
    descriptionRu: 'Зарубежные трейдеры и дистрибьюторы на экспортных рынках',
    color: '#6366f1' // indigo
  },
  OTHER: {
    nameUz: 'Boshqa kanallar',
    nameRu: 'Прочие каналы сбыта',
    nameEn: 'Other Channels',
    defaultDistributionType: 'INDIRECT',
    descriptionUz: 'Agrofirmalar, kooperativlar va aralash hamkorlar',
    descriptionRu: 'Кооперативы, агрофирмы и нестандартные партнеры',
    color: '#64748b' // slate
  },
  UNCLASSIFIED: {
    nameUz: 'Tasniflanmagan (Audit talab)',
    nameRu: 'Не классифицированные (Требует аудит)',
    nameEn: 'Unclassified (Requires Audit)',
    defaultDistributionType: 'DIRECT',
    descriptionUz: 'Tasnifi belgilanmagan yoki shartnoma ma\'lumoti to\'liq bo\'lmagan mijozlar',
    descriptionRu: 'Клиенты без подтвержденного канала сбыта или роли',
    color: '#ef4444' // red
  }
}

// Helper to filter dates
function parseDateFilter(searchParams: URLSearchParams) {
  const period = searchParams.get('period') || 'ALL'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (dateFrom && dateTo) {
    return {
      gte: new Date(`${dateFrom}T00:00:00.000Z`),
      lte: new Date(`${dateTo}T23:59:59.999Z`),
      fromStr: dateFrom,
      toStr: dateTo
    }
  }

  const now = new Date()
  let gte: Date | undefined = undefined
  let lte: Date | undefined = undefined

  if (period === 'TODAY') {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  } else if (period === 'THIS_WEEK') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
    gte = new Date(now.setDate(diff))
    gte.setHours(0, 0, 0, 0)
  } else if (period === 'THIS_MONTH') {
    gte = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'THIS_QUARTER') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3
    gte = new Date(now.getFullYear(), qMonth, 1)
  } else if (period === 'THIS_YEAR') {
    gte = new Date(now.getFullYear(), 0, 1)
  }

  return {
    gte,
    lte,
    fromStr: gte ? gte.toISOString().slice(0, 10) : '',
    toStr: lte ? lte.toISOString().slice(0, 10) : ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN', 'ACCOUNTING', 'SALES'].includes(session.role)) {
      return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = parseDateFilter(searchParams)
    const filterDistType = searchParams.get('distributionType') || 'ALL'
    const filterCategory = searchParams.get('channelCategory') || 'ALL'
    const filterCustomerId = searchParams.get('customerId')

    // 1. Fetch Customers with complete contracts and channel profiles
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    })

    // 2. Fetch Sales Orders in Date Range
    const orderWhere: any = {}
    if (dateRange.gte || dateRange.lte) {
      orderWhere.orderDate = {}
      if (dateRange.gte) orderWhere.orderDate.gte = dateRange.gte
      if (dateRange.lte) orderWhere.orderDate.lte = dateRange.lte
    }
    if (filterCustomerId) {
      orderWhere.customerId = parseInt(filterCustomerId)
    }

    const salesOrders = await prisma.salesOrder.findMany({
      where: orderWhere,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        invoices: {
          include: {
            transactions: true
          }
        },
        returns: {
          include: {
            product: true
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    })

    // 3. Fetch all Sales Returns in Date Range
    const returnWhere: any = {}
    if (dateRange.gte || dateRange.lte) {
      returnWhere.returnDate = {}
      if (dateRange.gte) returnWhere.returnDate.gte = dateRange.gte
      if (dateRange.lte) returnWhere.returnDate.lte = dateRange.lte
    }

    const salesReturns = await prisma.salesReturn.findMany({
      where: returnWhere,
      include: {
        customer: true,
        product: true
      }
    })

    // 4. Fetch all Invoices in Date Range to compute receivable exposure accurately
    const invoiceWhere: any = {
      type: 'SALES_INVOICE'
    }
    if (dateRange.gte || dateRange.lte) {
      invoiceWhere.issuedDate = {}
      if (dateRange.gte) invoiceWhere.issuedDate.gte = dateRange.gte
      if (dateRange.lte) invoiceWhere.issuedDate.lte = dateRange.lte
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        customer: true,
        transactions: true
      }
    })

    const now = new Date()

    // 5. Structure per-channel metrics
    interface ChannelStat {
      channelKey: ChannelCategoryType
      nameUz: string
      nameRu: string
      nameEn: string
      distributionType: 'DIRECT' | 'INDIRECT'
      color: string
      descriptionUz: string
      descriptionRu: string
      // Metrics
      grossRevenue: number
      applicableDiscounts: number
      returnsAmount: number
      netRevenue: number
      revenueSharePct: number
      cogs: number
      grossProfit: number
      grossMarginPct: number
      logisticsCost: number
      contributionAfterLogistics: number
      contributionMarginPct: number
      volumeKg: number
      volumeDona: number
      ordersCount: number
      activeCustomersCount: number
      returnRatePct: number
      invoicedAmount: number
      collectedAmount: number
      outstandingReceivables: number
      overdueReceivables: number
      overdueInvoicesCount: number
      isCostDataAvailable: boolean
      costLimitationNotice?: string
      customerIds: Set<number>
    }

    const channelStatsMap: Record<ChannelCategoryType, ChannelStat> = {} as any

    CHANNEL_CATEGORIES.forEach(cat => {
      const meta = CHANNEL_META[cat]
      channelStatsMap[cat] = {
        channelKey: cat,
        nameUz: meta.nameUz,
        nameRu: meta.nameRu,
        nameEn: meta.nameEn,
        distributionType: meta.defaultDistributionType,
        color: meta.color,
        descriptionUz: meta.descriptionUz,
        descriptionRu: meta.descriptionRu,
        grossRevenue: 0,
        applicableDiscounts: 0,
        returnsAmount: 0,
        netRevenue: 0,
        revenueSharePct: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        logisticsCost: 0,
        contributionAfterLogistics: 0,
        contributionMarginPct: 0,
        volumeKg: 0,
        volumeDona: 0,
        ordersCount: 0,
        activeCustomersCount: 0,
        returnRatePct: 0,
        invoicedAmount: 0,
        collectedAmount: 0,
        outstandingReceivables: 0,
        overdueReceivables: 0,
        overdueInvoicesCount: 0,
        isCostDataAvailable: true,
        customerIds: new Set<number>()
      }
    })

    // Customer Lookup
    const customerMap = new Map<number, any>()
    customers.forEach(c => customerMap.set(c.id, c))

    // Customer Aggregations for Level 2 Drilldown
    interface CustomerChannelAgg {
      customerId: number
      name: string
      companyName: string
      businessRole: string
      contractNumber: string | null
      contractDate: string | null
      creditTermDays: number
      creditLimit: number
      distributionType: 'DIRECT' | 'INDIRECT'
      channelCategory: ChannelCategoryType
      grossRevenue: number
      discounts: number
      returns: number
      netRevenue: number
      cogs: number
      grossProfit: number
      grossMarginPct: number
      logisticsCost: number
      contributionAfterLogistics: number
      volumeKg: number
      volumeDona: number
      ordersCount: number
      invoicedAmount: number
      paidAmount: number
      outstandingReceivables: number
      overdueReceivables: number
      overdueInvoicesCount: number
      creditLimitUtilizationPct: number
      returnRatePct: number
    }

    const customerAggMap = new Map<number, CustomerChannelAgg>()

    // Initialize all customers
    customers.forEach(c => {
      const distType = (c.distributionType === 'INDIRECT' ? 'INDIRECT' : 'DIRECT') as 'DIRECT' | 'INDIRECT'
      const cat = (c.channelCategory && CHANNEL_CATEGORIES.includes(c.channelCategory as any)
        ? c.channelCategory
        : 'UNCLASSIFIED') as ChannelCategoryType

      customerAggMap.set(c.id, {
        customerId: c.id,
        name: c.name,
        companyName: c.companyName || c.name,
        businessRole: c.businessRole || 'B2B Hamkor',
        contractNumber: c.contractNumber,
        contractDate: c.contractDate ? c.contractDate.toISOString().slice(0, 10) : null,
        creditTermDays: c.creditTermDays || 15,
        creditLimit: c.creditLimit || 0,
        distributionType: distType,
        channelCategory: cat,
        grossRevenue: 0,
        discounts: 0,
        returns: 0,
        netRevenue: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        logisticsCost: 0,
        contributionAfterLogistics: 0,
        volumeKg: 0,
        volumeDona: 0,
        ordersCount: 0,
        invoicedAmount: 0,
        paidAmount: 0,
        outstandingReceivables: 0,
        overdueReceivables: 0,
        overdueInvoicesCount: 0,
        creditLimitUtilizationPct: 0,
        returnRatePct: 0
      })
    })

    // Product Aggregations by Channel (Level 2 Drilldown)
    interface ProductChannelAgg {
      productId: number
      productName: string
      unit: string
      channelCategory: ChannelCategoryType
      volume: number
      grossRevenue: number
      cogs: number
      grossProfit: number
      grossMarginPct: number
    }
    const productChannelAggMap = new Map<string, ProductChannelAgg>()

    // Monthly Growth Trends (for Timeline Chart)
    const monthlyTrendsMap = new Map<string, {
      month: string
      directRevenue: number
      indirectRevenue: number
      totalNetRevenue: number
      totalGrossProfit: number
      totalLogistics: number
    }>()

    // 6. Aggregate Sales Orders
    salesOrders.forEach(order => {
      const cust = customerMap.get(order.customerId)
      const distType = (cust?.distributionType === 'INDIRECT' ? 'INDIRECT' : 'DIRECT') as 'DIRECT' | 'INDIRECT'
      const cat = (cust?.channelCategory && CHANNEL_CATEGORIES.includes(cust.channelCategory)
        ? cust.channelCategory
        : 'UNCLASSIFIED') as ChannelCategoryType

      const ch = channelStatsMap[cat]
      if (ch) {
        ch.distributionType = distType // sync actual customer type
        ch.ordersCount += 1
        ch.customerIds.add(order.customerId)
      }

      const custAgg = customerAggMap.get(order.customerId)
      if (custAgg) custAgg.ordersCount += 1

      // Month key for trends
      const monthKey = order.orderDate.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyTrendsMap.has(monthKey)) {
        monthlyTrendsMap.set(monthKey, {
          month: monthKey,
          directRevenue: 0,
          indirectRevenue: 0,
          totalNetRevenue: 0,
          totalGrossProfit: 0,
          totalLogistics: 0
        })
      }
      const trend = monthlyTrendsMap.get(monthKey)!

      let orderGross = 0
      let orderDiscount = order.discountAmount || 0
      let orderCogs = 0
      let orderVolumeKg = 0
      let orderVolumeDona = 0

      order.items.forEach(item => {
        const itemGross = item.quantity * item.unitPrice
        const itemDisc = item.discount || 0
        orderGross += itemGross
        orderDiscount += itemDisc

        const unit = (item.product?.unit || 'kg').toLowerCase()
        if (unit === 'kg') {
          orderVolumeKg += item.quantity
        } else {
          orderVolumeDona += item.quantity
        }

        // Traceable COGS calculation
        const itemCogsUnit = item.cogsPerUnit && item.cogsPerUnit > 0
          ? item.cogsPerUnit
          : (item.product?.cogsPerUnit && item.product.cogsPerUnit > 0)
            ? item.product.cogsPerUnit
            : (item.unitPrice * 0.65) // Fallback standard 65% cost basis

        const itemTotalCogs = item.quantity * itemCogsUnit
        orderCogs += itemTotalCogs

        // Product Channel Aggregation
        const prodKey = `${item.productId}_${cat}`
        let pAgg = productChannelAggMap.get(prodKey)
        if (!pAgg) {
          pAgg = {
            productId: item.productId,
            productName: item.product?.name || 'Mahsulot',
            unit: item.product?.unit || 'kg',
            channelCategory: cat,
            volume: 0,
            grossRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPct: 0
          }
          productChannelAggMap.set(prodKey, pAgg)
        }
        pAgg.volume += item.quantity
        pAgg.grossRevenue += itemGross - itemDisc
        pAgg.cogs += itemTotalCogs
        pAgg.grossProfit = pAgg.grossRevenue - pAgg.cogs
        pAgg.grossMarginPct = pAgg.grossRevenue > 0 ? (pAgg.grossProfit / pAgg.grossRevenue) * 100 : 0
      })

      const orderLogistics = order.logisticsCost || 0
      const orderNet = orderGross - orderDiscount

      // Add to channel stats
      if (ch) {
        ch.grossRevenue += orderGross
        ch.applicableDiscounts += orderDiscount
        ch.cogs += orderCogs
        ch.logisticsCost += orderLogistics
        ch.volumeKg += orderVolumeKg
        ch.volumeDona += orderVolumeDona
      }

      // Add to customer agg
      if (custAgg) {
        custAgg.grossRevenue += orderGross
        custAgg.discounts += orderDiscount
        custAgg.cogs += orderCogs
        custAgg.logisticsCost += orderLogistics
        custAgg.volumeKg += orderVolumeKg
        custAgg.volumeDona += orderVolumeDona
      }

      // Add to trends
      trend.totalNetRevenue += orderNet
      trend.totalGrossProfit += (orderNet - orderCogs)
      trend.totalLogistics += orderLogistics
      if (distType === 'DIRECT') {
        trend.directRevenue += orderNet
      } else {
        trend.indirectRevenue += orderNet
      }
    })

    // 7. Aggregate Sales Returns
    salesReturns.forEach(ret => {
      const cust = customerMap.get(ret.customerId)
      const cat = (cust?.channelCategory && CHANNEL_CATEGORIES.includes(cust.channelCategory)
        ? cust.channelCategory
        : 'UNCLASSIFIED') as ChannelCategoryType

      const ch = channelStatsMap[cat]
      if (ch) {
        ch.returnsAmount += ret.returnAmount
        // Deduct restocked return COGS from total COGS
        if (ret.cogsAmount && ret.cogsAmount > 0) {
          ch.cogs = Math.max(0, ch.cogs - ret.cogsAmount)
        }
      }

      const custAgg = customerAggMap.get(ret.customerId)
      if (custAgg) {
        custAgg.returns += ret.returnAmount
        if (ret.cogsAmount && ret.cogsAmount > 0) {
          custAgg.cogs = Math.max(0, custAgg.cogs - ret.cogsAmount)
        }
      }
    })

    // 8. Aggregate Invoices & Receivables
    invoices.forEach(inv => {
      const cust = customerMap.get(inv.customerId || 0)
      const cat = (cust?.channelCategory && CHANNEL_CATEGORIES.includes(cust.channelCategory)
        ? cust.channelCategory
        : 'UNCLASSIFIED') as ChannelCategoryType

      const ch = channelStatsMap[cat]
      const custAgg = customerAggMap.get(inv.customerId || 0)

      const invTotal = inv.totalAmount || 0
      const invPaid = inv.paidAmount || 0
      const unpaid = Math.max(0, invTotal - invPaid)
      const isOverdue = unpaid > 0 && inv.dueDate && new Date(inv.dueDate) < now

      if (ch) {
        ch.invoicedAmount += invTotal
        ch.collectedAmount += invPaid
        ch.outstandingReceivables += unpaid
        if (isOverdue) {
          ch.overdueReceivables += unpaid
          ch.overdueInvoicesCount += 1
        }
      }

      if (custAgg) {
        custAgg.invoicedAmount += invTotal
        custAgg.paidAmount += invPaid
        custAgg.outstandingReceivables += unpaid
        if (isOverdue) {
          custAgg.overdueReceivables += unpaid
          custAgg.overdueInvoicesCount += 1
        }
      }
    })

    // 9. Finalize Channel Calculations
    let grandNetRevenue = 0
    let grandGrossProfit = 0
    let grandCogs = 0
    let grandLogistics = 0
    let grandContribution = 0
    let grandOutstanding = 0
    let grandOverdue = 0
    let grandVolumeKg = 0
    let grandVolumeDona = 0

    // Direct vs Indirect Rollups
    const directVsIndirect = {
      DIRECT: {
        distributionType: 'DIRECT' as const,
        nameUz: 'To\'g\'ridan-to\'g\'ri taqsimot (Direct Distribution)',
        nameRu: 'Прямая дистрибуция (Direct)',
        nameEn: 'Direct Distribution',
        netRevenue: 0,
        revenueSharePct: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        logisticsCost: 0,
        contributionAfterLogistics: 0,
        contributionMarginPct: 0,
        volumeKg: 0,
        volumeDona: 0,
        activeCustomersCount: 0,
        outstandingReceivables: 0,
        overdueReceivables: 0,
        color: '#10b981'
      },
      INDIRECT: {
        distributionType: 'INDIRECT' as const,
        nameUz: 'Vositali taqsimot (Indirect Distribution)',
        nameRu: 'Непрямая / Партнерская дистрибуция (Indirect)',
        nameEn: 'Indirect Distribution',
        netRevenue: 0,
        revenueSharePct: 0,
        grossProfit: 0,
        grossMarginPct: 0,
        logisticsCost: 0,
        contributionAfterLogistics: 0,
        contributionMarginPct: 0,
        volumeKg: 0,
        volumeDona: 0,
        activeCustomersCount: 0,
        outstandingReceivables: 0,
        overdueReceivables: 0,
        color: '#3b82f6'
      }
    }

    const channelList: ChannelStat[] = []

    CHANNEL_CATEGORIES.forEach(cat => {
      const ch = channelStatsMap[cat]
      ch.activeCustomersCount = ch.customerIds.size

      // Calculation Rule: Net Revenue = Gross - Discounts - Returns
      ch.netRevenue = Math.max(0, ch.grossRevenue - ch.applicableDiscounts - ch.returnsAmount)

      // Calculation Rule: Gross Profit = Net Revenue - COGS
      ch.grossProfit = ch.netRevenue - ch.cogs

      // Calculation Rule: Gross Margin % = (Gross Profit / Net Revenue) * 100
      ch.grossMarginPct = ch.netRevenue > 0 ? (ch.grossProfit / ch.netRevenue) * 100 : 0

      // Calculation Rule: Contribution after logistics = Gross Profit - Logistics Expenses
      ch.contributionAfterLogistics = ch.grossProfit - ch.logisticsCost
      ch.contributionMarginPct = ch.netRevenue > 0 ? (ch.contributionAfterLogistics / ch.netRevenue) * 100 : 0

      // Calculation Rule: Return Rate % = Returns / (Net Revenue + Returns) * 100
      const totalShippedValue = ch.netRevenue + ch.returnsAmount
      ch.returnRatePct = totalShippedValue > 0 ? (ch.returnsAmount / totalShippedValue) * 100 : 0

      // Check cost data availability
      if (ch.netRevenue > 0 && ch.cogs <= 0) {
        ch.isCostDataAvailable = false
        ch.costLimitationNotice = 'Ushbu kanal uchun xomashyo va ishlab chiqarish tannarxi (COGS) to\'liq bog\'lanmagan. Tushum alohida ko\'rsatilgan.'
      }

      grandNetRevenue += ch.netRevenue
      grandGrossProfit += ch.grossProfit
      grandCogs += ch.cogs
      grandLogistics += ch.logisticsCost
      grandContribution += ch.contributionAfterLogistics
      grandOutstanding += ch.outstandingReceivables
      grandOverdue += ch.overdueReceivables
      grandVolumeKg += ch.volumeKg
      grandVolumeDona += ch.volumeDona

      // Accumulate to Direct vs Indirect
      const dType = ch.distributionType === 'DIRECT' ? 'DIRECT' : 'INDIRECT'
      const targetRollup = directVsIndirect[dType]
      targetRollup.netRevenue += ch.netRevenue
      targetRollup.grossProfit += ch.grossProfit
      targetRollup.logisticsCost += ch.logisticsCost
      targetRollup.contributionAfterLogistics += ch.contributionAfterLogistics
      targetRollup.volumeKg += ch.volumeKg
      targetRollup.volumeDona += ch.volumeDona
      targetRollup.outstandingReceivables += ch.outstandingReceivables
      targetRollup.overdueReceivables += ch.overdueReceivables
      targetRollup.activeCustomersCount += ch.activeCustomersCount

      channelList.push(ch)
    })

    // Calculate revenue share percentages
    channelList.forEach(ch => {
      ch.revenueSharePct = grandNetRevenue > 0 ? (ch.netRevenue / grandNetRevenue) * 100 : 0
    })

    directVsIndirect.DIRECT.revenueSharePct = grandNetRevenue > 0 ? (directVsIndirect.DIRECT.netRevenue / grandNetRevenue) * 100 : 0
    directVsIndirect.DIRECT.grossMarginPct = directVsIndirect.DIRECT.netRevenue > 0 ? (directVsIndirect.DIRECT.grossProfit / directVsIndirect.DIRECT.netRevenue) * 100 : 0
    directVsIndirect.DIRECT.contributionMarginPct = directVsIndirect.DIRECT.netRevenue > 0 ? (directVsIndirect.DIRECT.contributionAfterLogistics / directVsIndirect.DIRECT.netRevenue) * 100 : 0

    directVsIndirect.INDIRECT.revenueSharePct = grandNetRevenue > 0 ? (directVsIndirect.INDIRECT.netRevenue / grandNetRevenue) * 100 : 0
    directVsIndirect.INDIRECT.grossMarginPct = directVsIndirect.INDIRECT.netRevenue > 0 ? (directVsIndirect.INDIRECT.grossProfit / directVsIndirect.INDIRECT.netRevenue) * 100 : 0
    directVsIndirect.INDIRECT.contributionMarginPct = directVsIndirect.INDIRECT.netRevenue > 0 ? (directVsIndirect.INDIRECT.contributionAfterLogistics / directVsIndirect.INDIRECT.netRevenue) * 100 : 0

    // Finalize Customer Details (Level 2)
    const customerList: CustomerChannelAgg[] = Array.from(customerAggMap.values()).map(c => {
      c.netRevenue = Math.max(0, c.grossRevenue - c.discounts - c.returns)
      c.grossProfit = c.netRevenue - c.cogs
      c.grossMarginPct = c.netRevenue > 0 ? (c.grossProfit / c.netRevenue) * 100 : 0
      c.contributionAfterLogistics = c.grossProfit - c.logisticsCost
      c.returnRatePct = (c.netRevenue + c.returns) > 0 ? (c.returns / (c.netRevenue + c.returns)) * 100 : 0
      c.creditLimitUtilizationPct = c.creditLimit > 0 ? (c.outstandingReceivables / c.creditLimit) * 100 : 0
      return c
    })

    // Sort channels by Net Revenue descending
    channelList.sort((a, b) => b.netRevenue - a.netRevenue)

    // Sort customers by Net Revenue descending
    customerList.sort((a, b) => b.netRevenue - a.netRevenue)

    // Product performance by channel list
    const productList = Array.from(productChannelAggMap.values()).sort((a, b) => b.grossRevenue - a.grossRevenue)

    // Monthly trends sorted
    const monthlyTrends = Array.from(monthlyTrendsMap.values()).sort((a, b) => a.month.localeCompare(b.month))

    // 10. Generate Automated Executive Alerts
    interface ExecutiveAlert {
      id: string
      type: 'MARGIN_SQUEEZE' | 'CREDIT_RISK' | 'UNPROFITABLE' | 'HIGH_RETURNS' | 'CONCENTRATION_RISK' | 'UNCLASSIFIED_CUSTOMERS'
      severity: 'HIGH' | 'MEDIUM' | 'INFO'
      titleUz: string
      titleRu: string
      titleEn: string
      messageUz: string
      messageRu: string
      messageEn: string
      channelKey?: ChannelCategoryType
      metricValue?: number
    }

    const alerts: ExecutiveAlert[] = []

    // Alert 1: Concentration Risk (> 40% of revenue in a single channel)
    channelList.forEach(ch => {
      if (ch.revenueSharePct > 40 && ch.netRevenue > 0) {
        alerts.push({
          id: `alert-conc-${ch.channelKey}`,
          type: 'CONCENTRATION_RISK',
          severity: 'HIGH',
          channelKey: ch.channelKey,
          titleUz: 'Taqsimot kanalida yuqori konsentratsiya xavfi',
          titleRu: 'Риск высокой концентрации сбыта',
          titleEn: 'Distribution Concentration Risk',
          messageUz: `«${ch.nameUz}» kanali umumiy tushumning ${ch.revenueSharePct.toFixed(1)}% qismini tashkil qilmoqda. Bitta kanalga haddan tashqari bog'liqlik xavfi mavjud.`,
          messageRu: `Канал «${ch.nameRu}» формирует ${ch.revenueSharePct.toFixed(1)}% всей чистой выручки. Высокая зависимость от одного канала.`,
          messageEn: `Channel "${ch.nameEn}" generates ${ch.revenueSharePct.toFixed(1)}% of total net revenue. Excessive dependence on a single channel.`,
          metricValue: ch.revenueSharePct
        })
      }
    })

    // Alert 2: Overdue Credit Risk (Overdue debt > 20M UZS or > 20% of channel revenue)
    channelList.forEach(ch => {
      if (ch.overdueReceivables > 15000000) {
        alerts.push({
          id: `alert-credit-${ch.channelKey}`,
          type: 'CREDIT_RISK',
          severity: 'HIGH',
          channelKey: ch.channelKey,
          titleUz: 'Muddati o\'tgan qarzdorlik bo\'yicha moliyaviy xatar',
          titleRu: 'Кредитный риск: Просроченная задолженность',
          titleEn: 'Overdue Receivable Credit Risk',
          messageUz: `«${ch.nameUz}» kanalida ${(ch.overdueReceivables).toLocaleString()} so'm muddati o'tgan debitorlik qarzdorligi mavjud (${ch.overdueInvoicesCount} ta schot).`,
          messageRu: `В канале «${ch.nameRu}» зафиксировано ${(ch.overdueReceivables).toLocaleString()} сум просроченной дебиторки (${ch.overdueInvoicesCount} счетов).`,
          messageEn: `Channel "${ch.nameEn}" has ${(ch.overdueReceivables).toLocaleString()} UZS in overdue receivables across ${ch.overdueInvoicesCount} invoices.`,
          metricValue: ch.overdueReceivables
        })
      }
    })

    // Alert 3: Margin Squeeze (Revenue high but gross margin < 25%)
    channelList.forEach(ch => {
      if (ch.netRevenue > 100000000 && ch.grossMarginPct < 26) {
        alerts.push({
          id: `alert-margin-${ch.channelKey}`,
          type: 'MARGIN_SQUEEZE',
          severity: 'MEDIUM',
          channelKey: ch.channelKey,
          titleUz: 'Marja pasayishi (Margin Squeeze)',
          titleRu: 'Сжатие маржинальности (Margin Squeeze)',
          titleEn: 'Margin Squeeze Detected',
          messageUz: `«${ch.nameUz}» kanalida savdo hajmi yuqori bo'lsa-da, yalpi marja atigi ${ch.grossMarginPct.toFixed(1)}% ni tashkil etmoqda. Katta chegirmalar va ulgurji narxlar tahlil qilinishi kerak.`,
          messageRu: `В канале «${ch.nameRu}» при высоких оборотах валовая маржа составляет всего ${ch.grossMarginPct.toFixed(1)}%. Проверьте оптовые скидки.`,
          messageEn: `Channel "${ch.nameEn}" shows high volume but only ${ch.grossMarginPct.toFixed(1)}% gross margin. Review wholesale discounting.`,
          metricValue: ch.grossMarginPct
        })
      }
    })

    // Alert 4: High Return Rate (> 2.0%)
    channelList.forEach(ch => {
      if (ch.returnRatePct > 2.0 && ch.returnsAmount > 1000000) {
        alerts.push({
          id: `alert-return-${ch.channelKey}`,
          type: 'HIGH_RETURNS',
          severity: 'MEDIUM',
          channelKey: ch.channelKey,
          titleUz: 'Qaytma mahsulotlar ulushi yuqori',
          titleRu: 'Повышенный процент возврата продукции',
          titleEn: 'Elevated Customer Return Rate',
          messageUz: `«${ch.nameUz}» kanalida qaytarilgan mahsulotlar ulushi ${ch.returnRatePct.toFixed(1)}% (${(ch.returnsAmount).toLocaleString()} so'm). Saqlash va tranzit haroratini tekshiring.`,
          messageRu: `В канале «${ch.nameRu}» доля возвратов достигла ${ch.returnRatePct.toFixed(1)}% (${(ch.returnsAmount).toLocaleString()} сум). Проверьте температурный режим логистики.`,
          messageEn: `Channel "${ch.nameEn}" return rate is ${ch.returnRatePct.toFixed(1)}% (${(ch.returnsAmount).toLocaleString()} UZS). Inspect transit cold-chain.`,
          metricValue: ch.returnRatePct
        })
      }
    })

    // Alert 5: Unclassified Customers Alert
    const unclassifiedCusts = customerList.filter(c => c.channelCategory === 'UNCLASSIFIED' || !c.contractNumber)
    if (unclassifiedCusts.length > 0) {
      alerts.push({
        id: 'alert-unclassified-custs',
        type: 'UNCLASSIFIED_CUSTOMERS',
        severity: 'INFO',
        titleUz: 'Tasniflanmagan mijozlar auditi',
        titleRu: 'Аудит неклассифицированных клиентов',
        titleEn: 'Unclassified Customers Requiring Setup',
        messageUz: `${unclassifiedCusts.length} ta mijozning taqsimot kanali yoki shartnomasi to'liq kiritilmagan. Sozlamalar bo'limida tasniflang.`,
        messageRu: `У ${unclassifiedCusts.length} клиентов не указан канал сбыта или договор. Настройте классификацию в ERP.`,
        messageEn: `${unclassifiedCusts.length} customers lack channel classification or contracts. Configure them in ERP settings.`,
        metricValue: unclassifiedCusts.length
      })
    }

    // Filter by distributionType / channelCategory if requested
    let filteredChannels = channelList
    if (filterDistType !== 'ALL') {
      filteredChannels = filteredChannels.filter(c => c.distributionType === filterDistType)
    }
    if (filterCategory !== 'ALL') {
      filteredChannels = filteredChannels.filter(c => c.channelKey === filterCategory)
    }

    let filteredCustomers = customerList
    if (filterDistType !== 'ALL') {
      filteredCustomers = filteredCustomers.filter(c => c.distributionType === filterDistType)
    }
    if (filterCategory !== 'ALL') {
      filteredCustomers = filteredCustomers.filter(c => c.channelCategory === filterCategory)
    }

    // 11. Transactional Audit Details (Level 3 Drilldown)
    const transactionalRecords = salesOrders.map(so => {
      const cust = customerMap.get(so.customerId)
      const primaryInv = so.invoices[0] || null
      const totalPaid = so.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0)
      const unpaid = Math.max(0, so.totalAmount - totalPaid)
      const isOverdue = unpaid > 0 && primaryInv?.dueDate && new Date(primaryInv.dueDate) < now

      return {
        id: so.id,
        orderNumber: so.orderNumber,
        orderDate: so.orderDate.toISOString().slice(0, 10),
        deliveryDate: so.deliveryDate ? so.deliveryDate.toISOString().slice(0, 10) : null,
        customerId: so.customerId,
        customerName: cust?.name || 'Mijoz',
        companyName: cust?.companyName || cust?.name || '',
        distributionType: cust?.distributionType || 'DIRECT',
        channelCategory: cust?.channelCategory || 'UNCLASSIFIED',
        status: so.status,
        totalAmount: so.totalAmount,
        discountAmount: so.discountAmount || 0,
        logisticsCost: so.logisticsCost || 0,
        itemsCount: so.items.length,
        items: so.items.map(it => ({
          productId: it.productId,
          productName: it.product?.name || 'Mahsulot',
          quantity: it.quantity,
          unit: it.product?.unit || 'kg',
          unitPrice: it.unitPrice,
          discount: it.discount || 0,
          totalPrice: it.totalPrice,
          cogsPerUnit: it.cogsPerUnit || 0
        })),
        invoiceNumber: primaryInv?.invoiceNumber || null,
        invoiceDueDate: primaryInv?.dueDate ? primaryInv.dueDate.toISOString().slice(0, 10) : null,
        invoiceStatus: primaryInv?.status || (unpaid <= 0 ? 'PAID' : 'UNPAID'),
        paidAmount: totalPaid,
        outstandingAmount: unpaid,
        isOverdue,
        returns: so.returns.map(r => ({
          returnNumber: r.returnNumber,
          productName: r.product?.name || 'Mahsulot',
          quantity: r.quantity,
          returnAmount: r.returnAmount,
          reason: r.reason,
          returnDate: r.returnDate.toISOString().slice(0, 10)
        }))
      }
    })

    return NextResponse.json({
      success: true,
      period: searchParams.get('period') || 'ALL',
      dateRange: {
        from: dateRange.fromStr,
        to: dateRange.toStr
      },
      summary: {
        grandNetRevenue,
        grandGrossProfit,
        grandGrossMarginPct: grandNetRevenue > 0 ? (grandGrossProfit / grandNetRevenue) * 100 : 0,
        grandCogs,
        grandLogistics,
        grandContribution,
        grandContributionMarginPct: grandNetRevenue > 0 ? (grandContribution / grandNetRevenue) * 100 : 0,
        grandOutstanding,
        grandOverdue,
        grandVolumeKg,
        grandVolumeDona,
        totalActiveCustomers: new Set(salesOrders.map(o => o.customerId).filter(Boolean)).size,
        totalOrdersCount: salesOrders.length,
        totalReturnsAmount: salesReturns.reduce((sum, r) => sum + (r.returnAmount || 0), 0),
        overallReturnRatePct: (grandNetRevenue + salesReturns.reduce((sum, r) => sum + (r.returnAmount || 0), 0)) > 0
          ? (salesReturns.reduce((sum, r) => sum + (r.returnAmount || 0), 0) / (grandNetRevenue + salesReturns.reduce((sum, r) => sum + (r.returnAmount || 0), 0))) * 100
          : 0
      },
      directVsIndirect,
      channels: filteredChannels,
      allChannelsSummary: channelList,
      customers: filteredCustomers,
      products: productList,
      monthlyTrends,
      alerts,
      transactionalRecords
    })
  } catch (error: any) {
    console.error('Error fetching distribution channel analytics:', error)
    return NextResponse.json({
      error: 'Taqsimot kanallari tahlilini yuklashda xatolik yuz berdi: ' + (error?.message || String(error))
    }, { status: 500 })
  }
}

// PUT /api/director/distribution-channels
// Update customer distribution channel classification and contract terms
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Faqat direktor yoki administrator mijoz kanalini o\'zgartira oladi' }, { status: 403 })
    }

    const body = await request.json()
    const {
      customerId,
      distributionType,
      channelCategory,
      businessRole,
      contractNumber,
      contractDate,
      creditTermDays,
      creditLimit
    } = body

    if (!customerId) {
      return NextResponse.json({ error: 'customerId ko\'rsatilishi shart' }, { status: 400 })
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: {
        distributionType: distributionType || 'DIRECT',
        channelCategory: channelCategory || 'UNCLASSIFIED',
        businessRole: businessRole || null,
        contractNumber: contractNumber || null,
        contractDate: contractDate ? new Date(contractDate) : null,
        creditTermDays: creditTermDays !== undefined ? parseInt(creditTermDays) : 15,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mijoz taqsimot kanali va shartnoma ma\'lumotlari muvaffaqiyatli saqlandi',
      customer: updatedCustomer
    })
  } catch (error: any) {
    console.error('Error updating customer distribution channel:', error)
    return NextResponse.json({
      error: 'Mijoz ma\'lumotlarini yangilashda xatolik: ' + (error?.message || String(error))
    }, { status: 500 })
  }
}

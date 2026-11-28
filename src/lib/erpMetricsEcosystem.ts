/**
 * Unified ERP Business Ecosystem & Shared Metric Layer
 * Follows ERP Global Implementation Rules:
 * - Real data only (no mock data, no fabricated figures)
 * - Single source of truth for all business definitions (Revenue, COGS, Stock, Safety Stock, OTIF, HHI)
 * - Cross-module correlation engine (Sales-Warehouse, Warehouse-Procurement, Procurement-Production, QC-Sales, Logistics-Customer, Finance-Sales)
 * - Centralized deduplicated alert center separating Confirmed Incidents from Projected Risks
 * - Data hygiene & reliability monitoring
 */

// ==========================================
// 1. SHARED DATA FOUNDATION IDENTIFIERS
// ==========================================

export interface SharedEntityIdentifier {
  id: string | number
  name: string
  code?: string
  entityType:
    | 'PRODUCT'
    | 'CUSTOMER'
    | 'SUPPLIER'
    | 'WAREHOUSE'
    | 'ACT'
    | 'ORDER'
    | 'SHIPMENT'
    | 'PRODUCTION_DOC'
    | 'EMPLOYEE'
    | 'DEPARTMENT'
  source1CId?: string
  lastSyncTimestamp?: string
}

// ==========================================
// 2. SHARED METRIC LAYER (SINGLE DEFINITIONS)
// ==========================================

export interface RevenueResult {
  grossRevenue: number
  totalDiscounts: number
  netRevenue: number
}

/**
 * Standard Revenue calculation across all sales, channel, and executive pages
 */
export function calculateRevenue(items: Array<{ quantity: number; unitPrice: number; discountAmount?: number }>): RevenueResult {
  let gross = 0
  let discounts = 0

  for (const it of items) {
    const itemGross = (it.quantity || 0) * (it.unitPrice || 0)
    gross += itemGross
    discounts += (it.discountAmount || 0)
  }

  return {
    grossRevenue: Math.round(gross),
    totalDiscounts: Math.round(discounts),
    netRevenue: Math.round(Math.max(0, gross - discounts))
  }
}

/**
 * Standard Cost of Goods Sold (COGS) calculation
 * Uses actual unit cost if available, or falls back to documented standard 65% baseline
 */
export function calculateCOGS(
  items: Array<{ quantity: number; costPrice?: number | null; unitPrice?: number | null }>
): number {
  let totalCogs = 0
  for (const it of items) {
    const qty = it.quantity || 0
    if (it.costPrice && it.costPrice > 0) {
      totalCogs += qty * it.costPrice
    } else if (it.unitPrice && it.unitPrice > 0) {
      totalCogs += qty * (it.unitPrice * 0.65)
    }
  }
  return Math.round(totalCogs)
}

/**
 * Standard Gross Profit and Margin percentage
 */
export function calculateGrossProfit(netRevenue: number, cogs: number): { grossProfit: number; grossMarginPct: number } {
  const grossProfit = Math.round(netRevenue - cogs)
  const grossMarginPct = netRevenue > 0 ? Number(((grossProfit / netRevenue) * 100).toFixed(1)) : 0
  return { grossProfit, grossMarginPct }
}

/**
 * Standard Available Usable Stock
 * Usable Stock = Total Physical Stock - QC Rejected/Quarantined - Reserved
 */
export function calculateAvailableStock(batches: Array<{ quantity: number; qcStatus: string; isReserved?: boolean }>): {
  totalPhysicalStock: number
  usableStock: number
  quarantinedStock: number
  reservedStock: number
} {
  let total = 0
  let usable = 0
  let quarantined = 0
  let reserved = 0

  for (const b of batches) {
    const qty = b.quantity || 0
    total += qty
    const isQcPassed = b.qcStatus === 'PASSED' || b.qcStatus === 'RELEASED'

    if (!isQcPassed) {
      quarantined += qty
    } else if (b.isReserved) {
      reserved += qty
    } else {
      usable += qty
    }
  }

  return {
    totalPhysicalStock: Number(total.toFixed(1)),
    usableStock: Number(usable.toFixed(1)),
    quarantinedStock: Number(quarantined.toFixed(1)),
    reservedStock: Number(reserved.toFixed(1))
  }
}

/**
 * Standard Weekly Average Consumption (WAC)
 */
export function calculateWeeklyAverageConsumption(logs: Array<{ quantity: number; date: Date | string }>, days = 30): number {
  if (!logs.length) return 0
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const relevant = logs.filter(l => new Date(l.date) >= cutoff)
  const totalConsumed = relevant.reduce((sum, l) => sum + (l.quantity || 0), 0)
  const weeks = Math.max(1, days / 7)
  return Number((totalConsumed / weeks).toFixed(1))
}

/**
 * Standard Stock Coverage Days
 */
export function calculateStockCoverageDays(usableStock: number, dailyBurnKg: number): number {
  if (dailyBurnKg <= 0) return usableStock > 0 ? 999 : 0
  return Number((usableStock / dailyBurnKg).toFixed(1))
}

/**
 * Standard Safety Stock
 * Safety Stock = Daily Burn * Lead Time Days * Safety Factor
 */
export function calculateSafetyStock(dailyBurnKg: number, leadTimeDays = 7, safetyFactor = 1.3): number {
  return Number((dailyBurnKg * leadTimeDays * safetyFactor).toFixed(1))
}

/**
 * Standard Herfindahl-Hirschman Index (0 - 10,000)
 */
export function calculateHHI(shares: number[]): number {
  return Math.round(shares.reduce((sum, s) => sum + Math.pow(s, 2), 0))
}

/**
 * Standard On-Time In-Full (OTIF) calculation
 */
export function calculateOTIF(
  shipments: Array<{
    promisedDate: Date | string
    actualDate?: Date | string | null
    orderedQty: number
    deliveredQty: number
    status?: string
    temperatureCompliant?: boolean
  }>
): {
  totalEligible: number
  onTimeCount: number
  inFullCount: number
  otifCount: number
  onTimePct: number
  inFullPct: number
  otifPct: number
} {
  const eligible = shipments.filter(s => s.status !== 'CANCELLED')
  if (!eligible.length) {
    return { totalEligible: 0, onTimeCount: 0, inFullCount: 0, otifCount: 0, onTimePct: 0, inFullPct: 0, otifPct: 0 }
  }

  let onTime = 0
  let inFull = 0
  let otif = 0

  for (const s of eligible) {
    const isDelivered = s.status === 'DELIVERED' || !!s.actualDate
    const isPromisedMet = isDelivered && s.actualDate && new Date(s.actualDate) <= new Date(s.promisedDate)
    const isFullMet = s.deliveredQty >= s.orderedQty * 0.98 // 2% commercial tolerance
    const isTempMet = s.temperatureCompliant !== false

    if (isPromisedMet) onTime++
    if (isFullMet) inFull++
    if (isPromisedMet && isFullMet && isTempMet) otif++
  }

  const n = eligible.length
  return {
    totalEligible: n,
    onTimeCount: onTime,
    inFullCount: inFull,
    otifCount: otif,
    onTimePct: Number(((onTime / n) * 100).toFixed(1)),
    inFullPct: Number(((inFull / n) * 100).toFixed(1)),
    otifPct: Number(((otif / n) * 100).toFixed(1))
  }
}

// ==========================================
// 3. CROSS-MODULE INTELLIGENCE MODELS
// ==========================================

export interface SalesToWarehouseIntelligence {
  totalConfirmedDemandKg: number
  totalUsableStockKg: number
  netShortageKg: number
  shortageCount: number
  criticalOrdersCount: number
  financialExposureUzs: number
  items: Array<{
    productId: number
    productName: string
    confirmedDemandKg: number
    usableStockKg: number
    deficitKg: number
    affectedOrdersCount: number
    revenueExposureUzs: number
    primaryWarehouse: string
  }>
}

export interface WarehouseToProcurementIntelligence {
  itemsBelowSafetyStockCount: number
  totalReorderVolumeKg: number
  estimatedProcurementSpendUzs: number
  pendingIncomingKg: number
  items: Array<{
    productId: number
    productName: string
    currentStockKg: number
    safetyStockKg: number
    deficitKg: number
    recommendedReorderKg: number
    pendingIncomingOrdersKg: number
    leadTimeDays: number
    stockCoverageDays: number
    urgency: 'CRITICAL' | 'WARNING' | 'NORMAL'
  }>
}

export interface ProcurementToProductionIntelligence {
  atRiskProductionOrdersCount: number
  delayedOutputKg: number
  affectedLines: string[]
  items: Array<{
    productionOrderId: number
    recipeName: string
    plannedOutputKg: number
    missingRawMaterial: string
    requiredKg: number
    availableRawKg: number
    shortageKg: number
    productionStatus: string
  }>
}

export interface QualityToSalesIntelligence {
  quarantinedBatchesCount: number
  quarantinedVolumeKg: number
  affectedCustomerOrdersCount: number
  customerFinancialExposureUzs: number
  items: Array<{
    actNumber: string
    productName: string
    quarantinedKg: number
    reason: string
    affectedCustomers: string[]
    salesOrderIds: number[]
    orderExposureUzs: number
  }>
}

export interface LogisticsToCustomerIntelligence {
  delayedShipmentsCount: number
  delayedVolumeKg: number
  affectedCustomersCount: number
  temperatureViolationsCount: number
  serviceDegradationRatePct: number
  items: Array<{
    shipmentId: number
    destination: string
    customerName: string
    delayedHours: number
    shippedKg: number
    temperatureIssue: boolean
  }>
}

export interface FinanceToSalesIntelligence {
  marginCompressedProductsCount: number
  overallGrossMarginPct: number
  marginCompressionAlert: boolean
  items: Array<{
    productName: string
    customerName?: string
    currentMarginPct: number
    previousMarginPct: number
    marginVariancePct: number
    revenueUzs: number
    driver: 'RAW_MATERIAL_COST' | 'EXCESSIVE_DISCOUNT' | 'LOGISTICS_COST'
  }>
}

// ==========================================
// 4. UNIFIED CENTRALIZED ALERT SYSTEM
// ==========================================

export interface UnifiedEcosystemAlert {
  id: string
  incidentType: 'CONFIRMED_INCIDENT' | 'PROJECTED_RISK'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  category:
    | 'SALES_WAREHOUSE'
    | 'WAREHOUSE_PROCUREMENT'
    | 'PROCUREMENT_PRODUCTION'
    | 'QUALITY_SALES'
    | 'LOGISTICS_CUSTOMER'
    | 'FINANCE_SALES'
  titleUz: string
  titleRu: string
  descriptionUz: string
  descriptionRu: string
  affectedDepartment: string
  affectedEntityName: string
  businessImpactUzs: number
  volumeImpactKg: number
  triggeringMetric: string
  sourceRecordNumber: string
  responsibleRole: string
  recommendedActionUz: string
  recommendedActionRu: string
  status: 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED'
  timestamp: string
}

// ==========================================
// 5. DATA FRESHNESS & RELIABILITY REPORT
// ==========================================

export interface DataReliabilityReport {
  lastSyncTimestamp: string
  freshnessStatus: 'LIVE' | 'STALE' | 'OFFLINE'
  freshnessMinutesAgo: number
  healthScorePct: number
  auditSummary: {
    totalEntitiesAudited: number
    missingCostPricesCount: number
    unclassifiedCustomerChannelsCount: number
    missingTemperatureSensorShipments: number
    unlinkedInspectionActsCount: number
    duplicateRecordsCount: number
  }
  dataSourceStatus: {
    oneCReadApi: 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'
    databasePrisma: 'HEALTHY' | 'WARNING'
    sensorTelemetry: 'ACTIVE' | 'PARTIAL' | 'UNAVAILABLE'
  }
}

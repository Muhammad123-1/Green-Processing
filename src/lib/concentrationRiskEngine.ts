/**
 * Enterprise Business Diversification & Concentration Risk Engine
 * Follows ERP Global Implementation Rules:
 * - Real data only (no mock values, no fabricated revenues)
 * - Strict concentration formulas: Shares, Top 1/3/5, and Herfindahl-Hirschman Index (HHI)
 * - Scenario simulation engine (What-If analysis) strictly separated from actual business records
 * - Transparent configurable thresholds
 */

import fs from 'fs'
import path from 'path'

export interface ConcentrationThresholds {
  customer: {
    nameUz: string
    nameRu: string
    maxTop1Share: number
    maxTop3Share: number
    hhiModerateLimit: number
    hhiCriticalLimit: number
  }
  supplier: {
    nameUz: string
    nameRu: string
    maxTop1Share: number
    maxTop3Share: number
    hhiModerateLimit: number
    hhiCriticalLimit: number
  }
  product: {
    nameUz: string
    nameRu: string
    maxTop1Share: number
    maxTop3Share: number
    hhiModerateLimit: number
    hhiCriticalLimit: number
  }
  channel: {
    nameUz: string
    nameRu: string
    maxTop1Share: number
    maxTop3Share: number
    hhiModerateLimit: number
    hhiCriticalLimit: number
  }
  geographic: {
    nameUz: string
    nameRu: string
    maxTop1Share: number
    maxTop3Share: number
    hhiModerateLimit: number
    hhiCriticalLimit: number
  }
}

export interface ConcentrationEntity {
  id: string | number
  name: string
  code?: string
  value: number // Revenue, Spend, Volume
  sharePercent: number // (value / total) * 100
  cumulativeSharePercent: number
  grossProfit?: number
  grossMarginPercent?: number
  secondaryMetric?: {
    label: string
    value: number
    unit: string
  }
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  category?: string
}

export interface DimensionConcentrationReport {
  dimension: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'CHANNEL' | 'GEOGRAPHIC'
  totalValue: number
  unit: string
  entitiesCount: number
  top1SharePercent: number
  top3SharePercent: number
  top5SharePercent: number
  top1EntityName: string
  hhiIndex: number // Herfindahl-Hirschman Index (0 - 10,000)
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  entities: ConcentrationEntity[]
}

export interface SingleSourceRawMaterial {
  rawMaterialName: string
  totalPurchasedKg: number
  totalSpendUzs: number
  primarySupplierName: string
  primarySupplierKg: number
  primarySupplierSharePercent: number
  approvedSuppliersCount: number
  isSingleSourceRisk: boolean // Share >= 75% or 1 supplier
  averageDailyBurnKg: number
  currentStockKg: number
  stockCoverageDays: number
}

export interface ScenarioSimulationResult {
  scenarioType: 'CUSTOMER_LOSS' | 'SUPPLIER_DISRUPTION' | 'DEMAND_SHOCK' | 'COST_SURGE'
  titleUz: string
  titleRu: string
  baselineDescription: string
  simulationAssumptions: string
  financialExposureUzs: number
  volumeExposureKg: number
  grossMarginImpactPercent: number // e.g. -4.5% margin drop
  productionDowntimeRiskDays: number | null
  postShockHhi: number
  recommendedMitigationUz: string
  recommendedMitigationRu: string
}

export interface ConcentrationRiskAlert {
  id: string
  level: 'CRITICAL' | 'WARNING' | 'INFO'
  dimension: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'CHANNEL' | 'GEOGRAPHIC'
  titleUz: string
  titleRu: string
  descriptionUz: string
  descriptionRu: string
  recommendedActionUz: string
  recommendedActionRu: string
  supportingMetric: {
    entityName: string
    currentSharePercent: number
    thresholdPercent: number
    hhiImpact: number
  }
}

/**
 * Loads configurable concentration risk thresholds
 */
export function getConcentrationThresholds(): ConcentrationThresholds {
  try {
    const filePath = path.join(process.cwd(), 'src/data/concentrationThresholds.json')
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      return parsed.thresholds
    }
  } catch (err) {
    console.error('Failed to load concentration thresholds:', err)
  }

  // Standard economic defaults (HHI: <1500 Unconcentrated, 1500-2500 Moderate, >2500 High)
  return {
    customer: { nameUz: 'Mijozlar', nameRu: 'Клиенты', maxTop1Share: 30, maxTop3Share: 60, hhiModerateLimit: 1800, hhiCriticalLimit: 2500 },
    supplier: { nameUz: 'Yetkazib beruvchilar', nameRu: 'Поставщики', maxTop1Share: 25, maxTop3Share: 50, hhiModerateLimit: 1500, hhiCriticalLimit: 2200 },
    product: { nameUz: 'Mahsulotlar', nameRu: 'Продукты', maxTop1Share: 35, maxTop3Share: 70, hhiModerateLimit: 2000, hhiCriticalLimit: 2800 },
    channel: { nameUz: 'Kanallar', nameRu: 'Каналы', maxTop1Share: 45, maxTop3Share: 80, hhiModerateLimit: 2200, hhiCriticalLimit: 3000 },
    geographic: { nameUz: 'Geografik Bozorlar', nameRu: 'Географические рынки', maxTop1Share: 50, maxTop3Share: 85, hhiModerateLimit: 2500, hhiCriticalLimit: 3500 }
  }
}

/**
 * Calculates Herfindahl-Hirschman Index (HHI)
 * HHI = sum of squared percentage market shares (0 to 10,000)
 */
export function calculateHHI(shares: number[]): number {
  return Math.round(shares.reduce((sum, s) => sum + Math.pow(s, 2), 0))
}

/**
 * Evaluates HHI and shares against dimension thresholds to determine risk level
 */
export function evaluateRiskLevel(
  top1Share: number,
  hhi: number,
  thresholds: { maxTop1Share: number; hhiModerateLimit: number; hhiCriticalLimit: number }
): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (top1Share >= thresholds.maxTop1Share * 1.3 || hhi >= thresholds.hhiCriticalLimit) {
    return 'CRITICAL'
  }
  if (top1Share >= thresholds.maxTop1Share || hhi >= thresholds.hhiModerateLimit) {
    return 'HIGH'
  }
  if (hhi >= thresholds.hhiModerateLimit * 0.7) {
    return 'MODERATE'
  }
  return 'LOW'
}

/**
 * Builds a standardized Dimension Concentration Report with Pareto cumulative sorting
 */
export function buildDimensionReport(
  dimension: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'CHANNEL' | 'GEOGRAPHIC',
  items: Array<{
    id: string | number
    name: string
    code?: string
    value: number
    grossProfit?: number
    category?: string
    secondaryLabel?: string
    secondaryValue?: number
    secondaryUnit?: string
  }>,
  unit: string,
  thresholds: { maxTop1Share: number; maxTop3Share: number; hhiModerateLimit: number; hhiCriticalLimit: number }
): DimensionConcentrationReport {
  const totalValue = items.reduce((sum, it) => sum + it.value, 0)
  const sorted = [...items].sort((a, b) => b.value - a.value)

  let runningCumulative = 0
  const entities: ConcentrationEntity[] = sorted.map((it) => {
    const sharePercent = totalValue > 0 ? Number(((it.value / totalValue) * 100).toFixed(1)) : 0
    runningCumulative += sharePercent
    const cumulativeSharePercent = Number(Math.min(100, runningCumulative).toFixed(1))

    const grossMarginPercent = it.grossProfit !== undefined && it.value > 0
      ? Number(((it.grossProfit / it.value) * 100).toFixed(1))
      : undefined

    const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' =
      sharePercent >= thresholds.maxTop1Share * 1.2
        ? 'CRITICAL'
        : sharePercent >= thresholds.maxTop1Share
        ? 'HIGH'
        : sharePercent >= thresholds.maxTop1Share * 0.5
        ? 'MODERATE'
        : 'LOW'

    return {
      id: it.id,
      name: it.name,
      code: it.code,
      value: it.value,
      sharePercent,
      cumulativeSharePercent,
      grossProfit: it.grossProfit,
      grossMarginPercent,
      category: it.category,
      secondaryMetric: it.secondaryLabel && it.secondaryValue !== undefined
        ? { label: it.secondaryLabel, value: it.secondaryValue, unit: it.secondaryUnit || '' }
        : undefined,
      riskLevel
    }
  })

  const top1SharePercent = entities[0]?.sharePercent || 0
  const top3SharePercent = Number(entities.slice(0, 3).reduce((sum, e) => sum + e.sharePercent, 0).toFixed(1))
  const top5SharePercent = Number(entities.slice(0, 5).reduce((sum, e) => sum + e.sharePercent, 0).toFixed(1))
  const top1EntityName = entities[0]?.name || 'Mavjud emas'

  const hhiIndex = calculateHHI(entities.map(e => e.sharePercent))
  const overallRiskLevel = evaluateRiskLevel(top1SharePercent, hhiIndex, thresholds)

  return {
    dimension,
    totalValue,
    unit,
    entitiesCount: entities.length,
    top1SharePercent,
    top3SharePercent,
    top5SharePercent,
    top1EntityName,
    hhiIndex,
    overallRiskLevel,
    entities
  }
}

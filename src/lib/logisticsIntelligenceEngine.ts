/**
 * Logistics Performance & Delivery Intelligence Engine
 * Follows ERP Global Implementation Rules:
 * - Real data only (no mock values, no fabricated temperature sensors or GPS)
 * - Independent executive calculation service
 * - OTIF and On-Time Delivery calculations
 * - Cold-chain temperature excursion analysis
 * - Vehicle utilization and Cost per KG metrics
 */

export interface VehicleDefinition {
  vehicleNumber: string
  model: string
  payloadCapacityKg: number
  hasRefrigeration: boolean
  standardTempRange: string
  driverName?: string
}

export const FLEET_SPECIFICATIONS: Record<string, VehicleDefinition> = {
  '01 A 777 AA': {
    vehicleNumber: '01 A 777 AA',
    model: 'Isuzu NPR 75 (Ref Izoterm)',
    payloadCapacityKg: 3500,
    hasRefrigeration: true,
    standardTempRange: '+2°C ... +6°C',
    driverName: 'Юлдашев Эркинжон'
  },
  '10.D.952.B.B': {
    vehicleNumber: '10.D.952.B.B',
    model: 'Changan M201 Refrigerator',
    payloadCapacityKg: 1500,
    hasRefrigeration: true,
    standardTempRange: '+2°C ... +6°C',
    driverName: 'Дусаев Достон'
  },
  '01 852 BAA': {
    vehicleNumber: '01 852 BAA',
    model: 'Hyundai Porter II Ref',
    payloadCapacityKg: 2000,
    hasRefrigeration: true,
    standardTempRange: '+2°C ... +6°C',
    driverName: 'Сангиров Исраил'
  },
  '01 411 VAA': {
    vehicleNumber: '01 411 VAA',
    model: 'Daewoo Labo Ref Box',
    payloadCapacityKg: 750,
    hasRefrigeration: true,
    standardTempRange: '+2°C ... +8°C',
    driverName: 'Дусматов Уктамжон'
  }
}

export interface ColdChainProductLimit {
  productCode: string
  nameUz: string
  nameRu: string
  minTempC: number
  maxTempC: number
  criticalAlertTempC: number
}

export const COLD_CHAIN_LIMITS: Record<string, ColdChainProductLimit> = {
  iceberg: {
    productCode: 'iceberg',
    nameUz: 'Aysberg (bargli va to\'g\'ralgan)',
    nameRu: 'Айсберг (листовой и нарезка)',
    minTempC: 1.0,
    maxTempC: 5.0,
    criticalAlertTempC: 7.0
  },
  tomato: {
    productCode: 'tomato',
    nameUz: 'Pomidor (butun)',
    nameRu: 'Томаты целые',
    minTempC: 8.0,
    maxTempC: 12.0,
    criticalAlertTempC: 16.0
  },
  cabbage: {
    productCode: 'cabbage',
    nameUz: 'Karam / Cole Slaw',
    nameRu: 'Капуста / Коул Слоу',
    minTempC: 1.0,
    maxTempC: 4.0,
    criticalAlertTempC: 6.0
  },
  onion: {
    productCode: 'onion',
    nameUz: 'Piyoz (salatbop)',
    nameRu: 'Лук салатный',
    minTempC: 2.0,
    maxTempC: 8.0,
    criticalAlertTempC: 11.0
  },
  salad_mix: {
    productCode: 'salad_mix',
    nameUz: 'Salat Miks (Rukkola, Shpinat, Lollo)',
    nameRu: 'Салат Микс',
    minTempC: 1.0,
    maxTempC: 4.0,
    criticalAlertTempC: 5.5
  }
}

export interface DeliveryShipmentItem {
  id: string
  shipmentNumber: string
  orderNumber?: string
  sourceType: 'CUSTOMER_SALES' | 'INBOUND_PROCUREMENT' | 'RECEIVING_TRANSPORT'
  partnerName: string // Customer or Supplier
  destination: string
  dispatchTime: string | null
  promisedDeliveryTime: string
  actualDeliveryTime: string | null
  deliveryStatus: 'DELIVERED_ON_TIME' | 'DELIVERED_LATE' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED' | 'IN_TRANSIT'
  orderedKg: number
  deliveredKg: number
  acceptedKg: number
  returnedKg: number
  damagedKg: number
  isInFull: boolean
  isOnTime: boolean
  vehicleNumber: string
  driverName: string
  driverHealthStatus: 'VALID' | 'URGENT' | 'NOT_EXAMINED'
  vehicleCapacityKg: number
  vehicleUtilizationPercent: number
  transportCostUzs: number
  costPerKgUzs: number
  // Cold-chain tracking
  cargoTempC: number | null
  tempStatus: 'COMPLIANT' | 'EXCURSION_WARNING' | 'EXCURSION_CRITICAL' | 'SENSOR_DATA_MISSING'
  tempExcursionDeltaC: number | null
  qcInspectionStatus: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'AWAITING_QC'
  delayReason?: string | null
  notes?: string | null
}

export interface DestinationMetric {
  destination: string
  totalShipments: number
  deliveredKg: number
  totalCostUzs: number
  avgCostPerKgUzs: number
  onTimeRatePercent: number
  otifPercent: number
}

export interface VehicleUtilizationRank {
  vehicleNumber: string
  model: string
  driverName: string
  payloadCapacityKg: number
  tripsCount: number
  totalCarriedKg: number
  avgUtilizationPercent: number
  isOverloaded: boolean
  isLowUtilization: boolean
}

export interface ColdChainExcursionEvent {
  id: string
  shipmentNumber: string
  productName: string
  date: string
  vehicleNumber: string
  driverName: string
  measuredTempC: number
  allowedRange: string
  excursionSeverity: 'WARNING' | 'CRITICAL'
  tempDeltaC: number
  riskLevel: string
  qcDecision: string
}

export interface LogisticsExecutiveSummary {
  totalShipments: number
  eligibleDeliveriesCount: number
  onTimeDeliveriesCount: number
  lateDeliveriesCount: number
  overdueUndeliveredCount: number
  inTransitCount: number
  onTimeDeliveryRate: number // %
  otifRate: number // %
  totalDeliveredWeightKg: number
  totalTransportationCostUzs: number
  costPerKgUzs: number
  avgVehicleUtilizationPercent: number
  totalDamagedKg: number
  damageRatePercent: number
  totalReturnedKg: number
  returnRatePercent: number
  coldChainComplianceRate: number // %
  missingSensorDataCount: number
  ordersAwaitingFinalQc: number
}

export interface LogisticsAlert {
  id: string
  level: 'CRITICAL' | 'WARNING' | 'INFO'
  category: 'OVERDUE' | 'COLD_CHAIN' | 'UTILIZATION' | 'COST' | 'DAMAGE' | 'QC'
  titleUz: string
  titleRu: string
  descriptionUz: string
  descriptionRu: string
  recommendedActionUz: string
  recommendedActionRu: string
  affectedReference: string
}

/**
 * Categorizes product name into cold chain limits
 */
export function getProductColdChainLimit(productName: string): ColdChainProductLimit {
  const lower = productName.toLowerCase()
  if (lower.includes('айсберг') || lower.includes('iceberg')) return COLD_CHAIN_LIMITS.iceberg
  if (lower.includes('томат') || lower.includes('помидор') || lower.includes('tomato')) return COLD_CHAIN_LIMITS.tomato
  if (lower.includes('капуста') || lower.includes('слоу') || lower.includes('slaw')) return COLD_CHAIN_LIMITS.cabbage
  if (lower.includes('лук') || lower.includes('onion') || lower.includes('пиёз')) return COLD_CHAIN_LIMITS.onion
  if (lower.includes('микс') || lower.includes('mix') || lower.includes('салат') || lower.includes('рукола')) return COLD_CHAIN_LIMITS.salad_mix
  return COLD_CHAIN_LIMITS.iceberg
}

/**
 * Evaluates temperature measurement strictly against cold chain limits
 * STRICT RULE: If cargoTempC is null, it is SENSOR_DATA_MISSING (never assumed compliant)
 */
export function evaluateTemperatureStatus(
  productName: string,
  cargoTempC: number | null
): {
  status: 'COMPLIANT' | 'EXCURSION_WARNING' | 'EXCURSION_CRITICAL' | 'SENSOR_DATA_MISSING'
  deltaC: number | null
  allowedRange: string
} {
  const limit = getProductColdChainLimit(productName)
  const allowedRange = `${limit.minTempC}°C ... ${limit.maxTempC}°C`

  if (cargoTempC === null || cargoTempC === undefined) {
    return {
      status: 'SENSOR_DATA_MISSING',
      deltaC: null,
      allowedRange
    }
  }

  if (cargoTempC >= limit.minTempC && cargoTempC <= limit.maxTempC) {
    return {
      status: 'COMPLIANT',
      deltaC: 0,
      allowedRange
    }
  }

  const delta = cargoTempC > limit.maxTempC
    ? Number((cargoTempC - limit.maxTempC).toFixed(1))
    : Number((limit.minTempC - cargoTempC).toFixed(1))

  if (cargoTempC >= limit.criticalAlertTempC) {
    return {
      status: 'EXCURSION_CRITICAL',
      deltaC: delta,
      allowedRange
    }
  }

  return {
    status: 'EXCURSION_WARNING',
    deltaC: delta,
    allowedRange
  }
}

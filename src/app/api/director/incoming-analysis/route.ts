import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { detectItemUnit } from '@/lib/units'

const PAGE_SIZE_MAX = 100

function qualityIssues(act: {
  internalOxidation?: number
  insectTraces?: number
  rotDiseases?: number
  noMechanicalDamage?: number
  transportCondition?: number
  hasDocumentation?: number
}) {
  const items: string[] = []
  if (act.internalOxidation === 1) items.push('Ichki oksidlanish')
  if (act.insectTraces === 1) items.push('Hasharot izlari')
  if (act.rotDiseases === 1) items.push('Chirish / kasallik')
  if (act.transportCondition === 0) items.push('Transport holati')
  if (act.hasDocumentation === 0) items.push('Hujjat yo‘q')
  return items
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['DIRECTOR', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''
    const product = searchParams.get('product')?.trim().toLowerCase() || ''
    const supplier = searchParams.get('supplier')?.trim().toLowerCase() || ''
    const status = searchParams.get('status') || ''
    const unitFilter = searchParams.get('unit')?.trim().toLowerCase() || ''
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(10, Number.parseInt(searchParams.get('pageSize') || '20', 10) || 20))

    const actWhere: any = {}
    const arrWhere: any = {}
    if (dateFrom || dateTo) {
      actWhere.actDate = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
      arrWhere.date = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
    }

    const [incomingActs, shopArrivals] = await Promise.all([
      prisma.incomingRawMaterialAct.findMany({
        where: actWhere,
        orderBy: [{ actDate: 'desc' }, { id: 'desc' }],
      }),
      prisma.shopArrival.findMany({
        where: arrWhere,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
    ])

    // Build fast lookup maps for QC act enrichment
    const actByBatch = new Map<string, typeof incomingActs[0]>()
    const actByDateProd = new Map<string, typeof incomingActs[0]>()
    incomingActs.forEach((act) => {
      if (act.batchNumber) {
        actByBatch.set(String(act.batchNumber).trim().toLowerCase(), act)
      }
      const k = `${act.actDate}_${(act.productName || '').trim().toLowerCase()}`
      if (!actByDateProd.has(k)) actByDateProd.set(k, act)
    })

    // Unified records collection across ALL shop arrivals and lab acts
    const unified: any[] = []
    const consumedActIds = new Set<number>()

    // 1. Process all shop arrivals (includes vegetables, packaging, boxes, stickers, chemicals, consumables)
    shopArrivals.forEach((sa) => {
      const nom = (sa.nomenclature || '').trim()
      if (!nom) return // Skip blank weekend placeholders
      const unit = detectItemUnit(nom)
      const bKey = (sa.batch || '').trim().toLowerCase()
      const dKey = `${sa.date}_${nom.toLowerCase()}`
      const match = (bKey && actByBatch.get(bKey)) || actByDateProd.get(dKey)

      if (match) consumedActIds.add(match.id)

      const issues = match ? qualityIssues(match) : []
      const rating = match ? match.decisionRating : 4
      const sName = (sa.supplier || match?.supplierName || "Yetkazib beruvchi").trim()
      const inspector = match?.inspectorName || 'Sifat nazorati / Omborchi'

      unified.push({
        id: `arr-${sa.id}`,
        actNumber: sa.batch ? `Partiya #${sa.batch}` : (match?.batchNumber ? `Partiya #${match.batchNumber}` : `Partiya yozilmagan`),
        actDate: sa.date,
        productName: nom,
        supplierName: sName,
        batchNumber: sa.batch || match?.batchNumber || '',
        warehouseKg: sa.quantity || 0,
        unit,
        decisionRating: rating,
        decisionText: match?.decisionText || 'Qabul qilingan (Ombor)',
        temperature: match?.temperature || null,
        inspectorName: inspector,
        rejectionActNumber: match?.rejectionActNumber || null,
        notes: match?.notes || null,
        qualityIssues: issues,
      })
    })

    // 2. Add any remaining lab acts that were rejected or not recorded in shop arrival
    incomingActs.forEach((act) => {
      if (consumedActIds.has(act.id)) return
      const unit = detectItemUnit(act.productName)
      const issues = qualityIssues(act)
      unified.push({
        id: `act-${act.id}`,
        actNumber: act.batchNumber
          ? (act.batchNumber.toUpperCase().startsWith('PAR-') ? 'Partiya yozilmagan' : `Partiya #${act.batchNumber}`)
          : 'Partiya yozilmagan',
        actDate: act.actDate,
        productName: act.productName,
        supplierName: act.supplierName,
        batchNumber: act.batchNumber || '',
        warehouseKg: act.warehouseKg || 0,
        unit,
        decisionRating: act.decisionRating,
        decisionText: act.decisionText || (act.decisionRating === 2 ? 'Rad etilgan' : 'Qabul qilingan'),
        temperature: act.temperature || null,
        inspectorName: act.inspectorName || null,
        rejectionActNumber: act.rejectionActNumber || null,
        notes: act.notes || null,
        qualityIssues: issues,
      })
    })

    // Calculate global stats across all items (before filters)
    let totalActs = 0
    let totalWeightKg = 0
    let totalCountDona = 0
    let rejectedActs = 0
    let conditionalActs = 0
    let issueActs = 0

    // Products and suppliers aggregation maps
    const productsMap = new Map<string, {
      name: string
      unit: string
      acts: number
      weightKg: number
      unknownWeightActs: number
      rejected: number
      conditional: number
      issues: number
    }>()

    const suppliersMap = new Map<string, {
      name: string
      unit?: string
      acts: number
      weightKg: number
      donaCount: number
      rejected: number
      issues: number
    }>()

    for (const item of unified) {
      const isRej = item.decisionRating === 2
      const isCond = item.decisionRating === 3
      const hasIss = item.qualityIssues.length > 0

      totalActs++
      if (item.unit === 'kg') {
        totalWeightKg += item.warehouseKg
      } else {
        totalCountDona += item.warehouseKg
      }

      if (isRej) rejectedActs++
      if (isCond) conditionalActs++
      if (hasIss) issueActs++

      // Product grouping
      const prodItem = productsMap.get(item.productName) || {
        name: item.productName,
        unit: item.unit,
        acts: 0,
        weightKg: 0,
        unknownWeightActs: 0,
        rejected: 0,
        conditional: 0,
        issues: 0,
      }
      prodItem.acts++
      prodItem.weightKg += item.warehouseKg
      if (isRej) prodItem.rejected++
      if (isCond) prodItem.conditional++
      if (hasIss) prodItem.issues++
      productsMap.set(item.productName, prodItem)

      // Supplier grouping
      const suppItem = suppliersMap.get(item.supplierName) || {
        name: item.supplierName,
        unit: item.unit,
        acts: 0,
        weightKg: 0,
        donaCount: 0,
        rejected: 0,
        issues: 0,
      }
      suppItem.acts++
      if (item.unit === 'kg') {
        suppItem.weightKg += item.warehouseKg
      } else {
        suppItem.donaCount += item.warehouseKg
      }
      if (isRej) suppItem.rejected++
      if (hasIss) suppItem.issues++
      suppliersMap.set(item.supplierName, suppItem)
    }

    // Now filter unified records based on user's active filters
    let filteredRecords = unified

    if (product) {
      filteredRecords = filteredRecords.filter((r) =>
        r.productName.toLowerCase().includes(product)
      )
    }

    if (supplier) {
      filteredRecords = filteredRecords.filter((r) =>
        r.supplierName.toLowerCase().includes(supplier)
      )
    }

    if (status === 'REJECTED') {
      filteredRecords = filteredRecords.filter((r) => r.decisionRating === 2)
    } else if (status === 'CONDITIONAL') {
      filteredRecords = filteredRecords.filter((r) => r.decisionRating === 3)
    } else if (status === 'ACCEPTED') {
      filteredRecords = filteredRecords.filter((r) => r.decisionRating >= 4)
    }

    if (unitFilter === 'kg') {
      filteredRecords = filteredRecords.filter((r) => r.unit === 'kg')
    } else if (unitFilter === 'dona') {
      filteredRecords = filteredRecords.filter((r) => r.unit === 'dona')
    }

    // Sort records by actDate desc, id desc
    filteredRecords.sort((a, b) => b.actDate.localeCompare(a.actDate))

    // If product filter is active, calculate suppliers specific to that product
    let relevantSuppliers = [...suppliersMap.values()]
    if (product) {
      const productSuppliers = new Map<string, typeof relevantSuppliers[0]>()
      for (const r of filteredRecords) {
        const s = productSuppliers.get(r.supplierName) || {
          name: r.supplierName,
          unit: r.unit,
          acts: 0,
          weightKg: 0,
          donaCount: 0,
          rejected: 0,
          issues: 0,
        }
        s.acts++
        if (r.unit === 'kg') s.weightKg += r.warehouseKg
        else s.donaCount += r.warehouseKg
        if (r.decisionRating === 2) s.rejected++
        if (r.qualityIssues.length) s.issues++
        productSuppliers.set(r.supplierName, s)
      }
      relevantSuppliers = [...productSuppliers.values()]
    }

    // Sort products: highest volume/amount first
    const allProducts = [...productsMap.values()].sort((a, b) => b.weightKg - a.weightKg || b.acts - a.acts)
    relevantSuppliers.sort((a, b) => b.weightKg - a.weightKg || b.acts - a.acts)

    // Paginate records
    const totalItems = filteredRecords.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      success: true,
      stats: {
        totalActs,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        totalCountDona: Math.round(totalCountDona),
        weightKnownActs: totalActs,
        unknownWeightActs: 0,
        rejectedActs,
        conditionalActs,
        issueActs,
      },
      products: allProducts,
      suppliers: relevantSuppliers,
      records: pagedRecords,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Incoming executive analysis error:', error)
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

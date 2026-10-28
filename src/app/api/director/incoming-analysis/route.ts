import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE_MAX = 100

function qualityIssues(act: {
  internalOxidation: number
  insectTraces: number
  rotDiseases: number
  noMechanicalDamage: number
  transportCondition: number
  hasDocumentation: number
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
    const product = searchParams.get('product')?.trim() || ''
    const supplier = searchParams.get('supplier')?.trim() || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(10, Number.parseInt(searchParams.get('pageSize') || '20', 10) || 20))

    const where: any = {}
    if (dateFrom || dateTo) where.actDate = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
    if (product) where.productName = { contains: product, mode: 'insensitive' }
    if (supplier) where.supplierName = { contains: supplier, mode: 'insensitive' }
    if (status === 'REJECTED') where.decisionRating = 2
    if (status === 'CONDITIONAL') where.decisionRating = 3
    if (status === 'ACCEPTED') where.decisionRating = { gte: 4 }

    const select = {
      id: true, actNumber: true, actDate: true, productName: true, supplierName: true,
      batchNumber: true, warehouseKg: true, decisionRating: true, decisionText: true,
      temperature: true, inspectorName: true, rejectionActNumber: true, notes: true,
      internalOxidation: true, insectTraces: true, rotDiseases: true,
      noMechanicalDamage: true, transportCondition: true, hasDocumentation: true,
    } as const

    const [allActs, totalItems, records] = await Promise.all([
      prisma.incomingRawMaterialAct.findMany({ where, select }),
      prisma.incomingRawMaterialAct.count({ where }),
      prisma.incomingRawMaterialAct.findMany({
        where, select, orderBy: [{ actDate: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
    ])

    const products = new Map<string, { name: string; acts: number; weightKg: number; unknownWeightActs: number; rejected: number; conditional: number; issues: number }>()
    const suppliers = new Map<string, { name: string; acts: number; weightKg: number; rejected: number; issues: number }>()
    let totalWeightKg = 0
    let weightKnownActs = 0
    let rejectedActs = 0
    let conditionalActs = 0
    let issueActs = 0

    for (const act of allActs) {
      const weight = typeof act.warehouseKg === 'number' ? act.warehouseKg : null
      const issues = qualityIssues(act)
      const isRejected = act.decisionRating === 2
      const isConditional = act.decisionRating === 3
      if (weight !== null) { totalWeightKg += weight; weightKnownActs++ }
      if (isRejected) rejectedActs++
      if (isConditional) conditionalActs++
      if (issues.length) issueActs++

      const productItem = products.get(act.productName) || { name: act.productName, acts: 0, weightKg: 0, unknownWeightActs: 0, rejected: 0, conditional: 0, issues: 0 }
      productItem.acts++
      if (weight === null) productItem.unknownWeightActs++
      else productItem.weightKg += weight
      if (isRejected) productItem.rejected++
      if (isConditional) productItem.conditional++
      if (issues.length) productItem.issues++
      products.set(act.productName, productItem)

      const supplierItem = suppliers.get(act.supplierName) || { name: act.supplierName, acts: 0, weightKg: 0, rejected: 0, issues: 0 }
      supplierItem.acts++
      if (weight !== null) supplierItem.weightKg += weight
      if (isRejected) supplierItem.rejected++
      if (issues.length) supplierItem.issues++
      suppliers.set(act.supplierName, supplierItem)
    }

    const enrich = (act: typeof records[number]) => ({ ...act, qualityIssues: qualityIssues(act) })
    return NextResponse.json({
      success: true,
      stats: { totalActs: totalItems, totalWeightKg, weightKnownActs, unknownWeightActs: totalItems - weightKnownActs, rejectedActs, conditionalActs, issueActs },
      products: [...products.values()].sort((a, b) => b.weightKg - a.weightKg || b.acts - a.acts),
      suppliers: [...suppliers.values()].sort((a, b) => b.rejected - a.rejected || b.issues - a.issues || b.weightKg - a.weightKg),
      records: records.map(enrich),
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
    })
  } catch (error: any) {
    console.error('Incoming executive analysis error:', error)
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

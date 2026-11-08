import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().slice(0, 10)

    const [
      rawActCount,
      legacyInspectionCount,
      todayRawCount,
      todayLegacyCount,
      rejectedRawCount,
      rejectedLegacyCount,
      conditionalRawCount,
      conditionalLegacyCount,
      productsCount,
      suppliersCount,
      recentRawActs,
      recentLegacyInspections
    ] = await Promise.all([
      prisma.incomingRawMaterialAct.count(),
      prisma.inspection.count(),
      prisma.incomingRawMaterialAct.count({
        where: {
          OR: [
            { actDate: todayStr },
            { createdAt: { gte: today } }
          ]
        }
      }),
      prisma.inspection.count({
        where: {
          inspectionDate: { gte: today }
        }
      }),
      prisma.incomingRawMaterialAct.count({ where: { decisionRating: 2 } }),
      prisma.inspection.count({ where: { status: 'REJECTED' } }),
      prisma.incomingRawMaterialAct.count({ where: { decisionRating: 3 } }),
      prisma.inspection.count({ where: { status: 'CONDITIONAL' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.incomingRawMaterialAct.findMany({
        take: 10,
        orderBy: [{ id: 'desc' }],
      }),
      prisma.inspection.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          product: { select: { name: true } }
        }
      })
    ])

    const totalCount = rawActCount + legacyInspectionCount
    const todayCount = todayRawCount + todayLegacyCount
    const rejectedCount = rejectedRawCount + rejectedLegacyCount
    const conditionalCount = conditionalRawCount + conditionalLegacyCount
    const acceptedCount = Math.max(0, totalCount - rejectedCount - conditionalCount)

    // Format recent inspections
    const recentInspections = recentRawActs.length > 0
      ? recentRawActs.map(act => ({
          id: act.id,
          actNumber: act.actNumber ? `№ ${act.actNumber}` : `AKT-${act.id}`,
          inspectionDate: act.actDate || act.createdAt.toISOString().slice(0, 10),
          supplier: { name: act.supplierName || '—' },
          product: { name: act.productName || '—' },
          quantity: act.warehouseKg || 0,
          quantityUnit: 'kg',
          status: act.decisionRating === 2 ? 'REJECTED' : act.decisionRating === 3 ? 'CONDITIONAL' : 'ACCEPTED',
          conclusion: act.decisionText || 'Yaxshi'
        }))
      : recentLegacyInspections.map(ins => ({
          id: ins.id,
          actNumber: ins.actNumber,
          inspectionDate: ins.inspectionDate.toISOString().slice(0, 10),
          supplier: { name: ins.supplier.name },
          product: { name: ins.product.name },
          quantity: ins.quantity,
          quantityUnit: ins.quantityUnit,
          status: ins.status,
          conclusion: ins.conclusion
        }))

    return NextResponse.json({
      todayCount,
      totalCount,
      acceptedCount,
      rejectedCount,
      conditionalCount,
      productsCount,
      suppliersCount,
      recentInspections,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

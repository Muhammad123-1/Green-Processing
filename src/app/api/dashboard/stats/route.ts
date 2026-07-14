import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      todayCount,
      totalCount,
      acceptedCount,
      rejectedCount,
      conditionalCount,
      productsCount,
      suppliersCount,
      recentInspections,
    ] = await Promise.all([
      prisma.inspection.count({
        where: {
          inspectionDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.inspection.count(),
      prisma.inspection.count({ where: { status: 'ACCEPTED' } }),
      prisma.inspection.count({ where: { status: 'REJECTED' } }),
      prisma.inspection.count({ where: { status: 'CONDITIONAL' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.inspection.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          product: { select: { name: true } },
        },
      }),
    ])

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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'DIRECTOR' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run aggregations in parallel for performance
    const [
      totalEmployees,
      totalInspections,
      salesOrdersCount,
      revenueResult
    ] = await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.inspection.count(),
      prisma.salesOrder.count(),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } }
      })
    ])

    const totalRevenue = revenueResult._sum.totalAmount || 0

    return NextResponse.json({
      totalEmployees,
      totalInspections,
      salesOrdersCount,
      totalRevenue
    })
  } catch (error: any) {
    console.error('Error fetching director dashboard stats:', error)
    return NextResponse.json({ error: 'Statistikani yuklashda xatolik' }, { status: 500 })
  }
}

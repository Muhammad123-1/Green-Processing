import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly'
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    // Monthly stats
    if (type === 'monthly') {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      const [total, accepted, rejected, conditional, byProduct, bySupplier] = await Promise.all([
        prisma.inspection.count({ where: { inspectionDate: { gte: startDate, lte: endDate } } }),
        prisma.inspection.count({ where: { status: 'ACCEPTED', inspectionDate: { gte: startDate, lte: endDate } } }),
        prisma.inspection.count({ where: { status: 'REJECTED', inspectionDate: { gte: startDate, lte: endDate } } }),
        prisma.inspection.count({ where: { status: 'CONDITIONAL', inspectionDate: { gte: startDate, lte: endDate } } }),
        prisma.inspection.groupBy({
          by: ['productId'],
          where: { inspectionDate: { gte: startDate, lte: endDate } },
          _count: { id: true },
          _sum: { quantity: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.inspection.groupBy({
          by: ['supplierId'],
          where: { inspectionDate: { gte: startDate, lte: endDate } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ])

      // Get product names
      const productIds = byProduct.map((p) => p.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })

      const supplierIds = bySupplier.map((s) => s.supplierId)
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      })

      const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]))
      const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]))

      return NextResponse.json({
        total,
        accepted,
        rejected,
        conditional,
        byProduct: byProduct.map((p) => ({
          productId: p.productId,
          name: productMap[p.productId] || 'Unknown',
          count: p._count.id,
          totalQuantity: p._sum.quantity || 0,
        })),
        bySupplier: bySupplier.map((s) => ({
          supplierId: s.supplierId,
          name: supplierMap[s.supplierId] || 'Unknown',
          count: s._count.id,
        })),
      })
    }

    // Yearly stats - count by month
    if (type === 'yearly') {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59)

      const inspections = await prisma.inspection.findMany({
        where: { inspectionDate: { gte: startDate, lte: endDate } },
        select: { inspectionDate: true, status: true },
      })

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: 0,
        accepted: 0,
        rejected: 0,
        conditional: 0,
      }))

      inspections.forEach((ins) => {
        const m = new Date(ins.inspectionDate).getMonth()
        monthlyData[m].total++
        if (ins.status === 'ACCEPTED') monthlyData[m].accepted++
        else if (ins.status === 'REJECTED') monthlyData[m].rejected++
        else if (ins.status === 'CONDITIONAL') monthlyData[m].conditional++
      })

      return NextResponse.json({ year, monthlyData })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

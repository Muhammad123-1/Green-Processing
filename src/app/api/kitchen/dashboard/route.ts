import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Fetch all products with active batches
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: {
            qcStatus: 'APPROVED',
            quantity: { gt: 0 }
          },
          include: {
            warehouse: true,
            zone: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 2. Fetch all transfers
    let transfers: any[] = []
    try {
      transfers = await prisma.stockTransfer.findMany({
        include: {
          product: true,
          batch: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch {
      transfers = []
    }

    const pendingHandshakes = transfers.filter(t => t.status === 'IN_TRANSIT')
    const completedTransfers = transfers.filter(t => t.status === 'ACCEPTED' || t.status === 'DISCREPANCY')
    const discrepancyTransfers = transfers.filter(t => t.status === 'DISCREPANCY' || (t.discrepancy && Math.abs(t.discrepancy) > 0))

    const totalDiscrepancy = discrepancyTransfers.reduce((sum, t) => sum + (t.discrepancy || 0), 0)

    // 3. Calculate Multi-Location Stock breakdown
    const multiLocationStock = products.map(product => {
      const warehouseQty = product.batches.reduce((sum, b) => sum + b.quantity, 0)
      
      // Calculate received in Zagotovka vs Oshxona
      const zagotovkaReceived = transfers
        .filter(t => t.productId === product.id && t.targetLocation === 'ZAGOTOVKA' && (t.status === 'ACCEPTED' || t.status === 'DISCREPANCY'))
        .reduce((sum, t) => sum + (t.receivedQuantity || 0), 0)

      const oshxonaReceived = transfers
        .filter(t => t.productId === product.id && t.targetLocation === 'OSHXONA' && (t.status === 'ACCEPTED' || t.status === 'DISCREPANCY'))
        .reduce((sum, t) => sum + (t.receivedQuantity || 0), 0)

      const totalAcrossLocations = warehouseQty + zagotovkaReceived + oshxonaReceived

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        unit: product.unit || 'kg',
        minStockLevel: product.minStockLevel || 0,
        locations: {
          warehouse: warehouseQty,
          zagotovka: zagotovkaReceived,
          oshxona: oshxonaReceived,
          coldStorage: 0 // extensible
        },
        totalQuantity: totalAcrossLocations
      }
    })

    return NextResponse.json({
      kpis: {
        pendingHandshakesCount: pendingHandshakes.length,
        totalTransfersCount: transfers.length,
        discrepancyCount: discrepancyTransfers.length,
        totalDiscrepancyKg: parseFloat(totalDiscrepancy.toFixed(2))
      },
      pendingHandshakes,
      completedTransfers,
      discrepancyTransfers,
      multiLocationStock
    })
  } catch (error) {
    console.error('Kitchen dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load kitchen dashboard' }, { status: 500 })
  }
}

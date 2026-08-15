import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch all active products with their approved warehouse batches
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: {
            qcStatus: 'APPROVED',
            quantity: { gt: 0 }
          },
          orderBy: {
            expirationDate: 'asc' // FEFO
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 2. Fetch all suppliers for quick selection
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // 3. Fetch all orders with product, supplier, and inspections
    const rawOrders = await prisma.order.findMany({
      include: {
        product: true,
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 4. Calculate warehouse inventory statuses for Snabjenets
    let outOfStockCount = 0
    let lowStockCount = 0
    let sufficientCount = 0
    let orderNeededCount = 0

    const inventoryStatus = products.map((product) => {
      const totalQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0)
      const minStock = product.minStockLevel || 0
      const neededQuantity = Math.max(0, minStock - totalQuantity)

      let status = 'green' // 'green' | 'yellow' | 'red'

      if (totalQuantity === 0) {
        status = 'red'
        outOfStockCount++
        orderNeededCount++
      } else if (minStock > 0 && totalQuantity < minStock) {
        status = 'yellow'
        lowStockCount++
        orderNeededCount++
      } else {
        status = 'green'
        sufficientCount++
      }

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        unit: product.unit || 'kg',
        totalQuantity,
        minStockLevel: minStock,
        neededQuantity,
        status,
        batchesCount: product.batches.length
      }
    })

    // 5. Process Orders & Delivery Reconciliation
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    let pendingOrdersCount = 0
    let todayDeliveriesCount = 0
    let delayedOrdersCount = 0

    const processedOrders = rawOrders.map((order: any) => {
      const expDate = new Date(order.expectedDate)
      const expDateStr = !isNaN(expDate.getTime()) ? expDate.toISOString().split('T')[0] : ''
      const isPast = !isNaN(expDate.getTime()) && expDateStr < todayStr
      const isToday = expDateStr === todayStr

      let computedStatus = order.status || 'PENDING'
      if (computedStatus === 'PENDING' && isPast) {
        computedStatus = 'DELAYED'
        delayedOrdersCount++
      } else if (computedStatus === 'PENDING') {
        pendingOrdersCount++
        if (isToday) {
          todayDeliveriesCount++
        }
      }

      // Reconciliation: inspection link or direct delivery fields
      const latestInspection = order.inspections?.[0]
      const deliveredQty = order.deliveredQuantity ?? (latestInspection ? latestInspection.quantity : null)
      const acceptedQty = order.acceptedQuantity ?? (latestInspection?.status === 'ACCEPTED' ? latestInspection.quantity : null)
      const rejectedQty = order.rejectedQuantity ?? (latestInspection?.status === 'REJECTED' ? latestInspection.quantity : 0)
      
      const shortageQty = deliveredQty !== null ? order.quantity - deliveredQty : null

      return {
        id: order.id,
        productId: order.productId,
        productName: order.product?.name || 'Noma\'lum',
        productUnit: order.unit || order.product?.unit || 'kg',
        supplierId: order.supplierId,
        supplierName: order.supplierName || 'Ta\'minotchi ko\'rsatilmagan',
        quantity: order.quantity,
        unit: order.unit || 'kg',
        price: order.price,
        expectedDate: order.expectedDate,
        expectedDateStr: expDateStr,
        timeRange: order.timeRange || '09:00 - 18:00',
        actualDeliveryTime: order.actualDeliveryTime,
        deliveredQuantity: deliveredQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        shortageQuantity: shortageQty,
        status: computedStatus,
        notes: order.notes,
        hasInspection: !!latestInspection,
        inspectionActNumber: latestInspection?.actNumber,
        inspectionConclusion: latestInspection?.conclusion,
        createdAt: order.createdAt
      }
    })

    return NextResponse.json({
      metrics: {
        outOfStockCount,
        lowStockCount,
        sufficientCount,
        orderNeededCount,
        pendingOrdersCount,
        todayDeliveriesCount,
        delayedOrdersCount,
        totalOrdersCount: rawOrders.length
      },
      inventory: inventoryStatus,
      orders: processedOrders,
      suppliers
    })
  } catch (error) {
    console.error('Supply dashboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch supply dashboard data' }, { status: 500 })
  }
}

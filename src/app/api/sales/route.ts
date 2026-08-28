import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      }
    })

    return NextResponse.json(salesOrders)
  } catch (error: any) {
    console.error('Error fetching sales orders:', error)
    return NextResponse.json({ error: 'Sotuv buyurtmalarini yuklashda xatolik' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { customerId, deliveryDate, notes, items } = data

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Mijoz va kamida bitta mahsulot tanlanishi shart" }, { status: 400 })
    }

    // Yaratilayotgan buyurtma uchun raqam
    const orderCount = await prisma.salesOrder.count()
    const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    // Use transaction for consistency
    const salesOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItemsData = items.map((item: any) => {
        const lineTotal = item.quantity * item.unitPrice - (item.discount || 0)
        totalAmount += lineTotal
        return {
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0),
          totalPrice: lineTotal
        }
      })

      const newOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: parseInt(customerId),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          notes,
          totalAmount,
          status: 'CONFIRMED',
          items: {
            create: orderItemsData
          }
        },
        include: {
          customer: true,
          items: true
        }
      })

      // INVENTORY DEDUCTION (FIFO)
      for (const item of orderItemsData) {
        let remainingQtyToDeduct = item.quantity

        // Find available batches for this product, oldest first (FIFO)
        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: item.productId,
            quantity: { gt: 0 }
          },
          orderBy: {
            receivedDate: 'asc'
          }
        })

        for (const batch of batches) {
          if (remainingQtyToDeduct <= 0) break

          if (batch.quantity >= remainingQtyToDeduct) {
            // This batch can cover the remaining qty entirely
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: { quantity: batch.quantity - remainingQtyToDeduct }
            })
            remainingQtyToDeduct = 0
          } else {
            // This batch only partially covers, take what it has
            remainingQtyToDeduct -= batch.quantity
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: { quantity: 0 }
            })
          }
        }
        
        // Optional: If remainingQtyToDeduct > 0, it means we didn't have enough stock!
        // For now, we will allow it, but typically you'd throw an error:
        // if (remainingQtyToDeduct > 0) throw new Error(`Not enough stock for product ID ${item.productId}`)
      }

      return newOrder
    })

    return NextResponse.json(salesOrder, { status: 201 })
  } catch (error: any) {
    console.error('Error creating sales order:', error)
    return NextResponse.json({ error: 'Buyurtma yaratish yoki omborni yangilashda xatolik' }, { status: 500 })
  }
}

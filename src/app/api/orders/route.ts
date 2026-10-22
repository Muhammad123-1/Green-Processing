import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const numProductId = parseInt(body.productId)
    if (isNaN(numProductId)) {
      return NextResponse.json({ error: 'Mahsulot tanlanmagan yoki noto\'g\'ri' }, { status: 400 })
    }

    const numQuantity = parseFloat(body.quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json({ error: "Buyurtma miqdori 0 dan katta bo'lishi shart" }, { status: 400 })
    }

    let parsedExpectedDate = new Date(body.expectedDate)
    if (isNaN(parsedExpectedDate.getTime())) {
      parsedExpectedDate = new Date()
      parsedExpectedDate.setDate(parsedExpectedDate.getDate() + 1)
    }

    const numSupplierId = body.supplierId && !isNaN(parseInt(body.supplierId)) ? parseInt(body.supplierId) : null
    const numPrice = body.price && !isNaN(parseFloat(body.price)) ? parseFloat(body.price) : null
    const numDelivered = body.deliveredQuantity !== undefined && body.deliveredQuantity !== null && !isNaN(parseFloat(body.deliveredQuantity)) ? parseFloat(body.deliveredQuantity) : null
    const numAccepted = body.acceptedQuantity !== undefined && body.acceptedQuantity !== null && !isNaN(parseFloat(body.acceptedQuantity)) ? parseFloat(body.acceptedQuantity) : null
    const numRejected = body.rejectedQuantity !== undefined && body.rejectedQuantity !== null && !isNaN(parseFloat(body.rejectedQuantity)) ? parseFloat(body.rejectedQuantity) : null

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: numProductId }
    })
    if (!product) {
      return NextResponse.json({ error: 'Bunday mahsulot topilmadi' }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        productId: numProductId,
        supplierId: numSupplierId,
        supplierName: body.supplierName?.trim() || null,
        quantity: numQuantity,
        unit: body.unit || product.unit || 'kg',
        expectedDate: parsedExpectedDate,
        timeRange: body.timeRange?.trim() || null,
        status: body.status || 'PENDING',
        price: numPrice,
        notes: body.notes?.trim() || null,
        deliveredQuantity: numDelivered,
        acceptedQuantity: numAccepted,
        rejectedQuantity: numRejected,
      },
      include: {
        product: true,
      }
    })

    // Avtomatik ravishda chatga xabar yuborish (Sklad yoki Ta'minotchi zayavkasi)
    try {
      const zayavkaText = `🟢 YANGI ZAYAVKA / BUYURTMA:
Mahsulot: ${order.product.name}
Miqdor: ${order.quantity} ${order.unit}
Kelish vaqti: ${new Date(order.expectedDate).toLocaleDateString()} (${order.timeRange || 'Vaqt belgilanmagan'})
Ta'minotchi: ${order.supplierName || 'Hali tanlanmagan'}
Izoh: ${order.notes || 'Yo\'q'}`

      await prisma.chatMessage.create({
        data: {
          sender: 'TIZIM',
          text: zayavkaText,
          groupId: 'general'
        }
      })
    } catch (chatErr) {
      console.warn('Could not post order notification to chat:', chatErr)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 })
  }
}

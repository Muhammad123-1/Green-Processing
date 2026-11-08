import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting / Unauthorized' }, { status: 401 })
    }

    let targetSupplierId: number | null = null
    let targetSupplierName: string | null = null

    if (session.role === 'SUPPLIER') {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: { supplier: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
      }

      targetSupplierId = user.supplierId || null
      targetSupplierName = user.supplier?.name || null

      // If supplierId wasn't directly linked, try to match by user name or supplier name
      if (!targetSupplierId && !targetSupplierName) {
        const matched = await prisma.supplier.findFirst({
          where: {
            OR: [
              { name: { contains: user.name, mode: 'insensitive' } },
              { shortName: { contains: user.username, mode: 'insensitive' } }
            ]
          }
        })
        if (matched) {
          targetSupplierId = matched.id
          targetSupplierName = matched.name
        }
      }
    } else if (session.role === 'ADMIN' || session.role === 'DIRECTOR' || session.role === 'SUPPLY') {
      // Admins/Supply can preview specific supplier portal via ?supplierId=...
      const { searchParams } = new URL(request.url)
      const querySupId = searchParams.get('supplierId')
      if (querySupId && !isNaN(parseInt(querySupId))) {
        targetSupplierId = parseInt(querySupId)
        const s = await prisma.supplier.findUnique({ where: { id: targetSupplierId } })
        targetSupplierName = s?.name || null
      }
    } else {
      return NextResponse.json({ error: 'Ushbu bo\'lim faqat Yetkazib Beruvchilar uchun' }, { status: 403 })
    }

    // Build the query filter strictly isolated to this supplier
    let whereClause: any = {}
    if (targetSupplierId && targetSupplierName) {
      whereClause = {
        OR: [
          { supplierId: targetSupplierId },
          { supplierName: { contains: targetSupplierName, mode: 'insensitive' } }
        ]
      }
    } else if (targetSupplierId) {
      whereClause = { supplierId: targetSupplierId }
    } else if (targetSupplierName) {
      whereClause = { supplierName: { contains: targetSupplierName, mode: 'insensitive' } }
    } else if (session.role === 'SUPPLIER') {
      // Supplier has no linked supplier profile yet
      return NextResponse.json({
        supplier: null,
        orders: [],
        metrics: {
          totalOrders: 0,
          pendingOrders: 0,
          inTransitOrders: 0,
          deliveredOrders: 0,
          totalDeliveredKg: 0
        },
        message: "Akkauntingiz hali korxona yetkazib beruvchisiga biriktirilmagan. Iltimos, Administrator bilan bog'laning."
      })
    }

    const [supplier, orders] = await Promise.all([
      targetSupplierId
        ? prisma.supplier.findUnique({
            where: { id: targetSupplierId },
            select: { id: true, name: true, shortName: true, phone: true, address: true, email: true, category: true }
          })
        : null,
      prisma.order.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true,
            }
          },
          inspections: {
            select: {
              id: true,
              actNumber: true,
              inspectionDate: true,
              quantity: true,
              acceptedQuantity: true,
              rejectedQuantity: true,
              batchNumber: true
            },
            orderBy: { inspectionDate: 'desc' },
            take: 1
          }
        },
        orderBy: { expectedDate: 'desc' }
      })
    ])

    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length
    const inTransitOrders = orders.filter(o => o.status === 'IN_TRANSIT' || o.status === 'SHIPPED').length
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'ACCEPTED').length
    
    // As decided by factory management: Supplier payment is based on full delivered/incoming quantity (even if internal brak occurred)
    const totalDeliveredKg = orders
      .filter(o => o.status === 'DELIVERED' || o.status === 'ACCEPTED')
      .reduce((sum, o) => sum + (o.deliveredQuantity || o.quantity || 0), 0)

    return NextResponse.json({
      supplier,
      orders,
      metrics: {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        totalDeliveredKg
      }
    })
  } catch (error: any) {
    console.error('Supplier portal orders error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

// Supplier updates order status (e.g. In Transit / Shipped / Delivered)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, driverPhone, vehicleNumber, notes } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Buyurtma ID kerak' }, { status: 400 })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { product: true, supplier: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 })
    }

    // Security check: if supplier, ensure order belongs to them
    if (session.role === 'SUPPLIER') {
      const user = await prisma.user.findUnique({ where: { id: session.id } })
      if (user?.supplierId && existingOrder.supplierId && user.supplierId !== existingOrder.supplierId) {
        return NextResponse.json({ error: 'Bu buyurtmani o\'zgartirishga ruxsatingiz yo\'q' }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone?.trim() || null
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber?.trim() || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    if (status === 'DELIVERED' && !existingOrder.actualDeliveryTime) {
      updateData.actualDeliveryTime = new Date()
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData,
      include: { product: true }
    })

    // Broadcast update to ERP chat so warehouse and procurement teams know instantly
    try {
      const statusLabel = status === 'IN_TRANSIT' ? "YO'LGA CHIQDI (В пути 🚛)" : status === 'DELIVERED' ? "YETKAZILDI (Доставлено ✅)" : status
      const supplierTitle = existingOrder.supplier?.name || existingOrder.supplierName || "Ta'minotchi"
      const chatText = `🚚 TA'MINOTCHI XABARI (${supplierTitle}):
Buyurtma №${updated.id}: ${updated.product.name} (${updated.quantity} ${updated.unit || 'kg'})
Holat: ${statusLabel}
${driverPhone ? `Haydovchi tel: ${driverPhone}\n` : ''}${vehicleNumber ? `Mashina raqami: ${vehicleNumber}\n` : ''}${notes ? `Izoh: ${notes}` : ''}`

      // Xabarni umumiy zavod chatiga (general) emas, aynan shu ta'minotchi bilan ta'minot bo'limi shaxsiy chatiga yozish
      const targetGroupId = existingOrder.supplierId ? `supplier_${existingOrder.supplierId}` : 'kitchen_supply'

      await prisma.chatMessage.create({
        data: {
          sender: `TA'MINOTCHI (${supplierTitle})`,
          text: chatText,
          groupId: targetGroupId
        }
      })
    } catch (chatErr) {
      console.warn('Could not post supplier update to chat:', chatErr)
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error: any) {
    console.error('Update supplier order error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

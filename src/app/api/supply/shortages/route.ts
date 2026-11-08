import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { invalidateSupplyDashboardCache } from '@/lib/supplyDashboardCache'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting / Unauthorized' }, { status: 401 })
    }

    // 1. Fetch products with active batches
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        unit: true,
        minStockLevel: true,
        imageUrl: true,
        batches: {
          where: {
            qcStatus: 'APPROVED',
            quantity: { gt: 0 }
          },
          select: { quantity: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 2. Fetch suppliers
    const rawSuppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        phone: true,
        category: true,
        address: true
      },
      orderBy: { name: 'asc' }
    })

    const seenSupplierNames = new Set<string>()
    const suppliers = rawSuppliers.filter(s => {
      const k = s.name.trim().toLowerCase()
      if (seenSupplierNames.has(k)) return false
      seenSupplierNames.add(k)
      return true
    })

    // 3. Fetch all orders with product and supplier details
    const orders = await prisma.order.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            unit: true,
            minStockLevel: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            category: true
          }
        },
        inspections: {
          select: {
            id: true,
            actNumber: true,
            inspectionDate: true,
            quantity: true,
            status: true
          },
          orderBy: { inspectionDate: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 4. Fetch recent shop arrivals to compute real stock and identify supplier history
    const [arrivals, expenses] = await Promise.all([
      prisma.shopArrival.findMany({
        select: {
          nomenclature: true,
          quantity: true,
          supplier: true,
          date: true
        }
      }),
      prisma.shopExpense.findMany({
        select: {
          materials: true
        }
      })
    ])

    // Aggregate arrivals and expenses
    const arrivalTotals: Record<string, { totalKg: number; suppliers: Record<string, number> }> = {}
    for (const arr of arrivals) {
      const nom = (arr.nomenclature || '').trim().toLowerCase()
      if (!nom) continue
      if (!arrivalTotals[nom]) {
        arrivalTotals[nom] = { totalKg: 0, suppliers: {} }
      }
      const q = Number(arr.quantity) || 0
      arrivalTotals[nom].totalKg += q
      const s = (arr.supplier || '').trim() || 'Noma\'lum'
      arrivalTotals[nom].suppliers[s] = (arrivalTotals[nom].suppliers[s] || 0) + q
    }

    const expenseTotals: Record<string, number> = {}
    for (const exp of expenses) {
      const mats = (exp.materials as Record<string, any>) || {}
      for (const [mName, mQty] of Object.entries(mats)) {
        if (!mName) continue
        const k = mName.trim().toLowerCase()
        const q = typeof mQty === 'number' ? mQty : parseFloat(String(mQty)) || 0
        expenseTotals[k] = (expenseTotals[k] || 0) + q
      }
    }

    // Helper: find total stock for a product
    const getProductStock = (prodName: string, batches: { quantity: number }[]) => {
      const pLower = prodName.trim().toLowerCase()
      const arr = arrivalTotals[pLower]?.totalKg || 0
      const exp = expenseTotals[pLower] || 0
      if (arr > 0) {
        return Math.max(0, arr - exp)
      }
      return batches.reduce((sum, b) => sum + b.quantity, 0)
    }

    // Identify out-of-stock or low-stock products
    const outOfStockProducts = products
      .map(p => {
        const stock = getProductStock(p.name, p.batches)
        const min = p.minStockLevel || 1000
        const isDepleted = stock <= 0
        const isLow = stock > 0 && stock <= min * 0.5

        // Recommend top historical supplier
        const pLower = p.name.trim().toLowerCase()
        const historySup = arrivalTotals[pLower]?.suppliers || {}
        let topSupName = ''
        let maxSupQty = 0
        for (const [sName, sQty] of Object.entries(historySup)) {
          if (sQty > maxSupQty) {
            maxSupQty = sQty
            topSupName = sName
          }
        }

        const matchedSup = suppliers.find(
          s => s.name.toLowerCase() === topSupName.toLowerCase() ||
               (topSupName && s.name.toLowerCase().includes(topSupName.toLowerCase()))
        )

        return {
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category,
          unit: p.unit || 'kg',
          stock,
          minStockLevel: min,
          status: isDepleted ? 'red' : isLow ? 'yellow' : 'green',
          topSupplierName: topSupName || null,
          topSupplierId: matchedSup?.id || null
        }
      })
      .filter(p => p.status === 'red' || p.status === 'yellow')

    // Attach real stock to each order
    const enrichedOrders = orders.map(ord => {
      const pLower = (ord.product?.name || '').trim().toLowerCase()
      const currentStock = ord.product ? getProductStock(ord.product.name, []) : 0

      // Determine requisition stage
      let stage: 'PENDING_SUPPLIER' | 'DISPATCHED_TO_SUPPLIER' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' = 'PENDING_SUPPLIER'
      if (ord.status === 'CANCELLED') {
        stage = 'CANCELLED'
      } else if (ord.status === 'DELIVERED' || ord.status === 'ACCEPTED') {
        stage = 'DELIVERED'
      } else if (ord.status === 'IN_TRANSIT' || ord.status === 'SHIPPED') {
        stage = 'IN_TRANSIT'
      } else if (ord.supplierId) {
        stage = 'DISPATCHED_TO_SUPPLIER'
      } else {
        stage = 'PENDING_SUPPLIER'
      }

      return {
        ...ord,
        currentStock,
        stage
      }
    })

    const pendingRequisitionsCount = enrichedOrders.filter(o => o.stage === 'PENDING_SUPPLIER').length
    const dispatchedToSupplierCount = enrichedOrders.filter(o => o.stage === 'DISPATCHED_TO_SUPPLIER' || o.stage === 'IN_TRANSIT').length
    const deliveredCount = enrichedOrders.filter(o => o.stage === 'DELIVERED').length

    return NextResponse.json({
      requisitions: enrichedOrders,
      outOfStockProducts,
      suppliers,
      metrics: {
        pendingRequisitions: pendingRequisitionsCount,
        dispatchedToSupplier: dispatchedToSupplierCount,
        deliveredOrders: deliveredCount,
        outOfStockCount: outOfStockProducts.length
      }
    })
  } catch (error: any) {
    console.error('Shortages fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch shortages' }, { status: 500 })
  }
}

// Assign Supplier / Dispatch Purchase Order
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, supplierId, quantity, expectedDate, timeRange, price, notes } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Talabnoma (Order) ID kiritilmagan' }, { status: 400 })
    }
    if (!supplierId) {
      return NextResponse.json({ error: 'Ta\'minotchi tanlanmagan' }, { status: 400 })
    }

    const numOrderId = parseInt(orderId)
    const numSupplierId = parseInt(supplierId)

    const existingOrder = await prisma.order.findUnique({
      where: { id: numOrderId },
      include: { product: true }
    })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: numSupplierId }
    })
    if (!supplier) {
      return NextResponse.json({ error: 'Bunday ta\'minotchi mavjud emas' }, { status: 404 })
    }

    const numQty = quantity && !isNaN(parseFloat(quantity)) ? parseFloat(quantity) : existingOrder.quantity
    let parsedDate = existingOrder.expectedDate
    if (expectedDate) {
      const d = new Date(expectedDate)
      if (!isNaN(d.getTime())) parsedDate = d
    }

    const numPrice = price && !isNaN(parseFloat(price)) ? parseFloat(price) : existingOrder.price

    // Preserve warehouse requisition notes if not already set
    const originalWarehouseNotes = (existingOrder as any).warehouseNotes || (!existingOrder.supplierId ? existingOrder.notes : null)

    // Update order with assigned supplier, price, and supply notes
    const updatedOrder = await prisma.order.update({
      where: { id: numOrderId },
      data: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        quantity: numQty,
        expectedDate: parsedDate,
        timeRange: timeRange || existingOrder.timeRange || '09:00 - 12:00',
        price: numPrice,
        notes: notes !== undefined ? notes : null, // Ta'minot izohi (ta'minotchiga ketadi)
        warehouseNotes: originalWarehouseNotes,    // Sklad izohi (faqat korxona/ta'minotda qoladi)
        status: 'PENDING' // Sets status for supplier portal reception
      },
      include: {
        product: true,
        supplier: true
      }
    })

    // 1. Post notification into the Supplier's Portal Chat
    try {
      const supplierChatText = `🛒 YANGI BUYURTMA (Green Processing Ta'minot Bo'limidan):
Buyurtma №${updatedOrder.id}
Mahsulot: ${updatedOrder.product.name}
Buyurtma miqdori: ${updatedOrder.quantity.toLocaleString()} ${updatedOrder.unit || 'kg'}
Kutilayotgan kelish vaqti: ${new Date(updatedOrder.expectedDate).toLocaleDateString()} (${updatedOrder.timeRange || '09:00 - 12:00'})
${notes ? `Ta'minot izohi: ${notes}\n` : ''}Iltimos, shaxsiy kabinetingiz orqali buyurtmani qabul qiling va haydovchi/mashina ma'lumotlarini biriktiring!`

      await prisma.chatMessage.create({
        data: {
          sender: 'TA\'MINOT BO\'LIMI',
          text: supplierChatText,
          groupId: `supplier_${supplier.id}`
        }
      })
    } catch (chatErr) {
      console.warn('Failed to send supplier chat notification:', chatErr)
    }

    // 2. Post notification into Factory General Chat
    try {
      const generalChatText = `🚛 TA'MINOT BUYURTMASI BIRIKTIRILDI:
Sklad talabnomasi №${updatedOrder.id} bo'yicha "${supplier.name}" ta'minotchisiga "${updatedOrder.product.name}" (${updatedOrder.quantity} ${updatedOrder.unit || 'kg'}) buyurtma jo'natildi.
Muddati: ${new Date(updatedOrder.expectedDate).toLocaleDateString()}`

      await prisma.chatMessage.create({
        data: {
          sender: 'TIZIM (Snabjeniye)',
          text: generalChatText,
          groupId: 'general'
        }
      })
    } catch (genErr) {
      console.warn('Failed to post general chat:', genErr)
    }

    try {
      invalidateSupplyDashboardCache()
    } catch {}

    return NextResponse.json({
      success: true,
      message: `${supplier.name} ta'minotchisiga buyurtma muvaffaqiyatli jo'natildi!`,
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('Shortage dispatch error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

// Create new warehouse requisition or direct purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, supplierId, quantity, expectedDate, timeRange, price, notes } = body

    const numProductId = parseInt(productId)
    if (isNaN(numProductId)) {
      return NextResponse.json({ error: 'Mahsulot tanlanmagan' }, { status: 400 })
    }

    const numQty = parseFloat(quantity)
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ error: 'Miqdor 0 dan katta bo\'lishi shart' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: numProductId } })
    if (!product) {
      return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 })
    }

    const numSupplierId = supplierId && !isNaN(parseInt(supplierId)) ? parseInt(supplierId) : null
    let supplierName: string | null = null
    if (numSupplierId) {
      const s = await prisma.supplier.findUnique({ where: { id: numSupplierId } })
      supplierName = s?.name || null
    }

    let parsedDate = new Date(expectedDate)
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date()
      parsedDate.setDate(parsedDate.getDate() + 1)
    }

    const newOrder = await prisma.order.create({
      data: {
        productId: numProductId,
        supplierId: numSupplierId,
        supplierName,
        quantity: numQty,
        unit: product.unit || 'kg',
        expectedDate: parsedDate,
        timeRange: timeRange?.trim() || '09:00 - 12:00',
        price: price && !isNaN(parseFloat(price)) ? parseFloat(price) : null,
        notes: numSupplierId ? (notes?.trim() || null) : null,
        warehouseNotes: !numSupplierId ? (notes?.trim() || null) : (body.warehouseNotes?.trim() || null),
        status: 'PENDING'
      },
      include: {
        product: true,
        supplier: true
      }
    })

    // If a supplier was directly selected, notify their chat
    if (numSupplierId) {
      try {
        const text = `🛒 YANGI BUYURTMA (Green Processing Ta'minot Bo'limidan):
Buyurtma №${newOrder.id}
Mahsulot: ${product.name}
Buyurtma miqdori: ${numQty.toLocaleString()} ${newOrder.unit}
Yetkazib berish sanasi: ${new Date(parsedDate).toLocaleDateString()} (${timeRange || '09:00 - 12:00'})
${notes ? `Izoh: ${notes}\n` : ''}Iltimos, portalingiz orqali buyurtmani tasdiqlang!`

        await prisma.chatMessage.create({
          data: {
            sender: 'TA\'MINOT BO\'LIMI',
            text,
            groupId: `supplier_${numSupplierId}`
          }
        })
      } catch {}
    } else {
      // Requisition from warehouse awaiting supply
      try {
        const text = `🔴 OMBORDAN TALABNOMA (Mahsulot qolmadi):
Mahsulot: ${product.name}
Kerakli miqdor: ${numQty.toLocaleString()} ${newOrder.unit}
Muddati: ${new Date(parsedDate).toLocaleDateString()}
Izoh: ${notes || "Skladda zaxira tugadi, zudlik bilan ta'minotchi biriktirilsin!"}`

        await prisma.chatMessage.create({
          data: {
            sender: 'SKLAD (OMBOR)',
            text,
            groupId: 'general'
          }
        })
      } catch {}
    }

    try {
      invalidateSupplyDashboardCache()
    } catch {}

    return NextResponse.json({
      success: true,
      order: newOrder
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create shortage order error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

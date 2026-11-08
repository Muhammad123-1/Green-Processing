import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { getSupplyDashboardCache, setSupplyDashboardCache } from '@/lib/supplyDashboardCache'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forceFresh = request.nextUrl.searchParams.get('fresh') === 'true'

    // Return instant cached data when fresh
    if (!forceFresh) {
      const cached = getSupplyDashboardCache()
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'X-Cache': 'HIT',
          },
        })
      }
    }

    // 1. Parallel fetch of pruned product, supplier, order, arrival and shop expense records
    const [products, suppliers, rawOrders, arrivals, expenses] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          unit: true,
          imageUrl: true,
          minStockLevel: true,
          batches: {
            where: {
              qcStatus: 'APPROVED',
              quantity: { gt: 0 },
            },
            select: {
              quantity: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          shortName: true,
          phone: true,
          category: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          productId: true,
          supplierId: true,
          supplierName: true,
          quantity: true,
          unit: true,
          expectedDate: true,
          timeRange: true,
          actualDeliveryTime: true,
          deliveredQuantity: true,
          acceptedQuantity: true,
          rejectedQuantity: true,
          status: true,
          price: true,
          notes: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
              unit: true,
            },
          },
          inspections: {
            select: {
              id: true,
              actNumber: true,
              inspectionDate: true,
              quantity: true,
              status: true,
              conclusion: true,
            },
            orderBy: { inspectionDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopArrival.findMany({
        select: {
          id: true,
          date: true,
          nomenclature: true,
          quantity: true,
          supplier: true,
          batch: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.shopExpense.findMany({
        select: {
          materials: true,
        },
      }),
    ])

    // 2. Aggregate ShopArrival by nomenclature
    interface InflowStats {
      totalKg: number
      count: number
      lastDate: string
      suppliersMap: Record<string, number>
    }

    const arrivalStatsByNom = new Map<string, InflowStats>()
    for (let i = 0; i < arrivals.length; i++) {
      const arr = arrivals[i]
      const nom = (arr.nomenclature || '').trim()
      if (!nom) continue
      const nomLower = nom.toLowerCase()

      let qty = Number(arr.quantity) || 0
      if (qty < 0) qty = 0

      const sup = (arr.supplier || '').trim() || "Noma'lum"
      const date = (arr.date || '').trim()

      let stat = arrivalStatsByNom.get(nomLower)
      if (!stat) {
        stat = {
          totalKg: 0,
          count: 0,
          lastDate: date,
          suppliersMap: {},
        }
        arrivalStatsByNom.set(nomLower, stat)
      }

      stat.totalKg += qty
      stat.count += 1
      if (!stat.lastDate || date > stat.lastDate) {
        stat.lastDate = date
      }
      stat.suppliersMap[sup] = (stat.suppliersMap[sup] || 0) + qty
    }

    // 3. Aggregate ShopExpense by material name
    const expenseByNom = new Map<string, number>()
    for (let i = 0; i < expenses.length; i++) {
      const exp = expenses[i]
      const mats = (exp.materials as Record<string, any>) || {}
      for (const [mName, mQty] of Object.entries(mats)) {
        if (!mName) continue
        const mKey = mName.trim().toLowerCase()
        const q = typeof mQty === 'number' ? mQty : parseFloat(String(mQty)) || 0
        expenseByNom.set(mKey, (expenseByNom.get(mKey) || 0) + q)
      }
    }

    const arrivalEntries = Array.from(arrivalStatsByNom.entries())
    const expenseEntries = Array.from(expenseByNom.entries())

    // 4. Default min stock resolver helper
    const getDefaultMinStock = (name: string, category?: string | null): number => {
      const s = name.toLowerCase()
      if (s.includes('томат') || s.includes('помидор')) return 5000
      if (s.includes('айсберг') || s.includes('айзберг')) return 5000
      if (s.includes('капуста')) return 2000
      if (s.includes('лук')) return 1500
      if (s.includes('морков')) return 1000
      if (s.includes('огурц')) return 500
      if (s.includes('пакет')) return 5000
      if (s.includes('каробка') || s.includes('короб')) return 2000
      if (s.includes('этикетк')) return 2000
      if (s.includes('хлор') || s.includes('гипохлорит')) return 500
      if (s.includes('сорбат') || s.includes('бензоат')) return 100
      if (category === 'PACKAGING' || category === 'Qadoqlash & Idishlar') return 2000
      if (category === 'CHEMICALS' || category === 'Kimyoviy & Dezinfeksiya') return 200
      return 1000
    }

    // 5. Match and calculate inventory statuses for all products
    let outOfStockCount = 0
    let lowStockCount = 0
    let sufficientCount = 0
    let orderNeededCount = 0

    const inventoryStatus = products.map((product) => {
      const prodName = product.name.trim()
      const prodLower = prodName.toLowerCase()
      const words = prodLower.split(/\s+/).filter((w: string) => w.length > 2)

      // Match inflow stats
      let arrivalKg = 0
      let expenseKg = 0
      let arrivalsCount = 0
      let lastArrivalDate = ''
      const matchedSuppliers: Record<string, number> = {}

      for (let i = 0; i < arrivalEntries.length; i++) {
        const [arrNom, stat] = arrivalEntries[i]
        const isMatch =
          arrNom === prodLower ||
          arrNom.includes(prodLower) ||
          prodLower.includes(arrNom) ||
          (words.length > 0 && words.every((w: string) => arrNom.includes(w)))

        if (isMatch) {
          arrivalKg += stat.totalKg
          arrivalsCount += stat.count
          if (!lastArrivalDate || stat.lastDate > lastArrivalDate) {
            lastArrivalDate = stat.lastDate
          }
          for (const [sup, supKg] of Object.entries(stat.suppliersMap)) {
            matchedSuppliers[sup] = (matchedSuppliers[sup] || 0) + supKg
          }
        }
      }

      // Match expense
      for (let i = 0; i < expenseEntries.length; i++) {
        const [expNom, expQty] = expenseEntries[i]
        const isMatch =
          expNom === prodLower ||
          expNom.includes(prodLower) ||
          prodLower.includes(expNom) ||
          (words.length > 0 && words.every((w: string) => expNom.includes(w)))

        if (isMatch) {
          expenseKg += expQty
        }
      }

      // Real balance from arrivals - expense, plus approved legacy batches
      const legacyBatchTotal = product.batches.reduce((sum, b) => sum + b.quantity, 0)
      const realArrivalBalance = Math.max(0, arrivalKg - expenseKg)
      const totalQuantity = arrivalKg > 0 ? realArrivalBalance : legacyBatchTotal

      // Min stock & needed
      const minStock =
        product.minStockLevel && product.minStockLevel > 0
          ? product.minStockLevel
          : getDefaultMinStock(prodName, product.category)

      let neededQuantity = 0
      let status: 'red' | 'yellow' | 'green' = 'green'

      if (totalQuantity === 0) {
        status = 'red'
        outOfStockCount++
        orderNeededCount++
        neededQuantity = minStock > 0 ? minStock * 1.5 : 1000
      } else if (minStock > 0 && totalQuantity <= minStock * 0.5) {
        status = 'red'
        outOfStockCount++
        orderNeededCount++
        neededQuantity = Math.max(0, Math.round(minStock * 1.5 - totalQuantity))
      } else if (minStock > 0 && totalQuantity < minStock * 1.2) {
        status = 'yellow'
        lowStockCount++
        orderNeededCount++
        neededQuantity = Math.max(0, Math.round(minStock * 1.5 - totalQuantity))
      } else {
        status = 'green'
        sufficientCount++
      }

      // Detect Primary Supplier
      let primarySupplierName = ''
      let maxSupKg = 0
      for (const [sName, sKg] of Object.entries(matchedSuppliers)) {
        if (sKg > maxSupKg) {
          maxSupKg = sKg
          primarySupplierName = sName
        }
      }

      const matchedDbSupplier = suppliers.find(
        (s) =>
          s.name.toLowerCase() === primarySupplierName.toLowerCase() ||
          (primarySupplierName && s.name.toLowerCase().includes(primarySupplierName.toLowerCase()))
      )

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        unit: product.unit || 'kg',
        imageUrl: product.imageUrl,
        totalQuantity,
        totalArrivalKg: Math.round(arrivalKg),
        totalExpenseKg: Math.round(expenseKg),
        minStockLevel: minStock,
        neededQuantity,
        status,
        arrivalsCount,
        lastArrivalDate,
        primarySupplier: primarySupplierName || null,
        primarySupplierId: matchedDbSupplier?.id || null,
        batchesCount: product.batches.length,
      }
    })

    // 6. Fast Order Matched Arrivals Cache
    const orderMatchedArrivalsCache = new Map<string, any[]>()
    const getOrderMatchedArrivals = (pName: string) => {
      const key = (pName || '').toLowerCase().trim()
      if (orderMatchedArrivalsCache.has(key)) {
        return orderMatchedArrivalsCache.get(key)!
      }
      if (!key) {
        orderMatchedArrivalsCache.set(key, [])
        return []
      }
      const words = key.split(/\s+/).filter((w) => w.length > 2)
      const res: any[] = []
      for (let i = 0; i < arrivals.length; i++) {
        const arr = arrivals[i]
        const arrNom = (arr.nomenclature || '').toLowerCase()
        const matchesProd =
          arrNom.includes(key) ||
          key.includes(arrNom) ||
          (words.length > 0 && words.every((w) => arrNom.includes(w)))
        if (matchesProd) {
          res.push({
            id: arr.id,
            date: arr.date,
            nomenclature: arr.nomenclature,
            quantity: arr.quantity,
            supplier: arr.supplier || "Noma'lum",
            batch: arr.batch || `#${arr.id}`,
          })
          if (res.length >= 5) break
        }
      }
      orderMatchedArrivalsCache.set(key, res)
      return res
    }

    // 7. Process Orders & Delivery Reconciliation
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

      // Reconciliation info
      const latestInspection = order.inspections?.[0]
      const deliveredQty =
        order.deliveredQuantity ?? (latestInspection ? latestInspection.quantity : null)
      const acceptedQty =
        order.acceptedQuantity ?? (latestInspection?.status === 'ACCEPTED' ? latestInspection.quantity : null)
      const rejectedQty =
        order.rejectedQuantity ?? (latestInspection?.status === 'REJECTED' ? latestInspection.quantity : 0)
      const shortageQty = deliveredQty !== null ? order.quantity - deliveredQty : null

      const matchedArrivals = getOrderMatchedArrivals(order.product?.name || '')

      return {
        id: order.id,
        productId: order.productId,
        productName: order.product?.name || "Noma'lum",
        productCode: order.product?.code || '',
        productCategory: order.product?.category || '',
        productUnit: order.unit || order.product?.unit || 'kg',
        supplierId: order.supplierId,
        supplierName: order.supplierName || "Ta'minotchi ko'rsatilmagan",
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
        createdAt: order.createdAt,
        matchedArrivals,
      }
    })

    const responsePayload = {
      metrics: {
        outOfStockCount,
        lowStockCount,
        sufficientCount,
        orderNeededCount,
        pendingOrdersCount,
        todayDeliveriesCount,
        delayedOrdersCount,
        totalOrdersCount: rawOrders.length,
      },
      inventory: inventoryStatus,
      orders: processedOrders,
      suppliers,
    }

    setSupplyDashboardCache(responsePayload)

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Supply dashboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch supply dashboard data' }, { status: 500 })
  }
}

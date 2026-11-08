import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ta\'minotchi ID' }, { status: 400 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: numId },
      include: {
        users: {
          where: { role: 'SUPPLIER' },
          select: {
            id: true,
            name: true,
            username: true,
            password: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        orders: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                category: true,
              },
            },
            inspections: {
              select: {
                id: true,
                actNumber: true,
                status: true,
                quantity: true,
                acceptedQuantity: true,
                rejectedQuantity: true,
                inspectionDate: true,
                conclusion: true,
              },
              orderBy: { inspectionDate: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Ta\'minotchi topilmadi' }, { status: 404 })
    }

    // Also find arrivals for this supplier in ShopArrival
    const searchTerms = [supplier.name, supplier.shortName].filter(Boolean) as string[]
    const arrivals = await prisma.shopArrival.findMany({
      where: {
        OR: searchTerms.map((term) => ({
          supplier: { contains: term, mode: 'insensitive' },
        })),
      },
      select: {
        id: true,
        date: true,
        nomenclature: true,
        quantity: true,
        supplier: true,
        batch: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    })

    // Compute stats
    let totalDeliveredKg = 0
    let pendingCount = 0
    let inTransitCount = 0
    let deliveredCount = 0

    supplier.orders.forEach((ord) => {
      if (ord.status === 'PENDING') pendingCount++
      if (ord.status === 'IN_TRANSIT') inTransitCount++
      if (ord.status === 'DELIVERED') {
        deliveredCount++
        totalDeliveredKg += ord.deliveredQuantity || ord.acceptedQuantity || ord.quantity || 0
      }
    })

    // Sum up shopArrival deliveries as well
    const arrivalTotalKg = arrivals.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0)

    return NextResponse.json({
      supplier,
      arrivals,
      stats: {
        totalOrders: supplier.orders.length,
        pendingOrders: pendingCount,
        inTransitOrders: inTransitCount,
        deliveredOrders: deliveredCount,
        totalDeliveredKg: Math.round(totalDeliveredKg || arrivalTotalKg),
        arrivalsCount: arrivals.length,
      },
    })
  } catch (err: any) {
    console.error('Fetch supplier details error:', err)
    return NextResponse.json({ error: err.message || 'Xatolik' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        shortName: body.shortName || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        certificate: body.certificate || null,
        category: body.category || 'Xomashyo',
      },
    })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

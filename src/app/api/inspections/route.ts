import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inspections - list all
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const productId = searchParams.get('productId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { actNumber: { contains: search } },
        { batchNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
        { product: { name: { contains: search } } },
      ]
    }

    if (status) where.status = status
    if (supplierId) where.supplierId = parseInt(supplierId)
    if (productId) where.productId = parseInt(productId)

    if (dateFrom || dateTo) {
      where.inspectionDate = {}
      if (dateFrom) (where.inspectionDate as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        ;(where.inspectionDate as Record<string, Date>).lte = to
      }
    }

    const skip = (page - 1) * limit

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.inspection.count({ where }),
    ])

    return NextResponse.json({
      data: inspections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

// POST /api/inspections - create new
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate act number
    const year = new Date().getFullYear()
    const lastAct = await prisma.inspection.findFirst({
      where: { actNumber: { startsWith: `КС-${year}-` } },
      orderBy: { actNumber: 'desc' },
    })

    let nextNum = 1
    if (lastAct) {
      const parts = lastAct.actNumber.split('-')
      nextNum = parseInt(parts[parts.length - 1]) + 1
    }

    const actNumber = `КС-${year}-${String(nextNum).padStart(4, '0')}`

    const inspection = await prisma.inspection.create({
      data: {
        actNumber,
        inspectionDate: new Date(body.inspectionDate),
        supplierId: parseInt(body.supplierId),
        productId: parseInt(body.productId),
        batchNumber: body.batchNumber,
        quantity: parseFloat(body.quantity),
        quantityUnit: body.quantityUnit || 'kg',
        temperature: body.temperature ? parseFloat(body.temperature) : null,
        temperatureUnit: body.temperatureUnit || '°C',
        packaging: body.packaging || null,
        color: body.color || null,
        smell: body.smell || null,
        appearance: body.appearance || null,
        conclusion: body.conclusion || 'Muvofiq',
        status: body.status || 'ACCEPTED',
        inspector: body.inspector || null,
        inspectorId: body.inspectorId ? parseInt(body.inspectorId) : null,
        vehicleNumber: body.vehicleNumber || null,
        invoiceNumber: body.invoiceNumber || null,
        notes: body.notes || null,
        sheetName: body.sheetName || null,
        customFields: body.customFields || null,
        releasedQuantity: body.releasedQuantity !== undefined ? parseFloat(body.releasedQuantity) : null,
        releasedDate: body.releasedDate ? new Date(body.releasedDate) : null,
        images: body.uploadedImages?.length > 0 ? {
          create: body.uploadedImages.map((url: string) => ({ url }))
        } : undefined,
      },
      include: {
        supplier: true,
        product: true,
        user: true,
        images: true,
      },
    })

    // Log action
    await prisma.log.create({
      data: {
        action: 'CREATE_INSPECTION',
        entity: 'Inspection',
        entityId: inspection.id,
        details: `Akt yaratildi: ${actNumber}`,
      },
    })

    return NextResponse.json(inspection, { status: 201 })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

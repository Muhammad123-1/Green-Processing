import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const inspection = await prisma.inspection.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: true,
        product: true,
        user: true,
        images: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const inspection = await prisma.inspection.update({
      where: { id: parseInt(id) },
      data: {
        inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
        supplierId: body.supplierId ? parseInt(body.supplierId) : undefined,
        productId: body.productId ? parseInt(body.productId) : undefined,
        batchNumber: body.batchNumber,
        quantity: body.quantity ? parseFloat(body.quantity) : undefined,
        quantityUnit: body.quantityUnit,
        temperature: body.temperature ? parseFloat(body.temperature) : null,
        temperatureUnit: body.temperatureUnit,
        packaging: body.packaging,
        color: body.color,
        smell: body.smell,
        appearance: body.appearance,
        conclusion: body.conclusion,
        status: body.status,
        inspector: body.inspector,
        vehicleNumber: body.vehicleNumber,
        invoiceNumber: body.invoiceNumber,
        notes: body.notes,
        sheetName: body.sheetName,
        customFields: body.customFields,
        releasedQuantity: body.releasedQuantity !== undefined ? parseFloat(body.releasedQuantity) : undefined,
        releasedDate: body.releasedDate ? new Date(body.releasedDate) : undefined,
        ...(body.uploadedImages?.length > 0 ? {
          images: {
            create: body.uploadedImages.map((url: string) => ({ url }))
          }
        } : {})
      },
      include: {
        supplier: true,
        product: true,
        user: true,
        images: true,
      },
    })

    await prisma.log.create({
      data: {
        action: 'UPDATE_INSPECTION',
        entity: 'Inspection',
        entityId: inspection.id,
        details: `Akt tahrirlandi: ${inspection.actNumber}`,
      },
    })

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const inspection = await prisma.inspection.findUnique({
      where: { id: parseInt(id) },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.inspection.delete({
      where: { id: parseInt(id) },
    })

    await prisma.log.create({
      data: {
        action: 'DELETE_INSPECTION',
        entity: 'Inspection',
        entityId: parseInt(id),
        details: `Akt o'chirildi: ${inspection.actNumber}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 })
  }
}

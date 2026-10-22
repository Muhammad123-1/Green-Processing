import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri buyurtma ID' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.productId !== undefined && !isNaN(parseInt(body.productId))) updateData.productId = parseInt(body.productId)
    if (body.supplierId !== undefined) {
      updateData.supplierId = body.supplierId && !isNaN(parseInt(body.supplierId)) ? parseInt(body.supplierId) : null
    }
    if (body.supplierName !== undefined) updateData.supplierName = body.supplierName?.trim() || null
    if (body.quantity !== undefined && !isNaN(parseFloat(body.quantity))) updateData.quantity = parseFloat(body.quantity)
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.expectedDate !== undefined) {
      const d = new Date(body.expectedDate)
      if (!isNaN(d.getTime())) updateData.expectedDate = d
    }
    if (body.timeRange !== undefined) updateData.timeRange = body.timeRange
    if (body.price !== undefined) {
      updateData.price = body.price && !isNaN(parseFloat(body.price)) ? parseFloat(body.price) : null
    }
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.deliveredQuantity !== undefined) {
      updateData.deliveredQuantity = body.deliveredQuantity !== null && !isNaN(parseFloat(body.deliveredQuantity)) ? parseFloat(body.deliveredQuantity) : null
    }
    if (body.acceptedQuantity !== undefined) {
      updateData.acceptedQuantity = body.acceptedQuantity !== null && !isNaN(parseFloat(body.acceptedQuantity)) ? parseFloat(body.acceptedQuantity) : null
    }
    if (body.rejectedQuantity !== undefined) {
      updateData.rejectedQuantity = body.rejectedQuantity !== null && !isNaN(parseFloat(body.rejectedQuantity)) ? parseFloat(body.rejectedQuantity) : null
    }
    if (body.actualDeliveryTime !== undefined) {
      const d = new Date(body.actualDeliveryTime)
      updateData.actualDeliveryTime = !isNaN(d.getTime()) ? d : null
    }

    const order = await prisma.order.update({
      where: { id: numId },
      data: updateData,
      include: { product: true }
    })
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri buyurtma ID' }, { status: 400 })
    }

    await prisma.order.delete({
      where: { id: numId }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 500 })
  }
}

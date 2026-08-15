import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.productId !== undefined && { productId: parseInt(body.productId) }),
        ...(body.supplierId !== undefined && { supplierId: body.supplierId ? parseInt(body.supplierId) : null }),
        ...(body.supplierName !== undefined && { supplierName: body.supplierName }),
        ...(body.quantity !== undefined && { quantity: parseFloat(body.quantity) }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.expectedDate !== undefined && { expectedDate: new Date(body.expectedDate) }),
        ...(body.timeRange !== undefined && { timeRange: body.timeRange }),
        ...(body.price !== undefined && { price: body.price ? parseFloat(body.price) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.deliveredQuantity !== undefined && { deliveredQuantity: body.deliveredQuantity !== null ? parseFloat(body.deliveredQuantity) : null }),
        ...(body.acceptedQuantity !== undefined && { acceptedQuantity: body.acceptedQuantity !== null ? parseFloat(body.acceptedQuantity) : null }),
        ...(body.rejectedQuantity !== undefined && { rejectedQuantity: body.rejectedQuantity !== null ? parseFloat(body.rejectedQuantity) : null }),
        ...(body.actualDeliveryTime !== undefined && { actualDeliveryTime: body.actualDeliveryTime ? new Date(body.actualDeliveryTime) : null }),
      }
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

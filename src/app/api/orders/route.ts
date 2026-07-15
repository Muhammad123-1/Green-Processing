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
    const order = await prisma.order.create({
      data: {
        productId: parseInt(body.productId),
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        expectedDate: new Date(body.expectedDate),
        status: body.status || 'PENDING',
        price: body.price ? parseFloat(body.price) : null,
      },
      include: {
        product: true,
      }
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

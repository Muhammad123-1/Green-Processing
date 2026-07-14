import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        code: body.code || null,
        category: body.category || null,
        unit: body.unit || 'kg',
        defaultTemperature: body.defaultTemperature || null,
        minTemperature: body.minTemperature ? parseFloat(body.minTemperature) : null,
        maxTemperature: body.maxTemperature ? parseFloat(body.maxTemperature) : null,
        defaultPackaging: body.defaultPackaging || null,
        defaultConclusion: body.defaultConclusion || null,
        storageCondition: body.storageCondition || null,
        shelfLife: body.shelfLife || null,
        gost: body.gost || null,
        description: body.description || null,
      },
    })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

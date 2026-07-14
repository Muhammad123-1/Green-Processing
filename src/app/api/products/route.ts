import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        code: body.code || null,
        category: body.category || null,
        unit: body.unit || 'kg',
        defaultTemperature: body.defaultTemperature || null,
        minTemperature: body.minTemperature ? parseFloat(body.minTemperature) : null,
        maxTemperature: body.maxTemperature ? parseFloat(body.maxTemperature) : null,
        defaultPackaging: body.defaultPackaging || null,
        defaultConclusion: body.defaultConclusion || 'Muvofiq',
        storageCondition: body.storageCondition || null,
        shelfLife: body.shelfLife || null,
        gost: body.gost || null,
        description: body.description || null,
        isActive: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

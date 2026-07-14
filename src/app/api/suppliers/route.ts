import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        shortName: body.shortName || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        certificate: body.certificate || null,
        isActive: true,
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

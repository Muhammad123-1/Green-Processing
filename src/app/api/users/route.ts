import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSupplyOrAdmin = session.role === 'SUPPLY' || session.role === 'ADMIN'
    const isSupplier = session.role === 'SUPPLIER'

    let whereClause: any = {}

    if (isSupplier) {
      // Ta'minotchi xodimi faqat korxona ta'minot bo'limi (SUPPLY) va Adminni ko'radi
      whereClause = {
        role: { in: ['SUPPLY', 'ADMIN'] },
        isActive: true
      }
    } else if (!isSupplyOrAdmin) {
      // Ta'minotchi (SUPPLY) yoki Admin bo'lmagan korxona xodimlariga ta'minotchilar ko'rinmasin
      whereClause = {
        role: { not: 'SUPPLIER' },
        supplierId: null
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        name: true, 
        username: true, 
        role: true, 
        medicalClearance: true, 
        isActive: true, 
        supplierId: true,
        supplier: { select: { id: true, name: true } },
        createdAt: true 
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const existing = await prisma.user.findUnique({ where: { username: body.username } })
    if (existing) return NextResponse.json({ error: 'Bu login allaqachon mavjud' }, { status: 400 })

    const user = await prisma.user.create({
      data: {
        name: body.name,
        username: body.username,
        password: body.password, // In production: hash with bcrypt
        role: body.role || 'OPERATOR',
        supplierId: body.supplierId ? parseInt(body.supplierId) : null,
        isActive: true,
      },
      select: { 
        id: true, 
        name: true, 
        username: true, 
        role: true, 
        medicalClearance: true, 
        isActive: true, 
        supplierId: true,
        supplier: { select: { id: true, name: true } },
        createdAt: true 
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

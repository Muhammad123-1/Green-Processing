import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: true
      }
    })

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Mijozlarni yuklashda xatolik' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { name, phone, email, address, companyName, inn, status } = data

    if (!name) {
      return NextResponse.json({ error: "Mijoz ismi majburiy" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        companyName,
        inn,
        status: status || 'ACTIVE'
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Mijoz yaratishda xatolik' }, { status: 500 })
  }
}

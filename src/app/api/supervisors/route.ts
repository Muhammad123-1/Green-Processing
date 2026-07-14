import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = {}
    if (!includeInactive) where.isActive = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { position: { contains: search } },
        { phone: { contains: search } },
        { department: { contains: search } },
      ]
    }

    const supervisors = await prisma.supervisor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { inspections: true } }
      }
    })

    return NextResponse.json(supervisors)
  } catch (error) {
    console.error('Supervisors GET error:', error)
    return NextResponse.json({ error: 'Serverda xatolik' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, phone, email, department, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Ism kiritilmagan' }, { status: 400 })
    }

    const supervisor = await prisma.supervisor.create({
      data: {
        name: name.trim(),
        position: position?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        department: department?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        _count: { select: { inspections: true } }
      }
    })

    await prisma.log.create({
      data: {
        action: 'CREATE_SUPERVISOR',
        entity: 'Supervisor',
        entityId: supervisor.id,
        details: `Nazoratchi qo'shildi: ${name}`,
      },
    })

    return NextResponse.json(supervisor, { status: 201 })
  } catch (error) {
    console.error('Supervisors POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

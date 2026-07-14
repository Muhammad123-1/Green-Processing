import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: parseInt(id) },
      include: {
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 20,
          include: {
            supplier: { select: { name: true } },
            product: { select: { name: true } },
          }
        },
        _count: { select: { inspections: true } }
      }
    })

    if (!supervisor) {
      return NextResponse.json({ error: 'Nazoratchi topilmadi' }, { status: 404 })
    }

    return NextResponse.json(supervisor)
  } catch (error) {
    return NextResponse.json({ error: 'Serverda xatolik' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, position, phone, email, department, notes, isActive } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Ism kiritilmagan' }, { status: 400 })
    }

    const supervisor = await prisma.supervisor.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        position: position?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        department: department?.trim() || null,
        notes: notes?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        _count: { select: { inspections: true } }
      }
    })

    await prisma.log.create({
      data: {
        action: 'UPDATE_SUPERVISOR',
        entity: 'Supervisor',
        entityId: supervisor.id,
        details: `Nazoratchi tahrirlandi: ${name}`,
      },
    })

    return NextResponse.json(supervisor)
  } catch (error) {
    return NextResponse.json({ error: 'Serverda xatolik' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // First check if supervisor has inspections
    const count = await prisma.inspection.count({
      where: { supervisorId: parseInt(id) }
    })

    if (count > 0) {
      // Soft delete — just deactivate
      await prisma.supervisor.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      })
      return NextResponse.json({ message: `Nazoratchi nofaol qilindi (${count} ta akt bor)` })
    }

    await prisma.supervisor.delete({ where: { id: parseInt(id) } })

    await prisma.log.create({
      data: {
        action: 'DELETE_SUPERVISOR',
        entity: 'Supervisor',
        entityId: parseInt(id),
        details: `Nazoratchi o'chirildi`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Serverda xatolik' }, { status: 500 })
  }
}

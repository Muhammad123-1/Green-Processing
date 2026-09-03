import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'

type Params = { params: Promise<{ id: string }> }

// GET: shablonning barcha yozuvlarini olish
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const templateId = parseInt(id)

    const template = await prisma.customTemplate.findUnique({ where: { id: templateId } })
    if (!template) return NextResponse.json({ error: 'Shablon topilmadi' }, { status: 404 })

    const records = await prisma.customRecord.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      template: { ...template, columns: JSON.parse(template.columns) },
      records: records.map(r => ({ ...r, data: JSON.parse(r.data) }))
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// POST: yangi yozuv qo'shish
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const templateId = parseInt(id)
    const body = await req.json()

    const record = await prisma.customRecord.create({
      data: {
        templateId,
        data: JSON.stringify(body.data),
        createdBy: (session as any).name || (session as any).username || 'Admin'
      }
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Yozuv saqlashda xatolik' }, { status: 500 })
  }
}

// DELETE: shablonni o'chirish
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const templateId = parseInt(id)

    await prisma.customTemplate.delete({ where: { id: templateId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

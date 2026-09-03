import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'

// GET: barcha shablonlarni qaytarish
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const templates = await prisma.customTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { records: true } } }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// POST: Excel yuklash → shablon yaratish
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!file || !name) {
      return NextResponse.json({ error: 'Fayl va nom kiritilishi shart' }, { status: 400 })
    }

    // Excel faylini o'qish
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json({ error: 'Excel faylida varaq topilmadi' }, { status: 400 })
    }

    // Birinchi qatordan (1-row) sarlavhalarni o'qish
    const headerRow = worksheet.getRow(1)
    const columns: { key: string; label: string; type: string }[] = []

    headerRow.eachCell((cell, colNumber) => {
      const label = cell.text?.toString().trim()
      if (label) {
        columns.push({
          key: `col_${colNumber}`,
          label,
          type: 'text' // default type
        })
      }
    })

    if (columns.length === 0) {
      return NextResponse.json({ error: 'Excel faylida sarlavhalar topilmadi' }, { status: 400 })
    }

    const template = await prisma.customTemplate.create({
      data: {
        name,
        description: description || null,
        columns: JSON.stringify(columns),
        createdBy: (session as any).name || (session as any).username || 'Admin'
      }
    })

    return NextResponse.json({ ...template, columns }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Shablon yaratishda xatolik' }, { status: 500 })
  }
}

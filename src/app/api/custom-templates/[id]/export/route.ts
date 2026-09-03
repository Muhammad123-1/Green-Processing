import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'

type Params = { params: Promise<{ id: string }> }

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
      orderBy: { createdAt: 'asc' }
    })

    const columns: { key: string; label: string }[] = JSON.parse(template.columns)

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP'
    const worksheet = workbook.addWorksheet(template.name)

    // Columns
    worksheet.columns = columns.map(col => ({ header: col.label, key: col.key, width: 25 }))

    // Header row styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 28

    // Data rows
    records.forEach((record, idx) => {
      const data = JSON.parse(record.data)
      const rowData: Record<string, string> = {}
      columns.forEach(col => { rowData[col.key] = data[col.key] || '' })
      const row = worksheet.addRow(rowData)
      row.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF' }
      }
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Eksport xatosi' }, { status: 500 })
  }
}

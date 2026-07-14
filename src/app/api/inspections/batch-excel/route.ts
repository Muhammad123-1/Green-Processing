import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'

// This API analyzes the Excel template and fills ALL rows that match
// product data for batch entry (multiple inspections per sheet)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inspectionIds, sheetName } = body

    if (!inspectionIds || !Array.isArray(inspectionIds) || inspectionIds.length === 0) {
      return NextResponse.json({ error: 'No inspection IDs provided' }, { status: 400 })
    }

    const inspections = await prisma.inspection.findMany({
      where: { id: { in: inspectionIds } },
      include: { supplier: true, product: true },
      orderBy: { inspectionDate: 'asc' },
    })

    if (inspections.length === 0) {
      return NextResponse.json({ error: 'No inspections found' }, { status: 404 })
    }

    // Find template
    const templatePaths = [
      path.join(process.cwd(), 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
      path.join(process.cwd(), '..', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
      'C:\\Users\\yoqub\\OneDrive\\Desktop\\Exzel ovto\\ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx',
    ]

    let templatePath: string | null = null
    for (const p of templatePaths) {
      if (fs.existsSync(p)) { templatePath = p; break }
    }

    const workbook = new ExcelJS.Workbook()
    if (templatePath) {
      await workbook.xlsx.readFile(templatePath)
    } else {
      // Create minimal workbook
      const ws = workbook.addWorksheet('Kiruvchi xomashyo')
      ws.addRow(['Akt raqami', 'Sana', 'Ta\'minotchi', 'Mahsulot', 'Partiya', 'Miqdor', 'Harorat', 'Xulosa'])
    }

    const targetSheet = sheetName
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0]

    if (!targetSheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })
    }

    // For batch export, replace row by row in an empty data section
    // First find start row (after headers typically row 5-10)
    // We scan for {{ROW_N}} or empty rows after headers
    let dataStartRow = 2
    targetSheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = String(cell.value || '')
        if (v.includes('{{DATE}}') || v.includes('{{SANA}}') || v.includes('{{SUPPLIER}}')) {
          dataStartRow = rowNum
        }
      })
    })

    // Simple approach: duplicate template row for each inspection
    inspections.forEach((inspection, idx) => {
      const date = new Date(inspection.inspectionDate)
      const dateStr = date.toLocaleDateString('ru-RU')

      const placeholders: Record<string, string> = {
        '{{DATE}}': dateStr,
        '{{SANA}}': dateStr,
        '{{ACT_NUMBER}}': inspection.actNumber,
        '{{AKT_RAQAM}}': inspection.actNumber,
        '{{SUPPLIER}}': inspection.supplier.name,
        '{{TAMINOTCHI}}': inspection.supplier.name,
        '{{PRODUCT}}': inspection.product.name,
        '{{MAHSULOT}}': inspection.product.name,
        '{{BATCH}}': inspection.batchNumber,
        '{{PARTIYA}}': inspection.batchNumber,
        '{{QUANTITY}}': `${inspection.quantity} ${inspection.quantityUnit}`,
        '{{MIQDOR}}': `${inspection.quantity} ${inspection.quantityUnit}`,
        '{{TEMPERATURE}}': inspection.temperature != null ? `${inspection.temperature} ${inspection.temperatureUnit}` : '-',
        '{{HARORAT}}': inspection.temperature != null ? `${inspection.temperature} ${inspection.temperatureUnit}` : '-',
        '{{CONCLUSION}}': inspection.conclusion,
        '{{XULOSA}}': inspection.conclusion,
        '{{RESULT}}': inspection.status === 'ACCEPTED' ? 'Qabul qilindi' : 'Rad etildi',
        '{{INSPECTOR}}': inspection.inspector || '-',
        '{{NOTES}}': inspection.notes || '-',
        '{{N}}': String(idx + 1),
      }

      const row = targetSheet.getRow(dataStartRow + idx)
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.type === ExcelJS.ValueType.String) {
          let value = String(cell.value || '')
          for (const [ph, rep] of Object.entries(placeholders)) {
            value = value.replace(new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rep)
          }
          cell.value = value
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Batch_Aktlar_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Batch Excel error:', error)
    return NextResponse.json({ error: 'Failed to generate batch Excel' }, { status: 500 })
  }
}

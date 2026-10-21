import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim()

    const where: any = {}
    if (date && date !== 'ALL') {
      where.date = date
    }

    const logs = await (prisma as any).kitchenBrakerageLog.findMany({
      where,
      orderBy: [{ date: 'asc' }, { orderNumber: 'asc' }, { id: 'asc' }]
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Green Processing Oshxona QC'
    wb.created = new Date()

    const ws = wb.addWorksheet('Бракераж Журнали')

    // Parameters list as shown in the original template image
    const parameters = [
      { no: 1, label: 'Сана (Sana)', key: 'date' },
      { no: 2, label: '№ (Тартиб раками)', key: 'orderNumber' },
      { no: 3, label: 'Баҳоланган таом, маҳсулот номи', key: 'mealName' },
      { no: 4, label: 'Тайёрлаш вақти', key: 'prepTime' },
      { no: 5, label: 'Комиссия раиси имзоси', key: 'chairmanSign' },
      { no: 6, label: 'Комиссия аъзоси 1 имзоси', key: 'member1Sign' },
      { no: 7, label: 'Комиссия аъзоси 2 имзоси', key: 'member2Sign' },
      { no: 8, label: 'Сифат назоратчиси имзоси', key: 'qcInspectorSign' },
      { no: 9, label: 'Тиббий ходим имзоси', key: 'medicalStaffSign' },
      { no: 10, label: 'Таомнинг кўриниши (Ранг, ҳид, таъм, тузум)', key: 'organoleptic' },
      { no: 11, label: 'Ҳарорат (°C)', key: 'temperature' },
      { no: 12, label: 'Изоҳлар', key: 'notes' }
    ]

    const totalCols = Math.max(logs.length, 3)
    const lastColLetter = String.fromCharCode(66 + totalCols) // B + count

    // Column widths
    ws.getColumn(1).width = 6   // Col A: №
    ws.getColumn(2).width = 34  // Col B: Parametr nomi
    for (let c = 0; c < totalCols; c++) {
      ws.getColumn(3 + c).width = 30
    }

    // Row 1: Document Title (matching image)
    ws.mergeCells(`B1:${lastColLetter}1`)
    const titleCell = ws.getCell('B1')
    titleCell.value = 'ТАЙЁР МАХСУЛОТЛАРНИ НАЗОРАТ КИЛИШ ДЖУРНАЛИ'
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF000000' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 32

    // Row 2: Empty spacer
    ws.getRow(2).height = 8

    // Row 3: Table Header Row
    const headerRow = ws.getRow(3)
    headerRow.height = 38
    ws.getCell('A3').value = '№'
    ws.getCell('B3').value = 'Тексшириладиган корсаткихлар /\nПараметрлар'

    for (let c = 0; c < totalCols; c++) {
      const colLetter = String.fromCharCode(67 + c)
      const cell = ws.getCell(`${colLetter}3`)
      cell.value = c + 1
    }

    // Fill parameter rows 4 to 15
    parameters.forEach((param, pIdx) => {
      const rowIndex = 4 + pIdx
      const row = ws.getRow(rowIndex)
      row.height = param.no === 10 ? 64 : param.no === 3 ? 28 : 22

      // Col A: Param number
      const noCell = ws.getCell(`A${rowIndex}`)
      noCell.value = param.no

      // Col B: Param label
      const labelCell = ws.getCell(`B${rowIndex}`)
      labelCell.value = param.label

      // Col C+: Meal values
      for (let c = 0; c < totalCols; c++) {
        const colLetter = String.fromCharCode(67 + c)
        const cell = ws.getCell(`${colLetter}${rowIndex}`)
        const log = logs[c]

        if (log) {
          if (param.key === 'orderNumber') {
            cell.value = log.orderNumber || (c + 1)
          } else {
            cell.value = log[param.key as keyof typeof log] || '-'
          }
        } else {
          cell.value = ''
        }
      }
    })

    // Apply borders and styling to all cells in the table (A3:LastCol15)
    for (let r = 3; r <= 15; r++) {
      for (let c = 1; c <= 2 + totalCols; c++) {
        const cell = ws.getCell(r, c)
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF999999' } },
          left: { style: 'thin', color: { argb: 'FF999999' } },
          bottom: { style: 'thin', color: { argb: 'FF999999' } },
          right: { style: 'thin', color: { argb: 'FF999999' } }
        }

        if (r === 3) {
          cell.font = { name: 'Arial', size: 10, bold: true }
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }
          }
        } else {
          cell.font = { name: 'Arial', size: 9, bold: c === 2 }
          cell.alignment = {
            horizontal: c === 1 ? 'center' : c === 2 ? 'left' : 'left',
            vertical: 'middle',
            wrapText: true
          }
        }
      }
    }

    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Tayyor_Mahsulotlar_Nazorat_Jurnali_${date || 'barchasi'}.xlsx"`
      }
    })
  } catch (error: any) {
    console.error('Error exporting brakerage excel:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

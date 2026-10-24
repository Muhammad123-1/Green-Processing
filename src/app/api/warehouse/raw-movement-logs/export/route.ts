import { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP - Warehouse'
    workbook.created = new Date()

    let logs: any[] = []
    try {
      logs = await prisma.$queryRawUnsafe(`SELECT * FROM "RawMaterialMovementLog" ORDER BY "arrivalDate" ASC, "id" ASC`)
    } catch (e) {
      console.warn('Failed to fetch movement logs for export:', e)
    }

    const worksheet = workbook.addWorksheet('Перемещение сырья')

    // Set page setup
    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9 // A4
    }

    // Title Block
    worksheet.mergeCells('A1:L1')
    const brandRow = worksheet.getCell('A1')
    brandRow.value = 'GREEN PROCESSING'
    brandRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF15803D' } }
    brandRow.alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.mergeCells('A2:L2')
    const titleRow = worksheet.getCell('A2')
    titleRow.value = 'Журнал регистрации и перемещения основного сырья на производство'
    titleRow.font = { name: 'Calibri', size: 13, bold: true }
    titleRow.alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.addRow([]) // Row 3 empty

    // Define table columns
    worksheet.columns = [
      { key: 'orderNumber', width: 8 },
      { key: 'arrivalDate', width: 16 },
      { key: 'deliveryTime', width: 14 },
      { key: 'productName', width: 22 },
      { key: 'supplierName', width: 22 },
      { key: 'batchNumber', width: 14 },
      { key: 'receivedWeightKg', width: 16 },
      { key: 'storageTemp810', width: 12 },
      { key: 'storageTemp1700', width: 12 },
      { key: 'issuedToProduction', width: 22 },
      { key: 'returnedFromProductionKg', width: 18 },
      { key: 'endOfDayBalanceKg', width: 20 },
      { key: 'responsiblePerson', width: 22 }
    ]

    // Row 4: Main Headers
    const r4 = worksheet.getRow(4)
    r4.height = 28
    r4.values = [
      '№ п/п',
      'Дата поступления /\nХОМ АШЁ ҚАБУЛ',
      'Время поставки /\nКЕЛГАН ВАҚТИ',
      'Наименование /\nНОМИ',
      'Поставщик /\nЕТКАЗИБ БЕРУВЧИ',
      '№ ПАРТИИ /\nпартия рақами',
      'Вес / ОҒИРЛИГИ,\nКГ',
      'Температура сырья при хранении, °C',
      '',
      'Отпущено в производство /\nЦЕХГА БЕРИЛГАН, КГ',
      'Возврат из пр-ва /\nЦЕХДАН ҚАЙТГАН, КГ',
      'Остаток к концу дня /\nКУН ОХИРИДАГИ ЖАМИ',
      'ФИО Ответственного /\nЖАВОБГАР ШАХСНИ ФИШ'
    ]

    // Row 5: Sub-headers for temperature
    const r5 = worksheet.getRow(5)
    r5.height = 20
    r5.values = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '8:10',
      '17:00',
      '',
      '',
      '',
      ''
    ]

    // Merges for multi-row headers
    worksheet.mergeCells('A4:A5')
    worksheet.mergeCells('B4:B5')
    worksheet.mergeCells('C4:C5')
    worksheet.mergeCells('D4:D5')
    worksheet.mergeCells('E4:E5')
    worksheet.mergeCells('F4:F5')
    worksheet.mergeCells('G4:G5')
    worksheet.mergeCells('H4:I4') // Temp range header
    worksheet.mergeCells('J4:J5')
    worksheet.mergeCells('K4:K5')
    worksheet.mergeCells('L4:L5')
    worksheet.mergeCells('M4:M5')

    // Style Header Rows (Rows 4 & 5)
    for (let rowIdx = 4; rowIdx <= 5; rowIdx++) {
      const row = worksheet.getRow(rowIdx)
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' } // Slate 800
        }
        cell.font = {
          name: 'Calibri',
          size: 9.5,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF475569' } },
          bottom: { style: 'thin', color: { argb: 'FF475569' } },
          left: { style: 'thin', color: { argb: 'FF475569' } },
          right: { style: 'thin', color: { argb: 'FF475569' } }
        }
      })
    }

    // Populate data
    let currentRowIdx = 6
    logs.forEach((log, idx) => {
      const row = worksheet.getRow(currentRowIdx)
      row.height = 22
      row.values = [
        idx + 1,
        log.arrivalDate || '',
        log.deliveryTime || '',
        log.productName || '',
        log.supplierName || '',
        log.batchNumber || '',
        log.receivedWeightKg !== null ? log.receivedWeightKg : '',
        log.storageTemp810 !== null ? log.storageTemp810 : '',
        log.storageTemp1700 !== null ? log.storageTemp1700 : '',
        log.issuedToProduction || (log.issuedKg ? `${log.issuedKg}` : ''),
        log.returnedFromProductionKg ? log.returnedFromProductionKg : '',
        log.endOfDayBalanceKg !== null ? log.endOfDayBalanceKg : '',
        log.responsiblePerson || ''
      ]

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 2, 3, 6, 8, 9].includes(colNumber) ? 'center' : [7, 10, 11, 12].includes(colNumber) ? 'right' : 'left'
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
      })

      currentRowIdx++
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Zhurnal_peremesheniya_syrya_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export raw movement error:', error)
    return new Response(JSON.stringify({ error: 'Export failed' }), { status: 500 })
  }
}

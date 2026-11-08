import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/warehouse/export-excel
 * Exports the Inbound Raw Material QC & Reception Journal:
 * "ЖУРНАЛ ПРИЁМКИ ВХОДНОГО КОНТРОЛЯ СЫРЬЯ"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    let sql = `SELECT * FROM "ShopArrival" WHERE 1=1`
    const params: any[] = []

    if (date) {
      params.push(date)
      sql += ` AND "date" = $${params.length}`
    } else if (month) {
      params.push(`${month}%`)
      sql += ` AND "date" LIKE $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      const pIdx = params.length
      sql += ` AND ("nomenclature" ILIKE $${pIdx} OR "supplier" ILIKE $${pIdx} OR "batch" ILIKE $${pIdx} OR "ttnNumber" ILIKE $${pIdx})`
    }

    sql += ` ORDER BY "date" ASC, "id" ASC`

    const arrivals: any[] = await prisma.$queryRawUnsafe(sql, ...params)

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP - Sifat Nazorati (QC)'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Приёмка сырья (Ф-01)', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      }
    })

    // Set column keys and widths
    worksheet.columns = [
      { key: 'col1', width: 6 },   // №
      { key: 'col2', width: 18 },  // Дата и время прибытия
      { key: 'col3', width: 24 },  // Наименования сырья
      { key: 'col4', width: 24 },  // Поставщик
      { key: 'col5', width: 16 },  // Коли-во по накладной
      { key: 'col6', width: 22 },  // Фактическое кол-во (кг / ящик)
      { key: 'col7', width: 18 },  // Номер ТТН / Сертификата
      { key: 'col8', width: 14 },  // Номер партии
      { key: 'col9', width: 16 },  // Температура при доставке (°C)
      { key: 'col10', width: 26 }, // Органолептика и пригодность для ТП
      { key: 'col11', width: 18 }, // Финальное решение по качеству
      { key: 'col12', width: 22 }, // Подпись Зав. складом
      { key: 'col13', width: 20 }, // Подпись Технолога
      { key: 'col14', width: 22 }, // Подпись Спец-та по качеству
    ]

    // Row 1: Company header
    worksheet.mergeCells('A1:N1')
    const companyCell = worksheet.getCell('A1')
    companyCell.value = 'GREEN PROCESSING LLC • СИСТЕМА МЕНЕДЖМЕНТА БЕЗОПАСНОСТИ ПИЩЕВОЙ ПРОДУКЦИИ (FSSC 22000)'
    companyCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF166534' } }
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 20

    // Row 2: Document Title
    worksheet.mergeCells('A2:N2')
    const titleCell = worksheet.getCell('A2')
    titleCell.value = 'ЖУРНАЛ ПРИЁМКИ ВХОДНОГО КОНТРОЛЯ СЫРЬЯ (ФОРМА Ф-01)'
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(2).height = 28

    // Row 3: Main Headers
    const headers = [
      '№',
      'Дата и время\nприбытия',
      'Наименования\nсырья',
      'Поставщик',
      'Коли-во по\nнакладной (кг)',
      'Фактическое кол-во\n(кг / ящик)',
      'Номер ТТН /\nСертификата',
      'Номер\nпартии',
      'Температура при\nдоставке (°C)',
      'Органолептика и\nпригодность для ТП\n(Мнение Технолога)',
      'Финальное решение\nпо качеству\n(Принято / Брак)',
      'Подпись\nЗав. складом\n(Принял по кол-ву)',
      'Подпись\nТехнолога\n(Сырье пригодно)',
      'Подпись Спец-та\nпо качеству\n(Решение утверждено)',
    ]

    const headerRow = worksheet.getRow(3)
    headerRow.height = 42
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = h
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Slate 800
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      }
    })

    // Row 4: Column Numbering (GOST / Paper layout: 1, 2, 3... 14)
    const numRow = worksheet.getRow(4)
    numRow.height = 18
    for (let c = 1; c <= 14; c++) {
      const cell = numRow.getCell(c)
      cell.value = c
      cell.font = { name: 'Calibri', size: 9, italic: true, bold: true, color: { argb: 'FF475569' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      }
    }

    // Populate data rows
    arrivals.forEach((item: any, idx: number) => {
      const rowIdx = idx + 5
      const row = worksheet.getRow(rowIdx)
      row.height = 24

      // Format date and time
      const dateTimeStr = item.arrivalTime
        ? `${item.date} ${item.arrivalTime}`
        : item.date

      // Format actual quantity + boxes
      let factQtyStr = `${item.quantity ?? 0} кг`
      if (item.boxCount) {
        factQtyStr += ` / ${item.boxCount} ящ.`
      }

      const tempVal = item.temperature !== null && item.temperature !== undefined
        ? `${item.temperature}°C`
        : '-'

      const finalDecisionStr = item.finalDecision || 'Принято'

      const values = [
        idx + 1,
        dateTimeStr,
        item.nomenclature || '-',
        item.supplier || '-',
        item.invoiceQuantity ? `${item.invoiceQuantity} кг` : (item.quantity ? `${item.quantity} кг` : '-'),
        factQtyStr,
        item.ttnNumber || '-',
        item.batch || '-',
        tempVal,
        item.organoleptic || 'Соответствует ТУ/ТР',
        finalDecisionStr,
        item.warehouseSign || 'Зав. складом',
        item.technologistSign || 'Технолог',
        item.qcSign ? `${item.qcSign} (OK)` : 'Спец. по качеству'
      ]

      values.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1)
        cell.value = val
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { vertical: 'middle', horizontal: (colIdx === 2 || colIdx === 3 || colIdx === 9) ? 'left' : 'center', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }

        // Highlight temperature column (col 9)
        if (colIdx === 8) {
          if (item.temperature !== null && item.temperature !== undefined) {
            const numT = Number(item.temperature)
            if (numT >= 2.0 && numT <= 5.0) {
              // Me'yorda - yashil fon
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDCFCE7' }
              }
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF166534' } }
            } else {
              // Buzilish / Og'ish - qizil / sariq fon
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEE2E2' }
              }
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } }
            }
          }
        }

        // Highlight final decision (col 11)
        if (colIdx === 10) {
          if (finalDecisionStr.toLowerCase().includes('брак') || finalDecisionStr.toLowerCase().includes('rad')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
            cell.font = { color: { argb: 'FF991B1B' }, bold: true }
          } else {
            cell.font = { color: { argb: 'FF15803D' }, bold: true }
          }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Zhurnal_priyomki_vxodnogo_kontrolya_syrya_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel journal:', error)
    return NextResponse.json({ error: 'Excel fayl yaratishda xatolik yuz berdi' }, { status: 500 })
  }
}

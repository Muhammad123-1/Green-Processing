import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const exportType = searchParams.get('type') || 'balance'
    const tableId = searchParams.get('id') || '2026-11-25'
    const tab = searchParams.get('tab') || 'expense'
    const period = searchParams.get('period') || 'week'
    const mode = searchParams.get('mode') || 'sum'

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP'
    workbook.created = new Date()

    if (exportType === 'balance') {
      // 1. Export Daily Stock Balance Ledger Table
      const ledgerPath = path.join(process.cwd(), 'src/data/dailyStockLedger.json')
      if (!fs.existsSync(ledgerPath)) {
        return NextResponse.json({ error: 'Ledger data not found' }, { status: 404 })
      }

      const ledgerRaw = fs.readFileSync(ledgerPath, 'utf8')
      const ledger = JSON.parse(ledgerRaw)
      const tables: any[] = ledger.tables || []
      const currentTable = tables.find((t: any) => t.id === tableId) || tables.find((t: any) => t.id === '2026-11-25') || tables[0]

      if (!currentTable) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 })
      }

      const sheetTitle = (currentTable.title || 'Остатки').replace(/[:\/\\?*\[\]]/g, '_').slice(0, 31)
      const worksheet = workbook.addWorksheet(sheetTitle, {
        views: [{ showGridLines: true }]
      })

      // Column widths
      worksheet.columns = [
        { key: 'num', width: 6 },
        { key: 'name', width: 24 },
        { key: 'unit', width: 12 },
        { key: 'price', width: 14 },
        { key: 'startStock', width: 16 },
        { key: 'inflow', width: 14 },
        { key: 'outflow', width: 14 },
        { key: 'kitchen', width: 18 },
        { key: 'endStock', width: 16 },
        { key: 'weeklyAvg', width: 22 },
        { key: 'weeksRem', width: 22 },
        { key: 'sum', width: 20 },
      ]

      // Title row
      const titleRow = worksheet.addRow([currentTable.title || ''])
      titleRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } }
      titleRow.height = 24
      worksheet.addRow([]) // empty row

      // Header row
      const headers = [
        '№',
        'Наименование',
        'Единица измерения',
        'Цена',
        'Остаток',
        'Приход',
        'Расход',
        'Передача в кухню',
        'Остаток',
        'Средний расход в неделю',
        'На сколько недель хватит',
        'Сумма'
      ]
      const headerRow = worksheet.addRow(headers)
      headerRow.height = 28
      headerRow.font = { bold: true, size: 10, color: { argb: 'FF000000' } }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Exact yellow from audited Excel sheet
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })

      // Items
      const items: any[] = currentTable.items || []
      items.forEach((item, idx) => {
        const isHighlight = item.isHighlight || item.name.toLowerCase() === 'всего'
        const hasKitchen = item.kitchenTransfer !== null && item.kitchenTransfer > 0

        // Format weeks remaining cleanly (no #DIV/0!)
        let weeksVal: any = item.weeksRemaining
        if (
          weeksVal === '#DIV/0!' ||
          weeksVal === '#VALUE!' ||
          weeksVal === '-' ||
          weeksVal === null ||
          weeksVal === undefined ||
          String(weeksVal).includes('#DIV')
        ) {
          weeksVal = '-'
        } else if (typeof weeksVal === 'number') {
          weeksVal = Number(weeksVal.toFixed(2))
        }

        const row = worksheet.addRow([
          isHighlight ? '' : idx + 1,
          item.name,
          item.unit,
          item.price > 0 ? item.price : 0,
          item.startStock || 0,
          item.inflow && item.inflow > 0 ? item.inflow : '',
          item.outflow && item.outflow > 0 ? item.outflow : '',
          item.kitchenTransfer && item.kitchenTransfer > 0 ? item.kitchenTransfer : '',
          item.endStock || 0,
          item.weeklyAvg || 0,
          weeksVal,
          item.sum || 0
        ])

        row.height = 20
        row.alignment = { vertical: 'middle' }

        // Alignments & Number formats
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(4).numFmt = '#,##0.00'
        row.getCell(5).numFmt = '#,##0.00'
        if (item.inflow && item.inflow > 0) row.getCell(6).numFmt = '#,##0.00'
        if (item.outflow && item.outflow > 0) row.getCell(7).numFmt = '#,##0.00'
        if (hasKitchen) {
          row.getCell(8).numFmt = '#,##0.00'
          row.getCell(8).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF99' } // Light amber for kitchen
          }
        }
        row.getCell(9).numFmt = '#,##0.00'
        row.getCell(9).font = { bold: true }
        row.getCell(10).numFmt = '#,##0.0'
        if (typeof weeksVal === 'number') {
          row.getCell(11).numFmt = '0.00'
          row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' }
        }
        row.getCell(12).numFmt = '#,##0.00'
        row.getCell(12).font = { bold: true }

        // Row styling for 'Всего'
        if (isHighlight) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9EAD3' } // Light green
            }
            cell.font = { bold: true }
          })
        }

        // Borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: isHighlight ? 'double' : 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
          }
        })
      })

      // Grand Total Row (ИТОГО)
      const grandTotal = currentTable.grandTotalSum || 0
      const totalRow = worksheet.addRow([
        'Σ',
        'ИТОГО',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        grandTotal
      ])
      totalRow.height = 24
      totalRow.font = { bold: true, size: 11, color: { argb: 'FF000000' } }
      totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
      totalRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
      totalRow.getCell(12).numFmt = '#,##0.00'
      totalRow.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' }

      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        }
      })

      // Notes
      if (currentTable.notes && currentTable.notes.length > 0) {
        worksheet.addRow([])
        const notesHeader = worksheet.addRow(['Примечание:'])
        notesHeader.font = { bold: true, size: 10 }
        currentTable.notes.forEach((note: string) => {
          const noteRow = worksheet.addRow(['', note])
          noteRow.font = { italic: true, size: 9, color: { argb: 'FF333333' } }
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const fileName = `Информация_по_запасам_${currentTable.id}.xlsx`

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
        }
      })
    } else {
      // 2. Export Dynamics Table (Expense, GP, Waste)
      const dynPath = path.join(process.cwd(), 'src/data/directorDynamics.json')
      if (!fs.existsSync(dynPath)) {
        return NextResponse.json({ error: 'Dynamics data not found' }, { status: 404 })
      }

      const dynRaw = fs.readFileSync(dynPath, 'utf8')
      const dynData = JSON.parse(dynRaw)

      const isWeekly = period === 'week'
      const activePeriods: string[] = isWeekly && dynData.weekly?.periods
        ? dynData.weekly.periods
        : (dynData.months || []).slice(0, 10)

      let dataset: any[] = []
      let tabTitle = 'Динамика'

      if (isWeekly && dynData.weekly) {
        if (tab === 'expense') {
          dataset = mode === 'sum' ? dynData.weekly.expenseSum : dynData.weekly.expenseKg
          tabTitle = mode === 'sum' ? 'Расход со склада (сум)' : 'Расход со склада (кг)'
        } else if (tab === 'gp') {
          dataset = dynData.weekly.gpKg
          tabTitle = 'Производство ГП (кг)'
        } else if (tab === 'waste') {
          dataset = dynData.weekly.wastePercent
          tabTitle = 'Отход продукции (%)'
        }
      } else {
        if (tab === 'expense') {
          dataset = mode === 'sum' ? dynData.expenseSum : dynData.expenseKg
          tabTitle = mode === 'sum' ? 'Расход со склада (сум)' : 'Расход со склада (кг)'
        } else if (tab === 'gp') {
          dataset = dynData.gpKg
          tabTitle = 'Производство ГП (кг)'
        } else if (tab === 'waste') {
          dataset = dynData.wastePercent
          tabTitle = 'Отход продукции (%)'
        }
      }

      const worksheet = workbook.addWorksheet(tabTitle.slice(0, 31), {
        views: [{ showGridLines: true }]
      })

      // Columns
      const cols: any[] = [
        { key: 'num', width: 6 },
        { key: 'name', width: 26 },
        { key: 'unit', width: 12 }
      ]
      activePeriods.forEach((p, idx) => {
        cols.push({ key: `p_${idx}`, width: 15 })
      })
      cols.push({ key: 'total', width: 18 })
      worksheet.columns = cols

      // Title
      const titleRow = worksheet.addRow([tabTitle])
      titleRow.font = { bold: true, size: 12 }
      titleRow.height = 24
      worksheet.addRow([])

      // Header row
      const periodHeaders = isWeekly
        ? activePeriods.map((_, i) => `H-${i + 1}`)
        : activePeriods
      const headers = ['№', 'Наименование', 'Ед. изм.', ...periodHeaders, 'Итого']
      const headerRow = worksheet.addRow(headers)
      headerRow.height = 28
      headerRow.font = { bold: true, size: 10, color: { argb: 'FF000000' } }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Yellow header
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })

      // Data Rows
      dataset.forEach((item, idx) => {
        const isTotalRow = item.name.toLowerCase() === 'всего' || item.name.toLowerCase().includes('всего')
        const isGrandTotal = item.name.toLowerCase().includes('итого')
        const rawVals = isWeekly ? (item.weekly || []) : (item.monthly || []).slice(0, 10)

        const rowData = [
          isTotalRow || isGrandTotal ? '' : idx + 1,
          item.name,
          item.unit || (tab === 'waste' ? '%' : mode === 'sum' ? 'сум' : 'кг'),
          ...rawVals.map((v: any) => (v !== null && v !== undefined && !isNaN(v) ? v : '')),
          item.total !== null && item.total !== undefined ? item.total : ''
        ]

        const row = worksheet.addRow(rowData)
        row.height = 20
        row.alignment = { vertical: 'middle' }

        row.getCell(1).alignment = { horizontal: 'center' }
        row.getCell(2).alignment = { horizontal: 'left' }
        row.getCell(3).alignment = { horizontal: 'center' }

        // Formatting numbers
        for (let c = 4; c <= row.cellCount; c++) {
          const cell = row.getCell(c)
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
          if (tab === 'waste') {
            cell.numFmt = '0.0"%"'
          } else if (tab === 'expense' && mode === 'sum') {
            cell.numFmt = '#,##0'
          } else {
            cell.numFmt = '#,##0.00'
          }
        }

        // Highlight total row
        if (isTotalRow) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9EAD3' }
            }
            cell.font = { bold: true }
          })
        } else if (isGrandTotal) {
          row.eachCell((cell) => {
            cell.font = { bold: true, size: 11 }
          })
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: isTotalRow || isGrandTotal ? 'double' : 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
          }
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const fileName = `Информация_${tab}_${period}.xlsx`

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
        }
      })
    }
  } catch (err: any) {
    console.error('Excel Export Error:', err)
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'
import { formatDMY } from '@/lib/shopReport'

function inferProductUnit(name: string, dbUnit?: string): 'kg' | 'dona' | 'litr' {
  if (dbUnit) {
    const u = dbUnit.toLowerCase().trim()
    if (u === 'dona' || u === 'шт' || u === 'pcs' || u === 'quti' || u === 'korobka' || u === 'don') return 'dona'
    if (u === 'litr' || u === 'л' || u === 'l') return 'litr'
    if (u === 'kg' || u === 'кг') return 'kg'
  }

  const s = name.toLowerCase().trim()
  if (
    s.includes('пакет') ||
    s.includes('каробка') ||
    s.includes('короб') ||
    s.includes('karobka') ||
    s.includes('этикетк') ||
    s.includes('стрич') ||
    s.includes('яшик') ||
    s.includes('падон') ||
    s.includes('скотч') ||
    s.includes('перчатк') ||
    s.includes('шапка') ||
    s.includes('бахила') ||
    s.includes('маска') ||
    s.includes('халат') ||
    s.includes('бумага') ||
    s.includes('салфетк') ||
    s.includes('полотенц') ||
    s.includes('тара')
  ) {
    return 'dona'
  }

  if (s.includes('вода') || s.includes('масло') || s.includes('сироп')) {
    return 'litr'
  }

  return 'kg'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month')?.trim()

    // 1. Fetch DB Products for units
    const dbProducts = await prisma.product.findMany({
      select: { name: true, unit: true }
    })
    const prodUnitMap = new Map<string, string>()
    dbProducts.forEach((p) => {
      if (p.name) prodUnitMap.set(p.name.trim().toLowerCase(), p.unit || 'kg')
    })

    // 2. Fetch Arrivals & Expenses with optional month filter
    const arrivalWhere: any = {}
    const expenseWhere: any = {}
    if (monthParam && monthParam !== 'all' && monthParam.length >= 4) {
      arrivalWhere.date = { startsWith: monthParam }
      expenseWhere.date = { startsWith: monthParam }
    }

    const [arrivals, expenses, settings] = await Promise.all([
      prisma.shopArrival.findMany({
        where: arrivalWhere,
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
      }),
      prisma.shopExpense.findMany({
        where: expenseWhere,
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
      }),
      prisma.setting.findMany({
        where: { key: { in: ['warehouse_signature_name', 'warehouse_signature_title', 'warehouse_signature_url'] } }
      })
    ])

    const warehouseName = settings.find((s) => s.key === 'warehouse_signature_name')?.value || 'Isakov M.'
    const warehouseTitle = settings.find((s) => s.key === 'warehouse_signature_title')?.value || "Ombor mudiri / Mas'ul xodim"

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP'
    workbook.created = new Date()

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }

    // =========================================================================
    // SHEET 1: 1. Приход (Kirim qabul qilingan xomashyolar)
    // =========================================================================
    const prihodSheet = workbook.addWorksheet('1. Приход (Kirim)', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    })

    prihodSheet.addRow([
      '№',
      'Sana (Дата)',
      'Nomenklatura (Номенклатура)',
      'Miqdor (Количество)',
      'Birlik (Ед.изм)',
      'Yetkazib beruvchi (Поставщик)',
      'Partiya № (Партия)'
    ])

    const prihodHeader = prihodSheet.getRow(1)
    prihodHeader.height = 28
    prihodHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    prihodHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Professional Royal Navy
    }
    prihodHeader.alignment = { vertical: 'middle', horizontal: 'center' }

    let totalPrihodWeight = 0
    let totalPrihodDona = 0

    arrivals.forEach((a, idx) => {
      const nom = (a.nomenclature || '').trim()
      const dbU = prodUnitMap.get(nom.toLowerCase())
      const unit = inferProductUnit(nom, dbU)
      const qty = Number(a.quantity) || 0

      if (unit === 'dona') {
        totalPrihodDona += qty
      } else {
        totalPrihodWeight += qty
      }

      const row = prihodSheet.addRow([
        idx + 1,
        formatDMY(a.date),
        nom,
        qty,
        unit,
        a.supplier || '',
        a.batch || '-'
      ])

      row.height = 20
      row.alignment = { vertical: 'middle' }
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(4).numFmt = '#,##0.00'
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(7).font = { bold: true }

      for (let c = 1; c <= 7; c++) {
        row.getCell(c).border = thinBorder
      }
    })

    // Prihod Total Summary Row
    const prihodTotalRow = prihodSheet.addRow([
      'JAMI:',
      `${arrivals.length} ta yozuv`,
      `Vazn: ${(totalPrihodWeight / 1000).toFixed(2)} tn / Qadoq: ${totalPrihodDona.toLocaleString()} dona`,
      totalPrihodWeight,
      'kg',
      '',
      ''
    ])
    prihodTotalRow.height = 24
    prihodTotalRow.font = { bold: true, size: 11 }
    prihodTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    }
    for (let c = 1; c <= 7; c++) {
      prihodTotalRow.getCell(c).border = thinBorder
    }

    // Official Warehouse Signature Line
    prihodSheet.addRow([])
    const prihodSigRow = prihodSheet.addRow([
      "Mas'ul omborchi:",
      warehouseName,
      `(${warehouseTitle})`,
      'Imzo: [FSSC 22000 Elektron Tasdiqlangan]',
      '',
      'Sana:',
      new Date().toISOString().split('T')[0]
    ])
    prihodSigRow.font = { italic: true, bold: true, size: 10 }

    // =========================================================================
    // SHEET 2: 2. Расход (Ishlab chiqarishga berilgan xomashyolar)
    // =========================================================================
    const rashodSheet = workbook.addWorksheet('2. Расход (Chiqim)', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    })

    // Collect unique material keys across all expenses
    const materialKeys = new Set<string>()
    expenses.forEach((e) => {
      const mats = (e.materials || {}) as Record<string, any>
      Object.keys(mats).forEach((k) => materialKeys.add(k))
    })
    const keysArray = Array.from(materialKeys).sort()

    const rashodHeaders = ['№', 'Sana (Дата)', ...keysArray, 'Jami Sarf (kg)']
    rashodSheet.addRow(rashodHeaders)

    const rashodHeader = rashodSheet.getRow(1)
    rashodHeader.height = 28
    rashodHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    rashodHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' } // Professional Dark Rose/Red
    }
    rashodHeader.alignment = { vertical: 'middle', horizontal: 'center' }

    expenses.forEach((e, idx) => {
      const mats = (e.materials || {}) as Record<string, any>
      let daySum = 0
      const rowData: any[] = [idx + 1, formatDMY(e.date)]

      keysArray.forEach((k) => {
        const val = Number(mats[k]) || 0
        daySum += val
        rowData.push(val > 0 ? val : '')
      })
      rowData.push(daySum > 0 ? daySum : 0)

      const row = rashodSheet.addRow(rowData)
      row.height = 20
      row.alignment = { vertical: 'middle' }
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }

      // Number formatting for all material cells + day sum
      for (let c = 3; c <= rowData.length; c++) {
        const cell = row.getCell(c)
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0.00'
      }
      row.getCell(rowData.length).font = { bold: true }

      for (let c = 1; c <= rowData.length; c++) {
        row.getCell(c).border = thinBorder
      }
    })

    // Official Warehouse Signature Line
    rashodSheet.addRow([])
    const rashodSigRow = rashodSheet.addRow([
      "Sexga chiqim mas'ul xodimi:",
      warehouseName,
      `(${warehouseTitle})`,
      'Imzo: [FSSC 22000 Elektron Tasdiqlangan]',
      '',
      'Sana:',
      new Date().toISOString().split('T')[0]
    ])
    rashodSigRow.font = { italic: true, bold: true, size: 10 }

    // =========================================================================
    // SHEET 3: 3. ГП (Tayyor Mahsulot Chiqishi)
    // =========================================================================
    const gpSheet = workbook.addWorksheet('3. ГП (Tayyor mahsulot)', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    })

    gpSheet.addRow([
      '№',
      'Sana (Дата)',
      'Tayyor Mahsulot Nomi (ГП)',
      'Vazn (kg)',
      'Quti (Коробка)',
      'Dona (Шт)',
      'Izoh'
    ])

    const gpHeader = gpSheet.getRow(1)
    gpHeader.height = 28
    gpHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    gpHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' } // Professional Forest Emerald
    }
    gpHeader.alignment = { vertical: 'middle', horizontal: 'center' }

    let gpRowCounter = 0
    let totalGpWeight = 0
    let totalGpBoxes = 0
    let totalGpDona = 0

    expenses.forEach((e) => {
      const outputs = (e.outputs || {}) as Record<string, any>
      for (const [prodName, val] of Object.entries(outputs)) {
        let kg = 0
        let korobka = 0
        let dona = 0

        if (typeof val === 'object' && val !== null) {
          kg = Number((val as any).kg ?? (val as any).val) || 0
          korobka = Number((val as any).korobka) || 0
          dona = Number((val as any).dona) || 0
        } else {
          kg = Number(val) || 0
        }

        if (kg > 0 || korobka > 0 || dona > 0) {
          gpRowCounter++
          totalGpWeight += kg
          totalGpBoxes += korobka
          totalGpDona += dona

          const row = gpSheet.addRow([
            gpRowCounter,
            formatDMY(e.date),
            prodName,
            kg > 0 ? kg : '',
            korobka > 0 ? korobka : '',
            dona > 0 ? dona : '',
            (e as any).comment || e.editReason || ''
          ])

          row.height = 20
          row.alignment = { vertical: 'middle' }
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
          row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }
          row.getCell(4).numFmt = '#,##0.00'
          row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
          row.getCell(5).numFmt = '#,##0'
          row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' }
          row.getCell(6).numFmt = '#,##0'

          for (let c = 1; c <= 7; c++) {
            row.getCell(c).border = thinBorder
          }
        }
      }
    })

    // GP Total Row
    const gpTotalRow = gpSheet.addRow([
      'JAMI:',
      '',
      `Jami chiqish: ${(totalGpWeight / 1000).toFixed(2)} tn`,
      totalGpWeight,
      totalGpBoxes,
      totalGpDona,
      ''
    ])
    gpTotalRow.height = 24
    gpTotalRow.font = { bold: true, size: 11 }
    gpTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    }
    for (let c = 1; c <= 7; c++) {
      gpTotalRow.getCell(c).border = thinBorder
    }

    // =========================================================================
    // SHEET 4: 4. Svodka & Balans (Kirim, Rasxod, Qoldiq Balansi)
    // =========================================================================
    const svodkaSheet = workbook.addWorksheet('4. Balans & Svodka', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    })

    svodkaSheet.addRow([
      '№',
      'Nomenklatura (Xomashyo)',
      'O\'lchov Birligi',
      'Jami Kirim (Приход)',
      'Jami Sarf (Расход)',
      'Sof Qoldiq (Остаток)'
    ])

    const svodkaHeader = svodkaSheet.getRow(1)
    svodkaHeader.height = 28
    svodkaHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    svodkaHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD97706' } // Professional Amber/Orange
    }
    svodkaHeader.alignment = { vertical: 'middle', horizontal: 'center' }

    // Aggregate balances per nomenclature
    const balanceMap = new Map<string, { unit: string; inQty: number; outQty: number }>()

    arrivals.forEach((a) => {
      const nom = (a.nomenclature || '').trim()
      if (!nom) return
      const k = nom.toLowerCase()
      const dbU = prodUnitMap.get(k)
      const unit = inferProductUnit(nom, dbU)
      const qty = Number(a.quantity) || 0

      if (!balanceMap.has(k)) {
        balanceMap.set(k, { unit, inQty: 0, outQty: 0 })
      }
      balanceMap.get(k)!.inQty += qty
    })

    expenses.forEach((e) => {
      const mats = (e.materials || {}) as Record<string, any>
      for (const [nom, val] of Object.entries(mats)) {
        const k = nom.toLowerCase().trim()
        const qty = Number(val) || 0
        if (!balanceMap.has(k)) {
          const dbU = prodUnitMap.get(k)
          balanceMap.set(k, { unit: inferProductUnit(nom, dbU), inQty: 0, outQty: 0 })
        }
        balanceMap.get(k)!.outQty += qty
      }
    })

    let svodkaIdx = 0
    balanceMap.forEach((val, key) => {
      svodkaIdx++
      const balance = val.inQty - val.outQty
      // Capitalize first letter of nomenclature for clean presentation
      const displayName = key.charAt(0).toUpperCase() + key.slice(1)

      const row = svodkaSheet.addRow([
        svodkaIdx,
        displayName,
        val.unit,
        val.inQty,
        val.outQty,
        balance
      ])

      row.height = 20
      row.alignment = { vertical: 'middle' }
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(4).numFmt = '#,##0.00'
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(5).numFmt = '#,##0.00'
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(6).numFmt = '#,##0.00'
      row.getCell(6).font = { bold: true }

      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = thinBorder
      }
    })

    // Auto-fit column widths across all sheets
    const sheets = [prihodSheet, rashodSheet, gpSheet, svodkaSheet]
    sheets.forEach((sheet) => {
      sheet.columns.forEach((col) => {
        let maxLen = 10
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          const s = cell.value ? cell.value.toString() : ''
          if (s.length > maxLen) {
            maxLen = Math.min(s.length + 3, 50)
          }
        })
        col.width = maxLen
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const cleanPeriod = monthParam && monthParam !== 'all' ? `_${monthParam.replace('-', '_')}` : '_Barcha_Oylar'
    const downloadFilename = `Sex_Ishlab_Chiqarish_Hisoboti${cleanPeriod}.xlsx`
    const encoded = encodeURIComponent(downloadFilename)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${downloadFilename}"; filename*=UTF-8''${encoded}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}

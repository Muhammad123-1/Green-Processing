import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''
    const substance = searchParams.get('substance')?.trim() || ''
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { substanceName: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { accompanyingDoc: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { productType: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (substance && substance !== 'all') {
      where.substanceName = { equals: substance, mode: 'insensitive' }
    }

    if (dateFrom && dateTo) {
      where.arrivalDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      where.arrivalDate = { gte: dateFrom }
    } else if (dateTo) {
      where.arrivalDate = { lte: dateTo }
    }

    const acts = await prisma.disinfectionIncomingAct.findMany({
      where,
      orderBy: [{ arrivalDate: 'asc' }, { id: 'asc' }]
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('ДЕЗСРЕДСТВА И МОЮЩИЕ', {
      views: [{ showGridLines: true }]
    })

    // Title Row
    sheet.mergeCells('H5:M5')
    const titleCell = sheet.getCell('H5')
    titleCell.value = 'Журнал регистрации поступления моющих и дезинфицирующих средств'
    titleCell.font = { name: 'Times New Roman', size: 14, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Form Code Row
    sheet.mergeCells('K6:L6')
    const formCell = sheet.getCell('K6')
    formCell.value = 'Ф-2/05'
    formCell.font = { name: 'Times New Roman', size: 12, bold: true }
    formCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Headers Row 8 & 9
    const headerCols = [
      { key: 'orderNumber', title: '№\nп/п', sub: '1', width: 6 },
      { key: 'arrivalDate', title: 'ДАТА\nПОСТУПЛЕНИЯ', sub: '2', width: 14 },
      { key: 'substanceName', title: 'Наименование\nсредства', sub: '3', width: 28 },
      { key: 'productType', title: 'Вид\nизделия', sub: '4', width: 18 },
      { key: 'supplierName', title: 'Поставщик', sub: '5', width: 26 },
      { key: 'batchNumber', title: '№\nпартии', sub: '6', width: 10 },
      { key: 'accompanyingDoc', title: 'Сопровождающий\nдокумент', sub: '7', width: 22 },
      { key: 'activeChlorinePercent', title: 'Содержание\nактивного\nхлора, в %', sub: '8', width: 14 },
      { key: 'quantityReceived', title: 'Поступило\n(кг)', sub: '9', width: 12 },
      { key: 'manufactureDate', title: 'Дата\nизготовления', sub: '10', width: 14 },
      { key: 'expiryDate', title: 'Годен\nдо', sub: '11', width: 14 },
      { key: 'transportCondition', title: 'Оценка условий\nтранспортирования', sub: '12', width: 20 },
      { key: 'accessPermit', title: 'Допуск', sub: '13', width: 14 },
      { key: 'releasedKg', title: 'Отпущено\nв пр-во: кг', sub: '14', width: 12 },
      { key: 'releasedDate', title: 'Отпущено\nв пр-во: Дата', sub: '15', width: 14 },
      { key: 'inspectorName', title: 'ФИО, Подпись\nответственного', sub: '16', width: 22 },
      { key: 'pricePerKg', title: 'цена\nкг\\шт', sub: '17', width: 12 },
    ]

    headerCols.forEach((col, index) => {
      const colNum = index + 1
      sheet.getColumn(colNum).width = col.width

      const hCell = sheet.getCell(8, colNum)
      hCell.value = col.title
      hCell.font = { name: 'Times New Roman', size: 10, bold: true }
      hCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      hCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      }
      hCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      const subCell = sheet.getCell(9, colNum)
      subCell.value = col.sub
      subCell.font = { name: 'Times New Roman', size: 9, italic: true }
      subCell.alignment = { horizontal: 'center', vertical: 'middle' }
      subCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      }
      subCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    sheet.getRow(8).height = 42
    sheet.getRow(9).height = 18

    // Data Rows
    let currentRow = 10
    acts.forEach((act, idx) => {
      const row = sheet.getRow(currentRow)
      row.height = 24

      const values = [
        act.orderNumber || idx + 1,
        act.arrivalDate || '',
        act.substanceName || '',
        act.productType || '',
        act.supplierName || '',
        act.batchNumber || '',
        act.accompanyingDoc || act.registrationCert || '',
        act.activeChlorinePercent !== null ? act.activeChlorinePercent : '',
        act.quantityReceived !== null ? act.quantityReceived : '',
        act.manufactureDate || '',
        act.expiryDate || '',
        act.transportCondition || '',
        act.accessPermit || '',
        act.releasedKg !== null ? act.releasedKg : '',
        act.releasedDate || '',
        act.inspectorName || '',
        act.pricePerKg !== null ? act.pricePerKg : ''
      ]

      values.forEach((val, i) => {
        const cell = row.getCell(i + 1)
        cell.value = val
        cell.font = { name: 'Times New Roman', size: 10 }
        cell.alignment = {
          vertical: 'middle',
          horizontal: [0, 1, 5, 7, 8, 9, 10, 12, 13, 14, 16].includes(i) ? 'center' : 'left',
          wrapText: true
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      currentRow++
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Dezinfeksiya_va_yuvish_vositalari_F-2-05_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Export jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

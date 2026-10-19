import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const arrivals = await prisma.shopArrival.findMany({ orderBy: { date: 'asc' } })
    const expenses = await prisma.shopExpense.findMany({ orderBy: { date: 'asc' } })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing'
    workbook.created = new Date()

    // Arrivals Sheet
    const prihodSheet = workbook.addWorksheet('Приход')
    prihodSheet.addRow(['Дата', 'Номенклатура', 'Количество', 'Поставщик'])
    prihodSheet.getRow(1).font = { bold: true }
    
    arrivals.forEach(a => {
      prihodSheet.addRow([a.date, a.nomenclature, a.quantity, a.supplier])
    })

    // Expenses Sheet
    const rashodSheet = workbook.addWorksheet('Расход')
    
    // Collect all unique material keys
    const materialKeys = new Set<string>()
    expenses.forEach(e => {
      const mats = e.materials as Record<string, number>
      Object.keys(mats).forEach(k => materialKeys.add(k))
    })
    const keysArray = Array.from(materialKeys)

    const header = ['Число', ...keysArray]
    rashodSheet.addRow(header)
    rashodSheet.getRow(1).font = { bold: true }

    expenses.forEach(e => {
      const mats = e.materials as Record<string, number>
      const row = [e.date]
      keysArray.forEach(k => {
        row.push(mats[k]?.toString() || '')
      })
      rashodSheet.addRow(row)
    })

    // GP (Finished Goods) Sheet
    const gpSheet = workbook.addWorksheet('ГП')
    const gpFields = [
      { field: 'iceberg', label: 'Айсберг' },
      { field: 'tomatoes', label: 'ТОМАТЫ' },
      { field: 'onion', label: 'Лук' },
      { field: 'coleslaw', label: 'Коул Слоу' },
      { field: 'lemon', label: 'Лимон' },
      { field: 'cucumbers', label: 'Огурцы свежие' },
      { field: 'mixSalad', label: 'Микс салат' },
      { field: 'mint', label: 'Мята' },
      { field: 'celery', label: 'Сельдерей' },
      { field: 'icebergLeaf', label: 'Айсберг (листовой)' },
    ]
    const gpHeader = ['Дата', ...gpFields.map((f) => f.label)]
    gpSheet.addRow(gpHeader)
    gpSheet.getRow(1).font = { bold: true }

    expenses.forEach((e) => {
      const outputs = (e.outputs || {}) as Record<string, any>
      const hasAnyGP = Object.keys(outputs).length > 0
      if (hasAnyGP) {
        const row = [e.date]
        gpFields.forEach((f) => {
          let val = 0
          for (const [k, v] of Object.entries(outputs)) {
            const num = typeof v === 'object' && v !== null ? Number((v as any).kg ?? (v as any).val) : Number(v)
            if (k.toLowerCase().includes(f.label.toLowerCase())) {
              val = num || 0
              break
            }
          }
          row.push(val > 0 ? (val as any) : '')
        })
        gpSheet.addRow(row)
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    const filename = encodeURIComponent('Производственный_отчет_Экспорт.xlsx')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="shop_report.xlsx"; filename*=UTF-8''${filename}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}

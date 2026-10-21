import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim() || new Date().toISOString().slice(0, 10)
    const category = searchParams.get('category')?.trim()
    const lang = searchParams.get('lang')?.trim() || 'uz'

    const where: any = {}
    if (date) where.date = date
    if (category && category !== 'ALL') where.category = category

    const tasks = await prisma.kitchenTaskLog.findMany({
      where,
      orderBy: [{ timeFrom: 'asc' }, { id: 'asc' }]
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Green Processing Kitchen QC'
    wb.created = new Date()

    const ws = wb.addWorksheet(
      lang === 'ru' ? 'Контроль кухни' : lang === 'en' ? 'Kitchen Log' : 'Oshxona nazorati'
    )

    // Column widths
    ws.columns = [
      { width: 6 }, // A: №
      { width: 14 }, // B: Sana
      { width: 22 }, // C: Xodim F.I.O.
      { width: 20 }, // D: Lavozimi
      { width: 16 }, // E: Ish vaqti
      { width: 16 }, // F: Toifa
      { width: 26 }, // G: Qilingan ish nomi
      { width: 32 }, // H: Batafsil tavsif
      { width: 12 }, // I: Porsiya
      { width: 36 }, // J: Ishlatilgan masalliqlar
      { width: 22 }, // K: Tozalash joyi & vosita
      { width: 16 }, // L: Holat
      { width: 24 } // M: Direktor xulosasi
    ]

    // Title Row
    ws.mergeCells('A1:M2')
    const titleCell = ws.getCell('A1')
    titleCell.value =
      lang === 'ru'
        ? `ООО "GREEN PROCESSING" — СУТОЧНЫЙ ЖУРНАЛ КОНТРОЛЯ И ДЕЯТЕЛЬНОСТИ КУХНИ (${date})`
        : `"GREEN PROCESSING" MChJ — OSHXONA XODIMLARI KUNLIK ISH VA FOTO-NAZORAT HISOBOTI (${date})`
    titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2410C' } } // Orange-700
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // Headers
    const headers = [
      '№',
      lang === 'ru' ? 'Дата' : 'Sana',
      lang === 'ru' ? 'Ф.И.О. сотрудника' : 'Xodim F.I.O.',
      lang === 'ru' ? 'Должность' : 'Lavozimi',
      lang === 'ru' ? 'Время работы' : 'Ish vaqti',
      lang === 'ru' ? 'Категория' : 'Toifa',
      lang === 'ru' ? 'Наименование работы' : 'Qilingan ish nomi',
      lang === 'ru' ? 'Описание / Детали' : 'Batafsil tavsif',
      lang === 'ru' ? 'Порции' : 'Porsiya',
      lang === 'ru' ? 'Использованные продукты' : 'Ishlatilgan masalliqlar',
      lang === 'ru' ? 'Зона уборки / Средство' : 'Tozalangan joy & vosita',
      lang === 'ru' ? 'Статус' : 'Holat',
      lang === 'ru' ? 'Заключение Директора' : 'Direktor xulosasi'
    ]

    const headerRow = ws.getRow(4)
    headerRow.height = 28
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF64748B' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF64748B' } },
        right: { style: 'thin', color: { argb: 'FF64748B' } }
      }
    })

    // Data Rows
    tasks.forEach((t, idx) => {
      const row = ws.getRow(5 + idx)
      row.height = 26

      let itemsStr = ''
      try {
        const parsed = JSON.parse(t.itemsUsed || '[]')
        if (Array.isArray(parsed) && parsed.length > 0) {
          itemsStr = parsed
            .map((it: any) => `${it.name}: ${it.qty} ${it.unit || 'kg'}`)
            .join('; ')
        }
      } catch {
        itemsStr = t.itemsUsed || ''
      }

      const cleaningStr = [t.cleaningArea, t.cleaningAgent ? `(${t.cleaningAgent})` : '']
        .filter(Boolean)
        .join(' ')

      const catLabel =
        t.category === 'MEAL'
          ? '🍲 Taom'
          : t.category === 'SALAD'
          ? '🥗 Salat'
          : t.category === 'CLEANING'
          ? '🧹 Tozalash'
          : t.category === 'PREP'
          ? '🥩 Ishlov'
          : t.category === 'BAKERY'
          ? '🍞 Nonvoylik'
          : '📝 Boshqa'

      row.getCell(1).value = idx + 1
      row.getCell(2).value = t.date
      row.getCell(3).value = t.staffName
      row.getCell(4).value = t.staffRole
      row.getCell(5).value = `${t.timeFrom} - ${t.timeTo} (${t.shift})`
      row.getCell(6).value = catLabel
      row.getCell(7).value = t.title
      row.getCell(8).value = t.description || '-'
      row.getCell(9).value = t.servings || '-'
      row.getCell(10).value = itemsStr || '-'
      row.getCell(11).value = cleaningStr || '-'
      row.getCell(12).value =
        t.status === 'APPROVED'
          ? '✅ Tasdiqlandi'
          : t.status === 'REJECTED'
          ? '⚠️ E\'tiroz bor'
          : '⏳ Kutilmoqda'
      row.getCell(13).value = [t.reviewedBy, t.reviewComment].filter(Boolean).join(': ') || '-'

      for (let c = 1; c <= 13; c++) {
        const cell = row.getCell(c)
        cell.font = { size: 9, name: 'Calibri' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }

        if (c === 1 || c === 2 || c === 5 || c === 6 || c === 9 || c === 12) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }

        if (t.status === 'APPROVED' && c === 12) {
          cell.font = { bold: true, color: { argb: 'FF065F46' } }
        } else if (t.status === 'REJECTED' && c === 12) {
          cell.font = { bold: true, color: { argb: 'FF991B1B' } }
        }
      }
    })

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="oshxona_nazorat_${date}.xlsx"`
      }
    })
  } catch (error: any) {
    console.error('Kitchen tasks export error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

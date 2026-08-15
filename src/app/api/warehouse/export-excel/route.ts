import { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Green Processing ERP - Warehouse'
    workbook.created = new Date()

    let logs: any[] = []
    if ((prisma as any).temperatureLog?.findMany) {
      try {
        logs = await (prisma as any).temperatureLog.findMany({
          orderBy: [{ date: 'asc' }, { time: 'asc' }]
        })
      } catch {}
    }
    if (!logs || logs.length === 0) {
      try {
        logs = await prisma.$queryRawUnsafe(`SELECT * FROM "TemperatureLog" ORDER BY "date" ASC, "time" ASC`)
      } catch {}
    }

    const worksheet = workbook.addWorksheet('Температурный режим')

    worksheet.columns = [
      { header: 'Дата / Сана', key: 'date', width: 16 },
      { header: 'Время / Вақт', key: 'time', width: 14 },
      { header: 'Салат Айсберг (°C)', key: 'icebergTemp', width: 22 },
      { header: 'Лук белый (°C)', key: 'onionTemp', width: 18 },
      { header: 'Томаты (°C)', key: 'tomatoTemp', width: 16 },
      { header: 'Морковь (°C)', key: 'carrotTemp', width: 16 },
      { header: 'Капуста белокочанная (°C)', key: 'cabbageTemp', width: 26 },
      { header: 'Отклонения / Выход из нормы', key: 'deviation', width: 30 },
      { header: 'Корректирующие действия', key: 'correctiveAction', width: 30 },
      { header: 'Ответственный (ФИО)', key: 'responsible', width: 24 },
    ]

    const headerRow = worksheet.getRow(1)
    headerRow.height = 32
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B4332' }, // Dark green from user image
      }
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'medium', color: { argb: 'FF0F281E' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })

    logs.forEach((log) => {
      const row = worksheet.addRow({
        date: log.date,
        time: log.time,
        icebergTemp: log.icebergTemp ?? '-',
        onionTemp: log.onionTemp ?? '-',
        tomatoTemp: log.tomatoTemp ?? '-',
        carrotTemp: log.carrotTemp ?? '-',
        cabbageTemp: log.cabbageTemp ?? '-',
        deviation: log.deviation || 'Норма',
        correctiveAction: log.correctiveAction || '-',
        responsible: log.responsible || '-',
      })

      row.height = 24
      const isAlert = log.deviation && (log.deviation.includes('Нарушени') || log.deviation.includes('ВНИМАНИЕ') || log.deviation.includes('Buzilish'))

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = { name: 'Calibri', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }

        if (isAlert && colNumber === 8) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE4E6' },
          }
          cell.font = { color: { argb: 'FFBE123C' }, bold: true }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const uint8Array = new Uint8Array(buffer as ArrayBuffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Temperaturniy_rejim_sklad_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting Warehouse Excel:', error)
    return new Response(JSON.stringify({ error: 'Excel eksport qilishda xatolik' }), { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    let inspection = await prisma.inspection.findUnique({
      where: { id: numId },
      include: {
        supplier: true,
        product: true,
        user: true,
      },
    })

    if (!inspection) {
      const act = await prisma.incomingRawMaterialAct.findUnique({
        where: { id: numId }
      })
      if (act) {
        let dateIso = act.createdAt.toISOString()
        if (act.actDate) {
          if (act.actDate.includes('.')) {
            const p = act.actDate.split('.')
            if (p.length === 3) dateIso = new Date(`${p[2]}-${p[1]}-${p[0]}`).toISOString()
          } else {
            const d = new Date(act.actDate)
            if (!isNaN(d.getTime())) dateIso = d.toISOString()
          }
        }

        const st = act.decisionRating === 2 ? 'REJECTED' : act.decisionRating === 3 ? 'CONDITIONAL' : 'ACCEPTED'

        inspection = {
          id: act.id,
          actNumber: act.actNumber ? (act.actNumber.startsWith('№') ? act.actNumber : `№ ${act.actNumber}`) : `№ ${act.id}`,
          inspectionDate: new Date(dateIso),
          batchNumber: act.batchNumber || `LOT-${act.id}`,
          quantity: act.warehouseKg || 0,
          quantityUnit: 'kg',
          temperature: parseFloat((act.temperature || '').replace(',', '.')) || null,
          temperatureUnit: '°C',
          packaging: act.transportCondition === 1 ? 'Qoniqarli' : 'Qoniqarsiz',
          color: act.leafColor === 1 ? 'Muvofiq' : 'Nomaqbul',
          smell: act.tasteSmell === 1 ? 'Muvofiq' : 'Nomaqbul',
          appearance: act.structure === 1 ? 'Muvofiq' : 'Nomaqbul',
          status: st,
          inspector: act.inspectorName || 'Sifat Nazoratchisi',
          conclusion: act.decisionText || (act.decisionRating === 2 ? 'Rad etilgan' : 'Muvofiq'),
          notes: act.notes || null,
          sheetName: act.productName,
          supplier: { name: act.supplierName || 'Ta\'minotchi' },
          product: { name: act.productName || 'Xomashyo' },
          user: { name: act.inspectorName || 'Sifat Nazoratchisi' },
        } as any
      }
    }

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    return generateInspectionExcel(inspection)
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}

async function generateInspectionExcel(inspection: any) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Green Processing ERP'
  workbook.lastModifiedBy = 'Green Processing Sifat Nazorati'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet(`Akt_${inspection.actNumber || inspection.id}`)

  const isAccepted = inspection.status === 'ACCEPTED'
  const isRejected = inspection.status === 'REJECTED'

  const date = new Date(inspection.inspectionDate)
  const dateFormatted = date.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  // Title
  worksheet.mergeCells('A1:D1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'KIRUVCHI XOMASHYO SIFAT NAZORATI DALOLATNOMASI'
  titleCell.font = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: isAccepted ? 'FF15803D' : (isRejected ? 'FFB91C1C' : 'FFB45309') }
  }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 36

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  }

  const fields: [string, any][] = [
    ['Akt raqami:', inspection.actNumber || `ACT-${inspection.id.toString().padStart(4, '0')}`],
    ['Sana:', dateFormatted],
    ['Ta\'minotchi (Yetkazib beruvchi):', inspection.supplier?.name || '-'],
    ['Mahsulot nomi:', inspection.product?.name || inspection.sheetName || '-'],
    ['Partiya raqami:', inspection.batchNumber || '-'],
    ['Miqdor (Hajmi):', `${inspection.quantity} ${inspection.quantityUnit || 'kg'}`],
    ['O\'lchangan harorat:', inspection.temperature != null ? `${inspection.temperature} ${inspection.temperatureUnit || '°C'}` : '-'],
    ['Qadoqlash holati:', inspection.packaging || 'Qoniqarli'],
    ['Rang ko\'rsatkichi:', inspection.color || '-'],
    ['Hid va ta\'m:', inspection.smell || '-'],
    ['Tashqi ko\'rinishi:', inspection.appearance || '-'],
    ['Qabul holati (Status):', isAccepted ? 'QABUL QILINDI' : (isRejected ? 'RAD ETILDI (BRAK)' : 'SHARTLI QABUL')],
    ['Tekshiruvchi inspektor:', inspection.inspector || inspection.user?.name || '-'],
    ['Sifat xulosasi:', inspection.conclusion || '-'],
    ['Qo\'shimcha izoh va qaydlar:', inspection.notes || '-'],
  ]

  fields.forEach(([label, value], index) => {
    const rowNum = index + 3
    const row = worksheet.getRow(rowNum)
    row.height = 24

    const c1 = row.getCell(1)
    c1.value = label
    c1.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF374151' } }
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    c1.border = thinBorder
    c1.alignment = { vertical: 'middle' }

    worksheet.mergeCells(`B${rowNum}:D${rowNum}`)
    const c2 = row.getCell(2)
    c2.value = value
    c2.font = { name: 'Calibri', size: 10 }
    c2.border = thinBorder
    c2.alignment = { vertical: 'middle' }

    if (label.includes('Status')) {
      c2.font = { name: 'Calibri', bold: true, size: 11, color: { argb: isAccepted ? 'FF166534' : (isRejected ? 'FF991B1B' : 'FF92400E') } }
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAccepted ? 'FFDCFCE7' : (isRejected ? 'FFFEE2E2' : 'FFFEF3C7') } }
    }
  })

  worksheet.getColumn(1).width = 30
  worksheet.getColumn(2).width = 25
  worksheet.getColumn(3).width = 25
  worksheet.getColumn(4).width = 25

  const buffer = await workbook.xlsx.writeBuffer()
  const actName = (inspection.actNumber || `ACT-${inspection.id}`).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `Akt_${actName}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

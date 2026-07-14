import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { SHEET_CONFIGS } from '@/lib/sheetConfigs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const inspection = await prisma.inspection.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: true,
        product: true,
        user: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Template path - use the original Excel file
    const templatePaths = [
      path.join(process.cwd(), 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
      path.join(process.cwd(), '..', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx'),
    ]

    let templatePath: string | null = null
    for (const p of templatePaths) {
      if (fs.existsSync(p)) {
        templatePath = p
        break
      }
    }

    if (!templatePath) {
      return generateSimpleExcel(inspection)
    }

    // Load the original template
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    // Clean sheet name
    let sheetNameStr = inspection.product?.name || inspection.sheetName || 'Sheet1';
    sheetNameStr = sheetNameStr.substring(0, 31).replace(/[\[\]\*\/\\\?]/g, '');

    let worksheet = workbook.getWorksheet(sheetNameStr);
    
    // If doesn't exist, create it from the first sheet
    if (!worksheet) {
      const modelSheet = workbook.worksheets[0];
      const newWs = workbook.addWorksheet(sheetNameStr);
      worksheet = newWs;
      
      modelSheet.columns.forEach((col, i) => {
        newWs.getColumn(i + 1).width = col.width;
      });

      for (let i = 1; i <= 2; i++) {
        const srcRow = modelSheet.getRow(i);
        const destRow = newWs.getRow(i);
        srcRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const newCell = destRow.getCell(colNumber);
          newCell.value = cell.value;
          newCell.style = cell.style;
        });
        destRow.height = srcRow.height;
      }
    }

    // Keep ONLY this newly selected/created worksheet to keep the file clean
    const allWorksheets = workbook.worksheets;
    for (const ws of allWorksheets) {
      if (ws.id !== worksheet.id) {
        workbook.removeWorksheet(ws.id);
      }
    }

    const date = new Date(inspection.inspectionDate);
    const dateFormatted = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Find the first empty row
    let targetRow = 3;
    while (worksheet.getCell(targetRow, 2).value) {
      targetRow++;
    }

    const row = worksheet.getRow(targetRow);
    const config = SHEET_CONFIGS[worksheet.name];

    if (config) {
      // Map standard fields based on config
      Object.entries(config.standardFields).forEach(([colStr, fieldName]) => {
        const col = parseInt(colStr);
        let value: any = '-';
        switch (fieldName) {
          case 'auto-number': value = targetRow - 2; break;
          case 'date': value = dateFormatted; break;
          case 'productName': value = inspection.product.name; break;
          case 'supplierName': value = inspection.supplier.name; break;
          case 'temperature': value = inspection.temperature != null ? inspection.temperature : '-'; break;
          case 'packagingCondition': value = inspection.packaging || 'удовлетворительно'; break;
          case 'certificate': value = inspection.supplier.certificate || '-'; break;
          case 'batchNumber': value = inspection.batchNumber; break;
          case 'statusText': value = inspection.status === 'ACCEPTED' ? 'допущено' : (inspection.status === 'REJECTED' ? 'брак' : 'условно'); break;
          case 'quantitySklad': value = inspection.status === 'ACCEPTED' ? inspection.quantity : '-'; break;
          case 'quantityTseh': value = '-'; break;
          case 'rejectActNumber': value = inspection.status !== 'ACCEPTED' ? (inspection.invoiceNumber || 'Акт забраковки') : '-'; break;
          case 'rejectDate': value = inspection.status !== 'ACCEPTED' ? dateFormatted : '-'; break;
          case 'inspector': value = inspection.inspector || '-'; break;
          case 'gost': value = inspection.product.gost || '-'; break;
          case 'quantity': value = inspection.quantity; break;
        }
        row.getCell(col).value = value;
      });

      // Map custom fields
      let parsedCustomFields: Record<string, string> = {};
      try {
        if (inspection.customFields) parsedCustomFields = JSON.parse(inspection.customFields);
      } catch (e) {}

      config.customFields.forEach(cf => {
        row.getCell(cf.col).value = parsedCustomFields[cf.key] || cf.default;
      });
    }

    row.commit();

    // Save to buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `Akt_${inspection.actNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_${dateFormatted.replace(/\./g, '-')}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}

async function generateSimpleExcel(inspection: {
  id: number
  actNumber: string
  inspectionDate: Date | string
  batchNumber: string
  quantity: number
  quantityUnit: string
  temperature: number | null
  temperatureUnit: string
  packaging: string | null
  color: string | null
  smell: string | null
  appearance: string | null
  conclusion: string
  status: string
  inspector: string | null
  vehicleNumber: string | null
  invoiceNumber: string | null
  notes: string | null
  supplier: { name: string }
  product: { name: string }
}) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Akt')

  const date = new Date(inspection.inspectionDate)
  const dateFormatted = date.toLocaleDateString('ru-RU')

  worksheet.mergeCells('A1:F1')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'KIRUVCHI XOM ASHYO QABUL QILISH AKTI'
  headerCell.font = { bold: true, size: 14 }
  headerCell.alignment = { horizontal: 'center' }

  const fields = [
    ['Akt raqami:', inspection.actNumber],
    ['Sana:', dateFormatted],
    ['Ta\'minotchi:', inspection.supplier.name],
    ['Mahsulot:', inspection.product.name],
    ['Partiya raqami:', inspection.batchNumber],
    ['Miqdor:', `${inspection.quantity} ${inspection.quantityUnit}`],
    ['Harorat:', inspection.temperature != null ? `${inspection.temperature} ${inspection.temperatureUnit}` : '-'],
    ['Qadoqlash:', inspection.packaging || '-'],
    ['Rang:', inspection.color || '-'],
    ['Hid:', inspection.smell || '-'],
    ['Ko\'rinish:', inspection.appearance || '-'],
    ['Xulosa:', inspection.conclusion],
    ['Natija:', inspection.status === 'ACCEPTED' ? 'Qabul qilindi' : 'Rad etildi'],
    ['Nazoratchi:', inspection.inspector || '-'],
    ['Izoh:', inspection.notes || '-'],
  ]

  fields.forEach(([label, value], index) => {
    const row = worksheet.getRow(index + 3)
    row.getCell(1).value = label
    row.getCell(1).font = { bold: true }
    row.getCell(2).value = value
    row.height = 20
  })

  worksheet.getColumn(1).width = 25
  worksheet.getColumn(2).width = 50

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `Akt_${inspection.actNumber}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}

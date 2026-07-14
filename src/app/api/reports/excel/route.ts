import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { SHEET_CONFIGS } from '@/lib/sheetConfigs'

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      orderBy: { inspectionDate: 'asc' },
      include: {
        supplier: true,
        product: true,
        user: true,
      },
    })

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
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    // Clear existing data (optional, but good if we rebuild the whole registry)
    // Actually it's safer to just append to existing ones if they want to keep previous years
    // But since it's a full export from DB, we should probably clear rows starting from 3
    workbook.worksheets.forEach(ws => {
      // We won't delete rows because it breaks formatting, we'll just overwrite them
    });

    // We need to keep track of current row for each sheet
    const sheetRows: Record<string, number> = {}

    for (const act of inspections) {
      const sheetName = act.sheetName || workbook.worksheets[0]?.name
      if (!sheetName) continue
      
      const worksheet = workbook.getWorksheet(sheetName)
      if (!worksheet) continue

      if (!sheetRows[sheetName]) {
        // Find first empty row for this sheet
        let r = 3;
        while (worksheet.getCell(r, 2).value) r++;
        sheetRows[sheetName] = r;
      }

      const targetRow = sheetRows[sheetName];
      const row = worksheet.getRow(targetRow);

      const date = new Date(act.inspectionDate)
      const dateFormatted = date.toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })

      const config = SHEET_CONFIGS[sheetName];
      if (config) {
        Object.entries(config.standardFields).forEach(([colStr, fieldName]) => {
          const col = parseInt(colStr);
          let value: any = '-';
          switch (fieldName) {
            case 'auto-number': value = targetRow - 2; break;
            case 'date': value = dateFormatted; break;
            case 'productName': value = act.product.name; break;
            case 'supplierName': value = act.supplier.name; break;
            case 'temperature': value = act.temperature != null ? act.temperature : '-'; break;
            case 'packagingCondition': value = act.packaging || 'удовлетворительно'; break;
            case 'certificate': value = act.supplier.certificate || '-'; break;
            case 'batchNumber': value = act.batchNumber; break;
            case 'statusText': value = act.status === 'ACCEPTED' ? 'допущено' : (act.status === 'REJECTED' ? 'брак' : 'условно'); break;
            case 'quantitySklad': value = act.status === 'ACCEPTED' ? act.quantity : '-'; break;
            case 'quantityTseh': value = '-'; break;
            case 'rejectActNumber': value = act.status !== 'ACCEPTED' ? (act.invoiceNumber || 'Акт забраковки') : '-'; break;
            case 'rejectDate': value = act.status !== 'ACCEPTED' ? dateFormatted : '-'; break;
            case 'inspector': value = act.inspector || '-'; break;
            case 'gost': value = act.product.gost || '-'; break;
            case 'quantity': value = act.quantity; break;
          }
          row.getCell(col).value = value;
        });

        let parsedCustomFields: Record<string, string> = {};
        try {
          if (act.customFields) parsedCustomFields = JSON.parse(act.customFields);
        } catch (e) {}

        config.customFields.forEach(cf => {
          row.getCell(cf.col).value = parsedCustomFields[cf.key] || cf.default;
        });
      }

      row.commit();
      sheetRows[sheetName]++;
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `To'liq_Jurnal_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`

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

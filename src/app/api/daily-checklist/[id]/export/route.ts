import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const checklistId = parseInt(id)
    if (isNaN(checklistId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 })
    }

    const doc = await prisma.dailyQCChecklist.findUnique({
      where: { id: checklistId }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    const form = JSON.parse(doc.formData)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Smena Yakuni (QC)')

    // Columns
    worksheet.columns = [
      { header: 'PARAMETR / NAZORAT NUQTASI', key: 'param', width: 45 },
      { header: 'HOLAT / HAQIQIY QIYMAT', key: 'value', width: 35 },
      { header: 'NORMA / TALAB', key: 'norm', width: 35 }
    ]

    // Styling the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } } // Dark blue
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 30

    // Title & Info section (Rows 2 to 9)
    worksheet.addRow({ param: 'YAGONA KUNLIK QC CHECK-LIST (FSSC 22000)', value: '', norm: '' })
    worksheet.mergeCells('A2:C2')
    const titleRow = worksheet.getRow(2)
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF004E39' } }
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
    titleRow.height = 35

    worksheet.addRow({ param: 'Sana:', value: doc.date, norm: '' })
    worksheet.addRow({ param: 'Smena:', value: `${doc.shift}-Smena`, norm: '' })
    worksheet.addRow({ param: 'Liniya:', value: doc.lineName || '-', norm: '' })
    worksheet.addRow({ param: 'Partiya №:', value: doc.batchNumber || '-', norm: '' })
    worksheet.addRow({ param: 'Mas\'ullar (Usta / QC):', value: `${doc.supervisor || '-'} / ${doc.inspector || '-'}`, norm: '' })
    worksheet.addRow({ param: 'Brak:', value: doc.rejectedKg ? `${doc.rejectedKg} kg` : '-', norm: '' })
    worksheet.addRow({ param: 'Umumiy chiqish:', value: doc.totalOutputBox ? `${doc.totalOutputBox} quti` : '-', norm: '' })
    
    // Bold the info labels
    for (let i = 3; i <= 9; i++) {
      worksheet.getCell(`A${i}`).font = { bold: true }
      worksheet.getCell(`A${i}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
      worksheet.getCell(`B${i}`).alignment = { horizontal: 'left' }
    }

    worksheet.addRow({ param: '', value: '', norm: '' }) // row 10 blank

    // Helper for section headers
    const addSectionHeader = (title: string, rowNum: number) => {
      worksheet.addRow({ param: title, value: '', norm: '' })
      worksheet.mergeCells(`A${rowNum}:C${rowNum}`)
      const row = worksheet.getRow(rowNum)
      row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF295F9C' } }
      row.alignment = { vertical: 'middle', horizontal: 'center' }
      row.height = 25
    }

    const formatValue = (isOk: boolean) => {
      return isOk ? 'Mos (OK)' : 'Mos Emas'
    }

    // 1. Packaging Standards
    addSectionHeader('1. QADOQLASH STANDARTLARI', 11)
    worksheet.addRow({ param: 'Limon (Lemon)', value: formatValue(form.packLemon), norm: '100% sog\'lom' })
    worksheet.addRow({ param: 'Bodring (Cucumber)', value: formatValue(form.packCucumber), norm: '990g - 1010g' })
    worksheet.addRow({ param: 'Tomat (Tomato)', value: formatValue(form.packTomato), norm: '990g - 1010g' })
    worksheet.addRow({ param: 'Aysberg (Iceberg)', value: formatValue(form.packIceberg), norm: '990g - 1010g' })
    worksheet.addRow({ param: 'Piyoz (Onion)', value: formatValue(form.packOnion), norm: '492.5g - 507.5g' })
    worksheet.addRow({ param: 'Koul Slou (Cole Slaw)', value: formatValue(form.packColeslaw), norm: '492.5g - 507.5g' })
    
    // 2. Process & Safety (CCPs)
    addSectionHeader('2. XAVFSIZLIK VA JARAYON (KKT / CCP)', 18)
    worksheet.addRow({ param: 'KKT-1: Faol Xlor', value: formatValue(form.dezChlorineOk), norm: '300 mg/l' })
    worksheet.addRow({ param: ' - Soatlik (08,10,12,14,16,18)', value: `${form.dezChlorine1 || '-'}, ${form.dezChlorine2 || '-'}, ${form.dezChlorine3 || '-'}, ${form.dezChlorine4 || '-'}, ${form.dezChlorine5 || '-'}, ${form.dezChlorine6 || '-'}`, norm: '' })
    worksheet.addRow({ param: 'KKT-2: Dezinfeksiya Harorati', value: formatValue(form.dezTempOk), norm: '+1°C ... +3°C' })
    worksheet.addRow({ param: ' - Soatlik (08,10,12,14,16,18)', value: `${form.dezTemp1 || '-'}, ${form.dezTemp2 || '-'}, ${form.dezTemp3 || '-'}, ${form.dezTemp4 || '-'}, ${form.dezTemp5 || '-'}, ${form.dezTemp6 || '-'}`, norm: '' })
    worksheet.addRow({ param: 'KKT-3: Metall Detektor', value: formatValue(form.metalOk), norm: 'Fe, Non-Fe, SS' })
    worksheet.addRow({ param: ' - Test holati', value: `Fe: ${form.metalFe ? 'Bor' : 'Yoq'}, NonFe: ${form.metalNonFe ? 'Bor' : 'Yoq'}, SS: ${form.metalSs ? 'Bor' : 'Yoq'} | Signal: ${form.metalSignal ? 'Bor' : 'Yoq'}`, norm: '' })
    
    // 3. Process & Safety (OPRPs)
    addSectionHeader('3. OPERATSION DASTURLAR (OPRP)', 25)
    worksheet.addRow({ param: 'Ombor Harorati', value: formatValue(form.rawMaterialOk), norm: '+1°C ... +5°C' })
    worksheet.addRow({ param: 'Tozalash zonasi', value: formatValue(form.cleaningOk), norm: '100% chirishsiz' })
    worksheet.addRow({ param: 'To\'g\'rash kalibri', value: formatValue(form.cuttingOk), norm: 'Spetsifikatsiya bo\'yicha' })
    worksheet.addRow({ param: 'Konservant (Koul-slou)', value: formatValue(form.preservativeOk), norm: '≤1g/kg' })
    worksheet.addRow({ param: 'Qoldiq Xlor', value: formatValue(form.residualChlorineOk), norm: '0 mg/l' })
    worksheet.addRow({ param: 'Tsentrifuga (Quritish)', value: formatValue(form.dryingOk), norm: 'Salfetka quruq' })
    worksheet.addRow({ param: 'Vizual Nazorat', value: formatValue(form.inspectionOk), norm: '100% toza' })
    worksheet.addRow({ param: 'Germetiklik', value: formatValue(form.sealingOk), norm: 'Chok tekis, havosiz' })
    worksheet.addRow({ param: 'Tayyor mahsulot ombori', value: formatValue(form.fgStoreOk), norm: '+1°C ... +5°C' })
    worksheet.addRow({ param: 'Gigiyena va Sanitariya', value: formatValue(form.hygieneOk), norm: '100% toza, maska, qo\'lqop' })

    // Apply Borders and Alignments to all data rows
    worksheet.eachRow((row, rowNumber) => {
      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        }
      })
      
      // Data rows centering
      if (rowNumber >= 12 && rowNumber <= 35 && rowNumber !== 18 && rowNumber !== 25) {
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(1).alignment = { vertical: 'middle' }
        
        // Colorize "Mos (OK)" / "Mos Emas"
        const val = row.getCell(2).value
        if (val === 'Mos (OK)') {
          row.getCell(2).font = { color: { argb: 'FF00B050' }, bold: true }
        } else if (val === 'Mos Emas') {
          row.getCell(2).font = { color: { argb: 'FFFF0000' }, bold: true }
        }
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Checklist_${doc.date}_Smena-${doc.shift}.xlsx"`
      }
    })

  } catch (error: any) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

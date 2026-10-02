import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as Blob
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const expensesMap: Record<string, any> = {}
    let importedDaysCount = 0

    // Iterate through all sheets to find the daily blocks
    for (const sheet of workbook.worksheets) {
      const rowCount = sheet.rowCount
      
      for (let i = 1; i <= rowCount; i++) {
        const row = sheet.getRow(i)
        // Find the start of a daily block
        if (row.getCell(6).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' || 
            row.getCell(4).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
            row.getCell(1).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
            (row.values as any[])?.some((v:any) => v?.toString().includes('Расход сырья и материалов на выпуск ГП'))) {
          
          // Found a block! Now let's scan down to find the Date and the tables
          // The date is usually near "Томаты" row or in the "Сырье" header area.
          let dateStr = ''
          const matrix: any = {}
          const outputs: any = {}
          const balances: any = {}
          
          // Let's scan the next 50 rows for data
          const endRow = Math.min(i + 80, rowCount)
          
          // Find the Date first
          for (let r = i; r <= endRow; r++) {
            const tempRow = sheet.getRow(r)
            tempRow.eachCell((cell) => {
              if (cell.value instanceof Date) {
                  dateStr = cell.value.toISOString().split('T')[0]
                } else if (typeof cell.value === 'string') {
                  const val = cell.value.trim();
                  if (val.match(/^\d{4}-\d{2}-\d{2}$/)) { dateStr = val; }
                  else if (val.match(/^\d{2}\.\d{2}\.\d{4}$/)) { const parts = val.split('.'); dateStr = parts[2] + '-' + parts[1] + '-' + parts[0]; }
                }
              })
            if (dateStr) break
          }
          
          if (!dateStr) {
            // Might be a template block with no date, skip
            continue
          }

          // Parse Matrix (Расход)
          // The matrix headers are usually 2 rows below the title
          let matrixHeaderRow = i + 2
          const rawMaterials = [
            'Салат Айсберг', 'Томаты', 'Лук салатный белый', 'Капуста/Морковь', 'Лимон', 'Огурцы свежие', 'Микс салат', 'Мята', 'Сельдерей', 'Айсберг (листовой)', 'Пакет вакуумный 30*35', 'Коробка из гофрокартона', 'Этикетка 56*60'
          ]
          const finishedGoods = [
            'Салат Айсберг нарезанный', 'Томаты целые', 'Лук салатный белый нарезанный', 'Капуста', 'Морковь', 'Лимон', 'Огурцы свежие', 'Lollo Rosso', 'Руккола', 'Шпинат', 'Мята', 'Сельдерей', 'Айсберг (листовой)'
          ]

          // Just blindly read standard cells if it's perfectly rigid!
          // But to be safe, let's look for "Салат Айсберг" in col 1 or 2
          let matrixStartRow = i + 3
          for (let r = i; r <= i + 10; r++) {
            if (sheet.getRow(r).getCell(1).value?.toString().includes('Салат Айсберг') || 
                sheet.getRow(r).getCell(2).value?.toString().includes('Салат Айсберг')) {
              matrixStartRow = r
              break
            }
          }
          
          let colOffset = sheet.getRow(matrixStartRow).getCell(1).value ? 1 : 2

          for (let r = matrixStartRow; r < matrixStartRow + 20; r++) {
            const rawName = sheet.getRow(r).getCell(colOffset).value?.toString()?.trim()
            if (!rawName) continue
            matrix[rawName] = {}
            // Read 14 columns of finished goods
            for (let c = 0; c < 15; c++) {
              const val = Number(sheet.getRow(r).getCell(colOffset + 2 + c).value)
              if (!isNaN(val) && val > 0) {
                // We don't have perfect headers, so we just use column index for now,
                // or we can read the headers from matrixStartRow - 1
                const headerName = sheet.getRow(matrixStartRow - 1).getCell(colOffset + 2 + c).value?.toString()?.trim() || `Col_${c}`
                matrix[rawName][headerName] = val
              }
            }
          }

          // Parse Outputs (Выход ГП КФС)
          let outputStartRow = i + 25
          for (let r = i; r <= i + 40; r++) {
            if (sheet.getRow(r).getCell(colOffset).value?.toString().includes('Выход ГП КФС') ||
                sheet.getRow(r).getCell(colOffset+1).value?.toString().includes('Выход ГП КФС')) {
              outputStartRow = r + 2
              break
            }
          }
          
          for (let r = outputStartRow; r < outputStartRow + 15; r++) {
            const fgName = sheet.getRow(r).getCell(colOffset).value?.toString()?.trim()
            if (!fgName) continue
            const kg = Number(sheet.getRow(r).getCell(colOffset + 1).value) || 0
            const upakovki = Number(sheet.getRow(r).getCell(colOffset + 2).value) || 0
            const korobki = Number(sheet.getRow(r).getCell(colOffset + 3).value) || 0
            if (kg > 0 || upakovki > 0 || korobki > 0) {
              outputs[fgName] = { kg, upakovki, korobki }
            }
          }

          expensesMap[dateStr] = {
            date: dateStr,
            matrix,
            outputs,
            balances,
            materials: {} // Keep empty or calculate totals later
          }
          importedDaysCount++
          
          // Jump ahead to avoid parsing the same block twice
          i = endRow - 10
        }
      }
    }

    // Save to DB
    const dataToInsert = Object.values(expensesMap)
    if (dataToInsert.length > 0) {
      for (const exp of dataToInsert) {
        await prisma.shopExpense.upsert({
          where: { date: exp.date },
          update: { 
            matrix: exp.matrix,
            outputs: exp.outputs,
            balances: exp.balances
          },
          create: { 
            date: exp.date, 
            matrix: exp.matrix,
            outputs: exp.outputs,
            balances: exp.balances
          }
        })
      }
    }

    return NextResponse.json({ success: true, importedDaysCount })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

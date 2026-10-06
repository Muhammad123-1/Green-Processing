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

    const arrivals: any[] = []
    const flatExpensesMap: Record<string, any> = {}
    const blocksMap: Record<string, any> = {}

    for (const sheet of workbook.worksheets) {
      const rowCount = sheet.rowCount
      
      for (let i = 1; i <= rowCount; i++) {
        const row = sheet.getRow(i)
        
        const col1Val = row.getCell(1).value?.toString().trim().toLowerCase() || ''
        
        // 1. Detect "Приход" Flat Table
        if (col1Val === 'дата' && row.getCell(2).value?.toString().trim().toLowerCase().includes('номенклатура')) {
          for (let r = i + 1; r <= i + 1000; r++) {
            const arrRow = sheet.getRow(r)
            const dateVal = arrRow.getCell(1).value
            if (!dateVal) break; 
            
            let dateStr = ''
            if (dateVal instanceof Date) dateStr = dateVal.toISOString().split('T')[0]
            else if (typeof dateVal === 'string') {
              const val = dateVal.trim();
              if (val.match(/^\d{4}-\d{2}-\d{2}$/)) dateStr = val;
              else if (val.match(/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/)) {
                const parts = val.split(/[\.\/]/)
                if (parts.length === 3) dateStr = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
              }
            }

            if (dateStr) {
              arrivals.push({
                date: dateStr,
                nomenclature: arrRow.getCell(2).value?.toString() || '',
                quantity: Number(arrRow.getCell(3).value) || 0,
                supplier: arrRow.getCell(4).value?.toString() || '',
                batch: arrRow.getCell(5).value?.toString() || ''
              })
            }
          }
        }

        // 2. Detect "Расход" Flat Table
        if (col1Val === 'число' || col1Val === 'дата') {
           const rowValues = row.values as any[];
           const isExpenseFlat = rowValues && rowValues.some((v:any) => v?.toString().includes('Ед. изм'))
           if (isExpenseFlat) {
             const headers = row.values as string[]
             for (let r = i + 1; r <= i + 1000; r++) {
               const expRow = sheet.getRow(r)
               const dateVal = expRow.getCell(1).value
               if (!dateVal) {
                  // check if it's really empty or just missing date but has data
                  if (!expRow.getCell(2).value) break;
               }
               
               let dateStr = ''
               if (dateVal instanceof Date) dateStr = dateVal.toISOString().split('T')[0]
               else if (typeof dateVal === 'string') {
                 const val = dateVal.trim();
                 if (val.match(/^\d{4}-\d{2}-\d{2}$/)) dateStr = val;
                 else if (val.match(/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/)) {
                   const parts = val.split(/[\.\/]/)
                   if (parts.length === 3) dateStr = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
                 }
               }

               if (dateStr) {
                 const materials: Record<string, number> = {}
                 for (let c = 2; c < headers.length; c++) {
                   const header = headers[c]?.toString().trim()
                   if (header && !header.includes('Ед. изм')) {
                     const val = Number(expRow.getCell(c).value)
                     if (!isNaN(val) && val !== 0) materials[header] = val
                   }
                 }
                 flatExpensesMap[dateStr] = materials
               }
             }
           }
        }

        // 3. Detect Daily Blocks (Расход сырья и материалов на выпуск ГП)
        if (row.getCell(6).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' || 
            row.getCell(4).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
            row.getCell(1).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
            ((row.values as any[]) || []).some((v:any) => v?.toString().includes('Расход сырья и материалов на выпуск ГП'))) {
          
          let dateStr = ''
          const matrix: any = {}
          const outputs: any = {}
          const balances: any = {}
          
          const endRow = Math.min(i + 80, rowCount)
          for (let r = i; r <= endRow; r++) {
            const tempRow = sheet.getRow(r)
            tempRow.eachCell((cell) => {
              if (cell.value instanceof Date) {
                dateStr = cell.value.toISOString().split('T')[0]
              } else if (typeof cell.value === 'string') {
                const val = cell.value.trim();
                if (val.match(/^\d{4}-\d{2}-\d{2}$/)) { dateStr = val; }
                else if (val.match(/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/)) { 
                  const parts = val.split(/[\.\/]/); 
                  // In cells, it usually comes as MM/DD/YYYY or DD.MM.YYYY. Let's rely on standard logic, but for sheet names we know it's DD.MM
                  if (val.includes('/')) {
                    if(parts.length===3) dateStr = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`; 
                  } else {
                    if(parts.length===3) dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; 
                  }
                }
              }
            })
            if (dateStr) break
          }
          
          if (!dateStr) {
            const sName = sheet.name.trim();
            if (sName.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateStr = sName;
            } else if (sName.match(/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/)) {
              const parts = sName.split(/[\.\/]/);
              // sheet name is DD.MM.YYYY
              dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          
          if (!dateStr) continue

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
            for (let c = 0; c < 15; c++) {
              const val = Number(sheet.getRow(r).getCell(colOffset + 2 + c).value)
              if (!isNaN(val) && val > 0) {
                const headerName = sheet.getRow(matrixStartRow - 1).getCell(colOffset + 2 + c).value?.toString()?.trim() || `Col_${c}`
                matrix[rawName][headerName] = val
              }
            }
          }

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

          blocksMap[dateStr] = { date: dateStr, matrix, outputs, balances }
          i = endRow - 10
        }
      }
    }

    // 4. Save to DB
    let importedDaysCount = 0
    let skippedManualDays = 0
    let newArrivalsCount = 0

    // Save Arrivals: only add rows that are not already in the DB (no wipe, no duplicates),
    // so rows edited/added manually in the app are never lost on re-import.
    if (arrivals.length > 0) {
      const rowKey = (a: any) =>
        [a.date, (a.nomenclature || '').trim(), Number(a.quantity) || 0, (a.supplier || '').trim(), (a.batch || '').trim()].join('|')

      const existing = await prisma.shopArrival.findMany({
        select: { date: true, nomenclature: true, quantity: true, supplier: true, batch: true },
      })
      const existingCounts = new Map<string, number>()
      existing.forEach((a) => existingCounts.set(rowKey(a), (existingCounts.get(rowKey(a)) || 0) + 1))

      const toInsert: any[] = []
      for (const a of arrivals) {
        const k = rowKey(a)
        const left = existingCounts.get(k) || 0
        if (left > 0) existingCounts.set(k, left - 1)
        else toInsert.push(a)
      }
      if (toInsert.length > 0) await prisma.shopArrival.createMany({ data: toInsert })
      newArrivalsCount = toInsert.length
    }

    // Save Expenses (merge flat map and blocks map)
    const hasAny = (o: any) => o && Object.keys(o).length > 0
    const allDates = new Set([...Object.keys(flatExpensesMap), ...Object.keys(blocksMap)])

    for (const dateStr of allDates) {
      const flat = flatExpensesMap[dateStr]
      const block = blocksMap[dateStr]
      const blockHasData = !!block && (hasAny(block.matrix) || hasAny(block.outputs))
      if (!flat && !blockHasData) continue // nothing useful for this day

      const existing = await prisma.shopExpense.findUnique({ where: { date: dateStr } })
      // Days that were saved by hand inside the app are not overwritten by the Excel file
      const editedManually = !!(existing?.balances as any)?.expenseMeta

      // NOTE: `balances` is never written here - it holds the manually entered daily report (balances.report)
      const data: any = {}
      if (flat && !editedManually) data.materials = flat
      if (blockHasData) {
        data.matrix = block.matrix
        data.outputs = block.outputs
      }

      if (Object.keys(data).length === 0) {
        skippedManualDays++
        continue
      }

      if (existing) {
        await prisma.shopExpense.update({ where: { date: dateStr }, data })
      } else {
        await prisma.shopExpense.create({ data: { date: dateStr, materials: {}, ...data } })
      }
      importedDaysCount++
    }

    return NextResponse.json({ success: true, importedDaysCount, skippedManualDays, arrivalsCount: newArrivalsCount })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'
import { toNum, parseExcelDate } from '@/lib/shopReport'

const parseDateVal = parseExcelDate

function getCellValueNum(cell: ExcelJS.Cell): number {
  if (!cell) return 0
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  return toNum(v)
}

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
    const flatExpensesMap: Record<string, Record<string, number>> = {}
    const gpMap: Record<string, Record<string, number>> = {}
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
            const dateStr = parseDateVal(arrRow.getCell(1).value)
            if (!dateStr) {
              if (!arrRow.getCell(2).value) break
              continue
            }

            arrivals.push({
              date: dateStr,
              nomenclature: arrRow.getCell(2).value?.toString() || '',
              quantity: getCellValueNum(arrRow.getCell(3)),
              supplier: arrRow.getCell(4).value?.toString() || '',
              batch: arrRow.getCell(5).value?.toString() || '',
            })
          }
        }

        // 2. Detect "Расход" Flat Table
        if (col1Val === 'число' || col1Val === 'дата') {
          const rowValues = row.values as any[]
          const isExpenseFlat = rowValues && rowValues.some((v: any) => v?.toString().includes('Ед. изм'))
          if (isExpenseFlat) {
            const headers = row.values as string[]
            for (let r = i + 1; r <= i + 1000; r++) {
              const expRow = sheet.getRow(r)
              const dateStr = parseDateVal(expRow.getCell(1).value)
              if (!dateStr) {
                if (!expRow.getCell(2).value) break
                continue
              }

              const materials: Record<string, number> = {}
              for (let c = 2; c < headers.length; c++) {
                const header = headers[c]?.toString().trim()
                if (header && !header.includes('Ед. изм')) {
                  const val = getCellValueNum(expRow.getCell(c))
                  if (val > 0) materials[header] = val
                }
              }
              if (Object.keys(materials).length > 0) {
                flatExpensesMap[dateStr] = { ...(flatExpensesMap[dateStr] || {}), ...materials }
              }
            }
          }
        }

        // 3. Detect "ГП" (Готовая Продукция) Flat Table (e.g., in ПРИХОД sheet or separate GP sheet)
        for (let c = 1; c <= 30; c++) {
          const cellVal = String(row.getCell(c).value || '').trim().toLowerCase()
          if (cellVal === 'дата' || cellVal === 'date') {
            const nextVal = String(row.getCell(c + 1).value || '').trim().toLowerCase()
            const nextVal2 = String(row.getCell(c + 2).value || '').trim().toLowerCase()
            const prevRowHeader = String(sheet.getRow(i - 1).getCell(c).value || '').trim().toLowerCase()
            const prevRowHeader2 = String(sheet.getRow(i - 1).getCell(c + 1).value || '').trim().toLowerCase()

            const isGP =
              prevRowHeader.includes('гп') ||
              prevRowHeader2.includes('гп') ||
              nextVal.includes('айсберг') ||
              nextVal.includes('томат') ||
              nextVal.includes('коул') ||
              nextVal2.includes('томат')

            if (isGP) {
              const gpHeaders: { col: number; name: string }[] = []
              for (let colIdx = c + 1; colIdx <= c + 20; colIdx++) {
                const h = String(row.getCell(colIdx).value || '').trim()
                if (h && !h.toLowerCase().includes('дата')) {
                  gpHeaders.push({ col: colIdx, name: h })
                } else if (!h && gpHeaders.length >= 4) {
                  // End of GP header block
                  break
                }
              }

              if (gpHeaders.length >= 2) {
                for (let r = i + 1; r <= sheet.rowCount; r++) {
                  const dRow = sheet.getRow(r)
                  const dVal = dRow.getCell(c).value
                  if (!dVal) continue

                  const dateStr = parseDateVal(dVal)
                  if (dateStr) {
                    const dailyGP: Record<string, number> = {}
                    gpHeaders.forEach((h) => {
                      const num = getCellValueNum(dRow.getCell(h.col))
                      if (num > 0) dailyGP[h.name] = num
                    })
                    if (Object.keys(dailyGP).length > 0) {
                      gpMap[dateStr] = { ...(gpMap[dateStr] || {}), ...dailyGP }
                    }
                  }
                }
              }
            }
          }
        }

        // 4. Detect Daily Blocks (Расход сырья и материалов на выпуск ГП)
        if (
          row.getCell(6).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
          row.getCell(4).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
          row.getCell(1).value?.toString().trim() === 'Расход сырья и материалов на выпуск ГП' ||
          ((row.values as any[]) || []).some((v: any) => v?.toString().includes('Расход сырья и материалов на выпуск ГП'))
        ) {
          let dateStr = ''
          const matrix: any = {}
          const outputs: any = {}
          const balances: any = {}

          const endRow = Math.min(i + 80, rowCount)
          for (let r = i; r <= endRow; r++) {
            const tempRow = sheet.getRow(r)
            tempRow.eachCell((cell) => {
              const parsed = parseDateVal(cell.value)
              if (parsed) dateStr = parsed
            })
            if (dateStr) break
          }

          if (!dateStr) {
            const sName = sheet.name.trim()
            dateStr = parseDateVal(sName)
          }

          if (!dateStr) continue

          let matrixStartRow = i + 3
          for (let r = i; r <= i + 10; r++) {
            if (
              sheet.getRow(r).getCell(1).value?.toString().includes('Салат Айсберг') ||
              sheet.getRow(r).getCell(2).value?.toString().includes('Салат Айсберг')
            ) {
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
              const val = getCellValueNum(sheet.getRow(r).getCell(colOffset + 2 + c))
              if (val > 0) {
                const headerName =
                  sheet.getRow(matrixStartRow - 1).getCell(colOffset + 2 + c).value?.toString()?.trim() || `Col_${c}`
                matrix[rawName][headerName] = val
              }
            }
          }

          let outputStartRow = i + 25
          for (let r = i; r <= i + 40; r++) {
            if (
              sheet.getRow(r).getCell(colOffset).value?.toString().includes('Выход ГП КФС') ||
              sheet.getRow(r).getCell(colOffset + 1).value?.toString().includes('Выход ГП КФС')
            ) {
              outputStartRow = r + 2
              break
            }
          }

          for (let r = outputStartRow; r < outputStartRow + 15; r++) {
            const fgName = sheet.getRow(r).getCell(colOffset).value?.toString()?.trim()
            if (!fgName) continue
            const kg = getCellValueNum(sheet.getRow(r).getCell(colOffset + 1))
            const upakovki = getCellValueNum(sheet.getRow(r).getCell(colOffset + 2))
            const korobki = getCellValueNum(sheet.getRow(r).getCell(colOffset + 3))
            if (kg > 0 || upakovki > 0 || korobki > 0) {
              outputs[fgName] = { kg, upakovki, korobki }
            }
          }

          blocksMap[dateStr] = { date: dateStr, matrix, outputs, balances }
          i = endRow - 10
        }
      }
    }

    // 5. Save to DB with Non-Destructive MERGE (fill missing data only, never overwrite existing)
    let importedDaysCount = 0
    let updatedDaysCount = 0
    let newArrivalsCount = 0

    // Save Arrivals: only add rows that are not already in the DB (no duplicates)
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

    // Collect all dates that have data
    const allDates = new Set([
      ...Object.keys(flatExpensesMap),
      ...Object.keys(gpMap),
      ...Object.keys(blocksMap),
    ])

    for (const dateStr of allDates) {
      const flat = flatExpensesMap[dateStr] || {}
      const gp = gpMap[dateStr] || {}
      const block = blocksMap[dateStr]

      const hasFlat = Object.keys(flat).length > 0
      const hasGP = Object.keys(gp).length > 0
      const hasBlock = !!block && (Object.keys(block.matrix || {}).length > 0 || Object.keys(block.outputs || {}).length > 0)

      if (!hasFlat && !hasGP && !hasBlock) continue // Skip empty date

      const existing = await prisma.shopExpense.findUnique({ where: { date: dateStr } })

      if (existing) {
        // MERGE: Preserve all existing values. Only fill in missing (empty/zero) fields!
        const existingMaterials = (existing.materials || {}) as Record<string, any>
        const mergedMaterials: Record<string, any> = { ...existingMaterials }

        for (const [k, v] of Object.entries(flat)) {
          const num = toNum(v)
          if (num > 0) {
            const cur = toNum(mergedMaterials[k])
            // If current is empty or 0, fill in from Excel!
            if (cur === 0) {
              mergedMaterials[k] = num
            }
          }
        }

        const existingOutputs = (existing.outputs || {}) as Record<string, any>
        const mergedOutputs: Record<string, any> = { ...existingOutputs }

        // Merge GP flat outputs
        for (const [k, v] of Object.entries(gp)) {
          const num = toNum(v)
          if (num > 0) {
            const curItem = mergedOutputs[k]
            const curKg = typeof curItem === 'object' && curItem !== null ? toNum(curItem.kg ?? curItem.val) : toNum(curItem)
            if (curKg === 0) {
              if (typeof curItem === 'object' && curItem !== null) {
                mergedOutputs[k] = { ...curItem, kg: num }
              } else {
                mergedOutputs[k] = { kg: num }
              }
            }
          }
        }

        // Merge block outputs if any
        if (hasBlock && block.outputs) {
          for (const [k, v] of Object.entries(block.outputs as Record<string, any>)) {
            const curItem = mergedOutputs[k]
            const curKg = typeof curItem === 'object' && curItem !== null ? toNum(curItem.kg) : toNum(curItem)
            if (curKg === 0) {
              mergedOutputs[k] = { ...(typeof curItem === 'object' ? curItem : {}), ...v }
            }
          }
        }

        // Merge block matrix if any
        const existingMatrix = (existing.matrix || {}) as Record<string, any>
        const mergedMatrix: Record<string, any> = { ...existingMatrix }
        if (hasBlock && block.matrix) {
          for (const [rawName, colMap] of Object.entries(block.matrix as Record<string, any>)) {
            mergedMatrix[rawName] = mergedMatrix[rawName] || {}
            for (const [colName, val] of Object.entries(colMap as Record<string, any>)) {
              const curVal = toNum(mergedMatrix[rawName][colName])
              if (curVal === 0 && toNum(val) > 0) {
                mergedMatrix[rawName][colName] = toNum(val)
              }
            }
          }
        }

        await prisma.shopExpense.update({
          where: { date: dateStr },
          data: {
            materials: mergedMaterials,
            outputs: mergedOutputs,
            matrix: mergedMatrix,
            // balances is kept untouched to preserve manual daily reports
          },
        })
        updatedDaysCount++
      } else {
        // Create new record for this date
        const initialOutputs: Record<string, any> = {}
        for (const [k, v] of Object.entries(gp)) {
          if (toNum(v) > 0) initialOutputs[k] = { kg: toNum(v) }
        }
        if (hasBlock && block.outputs) {
          Object.assign(initialOutputs, block.outputs)
        }

        await prisma.shopExpense.create({
          data: {
            date: dateStr,
            materials: flat,
            outputs: initialOutputs,
            matrix: hasBlock ? block.matrix : {},
            balances: {},
          },
        })
        importedDaysCount++
      }
    }

    return NextResponse.json({
      success: true,
      importedDaysCount,
      updatedDaysCount,
      arrivalsCount: newArrivalsCount,
      totalGPDates: Object.keys(gpMap).length,
    })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

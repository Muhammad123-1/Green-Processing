import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'
import { toNum, parseExcelDate } from '@/lib/shopReport'

function getCellValueNum(cell: ExcelJS.Cell | undefined): number {
  if (!cell) return 0
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  return toNum(v)
}

function getCellValueStr(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  return String(v ?? '').trim()
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
    const datesFound = new Set<string>()

    for (const sheet of workbook.worksheets) {
      const rowCount = sheet.rowCount
      if (rowCount === 0) continue

      for (let i = 1; i <= rowCount; i++) {
        const row = sheet.getRow(i)
        const col1Val = getCellValueStr(row.getCell(1)).toLowerCase()
        const col2Val = getCellValueStr(row.getCell(2)).toLowerCase()

        // 1. Detect "Приход" Flat Table
        // Col 1 is "Дата", Col 2 has "номенклатура" or "наименование"
        if (col1Val === 'дата' && (col2Val.includes('номенклатура') || col2Val.includes('наименование'))) {
          let blankCount = 0
          for (let r = i + 1; r <= rowCount; r++) {
            const arrRow = sheet.getRow(r)
            const c1 = arrRow.getCell(1).value
            const c2 = arrRow.getCell(2).value

            if (!c1 && !c2) {
              blankCount++
              if (blankCount > 35) break // allow blank lines, stop after 35 empty rows
              continue
            }
            blankCount = 0

            const dateStr = parseExcelDate(c1)
            const nomenclature = getCellValueStr(arrRow.getCell(2))
            if (!dateStr || !nomenclature) continue

            datesFound.add(dateStr)
            arrivals.push({
              date: dateStr,
              nomenclature,
              quantity: getCellValueNum(arrRow.getCell(3)),
              supplier: getCellValueStr(arrRow.getCell(4)),
              batch: getCellValueStr(arrRow.getCell(5)),
            })
          }
        }

        // 2. Detect "Расход" Flat Table
        // Col 1 is "Число" or "Дата" (and not Приход header), other columns are material names
        if (col1Val === 'число' || (col1Val === 'дата' && !col2Val.includes('номенклатура') && !col2Val.includes('наименование'))) {
          const expHeaders: { col: number; name: string }[] = []
          for (let c = 2; c <= 35; c++) {
            const h = getCellValueStr(row.getCell(c))
            if (h && !h.toLowerCase().includes('дата') && !h.toLowerCase().includes('число')) {
              expHeaders.push({ col: c, name: h })
            }
          }

          if (expHeaders.length >= 3) {
            let blankCount = 0
            for (let r = i + 1; r <= rowCount; r++) {
              const expRow = sheet.getRow(r)
              const c1 = expRow.getCell(1).value
              if (!c1) {
                blankCount++
                if (blankCount > 35) break
                continue
              }
              blankCount = 0

              const dateStr = parseExcelDate(c1)
              if (!dateStr) continue

              datesFound.add(dateStr)
              const materials: Record<string, number> = {}
              for (const h of expHeaders) {
                const val = getCellValueNum(expRow.getCell(h.col))
                if (val > 0) materials[h.name] = val
              }
              if (Object.keys(materials).length > 0) {
                flatExpensesMap[dateStr] = { ...(flatExpensesMap[dateStr] || {}), ...materials }
              }
            }
          }
        }

        // 3. Detect "ГП" (Готовая Продукция) Flat Table (e.g. in ПРИХОД sheet at col 7+ or in separate ГП sheet)
        for (let c = 1; c <= 30; c++) {
          const cellVal = getCellValueStr(row.getCell(c)).toLowerCase()
          if (cellVal === 'дата' || cellVal === 'date') {
            const nextVal = getCellValueStr(row.getCell(c + 1)).toLowerCase()
            const prevRowHeader = getCellValueStr(sheet.getRow(i - 1).getCell(c)).toLowerCase()
            const prevRowHeader2 = getCellValueStr(sheet.getRow(i - 1).getCell(c + 1)).toLowerCase()

            const isGP =
              sheet.name.trim().toLowerCase() === 'гп' ||
              prevRowHeader.includes('гп') ||
              prevRowHeader2.includes('гп') ||
              nextVal.includes('айсберг') ||
              nextVal.includes('томат') ||
              nextVal.includes('коул')

            if (isGP && !nextVal.includes('номенклатура') && !nextVal.includes('наименование')) {
              const gpHeaders: { col: number; name: string }[] = []
              for (let colIdx = c + 1; colIdx <= c + 25; colIdx++) {
                const h = getCellValueStr(row.getCell(colIdx))
                if (h && !h.toLowerCase().includes('дата')) {
                  gpHeaders.push({ col: colIdx, name: h })
                } else if (!h && gpHeaders.length >= 3) {
                  break
                }
              }

              if (gpHeaders.length >= 2) {
                let blankCount = 0
                for (let r = i + 1; r <= rowCount; r++) {
                  const dRow = sheet.getRow(r)
                  const dVal = dRow.getCell(c).value
                  if (!dVal) {
                    blankCount++
                    if (blankCount > 35) break
                    continue
                  }
                  blankCount = 0

                  const dateStr = parseExcelDate(dVal)
                  if (dateStr) {
                    datesFound.add(dateStr)
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
              const parsed = parseExcelDate(cell.value)
              if (parsed) dateStr = parsed
            })
            if (dateStr) break
          }

          if (!dateStr) {
            const sName = sheet.name.trim()
            dateStr = parseExcelDate(sName)
          }

          if (!dateStr) continue
          datesFound.add(dateStr)

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

    // 5. Save to DB with Non-Destructive MERGE
    let importedDaysCount = 0
    let updatedDaysCount = 0
    let newArrivalsCount = 0
    let updatedArrivalsCount = 0

    // Save Arrivals:
    if (arrivals.length > 0) {
      const rowKey = (a: any) =>
        [
          a.date,
          (a.nomenclature || '').trim().toLowerCase(),
          (a.supplier || '').trim().toLowerCase(),
          (a.batch || '').trim().toLowerCase(),
        ].join('|')

      const existingArrivals = await prisma.shopArrival.findMany()
      const existingMap = new Map<string, (typeof existingArrivals)[0][]>()
      existingArrivals.forEach((a) => {
        const k = rowKey(a)
        const list = existingMap.get(k) || []
        list.push(a)
        existingMap.set(k, list)
      })

      const toInsert: any[] = []
      // Track consumed arrivals to avoid clashing duplicate rows on same day
      const consumedIds = new Set<number>()

      for (const a of arrivals) {
        if (!a.nomenclature) continue
        const k = rowKey(a)
        const matches = (existingMap.get(k) || []).filter((m) => !consumedIds.has(m.id))

        if (matches.length > 0) {
          const match = matches[0]
          consumedIds.add(match.id)
          if (Math.abs(match.quantity - a.quantity) > 0.001) {
            await prisma.shopArrival.update({
              where: { id: match.id },
              data: { quantity: a.quantity },
            })
            updatedArrivalsCount++
          }
        } else {
          if (a.quantity > 0) {
            toInsert.push(a)
          }
        }
      }

      if (toInsert.length > 0) {
        // Insert in batches of 200
        for (let idx = 0; idx < toInsert.length; idx += 200) {
          const batch = toInsert.slice(idx, idx + 200)
          await prisma.shopArrival.createMany({ data: batch })
        }
        newArrivalsCount = toInsert.length
      }
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

      if (!hasFlat && !hasGP && !hasBlock) continue

      const existing = await prisma.shopExpense.findUnique({ where: { date: dateStr } })

      if (existing) {
        const existingMaterials = (existing.materials || {}) as Record<string, any>
        const mergedMaterials: Record<string, any> = { ...existingMaterials }

        for (const [k, v] of Object.entries(flat)) {
          const num = toNum(v)
          if (num > 0) {
            const cur = toNum(mergedMaterials[k])
            if (cur === 0) {
              mergedMaterials[k] = num
            }
          }
        }

        const existingOutputs = (existing.outputs || {}) as Record<string, any>
        const mergedOutputs: Record<string, any> = { ...existingOutputs }

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

        if (hasBlock && block.outputs) {
          for (const [k, v] of Object.entries(block.outputs as Record<string, any>)) {
            const curItem = mergedOutputs[k]
            const curKg = typeof curItem === 'object' && curItem !== null ? toNum(curItem.kg) : toNum(curItem)
            if (curKg === 0) {
              mergedOutputs[k] = { ...(typeof curItem === 'object' ? curItem : {}), ...v }
            }
          }
        }

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
          },
        })
        updatedDaysCount++
      } else {
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

    const sortedDates = Array.from(datesFound).sort()
    const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : ''
    const latestMonth = latestDate ? latestDate.slice(0, 7) : ''
    const monthsFound = Array.from(new Set(sortedDates.map((d) => d.slice(0, 7)))).sort()

    return NextResponse.json({
      success: true,
      importedDaysCount,
      updatedDaysCount,
      arrivalsCount: newArrivalsCount,
      updatedArrivalsCount,
      totalArrivalsInFile: arrivals.length,
      totalGPDates: Object.keys(gpMap).length,
      latestDate,
      latestMonth,
      monthsFound,
    })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

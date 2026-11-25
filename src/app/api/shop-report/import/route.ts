import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import ExcelJS from 'exceljs'
import { toNum, parseExcelDate, EXPENSE_FIELDS, normKey, matchSyrye12Key, sanitizeDayReport } from '@/lib/shopReport'
import { recordImportAudit } from '@/lib/auditImport'
import { syncInventoryBatchesFromDailyBalances } from '@/lib/fifoSync'
import { invalidateSupplyDashboardCache } from '@/lib/supplyDashboardCache'
import { syncAllShopArrivalsToIncomingActs } from '@/lib/incoming-acts/autoAct'

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  const r = Math.round(n * 100) / 100
  return Math.abs(r) < 0.01 ? 0 : r
}

function getCellValueNum(cell: ExcelJS.Cell | undefined): number {
  if (!cell) return 0
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'object' && (v as any).error) return 0
  return round2(toNum(v))
}

function getCellValueStr(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''
  const v = cell.result !== undefined && cell.result !== null ? cell.result : cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && (v as any).error) return ''
  return String(v ?? '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // STRICT ADMIN-ONLY IMPORT RESTRICTION
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error:
            "Fayllarni import qilish faqat Tizim Administratoriga (ADMIN) ruxsat etilgan! Ma'lumotlar yaxlitligi va audit qoidalariga binoan hatto Direktor ham import qila olmaydi.",
        },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as Blob | null
    if (!file) return NextResponse.json({ error: 'Excel fayl tanlanmadi' }, { status: 400 })

    const reason = ((formData.get('reason') as string) || '').trim()
    if (!reason || reason.length < 5) {
      return NextResponse.json(
        {
          error:
            'Import qilish sababi va asosi (kamida 5 ta belgi) kiritilishi shart! Ushbu izoh audit jurnali uchun saqlanadi.',
        },
        { status: 400 }
      )
    }

    const target = ((formData.get('target') as string) || "Sex hisoboti va Omborxona").trim()
    const fileName = (file as any)?.name || 'imported_file.xlsx'
    const fileSize = (file as any)?.size ? `${Math.round((file as any).size / 1024)} KB` : undefined

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const arrivals: any[] = []
    const emptyArrivals: Array<{ date: string; nomenclature: string; supplier: string }> = []
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
            const qty = getCellValueNum(arrRow.getCell(3))
            if (!dateStr || !nomenclature) continue

            if (qty <= 0) {
              emptyArrivals.push({
                date: dateStr,
                nomenclature,
                supplier: getCellValueStr(arrRow.getCell(4)),
              })
              continue
            }

            datesFound.add(dateStr)
            arrivals.push({
              date: dateStr,
              nomenclature,
              quantity: qty,
              supplier: getCellValueStr(arrRow.getCell(4)),
              batch: getCellValueStr(arrRow.getCell(5)),
            })
          }
        }

        // 2. Detect "Расход" Flat Table
        // Format A: Col 1 is "Число" or "Дата" (monthly sheets)
        // Format B: Col 1 is "№" and Col 2 is "Sana (Дата)" (master sheet "2. Расход (Chiqim)")
        const isMasterExpenseSheet =
          (col1Val === '№' || col1Val === 'no') && (col2Val.includes('дата') || col2Val.includes('sana'))
        const isMonthlyExpenseSheet =
          col1Val === 'число' ||
          (col1Val === 'дата' && !col2Val.includes('номенклатура') && !col2Val.includes('наименование'))

        if (isMasterExpenseSheet || isMonthlyExpenseSheet) {
          const dateCol = isMasterExpenseSheet ? 2 : 1
          const startMatCol = isMasterExpenseSheet ? 3 : 2

          const cleanExpenseHeader = (raw: string): string => {
            const s = raw.replace(/\((?:кг|kg|шт|dona|л|литр|бут)\)/gi, '').trim()
            for (const f of EXPENSE_FIELDS) {
              if (
                f.aliases.some(
                  (a) =>
                    normKey(a) === normKey(s) ||
                    normKey(a) === normKey(raw)
                )
              ) {
                return f.aliases[0]
              }
            }
            return s
          }

          const expHeaders: { col: number; name: string }[] = []
          for (let c = startMatCol; c <= 40; c++) {
            const h = getCellValueStr(row.getCell(c))
            if (
              h &&
              !h.toLowerCase().includes('дата') &&
              !h.toLowerCase().includes('число') &&
              !h.toLowerCase().includes('sana') &&
              !h.toLowerCase().includes('jami') &&
              !h.toLowerCase().includes('итого')
            ) {
              expHeaders.push({ col: c, name: cleanExpenseHeader(h) })
            }
          }

          if (expHeaders.length >= 3) {
            let blankCount = 0
            for (let r = i + 1; r <= rowCount; r++) {
              const expRow = sheet.getRow(r)
              const dateVal = expRow.getCell(dateCol).value
              if (!dateVal) {
                blankCount++
                if (blankCount > 35) break
                continue
              }
              blankCount = 0

              const dateStr = parseExcelDate(dateVal)
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
              nextVal.includes('айзберг') ||
              nextVal.includes('aysberg') ||
              nextVal.includes('ayzberg') ||
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
          const balances: {
            start: Record<string, number>
            income: Record<string, number>
            expense: Record<string, number>
            end: Record<string, number>
          } = {
            start: {},
            income: {},
            expense: {},
            end: {},
          }

          const endRow = Math.min(i + 45, rowCount)

          // Prefer sheet name date if the sheet is a daily tab (e.g. "24.11.2026", "25.07.2026 (2)")
          const cleanSheetName = sheet.name.replace(/\(\d+\)/g, '').replace(/[()]/g, '').trim()
          const sheetDate = parseExcelDate(cleanSheetName)
          if (sheetDate) {
            dateStr = sheetDate
          }

          // Parse "Сырье" daily balance table ("остатка начало дня", "приход", "расход", "остатка конец дня")
          for (let r = i; r <= endRow; r++) {
            const tempRow = sheet.getRow(r)
            let labelCol = -1
            for (let c = 1; c <= 35; c++) {
              const val = getCellValueStr(tempRow.getCell(c)).toLowerCase()
              if (val.includes('остатка начало дня') || val.includes('остаток на начало')) {
                labelCol = c
                break
              }
            }
            if (labelCol !== -1) {
              const headerRow = sheet.getRow(r - 1)
              const headerDate = parseExcelDate(headerRow.getCell(labelCol).value)
              if (!dateStr && headerDate) {
                dateStr = headerDate
              }

              const colKeyMap: Record<number, string> = {}
              for (let c = labelCol + 1; c <= labelCol + 16; c++) {
                const hStr = getCellValueStr(headerRow.getCell(c))
                const matKey = matchSyrye12Key(hStr)
                if (matKey) {
                  colKeyMap[c] = matKey
                }
              }

              const balanceRowDefs: Array<{ offset: number; key: 'start' | 'income' | 'expense' | 'end' }> = [
                { offset: 0, key: 'start' },
                { offset: 1, key: 'income' },
                { offset: 2, key: 'expense' },
                { offset: 3, key: 'end' },
              ]

              for (const rd of balanceRowDefs) {
                const targetRow = sheet.getRow(r + rd.offset)
                for (const [colIdxStr, matKey] of Object.entries(colKeyMap)) {
                  let val = getCellValueNum(targetRow.getCell(Number(colIdxStr)))
                  if (rd.key === 'end' && val < 0 && Math.abs(val) < 0.05) {
                    val = 0
                  }
                  if (val > 0 || rd.key === 'end') {
                    balances[rd.key][matKey] = Math.max(0, val)
                  }
                }
              }
              break
            }
          }

          if (!dateStr) {
            for (let r = i; r <= Math.min(i + 15, rowCount); r++) {
              const tempRow = sheet.getRow(r)
              tempRow.eachCell((cell) => {
                const parsed = parseExcelDate(cell.value)
                if (parsed && !dateStr) dateStr = parsed
              })
              if (dateStr) break
            }
          }

          if (!dateStr) continue
          datesFound.add(dateStr)

          let matrixStartRow = i + 3
          for (let r = i; r <= i + 10; r++) {
            const c1 = sheet.getRow(r).getCell(1).value?.toString() || ''
            const c2 = sheet.getRow(r).getCell(2).value?.toString() || ''
            const isIcebergRow =
              c1.includes('Салат Айсберг') ||
              c1.includes('Салат Айзберг') ||
              c1.includes('Айсберг') ||
              c1.includes('Айзберг') ||
              c2.includes('Салат Айсберг') ||
              c2.includes('Салат Айзберг') ||
              c2.includes('Айсберг') ||
              c2.includes('Айзберг')
            if (isIcebergRow) {
              matrixStartRow = r
              break
            }
          }

          const colOffset = sheet.getRow(matrixStartRow).getCell(1).value ? 1 : 2

          for (let r = matrixStartRow; r < matrixStartRow + 16; r++) {
            const rawName = getCellValueStr(sheet.getRow(r).getCell(colOffset))
            if (!rawName || rawName.includes('Выход ГП') || rawName.includes('Наименование ГП')) break
            matrix[rawName] = matrix[rawName] || {}
            const prihodVal = getCellValueNum(sheet.getRow(r).getCell(colOffset + 1))
            if (prihodVal > 0) {
              matrix[rawName]['Приход в цех'] = prihodVal
            }
            for (let c = 0; c < 16; c++) {
              const val = getCellValueNum(sheet.getRow(r).getCell(colOffset + 2 + c))
              if (val > 0) {
                const headerName =
                  getCellValueStr(sheet.getRow(matrixStartRow - 1).getCell(colOffset + 2 + c)) || `Col_${c}`
                if (headerName && !headerName.includes('Сырье')) {
                  matrix[rawName][headerName] = val
                }
              }
            }
          }

          let outputStartRow = i + 25
          for (let r = i; r <= i + 35; r++) {
            if (
              getCellValueStr(sheet.getRow(r).getCell(colOffset)).includes('Выход ГП КФС') ||
              getCellValueStr(sheet.getRow(r).getCell(colOffset + 1)).includes('Выход ГП КФС')
            ) {
              outputStartRow = r + 2
              break
            }
          }

          for (let r = outputStartRow; r < outputStartRow + 15; r++) {
            const fgName = getCellValueStr(sheet.getRow(r).getCell(colOffset))
            if (!fgName || fgName.includes('% расхода') || fgName.includes('% Брака')) break
            const kg = getCellValueNum(sheet.getRow(r).getCell(colOffset + 1))
            const upakovki = getCellValueNum(sheet.getRow(r).getCell(colOffset + 2))
            const korobki = getCellValueNum(sheet.getRow(r).getCell(colOffset + 3))
            const ses = getCellValueNum(sheet.getRow(r).getCell(colOffset + 4))
            const kitchen = getCellValueNum(sheet.getRow(r).getCell(colOffset + 5))
            if (kg > 0 || upakovki > 0 || korobki > 0 || ses > 0 || kitchen > 0) {
              outputs[fgName] = {
                ...(kg > 0 ? { kg } : {}),
                ...(upakovki > 0 ? { upakovki } : {}),
                ...(korobki > 0 ? { korobki } : {}),
                ...(ses > 0 ? { ses } : {}),
                ...(kitchen > 0 ? { kitchen } : {}),
              }
            }
          }

          blocksMap[dateStr] = { date: dateStr, matrix, outputs, balances }
          i = endRow
        }
      }
    }

    // 5. Save to DB with Smart Deduplication & Authoritative Balance Sync
    let importedDaysCount = 0
    let updatedDaysCount = 0
    let newArrivalsCount = 0
    let updatedArrivalsCount = 0

    // Save Arrivals:
    if (arrivals.length > 0) {
      const exactBatchKey = (a: any) =>
        [
          a.date,
          (a.nomenclature || '').trim().toLowerCase(),
          (a.supplier || '').trim().toLowerCase(),
          (a.batch || '').trim().toLowerCase(),
        ].join('|')

      const looseQtyKey = (a: any) =>
        [
          a.date,
          (a.nomenclature || '').trim().toLowerCase(),
          (a.supplier || '').trim().toLowerCase(),
          round2(Number(a.quantity) || 0),
        ].join('|')

      const existingArrivals = await prisma.shopArrival.findMany({
        orderBy: { id: 'asc' },
      })

      const exactMap = new Map<string, (typeof existingArrivals)[0][]>()
      const looseMap = new Map<string, (typeof existingArrivals)[0][]>()

      existingArrivals.forEach((a) => {
        const ek = exactBatchKey(a)
        const eList = exactMap.get(ek) || []
        eList.push(a)
        exactMap.set(ek, eList)

        const lk = looseQtyKey(a)
        const lList = looseMap.get(lk) || []
        lList.push(a)
        looseMap.set(lk, lList)
      })

      const toInsert: any[] = []
      const consumedIds = new Set<number>()

      for (const a of arrivals) {
        if (!a.nomenclature || a.quantity <= 0) continue
        const ek = exactBatchKey(a)
        let matches = (exactMap.get(ek) || []).filter((m) => !consumedIds.has(m.id))

        // Fallback: if batch in Excel was empty (while DB previously auto-assigned a batch number),
        // match by (date, nomenclature, supplier, quantity) so we never create duplicate clones!
        if (matches.length === 0) {
          const lk = looseQtyKey(a)
          matches = (looseMap.get(lk) || []).filter((m) => !consumedIds.has(m.id))
        }

        if (matches.length > 0) {
          const match = matches[0]
          consumedIds.add(match.id)
          const needQtyUpdate = Math.abs(match.quantity - a.quantity) > 0.001
          const needBatchUpdate = a.batch && String(a.batch).trim() !== '' && match.batch !== String(a.batch).trim()
          if (needQtyUpdate || needBatchUpdate) {
            await prisma.shopArrival.update({
              where: { id: match.id },
              data: {
                quantity: a.quantity,
                ...(needBatchUpdate ? { batch: String(a.batch).trim() } : {}),
              },
            })
            updatedArrivalsCount++
          }
        } else {
          toInsert.push(a)
        }
      }

      if (toInsert.length > 0) {
        const importBatchCounters = new Map<string, number>()
        for (const item of toInsert) {
          if (!item.batch || String(item.batch).trim() === '') {
            const nom = String(item.nomenclature || '').trim().toLowerCase()
            const ym = String(item.date || '').slice(0, 7)
            const k = `${nom}:::${ym}`
            const cur = (importBatchCounters.get(k) || 0) + 1
            importBatchCounters.set(k, cur)
            item.batch = String(cur)
          }
        }

        for (let idx = 0; idx < toInsert.length; idx += 200) {
          const batch = toInsert.slice(idx, idx + 200)
          await prisma.shopArrival.createMany({ data: batch })
        }
        newArrivalsCount = toInsert.length
      }
    }

    // Zero out phantom records where cells were cleared in the uploaded file
    if (emptyArrivals.length > 0) {
      for (const ea of emptyArrivals) {
        const sup = (ea.supplier || '').trim()
        await prisma.shopArrival.updateMany({
          where: {
            date: ea.date,
            nomenclature: { equals: ea.nomenclature, mode: 'insensitive' },
            ...(sup ? { supplier: { equals: sup, mode: 'insensitive' } } : {}),
            quantity: { gt: 0 },
          },
          data: { quantity: 0 },
        })
      }
    }

    // Collect all dates that have data
    const allDates = new Set([
      ...Object.keys(flatExpensesMap),
      ...Object.keys(gpMap),
      ...Object.keys(blocksMap),
    ])

    const nowIso = new Date().toISOString()

    for (const dateStr of allDates) {
      const flat = flatExpensesMap[dateStr] || {}
      const gp = gpMap[dateStr] || {}
      const block = blocksMap[dateStr]

      const hasFlat = Object.keys(flat).length > 0
      const hasGP = Object.keys(gp).length > 0
      const hasBlockBalances =
        !!block?.balances &&
        (Object.keys(block.balances.start || {}).length > 0 ||
          Object.keys(block.balances.end || {}).length > 0 ||
          Object.keys(block.balances.income || {}).length > 0 ||
          Object.keys(block.balances.expense || {}).length > 0)
      const hasBlock =
        !!block &&
        (Object.keys(block.matrix || {}).length > 0 ||
          Object.keys(block.outputs || {}).length > 0 ||
          hasBlockBalances)

      if (!hasFlat && !hasGP && !hasBlock) continue

      const existing = await prisma.shopExpense.findUnique({ where: { date: dateStr } })

      if (existing) {
        const existingMaterials = (existing.materials || {}) as Record<string, any>
        const mergedMaterials: Record<string, any> = { ...existingMaterials }

        for (const [k, v] of Object.entries(flat)) {
          const num = round2(toNum(v))
          if (num > 0) {
            mergedMaterials[k] = num
          }
        }

        const existingOutputs = (existing.outputs || {}) as Record<string, any>
        const mergedOutputs: Record<string, any> = { ...existingOutputs }

        for (const [k, v] of Object.entries(gp)) {
          const num = round2(toNum(v))
          if (num > 0) {
            const curItem = mergedOutputs[k]
            if (typeof curItem === 'object' && curItem !== null) {
              mergedOutputs[k] = { ...curItem, kg: num }
            } else {
              mergedOutputs[k] = { kg: num }
            }
          }
        }

        if (hasBlock && block.outputs) {
          for (const [k, v] of Object.entries(block.outputs as Record<string, any>)) {
            const curItem = mergedOutputs[k]
            mergedOutputs[k] = { ...(typeof curItem === 'object' ? curItem : {}), ...v }
          }
        }

        const existingMatrix = (existing.matrix || {}) as Record<string, any>
        const mergedMatrix: Record<string, any> = { ...existingMatrix }
        if (hasBlock && block.matrix) {
          for (const [rawName, colMap] of Object.entries(block.matrix as Record<string, any>)) {
            mergedMatrix[rawName] = mergedMatrix[rawName] || {}
            for (const [colName, val] of Object.entries(colMap as Record<string, any>)) {
              const vNum = round2(toNum(val))
              if (vNum > 0) {
                mergedMatrix[rawName][colName] = vNum
              }
            }
          }
        }

        const existingBalances = ((existing.balances as any) || {}) as Record<string, any>
        const mergedBalances: Record<string, any> = { ...existingBalances }

        if (hasBlockBalances) {
          mergedBalances.start = block.balances.start
          mergedBalances.income = block.balances.income
          mergedBalances.expense = block.balances.expense
          mergedBalances.end = block.balances.end

          const cleanReport = sanitizeDayReport({
            matrix: mergedMatrix,
            outputs: mergedOutputs,
            balances: block.balances,
            updatedAt: nowIso,
            updatedBy: session.name || 'Excel Import',
            isAutoGenerated: false,
            isUnfilled: false,
            status: 'completed',
          })
          // Ensure zero closing balances (like lemon = 0, cucumber = 0) are kept in end balances
          cleanReport.balances.end = { ...(cleanReport.balances.end || {}), ...block.balances.end }
          mergedBalances.report = cleanReport
        }

        await prisma.shopExpense.update({
          where: { date: dateStr },
          data: {
            materials: mergedMaterials,
            outputs: mergedOutputs,
            matrix: mergedMatrix,
            balances: mergedBalances,
          },
        })
        updatedDaysCount++
      } else {
        const initialOutputs: Record<string, any> = {}
        for (const [k, v] of Object.entries(gp)) {
          if (round2(toNum(v)) > 0) initialOutputs[k] = { kg: round2(toNum(v)) }
        }
        if (hasBlock && block.outputs) {
          for (const [k, v] of Object.entries(block.outputs as Record<string, any>)) {
            initialOutputs[k] = { ...(typeof initialOutputs[k] === 'object' ? initialOutputs[k] : {}), ...v }
          }
        }

        const initialMatrix = hasBlock ? block.matrix : {}
        const initialBalances: Record<string, any> = {}

        if (hasBlockBalances) {
          initialBalances.start = block.balances.start
          initialBalances.income = block.balances.income
          initialBalances.expense = block.balances.expense
          initialBalances.end = block.balances.end

          const cleanReport = sanitizeDayReport({
            matrix: initialMatrix,
            outputs: initialOutputs,
            balances: block.balances,
            updatedAt: nowIso,
            updatedBy: session.name || 'Excel Import',
            isAutoGenerated: false,
            isUnfilled: false,
            status: 'completed',
          })
          cleanReport.balances.end = { ...(cleanReport.balances.end || {}), ...block.balances.end }
          initialBalances.report = cleanReport
        }

        await prisma.shopExpense.create({
          data: {
            date: dateStr,
            materials: flat,
            outputs: initialOutputs,
            matrix: initialMatrix,
            balances: initialBalances,
          },
        })
        importedDaysCount++
      }
    }

    // Sync Warehouse InventoryBatches & Supply caches immediately after import
    await syncInventoryBatchesFromDailyBalances().catch((err) =>
      console.error('FIFO sync after import error:', err)
    )
    try {
      invalidateSupplyDashboardCache()
    } catch {}

    if (newArrivalsCount > 0 || updatedArrivalsCount > 0) {
      syncAllShopArrivalsToIncomingActs().catch((e) =>
        console.error('Auto sync acts from imported arrivals error:', e)
      )
    }

    const sortedDates = Array.from(datesFound).sort()
    const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : ''
    const latestMonth = latestDate ? latestDate.slice(0, 7) : ''
    const monthsFound = Array.from(new Set(sortedDates.map((d) => d.slice(0, 7)))).sort()

    // Record Audit Trail
    const totalRecordsAffected = newArrivalsCount + updatedArrivalsCount + importedDaysCount + updatedDaysCount
    await recordImportAudit({
      adminId: session.id,
      adminName: session.name || 'Administrator',
      adminRole: session.role,
      target,
      fileName,
      fileSize,
      reason,
      recordsCount: totalRecordsAffected,
      status: 'SUCCESS',
      details: `Yangi kirimlar: +${newArrivalsCount}, yangilangan kirimlar: ${updatedArrivalsCount}, yangi sex kunlari: +${importedDaysCount}, yangilangan sex kunlari: ${updatedDaysCount}`,
    })

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

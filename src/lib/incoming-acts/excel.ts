import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import {
  IncomingActRecord,
  PRODUCT_THEMES,
  getProductTheme,
  getRatingText
} from './constants'

export type { IncomingActRecord }
export { PRODUCT_THEMES, getProductTheme, getRatingText }

function cleanText(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object' && val.richText) {
    return val.richText.map((t: any) => t.text).join('').trim()
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }
  return String(val).trim()
}

function parseBoolNumber(val: any, defaultVal = 1): number {
  const s = cleanText(val).toLowerCase()
  if (!s) return defaultVal
  if (
    s === '1' ||
    s === 'да' ||
    s === 'da' ||
    s === 'ha' ||
    s === 'yes' ||
    s.includes('удовлетв') ||
    s.includes('соотв') ||
    s.includes('средн')
  ) {
    return 1
  }
  if (
    s === '0' ||
    s === 'нет' ||
    s === 'net' ||
    s === "yo'q" ||
    s === 'no' ||
    s.includes('отсут') ||
    s.includes('не имеет') ||
    s.includes('не обнаруж')
  ) {
    return 0
  }
  const n = parseInt(s, 10)
  if (!isNaN(n)) return n > 0 ? 1 : 0
  return defaultVal
}

function parseDefectNumber(val: any, defaultVal = 0): number {
  const s = cleanText(val).toLowerCase()
  if (!s) return defaultVal
  if (
    s === '0' ||
    s.includes('отсут') ||
    s === 'нет' ||
    s === 'net' ||
    s === "yo'q" ||
    s.includes('не имеет') ||
    s.includes('не обнаруж')
  ) {
    return 0
  }
  if (
    s === '1' ||
    s === 'да' ||
    s === 'da' ||
    s === 'ha' ||
    s.includes('есть') ||
    s.includes('обнаруж') ||
    s.includes('имеется')
  ) {
    return 1
  }
  const n = parseInt(s, 10)
  if (!isNaN(n)) return n
  return defaultVal
}

export function parseRating(val: any): number {
  const s = cleanText(val).toLowerCase()
  if (!s) return 4
  if (s === '5' || s.includes('идеал') || s.includes("a'lo") || s.includes('отлич')) return 5
  if (s === '4' || s.includes('допускается') || s.includes('yaxshi') || s.includes('хорош')) return 4
  if (s === '3' || s.includes('условно') || s.includes('shartli') || s.includes('сортировк')) return 3
  if (s === '2' || s.includes('не допускается') || s.includes('отклон') || s.includes('rad') || s.includes('брак'))
    return 2
  const num = parseInt(s, 10)
  if (num >= 2 && num <= 5) return num
  return 4
}

/**
 * Parses an Excel file (.xlsx) into IncomingActRecord list across ALL product sections
 */
export async function parseIncomingActsFromBuffer(buffer: Buffer): Promise<IncomingActRecord[]> {
  const wb = new ExcelJS.Workbook()
  // @ts-ignore
  await wb.xlsx.load(buffer)

  const ws = wb.getWorksheet('основное сырьё') || wb.worksheets[0]
  if (!ws) {
    throw new Error('Ishchi varaq topilmadi (Worksheet not found)')
  }

  const records: IncomingActRecord[] = []
  let currentProductCategory = 'САЛАТ АЙСБЕРГ'

  for (let r = 8; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)

    // Check for product header markers in row
    for (let c = 1; c <= 6; c++) {
      const v = cleanText(row.getCell(c).value)
      if (v.includes('Наименование основного СЫРЬЯ')) {
        const m = v.match(/СЫРЬЯ\s*-\s*(.+)/i)
        if (m) {
          const rawProd = m[1].trim()
          if (rawProd.includes('ТОМАТ')) currentProductCategory = 'ТОМАТ'
          else if (rawProd.includes('ЛУК')) currentProductCategory = 'ЛУК БЕЛЫЙ'
          else if (rawProd.includes('КАПУСТА')) currentProductCategory = 'КАПУСТА БЕЛОКОЧАННАЯ'
          else if (rawProd.includes('МОРКОВЬ')) currentProductCategory = 'МОРКОВЬ'
          else if (rawProd.includes('ОГУРЦ')) currentProductCategory = 'ОГУРЦЫ СВЕЖИЕ'
          else if (rawProd.includes('АЙСБЕРГ') || rawProd.includes('САЛАТ')) currentProductCategory = 'САЛАТ АЙСБЕРГ'
          else currentProductCategory = rawProd
        }
      }
    }

    const col2 = cleanText(row.getCell(2).value)
    const col3 = cleanText(row.getCell(3).value)
    const col4 = cleanText(row.getCell(4).value)
    const col5 = cleanText(row.getCell(5).value)
    const col22 = cleanText(row.getCell(22).value)

    // Skip headers or invalid rows
    if (!col2 || col2.toLowerCase().includes('п/п') || isNaN(parseInt(col2, 10))) {
      continue
    }
    if (!col3 && !col4 && !col5 && !col22) {
      continue
    }

    const actNum = col2
    let actDate = col3
    if (actDate.length > 10) actDate = actDate.substring(0, 10)

    let productName = currentProductCategory
    if (col4 && !col4.includes('Наименование основного СЫРЬЯ')) {
      const c4Upper = col4.toUpperCase()
      if (c4Upper.includes('ТОМАТ')) productName = 'ТОМАТ'
      else if (c4Upper.includes('ЛУК')) productName = 'ЛУК БЕЛЫЙ'
      else if (c4Upper.includes('КАПУСТА')) productName = 'КАПУСТА БЕЛОКОЧАННАЯ'
      else if (c4Upper.includes('МОРКОВ')) productName = 'МОРКОВЬ'
      else if (c4Upper.includes('ОГУРЦ')) productName = 'ОГУРЦЫ СВЕЖИЕ'
      else if (c4Upper.includes('АЙСБЕРГ') || c4Upper.includes('САЛАТ')) productName = 'САЛАТ АЙСБЕРГ'
      else productName = col4.trim()
    }

    const supplierName = col5 || "Noma'lum ta'minotchi"
    const rawCol6 = cleanText(row.getCell(6).value)
    const rawCol7 = cleanText(row.getCell(7).value)
    const rawCol8 = cleanText(row.getCell(8).value)
    const rawCol9 = cleanText(row.getCell(9).value)
    const rawCol10 = cleanText(row.getCell(10).value)
    const rawCol11 = cleanText(row.getCell(11).value)
    const rawCol12 = cleanText(row.getCell(12).value)
    const rawCol13 = cleanText(row.getCell(13).value)
    const rawCol14 = cleanText(row.getCell(14).value)
    const rawCol15 = cleanText(row.getCell(15).value)
    const rawCol16 = cleanText(row.getCell(16).value)
    const rawCol17 = cleanText(row.getCell(17).value)
    const rawCol18 = cleanText(row.getCell(18).value)
    const rawCol19 = cleanText(row.getCell(19).value)
    const rawCol20 = cleanText(row.getCell(20).value)
    const rawCol21 = cleanText(row.getCell(21).value)
    const rawCol23 = cleanText(row.getCell(23).value)
    const rawCol24 = cleanText(row.getCell(24).value)
    const rawCol25 = cleanText(row.getCell(25).value)
    const rawCol26 = cleanText(row.getCell(26).value)
    const rawCol27 = cleanText(row.getCell(27).value)

    const cell2Fill = row.getCell(2).fill as any
    const cell3Fill = row.getCell(3).fill as any
    const isYellow =
      (cell2Fill?.fgColor?.argb === 'FFFFFF00' || cell2Fill?.fgColor?.indexed === 6) ||
      (cell3Fill?.fgColor?.argb === 'FFFFFF00' || cell3Fill?.fgColor?.indexed === 6)

    const transportCondition = parseBoolNumber(rawCol7, 1)
    const hasDocumentation = parseBoolNumber(rawCol8, 0)
    const structure = parseBoolNumber(rawCol9, 1)
    const leafColor = parseBoolNumber(rawCol10, 1)
    const tasteSmell = parseBoolNumber(rawCol11, 1)
    const internalOxidation = parseDefectNumber(rawCol12, 0)
    const insectTraces = parseDefectNumber(rawCol13, 0)
    const rotDiseases = parseDefectNumber(rawCol14, 0)
    const stemCut = parseBoolNumber(rawCol15, 1)
    const density = parseBoolNumber(rawCol16, 1)
    const diameterWeight = rawCol17 || null
    const outerLeavesRemoved = parseBoolNumber(rawCol18, 1)
    const noMechanicalDamage = parseBoolNumber(rawCol19, 1)
    const batchNumber = rawCol20 || null
    const decisionRating = parseRating(rawCol21)
    const warehouseKg = parseFloat(col22.replace(',', '.')) || null
    const shopIssuedKg = rawCol23 || null
    const shopIssuedDate = rawCol24 || null
    const rejectionActNumber = rawCol25 || null
    const inspectorName = rawCol26 || 'Камбарова А.М.'
    const pricePerKg = parseFloat(rawCol27.replace(',', '.')) || null

    const rawValues = {
      col6: rawCol6,
      col7: rawCol7,
      col8: rawCol8,
      col9: rawCol9,
      col10: rawCol10,
      col11: rawCol11,
      col12: rawCol12,
      col13: rawCol13,
      col14: rawCol14,
      col15: rawCol15,
      col16: rawCol16,
      col17: rawCol17,
      col18: rawCol18,
      col19: rawCol19,
      col20: rawCol20,
      col21: rawCol21,
      col23: rawCol23,
      col24: rawCol24,
      col25: rawCol25,
      col26: rawCol26,
      col27: rawCol27,
      isYellow
    }

    records.push({
      actNumber: actNum,
      actDate,
      productName,
      supplierName,
      temperature: rawCol6 || null,
      transportCondition,
      hasDocumentation,
      structure,
      leafColor,
      tasteSmell,
      internalOxidation,
      insectTraces,
      rotDiseases,
      stemCut,
      density,
      diameterWeight,
      outerLeavesRemoved,
      noMechanicalDamage,
      batchNumber,
      decisionRating,
      decisionText: getRatingText(decisionRating, 'uz'),
      warehouseKg,
      shopIssuedKg,
      shopIssuedDate,
      rejectionActNumber,
      inspectorName,
      pricePerKg,
      rawValues
    })
  }

  return records
}

/**
 * Loads default company template from disk
 */
export async function loadDefaultTemplateActs(): Promise<IncomingActRecord[]> {
  const templatePath = path.join(process.cwd(), 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx')
  if (!fs.existsSync(templatePath)) {
    throw new Error('Shablon fayli topilmadi: ' + templatePath)
  }
  const buffer = fs.readFileSync(templatePath)
  return parseIncomingActsFromBuffer(buffer)
}

/**
 * Generates official Excel workbook with authentic colors per product and numeric representation
 */
export async function exportIncomingActsToExcel(
  acts: IncomingActRecord[],
  lang: 'uz' | 'ru' | 'en' = 'uz'
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Green Processing ERP'
  wb.created = new Date()

  const ws = wb.addWorksheet(
    lang === 'ru' ? 'Основное сырьё' : lang === 'en' ? 'Raw Material Acts' : 'Asosiy xomashyo'
  )

  // Configure column widths
  ws.columns = [
    { width: 4 }, // A margin
    { width: 8 }, // B № п/п
    { width: 14 }, // C Sana
    { width: 22 }, // D Xomashyo nomi
    { width: 24 }, // E Ta'minotchi
    { width: 14 }, // F Harorat
    { width: 14 }, // G Transport
    { width: 14 }, // H Hujjatlar
    { width: 16 }, // I Tuzilishi
    { width: 16 }, // J Rangi
    { width: 16 }, // K Ta'mi/Hidi
    { width: 14 }, // L Qizarish
    { width: 14 }, // M Hasharotlar
    { width: 14 }, // N Chirish
    { width: 14 }, // O Kesim
    { width: 14 }, // P Zichlik
    { width: 18 }, // Q O'lchami/Vazni
    { width: 14 }, // R Barglar
    { width: 14 }, // S Shikast yo'qligi
    { width: 14 }, // T Partiya №
    { width: 14 }, // U Baholash (2-5)
    { width: 14 }, // V Ombor (kg)
    { width: 16 }, // W Sexga berildi (kg)
    { width: 14 }, // X Berilgan sana
    { width: 14 }, // Y Brak akt №
    { width: 20 }, // Z Mas'ul nazoratchi
    { width: 14 } // AA Narx (so'm/kg)
  ]

  // Company Approval Header Block
  ws.mergeCells('T1:W4')
  const approvalCell = ws.getCell('T1')
  approvalCell.value =
    lang === 'ru'
      ? '"УТВЕРЖДАЮ"\nДиректор ООО "GREEN PROCESSING"\nИминов С.М.\n"01" мая 2025г'
      : lang === 'en'
      ? '"APPROVED"\nDirector of LLC "GREEN PROCESSING"\nIminov S.M.'
      : '"TASDIQLAYMAN"\n"GREEN PROCESSING" MChJ Direktori\nIminov S.M.'
  approvalCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  approvalCell.font = { bold: true, size: 9, name: 'Calibri' }

  ws.getCell('V6').value = 'Ф-2/03'
  ws.getCell('V6').font = { italic: true, bold: true, size: 10 }

  // Title Row
  ws.mergeCells('B5:S5')
  const titleCell = ws.getCell('B5')
  titleCell.value =
    lang === 'ru'
      ? 'ВХОДНОЕ СЫРЬЕ - ЖУРНАЛ АКТОВ ПРИЁМКИ И БРАКЕРАЖА'
      : lang === 'en'
      ? 'INCOMING RAW MATERIAL INSPECTION & ACCEPTANCE JOURNAL'
      : 'KIRUVCHI XOMASHYO - QABUL QILISH VA SIFAT AKTLARI JURNALI'
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

  // Legend Box (Explaining 2-5 and 1/0)
  ws.mergeCells('B7:AA7')
  const legendCell = ws.getCell('B7')
  legendCell.value =
    lang === 'ru'
      ? 'BAHOLASH / ОЦЕНКА: 5 = Идеал | 4 = Хорошо | 3 = Условно принято (сортировка/очистка) | 2 = Отклонено   ///   КРИТЕРИИ: 1 = Да/Соответствует/Удовлетворительно, 0 = Нет/Отсутствует'
      : 'BAHOLASH TIZIMI: 5 = Ideal | 4 = Yaxshi | 3 = Shartli qabul (saralash va tozalash) | 2 = Rad etilgan   ///   MEZONLAR: 1 = Ha/Muvofiq/Qoniqarli, 0 = Yo\'q/Mavjud emas'
  legendCell.font = { bold: true, size: 9, color: { argb: 'FF0F766E' } }
  legendCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FDFA' }
  }
  legendCell.alignment = { vertical: 'middle', horizontal: 'left' }
  legendCell.border = {
    top: { style: 'thin', color: { argb: 'FF0D9488' } },
    bottom: { style: 'thin', color: { argb: 'FF0D9488' } },
    left: { style: 'thin', color: { argb: 'FF0D9488' } },
    right: { style: 'thin', color: { argb: 'FF0D9488' } }
  }

  // Multi-tier header:
  // Row 8: Grouped header for 'Отпущено в производство'
  ws.mergeCells('V8:X8')
  const groupCell = ws.getCell('V8')
  groupCell.value = 'Отпущено в производство'
  groupCell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
  groupCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  groupCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Headers (Row 9)
  const headers = [
    { col: 2, label: '№ п/п' },
    { col: 3, label: lang === 'ru' ? 'Дата' : 'Sana' },
    { col: 4, label: lang === 'ru' ? 'Наименование СЫРЬЯ' : 'Xomashyo nomi' },
    { col: 5, label: lang === 'ru' ? 'Поставщик' : "Ta'minotchi" },
    { col: 6, label: lang === 'ru' ? 'Температура' : 'Harorat' },
    { col: 7, label: 'Условия трансп. [1/0]' },
    { col: 8, label: 'Документы [1/0]' },
    { col: 9, label: 'Структура [1/0]' },
    { col: 10, label: 'Цвет [1/0]' },
    { col: 11, label: 'Вкус/Запах [1/0]' },
    { col: 12, label: 'Окисление [0/1]' },
    { col: 13, label: 'Насекомые [0/1]' },
    { col: 14, label: 'Слизь/Гниль [0/1]' },
    { col: 15, label: 'Кочерыжка/Срез [1/0]' },
    { col: 16, label: 'Плотность [1/0]' },
    { col: 17, label: 'Диаметр/Вес' },
    { col: 18, label: 'Покр. листья [1/0]' },
    { col: 19, label: 'Без дефектов [1/0]' },
    { col: 20, label: '№ партии' },
    { col: 21, label: 'Допуск [2-5]' },
    { col: 22, label: 'кг склад' },
    { col: 23, label: 'КГ ЦЕХ' },
    { col: 24, label: 'Дата' },
    { col: 25, label: '№ забраковки' },
    { col: 26, label: 'ФИО контролёра' },
    { col: 27, label: 'Цена' }
  ]

  const headerRow = ws.getRow(9)
  headerRow.height = 34

  headers.forEach(h => {
    const cell = headerRow.getCell(h.col)
    cell.value = h.label
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9, name: 'Calibri' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    }
  })

  // Data Rows
  let startRowIndex = 10
  let totalWarehouseKg = 0

  acts.forEach((act, idx) => {
    const row = ws.getRow(startRowIndex + idx)
    row.height = 22

    if (act.warehouseKg) totalWarehouseKg += act.warehouseKg

    row.getCell(2).value = act.actNumber || String(idx + 1)
    row.getCell(3).value = act.actDate
    row.getCell(4).value = act.productName
    row.getCell(5).value = act.supplierName
    row.getCell(6).value = act.temperature || '-'
    row.getCell(7).value = act.transportCondition
    row.getCell(8).value = act.hasDocumentation
    row.getCell(9).value = act.structure
    row.getCell(10).value = act.leafColor
    row.getCell(11).value = act.tasteSmell
    row.getCell(12).value = act.internalOxidation
    row.getCell(13).value = act.insectTraces
    row.getCell(14).value = act.rotDiseases
    row.getCell(15).value = act.stemCut
    row.getCell(16).value = act.density
    row.getCell(17).value = act.diameterWeight || '-'
    row.getCell(18).value = act.outerLeavesRemoved
    row.getCell(19).value = act.noMechanicalDamage
    row.getCell(20).value = act.batchNumber || '-'
    row.getCell(21).value = act.decisionRating
    row.getCell(22).value = act.warehouseKg ?? ''
    row.getCell(23).value = act.shopIssuedKg || ''
    row.getCell(24).value = act.shopIssuedDate || ''
    row.getCell(25).value = act.rejectionActNumber || ''
    row.getCell(26).value = act.inspectorName || ''
    row.getCell(27).value = act.pricePerKg ?? ''

    const isYellow = act.rawValues?.isYellow

    for (let c = 2; c <= 27; c++) {
      const cell = row.getCell(c)
      cell.font = { size: 9, name: 'Calibri' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }

      if (isYellow && c !== 21) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      }

      if (
        (c >= 7 && c <= 16) ||
        c === 18 ||
        c === 19 ||
        c === 2 ||
        c === 3 ||
        c === 6 ||
        c === 20 ||
        c === 21
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (c === 22 || c === 27) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    }

    const ratingCell = row.getCell(21)
    ratingCell.font = { bold: true, size: 10, name: 'Calibri' }
    if (act.decisionRating === 5) {
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
      ratingCell.font = { bold: true, color: { argb: 'FF065F46' } }
    } else if (act.decisionRating === 4) {
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
      ratingCell.font = { bold: true, color: { argb: 'FF1E40AF' } }
    } else if (act.decisionRating === 3) {
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
      ratingCell.font = { bold: true, color: { argb: 'FF92400E' } }
    } else if (act.decisionRating === 2) {
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
      ratingCell.font = { bold: true, color: { argb: 'FF991B1B' } }
    }

    if (act.warehouseKg) row.getCell(22).numFmt = '#,##0.0'
    if (act.pricePerKg) row.getCell(27).numFmt = '#,##0'
  })

  const totalRowIdx = startRowIndex + acts.length
  const totalRow = ws.getRow(totalRowIdx)
  totalRow.height = 24

  ws.mergeCells(`B${totalRowIdx}:U${totalRowIdx}`)
  const totalLabel = totalRow.getCell(2)
  totalLabel.value = `JAMI AKT JURNALI (Aktlar: ${acts.length} ta)`
  totalLabel.font = { bold: true, size: 10 }
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalKgCell = totalRow.getCell(22)
  totalKgCell.value = totalWarehouseKg
  totalKgCell.numFmt = '#,##0.0'
  totalKgCell.font = { bold: true, size: 10, color: { argb: 'FF1E3A8A' } }
  totalKgCell.alignment = { vertical: 'middle', horizontal: 'right' }

  for (let c = 2; c <= 27; c++) {
    const cell = totalRow.getCell(c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

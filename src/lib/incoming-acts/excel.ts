import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

export interface IncomingActRecord {
  id?: number
  actNumber: string
  actDate: string
  productName: string
  supplierName: string
  temperature?: string | null
  transportCondition: number // 1 / 0
  hasDocumentation: number // 1 / 0
  structure: number // 1 / 0
  leafColor: number // 1 / 0
  tasteSmell: number // 1 / 0
  internalOxidation: number // 0 / 1
  insectTraces: number // 0 / 1
  rotDiseases: number // 0 / 1
  stemCut: number // 1 / 0
  density: number // 1 / 0
  diameterWeight?: string | null
  outerLeavesRemoved: number // 1 / 0
  noMechanicalDamage: number // 1 / 0
  batchNumber?: string | null
  decisionRating: number // 2, 3, 4, 5
  decisionText?: string | null
  warehouseKg?: number | null
  shopIssuedKg?: string | null
  shopIssuedDate?: string | null
  rejectionActNumber?: string | null
  inspectorName?: string | null
  pricePerKg?: number | null
  notes?: string | null
}

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
  // 0 = absent (norma/good)
  // 1 = present (defect)
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

export function getRatingText(rating: number, lang: 'uz' | 'ru' | 'en' = 'uz'): string {
  switch (rating) {
    case 5:
      return lang === 'ru' ? 'Идеал' : lang === 'en' ? 'Ideal' : 'Ideal'
    case 4:
      return lang === 'ru' ? 'Хорошо' : lang === 'en' ? 'Good' : 'Yaxshi'
    case 3:
      return lang === 'ru'
        ? 'Условно принято (сортировка/очистка)'
        : lang === 'en'
        ? 'Conditional acceptance (sorting/cleaning required)'
        : 'Shartli qabul (saralash va tozalash talab etiladi)'
    case 2:
      return lang === 'ru' ? 'Отклонено' : lang === 'en' ? 'Rejected' : 'Rad etilgan'
    default:
      return lang === 'ru' ? 'Хорошо' : lang === 'en' ? 'Good' : 'Yaxshi'
  }
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
 * Parses an Excel file (.xlsx) into IncomingActRecord list
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
  let currentCategory = 'Салат Айсберг'

  for (let r = 8; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const col4 = cleanText(row.getCell(4).value)

    if (col4.includes('Наименование основного СЫРЬЯ')) {
      const match = col4.match(/СЫРЬЯ\s*-\s*(.+)/i)
      if (match) currentCategory = match[1].trim()
      continue
    }

    const col2 = cleanText(row.getCell(2).value)
    const col3 = cleanText(row.getCell(3).value)
    const col5 = cleanText(row.getCell(5).value)

    // Skip headers or invalid rows
    if (!col2 || col2.toLowerCase().includes('п/п') || !col3 || col3.toLowerCase().includes('дата')) {
      continue
    }

    const actNum = col2
    let actDate = col3
    if (actDate.length > 10) actDate = actDate.substring(0, 10)

    const productName = col4 || currentCategory
    const supplierName = col5 || "Noma'lum ta'minotchi"
    const temperature = cleanText(row.getCell(6).value) || null
    const transportCondition = parseBoolNumber(row.getCell(7).value, 1)
    const hasDocumentation = parseBoolNumber(row.getCell(8).value, 0)
    const structure = parseBoolNumber(row.getCell(9).value, 1)
    const leafColor = parseBoolNumber(row.getCell(10).value, 1)
    const tasteSmell = parseBoolNumber(row.getCell(11).value, 1)
    const internalOxidation = parseDefectNumber(row.getCell(12).value, 0)
    const insectTraces = parseDefectNumber(row.getCell(13).value, 0)
    const rotDiseases = parseDefectNumber(row.getCell(14).value, 0)
    const stemCut = parseBoolNumber(row.getCell(15).value, 1)
    const density = parseBoolNumber(row.getCell(16).value, 1)
    const diameterWeight = cleanText(row.getCell(17).value) || null
    const outerLeavesRemoved = parseBoolNumber(row.getCell(18).value, 1)
    const noMechanicalDamage = parseBoolNumber(row.getCell(19).value, 1)
    const batchNumber = cleanText(row.getCell(20).value) || null
    const decisionRating = parseRating(row.getCell(21).value)
    const warehouseKg = parseFloat(cleanText(row.getCell(22).value).replace(',', '.')) || null
    const shopIssuedKg = cleanText(row.getCell(23).value) || null
    const shopIssuedDate = cleanText(row.getCell(24).value) || null
    const rejectionActNumber = cleanText(row.getCell(25).value) || null
    const inspectorName = cleanText(row.getCell(26).value) || 'Камбарова А.М.'
    const pricePerKg = parseFloat(cleanText(row.getCell(27).value).replace(',', '.')) || null

    records.push({
      actNumber: actNum,
      actDate,
      productName,
      supplierName,
      temperature,
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
      pricePerKg
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
 * Generates official Excel workbook with numeric representation
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
    { width: 22 }, // E Ta'minotchi
    { width: 14 }, // F Harorat
    { width: 12 }, // G Transport (1/0)
    { width: 12 }, // H Hujjatlar (1/0)
    { width: 12 }, // I Tuzilishi (1/0)
    { width: 12 }, // J Rangi (1/0)
    { width: 12 }, // K Ta'mi/Hidi (1/0)
    { width: 12 }, // L Qizarish/Oksidlanish (0/1)
    { width: 12 }, // M Hasharotlar (0/1)
    { width: 12 }, // N Chirish/Shilimshiq (0/1)
    { width: 12 }, // O Kesim (1/0)
    { width: 12 }, // P Zichlik (1/0)
    { width: 16 }, // Q O'lchami/Vazni
    { width: 12 }, // R Barglar (1/0)
    { width: 12 }, // S Shikastlanish yo'qligi (1/0)
    { width: 14 }, // T Partiya №
    { width: 12 }, // U Baholash (2,3,4,5)
    { width: 14 }, // V Ombor (kg)
    { width: 16 }, // W Sexga berildi (kg)
    { width: 14 }, // X Berilgan sana
    { width: 14 }, // Y Brak akti №
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
      : "KIRUVCHI XOMASHYO - QABUL QILISH VA SIFAT AKTLARI JURNALI"
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

  // Legend Box (Explaining 2-5 and 1/0)
  ws.mergeCells('B7:AA7')
  const legendCell = ws.getCell('B7')
  legendCell.value =
    lang === 'ru'
      ? 'BAHOLASH / ОЦЕНКА:  5 = Идеал (Отлично) | 4 = Хорошо | 3 = Условно принято (требуется сортировка и очистка) | 2 = Отклонено (Брак)   ///   КРИТЕРИИ / MEZONLAR: 1 = Да/Соответствует/Удовлетворительно, 0 = Нет/Отсутствует'
      : lang === 'en'
      ? 'RATING SCALE: 5 = Ideal (Excellent) | 4 = Good | 3 = Conditional acceptance (sorting/cleaning required) | 2 = Rejected (Defect)   ///   CRITERIA: 1 = Yes/Satisfactory/Standard, 0 = No/Absent'
      : "BAHOLASH TIZIMI: 5 = Ideal | 4 = Yaxshi | 3 = Shartli qabul (saralash va tozalash talab etiladi) | 2 = Rad etilgan (Brak)   ///   MEZONLAR: 1 = Ha/Muvofiq/Qoniqarli, 0 = Yo'q/Mavjud emas"
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

  // Headers (Row 8-9)
  const headers = [
    { col: 2, label: '№ п/п' },
    { col: 3, label: lang === 'ru' ? 'Дата' : lang === 'en' ? 'Date' : 'Sana' },
    { col: 4, label: lang === 'ru' ? 'Сырьё' : lang === 'en' ? 'Product' : 'Xomashyo' },
    { col: 5, label: lang === 'ru' ? 'Поставщик' : lang === 'en' ? 'Supplier' : "Ta'minotchi" },
    { col: 6, label: lang === 'ru' ? 'Температура' : lang === 'en' ? 'Temp' : 'Harorat' },
    { col: 7, label: lang === 'ru' ? 'Условия трансп. [1/0]' : lang === 'en' ? 'Transport [1/0]' : 'Transport [1/0]' },
    { col: 8, label: lang === 'ru' ? 'Документы [1/0]' : lang === 'en' ? 'Docs [1/0]' : 'Hujjatlar [1/0]' },
    { col: 9, label: lang === 'ru' ? 'Структура [1/0]' : lang === 'en' ? 'Structure [1/0]' : 'Tuzilishi [1/0]' },
    { col: 10, label: lang === 'ru' ? 'Цвет листьев [1/0]' : lang === 'en' ? 'Color [1/0]' : 'Rangi [1/0]' },
    { col: 11, label: lang === 'ru' ? 'Вкус/Запах [1/0]' : lang === 'en' ? 'Taste/Smell [1/0]' : "Ta'mi/Hidi [1/0]" },
    { col: 12, label: lang === 'ru' ? 'Окисление [0/1]' : lang === 'en' ? 'Oxidation [0/1]' : 'Qizarish [0/1]' },
    { col: 13, label: lang === 'ru' ? 'Насекомые [0/1]' : lang === 'en' ? 'Insects [0/1]' : 'Hasharot [0/1]' },
    { col: 14, label: lang === 'ru' ? 'Слизь/Гниль [0/1]' : lang === 'en' ? 'Rot/Slime [0/1]' : 'Chirish [0/1]' },
    { col: 15, label: lang === 'ru' ? 'Кочерыжка [1/0]' : lang === 'en' ? 'Stem cut [1/0]' : 'Kesim [1/0]' },
    { col: 16, label: lang === 'ru' ? 'Плотность [1/0]' : lang === 'en' ? 'Density [1/0]' : 'Zichlik [1/0]' },
    { col: 17, label: lang === 'ru' ? 'Диаметр/Вес' : lang === 'en' ? 'Diameter/Weight' : "Hajm/Og'irlik" },
    { col: 18, label: lang === 'ru' ? 'Покр. листья [1/0]' : lang === 'en' ? 'Leaves [1/0]' : 'Barglar [1/0]' },
    { col: 19, label: lang === 'ru' ? 'Без дефектов [1/0]' : lang === 'en' ? 'No damage [1/0]' : 'Shikast yo\'q [1/0]' },
    { col: 20, label: lang === 'ru' ? '№ партии' : lang === 'en' ? 'Batch #' : 'Partiya №' },
    { col: 21, label: lang === 'ru' ? 'Допуск [2-5]' : lang === 'en' ? 'Verdict [2-5]' : 'Baholash [2-5]' },
    { col: 22, label: lang === 'ru' ? 'Приём склад (кг)' : lang === 'en' ? 'Warehouse (kg)' : 'Ombor (kg)' },
    { col: 23, label: lang === 'ru' ? 'Отпущено в цех (кг)' : lang === 'en' ? 'Shop issued (kg)' : 'Sexga berildi (kg)' },
    { col: 24, label: lang === 'ru' ? 'Дата цех' : lang === 'en' ? 'Shop date' : 'Sex sanasi' },
    { col: 25, label: lang === 'ru' ? '№ забраковки' : lang === 'en' ? 'Rejection #' : 'Brak akt №' },
    { col: 26, label: lang === 'ru' ? 'ФИО контролёра' : lang === 'en' ? 'Inspector' : "Nazoratchi F.I.O" },
    { col: 27, label: lang === 'ru' ? 'Цена (сум/кг)' : lang === 'en' ? 'Price (uzs/kg)' : "Narx (so'm/kg)" }
  ]

  const headerRow = ws.getRow(9)
  headerRow.height = 32

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

    // Alignments & numbers formatting
    for (let c = 2; c <= 27; c++) {
      const cell = row.getCell(c)
      cell.font = { size: 9, name: 'Calibri' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }

      // Center numbers for criteria
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

    // Rating cell style (Col 21)
    const ratingCell = row.getCell(21)
    ratingCell.font = { bold: true, size: 10, name: 'Calibri' }
    if (act.decisionRating === 5) {
      // 5: Ideal (Emerald green)
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
      ratingCell.font = { bold: true, color: { argb: 'FF065F46' } }
    } else if (act.decisionRating === 4) {
      // 4: Yaxshi (Blue)
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
      ratingCell.font = { bold: true, color: { argb: 'FF1E40AF' } }
    } else if (act.decisionRating === 3) {
      // 3: Shartli qabul (Yellow/Amber)
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
      ratingCell.font = { bold: true, color: { argb: 'FF92400E' } }
    } else if (act.decisionRating === 2) {
      // 2: Rad etilgan (Red)
      ratingCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
      ratingCell.font = { bold: true, color: { argb: 'FF991B1B' } }
    }

    // Number formats
    if (act.warehouseKg) {
      row.getCell(22).numFmt = '#,##0.0'
    }
    if (act.pricePerKg) {
      row.getCell(27).numFmt = '#,##0'
    }
  })

  // Summary Row
  const totalRowIdx = startRowIndex + acts.length
  const totalRow = ws.getRow(totalRowIdx)
  totalRow.height = 24

  ws.mergeCells(`B${totalRowIdx}:U${totalRowIdx}`)
  const totalLabel = totalRow.getCell(2)
  totalLabel.value =
    lang === 'ru'
      ? `ИТОГО ПО ЖУРНАЛУ (Актов: ${acts.length})`
      : lang === 'en'
      ? `TOTAL (Acts: ${acts.length})`
      : `JAMI AKT JURNALI (Aktlar: ${acts.length} ta)`
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

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

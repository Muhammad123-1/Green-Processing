// Shared definitions for the "Производственный отчет ЦЕХ" module.
// Used by BOTH the React components and the API routes so that the
// field names / template layout never drift apart.

export const normKey = (s: any) => String(s ?? '').toLowerCase().replace(/\s+/g, '')

export const isDateStr = (s: any) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

export const toNum = (v: any): number => {
  if (v === null || v === undefined || v === '') return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/**
 * Universal Excel sana o'quvchi (Short & Long date, Serial, Date object).
 * Korxona standarti: KUN / OY / YIL (DD.MM.YYYY yoki DD/MM/YYYY).
 */
export function parseExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return ''
  if (typeof val === 'object' && val.result !== undefined && val.result !== null) {
    val = val.result
  }

  // 1. Agar JavaScript Date obyekti bo'lsa (UTC uslubida xavfsiz olish)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ''
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 2. Agar Excel serial number bo'lsa (masalan 45547)
  if (typeof val === 'number') {
    if (val > 30000 && val < 65000) {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000))
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  }

  let s = String(val).trim().toLowerCase()
  s = s.replace(/(г\.|года|год|йили|й\.|yili|г)/g, '').trim()

  // 3. Agar allaqachon ISO YYYY-MM-DD bo'lsa
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // 4. "Dlinniy sana" (Long Date): Masalan "12 сентября 2025", "12-sentabr 2025", "12 September 2025"
  const monthMap: Record<string, string> = {
    'янв': '01', 'jan': '01', 'yan': '01',
    'фев': '02', 'feb': '02', 'fev': '02',
    'мар': '03', 'mar': '03',
    'апр': '04', 'apr': '04',
    'май': '05', 'мая': '05', 'may': '05',
    'июн': '06', 'jun': '06', 'iyun': '06',
    'июл': '07', 'jul': '07', 'iyul': '07',
    'авг': '08', 'aug': '08', 'avg': '08',
    'сен': '09', 'sep': '09', 'sen': '09',
    'окт': '10', 'oct': '10', 'okt': '10',
    'ноя': '11', 'nov': '11', 'noy': '11',
    'дек': '12', 'dec': '12'
  }

  for (const [prefix, monthNum] of Object.entries(monthMap)) {
    if (s.includes(prefix)) {
      const match = s.match(/(\d{1,2})[^\d]+(?:[a-zа-яё]+)[^\d]+(\d{4})/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const year = match[2]
        return `${year}-${monthNum}-${day}`
      }
    }
  }

  // 5. "Karotkiy sana" (Short Date): DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const parts = s.split(/[\.\/\-]/).map((p) => p.trim())
  if (parts.length === 3) {
    let [p1, p2, p3] = parts
    // Agar YYYY/MM/DD bo'lsa:
    if (p1.length === 4) {
      let m = parseInt(p2, 10)
      let d = parseInt(p3, 10)
      if (m > 12 && d <= 12) { const t = m; m = d; d = t }
      return `${p1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    // Agar yil oxirida bo'lsa:
    if (p3.length === 2) p3 = '20' + p3
    if (p3.length === 4) {
      let n1 = parseInt(p1, 10) // odatda Kun (DD)
      let n2 = parseInt(p2, 10) // odatda Oy (MM)
      if (!isNaN(n1) && !isNaN(n2)) {
        let day = n1
        let month = n2
        if (month > 12 && day <= 12) {
          // Swap: masalan 09/15/2025 -> month=9, day=15
          month = n1
          day = n2
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${p3}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
      }
    }
  }

  return ''
}

export function formatDMY(dateStr: any): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`
  }
  return dateStr
}

/**
 * Sanani oy nomi bilan uzun formatda ko'rsatish (Long Date format).
 * Misol: "2026-08-03" -> Uzbek: "3-avgust, 2026", Russian: "3 августа 2026 г."
 */
export function formatLongDate(dateStr: any, lang: string = 'uz'): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  let y = '', m = '', d = ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-')
    y = parts[0]
    m = parts[1]
    d = parts[2]
  } else {
    const parsed = parseExcelDate(dateStr)
    if (parsed && /^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      const parts = parsed.split('-')
      y = parts[0]
      m = parts[1]
      d = parts[2]
    } else {
      return String(dateStr)
    }
  }

  const dayNum = parseInt(d, 10)
  if (isNaN(dayNum)) return String(dateStr)

  const uzMonths: Record<string, string> = {
    '01': 'yanvar',
    '02': 'fevral',
    '03': 'mart',
    '04': 'aprel',
    '05': 'may',
    '06': 'iyun',
    '07': 'iyul',
    '08': 'avgust',
    '09': 'sentabr',
    '10': 'oktabr',
    '11': 'noyabr',
    '12': 'dekabr',
  }
  const ruMonths: Record<string, string> = {
    '01': 'января',
    '02': 'февраля',
    '03': 'марта',
    '04': 'апреля',
    '05': 'мая',
    '06': 'июня',
    '07': 'июля',
    '08': 'августа',
    '09': 'сентября',
    '10': 'октября',
    '11': 'ноября',
    '12': 'декабря',
  }

  if (lang === 'ru') {
    const monthName = ruMonths[m] || m
    return `${dayNum} ${monthName} ${y} г.`
  } else {
    const monthName = uzMonths[m] || m
    return `${dayNum}-${monthName}, ${y}`
  }
}

// -----------------------------------------------------------------------------
// TAB 2: Расход (flat per-day totals) -> ShopExpense.materials
// -----------------------------------------------------------------------------
export interface ExpenseField {
  field: string
  label: string
  unit: string
  aliases: string[] // first alias is the canonical key written to the DB
}

export const EXPENSE_FIELDS: ExpenseField[] = [
  { field: 'iceberg', label: 'Айсберг', unit: 'кг', aliases: ['Айсберг', 'Салат Айсберг'] },
  { field: 'tomatoes', label: 'ТОМАТЫ', unit: 'кг', aliases: ['ТОМАТЫ', 'Томаты', 'Помидоры'] },
  { field: 'onion', label: 'Лук', unit: 'кг', aliases: ['Лук', 'Лук салатный белый'] },
  { field: 'cabbage', label: 'Капуста', unit: 'кг', aliases: ['Капуста', 'Капуста белокочанная'] },
  { field: 'carrot', label: 'Морковь', unit: 'кг', aliases: ['Морковь'] },
  { field: 'lemon', label: 'Лимон', unit: 'кг', aliases: ['Лимон', 'Лимоны'] },
  { field: 'cucumber', label: 'Огурцы свежие', unit: 'кг', aliases: ['Огурцы свежие', 'Огурцы', 'Огурец'] },
  { field: 'bag', label: 'Пакет', unit: 'шт', aliases: ['Пакет'] },
  { field: 'box', label: 'Коробки', unit: 'шт', aliases: ['Коробки'] },
  { field: 'chlorine', label: 'Хлор', unit: 'кг', aliases: ['Хлор', 'Гипохлорит'] },
  { field: 'sorbat', label: 'Сорбат', unit: 'кг', aliases: ['Сорбат', 'Сорбат калия'] },
  { field: 'benzoat', label: 'Бензоат', unit: 'кг', aliases: ['Бензоат', 'Бензоат натрия'] },
  { field: 'vinegar', label: 'Уксус', unit: 'кг', aliases: ['Уксус', 'Уксусная кислота'] },
  { field: 'taygeta', label: 'Тайгета 218', unit: 'л', aliases: ['Тайгета 218', 'Тайгета'] },
  { field: 'boxDefect', label: 'Коробки БРАК', unit: 'шт', aliases: ['Коробки БРАК', 'Коробки2 БРАК', 'Коробки 2 БРАК'] },
  { field: 'bagDefect', label: 'Пакет БРАК', unit: 'шт', aliases: ['Пакет БРАК', 'Пакет 2 БРАК', 'Пакет2 БРАК'] },
  { field: 'ses', label: 'СЕС', unit: 'кг', aliases: ['СЕС', 'SES'] },
  { field: 'kitchen', label: 'КУХНЯ', unit: 'кг', aliases: ['КУХНЯ', 'Кухня', 'Ошхона'] },
  { field: 'lolloRosso', label: 'Lollo Rosso', unit: 'кг', aliases: ['Lollo Rosso', 'Лолло Россо'] },
  { field: 'rukkola', label: 'Руккола', unit: 'кг', aliases: ['Руккола', 'Рукола'] },
  { field: 'spinach', label: 'Шпинат', unit: 'кг', aliases: ['Шпинат'] },
  { field: 'mint', label: 'Мята', unit: 'кг', aliases: ['Мята'] },
  { field: 'celery', label: 'Сельдерей', unit: 'кг', aliases: ['Сельдерей'] },
  { field: 'icebergLeaf', label: 'Айсберг (листовой)', unit: 'кг', aliases: ['Айсберг (листовой)', 'Листовой айсберг'] },
]

/** DB record -> flat row used by the Tab 2 table. */
export function readExpenseRow(rec: {
  date: string
  materials?: any
  createdAt?: any
  updatedAt?: any
  isEdited?: boolean
  editReason?: string | null
  editedAt?: any
  editedBy?: string | null
}) {
  const materials = (rec.materials || {}) as Record<string, any>
  const normalized: Record<string, any> = {}
  for (const [k, v] of Object.entries(materials)) normalized[normKey(k)] = v
  const row: Record<string, any> = {
    date: rec.date,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    isEdited: Boolean(rec.isEdited),
    editReason: rec.editReason || null,
    editedAt: rec.editedAt || null,
    editedBy: rec.editedBy || null,
  }
  for (const f of EXPENSE_FIELDS) {
    let val: any = 0
    for (const a of f.aliases) {
      const hit = normalized[normKey(a)]
      if (hit !== undefined && hit !== null) {
        val = hit
        break
      }
    }
    row[f.field] = toNum(val)
  }
  return row
}

/**
 * Apply an edited Tab 2 row on top of the stored materials.
 * Materials that are not part of the table (Мята, Шпинат, ...) are kept untouched.
 */
export function applyExpenseRow(existing: any, row: Record<string, any>) {
  const materials: Record<string, any> = { ...(existing || {}) }
  for (const f of EXPENSE_FIELDS) {
    const aliasSet = new Set(f.aliases.map(normKey))
    const existingKeys = Object.keys(materials).filter((k) => aliasSet.has(normKey(k)))
    const value = toNum(row[f.field])
    if (value === 0) {
      existingKeys.forEach((k) => delete materials[k])
    } else {
      const targetKey = existingKeys[0] || f.aliases[0]
      existingKeys.slice(1).forEach((k) => delete materials[k])
      materials[targetKey] = value
    }
  }
  return materials
}

// -----------------------------------------------------------------------------
// TAB GP: Выпуск готовой продукции (ГП) -> ShopExpense.outputs
// -----------------------------------------------------------------------------
export interface GPField {
  field: string
  label: string
  unit: string
  aliases: string[]
}

export const GP_FIELDS: GPField[] = [
  { field: 'iceberg', label: 'Айсберг', unit: 'кг', aliases: ['Айсберг', 'Салат Айсберг', 'Салат Айсберг нарезанный'] },
  { field: 'tomatoes', label: 'ТОМАТЫ', unit: 'кг', aliases: ['ТОМАТЫ', 'Томаты', 'Томаты целые'] },
  { field: 'onion', label: 'Лук', unit: 'кг', aliases: ['Лук', 'Лук салатный белый', 'Лук салатный белый нарезанный'] },
  { field: 'coleslaw', label: 'Коул Слоу', unit: 'кг', aliases: ['Коул Слоу', 'Салат Коул Слоу'] },
  { field: 'lemon', label: 'Лимон', unit: 'кг', aliases: ['Лимон'] },
  { field: 'cucumbers', label: 'Огурцы свежие', unit: 'кг', aliases: ['Огурцы свежие', 'Огурцы'] },
  { field: 'mixSalad', label: 'Микс салат', unit: 'кг', aliases: ['Микс салат'] },
  { field: 'mint', label: 'Мята', unit: 'кг', aliases: ['Мята'] },
  { field: 'celery', label: 'Сельдерей', unit: 'кг', aliases: ['Сельдерей'] },
  { field: 'icebergLeaf', label: 'Айсберг (листовой)', unit: 'кг', aliases: ['Айсберг (листовой)', 'Айсберг листовой'] },
]

export function readGPRow(rec: {
  date: string
  outputs?: any
  createdAt?: any
  updatedAt?: any
  isEdited?: boolean
  editReason?: string | null
  editedAt?: any
  editedBy?: string | null
}) {
  const outputs = (rec.outputs || {}) as Record<string, any>
  const normalized: Record<string, any> = {}
  for (const [k, v] of Object.entries(outputs)) {
    const val = typeof v === 'object' && v !== null ? ((v as any).kg ?? (v as any).val ?? 0) : v
    normalized[normKey(k)] = val
  }
  const row: Record<string, any> = {
    date: rec.date,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    isEdited: Boolean(rec.isEdited),
    editReason: rec.editReason || null,
    editedAt: rec.editedAt || null,
    editedBy: rec.editedBy || null,
  }
  for (const f of GP_FIELDS) {
    let val: any = 0
    for (const a of f.aliases) {
      const hit = normalized[normKey(a)]
      if (hit !== undefined && hit !== null) {
        val = hit
        break
      }
    }
    row[f.field] = toNum(val)
  }
  return row
}

export function applyGPRow(existingOutputs: any, row: Record<string, any>) {
  const outputs: Record<string, any> = { ...(existingOutputs || {}) }
  for (const f of GP_FIELDS) {
    const aliasSet = new Set(f.aliases.map(normKey))
    const existingKeys = Object.keys(outputs).filter((k) => aliasSet.has(normKey(k)))
    const value = toNum(row[f.field])
    const targetKey = existingKeys[0] || f.aliases[0]
    
    if (value === 0) {
      existingKeys.forEach((k) => delete outputs[k])
    } else {
      existingKeys.slice(1).forEach((k) => delete outputs[k])
      if (typeof outputs[targetKey] === 'object' && outputs[targetKey] !== null) {
        outputs[targetKey] = { ...outputs[targetKey], kg: value }
      } else {
        outputs[targetKey] = { kg: value }
      }
    }
  }
  return outputs
}

// -----------------------------------------------------------------------------
// TAB 3: daily workshop report -> ShopExpense.balances.report
// (kept under its own key so it never mixes with the noisy imported matrix)
// -----------------------------------------------------------------------------
export const RAW_ROWS = [
  'Салат Айсберг',
  'Томаты',
  'Лук салатный белый',
  'Капуста/Морковь',
  'Лимон',
  'Пакет вакуумный 30*35',
  'Коробка из гофрокартона',
  'Этикетка 56*60',
]

export interface MatrixCol {
  key: string
  label: string
  green?: boolean
}

export const MATRIX_COLS: MatrixCol[] = [
  { key: 'Приход в цех', label: 'Приход в цех' },
  { key: 'Салат Айсберг нарезанный', label: 'Салат Айсберг нарезанный' },
  { key: 'Томаты целые', label: 'Томаты целые' },
  { key: 'Лук салатный белый нарезанный', label: 'Лук салатный белый нарезанный' },
  { key: 'Капуста', label: 'Капуста' },
  { key: 'Морковь', label: 'Морковь' },
  { key: 'СЭС', label: 'СЭС', green: true },
  { key: 'КУХНЯ', label: 'КУХНЯ', green: true },
]

// Highlighted (yellow) "main" cells of the Excel template
export const MATRIX_HIGHLIGHT: Record<string, string[]> = {
  'Салат Айсберг': ['Салат Айсберг нарезанный'],
  'Томаты': ['Томаты целые'],
  'Лук салатный белый': ['Лук салатный белый нарезанный'],
  'Капуста/Морковь': ['Капуста', 'Морковь'],
  'Лимон': ['СЭС', 'КУХНЯ'],
}

export const OUTPUT_ROWS = [
  'Салат Айсберг нарезанный',
  'Томаты целые',
  'Лук салатный белый нарезанный',
  'Коул Слоу',
  'Лимон',
  'Огурцы свежие',
  'Микс салат',
  'Мята',
  'Сельдерей',
  'Айсберг (листовой)',
]

export const OUTPUT_FIELDS = [
  { key: 'kg', label: 'Кол-во ГП, кг', main: true },
  { key: 'upakovki', label: 'Упаковки, шт' },
  { key: 'korobki', label: 'Коробки, шт' },
  { key: 'ses', label: 'Кол-во ГП, кг СЭС', green: true },
  { key: 'kitchen', label: 'Кол-во ГП, кг КУХНЯ', green: true },
] as const

export type OutputFieldKey = (typeof OUTPUT_FIELDS)[number]['key']

export const BALANCE_COLS = [
  { key: 'iceberg', label: 'Салат Айсберг' },
  { key: 'tomato', label: 'Томат' },
  { key: 'onion', label: 'Лук салатный белый' },
  { key: 'cabbage', label: 'Капуста белокочанная' },
  { key: 'carrot', label: 'Морковь' },
  { key: 'lemon', label: 'Лимон' },
]

export const BALANCE_ROWS = [
  { key: 'start', label: 'остатка начало дня' },
  { key: 'income', label: 'приход' },
  { key: 'expense', label: 'расход' },
  { key: 'end', label: 'остатка конец дня' },
] as const

// % of raw material losses: (raw - finished) / raw * 100
export const PERCENT_COLS = [
  'Салат Айсберг нарезанный',
  'Томаты целые',
  'Лук салатный белый нарезанный',
  'Коул Слоу',
  'Лимон',
]

export interface PercentRowDef {
  name: string
  norm: string
  /** index into PERCENT_COLS; undefined => not auto-calculated */
  col?: number
  /** raw consumption cells [matrixRow, matrixCol] that are summed */
  raw?: [string, string][]
}

export const PERCENT_ROWS: PercentRowDef[] = [
  { name: 'Салат Айсберг', norm: '25-35', col: 0, raw: [['Салат Айсберг', 'Салат Айсберг нарезанный']] },
  { name: 'Томаты', norm: '15', col: 1, raw: [['Томаты', 'Томаты целые']] },
  { name: 'Лук салатный белый', norm: '20-25', col: 2, raw: [['Лук салатный белый', 'Лук салатный белый нарезанный']] },
  { name: 'Капуста/Морковь', norm: '', col: 3, raw: [['Капуста/Морковь', 'Капуста'], ['Капуста/Морковь', 'Морковь']] },
  { name: 'Лимон', norm: '', col: 4, raw: [['Лимон', 'СЭС'], ['Лимон', 'КУХНЯ']] },
  { name: 'Пакет вакуумный (Салат Айсберг)', norm: '12.07' },
  { name: 'Пакет вакуумный (Томаты)', norm: '12.07' },
  { name: 'Пакет вакуумный (Лук)', norm: '32' },
  { name: 'Этикетка 56*60 (Салат Айсберг)', norm: '11.19' },
  { name: 'Этикетка 56*60 (Томаты)', norm: '11.19' },
  { name: 'Этикетка 56*60 (Лук)', norm: '30.5' },
  { name: 'Коробка из гофрокартона (Салат Айсберг, Томаты, Лук)', norm: '5.56' },
]

export interface DayReport {
  matrix: Record<string, Record<string, number>>
  outputs: Record<string, Partial<Record<OutputFieldKey, number>>>
  balances: Record<string, Record<string, number>>
  updatedAt?: string
  updatedBy?: string
  isAutoGenerated?: boolean
  isUnfilled?: boolean
  status?: 'completed' | 'unfilled'
}

export const emptyDayReport = (): DayReport => ({ matrix: {}, outputs: {}, balances: {} })

export const hasReportData = (r: DayReport | null | undefined) =>
  !!r &&
  !r.isUnfilled &&
  r.status !== 'unfilled' &&
  (Object.keys(r.matrix || {}).length > 0 ||
    Object.keys(r.outputs || {}).length > 0 ||
    Object.keys(r.balances || {}).length > 0)

/** Keep only template keys + finite non-zero numbers. Used on the server before saving. */
export function sanitizeDayReport(input: any): DayReport {
  const out = emptyDayReport()
  const src = input || {}

  for (const row of RAW_ROWS) {
    for (const col of MATRIX_COLS) {
      const v = toNum(src.matrix?.[row]?.[col.key])
      if (v !== 0) {
        out.matrix[row] = out.matrix[row] || {}
        out.matrix[row][col.key] = v
      }
    }
  }

  for (const name of OUTPUT_ROWS) {
    for (const f of OUTPUT_FIELDS) {
      const v = toNum(src.outputs?.[name]?.[f.key])
      if (v !== 0) {
        out.outputs[name] = out.outputs[name] || {}
        out.outputs[name][f.key] = v
      }
    }
  }

  for (const row of BALANCE_ROWS) {
    for (const col of BALANCE_COLS) {
      const v = toNum(src.balances?.[row.key]?.[col.key])
      if (v !== 0) {
        out.balances[row.key] = out.balances[row.key] || {}
        out.balances[row.key][col.key] = v
      }
    }
  }

  out.updatedAt = src.updatedAt
  out.updatedBy = src.updatedBy
  out.isAutoGenerated = Boolean(src.isAutoGenerated)
  out.isUnfilled = Boolean(src.isUnfilled || src.status === 'unfilled')
  out.status = src.status || (out.isUnfilled ? 'unfilled' : 'completed')

  return out
}

/** Read the clean daily report out of a ShopExpense record. */
export function getDayReport(rec: { balances?: any } | null | undefined): DayReport | null {
  const r = (rec?.balances as any)?.report
  if (!r || typeof r !== 'object') return null
  const clean = sanitizeDayReport(r)
  clean.updatedAt = r.updatedAt
  clean.updatedBy = r.updatedBy
  clean.isAutoGenerated = Boolean(r.isAutoGenerated)
  clean.isUnfilled = Boolean(r.isUnfilled || r.status === 'unfilled')
  clean.status = r.status || (clean.isUnfilled ? 'unfilled' : 'completed')
  return clean
}

export interface AutoDayReportResult {
  report: DayReport
  hasData: boolean
  status: 'completed' | 'unfilled'
  arrivalsCount: number
  totalArrivalKg: number
  totalExpenseKg: number
  totalOutputKg: number
  summary: {
    iceberg: { arrival: number; expense: number; output: number }
    tomato: { arrival: number; expense: number; output: number }
    onion: { arrival: number; expense: number; output: number }
    cabbage: { arrival: number; expense: number; output: number }
    carrot: { arrival: number; expense: number; output: number }
    lemon: { arrival: number; expense: number; output: number }
  }
}

export function autoBuildDayReport(
  date: string,
  arrivalsList: any[],
  expenseRecord: { materials?: any; matrix?: any; outputs?: any; balances?: any } | null | undefined,
  prevEnd?: Record<string, number> | null
): AutoDayReportResult {
  const dayArrivals = (arrivalsList || []).filter((a) => a.date === date)
  const materials = (expenseRecord?.materials || {}) as Record<string, any>
  const outputs = (expenseRecord?.outputs || {}) as Record<string, any>
  const existingMatrix = (expenseRecord?.matrix || {}) as Record<string, any>

  const getArrivalSum = (keywords: string[]) => {
    return dayArrivals
      .filter((a) => {
        const nom = String(a.nomenclature || '').toLowerCase()
        return keywords.some((kw) => nom.includes(kw.toLowerCase()))
      })
      .reduce((sum, a) => sum + toNum(a.quantity), 0)
  }

  const getExpenseSum = (aliases: string[]) => {
    const normAliases = aliases.map(normKey)
    let total = 0
    for (const [k, v] of Object.entries(materials)) {
      if (normAliases.includes(normKey(k))) {
        total += toNum(v)
      }
    }
    return total
  }

  const icebergArr = getArrivalSum(['айсберг', 'салат айсберг'])
  const tomatoArr = getArrivalSum(['томат', 'помидор'])
  const onionArr = getArrivalSum(['лук', 'пиёз'])
  const cabbageArr = getArrivalSum(['капуста', 'karam'])
  const carrotArr = getArrivalSum(['морковь', 'sabzi'])
  const lemonArr = getArrivalSum(['лимон', 'lemon'])
  const bagArr = getArrivalSum(['пакет'])
  const boxArr = getArrivalSum(['коробк'])
  const labelArr = getArrivalSum(['этикетк'])

  const icebergExp = getExpenseSum(['Айсберг', 'Салат Айсберг'])
  const tomatoExp = getExpenseSum(['ТОМАТЫ', 'Томаты'])
  const onionExp = getExpenseSum(['Лук', 'Лук салатный белый'])
  const cabbageExp = getExpenseSum(['Капуста'])
  const carrotExp = getExpenseSum(['Морковь'])
  const lemonExp = getExpenseSum(['Лимон'])
  const sesExp = getExpenseSum(['СЕС', 'СЭС'])
  const kitchenExp = getExpenseSum(['КУХНЯ'])
  const bagExp = getExpenseSum(['Пакет'])
  const boxExp = getExpenseSum(['Коробки'])

  const report: DayReport = {
    matrix: {},
    outputs: {},
    balances: {
      start: {},
      income: {},
      expense: {},
      end: {}
    }
  }

  // 1. Table 1 Matrix: Приход в цех
  if (icebergArr) report.matrix['Салат Айсберг'] = { 'Приход в цех': icebergArr }
  if (tomatoArr) report.matrix['Томаты'] = { 'Приход в цех': tomatoArr }
  if (onionArr) report.matrix['Лук салатный белый'] = { 'Приход в цех': onionArr }
  if (cabbageArr || carrotArr) report.matrix['Капуста/Морковь'] = { 'Приход в цех': Math.round((cabbageArr + carrotArr) * 1000) / 1000 }
  if (lemonArr) report.matrix['Лимон'] = { 'Приход в цех': lemonArr }
  if (bagArr) report.matrix['Пакет вакуумный 30*35'] = { 'Приход в цех': bagArr }
  if (boxArr) report.matrix['Коробка из гофрокартона'] = { 'Приход в цех': boxArr }
  if (labelArr) report.matrix['Этикетка 56*60'] = { 'Приход в цех': labelArr }

  // 1b. Table 1 Matrix: Расход
  const mapMatrixCell = (row: string, col: string, val: number) => {
    if (!val) return
    report.matrix[row] = report.matrix[row] || {}
    report.matrix[row][col] = val
  }

  let hasExistingMatrix = false
  for (const r of RAW_ROWS) {
    if (existingMatrix[r]) {
      for (const c of MATRIX_COLS) {
        if (c.key === 'Приход в цех') continue
        const v = toNum(existingMatrix[r]?.[c.key])
        if (v > 0) {
          mapMatrixCell(r, c.key, v)
          hasExistingMatrix = true
        }
      }
    }
  }

  if (!hasExistingMatrix) {
    if (icebergExp) mapMatrixCell('Салат Айсберг', 'Салат Айсберг нарезанный', icebergExp)
    if (tomatoExp) mapMatrixCell('Томаты', 'Томаты целые', tomatoExp)
    if (onionExp) mapMatrixCell('Лук салатный белый', 'Лук салатный белый нарезанный', onionExp)
    if (cabbageExp) mapMatrixCell('Капуста/Морковь', 'Капуста', cabbageExp)
    if (carrotExp) mapMatrixCell('Капуста/Морковь', 'Морковь', carrotExp)
    if (sesExp) mapMatrixCell('Лимон', 'СЭС', sesExp)
    if (kitchenExp) mapMatrixCell('Лимон', 'КУХНЯ', kitchenExp)
  }

  // 2. Table 2: Outputs (Выход ГП КФС)
  let totalOutputKg = 0
  for (const r of OUTPUT_ROWS) {
    const match = outputs[r] || outputs[normKey(r)]
    let rowData: Partial<Record<OutputFieldKey, number>> = {}
    if (typeof match === 'object' && match !== null) {
      for (const f of OUTPUT_FIELDS) {
        const v = toNum(match[f.key])
        if (v > 0) rowData[f.key] = v
      }
    } else if (typeof match === 'number' && match > 0) {
      rowData.kg = match
    } else {
      for (const gf of GP_FIELDS) {
        if (gf.aliases.some((a) => normKey(a) === normKey(r))) {
          const aliasHit = outputs[gf.field] || outputs[gf.label]
          if (typeof aliasHit === 'object' && aliasHit !== null) {
            for (const f of OUTPUT_FIELDS) {
              const v = toNum(aliasHit[f.key])
              if (v > 0) rowData[f.key] = v
            }
          } else if (typeof aliasHit === 'number' && aliasHit > 0) {
            rowData.kg = aliasHit
          }
        }
      }
    }
    if (Object.keys(rowData).length > 0) {
      report.outputs[r] = rowData
      totalOutputKg += toNum(rowData.kg)
    }
  }

  // 3. Table 4: Balances (Остатки)
  const balanceMap: Record<string, { arr: number; exp: number }> = {
    iceberg: { arr: icebergArr, exp: icebergExp },
    tomato: { arr: tomatoArr, exp: tomatoExp },
    onion: { arr: onionArr, exp: onionExp },
    cabbage: { arr: cabbageArr, exp: cabbageExp },
    carrot: { arr: carrotArr, exp: carrotExp },
    lemon: { arr: lemonArr, exp: lemonExp + sesExp + kitchenExp },
  }

  const round3 = (n: number) => Math.round(n * 1000) / 1000

  for (const col of BALANCE_COLS) {
    const s = toNum(prevEnd?.[col.key])
    const i = balanceMap[col.key]?.arr || 0
    const e = balanceMap[col.key]?.exp || 0
    if (s > 0) report.balances.start[col.key] = s
    if (i > 0) report.balances.income[col.key] = i
    if (e > 0) report.balances.expense[col.key] = e
    if (s > 0 || i > 0 || e > 0) {
      report.balances.end[col.key] = round3(s + i - e)
    }
  }

  const totalArrivalKg = Math.round((icebergArr + tomatoArr + onionArr + cabbageArr + carrotArr + lemonArr) * 1000) / 1000
  const totalExpenseKg = Math.round((icebergExp + tomatoExp + onionExp + cabbageExp + carrotExp + lemonExp + sesExp + kitchenExp) * 1000) / 1000

  const hasData = dayArrivals.length > 0 || totalArrivalKg > 0 || totalExpenseKg > 0 || totalOutputKg > 0

  return {
    report: sanitizeDayReport(report),
    hasData,
    status: hasData ? 'completed' : 'unfilled',
    arrivalsCount: dayArrivals.length,
    totalArrivalKg,
    totalExpenseKg,
    totalOutputKg: Math.round(totalOutputKg * 1000) / 1000,
    summary: {
      iceberg: { arrival: icebergArr, expense: icebergExp, output: toNum(report.outputs['Салат Айсберг нарезанный']?.kg) },
      tomato: { arrival: tomatoArr, expense: tomatoExp, output: toNum(report.outputs['Томаты целые']?.kg) },
      onion: { arrival: onionArr, expense: onionExp, output: toNum(report.outputs['Лук салатный белый нарезанный']?.kg) },
      cabbage: { arrival: cabbageArr, expense: cabbageExp, output: toNum(report.outputs['Коул Слоу']?.kg) },
      carrot: { arrival: carrotArr, expense: carrotExp, output: toNum(report.outputs['Коул Слоу']?.kg) },
      lemon: { arrival: lemonArr, expense: lemonExp + sesExp + kitchenExp, output: toNum(report.outputs['Лимон']?.kg) },
    }
  }
}

export interface PercentResult {
  name: string
  norm: string
  values: (number | null)[] // per PERCENT_COLS
}

export function computePercents(report: DayReport): PercentResult[] {
  return PERCENT_ROWS.map((def) => {
    const values: (number | null)[] = PERCENT_COLS.map(() => null)
    if (def.col !== undefined && def.raw) {
      const raw = def.raw.reduce((s, [r, c]) => s + toNum(report.matrix?.[r]?.[c]), 0)
      const finished = toNum(report.outputs?.[PERCENT_COLS[def.col]]?.kg)
      if (raw > 0 && finished > 0) {
        values[def.col] = Math.round(((raw - finished) / raw) * 1000) / 10
      }
    }
    return { name: def.name, norm: def.norm, values }
  })
}

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
  rawValues?: Record<string, any> | null
}

export const PRODUCT_THEMES: Record<
  string,
  {
    name: string
    color: string
    bgHeader: string
    textColor: string
    badgeBg: string
    badgeText: string
    col9: string
    col10: string
    col11: string
    col12: string
    col13: string
    col14: string
    col15: string
    col16: string
    col17: string
    col18: string
    col19: string
  }
> = {
  ТОМАТ: {
    name: 'ТОМАТ',
    color: '#FF3300',
    bgHeader: 'bg-[#FF3300]',
    textColor: 'text-black',
    badgeBg: 'bg-red-100 border-red-300',
    badgeText: 'text-red-900',
    col9: 'Консистенция: томаты упругие, неперезрелые, сочные',
    col10: 'Цвет светло-красный и красный',
    col11: 'Вкус, запах свежий, свойственный данному сорту',
    col12: 'Размер плодов (от 6,0 до 7,0 см)',
    col13: 'Следы насекомых и пораженные ими места',
    col14: 'Слизь, разложение, поражение болезнями и гниль',
    col15: 'Плоды с легкими нажимами от тары, помятостью',
    col16: 'С зарубцевавшимися трещинами не более 1 см',
    col17: 'Плоды с трещинами',
    col18: 'Упакованные в один ряд',
    col19: 'Отсутствие механические повреждения'
  },
  'ЛУК БЕЛЫЙ': {
    name: 'ЛУК БЕЛЫЙ',
    color: '#BFBFBF',
    bgHeader: 'bg-[#BFBFBF]',
    textColor: 'text-black',
    badgeBg: 'bg-slate-200 border-slate-300',
    badgeText: 'text-slate-900',
    col9: 'Консистенция: хрустящий, крепкий с сочной волокнистой структурой',
    col10: 'Цвет: однородный по окраске, белый, светло-зеленый',
    col11: 'Вкус, запах свежий, свойственный данному сорту',
    col12: 'Размер плодов (от 5,0 до 6,0 см)',
    col13: 'Следы насекомых и пораженные ими места',
    col14: 'Слизь, разложение, поражение болезнями и гниль',
    col15: 'Луковицы с черными пятнами на внешнем слое',
    col16: 'Оголенные от верхних защитных чешуй',
    col17: 'Открывшаяся луковица, выпустившая ростки (стрелку)',
    col18: 'Двойные луковицы, не покрытые одной рубашкой',
    col19: 'Отсутствие механические повреждения'
  },
  'САЛАТ АЙСБЕРГ': {
    name: 'САЛАТ АЙСБЕРГ',
    color: '#92D050',
    bgHeader: 'bg-[#92D050]',
    textColor: 'text-black',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    col9: 'Структура: Листья салата плотные, сочные с хрустящей структурой',
    col10: 'Цвет листьев от светло-желтого до светло-зеленого и насыщенно-зеленого',
    col11: 'Вкус, запах свежий, свойственный данному сорту',
    col12: 'Внутреннее окисление (порозовение)',
    col13: 'Следы насекомых и пораженные ими места',
    col14: 'Слизь, разложение, поражение болезнями и гниль',
    col15: 'В разрезе кочерыжка ровная, не более 3 см высотой',
    col16: 'В разрезе плотность средней плотности',
    col17: 'Диаметр кочана не менее 12 см, Мин. вес кочана',
    col18: 'Удаленными покровными листьями темно-зеленого цвета',
    col19: 'Отсутствие механические повреждения'
  },
  'КАПУСТА БЕЛОКОЧАННАЯ': {
    name: 'КАПУСТА БЕЛОКОЧАННАЯ',
    color: '#4BFF60',
    bgHeader: 'bg-[#4BFF60]',
    textColor: 'text-black',
    badgeBg: 'bg-green-100 border-green-300',
    badgeText: 'text-green-900',
    col9: 'Консистенция: плотная, сочная, хрустящая',
    col10: 'Цвет: окраска листьев от белого до светло-зеленого',
    col11: 'Вкус, запах свежий',
    col12: 'Зачистка кочана до плотно облегающих листьев',
    col13: 'Следы насекомых и вредителей',
    col14: 'Слизь, гниль, поражения болезнями',
    col15: 'Капуста старая с желтыми листьями или проросшая',
    col16: 'В разрезе структура плотная',
    col17: 'Размер и вес кочана',
    col18: 'Плотность кочана: плотные или менее плотные',
    col19: 'Отсутствие механические повреждения'
  },
  МОРКОВЬ: {
    name: 'МОРКОВЬ',
    color: '#FF5B11',
    bgHeader: 'bg-[#FF5B11]',
    textColor: 'text-black',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    col9: 'Консистенция: мякоть доброкачественная, плотная, сочная',
    col10: 'Цвет: оранжевая или насыщенно-желтая окраска',
    col11: 'Вкус, запах свежий, без постороннего запаха',
    col12: 'Морковь увядшая, морщинистая, замороженная',
    col13: 'Следы вредителей и повреждения',
    col14: 'Слизь, гниль, черная плесень',
    col15: 'Наличие уродливых или искривленных плодов',
    col16: 'Размер по наибольшему диаметру (3-4 см)',
    col17: 'Длина и диаметр корнеплода',
    col18: 'Треснутая с открытой сердцевиной',
    col19: 'Отсутствие механические повреждения'
  },
  'ОГУРЦЫ СВЕЖИЕ': {
    name: 'ОГУРЦЫ СВЕЖИЕ',
    color: '#15803D',
    bgHeader: 'bg-[#15803D]',
    textColor: 'text-white',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    col9: 'Консистенция: крепкие, хрустящие, плотные',
    col10: 'Цвет: зеленый, однородный',
    col11: 'Вкус, запах свежий, без горечи',
    col12: 'Размер плодов (длина, диаметр)',
    col13: 'Следы насекомых и вредителей',
    col14: 'Слизь, разложение, гниль',
    col15: 'Плоды с помятостями от тары',
    col16: 'Искривленные или уродливые плоды',
    col17: 'Плотность мякоти',
    col18: 'Упаковка и укладка',
    col19: 'Отсутствие механические повреждения'
  }
}

export function getProductTheme(productName: string) {
  const p = (productName || '').toUpperCase()
  if (p.includes('ТОМАТ') || p.includes('ПОМИДОР')) return PRODUCT_THEMES['ТОМАТ']
  if (p.includes('ЛУК') || p.includes('ПИЁЗ') || p.includes('PIYOZ')) return PRODUCT_THEMES['ЛУК БЕЛЫЙ']
  if (p.includes('КАПУСТА') || p.includes('KARAM')) return PRODUCT_THEMES['КАПУСТА БЕЛОКОЧАННАЯ']
  if (p.includes('МОРКОВ') || p.includes('SABZI')) return PRODUCT_THEMES['МОРКОВЬ']
  if (p.includes('ОГУР') || p.includes('BODRING')) return PRODUCT_THEMES['ОГУРЦЫ СВЕЖИЕ']
  return PRODUCT_THEMES['САЛАТ АЙСБЕРГ']
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

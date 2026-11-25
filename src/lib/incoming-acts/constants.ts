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

export interface ProductThemeConfig {
  name: { uz: string; ru: string; en: string }
  color: string
  bgHeader: string
  textColor: string
  badgeBg: string
  badgeText: string
  col9: { uz: string; ru: string; en: string }
  col10: { uz: string; ru: string; en: string }
  col11: { uz: string; ru: string; en: string }
  col12: { uz: string; ru: string; en: string }
  col13: { uz: string; ru: string; en: string }
  col14: { uz: string; ru: string; en: string }
  col15: { uz: string; ru: string; en: string }
  col16: { uz: string; ru: string; en: string }
  col17: { uz: string; ru: string; en: string }
  col18: { uz: string; ru: string; en: string }
  col19: { uz: string; ru: string; en: string }
}

export interface ProductTheme {
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

export const PRODUCT_THEMES_CONFIG: Record<string, ProductThemeConfig> = {
  ТОМАТ: {
    name: { uz: 'POMIDOR', ru: 'ТОМАТ', en: 'TOMATO' },
    color: '#FF3300',
    bgHeader: 'bg-[#FF3300]',
    textColor: 'text-black',
    badgeBg: 'bg-red-100 border-red-300',
    badgeText: 'text-red-900',
    col9: {
      uz: "Konsistensiyasi: pomidorlar tarang, me'yorida pishgan, sersuv",
      ru: 'Консистенция: томаты упругие, неперезрелые, сочные',
      en: 'Consistency: firm, not overripe, juicy tomatoes'
    },
    col10: {
      uz: 'Rangi: och qizil va qizil',
      ru: 'Цвет светло-красный и красный',
      en: 'Color: light red and red'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, ushbu navga xos",
      ru: 'Вкус, запах свежий, свойственный данному сорту',
      en: 'Taste, smell: fresh, characteristic of the variety'
    },
    col12: {
      uz: "Meva o'lchami (6,0 dan 7,0 sm gacha)",
      ru: 'Размер плодов (от 6,0 до 7,0 см)',
      en: 'Fruit size (from 6.0 to 7.0 cm)'
    },
    col13: {
      uz: 'Hasharot izlari va zararlangan joylar',
      ru: 'Следы насекомых и пораженные ими места',
      en: 'Traces of insects and affected areas'
    },
    col14: {
      uz: 'Shilimshiq, aynish, kasallik va chirish',
      ru: 'Слизь, разложение, поражение болезнями и гниль',
      en: 'Slime, decomposition, disease and rot'
    },
    col15: {
      uz: "Idish bosimidan ezilgan, g'ijimlangan mevalar",
      ru: 'Плоды с легкими нажимами от тары, помятостью',
      en: 'Fruits with slight container pressure, bruising'
    },
    col16: {
      uz: 'Chandiqlangan yoriqlari 1 sm dan oshmagan',
      ru: 'С зарубцевавшимися трещинами не более 1 см',
      en: 'With healed cracks not more than 1 cm'
    },
    col17: {
      uz: 'Yoriqlari bor mevalar',
      ru: 'Плоды с трещинами',
      en: 'Fruits with cracks'
    },
    col18: {
      uz: 'Bir qator qilib qadoqlangan',
      ru: 'Упакованные в один ряд',
      en: 'Packed in a single layer'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  'ЛУК БЕЛЫЙ': {
    name: { uz: 'OQ PIYOZ', ru: 'ЛУК БЕЛЫЙ', en: 'WHITE ONION' },
    color: '#BFBFBF',
    bgHeader: 'bg-[#BFBFBF]',
    textColor: 'text-black',
    badgeBg: 'bg-slate-200 border-slate-300',
    badgeText: 'text-slate-900',
    col9: {
      uz: 'Konsistensiyasi: qarsildoq, mustahkam, sersuv tolali',
      ru: 'Консистенция: хрустящий, крепкий с сочной волокнистой структурой',
      en: 'Consistency: crispy, firm with juicy fibrous structure'
    },
    col10: {
      uz: 'Rangi: bir xil tusda, oq, och yashil',
      ru: 'Цвет: однородный по окраске, белый, светло-зеленый',
      en: 'Color: uniform color, white, light green'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, ushbu navga xos",
      ru: 'Вкус, запах свежий, свойственный данному сорту',
      en: 'Taste, smell: fresh, characteristic of the variety'
    },
    col12: {
      uz: "Piyoz o'lchami (5,0 dan 6,0 sm gacha)",
      ru: 'Размер плодов (от 5,0 до 6,0 см)',
      en: 'Bulb size (from 5.0 to 6.0 cm)'
    },
    col13: {
      uz: 'Hasharot izlari va zararlangan joylar',
      ru: 'Следы насекомых и пораженные ими места',
      en: 'Traces of insects and affected areas'
    },
    col14: {
      uz: 'Shilimshiq, aynish, kasallik va chirish',
      ru: 'Слизь, разложение, поражение болезнями и гниль',
      en: 'Slime, decomposition, disease and rot'
    },
    col15: {
      uz: "Tashqi qatlamida qora dog'lari bor piyozlar",
      ru: 'Луковицы с черными пятнами на внешнем слое',
      en: 'Bulbs with black spots on outer layer'
    },
    col16: {
      uz: "Ustki himoya qobig'i to'kilgan (ochilib qolgan)",
      ru: 'Оголенные от верхних защитных чешуй',
      en: 'Stripped of upper protective scales'
    },
    col17: {
      uz: "Ko'kargan, naycha chiqargan piyozlar",
      ru: 'Открывшаяся луковица, выпустившая ростки (стрелку)',
      en: 'Opened bulbs with sprouts (shooting)'
    },
    col18: {
      uz: "Umumiy qobiqsiz qo'shaloq piyozlar",
      ru: 'Двойные луковицы, не покрытые одной рубашкой',
      en: 'Double bulbs not covered by single skin'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  'САЛАТ АЙСБЕРГ': {
    name: { uz: 'AYSBERG SALATI', ru: 'САЛАТ АЙСБЕРГ', en: 'ICEBERG LETTUCE' },
    color: '#92D050',
    bgHeader: 'bg-[#92D050]',
    textColor: 'text-black',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    col9: {
      uz: 'Tuzilishi: barglari zich, sersuv va qarsildoq',
      ru: 'Структура: Листья салата плотные, сочные с хрустящей структурой',
      en: 'Structure: leaves dense, juicy with crispy texture'
    },
    col10: {
      uz: "Barg rangi: och sariqdan och yashil va to'q yashilgacha",
      ru: 'Цвет листьев от светло-желтого до светло-зеленого и насыщенно-зеленого',
      en: 'Leaf color: light yellow to light green and deep green'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, ushbu navga xos",
      ru: 'Вкус, запах свежий, свойственный данному сорту',
      en: 'Taste, smell: fresh, characteristic of the variety'
    },
    col12: {
      uz: 'Ichki oksidlanish (pushtirang tusga kirish)',
      ru: 'Внутреннее окисление (порозовение)',
      en: 'Internal oxidation (pinking)'
    },
    col13: {
      uz: 'Hasharot izlari va zararlangan joylar',
      ru: 'Следы насекомых и пораженные ими места',
      en: 'Traces of insects and affected areas'
    },
    col14: {
      uz: 'Shilimshiq, aynish, kasallik va chirish',
      ru: 'Слизь, разложение, поражение болезнями и гниль',
      en: 'Slime, decomposition, disease and rot'
    },
    col15: {
      uz: "Kesilganda o'zagi tekis, 3 sm dan oshmagan",
      ru: 'В разрезе кочерыжка ровная, не более 3 см высотой',
      en: 'Core flat in cut, height not more than 3 cm'
    },
    col16: {
      uz: "Kesilganda zichligi o'rtacha",
      ru: 'В разрезе плотность средней плотности',
      en: 'Medium density in cut'
    },
    col17: {
      uz: 'Kachan diametri kamida 12 sm, minimal vazn',
      ru: 'Диаметр кочана не менее 12 см, Мин. вес кочана',
      en: 'Head diameter not less than 12 cm, min weight'
    },
    col18: {
      uz: "To'q yashil tashqi barglari tozalangan",
      ru: 'Удаленными покровными листьями темно-зеленого цвета',
      en: 'Outer dark green covering leaves removed'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  'КАПУСТА БЕЛОКОЧАННАЯ': {
    name: { uz: 'OQ KARAM', ru: 'КАПУСТА БЕЛОКОЧАННАЯ', en: 'WHITE CABBAGE' },
    color: '#4BFF60',
    bgHeader: 'bg-[#4BFF60]',
    textColor: 'text-black',
    badgeBg: 'bg-green-100 border-green-300',
    badgeText: 'text-green-900',
    col9: {
      uz: 'Konsistensiyasi: zich, sersuv, qarsildoq',
      ru: 'Консистенция: плотная, сочная, хрустящая',
      en: 'Consistency: dense, juicy, crispy'
    },
    col10: {
      uz: 'Rangi: barglar rangi oqdan och yashilgacha',
      ru: 'Цвет: окраска листьев от белого до светло-зеленого',
      en: 'Color: leaf color from white to light green'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, xos",
      ru: 'Вкус, запах свежий',
      en: 'Taste, smell: fresh'
    },
    col12: {
      uz: 'Karam boshi zich yopishgan barglargacha tozalangan',
      ru: 'Зачистка кочана до плотно облегающих листьев',
      en: 'Head trimmed to tightly adhering leaves'
    },
    col13: {
      uz: 'Hasharot va zararkunandalar izlari',
      ru: 'Следы насекомых и вредителей',
      en: 'Traces of insects and pests'
    },
    col14: {
      uz: 'Shilimshiq, chirish, kasallik alomatlari',
      ru: 'Слизь, гниль, поражения болезнями',
      en: 'Slime, rot, disease damage'
    },
    col15: {
      uz: "Eski, sarg'aygan yoki o'sib ketgan karam",
      ru: 'Капуста старая с желтыми листьями или проросшая',
      en: 'Old cabbage with yellow leaves or sprouted'
    },
    col16: {
      uz: 'Kesilganda tuzilishi zich',
      ru: 'В разрезе структура плотная',
      en: 'Dense structure in cross section'
    },
    col17: {
      uz: "Karam boshi o'lchami va og'irligi",
      ru: 'Размер и вес кочана',
      en: 'Head size and weight'
    },
    col18: {
      uz: 'Karam boshi zichligi: zich yoki kamroq zich',
      ru: 'Плотность кочана: плотные или менее плотные',
      en: 'Head density: dense or moderately dense'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  МОРКОВЬ: {
    name: { uz: 'SABZI', ru: 'МОРКОВЬ', en: 'CARROT' },
    color: '#FF5B11',
    bgHeader: 'bg-[#FF5B11]',
    textColor: 'text-black',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    col9: {
      uz: 'Konsistensiyasi: eti sifatli, zich, sersuv',
      ru: 'Консистенция: мякоть доброкачественная, плотная, сочная',
      en: 'Consistency: sound flesh, firm, juicy'
    },
    col10: {
      uz: "Rangi: to'q sariq (olovrang) yoki sariq tusda",
      ru: 'Цвет: оранжевая или насыщенно-желтая окраска',
      en: 'Color: orange or deep yellow color'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, begona hidsiz",
      ru: 'Вкус, запах свежий, без постороннего запаха',
      en: 'Taste, smell: fresh, without foreign odor'
    },
    col12: {
      uz: "So'ligan, ajinlangan, muzlatilgan sabzi",
      ru: 'Морковь увядшая, морщинистая, замороженная',
      en: 'Wilted, shriveled, frozen carrots'
    },
    col13: {
      uz: 'Zararkunandalar izlari va shikastlanishlar',
      ru: 'Следы вредителей и повреждения',
      en: 'Pest traces and damages'
    },
    col14: {
      uz: "Shilimshiq, chirish, qora mog'or",
      ru: 'Слизь, гниль, черная плесень',
      en: 'Slime, rot, black mold'
    },
    col15: {
      uz: 'Xunuk shaklli yoki qiyshaygan ildizmevalar',
      ru: 'Наличие уродливых или искривленных плодов',
      en: 'Deformed or crooked roots present'
    },
    col16: {
      uz: "Eng katta diametri bo'yicha o'lchami (3-4 sm)",
      ru: 'Размер по наибольшему диаметру (3-4 см)',
      en: 'Size by largest diameter (3-4 cm)'
    },
    col17: {
      uz: 'Ildizmeva uzunligi va diametri',
      ru: 'Длина и диаметр корнеплода',
      en: 'Root length and diameter'
    },
    col18: {
      uz: "Yorilgan, o'zagi ochilib qolgan",
      ru: 'Треснутая с открытой сердцевиной',
      en: 'Cracked with exposed core'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  'ОГУРЦЫ СВЕЖИЕ': {
    name: { uz: 'YANGI BODRING', ru: 'ОГУРЦЫ СВЕЖИЕ', en: 'FRESH CUCUMBERS' },
    color: '#00B050',
    bgHeader: 'bg-[#00B050]',
    textColor: 'text-black',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    col9: {
      uz: 'Konsistensiyasi: zich, tarang, sersuv',
      ru: 'Консистенция: плотная, упругая, сочная',
      en: 'Consistency: dense, firm, juicy'
    },
    col10: {
      uz: "Rangi: bir xil yashil, sarg'aymagan",
      ru: 'Цвет: однородный зеленый, без желтизны',
      en: 'Color: uniform green, without yellowing'
    },
    col11: {
      uz: "Ta'mi, hidi: yangi, bodringga xos",
      ru: 'Вкус, запах: свежий, свойственный огурцам',
      en: 'Taste, smell: fresh, typical of cucumber'
    },
    col12: {
      uz: "Ko'ndalang diametri bo'yicha meva o'lchami",
      ru: 'Размер плодов по наибольшему поперечному диаметру',
      en: 'Fruit size by largest transverse diameter'
    },
    col13: {
      uz: 'Hasharot izlari va zararlangan joylar',
      ru: 'Следы насекомых и пораженные ими места',
      en: 'Traces of insects and affected areas'
    },
    col14: {
      uz: 'Shilimshiq, aynish, kasallik va chirish',
      ru: 'Слизь, разложение, поражение болезнями и гниль',
      en: 'Slime, decomposition, disease and rot'
    },
    col15: {
      uz: "Idish bosimidan ezilgan, g'ijimlangan mevalar",
      ru: 'Плоды с легкими нажимами от тары, помятостью',
      en: 'Fruits with slight container pressure, bruising'
    },
    col16: {
      uz: 'Chandiqlangan yoriqlari bor mevalar',
      ru: 'С зарубцевавшимися трещинами',
      en: 'With healed cracks'
    },
    col17: {
      uz: 'Yoriqlari bor mevalar',
      ru: 'Плоды с трещинами',
      en: 'Fruits with cracks'
    },
    col18: {
      uz: 'Bir qator qilib qadoqlangan',
      ru: 'Упакованные в один ряд',
      en: 'Packed in a single layer'
    },
    col19: {
      uz: "Mexanik shikastlanishlarning yo'qligi",
      ru: 'Отсутствие механические повреждения',
      en: 'Absence of mechanical damage'
    }
  },
  ЛИМОН: {
    name: { uz: 'LIMON', ru: 'ЛИМОН', en: 'LEMON' },
    color: '#FFFF00',
    bgHeader: 'bg-[#FFFF00]',
    textColor: 'text-black',
    badgeBg: 'bg-yellow-100 border-yellow-300',
    badgeText: 'text-yellow-900',
    col9: {
      uz: 'Rangi: och olovrangdan yorqin sariqqacha',
      ru: 'Цвет: от светло-оранжевого до ярко-желтого',
      en: 'Color: light orange to bright yellow'
    },
    col10: {
      uz: 'Shakli: tuxumsimon (oval), deformatsiyasiz',
      ru: 'Форма: овальная, без деформации',
      en: 'Shape: oval, without deformation'
    },
    col11: {
      uz: "Konsistensiyasi: zich, sersuv, tekis, o'tib ketmagan",
      ru: 'Консистенция: плотная, сочная, ровная, не перезревшие',
      en: 'Consistency: dense, juicy, smooth, not overripe'
    },
    col12: {
      uz: "Ta'mi, hidi: ushbu botanik navga xos",
      ru: 'Вкус, запах: свойственный данному ботаническому сорту',
      en: 'Taste, smell: characteristic of botanical variety'
    },
    col13: {
      uz: 'Limon diametri: NPS 5.5 sm',
      ru: 'Диаметр плода лимона: НПС: 5.5см',
      en: 'Lemon diameter: 5.5 cm min'
    },
    col14: {
      uz: "Yo'l qo'yib bo'lmaydigan nuqsonlar: hasharotlar va zararlar",
      ru: 'Недопустимые дефекты: насекомые и пораженные места',
      en: 'Inadmissible defects: insects and affected areas'
    },
    col15: {
      uz: "Yo'l qo'yib bo'lmaydigan nuqsonlar: shilimshiq, aynish",
      ru: 'Недопустимые дефекты: слизь, разложение',
      en: 'Inadmissible defects: slime, decomposition'
    },
    col16: {
      uz: 'Kasalliklar bilan zararlanish',
      ru: 'Поражение болезнями',
      en: 'Disease damage'
    },
    col17: {
      uz: "So'liganlik - turgor yo'qolishi",
      ru: 'Вялость - потеря тургора',
      en: 'Limpness - loss of turgor'
    },
    col18: {
      uz: 'Mexanik shikastlanishlar: chuqur jarohatlar',
      ru: 'Механические повреждения: глубокие',
      en: 'Mechanical damage: deep cuts/punctures'
    },
    col19: {
      uz: "Yo'l qo'yib bo'lmaydigan nuqsonlar: noto'g'ri kalibr",
      ru: 'Недопустимые дефекты: не правильный калибр',
      en: 'Inadmissible defects: improper size/caliber'
    }
  }
}

export function getProductTheme(productName: string, lang: 'uz' | 'ru' | 'en' = 'uz'): ProductTheme {
  const p = (productName || '').toUpperCase()
  let key = 'САЛАТ АЙСБЕРГ'
  if (p.includes('ТОМАТ') || p.includes('ПОМИДОР') || p.includes('TOMAT') || p.includes('TOMATO')) key = 'ТОМАТ'
  else if (p.includes('ЛУК') || p.includes('ПИЁЗ') || p.includes('PIYOZ') || p.includes('ONION')) key = 'ЛУК БЕЛЫЙ'
  else if (p.includes('КАПУСТА') || p.includes('KARAM') || p.includes('CABBAGE')) key = 'КАПУСТА БЕЛОКОЧАННАЯ'
  else if (p.includes('МОРКОВ') || p.includes('SABZI') || p.includes('CARROT')) key = 'МОРКОВЬ'
  else if (p.includes('ЛИМОН') || p.includes('LEMON') || p.includes('LIMON')) key = 'ЛИМОН'
  else if (p.includes('ОГУР') || p.includes('BODRING') || p.includes('CUCUMBER')) key = 'ОГУРЦЫ СВЕЖИЕ'

  const cfg = PRODUCT_THEMES_CONFIG[key] || PRODUCT_THEMES_CONFIG['САЛАТ АЙСБЕРГ']
  const l: 'uz' | 'ru' | 'en' = (lang === 'ru' || lang === 'en') ? lang : 'uz'

  return {
    name: cfg.name[l] || cfg.name.uz,
    color: cfg.color,
    bgHeader: cfg.bgHeader,
    textColor: cfg.textColor,
    badgeBg: cfg.badgeBg,
    badgeText: cfg.badgeText,
    col9: cfg.col9[l] || cfg.col9.uz,
    col10: cfg.col10[l] || cfg.col10.uz,
    col11: cfg.col11[l] || cfg.col11.uz,
    col12: cfg.col12[l] || cfg.col12.uz,
    col13: cfg.col13[l] || cfg.col13.uz,
    col14: cfg.col14[l] || cfg.col14.uz,
    col15: cfg.col15[l] || cfg.col15.uz,
    col16: cfg.col16[l] || cfg.col16.uz,
    col17: cfg.col17[l] || cfg.col17.uz,
    col18: cfg.col18[l] || cfg.col18.uz,
    col19: cfg.col19[l] || cfg.col19.uz,
  }
}

export const PRODUCT_THEMES: Record<string, ProductTheme> = {
  ТОМАТ: getProductTheme('ТОМАТ', 'ru'),
  'ЛУК БЕЛЫЙ': getProductTheme('ЛУК БЕЛЫЙ', 'ru'),
  'САЛАТ АЙСБЕРГ': getProductTheme('САЛАТ АЙСБЕРГ', 'ru'),
  'КАПУСТА БЕЛОКОЧАННАЯ': getProductTheme('КАПУСТА БЕЛОКОЧАННАЯ', 'ru'),
  МОРКОВЬ: getProductTheme('МОРКОВЬ', 'ru'),
  'ОГУРЦЫ СВЕЖИЕ': getProductTheme('ОГУРЦЫ СВЕЖИЕ', 'ru'),
  ЛИМОН: getProductTheme('ЛИМОН', 'ru')
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

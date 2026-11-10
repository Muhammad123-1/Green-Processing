// Professional multilingual dictionary & automated translation utility for surveys

export interface TranslationItem {
  uz: string
  ru: string
  en: string
}

// Built-in verified ISO/FSSC survey translations
export const SURVEY_DICTIONARY: Record<string, TranslationItem> = {
  // Title & description
  "Mijozlar mamnuniyati so'rovnomasi": {
    uz: "Mijozlar mamnuniyati so'rovnomasi",
    ru: "Анкета удовлетворенности клиентов",
    en: "Customer Satisfaction Survey"
  },
  "Mijozlar mamnuniyati so'rovnomasi (Restoran va Kafe)": {
    uz: "Mijozlar mamnuniyati so'rovnomasi (Restoran va Kafe)",
    ru: "Анкета удовлетворенности клиентов (Рестораны и Кафе)",
    en: "Customer Satisfaction Survey (Restaurants & Cafes)"
  },
  "Mijozlar mamnuniyati so'rovnomasi (FSSC / ISO 22000)": {
    uz: "Mijozlar mamnuniyati so'rovnomasi (FSSC / ISO 22000)",
    ru: "Анкета удовлетворенности клиентов (FSSC / ISO 22000)",
    en: "Customer Satisfaction Survey (FSSC / ISO 22000)"
  },
  "Hurmatli hamkor! Ushbu so'rovnoma sifat tizimi talablariga muvofiq mahsulot va xizmat sifatini oshirish maqsadida o'tkazilmoqda.": {
    uz: "Hurmatli hamkor! Ushbu so'rovnoma sifat tizimi talablariga muvofiq mahsulot va xizmat sifatini oshirish maqsadida o'tkazilmoqda.",
    ru: "Уважаемый партнер! Данная анкета проводится в соответствии с требованиями системы менеджмента качества с целью постоянного улучшения качества продукции и услуг.",
    en: "Dear partner! This survey is conducted in accordance with quality management system standards to continuously improve product and service quality."
  },

  // Groups
  'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang': {
    uz: 'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    ru: 'Оцените выполнение договорных обязательств по поставке продукции ООО «GREEN PROCESSING» и сотрудничество по 5-балльной шкале',
    en: 'Evaluate the fulfillment of contract terms for the supply of LLC "GREEN PROCESSING" products and cooperation on a 5-point scale'
  },
  'Iltimos, quyidagi savollarga javob bering:': {
    uz: 'Iltimos, quyidagi savollarga javob bering:',
    ru: 'Пожалуйста, ответьте на следующие вопросы:',
    en: 'Please answer the following questions:'
  },

  // Questions
  "Yetkazib berilayotgan mahsulot sifati kelishilgan talablarga (harorat, tashqi ko'rinish, shartnoma shartlariga) mos keladimi?": {
    uz: "Yetkazib berilayotgan mahsulot sifati kelishilgan talablarga (harorat, tashqi ko'rinish, shartnoma shartlariga) mos keladimi?",
    ru: "Соответствует ли качество поставляемой продукции согласованным требованиям (температура, внешний вид, условия договора)?",
    en: "Does the quality of delivered products meet agreed requirements (temperature, appearance, contract conditions)?"
  },
  "So'rovlaringiz, eslatmalaringiz, e'tiroz va shikoyatlaringiz bo'yicha ishlar tezkorlik bilan bajariladimi?": {
    uz: "So'rovlaringiz, eslatmalaringiz, e'tiroz va shikoyatlaringiz bo'yicha ishlar tezkorlik bilan bajariladimi?",
    ru: "Оперативно ли выполняются работы по вашим запросам, напоминаниям, претензиям и жалобам?",
    en: "Are requests, reminders, claims, and complaints handled promptly?"
  },
  "Mahsulotimizning rang va ta'm ko'rsatkichlarini qanday baholaysiz?": {
    uz: "Mahsulotimizning rang va ta'm ko'rsatkichlarini qanday baholaysiz?",
    ru: "Как вы оцениваете цветовые и вкусовые показатели нашей продукции?",
    en: "How do you rate the color and taste characteristics of our products?"
  },
  "Mahsulotlar o'z vaqtida yetkazib berilmoqdami?": {
    uz: "Mahsulotlar o'z vaqtida yetkazib berilmoqdami?",
    ru: "Своевременно ли поставляется продукция?",
    en: "Are products delivered on time?"
  },
  "So'nggi uch oy ichida tayyor mahsulotda yot jismlar (soch, shisha, plastmassa va hokazo) uchrash holatlari bo'ldimi?": {
    uz: "So'nggi uch oy ichida tayyor mahsulotda yot jismlar (soch, shisha, plastmassa va hokazo) uchrash holatlari bo'ldimi?",
    ru: "Были ли за последние три месяца случаи обнаружения посторонних предметов (волосы, стекло, пластик и т.д.) в готовой продукции?",
    en: "Have there been any instances of foreign objects (hair, glass, plastic, etc.) found in finished products over the last three months?"
  },
  "So'nggi uch oy davomida amaliyotingizda quyidagi holatlar kuzatildimi: -qutida mahsulot yetishmasligi; -qadoqning shikastlanishi; -pomidorlar ezilgan yoki butun emasligi; -buzilgan mahsulot; -vakuumlanmagan mahsulot; -markirovkasiz mahsulot;": {
    uz: "So'nggi uch oy davomida amaliyotingizda quyidagi holatlar kuzatildimi: -qutida mahsulot yetishmasligi; -qadoqning shikastlanishi; -pomidorlar ezilgan yoki butun emasligi; -buzilgan mahsulot; -vakuumlanmagan mahsulot; -markirovkasiz mahsulot;",
    ru: "Наблюдались ли за последние три месяца в вашей практике следующие случаи: -недостача продукции в коробке; -повреждение упаковки; -помятые или нецелые томаты; -испорченная продукция; -невакуумированная продукция; -продукция без маркировки;",
    en: "Over the past three months, have you observed: -shortage in box; -damaged packaging; -crushed or broken tomatoes; -spoiled product; -unvacuumed product; -unlabeled product;"
  },
  "So'nggi uch oy ichida mahsulotlarimiz (piyoz, aysberg, \"Koul Slou\" salat aralashmasi) nostandart to'g'ralish holatlari bo'ldimi? Agar javob \"Ha\" bo'lsa, qachon? Qaysi mahsulot? Va bu haqda kimga xabar berdingiz?": {
    uz: "So'nggi uch oy ichida mahsulotlarimiz (piyoz, aysberg, \"Koul Slou\" salat aralashmasi) nostandart to'g'ralish holatlari bo'ldimi? Agar javob \"Ha\" bo'lsa, qachon? Qaysi mahsulot? Va bu haqda kimga xabar berdingiz?",
    ru: "Были ли за последние три месяца случаи нестандартной нарезки нашей продукции (лук, айсберг, салатная смесь «Коул Слоу»)? Если «Да», когда? Какой продукт? И кому об этом сообщили?",
    en: "Over the past three months, were there any instances of non-standard cutting of products (onions, iceberg, \"Cole Slaw\" salad mix)? If \"Yes\", when, which product, and to whom was it reported?"
  },
  "Mijozlar tomonidan mahsulotimizga nisbatan shikoyatlar bo'ldimi? Agar javob \"Ha\" bo'lsa, aynan nima bo'yicha? Qaysi mahsulotga?": {
    uz: "Mijozlar tomonidan mahsulotimizga nisbatan shikoyatlar bo'ldimi? Agar javob \"Ha\" bo'lsa, aynan nima bo'yicha? Qaysi mahsulotga?",
    ru: "Были ли жалобы со стороны клиентов на нашу продукцию? Если «Да», то по какому поводу? На какой продукт?",
    en: "Have there been any customer complaints regarding our products? If \"Yes\", what was it regarding? Which product?"
  },
  "So'nggi paytlarda mahsulot sifati o'zgardimi? Agar \"Ha\" bo'lsa, qachon? Qaysi mahsulot? Yaxshi tarafga yoxud yomon tarafga?": {
    uz: "So'nggi paytlarda mahsulot sifati o'zgardimi? Agar \"Ha\" bo'lsa, qachon? Qaysi mahsulot? Yaxshi tarafga yoxud yomon tarafga?",
    ru: "Изменилось ли качество продукции в последнее время? Если «Да», когда? Какой продукт? В лучшую или худшую сторону?",
    en: "Has the product quality changed recently? If \"Yes\", when, which product, and for better or worse?"
  },
  "Sizningcha, kompaniyamizdan xarid hajmini oshirishga nima yordam bergan bo'lar edi:": {
    uz: "Sizningcha, kompaniyamizdan xarid hajmini oshirishga nima yordam bergan bo'lar edi:",
    ru: "Как вы думаете, что помогло бы увеличить объем закупок у нашей компании:",
    en: "In your opinion, what would help increase your purchase volume from our company:"
  },
  "Tavsiyalar, e'tirozlar va shikoyatlar:": {
    uz: "Tavsiyalar, e'tirozlar va shikoyatlar:",
    ru: "Рекомендации, возражения и жалобы:",
    en: "Recommendations, objections, and complaints:"
  },

  // Options & Help texts
  "Agar Ha bo'lsa, iltimos batafsil yozing": {
    uz: "Agar Ha bo'lsa, iltimos batafsil yozing",
    ru: "Если «Да», пожалуйста, напишите подробнее",
    en: "If \"Yes\", please describe in detail"
  },
  "Agar Ha bo'lsa, qachon, qaysi mahsulot va kimga xabar berdingiz?": {
    uz: "Agar Ha bo'lsa, qachon, qaysi mahsulot va kimga xabar berdingiz?",
    ru: "Если «Да», когда, какой продукт и кому сообщили?",
    en: "If \"Yes\", when, which product, and to whom was it reported?"
  },
  "Agar Ha bo'lsa, nima bo'yicha va qaysi mahsulotga?": {
    uz: "Agar Ha bo'lsa, nima bo'yicha va qaysi mahsulotga?",
    ru: "Если «Да», по какому поводу и на какой продукт?",
    en: "If \"Yes\", regarding what and which product?"
  },
  "Agar Ha bo'lsa, qachon, qaysi mahsulot, yaxshi yoki yomon tarafga?": {
    uz: "Agar Ha bo'lsa, qachon, qaysi mahsulot, yaxshi yoki yomon tarafga?",
    ru: "Если «Да», когда, какой продукт, в лучшую или худшую сторону?",
    en: "If \"Yes\", when, which product, and in what direction?"
  },
  "Assortimentni kengaytirish": {
    uz: "Assortimentni kengaytirish",
    ru: "Расширение ассортимента",
    en: "Expanding product range"
  },
  "Mahsulot miqdori va grammini oshirish": {
    uz: "Mahsulot miqdori va grammini oshirish",
    ru: "Увеличение объема и веса порций",
    en: "Increasing product volume and portion weights"
  },
  "Boshqa (fikringizni yozing)": {
    uz: "Boshqa (fikringizni yozing)",
    ru: "Другое (напишите свой вариант)",
    en: "Other (please specify)"
  },
  "Ha": {
    uz: "Ha",
    ru: "Да",
    en: "Yes"
  },
  "Yo'q": {
    uz: "Yo'q",
    ru: "Нет",
    en: "No"
  }
}

// Memory cache for runtime-translated texts
const runtimeCache = new Map<string, string>()

/**
 * Normalizes text for dictionary matching
 */
function normalizeKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Looks up text in dictionary based on target language mode.
 * Supports: 'uz', 'ru', 'en', 'uz_ru', 'uz_en', 'ru_en'
 */
export function getDictionaryItem(text: string): TranslationItem | null {
  const key = normalizeKey(text)
  if (SURVEY_DICTIONARY[key]) return SURVEY_DICTIONARY[key]
  for (const item of Object.values(SURVEY_DICTIONARY)) {
    if (normalizeKey(item.ru) === key || normalizeKey(item.uz) === key) {
      return item
    }
  }
  return null
}

export function splitBilingual(text: string): { uz: string; ru: string } | null {
  if (!text) return null
  const clean = text.trim()

  // 1. Explicit tags: [UZ] ... [RU] ...
  if (clean.includes('[UZ]') && clean.includes('[RU]')) {
    const uzMatch = clean.match(/\[UZ\]([\s\S]*?)(\[RU\]|$)/i)
    const ruMatch = clean.match(/\[RU\]([\s\S]*?)(\[UZ\]|$)/i)
    if (uzMatch && ruMatch) {
      return { uz: uzMatch[1].trim(), ru: ruMatch[1].trim() }
    }
  }

  // 2. Triple slash: ' /// '
  if (clean.includes(' /// ')) {
    const parts = clean.split(' /// ')
    return { uz: parts[0].trim(), ru: parts[1]?.trim() || parts[0].trim() }
  }

  // 3. Single slash: ' / '
  if (clean.includes(' / ')) {
    const parts = clean.split(' / ')
    if (parts.length === 2) {
      const p0 = parts[0].trim()
      const p1 = parts[1].trim()
      const p0HasCyrillic = /[а-яА-ЯёЁ]/.test(p0)
      const p1HasCyrillic = /[а-яА-ЯёЁ]/.test(p1)
      const p0HasLatin = /[a-zA-Z]/.test(p0)
      const p1HasLatin = /[a-zA-Z]/.test(p1)

      if (p0HasLatin && !p0HasCyrillic && p1HasCyrillic) {
        return { uz: p0, ru: p1 }
      }
      if (p0HasCyrillic && !p1HasCyrillic && p1HasLatin) {
        return { uz: p1, ru: p0 }
      }
      return { uz: p0, ru: p1 }
    } else if (parts.length > 2) {
      // Find split point between Latin (Uzbek) and Cyrillic (Russian)
      for (let i = 1; i < parts.length; i++) {
        const left = parts.slice(0, i).join(' / ').trim()
        const right = parts.slice(i).join(' / ').trim()
        const leftHasLatin = /[a-zA-Z]/.test(left)
        const leftHasCyr = /[а-яА-ЯёЁ]/.test(left)
        const rightHasCyr = /[а-яА-ЯёЁ]/.test(right)
        if (leftHasLatin && !leftHasCyr && rightHasCyr) {
          return { uz: left, ru: right }
        }
      }
      // If both use Cyrillic, look for Uzbek-specific letters (ў, қ, ғ, ҳ) on the left
      for (let i = 1; i < parts.length; i++) {
        const left = parts.slice(0, i).join(' / ').trim()
        const right = parts.slice(i).join(' / ').trim()
        const leftHasUzCyr = /[ўқғҳЎҚҒҲ]/.test(left)
        const rightHasRu = /[ыэёъщЫЭЁЪЩ]/.test(right)
        if (leftHasUzCyr && rightHasRu) {
          return { uz: left, ru: right }
        }
      }
    }
  }

  // 4. Multiline: line 1 Latin, line 2 Cyrillic
  if (clean.includes('\n')) {
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 2) {
      const l0 = lines[0]
      const l1 = lines[1]
      const l0HasCyrillic = /[а-яА-ЯёЁ]/.test(l0)
      const l1HasCyrillic = /[а-яА-ЯёЁ]/.test(l1)
      if (!l0HasCyrillic && l1HasCyrillic) return { uz: l0, ru: l1 }
      if (l0HasCyrillic && !l1HasCyrillic) return { uz: l1, ru: l0 }
    }
  }

  return null
}

export interface BilingualResult {
  text: string
  subText?: string
}

export function resolveBilingualText(
  text: string | null | undefined,
  lang: string
): BilingualResult {
  if (!text) return { text: '' }
  const clean = text.trim()

  // 1. Direct split if text contains both languages
  const split = splitBilingual(clean)
  if (split) {
    if (lang === 'uz') return { text: split.uz }
    if (lang === 'ru') return { text: split.ru }
    return { text: split.uz, subText: split.ru }
  }

  // 2. Dictionary lookup
  const dict = getDictionaryItem(clean)
  if (dict) {
    if (lang === 'uz') return { text: dict.uz }
    if (lang === 'ru') return { text: dict.ru }
    return { text: dict.uz, subText: dict.ru !== dict.uz ? dict.ru : undefined }
  }

  // 3. Fallback: single text
  return { text: clean }
}

export function getDictionaryTranslation(text: string | null | undefined, lang: string): string | null {
  if (!text) return text ?? ''
  const key = normalizeKey(text)
  const item = getDictionaryItem(key)
  if (!item) return null

  switch (lang) {
    case 'uz':
      return item.uz
    case 'ru':
      return item.ru || item.uz
    case 'en':
      return item.en || item.ru || item.uz
    case 'uz_ru':
      return item.uz === item.ru ? item.uz : `${item.uz} / ${item.ru}`
    case 'uz_en':
      return item.uz === item.en ? item.uz : `${item.uz} / ${item.en}`
    case 'ru_en':
      return item.ru === item.en ? item.ru : `${item.ru} / ${item.en}`
    default:
      return item.uz
  }
}

/**
 * Free translation via MyMemory API with caching
 */
export async function translateTextOnline(text: string, targetLang: 'ru' | 'en' | 'uz'): Promise<string> {
  const clean = text.trim()
  if (!clean) return ''
  if (targetLang === 'uz') return clean

  // 1. Check in-memory cache
  const cacheKey = `${targetLang}:${clean}`
  if (runtimeCache.has(cacheKey)) {
    return runtimeCache.get(cacheKey)!
  }

  // 2. Check dictionary
  const dict = getDictionaryTranslation(clean, targetLang)
  if (dict) {
    runtimeCache.set(cacheKey, dict)
    return dict
  }

  // 3. Online translate via MyMemory Free API
  try {
    const pair = `uz|${targetLang}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${pair}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (res.ok) {
      const data = await res.json()
      const translated = data?.responseData?.translatedText
      if (translated && !translated.startsWith('MYMEMORY WARNING')) {
        runtimeCache.set(cacheKey, translated)
        return translated
      }
    }
  } catch (err) {
    console.error('Online translation error:', err)
  }

  return clean
}

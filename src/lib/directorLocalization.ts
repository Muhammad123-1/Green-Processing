import { resolveProductMeta } from './productTaxonomy'

export const DIRECTOR_PRODUCT_MAP: Record<string, { uz: string; ru: string; en: string }> = {
  // 1. Айсберг
  'айсберг': { uz: 'Aysberg', ru: 'Айсберг', en: 'Iceberg Lettuce' },
  'салат айсберг': { uz: 'Aysberg', ru: 'Айсберг', en: 'Iceberg Lettuce' },
  'айсберг (листовой)': { uz: 'Bargli aysberg', ru: 'Айсберг (листовой)', en: 'Leaf Iceberg' },
  'листовой айсберг': { uz: 'Bargli aysberg', ru: 'Айсберг (листовой)', en: 'Leaf Iceberg' },

  // 2. Помидоры
  'помидоры': { uz: 'Pomidor', ru: 'Помидоры', en: 'Tomatoes' },
  'помидор': { uz: 'Pomidor', ru: 'Помидоры', en: 'Tomatoes' },
  'томат': { uz: 'Pomidor', ru: 'Помидоры', en: 'Tomatoes' },
  'томаты': { uz: 'Pomidor', ru: 'Помидоры', en: 'Tomatoes' },

  // 3. Лук
  'лук': { uz: 'Piyoz', ru: 'Лук', en: 'Onion' },
  'лук репчатый': { uz: 'Piyoz', ru: 'Лук', en: 'Onion' },
  'лук салатный': { uz: 'Salat piyozi', ru: 'Лук салатный', en: 'Salad Onion' },
  'пиёз': { uz: 'Piyoz', ru: 'Лук', en: 'Onion' },

  // 4. Огурцы
  'огурцы': { uz: 'Bodring', ru: 'Огурцы', en: 'Cucumbers' },
  'огурец': { uz: 'Bodring', ru: 'Огурцы', en: 'Cucumbers' },
  'бодринг': { uz: 'Bodring', ru: 'Огурцы', en: 'Cucumbers' },

  // 5. Лимоны
  'лимоны': { uz: 'Limon', ru: 'Лимоны', en: 'Lemons' },
  'лимон': { uz: 'Limon', ru: 'Лимон', en: 'Lemon' },

  // 6. Сельдерей
  'сельдерей': { uz: 'Selderiy', ru: 'Сельдерей', en: 'Celery' },

  // 7. Руккола
  'руккола': { uz: 'Rukkola', ru: 'Руккола', en: 'Arugula' },
  'рукола': { uz: 'Rukkola', ru: 'Руккола', en: 'Arugula' },

  // 8. Лолло Россо
  'лолло россо': { uz: 'Lollo Rosso', ru: 'Лолло Россо', en: 'Lollo Rosso' },
  'lollo rosso': { uz: 'Lollo Rosso', ru: 'Лолло Россо', en: 'Lollo Rosso' },

  // 9. Шпинат
  'шпинат': { uz: 'Shpinat', ru: 'Шпинат', en: 'Spinach' },

  // 10. Мята
  'мята': { uz: 'Yalpiz', ru: 'Мята', en: 'Mint' },

  // 11. Капуста белокачанная
  'капуста белокачанная': { uz: 'Oq karam', ru: 'Капуста белокочанная', en: 'White Cabbage' },
  'капуста белокочанная': { uz: 'Oq karam', ru: 'Капуста белокочанная', en: 'White Cabbage' },
  'капуста': { uz: 'Karam', ru: 'Капуста', en: 'Cabbage' },

  // 12. Морковь красная
  'морковь красная': { uz: 'Qizil sabzi', ru: 'Морковь красная', en: 'Red Carrot' },
  'морковь': { uz: 'Sabzi', ru: 'Морковь', en: 'Carrot' },
  'сабзи': { uz: 'Sabzi', ru: 'Морковь', en: 'Carrot' },

  // 13. Салад Mix & Коул Слоу
  'салад mix': { uz: 'Salat Miks', ru: 'Салат Микс', en: 'Salad Mix' },
  'салат mix': { uz: 'Salat Miks', ru: 'Салат Микс', en: 'Salad Mix' },
  'салат микс': { uz: 'Salat Miks', ru: 'Салат Микс', en: 'Salad Mix' },
  'salad mix': { uz: 'Salat Miks', ru: 'Салат Микс', en: 'Salad Mix' },
  'коул слоу': { uz: 'Koul Slou', ru: 'Коул Слоу', en: 'Cole Slaw' },
  'cole slaw': { uz: 'Koul Slou', ru: 'Коул Слоу', en: 'Cole Slaw' },

  // 14. Шампиньоны & Перец Калифорния
  'шампиньоны': { uz: "Qo'ziqorin", ru: 'Шампиньоны', en: 'Mushrooms' },
  'шампиньон': { uz: "Qo'ziqorin", ru: 'Шампиньоны', en: 'Mushrooms' },
  'перец калифорния': { uz: 'Kaliforniya qalampiri', ru: 'Перец Калифорния', en: 'California Pepper' },
  'болгарский перец': { uz: 'Bolgar qalampiri', ru: 'Болгарский перец', en: 'Bell Pepper' },

  // 15. Вспомогательные материалы (Коробка, Гипохлорид)
  'коробка': { uz: 'Quti', ru: 'Коробка', en: 'Box' },
  'коробки': { uz: 'Karton qutilar', ru: 'Коробки картонные', en: 'Cardboard Boxes' },
  'пакет': { uz: 'Polietilen paketlar', ru: 'Пакеты полиэтиленовые', en: 'Polyethylene Bags' },
  'пакеты': { uz: 'Polietilen paketlar', ru: 'Пакеты полиэтиленовые', en: 'Polyethylene Bags' },
  'гофра коробка': { uz: 'Gofra quti', ru: 'Гофра коробка', en: 'Corrugated Box' },
  'гипохлорид': { uz: 'Natriy gipoxlorit (Xlor)', ru: 'Гипохлорит натрия (Хлор)', en: 'Sodium Hypochlorite (Chlorine)' },
  'гипохлорит': { uz: 'Natriy gipoxlorit (Xlor)', ru: 'Гипохлорит натрия (Хлор)', en: 'Sodium Hypochlorite (Chlorine)' },
  'гипохлорит натрия': { uz: 'Natriy gipoxlorit (Xlor)', ru: 'Гипохлорит натрия (Хлор)', en: 'Sodium Hypochlorite (Chlorine)' },
  'хлор': { uz: 'Natriy gipoxlorit (Xlor)', ru: 'Гипохлорит натрия (Хлор)', en: 'Sodium Hypochlorite (Chlorine)' },
  'кухня': { uz: 'Oshxona sarfiyoti', ru: 'Расход кухни', en: 'Kitchen Supplies' },
  'сес': { uz: 'SES sanitariya vositalari', ru: 'Санитарные средства СЭС', en: 'Sanitary & Hygiene Supplies' },
  'тайгета 218': { uz: 'Taygeta 218 yuvish vositasi', ru: 'Моющее средство Тайгета 218', en: 'Taygeta 218 Detergent' },
  'тайгета': { uz: 'Taygeta 218 yuvish vositasi', ru: 'Моющее средство Тайгета 218', en: 'Taygeta 218 Detergent' },
  'сорбат': { uz: 'Kaliy sorbat', ru: 'Сорбат калия', en: 'Potassium Sorbate' },
  'бензоат': { uz: 'Natriy benzoat', ru: 'Бензоат натрия', en: 'Sodium Benzoate' },
  'уксус': { uz: 'Sirka kislotasi', ru: 'Уксусная кислота', en: 'Acetic Acid' },
  'пакет брак': { uz: 'Yaroqsiz paketlar (Brak)', ru: 'Пакеты (Брак)', en: 'Defective Bags' },
  'пакет 2 брак': { uz: 'Yaroqsiz paketlar 2 (Brak)', ru: 'Пакеты 2 (Брак)', en: 'Defective Bags 2' },
  'коробки брак': { uz: 'Yaroqsiz qutilar (Brak)', ru: 'Коробки (Брак)', en: 'Defective Boxes' },
  'коробки2 брак': { uz: 'Yaroqsiz qutilar 2 (Brak)', ru: 'Коробки 2 (Брак)', en: 'Defective Boxes 2' },
  'коробки 2 брак': { uz: 'Yaroqsiz qutilar 2 (Brak)', ru: 'Коробки 2 (Брак)', en: 'Defective Boxes 2' },

  // English keys from database shop reports
  'tomato': { uz: 'Tomat', ru: 'Томат', en: 'Tomato' },
  'tomatoes': { uz: 'Tomat', ru: 'Томат', en: 'Tomato' },
  'iceberg': { uz: 'Salat Aysberg', ru: 'Салат Айсберг', en: 'Iceberg Lettuce' },
  'icebergleaf': { uz: 'Bargli aysberg', ru: 'Айсберг листовой', en: 'Leaf Iceberg' },
  'cabbage': { uz: 'Oq boshli karam', ru: 'Капуста белокочанная', en: 'White Cabbage' },
  'onion': { uz: 'Oq salat piyozi', ru: 'Лук салатный белый', en: 'White Salad Onion' },
  'onions': { uz: 'Oq salat piyozi', ru: 'Лук салатный белый', en: 'White Salad Onion' },
  'carrot': { uz: 'Sabzi', ru: 'Морковь', en: 'Carrot' },
  'carrots': { uz: 'Sabzi', ru: 'Морковь', en: 'Carrot' },
  'rukkola': { uz: 'Rukkola', ru: 'Руккола', en: 'Arugula' },
  'spinach': { uz: 'Shpinat', ru: 'Шпинат', en: 'Spinach' },
  'lollorosso': { uz: 'Salat Lollo Rosso', ru: 'Салат Лолло Россо', en: 'Lollo Rosso Lettuce' },
  'cucumber': { uz: 'Bodring', ru: 'Огурцы свежие', en: 'Fresh Cucumber' },
  'cucumbers': { uz: 'Bodring', ru: 'Огурцы свежие', en: 'Fresh Cucumber' },
  'mint': { uz: 'Yalpiz', ru: 'Мята', en: 'Mint' },
  'lemon': { uz: 'Limon', ru: 'Лимон', en: 'Lemon' },
  'celery': { uz: 'Selderi', ru: 'Сельдерей', en: 'Celery' },

  // 16. Total / Summary
  'всего': { uz: 'Jami', ru: 'Всего', en: 'Total' },
  'итого': { uz: 'Jami', ru: 'Итого', en: 'Total' },
  'jami': { uz: 'Jami', ru: 'Итого', en: 'Total' },
  'total': { uz: 'Jami', ru: 'Итого', en: 'Total' },
  'итого (общая сумма)': { uz: 'JAMI', ru: 'ИТОГО', en: 'GRAND TOTAL' },
  'итого с упаковкой и дез. ср-вом': { uz: 'Qadoq va dez. vositasi bilan jami', ru: 'Итого с упаковкой и дез. ср-вом', en: 'Total with packaging and disinfectant' }
}

export function translateProductName(name?: string | null, lang: string = 'uz'): string {
  if (!name) return ''
  const trimmed = name.trim()
  const lower = trimmed.toLowerCase()

  // 1. Direct taxonomy resolution handles primary vs packaging rules, excludes, etc.
  const meta = resolveProductMeta(trimmed)
  if (meta && meta.canonicalId !== 'unknown' && !meta.canonicalId.startsWith('custom_')) {
    if (lang === 'ru') return meta.ru || trimmed
    if (lang === 'en') return meta.en || trimmed
    return meta.uz || trimmed
  }

  // 2. Exact match in DIRECTOR_PRODUCT_MAP
  if (DIRECTOR_PRODUCT_MAP[lower]) {
    const item = DIRECTOR_PRODUCT_MAP[lower]
    if (lang === 'ru') return item.ru
    if (lang === 'en') return item.en
    return item.uz
  }

  // 3. Fallback
  if (lang === 'ru') return meta?.ru || trimmed
  if (lang === 'en') return meta?.en || trimmed
  return meta?.uz || trimmed
}

export function translateUnit(unit?: string | null, lang: string = 'uz'): string {
  if (!unit) return ''
  const u = unit.toLowerCase().trim()
  if (u === 'кг' || u === 'kg' || u === 'килограмм') return lang === 'ru' ? 'кг' : 'kg'
  if (u === 'шт' || u === 'dona' || u === 'штук' || u === 'pcs') return lang === 'ru' ? 'шт' : lang === 'en' ? 'pcs' : 'dona'
  if (u === 'литр' || u === 'litr' || u === 'л' || u === 'l') return lang === 'ru' ? 'л' : 'litr'
  if (u === 'сум' || u === "so'm" || u === 'uzs') return lang === 'ru' ? 'сум' : "so'm"
  if (u === '%') return '%'
  return unit
}

export function translateMonthName(month?: string | null, lang: string = 'uz'): string {
  if (!month) return ''
  const m = month.toLowerCase().trim()
  const monthsUz: Record<string, string> = {
    'январь': 'Yanvar', 'февраль': 'Fevral', 'март': 'Mart', 'апрель': 'Aprel',
    'май': 'May', 'июнь': 'Iyun', 'июль': 'Iyul', 'август': 'Avgust',
    'сентябрь': 'Sentyabr', 'октябрь': 'Oktyabr', 'ноябрь': 'Noyabr', 'декабрь': 'Dekabr',
    'january': 'Yanvar', 'february': 'Fevral', 'march': 'Mart', 'april': 'Aprel',
    'june': 'Iyun', 'july': 'Iyul', 'august': 'Avgust',
    'september': 'Sentyabr', 'october': 'Oktyabr', 'november': 'Noyabr', 'december': 'Dekabr'
  }
  const monthsRu: Record<string, string> = {
    'yanvar': 'Январь', 'fevral': 'Февраль', 'mart': 'Март', 'aprel': 'Апрель',
    'may': 'Май', 'iyun': 'Июнь', 'iyul': 'Июль', 'avgust': 'Август',
    'sentyabr': 'Сентябрь', 'oktyabr': 'Октябрь', 'noyabr': 'Ноябрь', 'dekabr': 'Декабрь'
  }
  if (lang === 'ru') return monthsRu[m] || month
  if (lang === 'uz') return monthsUz[m] || month
  return month
}

export function translateTableTitle(title?: string | null, lang: string = 'uz'): string {
  if (!title) return ''
  if (lang === 'ru') return title

  let t = title
    .replace(/Информация по расходу основного сырья/gi, "Asosiy xomashyo sarfi bo'yicha ma'lumot")
    .replace(/Информация по расходу/gi, "Sarf bo'yicha ma'lumot")
    .replace(/Информация по производству готовой продукции/gi, "Tayyor mahsulot ishlab chiqarish ma'lumoti")
    .replace(/Информация по отходу продукции/gi, "Mahsulot chiqindisi (otxod) ma'lumoti")
    .replace(/Сводный отчет/gi, "Jamlovchi hisobot")
    .replace(/Остаток сырья/gi, "Xomashyo qoldig'i")
    .replace(/неделя/gi, "hafta")
    .replace(/понедельник/gi, "Dushanba")
    .replace(/вторник/gi, "Seshanba")
    .replace(/среда/gi, "Chorshanba")
    .replace(/четверг/gi, "Payshanba")
    .replace(/пятница/gi, "Juma")
    .replace(/суббота/gi, "Shanba")
    .replace(/воскресенье/gi, "Yakshanba")
    .replace(/^на\s+/i, "")

  return t
}

export function translateNoteText(note?: string | null, lang: string = 'uz'): string {
  if (!note) return ''
  if (lang === 'ru') return note

  return note
    .replace(/Примечание:\s*/gi, "Izoh: ")
    .replace(/Из израсходованных\s*/gi, "Sarflangan ")
    .replace(/все\s+/gi, "barchasi ")
    .replace(/поступили по\s+/gi, "narxida kelgan: ")
    .replace(/поступили\s+(\d+)\s+партии/gi, "$1 partiya kelib tushdi")
    .replace(/от разных поставщиков/gi, "turli ta'minotchilardan")
    .replace(/айсберга/gi, "aysbergdan")
    .replace(/помидоров/gi, "pomidordan")
    .replace(/лука/gi, "piyozdan")
    .replace(/белокачанной капусты|белокочанной капусты/gi, "oq karamdan")
    .replace(/красной моркови/gi, "qizil sabzidan")
    .replace(/коробок/gi, "qutilardan")
    .replace(/гипохлорида/gi, "gipoxloriddan")
    .replace(/огурцов/gi, "bodringdan")
    .replace(/лимонов/gi, "limondan")
    .replace(/сельдерея/gi, "selderiydan")
    .replace(/рукколы/gi, "rukkoladan")
    .replace(/шпината/gi, "shpinatdan")
    .replace(/мяты/gi, "yalpizdan")
    .replace(/января/gi, "yanvar")
    .replace(/февраля/gi, "fevral")
    .replace(/марта/gi, "mart")
    .replace(/апреля/gi, "aprel")
    .replace(/мая/gi, "may")
    .replace(/июня/gi, "iyun")
    .replace(/июля/gi, "iyul")
    .replace(/августа/gi, "avgust")
    .replace(/сентября/gi, "sentyabr")
    .replace(/октября/gi, "oktyabr")
    .replace(/ноября/gi, "noyabr")
    .replace(/декабря/gi, "dekabr")
    .replace(/Расход/gi, "Sarf")
    .replace(/Приход/gi, "Kirim")
    .replace(/Остаток/gi, "Qoldiq")
    .replace(/Брак/gi, "Brak")
    .replace(/Передано в цех/gi, "Sexga berildi")
    .replace(/Норма/gi, "Me'yor")
    .replace(/\s+сум/gi, " so'm")
    .replace(/\s+шт/gi, " dona")
    .replace(/\s+кг/gi, " kg")
}

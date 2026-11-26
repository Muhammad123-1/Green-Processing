import { resolveProductMeta } from './productTaxonomy'

export function translateProductName(name?: string, lang: string = 'uz'): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (trimmed.toLowerCase() === 'итого' || trimmed.toLowerCase() === 'jami' || trimmed.toLowerCase() === 'total') {
    return lang === 'ru' ? 'Итого' : lang === 'en' ? 'Total' : 'Jami'
  }
  const meta = resolveProductMeta(trimmed)
  if (lang === 'ru') return meta.ru || trimmed
  if (lang === 'en') return meta.en || trimmed
  return meta.uz || trimmed
}

export function translateUnit(unit?: string, lang: string = 'uz'): string {
  if (!unit) return ''
  const u = unit.toLowerCase().trim()
  if (u === 'кг' || u === 'kg' || u === 'килограмм') return lang === 'ru' ? 'кг' : 'kg'
  if (u === 'шт' || u === 'dona' || u === 'штук' || u === 'pcs') return lang === 'ru' ? 'шт' : lang === 'en' ? 'pcs' : 'dona'
  if (u === 'литр' || u === 'litr' || u === 'л' || u === 'l') return lang === 'ru' ? 'л' : 'litr'
  return unit
}

export function translateMonthName(month?: string, lang: string = 'uz'): string {
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

export function translateTableTitle(title?: string, lang: string = 'uz'): string {
  if (!title) return ''
  if (lang === 'ru') return title
  return title
    .replace(/Информация по расходу основного сырья/gi, "Asosiy xomashyo sarfi bo'yicha ma'lumot")
    .replace(/Информация по расходу/gi, "Sarf bo'yicha ma'lumot")
    .replace(/Сводный отчет/gi, "Jamlovchi hisobot")
    .replace(/Остаток сырья/gi, "Xomashyo qoldig'i")
}

export function translateNoteText(note?: string, lang: string = 'uz'): string {
  if (!note) return ''
  if (lang === 'ru') return note
  return note
    .replace(/Расход/gi, "Sarf")
    .replace(/Приход/gi, "Kirim")
    .replace(/Остаток/gi, "Qoldiq")
    .replace(/Брак/gi, "Brak")
    .replace(/Передано в цех/gi, "Sexga berildi")
    .replace(/Норма/gi, "Me'yor")
}

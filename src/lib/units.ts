export type ItemUnit = 'kg' | 'dona' | 'litr'

/**
 * Detects whether a product/material is measured in kg (weight) or dona (count/packaging) or litr.
 */
export function detectItemUnit(name: string, fallbackUnit?: string): ItemUnit {
  if (fallbackUnit) {
    const f = fallbackUnit.toLowerCase().trim()
    if (f === 'dona' || f === 'шт' || f === 'pcs' || f === 'donali' || f === 'ta') return 'dona'
    if (f === 'litr' || f === 'l' || f === 'литр') return 'litr'
    if (f === 'kg' || f === 'кг') return 'kg'
  }

  const lower = (name || '').toLowerCase()

  // Sanoq / qadoq / sarf vositalari (DONA / ШТ)
  const donaPatterns = [
    'пакет', 'paket', 'коробк', 'каробк', 'karobka', 'яшик', 'yashik',
    'стикер', 'stiker', 'этикетк', 'etiketka', 'перчатк', 'perchatka',
    'маск', 'maska', 'халат', 'xalat', 'шапк', 'shapka', 'бахил', 'baxila',
    'рукавадник', 'падон', 'поддон', 'салфетк', 'полотенц', 'бумага',
    'стрич', 'стрейч', 'скотч', 'штук', 'dona', 'donali'
  ]

  if (donaPatterns.some((p) => lower.includes(p))) {
    return 'dona'
  }

  if (lower.includes('litr') || lower.includes('литр')) {
    return 'litr'
  }

  // Standart xomashyo, sabzavot va eritmalar
  return 'kg'
}

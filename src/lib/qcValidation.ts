/**
 * Sifat Nazorati va Qadoqlash ma'lumotlarini qat'iy tekshirish moduli
 * Direktor talabiga asosan: xato ma'lumotlar saqlanishiga yo'l qo'yilmaydi.
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
  helperText?: string
}

export const STANDARD_QC_PRODUCTS = [
  { name: 'Aysberg (1 kg paket)', nominal: 1000, tolerance: 10, unit: 'g', boxCount: 6 },
  { name: 'Aysberg salati 500g', nominal: 500, tolerance: 10, unit: 'g', boxCount: 12 },
  { name: 'Pomidor (saralangan 1 kg)', nominal: 1000, tolerance: 10, unit: 'g', boxCount: 6 },
  { name: 'Bodring (saralangan 1 kg)', nominal: 1000, tolerance: 10, unit: 'g', boxCount: 6 },
  { name: 'Sabzi (saralangan 1 kg)', nominal: 1000, tolerance: 10, unit: 'g', boxCount: 6 },
  { name: 'Oq piyoz (0.5 kg paket)', nominal: 500, tolerance: 10, unit: 'g', boxCount: 10 },
  { name: 'Limon (qadoqlangan 2 dona)', nominal: 2, tolerance: 0, unit: 'dona', boxCount: 12 },
  { name: 'Koul Slou salat 500g', nominal: 500, tolerance: 10, unit: 'g', boxCount: 12 },
]

/**
 * Mahsulot nomini tekshirish
 * "1k", "aysberg 1k", "pom 1" kabi noto'g'ri qisqartmalarni taqiqlaydi
 */
export function validateProductName(name: string): ValidationResult {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return { isValid: false, error: "Mahsulot nomi kiritilishi shart!" }
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: `Mahsulot nomi juda qisqa ("${trimmed}"). Kamida 3 ta harf bo'lishi kerak!`
    }
  }

  // Check forbidden patterns like "1k", "aysberg 1k", "pom 1", "test"
  const forbiddenPatterns = [
    /\b1k\b/i,
    /\b2k\b/i,
    /^aysberg\s*1k$/i,
    /^pom\s*1$/i,
    /^test$/i,
    /^[0-9]+$/,
  ]

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: `Qisqartma taqiqlangan ("${trimmed}")! "Aysberg 1 kg" deb to'liq yozing yoki pastdagi tayyor tugmalardan birini bosing.`
      }
    }
  }

  return { isValid: true }
}

/**
 * FSSC 22000 Qadoqlash vaznini tekshirish
 * Masalan: 1000g nominal bo'lsa, xodim 104g yoki 1g deb xato yozsa to'xtatadi!
 */
export function validatePackageWeight(nominalStr: string | number, actualStr: string | number): ValidationResult {
  const nominal = typeof nominalStr === 'number' ? nominalStr : parseFloat(nominalStr)
  const actual = typeof actualStr === 'number' ? actualStr : parseFloat(actualStr)

  if (isNaN(nominal) || nominal <= 0) {
    return { isValid: false, error: "Nominal vazn kiritilmagan yoki noto'g'ri!" }
  }

  if (isNaN(actual) || actual <= 0) {
    return { isValid: false, error: "Haqiqiy vazn kiritilmagan yoki 0 dan katta bo'lishi kerak!" }
  }

  // 1 kg yoki 500 g mahsulotlar uchun (Nominal >= 200 g)
  if (nominal >= 200) {
    // Agar xodim 1 kg narsaga 104 g yoki 1 g deb yozsa
    if (actual < 100) {
      return {
        isValid: false,
        error: `QO'POL XATO: Haqiqiy vazn ${actual} g kiritildi! 1 kg yoki 500g mahsulot ${actual} g bo'lishi mumkin emas. Agar 1 kg 4 g nazarda tutilgan bo'lsa '1004' deb yozing!`
      }
    }

    const diff = actual - nominal
    const diffPct = Math.abs(diff) / nominal

    // 25% dan ortiq chetlanish - aniq xato
    if (diffPct > 0.25) {
      return {
        isValid: false,
        error: `VAZN XATOSI: Haqiqiy vazn (${actual} g) nominaldan (${nominal} g) juda uzoq (${diff > 0 ? '+' : ''}${diff} g)! Gramm/kg hisobini tekshiring (1 kg = 1000 g)!`
      }
    }

    // Tolerans tekshiruvi (±10 g me'yori)
    const isWithinTol = Math.abs(diff) <= 10
    const helperText = `${actual} g = ${(actual / 1000).toFixed(3)} kg (Og'ish: ${diff > 0 ? '+' : ''}${diff} g, ${isWithinTol ? "Me'yorda ✅" : "Me'yordan og'ish bor ⚠️"})`

    return {
      isValid: true,
      warning: !isWithinTol ? `Diqqat: og'ish ±10g me'yoridan ortiq (${diff > 0 ? '+' : ''}${diff} g)!` : undefined,
      helperText
    }
  }

  // Dona mahsulotlar (masalan Limon 2 dona)
  if (nominal <= 10) {
    if (actual > 30) {
      return {
        isValid: false,
        error: `Paketda ${actual} dona bo'lishi mumkin emas (nominal: ${nominal} dona)!`
      }
    }
    return {
      isValid: true,
      helperText: `${actual} dona (Nominal: ${nominal} dona)`
    }
  }

  return { isValid: true }
}

/**
 * Xomashyo kirimi (Inspection) partiya miqdorini tekshirish
 * Furada 1 kg sabzi kelmasligini tekshiradi (kamida 5 kg)
 */
export function validateInspectionQuantity(qtyStr: string | number, unit: string = 'kg'): ValidationResult {
  const qty = typeof qtyStr === 'number' ? qtyStr : parseFloat(qtyStr)

  if (isNaN(qty) || qty <= 0) {
    return { isValid: false, error: "Xomashyo miqdori kiritilmagan yoki noto'g'ri!" }
  }

  if (unit === 'kg') {
    if (qty < 5) {
      return {
        isValid: false,
        error: `DIQQAT: Siz ${qty} kg kiritdingiz. Bu xomashyo partiyasi uchun juda kam! Agar tonna nazarda tutilgan bo'lsa 1000 deb yozing, agar gramm bo'lsa kg ga o'giring (masalan 1004 g = 1.004 kg)!`
      }
    }

    if (qty > 150000) {
      return {
        isValid: false,
        error: `Miqdor 150 tonnadan ortiq (${qty} kg). Raqamni qayta tekshiring!`
      }
    }

    const tons = (qty / 1000).toFixed(2)
    const grams = (qty * 1000).toLocaleString()
    return {
      isValid: true,
      helperText: `${qty.toLocaleString()} kg = ${tons} tonna (${grams} g)`
    }
  }

  return { isValid: true }
}

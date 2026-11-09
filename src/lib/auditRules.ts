/**
 * Enterprise Audit and Edit-Restriction Rules for Factory Operations.
 * 
 * Rules:
 * 1. General staff (warehouse, production, etc.) may only edit entries within 24 hours of creation.
 * 2. Edits by non-admins are restricted to the overnight shift window: 17:00 to 09:00 (Uzbekistan Time, UTC+5).
 * 3. After 24 hours or outside the shift window, ONLY ADMIN and DIRECTOR roles have permission to edit.
 * 4. Any edit to an existing record requires a mandatory documented reason (editReason).
 * 5. Modified records must record audit trail and display prominent "O'zgartirilgan" indicators in red.
 * 
 * Extended Module Rules:
 * - Module 1: Kiruvchi xomashyo sifat aktlari (IncomingRawMaterialAct):
 *   QC creates lab conclusions. After 24h, editable ONLY by Chief Technologist (TECHNOLOGY), Admin (ADMIN), or Director (DIRECTOR).
 *   Deletion: Strictly ADMIN or DIRECTOR only.
 * - Module 2: Brak va nuqson aktlari (DefectLog / DailyQCChecklist):
 *   Shift completion (12h): edits locked for regular workshop personnel.
 *   Quantity reduction strictly protected against arbitrary lowering.
 *   Modifications after shift require Chief QC (QUALITY_CONTROL), Admin, or Director.
 *   Deletion: Strictly ADMIN or DIRECTOR only.
 * - Module 3: Ombor zaxirasidan to'g'ridan-to'g'ri chiqim (Списание / RawMaterialMovementLog / StockTransfer):
 *   Prevents discrepancies between Supply and Accounting. After 24h, editable ONLY with Chief Accountant (ACCOUNTING), Admin, or Director approval.
 *   Deletion: Strictly ADMIN or DIRECTOR only.
 */

export function getTashkentDate(date: Date = new Date()): { hour: number; fullDate: Date } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tashkent',
      hour: 'numeric',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    const parts = formatter.formatToParts(date)
    const p: Record<string, string> = {}
    parts.forEach((pt) => { p[pt.type] = pt.value })
    const hour = parseInt(p.hour, 10)
    return { hour, fullDate: date }
  } catch {
    // Fallback UTC+5
    const hour = (date.getUTCHours() + 5) % 24
    return { hour, fullDate: date }
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD in Tashkent timezone (Asia/Tashkent).
 */
export function getTodayTashkent(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(date) // "YYYY-MM-DD"
  } catch {
    return date.toISOString().split('T')[0]
  }
}

/**
 * Returns true if current time is after 17:00 (evening shift) or before 08:00 (morning).
 * Standard daytime working shift is 08:00 to 17:00.
 */
export function isAfterShiftHours(date: Date = new Date()): boolean {
  const { hour } = getTashkentDate(date)
  return hour >= 17 || hour < 8
}

/**
 * Returns true if current time is within the allowed overnight edit window: 17:00 - 09:00.
 */
export function isWithinShiftEditWindow(date: Date = new Date()): boolean {
  const { hour } = getTashkentDate(date)
  return hour >= 17 || hour < 9
}

/**
 * Returns true if record was created within the last 24 hours.
 */
export function isWithin24Hours(createdAt: Date | string | null | undefined, now = new Date()): boolean {
  if (!createdAt) return true // brand new or unrecorded
  const createdMs = new Date(createdAt).getTime()
  if (isNaN(createdMs)) return true
  const ageMs = now.getTime() - createdMs
  return ageMs <= 24 * 60 * 60 * 1000
}

/**
 * Returns true if record was created within a standard 12-hour work shift.
 */
export function isWithinShiftHours(createdAt: Date | string | null | undefined, shiftHours: number = 12, now = new Date()): boolean {
  if (!createdAt) return true
  const createdMs = new Date(createdAt).getTime()
  if (isNaN(createdMs)) return true
  const ageMs = now.getTime() - createdMs
  return ageMs <= shiftHours * 60 * 60 * 1000
}

export interface PermissionCheckResult {
  allowed: boolean
  isAdmin: boolean
  isAfter24h: boolean
  isOutsideHours: boolean
  reason?: string
}

/**
 * General check for shop report records (24h + 17:00-09:00 window).
 */
export function checkEditPermission(params: {
  role?: string | null
  createdAt?: Date | string | null
  now?: Date
}): PermissionCheckResult {
  const { role, createdAt, now = new Date() } = params
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'

  if (isAdmin) {
    return {
      allowed: true,
      isAdmin: true,
      isAfter24h: false,
      isOutsideHours: false,
    }
  }

  // Supply role is strictly read-only for shop reports (arrivals, expenses, GP)
  if (normalizedRole === 'SUPPLY') {
    return {
      allowed: false,
      isAdmin: false,
      isAfter24h: false,
      isOutsideHours: false,
      reason: "Ta'minotchi (Supply) xodimi uchun ushbu bo'lim faqat ko'rish rejimida ishlaydi. Ma'lumot kiritish yoki tahrirlash huquqi yo'q.",
    }
  }

  const in24h = isWithin24Hours(createdAt, now)
  if (!in24h) {
    return {
      allowed: false,
      isAdmin: false,
      isAfter24h: true,
      isOutsideHours: false,
      reason: "Kiritilganiga 24 soatdan oshgan. Ushbu yozuvni faqat Administrator o'zgartirishi mumkin.",
    }
  }

  // 17:00 dan keyingi holat tekshiruvi:
  // 08:00 - 17:00: Ish vaqti, erkin kiritish/tahrirlash ruxsat etiladi.
  // 17:00 dan keyin: Tahrirlashga ruxsat beriladi, ammo majburiy sabab (reason) talab qilinadi!
  const after17 = isAfterShiftHours(now)

  return {
    allowed: true,
    isAdmin: false,
    isAfter24h: false,
    isOutsideHours: after17,
    reason: after17
      ? "Soat 17:00 dan keyingi o'zgartirish: Rasmiy sabab kiritish majburiydir!"
      : undefined,
  }
}

// =============================================================================
// MODULE 1: Kiruvchi xomashyo sifat aktlari (IncomingRawMaterialAct)
// Sifat nazoratchisi (QC) laboratoriya xulosasini saqlaganidan so'ng,
// 24 soatdan keyin faqat Bosh texnolog yoki Admin ruxsati bilan o'zgarishi kerak.
// O'chirish: Faqat Administrator yoki Direktor.
// =============================================================================

export function checkQcActEditPermission(params: {
  role?: string | null
  createdAt?: Date | string | null
  now?: Date
}): { allowed: boolean; reason?: string; isAuthorizedElevated: boolean } {
  const { role, createdAt, now = new Date() } = params
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isElevated = normalizedRole === 'TECHNOLOGY' || normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'

  if (isElevated) {
    return { allowed: true, isAuthorizedElevated: true }
  }

  const in24h = isWithin24Hours(createdAt, now)
  if (!in24h) {
    return {
      allowed: false,
      isAuthorizedElevated: false,
      reason: "Ushbu sifat akti kiritilganiga 24 soatdan oshgan. Laboratoriya xulosasini faqat Bosh Texnolog yoki Administrator o'zgartirishi mumkin!",
    }
  }

  return { allowed: true, isAuthorizedElevated: false }
}

export function checkQcActDeletePermission(role?: string | null): { allowed: boolean; reason?: string } {
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'
  if (!isAdmin) {
    return {
      allowed: false,
      reason: "Sifat aktini o'chirish huquqi faqat Tizim Administratoriga berilgan!",
    }
  }
  return { allowed: true }
}

// =============================================================================
// MODULE 2: Brak va nuqson aktlari (DefectLog / DailyQCChecklist)
// Sexda aniqlangan brak miqdorlarini xodimlar o'z xohishicha kamaytirib qo'ymasligi uchun
// belgilangan smena yakunlangach tahrir bloklanishi shart.
// Smena yakunlangach tahrir faqat Bosh QC (QUALITY_CONTROL) yoki Admin ruxsati bilan.
// O'chirish: Faqat Administrator yoki Direktor.
// =============================================================================

export function checkDefectEditPermission(params: {
  role?: string | null
  createdAt?: Date | string | null
  oldQuantity?: number | null
  newQuantity?: number | null
  now?: Date
}): { allowed: boolean; reason?: string; isAuthorizedElevated: boolean } {
  const { role, createdAt, oldQuantity, newQuantity, now = new Date() } = params
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isElevated = normalizedRole === 'QUALITY_CONTROL' || normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'

  if (isElevated) {
    return { allowed: true, isAuthorizedElevated: true }
  }

  // Check if non-elevated user is attempting to reduce defect quantity
  if (
    oldQuantity !== undefined &&
    oldQuantity !== null &&
    newQuantity !== undefined &&
    newQuantity !== null &&
    Number(newQuantity) < Number(oldQuantity) - 0.001
  ) {
    return {
      allowed: false,
      isAuthorizedElevated: false,
      reason: `Sex xodimlari tomonidan brak miqdorini kamaytirish qat'iyan taqiqlangan! (${oldQuantity} kg dan ${newQuantity} kg ga kamaytirish faqat Bosh Sifat Nazorati (QC) yoki Administrator ruxsati bilan mumkin).`,
    }
  }

  // Check shift completion (12 hours)
  const inShift = isWithinShiftHours(createdAt, 12, now)
  if (!inShift) {
    return {
      allowed: false,
      isAuthorizedElevated: false,
      reason: "Belgilangan ish smenasi yakunlanganligi sababli ushbu brak akti tahrirlash uchun bloklangan. O'zgartirish kiritish faqat Bosh Sifat Nazoratchisi (QC) yoki Administrator ruxsati bilan amalga oshiriladi!",
    }
  }

  return { allowed: true, isAuthorizedElevated: false }
}

export function checkDefectDeletePermission(role?: string | null): { allowed: boolean; reason?: string } {
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'
  if (!isAdmin) {
    return {
      allowed: false,
      reason: "Brak va nuqson aktlarini o'chirish huquqi faqat Tizim Administratoriga berilgan!",
    }
  }
  return { allowed: true }
}

// =============================================================================
// MODULE 3: Ombor zaxirasidan to'g'ridan-to'g'ri chiqim (Списание)
// Buxgalteriya va ta'minot o'rtasidagi tafovutlarni oldini olish uchun
// 24 soatdan so'ng tahrir faqat Bosh buxgalter / Admin tasdig'i bilan bo'lishi maqsadga muvofiq.
// O'chirish: Faqat Administrator yoki Direktor.
// =============================================================================

export function checkWarehouseWriteOffPermission(params: {
  role?: string | null
  createdAt?: Date | string | null
  now?: Date
}): { allowed: boolean; reason?: string; isAuthorizedElevated: boolean } {
  const { role, createdAt, now = new Date() } = params
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isElevated = normalizedRole === 'ACCOUNTING' || normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'

  if (isElevated) {
    return { allowed: true, isAuthorizedElevated: true }
  }

  const in24h = isWithin24Hours(createdAt, now)
  if (!in24h) {
    return {
      allowed: false,
      isAuthorizedElevated: false,
      reason: "Ombor zaxirasidan chiqim (списание) qilinganiga 24 soatdan oshgan. Buxgalteriya va ta'minot o'rtasidagi tafovutlarni oldini olish uchun tahrirlash faqat Bosh buxgalter yoki Administrator ruxsati bilan amalga oshiriladi!",
    }
  }

  return { allowed: true, isAuthorizedElevated: false }
}

export function checkWarehouseWriteOffDeletePermission(role?: string | null): { allowed: boolean; reason?: string } {
  const normalizedRole = String(role || '').toUpperCase().trim()
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'DIRECTOR'
  if (!isAdmin) {
    return {
      allowed: false,
      reason: "Ombor chiqim hujjatlarini (списание) o'chirish huquqi faqat Tizim Administratoriga berilgan!",
    }
  }
  return { allowed: true }
}

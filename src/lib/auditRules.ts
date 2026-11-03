/**
 * Enterprise Audit and Edit-Restriction Rules for Factory Operations.
 * 
 * Rules:
 * 1. General staff (warehouse, production, etc.) may only edit entries within 24 hours of creation.
 * 2. Edits by non-admins are restricted to the overnight shift window: 17:00 to 09:00 (Uzbekistan Time, UTC+5).
 * 3. After 24 hours or outside the shift window, ONLY ADMIN and DIRECTOR roles have permission to edit.
 * 4. Any edit to an existing record requires a mandatory documented reason (editReason).
 * 5. Modified records must record audit trail and display prominent "O'zgartirilgan" indicators in red.
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
 * Returns true if current time is within the allowed overnight edit window: 17:00 - 09:00.
 */
export function isWithinShiftEditWindow(date: Date = new Date()): boolean {
  const { hour } = getTashkentDate(date)
  // Allowed from 17:00 in the evening to 09:00 in the morning
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

export interface PermissionCheckResult {
  allowed: boolean
  isAdmin: boolean
  isAfter24h: boolean
  isOutsideHours: boolean
  reason?: string
}

/**
 * Evaluates whether the current user is allowed to edit an existing record.
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

  const inShift = isWithinShiftEditWindow(now)
  if (!inShift) {
    return {
      allowed: false,
      isAdmin: false,
      isAfter24h: false,
      isOutsideHours: true,
      reason: "Tahrirlash faqat kechki soat 17:00 dan ertalabki 09:00 gacha ruxsat etiladi (Navbatchilik paytida).",
    }
  }

  return {
    allowed: true,
    isAdmin: false,
    isAfter24h: false,
    isOutsideHours: false,
  }
}

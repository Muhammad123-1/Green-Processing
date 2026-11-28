/**
 * Chat Permissions and Group Access Control
 * Ensures strict department isolation and private DMs
 */

export interface ChatUserContext {
  id: number
  role: string
  supplierId?: number | null
}

export const DEPARTMENT_CHANNELS = [
  {
    id: 'production_dept',
    name: 'Ishlab Chiqarish (Sex)',
    desc: 'Ishlab chiqarish jarayoni, liniyalar va partiyalar nazorati',
    badge: 'Sex / Ishlab Chiqarish',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'PRODUCTION', 'TECHNOLOGY', 'INSPECTOR', 'OPERATOR'],
  },
  {
    id: 'kitchen_supply',
    name: 'Oshxona & Ta\'minot',
    desc: 'Kunlik oziq-ovqat va menyu ta\'minoti',
    badge: 'Oshxona',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'KITCHEN', 'DEGUSTATION', 'SUPPLY'],
  },
  {
    id: 'qa_warehouse',
    name: 'Sifat Nazorati & Ombor',
    desc: 'Xom-ashyo qabuli, brak va laboratoriya tahlillari',
    badge: 'QC / Sklad',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'WAREHOUSE', 'SUPPLY'],
  },
  {
    id: 'accounting_finance',
    name: 'Buxgalteriya & Moliya',
    desc: 'To\'lovlar, schyot-fakturalar va o\'zaro hisob-kitoblar',
    badge: 'Moliya',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING'],
  },
  {
    id: 'tech_prod',
    name: 'Texnolog & Ishlab Chiqarish',
    desc: 'Retseptlar, liniya rejimi va chiqish normasi',
    badge: 'Sex / BOM',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'TECHNOLOGY', 'PRODUCTION', 'OPERATOR'],
  },
  {
    id: 'management',
    name: 'Rahbariyat & Audit',
    desc: 'Direktor, Moliya va boshqaruv xabarlari',
    badge: 'Audit',
    allowedRoles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING', 'HR'],
  },
  {
    id: 'general',
    name: 'Umumiy E\'lonlar',
    desc: 'Rahbariyatning rasmiy e\'lon va buyruqlari',
    badge: 'E\'lonlar',
    allowedRoles: [
      'ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'TECHNOLOGY',
      'PRODUCTION', 'KITCHEN', 'DEGUSTATION', 'WAREHOUSE', 'SUPPLY',
      'ACCOUNTING', 'HR', 'SECURITY', 'OPERATOR'
    ],
  },
] as const

/**
 * Check if a user can view / receive messages for a groupId
 */
export function canUserAccessGroup(groupId: string, user: ChatUserContext): boolean {
  if (!user || !user.role) return false
  const { id: userId, role: userRole, supplierId } = user
  const isAdminOrDirector = userRole === 'ADMIN' || userRole === 'DIRECTOR'

  // 1. Direct Messages (DM): strictly between the two participants
  if (groupId.startsWith('dm_')) {
    const parts = groupId.replace('dm_', '').split('_')
    const participantIds = parts.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
    if (participantIds.length > 0 && userId > 0) {
      return participantIds.includes(userId)
    }
    return false
  }

  // 2. External Supplier Channels
  if (groupId.startsWith('supplier_')) {
    const targetSupplierId = parseInt(groupId.replace('supplier_', ''), 10)
    if (userRole === 'SUPPLIER') {
      return supplierId === targetSupplierId
    }
    // Only enterprise SUPPLY and ADMIN can see supplier chats
    return userRole === 'SUPPLY' || userRole === 'ADMIN'
  }

  // Suppliers cannot see internal company channels
  if (userRole === 'SUPPLIER') {
    return false
  }

  // Admin and Director have universal oversight
  if (isAdminOrDirector) {
    return true
  }

  // 3. Department Channels
  switch (groupId) {
    case 'production_dept':
      return ['PRODUCTION', 'TECHNOLOGY', 'INSPECTOR', 'OPERATOR'].includes(userRole)

    case 'kitchen_supply':
      return ['KITCHEN', 'DEGUSTATION', 'SUPPLY'].includes(userRole)

    case 'qa_warehouse':
      return ['QUALITY_CONTROL', 'INSPECTOR', 'WAREHOUSE', 'SUPPLY', 'SECURITY'].includes(userRole)

    case 'tech_prod':
      return ['TECHNOLOGY', 'PRODUCTION', 'OPERATOR'].includes(userRole)

    case 'accounting_finance':
      return ['ACCOUNTING'].includes(userRole)

    case 'management':
      return ['ACCOUNTING', 'HR'].includes(userRole)

    case 'general':
      // General announcements visible to all internal factory staff
      return true

    default:
      return false
  }
}

/**
 * Check if a user is permitted to write (POST) to a groupId
 */
export function canUserPostToGroup(
  groupId: string,
  user: ChatUserContext
): { allowed: boolean; reason?: string } {
  if (!canUserAccessGroup(groupId, user)) {
    return {
      allowed: false,
      reason: 'Ushbu guruh yoki suhbatga xabar yozish huquqiga ega emassiz'
    }
  }

  const isAdminOrDirector = user.role === 'ADMIN' || user.role === 'DIRECTOR'

  // General announcements channel:
  // Restricted to ADMIN & DIRECTOR (and automated system).
  // Prevents random department cross-talk that leaks across the factory.
  if (groupId === 'general' && !isAdminOrDirector) {
    return {
      allowed: false,
      reason: 'Umumiy e\'lonlar kanaliga faqat rahbariyat yoza oladi. Iltimos, o\'z bo\'limingiz guruhida yozing.'
    }
  }

  return { allowed: true }
}

/**
 * Return default channel for a given role so they land directly in their own department
 */
export function getDefaultGroupForRole(role: string): string {
  switch (role) {
    case 'KITCHEN':
    case 'DEGUSTATION':
      return 'kitchen_supply'

    case 'QUALITY_CONTROL':
    case 'INSPECTOR':
    case 'WAREHOUSE':
      return 'qa_warehouse'

    case 'PRODUCTION':
      return 'production_dept'

    case 'TECHNOLOGY':
    case 'OPERATOR':
      return 'tech_prod'

    case 'ACCOUNTING':
    case 'HR':
      return 'management'

    case 'SUPPLY':
      return 'qa_warehouse'

    case 'ADMIN':
    case 'DIRECTOR':
    default:
      return 'general'
  }
}

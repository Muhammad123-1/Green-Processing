/**
 * GREEN PROCESSING - TELEGRAM TOPIKLAR VA XAVFSIZLIK SOZLAMALARI
 * 
 * Bu yerda Telegram guruhidagi har bir topikning xavfsizlik qoidalarini
 * juda oson boshqarishingiz mumkin:
 * 
 * - requireLogin: true  -> Ushbu topikda yozish uchun xodim botda login qilgan bo'lishi shart!
 *                          Agar loginsiz yozsa, bot uning xabarini o'chiradi.
 * - requireLogin: false -> Ushbu topik hammaga ochiq (login shart emas).
 * - allowedRoles: [...] -> Faqat shu rollardagi xodimlar yoza oladi ('ALL' bo'lsa barcha xodimlar).
 * - dedicatedUser?: string -> Agar topik aniq 1 ta xodimniki bo'lsa (masalan: 'sklad1'),
 *                             faqat o'sha xodim va direktor yoza oladi.
 * - threadId: number    -> Guruhdagi topikning ID raqami.
 */

export interface TopicRule {
  key: string
  name: string
  threadId: number | null
  requireLogin: boolean
  allowedRoles: string[]
  dedicatedUser?: string // Aniq bir xodim logini (agar individual topik bo'lsa)
  description?: string
}

export const TOPIC_RULES: Record<string, TopicRule> = {
  // 1. Umumiy e'lonlar - OCHIQ (Asosiy chat / threadId: null)
  general: {
    key: 'general',
    name: "Umumiy e'lonlar",
    threadId: null,
    requireLogin: false,
    allowedRoles: ['ALL'],
    description: "Barcha korxona xodimlari uchun ochiq e'lonlar"
  },

  // 2. Directorni o'zi (threadId: 2) - O'TA MAXFIY
  director_solo: {
    key: 'director_solo',
    name: "Directorni o'zi",
    threadId: 2,
    requireLogin: true,
    allowedRoles: ['DIRECTOR', 'ADMIN'],
    dedicatedUser: 'director',
    description: "Faqat direktorning shaxsiy xabarnomalari va eslatmalari"
  },

  // 3. Sifat nazoratchisini o'zi (threadId: 4)
  quality_solo: {
    key: 'quality_solo',
    name: "Sifat nazoratchisini o'zi",
    threadId: 4,
    requireLogin: true,
    allowedRoles: ['QUALITY_CONTROL', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "Sifat nazoratchisiga to'g'ridan-to'g'ri topshiriqlar va aktlar"
  },

  // 4. Ombor va sifat nazoratchisi (threadId: 6)
  warehouse_quality: {
    key: 'warehouse_quality',
    name: "Ombor va sifat nazoratchisi",
    threadId: 6,
    requireLogin: true,
    allowedRoles: ['WAREHOUSE', 'QUALITY_CONTROL', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "Kirim vaqtida qabul hamda sifat tekshiruvini birgalikda muvofiqlashtirish"
  },

  // 5. Ta'minot va zakazlar (threadId: 8)
  supply_orders: {
    key: 'supply_orders',
    name: "Ta'minot va zakazlar",
    threadId: 8,
    requireLogin: true,
    allowedRoles: ['SUPPLY', 'DIRECTOR', 'ADMIN', 'WAREHOUSE'],
    description: "Xarid buyurtmalari va yetkazib beruvchilar bilan ishlar"
  },

  // 6. Sex va ishlab chiqarish (threadId: 10)
  production_shop: {
    key: 'production_shop',
    name: "Sex va ishlab chiqarish",
    threadId: 10,
    requireLogin: true,
    allowedRoles: ['PRODUCTION', 'TECHNOLOGY', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "Ishlab chiqarish liniyasi va smena jarayonlari"
  },

  // 7. Laboratoriya va sifat (threadId: 12)
  lab_quality: {
    key: 'lab_quality',
    name: "Laboratoriya va sifat",
    threadId: 12,
    requireLogin: true,
    allowedRoles: ['QUALITY_CONTROL', 'INSPECTOR', 'TECHNOLOGY', 'DIRECTOR', 'ADMIN'],
    description: "Laboratoriya tahlillari, kimyoviy ko'rsatkichlar va xulosalar"
  },

  // 8. Ta'minot va Ombor (threadId: 32)
  supply_warehouse: {
    key: 'supply_warehouse',
    name: "Ta'minot va Ombor",
    threadId: 32,
    requireLogin: true,
    allowedRoles: ['SUPPLY', 'WAREHOUSE', 'DIRECTOR', 'ADMIN'],
    description: "Xomashyo qoldiqlari, kam qolgan tovarlar va yetkazish rejalari"
  },

  // 9. Sex ishlab chiqarish (threadId: 34)
  production_main: {
    key: 'production_main',
    name: "Sex ishlab chiqarish",
    threadId: 34,
    requireLogin: true,
    allowedRoles: ['PRODUCTION', 'TECHNOLOGY', 'DIRECTOR', 'ADMIN'],
    description: "Sexning asosiy ish faoliyati va kunlik hisobotlari"
  },

  // 10. Laboratoriya va standartlar (threadId: 36)
  lab_standards: {
    key: 'lab_standards',
    name: "Laboratoriya va standartlar",
    threadId: 36,
    requireLogin: true,
    allowedRoles: ['QUALITY_CONTROL', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "FSSC 22000, ISO va korxona sifat standartlari"
  },

  // 11. Buxgalteriya va moliya (threadId: 38)
  accounting: {
    key: 'accounting',
    name: "Buxgalteriya va moliya",
    threadId: 38,
    requireLogin: true,
    allowedRoles: ['ACCOUNTING', 'DIRECTOR', 'ADMIN', 'SUPPLY'],
    description: "Hisob-kitoblar, to'lovlar, fakturalar va moliya"
  },

  // 12. Rahbariyat & Direktor (threadId: 40) - O'TA MAXFIY
  director_mgmt: {
    key: 'director_mgmt',
    name: "Rahbariyat & Direktor",
    threadId: 40,
    requireLogin: true,
    allowedRoles: ['DIRECTOR', 'ADMIN'],
    description: "Korxona rahbariyati, direktor va boshqaruv xabarlari"
  },

  // 13. Oshxona menyular (threadId: 42) - OCHIQ
  kitchen: {
    key: 'kitchen',
    name: "Oshxona menyular",
    threadId: 42,
    requireLogin: false,
    allowedRoles: ['ALL'],
    description: "Kunlik taomlar, menyu va umumiy takliflar"
  }
}

/**
 * XODIMLAR UCHUN MAXSUS INDIVIDUAL TOPIKLAR
 * 
 * Yangi xodim uchun shaxsiy topik ochganingizda, shu yerga qo'shib qo'yasiz:
 * Masalan:
 * user_nodir: { key: 'user_nodir', name: 'Nodir (Omborchi)', threadId: 50, dedicatedUser: 'nodir', requireLogin: true, allowedRoles: ['WAREHOUSE', 'DIRECTOR', 'ADMIN'] }
 */
export const EMPLOYEE_DEDICATED_TOPICS: Record<string, TopicRule> = {}

/**
 * threadId orqali qoidani topish yordamchisi
 */
export function findTopicRule(threadId: number | null): TopicRule | undefined {
  // Avval umumiy topiklardan qidiramiz
  const generalRule = Object.values(TOPIC_RULES).find(r => r.threadId === threadId)
  if (generalRule) return generalRule

  // Keyin individual xodim topiklaridan qidiramiz
  return Object.values(EMPLOYEE_DEDICATED_TOPICS).find(r => r.threadId === threadId)
}

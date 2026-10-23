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
 * - threadId: number    -> Guruhdagi topikning ID raqami (guruhda /id yozib bilib olasiz).
 */

export interface TopicRule {
  key: string
  name: string
  threadId: number | null
  requireLogin: boolean
  allowedRoles: string[]
  description?: string
}

export const TOPIC_RULES: Record<string, TopicRule> = {
  // 1. Umumiy e'lonlar - OCHIQ (login talab qilinmaydi)
  general: {
    key: 'general',
    name: "Umumiy e'lonlar",
    threadId: null, // Asosiy guruh chati
    requireLogin: false,
    allowedRoles: ['ALL'],
    description: "Barcha korxona xodimlari uchun ochiq e'lonlar"
  },

  // 2. Omborxona - FAQAT LOGIN QILGANLAR (Ombor, Ta'minot, Sifat, Direktor)
  warehouse: {
    key: 'warehouse',
    name: "Omborxona & Xomashyo",
    threadId: 2, // O'zgartirishingiz mumkin (/id yozib)
    requireLogin: true,
    allowedRoles: ['WAREHOUSE', 'SUPPLY', 'DIRECTOR', 'ADMIN', 'QUALITY_CONTROL'],
    description: "Kiruvchi xomashyo, qoldiqlar va ombor talabnomalari"
  },

  // 3. Ta'minot - FAQAT TA'MINOT VA DIREKTOR
  supply: {
    key: 'supply',
    name: "Ta'minot & Zakazlar",
    threadId: 4, // O'zgartirishingiz mumkin
    requireLogin: true,
    allowedRoles: ['SUPPLY', 'DIRECTOR', 'ADMIN'],
    description: "Xaridlar, ta'minotchi buyurtmalari va monitoring"
  },

  // 4. Sex / Ishlab chiqarish - SEX VA TEXNOLOGLAR
  production: {
    key: 'production',
    name: "Sex & Ishlab Chiqarish",
    threadId: 6, // O'zgartirishingiz mumkin
    requireLogin: true,
    allowedRoles: ['PRODUCTION', 'TECHNOLOGY', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "Kunlik sex hisobotlari, smena va retseptlar"
  },

  // 5. Laboratoriya & Sifat nazorati - SIFAT VA NAZORATCHILAR
  quality: {
    key: 'quality',
    name: "Laboratoriya & Sifat Nazorati",
    threadId: 8, // O'zgartirishingiz mumkin
    requireLogin: true,
    allowedRoles: ['QUALITY_CONTROL', 'INSPECTOR', 'DIRECTOR', 'ADMIN'],
    description: "Brak aktlari, laboratoriya xulosalari va ruxsatnomalar"
  },

  // 6. Rahbariyat / Direktor - O'TA MAXFIY (Faqat direktorlar)
  director: {
    key: 'director',
    name: "Rahbariyat & Moliya",
    threadId: 10, // O'zgartirishingiz mumkin
    requireLogin: true,
    allowedRoles: ['DIRECTOR', 'ADMIN'],
    description: "Moliyaviy ko'rsatkichlar, KPI va strategik xulosalar"
  },

  // 7. Takliflar va Oshxona - HAMMAGA OCHIQ
  kitchen: {
    key: 'kitchen',
    name: "Oshxona & Takliflar",
    threadId: 12, // O'zgartirishingiz mumkin
    requireLogin: false,
    allowedRoles: ['ALL'],
    description: "Kunlik menyu, taomlar va anonim fikr-mulohazalar"
  }
}

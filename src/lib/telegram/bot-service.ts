import { Telegraf } from 'telegraf'
import { prisma } from '@/lib/prisma'
import { TOPIC_RULES, TopicRule } from './topics-config'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8654592033:AAHgeJbEh9u3oz7D3sWvRD-nk9osktWZIog'
const GROUP_ID = process.env.TELEGRAM_GROUP_ID || ''

export const bot = new Telegraf(BOT_TOKEN)

// Authenticated users cache (telegramUserId -> user info)
export interface AuthUser {
  telegramId: number
  telegramUsername?: string
  erpUserId: number
  username: string
  name: string
  role: string
  loggedInAt: Date
}

// In-memory session store (and can be synced with DB)
export const authUsersMap = new Map<number, AuthUser>()

// Default roles auto-provision for offline/demo logins
const DEFAULT_ROLES_MAP: Record<string, { name: string; role: string }> = {
  director: { name: 'Direktor', role: 'DIRECTOR' },
  admin: { name: 'Tizim Administratori', role: 'ADMIN' },
  quality: { name: 'Bosh Sifat Nazorati', role: 'QUALITY_CONTROL' },
  inspector: { name: 'Sex Nazoratchisi', role: 'INSPECTOR' },
  production: { name: 'Ishlab Chiqarish', role: 'PRODUCTION' },
  tech: { name: 'Texnolog', role: 'TECHNOLOGY' },
  warehouse: { name: 'Ombor (Sklad)', role: 'WAREHOUSE' },
  supply: { name: "Ta'minot", role: 'SUPPLY' },
  accounting: { name: 'Buxgalteriya', role: 'ACCOUNTING' },
  hr: { name: 'Kadrlar (HR)', role: 'HR' },
  kitchen: { name: 'Oshxona (Bosh Oshpaz)', role: 'KITCHEN' },
  security: { name: 'Xavfsizlik Xizmati', role: 'SECURITY' },
}

/**
 * 1. SHAXSIY CHAT BUYRUQLARI (/start, /login, /status, /logout)
 */
bot.start(async (ctx) => {
  if (ctx.chat.type !== 'private') return

  const user = authUsersMap.get(ctx.from.id)
  if (user) {
    return ctx.reply(
      `👋 Assalomu alaykum, *${user.name}*!\n\n` +
      `Siz tizimga kirmisiz.\n` +
      `Sizning rolingiz: \`${user.role}\`\n\n` +
      `Guruhdagi mavzularda bemalol xabar yozishingiz va yangiliklarni qabul qilishingiz mumkin.`,
      { parse_mode: 'Markdown' }
    )
  }

  return ctx.reply(
    `👋 Assalomu alaykum, *Green Processing* korxona botiga xush kelibsiz!\n\n` +
    `Korxona guruhidagi maxsus topiklarda ishlash va o'zingizga tegishli xabarnomalarni olish uchun ERP login-parolingiz bilan kiring:\n\n` +
    `👉 Format: \`/login [login] [parol]\`\n\n` +
    `_Masalan:_ \`/login warehouse 123\` yoki \`/login supply 123\``,
    { parse_mode: 'Markdown' }
  )
})

bot.command('login', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    ctx.deleteMessage().catch(() => {})
    return ctx.reply(
      '⚠️ Xavfsizlik yuzasidan login va parolingizni faqat botning shaxsiy chatiga yuboring!'
    )
  }

  const parts = ctx.message.text.split(' ')
  if (parts.length < 3) {
    return ctx.reply(
      '⚠️ Noto\'g\'ri format. Iltimos quyidagicha yozing:\n\n' +
      '`/login [login] [parol]`\n\n' +
      'Masalan: `/login warehouse 123`',
      { parse_mode: 'Markdown' }
    )
  }

  const username = parts[1].trim()
  const password = parts[2].trim()
  const lowerUser = username.toLowerCase()

  try {
    let dbUser = await prisma.user.findUnique({
      where: { username }
    })

    // If not found, check auto-provision defaults
    if (!dbUser && DEFAULT_ROLES_MAP[lowerUser] && password === '123') {
      dbUser = await prisma.user.create({
        data: {
          name: DEFAULT_ROLES_MAP[lowerUser].name,
          username: lowerUser,
          password: '123',
          role: DEFAULT_ROLES_MAP[lowerUser].role,
          isActive: true
        }
      })
    }

    if (!dbUser || dbUser.password !== password || !dbUser.isActive) {
      return ctx.reply('❌ Login yoki parol noto\'g\'ri! Iltimos qaytadan tekshirib ko\'ring.')
    }

    // Save session
    const authData: AuthUser = {
      telegramId: ctx.from.id,
      telegramUsername: ctx.from.username,
      erpUserId: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      loggedInAt: new Date()
    }
    authUsersMap.set(ctx.from.id, authData)

    // Allowed topics list for this user
    const allowedTopics = Object.values(TOPIC_RULES)
      .filter(t => !t.requireLogin || t.allowedRoles.includes('ALL') || t.allowedRoles.includes(dbUser!.role))
      .map(t => `• ${t.name}`)
      .join('\n')

    return ctx.reply(
      `✅ *Xush kelibsiz, ${dbUser.name}!*\n\n` +
      `Siz tizimga muvaffaqiyatli kirdingiz.\n` +
      `Sizning lavozimingiz: *${dbUser.role}*\n\n` +
      `*Siz yoza oladigan bo'limlar:*\n${allowedTopics}\n\n` +
      `Endi korxona guruhidagi tegishli topiklarda bemalol xabar qoldira olasiz.`,
      { parse_mode: 'Markdown' }
    )
  } catch (error: any) {
    console.error('Bot login error:', error)
    return ctx.reply('⚠️ Tizimda xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.')
  }
})

bot.command('status', async (ctx) => {
  const user = authUsersMap.get(ctx.from.id)
  if (!user) {
    return ctx.reply('Siz hali tizimga kirmagansiz. Kirish uchun: `/login [login] [parol]`', {
      parse_mode: 'Markdown'
    })
  }

  return ctx.reply(
    `👤 *Foydalanuvchi ma'lumotlari:*\n` +
    `• Ism: *${user.name}*\n` +
    `• Rol: \`${user.role}\`\n` +
    `• Tizimdagi login: \`${user.username}\`\n` +
    `• Kirgan vaqti: ${user.loggedInAt.toLocaleTimeString('uz-UZ')}`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('logout', async (ctx) => {
  authUsersMap.delete(ctx.from.id)
  return ctx.reply('🚪 Tizimdan muvaffaqiyatli chiqdingiz.')
})

/**
 * 2. TOPIK ID RAQAMINI BILISH BUYRUQLARI (/id yoki /topic)
 */
bot.command(['id', 'topic'], async (ctx) => {
  const threadId = ctx.message.message_thread_id || null
  const chatId = ctx.chat.id
  const chatTitle = 'title' in ctx.chat ? ctx.chat.title : 'Shaxsiy chat'

  return ctx.reply(
    `📌 *Ushbu joy ma'lumotlari:*\n\n` +
    `• Guruh nomi: *${chatTitle}*\n` +
    `• Guruh ID (chatId): \`${chatId}\`\n` +
    `• Topik ID (threadId): \`${threadId ? threadId : 'Asosiy chat (Topik emas)'}\`\n\n` +
    `_Ushbu raqamni \`topics-config.ts\` dagi mos bo'limning threadId ga qo'yishingiz mumkin._`,
    { parse_mode: 'Markdown' }
  )
})

/**
 * 3. GURUHDA HIMOYALANGAN TOPIKLARNI NAZORAT QILISH (MIDDLEWARE)
 */
bot.on('message', async (ctx, next) => {
  // Shaxsiy chatlarni tekshirish shart emas
  if (ctx.chat.type === 'private') return next()

  const currentThreadId = ctx.message.message_thread_id || null

  // Ushbu xabar qaysi topikda yozilganini topamiz
  const activeRule = Object.values(TOPIC_RULES).find(
    (rule) => rule.threadId === currentThreadId
  )

  // Agar bu topik sozlamalarda bo'lmasa yoki login talab qilinmasa -> ruxsat
  if (!activeRule || !activeRule.requireLogin) {
    return next()
  }

  // Agar ushbu topikga LOGIN TALAB QILINSA:
  const senderId = ctx.from.id
  const user = authUsersMap.get(senderId)

  // 1-Tekshiruv: Xodim botda login qilganmi?
  if (!user) {
    // Xabarni o'chirib tashlaymiz
    await ctx.deleteMessage().catch(() => {})

    const botUsername = ctx.botInfo.username
    const warning = await ctx.reply(
      `⚠️ Hurmatli [${ctx.from.first_name}](tg://user?id=${senderId}), ` +
      `«*${activeRule.name}*» bo'limi himoyalangan!\n\n` +
      `Bu yerda yozish uchun avval botimizga shaxsiy xabar yozib tizimga kiring:\n` +
      `👉 @${botUsername}`,
      { parse_mode: 'Markdown' }
    )

    // Guruh toza turishi uchun ogohlantirishni 8 soniyada o'chirish
    setTimeout(() => {
      ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {})
    }, 8000)

    return
  }

  // 2-Tekshiruv: Foydalanuvchi roli ushbu bo'limga to'g'ri keladimi?
  const hasAccess =
    activeRule.allowedRoles.includes('ALL') ||
    activeRule.allowedRoles.includes(user.role)

  if (!hasAccess) {
    await ctx.deleteMessage().catch(() => {})

    const warning = await ctx.reply(
      `⛔ [${user.name}](tg://user?id=${senderId}), sizning lavozimingiz (\`${user.role}\`) ` +
      `«*${activeRule.name}*» bo'limida xabar qoldirish huquqiga ega emas.`,
      { parse_mode: 'Markdown' }
    )

    setTimeout(() => {
      ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {})
    }, 8000)

    return
  }

  // Agar barcha tekshiruvlardan o'tsa -> xabar qoladi!
  return next()
})

/**
 * 4. ERP TIZIMIDAN TOPIKGA XABAR YUBORISH FUNKSIYASI
 */
export async function sendTopicNotification(
  topicKey: keyof typeof TOPIC_RULES | string,
  message: string,
  targetGroupId?: string
) {
  const groupId = targetGroupId || GROUP_ID
  if (!groupId) {
    console.warn('TELEGRAM_GROUP_ID sozlanmagan, xabar yuborilmadi.')
    return { success: false, error: 'Group ID not configured' }
  }

  const rule = TOPIC_RULES[topicKey as string]
  const threadId = rule ? rule.threadId : null

  try {
    const sent = await bot.telegram.sendMessage(groupId, message, {
      message_thread_id: threadId || undefined,
      parse_mode: 'HTML'
    })
    return { success: true, messageId: sent.message_id }
  } catch (error: any) {
    console.error(`Telegram xabar yuborishda xatolik (${topicKey}):`, error)
    return { success: false, error: error.message }
  }
}

/**
 * 5. XODIMNING SHAXSIY TELEGRAMIGA XABAR YUBORISH
 */
export async function sendDirectNotification(
  telegramId: number,
  message: string
) {
  try {
    const sent = await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'HTML'
    })
    return { success: true, messageId: sent.message_id }
  } catch (error: any) {
    console.error(`Shaxsiy xabar yuborishda xatolik (${telegramId}):`, error)
    return { success: false, error: error.message }
  }
}

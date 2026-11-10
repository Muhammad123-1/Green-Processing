import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const userRole = session?.role || 'OPERATOR'
    const userName = session?.name || 'Foydalanuvchi'
    const isDirectorOrAdmin = userRole === 'DIRECTOR' || userRole === 'ADMIN'

    const notifications: Array<{
      id: string
      type: 'CRITICAL_REPORT' | 'CHAT_MESSAGE' | 'LOW_STOCK' | 'DEFECT_ALERT' | 'INFO'
      priority: 'high' | 'medium' | 'normal'
      title: string
      titleRu: string
      message: string
      messageRu: string
      source: string
      sourceCategory: 'chat' | 'director' | 'warehouse' | 'qc'
      link: string
      actionLabel: string
      actionLabelRu: string
      createdAt: string
      icon: string
    }> = []

    // ---------------------------------------------------------------------------
    // SUPPLIER ISOLATION: Faqatgina yangi buyurtma kelganda bildirishnoma (SMS) keladi!
    // Boshqa hech qanday bildirishnoma (sex, ombor, brak, umumiy chat) ko'rinmaydi.
    // ---------------------------------------------------------------------------
    if (userRole === 'SUPPLIER') {
      const user = await prisma.user.findUnique({
        where: { id: session?.id },
        include: { supplier: true }
      })

      const targetSupplierId = user?.supplierId || session?.supplierId
      const targetSupplierName = user?.supplier?.name

      if (targetSupplierId || targetSupplierName) {
        // Find pending orders for this supplier
        const pendingOrders = await prisma.order.findMany({
          where: {
            AND: [
              {
                OR: [
                  ...(targetSupplierId ? [{ supplierId: targetSupplierId }] : []),
                  ...(targetSupplierName ? [{ supplierName: { contains: targetSupplierName, mode: 'insensitive' as const } }] : [])
                ]
              },
              { status: 'PENDING' }
            ]
          },
          include: { product: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        for (const ord of pendingOrders) {
          notifications.push({
            id: `supplier-order-${ord.id}`,
            type: 'INFO',
            priority: 'high',
            title: `Yangi Buyurtma #${ord.id}: ${ord.product?.name}`,
            titleRu: `Новый заказ #${ord.id}: ${ord.product?.name}`,
            message: `Green Processing zavodidan yangi buyurtma keldi: ${ord.quantity.toLocaleString()} ${ord.unit || 'kg'}. Kutilayotgan sana: ${new Date(ord.expectedDate).toLocaleDateString()} (${ord.timeRange || '09:00 - 13:00'}).`,
            messageRu: `Поступил заказ от завода: ${ord.quantity.toLocaleString()} ${ord.unit || 'кг'}. Ожидаемая дата: ${new Date(ord.expectedDate).toLocaleDateString()} (${ord.timeRange || '09:00 - 13:00'}).`,
            source: "Green Processing Xarid",
            sourceCategory: 'warehouse',
            link: '/supplier-portal',
            actionLabel: "Buyurtmani ko'rish",
            actionLabelRu: "Открыть заказ",
            createdAt: ord.createdAt.toISOString(),
            icon: 'package'
          })
        }
      }

      return NextResponse.json({ notifications })
    }

    const now = new Date()
    // Tashkent time UTC+5
    const tzOffsetMs = 5 * 60 * 60 * 1000
    const localTime = new Date(now.getTime() + tzOffsetMs)
    const todayStr = localTime.toISOString().split('T')[0]

    // ---------------------------------------------------------------------------
    // OSHXONA & DEGUSTATSIYA CHEKLOVI:
    // Oshxona (KITCHEN) va Degustatsiya (DEGUSTATION) xodimlariga kunlik zavod
    // kirim-chiqim hisoboti (CRITICAL_REPORT) hamda sexdagi brak/nuqson (DEFECT_ALERT)
    // ogohlantirishlari KERAK EMAS. Ular faqatgina chatda xabar kelgandagina
    // ogohlantirish oladi va tizimga kiradi.
    // ---------------------------------------------------------------------------
    const isKitchenOrDegustation = userRole === 'KITCHEN' || userRole === 'DEGUSTATION'

    // ---------------------------------------------------------------------------
    // 1. DIREKTOR NAZORATI: Bugungi Sex Ishlab Chiqarish Hisoboti kiritildimi?
    // ---------------------------------------------------------------------------
    let todayExpense: any = null
    if (!isKitchenOrDegustation) {
      const [expRes] = await Promise.all([
        prisma.shopExpense.findFirst({
          where: { date: todayStr }
        })
      ])
      todayExpense = expRes

      // Agar bugungi hisobot hali kiritilmagan bo'lsa:
      if (!todayExpense) {
        notifications.push({
          id: `missing-shop-report-${todayStr}`,
          type: 'CRITICAL_REPORT',
          priority: 'high',
          title: "Bugungi kunlik ish hisoboti kiritilmadi!",
          titleRu: "Отчет по приходу и расходу за сегодня еще не введен!",
          message: `Kirim va Chiqim (Отчет по приходу и расходу) bo'yicha bugungi kun (${todayStr}) hisoboti hali kiritilmagan. Mas'ul xodimlarga eslatma yuboring yoki hisobotni to'ldiring.`,
          messageRu: `Отчет по приходу и расходу за сегодня (${todayStr}) еще не заполнен. Проверьте статус или отправьте напоминание мастеру смены.`,
          source: isDirectorOrAdmin ? "Direktor Nazorati" : "Kunlik Majburiy Hisobot",
          sourceCategory: 'director',
          link: '/shop-report',
          actionLabel: "Hisobotga o'tish",
          actionLabelRu: "Перейти к отчету",
          createdAt: now.toISOString(),
          icon: 'AlertTriangle'
        })
      }
    }

    // ---------------------------------------------------------------------------
    // 2. CHAT XABARLARI: Direktor yoki xodimlar chatidan kelgan xabarlar
    // ---------------------------------------------------------------------------
    const recentMessages = await prisma.chatMessage.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' }
    })

    const channelNames: Record<string, { uz: string; ru: string; category: string }> = {
      general: { uz: 'Umumiy Zavod Chati', ru: 'Общий чат завода', category: 'Xodimlar' },
      qa_warehouse: { uz: 'Sifat Nazorati & Ombor', ru: 'Контроль качества и склад', category: 'Sklad & QC' },
      kitchen_supply: { uz: "Oshxona & Ta'minot", ru: 'Кухня и снабжение', category: 'Ta\'minot' },
      tech_prod: { uz: 'Texnolog & Ishlab Chiqarish', ru: 'Технолог и производство', category: 'Sex' },
      management: { uz: 'Rahbariyat & Direktor Chati', ru: 'Чат руководства и директора', category: 'Direktor' }
    }

    const currentUserId = session?.id || 0

    for (const msg of recentMessages) {
      // Skip own messages
      if (msg.sender === userName || msg.sender === userRole || msg.sender === String(currentUserId)) {
        continue
      }

      // Skip already read messages
      if (
        msg.readBy.includes(userName) ||
        msg.readBy.includes(userRole) ||
        msg.readBy.includes(String(currentUserId))
      ) {
        continue
      }

      // Skip private DMs if current user is not a participant
      if (msg.groupId.startsWith('dm_')) {
        const parts = msg.groupId.replace('dm_', '').split('_')
        const participantIds = parts.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
        if (!participantIds.includes(currentUserId)) continue
      }

      // Skip supplier chat messages for all factory staff except SUPPLY and ADMIN
      if (msg.groupId.startsWith('supplier_')) {
        const sId = parseInt(msg.groupId.replace('supplier_', ''), 10)
        if (userRole === 'SUPPLIER') {
          if (session?.supplierId !== sId) continue
        } else if (userRole !== 'SUPPLY' && userRole !== 'ADMIN') {
          continue
        }
      }

      // Oshxona va Degustatsiya xodimlariga faqat tegishli chatlar (Oshxona guruhi, Shaxsiy DM, Umumiy e'lonlar)
      if (isKitchenOrDegustation) {
        if (msg.groupId !== 'kitchen_supply' && msg.groupId !== 'general' && !msg.groupId.startsWith('dm_')) {
          continue
        }
      }

      const ch = channelNames[msg.groupId] || { uz: 'Zavod Chati', ru: 'Чат завода', category: 'Chat' }
      const isDirectorMsg = msg.groupId === 'management' || msg.sender.toLowerCase().includes('direktor')

      const previewText = msg.text
        ? msg.text.length > 75
          ? msg.text.slice(0, 75) + '...'
          : msg.text
        : 'Rasm biriktirilgan'

      notifications.push({
        id: `chat-msg-${msg.id}`,
        type: 'CHAT_MESSAGE',
        priority: isDirectorMsg ? 'high' : 'normal',
        title: `${ch.uz}: ${msg.sender}`,
        titleRu: `${ch.ru}: ${msg.sender}`,
        message: previewText,
        messageRu: previewText,
        source: isDirectorMsg ? "Direktor & Rahbariyat" : ch.uz,
        sourceCategory: 'chat',
        link: `/chat?group=${msg.groupId}`,
        actionLabel: "Chatni ochish",
        actionLabelRu: "Открыть чат",
        createdAt: msg.createdAt.toISOString(),
        icon: isDirectorMsg ? 'Briefcase' : 'MessageSquare'
      })
    }

    // ---------------------------------------------------------------------------
    // 3. DEFECT & BRAK OGOHLANTIRISHLARI (Oshxona va Degustatsiya uchun kerak emas)
    // ---------------------------------------------------------------------------
    if (!isKitchenOrDegustation) {
      const recentDefect = await prisma.defectLog.findFirst({
        where: { status: 'RECORDED' },
        orderBy: { createdAt: 'desc' },
        include: { product: true }
      })

      if (recentDefect) {
        notifications.push({
          id: `defect-log-${recentDefect.id}`,
          type: 'DEFECT_ALERT',
          priority: 'medium',
          title: `Brak / Nuqson qayd etildi: ${recentDefect.product?.name || 'Mahsulot'}`,
          titleRu: `Зафиксирован брак: ${recentDefect.product?.name || 'Продукция'}`,
          message: `${recentDefect.defectType}: ${recentDefect.quantity} ${recentDefect.unit} mahsulotda nuqson aniqlandi. Qaror: ${recentDefect.actionTaken}`,
          messageRu: `${recentDefect.defectType}: ${recentDefect.quantity} ${recentDefect.unit} с дефектом. Решение: ${recentDefect.actionTaken}`,
          source: "Sifat Nazorati (QC)",
          sourceCategory: 'qc',
          link: '/inspections',
          actionLabel: "Aktni ko'rish",
          actionLabelRu: "Посмотреть акт",
          createdAt: recentDefect.createdAt.toISOString(),
          icon: 'ShieldAlert'
        })
      }
    }

    // Sort: High priority first, then by date descending
    const sorted = notifications.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (b.priority === 'high' && a.priority !== 'high') return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      notifications: sorted,
      meta: {
        total: sorted.length,
        hasMissingReport: !todayExpense,
        todayStr
      }
    })
  } catch (error: any) {
    console.error('Failed to generate notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

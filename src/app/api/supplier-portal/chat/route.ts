import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let targetSupplierId: number | null = null

    if (session.role === 'SUPPLIER') {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { supplierId: true }
      })
      targetSupplierId = user?.supplierId || session.supplierId || null
    } else if (session.role === 'SUPPLY' || session.role === 'ADMIN' || session.role === 'DIRECTOR') {
      const { searchParams } = new URL(request.url)
      const qId = searchParams.get('supplierId')
      if (qId && !isNaN(parseInt(qId))) {
        targetSupplierId = parseInt(qId)
      }
    } else {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 403 })
    }

    if (!targetSupplierId) {
      return NextResponse.json({ messages: [], supplierId: null })
    }

    const groupId = `supplier_${targetSupplierId}`

    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 150
    })

    // Mark unread messages as read by current user
    const currentUserName = session.name || session.role
    const unreadMessageIds = messages
      .filter(m => !m.readBy.includes(currentUserName))
      .map(m => m.id)

    if (unreadMessageIds.length > 0) {
      await Promise.all(
        unreadMessageIds.map(id =>
          prisma.chatMessage.update({
            where: { id },
            data: {
              readBy: {
                push: currentUserName
              }
            }
          }).catch(() => {})
        )
      )
    }

    return NextResponse.json({ messages, supplierId: targetSupplierId })
  } catch (error: any) {
    console.error('Supplier chat GET error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, imageUrl, supplierId } = body

    if ((!text || !text.trim()) && !imageUrl) {
      return NextResponse.json({ error: 'Xabar matni yoki rasm kerak' }, { status: 400 })
    }

    let targetSupplierId: number | null = null
    let senderName = ''

    if (session.role === 'SUPPLIER') {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: { supplier: true }
      })
      targetSupplierId = user?.supplierId || session.supplierId || null
      const companyName = user?.supplier?.shortName || user?.supplier?.name || "Ta'minotchi"
      senderName = `${user?.name || session.name} (${companyName})`
    } else if (session.role === 'SUPPLY' || session.role === 'ADMIN' || session.role === 'DIRECTOR') {
      if (!supplierId) {
        return NextResponse.json({ error: "Ta'minotchi tanlanmadi" }, { status: 400 })
      }
      targetSupplierId = parseInt(supplierId)
      senderName = `Green Processing Ta'minot (${session.name || 'Zavod'})`
    } else {
      return NextResponse.json({ error: 'Faqat ta\'minotchi va ta\'minot bo\'limi yozisha oladi' }, { status: 403 })
    }

    if (!targetSupplierId) {
      return NextResponse.json({ error: 'Ta\'minotchi ID topilmadi' }, { status: 400 })
    }

    const groupId = `supplier_${targetSupplierId}`

    const newMessage = await prisma.chatMessage.create({
      data: {
        groupId,
        sender: senderName,
        text: text ? text.trim() : null,
        imageUrl: imageUrl || null,
        readBy: [senderName]
      }
    })

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 })
  } catch (error: any) {
    console.error('Supplier chat POST error:', error)
    return NextResponse.json({ error: error.message || 'Xabar yuborishda xatolik' }, { status: 500 })
  }
}

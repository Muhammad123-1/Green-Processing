import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || 'general'
    const userIdentifier = session.name || session.role

    // Role-based protection for supplier chat groups
    if (groupId.startsWith('supplier_')) {
      const targetSupplierId = parseInt(groupId.replace('supplier_', ''), 10)
      if (session.role === 'SUPPLIER') {
        const u = await prisma.user.findUnique({
          where: { id: session.id },
          select: { supplierId: true }
        })
        const mySupplierId = u?.supplierId || session.supplierId
        if (!mySupplierId || mySupplierId !== targetSupplierId) {
          return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
        }
      } else if (session.role !== 'SUPPLY' && session.role !== 'ADMIN') {
        // Faqat korxona ta'minot bo'limi (SUPPLY) ta'minotchilar bilan yozisha va ko'ra oladi
        return NextResponse.json({ error: "Ta'minotchi bilan faqat korxona ta'minot bo'limi gaplasha oladi" }, { status: 403 })
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 300
    })

    // Mark unread messages as read by the current user
    const unreadMessagesIds = messages
      .filter(
        msg =>
          msg.sender !== userIdentifier &&
          msg.sender !== session.role &&
          msg.sender !== String(session.id) &&
          !msg.readBy.includes(userIdentifier) &&
          !msg.readBy.includes(session.role) &&
          !msg.readBy.includes(String(session.id))
      )
      .map(msg => msg.id)

    if (unreadMessagesIds.length > 0) {
      for (const id of unreadMessagesIds) {
        const msg = messages.find(m => m.id === id)
        const updatedReadBy = Array.from(
          new Set([...(msg?.readBy || []), userIdentifier, session.role, String(session.id)])
        ).filter(Boolean)
        await prisma.chatMessage.update({
          where: { id },
          data: { readBy: updatedReadBy }
        })
        if (msg) {
          msg.readBy = updatedReadBy
        }
      }
    }
    
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    const groupId = searchParams.get('groupId')
    const userIdentifier = session.name || session.role
    const isAdminOrDirector = session.role === 'ADMIN' || session.role === 'DIRECTOR'

    if (idParam) {
      const msgId = parseInt(idParam, 10)
      if (isNaN(msgId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

      const msg = await prisma.chatMessage.findUnique({ where: { id: msgId } })
      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

      // Can delete if Admin/Director OR if the message is by this sender
      if (!isAdminOrDirector && msg.sender !== userIdentifier && msg.sender !== session.role) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.chatMessage.delete({ where: { id: msgId } })
      return NextResponse.json({ success: true, deletedId: msgId })
    }

    // Clear group messages (Admin or Director only)
    if (groupId && isAdminOrDirector) {
      await prisma.chatMessage.deleteMany({ where: { groupId } })
      return NextResponse.json({ success: true, clearedGroupId: groupId })
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const userIdentifier = session.name || session.role
    const groupId = body.groupId || 'general'

    let sender = userIdentifier

    // When writing to a supplier channel, ensure clear sender identification and strict authorization
    if (groupId.startsWith('supplier_')) {
      const targetSupplierId = parseInt(groupId.replace('supplier_', ''), 10)
      if (session.role === 'SUPPLIER') {
        const u = await prisma.user.findUnique({
          where: { id: session.id },
          include: { supplier: true }
        })
        const mySupplierId = u?.supplierId || session.supplierId
        if (!mySupplierId || mySupplierId !== targetSupplierId) {
          return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
        }
        const comp = u?.supplier?.shortName || u?.supplier?.name || "Ta'minotchi"
        sender = `${u?.name || session.name} (${comp})`
      } else if (session.role === 'SUPPLY' || session.role === 'ADMIN') {
        // Factory staff (Supply, Admin)
        sender = `Green Processing Ta'minot (${session.name || 'Ta\'minot'})`
      } else {
        return NextResponse.json({ error: "Ta'minotchi bilan faqat korxona ta'minot bo'limi gaplasha oladi" }, { status: 403 })
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        sender,
        text: body.text || null,
        imageUrl: body.imageUrl || null,
        groupId,
        readBy: [sender, userIdentifier, session.role, String(session.id)]
      }
    })
    
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}


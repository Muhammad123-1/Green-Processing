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

    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 300
    })

    // Mark unread messages as read by the current user
    const unreadMessagesIds = messages
      .filter(msg => msg.sender !== userIdentifier && !msg.readBy.includes(userIdentifier) && !msg.readBy.includes(session.role))
      .map(msg => msg.id)

    if (unreadMessagesIds.length > 0) {
      await prisma.chatMessage.updateMany({
        where: { id: { in: unreadMessagesIds } },
        data: {
          readBy: {
            push: userIdentifier
          }
        }
      })
      
      messages.forEach(msg => {
        if (unreadMessagesIds.includes(msg.id)) {
          msg.readBy.push(userIdentifier)
        }
      })
    }
    
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const userIdentifier = session.name || session.role

    const message = await prisma.chatMessage.create({
      data: {
        sender: userIdentifier,
        text: body.text || null,
        imageUrl: body.imageUrl || null,
        groupId: body.groupId || 'general',
        readBy: [userIdentifier]
      }
    })
    
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}


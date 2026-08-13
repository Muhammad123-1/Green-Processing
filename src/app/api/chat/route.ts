import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || 'general'
    
    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 200 // To prevent fetching too many initially
    })

    // Mark unread messages as read by the current user
    const unreadMessagesIds = messages
      .filter(msg => msg.sender !== session.role && !msg.readBy.includes(session.role))
      .map(msg => msg.id)

    if (unreadMessagesIds.length > 0) {
      // We do this in a single query by appending to the array
      // In Prisma, appending to an array on PostgreSQL:
      await prisma.chatMessage.updateMany({
        where: { id: { in: unreadMessagesIds } },
        data: {
          readBy: {
            push: session.role
          }
        }
      })
      
      // Update the local array to reflect the new state for the client
      messages.forEach(msg => {
        if (unreadMessagesIds.includes(msg.id)) {
          msg.readBy.push(session.role)
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
    const message = await prisma.chatMessage.create({
      data: {
        sender: session.role, // Force sender to be the actual logged-in user's role
        text: body.text || null,
        imageUrl: body.imageUrl || null,
        groupId: body.groupId || 'general',
        readBy: [session.role] // Mark as read by the sender themselves
      }
    })
    
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        unreadCount: 0,
        unreadByGroup: {},
        unreadBySender: {},
        unreadByUser: {},
        latestMessage: null,
      })
    }

    const userId = session.id
    const userName = session.name || ''
    const userRole = session.role || 'OPERATOR'
    const isAdminOrDirector = userRole === 'ADMIN' || userRole === 'DIRECTOR'

    // Fetch recent 150 messages
    const recentMessages = await prisma.chatMessage.findMany({
      take: 150,
      orderBy: { createdAt: 'desc' },
    })

    const allUsers = await prisma.user.findMany({ select: { id: true, name: true, role: true } })
    const userByName = new Map<string, number>()
    allUsers.forEach((u) => {
      userByName.set(u.name.toLowerCase(), u.id)
      userByName.set(u.role.toLowerCase(), u.id)
    })

    const unreadByGroup: Record<string, number> = {}
    const unreadBySender: Record<string, number> = {}
    const unreadByUser: Record<number, number> = {}

    const unreadList = recentMessages.filter((msg) => {
      // 1. Skip own messages
      if (msg.sender === userName || msg.sender === userRole || msg.sender === String(userId)) {
        return false
      }

      // 2. Skip already read
      if (
        msg.readBy.includes(userName) ||
        msg.readBy.includes(userRole) ||
        msg.readBy.includes(String(userId))
      ) {
        return false
      }

      // 3. Group / DM visibility
      if (msg.groupId.startsWith('dm_')) {
        const parts = msg.groupId.replace('dm_', '').split('_')
        const participantIds = parts.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
        // Direct messages are private: ONLY notify the actual participants in this DM!
        if (!participantIds.includes(userId)) {
          return false
        }
      } else if (msg.groupId === 'management') {
        if (!isAdminOrDirector && userRole !== 'ACCOUNTING') return false
      } else if (msg.groupId === 'qa_warehouse') {
        if (!isAdminOrDirector && !['QUALITY_CONTROL', 'INSPECTOR', 'WAREHOUSE'].includes(userRole)) return false
      } else if (msg.groupId === 'kitchen_supply') {
        if (!isAdminOrDirector && !['KITCHEN', 'SUPPLY'].includes(userRole)) return false
      } else if (msg.groupId === 'tech_prod') {
        if (!isAdminOrDirector && !['TECHNOLOGY', 'PRODUCTION'].includes(userRole)) return false
      }

      return true
    })

    unreadList.forEach((msg) => {
      // Unread count per group / channel
      unreadByGroup[msg.groupId] = (unreadByGroup[msg.groupId] || 0) + 1

      // Unread count per sender name
      unreadBySender[msg.sender] = (unreadBySender[msg.sender] || 0) + 1

      // Unread count per user ID (for DMs)
      if (msg.groupId.startsWith('dm_')) {
        const parts = msg.groupId.replace('dm_', '').split('_')
        const participantIds = parts.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
        const otherId = participantIds.find((pid) => pid !== userId)
        if (otherId) {
          unreadByUser[otherId] = (unreadByUser[otherId] || 0) + 1
        }
      } else {
        const senderUserId = userByName.get(msg.sender.toLowerCase())
        if (senderUserId && senderUserId !== userId) {
          unreadByUser[senderUserId] = (unreadByUser[senderUserId] || 0) + 1
        }
      }
    })

    return NextResponse.json({
      unreadCount: unreadList.length,
      unreadByGroup,
      unreadBySender,
      unreadByUser,
      latestMessage: unreadList[0]
        ? {
            id: unreadList[0].id,
            sender: unreadList[0].sender,
            text: unreadList[0].text,
            groupId: unreadList[0].groupId,
            createdAt: unreadList[0].createdAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching unread chat count:', error)
    return NextResponse.json(
      {
        unreadCount: 0,
        unreadByGroup: {},
        unreadBySender: {},
        unreadByUser: {},
        latestMessage: null,
      },
      { status: 500 }
    )
  }
}

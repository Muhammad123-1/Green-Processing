import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ unreadCount: 0, latestMessage: null })
    }

    const userId = session.id
    const userName = session.name || ''
    const userRole = session.role || 'OPERATOR'
    const isAdminOrDirector = userRole === 'ADMIN' || userRole === 'DIRECTOR'

    // Fetch recent 100 messages
    const recentMessages = await prisma.chatMessage.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    })

    const unreadList = recentMessages.filter((msg) => {
      // 1. Skip own messages
      if (msg.sender === userName || msg.sender === userRole) {
        return false
      }

      // 2. Skip already read
      if (msg.readBy.includes(userName) || msg.readBy.includes(userRole)) {
        return false
      }

      // 3. Group / DM visibility
      if (msg.groupId.startsWith('dm_')) {
        const parts = msg.groupId.replace('dm_', '').split('_')
        const participantIds = parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n))
        if (!participantIds.includes(userId) && !isAdminOrDirector) {
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

    return NextResponse.json({
      unreadCount: unreadList.length,
      latestMessage: unreadList[0] ? {
        id: unreadList[0].id,
        sender: unreadList[0].sender,
        text: unreadList[0].text,
        groupId: unreadList[0].groupId,
        createdAt: unreadList[0].createdAt
      } : null
    })
  } catch (error) {
    console.error('Error fetching unread chat count:', error)
    return NextResponse.json({ unreadCount: 0, latestMessage: null }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.id
    const userName = session.name || ''
    const userRole = session.role || 'OPERATOR'

    // Fetch recent 200 messages
    const recentMessages = await prisma.chatMessage.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
    })

    const toUpdate: number[] = []

    for (const msg of recentMessages) {
      if (
        msg.sender === userName ||
        msg.sender === userRole ||
        msg.sender === String(userId)
      ) {
        continue
      }

      if (
        msg.readBy.includes(userName) ||
        msg.readBy.includes(userRole) ||
        msg.readBy.includes(String(userId))
      ) {
        continue
      }

      // Check DM visibility
      if (msg.groupId.startsWith('dm_')) {
        const parts = msg.groupId.replace('dm_', '').split('_')
        const participantIds = parts.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
        if (!participantIds.includes(userId)) continue
      }

      toUpdate.push(msg.id)
    }

    if (toUpdate.length > 0) {
      for (const id of toUpdate) {
        const msg = recentMessages.find((m) => m.id === id)
        const updatedReadBy = Array.from(
          new Set([...(msg?.readBy || []), userName, userRole, String(userId)])
        ).filter(Boolean)
        await prisma.chatMessage.update({
          where: { id },
          data: { readBy: updatedReadBy },
        })
      }
    }

    return NextResponse.json({ success: true, markedCount: toUpdate.length })
  } catch (error) {
    console.error('Error reading all chat messages:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

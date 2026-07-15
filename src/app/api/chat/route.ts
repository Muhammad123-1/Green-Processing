import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || 'general'
    
    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 200 // To prevent fetching too many initially
    })
    
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = await prisma.chatMessage.create({
      data: {
        sender: body.sender,
        text: body.text || null,
        imageUrl: body.imageUrl || null,
        groupId: body.groupId || 'general'
      }
    })
    
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

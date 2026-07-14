import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const existing = await prisma.user.findUnique({ where: { username: body.username } })
    if (existing) return NextResponse.json({ error: 'Bu login allaqachon mavjud' }, { status: 400 })

    const user = await prisma.user.create({
      data: {
        name: body.name,
        username: body.username,
        password: body.password, // In production: hash with bcrypt
        role: body.role || 'OPERATOR',
        isActive: true,
      },
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

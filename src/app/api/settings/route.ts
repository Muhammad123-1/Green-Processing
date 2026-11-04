import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { category: 'asc' } })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = Array.isArray(body) ? body : [body]

    if (settings.length === 0 || !settings[0]?.key) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    await Promise.all(
      settings.map((s: { key: string; value: string; category?: string }) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: String(s.value ?? '') },
          create: { key: s.key, value: String(s.value ?? ''), category: s.category || 'general' },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save settings' }, { status: 500 })
  }
}

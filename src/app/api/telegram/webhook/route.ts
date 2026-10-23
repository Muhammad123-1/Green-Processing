import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot-service'

// Serverless / Cloud Webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Telegram webhook update error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: '@GreenProcessingBot',
    timestamp: new Date().toISOString()
  })
}

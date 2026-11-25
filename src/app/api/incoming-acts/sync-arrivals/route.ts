import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import { syncAllShopArrivalsToIncomingActs } from '@/lib/incoming-acts/autoAct'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await syncAllShopArrivalsToIncomingActs()

    return NextResponse.json({
      success: true,
      stats,
      message: `Ombor kirimlari bilan sinxronlandi: ${stats.created} ta yangi akt yaratildi, ${stats.updated} ta yangilandi.`,
    })
  } catch (error: any) {
    console.error('Sync arrivals to incoming acts error:', error)
    return NextResponse.json({ error: error.message || 'Sinxronlashda xatolik yuz berdi' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}

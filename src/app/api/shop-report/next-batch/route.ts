import { NextRequest, NextResponse } from 'next/server'
import { getNextShopArrivalBatch, parseDateToYearMonth } from '@/lib/batchNumbering'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const nomenclature = searchParams.get('nomenclature') || ''
    const date = searchParams.get('date') || ''

    if (!nomenclature.trim()) {
      return NextResponse.json({ success: true, nextBatch: '1' })
    }

    const { yearMonth } = parseDateToYearMonth(date)
    const nextBatch = await getNextShopArrivalBatch(nomenclature, date)

    return NextResponse.json({
      success: true,
      nextBatch,
      nomenclature,
      month: yearMonth,
    })
  } catch (error: any) {
    console.error('Next batch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportIncomingActsToExcel } from '@/lib/incoming-acts/excel'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lang = (searchParams.get('lang') || 'uz') as 'uz' | 'ru' | 'en'
    const search = searchParams.get('search')?.trim() || ''
    const product = searchParams.get('product')?.trim() || ''
    const ratingStr = searchParams.get('rating')?.trim() || ''
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { actNumber: { contains: search, mode: 'insensitive' } },
        { rejectionActNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (product && product !== 'all') {
      where.productName = { equals: product, mode: 'insensitive' }
    }

    if (ratingStr && ratingStr !== 'all') {
      const rating = parseInt(ratingStr, 10)
      if (!isNaN(rating)) {
        where.decisionRating = rating
      }
    }

    if (dateFrom && dateTo) {
      where.actDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      where.actDate = { gte: dateFrom }
    } else if (dateTo) {
      where.actDate = { lte: dateTo }
    }

    const acts = await prisma.incomingRawMaterialAct.findMany({
      where,
      orderBy: [{ actDate: 'asc' }, { id: 'asc' }]
    })

    const buffer = await exportIncomingActsToExcel(acts as any, lang)

    const filename = `ВХОДНОЕ_СЫРЬЕ_АКТЫ_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Export jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

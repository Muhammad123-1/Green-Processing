import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { receivedQuantity, discrepancyReason, notes } = body

    if (receivedQuantity === undefined || receivedQuantity === null || parseFloat(receivedQuantity) < 0) {
      return NextResponse.json({ error: 'Qabul qilingan miqdorni to\'g\'ri kiriting' }, { status: 400 })
    }

    const recQty = parseFloat(receivedQuantity)
    const transferId = parseInt(id)

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { product: true }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer hujjati topilmadi' }, { status: 404 })
    }

    const discrepancy = transfer.issuedQuantity - recQty
    let finalStatus = 'ACCEPTED'
    if (Math.abs(discrepancy) > 0.001) {
      finalStatus = 'DISCREPANCY'
    }

    const updated = await prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        receivedQuantity: recQty,
        receivedById: session.id ? parseInt(session.id) : null,
        receivedByName: session.name || 'Qabul qiluvchi mas\'ul',
        receivedAt: new Date(),
        discrepancy: discrepancy,
        discrepancyReason: discrepancyReason || (discrepancy > 0 ? 'Tortishdagi tabiiy yo\'qotish' : null),
        status: finalStatus,
        notes: notes || transfer.notes
      },
      include: {
        product: true
      }
    })

    // Log the Handshake event
    try {
      await prisma.log.create({
        data: {
          action: finalStatus === 'DISCREPANCY' ? 'TRANSFER_DISCREPANCY_FLAGGED' : 'TRANSFER_HANDSHAKE_ACCEPTED',
          entity: 'StockTransfer',
          entityId: updated.id,
          details: `Transfer #${updated.transferNumber} tasdiqlandi. Berildi: ${updated.issuedQuantity}, Qabul qilindi: ${recQty}, Farq: ${discrepancy} ${updated.issuedUnit}. Sabab: ${discrepancyReason || 'Yo\'q'}`
        }
      })
    } catch {
      // Ignore log error
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Handshake error:', error)
    return NextResponse.json({ error: error.message || 'Qabul qilishda xatolik' }, { status: 500 })
  }
}

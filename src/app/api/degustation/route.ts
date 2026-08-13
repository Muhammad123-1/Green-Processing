import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orderId, vannaNo, appearanceOk, smellOk, tasteOk, moistureOk, notes } = body

    if (!orderId || !vannaNo) {
      return NextResponse.json({ error: "Kerakli ma'lumotlar yo'q" }, { status: 400 })
    }

    // 1. Find the production order to get the batch if it exists
    const order = await prisma.productionOrder.findUnique({
      where: { id: parseInt(orderId) }
    })

    if (!order) return NextResponse.json({ error: 'Order topilmadi' }, { status: 404 })

    // Find the batch created by this order
    const batch = await prisma.inventoryBatch.findFirst({
      where: { batchNumber: { startsWith: `PROD-${order.id}-` } }
    })

    // 2. Create Degustation Log
    const degustation = await prisma.degustationLog.create({
      data: {
        batchId: batch ? batch.id : null,
        vannaNo: parseInt(vannaNo),
        appearanceOk: Boolean(appearanceOk),
        smellOk: Boolean(smellOk),
        tasteOk: Boolean(tasteOk),
        moistureOk: Boolean(moistureOk),
        notes: notes || null,
        qcInspectorId: session.id, // ID from session
      }
    })

    // Log action
    await prisma.log.create({
      data: {
        action: 'CREATE_DEGUSTATION',
        entity: 'DegustationLog',
        entityId: degustation.id,
        details: `Degustatsiya o'tkazildi. Vanna: ${vannaNo}, Holati: ${appearanceOk && smellOk && tasteOk && moistureOk ? 'Qoniqarli' : 'Muammo bor'}`,
      },
    })

    return NextResponse.json(degustation, { status: 201 })
  } catch (error: any) {
    console.error('Error saving degustation:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

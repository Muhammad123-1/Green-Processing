import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const targetLocation = searchParams.get('targetLocation')
    const status = searchParams.get('status')

    const where: any = {}
    if (targetLocation) where.targetLocation = targetLocation
    if (status) where.status = status

    // Safe query with fallback if table not yet migrated or schema updating
    try {
      const transfers = await prisma.stockTransfer.findMany({
        where,
        include: {
          product: true,
          batch: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(transfers)
    } catch (dbErr: any) {
      // Fallback: try raw query or return empty list
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Fetch transfers error:', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { productId, batchId, targetLocation, issuedQuantity, issuedUnit, notes } = body

    if (!productId || !targetLocation || !issuedQuantity || parseFloat(issuedQuantity) <= 0) {
      return NextResponse.json({ error: 'Barcha majburiy maydonlarni to\'ldiring' }, { status: 400 })
    }

    const qty = parseFloat(issuedQuantity)
    const pId = parseInt(productId)
    const bId = batchId ? parseInt(batchId) : null

    const transferNum = `TR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    // Transaction to deduct from Warehouse batch and create transfer
    const transfer = await prisma.$transaction(async (tx: any) => {
      // Deduct from batch if specified or FEFO batch
      if (bId) {
        await tx.inventoryBatch.update({
          where: { id: bId },
          data: { quantity: { decrement: qty } }
        })
      } else {
        // Find approved batch with quantity > 0
        const batch = await tx.inventoryBatch.findFirst({
          where: { productId: pId, qcStatus: 'APPROVED', quantity: { gte: qty } },
          orderBy: { expirationDate: 'asc' }
        })
        if (batch) {
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: qty } }
          })
        }
      }

      // Create transfer record
      return await tx.stockTransfer.create({
        data: {
          transferNumber: transferNum,
          productId: pId,
          batchId: bId,
          sourceLocation: 'SKLAD',
          targetLocation: targetLocation.toUpperCase(),
          issuedQuantity: qty,
          issuedUnit: issuedUnit || 'kg',
          issuedById: session.id ? Number(session.id) : null,
          issuedByName: session.name || 'Sklad Mudiri',
          issuedAt: new Date(),
          status: 'IN_TRANSIT',
          notes: notes || null
        },
        include: {
          product: true
        }
      })
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    console.error('Create transfer error:', error)
    return NextResponse.json({ error: error.message || 'Chiqim yaratishda xatolik' }, { status: 500 })
  }
}

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

    // 1. Fetch available approved batches ordered strictly by FEFO
    const availableBatches = await prisma.inventoryBatch.findMany({
      where: { productId: pId, qcStatus: 'APPROVED', quantity: { gt: 0 } },
      orderBy: [
        { expirationDate: 'asc' },
        { receivedAt: 'asc' },
        { id: 'asc' }
      ]
    })

    if (!availableBatches.length) {
      return NextResponse.json(
        { error: "Ushbu mahsulot bo'yicha omborda tasdiqlangan qoldiq mavjud emas!" },
        { status: 400 }
      )
    }

    const totalAvailable = availableBatches.reduce((sum, b) => sum + b.quantity, 0)
    if (qty > totalAvailable) {
      return NextResponse.json(
        {
          error: `Omborda yetarli qoldiq yo'q! Jami mavjud: ${totalAvailable.toFixed(2)} ${issuedUnit || 'kg'}, siz so'ragan: ${qty} ${issuedUnit || 'kg'}`
        },
        { status: 400 }
      )
    }

    // 2. Strict FEFO batch enforcement:
    // If the warehouseman specifically requested a batch that is NOT the active (earliest expiry) batch,
    // block it if the active batch still has stock!
    const activeBatch = availableBatches[0]
    if (bId && bId !== activeBatch.id) {
      return NextResponse.json(
        {
          error: `FEFO qoidasiga ko'ra oldingi Partiya #${activeBatch.batchNumber} (qoldiq: ${activeBatch.quantity} ${issuedUnit || 'kg'}) tugatilmasdan, keyingi partiyadan chiqim berish mumkin emas!`
        },
        { status: 400 }
      )
    }

    const transferNum = `TR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    // 3. Transaction to deduct from Warehouse batches using FEFO and create transfer
    const transfer = await prisma.$transaction(async (tx: any) => {
      let remainingToDeduct = qty
      const deductions: { batchNumber: string; amount: number }[] = []

      for (const b of availableBatches) {
        if (remainingToDeduct <= 0) break
        const deduct = Math.min(b.quantity, remainingToDeduct)
        await tx.inventoryBatch.update({
          where: { id: b.id },
          data: { quantity: { decrement: deduct } }
        })
        deductions.push({ batchNumber: b.batchNumber, amount: Number(deduct.toFixed(2)) })
        remainingToDeduct -= deduct
      }

      const fefoBreakdown =
        deductions.length > 1
          ? `FEFO taqsimoti: ${deductions.map(d => `#${d.batchNumber} dan ${d.amount} ${issuedUnit || 'kg'}`).join(', ')}`
          : `Partiya #${deductions[0]?.batchNumber || activeBatch.batchNumber}`

      const finalNotes = [notes, fefoBreakdown].filter(Boolean).join('. ')

      // Create transfer record
      return await tx.stockTransfer.create({
        data: {
          transferNumber: transferNum,
          productId: pId,
          batchId: activeBatch.id,
          sourceLocation: 'SKLAD',
          targetLocation: targetLocation.toUpperCase(),
          issuedQuantity: qty,
          issuedUnit: issuedUnit || 'kg',
          issuedById: session.id ? Number(session.id) : null,
          issuedByName: session.name || 'Sklad Mudiri',
          issuedAt: new Date(),
          status: 'IN_TRANSIT',
          notes: finalNotes
        },
        include: {
          product: true,
          batch: true
        }
      })
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    console.error('Create transfer error:', error)
    return NextResponse.json({ error: error.message || 'Chiqim yaratishda xatolik' }, { status: 500 })
  }
}

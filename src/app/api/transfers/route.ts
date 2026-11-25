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
    if (targetLocation && targetLocation !== 'all') {
      if (targetLocation === 'SEX' || targetLocation === 'ZAGOTOVKA') {
        where.targetLocation = { in: ['SEX', 'ZAGOTOVKA'] }
      } else {
        where.targetLocation = targetLocation
      }
    }
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
    const {
      productId,
      batchId,
      targetLocation,
      issuedQuantity,
      issuedUnit,
      notes,
      isFifoException,
      exceptionReason,
      authorizedByQcId,
      authorizedByQcName,
      exceptionEvidenceUrl,
      issuedDate,
      receiverName,
      autoAccept,
    } = body

    if (!productId || !targetLocation || !issuedQuantity || parseFloat(issuedQuantity) <= 0) {
      return NextResponse.json({ error: 'Barcha majburiy maydonlarni to\'ldiring' }, { status: 400 })
    }

    const qty = parseFloat(issuedQuantity)
    const pId = parseInt(productId)
    const bId = batchId ? parseInt(batchId) : null
    const qcExceptionRequested = Boolean(isFifoException)

    let normTargetLocation = String(targetLocation || 'SEX').toUpperCase().trim()
    if (normTargetLocation === 'ZAGOTOVKA' || normTargetLocation === 'PRODUCTION') {
      normTargetLocation = 'SEX'
    } else if (normTargetLocation !== 'OSHXONA') {
      normTargetLocation = 'SEX'
    }

    // 1. Fetch available approved batches ordered strictly by FEFO / FIFO
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

    // 2. Strict FIFO/FEFO batch enforcement with QC-Authorized Controlled Exception (Requirement 1):
    const activeBatch = availableBatches[0]
    let targetBatch = activeBatch
    let isExceptionRecorded = false

    if (bId && bId !== activeBatch.id) {
      const requestedBatch = availableBatches.find((b) => b.id === bId)
      if (!requestedBatch) {
        return NextResponse.json(
          { error: "Tanlangan partiya topilmadi yoki qoldig'i tugagan!" },
          { status: 400 }
        )
      }

      if (!qcExceptionRequested) {
        return NextResponse.json(
          {
            error: `FIFO/FEFO qoidasiga ko'ra oldingi Partiya #${activeBatch.batchNumber} (qoldiq: ${activeBatch.quantity} ${issuedUnit || 'kg'}) tugatilmasdan, keyingi partiyadan chiqim berish mumkin emas! Faqat Sifat nazorati (QC) tasdiqlagan istisno bilan ruxsat etiladi.`
          },
          { status: 400 }
        )
      }

      // Validate QC authorization fields
      if (!exceptionReason || !String(exceptionReason).trim() || (!authorizedByQcName && !authorizedByQcId)) {
        return NextResponse.json(
          {
            error: "Ombor xodimi mustaqil ravishda FIFO/FEFO tartibini o'zgartira olmaydi! Istisno sababi va ruxsat bergan Sifat nazoratchisi (QC) ko'rsatilishi shart."
          },
          { status: 400 }
        )
      }

      if (qty > requestedBatch.quantity) {
        return NextResponse.json(
          {
            error: `Tanlangan muqobil Partiya #${requestedBatch.batchNumber} da yetarli qoldiq yo'q (Mavjud: ${requestedBatch.quantity} ${issuedUnit || 'kg'})`
          },
          { status: 400 }
        )
      }

      targetBatch = requestedBatch
      isExceptionRecorded = true
    }

    const transferNum = `TR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    const nowTimestamp = new Date()

    // 3. Transaction to deduct from Warehouse batches and create transfer + audit log
    const transfer = await prisma.$transaction(async (tx: any) => {
      let remainingToDeduct = qty
      const deductions: { 
        batchId: number; 
        batchNumber: string; 
        amount: number;
        initialQty: number;
        remainingInBatch: number;
        isClosed: boolean;
      }[] = []

      // If QC exception selected a specific alternative batch, deduct from that batch first
      const orderedBatches = isExceptionRecorded
        ? [targetBatch, ...availableBatches.filter((b) => b.id !== targetBatch.id)]
        : availableBatches

      for (const b of orderedBatches) {
        if (remainingToDeduct <= 0) break
        const deduct = Math.min(b.quantity, remainingToDeduct)
        const remInBatch = Number(Math.max(0, b.quantity - deduct).toFixed(2))
        const isClosed = remInBatch <= 0.001

        await tx.inventoryBatch.update({
          where: { id: b.id },
          data: { quantity: { decrement: deduct } }
        })
        await tx.inventoryTransaction.create({
          data: {
            batchId: b.id,
            transactionType: 'TRANSFER',
            quantity: deduct,
            userId: session.id ? Number(session.id) : null,
            referenceDocId: transferNum,
          }
        })
        deductions.push({ 
          batchId: b.id, 
          batchNumber: b.batchNumber, 
          amount: Number(deduct.toFixed(2)),
          initialQty: b.quantity,
          remainingInBatch: remInBatch,
          isClosed
        })
        remainingToDeduct -= deduct
      }

      // Format clean, human-readable FIFO breakdown
      const fefoBreakdown = isExceptionRecorded
        ? `QC ISTISNOSI: Asl partiya #${activeBatch.batchNumber} o'rniga #${targetBatch.batchNumber} berildi (Tasdiqladi: ${authorizedByQcName || 'QC'}, Sabab: ${exceptionReason})`
        : deductions.length > 1
          ? `FIFO taqsimoti: ` + deductions.map(d => 
              d.isClosed 
                ? `Partiya #${d.batchNumber} dan ${d.amount} ${issuedUnit || 'kg'} [YOPILDI, qoldiq: 0]` 
                : `Partiya #${d.batchNumber} dan ${d.amount} ${issuedUnit || 'kg'} [Qoldiq: ${d.remainingInBatch} ${issuedUnit || 'kg'}]`
            ).join(' | ')
          : `Partiya #${deductions[0]?.batchNumber || targetBatch.batchNumber} dan ${deductions[0]?.amount || qty} ${issuedUnit || 'kg'}` + (deductions[0]?.isClosed ? ' [YOPILDI]' : ` [Qoldiq: ${deductions[0]?.remainingInBatch} ${issuedUnit || 'kg'}]`)

      const metaTag = `FIFO_META:${JSON.stringify(deductions)}`
      const finalNotes = [notes, fefoBreakdown, metaTag].filter(Boolean).join('\n')

      const issuedAtDate = issuedDate ? new Date(issuedDate + 'T12:00:00.000Z') : nowTimestamp
      const isAcceptedImmediate = Boolean(autoAccept) || (normTargetLocation === 'OSHXONA' && Boolean(receiverName))

      const createdTransfer = await tx.stockTransfer.create({
        data: {
          transferNumber: transferNum,
          productId: pId,
          batchId: targetBatch.id,
          sourceLocation: 'SKLAD',
          targetLocation: normTargetLocation,
          issuedQuantity: qty,
          issuedUnit: issuedUnit || 'kg',
          issuedById: session.id ? Number(session.id) : null,
          issuedByName: session.name || 'Ombor xodimi',
          issuedAt: issuedAtDate,
          receivedQuantity: isAcceptedImmediate ? qty : null,
          receivedAt: isAcceptedImmediate ? issuedAtDate : null,
          receivedById: null,
          receivedByName: isAcceptedImmediate ? (receiverName || 'Oshxona oshpazi') : null,
          status: isAcceptedImmediate ? 'ACCEPTED' : 'IN_TRANSIT',
          isFifoException: isExceptionRecorded,
          originalFifoBatchId: isExceptionRecorded ? activeBatch.id : null,
          originalFifoBatchNumber: isExceptionRecorded ? activeBatch.batchNumber : null,
          exceptionReason: isExceptionRecorded ? String(exceptionReason).trim() : null,
          authorizedByQcId: isExceptionRecorded && authorizedByQcId ? Number(authorizedByQcId) : null,
          authorizedByQcName: isExceptionRecorded ? String(authorizedByQcName || 'Sifat nazoratchisi').trim() : null,
          exceptionTimestamp: isExceptionRecorded ? nowTimestamp : null,
          exceptionEvidenceUrl: isExceptionRecorded && exceptionEvidenceUrl ? String(exceptionEvidenceUrl).trim() : null,
          notes: finalNotes
        },
        include: {
          product: true,
          batch: true
        }
      })

      await tx.log.create({
        data: {
          userId: session.id ? Number(session.id) : null,
          action: isExceptionRecorded ? 'FIFO_EXCEPTION_TRANSFER' : 'STOCK_TRANSFER_ISSUED',
          entity: 'StockTransfer',
          entityId: createdTransfer.id,
          details: `${transferNum}: ${qty} ${issuedUnit || 'kg'} -> ${normTargetLocation} (${fefoBreakdown})`,
        }
      })

      return createdTransfer
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    console.error('Create transfer error:', error)
    return NextResponse.json({ error: error.message || 'Chiqim yaratishda xatolik' }, { status: 500 })
  }
}

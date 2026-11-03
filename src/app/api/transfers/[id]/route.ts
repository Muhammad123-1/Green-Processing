import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { checkWarehouseWriteOffPermission, checkWarehouseWriteOffDeletePermission } from '@/lib/auditRules'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transferId = parseInt(id, 10)
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri transfer ID' }, { status: 400 })
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { product: true, batch: true }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer hujjati topilmadi' }, { status: 404 })
    }

    return NextResponse.json(transfer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const { id } = await params
    const transferId = parseInt(id, 10)
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri transfer ID' }, { status: 400 })
    }

    const existing = await prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { batch: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Transfer hujjati topilmadi' }, { status: 404 })
    }

    // Chiqim (Списание / Transfer) tahrirlash qoidasi:
    // Buxgalteriya va ta'minot o'rtasidagi tafovutlarni oldini olish uchun
    // 24 soatdan so'ng tahrir faqat Bosh buxgalter / Admin tasdig'i bilan bo'lishi shart!
    const perm = checkWarehouseWriteOffPermission({
      role: session.role,
      createdAt: existing.createdAt
    })

    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Ombor zaxirasidan chiqim qilinganiga 24 soatdan oshgan. Tahrirlash faqat Bosh buxgalter yoki Administrator ruxsati bilan amalga oshiriladi!"
      }, { status: 403 })
    }

    const body = await req.json()
    const {
      issuedQuantity,
      targetLocation,
      notes,
      editReason
    } = body

    const newQty = issuedQuantity !== undefined ? parseFloat(issuedQuantity) : existing.issuedQuantity
    const qtyDiff = newQty - existing.issuedQuantity

    const updated = await prisma.$transaction(async (tx) => {
      // If quantity changed and batch exists, adjust batch quantity
      if (Math.abs(qtyDiff) > 0.0001 && existing.batchId) {
        if (qtyDiff > 0) {
          // Decrement batch further
          await tx.inventoryBatch.update({
            where: { id: existing.batchId },
            data: { quantity: { decrement: qtyDiff } }
          })
        } else {
          // Re-increment batch
          await tx.inventoryBatch.update({
            where: { id: existing.batchId },
            data: { quantity: { increment: Math.abs(qtyDiff) } }
          })
        }
      }

      return await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          issuedQuantity: newQty,
          targetLocation: targetLocation ? String(targetLocation).toUpperCase() : undefined,
          notes: notes !== undefined ? notes : undefined,
          isEdited: true,
          editReason: editReason?.trim() || existing.editReason || "Chiqim hujjatiga tuzatish kiritildi",
          editedAt: new Date(),
          editedBy: `${session.name || 'Xodim'} (${session.role})`
        },
        include: { product: true, batch: true }
      })
    })

    await prisma.log.create({
      data: {
        action: 'STOCK_TRANSFER_EDITED',
        entity: 'StockTransfer',
        entityId: updated.id,
        userId: session.id ? Number(session.id) : null,
        details: `Chiqim transferi #${updated.transferNumber} ${session.name || 'Xodim'} tomonidan tahrirlandi. Miqdor: ${existing.issuedQuantity} -> ${newQty} ${updated.issuedUnit}. Sabab: ${editReason || 'Ko\'rsatilmadi'}`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, transfer: updated })
  } catch (error: any) {
    console.error('Error updating stock transfer:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    // Deletion rule: Strictly ADMIN or DIRECTOR
    const perm = checkWarehouseWriteOffDeletePermission(session.role)
    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Ombor chiqim hujjatlarini o'chirish faqat Administrator tomonidan amalga oshirilishi mumkin!"
      }, { status: 403 })
    }

    const { id } = await params
    const transferId = parseInt(id, 10)
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri transfer ID' }, { status: 400 })
    }

    const existing = await prisma.stockTransfer.findUnique({
      where: { id: transferId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Transfer hujjati topilmadi' }, { status: 404 })
    }

    // If transfer was IN_TRANSIT, return the deducted quantity back to batch
    await prisma.$transaction(async (tx) => {
      if (existing.batchId && existing.status === 'IN_TRANSIT') {
        await tx.inventoryBatch.update({
          where: { id: existing.batchId },
          data: { quantity: { increment: existing.issuedQuantity } }
        })
      }

      await tx.stockTransfer.delete({
        where: { id: transferId }
      })
    })

    await prisma.log.create({
      data: {
        action: 'STOCK_TRANSFER_DELETED',
        entity: 'StockTransfer',
        entityId: transferId,
        userId: session.id ? Number(session.id) : null,
        details: `Chiqim transferi #${existing.transferNumber} (${existing.issuedQuantity} ${existing.issuedUnit}) ${session.name} (Admin) tomonidan bekor qilinib o'chirildi.`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Chiqim transferi muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting stock transfer:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

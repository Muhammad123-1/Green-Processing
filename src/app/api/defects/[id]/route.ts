import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { checkDefectEditPermission, checkDefectDeletePermission } from '@/lib/auditRules'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const defectId = parseInt(id, 10)
    if (isNaN(defectId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri brak ID' }, { status: 400 })
    }

    const defect = await (prisma as any).defectLog.findUnique({
      where: { id: defectId },
      include: {
        product: true,
        supplier: true,
        batch: true
      }
    })

    if (!defect) {
      return NextResponse.json({ error: 'Brak yozuvi topilmadi' }, { status: 404 })
    }

    return NextResponse.json(defect)
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
    const defectId = parseInt(id, 10)
    if (isNaN(defectId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri brak ID' }, { status: 400 })
    }

    const existing = await (prisma as any).defectLog.findUnique({
      where: { id: defectId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Brak yozuvi topilmadi' }, { status: 404 })
    }

    const body = await req.json()
    const {
      defectType,
      quantity,
      location,
      actionTaken,
      reason,
      responsible,
      notes,
      estimatedCost,
      editReason
    } = body

    // Brak va nuqson aktlari qoidasi:
    // Sexda aniqlangan brak miqdorlarini xodimlar o'z xohishicha kamaytirib qo'ymasligi uchun
    // belgilangan smena yakunlangach tahrir bloklanishi shart!
    // Smena yakunlangach tahrir faqat Bosh QC yoki Admin ruxsati bilan.
    const newQty = quantity !== undefined ? parseFloat(quantity) : existing.quantity
    const perm = checkDefectEditPermission({
      role: session.role,
      createdAt: existing.createdAt,
      oldQuantity: existing.quantity,
      newQuantity: newQty
    })

    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Brak aktini tahrirlash bloklangan. O'zgartirish kiritish faqat Bosh Sifat Nazoratchisi (QC) yoki Administrator tomonidan amalga oshiriladi!"
      }, { status: 403 })
    }

    const updated = await (prisma as any).defectLog.update({
      where: { id: defectId },
      data: {
        defectType: defectType !== undefined ? defectType : undefined,
        quantity: newQty,
        location: location !== undefined ? location : undefined,
        actionTaken: actionTaken !== undefined ? actionTaken : undefined,
        reason: reason !== undefined ? reason : undefined,
        responsible: responsible !== undefined ? responsible : undefined,
        estimatedCost: estimatedCost !== undefined ? (estimatedCost ? parseFloat(estimatedCost) : null) : undefined,
        // Audit log trail
        isEdited: true,
        editReason: editReason?.trim() || existing.editReason || "Brak parametrlariga tuzatish kiritildi",
        editedAt: new Date(),
        editedBy: `${session.name || 'Xodim'} (${session.role})`
      },
      include: {
        product: true,
        supplier: true
      }
    })

    // Log the change
    await prisma.log.create({
      data: {
        action: 'DEFECT_LOG_EDITED',
        entity: 'DefectLog',
        entityId: updated.id,
        userId: session.id ? Number(session.id) : null,
        details: `Brak akti #${updated.defectNumber} (${updated.product?.name || ''}) ${session.name || 'Xodim'} tomonidan tahrirlandi. Miqdor: ${existing.quantity} -> ${newQty} kg. Sabab: ${editReason || 'Ko\'rsatilmadi'}`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, defect: updated })
  } catch (error: any) {
    console.error('Error updating defect log:', error)
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
    const perm = checkDefectDeletePermission(session.role)
    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Brak va nuqson aktlarini o'chirish huquqi faqat Tizim Administratoriga berilgan!"
      }, { status: 403 })
    }

    const { id } = await params
    const defectId = parseInt(id, 10)
    if (isNaN(defectId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri brak ID' }, { status: 400 })
    }

    const deleted = await (prisma as any).defectLog.delete({
      where: { id: defectId }
    })

    await prisma.log.create({
      data: {
        action: 'DEFECT_LOG_DELETED',
        entity: 'DefectLog',
        entityId: defectId,
        userId: session.id ? Number(session.id) : null,
        details: `Brak akti #${deleted.defectNumber} (${deleted.quantity} kg) ${session.name} (Admin) tomonidan butunlay o'chirildi.`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Brak akti muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting defect log:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

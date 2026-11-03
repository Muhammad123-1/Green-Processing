import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { checkDefectEditPermission, checkDefectDeletePermission } from '@/lib/auditRules'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const checklistId = parseInt(id, 10)
    if (isNaN(checklistId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri checklist ID' }, { status: 400 })
    }

    const checklist = await prisma.dailyQCChecklist.findUnique({
      where: { id: checklistId }
    })

    if (!checklist) {
      return NextResponse.json({ error: 'Cheklist topilmadi' }, { status: 404 })
    }

    return NextResponse.json(checklist)
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
    const checklistId = parseInt(id, 10)
    if (isNaN(checklistId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri checklist ID' }, { status: 400 })
    }

    const existing = await prisma.dailyQCChecklist.findUnique({
      where: { id: checklistId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Cheklist topilmadi' }, { status: 404 })
    }

    const body = await req.json()
    const {
      rejectedKg,
      totalOutputBox,
      supervisor,
      inspector,
      formData,
      status,
      editReason
    } = body

    const newRejectedKg = rejectedKg !== undefined ? parseFloat(rejectedKg) : existing.rejectedKg

    // Defect & Checklist rules:
    // Once shift is concluded or if reducing rejected kg, only QUALITY_CONTROL or ADMIN/DIRECTOR can edit!
    const perm = checkDefectEditPermission({
      role: session.role,
      createdAt: existing.createdAt,
      oldQuantity: existing.rejectedKg,
      newQuantity: newRejectedKg
    })

    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Smena yakunlanganligi sababli cheklistni tahrirlash bloklangan. O'zgartirish faqat Bosh Sifat Nazorati (QC) yoki Administrator tomonidan amalga oshiriladi!"
      }, { status: 403 })
    }

    const updated = await prisma.dailyQCChecklist.update({
      where: { id: checklistId },
      data: {
        rejectedKg: newRejectedKg,
        totalOutputBox: totalOutputBox !== undefined ? (totalOutputBox ? parseFloat(totalOutputBox) : null) : undefined,
        supervisor: supervisor !== undefined ? supervisor : undefined,
        inspector: inspector !== undefined ? inspector : undefined,
        formData: formData !== undefined ? (typeof formData === 'string' ? formData : JSON.stringify(formData)) : undefined,
        status: status !== undefined ? status : undefined,
        // Audit log trail
        isEdited: true,
        editReason: editReason?.trim() || existing.editReason || "Smena cheklisti parametrlariga tuzatish kiritildi",
        editedAt: new Date(),
        editedBy: `${session.name || 'Xodim'} (${session.role})`
      }
    })

    // Log the change
    await prisma.log.create({
      data: {
        action: 'QC_CHECKLIST_EDITED',
        entity: 'DailyQCChecklist',
        entityId: updated.id,
        userId: session.id ? Number(session.id) : null,
        details: `Smena cheklisti #${updated.id} (${updated.date}, Smena ${updated.shift}) ${session.name || 'Xodim'} tomonidan tahrirlandi. Brak: ${existing.rejectedKg} -> ${newRejectedKg} kg. Sabab: ${editReason || 'Ko\'rsatilmadi'}`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, checklist: updated })
  } catch (error: any) {
    console.error('Error updating daily QC checklist:', error)
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
        error: perm.reason || "Smena cheklistini o'chirish huquqi faqat Tizim Administratoriga berilgan!"
      }, { status: 403 })
    }

    const { id } = await params
    const checklistId = parseInt(id, 10)
    if (isNaN(checklistId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri checklist ID' }, { status: 400 })
    }

    const deleted = await prisma.dailyQCChecklist.delete({
      where: { id: checklistId }
    })

    await prisma.log.create({
      data: {
        action: 'QC_CHECKLIST_DELETED',
        entity: 'DailyQCChecklist',
        entityId: checklistId,
        userId: session.id ? Number(session.id) : null,
        details: `Smena cheklisti #${deleted.id} (${deleted.date}) ${session.name} (Admin) tomonidan butunlay o'chirildi.`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Cheklist muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting daily QC checklist:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

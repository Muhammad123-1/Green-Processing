import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { getRatingText } from '@/lib/incoming-acts/excel'
import { checkQcActEditPermission, checkQcActDeletePermission } from '@/lib/auditRules'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const { id } = await params
    const actId = parseInt(id, 10)
    if (isNaN(actId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri akt ID' }, { status: 400 })
    }

    const existing = await prisma.incomingRawMaterialAct.findUnique({
      where: { id: actId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sifat akti topilmadi' }, { status: 404 })
    }

    // Role and 24-hour verification:
    // After 24h, ONLY TECHNOLOGY (Chief Technologist), ADMIN, or DIRECTOR can edit!
    const perm = checkQcActEditPermission({
      role: session.role,
      createdAt: existing.createdAt
    })

    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Ushbu sifat akti kiritilganiga 24 soatdan oshgan. Laboratoriya xulosasini faqat Bosh Texnolog yoki Administrator o'zgartirishi mumkin!"
      }, { status: 403 })
    }

    const body = await req.json()
    const {
      actNumber,
      actDate,
      productName,
      supplierName,
      temperature,
      transportCondition,
      hasDocumentation,
      structure,
      leafColor,
      tasteSmell,
      internalOxidation,
      insectTraces,
      rotDiseases,
      stemCut,
      density,
      diameterWeight,
      outerLeavesRemoved,
      noMechanicalDamage,
      batchNumber,
      decisionRating,
      decisionText,
      warehouseKg,
      shopIssuedKg,
      shopIssuedDate,
      rejectionActNumber,
      inspectorName,
      pricePerKg,
      notes,
      editReason
    } = body

    const rating = Number(decisionRating) || 4
    const resolvedDecisionText = decisionText || getRatingText(rating, 'uz')

    let cleanTemp: string | null | undefined = undefined
    if (temperature !== undefined) {
      if (!temperature) {
        cleanTemp = null
      } else {
        const str = String(temperature).trim()
        const norm = str.replace(',', '.')
        const m = norm.match(/^(-?\d+(?:\.\d+)?)/)
        if (m) {
          const num = parseFloat(m[1])
          cleanTemp = isNaN(num) ? str : String(Math.round(num * 10) / 10)
        } else {
          cleanTemp = str
        }
      }
    }

    const updated = await prisma.incomingRawMaterialAct.update({
      where: { id: actId },
      data: {
        actNumber: actNumber !== undefined ? String(actNumber) : undefined,
        actDate: actDate !== undefined ? String(actDate) : undefined,
        productName: productName !== undefined ? String(productName).trim() : undefined,
        supplierName: supplierName !== undefined ? String(supplierName).trim() : undefined,
        temperature: cleanTemp,
        transportCondition: transportCondition !== undefined ? Number(transportCondition) : undefined,
        hasDocumentation: hasDocumentation !== undefined ? Number(hasDocumentation) : undefined,
        structure: structure !== undefined ? Number(structure) : undefined,
        leafColor: leafColor !== undefined ? Number(leafColor) : undefined,
        tasteSmell: tasteSmell !== undefined ? Number(tasteSmell) : undefined,
        internalOxidation: internalOxidation !== undefined ? Number(internalOxidation) : undefined,
        insectTraces: insectTraces !== undefined ? Number(insectTraces) : undefined,
        rotDiseases: rotDiseases !== undefined ? Number(rotDiseases) : undefined,
        stemCut: stemCut !== undefined ? Number(stemCut) : undefined,
        density: density !== undefined ? Number(density) : undefined,
        diameterWeight: diameterWeight !== undefined ? (diameterWeight ? String(diameterWeight) : null) : undefined,
        outerLeavesRemoved: outerLeavesRemoved !== undefined ? Number(outerLeavesRemoved) : undefined,
        noMechanicalDamage: noMechanicalDamage !== undefined ? Number(noMechanicalDamage) : undefined,
        batchNumber: batchNumber !== undefined ? (batchNumber ? String(batchNumber).trim() : null) : undefined,
        decisionRating: rating,
        decisionText: resolvedDecisionText,
        warehouseKg: warehouseKg !== undefined ? (warehouseKg !== null && warehouseKg !== '' ? Number(warehouseKg) : null) : undefined,
        shopIssuedKg: shopIssuedKg !== undefined ? (shopIssuedKg ? String(shopIssuedKg) : null) : undefined,
        shopIssuedDate: shopIssuedDate !== undefined ? (shopIssuedDate ? String(shopIssuedDate) : null) : undefined,
        rejectionActNumber: rejectionActNumber !== undefined ? (rejectionActNumber ? String(rejectionActNumber) : null) : undefined,
        inspectorName: inspectorName !== undefined ? (inspectorName ? String(inspectorName).trim() : null) : undefined,
        pricePerKg: pricePerKg !== undefined ? (pricePerKg !== null && pricePerKg !== '' ? Number(pricePerKg) : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined,
        // Audit log trail
        isEdited: true,
        editReason: editReason?.trim() || existing.editReason || "Laboratoriya xulosasi qayta baholandi",
        editedAt: new Date(),
        editedBy: `${session.name || 'Foydalanuvchi'} (${session.role})`
      }
    })

    // Create system audit log
    await prisma.log.create({
      data: {
        action: 'INCOMING_ACT_EDITED',
        entity: 'IncomingRawMaterialAct',
        entityId: updated.id,
        userId: session.id ? Number(session.id) : null,
        details: `Sifat akti #${updated.actNumber} (${updated.productName}) ${session.name || 'Foydalanuvchi'} tomonidan tahrirlandi. Sabab: ${editReason || 'Ko\'rsatilmadi'}`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, act: updated })
  } catch (error: any) {
    console.error('Error updating incoming act:', error)
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
    const perm = checkQcActDeletePermission(session.role)
    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Sifat aktini o'chirish huquqi faqat Tizim Administratoriga berilgan!"
      }, { status: 403 })
    }

    const { id } = await params
    const actId = parseInt(id, 10)
    if (isNaN(actId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri akt ID' }, { status: 400 })
    }

    const deleted = await prisma.incomingRawMaterialAct.delete({
      where: { id: actId }
    })

    await prisma.log.create({
      data: {
        action: 'INCOMING_ACT_DELETED',
        entity: 'IncomingRawMaterialAct',
        entityId: actId,
        userId: session.id ? Number(session.id) : null,
        details: `Sifat akti #${deleted.actNumber} (${deleted.productName}) ${session.name} (Admin) tomonidan butunlay o'chirildi.`
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Akt muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting incoming act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

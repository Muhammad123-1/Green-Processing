import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
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
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 })
    }

    const existing = await prisma.disinfectionIncomingAct.findUnique({
      where: { id: actId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Dezinfeksiya akti topilmadi' }, { status: 404 })
    }

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
      orderNumber,
      arrivalDate,
      substanceName,
      productType,
      supplierName,
      batchNumber,
      accompanyingDoc,
      activeChlorinePercent,
      quantityReceived,
      unit = 'кг',
      manufactureDate,
      expiryDate,
      transportCondition,
      accessPermit,
      releasedKg,
      releasedDate,
      inspectorName,
      pricePerKg,
      registrationCert,
      conformityDeclaration,
      category,
      notes
    } = body

    const updatedAct = await prisma.disinfectionIncomingAct.update({
      where: { id: actId },
      data: {
        orderNumber: orderNumber ? parseInt(orderNumber, 10) : undefined,
        arrivalDate: arrivalDate !== undefined ? arrivalDate : undefined,
        substanceName: substanceName !== undefined ? substanceName.trim() : undefined,
        productType: productType !== undefined ? (productType?.trim() || null) : undefined,
        supplierName: supplierName !== undefined ? (supplierName?.trim() || null) : undefined,
        batchNumber: batchNumber !== undefined ? (String(batchNumber).trim() || null) : undefined,
        accompanyingDoc: accompanyingDoc !== undefined ? (accompanyingDoc?.trim() || null) : undefined,
        activeChlorinePercent: activeChlorinePercent !== undefined 
          ? (activeChlorinePercent !== null && activeChlorinePercent !== '' ? parseFloat(activeChlorinePercent) : null)
          : undefined,
        quantityReceived: quantityReceived !== undefined 
          ? (quantityReceived !== null && quantityReceived !== '' ? parseFloat(quantityReceived) : null)
          : undefined,
        unit: unit || 'кг',
        manufactureDate: manufactureDate !== undefined ? (manufactureDate || null) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate || null) : undefined,
        transportCondition: transportCondition !== undefined ? transportCondition : undefined,
        accessPermit: accessPermit !== undefined ? accessPermit : undefined,
        releasedKg: releasedKg !== undefined 
          ? (releasedKg !== null && releasedKg !== '' ? parseFloat(releasedKg) : null)
          : undefined,
        releasedDate: releasedDate !== undefined ? (releasedDate || null) : undefined,
        inspectorName: inspectorName !== undefined ? (inspectorName?.trim() || null) : undefined,
        pricePerKg: pricePerKg !== undefined 
          ? (pricePerKg !== null && pricePerKg !== '' ? parseFloat(pricePerKg) : null)
          : undefined,
        registrationCert: registrationCert !== undefined ? (registrationCert?.trim() || null) : undefined,
        conformityDeclaration: conformityDeclaration !== undefined ? (conformityDeclaration?.trim() || null) : undefined,
        category: category !== undefined ? category : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined
      }
    })

    return NextResponse.json({ success: true, act: updatedAct })
  } catch (error: any) {
    console.error('Error updating disinfection act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const perm = checkQcActDeletePermission(session.role)
    if (!perm.allowed) {
      return NextResponse.json({
        success: false,
        error: perm.reason || "Aktni o'chirish huquqi faqat Tizim Administratoriga berilgan!"
      }, { status: 403 })
    }

    const { id } = await params
    const actId = parseInt(id, 10)
    if (isNaN(actId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 })
    }

    await prisma.disinfectionIncomingAct.delete({
      where: { id: actId }
    })

    return NextResponse.json({ success: true, message: 'Akt muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting disinfection act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

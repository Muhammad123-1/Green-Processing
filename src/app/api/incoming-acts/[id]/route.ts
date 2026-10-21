import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { getRatingText } from '@/lib/incoming-acts/excel'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const actId = parseInt(id, 10)
    if (isNaN(actId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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
      notes
    } = body

    const rating = Number(decisionRating) || 4
    const resolvedDecisionText = decisionText || getRatingText(rating, 'uz')

    const updated = await prisma.incomingRawMaterialAct.update({
      where: { id: actId },
      data: {
        actNumber: actNumber !== undefined ? String(actNumber) : undefined,
        actDate: actDate !== undefined ? String(actDate) : undefined,
        productName: productName !== undefined ? String(productName).trim() : undefined,
        supplierName: supplierName !== undefined ? String(supplierName).trim() : undefined,
        temperature: temperature !== undefined ? (temperature ? String(temperature) : null) : undefined,
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
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
      }
    })

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const actId = parseInt(id, 10)
    if (isNaN(actId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await prisma.incomingRawMaterialAct.delete({
      where: { id: actId }
    })

    return NextResponse.json({ success: true, message: 'Akt muvaffaqiyatli o\'chirildi' })
  } catch (error: any) {
    console.error('Error deleting incoming act:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

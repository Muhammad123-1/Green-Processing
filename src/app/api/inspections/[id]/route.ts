import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    const inspection = await prisma.inspection.findUnique({
      where: { id: numId },
      include: {
        supplier: true,
        product: true,
        user: true,
        images: true,
      },
    })

    if (inspection) {
      return NextResponse.json(inspection)
    }

    // Fallback: check IncomingRawMaterialAct
    const act = await prisma.incomingRawMaterialAct.findUnique({
      where: { id: numId },
    })

    if (!act) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let dateIso = act.createdAt.toISOString()
    if (act.actDate) {
      if (act.actDate.includes('.')) {
        const p = act.actDate.split('.')
        if (p.length === 3) dateIso = new Date(`${p[2]}-${p[1]}-${p[0]}`).toISOString()
      } else {
        const d = new Date(act.actDate)
        if (!isNaN(d.getTime())) dateIso = d.toISOString()
      }
    }

    const st = act.decisionRating === 2 ? 'REJECTED' : act.decisionRating === 3 ? 'CONDITIONAL' : 'ACCEPTED'

    const mapped = {
      id: act.id,
      actNumber: act.actNumber ? (act.actNumber.startsWith('№') ? act.actNumber : `№ ${act.actNumber}`) : `№ ${act.id}`,
      inspectionDate: dateIso,
      supplierId: act.id,
      productId: act.id,
      batchNumber: act.batchNumber || `LOT-${act.id}`,
      quantity: act.warehouseKg || 0,
      acceptedQuantity: act.decisionRating === 2 ? 0 : (act.warehouseKg || 0),
      rejectedQuantity: act.decisionRating === 2 ? (act.warehouseKg || 0) : 0,
      rejectionActNumber: act.rejectionActNumber || null,
      rejectionReason: act.decisionRating === 2 ? (act.notes || 'Rad etilgan') : null,
      quantityUnit: 'kg',
      temperature: parseFloat((act.temperature || '').replace(',', '.')) || null,
      temperatureUnit: '°C',
      packaging: act.transportCondition === 1 ? 'Qoniqarli' : 'Qoniqarsiz',
      color: act.leafColor === 1 ? 'Muvofiq (Tabiiy)' : 'Nomaqbul',
      smell: act.tasteSmell === 1 ? 'Muvofiq (Toza)' : 'Nomaqbul',
      appearance: act.structure === 1 ? 'Muvofiq (Zich, butun)' : 'Nomaqbul',
      conclusion: act.decisionText || (act.decisionRating === 2 ? 'Rad etilgan' : 'Muvofiq'),
      status: st,
      rating: act.decisionRating,
      inspector: act.inspectorName || 'Sifat Nazoratchisi',
      vehicleNumber: (act.rawValues as any)?.vehicleNumber || null,
      invoiceNumber: (act.rawValues as any)?.invoiceNumber || null,
      notes: act.notes || null,
      sheetName: act.productName,
      createdAt: act.createdAt.toISOString(),
      supplier: { id: act.id, name: act.supplierName || 'Ta\'minotchi', phone: null, address: null },
      product: { id: act.id, name: act.productName || 'Xomashyo', unit: 'kg', gost: null },
      user: { id: 1, name: act.inspectorName || 'Sifat Nazoratchisi' },
      images: [],
    }

    return NextResponse.json(mapped)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    const body = await request.json()

    const existingInspection = await prisma.inspection.findUnique({
      where: { id: numId },
    })

    if (existingInspection) {
      const inspection = await prisma.inspection.update({
        where: { id: numId },
        data: {
          inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
          supplierId: body.supplierId ? parseInt(body.supplierId) : undefined,
          productId: body.productId ? parseInt(body.productId) : undefined,
          batchNumber: body.batchNumber,
          quantity: body.quantity ? parseFloat(body.quantity) : undefined,
          quantityUnit: body.quantityUnit,
          temperature: body.temperature ? parseFloat(body.temperature) : null,
          temperatureUnit: body.temperatureUnit,
          packaging: body.packaging,
          color: body.color,
          smell: body.smell,
          appearance: body.appearance,
          conclusion: body.conclusion,
          status: body.status,
          inspector: body.inspector,
          vehicleNumber: body.vehicleNumber,
          invoiceNumber: body.invoiceNumber,
          notes: body.notes,
          sheetName: body.sheetName,
          customFields: body.customFields,
          releasedQuantity: body.releasedQuantity !== undefined ? parseFloat(body.releasedQuantity) : undefined,
          releasedDate: body.releasedDate ? new Date(body.releasedDate) : undefined,
          ...(body.uploadedImages?.length > 0 ? {
            images: {
              create: body.uploadedImages.map((url: string) => ({ url }))
            }
          } : {})
        },
        include: {
          supplier: true,
          product: true,
          user: true,
          images: true,
        },
      })

      return NextResponse.json(inspection)
    }

    // Update IncomingRawMaterialAct
    const existingAct = await prisma.incomingRawMaterialAct.findUnique({
      where: { id: numId },
    })

    if (existingAct) {
      const updatedAct = await prisma.incomingRawMaterialAct.update({
        where: { id: numId },
        data: {
          batchNumber: body.batchNumber !== undefined ? String(body.batchNumber) : undefined,
          warehouseKg: body.quantity !== undefined ? parseFloat(body.quantity) : undefined,
          temperature: body.temperature !== undefined ? `${body.temperature} °C` : undefined,
          notes: body.notes !== undefined ? body.notes : undefined,
          inspectorName: body.inspector !== undefined ? body.inspector : undefined,
          decisionText: body.conclusion !== undefined ? body.conclusion : undefined,
          decisionRating: body.status === 'REJECTED' ? 2 : body.status === 'CONDITIONAL' ? 3 : 4,
          isEdited: true,
          editedAt: new Date(),
        }
      })

      return NextResponse.json(updatedAct)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const numId = parseInt(id)
    const inspection = await prisma.inspection.findUnique({
      where: { id: numId },
    })

    if (inspection) {
      await prisma.inspection.delete({
        where: { id: numId },
      })
      return NextResponse.json({ success: true })
    }

    const act = await prisma.incomingRawMaterialAct.findUnique({
      where: { id: numId },
    })

    if (act) {
      await prisma.incomingRawMaterialAct.delete({
        where: { id: numId },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 })
  }
}

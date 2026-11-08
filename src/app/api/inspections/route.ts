import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateInspectionQuantity } from '@/lib/qcValidation'

// GET /api/inspections - list all
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const supplierId = searchParams.get('supplierId') || ''
    const productId = searchParams.get('productId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { actNumber: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) where.status = status
    if (supplierId) where.supplierId = parseInt(supplierId)
    if (productId) where.productId = parseInt(productId)

    if (dateFrom || dateTo) {
      where.inspectionDate = {}
      if (dateFrom) (where.inspectionDate as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        ;(where.inspectionDate as Record<string, Date>).lte = to
      }
    }

    const skip = (page - 1) * limit

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.inspection.count({ where }),
    ])

    // If Inspection table is empty, query IncomingRawMaterialAct (1,276 live acts)
    if (total === 0) {
      const actWhere: any = {}
      if (search) {
        actWhere.OR = [
          { actNumber: { contains: search, mode: 'insensitive' } },
          { batchNumber: { contains: search, mode: 'insensitive' } },
          { supplierName: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { inspectorName: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (status === 'ACCEPTED') actWhere.decisionRating = { in: [4, 5] }
      else if (status === 'REJECTED') actWhere.decisionRating = 2
      else if (status === 'CONDITIONAL') actWhere.decisionRating = 3

      if (dateFrom && dateTo) {
        actWhere.actDate = { gte: dateFrom, lte: dateTo }
      } else if (dateFrom) {
        actWhere.actDate = { gte: dateFrom }
      } else if (dateTo) {
        actWhere.actDate = { lte: dateTo }
      }

      const [rawActs, actTotal] = await Promise.all([
        prisma.incomingRawMaterialAct.findMany({
          where: actWhere,
          skip,
          take: limit,
          orderBy: [{ id: 'desc' }]
        }),
        prisma.incomingRawMaterialAct.count({ where: actWhere })
      ])

      const mappedData = rawActs.map(act => {
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

        return {
          id: act.id,
          actNumber: act.actNumber ? (act.actNumber.startsWith('№') ? act.actNumber : `№ ${act.actNumber}`) : `№ ${act.id}`,
          inspectionDate: dateIso,
          batchNumber: act.batchNumber || `LOT-${act.id}`,
          quantity: act.warehouseKg || 0,
          quantityUnit: 'kg',
          temperature: parseFloat((act.temperature || '').replace(',', '.')) || null,
          temperatureUnit: '°C',
          conclusion: act.decisionText || (act.decisionRating === 2 ? 'Rad etilgan' : 'Muvofiq'),
          status: st,
          notes: act.notes || null,
          supplier: { id: act.id, name: act.supplierName || 'Ta\'minotchi' },
          product: { id: act.id, name: act.productName || 'Xomashyo', unit: 'kg' },
          createdAt: act.createdAt.toISOString()
        }
      })

      return NextResponse.json({
        data: mappedData,
        total: actTotal,
        page,
        limit,
        totalPages: Math.ceil(actTotal / limit),
      })
    }

    return NextResponse.json({
      data: inspections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

// POST /api/inspections - create new
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Strict validation: Reject impossible quantities or unit conversion errors (Direktor talabi)
    if (body.quantity !== undefined && body.quantity !== '') {
      const qtyCheck = validateInspectionQuantity(body.quantity, body.quantityUnit || 'kg')
      if (!qtyCheck.isValid) {
        return NextResponse.json({ error: qtyCheck.error }, { status: 400 })
      }
    }

    // Generate act number
    const year = new Date().getFullYear()
    const lastAct = await prisma.inspection.findFirst({
      where: { actNumber: { startsWith: `КС-${year}-` } },
      orderBy: { actNumber: 'desc' },
    })

    let nextNum = 1
    if (lastAct) {
      const parts = lastAct.actNumber.split('-')
      nextNum = parseInt(parts[parts.length - 1]) + 1
    }

    const actNumber = `КС-${year}-${String(nextNum).padStart(4, '0')}`
    const totalQty = parseFloat(body.quantity) || 0
    const status = body.status || 'ACCEPTED' // ACCEPTED | REJECTED | CONDITIONAL | PARTIAL

    // Requirement 6: Accepted vs Rejected Materials & Partial Acceptance
    let acceptedQty = totalQty
    let rejectedQty = 0

    if (status === 'REJECTED') {
      acceptedQty = 0
      rejectedQty = totalQty
    } else if (body.acceptedQuantity !== undefined || body.rejectedQuantity !== undefined) {
      acceptedQty = body.acceptedQuantity !== undefined ? parseFloat(body.acceptedQuantity) || 0 : Math.max(0, totalQty - (parseFloat(body.rejectedQuantity) || 0))
      rejectedQty = body.rejectedQuantity !== undefined ? parseFloat(body.rejectedQuantity) || 0 : Math.max(0, totalQty - acceptedQty)
    }

    // Rejected deliveries must NEVER receive a normal accepted inventory batch number
    const finalBatchNumber = status === 'REJECTED' ? null : (body.batchNumber ? String(body.batchNumber).trim() : `PART-${year}-${String(nextNum).padStart(4, '0')}`)

    // Generate rejectionActNumber when rejectedQty > 0 or status === 'REJECTED'
    let rejectionActNumber: string | null = body.rejectionActNumber || null
    if ((status === 'REJECTED' || rejectedQty > 0) && !rejectionActNumber) {
      rejectionActNumber = `REJ-${year}-${String(nextNum).padStart(4, '0')}`
    }

    const inspection = await prisma.inspection.create({
      data: {
        actNumber,
        inspectionDate: new Date(body.inspectionDate),
        supplierId: parseInt(body.supplierId),
        productId: parseInt(body.productId),
        batchNumber: finalBatchNumber,
        quantity: totalQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        rejectionActNumber,
        rejectionReason: body.rejectionReason || (status === 'REJECTED' ? (body.conclusion || body.notes || 'Sifat talabiga javob bermaydi') : null),
        quantityUnit: body.quantityUnit || 'kg',
        temperature: body.temperature ? parseFloat(body.temperature) : null,
        temperatureUnit: body.temperatureUnit || '°C',
        packaging: body.packaging || null,
        color: body.color || null,
        smell: body.smell || null,
        appearance: body.appearance || null,
        conclusion: body.conclusion || (status === 'REJECTED' ? 'Rad etildi' : 'Muvofiq'),
        status,
        rating: body.rating ? parseInt(body.rating) : null,
        inspector: body.inspector || null,
        inspectorId: body.inspectorId ? parseInt(body.inspectorId) : null,
        vehicleNumber: body.vehicleNumber || null,
        invoiceNumber: body.invoiceNumber || null,
        notes: body.notes || null,
        sheetName: body.sheetName || null,
        customFields: body.customFields || null,
        releasedQuantity: body.releasedQuantity !== undefined ? parseFloat(body.releasedQuantity) : null,
        releasedDate: body.releasedDate ? new Date(body.releasedDate) : null,
        images: body.uploadedImages?.length > 0 ? {
          create: body.uploadedImages.map((url: string) => ({ url }))
        } : undefined,
      },
      include: {
        supplier: true,
        product: true,
        user: true,
        images: true,
      },
    })

    // Only accepted quantity enters usable inventory in the Warehouse WMS (Requirement 1 & 6)
    if (status !== 'REJECTED' && acceptedQty > 0 && finalBatchNumber) {
      const shelfDays = inspection.product.maxStorageDays || inspection.product.shelfLifeDays
      let expirationDate = null
      if (shelfDays) {
        expirationDate = new Date(inspection.inspectionDate)
        expirationDate.setDate(expirationDate.getDate() + shelfDays)
      }

      const createdBatch = await prisma.inventoryBatch.create({
        data: {
          productId: inspection.productId,
          supplierId: inspection.supplierId,
          inspectionId: inspection.id,
          batchNumber: finalBatchNumber,
          quantity: acceptedQty,
          receivedAt: inspection.inspectionDate,
          expirationDate: expirationDate,
          qcStatus: 'APPROVED'
        }
      })

      await prisma.inventoryTransaction.create({
        data: {
          batchId: createdBatch.id,
          transactionType: 'IN',
          quantity: acceptedQty,
          userId: inspection.inspectorId || null,
          referenceDocId: actNumber,
        }
      })

      await prisma.log.create({
        data: {
          userId: inspection.inspectorId || null,
          action: 'CREATE_INVENTORY_BATCH',
          entity: 'InventoryBatch',
          entityId: createdBatch.id,
          details: `Omborga qabul qilingan partiya qo'shildi: #${finalBatchNumber} (${acceptedQty} ${inspection.quantityUnit})`,
        },
      })
    }

    // If there is a rejected portion or full rejection, record it in ExecutiveWastageLog (Stage A — Incoming QC)
    if (rejectedQty > 0 && rejectionActNumber) {
      const incidentDateStr = new Date(inspection.inspectionDate).toISOString().slice(0, 10)
      const firstImage = inspection.images?.[0]?.url || null
      await prisma.executiveWastageLog.upsert({
        where: { actNumber: rejectionActNumber },
        update: {
          weightKg: rejectedQty,
          reasonCategory: inspection.rejectionReason || inspection.conclusion || 'Qabulda rad etilgan',
          detailedComment: inspection.notes || inspection.conclusion,
          photoUrl: firstImage,
        },
        create: {
          actNumber: rejectionActNumber,
          batchNumber: null, // Rejected delivery has no accepted batch number
          productId: inspection.productId,
          productName: inspection.product.name,
          supplierId: inspection.supplierId,
          supplierName: inspection.supplier.name,
          reportedById: inspection.inspectorId || null,
          reportedByName: inspection.inspector || inspection.user?.name || 'Sifat nazoratchisi',
          inspectedByName: inspection.inspector || inspection.user?.name || 'Sifat nazoratchisi',
          responsibleDepartment: 'SUPPLIER',
          responsibilityStatus: 'DETERMINED',
          responsiblePersonName: inspection.supplier.name,
          responsibilityDecisionNote: `Kirish sifat nazoratida rad etildi (Akt: ${rejectionActNumber})`,
          responsibilityDecidedAt: new Date(),
          stage: 'INCOMING',
          wastageType: 'ACTUAL_DEFECT',
          weightKg: rejectedQty,
          reasonCategory: inspection.rejectionReason || inspection.conclusion || 'Qabulda rad etilgan',
          detailedComment: inspection.notes || inspection.conclusion,
          photoUrl: firstImage,
          documentUrl: inspection.pdfPath || null,
          incidentDate: incidentDateStr,
        }
      })
    }

    // Log action
    await prisma.log.create({
      data: {
        action: 'CREATE_INSPECTION',
        entity: 'Inspection',
        entityId: inspection.id,
        details: `Akt yaratildi: ${actNumber}`,
      },
    })

    return NextResponse.json(inspection, { status: 201 })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

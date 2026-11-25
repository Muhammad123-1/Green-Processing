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

    const skip = (page - 1) * limit

    const actWhere: any = {}

    // Multi-criteria and bilingual search
    if (search) {
      const cleanSearch = search.replace(/^№\s*/, '').trim()
      const searchVariants = [search, cleanSearch].filter(Boolean)

      // Multi-language product keyword mappings (Uzbek <-> Russian)
      const sLower = search.toLowerCase()
      const extraProductKeywords: string[] = []
      if (sLower.includes('aysberg') || sLower.includes('ayzberg') || sLower.includes('салат')) {
        extraProductKeywords.push('айсберг', 'айзберг', 'салат')
      }
      if (sLower.includes('pomidor') || sLower.includes('tomat') || sLower.includes('томат')) {
        extraProductKeywords.push('томат', 'помидор')
      }
      if (sLower.includes('sabzi') || sLower.includes('morkov') || sLower.includes('морковь')) {
        extraProductKeywords.push('морковь')
      }
      if (sLower.includes('piyoz') || sLower.includes('luk') || sLower.includes('лук')) {
        extraProductKeywords.push('лук')
      }
      if (sLower.includes('karom') || sLower.includes('kapusta') || sLower.includes('капуста')) {
        extraProductKeywords.push('капуста')
      }
      if (sLower.includes('bodring') || sLower.includes('ogur') || sLower.includes('огурцы') || sLower.includes('огурец')) {
        extraProductKeywords.push('огурцы', 'огурец')
      }
      if (sLower.includes('limon') || sLower.includes('лимон')) {
        extraProductKeywords.push('лимон')
      }

      actWhere.OR = [
        ...searchVariants.map(v => ({ actNumber: { contains: v, mode: 'insensitive' } })),
        ...searchVariants.map(v => ({ batchNumber: { contains: v, mode: 'insensitive' } })),
        { supplierName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        ...extraProductKeywords.map(k => ({ productName: { contains: k, mode: 'insensitive' } })),
      ]
    }

    if (status === 'ACCEPTED') actWhere.decisionRating = { in: [4, 5] }
    else if (status === 'REJECTED') actWhere.decisionRating = 2
    else if (status === 'CONDITIONAL') actWhere.decisionRating = 3

    if (productId && productId !== 'all') {
      const prodNum = parseInt(productId)
      const foundProduct = await prisma.product.findUnique({ where: { id: prodNum }, select: { name: true } })
      if (foundProduct) {
        const pLower = foundProduct.name.toLowerCase()
        if (pLower.includes('айсберг') || pLower.includes('aysberg')) {
          actWhere.productName = { contains: 'йсберг', mode: 'insensitive' }
        } else if (pLower.includes('томат') || pLower.includes('pomidor') || pLower.includes('tomat')) {
          actWhere.productName = { contains: 'томат', mode: 'insensitive' }
        } else if (pLower.includes('лук') || pLower.includes('piyoz')) {
          actWhere.productName = { contains: 'лук', mode: 'insensitive' }
        } else if (pLower.includes('капуста') || pLower.includes('karom')) {
          actWhere.productName = { contains: 'капуста', mode: 'insensitive' }
        } else if (pLower.includes('морковь') || pLower.includes('sabzi')) {
          actWhere.productName = { contains: 'морковь', mode: 'insensitive' }
        } else if (pLower.includes('лимон') || pLower.includes('limon')) {
          actWhere.productName = { contains: 'лимон', mode: 'insensitive' }
        } else if (pLower.includes('огур') || pLower.includes('bodring')) {
          actWhere.productName = { contains: 'огур', mode: 'insensitive' }
        } else {
          actWhere.productName = { contains: foundProduct.name, mode: 'insensitive' }
        }
      }
    }

    if (supplierId && supplierId !== 'all') {
      const suppNum = parseInt(supplierId)
      const foundSupplier = await prisma.supplier.findUnique({ where: { id: suppNum }, select: { name: true, shortName: true } })
      if (foundSupplier) {
        actWhere.OR = [
          { supplierName: { contains: foundSupplier.name, mode: 'insensitive' } },
          ...(foundSupplier.shortName ? [{ supplierName: { contains: foundSupplier.shortName, mode: 'insensitive' } }] : [])
        ]
      }
    }

    if (dateFrom && dateTo) {
      actWhere.actDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      actWhere.actDate = { gte: dateFrom }
    } else if (dateTo) {
      actWhere.actDate = { lte: dateTo }
    }

    // Load actual acts sorted chronologically (latest 2026 acts first)
    const [rawActs, actTotal, allProducts, allSuppliers] = await Promise.all([
      prisma.incomingRawMaterialAct.findMany({
        where: actWhere,
        skip,
        take: limit,
        orderBy: [{ actDate: 'desc' }, { id: 'desc' }]
      }),
      prisma.incomingRawMaterialAct.count({ where: actWhere }),
      prisma.product.findMany({ select: { id: true, name: true, unit: true } }),
      prisma.supplier.findMany({ select: { id: true, name: true, shortName: true } }),
    ])

    const mappedData = rawActs.map(act => {
      let dateIso = act.createdAt.toISOString()
      if (act.actDate) {
        if (act.actDate.includes('-')) {
          const parts = act.actDate.split('-')
          if (parts.length === 3) {
            dateIso = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T12:00:00.000Z`
          }
        } else if (act.actDate.includes('.')) {
          const p = act.actDate.split('.')
          if (p.length === 3) {
            dateIso = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}T12:00:00.000Z`
          }
        }
      }

      const st = act.decisionRating === 2 ? 'REJECTED' : act.decisionRating === 3 ? 'CONDITIONAL' : 'ACCEPTED'

      // Match actual product and supplier IDs
      const normProd = (act.productName || '').toLowerCase()
      const matchedProd = allProducts.find((p) => {
        const pn = p.name.toLowerCase()
        if (normProd.includes('айсберг') && (pn.includes('айсберг') || pn.includes('айзберг') || pn.includes('aysberg'))) return true
        if (normProd.includes('томат') && (pn.includes('томат') || pn.includes('tomat') || pn.includes('pomidor'))) return true
        if (normProd.includes('морков') && (pn.includes('морков') || pn.includes('sabzi'))) return true
        if (normProd.includes('лук') && (pn.includes('лук') || pn.includes('piyoz'))) return true
        if (normProd.includes('капуст') && (pn.includes('капуст') || pn.includes('karom'))) return true
        if (normProd.includes('лимон') && (pn.includes('лимон') || pn.includes('limon'))) return true
        if (normProd.includes('огур') && (pn.includes('огур') || pn.includes('bodring'))) return true
        return pn.includes(normProd) || normProd.includes(pn)
      })

      const normSupp = (act.supplierName || '').toLowerCase()
      const matchedSupp = allSuppliers.find((s) => {
        const sn = s.name.toLowerCase()
        const sh = (s.shortName || '').toLowerCase()
        return sn.includes(normSupp) || normSupp.includes(sn) || (sh && normSupp.includes(sh))
      })

      return {
        id: act.id,
        actNumber: act.actNumber ? (act.actNumber.startsWith('№') ? act.actNumber : `№ ${act.actNumber}`) : `№ ${act.id}`,
        inspectionDate: dateIso,
        batchNumber: act.batchNumber || `LOT-${act.id}`,
        quantity: act.warehouseKg !== null && act.warehouseKg !== undefined ? act.warehouseKg : 0,
        quantityUnit: 'kg',
        temperature: parseFloat((act.temperature || '').replace(',', '.')) || null,
        temperatureUnit: '°C',
        conclusion: act.decisionText || (act.decisionRating === 2 ? 'Rad etilgan' : 'Muvofiq'),
        status: st,
        notes: act.notes || null,
        supplier: { id: matchedSupp?.id || act.id, name: act.supplierName || 'Ta\'minotchi' },
        product: { id: matchedProd?.id || act.id, name: act.productName || 'Xomashyo', unit: matchedProd?.unit || 'kg' },
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

    // Sync into IncomingRawMaterialAct so all views (Inspections, Incoming Acts, Reports) are 100% unified
    try {
      const dateStr = body.inspectionDate ? String(body.inspectionDate).split('T')[0] : new Date().toISOString().split('T')[0]
      await prisma.incomingRawMaterialAct.create({
        data: {
          actNumber: actNumber.replace(/^№\s*/, ''),
          actDate: dateStr,
          productName: inspection.product?.name || body.sheetName || 'Xomashyo',
          supplierName: inspection.supplier?.name || "Ta'minotchi",
          temperature: body.temperature ? String(body.temperature) : null,
          transportCondition: body.packaging === 'Qoniqarsiz' ? 0 : 1,
          hasDocumentation: 1,
          structure: body.appearance === 'Nomaqbul' ? 0 : 1,
          leafColor: body.color === 'Nomaqbul' ? 0 : 1,
          tasteSmell: body.smell === 'Nomaqbul' ? 0 : 1,
          decisionRating: status === 'REJECTED' ? 2 : status === 'CONDITIONAL' ? 3 : 4,
          decisionText: body.conclusion || (status === 'REJECTED' ? 'Rad etildi' : 'Yaxshi'),
          warehouseKg: acceptedQty,
          batchNumber: finalBatchNumber || body.batchNumber || null,
          rejectionActNumber,
          inspectorName: body.inspector || 'Sifat Nazoratchisi',
          notes: body.notes || null,
        }
      })
    } catch (syncErr) {
      console.warn('Sync to IncomingRawMaterialAct warning:', syncErr)
    }

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

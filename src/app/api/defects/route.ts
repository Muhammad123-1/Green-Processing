import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const location = searchParams.get('location')
    const productId = searchParams.get('productId')
    const supplierId = searchParams.get('supplierId')

    const where: any = {}
    if (location && location !== 'ALL') where.location = location
    if (productId) where.productId = parseInt(productId)
    if (supplierId) where.supplierId = parseInt(supplierId)

    const defects = await (prisma as any).defectLog.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, unit: true, code: true } },
        supplier: { select: { id: true, name: true, shortName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // If defectLog table is empty and location is ALL or INSPECTION, aggregate from IncomingRawMaterialAct
    let allDefects = [...defects]
    if (defects.length === 0 && (!location || location === 'ALL' || location === 'INSPECTION')) {
      const rawActs = await prisma.incomingRawMaterialAct.findMany({
        where: {
          OR: [
            { decisionRating: 2 },
            { rejectionActNumber: { not: null } },
            { internalOxidation: 1 },
            { insectTraces: 1 },
            { rotDiseases: 1 },
            { transportCondition: 0 },
            { noMechanicalDamage: 0 }
          ]
        },
        orderBy: [{ id: 'desc' }]
      })

      const mappedFromActs = rawActs.map(act => {
        let defectType = 'MECHANICAL_DAMAGE'
        let reason = 'Mexanik shikastlanish va ezilish'
        if (act.rotDiseases === 1) {
          defectType = 'ROTTEN'
          reason = 'Chirish va zamburug\' alomatlari'
        } else if (act.insectTraces === 1) {
          defectType = 'FOREIGN_OBJECT'
          reason = 'Zararkunanda va hasharot izlari'
        } else if (act.internalOxidation === 1) {
          defectType = 'TEMPERATURE_ABUSE'
          reason = 'Ichki oksidlanish va qizarish (harorat rejimi buzilgan)'
        } else if (act.decisionRating === 2) {
          defectType = 'ROTTEN'
          reason = act.notes || act.decisionText || 'Sifat talabiga javob bermaydi, rad etilgan'
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

        const qty = act.warehouseKg || 10
        const price = act.pricePerKg || 15000

        return {
          id: act.id,
          defectNumber: act.rejectionActNumber || `BRAK-${act.actNumber || act.id}`,
          productId: act.id,
          batchNumber: act.batchNumber || `${act.id}`,
          supplierId: act.id,
          location: 'INSPECTION',
          defectType,
          quantity: qty,
          unit: 'kg',
          estimatedCost: Math.round(qty * price),
          actionTaken: act.decisionRating === 2 ? 'RETURN_TO_SUPPLIER' : 'SCRAP_DISPOSAL',
          reason: act.notes ? `${reason} (${act.notes})` : reason,
          responsible: act.inspectorName || 'Sifat Nazoratchisi',
          createdAt: dateIso,
          product: { id: act.id, name: act.productName || 'Xomashyo', unit: 'kg', code: `PRD-${act.id}` },
          supplier: { id: act.id, name: act.supplierName || 'Ta\'minotchi', shortName: act.supplierName }
        }
      })

      allDefects = mappedFromActs
    }

    // Calculate defect analytics KPIs
    const totalDefectKg = allDefects.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0)
    const totalCost = allDefects.reduce((sum: number, d: any) => sum + (d.estimatedCost || 0), 0)
    
    // Group by location
    const byLocation: Record<string, number> = {}
    // Group by reason / defectType
    const byType: Record<string, number> = {}

    allDefects.forEach((d: any) => {
      byLocation[d.location] = (byLocation[d.location] || 0) + (d.quantity || 0)
      byType[d.defectType] = (byType[d.defectType] || 0) + (d.quantity || 0)
    })

    return NextResponse.json({
      data: allDefects,
      kpis: {
        totalRecords: allDefects.length,
        totalDefectKg,
        totalCost,
        byLocation,
        byType
      }
    })
  } catch (error) {
    console.error('Error fetching defects:', error)
    return NextResponse.json({ error: 'Brak ma\'lumotlarini olishda xatolik' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      productId,
      batchNumber,
      supplierId,
      location = 'INSPECTION',
      defectType,
      quantity,
      unit = 'kg',
      estimatedCost,
      actionTaken,
      reason,
      responsible,
      notes
    } = body

    if (!productId || !defectType || !quantity || parseFloat(quantity) <= 0 || !reason) {
      return NextResponse.json(
        { error: 'Barcha majburiy maydonlarni (Mahsulot, Brak turi, Miqdor, Sabab) to\'ldiring' },
        { status: 400 }
      )
    }

    const defectCount = await (prisma as any).defectLog.count()
    const defectNumber = `BRK-${new Date().getFullYear()}-${String(defectCount + 1).padStart(4, '0')}`

    const newDefect = await (prisma as any).defectLog.create({
      data: {
        defectNumber,
        productId: parseInt(productId),
        batchNumber: batchNumber || null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        location,
        defectType,
        quantity: parseFloat(quantity),
        unit,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        actionTaken: actionTaken || 'SCRAP_DISPOSAL',
        reason,
        responsible: responsible || 'Sifat Nazoratchisi'
      },
      include: {
        product: true,
        supplier: true
      }
    })

    return NextResponse.json(newDefect, { status: 201 })
  } catch (error) {
    console.error('Error creating defect log:', error)
    return NextResponse.json({ error: 'Brak yozuvini yaratishda xatolik' }, { status: 500 })
  }
}

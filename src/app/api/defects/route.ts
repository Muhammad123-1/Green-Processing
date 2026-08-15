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

    // Calculate defect analytics KPIs
    const totalDefectKg = defects.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0)
    const totalCost = defects.reduce((sum: number, d: any) => sum + (d.estimatedCost || 0), 0)
    
    // Group by location
    const byLocation: Record<string, number> = {}
    // Group by reason / defectType
    const byType: Record<string, number> = {}

    defects.forEach((d: any) => {
      byLocation[d.location] = (byLocation[d.location] || 0) + (d.quantity || 0)
      byType[d.defectType] = (byType[d.defectType] || 0) + (d.quantity || 0)
    })

    return NextResponse.json({
      data: defects,
      kpis: {
        totalRecords: defects.length,
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

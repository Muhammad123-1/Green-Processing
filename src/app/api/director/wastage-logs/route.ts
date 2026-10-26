import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { toNum } from '@/lib/shopReport'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN' && session.role !== 'QUALITY_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get('pageSize') || '20', 10)))
    const stage = searchParams.get('stage') || ''
    const wastageType = searchParams.get('wastageType') || ''
    const productName = searchParams.get('productName') || ''
    const supplierName = searchParams.get('supplierName') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const search = searchParams.get('search') || ''

    const where: any = { isCancelled: false }

    if (stage) where.stage = stage
    if (wastageType) where.wastageType = wastageType
    if (productName) where.productName = { contains: productName, mode: 'insensitive' }
    if (supplierName) where.supplierName = { contains: supplierName, mode: 'insensitive' }

    if (dateFrom && dateTo) {
      where.incidentDate = { gte: dateFrom, lte: dateTo }
    } else if (dateFrom) {
      where.incidentDate = { gte: dateFrom }
    } else if (dateTo) {
      where.incidentDate = { lte: dateTo }
    }

    if (search) {
      where.OR = [
        { actNumber: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { reasonCategory: { contains: search, mode: 'insensitive' } },
        { detailedComment: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [totalItems, items] = await Promise.all([
      prisma.executiveWastageLog.count({ where }),
      prisma.executiveWastageLog.findMany({
        where,
        orderBy: { incidentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const productName = String(body.productName || '').trim()
    const weightKg = toNum(body.weightKg)

    if (!productName) {
      return NextResponse.json({ error: 'Mahsulot nomini kiriting' }, { status: 400 })
    }
    if (weightKg <= 0) {
      return NextResponse.json({ error: "Brak vazni 0 dan katta bo'lishi kerak" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const incidentDate = body.incidentDate || todayStr

    // Generate Act Number
    let actNumber = body.actNumber ? String(body.actNumber).trim() : ''
    if (!actNumber) {
      const datePart = incidentDate.replace(/-/g, '')
      const countToday = await prisma.executiveWastageLog.count({
        where: { incidentDate },
      })
      actNumber = `BRK-${datePart}-${String(countToday + 1).padStart(4, '0')}`
    }

    const log = await prisma.executiveWastageLog.create({
      data: {
        actNumber,
        batchNumber: body.batchNumber ? String(body.batchNumber).trim() : null,
        productName,
        supplierName: body.supplierName ? String(body.supplierName).trim() : null,
        reportedById: session.id,
        reportedByName: session.name,
        receivedByName: body.receivedByName ? String(body.receivedByName).trim() : null,
        stage: body.stage || 'PROCESSING',
        wastageType: body.wastageType || 'ACTUAL_DEFECT',
        weightKg,
        reasonCategory: body.reasonCategory || 'Boshqa',
        detailedComment: body.detailedComment ? String(body.detailedComment).trim() : null,
        photoUrl: body.photoUrl ? String(body.photoUrl).trim() : null,
        incidentDate,
        incidentTime: body.incidentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    })

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tableName: 'ExecutiveWastageLog',
        operation: 'INSERT',
        newValues: JSON.stringify(log),
        changedByUserId: session.id,
      },
    }).catch(() => null)

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Faqat direktor bekor qilishi mumkin' }, { status: 403 })
    }

    const body = await req.json()
    const id = parseInt(body.id, 10)
    const cancelReason = String(body.cancelReason || '').trim()

    if (!id || !cancelReason) {
      return NextResponse.json({ error: 'ID va bekor qilish sababini kiriting' }, { status: 400 })
    }

    const updated = await prisma.executiveWastageLog.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelReason: `${cancelReason} (Bekor qildi: ${session.name})`,
      },
    })

    await prisma.auditLog.create({
      data: {
        tableName: 'ExecutiveWastageLog',
        operation: 'CANCEL',
        newValues: JSON.stringify(updated),
        changedByUserId: session.id,
      },
    }).catch(() => null)

    return NextResponse.json({ success: true, log: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

function nonNegativeNumber(value: unknown) {
  const result = Number(value)
  return Number.isFinite(result) && result >= 0 ? result : null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const standards = await prisma.executiveLossStandard.findMany({
      orderBy: { productName: 'asc' },
    })

    return NextResponse.json({ success: true, standards })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'DIRECTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const productName = String(body.productName || '').trim()
    if (!productName) {
      return NextResponse.json({ error: 'Mahsulot nomini kiriting' }, { status: 400 })
    }

    const incomingNormPercent = nonNegativeNumber(body.incomingNormPercent)
    const processingNormPercent = nonNegativeNumber(body.processingNormPercent)
    const storageNormPercent = nonNegativeNumber(body.storageNormPercent)
    const criticalThreshold = nonNegativeNumber(body.criticalThreshold)
    if (incomingNormPercent === null || processingNormPercent === null || storageNormPercent === null || criticalThreshold === null) {
      return NextResponse.json({ error: "Me'yorlar 0 yoki undan katta son bo'lishi kerak" }, { status: 400 })
    }
    const notes = body.notes ? String(body.notes).trim() : null

    const record = await prisma.executiveLossStandard.upsert({
      where: { productName },
      create: {
        productName,
        incomingNormPercent,
        processingNormPercent,
        storageNormPercent,
        criticalThreshold,
        notes,
        updatedById: session.id,
      },
      update: {
        incomingNormPercent,
        processingNormPercent,
        storageNormPercent,
        criticalThreshold,
        notes,
        updatedById: session.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tableName: 'ExecutiveLossStandard',
        operation: 'UPSERT',
        newValues: JSON.stringify(record),
        changedByUserId: session.id,
      },
    }).catch(() => null)

    return NextResponse.json({ success: true, record })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 })
  }
}

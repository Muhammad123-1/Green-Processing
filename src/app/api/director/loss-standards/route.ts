import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { toNum } from '@/lib/shopReport'

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

    const incomingNormPercent = toNum(body.incomingNormPercent) || 3.0
    const processingNormPercent = toNum(body.processingNormPercent) || 12.0
    const storageNormPercent = toNum(body.storageNormPercent) || 2.0
    const criticalThreshold = toNum(body.criticalThreshold) || 5.0
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

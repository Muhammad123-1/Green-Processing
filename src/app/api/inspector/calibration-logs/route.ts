import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CalibrationLog" (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "batchNumber" TEXT,
        "diameterMm" DOUBLE PRECISION,
        "sampleTemp" DOUBLE PRECISION,
        "bladeSharpness" TEXT DEFAULT 'A''lo',
        "wastePercent" DOUBLE PRECISION,
        "isStandard" BOOLEAN NOT NULL DEFAULT TRUE,
        "correctiveAction" TEXT,
        "responsible" TEXT NOT NULL,
        "inspectorId" INTEGER,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring CalibrationLog table:', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if ((prisma as any).calibrationLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).calibrationLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }]
        })
        return NextResponse.json(logs)
      } catch (err) {
        console.warn('Fallback to queryRaw for CalibrationLog:', err)
      }
    }

    const query = date
      ? `SELECT * FROM "CalibrationLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "CalibrationLog" ORDER BY "date" DESC, "id" DESC`
    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching calibration logs:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const session = await getSession()
    const body = await req.json()
    const {
      date = new Date().toISOString().split('T')[0],
      time = new Date().toTimeString().slice(0, 5),
      productName,
      batchNumber,
      diameterMm,
      sampleTemp,
      bladeSharpness = 'A\'lo',
      wastePercent,
      correctiveAction,
      responsible = session?.name || 'Sex Nazoratchisi',
      notes
    } = body

    if (!productName) {
      return NextResponse.json({ error: 'Mahsulot nomini tanlang' }, { status: 400 })
    }

    const diam = diameterMm !== undefined && diameterMm !== '' ? parseFloat(diameterMm) : null
    const temp = sampleTemp !== undefined && sampleTemp !== '' ? parseFloat(sampleTemp) : null
    const waste = wastePercent !== undefined && wastePercent !== '' ? parseFloat(wastePercent) : null

    // Temp standard: 0°C ... +5°C
    const isTempOk = temp === null || (temp >= 0 && temp <= 5.0)
    const isStandard = isTempOk

    if ((prisma as any).calibrationLog?.create) {
      try {
        const item = await (prisma as any).calibrationLog.create({
          data: {
            date,
            time,
            productName,
            batchNumber: batchNumber || null,
            diameterMm: diam,
            sampleTemp: temp,
            bladeSharpness,
            wastePercent: waste,
            isStandard,
            correctiveAction: correctiveAction || (!isStandard ? 'Harorat me\'yordan yuqori' : null),
            responsible,
            inspectorId: session?.id || null,
            notes: notes || null
          }
        })
        return NextResponse.json(item, { status: 201 })
      } catch (err) {
        console.warn('Fallback to queryRaw insert for CalibrationLog:', err)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "CalibrationLog" (
        "date", "time", "productName", "batchNumber", "diameterMm",
        "sampleTemp", "bladeSharpness", "wastePercent", "isStandard",
        "correctiveAction", "responsible", "inspectorId", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
      ) RETURNING *;
    `, date, time, productName, batchNumber || null, diam, temp, bladeSharpness, waste, isStandard, correctiveAction || (!isStandard ? 'Harorat me\'yordan yuqori' : null), responsible, session?.id || null, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating calibration log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "CalibrationLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FsscQcLog" (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "lineName" TEXT NOT NULL DEFAULT '1-Qadoqlash Liniyasi',
        "productName" TEXT NOT NULL,
        "batchNumber" TEXT NOT NULL,
        "nominalWeight" DOUBLE PRECISION NOT NULL,
        "actualWeight" DOUBLE PRECISION NOT NULL,
        "weightDeviation" DOUBLE PRECISION NOT NULL,
        "packageCheckNo" INTEGER NOT NULL DEFAULT 5,
        "sealIntegrityOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "metalDetectorOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "labelCorrectOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "gasMixLevel" TEXT,
        "status" TEXT NOT NULL DEFAULT 'APPROVED',
        "correctiveAction" TEXT,
        "responsible" TEXT NOT NULL,
        "inspectorId" INTEGER,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring FsscQcLog table:', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if ((prisma as any).fsscQcLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).fsscQcLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }]
        })
        return NextResponse.json(logs)
      } catch (err) {
        console.warn('Fallback to queryRaw for FsscQcLog:', err)
      }
    }

    const query = date
      ? `SELECT * FROM "FsscQcLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "FsscQcLog" ORDER BY "date" DESC, "id" DESC`
    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching FSSC logs:', error)
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
      lineName = '1-Qadoqlash Liniyasi',
      productName,
      batchNumber,
      nominalWeight = 500,
      actualWeight,
      packageCheckNo = 5,
      sealIntegrityOk = true,
      metalDetectorOk = true,
      labelCorrectOk = true,
      gasMixLevel,
      correctiveAction,
      responsible = session?.name || 'Sifat Nazoratchisi',
      notes
    } = body

    if (!productName || !batchNumber || actualWeight === undefined || actualWeight === '') {
      return NextResponse.json({ error: 'Mahsulot nomi, partiya va haqiqiy vaznni kiriting' }, { status: 400 })
    }

    const nom = parseFloat(nominalWeight)
    const act = parseFloat(actualWeight)
    const dev = parseFloat((act - nom).toFixed(1))

    // FSSC Tolerance: +-10g
    let status = 'APPROVED'
    if (Math.abs(dev) > 10 || !sealIntegrityOk || !metalDetectorOk || !labelCorrectOk) {
      status = Math.abs(dev) > 20 || !metalDetectorOk ? 'REJECTED' : 'WARNING'
    }

    if ((prisma as any).fsscQcLog?.create) {
      try {
        const item = await (prisma as any).fsscQcLog.create({
          data: {
            date,
            time,
            lineName,
            productName,
            batchNumber,
            nominalWeight: nom,
            actualWeight: act,
            weightDeviation: dev,
            packageCheckNo: parseInt(packageCheckNo) || 5,
            sealIntegrityOk: Boolean(sealIntegrityOk),
            metalDetectorOk: Boolean(metalDetectorOk),
            labelCorrectOk: Boolean(labelCorrectOk),
            gasMixLevel: gasMixLevel || null,
            status,
            correctiveAction: correctiveAction || null,
            responsible,
            inspectorId: session?.id || null,
            notes: notes || null
          }
        })
        return NextResponse.json(item, { status: 201 })
      } catch (err) {
        console.warn('Fallback to queryRaw insert for FsscQcLog:', err)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "FsscQcLog" (
        "date", "time", "lineName", "productName", "batchNumber",
        "nominalWeight", "actualWeight", "weightDeviation", "packageCheckNo",
        "sealIntegrityOk", "metalDetectorOk", "labelCorrectOk", "gasMixLevel",
        "status", "correctiveAction", "responsible", "inspectorId", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      ) RETURNING *;
    `, date, time, lineName, productName, batchNumber, nom, act, dev, parseInt(packageCheckNo) || 5, Boolean(sealIntegrityOk), Boolean(metalDetectorOk), Boolean(labelCorrectOk), gasMixLevel || null, status, correctiveAction || null, responsible, session?.id || null, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating FSSC log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "FsscQcLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

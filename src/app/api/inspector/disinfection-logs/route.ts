import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DisinfectionLog" (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "vannaNumber" TEXT NOT NULL,
        "solutionType" TEXT NOT NULL DEFAULT 'Xlor eritmasi',
        "concentrationPpm" DOUBLE PRECISION NOT NULL,
        "phLevel" DOUBLE PRECISION,
        "waterTemp" DOUBLE PRECISION,
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
    console.error('Error ensuring DisinfectionLog table:', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if ((prisma as any).disinfectionLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).disinfectionLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }]
        })
        return NextResponse.json(logs)
      } catch (err) {
        console.warn('Fallback to queryRaw for DisinfectionLog:', err)
      }
    }

    const query = date
      ? `SELECT * FROM "DisinfectionLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "DisinfectionLog" ORDER BY "date" DESC, "id" DESC`
    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching disinfection logs:', error)
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
      vannaNumber = '1-Vanna (Yuvish)',
      solutionType = 'Xlor eritmasi',
      concentrationPpm,
      phLevel,
      waterTemp,
      correctiveAction,
      responsible = session?.name || 'Sifat Nazoratchisi',
      notes
    } = body

    if (!concentrationPpm || isNaN(parseFloat(concentrationPpm))) {
      return NextResponse.json({ error: 'Konsentratsiyani (ppm) kiriting' }, { status: 400 })
    }

    const ppm = parseFloat(concentrationPpm)
    const ph = phLevel !== undefined && phLevel !== '' ? parseFloat(phLevel) : null
    const wTemp = waterTemp !== undefined && waterTemp !== '' ? parseFloat(waterTemp) : null

    // KKT-1 Standard: 50.0 - 100.0 ppm
    const isStandard = ppm >= 50 && ppm <= 100

    if ((prisma as any).disinfectionLog?.create) {
      try {
        const item = await (prisma as any).disinfectionLog.create({
          data: {
            date,
            time,
            vannaNumber,
            solutionType,
            concentrationPpm: ppm,
            phLevel: ph,
            waterTemp: wTemp,
            isStandard,
            correctiveAction: correctiveAction || (!isStandard ? 'Konsentratsiya me\'yordan chetlashdi' : null),
            responsible,
            inspectorId: session?.id || null,
            notes: notes || null
          }
        })
        return NextResponse.json(item, { status: 201 })
      } catch (err) {
        console.warn('Fallback to queryRaw insert for DisinfectionLog:', err)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "DisinfectionLog" (
        "date", "time", "vannaNumber", "solutionType", "concentrationPpm",
        "phLevel", "waterTemp", "isStandard", "correctiveAction", "responsible",
        "inspectorId", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      ) RETURNING *;
    `, date, time, vannaNumber, solutionType, ppm, ph, wTemp, isStandard, correctiveAction || (!isStandard ? 'Konsentratsiya me\'yordan chetlashdi' : null), responsible, session?.id || null, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating disinfection log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "DisinfectionLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

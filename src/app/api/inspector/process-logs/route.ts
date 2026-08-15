import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProcessQCLog" (
        "id" SERIAL PRIMARY KEY,
        "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "cleanZoneTemp" DOUBLE PRECISION,
        "dirtyZoneTemp" DOUBLE PRECISION,
        "pfColeCarrotBatch" TEXT,
        "pfColeCabbageBatch" TEXT,
        "pfIcebergBatch" TEXT,
        "pfOnionBatch" TEXT,
        "pfTomatoBatch" TEXT,
        "gpColeTemp" DOUBLE PRECISION,
        "gpIcebergTemp" DOUBLE PRECISION,
        "gpTomatoTemp" DOUBLE PRECISION,
        "gpOnionTemp" DOUBLE PRECISION,
        "correctiveAction" TEXT,
        "responsible" TEXT,
        "inspectorId" INTEGER,
        "status" TEXT DEFAULT 'APPROVED',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring ProcessQCLog table:', err)
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if ((prisma as any).processQCLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).processQCLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }],
          include: {
            inspector: { select: { id: true, name: true, role: true } }
          }
        })
        return NextResponse.json(logs)
      } catch (prismaErr) {
        console.warn('Prisma findMany fallback to raw SQL:', prismaErr)
      }
    }

    const query = date
      ? `SELECT * FROM "ProcessQCLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "ProcessQCLog" ORDER BY "date" DESC, "id" DESC`

    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching process logs:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const body = await request.json()
    const {
      date,
      time,
      cleanZoneTemp,
      dirtyZoneTemp,
      pfColeCarrotBatch,
      pfColeCabbageBatch,
      pfIcebergBatch,
      pfOnionBatch,
      pfTomatoBatch,
      gpColeTemp,
      gpIcebergTemp,
      gpTomatoTemp,
      gpOnionTemp,
      correctiveAction,
      responsible,
      status,
      notes
    } = body

    if (!date || !time) {
      return NextResponse.json({ error: 'Sana va vaqt kiritilishi shart' }, { status: 400 })
    }

    const tClean = cleanZoneTemp !== undefined && cleanZoneTemp !== '' ? parseFloat(cleanZoneTemp) : null
    const tDirty = dirtyZoneTemp !== undefined && dirtyZoneTemp !== '' ? parseFloat(dirtyZoneTemp) : null
    const tGpCole = gpColeTemp !== undefined && gpColeTemp !== '' ? parseFloat(gpColeTemp) : null
    const tGpIceberg = gpIcebergTemp !== undefined && gpIcebergTemp !== '' ? parseFloat(gpIcebergTemp) : null
    const tGpTomato = gpTomatoTemp !== undefined && gpTomatoTemp !== '' ? parseFloat(gpTomatoTemp) : null
    const tGpOnion = gpOnionTemp !== undefined && gpOnionTemp !== '' ? parseFloat(gpOnionTemp) : null
    const resp = responsible || session.name || 'Mas\'ul xodim'
    const stat = status || 'APPROVED'

    if ((prisma as any).processQCLog?.create) {
      try {
        const newLog = await (prisma as any).processQCLog.create({
          data: {
            date,
            time,
            cleanZoneTemp: tClean,
            dirtyZoneTemp: tDirty,
            pfColeCarrotBatch: pfColeCarrotBatch || null,
            pfColeCabbageBatch: pfColeCabbageBatch || null,
            pfIcebergBatch: pfIcebergBatch || null,
            pfOnionBatch: pfOnionBatch || null,
            pfTomatoBatch: pfTomatoBatch || null,
            gpColeTemp: tGpCole,
            gpIcebergTemp: tGpIceberg,
            gpTomatoTemp: tGpTomato,
            gpOnionTemp: tGpOnion,
            correctiveAction: correctiveAction || null,
            responsible: resp,
            inspectorId: session.id,
            status: stat,
            notes: notes || null
          }
        })
        return NextResponse.json(newLog, { status: 201 })
      } catch (prismaErr) {
        console.warn('Prisma create fallback to raw SQL:', prismaErr)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "ProcessQCLog" (
        "date", "time", "cleanZoneTemp", "dirtyZoneTemp",
        "pfColeCarrotBatch", "pfColeCabbageBatch", "pfIcebergBatch", "pfOnionBatch", "pfTomatoBatch",
        "gpColeTemp", "gpIcebergTemp", "gpTomatoTemp", "gpOnionTemp",
        "correctiveAction", "responsible", "inspectorId", "status", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      ) RETURNING *;
    `, date, time, tClean, tDirty, pfColeCarrotBatch || null, pfColeCabbageBatch || null, pfIcebergBatch || null, pfOnionBatch || null, pfTomatoBatch || null, tGpCole, tGpIceberg, tGpTomato, tGpOnion, correctiveAction || null, resp, session.id, stat, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating process QC log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTable()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const body = await request.json()
    const {
      id,
      date,
      time,
      cleanZoneTemp,
      dirtyZoneTemp,
      pfColeCarrotBatch,
      pfColeCabbageBatch,
      pfIcebergBatch,
      pfOnionBatch,
      pfTomatoBatch,
      gpColeTemp,
      gpIcebergTemp,
      gpTomatoTemp,
      gpOnionTemp,
      correctiveAction,
      responsible,
      status,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })
    }

    const tClean = cleanZoneTemp !== undefined && cleanZoneTemp !== '' ? parseFloat(cleanZoneTemp) : null
    const tDirty = dirtyZoneTemp !== undefined && dirtyZoneTemp !== '' ? parseFloat(dirtyZoneTemp) : null
    const tGpCole = gpColeTemp !== undefined && gpColeTemp !== '' ? parseFloat(gpColeTemp) : null
    const tGpIceberg = gpIcebergTemp !== undefined && gpIcebergTemp !== '' ? parseFloat(gpIcebergTemp) : null
    const tGpTomato = gpTomatoTemp !== undefined && gpTomatoTemp !== '' ? parseFloat(gpTomatoTemp) : null
    const tGpOnion = gpOnionTemp !== undefined && gpOnionTemp !== '' ? parseFloat(gpOnionTemp) : null
    const resp = responsible || session.name
    const stat = status || 'APPROVED'

    if ((prisma as any).processQCLog?.update) {
      try {
        const updated = await (prisma as any).processQCLog.update({
          where: { id: parseInt(id) },
          data: {
            date,
            time,
            cleanZoneTemp: tClean,
            dirtyZoneTemp: tDirty,
            pfColeCarrotBatch: pfColeCarrotBatch || null,
            pfColeCabbageBatch: pfColeCabbageBatch || null,
            pfIcebergBatch: pfIcebergBatch || null,
            pfOnionBatch: pfOnionBatch || null,
            pfTomatoBatch: pfTomatoBatch || null,
            gpColeTemp: tGpCole,
            gpIcebergTemp: tGpIceberg,
            gpTomatoTemp: tGpTomato,
            gpOnionTemp: tGpOnion,
            correctiveAction: correctiveAction || null,
            responsible: resp,
            status: stat,
            notes: notes || null
          }
        })
        return NextResponse.json(updated)
      } catch (prismaErr) {
        console.warn('Prisma update fallback to raw SQL:', prismaErr)
      }
    }

    const updated: any = await prisma.$queryRawUnsafe(`
      UPDATE "ProcessQCLog" SET
        "date" = $1, "time" = $2, "cleanZoneTemp" = $3, "dirtyZoneTemp" = $4,
        "pfColeCarrotBatch" = $5, "pfColeCabbageBatch" = $6, "pfIcebergBatch" = $7,
        "pfOnionBatch" = $8, "pfTomatoBatch" = $9, "gpColeTemp" = $10,
        "gpIcebergTemp" = $11, "gpTomatoTemp" = $12, "gpOnionTemp" = $13,
        "correctiveAction" = $14, "responsible" = $15, "status" = $16,
        "notes" = $17, "updatedAt" = NOW()
      WHERE "id" = $18
      RETURNING *;
    `, date, time, tClean, tDirty, pfColeCarrotBatch || null, pfColeCabbageBatch || null, pfIcebergBatch || null, pfOnionBatch || null, pfTomatoBatch || null, tGpCole, tGpIceberg, tGpTomato, tGpOnion, correctiveAction || null, resp, stat, notes || null, parseInt(id))

    return NextResponse.json(updated[0] || updated)
  } catch (error: any) {
    console.error('Error updating process QC log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID berilmadi' }, { status: 400 })

    if ((prisma as any).processQCLog?.delete) {
      try {
        await (prisma as any).processQCLog.delete({
          where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
      } catch (prismaErr) {
        console.warn('Prisma delete fallback to raw SQL:', prismaErr)
      }
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "ProcessQCLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting process QC log:', error)
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

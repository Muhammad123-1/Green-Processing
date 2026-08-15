import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TemperatureLog" (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "icebergTemp" DOUBLE PRECISION,
        "onionTemp" DOUBLE PRECISION,
        "tomatoTemp" DOUBLE PRECISION,
        "carrotTemp" DOUBLE PRECISION,
        "cabbageTemp" DOUBLE PRECISION,
        "deviation" TEXT DEFAULT 'Норма',
        "correctiveAction" TEXT,
        "responsible" TEXT NOT NULL,
        "inspectorId" INTEGER,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring TemperatureLog table:', err)
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if ((prisma as any).temperatureLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).temperatureLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }]
        })
        return NextResponse.json(logs)
      } catch (prismaErr) {
        console.warn('Prisma findMany fallback to raw SQL:', prismaErr)
      }
    }

    const query = date
      ? `SELECT * FROM "TemperatureLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "TemperatureLog" ORDER BY "date" DESC, "id" DESC`
    
    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching warehouse temperature logs:', error)
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
      icebergTemp,
      onionTemp,
      tomatoTemp,
      carrotTemp,
      cabbageTemp,
      deviation,
      correctiveAction,
      responsible,
      notes
    } = body

    if (!date || !time) {
      return NextResponse.json({ error: 'Sana va vaqt kiritilishi shart' }, { status: 400 })
    }

    const tIceberg = icebergTemp !== undefined && icebergTemp !== '' ? parseFloat(icebergTemp) : null
    const tOnion = onionTemp !== undefined && onionTemp !== '' ? parseFloat(onionTemp) : null
    const tTomato = tomatoTemp !== undefined && tomatoTemp !== '' ? parseFloat(tomatoTemp) : null
    const tCarrot = carrotTemp !== undefined && carrotTemp !== '' ? parseFloat(carrotTemp) : null
    const tCabbage = cabbageTemp !== undefined && cabbageTemp !== '' ? parseFloat(cabbageTemp) : null
    const dev = deviation || 'Норма'
    const act = correctiveAction || '-'
    const resp = responsible || session.name || 'Mas\'ul xodim'
    const note = notes || null

    if ((prisma as any).temperatureLog?.create) {
      try {
        const newLog = await (prisma as any).temperatureLog.create({
          data: {
            date,
            time,
            icebergTemp: tIceberg,
            onionTemp: tOnion,
            tomatoTemp: tTomato,
            carrotTemp: tCarrot,
            cabbageTemp: tCabbage,
            deviation: dev,
            correctiveAction: act,
            responsible: resp,
            inspectorId: session.id,
            notes: note
          }
        })
        return NextResponse.json(newLog, { status: 201 })
      } catch (prismaErr) {
        console.warn('Prisma create fallback to raw SQL:', prismaErr)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "TemperatureLog" (
        "date", "time", "icebergTemp", "onionTemp", "tomatoTemp", "carrotTemp", "cabbageTemp",
        "deviation", "correctiveAction", "responsible", "inspectorId", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      ) RETURNING *;
    `, date, time, tIceberg, tOnion, tTomato, tCarrot, tCabbage, dev, act, resp, session.id, note)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating warehouse temperature log:', error)
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
      icebergTemp,
      onionTemp,
      tomatoTemp,
      carrotTemp,
      cabbageTemp,
      deviation,
      correctiveAction,
      responsible,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })
    }

    const tIceberg = icebergTemp !== undefined && icebergTemp !== '' ? parseFloat(icebergTemp) : null
    const tOnion = onionTemp !== undefined && onionTemp !== '' ? parseFloat(onionTemp) : null
    const tTomato = tomatoTemp !== undefined && tomatoTemp !== '' ? parseFloat(tomatoTemp) : null
    const tCarrot = carrotTemp !== undefined && carrotTemp !== '' ? parseFloat(carrotTemp) : null
    const tCabbage = cabbageTemp !== undefined && cabbageTemp !== '' ? parseFloat(cabbageTemp) : null
    const dev = deviation || 'Норма'
    const act = correctiveAction || '-'
    const resp = responsible || session.name
    const note = notes || null

    if ((prisma as any).temperatureLog?.update) {
      try {
        const updated = await (prisma as any).temperatureLog.update({
          where: { id: parseInt(id) },
          data: {
            date,
            time,
            icebergTemp: tIceberg,
            onionTemp: tOnion,
            tomatoTemp: tTomato,
            carrotTemp: tCarrot,
            cabbageTemp: tCabbage,
            deviation: dev,
            correctiveAction: act,
            responsible: resp,
            notes: note
          }
        })
        return NextResponse.json(updated)
      } catch (prismaErr) {
        console.warn('Prisma update fallback to raw SQL:', prismaErr)
      }
    }

    const updated: any = await prisma.$queryRawUnsafe(`
      UPDATE "TemperatureLog" SET
        "date" = $1, "time" = $2, "icebergTemp" = $3, "onionTemp" = $4,
        "tomatoTemp" = $5, "carrotTemp" = $6, "cabbageTemp" = $7,
        "deviation" = $8, "correctiveAction" = $9, "responsible" = $10,
        "notes" = $11, "updatedAt" = NOW()
      WHERE "id" = $12
      RETURNING *;
    `, date, time, tIceberg, tOnion, tTomato, tCarrot, tCabbage, dev, act, resp, note, parseInt(id))

    return NextResponse.json(updated[0] || updated)
  } catch (error: any) {
    console.error('Error updating warehouse temperature log:', error)
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

    if ((prisma as any).temperatureLog?.delete) {
      try {
        await (prisma as any).temperatureLog.delete({
          where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
      } catch (prismaErr) {
        console.warn('Prisma delete fallback to raw SQL:', prismaErr)
      }
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "TemperatureLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting warehouse temperature log:', error)
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

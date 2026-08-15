import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReceivingLog" (
        "id" SERIAL PRIMARY KEY,
        "docNumber" TEXT UNIQUE NOT NULL,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "supplierName" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "batchNumber" TEXT NOT NULL,
        "quantityKg" DOUBLE PRECISION NOT NULL,
        "vehicleNumber" TEXT,
        "vehicleCleanOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "cargoTemp" DOUBLE PRECISION,
        "hasLabCertificate" BOOLEAN NOT NULL DEFAULT TRUE,
        "organolepticScore" INTEGER DEFAULT 5,
        "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
        "rejectReason" TEXT,
        "responsible" TEXT NOT NULL,
        "inspectorId" INTEGER,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring ReceivingLog table:', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if ((prisma as any).receivingLog?.findMany) {
      try {
        const where: any = {}
        if (date) where.date = date
        const logs = await (prisma as any).receivingLog.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }]
        })
        return NextResponse.json(logs)
      } catch (err) {
        console.warn('Fallback to queryRaw for ReceivingLog:', err)
      }
    }

    const query = date
      ? `SELECT * FROM "ReceivingLog" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "ReceivingLog" ORDER BY "date" DESC, "id" DESC`
    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching receiving logs:', error)
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
      supplierName,
      productName,
      batchNumber,
      quantityKg,
      vehicleNumber,
      vehicleCleanOk = true,
      cargoTemp,
      hasLabCertificate = true,
      organolepticScore = 5,
      status = 'ACCEPTED',
      rejectReason,
      responsible = session?.name || 'Qabulxona Nazoratchisi',
      notes
    } = body

    if (!supplierName || !productName || !batchNumber || !quantityKg) {
      return NextResponse.json({ error: 'Ta\'minotchi, mahsulot, partiya va miqdorni kiriting' }, { status: 400 })
    }

    const docNumber = `RCV-${Date.now().toString().slice(-6)}`
    const qty = parseFloat(quantityKg)
    const cTemp = cargoTemp !== undefined && cargoTemp !== '' ? parseFloat(cargoTemp) : null
    const orgScore = parseInt(organolepticScore) || 5

    if ((prisma as any).receivingLog?.create) {
      try {
        const item = await (prisma as any).receivingLog.create({
          data: {
            docNumber,
            date,
            time,
            supplierName,
            productName,
            batchNumber,
            quantityKg: qty,
            vehicleNumber: vehicleNumber || null,
            vehicleCleanOk: Boolean(vehicleCleanOk),
            cargoTemp: cTemp,
            hasLabCertificate: Boolean(hasLabCertificate),
            organolepticScore: orgScore,
            status,
            rejectReason: rejectReason || null,
            responsible,
            inspectorId: session?.id || null,
            notes: notes || null
          }
        })
        return NextResponse.json(item, { status: 201 })
      } catch (err) {
        console.warn('Fallback to queryRaw insert for ReceivingLog:', err)
      }
    }

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "ReceivingLog" (
        "docNumber", "date", "time", "supplierName", "productName", "batchNumber",
        "quantityKg", "vehicleNumber", "vehicleCleanOk", "cargoTemp",
        "hasLabCertificate", "organolepticScore", "status", "rejectReason",
        "responsible", "inspectorId", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      ) RETURNING *;
    `, docNumber, date, time, supplierName, productName, batchNumber, qty, vehicleNumber || null, Boolean(vehicleCleanOk), cTemp, Boolean(hasLabCertificate), orgScore, status, rejectReason || null, responsible, session?.id || null, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating receiving log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "ReceivingLog" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

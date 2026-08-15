import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DegustationChecklist" (
        "id" SERIAL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "time" TEXT NOT NULL,
        "productType" TEXT NOT NULL,
        "batchNumber" TEXT NOT NULL,
        "colorOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "smellOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "crunchOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "tasteOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "foreignFlavorOk" BOOLEAN NOT NULL DEFAULT TRUE,
        "overallScore" INTEGER NOT NULL DEFAULT 5,
        "conclusion" TEXT NOT NULL DEFAULT 'Ruxsat berildi (Qabul)',
        "correctiveAction" TEXT,
        "responsible" TEXT NOT NULL,
        "inspectorId" INTEGER,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch (err) {
    console.error('Error ensuring DegustationChecklist table:', err)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    const query = date
      ? `SELECT * FROM "DegustationChecklist" WHERE "date" = '${date.replace(/'/g, "''")}' ORDER BY "date" DESC, "id" DESC`
      : `SELECT * FROM "DegustationChecklist" ORDER BY "date" DESC, "id" DESC`

    const logs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching degustation logs:', error)
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
      productType = 'Айсберг',
      batchNumber,
      colorOk = true,
      smellOk = true,
      crunchOk = true,
      tasteOk = true,
      foreignFlavorOk = true,
      overallScore = 5,
      conclusion = 'Ruxsat berildi (Qabul)',
      correctiveAction,
      responsible = session?.name || 'Sifat Nazoratchisi',
      notes
    } = body

    if (!batchNumber) {
      return NextResponse.json({ error: 'Partiya raqamini kiriting' }, { status: 400 })
    }

    const allOk = Boolean(colorOk) && Boolean(smellOk) && Boolean(crunchOk) && Boolean(tasteOk) && Boolean(foreignFlavorOk)
    const finalConclusion = !allOk ? (conclusion.includes('Brak') ? conclusion : 'Qayta tekshiruv / Shartli') : conclusion

    const inserted: any = await prisma.$queryRawUnsafe(`
      INSERT INTO "DegustationChecklist" (
        "date", "time", "productType", "batchNumber", "colorOk",
        "smellOk", "crunchOk", "tasteOk", "foreignFlavorOk",
        "overallScore", "conclusion", "correctiveAction",
        "responsible", "inspectorId", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
      ) RETURNING *;
    `, date, time, productType, batchNumber, Boolean(colorOk), Boolean(smellOk), Boolean(crunchOk), Boolean(tasteOk), Boolean(foreignFlavorOk), parseInt(overallScore) || 5, finalConclusion, correctiveAction || null, responsible, session?.id || null, notes || null)

    return NextResponse.json(inserted[0] || inserted, { status: 201 })
  } catch (error: any) {
    console.error('Error creating degustation log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "DegustationChecklist" WHERE "id" = $1`, parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 })
  }
}

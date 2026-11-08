import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/warehouse/temperature-logs
 * Returns incoming raw material arrivals from ShopArrival formatted for:
 * "ЖУРНАЛ ПРИЁМКИ ВХОДНОГО КОНТРОЛЯ СЫРЬЯ" (Xomashyo Kirish Nazorati va Qabul Harorati Jurnali)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const tempStatus = searchParams.get('tempStatus') || 'all' // 'all' | 'missing' | 'normal' | 'deviation'

    let sql = `SELECT * FROM "ShopArrival" WHERE 1=1`
    const params: any[] = []

    if (date) {
      params.push(date)
      sql += ` AND "date" = $${params.length}`
    } else if (month) {
      params.push(`${month}%`)
      sql += ` AND "date" LIKE $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      const pIdx = params.length
      sql += ` AND ("nomenclature" ILIKE $${pIdx} OR "supplier" ILIKE $${pIdx} OR "batch" ILIKE $${pIdx} OR "ttnNumber" ILIKE $${pIdx})`
    }

    sql += ` ORDER BY "date" DESC, "id" DESC`

    const rawArrivals: any[] = await prisma.$queryRawUnsafe(sql, ...params)

    // Compute stats across the selected period/dataset
    let missingTempCount = 0
    let normalCount = 0
    let deviationCount = 0

    for (const item of rawArrivals) {
      if (item.temperature === null || item.temperature === undefined) {
        missingTempCount++
      } else if (Number(item.temperature) >= 2.0 && Number(item.temperature) <= 5.0) {
        normalCount++
      } else {
        deviationCount++
      }
    }

    // Apply tempStatus filtering
    let arrivals = rawArrivals
    if (tempStatus === 'missing') {
      arrivals = rawArrivals.filter((a: any) => a.temperature === null || a.temperature === undefined)
    } else if (tempStatus === 'normal') {
      arrivals = rawArrivals.filter((a: any) => a.temperature !== null && a.temperature !== undefined && Number(a.temperature) >= 2.0 && Number(a.temperature) <= 5.0)
    } else if (tempStatus === 'deviation') {
      arrivals = rawArrivals.filter((a: any) => a.temperature !== null && a.temperature !== undefined && (Number(a.temperature) < 2.0 || Number(a.temperature) > 5.0))
    }

    // Find available distinct months from ShopArrival
    const monthRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT SUBSTRING("date" FROM 1 FOR 7) as "month"
      FROM "ShopArrival"
      WHERE "date" IS NOT NULL AND LENGTH("date") >= 7
      ORDER BY "month" DESC
      LIMIT 100
    `)
    const availableMonths = monthRows.map(r => r.month).filter(Boolean)

    return NextResponse.json({
      arrivals,
      stats: {
        totalCount: rawArrivals.length,
        missingTempCount,
        normalCount,
        deviationCount
      },
      availableMonths
    })
  } catch (error: any) {
    console.error('Error fetching arrivals for temperature-logs:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

/**
 * PATCH /api/warehouse/temperature-logs
 * Sifat Nazoratchisi / Inspector faqat harorat, organoleptika va sifat xulosasini kiritadi.
 * Omborchi ma'lumotlari (miqdor, ta'minotchi, xomashyo) tegilmaydi!
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const body = await request.json()
    const { id, temperature, organoleptic, finalDecision, technologistSign, warehouseSign } = body

    if (!id) {
      return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })
    }

    const existingRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "ShopArrival" WHERE "id" = $1`, parseInt(id))
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: 'Kirim yozuvi topilmadi' }, { status: 404 })
    }
    const existing = existingRows[0]

    const role = (session.role || '').toUpperCase()
    const isQC = role === 'QUALITY_CONTROL' || role === 'INSPECTOR'
    const isAdminOrDirector = role === 'ADMIN' || role === 'DIRECTOR'
    const isWarehouse = role === 'WAREHOUSE'

    let tempVal = existing.temperature
    if (temperature !== undefined) {
      if (temperature === '' || temperature === null) {
        tempVal = null
      } else {
        const parsed = parseFloat(temperature)
        if (isNaN(parsed)) {
          return NextResponse.json({ error: 'Harorat raqam bo\'lishi kerak' }, { status: 400 })
        }
        tempVal = parsed
      }
    }

    const organoVal = organoleptic !== undefined ? organoleptic : existing.organoleptic
    const decisionVal = finalDecision !== undefined ? finalDecision : (existing.finalDecision || 'Принято')
    const techSignVal = technologistSign !== undefined ? technologistSign : existing.technologistSign
    const qcSignVal = (isQC || isAdminOrDirector) ? (session.name || 'Sifat Nazoratchisi') : existing.qcSign
    const qcCheckedAtVal = (isQC || isAdminOrDirector) ? new Date() : existing.qcCheckedAt
    const whSignVal = (isWarehouse || isAdminOrDirector) && warehouseSign !== undefined ? warehouseSign : existing.warehouseSign

    const updatedRows: any[] = await prisma.$queryRawUnsafe(`
      UPDATE "ShopArrival"
      SET "temperature" = $1,
          "organoleptic" = $2,
          "finalDecision" = $3,
          "technologistSign" = $4,
          "qcSign" = $5,
          "qcCheckedAt" = $6,
          "warehouseSign" = $7,
          "updatedAt" = NOW()
      WHERE "id" = $8
      RETURNING *
    `, tempVal, organoVal, decisionVal, techSignVal, qcSignVal, qcCheckedAtVal, whSignVal, parseInt(id))

    return NextResponse.json(updatedRows[0] || {})
  } catch (error: any) {
    console.error('Error updating temperature log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

/**
 * POST /api/warehouse/temperature-logs
 * Yangi kirim va harorat yozuvi kiritish (Birgalikda qabul)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const body = await request.json()
    const {
      date,
      arrivalTime,
      nomenclature,
      quantity,
      invoiceQuantity,
      boxCount,
      supplier,
      ttnNumber,
      batch,
      temperature,
      organoleptic,
      finalDecision,
      warehouseSign,
      technologistSign,
      qcSign
    } = body

    if (!date || !nomenclature || quantity === undefined || quantity === '') {
      return NextResponse.json({ error: 'Sana, xomashyo nomi va miqdori kiritilishi shart' }, { status: 400 })
    }

    const role = (session.role || '').toUpperCase()
    const isQC = role === 'QUALITY_CONTROL' || role === 'INSPECTOR'
    const isWarehouse = role === 'WAREHOUSE'
    const isAdminOrDirector = role === 'ADMIN' || role === 'DIRECTOR'

    const tempVal = temperature !== undefined && temperature !== '' && temperature !== null ? parseFloat(temperature) : null
    const invQty = invoiceQuantity !== undefined && invoiceQuantity !== '' && invoiceQuantity !== null ? parseFloat(invoiceQuantity) : null
    const bCount = boxCount !== undefined && boxCount !== '' && boxCount !== null ? parseInt(boxCount) : null
    const arrTime = arrivalTime || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    const whSign = warehouseSign || (isWarehouse || isAdminOrDirector ? session.name : null)
    const qSign = qcSign || (isQC || (isAdminOrDirector && tempVal !== null) ? session.name : null)
    const qcTime = tempVal !== null ? new Date() : null

    const insertedRows: any[] = await prisma.$queryRawUnsafe(`
      INSERT INTO "ShopArrival" (
        "date", "arrivalTime", "nomenclature", "quantity", "invoiceQuantity", "boxCount",
        "supplier", "ttnNumber", "batch", "temperature", "organoleptic", "finalDecision",
        "warehouseSign", "technologistSign", "qcSign", "qcCheckedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
      ) RETURNING *
    `, date, arrTime, String(nomenclature).trim(), parseFloat(quantity), invQty, bCount,
       supplier ? String(supplier).trim() : null,
       ttnNumber ? String(ttnNumber).trim() : null,
       batch ? String(batch).trim() : null,
       tempVal,
       organoleptic ? String(organoleptic).trim() : null,
       finalDecision || 'Принято',
       whSign, technologistSign || null, qSign, qcTime
    )

    return NextResponse.json(insertedRows[0] || {}, { status: 201 })
  } catch (error: any) {
    console.error('Error creating arrival temperature log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

/**
 * PUT /api/warehouse/temperature-logs
 * To'liq tahrirlash (Sifat Nazoratchisi faqat o'ziga tegishli inputlarni yangilay oladi)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const body = await request.json()
    const id = parseInt(body.id)
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    const existingRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "ShopArrival" WHERE "id" = $1`, id)
    if (!existingRows || existingRows.length === 0) return NextResponse.json({ error: 'Yozuv topilmadi' }, { status: 404 })
    const existing = existingRows[0]

    const role = (session.role || '').toUpperCase()
    const isQC = role === 'QUALITY_CONTROL' || role === 'INSPECTOR'
    const isAdminOrDirector = role === 'ADMIN' || role === 'DIRECTOR'

    // QC maydonlari
    let tempVal = existing.temperature
    if (body.temperature !== undefined) {
      tempVal = body.temperature === '' || body.temperature === null ? null : parseFloat(body.temperature)
    }
    const organoVal = body.organoleptic !== undefined ? body.organoleptic : existing.organoleptic
    const decisionVal = body.finalDecision !== undefined ? body.finalDecision : existing.finalDecision
    const techSignVal = body.technologistSign !== undefined ? body.technologistSign : existing.technologistSign
    const qcSignVal = (isQC || isAdminOrDirector) ? (session.name || 'Sifat Nazoratchisi') : existing.qcSign
    const qcCheckedAtVal = (isQC || isAdminOrDirector) ? new Date() : existing.qcCheckedAt

    // Skladchi maydonlari (agar Sifat nazoratchisi bo'lsa, mavjud qiymat qoladi!)
    const dateVal = !isQC && body.date ? body.date : existing.date
    const arrTimeVal = !isQC && body.arrivalTime !== undefined ? body.arrivalTime : existing.arrivalTime
    const nomVal = !isQC && body.nomenclature ? body.nomenclature : existing.nomenclature
    const qtyVal = !isQC && body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity
    const invQtyVal = !isQC && body.invoiceQuantity !== undefined ? (body.invoiceQuantity ? parseFloat(body.invoiceQuantity) : null) : existing.invoiceQuantity
    const bCountVal = !isQC && body.boxCount !== undefined ? (body.boxCount ? parseInt(body.boxCount) : null) : existing.boxCount
    const suppVal = !isQC && body.supplier !== undefined ? body.supplier : existing.supplier
    const ttnVal = !isQC && body.ttnNumber !== undefined ? body.ttnNumber : existing.ttnNumber
    const batchVal = !isQC && body.batch !== undefined ? body.batch : existing.batch
    const whSignVal = !isQC && body.warehouseSign !== undefined ? body.warehouseSign : existing.warehouseSign

    const updatedRows: any[] = await prisma.$queryRawUnsafe(`
      UPDATE "ShopArrival"
      SET "date" = $1, "arrivalTime" = $2, "nomenclature" = $3, "quantity" = $4,
          "invoiceQuantity" = $5, "boxCount" = $6, "supplier" = $7, "ttnNumber" = $8,
          "batch" = $9, "temperature" = $10, "organoleptic" = $11, "finalDecision" = $12,
          "warehouseSign" = $13, "technologistSign" = $14, "qcSign" = $15, "qcCheckedAt" = $16,
          "updatedAt" = NOW()
      WHERE "id" = $17
      RETURNING *
    `, dateVal, arrTimeVal, nomVal, qtyVal, invQtyVal, bCountVal, suppVal, ttnVal,
       batchVal, tempVal, organoVal, decisionVal, whSignVal, techSignVal, qcSignVal, qcCheckedAtVal, id)

    return NextResponse.json(updatedRows[0] || {})
  } catch (error: any) {
    console.error('Error putting temperature log:', error)
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 })
  }
}

/**
 * DELETE /api/warehouse/temperature-logs
 * Faqat ADMIN va DIRECTOR o'chira oladi. Sifat nazoratchisi o'chira olmaydi!
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const role = (session.role || '').toUpperCase()
    if (role !== 'ADMIN' && role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Kirim yozuvini faqat Admin yoki Direktor o\'chira oladi' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 })

    await prisma.$queryRawUnsafe(`DELETE FROM "ShopArrival" WHERE "id" = $1`, parseInt(id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting arrival:', error)
    return NextResponse.json({ error: 'O\'chirishda xatolik yuz berdi' }, { status: 500 })
  }
}

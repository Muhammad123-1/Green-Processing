import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

async function ensureTableAndSeed() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RawMaterialMovementLog" (
        "id" SERIAL PRIMARY KEY,
        "orderNumber" INTEGER NOT NULL DEFAULT 1,
        "arrivalDate" TEXT NOT NULL,
        "deliveryTime" TEXT,
        "productName" TEXT NOT NULL,
        "supplierName" TEXT NOT NULL,
        "batchNumber" TEXT NOT NULL,
        "receivedWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "storageTemp810" DOUBLE PRECISION,
        "storageTemp1700" DOUBLE PRECISION,
        "issuedToProduction" TEXT,
        "issuedKg" DOUBLE PRECISION DEFAULT 0,
        "returnedFromProductionKg" DOUBLE PRECISION DEFAULT 0,
        "endOfDayBalanceKg" DOUBLE PRECISION DEFAULT 0,
        "responsiblePerson" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await prisma.$executeRawUnsafe(`ALTER TABLE "RawMaterialMovementLog" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`).catch(() => {})

    // Check count and seed if empty
    const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "RawMaterialMovementLog"`)
    const count = countRes?.[0]?.count || 0

    if (count === 0) {
      const sampleInitialRows = [
        {
          orderNumber: 1,
          arrivalDate: '2025-06-02',
          deliveryTime: '10:00',
          productName: 'САЛАТ АЙЗБЕРГ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '1',
          receivedWeightKg: 395.4,
          storageTemp810: 2.4,
          storageTemp1700: 1.5,
          issuedToProduction: 'Айзберг 1874.1',
          issuedKg: 1874.1,
          returnedFromProductionKg: 90.4,
          endOfDayBalanceKg: 803.4,
          responsiblePerson: 'Исаков М.',
          notes: 'Kirim va sexga uzatish'
        },
        {
          orderNumber: 2,
          arrivalDate: '2025-06-02',
          deliveryTime: '11:23',
          productName: 'ТОМАТ',
          supplierName: 'Zokir AND',
          batchNumber: '1',
          receivedWeightKg: 877.5,
          storageTemp810: 1.5,
          storageTemp1700: 1.7,
          issuedToProduction: 'Томат 1819.8',
          issuedKg: 1819.8,
          returnedFromProductionKg: 73.3,
          endOfDayBalanceKg: 2342,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 3,
          arrivalDate: '2025-06-03',
          deliveryTime: '12:10',
          productName: 'ТОМАТ',
          supplierName: 'Zokir AND',
          batchNumber: '2',
          receivedWeightKg: 1393.2,
          storageTemp810: 1.6,
          storageTemp1700: 1.9,
          issuedToProduction: 'Лук 117',
          issuedKg: 117,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 226.7,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 4,
          arrivalDate: '2025-06-03',
          deliveryTime: '15:00',
          productName: 'Каром',
          supplierName: 'Nazarov 22',
          batchNumber: '1',
          receivedWeightKg: 1041,
          storageTemp810: 1.2,
          storageTemp1700: 1.1,
          issuedToProduction: 'Каром 336.6',
          issuedKg: 336.6,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 1575.1,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 5,
          arrivalDate: '2025-06-04',
          deliveryTime: '11:00',
          productName: 'САЛАТ АЙЗБЕРГ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '2',
          receivedWeightKg: 1065.5,
          storageTemp810: 3.2,
          storageTemp1700: 2.9,
          issuedToProduction: 'сабзи 55.6',
          issuedKg: 55.6,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 268,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 6,
          arrivalDate: '2025-06-04',
          deliveryTime: '11:15',
          productName: 'ТОМАТ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '3',
          receivedWeightKg: 805.5,
          storageTemp810: 1.2,
          storageTemp1700: 1.6,
          issuedToProduction: 'лимон 7',
          issuedKg: 7,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 3.2,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 7,
          arrivalDate: '2025-06-04',
          deliveryTime: '14:15',
          productName: 'Лук',
          supplierName: 'MadinaBonu',
          batchNumber: '1',
          receivedWeightKg: 500,
          storageTemp810: 1.1,
          storageTemp1700: 1.5,
          issuedToProduction: 'Айзберг 423.4',
          issuedKg: 423.4,
          returnedFromProductionKg: 34.9,
          endOfDayBalanceKg: 1445.5,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 8,
          arrivalDate: '2025-06-04',
          deliveryTime: '16:00',
          productName: 'Сабзи',
          supplierName: 'MadinaBonu',
          batchNumber: '1',
          receivedWeightKg: 500,
          storageTemp810: 3.2,
          storageTemp1700: 2.5,
          issuedToProduction: 'Томат 385.8',
          issuedKg: 385.8,
          returnedFromProductionKg: 113.1,
          endOfDayBalanceKg: 2761.7,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 9,
          arrivalDate: '2025-06-05',
          deliveryTime: '11:00',
          productName: 'САЛАТ АЙЗБЕРГ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '3',
          receivedWeightKg: 616.2,
          storageTemp810: 1.1,
          storageTemp1700: 1.6,
          issuedToProduction: 'Лук 43.5',
          issuedKg: 43.5,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 683.2,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 10,
          arrivalDate: '2025-06-05',
          deliveryTime: '12:11',
          productName: 'САЛАТ АЙЗБЕРГ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '4',
          receivedWeightKg: 549,
          storageTemp810: 1.4,
          storageTemp1700: 1.8,
          issuedToProduction: 'Каром 103.8',
          issuedKg: 103.8,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 1471.3,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 11,
          arrivalDate: '2025-06-05',
          deliveryTime: '12:14',
          productName: 'ТОМАТ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '4',
          receivedWeightKg: 886.5,
          storageTemp810: 1.5,
          storageTemp1700: 1.3,
          issuedToProduction: 'сабзи 17.1',
          issuedKg: 17.1,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 750.9,
          responsiblePerson: 'Исаков М.',
          notes: ''
        },
        {
          orderNumber: 12,
          arrivalDate: '2025-06-07',
          deliveryTime: '08:45',
          productName: 'САЛАТ АЙЗБЕРГ',
          supplierName: 'КИБРАЙ БАРАКА',
          batchNumber: '5',
          receivedWeightKg: 560,
          storageTemp810: 1.2,
          storageTemp1700: 1.1,
          issuedToProduction: 'айзберг 1908',
          issuedKg: 1908,
          returnedFromProductionKg: 0,
          endOfDayBalanceKg: 702.7,
          responsiblePerson: 'Исаков М.',
          notes: ''
        }
      ]

      for (const row of sampleInitialRows) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "RawMaterialMovementLog" 
          ("orderNumber", "arrivalDate", "deliveryTime", "productName", "supplierName", "batchNumber", "receivedWeightKg", "storageTemp810", "storageTemp1700", "issuedToProduction", "issuedKg", "returnedFromProductionKg", "endOfDayBalanceKg", "responsiblePerson", "notes")
          VALUES (
            ${row.orderNumber},
            '${row.arrivalDate}',
            '${row.deliveryTime}',
            '${row.productName.replace(/'/g, "''")}',
            '${row.supplierName.replace(/'/g, "''")}',
            '${row.batchNumber}',
            ${row.receivedWeightKg},
            ${row.storageTemp810},
            ${row.storageTemp1700},
            '${row.issuedToProduction.replace(/'/g, "''")}',
            ${row.issuedKg},
            ${row.returnedFromProductionKg},
            ${row.endOfDayBalanceKg},
            '${row.responsiblePerson.replace(/'/g, "''")}',
            '${row.notes.replace(/'/g, "''")}'
          );
        `)
      }
    }
  } catch (err) {
    console.error('Error ensuring RawMaterialMovementLog table and seed:', err)
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTableAndSeed()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')?.trim()
    const search = searchParams.get('search')?.trim().toLowerCase()

    let query = `SELECT * FROM "RawMaterialMovementLog"`
    const conditions: string[] = []

    if (date) {
      conditions.push(`"arrivalDate" = '${date.replace(/'/g, "''")}'`)
    }
    if (search) {
      conditions.push(`(LOWER("productName") LIKE '%${search.replace(/'/g, "''")}%' OR LOWER("supplierName") LIKE '%${search.replace(/'/g, "''")}%' OR LOWER("batchNumber") LIKE '%${search.replace(/'/g, "''")}%')`)
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ')
    }

    query += ` ORDER BY "arrivalDate" DESC, "id" DESC`

    const logs: any = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching raw material movement logs:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableAndSeed()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orderNumber = 1,
      arrivalDate,
      deliveryTime = '09:00',
      productName,
      supplierName,
      batchNumber = '1',
      receivedWeightKg = 0,
      storageTemp810,
      storageTemp1700,
      issuedToProduction,
      issuedKg = 0,
      returnedFromProductionKg = 0,
      endOfDayBalanceKg,
      responsiblePerson,
      notes
    } = body

    if (!arrivalDate || !productName || !supplierName) {
      return NextResponse.json({ error: 'Sana, mahsulot nomi va ta\'minotchi kiritilishi shart' }, { status: 400 })
    }

    const rKg = parseFloat(receivedWeightKg) || 0
    const iKg = parseFloat(issuedKg) || (issuedToProduction ? parseFloat(issuedToProduction.replace(/[^\d.]/g, '')) || 0 : 0)
    const retKg = parseFloat(returnedFromProductionKg) || 0
    const balance = endOfDayBalanceKg !== undefined && endOfDayBalanceKg !== null && endOfDayBalanceKg !== ''
      ? parseFloat(endOfDayBalanceKg)
      : Math.max(0, rKg - iKg + retKg)

    const t810 = storageTemp810 !== undefined && storageTemp810 !== '' ? parseFloat(storageTemp810) : null
    const t1700 = storageTemp1700 !== undefined && storageTemp1700 !== '' ? parseFloat(storageTemp1700) : null
    const resp = (responsiblePerson?.trim() || session.name || 'Mas\'ul xodim')

    const insertQuery = `
      INSERT INTO "RawMaterialMovementLog" 
      ("orderNumber", "arrivalDate", "deliveryTime", "productName", "supplierName", "batchNumber", "receivedWeightKg", "storageTemp810", "storageTemp1700", "issuedToProduction", "issuedKg", "returnedFromProductionKg", "endOfDayBalanceKg", "responsiblePerson", "notes", "updatedAt")
      VALUES (
        ${parseInt(orderNumber) || 1},
        '${arrivalDate.replace(/'/g, "''")}',
        ${deliveryTime ? `'${deliveryTime.replace(/'/g, "''")}'` : 'NULL'},
        '${productName.replace(/'/g, "''")}',
        '${supplierName.replace(/'/g, "''")}',
        '${(batchNumber || '1').replace(/'/g, "''")}',
        ${rKg},
        ${t810 !== null ? t810 : 'NULL'},
        ${t1700 !== null ? t1700 : 'NULL'},
        ${issuedToProduction ? `'${issuedToProduction.replace(/'/g, "''")}'` : `'${productName} ${iKg}'`},
        ${iKg},
        ${retKg},
        ${balance},
        '${resp.replace(/'/g, "''")}',
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        NOW()
      )
      RETURNING *;
    `

    const result: any = await prisma.$queryRawUnsafe(insertQuery)
    return NextResponse.json(result?.[0] || { success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating raw material movement log:', error)
    return NextResponse.json({ error: error.message || 'Failed to create log' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTableAndSeed()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const body = await request.json()
    const { id, ...fields } = body

    const numId = parseInt(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 })

    const updates: string[] = []
    if (fields.arrivalDate) updates.push(`"arrivalDate" = '${fields.arrivalDate.replace(/'/g, "''")}'`)
    if (fields.deliveryTime !== undefined) updates.push(`"deliveryTime" = '${fields.deliveryTime ? fields.deliveryTime.replace(/'/g, "''") : ''}'`)
    if (fields.productName) updates.push(`"productName" = '${fields.productName.replace(/'/g, "''")}'`)
    if (fields.supplierName) updates.push(`"supplierName" = '${fields.supplierName.replace(/'/g, "''")}'`)
    if (fields.batchNumber) updates.push(`"batchNumber" = '${fields.batchNumber.replace(/'/g, "''")}'`)
    if (fields.receivedWeightKg !== undefined) updates.push(`"receivedWeightKg" = ${parseFloat(fields.receivedWeightKg) || 0}`)
    if (fields.storageTemp810 !== undefined) updates.push(`"storageTemp810" = ${fields.storageTemp810 !== '' && fields.storageTemp810 !== null ? parseFloat(fields.storageTemp810) : 'NULL'}`)
    if (fields.storageTemp1700 !== undefined) updates.push(`"storageTemp1700" = ${fields.storageTemp1700 !== '' && fields.storageTemp1700 !== null ? parseFloat(fields.storageTemp1700) : 'NULL'}`)
    if (fields.issuedToProduction !== undefined) updates.push(`"issuedToProduction" = '${fields.issuedToProduction ? fields.issuedToProduction.replace(/'/g, "''") : ''}'`)
    if (fields.issuedKg !== undefined) updates.push(`"issuedKg" = ${parseFloat(fields.issuedKg) || 0}`)
    if (fields.returnedFromProductionKg !== undefined) updates.push(`"returnedFromProductionKg" = ${parseFloat(fields.returnedFromProductionKg) || 0}`)
    if (fields.endOfDayBalanceKg !== undefined) updates.push(`"endOfDayBalanceKg" = ${parseFloat(fields.endOfDayBalanceKg) || 0}`)
    if (fields.responsiblePerson) updates.push(`"responsiblePerson" = '${fields.responsiblePerson.replace(/'/g, "''")}'`)
    if (fields.notes !== undefined) updates.push(`"notes" = '${fields.notes ? fields.notes.replace(/'/g, "''") : ''}'`)

    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`)

    if (updates.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE "RawMaterialMovementLog"
        SET ${updates.join(', ')}
        WHERE "id" = ${numId};
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating raw movement log:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTableAndSeed()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const numId = parseInt(id || '')
    if (isNaN(numId)) return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 })

    await prisma.$executeRawUnsafe(`DELETE FROM "RawMaterialMovementLog" WHERE "id" = ${numId};`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting raw movement log:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}

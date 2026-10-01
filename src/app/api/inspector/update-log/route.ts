import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/app/actions/auth'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { table, id, payload } = body

    if (!table || !id) {
      return NextResponse.json({ error: 'Table and ID are required' }, { status: 400 })
    }

    // Ensure valid table name to prevent SQL injection
    const allowedTables = ['FsscQcLog', 'DisinfectionLog', 'CalibrationLog', 'DegustationLog', 'ProcessQCLog', 'ReceivingLog']
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    const userName = session?.name || 'Sifat Nazoratchisi'

    // We can use Prisma raw query to update, it's simpler and bypasses generated client issues
    const setFields = []
    const values = []
    let i = 1
    
    // Add updatedBy
    payload.updatedBy = userName

    for (const [key, value] of Object.entries(payload)) {
      setFields.push(`"${key}" = $${i}`)
      values.push(value)
      i++
    }
    
    // updated_at
    setFields.push(`"updatedAt" = NOW()`)

    values.push(parseInt(id))
    
    const query = `UPDATE "${table}" SET ${setFields.join(', ')} WHERE "id" = $${i} RETURNING *`

    const updated = await prisma.$queryRawUnsafe(query, ...values)

    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    console.error('Update log error:', error)
    return NextResponse.json({ error: error.message || 'Xatolik' }, { status: 500 })
  }
}

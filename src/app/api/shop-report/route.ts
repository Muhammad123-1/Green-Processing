import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const arrivals = await prisma.shopArrival.findMany({ orderBy: { date: 'desc' } })
    const expenses = await prisma.shopExpense.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json({ arrivals, expenses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    if (body.arrivals && body.arrivals.length > 0) {
      await prisma.shopArrival.deleteMany()
      await prisma.shopArrival.createMany({
        data: body.arrivals.map((a: any) => ({
          date: a.date || '',
          nomenclature: a.nomenclature || '',
          quantity: Number(a.quantity) || 0,
          supplier: a.supplier || ''
        }))
      })
    }

    if (body.expenses && body.expenses.length > 0) {
      await prisma.shopExpense.deleteMany()
      const dataToInsert = body.expenses.map((exp: any) => ({
        date: exp.date,
        materials: exp.materials || {}
      }))
      await prisma.shopExpense.createMany({
        data: dataToInsert
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Shop report import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { key, minStock, productName } = body

    if (!key || minStock === undefined || minStock === null) {
      return NextResponse.json({ error: "Xomashyo kaliti va me'yor qiymati kiritilishi shart" }, { status: 400 })
    }

    const numericMinStock = Math.max(0, parseFloat(String(minStock)) || 0)

    // 1. Save to Setting table
    const settingKey = `stock_level_${key}`
    await prisma.setting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        value: String(numericMinStock),
        category: 'warehouse_stock_levels'
      },
      update: {
        value: String(numericMinStock)
      }
    })

    // 2. Also update matching Product records if any
    const searchTerms = [productName, key].filter(Boolean)
    for (const term of searchTerms) {
      await prisma.product.updateMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } }
          ]
        },
        data: {
          minStockLevel: numericMinStock
        }
      })
    }

    return NextResponse.json({
      success: true,
      key,
      minStock: numericMinStock,
      updatedBy: session.name
    })
  } catch (error: any) {
    console.error('Error updating stock level:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'stock_level_' } }
    })
    const map: Record<string, number> = {}
    settings.forEach((s) => {
      const k = s.key.replace('stock_level_', '')
      map[k] = parseFloat(s.value) || 0
    })
    return NextResponse.json({ stockLevels: map })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

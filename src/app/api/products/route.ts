import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        code: body.code || null,
        category: body.category || null,
        unit: body.unit || 'kg',
        imageUrl: body.imageUrl || null,
        defaultTemperature: body.defaultTemperature || null,
        minTemperature: body.minTemperature ? parseFloat(body.minTemperature) : null,
        maxTemperature: body.maxTemperature ? parseFloat(body.maxTemperature) : null,
        defaultPackaging: body.defaultPackaging || null,
        defaultConclusion: body.defaultConclusion || 'Muvofiq',
        storageCondition: body.storageCondition || null,
        shelfLife: body.shelfLife || null,
        gost: body.gost || null,
        description: body.description || null,
        type: body.type || 'RAW_MATERIAL',
        isActive: true,
      },
    })

    // If initial stock is entered from the product modal, create warehouse batch
    if (body.initialStock && parseFloat(body.initialStock) > 0) {
      const warehouse = await prisma.warehouse.findFirst()
      const warehouseId = warehouse?.id || 1
      const numStock = parseFloat(body.initialStock)

      let batchNum = body.initialBatchNumber?.trim()
      if (!batchNum) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const rand = Math.floor(1000 + Math.random() * 9000)
        batchNum = `B-${datePart}-${rand}`
      }

      await prisma.inventoryBatch.create({
        data: {
          productId: product.id,
          batchNumber: batchNum,
          warehouseId,
          quantity: numStock,
          qcStatus: 'APPROVED',
          arrivalPhotoUrl: body.imageUrl || null,
          expirationDate: body.initialExpirationDate ? new Date(body.initialExpirationDate) : null,
          transactions: {
            create: {
              transactionType: 'IN',
              quantity: numStock,
              referenceDocId: "Mahsulot yaratishda boshlang'ich qoldiq"
            }
          }
        }
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

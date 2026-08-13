import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all products with their approved batches
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        batches: {
          where: {
            qcStatus: 'APPROVED',
            quantity: { gt: 0 } // Faqat qoldig'i bor partiyalar
          },
          orderBy: {
            expirationDate: 'asc' // FEFO: muddatiga qarab o'sish tartibida
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate metrics and Svetofor status for each product
    const inventory = products.map(product => {
      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      
      let status = 'green'
      const minStock = product.minStockLevel || 0
      
      if (totalQuantity === 0) {
        status = 'red' // Agar omborda umuman qolmagan bo'lsa, qizil yonadi
      } else if (minStock > 0) {
        if (totalQuantity <= minStock) {
          status = 'red'
        } else if (totalQuantity <= minStock * 1.5) {
          status = 'yellow'
        }
      }

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        unit: product.unit,
        minStockLevel: minStock,
        totalQuantity,
        status, // 'red', 'yellow', 'green'
        batches: product.batches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          receivedAt: b.receivedAt,
          expirationDate: b.expirationDate
        }))
      }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

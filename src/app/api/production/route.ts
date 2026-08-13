import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { recipeId, plannedOutput } = body

    if (!recipeId || !plannedOutput || parseFloat(plannedOutput) <= 0) {
      return NextResponse.json({ error: 'Noto\'g\'ri ma\'lumotlar' }, { status: 400 })
    }

    const outputQty = parseFloat(plannedOutput)

    // 1. Fetch recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(recipeId) },
      include: { ingredients: true }
    })

    if (!recipe) return NextResponse.json({ error: 'Retsept topilmadi' }, { status: 404 })

    // 2. Calculate required ingredient quantities based on output ratio
    const ratio = outputQty / recipe.baseYieldQty
    
    // We will do this inside a transaction to ensure atomic deducts
    const result = await prisma.$transaction(async (tx) => {
      
      // Step A: Check and deduct inventory for each ingredient (FEFO)
      for (const ingredient of recipe.ingredients) {
        const requiredQty = ingredient.requiredQty * ratio
        let remainingToDeduct = requiredQty

        // Find available approved batches for this ingredient, ordered by expirationDate ASC (FEFO)
        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: ingredient.inputProductId,
            qcStatus: 'APPROVED',
            quantity: { gt: 0 }
          },
          orderBy: {
            expirationDate: 'asc'
          }
        })

        // Check total available
        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0)
        if (totalAvailable < requiredQty) {
          throw new Error(`Yetarli xomashyo yo'q: Mahsulot ID=${ingredient.inputProductId}. Talab: ${requiredQty}, Ombor: ${totalAvailable}`)
        }

        // Deduct from batches
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break

          const deductAmt = Math.min(batch.quantity, remainingToDeduct)
          
          // Update batch
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              quantity: { decrement: deductAmt }
            }
          })

          // Record transaction
          await tx.inventoryTransaction.create({
            data: {
              batchId: batch.id,
              transactionType: 'OUT',
              quantity: deductAmt,
              userId: session.id,
              referenceDocId: `RECIPE-${recipe.id}`
            }
          })

          remainingToDeduct -= deductAmt
        }
      }

      // Step B: Create Production Order record
      const order = await tx.productionOrder.create({
        data: {
          recipeId: recipe.id,
          plannedOutput: outputQty,
          status: 'COMPLETED',
          startedAt: new Date(),
          endedAt: new Date()
        }
      })

      // Step C: (Optional) Add the finished product to the warehouse
      // Usually, Kitchen creates the finished product, which goes back to Warehouse (FINISHED goods)
      await tx.inventoryBatch.create({
        data: {
          productId: recipe.outputProductId,
          batchNumber: `PROD-${order.id}-${new Date().getTime()}`,
          quantity: outputQty,
          qcStatus: 'APPROVED'
        }
      })

      return order
    })

    // Log action
    await prisma.log.create({
      data: {
        action: 'EXECUTE_PRODUCTION',
        entity: 'ProductionOrder',
        entityId: result.id,
        details: `Ishlab chiqarish yakunlandi. Retsept ID: ${recipe.id}, Miqdor: ${outputQty}`,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error executing production:', error)
    return NextResponse.json({ error: error.message || 'Ishlab chiqarishda xatolik' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orders = await prisma.productionOrder.findMany({
      include: {
        recipe: {
          include: {
            outputProduct: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching production orders:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

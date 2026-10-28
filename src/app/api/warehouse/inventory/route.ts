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
          include: {
            zone: true,
            supplier: { select: { id: true, name: true } }
          },
          orderBy: [
            { expirationDate: 'asc' },
            { receivedAt: 'asc' },
            { id: 'asc' }
          ]
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
        imageUrl: product.imageUrl,
        minStockLevel: minStock,
        totalQuantity,
        status, // 'red', 'yellow', 'green'
        batches: product.batches.map((b, idx) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          receivedAt: b.receivedAt,
          expirationDate: b.expirationDate,
          fefoOrder: idx + 1,
          isFefoActive: idx === 0,
          daysUntilExpiry: b.expirationDate
            ? Math.ceil((new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null,
          arrivalPhotoUrl: b.arrivalPhotoUrl,
          arrivalTemperature: b.arrivalTemperature,
          supplierBatchNumber: b.supplierBatchNumber,
          cost: b.cost,
          zoneId: b.zoneId,
          zone: b.zone ? { id: b.zone.id, name: b.zone.name } : null,
          supplier: b.supplier ? { id: b.supplier.id, name: b.supplier.name } : null
        }))
      }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      productId,
      newProductName,
      category = 'Xomashyo',
      unit = 'kg',
      batchNumber,
      quantity,
      cost,
      receivedAt,
      expirationDate,
      zoneId,
      supplierId,
      supplierBatchNumber,
      arrivalPhotoUrl,
      arrivalTemperature,
      notes
    } = body

    if (!quantity || parseFloat(quantity) <= 0) {
      return NextResponse.json({ error: 'Kiritilgan miqdor 0 dan katta bo\'lishi shart' }, { status: 400 })
    }

    let targetProductId = productId ? parseInt(productId, 10) : null

    // If warehouse user types a new product name that doesn't exist yet
    if (!targetProductId && newProductName?.trim()) {
      let existing = await prisma.product.findFirst({
        where: { name: { equals: newProductName.trim(), mode: 'insensitive' } }
      })
      if (!existing) {
        existing = await prisma.product.create({
          data: {
            name: newProductName.trim(),
            category: category?.trim() || 'Xomashyo',
            unit: unit || 'kg',
            type: 'RAW_MATERIAL',
            imageUrl: arrivalPhotoUrl || null,
            isActive: true
          }
        })
      }
      targetProductId = existing.id
    }

    if (!targetProductId) {
      return NextResponse.json({ error: 'Mahsulot tanlanishi yoki yangi mahsulot nomi kiritilishi shart' }, { status: 400 })
    }

    // Auto-generate batch number if empty
    let finalBatchNumber = batchNumber?.trim()
    if (!finalBatchNumber) {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randPart = Math.floor(1000 + Math.random() * 9000)
      finalBatchNumber = `B-${datePart}-${randPart}`
    }

    // Check if batch number already exists
    const existingBatch = await prisma.inventoryBatch.findUnique({
      where: { batchNumber: finalBatchNumber }
    })
    if (existingBatch) {
      finalBatchNumber = `${finalBatchNumber}-${Math.floor(100 + Math.random() * 900)}`
    }

    // Get default warehouse (id = 1)
    const warehouse = await prisma.warehouse.findFirst()
    const warehouseId = warehouse?.id || 1

    const numQuantity = parseFloat(quantity)
    const numCost = cost ? parseFloat(cost) : null
    const numTemp = arrivalTemperature ? parseFloat(arrivalTemperature) : null

    // Create the batch in WMS
    const batch = await prisma.inventoryBatch.create({
      data: {
        productId: targetProductId,
        batchNumber: finalBatchNumber,
        warehouseId,
        zoneId: zoneId ? parseInt(zoneId, 10) : null,
        quantity: numQuantity,
        cost: numCost,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        qcStatus: 'APPROVED', // Direct WMS intake is accepted
        supplierId: supplierId ? parseInt(supplierId, 10) : null,
        supplierBatchNumber: supplierBatchNumber?.trim() || null,
        arrivalPhotoUrl: arrivalPhotoUrl?.trim() || null,
        arrivalTemperature: numTemp,
        transactions: {
          create: {
            transactionType: 'IN',
            quantity: numQuantity,
            referenceDocId: notes?.trim() || `Omborga kirim: ${session.name || 'Skladchi'}`,
            userId: session.id
          }
        }
      },
      include: {
        product: true,
        zone: true
      }
    })

    // Log the event
    await prisma.log.create({
      data: {
        action: 'DIRECT_WAREHOUSE_RECEIPT',
        entity: 'InventoryBatch',
        entityId: batch.id,
        details: `Skladchi ${session.name || 'Foydalanuvchi'} tomonidan omborga yangi partiya kirim qilindi: ${batch.product.name} (${numQuantity} ${batch.product.unit}), Partiya: #${finalBatchNumber}`
      }
    })

    return NextResponse.json({ success: true, batch }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating inventory batch:', error)
    return NextResponse.json({ error: error.message || 'Kirim qilishda xatolik yuz berdi' }, { status: 500 })
  }
}

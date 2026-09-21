import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // 1. Partiyalarni qidirish
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        OR: [
          { batchNumber: { contains: query, mode: 'insensitive' } },
          { supplierBatchNumber: { contains: query, mode: 'insensitive' } },
          { product: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        product: true
      },
      take: 10
    });

    // 2. Ishlab chiqarish buyruqlarini qidirish
    const productionOrders = await prisma.productionOrder.findMany({
      where: {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { finishedBatchCode: { contains: query, mode: 'insensitive' } },
          { recipe: { outputProduct: { name: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        recipe: { include: { outputProduct: true } }
      },
      take: 10
    });

    // 3. Sifat nazorati aktlarini qidirish (Inspections)
    const inspections = await prisma.inspection.findMany({
      where: {
        OR: [
          { actNumber: { contains: query, mode: 'insensitive' } },
          { batchNumber: { contains: query, mode: 'insensitive' } },
          { product: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        product: true,
        supplier: true
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      results: {
        batches: batches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          productName: b.product.name,
          receivedAt: b.receivedAt,
          type: 'BATCH'
        })),
        productionOrders: productionOrders.map(p => ({
          id: p.id,
          orderNumber: p.orderNumber,
          productName: p.recipe.outputProduct.name,
          finishedBatchCode: p.finishedBatchCode,
          startedAt: p.startedAt,
          type: 'PRODUCTION_ORDER'
        })),
        inspections: inspections.map(i => ({
          id: i.id,
          actNumber: i.actNumber,
          batchNumber: i.batchNumber,
          productName: i.product.name,
          supplierName: i.supplier.name,
          date: i.inspectionDate,
          type: 'INSPECTION'
        }))
      }
    });
  } catch (error: any) {
    console.error('Global Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

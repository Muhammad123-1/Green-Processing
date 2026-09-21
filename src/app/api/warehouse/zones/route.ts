import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const zones = await prisma.warehouseZone.findMany({
      include: { warehouse: true }
    });
    return NextResponse.json(zones);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { batchId, zoneId } = await request.json();
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const batch = await prisma.inventoryBatch.update({
      where: { id: Number(batchId) },
      data: { zoneId: zoneId ? Number(zoneId) : null }
    });

    return NextResponse.json({ success: true, batch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

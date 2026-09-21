import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const { batchId } = await request.json();

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: Number(batchId) },
      include: {
        product: true
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // QR kod uchun ma'lumot (JSON string)
    const qrDataObj = {
      lot: batch.batchNumber,
      prod: batch.product.name,
      sup: batch.supplierBatchNumber || '-',
      date: batch.receivedAt.toISOString().split('T')[0],
      exp: batch.expirationDate ? batch.expirationDate.toISOString().split('T')[0] : '-'
    };
    
    // Matnli formatda o'qish qulayroq bo'lishi mumkin yoki to'g'ridan-to'g'ri tizim url'si
    // Hozirgi holatda batch ni qidirish oson bo'lishi uchun URL qaytaramiz:
    const urlString = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/traceability?q=${batch.batchNumber}`;

    // Yoki aynan shu ma'lumotlarni json string sifatida
    const qrString = JSON.stringify(qrDataObj);

    // Ikkalasini birlashtiramiz (text sifatida ko'rsatish)
    const qrText = `LOT:${batch.batchNumber}\nPROD:${batch.product.name}\nEXP:${qrDataObj.exp}\nURL:${urlString}`;

    const qrDataUrl = await QRCode.toDataURL(qrText, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return NextResponse.json({
      success: true,
      qrDataUrl,
      printData: qrDataObj
    });
  } catch (error: any) {
    console.error('QR Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

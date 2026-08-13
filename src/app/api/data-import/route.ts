import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', '123.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    const productsSet = new Set<string>();
    
    worksheet.eachRow((row) => {
      const vals = row.values as any[];
      if (vals && vals.length >= 3) {
        const val = vals[2]; // JS exceljs returns 1-based array sometimes? Wait, let's just check all string columns
        vals.forEach(v => {
          if (typeof v === 'string' && v.trim().length > 1) {
            const clean = v.trim();
            if (clean !== 'Количество' && clean !== 'КУХНЯ' && clean !== 'АКТ') {
              productsSet.add(clean);
            }
          }
        });
      }
    });

    const products = Array.from(productsSet);
    
    // Save to DB
    const saved = [];
    for (const name of products) {
      // check if exists
      const existing = await prisma.product.findFirst({ where: { name } });
      if (!existing) {
        const p = await prisma.product.create({
          data: {
            name,
            type: 'RAW_MATERIAL',
            unit: 'kg', // default
            category: 'Qishloq xojaligi',
            minStockLevel: 50 // default
          }
        });
        saved.push(p);
      }
    }

    return NextResponse.json({ totalExtracted: products.length, newlySaved: saved.length, products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

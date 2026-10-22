const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');

const prisma = new PrismaClient();

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 3) {
        let [d, m, y] = parts;
        d = d.padStart(2, '0');
        m = m.padStart(2, '0');
        if (d === '00') d = '01';
        if (y.length === 4) return `${y}-${m}-${d}`;
      }
    }
    return s;
  }
  return String(val);
}

function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function main() {
  const filePath = path.join(__dirname, '..', 'templates', 'ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  console.log('Seeding Chemical Acts (ХИМИЧЕСКИ: Уксусная кислота, Сорбат калия, Бензоат натрия)...');

  const ws = wb.getWorksheet('ХИМИЧЕСКИ');
  if (!ws) {
    console.error('Sheet ХИМИЧЕСКИ not found');
    return;
  }

  let count = 0;
  for (let r = 10; r <= 21; r++) {
    const row = ws.getRow(r);
    const orderVal = row.getCell(1).value;
    const arrivalDate = formatDate(row.getCell(2).value);
    const substanceName = row.getCell(3).text?.trim() || (row.getCell(3).value ? String(row.getCell(3).value).trim() : '');
    const productType = row.getCell(4).text?.trim() || '';
    const supplierName = row.getCell(5).text?.trim() || '';
    const batchNumber = row.getCell(6).text?.trim() || (row.getCell(6).value ? String(row.getCell(6).value).trim() : '');
    const accompanyingDoc = row.getCell(7).text?.trim() || '';
    const activeChlorine = parseNumber(row.getCell(8).value);
    const quantityReceived = parseNumber(row.getCell(9).value);
    const manufactureDate = formatDate(row.getCell(10).value);
    const expiryDate = formatDate(row.getCell(11).value);
    const transportCondition = row.getCell(12).text?.trim() || 'удовлетворительно';
    const accessPermit = row.getCell(13).text?.trim() || 'допущено';
    const releasedKg = parseNumber(row.getCell(14).value);
    const releasedDate = formatDate(row.getCell(15).value);
    const inspectorName = row.getCell(16).text?.trim() || 'Камбарова А.М.';
    const pricePerKg = parseNumber(row.getCell(17).value);

    if (substanceName && (arrivalDate || quantityReceived)) {
      await prisma.disinfectionIncomingAct.create({
        data: {
          orderNumber: parseNumber(orderVal) || (r - 9),
          arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
          substanceName,
          productType: productType || null,
          supplierName: supplierName || null,
          batchNumber: batchNumber || null,
          accompanyingDoc: accompanyingDoc || null,
          activeChlorinePercent: activeChlorine,
          quantityReceived: quantityReceived || null,
          unit: 'кг',
          manufactureDate: manufactureDate || null,
          expiryDate: expiryDate || null,
          transportCondition,
          accessPermit,
          releasedKg: releasedKg || null,
          releasedDate: releasedDate || null,
          inspectorName: inspectorName || 'Камбарова А.М.',
          pricePerKg: pricePerKg || null,
          category: 'XIMIYA',
          notes: 'ХИМИЧЕСКИ: Кислота / Консервант'
        }
      });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} chemical acts into DisinfectionIncomingAct!`);
}

main()
  .catch((e) => {
    console.error('Error seeding chemical acts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

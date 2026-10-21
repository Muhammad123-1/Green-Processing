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
    return val.trim();
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

  console.log('Seeding Disinfection & Detergents receiving acts...');

  // 1. Sheet: ДЕЗСРЕДСТВА И МОЮЩИЕ
  const ws1 = wb.getWorksheet(' ДЕЗСРЕДСТВА И МОЮЩИЕ');
  let count1 = 0;
  if (ws1) {
    const rows = [];
    ws1.eachRow((row, rowNumber) => {
      if (rowNumber >= 10) {
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
          rows.push({
            orderNumber: parseNumber(orderVal) || (rows.length + 1),
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
            inspectorName: inspectorName || null,
            pricePerKg: pricePerKg || null,
            category: 'DEZ'
          });
        }
      }
    });

    for (const r of rows) {
      await prisma.disinfectionIncomingAct.create({ data: r });
      count1++;
    }
  }

  // 2. Sheet: Моющие
  const ws2 = wb.getWorksheet('Моющие');
  let count2 = 0;
  if (ws2) {
    const rows = [];
    ws2.eachRow((row, rowNumber) => {
      if (rowNumber >= 10) {
        const orderVal = row.getCell(1).value;
        const arrivalDate = formatDate(row.getCell(2).value);
        const substanceName = row.getCell(3).text?.trim() || (row.getCell(3).value ? String(row.getCell(3).value).trim() : '');
        const productType = row.getCell(4).text?.trim() || '';
        const supplierName = row.getCell(5).text?.trim() || '';
        const batchNumber = row.getCell(6).text?.trim() || (row.getCell(6).value ? String(row.getCell(6).value).trim() : '');
        const registrationCert = row.getCell(7).text?.trim() || '';
        const conformityDeclaration = row.getCell(8).text?.trim() || '';
        const quantityReceived = parseNumber(row.getCell(9).value);
        const manufactureDate = formatDate(row.getCell(10).value);
        const expiryDate = formatDate(row.getCell(11).value);
        const transportCondition = row.getCell(12).text?.trim() || 'удовлетворительно';
        const accessPermit = row.getCell(13).text?.trim() || 'допущено';
        const releasedKg = parseNumber(row.getCell(14).value);
        const releasedDate = formatDate(row.getCell(15).value);
        const inspectorName = row.getCell(16).text?.trim() || '';

        if (substanceName && (arrivalDate || quantityReceived || supplierName)) {
          rows.push({
            orderNumber: parseNumber(orderVal) || (rows.length + 1),
            arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
            substanceName,
            productType: productType || null,
            supplierName: supplierName || null,
            batchNumber: batchNumber || null,
            registrationCert: registrationCert || null,
            conformityDeclaration: conformityDeclaration || null,
            quantityReceived: quantityReceived || null,
            unit: 'кг',
            manufactureDate: manufactureDate || null,
            expiryDate: expiryDate || null,
            transportCondition,
            accessPermit,
            releasedKg: releasedKg || null,
            releasedDate: releasedDate || null,
            inspectorName: inspectorName || null,
            category: 'MOYUSHIE'
          });
        }
      }
    });

    for (const r of rows) {
      await prisma.disinfectionIncomingAct.create({ data: r });
      count2++;
    }
  }

  console.log(`Successfully seeded: ${count1} dezsredstva acts and ${count2} moyushie acts! Total: ${count1 + count2}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

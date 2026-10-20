const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_TAG = '[DEMO_DATA]';

async function seedDemoData() {
  console.log('🚀 Seeding rich demo data for Director Dashboard...');

  // 1. Get or create users
  const userAdmin = await prisma.user.findFirst({ where: { username: 'admin' } });
  const userQC = await prisma.user.findFirst({ where: { username: 'quality' } });
  const userInspector = await prisma.user.findFirst({ where: { username: 'inspector' } });
  const userWarehouse = await prisma.user.findFirst({ where: { username: 'warehouse' } });
  const userProduction = await prisma.user.findFirst({ where: { username: 'production' } });
  const userSupply = await prisma.user.findFirst({ where: { username: 'supply' } });

  // 2. Warehouses & Zones
  let whRaw = await prisma.warehouse.findFirst({ where: { name: 'Asosiy Xomashyo Ombori №1' } });
  if (!whRaw) {
    whRaw = await prisma.warehouse.create({
      data: {
        name: 'Asosiy Xomashyo Ombori №1',
        type: 'RAW',
        zones: {
          create: [
            { name: 'A-1 (Meva va Rezavorlar zonasi)' },
            { name: 'A-2 (Sabzavotlar zonasi)' },
          ],
        },
      },
      include: { zones: true },
    });
  }

  let whCold = await prisma.warehouse.findFirst({ where: { name: 'IQF Shok-Muzlatkich Kameralari (-18°C)' } });
  if (!whCold) {
    whCold = await prisma.warehouse.create({
      data: {
        name: 'IQF Shok-Muzlatkich Kameralari (-18°C)',
        type: 'COLD',
        zones: {
          create: [
            { name: 'B-1 Muzlatilgan tayyor mahsulot' },
          ],
        },
      },
      include: { zones: true },
    });
  }

  // 3. Suppliers
  let suppliers = await prisma.supplier.findMany();
  if (suppliers.length === 0) {
    suppliers = [
      await prisma.supplier.create({ data: { name: 'OOO "AgroExport Qibray"', category: 'PRODUCTION' } }),
      await prisma.supplier.create({ data: { name: 'OOO "Fargona Boglari"', category: 'PRODUCTION' } }),
      await prisma.supplier.create({ data: { name: 'Samarqand Meva-Sabzavot MCHJ', category: 'PRODUCTION' } }),
    ];
  }

  // 4. Customers
  let custEvos = await prisma.customer.findFirst({ where: { name: 'EVOS Fast Food Chain' } });
  if (!custEvos) {
    custEvos = await prisma.customer.create({
      data: {
        name: 'EVOS Fast Food Chain',
        phone: '+998901234567',
        companyName: 'OOO EVOS Delivery',
      },
    });
  }

  let custKorzinka = await prisma.customer.findFirst({ where: { name: 'Korzinka Supermarketlar Tarmog\'i' } });
  if (!custKorzinka) {
    custKorzinka = await prisma.customer.create({
      data: {
        name: 'Korzinka Supermarketlar Tarmog\'i',
        phone: '+998912345678',
        companyName: 'FE Anglesey Food',
      },
    });
  }

  // 5. Products (Green Processing fruit/veg products)
  const productDefs = [
    { code: 'PRD-LMN', name: 'Limon (saralangan)', unit: 'kg', minStockLevel: 500, category: 'Meva', stock: 1200 }, // SUFFICIENT
    { code: 'PRD-OLCH', name: 'Olcha IQF (muzlatilgan)', unit: 'kg', minStockLevel: 800, category: 'Rezavor', stock: 2400 }, // SUFFICIENT
    { code: 'PRD-QLP', name: 'Qulupnay IQF shok-muzlatilgan', unit: 'kg', minStockLevel: 1000, category: 'Rezavor', stock: 1500 }, // SUFFICIENT
    { code: 'PRD-PMD', name: 'Pomidor (saralangan)', unit: 'kg', minStockLevel: 600, category: 'Sabzavot', stock: 180 }, // LOW
    { code: 'PRD-AYS', name: 'Aysberg salat bargi', unit: 'kg', minStockLevel: 450, category: 'Sabzavot', stock: 95 }, // LOW
    { code: 'PRD-QLP-QZ', name: 'Qalampir (qizil, saralangan)', unit: 'kg', minStockLevel: 300, category: 'Sabzavot', stock: 0 }, // OUT_OF_STOCK
    { code: 'PRD-SBZ', name: 'Sabzi (saralangan tozalangan)', unit: 'kg', minStockLevel: 400, category: 'Sabzavot', stock: 0 }, // OUT_OF_STOCK
    { code: 'PRD-OLM', name: 'Olma (Semerenko eksport)', unit: 'kg', minStockLevel: 1000, category: 'Meva', stock: 3200 }, // SUFFICIENT
  ];

  const createdProducts = [];
  for (const p of productDefs) {
    let prod = await prisma.product.findFirst({ where: { name: p.name } });
    if (!prod) {
      prod = await prisma.product.create({
        data: {
          code: p.code,
          name: p.name,
          unit: p.unit,
          category: p.category,
          minStockLevel: p.minStockLevel,
          description: `${DEMO_TAG} Demo mahsulot`,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: prod.id },
        data: { minStockLevel: p.minStockLevel },
      });
    }
    createdProducts.push({ ...prod, targetStock: p.stock });
  }

  // 6. Batches for stock traffic light
  console.log('📦 Creating inventory batches...');
  for (const prod of createdProducts) {
    // Check if batch already exists
    const existing = await prisma.inventoryBatch.findFirst({
      where: { productId: prod.id, batchNumber: { startsWith: 'DEMO-BATCH-' } },
    });
    if (!existing && prod.targetStock > 0) {
      await prisma.inventoryBatch.create({
        data: {
          productId: prod.id,
          batchNumber: `DEMO-BATCH-${prod.code}-${Date.now().toString().slice(-4)}`,
          quantity: prod.targetStock,
          cost: 15000,
          qcStatus: 'APPROVED',
          warehouseId: whRaw.id,
          supplierBatchNumber: `SUP-${Math.floor(Math.random() * 9000 + 1000)}`,
        },
      });
    }
  }

  // 7. Inspections (Arrival acts for past 14 days)
  console.log('🚛 Creating Raw Material Arrival Inspections...');
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const actDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = actDate.toISOString().slice(0, 10);
    const actNum = `DEMO-AKT-2026-${String(100 + i).padStart(4, '0')}`;

    const exists = await prisma.inspection.findUnique({ where: { actNumber: actNum } });
    if (!exists) {
      const pIdx = i % createdProducts.length;
      const sIdx = i % suppliers.length;
      const isRejected = i === 4; // 1 deliberate rejected act for testing
      const qty = Math.floor(Math.random() * 2500 + 1500);

      await prisma.inspection.create({
        data: {
          actNumber: actNum,
          inspectionDate: actDate,
          createdAt: actDate,
          supplierId: suppliers[sIdx].id,
          productId: createdProducts[pIdx].id,
          batchNumber: `PARTIYA-${dateStr}-${i + 1}`,
          quantity: qty,
          quantityUnit: 'kg',
          temperature: isRejected ? 14.5 : 3.8,
          packaging: 'Standart plastik yashik',
          color: isRejected ? 'Qoraygan, notekis' : 'Tabiiy yorqin',
          smell: isRejected ? 'Buzuq nordon hid' : 'Xos yangi meva hidi',
          appearance: isRejected ? 'Chirigan mevalar 18%' : 'Toza, saralangan 100%',
          conclusion: isRejected ? 'Nomuvofiq - Rad etildi' : 'Muvofiq - Qabul qilindi',
          status: isRejected ? 'REJECTED' : 'ACCEPTED',
          rating: isRejected ? 2 : 5,
          inspector: userQC ? userQC.name : 'Sifat Nazorati (QC)',
          inspectorId: userQC ? userQC.id : null,
          vehicleNumber: `01 ${Math.floor(Math.random() * 900 + 100)} AAA`,
          invoiceNumber: `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
          notes: `${DEMO_TAG} Zavodga kirgan xomashyo tekshiruv akti`,
        },
      });
    }
  }

  // 8. Daily QC Checklists (Shift 1 and Shift 2 for past 14 days)
  console.log('📋 Creating Daily QC Checklists...');
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);

    // Shift 1
    const shift1Num = `CHK-${dateStr}-1`;
    const chk1Exists = await prisma.dailyQCChecklist.findFirst({
      where: { date: dateStr, shift: '1', batchNumber: shift1Num },
    });
    if (!chk1Exists) {
      const outputBoxes = Math.floor(Math.random() * 25 + 40); // 40 - 65 boxes
      const rejectKg = Math.floor(Math.random() * 8 + 6); // 6 - 14 kg
      await prisma.dailyQCChecklist.create({
        data: {
          date: dateStr,
          shift: '1',
          lineName: '1-Liniya: IQF Tez Muzlatish va Qadoqlash',
          batchNumber: shift1Num,
          totalOutputBox: outputBoxes,
          rejectedKg: rejectKg,
          supervisor: userProduction ? userProduction.name : 'Sex Ustasi',
          inspector: userInspector ? userInspector.name : 'Sex Nazoratchisi',
          inspectorId: userInspector ? userInspector.id : null,
          status: 'COMPLETED',
          formData: JSON.stringify({ notes: `${DEMO_TAG} 1-smena tekshiruvi` }),
          createdAt: d,
        },
      });
    }

    // Shift 2
    const shift2Num = `CHK-${dateStr}-2`;
    const chk2Exists = await prisma.dailyQCChecklist.findFirst({
      where: { date: dateStr, shift: '2', batchNumber: shift2Num },
    });
    if (!chk2Exists) {
      const outputBoxes = Math.floor(Math.random() * 20 + 30); // 30 - 50 boxes
      const rejectKg = Math.floor(Math.random() * 10 + 8); // 8 - 18 kg
      await prisma.dailyQCChecklist.create({
        data: {
          date: dateStr,
          shift: '2',
          lineName: '2-Liniya: Saralash va Qadoqlash',
          batchNumber: shift2Num,
          totalOutputBox: outputBoxes,
          rejectedKg: rejectKg,
          supervisor: userProduction ? userProduction.name : 'Sex Ustasi',
          inspector: userInspector ? userInspector.name : 'Sex Nazoratchisi',
          inspectorId: userInspector ? userInspector.id : null,
          status: 'COMPLETED',
          formData: JSON.stringify({ notes: `${DEMO_TAG} 2-smena tekshiruvi` }),
          createdAt: d,
        },
      });
    }
  }

  // 9. Stock Transfers (including 1 discrepancy alert anomaly)
  console.log('🔄 Creating Stock Transfers...');
  for (let i = 8; i >= 0; i--) {
    const trDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const trNum = `DEMO-TR-2026-${String(200 + i).padStart(4, '0')}`;
    const trExists = await prisma.stockTransfer.findUnique({ where: { transferNumber: trNum } });

    if (!trExists) {
      const p = createdProducts[i % createdProducts.length];
      const isDiscrepancy = i === 2; // Deliberate discrepancy (kamomad)
      const issuedQty = isDiscrepancy ? 800 : Math.floor(Math.random() * 300 + 200);
      const receivedQty = isDiscrepancy ? 745 : issuedQty; // 55 kg kamomad (6.9% > 3%)
      const disc = isDiscrepancy ? 55 : 0;

      await prisma.stockTransfer.create({
        data: {
          transferNumber: trNum,
          productId: p.id,
          sourceLocation: 'SKLAD',
          targetLocation: 'ZAGOTOVKA',
          issuedQuantity: issuedQty,
          issuedUnit: 'kg',
          issuedById: userWarehouse ? userWarehouse.id : null,
          issuedByName: userWarehouse ? userWarehouse.name : 'Ombor Mudiri',
          issuedAt: trDate,
          receivedQuantity: receivedQty,
          receivedById: userProduction ? userProduction.id : null,
          receivedByName: userProduction ? userProduction.name : 'Sex Qabulchisi',
          receivedAt: trDate,
          discrepancy: disc,
          discrepancyReason: isDiscrepancy ? 'Tashish vaqtida qoplar yorilishi va tortishdagi tafovut' : null,
          status: isDiscrepancy ? 'DISCREPANCY' : 'ACCEPTED',
          notes: `${DEMO_TAG} Sexga xomashyo chiqarish hujjati`,
          createdAt: trDate,
        },
      });
    }
  }

  // 10. Recipe and Production Orders (including 1 low yield anomaly)
  console.log('⚙️ Creating Recipes and Production Orders...');
  let recipeOlcha = await prisma.recipe.findFirst({ where: { outputProductId: createdProducts[1].id } });
  if (!recipeOlcha) {
    recipeOlcha = await prisma.recipe.create({
      data: {
        outputProductId: createdProducts[1].id,
        baseYieldQty: 1000,
        version: 1,
        isApproved: true,
      },
    });
  }

  for (let i = 6; i >= 0; i--) {
    const poDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const poNum = `DEMO-PO-2026-${String(300 + i).padStart(4, '0')}`;
    const poExists = await prisma.productionOrder.findUnique({ where: { orderNumber: poNum } });

    if (!poExists) {
      const isLowYield = i === 1; // Deliberate yield drop alert (< 85%)
      const planned = 1500;
      const actual = isLowYield ? 1180 : Math.floor(Math.random() * 80 + 1420);
      const yieldPct = parseFloat(((actual / planned) * 100).toFixed(1));

      await prisma.productionOrder.create({
        data: {
          orderNumber: poNum,
          recipeId: recipeOlcha.id,
          plannedOutput: planned,
          actualOutput: actual,
          yieldPercent: yieldPct,
          lineName: '1-Liniya: IQF Muzlatish va Qadoqlash',
          supervisorName: userProduction ? userProduction.name : 'Sex Nazoratchisi',
          status: 'COMPLETED',
          notes: `${DEMO_TAG} Muzlatish partiyasi`,
          createdAt: poDate,
        },
      });
    }
  }

  // 11. Sales Orders
  console.log('💰 Creating Sales Orders...');
  const salesOrdersDefs = [
    { num: 'DEMO-SO-001', custId: custEvos.id, total: 38500000, daysAgo: 1, status: 'CONFIRMED' },
    { num: 'DEMO-SO-002', custId: custKorzinka.id, total: 64200000, daysAgo: 3, status: 'DELIVERED' },
    { num: 'DEMO-SO-003', custId: custEvos.id, total: 29000000, daysAgo: 6, status: 'SHIPPED' },
    { num: 'DEMO-SO-004', custId: custKorzinka.id, total: 47800000, daysAgo: 10, status: 'DELIVERED' },
  ];

  for (const s of salesOrdersDefs) {
    const sExists = await prisma.salesOrder.findUnique({ where: { orderNumber: s.num } });
    if (!sExists) {
      const sDate = new Date(now.getTime() - s.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.salesOrder.create({
        data: {
          orderNumber: s.num,
          customerId: s.custId,
          status: s.status,
          totalAmount: s.total,
          orderDate: sDate,
          createdAt: sDate,
          notes: `${DEMO_TAG} Tayyor mahsulot sotuv shartnomasi`,
        },
      });
    }
  }

  // 12. Activity Logs
  console.log('📝 Creating User Activity Logs...');
  const sampleActions = [
    { u: userQC, action: 'CREATE_INSPECTION', details: 'Xomashyo kirish akti tasdiqlandi' },
    { u: userInspector, action: 'QC_CHECKLIST_SAVE', details: 'Smena hisoboti va brak nazorati saqlandi' },
    { u: userWarehouse, action: 'STOCK_TRANSFER_ISSUED', details: 'Sexga 500kg xomashyo chiqarildi' },
    { u: userProduction, action: 'PRODUCTION_BATCH_FINISH', details: 'IQF liniyasida partiya muvaffaqiyatli yakunlandi' },
    { u: userSupply, action: 'SUPPLIER_PO_CREATED', details: 'Yangi xomashyo yetkazib berish buyurtmasi' },
  ];

  for (let i = 0; i < 20; i++) {
    const item = sampleActions[i % sampleActions.length];
    if (item.u) {
      const logDate = new Date(now.getTime() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
      await prisma.log.create({
        data: {
          userId: item.u.id,
          action: item.action,
          details: `${DEMO_TAG} ${item.details}`,
          createdAt: logDate,
        },
      });
    }
  }

  console.log('✅ Demo data seeding completed successfully!');
}

seedDemoData()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

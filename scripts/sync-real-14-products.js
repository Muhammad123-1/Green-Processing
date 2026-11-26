require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const REAL_14_PRODUCTS = [
  { id: 230, syryeKey: 'iceberg', name: 'Салат Айсберг', stock: 2890.15, price: 16883.32, unit: 'kg', minStock: 3000 },
  { id: 229, syryeKey: 'tomato', name: 'Томат', stock: 2380.70, price: 26500.00, unit: 'kg', minStock: 3000 },
  { id: 234, syryeKey: 'onion', name: 'лук салатный белый', stock: 68.30, price: 11500.00, unit: 'kg', minStock: 200 },
  { id: 288, syryeKey: 'cucumber', name: 'Огурцы свежие', stock: 0.00, price: 24000.00, unit: 'kg', minStock: 100 },
  { id: 285, syryeKey: 'lemon', name: 'Лимон', stock: 0.00, price: 35000.00, unit: 'kg', minStock: 50 },
  { id: 291, syryeKey: 'celery', name: 'Сельдерей', stock: 13.70, price: 35000.00, unit: 'kg', minStock: 10 },
  { id: 292, syryeKey: 'rukkola', name: 'Руккола', stock: 28.30, price: 50000.00, unit: 'kg', minStock: 50 },
  { id: 293, syryeKey: 'lolloRosso', name: 'Lollo Rosso', stock: 36.49, price: 50000.00, unit: 'kg', minStock: 50 },
  { id: 294, syryeKey: 'spinach', name: 'Шпинат', stock: 26.70, price: 50000.00, unit: 'kg', minStock: 50 },
  { id: 295, syryeKey: 'mint', name: 'Мята', stock: 7.00, price: 50000.00, unit: 'kg', minStock: 10 },
  { id: 233, syryeKey: 'cabbage', name: 'Капуста белокачанная', stock: 2657.70, price: 5000.00, unit: 'kg', minStock: 600 },
  { id: 235, syryeKey: 'carrot', name: 'Морковь', stock: 109.48, price: 10000.00, unit: 'kg', minStock: 100 },
  { id: 246, syryeKey: 'box', name: 'гофра каробка', stock: 7461.00, price: 5000.00, unit: 'dona', minStock: 1000 },
  { id: 231, syryeKey: 'chlorine', name: 'Гипохлорит натрия', stock: 513.87, price: 7000.00, unit: 'kg', minStock: 100 },
];

async function main() {
  console.log('=== Step 1: Updating ShopExpense for 2026-11-25 and 2026-11-26 ===');
  const targetBalances = {
    iceberg: 2890.15,
    tomato: 2380.70,
    onion: 68.30,
    cucumber: 0,
    lemon: 0,
    celery: 13.70,
    rukkola: 28.30,
    lolloRosso: 36.49,
    spinach: 26.70,
    mint: 7.00,
    cabbage: 2657.70,
    carrot: 109.48
  };
  const targetConsumables = {
    box: 7461,
    chlorine: 513.87
  };

  // Find expenses for 2026-11-25 and 2026-11-26
  const exp25 = await prisma.shopExpense.findFirst({ where: { date: '2026-11-25' } });
  if (exp25) {
    const existing = (exp25.balances || {});
    const updated = {
      ...existing,
      start: { ...targetBalances },
      end: { ...targetBalances },
      report: {
        ...(existing.report || {}),
        balances: {
          start: { ...targetBalances },
          end: { ...targetBalances }
        },
        status: 'completed',
        isUnfilled: false
      },
      consumables: { ...targetConsumables }
    };
    await prisma.shopExpense.update({
      where: { id: exp25.id },
      data: { balances: updated }
    });
    console.log(`Updated ShopExpense id ${exp25.id} (2026-11-25)`);
  }

  const exp26 = await prisma.shopExpense.findFirst({ where: { date: '2026-11-26' } });
  if (exp26) {
    const existing = (exp26.balances || {});
    const updated = {
      ...existing,
      start: { ...targetBalances },
      end: { ...targetBalances },
      report: {
        ...(existing.report || {}),
        balances: {
          start: { ...targetBalances },
          end: { ...targetBalances }
        },
        status: 'completed',
        isUnfilled: false
      },
      consumables: { ...targetConsumables }
    };
    await prisma.shopExpense.update({
      where: { id: exp26.id },
      data: { balances: updated }
    });
    console.log(`Updated ShopExpense id ${exp26.id} (2026-11-26)`);
  }

  console.log('=== Step 2: Setting isActive on Product table ===');
  const targetIds = REAL_14_PRODUCTS.map(p => p.id);
  
  // Activate the 14 real products
  for (const item of REAL_14_PRODUCTS) {
    await prisma.product.update({
      where: { id: item.id },
      data: {
        isActive: true,
        unit: item.unit,
        minStockLevel: item.minStock
      }
    });
  }
  console.log(`Activated and updated ${targetIds.length} real products.`);

  // Deactivate all other products
  const deactivatedResult = await prisma.product.updateMany({
    where: { id: { notIn: targetIds } },
    data: { isActive: false }
  });
  console.log(`Deactivated ${deactivatedResult.count} non-real products.`);

  console.log('=== Step 3: Setting InventoryBatch quantities ===');
  // First, zero out all batches for products NOT in the 14 real products (including gloves 250, 251)
  const zeroedOtherBatches = await prisma.inventoryBatch.updateMany({
    where: { productId: { notIn: targetIds }, quantity: { gt: 0 } },
    data: { quantity: 0 }
  });
  console.log(`Zeroed out ${zeroedOtherBatches.count} batches for deactivated products.`);

  // For each of the 14 products, ensure active batches sum to EXACTLY the target stock
  for (const p of REAL_14_PRODUCTS) {
    const batches = await prisma.inventoryBatch.findMany({
      where: { productId: p.id, qcStatus: 'APPROVED', quantity: { gt: 0 } },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }]
    });

    if (p.stock <= 0) {
      if (batches.length > 0) {
        await prisma.inventoryBatch.updateMany({
          where: { productId: p.id, quantity: { gt: 0 } },
          data: { quantity: 0 }
        });
        console.log(`Product ${p.id} (${p.name}): zeroed out all batches (target = 0).`);
      }
    } else {
      let currentTotal = batches.reduce((sum, b) => sum + b.quantity, 0);
      const diff = Math.round((p.stock - currentTotal) * 100) / 100;
      
      if (Math.abs(diff) < 0.01) {
        console.log(`Product ${p.id} (${p.name}): batches already equal target ${p.stock}.`);
      } else if (batches.length > 0) {
        // Adjust the primary/latest batch by diff so sum matches target exactly
        const primary = batches[0];
        const newQty = Math.round((primary.quantity + diff) * 100) / 100;
        if (newQty > 0) {
          await prisma.inventoryBatch.update({
            where: { id: primary.id },
            data: { quantity: newQty }
          });
          console.log(`Product ${p.id} (${p.name}): adjusted batch ${primary.id} from ${primary.quantity} to ${newQty}. New total = ${p.stock}.`);
        } else {
          // If subtracting made it <= 0, reset all and set one clean batch
          await prisma.inventoryBatch.updateMany({
            where: { productId: p.id, quantity: { gt: 0 } },
            data: { quantity: 0 }
          });
          await prisma.inventoryBatch.update({
            where: { id: primary.id },
            data: { quantity: p.stock }
          });
          console.log(`Product ${p.id} (${p.name}): reset batches and set batch ${primary.id} to ${p.stock}.`);
        }
      } else {
        // Create an approved batch
        const batchNum = `BATCH-PRD-${p.id}-20261125-REAL`;
        await prisma.inventoryBatch.create({
          data: {
            productId: p.id,
            batchNumber: batchNum,
            quantity: p.stock,
            qcStatus: 'APPROVED',
            receivedAt: new Date('2026-11-25T08:00:00Z'),
            expirationDate: new Date('2026-12-25T08:00:00Z'),
            supplierBatchNumber: 'REAL-25.11'
          }
        });
        console.log(`Product ${p.id} (${p.name}): created new batch with quantity ${p.stock}.`);
      }
    }
  }

  console.log('=== Verification ===');
  const verifyProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      batches: {
        where: { qcStatus: 'APPROVED', quantity: { gt: 0 } }
      }
    },
    orderBy: { id: 'asc' }
  });
  console.log(`Active products in DB: ${verifyProducts.length}`);
  let totalVegStock = 0;
  for (const prod of verifyProducts) {
    const qty = Math.round(prod.batches.reduce((sum, b) => sum + b.quantity, 0) * 100) / 100;
    if (prod.unit === 'kg' && prod.id !== 231) {
      totalVegStock += qty;
    }
    console.log(`- [${prod.id}] ${prod.name}: ${qty} ${prod.unit} (${prod.batches.length} batches)`);
  }
  console.log(`Total vegetable stock: ${Math.round(totalVegStock * 100) / 100} kg (Target: 8218.52 kg)`);
}

main().catch(console.error).finally(() => prisma['$disconnect']());

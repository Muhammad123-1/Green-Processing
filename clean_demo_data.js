const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_TAG = '[DEMO_DATA]';

async function cleanDemoData() {
  console.log('🧹 Cleaning up demo data from database...');

  // 1. Delete Sales Orders & Items
  const delSales = await prisma.salesOrder.deleteMany({
    where: {
      OR: [
        { orderNumber: { startsWith: 'DEMO-' } },
        { notes: { contains: DEMO_TAG } },
      ],
    },
  });
  console.log(`Deleted ${delSales.count} demo sales orders.`);

  // 2. Delete Production Orders
  const delProdOrders = await prisma.productionOrder.deleteMany({
    where: {
      OR: [
        { orderNumber: { startsWith: 'DEMO-' } },
        { notes: { contains: DEMO_TAG } },
      ],
    },
  });
  console.log(`Deleted ${delProdOrders.count} demo production orders.`);

  // 3. Delete Stock Transfers
  const delTransfers = await prisma.stockTransfer.deleteMany({
    where: {
      OR: [
        { transferNumber: { startsWith: 'DEMO-' } },
        { notes: { contains: DEMO_TAG } },
      ],
    },
  });
  console.log(`Deleted ${delTransfers.count} demo stock transfers.`);

  // 4. Delete Daily QC Checklists
  const delChecklists = await prisma.dailyQCChecklist.deleteMany({
    where: {
      OR: [
        { batchNumber: { startsWith: 'CHK-' } },
        { formData: { contains: DEMO_TAG } },
      ],
    },
  });
  console.log(`Deleted ${delChecklists.count} demo daily checklists.`);

  // 5. Delete Inspections
  const delInspections = await prisma.inspection.deleteMany({
    where: {
      OR: [
        { actNumber: { startsWith: 'DEMO-AKT-' } },
        { notes: { contains: DEMO_TAG } },
      ],
    },
  });
  console.log(`Deleted ${delInspections.count} demo inspections.`);

  // 6. Delete Inventory Batches
  const delBatches = await prisma.inventoryBatch.deleteMany({
    where: {
      batchNumber: { startsWith: 'DEMO-BATCH-' },
    },
  });
  console.log(`Deleted ${delBatches.count} demo inventory batches.`);

  // 7. Delete Logs
  const delLogs = await prisma.log.deleteMany({
    where: {
      details: { contains: DEMO_TAG },
    },
  });
  console.log(`Deleted ${delLogs.count} demo activity logs.`);

  // 8. Delete Demo Products
  const delProducts = await prisma.product.deleteMany({
    where: {
      description: { contains: DEMO_TAG },
    },
  });
  console.log(`Deleted ${delProducts.count} demo products.`);

  console.log('✅ Demo data cleanup complete!');
}

cleanDemoData()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

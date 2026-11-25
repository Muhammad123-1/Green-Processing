import { prisma } from '../src/lib/prisma'
import { syncInventoryBatchesFromDailyBalances } from '../src/lib/fifoSync'

async function main() {
  console.log('1. Cleaning phantom arrivals...')
  const updatedPhantom = await prisma.shopArrival.updateMany({
    where: {
      id: { in: [7369, 7370, 7724, 7725, 7822, 7825, 8303, 7568, 7563] },
    },
    data: { quantity: 0 },
  })
  console.log('Updated phantom arrivals to 0:', updatedPhantom.count)

  console.log('2. Deactivating duplicate glove products (238, 239, 269, 270)...')
  await prisma.product.updateMany({
    where: { id: { in: [238, 239, 269, 270] } },
    data: { isActive: false },
  })
  // Ensure primary products 250 and 251 are active
  await prisma.product.updateMany({
    where: { id: { in: [250, 251] } },
    data: { isActive: true },
  })

  // Zero out batches of deactivated products
  await prisma.inventoryBatch.updateMany({
    where: { productId: { in: [238, 239, 269, 270] } },
    data: { quantity: 0 },
  })

  console.log('3. Running FIFO sync...')
  const res = await syncInventoryBatchesFromDailyBalances()
  console.log('Sync result:', res)

  console.log('4. Inspecting final glove stock...')
  const activeBatches = await prisma.inventoryBatch.findMany({
    where: {
      productId: { in: [250, 251] },
      quantity: { gt: 0 },
    },
    include: { product: true, supplier: true },
    orderBy: { receivedAt: 'desc' },
  })

  console.log('Active batches count:', activeBatches.length)
  activeBatches.forEach((b) => {
    console.log(
      `Product: ${b.product.name} (ID: ${b.productId}) | Batch: ${b.batchNumber} | Qty: ${b.quantity} dona | Date: ${b.receivedAt?.toISOString().slice(0, 10)} | Supplier: ${b.supplier?.name || 'N/A'}`
    )
  })

  const total250 = activeBatches
    .filter((b) => b.productId === 250)
    .reduce((s, b) => s + b.quantity, 0)
  const total251 = activeBatches
    .filter((b) => b.productId === 251)
    .reduce((s, b) => s + b.quantity, 0)
  console.log('====================================')
  console.log('TOTAL ПЕРЧАТКА (М) [ID 250]:', total250, 'dona')
  console.log('TOTAL ПЕРЧАТКА (Л) [ID 251]:', total251, 'dona')
  console.log('====================================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

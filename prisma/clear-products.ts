import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('⚠️  Productlarni o\'chirishdan oldin bog\'liq jadvallar tozalanmoqda...')

  // Barcha bog'liq jadvallarni o'chirish (Foreign Key muammosi bo'lmasin)
  await prisma.inspection.deleteMany()
  console.log(`✅ Inspection o'chirildi`)

  await prisma.order.deleteMany()
  console.log(`✅ Order o'chirildi`)

  await prisma.specification.deleteMany()
  console.log(`✅ Specification o'chirildi`)

  await prisma.salesOrderItem.deleteMany()
  console.log(`✅ SalesOrderItem o'chirildi`)

  await prisma.purchaseOrderItem.deleteMany()
  console.log(`✅ PurchaseOrderItem o'chirildi`)

  await prisma.defectLog.deleteMany()
  console.log(`✅ DefectLog o'chirildi`)

  await prisma.degustationLog.deleteMany()
  console.log(`✅ DegustationLog o'chirildi`)

  await prisma.inventoryTransaction.deleteMany()
  console.log(`✅ InventoryTransaction o'chirildi`)

  await prisma.stockTransfer.deleteMany()
  console.log(`✅ StockTransfer o'chirildi`)

  await prisma.inventoryBatch.deleteMany()
  console.log(`✅ InventoryBatch o'chirildi`)

  await prisma.recipeIngredient.deleteMany()
  console.log(`✅ RecipeIngredient o'chirildi`)

  await prisma.productionOrder.deleteMany()
  console.log(`✅ ProductionOrder o'chirildi`)

  await prisma.recipe.deleteMany()
  console.log(`✅ Recipe o'chirildi`)

  // Endi productlarni o'chirish
  const products = await prisma.product.deleteMany()
  console.log(`\n🗑️  Product: ${products.count} ta o'chirildi`)

  console.log('\n✅ Hammasi muvaffaqiyatli tozalandi!')
}

main()
  .catch((e) => {
    console.error('❌ Xato:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { prisma } from '../src/lib/prisma'

async function main() {
  const arrivalsCount = await prisma.shopArrival.count()
  const expensesCount = await prisma.shopExpense.count()
  const actsCount = await prisma.incomingRawMaterialAct.count()
  const suppliersCount = await prisma.supplier.count()

  console.log({
    arrivalsCount,
    expensesCount,
    actsCount,
    suppliersCount
  })

  // Get distinct nomenclatures in ShopArrival
  const arrivals = await prisma.shopArrival.findMany({
    select: { nomenclature: true, quantity: true, supplier: true, date: true },
    take: 10
  })
  console.log('Sample ShopArrivals:', arrivals)

  // Get distinct products in IncomingRawMaterialAct
  const actsSample = await prisma.incomingRawMaterialAct.findMany({
    select: { productName: true, warehouseKg: true, shopIssuedKg: true, supplierName: true, actDate: true },
    take: 10
  })
  console.log('Sample IncomingRawMaterialActs:', actsSample)
}

main().catch(console.error).finally(() => prisma.$disconnect())

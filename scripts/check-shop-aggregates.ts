import { prisma } from '../src/lib/prisma'

async function main() {
  // Check materials keys in ShopExpense
  const expenses = await prisma.shopExpense.findMany({
    take: 10,
    orderBy: { date: 'desc' }
  })

  console.log('Sample expenses materials:')
  expenses.forEach(e => {
    console.log(`Date: ${e.date}`)
    console.log('Materials:', e.materials)
    console.log('Balances:', e.balances)
  })

  // Distinct nomenclatures in ShopArrival
  const distinctArrivals = await prisma.shopArrival.groupBy({
    by: ['nomenclature'],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } }
  })
  console.log('Top Arrivals by nomenclature:', distinctArrivals.slice(0, 15))

  // Distinct suppliers in ShopArrival
  const distinctSuppliers = await prisma.shopArrival.groupBy({
    by: ['supplier'],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10
  })
  console.log('Top Suppliers in ShopArrival:', distinctSuppliers)
}

main().catch(console.error).finally(() => prisma.$disconnect())

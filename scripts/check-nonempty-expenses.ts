import { prisma } from '../src/lib/prisma'

async function main() {
  const nonEmptyExpenses = await prisma.shopExpense.findMany({
    where: {
      NOT: {
        materials: { equals: {} }
      }
    },
    take: 5
  })
  console.log('Non-empty expenses count:', nonEmptyExpenses.length)
  nonEmptyExpenses.forEach(e => {
    console.log(`Date: ${e.date}`)
    console.log('Materials:', JSON.stringify(e.materials, null, 2))
    console.log('Balances:', JSON.stringify(e.balances, null, 2))
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())

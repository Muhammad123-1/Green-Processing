import { prisma } from '../src/lib/prisma'

async function main() {
  const expenses = await prisma.shopExpense.findMany()
  const totals: Record<string, number> = {}

  for (const exp of expenses) {
    const mats = exp.materials as Record<string, any>
    if (mats && typeof mats === 'object') {
      for (const [key, val] of Object.entries(mats)) {
        const num = Number(val) || 0
        totals[key] = (totals[key] || 0) + num
      }
    }
  }

  console.log('TOTAL EXPENSES (RASXOD) ACROSS ALL EXPENSE RECORDS:')
  console.log(totals)
}

main().catch(console.error).finally(() => prisma.$disconnect())

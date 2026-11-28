const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const customers = await prisma.customer.findMany()
  const orders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
      items: { include: { product: true } },
      invoices: true,
      returns: true
    }
  })
  const returns = await prisma.salesReturn.findMany()
  const invoices = await prisma.invoice.findMany()

  console.log('Customer Count:', customers.length)
  console.log('SalesOrder Count:', orders.length)
  console.log('Returns Count:', returns.length)
  console.log('Invoices Count:', invoices.length)

  let gross = 0
  let discounts = 0
  let returnsTotal = 0
  let cogs = 0
  let logistics = 0

  orders.forEach(o => {
    discounts += o.discountAmount || 0
    logistics += o.logisticsCost || 0
    o.items.forEach(it => {
      gross += it.quantity * it.unitPrice
      discounts += it.discount || 0
      cogs += it.quantity * (it.cogsPerUnit || (it.unitPrice * 0.65))
    })
  })

  returns.forEach(r => {
    returnsTotal += r.returnAmount
    cogs -= r.cogsAmount || 0
  })

  const net = gross - discounts - returnsTotal
  const grossProfit = net - cogs
  const marginPct = (grossProfit / net) * 100
  const contribution = grossProfit - logistics

  console.log('\n--- VERIFICATION OF FINANCIAL CALCULATIONS ---')
  console.log('Gross Revenue:', gross.toLocaleString(), 'UZS')
  console.log('Applicable Discounts:', discounts.toLocaleString(), 'UZS')
  console.log('Returns:', returnsTotal.toLocaleString(), 'UZS')
  console.log('Net Revenue:', net.toLocaleString(), 'UZS')
  console.log('COGS:', cogs.toLocaleString(), 'UZS')
  console.log('Gross Profit:', grossProfit.toLocaleString(), 'UZS')
  console.log('Gross Margin:', marginPct.toFixed(2), '%')
  console.log('Logistics Expenses:', logistics.toLocaleString(), 'UZS')
  console.log('Contribution After Logistics:', contribution.toLocaleString(), 'UZS')
}

main().catch(console.error).finally(() => prisma.$disconnect())

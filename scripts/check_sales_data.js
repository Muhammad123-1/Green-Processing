const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        include: {
          items: true,
          invoices: true,
        }
      },
      invoices: true
    }
  })
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      },
      invoices: true
    }
  })
  const invoices = await prisma.invoice.findMany({
    include: {
      transactions: true,
      customer: true,
      salesOrder: true
    }
  })
  const products = await prisma.product.findMany()

  console.log('Customer Count:', customers.length)
  console.log('SalesOrder Count:', salesOrders.length)
  console.log('Invoice Count:', invoices.length)
  console.log('Product Count:', products.length)
  console.log('\nSample Customers:', JSON.stringify(customers.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    ordersCount: c.orders.length,
    invoicesCount: c.invoices.length
  })), null, 2))

  console.log('\nSample SalesOrders:', JSON.stringify(salesOrders.slice(0, 3).map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customer?.name,
    totalAmount: o.totalAmount,
    status: o.status,
    items: o.items.map(i => ({ product: i.product?.name, qty: i.quantity, price: i.unitPrice, discount: i.discount }))
  })), null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())

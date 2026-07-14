import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Create Supplier
  let supplier = await prisma.supplier.findFirst({ where: { name: "Oshxona Ta'minoti Bozori" } })
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "Oshxona Ta'minoti Bozori",
        address: "Mahalliy bozor",
        phone: "+998901234567"
      }
    })
  }

  const products = [
    { name: "Guruch (Alanga)", unit: "kg" },
    { name: "Guruch (Lazer)", unit: "kg" },
    { name: "Mol go'shti (Lahm)", unit: "kg" },
    { name: "Mol go'shti (Suyakli)", unit: "kg" },
    { name: "Qo'y go'shti", unit: "kg" },
    { name: "Sariq sabzi", unit: "kg" },
    { name: "Qizil sabzi", unit: "kg" },
    { name: "Piyoz", unit: "kg" },
    { name: "O'simlik yog'i", unit: "litr" },
    { name: "Ziravorlar to'plami", unit: "dona" },
    { name: "Shakar", unit: "kg" },
    { name: "Choy (Qora)", unit: "karobka" },
    { name: "Choy (Ko'k)", unit: "karobka" },
    { name: "Pomidor", unit: "kg" },
    { name: "Bodring", unit: "kg" },
    { name: "Kartoshka", unit: "kg" },
  ]

  console.log("Oshxona mahsulotlari qo'shilmoqda...")
  const dbProducts = []
  for (const p of products) {
    let prod = await prisma.product.findFirst({ where: { name: p.name } })
    if (!prod) {
      prod = await prisma.product.create({
        data: {
          name: p.name,
          gost: "UzDSt oshxona",
          unit: p.unit
        }
      })
    }
    dbProducts.push(prod)
  }

  console.log("Kutilayotgan buyurtmalar (Oshxona) yaratilmoqda...")
  // 2. Create some sample Orders
  const sampleOrders = [
    { name: "Guruch (Alanga)", qty: 50, days: 2 },
    { name: "Mol go'shti (Lahm)", qty: 20, days: 1 },
    { name: "Sariq sabzi", qty: 30, days: 0 },
    { name: "Piyoz", qty: 15, days: 0 },
    { name: "O'simlik yog'i", qty: 10, days: 3 },
  ]

  for (const o of sampleOrders) {
    const prod = dbProducts.find(p => p.name === o.name)
    if (prod) {
      const date = new Date()
      date.setDate(date.getDate() + o.days)
      
      await prisma.order.create({
        data: {
          productId: prod.id,
          quantity: o.qty,
          unit: prod.unit,
          expectedDate: date,
          status: 'PENDING'
        }
      })
    }
  }

  console.log("Tayyor! Barcha ma'lumotlar kiritildi.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

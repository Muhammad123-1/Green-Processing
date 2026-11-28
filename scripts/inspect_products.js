const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, unit: true },
    take: 20
  })
  console.log('Sample Products:', JSON.stringify(products, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())

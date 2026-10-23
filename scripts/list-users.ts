import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, isActive: true },
    orderBy: { id: 'asc' }
  })
  console.log('JAMI XODIMLAR SONI:', users.length)
  console.table(users)
}

main().catch(console.error).finally(() => prisma.$disconnect())

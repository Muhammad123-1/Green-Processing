import { prisma } from '../src/lib/prisma'

const ruMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h'
}

function toSlug(text: string, id: number): string {
  let clean = (text || '').toLowerCase().trim()
  clean = clean.replace(/^(ооо|ип|чп|ок|мчж|ятт|sp|llc|oao|zao)[\s"'`]+/i, '')
  clean = clean.replace(/["'`«»()]/g, '')
  let res = ''
  for (const ch of clean) {
    res += ruMap[ch] !== undefined ? ruMap[ch] : ch
  }
  res = res.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (!res || res.length < 3) {
    res = `sup_${id}`
  }
  return res.slice(0, 18)
}

function genPassword(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz'
  let p = ''
  for (let i = 0; i < 6; i++) {
    p += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return 'gp' + p
}

export async function provisionAllSupplierAccounts() {
  console.log('--- Provisioning Supplier Accounts ---')

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { role: 'SUPPLIER' }
      }
    },
    orderBy: { id: 'asc' }
  })

  console.log(`Found ${suppliers.length} active suppliers.`)

  const existingUsers = await prisma.user.findMany({
    select: { username: true }
  })
  const usedUsernames = new Set<string>(existingUsers.map(u => u.username.toLowerCase()))

  let createdCount = 0
  let existingCount = 0

  for (const sup of suppliers) {
    if (sup.users.length > 0) {
      existingCount++
      continue
    }

    // Generate unique username
    let baseSlug = toSlug(sup.shortName || sup.name, sup.id)
    let candidateUsername = baseSlug
    let counter = 2
    while (usedUsernames.has(candidateUsername)) {
      candidateUsername = `${baseSlug}_${counter}`
      counter++
    }
    usedUsernames.add(candidateUsername)

    const password = genPassword()

    await prisma.user.create({
      data: {
        name: sup.name,
        username: candidateUsername,
        password: password,
        role: 'SUPPLIER',
        supplierId: sup.id,
        isActive: true,
        medicalClearance: true
      }
    })

    createdCount++
  }

  console.log(`Finished! Newly created: ${createdCount}, Already existed: ${existingCount}`)
}

if (require.main === module) {
  provisionAllSupplierAccounts()
    .then(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (err) => {
      console.error('Error provisioning supplier accounts:', err)
      await prisma.$disconnect()
      process.exit(1)
    })
}

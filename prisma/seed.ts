import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      username: 'admin',
      password: 'admin123', // In production, hash this
      role: 'ADMIN',
      isActive: true,
    },
  })

  const roles = [
    { username: 'director', name: 'Direktor', role: 'DIRECTOR' },
    { username: 'quality', name: 'Sifat Nazorati', role: 'QUALITY_CONTROL' },
    { username: 'tech', name: 'Texnolog', role: 'TECHNOLOGY' },
    { username: 'production', name: 'Ishlab Chiqarish', role: 'PRODUCTION' },
    { username: 'logistics', name: 'Logistika', role: 'LOGISTICS' },
    { username: 'warehouse', name: 'Sklad', role: 'WAREHOUSE' },
    { username: 'accounting', name: 'Buxgalteriya', role: 'ACCOUNTING' },
    { username: 'supply', name: 'Ta\'minot', role: 'SUPPLY' },
    { username: 'hr', name: 'Kadrlar', role: 'HR' },
    { username: 'security', name: 'Xavfsizlik', role: 'SECURITY' },
  ]

  for (const roleUser of roles) {
    await prisma.user.upsert({
      where: { username: roleUser.username },
      update: {},
      create: {
        name: roleUser.name,
        username: roleUser.username,
        password: '123', // Test parol hammaga 123
        role: roleUser.role,
        isActive: true,
      },
    })
  }

  // Create suppliers
  const suppliers = [
    { name: 'ООО "АгроПродукт"', shortName: 'АгроПродукт', address: 'Toshkent', phone: '+998712345678' },
    { name: 'ООО "ФудСервис"', shortName: 'ФудСервис', address: 'Samarqand', phone: '+998662345678' },
    { name: 'ООО "БиоТех"', shortName: 'БиоТех', address: 'Namangan', phone: '+998692345678' },
    { name: 'ИП Каримов А.А.', shortName: 'Каримов ИП', address: 'Farg\'ona', phone: '+998732345678' },
    { name: 'ООО "ТехноФуд"', shortName: 'ТехноФуд', address: 'Andijon', phone: '+998742345678' },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: suppliers.indexOf(supplier) + 1 },
      update: {},
      create: supplier,
    })
  }

  // Create products
  const products = [
    { name: 'Qand', code: 'QND-001', category: 'Qandolat xomashyosi', unit: 'kg', minTemperature: 0, maxTemperature: 25, defaultPackaging: 'Qop (50 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 21-94' },
    { name: 'Un', code: 'UN-001', category: 'Don mahsulotlari', unit: 'kg', minTemperature: 0, maxTemperature: 20, defaultPackaging: 'Qop (50 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 26574-2017' },
    { name: 'Tuz', code: 'TUZ-001', category: 'Ziravorlar', unit: 'kg', minTemperature: 0, maxTemperature: 30, defaultPackaging: 'Qop (25 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ Р 51574-2018' },
    { name: 'Yog\'', code: 'YOG-001', category: 'Yog\'-moy mahsulotlari', unit: 'litr', minTemperature: 4, maxTemperature: 18, defaultPackaging: 'Kanistra (20 L)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 1129-2013' },
    { name: 'Krakmal', code: 'KRK-001', category: 'Qo\'shimchalar', unit: 'kg', minTemperature: 0, maxTemperature: 25, defaultPackaging: 'Qop (25 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 7699-78' },
    { name: 'Limon kislotasi', code: 'LMN-001', category: 'Kimyoviy qo\'shimchalar', unit: 'kg', minTemperature: 0, maxTemperature: 25, defaultPackaging: 'Qop (25 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 908-2004' },
    { name: 'Vanillin', code: 'VNL-001', category: 'Aromatizatorlar', unit: 'kg', minTemperature: 0, maxTemperature: 25, defaultPackaging: 'Quticha (1 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 16599-71' },
    { name: 'Kakao kukunи', code: 'KKO-001', category: 'Qandolat xomashyosi', unit: 'kg', minTemperature: 0, maxTemperature: 20, defaultPackaging: 'Qop (25 kg)', defaultConclusion: 'Muvofiq', gost: 'ГОСТ 108-2014' },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    })
  }

  // Create default settings
  const settings = [
    { key: 'company_name', value: 'Korxona nomi', category: 'general' },
    { key: 'company_address', value: 'Korxona manzili', category: 'general' },
    { key: 'company_phone', value: '+998 XX XXX XX XX', category: 'general' },
    { key: 'default_inspector', value: 'Sifat nazorati bo\'limi', category: 'general' },
    { key: 'act_number_prefix', value: 'КС', category: 'numbering' },
    { key: 'act_number_format', value: 'PREFIX-YEAR-NUMBER', category: 'numbering' },
    { key: 'language', value: 'uz', category: 'display' },
    { key: 'theme', value: 'dark', category: 'display' },
    { key: 'auto_backup', value: 'true', category: 'backup' },
    { key: 'backup_interval', value: '24', category: 'backup' },
    { key: 'excel_template_path', value: 'templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx', category: 'templates' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

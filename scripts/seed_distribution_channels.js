const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding enterprise distribution channels, customers, orders, and financials...')

  // 1. Fetch available products
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: [
          'Салат Айсберг',
          'Томат',
          'лук салатный белый',
          'Морковь',
          'Капуста белокачанная'
        ]
      }
    }
  })

  const prodMap = {}
  products.forEach(p => {
    prodMap[p.name] = p
  })

  // Ensure COGS are set on products
  const defaultCogs = {
    'Салат Айсберг': { price: 24000, cogs: 15600 },
    'Томат': { price: 32000, cogs: 21000 },
    'лук салатный белый': { price: 16000, cogs: 10400 },
    'Морковь': { price: 12000, cogs: 7800 },
    'Капуста белокачанная': { price: 9000, cogs: 5850 }
  }

  for (const [name, meta] of Object.entries(defaultCogs)) {
    if (prodMap[name]) {
      await prisma.product.update({
        where: { id: prodMap[name].id },
        data: {
          cogsPerUnit: meta.cogs
        }
      })
    }
  }

  // Get a bank account for invoices
  let bankAccount = await prisma.bankAccount.findFirst()
  if (!bankAccount) {
    bankAccount = await prisma.bankAccount.create({
      data: {
        accountNumber: '20208000900123456001',
        bankName: 'Kapitalbank ATB Toshkent filiali',
        currency: 'UZS',
        balance: 1500000000
      }
    })
  }

  // 2. Customers setup with realistic B2B classification
  const customerConfigs = [
    // --- DIRECT DISTRIBUTION ---
    {
      name: 'EVOS Fast Food Chain',
      companyName: 'OOO EVOS Delivery',
      phone: '+998 71 203-12-12',
      email: 'supply@evos.uz',
      address: 'Toshkent sh., Furqat ko\'chasi, 15',
      inn: '304918274',
      distributionType: 'DIRECT',
      channelCategory: 'RESTAURANTS_FOOD_SERVICE',
      businessRole: 'B2B End-User (QSR Fast Food Operations - Own Consumption)',
      contractNumber: 'EV-2026/01',
      contractDate: new Date('2026-01-10'),
      creditTermDays: 14,
      creditLimit: 300000000,
    },
    {
      name: 'Safia Cafe & Bakery Chain',
      companyName: 'OOO Safia Bakery Group',
      phone: '+998 78 140-40-40',
      email: 'procurement@safia.uz',
      address: 'Toshkent sh., Mirobod t-ni, Nukus ko\'chasi, 29',
      inn: '305882910',
      distributionType: 'DIRECT',
      channelCategory: 'RESTAURANTS_FOOD_SERVICE',
      businessRole: 'B2B End-User (Cafe & Bakery Chain Preparation)',
      contractNumber: 'SF-2026/04',
      contractDate: new Date('2026-02-15'),
      creditTermDays: 10,
      creditLimit: 180000000,
    },
    {
      name: 'Caravan Group HoReCa',
      companyName: 'OOO Caravan Resto Invest',
      phone: '+998 71 256-45-45',
      email: 'chef@caravangroup.uz',
      address: 'Toshkent sh., Yakkasaroy t-ni, Bobur ko\'chasi, 42',
      inn: '302491029',
      distributionType: 'DIRECT',
      channelCategory: 'RESTAURANTS_FOOD_SERVICE',
      businessRole: 'B2B End-User (Fine Dining Culinary Preparation)',
      contractNumber: 'CG-2026/08',
      contractDate: new Date('2026-03-01'),
      creditTermDays: 15,
      creditLimit: 90000000,
    },
    {
      name: 'Hyatt Regency Tashkent',
      companyName: 'AO Poytaxt Qurilish Hotel Operations',
      phone: '+998 71 207-12-34',
      email: 'purchasing.tashk@hyatt.com',
      address: 'Toshkent sh., Navoiy ko\'chasi, 1A',
      inn: '303102938',
      distributionType: 'DIRECT',
      channelCategory: 'CORPORATE_END_CUSTOMERS',
      businessRole: 'B2B End-User (Luxury Hospitality & Banqueting Services)',
      contractNumber: 'HR-2026/12',
      contractDate: new Date('2026-01-20'),
      creditTermDays: 30,
      creditLimit: 200000000,
    },
    {
      name: 'Enter Engineering Camp Catering',
      companyName: 'Enter Engineering Pte Ltd - Food Division',
      phone: '+998 71 200-50-50',
      email: 'catering.logistics@enter-eng.com',
      address: 'Toshkent sh., Mustaqillik shoh ko\'chasi, 88',
      inn: '301928374',
      distributionType: 'DIRECT',
      channelCategory: 'CORPORATE_END_CUSTOMERS',
      businessRole: 'B2B End-User (Industrial Camp Staff Dining Facilities)',
      contractNumber: 'EE-2026/02',
      contractDate: new Date('2026-01-05'),
      creditTermDays: 45,
      creditLimit: 400000000,
    },

    // --- INDIRECT DISTRIBUTION ---
    {
      name: 'Korzinka Supermarketlar Tarmog\'i',
      companyName: 'FE Anglesey Food',
      phone: '+998 78 140-14-14',
      email: 'commercial@korzinka.uz',
      address: 'Toshkent sh., Yakkasaroy t-ni, Kichik halqa yo\'li, 120',
      inn: '202394857',
      distributionType: 'INDIRECT',
      channelCategory: 'SUPERMARKETS',
      businessRole: 'Retail Supermarket Chain (Resale in Fresh Produce Departments)',
      contractNumber: 'KZ-2026/03',
      contractDate: new Date('2026-01-15'),
      creditTermDays: 21,
      creditLimit: 500000000,
    },
    {
      name: 'Havas Discount Supermarkets',
      companyName: 'OOO Havas Food Discounter',
      phone: '+998 71 205-55-55',
      email: 'agro@havasfood.uz',
      address: 'Toshkent sh., Sergeli t-ni, Yangi Sergeli ko\'chasi, 34',
      inn: '306192847',
      distributionType: 'INDIRECT',
      channelCategory: 'SUPERMARKETS',
      businessRole: 'Hard Discount Grocery Retailer (Resale)',
      contractNumber: 'HV-2026/05',
      contractDate: new Date('2026-02-01'),
      creditTermDays: 14,
      creditLimit: 300000000,
    },
    {
      name: 'Makro Supermarket Network',
      companyName: 'OOO Darvoza Savdo',
      phone: '+998 71 205-12-34',
      email: 'supply@makromarket.uz',
      address: 'Toshkent sh., Yunusobod t-ni, Amir Temur shoh ko\'chasi, 107B',
      inn: '301293847',
      distributionType: 'INDIRECT',
      channelCategory: 'SUPERMARKETS',
      businessRole: 'Urban Supermarket Chain (Resale)',
      contractNumber: 'MK-2026/07',
      contractDate: new Date('2026-02-10'),
      creditTermDays: 30,
      creditLimit: 280000000,
    },
    {
      name: 'Fayzli Oziq-Ovqat Do\'konlari',
      companyName: 'YaTT Rahimov O.A.',
      phone: '+998 90 912-34-56',
      email: 'fayzli.market@gmail.com',
      address: 'Toshkent vil., Zangiota t-ni, Eshanguzar q-g\'i',
      inn: '502938174',
      distributionType: 'INDIRECT',
      channelCategory: 'RETAIL_STORES',
      businessRole: 'Independent Neighborhood Grocery Stores (Resale)',
      contractNumber: 'FZ-2026/19',
      contractDate: new Date('2026-03-12'),
      creditTermDays: 7,
      creditLimit: 40000000,
    },
    {
      name: 'Baraka Minimarketlar Tarmog\'i',
      companyName: 'OOO Baraka Chakana Savdo',
      phone: '+998 93 500-11-22',
      email: 'baraka.savdo@inbox.uz',
      address: 'Toshkent sh., Uchtepa t-ni, Chilonzor 24-mavze',
      inn: '307481920',
      distributionType: 'INDIRECT',
      channelCategory: 'RETAIL_STORES',
      businessRole: 'Convenience Store Chain (Resale)',
      contractNumber: 'BM-2026/22',
      contractDate: new Date('2026-03-20'),
      creditTermDays: 7,
      creditLimit: 50000000,
    },
    {
      name: 'Samarkand Agro Distribution LLC',
      companyName: 'OOO Samarkand Agro Distribution',
      phone: '+998 66 230-10-20',
      email: 'info@sam-agrodist.uz',
      address: 'Samarqand sh., Rudakiy ko\'chasi, 150',
      inn: '304192837',
      distributionType: 'INDIRECT',
      channelCategory: 'DISTRIBUTORS',
      businessRole: 'Regional Authorized Distributor (Samarkand & Navoiy Provinces)',
      contractNumber: 'SD-2026/11',
      contractDate: new Date('2026-01-18'),
      creditTermDays: 30,
      creditLimit: 550000000,
    },
    {
      name: 'Fergana Valley Logistics & Distribution',
      companyName: 'OOO Vodiy Fresh Distribution',
      phone: '+998 73 244-55-66',
      email: 'trade@vodiyfresh.uz',
      address: 'Farg\'ona sh., Sayilgoh ko\'chasi, 28',
      inn: '305284910',
      distributionType: 'INDIRECT',
      channelCategory: 'DISTRIBUTORS',
      businessRole: 'Regional Distributor (Andijan, Namangan, Fergana Valley)',
      contractNumber: 'FD-2026/14',
      contractDate: new Date('2026-02-05'),
      creditTermDays: 25,
      creditLimit: 400000000,
    },
    {
      name: 'Qo\'yliq Ulgurji Savdo MCHJ',
      companyName: 'MCHJ Qo\'yliq Ulgurji Agro',
      phone: '+998 97 700-88-99',
      email: 'qoyliq.ulgurji@mail.ru',
      address: 'Toshkent sh., Bektemir t-ni, Farg\'ona yo\'li, 13',
      inn: '303918274',
      distributionType: 'INDIRECT',
      channelCategory: 'WHOLESALERS',
      businessRole: 'Central Agricultural Wholesale Merchant (Resale to secondary wholesalers)',
      contractNumber: 'QY-2026/06',
      contractDate: new Date('2026-01-25'),
      creditTermDays: 14,
      creditLimit: 350000000,
    },
    {
      name: 'Chorsu Fresh Trade LLC',
      companyName: 'OOO Chorsu Sabzavot Trade',
      phone: '+998 99 800-44-33',
      email: 'chorsu.trade@gmail.com',
      address: 'Toshkent sh., Shayxontohur t-ni, Zarkaynar ko\'chasi, 1',
      inn: '302849102',
      distributionType: 'INDIRECT',
      channelCategory: 'WHOLESALERS',
      businessRole: 'Wholesale Commodity Merchant (Market Sub-distribution)',
      contractNumber: 'CS-2026/15',
      contractDate: new Date('2026-02-28'),
      creditTermDays: 10,
      creditLimit: 200000000,
    },
    {
      name: 'Eurasia Fresh Export LLP',
      companyName: 'TOO Eurasia Fresh Logistics KZ',
      phone: '+7 727 340-11-22',
      email: 'export@eurasia-fresh.kz',
      address: 'Qozog\'iston, Olmaota sh., Raimbek shoh ko\'chasi, 212',
      inn: '190440029381',
      distributionType: 'INDIRECT',
      channelCategory: 'EXPORT_PARTNERS',
      businessRole: 'International Export Partner (Kazakhstan & CIS Supermarket Supply)',
      contractNumber: 'EXP-2026/01',
      contractDate: new Date('2026-01-30'),
      creditTermDays: 30,
      creditLimit: 700000000,
    },
    {
      name: 'Silk Road Agro Trade GmbH',
      companyName: 'Silk Road Agro Trade GmbH',
      phone: '+49 69 9876-5432',
      email: 'trade@silkroad-agro.de',
      address: 'Germaniya, Frankfurt am Main, Mainzer Landstrasse 180',
      inn: 'DE319283741',
      distributionType: 'INDIRECT',
      channelCategory: 'EXPORT_PARTNERS',
      businessRole: 'International Export Partner (EU Vegetable Processing Supply)',
      contractNumber: 'EXP-2026/02',
      contractDate: new Date('2026-02-14'),
      creditTermDays: 45,
      creditLimit: 850000000,
    },
    {
      name: 'Agrofirma Yangiyo\'l Baraka',
      companyName: 'QFY Yangiyo\'l Agro Kooperativ',
      phone: '+998 91 190-20-30',
      email: 'yangiyol.agro@uz',
      address: 'Toshkent vil., Yangiyo\'l t-ni, Samarqand ko\'chasi, 5',
      inn: '301827461',
      distributionType: 'INDIRECT',
      channelCategory: 'OTHER',
      businessRole: 'Agricultural Cooperative Exchange & Processing Partner',
      contractNumber: 'AY-2026/88',
      contractDate: new Date('2026-03-05'),
      creditTermDays: 15,
      creditLimit: 60000000,
    },
    {
      name: 'Muhammad',
      companyName: 'Green processing ichki iste\'mol',
      phone: '+998 90 000-00-00',
      email: 'admin@greenprocessing.uz',
      address: 'Toshkent',
      inn: null,
      distributionType: null,
      channelCategory: 'UNCLASSIFIED',
      businessRole: 'Ichki sinov va unclassified mijoz',
      contractNumber: null,
      contractDate: null,
      creditTermDays: 0,
      creditLimit: 0,
    }
  ]

  const savedCustomers = []

  for (const cfg of customerConfigs) {
    let cust = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: cfg.name },
          { companyName: cfg.companyName }
        ]
      }
    })

    if (cust) {
      cust = await prisma.customer.update({
        where: { id: cust.id },
        data: {
          distributionType: cfg.distributionType,
          channelCategory: cfg.channelCategory,
          businessRole: cfg.businessRole,
          contractNumber: cfg.contractNumber,
          contractDate: cfg.contractDate,
          creditTermDays: cfg.creditTermDays,
          creditLimit: cfg.creditLimit,
          phone: cfg.phone,
          email: cfg.email,
          address: cfg.address,
          inn: cfg.inn
        }
      })
    } else {
      cust = await prisma.customer.create({
        data: cfg
      })
    }
    savedCustomers.push(cust)
  }

  console.log(`Updated/Created ${savedCustomers.length} classified customers.`)

  // 3. Realistic Sales Orders & Invoices Definition
  // Each order has: customer, date, items, discount, logisticsCost, payment status
  const ordersData = [
    // --- RESTAURANTS_FOOD_SERVICE (EVOS, Safia, Caravan) ---
    {
      customerName: 'EVOS Fast Food Chain',
      orderDate: new Date('2026-11-04'),
      deliveryDate: new Date('2026-11-05'),
      items: [
        { product: 'Салат Айсберг', qty: 5200, price: 23500, discount: 500000 },
        { product: 'Томат', qty: 3100, price: 31000, discount: 0 }
      ],
      logisticsCost: 3500000, // Refrigerated van delivery
      paidPct: 1.0, // Fully paid
      paymentDelayDays: 10,
      returns: [
        { product: 'Томат', qty: 40, reason: 'DEFECT (Yetilish darajasi past)', returnAmount: 1240000 }
      ]
    },
    {
      customerName: 'EVOS Fast Food Chain',
      orderDate: new Date('2026-11-18'),
      deliveryDate: new Date('2026-11-19'),
      items: [
        { product: 'Салат Айсберг', qty: 5800, price: 23500, discount: 800000 },
        { product: 'Томат', qty: 3400, price: 31000, discount: 500000 },
        { product: 'лук салатный белый', qty: 1200, price: 15500, discount: 0 }
      ],
      logisticsCost: 4000000,
      paidPct: 0.5, // Partially paid
      paymentDelayDays: 7,
      returns: []
    },
    {
      customerName: 'Safia Cafe & Bakery Chain',
      orderDate: new Date('2026-11-10'),
      deliveryDate: new Date('2026-11-11'),
      items: [
        { product: 'Морковь', qty: 2500, price: 12500, discount: 0 },
        { product: 'Томат', qty: 1800, price: 32000, discount: 400000 },
        { product: 'Салат Айсберг', qty: 1200, price: 24000, discount: 0 }
      ],
      logisticsCost: 2200000,
      paidPct: 1.0,
      paymentDelayDays: 8,
      returns: []
    },
    {
      customerName: 'Safia Cafe & Bakery Chain',
      orderDate: new Date('2026-11-22'),
      deliveryDate: new Date('2026-11-23'),
      items: [
        { product: 'Морковь', qty: 3000, price: 12500, discount: 200000 },
        { product: 'Салат Айсберг', qty: 1500, price: 24000, discount: 0 }
      ],
      logisticsCost: 2000000,
      paidPct: 0.0, // Unpaid, approaching due date
      paymentDelayDays: 0,
      returns: []
    },
    {
      customerName: 'Caravan Group HoReCa',
      orderDate: new Date('2026-11-12'),
      deliveryDate: new Date('2026-11-13'),
      items: [
        { product: 'Салат Айсберг', qty: 850, price: 25000, discount: 0 },
        { product: 'Томат', qty: 950, price: 33000, discount: 0 }
      ],
      logisticsCost: 1200000,
      paidPct: 1.0,
      paymentDelayDays: 12,
      returns: [
        { product: 'Салат Айсберг', qty: 25, reason: 'TEMPERATURE_ABUSE (Tranzitda sovuq urgan)', returnAmount: 625000 }
      ]
    },

    // --- CORPORATE_END_CUSTOMERS (Hyatt Regency, Enter Engineering) ---
    {
      customerName: 'Hyatt Regency Tashkent',
      orderDate: new Date('2026-10-25'),
      deliveryDate: new Date('2026-10-26'),
      items: [
        { product: 'Салат Айсберг', qty: 1800, price: 25500, discount: 0 },
        { product: 'Томат', qty: 2200, price: 33500, discount: 0 }
      ],
      logisticsCost: 2500000,
      paidPct: 1.0,
      paymentDelayDays: 25,
      returns: []
    },
    {
      customerName: 'Hyatt Regency Tashkent',
      orderDate: new Date('2026-11-15'),
      deliveryDate: new Date('2026-11-16'),
      items: [
        { product: 'Салат Айсберг', qty: 2100, price: 25500, discount: 0 },
        { product: 'Томат', qty: 2400, price: 33500, discount: 0 }
      ],
      logisticsCost: 2800000,
      paidPct: 0.0, // Unpaid, currently within 30-day term
      paymentDelayDays: 0,
      returns: []
    },
    {
      customerName: 'Enter Engineering Camp Catering',
      orderDate: new Date('2026-10-10'),
      deliveryDate: new Date('2026-10-12'),
      items: [
        { product: 'Капуста белокачанная', qty: 12000, price: 9200, discount: 1500000 },
        { product: 'Морковь', qty: 8500, price: 12000, discount: 1000000 },
        { product: 'лук салатный белый', qty: 4500, price: 16000, discount: 500000 }
      ],
      logisticsCost: 9500000, // Heavy long distance transport
      paidPct: 1.0,
      paymentDelayDays: 40,
      returns: [
        { product: 'Капуста белокачанная', qty: 350, reason: 'MECHANICAL_DAMAGE (Yuk tushirishda zararlangan)', returnAmount: 3220000 }
      ]
    },
    {
      customerName: 'Enter Engineering Camp Catering',
      orderDate: new Date('2026-11-02'),
      deliveryDate: new Date('2026-11-04'),
      items: [
        { product: 'Капуста белокачанная', qty: 15000, price: 9200, discount: 2000000 },
        { product: 'Морковь', qty: 9000, price: 12000, discount: 1200000 }
      ],
      logisticsCost: 11000000,
      paidPct: 0.0, // Unpaid, high exposure receivable
      paymentDelayDays: 0,
      returns: []
    },

    // --- SUPERMARKETS (Korzinka, Havas, Makro) ---
    {
      customerName: 'Korzinka Supermarketlar Tarmog\'i',
      orderDate: new Date('2026-10-28'),
      deliveryDate: new Date('2026-10-29'),
      items: [
        { product: 'Салат Айсберг', qty: 7500, price: 23800, discount: 2500000 },
        { product: 'Томат', qty: 6200, price: 31500, discount: 2000000 },
        { product: 'лук салатный белый', qty: 3100, price: 15800, discount: 800000 }
      ],
      logisticsCost: 6500000,
      paidPct: 1.0,
      paymentDelayDays: 20,
      returns: [
        { product: 'Салат Айсберг', qty: 180, reason: 'PACKAGING_DEFECT (Vakuum buzilgan)', returnAmount: 4284000 }
      ]
    },
    {
      customerName: 'Korzinka Supermarketlar Tarmog\'i',
      orderDate: new Date('2026-11-14'),
      deliveryDate: new Date('2026-11-15'),
      items: [
        { product: 'Салат Айсберг', qty: 8800, price: 23800, discount: 3000000 },
        { product: 'Томат', qty: 7400, price: 31500, discount: 2500000 }
      ],
      logisticsCost: 7500000,
      paidPct: 0.4, // Partially paid
      paymentDelayDays: 14,
      returns: [
        { product: 'Томат', qty: 120, reason: 'DEFECT (Ezilgan mevalar)', returnAmount: 3780000 }
      ]
    },
    {
      customerName: 'Havas Discount Supermarkets',
      orderDate: new Date('2026-10-20'),
      deliveryDate: new Date('2026-10-21'),
      items: [
        { product: 'Капуста белокачанная', qty: 8500, price: 8900, discount: 1000000 },
        { product: 'Морковь', qty: 6200, price: 11800, discount: 800000 }
      ],
      logisticsCost: 4800000,
      paidPct: 1.0,
      paymentDelayDays: 13,
      returns: []
    },
    {
      customerName: 'Havas Discount Supermarkets',
      orderDate: new Date('2026-11-05'),
      deliveryDate: new Date('2026-11-06'),
      items: [
        { product: 'Капуста белокачанная', qty: 9500, price: 8900, discount: 1200000 },
        { product: 'Морковь', qty: 7000, price: 11800, discount: 900000 }
      ],
      logisticsCost: 5200000,
      paidPct: 0.0, // OVERDUE! 14 days term has expired
      paymentDelayDays: 0,
      returns: [
        { product: 'Капуста белокачанная', qty: 220, reason: 'DEFECT (Sarg\'ayish)', returnAmount: 1958000 }
      ]
    },
    {
      customerName: 'Makro Supermarket Network',
      orderDate: new Date('2026-11-08'),
      deliveryDate: new Date('2026-11-09'),
      items: [
        { product: 'Салат Айсберг', qty: 4200, price: 24000, discount: 1000000 },
        { product: 'Томат', qty: 3800, price: 31800, discount: 800000 }
      ],
      logisticsCost: 4200000,
      paidPct: 0.5,
      paymentDelayDays: 10,
      returns: []
    },

    // --- RETAIL_STORES (Fayzli, Baraka) ---
    {
      customerName: 'Fayzli Oziq-Ovqat Do\'konlari',
      orderDate: new Date('2026-11-01'),
      deliveryDate: new Date('2026-11-02'),
      items: [
        { product: 'Томат', qty: 650, price: 33000, discount: 0 },
        { product: 'Салат Айсберг', qty: 450, price: 25000, discount: 0 }
      ],
      logisticsCost: 800000,
      paidPct: 1.0,
      paymentDelayDays: 6,
      returns: [
        { product: 'Томат', qty: 35, reason: 'EXPIRED (Chakana do\'konda ortiqcha turib qolgan)', returnAmount: 1155000 }
      ]
    },
    {
      customerName: 'Baraka Minimarketlar Tarmog\'i',
      orderDate: new Date('2026-11-12'),
      deliveryDate: new Date('2026-11-13'),
      items: [
        { product: 'Морковь', qty: 800, price: 12500, discount: 0 },
        { product: 'лук салатный белый', qty: 600, price: 16500, discount: 0 }
      ],
      logisticsCost: 900000,
      paidPct: 0.0, // OVERDUE! 7 days credit term expired
      paymentDelayDays: 0,
      returns: [
        { product: 'лук салатный белый', qty: 40, reason: 'DEFECT (Unib ketish)', returnAmount: 660000 }
      ]
    },

    // --- DISTRIBUTORS (Samarkand, Fergana) ---
    {
      customerName: 'Samarkand Agro Distribution LLC',
      orderDate: new Date('2026-10-15'),
      deliveryDate: new Date('2026-10-17'),
      items: [
        { product: 'Салат Айсберг', qty: 12000, price: 22000, discount: 4500000 },
        { product: 'Томат', qty: 9500, price: 29500, discount: 3500000 },
        { product: 'Морковь', qty: 6000, price: 11000, discount: 1500000 }
      ],
      logisticsCost: 14000000, // Heavy inter-regional logistics
      paidPct: 1.0,
      paymentDelayDays: 28,
      returns: []
    },
    {
      customerName: 'Samarkand Agro Distribution LLC',
      orderDate: new Date('2026-11-01'),
      deliveryDate: new Date('2026-11-03'),
      items: [
        { product: 'Салат Айсберг', qty: 14000, price: 22000, discount: 5000000 },
        { product: 'Томат', qty: 11000, price: 29500, discount: 4000000 }
      ],
      logisticsCost: 16000000,
      paidPct: 0.25, // High overdue balance!
      paymentDelayDays: 15,
      returns: [
        { product: 'Салат Айсберг', qty: 280, reason: 'DEFECT (Distributsiya omborida qabulda rad etilgan)', returnAmount: 6160000 }
      ]
    },
    {
      customerName: 'Fergana Valley Logistics & Distribution',
      orderDate: new Date('2026-10-28'),
      deliveryDate: new Date('2026-10-30'),
      items: [
        { product: 'Капуста белокачанная', qty: 18000, price: 8500, discount: 3000000 },
        { product: 'Морковь', qty: 12000, price: 11000, discount: 2000000 }
      ],
      logisticsCost: 12500000,
      paidPct: 1.0,
      paymentDelayDays: 24,
      returns: []
    },
    {
      customerName: 'Fergana Valley Logistics & Distribution',
      orderDate: new Date('2026-11-16'),
      deliveryDate: new Date('2026-11-18'),
      items: [
        { product: 'Капуста белокачанная', qty: 15000, price: 8500, discount: 2500000 },
        { product: 'лук салатный белый', qty: 8000, price: 15000, discount: 1500000 }
      ],
      logisticsCost: 11000000,
      paidPct: 0.0, // Open receivable
      paymentDelayDays: 0,
      returns: []
    },

    // --- WHOLESALERS (Qo'yliq, Chorsu) ---
    {
      customerName: 'Qo\'yliq Ulgurji Savdo MCHJ',
      orderDate: new Date('2026-10-18'),
      deliveryDate: new Date('2026-10-19'),
      items: [
        { product: 'Капуста белокачанная', qty: 22000, price: 8200, discount: 4000000 },
        { product: 'Морковь', qty: 15000, price: 10800, discount: 3000000 }
      ],
      logisticsCost: 7500000,
      paidPct: 1.0,
      paymentDelayDays: 14,
      returns: []
    },
    {
      customerName: 'Qo\'yliq Ulgurji Savdo MCHJ',
      orderDate: new Date('2026-11-06'),
      deliveryDate: new Date('2026-11-07'),
      items: [
        { product: 'Капуста белокачанная', qty: 25000, price: 8100, discount: 5000000 }, // Margin squeeze: high volume, low price!
        { product: 'Морковь', qty: 18000, price: 10600, discount: 4000000 }
      ],
      logisticsCost: 8500000,
      paidPct: 0.6,
      paymentDelayDays: 12,
      returns: [
        { product: 'Морковь', qty: 320, reason: 'DEFECT (Standart o\'lchamga mos emas)', returnAmount: 3392000 }
      ]
    },
    {
      customerName: 'Chorsu Fresh Trade LLC',
      orderDate: new Date('2026-11-10'),
      deliveryDate: new Date('2026-11-11'),
      items: [
        { product: 'лук салатный белый', qty: 7500, price: 15200, discount: 1200000 },
        { product: 'Томат', qty: 4500, price: 29000, discount: 1000000 }
      ],
      logisticsCost: 3800000,
      paidPct: 0.0, // OVERDUE! 10-day credit term expired
      paymentDelayDays: 0,
      returns: []
    },

    // --- EXPORT_PARTNERS (Eurasia Fresh KZ, Silk Road DE) ---
    {
      customerName: 'Eurasia Fresh Export LLP',
      orderDate: new Date('2026-10-12'),
      deliveryDate: new Date('2026-10-16'),
      items: [
        { product: 'Салат Айсберг', qty: 16000, price: 26000, discount: 5000000 },
        { product: 'Томат', qty: 12500, price: 34000, discount: 4000000 }
      ],
      logisticsCost: 28000000, // International refrigerated export transport
      paidPct: 1.0,
      paymentDelayDays: 28,
      returns: []
    },
    {
      customerName: 'Eurasia Fresh Export LLP',
      orderDate: new Date('2026-11-05'),
      deliveryDate: new Date('2026-11-09'),
      items: [
        { product: 'Салат Айсберг', qty: 18500, price: 26000, discount: 6000000 },
        { product: 'Томат', qty: 14000, price: 34000, discount: 5000000 }
      ],
      logisticsCost: 32000000,
      paidPct: 0.5,
      paymentDelayDays: 20,
      returns: [
        { product: 'Томат', qty: 250, reason: 'CUSTOMS_DELAY (Bojxona tekshiruvida sifati buzilgan)', returnAmount: 8500000 }
      ]
    },
    {
      customerName: 'Silk Road Agro Trade GmbH',
      orderDate: new Date('2026-10-22'),
      deliveryDate: new Date('2026-10-29'),
      items: [
        { product: 'Салат Айсберг', qty: 20000, price: 28000, discount: 8000000 },
        { product: 'Морковь', qty: 15000, price: 13500, discount: 3000000 }
      ],
      logisticsCost: 45000000, // Air/Road EU cold chain
      paidPct: 1.0,
      paymentDelayDays: 42,
      returns: []
    },

    // --- OTHER (Agrofirma Yangiyo'l) ---
    {
      customerName: 'Agrofirma Yangiyo\'l Baraka',
      orderDate: new Date('2026-11-14'),
      deliveryDate: new Date('2026-11-15'),
      items: [
        { product: 'Капуста белокачанная', qty: 5000, price: 8800, discount: 500000 },
        { product: 'Морковь', qty: 3500, price: 11800, discount: 300000 }
      ],
      logisticsCost: 1500000,
      paidPct: 1.0,
      paymentDelayDays: 10,
      returns: []
    }
  ]

  let orderIndex = 100
  let invoiceIndex = 500
  let returnIndex = 10

  for (const oData of ordersData) {
    const cust = savedCustomers.find(c => c.name === oData.customerName)
    if (!cust) continue

    orderIndex++
    invoiceIndex++

    const orderNumber = `SO-2026-${String(orderIndex).padStart(4, '0')}`
    const invoiceNumber = `INV-2026-${String(invoiceIndex).padStart(4, '0')}`

    let grossRevenue = 0
    let totalDiscount = 0
    const orderItems = []

    for (const it of oData.items) {
      const prod = prodMap[it.product]
      if (!prod) continue

      const lineGross = it.qty * it.price
      const lineDisc = it.discount || 0
      const lineNet = lineGross - lineDisc
      const cogsUnit = prod.cogsPerUnit || (it.price * 0.65)

      grossRevenue += lineGross
      totalDiscount += lineDisc

      orderItems.push({
        productId: prod.id,
        quantity: it.qty,
        unitPrice: it.price,
        discount: lineDisc,
        totalPrice: lineNet,
        cogsPerUnit: cogsUnit,
        logisticsCost: Math.round(oData.logisticsCost / oData.items.length)
      })
    }

    const netOrderAmount = grossRevenue - totalDiscount

    // Create sales order
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: cust.id,
        orderDate: oData.orderDate,
        deliveryDate: oData.deliveryDate,
        totalAmount: netOrderAmount,
        discountAmount: totalDiscount,
        logisticsCost: oData.logisticsCost,
        status: 'DELIVERED',
        notes: `${cust.businessRole} uchun yetkazib berilgan partiya`,
        items: {
          create: orderItems
        }
      }
    })

    // Create Invoice with dueDate according to customer's creditTermDays
    const creditDays = cust.creditTermDays || 15
    const dueDate = new Date(oData.orderDate.getTime() + creditDays * 24 * 60 * 60 * 1000)
    const paidAmount = netOrderAmount * oData.paidPct
    const invStatus = oData.paidPct >= 0.999 ? 'PAID' : oData.paidPct > 0 ? 'PARTIAL' : 'UNPAID'

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: 'SALES_INVOICE',
        status: invStatus,
        totalAmount: netOrderAmount,
        paidAmount,
        issuedDate: oData.orderDate,
        dueDate,
        salesOrderId: salesOrder.id,
        customerId: cust.id
      }
    })

    // If paid, create payment transaction
    if (paidAmount > 0) {
      const paidDate = new Date(oData.orderDate.getTime() + (oData.paymentDelayDays || 5) * 24 * 60 * 60 * 1000)
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          amount: paidAmount,
          date: paidDate,
          description: `${invoiceNumber} schot-faktura bo'yicha to'lov (${cust.name})`,
          category: 'SALES_REVENUE',
          bankAccountId: bankAccount.id,
          invoiceId: invoice.id
        }
      })
    }

    // Process Returns if any
    if (oData.returns && oData.returns.length > 0) {
      for (const ret of oData.returns) {
        returnIndex++
        const retNumber = `SR-2026-${String(returnIndex).padStart(4, '0')}`
        const prod = prodMap[ret.product]
        if (!prod) continue

        const returnDate = new Date(oData.deliveryDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        const cogsAmount = ret.qty * (prod.cogsPerUnit || 15000)

        await prisma.salesReturn.create({
          data: {
            returnNumber: retNumber,
            salesOrderId: salesOrder.id,
            customerId: cust.id,
            productId: prod.id,
            quantity: ret.qty,
            unitPrice: Math.round(ret.returnAmount / ret.qty),
            returnAmount: ret.returnAmount,
            cogsAmount,
            reason: ret.reason,
            status: 'APPROVED',
            returnDate
          }
        })
      }
    }
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

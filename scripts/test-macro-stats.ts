import { prisma } from '../src/lib/prisma'

async function main() {
  const [arrivals, expenses, acts, suppliers] = await Promise.all([
    prisma.shopArrival.findMany(),
    prisma.shopExpense.findMany(),
    prisma.incomingRawMaterialAct.findMany({
      select: { productName: true, warehouseKg: true, supplierName: true, actDate: true }
    }),
    prisma.supplier.findMany()
  ])

  // Normalization maps
  // Kirim (Arrivals):
  const rawStats: Record<string, {
    key: string
    name: string
    category: string
    unit: string
    totalArrivalKg: number
    totalExpenseKg: number
    arrivalsCount: number
    lastDate: string
    suppliers: Set<string>
  }> = {
    tomato: {
      key: 'tomato',
      name: 'Томат (Pomidor)',
      category: 'Sabzavot',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    iceberg: {
      key: 'iceberg',
      name: 'Салат Айсберг (Aysberg)',
      category: "Ko'katlar",
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    cabbage: {
      key: 'cabbage',
      name: 'Капуста белокочанная (Karam)',
      category: 'Sabzavot',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    onion: {
      key: 'onion',
      name: 'Лук белый (Oq piyoz)',
      category: 'Sabzavot',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    carrot: {
      key: 'carrot',
      name: 'Морковь (Sabzi)',
      category: 'Sabzavot',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    cucumber: {
      key: 'cucumber',
      name: 'Огурцы (Bodring)',
      category: 'Sabzavot',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    lemon: {
      key: 'lemon',
      name: 'Лимон (Limon)',
      category: 'Meva',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    chlorine: {
      key: 'chlorine',
      name: 'Гипохлорит натрия (Xlor)',
      category: 'Kimyoviy modda',
      unit: 'kg',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    boxes: {
      key: 'boxes',
      name: 'Гофра коробка (Quti)',
      category: 'Qadoqlash',
      unit: 'dona',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    },
    bags: {
      key: 'bags',
      name: 'Полиэтиленовые пакеты (Paket)',
      category: 'Qadoqlash',
      unit: 'dona',
      totalArrivalKg: 0,
      totalExpenseKg: 0,
      arrivalsCount: 0,
      lastDate: '',
      suppliers: new Set()
    }
  }

  // 1. Process Arrivals
  for (const arr of arrivals) {
    const nom = (arr.nomenclature || '').toLowerCase()
    const qty = Number(arr.quantity) || 0
    let targetKey: string | null = null

    if (nom.includes('томат') || nom.includes('помидор')) targetKey = 'tomato'
    else if (nom.includes('айсберг') || nom.includes('айзберг')) targetKey = 'iceberg'
    else if (nom.includes('капуста')) targetKey = 'cabbage'
    else if (nom.includes('лук')) targetKey = 'onion'
    else if (nom.includes('морков')) targetKey = 'carrot'
    else if (nom.includes('огурц') || nom.includes('бодринг')) targetKey = 'cucumber'
    else if (nom.includes('лимон')) targetKey = 'lemon'
    else if (nom.includes('хлор') || nom.includes('гипохлорит')) targetKey = 'chlorine'
    else if (nom.includes('короб') || nom.includes('кароб')) targetKey = 'boxes'
    else if (nom.includes('пакет')) targetKey = 'bags'

    if (targetKey && rawStats[targetKey]) {
      rawStats[targetKey].totalArrivalKg += qty
      rawStats[targetKey].arrivalsCount += 1
      if (arr.date && (!rawStats[targetKey].lastDate || arr.date > rawStats[targetKey].lastDate)) {
        rawStats[targetKey].lastDate = arr.date
      }
      if (arr.supplier) {
        rawStats[targetKey].suppliers.add(arr.supplier.trim())
      }
    }
  }

  // 2. Process Expenses
  for (const exp of expenses) {
    const mats = exp.materials as Record<string, any>
    if (mats && typeof mats === 'object') {
      for (const [key, val] of Object.entries(mats)) {
        const k = key.toLowerCase()
        const qty = Number(val) || 0
        let targetKey: string | null = null

        if (k.includes('томат')) targetKey = 'tomato'
        else if (k.includes('айсберг')) targetKey = 'iceberg'
        else if (k.includes('капуста')) targetKey = 'cabbage'
        else if (k.includes('лук')) targetKey = 'onion'
        else if (k.includes('морков')) targetKey = 'carrot'
        else if (k.includes('огурц')) targetKey = 'cucumber'
        else if (k.includes('лимон')) targetKey = 'lemon'
        else if (k.includes('хлор')) targetKey = 'chlorine'
        else if (k.includes('короб')) targetKey = 'boxes'
        else if (k.includes('пакет')) targetKey = 'bags'

        if (targetKey && rawStats[targetKey]) {
          rawStats[targetKey].totalExpenseKg += qty
        }
      }
    }
  }

  console.log('AGGREGATED RAW MATERIALS:')
  for (const s of Object.values(rawStats)) {
    const balance = s.totalArrivalKg - s.totalExpenseKg
    console.log({
      name: s.name,
      arrival: s.totalArrivalKg.toFixed(1),
      expense: s.totalExpenseKg.toFixed(1),
      balance: balance.toFixed(1),
      unit: s.unit,
      arrivalsCount: s.arrivalsCount,
      lastDate: s.lastDate,
      suppliersCount: s.suppliers.size
    })
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

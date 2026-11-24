import { prisma } from './prisma'

interface RawMatDef {
  key: string
  name: string
  patterns: string[]
  fallbackProductId: number
  shelfLifeDays: number
}

const RAW_MATERIALS: RawMatDef[] = [
  { key: 'iceberg', name: 'Салат Айсберг', patterns: ['айсберг', 'айзберг', 'aysberg'], fallbackProductId: 230, shelfLifeDays: 5 },
  { key: 'tomato', name: 'Томат', patterns: ['томат', 'помидор'], fallbackProductId: 229, shelfLifeDays: 7 },
  { key: 'onion', name: 'лук салатный белый', patterns: ['лук'], fallbackProductId: 234, shelfLifeDays: 30 },
  { key: 'cabbage', name: 'Капуста белокачанная', patterns: ['капуста'], fallbackProductId: 233, shelfLifeDays: 20 },
  { key: 'carrot', name: 'Морковь', patterns: ['морков'], fallbackProductId: 235, shelfLifeDays: 25 },
  { key: 'lemon', name: 'Лимон', patterns: ['лимон'], fallbackProductId: 285, shelfLifeDays: 30 },
  { key: 'cucumber', name: 'Огурцы свежие', patterns: ['огурц'], fallbackProductId: 288, shelfLifeDays: 7 },
  { key: 'lolloRosso', name: 'Lollo Rosso', patterns: ['lollo', 'лолло'], fallbackProductId: 293, shelfLifeDays: 4 },
  { key: 'rukkola', name: 'Руккола', patterns: ['руккол', 'рукол'], fallbackProductId: 292, shelfLifeDays: 4 },
  { key: 'spinach', name: 'Шпинат', patterns: ['шпинат'], fallbackProductId: 294, shelfLifeDays: 4 },
  { key: 'mint', name: 'Мята', patterns: ['мята'], fallbackProductId: 295, shelfLifeDays: 5 },
  { key: 'celery', name: 'Сельдерей', patterns: ['сельдерей'], fallbackProductId: 291, shelfLifeDays: 10 },
  { key: 'box', name: 'гофра каробка', patterns: ['гофра', 'короб', 'кароб'], fallbackProductId: 246, shelfLifeDays: 365 },
  { key: 'bag', name: 'Полиэтиленовые пакеты для айзберг', patterns: ['пакет'], fallbackProductId: 242, shelfLifeDays: 365 },
  { key: 'chlorine', name: 'Гипохлорит натрия', patterns: ['гипохлорит', 'хлор'], fallbackProductId: 231, shelfLifeDays: 90 },
  { key: 'sorbate', name: 'Сорбат калия', patterns: ['сорбат'], fallbackProductId: 237, shelfLifeDays: 180 },
  { key: 'benzoate', name: 'Бензоат натрия порошок', patterns: ['бензоат'], fallbackProductId: 236, shelfLifeDays: 180 },
  { key: 'vinegar', name: 'КИСЛОТА УКСУСНАЯ', patterns: ['уксус'], fallbackProductId: 241, shelfLifeDays: 180 },
]

export async function syncInventoryBatchesFromDailyBalances() {
  try {
    // 1. Find the latest confirmed day report with ending balances
    const allExpenses = await prisma.shopExpense.findMany({
      orderBy: { date: 'desc' }
    })

    let latestExpense: any = null
    let endBalances: Record<string, number> = {}

    for (const exp of allExpenses) {
      const end = (exp?.balances as any)?.report?.balances?.end
      if (end && Object.keys(end).length > 0) {
        latestExpense = exp
        endBalances = end
        break
      }
    }

    if (!latestExpense) {
      console.log('No confirmed daily closing balances found for FIFO sync.')
      return { synced: 0, batchesCount: 0 }
    }

    const latestDate = latestExpense.date

    // 2. Load all products and suppliers
    const [products, suppliers, allArrivals] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.supplier.findMany({ select: { id: true, name: true, shortName: true } }),
      prisma.shopArrival.findMany({
        orderBy: [{ date: 'desc' }, { id: 'desc' }]
      })
    ])

    const supplierMap = new Map<string, number>()
    suppliers.forEach((s) => {
      if (s.name) supplierMap.set(s.name.toLowerCase().trim(), s.id)
      if (s.shortName) supplierMap.set(s.shortName.toLowerCase().trim(), s.id)
    })

    let totalBatchesCreatedOrUpdated = 0
    const activeBatchIds: number[] = []

    for (const mat of RAW_MATERIALS) {
      // Find matching primary Product
      let product = products.find((p) => p.name.toLowerCase().trim() === mat.name.toLowerCase().trim())
      if (!product) {
        product = products.find((p) => mat.patterns.some((pat) => p.name.toLowerCase().includes(pat)))
      }
      if (!product) {
        product = products.find((p) => p.id === mat.fallbackProductId)
      }
      if (!product) continue

      const baseStock = Number(endBalances[mat.key]) || 0

      // Calculate any newer arrivals/expenses past latestDate
      let newerArrivals = 0
      let newerExpenses = 0
      for (const a of allArrivals) {
        if (a.date > latestDate) {
          const nom = String(a.nomenclature || '').toLowerCase()
          if (mat.patterns.some((p) => nom.includes(p))) {
            newerArrivals += Number(a.quantity) || 0
          }
        }
      }
      for (const exp of allExpenses) {
        if (exp.date > latestDate && exp.materials) {
          const mats = exp.materials as Record<string, any>
          for (const [k, v] of Object.entries(mats)) {
            if (mat.patterns.some((p) => k.toLowerCase().includes(p))) {
              newerExpenses += Number(v) || 0
            }
          }
        }
      }

      const targetStock = Math.max(0, Math.round((baseStock + newerArrivals - newerExpenses) * 10) / 10)

      if (targetStock <= 0) {
        // Zero out existing batches for this product
        await prisma.inventoryBatch.updateMany({
          where: { productId: product.id, quantity: { gt: 0 } },
          data: { quantity: 0 }
        })
        continue
      }

      // Filter arrivals for this material
      const matArrivals = allArrivals.filter((a) => {
        const nom = String(a.nomenclature || '').toLowerCase()
        return mat.patterns.some((pat) => nom.includes(pat)) && Number(a.quantity) > 0
      })

      let remainingNeeded = targetStock
      const productBatchIds: number[] = []

      for (const arr of matArrivals) {
        if (remainingNeeded <= 0) break
        const arrQty = Number(arr.quantity) || 0
        if (arrQty <= 0) continue

        const takeQty = Math.round(Math.min(arrQty, remainingNeeded) * 10) / 10
        remainingNeeded = Math.round((remainingNeeded - takeQty) * 10) / 10

        const arrDateStr = arr.date || latestDate
        const receivedAt = new Date(`${arrDateStr}T08:00:00.000Z`)
        const expirationDate = new Date(receivedAt.getTime() + mat.shelfLifeDays * 24 * 60 * 60 * 1000)

        const batchNumber = `BATCH-${product.code || product.id}-${arrDateStr.replace(/-/g, '')}-${arr.id}`
        const supName = String(arr.supplier || '').toLowerCase().trim()
        const supplierId = supplierMap.get(supName) || null

        // Upsert into InventoryBatch
        const batch = await prisma.inventoryBatch.upsert({
          where: { batchNumber },
          create: {
            productId: product.id,
            batchNumber,
            quantity: takeQty,
            cost: null,
            receivedAt,
            expirationDate,
            qcStatus: 'APPROVED',
            supplierBatchNumber: arr.batch || arr.ttnNumber || null,
            supplierId,
          },
          update: {
            quantity: takeQty,
            qcStatus: 'APPROVED',
            expirationDate,
          }
        })

        productBatchIds.push(batch.id)
        activeBatchIds.push(batch.id)
        totalBatchesCreatedOrUpdated++
      }

      // Deactivate any other older batches of this product that are now exhausted
      await prisma.inventoryBatch.updateMany({
        where: {
          productId: product.id,
          id: { notIn: productBatchIds },
          quantity: { gt: 0 }
        },
        data: { quantity: 0 }
      })
    }

    return {
      success: true,
      latestDate,
      totalBatches: totalBatchesCreatedOrUpdated,
      activeBatchesCount: activeBatchIds.length
    }
  } catch (error: any) {
    console.error('Error in syncInventoryBatchesFromDailyBalances:', error)
    return { success: false, error: error.message }
  }
}

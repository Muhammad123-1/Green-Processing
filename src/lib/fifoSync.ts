import { prisma } from './prisma'
import { matchSyrye12Key, getLatestSyryeClosingBalances, toNum } from './shopReport'

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  const r = Math.round(n * 100) / 100
  return Math.abs(r) < 0.01 ? 0 : r
}

interface SyryeMatDef {
  key: string
  name: string
  fallbackProductId: number
  shelfLifeDays: number
}

export const SYRYE_12_DEFS: SyryeMatDef[] = [
  { key: 'iceberg', name: 'Салат Айсберг', fallbackProductId: 230, shelfLifeDays: 5 },
  { key: 'tomato', name: 'Томат', fallbackProductId: 229, shelfLifeDays: 7 },
  { key: 'onion', name: 'лук салатный белый', fallbackProductId: 234, shelfLifeDays: 30 },
  { key: 'cabbage', name: 'Капуста белокачанная', fallbackProductId: 233, shelfLifeDays: 20 },
  { key: 'carrot', name: 'Морковь', fallbackProductId: 235, shelfLifeDays: 25 },
  { key: 'lemon', name: 'Лимон', fallbackProductId: 285, shelfLifeDays: 30 },
  { key: 'cucumber', name: 'Огурцы свежие', fallbackProductId: 288, shelfLifeDays: 7 },
  { key: 'lolloRosso', name: 'Lollo Rosso', fallbackProductId: 293, shelfLifeDays: 4 },
  { key: 'rukkola', name: 'Руккола', fallbackProductId: 292, shelfLifeDays: 4 },
  { key: 'spinach', name: 'Шпинат', fallbackProductId: 294, shelfLifeDays: 4 },
  { key: 'mint', name: 'Мята', fallbackProductId: 295, shelfLifeDays: 5 },
  { key: 'celery', name: 'Сельдерей', fallbackProductId: 291, shelfLifeDays: 10 },
]

function inferNonSyryeProductMeta(name: string): { category: string; unit: string; minStockLevel: number; shelfLifeDays: number } {
  const s = name.toLowerCase().trim()
  if (
    s.includes('пакет') ||
    s.includes('каробка') ||
    s.includes('короб') ||
    s.includes('karobka') ||
    s.includes('этикетк') ||
    s.includes('стрич') ||
    s.includes('яшик') ||
    s.includes('падон')
  ) {
    return { category: 'Qadoqlash & Idishlar', unit: 'dona', minStockLevel: 2000, shelfLifeDays: 365 }
  }
  if (
    s.includes('перчатк') ||
    s.includes('шапка') ||
    s.includes('бахила') ||
    s.includes('маска') ||
    s.includes('халат') ||
    s.includes('бумага') ||
    s.includes('салфетк') ||
    s.includes('полотенц') ||
    s.includes('рукавадник')
  ) {
    return { category: "Xo'jalik & Gigiyena", unit: 'dona', minStockLevel: 500, shelfLifeDays: 365 }
  }
  if (
    s.includes('хлор') ||
    s.includes('гипохлорит') ||
    s.includes('кислот') ||
    s.includes('уксус') ||
    s.includes('бензоат') ||
    s.includes('сорбат') ||
    s.includes('тайгета') ||
    s.includes('divosan') ||
    s.includes('suma') ||
    s.includes('alco') ||
    s.includes('solides')
  ) {
    return {
      category: 'Kimyoviy & Dezinfeksiya',
      unit: s.includes('вода') || s.includes('тайгета') ? 'litr' : 'kg',
      minStockLevel: 100,
      shelfLifeDays: 180,
    }
  }
  if (s.includes('вода')) {
    return { category: 'Suv & Ichimliklar', unit: 'litr', minStockLevel: 1000, shelfLifeDays: 180 }
  }
  return { category: 'Xomashyo & Oziq-ovqat', unit: 'kg', minStockLevel: 500, shelfLifeDays: 30 }
}

/**
 * Maps a non-Сырье product/arrival/expense name to a canonical group key
 * when multiple aliases or expense columns share the same stock pool,
 * or returns the normalized lowercase product name for individual items.
 */
export function matchNonSyryeGroupKey(rawName: any): string {
  const s = String(rawName ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s) return ''
  if (s.includes('уксус') || s.includes('кислота уксусная')) return 'group:vinegar'
  if (s.includes('гипохлорит') || s === 'хлор' || s.includes('хлор')) return 'group:chlorine'
  if (s.includes('сорбат')) return 'group:sorbate'
  if (s.includes('бензоат')) return 'group:benzoate'
  if (s.includes('тайгета')) return 'group:taygeta'
  if (s.includes('этикет')) return 'group:label'
  if ((s.includes('короб') || s.includes('кароб') || s.includes('karobka')) && !s.includes('брак')) {
    return 'group:box'
  }
  if (s.includes('пакет') && !s.includes('мусир') && !s.includes('брак')) {
    return 'group:bag'
  }
  if (s.includes('перчат') || s.includes('perchat')) {
    if (
      s.includes('(м)') ||
      s.includes('размер м') ||
      s.includes('размер m') ||
      s.includes(' m ') ||
      s.endsWith(' м') ||
      s.endsWith(' m')
    ) {
      return 'group:glove_m'
    }
    if (
      s.includes('(л)') ||
      s.includes('(l)') ||
      s.includes('размер l') ||
      s.includes('размер л') ||
      s.includes(' l ') ||
      s.endsWith(' л') ||
      s.endsWith(' l')
    ) {
      return 'group:glove_l'
    }
    return 'group:glove_other'
  }
  return `item:${s}`
}

export async function syncInventoryBatchesFromDailyBalances() {
  try {
    // 1. Load expenses, arrivals, products, and suppliers
    const [allExpenses, allArrivals, existingProducts, suppliers] = await Promise.all([
      prisma.shopExpense.findMany({ orderBy: { date: 'desc' } }),
      prisma.shopArrival.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } }),
      prisma.supplier.findMany({ select: { id: true, name: true, shortName: true } }),
    ])

    const { latestDate, endBalances } = getLatestSyryeClosingBalances(allExpenses)

    const supplierMap = new Map<string, number>()
    suppliers.forEach((s) => {
      if (s.name) supplierMap.set(s.name.toLowerCase().trim(), s.id)
      if (s.shortName) supplierMap.set(s.shortName.toLowerCase().trim(), s.id)
    })

    // Ensure every non-empty nomenclature from ShopArrival exists in Product table
    const products = [...existingProducts]
    const productByNormName = new Map<string, (typeof products)[0]>()
    for (const p of products) {
      productByNormName.set(p.name.trim().toLowerCase().replace(/\s+/g, ' '), p)
    }

    for (const arr of allArrivals) {
      const nom = (arr.nomenclature || '').trim()
      if (!nom || nom.length < 2) continue
      if (matchSyrye12Key(nom)) continue // handled by SYRYE_12_DEFS
      if (matchNonSyryeGroupKey(nom).startsWith('group:')) continue // handled by groupedDefs
      const normNom = nom.toLowerCase().replace(/\s+/g, ' ')
      if (!productByNormName.has(normNom)) {
        const meta = inferNonSyryeProductMeta(nom)
        const slug = nom.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '').slice(0, 4).toUpperCase() || 'MAT'
        const code = `PRD-${slug}-${Math.floor(100 + Math.random() * 900)}`
        try {
          const created = await prisma.product.create({
            data: {
              name: nom,
              code,
              category: meta.category,
              unit: meta.unit,
              minStockLevel: meta.minStockLevel,
              shelfLifeDays: meta.shelfLifeDays,
              type: 'RAW_MATERIAL',
              isActive: false,
            },
          })
          products.push(created)
          productByNormName.set(normNom, created)
        } catch {
          // ignore race/duplicate
        }
      }
    }

    let totalBatchesCreatedOrUpdated = 0
    const activeBatchIds: number[] = []
    const handledProductIds = new Set<number>()

    // Helper to allocate targetStock for a primary product from its matching arrivals
    const allocateStockToProductBatches = async (
      product: (typeof products)[0],
      targetStock: number,
      matArrivals: typeof allArrivals,
      shelfLifeDays: number,
      refDateStr: string
    ) => {
      handledProductIds.add(product.id)

      if (targetStock <= 0) {
        await prisma.inventoryBatch.updateMany({
          where: { productId: product.id, quantity: { gt: 0 } },
          data: { quantity: 0 },
        })
        return
      }

      let remainingNeeded = round2(targetStock)
      const productBatchIds: number[] = []

      for (const arr of matArrivals) {
        if (remainingNeeded <= 0) break
        const arrQty = round2(Number(arr.quantity) || 0)
        if (arrQty <= 0) continue

        const takeQty = round2(Math.min(arrQty, remainingNeeded))
        if (takeQty <= 0) continue
        remainingNeeded = round2(remainingNeeded - takeQty)

        const arrDateStr = arr.date || refDateStr || new Date().toISOString().slice(0, 10)
        const receivedAt = new Date(`${arrDateStr}T08:00:00.000Z`)
        const validReceivedAt = isNaN(receivedAt.getTime()) ? new Date() : receivedAt
        const expirationDate = new Date(validReceivedAt.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000)

        const batchNumber = `BATCH-${product.code || product.id}-${arrDateStr.replace(/[^0-9]/g, '')}-${arr.id}`
        const supName = String(arr.supplier || '').toLowerCase().trim()
        const supplierId = supplierMap.get(supName) || null

        const batch = await prisma.inventoryBatch.upsert({
          where: { batchNumber },
          create: {
            productId: product.id,
            batchNumber,
            quantity: takeQty,
            cost: null,
            receivedAt: validReceivedAt,
            expirationDate,
            qcStatus: 'APPROVED',
            supplierBatchNumber: arr.batch || arr.ttnNumber || null,
            supplierId,
          },
          update: {
            quantity: takeQty,
            qcStatus: 'APPROVED',
            expirationDate,
          },
        })

        productBatchIds.push(batch.id)
        activeBatchIds.push(batch.id)
        totalBatchesCreatedOrUpdated++
      }

      // If remainingNeeded > 0 (e.g. from opening balance before recent arrivals),
      // store the remainder in an authoritative closing-balance batch so totalQuantity === targetStock!
      if (remainingNeeded > 0) {
        const baseDateStr = refDateStr || new Date().toISOString().slice(0, 10)
        const receivedAt = new Date(`${baseDateStr}T08:00:00.000Z`)
        const validReceivedAt = isNaN(receivedAt.getTime()) ? new Date() : receivedAt
        const expirationDate = new Date(validReceivedAt.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000)
        const ostBatchNumber = `BATCH-${product.code || product.id}-${baseDateStr.replace(/[^0-9]/g, '')}-OST`

        const batch = await prisma.inventoryBatch.upsert({
          where: { batchNumber: ostBatchNumber },
          create: {
            productId: product.id,
            batchNumber: ostBatchNumber,
            quantity: remainingNeeded,
            cost: null,
            receivedAt: validReceivedAt,
            expirationDate,
            qcStatus: 'APPROVED',
            supplierBatchNumber: '1',
            supplierId: null,
          },
          update: {
            quantity: remainingNeeded,
            qcStatus: 'APPROVED',
            expirationDate,
          },
        })

        productBatchIds.push(batch.id)
        activeBatchIds.push(batch.id)
        totalBatchesCreatedOrUpdated++
      }

      // Zero out any other batches of this product not in productBatchIds
      await prisma.inventoryBatch.updateMany({
        where: {
          productId: product.id,
          id: { notIn: productBatchIds },
          quantity: { gt: 0 },
        },
        data: { quantity: 0 },
      })
    }

    // =========================================================================
    // PART A: 12 Core "Сырье" Raw Materials -> from "остатка конец дня" + post-date delta
    // =========================================================================
    for (const mat of SYRYE_12_DEFS) {
      let product = products.find((p) => p.id === mat.fallbackProductId)
      if (!product) {
        product = products.find((p) => p.name.toLowerCase().trim() === mat.name.toLowerCase().trim())
      }
      if (!product) {
        product = products.find((p) => matchSyrye12Key(p.name) === mat.key)
      }
      if (!product) continue

      // Zero out any secondary duplicate Product records that also match this Syrye key (e.g. "Огурцы" vs "Огурцы свежие")
      const secondaryDuplicates = products.filter(
        (p) => p.id !== product!.id && matchSyrye12Key(p.name) === mat.key
      )
      for (const dup of secondaryDuplicates) {
        handledProductIds.add(dup.id)
        await prisma.inventoryBatch.updateMany({
          where: { productId: dup.id, quantity: { gt: 0 } },
          data: { quantity: 0 },
        })
      }

      const baseStock = latestDate ? round2(toNum(endBalances[mat.key])) : 0

      let newerArrivals = 0
      let newerExpenses = 0
      if (latestDate) {
        for (const a of allArrivals) {
          if (a.date > latestDate && matchSyrye12Key(a.nomenclature) === mat.key) {
            newerArrivals += toNum(a.quantity)
          }
        }
        for (const exp of allExpenses) {
          if (exp.date > latestDate && exp.materials) {
            const mats = exp.materials as Record<string, any>
            for (const [k, v] of Object.entries(mats)) {
              if (matchSyrye12Key(k) === mat.key) {
                newerExpenses += toNum(v)
              }
            }
          }
        }
      }

      const targetStock = Math.max(0, round2(baseStock + newerArrivals - newerExpenses))
      const matArrivals = allArrivals.filter((a) => matchSyrye12Key(a.nomenclature) === mat.key)

      await allocateStockToProductBatches(
        product,
        targetStock,
        matArrivals,
        mat.shelfLifeDays,
        latestDate || '2026-11-24'
      )
    }

    // =========================================================================
    // PART B: All Other Products (Not in 12 "Сырье" table) -> Prixod - Rasxod
    // =========================================================================
    // Pre-aggregate total expenses by non-Syrye group key and by exact lowercase name
    const expenseByGroup = new Map<string, number>()
    const expenseByExact = new Map<string, number>()

    for (const exp of allExpenses) {
      const mats = (exp.materials || {}) as Record<string, any>
      for (const [k, v] of Object.entries(mats)) {
        const qty = toNum(v)
        if (qty <= 0) continue
        if (matchSyrye12Key(k)) continue
        const kl = k.trim().toLowerCase().replace(/\s+/g, ' ')
        if (kl.includes('кухня') || kl.includes('ошхона') || kl.includes('сес') || kl.includes('ses')) continue

        expenseByExact.set(kl, round2((expenseByExact.get(kl) || 0) + qty))
        const gk = matchNonSyryeGroupKey(k)
        if (gk) {
          expenseByGroup.set(gk, round2((expenseByGroup.get(gk) || 0) + qty))
        }
      }
    }

    // Group non-Syrye arrivals by exact normalized nomenclature
    const arrivalsByExact = new Map<string, typeof allArrivals>()
    const arrivalsByGroup = new Map<string, typeof allArrivals>()

    for (const arr of allArrivals) {
      const nom = (arr.nomenclature || '').trim()
      if (!nom || matchSyrye12Key(nom)) continue
      const nl = nom.toLowerCase().replace(/\s+/g, ' ')
      const eList = arrivalsByExact.get(nl) || []
      eList.push(arr)
      arrivalsByExact.set(nl, eList)

      const gk = matchNonSyryeGroupKey(nom)
      if (gk) {
        const gList = arrivalsByGroup.get(gk) || []
        gList.push(arr)
        arrivalsByGroup.set(gk, gList)
      }
    }

    // Extract authoritative consumable balances from latest shop expense if present
    const latestExp = allExpenses.find((e) => e.date === latestDate) || allExpenses[0]
    const latestConsumables = (latestExp?.balances as any)?.consumables || {}

    // Handle grouped consumables (vinegar, chlorine, sorbate, benzoate, label, box) on their primary product
    const groupedDefs: Array<{ groupKey: string; fallbackId: number; matchFn: (name: string) => boolean; authoritativeStock?: number }> = [
      {
        groupKey: 'group:box',
        fallbackId: 246,
        matchFn: (s) => (s.includes('короб') || s.includes('кароб') || s.includes('karobka')) && !s.includes('брак'),
        authoritativeStock: latestConsumables.box !== undefined ? toNum(latestConsumables.box) : 7461,
      },
      {
        groupKey: 'group:chlorine',
        fallbackId: 231,
        matchFn: (s) => s.includes('гипохлорит') || s.includes('хлор'),
        authoritativeStock: latestConsumables.chlorine !== undefined ? toNum(latestConsumables.chlorine) : 513.87,
      },
      { groupKey: 'group:vinegar', fallbackId: 241, matchFn: (s) => s.includes('уксус'), authoritativeStock: 0 },
      { groupKey: 'group:sorbate', fallbackId: 237, matchFn: (s) => s.includes('сорбат'), authoritativeStock: 0 },
      { groupKey: 'group:benzoate', fallbackId: 236, matchFn: (s) => s.includes('бензоат'), authoritativeStock: 0 },
      { groupKey: 'group:label', fallbackId: 290, matchFn: (s) => s.includes('этикет'), authoritativeStock: 0 },
      {
        groupKey: 'group:glove_m',
        fallbackId: 250,
        matchFn: (s) =>
          (s.includes('перчат') || s.includes('perchat')) &&
          (s.includes('(м)') ||
            s.includes('размер м') ||
            s.includes('размер m') ||
            s.includes(' m ') ||
            s.endsWith(' м') ||
            s.endsWith(' m')),
        authoritativeStock: 0,
      },
      {
        groupKey: 'group:glove_l',
        fallbackId: 251,
        matchFn: (s) =>
          (s.includes('перчат') || s.includes('perchat')) &&
          (s.includes('(л)') ||
            s.includes('(l)') ||
            s.includes('размер l') ||
            s.includes('размер л') ||
            s.includes(' l ') ||
            s.endsWith(' л') ||
            s.endsWith(' l')),
        authoritativeStock: 0,
      },
    ]

    for (const gDef of groupedDefs) {
      let primaryProd = products.find((p) => p.id === gDef.fallbackId)
      if (!primaryProd) {
        primaryProd = products.find((p) => !handledProductIds.has(p.id) && gDef.matchFn(p.name.toLowerCase()))
      }
      if (!primaryProd) continue

      const otherGroupProds = products.filter(
        (p) => p.id !== primaryProd!.id && !handledProductIds.has(p.id) && gDef.matchFn(p.name.toLowerCase())
      )
      for (const dup of otherGroupProds) {
        handledProductIds.add(dup.id)
        await prisma.inventoryBatch.updateMany({
          where: { productId: dup.id, quantity: { gt: 0 } },
          data: { quantity: 0 },
        })
      }

      const gArrivals = (arrivalsByGroup.get(gDef.groupKey) || []).filter(
        (a) => !a.date || a.date >= '2026-01-01'
      )
      const totalArr = gArrivals.reduce((s, a) => s + toNum(a.quantity), 0)
      const totalExp = expenseByGroup.get(gDef.groupKey) || 0
      const targetStock =
        gDef.authoritativeStock !== undefined
          ? gDef.authoritativeStock
          : Math.max(0, round2(totalArr - totalExp))

      await allocateStockToProductBatches(
        primaryProd,
        targetStock,
        gArrivals,
        primaryProd.shelfLifeDays || 365,
        latestDate || '2026-11-25'
      )
    }

    // Zero out all other products and keep only the 14 real products active
    const REAL_14_PRODUCT_IDS = new Set([230, 229, 234, 288, 285, 291, 292, 293, 294, 295, 233, 235, 246, 231])
    for (const product of products) {
      if (handledProductIds.has(product.id) && REAL_14_PRODUCT_IDS.has(product.id)) continue
      await prisma.inventoryBatch.updateMany({
        where: { productId: product.id, quantity: { gt: 0 } },
        data: { quantity: 0 },
      })
    }
    await prisma.product.updateMany({
      where: { id: { notIn: Array.from(REAL_14_PRODUCT_IDS) }, isActive: true },
      data: { isActive: false },
    })

    return {
      success: true,
      latestDate,
      totalBatches: totalBatchesCreatedOrUpdated,
      activeBatchesCount: activeBatchIds.length,
    }
  } catch (error: any) {
    console.error('Error in syncInventoryBatchesFromDailyBalances:', error)
    return { success: false, error: error.message }
  }
}

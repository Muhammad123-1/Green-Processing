import { prisma } from '@/lib/prisma'

/**
 * Checks if a warehouse arrival nomenclature is a raw material (Сырьё / Sabzavotlar / Mevalar / Ko'katlar)
 * Excludes packaging, chemicals, waste bags, gloves, household and office supplies.
 */
export function isRawMaterialNomenclature(name: string): boolean {
  if (!name) return false
  const n = name.toLowerCase().trim()

  // Non-raw material exclusions
  const nonRawKeywords = [
    'каробка', 'коробка', 'пакет', 'мусор', 'мусир', 'скотч',
    'перчатка', 'перчатки', 'пленка', 'плёнка', 'стрейч', 'стреч',
    'сода', 'хлор', 'мыло', 'белизна', 'дез', 'антисептик',
    'моющее', 'средство', 'губка', 'салфетка', 'фартук', 'бахилы',
    'шапочки', 'этикетка', 'маркер', 'бумага', 'канцелярия'
  ]
  if (nonRawKeywords.some(kw => n.includes(kw))) {
    return false
  }

  // Raw vegetable, salad, herb, fruit keywords
  const rawKeywords = [
    'томат', 'помидор', 'айсберг', 'айзберг', 'aysberg', 'салат',
    'капуста', 'морков', 'лук', 'огур', 'лимон', 'сельдерей',
    'руккола', 'рокет', 'lollo', 'лолло', 'шпинат', 'зелень',
    'укроп', 'петрушка', 'кинза', 'базилик', 'мята', 'тархун',
    'перец', 'чеснок', 'имбирь', 'редис', 'свекла', 'баклажан',
    'кабачок', 'брокколи', 'цветная', 'пекинская', 'романо',
    'ромен', 'корн', 'фризе', 'микс', 'сырье', 'сырьё',
    'соль', 'туз', 'сахар', 'уксус', 'масло'
  ]
  return rawKeywords.some(kw => n.includes(kw))
}

/**
 * Normalizes a raw material name to the standard Incoming Acts category
 */
export function normalizeRawMaterialName(name: string): string {
  if (!name) return 'XOMASHYO'
  const n = name.toUpperCase().trim()

  if (n.includes('ТОМАТ') || n.includes('ПОМИДОР')) return 'ТОМАТ'
  if (n.includes('АЙСБЕРГ') || n.includes('АЙЗБЕРГ') || n.includes('AYSBERG') || (n.includes('САЛАТ') && !n.includes('ЛУК'))) return 'САЛАТ АЙСБЕРГ'
  if (n.includes('КАПУСТА') || n.includes('KARAM')) return 'КАПУСТА БЕЛОКОЧАННАЯ'
  if (n.includes('МОРКОВ') || n.includes('SABZI')) return 'МОРКОВЬ'
  if (n.includes('ЛУК') || n.includes('PIYOZ')) return 'ЛУК БЕЛЫЙ'
  if (n.includes('ОГУР') || n.includes('BODRING')) return 'ОГУРЦЫ СВЕЖИЕ'
  if (n.includes('ЛИМОН')) return 'ЛИМОН'
  if (n.includes('СЕЛЬДЕРЕЙ')) return 'СЕЛЬДЕРЕЙ'
  if (n.includes('РУККОЛА')) return 'РУККОЛА'
  if (n.includes('ЛОЛЛО') || n.includes('LOLL')) return 'ЛОЛЛО РОССО'
  if (n.includes('ШПИНАТ')) return 'ШПИНАТ'

  return n
}

/**
 * Returns standard default parameters for a raw material category
 */
export function getRawMaterialDefaults(normName: string) {
  const p = normName.toUpperCase()
  if (p === 'ТОМАТ') {
    return {
      temperature: '18 °C',
      diameterWeight: '6-7 см',
      pricePerKg: 26000,
    }
  }
  if (p === 'САЛАТ АЙСБЕРГ') {
    return {
      temperature: '8 °C',
      diameterWeight: '400г-700г 12см',
      pricePerKg: 17500,
    }
  }
  if (p === 'КАПУСТА БЕЛОКОЧАННАЯ') {
    return {
      temperature: '10 °C',
      diameterWeight: '1-2 кг',
      pricePerKg: 5000,
    }
  }
  if (p === 'МОРКОВЬ') {
    return {
      temperature: '12 °C',
      diameterWeight: '3-4 см',
      pricePerKg: 6500,
    }
  }
  if (p === 'ЛУК БЕЛЫЙ') {
    return {
      temperature: '14 °C',
      diameterWeight: '5-6 см',
      pricePerKg: 4500,
    }
  }
  if (p === 'ОГУРЦЫ СВЕЖИЕ') {
    return {
      temperature: '12 °C',
      diameterWeight: '10-15 см',
      pricePerKg: 18000,
    }
  }
  if (p === 'ЛИМОН') {
    return {
      temperature: '10 °C',
      diameterWeight: '5.5 см',
      pricePerKg: 28000,
    }
  }
  return {
    temperature: '12 °C',
    diameterWeight: 'Standart',
    pricePerKg: 15000,
  }
}

/**
 * Computes the next sequential act number for a given product
 */
export async function getNextActNumberForProduct(productName: string, tx?: any): Promise<string> {
  const db = tx || prisma
  const acts = await db.incomingRawMaterialAct.findMany({
    where: { productName },
    select: { actNumber: true },
  })

  let maxNum = 0
  for (const a of acts) {
    const n = parseInt(a.actNumber, 10)
    if (!isNaN(n) && n > maxNum) {
      maxNum = n
    }
  }
  return String(maxNum + 1)
}

/**
 * Synchronizes a single warehouse arrival into IncomingRawMaterialAct.
 * If the arrival is raw material and not yet in incoming acts, creates an act with standard defaults (4 - Yaxshi, 1/0).
 * If it already exists, updates quantity, supplier, and batch.
 */
export async function syncIncomingActFromArrival(
  arrival: {
    id?: number
    date: string
    nomenclature: string
    quantity: number
    supplier?: string | null
    batch?: string | null
  },
  tx?: any
): Promise<{ action: 'created' | 'updated' | 'skipped'; actId?: number }> {
  if (!isRawMaterialNomenclature(arrival.nomenclature)) {
    return { action: 'skipped' }
  }

  const db = tx || prisma
  const normName = normalizeRawMaterialName(arrival.nomenclature)
  const defaults = getRawMaterialDefaults(normName)
  const batchStr = arrival.batch ? String(arrival.batch).trim() : '1'
  const supplierStr = arrival.supplier ? String(arrival.supplier).trim() : "Noma'lum ta'minotchi"
  const dateStr = String(arrival.date).trim()
  const qty = Number(arrival.quantity) || 0

  // 1. Try to find existing act by arrivalId in rawValues OR by matching (date, product, batch, supplier)
  let existingAct = null

  if (arrival.id) {
    const candidates = await db.incomingRawMaterialAct.findMany({
      where: {
        actDate: dateStr,
        productName: normName,
      },
    })

    for (const c of candidates) {
      const rv = c.rawValues as any
      if (rv && rv.arrivalId === arrival.id) {
        existingAct = c
        break
      }
    }
  }

  if (!existingAct) {
    existingAct = await db.incomingRawMaterialAct.findFirst({
      where: {
        actDate: dateStr,
        productName: normName,
        batchNumber: batchStr,
        supplierName: supplierStr,
      },
    })
  }

  if (existingAct) {
    // Update existing act: keep quantity, supplier, batch in sync
    await db.incomingRawMaterialAct.update({
      where: { id: existingAct.id },
      data: {
        warehouseKg: qty,
        supplierName: supplierStr,
        batchNumber: batchStr,
        actDate: dateStr,
        // Only update rawValues if arrivalId wasn't previously linked
        rawValues: {
          ...(typeof existingAct.rawValues === 'object' && existingAct.rawValues !== null ? existingAct.rawValues : {}),
          arrivalId: arrival.id || (existingAct.rawValues as any)?.arrivalId,
          lastSyncedAt: new Date().toISOString(),
        },
      },
    })
    return { action: 'updated', actId: existingAct.id }
  }

  // 2. Create new act with standard auto-filled 1/0 and 4 - Yaxshi rating
  const nextActNum = await getNextActNumberForProduct(normName, db)

  const created = await db.incomingRawMaterialAct.create({
    data: {
      actNumber: nextActNum,
      actDate: dateStr,
      productName: normName,
      supplierName: supplierStr,
      temperature: defaults.temperature,
      transportCondition: 1, // 1 = Muvofiq / Qoniqarli
      hasDocumentation: 1,   // 1 = Mavjud / Ha
      structure: 1,          // 1 = Muvofiq (Zich, qarsildoq)
      leafColor: 1,          // 1 = Muvofiq (Yorqin, o'ziga xos)
      tasteSmell: 1,         // 1 = Muvofiq (Toza)
      internalOxidation: 0,  // 0 = Otsutstvuyet (Norma)
      insectTraces: 0,       // 0 = Otsutstvuyet (Norma)
      rotDiseases: 0,        // 0 = Otsutstvuyet (Norma)
      stemCut: 1,            // 1 = Muvofiq (To'g'ri kesilgan)
      density: 1,            // 1 = Standart zichlik
      diameterWeight: defaults.diameterWeight,
      outerLeavesRemoved: 1, // 1 = Ha
      noMechanicalDamage: 1, // 1 = Ha / Shikastlanmagan
      batchNumber: batchStr,
      decisionRating: 4,     // 4 - Yaxshi / Ruxsat berilgan
      decisionText: '4 - Yaxshi',
      warehouseKg: qty,
      inspectorName: 'Камбарова А.М.',
      pricePerKg: defaults.pricePerKg,
      notes: `Ombor kirimidan (Prixod #${arrival.id || 'yangi'}) avtomatik shakllantirilgan sifat akti`,
      rawValues: {
        arrivalId: arrival.id,
        autoGenerated: true,
        generatedAt: new Date().toISOString(),
      },
      isEdited: false,
    },
  })

  return { action: 'created', actId: created.id }
}

/**
 * High-performance bulk synchronization of warehouse arrivals in ShopArrival
 * into IncomingRawMaterialAct. Pre-loads existing acts to prevent N+1 queries.
 */
export async function syncAllShopArrivalsToIncomingActs(): Promise<{
  totalArrivals: number
  created: number
  updated: number
  skipped: number
}> {
  // 1. Preload all existing acts
  const existingActs = await prisma.incomingRawMaterialAct.findMany({
    select: {
      id: true,
      actNumber: true,
      actDate: true,
      productName: true,
      supplierName: true,
      batchNumber: true,
      warehouseKg: true,
      rawValues: true,
    },
  })

  const byArrivalId = new Map<number, typeof existingActs[0]>()
  const byComposite = new Map<string, typeof existingActs[0]>()
  const maxActNumberPerProduct = new Map<string, number>()

  for (const act of existingActs) {
    const rv = act.rawValues as any
    if (rv && typeof rv.arrivalId === 'number') {
      byArrivalId.set(rv.arrivalId, act)
    }

    const key = `${act.actDate}:::${act.productName}:::${act.batchNumber || ''}:::${act.supplierName}`.toLowerCase()
    byComposite.set(key, act)

    const num = parseInt(act.actNumber, 10)
    if (!isNaN(num)) {
      const currentMax = maxActNumberPerProduct.get(act.productName) || 0
      if (num > currentMax) {
        maxActNumberPerProduct.set(act.productName, num)
      }
    }
  }

  // 2. Fetch all arrivals
  const arrivals = await prisma.shopArrival.findMany({
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })

  let created = 0
  let updated = 0
  let skipped = 0

  for (const arr of arrivals) {
    if (!isRawMaterialNomenclature(arr.nomenclature)) {
      skipped++
      continue
    }

    const normName = normalizeRawMaterialName(arr.nomenclature)
    const defaults = getRawMaterialDefaults(normName)
    const batchStr = arr.batch ? String(arr.batch).trim() : '1'
    const supplierStr = arr.supplier ? String(arr.supplier).trim() : "Noma'lum ta'minotchi"
    const dateStr = String(arr.date).trim()
    const qty = Number(arr.quantity) || 0

    // Match existing
    let match = arr.id ? byArrivalId.get(arr.id) : null
    if (!match) {
      const compKey = `${dateStr}:::${normName}:::${batchStr}:::${supplierStr}`.toLowerCase()
      match = byComposite.get(compKey) || null
    }

    if (match) {
      // Check if update needed
      if (
        Math.abs((match.warehouseKg || 0) - qty) > 0.01 ||
        match.supplierName !== supplierStr ||
        match.batchNumber !== batchStr ||
        match.actDate !== dateStr
      ) {
        await prisma.incomingRawMaterialAct.update({
          where: { id: match.id },
          data: {
            warehouseKg: qty,
            supplierName: supplierStr,
            batchNumber: batchStr,
            actDate: dateStr,
            rawValues: {
              ...(typeof match.rawValues === 'object' && match.rawValues !== null ? match.rawValues : {}),
              arrivalId: arr.id,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        })
        updated++
      } else {
        skipped++
      }
    } else {
      // Create new act
      const currentMax = maxActNumberPerProduct.get(normName) || 0
      const nextNum = currentMax + 1
      maxActNumberPerProduct.set(normName, nextNum)

      const newAct = await prisma.incomingRawMaterialAct.create({
        data: {
          actNumber: String(nextNum),
          actDate: dateStr,
          productName: normName,
          supplierName: supplierStr,
          temperature: defaults.temperature,
          transportCondition: 1,
          hasDocumentation: 1,
          structure: 1,
          leafColor: 1,
          tasteSmell: 1,
          internalOxidation: 0,
          insectTraces: 0,
          rotDiseases: 0,
          stemCut: 1,
          density: 1,
          diameterWeight: defaults.diameterWeight,
          outerLeavesRemoved: 1,
          noMechanicalDamage: 1,
          batchNumber: batchStr,
          decisionRating: 4,
          decisionText: '4 - Yaxshi',
          warehouseKg: qty,
          inspectorName: 'Камбарова А.М.',
          pricePerKg: defaults.pricePerKg,
          notes: `Ombor kirimidan (Prixod #${arr.id || 'yangi'}) avtomatik shakllantirilgan sifat akti`,
          rawValues: {
            arrivalId: arr.id,
            autoGenerated: true,
            generatedAt: new Date().toISOString(),
          },
          isEdited: false,
        },
      })

      if (arr.id) byArrivalId.set(arr.id, newAct as any)
      const compKey = `${dateStr}:::${normName}:::${batchStr}:::${supplierStr}`.toLowerCase()
      byComposite.set(compKey, newAct as any)
      created++
    }
  }

  return {
    totalArrivals: arrivals.length,
    created,
    updated,
    skipped,
  }
}

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

export interface RawMaterialDefaults {
  temperature: string
  transportCondition: number
  hasDocumentation: number
  structure: number
  leafColor: number
  tasteSmell: number
  internalOxidation: number
  insectTraces: number
  rotDiseases: number
  stemCut: number
  density: number
  diameterWeight: string
  outerLeavesRemoved: number
  noMechanicalDamage: number
  pricePerKg: number
  rawValues: Record<string, any>
}

/**
 * Returns standard default parameters for a raw material category
 * Exactly matching the company's established quality parameters and historical Excel sheets.
 */
export function getRawMaterialDefaults(normName: string): RawMaterialDefaults {
  const p = normName.toUpperCase()

  // 1. ТОМАТ (Pomidor)
  // Standards: 18 °C, 1 0 1 0 1 0 1 1 0 0 нет 1 0, Baho: 4 - Yaxshi, Narxi: 26,000 so'm
  if (p === 'ТОМАТ') {
    return {
      temperature: '18',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 0,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 1,
      rotDiseases: 1,
      stemCut: 0,
      density: 0,
      diameterWeight: 'нет',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 0,
      pricePerKg: 26000,
      rawValues: {
        col6: '18',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'красный',
        col11: 'да',
        col12: '6-7 см',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'нет',
        col16: 'не имеется',
        col17: 'нет',
        col18: 'да',
        col19: 'отсутствует',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '26000',
        isYellow: false
      }
    }
  }

  // 2. САЛАТ АЙСБЕРГ
  // Standards: 16 °C, 400g-700g 12cm, 17,500 so'm
  if (p === 'САЛАТ АЙСБЕРГ') {
    return {
      temperature: '16',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 1,
      density: 1,
      diameterWeight: '400г-700г 12см',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 1,
      pricePerKg: 17500,
      rawValues: {
        col6: '16',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'да',
        col11: 'да',
        col12: 'нет',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'да',
        col16: 'средняя',
        col17: '400г-700г 12см',
        col18: 'да',
        col19: 'да',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '17500',
        isYellow: false
      }
    }
  }

  // 3. КАПУСТА БЕЛОКОЧАННАЯ
  // Standards: 22.6 °C, 5,000 so'm
  if (p === 'КАПУСТА БЕЛОКОЧАННАЯ') {
    return {
      temperature: '22.6',
      transportCondition: 1,
      hasDocumentation: 1,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 1,
      insectTraces: 0,
      rotDiseases: 1,
      stemCut: 0,
      density: 1,
      diameterWeight: 'соответствует',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 0,
      pricePerKg: 5000,
      rawValues: {
        col6: '22.6',
        col7: 'удовлетворительная',
        col8: 'да',
        col9: 'да',
        col10: 'да',
        col11: 'да',
        col12: 'да',
        col13: 'отсутствует',
        col14: 'да',
        col15: 'нет',
        col16: 'да',
        col17: 'соответствует',
        col18: 'да',
        col19: 'нет',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '5000',
        isYellow: false
      }
    }
  }

  // 4. ЛУК БЕЛЫЙ
  // Standards: 18 °C, 13,500 so'm
  if (p === 'ЛУК БЕЛЫЙ') {
    return {
      temperature: '18',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 1,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 0,
      density: 0,
      diameterWeight: 'нет',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 0,
      pricePerKg: 13500,
      rawValues: {
        col6: '18',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'белый',
        col11: 'соотвествует',
        col12: 'да',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'нет',
        col16: 'нет',
        col17: 'нет',
        col18: 'не обнаружено',
        col19: 'нет',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '13500',
        isYellow: false
      }
    }
  }

  // 5. МОРКОВЬ
  // Standards: 20 °C, 13,000 so'm
  if (p === 'МОРКОВЬ') {
    return {
      temperature: '20',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 0,
      density: 1,
      diameterWeight: 'да',
      outerLeavesRemoved: 0,
      noMechanicalDamage: 0,
      pricePerKg: 13000,
      rawValues: {
        col6: '20',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'да',
        col11: 'да',
        col12: 'отсутствует',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'не имеется',
        col16: 'да',
        col17: 'да',
        col18: 'не имеется',
        col19: 'нет',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '13000',
        isYellow: false
      }
    }
  }

  // 6. ОГУРЦЫ СВЕЖИЕ
  if (p === 'ОГУРЦЫ СВЕЖИЕ') {
    return {
      temperature: '20',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 0,
      density: 1,
      diameterWeight: 'да',
      outerLeavesRemoved: 0,
      noMechanicalDamage: 0,
      pricePerKg: 18000,
      rawValues: {
        col6: '20',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'да',
        col11: 'да',
        col12: 'отсутствует',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'не имеется',
        col16: 'да',
        col17: 'да',
        col18: 'не имеется',
        col19: 'нет',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '18000',
        isYellow: false
      }
    }
  }

  // 7. ЛИМОН
  if (p === 'ЛИМОН') {
    return {
      temperature: '20',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 0,
      density: 1,
      diameterWeight: 'да',
      outerLeavesRemoved: 0,
      noMechanicalDamage: 0,
      pricePerKg: 50000,
      rawValues: {
        col6: '20',
        col7: 'удовлетворительная',
        col8: 'нет',
        col9: 'да',
        col10: 'да',
        col11: 'да',
        col12: 'отсутствует',
        col13: 'отсутствует',
        col14: 'нет',
        col15: 'не имеется',
        col16: 'да',
        col17: 'да',
        col18: 'не имеется',
        col19: 'нет',
        col21: 'допускается',
        col26: 'Камбарова А.М.',
        col27: '50000',
        isYellow: false
      }
    }
  }

  // Default: Raw greens / vegetables (Rukkola, Lollo Rosso, Shpinat, etc.)
  return {
    temperature: '16',
    transportCondition: 1,
    hasDocumentation: 0,
    structure: 1,
    leafColor: 1,
    tasteSmell: 1,
    internalOxidation: 0,
    insectTraces: 0,
    rotDiseases: 0,
    stemCut: 1,
    density: 1,
    diameterWeight: 'Standart',
    outerLeavesRemoved: 1,
    noMechanicalDamage: 1,
    pricePerKg: 20000,
    rawValues: {
      col6: '16',
      col7: 'удовлетворительная',
      col8: 'нет',
      col9: 'да',
      col10: 'да',
      col11: 'да',
      col12: 'нет',
      col13: 'отсутствует',
      col14: 'нет',
      col15: 'да',
      col16: 'средняя',
      col17: 'Standart',
      col18: 'да',
      col19: 'да',
      col21: 'допускается',
      col26: 'Камбарова А.М.',
      col27: '20000',
      isYellow: false
    }
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
  let existingAct: any = null

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
    const updateData: any = {
      warehouseKg: qty,
      supplierName: supplierStr,
      batchNumber: batchStr,
      actDate: dateStr,
      rawValues: {
        ...(typeof existingAct.rawValues === 'object' && existingAct.rawValues !== null ? existingAct.rawValues : {}),
        arrivalId: arrival.id || (existingAct.rawValues as any)?.arrivalId,
        col20: batchStr,
        col22: qty,
        lastSyncedAt: new Date().toISOString(),
      },
    }

    // If never edited by QC inspector, keep criteria standards fresh
    if (!existingAct.isEdited) {
      updateData.transportCondition = defaults.transportCondition
      updateData.hasDocumentation = defaults.hasDocumentation
      updateData.structure = defaults.structure
      updateData.leafColor = defaults.leafColor
      updateData.tasteSmell = defaults.tasteSmell
      updateData.internalOxidation = defaults.internalOxidation
      updateData.insectTraces = defaults.insectTraces
      updateData.rotDiseases = defaults.rotDiseases
      updateData.stemCut = defaults.stemCut
      updateData.density = defaults.density
      updateData.diameterWeight = defaults.diameterWeight
      updateData.outerLeavesRemoved = defaults.outerLeavesRemoved
      updateData.noMechanicalDamage = defaults.noMechanicalDamage
      updateData.temperature = defaults.temperature
      updateData.pricePerKg = defaults.pricePerKg
      updateData.rawValues = {
        ...defaults.rawValues,
        ...updateData.rawValues,
      }
    }

    await db.incomingRawMaterialAct.update({
      where: { id: existingAct.id },
      data: updateData,
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
      transportCondition: defaults.transportCondition,
      hasDocumentation: defaults.hasDocumentation,
      structure: defaults.structure,
      leafColor: defaults.leafColor,
      tasteSmell: defaults.tasteSmell,
      internalOxidation: defaults.internalOxidation,
      insectTraces: defaults.insectTraces,
      rotDiseases: defaults.rotDiseases,
      stemCut: defaults.stemCut,
      density: defaults.density,
      diameterWeight: defaults.diameterWeight,
      outerLeavesRemoved: defaults.outerLeavesRemoved,
      noMechanicalDamage: defaults.noMechanicalDamage,
      batchNumber: batchStr,
      decisionRating: 4,
      decisionText: '4 - Yaxshi',
      warehouseKg: qty,
      inspectorName: 'Камбарова А.М.',
      pricePerKg: defaults.pricePerKg,
      notes: `Ombor kirimidan (Prixod #${arrival.id || 'yangi'}) avtomatik shakllantirilgan sifat akti`,
      rawValues: {
        arrivalId: arrival.id,
        autoGenerated: true,
        generatedAt: new Date().toISOString(),
        ...defaults.rawValues,
        col6: defaults.temperature,
        col20: batchStr,
        col22: qty,
        col26: 'Камбарова А.М.',
        col27: String(defaults.pricePerKg),
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
      isEdited: true,
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

  const ops: Array<() => Promise<any>> = []

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
      const needsUpdate =
        Math.abs((match.warehouseKg || 0) - qty) > 0.01 ||
        match.supplierName !== supplierStr ||
        match.batchNumber !== batchStr ||
        match.actDate !== dateStr ||
        !match.isEdited

      if (needsUpdate) {
        const targetId = match.id
        const updatePayload: any = {
          warehouseKg: qty,
          supplierName: supplierStr,
          batchNumber: batchStr,
          actDate: dateStr,
          rawValues: {
            ...(typeof match.rawValues === 'object' && match.rawValues !== null ? match.rawValues : {}),
            arrivalId: arr.id,
            col20: batchStr,
            col22: qty,
            lastSyncedAt: new Date().toISOString(),
          },
        }

        if (!match.isEdited) {
          updatePayload.transportCondition = defaults.transportCondition
          updatePayload.hasDocumentation = defaults.hasDocumentation
          updatePayload.structure = defaults.structure
          updatePayload.leafColor = defaults.leafColor
          updatePayload.tasteSmell = defaults.tasteSmell
          updatePayload.internalOxidation = defaults.internalOxidation
          updatePayload.insectTraces = defaults.insectTraces
          updatePayload.rotDiseases = defaults.rotDiseases
          updatePayload.stemCut = defaults.stemCut
          updatePayload.density = defaults.density
          updatePayload.diameterWeight = defaults.diameterWeight
          updatePayload.outerLeavesRemoved = defaults.outerLeavesRemoved
          updatePayload.noMechanicalDamage = defaults.noMechanicalDamage
          updatePayload.temperature = defaults.temperature
          updatePayload.pricePerKg = defaults.pricePerKg
          updatePayload.rawValues = {
            ...defaults.rawValues,
            ...updatePayload.rawValues,
          }
        }

        ops.push(async () => {
          await prisma.incomingRawMaterialAct.update({
            where: { id: targetId },
            data: updatePayload,
          })
          updated++
        })
      } else {
        skipped++
      }
    } else {
      // Create new act
      const currentMax = maxActNumberPerProduct.get(normName) || 0
      const nextNum = currentMax + 1
      maxActNumberPerProduct.set(normName, nextNum)

      const actData = {
        actNumber: String(nextNum),
        actDate: dateStr,
        productName: normName,
        supplierName: supplierStr,
        temperature: defaults.temperature,
        transportCondition: defaults.transportCondition,
        hasDocumentation: defaults.hasDocumentation,
        structure: defaults.structure,
        leafColor: defaults.leafColor,
        tasteSmell: defaults.tasteSmell,
        internalOxidation: defaults.internalOxidation,
        insectTraces: defaults.insectTraces,
        rotDiseases: defaults.rotDiseases,
        stemCut: defaults.stemCut,
        density: defaults.density,
        diameterWeight: defaults.diameterWeight,
        outerLeavesRemoved: defaults.outerLeavesRemoved,
        noMechanicalDamage: defaults.noMechanicalDamage,
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
          ...defaults.rawValues,
          col6: defaults.temperature,
          col20: batchStr,
          col22: qty,
          col26: 'Камбарова А.М.',
          col27: String(defaults.pricePerKg),
        },
        isEdited: false,
      }

      ops.push(async () => {
        const newAct = await prisma.incomingRawMaterialAct.create({ data: actData })
        if (arr.id) byArrivalId.set(arr.id, newAct as any)
        const compKey = `${dateStr}:::${normName}:::${batchStr}:::${supplierStr}`.toLowerCase()
        byComposite.set(compKey, newAct as any)
        created++
      })
    }
  }

  // Execute operations in parallel worker pool
  const CONCURRENCY = 20
  let opIndex = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, ops.length) }, async () => {
    while (opIndex < ops.length) {
      const idx = opIndex++
      const op = ops[idx]
      if (op) {
        try {
          await op()
        } catch (e) {
          console.error('Error during bulk sync item:', e)
        }
      }
    }
  })
  await Promise.all(workers)

  return {
    totalArrivals: arrivals.length,
    created,
    updated,
    skipped,
  }

  return {
    totalArrivals: arrivals.length,
    created,
    updated,
    skipped,
  }
}

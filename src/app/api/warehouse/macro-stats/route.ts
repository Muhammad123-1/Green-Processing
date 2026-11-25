import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { syncInventoryBatchesFromDailyBalances } from '@/lib/fifoSync'
import { matchSyrye12Key, getLatestSyryeClosingBalances } from '@/lib/shopReport'

const SYRYE_12_KEYS = new Set([
  'iceberg',
  'tomato',
  'onion',
  'cabbage',
  'carrot',
  'lemon',
  'cucumber',
  'lolloRosso',
  'rukkola',
  'spinach',
  'mint',
  'celery',
])

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  const r = Math.round(n * 100) / 100
  return Math.abs(r) < 0.01 ? 0 : r
}

function inferProductUnit(name: string): 'kg' | 'dona' | 'litr' {
  const s = name.toLowerCase().trim()
  if (
    s.includes('пакет') ||
    s.includes('каробка') ||
    s.includes('короб') ||
    s.includes('karobka') ||
    s.includes('этикетк') ||
    s.includes('стрич') ||
    s.includes('яшик') ||
    s.includes('падон') ||
    s.includes('скотч') ||
    s.includes('перчатк') ||
    s.includes('шапка') ||
    s.includes('бахила') ||
    s.includes('маска') ||
    s.includes('халат') ||
    s.includes('бумага') ||
    s.includes('салфетк') ||
    s.includes('полотенц') ||
    s.includes('рукавадник') ||
    s.includes('тара') ||
    s.includes('мешок') ||
    s.includes('сетка')
  ) {
    return 'dona'
  }
  if (s.includes('вода') || s.includes('масло') || s.includes('сироп') || s.includes('тайгета')) {
    return 'litr'
  }
  return 'kg'
}

function extractRealBatch(batchNumber?: string | null, supplierBatch?: string | null): string | null {
  const candidate = (supplierBatch || '').trim() || (batchNumber || '').trim()
  if (!candidate || candidate === '-' || candidate === '0') return null
  const clean = candidate.replace(/^#/, '').trim()
  if (clean.toUpperCase().startsWith('BATCH-') || clean.toUpperCase().startsWith('PAR-') || clean.toUpperCase().startsWith('AUTO-')) {
    return null
  }
  if (/^\d{4,}$/.test(clean)) {
    return null
  }
  return clean
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let [arrivals, expenses, acts, dbSuppliers, stockLevelSettings, inventoryBatches] = await Promise.all([
      prisma.shopArrival.findMany({
        orderBy: { date: 'desc' }
      }),
      prisma.shopExpense.findMany({
        orderBy: { date: 'desc' }
      }),
      prisma.incomingRawMaterialAct.findMany({
        select: {
          productName: true,
          warehouseKg: true,
          supplierName: true,
          actDate: true,
          shopIssuedKg: true
        }
      }),
      prisma.supplier.findMany({
        select: {
          id: true,
          name: true,
          shortName: true,
          phone: true,
          category: true,
          isActive: true
        }
      }),
      prisma.setting.findMany({
        where: { key: { startsWith: 'stock_level_' } }
      }),
      prisma.inventoryBatch.findMany({
        where: { qcStatus: 'APPROVED', quantity: { gt: 0 } },
        include: { product: true, supplier: true },
        orderBy: [{ expirationDate: 'asc' }, { receivedAt: 'asc' }, { id: 'asc' }]
      })
    ])

    if (inventoryBatches.length === 0) {
      await syncInventoryBatchesFromDailyBalances().catch(() => {})
      inventoryBatches = await prisma.inventoryBatch.findMany({
        where: { qcStatus: 'APPROVED', quantity: { gt: 0 } },
        include: { product: true, supplier: true },
        orderBy: [{ expirationDate: 'asc' }, { receivedAt: 'asc' }, { id: 'asc' }]
      })
    }

    const customLevelsMap: Record<string, number> = {}
    stockLevelSettings.forEach((s) => {
      const k = s.key.replace('stock_level_', '')
      customLevelsMap[k] = parseFloat(s.value) || 0
    })

    // Categorization helper
    const categorizeNomenclature = (rawName: string): { category: string; unit: string; minStock: number } => {
      const s = rawName.toLowerCase()
      if (
        s.includes('пакет') ||
        s.includes('каробка') ||
        s.includes('короб') ||
        s.includes('karobka') ||
        s.includes('этикетка') ||
        s.includes('стрич') ||
        s.includes('яшик') ||
        s.includes('падон')
      ) {
        return { category: 'Qadoqlash & Idishlar', unit: 'dona', minStock: 2000 }
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
        return { category: "Xo'jalik & Gigiyena", unit: 'dona', minStock: 500 }
      }
      if (
        s.includes('хлор') ||
        s.includes('гипохлорит') ||
        s.includes('кислота') ||
        s.includes('бензоат') ||
        s.includes('сорбат') ||
        s.includes('divosan') ||
        s.includes('suma') ||
        s.includes('alco') ||
        s.includes('solides')
      ) {
        return { category: 'Kimyoviy & Dezinfeksiya', unit: s.includes('вода') ? 'litr' : 'kg', minStock: 200 }
      }
      if (s.includes('вода')) {
        return { category: 'Suv & Ichimliklar', unit: 'litr', minStock: 1000 }
      }
      return { category: 'Xomashyo & Oziq-ovqat', unit: 'kg', minStock: 1000 }
    }

    // Material tracker container (key -> stats)
    interface MatData {
      key: string
      name: string
      nameUz: string
      category: string
      unit: string
      minStock: number
      totalArrivalKg: number
      totalExpenseKg: number
      arrivalsCount: number
      lastArrivalDate: string
      suppliersMap: Record<string, number>
    }

    const materialsData: Record<string, MatData> = {}

    // Canonical core raw materials definitions
    const coreDefinitions: Record<
      string,
      {
        key: string
        name: string
        nameUz: string
        category: string
        unit: string
        minStock: number
        matchPatterns: string[]
      }
    > = {
      tomato: {
        key: 'tomato',
        name: 'Томаты (Помидор)',
        nameUz: 'Tomat (Pomidor)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 5000,
        matchPatterns: ['томат', 'помидор']
      },
      iceberg: {
        key: 'iceberg',
        name: 'Салат Айсберг',
        nameUz: 'Aysberg salati',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 5000,
        matchPatterns: ['айсберг', 'айзберг', 'aysberg', 'ayzberg']
      },
      cabbage: {
        key: 'cabbage',
        name: 'Капуста белокочанная',
        nameUz: 'Karam (Oq karam)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 2000,
        matchPatterns: ['капуста']
      },
      onion: {
        key: 'onion',
        name: 'Лук белый салатный',
        nameUz: 'Oq piyoz (Salatbop)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 1500,
        matchPatterns: ['лук']
      },
      carrot: {
        key: 'carrot',
        name: 'Морковь свежая',
        nameUz: 'Sabzi (Yangi)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 1000,
        matchPatterns: ['морков']
      },
      cucumber: {
        key: 'cucumber',
        name: 'Огурцы свежие',
        nameUz: 'Bodring (Yangi)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 500,
        matchPatterns: ['огурц', 'бодринг']
      },
      lemon: {
        key: 'lemon',
        name: 'Лимон свежий',
        nameUz: 'Limon',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 200,
        matchPatterns: ['лимон']
      },
      box: {
        key: 'box',
        name: 'Гофра коробка (Gofra quti)',
        nameUz: 'Gofra qutilar (Karobka)',
        category: 'Qadoqlash & Idishlar',
        unit: 'dona',
        minStock: 2000,
        matchPatterns: ['каробка', 'короб', 'karobka', 'гофра']
      },
      bag: {
        key: 'bag',
        name: 'Пакеты вакуумные & полиэтиленовые',
        nameUz: 'Paketlar (Vakuum & Polietilen)',
        category: 'Qadoqlash & Idishlar',
        unit: 'dona',
        minStock: 5000,
        matchPatterns: ['пакет']
      },
      label: {
        key: 'label',
        name: 'Этикетки (Yorliqlar)',
        nameUz: 'Etiketkalar (Yorliqlar)',
        category: 'Qadoqlash & Idishlar',
        unit: 'dona',
        minStock: 2000,
        matchPatterns: ['этикетк']
      },
      chlorine: {
        key: 'chlorine',
        name: 'Гипохлорит натрия (Хлор)',
        nameUz: 'Gipoxlorit natriy (Xlor)',
        category: 'Kimyoviy & Dezinfeksiya',
        unit: 'kg',
        minStock: 500,
        matchPatterns: ['гипохлорит', 'хлор']
      },
      sorbate: {
        key: 'sorbate',
        name: 'Сорбат калия',
        nameUz: 'Kaliy sorbat',
        category: 'Kimyoviy & Dezinfeksiya',
        unit: 'kg',
        minStock: 100,
        matchPatterns: ['сорбат']
      },
      benzoate: {
        key: 'benzoate',
        name: 'Бензоат натрия',
        nameUz: 'Natriy benzoat',
        category: 'Kimyoviy & Dezinfeksiya',
        unit: 'kg',
        minStock: 100,
        matchPatterns: ['бензоат']
      },
      vinegar: {
        key: 'vinegar',
        name: 'Уксусная кислота',
        nameUz: 'Sirka kislotasi (Uksus)',
        category: 'Kimyoviy & Dezinfeksiya',
        unit: 'kg',
        minStock: 50,
        matchPatterns: ['уксус', 'кислота уксусная']
      },
      taygeta: {
        key: 'taygeta',
        name: 'Моющее средство Тайгета 218',
        nameUz: 'Taygeta 218 yuvish vositasi',
        category: 'Kimyoviy & Dezinfeksiya',
        unit: 'litr',
        minStock: 20,
        matchPatterns: ['тайгета']
      },
      boxDefect: {
        key: 'boxDefect',
        name: 'Коробки БРАК',
        nameUz: 'Brak qutilar (Karobka brak)',
        category: 'Qadoqlash & Idishlar',
        unit: 'dona',
        minStock: 0,
        matchPatterns: ['коробки брак', 'коробки2 брак', 'коробки 2 брак']
      },
      bagDefect: {
        key: 'bagDefect',
        name: 'Пакет БРАК',
        nameUz: 'Brak paketlar',
        category: 'Qadoqlash & Idishlar',
        unit: 'dona',
        minStock: 0,
        matchPatterns: ['пакет брак', 'пакет 2 брак', 'пакет2 брак']
      },
      lolloRosso: {
        key: 'lolloRosso',
        name: 'Салат Lollo Rosso',
        nameUz: 'Lollo Rosso salati',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 100,
        matchPatterns: ['lollo', 'лолло']
      },
      rukkola: {
        key: 'rukkola',
        name: 'Руккола свежая',
        nameUz: 'Rukkola',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 100,
        matchPatterns: ['руккола', 'рукола']
      },
      spinach: {
        key: 'spinach',
        name: 'Шпинат свежий',
        nameUz: 'Shpinat',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 100,
        matchPatterns: ['шпинат']
      },
      mint: {
        key: 'mint',
        name: 'Мята свежая',
        nameUz: 'Yalpiz (Myata)',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 50,
        matchPatterns: ['мята']
      },
      celery: {
        key: 'celery',
        name: 'Сельдерей свежий',
        nameUz: 'Selderiy',
        category: 'Xomashyo & Oziq-ovqat',
        unit: 'kg',
        minStock: 50,
        matchPatterns: ['сельдерей']
      }
    }

    // Initialize core definitions
    for (const [key, def] of Object.entries(coreDefinitions)) {
      materialsData[key] = {
        key: def.key,
        name: def.name,
        nameUz: def.nameUz,
        category: def.category,
        unit: def.unit,
        minStock: def.minStock,
        totalArrivalKg: 0,
        totalExpenseKg: 0,
        arrivalsCount: 0,
        lastArrivalDate: '',
        suppliersMap: {}
      }
    }

    // Suppliers summary
    const suppliersSummary: Record<
      string,
      {
        name: string
        totalKg: number
        totalDona: number
        deliveriesCount: number
        productsSet: Set<string>
        lastDeliveryDate: string
        phone?: string
        contactPerson?: string
        status?: string
      }
    > = {}

    for (const s of dbSuppliers) {
      if (s.name) {
        suppliersSummary[s.name.trim()] = {
          name: s.name.trim(),
          totalKg: 0,
          totalDona: 0,
          deliveriesCount: 0,
          productsSet: new Set(),
          lastDeliveryDate: '',
          phone: s.phone || '',
          contactPerson: s.shortName || "Mas'ul vakil",
          status: s.isActive ? 'Faol' : 'Nofaol'
        }
      }
    }

    // List of all individual arrival batches for detailed batch inspection
    const batchesList: Array<{
      id: number
      date: string
      nomenclature: string
      quantity: number
      unit: string
      supplier: string
      batchNumber: string
      category: string
      isEdited?: boolean
      editReason?: string
    }> = []

    // 1. Process ShopArrival
    const seenClones = new Set<string>()
    for (const arr of arrivals) {
      const nom = (arr.nomenclature || '').trim()
      if (!nom) continue
      const nomLower = nom.toLowerCase()

      let qty = Number(arr.quantity) || 0
      // Safety guard: ensure placeholder numbers (like old test labels) never inflate stats
      if ((arr.id === 5001 || arr.id === 5445) && nom.toLowerCase().includes('этикетк')) {
        qty = 0
      }
      if (qty < 0) qty = 0

      const sup = (arr.supplier || '').trim() || "Noma'lum"
      const date = (arr.date || '').trim()
      const rawBatch = (arr.batch || '').trim()
      const batchNum = rawBatch || ''

      // Skip exact duplicate clone rows (same date, nom, qty, sup, batch)
      const cloneKey = `${date}|${nom.toLowerCase()}|${qty}|${sup.toLowerCase()}|${batchNum.toLowerCase()}|${arr.id}`
      if (seenClones.has(cloneKey)) continue
      seenClones.add(cloneKey)

      // Safe matching: packaging (bags, boxes, labels) MUST be matched to packaging first
      // and NEVER to vegetable/food raw materials (e.g. "Полиэтиленовые пакеты для томатов" is 'bag', NOT 'tomato'!)
      const isPackaging =
        nomLower.includes('пакет') ||
        nomLower.includes('каробк') ||
        nomLower.includes('короб') ||
        nomLower.includes('karobka') ||
        nomLower.includes('этикетк') ||
        nomLower.includes('стрич') ||
        nomLower.includes('яшик') ||
        nomLower.includes('падон')

      let matchedKey: string | null = matchSyrye12Key(nom)
      if (!matchedKey) {
        if (isPackaging) {
          if (nomLower.includes('мусир')) {
            matchedKey = null // keep separate entry for "Мусир пакет"
          } else if (nomLower.includes('брак')) {
            if (nomLower.includes('короб') || nomLower.includes('кароб')) matchedKey = 'boxDefect'
            else matchedKey = 'bagDefect'
          } else if (nomLower.includes('этикет')) {
            matchedKey = 'label'
          } else if (nomLower.includes('короб') || nomLower.includes('кароб') || nomLower.includes('karobka')) {
            matchedKey = 'box'
          } else if (nomLower.includes('пакет')) {
            matchedKey = 'bag'
          }
        } else {
          for (const [mKey, def] of Object.entries(coreDefinitions)) {
            if (SYRYE_12_KEYS.has(mKey)) continue
            if (['box', 'bag', 'label', 'boxDefect', 'bagDefect'].includes(mKey)) continue
            if (def.matchPatterns.some((pattern) => nomLower.includes(pattern))) {
              matchedKey = mKey
              break
            }
          }
        }
      }

      // If not in core, create dynamic entry for this nomenclature so NOTHING is omitted
      if (!matchedKey) {
        const slug = nom.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '_').replace(/_+/g, '_')
        matchedKey = slug
        if (!materialsData[matchedKey]) {
          const { category, unit, minStock } = categorizeNomenclature(nom)
          materialsData[matchedKey] = {
            key: matchedKey,
            name: nom,
            nameUz: nom,
            category,
            unit,
            minStock,
            totalArrivalKg: 0,
            totalExpenseKg: 0,
            arrivalsCount: 0,
            lastArrivalDate: '',
            suppliersMap: {}
          }
        }
      }

      const mat = materialsData[matchedKey]
      mat.totalArrivalKg += qty
      mat.arrivalsCount += 1
      if (date && (!mat.lastArrivalDate || date > mat.lastArrivalDate)) {
        mat.lastArrivalDate = date
      }
      mat.suppliersMap[sup] = (mat.suppliersMap[sup] || 0) + qty

      // Add to batches list
      batchesList.push({
        id: arr.id,
        date: date || '-',
        nomenclature: nom,
        quantity: qty,
        unit: mat.unit,
        supplier: sup,
        batchNumber: batchNum,
        category: mat.category,
        isEdited: Boolean(arr.isEdited),
        editReason: arr.editReason || undefined
      })

      // Update supplier
      if (sup && sup !== "Noma'lum") {
        if (!suppliersSummary[sup]) {
          suppliersSummary[sup] = {
            name: sup,
            totalKg: 0,
            totalDona: 0,
            deliveriesCount: 0,
            productsSet: new Set(),
            lastDeliveryDate: '',
            phone: '+998 90 123 45 67',
            contactPerson: "Mas'ul vakil",
            status: 'Faol'
          }
        }
        const unit = inferProductUnit(nom)
        if (unit === 'dona') {
          suppliersSummary[sup].totalDona = (suppliersSummary[sup].totalDona || 0) + Math.round(qty)
        } else {
          suppliersSummary[sup].totalKg += qty
        }
        suppliersSummary[sup].deliveriesCount += 1
        suppliersSummary[sup].productsSet.add(nom)
        if (date && (!suppliersSummary[sup].lastDeliveryDate || date > suppliersSummary[sup].lastDeliveryDate)) {
          suppliersSummary[sup].lastDeliveryDate = date
        }
      }
    }

    // 2. Process ShopExpense (Raw materials expenses / dispatches to workshop)
    const dispatchesList: Array<{
      id: number
      date: string
      nomenclature: string
      quantity: number
      unit: string
      destination: string
      category: string
      isEdited?: boolean
      editReason?: string
    }> = []

    for (const exp of expenses) {
      const mats = exp.materials as Record<string, any>
      if (mats && typeof mats === 'object') {
        for (const [matKey, val] of Object.entries(mats)) {
          const k = matKey.toLowerCase()
          const qty = Number(val) || 0
          if (qty <= 0) continue

          const unit = inferProductUnit(matKey)
          const { category } = categorizeNomenclature(matKey)

          dispatchesList.push({
            id: exp.id,
            date: exp.date || '-',
            nomenclature: matKey,
            quantity: Math.round(qty * 10) / 10,
            unit,
            destination: 'Ishlab chiqarish sexi',
            category,
            isEdited: Boolean(exp.isEdited),
            editReason: exp.editReason || undefined
          })

          // Internal shop defect/transfers to kitchen and SES are part of the workshop's raw material usage, not separate warehouse stock items
          if (k.includes('кухня') || k.includes('ошхона') || k.includes('сес') || k.includes('ses')) {
            continue
          }

          const isExpPackaging =
            k.includes('пакет') ||
            k.includes('каробк') ||
            k.includes('короб') ||
            k.includes('karobka') ||
            k.includes('этикетк') ||
            k.includes('стрич') ||
            k.includes('яшик') ||
            k.includes('падон')

          let matchedKey: string | null = matchSyrye12Key(matKey)
          if (!matchedKey) {
            if (isExpPackaging) {
              if (k.includes('мусир')) {
                matchedKey = null
              } else if (k.includes('брак')) {
                if (k.includes('короб') || k.includes('кароб')) matchedKey = 'boxDefect'
                else matchedKey = 'bagDefect'
              } else if (k.includes('этикет')) {
                matchedKey = 'label'
              } else if (k.includes('короб') || k.includes('кароб') || k.includes('karobka')) {
                matchedKey = 'box'
              } else if (k.includes('пакет')) {
                matchedKey = 'bag'
              }
            } else {
              for (const [mKey, def] of Object.entries(coreDefinitions)) {
                if (SYRYE_12_KEYS.has(mKey)) continue
                if (['box', 'bag', 'label', 'boxDefect', 'bagDefect'].includes(mKey)) continue
                if (def.matchPatterns.some((pattern) => k.includes(pattern))) {
                  matchedKey = mKey
                  break
                }
              }
            }
          }

          // Match dynamic
          if (!matchedKey) {
            for (const [mKey, mData] of Object.entries(materialsData)) {
              if (SYRYE_12_KEYS.has(mKey)) continue
              if (['box', 'bag', 'label', 'boxDefect', 'bagDefect'].includes(mKey)) continue
              if (mData.name.toLowerCase().trim() === k.trim()) {
                matchedKey = mKey
                break
              }
            }
          }

          if (matchedKey && materialsData[matchedKey]) {
            materialsData[matchedKey].totalExpenseKg += qty
          }
        }
      }
    }

    // Helper to categorize finished goods (GP)
    const categorizeGP = (name: string): string => {
      const s = name.toLowerCase()
      if (s.includes('салат') || s.includes('айсберг') || s.includes('айзберг') || s.includes('aysberg') || s.includes('ayzberg') || s.includes('коул') || s.includes('микс')) {
        return 'Salatlar'
      }
      if (s.includes('томат') || s.includes('лук') || s.includes('морков') || s.includes('капуст') || s.includes('огурц') || s.includes('лимон')) {
        return 'Sabzavotlar'
      }
      if (s.includes('мята') || s.includes('сельдерей') || s.includes('зелен')) {
        return "Ko'katlar & Boshqa"
      }
      if (s.includes('пакет') || s.includes('короб') || s.includes('упаковк')) {
        return 'Qadoqlash'
      }
      return 'Boshqa GP'
    }

    // 3. Process ГП (Finished goods outputs from ShopExpense.outputs)
    const gpTotals: Record<string, { totalKg: number; daysCount: number; lastDate: string }> = {}
    const dailyGpLogs: Array<{ date: string; product: string; quantityKg: number; unit: string }> = []

    for (const exp of expenses) {
      const outs = (exp.outputs || {}) as Record<string, any>
      for (const [k, v] of Object.entries(outs)) {
        const kg = typeof v === 'object' && v !== null ? (v.kg ?? v.val ?? 0) : Number(v) || 0
        if (kg <= 0) continue

        if (!gpTotals[k]) {
          gpTotals[k] = { totalKg: 0, daysCount: 0, lastDate: exp.date }
        }
        gpTotals[k].totalKg += kg
        gpTotals[k].daysCount += 1
        if (exp.date > gpTotals[k].lastDate) gpTotals[k].lastDate = exp.date

        dailyGpLogs.push({
          date: exp.date,
          product: k,
          quantityKg: Math.round(kg * 10) / 10,
          unit: 'kg'
        })
      }
    }

    const totalGpKg = Math.round(Object.values(gpTotals).reduce((acc, d) => acc + d.totalKg, 0) * 10) / 10
    const totalGpTonnes = Math.round((totalGpKg / 1000) * 10) / 10
    const gpDistinctDays = expenses.filter((e) => e.outputs && Object.keys(e.outputs as object).length > 0).length
    const avgDailyKg = gpDistinctDays > 0 ? Math.round((totalGpKg / gpDistinctDays) * 10) / 10 : 0

    const gpItems = Object.entries(gpTotals)
      .map(([name, data]) => {
        const kg = Math.round(data.totalKg * 10) / 10
        const sharePercent = totalGpKg > 0 ? Math.round((kg / totalGpKg) * 1000) / 10 : 0
        const avgPerDayKg = data.daysCount > 0 ? Math.round((kg / data.daysCount) * 10) / 10 : 0
        return {
          name,
          category: categorizeGP(name),
          totalKg: kg,
          totalTonnes: Math.round((kg / 1000) * 100) / 100,
          daysCount: data.daysCount,
          avgPerDayKg,
          sharePercent,
          lastDate: data.lastDate,
          unit: name.toLowerCase().includes('пакет') ? 'dona' : 'kg',
          status: 'Omborda mavjud'
        }
      })
      .sort((a, b) => b.totalKg - a.totalKg)

    // Find latest confirmed daily shop balance report (Chain: start + income - expense = end)
    const { latestDate: latestReportDate, endBalances: latestClosingBalances } = getLatestSyryeClosingBalances(expenses)

    // 4. Format all materials (calculating net stock and traffic light status)
    const formattedMaterials = Object.values(materialsData).map((m) => {
      // Rule B (default for products NOT in 12-item Сырье table): Qoldiq = Prixod - Rasxod
      let balance = Math.max(0, round2(m.totalArrivalKg - m.totalExpenseKg))

      // Rule A (for the 12 core Сырье raw materials): take authoritative "остатка конец дня" + post-date delta
      if (SYRYE_12_KEYS.has(m.key) && latestReportDate) {
        const baseStock = round2(Number(latestClosingBalances[m.key]) || 0)
        let postArrival = 0
        let postExpense = 0
        for (const arr of arrivals) {
          if (arr.date > latestReportDate && matchSyrye12Key(arr.nomenclature) === m.key) {
            postArrival += Number(arr.quantity) || 0
          }
        }
        for (const exp of expenses) {
          if (exp.date > latestReportDate && exp.materials) {
            const mats = exp.materials as Record<string, any>
            for (const [k, v] of Object.entries(mats)) {
              if (matchSyrye12Key(k) === m.key) {
                postExpense += Number(v) || 0
              }
            }
          }
        }
        balance = Math.max(0, round2(baseStock + postArrival - postExpense))
      }

      // Check if custom minStock is set by warehouseman
      const effectiveMinStock = customLevelsMap[m.key] !== undefined ? customLevelsMap[m.key] : m.minStock

      // Svetofor status calculation:
      // If balance is negative or below critical threshold, it is an immediate RED alert (deficit or missing arrival acts)
      let status: 'green' | 'yellow' | 'red' = 'green'
      if (balance <= 0 || (effectiveMinStock > 0 && balance <= effectiveMinStock * 0.5)) {
        status = 'red'
      } else if (effectiveMinStock > 0 && balance <= effectiveMinStock * 1.3) {
        status = 'yellow'
      }

      // Top supplier
      const sortedSuppliers = Object.entries(m.suppliersMap).sort((a, b) => b[1] - a[1])
      const topSupplierName = sortedSuppliers.length > 0 ? sortedSuppliers[0][0] : "Umumiy ta'minot"

      // Match approved FIFO batches
      const patterns = coreDefinitions[m.key]?.matchPatterns || [m.key.toLowerCase(), m.name.toLowerCase()]
      const matchedBatches = inventoryBatches.filter((b) => {
        const pName = (b.product?.name || '').toLowerCase()
        return patterns.some((pat) => pName.includes(pat.toLowerCase()))
      })

      let fifoData: {
        activeBatchNumber: string | null
        activeBatchQuantity: number
        activeBatchDate: string | null
        activeBatchExpiry: string | null
        daysUntilExpiry: number | null
        batchesCount: number
        isExpired: boolean
        batches: Array<{
          id: number
          batchNumber: string
          quantity: number
          receivedAt?: string | null
          expirationDate?: string | null
          daysUntilExpiry?: number | null
          isFirst: boolean
        }>
      }

      if (balance <= 0) {
        fifoData = {
          activeBatchNumber: null,
          activeBatchQuantity: 0,
          activeBatchDate: null,
          activeBatchExpiry: null,
          daysUntilExpiry: null,
          batchesCount: 0,
          isExpired: false,
          batches: []
        }
      } else if (matchedBatches.length > 0) {
        const first = matchedBatches[0]
        const realBatch = extractRealBatch(first.batchNumber, first.supplierBatchNumber)
        const days = first.expirationDate
          ? Math.ceil((new Date(first.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
        fifoData = {
          activeBatchNumber: realBatch,
          activeBatchQuantity: Math.min(first.quantity, balance),
          activeBatchDate: first.receivedAt ? new Date(first.receivedAt).toISOString().slice(0, 10) : null,
          activeBatchExpiry: first.expirationDate ? new Date(first.expirationDate).toISOString().slice(0, 10) : null,
          daysUntilExpiry: days,
          batchesCount: matchedBatches.length,
          isExpired: typeof days === 'number' && days <= 0,
          batches: matchedBatches.map((b, idx) => ({
            id: b.id,
            batchNumber: extractRealBatch(b.batchNumber, b.supplierBatchNumber) || '',
            quantity: b.quantity,
            receivedAt: b.receivedAt ? new Date(b.receivedAt).toISOString().slice(0, 10) : null,
            expirationDate: b.expirationDate ? new Date(b.expirationDate).toISOString().slice(0, 10) : null,
            daysUntilExpiry: b.expirationDate
              ? Math.ceil((new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null,
            isFirst: idx === 0
          }))
        }
      } else {
        // Fallback: If not in InventoryBatch yet, look at arrivals for this material from batchesList
        const matBatches = batchesList.filter((b) => {
          const nom = b.nomenclature.toLowerCase()
          return patterns.some((pat) => nom.includes(pat.toLowerCase()))
        })
        if (matBatches.length > 0 && balance > 0) {
          const first = matBatches[0]
          const realBatch = extractRealBatch(first.batchNumber)
          fifoData = {
            activeBatchNumber: realBatch,
            activeBatchQuantity: Math.min(first.quantity, balance),
            activeBatchDate: first.date,
            activeBatchExpiry: null,
            daysUntilExpiry: null,
            batchesCount: matBatches.length,
            isExpired: false,
            batches: matBatches.slice(0, 3).map((b, idx) => ({
              id: b.id,
              batchNumber: extractRealBatch(b.batchNumber) || '',
              quantity: b.quantity,
              receivedAt: b.date,
              expirationDate: null,
              daysUntilExpiry: null,
              isFirst: idx === 0
            }))
          }
        } else {
          fifoData = {
            activeBatchNumber: null,
            activeBatchQuantity: 0,
            activeBatchDate: null,
            activeBatchExpiry: null,
            daysUntilExpiry: null,
            batchesCount: 0,
            isExpired: false,
            batches: []
          }
        }
      }

      return {
        key: m.key,
        name: m.name,
        nameUz: m.nameUz,
        category: m.category,
        unit: m.unit,
        totalArrivalKg: Math.round(m.totalArrivalKg * 10) / 10,
        totalExpenseKg: Math.round(m.totalExpenseKg * 10) / 10,
        currentStockKg: Math.round(balance * 10) / 10,
        minStock: effectiveMinStock,
        status,
        arrivalsCount: m.arrivalsCount,
        lastArrivalDate: m.lastArrivalDate || '2026-08-01',
        topSupplier: topSupplierName,
        suppliersCount: Object.keys(m.suppliersMap).length,
        fifo: fifoData
      }
    }).sort((a, b) => {
      // Eng ko'p ishlatiladigoni birinchi: sexga berilgan chiqim hajmi bo'yicha (totalExpenseKg kamayish tartibida)
      if (b.totalExpenseKg !== a.totalExpenseKg) {
        return b.totalExpenseKg - a.totalExpenseKg
      }
      return b.currentStockKg - a.currentStockKg
    })

    // Summary calculations separated by unit
    const foodMaterials = formattedMaterials.filter((m) => m.unit === 'kg')
    const totalArrivalKg = foodMaterials.reduce((acc, m) => acc + m.totalArrivalKg, 0)
    const totalExpenseKg = foodMaterials.reduce((acc, m) => acc + m.totalExpenseKg, 0)
    const currentStockKg = foodMaterials.reduce((acc, m) => acc + m.currentStockKg, 0)

    const donaMaterials = formattedMaterials.filter((m) => m.unit === 'dona')
    const totalArrivalDona = donaMaterials.reduce((acc, m) => acc + m.totalArrivalKg, 0)
    const totalExpenseDona = donaMaterials.reduce((acc, m) => acc + m.totalExpenseKg, 0)
    const currentStockDona = donaMaterials.reduce((acc, m) => acc + m.currentStockKg, 0)

    const litrMaterials = formattedMaterials.filter((m) => m.unit === 'litr')
    const totalArrivalLitr = litrMaterials.reduce((acc, m) => acc + m.totalArrivalKg, 0)
    const totalExpenseLitr = litrMaterials.reduce((acc, m) => acc + m.totalExpenseKg, 0)
    const currentStockLitr = litrMaterials.reduce((acc, m) => acc + m.currentStockKg, 0)

    const criticalCount = formattedMaterials.filter((m) => m.status === 'red').length
    const warningCount = formattedMaterials.filter((m) => m.status === 'yellow').length
    const sufficientCount = formattedMaterials.filter((m) => m.status === 'green').length

    // Sort suppliers list
    const sortedSuppliersList = Object.values(suppliersSummary)
      .filter((s) => s.totalKg > 0 || s.totalDona > 0 || s.deliveriesCount > 0 || s.phone)
      .map((s) => ({
        name: s.name,
        totalKg: Math.round(s.totalKg * 10) / 10,
        totalTonnes: Math.round((s.totalKg / 1000) * 100) / 100,
        totalDona: Math.round(s.totalDona || 0),
        deliveriesCount: s.deliveriesCount,
        products: Array.from(s.productsSet).slice(0, 5),
        lastDeliveryDate: s.lastDeliveryDate || '-',
        phone: s.phone || '+998 90 123 45 67',
        contactPerson: s.contactPerson || "Mas'ul vakil",
        status: s.status || 'Faol'
      }))
      .sort((a, b) => (b.totalKg - a.totalKg) || (b.totalDona - a.totalDona))

    return NextResponse.json({
      summary: {
        totalArrivalKg: Math.round(totalArrivalKg * 10) / 10,
        totalArrivalTonnes: Math.round((totalArrivalKg / 1000) * 10) / 10,
        totalExpenseKg: Math.round(totalExpenseKg * 10) / 10,
        totalExpenseTonnes: Math.round((totalExpenseKg / 1000) * 10) / 10,
        currentStockKg: Math.round(currentStockKg * 10) / 10,
        currentStockTonnes: Math.round((currentStockKg / 1000) * 10) / 10,

        totalArrivalDona: Math.round(totalArrivalDona),
        totalExpenseDona: Math.round(totalExpenseDona),
        currentStockDona: Math.round(currentStockDona),

        totalArrivalLitr: Math.round(totalArrivalLitr * 10) / 10,
        totalExpenseLitr: Math.round(totalExpenseLitr * 10) / 10,
        currentStockLitr: Math.round(currentStockLitr * 10) / 10,

        totalArrivalBatches: arrivals.length + acts.length,
        totalDispatchesCount: dispatchesList.length,
        totalSuppliersCount: sortedSuppliersList.length,
        totalNomenclaturesCount: formattedMaterials.length,
        totalFinishedGoodsKg: totalGpKg,
        totalFinishedGoodsTonnes: totalGpTonnes,
        totalFifoBatchesCount: inventoryBatches.length,
        criticalCount,
        warningCount,
        sufficientCount
      },
      materials: formattedMaterials,
      batches: batchesList,
      dispatches: dispatchesList,
      gp: {
        summary: {
          totalKg: totalGpKg,
          totalTonnes: totalGpTonnes,
          daysCount: gpDistinctDays,
          itemsCount: gpItems.length,
          avgDailyKg: avgDailyKg
        },
        items: gpItems,
        dailyLogs: dailyGpLogs
      },
      suppliers: sortedSuppliersList
    })
  } catch (error: any) {
    console.error('Error fetching warehouse macro stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

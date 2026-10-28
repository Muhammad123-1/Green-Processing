import { prisma } from '@/lib/prisma'

/**
 * Standardize date to YYYY-MM-DD and extract yearMonth (YYYY-MM)
 */
export function parseDateToYearMonth(d: string | undefined | null): { yearMonth: string; isoDate: string } {
  if (!d) {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const iso = `${ym}-${String(now.getDate()).padStart(2, '0')}`
    return { yearMonth: ym, isoDate: iso }
  }
  const str = String(d).trim()
  if (str.includes('.')) {
    const parts = str.split('.')
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      return { yearMonth: `${parts[2]}-${parts[1].padStart(2, '0')}`, isoDate: iso }
    }
  }
  if (str.includes(',')) {
    const parts = str.split(',')
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      return { yearMonth: `${parts[2]}-${parts[1].padStart(2, '0')}`, isoDate: iso }
    }
  }
  const ym = str.slice(0, 7)
  return { yearMonth: ym, isoDate: str }
}

/**
 * Clean product/nomenclature string for case-insensitive matching
 */
export function normalizeProductKey(name: string | undefined | null): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Calculate the next monthly sequential batch number for a product in ShopArrival.
 * Rules:
 * 1. Resets to "1" on the 1st of every calendar month.
 * 2. Increments sequentially 1, 2, 3, 4... for each arrival of that product within the same month.
 * 3. Each nomenclature/product maintains its own independent sequence.
 */
export async function getNextShopArrivalBatch(
  nomenclature: string,
  dateStr: string,
  tx?: any
): Promise<string> {
  const cleanNom = normalizeProductKey(nomenclature)
  if (!cleanNom) return '1'

  const { yearMonth } = parseDateToYearMonth(dateStr)
  const client = tx || prisma

  // Find all arrivals for this month
  const arrivals = await client.shopArrival.findMany({
    where: {
      date: { startsWith: yearMonth }
    },
    select: { nomenclature: true, batch: true }
  })

  let maxNum = 0
  for (const a of arrivals) {
    if (normalizeProductKey(a.nomenclature) === cleanNom) {
      const bStr = (a.batch || '').trim()
      const n = parseInt(bStr, 10)
      if (!isNaN(n) && n > maxNum) {
        maxNum = n
      }
    }
  }

  return String(maxNum + 1)
}

/**
 * Calculate the next monthly batch number for IncomingRawMaterialAct.
 */
export async function getNextIncomingActBatch(
  productName: string,
  actDateStr: string,
  tx?: any
): Promise<string> {
  const cleanNom = normalizeProductKey(productName)
  if (!cleanNom) return '1'

  const { yearMonth } = parseDateToYearMonth(actDateStr)
  const client = tx || prisma

  const acts = await client.incomingRawMaterialAct.findMany({
    where: {
      OR: [
        { actDate: { startsWith: yearMonth } },
        { actDate: { contains: `${yearMonth.split('-')[1]}.${yearMonth.split('-')[0]}` } },
        { actDate: { contains: `${yearMonth.split('-')[1]},${yearMonth.split('-')[0]}` } },
      ]
    },
    select: { productName: true, batchNumber: true }
  })

  let maxNum = 0
  for (const a of acts) {
    if (normalizeProductKey(a.productName) === cleanNom) {
      const bStr = (a.batchNumber || '').trim()
      const n = parseInt(bStr, 10)
      if (!isNaN(n) && n > maxNum) {
        maxNum = n
      }
    }
  }

  return String(maxNum + 1)
}

import { prisma } from '@/lib/prisma'

export function getProductStandardPrice(rawName: string): number {
  const s = rawName.toLowerCase()
  if (s.includes('томат') || s.includes('помидор')) return 26000
  if (s.includes('айсберг') || s.includes('айзберг')) return 15000
  if (s.includes('лук') || s.includes('пиёз')) return 13000
  if (s.includes('морков') || s.includes('сабзи')) return 11000
  if (s.includes('капуст') || s.includes('карам')) return 6000
  if (s.includes('лимон')) return 50000
  if (s.includes('бодринг') || s.includes('огур')) return 18000
  if (s.includes('каробка') || s.includes('короб')) return 3500
  if (s.includes('этикетк') || s.includes('стикер')) return 150
  if (s.includes('пакет')) return 400
  if (s.includes('вода')) return 1500
  if (s.includes('стрич') || s.includes('стрейч')) return 45000
  if (s.includes('яшик')) return 4000
  if (s.includes('перчатк')) return 1200
  if (s.includes('шапка') || s.includes('бахил')) return 300
  return 10000
}

export async function calculateSupplierDebts() {
  const [suppliers, shopArrivals, rawActs, expenseTransactions, invoices] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.shopArrival.findMany({ orderBy: { date: 'desc' } }),
    prisma.incomingRawMaterialAct.findMany({
      where: { pricePerKg: { gt: 0 } },
      orderBy: { actDate: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { type: 'EXPENSE' },
      include: { bankAccount: true },
      orderBy: { date: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { type: 'PURCHASE_INVOICE' },
      include: { purchaseOrder: true, transactions: true },
      orderBy: { issuedDate: 'desc' },
    }),
  ])

  // Price map from real acts
  const priceByProductMap = new Map<string, number>()
  rawActs.forEach((a) => {
    if (a.productName && a.pricePerKg && a.pricePerKg > 0) {
      const k = a.productName.trim().toLowerCase()
      if (!priceByProductMap.has(k)) {
        priceByProductMap.set(k, a.pricePerKg)
      }
    }
  })

  // Act lookup by batch and by date+product
  const actByBatch = new Map<string, any>()
  const actByDateProduct = new Map<string, any>()
  rawActs.forEach((a) => {
    if (a.batchNumber) actByBatch.set(String(a.batchNumber).trim().toLowerCase(), a)
    const k = `${a.actDate}_${(a.productName || '').trim().toLowerCase()}`
    if (!actByDateProduct.has(k)) actByDateProduct.set(k, a)
  })

  const supplierDebtsMap = new Map<string, any>()

  // Seed with registered suppliers
  suppliers.forEach((s) => {
    const key = s.name.trim().toLowerCase()
    supplierDebtsMap.set(key, {
      id: s.id,
      name: s.name.trim(),
      phone: s.phone || '-',
      inn: s.shortName || '-',
      currency: 'UZS',
      totalPurchasedUzs: 0,
      totalPaidUzs: 0,
      remainingDebtUzs: 0,
      overdueDebtUzs: 0,
      actsCount: 0,
      invoicesCount: 0,
      lastDeliveryDate: null,
      status: 'PAID',
      acts: [],
      invoices: [],
      payments: [],
    })
  })

  const getOrCreateSupplier = (rawName: string) => {
    const clean = rawName.trim()
    const key = clean.toLowerCase()
    let sup = supplierDebtsMap.get(key)
    if (!sup) {
      for (const [sKey, val] of supplierDebtsMap.entries()) {
        if (sKey.includes(key) || key.includes(sKey)) {
          sup = val
          break
        }
      }
    }
    if (!sup) {
      sup = {
        id: `virtual-${key}`,
        name: clean,
        phone: '-',
        inn: '-',
        currency: 'UZS',
        totalPurchasedUzs: 0,
        totalPaidUzs: 0,
        remainingDebtUzs: 0,
        overdueDebtUzs: 0,
        actsCount: 0,
        invoicesCount: 0,
        lastDeliveryDate: null,
        status: 'UNPAID',
        acts: [],
        invoices: [],
        payments: [],
      }
      supplierDebtsMap.set(key, sup)
    }
    return sup
  }

  // 1. Process live ShopArrivals (kunlik kirim/cheklist)
  const now = new Date()

  shopArrivals.forEach((sa) => {
    if (!sa.supplier || !sa.quantity || sa.quantity <= 0) return
    const isAccepted = !sa.finalDecision || !sa.finalDecision.toLowerCase().includes('брак')
    if (!isAccepted) return // Never pay for rejected quantities

    const sup = getOrCreateSupplier(sa.supplier)
    const nom = sa.nomenclature || ''
    const batchKey = sa.batch ? String(sa.batch).trim().toLowerCase() : ''
    const actMatch =
      (batchKey && actByBatch.get(batchKey)) ||
      actByDateProduct.get(`${sa.date}_${nom.trim().toLowerCase()}`)

    const unitPrice =
      actMatch?.pricePerKg ||
      priceByProductMap.get(nom.trim().toLowerCase()) ||
      getProductStandardPrice(nom)

    const totalCost = Math.round(sa.quantity * unitPrice)

    sup.totalPurchasedUzs += totalCost
    sup.actsCount += 1
    if (!sup.lastDeliveryDate || sa.date > sup.lastDeliveryDate) {
      sup.lastDeliveryDate = sa.date
    }

    const actNum = sa.ttnNumber
      ? `TTN-${sa.ttnNumber}`
      : sa.batch
      ? (sa.batch.startsWith('#') ? sa.batch : `#${sa.batch}`)
      : `KIRIM-${sa.id}`

    sup.acts.push({
      id: sa.id,
      actNumber: actNum,
      date: sa.date,
      product: nom || 'Xomashyo',
      quantityKg: Math.round(sa.quantity * 10) / 10,
      pricePerKg: unitPrice,
      totalAmount: totalCost,
      inspector: sa.qcSign || sa.warehouseSign || "Sifat Nazorati",
    })
  })

  // 2. Process expense transactions (matching supplier payments)
  expenseTransactions.forEach((tx) => {
    const desc = (tx.description || '').toLowerCase()
    for (const [sKey, sup] of supplierDebtsMap.entries()) {
      if (desc.includes(sKey) || desc.includes(sup.name.toLowerCase())) {
        sup.totalPaidUzs += tx.amount
        sup.payments.push({
          id: tx.id,
          date: tx.date.toISOString().split('T')[0],
          amount: tx.amount,
          accountName: tx.bankAccount?.name || 'Bank / Kassa',
          category: tx.category || "Ta'minotchi to'lovi",
        })
      }
    }
  })

  // 3. Finalize balances and overdue calculations
  let totalPurchasedAll = 0
  let totalPaidAll = 0
  let totalOutstandingDebtAll = 0
  let totalOverdueDebtAll = 0
  let suppliersWithDebtCount = 0

  const suppliersList = Array.from(supplierDebtsMap.values())
    .filter((s) => s.actsCount > 0 || s.totalPurchasedUzs > 0 || s.totalPaidUzs > 0)
    .map((s) => {
      s.remainingDebtUzs = Math.max(0, s.totalPurchasedUzs - s.totalPaidUzs)

      let isOverdue = false
      if (s.remainingDebtUzs > 0 && s.lastDeliveryDate) {
        try {
          const delivDate = new Date(s.lastDeliveryDate)
          const diffDays = (now.getTime() - delivDate.getTime()) / (1000 * 3600 * 24)
          if (diffDays > 14) {
            isOverdue = true
            s.overdueDebtUzs = s.remainingDebtUzs
          }
        } catch {}
      }

      if (s.remainingDebtUzs > 0) {
        suppliersWithDebtCount++
        s.status = isOverdue ? 'OVERDUE' : s.totalPaidUzs > 0 ? 'PARTIAL' : 'UNPAID'
      } else {
        s.status = 'PAID'
      }

      totalPurchasedAll += s.totalPurchasedUzs
      totalPaidAll += s.totalPaidUzs
      totalOutstandingDebtAll += s.remainingDebtUzs
      totalOverdueDebtAll += s.overdueDebtUzs

      s.acts.sort((a: any, b: any) => (b.date > a.date ? 1 : -1))
      s.invoices.sort((a: any, b: any) => (b.date > a.date ? 1 : -1))
      s.payments.sort((a: any, b: any) => (b.date > a.date ? 1 : -1))

      return s
    })
    .sort((a, b) => b.remainingDebtUzs - a.remainingDebtUzs)

  return {
    summary: {
      totalOutstandingDebtUzs: totalOutstandingDebtAll,
      totalConfirmedPaymentsUzs: totalPaidAll,
      totalPurchasesUzs: totalPurchasedAll,
      totalOverdueDebtUzs: totalOverdueDebtAll,
      suppliersWithDebtCount,
      totalTrackedSuppliers: suppliersList.length,
    },
    suppliers: suppliersList,
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch registered Suppliers, verified Incoming Raw Material Acts with prices, Invoices, and Transactions
    const [suppliers, acts, invoices, expenseTransactions] = await Promise.all([
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.incomingRawMaterialAct.findMany({
        where: { pricePerKg: { gt: 0 } },
        orderBy: { actDate: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { type: 'PURCHASE_INVOICE' },
        include: { purchaseOrder: true, transactions: true },
        orderBy: { issuedDate: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { type: 'EXPENSE' },
        include: { bankAccount: true },
        orderBy: { date: 'desc' },
      }),
    ])

    // 2. Build supplier payables map
    interface SupplierPayable {
      id: string | number
      name: string
      code?: string
      phone: string
      inn: string
      currency: string
      totalPurchasedUzs: number
      totalPaidUzs: number
      remainingDebtUzs: number
      overdueDebtUzs: number
      actsCount: number
      invoicesCount: number
      lastDeliveryDate: string | null
      status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UNPAID'
      acts: Array<{
        id: number
        actNumber: string
        date: string
        product: string
        quantityKg: number
        pricePerKg: number
        totalAmount: number
        inspector: string
      }>
      invoices: Array<{
        id: number
        invoiceNumber: string
        date: string
        dueDate: string | null
        totalAmount: number
        paidAmount: number
        status: string
      }>
      payments: Array<{
        id: number
        date: string
        amount: number
        accountName: string
        category: string
      }>
    }

    const supplierDebtsMap = new Map<string, SupplierPayable>()

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

    // Helper to find or register supplier
    const getOrCreateSupplier = (rawName: string): SupplierPayable => {
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

    // 3. Aggregate Incoming Raw Material Acts with official pricing
    acts.forEach((act) => {
      if (!act.supplierName) return
      const sup = getOrCreateSupplier(act.supplierName)
      const qty = act.warehouseKg || 0
      const price = act.pricePerKg || 0
      const actTotal = Math.round(qty * price)

      sup.totalPurchasedUzs += actTotal
      sup.actsCount += 1
      if (!sup.lastDeliveryDate || (act.actDate && act.actDate > sup.lastDeliveryDate)) {
        sup.lastDeliveryDate = act.actDate
      }

      sup.acts.push({
        id: act.id,
        actNumber: act.actNumber || `#${act.id}`,
        date: act.actDate || act.createdAt.toISOString().split('T')[0],
        product: act.productName || 'Xomashyo',
        quantityKg: qty,
        pricePerKg: price,
        totalAmount: actTotal,
        inspector: act.inspectorName || "Nazoratchi",
      })
    })

    // 4. Aggregate Official Purchase Invoices
    const now = new Date()
    invoices.forEach((inv) => {
      const supName = inv.purchaseOrder?.supplierId
        ? suppliers.find((s) => s.id === inv.purchaseOrder?.supplierId)?.name
        : null

      if (!supName) return
      const sup = getOrCreateSupplier(supName)
      sup.invoicesCount += 1

      const total = inv.totalAmount || 0
      const paid = inv.paidAmount || 0
      const remaining = Math.max(0, total - paid)

      // If invoice is recognized in general ledger, add paid amounts
      sup.totalPaidUzs += paid

      const isOverdue = inv.dueDate && new Date(inv.dueDate) < now && remaining > 0
      if (isOverdue) {
        sup.overdueDebtUzs += remaining
      }

      sup.invoices.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.issuedDate.toISOString().split('T')[0],
        dueDate: inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : null,
        totalAmount: total,
        paidAmount: paid,
        status: isOverdue ? 'OVERDUE' : inv.status,
      })

      // Attach payments from invoice transactions
      if (inv.transactions && inv.transactions.length > 0) {
        inv.transactions.forEach((tx) => {
          sup.payments.push({
            id: tx.id,
            date: tx.date.toISOString().split('T')[0],
            amount: tx.amount,
            accountName: "Bank / Kassa",
            category: tx.category || "Ta'minotchi to'lovi",
          })
        })
      }
    })

    // 5. Finalize Balances & Statuses
    let totalPurchasedAll = 0
    let totalPaidAll = 0
    let totalOutstandingDebtAll = 0
    let totalOverdueDebtAll = 0
    let suppliersWithDebtCount = 0

    const suppliersList = Array.from(supplierDebtsMap.values())
      .map((s) => {
        s.remainingDebtUzs = Math.max(0, s.totalPurchasedUzs - s.totalPaidUzs)

        if (s.remainingDebtUzs > 0) {
          suppliersWithDebtCount++
          s.status = s.overdueDebtUzs > 0 ? 'OVERDUE' : s.totalPaidUzs > 0 ? 'PARTIAL' : 'UNPAID'
        } else {
          s.status = 'PAID'
        }

        totalPurchasedAll += s.totalPurchasedUzs
        totalPaidAll += s.totalPaidUzs
        totalOutstandingDebtAll += s.remainingDebtUzs
        totalOverdueDebtAll += s.overdueDebtUzs

        // Sort sub-arrays by date descending
        s.acts.sort((a, b) => (b.date > a.date ? 1 : -1))
        s.invoices.sort((a, b) => (b.date > a.date ? 1 : -1))
        s.payments.sort((a, b) => (b.date > a.date ? 1 : -1))

        return s
      })
      .sort((a, b) => b.remainingDebtUzs - a.remainingDebtUzs)

    return NextResponse.json({
      summary: {
        totalOutstandingDebtUzs: totalOutstandingDebtAll,
        totalConfirmedPaymentsUzs: totalPaidAll,
        totalPurchasesUzs: totalPurchasedAll,
        totalOverdueDebtUzs: totalOverdueDebtAll,
        suppliersWithDebtCount,
        totalTrackedSuppliers: suppliersList.length,
      },
      suppliers: suppliersList,
    })
  } catch (error: any) {
    console.error('Error in supplier-debts route:', error)
    return NextResponse.json({ error: "Ta'minotchi qarzdorliklarini yuklashda xatolik" }, { status: 500 })
  }
}

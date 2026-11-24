import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { calculateSupplierDebts } from '@/lib/supplierDebts'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if any accounts exist, create defaults if empty
    const accountsCount = await prisma.bankAccount.count()
    if (accountsCount === 0) {
      await prisma.bankAccount.createMany({
        data: [
          { name: 'Asosiy Hisob Raqam (Bank)', currency: 'UZS', balance: 0 },
          { name: 'Naqd Kassa', currency: 'UZS', balance: 0 },
          { name: 'Karta (Humo/Uzcard)', currency: 'UZS', balance: 0 }
        ]
      })
    }

    // Fetch accounts, recent transactions, unpaid invoices, and real supplier debts from daily checklist/arrivals
    const [accounts, transactions, invoices, debtsData] = await Promise.all([
      prisma.bankAccount.findMany({
        orderBy: { id: 'asc' }
      }),
      prisma.transaction.findMany({
        take: 50,
        orderBy: { date: 'desc' },
        include: { bankAccount: true }
      }),
      prisma.invoice.findMany({
        where: { status: { not: 'PAID' } },
        orderBy: { issuedDate: 'desc' },
        include: { customer: true }
      }),
      calculateSupplierDebts().catch((err) => {
        console.error('Failed to calculate debts for finance route:', err)
        return { summary: { totalOutstandingDebtUzs: 0, suppliersWithDebtCount: 0 } }
      })
    ])

    return NextResponse.json({
      accounts,
      transactions,
      invoices,
      totalSupplierDebt: debtsData.summary.totalOutstandingDebtUzs || 0,
      suppliersWithDebtCount: debtsData.summary.suppliersWithDebtCount || 0,
      debtsSummary: debtsData.summary
    })
  } catch (error: any) {
    console.error('Error fetching finance data:', error)
    return NextResponse.json({ error: 'Moliya ma\'lumotlarini yuklashda xatolik' }, { status: 500 })
  }
}

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Wallet, FileText, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Buxgalteriya va Moliya",
    subtitle: "Daromad, xarajatlar va hisob-fakturalar nazorati",
    revenue: "Kirim (Oylik)",
    expenses: "Xarajat (Oylik)",
    balance: "Sof Foyda",
    newInvoice: "Yangi Hisob-faktura",
    colId: "ID",
    colPartner: "Hamkor",
    colAmount: "Summa",
    colType: "Turi",
    colStatus: "Holati",
    empty: "Tranzaksiyalar topilmadi",
    loading: "Yuklanmoqda...",
    typeIn: "Kirim",
    typeOut: "Chiqim",
    statusPaid: "To'langan",
    statusPending: "Kutilmoqda"
  },
  ru: {
    title: "Бухгалтерия и Финансы",
    subtitle: "Контроль доходов, расходов и счетов",
    revenue: "Доход (За месяц)",
    expenses: "Расход (За месяц)",
    balance: "Чистая Прибыль",
    newInvoice: "Новый счет-фактура",
    colId: "ID",
    colPartner: "Партнер",
    colAmount: "Сумма",
    colType: "Тип",
    colStatus: "Статус",
    empty: "Транзакции не найдены",
    loading: "Загрузка...",
    typeIn: "Приход",
    typeOut: "Расход",
    statusPaid: "Оплачено",
    statusPending: "Ожидается"
  },
  en: {
    title: "Accounting & Finance",
    subtitle: "Income, expenses, and invoice tracking",
    revenue: "Revenue (Monthly)",
    expenses: "Expenses (Monthly)",
    balance: "Net Profit",
    newInvoice: "New Invoice",
    colId: "ID",
    colPartner: "Partner",
    colAmount: "Amount",
    colType: "Type",
    colStatus: "Status",
    empty: "No transactions found",
    loading: "Loading...",
    typeIn: "Income",
    typeOut: "Expense",
    statusPaid: "Paid",
    statusPending: "Pending"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function AccountingPage() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fake data since we don't have the API yet
    setTimeout(() => {
      setTransactions([
        { id: 'INV-2026-01', partner: 'Agro LLC', amount: 45000000, type: 'OUT', status: 'PAID' },
        { id: 'INV-2026-02', partner: 'Retail Market', amount: 120000000, type: 'IN', status: 'PENDING' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button className="btn-primary group relative overflow-hidden">
          <FileText size={18} className="relative z-10" />
          <span className="relative z-10">{t.newInvoice}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.revenue}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">120M UZS</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <ArrowDownRight size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.expenses}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">45M UZS</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-indigo-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Wallet size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.balance}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">75M UZS</h3>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-dark-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="px-6 py-4 font-semibold">{t.colId}</th>
                <th className="px-6 py-4 font-semibold">{t.colPartner}</th>
                <th className="px-6 py-4 font-semibold">{t.colType}</th>
                <th className="px-6 py-4 font-semibold">{t.colAmount}</th>
                <th className="px-6 py-4 font-semibold text-right">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">{t.loading}</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">{t.empty}</td>
                </tr>
              ) : (
                transactions.map((tr) => (
                  <tr key={tr.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400">{tr.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{tr.partner}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        tr.type === 'IN' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tr.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {tr.type === 'IN' ? t.typeIn : t.typeOut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">
                      {tr.amount.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                        tr.status === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {tr.status === 'PAID' ? t.statusPaid : t.statusPending}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

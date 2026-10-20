'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Plus, FileText, Landmark, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function AccountingContent() {
  const { formatDual } = useLanguage()
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'invoices'>('accounts')
  const [loading, setLoading] = useState(true)
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  // Modal for new transaction
  const [showTxModal, setShowTxModal] = useState(false)
  const [savingTx, setSavingTx] = useState(false)
  const [txForm, setTxForm] = useState({
    bankAccountId: '', type: 'INCOME', amount: '', category: 'GENERAL', description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
        setTransactions(data.transactions || [])
        setInvoices(data.invoices || [])
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTx(e: React.FormEvent) {
    e.preventDefault()
    setSavingTx(true)
    try {
      const res = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txForm)
      })
      if (res.ok) {
        toast.success("Tranzaksiya saqlandi!")
        setShowTxModal(false)
        setTxForm({ bankAccountId: '', type: 'INCOME', amount: '', category: 'GENERAL', description: '' })
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingTx(false)
    }
  }

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0)
  const totalReceivables = invoices.filter(i => i.type === 'SALES_INVOICE').reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0)
  const totalPayables = invoices.filter(i => i.type === 'PURCHASE_INVOICE').reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0)

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/60 p-6 rounded-2xl border border-dark-700 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {formatDual("Moliya & Buxgalteriya", "Финансы и Бухгалтерия", "Finance & Accounting")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatDual("Kassa va Hisoblar", "Касса и Счета", "Cash & Accounts")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {formatDual("Kompaniya hisob raqamlari, daromad-xarajat va qarzdorliklar", "Банковские счета компании, доходы, расходы и задолженности", "Company accounts, income, expenses and balances")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTxModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all"
          >
            <Plus size={18} /> {formatDual("Yangi Tranzaksiya", "Новая транзакция", "New Transaction")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">{formatDual("Jami Qoldiq (Balans)", "Общий остаток (Баланс)", "Total Balance")}</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">{totalBalance.toLocaleString()} UZS</h2>
        </div>

        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">{formatDual("Bizga to'lashlari kerak (Haqdorlik)", "Нам должны (Дебиторка)", "Receivables")}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono">{totalReceivables.toLocaleString()} UZS</h2>
          <p className="text-xs text-slate-500 mt-1">{formatDual("Sotuv bo'yicha qarzdorliklar", "Задолженность по продажам", "Sales debt")}</p>
        </div>

        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">{formatDual("Biz to'lashimiz kerak (Qarzdorlik)", "Мы должны (Кредиторка)", "Payables")}</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-red-400 font-mono">{totalPayables.toLocaleString()} UZS</h2>
          <p className="text-xs text-slate-500 mt-1">{formatDual("Xomashyo va xizmatlar bo'yicha qarzlar", "Долги за сырье и услуги", "Supplier debt")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-dark-700 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'accounts'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Landmark size={16} /> {formatDual("Hisoblar va Kassa", "Счета и Касса", "Accounts & Cash")}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'transactions'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp size={16} /> {formatDual("Daromad va Xarajat", "Доходы и Расходы", "Income & Expense")}
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'invoices'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={16} /> {formatDual("Invoyslar (Qarzlar)", "Счета-фактуры (Долги)", "Invoices")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-500" size={32} /></div>
      ) : activeTab === 'accounts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-full p-10 text-center text-slate-500">{formatDual("Hisoblar topilmadi. Baza bo'sh.", "Счета не найдены. База пуста.", "Accounts not found. Database empty.")}</div>
          ) : accounts.map(a => (
            <div key={a.id} className="card p-5 rounded-2xl border border-dark-700 bg-gradient-to-br from-dark-800 to-dark-900 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{a.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{a.accountNumber || formatDual("Naqd kassa", "Наличная касса", "Cash desk")}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 rounded-full">
                  ACTIVE
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">{formatDual("Joriy qoldiq:", "Текущий остаток:", "Current balance:")}</p>
                <p className="text-3xl font-bold text-white font-mono tracking-tight">
                  {a.balance.toLocaleString()} <span className="text-base font-normal text-slate-500">{a.currency}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'transactions' ? (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                <th className="p-4">{formatDual("Sana", "Дата", "Date")}</th>
                <th className="p-4">{formatDual("Turi", "Тип", "Type")}</th>
                <th className="p-4">{formatDual("Kategoriya", "Категория", "Category")}</th>
                <th className="p-4">{formatDual("Kassa/Hisob", "Касса/Счет", "Cash/Account")}</th>
                <th className="p-4 text-right">{formatDual("Summa", "Сумма", "Amount")}</th>
                <th className="p-4">{formatDual("Izoh", "Примечание", "Notes")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 text-sm">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">{formatDual("Tranzaksiyalar yo'q", "Нет транзакций", "No transactions")}</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-dark-800/50">
                  <td className="p-4 text-slate-300">{new Date(tx.date).toLocaleString()}</td>
                  <td className="p-4">
                    {tx.type === 'INCOME' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex inline-flex items-center gap-1">
                        <TrendingUp size={12} /> {formatDual("Tushum", "Доход", "Income")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex inline-flex items-center gap-1">
                        <TrendingDown size={12} /> {formatDual("Xarajat", "Расход", "Expense")}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-300">{tx.category}</td>
                  <td className="p-4 text-slate-300">{tx.bankAccount?.name}</td>
                  <td className={`p-4 font-bold text-right font-mono ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString()} UZS
                  </td>
                  <td className="p-4 text-slate-400">{tx.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden p-10 text-center text-slate-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl text-white font-bold mb-2">{formatDual("Invoyslar Qismi Ishlanmoqda", "Раздел счетов в разработке", "Invoices Section Under Development")}</h2>
          <p>{formatDual("Bu yerda mijozlar va yetkazib beruvchilardan bo'lgan qarzlar (to'lanmagan nakladnoylar) chiqadi.", "Здесь будут отображаться задолженности клиентов и поставщиков (неоплаченные накладные).", "Customer and supplier receivables/payables (unpaid invoices) will appear here.")}</p>
        </div>
      )}

      {/* NEW TRANSACTION MODAL */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-violet-500" /> {formatDual("Yangi Tranzaksiya", "Новая транзакция", "New Transaction")}
              </h2>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleCreateTx} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Turi", "Тип", "Type")}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTxForm({...txForm, type: 'INCOME'})} className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${txForm.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>{formatDual("Tushum (Kirim)", "Доход (Приход)", "Income (Inflow)")}</button>
                  <button type="button" onClick={() => setTxForm({...txForm, type: 'EXPENSE'})} className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${txForm.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>{formatDual("Xarajat (Chiqim)", "Расход (Убыток)", "Expense (Outflow)")}</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Kassa / Hisob *", "Касса / Счет *", "Cash desk / Account *")}</label>
                <select 
                  required
                  value={txForm.bankAccountId} 
                  onChange={e => setTxForm({...txForm, bankAccountId: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500"
                >
                  <option value="">{formatDual("-- Hisobni tanlang --", "-- Выберите счет --", "-- Select account --")}</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (Qoldiq: {a.balance.toLocaleString()} UZS)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Summa (UZS) *", "Сумма (UZS) *", "Amount (UZS) *")}</label>
                <input 
                  type="number" required placeholder="Masalan: 500000"
                  value={txForm.amount} 
                  onChange={e => setTxForm({...txForm, amount: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500 font-mono" 
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Kategoriya", "Категория", "Category")}</label>
                <select 
                  value={txForm.category} 
                  onChange={e => setTxForm({...txForm, category: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500"
                >
                  <option value="GENERAL">{formatDual("Umumiy", "Общий", "General")}</option>
                  <option value="SALARY">{formatDual("Oylik Maosh", "Зарплата", "Salary")}</option>
                  <option value="RAW_MATERIALS">{formatDual("Xomashyo Xaridi", "Закупка сырья", "Raw Materials")}</option>
                  <option value="SALES">{formatDual("Mijoz To'lovi", "Оплата от клиента", "Customer Payment")}</option>
                  <option value="UTILITIES">{formatDual("Kommunal va Soliq", "Коммунальные и налоги", "Utilities & Tax")}</option>
                  <option value="LOGISTICS">{formatDual("Yo'l Kira (Logistika)", "Транспорт (Логистика)", "Logistics")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Izoh", "Примечание", "Notes")}</label>
                <input 
                  type="text" placeholder="Nima uchun pul kirib/chiqmoqda?"
                  value={txForm.description} 
                  onChange={e => setTxForm({...txForm, description: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-5 py-2.5 bg-dark-700 text-slate-300 rounded-xl hover:bg-dark-600 font-medium">{formatDual("Bekor qilish", "Отмена", "Cancel")}</button>
                <button type="submit" disabled={savingTx} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 font-semibold shadow-lg disabled:opacity-50">
                  {savingTx ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />} {formatDual("Saqlash", "Сохранить", "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

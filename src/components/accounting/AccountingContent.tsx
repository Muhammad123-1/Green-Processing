'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, Plus, FileText, Landmark, Loader2, ArrowRight, Truck, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { TableSkeleton } from '@/components/common/Skeleton'
import SupplierDebtsTable from './SupplierDebtsTable'

export default function AccountingContent() {
  const { formatDual } = useLanguage()
  const [activeTab, setActiveTab] = useState<'supplierDebts' | 'accounts' | 'transactions' | 'invoices'>('supplierDebts')
  const [loading, setLoading] = useState(true)
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [totalSupplierDebt, setTotalSupplierDebt] = useState<number>(0)
  const [suppliersCount, setSuppliersCount] = useState<number>(0)
  const [debtsRefreshKey, setDebtsRefreshKey] = useState<number>(0)

  // Modal for new transaction
  const [showTxModal, setShowTxModal] = useState(false)
  const [savingTx, setSavingTx] = useState(false)
  const [txForm, setTxForm] = useState({
    bankAccountId: '', type: 'EXPENSE', amount: '', category: 'RAW_MATERIALS', description: ''
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
        setTotalSupplierDebt(data.totalSupplierDebt || 0)
        setSuppliersCount(data.suppliersCount || 0)
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
        toast.success("Tranzaksiya muvaffaqiyatli saqlandi!")
        setShowTxModal(false)
        setTxForm({ bankAccountId: '', type: 'EXPENSE', amount: '', category: 'RAW_MATERIALS', description: '' })
        setDebtsRefreshKey(k => k + 1)
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

  const totalBalance = accounts.reduce((acc, account) => acc + (account.balance || 0), 0)
  const totalPayables = totalSupplierDebt || invoices.filter(i => i.type === 'PURCHASE_INVOICE').reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0)

  return (
    <div className="accounting-page space-y-6 animate-enter">
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
            {formatDual("Kompaniya hisob raqamlari, daromad-xarajat va ta'minotchilar qarzdorligi", "Банковские счета компании, доходы, расходы и задолженности", "Company accounts, income, expenses and supplier payables")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 transition-all"
          >
            <MessageSquare size={17} className="text-emerald-400" />
            <span>{formatDual("Tezkor Chat", "Корпоративный Чат", "Live Chat")}</span>
          </Link>
          <button
            onClick={() => {
              setTxForm({
                bankAccountId: accounts[0]?.id ? String(accounts[0].id) : '',
                type: 'EXPENSE',
                amount: '',
                category: 'RAW_MATERIALS',
                description: ''
              })
              setShowTxModal(true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all"
          >
            <Plus size={18} /> {formatDual("Yangi Tranzaksiya", "Новая транзакция", "New Transaction")}
          </button>
        </div>
      </div>

      {/* KPI Cards: Balans va Oddiy Qarzdorlik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Balance */}
        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">{formatDual("Jami Qoldiq (Balans)", "Общий остаток (Баланс)", "Total Balance")}</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalBalance.toLocaleString()} UZS</h2>
          <p className="text-xs text-slate-500 mt-1">
            {formatDual("Bank va kassa hisoblaridagi jami mavjud mablag'", "Всего средств на банковских счетах и в кассе", "Total cash and bank accounts balance")}
          </p>
        </div>

        {/* Qarzdorlik (Replaced 'Biz to'lashimiz kerak' per user instruction) */}
        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">{formatDual("Qarzdorlik", "Задолженность", "Total Payables / Debt")}</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-red-400 font-mono">{totalPayables.toLocaleString()} UZS</h2>
          <p className="text-xs text-slate-500 mt-1">
            {suppliersCount > 0
              ? formatDual(`${suppliersCount} ta ta'minotchi oldidagi tasdiqlangan qarz`, `Перед ${suppliersCount} поставщиками сырья`, `Liabilities across ${suppliersCount} raw material suppliers`)
              : formatDual("Kunlik kirimlar jurnali (ShopArrival) bo'yicha qoldiq qarz", "Задолженность по журналу прихода", "Total remaining supplier payables")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-dark-700 pb-2 overflow-x-auto flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveTab('supplierDebts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'supplierDebts'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Truck size={16} /> {formatDual("Ta'minotchilar Qarzdorligi", "Долги перед поставщиками", "Supplier Payables")}
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'accounts'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Landmark size={16} /> {formatDual("Hisoblar va Kassa", "Счета и Касса", "Accounts & Cash")}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'transactions'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp size={16} /> {formatDual("Daromad va Xarajat", "Доходы и Расходы", "Income & Expense")}
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'invoices'
              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={16} /> {formatDual("Invoyslar", "Счета-фактуры", "Invoices")}
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : activeTab === 'supplierDebts' ? (
        <SupplierDebtsTable
          key={debtsRefreshKey}
          onOpenPaymentModal={(supName, remaining) => {
            setTxForm({
              bankAccountId: accounts[0]?.id ? String(accounts[0].id) : '',
              type: 'EXPENSE',
              amount: String(remaining),
              category: 'RAW_MATERIALS',
              description: `${supName} xomashyo qarzini to'lash`,
            })
            setShowTxModal(true)
          }}
        />
      ) : activeTab === 'accounts' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {(a.balance || 0).toLocaleString()} <span className="text-base font-normal text-slate-500">{a.currency}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'transactions' ? (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500">
                      {formatDual("Tranzaksiyalar yo'q. 'Yangi Tranzaksiya' tugmasi orqali kirim yoki chiqim qo'shing.", "Нет транзакций", "No transactions yet")}
                    </td>
                  </tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-dark-800/50">
                    <td className="p-4 text-slate-300 whitespace-nowrap">{new Date(tx.date).toLocaleString()}</td>
                    <td className="p-4 whitespace-nowrap">
                      {tx.type === 'INCOME' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 inline-flex items-center gap-1">
                          <TrendingUp size={12} /> {formatDual("Tushum", "Доход", "Income")}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 inline-flex items-center gap-1">
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
        </div>
      ) : activeTab === 'invoices' ? (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                  <th className="p-4">{formatDual("Invoys №", "Счет-фактура №", "Invoice #")}</th>
                  <th className="p-4">{formatDual("Sana", "Дата", "Date")}</th>
                  <th className="p-4">{formatDual("Muddati", "Срок", "Due Date")}</th>
                  <th className="p-4">{formatDual("Turi", "Тип", "Type")}</th>
                  <th className="p-4 text-right">{formatDual("Jami Summa", "Общая сумма", "Total Amount")}</th>
                  <th className="p-4 text-right">{formatDual("To'langan", "Оплачено", "Paid")}</th>
                  <th className="p-4 text-right">{formatDual("Qoldiq", "Остаток", "Remaining")}</th>
                  <th className="p-4 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50 text-sm">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <FileText className="mx-auto mb-3 text-slate-600" size={36} />
                      <p className="font-semibold">{formatDual("Rasmiy hisob-fakturalar (Invoyslar) ro'yxati bo'sh", "Список счетов-фактур пуст", "Invoice list is empty")}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        {formatDual(
                          "Barcha xomashyo yetkazib berish hisob-kitoblari kunlik kirim jurnali (ShopArrival) orqali «Ta'minotchilar Qarzdorligi» bo'limida avtomatik hisoblanmoqda.",
                          "Все расчеты по поставкам сырья ведутся через журнал прихода в разделе «Долги перед поставщиками».",
                          "All raw material delivery liabilities are tracked in the «Supplier Payables» tab."
                        )}
                      </p>
                      <button
                        onClick={() => setActiveTab('supplierDebts')}
                        className="mt-4 px-4 py-2 bg-violet-600/30 text-violet-400 hover:bg-violet-600/50 rounded-xl text-xs font-bold border border-violet-500/40 transition-colors cursor-pointer"
                      >
                        {formatDual("Ta'minotchilar Qarzdorligiga o'tish →", "Перейти к Долгам поставщиков →", "Go to Supplier Payables →")}
                      </button>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const remaining = inv.totalAmount - (inv.paidAmount || 0)
                    return (
                      <tr key={inv.id} className="hover:bg-dark-800/50">
                        <td className="p-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                        <td className="p-4 text-slate-300">{new Date(inv.issuedDate).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-400">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="p-4 text-xs font-bold">
                          {inv.type === 'SALES_INVOICE' ? (
                            <span className="text-emerald-400">Sotuv</span>
                          ) : (
                            <span className="text-indigo-400">Xarid</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-white">{inv.totalAmount.toLocaleString()} UZS</td>
                        <td className="p-4 text-right font-mono text-emerald-400">{(inv.paidAmount || 0).toLocaleString()} UZS</td>
                        <td className="p-4 text-right font-mono font-bold text-red-400">{remaining.toLocaleString()} UZS</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                            inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* NEW TRANSACTION MODAL */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-violet-500" /> {formatDual("Yangi Tranzaksiya", "Новая транзакция", "New Transaction")}
              </h2>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleCreateTx} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Turi", "Тип", "Type")}</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTxForm({...txForm, type: 'INCOME'})} className={`flex-1 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${txForm.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>{formatDual("Tushum (Kirim)", "Доход (Приход)", "Income (Inflow)")}</button>
                  <button type="button" onClick={() => setTxForm({...txForm, type: 'EXPENSE'})} className={`flex-1 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${txForm.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>{formatDual("Xarajat (Chiqim)", "Расход (Убыток)", "Expense (Outflow)")}</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Kassa / Hisob *", "Касса / Счет *", "Cash desk / Account *")}</label>
                <select 
                  required
                  value={txForm.bankAccountId} 
                  onChange={e => setTxForm({...txForm, bankAccountId: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500 outline-none"
                >
                  <option value="">{formatDual("-- Hisobni tanlang --", "-- Выберите счет --", "-- Select account --")}</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (Qoldiq: {(a.balance || 0).toLocaleString()} UZS)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Summa (UZS) *", "Сумма (UZS) *", "Amount (UZS) *")}</label>
                <input 
                  type="number" required placeholder="Masalan: 500000"
                  value={txForm.amount} 
                  onChange={e => setTxForm({...txForm, amount: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500 font-mono outline-none" 
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Kategoriya", "Категория", "Category")}</label>
                <select 
                  value={txForm.category} 
                  onChange={e => setTxForm({...txForm, category: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500 outline-none"
                >
                  <option value="RAW_MATERIALS">{formatDual("Xomashyo Xaridi (Ta'minotchi)", "Закупка сырья", "Raw Materials")}</option>
                  <option value="GENERAL">{formatDual("Umumiy", "Общий", "General")}</option>
                  <option value="SALARY">{formatDual("Oylik Maosh", "Зарплата", "Salary")}</option>
                  <option value="SALES">{formatDual("Mijoz To'lovi", "Оплата от клиента", "Customer Payment")}</option>
                  <option value="UTILITIES">{formatDual("Kommunal va Soliq", "Коммунальные и налоги", "Utilities & Tax")}</option>
                  <option value="LOGISTICS">{formatDual("Yo'l Kira (Logistika)", "Транспорт (Логистика)", "Logistics")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">{formatDual("Izoh", "Примечание", "Notes")}</label>
                <input 
                  type="text" placeholder="Nima uchun pul kirib/chiqmoqda? (Masalan: ECO-GROW qarz to'lovi)"
                  value={txForm.description} 
                  onChange={e => setTxForm({...txForm, description: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-violet-500 outline-none" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-5 py-2.5 bg-dark-700 text-slate-300 rounded-xl hover:bg-dark-600 font-medium cursor-pointer">{formatDual("Bekor qilish", "Отмена", "Cancel")}</button>
                <button type="submit" disabled={savingTx} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 font-semibold shadow-lg disabled:opacity-50 cursor-pointer">
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

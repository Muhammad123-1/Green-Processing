'use client'

import React, { useState, useEffect } from 'react'
import {
  Truck,
  Search,
  DollarSign,
  TrendingDown,
  Calendar,
  Layers,
  ChevronRight,
  X,
  CreditCard,
  FileCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface SupplierDebtsTableProps {
  isProcurementView?: boolean
  onOpenPaymentModal?: (supplierName: string, remainingDebt: number) => void
}

export default function SupplierDebtsTable({
  isProcurementView = false,
  onOpenPaymentModal,
}: SupplierDebtsTableProps) {
  const { formatDual } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL')

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/finance/supplier-debts')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const suppliers: any[] = data?.suppliers || []
  const summary = data?.summary || {
    totalOutstandingDebtUzs: 0,
    totalConfirmedPaymentsUzs: 0,
    totalPurchasesUzs: 0,
    totalOverdueDebtUzs: 0,
    suppliersWithDebtCount: 0,
    totalTrackedSuppliers: 0,
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (s.inn || '').includes(searchQuery.trim())
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'UNPAID'
        ? s.status === 'UNPAID' || s.status === 'OVERDUE'
        : s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Outstanding Debt */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Jami Qoldiq Qarz", "Остаток долга", "Total Outstanding Debt")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-red-600 dark:text-red-400 font-mono">
            {summary.totalOutstandingDebtUzs.toLocaleString()} <span className="text-xs font-semibold text-slate-500">so'm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {summary.suppliersWithDebtCount} {formatDual("ta ta'minotchi oldida", "поставщиков", "suppliers")}
          </span>
        </div>

        {/* Total Purchases Delivered */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Jami Xarid Miqdori", "Объем закупок", "Total Purchases Value")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {summary.totalPurchasesUzs.toLocaleString()} <span className="text-xs font-semibold text-slate-500">so'm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Tasdiqlangan kirim aktlari bo'yicha", "По актам приемки", "Per verified inbound acts")}
          </span>
        </div>

        {/* Total Confirmed Payments */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("To'langan Summa", "Оплачено", "Confirmed Payments")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {summary.totalConfirmedPaymentsUzs.toLocaleString()} <span className="text-xs font-semibold text-slate-500">so'm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Buxgalteriya tasdiqlagan", "Подтверждено бухгалтерией", "Accounting verified")}
          </span>
        </div>

        {/* Overdue Debt */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Muddati O'tgan Qarz", "Просроченный долг", "Overdue Liabilities")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {summary.totalOverdueDebtUzs.toLocaleString()} <span className="text-xs font-semibold text-slate-500">so'm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Muddati yetib kelgan to'lovlar", "Срок оплаты истек", "Due date passed")}
          </span>
        </div>
      </div>

      {/* Toolbar: Search & Status Filters */}
      <div className="bg-white dark:bg-dark-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">{formatDual("Holati:", "Статус:", "Status:")}</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
            }`}
          >
            {formatDual("Barchasi", "Все", "All")} ({suppliers.length})
          </button>
          <button
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'UNPAID'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
            }`}
          >
            {formatDual("Qarzdorlar", "С долгом", "With Debt")} ({summary.suppliersWithDebtCount})
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
            }`}
          >
            {formatDual("To'langan", "Оплачено", "Settled")}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={formatDual("Ta'minotchi nomi yoki INN...", "Поиск поставщика...", "Search supplier...")}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
            <p className="text-xs font-semibold">{formatDual("Ma'lumotlar yuklanmoqda...", "Загрузка...", "Loading...")}</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 italic">
            {formatDual("Ta'minotchilar bo'yicha yozuvlar topilmadi", "Поставщики не найдены", "No supplier records found")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <th className="p-3 w-12 text-center">№</th>
                  <th className="p-3">{formatDual("Ta'minotchi", "Поставщик", "Supplier")}</th>
                  <th className="p-3 text-center">{formatDual("Kirim Aktlari", "Акты", "Inbound Acts")}</th>
                  <th className="p-3 text-right">{formatDual("Xarid Summasi", "Сумма закупки", "Purchases Value")}</th>
                  <th className="p-3 text-right">{formatDual("To'langan", "Оплачено", "Paid")}</th>
                  <th className="p-3 text-right font-black text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20">
                    {formatDual("Qoldiq Qarz", "Остаток долга", "Outstanding Balance")}
                  </th>
                  <th className="p-3 text-center">{formatDual("Oxirgi Kirim", "Посл. поставка", "Last Delivery")}</th>
                  <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                  <th className="p-3 text-center w-20">{formatDual("Amal", "Действие", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-xs">
                {filteredSuppliers.map((sup, idx) => (
                  <tr
                    key={sup.id || idx}
                    onClick={() => setSelectedSupplier(sup)}
                    className="hover:bg-slate-50/80 dark:hover:bg-dark-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Truck size={14} className="text-indigo-500" />
                        <span>{sup.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {sup.inn !== '-' ? `INN: ${sup.inn}` : sup.phone !== '-' ? `Tel: ${sup.phone}` : "Rasmiy ta'minotchi"}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {sup.actsCount} {formatDual("ta akt", "акта", "acts")}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {sup.totalPurchasedUzs.toLocaleString()} <span className="text-[10px] text-slate-400">so'm</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {sup.totalPaidUzs > 0 ? `${sup.totalPaidUzs.toLocaleString()} so'm` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-red-600 dark:text-red-400 bg-red-50/20 dark:bg-red-950/10">
                      {sup.remainingDebtUzs > 0 ? `${sup.remainingDebtUzs.toLocaleString()} so'm` : '0 so\'m'}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                      {sup.lastDeliveryDate || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sup.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : sup.status === 'OVERDUE'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : sup.status === 'PARTIAL'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {sup.status === 'PAID'
                          ? formatDual("To'langan", "Оплачено", "Paid")
                          : sup.status === 'OVERDUE'
                          ? formatDual("Muddati o'tgan", "Просрочено", "Overdue")
                          : sup.status === 'PARTIAL'
                          ? formatDual("Qisman", "Частично", "Partial")
                          : formatDual("Qarzdor", "Долг", "Unpaid")}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={16} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Financial Drill-Down Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between bg-slate-50 dark:bg-dark-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedSupplier.name}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        selectedSupplier.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedSupplier.remainingDebtUzs > 0 ? "Qarzdorlik mavjud" : "To'liq hisob-kitob qilingan"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDual("Buxgalteriya va qabul aktlari bo'yicha to'liq moliyaviy audit", "Полный финансовый аудит по актам приемки", "Financial audit by verified inbound acts")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isProcurementView && onOpenPaymentModal && selectedSupplier.remainingDebtUzs > 0 && (
                  <button
                    onClick={() => {
                      const sup = selectedSupplier
                      setSelectedSupplier(null)
                      onOpenPaymentModal(sup.name, sup.remainingDebtUzs)
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                  >
                    <CreditCard size={14} />
                    <span>{formatDual("To'lov kiritish", "Внести оплату", "Record Payment")}</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Key Financial Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-dark-800/40 p-4 rounded-2xl border border-slate-200 dark:border-dark-750">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{formatDual("Jami Xarid", "Всего закупка", "Total Invoiced")}</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {selectedSupplier.totalPurchasedUzs.toLocaleString()} so'm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{formatDual("To'langan", "Оплачено", "Total Paid")}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                    {selectedSupplier.totalPaidUzs.toLocaleString()} so'm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{formatDual("Qoldiq Qarz", "Остаток долга", "Remaining Debt")}</span>
                  <span className="text-base font-black text-red-600 dark:text-red-400 font-mono mt-0.5 block">
                    {selectedSupplier.remainingDebtUzs.toLocaleString()} so'm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{formatDual("Aktlar Soni", "Кол-во актов", "Acts Count")}</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                    {selectedSupplier.actsCount} ta
                  </span>
                </div>
              </div>

              {/* Verified Incoming Raw Material Acts Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-500" />
                  <span>{formatDual("Tasdiqlangan Xomashyo Qabul Aktlari (Narxi va Miqdori)", "Акты приемки сырья (цена и объем)", "Verified Inbound Acts (Price & Qty)")}</span>
                </h4>
                <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm max-h-72 custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 sticky top-0 font-bold border-b border-slate-200 dark:border-dark-700">
                      <tr>
                        <th className="p-2.5">Akt №</th>
                        <th className="p-2.5">Sana</th>
                        <th className="p-2.5">Xomashyo</th>
                        <th className="p-2.5 text-center">Miqdor (kg)</th>
                        <th className="p-2.5 text-right">Narx / kg</th>
                        <th className="p-2.5 text-right font-black text-slate-900 dark:text-white">Jami Summa</th>
                        <th className="p-2.5">Tekshiruvchi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                      {selectedSupplier.acts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                            Aktlar topilmadi
                          </td>
                        </tr>
                      ) : (
                        selectedSupplier.acts.map((act: any, aIdx: number) => (
                          <tr key={act.id || aIdx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                            <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              #{act.actNumber}
                            </td>
                            <td className="p-2.5 text-slate-500 font-mono">{act.date}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{act.product}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{act.quantityKg.toLocaleString()} kg</td>
                            <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                              {act.pricePerKg.toLocaleString()} so'm
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                              {act.totalAmount.toLocaleString()} so'm
                            </td>
                            <td className="p-2.5 text-slate-500">{act.inspector}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History if any */}
              {selectedSupplier.payments.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-emerald-500" />
                    <span>{formatDual("Amalga Oshirilgan Buxgalteriya To'lovlari", "Платежи бухгалтерии", "Payments History")}</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-700">
                        <tr>
                          <th className="p-2.5">Sana</th>
                          <th className="p-2.5 text-right">Summa</th>
                          <th className="p-2.5">Hisob raqam</th>
                          <th className="p-2.5">Kategoriya</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                        {selectedSupplier.payments.map((p: any, pIdx: number) => (
                          <tr key={p.id || pIdx}>
                            <td className="p-2.5 font-mono text-slate-500">{p.date}</td>
                            <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {p.amount.toLocaleString()} so'm
                            </td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">{p.accountName}</td>
                            <td className="p-2.5 text-slate-500">{p.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-dark-750 flex items-center justify-between bg-slate-50 dark:bg-dark-800/60 text-xs">
              <span className="text-slate-500">
                {isProcurementView
                  ? formatDual("Buxgalteriya tasdiqlagan rasmiy qoldiqlar (Faqat ko'rish uchun)", "Официальный остаток бухгалтерии", "Official balance by Accounting (Read-only)")
                  : formatDual("Yagona buxgalteriya balansi bilan sinxronlangan", "Синхронизировано с бухгалтерией", "Synced with Accounting Ledger")}
              </span>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

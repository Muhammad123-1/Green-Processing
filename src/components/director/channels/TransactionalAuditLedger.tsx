'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowUpDown,
  Download,
  Printer
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  transactionalRecords: any[]
  selectedCustomerId?: number | null
  onClearCustomerFilter?: () => void
}

export default function TransactionalAuditLedger({
  transactionalRecords,
  selectedCustomerId,
  onClearCustomerFilter
}: Props) {
  const { formatDual, lang } = useLanguage()
  const [activeLedgerTab, setActiveLedgerTab] = useState<'INVOICES' | 'ORDERS' | 'RETURNS'>('INVOICES')
  const [search, setSearch] = useState('')
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false)

  const formatUzs = (val: number) => {
    return `${Math.round(val).toLocaleString('uz-UZ')} so'm`
  }

  // Filter Records
  const filteredRecords = useMemo(() => {
    return transactionalRecords.filter(r => {
      const matchCustomer = !selectedCustomerId || r.customerId === selectedCustomerId
      const matchOverdue = !filterOverdueOnly || r.isOverdue
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        r.orderNumber.toLowerCase().includes(q) ||
        (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(q)) ||
        r.customerName.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q)

      return matchCustomer && matchOverdue && matchSearch
    })
  }, [transactionalRecords, selectedCustomerId, filterOverdueOnly, search])

  // Extract Flattened Returns for Returns tab
  const allReturns = useMemo(() => {
    const list: any[] = []
    filteredRecords.forEach(r => {
      if (r.returns && r.returns.length > 0) {
        r.returns.forEach((ret: any) => {
          list.push({
            ...ret,
            orderNumber: r.orderNumber,
            customerName: r.customerName,
            channelCategory: r.channelCategory
          })
        })
      }
    })
    return list
  }, [filteredRecords])

  const selectedCustomerName = selectedCustomerId
    ? transactionalRecords.find(r => r.customerId === selectedCustomerId)?.customerName
    : null

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {formatDual(
                  "Tranzaksion Audit Reestri (Level 3 Drill-Down)",
                  "Транзакционный реестр и первичный аудит (Уровень 3)",
                  "Transactional Audit Ledger (Level 3 Drill-Down)"
                )}
              </h3>
              {selectedCustomerName && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 flex items-center gap-1">
                  <span>{selectedCustomerName}</span>
                  {onClearCustomerFilter && (
                    <button
                      type="button"
                      onClick={onClearCustomerFilter}
                      className="ml-1 text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {formatDual(
                "Haqiqiy schot-fakturalar, buyurtmalar, qaytma aktlari va to'lovlar zanjiri",
                "Реальные счета-фактуры, заказы, акты возврата и платежи",
                "Actual invoices, sales orders, returns, and payment records"
              )}
            </p>
          </div>
        </div>

        {/* Ledger Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeLedgerTab === 'INVOICES'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard size={13} />
              <span>{formatDual("Schot-Fakturalar", "Счета-фактуры", "Invoices")} ({filteredRecords.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('ORDERS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeLedgerTab === 'ORDERS'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={13} />
              <span>{formatDual("Buyurtmalar", "Заказы", "Sales Orders")} ({filteredRecords.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('RETURNS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeLedgerTab === 'RETURNS'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <RotateCcw size={13} />
              <span>{formatDual("Qaytmalar", "Возвраты", "Returns")} ({allReturns.length})</span>
            </button>
          </div>

          {/* Overdue filter */}
          {activeLedgerTab === 'INVOICES' && (
            <button
              type="button"
              onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                filterOverdueOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
              }`}
            >
              {formatDual("Faqat muddati o'tganlar", "Только просроченные", "Overdue only")}
            </button>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:w-44">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={formatDual("Hujjat qidirish...", "Поиск документа...", "Search doc...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 1. INVOICES TABLE */}
      {activeLedgerTab === 'INVOICES' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
                <th className="p-3 pl-4">{formatDual("Schot-Faktura №", "Счет №", "Invoice #")}</th>
                <th className="p-3">{formatDual("Buyurtma №", "Заказ №", "Order #")}</th>
                <th className="p-3">{formatDual("Mijoz & Kompaniya", "Клиент / Фирма", "Customer / Company")}</th>
                <th className="p-3 text-center">{formatDual("Sana", "Дата", "Date")}</th>
                <th className="p-3 text-center">{formatDual("To'lov Muddati", "Срок оплаты", "Due Date")}</th>
                <th className="p-3 text-right">{formatDual("Jami Summa", "Сумма счета", "Total Amount")}</th>
                <th className="p-3 text-right">{formatDual("To'langan", "Оплачено", "Paid")}</th>
                <th className="p-3 text-right">{formatDual("Qoldiq Qarz", "Остаток долга", "Outstanding")}</th>
                <th className="p-3 text-center pr-4">{formatDual("Holati", "Статус", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {formatDual("Schot-fakturalar topilmadi", "Счета не найдены", "No invoices found")}
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.invoiceNumber || `INV-${r.orderNumber}`}
                    </td>

                    <td className="p-3 font-mono text-slate-500">
                      {r.orderNumber}
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {r.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {r.companyName}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                      {r.orderDate}
                    </td>

                    <td className="p-3 text-center font-mono whitespace-nowrap">
                      <span className={r.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                        {r.invoiceDueDate || '—'}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatUzs(r.totalAmount)}
                    </td>

                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      {formatUzs(r.paidAmount)}
                    </td>

                    <td className="p-3 text-right font-mono font-black whitespace-nowrap">
                      {r.outstandingAmount > 0 ? (
                        <span className={r.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                          {formatUzs(r.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold">0</span>
                      )}
                    </td>

                    <td className="p-3 text-center pr-4 whitespace-nowrap">
                      {r.isOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          {formatDual("MUDDATI O'TGAN", "ПРОСРОЧЕН", "OVERDUE")}
                        </span>
                      ) : r.outstandingAmount <= 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {formatDual("TO'LANGAN", "ОПЛАЧЕН", "PAID")}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {formatDual("QISMAN / OCHIQ", "ОТКРЫТ", "PARTIAL")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. ORDERS TABLE */}
      {activeLedgerTab === 'ORDERS' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
                <th className="p-3 pl-4">{formatDual("Buyurtma №", "Заказ №", "Order #")}</th>
                <th className="p-3">{formatDual("Mijoz", "Клиент", "Customer")}</th>
                <th className="p-3 text-center">{formatDual("Yetkazish Sanasi", "Дата доставки", "Delivery Date")}</th>
                <th className="p-3">{formatDual("Mahsulotlar tarkibi", "Состав заказа", "Order Items")}</th>
                <th className="p-3 text-right">{formatDual("Chegirma", "Скидка", "Discount")}</th>
                <th className="p-3 text-right">{formatDual("Logistika Xarajati", "Логистика", "Logistics")}</th>
                <th className="p-3 text-right">{formatDual("Jami Qiymat", "Сумма заказа", "Net Amount")}</th>
                <th className="p-3 text-center pr-4">{formatDual("Holati", "Статус", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
              {filteredRecords.map(r => (
                <tr key={`ord-${r.id}`} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition">
                  <td className="p-3 pl-4 font-mono font-black text-slate-900 dark:text-white">
                    {r.orderNumber}
                  </td>

                  <td className="p-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {r.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {r.companyName}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                    {r.deliveryDate || r.orderDate}
                  </td>

                  <td className="p-3 max-w-sm">
                    <div className="flex flex-wrap gap-1">
                      {r.items.map((it: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-[11px] font-mono">
                          {it.productName} ({it.quantity} {it.unit})
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono text-slate-500 whitespace-nowrap">
                    {r.discountAmount > 0 ? formatUzs(r.discountAmount) : '—'}
                  </td>

                  <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                    {formatUzs(r.logisticsCost)}
                  </td>

                  <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatUzs(r.totalAmount)}
                  </td>

                  <td className="p-3 text-center pr-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. RETURNS TABLE */}
      {activeLedgerTab === 'RETURNS' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
                <th className="p-3 pl-4">{formatDual("Qaytma Akti №", "Акт возврата №", "Return Act #")}</th>
                <th className="p-3">{formatDual("Buyurtma №", "Заказ №", "Order #")}</th>
                <th className="p-3">{formatDual("Mijoz", "Клиент", "Customer")}</th>
                <th className="p-3">{formatDual("Mahsulot", "Товар", "Product")}</th>
                <th className="p-3 text-right">{formatDual("Qaytgan Miqdor", "Количество", "Quantity")}</th>
                <th className="p-3 text-right">{formatDual("Qaytma Qiymati", "Сумма возврата", "Return Amount")}</th>
                <th className="p-3">{formatDual("Sababi", "Причина возврата", "Return Reason")}</th>
                <th className="p-3 text-center pr-4">{formatDual("Sana", "Дата", "Date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
              {allReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {formatDual("Qaytarilgan mahsulotlar topilmadi", "Возвраты продукции не зафиксированы", "No returns recorded")}
                  </td>
                </tr>
              ) : (
                allReturns.map((ret, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition">
                    <td className="p-3 pl-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {ret.returnNumber}
                    </td>

                    <td className="p-3 font-mono text-slate-500">
                      {ret.orderNumber}
                    </td>

                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {ret.customerName}
                    </td>

                    <td className="p-3 font-bold">
                      {ret.productName}
                    </td>

                    <td className="p-3 text-right font-mono font-bold">
                      {ret.quantity} kg
                    </td>

                    <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatUzs(ret.returnAmount)}
                    </td>

                    <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs">
                      {ret.reason}
                    </td>

                    <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap pr-4">
                      {ret.returnDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

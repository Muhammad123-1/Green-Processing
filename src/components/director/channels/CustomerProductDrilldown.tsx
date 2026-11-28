'use client'

import React, { useState, useMemo } from 'react'
import {
  Users,
  Package,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Percent,
  TrendingUp,
  DollarSign,
  ChevronLeft
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  customers: any[]
  products: any[]
  channels: any[]
  selectedChannelKey: string
  onSelectChannel: (key: string) => void
  onInspectCustomer: (customerId: number) => void
}

export default function CustomerProductDrilldown({
  customers,
  products,
  channels,
  selectedChannelKey,
  onSelectChannel,
  onInspectCustomer
}: Props) {
  const { formatDual, lang } = useLanguage()
  const [activeSubTab, setActiveSubTab] = useState<'CUSTOMERS' | 'PRODUCTS'>('CUSTOMERS')
  const [search, setSearch] = useState('')

  const formatUzs = (val: number) => {
    return `${Math.round(val).toLocaleString('uz-UZ')} so'm`
  }

  const formatUzsShort = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} mln`
    return `${Math.round(val).toLocaleString()} so'm`
  }

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchChannel = selectedChannelKey === 'ALL' || c.channelCategory === selectedChannelKey
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.businessRole && c.businessRole.toLowerCase().includes(q)) ||
        (c.contractNumber && c.contractNumber.toLowerCase().includes(q))
      return matchChannel && matchSearch
    })
  }, [customers, selectedChannelKey, search])

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchChannel = selectedChannelKey === 'ALL' || p.channelCategory === selectedChannelKey
      const q = search.toLowerCase().trim()
      const matchSearch = !q || p.productName.toLowerCase().includes(q)
      return matchChannel && matchSearch
    })
  }, [products, selectedChannelKey, search])

  const currentChannelMeta = channels.find(c => c.channelKey === selectedChannelKey)

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xs space-y-4">
      {/* Top Controls: Channel Picker & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {formatDual("Mijozlar va Mahsulotlar Tahlili (Level 2 Drill-Down)", "Детализация по клиентам и товарам (Уровень 2)", "Customer & Product Analysis (Level 2)")}
              </h3>
              {selectedChannelKey !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onSelectChannel('ALL')}
                  className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={12} />
                  <span>{formatDual("Barcha kanallar", "Все каналы", "All channels")}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {currentChannelMeta
                ? `${formatDual("Tanlangan kanal:", "Выбран канал:", "Selected channel:")} ${lang === 'ru' ? currentChannelMeta.nameRu : currentChannelMeta.nameUz}`
                : formatDual("Barcha taqsimot kanallari bo'yicha mijozlar va tovarlar ro'yxati", "Список клиентов и товаров по всем каналам", "All customers and products across distribution channels")}
            </p>
          </div>
        </div>

        {/* Channel Dropdown & Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Subcategory Selector */}
          <select
            value={selectedChannelKey}
            onChange={e => onSelectChannel(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
          >
            <option value="ALL">{formatDual("Barcha Kanallar (8+1)", "Все каналы (8+1)", "All Channels (8+1)")}</option>
            {channels.map(ch => (
              <option key={ch.channelKey} value={ch.channelKey}>
                {lang === 'ru' ? ch.nameRu : ch.nameUz}
              </option>
            ))}
          </select>

          {/* SubTab Toggle: Customers vs Products */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('CUSTOMERS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'CUSTOMERS'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              <span>{formatDual("Mijozlar", "Клиенты", "Customers")} ({filteredCustomers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('PRODUCTS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'PRODUCTS'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Package size={13} />
              <span>{formatDual("Mahsulotlar", "Товары", "Products")} ({filteredProducts.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-44">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={formatDual("Qidiruv...", "Поиск...", "Search...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content 1: Customers Table */}
      {activeSubTab === 'CUSTOMERS' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
                <th className="p-3 pl-4">{formatDual("Mijoz Nomi & Kompaniya", "Клиент / Компания", "Customer / Company")}</th>
                <th className="p-3">{formatDual("Biznes Roli & Shartnoma", "Бизнес-роль / Договор", "Business Role / Contract")}</th>
                <th className="p-3 text-center">{formatDual("Kanal", "Канал", "Channel")}</th>
                <th className="p-3 text-right">{formatDual("Hajm (kg)", "Объем (кг)", "Volume (kg)")}</th>
                <th className="p-3 text-right">{formatDual("Sof Tushum", "Чистая Выручка", "Net Revenue")}</th>
                <th className="p-3 text-right">{formatDual("Yalpi Marja", "Маржа", "Margin")}</th>
                <th className="p-3 text-right">{formatDual("Logistika", "Логистика", "Logistics")}</th>
                <th className="p-3 text-right">{formatDual("Hissa", "Марж. доход", "Contribution")}</th>
                <th className="p-3 text-right">{formatDual("Qarzdorlik", "Задолженность", "Outstanding")}</th>
                <th className="p-3 text-right">{formatDual("Muddati O'tgan", "Просрочка", "Overdue")}</th>
                <th className="p-3 text-center">{formatDual("Kredit Limiti", "Лимит кредита", "Credit Limit")}</th>
                <th className="p-3 text-center pr-4">{formatDual("Tranzaksiyalar", "Аудит", "Audit (L3)")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    {formatDual("Mijozlar topilmadi", "Клиенты не найдены", "No customers found")}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const isDirect = cust.distributionType === 'DIRECT'
                  const chMeta = channels.find(c => c.channelKey === cust.channelCategory)

                  return (
                    <tr
                      key={cust.customerId}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition cursor-pointer"
                      onClick={() => onInspectCustomer(cust.customerId)}
                    >
                      <td className="p-3 pl-4">
                        <span className="font-black text-slate-900 dark:text-white block hover:underline">
                          {cust.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {cust.companyName}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium block truncate" title={cust.businessRole}>
                          {cust.businessRole}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cust.contractNumber ? `№ ${cust.contractNumber}` : formatDual("Shartnomasiz", "Без договора", "No contract")}
                          {cust.creditTermDays ? ` (${cust.creditTermDays} kun)` : ''}
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isDirect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {chMeta ? (lang === 'ru' ? chMeta.nameRu.split(' ')[0] : chMeta.nameUz.split(' ')[0]) : cust.channelCategory}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-medium whitespace-nowrap">
                        {Math.round(cust.volumeKg).toLocaleString('uz-UZ')} kg
                      </td>

                      <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatUzsShort(cust.netRevenue)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {cust.grossMarginPct.toFixed(1)}%
                      </td>

                      <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {formatUzsShort(cust.logisticsCost)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                        {formatUzsShort(cust.contributionAfterLogistics)}
                      </td>

                      <td className="p-3 text-right font-mono whitespace-nowrap">
                        {cust.outstandingReceivables > 0 ? (
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {formatUzsShort(cust.outstandingReceivables)}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold">0</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono whitespace-nowrap">
                        {cust.overdueReceivables > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-black">
                            {formatUzsShort(cust.overdueReceivables)}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold">0</span>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {cust.creditLimit > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-mono text-slate-400">{formatUzsShort(cust.creditLimit)}</span>
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full mt-1 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, cust.creditLimitUtilizationPct)}%` }}
                                className={`h-full ${cust.creditLimitUtilizationPct > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center pr-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onInspectCustomer(cust.customerId)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>{formatDual("Schotlar", "Счета", "Invoices")}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Content 2: Products Performance by Channel */}
      {activeSubTab === 'PRODUCTS' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
                <th className="p-3 pl-4">{formatDual("Mahsulot Nomi", "Наименование товара", "Product Name")}</th>
                <th className="p-3">{formatDual("Kanal Subkategoriyasi", "Канал сбыта", "Channel Subcategory")}</th>
                <th className="p-3 text-right">{formatDual("Sotilgan Hajm", "Объем продаж", "Volume Sold")}</th>
                <th className="p-3 text-right">{formatDual("Yalpi Tushum", "Выручка", "Gross Revenue")}</th>
                <th className="p-3 text-right">{formatDual("Tannarx (COGS)", "Себестоимость", "COGS")}</th>
                <th className="p-3 text-right">{formatDual("Yalpi Foyda", "Вал. Прибыль", "Gross Profit")}</th>
                <th className="p-3 text-right pr-4">{formatDual("Yalpi Marja", "Маржа %", "Margin %")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {formatDual("Mahsulotlar topilmadi", "Товары не найдены", "No products found")}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const chMeta = channels.find(c => c.channelKey === p.channelCategory)
                  return (
                    <tr key={`${p.productId}_${p.channelCategory}_${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition">
                      <td className="p-3 pl-4 font-black text-slate-900 dark:text-white">
                        {p.productName}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                          {chMeta ? (lang === 'ru' ? chMeta.nameRu : chMeta.nameUz) : p.channelCategory}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-medium">
                        {Math.round(p.volume).toLocaleString('uz-UZ')} {p.unit}
                      </td>

                      <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatUzsShort(p.grossRevenue)}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500">
                        {formatUzsShort(p.cogs)}
                      </td>

                      <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatUzsShort(p.grossProfit)}
                      </td>

                      <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 pr-4">
                        {p.grossMarginPct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
  Percent,
  Truck,
  DollarSign,
  AlertTriangle,
  Users,
  Eye,
  Info
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  channels: any[]
  onSelectChannel: (channelKey: string) => void
}

export default function ChannelsTable({ channels, onSelectChannel }: Props) {
  const { formatDual, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'INDIRECT'>('ALL')
  const [sortField, setSortField] = useState<string>('netRevenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const formatUzs = (val: number) => {
    return `${Math.round(val).toLocaleString('uz-UZ')} so'm`
  }

  const formatUzsShort = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} mln`
    return `${Math.round(val).toLocaleString()} so'm`
  }

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchType = filterType === 'ALL' || c.distributionType === filterType
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        c.nameUz.toLowerCase().includes(q) ||
        c.nameRu.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.channelKey.toLowerCase().includes(q)
      return matchType && matchSearch
    }).sort((a, b) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [channels, filterType, search, sortField, sortOrder])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xs space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {formatDual(
                "Taqsimot Kanallari Moliyaviy va Operatsion Ko'rsatkichlari (Level 1)",
                "Финансовые и операционные показатели каналов сбыта (Уровень 1)",
                "Distribution Channels Financial & Operational Performance (Level 1)"
              )}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
              {filteredChannels.length} ta kanal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDual(
              "Sof tushum, yalpi marja, logistika xarajatlari, logistikadan keyingi hissa va qarzdorliklar",
              "Чистая выручка, маржа, логистические расходы, маржинальный доход и дебиторка",
              "Net revenue, gross margin, logistics costs, contribution margin, and receivables"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Direct / Indirect Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {formatDual("Barchasi", "Все", "All")}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('DIRECT')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'DIRECT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setFilterType('INDIRECT')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'INDIRECT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              Indirect
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={formatDual("Kanal qidirish...", "Поиск канала...", "Search channel...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Main Channels Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-750">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-dark-750 whitespace-nowrap">
              <th className="p-3.5 pl-4">{formatDual("Kanal va Subkategoriya", "Канал сбыта", "Channel & Subcategory")}</th>
              <th className="p-3.5 text-center">{formatDual("Turi", "Тип", "Type")}</th>
              <th className="p-3.5 text-center">{formatDual("Mijozlar", "Клиенты", "Clients")}</th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('volumeKg')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Hajm (kg)", "Объем (кг)", "Volume (kg)")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('grossRevenue')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Yalpi Tushum", "Вал. Выручка", "Gross Revenue")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('netRevenue')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Sof Tushum", "Чистая Выручка", "Net Revenue")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('revenueSharePct')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Ulush %", "Доля %", "Share %")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right">{formatDual("Tannarx (COGS)", "Себестоимость", "COGS")}</th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('grossMarginPct')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Yalpi Marja", "Вал. Маржа", "Gross Margin")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right">{formatDual("Logistika", "Логистика", "Logistics")}</th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('contributionAfterLogistics')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Logistika Keyin Hissa", "Марж. Доход", "Contribution")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('overdueReceivables')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{formatDual("Muddati O'tgan Qarz", "Просрочка", "Overdue AR")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="p-3.5 text-center">{formatDual("Qaytma %", "Возврат %", "Return %")}</th>
              <th className="p-3.5 text-center pr-4">{formatDual("Batafsil", "Действия", "Drill-Down")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
            {filteredChannels.length === 0 ? (
              <tr>
                <td colSpan={14} className="p-8 text-center text-slate-400">
                  {formatDual("Taqsimot kanallari topilmadi", "Каналы сбыта не найдены", "No channels found")}
                </td>
              </tr>
            ) : (
              filteredChannels.map(ch => {
                const isDirect = ch.distributionType === 'DIRECT'
                const channelTitle = lang === 'ru' ? ch.nameRu : lang === 'en' ? ch.nameEn : ch.nameUz
                const hasCostWarning = !ch.isCostDataAvailable

                return (
                  <tr
                    key={ch.channelKey}
                    className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition cursor-pointer"
                    onClick={() => onSelectChannel(ch.channelKey)}
                  >
                    {/* Channel Name */}
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: ch.color || '#6366f1' }}
                        />
                        <div>
                          <span className="font-black text-slate-900 dark:text-white block hover:underline">
                            {channelTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1 max-w-xs">
                            {lang === 'ru' ? ch.descriptionRu : ch.descriptionUz}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isDirect
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}>
                        {isDirect ? 'Direct' : 'Indirect'}
                      </span>
                    </td>

                    {/* Active Customers */}
                    <td className="p-3.5 text-center font-bold font-mono">
                      {ch.activeCustomersCount} {formatDual("ta", "кл.", "")}
                    </td>

                    {/* Volume Kg */}
                    <td className="p-3.5 text-right font-mono font-medium whitespace-nowrap">
                      {Math.round(ch.volumeKg).toLocaleString('uz-UZ')} kg
                    </td>

                    {/* Gross Revenue */}
                    <td className="p-3.5 text-right font-mono text-slate-500 whitespace-nowrap">
                      {formatUzsShort(ch.grossRevenue)}
                    </td>

                    {/* Net Revenue */}
                    <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatUzsShort(ch.netRevenue)}
                    </td>

                    {/* Revenue Share % */}
                    <td className="p-3.5 text-right font-mono font-bold whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                        {ch.revenueSharePct.toFixed(1)}%
                      </span>
                    </td>

                    {/* COGS */}
                    <td className="p-3.5 text-right font-mono text-slate-500 whitespace-nowrap">
                      {hasCostWarning ? (
                        <span className="text-amber-500 font-bold" title={ch.costLimitationNotice}>
                          {formatDual("Tannarx yo'q*", "Нет себест.*", "No COGS*")}
                        </span>
                      ) : (
                        formatUzsShort(ch.cogs)
                      )}
                    </td>

                    {/* Gross Margin % */}
                    <td className="p-3.5 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {hasCostWarning ? '—' : `${ch.grossMarginPct.toFixed(1)}%`}
                    </td>

                    {/* Logistics Costs */}
                    <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatUzsShort(ch.logisticsCost)}
                    </td>

                    {/* Contribution After Logistics */}
                    <td className="p-3.5 text-right font-mono font-black text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {hasCostWarning ? '—' : formatUzsShort(ch.contributionAfterLogistics)}
                    </td>

                    {/* Overdue Receivables */}
                    <td className="p-3.5 text-right font-mono whitespace-nowrap">
                      {ch.overdueReceivables > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-black">
                          {formatUzsShort(ch.overdueReceivables)}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold">0</span>
                      )}
                    </td>

                    {/* Return Rate % */}
                    <td className="p-3.5 text-center font-mono whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        ch.returnRatePct > 2.0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-black'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {ch.returnRatePct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Drill-down action */}
                    <td className="p-3.5 text-center pr-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectChannel(ch.channelKey)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        title={formatDual("Mijozlar va mahsulotlar kesimida ko'rish (Level 2)", "Детализация по клиентам и товарам (Уровень 2)", "View customers & products (Level 2)")}
                      >
                        <Eye size={12} />
                        <span>{formatDual("Ko'rish", "Анализ", "Drill")}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>* {formatDual("Yalpi marja = (Sof tushum - COGS) / Sof tushum × 100", "Валовая маржа = (Чистая выручка - Себестоимость) / Выручка × 100", "Gross margin = (Net revenue - COGS) / Net revenue × 100")}</span>
        <span>{formatDual("Jadvaldagi istalgan qatorni bosib mijozlar va schotlar ro'yxatiga o'tishingiz mumkin", "Нажмите на строку канала для перехода к детализации", "Click on any channel row to drill down")}</span>
      </div>
    </div>
  )
}

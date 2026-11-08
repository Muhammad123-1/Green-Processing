'use client'

import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Search,
  Download,
  Calendar as CalendarIcon,
  Package,
  ArrowDownToLine,
  Loader2,
  Boxes,
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  Truck,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function MonitoringContent() {
  const { lang, formatDual } = useLanguage()
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMonitoringData()
  }, [period, selectedDate, selectedMonth, selectedYear])

  const fetchMonitoringData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('period', period)
      if (period === 'day' || period === 'week') {
        if (selectedDate) params.set('date', selectedDate)
      } else if (period === 'month') {
        if (selectedMonth) params.set('month', selectedMonth)
      } else if (period === 'year') {
        if (selectedYear) params.set('year', selectedYear)
      }

      const res = await fetch(`/api/monitoring?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (!selectedDate && json.activeDate) {
          setSelectedDate(json.activeDate)
        }
        if (!selectedMonth && json.activeMonth) {
          setSelectedMonth(json.activeMonth)
        }
        if (!selectedYear && json.activeYear) {
          setSelectedYear(json.activeYear)
        }
        if (json.availableDates) setAvailableDates(json.availableDates)
        if (json.availableMonths) setAvailableMonths(json.availableMonths)
        if (json.availableYears) setAvailableYears(json.availableYears)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const products: any[] = data?.products || []
  const arrivals: any[] = data?.arrivals || []

  const filteredProducts = products.filter((p) =>
    (p.product || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredArrivals = arrivals.filter((a) =>
    (a.product || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (a.supplier || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const totalKg = data?.totalKg || 0
  const totalBoxes = data?.totalBoxes || 0
  const totalPacks = data?.totalPacks || 0
  const totalArrivalsKg = data?.totalArrivalsKg || 0
  const operationalDaysCount = data?.operationalDaysCount || (period === 'day' ? 1 : 0)
  const periodLabel = data?.periodLabel || selectedDate

  return (
    <div className="flex flex-col min-h-full space-y-4 sm:space-y-6 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 flex-wrap">
              <span>{formatDual("Ishlab Chiqarish Monitoringi", 'Мониторинг производства', 'Production Monitoring')}</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold border border-indigo-200 dark:border-indigo-500/30">
                {periodLabel}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`/api/reports/excel?lang=${lang || 'uz'}`}
            download
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <Download size={15} />
            <span>Excel Export</span>
          </a>
        </div>
      </div>

      {/* Period Selector & Filter Bar */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Period Tabs: Kunlik, Haftalik, Oylik, Yillik */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setPeriod('day')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === 'day'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>{formatDual("Kunlik", "Ежедневно", "Daily")}</span>
          </button>

          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === 'week'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon size={14} />
            <span>{formatDual("Haftalik", "Неделя", "Weekly")}</span>
          </button>

          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === 'month'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{formatDual("Oylik", "Месяц", "Monthly")}</span>
          </button>

          <button
            onClick={() => setPeriod('year')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === 'year'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>{formatDual("Yillik", "Год", "Yearly")}</span>
          </button>
        </div>

        {/* Dynamic Context Picker depending on chosen period */}
        <div className="flex flex-wrap items-center gap-3">
          {period === 'day' && (
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'week' && (
            <div className="relative flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{formatDual("Hafta oxiri sanasi:", "Конец недели:", "Week end date:")}</span>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {period === 'month' && (
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'year' && (
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}-yil
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск продукта...' : 'Mahsulot qidirish...'}
              className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* 5 Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Finished Output Kg */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Tayyor Mahsulot", "Выпуск ГП", "Finished Output")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {filteredProducts.length} {formatDual("xil mahsulot turi", "видов продукции", "SKU varieties")}
          </span>
        </div>

        {/* Packaging totals are not part of monitoring. */}
        <div className="monitoring-packaging-column bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Qutilar Soni", "Коробки", "Total Boxes")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalBoxes.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{formatDual("quti", "кор", "box")}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Qadoqlangan taralar", "Упакованная тара", "Packaged boxes")}
          </span>
        </div>

        <div className="monitoring-packaging-column bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Paketlar Soni", "Упаковки", "Total Packs")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalPacks.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{formatDual("dona", "шт", "pcs")}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Alohida qadoqlar", "Индивид. упаковки", "Individual units")}
          </span>
        </div>

        {/* Card 4: Inbound Raw Arrivals */}
        <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Xomashyo Kirimi", "Приход сырья", "Raw Arrivals")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownToLine size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {totalArrivalsKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {filteredArrivals.length} {formatDual("xil xomashyo kirimi", "приемок сырья", "inbound lots")}
          </span>
        </div>

        {/* Card 5: Operational Days */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {formatDual("Faol Ish Kunlari", "Рабочие дни", "Active Days")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {operationalDaysCount} <span className="text-sm font-semibold text-slate-500">{formatDual("kun", "дней", "days")}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatDual("Tanlangan davrda", "За выбранный период", "In selected period")}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-semibold">{formatDual('Yuklanmoqda...', 'Загрузка...', 'Loading...')}</p>
            </div>
          ) : (
            <>
              {/* Finished Goods Section */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 rounded bg-indigo-600"></div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {formatDual('Sexdan Tayyor Mahsulot Chiqishi (Kirim GP)', 'Выпуск готовой продукции цеха', 'Finished Goods Output (Shop)')}
                    </h2>
                    <span className="px-2.5 py-0.5 ml-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                      {periodLabel}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {totalKg.toLocaleString()} kg
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="monitoring-finished-output-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-dark-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                        <th className="p-3 w-12 text-center">№</th>
                        <th className="p-3 border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Mahsulot nomi', 'Наименование ГП', 'Product Name')}
                        </th>
                        <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Qutilar soni (korobka)', 'Коробки', 'Boxes')}
                        </th>
                        <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Qadoqlar soni (upakovka)', 'Упаковки', 'Packs')}
                        </th>
                        <th className="p-3 text-center font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 w-40">
                          {formatDual('Jami og\'irlik (kg)', 'Вес (кг)', 'Weight (kg)')}
                        </th>
                        <th className="p-3 text-center text-[10px] w-24">
                          {formatDual("Ulush (%)", "Доля (%)", "Share (%)")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-750 text-xs">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                            {formatDual('Ushbu davrda chiqish ma\'lumotlari topilmadi', 'Данные за этот период не найдены', 'No output recorded for this period')}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((item, idx) => {
                          const pct = totalKg > 0 ? ((item.total / totalKg) * 100).toFixed(1) : '0'
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                              <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750">
                                {item.product}
                              </td>
                              <td className="p-3 text-center font-mono border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">
                                {item.boxes > 0 ? `${item.boxes.toLocaleString()} quti` : '-'}
                              </td>
                              <td className="p-3 text-center font-mono border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">
                                {item.packs > 0 ? `${item.packs.toLocaleString()} dona` : '-'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                                {item.total.toLocaleString()} kg
                              </td>
                              <td className="p-3 text-center font-mono text-slate-500 font-semibold">
                                {pct}%
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                    {filteredProducts.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-dark-800 border-t-2 border-slate-300 dark:border-dark-600 text-xs">
                          <td colSpan={2} className="p-3 font-black text-slate-900 dark:text-white uppercase">
                            {formatDual('Umumiy yakuniy chiqish:', 'ИТОГО ВЫПУСК:', 'TOTAL OUTPUT:')}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {totalBoxes > 0 ? `${totalBoxes.toLocaleString()} quti` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {totalPacks > 0 ? `${totalPacks.toLocaleString()} dona` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/30">
                            {totalKg.toLocaleString()} kg
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Raw Material Inbound Arrivals Section */}
              {arrivals.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-dark-750">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-6 rounded bg-emerald-600"></div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {period === 'day'
                          ? formatDual("Kunlik Xomashyo Kirimi", 'Приемка сырья за день', 'Raw Material Inbound Arrivals')
                          : formatDual(`Xomashyo Kirimi (${periodLabel})`, `Приемка сырья (${periodLabel})`, `Inbound Arrivals (${periodLabel})`)}
                      </h2>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {totalArrivalsKg.toLocaleString()} kg xomashyo
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-dark-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                          <th className="p-3 w-12 text-center">№</th>
                          {period === 'day' && <th className="p-3">{formatDual('Sana', 'Дата', 'Date')}</th>}
                          <th className="p-3">{formatDual('Mahsulot / Xomashyo', 'Сырье / Номенклатура', 'Raw Material')}</th>
                          <th className="p-3">{formatDual("Ta'minotchi(lar)", 'Поставщик(и)', 'Supplier(s)')}</th>
                          <th className="p-3 text-center">{formatDual('Partiya', 'Партия', 'Batch')}</th>
                          {period !== 'day' && (
                            <th className="p-3 text-center">{formatDual('Qabullar soni', 'Кол-во приемок', 'Arrivals Count')}</th>
                          )}
                          <th className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 w-36">
                            {formatDual('Jami miqdor (kg)', 'Вес (кг)', 'Weight (kg)')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-dark-750 text-xs">
                        {filteredArrivals.length === 0 ? (
                          <tr>
                            <td colSpan={period === 'day' ? 6 : 6} className="p-8 text-center text-slate-400 italic">
                              {formatDual('Xomashyo kirimi ma\'lumotlari topilmadi', 'Данные по сырью не найдены', 'No arrival data found')}
                            </td>
                          </tr>
                        ) : (
                          filteredArrivals.map((arr, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                              <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                              {period === 'day' && (
                                <td className="p-3 text-slate-500 font-mono whitespace-nowrap text-xs">{arr.date || selectedDate}</td>
                              )}
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {arr.product}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {arr.suppliers || arr.supplier || '-'}
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                                  {arr.batches || arr.batch || '-'}
                                </span>
                              </td>
                              {period !== 'day' && (
                                <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {arr.count ? `${arr.count} ta` : '-'}
                                </td>
                              )}
                              <td className="p-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">
                                {(arr.quantity || 0).toLocaleString()} kg
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredArrivals.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-dark-800 border-t-2 border-slate-300 dark:border-dark-600 text-xs">
                            <td colSpan={period === 'day' ? 5 : 5} className="p-3 font-black text-slate-900 dark:text-white uppercase">
                              {formatDual('Umumiy xomashyo kirimi:', 'ИТОГО ПРИХОД СЫРЬЯ:', 'TOTAL INBOUND ARRIVALS:')}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30">
                              {totalArrivalsKg.toLocaleString()} kg
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar, Layers, Download, Search, AlertTriangle,
  CheckCircle2, Clock, Sparkles, Filter, ChevronDown,
  Package, DollarSign, ArrowUpRight, ArrowDownRight,
  UtensilsCrossed, HelpCircle, Check, Info
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import dailyStockData from '@/data/dailyStockLedger.json'

interface StockItem {
  name: string
  unit: string
  price: number
  startStock: number
  inflow: number | null
  outflow: number | null
  kitchenTransfer: number | null
  endStock: number
  weeklyAvg: number
  weeksRemaining: number | string
  sum: number
  isHighlight?: boolean
  isConsumable?: boolean
}

interface TableData {
  id: string
  type: 'daily' | 'weekly'
  title: string
  dayRu?: string
  dayUz?: string
  isoDate?: string
  startDate?: string
  endDate?: string
  sheetName: string
  items: StockItem[]
  vegetableCount: number
  totalVegetables: StockItem | null
  boxes: StockItem | null
  hypochlorite: StockItem | null
  grandTotalSum: number
  notes: string[]
}

export default function DailyStockBalanceTab() {
  const { lang, formatDual } = useLanguage()

  const allTables = useMemo(() => dailyStockData.tables as TableData[], [])
  const availableDates = useMemo(() => dailyStockData.availableDates, [])

  // Selected table ID (default to 2026-11-25)
  const [selectedId, setSelectedId] = useState<string>('2026-11-25')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly'>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('ноябрь 2026')

  // Find the active table
  const currentTable = useMemo(() => {
    return allTables.find(t => t.id === selectedId) || allTables.find(t => t.id === '2026-11-25') || allTables[allTables.length - 1]
  }, [allTables, selectedId])

  // Filter available options by month and type
  const filteredOptions = useMemo(() => {
    return availableDates.filter(d => {
      const matchMonth = selectedMonth ? d.sheetName === selectedMonth : true
      const matchType = filterType === 'all' ? true : d.type === filterType
      return matchMonth && matchType
    })
  }, [availableDates, selectedMonth, filterType])

  // All months list
  const allMonths = useMemo(() => {
    const set = new Set<string>()
    availableDates.forEach(d => set.add(d.sheetName))
    return Array.from(set)
  }, [availableDates])

  // Quick preset dates for November 2026
  const quickPresets = [
    { id: '2026-11-25', label: '25.11 (Bugun / Oxirgi)', labelRu: '25.11 (Сегодня / Посл.)', type: 'daily' },
    { id: '2026-11-02_2026-11-07', label: '02.11 - 07.11 (Haftalik)', labelRu: '02.11 - 07.11 (Неделя)', type: 'weekly' },
    { id: '2026-11-02', label: '02.11 Dush', labelRu: '02.11 Пон', type: 'daily' },
    { id: '2026-11-03', label: '03.11 Sesh', labelRu: '03.11 Вт', type: 'daily' },
    { id: '2026-11-04', label: '04.11 Chor', labelRu: '04.11 Ср', type: 'daily' },
    { id: '2026-11-05', label: '05.11 Pay', labelRu: '05.11 Чт', type: 'daily' },
    { id: '2026-11-06', label: '06.11 Juma', labelRu: '06.11 Пт', type: 'daily' },
    { id: '2026-11-07', label: '07.11 Shan', labelRu: '07.11 Сб', type: 'daily' },
  ]

  // Filter items by search
  const visibleItems = useMemo(() => {
    if (!currentTable) return []
    if (!searchQuery.trim()) return currentTable.items
    const q = searchQuery.toLowerCase().trim()
    return currentTable.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.unit && item.unit.toLowerCase().includes(q))
    )
  }, [currentTable, searchQuery])

  // Stock KPI metrics
  const kpis = useMemo(() => {
    if (!currentTable) {
      return {
        grandTotalSum: 0,
        vegTotalKg: 0,
        inflowKg: 0,
        outflowKg: 0,
        kitchenKg: 0,
        criticalCount: 0
      }
    }

    const vegItems = currentTable.items.filter(i => !i.isHighlight && !i.isConsumable)
    const vegEndStock = currentTable.totalVegetables?.endStock ?? vegItems.reduce((acc, i) => acc + (i.endStock || 0), 0)
    const inflowTotal = currentTable.totalVegetables?.inflow ?? vegItems.reduce((acc, i) => acc + (i.inflow || 0), 0)
    const outflowTotal = currentTable.totalVegetables?.outflow ?? vegItems.reduce((acc, i) => acc + (i.outflow || 0), 0)
    const kitchenTotal = currentTable.totalVegetables?.kitchenTransfer ?? vegItems.reduce((acc, i) => acc + (i.kitchenTransfer || 0), 0)

    // Critical: weeksRemaining < 0.3
    const criticalCount = vegItems.filter(i => {
      if (typeof i.weeksRemaining === 'number') {
        return i.weeksRemaining < 0.3 && i.weeksRemaining >= 0
      }
      return false
    }).length

    return {
      grandTotalSum: currentTable.grandTotalSum || 0,
      vegTotalKg: vegEndStock,
      inflowKg: inflowTotal,
      outflowKg: outflowTotal,
      kitchenKg: kitchenTotal,
      criticalCount
    }
  }, [currentTable])

  // Export to CSV
  const handleExportCSV = () => {
    if (!currentTable) return

    const headers = [
      '№',
      'Наименование',
      'Единица измерения',
      'Цена (сум)',
      'Остаток (нач)',
      'Приход',
      'Расход',
      'Передача в кухню',
      'Остаток (кон)',
      'Средний расход в неделю',
      'На сколько недель хватит',
      'Сумма (сум)'
    ]

    const rows = currentTable.items.map((item, idx) => [
      idx + 1,
      `"${item.name}"`,
      item.unit,
      item.price,
      item.startStock,
      item.inflow ?? '',
      item.outflow ?? '',
      item.kitchenTransfer ?? '',
      item.endStock,
      item.weeklyAvg,
      item.weeksRemaining,
      item.sum
    ])

    // Grand total row
    rows.push([
      '',
      '"ИТОГО (ОБЩАЯ СУММА)"',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      currentTable.grandTotalSum
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Zaxiralar_Balansi_${currentTable.id}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper for weeksRemaining traffic-light badge
  const renderWeeksBadge = (val: number | string) => {
    if (val === '#DIV/0!' || val === '' || val === null || val === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400">
          #DIV/0!
        </span>
      )
    }

    const num = typeof val === 'number' ? val : parseFloat(String(val))
    if (isNaN(num)) {
      return <span className="font-mono text-slate-400 text-xs">{val}</span>
    }

    if (num < 0.3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 animate-pulse">
          <AlertTriangle size={12} className="shrink-0" />
          {num.toFixed(2)}
        </span>
      )
    }

    if (num <= 0.7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {num.toFixed(2)}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 size={12} className="shrink-0" />
        {num.toFixed(2)}
      </span>
    )
  }

  if (!currentTable) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        Ma'lumot topilmadi
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. DATE SELECTOR & PRESETS */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-dark-750 shadow-sm space-y-4">
        {/* Quick Date Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {formatDual("Tezkor sanalar:", "Быстрый выбор:", "Quick select:")}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {quickPresets.map(preset => {
              const active = selectedId === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedId(preset.id)
                    setSelectedMonth('ноябрь 2026')
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
                  }`}
                >
                  {preset.type === 'weekly' && <Layers size={13} />}
                  <span>{lang === 'ru' ? preset.labelRu : preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Granular Year/Month Selector + Table Dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center flex-wrap gap-2">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-500 font-semibold">{formatDual("Oy:", "Месяц:", "Month:")}</span>
              <select
                value={selectedMonth}
                onChange={e => {
                  setSelectedMonth(e.target.value)
                  const firstInMonth = availableDates.find(d => d.sheetName === e.target.value)
                  if (firstInMonth) setSelectedId(firstInMonth.id)
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {allMonths.map(m => (
                  <option key={m} value={m} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {formatDual("Barchasi", "Все", "All")}
              </button>
              <button
                onClick={() => setFilterType('daily')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'daily'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {formatDual("Kunlik", "Дни", "Daily")}
              </button>
              <button
                onClick={() => setFilterType('weekly')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'weekly'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {formatDual("Haftalik", "Недели", "Weekly")}
              </button>
            </div>

            {/* Specific Table Dropdown */}
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-8 max-w-[280px] truncate"
              >
                {filteredOptions.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                    {opt.title} {opt.dayUz ? `(${lang === 'ru' ? opt.dayRu : opt.dayUz})` : ''} - {(opt.grandTotalSum / 1_000_000).toFixed(1)} mln
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Table Badge & Export */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{currentTable.title}</span>
              {currentTable.dayUz && (
                <span className="text-[11px] font-semibold opacity-80">
                  ({lang === 'ru' ? currentTable.dayRu : currentTable.dayUz})
                </span>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} />
              <span>Excel (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Stock Value */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Jami Qiymat", "Общая сумма", "Total Value")}</span>
            <DollarSign size={16} className="text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
            {(kpis.grandTotalSum).toLocaleString('uz-UZ', { maximumFractionDigits: 0 })}
            <span className="text-[11px] font-bold text-slate-500 ml-1">so'm</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("Zaxira umumiy bahosi", "Оценка всех запасов", "Stock total sum")}
          </p>
        </div>

        {/* Vegetables Stock Kg */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Sabzavot Zaxira", "Остаток овощей", "Vegetables Stock")}</span>
            <Package size={16} className="text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {kpis.vegTotalKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })}
            <span className="text-[11px] font-bold text-slate-500 ml-1">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("12 turdagi xomashyo", "12 наименований сырья", "12 produce items")}
          </p>
        </div>

        {/* Inflow Kg */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Kirim", "Приход", "Inflow")}</span>
            <ArrowDownRight size={16} className="text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 truncate">
            {kpis.inflowKg > 0 ? kpis.inflowKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '0.0'}
            <span className="text-[11px] font-bold text-slate-500 ml-1">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("Skladga qabul qilingan", "Поступило на склад", "Received to stock")}
          </p>
        </div>

        {/* Outflow Kg */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Sexga Chiqim", "Расход в цех", "Workshop Outflow")}</span>
            <ArrowUpRight size={16} className="text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 truncate">
            {kpis.outflowKg > 0 ? kpis.outflowKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '0.0'}
            <span className="text-[11px] font-bold text-slate-500 ml-1">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("Ishlab chiqarishga sarf", "На производство", "To production")}
          </p>
        </div>

        {/* Kitchen Transfer */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Oshxonaga", "В кухню", "To Kitchen")}</span>
            <UtensilsCrossed size={16} className="text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 truncate">
            {kpis.kitchenKg > 0 ? kpis.kitchenKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '0.0'}
            <span className="text-[11px] font-bold text-slate-500 ml-1">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("Xodimlar ovqatiga", "Питание персонала", "Staff dining")}
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200/90 dark:border-dark-750 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{formatDual("Kritik Mahsulot", "Критический запас", "Critical Alert")}</span>
            <AlertTriangle size={16} className={kpis.criticalCount > 0 ? 'text-rose-500 animate-bounce' : 'text-slate-400'} />
          </div>
          <div className={`text-lg sm:text-xl font-black truncate ${
            kpis.criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
          }`}>
            {kpis.criticalCount}
            <span className="text-[11px] font-bold text-slate-500 ml-1">{formatDual("ta", "наим.", "items")}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {formatDual("< 0.3 hafta zaxirasi", "< 0.3 недели запаса", "< 0.3 wk remaining")}
          </p>
        </div>
      </div>

      {/* 3. TABLE FILTER & SEARCH */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={formatDual("Mahsulot nomi bo'yicha qidirish (Aysberg, Pomidor...)", "Поиск по наименованию...", "Search product...")}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Traffic-light Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 text-[11px] font-semibold">{formatDual("Zaxira me'yori:", "Норма запаса:", "Coverage:")}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            &lt; 0.3 {formatDual("Kritik", "Критич.", "Crit")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
            0.3 – 0.7 {formatDual("Ogohlantirish", "Внимание", "Warn")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
            &gt; 0.7 {formatDual("Yetarli", "В норме", "Safe")}
          </span>
        </div>
      </div>

      {/* 4. THE EXACT 11-COLUMN TABLE */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200/90 dark:border-dark-750 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100 dark:bg-dark-850 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-dark-750 font-black uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-3 text-center w-12 border-r border-slate-200 dark:border-dark-750">№</th>
                <th className="py-3.5 px-3 border-r border-slate-200 dark:border-dark-750 min-w-[180px]">
                  {formatDual("Наименование (Mahsulot)", "Наименование", "Product Name")}
                </th>
                <th className="py-3.5 px-2 text-center border-r border-slate-200 dark:border-dark-750 w-20">
                  {formatDual("Birlik", "Ед. изм.", "Unit")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-28">
                  {formatDual("Narxi", "Цена", "Price")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-28 bg-slate-50/50 dark:bg-dark-800/40">
                  {formatDual("Остаток (Bosh)", "Остаток (нач)", "Opening Stock")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-24 text-blue-700 dark:text-blue-400">
                  {formatDual("Приход", "Приход", "Inflow")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-24 text-indigo-700 dark:text-indigo-400">
                  {formatDual("Расход", "Расход", "Outflow")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-28 text-orange-700 dark:text-orange-400">
                  {formatDual("Кухня (Oshxona)", "В кухню", "To Kitchen")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-28 bg-slate-50/50 dark:bg-dark-800/40 font-black">
                  {formatDual("Остаток (Yakun)", "Остаток (кон)", "Ending Stock")}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-200 dark:border-dark-750 w-32">
                  {formatDual("Haftalik sarf", "Сред. в нед.", "Weekly Avg")}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-dark-750 w-32">
                  {formatDual("Hafta zaxirasi", "На сколько нед.", "Weeks Rem.")}
                </th>
                <th className="py-3.5 px-4 text-right w-36 font-black text-amber-700 dark:text-amber-400">
                  {formatDual("Сумма (so'm)", "Сумма (сум)", "Sum (UZS)")}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
              {visibleItems.map((item, idx) => {
                const isHighlightRow = item.isHighlight || item.name.toLowerCase() === 'всего'
                const isConsumable = item.isConsumable || item.name.toLowerCase() === 'коробка' || item.name.toLowerCase().includes('гипохлорид')
                const hasKitchen = item.kitchenTransfer !== null && item.kitchenTransfer > 0

                let rowClass = 'hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition-colors'
                if (isHighlightRow) {
                  rowClass = 'bg-[#d9ead3] dark:bg-emerald-950/70 text-slate-900 dark:text-emerald-100 font-black border-y-2 border-emerald-400 dark:border-emerald-700'
                } else if (isConsumable) {
                  rowClass = 'bg-slate-50/60 dark:bg-dark-850/60 font-semibold'
                }

                return (
                  <tr key={`${item.name}-${idx}`} className={rowClass}>
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 border-r border-slate-200/70 dark:border-dark-750 font-mono text-[11px]">
                      {isHighlightRow ? '★' : idx + 1}
                    </td>

                    {/* Product Name */}
                    <td className="py-2.5 px-3 border-r border-slate-200/70 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className={`truncate ${isHighlightRow ? 'font-black text-emerald-950 dark:text-emerald-100 text-sm' : 'text-slate-900 dark:text-white'}`}>
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200/70 dark:border-dark-750 font-mono text-[11px]">
                      {item.unit}
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200/70 dark:border-dark-750">
                      {item.price > 0 ? item.price.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '-'}
                    </td>

                    {/* Start Stock */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200 border-r border-slate-200/70 dark:border-dark-750 bg-slate-50/30 dark:bg-dark-800/20">
                      {item.startStock > 0 ? item.startStock.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '0.00'}
                    </td>

                    {/* Inflow (Приход) */}
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-300 font-bold border-r border-slate-200/70 dark:border-dark-750">
                      {item.inflow !== null && item.inflow > 0 ? item.inflow.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* Outflow (Расход) */}
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700 dark:text-indigo-300 font-bold border-r border-slate-200/70 dark:border-dark-750">
                      {item.outflow !== null && item.outflow > 0 ? item.outflow.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* Kitchen Transfer (Кухня) */}
                    <td className={`py-2.5 px-3 text-right font-mono font-bold border-r border-slate-200/70 dark:border-dark-750 ${
                      hasKitchen ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 underline' : 'text-slate-400'
                    }`}>
                      {hasKitchen ? item.kitchenTransfer!.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* End Stock */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 dark:text-white border-r border-slate-200/70 dark:border-dark-750 bg-slate-50/40 dark:bg-dark-800/30">
                      {item.endStock.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                    </td>

                    {/* Weekly Average Consumption */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-dark-750">
                      {item.weeklyAvg > 0 ? item.weeklyAvg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '-'}
                    </td>

                    {/* Weeks Remaining */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200/70 dark:border-dark-750">
                      {isHighlightRow ? '' : renderWeeksBadge(item.weeksRemaining)}
                    </td>

                    {/* Stock Valuation Sum */}
                    <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 dark:text-amber-400">
                      {item.sum > 0 ? item.sum.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '0.00'}
                    </td>
                  </tr>
                )
              })}

              {/* 5. GRAND TOTAL (ИТОГО) ROW */}
              <tr className="bg-slate-900 text-amber-400 dark:bg-slate-950 border-t-2 border-amber-500 font-black text-sm">
                <td className="py-3 px-3 text-center font-mono">Σ</td>
                <td colSpan={10} className="py-3 px-4 uppercase tracking-wider text-white">
                  {formatDual("JAMI ZAXIRA BAHOSI (ИТОГО: Sabzavotlar + Idish + Kimyoviy vosita)", "ИТОГО (ОБЩАЯ СУММА ЗАПАСОВ СКЛАДА)", "GRAND TOTAL VALUATION")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base font-black text-amber-300">
                  {(currentTable.grandTotalSum).toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                  <span className="text-xs text-amber-400 ml-1 font-bold">so'm</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. AUDITED BUSINESS NOTES (ПРИМЕЧАНИЕ) */}
      {currentTable.notes && currentTable.notes.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-3xl p-5 border border-amber-200/80 dark:border-amber-800/50 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
            <Info size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{formatDual("Boshqaruv va Ta'minot Izohlari (Примечание к балансу):", "Примечание к остаткам и расходу:", "Audited Balance Notes:")}</span>
          </div>

          <div className="space-y-1.5 pl-6 text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-medium">
            {currentTable.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar, Layers, Download, Search, AlertTriangle,
  CheckCircle2, Clock, Filter, ChevronDown,
  Package, DollarSign, ArrowUpRight, ArrowDownRight,
  UtensilsCrossed, HelpCircle, Check, Info, FileText, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
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

interface DailyStockBalanceTabProps {
  activePeriod?: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
}

export default function DailyStockBalanceTab({ activePeriod }: DailyStockBalanceTabProps = {}) {
  const { lang, formatDual } = useLanguage()

  const allTables = useMemo(() => dailyStockData.tables as TableData[], [])
  const availableDates = useMemo(() => dailyStockData.availableDates, [])

  // Selected table ID (default to 2026-11-02_2026-11-07 if week, or 2026-11-25)
  const [selectedId, setSelectedId] = useState<string>(
    activePeriod === 'week' ? '2026-11-02_2026-11-07' : '2026-11-25'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly'>(
    activePeriod === 'week' ? 'weekly' : 'all'
  )
  const [selectedMonth, setSelectedMonth] = useState<string>('ноябрь 2026')

  // Respond to period changes from parent
  React.useEffect(() => {
    if (activePeriod === 'week') {
      setFilterType('weekly')
      setSelectedId('2026-11-02_2026-11-07')
    } else if (activePeriod === 'today') {
      setFilterType('daily')
      setSelectedId('2026-11-25')
    } else if (activePeriod === 'month') {
      setFilterType('all')
    }
  }, [activePeriod])

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

  const [exporting, setExporting] = useState(false)

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

  // Export to Real Styled Excel (.xlsx) using ExcelJS API
  const handleExportExcel = async () => {
    if (!currentTable) return
    try {
      setExporting(true)
      const res = await fetch(`/api/director/export?type=balance&id=${encodeURIComponent(currentTable.id)}`)
      if (!res.ok) throw new Error('Eksport qilishda xatolik yuz berdi')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Информация_по_запасам_${currentTable.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(formatDual("Excel jadval yuklandi", "Excel файл успешно загружен", "Excel file downloaded"))
    } catch (err: any) {
      toast.error(err.message || "Excel faylni yuklab olishda xatolik yuz berdi")
    } finally {
      setExporting(false)
    }
  }

  // Helper for weeksRemaining traffic-light badge (Clean monochrome / subtle borders)
  const renderWeeksBadge = (val: number | string) => {
    if (
      val === '#DIV/0!' ||
      val === '#VALUE!' ||
      val === '-' ||
      val === '' ||
      val === null ||
      val === undefined ||
      String(val).includes('#DIV')
    ) {
      return (
        <span className="font-mono text-slate-400 dark:text-slate-500 text-xs font-semibold">
          -
        </span>
      )
    }

    const num = typeof val === 'number' ? val : parseFloat(String(val))
    if (isNaN(num) || num <= 0) {
      return <span className="font-mono text-slate-400 dark:text-slate-500 text-xs font-semibold">-</span>
    }

    if (num < 0.3) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
          {num.toFixed(2)}
        </span>
      )
    }

    if (num <= 0.7) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          {num.toFixed(2)}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
        {num.toFixed(2)}
      </span>
    )
  }

  if (!currentTable) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Ma'lumot topilmadi
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. STABLE MONOCHROME DATE & TABLE SELECTOR */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-dark-750 shadow-xs">
        {/* Dropdown Filters & Table Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            {/* Month Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-500 font-semibold">{formatDual("Месяц:", "Месяц:", "Month:")}</span>
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

            {/* Daily / Weekly Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilterType('daily')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'daily'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Дни
              </button>
              <button
                onClick={() => setFilterType('weekly')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterType === 'weekly'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Недели
              </button>
            </div>

            {/* Table Dropdown */}
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-6 max-w-[260px] truncate"
            >
              {filteredOptions.map(opt => (
                <option key={opt.id} value={opt.id} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">
                  {opt.title} - {(opt.grandTotalSum / 1_000_000).toFixed(1)} млн
                </option>
              ))}
            </select>
          </div>

          {/* Current Table Title & Export Button */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{currentTable.title}</span>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE EXACT 11-COLUMN TABLE (MATCHING AUDITED EXCEL SHEET) */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-dark-700 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 text-center w-12 border-r border-slate-200 dark:border-dark-700">№</th>
                <th className="py-3 px-3 border-r border-slate-200 dark:border-dark-700 min-w-[180px]">
                  {formatDual("Наименование", "Наименование", "Product Name")}
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-200 dark:border-dark-700 w-20">
                  {formatDual("Ед. изм.", "Ед. изм.", "Unit")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28">
                  {formatDual("Цена", "Цена", "Price")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28 bg-slate-50/50 dark:bg-dark-800/40">
                  {formatDual("Остаток (нач)", "Остаток (нач)", "Opening Stock")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-24">
                  {formatDual("Приход", "Приход", "Inflow")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-24">
                  {formatDual("Расход", "Расход", "Outflow")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28">
                  {formatDual("Передача в кухню", "Передача в кухню", "To Kitchen")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28 bg-slate-50/50 dark:bg-dark-800/40 font-black">
                  {formatDual("Остаток (кон)", "Остаток (кон)", "Ending Stock")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-32">
                  {formatDual("Средний расход в неделю", "Средний расход в неделю", "Weekly Avg")}
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-dark-700 w-32">
                  {formatDual("На сколько недель хватит", "На сколько недель хватит", "Weeks Rem.")}
                </th>
                <th className="py-3 px-4 text-right w-36 font-black">
                  {formatDual("Сумма (сум)", "Сумма (сум)", "Sum (UZS)")}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-mono">
              {visibleItems.map((item, idx) => {
                const isHighlightRow = item.isHighlight || item.name.toLowerCase() === 'всего'
                const isConsumable = item.isConsumable || item.name.toLowerCase() === 'коробка' || item.name.toLowerCase().includes('гипохлорид')
                const hasKitchen = item.kitchenTransfer !== null && item.kitchenTransfer > 0

                let rowClass = 'hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors'
                if (isHighlightRow) {
                  rowClass = 'bg-[#d9ead3] dark:bg-emerald-950/70 text-slate-900 dark:text-emerald-100 font-black border-y-2 border-emerald-500'
                } else if (isConsumable) {
                  rowClass = 'bg-slate-50/70 dark:bg-dark-850/60 font-semibold'
                }

                return (
                  <tr key={`${item.name}-${idx}`} className={rowClass}>
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 border-r border-slate-200/70 dark:border-dark-750 text-[11px]">
                      {isHighlightRow ? '★' : idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-3 border-r border-slate-200/70 dark:border-dark-750 font-sans font-bold">
                      <span className={isHighlightRow ? 'font-black text-slate-950 dark:text-white' : 'text-slate-900 dark:text-white'}>
                        {item.name}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200/70 dark:border-dark-750 text-[11px]">
                      {item.unit}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 border-r border-slate-200/70 dark:border-dark-750">
                      {item.price > 0 ? item.price.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '-'}
                    </td>

                    {/* Start Stock */}
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200 border-r border-slate-200/70 dark:border-dark-750 bg-slate-50/30 dark:bg-dark-800/20">
                      {item.startStock > 0 ? item.startStock.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '0.00'}
                    </td>

                    {/* Inflow */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-200/70 dark:border-dark-750 text-slate-800 dark:text-slate-200">
                      {item.inflow !== null && item.inflow > 0 ? item.inflow.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* Outflow */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-200/70 dark:border-dark-750 text-slate-800 dark:text-slate-200">
                      {item.outflow !== null && item.outflow > 0 ? item.outflow.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* Kitchen */}
                    <td className={`py-2.5 px-3 text-right border-r border-slate-200/70 dark:border-dark-750 ${
                      hasKitchen ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-400'
                    }`}>
                      {hasKitchen ? item.kitchenTransfer!.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : ''}
                    </td>

                    {/* End Stock */}
                    <td className="py-2.5 px-3 text-right font-black text-slate-950 dark:text-white border-r border-slate-200/70 dark:border-dark-750 bg-slate-50/40 dark:bg-dark-800/30">
                      {item.endStock.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                    </td>

                    {/* Weekly Avg */}
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-dark-750">
                      {item.weeklyAvg > 0 ? item.weeklyAvg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '-'}
                    </td>

                    {/* Weeks Remaining */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200/70 dark:border-dark-750">
                      {isHighlightRow ? '' : renderWeeksBadge(item.weeksRemaining)}
                    </td>

                    {/* Sum */}
                    <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                      {item.sum > 0 ? item.sum.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) : '0.00'}
                    </td>
                  </tr>
                )
              })}

              {/* GRAND TOTAL (ИТОГО) ROW */}
              <tr className="bg-slate-900 text-amber-300 dark:bg-slate-950 border-t-2 border-amber-500 font-black text-sm">
                <td className="py-3 px-3 text-center">Σ</td>
                <td colSpan={10} className="py-3 px-4 uppercase tracking-wider text-white">
                  {formatDual("ИТОГО", "ИТОГО", "GRAND TOTAL")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base font-black text-amber-300">
                  {(currentTable.grandTotalSum).toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                  <span className="text-xs text-amber-400 ml-1 font-bold">сум</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. AUDITED BUSINESS NOTES (ПРИМЕЧАНИЕ) */}
      {currentTable.notes && currentTable.notes.length > 0 && (
        <div className="bg-slate-50 dark:bg-dark-850 rounded-2xl p-4 border border-slate-200 dark:border-dark-750 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <FileText size={15} className="text-slate-500" />
            <span>{formatDual("Примечание к остаткам и расходу:", "Примечание к остаткам и расходу:", "Audited Notes:")}</span>
          </div>

          <div className="space-y-1.5 pl-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {currentTable.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

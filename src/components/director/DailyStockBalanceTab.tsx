'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar, Layers, Download, Search, AlertTriangle,
  CheckCircle2, Clock, Filter, ChevronDown,
  Package, DollarSign, ArrowUpRight, ArrowDownRight,
  UtensilsCrossed, HelpCircle, Check, Info, FileText, Loader2, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  translateProductName,
  translateUnit,
  translateMonthName,
  translateTableTitle,
  translateNoteText
} from '@/lib/directorLocalization'
import CustomDropdown from '@/components/ui/CustomDropdown'
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
  startDate?: string
  endDate?: string
  lang?: 'uz' | 'ru' | 'en'
}

export default function DailyStockBalanceTab({
  activePeriod = 'week',
  startDate = '2026-11-01',
  endDate = '2026-11-25',
  lang: propLang
}: DailyStockBalanceTabProps = {}) {
  const { lang: ctxLang, directorLang } = useLanguage()
  const activeLang = propLang || directorLang || ctxLang || 'uz'
  const lang = activeLang
  const formatDual = (uz: string, ru: string, en?: string) => {
    if (activeLang === 'ru') return ru || uz
    if (activeLang === 'en') return en || ru || uz
    return uz
  }

  const allTables = useMemo(() => dailyStockData.tables as TableData[], [])
  const [liveAvailableDates, setLiveAvailableDates] = useState<any[]>(dailyStockData.availableDates)
  const [liveTable, setLiveTable] = useState<TableData | null>(null)
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false)
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false)

  const availableDates = liveAvailableDates

  // Selected table ID (default to 2026-11-02_2026-11-07 if week, or 2026-11-25)
  const [selectedId, setSelectedId] = useState<string>(
    activePeriod === 'week' ? '2026-11-02_2026-11-07' : '2026-11-25'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>('ноябрь 2026')

  // Fetch live table from DB API
  const fetchLiveStockBalance = React.useCallback(async (targetId?: string) => {
    try {
      setIsLiveLoading(true)
      const qId = targetId || selectedId
      const res = await fetch(`/api/director/stock-balance?date=${encodeURIComponent(qId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.currentTable) {
          setLiveTable(data.currentTable)
          setIsLiveDb(Boolean(data.isLiveDb))
          if (Array.isArray(data.availableDates) && data.availableDates.length > 0) {
            setLiveAvailableDates(data.availableDates)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live stock balance from DB:', e)
    } finally {
      setIsLiveLoading(false)
    }
  }, [selectedId])

  React.useEffect(() => {
    fetchLiveStockBalance(selectedId)
  }, [selectedId, fetchLiveStockBalance])

  // Filter available options based on activePeriod, startDate, endDate, and selectedMonth
  const filteredOptions = useMemo(() => {
    return availableDates.filter(d => {
      // 1. Bugun (Today): only latest day
      if (activePeriod === 'today') {
        const latestDaily = availableDates.find(it => it.type === 'daily')
        return d.id === (latestDaily?.id || '2026-11-25')
      }

      // 2. Hafta (Week): only weekly tables
      if (activePeriod === 'week') {
        return d.type === 'weekly'
      }

      // 3. Oy (Month): filter by selectedMonth
      if (activePeriod === 'month') {
        return selectedMonth ? d.sheetName === selectedMonth : true
      }

      // 4. Oraliq (Custom): filter by startDate and endDate
      if (activePeriod === 'custom') {
        const itemStart = d.isoDate.split('_')[0]
        const itemEnd = d.isoDate.includes('_') ? d.isoDate.split('_')[1] : itemStart
        if (startDate && itemEnd < startDate) return false
        if (endDate && itemStart > endDate) return false
        return true
      }

      // 5. Yil / Barchasi: all tables
      return true
    })
  }, [availableDates, activePeriod, selectedMonth, startDate, endDate])

  // Respond to period changes from parent
  React.useEffect(() => {
    if (activePeriod === 'today') {
      const latestDaily = availableDates.find(it => it.type === 'daily')
      setSelectedId(latestDaily?.id || '2026-11-25')
    } else if (activePeriod === 'week') {
      const targetWeek = availableDates.find(d => d.id === '2026-11-02_2026-11-07' && d.type === 'weekly')
      if (targetWeek) setSelectedId(targetWeek.id)
      else {
        const anyWeek = availableDates.find(d => d.type === 'weekly')
        if (anyWeek) setSelectedId(anyWeek.id)
      }
    } else if (activePeriod === 'month') {
      const firstInMonth = availableDates.find(d => d.sheetName === selectedMonth)
      if (firstInMonth) setSelectedId(firstInMonth.id)
    } else if (activePeriod === 'custom') {
      if (filteredOptions.length > 0) {
        setSelectedId(filteredOptions[0].id)
      }
    }
  }, [activePeriod, selectedMonth, startDate, endDate, availableDates])

  // Ensure selectedId is valid in current filteredOptions
  React.useEffect(() => {
    if (filteredOptions.length > 0 && !filteredOptions.some(o => o.id === selectedId)) {
      setSelectedId(filteredOptions[0].id)
    }
  }, [filteredOptions, selectedId])

  // Find the active table (prefer liveTable from DB)
  const currentTable = useMemo(() => {
    if (liveTable && (liveTable.id === selectedId || liveTable.isoDate === selectedId)) {
      return liveTable
    }
    return allTables.find(t => t.id === selectedId) || allTables.find(t => t.id === '2026-11-25') || allTables[allTables.length - 1]
  }, [liveTable, allTables, selectedId])

  // All months list
  const allMonths = useMemo(() => {
    const set = new Set<string>()
    availableDates.forEach(d => set.add(d.sheetName))
    return Array.from(set)
  }, [availableDates])

  const [exporting, setExporting] = useState(false)

  // Filter items by search (supports both Uzbek and Russian search terms)
  const visibleItems = useMemo(() => {
    if (!currentTable) return []
    if (!searchQuery.trim()) return currentTable.items
    const q = searchQuery.toLowerCase().trim()
    return currentTable.items.filter(item => {
      const localizedName = translateProductName(item.name, lang).toLowerCase()
      const rawName = item.name.toLowerCase()
      const unit = (item.unit || '').toLowerCase()
      const localizedUnit = translateUnit(item.unit, lang).toLowerCase()
      return localizedName.includes(q) || rawName.includes(q) || unit.includes(q) || localizedUnit.includes(q)
    })
  }, [currentTable, searchQuery, lang])

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
      const res = await fetch(`/api/director/export?type=balance&id=${encodeURIComponent(currentTable.id)}&lang=${lang}`)
      if (!res.ok) throw new Error('Eksport qilishda xatolik yuz berdi')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filePrefix = lang === 'ru' ? 'Информация_по_запасам' : 'Zaxiralar_balansi'
      a.download = `${filePrefix}_${currentTable.id}.xlsx`
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
            {/* Month Select (shown when period is month or all) */}
            {(activePeriod === 'month' || activePeriod === 'all') && (
              <CustomDropdown
                value={selectedMonth}
                onChange={val => {
                  setSelectedMonth(String(val))
                  const firstInMonth = availableDates.find(d => d.sheetName === val)
                  if (firstInMonth) setSelectedId(firstInMonth.id)
                }}
                prefix={formatDual("Oy:", "Месяц:", "Month:")}
                options={allMonths.map(m => ({
                  value: m,
                  label: translateMonthName(m.split(' ')[0], lang)
                }))}
              />
            )}

            {/* Table Dropdown (Dynamically filtered by activePeriod / dates) */}
            <CustomDropdown
              value={selectedId}
              onChange={val => setSelectedId(String(val))}
              options={filteredOptions.map(opt => ({
                value: opt.id,
                label: `${translateTableTitle(opt.title, lang)} - ${(opt.grandTotalSum / 1_000_000).toFixed(1)} ${formatDual("mln", "млн", "M")}`
              }))}
              menuClassName="min-w-[280px]"
            />
          </div>

          {/* Current Table Title, Live DB Badge & Export Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLiveDb && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{formatDual("Jonli DB (Real vaqt)", "Живые данные из БД", "Live DB Real-time")}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => fetchLiveStockBalance(selectedId)}
              disabled={isLiveLoading}
              title={formatDual("DB ma'lumotlarini yangilash", "Обновить данные из БД", "Refresh DB data")}
              className="p-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw size={13} className={isLiveLoading ? "animate-spin text-emerald-600" : ""} />
            </button>

            <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{translateTableTitle(currentTable.title, lang)}</span>
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
                  {formatDual("Mahsulot nomi", "Наименование", "Product Name")}
                </th>
                <th className="py-3 px-2 text-center border-r border-slate-200 dark:border-dark-700 w-20">
                  {formatDual("Birligi", "Ед. изм.", "Unit")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28">
                  {formatDual("Narxi", "Цена", "Price")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28 bg-slate-50/50 dark:bg-dark-800/40">
                  {formatDual("Boshlang'ich qoldiq", "Остаток (нач)", "Opening Stock")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-24">
                  {formatDual("Kirim", "Приход", "Inflow")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-24">
                  {formatDual("Chiqim", "Расход", "Outflow")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28">
                  {formatDual("Oshxonaga", "Передача в кухню", "To Kitchen")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-28 bg-slate-50/50 dark:bg-dark-800/40 font-black">
                  {formatDual("Yakuniy qoldiq", "Остаток (кон)", "Ending Stock")}
                </th>
                <th className="py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 w-32">
                  {formatDual("Haftalik sarf", "Средний расход в неделю", "Weekly Avg")}
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-dark-700 w-32">
                  {formatDual("Yetish muddati", "На сколько недель хватит", "Weeks Rem.")}
                </th>
                <th className="py-3 px-4 text-right w-36 font-black">
                  {formatDual("Summa (so'm)", "Сумма (сум)", "Sum (UZS)")}
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
                        {translateProductName(item.name, lang)}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200/70 dark:border-dark-750 text-[11px]">
                      {translateUnit(item.unit, lang)}
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
                  {formatDual("JAMI", "ИТОГО", "GRAND TOTAL")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base font-black text-amber-300">
                  {(currentTable.grandTotalSum).toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                  <span className="text-xs text-amber-400 ml-1 font-bold">{formatDual("so'm", "сум", "so'm")}</span>
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
            <span>{formatDual("Qoldiq va sarf bo'yicha izohlar:", "Примечание к остаткам и расходу:", "Audited Notes:")}</span>
          </div>

          <div className="space-y-1.5 pl-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {currentTable.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <p>{translateNoteText(note, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

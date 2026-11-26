'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Layers, Package, Boxes, AlertTriangle, FileText,
  Search, RefreshCw, Printer, Download, Plus, Trash2,
  Calendar, Info, Check, X, Save, Loader2, DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import DailyStockBalanceTab from '@/components/director/DailyStockBalanceTab'
import CustomDropdown from '@/components/ui/CustomDropdown'
import {
  translateProductName,
  translateUnit,
  translateMonthName,
  translateNoteText
} from '@/lib/directorLocalization'

export interface WeekOption {
  weekNum: number
  labelUz: string
  labelRu: string
  labelEn: string
  shortLabel: string
  from: string
  to: string
  monthIndex: number
}

const getWeeksForMonth = (year: number, monthIndex: number): WeekOption[] => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const monthNamesUz = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
  const monthNamesRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const weeks: WeekOption[] = []
  const firstDayOfMonth = new Date(year, monthIndex, 1)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0)

  let cur = new Date(firstDayOfMonth)
  while (cur.getDay() !== 1) {
    cur.setDate(cur.getDate() + 1)
  }

  let weekNum = 1
  while (cur <= lastDayOfMonth) {
    const monday = new Date(cur)
    const saturday = new Date(cur)
    saturday.setDate(saturday.getDate() + 5)

    const fromStr = toYMD(monday)
    const toStr = toYMD(saturday)
    const mUz = monthNamesUz[monthIndex]
    const mRu = monthNamesRu[monthIndex]
    const mEn = monthNamesEn[monthIndex]

    weeks.push({
      weekNum,
      labelUz: `${mUz} ${weekNum}-haftasi (${fromStr} - ${toStr})`,
      labelRu: `${mRu} ${weekNum}-я неделя (${fromStr} - ${toStr})`,
      labelEn: `${mEn} Week ${weekNum} (${fromStr} - ${toStr})`,
      shortLabel: `${weekNum}-hafta (${fromStr} - ${toStr})`,
      from: fromStr,
      to: toStr,
      monthIndex,
    })

    cur.setDate(cur.getDate() + 7)
    weekNum++
  }

  if (year === 2026 && monthIndex === 10) {
    return weeks.filter((w) => w.to <= '2026-11-21')
  }

  return weeks
}

const getAllYearMonths = (year = 2026) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const monthNamesUz = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
  const monthNamesRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const months: Array<{ labelUz: string; labelRu: string; labelEn: string; from: string; to: string; yearMonth: string; monthIndex: number; sheetName: string }> = []

  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1)
    const lastDay = new Date(year, m + 1, 0)
    months.push({
      monthIndex: m,
      labelUz: monthNamesUz[m],
      labelRu: monthNamesRu[m],
      labelEn: monthNamesEn[m],
      from: toYMD(d),
      to: toYMD(lastDay),
      yearMonth: `${year}-${pad(m + 1)}`,
      sheetName: `${monthNamesRu[m].toLowerCase()} ${year}`,
    })
  }
  return months
}

const getAvailableYears = () => {
  return [
    { label: '2025', year: 2025, from: '2025-01-01', to: '2025-12-31' },
    { label: '2026', year: 2026, from: '2026-01-01', to: '2026-12-31' },
  ]
}

interface NoteItem {
  id: string
  category: 'waste' | 'expense' | 'cost' | 'production' | 'general'
  product?: string
  monthIndex?: number | number[]
  monthName?: string
  period?: string
  metric?: string
  titleUz?: string
  titleRu?: string
  textRu?: string
  textUz?: string
  text?: string
  author?: string
  createdAt?: string
  isCustom?: boolean
}

interface ProductItem {
  name: string
  unit?: string
  monthly?: number[] | (number | null)[]
  weekly?: number[] | (number | null)[]
  total?: number
  weeklyAvg?: number
}

interface DynamicsData {
  summary: {
    totalVegetableSum: number
    totalWithConsumables: number
    totalVegetableKg: number
    totalFinishedGoodsKg: number
    yieldEfficiency: number
    avgWastePercent: number
    boxCount: number
    boxSum: number
    hypoKg: number
    hypoSum: number
    monthsCount: number
    notesCount: number
  }
  months: string[]
  expenseKg: ProductItem[]
  expenseSum: ProductItem[]
  gpKg: ProductItem[]
  wastePercent: ProductItem[]
  notes: NoteItem[]
  weekly?: {
    periods: string[]
    summary: any
    expenseKg: ProductItem[]
    expenseSum: ProductItem[]
    gpKg: ProductItem[]
    wastePercent: ProductItem[]
    notes: any[]
    totals: any
  }
}

export default function DirectorDynamicsPage() {
  const { directorLang, setDirectorLang, formatDirector } = useLanguage()
  const formatDual = formatDirector

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DynamicsData | null>(null)

  // Navigation & View state - 0. Zaxiralar Balansi is default
  const [activeTab, setActiveTab] = useState<'balance' | 'expense' | 'gp' | 'waste' | 'notes'>('balance')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('2026-11-01')
  const [customEndDate, setCustomEndDate] = useState('2026-11-25')
  const [expenseSubMode, setExpenseSubMode] = useState<'sum' | 'kg'>('sum')
  const [searchQuery, setSearchQuery] = useState('')

  // Sub-interval states: all 12 months & monthly weeks
  const allYearMonths = useMemo(() => getAllYearMonths(2026), [])
  const availableYears = useMemo(() => getAvailableYears(), [])

  // Selected month index for the "Hafta" selector (default 10 = Noyabr)
  const [selectedWeekMonthIndex, setSelectedWeekMonthIndex] = useState(10)
  const currentMonthWeeks = useMemo(() => getWeeksForMonth(2026, selectedWeekMonthIndex), [selectedWeekMonthIndex])

  const [selectedWeek, setSelectedWeek] = useState<WeekOption>(() => {
    const novWeeks = getWeeksForMonth(2026, 10)
    return novWeeks[novWeeks.length - 1] // Noyabr 3-haftasi (16.11.2026 - 21.11.2026)
  })
  const [selectedMonth, setSelectedMonth] = useState(() => allYearMonths[10]) // Noyabr 2026
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1])

  // Custom Director notes state
  const [customNotes, setCustomNotes] = useState<NoteItem[]>([])
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteCategory, setNewNoteCategory] = useState<'expense' | 'production' | 'waste' | 'general'>('expense')
  const [newNoteProduct, setNewNoteProduct] = useState('')
  const [newNotePeriod, setNewNotePeriod] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [notesFilterCategory, setNotesFilterCategory] = useState<string>('all')

  // Fetch dynamics data
  const fetchDynamicsData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/director/dynamics')
      if (!res.ok) throw new Error('Failed to load dynamics data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch custom saved director notes
  const fetchCustomNotes = async () => {
    try {
      const res = await fetch('/api/director/notes')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.notes)) {
          setCustomNotes(json.notes.map((n: any) => ({ ...n, isCustom: true })))
        }
      }
    } catch (err) {
      console.error('Error fetching custom notes:', err)
    }
  }

  useEffect(() => {
    fetchDynamicsData()
    fetchCustomNotes()
  }, [])

  const isWeekly = period === 'week'

  // Available column periods
  const activePeriods = useMemo(() => {
    if (isWeekly && data?.weekly?.periods) {
      return data.weekly.periods
    }
    return data?.months?.slice(0, 10) || []
  }, [isWeekly, data])

  // Current active dataset
  const currentDataset = useMemo(() => {
    if (!data) return []
    if (isWeekly && data.weekly) {
      if (activeTab === 'expense') {
        return expenseSubMode === 'sum' ? data.weekly.expenseSum : data.weekly.expenseKg
      }
      if (activeTab === 'gp') {
        return data.weekly.gpKg
      }
      if (activeTab === 'waste') {
        return data.weekly.wastePercent
      }
      return []
    }
    // Monthly mode
    if (activeTab === 'expense') {
      return expenseSubMode === 'sum' ? data.expenseSum : data.expenseKg
    }
    if (activeTab === 'gp') {
      return data.gpKg
    }
    if (activeTab === 'waste') {
      return data.wastePercent
    }
    return []
  }, [data, isWeekly, activeTab, expenseSubMode])

  // Filter products by search (supports both Uzbek and Russian search terms) and clean any raw notes from table rows
  const filteredProducts = useMemo(() => {
    if (!currentDataset) return []
    // Never allow raw notes as product rows in the table
    const cleanRows = currentDataset.filter(item => {
      const rawName = (item.name || '').trim().toLowerCase()
      return !rawName.startsWith('примечание') && !rawName.startsWith('note:') && !rawName.startsWith('izoh:')
    })

    if (!searchQuery.trim()) return cleanRows
    const q = searchQuery.toLowerCase().trim()
    return cleanRows.filter(item => {
      const localizedName = translateProductName(item.name, directorLang).toLowerCase()
      const rawName = item.name.toLowerCase()
      const localizedUnit = translateUnit(item.unit || '', directorLang).toLowerCase()
      const rawUnit = (item.unit || '').toLowerCase()
      return localizedName.includes(q) || rawName.includes(q) || localizedUnit.includes(q) || rawUnit.includes(q)
    })
  }, [currentDataset, searchQuery, directorLang])

  // Combined notes list (Audited notes + Custom saved notes)
  const allNotesList = useMemo(() => {
    const defaultNotes: NoteItem[] = isWeekly
      ? (data?.weekly?.notes || []).map((n: any, idx: number) => ({
          id: `audited-w-${idx}`,
          category: n.category || 'expense',
          product: n.product,
          period: n.period,
          titleUz: n.titleUz,
          titleRu: n.titleRu,
          textRu: n.textRu,
          textUz: n.textUz,
          author: 'Аудит (ЗФО)'
        }))
      : (data?.notes || []).map((n: any, idx: number) => ({
          id: `audited-m-${idx}`,
          category: n.category || 'expense',
          product: n.product,
          period: n.monthName,
          titleUz: n.titleUz,
          titleRu: n.titleRu,
          textRu: n.textRu,
          textUz: n.textUz,
          author: 'Аудит (ЗФО)'
        }))

    return [...customNotes, ...defaultNotes]
  }, [data, isWeekly, customNotes])

  // Filter notes by active tab or category
  const tabNotes = useMemo(() => {
    let list = allNotesList
    if (activeTab === 'expense') {
      list = list.filter(n => n.category === 'expense' || n.category === 'cost' || n.category === 'general')
    } else if (activeTab === 'gp') {
      list = list.filter(n => n.category === 'production' || n.category === 'general')
    } else if (activeTab === 'waste') {
      list = list.filter(n => n.category === 'waste' || n.category === 'general')
    } else if (activeTab === 'notes' && notesFilterCategory !== 'all') {
      list = list.filter(n => n.category === notesFilterCategory)
    }
    return list
  }, [allNotesList, activeTab, notesFilterCategory])

  // Format numbers
  const formatSum = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '-'
    if (val === 0) return '0.00'
    return Math.round(val).toLocaleString('uz-UZ')
  }

  const formatKg = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '-'
    if (val === 0) return '0.00'
    return val.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
  }

  const formatPercent = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '-'
    if (val === 0) return '0.0%'
    return `${val.toFixed(1)}%`
  }

  // Handle Save Note
  const handleSaveNote = async () => {
    if (!newNoteText.trim()) {
      toast.error('Izoh matnini kiriting')
      return
    }

    try {
      setSavingNote(true)
      const res = await fetch('/api/director/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newNoteText.trim(),
          product: newNoteProduct || 'Umumiy',
          period: newNotePeriod || (isWeekly ? 'Haftalik 2026' : 'Noyabr 2026'),
          category: newNoteCategory,
          author: 'Директор'
        })
      })

      const json = await res.json()
      if (json.success && json.note) {
        setCustomNotes(prev => [json.note, ...prev])
        setNewNoteText('')
        setNewNoteProduct('')
        setNewNotePeriod('')
        setNoteModalOpen(false)
        toast.success(formatDual("Izoh muvaffaqiyatli saqlandi!", "Примечание успешно сохранено!", "Note saved successfully!"))
      } else {
        throw new Error(json.error || 'Failed to save')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setSavingNote(false)
    }
  }

  // Handle Delete Custom Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/director/notes?id=${noteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setCustomNotes(prev => prev.filter(n => n.id !== noteId))
        toast.success(formatDual("Izoh o'chirildi", "Примечание удалено", "Note deleted"))
      }
    } catch (err) {
      toast.error("O'chirishda xatolik yuz berdi")
    }
  }

  const [exportingDynamics, setExportingDynamics] = useState(false)

  // Export Table to Real Styled Excel (.xlsx) using ExcelJS API
  const handleExportDynamicsExcel = async () => {
    if (!currentDataset.length) return
    try {
      setExportingDynamics(true)
      const res = await fetch(`/api/director/export?type=dynamics&tab=${activeTab}&period=${period}&mode=${expenseSubMode}&lang=${directorLang}`)
      if (!res.ok) throw new Error('Eksport qilishda xatolik yuz berdi')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const prefix = directorLang === 'ru' ? 'Информация' : 'Dinamika'
      a.download = `${prefix}_${activeTab}_${period}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(formatDual("Excel jadval yuklandi", "Excel файл успешно загружен", "Excel file downloaded"))
    } catch (err: any) {
      toast.error(err.message || "Excel faylni yuklab olishda xatolik yuz berdi")
    } finally {
      setExportingDynamics(false)
    }
  }

  return (
    <div className="space-y-4 pb-12 animate-enter max-w-[1700px] mx-auto text-slate-900 dark:text-slate-100">
      {/* 1. PROFESSIONAL MONOCHROME HEADER (NO CHILDISH CLUTTER) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-dark-750">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>{formatDual("Sex Uchun Mahsulot Zaxiralari va Sarfi", "Информация по запасам продукции для цеха", "Workshop Stocks & Production")}</span>
          </h1>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Language Switch */}
          <button
            onClick={() => setDirectorLang(directorLang === 'ru' ? 'uz' : 'ru')}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all"
          >
            {directorLang === 'ru' ? '🇷🇺 RU' : '🇺🇿 UZ'}
          </button>

          {/* Add Note Button */}
          <button
            onClick={() => setNoteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>{formatDual("+ Izoh yozish", "+ Примечание", "+ Add Note")}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => { fetchDynamicsData(); fetchCustomNotes(); }}
            title="Yangilash"
            className="p-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all"
          >
            <RefreshCw size={15} />
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            title="Chop etish"
            className="p-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 2. FIXED, STABLE, MONOCHROME NAVIGATION TABS (NO SHIFTING, NO CHILDISH COLORS) */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-center font-bold text-xs sm:text-sm">
          {/* Tab 0: Zaxiralar Balansi */}
          <button
            onClick={() => setActiveTab('balance')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'balance'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Layers size={14} className="shrink-0" />
            <span className="truncate">{formatDual("0. Zaxiralar Balansi", "0. Запасы (Склад)", "0. Stock Balance")}</span>
          </button>

          {/* Tab 1: Chiqim */}
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'expense'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Package size={14} className="shrink-0" />
            <span className="truncate">{formatDual("1. Xomashyo Chiqimi", "1. Расход со склада", "1. Raw Expense")}</span>
          </button>

          {/* Tab 2: GP */}
          <button
            onClick={() => setActiveTab('gp')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gp'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Boxes size={14} className="shrink-0" />
            <span className="truncate">{formatDual("2. Tayyor Mahsulot", "2. Производство продукции", "2. Finished Goods")}</span>
          </button>

          {/* Tab 3: Waste */}
          <button
            onClick={() => setActiveTab('waste')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'waste'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span className="truncate">{formatDual("3. Chiqindi & Otxod", "3. Отход продукции", "3. Waste")}</span>
          </button>

          {/* Tab 4: Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
              activeTab === 'notes'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">{formatDual("4. Boshqaruv Izohlari", "4. Примечания", "4. Notes")}</span>
            <span className="text-[11px] font-mono opacity-70">({allNotesList.length})</span>
          </button>
        </div>
      </div>

      {/* 2.5 MUDDAT / DAVR TANLASH: [ Bugun | Hafta | Oy | Yil | Barchasi | Oraliq ] */}
      <div className="bg-slate-100/80 dark:bg-dark-850 p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 border border-slate-200/60 dark:border-dark-750">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'today', label: formatDual('Bugun', 'Сегодня', 'Today') },
            { id: 'week', label: formatDual('Hafta', 'Неделя', 'Week') },
            { id: 'month', label: formatDual('Oy', 'Месяц', 'Month') },
            { id: 'year', label: formatDual('Yil', 'Год', 'Year') },
            { id: 'all', label: formatDual('Barchasi', 'Все', 'All') },
            { id: 'custom', label: formatDual('Oraliq', 'Период', 'Custom') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                period === tab.id
                  ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-dark-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Context Information Badge or Custom Dropdown Pickers */}
        {period === 'today' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-xs">
            <Calendar size={13} className="text-blue-500" />
            <span>
              {formatDual("Bugun:", "Сегодня:", "Today:")}{' '}
              <span className="font-mono font-black text-blue-900 dark:text-blue-100">
                26.11.2026
              </span>
            </span>
          </div>
        )}

        {period === 'week' && (
          <div className="flex items-center gap-2 flex-wrap">
            <CustomDropdown
              value={selectedWeekMonthIndex}
              onChange={(mIdx) => {
                const num = Number(mIdx)
                setSelectedWeekMonthIndex(num)
                const mWeeks = getWeeksForMonth(2026, num)
                if (mWeeks.length > 0) {
                  setSelectedWeek(mWeeks[mWeeks.length - 1])
                }
              }}
              prefix={formatDual('Oy:', 'Месяц:', 'Month:')}
              buttonClassName="bg-white dark:bg-dark-850 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200"
              options={allYearMonths.map((m) => ({
                value: m.monthIndex,
                label: directorLang === 'ru' ? m.labelRu : directorLang === 'en' ? m.labelEn : m.labelUz
              }))}
            />

            <CustomDropdown
              value={selectedWeek?.from || ''}
              onChange={(fromVal) => {
                const found = currentMonthWeeks.find((w) => w.from === fromVal)
                if (found) setSelectedWeek(found)
              }}
              icon={<Calendar size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />}
              buttonClassName="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 font-bold"
              options={currentMonthWeeks.map((wk) => ({
                value: wk.from,
                label: directorLang === 'ru' ? wk.labelRu : directorLang === 'en' ? wk.labelEn : wk.labelUz
              }))}
            />
          </div>
        )}

        {period === 'month' && (
          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedMonth.yearMonth}
              onChange={(yearMonthVal) => {
                const found = allYearMonths.find((m) => m.yearMonth === yearMonthVal)
                if (found) setSelectedMonth(found)
              }}
              prefix={formatDual('Faol oy:', 'Активный месяц:', 'Active month:')}
              icon={<Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
              buttonClassName="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-950 dark:text-indigo-100 font-black"
              options={allYearMonths.map((m) => ({
                value: m.yearMonth,
                label: directorLang === 'ru' ? m.labelRu : directorLang === 'en' ? m.labelEn : m.labelUz
              }))}
            />
          </div>
        )}

        {period === 'year' && (
          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedYear.year}
              onChange={(yrVal) => {
                const found = availableYears.find((yr) => yr.year === Number(yrVal))
                if (found) setSelectedYear(found)
              }}
              prefix={formatDual('Faol yil:', 'Активный год:', 'Active year:')}
              icon={<Calendar size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              buttonClassName="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-100 font-black"
              options={availableYears.map((yr) => ({
                value: yr.year,
                label: String(yr.year)
              }))}
            />
          </div>
        )}

        {period === 'all' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-200/80 dark:bg-dark-750 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold">
            <span>{formatDual("Barcha hisoblangan davrlar", "Все периоды", "All periods")}</span>
          </div>
        )}

        {period === 'custom' && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 text-xs shadow-xs">
            <span className="text-slate-500 font-bold">{formatDual("Dan:", "С:", "From:")}</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500 font-bold">{formatDual("Gacha:", "По:", "To:")}</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. STABLE SUB-CONTROLS BAR (Search, Sum/Kg switch, CSV Export) */}
      {activeTab !== 'balance' && activeTab !== 'notes' && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-2.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            {/* Expense Metric Switcher (Summa / Hajm) */}
            {activeTab === 'expense' && (
              <div className="bg-slate-100 dark:bg-dark-800 p-0.5 rounded-xl flex items-center border border-slate-200 dark:border-dark-700 text-xs font-bold">
                <button
                  onClick={() => setExpenseSubMode('sum')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    expenseSubMode === 'sum'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {formatDual("Qiymat (so'm)", "Сумма (сум)", "Cost (UZS)")}
                </button>
                <button
                  onClick={() => setExpenseSubMode('kg')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    expenseSubMode === 'kg'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {formatDual("Hajm (kg)", "Объем (кг)", "Volume (kg)")}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={formatDual("Mahsulot qidirish...", "Поиск продукции...", "Search product...")}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Export Excel (.xlsx) */}
            <button
              onClick={handleExportDynamicsExcel}
              disabled={exportingDynamics}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {exportingDynamics ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. CONTENT SECTIONS - PURE EXCEL TABLES ONLY */}
      {activeTab === 'balance' && (
        <DailyStockBalanceTab
          activePeriod={period}
          startDate={customStartDate}
          endDate={customEndDate}
          selectedDateId={
            period === 'today'
              ? '2026-11-25'
              : period === 'week'
              ? (selectedWeek ? `${selectedWeek.from}_${selectedWeek.to}` : undefined)
              : period === 'month'
              ? (selectedMonth ? `${selectedMonth.from}_${selectedMonth.to}` : undefined)
              : undefined
          }
          selectedMonthName={
            period === 'week'
              ? allYearMonths[selectedWeekMonthIndex]?.sheetName
              : period === 'month'
              ? selectedMonth.sheetName
              : undefined
          }
          lang={directorLang}
        />
      )}

      {/* TABLES FOR EXPENSE, GP, WASTE */}
      {activeTab !== 'balance' && activeTab !== 'notes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[720px]">
              <table className="w-full text-left border-collapse text-xs">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-dark-700 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-200 dark:border-dark-700 sticky left-0 z-30 bg-slate-100 dark:bg-dark-800">
                      №
                    </th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-dark-700 sticky left-12 z-30 bg-slate-100 dark:bg-dark-800 min-w-[180px]">
                      {formatDual("Mahsulot nomi", "Наименование", "Product")}
                    </th>
                    <th className="py-3 px-2 text-center border-r border-slate-200 dark:border-dark-700 w-16">
                      {formatDual("Birligi", "Ед. изм.", "Unit")}
                    </th>

                    {/* Columns for Periods with Active Highlighting */}
                    {activePeriods.map((colPeriod, pIdx) => {
                      const isHighlighted = isWeekly
                        ? (selectedWeek && (colPeriod.includes(selectedWeek.from) || pIdx === selectedWeek.weekNum - 1))
                        : (selectedMonth && colPeriod.toLowerCase().includes(selectedMonth.labelRu.toLowerCase()))

                      return (
                        <th
                          key={pIdx}
                          className={`py-3 px-3 text-right border-r border-slate-200 dark:border-dark-700 min-w-[105px] transition-colors ${
                            isHighlighted
                              ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-black ring-1 ring-amber-400'
                              : ''
                          }`}
                        >
                          {isWeekly ? (directorLang === 'ru' ? `H-${pIdx + 1}` : `${pIdx + 1}-h`) : translateMonthName(colPeriod, directorLang)}
                        </th>
                      )
                    })}

                    {/* Sticky Total Column */}
                    <th className="py-3 px-4 text-right border-l border-slate-200 dark:border-dark-700 min-w-[130px] bg-slate-200/80 dark:bg-dark-700 font-black">
                      {formatDual("Jami", "Итого", "Total")}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-mono">
                  {filteredProducts.map((item, idx) => {
                    const isTotalRow = item.name.toLowerCase() === 'всего' || item.name.toLowerCase().includes('всего')
                    const isConsumable = item.name.toLowerCase().includes('коробка') || item.name.toLowerCase().includes('гипохлорид')
                    const isGrandTotalWithConsumables = item.name.toLowerCase().includes('итого с упаковкой') || item.name.toLowerCase().includes('упаковкой') || item.name.toLowerCase() === 'итого'

                    const rawVals = isWeekly ? (item.weekly || []) : (item.monthly || [])
                    const displayVals = isWeekly ? rawVals : rawVals.slice(0, 10)
                    const unit = item.unit || (activeTab === 'waste' ? '%' : expenseSubMode === 'sum' ? 'сум' : 'кг')

                    let rowStyle = 'hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors'
                    if (isTotalRow) {
                      rowStyle = 'bg-[#d9ead3] dark:bg-emerald-950/70 text-slate-900 dark:text-emerald-100 font-black border-y-2 border-emerald-500'
                    } else if (isGrandTotalWithConsumables) {
                      rowStyle = 'bg-slate-900 text-amber-400 dark:bg-slate-950 border-t-2 border-amber-500 font-black'
                    } else if (isConsumable) {
                      rowStyle = 'bg-slate-50/70 dark:bg-dark-850/60 font-semibold text-slate-700 dark:text-slate-300'
                    }

                    return (
                      <tr key={`${item.name}-${idx}`} className={rowStyle}>
                        {/* Index */}
                        <td className={`py-2 px-3 text-center border-r border-slate-200/60 dark:border-dark-750 sticky left-0 z-10 ${
                          isTotalRow
                            ? 'bg-[#d9ead3] dark:bg-emerald-950 text-slate-900 dark:text-emerald-100 font-black'
                            : isGrandTotalWithConsumables
                            ? 'bg-slate-900 text-amber-400 dark:bg-slate-950 font-black'
                            : 'bg-white dark:bg-dark-900'
                        }`}>
                          {isTotalRow || isGrandTotalWithConsumables ? '★' : idx + 1}
                        </td>

                        {/* Product Name */}
                        <td className={`py-2 px-3 border-r border-slate-200/60 dark:border-dark-750 sticky left-12 z-10 font-sans font-bold ${
                          isTotalRow
                            ? 'bg-[#d9ead3] dark:bg-emerald-950 text-slate-900 dark:text-white'
                            : isGrandTotalWithConsumables
                            ? 'bg-slate-900 text-amber-400 dark:bg-slate-950'
                            : 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white'
                        }`}>
                          {translateProductName(item.name, directorLang)}
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200/60 dark:border-dark-750 text-[11px]">
                          {translateUnit(unit, directorLang)}
                        </td>

                        {/* Period Values with Active Highlighting */}
                        {displayVals.map((val, vIdx) => {
                          const colPeriod = activePeriods[vIdx] || ''
                          const isHighlighted = isWeekly
                            ? (selectedWeek && (colPeriod.includes(selectedWeek.from) || vIdx === selectedWeek.weekNum - 1))
                            : (selectedMonth && colPeriod.toLowerCase().includes(selectedMonth.labelRu.toLowerCase()))

                          const displayVal = activeTab === 'waste'
                            ? formatPercent(val)
                            : activeTab === 'expense' && expenseSubMode === 'sum'
                            ? formatSum(val)
                            : formatKg(val)

                          return (
                            <td
                              key={vIdx}
                              className={`py-2 px-3 text-right border-r border-slate-200/60 dark:border-dark-750 text-slate-800 dark:text-slate-200 ${
                                isHighlighted ? 'bg-amber-100/60 dark:bg-amber-950/40 font-bold text-amber-950 dark:text-amber-100' : ''
                              }`}
                            >
                              {displayVal}
                            </td>
                          )
                        })}

                        {/* Total / Average */}
                        <td className={`py-2 px-4 text-right border-l border-slate-200 dark:border-dark-700 font-black text-slate-900 dark:text-white ${
                          isTotalRow ? 'bg-[#c6e0b4] dark:bg-emerald-900' : 'bg-slate-100/70 dark:bg-dark-800'
                        }`}>
                          {activeTab === 'waste'
                            ? formatPercent(item.total)
                            : activeTab === 'expense' && expenseSubMode === 'sum'
                            ? formatSum(item.total)
                            : formatKg(item.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDITED & SAVED NOTES (ПРИМЕЧАНИЕ) BLOCK UNDER TABLE */}
          {tabNotes.length > 0 && (
            <div className="bg-slate-50 dark:bg-dark-850 rounded-2xl p-4 border border-slate-200 dark:border-dark-750 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
                  <FileText size={15} className="text-slate-600 dark:text-slate-400" />
                  <span>{formatDual("Jadval izohlari:", "Примечания к таблице:", "Table Notes:")}</span>
                  <span className="text-slate-400 font-mono">({tabNotes.length})</span>
                </div>

                <button
                  onClick={() => setNoteModalOpen(true)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>{formatDual("Izoh qo'shish", "Добавить примечание", "Add note")}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-2 font-medium">
                {tabNotes.map((note) => (
                  <div key={note.id} className="flex items-start justify-between gap-3 p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <div>
                        {note.product && (
                          <strong className="text-slate-900 dark:text-white mr-1.5">
                            [{translateProductName(note.product, directorLang)} · {note.period || '2026'}]:
                          </strong>
                        )}
                        <span>{directorLang === 'ru' ? (note.textRu || note.text) : (note.textUz || translateNoteText(note.text || note.textRu, 'uz'))}</span>
                      </div>
                    </div>

                    {note.isCustom && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors shrink-0"
                        title="O'chirish"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 4: DEDICATED MANAGEMENT NOTES (ПРИМЕЧАНИЯ РУКОВОДСТВА) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Notes Top Filter & Add Button */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">{formatDual("Kategoriya:", "Категория:", "Category:")}</span>
              {[
                { id: 'all', label: formatDual('Barchasi', 'Все', 'All') },
                { id: 'expense', label: formatDual('Chiqim', 'Расход', 'Expense') },
                { id: 'production', label: formatDual('Ishlab chiqarish', 'Производство', 'Production') },
                { id: 'waste', label: formatDual('Otxod', 'Отходы', 'Waste') },
                { id: 'general', label: formatDual('Umumiy', 'Общие', 'General') }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNotesFilterCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    notesFilterCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setNoteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>{formatDual("Yangi izoh yozish", "Добавить примечание", "Add new note")}</span>
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-2">
            {tabNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750">
                {formatDual("Izohlar topilmadi", "Примечания не найдены", "No notes found")}
              </div>
            ) : (
              tabNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-dark-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {translateProductName(note.product, directorLang) || formatDual('Umumiy', 'Общие', 'General')}
                      </span>
                      {note.period && <span>· {note.period}</span>}
                      {note.author && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {note.author === 'Аудит (ЗФО)' ? formatDual('Audit (ZFO)', 'Аудит (ЗФО)', 'Audit') : note.author}
                        </span>
                      )}
                    </div>

                    {note.isCustom && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {directorLang === 'ru' ? (note.textRu || note.text) : (note.textUz || translateNoteText(note.text || note.textRu, 'uz'))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. NOTE CREATION MODAL (SAQLANADIGAN VA YOZILADIGAN QILIB BERISH) */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={18} />
                <span>{formatDual("Rahbariyat Izohini Yozish (Примечание)", "Добавить примечание руководства", "Add Executive Note")}</span>
              </h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Category Select */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {formatDual("Kategoriya / Bo'lim:", "Категория / Раздел:", "Category:")}
                </label>
                <select
                  value={newNoteCategory}
                  onChange={e => setNewNoteCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-slate-500"
                >
                  <option value="expense">{formatDual("Xomashyo chiqimi", "Расход со склада для цеха", "Raw expense")}</option>
                  <option value="production">{formatDual("Tayyor mahsulot ishlab chiqarish", "Производство готовой продукции", "Finished goods production")}</option>
                  <option value="waste">{formatDual("Mahsulot chiqindisi (Otxod)", "Отход продукции", "Waste")}</option>
                  <option value="general">{formatDual("Ombor zaxiralari / Umumiy", "Запасы на складе / Общее", "Warehouse stocks / General")}</option>
                </select>
              </div>

              {/* Product & Period Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {formatDual("Mahsulot:", "Наименование:", "Product:")}
                  </label>
                  <input
                    type="text"
                    value={newNoteProduct}
                    onChange={e => setNewNoteProduct(e.target.value)}
                    placeholder="Masalan: Айсберг, Помидоры..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {formatDual("Davr / Sana:", "Период / Дата:", "Period / Date:")}
                  </label>
                  <input
                    type="text"
                    value={newNotePeriod}
                    onChange={e => setNewNotePeriod(e.target.value)}
                    placeholder="Masalan: Ноябрь 2026, 02.11..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {/* Note Textarea */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {formatDual("Izoh matni (Примечание):", "Текст примечания:", "Note text:")}
                </label>
                <textarea
                  rows={4}
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  placeholder="Bozordagi vaziyat, xomashyo sifati, defitsit yoki narx sabablari haqida yozing..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-slate-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-800">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button
                type="button"
                disabled={savingNote}
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

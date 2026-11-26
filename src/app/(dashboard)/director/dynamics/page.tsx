'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  Info,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Printer,
  Sparkles,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Boxes,
  ChefHat,
  X
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface NoteItem {
  id: string
  category: 'waste' | 'expense' | 'cost'
  product: string
  monthIndex: number | number[]
  monthName: string
  metric: string
  titleUz: string
  titleRu: string
  textRu: string
  textUz: string
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
  expenseKg: Array<{ name: string; unit: string; monthly: number[]; total: number }>
  expenseSum: Array<{ name: string; unit: string; monthly: number[]; total: number }>
  gpKg: Array<{ name: string; unit: string; monthly: number[]; total: number }>
  wastePercent: Array<{ name: string; unit: string; monthly: (number | null)[] }>
  notes: NoteItem[]
  weeklyPeriods: string[]
  weeklyExpenseKg: Array<{ name: string; unit: string; weeks: Array<{ period: string; value: number }> }>
}

export default function DirectorDynamicsPage() {
  const { directorLang, setDirectorLang, formatDirector } = useLanguage()
  const formatDual = formatDirector

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DynamicsData | null>(null)

  // View state
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly')
  const [activeTab, setActiveTab] = useState<'expense' | 'gp' | 'waste' | 'notes'>('expense')
  const [expenseSubMode, setExpenseSubMode] = useState<'sum' | 'kg'>('sum')
  
  // Drill-down & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})
  const [onlyNotesFilter, setOnlyNotesFilter] = useState(false)
  const [viewStyle, setViewStyle] = useState<'cards' | 'matrix'>('cards')
  const [selectedNoteModal, setSelectedNoteModal] = useState<NoteItem | null>(null)

  useEffect(() => {
    fetchDynamicsData()
  }, [])

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

  const toggleProductExpand = (productName: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName]
    }))
  }

  const expandAll = () => {
    if (!currentProductsList) return
    const allExpanded: Record<string, boolean> = {}
    currentProductsList.forEach(p => { allExpanded[p.name] = true })
    setExpandedProducts(allExpanded)
  }

  const collapseAll = () => {
    setExpandedProducts({})
  }

  // Format currency in sum
  const formatSum = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '0'
    if (Math.abs(val) >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)} mln`
    }
    return Math.round(val).toLocaleString()
  }

  const formatKg = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '0 kg'
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)} tn`
    }
    return `${Math.round(val * 10) / 10} kg`
  }

  const formatPercent = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '—'
    return `${(val * 100).toFixed(2)}%`
  }

  // Active dataset according to current tab & subMode
  const currentDataset = useMemo(() => {
    if (!data) return []
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
  }, [data, activeTab, expenseSubMode])

  // Map notes by product name
  const notesByProduct = useMemo(() => {
    const map = new Map<string, NoteItem[]>()
    if (!data?.notes) return map
    data.notes.forEach(note => {
      const pName = note.product.toLowerCase().trim()
      const existing = map.get(pName) || []
      existing.push(note)
      map.set(pName, existing)
    })
    return map
  }, [data?.notes])

  // Filtered products list
  const currentProductsList = useMemo(() => {
    if (!currentDataset) return []
    return currentDataset.filter(item => {
      if (!item.name || item.name.includes('Итого с упаковкой')) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim()
        if (!item.name.toLowerCase().includes(q)) return false
      }
      if (onlyNotesFilter) {
        const hasNotes = notesByProduct.has(item.name.toLowerCase().trim())
        if (!hasNotes) return false
      }
      return true
    })
  }, [currentDataset, searchQuery, onlyNotesFilter, notesByProduct])

  // Trend chart data (10 months aggregate)
  const chartData = useMemo(() => {
    if (!data || !data.months) return []
    return data.months.slice(0, 10).map((monthName, idx) => {
      let totalValue = 0
      if (activeTab === 'expense') {
        const totalRow = (expenseSubMode === 'sum' ? data.expenseSum : data.expenseKg).find(i => i.name === 'Всего')
        totalValue = totalRow?.monthly?.[idx] || 0
      } else if (activeTab === 'gp') {
        const totalRow = data.gpKg.find(i => i.name === 'Всего')
        totalValue = totalRow?.monthly?.[idx] || 0
      } else if (activeTab === 'waste') {
        // Average waste for the month
        const validWaste = data.wastePercent
          .map(w => w.monthly[idx])
          .filter((v): v is number => v !== null && !isNaN(v) && v > 0)
        totalValue = validWaste.length > 0
          ? Math.round((validWaste.reduce((a, b) => a + b, 0) / validWaste.length) * 10000) / 100
          : 0
      }

      // Check if this month has any management notes
      const monthNotes = data.notes.filter(n => {
        if (Array.isArray(n.monthIndex)) return n.monthIndex.includes(idx)
        return n.monthIndex === idx
      })

      return {
        month: monthName,
        shortMonth: monthName.slice(0, 3),
        value: totalValue,
        notesCount: monthNotes.length,
        notes: monthNotes
      }
    })
  }, [data, activeTab, expenseSubMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-spin text-emerald-500">
          <RefreshCw size={24} />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {formatDual("Direktor boshqaruv dinamikasi yuklanmoqda...", "Загрузка управленческой динамики...", "Loading executive dynamics...")}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {formatDual("Oylik va haftalik ko'rsatkichlar hisoblanmoqda...", "Расчет месячных и недельных показателей...", "Calculating monthly and weekly metrics...")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-dark-950 text-slate-800 dark:text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-dark-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/director"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>{formatDual("Direktor Paneli", "Панель Директора", "Director Dashboard")}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
              {formatDual("Executive Dinamika (Drill-Down)", "Управленческая динамика (Drill-Down)", "Executive Dynamics (Drill-Down)")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>{formatDual("Korxona Ishlab Chiqarish Dinamikasi", "Динамика производства и расхода цеха", "Enterprise Dynamics & Performance")}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-extrabold uppercase tracking-wider">
              2026
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            {formatDual(
              "Sexga berilgan xomashyo sarfi, tayyor mahsulot (GP) chiqarilishi, chiqindilar (% otxod) va rahbariyatning maxsus boshqaruv izohlari.",
              "Расход сырья со склада в цех, производство готовой продукции (ГП), процент отходов и примечания руководства.",
              "Raw materials to workshop, finished goods output, scrap percentages and management annotations."
            )}
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
          {/* Period Toggle: Monthly vs Weekly */}
          <div className="bg-slate-200/80 dark:bg-dark-800 p-1 rounded-xl flex items-center border border-slate-300/80 dark:border-dark-700 shadow-inner">
            <button
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodType === 'monthly'
                  ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>{formatDual("Oylik (10 oy)", "По месяцам (10 мес)", "Monthly")}</span>
            </button>
            <button
              onClick={() => setPeriodType('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodType === 'weekly'
                  ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>{formatDual("Haftalik", "По неделям", "Weekly")}</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDynamicsData}
            title={formatDual("Ma'lumotlarni yangilash", "Обновить данные", "Refresh data")}
            className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors shadow-xs"
          >
            <RefreshCw size={15} />
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            title={formatDual("Chop etish", "Печать", "Print")}
            className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors shadow-xs hidden sm:block"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE MACRO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Xomashyo Mablag'i */}
        <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-dark-750 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">
                {formatDual("Jami Xomashyo Mablag'i", "Общая сумма расхода сырья", "Total Raw Material Cost")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatSum(data?.summary?.totalVegetableSum)} <span className="text-xs font-semibold text-slate-400">so'm</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Sabzavotlar xarajati", "Расход на овощи", "Vegetables only")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">12.25 mlrd</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{formatDual("Qadoq & Dezinfeksiya", "Упаковка и химия", "Boxes & Chemicals")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">477.4 mln</span>
            </div>
          </div>
        </div>

        {/* Card 2: Xomashyo Hajmi (Kg/Tn) */}
        <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-dark-750 shadow-xs relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">
                {formatDual("Sexga Berilgan Xomashyo", "Расход сырья в цех (кг)", "Raw Material Dispatched")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                <Package size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatKg(data?.summary?.totalVegetableKg)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Gofra qutilar sarfi", "Расход гофрокоробок", "Boxes used")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{(data?.summary?.boxCount || 0).toLocaleString()} dona</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{formatDual("Gipoxlorid sarfi", "Расход гипохлорида", "Hypochlorite")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{formatKg(data?.summary?.hypoKg)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tayyor Mahsulot (GP) */}
        <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-dark-750 shadow-xs relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">
                {formatDual("Tayyor Mahsulot (GP)", "Выпуск готовой продукции", "Finished Goods (GP)")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
                <Boxes size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatKg(data?.summary?.totalFinishedGoodsKg)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Chiqim samaradorligi", "Коэффициент выхода (КПД)", "Yield Efficiency")}:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{data?.summary?.yieldEfficiency}%</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{formatDual("O'rtacha oylik ishlab chiqarish", "Среднемесячный выпуск", "Monthly Average")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{formatKg((data?.summary?.totalFinishedGoodsKg || 0) / 10)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Chiqindilar & Izohlar */}
        <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-dark-750 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">
                {formatDual("O'rtacha Chiqindi & Yo'qotish", "Средний процент отходов", "Average Waste Rate")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data?.summary?.avgWastePercent}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Boshqaruv izohlari", "Примечания руководства", "Management Notes")}:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.2 rounded-md">
                {data?.summary?.notesCount || 11} ta anomaliya
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{formatDual("Asosiy sabab", "Ключевой фактор", "Key factor")}:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Yozgi issiq / Qurg'oqchilik</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DRILL-DOWN NAVIGATION & CONTROL TABS */}
      <div className="bg-white dark:bg-dark-900/90 rounded-2xl border border-slate-200/90 dark:border-dark-750 p-3 sm:p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Main 4 Pillar Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 dark:bg-dark-800 p-1.5 rounded-xl border border-slate-200 dark:border-dark-700">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'expense'
                  ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package size={15} />
              <span>{formatDual("1. Xomashyo Chiqimi (Склад -> Цех)", "1. Расход сырья для цеха", "1. Raw Materials to Workshop")}</span>
            </button>

            <button
              onClick={() => setActiveTab('gp')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'gp'
                  ? 'bg-white dark:bg-dark-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Boxes size={15} />
              <span>{formatDual("2. Tayyor Mahsulot (ГП)", "2. Производство готовой продукции", "2. Finished Goods")}</span>
            </button>

            <button
              onClick={() => setActiveTab('waste')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'waste'
                  ? 'bg-white dark:bg-dark-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle size={15} />
              <span>{formatDual("3. Chiqindi & Yo'qotish (% Отход)", "3. Отход продукции (%)", "3. Waste Rate (%)")}</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info size={15} />
              <span>{formatDual("4. Boshqaruv Izohlari (Примечания)", "4. Примечания руководства", "4. Management Notes")}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                {data?.notes?.length || 11}
              </span>
            </button>
          </div>

          {/* Submode toggles (Summa vs Kg) when on Expense Tab */}
          {activeTab === 'expense' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 self-start lg:self-auto">
              <button
                onClick={() => setExpenseSubMode('sum')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  expenseSubMode === 'sum'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign size={13} />
                <span>{formatDual("Summa (So'm)", "Сумма (сум)", "Cost (UZS)")}</span>
              </button>
              <button
                onClick={() => setExpenseSubMode('kg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  expenseSubMode === 'kg'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package size={13} />
                <span>{formatDual("Hajm (Kg)", "Объём (кг)", "Volume (kg)")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter and View mode bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-dark-800">
          <div className="flex items-center flex-wrap gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[260px] flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={formatDual("Mahsulot qidirish...", "Поиск продукции...", "Search product...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter by items with notes */}
            <button
              onClick={() => setOnlyNotesFilter(!onlyNotesFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                onlyNotesFilter
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                  : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Info size={12} />
              <span>{formatDual("Faqat izohli mahsulotlar", "Только с примечаниями", "Only with notes")}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand / Collapse all */}
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:text-slate-900 dark:hover:text-white"
            >
              {formatDual("Barchasini ochish", "Раскрыть все", "Expand all")}
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:text-slate-900 dark:hover:text-white"
            >
              {formatDual("Yig'ish", "Свернуть", "Collapse")}
            </button>

            {/* View style: Cards vs Matrix Table */}
            <div className="bg-slate-100 dark:bg-dark-800 p-0.5 rounded-xl border border-slate-200 dark:border-dark-700 flex items-center">
              <button
                onClick={() => setViewStyle('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewStyle === 'cards'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {formatDual("Drill-Down Kartalar", "Карточки", "Cards")}
              </button>
              <button
                onClick={() => setViewStyle('matrix')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewStyle === 'matrix'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {formatDual("To'liq Jadval (Matrix)", "Матрица", "Matrix")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXECUTIVE MONTHLY TREND CHART */}
      {activeTab !== 'notes' && chartData.length > 0 && (
        <div className="bg-white dark:bg-dark-900/90 rounded-2xl border border-slate-200/90 dark:border-dark-750 p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>
                  {activeTab === 'expense'
                    ? (expenseSubMode === 'sum' ? formatDual("Oylik Xomashyo Xarajatlari Dinamikasi (So'm)", "Динамика расходов на сырье по месяцам (сум)", "Monthly Raw Materials Cost (UZS)") : formatDual("Oylik Xomashyo Chiqimi Dinamikasi (Kg)", "Динамика расхода сырья по месяцам (кг)", "Monthly Raw Materials Volume (kg)"))
                    : activeTab === 'gp'
                    ? formatDual("Oylik Tayyor Mahsulot Chiqarilishi (Kg)", "Динамика выпуска готовой продукции (кг)", "Monthly Finished Goods Output (kg)")
                    : formatDual("Oylik O'rtacha Chiqindi Foizi (% Otxod)", "Динамика процента отходов (%)", "Monthly Average Scrap Rate (%)")}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {formatDual("10 oylik umumiy tendensiya va anomaliyalar", "Общая тенденция за 10 месяцев с примечаниями", "10-month trend curve with contextual anomalies")}
              </p>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Yanvar — Oktabr 2026</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTab === 'waste' ? '#f59e0b' : '#10b981'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={activeTab === 'waste' ? '#f59e0b' : '#10b981'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="shortMonth" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (activeTab === 'waste') return `${v}%`
                    if (activeTab === 'expense' && expenseSubMode === 'sum') return `${(v / 1_000_000_000).toFixed(1)}B`
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}t`
                    return v
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs border border-slate-700">
                          <div className="font-extrabold text-sm border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{p.month} 2026</span>
                            {p.notesCount > 0 && (
                              <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded text-[10px]">
                                {p.notesCount} ta izoh
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-emerald-400 font-bold text-base">
                            {activeTab === 'waste'
                              ? `${p.value}%`
                              : activeTab === 'expense' && expenseSubMode === 'sum'
                              ? `${formatSum(p.value)} so'm`
                              : `${formatKg(p.value)}`}
                          </div>
                          {p.notes?.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-300">
                              <span className="font-bold">⚠️ Boshqaruv xulosasi: </span>
                              <span>{directorLang === 'ru' ? p.notes[0].textRu : p.notes[0].textUz}</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeTab === 'waste' ? '#f59e0b' : '#10b981'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. TAB 4: DEDICATED MANAGEMENT NOTES (Примечания) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                {formatDual(
                  "Boshqaruv Hisobotlari va Anomaliyalar bo'yicha Izohlar (Примечания)",
                  "Управленческие примечания к аномалиям в отчетах",
                  "Management Annotations to Operational Anomalies"
                )}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300/90 mt-0.5">
                {formatDual(
                  "Ushbu izohlar har bir oydagi me'yordan og'ishlar, narx o'zgarishlari, bozor defitsiti va iqlimiy omillar ta'sirini tushuntirib beradi.",
                  "Данные примечания объясняют отклонения от норм, ценовые колебания, дефицит на рынке и климатические факторы.",
                  "These annotations explain variances from standards, price shifts, market deficits, and climatic impacts."
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data?.notes?.map((note) => {
              const isWaste = note.category === 'waste'
              const isCost = note.category === 'cost'
              return (
                <div
                  key={note.id}
                  className={`bg-white dark:bg-dark-900 rounded-2xl border p-4 shadow-xs relative overflow-hidden transition-all hover:shadow-md ${
                    isWaste
                      ? 'border-amber-200 dark:border-amber-500/30'
                      : isCost
                      ? 'border-rose-200 dark:border-rose-500/30'
                      : 'border-blue-200 dark:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white inline-block" />
                      {note.product}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isWaste
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : isCost
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    }`}>
                      {note.monthName} · {note.metric}
                    </span>
                  </div>

                  <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                    {directorLang === 'ru' ? note.titleRu : note.titleUz}
                  </h5>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {directorLang === 'ru' ? note.textRu : note.textUz}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. DRILL-DOWN PRODUCT DOSSIERS (Cards View) */}
      {activeTab !== 'notes' && viewStyle === 'cards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{formatDual(`Ko'rsatilmoqda: ${currentProductsList.length} ta mahsulot`, `Показано: ${currentProductsList.length} позиций`, `Showing: ${currentProductsList.length} items`)}</span>
            <span className="text-[11px] text-slate-400">
              {formatDual("Tafsilotlarni ko'rish uchun mahsulot qatorini bosing", "Нажмите на строку для раскрытия динамики", "Click on any product to drill down")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentProductsList.map((item: any) => {
              const isExpanded = Boolean(expandedProducts[item.name])
              const notes = notesByProduct.get(item.name.toLowerCase().trim()) || []
              const hasNotes = notes.length > 0
              const unit = item.unit || 'kg'

              // Calculate monthly avg
              const validValues = item.monthly.slice(0, 10).filter((v: any) => v !== null && !isNaN(v) && v > 0)
              const avgMonth = validValues.length > 0
                ? validValues.reduce((a: number, b: number) => a + b, 0) / validValues.length
                : 0

              const isTotalRow = item.name === 'Всего'

              return (
                <div
                  key={item.name}
                  className={`bg-white dark:bg-dark-900 rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isTotalRow
                      ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-500/5'
                      : hasNotes
                      ? 'border-slate-200 dark:border-dark-750 hover:border-amber-400 dark:hover:border-amber-500/50'
                      : 'border-slate-200 dark:border-dark-750 hover:border-slate-300'
                  }`}
                >
                  {/* Summary Bar (Clickable) */}
                  <div
                    onClick={() => toggleProductExpand(item.name)}
                    className="p-3.5 sm:p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isTotalRow
                          ? 'bg-emerald-600 text-white'
                          : hasNotes
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isTotalRow ? 'Σ' : item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                          <span>{item.name}</span>
                          {hasNotes && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black flex items-center gap-1">
                              <Info size={11} />
                              <span>{notes.length} ta izoh</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{formatDual("Birlik", "Ед. изм.", "Unit")}: <strong>{unit}</strong></span>
                          <span>·</span>
                          <span>{formatDual("10 oylik o'rtacha", "Среднее за 10 мес", "10-mo avg")}: <strong>
                            {activeTab === 'waste'
                              ? formatPercent(avgMonth)
                              : activeTab === 'expense' && expenseSubMode === 'sum'
                              ? `${formatSum(avgMonth)} so'm`
                              : `${formatKg(avgMonth)}`}
                          </strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Total & Expand Trigger */}
                    <div className="flex items-center justify-between md:justify-end gap-5">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {formatDual("Yillik Jami", "Итого за 10 мес", "Annual Total")}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                          {activeTab === 'waste'
                            ? formatPercent(avgMonth)
                            : activeTab === 'expense' && expenseSubMode === 'sum'
                            ? `${formatSum(item.total)} so'm`
                            : `${formatKg(item.total)}`}
                        </span>
                      </div>

                      <div className={`w-7 h-7 rounded-lg bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Drill-Down Dossier */}
                  {isExpanded && (
                    <div className="px-3.5 pb-4 pt-1 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-950/40 space-y-3.5">
                      {/* Product Management Notes if any */}
                      {hasNotes && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertCircle size={13} />
                            <span>{formatDual("Ushbu mahsulot bo'yicha rahbariyat izohlari (Примечания):", "Примечания руководства по данной позиции:", "Management notes for this item:")}</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {notes.map(n => (
                              <div key={n.id} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs">
                                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200 mb-1">
                                  <span>{n.monthName}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-500/30 text-[10px] font-black">{n.metric}</span>
                                </div>
                                <p className="text-amber-800 dark:text-amber-300/90 text-[11px] leading-relaxed">
                                  {directorLang === 'ru' ? n.textRu : n.textUz}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 10-month detailed progression */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                          {formatDual("10 oylik taqsimot (Oylar kesimida):", "Помесячная разбивка (10 месяцев):", "10-month breakdown:")}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                          {data?.months.slice(0, 10).map((mName, mIdx) => {
                            const val = item.monthly[mIdx]
                            const isNull = val === null || val === undefined || isNaN(val)
                            
                            // Check if this month has a note for this product
                            const monthNote = notes.find(n => {
                              if (Array.isArray(n.monthIndex)) return n.monthIndex.includes(mIdx)
                              return n.monthIndex === mIdx
                            })

                            return (
                              <div
                                key={mName}
                                onClick={() => monthNote && setSelectedNoteModal(monthNote)}
                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                  monthNote
                                    ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 cursor-pointer hover:shadow-xs'
                                    : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-750'
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center justify-center gap-1">
                                  <span>{mName.slice(0, 3)}</span>
                                  {monthNote && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />}
                                </div>
                                <div className={`text-xs font-black font-mono ${
                                  monthNote ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {isNull
                                    ? '—'
                                    : activeTab === 'waste'
                                    ? `${(val * 100).toFixed(1)}%`
                                    : activeTab === 'expense' && expenseSubMode === 'sum'
                                    ? formatSum(val)
                                    : formatKg(val)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 7. FULL MATRIX TABLE VIEW (For comprehensive spreadsheet inspections) */}
      {activeTab !== 'notes' && viewStyle === 'matrix' && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 sticky left-0 bg-slate-50 dark:bg-dark-800 z-10 min-w-[200px]">
                    {formatDual("Mahsulot Nomi", "Наименование", "Product Name")}
                  </th>
                  <th className="p-3 text-center min-w-[60px]">{formatDual("Birlik", "Ед.", "Unit")}</th>
                  {data?.months.slice(0, 10).map(m => (
                    <th key={m} className="p-3 text-right min-w-[95px]">{m}</th>
                  ))}
                  <th className="p-3.5 text-right font-black text-slate-900 dark:text-white min-w-[120px] bg-slate-100/60 dark:bg-dark-750/50">
                    {formatDual("Yillik Jami", "Итого", "Total")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-mono">
                {currentProductsList.map((row: any) => {
                  const isTotal = row.name === 'Всего'
                  const notes = notesByProduct.get(row.name.toLowerCase().trim()) || []

                  return (
                    <tr
                      key={row.name}
                      className={`hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors ${
                        isTotal ? 'bg-emerald-50/30 dark:bg-emerald-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-dark-900 z-10 whitespace-nowrap flex items-center gap-2">
                        <span>{row.name}</span>
                        {notes.length > 0 && (
                          <span
                            onClick={() => setSelectedNoteModal(notes[0])}
                            className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-black cursor-pointer"
                            title={`${notes.length} ta izoh`}
                          >
                            !
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-400 font-sans">{row.unit || 'kg'}</td>
                      {row.monthly.slice(0, 10).map((val: any, idx: number) => {
                        const isNull = val === null || val === undefined || isNaN(val)
                        const cellNote = notes.find(n => {
                          if (Array.isArray(n.monthIndex)) return n.monthIndex.includes(idx)
                          return n.monthIndex === idx
                        })

                        return (
                          <td
                            key={idx}
                            onClick={() => cellNote && setSelectedNoteModal(cellNote)}
                            className={`p-3 text-right whitespace-nowrap ${
                              cellNote
                                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold cursor-pointer underline decoration-amber-400 decoration-dotted'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isNull
                              ? '—'
                              : activeTab === 'waste'
                              ? `${(val * 100).toFixed(2)}%`
                              : activeTab === 'expense' && expenseSubMode === 'sum'
                              ? Math.round(val).toLocaleString()
                              : typeof val === 'number' ? (Math.round(val * 10) / 10).toLocaleString() : val}
                          </td>
                        )
                      })}
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-dark-800/50 whitespace-nowrap">
                        {activeTab === 'waste'
                          ? '—'
                          : activeTab === 'expense' && expenseSubMode === 'sum'
                          ? Math.round(row.total).toLocaleString()
                          : typeof row.total === 'number' ? (Math.round(row.total * 10) / 10).toLocaleString() : row.total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. WEEKLY PERIODS VIEW (When periodType === 'weekly') */}
      {periodType === 'weekly' && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-emerald-500" size={18} />
                <span>{formatDual("Haftalik Xomashyo Sarfi Dinamikasi", "Недельная динамика расхода сырья", "Weekly Raw Materials Dynamics")}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {formatDual("Haftalar kesimidagi hisobotlar (yangi haftalar avtomatik qo'shiladi)", "Отчеты в разрезе недель (новые недели добавляются автоматически)", "Weekly periods breakdown")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 min-w-[200px]">{formatDual("Mahsulot", "Наименование", "Product")}</th>
                  <th className="p-3 text-center">{formatDual("Birlik", "Ед.", "Unit")}</th>
                  {data?.weeklyPeriods.slice(0, 6).map(p => (
                    <th key={p} className="p-3 text-right min-w-[130px]">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-mono">
                {data?.weeklyExpenseKg?.map((item: any) => (
                  <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-dark-800/40">
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="p-3 text-center text-slate-400 font-sans">{item.unit || 'kg'}</td>
                    {item.weeks.slice(0, 6).map((w: any, idx: number) => (
                      <td key={idx} className="p-3 text-right text-slate-800 dark:text-slate-200">
                        {w.value ? Math.round(w.value * 10) / 10 : 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. MODAL FOR NOTE / INSIGHT DETAILS */}
      {selectedNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {directorLang === 'ru' ? selectedNoteModal.titleRu : selectedNoteModal.titleUz}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {selectedNoteModal.product} · {selectedNoteModal.monthName} ({selectedNoteModal.metric})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              <p className="font-semibold mb-1 text-amber-900 dark:text-amber-300">
                {formatDual("Rahbariyat xulosasi va tushuntirishi:", "Официальное примечание руководства:", "Official Management Note:")}
              </p>
              {directorLang === 'ru' ? selectedNoteModal.textRu : selectedNoteModal.textUz}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90"
              >
                {formatDual("Tushundim", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle,
  ChevronDown, ChevronUp, Search, Calendar, Layers, RefreshCw,
  Info, Filter, Printer, ArrowLeft, ArrowRight, Eye, CheckCircle2,
  Boxes, FileText, X, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
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

interface WeeklyNoteItem {
  id: string
  blockIndex: number
  period: string
  weekIndices: number[]
  category: 'waste' | 'expense' | 'production' | 'cost'
  product: string
  titleUz: string
  titleRu: string
  textRu: string
  textUz: string
}

interface ProductItem {
  name: string
  unit?: string
  monthly?: number[] | (number | null)[]
  weekly?: number[] | (number | null)[]
  total?: number
  weeklyAvg?: number
}

interface ChartPoint {
  label: string
  shortLabel: string
  value: number
  notesCount: number
  notes: any[]
  periodStr?: string
  weekIndex?: number
  shortDate?: string
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
    summary: {
      totalVegetableSum: number
      totalWithConsumables: number
      totalVegetableKg: number
      totalFinishedGoodsKg: number
      yieldEfficiency: number
      avgWastePercent: number
      avgWeeklySpend: number
      avgWeeklyVolume: number
      avgWeeklyGp: number
      totalBoxes: number
      totalHypoKg: number
      weeksCount: number
      notesCount: number
    }
    expenseKg: ProductItem[]
    expenseSum: ProductItem[]
    gpKg: ProductItem[]
    wastePercent: ProductItem[]
    notes: WeeklyNoteItem[]
    totals: {
      totalExpKgVeg: number[]
      totalExpSumVeg: number[]
      boxesQty: number[]
      boxesSum: number[]
      hypoKg: number[]
      hypoSum: number[]
      grandTotalSum: number[]
      totalGpKg: number[]
      weeklyAvgWaste: number[]
    }
  }
  weeklyPeriods?: string[]
  weeklyExpenseKg?: any[]
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
  
  // Weekly Quarter filter (All, Q1, Q2, Q3, Q4)
  const [weekQuarter, setWeekQuarter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all')

  // Drill-down & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({})
  const [onlyNotesFilter, setOnlyNotesFilter] = useState(false)
  const [viewStyle, setViewStyle] = useState<'cards' | 'matrix'>('cards')
  const [selectedNoteModal, setSelectedNoteModal] = useState<any | null>(null)

  // Notes tab category filter
  const [notesCategoryFilter, setNotesCategoryFilter] = useState<'all' | 'waste' | 'expense'>('all')

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

  const isWeekly = periodType === 'weekly'

  // Current active periods list
  const activePeriods = useMemo(() => {
    if (isWeekly && data?.weekly?.periods) {
      return data.weekly.periods
    }
    return data?.months?.slice(0, 10) || []
  }, [isWeekly, data])

  // Current active summary
  const currentSummary = useMemo(() => {
    if (isWeekly && data?.weekly?.summary) {
      return data.weekly.summary
    }
    return data?.summary
  }, [isWeekly, data])

  // Toggle product expansion in drill-down cards
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
    const pct = val > 1 ? val : val * 100
    return `${pct.toFixed(2)}%`
  }

  // Active dataset according to current tab & subMode & periodType
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

  // Current notes list
  const currentNotes = useMemo(() => {
    if (isWeekly && data?.weekly?.notes) {
      return data.weekly.notes
    }
    return data?.notes || []
  }, [isWeekly, data])

  // Map notes by product name
  const notesByProduct = useMemo(() => {
    const map = new Map<string, any[]>()
    if (!currentNotes) return map
    currentNotes.forEach((note: any) => {
      const pName = (note.product || '').toLowerCase().trim()
      // Split on delimiters if multiple products mentioned
      const targets = pName.split(/[,&/]|va|\s+и\s+/).map((t: string) => t.trim()).filter(Boolean)
      if (targets.length > 0) {
        targets.forEach((t: string) => {
          const existing = map.get(t) || []
          existing.push(note)
          map.set(t, existing)
        })
      } else {
        const existing = map.get(pName) || []
        existing.push(note)
        map.set(pName, existing)
      }
    })
    return map
  }, [currentNotes])

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

  // Trend chart data (either 10 months or 47 weeks, with quarter zoom option)
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data) return []

    if (!isWeekly) {
      // MONTHLY CHART (10 months)
      if (!data.months) return []
      return data.months.slice(0, 10).map((monthName, idx) => {
        let totalValue = 0
        if (activeTab === 'expense') {
          const totalRow = (expenseSubMode === 'sum' ? data.expenseSum : data.expenseKg).find(i => i.name === 'Всего')
          const vals: any = totalRow?.monthly || []
          totalValue = vals[idx] || 0
        } else if (activeTab === 'gp') {
          const totalRow = data.gpKg.find(i => i.name === 'Всего')
          const vals: any = totalRow?.monthly || []
          totalValue = vals[idx] || 0
        } else if (activeTab === 'waste') {
          const validWaste = data.wastePercent
            .map(w => {
              const vals: any = w.monthly || []
              return vals[idx]
            })
            .filter((v): v is number => v !== null && !isNaN(v) && v > 0)
          totalValue = validWaste.length > 0
            ? Math.round((validWaste.reduce((a, b) => a + b, 0) / validWaste.length) * 10000) / 100
            : 0
        }

        const monthNotes = data.notes.filter(n => {
          if (Array.isArray(n.monthIndex)) return n.monthIndex.includes(idx)
          return n.monthIndex === idx
        })

        return {
          label: monthName,
          shortLabel: monthName.slice(0, 3),
          value: totalValue,
          notesCount: monthNotes.length,
          notes: monthNotes
        }
      })
    } else {
      // WEEKLY CHART (47 weeks)
      if (!data.weekly?.periods) return []
      const allWeeksData = data.weekly.periods.map((periodStr, idx) => {
        let totalValue = 0
        if (activeTab === 'expense') {
          if (expenseSubMode === 'sum') {
            totalValue = data.weekly?.totals?.totalExpSumVeg?.[idx] || 0
          } else {
            totalValue = data.weekly?.totals?.totalExpKgVeg?.[idx] || 0
          }
        } else if (activeTab === 'gp') {
          totalValue = data.weekly?.totals?.totalGpKg?.[idx] || 0
        } else if (activeTab === 'waste') {
          totalValue = data.weekly?.totals?.weeklyAvgWaste?.[idx] || 0
        }

        const weekNotes = (data.weekly?.notes || []).filter(n => n.weekIndices.includes(idx))

        // Short date display e.g. "29.12 - 03.01"
        const cleanDates = periodStr.replace(/\s+/g, ' ')
        const parts = cleanDates.split('-').map(s => s.trim())
        const shortDate = parts.length === 2 ? `${parts[0].slice(0, 5)} - ${parts[1].slice(0, 5)}` : cleanDates

        return {
          weekIndex: idx + 1,
          label: `H${idx + 1} (${cleanDates})`,
          shortLabel: `H${idx + 1}`,
          shortDate,
          periodStr,
          value: totalValue,
          notesCount: weekNotes.length,
          notes: weekNotes
        }
      })

      // Filter by quarter if selected
      if (weekQuarter === 'q1') return allWeeksData.slice(0, 12)
      if (weekQuarter === 'q2') return allWeeksData.slice(12, 24)
      if (weekQuarter === 'q3') return allWeeksData.slice(24, 36)
      if (weekQuarter === 'q4') return allWeeksData.slice(36, 47)
      return allWeeksData
    }
  }, [data, isWeekly, activeTab, expenseSubMode, weekQuarter])

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
    <div className="min-h-screen bg-slate-50/70 dark:bg-dark-950 text-slate-800 dark:text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] mx-auto">
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
            {isWeekly && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                47 Hafta
              </span>
            )}
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
                  ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>{formatDual("Haftalik (47 hafta)", "По неделям (47 нед)", "Weekly (47 w)")}</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDynamicsData}
            title={formatDual("Ma'lumotlarni yangilash", "Обновить данные", "Refresh data")}
            className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors shadow-xs"
          >
            <RefreshCw size={15} />
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            title={formatDual("Chop etish", "Печать", "Print")}
            className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors shadow-xs hidden sm:block"
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
              {formatSum(currentSummary?.totalVegetableSum)} <span className="text-xs font-semibold text-slate-400">so'm</span>
            </div>
            {isWeekly ? (
              <>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{formatDual("O'rtacha haftalik xarajat", "Средненедельный расход", "Weekly average")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatSum((currentSummary as any)?.avgWeeklySpend)} / h</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{formatDual("Qadoq & Gipoxlorid bilan", "Итого с расходниками", "Grand Total")}:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatSum(currentSummary?.totalWithConsumables)} so'm</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{formatDual("Sabzavotlar xarajati", "Расход на овощи", "Vegetables only")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">12.25 mlrd</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{formatDual("Qadoq & Dezinfeksiya", "Упаковка и химия", "Boxes & Chemicals")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">477.4 mln</span>
                </div>
              </>
            )}
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
              {formatKg(currentSummary?.totalVegetableKg)}
            </div>
            {isWeekly ? (
              <>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{formatDual("O'rtacha haftalik hajm", "Средненедельный объем", "Weekly avg volume")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatKg((currentSummary as any)?.avgWeeklyVolume)} / h</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{formatDual("Gofra qutilar sarfi", "Расход гофрокоробок", "Boxes used")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{((currentSummary as any)?.totalBoxes || 0).toLocaleString()} dona</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{formatDual("Gofra qutilar sarfi", "Расход гофрокоробок", "Boxes used")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{(data?.summary?.boxCount || 0).toLocaleString()} dona</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{formatDual("Gipoxlorid sarfi", "Расход гипохлорида", "Hypochlorite")}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatKg(data?.summary?.hypoKg)}</span>
                </div>
              </>
            )}
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
              {formatKg(currentSummary?.totalFinishedGoodsKg)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Chiqim samaradorligi", "Коэффициент выхода (КПД)", "Yield Efficiency")}:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{currentSummary?.yieldEfficiency}%</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{isWeekly ? formatDual("O'rtacha haftalik GP", "Средненедельный выпуск", "Weekly Avg GP") : formatDual("O'rtacha oylik GP", "Среднемесячный выпуск", "Monthly Avg GP")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isWeekly ? formatKg((currentSummary as any)?.avgWeeklyGp) : formatKg((currentSummary?.totalFinishedGoodsKg || 0) / 10)}
              </span>
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
              {currentSummary?.avgWastePercent}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{formatDual("Boshqaruv izohlari", "Примечания руководства", "Management Notes")}:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.2 rounded-md">
                {currentSummary?.notesCount || (isWeekly ? 24 : 11)} ta anomaliya
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{formatDual("Tahlil davri", "Период анализа", "Analysis scope")}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isWeekly ? "47 Hafta (2026)" : "10 Oy (Yan—Okt)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION TABS & FILTER BAR */}
      <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/90 dark:border-dark-750 p-2 sm:p-2.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main 4 Tabs */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'expense'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Package size={15} />
              <span>1. {formatDual("Xomashyo Chiqimi (Sklad → Sex)", "Расход сырья со склада в цех", "Raw Expense")}</span>
            </button>

            <button
              onClick={() => setActiveTab('gp')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'gp'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Boxes size={15} />
              <span>2. {formatDual("Tayyor Mahsulot (GP)", "Производство готовой продукции", "Finished GP")}</span>
            </button>

            <button
              onClick={() => setActiveTab('waste')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'waste'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <AlertTriangle size={15} />
              <span>3. {formatDual("Chiqindi & Otxod (%)", "Отход продукции (%)", "Waste / Scrap %")}</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 relative ${
                activeTab === 'notes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
            >
              <Info size={15} />
              <span>4. {formatDual("Boshqaruv Izohlari", "Примечания руководства", "Executive Notes")}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'notes' ? 'bg-slate-950 text-white' : 'bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200'
              }`}>
                {currentNotes.length}
              </span>
            </button>
          </div>

          {/* Sub-Controls: Sum/Kg switch for Tab 1, Search, and Matrix/Card switch */}
          <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-dark-800">
            {/* Expense Metric Switcher (Summa / Hajm) */}
            {activeTab === 'expense' && (
              <div className="bg-slate-100 dark:bg-dark-800 p-0.5 rounded-lg flex items-center border border-slate-200 dark:border-dark-700">
                <button
                  onClick={() => setExpenseSubMode('sum')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    expenseSubMode === 'sum'
                      ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDual("Summa (so'm)", "Сумма (сум)", "Cost (UZS)")}
                </button>
                <button
                  onClick={() => setExpenseSubMode('kg')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    expenseSubMode === 'kg'
                      ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDual("Hajm (kg)", "Объем (кг)", "Volume (kg)")}
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={formatDual("Mahsulot qidirish...", "Поиск продукции...", "Search product...")}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 w-36 sm:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Expand / Collapse All buttons */}
            {activeTab !== 'notes' && viewStyle === 'cards' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  title={formatDual("Hammasini yoyish", "Раскрыть все", "Expand all")}
                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-750"
                >
                  {formatDual("Yoyish", "Все +", "Expand")}
                </button>
                <button
                  onClick={collapseAll}
                  title={formatDual("Hammasini yig'ish", "Свернуть все", "Collapse all")}
                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-750"
                >
                  {formatDual("Yig'ish", "Все -", "Collapse")}
                </button>
              </div>
            )}

            {/* View Style Switcher: Cards vs Matrix */}
            {activeTab !== 'notes' && (
              <div className="bg-slate-100 dark:bg-dark-800 p-0.5 rounded-lg flex items-center border border-slate-200 dark:border-dark-700">
                <button
                  onClick={() => setViewStyle('cards')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    viewStyle === 'cards'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDual("Drill-Down", "Карточки", "Cards")}
                </button>
                <button
                  onClick={() => setViewStyle('matrix')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    viewStyle === 'matrix'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDual("Matritsa", "Матрица", "Matrix")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. EXECUTIVE TREND CHART (Monthly or Weekly) */}
      {activeTab !== 'notes' && chartData.length > 0 && (
        <div className="bg-white dark:bg-dark-900/90 rounded-2xl border border-slate-200/90 dark:border-dark-750 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className={activeTab === 'waste' ? "text-amber-500" : "text-emerald-500"} />
                <span>
                  {activeTab === 'expense'
                    ? (expenseSubMode === 'sum' 
                        ? (isWeekly ? formatDual("Haftalik Xomashyo Xarajatlari Dinamikasi (So'm)", "Недельная динамика расходов на сырье (сум)", "Weekly Raw Cost (UZS)") : formatDual("Oylik Xomashyo Xarajatlari Dinamikasi (So'm)", "Динамика расходов на сырье по месяцам (сум)", "Monthly Raw Materials Cost (UZS)"))
                        : (isWeekly ? formatDual("Haftalik Xomashyo Chiqimi Dinamikasi (Kg)", "Недельная динамика расхода сырья (кг)", "Weekly Raw Volume (kg)") : formatDual("Oylik Xomashyo Chiqimi Dinamikasi (Kg)", "Динамика расхода сырья по месяцам (кг)", "Monthly Raw Materials Volume (kg)")))
                    : activeTab === 'gp'
                    ? (isWeekly ? formatDual("Haftalik Tayyor Mahsulot Chiqarilishi (GP, Kg)", "Недельная динамика выпуска готовой продукции (кг)", "Weekly Finished Goods (kg)") : formatDual("Oylik Tayyor Mahsulot Chiqarilishi (Kg)", "Динамика выпуска готовой продукции (кг)", "Monthly Finished Goods Output (kg)"))
                    : (isWeekly ? formatDual("Haftalik O'rtacha Chiqindi Foizi (% Otxod)", "Недельный процент отходов (%)", "Weekly Scrap Rate (%)") : formatDual("Oylik O'rtacha Chiqindi Foizi (% Otxod)", "Динамика процента отходов (%)", "Monthly Average Scrap Rate (%)"))}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isWeekly
                  ? formatDual("47 haftalik dinamika, korxona aksiyalari va anomaliyalar", "Недельная динамика за 47 недель с примечаниями", "47-week performance trend with annotations")
                  : formatDual("10 oylik umumiy tendensiya va anomaliyalar", "Общая тенденция за 10 месяцев с примечаниями", "10-month trend curve with contextual anomalies")}
              </p>
            </div>

            {/* Quarter Filter when Weekly mode is active */}
            {isWeekly && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setWeekQuarter('all')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    weekQuarter === 'all'
                      ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDual("Barchasi (47 h)", "Все (47)", "All")}
                </button>
                <button
                  onClick={() => setWeekQuarter('q1')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    weekQuarter === 'q1'
                      ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Q1 (1-12)
                </button>
                <button
                  onClick={() => setWeekQuarter('q2')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    weekQuarter === 'q2'
                      ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Q2 (13-24)
                </button>
                <button
                  onClick={() => setWeekQuarter('q3')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    weekQuarter === 'q3'
                      ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Q3 (25-36)
                </button>
                <button
                  onClick={() => setWeekQuarter('q4')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    weekQuarter === 'q4'
                      ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Q4 (37-47)
                </button>
              </div>
            )}
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={activeTab === 'waste' ? '#f59e0b' : isWeekly ? '#3b82f6' : '#10b981'}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={activeTab === 'waste' ? '#f59e0b' : isWeekly ? '#3b82f6' : '#10b981'}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={isWeekly && weekQuarter === 'all' ? 2 : 0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
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
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-sm border border-slate-700">
                          <div className="font-extrabold text-sm border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                            <span>{p.label || p.periodStr}</span>
                            {p.notesCount > 0 && (
                              <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                {p.notesCount} ta izoh
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-emerald-400 font-black text-base">
                            {activeTab === 'waste'
                              ? `${p.value}%`
                              : activeTab === 'expense' && expenseSubMode === 'sum'
                              ? `${formatSum(p.value)} so'm`
                              : `${formatKg(p.value)}`}
                          </div>
                          {p.notes?.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-300 space-y-1">
                              <span className="font-bold flex items-center gap-1">
                                <AlertTriangle size={11} /> Boshqaruv xulosasi:
                              </span>
                              <div className="leading-relaxed">
                                {directorLang === 'ru' ? p.notes[0].textRu : p.notes[0].textUz}
                              </div>
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
                  stroke={activeTab === 'waste' ? '#f59e0b' : isWeekly ? '#3b82f6' : '#10b981'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. TAB 4: DEDICATED MANAGEMENT NOTES (Примечания) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  {isWeekly
                    ? formatDual(
                        "Haftalik Boshqaruv Hisobotlari va Izohlar (24 ta Prilojenie)",
                        "Недельные примечания руководства к отклонениям (24 примечания)",
                        "Weekly Executive Annotations to Production Variances"
                      )
                    : formatDual(
                        "Oylik Boshqaruv Hisobotlari va Izohlar (11 ta Prilojenie)",
                        "Месячные примечания руководства к отклонениям (11 примечаний)",
                        "Monthly Executive Annotations to Operational Anomalies"
                      )}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300/90 mt-0.5">
                  {formatDual(
                    "Ushbu izohlar me'yordan og'ishlar, Eron aysbergi defitsiti, yozgi issiq, brak mahsulotlar va xomashyo narxlarini tushuntirib beradi.",
                    "Данные примечания объясняют отклонения от норм, дефицит иранского айсберга, летнюю жару, брак и ценовые колебания.",
                    "These annotations document underlying causes: climate, market deficits, re-batching, and seasonal density variances."
                  )}
                </p>
              </div>
            </div>

            {/* Note category filter */}
            <div className="flex items-center gap-1.5 self-start">
              <button
                onClick={() => setNotesCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  notesCategoryFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700'
                }`}
              >
                {formatDual("Barchasi", "Все", "All")} ({currentNotes.length})
              </button>
              <button
                onClick={() => setNotesCategoryFilter('waste')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  notesCategoryFilter === 'waste'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700'
                }`}
              >
                {formatDual("Otxod & Chiqindi", "Отходы", "Scrap")}
              </button>
              <button
                onClick={() => setNotesCategoryFilter('expense')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  notesCategoryFilter === 'expense'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700'
                }`}
              >
                {formatDual("Chiqim & Sarf", "Расходы", "Expense")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentNotes
              .filter(note => {
                if (notesCategoryFilter === 'waste') return note.category === 'waste'
                if (notesCategoryFilter === 'expense') return note.category === 'expense' || note.category === 'cost'
                if (searchQuery) {
                  const q = searchQuery.toLowerCase().trim()
                  return (
                    note.product.toLowerCase().includes(q) ||
                    note.titleUz.toLowerCase().includes(q) ||
                    note.titleRu.toLowerCase().includes(q) ||
                    note.textUz.toLowerCase().includes(q) ||
                    note.textRu.toLowerCase().includes(q)
                  )
                }
                return true
              })
              .map((note: any) => {
                const isWaste = note.category === 'waste'
                const isCost = note.category === 'cost'
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteModal(note)}
                    className={`bg-white dark:bg-dark-900 rounded-2xl border p-4 shadow-xs relative overflow-hidden transition-all hover:shadow-md cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 ${
                      isWaste
                        ? 'border-amber-200/90 dark:border-amber-500/30'
                        : isCost
                        ? 'border-rose-200/90 dark:border-rose-500/30'
                        : 'border-blue-200/90 dark:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full inline-block ${isWaste ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        {note.product}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${
                        isWaste
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : isCost
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {note.period || note.monthName}
                      </span>
                    </div>

                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-1">
                      {directorLang === 'ru' ? note.titleRu : note.titleUz}
                    </h5>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {directorLang === 'ru' ? note.textRu : note.textUz}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      <span>{formatDual("To'liq o'qish", "Подробнее", "Read details")} →</span>
                      {note.weekIndices && (
                        <span className="text-[10px] text-slate-400">
                          {note.weekIndices.length} ta haftaga taalluqli
                        </span>
                      )}
                    </div>
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
              {formatDual("Tafsilotlarni ko'rish uchun mahsulot qatorini bosing (Drill-Down)", "Нажмите на строку для раскрытия динамики", "Click on any product to drill down")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentProductsList.map((item: any) => {
              const isExpanded = Boolean(expandedProducts[item.name])
              const notes = notesByProduct.get(item.name.toLowerCase().trim()) || []
              const hasNotes = notes.length > 0
              const unit = item.unit || (activeTab === 'waste' ? '%' : expenseSubMode === 'sum' ? 'сум' : 'кг')

              // Values array (monthly or weekly)
              const rawValues: (number | null)[] = isWeekly ? (item.weekly || []) : (item.monthly || [])
              const displayValues = isWeekly ? rawValues : rawValues.slice(0, 10)

              // Totals and averages
              const validNumbers = displayValues.filter((v): v is number => v !== null && !isNaN(v) && v > 0)
              const sumVal = validNumbers.reduce((a, b) => a + b, 0)
              const avgVal = item.weeklyAvg ?? (validNumbers.length > 0 ? sumVal / validNumbers.length : 0)
              const totalVal = item.total ?? sumVal

              const isTotalRow = item.name.includes('Всего') || item.name.includes('Итого')

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
                    <div className="flex items-center gap-3 min-w-[220px]">
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
                          <span>
                            {isWeekly
                              ? formatDual("Haftalik o'rtacha", "Средненедельное", "Weekly avg")
                              : formatDual("10 oylik o'rtacha", "Среднее за 10 мес", "10-mo avg")}:{' '}
                            <strong>
                              {activeTab === 'waste'
                                ? formatPercent(avgVal)
                                : activeTab === 'expense' && expenseSubMode === 'sum'
                                ? `${formatSum(avgVal)} so'm`
                                : formatKg(avgVal)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Sparkline Mini-bar visualization */}
                    <div className="hidden sm:flex items-center gap-1 flex-1 max-w-xs md:max-w-md mx-2 h-7">
                      {displayValues.map((val: any, vIdx: number) => {
                        const numericVal = val || 0
                        const heightPct = validNumbers.length > 0 && Math.max(...validNumbers) > 0
                          ? Math.min(100, Math.max(12, (numericVal / Math.max(...validNumbers)) * 100))
                          : 12
                        const isHighWaste = activeTab === 'waste' && (numericVal > 30 || numericVal > 0.3)
                        return (
                          <div
                            key={vIdx}
                            title={`${activePeriods[vIdx] || `H${vIdx+1}`}: ${activeTab === 'waste' ? formatPercent(val) : val}`}
                            className="flex-1 h-full flex items-end justify-center group/bar relative"
                          >
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-xs transition-all ${
                                isHighWaste
                                  ? 'bg-amber-500 dark:bg-amber-400'
                                  : isTotalRow
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300 dark:bg-dark-700 group-hover/bar:bg-emerald-500'
                              }`}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Right: Total Value & Expand Icon */}
                    <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                          {activeTab === 'waste'
                            ? formatPercent(avgVal)
                            : activeTab === 'expense' && expenseSubMode === 'sum'
                            ? `${formatSum(totalVal)} so'm`
                            : formatKg(totalVal)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {activeTab === 'waste'
                            ? formatDual("O'rtacha chiqindi", "Средний отход", "Average scrap")
                            : isWeekly
                            ? formatDual("47 haftalik jami", "Всего за 47 нед", "47-week total")
                            : formatDual("10 oylik jami", "Всего за 10 мес", "10-month total")}
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                        isExpanded ? 'bg-slate-100 dark:bg-dark-800 rotate-180' : 'text-slate-400'
                      }`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Drill-down Dossier */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-dark-800 bg-slate-50/60 dark:bg-dark-950/60 p-4 space-y-3">
                      {/* Contextual Management Notes Banner if available for this product */}
                      {hasNotes && (
                        <div className="space-y-1.5">
                          {notes.map((note, nIdx) => (
                            <div
                              key={nIdx}
                              onClick={() => setSelectedNoteModal(note)}
                              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2 cursor-pointer hover:bg-amber-100/60 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-extrabold">
                                    {note.period || note.monthName}: {directorLang === 'ru' ? note.titleRu : note.titleUz}
                                  </div>
                                  <div className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                                    {directorLang === 'ru' ? note.textRu : note.textUz}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 underline flex-shrink-0">
                                {formatDual("Batafsil", "Подробнее", "Details")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Periods Grid / Matrix */}
                      <div>
                        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>
                            {isWeekly
                              ? formatDual("Haftalar kesimidagi ko'rsatkichlar", "Понедельные показатели", "Weekly breakdown")
                              : formatDual("Oylar kesimidagi ko'rsatkichlar", "Помесячные показатели", "Monthly breakdown")}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {displayValues.length} {isWeekly ? "ta hafta" : "ta oy"}
                          </span>
                        </div>

                        <div className={`grid gap-2 ${
                          isWeekly
                            ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
                            : 'grid-cols-2 sm:grid-cols-5 md:grid-cols-10'
                        }`}>
                          {displayValues.map((val: any, pIdx: number) => {
                            const pName = activePeriods[pIdx] || (isWeekly ? `H${pIdx+1}` : `M${pIdx+1}`)
                            const isHighWaste = activeTab === 'waste' && (val > 30 || val > 0.3)
                            
                            // Check if this week or month has a note
                            const periodHasNote = notes.some((n: any) => {
                              if (isWeekly) return n.weekIndices?.includes(pIdx)
                              return Array.isArray(n.monthIndex) ? n.monthIndex.includes(pIdx) : n.monthIndex === pIdx
                            })

                            return (
                              <div
                                key={pIdx}
                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                  periodHasNote
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 ring-1 ring-amber-400/30'
                                    : isHighWaste
                                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                                    : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800'
                                }`}
                              >
                                <div className="text-[10px] text-slate-400 font-bold truncate" title={pName}>
                                  {isWeekly ? `H${pIdx+1}` : pName.slice(0, 3)}
                                </div>
                                <div className={`text-xs font-black font-mono mt-1 ${
                                  isHighWaste ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {activeTab === 'waste'
                                    ? formatPercent(val)
                                    : activeTab === 'expense' && expenseSubMode === 'sum'
                                    ? formatSum(val)
                                    : val ? Math.round(val * 10) / 10 : '0'}
                                </div>
                                {periodHasNote && (
                                  <div className="mt-1 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase">
                                    ⚠️ Izoh
                                  </div>
                                )}
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

      {/* 7. FULL MATRIX SPREADSHEET VIEW */}
      {activeTab !== 'notes' && viewStyle === 'matrix' && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={16} className="text-emerald-500" />
              <span>
                {isWeekly
                  ? formatDual("47 Haftalik To'liq Matritsa Jadvali", "Полная понедельная матрица (47 недель)", "Full 47-Week Matrix Table")
                  : formatDual("10 Oylik To'liq Matritsa Jadvali", "Полная помесячная матрица (10 месяцев)", "Full 10-Month Matrix Table")}
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {formatDual("Gorizontal o'tkazish orqali barcha davrlarni ko'ring", "Прокрутите таблицу по горизонтали", "Scroll horizontally")}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] rounded-xl border border-slate-200 dark:border-dark-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
                <tr className="border-b border-slate-200 dark:border-dark-700">
                  <th className="p-3 sticky left-0 z-30 bg-slate-100 dark:bg-dark-800 min-w-[200px] border-r border-slate-200 dark:border-dark-700">
                    {formatDual("Mahsulot", "Наименование", "Product")}
                  </th>
                  <th className="p-3 text-center min-w-[60px]">{formatDual("Birlik", "Ед.", "Unit")}</th>
                  {activePeriods.map((p, idx) => (
                    <th key={idx} className="p-3 text-right min-w-[110px]" title={p}>
                      {isWeekly ? `H${idx+1}` : p.slice(0, 3)}
                    </th>
                  ))}
                  <th className="p-3 text-right min-w-[130px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                    {formatDual("Jami / O'rtacha", "Итого", "Total")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-mono">
                {currentProductsList.map((item: any) => {
                  const rawValues: (number | null)[] = isWeekly ? (item.weekly || []) : (item.monthly || [])
                  const displayValues = isWeekly ? rawValues : rawValues.slice(0, 10)
                  const unit = item.unit || (activeTab === 'waste' ? '%' : expenseSubMode === 'sum' ? 'сум' : 'кг')
                  const isTotalRow = item.name.includes('Всего') || item.name.includes('Итого')
                  const validNumbers = displayValues.filter((v): v is number => v !== null && !isNaN(v) && v > 0)
                  const sumVal = validNumbers.reduce((a, b) => a + b, 0)
                  const avgVal = item.weeklyAvg ?? (validNumbers.length > 0 ? sumVal / validNumbers.length : 0)
                  const totalVal = item.total ?? sumVal

                  return (
                    <tr
                      key={item.name}
                      className={`hover:bg-slate-50 dark:hover:bg-dark-800/40 ${
                        isTotalRow ? 'bg-emerald-50/30 dark:bg-emerald-500/5 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 sticky left-0 z-10 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 font-sans font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="p-3 text-center text-slate-400 font-sans">{unit}</td>
                      {displayValues.map((val: any, idx: number) => {
                        const isHighWaste = activeTab === 'waste' && (val > 30 || val > 0.3)
                        return (
                          <td
                            key={idx}
                            className={`p-3 text-right ${
                              isHighWaste ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-500/10' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {activeTab === 'waste'
                              ? formatPercent(val)
                              : activeTab === 'expense' && expenseSubMode === 'sum'
                              ? formatSum(val)
                              : val ? Math.round(val * 10) / 10 : 0}
                          </td>
                        )
                      })}
                      <td className="p-3 text-right font-black bg-emerald-50/30 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-300">
                        {activeTab === 'waste'
                          ? formatPercent(avgVal)
                          : activeTab === 'expense' && expenseSubMode === 'sum'
                          ? `${formatSum(totalVal)}`
                          : formatKg(totalVal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. MODAL FOR NOTE / INSIGHT DETAILS */}
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
                    {selectedNoteModal.product} · {selectedNoteModal.period || selectedNoteModal.monthName}
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
              <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-amber-600" />
                <span>{directorLang === 'ru' ? "Примечание руководства:" : "Boshqaruv xulosasi va izohi:"}</span>
              </div>
              {directorLang === 'ru' ? selectedNoteModal.textRu : selectedNoteModal.textUz}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-dark-800">
              <span>{formatDual("Holat", "Статус", "Status")}: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatDual("Tasdiqlangan", "Утверждено", "Confirmed")}</strong></span>
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800"
              >
                {formatDual("Tushundim", "Понятно", "Understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

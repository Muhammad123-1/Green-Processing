'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Package,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  Clock,
  Sparkles,
  Info,
  Scale,
  FileText,
  Boxes,
  Truck,
  UserCheck,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { AbcProductItem } from '@/app/api/warehouse/abc-analysis/route'

export default function AbcInventoryAnalysis() {
  const { lang, formatDirector } = useLanguage()
  const formatDual = formatDirector

  // Period & Filter State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [boundaryA, setBoundaryA] = useState(80)
  const [boundaryB, setBoundaryB] = useState(95)
  const [showConfig, setShowConfig] = useState(false)

  // Data & Loading State
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Table Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'U'>('ALL')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'DEFICIT' | 'EXCESS' | 'EXPIRING' | 'OPTIMAL'>('ALL')
  const [sortField, setSortField] = useState<keyof AbcProductItem>('consumptionValue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Drill-down State (Level 2 & 3 Modal)
  const [selectedProduct, setSelectedProduct] = useState<AbcProductItem | null>(null)
  const [drillTab, setDrillTab] = useState<'overview' | 'acts' | 'batches'>('overview')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('period', period)
      if (period === 'custom') {
        if (customFrom) params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }
      params.set('boundaryA', String(boundaryA))
      params.set('boundaryB', String(boundaryB))

      const res = await fetch(`/api/warehouse/abc-analysis?${params.toString()}`)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Server xatoligi')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error('ABC Analysis load error:', err)
      setError(err?.message || 'Ma\'lumotlarni yuklab bo\'lmadi')
      toast.error('ABC Tahlili yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [period, customFrom, customTo, boundaryA, boundaryB])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered and Sorted Table List
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    let list: AbcProductItem[] = [...data.products]

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.nameUz.toLowerCase().includes(q) ||
          p.nameRu.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.canonicalId.toLowerCase().includes(q)
      )
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      list = list.filter((p) => p.abcCategory === categoryFilter)
    }

    // 3. Risk Filter
    if (riskFilter !== 'ALL') {
      list = list.filter((p) => p.riskStatus === riskFilter)
    }

    // 4. Sorting
    list.sort((a, b) => {
      let aVal = a[sortField] ?? 0
      let bVal = b[sortField] ?? 0

      if (typeof aVal === 'string') aVal = (aVal as string).toLowerCase()
      if (typeof bVal === 'string') bVal = (bVal as string).toLowerCase()

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [data?.products, searchQuery, categoryFilter, riskFilter, sortField, sortOrder])

  const handleSort = (field: keyof AbcProductItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Formatters
  const fmtSum = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '0 so\'m'
    return `${Math.round(val).toLocaleString()} so'm`
  }

  const fmtQty = (val: number | null | undefined, unit = 'kg') => {
    if (val === null || val === undefined || isNaN(val)) return `0 ${unit}`
    return `${val.toLocaleString()} ${unit}`
  }

  const getCategoryBadge = (cat: 'A' | 'B' | 'C' | 'U') => {
    switch (cat) {
      case 'A':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            A (80%)
          </span>
        )
      case 'B':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            B (15%)
          </span>
        )
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            C (5%)
          </span>
        )
      case 'U':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Noma'lum
          </span>
        )
    }
  }

  const getRiskBadge = (status: AbcProductItem['riskStatus']) => {
    switch (status) {
      case 'DEFICIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <AlertOctagon size={12} /> {formatDual("Kamomad (Defitsit)", "Дефицит", "Deficit")}
          </span>
        )
      case 'EXCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Scale size={12} /> {formatDual("Ortiqcha zaxira", "Излишек", "Excess Stock")}
          </span>
        )
      case 'EXPIRING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <Clock size={12} /> {formatDual("Muddati yaqin", "Срок истекает", "Expiring Soon")}
          </span>
        )
      case 'OPTIMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={12} /> {formatDual("Me'yorda", "Оптимально", "Optimal")}
          </span>
        )
      case 'NO_DATA':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-dark-800 text-slate-500 border border-slate-200 dark:border-dark-700">
            {formatDual("Harakatsiz", "Без движения", "No Movement")}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER & PERIOD FILTER CONTROLS */}
      <div className="bg-white dark:bg-dark-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Pareto 80/20 & Capital Allocation
              </span>
              <span className="text-xs text-slate-400">
                {data?.meta?.dataFreshness || "Jonli ERP ma'lumotlari"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="text-emerald-500" size={24} />
              {formatDual("Ombor Xomashyolari ABC Tahlili", "ABC-Анализ Запасов Сырья", "ABC Inventory Analysis")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {formatDual(
                "Mablag'larning asosiy qismini band qilgan strategik mahsulotlarni aniqlash, xavfsiz zaxira va muzlatilgan aylanma kapitalni operativ boshqarish.",
                "Выявление стратегических позиций, потребляющих львиную долю финансовых ресурсов компании.",
                "Identify high-value inventory driving the bulk of capital allocation and operational risk."
              )}
            </p>
          </div>

          {/* Period and Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
              {(['all', 'year', 'month', 'week', 'today', 'custom'] as const).map((pKey) => {
                const label =
                  pKey === 'all'
                    ? formatDual('Barchasi', 'Все', 'All')
                    : pKey === 'year'
                    ? formatDual('Yillik', 'Год', 'Year')
                    : pKey === 'month'
                    ? formatDual('Oylik', 'Месяц', 'Month')
                    : pKey === 'week'
                    ? formatDual('Hafta', 'Неделя', 'Week')
                    : pKey === 'today'
                    ? formatDual('Bugun', 'Сегодня', 'Today')
                    : formatDual('Maxsus', 'Выбор', 'Custom')

                return (
                  <button
                    key={pKey}
                    onClick={() => setPeriod(pKey)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      period === pKey
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                showConfig
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/40'
                  : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50'
              }`}
              title="ABC chegaralarini sozlash"
            >
              <Sliders size={15} />
              <span className="hidden sm:inline">{formatDual("Chegaralar", "Пороги", "Limits")}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm disabled:opacity-50"
              title="Yangilash"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Configurable Boundaries Drawer */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-dark-750 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
            <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                A-Toifa Chegarasi (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="90"
                  value={boundaryA}
                  onChange={(e) => setBoundaryA(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-xs font-bold"
                />
                <span className="text-slate-500">Standart: 80%</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                B-Toifa Chegarasi (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="80"
                  max="99"
                  value={boundaryB}
                  onChange={(e) => setBoundaryB(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-xs font-bold"
                />
                <span className="text-slate-500">Standart: 95%</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kategoriya qoidasi:
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                80% chegarasini kesib o'tgan birinchi mahsulot to'liq A toifaga kiritiladi (Pareto qoidasi).
              </p>
            </div>
          </div>
        )}

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-dark-750 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Sanalar oralig'i:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-xs font-medium"
            />
            <span>—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-xs font-medium"
            />
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
            >
              Qo'llash
            </button>
          </div>
        )}
      </div>

      {/* 2. EXECUTIVE 8-KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Consumption Value */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatDual("Jami Sarf Qiymati", "Расход сырья", "Total Consumption Value")}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
            {fmtSum(data?.kpis?.totalInventoryConsumptionValue)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Faktik sarflangan xomashyolar", "Фактически списано в цех", "Real materials consumed")}
          </p>
        </div>

        {/* KPI 2: Current Inventory Value */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatDual("Joriy Ombor Qiymati", "Стоимость склада", "Current Stock Value")}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {fmtSum(data?.kpis?.totalCurrentInventoryValue)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Omborda yaroqli qoldiq", "Доступный остаток на складе", "Available accepted stock")}
          </p>
        </div>

        {/* KPI 3: Category A Share */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatDual("A-Toifa Ulushi", "Доля категории A", "Category A Share")}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400">
            {data?.kpis?.categoryASharePercent ?? 0}%
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {data?.kpis?.counts?.categoryA ?? 0} {formatDual("ta strategik mahsulot", "стратегических позиций", "strategic items")}
          </p>
        </div>

        {/* KPI 4: Category Counts */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatDual("ABC Toifalar Soni", "Структура ABC", "Category Counts")}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers size={16} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-xs">
              A: {data?.kpis?.counts?.categoryA ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black text-xs">
              B: {data?.kpis?.counts?.categoryB ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-750 text-slate-700 dark:text-slate-300 font-black text-xs">
              C: {data?.kpis?.counts?.categoryC ?? 0}
            </span>
          </div>
        </div>

        {/* KPI 5: Category A Below Safety Stock (Critical) */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {formatDual("Kritik Kamomad (A)", "Дефицит в кат. A", "Category A Deficit")}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <AlertOctagon size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-rose-600">
            {data?.kpis?.highValueBelowSafetyStockCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-1">
            {formatDual("Xavfsiz zaxiradan kam", "Ниже страхового запаса", "Below Safety Stock")}
          </p>
        </div>

        {/* KPI 6: Excess Financial Exposure */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {formatDual("Muzlatilgan Mablag'", "Замороженный капитал", "Excess Exposure")}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Scale size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-amber-600 truncate">
            {fmtSum(data?.kpis?.totalExcessFinancialExposure)}
          </h3>
          <p className="text-[11px] text-amber-600/80 mt-1">
            {formatDual("Maksimal me'yordan ortiq", "Сверх лимита хранения", "Above max ceiling")}
          </p>
        </div>

        {/* KPI 7: Approaching Storage Limit */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {formatDual("Buzilish Xavfi (Muddati)", "Риск порчи сырья", "Expiring Batches")}
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
              <Clock size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-orange-600">
            {data?.kpis?.highValueApproachingLimitsCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-orange-600/80 mt-1">
            {formatDual("Muddatining 80% dan o'tgan", ">80% срока годности", ">80% holding limit")}
          </p>
        </div>

        {/* KPI 8: Missing Cost Records */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatDual("Narxi Belgilanmagan", "Без цены", "Missing Cost")}
            </span>
            <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <Info size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300">
            {data?.kpis?.unclassifiedMissingCostCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Buxgalteriya hujjati kutilmoqda", "Требуется ввод цены", "Audit required")}
          </p>
        </div>
      </div>

      {/* 3. INTELLIGENT ALERTS BANNER */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={18} />
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-300">
              {formatDual("Direktor va Ombor Uchun Tezkor Xavf Ogohlantirishlari", "Оперативные риски для руководства", "Executive Operational Risk Alerts")}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.alerts.slice(0, 3).map((al: any) => (
              <div
                key={al.id}
                className="bg-white dark:bg-dark-850 p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/30 text-xs shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      {al.productName}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      al.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {al.severity}
                    </span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 dark:text-white mb-1">
                    {lang === 'ru' ? al.titleRu : lang === 'en' ? al.titleEn : al.titleUz}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lang === 'ru' ? al.descRu : lang === 'en' ? al.descEn : al.descUz}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-dark-750 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} />
                  <span>Tavsiya: {al.actionUz}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto Chart: Cumulative % + Value (Col-span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                {formatDual("ABC Pareto Egri Chizig'i va Sarf Taqsimoti", "Кривая Парето ABC и расход", "ABC Pareto Curve & Value")}
              </h3>
              <p className="text-xs text-slate-400">
                {formatDual("80% va 95% chegara chiziqlari bilan", "С линиями отсечения 80% и 95%", "With 80% and 95% cut-off thresholds")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-500">Sarf Qiymati (so'm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-rose-500 inline-block" />
                <span className="text-slate-500">Kumulyativ %</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {data?.charts?.paretoChartData && data.charts.paretoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.charts.paretoChartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    stroke="#f43f5e"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const it = payload[0].payload
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                            <p className="font-extrabold text-emerald-400">{it.name}</p>
                            <p>Toifa: <span className="font-bold text-amber-400">{it.category}</span></p>
                            <p>Sarf: <span className="font-bold">{fmtSum(it.consumptionValue)}</span></p>
                            <p>Birlik narxi: <span className="font-bold">{fmtSum(it.unitCost)} / kg</span></p>
                            <p>Kumulyativ ulush: <span className="font-bold text-rose-400">{it.cumulativePercent}%</span></p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="consumptionValue"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativePercent"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f43f5e' }}
                  />
                  <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'A: 80%', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine yAxisId="right" y={95} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'B: 95%', fill: '#3b82f6', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pareto ma'lumotlari mavjud emas
              </div>
            )}
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon size={16} className="text-purple-500" />
              {formatDual("ABC Toifalar Taqsimoti", "Структура категорий", "Category Distribution")}
            </h3>
            <p className="text-xs text-slate-400">
              {formatDual("Aylanma mablag'dagi ulushi", "Доля в общем обороте", "Share of inventory spend")}
            </p>
          </div>

          <div className="h-[200px] w-full relative flex items-center justify-center">
            {data?.charts?.categoryDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.categoryDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.charts.categoryDistribution.map((entry: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => fmtSum(Number(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="absolute text-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-white block">
                {data?.kpis?.categoryASharePercent ?? 80}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">A-Toifa</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-750 text-xs">
            {data?.charts?.categoryDistribution?.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{c.label}</span>
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {c.share}% <span className="text-[10px] text-slate-400">({c.count} ta)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. PRODUCT ANALYSIS TABLE */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {formatDual("Xomashyolar Bo'yicha ABC Tahliliy Jadvali", "Аналитическая таблица запасов ABC", "ABC Inventory Breakdown Table")}
            </h3>
            <p className="text-xs text-slate-400">
              Jami: {filteredProducts.length} ta mahsulot saralangan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Mahsulot nomi bo'yicha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl text-xs font-bold">
              {(['ALL', 'A', 'B', 'C', 'U'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Barchasi' : cat}
                </button>
              ))}
            </div>

            {/* Risk Filter Select */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Barcha Xavf Holatlari</option>
              <option value="DEFICIT">Kamomad (Defitsit)</option>
              <option value="EXCESS">Ortiqcha Zaxira</option>
              <option value="EXPIRING">Muddati Yaqin</option>
              <option value="OPTIMAL">Me'yorda</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-dark-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">№</th>
                <th
                  onClick={() => handleSort('nameUz')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Mahsulot Nomi</span>
                    {sortField === 'nameUz' && (sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('abcCategory')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Toifa
                </th>
                <th
                  onClick={() => handleSort('consumedQty')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Sarf Miqdori
                </th>
                <th
                  onClick={() => handleSort('unitCost')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Birlik Narxi
                </th>
                <th
                  onClick={() => handleSort('consumptionValue')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Sarf Qiymati
                </th>
                <th
                  onClick={() => handleSort('percentageContribution')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Ulushi %
                </th>
                <th
                  onClick={() => handleSort('cumulativeContribution')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Kumulyativ %
                </th>
                <th
                  onClick={() => handleSort('availableStock')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Yaroqli Qoldiq
                </th>
                <th
                  onClick={() => handleSort('stockCoverageWeeks')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  Qoplash (Hafta)
                </th>
                <th className="py-3 px-3 text-center">Xavf Holati</th>
                <th className="py-3 px-3 text-center">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    Mos keluvchi mahsulotlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {p.nameUz}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.nameRu} • {p.unit}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">{getCategoryBadge(p.abcCategory)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {fmtQty(p.consumedQty, p.unit)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                      {p.unitCost ? (
                        <div>
                          <span>{fmtSum(p.unitCost)}</span>
                          {p.isCostEstimated && (
                            <span className="block text-[9px] text-amber-500 font-bold">katalog</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Mavjud emas</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                      {fmtSum(p.consumptionValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {p.percentageContribution}%
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{p.cumulativeContribution}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-dark-750 overflow-hidden">
                          <div
                            className={`h-full ${
                              p.cumulativeContribution <= 80
                                ? 'bg-emerald-500'
                                : p.cumulativeContribution <= 95
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, p.cumulativeContribution)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                      {fmtQty(p.availableStock, p.unit)}
                      {p.blockedStock > 0 && (
                        <span className="block text-[10px] text-rose-500 font-bold">
                          +{p.blockedStock} {p.unit} bloklangan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {p.stockCoverageWeeks !== null ? `${p.stockCoverageWeeks} hf` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">{getRiskBadge(p.riskStatus)}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-bold flex items-center gap-1 mx-auto"
                      >
                        <Eye size={12} />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. LEVEL 2 & 3 DRILL-DOWN MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-sm">
                  {selectedProduct.abcCategory}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProduct.nameUz}
                    </h3>
                    {getCategoryBadge(selectedProduct.abcCategory)}
                    {getRiskBadge(selectedProduct.riskStatus)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedProduct.nameRu} ({selectedProduct.nameEn}) • ID: {selectedProduct.canonicalId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-dark-750 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 dark:border-dark-800 flex items-center gap-3 bg-white dark:bg-dark-900 text-xs font-bold">
              <button
                onClick={() => setDrillTab('overview')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'overview'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Info size={14} />
                <span>2-Daraja: Zaxira & Moliyaviy Tahlil</span>
              </button>
              <button
                onClick={() => setDrillTab('acts')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'acts'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText size={14} />
                <span>3-Daraja: Birlamchi Aktlar ({selectedProduct.recentActs.length})</span>
              </button>
              <button
                onClick={() => setDrillTab('batches')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'batches'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Boxes size={14} />
                <span>3-Daraja: Partiyalar & FIFO ({selectedProduct.batches.length})</span>
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {drillTab === 'overview' && (
                <div className="space-y-4">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-750">
                      <span className="text-slate-400 block mb-1">Faktik Sarf Qiymati:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {fmtSum(selectedProduct.consumptionValue)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-750">
                      <span className="text-slate-400 block mb-1">Joriy Zaxira Qiymati:</span>
                      <span className="text-sm font-black text-emerald-600">
                        {fmtSum(selectedProduct.currentStockValue)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-750">
                      <span className="text-slate-400 block mb-1">Xavfsiz Zaxira Normasi:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {fmtQty(selectedProduct.safetyStock, selectedProduct.unit)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-750">
                      <span className="text-slate-400 block mb-1">Maksimal Saqlash Chegarasi:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedProduct.maxStorageDays ? `${selectedProduct.maxStorageDays} kun` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Stock Balance Distribution */}
                  <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      Ombor Balansi va Ta'minot Quvvati:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Yaroqli Qoldiq:</span>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {fmtQty(selectedProduct.availableStock, selectedProduct.unit)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">O'rtacha Haftalik Sarf:</span>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {selectedProduct.avgWeeklyConsumption ? `${selectedProduct.avgWeeklyConsumption} ${selectedProduct.unit}/hafta` : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Zaxira Qoplash Muddati:</span>
                        <p className="font-extrabold text-emerald-600 text-sm">
                          {selectedProduct.stockCoverageWeeks !== null ? `${selectedProduct.stockCoverageWeeks} hafta` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Excess & Financial Risk */}
                  {selectedProduct.excessFinancialExposure > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs">
                      <div className="flex items-center gap-2 mb-1 text-amber-700 dark:text-amber-400 font-bold">
                        <AlertTriangle size={15} />
                        <span>Muzlatilgan Aylanma Mablag' Ogohlantirishi</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        Ushbu mahsulot omborda tavsiya etilgan maksimal normadan {selectedProduct.excessStockQty.toLocaleString()} {selectedProduct.unit} ortiqcha saqlanmoqda. Muzlatilgan kapital: <span className="font-extrabold">{fmtSum(selectedProduct.excessFinancialExposure)}</span>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {drillTab === 'acts' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Xomashyo Qabuli va Sifat Nazorati Aktlari (Incoming Raw Material Acts):
                  </h4>
                  {selectedProduct.recentActs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Ushbu davr uchun kirim aktlari topilmadi
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-dark-750 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-dark-800 text-slate-500 font-bold">
                          <tr>
                            <th className="p-2.5">Akt №</th>
                            <th className="p-2.5">Sana</th>
                            <th className="p-2.5">Ta'minotchi</th>
                            <th className="p-2.5 text-right">Qabul Miqdori</th>
                            <th className="p-2.5 text-right">Birlik Narxi</th>
                            <th className="p-2.5 text-center">QC Xulosasi</th>
                            <th className="p-2.5">Inspektor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {selectedProduct.recentActs.map((act, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="p-2.5 font-extrabold text-emerald-600">
                                {act.actNumber}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">
                                {act.actDate}
                              </td>
                              <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                                {act.supplierName}
                              </td>
                              <td className="p-2.5 text-right font-bold">
                                {act.warehouseKg.toLocaleString()} {selectedProduct.unit}
                              </td>
                              <td className="p-2.5 text-right font-medium">
                                {act.pricePerKg ? fmtSum(act.pricePerKg) : '—'}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  act.decisionRating === 2
                                    ? 'bg-rose-100 text-rose-700'
                                    : act.decisionRating === 3
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {act.decisionRating === 2 ? 'Rad etilgan' : act.decisionRating === 3 ? 'Shartli' : 'Yaxshi'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500 text-[11px]">
                                {act.inspectorName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {drillTab === 'batches' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Ombor Partiyalari va FIFO Ketma-ketligi (Inventory Batches):
                  </h4>
                  {selectedProduct.batches.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Aktiv partiyalar topilmadi
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-dark-750 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-dark-800 text-slate-500 font-bold">
                          <tr>
                            <th className="p-2.5">Partiya №</th>
                            <th className="p-2.5 text-right">Qoldiq</th>
                            <th className="p-2.5 text-center">QC Holati</th>
                            <th className="p-2.5">Qabul Sanasi</th>
                            <th className="p-2.5">Yaroqlilik Muddati</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {selectedProduct.batches.map((b, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="p-2.5 font-extrabold text-blue-600">
                                #{b.batchNumber}
                              </td>
                              <td className="p-2.5 text-right font-black">
                                {b.quantity.toLocaleString()} {selectedProduct.unit}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  b.qcStatus === 'PASSED' || b.qcStatus === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : b.qcStatus === 'BLOCKED' || b.qcStatus === 'PENDING'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {b.qcStatus}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {b.receivedAt ? b.receivedAt.slice(0, 10) : '—'}
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {b.expirationDate ? b.expirationDate.slice(0, 10) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-dark-850 border-t border-slate-200 dark:border-dark-800 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-dark-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

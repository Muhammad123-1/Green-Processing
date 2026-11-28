'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  Search,
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
  Info,
  Scale,
  FileText,
  Boxes,
  Truck,
  ShoppingCart,
  ShieldCheck,
  Building2,
  Users
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
  BarChart
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { DemandSupplyProductItem } from '@/app/api/supply-chain/demand-supply/route'

export default function DemandSupplyIntelligence() {
  const { lang, formatDirector } = useLanguage()
  const formatDual = formatDirector

  // Horizon & Filter State
  const [horizon, setHorizon] = useState<7 | 14 | 30>(30)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Table Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'EXCESS' | 'SAFE'>('ALL')
  const [sortField, setSortField] = useState<keyof DemandSupplyProductItem>('shortageQuantity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Drill-down State
  const [selectedProduct, setSelectedProduct] = useState<DemandSupplyProductItem | null>(null)
  const [drillTab, setDrillTab] = useState<'simulation' | 'orders' | 'procurement'>('simulation')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/supply-chain/demand-supply?horizon=${horizon}`)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Server xatoligi')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error('Demand & Supply load error:', err)
      setError(err?.message || 'Ma\'lumotlarni yuklab bo\'lmadi')
      toast.error('Talab va ta\'minot tahlili yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [horizon])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered and Sorted Table List
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    let list: DemandSupplyProductItem[] = [...data.products]

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

    // 2. Risk Filter
    if (riskFilter !== 'ALL') {
      list = list.filter((p) => p.riskLevel === riskFilter)
    }

    // 3. Sorting
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
  }, [data?.products, searchQuery, riskFilter, sortField, sortOrder])

  const handleSort = (field: keyof DemandSupplyProductItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const fmtQty = (val: number | null | undefined, unit = 'kg') => {
    if (val === null || val === undefined || isNaN(val)) return `0 ${unit}`
    return `${val.toLocaleString()} ${unit}`
  }

  const getRiskBadge = (level: DemandSupplyProductItem['riskLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertOctagon size={12} /> Kritik Kamomad
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle size={12} /> Xavf Ostonasida
          </span>
        )
      case 'EXCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Scale size={12} /> Ortiqcha Zaxira
          </span>
        )
      case 'SAFE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} /> Barqaror
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER & HORIZON CONTROLS */}
      <div className="bg-white dark:bg-dark-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Time-Phased Inventory & Demand Intelligence
              </span>
              <span className="text-xs text-slate-400">
                {data?.meta?.engine || "Real-time BOM Exploded Engine"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
              {formatDual("Talab va Ta'minot Intellekti (Demand & Supply)", "Интеллект Спроса и Поставок", "Demand & Supply Intelligence")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {formatDual(
                "Sotuv buyurtmalari, sex sarfi, ombor qoldiqlari va xaridlarni sinxron tahlil qilib, kelgusi 7, 14 va 30 kunlik kamomadlarni oldindan aniqlash.",
                "Синхронизация заказов клиентов, расхода цеха, остатков склада и закупок для предотвращения дефицита.",
                "Synchronized analysis of sales orders, warehouse stock, and scheduled procurement to prevent stockouts."
              )}
            </p>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
              {([7, 14, 30] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    horizon === h
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {h} kunlik
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm disabled:opacity-50"
              title="Yangilash"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE 6-KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Products at Shortage Risk */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Kamomad Xavfi
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <AlertOctagon size={16} />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600">
            {data?.kpis?.productsAtShortageRiskCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-1">
            {horizon} kun ichida tugaydi
          </p>
        </div>

        {/* KPI 2: Below Safety Stock */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Xavfsiz Zaxiradan Kam
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-amber-600">
            {data?.kpis?.productsBelowSafetyCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-amber-500/80 mt-1">
            Minimal normadan past
          </p>
        </div>

        {/* KPI 3: Customer Orders at Risk */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Xavf Ostidagi Buyurtma
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700">
              <ShoppingCart size={16} />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
            {data?.kpis?.customerOrdersAtRiskCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-1">
            Mijozga yetkazish xavfi
          </p>
        </div>

        {/* KPI 4: Confirmed Customer Demand */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tasdiqlangan Talab
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
            {fmtQty(data?.kpis?.totalConfirmedDemandKg)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {horizon} kunlik mijoz talabi
          </p>
        </div>

        {/* KPI 5: Scheduled Procurement Receipts */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rejaviy Xaridlar
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Truck size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-emerald-600 truncate">
            {fmtQty(data?.kpis?.totalScheduledReceiptsKg)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Yetkazib berilishi kutilmoqda
          </p>
        </div>

        {/* KPI 6: Products in Excess */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ortiqcha Zaxira
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <Scale size={16} />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200">
            {data?.kpis?.productsInExcessCount ?? 0} ta
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Maksimal me'yordan ko'p
          </p>
        </div>
      </div>

      {/* 3. DIRECTOR ACTIONABLE RECOMMENDATIONS BANNER */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-blue-600 dark:text-blue-400" size={18} />
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
                {formatDual("Direktor Uchun Operativ Xarid va Ishlab Chiqarish Tavsiyalari", "Оперативные рекомендации для руководства", "Actionable Supply Chain Recommendations")}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {data.recommendations.length} ta tavsiya
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recommendations.map((rec: any) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-dark-850 p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/30 text-xs shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-blue-800 dark:text-blue-300">
                      {rec.affectedProduct}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      rec.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {rec.quantity}
                    </span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 dark:text-white mb-1 leading-snug">
                    {lang === 'ru' ? rec.titleRu : lang === 'en' ? rec.titleEn : rec.titleUz}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lang === 'ru' ? rec.descRu : lang === 'en' ? rec.descEn : rec.descUz}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-750 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ArrowUpRight size={13} />
                  <span>{rec.actionUz}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Demand vs Supply Balance Bar Chart */}
        <div className="bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale size={16} className="text-blue-600" />
                {formatDual("Mahsulotlar Bo'yicha Talab va Ta'minot Balansi", "Баланс Спроса и Предложения", "Demand vs Supply Balance")}
              </h3>
              <p className="text-xs text-slate-400">
                Ombor qoldig'i + Xaridlar vs Mijozlar talabi (kg)
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {data?.charts?.demandVsSupplyBalance && data.charts.demandVsSupplyBalance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.demandVsSupplyBalance} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const it = payload[0].payload
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                            <p className="font-extrabold text-blue-400">{it.name}</p>
                            <p>Yaroqli Qoldiq: <span className="font-bold text-emerald-400">{it.usableStock?.toLocaleString()} kg</span></p>
                            <p>Rejaviy Xarid: <span className="font-bold text-blue-400">{it.scheduledReceipts?.toLocaleString()} kg</span></p>
                            <p>Mijoz Talabi: <span className="font-bold text-rose-400">{it.customerDemand?.toLocaleString()} kg</span></p>
                            <p>Xavfsiz Zaxira: <span className="font-bold text-amber-400">{it.safetyStock?.toLocaleString()} kg</span></p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="usableStock" name="Yaroqli Qoldiq" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scheduledReceipts" name="Rejaviy Xarid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="customerDemand" name="Mijoz Talabi" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Grafik ma'lumotlari mavjud emas
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Inventory Coverage Days by Product */}
        <div className="bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" />
              {formatDual("Zaxira Qoplash Kunlari (Stock Coverage Days)", "Дни покрытия запасов", "Stock Coverage Days")}
            </h3>
            <p className="text-xs text-slate-400">
              Kunlik talab va sarf sur'atida zaxira necha kunga yetishi
            </p>
          </div>

          <div className="h-[280px] w-full">
            {data?.charts?.coverageDaysByProduct && data.charts.coverageDaysByProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.charts.coverageDaysByProduct}
                  margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={90} />
                  <Tooltip
                    formatter={(v: any) => [`${v} kun`, "Qoplash muddati"]}
                  />
                  <ReferenceLine x={3} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '3 kun (Kritik)', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine x={7} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '7 kun (Xavfsiz)', fill: '#f59e0b', fontSize: 10 }} />
                  <Bar dataKey="coverageDays" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Grafik ma'lumotlari mavjud emas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. PRODUCT ANALYSIS TABLE */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {formatDual("Mahsulotlar Bo'yicha Talab, Ta'minot va Prognoz Qoldiqlar", "Таблица баланса спроса и поставок", "Demand & Supply Product Matrix")}
            </h3>
            <p className="text-xs text-slate-400">
              Jami: {filteredProducts.length} ta mahsulot tahlil qilinmoqda
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Risk Filter Select */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Barcha Xavf Darajalari</option>
              <option value="CRITICAL">Kritik Kamomad</option>
              <option value="WARNING">Xavf Ostonasida</option>
              <option value="EXCESS">Ortiqcha Zaxira</option>
              <option value="SAFE">Barqaror</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-dark-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">№</th>
                <th onClick={() => handleSort('nameUz')} className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Mahsulot Nomi
                </th>
                <th onClick={() => handleSort('usableStock')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Yaroqli Qoldiq
                </th>
                <th onClick={() => handleSort('safetyStock')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Xavfsiz Zaxira
                </th>
                <th onClick={() => handleSort('confirmedCustomerDemandInHorizon')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Mijoz Talabi ({horizon}k)
                </th>
                <th onClick={() => handleSort('confirmedScheduledReceiptsInHorizon')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Kutilayotgan Kirim
                </th>
                <th onClick={() => handleSort('stockDay7')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  7-Kun Qoldiq
                </th>
                <th onClick={() => handleSort('stockDay14')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  14-Kun Qoldiq
                </th>
                <th onClick={() => handleSort('stockDay30')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  30-Kun Qoldiq
                </th>
                <th onClick={() => handleSort('stockCoverageDays')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white">
                  Qoplash (Kun)
                </th>
                <th className="py-3 px-3 text-center">Xavf Darajasi</th>
                <th className="py-3 px-3 text-center">Tavsiya Xarid</th>
                <th className="py-3 px-3 text-center">Simulyatsiya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Talab va ta'minot tahlili hisoblanmoqda...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    Mos keluvchi mahsulotlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">{p.nameUz}</div>
                      <div className="text-[11px] text-slate-400">{p.nameRu} • {p.unit}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                      {fmtQty(p.usableStock, p.unit)}
                      {p.blockedStock > 0 && (
                        <span className="block text-[10px] text-rose-500 font-bold">
                          +{p.blockedStock} {p.unit} QC blok
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-300">
                      {fmtQty(p.safetyStock, p.unit)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                      {fmtQty(p.confirmedCustomerDemandInHorizon, p.unit)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-blue-600">
                      {fmtQty(p.confirmedScheduledReceiptsInHorizon, p.unit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-black ${
                      p.stockDay7 < 0 ? 'text-rose-600 font-black' : p.stockDay7 < p.safetyStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {fmtQty(p.stockDay7, p.unit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-black ${
                      p.stockDay14 < 0 ? 'text-rose-600 font-black' : p.stockDay14 < p.safetyStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {fmtQty(p.stockDay14, p.unit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-black ${
                      p.stockDay30 < 0 ? 'text-rose-600 font-black' : p.stockDay30 < p.safetyStock ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {fmtQty(p.stockDay30, p.unit)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {p.stockCoverageDays !== null ? `${p.stockCoverageDays} kun` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">{getRiskBadge(p.riskLevel)}</td>
                    <td className="py-3 px-3 text-center">
                      {p.recommendedReplenishmentQty > 0 ? (
                        <span className="px-2 py-0.5 rounded font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                          +{p.recommendedReplenishmentQty.toLocaleString()} {p.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-bold flex items-center gap-1 mx-auto"
                      >
                        <Eye size={12} />
                        <span>30-kun</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. LEVEL 2 & 3 TIME-PHASED DRILL-DOWN MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 w-full max-w-5xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-black text-sm">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProduct.nameUz}
                    </h3>
                    {getRiskBadge(selectedProduct.riskLevel)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedProduct.nameRu} • Yaroqli Qoldiq: {fmtQty(selectedProduct.usableStock, selectedProduct.unit)} • Xavfsiz Norma: {fmtQty(selectedProduct.safetyStock, selectedProduct.unit)}
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
                onClick={() => setDrillTab('simulation')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'simulation'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Clock size={14} />
                <span>2-Daraja: 30-Kunlik Dinamik Prognoz (Time-Phased)</span>
              </button>
              <button
                onClick={() => setDrillTab('orders')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'orders'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <ShoppingCart size={14} />
                <span>3-Daraja: Mijoz Buyurtmalari ({selectedProduct.contributingSalesOrders.length})</span>
              </button>
              <button
                onClick={() => setDrillTab('procurement')}
                className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  drillTab === 'procurement'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Truck size={14} />
                <span>3-Daraja: Rejaviy Xaridlar ({selectedProduct.contributingProcurementOrders.length})</span>
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {drillTab === 'simulation' && (
                <div className="space-y-5">
                  {/* Chart of 30-Day Simulation */}
                  <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-750">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-3">
                      Kunlik Prognoz Qoldiq Grafigi (30-Kunlik Simulyatsiya):
                    </h4>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={selectedProduct.dailyProjections} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const pt = payload[0].payload
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                                    <p className="font-extrabold text-blue-400">{pt.date} (Kun #{pt.dayIndex})</p>
                                    <p>Prognoz Qoldiq: <span className={`font-black ${pt.projectedStock < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{pt.projectedStock.toLocaleString()} {selectedProduct.unit}</span></p>
                                    <p>Rejaviy Kirim: <span className="font-bold text-blue-400">+{pt.scheduledReceipts} {selectedProduct.unit}</span></p>
                                    <p>Mijoz Talabi: <span className="font-bold text-rose-400">-{pt.customerDemand} {selectedProduct.unit}</span></p>
                                    <p>Kunlik Sarf: <span className="font-bold text-amber-400">-{pt.dailyBurn} {selectedProduct.unit}</span></p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <ReferenceLine y={0} stroke="#f43f5e" strokeWidth={1.5} label={{ value: 'Tugash (0 kg)', fill: '#f43f5e', fontSize: 10 }} />
                          <ReferenceLine y={selectedProduct.safetyStock} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Xavfsiz Zaxira', fill: '#f59e0b', fontSize: 10 }} />
                          <Bar dataKey="scheduledReceipts" name="Rejaviy Kirim" fill="#3b82f6" />
                          <Line type="monotone" dataKey="projectedStock" name="Prognoz Qoldiq" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Day-by-Day Projection Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Kunma-Kun Balans Yozuvlari:
                    </h4>
                    <div className="overflow-x-auto max-h-[260px] border border-slate-200 dark:border-dark-750 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-dark-800 text-slate-500 font-bold sticky top-0">
                          <tr>
                            <th className="p-2">Kun</th>
                            <th className="p-2">Sana</th>
                            <th className="p-2 text-right">Rejaviy Kirim</th>
                            <th className="p-2 text-right">Mijoz Talabi</th>
                            <th className="p-2 text-right">Kunlik Sarf</th>
                            <th className="p-2 text-right">Prognoz Qoldiq</th>
                            <th className="p-2 text-center">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {selectedProduct.dailyProjections.map((dp) => (
                            <tr key={dp.dayIndex} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="p-2 font-bold text-slate-400">#{dp.dayIndex}</td>
                              <td className="p-2 font-medium text-slate-900 dark:text-white">{dp.date}</td>
                              <td className="p-2 text-right font-bold text-blue-600">
                                {dp.scheduledReceipts > 0 ? `+${dp.scheduledReceipts.toLocaleString()}` : '—'}
                              </td>
                              <td className="p-2 text-right font-bold text-rose-600">
                                {dp.customerDemand > 0 ? `-${dp.customerDemand.toLocaleString()}` : '—'}
                              </td>
                              <td className="p-2 text-right font-medium text-slate-500">
                                -{dp.dailyBurn.toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-black ${
                                dp.projectedStock < 0 ? 'text-rose-600' : dp.projectedStock < selectedProduct.safetyStock ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {dp.projectedStock.toLocaleString()} {selectedProduct.unit}
                              </td>
                              <td className="p-2 text-center">
                                {dp.isShortage ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Kamomad</span>
                                ) : dp.isBelowSafety ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Zaxira past</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Yetarli</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {drillTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Ushbu mahsulotni talab qiluvchi tasdiqlangan mijoz buyurtmalari:
                  </h4>
                  {selectedProduct.contributingSalesOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Hozirda aktiv mijoz buyurtmalari mavjud emas
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 dark:border-dark-750 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-dark-800 text-slate-500 font-bold">
                          <tr>
                            <th className="p-2.5">Buyurtma №</th>
                            <th className="p-2.5">Mijoz Nomi</th>
                            <th className="p-2.5">Yetkazish Sanasi</th>
                            <th className="p-2.5 text-right">Buyurtma Miqdori</th>
                            <th className="p-2.5 text-right">Xomashyo Talabi (BOM)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {selectedProduct.contributingSalesOrders.map((so, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="p-2.5 font-extrabold text-blue-600">{so.orderNumber}</td>
                              <td className="p-2.5 font-medium text-slate-900 dark:text-white">{so.customerName}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{so.deliveryDate}</td>
                              <td className="p-2.5 text-right font-bold">{so.orderedQty.toLocaleString()} kg</td>
                              <td className="p-2.5 text-right font-black text-rose-600">{so.rawRequiredQty.toLocaleString()} {selectedProduct.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {drillTab === 'procurement' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Yetkazib berilishi kutilayotgan rejaviy xarid buyurtmalari:
                  </h4>
                  {selectedProduct.contributingProcurementOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Kutilayotgan xarid buyurtmalari mavjud emas
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 dark:border-dark-750 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-dark-800 text-slate-500 font-bold">
                          <tr>
                            <th className="p-2.5">ID</th>
                            <th className="p-2.5">Ta'minotchi</th>
                            <th className="p-2.5">Kutilayotgan Sana</th>
                            <th className="p-2.5 text-right">Buyurtma Hajmi</th>
                            <th className="p-2.5 text-center">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {selectedProduct.contributingProcurementOrders.map((po, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="p-2.5 font-bold text-slate-400">#{po.id}</td>
                              <td className="p-2.5 font-medium text-slate-900 dark:text-white">{po.supplierName}</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{po.expectedDate}</td>
                              <td className="p-2.5 text-right font-black text-blue-600">{po.quantity.toLocaleString()} {selectedProduct.unit}</td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{po.status}</span>
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

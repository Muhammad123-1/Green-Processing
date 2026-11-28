'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert,
  Users,
  Truck,
  Package,
  Layers,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  DollarSign,
  Activity,
  FileText,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Settings,
  Info,
  Calendar,
  Percent,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  ConcentrationThresholds,
  DimensionConcentrationReport,
  ConcentrationEntity,
  SingleSourceRawMaterial,
  ScenarioSimulationResult,
  ConcentrationRiskAlert
} from '@/lib/concentrationRiskEngine'

interface ApiResponse {
  success: boolean
  period: string
  thresholds: ConcentrationThresholds
  reports: {
    customer: DimensionConcentrationReport
    supplier: DimensionConcentrationReport
    product: DimensionConcentrationReport
    channel: DimensionConcentrationReport
  }
  singleSourceMaterials: SingleSourceRawMaterial[]
  scenarios: ScenarioSimulationResult[]
  alerts: ConcentrationRiskAlert[]
  summaryKpis: {
    top1CustomerShare: number
    top1CustomerName: string
    customerHhi: number
    customerRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    top1SupplierShare: number
    top1SupplierName: string
    supplierHhi: number
    supplierRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    top1ProductShare: number
    top1ProductName: string
    productHhi: number
    channelHhi: number
    singleSourceCount: number
  }
  error?: string
}

export default function BusinessDiversificationAnalytics() {
  const { lang } = useLanguage()
  const isUz = lang === 'uz'
  const isRu = lang === 'ru'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-11')
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'products' | 'channels'>('customers')
  const [searchQuery, setSearchQuery] = useState('')

  // Interactive Scenario Simulation Sliders
  const [customerShockPct, setCustomerShockPct] = useState(100)
  const [costSurgePct, setCostSurgePct] = useState(20)
  const [simulating, setSimulating] = useState(false)

  // Modals
  const [drillDownEntity, setDrillDownEntity] = useState<ConcentrationEntity | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [editingDimension, setEditingDimension] = useState<'customer' | 'supplier' | 'product' | 'channel'>('customer')
  const [tempMaxTop1, setTempMaxTop1] = useState(30)
  const [tempMaxTop3, setTempMaxTop3] = useState(60)
  const [tempHhiModerate, setTempHhiModerate] = useState(1800)
  const [tempHhiCritical, setTempHhiCritical] = useState(2500)
  const [savingConfig, setSavingConfig] = useState(false)

  const fetchData = async (period: string, custShock = customerShockPct, costSurge = costSurgePct) => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/director/concentration-risk?period=${period}&customerShockPct=${custShock}&costSurgePct=${costSurge}`
      )
      const json: ApiResponse = await res.json()
      if (json.success) {
        setData(json)
      } else {
        toast.error(json.error || (isUz ? 'Maʼlumotlarni yuklab boʻlmadi' : 'Ошибка загрузки данных'))
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error')
    } finally {
      setLoading(false)
      setSimulating(false)
    }
  }

  useEffect(() => {
    fetchData(selectedPeriod)
  }, [selectedPeriod])

  const handleRunSimulation = () => {
    setSimulating(true)
    fetchData(selectedPeriod, customerShockPct, costSurgePct)
  }

  const handleSaveThresholds = async () => {
    try {
      setSavingConfig(true)
      const res = await fetch('/api/director/concentration-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension: editingDimension,
          maxTop1Share: tempMaxTop1,
          maxTop3Share: tempMaxTop3,
          hhiModerateLimit: tempHhiModerate,
          hhiCriticalLimit: tempHhiCritical
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(isUz ? 'Xavf meʼyorlari saqlandi' : 'Пороговые значения сохранены')
        setConfigModalOpen(false)
        fetchData(selectedPeriod)
      } else {
        toast.error(json.error || 'Xatolik yuz berdi')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const getRiskBadge = (level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <Flame size={12} className="animate-pulse" />
            {isUz ? 'Oʻta Yuqori Xavf' : 'Критический'}
          </span>
        )
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle size={12} />
            {isUz ? 'Yuqori Xavf' : 'Высокий риск'}
          </span>
        )
      case 'MODERATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Info size={12} />
            {isUz ? 'Oʻrtacha' : 'Умеренный'}
          </span>
        )
      case 'LOW':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {isUz ? 'Xavfsiz / Diversifikatsiyalangan' : 'Безопасный'}
          </span>
        )
    }
  }

  // Active Tab Report
  const currentReport: DimensionConcentrationReport | undefined = useMemo(() => {
    if (!data?.reports) return undefined
    switch (activeTab) {
      case 'customers':
        return data.reports.customer
      case 'suppliers':
        return data.reports.supplier
      case 'products':
        return data.reports.product
      case 'channels':
        return data.reports.channel
    }
  }, [data, activeTab])

  // Filtered Table Entities
  const filteredEntities = useMemo(() => {
    if (!currentReport?.entities) return []
    if (!searchQuery.trim()) return currentReport.entities
    const q = searchQuery.toLowerCase()
    return currentReport.entities.filter(
      e => e.name.toLowerCase().includes(q) || (e.category && e.category.toLowerCase().includes(q))
    )
  }, [currentReport, searchQuery])

  // Pareto Chart Data (Top 8 + Cumulative line)
  const paretoChartData = useMemo(() => {
    if (!currentReport?.entities) return []
    return currentReport.entities.slice(0, 10).map((e, idx) => ({
      name: e.name.length > 15 ? e.name.slice(0, 13) + '..' : e.name,
      fullName: e.name,
      share: e.sharePercent,
      cumulative: e.cumulativeSharePercent,
      value: e.value,
      rank: idx + 1
    }))
  }, [currentReport])

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isUz
                  ? 'Biznes Diversifikatsiyasi & Konsentratsiya Xavflari'
                  : 'Диверсификация бизнеса & Риски концентрации'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? 'HHI indeksi, yirik mijozlar, yakka taʼminotchilar va ssenariy simulyatsiyasi (What-If tahlili)'
                  : 'Индекс HHI, крупные клиенты, единственные поставщики и сценарный анализ'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
            <Calendar size={14} className="text-slate-500 ml-2" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 pr-3 py-1 focus:outline-hidden cursor-pointer"
            >
              <option value="2026-11">2026 Noyabr (Hozirgi)</option>
              <option value="2026-10">2026 Oktyabr</option>
              <option value="2026-Q4">2026 IV Kvartal</option>
              <option value="2026-ALL">2026 Butun Yil</option>
            </select>
          </div>

          {/* Thresholds Button */}
          <button
            onClick={() => {
              const th = data?.thresholds?.[editingDimension]
              if (th) {
                setTempMaxTop1(th.maxTop1Share)
                setTempMaxTop3(th.maxTop3Share || 60)
                setTempHhiModerate(th.hhiModerateLimit)
                setTempHhiCritical(th.hhiCriticalLimit)
              }
              setConfigModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 transition-colors"
          >
            <Settings size={14} />
            <span>{isUz ? 'Meʼyorlarni sozlash' : 'Пороги риска'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchData(selectedPeriod)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 transition-colors"
            title={isUz ? 'Yangilash' : 'Обновить'}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Executive 4 HHI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Customer Concentration */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users size={15} className="text-blue-500" />
              {isUz ? 'Mijozlar HHI' : 'HHI Клиентов'}
            </span>
            {data?.summaryKpis && getRiskBadge(data.summaryKpis.customerRiskLevel)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {data?.summaryKpis.customerHhi ?? '—'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10,000</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Top 1: <strong className="text-slate-800 dark:text-slate-200">{data?.summaryKpis.top1CustomerName || '—'}</strong> ({data?.summaryKpis.top1CustomerShare}%)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-dark-750 flex items-center justify-between text-[11px] text-slate-500">
            <span>Top 3 ulushi:</span>
            <strong className="text-slate-800 dark:text-slate-200">{data?.reports.customer.top3SharePercent}%</strong>
          </div>
        </div>

        {/* Card 2: Supplier Spend Concentration */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Truck size={15} className="text-emerald-500" />
              {isUz ? 'Yetkazib Beruvchilar HHI' : 'HHI Поставщиков'}
            </span>
            {data?.summaryKpis && getRiskBadge(data.summaryKpis.supplierRiskLevel)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {data?.summaryKpis.supplierHhi ?? '—'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10,000</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Top 1: <strong className="text-slate-800 dark:text-slate-200">{data?.summaryKpis.top1SupplierName || '—'}</strong> ({data?.summaryKpis.top1SupplierShare}%)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-dark-750 flex items-center justify-between text-[11px] text-slate-500">
            <span>Top 3 ulushi:</span>
            <strong className="text-slate-800 dark:text-slate-200">{data?.reports.supplier.top3SharePercent}%</strong>
          </div>
        </div>

        {/* Card 3: Product Portfolio Concentration */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Package size={15} className="text-amber-500" />
              {isUz ? 'Mahsulotlar HHI' : 'HHI Продуктов'}
            </span>
            {data?.reports && getRiskBadge(data.reports.product.overallRiskLevel)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {data?.summaryKpis.productHhi ?? '—'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10,000</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Top 1: <strong className="text-slate-800 dark:text-slate-200">{data?.summaryKpis.top1ProductName || '—'}</strong> ({data?.summaryKpis.top1ProductShare}%)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-dark-750 flex items-center justify-between text-[11px] text-slate-500">
            <span>Top 3 ulushi:</span>
            <strong className="text-slate-800 dark:text-slate-200">{data?.reports.product.top3SharePercent}%</strong>
          </div>
        </div>

        {/* Card 4: Single Source Vulnerability */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Flame size={15} className="text-rose-500" />
              {isUz ? 'Yakka Manbalar' : 'Единств. поставщики'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {data?.summaryKpis.singleSourceCount || 0} ta material
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {data?.summaryKpis.singleSourceCount || 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">≥75% bogʻliqlik</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tuz va maxsus xomashyolarda muqobil taʼminotchi yoʻq
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-dark-750 flex items-center justify-between text-[11px] text-slate-500">
            <span>Kanal HHI indeksi:</span>
            <strong className="text-slate-800 dark:text-slate-200">{data?.summaryKpis.channelHhi}</strong>
          </div>
        </div>
      </div>

      {/* 3. Single-Source Raw Material Vulnerability Alert (CRITICAL PLANT SHUTDOWN RISK) */}
      {data && data.singleSourceMaterials.length > 0 && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <ShieldAlert size={18} />
              <span>
                {isUz
                  ? 'Kritik Operatsion Xavf: Yakka Taʼminotchiga Bogʻlangan Xomashyolar (Single-Source Risk)'
                  : 'Критический риск: Сырье с зависимостью от одного поставщика'}
              </span>
            </div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {isUz
                ? 'Ushbu mahsulotlarda muqobil shartnomalar yoʻq, uzilish yuz bersa zavod toʻxtash xavfi mavjud!'
                : 'Нет альтернативных поставщиков, риск остановки линий!'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-rose-200 dark:border-rose-900/40 text-slate-600 dark:text-slate-400">
                  <th className="py-2 px-3 font-semibold">{isUz ? 'Xomashyo' : 'Сырье'}</th>
                  <th className="py-2 px-3 font-semibold">{isUz ? 'Jami Xarid (kg)' : 'Всего закуп'}</th>
                  <th className="py-2 px-3 font-semibold">{isUz ? 'Asosiy Yetkazib Beruvchi' : 'Основной поставщик'}</th>
                  <th className="py-2 px-3 font-semibold text-center">{isUz ? 'Ulush %' : 'Доля %'}</th>
                  <th className="py-2 px-3 font-semibold text-center">{isUz ? 'Muqobillar' : 'Альтернативы'}</th>
                  <th className="py-2 px-3 font-semibold text-right">{isUz ? 'Joriy Qoldiq' : 'Остаток'}</th>
                  <th className="py-2 px-3 font-semibold text-right">{isUz ? 'Zaxira Yetishi' : 'Дней запаса'}</th>
                  <th className="py-2 px-3 font-semibold text-center">{isUz ? 'Holat' : 'Статус'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-rose-950/40">
                {data.singleSourceMaterials.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-rose-100/30 dark:hover:bg-rose-900/10">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {mat.rawMaterialName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {mat.totalPurchasedKg.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {mat.primarySupplierName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {mat.primarySupplierSharePercent}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400 font-semibold">
                      {mat.approvedSuppliersCount === 1 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">0 ta muqobil</span>
                      ) : (
                        `${mat.approvedSuppliersCount - 1} ta`
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {mat.currentStockKg.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {mat.stockCoverageDays > 0 ? (
                        <span className={mat.stockCoverageDays < 7 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                          ~{mat.stockCoverageDays} kun
                        </span>
                      ) : (
                        <span className="text-slate-400">0 kun</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {mat.stockCoverageDays < 7 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          Zavod toʻxtash xavfi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Zaxira mavjud
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Interactive What-If Scenario Simulation Engine */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-dark-750">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isUz ? 'Ssenariy Simulyatsiyasi (What-If Stress-Test)' : 'Сценарный стресс-тест (What-If анализ)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? 'Bozor shoklarining real moliyaviy tushum, yalpi foyda va ishlab chiqarishga taʼsirini baholash'
                  : 'Оценка влияния рыночных шоков на выручку, маржу и линии цеха'}
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
            {isUz ? 'Haqiqiy bazani oʻzgartirmaydi' : 'Не изменяет базу 1С'}
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-dark-750">
          {/* Slider 1: Customer Loss Shock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isUz ? '1. Eng yirik mijoz yoʻqotilishi / pasayishi:' : '1. Потеря крупнейшего клиента:'}
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                -{customerShockPct}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={customerShockPct}
              onChange={e => setCustomerShockPct(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-10% (Kichik pasayish)</span>
              <span>-50% (Yarim hajm)</span>
              <span>-100% (Toʻliq boy berish)</span>
            </div>
          </div>

          {/* Slider 2: Raw Material Cost Inflation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isUz ? '2. Xomashyo narxlari oshishi (Inflyatsiya):' : '2. Рост цен на сырье:'}
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                +{costSurgePct}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={costSurgePct}
              onChange={e => setCostSurgePct(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>+5% (Oddiy inflyatsiya)</span>
              <span>+20% (Mavsumiy sakrash)</span>
              <span>+60% (Kritik defitsit)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white transition-colors"
          >
            <RefreshCw size={14} className={simulating ? 'animate-spin' : ''} />
            <span>{isUz ? 'Stress-Testni Qayta Hisoblash' : 'Пересчитать сценарий'}</span>
          </button>
        </div>

        {/* Simulation Output Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.scenarios.map((sc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                  {isUz ? sc.titleUz : sc.titleRu}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Stress
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">
                  {isUz ? 'Toʻgʻridan-toʻgʻri moliyaviy xavf (Exposure):' : 'Финансовые потери:'}
                </span>
                <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400">
                  {sc.financialExposureUzs > 0 ? `-${sc.financialExposureUzs.toLocaleString()} so'm` : '0 so\'m'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-dark-750">
                <div>
                  <span className="text-slate-400 block">{isUz ? 'Hajm xavfi:' : 'Объем:'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {sc.volumeExposureKg.toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isUz ? 'Marja pasayishi:' : 'Падение маржи:'}</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{sc.grossMarginImpactPercent}% punkt
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-850 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">
                  {isUz ? 'Tavsiya etilgan chora:' : 'Рекомендация:'}
                </strong>
                {isUz ? sc.recommendedMitigationUz : sc.recommendedMitigationRu}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Dimension Analysis Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-dark-750 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('customers'); setSearchQuery('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Users size={14} />
              <span>{isUz ? 'Mijozlar Portfeli' : 'Клиенты'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/20">
                {data?.reports.customer.entitiesCount || 0}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('suppliers'); setSearchQuery('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Truck size={14} />
              <span>{isUz ? 'Yetkazib Beruvchilar' : 'Поставщики'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/20">
                {data?.reports.supplier.entitiesCount || 0}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('products'); setSearchQuery('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Package size={14} />
              <span>{isUz ? 'Mahsulotlar' : 'Продукты'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/20">
                {data?.reports.product.entitiesCount || 0}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('channels'); setSearchQuery('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'channels'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>{isUz ? 'Taqsimot Kanallari' : 'Каналы сбыта'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/20">
                {data?.reports.channel.entitiesCount || 0}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isUz ? 'Izlash (nomi, toifa)...' : 'Поиск...'}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 focus:outline-hidden w-full sm:w-56"
            />
          </div>
        </div>

        {/* Pareto Chart */}
        {paretoChartData.length > 0 && (
          <div className="bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeTab === 'customers' && (isUz ? 'Mijozlar Konsentratsiyasi Pareto Grafigi' : 'Парето-анализ клиентов')}
                  {activeTab === 'suppliers' && (isUz ? 'Yetkazib Beruvchilar Xarajat Pareto Grafigi' : 'Парето-анализ поставщиков')}
                  {activeTab === 'products' && (isUz ? 'Mahsulot Portfeli Ulushi Grafigi' : 'Парето-анализ продуктов')}
                  {activeTab === 'channels' && (isUz ? 'Sotuv Kanallari Ulush Grafigi' : 'Парето-анализ каналов')}
                </h3>
                <p className="text-xs text-slate-400">
                  {isUz ? 'Ustunlar: Yakka ulush (%), Chiziq: Kumulyativ jamlanma (%)' : 'Столбцы: Доля (%), Линия: Накопительный итог (%)'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{isUz ? 'Jami koʻrsatkich:' : 'Всего:'}</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {currentReport?.totalValue.toLocaleString()} {currentReport?.unit}
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-slate-200">#{p.rank} {p.fullName}</p>
                          <p className="text-blue-400">Ulushi: <strong>{p.share}%</strong></p>
                          <p className="text-emerald-400">Kumulyativ: <strong>{p.cumulative}%</strong></p>
                          <p className="text-slate-300 font-mono">Qiymati: {p.value.toLocaleString()} {currentReport?.unit}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar yAxisId="left" dataKey="share" radius={[6, 6, 0, 0]}>
                    {paretoChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.share >= 30 ? '#f43f5e' : entry.share >= 15 ? '#f59e0b' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Entities Table */}
        <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-750 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUz ? 'Reyting & Batafsil Tahlil Jadvallari' : 'Рейтинг и таблица анализа'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {filteredEntities.length} ta yozuv
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">{isUz ? 'Nomi' : 'Наименование'}</th>
                  {activeTab === 'customers' && <th className="py-3 px-4">{isUz ? 'Kanal' : 'Канал'}</th>}
                  <th className="py-3 px-4 text-right font-mono">
                    {activeTab === 'suppliers' ? (isUz ? 'Xarid Qiymati' : 'Сумма закупа') : (isUz ? 'Tushum (Net)' : 'Выручка')}
                  </th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Ulush %' : 'Доля %'}</th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Kumulyativ %' : 'Накопит. %'}</th>
                  {activeTab === 'customers' && (
                    <th className="py-3 px-4 text-right">{isUz ? 'Yalpi Marja %' : 'Маржа %'}</th>
                  )}
                  <th className="py-3 px-4 text-right">{isUz ? 'Ikkinchi parametr' : 'Доп. параметр'}</th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Xavf darajasi' : 'Уровень риска'}</th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Drill-Down' : 'Детали'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                {filteredEntities.map((ent, idx) => (
                  <tr key={ent.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-dark-800/50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {ent.name}
                    </td>
                    {activeTab === 'customers' && (
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {ent.category || 'RESTAURANTS_FOOD_SERVICE'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {ent.value.toLocaleString()} {currentReport?.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        ent.sharePercent >= 30
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : ent.sharePercent >= 15
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {ent.sharePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 font-medium">
                      {ent.cumulativeSharePercent}%
                    </td>
                    {activeTab === 'customers' && (
                      <td className="py-3 px-4 text-right font-mono">
                        {ent.grossMarginPercent !== undefined ? (
                          <span className={ent.grossMarginPercent > 30 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600'}>
                            {ent.grossMarginPercent}%
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {ent.secondaryMetric
                        ? `${ent.secondaryMetric.value.toLocaleString()} ${ent.secondaryMetric.unit}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getRiskBadge(ent.riskLevel)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setDrillDownEntity(ent)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title={isUz ? 'Batafsil koʻrish' : 'Смотреть'}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. Level 3 Drill-Down Modal */}
      {drillDownEntity && (
        <div
          onClick={() => setDrillDownEntity(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {drillDownEntity.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isUz ? '3-Darajali Drill-Down: Real hujjatlar va operatsion koʻrsatkichlar' : 'Детализация уровня 3'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrillDownEntity(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                <span className="text-[10px] text-slate-400 block">{isUz ? 'Qiymat / Tushum' : 'Сумма'}</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {drillDownEntity.value.toLocaleString()} {currentReport?.unit}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                <span className="text-[10px] text-slate-400 block">{isUz ? 'Portfeldagi Ulush' : 'Доля в портфеле'}</span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {drillDownEntity.sharePercent}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                <span className="text-[10px] text-slate-400 block">{isUz ? 'Kumulyativ' : 'Накопит.'}</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {drillDownEntity.cumulativeSharePercent}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                <span className="text-[10px] text-slate-400 block">{isUz ? 'Xavf Holati' : 'Статус риска'}</span>
                <span className="text-xs font-bold">
                  {getRiskBadge(drillDownEntity.riskLevel)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isUz ? 'Tizimdagi ID:' : 'ID в системе:'}</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{drillDownEntity.id}</span>
              </div>
              {drillDownEntity.category && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isUz ? 'Kategoriya / Kanal:' : 'Категория:'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{drillDownEntity.category}</span>
                </div>
              )}
              {drillDownEntity.grossProfit !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isUz ? 'Yalpi Foyda (Gross Profit):' : 'Валовая прибыль:'}</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {drillDownEntity.grossProfit.toLocaleString()} so'm ({drillDownEntity.grossMarginPercent}%)
                  </span>
                </div>
              )}
              {drillDownEntity.secondaryMetric && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{drillDownEntity.secondaryMetric.label}:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {drillDownEntity.secondaryMetric.value.toLocaleString()} {drillDownEntity.secondaryMetric.unit}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs leading-relaxed flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>
                {isUz
                  ? `Ushbu kontragent boʻyicha barcha dastlabki shartnomalar, dalolatnomalar va hisob-fakturalar 1C serveridan avtorizatsiyalangan Read-Only tartibda oʻqiladi.`
                  : `Все первичные накладные и счета-фактуры загружаются из 1С в режиме Read-Only.`}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDrillDownEntity(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300"
              >
                {isUz ? 'Yopish' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Configuration Thresholds Modal */}
      {configModalOpen && (
        <div
          onClick={() => setConfigModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-slate-600 dark:text-slate-300" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isUz ? 'Konsentratsiya Meʼyorlarini Sozlash' : 'Настройка порогов риска'}
                </h3>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  {isUz ? 'Tahlil yoʻnalishi:' : 'Измерение риска:'}
                </label>
                <select
                  value={editingDimension}
                  onChange={e => {
                    const dim = e.target.value as 'customer' | 'supplier' | 'product' | 'channel'
                    setEditingDimension(dim)
                    const th = data?.thresholds ? data.thresholds[dim] : undefined
                    if (th) {
                      setTempMaxTop1(th.maxTop1Share)
                      setTempMaxTop3(th.maxTop3Share || 60)
                      setTempHhiModerate(th.hhiModerateLimit)
                      setTempHhiCritical(th.hhiCriticalLimit)
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="customer">{isUz ? 'Mijozlar konsentratsiyasi' : 'Концентрация клиентов'}</option>
                  <option value="supplier">{isUz ? 'Yetkazib beruvchilar konsentratsiyasi' : 'Концентрация поставщиков'}</option>
                  <option value="product">{isUz ? 'Mahsulot portfeli' : 'Продуктовый портфель'}</option>
                  <option value="channel">{isUz ? 'Taqsimot kanallari' : 'Каналы сбыта'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isUz ? 'Maksimal Top-1 Ulush %:' : 'Макс. доля Топ-1 (%):'}
                  </label>
                  <input
                    type="number"
                    value={tempMaxTop1}
                    onChange={e => setTempMaxTop1(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isUz ? 'Maksimal Top-3 Ulush %:' : 'Макс. доля Топ-3 (%):'}
                  </label>
                  <input
                    type="number"
                    value={tempMaxTop3}
                    onChange={e => setTempMaxTop3(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isUz ? 'HHI Oʻrtacha chegara:' : 'Порог HHI (Умеренный):'}
                  </label>
                  <input
                    type="number"
                    value={tempHhiModerate}
                    onChange={e => setTempHhiModerate(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    {isUz ? 'HHI Kritik chegara:' : 'Порог HHI (Критический):'}
                  </label>
                  <input
                    type="number"
                    value={tempHhiCritical}
                    onChange={e => setTempHhiCritical(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 font-mono font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-800">
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                {isUz ? 'Bekor qilish' : 'Отмена'}
              </button>
              <button
                type="button"
                disabled={savingConfig}
                onClick={handleSaveThresholds}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-xs"
              >
                {savingConfig ? (isUz ? 'Saqlanmoqda...' : 'Сохранение...') : (isUz ? 'Saqlash' : 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

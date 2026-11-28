'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Layers,
  Network,
  Activity,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Package,
  Truck,
  Users,
  Calendar,
  Flame,
  Clock,
  ChevronRight,
  X,
  FileText,
  ShieldCheck,
  ArrowRight,
  Database,
  Sliders,
  Check,
  Zap,
  HelpCircle,
  Info
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
  SalesToWarehouseIntelligence,
  WarehouseToProcurementIntelligence,
  ProcurementToProductionIntelligence,
  QualityToSalesIntelligence,
  LogisticsToCustomerIntelligence,
  FinanceToSalesIntelligence,
  UnifiedEcosystemAlert,
  DataReliabilityReport
} from '@/lib/erpMetricsEcosystem'

interface ApiResponse {
  success: boolean
  period: string
  executiveSummary: {
    netRevenueUzs: number
    grossProfitUzs: number
    grossMarginPct: number
    usableInventoryKg: number
    otifPct: number
    activeAlertsCount: number
    dataFreshnessScorePct: number
    criticalIncidentsCount: number
  }
  crossModuleIntelligence: {
    salesToWarehouse: SalesToWarehouseIntelligence
    warehouseToProcurement: WarehouseToProcurementIntelligence
    procurementToProduction: ProcurementToProductionIntelligence
    qualityToSales: QualityToSalesIntelligence
    logisticsToCustomer: LogisticsToCustomerIntelligence
    financeToSales: FinanceToSalesIntelligence
  }
  unifiedAlerts: UnifiedEcosystemAlert[]
  dataReliability: DataReliabilityReport
  error?: string
}

export default function UnifiedEcosystemDashboard() {
  const { lang } = useLanguage()
  const isUz = lang === 'uz'
  const isRu = lang === 'ru'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-11')
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CONFIRMED' | 'PROJECTED' | 'CRITICAL'>('ALL')
  const [activeCrossModuleTab, setActiveCrossModuleTab] = useState<'SW' | 'WP' | 'PP' | 'QS' | 'LC' | 'FS'>('SW')
  const [selectedAlertForDrilldown, setSelectedAlertForDrilldown] = useState<UnifiedEcosystemAlert | null>(null)

  const fetchData = async (period: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/director/ecosystem?period=${period}`)
      const json: ApiResponse = await res.json()
      if (json.success) {
        setData(json)
      } else {
        toast.error(json.error || (isUz ? 'Ekosistema maʼlumotlarini yuklab boʻlmadi' : 'Ошибка загрузки данных'))
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedPeriod)
  }, [selectedPeriod])

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    if (!data?.unifiedAlerts) return []
    switch (alertFilter) {
      case 'CONFIRMED':
        return data.unifiedAlerts.filter(a => a.incidentType === 'CONFIRMED_INCIDENT')
      case 'PROJECTED':
        return data.unifiedAlerts.filter(a => a.incidentType === 'PROJECTED_RISK')
      case 'CRITICAL':
        return data.unifiedAlerts.filter(a => a.severity === 'CRITICAL')
      case 'ALL':
      default:
        return data.unifiedAlerts
    }
  }, [data, alertFilter])

  const formatUzs = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} mln`
    return val.toLocaleString('uz-UZ')
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* 1. Header & Live Synchronization Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
              <Network size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isUz
                  ? 'Yagona ERP Biznes Ekosistemasi & Modullararo Intellekt'
                  : 'Единая экосистема ERP & Межмодульный интеллект'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? 'Savdo, Ombor, Taʼminot, Sex, QC va Logistika boʻlimlarining uzviy bogʻliqligi va markaziy signallar tizimi'
                  : 'Сквозная межмодульная аналитика, цепочка поставок и единый центр инцидентов'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Freshness Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 text-xs font-semibold">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>1C Read-Only: LIVE</span>
          </div>

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
              <option value="2026-ALL">2026 Yillik Jamlanma</option>
            </select>
          </div>

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

      {/* 2. Enterprise Pulse — 5 Core Shared KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Net Revenue */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <DollarSign size={14} className="text-blue-500" />
            {isUz ? 'Sof Tushum (Net)' : 'Выручка (Net)'}
          </span>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {data ? formatUzs(data.executiveSummary.netRevenueUzs) : '—'} <span className="text-xs font-normal text-slate-400">so'm</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isUz ? 'Barcha chegirmalar chegirilgan' : 'За вычетом скидок'}
          </p>
        </div>

        {/* Metric 2: Gross Profit & Margin */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-500" />
            {isUz ? 'Yalpi Marja' : 'Валовая маржа'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {data ? `${data.executiveSummary.grossMarginPct}%` : '—'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({data ? formatUzs(data.executiveSummary.grossProfitUzs) : '—'} so'm)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isUz ? 'Yagona COGS modeli boʻyicha' : 'По единой модели COGS'}
          </p>
        </div>

        {/* Metric 3: Usable Inventory */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Package size={14} className="text-amber-500" />
            {isUz ? 'Erkin Zaxira' : 'Свободный запас'}
          </span>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {data ? data.executiveSummary.usableInventoryKg.toLocaleString() : '—'} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isUz ? 'Faqat QC tasdiqlagan partiyalar' : 'Только годные партии QC'}
          </p>
        </div>

        {/* Metric 4: OTIF Delivery */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Truck size={14} className="text-cyan-500" />
            {isUz ? 'Logistika OTIF' : 'Индекс OTIF'}
          </span>
          <div className="text-xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
            {data ? `${data.executiveSummary.otifPct}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            {isUz ? 'Vaqtida, toʻliq va harorat meʼyorida' : 'В срок и в полном объеме'}
          </p>
        </div>

        {/* Metric 5: Data Freshness Score */}
        <div className="bg-white dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Database size={14} className="text-violet-500" />
            {isUz ? 'Maʼlumot Sifati' : 'Качество данных'}
          </span>
          <div className="text-xl font-extrabold font-mono text-violet-600 dark:text-violet-400">
            {data ? `${data.executiveSummary.dataFreshnessScorePct}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-500">
            {isUz ? 'Gibrid audit va sinxronizatsiya' : 'Синхронизация без разрывов'}
          </p>
        </div>
      </div>

      {/* 3. Cross-Module Intelligence Correlation Panel (6 Enterprise Inter-Links) */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-750">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>{isUz ? 'Modullararo Sabab-Oqibat Zanjiri (Cross-Module Intelligence)' : 'Межмодульная причинно-следственная аналитика'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz
                ? 'Bir boʻlimdagi uzilish boshqa boʻlimlarga qanday taʼsir koʻrsatishi real hujjatlar bilan bogʻlangan holda'
                : 'Взаимосвязь между закупками, складом, цехом, контролем качества и сбытом'}
            </p>
          </div>

          {/* Navigation Pill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCrossModuleTab('SW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'SW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              1. Savdo → Ombor
            </button>
            <button
              onClick={() => setActiveCrossModuleTab('WP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'WP'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              2. Ombor → Taʼminot
            </button>
            <button
              onClick={() => setActiveCrossModuleTab('PP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'PP'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              3. Taʼminot → Sex
            </button>
            <button
              onClick={() => setActiveCrossModuleTab('QS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'QS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              4. Sifat (QC) → Savdo
            </button>
            <button
              onClick={() => setActiveCrossModuleTab('LC')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'LC'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              5. Logistika → Mijoz
            </button>
            <button
              onClick={() => setActiveCrossModuleTab('FS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCrossModuleTab === 'FS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              6. Moliya → Savdo
            </button>
          </div>
        </div>

        {/* Tab 1: Sales to Warehouse */}
        {activeCrossModuleTab === 'SW' && data?.crossModuleIntelligence.salesToWarehouse && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs">
              <div>
                <span className="text-slate-500 block">Jami tasdiqlangan buyurtma talabi:</span>
                <strong className="text-sm font-mono text-slate-900 dark:text-white">
                  {data.crossModuleIntelligence.salesToWarehouse.totalConfirmedDemandKg.toLocaleString()} kg
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Ombordagi mavjud erkin qoldiq:</span>
                <strong className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {data.crossModuleIntelligence.salesToWarehouse.totalUsableStockKg.toLocaleString()} kg
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Kamomad / Savdo xavfi qiymati:</span>
                <strong className="text-sm font-mono text-rose-600 dark:text-rose-400">
                  {formatUzs(data.crossModuleIntelligence.salesToWarehouse.financialExposureUzs)} so'm ({data.crossModuleIntelligence.salesToWarehouse.netShortageKg.toLocaleString()} kg)
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-700 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-right">Tasdiqlangan Talab</th>
                    <th className="py-2.5 px-3 text-right">Erkin Qoldiq</th>
                    <th className="py-2.5 px-3 text-right">Kamomad</th>
                    <th className="py-2.5 px-3 text-center">Xavf Ostidagi Buyurtmalar</th>
                    <th className="py-2.5 px-3 text-right">Moliyaviy Xavf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.salesToWarehouse.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{it.confirmedDemandKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{it.usableStockKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">-{it.deficitKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                          {it.affectedOrdersCount} ta buyurtma
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        {it.revenueExposureUzs.toLocaleString()} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Warehouse to Procurement */}
        {activeCrossModuleTab === 'WP' && data?.crossModuleIntelligence.warehouseToProcurement && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs">
              <div>
                <span className="text-slate-500 block">Xavfsiz zaxiradan past tovarlar:</span>
                <strong className="text-sm font-mono text-amber-600 dark:text-amber-400">
                  {data.crossModuleIntelligence.warehouseToProcurement.itemsBelowSafetyStockCount} ta mahsulot
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Tavsiya etilgan toʻldirish hajmi:</span>
                <strong className="text-sm font-mono text-slate-900 dark:text-white">
                  {data.crossModuleIntelligence.warehouseToProcurement.totalReorderVolumeKg.toLocaleString()} kg
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Kutilayotgan xarid xarajati:</span>
                <strong className="text-sm font-mono text-slate-900 dark:text-white">
                  {formatUzs(data.crossModuleIntelligence.warehouseToProcurement.estimatedProcurementSpendUzs)} so'm
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-700 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-right">Joriy Qoldiq</th>
                    <th className="py-2.5 px-3 text-right">Xavfsiz Meʼyor</th>
                    <th className="py-2.5 px-3 text-right">Zaxira Yetishi</th>
                    <th className="py-2.5 px-3 text-right">Tavsiya Buyurtma</th>
                    <th className="py-2.5 px-3 text-center">Xavf Darajasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.warehouseToProcurement.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{it.currentStockKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{it.safetyStockKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={it.stockCoverageDays < 3 ? 'text-rose-600' : 'text-amber-600'}>
                          ~{it.stockCoverageDays} kun
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                        +{it.recommendedReorderKg.toLocaleString()} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          it.urgency === 'CRITICAL' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600'
                        }`}>
                          {it.urgency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Procurement to Production */}
        {activeCrossModuleTab === 'PP' && data?.crossModuleIntelligence.procurementToProduction && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Xomashyo defitsiti sababli xavf ostidagi rejalar:</span>
                <strong className="text-sm font-mono text-rose-600 dark:text-rose-400">
                  {data.crossModuleIntelligence.procurementToProduction.atRiskProductionOrdersCount} ta ishlab chiqarish buyurtmasi ({data.crossModuleIntelligence.procurementToProduction.delayedOutputKg.toLocaleString()} kg mahsulot)
                </strong>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                BOM Defitsit Liniyasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-700 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Retsept / Tayyor Mahsulot</th>
                    <th className="py-2.5 px-3 text-right">Reja Chiqishi</th>
                    <th className="py-2.5 px-3">Yetishmayotgan Xomashyo</th>
                    <th className="py-2.5 px-3 text-right">Talab Qilingan</th>
                    <th className="py-2.5 px-3 text-right">Mavjud Xomashyo</th>
                    <th className="py-2.5 px-3 text-right">Kamomad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.procurementToProduction.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.recipeName}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{it.plannedOutputKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 font-semibold text-rose-600">{it.missingRawMaterial}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{it.requiredKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{it.availableRawKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">-{it.shortageKg.toLocaleString()} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Quality to Sales */}
        {activeCrossModuleTab === 'QS' && data?.crossModuleIntelligence.qualityToSales && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Sifat nazorati bloklagan partiyalar:</span>
                <strong className="text-sm font-mono text-purple-700 dark:text-purple-300">
                  {data.crossModuleIntelligence.qualityToSales.quarantinedBatchesCount} ta akt ({data.crossModuleIntelligence.qualityToSales.quarantinedVolumeKg.toLocaleString()} kg brak/karantin)
                </strong>
              </div>
              <span className="text-xs text-purple-700 font-semibold">
                Savdo buyurtmalari bilan bogʻlangan: {data.crossModuleIntelligence.qualityToSales.affectedCustomerOrdersCount} ta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-700 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Hujjat</th>
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-right">Brak Hajmi</th>
                    <th className="py-2.5 px-3">Sabab</th>
                    <th className="py-2.5 px-3">Taʼsirlangan Xaridorlar</th>
                    <th className="py-2.5 px-3 text-right">Xavf Qiymati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.qualityToSales.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{it.actNumber}</td>
                      <td className="py-2.5 px-3 font-semibold">{it.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">{it.quarantinedKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-slate-500">{it.reason}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">{it.affectedCustomers.join(', ')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {it.orderExposureUzs.toLocaleString()} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Logistics to Customer */}
        {activeCrossModuleTab === 'LC' && data?.crossModuleIntelligence.logisticsToCustomer && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Kechikkan / Qaytarilgan yuklar soni:</span>
                <strong className="text-sm font-mono text-cyan-700 dark:text-cyan-300">
                  {data.crossModuleIntelligence.logisticsToCustomer.delayedShipmentsCount} ta reys ({data.crossModuleIntelligence.logisticsToCustomer.delayedVolumeKg.toLocaleString()} kg)
                </strong>
              </div>
              <span className="text-xs text-cyan-700 font-semibold">
                Datchik harorat chetlanishi: {data.crossModuleIntelligence.logisticsToCustomer.temperatureViolationsCount} ta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-750 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Reys ID</th>
                    <th className="py-2.5 px-3">Xaridor</th>
                    <th className="py-2.5 px-3">Manzil</th>
                    <th className="py-2.5 px-3 text-right">Yuklangan kg</th>
                    <th className="py-2.5 px-3 text-center">Harorat Sifati</th>
                    <th className="py-2.5 px-3 text-center">Kechikish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.logisticsToCustomer.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">SHP-{it.shipmentId}</td>
                      <td className="py-2.5 px-3 font-semibold">{it.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{it.destination}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{it.shippedKg.toLocaleString()} kg</td>
                      <td className="py-2.5 px-3 text-center">
                        {it.temperatureIssue ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                            Meʼyordan oshgan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                            Mos (+2°...+6°C)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                        {it.delayedHours > 0 ? `+${it.delayedHours} soat` : 'Vaqtida'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Finance to Sales */}
        {activeCrossModuleTab === 'FS' && data?.crossModuleIntelligence.financeToSales && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Marjasi qisqargan mahsulotlar:</span>
                <strong className="text-sm font-mono text-emerald-700 dark:text-emerald-300">
                  {data.crossModuleIntelligence.financeToSales.marginCompressedProductsCount} ta mahsulot
                </strong>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                Korxona oʻrtacha yalpi marjasi: {data.crossModuleIntelligence.financeToSales.overallGrossMarginPct}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-750 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-right">Joriy Marja %</th>
                    <th className="py-2.5 px-3 text-right">Rejaviy Marja %</th>
                    <th className="py-2.5 px-3 text-right">Farq (Eroziya)</th>
                    <th className="py-2.5 px-3">Asosiy Sabab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {data.crossModuleIntelligence.financeToSales.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{it.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{it.currentMarginPct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{it.previousMarginPct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{it.marginVariancePct}%</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                          {it.driver === 'RAW_MATERIAL_COST' ? 'Xomashyo Narx Sakrashi' : 'Chegirma Bosimi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Unified Centralized Alert Center (Incident vs Risk Separation) */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-750">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isUz ? 'Yagona Signal & Hodisalar Markazi (Unified Alert Center)' : 'Единый центр инцидентов и рисков'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? 'Tasdiqlangan hodisalar (Confirmed Incidents) va Kutilayotgan xavflar (Projected Risks) dedublikatsiya qilingan holda'
                  : 'Четкое разделение свершившихся инцидентов и прогнозных рисков'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAlertFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                alertFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Barchasi ({data?.unifiedAlerts.length || 0})
            </button>
            <button
              onClick={() => setAlertFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                alertFilter === 'CONFIRMED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Faktik Hodisalar ({data?.unifiedAlerts.filter(a => a.incidentType === 'CONFIRMED_INCIDENT').length || 0})
            </button>
            <button
              onClick={() => setAlertFilter('PROJECTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                alertFilter === 'PROJECTED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Prognoz Xavflar ({data?.unifiedAlerts.filter(a => a.incidentType === 'PROJECTED_RISK').length || 0})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Hech qanday kritik xavf yoki signal topilmadi. Tizim meʼyorda ishlamoqda.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-800 hover:border-slate-300 dark:hover:border-dark-600 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.incidentType === 'CONFIRMED_INCIDENT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alert.incidentType === 'CONFIRMED_INCIDENT' ? 'Faktik Hodisa' : 'Prognoz Xavf'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isUz ? alert.titleUz : alert.titleRu}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {alert.sourceRecordNumber}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isUz ? alert.descriptionUz : alert.descriptionRu}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-dark-750 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Javobgar:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{alert.responsibleRole}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Boʻlim:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{alert.affectedDepartment}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Moliyaviy taʼsir:</span>
                    <strong className="font-mono text-rose-600">{alert.businessImpactUzs.toLocaleString()} so'm</strong>
                  </div>
                  <div className="flex justify-end items-center">
                    <button
                      onClick={() => setSelectedAlertForDrilldown(alert)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <span>Tekshirish</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-850 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tavsiya etilgan amaliy chora:</strong> {isUz ? alert.recommendedActionUz : alert.recommendedActionRu}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Data Reliability & Freshness Center */}
      {data?.dataReliability && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold">
                  {isUz ? 'Maʼlumotlar Ishonchliligi va Yangiligi Monitoringi' : 'Мониторинг свежести и качества данных'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isUz ? 'Tizim hech qachon soxta raqamlarni yashirmaydi, yetishmayotgan qatorlarni ochiq koʻrsatadi' : 'Прозрачный аудит пробелов данных'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1C API: Ulangan (Read-Only)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Oxirgi yangilanish: {new Date(data.dataReliability.lastSyncTimestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 block">Audit qilingan yozuvlar:</span>
              <span className="text-base font-bold font-mono text-white">
                {data.dataReliability.auditSummary.totalEntitiesAudited.toLocaleString()} ta
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 block">Tannarx yetishmaydigan tovarlar:</span>
              <span className={`text-base font-bold font-mono ${
                data.dataReliability.auditSummary.missingCostPricesCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {data.dataReliability.auditSummary.missingCostPricesCount} ta
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 block">Tasniflanmagan kanallar:</span>
              <span className={`text-base font-bold font-mono ${
                data.dataReliability.auditSummary.unclassifiedCustomerChannelsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {data.dataReliability.auditSummary.unclassifiedCustomerChannelsCount} ta
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 block">Datchik maʼlumoti yetishmaydi:</span>
              <span className={`text-base font-bold font-mono ${
                data.dataReliability.auditSummary.missingTemperatureSensorShipments > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {data.dataReliability.auditSummary.missingTemperatureSensorShipments} ta
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Drill-Down Modal */}
      {selectedAlertForDrilldown && (
        <div
          onClick={() => setSelectedAlertForDrilldown(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  3-Darajali Drill-Down: {selectedAlertForDrilldown.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForDrilldown(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hodisa nomi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAlertForDrilldown.titleUz}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Birlamchi hujjat raqami:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedAlertForDrilldown.sourceRecordNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Masʼul boʻlim va lavozim:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAlertForDrilldown.responsibleRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baholangan moliyaviy xavf:</span>
                  <span className="font-mono font-bold text-rose-600">{selectedAlertForDrilldown.businessImpactUzs.toLocaleString()} so'm</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  Ushbu operatsion xato yoki ogohlantirish real ERP maʼlumotlar bazasidagi birlamchi buyurtma, dalolatnoma va ombor qoldigʻi registrlarini oʻzaro solishtirish orqali aniqlandi.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAlertForDrilldown(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300"
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

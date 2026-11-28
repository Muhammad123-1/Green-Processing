'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Target,
  Calculator,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  Printer,
  ChevronRight,
  ChevronDown,
  Layers,
  Factory,
  ShoppingCart,
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Search,
  Filter,
  BarChart3,
  X,
  FileText,
  Info,
  Check,
  Zap,
  Activity,
  Boxes,
  PieChart as PieChartIcon
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
  ReferenceLine,
  BarChart,
  Cell
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface MetricTriplet {
  comparablePlan: number
  actualToDate: number
  fullPeriodPlan: number
  forecastFullPeriod: number
  planAchievementPercent: number
  planVariance: number
  forecastVariance: number
  expectedAchievementPercent: number
  remainingTarget: number
  requiredDailyPerformance: number
  unit: string
  isCapacityRisk?: boolean
}

interface ForecastModelEvaluation {
  methodName: string
  methodCode: string
  projectedRemaining: number
  forecastFullPeriod: number
  mae: number
  wapePercent: number
  isRecommended: boolean
  descriptionUz: string
  descriptionRu: string
}

interface DailyTimeSeriesPoint {
  date: string
  dayIndex: number
  isFuture: boolean
  isWorkingDay: boolean
  dailyPlan: number
  dailyActual: number | null
  dailyForecast: number
  cumulativePlan: number
  cumulativeActual: number | null
  cumulativeForecast: number
}

interface DepartmentPerformance {
  code: string
  nameUz: string
  nameRu: string
  nameEn: string
  unit: string
  primaryMetric: MetricTriplet
  secondaryMetric?: {
    nameUz: string
    nameRu: string
    actual: number
    target: number
    variance: number
    unit: string
  }
  status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL'
}

interface ProductPerformance {
  code: string
  nameUz: string
  nameRu: string
  nameEn: string
  targetOutputKg: number
  comparablePlanKg: number
  actualOutputKg: number
  forecastOutputKg: number
  achievementPercent: number
  planVarianceKg: number
  forecastVarianceKg: number
  expectedAchievementPercent: number
  actualYieldPercent: number
  targetYieldPercent: number
  targetRevenueUzs: number
  actualRevenueUzs: number
  status: 'ON_TRACK' | 'BEHIND_PLAN' | 'EXCEEDING'
}

interface ExecutiveAlert {
  id: string
  level: 'CRITICAL' | 'WARNING' | 'INFO'
  category: string
  titleUz: string
  titleRu: string
  descriptionUz: string
  descriptionRu: string
  recommendedActionUz: string
  recommendedActionRu: string
  supportingData: {
    metric: string
    target: number | string
    actual: number | string
    forecast: number | string
    unit: string
  }
}

interface ApiResponse {
  success: boolean
  period: string
  periodLabelUz: string
  periodLabelRu: string
  calendar: {
    totalDays: number
    elapsedDays: number
    totalWorkingDays: number
    elapsedWorkingDays: number
    remainingWorkingDays: number
    dailyCapacityKg: number
    maxOvertimeCapacityKg: number
  }
  executiveSummary: {
    production: MetricTriplet
    sales: MetricTriplet
    supply: MetricTriplet
    finance: MetricTriplet
  }
  departments: DepartmentPerformance[]
  products: ProductPerformance[]
  timeSeries: DailyTimeSeriesPoint[]
  forecastEvaluation: {
    activeModel: ForecastModelEvaluation
    models: ForecastModelEvaluation[]
    futureConfirmedOrdersKg: number
  }
  alerts: ExecutiveAlert[]
  auditTrail: {
    shopExpensesCount: number
    incomingActsCount: number
    salesOrdersCount: number
    recentActs: any[]
    recentSalesOrders: any[]
  }
}

export default function PlanForecastActualAnalytics() {
  const { lang, formatDirector } = useLanguage()
  const isUz = lang === 'uz'
  const isRu = lang === 'ru'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-11')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'products' | 'departments' | 'models' | 'audit'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [drillDownItem, setDrillDownItem] = useState<{ type: 'product' | 'department' | 'alert' | 'formula'; payload: any } | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editTargetValue, setEditTargetValue] = useState<string>('95000')

  const fetchData = async (period: string, modelCode?: string) => {
    try {
      setLoading(true)
      let url = `/api/director/plan-forecast-actual?period=${period}`
      if (modelCode) url += `&model=${modelCode}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setData(json)
        if (!modelCode && json.forecastEvaluation?.activeModel?.methodCode) {
          setSelectedModel(json.forecastEvaluation.activeModel.methodCode)
        }
      } else {
        toast.error(json.error || 'Ma\'lumotlarni yuklashda xatolik')
      }
    } catch (err: any) {
      toast.error('Server bilan bog\'lanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedPeriod)
  }, [selectedPeriod])

  const handleModelChange = (modelCode: string) => {
    setSelectedModel(modelCode)
    fetchData(selectedPeriod, modelCode)
  }

  const handleSavePlanConfig = async () => {
    try {
      const res = await fetch('/api/director/plan-forecast-actual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          departmentCode: 'production',
          targetKey: 'targetOutputKg',
          newValue: parseFloat(editTargetValue)
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(isUz ? 'Reja muvaffaqiyatli saqlandi' : 'План успешно сохранён')
        setShowConfigModal(false)
        fetchData(selectedPeriod, selectedModel)
      } else {
        toast.error(json.error || 'Xatolik')
      }
    } catch {
      toast.error('Rejani saqlashda xatolik')
    }
  }

  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    if (!searchTerm.trim()) return data.products
    const q = searchTerm.toLowerCase()
    return data.products.filter(p =>
      p.nameUz.toLowerCase().includes(q) ||
      p.nameRu.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  }, [data?.products, searchTerm])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
          {isUz ? 'Reja, Prognoz va Fakt ma\'lumotlari hisoblanmoqda...' : 'Расчёт плана, прогноза и факта...'}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        {isUz ? 'Ma\'lumot topilmadi' : 'Данные не найдены'}
      </div>
    )
  }

  const prodSummary = data.executiveSummary.production
  const salesSummary = data.executiveSummary.sales
  const supplySummary = data.executiveSummary.supply
  const financeSummary = data.executiveSummary.finance

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Target size={24} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isUz ? 'Reja vs Prognoz vs Fakt Tahlili' : 'Анализ План vs Прогноз vs Факт'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isUz
                    ? 'Tasdiqlangan reja, yakunlangan operatsiyalar va ilmiy prognoz modellari taqqoslanishi'
                    : 'Сопоставление утверждённых планов, фактических результатов и моделей прогнозирования'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
              <Calendar size={16} className="text-slate-500 ml-2" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1.5 outline-none cursor-pointer"
              >
                <option value="2026-11">Noyabr 2026</option>
                <option value="2026-10">Oktyabr 2026</option>
              </select>
            </div>

            {/* Forecast Model Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
              <Zap size={16} className="text-amber-500 ml-2" />
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1.5 outline-none cursor-pointer max-w-[200px] truncate"
              >
                {data.forecastEvaluation.models.map((m) => (
                  <option key={m.methodCode} value={m.methodCode}>
                    {m.isRecommended ? '★ ' : ''}{m.methodCode === 'CONFIRMED_ORDERS_BLENDED' ? 'Buyurtmalar Gibridi' : m.methodCode === 'MOVING_AVG_7D' ? '7-kunlik O\'rtacha' : m.methodCode === 'LINEAR_TREND' ? 'Chiziqli Trend' : 'Eksponensial'} (WAPE {m.wapePercent}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Configuration Edit Button */}
            <button
              onClick={() => {
                setEditTargetValue(String(prodSummary.fullPeriodPlan))
                setShowConfigModal(true)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
            >
              <Sliders size={14} />
              <span>{isUz ? 'Rejani Tahrirlash' : 'Настройка плана'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchData(selectedPeriod, selectedModel)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-dark-700"
              title={isUz ? 'Yangilash' : 'Обновить'}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTELLIGENT ALERTS BARRIER */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                alert.level === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`p-2 rounded-xl shrink-0 ${alert.level === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">
                      {isUz ? alert.titleUz : alert.titleRu}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/40 dark:bg-dark-900/40 border">
                      {alert.category}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">
                    {isUz ? alert.descriptionUz : alert.descriptionRu}
                  </p>
                  <p className="text-xs font-semibold mt-1 text-slate-900 dark:text-white">
                    <span className="text-emerald-600 dark:text-emerald-400">💡 Tavsiya: </span>
                    {isUz ? alert.recommendedActionUz : alert.recommendedActionRu}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrillDownItem({ type: 'alert', payload: alert })}
                className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700 transition-all text-slate-800 dark:text-slate-200"
              >
                {isUz ? 'Batafsil ko\'rish' : 'Подробнее'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. EXECUTIVE COMPANY-WIDE KPI GRID (LEVEL 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: PRODUCTION */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Factory size={15} className="text-emerald-500" />
              {isUz ? 'Ishlab Chiqarish' : 'Производство'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              prodSummary.planAchievementPercent >= 100
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : prodSummary.planAchievementPercent >= 90
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}>
              {prodSummary.planAchievementPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {prodSummary.actualToDate.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                / {prodSummary.comparablePlan.toLocaleString()} {prodSummary.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Plan-to-date farqi:' : 'Отклонение к плану:'}</span>
              <span className={`font-bold ${prodSummary.planVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {prodSummary.planVariance > 0 ? '+' : ''}{prodSummary.planVariance.toLocaleString()} {prodSummary.unit}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Kutilayotgan prognoz:' : 'Ожидаемый прогноз:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {prodSummary.forecastFullPeriod.toLocaleString()} {prodSummary.unit} ({prodSummary.expectedAchievementPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isUz ? 'Talab qilinadigan sur\'at:' : 'Требуемый темп:'}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${
                prodSummary.isCapacityRisk
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {prodSummary.requiredDailyPerformance.toLocaleString()} {prodSummary.unit}/kun
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: SALES */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart size={15} className="text-blue-500" />
              {isUz ? 'Savdo va Tushum' : 'Продажи и Выручка'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              salesSummary.planAchievementPercent >= 95
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {salesSummary.planAchievementPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {(salesSummary.actualToDate / 1000000).toFixed(1)}M
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                / {(salesSummary.comparablePlan / 1000000).toFixed(1)}M {salesSummary.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Faktik tushum farqi:' : 'Отклонение выручки:'}</span>
              <span className={`font-bold ${salesSummary.planVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {salesSummary.planVariance > 0 ? '+' : ''}{(salesSummary.planVariance / 1000000).toFixed(1)}M so'm
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Oylik reja maqsad:' : 'Цель на месяц:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(salesSummary.fullPeriodPlan / 1000000).toFixed(0)}M so'm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Kutilayotgan umumiy:' : 'Ожидаемый итог:'}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {(salesSummary.forecastFullPeriod / 1000000).toFixed(1)}M so'm
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: SUPPLY */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={15} className="text-violet-500" />
              {isUz ? 'Ta\'minot va Xarid' : 'Снабжение и Закупки'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              supplySummary.planAchievementPercent >= 90
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {supplySummary.planAchievementPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {supplySummary.actualToDate.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                / {supplySummary.comparablePlan.toLocaleString()} {supplySummary.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Qabul qilingan xomashyo:' : 'Принято сырья:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {data.auditTrail.incomingActsCount} ta akt
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Oylik reja xarid:' : 'План закупок:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {supplySummary.fullPeriodPlan.toLocaleString()} {supplySummary.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Kutilayotgan qabul:' : 'Прогноз приёмки:'}</span>
              <span className="font-bold text-violet-600 dark:text-violet-400">
                {supplySummary.forecastFullPeriod.toLocaleString()} {supplySummary.unit}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: FORECAST ACCURACY & CAPACITY */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={15} className="text-amber-500" />
              {isUz ? 'Prognoz Aniqligi' : 'Точность прогноза'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              WAPE {data.forecastEvaluation.activeModel.wapePercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={data.forecastEvaluation.activeModel.methodName}>
              {data.forecastEvaluation.activeModel.methodName}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'O\'rtacha xatolik (MAE):' : 'Средняя ошибка (MAE):'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ±{data.forecastEvaluation.activeModel.mae.toLocaleString()} kg/kun
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Zavod quvvati:' : 'Мощность завода:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {data.calendar.dailyCapacityKg.toLocaleString()} kg/kun
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Qolgan ish kunlari:' : 'Осталось рабочих дней:'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {data.calendar.remainingWorkingDays} kun
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRIMARY CHARTS: TIME-SERIES & PRODUCT VARIANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: PLAN VS FORECAST VS ACTUAL TIME-SERIES */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isUz ? 'Kumulyativ Bajarilish Dinamikasi (Reja vs Fakt vs Prognoz)' : 'Кумулятивная динамика (План vs Факт vs Прогноз)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUz
                  ? 'Ko\'k - Tasdiqlangan reja; Yashil - Haqiqiy fakt (kelajak sanalar bo\'sh); Sariq - Prognoz davomi'
                  : 'Синий - План; Зелёный - Факт (будущие дни не отображаются); Жёлтый - Прогноз'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
                <span>{isUz ? 'Reja' : 'План'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-1 bg-emerald-600 inline-block rounded"></span>
                <span>{isUz ? 'Fakt' : 'Факт'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block"></span>
                <span>{isUz ? 'Prognoz' : 'Прогноз'}</span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="dayIndex"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val}-kun`}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload as DailyTimeSeriesPoint
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-lg border border-slate-700">
                          <p className="font-bold text-slate-300">{pt.date} ({pt.dayIndex}-kun)</p>
                          <p className="text-blue-400">Reja (kumulyativ): {pt.cumulativePlan.toLocaleString()} kg</p>
                          {pt.cumulativeActual !== null && (
                            <p className="text-emerald-400 font-bold">Fakt (kumulyativ): {pt.cumulativeActual.toLocaleString()} kg</p>
                          )}
                          <p className="text-amber-400">Prognoz (kumulyativ): {pt.cumulativeForecast.toLocaleString()} kg</p>
                          {pt.dailyActual !== null && (
                            <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-700">Kunlik fakt: {pt.dailyActual.toLocaleString()} kg</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePlan"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Plan"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeActual"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  connectNulls={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeForecast"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Forecast"
                />
                <ReferenceLine
                  y={data.executiveSummary.production.fullPeriodPlan}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Oylik Reja Chegarasi (95k kg)', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: PRODUCT LEVEL VARIANCES (WATERFALL / BAR) */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isUz ? 'Mahsulotlar Bo\'yicha Farq' : 'Отклонения по продуктам'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUz ? 'Reja-to-date ko\'rsatkichiga nisbatan farq (kg)' : 'Отклонение к плану-to-date (кг)'}
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.products}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v} kg`} />
                <YAxis dataKey="nameUz" type="category" tick={{ fontSize: 10 }} width={85} />
                <Tooltip
                  formatter={(val: any) => [`${val > 0 ? '+' : ''}${val} kg`, 'Farq']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="planVarianceKg" radius={[0, 4, 4, 0]}>
                  {data.products.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.planVarianceKg >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. MULTI-TAB DETAILED PERFORMANCE (LEVEL 2 & 3) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-dark-700 px-5 pt-3 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-0">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Boxes size={15} />
              <span>{isUz ? 'Mahsulotlar Tahlili' : 'Анализ по продуктам'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {data.products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'departments'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Layers size={15} />
              <span>{isUz ? 'Bo\'limlar Bajarilishi' : 'Исполнение по отделам'}</span>
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'models'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Zap size={15} />
              <span>{isUz ? 'Prognoz Modellari Solishtirmasi' : 'Сравнение моделей'}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <FileText size={15} />
              <span>{isUz ? 'Tranzaksiyalar Auditi (Level 3)' : 'Аудит транзакций'}</span>
            </button>
          </div>

          {activeTab === 'products' && (
            <div className="relative mb-3 sm:mb-0">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={isUz ? 'Mahsulot qidirish...' : 'Поиск продукта...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500 w-full sm:w-56"
              />
            </div>
          )}
        </div>

        {/* TAB 1: PRODUCTS TABLE */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-dark-700">
                <tr>
                  <th className="py-3 px-4">{isUz ? 'Mahsulot Nomi' : 'Наименование'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Oylik Reja' : 'План на месяц'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Reja-to-date' : 'План-to-date'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Fakt-to-date' : 'Факт-to-date'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Farq' : 'Отклонение'}</th>
                  <th className="py-3 px-3 text-center">{isUz ? 'Bajarilish %' : 'Выполнение %'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Prognoz Yakun' : 'Прогноз итог'}</th>
                  <th className="py-3 px-3 text-center">{isUz ? 'Chiqish (Yield %)' : 'Выход (Yield %)'}</th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Holat' : 'Статус'}</th>
                  <th className="py-3 px-3 text-center">{isUz ? 'Drill-down' : 'Детали'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                {filteredProducts.map((p) => (
                  <tr
                    key={p.code}
                    className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors cursor-pointer"
                    onClick={() => setDrillDownItem({ type: 'product', payload: p })}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {isUz ? p.nameUz : p.nameRu}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                      {p.targetOutputKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                      {p.comparablePlanKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {p.actualOutputKg.toLocaleString()} kg
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${p.planVarianceKg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {p.planVarianceKg > 0 ? '+' : ''}{p.planVarianceKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                        p.achievementPercent >= 100
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : p.achievementPercent >= 85
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}>
                        {p.achievementPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                      {p.forecastOutputKg.toLocaleString()} kg ({p.expectedAchievementPercent}%)
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-semibold ${p.actualYieldPercent >= p.targetYieldPercent ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.actualYieldPercent}% <span className="text-[10px] text-slate-400">({p.targetYieldPercent}%)</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'ON_TRACK'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}>
                        {p.status === 'ON_TRACK' ? (isUz ? 'Reja bo\'yicha' : 'В плане') : (isUz ? 'Orqada' : 'Отстаёт')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 hover:text-emerald-500">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS TABLE */}
        {activeTab === 'departments' && (
          <div className="overflow-x-auto p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.departments.map((d) => (
                <div
                  key={d.code}
                  className="bg-slate-50 dark:bg-dark-800/40 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 space-y-4 cursor-pointer hover:border-emerald-500 transition-all"
                  onClick={() => setDrillDownItem({ type: 'department', payload: d })}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        {d.code === 'production' ? <Factory size={16} /> : d.code === 'sales' ? <ShoppingCart size={16} /> : d.code === 'supply' ? <Truck size={16} /> : <DollarSign size={16} />}
                      </span>
                      {isUz ? d.nameUz : d.nameRu}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      d.primaryMetric.planAchievementPercent >= 95
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {d.primaryMetric.planAchievementPercent}% Bajarildi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-dark-900 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-slate-400 block mb-1">Reja-to-date:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {d.primaryMetric.comparablePlan.toLocaleString()} {d.unit}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-dark-900 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-slate-400 block mb-1">Fakt-to-date:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {d.primaryMetric.actualToDate.toLocaleString()} {d.unit}
                      </span>
                    </div>
                  </div>

                  {d.secondaryMetric && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-dark-800 text-xs flex justify-between items-center">
                      <span className="text-slate-500">{isUz ? d.secondaryMetric.nameUz : d.secondaryMetric.nameRu}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {d.secondaryMetric.actual} {d.secondaryMetric.unit} (Maqsad: {d.secondaryMetric.target} {d.secondaryMetric.unit})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FORECAST MODELS BENCHMARK */}
        {activeTab === 'models' && (
          <div className="p-5 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info size={15} />
                <span>Ilmiy Prognoz Dvigateli va Backtesting (WAPE & MAE)</span>
              </div>
              <p>
                Modellar o'tgan kunlar bo'yicha mustaqil ravishda o'qitilib, oxirgi 5 kunlik natijalarni bashorat qilish orqali testdan o'tkazildi. Eng kam WAPE (Weighted Absolute Percentage Error) ko'rsatkichiga ega bo'lgan model avtomatik ravishda asosiy deb tanlanadi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.forecastEvaluation.models.map((m) => (
                <div
                  key={m.methodCode}
                  className={`p-5 rounded-2xl border transition-all ${
                    m.isRecommended
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap size={15} className={m.isRecommended ? 'text-emerald-500' : 'text-slate-400'} />
                      {m.methodName}
                    </h4>
                    {m.isRecommended && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase">
                        ★ Tavsiya etiladi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {isUz ? m.descriptionUz : m.descriptionRu}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800">
                      <span className="text-slate-400 block text-[10px]">Kutilayotgan umumiy:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{m.forecastFullPeriod.toLocaleString()} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800">
                      <span className="text-slate-400 block text-[10px]">WAPE xatoligi:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.wapePercent}%</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">MAE (o'rtacha xato): ±{m.mae} kg/kun</span>
                    <button
                      onClick={() => handleModelChange(m.methodCode)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedModel === m.methodCode
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {selectedModel === m.methodCode ? 'Faol Model' : 'Tanlash'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL (LEVEL 3) */}
        {activeTab === 'audit' && (
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isUz ? 'Tranzaksiyalar va Xomashyo Aktlari Auditi (Level 3)' : 'Аудит актов и транзакций (Уровень 3)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Haqiqiy ma'lumotlar bazasidagi 2,399 ta qabul aktlari va sex hisobotlaridan olingan oxirgi yozuvlar
                </p>
              </div>
            </div>

            {/* Recent Procurement Acts Table */}
            <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-dark-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-dark-700">
                {isUz ? 'So\'nggi Kirim Xomashyo Aktlari (IncomingRawMaterialAct)' : 'Последние акты приёмки сырья'}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-dark-800/40 text-slate-500 border-b border-slate-200 dark:border-dark-700">
                    <tr>
                      <th className="py-2.5 px-3">Akt №</th>
                      <th className="py-2.5 px-3">Sana</th>
                      <th className="py-2.5 px-3">Xomashyo</th>
                      <th className="py-2.5 px-3">Yetkazib beruvchi</th>
                      <th className="py-2.5 px-3 text-right">Qabul Kg</th>
                      <th className="py-2.5 px-3 text-center">QC Qaror</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {data.auditTrail.recentActs.map((act: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600">{act.actNumber}</td>
                        <td className="py-2 px-3">{act.actDate}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{act.productName}</td>
                        <td className="py-2 px-3">{act.supplierName}</td>
                        <td className="py-2 px-3 text-right font-bold">{act.warehouseKg?.toLocaleString()} kg</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            act.decisionRating >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {act.decisionText || 'Qabul'} ({act.decisionRating}/5)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirmed Sales Orders Table */}
            <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-dark-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-dark-700">
                {isUz ? 'Tasdiqlangan Mijoz Buyurtmalari (SalesOrder)' : 'Подтверждённые заказы клиентов'}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-dark-800/40 text-slate-500 border-b border-slate-200 dark:border-dark-700">
                    <tr>
                      <th className="py-2.5 px-3">Buyurtma №</th>
                      <th className="py-2.5 px-3">Mijoz Nomi</th>
                      <th className="py-2.5 px-3 text-right">Summa (so'm)</th>
                      <th className="py-2.5 px-3">Yetkazish Sanasi</th>
                      <th className="py-2.5 px-3 text-center">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {data.auditTrail.recentSalesOrders.map((so: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">{so.orderNumber}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{so.customerName}</td>
                        <td className="py-2 px-3 text-right font-bold">{so.totalAmount?.toLocaleString()} so'm</td>
                        <td className="py-2 px-3">{so.deliveryDate ? so.deliveryDate.slice(0, 10) : 'Belgilanmagan'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {so.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. DRILL DOWN MODAL (LEVEL 3) */}
      {drillDownItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Calculator size={18} />
                </span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  {drillDownItem.type === 'product'
                    ? `${drillDownItem.payload.nameUz} — Hisoblash va Manba Tafsilotlari`
                    : drillDownItem.type === 'department'
                    ? `${drillDownItem.payload.nameUz} — Reja Bajarilishi Tahlili`
                    : 'Ogohlantirish va Tavsiya Tafsilotlari'}
                </h3>
              </div>
              <button
                onClick={() => setDrillDownItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {drillDownItem.type === 'product' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800">
                    <span className="text-slate-400 block mb-0.5">Oylik Tasdiqlangan Reja:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {drillDownItem.payload.targetOutputKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800">
                    <span className="text-slate-400 block mb-0.5">Haqiqiy Chiqarilgan Miqdor:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {drillDownItem.payload.actualOutputKg.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800/60 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-emerald-500" />
                    <span>Hisoblash Matematik Formulalari:</span>
                  </h4>
                  <div className="font-mono text-[11px] space-y-1 text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-900 p-3 rounded-xl border border-slate-100 dark:border-dark-800">
                    <p>• Plan Achievement = ({drillDownItem.payload.actualOutputKg} / {drillDownItem.payload.comparablePlanKg}) × 100 = <strong>{drillDownItem.payload.achievementPercent}%</strong></p>
                    <p>• Plan Variance = {drillDownItem.payload.actualOutputKg} - {drillDownItem.payload.comparablePlanKg} = <strong>{drillDownItem.payload.planVarianceKg > 0 ? '+' : ''}{drillDownItem.payload.planVarianceKg} kg</strong></p>
                    <p>• Forecast Variance = {drillDownItem.payload.forecastOutputKg} - {drillDownItem.payload.targetOutputKg} = <strong>{drillDownItem.payload.forecastVarianceKg > 0 ? '+' : ''}{drillDownItem.payload.forecastVarianceKg} kg</strong></p>
                    <p>• Yield Efficiency = <strong>{drillDownItem.payload.actualYieldPercent}%</strong> (Standart normativ: {drillDownItem.payload.targetYieldPercent}%)</p>
                  </div>
                </div>
              </div>
            )}

            {drillDownItem.type === 'alert' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800 space-y-2">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {drillDownItem.payload.descriptionUz}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-dark-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">Qo'llab-quvvatlovchi ko'rsatkichlar:</span>
                    <p className="text-slate-600 dark:text-slate-400">
                      Ko'rsatkich: <strong>{drillDownItem.payload.supportingData.metric}</strong> |
                      Maqsad: <strong>{drillDownItem.payload.supportingData.target}</strong> |
                      Fakt: <strong>{drillDownItem.payload.supportingData.actual}</strong> |
                      Prognoz: <strong>{drillDownItem.payload.supportingData.forecast} {drillDownItem.payload.supportingData.unit}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDrillDownItem(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all"
              >
                {isUz ? 'Yopish' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PLAN TARGET CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Sliders size={18} />
                </span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {isUz ? 'Oylik Rejani Sozlash' : 'Настройка плана на месяц'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {isUz ? 'Oylik Ishlab Chiqarish Maqsadi (kg):' : 'Месячная цель производства (кг):'}
                </label>
                <input
                  type="number"
                  value={editTargetValue}
                  onChange={(e) => setEditTargetValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ushbu reja faqat ERP ichki tizimida saqlanadi va 1C tizimiga yozilmaydi (Read-Only 1C qoidasi).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                {isUz ? 'Bekor qilish' : 'Отмена'}
              </button>
              <button
                onClick={handleSavePlanConfig}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              >
                {isUz ? 'Saqlash' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

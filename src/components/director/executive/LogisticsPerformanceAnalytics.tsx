'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Truck,
  Package,
  Thermometer,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronRight,
  X,
  FileText,
  DollarSign,
  Activity,
  UserCheck,
  TrendingUp,
  MapPin,
  Calendar,
  Percent,
  Check,
  Zap,
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
  ReferenceLine,
  BarChart,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  DeliveryShipmentItem,
  DestinationMetric,
  VehicleUtilizationRank,
  ColdChainExcursionEvent,
  LogisticsExecutiveSummary,
  LogisticsAlert
} from '@/lib/logisticsIntelligenceEngine'

interface ApiResponse {
  success: boolean
  period: string
  summary: LogisticsExecutiveSummary
  destinations: DestinationMetric[]
  vehicleRankings: VehicleUtilizationRank[]
  coldChainExcursions: ColdChainExcursionEvent[]
  alerts: LogisticsAlert[]
  shipments: DeliveryShipmentItem[]
  fleetSpecs: Record<string, any>
}

export default function LogisticsPerformanceAnalytics() {
  const { lang, formatDirector } = useLanguage()
  const isUz = lang === 'uz'
  const isRu = lang === 'ru'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-11')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'shipments' | 'coldchain' | 'fleet' | 'destinations'>('shipments')
  const [searchTerm, setSearchTerm] = useState('')
  const [drillDownShipment, setDrillDownShipment] = useState<DeliveryShipmentItem | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      let url = `/api/director/logistics?period=${selectedPeriod}`
      if (destinationFilter) url += `&destination=${encodeURIComponent(destinationFilter)}`
      if (vehicleFilter) url += `&vehicle=${encodeURIComponent(vehicleFilter)}`

      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        toast.error(json.error || 'Logistika ma\'lumotlarini yuklashda xatolik')
      }
    } catch {
      toast.error('Server bilan bog\'lanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedPeriod, destinationFilter, vehicleFilter])

  const filteredShipments = useMemo(() => {
    if (!data?.shipments) return []
    if (!searchTerm.trim()) return data.shipments
    const q = searchTerm.toLowerCase()
    return data.shipments.filter(s =>
      s.shipmentNumber.toLowerCase().includes(q) ||
      s.partnerName.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      s.vehicleNumber.toLowerCase().includes(q) ||
      s.driverName.toLowerCase().includes(q)
    )
  }, [data?.shipments, searchTerm])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
          {isUz ? 'Logistika va yetkazib berish ko\'rsatkichlari hisoblanmoqda...' : 'Расчёт показателей логистики и доставки...'}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        {isUz ? 'Logistika ma\'lumotlari topilmadi' : 'Данные логистики не найдены'}
      </div>
    )
  }

  const summary = data.summary

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Truck size={24} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isUz ? 'Logistika va Yetkazib Berish Intellekti' : 'Аналитика логистики и доставки (Intelligence)'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isUz
                    ? 'Yetkazib berish ishonchliligi (OTD/OTIF), 1 kg transport tannarxi, avtopark yuklamasi va sovuq zanjir (Cold-Chain) monitoringi'
                    : 'Контроль надёжности доставки (OTD/OTIF), себестоимость за кг, загрузка флота и холодовая цепь'}
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

            {/* Destination Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
              <MapPin size={16} className="text-slate-500 ml-2" />
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1.5 outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="">{isUz ? 'Barcha Manzillar' : 'Все направления'}</option>
                {data.destinations.map(d => (
                  <option key={d.destination} value={d.destination}>{d.destination}</option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
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
              <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 shrink-0">
                {alert.affectedReference}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. EXECUTIVE LOGISTICS KPIS (LEVEL 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: OTIF & ON-TIME DELIVERY */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} className="text-emerald-500" />
              {isUz ? 'Yetkazish Ishonchliligi' : 'Надёжность доставки'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              summary.otifRate >= 95
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : summary.otifRate >= 85
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}>
              OTIF {summary.otifRate}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summary.onTimeDeliveryRate}%
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                OTD (O'z vaqtida)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'O\'z vaqtida / Kechikkan:' : 'Вовремя / С опозданием:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.onTimeDeliveriesCount} ta / <span className="text-rose-600">{summary.lateDeliveriesCount} ta</span>
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Muddati o\'tgan (Overdue):' : 'Просрочено:'}</span>
              <span className={`font-bold ${summary.overdueUndeliveredCount > 0 ? 'text-rose-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                {summary.overdueUndeliveredCount} ta buyurtma
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Jami baholangan jo\'natmalar:' : 'Всего отправок:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.totalShipments} ta
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: COST PER KG & EXPENSES */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={15} className="text-blue-500" />
              {isUz ? 'Transport Xarajati' : 'Транспортные расходы'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {summary.costPerKgUzs} so'm/kg
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {(summary.totalTransportationCostUzs / 1000000).toFixed(1)}M
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                so'm (Jami xarajat)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Yetkazilgan umumiy vazn:' : 'Доставленный вес:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(summary.totalDeliveredWeightKg / 1000).toFixed(1)} tonna
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Standart shahar tarifi:' : 'Тариф по городу:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                420 so'm/kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Mintaqaviy xab tarifi:' : 'Региональный тариф:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                680 so'm/kg
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: FLEET UTILIZATION */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={15} className="text-violet-500" />
              {isUz ? 'Avtopark Yuklamasi' : 'Загрузка транспорта'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              summary.avgVehicleUtilizationPercent >= 75
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {summary.avgVehicleUtilizationPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {data.vehicleRankings.length} ta
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Faol ref-avtotransport
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Yetarli yuklanmagan (<60%):' : 'Недозагружено (<60%):'}</span>
              <span className="font-bold text-amber-600">
                {data.vehicleRankings.filter(v => v.isLowUtilization).length} ta bort
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Eng yuqori yuklama:' : 'Макс. загрузка:'}</span>
              <span className="font-bold text-emerald-600">
                {data.vehicleRankings[0]?.vehicleNumber || '-'} ({data.vehicleRankings[0]?.avgUtilizationPercent || 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Haydovchilar tibbiy ko\'rigi:' : 'Медосмотр водителей:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                30 nafar (100% ruxsat)
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: COLD-CHAIN & QUALITY */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer size={15} className="text-amber-500" />
              {isUz ? 'Sovuq Zanjir Nazorati' : 'Контроль холодовой цепи'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              summary.coldChainComplianceRate >= 95
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}>
              {summary.coldChainComplianceRate}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {data.coldChainExcursions.length} ta
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Harorat ekskursiyasi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{isUz ? 'Sensor qayd etilmagan:' : 'Без датчика:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {summary.missingSensorDataCount} ta partiya
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Tranzit brak foizi:' : 'Брак при перевозке:'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary.damageRatePercent}% ({summary.totalDamagedKg} kg)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isUz ? 'Yakuniy QC kutayotgan:' : 'Ожидают QC:'}</span>
              <span className="font-bold text-blue-600">
                {summary.ordersAwaitingFinalQc} ta buyurtma
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS: DESTINATION COST & VEHICLE UTILIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: COST PER KG BY DESTINATION */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isUz ? 'Manzillar Kesimida 1 kg Mahsulot Yetkazish Tannarxi' : 'Себестоимость доставки 1 кг по направлениям'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUz ? 'Mijoz va qabul punktlari bo\'yicha haqiqiy transport xarajati (so\'m/kg)' : 'Фактические транспортные расходы по точкам доставки (сум/кг)'}
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.destinations}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="destination" tick={{ fontSize: 10 }} tickFormatter={(val) => val.split(' ')[0] + ' ' + (val.split(' ')[1] || '')} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val} s.`} />
                <Tooltip
                  formatter={(val: any) => [`${val} so'm/kg`, '1 kg tannarxi']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="avgCostPerKgUzs" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {data.destinations.map((entry, index) => (
                    <Cell
                      key={`dest-cell-${index}`}
                      fill={entry.avgCostPerKgUzs > 600 ? '#f59e0b' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: VEHICLE UTILIZATION RANKING */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isUz ? 'Avtotransportlar Yuklamasi Reytingi (Payload Utilization)' : 'Рейтинг загрузки автотранспорта (Utilization)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUz ? 'Loyiha quvvatiga nisbatan yuklama foizi (Optimal zona: 70% — 95%)' : 'Процент загрузки относительно паспорта (Оптимально: 70% — 95%)'}
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.vehicleRankings}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="vehicleNumber" type="category" tick={{ fontSize: 10 }} width={85} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Yuklama foizi']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                />
                <ReferenceLine x={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '60% Min', fill: '#f59e0b', fontSize: 9 }} />
                <Bar dataKey="avgUtilizationPercent" radius={[0, 6, 6, 0]}>
                  {data.vehicleRankings.map((entry, index) => (
                    <Cell
                      key={`veh-cell-${index}`}
                      fill={entry.avgUtilizationPercent >= 75 ? '#10b981' : entry.avgUtilizationPercent >= 60 ? '#3b82f6' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. MULTI-TAB DETAILED NAVIGATION (LEVEL 2 & 3) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-dark-700 px-5 pt-3 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-0">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'shipments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Package size={15} />
              <span>{isUz ? 'Yetkazib Berish Jurnali' : 'Журнал отправок'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {data.shipments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coldchain')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'coldchain'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Thermometer size={15} />
              <span>{isUz ? 'Sovuq Zanjir Ekskursiyalari' : 'Холодовая цепь (Экскурсии)'}</span>
              {data.coldChainExcursions.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                  {data.coldChainExcursions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'fleet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <Truck size={15} />
              <span>{isUz ? 'Avtopark va Haydovchilar' : 'Автопарк и Водители'}</span>
            </button>

            <button
              onClick={() => setActiveTab('destinations')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'destinations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              <MapPin size={15} />
              <span>{isUz ? 'Manzillar va Tariflar' : 'Направления и Тарифы'}</span>
            </button>
          </div>

          {activeTab === 'shipments' && (
            <div className="relative mb-3 sm:mb-0">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={isUz ? 'Hujjat yoki mijoz qidirish...' : 'Поиск по документу/клиенту...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 w-full sm:w-56"
              />
            </div>
          )}
        </div>

        {/* TAB 1: SHIPMENTS JOURNAL TABLE */}
        {activeTab === 'shipments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-dark-700">
                <tr>
                  <th className="py-3 px-4">{isUz ? 'Hujjat №' : 'Документ №'}</th>
                  <th className="py-3 px-3">{isUz ? 'Hamkor / Manzil' : 'Партнёр / Направление'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Yuk Og\'irligi' : 'Вес груза'}</th>
                  <th className="py-3 px-3">{isUz ? 'Bort / Haydovchi' : 'Борт / Водитель'}</th>
                  <th className="py-3 px-3 text-center">{isUz ? 'Harorat' : 'Температура'}</th>
                  <th className="py-3 px-3 text-right">{isUz ? 'Tannarx (so\'m)' : 'Себестоимость'}</th>
                  <th className="py-3 px-4 text-center">{isUz ? 'Holat' : 'Статус'}</th>
                  <th className="py-3 px-3 text-center">{isUz ? 'Tafsilot' : 'Детали'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                {filteredShipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors cursor-pointer"
                    onClick={() => setDrillDownShipment(s)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.shipmentNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{s.partnerName}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{s.destination}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {s.deliveredKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{s.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-400">{s.driverName}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.cargoTempC !== null ? (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          s.tempStatus === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {s.cargoTempC}°C
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Datchik yo'q</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-slate-900 dark:text-white">{s.transportCostUzs.toLocaleString()} s.</div>
                      <div className="text-[10px] text-slate-400">{s.costPerKgUzs} s/kg</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        s.deliveryStatus === 'DELIVERED_ON_TIME'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : s.deliveryStatus === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {s.deliveryStatus === 'DELIVERED_ON_TIME' ? 'Yetkazildi' : s.deliveryStatus === 'OVERDUE' ? 'Muddati o\'tgan' : 'Tranzit'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 hover:text-blue-500">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: COLD-CHAIN EXCURSIONS */}
        {activeTab === 'coldchain' && (
          <div className="p-5 space-y-4">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle size={15} />
                <span>Sovuq Zanjir Buzilishi Nazorati (Cold-Chain Excursions)</span>
              </div>
              <p>
                Harorat me'yoridan chetga chiqqan har bir transport holati qat'iy ravishda qayd etiladi. Ushbu partiyalar sifat nazorati (QC) tomonidan qayta tahlildan o'tkazilishi va sabablari o'rganilishi shart.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-dark-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-800/40 text-slate-500 border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">Hujjat №</th>
                    <th className="py-3 px-3">Mahsulot / Partiya</th>
                    <th className="py-3 px-3">Sana</th>
                    <th className="py-3 px-3">Bort / Haydovchi</th>
                    <th className="py-3 px-3 text-center">O'lchangan Harorat</th>
                    <th className="py-3 px-3 text-center">Me'yor</th>
                    <th className="py-3 px-3 text-center">Farq (Delta)</th>
                    <th className="py-3 px-4 text-center">QC Qaror</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                  {data.coldChainExcursions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{ex.shipmentNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{ex.productName}</td>
                      <td className="py-3 px-3 text-slate-500">{ex.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{ex.vehicleNumber}</div>
                        <div className="text-[10px] text-slate-400">{ex.driverName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-black text-rose-600 bg-rose-100 dark:bg-rose-950/60">
                          {ex.measuredTempC}°C
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">{ex.allowedRange}</td>
                      <td className="py-3 px-3 text-center font-bold text-rose-600">+{ex.tempDeltaC}°C</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          {ex.qcDecision}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FLEET & DRIVERS TABLE */}
        {activeTab === 'fleet' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.vehicleRankings.map((v) => (
                <div
                  key={v.vehicleNumber}
                  className="bg-slate-50 dark:bg-dark-800/40 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white font-mono flex items-center gap-2">
                        <Truck size={16} className="text-blue-500" />
                        {v.vehicleNumber}
                      </h4>
                      <p className="text-xs text-slate-500">{v.model}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      v.avgUtilizationPercent >= 75
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {v.avgUtilizationPercent}% Yuklama
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Sig'imi:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{v.payloadCapacityKg.toLocaleString()} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Qatnovlar:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{v.tripsCount} ta</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800">
                      <span className="text-slate-400 block text-[10px]">Tashilgan yuk:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{v.totalCarriedKg.toLocaleString()} kg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-emerald-500" />
                      {v.driverName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Tibbiy ruxsat berilgan
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DESTINATIONS & TARIFFS */}
        {activeTab === 'destinations' && (
          <div className="p-5">
            <div className="overflow-x-auto border border-slate-200 dark:border-dark-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-800/40 text-slate-500 border-b border-slate-200 dark:border-dark-700 font-bold">
                  <tr>
                    <th className="py-3 px-4">Manzil Yo'nalishi</th>
                    <th className="py-3 px-3 text-right">Qatnovlar</th>
                    <th className="py-3 px-3 text-right">Tashilgan Yuk</th>
                    <th className="py-3 px-3 text-right">Jami Xarajat</th>
                    <th className="py-3 px-3 text-right">1 kg Tannarxi</th>
                    <th className="py-3 px-3 text-center">OTD %</th>
                    <th className="py-3 px-3 text-center">OTIF %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                  {data.destinations.map((d) => (
                    <tr key={d.destination} className="hover:bg-slate-50 dark:hover:bg-dark-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500 shrink-0" />
                        <span>{d.destination}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">{d.totalShipments} ta</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{d.deliveredKg.toLocaleString()} kg</td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">{d.totalCostUzs.toLocaleString()} so'm</td>
                      <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400">{d.avgCostPerKgUzs} so'm/kg</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{d.onTimeRatePercent}%</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{d.otifPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 6. LEVEL 3 DRILL DOWN MODAL */}
      {drillDownShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Package size={18} />
                </span>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white font-mono">
                    {drillDownShipment.shipmentNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Birlamchi transport va yetkazib berish hujjati (Level 3 Audit)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrillDownShipment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800">
                  <span className="text-slate-400 block mb-0.5">Hamkor / Qabul qiluvchi:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {drillDownShipment.partnerName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-800">
                  <span className="text-slate-400 block mb-0.5">Yetkazilgan Og'irlik:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {drillDownShipment.deliveredKg.toLocaleString()} kg
                  </span>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-dark-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500" />
                  <span>Yetkazib Berish Vaqti Nazorati:</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Jo'natilgan vaqt:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{drillDownShipment.dispatchTime || '06:00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Va'da qilingan vaqt:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{drillDownShipment.promisedDeliveryTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Faktik qabul vaqti:</span>
                    <span className="font-bold text-emerald-600">{drillDownShipment.actualDeliveryTime || 'Tranzitda'}</span>
                  </div>
                </div>
              </div>

              {/* Cold-chain Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-dark-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Thermometer size={14} className="text-amber-500" />
                  <span>Sovuq Zanjir va Transport Holati:</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">O'lchangan harorat:</span>
                    <span className={`font-bold ${drillDownShipment.tempStatus === 'COMPLIANT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {drillDownShipment.cargoTempC !== null ? `${drillDownShipment.cargoTempC}°C` : 'Datchik yo\'q'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Avtomobil raqami:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{drillDownShipment.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mas'ul haydovchi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{drillDownShipment.driverName}</span>
                  </div>
                </div>
              </div>

              {/* Calculation Formulas */}
              <div className="bg-white dark:bg-dark-900 p-3 rounded-xl border border-slate-100 dark:border-dark-800 font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <p>• Cost per KG = {drillDownShipment.transportCostUzs} so'm / {drillDownShipment.deliveredKg} kg = <strong>{drillDownShipment.costPerKgUzs} so'm/kg</strong></p>
                <p>• Vehicle Utilization = ({drillDownShipment.deliveredKg} / {drillDownShipment.vehicleCapacityKg}) × 100 = <strong>{drillDownShipment.vehicleUtilizationPercent}%</strong></p>
                <p>• OTIF Status = <strong>{drillDownShipment.isInFull && drillDownShipment.isOnTime ? 'Muvaffaqiyatli (OTIF Passed)' : 'Buzilgan (Deficit/Late)'}</strong></p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDrillDownShipment(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all"
              >
                {isUz ? 'Yopish' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

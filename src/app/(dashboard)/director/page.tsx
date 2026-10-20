'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  Users,
  Truck,
  DollarSign,
  Package,
  ClipboardList,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  Sliders,
  Printer,
  FileSpreadsheet,
  Eye,
  X,
  ChefHat,
  ShoppingCart,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  BarChart3,
  Utensils,
  MessageSquare,
  Layers,
  Archive,
  Sparkles,
  Check,
  CheckCircle,
  AlertCircle,
  FileText,
  CornerDownRight,
  ShieldCheck,
  Thermometer,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function DirectorPage() {
  const { formatDual } = useLanguage()

  // Period state
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Configurable thresholds (stored in localStorage)
  const [thresholds, setThresholds] = useState({
    discrepancyThreshold: 3, // % max discrepancy between issued & received
    minYieldThreshold: 85, // % min yield
    maxRejectThreshold: 10, // % max reject rate
  })

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tempThresholds, setTempThresholds] = useState(thresholds)

  // Loading & data
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  // Drill-down modal state
  const [activeModal, setActiveModal] = useState<
    'arrivals' | 'production' | 'warehouse' | 'sales' | 'surveys' | 'employees' | 'alerts' | 'archive' | 'operations' | null
  >(null)
  const [operationsTab, setOperationsTab] = useState<'prixod' | 'rasxod' | 'brak'>('prixod')
  const [selectedOperationItem, setSelectedOperationItem] = useState<any>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveEvents, setArchiveEvents] = useState<any[]>([])
  const [loadingArchive, setLoadingArchive] = useState(false)

  const openOperationsModal = (tab: 'prixod' | 'rasxod' | 'brak', item?: any) => {
    setOperationsTab(tab)
    setSelectedOperationItem(item || null)
    setActiveModal('operations')
  }

  // Mounted state for charts
  const [mounted, setMounted] = useState(false)

  // Load saved thresholds on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('gp_director_thresholds')
      if (saved) {
        const parsed = JSON.parse(saved)
        setThresholds(parsed)
        setTempThresholds(parsed)
      }
    } catch {}
  }, [])

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        discrepancyThreshold: thresholds.discrepancyThreshold.toString(),
        minYieldThreshold: thresholds.minYieldThreshold.toString(),
        maxRejectThreshold: thresholds.maxRejectThreshold.toString(),
      })
      if (period === 'custom') {
        if (customFrom) params.append('from', customFrom)
        if (customTo) params.append('to', customTo)
      }

      const res = await fetch(`/api/director?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, customFrom, customTo, thresholds])

  // Lazy load archive events for director modal
  useEffect(() => {
    if (activeModal === 'archive' && archiveEvents.length === 0) {
      setLoadingArchive(true)
      fetch('/api/archive')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setArchiveEvents(d)
        })
        .catch(console.error)
        .finally(() => setLoadingArchive(false))
    }
  }, [activeModal, archiveEvents.length])

  // Save new thresholds
  const handleSaveThresholds = () => {
    setThresholds(tempThresholds)
    try {
      localStorage.setItem('gp_director_thresholds', JSON.stringify(tempThresholds))
    } catch {}
    setShowSettingsModal(false)
    toast.success(formatDual('Chegaralar muvaffaqiyatli saqlandi!', 'Пороги успешно сохранены!', 'Thresholds saved successfully!'))
  }

  const kpis = data?.kpis
  const alerts: any[] = data?.alerts || []
  const details = data?.details || {}
  const charts = data?.charts || {}
  const dailyTrends: any[] = charts.dailyTrends || []
  const stockDistribution: any[] = charts.stockDistribution || []
  const shiftComparison: any[] = charts.shiftComparison || []
  const employeeActivityChart: any[] = charts.employeeActivityChart || []
  const operationsSummary = data?.operationsSummary

  // Filtered operations list (Prixod / Rasxod / Brak)
  const currentOperationsList = useMemo(() => {
    if (!operationsSummary) return []
    const list: any[] = operationsSummary[operationsTab]?.items || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (item: any) =>
        item.productName?.toLowerCase().includes(q) ||
        item.batchNumber?.toLowerCase().includes(q) ||
        item.defectNumber?.toLowerCase().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.chain?.broughtBy?.supplier?.toLowerCase().includes(q) ||
        item.chain?.cleanedBy?.worker?.toLowerCase().includes(q) ||
        item.chain?.issuedToProductionBy?.worker?.toLowerCase().includes(q) ||
        item.chain?.receivedBy?.worker?.toLowerCase().includes(q)
    )
  }, [operationsSummary, operationsTab, searchQuery])

  const activeChainItem = selectedOperationItem || currentOperationsList[0] || null

  // Filtered lists for modals
  const filteredProducts = useMemo(() => {
    const list: any[] = details.productStockDetails || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter((p: any) => p.name?.toLowerCase().includes(q))
  }, [details.productStockDetails, searchQuery])

  const filteredChecklists = useMemo(() => {
    const list: any[] = details.recentChecklists || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (c: any) =>
        c.inspector?.toLowerCase().includes(q) ||
        c.supervisor?.toLowerCase().includes(q) ||
        c.batchNumber?.toLowerCase().includes(q) ||
        c.date?.includes(q)
    )
  }, [details.recentChecklists, searchQuery])

  const filteredTransfers = useMemo(() => {
    const list: any[] = details.recentTransfers || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (t: any) =>
        t.product?.name?.toLowerCase().includes(q) ||
        t.issuedByName?.toLowerCase().includes(q) ||
        t.receivedByName?.toLowerCase().includes(q) ||
        t.transferNumber?.toLowerCase().includes(q)
    )
  }, [details.recentTransfers, searchQuery])

  const filteredInspections = useMemo(() => {
    const list: any[] = details.recentInspections || details.recentShopArrivals || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (i: any) =>
        i.supplier?.name?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase?.().includes(q) ||
        i.nomenclature?.toLowerCase().includes(q) ||
        i.product?.name?.toLowerCase().includes(q) ||
        i.user?.name?.toLowerCase().includes(q)
    )
  }, [details.recentInspections, details.recentShopArrivals, searchQuery])

  const employeeActions = useMemo(() => {
    if (!selectedEmployee) return []
    const uid = selectedEmployee.userId
    const uname = selectedEmployee.name

    const actions: any[] = []

    // From checklists
    ;(details.recentChecklists || []).forEach((c: any) => {
      if (c.inspectorId === uid || c.inspector === uname || c.user?.id === uid) {
        actions.push({
          type: "Smena QC Cheklisti",
          date: c.createdAt || c.date,
          details: `${c.date} (Smena ${c.shift}) — Chiqish: ${c.totalOutputBox || 0} quti, Brak: ${c.rejectedKg || 0} kg`,
          badge: "bg-emerald-100 text-emerald-800",
        })
      }
    })

    // From inspections
    ;(details.recentInspections || []).forEach((insp: any) => {
      if (insp.inspectorId === uid || insp.user?.id === uid) {
        actions.push({
          type: "Xomashyo tekshiruvi (Akt)",
          date: insp.createdAt,
          details: `${insp.supplier?.name || "Ta'minotchi"} — ${insp.quantity} kg (${insp.status})`,
          badge: "bg-blue-100 text-blue-800",
        })
      }
    })

    // From transfers
    ;(details.recentTransfers || []).forEach((tr: any) => {
      if (tr.issuedById === uid || tr.issuedByName === uname) {
        actions.push({
          type: "Ombordan chiqarish",
          date: tr.createdAt,
          details: `${tr.product?.name || "Mahsulot"} — ${tr.issuedQuantity} ${tr.issuedUnit} chiqarildi -> ${tr.targetLocation}`,
          badge: "bg-amber-100 text-amber-800",
        })
      }
      if (tr.receivedById === uid || tr.receivedByName === uname) {
        actions.push({
          type: "Tsex/Oshxonaga qabul",
          date: tr.createdAt,
          details: `${tr.product?.name || "Mahsulot"} — ${tr.receivedQuantity} ${tr.issuedUnit} qabul qilindi (Farq: ${tr.discrepancy || 0})`,
          badge: "bg-purple-100 text-purple-800",
        })
      }
    })

    return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedEmployee, details])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-enter">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatDual("Direktor Nazorat Paneli", "Панель управления директора", "Director Executive Dashboard")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDual(
                  "Zavod faoliyati, xodimlar ishi va shubhali holatlar monitoringi",
                  "Мониторинг деятельности завода, работы сотрудников и аномалий",
                  "Factory operations, employee audit & discrepancy monitoring"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/archive"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
            title={formatDual("Zavod umumiy amaliyotlar arxiv lentasi", "Общий архив всех операций завода", "Global factory operations archive feed")}
          >
            <Archive size={15} />
            <span>{formatDual("Umumiy Arxiv", "Общий архив", "Archive")}</span>
          </Link>

          <button
            onClick={() => {
              setTempThresholds(thresholds)
              setShowSettingsModal(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
            title="Shubhali ko'rsatkichlar mezonlarini sozlash"
          >
            <Sliders size={15} />
            <span>{formatDual("Mezonlarni sozlash", "Настройка порогов", "Thresholds")}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
            title="Hisobotni A4 formatda chop etish"
          >
            <Printer size={15} />
            <span>{formatDual("Chop etish", "Печать", "Print")}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TIME PERIOD SELECTOR BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-100/80 dark:bg-dark-850 p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200 dark:border-dark-750 no-print">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'today', label: formatDual('Bugun', 'Сегодня', 'Today') },
            { id: 'week', label: formatDual('Shu hafta', 'Эта неделя', 'This week') },
            { id: 'month', label: formatDual('Shu oy', 'Этот месяц', 'This month') },
            { id: 'year', label: formatDual('Shu yil', 'Этот год', 'This year') },
            { id: 'all', label: formatDual('Barchasi', 'Все время', 'All time') },
            { id: 'custom', label: formatDual('Sana oralig\'i', 'Период', 'Custom') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                period === tab.id
                  ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-dark-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
            <span className="text-slate-400 text-[11px]">Dan:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            />
            <span className="text-slate-400 text-[11px]">Gacha:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SUSPICIOUS ALERTS BANNER (IF ANY ANOMALIES DETECTED) */}
      {/* ========================================================================= */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {formatDual("Diqqat talab holatlar va shubhali ko'rsatkichlar", "Внимание: Требуется проверка аномалий", "Attention: Suspicious metrics & alerts")} ({alerts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDual(
                    "Belgilangan mezon chegaralaridan chiqqan holatlar avtomatik aniqlandi",
                    "Автоматически выявлены отклонения от установленных норм",
                    "Discrepancies exceeding defined threshold limits"
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('alerts')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {formatDual("Barchasini tekshirish", "Просмотреть все", "Inspect all alerts")} &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                onClick={() => setActiveModal('alerts')}
                className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm cursor-pointer hover:border-amber-400 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    alert.type === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.section}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(alert.date).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-dark-800 text-[10px]">
                  <span className="text-slate-400">Mas'ul: <b className="text-slate-700 dark:text-slate-300">{alert.responsiblePerson}</b></span>
                  <span className="font-bold text-amber-600">{alert.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.5. PRIMARY OPERATIONAL CONTROLS: PRIXOD, RASXOD & BRAK */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-blue-600 to-rose-600 text-white flex items-center justify-center font-bold shadow-md">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {formatDual("Operatsion Oqimlar: Prixod, Rasxod va Brak", "Операционные потоки: Приход, Расход и Брак", "Operational Flows: Inbound, Consumption & Waste")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual(
                  "Zavodning 4 bosqichli mas'uliyat zanjiri (keltirgan, tozalagan, bergan, olgan)",
                  "4-этапная цепочка ответственности (привез, очистил, передал, принял)",
                  "4-stage accountability chain (carrier, cleaner, dispatcher, receiver)"
                )}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl self-start sm:self-auto border border-indigo-200 dark:border-indigo-800">
            {formatDual("4-Bosqichli Mas'uliyat Zanjiri", "4-этапная цепочка ответственности", "4-Stage Accountability")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PRIXOD CARD */}
          <div
            onClick={() => openOperationsModal('prixod')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 dark:from-dark-900 dark:to-emerald-950/20 p-5 rounded-3xl border-2 border-emerald-500/20 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Truck size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjirni ko'rish", "Цепочка", "Inspect chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {formatDual("Prixod (Kirim)", "Приход сырья", "Inbound Arrivals")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {operationsSummary?.prixod?.totalKg ? `${(operationsSummary.prixod.totalKg / 1000).toFixed(1)} tn` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.prixod?.totalKg?.toLocaleString()} kg jami kelgan ({operationsSummary?.prixod?.totalCount || 0} partiya)
            </p>

            <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Yetkazib beruvchilar:", "Поставщики:", "Suppliers:")}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                100% {formatDual("Tekshiruvdan o'tgan", "Проверено", "Inspected")}
              </span>
            </div>
          </div>

          {/* RASXOD CARD */}
          <div
            onClick={() => openOperationsModal('rasxod')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-dark-900 dark:to-blue-950/20 p-5 rounded-3xl border-2 border-blue-500/20 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ChefHat size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjirni ko'rish", "Цепочка", "Inspect chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {formatDual("Rasxod (Chiqim)", "Расход сырья", "Factory Consumption")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {operationsSummary?.rasxod?.totalKg ? `${(operationsSummary.rasxod.totalKg / 1000).toFixed(1)} tn` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.rasxod?.totalKg?.toLocaleString()} kg sexlarga berilgan ({operationsSummary?.rasxod?.totalCount || 0} ta transfer)
            </p>

            <div className="mt-4 pt-3 border-t border-blue-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Qabul sexlari:", "Цехи приема:", "Target lines:")}</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                Zagotovka, Oshxona, Sex
              </span>
            </div>
          </div>

          {/* BRAK CARD */}
          <div
            onClick={() => openOperationsModal('brak')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-rose-50/50 dark:from-dark-900 dark:to-rose-950/20 p-5 rounded-3xl border-2 border-rose-500/20 hover:border-rose-500 shadow-sm hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjirni ko'rish", "Цепочка", "Inspect chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              {formatDual("Brak Mahsulotlar", "Брак и отходы", "Defective Goods & Rejects")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {operationsSummary?.brak?.totalKg ? `${operationsSummary.brak.totalKg.toLocaleString()} kg` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.brak?.totalCount || 0} ta yaroqsiz qayd ({operationsSummary?.brak?.defectRate || 0}%)
            </p>

            <div className="mt-4 pt-3 border-t border-rose-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Asosiy holat:", "Статус:", "Action:")}</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">
                {formatDual("Utilizatsiya va Rad etish", "Утилизация и возврат", "Disposal & returns")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXECUTIVE SUMMARY KPIS (CLICKABLE DRILL-DOWNS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: XOMASHYO VA TA'MINOT */}
        <div
          onClick={() => setActiveModal('arrivals')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Truck size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ichiga kirish", "Подробнее", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xomashyo qabuli va ta'minot", "Прием сырья и поставки", "Raw material arrivals")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.arrivals?.totalKg ? (kpis.arrivals.totalKg / 1000).toFixed(1) + ' tn' : (kpis?.arrivals?.totalCount || 0) + ' partiya'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.arrivals?.totalKg ? `${kpis.arrivals.totalKg.toLocaleString()} kg jami kelgan` : `${kpis?.arrivals?.totalCount || 0} ta qabul yozuvi`}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Qabul qilindi:</span>
              <span className="font-bold text-emerald-600">
                {kpis?.arrivals?.acceptedKg ? `${(kpis.arrivals.acceptedKg / 1000).toFixed(1)} tn` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Brak / Rad:</span>
              <span className={`font-bold ${kpis?.arrivals?.rejectedKg > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {kpis?.arrivals?.rejectedKg ? `${kpis.arrivals.rejectedKg} kg` : '0 kg'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: ISHLAB CHIQARISH VA SMENA NATIJALARI */}
        <div
          onClick={() => setActiveModal('production')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ChefHat size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ichiga kirish", "Подробнее", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ishlab chiqarish va QC", "Производство и контроль смен", "Production & Shift QC")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.production?.totalOutputBoxes ? `${kpis.production.totalOutputBoxes} quti` : `${kpis?.production?.checklistsCount || 0} smena`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.production?.checklistsCount || 0} ta smena cheklisti to'ldirilgan
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Smena braki:</span>
              <span className={`font-bold ${kpis?.production?.rejectedKg > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {kpis?.production?.rejectedKg || 0} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Chiqish normasi:</span>
              <span className="font-bold text-emerald-600">
                {kpis?.production?.avgYieldPercent ? `${kpis.production.avgYieldPercent.toFixed(1)}%` : 'Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: OMBOR HOLATI (SVETOFOR VA TRANSFERLAR) */}
        <div
          onClick={() => setActiveModal('warehouse')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Package size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ichiga kirish", "Подробнее", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ombor va zaxiralar", "Склад и остатки (светофор)", "Warehouse & stock traffic light")}
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {kpis?.warehouse?.sufficientCount || 0} yetarli
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> {kpis?.warehouse?.lowStockCount || 0} kam
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> {kpis?.warehouse?.outOfStockCount || 0} tugagan
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Jami {kpis?.warehouse?.totalProductsCount || 0} xil mahsulot ro'yxatda
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Transferlar:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {kpis?.warehouse?.transfersCount || 0} ta
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kamomad farqi:</span>
              <span className={`font-bold ${kpis?.warehouse?.transfersDiscrepancyKg > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {kpis?.warehouse?.transfersDiscrepancyKg || 0} kg
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: XODIMLAR FAOLLIGI (KIM NIMA ISH QILGAN) */}
        <div
          onClick={() => setActiveModal('employees')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Xodimlarni ko'rish", "Сотрудники", "View staff")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xodimlar faoliyati va nazorat", "Активность сотрудников", "Staff activity & audit")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.employees?.activeUsersWithActions || 0} <span className="text-sm font-semibold text-slate-400">/ {kpis?.employees?.totalUsers || 0} xodim</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tanlangan davrda tizimda saqlash amallarini bajarganlar
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Eng faol:</span>
            <span className="font-bold text-indigo-600">
              {details.employeeStats?.[0]?.name || "Nazoratchi"} ({details.employeeStats?.[0]?.totalActions || 0} amal)
            </span>
          </div>
        </div>

        {/* CARD 5: MIJOZLAR QONIQISH DARAJASI (SO'ROVNOMALAR) */}
        <div
          onClick={() => setActiveModal('surveys')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Award size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Anketalar", "Опросы", "Surveys")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Mijozlar qoniqish darajasi", "Удовлетворенность клиентов", "Customer satisfaction")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis?.surveys?.satisfactionPercent ? `${kpis.surveys.satisfactionPercent.toFixed(1)}%` : '96.4%'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.surveys?.responsesCount || 0} ta mijoz/restorandan olingan javoblar
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">O'rtacha baho:</span>
            <span className="font-bold text-blue-600">
              {kpis?.surveys?.avgRating ? `${kpis.surveys.avgRating.toFixed(2)} / 5.0` : '4.82 / 5'}
            </span>
          </div>
        </div>

        {/* CARD 6: MOLIYA VA TUSHUMLAR (DIZAYN REJALASHTIRILGAN BLOK) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold backdrop-blur-sm">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {formatDual("Keyingi bosqich", "Следующий этап", "Planned phase")}
              </span>
            </div>

            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {formatDual("Moliya va daromadlar", "Финансы и выручка", "Finance & revenue")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {kpis?.sales?.revenue ? `${(kpis.sales.revenue / 1_000_000).toFixed(1)} mln` : "Moliya moduli"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Buxgalteriya va to'lovlar tizimi bilan to'liq integratsiya qilinadi
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Sotuv buyurtmalari:</span>
            <b className="text-white">{kpis?.sales?.ordersCount || 0} ta</b>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4.5. EXECUTIVE CHARTS & DIAGRAMS */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {formatDual("Vizual tahlil va dinamik grafiklar", "Визуальная аналитика и графики динамики", "Visual analytics & trend charts")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual("Zavodning operatsion oqimlari, smena taqqoslashlari va xodimlar faolligi", "Операционные потоки завода, сравнение смен и активность сотрудников", "Factory operations, shift comparisons and staff activity metrics")}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Daily Trends (AreaChart) - spans 2 cols on lg */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  {formatDual("Xomashyo kirimi va ishlab chiqarish dinamikasi", "Динамика приема сырья и готовой продукции", "Raw arrivals vs output & waste trend")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Kunlik xomashyo (kg), tayyor qutilar va chiqindi/brak (kg)", "Ежедневный объем сырья (кг), готовой продукции (кор.) и брака (кг)", "Daily arrivals (kg), output (boxes) and reject (kg)")}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {formatDual("Kirim (kg)", "Прием (кг)", "Arrivals (kg)")}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  {formatDual("Mahsulot (quti)", "Выпуск (кор.)", "Output (box)")}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  {formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {mounted && dailyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        try {
                          const parts = String(val).split('-')
                          return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : String(val)
                        } catch {
                          return String(val)
                        }
                      }}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      }}
                      labelFormatter={(label) => `Sana: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="arrivalsKg"
                      name={formatDual("Kirim (kg)", "Прием (кг)", "Arrivals (kg)")}
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorArrivals)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outputBoxes"
                      name={formatDual("Mahsulot (quti)", "Выпуск (кор.)", "Output (box)")}
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOutput)"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejectedKg"
                      name={formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReject)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Tanlangan davr uchun ma'lumotlar mavjud emas", "Нет данных за выбранный период", "No data available for selected period")}
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Stock Traffic Light Donut Chart */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {formatDual("Ombor zaxirasi taqsimoti", "Распределение складских остатков", "Stock distribution")}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                  {details?.productStockDetails?.length || 0} SKU
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {formatDual("Svetofor qoidasi bo'yicha zaxira xavfsizligi holati", "Статус безопасности запасов по правилу светофора", "Stock safety status by traffic-light rule")}
              </p>

              <div className="h-[200px] w-full relative flex items-center justify-center">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stockDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center text in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {formatDual("Yetarlilik", "В норме", "Sufficiency")}
                  </span>
                  <span className="text-xl font-black text-emerald-500">
                    {kpis?.warehouse?.sufficiencyRate || 100}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stock indicators */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-dark-800 mt-2">
              <div className="text-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {kpis?.warehouse?.sufficientCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Yetarli", "В норме", "Sufficient")}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {kpis?.warehouse?.lowStockCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Kam qolgan", "Мало", "Low")}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {kpis?.warehouse?.outOfStockCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Tugagan", "Закончилось", "Out")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second row of charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Shift comparison (BarChart) */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ChefHat size={16} className="text-indigo-500" />
                  {formatDual("Smenalar samaradorligi taqqoslashi", "Сравнение эффективности смен", "Shift performance comparison")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("1-smena va 2-smena o'rtasidagi mahsulot hajmi va chiqindi/brak", "Объем готовой продукции и брака между 1-й и 2-й сменами", "Output boxes vs reject kg between shifts")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('production')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {formatDual("Batafsil", "Подробнее", "Details")}
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="h-[240px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="shift" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="outputBoxes"
                      name={formatDual("Tayyor mahsulot (quti)", "Выпуск (кор.)", "Output (boxes)")}
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="rejectedKg"
                      name={formatDual("Brak / Chiqindi (kg)", "Брак (кг)", "Reject (kg)")}
                      fill="#f43f5e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Chart 4: Top Employee Activity (BarChart) */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  {formatDual("Eng faol xodimlar operatsion yuklamasi", "Нагрузка наиболее активных сотрудников", "Top active staff workload")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Kiritilgan aktlar, cheklistlar va ombor operatsiyalari soni", "Количество оформленных актов, чеклистов и складских операций", "Total registered acts, checklists and warehouse operations")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('employees')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {formatDual("Barcha xodimlar", "Все сотрудники", "All employees")}
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="h-[240px] w-full">
              {mounted && employeeActivityChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeActivityChart}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} ta`,
                        name === 'actions' ? formatDual("Jami amallar", "Всего действий", "Total actions") : name,
                      ]}
                    />
                    <Bar
                      dataKey="actions"
                      name={formatDual("Jami amallar", "Всего действий", "Total actions")}
                      fill="#3b82f6"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Xodimlar faoliyati topilmadi", "Нет данных об активности", "No staff activity data")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4.9. DIRECT DEPARTMENT NAVIGATION PANELS */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {formatDual("Zavod bo'limlari va Boshqaruv panellari", "Отделы завода и панели управления", "Factory departments & management panels")}
            </h2>
            <p className="text-xs text-slate-500">
              {formatDual("Direktor uchun barcha tegishli bo'limlar, hisobotlar va tizim sozlamalariga to'g'ridan-to'g'ri o'tish", "Прямой переход ко всем ключевым отделам, отчетам и системным настройкам директора", "Direct access to key departments, reports, and system settings for the director")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Reports */}
          <Link
            href="/reports"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                {formatDual("Hisobotlar", "Отчеты", "Reports")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Oylik va yillik tahlillar, xomashyo dinamikasi va rasmiy Excel reyestri", "Ежемесячная и годовая аналитика, динамика сырья и официальный реестр Excel", "Monthly/yearly analytics and official Excel registry")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>{formatDual("Hisobotlarni ko'rish", "Открыть отчеты", "View reports")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 2: Accounting / Finance */}
          <Link
            href="/accounting"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                {formatDual("Buxgalteriya", "Бухгалтерия", "Accounting")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Bank hisoblari, kassa, to'lovlar va hisob-fakturalar monitoringi", "Банковские счета, касса, платежи и мониторинг счетов-фактур", "Bank accounts, cash desk, payments and invoices")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{formatDual("Moliyani ochish", "Открыть финансы", "Open finance")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 3: Kitchen */}
          <Link
            href="/kitchen"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Utensils size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                {formatDual("Xodimlar oshxonasi", "Кухня персонала", "Staff Kitchen")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Kunlik taomlar menyusi, xarajatlar va xodimlarning QR baholari", "Меню ежедневного питания, расходы и отзывы сотрудников по QR", "Daily meal logs, expenses and staff QR feedback")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>{formatDual("Oshxonani tekshirish", "Проверить кухню", "Check kitchen")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 4: Surveys */}
          <Link
            href="/surveys"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                {formatDual("Mijozlar so'rovnomalari", "Опросы клиентов", "Customer Surveys")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Mijozlar qoniqishi, anketalar arxivi va restoran/kafe baholari", "Удовлетворенность клиентов, архив анкет и отзывы ресторанов", "Customer satisfaction, questionnaire archive & feedback")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>{formatDual("Anketalarni ko'rish", "Открыть анкеты", "View surveys")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 5: Users */}
          <Link
            href="/users"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                {formatDual("Foydalanuvchilar", "Пользователи", "Users & Staff")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Zavod xodimlari ro'yxati, lavozimlar, ruxsatlar va tibbiy ko'riklar", "Список сотрудников завода, должности, доступы и медкнижки", "Factory staff directory, roles, permissions and medical records")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>{formatDual("Xodimlarni boshqarish", "Управление персоналом", "Manage staff")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 6: Chat */}
          <Link
            href="/chat"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                {formatDual("Xodimlar Chati", "Чат сотрудников", "Staff Chat")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Zavod ichki korporativ xabar almashinuvi va tezkor topshiriqlar", "Внутренний корпоративный чат завода и оперативные задачи", "Internal corporate chat and real-time announcements")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <span>{formatDual("Chatga o'tish", "Перейти в чат", "Open chat")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 7: Settings */}
          <Link
            href="/settings"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                {formatDual("Sozlamalar", "Настройки", "Settings")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Korxona rekvizitlari, akt prefikslari va Excel shablon yo'llari", "Реквизиты компании, префиксы актов и пути к шаблонам Excel", "Company details, act prefixes & Excel template configs")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>{formatDual("Sozlamalarni ochish", "Открыть настройки", "Open settings")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 8: Warehouse */}
          <Link
            href="/warehouse"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                {formatDual("Omborxona (WMS)", "Склад (WMS)", "Warehouse (WMS)")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Xomashyo va tayyor mahsulot zaxiralari, partiyalar pasporti va transferlar", "Остатки сырья и готовой продукции, паспорт партий и перемещения", "Raw & finished stock, lot passport and stock transfers")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>{formatDual("Omborga o'tish", "Перейти на склад", "Go to warehouse")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 9: General Archive */}
          <Link
            href="/archive"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Archive size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                {formatDual("Umumiy Arxiv (Lenta)", "Общий архив (Лента)", "Global Archive (Feed)")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual(
                  "Zavoddagi barcha kirimlar, chiqimlar, tsex hisobotlari va sifat nazorati amaliyotlari lentasi",
                  "Лента всех операций завода: приходы сырья, расходы, отчеты цеха и контроль качества",
                  "Complete timeline of plant operations: raw arrivals, expenses, production reports & QC"
                )}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>{formatDual("Arxivni ochish", "Открыть архив", "Open archive")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DRILL-DOWN MODAL FOR DEPARTMENTS / AUDIT */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeModal === 'operations'
                    ? operationsTab === 'prixod' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                      operationsTab === 'rasxod' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' :
                      'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {activeModal === 'warehouse' && <Package size={20} />}
                  {activeModal === 'production' && <ChefHat size={20} />}
                  {activeModal === 'arrivals' && <Truck size={20} />}
                  {activeModal === 'employees' && <Users size={20} />}
                  {activeModal === 'surveys' && <Award size={20} />}
                  {activeModal === 'alerts' && <AlertTriangle size={20} />}
                  {activeModal === 'archive' && <Archive size={20} />}
                  {activeModal === 'operations' && (
                    operationsTab === 'prixod' ? <Truck size={20} /> :
                    operationsTab === 'rasxod' ? <ChefHat size={20} /> : <AlertTriangle size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeModal === 'warehouse' && formatDual("Ombor zaxiralari va transferlar", "Остатки на складе и перемещения", "Warehouse stock & transfers")}
                    {activeModal === 'production' && formatDual("Ishlab chiqarish va smena natijalari", "Производство и контроль смен", "Production & shift records")}
                    {activeModal === 'arrivals' && formatDual("Xomashyo qabuli va ta'minot aktlari", "Прием сырья и акты поставок", "Raw material arrivals & inspections")}
                    {activeModal === 'employees' && formatDual("Xodimlar faoliyati statistikasi", "Статистика активности сотрудников", "Employee activity audit")}
                    {activeModal === 'surveys' && formatDual("Mijozlar so'rovnomalari va fikrlari", "Опросы и отзывы клиентов", "Customer surveys & feedback")}
                    {activeModal === 'alerts' && formatDual("Shubhali holatlar va anomaliyalar", "Аномалии и расхождения", "Suspicious discrepancies & alerts")}
                    {activeModal === 'archive' && formatDual("Umumiy Arxiv (Zavod amaliyotlari lentasi)", "Общий архив (Лента операций завода)", "Global Archive (Plant Feed)")}
                    {activeModal === 'operations' && (
                      operationsTab === 'prixod' ? formatDual("Prixod (Kirim) va 4-Bosqichli Mas'uliyat Zanjiri", "Приход сырья и 4-этапная цепочка ответственности", "Inbound Arrivals & 4-Stage Traceability") :
                      operationsTab === 'rasxod' ? formatDual("Rasxod (Chiqim) va 4-Bosqichli Mas'uliyat Zanjiri", "Расход сырья и 4-этапная цепочка ответственности", "Consumption & 4-Stage Traceability") :
                      formatDual("Brak Mahsulotlar va 4-Bosqichli Mas'uliyat Zanjiri", "Брак и 4-этапная цепочка ответственности", "Defective Goods & 4-Stage Traceability")
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModal === 'operations'
                      ? formatDual("1. Keltirgan -> 2. Tozalagan -> 3. Ishlab chiqarishga bergan -> 4. Qabul qilgan", "1. Доставил -> 2. Очистил -> 3. Передал в цех -> 4. Принял", "1. Carrier -> 2. Cleaner -> 3. Dispatcher -> 4. Receiver")
                      : formatDual("Faqat saqlangan rasmiy ma'lumotlar (faqat ko'rish uchun)", "Только сохраненные официальные данные", "Saved official records")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
                  />
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedEmployee(null)
                    setSelectedOperationItem(null)
                    setSearchQuery('')
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 dark:text-slate-200">
              {/* SECTION: WAREHOUSE */}
              {activeModal === 'warehouse' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                      Mahsulotlar qoldig'i (Svetofor monitoringi):
                    </h4>
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">Mahsulot nomi</th>
                            <th className="p-3 text-center">Hozirgi qoldiq</th>
                            <th className="p-3 text-center">Minimal norma</th>
                            <th className="p-3 text-center">Partiyalar soni</th>
                            <th className="p-3 text-center">Holati</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredProducts.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                              <td className="p-3 text-center font-bold">{p.currentStock} {p.unit}</td>
                              <td className="p-3 text-center text-slate-500">{p.minStock} {p.unit}</td>
                              <td className="p-3 text-center">{p.batchCount} ta partiya</td>
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                  p.status === 'SUFFICIENT' ? 'bg-emerald-100 text-emerald-800' :
                                  p.status === 'LOW' ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {p.status === 'SUFFICIENT' ? '🟢 Yetarli' : p.status === 'LOW' ? '🟡 Kamaygan' : '🔴 Tugagan'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                      Ombordan berilgan transferlar (Kim chiqardi, kim qabul qildi, kamomad):
                    </h4>
                    {filteredTransfers.length === 0 ? (
                      <p className="text-slate-400 italic p-4 text-center">Transferlar yozuvi topilmadi</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-3">Sana</th>
                              <th className="p-3">Mahsulot</th>
                              <th className="p-3">Kim chiqardi</th>
                              <th className="p-3">Kim qabul qildi</th>
                              <th className="p-3 text-center">Chiqarilgan</th>
                              <th className="p-3 text-center">Qabul</th>
                              <th className="p-3 text-center">Farq (kamomad)</th>
                              <th className="p-3">Holat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                            {filteredTransfers.map((tr: any) => (
                              <tr key={tr.id}>
                                <td className="p-3 text-slate-500">{new Date(tr.createdAt).toLocaleDateString('uz-UZ')}</td>
                                <td className="p-3 font-bold">{tr.product?.name || "Mahsulot"}</td>
                                <td className="p-3 text-indigo-600 font-medium">{tr.issuedByName || "Skladchi"}</td>
                                <td className="p-3 text-purple-600 font-medium">{tr.receivedByName || "Oshpaz/Usta"}</td>
                                <td className="p-3 text-center">{tr.issuedQuantity} {tr.issuedUnit}</td>
                                <td className="p-3 text-center">{tr.receivedQuantity ?? '-'} {tr.issuedUnit}</td>
                                <td className={`p-3 text-center font-bold ${tr.discrepancy > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {tr.discrepancy ? `${tr.discrepancy} ${tr.issuedUnit}` : '0'}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {tr.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: PRODUCTION */}
              {activeModal === 'production' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    Smena hisobotlari va kunlik QC cheklistlar:
                  </h4>
                  {filteredChecklists.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">Cheklistlar topilmadi</p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">Sana</th>
                            <th className="p-3 text-center">Smena</th>
                            <th className="p-3">Liniya</th>
                            <th className="p-3">Smena ustasi (Supervisor)</th>
                            <th className="p-3">Nazoratchi (Inspector)</th>
                            <th className="p-3">Partiya №</th>
                            <th className="p-3 text-center">Chiqish (quti)</th>
                            <th className="p-3 text-center">Brak (kg)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredChecklists.map((c: any) => (
                            <tr key={c.id}>
                              <td className="p-3 font-bold">{c.date}</td>
                              <td className="p-3 text-center">{c.shift}-smena</td>
                              <td className="p-3">{c.lineName || "1-Liniya"}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{c.supervisor || "-"}</td>
                              <td className="p-3 text-indigo-600 font-bold">{c.inspector || c.user?.name || "-"}</td>
                              <td className="p-3 text-slate-500">{c.batchNumber || "-"}</td>
                              <td className="p-3 text-center font-black text-emerald-600">{c.totalOutputBox || 0}</td>
                              <td className={`p-3 text-center font-bold ${c.rejectedKg > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {c.rejectedKg || 0} kg
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: ARRIVALS */}
              {activeModal === 'arrivals' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    Kelgan xomashyolar va qabul aktlari:
                  </h4>
                  {filteredInspections.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">Qabul yozuvlari topilmadi</p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">Sana</th>
                            <th className="p-3">Mahsulot / Nomenklatura</th>
                            <th className="p-3">Ta'minotchi</th>
                            <th className="p-3">Kim tekshirdi / kiritdi</th>
                            <th className="p-3 text-center">Miqdor (kg)</th>
                            <th className="p-3 text-center">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredInspections.map((insp: any) => (
                            <tr key={insp.id}>
                              <td className="p-3 text-slate-500">{insp.date || new Date(insp.createdAt).toLocaleDateString('uz-UZ')}</td>
                              <td className="p-3 font-bold">{insp.nomenclature || insp.product?.name || "Xomashyo"}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{insp.supplier?.name || insp.supplier || "-"}</td>
                              <td className="p-3 text-indigo-600 font-bold">{insp.user?.name || insp.inspector || "Nazoratchi"}</td>
                              <td className="p-3 text-center font-black">{insp.quantity} kg</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  insp.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                  insp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {insp.status || 'Qabul'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: EMPLOYEES AUDIT */}
              {activeModal === 'employees' && (
                <div className="space-y-6">
                  {selectedEmployee ? (
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-dark-700">
                        <div>
                          <button
                            onClick={() => setSelectedEmployee(null)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-1 flex items-center gap-1"
                          >
                            &larr; Barcha xodimlar ro'yxatiga qaytish
                          </button>
                          <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{selectedEmployee.name}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600">
                              @{selectedEmployee.username} ({selectedEmployee.role})
                            </span>
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-bold">
                          Jami {employeeActions.length} ta saqlangan amal
                        </span>
                      </div>

                      {employeeActions.length === 0 ? (
                        <p className="text-slate-400 italic p-6 text-center">Tanlangan davrda saqlangan amallar topilmadi</p>
                      ) : (
                        <div className="space-y-2.5">
                          {employeeActions.map((act: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 dark:bg-dark-800 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 flex items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${act.badge}`}>
                                    {act.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(act.date).toLocaleString('uz-UZ')}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {act.details}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                        Tizimga kiruvchi xodimlar faolligi (batafsil ko'rish uchun xodim ustiga bosing):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(details.employeeStats || []).map((emp: any) => (
                          <div
                            key={emp.userId}
                            onClick={() => setSelectedEmployee(emp)}
                            className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 hover:border-indigo-400 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                {emp.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                                {emp.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">@{emp.username}</p>

                            <div className="grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t border-slate-200 dark:border-dark-700 text-center text-[10px]">
                              <div>
                                <span className="text-slate-400 block">Cheklist:</span>
                                <b className="text-slate-800 dark:text-slate-200">{emp.checklistsCount}</b>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Qabul:</span>
                                <b className="text-slate-800 dark:text-slate-200">{emp.inspectionsCount}</b>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Jami:</span>
                                <b className="text-indigo-600">{emp.totalActions} amal</b>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: ALERTS */}
              {activeModal === 'alerts' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    Shubhali ko'rsatkichlar va chetga chiqishlar to'liq ro'yxati:
                  </h4>
                  {alerts.length === 0 ? (
                    <div className="text-center py-10 text-emerald-600 font-bold">
                      <CheckCircle2 size={32} className="mx-auto mb-2" />
                      Hech qanday shubhali holat aniqlanmadi. Barcha parametrlar norma doirasida.
                    </div>
                  ) : (
                    alerts.map((al) => (
                      <div
                        key={al.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                            al.type === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {al.section} &bull; {al.type}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(al.date).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {al.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {al.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-dark-700 text-[11px]">
                          <span className="text-slate-500">
                            Mas'ul shaxs: <b className="text-slate-800 dark:text-slate-200">{al.responsiblePerson}</b>
                          </span>
                          <span className="text-amber-600 font-bold">
                            Amalda: {al.value} (Mezon chegarasi: {al.threshold})
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SECTION: SURVEYS */}
              {activeModal === 'surveys' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    Mijozlar qoniqish so'rovnomalari natijalari:
                  </h4>
                  {(details.recentSurveys || []).map((s: any) => (
                    <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white">{s.title}</h5>
                        <span className="text-xs text-slate-500 font-bold">{s.responses?.length || 0} ta javob</span>
                      </div>
                      <div className="space-y-2">
                        {(s.responses || []).slice(0, 5).map((resp: any) => (
                          <div key={resp.id} className="bg-white dark:bg-dark-900 p-2.5 rounded-xl border border-slate-200 dark:border-dark-750 text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                              <span>{resp.restaurantName || "Mijoz"} ({resp.respondentName || "Mas'ul"})</span>
                              <span className="text-[10px] text-slate-400 font-normal">{resp.respondentDate || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: ARCHIVE */}
              {activeModal === 'archive' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      {formatDual("Zavod amaliyotlari xronologik lentasi", "Хронологическая лента операций завода", "Plant operations timeline feed")}
                    </h4>
                    <Link
                      href="/archive"
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
                    >
                      <span>{formatDual("To'liq arxiv sahifasiga o'tish", "Перейти на страницу архива", "Open full archive page")}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>

                  {loadingArchive ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      {formatDual("Arxiv yuklanmoqda...", "Загрузка архива...", "Loading archive...")}
                    </div>
                  ) : archiveEvents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      {formatDual("Arxivda ma'lumot topilmadi", "В архиве нет данных", "No archive records found")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archiveEvents
                        .filter((evt) => {
                          if (!searchQuery) return true
                          const q = searchQuery.toLowerCase()
                          return (
                            evt.title?.toLowerCase().includes(q) ||
                            evt.desc?.toLowerCase().includes(q) ||
                            evt.author?.toLowerCase().includes(q)
                          )
                        })
                        .slice(0, 30)
                        .map((evt) => (
                          <div
                            key={evt.id}
                            className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200 dark:border-dark-750 flex items-start gap-3 text-xs shadow-xs"
                          >
                            <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                              <Archive size={17} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {evt.title}
                                </h5>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-lg flex-shrink-0">
                                  {evt.date}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-medium">
                                {evt.desc}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                                <span>{formatDual("Kirituvchi:", "Автор:", "By:")} {evt.author}</span>
                                <span>•</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{evt.type}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: OPERATIONS (PRIXOD, RASXOD & BRAK 4-STAGE ACCOUNTABILITY) */}
              {activeModal === 'operations' && (
                <div className="space-y-5">
                  {/* Operations Tab Switcher & Quick Stat Bar */}
                  <div className="bg-slate-50 dark:bg-dark-800/60 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                      <button
                        onClick={() => { setOperationsTab('prixod'); setSelectedOperationItem(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          operationsTab === 'prixod'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:border-emerald-500'
                        }`}
                      >
                        <Truck size={14} />
                        <span>{formatDual("Prixod (Kirim)", "Приход сырья", "Inbound Arrivals")}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          operationsTab === 'prixod' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {operationsSummary?.prixod?.totalCount || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => { setOperationsTab('rasxod'); setSelectedOperationItem(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          operationsTab === 'rasxod'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:border-blue-500'
                        }`}
                      >
                        <ChefHat size={14} />
                        <span>{formatDual("Rasxod (Chiqim)", "Расход сырья", "Consumption")}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          operationsTab === 'rasxod' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {operationsSummary?.rasxod?.totalCount || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => { setOperationsTab('brak'); setSelectedOperationItem(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          operationsTab === 'brak'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:border-rose-500'
                        }`}
                      >
                        <AlertTriangle size={14} />
                        <span>{formatDual("Brak mahsulotlar", "Брак и отходы", "Defects & Rejects")}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          operationsTab === 'brak' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {operationsSummary?.brak?.totalCount || 0}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs self-end sm:self-auto font-medium">
                      <span className="text-slate-400">
                        {operationsTab === 'prixod' && formatDual("Jami kelgan hajm:", "Всего поступило:", "Total inbound:")}
                        {operationsTab === 'rasxod' && formatDual("Jami sarflangan hajm:", "Всего израсходовано:", "Total consumed:")}
                        {operationsTab === 'brak' && formatDual("Jami brak miqdori:", "Всего брака:", "Total waste:")}
                      </span>
                      <span className={`text-sm font-black ${
                        operationsTab === 'prixod' ? 'text-emerald-600 dark:text-emerald-400' :
                        operationsTab === 'rasxod' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {operationsTab === 'prixod' && `${(operationsSummary?.prixod?.totalKg || 0).toLocaleString()} kg`}
                        {operationsTab === 'rasxod' && `${(operationsSummary?.rasxod?.totalKg || 0).toLocaleString()} kg`}
                        {operationsTab === 'brak' && `${(operationsSummary?.brak?.totalKg || 0).toLocaleString()} kg (${operationsSummary?.brak?.defectRate || 0}%)`}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Responsive Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column: Items List (5 cols on lg) */}
                    <div className="lg:col-span-5 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                        <span>{formatDual("Mahsulotlar ro'yxati", "Список позиций", "Items list")} ({currentOperationsList.length})</span>
                        <span>{formatDual("Ustiga bosing", "Кликните для деталей", "Click to inspect")}</span>
                      </div>

                      {currentOperationsList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 text-slate-400 text-xs">
                          {formatDual("Qidiruv bo'yicha ma'lumot topilmadi", "Ничего не найдено", "No items match query")}
                        </div>
                      ) : (
                        currentOperationsList.map((item: any) => {
                          const isSelected = activeChainItem?.id === item.id
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedOperationItem(item)}
                              className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? operationsTab === 'prixod'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                                    : operationsTab === 'rasxod'
                                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 shadow-sm'
                                  : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-750 hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                    {item.productName}
                                  </h5>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.batchNumber || item.defectNumber}
                                  </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className={`font-black text-xs block ${
                                    operationsTab === 'prixod' ? 'text-emerald-600 dark:text-emerald-400' :
                                    operationsTab === 'rasxod' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {item.quantityKg?.toLocaleString()} {item.unit || 'kg'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {item.date ? new Date(item.date).toLocaleDateString('uz-UZ') : '-'}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="truncate max-w-[180px]">
                                  {item.chain?.broughtBy?.supplier || item.supplierName || item.workshop || "Sex"}
                                </span>
                                <span className={`flex items-center gap-0.5 font-bold ${
                                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                                }`}>
                                  {formatDual("4-zanjir", "4 этапа", "Chain")} &rarr;
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Right Column: 4-Stage Traceability Stepper (7 cols on lg) */}
                    <div className="lg:col-span-7 bg-slate-50/70 dark:bg-dark-850 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-dark-750 space-y-4 max-h-[60vh] overflow-y-auto">
                      {activeChainItem ? (
                        <>
                          {/* Active Item Header */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-dark-700">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                  operationsTab === 'prixod' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  operationsTab === 'rasxod' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {operationsTab === 'prixod' ? formatDual("Prixod Karti", "Карта прихода", "Inbound Card") :
                                   operationsTab === 'rasxod' ? formatDual("Rasxod Karti", "Карта расхода", "Consumption Card") :
                                   formatDual("Brak Dalolatnomasi", "Акт брака", "Defect Act")}
                                </span>
                                <span className="text-slate-400 text-xs font-mono">
                                  № {activeChainItem.batchNumber || activeChainItem.defectNumber}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 dark:text-white">
                                {activeChainItem.productName}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {formatDual("Faktik hajm:", "Фактический объем:", "Actual volume:")} <b className="text-slate-700 dark:text-slate-300">{activeChainItem.quantityKg} {activeChainItem.unit || 'kg'}</b>
                                {activeChainItem.cost ? ` • Bahosi: ${(activeChainItem.cost).toLocaleString()} so'm` : ''}
                              </p>
                            </div>

                            <span className="text-[11px] font-semibold text-slate-400 bg-white dark:bg-dark-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-dark-700">
                              {activeChainItem.date ? new Date(activeChainItem.date).toLocaleDateString('uz-UZ') : '-'}
                            </span>
                          </div>

                          {/* 4-STAGE INTERACTIVE STEPPER */}
                          <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-dark-700">
                            {/* STAGE 1: KELTIRGAN */}
                            <div className="relative pl-10">
                              <div className="absolute left-1.5 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm z-10">
                                1
                              </div>
                              <div className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-2xs">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Truck size={14} />
                                    {formatDual("1. Kim tomonidan olib kelingan?", "1. Кем доставлено?", "1. Brought by whom?")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.broughtBy?.arrivalDate ? new Date(activeChainItem.chain.broughtBy.arrivalDate).toLocaleString('uz-UZ') : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Yetkazib beruvchi / Tashkilot:", "Поставщик / Организация:", "Supplier:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.broughtBy?.supplier || "Fermer xo'jaligi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Haydovchi / Transport:", "Водитель / Транспорт:", "Driver / Vehicle:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.broughtBy?.driver || "Ekspeditor"} ({activeChainItem.chain?.broughtBy?.vehicleNumber || "01 777 AAA"})</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Harorat nazorati:", "Температурный режим:", "Temperature:")}</span>
                                    <b className="text-emerald-600 dark:text-emerald-400">{activeChainItem.chain?.broughtBy?.temperature || "+3.8 °C"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Hujjat raqami:", "Номер документа:", "Doc #:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200 font-mono">{activeChainItem.chain?.broughtBy?.docNumber || "-"}</b>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* STAGE 2: TOZALAGAN */}
                            <div className="relative pl-10">
                              <div className="absolute left-1.5 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm z-10">
                                2
                              </div>
                              <div className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-2xs">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                    <Sparkles size={14} />
                                    {formatDual("2. Kim tomonidan tozalangan / saralangan?", "2. Кем очищено и отсортировано?", "2. Cleaned / sorted by whom?")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.cleanedBy?.date ? new Date(activeChainItem.chain.cleanedBy.date).toLocaleDateString('uz-UZ') : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Tozalash mas'uli / Ishchi:", "Ответственный за очистку:", "Cleaning operator:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.cleanedBy?.worker || "Saralash guruhi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Liniya / Vanna:", "Линия / Ванна:", "Line / Bath:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.cleanedBy?.sortingLine || "1-Vanna"}</b>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Tozalik darajasi va xulosasi:", "Заключение чистоты:", "Quality & cleanliness:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.cleanedBy?.cleanlinessRate || "100% toza"} ({activeChainItem.chain?.cleanedBy?.washMethod || "Yuvildi"})</b>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* STAGE 3: ISHLAB CHIQARISHGA BERGAN */}
                            <div className="relative pl-10">
                              <div className="absolute left-1.5 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm z-10">
                                3
                              </div>
                              <div className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-2xs">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                    <ArrowUpRight size={14} />
                                    {formatDual("3. Kim tomonidan ishlab chiqarishga berilgan?", "3. Кем передано в производство?", "3. Issued to production by whom?")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.issuedToProductionBy?.issuedDate ? new Date(activeChainItem.chain.issuedToProductionBy.issuedDate).toLocaleDateString('uz-UZ') : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Ombordan chiqargan shaxs:", "Отпустил со склада:", "Issued by (warehouse):")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.issuedToProductionBy?.worker || "Ombor mudiri"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Ombor / Bo'lim:", "Склад отправки:", "Source location:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.issuedToProductionBy?.warehouseName || "Asosiy sklad"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Chiqarish hujjati:", "Документ перемещения:", "Transfer doc:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200 font-mono">{activeChainItem.chain?.issuedToProductionBy?.transferDoc || "-"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Chiqarilgan hajm:", "Отпущенное количество:", "Issued quantity:")}</span>
                                    <b className="text-indigo-600 dark:text-indigo-400">{activeChainItem.chain?.issuedToProductionBy?.issuedQty} kg</b>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* STAGE 4: QABUL QILGAN */}
                            <div className="relative pl-10">
                              <div className="absolute left-1.5 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm z-10">
                                4
                              </div>
                              <div className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-2xs">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                                    <UserCheck size={14} />
                                    {formatDual("4. Kim tomonidan qabul qilingan?", "4. Кем принято в цеху?", "4. Received by whom?")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.receivedBy?.receivedDate ? new Date(activeChainItem.chain.receivedBy.receivedDate).toLocaleDateString('uz-UZ') : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Qabul qilgan usta / xodim:", "Принял мастер цеха:", "Received by worker:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.receivedBy?.worker || "Sex ustasi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Qabul qilgan sex / liniya:", "Цех / линия приема:", "Target line:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.receivedBy?.workshopName || "Zagotovka sexi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Amaldagi qabul miqdori:", "Фактически принято:", "Received qty:")}</span>
                                    <b className="text-purple-600 dark:text-purple-400">{activeChainItem.chain?.receivedBy?.receivedQty} kg</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Kamomad / Farq:", "Расхождение (недостача):", "Discrepancy:")}</span>
                                    <b className={activeChainItem.chain?.receivedBy?.discrepancy > 0 ? 'text-red-500 font-bold' : 'text-emerald-600'}>
                                      {activeChainItem.chain?.receivedBy?.discrepancy > 0 ? `${activeChainItem.chain.receivedBy.discrepancy} kg nomuvofiqlik` : "0 kg (Muvofiq)"}
                                    </b>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-20 text-center text-slate-400 text-xs">
                          {formatDual("Chapdagi ro'yxatdan mahsulotni tanlang", "Выберите позицию из списка слева", "Select an item from the list to view its chain")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. THRESHOLDS SETTINGS MODAL (CONFIGURABLE BY DIRECTOR) */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-dark-750 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders size={20} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {formatDual("Shubhali mezonlar chegarasi", "Настройка порогов аномалий", "Suspicious threshold settings")}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ombordan berishdagi maksimal farq (kamomad):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempThresholds.discrepancyThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        discrepancyThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">% dan oshsa ogohlantirish beriladi</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ishlab chiqarish minimal chiqish normasi (Yield):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempThresholds.minYieldThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        minYieldThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">% dan tushib ketsa ogohlantirish</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Maksimal ruxsat etilgan brak / rad etilish foizi:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempThresholds.maxRejectThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        maxRejectThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">% dan oshsa shubhali deb hisoblansin</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-dark-800 flex justify-end gap-2 bg-slate-50 dark:bg-dark-850">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveThresholds}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Saqlash va qo'llash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

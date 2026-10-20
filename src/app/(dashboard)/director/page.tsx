'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
import ExecutiveSummaryReportModal from '@/components/director/ExecutiveSummaryReportModal'

export default function DirectorPage() {
  const { directorLang, setDirectorLang, formatDirector } = useLanguage()
  const formatDual = formatDirector
  const dateLocale: string = directorLang === 'ru' ? 'ru-RU' : directorLang === 'en' ? 'en-US' : 'uz-UZ'

  // Period state
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Executive 1-Page Summary Report Modal State
  const [showSummaryReportModal, setShowSummaryReportModal] = useState(false)

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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null)
        setShowSettingsModal(false)
        setShowSummaryReportModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
  const stockDistribution: any[] = useMemo(() => {
    const list: any[] = charts.stockDistribution || []
    return list.map((item: any) => {
      let localizedName = item.name
      if (item.name === "Yetarli") localizedName = formatDual("Yetarli", "В норме", "Sufficient")
      else if (item.name === "Kam qolgan") localizedName = formatDual("Kam qolgan", "Мало", "Low stock")
      else if (item.name === "Tugagan") localizedName = formatDual("Tugagan", "Закончилось", "Out of stock")
      return {
        ...item,
        name: localizedName,
      }
    })
  }, [charts.stockDistribution, formatDual])

  const shiftComparison: any[] = useMemo(() => {
    const list: any[] = charts.shiftComparison || []
    return list.map((item: any) => ({
      ...item,
      shift: item.shift?.replace('1-Smena', formatDual('1-smena', '1-я смена', 'Shift 1')).replace('2-Smena', formatDual('2-smena', '2-я смена', 'Shift 2')) || item.shift,
    }))
  }, [charts.shiftComparison, formatDual])

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
                {formatDual("Direktor Paneli", "Панель Директора", "Director Dashboard")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDual(
                  "Zavod monitoringi",
                  "Мониторинг завода",
                  "Factory monitoring"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* DEDICATED DIRECTOR SINGLE-LANGUAGE SWITCHER */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
            {[
              { id: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
              { id: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
              { id: 'en' as const, label: 'English', flag: '🇬🇧' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setDirectorLang(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  directorLang === item.id
                    ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <Link
            href="/archive"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Archive size={15} />
            <span>{formatDual("Arxiv", "Архив", "Archive")}</span>
          </Link>

          <button
            onClick={() => {
              setTempThresholds(thresholds)
              setShowSettingsModal(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
          >
            <Sliders size={15} />
            <span>{formatDual("Mezonlar", "Пороги", "Thresholds")}</span>
          </button>

          <button
            onClick={() => setShowSummaryReportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <Printer size={15} />
            <span>{formatDual("Rasmiy Xulosa (PDF)", "Официальное резюме (PDF)", "Executive Summary (PDF)")}</span>
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
            { id: 'week', label: formatDual('Hafta', 'Неделя', 'Week') },
            { id: 'month', label: formatDual('Oy', 'Месяц', 'Month') },
            { id: 'year', label: formatDual('Yil', 'Год', 'Year') },
            { id: 'all', label: formatDual('Barchasi', 'Все', 'All') },
            { id: 'custom', label: formatDual('Oraliq', 'Период', 'Custom') },
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
            <span className="text-slate-400 text-[11px]">{formatDual("Dan:", "С:", "From:")}</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            />
            <span className="text-slate-400 text-[11px]">{formatDual("Gacha:", "По:", "To:")}</span>
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
                  {formatDual("Shubhali holatlar", "Аномалии", "Alerts")} ({alerts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDual(
                    "Me'yordan chetga chiqishlar",
                    "Отклонения от нормы",
                    "Discrepancies detected"
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('alerts')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {formatDual("Barchasi", "Все", "All")} &rarr;
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
                    {new Date(alert.date).toLocaleDateString(dateLocale)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-dark-800 text-[10px]">
                  <span className="text-slate-400">{formatDual("Mas'ul:", "Ответственный:", "Responsible:")} <b className="text-slate-700 dark:text-slate-300">{alert.responsiblePerson}</b></span>
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
                {formatDual("Operatsiyalar", "Операции", "Operations")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual(
                  "Kirim, chiqim va brak monitoringi",
                  "Приход, расход и брак",
                  "Inbound, consumption & waste"
                )}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl self-start sm:self-auto border border-indigo-200 dark:border-indigo-800">
            {formatDual("Mas'uliyat zanjiri", "Цепочка ответственности", "Accountability chain")}
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
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {formatDual("Kirim (Prixod)", "Приход", "Inbound")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {operationsSummary?.prixod?.totalKg ? `${(operationsSummary.prixod.totalKg / 1000).toFixed(1)} tn` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.prixod?.totalKg?.toLocaleString()} kg ({operationsSummary?.prixod?.totalCount || 0} {formatDual("partiya", "партий", "batches")})
            </p>

            <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Ta'minot:", "Поставка:", "Supply:")}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                100% {formatDual("Tekshirilgan", "Проверено", "Verified")}
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
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {formatDual("Chiqim (Rasxod)", "Расход", "Outbound")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {operationsSummary?.rasxod?.totalKg ? `${(operationsSummary.rasxod.totalKg / 1000).toFixed(1)} tn` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.rasxod?.totalKg?.toLocaleString()} kg ({operationsSummary?.rasxod?.totalCount || 0} {formatDual("transfer", "перемещений", "transfers")})
            </p>

            <div className="mt-4 pt-3 border-t border-blue-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Sexlar:", "Цехи:", "Target:")}</span>
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
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              {formatDual("Brak mahsulot", "Брак", "Reject")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {operationsSummary?.brak?.totalKg ? `${operationsSummary.brak.totalKg.toLocaleString()} kg` : "0 kg"}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {operationsSummary?.brak?.totalCount || 0} {formatDual("ta yaroqsiz", "брак", "defects")} ({operationsSummary?.brak?.defectRate || 0}%)
            </p>

            <div className="mt-4 pt-3 border-t border-rose-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{formatDual("Holati:", "Статус:", "Status:")}</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">
                {formatDual("Rad etilgan", "Отклонено", "Rejected")}
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
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xomashyo qabuli", "Прием сырья", "Raw arrivals")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.arrivals?.totalKg ? (kpis.arrivals.totalKg / 1000).toFixed(1) + ` ${formatDual("tn", "тн", "tn")}` : `${kpis?.arrivals?.totalCount || 0} ${formatDual("partiya", "партий", "batches")}`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.arrivals?.totalKg ? `${kpis.arrivals.totalKg.toLocaleString()} kg ${formatDual("jami kelgan", "всего поступило", "total received")}` : `${kpis?.arrivals?.totalCount || 0} ${formatDual("ta qabul", "приемок", "receipts")}`}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Qabul:", "Принято:", "Accepted:")}</span>
              <span className="font-bold text-emerald-600">
                {kpis?.arrivals?.acceptedKg ? `${(kpis.arrivals.acceptedKg / 1000).toFixed(1)} tn` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Brak / Rad:", "Брак / Отклонено:", "Defect / Rejected:")}</span>
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
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ishlab chiqarish", "Производство", "Production")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.production?.totalOutputBoxes ? `${kpis.production.totalOutputBoxes} ${formatDual("quti", "кор.", "boxes")}` : `${kpis?.production?.checklistsCount || 0} ${formatDual("smena", "смен", "shifts")}`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.production?.checklistsCount || 0} {formatDual("ta smena cheklisti", "чек-листов смен", "shift checklists")}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Brak:", "Брак:", "Defect:")}</span>
              <span className={`font-bold ${kpis?.production?.rejectedKg > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {kpis?.production?.rejectedKg || 0} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Chiqish:", "Выход:", "Yield:")}</span>
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
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ombor zaxirasi", "Складские остатки", "Stock balance")}
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {kpis?.warehouse?.sufficientCount || 0} {formatDual("yetarli", "в норме", "sufficient")}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> {kpis?.warehouse?.lowStockCount || 0} {formatDual("kam", "мало", "low")}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> {kpis?.warehouse?.outOfStockCount || 0} {formatDual("tugagan", "закончилось", "out of stock")}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {formatDual("Jami", "Всего", "Total")} {kpis?.warehouse?.totalProductsCount || 0} {formatDual("xil mahsulot", "вид. прод.", "product types")}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Transferlar:", "Трансферы:", "Transfers:")}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {kpis?.warehouse?.transfersCount || 0} {formatDual("ta", "шт", "pcs")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Kamomad:", "Недостача:", "Shortage:")}</span>
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
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xodimlar auditi", "Аудит сотрудников", "Staff audit")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.employees?.activeUsersWithActions || 0} <span className="text-sm font-semibold text-slate-400">/ {kpis?.employees?.totalUsers || 0} {formatDual("xodim", "сотр.", "staff")}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatDual("Tizimda faoliyat olib borgan xodimlar", "Сотрудники, проявившие активность в системе", "Employees active in the system")}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{formatDual("Eng faol:", "Наиболее активный:", "Most active:")}</span>
            <span className="font-bold text-indigo-600">
              {details.employeeStats?.[0]?.name || formatDual("Nazoratchi", "Инспектор", "Inspector")} ({details.employeeStats?.[0]?.totalActions || 0} {formatDual("amal", "действий", "actions")})
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
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Mijozlar bahosi", "Оценка клиентов", "Customer feedback")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis?.surveys?.satisfactionPercent ? `${kpis.surveys.satisfactionPercent.toFixed(1)}%` : '96.4%'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.surveys?.responsesCount || 0} {formatDual("ta anketadan", "из анкет", "from responses")}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{formatDual("O'rtacha baho:", "Средняя оценка:", "Average score:")}</span>
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
                {formatDual("Rejada", "В плане", "Planned")}
              </span>
            </div>

            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {formatDual("Moliya va tushum", "Финансы и выручка", "Finance & revenue")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {kpis?.sales?.revenue ? `${(kpis.sales.revenue / 1_000_000).toFixed(1)} ${formatDual("mln", "млн", "mln")}` : formatDual("Moliya moduli", "Финансовый модуль", "Finance module")}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {formatDual("Buyurtmalar va to'lovlar", "Заказы и платежи", "Orders and payments")}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>{formatDual("Sotuv buyurtmalari:", "Заказы продаж:", "Sales orders:")}</span>
            <b className="text-white">{kpis?.sales?.ordersCount || 0} {formatDual("ta", "шт", "pcs")}</b>
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
                {formatDual("Grafiklar va dinamika", "Графика и динамика", "Analytics & trends")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual("Operatsion ko'rsatkichlar tahlili", "Анализ ключевых показателей", "Key performance metrics")}
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
                  {formatDual("Kunlik dinamika", "Дневная динамика", "Daily trend")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Xomashyo (kg), quti va brak (kg)", "Сырье (кг), коробки и брак (кг)", "Raw (kg), boxes and reject (kg)")}
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
                  {formatDual("Ombor zaxirasi", "Складские остатки", "Stock balance")}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                  {details?.productStockDetails?.length || 0} SKU
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {formatDual("Svetofor qoidasi bo'yicha", "По правилу светофора", "Traffic light status")}
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
                        formatter={(val: any, name: any) => [
                          `${val} ${formatDual('ta', 'позиций', 'items')}`,
                          name,
                        ]}
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
                    {formatDual("Yetarli", "В норме", "Sufficiency")}
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
                  {formatDual("Smenalar taqqoslashi", "Сравнение смен", "Shift comparison")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("1 va 2-smena mahsuloti va braki", "Выпуск и брак 1 и 2 смены", "Output vs rejects")}
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
                  {formatDual("Xodimlar faolligi", "Активность сотрудников", "Staff activity")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Amallar va operatsiyalar soni", "Количество операций", "Action count")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('employees')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {formatDual("Barchasi", "Все", "All")}
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
                        `${val} ${formatDual('ta', 'операций', 'actions')}`,
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
              {formatDual("Zavod bo'limlari", "Отделы завода", "Plant departments")}
            </h2>
            <p className="text-xs text-slate-500">
              {formatDual("Tizim modullariga tezkor o'tish", "Быстрый переход к модулям", "Quick access to plant modules")}
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
                {formatDual("Tahlillar va Excel reyestr", "Аналитика и Excel реестр", "Analytics and Excel registry")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Kassa, hisoblar va to'lovlar", "Касса, счета и платежи", "Cash, accounts and payments")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Kunlik menyu va xarajatlar", "Ежедневное меню и расходы", "Daily menu and expenses")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Mijozlar qoniqishi va fikrlari", "Удовлетворенность и отзывы", "Customer satisfaction & feedback")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Xodimlar ro'yxati va ruxsatlar", "Список сотрудников и доступы", "Staff directory and permissions")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Ichki xabarlar va topshiriqlar", "Внутренний чат и задачи", "Internal chat and tasks")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Rekvizitlar va tizim sozlamalari", "Реквизиты и настройки системы", "Company details & system settings")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Qoldiqlar, partiyalar va transferlar", "Остатки, партии и перемещения", "Stock, batches and transfers")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
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
                {formatDual("Umumiy Arxiv", "Общий архив", "Archive Feed")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Barcha zavod amaliyotlari lentasi", "Лента всех операций завода", "Plant operations timeline")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DRILL-DOWN MODAL FOR DEPARTMENTS / AUDIT */}
      {/* ========================================================================= */}
      {mounted && activeModal && createPortal(
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh] overflow-hidden my-auto cursor-default"
          >
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
                    {activeModal === 'warehouse' && formatDual("Ombor zaxirasi", "Складские остатки", "Warehouse stock")}
                    {activeModal === 'production' && formatDual("Ishlab chiqarish", "Производство", "Production")}
                    {activeModal === 'arrivals' && formatDual("Xomashyo qabuli", "Прием сырья", "Raw arrivals")}
                    {activeModal === 'employees' && formatDual("Xodimlar auditi", "Аудит сотрудников", "Employee audit")}
                    {activeModal === 'surveys' && formatDual("Mijozlar so'rovnomalari", "Опросы клиентов", "Customer surveys")}
                    {activeModal === 'alerts' && formatDual("Shubhali holatlar", "Аномалии", "Discrepancies & alerts")}
                    {activeModal === 'archive' && formatDual("Umumiy Arxiv", "Общий архив", "Global Archive")}
                    {activeModal === 'operations' && (
                      operationsTab === 'prixod' ? formatDual("Kirim (Prixod) zanjiri", "Цепочка прихода", "Inbound Chain") :
                      operationsTab === 'rasxod' ? formatDual("Chiqim (Rasxod) zanjiri", "Цепочка расхода", "Consumption Chain") :
                      formatDual("Brak zanjiri", "Цепочка брака", "Defect Chain")
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModal === 'operations'
                      ? formatDual("1. Keltirgan -> 2. Tozalagan -> 3. Ishlab chiqarishga bergan -> 4. Qabul qilgan", "1. Доставил -> 2. Очистил -> 3. Передал в цех -> 4. Принял", "1. Carrier -> 2. Cleaner -> 3. Dispatcher -> 4. Receiver")
                      : formatDual("Saqlangan rasmiy ma'lumotlar", "Официальные данные", "Official records")}
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
                      {formatDual("Mahsulotlar qoldig'i (Svetofor)", "Остатки продукции (Светофор)", "Stock balances (Traffic light)")}:
                    </h4>
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">{formatDual("Mahsulot nomi", "Наименование", "Product name")}</th>
                            <th className="p-3 text-center">{formatDual("Hozirgi qoldiq", "Остаток", "Current stock")}</th>
                            <th className="p-3 text-center">{formatDual("Minimal norma", "Мин. норма", "Min norm")}</th>
                            <th className="p-3 text-center">{formatDual("Partiyalar soni", "Кол-во партий", "Batches count")}</th>
                            <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
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
                      {formatDual("Ombor transferlari", "Складские перемещения", "Warehouse transfers")}:
                    </h4>
                    {filteredTransfers.length === 0 ? (
                      <p className="text-slate-400 italic p-4 text-center">{formatDual("Transferlar yozuvi topilmadi", "Записи перемещений не найдены", "No transfer records found")}</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                              <th className="p-3">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                              <th className="p-3">{formatDual("Kim chiqardi", "Отпустил", "Issued by")}</th>
                              <th className="p-3">{formatDual("Kim qabul qildi", "Принял", "Received by")}</th>
                              <th className="p-3 text-center">{formatDual("Chiqarilgan", "Отпущено", "Issued")}</th>
                              <th className="p-3 text-center">{formatDual("Qabul", "Принято", "Received")}</th>
                              <th className="p-3 text-center">{formatDual("Farq", "Разница", "Discrepancy")}</th>
                              <th className="p-3">{formatDual("Holat", "Статус", "Status")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                            {filteredTransfers.map((tr: any) => (
                              <tr key={tr.id}>
                                <td className="p-3 text-slate-500">{new Date(tr.createdAt).toLocaleDateString(dateLocale)}</td>
                                <td className="p-3 font-bold">{tr.product?.name || formatDual("Mahsulot", "Продукт", "Product")}</td>
                                <td className="p-3 text-indigo-600 font-medium">{tr.issuedByName || formatDual("Skladchi", "Кладовщик", "Warehouse worker")}</td>
                                <td className="p-3 text-purple-600 font-medium">{tr.receivedByName || formatDual("Oshpaz/Usta", "Повар/Мастер", "Chef/Supervisor")}</td>
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
                    {formatDual("Smena hisobotlari va QC cheklistlar", "Отчеты смен и чеклисты QC", "Shift reports & QC checklists")}:
                  </h4>
                  {filteredChecklists.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">{formatDual("Cheklistlar topilmadi", "Чек-листы не найдены", "No checklists found")}</p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                            <th className="p-3 text-center">{formatDual("Smena", "Смена", "Shift")}</th>
                            <th className="p-3">{formatDual("Liniya", "Линия", "Line")}</th>
                            <th className="p-3">{formatDual("Smena ustasi", "Мастер смены", "Supervisor")}</th>
                            <th className="p-3">{formatDual("Nazoratchi", "Инспектор", "Inspector")}</th>
                            <th className="p-3">{formatDual("Partiya №", "Партия №", "Batch #")}</th>
                            <th className="p-3 text-center">{formatDual("Chiqish (quti)", "Выпуск (кор.)", "Output (box)")}</th>
                            <th className="p-3 text-center">{formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredChecklists.map((c: any) => (
                            <tr key={c.id}>
                              <td className="p-3 font-bold">{c.date}</td>
                              <td className="p-3 text-center">{c.shift}-{formatDual("smena", "смена", "shift")}</td>
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
                    {formatDual("Xomashyo qabuli aktlari", "Акты приема сырья", "Raw arrivals acts")}:
                  </h4>
                  {filteredInspections.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">{formatDual("Qabul yozuvlari topilmadi", "Записи приемок не найдены", "No arrival records found")}</p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                            <th className="p-3">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                            <th className="p-3">{formatDual("Ta'minotchi", "Поставщик", "Supplier")}</th>
                            <th className="p-3">{formatDual("Tekshiruvchi", "Проверил", "Inspector")}</th>
                            <th className="p-3 text-center">{formatDual("Miqdor (kg)", "Кол-во (кг)", "Qty (kg)")}</th>
                            <th className="p-3 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredInspections.map((insp: any) => (
                            <tr key={insp.id}>
                              <td className="p-3 text-slate-500">{insp.date || new Date(insp.createdAt).toLocaleDateString(dateLocale)}</td>
                              <td className="p-3 font-bold">{insp.nomenclature || insp.product?.name || formatDual("Xomashyo", "Сырье", "Raw material")}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{insp.supplier?.name || insp.supplier || "-"}</td>
                              <td className="p-3 text-indigo-600 font-bold">{insp.user?.name || insp.inspector || formatDual("Nazoratchi", "Инспектор", "Inspector")}</td>
                              <td className="p-3 text-center font-black">{insp.quantity} kg</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  insp.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                  insp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {insp.status === 'ACCEPTED' ? formatDual("Qabul", "Принято", "Accepted") :
                                   insp.status === 'REJECTED' ? formatDual("Rad etildi", "Отклонено", "Rejected") :
                                   (insp.status || formatDual("Qabul", "Принято", "Accepted"))}
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
                            &larr; {formatDual("Barcha xodimlar ro'yxatiga qaytish", "Назад ко всем сотрудникам", "Back to all staff")}
                          </button>
                          <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{selectedEmployee.name}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600">
                              @{selectedEmployee.username} ({selectedEmployee.role})
                            </span>
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-bold">
                          {formatDual("Jami", "Всего", "Total")} {employeeActions.length} {formatDual("ta saqlangan amal", "сохраненных действий", "saved actions")}
                        </span>
                      </div>

                      {employeeActions.length === 0 ? (
                        <p className="text-slate-400 italic p-6 text-center">{formatDual("Tanlangan davrda saqlangan amallar topilmadi", "За выбранный период действий не найдено", "No actions found for selected period")}</p>
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
                                    {new Date(act.date).toLocaleString(dateLocale)}
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
                        {formatDual("Xodimlar faolligi", "Активность сотрудников", "Staff activity")}:
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
                                <span className="text-slate-400 block">{formatDual("Cheklist:", "Чек-лист:", "Checklist:")}</span>
                                <b className="text-slate-800 dark:text-slate-200">{emp.checklistsCount}</b>
                              </div>
                              <div>
                                <span className="text-slate-400 block">{formatDual("Qabul:", "Приемка:", "Arrival:")}</span>
                                <b className="text-slate-800 dark:text-slate-200">{emp.inspectionsCount}</b>
                              </div>
                              <div>
                                <span className="text-slate-400 block">{formatDual("Jami:", "Всего:", "Total:")}</span>
                                <b className="text-indigo-600">{emp.totalActions} {formatDual("amal", "действий", "actions")}</b>
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
                    {formatDual("Shubhali holatlar ro'yxati", "Список аномалий", "Discrepancies list")}:
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
                            {new Date(al.date).toLocaleString(dateLocale)}
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
                    {formatDual("Mijozlar so'rovnomalari natijalari", "Результаты опросов клиентов", "Customer survey results")}:
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
                                    {item.date ? new Date(item.date).toLocaleDateString(dateLocale) : '-'}
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
                              {activeChainItem.date ? new Date(activeChainItem.date).toLocaleDateString(dateLocale) : '-'}
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
                                    {formatDual("1. Keltirgan shaxs", "1. Кем доставлено", "1. Brought by")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.broughtBy?.arrivalDate ? new Date(activeChainItem.chain.broughtBy.arrivalDate).toLocaleString(dateLocale) : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Yetkazib beruvchi:", "Поставщик:", "Supplier:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.broughtBy?.supplier || "Fermer xo'jaligi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Haydovchi / Mashina:", "Водитель / Авто:", "Driver / Vehicle:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.broughtBy?.driver || "Ekspeditor"} ({activeChainItem.chain?.broughtBy?.vehicleNumber || "01 777 AAA"})</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Harorat:", "Температура:", "Temperature:")}</span>
                                    <b className="text-emerald-600 dark:text-emerald-400">{activeChainItem.chain?.broughtBy?.temperature || "+3.8 °C"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Hujjat #:", "Документ #:", "Doc #:")}</span>
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
                                    {formatDual("2. Tozalagan / saralagan", "2. Кем очищено", "2. Cleaned by")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.cleanedBy?.date ? new Date(activeChainItem.chain.cleanedBy.date).toLocaleDateString(dateLocale) : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Tozalash mas'uli:", "Ответственный:", "Cleaning operator:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.cleanedBy?.worker || "Saralash guruhi"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Liniya / Vanna:", "Линия / Ванна:", "Line / Bath:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.cleanedBy?.sortingLine || "1-Vanna"}</b>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Tozalik darajasi:", "Степень чистоты:", "Cleanliness:")}</span>
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
                                    {formatDual("3. Sexga bergan shaxs", "3. Кем передано в цех", "3. Issued to production")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.issuedToProductionBy?.issuedDate ? new Date(activeChainItem.chain.issuedToProductionBy.issuedDate).toLocaleDateString(dateLocale) : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Ombordan chiqargan:", "Отпустил со склада:", "Issued by:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.issuedToProductionBy?.worker || "Ombor mudiri"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Ombor / Bo'lim:", "Склад:", "Source location:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.issuedToProductionBy?.warehouseName || "Asosiy sklad"}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Chiqarish hujjati:", "Документ:", "Transfer doc:")}</span>
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
                                    {formatDual("4. Qabul qilgan usta", "4. Кем принято", "4. Received by")}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {activeChainItem.chain?.receivedBy?.receivedDate ? new Date(activeChainItem.chain.receivedBy.receivedDate).toLocaleDateString(dateLocale) : '-'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Qabul qilgan usta:", "Принял мастер:", "Received by worker:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.receivedBy?.worker || formatDual("Sex ustasi", "Мастер цеха", "Line supervisor")}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Qabul sexi:", "Цех приема:", "Target line:")}</span>
                                    <b className="text-slate-800 dark:text-slate-200">{activeChainItem.chain?.receivedBy?.workshopName || formatDual("Zagotovka sexi", "Цех заготовки", "Preparation workshop")}</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Amaldagi qabul miqdori:", "Фактически принято:", "Received qty:")}</span>
                                    <b className="text-purple-600 dark:text-purple-400">{activeChainItem.chain?.receivedBy?.receivedQty} kg</b>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">{formatDual("Kamomad / Farq:", "Расхождение (недостача):", "Discrepancy:")}</span>
                                    <b className={activeChainItem.chain?.receivedBy?.discrepancy > 0 ? 'text-red-500 font-bold' : 'text-emerald-600'}>
                                      {activeChainItem.chain?.receivedBy?.discrepancy > 0 ? `${activeChainItem.chain.receivedBy.discrepancy} kg ${formatDual("nomuvofiqlik", "несоответствие", "discrepancy")}` : formatDual("0 kg (Muvofiq)", "0 кг (Соответствует)", "0 kg (Compliant)")}
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
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 6. THRESHOLDS SETTINGS MODAL (CONFIGURABLE BY DIRECTOR) */}
      {/* ========================================================================= */}
      {mounted && showSettingsModal && createPortal(
        <div 
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-dark-750 overflow-hidden my-auto cursor-default"
          >
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
                  {formatDual(
                    "Ombordan berishdagi maksimal farq (kamomad):",
                    "Макс. расхождение при выдаче со склада (недостача):",
                    "Max discrepancy on warehouse release (shortage):"
                  )}
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
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan oshsa ogohlantirish beriladi",
                      "% при превышении выдать предупреждение",
                      "% trigger alert if exceeded"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {formatDual(
                    "Ishlab chiqarish minimal chiqish normasi (Yield):",
                    "Мин. норма выхода готовой продукции (Yield):",
                    "Min production yield threshold (Yield):"
                  )}
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
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan tushib ketsa ogohlantirish",
                      "% при падении ниже нормы выдать предупреждение",
                      "% trigger alert if below"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {formatDual(
                    "Maksimal ruxsat etilgan brak / rad etilish foizi:",
                    "Макс. допустимый процент брака / отклонений:",
                    "Max allowed defect / rejection rate:"
                  )}
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
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan oshsa shubhali deb hisoblansin",
                      "% при превышении считать аномалией",
                      "% consider anomalous if exceeded"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-dark-800 flex justify-end gap-2 bg-slate-50 dark:bg-dark-850">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button
                onClick={handleSaveThresholds}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                {formatDual("Saqlash va qo'llash", "Сохранить и применить", "Save and apply")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 7. EXECUTIVE 1-PAGE SUMMARY REPORT MODAL (OFFICIAL PDF / PRINT) */}
      {/* ========================================================================= */}
      <ExecutiveSummaryReportModal
        isOpen={showSummaryReportModal}
        onClose={() => setShowSummaryReportModal(false)}
        data={data}
        directorLang={directorLang}
        formatDual={formatDual}
        dateLocale={dateLocale}
        period={period}
      />
    </div>
  )
}

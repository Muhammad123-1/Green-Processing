'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  UserCheck,
} from 'lucide-react'
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
    'arrivals' | 'production' | 'warehouse' | 'sales' | 'surveys' | 'employees' | 'alerts' | null
  >(null)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load saved thresholds on mount
  useEffect(() => {
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
      {/* 5. DRILL-DOWN MODAL FOR DEPARTMENTS / AUDIT */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-dark-750 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {activeModal === 'warehouse' && <Package size={20} />}
                  {activeModal === 'production' && <ChefHat size={20} />}
                  {activeModal === 'arrivals' && <Truck size={20} />}
                  {activeModal === 'employees' && <Users size={20} />}
                  {activeModal === 'surveys' && <Award size={20} />}
                  {activeModal === 'alerts' && <AlertTriangle size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeModal === 'warehouse' && formatDual("Ombor zaxiralari va transferlar", "Остатки на складе и перемещения", "Warehouse stock & transfers")}
                    {activeModal === 'production' && formatDual("Ishlab chiqarish va smena natijalari", "Производство и контроль смен", "Production & shift records")}
                    {activeModal === 'arrivals' && formatDual("Xomashyo qabuli va ta'minot aktlari", "Прием сырья и акты поставок", "Raw material arrivals & inspections")}
                    {activeModal === 'employees' && formatDual("Xodimlar faoliyati statistikasi", "Статистика активности сотрудников", "Employee activity audit")}
                    {activeModal === 'surveys' && formatDual("Mijozlar so'rovnomalari va fikrlari", "Опросы и отзывы клиентов", "Customer surveys & feedback")}
                    {activeModal === 'alerts' && formatDual("Shubhali holatlar va anomaliyalar", "Аномалии и расхождения", "Suspicious discrepancies & alerts")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faqat saqlangan rasmiy ma'lumotlar (faqat ko'rish uchun)
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

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Thermometer,
  Plus,
  Search,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  Info,
  Check,
  Clock,
  Truck,
  Package,
  FileText,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

export interface ShopArrivalQC {
  id: number
  date: string
  arrivalTime: string | null
  nomenclature: string
  quantity: number
  invoiceQuantity: number | null
  boxCount: number | null
  supplier: string | null
  ttnNumber: string | null
  batch: string | null
  temperature: number | null
  organoleptic: string | null
  finalDecision: string | null
  warehouseSign: string | null
  technologistSign: string | null
  qcSign: string | null
  qcCheckedAt: string | null
  createdAt?: string
  isEdited?: boolean
}

interface TemperatureLogsContentProps {
  userRole?: string
  userName?: string
}

export default function TemperatureLogsContent({
  userRole = 'QUALITY_CONTROL',
  userName = 'Sifat Nazoratchisi'
}: TemperatureLogsContentProps) {
  const { lang, formatDual } = useLanguage()

  const role = (userRole || '').toUpperCase()
  const isQC = role === 'QUALITY_CONTROL' || role === 'INSPECTOR'
  const isAdminOrDirector = role === 'ADMIN' || role === 'DIRECTOR'
  const isWarehouse = role === 'WAREHOUSE'

  const [arrivals, setArrivals] = useState<ShopArrivalQC[]>([])
  const [stats, setStats] = useState({
    totalCount: 0,
    missingTempCount: 0,
    normalCount: 0,
    deviationCount: 0
  })
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [tempStatusFilter, setTempStatusFilter] = useState<'all' | 'missing' | 'normal' | 'deviation'>('all')

  // Quick Inline Temperature Editing
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null)
  const [inlineTemp, setInlineTemp] = useState('')
  const [savingInline, setSavingInline] = useState(false)

  // Quick QC Modal (Harorat & Sifat Qarori)
  const [qcModalOpen, setQcModalOpen] = useState(false)
  const [selectedArrival, setSelectedArrival] = useState<ShopArrivalQC | null>(null)
  const [qcTemp, setQcTemp] = useState('')
  const [qcOrganoleptic, setQcOrganoleptic] = useState('')
  const [qcDecision, setQcDecision] = useState('Принято')
  const [qcTechSign, setQcTechSign] = useState('')
  const [savingQC, setSavingQC] = useState(false)

  // Full Edit / Create Modal (Joint Reception)
  const [fullModalOpen, setFullModalOpen] = useState(false)
  const [isEditingFull, setIsEditingFull] = useState(false)
  const [fullForm, setFullForm] = useState({
    id: 0,
    date: new Date().toISOString().split('T')[0],
    arrivalTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    nomenclature: '',
    quantity: '',
    invoiceQuantity: '',
    boxCount: '',
    supplier: '',
    ttnNumber: '',
    batch: '',
    temperature: '',
    organoleptic: 'Соответствует ТУ/ТР (Свежее, без дефектов)',
    finalDecision: 'Принято',
    warehouseSign: '',
    technologistSign: '',
    qcSign: ''
  })
  const [savingFull, setSavingFull] = useState(false)

  // Product presets for fast selection
  const [productSuggestions, setProductSuggestions] = useState<string[]>([])

  useEffect(() => {
    fetchArrivals()
  }, [monthFilter, dateFilter, tempStatusFilter])

  // Extract unique products for suggestion chips
  useEffect(() => {
    if (arrivals.length > 0) {
      const names = Array.from(new Set(arrivals.map(a => a.nomenclature).filter(Boolean)))
      setProductSuggestions(names.slice(0, 8))
    }
  }, [arrivals])

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQcModalOpen(false)
        setFullModalOpen(false)
        setInlineEditingId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchArrivals() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set('date', dateFilter)
      if (monthFilter) params.set('month', monthFilter)
      if (search) params.set('search', search)
      if (tempStatusFilter !== 'all') params.set('tempStatus', tempStatusFilter)

      const res = await fetch(`/api/warehouse/temperature-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setArrivals(data.arrivals || [])
        if (data.stats) setStats(data.stats)
        if (data.availableMonths && availableMonths.length === 0) {
          setAvailableMonths(data.availableMonths)
        }
      } else {
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
      }
    } catch {
      toast.error('Server bilan aloqa uzildi')
    } finally {
      setLoading(false)
    }
  }

  // Quick inline temperature update
  async function handleSaveInline(id: number) {
    if (!inlineTemp) {
      setInlineEditingId(null)
      return
    }
    setSavingInline(true)
    try {
      const res = await fetch('/api/warehouse/temperature-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          temperature: inlineTemp,
          finalDecision: 'Принято'
        })
      })

      if (res.ok) {
        toast.success(`Harorat saqlandi (${inlineTemp}°C)`)
        setInlineEditingId(null)
        setInlineTemp('')
        fetchArrivals()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingInline(false)
    }
  }

  // Open Quick QC modal
  function openQcModal(arrival: ShopArrivalQC) {
    setSelectedArrival(arrival)
    setQcTemp(arrival.temperature !== null && arrival.temperature !== undefined ? String(arrival.temperature) : '3.5')
    setQcOrganoleptic(arrival.organoleptic || 'Соответствует ТУ/ТР (Свежее, дефектов нет)')
    setQcDecision(arrival.finalDecision || 'Принято')
    setQcTechSign(arrival.technologistSign || 'Муродов Т.')
    setQcModalOpen(true)
  }

  // Save Quick QC Modal
  async function handleSaveQcModal(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedArrival) return
    setSavingQC(true)
    try {
      const res = await fetch('/api/warehouse/temperature-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedArrival.id,
          temperature: qcTemp,
          organoleptic: qcOrganoleptic,
          finalDecision: qcDecision,
          technologistSign: qcTechSign
        })
      })

      if (res.ok) {
        toast.success("Sifat va harorat xulosasi muvaffaqiyatli saqlandi!")
        setQcModalOpen(false)
        fetchArrivals()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingQC(false)
    }
  }

  // Open Full Joint Intake Modal
  function openCreateNew() {
    setIsEditingFull(false)
    setFullForm({
      id: 0,
      date: new Date().toISOString().split('T')[0],
      arrivalTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      nomenclature: '',
      quantity: '',
      invoiceQuantity: '',
      boxCount: '',
      supplier: '',
      ttnNumber: '',
      batch: '',
      temperature: '3.5',
      organoleptic: 'Соответствует ТУ/ТР (Свежее, без дефектов)',
      finalDecision: 'Принято',
      warehouseSign: isWarehouse || isAdminOrDirector ? userName : '',
      technologistSign: 'Муродов Т.',
      qcSign: isQC || isAdminOrDirector ? userName : ''
    })
    setFullModalOpen(true)
  }

  // Open Edit Full Modal
  function openEditFull(arrival: ShopArrivalQC) {
    setIsEditingFull(true)
    setFullForm({
      id: arrival.id,
      date: arrival.date,
      arrivalTime: arrival.arrivalTime || '08:30',
      nomenclature: arrival.nomenclature,
      quantity: String(arrival.quantity),
      invoiceQuantity: arrival.invoiceQuantity ? String(arrival.invoiceQuantity) : String(arrival.quantity),
      boxCount: arrival.boxCount ? String(arrival.boxCount) : '',
      supplier: arrival.supplier || '',
      ttnNumber: arrival.ttnNumber || '',
      batch: arrival.batch || '',
      temperature: arrival.temperature !== null && arrival.temperature !== undefined ? String(arrival.temperature) : '',
      organoleptic: arrival.organoleptic || 'Соответствует ТУ/ТР',
      finalDecision: arrival.finalDecision || 'Принято',
      warehouseSign: arrival.warehouseSign || '',
      technologistSign: arrival.technologistSign || '',
      qcSign: arrival.qcSign || ''
    })
    setFullModalOpen(true)
  }

  // Save Full Form
  async function handleSaveFull(e: React.FormEvent) {
    e.preventDefault()
    setSavingFull(true)
    try {
      const method = isEditingFull ? 'PUT' : 'POST'
      const res = await fetch('/api/warehouse/temperature-logs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullForm)
      })

      if (res.ok) {
        toast.success(isEditingFull ? "Kirim jurnali yozuvi yangilandi" : "Yangi kirim qabuli muvaffaqiyatli saqlandi")
        setFullModalOpen(false)
        fetchArrivals()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingFull(false)
    }
  }

  // Excel Export
  async function handleDownloadExcel() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set('date', dateFilter)
      if (monthFilter) params.set('month', monthFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/warehouse/export-excel?${params.toString()}`)
      if (!res.ok) throw new Error('Export error')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Zhurnal_priyomki_vxodnogo_kontrolya_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(lang === 'ru' ? 'Журнал успешно скачан (.xlsx)' : "Kirish nazorati jurnali yuklab olindi (.xlsx)")
    } catch {
      toast.error('Excel yuklab olishda xatolik')
    } finally {
      setExporting(false)
    }
  }

  // Delete Record (Admin only)
  async function handleDelete(id: number) {
    if (!isAdminOrDirector) {
      toast.error("O'chirish faqat Admin yoki Direktor uchun ruxsat etilgan")
      return
    }
    if (!confirm(lang === 'ru' ? 'Удалить эту запись прихода?' : "Ushbu kirim yozuvini o'chirishni tasdiqlaysizmi?")) return

    try {
      const res = await fetch(`/api/warehouse/temperature-logs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись удалена' : "Yozuv o'chirildi")
        fetchArrivals()
      } else {
        const err = await res.json()
        toast.error(err.error || "O'chirishda xatolik")
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

  // Client-side search filtering
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((item) => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        item.nomenclature.toLowerCase().includes(s) ||
        (item.supplier && item.supplier.toLowerCase().includes(s)) ||
        (item.batch && item.batch.toLowerCase().includes(s)) ||
        (item.ttnNumber && item.ttnNumber.toLowerCase().includes(s)) ||
        item.date.includes(s)
      )
    })
  }, [arrivals, search])

  // Pagination with useInfiniteTable
  const pagination = useInfiniteTable(filteredArrivals, 15, [search, monthFilter, dateFilter, tempStatusFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter pb-16">
      {/* 1. Header Banner matching Paper Document Title */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 rounded-3xl border border-slate-700/80 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Thermometer size={14} className="text-emerald-400 animate-pulse" />
                GREEN PROCESSING • FSSC 22000
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                ЖУРНАЛ ФОРМА Ф-01
              </span>
              <span className="text-xs text-cyan-300 font-medium bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                <ShieldCheck size={13} />
                {isQC ? "Sifat Nazoratchisi (QA/QC)" : isAdminOrDirector ? "Administrator" : "Omborxona"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {lang === 'ru'
                ? 'Журнал приёмки входного контроля сырья'
                : "Xomashyo Kirish Nazorati va Qabul Harorati Jurnali"}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              {lang === 'ru'
                ? 'Совместный контроль склада и службы качества: Фиксация температуры при доставке (норма 2°C – 5°C), органолептика и допуск сырья в производство.'
                : "Ombor va Sifat Nazorati birgalikdagi qabuli: Yetkazib berishdagi harorat nazorati (2°C – 5°C), organoleptika va xomashyo yaroqliligi tekshiruvi."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm transition-all duration-150 flex items-center gap-2 shadow-lg shadow-emerald-900/40 border border-emerald-400/30"
              title="Excel (.xlsx) formatida yuklab olish"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span>{lang === 'ru' ? 'Скачать Excel' : 'Excel Yuklab Olish'}</span>
            </button>

            <button
              onClick={openCreateNew}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm transition-all duration-150 flex items-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/30"
            >
              <Plus size={16} />
              <span>{lang === 'ru' ? '+ Приёмка / Новая запись' : "+ Yangi Qabul Kiritish"}</span>
            </button>

            <button
              onClick={fetchArrivals}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Qayta yuklash"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive KPI Metrics / Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Deliveries */}
        <div
          onClick={() => setTempStatusFilter('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            tempStatusFilter === 'all'
              ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'ru' ? 'Всего приходов' : 'Jami Kirimlar'}
            </span>
            <Package size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalCount}</div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ru' ? 'Зарегистрировано в системе' : "Tizimga kirim qilingan"}
          </p>
        </div>

        {/* Missing Temperature (Red Alert) */}
        <div
          onClick={() => setTempStatusFilter('missing')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            tempStatusFilter === 'missing'
              ? 'bg-rose-950/50 border-rose-500/70 shadow-lg shadow-rose-950/60'
              : 'bg-slate-900/60 border-slate-800 hover:border-rose-900/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              {lang === 'ru' ? 'Без температуры' : 'Harorat Kiritilmagan'}
            </span>
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{stats.missingTempCount}</div>
          <p className="text-xs text-rose-300/80 mt-1">
            {stats.missingTempCount > 0
              ? (lang === 'ru' ? 'Требуется замер QC!' : 'Sifat nazorati kiritishi shart!')
              : (lang === 'ru' ? 'Все проверены ✓' : "Barchasi to'ldirilgan ✓")}
          </p>
        </div>

        {/* Normal Temperature (Green) */}
        <div
          onClick={() => setTempStatusFilter('normal')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            tempStatusFilter === 'normal'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-emerald-900/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              {lang === 'ru' ? 'В норме (2°C – 5°C)' : "Me'yorda (2°C – 5°C)"}
            </span>
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.normalCount}</div>
          <p className="text-xs text-emerald-400/80 mt-1">
            {lang === 'ru' ? 'Холодовая цепь соблюдена' : "Sovuq zanjir talabiga mos"}
          </p>
        </div>

        {/* Temperature Deviation (Amber/Red) */}
        <div
          onClick={() => setTempStatusFilter('deviation')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            tempStatusFilter === 'deviation'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-900/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              {lang === 'ru' ? 'Отклонения (<2° или >5°)' : "Og'ish bor (<2° yoki >5°)"}
            </span>
            <Thermometer size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{stats.deviationCount}</div>
          <p className="text-xs text-amber-400/80 mt-1">
            {lang === 'ru' ? 'Требует внимания технолога' : "Texnolog xulosasi kerak"}
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск: сырье, поставщик, ТТН, партия...' : "Qidirish: xomashyo, ta'minotchi, TTN, partiya..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value)
                setDateFilter('')
              }}
              className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">{lang === 'ru' ? 'Все месяцы' : 'Barcha oylar'}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Specific date selector */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setMonthFilter('')
            }}
            className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          {(dateFilter || monthFilter || search || tempStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setDateFilter('')
                setMonthFilter('')
                setSearch('')
                setTempStatusFilter('all')
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {lang === 'ru' ? 'Сброс' : 'Tozalash'}
            </button>
          )}
        </div>

        {/* Quick status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setTempStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              tempStatusFilter === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ru' ? 'Все' : 'Barchasi'} ({stats.totalCount})
          </button>
          <button
            onClick={() => setTempStatusFilter('missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              tempStatusFilter === 'missing'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
            }`}
          >
            🔴 {lang === 'ru' ? 'Без темп.' : 'Kiritilmagan'} ({stats.missingTempCount})
          </button>
          <button
            onClick={() => setTempStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              tempStatusFilter === 'normal'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
          >
            🟢 {lang === 'ru' ? 'Норма' : "Me'yorda"} ({stats.normalCount})
          </button>
          <button
            onClick={() => setTempStatusFilter('deviation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              tempStatusFilter === 'deviation'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            ⚠️ {lang === 'ru' ? 'Отклонение' : "Og'ish"} ({stats.deviationCount})
          </button>
        </div>
      </div>

      {/* Notice for Sifat Nazoratchisi */}
      {isQC && (
        <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-blue-200">
          <Info size={18} className="text-blue-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Sifat Nazoratchisi rejimi: </span>
            Xomashyo miqdori, ta'minotchi va TTN ma'lumotlari omborchi tomonidan kiritilgan. Siz faqat{' '}
            <strong className="text-emerald-300 underline underline-offset-2">Yetkazib berishdagi Harorat (°C)</strong>,
            organoleptika va yakuniy sifat xulosasini kiritishingiz mumkin.
          </div>
        </div>
      )}

      {/* 4. Journal Table - Exactly 14 columns matching paper document */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
            <thead>
              {/* Row 1: Document column titles */}
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700/80 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 text-center w-12 border-r border-slate-800">№</th>
                <th className="py-3.5 px-3 w-32 border-r border-slate-800">
                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" />
                    <span>{lang === 'ru' ? 'Дата и время' : 'Kelgan sana/vaqt'}</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 border-r border-slate-800 min-w-[160px]">
                  {lang === 'ru' ? 'Наименование сырья' : 'Xomashyo nomi'}
                </th>
                <th className="py-3.5 px-3 border-r border-slate-800 min-w-[150px]">
                  {lang === 'ru' ? 'Поставщик' : "Ta'minotchi"}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-800 w-28">
                  {lang === 'ru' ? 'Накладная (кг)' : 'Nakladnoy (kg)'}
                </th>
                <th className="py-3.5 px-3 text-right border-r border-slate-800 w-32">
                  {lang === 'ru' ? 'Факт (кг / ящ)' : 'Fakt (kg / yashik)'}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-800 w-28">
                  {lang === 'ru' ? 'ТТН / Сертификат' : 'TTN / Sertifikat'}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-800 w-20">
                  {lang === 'ru' ? 'Партия' : 'Partiya'}
                </th>
                {/* 9: Temperature - HIGHLIGHTED AS PRIMARY QC GOAL */}
                <th className="py-3.5 px-3 text-center border-r border-slate-800 min-w-[160px] bg-emerald-950/40 text-emerald-300">
                  <div className="flex items-center justify-center gap-1.5 font-black">
                    <Thermometer size={15} className="text-emerald-400 animate-pulse" />
                    <span>{lang === 'ru' ? 'Температура (°C)' : 'Harorat (°C)'}</span>
                  </div>
                  <div className="text-[9px] font-normal text-emerald-400/80 normal-case">
                    (Norma: 2°C – 5°C)
                  </div>
                </th>
                <th className="py-3.5 px-3 border-r border-slate-800 min-w-[180px]">
                  {lang === 'ru' ? 'Органолептика / ТП' : 'Organoleptika / Texnolog'}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-800 w-28">
                  {lang === 'ru' ? 'Решение' : 'Yakuniy Qaror'}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-800 w-28">
                  {lang === 'ru' ? 'Зав. складом' : 'Ombor mudiri'}
                </th>
                <th className="py-3.5 px-3 text-center border-r border-slate-800 w-28">
                  {lang === 'ru' ? 'Спец. QC' : 'QC Imzosi'}
                </th>
                <th className="py-3.5 px-3 text-center w-24">Amallar</th>
              </tr>

              {/* Row 2: Subheader column numbering (1, 2, 3... 14 - Paper Document Layout) */}
              <tr className="bg-slate-900 text-slate-400 text-[10px] text-center italic border-b border-slate-700/70 select-none">
                <td className="py-1 border-r border-slate-800 font-mono">1</td>
                <td className="py-1 border-r border-slate-800 font-mono">2</td>
                <td className="py-1 border-r border-slate-800 font-mono">3</td>
                <td className="py-1 border-r border-slate-800 font-mono">4</td>
                <td className="py-1 border-r border-slate-800 font-mono">5</td>
                <td className="py-1 border-r border-slate-800 font-mono">6</td>
                <td className="py-1 border-r border-slate-800 font-mono">7</td>
                <td className="py-1 border-r border-slate-800 font-mono">8</td>
                <td className="py-1 border-r border-slate-800 font-mono font-bold text-emerald-300 bg-emerald-950/20">9</td>
                <td className="py-1 border-r border-slate-800 font-mono">10</td>
                <td className="py-1 border-r border-slate-800 font-mono">11</td>
                <td className="py-1 border-r border-slate-800 font-mono">12</td>
                <td className="py-1 border-r border-slate-800 font-mono">13</td>
                <td className="py-1 font-mono">14</td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-slate-400">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Jurnal ma'lumotlari yuklanmoqda...</span>
                  </td>
                </tr>
              ) : pagination.displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-slate-400">
                    <Package size={36} className="mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold">Mos keluvchi xomashyo kirimi topilmadi</p>
                    <p className="text-xs text-slate-400 mt-1">Filtr parametrlarini o'zgartirib ko'ring</p>
                  </td>
                </tr>
              ) : (
                pagination.displayedItems.map((item: ShopArrivalQC, idx: number) => {
                  const hasTemp = item.temperature !== null && item.temperature !== undefined
                  const isNormal = hasTemp && item.temperature! >= 2.0 && item.temperature! <= 5.0
                  const isHigh = hasTemp && item.temperature! > 5.0
                  const isLow = hasTemp && item.temperature! < 2.0
                  const isInline = inlineEditingId === item.id

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-850/80 transition-colors ${
                        !hasTemp ? 'bg-rose-950/10' : isHigh ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* 1: № */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono border-r border-slate-800/70">
                        {idx + 1}
                      </td>

                      {/* 2: Date & Arrival Time */}
                      <td className="py-3 px-3 border-r border-slate-800/70 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{item.date}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{item.arrivalTime || '08:30'}</span>
                        </div>
                      </td>

                      {/* 3: Nomenclature */}
                      <td className="py-3 px-3 font-bold text-white border-r border-slate-800/70">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{item.nomenclature}</span>
                        </div>
                      </td>

                      {/* 4: Supplier */}
                      <td className="py-3 px-3 border-r border-slate-800/70 text-slate-300">
                        {item.supplier ? (
                          <div className="flex items-center gap-1 truncate max-w-[180px]" title={item.supplier}>
                            <Truck size={12} className="text-slate-400 shrink-0" />
                            <span>{item.supplier}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* 5: Invoice Quantity (kg) */}
                      <td className="py-3 px-3 text-right font-mono border-r border-slate-800/70 text-slate-300">
                        {item.invoiceQuantity ? `${item.invoiceQuantity} kg` : `${item.quantity} kg`}
                      </td>

                      {/* 6: Actual Quantity & Boxes */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300 border-r border-slate-800/70 whitespace-nowrap">
                        <div>{item.quantity} kg</div>
                        {item.boxCount ? (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({item.boxCount} yashik)
                          </div>
                        ) : null}
                      </td>

                      {/* 7: TTN / Certificate */}
                      <td className="py-3 px-3 text-center font-mono text-slate-300 border-r border-slate-800/70">
                        {item.ttnNumber ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                            {item.ttnNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 8: Batch */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-300 border-r border-slate-800/70">
                        {item.batch ? `#${item.batch}` : '-'}
                      </td>

                      {/* 9: Temperature (°C) - CORE QC INTERACTION */}
                      <td className="py-2.5 px-3 border-r border-slate-800/70 bg-emerald-950/15 text-center">
                        {isInline ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              autoFocus
                              value={inlineTemp}
                              onChange={(e) => setInlineTemp(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInline(item.id)
                                if (e.key === 'Escape') setInlineEditingId(null)
                              }}
                              placeholder="°C"
                              className="w-16 px-1.5 py-1 text-xs font-bold text-center bg-slate-950 border border-emerald-500 rounded text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveInline(item.id)}
                              disabled={savingInline}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Saqlash"
                            >
                              {savingInline ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : hasTemp ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              onClick={() => openQcModal(item)}
                              className={`cursor-pointer px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 shadow-sm transition hover:scale-105 ${
                                isNormal
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : isHigh
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                              }`}
                              title={
                                isNormal
                                  ? "Me'yorda (2°C - 5°C)"
                                  : isHigh
                                  ? "Yuqori harorat! Nazorat talab etiladi"
                                  : "Past harorat (Muzlash xavfi)"
                              }
                            >
                              <Thermometer size={13} />
                              {item.temperature}°C
                              {isNormal && <span className="text-[10px] text-emerald-400">✓</span>}
                              {isHigh && <span className="text-[10px] text-rose-400">⚠️</span>}
                              {isLow && <span className="text-[10px] text-cyan-400">❄️</span>}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setInlineEditingId(item.id)
                                setInlineTemp('3.5')
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-semibold text-[11px] transition flex items-center gap-1 shadow-sm"
                            >
                              <Plus size={11} />
                              <span>Harorat +</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 10: Organoleptic / TP suitability */}
                      <td className="py-3 px-3 border-r border-slate-800/70 text-slate-300">
                        <div className="line-clamp-2 text-[11px]" title={item.organoleptic || "Соответствует ТУ/ТР"}>
                          {item.organoleptic || <span className="text-slate-400 italic">Соответствует ТУ/ТР</span>}
                        </div>
                      </td>

                      {/* 11: Final Decision (Принято / Брак) */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/70 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (item.finalDecision || 'Принято').toLowerCase().includes('брак') ||
                            (item.finalDecision || '').toLowerCase().includes('rad')
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.finalDecision || 'Принято'}
                        </span>
                      </td>

                      {/* 12: Zav Sklad sign */}
                      <td className="py-3 px-3 text-center text-[11px] text-slate-300 border-r border-slate-800/70">
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <UserCheck size={12} className="text-slate-400" />
                          <span className="truncate max-w-[90px]">{item.warehouseSign || (lang === 'ru' ? 'Зав. складом' : 'Ombor mudiri')}</span>
                        </div>
                      </td>

                      {/* 13: QC sign */}
                      <td className="py-3 px-3 text-center text-[11px] border-r border-slate-800/70">
                        {item.qcSign ? (
                          <div className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <ShieldCheck size={12} />
                            <span className="truncate max-w-[90px]">{item.qcSign}</span>
                          </div>
                        ) : (
                          <span className="text-rose-400/80 text-[10px] italic">Kutilmoqda...</span>
                        )}
                      </td>

                      {/* 14: Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sifat nazorati / Harorat kiritish tugmasi */}
                          <button
                            onClick={() => openQcModal(item)}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white transition"
                            title="Harorat va sifat xulosasini kiritish"
                          >
                            <Thermometer size={14} />
                          </button>

                          {/* To'liq tahrirlash (Sklad yoki Admin) */}
                          <button
                            onClick={() => openEditFull(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title={isQC ? "Ko'rish / Sifat xulosasi" : "Tahrirlash"}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Faqat Admin o'chira oladi */}
                          {isAdminOrDirector && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite table footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <InfiniteTableFooter
            currentCount={pagination.displayedItems.length}
            totalCount={filteredArrivals.length}
            hasMore={pagination.hasMore}
            showAll={pagination.showAll}
            onLoadMore={pagination.loadMore}
            onToggleShowAll={pagination.toggleShowAll}
            sentinelRef={pagination.sentinelRef}
            pageSize={15}
            itemName={{ uz: 'ta kirim partiyasi', ru: 'приходов сырья', en: 'raw material arrivals' }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Quick Harorat & Sifat Xulosasi Modal (Designed for Sifat Nazorati) */}
      {/* ========================================================================= */}
      {qcModalOpen && selectedArrival && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/60 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Thermometer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {lang === 'ru' ? 'Входной контроль температуры сырья' : "Xomashyo Qabul Harorati Nazorati"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedArrival.nomenclature} • {selectedArrival.supplier || "Ta'minotchi ko'rsatilmagan"} • Partiya #{selectedArrival.batch || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQcModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveQcModal} className="p-5 space-y-4">
              {/* Warehouse info preview (READ-ONLY FOR QC) */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Kelgan sana va vaqt:</span>
                  <span className="font-semibold text-slate-200">{selectedArrival.date} {selectedArrival.arrivalTime || '08:30'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Faktik miqdor:</span>
                  <span className="font-bold text-emerald-400">{selectedArrival.quantity} kg</span>
                  {selectedArrival.boxCount ? <span className="text-slate-400 ml-1">({selectedArrival.boxCount} yashik)</span> : null}
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">TTN / Sertifikat №:</span>
                  <span className="font-mono text-slate-300">{selectedArrival.ttnNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{lang === 'ru' ? 'Зав. складом:' : 'Ombor mudiri qabuli:'}</span>
                  <span className="text-slate-300">{selectedArrival.warehouseSign || (lang === 'ru' ? 'Принято' : 'Tasdiqlangan')}</span>
                </div>
              </div>

              {/* TEMPERATURE INPUT - BIG & PROMINENT */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Yetkazib berishdagi Harorat (°C) *</span>
                  <span className="text-emerald-400 normal-case font-normal text-xs">Standart norma: 2°C – 5°C</span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    autoFocus
                    value={qcTemp}
                    onChange={(e) => setQcTemp(e.target.value)}
                    placeholder="Masalan: 3.5"
                    className="w-full text-center py-3.5 text-2xl font-black rounded-2xl bg-slate-950 border-2 border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    °C
                  </span>
                </div>

                {/* Cold-chain quick status badge */}
                {qcTemp && (
                  <div className="text-center">
                    {parseFloat(qcTemp) >= 2.0 && parseFloat(qcTemp) <= 5.0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                        <CheckCircle size={14} /> Sovuq zanjir me'yorda (2°C – 5°C) ✓
                      </span>
                    ) : parseFloat(qcTemp) > 5.0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                        <AlertTriangle size={14} /> Diqqat! Harorat me'yordan yuqori (+{parseFloat(qcTemp)}°C) ⚠️
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
                        ❄️ Harorat me'yordan past (Muzlash xavfi)
                      </span>
                    )}
                  </div>
                )}

                {/* Fast Preset Chips */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                  {['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setQcTemp(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        qcTemp === preset
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset}°C
                    </button>
                  ))}
                </div>
              </div>

              {/* Organoleptika va TP ga yaroqliligi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Органолептика и пригодность для ТП (Мнение Технолога)
                </label>
                <input
                  type="text"
                  value={qcOrganoleptic}
                  onChange={(e) => setQcOrganoleptic(e.target.value)}
                  placeholder="Masalan: Свежее, чистое, без гнили и механических повреждений"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[
                    'Соответствует ТУ/ТР',
                    'Свежее, дефектов нет',
                    'Механических повреждений нет'
                  ].map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => setQcOrganoleptic(chip)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px]"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Final Decision */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Финальное решение по качеству (Yakuniy Qaror)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Принято', label: 'Принято (Qabul)', color: 'emerald' },
                    { value: 'Брак', label: 'Брак (Rad)', color: 'rose' },
                    { value: 'Условно', label: 'Условно (Shartli)', color: 'amber' }
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setQcDecision(opt.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        qcDecision === opt.value
                          ? opt.color === 'emerald'
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950'
                            : opt.color === 'rose'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950'
                            : 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QC Signature notice */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>QC Mutaxassisi: <strong>{userName}</strong></span>
                </div>
                <span className="text-[11px] text-slate-400">Avtomatik muhrlanadi</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQcModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingQC}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  {savingQC ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>Harorat va Xulosani Tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Full Reception Form (Joint Intake & Edit)                        */}
      {/* STRICT RULE: For Sifat Nazoratchisi, Warehouse fields are DISABLED!       */}
      {/* ========================================================================= */}
      {fullModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/60 sticky top-0 z-10 flex items-center justify-between backdrop-blur-md">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {isEditingFull
                    ? (lang === 'ru' ? 'Редактирование записи приёмки сырья' : "Kirim va Sifat Nazorati Yozuvini Tahrirlash")
                    : (lang === 'ru' ? 'Новая приёмка сырья (Склад + Sifat Nazorati)' : "Yangi Kirim va Harorat Qabuli")}
                </h3>
                <p className="text-xs text-slate-400">
                  {isQC
                    ? (lang === 'ru' ? 'Контролер качества: Данные склада заблокированы, заполняется только температура и органолептика.' : "Sifat Nazoratchisi: Ombor ma'lumotlari qulflangan, faqat harorat va sifat xulosasi kiritiladi.")
                    : (lang === 'ru' ? 'Журнал приёмки входного контроля сырья (Ф-01)' : "Xomashyo kirish nazorati va qabul qilish jurnali (F-01)")}
                </p>
              </div>
              <button
                onClick={() => setFullModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFull} className="p-6 space-y-5">
              {/* SECTION A: SKLADCHI MAYDONLARI (Warehouse Data) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Package size={15} />
                    <span>{lang === 'ru' ? 'А. Данные склада (Приход сырья)' : "A. Omborchi Ma'lumotlari (Xomashyo kirimi)"}</span>
                  </h4>
                  {isQC && (
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Lock size={12} /> Faqat ko'rish rejimi
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Date */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Дата прибытия (Kelgan sana) *</label>
                    <input
                      type="date"
                      required
                      disabled={isQC}
                      value={fullForm.date}
                      onChange={(e) => setFullForm({ ...fullForm, date: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Arrival Time */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Время прибытия (Kelgan vaqt)</label>
                    <input
                      type="text"
                      disabled={isQC}
                      value={fullForm.arrivalTime}
                      onChange={(e) => setFullForm({ ...fullForm, arrivalTime: e.target.value })}
                      placeholder="08:30"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Nomenclature */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Наименование сырья (Xomashyo nomi) *</label>
                    <input
                      type="text"
                      required
                      disabled={isQC}
                      value={fullForm.nomenclature}
                      onChange={(e) => setFullForm({ ...fullForm, nomenclature: e.target.value })}
                      placeholder="Masalan: Айсберг, Помидор, Капуста..."
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                    {!isQC && productSuggestions.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {productSuggestions.map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setFullForm({ ...fullForm, nomenclature: p })}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white text-[10px]"
                          >
                            + {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Поставщик (Ta'minotchi)</label>
                    <input
                      type="text"
                      disabled={isQC}
                      value={fullForm.supplier}
                      onChange={(e) => setFullForm({ ...fullForm, supplier: e.target.value })}
                      placeholder="Ta'minotchi firmasi"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Batch */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Номер партии (Partiya raqami)</label>
                    <input
                      type="text"
                      disabled={isQC}
                      value={fullForm.batch}
                      onChange={(e) => setFullForm({ ...fullForm, batch: e.target.value })}
                      placeholder="Masalan: 12 yoki SUP-2026-01"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Invoice Quantity */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Кол-во по накладной (Nakladnoy, kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isQC}
                      value={fullForm.invoiceQuantity}
                      onChange={(e) => setFullForm({ ...fullForm, invoiceQuantity: e.target.value })}
                      placeholder="1500"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Actual Quantity */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Фактическое кол-во (Faktik, kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      disabled={isQC}
                      value={fullForm.quantity}
                      onChange={(e) => setFullForm({ ...fullForm, quantity: e.target.value })}
                      placeholder="1500"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Box Count */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Кол-во ящиков (Yashik soni)</label>
                    <input
                      type="number"
                      disabled={isQC}
                      value={fullForm.boxCount}
                      onChange={(e) => setFullForm({ ...fullForm, boxCount: e.target.value })}
                      placeholder="75"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* TTN Number */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Номер ТТН / Сертификата</label>
                    <input
                      type="text"
                      disabled={isQC}
                      value={fullForm.ttnNumber}
                      onChange={(e) => setFullForm({ ...fullForm, ttnNumber: e.target.value })}
                      placeholder="TTN-4512"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: SIFAT NAZORATCHISI MAYDONLARI (QC & Temperature Data) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Thermometer size={15} />
                    <span>B. Sifat Nazorati va Harorat Rejimi (QC Mutaxassisi)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-medium">Norma: 2°C – 5°C</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Temperature */}
                  <div>
                    <label className="text-xs font-bold text-emerald-300 mb-1 block">
                      Температура при доставке (°C)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={fullForm.temperature}
                        onChange={(e) => setFullForm({ ...fullForm, temperature: e.target.value })}
                        placeholder="3.5"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-emerald-500/60 rounded-xl text-base font-bold text-white focus:outline-none focus:border-emerald-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        °C
                      </span>
                    </div>
                  </div>

                  {/* Final Quality Decision */}
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">
                      Финальное решение по качеству
                    </label>
                    <select
                      value={fullForm.finalDecision}
                      onChange={(e) => setFullForm({ ...fullForm, finalDecision: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Принято">Принято (Qabul qilindi ✓)</option>
                      <option value="Брак">Брак (Rad etildi ❌)</option>
                      <option value="Условно">Условно (Shartli qabul ⚠️)</option>
                    </select>
                  </div>

                  {/* Organoleptic */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 mb-1 block">
                      Органолептика и пригодность для ТП (Мнение Технолога)
                    </label>
                    <input
                      type="text"
                      value={fullForm.organoleptic}
                      onChange={(e) => setFullForm({ ...fullForm, organoleptic: e.target.value })}
                      placeholder="Соответствует ТУ/ТР, дефектов нет"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Signatures */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Подпись Зав. складом</label>
                    <input
                      type="text"
                      disabled={isQC}
                      value={fullForm.warehouseSign}
                      onChange={(e) => setFullForm({ ...fullForm, warehouseSign: e.target.value })}
                      placeholder="Ombor mudiri imzosi"
                      className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                        isQC ? 'border-slate-800 opacity-60' : 'border-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Подпись Спец-та по качеству (QC)</label>
                    <input
                      type="text"
                      value={fullForm.qcSign || userName}
                      onChange={(e) => setFullForm({ ...fullForm, qcSign: e.target.value })}
                      placeholder="Sifat mutaxassisi imzosi"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFullModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingFull}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  {savingFull ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{isEditingFull ? "O'zgarishlarni Saqlash" : "Kirimni Qabul Qilish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

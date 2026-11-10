'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Truck,
  HeartPulse,
  UtensilsCrossed,
  Plus,
  Printer,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Save,
  Zap,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

export interface DriverMedicalExamItem {
  id: string
  orderNumber: number // 1. Тартиб рақами
  date: string // Сана (YYYY-MM-DD)
  driverName: string // 2. Ҳайдовчининг фамилияси, исми, отасининг исми
  complaints: string // 3. Шикоятлари (йўқ)
  pulse: string // 4. Томир уриши (76-78)
  bodyTemp: string // 5. Тана ҳарорати (36.2)
  bloodPressure: string // 6. Артериал босим (120/80)
  breathAlcohol: string // 7. Чиқарилаётган нафас таркибида алкогол миқдори (аниқланмади)
  result: string // 8. Ҳайдовчиларни тиббий кўрикдан ўтказиш натижалари (соғлом, рейска рухсат)
  signature: string // 9. Имзо
  _dirty?: boolean
  _isNew?: boolean
}

// Корхонанинг доимий ҳайдовчилари рўйхати (3 ва 4-расмлардан олинган)
export const OFFICIAL_FLEET_DRIVERS = [
  'Расилов И.',
  'Салихов Х.',
  'Матқобилов М.',
  'Мирзаев И.',
  'Пўлатов М.',
  'Нажмиддинов Ф.',
  'Шокирбеков Д.',
  'Худойберганов Х.',
  'Тўхтаев А.',
  'Жўраев Б.',
  'Солиев В.',
  'Азизов Д.',
  'Асқаров Т.',
  'Собиров Д.',
  'Мавланов А.',
  'Пирманов А.',
  'Садибеков И.',
  'Шерматов Р.'
]

const getTodayTashkent = () => {
  const d = new Date()
  const tzOffset = 5 * 60 * 60 * 1000
  return new Date(d.getTime() + tzOffset).toISOString().slice(0, 10)
}

const createEmptyDriverRow = (date: string, orderNumber: number): DriverMedicalExamItem => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  orderNumber,
  date: date || getTodayTashkent(),
  driverName: '',
  complaints: 'йўқ',
  pulse: '76-78',
  bodyTemp: '36.2',
  bloodPressure: '120/80',
  breathAlcohol: 'аниқланмади',
  result: 'соғлом, рейска рухсат',
  signature: 'Жуманова Ч.Э.',
  _isNew: true,
  _dirty: false
})

export default function DriversMedicalContent() {
  const [logs, setLogs] = useState<DriverMedicalExamItem[]>([])
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [searchQuery, setSearchQuery] = useState('')
  const [savingAll, setSavingAll] = useState(false)

  // Load from localStorage (filtrlash: eski mock/demo ma'lumotlar o'chiriladi)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_drivers_medical_logs_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Namuna (demo) ma'lumotlarni filtrlab olib tashlash
          const cleaned = parsed.filter(item => {
            if (!item || !item.id) return false
            // Eski 'dm-1' .. 'dm-23' namunalarini tozalash
            const isMock = typeof item.id === 'string' && /^dm-\d+$/.test(item.id) && (item.date === '2025-10-20' || item.date === '2025-10-17')
            return !isMock
          })
          setLogs(cleaned)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to localStorage
  const persistLogs = useCallback((updated: DriverMedicalExamItem[]) => {
    // Faqat haqiqiy (nomi bor) yozuvlarni saqlaymiz
    const cleanToStore = updated
      .filter(l => l.driverName.trim())
      .map(l => ({
        id: l.id.startsWith('new-') ? `dm-real-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : l.id,
        orderNumber: l.orderNumber,
        date: l.date,
        driverName: l.driverName.trim(),
        complaints: l.complaints || 'йўқ',
        pulse: l.pulse || '76-78',
        bodyTemp: l.bodyTemp || '36.2',
        bloodPressure: l.bloodPressure || '120/80',
        breathAlcohol: l.breathAlcohol || 'аниқланмади',
        result: l.result || 'соғлом, рейска рухсат',
        signature: l.signature || 'Жуманова Ч.Э.'
      }))

    try {
      localStorage.setItem('gp_drivers_medical_logs_2026', JSON.stringify(cleanToStore))
    } catch {
      // ignore
    }
  }, [])

  // Quick Date Navigation
  const handleDateStep = (days: number) => {
    let base = filterDate && filterDate !== 'ALL' ? new Date(filterDate) : new Date()
    if (isNaN(base.getTime())) base = new Date()
    base.setDate(base.getDate() + days)
    setFilterDate(base.toISOString().slice(0, 10))
  }

  // Update single field in a row
  const updateRowField = (id: string, patch: Partial<DriverMedicalExamItem>) => {
    setLogs(prev => {
      const idx = prev.findIndex(item => item.id === id)
      if (idx === -1) return prev

      const next = [...prev]
      const cur = next[idx]
      const updated = { ...cur, ...patch, _dirty: true }
      next[idx] = updated

      // Kirim-chiqim kabi: Agar yangi qatorda haydovchi tanlansa, darhol keyingi bo'sh qatorni tayyorlab qo'yadi
      if (updated._isNew && updated.driverName.trim() && idx === next.length - 1 && filterDate !== 'ALL') {
        const nextOrder = next.filter(l => l.date === filterDate).length + 1
        next.push(createEmptyDriverRow(filterDate, nextOrder))
      }

      return next
    })
  }

  // Add explicit new row
  const handleAddNewRow = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const existing = logs.filter(l => l.date === targetDate)
    const nextOrder = existing.length + 1
    const newRow = createEmptyDriverRow(targetDate, nextOrder)
    newRow._dirty = true

    setLogs(prev => [...prev, newRow])
    toast.info("Янги қатор қўшилди. Ҳайдовчи маълумотларини киритинг.")
  }

  // Save single row
  const handleSaveRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return
    if (!row.driverName.trim()) {
      toast.error("Илтимос, ҳайдовчи исмини киритинг ёки танланг!")
      return
    }

    const updated = logs.map(l => (l.id === id ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    toast.success(`№${row.orderNumber} ${row.driverName} маълумоти сақланди`)
  }

  // Save all dirty rows
  const handleSaveAll = () => {
    const dirtyRows = logs.filter(l => l._dirty && l.driverName.trim())
    if (dirtyRows.length === 0) {
      toast.info("Ўзгаришлар йўқ, барчаси сақланган")
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l._dirty && l.driverName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(`${dirtyRows.length} та ҳайдовчи кўрик маълумотлари сақланди`)
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return

    if (row._isNew && !row.driverName.trim()) {
      return
    }

    if (!confirm(`"${row.driverName || 'Ҳайдовчи'}" кўрик ёзувини ўчирмоқчимисиз?`)) return
    const updated = logs.filter(l => l.id !== id)
    setLogs(updated)
    persistLogs(updated)
    toast.success("Ёзув ўчирилди")
  }

  // Quick Pre-Trip Bulk Generator: Auto-check 10 standard fleet drivers for selected date
  const handleBulkCheckAllDrivers = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const existing = logs.filter(l => l.date === targetDate && l.driverName.trim())

    if (existing.length > 0) {
      if (!confirm(`Ушбу сана (${targetDate}) учун аллақачон ${existing.length} та ёзув мавжуд. Қайта тўлдирмоқчимисиз?`)) {
        return
      }
    }

    const withoutDate = logs.filter(l => l.date !== targetDate)

    const pulses = ['74-76', '76-78', '78-80', '80-82', '76-78']
    const temps = ['36.2', '36.3', '36.4', '36.2', '36.5']
    const pressures = ['120/80', '120/70', '115/70', '130/80', '125/80']

    // 10 ta asosiy haydovchini bir tugma bilan qo'shish
    const bulkDrivers = OFFICIAL_FLEET_DRIVERS.slice(0, 10)
    const newRows: DriverMedicalExamItem[] = bulkDrivers.map((driver, idx) => ({
      id: `dm-bulk-${Date.now()}-${idx}`,
      orderNumber: idx + 1,
      date: targetDate,
      driverName: driver,
      complaints: 'йўқ',
      pulse: pulses[idx % pulses.length],
      bodyTemp: temps[idx % temps.length],
      bloodPressure: pressures[idx % pressures.length],
      breathAlcohol: 'аниқланмади',
      result: 'соғлом, рейска рухсат',
      signature: 'Жуманова Ч.Э.',
      _dirty: true,
      _isNew: false
    }))

    // Oxirida yana 1 ta bo'sh qator
    newRows.push(createEmptyDriverRow(targetDate, newRows.length + 1))

    const merged = [...withoutDate, ...newRows]
    setLogs(merged)
    persistLogs(merged)
    toast.success(`Бугунги ${bulkDrivers.length} та ҳайдовчи кўрик жадвалига киритилди!`)
  }

  // Table items displayed (including 1 automatic empty row at bottom when on a single date)
  const displayedRows = useMemo(() => {
    let filtered = logs.filter(item => {
      const matchDate = filterDate === 'ALL' || item.date === filterDate
      const matchSearch =
        !searchQuery.trim() ||
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaints.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.result.toLowerCase().includes(searchQuery.toLowerCase())
      return matchDate && matchSearch
    })

    // Kirim-chiqim kabi: Bo'sh yangi qator turishi kerak
    if (filterDate !== 'ALL' && !searchQuery.trim()) {
      const hasEmpty = filtered.some(r => r._isNew && !r.driverName.trim())
      if (!hasEmpty) {
        const nextOrder = filtered.length + 1
        filtered = [...filtered, createEmptyDriverRow(filterDate, nextOrder)]
      }
    }

    return filtered
  }, [logs, filterDate, searchQuery])

  // Unsaved changes flag
  const hasUnsavedChanges = useMemo(() => {
    return logs.some(l => l._dirty && l.driverName.trim())
  }, [logs])

  // Export to CSV
  const handleExportCSV = () => {
    const targetRows = displayedRows.filter(r => r.driverName.trim())
    if (targetRows.length === 0) {
      toast.error("Экспорт қилиш учун ёзувлар йўқ!")
      return
    }

    const headers = [
      '№',
      'Ҳайдовчининг Ф.И.Ш.',
      'Сана',
      'Шикоятлари',
      'Томир уриши',
      'Тана ҳарорати',
      'Артериал босим',
      'Алкогол миқдори',
      'Тиббий кўрик натижаси',
      'Имзо'
    ]

    const csvRows = targetRows.map(r => [
      r.orderNumber,
      `"${r.driverName}"`,
      r.date,
      `"${r.complaints}"`,
      `"${r.pulse}"`,
      `"${r.bodyTemp}"`,
      `"${r.bloodPressure}"`,
      `"${r.breathAlcohol}"`,
      `"${r.result}"`,
      `"${r.signature}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Haydovchilar_kunlik_tibbi_korik_${filterDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Excel CSV файли юклаб олинди")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4 pb-12">
      {/* HTML Datalist for fast driver name auto-complete */}
      <datalist id="fleet-drivers-list">
        {OFFICIAL_FLEET_DRIVERS.map(driver => (
          <option key={driver} value={driver} />
        ))}
      </datalist>

      {/* Main Container - Simple, solid slate borders like Kirim-Chiqim */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-800 flex flex-col text-slate-900 dark:text-white overflow-hidden">
        
        {/* Top Header & Actions Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs">
              <Truck size={22} className="text-slate-800 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  Рейс олди кўриги
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
                  3 ва 4-расм бўйича расмий журнал
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                ЛИНИЯГА ЙЎНАЛТИРИЛГАН ҲАЙДОВЧИЛАРНИ КУНЛИК ТИББИЙ КЎРИКДАН ЎТКАЗИШ ЖУРНАЛИ
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Quick add empty row */}
            <button
              type="button"
              onClick={handleAddNewRow}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Ҳайдовчи қўшиш</span>
            </button>

            {/* Master Save All */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll || !hasUnsavedChanges}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              title="Барча ўзгаришларни сақлаш"
            >
              <Save size={15} />
              <span>{savingAll ? "Сақланмоқда..." : "Барчасини Сақлаш"}</span>
            </button>

            {/* Bulk check 10 drivers */}
            <button
              type="button"
              onClick={handleBulkCheckAllDrivers}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Бугунги барча 10 та ҳайдовчини автоматик тўлдириш"
            >
              <Zap size={15} className="text-amber-500" />
              <span className="hidden sm:inline">10 та ҳайдовчи</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Excel CSV шаклида юклаб олиш"
            >
              <Download size={15} />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Чоп этиш"
            >
              <Printer size={15} />
              <span>Чоп этиш</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Search Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Stepper */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleDateStep(-1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                title="Олдинги кун"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={14} className="text-slate-600 dark:text-slate-400" />
                <span className="text-slate-500 font-bold">Сана:</span>
                <input
                  type="date"
                  value={filterDate === 'ALL' ? '' : filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="bg-transparent outline-none font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDateStep(1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                title="Кейинги кун"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Quick Date Pills: Real dates only */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterDate(getTodayTashkent())}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterDate === getTodayTashkent()
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Бугун
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterDate === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Барча саналар
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Ҳайдовчи исми бўйича қидириш..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
              Жами кўрик: <strong className="text-slate-900 dark:text-white font-mono">{displayedRows.filter(r => r.driverName.trim()).length} нафар</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              ✓ Рейска рухсат: {displayedRows.filter(r => r.driverName.trim() && !r.result.toLowerCase().includes('рад') && !r.result.toLowerCase().includes('четлатилди')).length}
            </span>
          </div>
        </div>

        {/* Main Spreadsheet Table - Direct Inline Inputs (Huddi Kirim-Chiqim kabi) */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <th className="p-2.5 text-center font-bold w-12 border-r border-slate-300 dark:border-slate-700">
                    <div>Т/р</div>
                    <div className="text-[10px] text-slate-400 font-normal">1</div>
                  </th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">
                    <div>Ҳайдовчининг фамилияси, исми, отасининг исми *</div>
                    <div className="text-[10px] text-slate-400 font-normal">2</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[100px] border-r border-slate-300 dark:border-slate-700">
                    <div>Шикоятлари</div>
                    <div className="text-[10px] text-slate-400 font-normal">3</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-28 border-r border-slate-300 dark:border-slate-700">
                    <div>Томир уриши</div>
                    <div className="text-[10px] text-slate-400 font-normal">4</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-28 border-r border-slate-300 dark:border-slate-700">
                    <div>Тана ҳарорати</div>
                    <div className="text-[10px] text-slate-400 font-normal">5</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-32 border-r border-slate-300 dark:border-slate-700">
                    <div>Артериал босим</div>
                    <div className="text-[10px] text-slate-400 font-normal">6</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[180px] border-r border-slate-300 dark:border-slate-700">
                    <div>Алкогол миқдори</div>
                    <div className="text-[10px] text-slate-400 font-normal">7</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">
                    <div>Тиббий кўрик натижалари</div>
                    <div className="text-[10px] text-slate-400 font-normal">8</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-32 border-r border-slate-300 dark:border-slate-700">
                    <div>Ҳамшира имзоси</div>
                    <div className="text-[10px] text-slate-400 font-normal">9</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-24 no-print">Амаллар</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, idx) => {
                  const isRowEmptyNew = row._isNew && !row.driverName.trim()
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-200 dark:border-slate-800 transition ${
                        row._dirty
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : isRowEmptyNew
                          ? 'bg-slate-50/40 dark:bg-slate-900/40'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-850/60'
                      }`}
                    >
                      {/* 1. Tartib raqami */}
                      <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                        {row.orderNumber || idx + 1}
                      </td>

                      {/* 2. Haydovchi F.I.Sh. (Direct Input with fast suggestions) */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            list="fleet-drivers-list"
                            value={row.driverName}
                            onChange={e => updateRowField(row.id, { driverName: e.target.value })}
                            placeholder={isRowEmptyNew ? "+ Янги ҳайдовчини ёзинг ёки танланг..." : "Ҳайдовчи Ф.И.Ш."}
                            className={`w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs text-slate-900 dark:text-white outline-none transition ${
                              isRowEmptyNew
                                ? 'bg-white dark:bg-slate-800 border-dashed border-slate-400 dark:border-slate-600 placeholder:text-slate-400 placeholder:font-normal'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white shadow-2xs'
                            }`}
                          />
                        </div>
                      </td>

                      {/* 3. Shikoyatlari */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.complaints}
                          onChange={e => updateRowField(row.id, { complaints: e.target.value })}
                          placeholder="йўқ"
                          className="w-full text-center px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* 4. Tomir urishi */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.pulse}
                          onChange={e => updateRowField(row.id, { pulse: e.target.value })}
                          placeholder="76-78"
                          className="w-full text-center font-mono font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* 5. Tana harorati */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.bodyTemp}
                          onChange={e => updateRowField(row.id, { bodyTemp: e.target.value })}
                          placeholder="36.2"
                          className="w-full text-center font-mono font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* 6. Arterial bosim */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.bloodPressure}
                          onChange={e => updateRowField(row.id, { bloodPressure: e.target.value })}
                          placeholder="120/80"
                          className="w-full text-center font-mono font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* 7. Alkogol miqdori */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <select
                          value={row.breathAlcohol}
                          onChange={e => updateRowField(row.id, { breathAlcohol: e.target.value })}
                          className={`w-full px-2 py-1.5 rounded-lg border font-bold text-xs text-center outline-none cursor-pointer ${
                            row.breathAlcohol.includes('аниқланди') && !row.breathAlcohol.includes('аниқланмади')
                              ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <option value="аниқланмади">аниқланмади (тоза)</option>
                          <option value="аниқланди">аниқланди (ичган)</option>
                        </select>
                      </td>

                      {/* 8. Tibbiy ko'rik natijalari */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <select
                          value={row.result}
                          onChange={e => updateRowField(row.id, { result: e.target.value })}
                          className={`w-full px-2 py-1.5 rounded-lg border font-bold text-xs outline-none cursor-pointer ${
                            row.result.toLowerCase().includes('рад') || row.result.toLowerCase().includes('четлатилди')
                              ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <option value="соғлом, рейска рухсат">✓ соғлом, рейска рухсат</option>
                          <option value="соғлом эмас, четлатилди">✕ соғлом эмас, четлатилди</option>
                        </select>
                      </td>

                      {/* 9. Hamshira imzosi */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.signature}
                          onChange={e => updateRowField(row.id, { signature: e.target.value })}
                          placeholder="Жуманова Ч.Э."
                          className="w-full text-center font-serif italic font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* 10. Amallar (Saqlash / O'chirish) */}
                      <td className="p-1.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(row.id)}
                            disabled={!row.driverName.trim()}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              row._dirty && row.driverName.trim()
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs animate-pulse'
                                : row.driverName.trim()
                                ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                            title="Сақлаш"
                          >
                            <Save size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Ўчириш"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />
            <span>
              Масъул тиббий ходим: <strong>Жуманова Ч.Э.</strong> (Фельдшер / Ҳамшира) • Расмий 9 та устунли рейс олди тиббий кўрик журнали
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Ўзгаришлар киритилгандан сўнг <strong>Барчасини Сақлаш</strong> тугмасини босинг.
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  HeartPulse,
  Truck,
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
  Building2,
  Briefcase
} from 'lucide-react'
import { toast } from 'sonner'

export interface FirstAidOfficialLogItem {
  id: string
  orderNumber: number // №
  date: string // Сана (masalan: 2026-01-09)
  time: string // Вақт (masalan: 08:05)
  employeeName: string // Ходимнинг Ф.И.Ш.
  position: string // Лавозими (Ҳайдовчи, Оператор, Ошпаз...)
  department: string // Бўлинма (Логистика, Цех, Ошхона, Омборхона...)
  complaint: string // Мурожаат сабаби / шикоят
  nurseInspection: string // Ҳамшира кўриги натижаси (А/Б, Пульс, Температура...)
  aidProvided: string // Кўрсатилган ёрдам
  referralOrRelease: string // Тиббий муассасага юбориш / ишдан озод қилиш
  nurseSignature: string // Ҳамширанинг имзоси
  employeeSignature: string // Ходим имзоси
  _dirty?: boolean
  _isNew?: boolean
}

const DEPARTMENTS = ['Цех', 'Логистика', 'Ошхона', 'Омборхона', 'Маъмурият', 'Техник бўлим']
const POSITIONS = ['Оператор', 'Ҳайдовчи', 'Ошпаз', 'Сараловчи', 'Юкловчи', 'Уста', 'Механик', 'Ҳамшира']

const getTodayTashkent = () => {
  const d = new Date()
  const tzOffset = 5 * 60 * 60 * 1000
  return new Date(d.getTime() + tzOffset).toISOString().slice(0, 10)
}

const createEmptyFirstAidRow = (date: string, orderNumber: number): FirstAidOfficialLogItem => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  orderNumber,
  date: date || getTodayTashkent(),
  time: new Date().toTimeString().slice(0, 5),
  employeeName: '',
  position: 'Оператор',
  department: 'Цех',
  complaint: '',
  nurseInspection: 'А/Б: 120/80, Пульс: 76, Температура: 36.4.',
  aidProvided: 'Биринчи тиббий ёрдам кўрсатилди.',
  referralOrRelease: 'Ҳолати қониқарли, иш фаолиятини давом эттиришга рухсат берилди.',
  nurseSignature: 'Жуманова Ч.Э.',
  employeeSignature: '',
  _isNew: true,
  _dirty: false
})

export function FirstAidJournalView({ isFullPage = true }: { isFullPage?: boolean } = {}) {
  const [logs, setLogs] = useState<FirstAidOfficialLogItem[]>([])
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [searchQuery, setSearchQuery] = useState('')
  const [savingAll, setSavingAll] = useState(false)

  // Load from localStorage (filtrlash: eski mock/demo namunalar tozalanadi)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_first_aid_official_logs_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Namuna (demo) ma'lumotlarni filtrlab olib tashlash
          const cleaned = parsed.filter(item => {
            if (!item || !item.id) return false
            const isMock = typeof item.id === 'string' && /^fa-\d+$/.test(item.id) && (item.date === '2026-01-09' || item.date === '2026-01-05' || item.date === '2025-12-09')
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
  const persistLogs = useCallback((updated: FirstAidOfficialLogItem[]) => {
    // Faqat haqiqiy (nomi bor) yozuvlarni saqlaymiz
    const cleanToStore = updated
      .filter(l => l.employeeName.trim())
      .map(l => ({
        id: l.id.startsWith('new-') ? `fa-real-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : l.id,
        orderNumber: l.orderNumber,
        date: l.date,
        time: l.time || '08:00',
        employeeName: l.employeeName.trim(),
        position: l.position || 'Оператор',
        department: l.department || 'Цех',
        complaint: l.complaint || '',
        nurseInspection: l.nurseInspection || 'А/Б: 120/80, Пульс: 76, Температура: 36.4.',
        aidProvided: l.aidProvided || 'Биринчи тиббий ёрдам кўрсатилди.',
        referralOrRelease: l.referralOrRelease || 'Ҳолати қониқарли, ишга рухсат берилди.',
        nurseSignature: l.nurseSignature || 'Жуманова Ч.Э.',
        employeeSignature: l.employeeSignature || l.employeeName.trim()
      }))

    try {
      localStorage.setItem('gp_first_aid_official_logs_2026', JSON.stringify(cleanToStore))
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
  const updateRowField = (id: string, patch: Partial<FirstAidOfficialLogItem>) => {
    setLogs(prev => {
      const idx = prev.findIndex(item => item.id === id)
      if (idx === -1) return prev

      const next = [...prev]
      const cur = next[idx]
      const updated = { ...cur, ...patch, _dirty: true }
      next[idx] = updated

      // Kirim-chiqim kabi: Agar yangi qatorda xodim ismi yozilsa, darhol keyingi bo'sh qatorni tayyorlab qo'yadi
      if (updated._isNew && updated.employeeName.trim() && idx === next.length - 1 && filterDate !== 'ALL') {
        const nextOrder = next.filter(l => l.date === filterDate).length + 1
        next.push(createEmptyFirstAidRow(filterDate, nextOrder))
      }

      return next
    })
  }

  // Add explicit new row
  const handleAddNewRow = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const existing = logs.filter(l => l.date === targetDate)
    const nextOrder = existing.length + 1
    const newRow = createEmptyFirstAidRow(targetDate, nextOrder)
    newRow._dirty = true

    setLogs(prev => [...prev, newRow])
    toast.info("Янги қатор қўшилди. Ходим маълумотларини киритинг.")
  }

  // Save single row
  const handleSaveRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return
    if (!row.employeeName.trim()) {
      toast.error("Илтимос, ходим Ф.И.Ш.ни киритинг!")
      return
    }

    const updated = logs.map(l => (l.id === id ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    toast.success(`№${row.orderNumber} ${row.employeeName} мурожаати сақланди`)
  }

  // Save all dirty rows
  const handleSaveAll = () => {
    const dirtyRows = logs.filter(l => l._dirty && l.employeeName.trim())
    if (dirtyRows.length === 0) {
      toast.info("Ўзгаришлар йўқ, барчаси сақланган")
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l._dirty && l.employeeName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(`${dirtyRows.length} та тиббий ёрдам маълумотлари сақланди`)
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return

    if (row._isNew && !row.employeeName.trim()) {
      return
    }

    if (!confirm(`"${row.employeeName || 'Мурожаат'}" ёзувини ўчирмоқчимисиз?`)) return
    const updated = logs.filter(l => l.id !== id)
    setLogs(updated)
    persistLogs(updated)
    toast.success("Ёзув ўчирилди")
  }

  // Table items displayed (including 1 automatic empty row at bottom when on a single date)
  const displayedRows = useMemo(() => {
    let filtered = logs.filter(item => {
      const matchDate = filterDate === 'ALL' || item.date === filterDate
      const matchSearch =
        !searchQuery.trim() ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaint.toLowerCase().includes(searchQuery.toLowerCase())
      return matchDate && matchSearch
    })

    // Kirim-chiqim kabi: Bo'sh yangi qator turishi kerak
    if (filterDate !== 'ALL' && !searchQuery.trim()) {
      const hasEmpty = filtered.some(r => r._isNew && !r.employeeName.trim())
      if (!hasEmpty) {
        const nextOrder = filtered.length + 1
        filtered = [...filtered, createEmptyFirstAidRow(filterDate, nextOrder)]
      }
    }

    return filtered
  }, [logs, filterDate, searchQuery])

  // Unsaved changes flag
  const hasUnsavedChanges = useMemo(() => {
    return logs.some(l => l._dirty && l.employeeName.trim())
  }, [logs])

  // Export to CSV
  const handleExportCSV = () => {
    const targetRows = displayedRows.filter(r => r.employeeName.trim())
    if (targetRows.length === 0) {
      toast.error("Экспорт қилиш учун ёзувлар йўқ!")
      return
    }

    const headers = [
      '№',
      'Сана',
      'Вақт',
      'Ходимнинг Ф.И.Ш.',
      'Лавозими',
      'Бўлинма',
      'Мурожаат сабаби / шикоят',
      'Ҳамшира кўриги натижаси',
      'Кўрсатилган ёрдам',
      'Тиббий муассасага / ишдан озод қилиш',
      'Ҳамшира имзоси',
      'Ходим имзоси'
    ]

    const csvRows = targetRows.map(r => [
      r.orderNumber,
      r.date,
      r.time,
      `"${r.employeeName}"`,
      `"${r.position}"`,
      `"${r.department}"`,
      `"${r.complaint}"`,
      `"${r.nurseInspection}"`,
      `"${r.aidProvided}"`,
      `"${r.referralOrRelease}"`,
      `"${r.nurseSignature}"`,
      `"${r.employeeSignature || r.employeeName}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Birinchi_yordam_jurnali_${filterDate}.csv`
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
      {/* HTML Datalists for fast autocomplete */}
      <datalist id="dept-list">
        {DEPARTMENTS.map(d => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <datalist id="pos-list">
        {POSITIONS.map(p => (
          <option key={p} value={p} />
        ))}
      </datalist>

      {/* Main Container - Simple, solid slate borders like Kirim-Chiqim */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-800 flex flex-col text-slate-900 dark:text-white overflow-hidden">
        
        {/* Top Header & Actions Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs">
              <HeartPulse size={22} className="text-slate-800 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  Тиббий қабул
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
                  1 ва 2-расм бўйича расмий 12 та устунли журнал
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                ХОДИМЛАРГА БИРИНЧИ ЁРДАМ КЎРСАТИШ ВА ТИББИЙ ҚАБУЛ ЖУРНАЛИ
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
              <span>+ Янги мурожаат</span>
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
                placeholder="Ходим исми ёки бўлим бўйича қидириш..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
              Жами: <strong className="text-slate-900 dark:text-white font-mono">{displayedRows.filter(r => r.employeeName.trim()).length} та</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              ✓ Ишга қайтган: {displayedRows.filter(r => r.employeeName.trim() && !r.referralOrRelease.toLowerCase().includes('озод') && !r.referralOrRelease.toLowerCase().includes('муассаса')).length}
            </span>
          </div>
        </div>

        {/* Main Spreadsheet Table - Direct Inline Inputs (Huddi Kirim-Chiqim kabi) */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <th className="p-2.5 text-center font-bold w-12 border-r border-slate-300 dark:border-slate-700">№</th>
                  <th className="p-2.5 text-center font-bold w-36 border-r border-slate-300 dark:border-slate-700">Сана ва вақт</th>
                  <th className="p-2.5 text-left font-bold min-w-[190px] border-r border-slate-300 dark:border-slate-700">Ходимнинг Ф.И.Ш. *</th>
                  <th className="p-2.5 text-left font-bold min-w-[160px] border-r border-slate-300 dark:border-slate-700">Лавозими / Бўлинма</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">Мурожаат сабаби / шикоят</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">Ҳамшира кўриги натижаси</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">Кўрсатилган ёрдам</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">Тиббий муассасага / озод қилиш</th>
                  <th className="p-2.5 text-center font-bold w-28 border-r border-slate-300 dark:border-slate-700">Ҳамшира имзоси</th>
                  <th className="p-2.5 text-center font-bold w-24 no-print">Амаллар</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, idx) => {
                  const isRowEmptyNew = row._isNew && !row.employeeName.trim()
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
                      {/* № */}
                      <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                        {row.orderNumber || idx + 1}
                      </td>

                      {/* Сана ва вақт */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={row.date}
                            onChange={e => updateRowField(row.id, { date: e.target.value })}
                            className="w-24 px-1 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                          />
                          <input
                            type="time"
                            value={row.time}
                            onChange={e => updateRowField(row.id, { time: e.target.value })}
                            className="w-16 px-1 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      </td>

                      {/* Ходимнинг Ф.И.Ш. */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.employeeName}
                          onChange={e => updateRowField(row.id, { employeeName: e.target.value })}
                          placeholder={isRowEmptyNew ? "+ Янги мурожаатчи ходим Ф.И.Ш..." : "Ходим Ф.И.Ш."}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs text-slate-900 dark:text-white outline-none transition ${
                            isRowEmptyNew
                              ? 'bg-white dark:bg-slate-800 border-dashed border-slate-400 dark:border-slate-600 placeholder:text-slate-400 placeholder:font-normal'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white shadow-2xs'
                          }`}
                        />
                      </td>

                      {/* Лавозими ва бўлими */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            list="pos-list"
                            value={row.position}
                            onChange={e => updateRowField(row.id, { position: e.target.value })}
                            placeholder="Лавозими"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                          />
                          <input
                            type="text"
                            list="dept-list"
                            value={row.department}
                            onChange={e => updateRowField(row.id, { department: e.target.value })}
                            placeholder="Бўлим"
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 outline-none focus:border-slate-700"
                          />
                        </div>
                      </td>

                      {/* Мурожаат сабаби / шикоят */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.complaint}
                          onChange={e => updateRowField(row.id, { complaint: e.target.value })}
                          placeholder="Мурожаат сабаби, шикоят..."
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Ҳамшира кўриги натижаси */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.nurseInspection}
                          onChange={e => updateRowField(row.id, { nurseInspection: e.target.value })}
                          placeholder="А/Б, пульс, t°..."
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Кўрсатилган ёрдам */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.aidProvided}
                          onChange={e => updateRowField(row.id, { aidProvided: e.target.value })}
                          placeholder="Кўрсатилган ёрдам, препаратлар..."
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Тиббий муассасага / ишдан озод қилиш */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.referralOrRelease}
                          onChange={e => updateRowField(row.id, { referralOrRelease: e.target.value })}
                          placeholder="Ҳолати қониқарли / озод қилинди / поликлиникага..."
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Ҳамшира имзоси */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.nurseSignature}
                          onChange={e => updateRowField(row.id, { nurseSignature: e.target.value })}
                          placeholder="Жуманова Ч.Э."
                          className="w-full text-center font-serif italic font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
                        />
                      </td>

                      {/* Амаллар */}
                      <td className="p-1.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(row.id)}
                            disabled={!row.employeeName.trim()}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              row._dirty && row.employeeName.trim()
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs animate-pulse'
                                : row.employeeName.trim()
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
              Масъул тиббий ходим: <strong>Жуманова Ч.Э.</strong> • 1 ва 2-расм бўйича расмий 12 та устунли тиббий қабул журнали
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

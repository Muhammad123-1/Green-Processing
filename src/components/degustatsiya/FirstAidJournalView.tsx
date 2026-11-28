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
  Briefcase,
  Archive,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

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
  const { formatDual, lang } = useLanguage()
  const [logs, setLogs] = useState<FirstAidOfficialLogItem[]>([])
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'daily' | 'archive'>('daily')
  const [savingAll, setSavingAll] = useState(false)
  const [medAlerts, setMedAlerts] = useState<{
    total: number
    expired: number
    urgent: number
    redTotal: number
    urgentList: { fullName: string; department: string; examDate: string; bloodPressure: string; status: string }[]
  }>({ total: 0, expired: 0, urgent: 0, redTotal: 0, urgentList: [] })

  // Fetch Medosmotr RED alerts to warn First Aid nurse
  useEffect(() => {
    fetch('/api/medosmotr?status=RED')
      .then(res => res.json())
      .then(data => {
        if (data?.summary) {
          setMedAlerts({
            total: data.summary.total || 0,
            expired: data.summary.expired || 0,
            urgent: data.summary.urgent || 0,
            redTotal: data.summary.redTotal || 0,
            urgentList: (data.items || []).slice(0, 10).map((i: any) => ({
              fullName: i.fullName,
              department: i.department,
              examDate: i.examDate,
              bloodPressure: i.bloodPressure || '',
              status: i.status
            }))
          })
        }
      })
      .catch(() => {})
  }, [])

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
      next[idx] = { ...cur, ...patch, _dirty: true }
      return next
    })
  }

  // Add explicit new row (faqat tugma bosilganda jadvalning eng tepasiga qo'shiladi)
  const handleAddNewRow = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const newRow = createEmptyFirstAidRow(targetDate, 1)
    newRow._dirty = true
    newRow._isNew = true

    // Eng tepaga qo'shamiz (user talabi bo'yicha)
    setLogs(prev => [newRow, ...prev])
    toast.info(formatDual("Yangi qator qo'shildi. Xodim ma'lumotlarini kiriting.", "Добавлена новая строка. Введите данные сотрудника.", "New row added. Enter employee details."))
  }

  // Save single row
  const handleSaveRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return
    if (!row.employeeName.trim()) {
      toast.error(formatDual("Iltimos, xodim F.I.Sh.ni kiriting!", "Пожалуйста, введите Ф.И.О. сотрудника!", "Please enter employee full name!"))
      return
    }

    const updated = logs.map(l => (l.id === id ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    toast.success(formatDual(`№${row.orderNumber} ${row.employeeName} murojaati saqlandi`, `№${row.orderNumber} Обращение ${row.employeeName} сохранено`, `№${row.orderNumber} Record for ${row.employeeName} saved`))
  }

  // Save all dirty rows
  const handleSaveAll = () => {
    const dirtyRows = logs.filter(l => l._dirty && l.employeeName.trim())
    if (dirtyRows.length === 0) {
      toast.info(formatDual("O'zgarishlar yo'q, barchasi saqlangan", "Нет изменений, всё сохранено", "No changes, all saved"))
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l._dirty && l.employeeName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(formatDual(`${dirtyRows.length} ta tibbiy yordam ma'lumotlari saqlandi`, `Сохранено ${dirtyRows.length} записей медпомощи`, `Saved ${dirtyRows.length} first aid records`))
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return

    if (row._isNew && !row.employeeName.trim()) {
      setLogs(prev => prev.filter(l => l.id !== id))
      return
    }

    const confirmMsg = formatDual(
      `"${row.employeeName || 'Murojaat'}" yozuvini o'chirmoqchimisiz?`,
      `Удалить запись "${row.employeeName || 'Обращение'}"?`,
      `Delete record "${row.employeeName || 'Record'}"?`
    )
    if (!confirm(confirmMsg)) return
    const updated = logs.filter(l => l.id !== id)
    setLogs(updated)
    persistLogs(updated)
    toast.success(formatDual("Yozuv o'chirildi", "Запись удалена", "Record deleted"))
  }

  // Table items displayed - faqat mavjud va yangi qo'shilgan qatorlar ko'rsatiladi
  const displayedRows = useMemo(() => {
    return logs.filter(item => {
      const matchDate = filterDate === 'ALL' || item.date === filterDate
      const matchSearch =
        !searchQuery.trim() ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaint.toLowerCase().includes(searchQuery.toLowerCase())
      return matchDate && matchSearch
    })
  }, [logs, filterDate, searchQuery])

  // Group all logs by date for Archive view
  const archivedDays = useMemo(() => {
    const map = new Map<string, FirstAidOfficialLogItem[]>()
    logs.forEach(item => {
      if (!item.date || !item.employeeName.trim()) return
      const list = map.get(item.date) || []
      list.push(item)
      map.set(item.date, list)
    })

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

    return sortedDates.map(dateStr => {
      const items = map.get(dateStr) || []
      const returnedToWork = items.filter(
        i => !i.referralOrRelease.toLowerCase().includes('озод') && !i.referralOrRelease.toLowerCase().includes('муассаса')
      ).length
      const releasedOrReferred = items.length - returnedToWork
      return {
        date: dateStr,
        total: items.length,
        returnedToWork,
        releasedOrReferred,
        nurseSignature: items[0]?.nurseSignature || 'Жуманова Ч.Э.',
        items
      }
    })
  }, [logs])

  const filteredArchivedDays = useMemo(() => {
    if (!archiveSearchQuery.trim()) return archivedDays
    const q = archiveSearchQuery.toLowerCase()
    return archivedDays.filter(day => {
      const matchDate = day.date.includes(q)
      const matchEmployee = day.items.some(
        i => i.employeeName.toLowerCase().includes(q) || i.department.toLowerCase().includes(q)
      )
      return matchDate || matchEmployee
    })
  }, [archivedDays, archiveSearchQuery])

  // Save daily journal for current day
  const handleSaveDailyJournal = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const currentDayItems = logs.filter(l => l.date === targetDate && l.employeeName.trim())

    if (currentDayItems.length === 0) {
      toast.error(formatDual(`${targetDate} sanasi uchun tibbiy murojaatlar kiritilmagan! Qator qo'shing.`, `На дату ${targetDate} нет обращений! Добавьте строку.`, `No records entered for ${targetDate}! Add a row.`))
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l.date === targetDate && l.employeeName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(
      formatDual(
        `${targetDate} kunlik tibbiy yordam jadvali saqlandi va arxivga kiritildi! (${currentDayItems.length} ta)`,
        `${targetDate} дневной журнал первой помощи сохранен в архив! (${currentDayItems.length})`,
        `${targetDate} daily first aid journal saved to archive! (${currentDayItems.length})`
      ),
      { icon: '💾' }
    )
  }

  // Export specific day CSV
  const handleExportDayCSV = (targetDate: string) => {
    const targetRows = logs.filter(r => r.date === targetDate && r.employeeName.trim())
    if (targetRows.length === 0) {
      toast.error(formatDual(`${targetDate} sanasida yozuvlar yo'q!`, `На дату ${targetDate} нет записей!`, `No records for ${targetDate}!`))
      return
    }

    const headers = [
      formatDual('№', '№', '#'),
      formatDual('Sana', 'Дата', 'Date'),
      formatDual('Vaqt', 'Время', 'Time'),
      formatDual('Xodimning F.I.Sh.', 'Ф.И.О. сотрудника', 'Employee Full Name'),
      formatDual('Lavozimi', 'Должность', 'Position'),
      formatDual("Bo'linma", 'Подразделение', 'Department'),
      formatDual('Murojaat sababi / shikoyat', 'Причина обращения / жалоба', 'Reason for visit / complaint'),
      formatDual("Hamshira ko'rigi natijasi", 'Результат осмотра медсестры', 'Nurse inspection result'),
      formatDual("Ko'rsatilgan yordam", 'Оказанная помощь', 'Aid provided'),
      formatDual('Tibbiy muassasaga / ishdan ozod qilish', 'В мед. учреждение / освобождение от работы', 'Referral / release from work'),
      formatDual('Hamshira imzosi', 'Подпись медсестры', 'Nurse signature'),
      formatDual('Xodim imzosi', 'Подпись сотрудника', 'Employee signature')
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
    link.download = `Birinchi_yordam_jurnali_${targetDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(formatDual(`${targetDate} sanasi Excel CSV fayli yuklab olindi`, `Файл Excel CSV за ${targetDate} скачан`, `Excel CSV file for ${targetDate} downloaded`))
  }

  // Unsaved changes flag
  const hasUnsavedChanges = useMemo(() => {
    return logs.some(l => l._dirty && l.employeeName.trim())
  }, [logs])

  // Export to CSV
  const handleExportCSV = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    handleExportDayCSV(targetDate)
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
                  {formatDual("Tibbiy qabul", "Медицинский прием", "Medical Reception")}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
                  {formatDual("1 va 2-rasm bo'yicha rasmiy 12 ta ustunli jurnal", "1 ва 2-расм бўйича расмий 12 та устунли журнал", "Official 12-column journal per form 1 & 2")}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {formatDual(
                  "XODIMLARGA BIRINCHI YORDAM KO'RSATISH VA TIBBIY QABUL JURNALI",
                  "ЖУРНАЛ ОКАЗАНИЯ ПЕРВОЙ ПОМОЩИ И МЕДИЦИНСКОГО ПРИЕМА СОТРУДНИКОВ",
                  "FIRST AID & MEDICAL RECEPTION JOURNAL FOR EMPLOYEES"
                )}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* View Mode Switcher: Kunlik jadval vs Arxiv */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar size={13} />
                <span>{formatDual("Kunlik jadval", "Дневной журнал", "Daily Journal")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('archive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'archive'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive size={13} />
                <span>{formatDual("Arxiv", "Архив", "Archive")} ({archivedDays.length})</span>
              </button>
            </div>

            {viewMode === 'daily' && (
              <button
                type="button"
                onClick={handleAddNewRow}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>{formatDual("Yangi murojaat qo'shish", "Добавить обращение", "Add new record")}</span>
              </button>
            )}

            {/* Master Save: КУНЛИК ЖАДВАЛНИ САҚЛАШ */}
            <button
              type="button"
              onClick={handleSaveDailyJournal}
              disabled={savingAll}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
              title={formatDual("Kunlik jadvalni saqlash va arxivga kiritish", "Сохранить дневной журнал и заархивировать", "Save daily journal and archive")}
            >
              <Save size={15} />
              <span>{savingAll ? formatDual("Saqlanmoqda...", "Сохранение...", "Saving...") : formatDual("Kunlik jadvalni saqlash", "Сохранить дневной журнал", "Save daily journal")}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
              title={formatDual("Excel CSV shaklida yuklab olish", "Скачать в формате Excel CSV", "Download as Excel CSV")}
            >
              <Download size={14} />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
              title={formatDual("Chop etish", "Печать", "Print")}
            >
              <Printer size={14} />
              <span>{formatDual("Chop etish", "Печать", "Print")}</span>
            </button>
          </div>
        </div>

        {/* Medosmotr RED Alert Banner for First Aid Nurse */}
        {medAlerts.redTotal > 0 && (
          <div className="mx-4 sm:mx-5 mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/80 text-rose-900 dark:text-rose-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-300 no-print">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 md:mt-0">
                <AlertTriangle size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                    {formatDual("Tibbiy ko'rik ogohlantirishi", "Предупреждение медосмотра", "Medical Exam Alert")}
                  </span>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {formatDual(
                      `${medAlerts.redTotal} nafar xodim tibbiy ko'rik (Medosmotr) QIZIL zonasida!`,
                      `${medAlerts.redTotal} сотрудников в КРАСНОЙ зоне периодического медосмотра!`,
                      `${medAlerts.redTotal} employees in RED medical exam alert zone!`
                    )}
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 mt-1 leading-relaxed">
                  {formatDual(
                    `Muddati o'tgan (${medAlerts.expired} ta) yoki qon bosimi yuqori / yaqinlashgan (${medAlerts.urgent} ta) xodimlarga e'tibor bering. Birinchi yordam ko'rsatishda ularning tibbiy ko'rik holatini inobatga oling.`,
                    `Обратите внимание на сотрудников с истекшим сроком (${medAlerts.expired}) или высоким давлением (${medAlerts.urgent}). Учитывайте статус при допуске к работе.`,
                    `Pay attention to employees with expired checkups (${medAlerts.expired}) or high BP (${medAlerts.urgent}).`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <Link
                href="/medosmotr?status=RED"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>{formatDual("Qizil ro'yxatni ko'rish (Medosmotr)", "Смотреть красный список", "View Red List")}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* View Switcher Content */}
        {viewMode === 'archive' ? (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Archive Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
                  <Archive size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {formatDual("Xodimlar birinchi yordam qabullari arxivi", "Архив приемов первой помощи сотрудников", "Employees First Aid Archive")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDual(
                      `Jami ${archivedDays.length} kunlik murojaatlar jadvali saqlangan`,
                      `Всего сохранено ${archivedDays.length} дневных журналов`,
                      `Total ${archivedDays.length} daily journals archived`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder={formatDual("Sana yoki xodim qidirish...", "Поиск по дате или сотруднику...", "Search by date or employee...")}
                    value={archiveSearchQuery}
                    onChange={e => setArchiveSearchQuery(e.target.value)}
                    className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilterDate(getTodayTashkent())
                    setViewMode('daily')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{formatDual("Bugungi kunga qaytish", "Вернуться на сегодня", "Back to today")}</span>
                </button>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Arxivlangan kunlar", "Архивных дней", "Archived days")}</span>
                <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">{archivedDays.length} {formatDual("kun", "дн.", "days")}</strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Jami murojaatlar", "Всего обращений", "Total records")}</span>
                <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {logs.filter(l => l.employeeName.trim()).length} {formatDual("ta", "зап.", "records")}
                </strong>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-emerald-700 dark:text-emerald-400 block mb-1">{formatDual("Ishga qaytganlar", "Вернулись к работе", "Returned to work")}</span>
                <strong className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  {logs.filter(l => l.employeeName.trim() && !l.referralOrRelease.toLowerCase().includes('озод') && !l.referralOrRelease.toLowerCase().includes('муассаса')).length} {formatDual("ta", "чел.", "")}
                </strong>
              </div>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
                <span className="text-rose-700 dark:text-rose-400 block mb-1">{formatDual("Ozod etilgan / Kasalxonaga", "Освобождены / В больницу", "Released / Hospitalized")}</span>
                <strong className="text-lg font-black text-rose-800 dark:text-rose-300 font-mono">
                  {logs.filter(l => l.employeeName.trim() && (l.referralOrRelease.toLowerCase().includes('озод') || l.referralOrRelease.toLowerCase().includes('муассаса'))).length} {formatDual("ta", "чел.", "")}
                </strong>
              </div>
            </div>

            {/* Archived Days Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase font-bold text-[11px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-3 text-center w-12">{formatDual("№", "№", "#")}</th>
                    <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                    <th className="p-3 text-center">{formatDual("Murojaatlar soni", "Кол-во обращений", "Records count")}</th>
                    <th className="p-3 text-center">{formatDual("Ishga qaytganlar", "Вернулись к работе", "Returned to work")}</th>
                    <th className="p-3 text-center">{formatDual("Ozod etilgan / Yuborilgan", "Освобождены / Направлены", "Released / Referred")}</th>
                    <th className="p-3 min-w-[150px]">{formatDual("Mas'ul hamshira", "Ответственная медсестра", "Nurse in charge")}</th>
                    <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                    <th className="p-3 text-center w-48">{formatDual("Amallar", "Действия", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredArchivedDays.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        {formatDual("Arxivda yozuvlar mavjud emas", "В архиве нет записей", "No records in archive")}
                      </td>
                    </tr>
                  ) : (
                    filteredArchivedDays.map((day, idx) => {
                      const isToday = day.date === getTodayTashkent()
                      return (
                        <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{day.date}</span>
                              {isToday && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold">
                                  {formatDual("Bugun", "Сегодня", "Today")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold font-mono">{day.total} {formatDual("ta", "зап.", "")}</td>
                          <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ✓ {day.returnedToWork}
                          </td>
                          <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400 font-mono">
                            {day.releasedOrReferred > 0 ? `✕ ${day.releasedOrReferred}` : '0'}
                          </td>
                          <td className="p-3 font-serif italic text-slate-700 dark:text-slate-300 whitespace-nowrap">{day.nurseSignature}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                              <CheckCircle2 size={12} className="text-emerald-500" /> {formatDual("Arxivlangan", "Архивировано", "Archived")}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterDate(day.date)
                                  setViewMode('daily')
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1"
                                title={formatDual("Ushbu kunlik jadvalni ko'rish va tahrirlash", "Просмотреть и редактировать дневной журнал", "View and edit daily journal")}
                              >
                                <Eye size={13} /> {formatDual("Ko'rish", "Просмотр", "View")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExportDayCSV(day.date)}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
                                title={formatDual("Ushbu kunni Excel eksport qilish", "Экспортировать день в Excel", "Export day to Excel")}
                              >
                                <Download size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterDate(day.date)
                                  setTimeout(() => window.print(), 100)
                                }}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
                                title={formatDual("Ushbu kunni chop etish", "Распечатать день", "Print day")}
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Date Filter & Search Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Stepper */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleDateStep(-1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                title={formatDual("Oldingi kun", "Предыдущий день", "Previous day")}
              >
                <ChevronLeft size={15} />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={14} className="text-slate-600 dark:text-slate-400" />
                <span className="text-slate-500 font-bold">{formatDual("Sana:", "Дата:", "Date:")}</span>
                <input
                  type="date"
                  value={filterDate === 'ALL' ? '' : filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="!bg-transparent bg-transparent outline-none font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDateStep(1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                title={formatDual("Keyingi kun", "Следующий день", "Next day")}
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
                {formatDual("Bugun", "Сегодня", "Today")}
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
                {formatDual("Barcha sanalar", "Все даты", "All dates")}
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder={formatDual("Xodim ismi yoki bo'lim bo'yicha qidirish...", "Поиск по имени сотрудника или отделу...", "Search by employee name or department...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
              {formatDual("Jami:", "Всего:", "Total:")} <strong className="text-slate-900 dark:text-white font-mono">{displayedRows.filter(r => r.employeeName.trim()).length} {formatDual("ta", "зап.", "")}</strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              {formatDual("✓ Ishga qaytgan:", "✓ Вернулись к работе:", "✓ Returned to work:")} {displayedRows.filter(r => r.employeeName.trim() && !r.referralOrRelease.toLowerCase().includes('озод') && !r.referralOrRelease.toLowerCase().includes('муассаса')).length}
            </span>
          </div>
        </div>

        {/* Main Spreadsheet Table - Direct Inline Inputs (Huddi Kirim-Chiqim kabi) */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <th className="p-2.5 text-center font-bold w-12 border-r border-slate-300 dark:border-slate-700">{formatDual("№", "№", "#")}</th>
                  <th className="p-2.5 text-center font-bold w-36 border-r border-slate-300 dark:border-slate-700">{formatDual("Sana va vaqt", "Дата и время", "Date & Time")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[190px] border-r border-slate-300 dark:border-slate-700">{formatDual("Xodimning F.I.Sh. *", "Ф.И.О. сотрудника *", "Employee full name *")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[160px] border-r border-slate-300 dark:border-slate-700">{formatDual("Lavozimi / Bo'linma", "Должность / Отдел", "Position / Dept")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">{formatDual("Murojaat sababi / shikoyat", "Причина обращения / жалоба", "Reason for visit / complaint")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">{formatDual("Hamshira ko'rigi natijasi", "Результат осмотра медсестры", "Nurse inspection result")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">{formatDual("Ko'rsatilgan yordam", "Оказанная помощь", "Aid provided")}</th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">{formatDual("Tibbiy muassasaga / ozod qilish", "В мед. учреждение / освобождение", "Referral / Release")}</th>
                  <th className="p-2.5 text-center font-bold min-w-[170px] w-48 border-r border-slate-300 dark:border-slate-700">{formatDual("Hamshira imzosi", "Подпись медсестры", "Nurse signature")}</th>
                  <th className="p-2.5 text-center font-bold w-24 no-print">{formatDual("Amallar", "Действия", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium text-sm">{formatDual("Ushbu sanada tibbiy yordam yozuvlari mavjud emas", "На эту дату записей первой помощи нет", "No first aid records for this date")}</p>
                        <button
                          type="button"
                          onClick={handleAddNewRow}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                        >
                          <Plus size={14} /> {formatDual("Murojaat qo'shish", "Добавить обращение", "Add record")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => {
                    const isRowEmptyNew = row._isNew && !row.employeeName.trim()
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-200 dark:border-slate-800 transition ${
                          row._dirty
                            ? 'bg-amber-50/70 dark:bg-amber-950/20'
                            : isRowEmptyNew
                            ? 'bg-slate-50/40 dark:bg-slate-900/40'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {/* № */}
                        <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                          {idx + 1}
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
                            placeholder={formatDual("Xodim F.I.Sh.", "Ф.И.О. сотрудника", "Employee full name")}
                            className="w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs text-slate-900 dark:text-white outline-none transition bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white shadow-2xs"
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
                            placeholder={formatDual("Lavozimi", "Должность", "Position")}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
                          />
                          <input
                            type="text"
                            list="dept-list"
                            value={row.department}
                            onChange={e => updateRowField(row.id, { department: e.target.value })}
                            placeholder={formatDual("Bo'lim", "Отдел", "Department")}
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
                          placeholder={formatDual("Murojaat sababi, shikoyat...", "Причина обращения, жалоба...", "Reason for visit, complaint...")}
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Ҳамшира кўриги натижаси */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.nurseInspection}
                          onChange={e => updateRowField(row.id, { nurseInspection: e.target.value })}
                          placeholder={formatDual("A/B, puls, t°...", "А/Д, пульс, t°...", "BP, pulse, temp...")}
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Кўрсатилган ёрдам */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.aidProvided}
                          onChange={e => updateRowField(row.id, { aidProvided: e.target.value })}
                          placeholder={formatDual("Ko'rsatilgan yordam, preparatlar...", "Оказанная помощь, препараты...", "Aid provided, medications...")}
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Тиббий муассасага / ишдан озод қилиш */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={row.referralOrRelease}
                          onChange={e => updateRowField(row.id, { referralOrRelease: e.target.value })}
                          placeholder={formatDual("Holati qoniqarli / ozod qilindi / poliklinikaga...", "Состояние удовлетворительное / освобожден / в поликлинику...", "Condition satisfactory / released / to clinic...")}
                          className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 resize-y"
                        />
                      </td>

                      {/* Ҳамшира имзоси */}
                      <td className="p-1.5 min-w-[170px] w-48 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.nurseSignature}
                          onChange={e => updateRowField(row.id, { nurseSignature: e.target.value })}
                          placeholder="Жуманова Ч.Э."
                          className="w-full text-center font-serif italic font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 whitespace-nowrap"
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
                            title={formatDual("Saqlash", "Сохранить", "Save")}
                          >
                            <Save size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title={formatDual("O'chirish", "Удалить", "Delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        )}

        {/* Footer Info */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />
            <span>
              {formatDual("Mas'ul tibbiy xodim:", "Ответственный медработник:", "Responsible medical staff:")} <strong>{formatDual("Jumanova Ch.E.", "Жуманова Ч.Э.", "Jumanova Ch.E.")}</strong> • {formatDual("1 va 2-rasm bo'yicha rasmiy 12 ta ustunli tibbiy qabul jurnali", "Официальный 12-колоночный журнал медицинского приема", "Official 12-column medical reception journal")}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {formatDual(
              "O'zgarishlar kiritilgandan so'ng Kunlik jadvalni saqlash tugmasini bosing. Barcha ma'lumotlar avtomatik arxivda saqlanadi.",
              "После внесения изменений нажмите кнопку Сохранить дневной журнал. Все данные автоматически сохраняются в архиве.",
              "After making changes, click Save Daily Journal. All data is automatically saved in the archive."
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

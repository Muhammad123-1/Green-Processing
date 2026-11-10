'use client'

import React, { useState, useEffect } from 'react'
import {
  HeartPulse,
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
  Edit2,
  Trash2,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet
} from 'lucide-react'
import { toast } from 'sonner'

export interface FirstAidLogItem {
  id: string
  date: string
  time: string
  employeeName: string
  department: string
  position: string
  reason: string
  treatment: string
  outcome: 'RETURNED_TO_WORK' | 'SENT_HOME' | 'REFERRED_TO_CLINIC'
  medicalStaffSign: string
  notes?: string
}

const DEFAULT_FIRST_AID_LOGS: FirstAidLogItem[] = [
  {
    id: 'fa-1',
    date: '2026-04-27',
    time: '10:15',
    employeeName: 'Алимов С.Б.',
    department: 'Технологик жараён (Sex)',
    position: 'Оператор',
    reason: 'Бармоқнинг кесилиши (1-даражали енгил шикаст)',
    treatment: '3% водород пероксид билан ишлов берилди, стерил боғлам қўйилди',
    outcome: 'RETURNED_TO_WORK',
    medicalStaffSign: 'Жуманова Ч.Э.',
    notes: 'Ҳолати қониқарли, иш фаолиятини давом эттирди'
  },
  {
    id: 'fa-2',
    date: '2026-04-27',
    time: '14:30',
    employeeName: 'Каримова Н.О.',
    department: 'Ошхона',
    position: 'Ошпаз ёрдамчиси',
    reason: 'Бош айланиши ва артериал қон босими кўтарилиши (145/90)',
    treatment: 'Қон босими ўлчанди, тинчлантирувчи чой ва сув берилди, 30 дақиқа дам олдирилди',
    outcome: 'SENT_HOME',
    medicalStaffSign: 'Жуманова Ч.Э.',
    notes: 'Қон босими 125/80 га тушди, кун охиригача уйга дам олишга кузатилди'
  }
]

const QUICK_REASONS = [
  'Бармоқнинг енгил кесилиши',
  'Иссиқ сув/буғдан енгил куйиш (1-даража)',
  'Бош оғриғи ва чарчоқ',
  'Артериал қон босими кўтарилиши',
  'Кўзга бегона чанг тушиши'
]

const QUICK_TREATMENTS = [
  '3% водород пероксид билан ишлов берилди, стерил боғлам қўйилди',
  'Пантенол спрей сурилди, совутилди',
  'Қон босими ўлчанди, тинчлантирувчи дамлама берилди',
  'Кўз тоза қайнатилган сувда чайилди, альбуцид томизилди'
]

export function FirstAidJournalView() {
  const [logs, setLogs] = useState<FirstAidLogItem[]>(DEFAULT_FIRST_AID_LOGS)
  const [filterDate, setFilterDate] = useState<string>('2026-04-27')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<FirstAidLogItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    date: '2026-04-27',
    time: '10:00',
    employeeName: '',
    department: 'Технологик жараён (Sex)',
    position: '',
    reason: QUICK_REASONS[0],
    treatment: QUICK_TREATMENTS[0],
    outcome: 'RETURNED_TO_WORK' as 'RETURNED_TO_WORK' | 'SENT_HOME' | 'REFERRED_TO_CLINIC',
    medicalStaffSign: 'Жуманова Ч.Э.',
    notes: ''
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_first_aid_logs_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs(parsed)
        }
      }
    } catch (e) {
      // Ignore fallback
    }
  }, [])

  // Persist to localStorage
  const saveLogsToStorage = (updated: FirstAidLogItem[]) => {
    setLogs(updated)
    try {
      localStorage.setItem('gp_first_aid_logs_2026', JSON.stringify(updated))
    } catch (e) {
      // Ignore
    }
  }

  // Quick Date Navigation
  const handleDateStep = (days: number) => {
    let base = filterDate && filterDate !== 'ALL' ? new Date(filterDate) : new Date()
    if (isNaN(base.getTime())) base = new Date()
    base.setDate(base.getDate() + days)
    setFilterDate(base.toISOString().slice(0, 10))
  }

  // Open Create
  const handleOpenCreate = () => {
    setEditingLog(null)
    setFormData({
      date: filterDate === 'ALL' ? new Date().toISOString().slice(0, 10) : filterDate,
      time: new Date().toTimeString().slice(0, 5),
      employeeName: '',
      department: 'Технологик жараён (Sex)',
      position: '',
      reason: QUICK_REASONS[0],
      treatment: QUICK_TREATMENTS[0],
      outcome: 'RETURNED_TO_WORK',
      medicalStaffSign: 'Жуманова Ч.Э.',
      notes: 'Ҳолати қониқарли, иш фаолиятига қайтди.'
    })
    setIsFormOpen(true)
  }

  // Open Edit
  const handleOpenEdit = (item: FirstAidLogItem) => {
    setEditingLog(item)
    setFormData({
      date: item.date,
      time: item.time,
      employeeName: item.employeeName,
      department: item.department,
      position: item.position,
      reason: item.reason,
      treatment: item.treatment,
      outcome: item.outcome,
      medicalStaffSign: item.medicalStaffSign,
      notes: item.notes || ''
    })
    setIsFormOpen(true)
  }

  // Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeName.trim()) {
      toast.error('Ходим Ф.И.Ш.ни киритинг!')
      return
    }

    if (editingLog) {
      const updated = logs.map(l => (l.id === editingLog.id ? { ...l, ...formData } : l))
      saveLogsToStorage(updated)
      toast.success("Тиббий қабул ёзуви янгиланди")
    } else {
      const newItem: FirstAidLogItem = {
        id: 'fa-' + Date.now(),
        ...formData
      }
      saveLogsToStorage([newItem, ...logs])
      toast.success("Янги биринчи ёрдам мурожаати қайд этилди")
    }
    setIsFormOpen(false)
  }

  // Delete
  const handleDelete = (id: string) => {
    if (!confirm("Ушбу тиббий қабул ёзувини ўчирмоқчимисиз?")) return
    const updated = logs.filter(l => l.id !== id)
    saveLogsToStorage(updated)
    toast.success("Ёзув ўчирилди")
  }

  // Export CSV
  const handleExportCSV = () => {
    const filtered = filteredLogs
    if (filtered.length === 0) {
      toast.error("Экспорт қилиш учун маълумот йўқ")
      return
    }

    const headers = ['№', 'Сана', 'Вақт', 'Ходим Ф.И.Ш.', 'Бўлими', 'Лавозими', 'Мурожаат сабаби', 'Кўрсатилган ёрдам', 'Хулоса', 'Тиббий ходим']
    const rows = filtered.map((l, i) => [
      i + 1,
      l.date,
      l.time,
      `"${l.employeeName}"`,
      `"${l.department}"`,
      `"${l.position}"`,
      `"${l.reason}"`,
      `"${l.treatment}"`,
      `"${l.outcome === 'RETURNED_TO_WORK' ? 'Ишга қайтди' : l.outcome === 'SENT_HOME' ? 'Уйга рухсат' : 'Шифохонага'}"`,
      `"${l.medicalStaffSign}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Birinchi_yordam_jurnali_${filterDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV файли юклаб олинди")
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Filtered Logs
  const filteredLogs = logs.filter(item => {
    const matchDate = filterDate === 'ALL' || item.date === filterDate
    const matchSearch =
      !searchQuery ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDate && matchSearch
  })

  const returnedCount = filteredLogs.filter(l => l.outcome === 'RETURNED_TO_WORK').length
  const sentHomeCount = filteredLogs.filter(l => l.outcome === 'SENT_HOME').length

  return (
    <div className="w-full bg-white dark:bg-dark-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-750 flex flex-col text-slate-800 dark:text-slate-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            <HeartPulse size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur">
                SanPiN & Mehnat Muhofazasi
              </span>
              <span className="text-xs text-rose-100 font-medium">Tibbiy Qabul Jurnali</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              ХОДИМЛАРГА БИРИНЧИ ЁРДАМ КЎРСАТИШ ВА ТИББИЙ ҚАБУЛ ЖУРНАЛИ
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-rose-900 hover:bg-rose-50 rounded-xl text-xs font-black shadow-lg transition active:scale-95"
          >
            <Plus size={15} />
            <span>Yangi Qabulni Qayd Etish</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition active:scale-95 border border-white/20"
            title="Excel / CSV formatida yuklab olish"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition active:scale-95 border border-white/20"
            title="A4 formatda chop etish"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Chop etish</span>
          </button>
        </div>
      </div>

      {/* Information Notice Bar */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 no-print">
        <Info size={16} className="text-amber-600 shrink-0" />
        <span className="leading-snug">
          <strong>Eslatma:</strong> Oshxona brakeraj jurnali to'liq ishga tushirildi. Birinchi yordam ko'rsatish jurnali bo'yicha rasmingizni yuborishingiz bilan ushbu bo'limning rasmiy ustunlari va qoliplari aynan sizning hujjatingizga moslab to'liq moslashtiriladi.
        </span>
      </div>

      {/* Filter and Stats Bar */}
      <div className="p-3.5 bg-slate-50 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-700 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker + Stepper */}
          <div className="flex items-center gap-1 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleDateStep(-1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Oldingi kun"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={14} className="text-rose-500" />
              <span className="text-slate-500 font-bold">Sana:</span>
              <input
                type="date"
                value={filterDate === 'ALL' ? '' : filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-transparent outline-none font-mono font-bold text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDateStep(1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Keyingi kun"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterDate(new Date().toISOString().slice(0, 10))}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                filterDate === new Date().toISOString().slice(0, 10)
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() - 1)
                setFilterDate(d.toISOString().slice(0, 10))
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                filterDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              Kecha
            </button>
            <button
              type="button"
              onClick={() => setFilterDate('2026-04-27')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                filterDate === '2026-04-27'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              Namuna (27.04)
            </button>
            <button
              type="button"
              onClick={() => setFilterDate('ALL')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                filterDate === 'ALL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
            >
              Barchasi
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Xodim F.I.Sh. yoki bo'lim..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-800 dark:text-slate-200 w-44"
            />
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex flex-wrap items-center gap-2 font-medium">
          <span className="px-2.5 py-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-600 dark:text-slate-400">
            Jami murojaatlar: <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length} ta</strong>
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
            ✓ Ishga qaytganlar: {returnedCount}
          </span>
          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 font-bold">
            🏠 Uyga ruxsat: {sentHomeCount}
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-dark-950">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
            <HeartPulse size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Ushbu sana ({filterDate === 'ALL' ? 'barcha sanalar' : filterDate}) uchun murojaatlar mavjud emas
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Xodimlarga birinchi tibbiy yordam ko'rsatish holatini kiritish uchun quyidagi tugmani bosing.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95"
              >
                <Plus size={16} />
                <span>Birinchi murojaatni kiritish</span>
              </button>
              <button
                onClick={() => setFilterDate('2026-04-27')}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <span>Namunani ko'rish (2026-04-27)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-300 dark:border-dark-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-dark-800 border-b-2 border-slate-300 dark:border-dark-700">
                  <th colSpan={10} className="p-3 text-center text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    ХОДИМЛАРГА БИРИНЧИ ЁРДАМ КЎРСАТИШ ВА ТИББИЙ ҚАБУЛ ЖУРНАЛИ
                  </th>
                </tr>
                <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3 text-center w-12 border-r border-slate-300 dark:border-dark-700">№</th>
                  <th className="p-3 text-left w-28 border-r border-slate-300 dark:border-dark-700">Сана ва вақт</th>
                  <th className="p-3 text-left w-48 border-r border-slate-300 dark:border-dark-700">Ходим Ф.И.Ш.</th>
                  <th className="p-3 text-left w-40 border-r border-slate-300 dark:border-dark-700">Бўлим ва лавозими</th>
                  <th className="p-3 text-left min-w-[200px] border-r border-slate-300 dark:border-dark-700">Мурожаат сабаби / Шикояти</th>
                  <th className="p-3 text-left min-w-[240px] border-r border-slate-300 dark:border-dark-700">Кўрсатилган ёрдам / Муолажа</th>
                  <th className="p-3 text-center w-36 border-r border-slate-300 dark:border-dark-700">Ҳолати ва хулоса</th>
                  <th className="p-3 text-left w-36 border-r border-slate-300 dark:border-dark-700">Масъул тиббий ходим</th>
                  <th className="p-3 text-left min-w-[160px] border-r border-slate-300 dark:border-dark-700">Изоҳлар</th>
                  <th className="p-3 text-center w-20 no-print">Амаллар</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-200 dark:border-dark-750 hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition ${
                      idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-dark-900/40' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center font-bold font-mono text-slate-500 border-r border-slate-300 dark:border-dark-700">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{item.date}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock size={11} /> {item.time}
                      </div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-dark-700">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>{item.employeeName}</span>
                      </div>
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.department}</div>
                      <div className="text-[11px] text-slate-500">{item.position || '-'}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700">
                      <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {item.reason}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700">
                      <span className="text-slate-700 dark:text-slate-300 leading-snug">
                        {item.treatment}
                      </span>
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 dark:border-dark-700">
                      {item.outcome === 'RETURNED_TO_WORK' ? (
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 size={12} />
                          Ишга қайтди
                        </span>
                      ) : item.outcome === 'SENT_HOME' ? (
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          <Activity size={12} />
                          Уйга рухсат
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[11px] bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                          <AlertTriangle size={12} />
                          Шифохонага
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-dark-700 whitespace-nowrap">
                      {item.medicalStaffSign}
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-dark-700 text-[11px]">
                      {item.notes || '-'}
                    </td>
                    <td className="p-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-dark-700 rounded text-slate-600 dark:text-slate-300 transition"
                          title="Tahrirlash"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-600 transition"
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Activity size={15} className="text-rose-600 shrink-0" />
          <span>
            Масъул тиббиёт ходими: <strong>Жуманова Ч.Э.</strong> (Тиббий ҳамшира / Фельдшер)
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Green Processing ERP • Санитария ва тиббиёт қайд тизими
        </div>
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-dark-750 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <HeartPulse size={18} />
                  {editingLog ? "Тиббий Қабул Ёзувини Таҳрирлаш" : "Янги Биринчи Ёрдам Мурожаатини Қайд Этиш"}
                </h3>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  Ходим маълумотлари, шикояти, кўрсатилган ёрдам ва хулосани киритинг
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs max-h-[82vh]">
              {/* Employee info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ходим Ф.И.Ш. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Алимов Салим Ботирович"
                    value={formData.employeeName}
                    onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Мурожаат вақти
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Сана
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Бўлими
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Технологик жараён (Sex)">Технологик жараён (Sex)</option>
                    <option value="Ошхона">Ошхона</option>
                    <option value="Омборхона">Омборхона</option>
                    <option value="Таъминот ва логистика">Таъминот ва логистика</option>
                    <option value="Сифат назорати (QC)">Сифат назорати (QC)</option>
                    <option value="Маъмурият">Маъмурият</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Лавозими
                  </label>
                  <input
                    type="text"
                    placeholder="Оператор / Наладчик..."
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-dark-850 rounded-2xl border border-rose-200 dark:border-dark-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Мурожаат сабаби / Шикояти / Шикаст тури *
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Тезкор шаблонлар:</span>
                  {QUICK_REASONS.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, reason: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-rose-300 dark:border-dark-700 rounded hover:bg-rose-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Treatment */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-dark-850 rounded-2xl border border-indigo-200 dark:border-dark-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Кўрсатилган биринчи ёрдам ва муолажа *
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Тезкор ёрдам:</span>
                  {QUICK_TREATMENTS.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, treatment: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-indigo-300 dark:border-dark-700 rounded hover:bg-indigo-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      Шаблон {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.treatment}
                  onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Outcome Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ҳолати ва якуний хулоса
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        outcome: 'RETURNED_TO_WORK',
                        notes: 'Ҳолати қониқарли, иш фаолиятига қайтди.'
                      })
                    }
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.outcome === 'RETURNED_TO_WORK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Ишга қайтди</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        outcome: 'SENT_HOME',
                        notes: 'Кун охиригача уйга дам олишга рухсат берилди.'
                      })
                    }
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.outcome === 'SENT_HOME'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <Activity size={14} />
                    <span>Уйга рухсат</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        outcome: 'REFERRED_TO_CLINIC',
                        notes: 'Чуқурроқ тиббий кўрик учун шифохонага йўналтирилди.'
                      })
                    }
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.outcome === 'REFERRED_TO_CLINIC'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    <span>Шифохонага</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Қўшимча хулоса ёки изоҳ..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Medical staff sign */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Масъул тиббий ходим имзоси (Ф.И.Ш.):
                </label>
                <input
                  type="text"
                  value={formData.medicalStaffSign}
                  onChange={e => setFormData({ ...formData, medicalStaffSign: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-dark-750 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-dark-800 transition"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black shadow transition active:scale-95"
                >
                  {editingLog ? "Ўзгаришларни сақлаш" : "Қабулни сақлаш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

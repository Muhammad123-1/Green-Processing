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
  FileSpreadsheet,
  LayoutGrid,
  Table,
  Check,
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
}

// 1 va 2-rasmlardagi haqiqiy daftardan olingan namunaviy yozuvlar
const INITIAL_OFFICIAL_LOGS: FirstAidOfficialLogItem[] = [
  {
    id: 'fa-1',
    orderNumber: 9,
    date: '2026-01-09',
    time: '08:05',
    employeeName: 'Сардоров Азизбек',
    position: 'Ҳайдовчи',
    department: 'Логистика',
    complaint: 'Бош айланиши, қаттиқ бош оғриғи ва артериал қон босими кўтарилиши.',
    nurseInspection: 'А/Б: 180/100, Пульс: 105, Температура: 36.3. Ранги оқарган, кўз қорачиқлари кенгайган.',
    aidProvided: 'Давления туширувчи препарат (Каптоприл), тинчлантирувчи дамлама 2-3 томчи берилди, 30 дақиқа ётқизиб қўйилди.',
    referralOrRelease: 'Биринчи ёрдам кўрсатилди, аммо аҳволи яхшиланмаганлиги сабабли тез ёрдам чақирилиб, поликлиникага йўналтирилди.',
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: 'Сардоров А.'
  },
  {
    id: 'fa-2',
    orderNumber: 8,
    date: '2026-01-05',
    time: '07:54',
    employeeName: 'Салимов Тўлқин',
    position: 'Оператор',
    department: 'Цех',
    complaint: 'Бош оғриғи, бўйин соҳасида оғриқ ва умумий ҳолсизлик.',
    nurseInspection: 'А/Б: 135/70, Пульс: 84, Температура: 36.4. Умумий ҳолати ўртача, чарчоқ аломатлари.',
    aidProvided: 'Қон босими ўлчанди, тинчлантирувчи дамлама ва сув берилди, 30 дақиқа дам олдирилди.',
    referralOrRelease: 'Ишдан озод қилинди, кун охиригача уйга дам олишга рухсат берилди.',
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: 'Салимов Т.'
  },
  {
    id: 'fa-3',
    orderNumber: 7,
    date: '2026-01-03',
    time: '06:35',
    employeeName: 'Абдуллаева Гулнора',
    position: 'Ошпаз',
    department: 'Ошхона',
    complaint: 'Сабзавот тўғрашда ўнг қўл кўрсатkich бармоғининг енгил кесилиши.',
    nurseInspection: 'А/Б: 120/80, Пульс: 76, Температура: 36.6. Ўнг қўл бармоғида 0.5 см юзаки кесилган жароҳат.',
    aidProvided: '3% водород пероксид ва спирт билан ишлов берилди, бактерицид лейкопластир ва стерил боғлам қўйилди.',
    referralOrRelease: 'Ҳолати қониқарли, иш фаолиятини давом эттиришга рухсат берилди.',
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: 'Абдуллаева Г.'
  },
  {
    id: 'fa-4',
    orderNumber: 3,
    date: '2025-12-09',
    time: '09:20',
    employeeName: 'Атаева Гулчеҳра',
    position: 'Сараловчи',
    department: 'Цех',
    complaint: 'Бош айланиши, ҳаво етишмаслиги ва юрак тез уриши.',
    nurseInspection: 'А/Б: 135/90, Пульс: 88, Температура: 36.4. Ҳаяжон ва чарчоқ ҳолати.',
    aidProvided: 'Врач тавсияси бўйича тинчлантирувчи препарат, глицин берилди ва тоза ҳавога олиб чиқилди.',
    referralOrRelease: 'Ишдан озод қилинди, уйга кузатилди.',
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: 'Атаева Г.'
  },
  {
    id: 'fa-5',
    orderNumber: 2,
    date: '2025-12-09',
    time: '11:15',
    employeeName: 'Худойбердиев Анвар',
    position: 'Идиш ювувчи',
    department: 'Ошхона',
    complaint: 'Қаттиқ бош оғриғи, кўнгил айниши.',
    nurseInspection: 'А/Б: 180/100, Пульс: 110, Температура: 36.3.',
    aidProvided: 'Давления туширувчи препарат, дам олдириш.',
    referralOrRelease: 'Тиббий муассасага йўлланма берилди.',
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: 'Худойбердиев А.'
  }
]

const QUICK_COMPLAINTS = [
  'Бош айланиши, қаттиқ бош оғриғи ва қон босими кўтарилиши',
  'Бармоқнинг енгил кесилиши (1-даражали жароҳат)',
  'Иссиқ сув/буғдан енгил куйиш',
  'Кўзга бегона чанг тушиши',
  'Умумий ҳолсизлик, кўнгил айниши'
]

const QUICK_NURSE_INSPECTIONS = [
  'А/Б: 120/80, Пульс: 76-78, Температура: 36.4. Ҳолати нормал.',
  'А/Б: 135/70, Пульс: 84, Температура: 36.4. Енгил чарчоқ аломатлари.',
  'А/Б: 180/100, Пульс: 105, Температура: 36.3. Ранги оқарган, босим юқори.'
]

const QUICK_AIDS = [
  '3% водород пероксид билан ишлов берилди, стерил боғлам қўйилди',
  'Қон босими ўлчанди, тинчлантирувчи дамлама берилди, дам олдирилди',
  'Пантенол спрей сурилди, совутилди',
  'Давления туширувчи препарат (Каптоприл) берилди, ётқизилди'
]

const QUICK_REFERRALS = [
  'Ҳолати қониқарли, иш фаолиятини давом эттиришга рухсат берилди.',
  'Ишдан озод қилинди, кун охиригача уйга дам олишга рухсат берилди.',
  'Биринчи ёрдам кўрсатилди, аҳволи яхшиланмаганлиги сабабли поликлиникага йўналтирилди.'
]

export function FirstAidJournalView() {
  const [logs, setLogs] = useState<FirstAidOfficialLogItem[]>(INITIAL_OFFICIAL_LOGS)
  const [filterDate, setFilterDate] = useState<string>('2026-01-09')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'transposed' | 'horizontal'>('transposed')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<FirstAidOfficialLogItem | null>(null)

  // Form State - EXACT 12 fields from Photos 1 & 2
  const [formData, setFormData] = useState({
    orderNumber: 1,
    date: '2026-01-09',
    time: '08:00',
    employeeName: '',
    position: 'Оператор',
    department: 'Цех',
    complaint: QUICK_COMPLAINTS[0],
    nurseInspection: QUICK_NURSE_INSPECTIONS[0],
    aidProvided: QUICK_AIDS[0],
    referralOrRelease: QUICK_REFERRALS[0],
    nurseSignature: 'Жуманова Ч.Э.',
    employeeSignature: ''
  })

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_first_aid_official_logs_2026')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs(parsed)
        }
      }
    } catch (e) {
      // fallback
    }
  }, [])

  const saveLogs = (updated: FirstAidOfficialLogItem[]) => {
    setLogs(updated)
    try {
      localStorage.setItem('gp_first_aid_official_logs_2026', JSON.stringify(updated))
    } catch (e) {
      // ignore
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
    const nextOrder = logs.length > 0 ? Math.max(...logs.map(l => l.orderNumber || 0)) + 1 : 1
    const currentDate = filterDate === 'ALL' ? new Date().toISOString().slice(0, 10) : filterDate
    setFormData({
      orderNumber: nextOrder,
      date: currentDate,
      time: new Date().toTimeString().slice(0, 5),
      employeeName: '',
      position: 'Оператор',
      department: 'Цех',
      complaint: QUICK_COMPLAINTS[0],
      nurseInspection: QUICK_NURSE_INSPECTIONS[0],
      aidProvided: QUICK_AIDS[0],
      referralOrRelease: QUICK_REFERRALS[0],
      nurseSignature: 'Жуманова Ч.Э.',
      employeeSignature: ''
    })
    setIsFormOpen(true)
  }

  // Open Edit
  const handleOpenEdit = (item: FirstAidOfficialLogItem) => {
    setEditingLog(item)
    setFormData({
      orderNumber: item.orderNumber,
      date: item.date,
      time: item.time,
      employeeName: item.employeeName,
      position: item.position,
      department: item.department,
      complaint: item.complaint,
      nurseInspection: item.nurseInspection,
      aidProvided: item.aidProvided,
      referralOrRelease: item.referralOrRelease,
      nurseSignature: item.nurseSignature || 'Жуманова Ч.Э.',
      employeeSignature: item.employeeSignature || item.employeeName
    })
    setIsFormOpen(true)
  }

  // Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeName.trim()) {
      toast.error('Ходимнинг Ф.И.Ш.ни киритинг!')
      return
    }

    const employeeSign = formData.employeeSignature.trim() || formData.employeeName.trim()

    if (editingLog) {
      const updated = logs.map(l =>
        l.id === editingLog.id ? { ...l, ...formData, employeeSignature: employeeSign } : l
      )
      saveLogs(updated)
      toast.success("Тиббий қабул ёзуви янгиланди")
    } else {
      const newItem: FirstAidOfficialLogItem = {
        id: 'fa-' + Date.now(),
        ...formData,
        employeeSignature: employeeSign
      }
      saveLogs([newItem, ...logs])
      toast.success("Янги биринчи ёрдам мурожаати қайд этилди")
    }
    setIsFormOpen(false)
  }

  // Delete
  const handleDelete = (id: string) => {
    if (!confirm("Ушбу тиббий қабул ёзувини ўчирмоқчимисиз?")) return
    const updated = logs.filter(l => l.id !== id)
    saveLogs(updated)
    toast.success("Ёзув ўчирилди")
  }

  // Filtered Logs
  const filteredLogs = logs.filter(item => {
    const matchDate = filterDate === 'ALL' || item.date === filterDate
    const matchSearch =
      !searchQuery ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.complaint.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDate && matchSearch
  })

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("Экспорт қилиш учун маълумот йўқ")
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
      'Тиббий муассасага юбориш / ишдан озод қилиш',
      'Ҳамширанинг имзоси',
      'Ходим имзоси'
    ]

    const rows = filteredLogs.map(l => [
      l.orderNumber,
      `"${l.date}"`,
      `"${l.time}"`,
      `"${l.employeeName}"`,
      `"${l.position}"`,
      `"${l.department}"`,
      `"${l.complaint}"`,
      `"${l.nurseInspection}"`,
      `"${l.aidProvided}"`,
      `"${l.referralOrRelease}"`,
      `"${l.nurseSignature}"`,
      `"${l.employeeSignature}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Birinchi_yordam_jurnali_${filterDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV файли муваффақиятли юклаб олинди")
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // 12 Parameters exactly matching Images 1 and 2
  const PARAM_ROWS = [
    { no: 1, label: '№ (Тартиб рақами)', render: (item: FirstAidOfficialLogItem) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.orderNumber}</span> },
    { no: 2, label: 'Сана', render: (item: FirstAidOfficialLogItem) => <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{item.date}</span> },
    { no: 3, label: 'Вақт', render: (item: FirstAidOfficialLogItem) => <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Clock size={12} className="text-slate-400" />{item.time}</span> },
    { no: 4, label: 'Ходимнинг Ф.И.Ш.', render: (item: FirstAidOfficialLogItem) => <span className="font-bold text-slate-900 dark:text-white">{item.employeeName}</span> },
    { no: 5, label: 'Лавозими', render: (item: FirstAidOfficialLogItem) => <span className="text-slate-700 dark:text-slate-300 font-medium">{item.position}</span> },
    { no: 6, label: 'Бўлинма', render: (item: FirstAidOfficialLogItem) => <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">{item.department}</span> },
    { no: 7, label: 'Мурожаат сабаби / шикоят', render: (item: FirstAidOfficialLogItem) => <span className="text-slate-800 dark:text-slate-200 leading-snug block max-w-sm font-medium">{item.complaint}</span> },
    { no: 8, label: 'Ҳамшира кўриги натижаси', render: (item: FirstAidOfficialLogItem) => <span className="text-slate-700 dark:text-slate-300 leading-snug block max-w-sm">{item.nurseInspection}</span> },
    { no: 9, label: 'Кўрсатилган ёрдам', render: (item: FirstAidOfficialLogItem) => <span className="text-slate-700 dark:text-slate-300 leading-snug block max-w-sm font-medium">{item.aidProvided}</span> },
    {
      no: 10,
      label: 'Тиббий муассасага юбориш / ишдан озод қилиш',
      render: (item: FirstAidOfficialLogItem) => {
        const isReleased = item.referralOrRelease.toLowerCase().includes('озод') || item.referralOrRelease.toLowerCase().includes('уйга')
        const isClinic = item.referralOrRelease.toLowerCase().includes('поликлиника') || item.referralOrRelease.toLowerCase().includes('муассаса') || item.referralOrRelease.toLowerCase().includes('шифохона')
        return (
          <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-lg text-xs leading-tight ${
            isClinic
              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              : isReleased
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}>
            {isClinic ? <AlertTriangle size={12} /> : isReleased ? <Activity size={12} /> : <CheckCircle2 size={12} />}
            {item.referralOrRelease}
          </span>
        )
      }
    },
    { no: 11, label: 'Ҳамширанинг имзоси', render: (item: FirstAidOfficialLogItem) => <span className="font-serif italic font-bold text-slate-800 dark:text-slate-200">{item.nurseSignature}</span> },
    { no: 12, label: 'Ходим имзоси', render: (item: FirstAidOfficialLogItem) => <span className="font-serif italic text-slate-600 dark:text-slate-400">{item.employeeSignature || item.employeeName}</span> }
  ]

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
                1 ва 2-расм бўйича расмий шакл
              </span>
              <span className="text-xs text-rose-100 font-medium">12 та расмий кўрсаткич</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              ХОДИМЛАРГА БИРИНЧИ ЁРДАМ КЎРСАТИШ ВА ТИББИЙ ҚАБУЛ ЖУРНАЛИ
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* View Mode Toggle: Transposed (as in photo) or Horizontal */}
          <div className="flex items-center bg-white/20 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('transposed')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'transposed' ? 'bg-white text-rose-900 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
              title="1 va 2-rasmdagi kabi tik varaq jadval"
            >
              <LayoutGrid size={13} />
              <span>Tik jadval (Varaq)</span>
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'horizontal' ? 'bg-white text-rose-900 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
              title="Keng jadval ko'rinishi"
            >
              <Table size={13} />
              <span>Keng jadval</span>
            </button>
          </div>

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
            <span className="hidden sm:inline">Excel</span>
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
              onClick={() => setFilterDate('2026-01-09')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                filterDate === '2026-01-09'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
              title="1-rasmdagi namunaviy sana (09.01.2026)"
            >
              Namuna (09.01)
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
              Barcha sanalar
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Xodim F.I.Sh., bo'lim..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-slate-800 dark:text-slate-200 w-44"
            />
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex flex-wrap items-center gap-2 font-medium">
          <span className="px-2.5 py-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-600 dark:text-slate-400">
            Jami: <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length} ta</strong>
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
            ✓ Ишга қайтган: {filteredLogs.filter(l => !l.referralOrRelease.toLowerCase().includes('озод') && !l.referralOrRelease.toLowerCase().includes('муассаса')).length}
          </span>
          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 font-bold">
            🏠 Уйга рухсат: {filteredLogs.filter(l => l.referralOrRelease.toLowerCase().includes('озод') || l.referralOrRelease.toLowerCase().includes('уйга')).length}
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-dark-950">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
            <HeartPulse size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Ушбу сана ({filterDate === 'ALL' ? 'барча саналар' : filterDate}) учун тиббий қайдлар топилмади
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ходимларга биринчи ёрдам кўрсатиш ҳолатини киритиш учун қуйидаги тугмани босинг ёки намунавий санага ўтинг.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95"
              >
                <Plus size={16} />
                <span>Биринчи мурожаатни киритиш</span>
              </button>
              <button
                onClick={() => setFilterDate('2026-01-09')}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <span>1-расмдаги намунани кўриш (09.01.2026)</span>
              </button>
              <button
                onClick={() => setFilterDate('ALL')}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <span>Барча ёзувларни кўриш</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'transposed' ? (
          /* ===================================================================== */
          /* MODE 1: TRANSPOSED TABLE - EXACT MATCH TO USER'S PHOTOS 1 & 2         */
          /* ===================================================================== */
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-300 dark:border-dark-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-dark-800 border-b-2 border-slate-300 dark:border-dark-700">
                  <th
                    colSpan={2 + filteredLogs.length}
                    className="p-3 text-center text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white"
                  >
                    ХОДИМЛАРГА БИРИНЧИ ЁРДАМ КЎРСАТИШ ВА ТИББИЙ ҚАБУЛ ЖУРНАЛИ
                  </th>
                </tr>
                <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3 text-center w-12 border-r border-slate-300 dark:border-dark-700">№</th>
                  <th className="p-3 text-left w-72 border-r border-slate-300 dark:border-dark-700">
                    Текшириладиган кўрсаткичлар / Барақа устунлари
                  </th>
                  {filteredLogs.map((log, idx) => (
                    <th
                      key={log.id}
                      className="p-3 text-center font-black min-w-[260px] max-w-[340px] border-r border-slate-300 dark:border-dark-700 bg-rose-50/50 dark:bg-dark-800/80"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-mono text-xs">
                          {log.orderNumber || idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {log.employeeName}
                        </span>
                        <div className="flex items-center gap-1 no-print">
                          <button
                            onClick={() => handleOpenEdit(log)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-dark-700 rounded text-slate-600 dark:text-slate-300 transition"
                            title="Таҳрирлаш"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-600 transition"
                            title="Ўчириш"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PARAM_ROWS.map((row, rIdx) => (
                  <tr
                    key={row.no}
                    className={`border-b border-slate-200 dark:border-dark-750 hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition ${
                      rIdx % 2 === 1 ? 'bg-slate-50/30 dark:bg-dark-900/40' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center font-bold font-mono text-slate-500 border-r border-slate-300 dark:border-dark-700">
                      {row.no}
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-dark-700">
                      {row.label}
                    </td>
                    {filteredLogs.map(item => (
                      <td key={item.id} className="p-2.5 border-r border-slate-300 dark:border-dark-700 align-top">
                        {row.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ===================================================================== */
          /* MODE 2: HORIZONTAL TABLE                                              */
          /* ===================================================================== */
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-300 dark:border-dark-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3 text-center w-12 border-r border-slate-300 dark:border-dark-700">№</th>
                  <th className="p-3 text-left w-28 border-r border-slate-300 dark:border-dark-700">Сана ва вақт</th>
                  <th className="p-3 text-left w-48 border-r border-slate-300 dark:border-dark-700">Ходимнинг Ф.И.Ш.</th>
                  <th className="p-3 text-left w-40 border-r border-slate-300 dark:border-dark-700">Лавозими ва бўлими</th>
                  <th className="p-3 text-left min-w-[200px] border-r border-slate-300 dark:border-dark-700">Мурожаат сабаби / шикоят</th>
                  <th className="p-3 text-left min-w-[220px] border-r border-slate-300 dark:border-dark-700">Ҳамшира кўриги натижаси</th>
                  <th className="p-3 text-left min-w-[220px] border-r border-slate-300 dark:border-dark-700">Кўрсатилган ёрдам</th>
                  <th className="p-3 text-left min-w-[200px] border-r border-slate-300 dark:border-dark-700">Тиббий муассасага / озод қилиш</th>
                  <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">Ҳамшира имзоси</th>
                  <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">Ходим имзоси</th>
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
                      {item.orderNumber}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{item.date}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock size={11} /> {item.time}
                      </div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-dark-700">
                      {item.employeeName}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.position}</div>
                      <div className="text-[11px] text-slate-500">{item.department}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700 leading-snug">
                      {item.complaint}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700 leading-snug text-slate-700 dark:text-slate-300">
                      {item.nurseInspection}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700 leading-snug text-slate-700 dark:text-slate-300">
                      {item.aidProvided}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 dark:border-dark-700">
                      <span className="font-medium text-slate-800 dark:text-slate-200 leading-tight block">
                        {item.referralOrRelease}
                      </span>
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 dark:border-dark-700 font-serif italic font-bold">
                      {item.nurseSignature}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 dark:border-dark-700 font-serif italic text-slate-500">
                      {item.employeeSignature || item.employeeName}
                    </td>
                    <td className="p-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-dark-700 rounded text-slate-600 dark:text-slate-300 transition"
                          title="Таҳрирлаш"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-600 transition"
                          title="Ўчириш"
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
            Масъул ҳамшира: <strong>Жуманова Ч.Э.</strong> (Тиббий фельдшер)
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Green Processing ERP • 1 ва 2-расм бўйича расмий 12 та устун шакли
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT RECORD                                               */}
      {/* ========================================================================= */}
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
                  {editingLog ? "Тиббий Қабул Ёзувини Таҳрирлаш" : "Янги Биринчи Ёрдам Мурожаатини Қайд Этиш (1 ва 2-расм)"}
                </h3>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  12 та расмий кўрсаткич: ходим маълумоти, шикоят, кўрик натижаси, кўрсатилган ёрдам ва хулоса
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
              {/* Row 1: Tartib raqami, Sana, Vaqt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. № (Тартиб рақами)
                  </label>
                  <input
                    type="number"
                    value={formData.orderNumber}
                    onChange={e => setFormData({ ...formData, orderNumber: Number(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Сана *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Вақт *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 2: Xodim F.I.Sh., Lavozimi, Bo'linma */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Ходимнинг Ф.И.Ш. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Сардоров Азизбек"
                    value={formData.employeeName}
                    onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    5. Лавозими
                  </label>
                  <input
                    type="text"
                    placeholder="Ҳайдовчи / Оператор / Ошпаз"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    6. Бўлинма
                  </label>
                  <input
                    type="text"
                    placeholder="Логистика / Цех / Ошхона"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 3: Shikoyat */}
              <div className="p-3 bg-rose-50/50 dark:bg-dark-850 rounded-2xl border border-rose-200 dark:border-dark-700 space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  7. Мурожаат сабаби / шикоят *
                </label>
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Тезкор шаблонлар:</span>
                  {QUICK_COMPLAINTS.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, complaint: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-rose-300 dark:border-dark-700 rounded hover:bg-rose-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      {txt.slice(0, 28)}...
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.complaint}
                  onChange={e => setFormData({ ...formData, complaint: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Row 4: Hamshira ko'rigi natijasi */}
              <div className="p-3 bg-amber-50/50 dark:bg-dark-850 rounded-2xl border border-amber-200 dark:border-dark-700 space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  8. Ҳамшира кўриги натижаси (А/Б, Пульс, Ҳарорат) *
                </label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {QUICK_NURSE_INSPECTIONS.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, nurseInspection: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-amber-300 dark:border-dark-700 rounded hover:bg-amber-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      {txt.slice(0, 32)}...
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.nurseInspection}
                  onChange={e => setFormData({ ...formData, nurseInspection: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Row 5: Ko'rsatilgan yordam */}
              <div className="p-3 bg-indigo-50/50 dark:bg-dark-850 rounded-2xl border border-indigo-200 dark:border-dark-700 space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  9. Кўрсатилган ёрдам *
                </label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {QUICK_AIDS.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, aidProvided: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-indigo-300 dark:border-dark-700 rounded hover:bg-indigo-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      {txt.slice(0, 32)}...
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formData.aidProvided}
                  onChange={e => setFormData({ ...formData, aidProvided: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Row 6: Tibbiy muassasaga yuborish / ishdan ozod qilish */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  10. Тиббий муассасага юбориш / ишдан озод қилиш *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, referralOrRelease: QUICK_REFERRALS[0] })}
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.referralOrRelease === QUICK_REFERRALS[0]
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>Ишга қайтди</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, referralOrRelease: QUICK_REFERRALS[1] })}
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.referralOrRelease === QUICK_REFERRALS[1]
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <Activity size={13} />
                    <span>Уйга рухсат</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, referralOrRelease: QUICK_REFERRALS[2] })}
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.referralOrRelease === QUICK_REFERRALS[2]
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <AlertTriangle size={13} />
                    <span>Шифохонага</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.referralOrRelease}
                  onChange={e => setFormData({ ...formData, referralOrRelease: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Row 7: Imzolar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-dark-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    11. Ҳамширанинг имзоси
                  </label>
                  <input
                    type="text"
                    value={formData.nurseSignature}
                    onChange={e => setFormData({ ...formData, nurseSignature: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    12. Ходим имзоси
                  </label>
                  <input
                    type="text"
                    placeholder="Ходим исми / имзо"
                    value={formData.employeeSignature || formData.employeeName}
                    onChange={e => setFormData({ ...formData, employeeSignature: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Actions */}
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
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black shadow transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>{editingLog ? "Ўзгаришларни сақлаш" : "Қабулни сақлаш"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

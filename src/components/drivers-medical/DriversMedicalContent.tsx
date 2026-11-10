'use client'

import React, { useState, useEffect } from 'react'
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
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Gauge,
  Thermometer,
  Zap
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

// 3 ва 4-расмлардаги ҳақиқий ёзувлар
const INITIAL_DRIVER_LOGS: DriverMedicalExamItem[] = [
  // 2025-10-20
  { id: 'dm-1', orderNumber: 1, date: '2025-10-20', driverName: 'Садибеков И.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.2', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-2', orderNumber: 2, date: '2025-10-20', driverName: 'Солиев В.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.2', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-3', orderNumber: 3, date: '2025-10-20', driverName: 'Расилов И.', complaints: 'йўқ', pulse: '78-80', bodyTemp: '36.3', bloodPressure: '120/70', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-4', orderNumber: 4, date: '2025-10-20', driverName: 'Шерматов Р.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-5', orderNumber: 5, date: '2025-10-20', driverName: 'Салихов Х.', complaints: 'йўқ', pulse: '82-84', bodyTemp: '36.2', bloodPressure: '115/70', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-6', orderNumber: 6, date: '2025-10-20', driverName: 'Матқобилов М.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-7', orderNumber: 7, date: '2025-10-20', driverName: 'Мирзаев И.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-8', orderNumber: 8, date: '2025-10-20', driverName: 'Пўлатов М.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.6', bloodPressure: '120/70', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-9', orderNumber: 9, date: '2025-10-20', driverName: 'Нажмиддинов Ф.', complaints: 'йўқ', pulse: '82-84', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-10', orderNumber: 10, date: '2025-10-20', driverName: 'Шокирбеков Д.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.2', bloodPressure: '130/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-11', orderNumber: 11, date: '2025-10-20', driverName: 'Худойберганов Х.', complaints: 'йўқ', pulse: '82-84', bodyTemp: '36.1', bloodPressure: '110/60', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-12', orderNumber: 12, date: '2025-10-20', driverName: 'Тўхтаев А.', complaints: 'йўқ', pulse: '78-80', bodyTemp: '36.3', bloodPressure: '130/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-13', orderNumber: 13, date: '2025-10-20', driverName: 'Жўраев Б.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.5', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },

  // 2025-10-17
  { id: 'dm-14', orderNumber: 1, date: '2025-10-17', driverName: 'Салихов Х.', complaints: 'йўқ', pulse: '82-84', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-15', orderNumber: 2, date: '2025-10-17', driverName: 'Солиев В.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.2', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-16', orderNumber: 3, date: '2025-10-17', driverName: 'Азизов Д.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-17', orderNumber: 4, date: '2025-10-17', driverName: 'Асқаров Т.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.3', bloodPressure: '110/70', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-18', orderNumber: 5, date: '2025-10-17', driverName: 'Матқобилов М.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.2', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-19', orderNumber: 6, date: '2025-10-17', driverName: 'Пўлатов М.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.2', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-20', orderNumber: 7, date: '2025-10-17', driverName: 'Собиров Д.', complaints: 'йўқ', pulse: '76-78', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-21', orderNumber: 8, date: '2025-10-17', driverName: 'Мавланов А.', complaints: 'йўқ', pulse: '78-80', bodyTemp: '36.4', bloodPressure: '130/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-22', orderNumber: 9, date: '2025-10-17', driverName: 'Пирманов А.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.2', bloodPressure: '110/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' },
  { id: 'dm-23', orderNumber: 10, date: '2025-10-17', driverName: 'Жўраев Б.', complaints: 'йўқ', pulse: '74-76', bodyTemp: '36.3', bloodPressure: '120/80', breathAlcohol: 'аниқланмади', result: 'соғлом, рейска рухсат', signature: 'Жуманова Ч.Э.' }
]

export default function DriversMedicalContent() {
  const [logs, setLogs] = useState<DriverMedicalExamItem[]>(INITIAL_DRIVER_LOGS)
  const [filterDate, setFilterDate] = useState<string>('2025-10-20') // 3-rasmdagi namunaviy sana
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<DriverMedicalExamItem | null>(null)

  // Form State - 9 Columns matching Photos 3 & 4
  const [formData, setFormData] = useState({
    orderNumber: 1,
    date: '2025-10-20',
    driverName: OFFICIAL_FLEET_DRIVERS[0],
    complaints: 'йўқ',
    pulse: '76-78',
    bodyTemp: '36.3',
    bloodPressure: '120/80',
    breathAlcohol: 'аниқланмади',
    result: 'соғлом, рейска рухсат',
    signature: 'Жуманова Ч.Э.'
  })

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_drivers_medical_logs_2026')
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

  const saveLogs = (updated: DriverMedicalExamItem[]) => {
    setLogs(updated)
    try {
      localStorage.setItem('gp_drivers_medical_logs_2026', JSON.stringify(updated))
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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingLog(null)
    const currentDate = filterDate === 'ALL' ? new Date().toISOString().slice(0, 10) : filterDate
    const existingForDate = logs.filter(l => l.date === currentDate)
    const nextOrder = existingForDate.length + 1

    setFormData({
      orderNumber: nextOrder,
      date: currentDate,
      driverName: OFFICIAL_FLEET_DRIVERS[0],
      complaints: 'йўқ',
      pulse: '76-78',
      bodyTemp: '36.3',
      bloodPressure: '120/80',
      breathAlcohol: 'аниқланмади',
      result: 'соғлом, рейска рухсат',
      signature: 'Жуманова Ч.Э.'
    })
    setIsFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: DriverMedicalExamItem) => {
    setEditingLog(item)
    setFormData({
      orderNumber: item.orderNumber,
      date: item.date,
      driverName: item.driverName,
      complaints: item.complaints,
      pulse: item.pulse,
      bodyTemp: item.bodyTemp,
      bloodPressure: item.bloodPressure,
      breathAlcohol: item.breathAlcohol,
      result: item.result,
      signature: item.signature || 'Жуманова Ч.Э.'
    })
    setIsFormOpen(true)
  }

  // Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.driverName.trim()) {
      toast.error('Ҳайдовчи исмини киритинг!')
      return
    }

    if (editingLog) {
      const updated = logs.map(l => (l.id === editingLog.id ? { ...l, ...formData } : l))
      saveLogs(updated)
      toast.success("Ҳайдовчи кўрик ёзуви янгиланди")
    } else {
      const newItem: DriverMedicalExamItem = {
        id: 'dm-' + Date.now(),
        ...formData
      }
      saveLogs([...logs, newItem])
      toast.success("Ҳайдовчи тиббий кўриги қайд этилди")
    }
    setIsFormOpen(false)
  }

  // Delete
  const handleDelete = (id: string) => {
    if (!confirm("Ушбу ҳайдовчи кўрик ёзувини ўчирмоқчимисиз?")) return
    const updated = logs.filter(l => l.id !== id)
    saveLogs(updated)
    toast.success("Ёзув ўчирилди")
  }

  // Quick Pre-Trip Bulk Generator: Auto-check all standard fleet drivers for selected date
  const handleBulkCheckAllDrivers = () => {
    const targetDate = filterDate === 'ALL' ? new Date().toISOString().slice(0, 10) : filterDate
    const existing = logs.filter(l => l.date === targetDate)

    if (existing.length > 0) {
      if (!confirm(`Ушбу сана (${targetDate}) учун аллақачон ${existing.length} та ёзув мавжуд. Барча ҳайдовчилар рўйхатини қайта тўлдирмоқчимисиз?`)) {
        return
      }
    }

    const withoutDate = logs.filter(l => l.date !== targetDate)

    // Pulse and temperature realistic variations
    const pulses = ['74-76', '76-78', '78-80', '80-82', '82-84']
    const temps = ['36.2', '36.3', '36.4', '36.5', '36.6']
    const pressures = ['120/80', '120/70', '115/70', '130/80', '125/80']

    const newRows: DriverMedicalExamItem[] = OFFICIAL_FLEET_DRIVERS.map((driver, idx) => ({
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
      signature: 'Жуманова Ч.Э.'
    }))

    const updated = [...withoutDate, ...newRows]
    saveLogs(updated)
    toast.success(`Сана (${targetDate}) учун ${newRows.length} та ҳайдовчининг кунлик кўриги тўлиқ қайд этилди!`)
  }

  // Filtered Logs
  const filteredLogs = logs.filter(item => {
    const matchDate = filterDate === 'ALL' || item.date === filterDate
    const matchSearch =
      !searchQuery ||
      item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.result.toLowerCase().includes(searchQuery.toLowerCase())
    return matchDate && matchSearch
  })

  // Counters
  const totalCount = filteredLogs.length
  const healthyCount = filteredLogs.filter(
    l => l.result.toLowerCase().includes('соғлом') || l.result.toLowerCase().includes('рухсат')
  ).length
  const rejectedCount = filteredLogs.filter(
    l => l.result.toLowerCase().includes('рад') || l.result.toLowerCase().includes('четлатилди')
  ).length

  // Export CSV / Excel
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("Экспорт қилиш учун маълумот йўқ")
      return
    }

    const headers = [
      'Тартиб рақами',
      'Сана',
      'Ҳайдовчининг фамилияси, исми, отасининг исми',
      'Шикоятлари',
      'Томир уриши',
      'Тана ҳарорати',
      'Артериал босим',
      'Чиқарилаётган нафас таркибида алкогол миқдори',
      'Ҳайдовчиларни тиббий кўрикдан ўтказиш натижалари',
      'Имзо'
    ]

    const rows = filteredLogs.map((l, i) => [
      l.orderNumber || i + 1,
      `"${l.date}"`,
      `"${l.driverName}"`,
      `"${l.complaints}"`,
      `"${l.pulse}"`,
      `"${l.bodyTemp}"`,
      `"${l.bloodPressure}"`,
      `"${l.breathAlcohol}"`,
      `"${l.result}"`,
      `"${l.signature}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Haydovchilar_kunlik_tibbi_korik_${filterDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV файли муваффақиятли юклаб олинди")
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header - Adaptive Light & Dark mode, calm colors for older eyes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0 border border-slate-700">
              <Truck size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  3 ва 4-расм бўйича расмий журнал
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Рейс олди кунлик кўрик</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Линияга Йўналтирилган Ҳайдовчиларни Кунлик Тиббий Кўрикдан Ўтказиш Журнали
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Ҳайдовчилар шикоятлари, томир уриши (пульс), тана ҳарорати, артериал босим, алкогол текшируви ва рейсга рухсат хулосаларини кунлик қайд этиш дафтари.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              onClick={handleBulkCheckAllDrivers}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
              title="Шу кун учун корхонанинг барча ҳайдовчиларини автоматик нормал кўрик билан тўлдириш"
            >
              <Zap size={16} />
              <span>Барча ҳайдовчиларни тезкор кўрикдан ўтказиш</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Ҳайдовчи қўшиш</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-700 cursor-pointer"
              title="Excel / CSV файлида юклаб олиш"
            >
              <Download size={15} />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-700 cursor-pointer"
              title="A4 форматда чоп этиш"
            >
              <Printer size={15} />
              <span>Чоп этиш</span>
            </button>

            {/* Quick links to other SanPiN journals */}
            <Link
              href="/degustatsiya"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition"
              title="Ошхона бракераж журналига ўтиш"
            >
              <UtensilsCrossed size={15} className="text-emerald-500" />
              <span>Ошхона</span>
            </Link>

            <Link
              href="/first-aid"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition"
              title="Биринчи ёрдам кўрсатиш журналига ўтиш"
            >
              <HeartPulse size={15} className="text-rose-500" />
              <span>Биринчи ёрдам</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Card with Filters and Official Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md overflow-hidden border border-slate-300 dark:border-slate-800 flex flex-col text-slate-800 dark:text-slate-200">
        {/* Filter and Stats Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Stepper */}
            <div className="flex items-center gap-1 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleDateStep(-1)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                title="Олдинги кун"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={14} className="text-sky-500" />
                <span className="text-slate-500 font-bold">Сана:</span>
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
                title="Кейинги кун"
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
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
              >
                Бугун
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('2025-10-20')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                  filterDate === '2025-10-20'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
                title="3-расмдаги намунавий сана (20.10.2025)"
              >
                Намуна (20.10)
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('2025-10-17')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                  filterDate === '2025-10-17'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
                title="4-расмдаги намунавий сана (17.10.2025)"
              >
                Намуна (17.10)
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('ALL')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition ${
                  filterDate === 'ALL'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
              >
                Барча саналар
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Ҳайдовчи исми..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-slate-800 dark:text-slate-200 w-44"
              />
            </div>
          </div>

          {/* Counter Badges */}
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="px-2.5 py-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-600 dark:text-slate-400">
              Кўрикдан ўтган: <strong className="text-slate-900 dark:text-white font-mono">{totalCount} нафар</strong>
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              ✓ Соғлом, рейсга рухсат: {healthyCount}
            </span>
            {rejectedCount > 0 && (
              <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-lg text-red-800 dark:text-red-300 font-bold">
                ⚠ Четлатилди: {rejectedCount}
              </span>
            )}
          </div>
        </div>

        {/* Official 9-Column Table Content (Matching Images 3 & 4) */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-dark-950">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <Truck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Ушбу сана ({filterDate === 'ALL' ? 'барча саналар' : filterDate}) учун ҳайдовчилар кўриги қайд этилмаган
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Бугунги кун учун барча ҳайдовчиларни бир тугма билан кўрикдан ўтказиш ёки намунавий санага ўтиш мумкин.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleBulkCheckAllDrivers}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95"
                >
                  <Zap size={16} />
                  <span>Бугунги барча ҳайдовчиларни киритиш (10 нафар)</span>
                </button>
                <button
                  onClick={() => setFilterDate('2025-10-20')}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <span>3-расмдаги намунани кўриш (20.10.2025)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-300 dark:border-dark-700 shadow-sm overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Big Title Row */}
                  <tr className="bg-slate-100 dark:bg-dark-800 border-b-2 border-slate-300 dark:border-dark-700">
                    <th colSpan={10} className="p-3 text-center text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      ЛИНИЯГА ЙЎНАЛТИРИЛГАН ҲАЙДОВЧИЛАРНИ КУНЛИК ТИББИЙ КЎРИКДАН ЎТКАЗИШ ЖУРНАЛИ
                    </th>
                  </tr>
                  {/* 9 Official Column Headers from Photos 3 & 4 */}
                  <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-3 text-center w-14 border-r border-slate-300 dark:border-dark-700">
                      <div>Тартиб рақами</div>
                      <div className="text-[10px] text-slate-400 font-normal">1</div>
                    </th>
                    <th className="p-3 text-left min-w-[200px] border-r border-slate-300 dark:border-dark-700">
                      <div>Ҳайдовчининг фамилияси, исми, отасининг исми</div>
                      <div className="text-[10px] text-slate-400 font-normal">2</div>
                    </th>
                    <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">
                      <div>Шикоятлари</div>
                      <div className="text-[10px] text-slate-400 font-normal">3</div>
                    </th>
                    <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">
                      <div>Томир уриши</div>
                      <div className="text-[10px] text-slate-400 font-normal">4</div>
                    </th>
                    <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">
                      <div>Тана ҳарорати</div>
                      <div className="text-[10px] text-slate-400 font-normal">5</div>
                    </th>
                    <th className="p-3 text-center w-32 border-r border-slate-300 dark:border-dark-700">
                      <div>Артериал босим</div>
                      <div className="text-[10px] text-slate-400 font-normal">6</div>
                    </th>
                    <th className="p-3 text-center min-w-[190px] border-r border-slate-300 dark:border-dark-700">
                      <div>Чиқарилаётган нафас таркибида алкогол миқдори</div>
                      <div className="text-[10px] text-slate-400 font-normal">7</div>
                    </th>
                    <th className="p-3 text-center min-w-[180px] border-r border-slate-300 dark:border-dark-700">
                      <div>Ҳайдовчиларни тиббий кўрикдан ўтказиш натижалари</div>
                      <div className="text-[10px] text-slate-400 font-normal">8</div>
                    </th>
                    <th className="p-3 text-center w-28 border-r border-slate-300 dark:border-dark-700">
                      <div>Имзо</div>
                      <div className="text-[10px] text-slate-400 font-normal">9</div>
                    </th>
                    <th className="p-3 text-center w-20 no-print">Амаллар</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((item, idx) => {
                    const isRejected = item.result.toLowerCase().includes('рад') || item.result.toLowerCase().includes('четлатилди')
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-200 dark:border-dark-750 hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition ${
                          idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-dark-900/40' : ''
                        }`}
                      >
                        {/* 1. Тартиб рақами */}
                        <td className="p-2.5 text-center font-bold font-mono text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-dark-700">
                          {item.orderNumber || idx + 1}
                        </td>

                        {/* 2. Ҳайдовчининг Ф.И.О. */}
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-dark-700">
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-sky-500 shrink-0" />
                            <span>{item.driverName}</span>
                          </div>
                          {filterDate === 'ALL' && (
                            <div className="text-[10px] text-slate-400 font-normal font-mono ml-5">
                              {item.date}
                            </div>
                          )}
                        </td>

                        {/* 3. Шикоятлари */}
                        <td className="p-2.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-dark-700">
                          {item.complaints === 'йўқ' ? (
                            <span className="text-slate-500 italic">йўқ</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-300 font-bold">{item.complaints}</span>
                          )}
                        </td>

                        {/* 4. Томир уриши */}
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-dark-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800">
                            <Activity size={11} className="text-rose-500" />
                            {item.pulse}
                          </span>
                        </td>

                        {/* 5. Тана ҳарорати */}
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-dark-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                            <Thermometer size={11} className="text-amber-600" />
                            {item.bodyTemp}°C
                          </span>
                        </td>

                        {/* 6. Артериал босим */}
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-dark-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200">
                            <Gauge size={11} className="text-sky-600" />
                            {item.bloodPressure}
                          </span>
                        </td>

                        {/* 7. Алкогол миқдори */}
                        <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-dark-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 size={11} />
                            {item.breathAlcohol}
                          </span>
                        </td>

                        {/* 8. Тиббий кўрик натижалари */}
                        <td className="p-2.5 text-center border-r border-slate-300 dark:border-dark-700">
                          <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs ${
                            isRejected
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}>
                            {isRejected ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                            {item.result}
                          </span>
                        </td>

                        {/* 9. Имзо */}
                        <td className="p-2.5 text-center font-serif italic font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-dark-700 whitespace-nowrap">
                          {item.signature}
                        </td>

                        {/* Амаллар */}
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-sky-600 shrink-0" />
            <span>
              Масъул тиббий ходим: <strong>Жуманова Ч.Э.</strong> (Фельдшер / Ҳамшира) • 3 ва 4-расм бўйича расмий 9 та устунли рейс олди журнали
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Green Processing ERP • Автопарк ва логистика тиббий хавфсизлиги
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DRIVER MEDICAL CHECK - Calm, solid & high-contrast       */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border-2 border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 relative z-[101]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Truck size={20} className="text-blue-400" />
                  {editingLog ? "Ҳайдовчи Кўригини Таҳрирлаш" : "Янги Ҳайдовчи Кўригини Қайд Этиш (3 ва 4-расм)"}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Рейс олди тиббий кўрик: шикоят, пульс, ҳарорат, босим, алкогол ва рейсга рухсат
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
                title="Ёпиш"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[82vh]">
              {/* Row 1: Order, Date, Driver Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                    1. Тартиб рақами
                  </label>
                  <input
                    type="number"
                    value={formData.orderNumber}
                    onChange={e => setFormData({ ...formData, orderNumber: Number(e.target.value) || 1 })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                    Кўрик санаси *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Driver Selection */}
              <div>
                <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                  2. Ҳайдовчининг Ф.И.Ш. *
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold mr-1">Корхона ҳайдовчилари:</span>
                  {OFFICIAL_FLEET_DRIVERS.slice(0, 8).map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, driverName: d })}
                      className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Расилов И. / Салихов Х..."
                  value={formData.driverName}
                  onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* 3. Shikoyatlar */}
              <div>
                <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                  3. Шикоятлари
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, complaints: 'йўқ' })}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm cursor-pointer ${
                      formData.complaints === 'йўқ'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    йўқ (стандарт)
                  </button>
                  <input
                    type="text"
                    value={formData.complaints}
                    onChange={e => setFormData({ ...formData, complaints: e.target.value })}
                    className="flex-1 p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4, 5, 6: Pulse, Temp, BP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5">
                    4. Томир уриши *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="76-78"
                    value={formData.pulse}
                    onChange={e => setFormData({ ...formData, pulse: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5">
                    5. Ҳарорат (°C) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="36.3"
                    value={formData.bodyTemp}
                    onChange={e => setFormData({ ...formData, bodyTemp: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5">
                    6. Қон босими *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    value={formData.bloodPressure}
                    onChange={e => setFormData({ ...formData, bloodPressure: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 7. Alkogol miqdori */}
              <div>
                <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                  7. Чиқарилаётган нафас таркибида алкогол миқдори *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, breathAlcohol: 'аниқланмади' })}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm cursor-pointer ${
                      formData.breathAlcohol === 'аниқланмади'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    аниқланмади (0.00‰)
                  </button>
                  <input
                    type="text"
                    value={formData.breathAlcohol}
                    onChange={e => setFormData({ ...formData, breathAlcohol: e.target.value })}
                    className="flex-1 p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 8. Result */}
              <div>
                <label className="block font-bold text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                  8. Кўрик натижалари / Рейсга рухсат *
                </label>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, result: 'соғлом, рейска рухсат' })}
                    className={`p-3 rounded-xl border-2 text-center font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                      formData.result === 'соғлом, рейска рухсат'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Соғлом, рейсга рухсат</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, result: 'четлатилди (босим юқори)' })}
                    className={`p-3 rounded-xl border-2 text-center font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                      formData.result.includes('четлатилди')
                        ? 'bg-red-700 text-white border-red-700 shadow-md ring-2 ring-red-500'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle size={16} />
                    <span>Рейсдан четлатиш</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.result}
                  onChange={e => setFormData({ ...formData, result: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* 9. Signature */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  9. Масъул тиббий ходим имзоси (Ҳамшира):
                </label>
                <input
                  type="text"
                  value={formData.signature}
                  onChange={e => setFormData({ ...formData, signature: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-sm sm:text-base text-slate-900 dark:text-white"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{editingLog ? "Ўзгаришларни сақлаш" : "Кўрикни сақлаш"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

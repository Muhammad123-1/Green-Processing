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
  MessageSquare,
  Archive,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

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
  driverSignature?: string // 9. Ҳайдовчи имзоси
  signature: string // 10. Ҳамшира имзоси
  examDueDate?: string // Даврий медосмотр муддати
  isRed?: boolean // Муддати яқинлашган/ўтган
  _dirty?: boolean
  _isNew?: boolean
}

// Корхонанинг 30 нафар расмий ҳайдовчилари рўйхати
export const OFFICIAL_FLEET_DRIVERS_DATA = [
  { name: 'Пулатов Миркомил Мирзарахим угли', shortName: 'Пулатов М.М.', examDate: '19.11.2026г', bp: '110/80', isRed: true },
  { name: 'Жалилов Иброхим Исломиддин угли', shortName: 'Жалилов И.И.', examDate: '14.11.2026г', bp: '100/60', isRed: true },
  { name: 'Солнцев Виталий Шайдуллаевич', shortName: 'Солнцев В.Ш.', examDate: '7.11.2026г', bp: '130/100', isRed: true },
  { name: 'Рахмонбердиев Бехзод Кудрат угли', shortName: 'Рахмонбердиев Б.К.', examDate: '20.11.2026г', bp: '120/80', isRed: true },
  { name: 'Шержонов Рустамжон Бокижон угли', shortName: 'Шержонов Р.Б.', examDate: '17.12.2026г', bp: '100/60', isRed: false },
  { name: 'Жураев Бекзод Фахриддин угли', shortName: 'Жураев Б.Ф.', examDate: '23.12.2026г', bp: '120/80', isRed: false },
  { name: 'Азизов Хусан Кабилджанович', shortName: 'Азизов Х.К.', examDate: '15.12.2026г', bp: '120/80', isRed: false },
  { name: 'Эшназаров Собиржон Юнусович', shortName: 'Эшназаров С.Ю.', examDate: '12.12.2026г', bp: '130/90', isRed: false },
  { name: 'Муратов Мамир Хасанович', shortName: 'Муратов М.Х.', examDate: '25.11.2026г', bp: '140/100', isRed: true },
  { name: 'Шакирбеков Рустамбек Анварбекович', shortName: 'Шакирбеков Р.А.', examDate: '13.02.2027г', bp: '120/80', isRed: false },
  { name: 'Пирманов Ахрор Толиб угли', shortName: 'Пирманов А.Т.', examDate: '30.01.2027г', bp: '120/80', isRed: false },
  { name: 'Мамаюнусов Бехзод Хабибулло угли', shortName: 'Мамаюнусов Б.Х.', examDate: '30.01.2027г', bp: '120/80', isRed: false },
  { name: 'Муминов Бекзод Шоди угли', shortName: 'Муминов Б.Ш.', examDate: '17.01.2027г', bp: '110/80', isRed: false },
  { name: 'Садибеков Ихтиёр Бахтиёрович', shortName: 'Садибеков И.Б.', examDate: '17.01.2027г', bp: '120/80', isRed: false },
  { name: 'Маткобилов Мирзохид Абдикаримович', shortName: 'Маткобилов М.А.', examDate: '16.01.2027г', bp: '120/90', isRed: false },
  { name: 'Рахимов Ихтиёр Бахтиёр угли', shortName: 'Рахимов И.Б.', examDate: '30.01.2027г', bp: '110/80', isRed: false },
  { name: 'Жумаев Маъсуджон Мустафо угли', shortName: 'Жумаев М.М.', examDate: '06.02.2027г', bp: '120/80', isRed: false },
  { name: 'Мамаджонов Ровшан Алимджанович', shortName: 'Мамаджонов Р.А.', examDate: '10.02.2027г', bp: '120/80', isRed: false },
  { name: 'Камалов Учкунбек Дилмурод угли', shortName: 'Камалов У.Д.', examDate: '18.02.2027г', bp: '110/70', isRed: false },
  { name: 'Салихов Равшан Хейтбаевич', shortName: 'Салихов Р.Х.', examDate: '25.02.2027г', bp: '130/100', isRed: false },
  { name: 'Киркбаев Алижон Сайфиддин угли', shortName: 'Киркбаев А.С.', examDate: '30.03.2027г', bp: '120/80', isRed: false },
  { name: 'Салихов Хайрулла Жураевич', shortName: 'Салихов Х.Ж.', examDate: '15.03.2027г', bp: '100/80', isRed: false },
  { name: 'Худойбердиев Худоёр Бахтиёр угли', shortName: 'Худойбердиев Х.Б.', examDate: '27.09.2026г', bp: '90/60', isRed: true },
  { name: 'Мирзаев Шухрат Рустамович', shortName: 'Мирзаев Ш.Р.', examDate: '22.04.2027г', bp: '160/100', isRed: true },
  { name: 'Суннатов Жахонгир Кахрамон угли', shortName: 'Суннатов Ж.К.', examDate: '27.04.2027г', bp: '110/80', isRed: false },
  { name: 'Аскаров Равшан Рустамович', shortName: 'Аскаров Р.Р.', examDate: '29.04.2027г', bp: '150/100', isRed: true },
  { name: 'Сангиров Исраил Умирзакович', shortName: 'Сангиров И.У.', examDate: '19.04.2027г', bp: '130/80', isRed: false },
  { name: 'Дусматов Уктамжон Рахматуллаевич', shortName: 'Дусматов У.Р.', examDate: '16.04.2027г', bp: '120/80', isRed: false },
  { name: 'Дусаев Достон Каримович', shortName: 'Дусаев Д.К.', examDate: '23.04.2027г', bp: '110/80', isRed: false },
  { name: 'Юлдашев Эркинжон Эргашхужаевич', shortName: 'Юлдашев Э.Э.', examDate: '02.05.2027г', bp: '120/90', isRed: false },
]

export const OFFICIAL_FLEET_DRIVERS = OFFICIAL_FLEET_DRIVERS_DATA.map(d => d.name)

const getTodayTashkent = () => {
  const d = new Date()
  const tzOffset = 5 * 60 * 60 * 1000
  return new Date(d.getTime() + tzOffset).toISOString().slice(0, 10)
}

const createEmptyDriverRow = (date: string, orderNumber: number, driverInfo?: any): DriverMedicalExamItem => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  orderNumber,
  date: date || getTodayTashkent(),
  driverName: driverInfo?.name || '',
  complaints: 'йўқ',
  pulse: '76-78',
  bodyTemp: '36.2',
  bloodPressure: driverInfo?.bp || '120/80',
  breathAlcohol: 'аниқланмади',
  result: 'соғлом, рейска рухсат',
  driverSignature: driverInfo?.name ? driverInfo.name.split(' ')[0] + ' (Имзо)' : '',
  signature: 'Жуманова Ч.Э.',
  examDueDate: driverInfo?.examDate || '2027-01-01',
  isRed: !!driverInfo?.isRed,
  _isNew: true,
  _dirty: false
})

export default function DriversMedicalContent() {
  const { formatDual, lang } = useLanguage()
  const [logs, setLogs] = useState<DriverMedicalExamItem[]>([])
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'daily' | 'archive'>('daily')
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
      next[idx] = { ...cur, ...patch, _dirty: true }
      return next
    })
  }

  // Add explicit new row (faqat tugma bosilganda jadvalning eng tepasiga qo'shiladi)
  const handleAddNewRow = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const newRow = createEmptyDriverRow(targetDate, 1)
    newRow._dirty = true
    newRow._isNew = true

    // Eng tepaga qo'shamiz (user talabi bo'yicha)
    setLogs(prev => [newRow, ...prev])
    toast.info(formatDual("Yangi qator qo'shildi. Haydovchi ma'lumotlarini kiriting.", "Добавлена новая строка. Введите данные водителя.", "New row added. Enter driver details."))
  }

  // Save single row
  const handleSaveRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return
    if (!row.driverName.trim()) {
      toast.error(formatDual("Iltimos, haydovchi ismini kiriting yoki tanlang!", "Пожалуйста, введите или выберите ФИО водителя!", "Please enter or select driver's name!"))
      return
    }

    const updated = logs.map(l => (l.id === id ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    toast.success(formatDual(`№${row.orderNumber} ${row.driverName} ma'lumoti saqlandi`, `Данные №${row.orderNumber} ${row.driverName} сохранены`, `Record №${row.orderNumber} ${row.driverName} saved`))
  }

  // Save all dirty rows
  const handleSaveAll = () => {
    const dirtyRows = logs.filter(l => l._dirty && l.driverName.trim())
    if (dirtyRows.length === 0) {
      toast.info(formatDual("O'zgarishlar yo'q, barchasi saqlangan", "Нет изменений, всё сохранено", "No changes, all saved"))
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l._dirty && l.driverName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(formatDual(`${dirtyRows.length} ta haydovchi ko'rik ma'lumotlari saqlandi`, `Данные медосмотра ${dirtyRows.length} водителей сохранены`, `Medical records of ${dirtyRows.length} drivers saved`))
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    const row = logs.find(l => l.id === id)
    if (!row) return

    if (row._isNew && !row.driverName.trim()) {
      setLogs(prev => prev.filter(l => l.id !== id))
      return
    }

    const confirmMsg = formatDual(
      `"${row.driverName || 'Haydovchi'}" ko'rik yozuvini o'chirmoqchimisiz?`,
      `Удалить запись медосмотра "${row.driverName || 'Водитель'}"?`,
      `Delete medical exam record for "${row.driverName || 'Driver'}"?`
    )
    if (!confirm(confirmMsg)) return
    const updated = logs.filter(l => l.id !== id)
    setLogs(updated)
    persistLogs(updated)
    toast.success(formatDual("Yozuv o'chirildi", "Запись удалена", "Record deleted"))
  }

  // Quick Pre-Trip Bulk Generator: Auto-check 10 standard fleet drivers for selected date
  const handleBulkCheckAllDrivers = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const existing = logs.filter(l => l.date === targetDate && l.driverName.trim())

    if (existing.length > 0) {
      const confirmMsg = formatDual(
        `Ushbu sana (${targetDate}) uchun allaqachon ${existing.length} ta yozuv mavjud. Qayta to'ldirmoqchimisiz?`,
        `Для даты (${targetDate}) уже имеется ${existing.length} записей. Перезаполнить?`,
        `There are already ${existing.length} records for (${targetDate}). Overwrite?`
      )
      if (!confirm(confirmMsg)) {
        return
      }
    }

    const withoutDate = logs.filter(l => l.date !== targetDate)

    const pulses = ['74-76', '76-78', '78-80', '80-82', '76-78']
    const temps = ['36.2', '36.3', '36.4', '36.2', '36.5']
    const pressures = ['120/80', '120/70', '115/70', '130/80', '125/80']

    // 30 ta rasmiy haydovchini to'liq baza asosida kiritish
    const newRows: DriverMedicalExamItem[] = OFFICIAL_FLEET_DRIVERS_DATA.map((driverInfo, idx) => ({
      id: `dm-bulk-${Date.now()}-${idx}`,
      orderNumber: idx + 1,
      date: targetDate,
      driverName: driverInfo.name,
      complaints: 'йўқ',
      pulse: pulses[idx % pulses.length],
      bodyTemp: temps[idx % temps.length],
      bloodPressure: driverInfo.bp || pressures[idx % pressures.length],
      breathAlcohol: 'аниқланмади',
      result: driverInfo.isRed ? 'соғлом, назорат билан рухсат' : 'соғлом, рейска рухсат',
      driverSignature: driverInfo.name.split(' ')[0] + ' (Имзо)',
      signature: 'Жуманова Ч.Э.',
      examDueDate: driverInfo.examDate,
      isRed: driverInfo.isRed,
      _dirty: true,
      _isNew: false
    }))

    const merged = [...newRows, ...withoutDate]
    setLogs(merged)
    persistLogs(merged)
    toast.success(formatDual(`Barcha ${OFFICIAL_FLEET_DRIVERS_DATA.length} ta haydovchi ko'rik jadvaliga kiritildi!`, `Все ${OFFICIAL_FLEET_DRIVERS_DATA.length} водителей внесены в журнал осмотра!`, `All ${OFFICIAL_FLEET_DRIVERS_DATA.length} fleet drivers populated!`))
  }

  // Table items displayed - qizil ro'yxatdagilar (muddati kelgan/o'tgan) TEPADA chiqadi
  const displayedRows = useMemo(() => {
    const list = logs.filter(item => {
      const matchDate = filterDate === 'ALL' || item.date === filterDate
      const matchSearch =
        !searchQuery.trim() ||
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.complaints.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.result.toLowerCase().includes(searchQuery.toLowerCase())
      return matchDate && matchSearch
    })

    // Sort: isRed === true (muddati yaqinlashgan/o'tgan) har doim TEPADA!
    list.sort((a, b) => {
      if (a.isRed && !b.isRed) return -1
      if (!a.isRed && b.isRed) return 1
      return (a.orderNumber || 0) - (b.orderNumber || 0)
    })

    return list
  }, [logs, filterDate, searchQuery])

  // Group all logs by date for Archive view
  const archivedDays = useMemo(() => {
    const map = new Map<string, DriverMedicalExamItem[]>()
    logs.forEach(item => {
      if (!item.date || !item.driverName.trim()) return
      const list = map.get(item.date) || []
      list.push(item)
      map.set(item.date, list)
    })

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

    return sortedDates.map(dateStr => {
      const items = map.get(dateStr) || []
      const approved = items.filter(
        i => !i.result.toLowerCase().includes('рад') && !i.result.toLowerCase().includes('четлатилди')
      ).length
      const rejected = items.length - approved
      const alcoholDetected = items.filter(
        i => i.breathAlcohol.includes('аниқланди') && !i.breathAlcohol.includes('аниқланмади')
      ).length
      return {
        date: dateStr,
        total: items.length,
        approved,
        rejected,
        alcoholDetected,
        signature: items[0]?.signature || 'Жуманова Ч.Э.',
        items
      }
    })
  }, [logs])

  const filteredArchivedDays = useMemo(() => {
    if (!archiveSearchQuery.trim()) return archivedDays
    const q = archiveSearchQuery.toLowerCase()
    return archivedDays.filter(day => {
      const matchDate = day.date.includes(q)
      const matchDriver = day.items.some(i => i.driverName.toLowerCase().includes(q))
      return matchDate || matchDriver
    })
  }, [archivedDays, archiveSearchQuery])

  // Save daily journal for the selected/current day
  const handleSaveDailyJournal = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const currentDayItems = logs.filter(l => l.date === targetDate && l.driverName.trim())

    if (currentDayItems.length === 0) {
      toast.error(formatDual(`${targetDate} sanasi uchun haydovchilar kiritilmagan! Qator qo'shing.`, `Для даты ${targetDate} не введены водители! Добавьте строку.`, `No drivers entered for date ${targetDate}! Please add row.`))
      return
    }

    setSavingAll(true)
    const updated = logs.map(l => (l.date === targetDate && l.driverName.trim() ? { ...l, _dirty: false, _isNew: false } : l))
    setLogs(updated)
    persistLogs(updated)
    setSavingAll(false)
    toast.success(formatDual(`${targetDate} kunlik ko'rik jadvali saqlandi va arxivga kiritildi! (${currentDayItems.length} nafar)`, `${targetDate} журнал медосмотра сохранен и занесен в архив! (${currentDayItems.length} чел.)`, `${targetDate} daily exam journal saved and archived! (${currentDayItems.length} drivers)`), {
      icon: '💾'
    })
  }

  // Export specific day CSV
  const handleExportDayCSV = (targetDate: string) => {
    const targetRows = logs.filter(r => r.date === targetDate && r.driverName.trim())
    if (targetRows.length === 0) {
      toast.error(formatDual(`${targetDate} sanasida yozuvlar yo'q!`, `На дату ${targetDate} нет записей!`, `No records found for date ${targetDate}!`))
      return
    }

    const headers = [
      formatDual('№', '№', '#'),
      formatDual('Haydovchining F.I.Sh.', 'Ф.И.О. водителя', 'Driver Name'),
      formatDual('Sana', 'Дата', 'Date'),
      formatDual('Shikoyatlari', 'Жалобы', 'Complaints'),
      formatDual('Tomir urishi', 'Пульс', 'Pulse'),
      formatDual('Tana harorati', 'Температура тела', 'Body Temp'),
      formatDual('Arterial bosim', 'Артериальное давление', 'Blood Pressure'),
      formatDual('Alkogol miqdori', 'Содержание алкоголя', 'Breath Alcohol'),
      formatDual('Tibbiy ko\'rik natijasi', 'Результат медосмотра', 'Exam Result'),
      formatDual('Imzo', 'Подпись', 'Signature')
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
    link.download = `Haydovchilar_kunlik_tibbiy_korik_${targetDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(formatDual(`${targetDate} sanasi Excel CSV fayli yuklab olindi`, `Файл Excel CSV на дату ${targetDate} успешно скачан`, `Excel CSV file for ${targetDate} downloaded successfully`))
  }

  // Unsaved changes flag
  const hasUnsavedChanges = useMemo(() => {
    return logs.some(l => l._dirty && l.driverName.trim())
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
                  {formatDual("Reys oldi ko'rigi", "Предрейсовый осмотр", "Pre-trip Medical Exam")}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
                  {formatDual("3 va 4-rasm bo'yicha rasmiy jurnal", "Официальный журнал по форме 3 и 4", "Official journal by form 3 & 4")}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {formatDual("LINIYAGA YO'NALTIRILGAN HAYDOVCHILARNI KUNLIK TIBBIY KO'RIKDAN O'TKAZISH JURNALI", "ЖУРНАЛ ЕЖЕДНЕВНОГО ПРЕДРЕЙСОВОГО МЕДИЦИНСКОГО ОСМОТРА ВОДИТЕЛЕЙ", "DAILY PRE-TRIP MEDICAL EXAMINATION JOURNAL FOR DRIVERS")}
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
                <span>{formatDual("Kunlik jadval", "Ежедневная таблица", "Daily Table")}</span>
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
                <span>{formatDual(`Arxiv (${archivedDays.length})`, `Архив (${archivedDays.length})`, `Archive (${archivedDays.length})`)}</span>
              </button>
            </div>

            {viewMode === 'daily' && (
              <>
                {/* Quick add empty row */}
                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{formatDual("+ Haydovchi qo'shish", "+ Добавить водителя", "+ Add Driver")}</span>
                </button>

                {/* Bulk check 10 drivers */}
                <button
                  type="button"
                  onClick={handleBulkCheckAllDrivers}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
                  title={formatDual("Bugungi barcha 10 ta haydovchini avtomatik to'ldirish", "Автозаполнение всех 10 водителей на сегодня", "Auto-populate all 10 fleet drivers for today")}
                >
                  <Zap size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">{formatDual("10 ta haydovchi", "10 водителей", "10 Drivers")}</span>
                </button>
              </>
            )}

            {/* Master Save: KUNLIK JADVALNI SAQLASH */}
            <button
              type="button"
              onClick={handleSaveDailyJournal}
              disabled={savingAll}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
              title={formatDual("Kunlik jadvalni saqlash va arxivga kiritish", "Сохранить дневной журнал и занести в архив", "Save daily journal and commit to archive")}
            >
              <Save size={15} />
              <span>{savingAll ? formatDual("Saqlanmoqda...", "Сохранение...", "Saving...") : formatDual("Kunlik jadvalni saqlash", "Сохранить дневной журнал", "Save Daily Journal")}</span>
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
                    {formatDual("Haydovchilar tibbiy ko'riklari arxivi", "Архив предрейсовых медосмотров водителей", "Driver Pre-Trip Medical Exams Archive")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDual(`Jami ${archivedDays.length} kunlik ko'rik jadvallari saqlangan`, `Всего сохранено ${archivedDays.length} дней осмотра`, `Total ${archivedDays.length} days of exams archived`)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder={formatDual("Sana yoki haydovchi qidirish...", "Поиск по дате или водителю...", "Search date or driver...")}
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
                  <span>{formatDual("Bugungi kunga qaytish", "Вернуться на сегодня", "Back to Today")}</span>
                </button>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Arxivlangan kunlar", "Архивировано дней", "Archived days")}</span>
                <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">{archivedDays.length} {formatDual("kun", "дней", "days")}</strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Jami ko'riklar", "Всего осмотров", "Total exams")}</span>
                <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {logs.filter(l => l.driverName.trim()).length} {formatDual("nafar", "чел.", "drivers")}
                </strong>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-emerald-700 dark:text-emerald-400 block mb-1">{formatDual("Reysga ruxsat", "Допуск в рейс", "Trip cleared")}</span>
                <strong className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  {logs.filter(l => l.driverName.trim() && !l.result.toLowerCase().includes('рад') && !l.result.toLowerCase().includes('четлатилди')).length} {formatDual("nafar", "чел.", "drivers")}
                </strong>
              </div>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
                <span className="text-rose-700 dark:text-rose-400 block mb-1">{formatDual("Chetlatilganlar", "Отстранены от рейса", "Suspended")}</span>
                <strong className="text-lg font-black text-rose-800 dark:text-rose-300 font-mono">
                  {logs.filter(l => l.driverName.trim() && (l.result.toLowerCase().includes('рад') || l.result.toLowerCase().includes('четлатилди'))).length} {formatDual("nafar", "чел.", "drivers")}
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
                    <th className="p-3 text-center">{formatDual("Haydovchilar soni", "Кол-во водителей", "Drivers count")}</th>
                    <th className="p-3 text-center">{formatDual("Reysga ruxsat", "Допуск в рейс", "Trip cleared")}</th>
                    <th className="p-3 text-center">{formatDual("Chetlatilgan", "Отстранены", "Suspended")}</th>
                    <th className="p-3 text-center">{formatDual("Alkogol nazorati", "Контроль алкоголя", "Alcohol check")}</th>
                    <th className="p-3 min-w-[150px]">{formatDual("Mas'ul hamshira", "Ответственная медсестра", "Nurse in charge")}</th>
                    <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                    <th className="p-3 text-center w-48">{formatDual("Amallar", "Действия", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredArchivedDays.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
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
                          <td className="p-3 text-center font-bold font-mono">{day.total} {formatDual("nafar", "чел.", "drivers")}</td>
                          <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ✓ {day.approved}
                          </td>
                          <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400 font-mono">
                            {day.rejected > 0 ? `✕ ${day.rejected}` : '0'}
                          </td>
                          <td className="p-3 text-center">
                            {day.alcoholDetected > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                                {day.alcoholDetected} {formatDual("aniqlandi!", "обнаружен!", "detected!")}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                                {formatDual("Toza", "Чисто", "Clear")}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-serif italic text-slate-700 dark:text-slate-300 whitespace-nowrap">{day.signature}</td>
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
                placeholder={formatDual("Haydovchi ismi bo'yicha qidirish...", "Поиск по имени водителя...", "Search by driver name...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
              {formatDual("Jami ko'rik:", "Всего осмотров:", "Total exams:")}{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {displayedRows.filter(r => r.driverName.trim()).length} {formatDual("nafar", "чел.", "drivers")}
              </strong>
            </span>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              {formatDual("✓ Reysga ruxsat:", "✓ Допуск в рейс:", "✓ Trip cleared:")}{' '}
              {displayedRows.filter(r => r.driverName.trim() && !r.result.toLowerCase().includes('рад') && !r.result.toLowerCase().includes('четлатилди')).length}
            </span>
          </div>
        </div>

        {/* Main Spreadsheet Table - Direct Inline Inputs (Huddi Kirim-Chiqim kabi) */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <th className="p-2.5 text-center font-bold w-12 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("T/r", "№", "#")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">1</div>
                  </th>
                  <th className="p-2.5 text-left font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Haydovchining familiyasi, ismi, otasining ismi *", "Фамилия, имя, отчество водителя *", "Driver full name *")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">2</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[100px] border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Shikoyatlari", "Жалобы", "Complaints")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">3</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-28 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Tomir urishi", "Пульс", "Pulse")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">4</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-28 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Tana harorati", "Температура тела", "Body Temp")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">5</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-32 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Arterial bosim", "Артериальное давление", "Blood Pressure")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">6</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[180px] border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Alkogol miqdori", "Содержание алкоголя", "Breath Alcohol")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">7</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[200px] border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Tibbiy ko'rik natijalari", "Результаты медосмотра", "Medical Exam Results")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">8</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[150px] w-40 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Haydovchi imzosi", "Подпись водителя", "Driver Signature")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">9</div>
                  </th>
                  <th className="p-2.5 text-center font-bold min-w-[170px] w-48 border-r border-slate-300 dark:border-slate-700">
                    <div>{formatDual("Hamshira imzosi", "Подпись медсестры", "Nurse Signature")}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">10</div>
                  </th>
                  <th className="p-2.5 text-center font-bold w-24 no-print">{formatDual("Amallar", "Действия", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium text-sm">{formatDual("Ushbu sanada tibbiy ko'rik yozuvlari mavjud emas", "На эту дату записей медосмотра нет", "No medical exam records for this date")}</p>
                        <button
                          type="button"
                          onClick={handleAddNewRow}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                        >
                          <Plus size={14} /> {formatDual("Haydovchi qo'shish", "Добавить водителя", "Add Driver")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => {
                    const isRowEmptyNew = row._isNew && !row.driverName.trim()
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
                        {/* 1. Tartib raqami */}
                        <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                          {idx + 1}
                        </td>

                        {/* 2. Haydovchi F.I.Sh. (Direct Input with fast suggestions) */}
                        <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                          <div className="flex flex-col gap-1">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                list="fleet-drivers-list"
                                value={row.driverName}
                                onChange={e => {
                                  const nameVal = e.target.value
                                  const matched = OFFICIAL_FLEET_DRIVERS_DATA.find(d => d.name === nameVal)
                                  updateRowField(row.id, {
                                    driverName: nameVal,
                                    driverSignature: nameVal ? nameVal.split(' ')[0] + ' (Имзо)' : '',
                                    bloodPressure: matched?.bp || row.bloodPressure,
                                    examDueDate: matched?.examDate || row.examDueDate,
                                    isRed: !!matched?.isRed
                                  })
                                }}
                                placeholder={formatDual("Haydovchi F.I.Sh.ni yozing yoki tanlang", "Введите или выберите ФИО водителя", "Enter or select driver full name")}
                                className={`w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs outline-none transition shadow-2xs ${
                                  row.isRed
                                    ? 'bg-rose-50/70 border-rose-400 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white'
                                }`}
                              />
                            </div>
                            {row.isRed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                                ⚠️ Даврий кўрик муддати: {row.examDueDate || '19.11.2026г'} (Қизил)
                              </span>
                            )}
                          </div>
                        </td>

                      {/* 3. Shikoyatlari */}
                      <td className="p-1.5 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.complaints}
                          onChange={e => updateRowField(row.id, { complaints: e.target.value })}
                          placeholder={formatDual("yo'q", "нет", "none")}
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
                          <option value="аниқланмади">{formatDual("aniqlanmadi (toza)", "не обнаружен (чисто)", "not detected (clear)")}</option>
                          <option value="аниқланди">{formatDual("aniqlandi (ichgan)", "обнаружен (алкоголь)", "detected (alcohol)")}</option>
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
                          <option value="соғлом, рейска рухсат">{formatDual("✓ sog'lom, reysga ruxsat", "✓ здоров, допуск в рейс", "✓ healthy, trip cleared")}</option>
                          <option value="соғлом, назорат билан рухсат">{formatDual("⚠️ sog'lom, nazorat bilan ruxsat", "⚠️ здоров, под контролем", "⚠️ cleared under control")}</option>
                          <option value="соғлом эмас, четлатилди">{formatDual("✕ sog'lom emas, chetlatildi", "✕ не здоров, отстранен", "✕ not healthy, suspended")}</option>
                        </select>
                      </td>

                      {/* 9. Haydovchi imzosi */}
                      <td className="p-1.5 min-w-[150px] w-40 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.driverSignature || ''}
                          onChange={e => updateRowField(row.id, { driverSignature: e.target.value })}
                          placeholder={formatDual("Haydovchi imzosi", "Подпись водителя", "Driver Sig")}
                          className="w-full text-center font-serif italic text-blue-600 dark:text-blue-400 font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs outline-none focus:border-blue-500 whitespace-nowrap"
                        />
                      </td>

                      {/* 10. Hamshira imzosi */}
                      <td className="p-1.5 min-w-[170px] w-48 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="text"
                          value={row.signature}
                          onChange={e => updateRowField(row.id, { signature: e.target.value })}
                          placeholder="Жуманова Ч.Э."
                          className="w-full text-center font-serif italic font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 whitespace-nowrap"
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
                }))}
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
              {formatDual("Mas'ul tibbiy xodim:", "Ответственный медработник:", "Responsible medical staff:")} <strong>{formatDual("Jumanova Ch.E.", "Жуманова Ч.Э.", "Jumanova Ch.E.")}</strong> ({formatDual("Feldsher / Hamshira", "Фельдшер / Медсестра", "Paramedic / Nurse")}) • {formatDual("Rasmiy 9 ta ustunli reys oldi tibbiy ko'rik jurnali", "Официальный 9-колоночный журнал предрейсового медосмотра", "Official 9-column pre-trip medical exam journal")}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {formatDual(
              "O'zgarishlar kiritilgandan so'ng Kunlik jadvalni saqlash tugmasini bosing. Barcha ma'lumotlar avtomatik arxivga saqlanadi.",
              "После внесения изменений нажмите кнопку Сохранить дневной журнал. Все данные автоматически сохраняются в архив.",
              "After making changes, click Save Daily Journal. All records are automatically saved to the archive."
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

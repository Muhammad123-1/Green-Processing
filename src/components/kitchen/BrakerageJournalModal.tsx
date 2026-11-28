'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  Calendar,
  Trash2,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Check,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Save,
  Archive,
  Eye,
  ArrowLeft,
  Search,
  UserCheck,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface ChairmanItem {
  id: string
  name: string
  role?: string
  signatureUrl?: string
  isDefault?: boolean
}

export const DEFAULT_CHAIRMEN: ChairmanItem[] = [
  {
    id: 'ch-iminov',
    name: 'Иминов С.М.',
    role: 'Директор',
    signatureUrl: '/signatures/iminov.png',
    isDefault: true
  }
]

export interface BrakerageMeal {
  id?: number
  _clientKey: string
  _isNew?: boolean
  _dirty?: boolean
  _saving?: boolean
  date: string
  orderNumber: number
  mealName: string
  prepTime: string
  chairmanSign: string
  member1Sign: string
  member2Sign: string
  qcInspectorSign: string
  medicalStaffSign: string
  organoleptic: string
  temperature: string
  notes: string
  status: 'APPROVED' | 'REJECTED'
}

export interface Props {
  isOpen?: boolean
  onClose?: () => void
  isFullPage?: boolean
}

const DEFAULT_COMMITTEE = {
  chairman: 'Иминов С.М.',
  member1: 'Зимина Л.Г.',
  member2: 'Расулов А.А.',
  qcInspector: 'Камбарова А.М.',
  medicalStaff: 'Жуманова Ч.Э.'
}

const QUICK_ORGANOLEPTIC = [
  'Ташқи кўриниши сариқ, ўз тинимли ранг, мазали, нормал тузими юмшоқ, пишган.',
  'Ташқи кўриниши сариқ, гўшти билан яхши аралашган, мазали, нормал, тузими юмшоқ, стандартда.',
  'Ташқи кўриниши янги, ширали, табиий таъмда, нормал тузими.',
  'Қуюқ, хушбўй ҳидли, гўшт ва сабзавотлар меъёрида пишган, тузи нормал, табиий рангда.',
  'Гўшт маҳсулотлари юмшоқ, яхши қовурилган, ёғи тиниқ, бегона ҳид ва таъмсиз.'
]

const getTodayTashkent = () => {
  const d = new Date()
  const tzOffset = 5 * 60 * 60 * 1000
  return new Date(d.getTime() + tzOffset).toISOString().slice(0, 10)
}

const createEmptyMeal = (date: string, orderNumber: number): BrakerageMeal => ({
  _clientKey: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  _isNew: true,
  _dirty: true,
  _saving: false,
  date: date || getTodayTashkent(),
  orderNumber,
  mealName: '',
  prepTime: new Date().toTimeString().slice(0, 5),
  chairmanSign: DEFAULT_COMMITTEE.chairman,
  member1Sign: DEFAULT_COMMITTEE.member1,
  member2Sign: DEFAULT_COMMITTEE.member2,
  qcInspectorSign: DEFAULT_COMMITTEE.qcInspector,
  medicalStaffSign: DEFAULT_COMMITTEE.medicalStaff,
  organoleptic: QUICK_ORGANOLEPTIC[0],
  temperature: '+85°C',
  notes: 'Яхши, истеъмолга рухсат этилади.',
  status: 'APPROVED'
})

export function BrakerageJournalModal({ isOpen = true, onClose, isFullPage = false }: Props) {
  const { formatDual, lang } = useLanguage()
  const [meals, setMeals] = useState<BrakerageMeal[]>([])
  const [chairmen, setChairmen] = useState<ChairmanItem[]>(DEFAULT_CHAIRMEN)
  const [loading, setLoading] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'daily' | 'archive'>('daily')
  const [archiveLogs, setArchiveLogs] = useState<any[]>([])
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
  const [auditPeriod, setAuditPeriod] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('ALL')
  const [showAuditModal, setShowAuditModal] = useState(false)

  // Load chairmen from DB settings
  useEffect(() => {
    async function loadChairmenSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const setting = data.find((s: any) => s.key === 'brakerage_chairmen')
            if (setting?.value) {
              const parsed = JSON.parse(setting.value)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setChairmen(parsed)
              }
            }
          }
        }
      } catch {
        // fallback to default
      }
    }
    loadChairmenSettings()
  }, [])

  // Fetch full archive from DB
  const fetchArchive = useCallback(async () => {
    try {
      setLoadingArchive(true)
      const res = await fetch('/api/kitchen/brakerage?date=ALL')
      const data = await res.json()
      if (data.success && Array.isArray(data.logs)) {
        setArchiveLogs(data.logs)
      }
    } catch {
      // ignore
    } finally {
      setLoadingArchive(false)
    }
  }, [])

  useEffect(() => {
    fetchArchive()
  }, [fetchArchive])

  // Group archive logs by date for Archive view
  const archivedDays = useMemo(() => {
    const map = new Map<string, any[]>()
    archiveLogs.forEach(l => {
      if (!l.date || !l.mealName?.trim()) return
      const list = map.get(l.date) || []
      list.push(l)
      map.set(l.date, list)
    })

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

    return sortedDates.map(dateStr => {
      const items = map.get(dateStr) || []
      const approved = items.filter(i => i.status === 'APPROVED').length
      const rejected = items.filter(i => i.status === 'REJECTED').length
      return {
        date: dateStr,
        total: items.length,
        approved,
        rejected,
        chairmanSign: items[0]?.chairmanSign || DEFAULT_COMMITTEE.chairman,
        items
      }
    })
  }, [archiveLogs])

  const periodFilteredLogs = useMemo(() => {
    if (auditPeriod === 'ALL') return archiveLogs
    const today = getTodayTashkent()
    if (auditPeriod === 'DAILY') {
      return archiveLogs.filter(l => l.date === today)
    }
    if (auditPeriod === 'WEEKLY') {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      return archiveLogs.filter(l => l.date >= weekAgo && l.date <= today)
    }
    if (auditPeriod === 'MONTHLY') {
      const ym = today.slice(0, 7)
      return archiveLogs.filter(l => l.date.startsWith(ym))
    }
    if (auditPeriod === 'YEARLY') {
      const y = today.slice(0, 4)
      return archiveLogs.filter(l => l.date.startsWith(y))
    }
    return archiveLogs
  }, [archiveLogs, auditPeriod])

  const filteredArchivedDays = useMemo(() => {
    let days = archivedDays
    if (auditPeriod !== 'ALL') {
      const today = getTodayTashkent()
      if (auditPeriod === 'DAILY') {
        days = days.filter(d => d.date === today)
      } else if (auditPeriod === 'WEEKLY') {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        days = days.filter(d => d.date >= weekAgo && d.date <= today)
      } else if (auditPeriod === 'MONTHLY') {
        const ym = today.slice(0, 7)
        days = days.filter(d => d.date.startsWith(ym))
      } else if (auditPeriod === 'YEARLY') {
        const y = today.slice(0, 4)
        days = days.filter(d => d.date.startsWith(y))
      }
    }
    if (!archiveSearchQuery.trim()) return days
    const q = archiveSearchQuery.toLowerCase()
    return days.filter(day => {
      const matchDate = day.date.includes(q)
      const matchMeal = day.items.some((i: any) => i.mealName?.toLowerCase().includes(q))
      return matchDate || matchMeal
    })
  }, [archivedDays, archiveSearchQuery, auditPeriod])

  // Fetch from DB (faqat mavjud saqlangan ma'lumotlarni yuklaydi, avtomatik bo'sh qator qo'shmaydi)
  const fetchLogs = useCallback(async (dateVal = filterDate) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/kitchen/brakerage?date=${dateVal}`)
      const data = await res.json()
      if (data.success) {
        const rawList = data.logs || []
        const mapped: BrakerageMeal[] = rawList.map((l: any, idx: number) => ({
          id: l.id,
          _clientKey: `db-${l.id}`,
          _isNew: false,
          _dirty: false,
          _saving: false,
          date: l.date,
          orderNumber: l.orderNumber || idx + 1,
          mealName: l.mealName || '',
          prepTime: l.prepTime || '09:00',
          chairmanSign: l.chairmanSign || DEFAULT_COMMITTEE.chairman,
          member1Sign: l.member1Sign || DEFAULT_COMMITTEE.member1,
          member2Sign: l.member2Sign || DEFAULT_COMMITTEE.member2,
          qcInspectorSign: l.qcInspectorSign || DEFAULT_COMMITTEE.qcInspector,
          medicalStaffSign: l.medicalStaffSign || DEFAULT_COMMITTEE.medicalStaff,
          organoleptic: l.organoleptic || QUICK_ORGANOLEPTIC[0],
          temperature: l.temperature || '+85°C',
          notes: l.notes || 'Яхши, истеъмолга рухсат этилади.',
          status: l.status === 'REJECTED' ? 'REJECTED' : 'APPROVED'
        }))

        setMeals(mapped)
      } else {
        toast.error(data.error || formatDual("Ma'lumotlarni yuklab bo'lmadi", "Не удалось загрузить данные", "Failed to load data"))
      }
    } catch {
      toast.error(formatDual("Server bilan aloqa uzildi", "Связь с сервером потеряна", "Connection to server lost"))
    } finally {
      setLoading(false)
    }
  }, [filterDate])

  useEffect(() => {
    if (isOpen || isFullPage) {
      fetchLogs(filterDate)
    }
  }, [isOpen, isFullPage, filterDate, fetchLogs])

  // Quick day step
  const handleDateStep = (days: number) => {
    let base = filterDate && filterDate !== 'ALL' ? new Date(filterDate) : new Date()
    if (isNaN(base.getTime())) base = new Date()
    base.setDate(base.getDate() + days)
    const nextDate = base.toISOString().slice(0, 10)
    setFilterDate(nextDate)
  }

  // Update specific meal field directly in state (hech qanday avtomatik qator ochilmaydi)
  const updateMealField = (idx: number, patch: Partial<BrakerageMeal>) => {
    setMeals(prev => {
      const next = [...prev]
      const cur = next[idx]
      if (!cur) return prev
      next[idx] = { ...cur, ...patch, _dirty: true }
      return next
    })
  }

  // Add explicit new row (faqat tugma bosilganda jadvalning eng tepasiga qo'shiladi)
  const handleAddNewRow = () => {
    const targetDate = filterDate === 'ALL' ? getTodayTashkent() : filterDate
    const defaultChairman = chairmen.find(c => c.isDefault) || chairmen[0]
    const newMeal = createEmptyMeal(targetDate, 1)
    if (defaultChairman?.name) {
      newMeal.chairmanSign = defaultChairman.name
    }
    newMeal._dirty = true
    newMeal._isNew = true

    // Eng tepaga qo'shamiz (user talabi bo'yicha)
    setMeals(prev => [newMeal, ...prev])
    toast.info(formatDual("Yangi qator qo'shildi. Taom ma'lumotlarini kiriting.", "Добавлена новая строка. Введите данные блюда.", "New row added. Enter meal details."))
  }

  // Save a single meal row
  const handleSaveMeal = async (meal: BrakerageMeal, idx: number) => {
    if (!meal.mealName.trim()) {
      toast.error(formatDual("Iltimos, taom nomini kiriting!", "Пожалуйста, введите название блюда!", "Please enter meal name!"))
      return
    }

    setMeals(prev => {
      const copy = [...prev]
      if (copy[idx]) copy[idx] = { ...copy[idx], _saving: true }
      return copy
    })

    try {
      const isUpdate = Boolean(meal.id)
      const url = '/api/kitchen/brakerage'
      const method = isUpdate ? 'PUT' : 'POST'
      const payload: any = {
        date: meal.date || filterDate,
        orderNumber: meal.orderNumber,
        mealName: meal.mealName.trim(),
        prepTime: meal.prepTime.trim() || '09:00',
        chairmanSign: meal.chairmanSign.trim(),
        member1Sign: meal.member1Sign.trim(),
        member2Sign: meal.member2Sign.trim(),
        qcInspectorSign: meal.qcInspectorSign.trim(),
        medicalStaffSign: meal.medicalStaffSign.trim(),
        organoleptic: meal.organoleptic.trim(),
        temperature: meal.temperature.trim() || '+85°C',
        notes: meal.notes.trim() || 'Яхши, истеъмолга рухсат этилади.',
        status: meal.status
      }
      if (isUpdate) {
        payload.id = meal.id
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()

      if (result.success && result.log) {
        toast.success(isUpdate ? formatDual("Taom ma'lumotlari saqlandi", "Данные блюда сохранены", "Meal details saved") : formatDual(`"${meal.mealName}" saqlandi`, `"${meal.mealName}" сохранено`, `"${meal.mealName}" saved`))
        setMeals(prev => {
          const copy = [...prev]
          if (copy[idx]) {
            copy[idx] = {
              ...copy[idx],
              id: result.log.id,
              _isNew: false,
              _dirty: false,
              _saving: false
            }
          }
          return copy
        })
      } else {
        toast.error(result.error || formatDual("Saqlashda xatolik yuz berdi", "Произошла ошибка при сохранении", "Error occurred while saving"))
        setMeals(prev => {
          const copy = [...prev]
          if (copy[idx]) copy[idx] = { ...copy[idx], _saving: false }
          return copy
        })
      }
    } catch {
      toast.error(formatDual("Server bilan aloqa xatosi", "Ошибка связи с сервером", "Server connection error"))
      setMeals(prev => {
        const copy = [...prev]
        if (copy[idx]) copy[idx] = { ...copy[idx], _saving: false }
        return copy
      })
    }
  }

  // Save daily journal for the current day
  const handleSaveDailyJournal = async () => {
    const filledMeals = meals.filter(m => m.mealName.trim())
    if (filledMeals.length === 0) {
      toast.error(formatDual(`${filterDate} sanasi uchun taomlar nomi kiritilmagan! Yangi taom qo'shing.`, `На дату ${filterDate} нет названий блюд! Добавьте новое блюдо.`, `No meal names entered for ${filterDate}! Add a new meal.`))
      return
    }

    setSavingAll(true)
    let savedCount = 0
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i]
      if (m.mealName.trim() && (m._dirty || m._isNew)) {
        await handleSaveMeal(m, i)
        savedCount++
      }
    }
    setSavingAll(false)
    fetchArchive()
    toast.success(
      formatDual(
        `${filterDate} kunlik brakeraj jadvali saqlandi va arxivga kiritildi! (${filledMeals.length} ta taom)`,
        `${filterDate} дневной журнал бракеража сохранен в архив! (${filledMeals.length} блюд)`,
        `${filterDate} daily brakerage journal saved to archive! (${filledMeals.length} meals)`
      ),
      { icon: '💾' }
    )
  }

  // Delete a meal
  const handleDeleteMeal = async (idx: number) => {
    const meal = meals[idx]
    if (!meal) return

    // If it's just an unsaved empty row, clear it
    if (meal._isNew && !meal.mealName.trim()) {
      setMeals(prev => prev.filter((_, i) => i !== idx))
      return
    }

    const confirmMsg = formatDual(
      `"${meal.mealName || 'Taom'}" yozuvini o'chirmoqchimisiz?`,
      `Удалить запись "${meal.mealName || 'Блюдо'}"?`,
      `Delete record "${meal.mealName || 'Meal'}"?`
    )
    if (!confirm(confirmMsg)) return

    if (meal.id) {
      try {
        const res = await fetch(`/api/kitchen/brakerage?id=${meal.id}`, { method: 'DELETE' })
        const result = await res.json()
        if (!result.success) {
          toast.error(result.error || formatDual("O'chirishda xatolik", "Ошибка удаления", "Deletion error"))
          return
        }
        toast.success(formatDual("Taom jurnalidan o'chirildi", "Блюдо удалено из журнала", "Meal deleted from journal"))
      } catch {
        toast.error(formatDual("Server xatosi", "Ошибка сервера", "Server error"))
        return
      }
    }

    setMeals(prev => prev.filter((_, i) => i !== idx))
  }

  // Export Excel
  const handleExportExcel = () => {
    window.open(`/api/kitchen/brakerage/export?date=${filterDate || 'ALL'}`, '_blank')
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Filter meals for daily search
  const displayedMeals = useMemo(() => {
    if (!searchQuery.trim()) return meals
    const q = searchQuery.toLowerCase()
    return meals.filter(m =>
      m.mealName.toLowerCase().includes(q) ||
      m.organoleptic.toLowerCase().includes(q) ||
      m.notes.toLowerCase().includes(q) ||
      m.chairmanSign.toLowerCase().includes(q) ||
      m.medicalStaffSign.toLowerCase().includes(q) ||
      m.qcInspectorSign.toLowerCase().includes(q)
    )
  }, [meals, searchQuery])

  const hasUnsavedChanges = meals.some(m => m._dirty && m.mealName.trim())
  const activeChairman = chairmen.find(c => c.isDefault) || chairmen[0]

  if (!isFullPage && !isOpen) return null

  return (
    <div
      id="brakeraj-journal-printable"
      className={`bg-white dark:bg-slate-900 ${
        isFullPage
          ? 'w-full rounded-3xl shadow-sm border border-slate-300 dark:border-slate-800 flex flex-col text-slate-900 dark:text-white print:border-none print:shadow-none print:rounded-none print:p-0'
          : 'rounded-3xl w-full max-w-7xl shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-800 flex flex-col max-h-[94vh] my-auto text-slate-900 dark:text-white print:border-none print:shadow-none print:rounded-none print:max-h-none print:p-0'
      } overflow-hidden print:overflow-visible`}
      onClick={e => e.stopPropagation()}
    >
      {/* Dedicated Print Styles for A4 Landscape SanPiN Journal */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 6mm 8mm !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #brakeraj-journal-printable {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          #brakeraj-journal-printable table {
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #brakeraj-journal-printable th,
          #brakeraj-journal-printable td {
            border: 1px solid #1e293b !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            padding: 4px 3px !important;
          }
          #brakeraj-journal-printable thead th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            font-size: 7.5pt !important;
            line-height: 1.15 !important;
          }
          #brakeraj-journal-printable tbody td {
            font-size: 8pt !important;
            line-height: 1.2 !important;
          }
        }
      `}} />

      {/* Official Print Document Header - Only visible during print */}
      <div className="hidden print:block mb-3 p-1 text-black">
        <div className="text-center space-y-1">
          <div className="text-[8.5pt] font-semibold uppercase tracking-wider text-slate-700">
            {formatDual(
              "O'zbekiston Respublikasi SanPiN me'yorlari asosida",
              "На основе норм СанПиН Республики Узбекистан",
              "Based on SanPiN norms of the Republic of Uzbekistan"
            )}
          </div>
          <h1 className="text-[13pt] font-black uppercase tracking-tight text-black">
            {formatDual(
              "TAYYOR MAHSULOTLARNI NAZORAT QILISH (BRAKERAJ) JURNALI",
              "ЖУРНАЛ КОНТРОЛЯ ГОТОВОЙ ПРОДУКЦИИ (БРАКЕРАЖ)",
              "FINISHED PRODUCTS INSPECTION (BRAKERAGE) JOURNAL"
            )}
          </h1>
          <div className="flex items-center justify-between text-[8.5pt] font-medium text-slate-800 border-b border-black pb-1 pt-1 mt-1">
            <span><strong>{formatDual("Tashkilot:", "Организация:", "Organization:")}</strong> Green Processing MChJ (Oshxona)</span>
            <span><strong>{formatDual("Sana:", "Дата:", "Date:")}</strong> <span className="font-bold underline">{filterDate === 'ALL' ? formatDual("Barcha sanalar", "Все даты", "All dates") : filterDate}</span></span>
            <span><strong>{formatDual("Jurnal shakli:", "Форма журнала:", "Form:")}</strong> SanPiN № 0027-20 / Oshxona</span>
          </div>
        </div>
      </div>

      {/* Top Header - Clean, clinical, high contrast slate styling */}
      <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs">
            <Utensils size={24} className="text-slate-800 dark:text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                {formatDual("SanPiN Jurnali", "Журнал СанПиН", "SanPiN Journal")}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {formatDual("Brakeraj va Taomlar Nazorati", "Бракераж и Контроль Блюд", "Brakerage & Meals Inspection")}
              </span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatDual(
                "TAYYOR MAHSULOTLARNI NAZORAT QILISH JURNALI",
                "ЖУРНАЛ КОНТРОЛЯ ГОТОВОЙ ПРОДУКЦИИ",
                "FINISHED PRODUCTS INSPECTION JOURNAL"
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
              onClick={() => {
                setViewMode('archive')
                fetchArchive()
              }}
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
            <>
              <button
                type="button"
                onClick={handleAddNewRow}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>{formatDual("+ Yangi Taom Qo'shish", "+ Добавить Блюдо", "+ Add New Meal")}</span>
              </button>

              <Link
                href="/settings?tab=chairmen"
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
                title={formatDual("Komissiya raislari va imzolarini sozlash", "Настройка председателей комиссии и подписей", "Configure committee chairmen & signatures")}
              >
                <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>{formatDual("Raislar & Imzolar", "Председатели & Подписи", "Chairmen & Signatures")}</span>
              </Link>
            </>
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
            {savingAll ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{savingAll ? formatDual("Saqlanmoqda...", "Сохранение...", "Saving...") : formatDual("Kunlik jadvalni saqlash", "Сохранить дневной журнал", "Save daily journal")}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
            title={formatDual("Excel shaklida yuklab olish", "Скачать в формате Excel", "Download in Excel format")}
          >
            <Download size={14} />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
            title={formatDual("A4 formatda chop etish", "Печать в формате A4", "Print in A4 format")}
          >
            <Printer size={14} />
            <span>{formatDual("Chop etish", "Печать", "Print")}</span>
          </button>

          {!isFullPage && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition ml-1 cursor-pointer"
              title={formatDual("Yopish", "Закрыть", "Close")}
            >
              <X size={20} />
            </button>
          )}
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
                  {formatDual("Oshxona brakeraj nazoratlari arxivi", "Архив бракеражного контроля кухни", "Kitchen Brakerage Control Archive")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDual(
                    `Jami ${archivedDays.length} kunlik tayyor mahsulotlar ko'rik jadvali saqlangan`,
                    `Всего сохранено ${archivedDays.length} дневных журналов бракеража`,
                    `Total ${archivedDays.length} daily brakerage journals archived`
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder={formatDual("Sana yoki taom qidirish...", "Поиск по дате или блюду...", "Search by date or meal...")}
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

          {/* Audit Period Selector & Official Audit Act Trigger */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-500" />
                {formatDual("Audit davri:", "Период аудита:", "Audit period:")}
              </span>
              {[
                { id: 'ALL' as const, label: formatDual("Barchasi", "Все", "All") },
                { id: 'DAILY' as const, label: formatDual("Kunlik", "Дневной", "Daily") },
                { id: 'WEEKLY' as const, label: formatDual("Haftalik", "Недельный", "Weekly") },
                { id: 'MONTHLY' as const, label: formatDual("Oylik", "Месячный", "Monthly") },
                { id: 'YEARLY' as const, label: formatDual("Yillik", "Годовой", "Yearly") }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAuditPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    auditPeriod === p.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>{formatDual("Rasmiy SanPiN Audit Dalolatnomasi (5 Imzo)", "Официальный Акт Аудита (5 Подписей)", "Official Audit Act (5 Sigs)")}</span>
            </button>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Arxivlangan kunlar", "Архивных дней", "Archived days")}</span>
              <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">{filteredArchivedDays.length} {formatDual("kun", "дн.", "days")}</strong>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">{formatDual("Jami baholangan taomlar", "Всего оцененных блюд", "Total evaluated meals")}</span>
              <strong className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {periodFilteredLogs.filter(l => l.mealName?.trim()).length} {formatDual("ta", "блюд", "meals")}
              </strong>
            </div>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-emerald-700 dark:text-emerald-400 block mb-1">{formatDual("Muvofiq (Ruxsat)", "Соответствует (Допуск)", "Approved (Cleared)")}</span>
              <strong className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">
                {periodFilteredLogs.filter(l => l.status === 'APPROVED' && l.mealName?.trim()).length} {formatDual("ta", "блюд", "meals")}
              </strong>
            </div>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
              <span className="text-rose-700 dark:text-rose-400 block mb-1">{formatDual("Rad etilgan (Yaroqsiz)", "Отклонено (Брак)", "Rejected (Defect)")}</span>
              <strong className="text-lg font-black text-rose-800 dark:text-rose-300 font-mono">
                {periodFilteredLogs.filter(l => l.status === 'REJECTED' && l.mealName?.trim()).length} {formatDual("ta", "блюд", "meals")}
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
                  <th className="p-3 text-center">{formatDual("Taomlar soni", "Количество блюд", "Meals count")}</th>
                  <th className="p-3 text-center">{formatDual("Muvofiq (Ruxsat)", "Соответствует (Допуск)", "Approved")}</th>
                  <th className="p-3 text-center">{formatDual("Rad etilgan", "Отклонено", "Rejected")}</th>
                  <th className="p-3 min-w-[150px]">{formatDual("Komissiya raisi", "Председатель комиссии", "Committee Chairman")}</th>
                  <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                  <th className="p-3 text-center w-48">{formatDual("Amallar", "Действия", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredArchivedDays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {loadingArchive ? formatDual("Arxiv yuklanmoqda...", "Архив загружается...", "Loading archive...") : formatDual("Arxivda yozuvlar mavjud emas", "В архиве нет записей", "No records in archive")}
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
                        <td className="p-3 text-center font-bold font-mono">{day.total} {formatDual("ta taom", "блюд", "meals")}</td>
                        <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ✓ {day.approved}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400 font-mono">
                          {day.rejected > 0 ? `✕ ${day.rejected}` : '0'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const ch = chairmen.find(c => c.name === day.chairmanSign)
                              return ch?.signatureUrl ? (
                                <img
                                  src={ch.signatureUrl}
                                  alt={day.chairmanSign}
                                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                  className="h-6 max-w-[70px] object-contain filter invert dark:invert-0 drop-shadow-xs"
                                />
                              ) : null
                            })()}
                            <span className="font-serif italic text-slate-700 dark:text-slate-300">{day.chairmanSign}</span>
                          </div>
                        </td>
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
                              title={formatDual("Ushbu kunlik jurnalni ko'rish va tahrirlash", "Просмотреть и редактировать дневной журнал", "View and edit daily journal")}
                            >
                              <Eye size={13} /> {formatDual("Ko'rish", "Просмотр", "View")}
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(`/api/kitchen/brakerage/export?date=${day.date}`, '_blank')}
                              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
                              title={formatDual("Ushbu kunni Excel eksport qilish", "Экспортировать день в Excel", "Export day to Excel")}
                            >
                              <Download size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterDate(day.date)
                                setViewMode('daily')
                                setTimeout(() => window.print(), 200)
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
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
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
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title={formatDual("Keyingi kun", "Следующий день", "Next day")}
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Quick Date Pills */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterDate(getTodayTashkent())}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    filterDate === getTodayTashkent()
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {formatDual("Bugun", "Сегодня", "Today")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() - 1)
                    setFilterDate(d.toISOString().slice(0, 10))
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    filterDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {formatDual("Kecha", "Вчера", "Yesterday")}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDate('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
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
                  placeholder={formatDual("Taom nomi bo'yicha qidirish...", "Поиск по названию блюда...", "Search by meal name...")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-48 sm:w-60 placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={() => fetchLogs(filterDate)}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title={formatDual("Yangilash", "Обновить", "Refresh")}
              >
                <RefreshCw size={14} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Counters */}
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                {formatDual("Jami taomlar:", "Всего блюд:", "Total meals:")} <strong className="text-slate-900 dark:text-white font-mono">{displayedMeals.filter(m => m.mealName.trim()).length} {formatDual("ta", "блюд", "meals")}</strong>
              </span>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
                {formatDual("✓ Ruxsat etilgan:", "✓ Допущено:", "✓ Approved:")} {displayedMeals.filter(m => m.mealName.trim() && m.status !== 'REJECTED').length}
              </span>
            </div>
          </div>

          {/* Main Table: Sequential Row-by-Row Spreadsheet (Boshqa jadvallar kabi) */}
          <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
            {loading && meals.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-slate-700 dark:text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
                  {formatDual("Brakeraj jurnali yuklanmoqda...", "Журнал бракеража загружается...", "Loading brakerage journal...")}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto print:border-none print:shadow-none print:rounded-none print:overflow-visible">
                <table className="w-full text-xs border-collapse print:text-[8pt] print:table-fixed print:w-full print:border-collapse">
                  <thead className="print:table-header-group">
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 print:bg-slate-100 print:text-black print:border-b-2 print:border-black">
                      <th className="p-2.5 text-center font-bold w-12 print:w-[3.5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("№", "№", "#")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">1</div>
                      </th>
                      <th className="p-2.5 text-center font-bold w-36 print:w-[9.5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Sana va vaqt", "Дата и время", "Date & Time")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">2</div>
                      </th>
                      <th className="p-2.5 text-left font-bold min-w-[200px] print:w-[18%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Baholangan taom nomi *", "Название блюда *", "Evaluated meal name *")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">3</div>
                      </th>
                      <th className="p-2.5 text-center font-bold w-28 print:w-[7.5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Harorat (°C)", "Температура (°C)", "Temperature (°C)")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">4</div>
                      </th>
                      <th className="p-2.5 text-left font-bold min-w-[240px] print:w-[23.5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Organoleptik baho (Rang, hid, ta'm, tuzum)", "Органолептическая оценка (Цвет, запах, вкус, консистенция)", "Organoleptic assessment (Color, smell, taste, texture)")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">5</div>
                      </th>
                      <th className="p-2.5 text-center font-bold w-44 print:w-[11%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Xulosa (Holati)", "Заключение (Статус)", "Conclusion (Status)")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">6</div>
                      </th>
                      <th className="p-2.5 text-left font-bold min-w-[180px] print:w-[11%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Izohlar", "Примечания", "Notes")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">7</div>
                      </th>
                      <th className="p-2.5 text-center font-bold min-w-[170px] w-48 print:w-[6%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{formatDual("Rais imzosi", "Подпись председателя", "Chairman Signature")}</span>
                          <Link
                            href="/settings?tab=chairmen"
                            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition no-print print:hidden"
                            title={formatDual("Raislar va imzolar sozlamalari", "Настройки председателей и подписей", "Chairmen & signatures settings")}
                          >
                            <Settings size={12} />
                          </Link>
                        </div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">8</div>
                      </th>
                      <th className="p-2.5 text-center font-bold min-w-[170px] w-48 print:w-[5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("Hamshira imzosi", "Подпись медсестры", "Nurse Signature")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">9</div>
                      </th>
                      <th className="p-2.5 text-center font-bold min-w-[130px] print:w-[5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                        <div>{formatDual("QC nazoratchi", "QC контролер", "QC Inspector")}</div>
                        <div className="text-[10px] print:text-[7pt] text-slate-500 dark:text-slate-400 print:text-slate-700 font-normal">10</div>
                      </th>
                      <th className="p-2.5 text-center font-bold w-24 no-print print:hidden">{formatDual("Amallar", "Действия", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMeals.length === 0 ? (
                      <>
                        <tr className="print:hidden">
                          <td colSpan={11} className="p-8 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <p className="font-medium text-sm">{formatDual("Ushbu sanada taom nazorati yozuvlari mavjud emas", "На эту дату записей контроля блюд нет", "No meal inspection records for this date")}</p>
                              <button
                                type="button"
                                onClick={handleAddNewRow}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                              >
                                <Plus size={14} /> {formatDual("Taom qo'shish", "Добавить блюдо", "Add meal")}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Print blank rows fallback (so printed sheet has clean writable lines) */}
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((rowNum) => (
                          <tr key={`blank-row-${rowNum}`} className="hidden print:table-row h-9 border-b border-black">
                            <td className="p-1 text-center font-mono text-[8pt] border-r border-black font-bold text-black">{rowNum}</td>
                            <td className="p-1 border-r border-black text-center font-mono text-[8pt] text-slate-700">{filterDate !== 'ALL' ? filterDate : ''}</td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                            <td className="p-1 border-r border-black"></td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      displayedMeals.map((meal, idx) => {
                        const isMealEmptyNew = meal._isNew && !meal.mealName.trim()
                        const mealChairman = chairmen.find(c => c.name === meal.chairmanSign) || chairmen.find(c => c.isDefault) || chairmen[0]
                        return (
                          <tr
                            key={meal.id ? `db-${meal.id}` : meal._clientKey || idx}
                            className={`border-b border-slate-200 dark:border-slate-800 print:border-black transition ${
                              meal._dirty
                                ? 'bg-amber-50/70 dark:bg-amber-950/20 print:bg-transparent'
                                : isMealEmptyNew
                                ? 'bg-slate-50/40 dark:bg-slate-900/40 print:bg-transparent'
                                : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 print:bg-transparent'
                            }`}
                          >
                            {/* 1. Tartib raqami */}
                            <td className="p-2 print:p-1 text-center font-mono font-bold text-slate-600 dark:text-slate-400 print:text-black border-r border-slate-300 dark:border-slate-700 print:border-black">
                              {idx + 1}
                            </td>

                            {/* 2. Sana va vaqt */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <div className="flex items-center gap-1 justify-center print:hidden">
                                <input
                                  type="date"
                                  value={meal.date}
                                  onChange={e => updateMealField(idx, { date: e.target.value })}
                                  className="w-24 px-1 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                                />
                                <input
                                  type="time"
                                  value={meal.prepTime}
                                  onChange={e => updateMealField(idx, { prepTime: e.target.value })}
                                  className="w-16 px-1 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                                />
                              </div>
                              <div className="hidden print:block text-center font-mono text-[8pt] text-black leading-tight">
                                <div>{meal.date}</div>
                                <div className="text-[7.5pt] text-slate-700 font-bold">{meal.prepTime || '09:00'}</div>
                              </div>
                            </td>

                            {/* 3. Baholangan taom nomi * */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <input
                                type="text"
                                required
                                value={meal.mealName}
                                onChange={e => updateMealField(idx, { mealName: e.target.value })}
                                placeholder={formatDual("Masalan: Makaron / Mastava / Salat...", "Например: Макароны / Мастава / Салат...", "For example: Pasta / Soup / Salad...")}
                                className="w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs text-slate-900 dark:text-white outline-none transition bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white shadow-2xs placeholder:text-slate-400 placeholder:font-normal print:hidden"
                              />
                              <div className="hidden print:block font-bold text-[8.5pt] text-black break-words leading-tight">
                                {meal.mealName || '-'}
                              </div>
                            </td>

                            {/* 4. Harorat (°C) */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <input
                                type="text"
                                value={meal.temperature}
                                onChange={e => updateMealField(idx, { temperature: e.target.value })}
                                placeholder="+85°C"
                                className="w-full text-center font-mono font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 print:hidden"
                              />
                              <div className="hidden print:block text-center font-mono font-bold text-[8.5pt] text-black">
                                {meal.temperature || '-'}
                              </div>
                            </td>

                            {/* 5. Organoleptik baho */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <div className="space-y-1 print:hidden">
                                <textarea
                                  rows={2}
                                  value={meal.organoleptic}
                                  onChange={e => updateMealField(idx, { organoleptic: e.target.value })}
                                  placeholder={formatDual("Tashqi ko'rinishi, ta'mi, hidi, tuzumi...", "Внешний вид, вкус, запах, консистенция...", "Appearance, taste, smell, texture...")}
                                  className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 leading-snug resize-y"
                                />
                                <div className="flex flex-wrap gap-1 no-print">
                                  <button
                                    type="button"
                                    onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[0] })}
                                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                    title={formatDual("Standart pishgan", "Стандартное приготовление", "Standard cooked")}
                                  >
                                    {formatDual("+ Pishgan", "+ Готовое", "+ Cooked")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[1] })}
                                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                    title={formatDual("Go'shtli taom", "Мясное блюдо", "Meat dish")}
                                  >
                                    {formatDual("+ Go'shtli", "+ Мясное", "+ Meat")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[2] })}
                                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
                                    title={formatDual("Yangi sabzavot", "Свежие овощи", "Fresh vegetables")}
                                  >
                                    {formatDual("+ Yangi", "+ Свежее", "+ Fresh")}
                                  </button>
                                </div>
                              </div>
                              <div className="hidden print:block text-[8pt] text-black leading-snug break-words">
                                {meal.organoleptic || '-'}
                              </div>
                            </td>

                            {/* 6. Xulosa (Holati) */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <select
                                value={meal.status}
                                onChange={e => updateMealField(idx, { status: e.target.value as any })}
                                className={`w-full px-2 py-1.5 rounded-lg border font-bold text-xs outline-none cursor-pointer print:hidden ${
                                  meal.status === 'REJECTED'
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                <option value="APPROVED">{formatDual("✓ Ruxsat etiladi", "✓ Допущено к употреблению", "✓ Approved")}</option>
                                <option value="REJECTED">{formatDual("✕ Rad etildi", "✕ Отклонено", "✕ Rejected")}</option>
                              </select>
                              <div className="hidden print:block text-center font-bold text-[8pt] text-black">
                                {meal.status === 'REJECTED' ? formatDual("✕ Rad etildi", "✕ Отклонено", "✕ Rejected") : formatDual("✓ Ruxsat etiladi", "✓ Допущено", "✓ Approved")}
                              </div>
                            </td>

                            {/* 7. Izohlar */}
                            <td className="p-1.5 print:p-1 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <input
                                type="text"
                                value={meal.notes}
                                onChange={e => updateMealField(idx, { notes: e.target.value })}
                                placeholder={formatDual("Yaxshi, iste'molga ruxsat etiladi.", "Хорошо, допущено к употреблению.", "Good, approved for consumption.")}
                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 print:hidden"
                              />
                              <div className="hidden print:block text-[8pt] text-slate-800 break-words leading-tight">
                                {meal.notes || '-'}
                              </div>
                            </td>

                            {/* 8. Rais imzosi va rais tanlovi */}
                            <td className="p-1.5 print:p-1 min-w-[170px] w-48 print:w-[6%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <div className="flex flex-col items-center justify-center gap-1 print:hidden">
                                {mealChairman?.signatureUrl ? (
                                  <div className="h-9 max-h-9 flex items-center justify-center overflow-hidden py-0.5">
                                    <img
                                      src={mealChairman.signatureUrl}
                                      alt={mealChairman.name}
                                      onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                      className="max-h-9 max-w-[130px] object-contain filter invert dark:invert-0 drop-shadow-xs"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-[11px] font-serif italic font-bold text-slate-700 dark:text-slate-300 py-1">
                                    {meal.chairmanSign || 'Иминов С.М.'}
                                  </div>
                                )}

                                <select
                                  value={meal.chairmanSign || mealChairman?.name || ''}
                                  onChange={e => updateMealField(idx, { chairmanSign: e.target.value })}
                                  className="w-full text-center font-bold text-[11px] py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer hover:border-slate-400 transition shadow-2xs"
                                  title={formatDual("Komissiya raisini tanlash", "Выбрать председателя комиссии", "Select committee chairman")}
                                >
                                  {chairmen.map(ch => (
                                    <option key={ch.id || ch.name} value={ch.name}>
                                      {ch.name} {ch.role ? `(${ch.role})` : ''}
                                    </option>
                                  ))}
                                  {meal.chairmanSign && !chairmen.some(c => c.name === meal.chairmanSign) && (
                                    <option value={meal.chairmanSign}>{meal.chairmanSign}</option>
                                  )}
                                </select>
                              </div>
                              {/* Print signature representation */}
                              <div className="hidden print:flex flex-col items-center justify-center text-center leading-tight">
                                {mealChairman?.signatureUrl && (
                                  <img
                                    src={mealChairman.signatureUrl}
                                    alt={mealChairman.name}
                                    onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                    className="max-h-7 max-w-[65px] object-contain mb-0.5"
                                  />
                                )}
                                <span className="font-serif italic text-[7.5pt] text-black">
                                  {meal.chairmanSign || mealChairman?.name || DEFAULT_COMMITTEE.chairman}
                                </span>
                              </div>
                            </td>

                            {/* 9. Hamshira imzosi */}
                            <td className="p-1.5 print:p-1 min-w-[170px] w-48 print:w-[5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <input
                                type="text"
                                value={meal.medicalStaffSign}
                                onChange={e => updateMealField(idx, { medicalStaffSign: e.target.value })}
                                placeholder="Жуманова Ч.Э."
                                className="w-full text-center font-serif italic font-bold px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 whitespace-nowrap print:hidden"
                              />
                              <div className="hidden print:block text-center font-serif italic text-[7.5pt] text-black break-words leading-tight">
                                {meal.medicalStaffSign || DEFAULT_COMMITTEE.medicalStaff}
                              </div>
                            </td>

                            {/* 10. QC nazoratchi */}
                            <td className="p-1.5 print:p-1 min-w-[130px] print:w-[5%] print:min-w-0 border-r border-slate-300 dark:border-slate-700 print:border-black">
                              <input
                                type="text"
                                value={meal.qcInspectorSign}
                                onChange={e => updateMealField(idx, { qcInspectorSign: e.target.value })}
                                placeholder="Камбарова А.М."
                                className="w-full text-center font-serif italic px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 print:hidden"
                              />
                              <div className="hidden print:block text-center font-serif italic text-[7.5pt] text-black break-words leading-tight">
                                {meal.qcInspectorSign || DEFAULT_COMMITTEE.qcInspector}
                              </div>
                            </td>

                            {/* 11. Amallar */}
                            <td className="p-1.5 text-center no-print print:hidden">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveMeal(meal, idx)}
                                  disabled={meal._saving || (!meal._dirty && !meal._isNew)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    meal._dirty
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                                      : meal.id
                                      ? 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                  title={meal.id ? formatDual("O'zgarishlarni saqlash", "Сохранить изменения", "Save changes") : formatDual("Taomni saqlash", "Сохранить блюдо", "Save meal")}
                                >
                                  {meal._saving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : meal._dirty ? (
                                    <Save size={14} />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMeal(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
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
            )}
          </div>
        </div>
      )}

      {/* Official Print Committee Signature Block */}
      <div className="hidden print:block mt-6 pt-3 border-t-2 border-black text-[8.5pt] text-black">
        <div className="font-bold uppercase tracking-wider mb-3 text-center text-[9pt]">
          {formatDual(
            "Brakeraj komissiyasi a'zolari imzolari:",
            "Подписи членов бракеражной комиссии:",
            "Signatures of Brakerage Committee Members:"
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="font-bold text-[8pt]">{formatDual("Komissiya Raisi (Direktor):", "Председатель комиссии (Директор):", "Committee Chairman (Director):")}</span>
            <div className="h-10 flex items-center justify-center my-1">
              {activeChairman?.signatureUrl ? (
                <img
                  src={activeChairman.signatureUrl}
                  alt={activeChairman.name}
                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                  className="max-h-9 max-w-[100px] object-contain"
                />
              ) : (
                <span className="text-[7.5pt] text-slate-400 italic">(imzo)</span>
              )}
            </div>
            <div className="border-t border-black w-full pt-1 font-serif italic text-[8pt]">
              {activeChairman?.name || DEFAULT_COMMITTEE.chairman}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-[8pt]">{formatDual("Komissiya a'zosi:", "Член комиссии:", "Committee Member:")}</span>
            <div className="h-10 flex items-center justify-center my-1">
              <span className="text-[7.5pt] text-slate-400 italic">(imzo)</span>
            </div>
            <div className="border-t border-black w-full pt-1 font-serif italic text-[8pt]">
              {DEFAULT_COMMITTEE.member1}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-[8pt]">{formatDual("QC Nazoratchi:", "QC Контролер:", "QC Inspector:")}</span>
            <div className="h-10 flex items-center justify-center my-1">
              <span className="text-[7.5pt] text-slate-400 italic">(imzo)</span>
            </div>
            <div className="border-t border-black w-full pt-1 font-serif italic text-[8pt]">
              {DEFAULT_COMMITTEE.qcInspector}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold text-[8pt]">{formatDual("Hamshira (Tibbiy xodim):", "Медсестра:", "Nurse:")}</span>
            <div className="h-10 flex items-center justify-center my-1">
              <span className="text-[7.5pt] text-slate-400 italic">(imzo)</span>
            </div>
            <div className="border-t border-black w-full pt-1 font-serif italic text-[8pt]">
              {DEFAULT_COMMITTEE.medicalStaff}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-[7.5pt] text-slate-600">
          <span>{formatDual("Hujjat SanPiN № 0027-20 me'yoriy talablari bo'yicha shakllantirildi", "Документ сформирован по требованиям СанПиН № 0027-20", "Generated according to SanPiN No. 0027-20")}</span>
          <span>{formatDual("Chop etilgan sana:", "Дата печати:", "Print date:")} {new Date().toLocaleDateString('uz-UZ')}</span>
        </div>
      </div>

      {/* Screen Footer Info & Committee Signatures */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 no-print print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            {formatDual("Brakeraj komissiyasi:", "Бракеражная комиссия:", "Brakerage committee:")} <strong>{formatDual("Rais:", "Председатель:", "Chairman:")} {activeChairman?.name || DEFAULT_COMMITTEE.chairman}</strong> ({activeChairman?.role ? (activeChairman.role === 'Директор' ? formatDual("Direktor", "Директор", "Director") : activeChairman.role) : formatDual("Direktor", "Директор", "Director")}) • {formatDual("A'zolar:", "Члены:", "Members:")} {DEFAULT_COMMITTEE.member1}, {DEFAULT_COMMITTEE.member2} • QC: {DEFAULT_COMMITTEE.qcInspector} • {formatDual("Hamshira:", "Медсестра:", "Nurse:")} {DEFAULT_COMMITTEE.medicalStaff}
          </span>
          {activeChairman?.signatureUrl && (
            <img
              src={activeChairman.signatureUrl}
              alt="Chairman Signature"
              onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
              className="h-6 max-w-[80px] object-contain filter invert dark:invert-0 drop-shadow-xs inline-block ml-1"
            />
          )}
        </div>
        {!isFullPage && onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition ml-auto cursor-pointer"
          >
            {formatDual("Yopish", "Закрыть", "Close")}
          </button>
        )}
      </div>

      {/* Official SanPiN Audit Act Modal (5 Signatures) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-enter no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-6">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                СанПиН 0027-20 / Расмий Аудит Далолатномаси
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  <Printer size={14} /> Chop etish (Print)
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="space-y-6 text-slate-900 dark:text-slate-100 font-serif">
              {/* Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900 dark:border-slate-100">
                <h4 className="text-sm font-bold tracking-wider font-sans uppercase">ЎЗБЕКИСТОН РЕСПУБЛИКАСИ СОҒЛИҚНИ САҚЛАШ ВАЗИРЛИГИ</h4>
                <h3 className="text-base sm:text-lg font-black uppercase font-sans">ООО "GREEN PROCESSING" ТАШКИЛОТИ</h3>
                <h2 className="text-lg sm:text-xl font-black mt-2 underline">
                  ОШХОНА ТАОМЛАРИ СИФАТИ ВА СУТКАЛИК СИНАМАЛАРНИНГ {auditPeriod === 'DAILY' ? 'КУНЛИК' : auditPeriod === 'WEEKLY' ? 'ҲАФТАЛИК' : auditPeriod === 'MONTHLY' ? 'ОЙЛИК' : auditPeriod === 'YEARLY' ? 'ЙИЛЛИК' : 'УМУМИЙ'} АУДИТ ДАЛОЛАТНОМАСИ
                </h2>
                <p className="text-xs italic font-sans text-slate-600 dark:text-slate-400">
                  Сана: {getTodayTashkent()} • Аудит қамрови: {auditPeriod === 'DAILY' ? 'Бугунги кун' : auditPeriod === 'WEEKLY' ? 'Охирги 7 кунлик' : auditPeriod === 'MONTHLY' ? 'Жорий ой' : auditPeriod === 'YEARLY' ? '2026 йил' : 'Барча даврлар'}
                </p>
              </div>

              {/* Statement */}
              <div className="text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  Бизлар, қуйида имзо чекувчи комиссия аъзолари: Комиссия раиси <strong>{activeChairman?.name || DEFAULT_COMMITTEE.chairman}</strong> (Директор), Сифат назоратчиси <strong>{DEFAULT_COMMITTEE.qcInspector}</strong>, комиссия аъзолари <strong>{DEFAULT_COMMITTEE.member1}</strong>, <strong>{DEFAULT_COMMITTEE.member2}</strong> ҳамда Ҳамшира (Синама олувчи) <strong>{DEFAULT_COMMITTEE.medicalStaff}</strong> ушбу далолатномани туздик шу ҳақдаким, корхона ошхонасида СанПиН талаблари асосида тайёрланган таомларнинг органолептик сифати, тайёрлаш ҳарорати ҳамда 48 соатлик суткалик синамалар ҳолати аудити ўтказилди.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-sans text-xs">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
                  <span className="text-slate-500 block mb-1">Аудит кунлари</span>
                  <strong className="text-base font-black text-slate-900 dark:text-white font-mono">{filteredArchivedDays.length} кун</strong>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
                  <span className="text-slate-500 block mb-1">Жами баҳоланган таомлар</span>
                  <strong className="text-base font-black text-slate-900 dark:text-white font-mono">{periodFilteredLogs.filter(l => l.mealName?.trim()).length} та</strong>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1">Мувофиқ (Рухсат)</span>
                  <strong className="text-base font-black text-emerald-800 dark:text-emerald-300 font-mono">
                    {periodFilteredLogs.filter(l => l.status === 'APPROVED' && l.mealName?.trim()).length} та
                  </strong>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800">
                  <span className="text-rose-700 dark:text-rose-400 block mb-1">Рад этилган (Брак)</span>
                  <strong className="text-base font-black text-rose-800 dark:text-rose-300 font-mono">
                    {periodFilteredLogs.filter(l => l.status === 'REJECTED' && l.mealName?.trim()).length} та
                  </strong>
                </div>
              </div>

              {/* Summary Conclusion */}
              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm">
                <strong>КОМИССИЯ ХУЛОСАСИ:</strong> Текширилган таомларнинг ташқи кўриниши, ҳиди, таъми ва консистенцияси белгиланган санитария талаблари ва рецептурага тўлиқ мос келади. Ҳарорат меъёрлари сақланган (+80°C...+85°C). Тайёр таомлардан суткалик стерил синамалар олиниб, махсус совутгичда сақланмоқда. Истеъмолга тўлиқ рухсат этилади.
              </div>

              {/* The 5 Official Signatures */}
              <div className="pt-6 border-t border-slate-300 dark:border-slate-700 font-sans">
                <h4 className="text-xs font-black uppercase tracking-wider mb-4 text-center">
                  КОМИССИЯ АЪЗОЛАРИНИНГ РАСМИЙ ИМЗОЛАРИ:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* 1. Rais */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">1. Комиссия раиси (Директор)</span>
                      <strong className="text-slate-900 dark:text-white">{activeChairman?.name || DEFAULT_COMMITTEE.chairman}</strong>
                    </div>
                    <div className="text-right">
                      {activeChairman?.signatureUrl ? (
                        <img
                          src={activeChairman.signatureUrl}
                          alt="Signature"
                          className="h-8 max-w-[90px] object-contain filter invert dark:invert-0 inline-block"
                        />
                      ) : (
                        <span className="font-serif italic text-blue-600 font-bold border-b border-dotted border-blue-500 pb-0.5">Иминов С.М. (Имзо)</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Sifat Nazoratchisi */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">2. Сифат назоратчиси (QC)</span>
                      <strong className="text-slate-900 dark:text-white">{DEFAULT_COMMITTEE.qcInspector}</strong>
                    </div>
                    <div className="text-right">
                      <span className="font-serif italic text-blue-600 font-bold border-b border-dotted border-blue-500 pb-0.5">Камбарова А.М. (Имзо)</span>
                    </div>
                  </div>

                  {/* 3. 1-komissiya a'zosi */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">3. Комиссия аъзоси</span>
                      <strong className="text-slate-900 dark:text-white">{DEFAULT_COMMITTEE.member1}</strong>
                    </div>
                    <div className="text-right">
                      <span className="font-serif italic text-blue-600 font-bold border-b border-dotted border-blue-500 pb-0.5">Зимина Л.Г. (Имзо)</span>
                    </div>
                  </div>

                  {/* 4. 2-komissiya a'zosi */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">4. Комиссия аъзоси</span>
                      <strong className="text-slate-900 dark:text-white">{DEFAULT_COMMITTEE.member2}</strong>
                    </div>
                    <div className="text-right">
                      <span className="font-serif italic text-blue-600 font-bold border-b border-dotted border-blue-500 pb-0.5">Расулов А.А. (Имзо)</span>
                    </div>
                  </div>

                  {/* 5. Hamshira / Sinama Oluvchi */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between sm:col-span-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">5. Ҳамшира / Синама олувчи</span>
                      <strong className="text-slate-900 dark:text-white">{DEFAULT_COMMITTEE.medicalStaff}</strong>
                    </div>
                    <div className="text-right">
                      <span className="font-serif italic text-blue-600 font-bold border-b border-dotted border-blue-500 pb-0.5">Жуманова Ч.Э. (Имзо)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* M.P. Stamp note */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-sans">
                <div>М.П. (Муҳр ўрни)</div>
                <div>Ҳужжат рақами: #GP-SANPIN-AUDIT-{auditPeriod}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

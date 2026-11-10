'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Save
} from 'lucide-react'
import { toast } from 'sonner'

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
  _dirty: false,
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
  const [meals, setMeals] = useState<BrakerageMeal[]>([])
  const [loading, setLoading] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)

  // Fetch from DB
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

        // Kirim-chiqim kabi: Har doim oxirida 1 ta tayyor yangi qator/ustun turadi
        if (dateVal !== 'ALL') {
          const hasEmpty = mapped.some(m => m._isNew && !m.mealName.trim())
          if (!hasEmpty) {
            mapped.push(createEmptyMeal(dateVal, mapped.length + 1))
          }
        }
        setMeals(mapped)
      } else {
        toast.error(data.error || "Маълумотларни юклаб бўлмади")
      }
    } catch {
      toast.error('Сервер билан алоқа узилди')
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

  // Update specific meal field directly in state
  const updateMealField = (idx: number, patch: Partial<BrakerageMeal>) => {
    setMeals(prev => {
      const next = [...prev]
      const cur = next[idx]
      if (!cur) return prev
      const updated = { ...cur, ...patch, _dirty: true }
      next[idx] = updated

      // Kirim-chiqim kabi: Agar yangi ustunga taom nomi yozilsa, keyingi bo'sh ustunni avtomatik tayyorlab qo'yadi
      if (updated._isNew && updated.mealName.trim() && idx === next.length - 1 && filterDate !== 'ALL') {
        const nextOrder = next.length + 1
        next.push(createEmptyMeal(filterDate, nextOrder))
      }
      return next
    })
  }

  // Save a single meal column
  const handleSaveMeal = async (meal: BrakerageMeal, idx: number) => {
    if (!meal.mealName.trim()) {
      toast.error("Илтимос, таом номини киритинг!")
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
        toast.success(isUpdate ? "Таом маълумотлари сақланди" : `№${meal.orderNumber} "${meal.mealName}" сақланди`)
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
        toast.error(result.error || "Сақлашда хатолик юз берди")
        setMeals(prev => {
          const copy = [...prev]
          if (copy[idx]) copy[idx] = { ...copy[idx], _saving: false }
          return copy
        })
      }
    } catch {
      toast.error("Сервер билан алоқа хатоси")
      setMeals(prev => {
        const copy = [...prev]
        if (copy[idx]) copy[idx] = { ...copy[idx], _saving: false }
        return copy
      })
    }
  }

  // Save all modified/new meals
  const handleSaveAll = async () => {
    const dirtyMeals = meals.map((m, idx) => ({ m, idx })).filter(item => item.m._dirty && item.m.mealName.trim())
    if (dirtyMeals.length === 0) {
      toast.info("Ўзгаришлар йўқ, барчаси сақланган")
      return
    }

    setSavingAll(true)
    let savedCount = 0
    for (const item of dirtyMeals) {
      await handleSaveMeal(item.m, item.idx)
      savedCount++
    }
    setSavingAll(false)
    toast.success(`${savedCount} та таом маълумотлари муваффақиятли сақланди`)
  }

  // Delete a meal
  const handleDeleteMeal = async (idx: number) => {
    const meal = meals[idx]
    if (!meal) return

    // If it's just an unsaved empty column, clear it
    if (meal._isNew && !meal.mealName.trim()) {
      return
    }

    if (!confirm(`"${meal.mealName || 'Таом'}" ёзувини ўчирмоқчимисиз?`)) return

    if (meal.id) {
      try {
        const res = await fetch(`/api/kitchen/brakerage?id=${meal.id}`, { method: 'DELETE' })
        const result = await res.json()
        if (!result.success) {
          toast.error(result.error || "Ўчиришда хатолик")
          return
        }
        toast.success("Таом журналидан ўчирилди")
      } catch {
        toast.error("Сервер хатоси")
        return
      }
    }

    setMeals(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0 && filterDate !== 'ALL') {
        next.push(createEmptyMeal(filterDate, 1))
      }
      return next
    })
  }

  // Add explicit new column
  const handleAddNewColumn = () => {
    setMeals(prev => {
      const next = [...prev]
      next.push(createEmptyMeal(filterDate !== 'ALL' ? filterDate : getTodayTashkent(), next.length + 1))
      return next
    })
  }

  // Export Excel
  const handleExportExcel = () => {
    window.open(`/api/kitchen/brakerage/export?date=${filterDate || 'ALL'}`, '_blank')
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  if (!isFullPage && !isOpen) return null

  // The 12 official SanPiN parameters rendered as direct inputs
  const PARAMETER_CONFIG = [
    {
      no: 1,
      label: 'Сана (Sana)',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="date"
          value={m.date}
          onChange={e => updateMealField(idx, { date: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700 dark:focus:border-slate-400"
        />
      )
    },
    {
      no: 2,
      label: '№ (Тартиб рақами)',
      renderCell: (m: BrakerageMeal) => (
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-black text-xs flex items-center justify-center shadow-xs">
            {m.orderNumber}
          </span>
          {m._isNew && (
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              Янги
            </span>
          )}
        </div>
      )
    },
    {
      no: 3,
      label: 'Баҳоланган таом, маҳсулот номи *',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <div>
          <input
            type="text"
            required
            value={m.mealName}
            onChange={e => updateMealField(idx, { mealName: e.target.value })}
            placeholder="Масалан: Макарон / Мастава / Салат..."
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 font-black text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>
      )
    },
    {
      no: 4,
      label: 'Тайёрлаш вақти',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="time"
          value={m.prepTime}
          onChange={e => updateMealField(idx, { prepTime: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 5,
      label: 'Комиссия раиси имзоси',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="text"
          value={m.chairmanSign}
          onChange={e => updateMealField(idx, { chairmanSign: e.target.value })}
          placeholder="Раис имзоси"
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 6,
      label: 'Комиссия аъзоси 1 имзоси',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="text"
          value={m.member1Sign}
          onChange={e => updateMealField(idx, { member1Sign: e.target.value })}
          placeholder="Аъзо 1"
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 7,
      label: 'Комиссия аъзоси 2 имзоси',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="text"
          value={m.member2Sign}
          onChange={e => updateMealField(idx, { member2Sign: e.target.value })}
          placeholder="Аъзо 2"
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 8,
      label: 'Сифат назоратчиси имзоси',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="text"
          value={m.qcInspectorSign}
          onChange={e => updateMealField(idx, { qcInspectorSign: e.target.value })}
          placeholder="QC назоратчи"
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 9,
      label: 'Тиббий ходим имзоси',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <input
          type="text"
          value={m.medicalStaffSign}
          onChange={e => updateMealField(idx, { medicalStaffSign: e.target.value })}
          placeholder="Тиббий ходим"
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
        />
      )
    },
    {
      no: 10,
      label: 'Таомнинг кўриниши (Ранг, ҳид, таъм, тузум)',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <div className="space-y-1.5">
          <textarea
            rows={3}
            value={m.organoleptic}
            onChange={e => updateMealField(idx, { organoleptic: e.target.value })}
            placeholder="Ташқи кўриниши, таъми, ҳиди, тузуми..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700 dark:focus:border-slate-400 leading-snug resize-y"
          />
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 no-print">
            <button
              type="button"
              onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[0] })}
              className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              title="Стандарт пишган"
            >
              + Пишган
            </button>
            <button
              type="button"
              onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[1] })}
              className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              title="Гўштли"
            >
              + Гўштли
            </button>
            <button
              type="button"
              onClick={() => updateMealField(idx, { organoleptic: QUICK_ORGANOLEPTIC[2] })}
              className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              title="Янги сабзавот"
            >
              + Янги
            </button>
          </div>
        </div>
      )
    },
    {
      no: 11,
      label: 'Ҳарорат (°C)',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <div className="flex items-center gap-1.5">
          <Thermometer size={16} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={m.temperature}
            onChange={e => updateMealField(idx, { temperature: e.target.value })}
            placeholder="+85°C"
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-slate-700"
          />
        </div>
      )
    },
    {
      no: 12,
      label: 'Изоҳлар (Хулоса)',
      renderCell: (m: BrakerageMeal, idx: number) => (
        <div className="space-y-1.5">
          <select
            value={m.status}
            onChange={e => updateMealField(idx, { status: e.target.value as any })}
            className={`w-full font-bold text-xs rounded-lg p-2 border outline-none cursor-pointer transition ${
              m.status === 'REJECTED'
                ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            }`}
          >
            <option value="APPROVED">✓ Рухсат этилади (Мувофиқ)</option>
            <option value="REJECTED">✕ Рад этилди (Яроқсиз)</option>
          </select>
          <input
            type="text"
            value={m.notes}
            onChange={e => updateMealField(idx, { notes: e.target.value })}
            placeholder="Изоҳ (масалан: Яхши, истеъмолга рухсат этилади.)"
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-slate-700"
          />
        </div>
      )
    }
  ]

  const hasUnsavedChanges = meals.some(m => m._dirty && m.mealName.trim())

  return (
    <div
      className={`bg-white dark:bg-slate-900 ${
        isFullPage
          ? 'w-full rounded-3xl shadow-sm border border-slate-300 dark:border-slate-800 flex flex-col text-slate-900 dark:text-white'
          : 'rounded-3xl w-full max-w-7xl shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-800 flex flex-col max-h-[94vh] my-auto text-slate-900 dark:text-white'
      } overflow-hidden`}
      onClick={e => e.stopPropagation()}
    >
      {/* Top Header - Calm, clinical, high contrast slate styling */}
      <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs">
            <Utensils size={24} className="text-slate-800 dark:text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                СанПиН Журнали
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Бракераж ва Таомлар Назорати
              </span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              ТАЙЁР МАҲСУЛОТЛАРНИ НАЗОРАТ ҚИЛИШ ЖУРНАЛИ
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Quick add column */}
          <button
            type="button"
            onClick={handleAddNewColumn}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Янги Таом Қўшиш</span>
          </button>

          {/* Master Save All */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll || !hasUnsavedChanges}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
            title="Барча киритилган таомларни сақлаш"
          >
            {savingAll ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{savingAll ? "Сақланмоқда..." : "Барчасини Сақлаш"}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
            title="Excel шаклида юклаб олиш"
          >
            <Download size={15} />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
            title="A4 форматда чоп этиш"
          >
            <Printer size={15} />
            <span>Чоп этиш</span>
          </button>

          {!isFullPage && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition ml-1 cursor-pointer"
              title="Ёпиш"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker + Stepper */}
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

          {/* Quick Date Pills: Only real dates (NO DEMO SAMPLES) */}
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
              onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() - 1)
                setFilterDate(d.toISOString().slice(0, 10))
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Кеча
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
              Барчаси
            </button>
          </div>

          <button
            onClick={() => fetchLogs(filterDate)}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Янгилаш"
          >
            <RefreshCw size={14} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-medium">
          <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
            Жами таомлар: <strong className="text-slate-900 dark:text-white font-mono">{meals.filter(m => m.mealName.trim()).length} та</strong>
          </span>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
            ✓ Рухсат этилган: {meals.filter(m => m.mealName.trim() && m.status !== 'REJECTED').length}
          </span>
        </div>
      </div>

      {/* Main Table: Direct Inline Inputs (Huddi Kirim-Chiqim kabi) */}
      <div className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100/60 dark:bg-slate-950">
        {loading && meals.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-slate-700 dark:text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
              Бракераж журнали юкланмоқда...
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Table Title Row */}
                <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700">
                  <th
                    colSpan={2 + meals.length}
                    className="p-3 text-center text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white"
                  >
                    ТАЙЁР МАҲСУЛОТЛАРНИ НАЗОРАТ ҚИЛИШ ДЖУРНАЛИ
                  </th>
                </tr>
                {/* Column Headers: №, Parameter label, and each Meal Column with Save/Delete actions */}
                <tr className="bg-slate-50 dark:bg-slate-850 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <th className="p-3 text-center font-bold w-12 border-r border-slate-300 dark:border-slate-700">№</th>
                  <th className="p-3 text-left font-bold w-72 min-w-[240px] border-r border-slate-300 dark:border-slate-700">
                    Текшириладиган кўрсаткичлар / Параметрлар
                  </th>
                  {meals.map((meal, idx) => (
                    <th
                      key={meal._clientKey || idx}
                      className="p-3 text-center font-bold min-w-[280px] max-w-[340px] border-r border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-black flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold truncate max-w-[140px]">
                            {meal.mealName.trim() || `(Таом #${idx + 1})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 no-print">
                          {/* Save button for this column */}
                          <button
                            type="button"
                            onClick={() => handleSaveMeal(meal, idx)}
                            disabled={meal._saving || (!meal._dirty && !meal._isNew)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                              meal._dirty
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                                : meal.id
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                            }`}
                            title={meal.id ? "Ўзгаришларни сақлаш" : "Таомни сақлаш"}
                          >
                            {meal._saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : meal._dirty ? (
                              <Save size={13} />
                            ) : (
                              <Check size={13} />
                            )}
                            <span>{meal._saving ? "..." : meal._dirty ? "Сақлаш" : "Сақланган"}</span>
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(idx)}
                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Таомни ўчириш"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PARAMETER_CONFIG.map((row, rIdx) => (
                  <tr
                    key={row.no}
                    className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition ${
                      rIdx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    {/* Col 1: Parameter number */}
                    <td className="p-2.5 text-center font-mono font-bold text-slate-500 border-r border-slate-300 dark:border-slate-700">
                      {row.no}
                    </td>
                    {/* Col 2: Parameter label */}
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700">
                      {row.label}
                    </td>
                    {/* Meal columns with direct inputs */}
                    {meals.map((meal, mIdx) => (
                      <td
                        key={meal._clientKey || mIdx}
                        className="p-2.5 border-r border-slate-300 dark:border-slate-700 align-top"
                      >
                        {row.renderCell(meal, mIdx)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info & Committee Signatures */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Бракераж комиссияси: <strong>Раис: {DEFAULT_COMMITTEE.chairman}</strong> • Аъзолар: {DEFAULT_COMMITTEE.member1}, {DEFAULT_COMMITTEE.member2} • QC: {DEFAULT_COMMITTEE.qcInspector} • Ҳамшира: {DEFAULT_COMMITTEE.medicalStaff}
          </span>
        </div>
        {!isFullPage && onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition ml-auto cursor-pointer"
          >
            Ёпиш
          </button>
        )}
      </div>
    </div>
  )
}

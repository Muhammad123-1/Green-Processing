'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Save,
  Upload,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Trash2,
  X,
  Lock,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Filter,
  ChefHat,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  PackageCheck,
  Scale,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { checkEditPermission, getTodayTashkent, isAfterShiftHours } from '@/lib/auditRules'
import {
  EXPENSE_FIELDS,
  readExpenseRow,
  formatDMY,
  formatLongDate,
  isDateStr,
  toNum
} from '@/lib/shopReport'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'
import AdminImportModal from '@/components/common/AdminImportModal'
import { SignatureCell, useWarehouseSignature } from './SignatureCell'

interface RashodContentProps {
  userRole?: string
  userName?: string
}

const todayStr = () => getTodayTashkent()

export default function RashodContent({ userRole, userName }: RashodContentProps) {
  const { lang, formatDual } = useLanguage()
  const signature = useWarehouseSignature()
  const isAdmin = userRole === 'ADMIN'
  const isReadOnly = (userRole || '').toUpperCase() === 'SUPPLY'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savingExpenses, setSavingExpenses] = useState(false)

  // DB Expenses data
  const [expenses, setExpenses] = useState<any[]>([])

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Section switcher: Production vs Kitchen
  const [activeSection, setActiveSection] = useState<'production' | 'kitchen'>('production')

  // Production table columns without kitchen (User requested to remove kitchen from production table)
  const PRODUCTION_EXPENSE_FIELDS = useMemo(
    () => EXPENSE_FIELDS.filter((f) => f.field !== 'kitchen'),
    []
  )

  // Kitchen Outbound states
  const [kitchenTransfers, setKitchenTransfers] = useState<any[]>([])
  const [kitchenLoading, setKitchenLoading] = useState(false)
  const [kitchenSearch, setKitchenSearch] = useState('')
  const [kitchenDateFilter, setKitchenDateFilter] = useState('')
  const [showKitchenModal, setShowKitchenModal] = useState(false)
  const [savingKitchenTransfer, setSavingKitchenTransfer] = useState(false)
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([])

  const [kitchenForm, setKitchenForm] = useState({
    date: todayStr(),
    productId: '',
    issuedQuantity: '',
    issuedUnit: 'kg',
    receiverName: 'Bosh oshpaz',
    notes: '',
  })

  // Date format toggle
  const [dateFormatMode, setDateFormatMode] = useState<'short' | 'long'>('short')

  // Edit Reason Modal
  const [editReasonModal, setEditReasonModal] = useState<{
    open: boolean
    dirtyItemsCount: number
    itemsSummary: string[]
    reason: string
    onConfirm?: (reason: string) => void
  }>({
    open: false,
    dirtyItemsCount: 0,
    itemsSummary: [],
    reason: '',
  })

  // Automatically discover available months from data
  const availableMonths = useMemo(() => {
    const s = new Set<string>()
    expenses.forEach((e) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        s.add(e.date.slice(0, 7))
      }
    })
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [expenses])

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/shop-report', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Ma'lumotlarni yuklashda xatolik")

      const mapped = (data.expenses || []).map((e: any) => readExpenseRow(e))
      const today = getTodayTashkent()

      // Auto-ensure today's daily checklist row is available at top
      if (!mapped.some((e: any) => e.date === today)) {
        mapped.unshift(blankExpense(today))
      }

      setExpenses(mapped)
    } catch (e: any) {
      toast.error(e?.message || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Har kuni sanani avtomatik yangilab borish (kun almashganda avtomatik yangi kunga o'tish)
  useEffect(() => {
    let lastDate = getTodayTashkent()
    const checkDay = () => {
      const nowToday = getTodayTashkent()
      if (nowToday !== lastDate) {
        lastDate = nowToday
        loadData()
      }
    }

    const interval = setInterval(checkDay, 30000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDay()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadData])

  const blankExpense = (date: string) => {
    const row: Record<string, any> = { date, _dirty: true, _new: true }
    EXPENSE_FIELDS.forEach((f) => (row[f.field] = ''))
    return row
  }

  const updateExpense = (idx: number, patch: any) => {
    if (isReadOnly) return
    const row = expenses[idx]
    if (!row) return
    if (!row._new) {
      const perm = checkEditPermission({ role: userRole, createdAt: row.createdAt })
      if (!perm.allowed) {
        toast.error(perm.reason || "Ushbu yozuvni o'zgartirish huquqi yo'q!")
        return
      }
    }
    setExpenses((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)))
  }

  const addExpense = () => {
    if (isReadOnly) return
    setExpenses((prev) => [blankExpense(dateFilter || todayStr()), ...prev])
  }

  const removeNewExpense = (idx: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDeleteExistingExpense = async (date: string) => {
    if (!isAdmin) {
      toast.error(lang === 'ru' ? 'Удаление разрешено только Администратору' : "O'chirish faqat Administratorga ruxsat etilgan!")
      return
    }
    if (!confirm(lang === 'ru' ? `Удалить расход за ${date}?` : `${date} sanadagi chiqimni o'chirmoqchimisiz?`)) return
    try {
      const res = await fetch(`/api/shop-report/expenses?date=${encodeURIComponent(date)}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "O'chirishda xatolik")
      toast.success(lang === 'ru' ? 'Расход удален' : "Chiqim o'chirildi")
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || "O'chirishda xatolik")
    }
  }

  const dirtyExpenses = expenses.filter((r) => r._dirty).length

  const executeSaveExpenses = async (rows: any[], reason: string) => {
    setSavingExpenses(true)
    try {
      const res = await fetch('/api/shop-report/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((r) => {
            const out: Record<string, any> = { date: r.date, editReason: reason || r.editReason }
            EXPENSE_FIELDS.forEach((f) => (out[f.field] = toNum(r[f.field])))
            return out
          }),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Saqlashda xatolik')
      toast.success(
        lang === 'ru'
          ? `Расход сохранен: ${j.saved} дней`
          : `Chiqim saqlandi: ${j.saved} ta kun`
      )
      setEditReasonModal((prev) => ({ ...prev, open: false }))
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSavingExpenses(false)
    }
  }

  const saveExpenses = async () => {
    const rows = expenses.filter((r) => r._dirty)
    if (rows.length === 0) return
    if (rows.some((r) => !isDateStr(r.date))) {
      toast.error("Barcha o'zgargan qatorlarda sanani kiriting")
      return
    }

    const modifiedExisting = rows.filter((r) => !r._new)
    const after17 = isAfterShiftHours() && !isAdmin

    if (modifiedExisting.length > 0 || after17) {
      const summary = rows.map((r) => `Chiqim sanasi: ${r.date}`)
      setEditReasonModal({
        open: true,
        dirtyItemsCount: rows.length,
        itemsSummary: summary,
        reason: '',
        onConfirm: (reason) => executeSaveExpenses(rows, reason),
      })
      return
    }

    await executeSaveExpenses(rows, '')
  }

  // Excel Import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/shop-report/import', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        if (data.latestMonth) {
          setSelectedMonth(data.latestMonth)
        }
        toast.success(
          lang === 'ru'
            ? `Импортировано дней расхода/ГП: ${data.importedDaysCount + data.updatedDaysCount}`
            : `Muvaffaqiyatli import qilindi: ${data.importedDaysCount + data.updatedDaysCount} kunlik chiqim saqlandi!`
        )
        await loadData()
      } else {
        toast.error(data?.error || 'Xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Excel Export
  const handleExport = () => {
    const url = selectedMonth
      ? `/api/shop-report/export?month=${encodeURIComponent(selectedMonth)}`
      : '/api/shop-report/export'
    window.location.href = url
  }

  // Filtering
  const filteredExpenses = useMemo(() => {
    return expenses
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (dateFilter && row.date !== dateFilter) return false
        if (selectedMonth && row.date && !row.date.startsWith(selectedMonth)) return false
        return true
      })
  }, [expenses, dateFilter, selectedMonth])

  const expensesPagination = useInfiniteTable(filteredExpenses, 15, [dateFilter, selectedMonth])

  // Calculate column totals for displayed/filtered records
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    PRODUCTION_EXPENSE_FIELDS.forEach((f) => (totals[f.field] = 0))
    for (const { row } of filteredExpenses) {
      if (row._new) continue
      for (const f of PRODUCTION_EXPENSE_FIELDS) {
        const val = Number(row[f.field]) || 0
        totals[f.field] += val
      }
    }
    return totals
  }, [filteredExpenses, PRODUCTION_EXPENSE_FIELDS])

  // Fetch Kitchen Transfers
  const fetchKitchenTransfers = useCallback(async () => {
    setKitchenLoading(true)
    try {
      const res = await fetch('/api/transfers?targetLocation=OSHXONA', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setKitchenTransfers(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Oshxona chiqimlarini yuklashda xatolik")
    } finally {
      setKitchenLoading(false)
    }
  }, [])

  // Fetch Inventory Products for Kitchen Dropdown
  const fetchInventoryProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/warehouse/inventory', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setInventoryProducts(data.filter((p: any) => (p.totalQuantity || 0) > 0 || p.isActive))
        }
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (activeSection === 'kitchen') {
      fetchKitchenTransfers()
      fetchInventoryProducts()
    }
  }, [activeSection, fetchKitchenTransfers, fetchInventoryProducts])

  // Handle Create Kitchen Transfer
  const handleCreateKitchenTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kitchenForm.productId || !kitchenForm.issuedQuantity || parseFloat(kitchenForm.issuedQuantity) <= 0) {
      toast.error("Iltimos, mahsulot va miqdorni to'g'ri kiriting")
      return
    }

    const selectedProd = inventoryProducts.find((p) => p.id === Number(kitchenForm.productId))
    const availStock = selectedProd ? (selectedProd.totalQuantity || 0) : 0
    const enteredQty = parseFloat(kitchenForm.issuedQuantity)

    if (availStock > 0 && enteredQty > availStock) {
      toast.error(`Omborda yetarli qoldiq yo'q! Mavjud: ${availStock} ${kitchenForm.issuedUnit}`)
      return
    }

    setSavingKitchenTransfer(true)
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(kitchenForm.productId),
          targetLocation: 'OSHXONA',
          issuedQuantity: enteredQty,
          issuedUnit: kitchenForm.issuedUnit || selectedProd?.unit || 'kg',
          issuedDate: kitchenForm.date || todayStr(),
          receiverName: kitchenForm.receiverName || 'Bosh oshpaz',
          autoAccept: true,
          notes: kitchenForm.notes ? `[Oshxona] ${kitchenForm.notes}` : "Xodimlar oshxonasi uchun chiqim",
        }),
      })

      if (res.ok) {
        toast.success("Oshxona uchun chiqim muvaffaqiyatli saqlandi va ombor qoldig'idan ayirildi!")
        setShowKitchenModal(false)
        setKitchenForm({
          date: todayStr(),
          productId: '',
          issuedQuantity: '',
          issuedUnit: 'kg',
          receiverName: 'Bosh oshpaz',
          notes: '',
        })
        fetchKitchenTransfers()
        fetchInventoryProducts()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Chiqim saqlashda xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingKitchenTransfer(false)
    }
  }

  // Filtered Kitchen Transfers
  const filteredKitchenTransfers = useMemo(() => {
    return kitchenTransfers.filter((t: any) => {
      if (kitchenDateFilter) {
        const tDate = t.issuedAt ? new Date(t.issuedAt).toISOString().slice(0, 10) : ''
        if (tDate !== kitchenDateFilter) return false
      }
      if (kitchenSearch.trim()) {
        const q = kitchenSearch.toLowerCase().trim()
        const prodName = (t.product?.name || '').toLowerCase()
        const num = (t.transferNumber || '').toLowerCase()
        const rec = (t.receivedByName || '').toLowerCase()
        const notes = (t.notes || '').toLowerCase()
        if (!prodName.includes(q) && !num.includes(q) && !rec.includes(q) && !notes.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [kitchenTransfers, kitchenDateFilter, kitchenSearch])

  const kitchenPagination = useInfiniteTable(filteredKitchenTransfers, 15, [kitchenDateFilter, kitchenSearch])

  // Kitchen KPIs
  const kitchenKpis = useMemo(() => {
    const today = todayStr()
    const currentMonth = today.slice(0, 7)
    let todayKg = 0
    let monthKg = 0

    for (const t of kitchenTransfers) {
      const tDate = t.issuedAt ? new Date(t.issuedAt).toISOString().slice(0, 10) : ''
      const qty = Number(t.issuedQuantity) || 0
      if (tDate === today) {
        todayKg += qty
      }
      if (tDate.startsWith(currentMonth)) {
        monthKg += qty
      }
    }

    return {
      todayKg: Math.round(todayKg * 10) / 10,
      monthKg: Math.round(monthKg * 10) / 10,
      totalCount: kitchenTransfers.length,
      acceptedCount: kitchenTransfers.filter((t: any) => t.status === 'ACCEPTED').length,
    }
  }, [kitchenTransfers])

  const inputVal = (v: any) => (v === undefined || v === null ? '' : String(v))

  return (
    <div className="space-y-4">
      {/* Hidden file input for Excel Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImport}
      />

      {/* SECTION SWITCHER: Sexga Chiqim vs Oshxonaga Chiqim */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSection('production')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === 'production'
                ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-dark-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-dark-800'
            }`}
          >
            <ChefHat size={16} />
            <span>🏭 Ishlab Chiqarish Sexi Chiqimi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('kitchen')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === 'kitchen'
                ? 'bg-white dark:bg-dark-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-dark-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/60 dark:hover:bg-dark-800'
            }`}
          >
            <UtensilsCrossed size={16} />
            <span>🍽️ Xodimlar Oshxonasi Chiqimi</span>
            {kitchenTransfers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {kitchenTransfers.length}
              </span>
            )}
          </button>
        </div>
        <Link
          href="/warehouse?tab=transfers"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-3 py-1 flex items-center gap-1 cursor-pointer"
        >
          <span>Ombor Handshake Chiqimlariga o'tish</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 1. ISHLAB CHIQARISH SEXI CHIQIMI VIEW */}
      {activeSection === 'production' && (
        <>
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {lang === 'ru' ? 'Расход в цех' : 'Sexga Chiqim'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                FSSC 22000
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ru'
                ? 'Ежедневный расход сырья, упаковочных и вспомогательных материалов в цех'
                : "Ishlab chiqarish sexiga berilgan xomashyo va materiallarning kunlik hisobi"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="">{lang === 'ru' ? 'Все месяцы' : 'Barcha oylar'}</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Quick Day Shifter & Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800 rounded-xl p-0.5 border border-slate-200 dark:border-dark-700 shadow-xs">
            <button
              type="button"
              onClick={() => {
                let base = dateFilter ? new Date(dateFilter) : new Date()
                if (isNaN(base.getTime())) base = new Date()
                base.setDate(base.getDate() - 1)
                setDateFilter(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`)
              }}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Oldingi kun"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setDateFilter(todayStr())}
              className={`px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                dateFilter === todayStr()
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-700'
              }`}
            >
              {lang === 'ru' ? 'Сегодня' : 'Bugun'}
            </button>
            <button
              type="button"
              onClick={() => {
                let base = dateFilter ? new Date(dateFilter) : new Date()
                if (isNaN(base.getTime())) base = new Date()
                base.setDate(base.getDate() + 1)
                setDateFilter(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`)
              }}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Keyingi kun"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2 py-1 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-2 text-slate-400 hover:text-rose-500"
                title="Filtrni tozalash"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Add Day Row Button */}
          {!isReadOnly && (
            <button
              onClick={addExpense}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>{lang === 'ru' ? 'Добавить день' : "+ Yangi Kun"}</span>
            </button>
          )}

          {/* Save Button */}
          {!isReadOnly && (
            <button
              onClick={saveExpenses}
              disabled={savingExpenses || dirtyExpenses === 0}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                dirtyExpenses > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {savingExpenses ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>
                {lang === 'ru' ? 'Сохранить' : 'Saqlash'}
                {dirtyExpenses > 0 ? ` (${dirtyExpenses})` : ''}
              </span>
            </button>
          )}

          {/* Excel Import (Faqat ADMIN) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 transition-colors shadow-xs"
            >
              <Upload size={14} />
              <span>Excel Import (Admin)</span>
            </button>
          )}

          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
          >
            <Download size={14} />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* THE EDITABLE CHIQIM MATRIX TABLE */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[75vh] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1450px]">
            <thead className="bg-[#FFE699] text-slate-900 text-[10px] sm:text-[11px] font-black uppercase tracking-tight sticky top-0 z-20 border-b border-amber-300 shadow-sm">
              <tr>
                <th className="relative md:sticky md:left-0 md:z-20 p-2.5 border-r border-amber-300 shadow-[inset_-1px_0_0_#fcd34d] w-[100px] min-w-[100px] bg-amber-200 text-slate-900">
                  {lang === 'ru' ? 'Число' : 'Sana'}
                </th>
                {PRODUCTION_EXPENSE_FIELDS.map((f) => {
                  const green = f.field === 'ses'
                  const defect = f.field === 'boxDefect' || f.field === 'bagDefect'
                  return (
                    <th
                      key={f.field}
                      className={`p-2 border-r border-amber-300 min-w-[80px] text-center leading-tight ${
                        green ? 'bg-[#92D050] text-black font-extrabold' : defect ? 'bg-red-100 text-red-900' : 'text-slate-900'
                      }`}
                    >
                      {f.label}
                      <br />
                      <span className="font-normal text-[8px] opacity-80">({f.unit})</span>
                    </th>
                  )
                })}
                <th className="p-2 border-r border-amber-300 min-w-[130px] text-center text-slate-900 font-extrabold">
                  {formatDual("Mas'ul Imzosi", "Подпись", "Signature")}
                </th>
                <th className="p-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/70 bg-[#FFFBF0] dark:bg-dark-900 text-slate-900 dark:text-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={PRODUCTION_EXPENSE_FIELDS.length + 3} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-amber-500" size={32} />
                      <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                        {lang === 'ru' ? 'Загрузка данных расхода...' : "Chiqim ma'lumotlari yuklanmoqda..."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : expensesPagination.displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={PRODUCTION_EXPENSE_FIELDS.length + 3} className="p-12 text-center text-sm text-slate-400">
                    {lang === 'ru'
                      ? 'Записи не найдены. Нажмите «+ Добавить день», чтобы создать строку.'
                      : "Hech qanday ma'lumot topilmadi. Chiqim kiritish uchun «+ Yangi Kun» tugmasini bosing."}
                  </td>
                </tr>
              ) : null}

              {expensesPagination.displayedItems.map(({ row, idx }: any) => {
                const perm = checkEditPermission({ role: userRole, createdAt: row.createdAt })
                const isRowEditable = Boolean(row._new) || perm.allowed

                return (
                  <tr
                    key={row.date || `exp-${idx}`}
                    className={`transition-colors ${
                      row.isEdited
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
                        : row._dirty
                        ? 'bg-amber-100/60 dark:bg-amber-950/30'
                        : 'hover:bg-amber-50/50 dark:hover:bg-dark-800/40'
                    }`}
                  >
                    {/* SANA */}
                    <td className={`relative md:sticky md:left-0 md:z-10 p-1.5 border-r border-amber-300/80 shadow-[inset_-1px_0_0_#fcd34d] ${
                      row.isEdited
                        ? 'bg-rose-100/70 dark:bg-rose-950/40'
                        : row.date === todayStr()
                        ? 'bg-amber-200/70 dark:bg-amber-950/50'
                        : 'bg-[#FFF3CD] dark:bg-dark-850'
                    }`}>
                      <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                          </span>
                          {row.date === todayStr() && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                              {lang === 'ru' ? 'Сегодня' : 'Bugun'}
                            </span>
                          )}
                        </div>
                        {isRowEditable && (
                          <label
                            className="relative cursor-pointer p-1 rounded hover:bg-amber-200/60 text-slate-400 hover:text-amber-600 transition-colors ml-auto"
                            title={lang === 'ru' ? 'Изменить дату' : "Sanani o'zgartirish"}
                          >
                            <Calendar size={13} />
                            <input
                              type="date"
                              value={row.date || ''}
                              onChange={(e) => updateExpense(idx, { date: e.target.value })}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        )}
                        {!isRowEditable && (
                          <span className="p-0.5 text-slate-400" title={perm.reason}>
                            <Lock size={11} className="text-amber-500 inline" />
                          </span>
                        )}
                      </div>
                      {row.isEdited && (
                        <div className="flex flex-col gap-0.5 px-1 pb-0.5">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white shadow-xs"
                            title={`17:00 dan keyin tahrirlangan:\nSabab: ${row.editReason || '—'}\nKim: ${row.editedBy || '—'}\nVaqt: ${row.editedAt ? new Date(row.editedAt).toLocaleString('uz-UZ') : ''}`}
                          >
                            <AlertTriangle size={10} className="shrink-0" />
                            <span>17:00 dan keyin</span>
                          </span>
                          {row.editReason && (
                            <span
                              className="text-[9px] text-rose-700 dark:text-rose-400 font-medium italic truncate max-w-[110px]"
                              title={row.editReason}
                            >
                              &ldquo;{row.editReason}&rdquo;
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* EXPENSE FIELDS */}
                    {PRODUCTION_EXPENSE_FIELDS.map((f) => {
                      const defect = f.field === 'boxDefect' || f.field === 'bagDefect'
                      const green = f.field === 'ses'

                      return (
                        <td
                          key={f.field}
                          className={`p-1 border-r border-amber-200/80 ${
                            defect ? 'bg-red-50/60 dark:bg-red-950/20' : green ? 'bg-green-50/60 dark:bg-green-950/20' : ''
                          }`}
                        >
                          <input
                            type="number"
                            step={f.unit === 'шт' ? '1' : 'any'}
                            readOnly={!isRowEditable}
                            disabled={!isRowEditable}
                            value={inputVal(row[f.field])}
                            placeholder={f.unit === 'шт' ? '0' : '0.0'}
                            onClick={() => {
                              if (!isRowEditable) toast.warning(perm.reason || "Ushbu yozuvni tahrirlash qulflangan")
                            }}
                            onChange={(e) => {
                              if (isRowEditable) updateExpense(idx, { [f.field]: e.target.value })
                            }}
                            className={`w-full min-w-[70px] px-1.5 py-1 text-xs font-mono font-bold text-right outline-none rounded transition-all ${
                              !isRowEditable
                                ? 'bg-transparent cursor-not-allowed opacity-80'
                                : 'bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 focus:border-amber-500'
                            } ${defect ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}
                          />
                        </td>
                      )
                    })}

                    {/* MAS'UL IMZOSI */}
                    <td className="p-1 border-r border-amber-200/80 text-center">
                      <SignatureCell
                        url={signature.url}
                        name={signature.name}
                        title={signature.title}
                        formatDual={formatDual}
                      />
                    </td>

                    {/* AMALLAR */}
                    <td className="p-1 text-center">
                      {row._new ? (
                        <button
                          onClick={() => removeNewExpense(idx)}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50"
                          title="Yangi qatorni bekor qilish"
                        >
                          <X size={14} />
                        </button>
                      ) : isAdmin ? (
                        <button
                          onClick={() => handleDeleteExistingExpense(row.date)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="O'chirish (faqat Administrator)"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : !isRowEditable ? (
                        <span className="p-1 text-slate-400 cursor-help flex items-center justify-center" title={perm.reason}>
                          <Lock size={12} className="text-amber-500" />
                        </span>
                      ) : (
                        <span className="p-1 text-slate-300 flex items-center justify-center opacity-60">
                          <Lock size={11} />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-amber-100 dark:bg-dark-850 border-t-2 border-amber-300 font-bold text-xs sticky bottom-0 z-20 shadow-sm">
              <tr>
                <td className="relative md:sticky md:left-0 md:z-20 p-2.5 bg-amber-200 dark:bg-dark-800 text-slate-900 dark:text-white font-black border-r border-amber-300 shadow-[inset_-1px_0_0_#fcd34d]">
                  {lang === 'ru' ? 'ИТОГО:' : 'JAMI:'}
                </td>
                {PRODUCTION_EXPENSE_FIELDS.map((f) => {
                  const val = columnTotals[f.field] || 0
                  const isInt = f.unit === 'шт'
                  const formatted = isInt
                    ? Math.round(val).toLocaleString()
                    : val > 0
                    ? (Math.round(val * 10) / 10).toLocaleString()
                    : '0'
                  return (
                    <td
                      key={f.field}
                      className="p-1.5 border-r border-amber-300/80 text-right font-mono text-[11px] text-slate-900 dark:text-white whitespace-nowrap"
                    >
                      <span className="font-bold">{formatted}</span>
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold ml-0.5">
                        {f.unit}
                      </span>
                    </td>
                  )
                })}
                <td className="p-1 border-r border-amber-300/80"></td>
                <td className="p-1"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination footer */}
        <InfiniteTableFooter
          currentCount={expensesPagination.visibleCount}
          totalCount={expensesPagination.totalCount}
          hasMore={expensesPagination.hasMore}
          showAll={expensesPagination.showAll}
          onLoadMore={expensesPagination.loadMore}
          onToggleShowAll={expensesPagination.toggleShowAll}
          sentinelRef={expensesPagination.sentinelRef}
          pageSize={15}
          itemName={{ uz: 'chiqim kuni', ru: 'дней расхода', en: 'expense days' }}
        />
      </div>
      </>
      )}

      {/* 2. XODIMLAR OSHXONASI CHIQIMI VIEW */}
      {activeSection === 'kitchen' && (
        <div className="space-y-4">
          {/* Header Action Bar for Kitchen */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 sm:p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <UtensilsCrossed size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Xodimlar Oshxonasi Chiqimi
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Oshxona & Ta'minot
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ombordan xodimlar oshxonasiga chiqarilgan oziq-ovqat va mahsulotlar hisobi (FIFO qoidasi bo'yicha ombor qoldig'idan ayiriladi)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setKitchenForm({
                    date: todayStr(),
                    productId: inventoryProducts.length > 0 ? inventoryProducts[0].id.toString() : '',
                    issuedQuantity: '',
                    issuedUnit: inventoryProducts.length > 0 ? (inventoryProducts[0].unit || 'kg') : 'kg',
                    receiverName: 'Bosh oshpaz',
                    notes: '',
                  })
                  setShowKitchenModal(true)
                }}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Oshxonaga Chiqim Yozish</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Bugungi Oshxona Chiqimi</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{kitchenKpis.todayKg}</span>
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Bugun topshirilgan xomashyo</p>
            </div>

            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Shu Oy Jami Chiqim</span>
                <Calendar size={16} className="text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{kitchenKpis.monthKg}</span>
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Oy boshidan buyon</p>
            </div>

            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Jami Chiqimlar</span>
                <PackageCheck size={16} className="text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{kitchenKpis.totalCount}</span>
                <span className="text-xs font-bold text-slate-500">ta partiya</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Barcha hujjatlar</p>
            </div>

            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Qabul Qilinganlar</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kitchenKpis.acceptedCount}</span>
                <span className="text-xs font-bold text-slate-500">ta</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Oshxona tasdiqlagan</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 rounded-2xl shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Mahsulot yoki oshpaz bo'yicha qidirish..."
                value={kitchenSearch}
                onChange={(e) => setKitchenSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800 rounded-xl p-0.5 border border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setKitchenDateFilter(kitchenDateFilter === todayStr() ? '' : todayStr())}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    kitchenDateFilter === todayStr()
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-700'
                  }`}
                >
                  Bugun
                </button>
                <input
                  type="date"
                  value={kitchenDateFilter}
                  onChange={(e) => setKitchenDateFilter(e.target.value)}
                  className="px-2 py-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
                {kitchenDateFilter && (
                  <button
                    type="button"
                    onClick={() => setKitchenDateFilter('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    title="Filtrni tozalash"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kitchen Transfers Table */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto max-h-[65vh] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-black tracking-tight sticky top-0 z-10 border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="p-3">Sana & Vaqt</th>
                    <th className="p-3">Hujjat №</th>
                    <th className="p-3">Mahsulot Nomi</th>
                    <th className="p-3 text-right">Chiqarilgan Miqdor</th>
                    <th className="p-3">Ombor Partiyasi</th>
                    <th className="p-3">Skladchi</th>
                    <th className="p-3">Qabul Qiluvchi (Oshxona)</th>
                    <th className="p-3">Maqsad / Izoh</th>
                    <th className="p-3 text-center">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-slate-800 dark:text-slate-200">
                  {kitchenLoading ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-amber-500" size={26} />
                          <span className="font-bold text-xs">Oshxona chiqimlari yuklanmoqda...</span>
                        </div>
                      </td>
                    </tr>
                  ) : kitchenPagination.displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UtensilsCrossed size={32} className="text-slate-300 dark:text-slate-600" />
                          <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                            Xodimlar oshxonasiga chiqimlar topilmadi
                          </span>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Oshxonaga mahsulot chiqarish uchun yuqoridagi "+ Oshxonaga Chiqim Yozish" tugmasini bosing
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    kitchenPagination.displayedItems.map((t: any) => {
                      const issuedDateStr = t.issuedAt
                        ? new Date(t.issuedAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'
                      const isAccepted = t.status === 'ACCEPTED'

                      return (
                        <tr key={t.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors">
                          <td className="p-3 whitespace-nowrap font-medium font-mono text-[11px]">
                            {issuedDateStr}
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono font-bold text-amber-700 dark:text-amber-400">
                            {t.transferNumber}
                          </td>
                          <td className="p-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              {t.product?.name || "Noma'lum mahsulot"}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap font-black font-mono text-sm text-right text-slate-900 dark:text-white">
                            {t.issuedQuantity} <span className="text-xs font-normal text-slate-500">{t.issuedUnit || 'kg'}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {t.batch?.batchNumber ? `#${t.batch.batchNumber}` : '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {t.issuedByName || 'Skladchi'}
                          </td>
                          <td className="p-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                            {t.receivedByName || 'Bosh oshpaz'}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={t.notes || ''}>
                            {t.notes || '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/40">
                                <CheckCircle2 size={11} />
                                Qabul qilingan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/40">
                                <Clock size={11} />
                                Kutilmoqda
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <InfiniteTableFooter
              currentCount={kitchenPagination.visibleCount}
              totalCount={kitchenPagination.totalCount}
              hasMore={kitchenPagination.hasMore}
              showAll={kitchenPagination.showAll}
              onLoadMore={kitchenPagination.loadMore}
              onToggleShowAll={kitchenPagination.toggleShowAll}
              sentinelRef={kitchenPagination.sentinelRef}
            />
          </div>
        </div>
      )}

      {/* Modal: Oshxonaga Chiqim Yozish */}
      {showKitchenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <UtensilsCrossed size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Oshxonaga Chiqim Yozish
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Xodimlar oshxonasi uchun ombordan xomashyo ajratish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKitchenModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKitchenTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chiqim Sanasi *
                  </label>
                  <input
                    type="date"
                    required
                    value={kitchenForm.date}
                    onChange={(e) => setKitchenForm({ ...kitchenForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qabul Qiluvchi (Oshpaz) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Bosh oshpaz, Povar"
                    value={kitchenForm.receiverName}
                    onChange={(e) => setKitchenForm({ ...kitchenForm, receiverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mahsulotni Tanlang *
                </label>
                <select
                  required
                  value={kitchenForm.productId}
                  onChange={(e) => {
                    const sel = inventoryProducts.find((p) => p.id === Number(e.target.value))
                    setKitchenForm({
                      ...kitchenForm,
                      productId: e.target.value,
                      issuedUnit: sel?.unit || 'kg',
                    })
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Mahsulotni tanlang --</option>
                  {inventoryProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Qoldiq: {p.totalQuantity || 0} {p.unit || 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Chiqarilayotgan Miqdor *
                  </label>
                  {kitchenForm.productId && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Omborda mavjud: {inventoryProducts.find((p) => p.id === Number(kitchenForm.productId))?.totalQuantity || 0} {kitchenForm.issuedUnit}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.0"
                    value={kitchenForm.issuedQuantity}
                    onChange={(e) => setKitchenForm({ ...kitchenForm, issuedQuantity: e.target.value })}
                    className="w-full px-3 py-2 pr-12 rounded-xl text-sm font-bold font-mono bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {kitchenForm.issuedUnit || 'kg'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaysi Taom / Maqsad Uchun (Izoh)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Xodimlar tushligi sho'rva va salat uchun"
                  value={kitchenForm.notes}
                  onChange={(e) => setKitchenForm({ ...kitchenForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setShowKitchenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-800 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingKitchenTransfer}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingKitchenTransfer ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Chiqimni Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REASON MODAL */}
      {editReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 border border-rose-300 dark:border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={24} className="shrink-0 text-rose-500" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">
                  {isAfterShiftHours() && !isAdmin
                    ? (lang === 'ru' ? 'Изменение после 17:00 (Вечерняя смена)' : "Soat 17:00 dan Keyingi O'zgartirish")
                    : (lang === 'ru' ? 'Причина изменения расхода' : "Chiqimni o'zgartirish sababi")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAfterShiftHours() && !isAdmin
                    ? (lang === 'ru'
                        ? 'Смена (17:00) завершена. Укажите официальную причину изменения (мин. 10 символов).'
                        : "Ish smenasi (17:00) yakunlangan. Rasmiy sababni kiriting (kamida 10 ta belgi).")
                    : (lang === 'ru'
                        ? 'FSSC 22000: Укажите причину изменения ранее сохраненных данных'
                        : "FSSC 22000: Saqlangan chiqimni o'zgartirish sababini ko'rsating")}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {lang === 'ru' ? 'Официальное обоснование *' : 'Rasmiy asos va sabab *'}
                </span>
                <span
                  className={`font-bold ${
                    editReasonModal.reason.trim().length >= 10
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}
                >
                  {editReasonModal.reason.trim().length} / 10 ta belgi
                </span>
              </div>
              <textarea
                required
                rows={3}
                placeholder={
                  lang === 'ru'
                    ? 'Например: Запрос цеха на дополнительные 400 кг лука для вечерней смены...'
                    : "Masalan: Kechki smena uchun sexdan qo'shimcha 400 kg piyoz talab qilindi..."
                }
                value={editReasonModal.reason}
                onChange={(e) => setEditReasonModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none focus:border-rose-500 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ushbu izoh Sozlamalar bo'limidagi doimiy Audit Jurnaliga muhrlanadi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-800">
              <button
                type="button"
                onClick={() => setEditReasonModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
              </button>
              <button
                type="button"
                disabled={editReasonModal.reason.trim().length < 10}
                onClick={() => editReasonModal.onConfirm?.(editReasonModal.reason.trim())}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {lang === 'ru' ? 'Подтвердить и сохранить' : 'Tasdiqlash va saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Import Modal */}
      <AdminImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userRole={userRole}
        userName={userName}
        targetName="Chiqimlar Jurnali (Outbound / Rashod)"
        endpoint="/api/shop-report/import"
        hint="Chiqimlar jadvali uchun 123.xlsx yoki umumiy sex xarajatlari faylini yuklang. Fayldagi yangi kunlik sarflar bazaga qo'shiladi."
        onSuccess={async (data) => {
          if (data?.latestMonth) {
            setSelectedMonth(data.latestMonth)
          }
          await loadData()
        }}
      />
    </div>
  )
}

'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Plus,
  Save,
  Upload,
  Download,
  Calendar,
  Search,
  Loader2,
  Trash2,
  X,
  Lock,
  Sparkles,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { checkEditPermission } from '@/lib/auditRules'
import { formatDMY, formatLongDate, isDateStr, toNum } from '@/lib/shopReport'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface PrihodContentProps {
  userRole?: string
  userName?: string
}

const todayStr = () => new Date().toISOString().split('T')[0]

export default function PrihodContent({ userRole, userName }: PrihodContentProps) {
  const { lang, formatDual } = useLanguage()
  const isAdmin = userRole === 'ADMIN'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingArrivals, setSavingArrivals] = useState(false)

  // Raw DB arrivals data
  const [arrivals, setArrivals] = useState<any[]>([])

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Date display mode: 'short' (DD.MM.YYYY)
  const [dateFormatMode, setDateFormatMode] = useState<'short' | 'long'>('short')

  // Products catalog + frequency & quick selection
  const [productList, setProductList] = useState<{ id?: number; name: string; category?: string; unit?: string }[]>([])
  const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null)

  // New Product Modal
  const [newProductModalOpen, setNewProductModalOpen] = useState(false)
  const [targetRowIdxForNewProduct, setTargetRowIdxForNewProduct] = useState<number | null>(null)
  const [newProductName, setNewProductName] = useState('')
  const [newProductUnit, setNewProductUnit] = useState('kg')
  const [newProductCategory, setNewProductCategory] = useState('Xomashyo')
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  // Edit Reason Modal for locked/saved records
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
    arrivals.forEach((a) => {
      if (a.date && typeof a.date === 'string' && a.date.length >= 7) {
        s.add(a.date.slice(0, 7))
      }
    })
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [arrivals])

  // Load Arrivals Data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/shop-report', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Ma'lumotlarni yuklashda xatolik")

      setArrivals(
        (data.arrivals || []).map((a: any) => ({
          ...a,
          batch: a.batch || (a.id ? `#${a.id}` : ''),
        }))
      )

      // Fetch products catalog
      fetch('/api/products')
        .then((r) => r.json())
        .then((pData) => {
          if (Array.isArray(pData)) setProductList(pData)
        })
        .catch(() => {})
    } catch (e: any) {
      toast.error(e?.message || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute next batch number per product in that month (1, 2, 3...)
  const computeNextBatch = (list: any[], nom: string, dateStr: string): string => {
    const cleanNom = String(nom || '').trim().toLowerCase()
    if (!cleanNom) return '1'
    const ym = (dateStr || '').slice(0, 7)
    if (!ym) return '1'

    let maxNum = 0
    for (const a of list) {
      const aNom = String(a.nomenclature || '').trim().toLowerCase()
      const aYm = String(a.date || '').slice(0, 7)
      if (aNom === cleanNom && aYm === ym) {
        const b = parseInt(String(a.batch || '').trim(), 10)
        if (!isNaN(b) && b > maxNum) {
          maxNum = b
        }
      }
    }
    return String(maxNum + 1)
  }

  // Update a single arrival row
  const updateArrival = (idx: number, patch: any) => {
    const row = arrivals[idx]
    if (!row) return
    if (!row._new) {
      const perm = checkEditPermission({ role: userRole, createdAt: row.createdAt })
      if (!perm.allowed) {
        toast.error(perm.reason || "Ushbu yozuvni o'zgartirish huquqi yo'q!")
        return
      }
    }
    setArrivals((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r
        const updated = { ...r, ...patch, _dirty: true }

        // Recalculate auto-batch if nomenclature or date changes
        if (
          (patch.nomenclature !== undefined || patch.date !== undefined) &&
          (!r.batch || r._autoBatch) &&
          updated.nomenclature?.trim()
        ) {
          const autoB = computeNextBatch(prev, updated.nomenclature, updated.date)
          updated.batch = autoB
          updated._autoBatch = true
        }

        // If user manually types a batch, disable auto flag
        if (patch.batch !== undefined) {
          updated._autoBatch = false
        }

        return updated
      })
    )
  }

  // Add new arrival row
  const addArrival = () => {
    const targetDate = dateFilter || todayStr()
    setArrivals((prev) => [
      {
        date: targetDate,
        nomenclature: '',
        quantity: '',
        supplier: '',
        batch: '',
        _dirty: true,
        _new: true,
        _autoBatch: true,
      },
      ...prev,
    ])
  }

  const removeNewArrival = (idx: number) => {
    setArrivals((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDeleteExistingArrival = async (id: number) => {
    if (!isAdmin) {
      toast.error(lang === 'ru' ? 'Удаление разрешено только Администратору' : "O'chirish faqat Administratorga ruxsat etilgan!")
      return
    }
    if (!confirm(lang === 'ru' ? 'Вы уверены, что хотите удалить эту запись?' : "Haqiqatan ham ushbu yozuvni o'chirmoqchimisiz?")) return
    try {
      const res = await fetch(`/api/shop-report/arrivals?id=${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "O'chirishda xatolik")
      toast.success(lang === 'ru' ? 'Запись успешно удалена' : "Yozuv o'chirildi")
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || "O'chirishda xatolik")
    }
  }

  // Frequency of products
  const productFrequency = useMemo(() => {
    const counts = new Map<string, number>()
    arrivals.forEach((a) => {
      const name = String(a.nomenclature || '').trim()
      if (name) {
        counts.set(name, (counts.get(name) || 0) + 1)
      }
    })
    return counts
  }, [arrivals])

  // Sorted product list
  const sortedProducts = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; count: number; unit?: string }[] = []

    productFrequency.forEach((count, name) => {
      seen.add(name.toLowerCase())
      list.push({ name, count })
    })

    productList.forEach((p) => {
      const lower = (p.name || '').trim().toLowerCase()
      if (lower && !seen.has(lower)) {
        seen.add(lower)
        list.push({ name: p.name.trim(), count: 0, unit: p.unit })
      }
    })

    return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [productFrequency, productList])

  const filteredProductsList = (query?: string) => {
    if (!query || !query.trim()) return sortedProducts
    const q = query.trim().toLowerCase()
    return sortedProducts.filter((p) => p.name.toLowerCase().includes(q))
  }

  const handleSelectProduct = (idx: number, prodName: string) => {
    const row = arrivals[idx]
    const targetDate = row?.date || todayStr()
    const autoB = computeNextBatch(arrivals, prodName, targetDate)
    updateArrival(idx, {
      nomenclature: prodName,
      batch: autoB,
      _autoBatch: true,
    })
    setActiveDropdownIdx(null)
    toast.info(`${prodName} — ${lang === 'ru' ? 'Партия' : 'Partiya'}: #${autoB}`)
  }

  // Create & save new product into catalog
  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newProductName.trim()
    if (!trimmed) {
      toast.error("Mahsulot nomini kiriting")
      return
    }

    setIsSavingProduct(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          unit: newProductUnit,
          category: newProductCategory,
          type: newProductCategory === 'Qadoq' ? 'PACKAGING' : 'RAW_MATERIAL',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Xatolik yuz berdi')

      setProductList((prev) => [{ name: trimmed, unit: newProductUnit, category: newProductCategory }, ...prev])

      if (targetRowIdxForNewProduct !== null && targetRowIdxForNewProduct < arrivals.length) {
        const targetRow = arrivals[targetRowIdxForNewProduct]
        const autoB = computeNextBatch(arrivals, trimmed, targetRow?.date || todayStr())
        updateArrival(targetRowIdxForNewProduct, {
          nomenclature: trimmed,
          batch: autoB,
          _autoBatch: true,
        })
        toast.success(
          lang === 'ru'
            ? `«${trimmed}» добавлен и присвоена партия #${autoB}!`
            : `«${trimmed}» qo'shildi va avtomatik Partiya #${autoB} berildi!`
        )
      } else {
        const targetDate = dateFilter || todayStr()
        const autoB = computeNextBatch(arrivals, trimmed, targetDate)
        setArrivals((prev) => [
          {
            date: targetDate,
            nomenclature: trimmed,
            quantity: '',
            supplier: '',
            batch: autoB,
            _dirty: true,
            _new: true,
            _autoBatch: true,
          },
          ...prev,
        ])
        toast.success(
          lang === 'ru'
            ? `«${trimmed}» добавлен в список с партией #${autoB}!`
            : `«${trimmed}» qo'shildi va qatorga Partiya #${autoB} bilan kiritildi!`
        )
      }

      setNewProductModalOpen(false)
      setNewProductName('')
      setTargetRowIdxForNewProduct(null)
    } catch (err: any) {
      toast.error(err?.message || 'Mahsulotni saqlashda xatolik')
    } finally {
      setIsSavingProduct(false)
    }
  }

  const dirtyArrivals = arrivals.filter((r) => r._dirty).length

  // Save execution
  const executeSaveArrivals = async (rows: any[], reason: string) => {
    setSavingArrivals(true)
    try {
      const res = await fetch('/api/shop-report/arrivals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            id: r.id,
            date: r.date,
            nomenclature: r.nomenclature,
            quantity: toNum(r.quantity),
            supplier: r.supplier,
            batch: r.batch,
            editReason: reason || r.editReason,
          })),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Saqlashda xatolik')
      toast.success(
        lang === 'ru'
          ? `Приход сохранен: ${j.updated} обновлено, ${j.created} добавлено`
          : `Kirim saqlandi: ${j.updated} ta yangilandi, ${j.created} ta qo'shildi`
      )
      setEditReasonModal((prev) => ({ ...prev, open: false }))
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSavingArrivals(false)
    }
  }

  const saveArrivals = async () => {
    const rows = arrivals.filter(
      (r) => r._dirty && !(r._new && !String(r.nomenclature || '').trim() && !toNum(r.quantity))
    )
    if (rows.length === 0) {
      setArrivals((prev) =>
        prev.filter((r) => !(r._new && !String(r.nomenclature || '').trim() && !toNum(r.quantity)))
      )
      return
    }
    if (rows.some((r) => !isDateStr(r.date))) {
      toast.error("Barcha o'zgargan qatorlarda sanani kiriting")
      return
    }

    const modifiedExisting = rows.filter((r) => !r._new && r.id)
    if (modifiedExisting.length > 0) {
      const summary = modifiedExisting
        .slice(0, 5)
        .map((r) => `${r.nomenclature || 'Mahsulot'} (${r.quantity} kg, ${r.date})`)
      if (modifiedExisting.length > 5) {
        summary.push(`... va yana ${modifiedExisting.length - 5} ta qator`)
      }

      setEditReasonModal({
        open: true,
        dirtyItemsCount: modifiedExisting.length,
        itemsSummary: summary,
        reason: '',
        onConfirm: (reason) => executeSaveArrivals(rows, reason),
      })
      return
    }

    await executeSaveArrivals(rows, '')
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
            ? `Успешно импортировано: +${data.arrivalsCount} новых приходов!`
            : `Muvaffaqiyatli import qilindi: +${data.arrivalsCount} ta yangi kirim saqlandi!`
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
  const filteredArrivals = useMemo(() => {
    return arrivals
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (dateFilter && row.date !== dateFilter) return false
        if (selectedMonth && row.date && !row.date.startsWith(selectedMonth)) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nom = String(row.nomenclature || '').toLowerCase()
          const sup = String(row.supplier || '').toLowerCase()
          const bat = String(row.batch || '').toLowerCase()
          if (!nom.includes(q) && !sup.includes(q) && !bat.includes(q)) return false
        }
        return true
      })
  }, [arrivals, dateFilter, selectedMonth, searchQuery])

  const arrivalsPagination = useInfiniteTable(filteredArrivals, 15, [dateFilter, selectedMonth, searchQuery])

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

      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Package size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {lang === 'ru' ? 'Приход сырья (Kirim)' : 'Xomashyo Kirimi (Приход)'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                FSSC 22000
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ru'
                ? 'Регистрация поступившего сырья, материалов и авто-расчет партий'
                : "Kelgan xomashyolarni ro'yxatga olish va avtomatik partiya hisobi"}
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

          {/* Date Filter */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 outline-none"
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

          {/* Search Input */}
          <div className="relative flex items-center min-w-[140px] sm:min-w-[180px]">
            <Search size={14} className="absolute left-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск...' : 'Qidirish...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Add Row Button */}
          <button
            onClick={addArrival}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>{lang === 'ru' ? 'Добавить' : "+ Qo'shish"}</span>
          </button>

          {/* New Product Button */}
          <button
            type="button"
            onClick={() => {
              setTargetRowIdxForNewProduct(null)
              setNewProductName('')
              setNewProductModalOpen(true)
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-dark-750 transition-colors"
          >
            <Sparkles size={13} />
            <span>{lang === 'ru' ? 'Новый продукт' : 'Yangi mahsulot'}</span>
          </button>

          {/* Save Button */}
          <button
            onClick={saveArrivals}
            disabled={savingArrivals || dirtyArrivals === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              dirtyArrivals > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {savingArrivals ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>
              {lang === 'ru' ? 'Сохранить' : 'Saqlash'}
              {dirtyArrivals > 0 ? ` (${dirtyArrivals})` : ''}
            </span>
          </button>

          {/* Excel Import (Image 2 style) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 transition-colors"
          >
            <Upload size={14} />
            <span>Excel Import</span>
          </button>

          {/* Excel Export (Image 2 style) */}
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

      {/* THE EDITABLE KIRIM TABLE (Image 1 style) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[75vh] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-[#E67E22] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="sticky left-0 z-20 bg-[#D35400] p-3 border-r border-amber-700/60 w-[110px] min-w-[110px]">
                  {lang === 'ru' ? 'SANA / ДАТА' : 'SANA'}
                </th>
                <th className="p-3 border-r border-amber-600 min-w-[200px]">
                  {lang === 'ru' ? 'НОМЕНКЛАТУРА' : 'NOMENKLATURA'}
                </th>
                <th className="p-3 border-r border-amber-600 text-right min-w-[120px]">
                  {lang === 'ru' ? 'КОЛИЧЕСТВО (КГ)' : 'MIQDOR (KG)'}
                </th>
                <th className="p-3 border-r border-amber-600 min-w-[180px]">
                  {lang === 'ru' ? 'ПОСТАВЩИК' : 'YETKAZIB BERUVCHI'}
                </th>
                <th className="p-3 border-r border-amber-600 min-w-[140px]">
                  PARTIYA
                </th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-dark-750 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-amber-500" size={32} />
                      <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                        {lang === 'ru' ? 'Загрузка данных прихода...' : "Kirim ma'lumotlari yuklanmoqda..."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : arrivalsPagination.displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-slate-400">
                    {lang === 'ru'
                      ? 'Записи не найдены. Нажмите «+ Добавить», чтобы создать запись.'
                      : "Hech qanday ma'lumot topilmadi. Yangi kirim kiritish uchun «+ Qo'shish» tugmasini bosing."}
                  </td>
                </tr>
              ) : null}

              {arrivalsPagination.displayedItems.map(({ row, idx }: any) => {
                const perm = checkEditPermission({ role: userRole, createdAt: row.createdAt })
                const isRowEditable = Boolean(row._new) || perm.allowed

                return (
                  <tr
                    key={row.id ?? `new-${idx}`}
                    className={`transition-colors ${
                      row.isEdited
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
                        : row._dirty
                        ? 'bg-amber-50/80 dark:bg-amber-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-800/50'
                    }`}
                  >
                    {/* SANA */}
                    <td className={`sticky left-0 z-10 p-1.5 border-r border-slate-200 dark:border-dark-750 shadow-[inset_-1px_0_0_#e2e8f0] dark:shadow-[inset_-1px_0_0_#1e293b] ${
                      row.isEdited ? 'bg-rose-100/50 dark:bg-rose-950/40' : 'bg-slate-50/90 dark:bg-dark-850'
                    }`}>
                      {row._new ? (
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateArrival(idx, { date: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none text-slate-900 dark:text-white"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 px-2 py-1.5 group rounded hover:bg-amber-100/60 dark:hover:bg-dark-750 transition-colors">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                          </span>
                          {isRowEditable ? (
                            <label
                              className="relative cursor-pointer p-1 rounded hover:bg-amber-200/60 text-slate-400 hover:text-amber-600 transition-colors"
                              title={lang === 'ru' ? 'Изменить дату' : "Sanani o'zgartirish"}
                            >
                              <Calendar size={13} />
                              <input
                                type="date"
                                value={row.date || ''}
                                onChange={(e) => updateArrival(idx, { date: e.target.value })}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          ) : (
                            <span className="p-0.5 text-slate-400" title={perm.reason}>
                              <Lock size={12} className="text-amber-500 inline" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* NOMENKLATURA */}
                    <td className="p-1.5 border-r border-slate-200 dark:border-dark-750 relative">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly={!isRowEditable}
                          disabled={!isRowEditable}
                          placeholder={lang === 'ru' ? 'Салат Айсберг, Томат...' : 'Salat Aysberg, Pomidor...'}
                          value={row.nomenclature || ''}
                          onFocus={() => {
                            if (isRowEditable) setActiveDropdownIdx(idx)
                          }}
                          onClick={() => {
                            if (!isRowEditable) toast.warning(perm.reason || "Ushbu yozuvni tahrirlash qulflangan")
                          }}
                          onChange={(e) => {
                            if (isRowEditable) {
                              updateArrival(idx, { nomenclature: e.target.value })
                              if (activeDropdownIdx !== idx) setActiveDropdownIdx(idx)
                            }
                          }}
                          className={`w-full min-w-[160px] px-2.5 py-1.5 text-xs font-medium rounded-lg border outline-none pr-7 transition-all ${
                            !isRowEditable
                              ? 'bg-slate-100 dark:bg-dark-800 border-transparent text-slate-500 cursor-not-allowed'
                              : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:border-amber-500'
                          }`}
                        />
                        {isRowEditable && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetRowIdxForNewProduct(idx)
                              setNewProductName(row.nomenclature || '')
                              setNewProductModalOpen(true)
                              setActiveDropdownIdx(null)
                            }}
                            title={lang === 'ru' ? 'Добавить новый продукт' : "Yangi mahsulot qo'shish"}
                            className="absolute right-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100 p-1 rounded transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown list of products */}
                      {isRowEditable && activeDropdownIdx === idx && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveDropdownIdx(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-h-64 overflow-y-auto bg-white dark:bg-dark-850 rounded-2xl shadow-2xl border border-amber-300 dark:border-dark-700 z-40 p-2 custom-scrollbar">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetRowIdxForNewProduct(idx)
                                setNewProductName(row.nomenclature || '')
                                setNewProductModalOpen(true)
                                setActiveDropdownIdx(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs mb-2"
                            >
                              <Plus size={14} className="shrink-0" />
                              <span>{lang === 'ru' ? '+ Добавить новый продукт' : '+ Yangi mahsulot qo‘shish'}</span>
                            </button>

                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <span>{lang === 'ru' ? 'Часто используемые' : 'Mavjud mahsulotlar'}</span>
                              <span className="text-amber-600 font-mono text-[10px]">
                                {filteredProductsList(row.nomenclature).length}
                              </span>
                            </div>

                            <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                              {filteredProductsList(row.nomenclature).map((p) => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() => handleSelectProduct(idx, p.name)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                    (row.nomenclature || '').trim().toLowerCase() === p.name.toLowerCase()
                                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                                      : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <span className="truncate">{p.name}</span>
                                  {p.count > 0 && (
                                    <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                                      {p.count} {lang === 'ru' ? 'раз' : 'ta'}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Edited badge */}
                      {row.isEdited && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs cursor-help"
                            title={`O'zgartirilgan:\nSabab: ${row.editReason || '—'}\nKim: ${row.editedBy || '—'}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            {lang === 'ru' ? 'Изменено' : "O'zgartirilgan"}
                          </span>
                          {row.editReason && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold italic truncate max-w-[180px]">
                              «{row.editReason}»
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* MIQDOR (KG) */}
                    <td className="p-1.5 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="number"
                        step="any"
                        readOnly={!isRowEditable}
                        disabled={!isRowEditable}
                        value={inputVal(row.quantity)}
                        onClick={() => {
                          if (!isRowEditable) toast.warning(perm.reason || "Ushbu yozuvni tahrirlash qulflangan")
                        }}
                        onChange={(e) => {
                          if (isRowEditable) updateArrival(idx, { quantity: e.target.value })
                        }}
                        placeholder="0.0"
                        className={`w-full min-w-[90px] px-2.5 py-1.5 text-xs font-mono font-bold text-right rounded-lg border outline-none text-amber-600 dark:text-amber-400 transition-all ${
                          !isRowEditable
                            ? 'bg-slate-100 dark:bg-dark-800 border-transparent cursor-not-allowed opacity-80'
                            : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 focus:border-amber-500'
                        }`}
                      />
                    </td>

                    {/* YETKAZIB BERUVCHI */}
                    <td className="p-1.5 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        readOnly={!isRowEditable}
                        disabled={!isRowEditable}
                        placeholder={lang === 'ru' ? 'ECO-GROW, FARMIX...' : 'ECO-GROW, FARMIX...'}
                        value={row.supplier || ''}
                        onClick={() => {
                          if (!isRowEditable) toast.warning(perm.reason || "Ushbu yozuvni tahrirlash qulflangan")
                        }}
                        onChange={(e) => {
                          if (isRowEditable) updateArrival(idx, { supplier: e.target.value })
                        }}
                        className={`w-full min-w-[140px] px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                          !isRowEditable
                            ? 'bg-slate-100 dark:bg-dark-800 border-transparent text-slate-500 cursor-not-allowed'
                            : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:border-amber-500'
                        }`}
                      />
                    </td>

                    {/* PARTIYA with ⚡ auto-calc button */}
                    <td className="p-1.5 border-r border-slate-200 dark:border-dark-750">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly={!isRowEditable}
                          disabled={!isRowEditable}
                          placeholder={row.id ? `#${row.id}` : "Партия"}
                          value={row.batch || (row.id ? `#${row.id}` : '')}
                          onClick={() => {
                            if (!isRowEditable) toast.warning(perm.reason || "Ushbu yozuvni tahrirlash qulflangan")
                          }}
                          onChange={(e) => {
                            if (isRowEditable) updateArrival(idx, { batch: e.target.value })
                          }}
                          className={`w-full min-w-[90px] px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border outline-none pr-7 transition-all ${
                            !isRowEditable
                              ? 'bg-slate-100 dark:bg-dark-800 border-transparent text-slate-500 cursor-not-allowed'
                              : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white focus:border-amber-500'
                          }`}
                        />
                        {isRowEditable && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextB = computeNextBatch(arrivals, row.nomenclature, row.date)
                              updateArrival(idx, { batch: nextB })
                              toast.info(lang === 'ru' ? `Партия: #${nextB}` : `Partiya: #${nextB}`)
                            }}
                            title={lang === 'ru' ? "Пересчитать партию (с 1 в начале месяца)" : "Partiyani hisoblash (har oy boshidan 1)"}
                            className="absolute right-1 text-amber-500 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-dark-750 p-1 rounded transition-colors text-xs font-bold"
                          >
                            ⚡
                          </button>
                        )}
                      </div>
                    </td>

                    {/* AMALLAR */}
                    <td className="p-1.5 text-center">
                      {row._new ? (
                        <button
                          onClick={() => removeNewArrival(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Yangi qatorni bekor qilish"
                        >
                          <X size={14} />
                        </button>
                      ) : isAdmin ? (
                        <button
                          onClick={() => handleDeleteExistingArrival(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="O'chirish (faqat Administrator)"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : !isRowEditable ? (
                        <span className="p-1 text-slate-400 cursor-help flex items-center justify-center" title={perm.reason}>
                          <Lock size={13} className="text-amber-500" />
                        </span>
                      ) : (
                        <span className="p-1 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-60">
                          <Lock size={11} />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <InfiniteTableFooter
          currentCount={arrivalsPagination.visibleCount}
          totalCount={arrivalsPagination.totalCount}
          hasMore={arrivalsPagination.hasMore}
          showAll={arrivalsPagination.showAll}
          onLoadMore={arrivalsPagination.loadMore}
          onToggleShowAll={arrivalsPagination.toggleShowAll}
          sentinelRef={arrivalsPagination.sentinelRef}
          pageSize={15}
          itemName={{ uz: 'kirim yozuvi', ru: 'записей прихода', en: 'arrival records' }}
        />
      </div>

      {/* NEW PRODUCT MODAL */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Sparkles size={18} />
                <h3 className="font-black text-sm uppercase tracking-wide">
                  {lang === 'ru' ? 'Добавить новый продукт в каталог' : "Yangi mahsulotni katalogga qo'shish"}
                </h3>
              </div>
              <button
                onClick={() => setNewProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {lang === 'ru' ? 'Наименование продукта' : 'Mahsulot / Xomashyo nomi'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masalan: Salat Aysberg, Pomidor..."
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {lang === 'ru' ? 'Ед. измерения' : "O'lchov birligi"}
                  </label>
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="kg">kg (Kilogramm)</option>
                    <option value="dona">dona (Шт)</option>
                    <option value="litr">litr (L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {lang === 'ru' ? 'Категория' : 'Kategoriya'}
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Xomashyo">Xomashyo (Сырье)</option>
                    <option value="Qadoq">Qadoq (Упаковка)</option>
                    <option value="Kimyoviy modda">Kimyoviy modda</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                >
                  {isSavingProduct && <Loader2 size={13} className="animate-spin" />}
                  <span>{lang === 'ru' ? 'Сохранить и присвоить' : "Saqlash va partiya berish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REASON MODAL (FSSC 22000 Audit Requirement) */}
      {editReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 border border-rose-300 dark:border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertCircle size={22} className="shrink-0" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">
                  {lang === 'ru' ? 'Причина изменения записи' : "Yozuvni o'zgartirish sababi"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'ru'
                    ? 'FSSC 22000: Укажите причину изменения ранее сохраненных данных'
                    : "FSSC 22000: Saqlangan yozuvni o'zgartirish sababini ko'rsating"}
                </p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/30 space-y-1 text-xs">
              <span className="font-bold text-rose-700 dark:text-rose-300 block">
                {editReasonModal.dirtyItemsCount} ta yozuv o&apos;zgartirilmoqda:
              </span>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                {editReasonModal.itemsSummary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <textarea
              required
              rows={3}
              placeholder={
                lang === 'ru'
                  ? 'Укажите точную причину изменения (например: опечатка в весе, корректировка по накладной №...)'
                  : "O'zgartirish sababi (masalan: nakladnoydagi og'irlik bo'yicha tuzatish, xatolikni tuzatish)..."
              }
              value={editReasonModal.reason}
              onChange={(e) => setEditReasonModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 outline-none focus:border-rose-500 text-slate-900 dark:text-white"
            />

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
                disabled={!editReasonModal.reason.trim()}
                onClick={() => editReasonModal.onConfirm?.(editReasonModal.reason.trim())}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50"
              >
                {lang === 'ru' ? 'Подтвердить и сохранить' : 'Tasdiqlash va saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

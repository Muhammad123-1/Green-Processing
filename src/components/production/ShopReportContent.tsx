'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  FileSpreadsheet,
  Save,
  Download,
  Upload,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
  ChevronRight,
  Loader2,
  Package,
  CheckCircle2,
  Info,
  Calendar,
  X,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'
import ShopReportDayForm from './ShopReportDayForm'
import {
  EXPENSE_FIELDS,
  readExpenseRow,
  GP_FIELDS,
  readGPRow,
  getDayReport,
  hasReportData,
  isDateStr,
  toNum,
  formatDMY,
  formatLongDate,
} from '@/lib/shopReport'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// number <-> input helper: keep the raw string while typing (so "0.75" can be typed)
const inputVal = (v: any) => (v === 0 || v === null || v === undefined ? '' : v)

const formatMonthLabel = (ym: string, lang: string) => {
  if (!ym || ym.length < 7) return ym
  const [year, month] = ym.split('-')
  const uzMonths: Record<string, string> = {
    '01': 'Yanvar', '02': 'Fevral', '03': 'Mart', '04': 'Aprel',
    '05': 'May', '06': 'Iyun', '07': 'Iyul', '08': 'Avgust',
    '09': 'Sentabr', '10': 'Oktyabr', '11': 'Noyabr', '12': 'Dekabr'
  }
  const ruMonths: Record<string, string> = {
    '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
    '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
    '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
  }
  const name = (lang === 'ru' ? ruMonths[month] : uzMonths[month]) || month
  return `${name} ${year}`
}

export default function ShopReportContent() {
  const { lang } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'arrival' | 'expense' | 'gp' | 'report' | 'history'>('arrival')

  // Date format toggle: 'short' (DD.MM.YYYY) or 'long' (3-avgust, 2026 / 3 августа 2026 г.)
  const [dateFormatMode, setDateFormatMode] = useState<'short' | 'long'>('short')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shop_report_date_mode')
      if (saved === 'short' || saved === 'long') {
        setDateFormatMode(saved)
      }
    } catch {}
  }, [])

  // Raw DB data
  const [arrivals, setArrivals] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [gpList, setGpList] = useState<any[]>([])
  const [rawExpenses, setRawExpenses] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('')
  const [arrFilter, setArrFilter] = useState('')
  const [expFilter, setExpFilter] = useState('')
  const [gpFilter, setGpFilter] = useState('')
  const [reportDate, setReportDate] = useState(todayStr())
  const [historyFilterDate, setHistoryFilterDate] = useState('')
  const [historyType, setHistoryType] = useState<'arrival' | 'expense' | 'gp' | 'report'>('report')

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

  // Automatically discover all months present in data
  const availableMonths = useMemo(() => {
    const s = new Set<string>()
    arrivals.forEach((a) => {
      if (a.date && typeof a.date === 'string' && a.date.length >= 7) {
        s.add(a.date.slice(0, 7))
      }
    })
    expenses.forEach((e) => {
      if (e.date && typeof e.date === 'string' && e.date.length >= 7) {
        s.add(e.date.slice(0, 7))
      }
    })
    gpList.forEach((g) => {
      if (g.date && typeof g.date === 'string' && g.date.length >= 7) {
        s.add(g.date.slice(0, 7))
      }
    })
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [arrivals, expenses, gpList])

  const [savingArrivals, setSavingArrivals] = useState(false)
  const [savingExpenses, setSavingExpenses] = useState(false)
  const [savingGP, setSavingGP] = useState(false)

  // ---------------------------------------------------------------------------
  // Loading + history (Tab 4)
  // ---------------------------------------------------------------------------
  const buildHistory = (data: any) => {
    const hArr: any[] = []

    ;(data.expenses || []).forEach((e: any) => {
      const row = readExpenseRow(e)
      const hasMaterials = Object.keys(e.materials || {}).length > 0
      if (hasMaterials) {
        hArr.push({
          key: `expense-${e.date}`,
          type: 'expense',
          date: e.date,
          createdBy: e.balances?.expenseMeta?.updatedBy || 'Import',
          totalIceberg: row.iceberg || 0,
          totalTomatoes: row.tomatoes || 0,
        })
      }
      const report = getDayReport(e)
      if (hasReportData(report)) {
        hArr.push({
          key: `report-${e.date}`,
          type: 'report',
          date: e.date,
          createdBy: report?.updatedBy || '—',
          totalIceberg: toNum((report?.outputs?.['Салат Айсберг нарезанный'] as any)?.kg),
          totalTomatoes: toNum((report?.outputs?.['Томаты целые'] as any)?.kg),
        })
      }
    })

    const arrivalsByDate: Record<string, number[]> = {}
    ;(data.arrivals || []).forEach((a: any) => {
      if (!arrivalsByDate[a.date]) arrivalsByDate[a.date] = [0, 0]
      const name = String(a.nomenclature || '').toLowerCase()
      if (name.includes('айсберг')) arrivalsByDate[a.date][0] += a.quantity
      if (name.includes('томат')) arrivalsByDate[a.date][1] += a.quantity
    })
    Object.entries(arrivalsByDate).forEach(([date, vals]) => {
      hArr.push({
        key: `arrival-${date}`,
        type: 'arrival',
        date,
        createdBy: 'Import',
        totalIceberg: vals[0],
        totalTomatoes: vals[1],
      })
    })

    setHistory(hArr.sort((a, b) => b.date.localeCompare(a.date)))
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/shop-report', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Ma'lumotlarni yuklashda xatolik")
      setArrivals((data.arrivals || []).map((a: any) => ({ ...a })))
      setRawExpenses(data.expenses || [])
      setExpenses((data.expenses || []).map((e: any) => readExpenseRow(e)))
      setGpList((data.expenses || []).map((e: any) => readGPRow(e)))
      buildHistory(data)

      // Also fetch products catalog
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Tab 1: Приход (Avto-partiya hisoblash: har oy yangilanadi, har mahsulot uchun 1, 2, 3...)
  // ---------------------------------------------------------------------------
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

  const updateArrival = (idx: number, patch: any) =>
    setArrivals((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r
        const updated = { ...r, ...patch, _dirty: true }

        // If nomenclature or date changes and batch is empty or marked as auto, recalculate next batch
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

  const addArrival = () => {
    const targetDate = arrFilter || todayStr()
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

  const removeNewArrival = (idx: number) => setArrivals((prev) => prev.filter((_, i) => i !== idx))

  // Frequency of products in arrivals (count how many times each product has been received)
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

  // Unified product list, sorted from most frequent to least frequent (Ko'pdan kamga qarab)
  const sortedProducts = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; count: number; unit?: string }[] = []

    // 1. From arrivals frequency
    productFrequency.forEach((count, name) => {
      seen.add(name.toLowerCase())
      list.push({ name, count })
    })

    // 2. From product catalog (if not yet in arrivals)
    productList.forEach((p) => {
      const lower = (p.name || '').trim().toLowerCase()
      if (lower && !seen.has(lower)) {
        seen.add(lower)
        list.push({ name: p.name.trim(), count: 0, unit: p.unit })
      }
    })

    // Sort descending by count, then alphabetically
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

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newProductName.trim()
    if (!trimmed) {
      toast.error(lang === 'ru' ? 'Введите название продукта' : 'Mahsulot nomini kiriting')
      return
    }

    setIsSavingProduct(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          code: `PRD-${Date.now().toString().slice(-6)}`,
          unit: newProductUnit,
          category: newProductCategory,
          type: newProductCategory === 'Qadoq' ? 'PACKAGING' : 'RAW_MATERIAL',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Xatolik yuz berdi')

      // Add to local product list
      setProductList((prev) => [{ name: trimmed, unit: newProductUnit, category: newProductCategory }, ...prev])

      // If a row was targeted, set this product and compute its batch
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
        // If opened from top header without targeting a row, create a new row with this product!
        const targetDate = arrFilter || todayStr()
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

  const saveArrivals = async () => {
    // new rows that were left completely blank are simply dropped
    const rows = arrivals.filter((r) => r._dirty && !(r._new && !String(r.nomenclature || '').trim() && !toNum(r.quantity)))
    if (rows.length === 0) {
      setArrivals((prev) => prev.filter((r) => !(r._new && !String(r.nomenclature || '').trim() && !toNum(r.quantity))))
      return
    }
    if (rows.some((r) => !isDateStr(r.date))) {
      toast.error("Barcha o'zgargan qatorlarda sanani kiriting")
      return
    }
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
          })),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Saqlashda xatolik')
      toast.success(`Kirim saqlandi: ${j.updated} ta yangilandi, ${j.created} ta qo'shildi`)
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSavingArrivals(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Tab 2: Расход
  // ---------------------------------------------------------------------------
  const blankExpense = (date: string) => {
    const row: Record<string, any> = { date, _dirty: true, _new: true }
    EXPENSE_FIELDS.forEach((f) => (row[f.field] = ''))
    return row
  }

  const updateExpense = (idx: number, patch: any) =>
    setExpenses((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)))

  const addExpense = () => setExpenses((prev) => [blankExpense(expFilter || todayStr()), ...prev])

  const removeNewExpense = (idx: number) => setExpenses((prev) => prev.filter((_, i) => i !== idx))

  const dirtyExpenses = expenses.filter((r) => r._dirty).length

  const saveExpenses = async () => {
    const rows = expenses.filter((r) => r._dirty)
    if (rows.length === 0) return
    if (rows.some((r) => !isDateStr(r.date))) {
      toast.error("Barcha o'zgargan qatorlarda sanani kiriting")
      return
    }
    setSavingExpenses(true)
    try {
      const res = await fetch('/api/shop-report/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((r) => {
            const out: Record<string, any> = { date: r.date }
            EXPENSE_FIELDS.forEach((f) => (out[f.field] = toNum(r[f.field])))
            return out
          }),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Saqlashda xatolik')
      toast.success(`Chiqim saqlandi: ${j.saved} ta kun`)
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSavingExpenses(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Tab GP: Выпуск готовой продукции (ГП)
  // ---------------------------------------------------------------------------
  const blankGP = (date: string) => {
    const row: Record<string, any> = { date, _dirty: true, _new: true }
    GP_FIELDS.forEach((f) => (row[f.field] = ''))
    return row
  }

  const updateGP = (idx: number, patch: any) =>
    setGpList((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)))

  const addGP = () => setGpList((prev) => [blankGP(gpFilter || todayStr()), ...prev])

  const removeNewGP = (idx: number) => setGpList((prev) => prev.filter((_, i) => i !== idx))

  const dirtyGP = gpList.filter((r) => r._dirty).length

  const saveGP = async () => {
    const rows = gpList.filter((r) => r._dirty)
    if (rows.length === 0) return
    if (rows.some((r) => !isDateStr(r.date))) {
      toast.error("Barcha o'zgargan qatorlarda sanani kiriting")
      return
    }
    setSavingGP(true)
    try {
      const res = await fetch('/api/shop-report/gp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rows.map((r) => {
            const out: Record<string, any> = { date: r.date }
            GP_FIELDS.forEach((f) => (out[f.field] = toNum(r[f.field])))
            return out
          }),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Saqlashda xatolik')
      toast.success(`ГП (Tayyor mahsulot) saqlandi: ${j.saved} ta kun`)
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSavingGP(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Tab 3 helpers
  // ---------------------------------------------------------------------------
  const reportRecord = useMemo(() => rawExpenses.find((e) => e.date === reportDate) || null, [rawExpenses, reportDate])

  // End-of-day balances of the closest earlier saved report (hint for "start of day")
  const prevEnd = useMemo(() => {
    let best: { date: string; end: Record<string, number> } | null = null
    for (const e of rawExpenses) {
      if (!(e.date < reportDate)) continue
      const end = getDayReport(e)?.balances?.end
      if (end && Object.keys(end).length > 0 && (!best || e.date > best.date)) best = { date: e.date, end }
    }
    return best?.end || null
  }, [rawExpenses, reportDate])

  // ---------------------------------------------------------------------------
  // Import / Export / Archive navigation
  // ---------------------------------------------------------------------------
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
        const msg =
          lang === 'ru'
            ? `Успешно импортировано: +${data.arrivalsCount} новых приходов, обновлено: ${data.updatedArrivalsCount || 0}, дней расхода/ГП: ${data.importedDaysCount + data.updatedDaysCount}`
            : `Muvaffaqiyatli import qilindi: +${data.arrivalsCount} ta yangi kirim, ${data.updatedArrivalsCount || 0} ta yangilandi, ${data.importedDaysCount + data.updatedDaysCount} kunlik chiqim/GP saqlandi!`
        toast.success(msg)
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

  const exportToExcelReal = () => {
    window.location.href = '/api/shop-report/export'
  }

  const viewReport = (date: string, type: 'arrival' | 'expense' | 'gp' | 'report') => {
    if (type === 'arrival') setArrFilter(date)
    if (type === 'expense') setExpFilter(date)
    if (type === 'gp') setGpFilter(date)
    if (type === 'report') setReportDate(date)
    setActiveTab(type)
  }

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (historyType !== h.type) return false
      if (historyFilterDate && h.date !== historyFilterDate) return false
      return true
    })
  }, [history, historyType, historyFilterDate])

  const historyPagination = useInfiniteTable(filteredHistory, 12, [historyType, historyFilterDate])

  // Visible rows (keep original index so edits always hit the right row)
  const filteredArrivals = useMemo(() => {
    return arrivals
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (arrFilter && row.date !== arrFilter && row.date) return false
        if (selectedMonth && row.date && !row.date.startsWith(selectedMonth)) return false
        return true
      })
  }, [arrivals, arrFilter, selectedMonth])

  const arrivalsPagination = useInfiniteTable(filteredArrivals, 10, [arrFilter, selectedMonth])

  const filteredExpenses = useMemo(() => {
    return expenses
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (expFilter && row.date !== expFilter && row.date) return false
        if (selectedMonth && row.date && !row.date.startsWith(selectedMonth)) return false
        return true
      })
  }, [expenses, expFilter, selectedMonth])

  const expensesPagination = useInfiniteTable(filteredExpenses, 10, [expFilter, selectedMonth])

  const filteredGP = useMemo(() => {
    return gpList
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (gpFilter && row.date !== gpFilter && row.date) return false
        if (selectedMonth && row.date && !row.date.startsWith(selectedMonth)) return false
        return true
      })
  }, [gpList, gpFilter, selectedMonth])

  const gpPagination = useInfiniteTable(filteredGP, 10, [gpFilter, selectedMonth])

  const dateFilterInput = (value: string, onChange: (v: string) => void) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <select
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value)
          onChange('')
        }}
        className="bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none hover:border-amber-400 dark:hover:border-amber-500 transition-colors shadow-sm cursor-pointer"
        title={lang === 'ru' ? 'Выбрать месяц' : "Oyni tanlash"}
      >
        <option value="">{lang === 'ru' ? '📅 Все месяцы' : '📅 Barcha oylar'}</option>
        {availableMonths.map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m, lang)}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white dark:bg-dark-800 border border-amber-200 dark:border-amber-900 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm"
        title={lang === 'ru' ? 'Выбрать точный день' : "Aniq kunni tanlash"}
      />
      {(value || selectedMonth) && (
        <button
          onClick={() => {
            onChange('')
            setSelectedMonth('')
          }}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
          title={lang === 'ru' ? 'Сбросить фильтры' : "Filtrni tozalash"}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )

  const saveButton = (count: number, saving: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={saving || count === 0}
      className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20 disabled:opacity-40 disabled:shadow-none"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      Saqlash{count > 0 ? ` (${count})` : ''}
    </button>
  )

  return (
    <div className="flex flex-col min-h-full md:h-full space-y-3 md:space-y-4 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shadow-sm dark:shadow-inner shrink-0">
            <ClipboardListIcon size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-500/30">
                {lang === 'ru' ? 'Ежедневный журнал' : 'Kunlik jurnal'}
              </span>
            </div>
            <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {lang === 'ru' ? 'Производственный отчет ЦЕХ' : 'Sex Ishlab Chiqarish Hisoboti'}
            </h1>
            <p className="hidden sm:block text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {lang === 'ru'
                ? 'Формы ввода прихода, расхода и ежедневный отчет по выходу ГП'
                : "Kirim, chiqim jadvallari va tayyor mahsulot (GP) hisobotini to'ldirish"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>{lang === 'ru' ? 'Импорт Excel' : 'Excel Import'}</span>
          </button>
          <button
            onClick={exportToExcelReal}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition-colors shadow-sm"
          >
            <Download size={14} />
            <span>{lang === 'ru' ? 'Экспорт Excel' : 'Excel Export'}</span>
          </button>
          <button
            onClick={() => {
              const next = dateFormatMode === 'short' ? 'long' : 'short'
              setDateFormatMode(next)
              try {
                localStorage.setItem('shop_report_date_mode', next)
              } catch {}
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all border shadow-sm ${
              dateFormatMode === 'long'
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750'
            }`}
            title={
              dateFormatMode === 'short'
                ? (lang === 'ru' ? 'Переключить на словесный формат (с названием месяца)' : "Matnli sana formatiga o'tish (oy nomi bilan)")
                : (lang === 'ru' ? 'Переключить на числовой формат (ДД.ММ.ГГГГ)' : "Raqamli formatga o'tish (DD.MM.YYYY)")
            }
          >
            <Calendar size={14} />
            <span className="hidden xs:inline">{lang === 'ru' ? 'Формат:' : "Format:"}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold ${
                dateFormatMode === 'long'
                  ? 'bg-white text-amber-700'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
              }`}
            >
              {dateFormatMode === 'short'
                ? (lang === 'ru' ? 'ДД.ММ' : 'KUN.OY')
                : (lang === 'ru' ? 'Текст' : 'Matnli')}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-dark-900 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('arrival')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'arrival' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowDownToLine size={14} /> 1. Приход (Kirim)
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'expense' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowUpFromLine size={14} /> 2. Расход (Chiqim)
        </button>
        <button
          onClick={() => setActiveTab('gp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'gp' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <Package size={14} /> 3. ГП (Tayyor mahsulot)
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'report' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <Calculator size={14} /> 4. Отчет ЦЕХ (Hisobot)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white dark:bg-dark-700' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <FileSpreadsheet size={14} /> 5. Arxiv (Tarix)
        </button>
      </div>

      {/* Tab 1: Приход (Incoming) */}
      {activeTab === 'arrival' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-amber-500/10">
            <h2 className="text-xs sm:text-base font-black text-amber-600 uppercase tracking-tight">
              Приход (Kirim qilinayotgan mahsulotlar)
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {dateFilterInput(arrFilter, setArrFilter)}
              <button
                onClick={addArrival}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-2.5 py-1.5 rounded-lg hover:bg-amber-50"
              >
                + Qo&apos;shish
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetRowIdxForNewProduct(null)
                  setNewProductName('')
                  setNewProductModalOpen(true)
                }}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                title={lang === 'ru' ? 'Добавить новый продукт в каталог' : "Yangi mahsulotni katalogga qo'shish"}
              >
                <Plus size={13} />
                <span>{lang === 'ru' ? 'Новый продукт' : 'Yangi mahsulot'}</span>
              </button>
              {saveButton(dirtyArrivals, savingArrivals, saveArrivals)}
            </div>
          </div>
          <div className="flex-1 overflow-auto max-h-[72vh] md:max-h-none custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[660px] sm:min-w-[800px]">
              <thead className="bg-amber-500 text-white text-[10px] sm:text-xs font-bold uppercase sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 z-20 bg-amber-600 p-2 sm:p-3 border-r border-amber-700 w-[96px] min-w-[96px] sm:min-w-[130px]">
                    {dateFormatMode === 'long'
                      ? (lang === 'ru' ? 'Дата (мес.)' : 'Sana (oy)')
                      : (lang === 'ru' ? 'Дата' : 'Sana')}
                  </th>
                  <th className="p-2 sm:p-3 border-r border-amber-600 min-w-[160px] sm:min-w-[220px]">Номенклатура</th>
                  <th className="p-2 sm:p-3 border-r border-amber-600 text-right min-w-[90px] sm:min-w-[115px]">Количество</th>
                  <th className="p-2 sm:p-3 border-r border-amber-600 min-w-[140px] sm:min-w-[180px]">Поставщик</th>
                  <th className="p-2 sm:p-3 border-r border-amber-600 min-w-[105px] sm:min-w-[140px]">
                    <span>{lang === 'ru' ? 'Партия' : 'Partiya'}</span>
                  </th>
                  <th className="p-2 sm:p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                        <span className="font-bold text-slate-500 text-sm">
                          {lang === 'ru' ? 'Загрузка данных прихода...' : "Kirim ma'lumotlari yuklanmoqda..."}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lang === 'ru' ? 'Пожалуйста, подождите...' : "Iltimos, kuting..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : arrivalsPagination.displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                      {arrFilter ? "Bu sanada kirim yo'q. \"+ Qo'shish\" orqali yangi kirim kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                ) : null}
                {arrivalsPagination.displayedItems.map(({ row, idx }) => (
                  <tr
                    key={row.id ?? `new-${idx}`}
                    className={`hover:bg-amber-50/40 ${row._dirty ? 'bg-amber-50' : 'bg-white'}`}
                  >
                    <td className="sticky left-0 z-10 bg-amber-50 p-1 border-r border-slate-200 shadow-[inset_-1px_0_0_#e2e8f0]">
                      {row._new ? (
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateArrival(idx, { date: e.target.value })}
                          className="excel-input w-full px-1.5 py-1 text-[11px] sm:text-xs font-semibold outline-none"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 px-1.5 py-1 group rounded hover:bg-amber-100/70 transition-colors">
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-900 whitespace-nowrap">
                            {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                          </span>
                          <label
                            className="relative cursor-pointer p-1 rounded hover:bg-amber-200/60 text-slate-500 hover:text-amber-700 transition-colors"
                            title={lang === 'ru' ? 'Изменить дату' : "Sanani o'zgartirish"}
                          >
                            <Calendar size={12} />
                            <input
                              type="date"
                              value={row.date || ''}
                              onChange={(e) => updateArrival(idx, { date: e.target.value })}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>
                      )}
                    </td>
                    <td className="p-1 border-r border-slate-200 relative">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder={lang === 'ru' ? 'Томат, Айсберг...' : 'Aysberg, Pomidor...'}
                          value={row.nomenclature || ''}
                          onFocus={() => setActiveDropdownIdx(idx)}
                          onChange={(e) => {
                            updateArrival(idx, { nomenclature: e.target.value })
                            if (activeDropdownIdx !== idx) setActiveDropdownIdx(idx)
                          }}
                          className="excel-input w-full min-w-[140px] px-2 py-1.5 text-xs font-medium outline-none pr-6"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTargetRowIdxForNewProduct(idx)
                            setNewProductName(row.nomenclature || '')
                            setNewProductModalOpen(true)
                            setActiveDropdownIdx(null)
                          }}
                          title={lang === 'ru' ? 'Добавить новый продукт' : "Yangi mahsulot qo'shish"}
                          className="absolute right-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100 p-0.5 rounded transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Dropdown list of products (sorted from most frequent to least frequent) */}
                      {activeDropdownIdx === idx && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveDropdownIdx(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-h-64 overflow-y-auto bg-white dark:bg-dark-850 rounded-2xl shadow-2xl border border-amber-300 dark:border-dark-700 z-40 p-1.5 custom-scrollbar">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetRowIdxForNewProduct(idx)
                                setNewProductName(row.nomenclature || '')
                                setNewProductModalOpen(true)
                                setActiveDropdownIdx(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs mb-1.5"
                            >
                              <Plus size={14} className="shrink-0" />
                              <span>{lang === 'ru' ? '+ Добавить новый продукт' : '+ Yangi mahsulot qo‘shish'}</span>
                            </button>

                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <span>{lang === 'ru' ? 'Часто используемые' : 'Mavjud mahsulotlar (Ko‘pdan kamga)'}</span>
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

                              {row.nomenclature?.trim() &&
                                !sortedProducts.some(
                                  (p) => p.name.toLowerCase() === row.nomenclature.trim().toLowerCase()
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetRowIdxForNewProduct(idx)
                                      setNewProductName(row.nomenclature.trim())
                                      setNewProductModalOpen(true)
                                      setActiveDropdownIdx(null)
                                    }}
                                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-dashed border-amber-300 flex items-center gap-1.5 mt-1"
                                  >
                                    <Sparkles size={13} className="shrink-0 text-amber-500" />
                                    <span className="truncate">
                                      {lang === 'ru'
                                        ? `Создать «${row.nomenclature.trim()}» как новый`
                                        : `«${row.nomenclature.trim()}» ni yangi mahsulot qilib ochish`}
                                    </span>
                                  </button>
                                )}
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        step="any"
                        value={inputVal(row.quantity)}
                        onChange={(e) => updateArrival(idx, { quantity: e.target.value })}
                        className="excel-input w-full min-w-[75px] px-2 py-1.5 text-xs font-mono font-bold text-right text-amber-700 outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        placeholder="Turk shanay biznes"
                        value={row.supplier || ''}
                        onChange={(e) => updateArrival(idx, { supplier: e.target.value })}
                        className="excel-input w-full min-w-[125px] px-2 py-1.5 text-xs outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="Партия"
                          value={row.batch || ''}
                          onChange={(e) => updateArrival(idx, { batch: e.target.value })}
                          className="excel-input w-full min-w-[90px] px-2 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none pr-6"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextB = computeNextBatch(arrivals, row.nomenclature, row.date)
                            updateArrival(idx, { batch: nextB })
                            toast.info(lang === 'ru' ? `Партия: #${nextB}` : `Partiya: #${nextB}`)
                          }}
                          title={lang === 'ru' ? "Пересчитать партию (с 1 в начале месяца)" : "Partiyani hisoblash (har oy boshidan 1)"}
                          className="absolute right-1 text-amber-500 hover:text-amber-700 hover:bg-amber-100 p-0.5 rounded transition-colors text-[10px] font-bold"
                        >
                          ⚡
                        </button>
                      </div>
                    </td>
                    <td className="p-1 text-center">
                      {row._new && (
                        <button
                          onClick={() => removeNewArrival(idx)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                          title="Yangi qatorni o'chirish"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <InfiniteTableFooter
              currentCount={arrivalsPagination.visibleCount}
              totalCount={arrivalsPagination.totalCount}
              hasMore={arrivalsPagination.hasMore}
              showAll={arrivalsPagination.showAll}
              onLoadMore={arrivalsPagination.loadMore}
              onToggleShowAll={arrivalsPagination.toggleShowAll}
              sentinelRef={arrivalsPagination.sentinelRef}
              pageSize={10}
              itemName={{ uz: 'kirim qatori', ru: 'строк прихода', en: 'arrival rows' }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Расход (Expense) */}
      {activeTab === 'expense' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-amber-500/10">
            <h2 className="text-xs sm:text-base font-black text-amber-600 uppercase tracking-tight">
              Расход (Ishlatilgan xomashyo va materiallar)
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {dateFilterInput(expFilter, setExpFilter)}
              <button
                onClick={addExpense}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-2.5 py-1.5 rounded-lg hover:bg-amber-50"
              >
                + Qo&apos;shish
              </button>
              {saveButton(dirtyExpenses, savingExpenses, saveExpenses)}
            </div>
          </div>
          <div className="flex-1 overflow-auto max-h-[72vh] md:max-h-none custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="bg-[#FFE699] text-slate-900 text-[10px] font-bold uppercase sticky top-0 z-20 border-b border-amber-300">
                <tr>
                  <th className="sticky left-0 z-20 p-2 border-r border-amber-300 shadow-[inset_-1px_0_0_#fcd34d] w-[92px] min-w-[92px] sm:min-w-[125px] bg-amber-200 text-slate-900">
                    {dateFormatMode === 'long'
                      ? (lang === 'ru' ? 'Число (мес.)' : 'Sana (oy)')
                      : (lang === 'ru' ? 'Число' : 'Sana')}
                  </th>
                  {EXPENSE_FIELDS.map((f) => (
                    <th
                      key={f.field}
                      className={`p-1.5 sm:p-2 border-r border-amber-300 min-w-[78px] sm:min-w-[90px] text-center leading-tight ${f.field === 'ses' || f.field === 'kitchen' ? 'bg-[#92D050] text-black' : 'text-slate-900'}`}
                    >
                      {f.label}
                      <br />
                      <span className="font-normal text-[8px]">{f.unit}</span>
                    </th>
                  ))}
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/70 bg-[#FFFBF0] text-slate-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={EXPENSE_FIELDS.length + 2} className="p-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                        <span className="font-bold text-slate-500 text-sm">
                          {lang === 'ru' ? 'Загрузка данных расхода...' : "Chiqim ma'lumotlari yuklanmoqda..."}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lang === 'ru' ? 'Пожалуйста, подождите...' : "Iltimos, kuting..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : expensesPagination.displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={EXPENSE_FIELDS.length + 2} className="p-8 text-center text-sm text-slate-500">
                      {expFilter ? "Bu sanada chiqim yo'q. \"+ Qo'shish\" orqali yangi kun kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                ) : null}
                {expensesPagination.displayedItems.map(({ row, idx }) => (
                  <tr
                    key={row._new ? `new-${idx}` : row.date}
                    className={`hover:bg-amber-100/50 ${row._dirty ? 'bg-amber-100/80' : 'bg-[#FFFBF0]'}`}
                  >
                    <td className="sticky left-0 z-10 p-1 border-r border-amber-200 shadow-[inset_-1px_0_0_#fde68a] bg-[#FFF3CD] text-slate-900">
                      {row._new ? (
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateExpense(idx, { date: e.target.value })}
                          className="excel-input w-full px-1 py-1 text-[11px] font-bold outline-none"
                        />
                      ) : (
                        <div className="px-1.5 py-1 text-[11px] font-bold text-slate-900 whitespace-nowrap">
                          {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                        </div>
                      )}
                    </td>
                    {EXPENSE_FIELDS.map((f) => {
                      const defect = f.field === 'boxDefect' || f.field === 'bagDefect'
                      const green = f.field === 'ses' || f.field === 'kitchen'
                      return (
                        <td
                          key={f.field}
                          className={`p-1 border-r border-amber-200/70 ${defect ? 'bg-red-50' : ''} ${green ? 'bg-green-50' : ''}`}
                        >
                          <input
                            type="number"
                            step="any"
                            value={inputVal(row[f.field])}
                            onChange={(e) => updateExpense(idx, { [f.field]: e.target.value })}
                            className={`excel-input w-full min-w-[68px] px-1.5 py-1 text-[11px] font-mono font-bold text-right outline-none ${defect ? 'text-red-600' : 'text-slate-900'}`}
                          />
                        </td>
                      )
                    })}
                    <td className="p-1 text-center">
                      {row._new && (
                        <button
                          onClick={() => removeNewExpense(idx)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                          title="Yangi qatorni o'chirish"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <InfiniteTableFooter
              currentCount={expensesPagination.visibleCount}
              totalCount={expensesPagination.totalCount}
              hasMore={expensesPagination.hasMore}
              showAll={expensesPagination.showAll}
              onLoadMore={expensesPagination.loadMore}
              onToggleShowAll={expensesPagination.toggleShowAll}
              sentinelRef={expensesPagination.sentinelRef}
              pageSize={10}
              itemName={{ uz: 'chiqim kuni', ru: 'дней расхода', en: 'expense days' }}
            />
          </div>
        </div>
      )}

      {/* Tab GP: Выпуск готовой продукции (ГП) */}
      {activeTab === 'gp' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-emerald-500/10">
            <h2 className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-1.5">
              <Package size={16} />
              <span>ГП (Выпуск готовой продукции)</span>
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {dateFilterInput(gpFilter, setGpFilter)}
              <button
                onClick={addGP}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
              >
                + Qo&apos;shish
              </button>
              {saveButton(dirtyGP, savingGP, saveGP)}
            </div>
          </div>
          <div className="flex-1 overflow-auto max-h-[72vh] md:max-h-none custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="bg-[#70AD47] text-white text-[10px] font-bold uppercase sticky top-0 z-20 border-b border-emerald-600">
                <tr>
                  <th className="sticky left-0 z-20 p-2 border-r border-emerald-600 w-[92px] min-w-[92px] sm:min-w-[125px] bg-[#548235] text-white">
                    {dateFormatMode === 'long'
                      ? (lang === 'ru' ? 'Дата (мес.)' : 'Sana (oy)')
                      : (lang === 'ru' ? 'Дата' : 'Sana')}
                  </th>
                  {GP_FIELDS.map((f) => (
                    <th key={f.field} className="p-1.5 sm:p-2 border-r border-emerald-600/80 text-center min-w-[82px] sm:min-w-[95px] leading-tight">
                      {f.label}
                      <br />
                      <span className="font-normal text-[8px]">({f.unit})</span>
                    </th>
                  ))}
                  <th className="p-2 border-r border-emerald-600/80 text-center min-w-[78px] bg-[#548235] text-white">ИТОГО</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={GP_FIELDS.length + 3} className="p-12 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="font-bold text-slate-500 text-sm">
                          {lang === 'ru' ? 'Загрузка данных выпуска ГП...' : "ГП (tayyor mahsulot) ma'lumotlari yuklanmoqda..."}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lang === 'ru' ? 'Пожалуйста, подождите...' : "Iltimos, kuting..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : gpPagination.displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={GP_FIELDS.length + 3} className="p-8 text-center text-sm text-slate-500">
                      {gpFilter ? "Bu sanada ГП yozuvi yo'q. \"+ Qo'shish\" orqali yangi kun kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                ) : null}
                {gpPagination.displayedItems.map(({ row, idx }) => {
                  const rowSum = GP_FIELDS.reduce((acc, f) => acc + toNum(row[f.field]), 0)
                  return (
                    <tr
                      key={row._new ? `new-${idx}` : row.date}
                      className={`hover:bg-emerald-50/50 ${row._dirty ? 'bg-emerald-100/60' : 'bg-white'}`}
                    >
                      <td className="sticky left-0 z-10 p-1 border-r border-slate-200 shadow-[inset_-1px_0_0_#e2e8f0] bg-emerald-50 text-slate-900">
                        {row._new ? (
                          <input
                            type="date"
                            value={row.date || ''}
                            onChange={(e) => updateGP(idx, { date: e.target.value })}
                            className="excel-input w-full px-1 py-1 text-[11px] font-bold outline-none"
                          />
                        ) : (
                          <div className="px-1.5 py-1 text-[11px] font-bold text-slate-900 whitespace-nowrap">
                            {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                          </div>
                        )}
                      </td>
                      {GP_FIELDS.map((f) => (
                        <td key={f.field} className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="any"
                            value={inputVal(row[f.field])}
                            onChange={(e) => updateGP(idx, { [f.field]: e.target.value })}
                            className="excel-input w-full min-w-[68px] px-1.5 py-1 text-[11px] font-mono font-bold text-right outline-none text-slate-900"
                          />
                        </td>
                      ))}
                      <td className="p-1 border-r border-slate-200 text-right font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50/60 pr-2">
                        {rowSum > 0 ? rowSum.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="p-1 text-center">
                        {row._new && (
                          <button
                            onClick={() => removeNewGP(idx)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                            title="Yangi qatorni o'chirish"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <InfiniteTableFooter
              currentCount={gpPagination.visibleCount}
              totalCount={gpPagination.totalCount}
              hasMore={gpPagination.hasMore}
              showAll={gpPagination.showAll}
              onLoadMore={gpPagination.loadMore}
              onToggleShowAll={gpPagination.toggleShowAll}
              sentinelRef={gpPagination.sentinelRef}
              pageSize={10}
              itemName={{ uz: 'GP kuni', ru: 'дней ГП', en: 'GP days' }}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Отчет ЦЕХ (Report Form) */}
      {activeTab === 'report' && (
        <ShopReportDayForm
          date={reportDate}
          onDateChange={setReportDate}
          record={reportRecord}
          prevEnd={prevEnd}
          onSaved={loadData}
        />
      )}

      {/* Tab 4: Arxiv (History) */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mr-4">Saqlangan Arxivlar</h2>
              <div className="flex overflow-x-auto max-w-full bg-slate-100 dark:bg-dark-800 rounded-xl p-1">
                <button
                  onClick={() => setHistoryType('arrival')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'arrival' ? 'bg-white dark:bg-dark-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Приход (Kirim)
                </button>
                <button
                  onClick={() => setHistoryType('expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'expense' ? 'bg-white dark:bg-dark-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Расход (Chiqim)
                </button>
                <button
                  onClick={() => setHistoryType('report')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'report' ? 'bg-white dark:bg-dark-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Отчет ЦЕХ (Hisobot)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
              />
              {historyFilterDate && (
                <button
                  onClick={() => setHistoryFilterDate('')}
                  className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin text-amber-500" size={36} />
                  <span className="font-bold text-slate-300 text-sm">
                    {lang === 'ru' ? 'Загрузка архива...' : "Arxiv ma'lumotlari yuklanmoqda..."}
                  </span>
                  <span className="text-xs text-slate-400">
                    {lang === 'ru' ? 'Пожалуйста, подождите...' : "Iltimos, kuting..."}
                  </span>
                </div>
              ) : historyPagination.displayedItems.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                  Bu turdagi yoki sanadagi arxiv topilmadi.
                </div>
              ) : (
                historyPagination.displayedItems.map((h) => (
                  <div
                    key={h.key}
                    className="border border-slate-200 dark:border-dark-750 rounded-xl p-4 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 dark:bg-dark-800/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            h.type === 'arrival'
                              ? 'text-blue-700 bg-blue-100'
                              : h.type === 'expense'
                                ? 'text-rose-700 bg-rose-100'
                                : 'text-amber-700 bg-amber-100'
                          }`}
                        >
                          {h.type === 'arrival' ? 'Приход' : h.type === 'expense' ? 'Расход' : 'Отчет ЦЕХ'}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                          {dateFormatMode === 'long' ? formatLongDate(h.date, lang) : formatDMY(h.date)}
                        </h3>
                      </div>
                      <div className="bg-slate-200 dark:bg-dark-700 w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {String(h.createdBy || '?').charAt(0)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4 border-t border-slate-200 dark:border-dark-750 pt-3">
                      <div className="flex justify-between">
                        <span>Aysberg miqdori:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{h.totalIceberg} кг</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tomat miqdori:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{h.totalTomatoes} кг</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kirituvchi xodim:</span>
                        <span className="font-bold">{h.createdBy}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => viewReport(h.date, h.type)}
                      className="w-full py-2 bg-slate-100 dark:bg-dark-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                    >
                      <span>Ko'rish</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <InfiniteTableFooter
              currentCount={historyPagination.visibleCount}
              totalCount={historyPagination.totalCount}
              hasMore={historyPagination.hasMore}
              showAll={historyPagination.showAll}
              onLoadMore={historyPagination.loadMore}
              onToggleShowAll={historyPagination.toggleShowAll}
              sentinelRef={historyPagination.sentinelRef}
              pageSize={12}
              itemName={{ uz: 'arxiv hujjati', ru: 'архивных документов', en: 'archive records' }}
            />
          </div>
        </div>
      )}

      {/* MODAL: YANGI MAHSULOT QO'SHISH (NEW PRODUCT) */}
      {newProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter"
          onClick={() => setNewProductModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'ru' ? 'Добавить новый продукт' : 'Yangi mahsulot qo‘shish'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ru'
                      ? 'Продукт добавится в каталог и выберется в приход'
                      : 'Mahsulot katalogga saqlanadi va partiya avto biriktiriladi'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewProductModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'ru' ? 'Название продукта' : 'Mahsulot nomi'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={lang === 'ru' ? 'Например: Томаты черри, Брокколи...' : 'Masalan: Pomidor cherri, Brokkoli...'}
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ru' ? 'Единица измерения' : 'O‘lchov birligi'}
                  </label>
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="kg">kg (Kilogramm)</option>
                    <option value="dona">dona (Shtuka)</option>
                    <option value="litr">litr (Litr)</option>
                    <option value="qop">qop (Qop)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ru' ? 'Категория' : 'Kategoriya'}
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Xomashyo">Xomashyo (Sabzavot)</option>
                    <option value="Qadoq">Qadoq / Idish</option>
                    <option value="Yarim tayyor">Yarim tayyor mahsulot</option>
                    <option value="Tayyor mahsulot">Tayyor mahsulot (ГП)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setNewProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                >
                  {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingProduct ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>{lang === 'ru' ? 'Сохранить и выбрать' : 'Saqlash va Tanlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ClipboardListIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}

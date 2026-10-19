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
  HelpCircle,
  CheckCircle2,
  Info,
  Calendar,
  X,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
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
} from '@/lib/shopReport'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ARRIVAL_PAGE = 300
const EXPENSE_PAGE = 200

// number <-> input helper: keep the raw string while typing (so "0.75" can be typed)
const inputVal = (v: any) => (v === 0 || v === null || v === undefined ? '' : v)

export default function ShopReportContent() {
  const { lang } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'arrival' | 'expense' | 'gp' | 'report' | 'history'>('arrival')

  // Raw DB data
  const [arrivals, setArrivals] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [gpList, setGpList] = useState<any[]>([])
  const [rawExpenses, setRawExpenses] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  // Filters
  const [arrFilter, setArrFilter] = useState('')
  const [expFilter, setExpFilter] = useState('')
  const [gpFilter, setGpFilter] = useState('')
  const [reportDate, setReportDate] = useState(todayStr())
  const [historyFilterDate, setHistoryFilterDate] = useState('')
  const [historyType, setHistoryType] = useState<'arrival' | 'expense' | 'gp' | 'report'>('report')

  const [savingArrivals, setSavingArrivals] = useState(false)
  const [savingExpenses, setSavingExpenses] = useState(false)
  const [savingGP, setSavingGP] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

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
    try {
      const res = await fetch('/api/shop-report', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Ma'lumotlarni yuklashda xatolik")
      setArrivals((data.arrivals || []).map((a: any) => ({ ...a })))
      setRawExpenses(data.expenses || [])
      setExpenses((data.expenses || []).map((e: any) => readExpenseRow(e)))
      setGpList((data.expenses || []).map((e: any) => readGPRow(e)))
      buildHistory(data)
    } catch (e: any) {
      toast.error(e?.message || "Ma'lumotlarni yuklashda xatolik")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Tab 1: Приход
  // ---------------------------------------------------------------------------
  const updateArrival = (idx: number, patch: any) =>
    setArrivals((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)))

  const addArrival = () =>
    setArrivals((prev) => [
      { date: arrFilter || todayStr(), nomenclature: '', quantity: '', supplier: '', batch: '', _dirty: true, _new: true },
      ...prev,
    ])

  const removeNewArrival = (idx: number) => setArrivals((prev) => prev.filter((_, i) => i !== idx))

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
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Импортировано успешно!' : 'Muvaffaqiyatli import qilindi!')
        await loadData()
      } else {
        toast.error('Xatolik yuz berdi')
      }
    } catch (err) {
      toast.error('Xatolik yuz berdi')
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

  const filteredHistory = history.filter((h) => {
    if (historyType !== h.type) return false
    if (historyFilterDate && h.date !== historyFilterDate) return false
    return true
  })

  // Visible rows (keep original index so edits always hit the right row)
  const visibleArrivals = useMemo(() => {
    const list = arrivals
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !arrFilter || row.date === arrFilter || !row.date)
    return arrFilter ? list : list.slice(0, ARRIVAL_PAGE + dirtyArrivals)
  }, [arrivals, arrFilter, dirtyArrivals])

  const visibleExpenses = useMemo(() => {
    const list = expenses
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !expFilter || row.date === expFilter || !row.date)
    return expFilter ? list : list.slice(0, EXPENSE_PAGE + dirtyExpenses)
  }, [expenses, expFilter, dirtyExpenses])

  const visibleGP = useMemo(() => {
    const list = gpList
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !gpFilter || row.date === gpFilter || !row.date)
    return gpFilter ? list : list.slice(0, EXPENSE_PAGE + dirtyGP)
  }, [gpList, gpFilter, dirtyGP])

  const dateFilterInput = (value: string, onChange: (v: string) => void) => (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white dark:bg-dark-800 border border-amber-200 dark:border-amber-900 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
        title="Sana bo'yicha qidirish"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
          title="Filterni tozalash"
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
    <div className="flex flex-col h-full space-y-5 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shadow-sm dark:shadow-inner">
            <ClipboardListIcon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-500/30">
                {lang === 'ru' ? 'Ежедневный журнал' : 'Kunlik jurnal'}
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'ru' ? 'Производственный отчет ЦЕХ' : 'Sex Ishlab Chiqarish Hisoboti'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {lang === 'ru'
                ? 'Формы ввода прихода, расхода и ежедневный отчет по выходу ГП'
                : "Kirim, chiqim jadvallari va tayyor mahsulot (GP) hisobotini to'ldirish"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            <span>{lang === 'ru' ? 'Импорт Excel' : 'Excel Import'}</span>
          </button>
          <button
            onClick={exportToExcelReal}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <Download size={15} />
            <span>{lang === 'ru' ? 'Экспорт Excel' : 'Excel Export'}</span>
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
            title={lang === 'ru' ? 'Справка по форматам дат и импорту' : "Sana formati va import bo'yicha qo'llanma"}
          >
            <HelpCircle size={15} />
            <span>{lang === 'ru' ? 'Справка (Формат дат)' : "Sana formati (Qo'llanma)"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('arrival')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'arrival' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowDownToLine size={16} /> 1. Приход (Kirim)
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'expense' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowUpFromLine size={16} /> 2. Расход (Chiqim)
        </button>
        <button
          onClick={() => setActiveTab('gp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'gp' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <Package size={16} /> 3. ГП (Tayyor mahsulot)
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'report' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <Calculator size={16} /> 4. Отчет ЦЕХ (Hisobot)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white dark:bg-dark-700' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <FileSpreadsheet size={16} /> 5. Arxiv (Tarix)
        </button>
      </div>

      {/* Tab 1: Приход (Incoming) */}
      {activeTab === 'arrival' && (
        <div className="flex-1 min-h-0 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 bg-amber-500/10">
            <h2 className="text-base font-black text-amber-600 uppercase tracking-tight">
              Приход (Kirim qilinayotgan mahsulotlar)
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {dateFilterInput(arrFilter, setArrFilter)}
              <button
                onClick={addArrival}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50"
              >
                + Qo'shish
              </button>
              {saveButton(dirtyArrivals, savingArrivals, saveArrivals)}
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-amber-500 text-white text-xs font-bold uppercase sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-r border-amber-600">Дата</th>
                  <th className="p-3 border-r border-amber-600">Номенклатура</th>
                  <th className="p-3 border-r border-amber-600 text-right">Количество</th>
                  <th className="p-3 border-r border-amber-600">Поставщик</th>
                  <th className="p-3 border-r border-amber-600">Партии</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                {visibleArrivals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                      {arrFilter ? "Bu sanada kirim yo'q. \"+ Qo'shish\" orqali yangi kirim kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                )}
                {visibleArrivals.map(({ row, idx }) => (
                  <tr
                    key={row.id ?? `new-${idx}`}
                    className={`hover:bg-slate-50 dark:hover:bg-dark-800/50 ${row._dirty ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}
                  >
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="date"
                        value={row.date || ''}
                        onChange={(e) => updateArrival(idx, { date: e.target.value })}
                        className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="Томат..."
                        value={row.nomenclature || ''}
                        onChange={(e) => updateArrival(idx, { nomenclature: e.target.value })}
                        className="w-full bg-transparent px-2 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="number"
                        step="any"
                        value={inputVal(row.quantity)}
                        onChange={(e) => updateArrival(idx, { quantity: e.target.value })}
                        className="w-full bg-transparent px-2 py-1.5 text-xs font-mono font-bold text-right text-amber-700 dark:text-amber-500 outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="Turk shanay biznes"
                        value={row.supplier || ''}
                        onChange={(e) => updateArrival(idx, { supplier: e.target.value })}
                        className="w-full bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="Партия"
                        value={row.batch || ''}
                        onChange={(e) => updateArrival(idx, { batch: e.target.value })}
                        className="w-full bg-transparent px-2 py-1.5 text-xs font-mono text-slate-900 dark:text-white outline-none"
                      />
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
            {!arrFilter && arrivals.length > visibleArrivals.length && (
              <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-dark-800">
                Oxirgi {visibleArrivals.length} ta qator ko'rsatilmoqda (jami {arrivals.length}). Boshqa kunni ko'rish uchun yuqoridan sanani tanlang.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Расход (Expense) */}
      {activeTab === 'expense' && (
        <div className="flex-1 min-h-0 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 bg-amber-500/10">
            <h2 className="text-base font-black text-amber-600 uppercase tracking-tight">
              Расход (Ishlatilgan xomashyo va materiallar)
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {dateFilterInput(expFilter, setExpFilter)}
              <button
                onClick={addExpense}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50"
              >
                + Qo'shish
              </button>
              {saveButton(dirtyExpenses, savingExpenses, saveExpenses)}
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#FFE699] dark:bg-amber-900/40 text-slate-900 dark:text-amber-100 text-[10px] font-bold uppercase sticky top-0 z-10 border-b border-amber-300 dark:border-amber-700">
                <tr>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50 w-32 bg-amber-200 dark:bg-amber-800">Число</th>
                  {EXPENSE_FIELDS.map((f) => (
                    <th
                      key={f.field}
                      className={`p-2 border-r border-amber-300 dark:border-amber-700/50 ${f.field === 'ses' || f.field === 'kitchen' ? 'bg-[#92D050] text-black' : ''}`}
                    >
                      {f.label}
                      <br />
                      <span className="font-normal text-[8px]">{f.unit}</span>
                    </th>
                  ))}
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-750 bg-[#FFFBF0] dark:bg-transparent">
                {visibleExpenses.length === 0 && (
                  <tr>
                    <td colSpan={EXPENSE_FIELDS.length + 2} className="p-8 text-center text-sm text-slate-500">
                      {expFilter ? "Bu sanada chiqim yo'q. \"+ Qo'shish\" orqali yangi kun kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                )}
                {visibleExpenses.map(({ row, idx }) => (
                  <tr
                    key={row._new ? `new-${idx}` : row.date}
                    className={`hover:bg-amber-50 dark:hover:bg-dark-800/50 ${row._dirty ? 'bg-amber-100/70 dark:bg-amber-500/10' : ''}`}
                  >
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-amber-100/50 dark:bg-amber-900/20">
                      <input
                        type="date"
                        value={row.date || ''}
                        readOnly={!row._new}
                        onChange={(e) => updateExpense(idx, { date: e.target.value })}
                        className="w-full bg-transparent px-1 py-1 text-[11px] font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </td>
                    {EXPENSE_FIELDS.map((f) => {
                      const defect = f.field === 'boxDefect' || f.field === 'bagDefect'
                      const green = f.field === 'ses' || f.field === 'kitchen'
                      return (
                        <td
                          key={f.field}
                          className={`p-1 border-r border-slate-200 dark:border-dark-750 ${defect ? 'bg-red-50 dark:bg-red-900/10' : ''} ${green ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                        >
                          <input
                            type="number"
                            step="any"
                            value={inputVal(row[f.field])}
                            onChange={(e) => updateExpense(idx, { [f.field]: e.target.value })}
                            className={`w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right outline-none ${defect ? 'text-red-600' : 'text-slate-800 dark:text-slate-300'}`}
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
            {!expFilter && expenses.length > visibleExpenses.length && (
              <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-dark-800">
                Oxirgi {visibleExpenses.length} ta kun ko'rsatilmoqda (jami {expenses.length}). Boshqa kunni ko'rish uchun yuqoridan sanani tanlang.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab GP: Выпуск готовой продукции (ГП) */}
      {activeTab === 'gp' && (
        <div className="flex-1 min-h-0 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 bg-emerald-500/10">
            <h2 className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-2">
              <Package size={18} />
              <span>ГП (Выпуск готовой продукции)</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {dateFilterInput(gpFilter, setGpFilter)}
              <button
                onClick={addGP}
                className="text-xs font-bold bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-lg hover:bg-emerald-50"
              >
                + Qo&apos;shish
              </button>
              {saveButton(dirtyGP, savingGP, saveGP)}
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#70AD47] text-white text-[10px] font-bold uppercase sticky top-0 z-10 border-b border-emerald-600">
                <tr>
                  <th className="p-2 border-r border-emerald-600 w-32 bg-[#548235] text-white">Дата</th>
                  {GP_FIELDS.map((f) => (
                    <th key={f.field} className="p-2 border-r border-emerald-600/80 text-center">
                      {f.label}
                      <br />
                      <span className="font-normal text-[8px]">({f.unit})</span>
                    </th>
                  ))}
                  <th className="p-2 border-r border-emerald-600/80 text-center bg-[#548235] text-white">ИТОГО</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-750 bg-white dark:bg-transparent">
                {visibleGP.length === 0 && (
                  <tr>
                    <td colSpan={GP_FIELDS.length + 3} className="p-8 text-center text-sm text-slate-500">
                      {gpFilter ? "Bu sanada ГП yozuvi yo'q. \"+ Qo'shish\" orqali yangi kun kiriting." : "Ma'lumot yo'q"}
                    </td>
                  </tr>
                )}
                {visibleGP.map(({ row, idx }) => {
                  const rowSum = GP_FIELDS.reduce((acc, f) => acc + toNum(row[f.field]), 0)
                  return (
                    <tr
                      key={row._new ? `new-${idx}` : row.date}
                      className={`hover:bg-emerald-50/50 dark:hover:bg-dark-800/50 ${row._dirty ? 'bg-emerald-100/60 dark:bg-emerald-500/10' : ''}`}
                    >
                      <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-emerald-50/60 dark:bg-emerald-900/10">
                        <input
                          type="date"
                          value={row.date || ''}
                          readOnly={!row._new}
                          onChange={(e) => updateGP(idx, { date: e.target.value })}
                          className="w-full bg-transparent px-1 py-1 text-[11px] font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </td>
                      {GP_FIELDS.map((f) => (
                        <td key={f.field} className="p-1 border-r border-slate-200 dark:border-dark-750">
                          <input
                            type="number"
                            step="any"
                            value={inputVal(row[f.field])}
                            onChange={(e) => updateGP(idx, { [f.field]: e.target.value })}
                            className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right outline-none text-slate-800 dark:text-slate-300"
                          />
                        </td>
                      ))}
                      <td className="p-1 border-r border-slate-200 dark:border-dark-750 text-right font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20 pr-2">
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
            {!gpFilter && gpList.length > visibleGP.length && (
              <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-dark-800">
                Oxirgi {visibleGP.length} ta kun ko&apos;rsatilmoqda (jami {gpList.length}). Boshqa kunni ko&apos;rish uchun yuqoridan sanani tanlang.
              </div>
            )}
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
        <div className="flex-1 min-h-0 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mr-4">Saqlangan Arxivlar</h2>
              <div className="flex bg-slate-100 dark:bg-dark-800 rounded-xl p-1">
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
              {filteredHistory.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                  Bu turdagi yoki sanadagi arxiv topilmadi.
                </div>
              ) : (
                filteredHistory.map((h) => (
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
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{h.date}</h3>
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
          </div>
        </div>
      )}
      {/* Help Modal: Sana va Excel Import bo'yicha yo'riqnoma */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-2xl w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {lang === 'ru' ? 'Формат дат и инструкция по импорту Excel' : "Sana formati va Excel import yo'riqnomasi"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ru' ? 'Как правильно указывать дату в таблицах' : "Jadvallarda sanani to'g'ri kiritish qoidalari"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Sections */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Rule 1: Short dates */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400">
                  <CheckCircle2 size={16} />
                  <span>{lang === 'ru' ? '1. Краткий формат даты (Основной стандарт)' : '1. Qisqa sana formati (Asosiy standart)'}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {lang === 'ru'
                    ? 'В компании используется порядок: ДЕНЬ / МЕСЯЦ / ГОД. Система автоматически распознает первое число как день, а второе как месяц.'
                    : "Korxonada KUN / OY / YIL tartibi ishlatiladi. Tizim birinchi raqamni kun, ikkinchi raqamni oy deb avtomatik tushunadi."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs pt-1">
                  <div className="bg-white dark:bg-dark-800 p-2 rounded-lg border border-blue-200 dark:border-blue-500/30 font-semibold">
                    12.09.2025 <span className="text-[10px] text-slate-400 font-sans block">{lang === 'ru' ? '12 сентября' : '12-Sentabr'}</span>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-2 rounded-lg border border-blue-200 dark:border-blue-500/30 font-semibold">
                    12/09/2025 <span className="text-[10px] text-slate-400 font-sans block">{lang === 'ru' ? '12 сентября' : '12-Sentabr'}</span>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-2 rounded-lg border border-blue-200 dark:border-blue-500/30 font-semibold">
                    05.09.2025 <span className="text-[10px] text-slate-400 font-sans block">{lang === 'ru' ? '5 сентября (не май)' : '5-Sentabr (may emas)'}</span>
                  </div>
                </div>
              </div>

              {/* Rule 2: Long dates */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span>{lang === 'ru' ? '2. Длинный формат даты (С названием месяца)' : "2. Uzun sana formati (Oy nomi so'z bilan)"}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {lang === 'ru'
                    ? 'Если в Excel дата указана прописью (на русском, узбекском или английском языке), система распознает месяц автоматически.'
                    : "Agar Excelda sana so'z bilan yozilgan bo'lsa (ruscha, o'zbekcha yoki inglizcha), tizim oy nomini avtomatik taniydi."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs pt-1">
                  <div className="bg-white dark:bg-dark-800 p-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    &quot;12 сентября 2025 г.&quot;
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    &quot;15-sentabr 2025&quot;
                  </div>
                </div>
              </div>

              {/* Rule 3: Smart Merge Info */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <Info size={16} />
                  <span>{lang === 'ru' ? '3. Умное слияние (Данные не перезаписываются)' : "3. Aqlli birlashtirish (Ma'lumotlar o'chib ketmaydi)"}</span>
                </div>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                  <li>
                    {lang === 'ru'
                      ? 'Уже заполненные в программе значения сохраняются. Excel дополняет только пустые ячейки.'
                      : "Dasturda kiritilgan mavjud qiymatlar saqlanadi. Excel faqat bo'sh qolib ketgan kataklarni to'ldiradi."}
                  </li>
                  <li>
                    {lang === 'ru'
                      ? 'Формулы в ячейках Excel (например =250+6) автоматически вычисляются (256).'
                      : "Excel kataklaridagi formulalar (masalan =250+6) avtomatik hisoblab olinadi (256)."}
                  </li>
                  <li>
                    {lang === 'ru'
                      ? 'Пустые будущие даты пропускаются и не засоряют базу.'
                      : "Kelajakdagi hamma katagi bo'sh bo'lgan qatorlar bazaga kirmaydi."}
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition-all"
              >
                {lang === 'ru' ? 'Понятно, закрыть' : 'Tushundim, yopish'}
              </button>
            </div>
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

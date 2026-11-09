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
  AlertCircle,
  ArrowUpRight,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { checkEditPermission } from '@/lib/auditRules'
import {
  EXPENSE_FIELDS,
  readExpenseRow,
  formatDMY,
  formatLongDate,
  isDateStr,
  toNum
} from '@/lib/shopReport'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface RashodContentProps {
  userRole?: string
  userName?: string
}

const todayStr = () => new Date().toISOString().split('T')[0]

export default function RashodContent({ userRole, userName }: RashodContentProps) {
  const { lang, formatDual } = useLanguage()
  const isAdmin = userRole === 'ADMIN'
  const isReadOnly = (userRole || '').toUpperCase() === 'SUPPLY'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingExpenses, setSavingExpenses] = useState(false)

  // DB Expenses data
  const [expenses, setExpenses] = useState<any[]>([])

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateFilter, setDateFilter] = useState('')

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

      setExpenses((data.expenses || []).map((e: any) => readExpenseRow(e)))
    } catch (e: any) {
      toast.error(e?.message || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
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
    if (modifiedExisting.length > 0) {
      const summary = modifiedExisting.map((r) => `Chiqim sanasi: ${r.date}`)
      setEditReasonModal({
        open: true,
        dirtyItemsCount: modifiedExisting.length,
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

          {/* Excel Import */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 transition-colors"
            >
              <Upload size={14} />
              <span>Excel Import</span>
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
                <th className="sticky left-0 z-20 p-2.5 border-r border-amber-300 shadow-[inset_-1px_0_0_#fcd34d] w-[100px] min-w-[100px] bg-amber-200 text-slate-900">
                  {lang === 'ru' ? 'Число' : 'Sana'}
                </th>
                {EXPENSE_FIELDS.map((f) => {
                  const green = f.field === 'ses' || f.field === 'kitchen'
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
                <th className="p-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/70 bg-[#FFFBF0] dark:bg-dark-900 text-slate-900 dark:text-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={EXPENSE_FIELDS.length + 2} className="p-16 text-center text-slate-400">
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
                  <td colSpan={EXPENSE_FIELDS.length + 2} className="p-12 text-center text-sm text-slate-400">
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
                    <td className={`sticky left-0 z-10 p-1.5 border-r border-amber-300/80 shadow-[inset_-1px_0_0_#fcd34d] ${
                      row.isEdited ? 'bg-rose-100/70 dark:bg-rose-950/40' : 'bg-[#FFF3CD] dark:bg-dark-850'
                    }`}>
                      {row._new ? (
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateExpense(idx, { date: e.target.value })}
                          className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-dark-800 border border-amber-300 dark:border-dark-700 outline-none"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {dateFormatMode === 'long' ? formatLongDate(row.date, lang) : formatDMY(row.date)}
                          </span>
                          {!isRowEditable && (
                            <span className="p-0.5 text-slate-400" title={perm.reason}>
                              <Lock size={11} className="text-amber-500 inline" />
                            </span>
                          )}
                        </div>
                      )}
                      {row.isEdited && (
                        <div className="flex items-center gap-1 px-1 pb-0.5">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white"
                            title={`Tahrirlangan:\nSabab: ${row.editReason || '—'}\nKim: ${row.editedBy || '—'}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                            {lang === 'ru' ? 'Изменено' : "O'zgartirilgan"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* EXPENSE FIELDS */}
                    {EXPENSE_FIELDS.map((f) => {
                      const defect = f.field === 'boxDefect' || f.field === 'bagDefect'
                      const green = f.field === 'ses' || f.field === 'kitchen'

                      return (
                        <td
                          key={f.field}
                          className={`p-1 border-r border-amber-200/80 ${
                            defect ? 'bg-red-50/60 dark:bg-red-950/20' : green ? 'bg-green-50/60 dark:bg-green-950/20' : ''
                          }`}
                        >
                          <input
                            type="number"
                            step="any"
                            readOnly={!isRowEditable}
                            disabled={!isRowEditable}
                            value={inputVal(row[f.field])}
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

      {/* EDIT REASON MODAL */}
      {editReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 border border-rose-300 dark:border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertCircle size={22} className="shrink-0" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">
                  {lang === 'ru' ? 'Причина изменения расхода' : "Chiqimni o'zgartirish sababi"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'ru'
                    ? 'FSSC 22000: Укажите причину изменения ранее сохраненных данных'
                    : "FSSC 22000: Saqlangan chiqimni o'zgartirish sababini ko'rsating"}
                </p>
              </div>
            </div>

            <textarea
              required
              rows={3}
              placeholder="O'zgartirish sababi (masalan: sex hisobotiga asosan qayta tuzatish)..."
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

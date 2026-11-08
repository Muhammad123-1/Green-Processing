'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
  CheckCircle2,
  Calendar as CalendarIcon,
  Loader2,
  X,
  User as UserIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

const isPlainObject = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v)

const formatValue = (v: any) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Ha' : "Yo'q"
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000)
  return String(v)
}

// Recursively renders any JSON value as readable key/value rows
function DataView({ data, level = 0 }: { data: any; level?: number }) {
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">—</span>
    return (
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <div key={i} className="pl-3 border-l-2 border-slate-200 dark:border-dark-700">
            <DataView data={item} level={level + 1} />
          </div>
        ))}
      </div>
    )
  }
  if (isPlainObject(data)) {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span className="text-slate-400">—</span>
    return (
      <div className="space-y-1.5">
        {entries.map(([k, v]) => {
          const nested = isPlainObject(v) || Array.isArray(v)
          return nested ? (
            <div key={k}>
              <div className={`font-bold ${level === 0 ? 'text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mt-3' : 'text-xs text-slate-700 dark:text-slate-300'}`}>{k}</div>
              <div className="pl-3 mt-1 border-l-2 border-slate-200 dark:border-dark-700">
                <DataView data={v} level={level + 1} />
              </div>
            </div>
          ) : (
            <div key={k} className="flex justify-between gap-4 text-sm py-1 border-b border-dashed border-slate-200 dark:border-dark-700 last:border-0">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{k}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-right break-all">{formatValue(v)}</span>
            </div>
          )
        })}
      </div>
    )
  }
  return <span className="font-mono font-bold text-slate-900 dark:text-white">{formatValue(data)}</span>
}

const ITEMS_PER_PAGE = 20

export default function ArchiveContent() {
  const { formatDual } = useLanguage()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filterDate, setFilterDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selected, setSelected] = useState<any | null>(null)
  const [jumpPageInput, setJumpPageInput] = useState('')
  const timelineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const typeLabel = (type: string) => {
    switch (type) {
      case 'ARRIVAL':
        return formatDual('Kirim', 'Приход', 'Arrival')
      case 'EXPENSE':
        return formatDual('Chiqim', 'Расход', 'Expense')
      case 'REPORT':
        return formatDual('Tsex hisoboti', 'Отчет цеха', 'Shop report')
      case 'QC':
        return formatDual('Sifat nazorati', 'Контроль качества', 'QC')
      default:
        return type
    }
  }

  const formatDateTime = (iso: string) => {
    try { return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return iso }
  }

  const fetchArchive = async (targetPage: number, targetType: string, targetDate: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('limit', String(ITEMS_PER_PAGE))
      if (targetType && targetType !== 'ALL') params.set('type', targetType)
      if (targetDate) params.set('date', targetDate)

      const res = await fetch(`/api/archive?${params.toString()}`)
      if (!res.ok) {
        console.error('API Error status:', res.status)
        setEvents([])
        setTotal(0)
        setTotalPages(1)
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
        setTotal(data.length)
        setTotalPages(Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)))
      } else if (data && Array.isArray(data.events)) {
        setEvents(data.events)
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      } else {
        console.error('API Error:', data)
        setEvents([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (e) {
      console.error('Archive fetch error:', e)
      setEvents([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchive(page, typeFilter, filterDate)
  }, [page, typeFilter, filterDate])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    if (timelineRef.current) {
      timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType)
    setPage(1)
  }

  const handleDateChange = (newDate: string) => {
    setFilterDate(newDate)
    setPage(1)
  }

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(jumpPageInput, 10)
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p)
      setJumpPageInput('')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'ARRIVAL': return <ArrowDownToLine className="text-blue-500" size={20} />
      case 'EXPENSE': return <ArrowUpFromLine className="text-rose-500" size={20} />
      case 'REPORT': return <Calculator className="text-amber-500" size={20} />
      case 'QC': return <CheckCircle2 className="text-emerald-500" size={20} />
      default: return <Archive className="text-slate-500" size={20} />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'ARRIVAL': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'EXPENSE': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'REPORT': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'QC': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Calculate pagination visible page numbers (smart window)
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
      }
    }
    return pages
  }

  const startRecord = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1
  const endRecord = Math.min(page * ITEMS_PER_PAGE, total)

  return (
    <div className="flex flex-col min-h-full md:h-full space-y-3 md:space-y-5 animate-enter p-1 sm:p-2 md:p-4">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
            <Archive size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                {formatDual("Umumiy Arxiv (Lenta)", "Общий архив (Лента)", "Global Archive (Feed)")}
              </h1>
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                {total.toLocaleString()} ta amal · {ITEMS_PER_PAGE} tadan
              </span>
            </div>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {formatDual(
                "Har bir sahifada 20 tadan operatsiya bosqichma-bosqich yuklanadi",
                "Загрузка операций порциями по 20 записей на страницу",
                "Chronological timeline loaded in batches of 20 operations per page"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/director"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
          >
            <ChevronLeft size={15} />
            <span>{formatDual("Direktor paneli", "Панель директора", "Director panel")}</span>
          </Link>
          <select
            value={typeFilter}
            onChange={e => handleTypeChange(e.target.value)}
            className="flex-1 sm:flex-none min-w-[140px] bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">{formatDual("Barcha turlar", "Все типы", "All types")}</option>
            <option value="ARRIVAL">{formatDual("Xomashyo kirimlari", "Приходы сырья", "Raw arrivals")}</option>
            <option value="EXPENSE">{formatDual("Ishlab chiqarish chiqimlari", "Расходы производства", "Production expenses")}</option>
            <option value="REPORT">{formatDual("Tayyor mahsulot hisobotlari", "Отчеты цеха (Выход ГП)", "Shop reports")}</option>
            <option value="QC">{formatDual("Sifat nazorati (QC)", "Контроль качества (QC)", "Quality Control")}</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={e => handleDateChange(e.target.value)}
            className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
          />
          {filterDate && (
            <button
              onClick={() => handleDateChange('')}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            >
              {formatDual("Tozalash", "Сброс", "Clear")}
            </button>
          )}
        </div>
      </div>

      {/* Timeline / List */}
      <div
        ref={timelineRef}
        className="flex-1 md:overflow-y-auto custom-scrollbar bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm p-3 sm:p-4 md:p-6 flex flex-col justify-between"
      >
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-indigo-600" size={36} />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                {formatDual("20 ta amal yuklanmoqda...", "Загрузка 20 записей...", "Loading 20 operations...")}
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Archive size={52} className="mb-3 opacity-20" />
              <p className="font-bold text-slate-600 dark:text-slate-400">
                {formatDual("Hech qanday ma'lumot topilmadi", "Ничего не найдено", "No records found")}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {events.map((evt, idx) => (
                <div key={evt.id} className="flex gap-2.5 sm:gap-4 group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-xs">
                      {getIcon(evt.type)}
                    </div>
                    {idx !== events.length - 1 && (
                      <div className="w-px h-full bg-slate-200 dark:bg-dark-700 mt-1.5"></div>
                    )}
                  </div>
                  
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(evt)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelected(evt) }}
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-750 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 sm:mb-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-dark-800 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getBadgeColor(evt.type)}`}>
                        {typeLabel(evt.type)}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-dark-700 shrink-0">
                        {evt.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug mb-1 break-words">
                      {evt.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed break-words">
                      {evt.desc}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-200 dark:border-dark-700 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 gap-2">
                      <span className="flex items-center gap-1.5 truncate">
                        <UserIcon size={13} className="shrink-0" /> <span className="truncate">{evt.author}</span>
                      </span>
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                        {formatDual("Batafsil", "Подробнее", "Details")} <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Bar (20 per page) */}
        {!loading && total > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-dark-750 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            {/* Range info */}
            <div className="text-slate-600 dark:text-slate-400 font-medium text-center md:text-left">
              {formatDual(
                `${startRecord}–${endRecord} ko'rsatilmoqda (Jami: ${total.toLocaleString()} ta)`,
                `Показано ${startRecord}–${endRecord} (Всего: ${total.toLocaleString()})`,
                `Showing ${startRecord}–${endRecord} of ${total.toLocaleString()}`
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={formatDual("Birinchi sahifa", "Первая страница", "First page")}
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">{formatDual("Oldingi", "Назад", "Prev")}</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, i) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${i}`} className="px-2 text-slate-400 font-bold select-none">
                        ...
                      </span>
                    )
                  }
                  const isActive = p === page
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[36px] h-9 rounded-xl font-bold transition-all text-xs sm:text-sm ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-colors"
              >
                <span className="hidden sm:inline">{formatDual("Keyingi", "Вперед", "Next")}</span>
                <ChevronRight size={16} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={formatDual("Oxirgi sahifa", "Последняя страница", "Last page")}
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            {/* Jump to page */}
            {totalPages > 5 && (
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
                <span className="text-slate-500 text-xs hidden lg:inline">
                  {formatDual("Sahifa:", "Стр:", "Page:")}
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder={String(page)}
                  value={jumpPageInput}
                  onChange={e => setJumpPageInput(e.target.value)}
                  className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white text-xs text-center font-bold outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 text-xs">/ {totalPages}</span>
                <button
                  type="submit"
                  disabled={!jumpPageInput}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-dark-750 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  {formatDual("O'tish", "Перейти", "Go")}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center shrink-0">
                  {getIcon(selected.type)}
                </div>
                <div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getBadgeColor(selected.type)}`}>
                    {typeLabel(selected.type)}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selected.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                aria-label="Yopish"
              >
                <X size={20} />
              </button>
            </div>

            {/* Full contents */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              {/* Meta: who / when */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><UserIcon size={12} /> {formatDual("Kim kiritgan", "Кто внес", "Author")}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-1 break-words">{selected.author}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><CalendarIcon size={12} /> {formatDual("Hisobot sanasi", "Дата отчета", "Report date")}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{selected.date}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Clock size={12} /> {formatDual("Tizimga kiritilgan", "Внесено в систему", "Created at")}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{formatDateTime(selected.createdAt)}</div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3">{selected.desc}</p>
                <DataView data={selected.payload} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-dark-750 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-dark-700 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

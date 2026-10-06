'use client'

import React, { useState, useEffect } from 'react'
import { Archive, ArrowDownToLine, ArrowUpFromLine, Calculator, CheckCircle2, Calendar as CalendarIcon, Loader2, X, User as UserIcon, Clock, ChevronRight } from 'lucide-react'

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

export default function ArchiveContent() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const typeLabel = (type: string) => ({ ARRIVAL: 'Kirim', EXPENSE: 'Chiqim', REPORT: 'Tsex hisoboti', QC: 'Sifat nazorati' } as any)[type] || type

  const formatDateTime = (iso: string) => {
    try { return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return iso }
  }

  const fetchArchive = async (date: string) => {
    setLoading(true)
    try {
      const url = date ? `/api/archive?date=${date}` : '/api/archive'
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
      } else {
        console.error('API Error:', data)
        setEvents([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchive(filterDate)
  }, [filterDate])

  const filteredEvents = Array.isArray(events) ? events.filter(e => typeFilter === 'ALL' || e.type === typeFilter) : []

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

  return (
    <div className="flex flex-col h-full space-y-5 animate-enter p-2 md:p-4">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Archive size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Umumiy Arxiv (Lenta)</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Boshliq uchun zavoddagi barcha amaliyotlar tarixi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none">
            <option value="ALL">Barchasi</option>
            <option value="ARRIVAL">Kirimlar</option>
            <option value="EXPENSE">Chiqimlar</option>
            <option value="REPORT">Tayyor Mahsulot</option>
            <option value="QC">Sifat Nazorati</option>
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none" />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Timeline / List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-bold text-sm">Yuklanmoqda...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Archive size={48} className="mb-3 opacity-20" />
            <p className="font-bold">Hech qanday ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt, idx) => (
              <div key={evt.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                    {getIcon(evt.type)}
                  </div>
                  {idx !== filteredEvents.length - 1 && (
                    <div className="w-px h-full bg-slate-200 dark:bg-dark-700 mt-2"></div>
                  )}
                </div>
                
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(evt)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelected(evt) }}
                  className="flex-1 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 mb-4 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getBadgeColor(evt.type)}`}>
                        {evt.type}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{evt.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0">{evt.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{evt.desc}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-dark-700 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><UserIcon size={13} /> {evt.author}</span>
                    <span className="flex items-center gap-1 text-indigo-500 font-bold">Batafsil <ChevronRight size={13} /></span>
                  </div>
                </div>
              </div>
            ))}
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

            {/* Meta: who / when */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 pb-0">
              <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><UserIcon size={12} /> Kim yozgan</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1 break-words">{selected.author}</div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><CalendarIcon size={12} /> Hisobot sanasi</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{selected.date}</div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Clock size={12} /> Tizimga kiritilgan</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{formatDateTime(selected.createdAt)}</div>
              </div>
            </div>

            {/* Full contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3">{selected.desc}</p>
              <DataView data={selected.payload} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-dark-750 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-dark-700 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

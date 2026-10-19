'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Info } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  RAW_ROWS,
  MATRIX_COLS,
  MATRIX_HIGHLIGHT,
  OUTPUT_ROWS,
  OUTPUT_FIELDS,
  BALANCE_COLS,
  BALANCE_ROWS,
  PERCENT_COLS,
  computePercents,
  getDayReport,
  sanitizeDayReport,
  toNum,
  formatLongDate,
  type DayReport,
} from '@/lib/shopReport'

interface Props {
  date: string
  onDateChange: (date: string) => void
  /** ShopExpense record of the selected date (if any) */
  record?: { date: string; balances?: any } | null
  /** Ending balances of the closest previous saved day (used as a hint for "start of day") */
  prevEnd?: Record<string, number> | null
  onSaved: () => void | Promise<void>
}

const keyM = (row: string, col: string) => `m|${row}|${col}`
const keyO = (name: string, field: string) => `o|${name}|${field}`
const keyB = (row: string, col: string) => `b|${row}|${col}`

function reportToCells(rep: DayReport | null): Record<string, string> {
  const cells: Record<string, string> = {}
  if (!rep) return cells
  for (const row of RAW_ROWS)
    for (const col of MATRIX_COLS) {
      const v = rep.matrix?.[row]?.[col.key]
      if (v) cells[keyM(row, col.key)] = String(v)
    }
  for (const name of OUTPUT_ROWS)
    for (const f of OUTPUT_FIELDS) {
      const v = (rep.outputs?.[name] as any)?.[f.key]
      if (v) cells[keyO(name, f.key)] = String(v)
    }
  for (const r of BALANCE_ROWS)
    for (const c of BALANCE_COLS) {
      const v = rep.balances?.[r.key]?.[c.key]
      if (v) cells[keyB(r.key, c.key)] = String(v)
    }
  return cells
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

function cellsToReport(cells: Record<string, string>): DayReport {
  const raw: DayReport = { matrix: {}, outputs: {}, balances: {} }
  for (const row of RAW_ROWS)
    for (const col of MATRIX_COLS) {
      const v = toNum(cells[keyM(row, col.key)])
      if (v) {
        raw.matrix[row] = raw.matrix[row] || {}
        raw.matrix[row][col.key] = v
      }
    }
  for (const name of OUTPUT_ROWS)
    for (const f of OUTPUT_FIELDS) {
      const v = toNum(cells[keyO(name, f.key)])
      if (v) {
        raw.outputs[name] = raw.outputs[name] || {}
        ;(raw.outputs[name] as any)[f.key] = v
      }
    }
  for (const r of BALANCE_ROWS) {
    if (r.key === 'end') continue
    for (const c of BALANCE_COLS) {
      const v = toNum(cells[keyB(r.key, c.key)])
      if (v) {
        raw.balances[r.key] = raw.balances[r.key] || {}
        raw.balances[r.key][c.key] = v
      }
    }
  }
  // end of day = start + income - expense (calculated automatically)
  for (const c of BALANCE_COLS) {
    const s = raw.balances.start?.[c.key] || 0
    const i = raw.balances.income?.[c.key] || 0
    const e = raw.balances.expense?.[c.key] || 0
    if (s || i || e) {
      raw.balances.end = raw.balances.end || {}
      raw.balances.end[c.key] = round3(s + i - e)
    }
  }
  return sanitizeDayReport(raw)
}

const shiftDate = (date: string, days: number) => {
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return date
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const fmtTime = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function ShopReportDayForm({ date, onDateChange, record, prevEnd, onSaved }: Props) {
  const { lang } = useLanguage()
  const saved = useMemo(() => getDayReport(record), [record])
  const savedCells = useMemo(() => reportToCells(saved), [saved])

  const [cells, setCells] = useState<Record<string, string>>(savedCells)
  const [saving, setSaving] = useState(false)

  // Re-load the form whenever the date or the saved record changes
  useEffect(() => {
    setCells(savedCells)
  }, [date, savedCells])

  const normalize = (c: Record<string, string>) =>
    JSON.stringify(Object.entries(c).filter(([, v]) => toNum(v) !== 0).map(([k, v]) => [k, toNum(v)]).sort())

  const dirty = useMemo(() => normalize(cells) !== normalize(savedCells), [cells, savedCells])

  const liveReport = useMemo(() => cellsToReport(cells), [cells])
  const percents = useMemo(() => computePercents(liveReport), [liveReport])

  const setCell = (key: string, value: string) => setCells((p) => ({ ...p, [key]: value }))

  const changeDate = (next: string) => {
    if (!next || next === date) return
    if (dirty && !window.confirm("Saqlanmagan o'zgarishlar bor. Baribir boshqa sanaga o'tasizmi?")) return
    onDateChange(next)
  }

  const handleSave = async () => {
    if (!date) {
      toast.error('Avval sanani tanlang')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/shop-report/day', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, report: cellsToReport(cells) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Xatolik yuz berdi')
      toast.success(`${date} sanasidagi hisobot saqlandi`)
      await onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setCells(savedCells)

  const fillStartFromPrev = () => {
    if (!prevEnd) return
    setCells((p) => {
      const next = { ...p }
      for (const c of BALANCE_COLS) {
        const v = prevEnd[c.key]
        if (v) next[keyB('start', c.key)] = String(v)
      }
      return next
    })
  }

  const numInput = (key: string, opts?: { highlight?: boolean; red?: boolean; bold?: boolean; placeholder?: string }) => (
    <input
      type="number"
      step="any"
      value={cells[key] ?? ''}
      placeholder={opts?.placeholder}
      onChange={(e) => setCell(key, e.target.value)}
      className={`w-full h-full p-1 text-center outline-none bg-transparent placeholder:text-slate-300 focus:bg-sky-50 ${
        opts?.highlight ? 'font-bold text-red-600' : ''
      } ${opts?.red ? 'text-red-600 font-bold' : ''} ${opts?.bold ? 'font-bold' : ''}`}
    />
  )

  const colTotal = (field: string) =>
    round3(OUTPUT_ROWS.reduce((s, n) => s + toNum(cells[keyO(n, field)]), 0))

  const hasPrevEnd = !!prevEnd && Object.keys(prevEnd).length > 0

  return (
    <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-y-auto custom-scrollbar flex flex-col p-4 space-y-6">
      {/* Header: title + date + save */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-dark-750 pb-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">
            Производственный отчет ЦЕХ (Kunlik kiritish)
          </h2>
          <div className="mt-1 text-xs font-semibold">
            {saved?.updatedAt ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={13} /> Saqlangan: {saved.updatedBy || '—'} · {fmtTime(saved.updatedAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Info size={13} /> Bu kun uchun hisobot hali saqlanmagan
              </span>
            )}
            {dirty && <span className="ml-3 text-amber-600">● Saqlanmagan o'zgarishlar bor</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Sana:</span>
          <button
            type="button"
            onClick={() => changeDate(shiftDate(date, -1))}
            className="p-2 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700"
            title="Oldingi kun"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              className="bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none"
            />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-sm">
              {formatLongDate(date, lang)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => changeDate(shiftDate(date, 1))}
            className="p-2 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700"
            title="Keyingi kun"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40"
            title="O'zgarishlarni bekor qilish"
          >
            <RotateCcw size={14} /> Bekor
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !date}
            className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-500 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Hisobotni saqlash</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Table 1: Расход сырья и материалов на выпуск ГП */}
        <div className="border border-[#8EA9DB] rounded-lg overflow-hidden shadow-sm">
          <div className="bg-[#B4C6E7] p-2 text-center text-[11px] font-black text-slate-900 uppercase tracking-tight">
            Расход сырья и материалов на выпуск ГП
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-[10px] min-w-[800px]">
              <thead className="bg-slate-50 text-slate-900 font-bold text-center">
                <tr>
                  <th className="p-1.5 border border-[#8EA9DB] w-36 text-left bg-white" rowSpan={2}>Наименование сырья</th>
                  <th className="p-1.5 border border-[#8EA9DB] bg-white w-20" rowSpan={2}>Приход в цех</th>
                  <th className="p-1.5 border border-[#8EA9DB]" colSpan={MATRIX_COLS.length - 1}>Расход</th>
                </tr>
                <tr>
                  {MATRIX_COLS.slice(1).map((c) => (
                    <th key={c.key} className={`p-1.5 border border-[#8EA9DB] w-20 ${c.green ? 'bg-[#92D050]' : ''}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white text-slate-900 font-mono">
                {RAW_ROWS.map((row) => (
                  <tr key={row} className="hover:bg-slate-50">
                    <td className="p-1 border border-[#8EA9DB] font-sans font-bold">{row}</td>
                    {MATRIX_COLS.map((c) => {
                      const hl = (MATRIX_HIGHLIGHT[row] || []).includes(c.key)
                      return (
                        <td key={c.key} className={`p-0 border border-[#8EA9DB] ${hl ? 'bg-[#FFFF00]' : ''}`}>
                          {numInput(keyM(row, c.key), { highlight: hl })}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Table 2: Выход ГП KFC */}
          <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-slate-100 p-1.5 text-center text-[11px] font-black text-slate-900 uppercase border-b border-slate-300">
              Выход ГП КФС
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse text-[10px] min-w-[500px]">
                <thead className="bg-slate-50 text-slate-900 font-bold">
                  <tr>
                    <th className="p-1 border border-slate-300 bg-white">Наименование ГП</th>
                    {OUTPUT_FIELDS.map((f) => (
                      <th key={f.key} className={`p-1 border border-slate-300 ${'green' in f && f.green ? 'bg-[#92D050]' : ''}`}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-900 font-mono">
                  {OUTPUT_ROWS.map((name) => (
                    <tr key={name} className="hover:bg-slate-50">
                      <td className="p-1 border border-slate-300 font-sans text-left">{name}</td>
                      {OUTPUT_FIELDS.map((f) => (
                        <td key={f.key} className={`p-0 border border-slate-300 ${f.key === 'kg' ? 'bg-[#FFFF00]' : ''}`}>
                          {numInput(keyO(name, f.key), { highlight: f.key === 'kg' })}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1 border border-slate-300 font-sans text-left">Итого</td>
                    {OUTPUT_FIELDS.map((f) => (
                      <td key={f.key} className="p-1 border border-slate-300">{colTotal(f.key) || ''}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4: Остатки */}
          <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-100 p-1.5 flex items-center justify-between text-[11px] font-black text-slate-900 uppercase border-b border-slate-300">
              <span className="px-2">Остатки</span>
              {hasPrevEnd && (
                <button
                  type="button"
                  onClick={fillStartFromPrev}
                  className="normal-case text-[10px] font-bold text-blue-600 hover:underline px-2"
                >
                  Oldingi kun qoldig'ini olish
                </button>
              )}
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse text-[10px] min-w-[500px]">
                <thead className="bg-slate-50 text-slate-900 font-bold">
                  <tr>
                    <th className="p-1 border border-slate-300 w-28 bg-white">{date}</th>
                    {BALANCE_COLS.map((c) => (
                      <th key={c.key} className="p-1 border border-slate-300">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-900 font-mono">
                  {BALANCE_ROWS.map((r) => {
                    const isEnd = r.key === 'end'
                    const isStart = r.key === 'start'
                    return (
                      <tr key={r.key} className={isEnd ? 'bg-[#D9E1F2]' : ''}>
                        <td className={`p-1 border border-slate-300 font-sans text-left ${isStart ? 'text-red-600' : ''} ${isEnd ? 'font-bold' : ''}`}>
                          {r.label}
                        </td>
                        {BALANCE_COLS.map((c) => (
                          <td key={c.key} className="p-0 border border-slate-300">
                            {isEnd ? (
                              <div className="w-full p-1 text-center font-bold">{liveReport.balances.end?.[c.key] ?? ''}</div>
                            ) : (
                              numInput(keyB(r.key, c.key), {
                                red: isStart,
                                placeholder: isStart && prevEnd?.[c.key] ? String(prevEnd[c.key]) : undefined,
                              })
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-2 py-1.5 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-200">
              Kun oxiridagi qoldiq avtomatik hisoblanadi: boshlanish + prixod − rasxod
            </p>
          </div>
        </div>

        {/* Table 3: % расхода сырья (calculated) */}
        <div className="border border-[#8EA9DB] rounded-lg overflow-hidden shadow-sm">
          <div className="bg-[#B4C6E7] p-1.5 text-center text-[11px] font-black text-slate-900 uppercase">
            % расхода сырья и материалов на выпуск ГП
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-center border-collapse text-[10px] min-w-[700px]">
              <thead className="bg-slate-50 text-slate-900 font-bold">
                <tr>
                  <th className="p-1 border border-[#8EA9DB] w-48 text-left bg-white">Наименование Сырья</th>
                  <th className="p-1 border border-[#8EA9DB] w-20">Норма не более %</th>
                  {PERCENT_COLS.map((c) => (
                    <th key={c} className="p-1 border border-[#8EA9DB] w-20">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white text-slate-900 font-mono">
                {percents.map((r) => {
                  const normMax = parseFloat((r.norm.match(/(\d+(?:\.\d+)?)\s*$/) || [])[1] || '')
                  return (
                    <tr key={r.name} className="hover:bg-slate-50">
                      <td className="p-1 border border-[#8EA9DB] font-sans text-left">{r.name}</td>
                      <td className="p-1 border border-[#8EA9DB]">{r.norm}</td>
                      {r.values.map((v, i) => {
                        const over = v !== null && Number.isFinite(normMax) && v > normMax
                        return (
                          <td key={i} className={`p-1 border border-[#8EA9DB] ${over ? 'text-red-600 font-bold bg-red-50' : ''}`}>
                            {v === null ? '-' : v.toFixed(1)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="px-2 py-1.5 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-200">
            Avtomatik hisoblanadi: (xomashyo sarfi − tayyor mahsulot kg) / xomashyo sarfi × 100. Norma oshsa qizil rangda ko'rinadi.
          </p>
        </div>
      </div>
    </div>
  )
}

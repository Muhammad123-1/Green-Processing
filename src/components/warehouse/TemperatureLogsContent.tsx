'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Thermometer,
  Plus,
  Search,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface TempLog {
  id: number
  date: string
  time: string
  icebergTemp: number | null
  onionTemp: number | null
  tomatoTemp: number | null
  carrotTemp: number | null
  cabbageTemp: number | null
  deviation: string
  correctiveAction: string | null
  responsible: string
  notes?: string | null
}

export default function TemperatureLogsContent() {
  const { lang, formatDual } = useLanguage()

  const [logs, setLogs] = useState<TempLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    time: '8:00',
    icebergTemp: '3.5',
    onionTemp: '4.0',
    tomatoTemp: '3.8',
    carrotTemp: '3.2',
    cabbageTemp: '4.1',
    deviation: 'Норма',
    correctiveAction: '-',
    responsible: '',
    notes: ''
  }
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    fetchLogs()
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchLogs(date = dateFilter) {
    setLoading(true)
    try {
      const url = date ? `/api/warehouse/temperature-logs?date=${date}` : '/api/warehouse/temperature-logs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error(formatDual("Harorat jurnalini yuklashda xatolik", "Ошибка загрузки журнала", "Failed to load logs"))
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadExcel() {
    setExporting(true)
    try {
      const res = await fetch('/api/warehouse/export-excel')
      if (!res.ok) throw new Error('Export error')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Chek_list_kontrolya_temperatury_F01_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(lang === 'ru' ? 'Журнал успешно скачан (.xlsx)' : "Harorat jurnali yuklab olindi (.xlsx)")
    } catch {
      toast.error(lang === 'ru' ? 'Ошибка скачивания Excel' : "Excel yuklab olishda xatolik")
    } finally {
      setExporting(false)
    }
  }

  function openEdit(log: TempLog) {
    setEditingId(log.id)
    setForm({
      date: log.date || '',
      time: log.time || '8:00',
      icebergTemp: log.icebergTemp !== null ? log.icebergTemp.toString() : '',
      onionTemp: log.onionTemp !== null ? log.onionTemp.toString() : '',
      tomatoTemp: log.tomatoTemp !== null ? log.tomatoTemp.toString() : '',
      carrotTemp: log.carrotTemp !== null ? log.carrotTemp.toString() : '',
      cabbageTemp: log.cabbageTemp !== null ? log.cabbageTemp.toString() : '',
      deviation: log.deviation || 'Норма',
      correctiveAction: log.correctiveAction || '-',
      responsible: log.responsible || '',
      notes: log.notes || ''
    })
    setShowModal(true)
  }

  // Auto check deviation (norm: between 2°C and 5°C)
  function checkDeviation(currentForm: typeof form): string {
    const temps = [
      parseFloat(currentForm.icebergTemp),
      parseFloat(currentForm.onionTemp),
      parseFloat(currentForm.tomatoTemp),
      parseFloat(currentForm.carrotTemp),
      parseFloat(currentForm.cabbageTemp)
    ].filter(t => !isNaN(t))

    if (temps.length === 0) return 'Норма'
    const outOfNorm = temps.some(t => t < 2.0 || t > 5.0)
    return outOfNorm ? 'ВНИМАНИЕ: Нарушение' : 'Норма'
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const computedDev = form.deviation && form.deviation !== 'Норма' ? form.deviation : checkDeviation(form)
      const method = editingId ? 'PUT' : 'POST'
      const payload: any = {
        ...form,
        deviation: computedDev,
        icebergTemp: form.icebergTemp !== '' ? parseFloat(form.icebergTemp) : null,
        onionTemp: form.onionTemp !== '' ? parseFloat(form.onionTemp) : null,
        tomatoTemp: form.tomatoTemp !== '' ? parseFloat(form.tomatoTemp) : null,
        carrotTemp: form.carrotTemp !== '' ? parseFloat(form.carrotTemp) : null,
        cabbageTemp: form.cabbageTemp !== '' ? parseFloat(form.cabbageTemp) : null,
      }
      if (editingId) payload.id = editingId

      const res = await fetch('/api/warehouse/temperature-logs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingId
          ? (lang === 'ru' ? 'Запись обновлена' : 'Harorat yozuvi yangilandi')
          : (lang === 'ru' ? 'Новая запись сохранена' : 'Yangi harorat saqlandi')
        )
        setShowModal(false)
        setEditingId(null)
        setForm(initialForm)
        fetchLogs()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(lang === 'ru' ? 'Удалить эту запись?' : 'Ushbu yozuvni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/warehouse/temperature-logs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись удалена' : 'Yozuv o\'chirildi')
        fetchLogs()
      }
    } catch {
      toast.error('O\'chirishda xatolik')
    }
  }

  // Filtered list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const s = search.toLowerCase()
      const matchesSearch =
        !s ||
        log.date.includes(s) ||
        log.time.includes(s) ||
        (log.deviation && log.deviation.toLowerCase().includes(s)) ||
        (log.responsible && log.responsible.toLowerCase().includes(s)) ||
        (log.correctiveAction && log.correctiveAction.toLowerCase().includes(s))

      const matchesDate = !dateFilter || log.date === dateFilter

      return matchesSearch && matchesDate
    })
  }, [logs, search, dateFilter])

  // Pagination (10 per step)
  const pagination = useInfiniteTable(filteredLogs, 10, [search, dateFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/80 p-5 sm:p-6 rounded-3xl border border-dark-750 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer size={14} />
              GREEN PROCESSING • FSSC 22000
            </span>
            <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
              Форма Ф-01
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {lang === 'ru' ? 'Чек-лист контроля температуры сырья при хранении' : "Xomashyoni Saqlashdagi Harorat Nazorati Chek-Listi"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {formatDual(
              "Omborda xomashyoni saqlash harorati ko'rsatkichi (2°C dan past va 5°C dan yuqori bo'lmasligi shart). Kunlik nazorat vaqtlari: 8:00 va 17:00",
              "Хом ашёни сақлашдаги ҳарорат кўрсаткичи (не ниже 2°C не выше 5°C). Время контроля: 8:00 и 17:00. Фиксация отклонений и корректирующих действий",
              "Raw material storage temperature checklist (not below 2°C, not above 5°C). Control times: 8:00 & 17:00"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setEditingId(null)
              setForm(initialForm)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>{formatDual("Yangi Harorat Yozuvi", "Добавить замер", "New Measurement")}</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={exporting}
            className="px-4 py-3 rounded-2xl border border-dark-600 bg-dark-800 hover:bg-dark-750 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow hover:border-emerald-500/50 disabled:opacity-50 active:scale-95"
          >
            {exporting ? (
              <RefreshCw size={16} className="animate-spin text-emerald-400" />
            ) : (
              <FileSpreadsheet size={16} className="text-emerald-400" />
            )}
            <span>{exporting ? (lang === 'ru' ? 'Скачивание...' : 'Yuklanmoqda...') : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="p-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-all shadow active:scale-95"
            title={formatDual("Yangilash", "Обновить", "Refresh")}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Norm Alert Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-300">
          <Info size={18} className="shrink-0 text-emerald-400" />
          <span>
            <strong>{formatDual("Harorat Me'yori:", "Температурный режим:", "Norm:")}</strong> {formatDual("Barcha sabzavotlar uchun 2°C dan 5°C gacha ruxsat etiladi. Og'ish aniqlansa, darhol xladagent va sovutgich agregatlari sozlanishi shart.", "Для всех овощей норма составляет от 2°C до 5°C. При отклонении требуется регулировка хладагента.", "2°C to 5°C range required for all raw vegetables.")}
          </span>
        </div>
        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30 shrink-0">
          2.0°C ≤ T ≤ 5.0°C
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-4 rounded-2xl border border-dark-750">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={formatDual("Sana, vaqt, mas'ul xodim yoki ko'rilgan chora bo'yicha qidirish...", "Поиск по дате, времени, ответственному или корректировкам...", "Search by date, time, responsible or actions...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              fetchLogs(e.target.value)
            }}
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          {dateFilter && (
            <button
              onClick={() => {
                setDateFilter('')
                fetchLogs('')
              }}
              className="px-2.5 py-2 text-xs rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-xs text-slate-400 font-mono bg-dark-800 px-3 py-2 rounded-xl border border-dark-700 whitespace-nowrap">
            {filteredLogs.length} ta yozuv
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
            <p className="text-slate-400 text-sm font-semibold">{formatDual("Harorat jurnali yuklanmoqda...", "Загрузка журнала...", "Loading log...")}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Thermometer size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-base font-semibold text-slate-400">{formatDual("Hozircha harorat yozuvlari mavjud emas", "Записи не найдены", "No records found")}</p>
          </div>
        ) : (
          <>
            {/* 🖥️ DESKTOP VIEW: EXACT REPLICA OF USER'S EXCEL FORM Ф-01 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-dark-800/95 text-slate-300 font-extrabold uppercase border-b border-dark-700 tracking-wider">
                    <th className="p-3.5 border-r border-dark-750 min-w-[110px]">{formatDual("Дата / Сана", "Дата / Сана", "Date")}</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[90px]">{formatDual("Время / Вақт", "Время / Вақт", "Time")}</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[120px] text-emerald-400">Салат Айсберг (°C)</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[110px] text-emerald-400">Лук белый (°C)</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[110px] text-emerald-400">Томаты (°C)</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[110px] text-emerald-400">Морковь (°C)</th>
                    <th className="p-3.5 text-center border-r border-dark-750 min-w-[140px] text-emerald-400">Капуста белокочанная (°C)</th>
                    <th className="p-3.5 border-r border-dark-750 min-w-[140px]">{formatDual("Отклонения / Выход из нормы", "Отклонения / Выход из нормы", "Deviation")}</th>
                    <th className="p-3.5 border-r border-dark-750 min-w-[160px]">{formatDual("Корректирующие действия", "Корректирующие действия", "Corrective Action")}</th>
                    <th className="p-3.5 border-r border-dark-750 min-w-[130px]">{formatDual("Ответственный (ФИО)", "Ответственный (ФИО)", "Responsible")}</th>
                    <th className="p-3.5 text-center w-16">{formatDual("Амал", "Действие", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750/70 text-slate-300 font-sans">
                  {pagination.displayedItems.map((log) => {
                    const isViolation = log.deviation && log.deviation.includes('ВНИМАНИЕ')

                    return (
                      <tr key={log.id} className="hover:bg-dark-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-white border-r border-dark-750/50 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400 border-r border-dark-750/50">
                          {log.time}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-dark-750/50">
                          {log.icebergTemp !== null ? (
                            <span className={log.icebergTemp < 2 || log.icebergTemp > 5 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                              {log.icebergTemp}°C
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-dark-750/50">
                          {log.onionTemp !== null ? (
                            <span className={log.onionTemp < 2 || log.onionTemp > 5 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                              {log.onionTemp}°C
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-dark-750/50">
                          {log.tomatoTemp !== null ? (
                            <span className={log.tomatoTemp < 2 || log.tomatoTemp > 5 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                              {log.tomatoTemp}°C
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-dark-750/50">
                          {log.carrotTemp !== null ? (
                            <span className={log.carrotTemp < 2 || log.carrotTemp > 5 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                              {log.carrotTemp}°C
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-dark-750/50">
                          {log.cabbageTemp !== null ? (
                            <span className={log.cabbageTemp < 2 || log.cabbageTemp > 5 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                              {log.cabbageTemp}°C
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5 border-r border-dark-750/50">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isViolation
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {isViolation && <AlertTriangle size={12} className="text-rose-400" />}
                            {!isViolation && <CheckCircle size={12} className="text-emerald-400" />}
                            {log.deviation}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 border-r border-dark-750/50 text-xs">
                          {log.correctiveAction || '-'}
                        </td>
                        <td className="p-3.5 text-slate-200 font-semibold border-r border-dark-750/50">
                          {log.responsible}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(log)}
                              className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                              title="Tahrirlash"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 📱 MOBILE VIEW: RESPONSIVE CARDS */}
            <div className="block lg:hidden p-4 space-y-3">
              {pagination.displayedItems.map((log) => {
                const isViolation = log.deviation && log.deviation.includes('ВНИМАНИЕ')

                return (
                  <div
                    key={log.id}
                    className="bg-dark-850/70 border border-dark-750 rounded-2xl p-4 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {log.date}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          {log.time}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isViolation
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {log.deviation}
                      </span>
                    </div>

                    {/* Temperatures Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-dark-800/80 p-2.5 rounded-xl border border-dark-700/60 text-xs font-mono text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Айсберг</span>
                        <span className={`font-bold ${log.icebergTemp && (log.icebergTemp < 2 || log.icebergTemp > 5) ? 'text-rose-400 font-black' : 'text-white'}`}>
                          {log.icebergTemp ?? '-'}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Лук</span>
                        <span className={`font-bold ${log.onionTemp && (log.onionTemp < 2 || log.onionTemp > 5) ? 'text-rose-400 font-black' : 'text-white'}`}>
                          {log.onionTemp ?? '-'}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Томат</span>
                        <span className={`font-bold ${log.tomatoTemp && (log.tomatoTemp < 2 || log.tomatoTemp > 5) ? 'text-rose-400 font-black' : 'text-white'}`}>
                          {log.tomatoTemp ?? '-'}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Морковь</span>
                        <span className={`font-bold ${log.carrotTemp && (log.carrotTemp < 2 || log.carrotTemp > 5) ? 'text-rose-400 font-black' : 'text-white'}`}>
                          {log.carrotTemp ?? '-'}°C
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-sans">Капуста белокоч.</span>
                        <span className={`font-bold ${log.cabbageTemp && (log.cabbageTemp < 2 || log.cabbageTemp > 5) ? 'text-rose-400 font-black' : 'text-white'}`}>
                          {log.cabbageTemp ?? '-'}°C
                        </span>
                      </div>
                    </div>

                    {/* Corrective action if any */}
                    {log.correctiveAction && log.correctiveAction !== '-' && (
                      <div className="text-xs p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        <span className="text-[10px] block text-amber-400/80 font-bold">Тўғриловчи ҳаракат:</span>
                        <span>{log.correctiveAction}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-dark-750 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Жавобгар:</span>
                        <span className="font-semibold text-slate-200">{log.responsible}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(log)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700"
                        >
                          <Edit2 size={13} />
                          <span>Tahrirlash</span>
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination footer */}
            <InfiniteTableFooter
              currentCount={pagination.visibleCount}
              totalCount={pagination.totalCount}
              hasMore={pagination.hasMore}
              showAll={pagination.showAll}
              onLoadMore={pagination.loadMore}
              onToggleShowAll={pagination.toggleShowAll}
              sentinelRef={pagination.sentinelRef}
              pageSize={10}
              itemName={{ uz: 'yozuv', ru: 'записей', en: 'records' }}
            />
          </>
        )}
      </div>

      {/* MODAL: ADD / EDIT TEMPERATURE ENTRY */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-xl bg-dark-900 border border-dark-750 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Thermometer size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingId
                      ? (lang === 'ru' ? 'Редактировать запись замера' : "Harorat yozuvini tahrirlash")
                      : (lang === 'ru' ? 'Новая запись замера температуры' : "Yangi Harorat Yozuvi (Ф-01)")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Чек-лист контроля температуры сырья при хранении", "Контроль температур сырья при хранении", "Storage temperature check")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Sana", "Дата", "Date")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Nazorat Vaqti", "Время замера", "Time")} <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="8:00">8:00 (Ertalabki nazorat)</option>
                    <option value="17:00">17:00 (Kechki nazorat)</option>
                    <option value="12:00">12:00 (Qo'shimcha)</option>
                  </select>
                </div>
              </div>

              {/* Temperatures for 5 raw materials */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Айсберг (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={form.icebergTemp}
                    onChange={(e) => setForm({ ...form, icebergTemp: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Лук белый (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="4.0"
                    value={form.onionTemp}
                    onChange={(e) => setForm({ ...form, onionTemp: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Томаты (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.8"
                    value={form.tomatoTemp}
                    onChange={(e) => setForm({ ...form, tomatoTemp: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Морковь (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.2"
                    value={form.carrotTemp}
                    onChange={(e) => setForm({ ...form, carrotTemp: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Капуста белокочанная (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="4.1"
                    value={form.cabbageTemp}
                    onChange={(e) => setForm({ ...form, cabbageTemp: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Corrective action & deviation */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {formatDual("Тўғриловчи ҳаракат (Корректирующие действия)", "Корректирующие действия", "Corrective Action")}
                </label>
                <input
                  type="text"
                  placeholder="Отрегулирован хладагент yoki -"
                  value={form.correctiveAction}
                  onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Responsible */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {formatDual("Жавобгар шахс ФИШ (Ответственный)", "Ответственный (ФИО)", "Responsible Person")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иванов И."
                  value={form.responsible}
                  onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

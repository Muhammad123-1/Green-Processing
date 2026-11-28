'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Utensils,
  Plus,
  Printer,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Save,
  Archive,
  Eye,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface DailyFoodSampleItem {
  id?: number
  _clientKey?: string
  _isNew?: boolean
  _dirty?: boolean
  date: string
  orderNumber: number
  dishName: string
  sampleTime: string
  sampleWeight: string
  containerCondition: string
  fridgeTime: string
  fridgeTemp: string
  expiryTime: string
  responsiblePerson: string
  signature?: string
  status: 'APPROVED' | 'REJECTED'
  notes?: string
}

const getTodayTashkent = () => {
  const d = new Date()
  const tzOffset = 5 * 60 * 60 * 1000
  return new Date(d.getTime() + tzOffset).toISOString().slice(0, 10)
}

const createEmptySample = (date: string, orderNumber: number): DailyFoodSampleItem => ({
  _clientKey: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  _isNew: true,
  _dirty: true,
  date: date || getTodayTashkent(),
  orderNumber,
  dishName: '',
  sampleTime: '09:05',
  sampleWeight: '100 гр',
  containerCondition: 'идиш тоза, дезинфекция қилинган',
  fridgeTime: '09:15',
  fridgeTemp: '+2°C...+6°C',
  expiryTime: '48 соат',
  responsiblePerson: 'Жуманова Ч.Э.',
  signature: 'Жуманова Ч.Э.',
  status: 'APPROVED',
  notes: 'Синама олинди'
})

export default function DailyFoodSampleJournal() {
  const { formatDual, lang } = useLanguage()
  const [filterDate, setFilterDate] = useState<string>(getTodayTashkent)
  const [samples, setSamples] = useState<DailyFoodSampleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load from API
  const fetchSamples = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/kitchen/daily-sample?date=${date}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.samples)) {
        if (json.samples.length === 0) {
          // Default empty rows for convenient entry
          setSamples([
            createEmptySample(date, 1),
            createEmptySample(date, 2),
            createEmptySample(date, 3)
          ])
        } else {
          setSamples(
            json.samples.map((s: any) => ({
              ...s,
              _clientKey: `db-${s.id}`,
              _isNew: false,
              _dirty: false
            }))
          )
        }
      }
    } catch {
      toast.error(formatDual("Sinamalarni yuklashda xatolik", "Ошибка при загрузке суточных проб", "Error loading daily samples"))
    } finally {
      setLoading(false)
    }
  }, [formatDual])

  useEffect(() => {
    fetchSamples(filterDate)
  }, [filterDate, fetchSamples])

  const handleDateStep = (delta: number) => {
    if (filterDate === 'ALL') {
      setFilterDate(getTodayTashkent())
      return
    }
    const cur = new Date(filterDate)
    cur.setDate(cur.getDate() + delta)
    const nextStr = cur.toISOString().slice(0, 10)
    setFilterDate(nextStr)
  }

  const handleFieldChange = (idx: number, field: keyof DailyFoodSampleItem, val: any) => {
    setSamples(prev => {
      const copy = [...prev]
      copy[idx] = {
        ...copy[idx],
        [field]: val,
        _dirty: true
      }
      return copy
    })
  }

  const handleAddRow = () => {
    setSamples(prev => [
      ...prev,
      createEmptySample(filterDate, prev.length + 1)
    ])
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const validSamples = samples.filter(s => s.dishName?.trim())
      if (validSamples.length === 0) {
        toast.error(formatDual("Kamida bitta taom nomi kiritilishi kerak", "Введите хотя бы одно наименование блюда", "At least one dish name required"))
        setSaving(false)
        return
      }

      for (const s of validSamples) {
        if (s._isNew || !s.id) {
          await fetch('/api/kitchen/daily-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s)
          })
        } else if (s._dirty) {
          await fetch('/api/kitchen/daily-sample', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s)
          })
        }
      }

      toast.success(formatDual("Sutkalik sinamalar muvaffaqiyatli saqlandi!", "Суточные пробы успешно сохранены!", "Daily food samples saved successfully!"))
      fetchSamples(filterDate)
    } catch {
      toast.error(formatDual("Saqlashda xatolik yuz berdi", "Ошибка при сохранении", "Error saving daily samples"))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (idx: number) => {
    const target = samples[idx]
    if (target.id) {
      try {
        const res = await fetch(`/api/kitchen/daily-sample?id=${target.id}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success(formatDual("Sinama o'chirildi", "Проба удалена", "Sample deleted"))
        }
      } catch {
        toast.error(formatDual("O'chirishda xatolik", "Ошибка при удалении", "Error deleting sample"))
      }
    }
    setSamples(prev => prev.filter((_, i) => i !== idx))
  }

  const filteredSamples = useMemo(() => {
    if (!searchQuery.trim()) return samples
    const q = searchQuery.toLowerCase()
    return samples.filter(s =>
      s.dishName.toLowerCase().includes(q) ||
      s.responsiblePerson.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    )
  }, [samples, searchQuery])

  return (
    <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden animate-enter">
      {/* 1. Header with SanPiN standard typography */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-dark-750 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-emerald-50/40 dark:from-dark-850 dark:via-dark-900 dark:to-dark-850 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25">
            <Utensils size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                СанПиН 0027-20 / SanPiN Standard
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={11} /> Nazoratda
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ТАЙЁР ТАОМЛАРДАН СУТКАЛИК СИНАМА ЖУРНАЛИ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDual(
                "Oshxonada tayyorlangan barcha taomlardan 48 soatlik steril sinama olish va saqlash hisobi",
                "Журнал отбора и хранения суточных проб готовых блюд на пищеблоке (48 часов)",
                "Daily food 48-hour retention sampling and temperature storage log"
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus size={15} />
            <span>{formatDual("Qator qo'shish", "Добавить пробу", "Add Sample")}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-850 hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Printer size={15} />
            <span>{formatDual("Chop etish", "Печать", "Print")}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? formatDual("Saqlanmoqda...", "Сохранение...", "Saving...") : formatDual("Saqlash", "Сохранить всё", "Save All")}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Navigation & Search Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stepper */}
          <div className="flex items-center gap-1 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleDateStep(-1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={formatDual("Oldingi kun", "Предыдущий день", "Previous day")}
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={14} className="text-slate-600 dark:text-slate-400" />
              <span className="text-slate-500 font-bold">{formatDual("Sana:", "Дата:", "Date:")}</span>
              <input
                type="date"
                value={filterDate === 'ALL' ? '' : filterDate}
                onChange={e => setFilterDate(e.target.value || getTodayTashkent())}
                className="font-mono font-bold text-slate-900 dark:text-white bg-transparent outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDateStep(1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={formatDual("Keyingi kun", "Следующий день", "Next day")}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFilterDate(getTodayTashkent())}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterDate === getTodayTashkent()
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {formatDual("Bugun", "Сегодня", "Today")}
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs shadow-2xs w-full sm:w-auto">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder={formatDual("Taom yoki mas'ul shaxsni qidirish...", "Поиск блюда или ответственного...", "Search meal or responsible...")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-full sm:w-60 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 3. The 10-Column Table from User's Handwritten Image */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-dark-700 uppercase tracking-tight text-[11px]">
            <tr>
              <th className="p-3 text-center border-r border-slate-300 dark:border-dark-700 w-12">№</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[110px]">Сана</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[180px]">Таом номи</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[100px] text-center">Синама олинган вақт</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[100px] text-center">Синама миқдори (г)</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[180px]">Идиш ҳолати ва маркировкаси</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[120px] text-center">Совутгичга жойлаштирилган вақт</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[110px] text-center">Совутгич ҳарорати (°C)</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[140px]">Сақлаш муддати тугаган вақт</th>
              <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[140px]">Масъул шахс имзоси</th>
              <th className="p-3 text-center w-14 no-print">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-dark-800">
            {loading ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500">
                  <RefreshCw size={20} className="animate-spin inline mr-2 text-blue-500" />
                  {formatDual("Yuklanmoqda...", "Загрузка...", "Loading...")}
                </td>
              </tr>
            ) : filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500">
                  {formatDual("Ushbu kunga sinamalar kiritilmagan", "На эту дату проб нет", "No samples recorded for this date")}
                </td>
              </tr>
            ) : (
              filteredSamples.map((sample, idx) => (
                <tr
                  key={sample._clientKey || sample.id || idx}
                  className="hover:bg-blue-50/30 dark:hover:bg-dark-800/40 transition group"
                >
                  {/* 1. № */}
                  <td className="p-2.5 text-center font-mono font-bold text-slate-500 border-r border-slate-200 dark:border-dark-800">
                    {idx + 1}
                  </td>

                  {/* 2. Сана */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800">
                    <input
                      type="date"
                      value={sample.date}
                      onChange={e => handleFieldChange(idx, 'date', e.target.value)}
                      className="w-full bg-transparent outline-none font-mono font-semibold text-slate-900 dark:text-white px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750 focus:bg-white dark:focus:bg-dark-900"
                    />
                  </td>

                  {/* 3. Таом номи */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800">
                    <input
                      type="text"
                      placeholder="Ош 1-хўрак, Салат..."
                      value={sample.dishName}
                      onChange={e => handleFieldChange(idx, 'dishName', e.target.value)}
                      className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750 focus:bg-white dark:focus:bg-dark-900"
                    />
                  </td>

                  {/* 4. Синама олинган вақт */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800 text-center">
                    <input
                      type="time"
                      value={sample.sampleTime}
                      onChange={e => handleFieldChange(idx, 'sampleTime', e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono font-bold text-blue-600 dark:text-blue-400 px-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 5. Синама миқдори (г) */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800 text-center">
                    <input
                      type="text"
                      value={sample.sampleWeight}
                      onChange={e => handleFieldChange(idx, 'sampleWeight', e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono font-medium text-slate-800 dark:text-slate-200 px-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 6. Идиш ҳолати ва маркировкаси */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800">
                    <input
                      type="text"
                      value={sample.containerCondition}
                      onChange={e => handleFieldChange(idx, 'containerCondition', e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 7. Совутгичга жойлаштирилган вақт */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800 text-center">
                    <input
                      type="time"
                      value={sample.fridgeTime}
                      onChange={e => handleFieldChange(idx, 'fridgeTime', e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono text-slate-800 dark:text-slate-200 px-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 8. Совутгич ҳарорати (°C) */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800 text-center">
                    <input
                      type="text"
                      value={sample.fridgeTemp}
                      onChange={e => handleFieldChange(idx, 'fridgeTemp', e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400 px-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 9. Сақлаш муддати тугаган вақт */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800">
                    <input
                      type="text"
                      value={sample.expiryTime}
                      onChange={e => handleFieldChange(idx, 'expiryTime', e.target.value)}
                      className="w-full bg-transparent outline-none font-mono text-slate-700 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                    />
                  </td>

                  {/* 10. Масъул шахс имзоси */}
                  <td className="p-2 border-r border-slate-200 dark:border-dark-800">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={sample.responsiblePerson}
                        onChange={e => handleFieldChange(idx, 'responsiblePerson', e.target.value)}
                        className="w-full bg-transparent outline-none font-serif italic text-slate-900 dark:text-white px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-dark-750"
                      />
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                        ✓ Imzo
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center no-print">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                      title={formatDual("O'chirish", "Удалить", "Delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. SanPiN Rules Note Footer */}
      <div className="p-4 bg-slate-50 dark:bg-dark-850 border-t border-slate-200 dark:border-dark-750 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <span>
            {formatDual(
              "SanPiN talabi: Barcha tayyorlangan taomlardan kamida 100 gramm steril idishda olinib, +2...+6°C sovutgichda 48 soat davomida saqlanishi shart.",
              "Требование СанПиН: Отбор проб не менее 100 г в стерильную тару, хранение при температуре +2...+6°C не менее 48 часов.",
              "SanPiN requirement: Samples of >=100g stored in sterile containers at +2...+6°C for 48 hours."
            )}
          </span>
        </div>
        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
          Jami: {samples.filter(s => s.dishName?.trim()).length} ta sinama
        </div>
      </div>
    </div>
  )
}

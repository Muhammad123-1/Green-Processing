'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Building2,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  Loader2,
  X,
  Package,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

export default function RawMovementContent() {
  const { lang, formatDual } = useLanguage()

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const initialForm = {
    orderNumber: 1,
    arrivalDate: new Date().toISOString().split('T')[0],
    deliveryTime: '10:00',
    productName: 'САЛАТ АЙЗБЕРГ',
    supplierName: 'КИБРАЙ БАРАКА',
    batchNumber: '1',
    receivedWeightKg: '',
    storageTemp810: '2.0',
    storageTemp1700: '2.0',
    issuedToProduction: '',
    issuedKg: '',
    returnedFromProductionKg: '0',
    endOfDayBalanceKg: '',
    responsiblePerson: '',
    notes: ''
  }
  const [form, setForm] = useState(initialForm)

  // Products and suppliers for datalists
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    fetchLogs()
    fetchMetadata()
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchMetadata() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers')
      ])
      if (pRes.ok) setProducts(await pRes.json())
      if (sRes.ok) {
        const sData = await sRes.json()
        setSuppliers(sData.suppliers || sData || [])
      }
    } catch (e) {
      console.warn('Metadata fetch error:', e)
    }
  }

  async function fetchLogs(date = dateFilter) {
    setLoading(true)
    try {
      const url = date ? `/api/warehouse/raw-movement-logs?date=${date}` : '/api/warehouse/raw-movement-logs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error(formatDual("Jurnalni yuklashda xatolik", "Ошибка загрузки журнала", "Failed to load logs"))
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadExcel() {
    setExporting(true)
    try {
      const res = await fetch('/api/warehouse/raw-movement-logs/export')
      if (!res.ok) throw new Error('Export error')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Zhurnal_peremesheniya_syrya_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(lang === 'ru' ? 'Журнал успешно скачан (.xlsx)' : "Jurnal muvaffaqiyatli yuklab olindi (.xlsx)")
    } catch {
      toast.error(lang === 'ru' ? 'Ошибка скачивания Excel' : "Excel yuklab olishda xatolik")
    } finally {
      setExporting(false)
    }
  }

  function openEdit(log: any) {
    setEditingId(log.id)
    setForm({
      orderNumber: log.orderNumber || 1,
      arrivalDate: log.arrivalDate || '',
      deliveryTime: log.deliveryTime || '',
      productName: log.productName || '',
      supplierName: log.supplierName || '',
      batchNumber: log.batchNumber || '',
      receivedWeightKg: log.receivedWeightKg !== null ? log.receivedWeightKg.toString() : '',
      storageTemp810: log.storageTemp810 !== null ? log.storageTemp810.toString() : '',
      storageTemp1700: log.storageTemp1700 !== null ? log.storageTemp1700.toString() : '',
      issuedToProduction: log.issuedToProduction || '',
      issuedKg: log.issuedKg !== null ? log.issuedKg.toString() : '',
      returnedFromProductionKg: log.returnedFromProductionKg !== null ? log.returnedFromProductionKg.toString() : '0',
      endOfDayBalanceKg: log.endOfDayBalanceKg !== null ? log.endOfDayBalanceKg.toString() : '',
      responsiblePerson: log.responsiblePerson || '',
      notes: log.notes || ''
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const payload: any = {
        ...form,
        receivedWeightKg: parseFloat(form.receivedWeightKg) || 0,
        issuedKg: parseFloat(form.issuedKg) || (form.issuedToProduction ? parseFloat(form.issuedToProduction.replace(/[^\d.]/g, '')) || 0 : 0),
        returnedFromProductionKg: parseFloat(form.returnedFromProductionKg) || 0,
        storageTemp810: form.storageTemp810 ? parseFloat(form.storageTemp810) : null,
        storageTemp1700: form.storageTemp1700 ? parseFloat(form.storageTemp1700) : null,
      }
      if (editingId) payload.id = editingId

      const res = await fetch('/api/warehouse/raw-movement-logs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingId
          ? (lang === 'ru' ? 'Запись обновлена' : 'Yozuv yangilandi')
          : (lang === 'ru' ? 'Новая запись сохранена' : 'Yangi yozuv saqlandi')
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
    if (!confirm(lang === 'ru' ? 'Удалить эту запись из журнала?' : 'Ushbu yozuvni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/warehouse/raw-movement-logs?id=${id}`, { method: 'DELETE' })
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
        (log.productName && log.productName.toLowerCase().includes(s)) ||
        (log.supplierName && log.supplierName.toLowerCase().includes(s)) ||
        (log.batchNumber && log.batchNumber.toLowerCase().includes(s)) ||
        (log.responsiblePerson && log.responsiblePerson.toLowerCase().includes(s))

      const matchesDate = !dateFilter || log.arrivalDate === dateFilter

      return matchesSearch && matchesDate
    })
  }, [logs, search, dateFilter])

  // Pagination (10 per view)
  const pagination = useInfiniteTable(filteredLogs, 10, [search, dateFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/80 p-5 sm:p-6 rounded-3xl border border-dark-750 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={14} />
              GREEN PROCESSING • FSSC 22000
            </span>
            <span className="text-xs text-slate-400 font-mono">№ Ж-01 / WMS</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {lang === 'ru' ? 'Журнал регистрации и перемещения основного сырья на производство' : "Asosiy Xomashyoni Ro'yxatga Olish va Ishlab Chiqarishga Berish Jurnali"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {formatDual(
              "Xomashyo kelgan sana va vaqti, partiya, kirim og'irligi, saqlash harorati (8:10 va 17:00), sexga berilgan va qaytgan hajmlar hamda kun oxiridagi qoldiq balansi",
              "Журнал учета поступления основного сырья, температурного режима хранения (8:10 и 17:00), отпуска в производственный цех и остатков на конец дня",
              "Log for raw material intake, storage temperature (8:10 & 17:00), shop dispatch, returns and day-end balances"
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
            <span>{formatDual("Yangi Yozuv Qo'shish", "Новая запись", "New Record")}</span>
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-4 rounded-2xl border border-dark-750">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={formatDual("Xomashyo nomi, ta'minotchi, partiya raqami yoki mas'ul xodim...", "Поиск по сырью, поставщику, номеру партии или ответственному...", "Search by raw material, supplier, batch or person...")}
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
            <p className="text-slate-400 text-sm font-semibold">{formatDual("Xomashyo harakati jurnali yuklanmoqda...", "Загрузка журнала...", "Loading log...")}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-base font-semibold text-slate-400">{formatDual("Hozircha yozuvlar mavjud emas", "Записи не найдены", "No records found")}</p>
          </div>
        ) : (
          <>
            {/* 🖥️ DESKTOP VIEW: EXACT REPLICA OF USER'S EXCEL JOURNAL */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-dark-800/95 text-slate-300 font-extrabold uppercase border-b border-dark-700 tracking-wider">
                    <th rowSpan={2} className="p-3.5 text-center border-r border-dark-750 w-12">№ п/п</th>
                    <th rowSpan={2} className="p-3.5 border-r border-dark-750 min-w-[110px]">{formatDual("Қабул Санаси", "Дата поступления", "Arrival Date")}</th>
                    <th rowSpan={2} className="p-3.5 text-center border-r border-dark-750 min-w-[70px]">{formatDual("Вақти", "Время", "Time")}</th>
                    <th rowSpan={2} className="p-3.5 border-r border-dark-750 min-w-[140px]">{formatDual("Хомашё Номи", "Наименование", "Nomenclature")}</th>
                    <th rowSpan={2} className="p-3.5 border-r border-dark-750 min-w-[140px]">{formatDual("Етказиб Берувчи", "Поставщик", "Supplier")}</th>
                    <th rowSpan={2} className="p-3.5 text-center border-r border-dark-750 min-w-[75px]">{formatDual("Партия №", "№ Партии", "Batch №")}</th>
                    <th rowSpan={2} className="p-3.5 text-right border-r border-dark-750 min-w-[100px] text-emerald-400">{formatDual("Оғирлиги, кг", "Вес, кг", "Weight, kg")}</th>
                    <th colSpan={2} className="p-2 text-center border-r border-dark-750 bg-emerald-950/40 text-emerald-300">{formatDual("Сақланиш Ҳарорати, °C", "Температура сырья, °C", "Storage Temp, °C")}</th>
                    <th rowSpan={2} className="p-3.5 text-right border-r border-dark-750 min-w-[130px] text-amber-300">{formatDual("Цехга Берилган, кг", "Отпущено в цех, кг", "Issued to Shop")}</th>
                    <th rowSpan={2} className="p-3.5 text-right border-r border-dark-750 min-w-[100px] text-cyan-300">{formatDual("Цехдан Қайтган, кг", "Возврат из цеха, кг", "Returned, kg")}</th>
                    <th rowSpan={2} className="p-3.5 text-right border-r border-dark-750 min-w-[125px] text-white bg-dark-850/60 font-black">{formatDual("Кун Охирида Қолдиқ", "Остаток к концу дня", "Day-End Stock")}</th>
                    <th rowSpan={2} className="p-3.5 border-r border-dark-750 min-w-[130px]">{formatDual("Жавобгар ФИШ", "Ответственный", "Responsible")}</th>
                    <th rowSpan={2} className="p-3.5 text-center w-16">{formatDual("Амал", "Действие", "Action")}</th>
                  </tr>
                  <tr className="bg-dark-850 text-slate-400 text-[10px] font-bold border-b border-dark-700">
                    <th className="p-2 text-center border-r border-dark-750 bg-emerald-950/20 text-emerald-400">8:10</th>
                    <th className="p-2 text-center border-r border-dark-750 bg-emerald-950/20 text-emerald-400">17:00</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750/70 text-slate-300 font-sans">
                  {pagination.displayedItems.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-dark-800/40 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-500 border-r border-dark-750/50">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-white border-r border-dark-750/50 whitespace-nowrap">
                        {log.arrivalDate}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400 border-r border-dark-750/50">
                        {log.deliveryTime || '-'}
                      </td>
                      <td className="p-3 font-bold text-white border-r border-dark-750/50">
                        {log.productName}
                      </td>
                      <td className="p-3 text-slate-300 border-r border-dark-750/50">
                        {log.supplierName}
                      </td>
                      <td className="p-3 text-center font-mono font-bold border-r border-dark-750/50">
                        <span className="px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                          {log.batchNumber}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 border-r border-dark-750/50">
                        {Number(log.receivedWeightKg).toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-mono border-r border-dark-750/50 text-emerald-300 bg-emerald-950/10">
                        {log.storageTemp810 !== null ? `${log.storageTemp810}°C` : '-'}
                      </td>
                      <td className="p-3 text-center font-mono border-r border-dark-750/50 text-emerald-300 bg-emerald-950/10">
                        {log.storageTemp1700 !== null ? `${log.storageTemp1700}°C` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-amber-300 border-r border-dark-750/50">
                        {log.issuedToProduction || (log.issuedKg ? `${Number(log.issuedKg).toLocaleString()} kg` : '-')}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-cyan-300 border-r border-dark-750/50">
                        {log.returnedFromProductionKg ? `${Number(log.returnedFromProductionKg).toLocaleString()} kg` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-white bg-dark-850/40 border-r border-dark-750/50">
                        <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-white">
                          {log.endOfDayBalanceKg !== null ? `${Number(log.endOfDayBalanceKg).toLocaleString()} kg` : '-'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 border-r border-dark-750/50">
                        {log.responsiblePerson}
                      </td>
                      <td className="p-3 text-center">
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* 📱 MOBILE VIEW: RESPONSIVE CARDS */}
            <div className="block lg:hidden p-4 space-y-3">
              {pagination.displayedItems.map((log, idx) => (
                <div
                  key={log.id}
                  className="bg-dark-850/70 border border-dark-750 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-dark-800 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {log.arrivalDate}
                      </span>
                      {log.deliveryTime && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({log.deliveryTime})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold bg-dark-800 text-slate-300 px-2 py-0.5 rounded border border-dark-700">
                      Партия №{log.batchNumber}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-white text-base">{log.productName}</h4>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 size={13} className="text-blue-400 shrink-0" />
                      <span>{log.supplierName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-dark-800/80 p-2.5 rounded-xl border border-dark-700/60 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Kirim og'irligi:", "Вес прихода:", "Intake weight:")}</span>
                      <span className="font-black text-emerald-400 text-sm">
                        {Number(log.receivedWeightKg).toLocaleString()} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Harorat (8:10 / 17:00):", "Темп. (8:10 / 17:00):", "Temp:")}</span>
                      <span className="font-bold text-emerald-300 text-xs">
                        {log.storageTemp810 ?? '-'}°C / {log.storageTemp1700 ?? '-'}°C
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <span className="text-[10px] block text-amber-400/80">{formatDual("Sexga berildi:", "Отпущено в цех:", "Issued to shop:")}</span>
                      <span className="font-mono font-bold">{log.issuedToProduction || (log.issuedKg ? `${log.issuedKg} kg` : '-')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                      <span className="text-[10px] block text-cyan-400/80">{formatDual("Sexdan qaytdi:", "Возврат из цеха:", "Returned:")}</span>
                      <span className="font-mono font-bold">{log.returnedFromProductionKg ? `${log.returnedFromProductionKg} kg` : '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dark-750 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{formatDual("Kun oxiridagi qoldiq:", "Остаток на конец дня:", "End balance:")}</span>
                      <span className="font-mono font-black text-white text-sm">
                        {log.endOfDayBalanceKg !== null ? `${Number(log.endOfDayBalanceKg).toLocaleString()} kg` : '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{formatDual("Javobgar:", "Ответственный:", "Responsible:")}</span>
                      <span className="font-semibold text-slate-200">{log.responsiblePerson}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-750">
                    <button
                      onClick={() => openEdit(log)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700"
                    >
                      <Edit2 size={13} />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    >
                      <Trash2 size={13} />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              ))}
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

      {/* MODAL: ADD / EDIT ENTRY */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-dark-900 border border-dark-750 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingId
                      ? (lang === 'ru' ? 'Редактировать запись перемещения' : "Xomashyo harakati yozuvini tahrirlash")
                      : (lang === 'ru' ? 'Новая запись в журнал перемещения' : "Yangi Xomashyo Harakati Yozuvi")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Журнал регистрации и перемещения основного сырья", "Регистрация поступления и отпуска в цех", "Raw material movement registration")}
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Qabul Sanasi", "Дата поступления", "Arrival Date")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.arrivalDate}
                    onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kelgan Vaqti", "Время поставки", "Delivery Time")}
                  </label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={form.deliveryTime}
                    onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Partiya Raqami", "№ Партии", "Batch №")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Xomashyo Nomi", "Наименование сырья", "Raw Material Name")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="movement-raw-products"
                    placeholder="САЛАТ АЙЗБЕРГ, ТОМАТ..."
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <datalist id="movement-raw-products">
                    {products.map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                    <option value="САЛАТ АЙЗБЕРГ" />
                    <option value="ТОМАТ" />
                    <option value="Каром" />
                    <option value="Лук" />
                    <option value="Сабзи" />
                    <option value="Огурцы" />
                    <option value="Лимон" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Yetkazib Beruvchi", "Поставщик", "Supplier")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="movement-raw-suppliers"
                    placeholder="КИБРАЙ БАРАКА, Zokir AND..."
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <datalist id="movement-raw-suppliers">
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                    <option value="КИБРАЙ БАРАКА" />
                    <option value="Zokir AND" />
                    <option value="Nazarov 22" />
                    <option value="MadinaBonu" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kirim Og'irligi (kg)", "Вес прихода (кг)", "Intake Weight (kg)")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="395.4"
                    value={form.receivedWeightKg}
                    onChange={(e) => setForm({ ...form, receivedWeightKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Harorat 8:10 (°C)", "Температура 8:10", "Temp 8:10")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.4"
                    value={form.storageTemp810}
                    onChange={(e) => setForm({ ...form, storageTemp810: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Harorat 17:00 (°C)", "Температура 17:00", "Temp 17:00")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1.5"
                    value={form.storageTemp1700}
                    onChange={(e) => setForm({ ...form, storageTemp1700: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Sexga Berilgan (kg)", "Отпущено в цех (кг)", "Issued to Shop (kg)")}
                  </label>
                  <input
                    type="text"
                    placeholder="Айзберг 1874.1 yoki 1874"
                    value={form.issuedToProduction}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm({
                        ...form,
                        issuedToProduction: v,
                        issuedKg: v.replace(/[^\d.]/g, '') || ''
                      })
                    }}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-amber-300 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Sexdan Qaytgan (kg)", "Возврат из цеха (кг)", "Returned (kg)")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="90.4"
                    value={form.returnedFromProductionKg}
                    onChange={(e) => setForm({ ...form, returnedFromProductionKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-cyan-300 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kun Qoldig'i (kg)", "Остаток на конец дня", "Day-End Stock")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={(() => {
                      const r = parseFloat(form.receivedWeightKg) || 0
                      const i = parseFloat(form.issuedKg) || (form.issuedToProduction ? parseFloat(form.issuedToProduction.replace(/[^\d.]/g, '')) || 0 : 0)
                      const ret = parseFloat(form.returnedFromProductionKg) || 0
                      return Math.max(0, r - i + ret).toFixed(1)
                    })()}
                    value={form.endOfDayBalanceKg}
                    onChange={(e) => setForm({ ...form, endOfDayBalanceKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Javobgar Shaxs (F.I.Sh)", "Ответственный (ФИО)", "Responsible Person")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Исаков М."
                    value={form.responsiblePerson}
                    onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Izoh", "Примечание", "Notes")}
                  </label>
                  <input
                    type="text"
                    placeholder="Qo'shimcha izoh..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

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

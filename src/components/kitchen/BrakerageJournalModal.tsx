'use client'

import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  Utensils
} from 'lucide-react'
import { toast } from 'sonner'

export interface BrakerageLogItem {
  id: number
  date: string
  orderNumber: number
  mealName: string
  prepTime: string
  chairmanSign?: string | null
  member1Sign?: string | null
  member2Sign?: string | null
  qcInspectorSign?: string | null
  medicalStaffSign?: string | null
  organoleptic: string
  temperature: string
  notes?: string | null
  status: string
  createdAt?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_COMMITTEE = {
  chairman: 'Иминов С.М.',
  member1: 'Зимина Л.Г.',
  member2: 'Расулов А.А.',
  qcInspector: 'Камбарова А.М.',
  medicalStaff: 'Жуманова Ч.Э.'
}

const QUICK_ORGANOLEPTIC = [
  'Ташқи кўриниши сариқ, ўз тинимли ранг, ёғ томчилари пушти рангли, мазали, нормал тузими юмшоқ, пишган.',
  'Ташқи кўриниши сариқ, гўшти макарон билан яхши аралашган, мазали, мазаси нормал, тузими юмшоқ, стандартда.',
  'Ташқи кўриниши янги, помидор ва бодринг янги ҳолатда, ширали, табиий таъмда, нормал тузими.',
  'Қуюқ, хушбўй ҳидли, гўшт ва сабзавотлар меъёрида пишган, тузи нормал, табиий рангда.',
  'Гўшт маҳсулотлари юмшоқ, яхши қовурилган, ёғи тиниқ, бегона ҳид ва таъмсиз.'
]

export function BrakerageJournalModal({ isOpen, onClose }: Props) {
  const [logs, setLogs] = useState<BrakerageLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState<string>('2026-04-27') // matches photo demo date
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<BrakerageLogItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    date: '2026-04-27',
    mealName: '',
    prepTime: '09:10',
    chairmanSign: DEFAULT_COMMITTEE.chairman,
    member1Sign: DEFAULT_COMMITTEE.member1,
    member2Sign: DEFAULT_COMMITTEE.member2,
    qcInspectorSign: DEFAULT_COMMITTEE.qcInspector,
    medicalStaffSign: DEFAULT_COMMITTEE.medicalStaff,
    organoleptic: QUICK_ORGANOLEPTIC[0],
    temperature: '+85°C',
    notes: 'Яхши, истеъмолга рухсат этилади.',
    status: 'APPROVED'
  })

  // Load logs
  const fetchLogs = async (dateVal = filterDate) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/kitchen/brakerage?date=${dateVal}`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs || [])
      } else {
        toast.error(data.error || "Ma'lumotlarni yuklab bo'lmadi")
      }
    } catch (err: any) {
      toast.error('Server bilan aloqa uzildi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLogs(filterDate)
    }
  }, [isOpen, filterDate])

  // Open create
  const handleOpenCreate = () => {
    setEditingLog(null)
    setFormData({
      date: filterDate || new Date().toISOString().slice(0, 10),
      mealName: '',
      prepTime: new Date().toTimeString().slice(0, 5),
      chairmanSign: DEFAULT_COMMITTEE.chairman,
      member1Sign: DEFAULT_COMMITTEE.member1,
      member2Sign: DEFAULT_COMMITTEE.member2,
      qcInspectorSign: DEFAULT_COMMITTEE.qcInspector,
      medicalStaffSign: DEFAULT_COMMITTEE.medicalStaff,
      organoleptic: QUICK_ORGANOLEPTIC[0],
      temperature: '+85°C',
      notes: 'Яхши, истеъмолга рухсат этилади.',
      status: 'APPROVED'
    })
    setIsFormOpen(true)
  }

  // Open edit
  const handleOpenEdit = (item: BrakerageLogItem) => {
    setEditingLog(item)
    setFormData({
      date: item.date,
      mealName: item.mealName,
      prepTime: item.prepTime,
      chairmanSign: item.chairmanSign || DEFAULT_COMMITTEE.chairman,
      member1Sign: item.member1Sign || DEFAULT_COMMITTEE.member1,
      member2Sign: item.member2Sign || DEFAULT_COMMITTEE.member2,
      qcInspectorSign: item.qcInspectorSign || DEFAULT_COMMITTEE.qcInspector,
      medicalStaffSign: item.medicalStaffSign || DEFAULT_COMMITTEE.medicalStaff,
      organoleptic: item.organoleptic,
      temperature: item.temperature,
      notes: item.notes || 'Яхши, истеъмолга рухсат этилади.',
      status: item.status
    })
    setIsFormOpen(true)
  }

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.mealName.trim()) {
      toast.error('Taom nomini kiriting!')
      return
    }

    try {
      setSaving(true)
      const url = '/api/kitchen/brakerage'
      const method = editingLog ? 'PUT' : 'POST'
      const body = editingLog ? { id: editingLog.id, ...formData } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await res.json()

      if (result.success) {
        toast.success(editingLog ? 'Yozuv muvaffaqiyatli yangilandi' : "Yangi taom nazorati qo'shildi")
        setIsFormOpen(false)
        fetchLogs(filterDate)
      } else {
        toast.error(result.error || 'Saqlashda xatolik')
      }
    } catch (err: any) {
      toast.error('Server bilan aloqa xatosi')
    } finally {
      setSaving(false)
    }
  }

  // Delete log
  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu tekshiruv yozuvini o'chirmoqchimisiz?")) return
    try {
      const res = await fetch(`/api/kitchen/brakerage?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast.success("Yozuv o'chirildi")
        fetchLogs(filterDate)
      } else {
        toast.error(result.error || "O'chirishda xatolik")
      }
    } catch (err: any) {
      toast.error('Xatolik yuz berdi')
    }
  }

  // Export Excel
  const handleExportExcel = () => {
    window.open(`/api/kitchen/brakerage/export?date=${filterDate || 'ALL'}`, '_blank')
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  // Parameters list as shown in the original template
  const PARAM_ROWS = [
    { no: 1, label: 'Сана (Sana)', render: (item: BrakerageLogItem) => item.date },
    { no: 2, label: '№ (Тартиб раками)', render: (item: BrakerageLogItem, idx: number) => item.orderNumber || idx + 1 },
    { no: 3, label: 'Баҳоланган таом, маҳсулот номи', render: (item: BrakerageLogItem) => <span className="font-bold text-slate-900 dark:text-white">{item.mealName}</span> },
    { no: 4, label: 'Тайёрлаш вақти', render: (item: BrakerageLogItem) => <span className="font-mono font-medium">{item.prepTime}</span> },
    { no: 5, label: 'Комиссия раиси имзоси', render: (item: BrakerageLogItem) => item.chairmanSign || '-' },
    { no: 6, label: 'Комиссия аъзоси 1 имзоси', render: (item: BrakerageLogItem) => item.member1Sign || '-' },
    { no: 7, label: 'Комиссия аъзоси 2 имзоси', render: (item: BrakerageLogItem) => item.member2Sign || '-' },
    { no: 8, label: 'Сифат назоратчиси имзоси', render: (item: BrakerageLogItem) => item.qcInspectorSign || '-' },
    { no: 9, label: 'Тиббий ходим имзоси', render: (item: BrakerageLogItem) => item.medicalStaffSign || '-' },
    {
      no: 10,
      label: 'Таомнинг кўриниши (Ранг, ҳид, таъм, тузум)',
      render: (item: BrakerageLogItem) => (
        <span className="text-slate-700 dark:text-slate-300 leading-snug block max-w-sm">
          {item.organoleptic}
        </span>
      )
    },
    {
      no: 11,
      label: 'Ҳарорат (°C)',
      render: (item: BrakerageLogItem) => {
        const isCold = item.temperature.includes('+2') || item.temperature.includes('+4') || item.temperature.includes('+5') || item.temperature.includes('+6')
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
            isCold ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
          }`}>
            <Thermometer size={12} />
            {item.temperature}
          </span>
        )
      }
    },
    {
      no: 12,
      label: 'Изоҳлар (Хулоса)',
      render: (item: BrakerageLogItem) => (
        <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs ${
          item.status === 'REJECTED'
            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
        }`}>
          {item.status === 'REJECTED' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
          {item.notes || 'Яхши, истеъмолга рухсат этилади.'}
        </span>
      )
    }
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto no-print"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-7xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-750 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-800 dark:text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Utensils size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur">
                  SanPiN Jurnali
                </span>
                <span className="text-xs text-orange-100 font-medium">Brakeraj & Degustatsiya</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                ТАЙЁР МАХСУЛОТЛАРНИ НАЗОРАТ КИЛИШ ДЖУРНАЛИ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-orange-900 hover:bg-orange-50 rounded-xl text-xs font-black shadow-lg transition active:scale-95"
            >
              <Plus size={15} />
              <span>Yangi Taomni Baholash</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition active:scale-95 border border-white/20"
              title="Aynan rasmda ko'rsatilgan formatda Excel yuklab olish"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition active:scale-95 border border-white/20"
              title="A4 formatda chop etish yoki PDF qilish"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Chop etish</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full text-white transition ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter and Stats Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl font-medium shadow-2xs">
              <Calendar size={14} className="text-orange-500" />
              <span className="text-slate-500 font-bold mr-1">Sana:</span>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-transparent outline-none font-mono font-bold text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={() => fetchLogs(filterDate)}
              className="p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition"
              title="Yangilash"
            >
              <RefreshCw size={14} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="px-2.5 py-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-600 dark:text-slate-400">
              Jami taomlar: <strong className="text-slate-900 dark:text-white font-mono">{logs.length} ta</strong>
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold">
              ✓ Ruxsat etilgan: {logs.filter(l => l.status !== 'REJECTED').length}
            </span>
          </div>
        </div>

        {/* Table Content: Exact match to User's Uploaded Image */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-dark-950">
          {loading ? (
            <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                Brakeraj jurnali yuklanmoqda...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <Utensils size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Ushbu sana ({filterDate}) uchun taomlar nazorati hali kiritilmagan
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Brakeraj komissiyasi xulosasini kiritish uchun quyidagi tugmani bosing.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-5 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95"
              >
                <Plus size={16} />
                <span>Birinchi taomni kiritish</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-300 dark:border-dark-700 shadow-sm overflow-x-auto">
              {/* Official Table Layout as in the Photo */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Table Big Title Row */}
                  <tr className="bg-slate-100 dark:bg-dark-800 border-b-2 border-slate-300 dark:border-dark-700">
                    <th
                      colSpan={2 + logs.length}
                      className="p-3 text-center text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white"
                    >
                      ТАЙЁР МАХСУЛОТЛАРНИ НАЗОРАТ КИЛИШ ДЖУРНАЛИ
                    </th>
                  </tr>
                  {/* Column Headers: №, Parameter, 1, 2, 3... */}
                  <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300">
                    <th className="p-3 text-center font-bold w-12 border-r border-slate-300 dark:border-dark-700">№</th>
                    <th className="p-3 text-left font-bold w-80 border-r border-slate-300 dark:border-dark-700">
                      Тексшириладиган корсаткихлар / Параметрлар
                    </th>
                    {logs.map((log, idx) => (
                      <th
                        key={log.id}
                        className="p-3 text-center font-black min-w-[260px] max-w-[340px] border-r border-slate-300 dark:border-dark-700 bg-amber-50/50 dark:bg-dark-800/80"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-mono text-xs">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(log)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-dark-700 rounded text-slate-600 dark:text-slate-300 transition"
                              title="Tahrirlash"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded text-red-600 transition"
                              title="O'chirish"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAM_ROWS.map((row, rIdx) => (
                    <tr
                      key={row.no}
                      className={`border-b border-slate-200 dark:border-dark-750 hover:bg-slate-50/50 dark:hover:bg-dark-850/50 transition ${
                        rIdx % 2 === 1 ? 'bg-slate-50/30 dark:bg-dark-900/40' : ''
                      }`}
                    >
                      {/* Col 1: Parameter number */}
                      <td className="p-2.5 text-center font-bold font-mono text-slate-500 border-r border-slate-300 dark:border-dark-700">
                        {row.no}
                      </td>
                      {/* Col 2: Parameter label */}
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-dark-700">
                        {row.label}
                      </td>
                      {/* Col 3+: Inspected Meal Data */}
                      {logs.map((item, idx) => (
                        <td
                          key={item.id}
                          className="p-2.5 border-r border-slate-300 dark:border-dark-700 align-top"
                        >
                          {row.render(item, idx)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>
              Brakeraj komissiyasi a'zolari: <strong>Rais: {DEFAULT_COMMITTEE.chairman}</strong> • A'zolar: {DEFAULT_COMMITTEE.member1}, {DEFAULT_COMMITTEE.member2} • QC: {DEFAULT_COMMITTEE.qcInspector} • Tibbiy: {DEFAULT_COMMITTEE.medicalStaff}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition ml-auto"
          >
            Yopish
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT INSPECTION ENTRY */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-dark-750 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Utensils size={18} />
                  {editingLog ? "Taom Nazorati Yozuvini Tahrirlash" : "Yangi Tayyor Taomni Baholash (SanPiN)"}
                </h3>
                <p className="text-[11px] text-orange-100 mt-0.5">
                  Taom nomi, harorati, organoleptik ko'rinishi va komissiya a'zolari imzolarini kiriting
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs max-h-[82vh]">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Баҳоланган таом, маҳсулот номи *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Скалетти макаронные вар. / Педивее с мясом..."
                    value={formData.mealName}
                    onChange={e => setFormData({ ...formData, mealName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Тайёрлаш вақти
                  </label>
                  <input
                    type="time"
                    value={formData.prepTime}
                    onChange={e => setFormData({ ...formData, prepTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Сана (Sana)
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ҳарорат (°C) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+80°C / +92°C / +2°C"
                    value={formData.temperature}
                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Organoleptic Rating */}
              <div className="p-3.5 bg-amber-50/50 dark:bg-dark-850 rounded-2xl border border-amber-200 dark:border-dark-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Таомнинг кўриниши (Ранг, ҳид, таъм, тузум) *
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Tezkor shablonlar:</span>
                  {QUICK_ORGANOLEPTIC.map((txt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, organoleptic: txt })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-amber-300 dark:border-dark-700 rounded hover:bg-amber-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      Shablon {i + 1}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  required
                  value={formData.organoleptic}
                  onChange={e => setFormData({ ...formData, organoleptic: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Commission Signatures */}
              <div className="p-3.5 bg-slate-50 dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-2.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                  <Users size={14} className="text-orange-600" />
                  Комиссия аъзолари ва имзолар (F.I.O.)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Комиссия раиси имзоси:
                    </label>
                    <input
                      type="text"
                      value={formData.chairmanSign}
                      onChange={e => setFormData({ ...formData, chairmanSign: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Комиссия аъзоси 1 имзоси:
                    </label>
                    <input
                      type="text"
                      value={formData.member1Sign}
                      onChange={e => setFormData({ ...formData, member1Sign: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Комиссия аъзоси 2 имзоси:
                    </label>
                    <input
                      type="text"
                      value={formData.member2Sign}
                      onChange={e => setFormData({ ...formData, member2Sign: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Сифат назоратчиси имзоси (QC):
                    </label>
                    <input
                      type="text"
                      value={formData.qcInspectorSign}
                      onChange={e => setFormData({ ...formData, qcInspectorSign: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Тиббий ходим имзоси (Feldsher):
                    </label>
                    <input
                      type="text"
                      value={formData.medicalStaffSign}
                      onChange={e => setFormData({ ...formData, medicalStaffSign: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Decision & Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Изоҳлар (Хулоса / Рухсат)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        status: 'APPROVED',
                        notes: 'Яхши, истеъмолга рухсат этилади.'
                      })
                    }
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Яхши, истеъмолга рухсат</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        status: 'REJECTED',
                        notes: 'Яроқсиз деб топилди, истеъмолга рухсат этилмайди!'
                      })
                    }
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      formData.status === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-white dark:bg-dark-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    <span>Рад этилди / Бракланди</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-dark-750 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-dark-800 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  <span>{editingLog ? "O'zgarishlarni Saqlash" : "Xulosani Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

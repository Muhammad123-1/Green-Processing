'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  HeartPulse,
  Truck,
  Plus,
  Printer,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Save,
  Building2,
  Briefcase,
  Archive,
  Eye,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Utensils,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface MedicalExamRow {
  id: number
  orderNumber?: number
  fullName: string
  department: string
  position: string
  examDate: string
  parsedDate?: string
  bloodPressure?: string
  conclusion?: string
  status: 'EXPIRED' | 'URGENT' | 'VALID'
  isDriver: boolean
  signature?: string
  nurseSignature?: string
  notes?: string
}

export default function MedicalExamContent() {
  const { formatDual, lang } = useLanguage()
  const [items, setItems] = useState<MedicalExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'RED' | 'Цех' | 'Кухня' | 'Логистика' | 'АУП и ИТР'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [summary, setSummary] = useState({
    total: 0,
    expired: 0,
    urgent: 0,
    valid: 0,
    redTotal: 0,
    driversTotal: 0,
    driversRed: 0
  })

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MedicalExamRow | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    department: 'Цех',
    position: 'Оператор цеха',
    examDate: new Date().toISOString().slice(0, 10),
    bloodPressure: '120/80',
    conclusion: 'Соғлом, рухсат',
    isDriver: false,
    signature: '',
    nurseSignature: 'Жуманова Ч.Э.',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/medosmotr'
      const params = new URLSearchParams()
      if (activeTab === 'RED') {
        params.set('status', 'RED')
      } else if (activeTab !== 'ALL') {
        params.set('department', activeTab)
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url)
      const json = await res.json()
      if (json.success && Array.isArray(json.items)) {
        setItems(json.items)
        if (json.summary) {
          setSummary(json.summary)
        }
      }
    } catch {
      toast.error(formatDual("Medosmotr ma'lumotlarini yuklashda xatolik", "Ошибка при загрузке данных медосмотра", "Error loading medical exam data"))
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, formatDual])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      fullName: '',
      department: activeTab === 'ALL' || activeTab === 'RED' ? 'Цех' : activeTab,
      position: 'Оператор цеха',
      examDate: new Date().toISOString().slice(0, 10),
      bloodPressure: '120/80',
      conclusion: 'Соғлом, рухсат',
      isDriver: activeTab === 'Логистика',
      signature: '',
      nurseSignature: 'Жуманова Ч.Э.',
      notes: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: MedicalExamRow) => {
    setEditingItem(item)
    setFormData({
      fullName: item.fullName,
      department: item.department,
      position: item.position,
      examDate: item.examDate,
      bloodPressure: item.bloodPressure || '120/80',
      conclusion: item.conclusion || 'Соғлом, рухсат',
      isDriver: item.isDriver,
      signature: item.signature || '',
      nurseSignature: item.nurseSignature || 'Жуманова Ч.Э.',
      notes: item.notes || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim()) {
      toast.error(formatDual("F.I.O. kiritilishi shart", "Введите Ф.И.О.", "Full name is required"))
      return
    }

    setSubmitting(true)
    try {
      const url = '/api/medosmotr'
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem ? { id: editingItem.id, ...formData } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()

      if (json.success) {
        toast.success(
          editingItem
            ? formatDual("Medosmotr ma'lumoti yangilandi", "Данные медосмотра обновлены", "Medical record updated")
            : formatDual("Yangi xodim medosmotrga kiritildi", "Сотрудник добавлен на медосмотр", "Employee added to medical registry")
        )
        setShowModal(false)
        fetchExams()
      } else {
        toast.error(json.error || "Xatolik yuz berdi")
      }
    } catch {
      toast.error(formatDual("Saqlashda xatolik", "Ошибка при сохранении", "Save error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(formatDual("Haqiqatan ham bu xodimni ro'yxatdan o'chirmoqchimisiz?", "Удалить сотрудника из списка медосмотра?", "Delete this employee from registry?"))) {
      return
    }
    try {
      const res = await fetch(`/api/medosmotr?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(formatDual("O'chirildi", "Удалено", "Deleted"))
        fetchExams()
      }
    } catch {
      toast.error(formatDual("Xatolik", "Ошибка", "Error"))
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* 1. Header with Title & Stats */}
      <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-rose-600 animate-pulse" />
              Tibbiy Ko'rik & SanPiN Nazorati
            </span>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              ООО "GREEN PROCESSING"
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            СПИСОК РАБОТНИКОВ НА МЕДИЦИНСКИЙ ОСМОТР
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {formatDual(
              "Sex, Oshxona, Haydovchilar (Logistika) hamda AUP va ITR xodimlarining majburiy tibbiy ko'rik muddatlari va salomatlik monitoringi",
              "График обязательного периодического медицинского осмотра персонала производства, кухни, водителей и АУП",
              "Mandatory periodic medical examination and arterial blood pressure registry for factory staff and drivers"
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{formatDual("Xodim qo'shish", "Добавить работника", "Add Employee")}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-850 hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
          >
            <Printer size={16} />
            <span>{formatDual("Chop etish", "Печать", "Print")}</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards including Urgent Red Count */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total */}
        <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jami xodimlar</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
              <User size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{summary.total}</div>
          <span className="text-[11px] text-slate-400">Barcha bo'limlar bo'yicha</span>
        </div>

        {/* RED ALERT: Expired or Approaching */}
        <div
          onClick={() => setActiveTab('RED')}
          className="bg-rose-50 dark:bg-rose-950/25 border-2 border-rose-500/50 hover:border-rose-500 p-4 rounded-2xl shadow-xs cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight flex items-center gap-1">
              <AlertOctagon size={14} className="text-rose-600 animate-bounce" /> Qizil Ro'yxat (Muddati kelgan)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
              {summary.redTotal}
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
            {summary.redTotal} <span className="text-xs font-normal">nafar</span>
          </div>
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
            {summary.expired} ta o'tgan / {summary.urgent} ta yaqinlashgan yoki yuqori A/D
          </span>
        </div>

        {/* Valid Green */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Amalda (Ruxsat)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{summary.valid}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Ko'rik muddati standartda</span>
        </div>

        {/* Drivers Fleet */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400">Haydovchilar (Logistika)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Truck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 dark:text-blue-300 font-mono">
            {summary.driversTotal} <span className="text-xs font-normal">({summary.driversRed} qizil)</span>
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400">Kunlik reys oldi nazoratida</span>
        </div>
      </div>

      {/* 3. Category Tabs & Search Bar */}
      <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Department Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL' as const, label: 'Barchasi (82)', icon: User },
            { id: 'RED' as const, label: `⚠️ Qizil Ro'yxat (${summary.redTotal})`, icon: AlertOctagon, isRed: true },
            { id: 'Цех' as const, label: 'Цех (35)', icon: Building2 },
            { id: 'Кухня' as const, label: 'Кухня (10)', icon: Utensils },
            { id: 'Логистика' as const, label: 'Водители (30)', icon: Truck },
            { id: 'АУП и ИТР' as const, label: 'АУП и ИТР (7)', icon: Briefcase }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? tab.isRed
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : tab.isRed
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs w-full sm:w-72">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder={formatDual("F.I.O. yoki lavozim qidirish...", "Поиск по Ф.И.О. или должности...", "Search by name or position...")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="!bg-transparent bg-transparent outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 4. Official Medical Examination Table */}
      <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-dark-700 uppercase tracking-tight text-[11px]">
              <tr>
                <th className="p-3 text-center border-r border-slate-300 dark:border-dark-700 w-12">№ п/п</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[220px]">Ф.И.О. Работника</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[120px]">Бўлинма (Цех/Отдел)</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[140px]">Должность</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[130px] text-center">
                  Медосмотр муддати
                </th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[90px] text-center">А/Д</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[180px]">Хулоса / Ҳолати</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[120px] text-center">Ҳолати</th>
                <th className="p-3 border-r border-slate-300 dark:border-dark-700 min-w-[130px]">Ҳамшира имзоси</th>
                <th className="p-3 text-center w-20 no-print">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-500">
                    <RefreshCw size={20} className="animate-spin inline mr-2 text-rose-500" />
                    {formatDual("Medosmotr ma'lumotlari yuklanmoqda...", "Загрузка журнала...", "Loading registry...")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-500">
                    {formatDual("Xodimlar topilmadi", "Работники не найдены", "No employees found")}
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const isRed = row.status === 'EXPIRED' || row.status === 'URGENT'
                  return (
                    <tr
                      key={row.id}
                      className={`transition ${
                        isRed
                          ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border-l-4 border-l-rose-600'
                          : 'hover:bg-slate-50 dark:hover:bg-dark-800/40'
                      }`}
                    >
                      {/* № */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500 border-r border-slate-200 dark:border-dark-800">
                        {idx + 1}
                      </td>

                      {/* Full Name */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800">
                        <div className="flex items-center gap-2">
                          {isRed && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block shrink-0" title="Muddati yaqinlashgan/o'tgan!" />
                          )}
                          <span className={`font-bold ${isRed ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white'}`}>
                            {row.fullName}
                          </span>
                        </div>
                        {row.isDriver && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            <Truck size={10} /> Ҳайдовчи (Рейс олди кўрик)
                          </span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                          {row.department}
                        </span>
                      </td>

                      {/* Position */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800 font-medium text-slate-700 dark:text-slate-300">
                        {row.position}
                      </td>

                      {/* Exam Date */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-1 rounded-md text-[11px] inline-block ${
                            isRed
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          {row.examDate}
                        </span>
                      </td>

                      {/* Blood Pressure */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800 text-center font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            row.bloodPressure && (parseInt(row.bloodPressure) >= 140 || parseInt(row.bloodPressure.split('/')[1] || '0') >= 95)
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 font-black'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {row.bloodPressure || '—'}
                        </span>
                      </td>

                      {/* Conclusion */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800">
                        {row.conclusion ? (
                          <span className={`font-semibold ${row.conclusion.includes('ГОДЕН В ОЧКАХ') ? 'text-amber-700 dark:text-amber-400 font-bold' : isRed ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {row.conclusion}
                          </span>
                        ) : (
                          <span className="text-slate-400">Соғлом, рухсат</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800 text-center">
                        {row.status === 'EXPIRED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-2xs">
                            Муддати ўтган
                          </span>
                        ) : row.status === 'URGENT' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-2xs">
                            Яқинлашган
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Амалда
                          </span>
                        )}
                      </td>

                      {/* Nurse Signature */}
                      <td className="p-3 border-r border-slate-200 dark:border-dark-800 font-serif italic text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{row.nurseSignature || 'Жуманова Ч.Э.'}</span>
                          <span className="text-[9px] bg-slate-200 dark:bg-dark-750 px-1 py-0.5 rounded text-slate-500 font-sans not-italic font-bold">
                            ✓ Имзо
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-dark-750 rounded-lg transition cursor-pointer"
                            title={formatDual("Tahrirlash / Ko'rik kiritish", "Редактировать / Внести осмотр", "Edit")}
                          >
                            <UserCheck size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-dark-750 rounded-lg transition cursor-pointer"
                            title={formatDual("O'chirish", "Удалить", "Delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-enter no-print">
          <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-3xl shadow-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-750 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse size={18} className="text-rose-600" />
                {editingItem ? formatDual("Medosmotrni tahrirlash", "Редактирование медосмотра", "Edit Medical Exam") : formatDual("Yangi xodim qo'shish", "Новый работник на медосмотр", "Add Employee to Medical Exam")}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ф.И.О. Работника *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Аралбаев Жавохир Шухрат ули"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Бўлинма (Цех/Отдел)
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => {
                      const dept = e.target.value
                      setFormData(p => ({
                        ...p,
                        department: dept,
                        isDriver: dept === 'Логистика'
                      }))
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Цех">Цех (Производство)</option>
                    <option value="Кухня">Кухня (Ошхона)</option>
                    <option value="Логистика">Логистика (Водители)</option>
                    <option value="АУП и ИТР">АУП и ИТР (Администрация)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={e => setFormData(p => ({ ...p, position: e.target.value }))}
                    placeholder="грузчик, оператор цеха, водитель..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Медосмотр муддати (Сана) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.examDate}
                    onChange={e => setFormData(p => ({ ...p, examDate: e.target.value }))}
                    placeholder="13.11.2026г yoki YYYY-MM-DD"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    А/Д (Артериал босим)
                  </label>
                  <input
                    type="text"
                    value={formData.bloodPressure}
                    onChange={e => setFormData(p => ({ ...p, bloodPressure: e.target.value }))}
                    placeholder="120/80"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Хулоса / Кўрик ҳолати
                </label>
                <input
                  type="text"
                  value={formData.conclusion}
                  onChange={e => setFormData(p => ({ ...p, conclusion: e.target.value }))}
                  placeholder="ГОДЕН В ОЧКАХ, Соғлом рухсат..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDriverCb"
                  checked={formData.isDriver}
                  onChange={e => setFormData(p => ({ ...p, isDriver: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="isDriverCb" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Ҳайдовчилар паркига тегишли (Кунлик рейс олди назорати учун)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md shadow-blue-600/25 transition cursor-pointer"
                >
                  {submitting ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  FileText,
  AlertOctagon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  ShieldCheck,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

export interface WastageLogItem {
  id: number
  actNumber: string
  batchNumber: string | null
  productName: string
  supplierName: string | null
  reportedByName: string | null
  receivedByName: string | null
  investigatedByName: string | null
  responsibilityStatus: 'NOT_DETERMINED' | 'UNDER_INVESTIGATION' | 'DETERMINED' | 'CLEARED'
  responsiblePersonName: string | null
  responsibilityDecisionNote: string | null
  responsibilityDecidedAt: string | null
  stage: 'INCOMING' | 'PROCESSING' | 'STORAGE'
  wastageType: 'ACTUAL_DEFECT' | 'NATURAL_TECH_WASTE'
  weightKg: number
  reasonCategory: string
  detailedComment: string | null
  photoUrl: string | null
  documentUrl: string | null
  incidentDate: string
  incidentTime: string | null
  isCancelled: boolean
}

interface Props {
  initialProductFilter?: string
  initialStageFilter?: string
  initialWastageType?: string
  dateFrom?: string
  dateTo?: string
  lang: string
}

export default function WastageAuditJournal({ initialProductFilter = '', initialStageFilter = '', initialWastageType = '', dateFrom = '', dateTo = '', lang }: Props) {
  const [items, setItems] = useState<WastageLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [wastageTypeFilter, setWastageTypeFilter] = useState(initialWastageType)
  const [productFilter, setProductFilter] = useState(initialProductFilter)

  // Modals
  const [selectedAct, setSelectedAct] = useState<WastageLogItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingDecision, setSavingDecision] = useState(false)
  const [decision, setDecision] = useState({
    investigatedByName: '',
    responsibilityStatus: 'NOT_DETERMINED',
    responsiblePersonName: '',
    responsibilityDecisionNote: '',
  })

  // New act form
  const [newAct, setNewAct] = useState({
    productName: '',
    batchNumber: '',
    supplierName: '',
    stage: 'PROCESSING' as 'INCOMING' | 'PROCESSING' | 'STORAGE',
    wastageType: 'ACTUAL_DEFECT' as 'ACTUAL_DEFECT' | 'NATURAL_TECH_WASTE',
    weightKg: '',
    reasonCategory: 'Mexanik shikast',
    detailedComment: '',
    photoUrl: '',
    documentUrl: '',
    incidentDate: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (initialProductFilter) {
      setProductFilter(initialProductFilter)
    }
  }, [initialProductFilter])

  useEffect(() => {
    setStageFilter(initialStageFilter)
    setWastageTypeFilter(initialWastageType)
  }, [initialStageFilter, initialWastageType])

  useEffect(() => {
    if (!selectedAct) return
    setDecision({
      investigatedByName: selectedAct.investigatedByName || '',
      responsibilityStatus: selectedAct.responsibilityStatus || 'NOT_DETERMINED',
      responsiblePersonName: selectedAct.responsiblePersonName || '',
      responsibilityDecisionNote: selectedAct.responsibilityDecisionNote || '',
    })
  }, [selectedAct])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
      })
      if (search) params.append('search', search)
      if (stageFilter) params.append('stage', stageFilter)
      if (wastageTypeFilter) params.append('wastageType', wastageTypeFilter)
      if (productFilter) params.append('productName', productFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const res = await fetch(`/api/director/wastage-logs?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data?.success) {
        setItems(data.items || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.totalItems || 0)
      } else {
        toast.error(data?.error || "Ma'lumot yuklashda xatolik")
      }
    } catch {
      toast.error("Aloqa uzildi")
    } finally {
      setLoading(false)
    }
  }, [page, search, stageFilter, wastageTypeFilter, productFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleCreateAct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAct.productName || !newAct.weightKg) {
      toast.error("Mahsulot va vaznini kiriting")
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/director/wastage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAct),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        toast.success("Brak akti muvaffaqiyatli saqlandi!")
        setShowCreateModal(false)
        setNewAct({
          productName: '',
          batchNumber: '',
          supplierName: '',
          stage: 'PROCESSING',
          wastageType: 'ACTUAL_DEFECT',
          weightKg: '',
          reasonCategory: 'Mexanik shikast',
          detailedComment: '',
          photoUrl: '',
          documentUrl: '',
          incidentDate: new Date().toISOString().slice(0, 10),
        })
        await fetchLogs()
      } else {
        toast.error(data?.error || "Saqlashda xatolik")
      }
    } catch {
      toast.error("Server bilan aloqa uzildi")
    } finally {
      setCreating(false)
    }
  }

  const responsibilityLabel = (status: WastageLogItem['responsibilityStatus']) => {
    switch (status) {
      case 'DETERMINED': return 'Tasdiqlangan'
      case 'UNDER_INVESTIGATION': return 'Tekshiruvda'
      case 'CLEARED': return 'Javobgarlik aniqlanmadi'
      default: return 'Aniqlanmagan'
    }
  }

  const saveResponsibility = async () => {
    if (!selectedAct) return
    setSavingDecision(true)
    try {
      const res = await fetch('/api/director/wastage-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAct.id, action: 'RESPONSIBILITY_DECISION', ...decision }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Saqlashda xatolik')
      setItems((current) => current.map((item) => item.id === data.log.id ? data.log : item))
      setSelectedAct(data.log)
      toast.success('Javobgarlik qarori audit jurnaliga saqlandi')
    } catch (error: any) {
      toast.error(error?.message || 'Server bilan aloqa uzildi')
    } finally {
      setSavingDecision(false)
    }
  }

  const stageBadge = (stage: string) => {
    switch (stage) {
      case 'INCOMING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">QABUL</span>
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">ISHLOV</span>
      case 'STORAGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">OMBOR</span>
      default:
        return <span>{stage}</span>
    }
  }

  return (
    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-dark-850/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'ru' ? 'Аудит-журнал брака и рекламаций' : 'Brak va yo‘qotishlar audit jurnali (Layer 3)'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-dark-750 text-slate-700 dark:text-slate-300">
              {totalItems} ta yozuv
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ru'
              ? 'Первичные акты, партии, поставщики, причины и ответственные лица'
              : "Brak sabablari, partiyalar, ta'minotchi va javobgar shaxslar ko'rsatilgan birlamchi aktlar"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value)
              setPage(1)
            }}
            className="px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="">{lang === 'ru' ? 'Все этапы' : 'Barcha bosqichlar'}</option>
            <option value="INCOMING">1. Qabul (Incoming)</option>
            <option value="PROCESSING">2. Ishlov (Processing)</option>
            <option value="STORAGE">3. Ombor (Storage)</option>
          </select>

          <select
            value={wastageTypeFilter}
            onChange={(e) => { setWastageTypeFilter(e.target.value); setPage(1) }}
            className="px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="">Barcha yo'qotishlar</option>
            <option value="ACTUAL_DEFECT">Haqiqiy brak</option>
            <option value="NATURAL_TECH_WASTE">Texnologik chiqindi</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск по актам...' : "Qidiruv (Akt, Sabab)..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Product Clear tag if present */}
          {productFilter && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl">
              <span>{productFilter}</span>
              <button onClick={() => setProductFilter('')} className="hover:text-rose-500">
                <X size={12} />
              </button>
            </span>
          )}

          {/* New Act Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>{lang === 'ru' ? 'Новый акт' : 'Yangi akt'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-100/80 dark:bg-dark-800/80 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-dark-750">
            <tr>
              <th className="p-3.5 pl-5">{lang === 'ru' ? 'Акт №' : 'Akt raqami'}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Дата / Время' : 'Sana / Vaqt'}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Сырье' : 'Mahsulot'}</th>
              <th className="p-3.5 text-center">{lang === 'ru' ? 'Этап' : 'Bosqich'}</th>
              <th className="p-3.5 text-right">{lang === 'ru' ? 'Вес (кг)' : 'Vazn (kg)'}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Поставщик / Партия' : "Ta'minotchi / Partiya"}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Причина' : 'Brak sababi'}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Заявитель' : 'Qayd etgan'}</th>
              <th className="p-3.5">{lang === 'ru' ? 'Ответственность' : 'Javobgarlik'}</th>
              <th className="p-3.5 text-center">{lang === 'ru' ? 'Фото' : 'Foto'}</th>
              <th className="p-3.5 w-10 pr-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-xs font-medium">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={11} className="p-4 bg-slate-50/50 dark:bg-dark-850/30">
                    <div className="h-5 bg-slate-200 dark:bg-dark-750 rounded" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-1">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {lang === 'ru' ? 'Актов не найдено' : "Hech qanday brak akti topilmadi"}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ru'
                        ? 'По заданным фильтрам первичные документы отсутствуют'
                        : "Ushbu parametrlar bo'yicha birlamchi hujjatlar mavjud emas"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((act) => (
                <tr
                  key={act.id}
                  onClick={() => setSelectedAct(act)}
                  className="group hover:bg-slate-50 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 pl-5 font-mono font-bold text-slate-900 dark:text-white">
                    {act.actNumber}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {act.incidentDate} {act.incidentTime ? <span className="text-[10px] opacity-75">{act.incidentTime}</span> : ''}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {act.productName}
                  </td>
                  <td className="p-3.5 text-center">
                    {stageBadge(act.stage)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    {act.weightKg.toLocaleString()} kg
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    <div>{act.supplierName || '—'}</div>
                    {act.batchNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">P: {act.batchNumber}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-[11px] font-semibold">
                      {act.reasonCategory}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                    {act.reportedByName || '—'}
                  </td>
                  <td className="p-3.5 text-[11px]">
                    <span className={act.responsibilityStatus === 'DETERMINED' ? 'font-bold text-rose-600' : 'text-slate-500'}>
                      {act.responsibilityStatus === 'DETERMINED' ? act.responsiblePersonName : responsibilityLabel(act.responsibilityStatus)}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    {act.photoUrl ? (
                      <a
                        href={act.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                        title="Rasmni ko'rish"
                      >
                        <ImageIcon size={16} />
                      </a>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-3.5 pr-5 text-right text-slate-400 group-hover:text-emerald-500">
                    <ExternalLink size={14} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 dark:border-dark-750 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            {page} / {totalPages} - sahifa (Jami: {totalItems})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-750 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-750 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal: View Act Details */}
      {selectedAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Brak Akti</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-mono">{selectedAct.actNumber}</h3>
              </div>
              <button onClick={() => setSelectedAct(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Mahsulot</span>
                <b className="text-slate-900 dark:text-white text-sm">{selectedAct.productName}</b>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Yo‘qotish miqdori</span>
                <b className="text-rose-600 text-sm font-mono">{selectedAct.weightKg} kg</b>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bosqich</span>
                <div className="mt-0.5">{stageBadge(selectedAct.stage)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ta‘minotchi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAct.supplierName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Partiya raqami</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedAct.batchNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sana va vaqt</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedAct.incidentDate} {selectedAct.incidentTime || ''}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Qayd etgan</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedAct.reportedByName || 'Ko\'rsatilmagan'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Qabul qilgan</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedAct.receivedByName || 'Ko\'rsatilmagan'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">Sabab kategoriyasi</span>
                <span className="font-bold text-amber-600">{selectedAct.reasonCategory}</span>
              </div>
              {selectedAct.detailedComment && (
                <div className="col-span-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700">
                  <span className="text-slate-400 block text-[10px] mb-1">Izoh / Tafsilotlar</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedAct.detailedComment}</p>
                </div>
              )}
              {selectedAct.photoUrl && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] mb-1">Isbotlovchi foto-dalil</span>
                  <a
                    href={selectedAct.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 max-h-48"
                  >
                    <img src={selectedAct.photoUrl} alt="Brak dalili" className="w-full h-auto object-cover" />
                  </a>
                </div>
              )}
              {selectedAct.documentUrl && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] mb-1">Tasdiqlovchi hujjat</span>
                  <a href={selectedAct.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    <FileText size={14} /> Hujjatni ochish
                  </a>
                </div>
              )}
            </div>

            <section className="border border-slate-200 dark:border-dark-750 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-600" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Sabab va javobgarlik qarori</h4>
                  <p className="text-[10px] text-slate-400">Qayd etgan yoki qabul qilgan shaxs avtomatik ravishda aybdor deb belgilanmaydi.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="font-semibold text-slate-600 dark:text-slate-300">Tekshirgan shaxs
                  <input value={decision.investigatedByName} onChange={(e) => setDecision({ ...decision, investigatedByName: e.target.value })} className="mt-1 w-full px-2.5 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl outline-none" placeholder="F.I.Sh." />
                </label>
                <label className="font-semibold text-slate-600 dark:text-slate-300">Qaror holati
                  <select value={decision.responsibilityStatus} onChange={(e) => setDecision({ ...decision, responsibilityStatus: e.target.value as WastageLogItem['responsibilityStatus'], responsiblePersonName: e.target.value === 'DETERMINED' ? decision.responsiblePersonName : '' })} className="mt-1 w-full px-2.5 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl outline-none">
                    <option value="NOT_DETERMINED">Aniqlanmagan</option>
                    <option value="UNDER_INVESTIGATION">Tekshiruvda</option>
                    <option value="DETERMINED">Tasdiqlangan</option>
                    <option value="CLEARED">Javobgarlik aniqlanmadi</option>
                  </select>
                </label>
                {decision.responsibilityStatus === 'DETERMINED' && (
                  <label className="font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Tasdiqlangan javobgar shaxs
                    <input value={decision.responsiblePersonName} onChange={(e) => setDecision({ ...decision, responsiblePersonName: e.target.value })} className="mt-1 w-full px-2.5 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl outline-none" placeholder="F.I.Sh. yoki tashkilot" />
                  </label>
                )}
                <label className="font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Qaror asosi / hujjat raqami
                  <textarea value={decision.responsibilityDecisionNote} onChange={(e) => setDecision({ ...decision, responsibilityDecisionNote: e.target.value })} rows={2} className="mt-1 w-full px-2.5 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl outline-none" placeholder="Tasdiqlovchi dalil yoki qaror rekviziti" />
                </label>
              </div>
              <div className="flex justify-end">
                <button onClick={saveResponsibility} disabled={savingDecision} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold">
                  <Save size={14} /> {savingDecision ? 'Saqlanmoqda...' : 'Qarorni saqlash'}
                </button>
              </div>
            </section>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Act */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
          <form
            onSubmit={handleCreateAct}
            className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Yangi Brak Akti Rasmiylashtirish</h3>
                <p className="text-xs text-slate-400">Audit va javobgarlik zanjiri uchun</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mahsulot / Xomashyo nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Томат, Салат Айсберг..."
                  value={newAct.productName}
                  onChange={(e) => setNewAct({ ...newAct, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vazn (kg) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.0"
                    value={newAct.weightKg}
                    onChange={(e) => setNewAct({ ...newAct, weightKg: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-mono font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Ishlab chiqarish bosqichi</label>
                  <select
                    value={newAct.stage}
                    onChange={(e) => setNewAct({ ...newAct, stage: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-bold"
                  >
                    <option value="INCOMING">1. Qabul (Incoming)</option>
                    <option value="PROCESSING">2. Ishlov (Processing)</option>
                    <option value="STORAGE">3. Ombor (Storage)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Partiya raqami</label>
                  <input
                    type="text"
                    placeholder="BATCH-2026-..."
                    value={newAct.batchNumber}
                    onChange={(e) => setNewAct({ ...newAct, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Ta‘minotchi</label>
                  <input
                    type="text"
                    placeholder="Ta'minotchi korxona"
                    value={newAct.supplierName}
                    onChange={(e) => setNewAct({ ...newAct, supplierName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sabab kategoriyasi</label>
                <select
                  value={newAct.reasonCategory}
                  onChange={(e) => setNewAct({ ...newAct, reasonCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-semibold"
                >
                  <option value="Mexanik shikast">Mexanik shikast / Ezilgan</option>
                  <option value="Chirish / Zang">Chirish / Mog'or / Kasallik</option>
                  <option value="Muzlash / Sovuq urgan">Muzlash / Sovuq urgan</option>
                  <option value="So'lish / Sarg'ayish">So'lish / Barg sarg'ayishi</option>
                  <option value="Kalibrga mos emas">Kalibrga / Standartga mos emas</option>
                  <option value="Harorat buzilishi">Saqlash harorati buzilishi</option>
                  <option value="Boshqa">Boshqa sabab</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Batafsil izoh</label>
                <textarea
                  rows={2}
                  placeholder="Voqea tafsilotlari, qaysi xodim aniqlaganligi..."
                  value={newAct.detailedComment}
                  onChange={(e) => setNewAct({ ...newAct, detailedComment: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Foto-dalil havolasi (ixtiyoriy)</label>
                <input
                  type="url"
                  placeholder="https://... yoki bo'sh qoldiring"
                  value={newAct.photoUrl}
                  onChange={(e) => setNewAct({ ...newAct, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hujjat havolasi (ixtiyoriy)</label>
                <input
                  type="url"
                  placeholder="Dalolatnoma, ekspertiza yoki boshqa fayl havolasi"
                  value={newAct.documentUrl}
                  onChange={(e) => setNewAct({ ...newAct, documentUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>Aktni tasdiqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Download,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Sparkles,
  Calendar,
  Layers,
  Building2,
  Check,
  Scale,
  DollarSign,
  UserCheck,
  TestTube2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface DisinfectionAct {
  id: number
  orderNumber: number
  arrivalDate: string
  substanceName: string
  productType?: string | null
  supplierName?: string | null
  batchNumber?: string | null
  accompanyingDoc?: string | null
  activeChlorinePercent?: number | null
  quantityReceived?: number | null
  unit: string
  manufactureDate?: string | null
  expiryDate?: string | null
  transportCondition: string
  accessPermit: string
  releasedKg?: number | null
  releasedDate?: string | null
  inspectorName?: string | null
  pricePerKg?: number | null
  registrationCert?: string | null
  conformityDeclaration?: string | null
  category: string
  notes?: string | null
}

interface StatsData {
  totalActs: number
  filteredCount: number
  totalReceivedKg: number
  totalReleasedKg: number
  totalBatches: number
  substances: string[]
  suppliers: string[]
}

const emptyForm = {
  orderNumber: '',
  arrivalDate: new Date().toISOString().slice(0, 10),
  substanceName: 'Гипохлорид натрия',
  productType: 'ГОСТ 11086-76',
  supplierName: 'ЧП "TURK SHANAY BIZNES"',
  batchNumber: '',
  accompanyingDoc: 'Сертификат качества',
  activeChlorinePercent: '12',
  quantityReceived: '400',
  unit: 'кг',
  manufactureDate: '',
  expiryDate: '',
  transportCondition: 'удовлетворительно',
  accessPermit: 'допущено',
  releasedKg: '',
  releasedDate: '',
  inspectorName: 'Камбарова А.М.',
  pricePerKg: '7000',
  registrationCert: '',
  conformityDeclaration: '',
  category: 'DEZ',
  notes: ''
}

export default function DisinfectionActsContent() {
  const [acts, setActs] = useState<DisinfectionAct[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalActs: 0,
    filteredCount: 0,
    totalReceivedKg: 0,
    totalReleasedKg: 0,
    totalBatches: 0,
    substances: [],
    suppliers: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [substanceFilter, setSubstanceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAct, setEditingAct] = useState<DisinfectionAct | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Fetch acts
  const fetchActs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
      if (substanceFilter && substanceFilter !== 'all') params.append('substance', substanceFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('sort', sortOrder)

      const res = await fetch(`/api/incoming-acts/disinfection?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setActs(data.acts || [])
        setStats(data.stats || {
          totalActs: 0,
          filteredCount: 0,
          totalReceivedKg: 0,
          totalReleasedKg: 0,
          totalBatches: 0,
          substances: [],
          suppliers: []
        })
      } else {
        toast.error(data.error || "Ma'lumotlarni yuklashda xatolik yuz berdi")
      }
    } catch (err: any) {
      toast.error(err.message || 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActs()
  }, [categoryFilter, substanceFilter, dateFrom, dateTo, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActs()
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchActs()
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    if (substanceFilter && substanceFilter !== 'all') params.append('substance', substanceFilter)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)

    window.open(`/api/incoming-acts/disinfection/export?${params.toString()}`, '_blank')
  }

  const handleOpenCreate = () => {
    setEditingAct(null)
    setFormData({
      ...emptyForm,
      orderNumber: String(acts.length + 1)
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (act: DisinfectionAct) => {
    setEditingAct(act)
    setFormData({
      orderNumber: String(act.orderNumber),
      arrivalDate: act.arrivalDate || '',
      substanceName: act.substanceName || '',
      productType: act.productType || '',
      supplierName: act.supplierName || '',
      batchNumber: act.batchNumber || '',
      accompanyingDoc: act.accompanyingDoc || '',
      activeChlorinePercent: act.activeChlorinePercent !== null && act.activeChlorinePercent !== undefined ? String(act.activeChlorinePercent) : '',
      quantityReceived: act.quantityReceived !== null && act.quantityReceived !== undefined ? String(act.quantityReceived) : '',
      unit: act.unit || 'кг',
      manufactureDate: act.manufactureDate || '',
      expiryDate: act.expiryDate || '',
      transportCondition: act.transportCondition || 'удовлетворительно',
      accessPermit: act.accessPermit || 'допущено',
      releasedKg: act.releasedKg !== null && act.releasedKg !== undefined ? String(act.releasedKg) : '',
      releasedDate: act.releasedDate || '',
      inspectorName: act.inspectorName || '',
      pricePerKg: act.pricePerKg !== null && act.pricePerKg !== undefined ? String(act.pricePerKg) : '',
      registrationCert: act.registrationCert || '',
      conformityDeclaration: act.conformityDeclaration || '',
      category: act.category || 'DEZ',
      notes: act.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.substanceName.trim()) {
      toast.error('Vosita nomi to\'ldirilishi shart!')
      return
    }

    try {
      setSaving(true)
      const url = editingAct
        ? `/api/incoming-acts/disinfection/${editingAct.id}`
        : '/api/incoming-acts/disinfection'
      const method = editingAct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingAct ? 'Muvaffaqiyatli yangilandi!' : 'Yangi akt muvaffaqiyatli saqlandi!')
        setIsModalOpen(false)
        fetchActs()
      } else {
        toast.error(data.error || 'Saqlashda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Haqiqatan ham ushbu yozuvni o\'chirmoqchimisiz?')) return

    try {
      setDeletingId(id)
      const res = await fetch(`/api/incoming-acts/disinfection/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Muvaffaqiyatli o\'chirildi!')
        fetchActs()
      } else {
        toast.error(data.error || 'O\'chirishda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'O\'chirishda xatolik')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-2 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/incoming-acts"
            className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300"
          >
            <span>🥗</span>
            <span>Xomashyolar (Asosiy xomashyo)</span>
          </Link>
          <div
            className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 bg-teal-600 text-white shadow-md shadow-teal-600/20"
          >
            <FlaskConical className="w-4 h-4 text-white" />
            <span>Dezinfeksiya va yuvish vositalari</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 transition"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Excel yuklab olish</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi qabul qo'shish</span>
          </button>
        </div>
      </div>

      {/* Official Form Header Banner */}
      <div className="bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-900 text-white p-5 rounded-2xl border border-teal-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <FlaskConical className="w-64 h-64 text-teal-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase tracking-wider">
                SanPiN / QC Nazorati
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
              Журнал регистрации поступления моющих, дезинфицирующих и химических средств
            </h1>
            <p className="text-xs md:text-sm text-teal-200/80 mt-1">
              Korxonaga qabul qilinayotgan barcha dezinfeksiya, yuvish vositalari hamda kimyoviy qo'shimchalarning (kislota, konservantlar) sifat va partiya nazorati
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold block">Jami partiyalar</span>
              <span className="text-lg font-black text-white">{stats.totalActs} ta</span>
            </div>
            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold block">Qabul (Hajm)</span>
              <span className="text-lg font-black text-emerald-400">{stats.totalReceivedKg.toLocaleString()} kg</span>
            </div>
            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold block">Sexga berildi</span>
              <span className="text-lg font-black text-amber-300">{stats.totalReleasedKg.toLocaleString()} kg</span>
            </div>
            <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold block">Qoldiq omborda</span>
              <span className="text-lg font-black text-cyan-300">{(stats.totalReceivedKg - stats.totalReleasedKg).toLocaleString()} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Vosita nomi, partiya raqami, ta'minotchi, sertifikat yoki nazoratchi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-dark-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Barchasi ({stats.totalActs})
            </button>
            <button
              onClick={() => setCategoryFilter('DEZ')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'DEZ'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🧪</span>
              <span>Dezinfeksiya</span>
            </button>
            <button
              onClick={() => setCategoryFilter('MOYUSHIE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'MOYUSHIE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🧼</span>
              <span>Yuvish vositalari</span>
            </button>
            <button
              onClick={() => setCategoryFilter('XIMIYA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'XIMIYA'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>⚗️</span>
              <span>Kimyoviy moddalar (Konservantlar)</span>
            </button>
          </div>

          {/* Dates & Sort */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs text-slate-900 dark:text-white"
              title="Dan"
            />
            <span className="text-xs text-slate-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs text-slate-900 dark:text-white"
              title="Gacha"
            />
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Sana: {sortOrder === 'asc' ? 'Avval eskilar ↑' : 'Avval yangilar ↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Matching Excel Template */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Qaydlar ro'yxati
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-semibold">
              {acts.length} ta yozuv
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Standart qabul jurnali
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Row 1 Header */}
              <tr className="bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-dark-700 text-center font-bold">
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 w-10">№<br />п/п</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[100px]">ДАТА<br />ПОСТУПЛЕНИЯ</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[190px] text-left">Наименование<br />средства</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-dark-700 min-w-[110px]">Вид<br />изделия</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[160px] text-left">Поставщик</th>
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 min-w-[70px]">№<br />партии</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[140px]">Сопровождающий<br />документ</th>
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 min-w-[100px] bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300">
                  Активный хлор /<br />Концентрация, %
                </th>
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 min-w-[85px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  Поступило<br />(кг)
                </th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-dark-700 min-w-[95px]">Дата<br />изготовления</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-dark-700 min-w-[95px]">Годен<br />до</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[130px]">Оценка условий<br />транспортирования</th>
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 min-w-[90px]">Допуск</th>
                <th className="py-2.5 px-2 border-r border-slate-300 dark:border-dark-700 min-w-[85px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                  Отпущено:<br />кг
                </th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-dark-700 min-w-[95px]">Отпущено:<br />Дата</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-dark-700 min-w-[140px] text-left">ФИО, Подпись<br />ответственного</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 dark:border-dark-700 min-w-[85px]">Цена<br />кг\шт</th>
                <th className="py-2.5 px-2 min-w-[80px]">Amallar</th>
              </tr>
              {/* Row 2 Subheader / Column numbers */}
              <tr className="bg-slate-200/70 dark:bg-dark-700 text-slate-500 dark:text-slate-400 border-b border-slate-300 dark:border-dark-600 text-center font-mono text-[10px]">
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">1</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">2</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">3</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">4</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">5</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">6</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">7</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">8</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">9</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">10</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">11</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">12</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">13</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">14</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">15</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">16</td>
                <td className="py-1 border-r border-slate-300 dark:border-dark-600">17</td>
                <td className="py-1">⚙️</td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
              {loading ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-500" />
                    <span>Yuklanmoqda...</span>
                  </td>
                </tr>
              ) : acts.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">Hech qanday ma'lumot topilmadi</p>
                    <p className="text-xs text-slate-500 mt-1">Filtrlarni tozalang yoki yangi qabul qo'shing</p>
                  </td>
                </tr>
              ) : (
                acts.map((act, index) => {
                  const isPermitted = act.accessPermit?.toLowerCase().includes('допущ')
                  const isGoodTransport = act.transportCondition?.toLowerCase().includes('удовл')
                  const isXimiya = act.category === 'XIMIYA'
                  const isMoyushie = act.category === 'MOYUSHIE'

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition text-slate-800 dark:text-slate-200"
                    >
                      {/* 1. № п/п */}
                      <td className="py-2 px-2 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-dark-700">
                        {act.orderNumber || index + 1}
                      </td>

                      {/* 2. ДАТА ПОСТУПЛЕНИЯ */}
                      <td className="py-2 px-3 text-center whitespace-nowrap font-mono font-medium border-r border-slate-200 dark:border-dark-700">
                        {act.arrivalDate}
                      </td>

                      {/* 3. Наименование средства */}
                      <td className="py-2 px-3 font-bold border-r border-slate-200 dark:border-dark-700 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            isXimiya ? 'bg-amber-500' : isMoyushie ? 'bg-indigo-500' : 'bg-teal-500'
                          }`} />
                          <span>{act.substanceName}</span>
                          {isXimiya && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-normal">
                              Ximiya
                            </span>
                          )}
                          {isMoyushie && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-normal">
                              Yuvish
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Вид изделия */}
                      <td className="py-2 px-2.5 text-center text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-dark-700">
                        {act.productType || '-'}
                      </td>

                      {/* 5. Поставщик */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-dark-700 font-medium">
                        {act.supplierName || '-'}
                      </td>

                      {/* 6. № партии */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-dark-700">
                        {act.batchNumber || '-'}
                      </td>

                      {/* 7. Сопровождающий документ */}
                      <td className="py-2 px-3 text-center text-[11px] border-r border-slate-200 dark:border-dark-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300">
                          {act.accompanyingDoc || act.registrationCert || '-'}
                        </span>
                      </td>

                      {/* 8. Содержание активного хлора / Концентрация, в % */}
                      <td className="py-2 px-2 text-center font-bold border-r border-slate-200 dark:border-dark-700 bg-cyan-50/30 dark:bg-cyan-950/10">
                        {act.activeChlorinePercent !== null && act.activeChlorinePercent !== undefined ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 font-mono">
                            {act.activeChlorinePercent}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* 9. Поступило (кг) */}
                      <td className="py-2 px-2 text-center font-black border-r border-slate-200 dark:border-dark-700 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400">
                        {act.quantityReceived ? `${act.quantityReceived} ${act.unit || 'кг'}` : '-'}
                      </td>

                      {/* 10. Дата изготовления */}
                      <td className="py-2 px-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-dark-700">
                        {act.manufactureDate || '-'}
                      </td>

                      {/* 11. Годен до */}
                      <td className="py-2 px-2.5 text-center font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 border-r border-slate-200 dark:border-dark-700">
                        {act.expiryDate || '-'}
                      </td>

                      {/* 12. Оценка условий транспортирования */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-dark-700">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isGoodTransport
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {act.transportCondition}
                        </span>
                      </td>

                      {/* 13. Допуск */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-dark-700">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isPermitted
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {act.accessPermit}
                        </span>
                      </td>

                      {/* 14. Отпущено в производство: кг */}
                      <td className="py-2 px-2 text-center font-bold border-r border-slate-200 dark:border-dark-700 bg-amber-50/30 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300">
                        {act.releasedKg ? `${act.releasedKg} кг` : '-'}
                      </td>

                      {/* 15. Отпущено в производство: Дата */}
                      <td className="py-2 px-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-dark-700">
                        {act.releasedDate || '-'}
                      </td>

                      {/* 16. ФИО, Подпись ответственного */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-300 font-medium">
                        {act.inspectorName || '-'}
                      </td>

                      {/* 17. Цена кг\шт */}
                      <td className="py-2 px-2.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-dark-700">
                        {act.pricePerKg ? `${act.pricePerKg.toLocaleString()} so'm` : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(act)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-dark-700 text-blue-600 dark:text-blue-400 transition"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(act.id)}
                            disabled={deletingId === act.id}
                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-slate-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingAct ? "Qabul aktini tahrirlash" : "Yangi qabul aktini kiritish"}
                </h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  Dezinfeksiya, yuvish va kimyoviy vositalar qabuli jurnali
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. № п/п */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    № п/п (Tartib raqami)
                  </label>
                  <input
                    type="number"
                    value={formData.orderNumber}
                    onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                {/* 2. ДАТА ПОСТУПЛЕНИЯ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelgan sana (ДАТА ПОСТУПЛЕНИЯ) *
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                    required
                  />
                </div>

                {/* Kategoriya */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategoriya
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="DEZ">🧪 Dezinfeksiya vositalari</option>
                    <option value="MOYUSHIE">🧼 Yuvish vositalari</option>
                    <option value="XIMIYA">⚗️ Kimyoviy moddalar (Konservantlar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Наименование средства */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vosita nomi (Наименование средства) *
                  </label>
                  <input
                    type="text"
                    value={formData.substanceName}
                    onChange={e => setFormData({ ...formData, substanceName: e.target.value })}
                    placeholder="Masalan: Гипохлорид натрия, КИСЛОТА УКСУСНАЯ"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>

                {/* 4. Вид изделия */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mahsulot turi (Вид изделия / ГОСТ / ТУ)
                  </label>
                  <input
                    type="text"
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    placeholder="Masalan: ГОСТ 11086-76, ГОСТ 61-75"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 5. Поставщик */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Yetkazib beruvchi (Поставщик)
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="Masalan: RENAISSANCE PRODUCTION, OT-CHEM MCHJ"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* 6. № партии */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Partiya raqami (№ партии)
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="Masalan: 1, 2, 58-505"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* 7. Сопровождающий документ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kuzatuvchi hujjat (Сертификат)
                  </label>
                  <input
                    type="text"
                    value={formData.accompanyingDoc}
                    onChange={e => setFormData({ ...formData, accompanyingDoc: e.target.value })}
                    placeholder="Masalan: Сертификат качества"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 8. Содержание активного хлора / Концентрация, в % */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Faol xlor / Konsentratsiya, %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.activeChlorinePercent}
                    onChange={e => setFormData({ ...formData, activeChlorinePercent: e.target.value })}
                    placeholder="12 yoki 99.9"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* 9. Поступило (кг) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelgan miqdor (Поступило, кг)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.quantityReceived}
                    onChange={e => setFormData({ ...formData, quantityReceived: e.target.value })}
                    placeholder="100"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* 17. Цена кг\шт */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Narxi (so'm/kg yoki dona)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pricePerKg}
                    onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                    placeholder="7000"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 10. Дата изготовления */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ishlab chiqarilgan sana (Дата изготовления)
                  </label>
                  <input
                    type="date"
                    value={formData.manufactureDate}
                    onChange={e => setFormData({ ...formData, manufactureDate: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* 11. Годен до */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amal qilish muddati (Годен до)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 12. Оценка условий транспортирования */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transport sharoiti (Оценка условий транспортирования)
                  </label>
                  <select
                    value={formData.transportCondition}
                    onChange={e => setFormData({ ...formData, transportCondition: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="удовлетворительно">удовлетворительно (Qoniqarli)</option>
                    <option value="неудовлетворительно">неудовлетворительно (Qoniqarsiz)</option>
                  </select>
                </div>

                {/* 13. Допуск */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ruxsat (Допуск к производству)
                  </label>
                  <select
                    value={formData.accessPermit}
                    onChange={e => setFormData({ ...formData, accessPermit: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white font-bold"
                  >
                    <option value="допущено">допущено (Ruxsat etildi)</option>
                    <option value="не допущено">не допущено (Rad etildi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 14. Отпущено в производство: кг */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sexga berildi: miqdor (кг)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.releasedKg}
                    onChange={e => setFormData({ ...formData, releasedKg: e.target.value })}
                    placeholder="Sexga berilgan miqdor"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* 15. Отпущено в производство: Дата */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sexga berildi: Sana
                  </label>
                  <input
                    type="date"
                    value={formData.releasedDate}
                    onChange={e => setFormData({ ...formData, releasedDate: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* 16. ФИО, Подпись ответственного */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mas'ul shaxs (ФИО ответственного)
                  </label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                    placeholder="Masalan: Камбарова А.М."
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-dark-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

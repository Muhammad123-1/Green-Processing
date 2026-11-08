'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck, 
  X, 
  Save, 
  Loader2, 
  RefreshCw, 
  Phone, 
  MapPin, 
  Mail, 
  Award, 
  Building2, 
  ShieldCheck, 
  Boxes,
  TrendingUp,
  PackageCheck,
  Filter,
  KeyRound,
  ExternalLink
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'
import SupplierAccountsManager from '@/components/admin/SupplierAccountsManager'

interface Supplier {
  id: number
  name: string
  shortName: string | null
  address: string | null
  phone: string | null
  email: string | null
  certificate: string | null
  category?: string | null
  totalKg?: number
  totalTonnes?: number
  totalDona?: number
  totalLitr?: number
  supplyType?: 'KG' | 'DONA' | 'MIXED'
  deliveriesCount?: number
  products?: string[]
  productsDetails?: Array<{ name: string; qty: number; unit: string }>
  lastDeliveryDate?: string
  status?: string
}

const emptyForm = {
  name: '',
  shortName: '',
  address: '',
  phone: '',
  email: '',
  certificate: '',
}

export default function SuppliersPage() {
  const { lang, formatDual } = useLanguage()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'catalog' | 'accounts'>('catalog')

  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'accounts') {
      setActiveTab('accounts')
    }
  }, [searchParams])

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'KG' | 'DONA'>('ALL')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data) ? data : [])
      } else {
        toast.error(lang === 'ru' ? 'Ошибка загрузки поставщиков' : "Ta'minotchilarni yuklashda xatolik")
      }
    } catch { 
      toast.error(lang === 'ru' ? 'Сетевая ошибка' : "Tarmoq xatosi") 
    } finally { 
      setLoading(false) 
    }
  }, [lang])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setDeleteId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // KPI Calculations (Separating weight in kg/tonnes and packaging in dona)
  const stats = useMemo(() => {
    const totalCount = suppliers.length
    const totalArrivalKg = suppliers.reduce((acc, s) => acc + (s.totalKg || 0), 0)
    const totalArrivalTonnes = Math.round((totalArrivalKg / 1000) * 10) / 10
    const totalArrivalDona = suppliers.reduce((acc, s) => acc + (s.totalDona || 0), 0)
    const totalDeliveries = suppliers.reduce((acc, s) => acc + (s.deliveriesCount || 0), 0)

    return {
      totalCount,
      totalArrivalKg,
      totalArrivalTonnes,
      totalArrivalDona,
      totalDeliveries,
    }
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return suppliers.filter((s) => {
      // Unit Type Filter
      if (unitFilter === 'KG' && (!s.totalKg || s.totalKg <= 0)) return false
      if (unitFilter === 'DONA' && (!s.totalDona || s.totalDona <= 0)) return false

      if (!q) return true

      const prods = (s.products || []).join(' ').toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.certificate && s.certificate.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        prods.includes(q)
      )
    })
  }, [suppliers, search, unitFilter])

  // 12 tadan yuklash (Infinite Scroll & Show All)
  const suppliersPagination = useInfiniteTable(filtered, 12, [search, unitFilter])

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(s: Supplier) {
    setEditId(s.id)
    setForm({
      name: s.name,
      shortName: s.shortName || '',
      address: s.address || '',
      phone: s.phone || '',
      email: s.email || '',
      certificate: s.certificate || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { 
      toast.error(lang === 'ru' ? 'Введите наименование' : "Nomi kiritilmagan")
      return 
    }
    setSaving(true)
    try {
      const url = editId ? `/api/suppliers/${editId}` : '/api/suppliers'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(
          editId 
            ? (lang === 'ru' ? 'Поставщик успешно обновлен' : "Ta'minotchi ma'lumotlari yangilandi") 
            : (lang === 'ru' ? 'Поставщик успешно добавлен' : "Yangi ta'minotchi muvaffaqiyatli qo'shildi")
        )
        setShowModal(false)
        fetchSuppliers()
      } else {
        const data = await res.json()
        toast.error(data.error || (lang === 'ru' ? 'Ошибка при сохранении' : 'Xatolik'))
      }
    } catch (err: any) { 
      toast.error(err.message || (lang === 'ru' ? 'Сетевая ошибка' : 'Tarmoq xatosi')) 
    } finally { 
      setSaving(false) 
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) { 
        toast.success(lang === 'ru' ? 'Поставщик удален' : "Ta'minotchi o'chirildi")
        fetchSuppliers() 
      } else {
        toast.error(lang === 'ru' ? 'Ошибка удаления' : "O'chirishda xatolik")
      }
    } catch { 
      toast.error(lang === 'ru' ? 'Ошибка сети' : 'Xatolik') 
    } finally { 
      setDeleteId(null) 
    }
  }

  return (
    <div className="space-y-5 animate-enter max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Truck size={14} />
              {formatDual("Ta'minot & Prixod Tahlili", "Снабжение и анализ прихода", "Supply & Inflow Analysis")}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {formatDual("Ta'minotchilar (Yetkazib Beruvchilar) Nazorati", "Реестр и аналитика поставщиков", "Suppliers Registry & Analytics")}
          </h1>
        </div>

        {activeTab === 'catalog' && (
          <button 
            onClick={openNew} 
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap active:scale-95"
          >
            <Plus size={18} />
            <span>{formatDual("+ Yangi Ta'minotchi", "+ Добавить поставщика", "+ New Supplier")}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs: Catalog vs Portal Accounts */}
      <div className="flex bg-dark-900/90 p-1.5 rounded-2xl border border-dark-750 w-full sm:w-max max-w-full overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 size={16} />
          <span>{formatDual("1. Ta'minotchilar Katalogi", "1. Каталог поставщиков", "1. Suppliers Catalog")}</span>
          <span className="px-2 py-0.5 rounded-md bg-dark-950/60 text-[11px] text-slate-300">
            {suppliers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound size={16} />
          <span>{formatDual("2. Portal Login & Parollari", "2. Логины и Пароли Портала", "2. Portal Logins & Access")}</span>
        </button>
      </div>

      {/* TAB 2: PORTAL ACCOUNTS MANAGER */}
      {activeTab === 'accounts' && (
        <SupplierAccountsManager />
      )}

      {/* TAB 1: SUPPLIERS CATALOG */}
      {activeTab === 'catalog' && (
        <>

      {/* KPI Cards (Accurate Separation: Weight tn/kg vs Packaging dona) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Jami Hamkorlar */}
        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              {formatDual("Hamkorlar", "Поставщиков", "Suppliers")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">
            {stats.totalCount} ta
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Ro'yxatdagi korxonalar", "Зарегистрировано", "Registered companies")}
          </p>
        </div>

        {/* Card 2: Jami Xomashyo (Vazn: Tn / Kg) */}
        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {formatDual("Xomashyo (Vazn)", "Вес сырья (Кг / Тн)", "Raw Material (Weight)")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-400">
            {stats.totalArrivalTonnes} tn
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.totalArrivalKg.toLocaleString()} kg {formatDual("sof xomashyo", "сырья", "raw material")}
          </p>
        </div>

        {/* Card 3: Jami Qadoq & Taralar (Dona) */}
        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {formatDual("Qadoq & Taralar (Dona)", "Тара и Упаковка (Шт)", "Packaging & Boxes (Pcs)")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-amber-400">
            {stats.totalArrivalDona.toLocaleString()} dona
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Qutilar, idishlar va paketlar", "Коробки, мешки, пакеты", "Boxes, bags and packages")}
          </p>
        </div>

        {/* Card 4: Partiyalar soni */}
        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              {formatDual("Jami Partiyalar", "Всего партий", "Total Batches")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <PackageCheck size={16} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">
            {stats.totalDeliveries} ta
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Kirim operatsiyalari", "Операций поступления", "Arrival operations")}
          </p>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={formatDual(
              "Ta'minotchi nomi, mahsuloti, telefon yoki manzili bo'yicha qidirish...", 
              "Поиск по поставщику, продукции, телефону или адресу...", 
              "Search by supplier, products, phone or address..."
            )}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        {/* Unit Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-dark-800 p-1 rounded-xl border border-dark-700 overflow-x-auto">
          <button
            onClick={() => setUnitFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              unitFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {formatDual("Barchasi", "Все", "All")} ({suppliers.length})
          </button>
          <button
            onClick={() => setUnitFilter('KG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              unitFilter === 'KG'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>{formatDual("Xomashyo (Kg)", "Сырье (Кг)", "Weight (Kg)")}</span>
          </button>
          <button
            onClick={() => setUnitFilter('DONA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              unitFilter === 'DONA'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes size={13} />
            <span>{formatDual("Qadoq (Dona)", "Тара (Шт)", "Packaging (Pcs)")}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <div className="text-xs text-slate-400 font-medium">
            {formatDual(`Topildi: ${filtered.length} ta`, `Найдено: ${filtered.length}`, `Found: ${filtered.length}`)}
          </div>
          <button 
            onClick={fetchSuppliers} 
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Suppliers Content: Dual View (Mobile Cards + Desktop Table) */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-300">
              {formatDual("Ta'minotchilar va prixod tahlili yuklanmoqda...", "Загрузка поставщиков и анализа прихода...", "Loading suppliers and arrivals analysis...")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Truck size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-slate-400">{formatDual("Ta'minotchilar topilmadi", "Поставщики не найдены", "No suppliers found")}</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Touch Cards */}
            <div className="block sm:hidden divide-y divide-dark-750">
              {suppliersPagination.displayedItems.map((s) => (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-xs truncate">
                          {s.name}
                        </div>
                        {s.shortName && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {s.shortName}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <ShieldCheck size={11} />
                      <span>{s.status || 'Faol'}</span>
                    </span>
                  </div>

                  {s.products && s.products.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.products.map((p, pIdx) => {
                        const detail = s.productsDetails?.find((d) => d.name.toLowerCase() === p.toLowerCase())
                        const unit = detail?.unit || ''
                        const isDona = unit === 'dona'
                        return (
                          <span
                            key={pIdx}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-medium flex items-center gap-1 ${
                              isDona
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <span>{p}</span>
                            {unit && <span className="text-[8px] opacity-70 font-mono">({unit})</span>}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 bg-dark-800/60 p-2.5 rounded-xl border border-dark-700/60 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Jami Yuk</div>
                      <div className="font-black text-white text-xs mt-0.5 space-y-0.5">
                        {s.totalKg && s.totalKg > 0 ? (
                          <div>
                            {(s.totalTonnes || 0) >= 1 ? `${s.totalTonnes} tn` : `${(s.totalKg || 0).toLocaleString()} kg`}
                          </div>
                        ) : null}
                        {s.totalDona && s.totalDona > 0 ? (
                          <div className="text-amber-300 font-bold text-[11px]">
                            {s.totalDona.toLocaleString()} dona
                          </div>
                        ) : null}
                        {!s.totalKg && !s.totalDona ? (
                          <div className="text-slate-500">—</div>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Partiyalar</div>
                      <div className="font-bold text-slate-200 text-xs mt-0.5">
                        {s.deliveriesCount || 0} ta
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Oxirgi Yuk</div>
                      <div className="font-mono text-[10px] text-slate-300 mt-0.5">
                        {s.lastDeliveryDate || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {s.phone ? (
                      <a
                        href={`tel:${s.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 py-1"
                      >
                        <Phone size={13} />
                        <span>{s.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/suppliers/${s.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        <span>Sahifasi</span>
                      </a>
                      <button 
                        onClick={() => openEdit(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Edit size={13} />
                        <span>Tahrirlash</span>
                      </button>
                      <button 
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-dark-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-dark-800/60 border-b border-dark-750 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5">{formatDual("Nomi & Korxona", "Поставщик / Организация", "Supplier Organization")}</th>
                    <th className="py-4 px-5">{formatDual("Keltirgan Mahsulotlari", "Поставляемая продукция", "Supplied Products")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Jami Yetkazilgan Yuk", "Объем поставок", "Total Volume")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Partiyalar", "Партий", "Batches")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Oxirgi Yetkazish", "Посл. поставка", "Last Delivery")}</th>
                    <th className="py-4 px-5">{formatDual("Aloqa / Telefon", "Контакты", "Contact")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                    <th className="py-4 px-5 text-right">{formatDual("Amallar", "Действия", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750">
                  {suppliersPagination.displayedItems.map((s) => (
                    <tr key={s.id} className="hover:bg-dark-800/40 transition-colors">
                      {/* Name & Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <a
                              href={`/suppliers/${s.id}`}
                              className="font-extrabold text-white text-sm hover:text-emerald-400 transition-colors underline decoration-slate-600 hover:decoration-emerald-400 block"
                            >
                              {s.name}
                            </a>
                            {s.shortName && (
                              <div className="text-xs text-slate-400 mt-0.5">{s.shortName}</div>
                            )}
                            {s.address && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5 flex items-center gap-1">
                                <MapPin size={10} />
                                <span>{s.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-4 px-5 max-w-[240px]">
                        <div className="flex flex-wrap gap-1">
                          {s.products && s.products.length > 0 ? (
                            s.products.map((p, pIdx) => {
                              const detail = s.productsDetails?.find((d) => d.name.toLowerCase() === p.toLowerCase())
                              const unit = detail?.unit || ''
                              const isDona = unit === 'dona'
                              return (
                                <span
                                  key={pIdx}
                                  className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 ${
                                    isDona
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  }`}
                                >
                                  <span>{p}</span>
                                  {unit && <span className="text-[9px] opacity-70 font-mono">({unit})</span>}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </div>
                      </td>

                      {/* Total Volume (Separating weight in kg/tn and packaging in dona) */}
                      <td className="py-4 px-5 text-center">
                        {s.totalKg && s.totalKg > 0 ? (
                          <div>
                            <div className="font-black text-white text-base">
                              {(s.totalTonnes || 0) >= 1 ? `${s.totalTonnes} tn` : `${(s.totalKg || 0).toLocaleString()} kg`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {(s.totalKg || 0).toLocaleString()} kg
                            </div>
                          </div>
                        ) : null}

                        {s.totalDona && s.totalDona > 0 ? (
                          <div className={s.totalKg && s.totalKg > 0 ? 'mt-1.5' : ''}>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-xs">
                              <Boxes size={12} />
                              <span>{s.totalDona.toLocaleString()} dona</span>
                            </span>
                          </div>
                        ) : null}

                        {(!s.totalKg || s.totalKg === 0) && (!s.totalDona || s.totalDona === 0) ? (
                          <span className="text-slate-500 text-xs">—</span>
                        ) : null}
                      </td>

                      {/* Deliveries Count */}
                      <td className="py-4 px-5 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-dark-800 border border-dark-700 font-bold text-xs text-slate-200">
                          {s.deliveriesCount || 0} ta
                        </span>
                      </td>

                      {/* Last Delivery Date */}
                      <td className="py-4 px-5 text-center text-xs font-mono text-slate-300">
                        {s.lastDeliveryDate || '-'}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-5">
                        {s.phone ? (
                          <a
                            href={`tel:${s.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Phone size={13} />
                            <span>{s.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck size={12} />
                          <span>{s.status || 'Faol'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a 
                            href={`/suppliers/${s.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1"
                            title={formatDual("Ta'minotchi sahifasi", "Страница поставщика", "Supplier page")}
                          >
                            <ExternalLink size={13} />
                            <span>{formatDual("Sahifasi", "Страница", "Page")}</span>
                          </a>
                          <button 
                            onClick={() => openEdit(s)}
                            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-400 hover:text-amber-400 transition-all"
                            title={formatDual("Tahrirlash", "Редактировать", "Edit")}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(s.id)}
                            className="p-2 rounded-xl bg-dark-800 hover:bg-rose-500/20 border border-dark-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all"
                            title={formatDual("O'chirish", "Удалить", "Delete")}
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
          </>
        )}

        {/* Infinite Table Footer */}
        {!loading && filtered.length > 0 && (
          <InfiniteTableFooter
            currentCount={suppliersPagination.visibleCount}
            totalCount={suppliersPagination.totalCount}
            hasMore={suppliersPagination.hasMore}
            showAll={suppliersPagination.showAll}
            onLoadMore={suppliersPagination.loadMore}
            onToggleShowAll={suppliersPagination.toggleShowAll}
            sentinelRef={suppliersPagination.sentinelRef}
            pageSize={12}
            itemName={{ uz: "ta'minotchi", ru: 'поставщиков', en: 'suppliers' }}
          />
        )}
      </div>

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setShowModal(false)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-dark-700 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {editId 
                      ? formatDual("Ta'minotchini tahrirlash", "Редактировать поставщика", "Edit Supplier")
                      : formatDual("Yangi ta'minotchi qo'shish", "Новый поставщик", "New Supplier")
                    }
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Hamkor korxona rekvizitlari va sertifikati", "Реквизиты и сертификаты компании-партнера", "Company details and certificates")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {formatDual("Nomi / Tashkilot", "Наименование", "Company Name")} <span className="text-red-400">*</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="OOO «AgroFood»" 
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {formatDual("Qisqa nom", "Краткое имя", "Short Name")}
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="AgroFood" 
                  value={form.shortName}
                  onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Phone size={12} className="text-emerald-400" />
                    <span>{formatDual("Telefon", "Телефон", "Phone")}</span>
                  </label>
                  <input 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono" 
                    placeholder="+998 90 123 45 67" 
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Mail size={12} className="text-emerald-400" />
                    <span>{formatDual("Email / Vakil", "Email / Представитель", "Email / Rep")}</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                    placeholder="info@company.uz" 
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-400" />
                  <span>{formatDual("Manzil", "Адрес", "Address")}</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="Toshkent vil., Zangiota tumani..." 
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                  <Award size={12} className="text-emerald-400" />
                  <span>{formatDual("Sertifikat / Sifat standarti", "Сертификат / Стандарт", "Certificate")}</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="ISO 22000:2018 / GlobalG.A.P / Halol" 
                  value={form.certificate}
                  onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.value }))} 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex-1 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setDeleteId(null)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-bold text-lg mb-2">
              {formatDual("Ta'minotchini o'chirish", "Удаление поставщика", "Delete Supplier")}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {formatDual(
                "Ushbu ta'minotchi korxonani o'chirishni tasdiqlaysizmi?",
                "Вы действительно хотите удалить этого контрагента-поставщика?",
                "Are you sure you want to delete this supplier?"
              )}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)} 
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button 
                onClick={() => handleDelete(deleteId)} 
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex-1"
              >
                {formatDual("O'chirish", "Удалить", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

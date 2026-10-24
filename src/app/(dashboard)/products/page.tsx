'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  Save,
  Loader2,
  RefreshCw,
  Camera,
  UploadCloud,
  Thermometer,
  Layers,
  Boxes,
  FlaskConical,
  Sparkles,
  FileText
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface Product {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  imageUrl?: string | null
  minTemperature: number | null
  maxTemperature: number | null
  defaultPackaging: string | null
  defaultConclusion: string | null
  gost: string | null
  type: string
  isActive: boolean
  totalArrivalKg?: number
  totalArrivalTonnes?: number
  deliveriesCount?: number
  lastArrivalDate?: string
}

const emptyForm = {
  name: '',
  code: '',
  category: '',
  unit: 'kg',
  imageUrl: '',
  minTemperature: '',
  maxTemperature: '',
  defaultPackaging: '',
  defaultConclusion: 'Muvofiq',
  storageCondition: '',
  shelfLife: '',
  gost: '',
  description: '',
  type: 'RAW_MATERIAL',
  initialStock: '',
  initialBatchNumber: '',
  initialExpirationDate: '',
}

export default function ProductsPage() {
  const { lang, formatDual, t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'RAW_MATERIAL' | 'PACKAGING' | 'CHEMICALS' | 'KITCHEN' | 'FINISHED_GOOD'>('ALL')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      } else {
        toast.error("Mahsulotlarni yuklashda xatolik")
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Summary statistics across products
  const stats = useMemo(() => {
    const totalCount = products.length
    const rawCount = products.filter(p => (p.category || '').toLowerCase().includes('sabzavot') || (p.category || '').toLowerCase().includes('oziq') || (p.category || '').toLowerCase().includes('meva')).length
    const packagingCount = products.filter(p => (p.category || '').toLowerCase().includes('qadoq') || (p.category || '').toLowerCase().includes('idish')).length
    const chemCount = products.filter(p => (p.category || '').toLowerCase().includes('kimyo') || (p.category || '').toLowerCase().includes('gigiyena') || (p.category || '').toLowerCase().includes('dezinfeksiya')).length
    const totalTonnes = Math.round(products.reduce((acc, p) => acc + (p.totalArrivalTonnes || 0), 0) * 10) / 10

    return {
      totalCount,
      rawCount,
      packagingCount,
      chemCount,
      totalTonnes
    }
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((p) => {
      // Tab filter
      if (activeTab === 'RAW_MATERIAL') {
        const cat = (p.category || '').toLowerCase()
        if (cat.includes('qadoq') || cat.includes('kimyo') || cat.includes('gigiyena') || p.type === 'KITCHEN' || p.type === 'FINISHED_GOOD') {
          return false
        }
      } else if (activeTab === 'PACKAGING') {
        const cat = (p.category || '').toLowerCase()
        if (!cat.includes('qadoq') && !cat.includes('idish')) return false
      } else if (activeTab === 'CHEMICALS') {
        const cat = (p.category || '').toLowerCase()
        if (!cat.includes('kimyo') && !cat.includes('gigiyena') && !cat.includes('dezinfeksiya')) return false
      } else if (activeTab === 'KITCHEN') {
        if (p.type !== 'KITCHEN') return false
      } else if (activeTab === 'FINISHED_GOOD') {
        if (p.type !== 'FINISHED_GOOD') return false
      }

      // Search query
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.gost && p.gost.toLowerCase().includes(q))
      )
    })
  }, [products, activeTab, search])

  const productsPagination = useInfiniteTable(filtered, 12, [search, activeTab])

  function openNew() {
    setEditId(null)
    setForm({ ...emptyForm, type: activeTab === 'KITCHEN' ? 'KITCHEN' : activeTab === 'FINISHED_GOOD' ? 'FINISHED_GOOD' : 'RAW_MATERIAL' })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      code: p.code || '',
      category: p.category || '',
      unit: p.unit,
      imageUrl: p.imageUrl || '',
      minTemperature: p.minTemperature != null ? String(p.minTemperature) : '',
      maxTemperature: p.maxTemperature != null ? String(p.maxTemperature) : '',
      defaultPackaging: p.defaultPackaging || '',
      defaultConclusion: p.defaultConclusion || 'Muvofiq',
      storageCondition: '',
      shelfLife: '',
      gost: p.gost || '',
      description: '',
      type: p.type || 'RAW_MATERIAL',
      initialStock: '',
      initialBatchNumber: '',
      initialExpirationDate: '',
    })
    setShowModal(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (data.url) {
        setForm(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Rasm yuklandi!')
      } else {
        toast.error(data.error || 'Rasm yuklashda xatolik')
      }
    } catch {
      toast.error('Rasm yuklashda tarmoq xatosi')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nomi kiritilmagan'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'Mahsulot yangilandi' : "Yangi mahsulot qo'shildi")
        setShowModal(false)
        fetchProducts()
      } else {
        toast.error('Saqlashda xatolik')
      }
    } catch { toast.error('Xatolik') } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success("Mahsulot o'chirildi"); fetchProducts() }
      else toast.error("O'chirishda xatolik")
    } catch { toast.error('Xatolik') } finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-5 animate-enter max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Boxes size={14} />
              {formatDual("Prixod Nomenklaturasi", "Номенклатура прихода", "Inflow Catalog")}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {formatDual("Mahsulotlar & Xomashyo Katalogi", "Каталог продукции и сырья", "Products & Materials Registry")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {formatDual(
              `Prixod orqali kelgan barcha ${products.length} ta xomashyo, qadoqlash va materiallar ro'yxati, harorat me'yorlari va GOST standartlari`,
              `Реестр всех ${products.length} видов сырья и материалов из прихода, нормы температуры и стандарты ГОСТ`,
              `Registry of all ${products.length} raw materials and products from arrivals, temperature norms, and standards`
            )}
          </p>
        </div>

        <button 
          onClick={openNew} 
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap active:scale-95"
        >
          <Plus size={18} />
          <span>{formatDual("+ Yangi Mahsulot", "+ Новый продукт", "+ New Product")}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            {formatDual("Jami Nomenklatura", "Всего номенклатур", "Total SKU")}
          </span>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">
            {stats.totalCount} ta
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Prixodda qayd etilgan", "Зафиксировано в приходе", "Recorded in arrivals")}
          </p>
        </div>

        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
            {formatDual("Xomashyo & Oziq-ovqat", "Сырье и овощи", "Raw Vegetables")}
          </span>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-cyan-400">
            {stats.rawCount} tur
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Aysberg, Pomidor, Piyoz...", "Айсберг, Томаты, Лук...", "Iceberg, Tomato, Onion...")}
          </p>
        </div>

        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            {formatDual("Qadoqlash & Idishlar", "Упаковка и тара", "Packaging")}
          </span>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-amber-400">
            {stats.packagingCount} tur
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Quti, paket, etiketka, yashik", "Коробки, пакеты, этикетки", "Boxes, bags, labels")}
          </p>
        </div>

        <div className="bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-dark-750 shadow-lg">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            {formatDual("Kimyo & Dezinfeksiya", "Химия и дезинфекция", "Chemicals")}
          </span>
          <div className="text-lg sm:text-2xl md:text-3xl font-black text-indigo-400">
            {stats.chemCount} tur
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatDual("Xlor, kislota, gigiyena vositalari", "Хлор, кислоты, гигиена", "Chlorine, acid, hygiene")}
          </p>
        </div>
      </div>

      {/* Filter and Tabs Section */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl shadow-sm overflow-hidden">
        {/* Category Tabs */}
        <div className="flex border-b border-dark-750 overflow-x-auto no-scrollbar bg-dark-850/50">
          {[
            { id: 'ALL', uz: `Barchasi (${products.length})`, ru: `Все (${products.length})`, en: `All (${products.length})` },
            { id: 'RAW_MATERIAL', uz: '🥦 Xomashyo (Sabzavot)', ru: '🥦 Сырье (Овощи)', en: '🥦 Raw Materials' },
            { id: 'PACKAGING', uz: '📦 Qadoqlash & Idishlar', ru: '📦 Упаковка и тара', en: '📦 Packaging' },
            { id: 'CHEMICALS', uz: '🧪 Kimyo & Gigiyena', ru: '🧪 Химия и гигиена', en: '🧪 Chemicals' },
            { id: 'KITCHEN', uz: '🍲 Oshxona', ru: '🍲 Кухня', en: '🍲 Kitchen' },
            { id: 'FINISHED_GOOD', uz: '✨ Jarayon (Tayyor GP)', ru: '✨ Готовая ГП', en: '✨ Finished Goods' },
          ].map((tab) => {
            const isSel = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                  isSel
                    ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-dark-800'
                }`}
              >
                {formatDual(tab.uz, tab.ru, tab.en)}
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={formatDual(
                "Nomi, kodi, kategoriyasi yoki GOST bo'yicha qidirish...",
                "Поиск по названию, коду, категории или ГОСТ...",
                "Search by name, code, category, or standard..."
              )}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchProducts} 
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors shrink-0"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Products Content: Dual View */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-300">
              {formatDual("Prixod nomenklaturasi yuklanmoqda...", "Загрузка номенклатуры прихода...", "Loading products catalog...")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Package size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-slate-400">{formatDual("Mahsulotlar topilmadi", "Ничего не найдено", "No products found")}</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Touch Cards */}
            <div className="block sm:hidden divide-y divide-dark-750">
              {productsPagination.displayedItems.map((p, idx) => (
                <div key={p.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          onClick={() => setPreviewImage(p.imageUrl!)}
                          className="w-9 h-9 rounded-xl object-cover border border-dark-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-emerald-400 shrink-0">
                          <Package size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs truncate block">{p.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-dark-800 border border-dark-700 text-slate-300">
                            {p.code || 'PRD'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {p.category || 'Xomashyo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-dark-800 text-[10px] font-bold text-emerald-400 border border-dark-700 shrink-0 font-mono">
                      {p.unit}
                    </span>
                  </div>

                  {/* Prixod metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-dark-800/60 p-2 rounded-xl border border-dark-700/60 text-center">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Jami Prixod</div>
                      <div className="font-black text-emerald-400 text-xs mt-0.5">
                        {(p.totalArrivalTonnes || 0) >= 1 ? `${p.totalArrivalTonnes} tn` : `${(p.totalArrivalKg || 0).toLocaleString()} ${p.unit}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Partiyalar</div>
                      <div className="font-bold text-slate-200 text-xs mt-0.5">
                        {p.deliveriesCount || 0} ta
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Harorat Norma</div>
                      <div className="font-mono text-[10px] text-cyan-300 mt-0.5">
                        {p.minTemperature != null && p.maxTemperature != null ? `${p.minTemperature}-${p.maxTemperature}°C` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                      {p.gost || 'Standart'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Edit size={12} />
                        <span>Tahrirlash</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-dark-700"
                      >
                        <Trash2 size={12} />
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
                    <th className="py-4 px-5">{formatDual("Mahsulot Nomi", "Наименование", "Product Name")}</th>
                    <th className="py-4 px-5">{formatDual("Kod", "Код", "Code")}</th>
                    <th className="py-4 px-5">{formatDual("Kategoriya", "Категория", "Category")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Birlik", "Ед. изм.", "Unit")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Jami Prixod", "Общий приход", "Total Inflow")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Partiyalar", "Партий", "Batches")}</th>
                    <th className="py-4 px-5 text-center">{formatDual("Harorat Norma", "Норма темп.", "Temp Norm")}</th>
                    <th className="py-4 px-5">{formatDual("GOST / Standart", "ГОСТ", "Standard")}</th>
                    <th className="py-4 px-5 text-right">{formatDual("Amallar", "Действия", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750">
                  {productsPagination.displayedItems.map((p) => (
                    <tr key={p.id} className="hover:bg-dark-800/40 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              onClick={() => setPreviewImage(p.imageUrl!)}
                              className="w-10 h-10 rounded-xl object-cover border border-dark-700 cursor-pointer hover:opacity-80 transition shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-emerald-400 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-white text-sm block hover:text-emerald-400 transition-colors">
                              {p.name}
                            </span>
                            {p.imageUrl && (
                              <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Camera size={10} /> Rasmli
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-4 px-5 font-mono text-xs text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-dark-800 border border-dark-700">
                          {p.code || '—'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-xl bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-300">
                          {p.category || '—'}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-4 px-5 text-center font-mono font-bold text-xs text-slate-300">
                        {p.unit}
                      </td>

                      {/* Total Inflow from Prixod */}
                      <td className="py-4 px-5 text-center">
                        <div className="font-black text-emerald-400 text-sm">
                          {(p.totalArrivalTonnes || 0) >= 1 ? `${p.totalArrivalTonnes} tn` : `${(p.totalArrivalKg || 0).toLocaleString()} ${p.unit}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {(p.totalArrivalKg || 0).toLocaleString()} {p.unit}
                        </div>
                      </td>

                      {/* Deliveries Count */}
                      <td className="py-4 px-5 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-dark-800 border border-dark-700 font-bold text-xs text-slate-200">
                          {p.deliveriesCount || 0} ta
                        </span>
                      </td>

                      {/* Temperature */}
                      <td className="py-4 px-5 text-center font-mono text-xs text-cyan-300">
                        {p.minTemperature != null && p.maxTemperature != null
                          ? `${p.minTemperature}°C — ${p.maxTemperature}°C`
                          : '—'}
                      </td>

                      {/* GOST */}
                      <td className="py-4 px-5 text-xs text-slate-400">
                        {p.gost || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEdit(p)} 
                            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-400 hover:text-amber-400 transition-all"
                            title="Tahrirlash"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(p.id)} 
                            className="p-2 rounded-xl bg-dark-800 hover:bg-rose-500/20 border border-dark-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all"
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
          </>
        )}

        {/* Infinite Table Footer */}
        {!loading && filtered.length > 0 && (
          <InfiniteTableFooter
            currentCount={productsPagination.visibleCount}
            totalCount={productsPagination.totalCount}
            hasMore={productsPagination.hasMore}
            showAll={productsPagination.showAll}
            onLoadMore={productsPagination.loadMore}
            onToggleShowAll={productsPagination.toggleShowAll}
            sentinelRef={productsPagination.sentinelRef}
            pageSize={12}
            itemName={{ uz: 'mahsulot', ru: 'товаров', en: 'products' }}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setShowModal(false)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-dark-700 mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? formatDual("Mahsulotni tahrirlash", "Редактировать продукт", "Edit Product") : formatDual("Yangi mahsulot qo'shish", "Новый продукт", "New Product")}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Mahsulot Nomi <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Masalan: Qizil pomidor yoki Vakuum paket"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kodi</label>
                  <input
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="PRD-TOM-101"
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategoriya</label>
                  <input
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Sabzavot / Qadoqlash"
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Birlik</label>
                  <select
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="kg">kg</option>
                    <option value="dona">dona</option>
                    <option value="litr">litr</option>
                    <option value="quti">quti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="1.5"
                    value={form.minTemperature}
                    onChange={(e) => setForm(f => ({ ...f, minTemperature: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="4.0"
                    value={form.maxTemperature}
                    onChange={(e) => setForm(f => ({ ...f, maxTemperature: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">GOST / Standart</label>
                <input
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="GOST 34298-2017"
                  value={form.gost}
                  onChange={(e) => setForm(f => ({ ...f, gost: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Mahsulot Rasmi (URL)</label>
                <div className="flex gap-2">
                  <input
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 cursor-pointer flex items-center justify-center shrink-0">
                    <UploadCloud size={18} className={uploadingImage ? 'animate-pulse text-emerald-400' : ''} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex-1 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setDeleteId(null)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-bold text-lg mb-2">Mahsulotni o'chirish</p>
            <p className="text-slate-400 text-sm mb-6">Ushbu mahsulotni ro'yxatdan o'chirishni tasdiqlaysizmi?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex-1"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-2xl border border-dark-700" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-dark-900/80 border border-dark-700 text-white hover:bg-dark-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

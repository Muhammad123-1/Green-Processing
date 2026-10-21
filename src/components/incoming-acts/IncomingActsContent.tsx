'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  X,
  FileCheck,
  Scale,
  Hash,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  SlidersHorizontal,
  Table as TableIcon,
  Binary
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { PRODUCT_THEMES, getProductTheme } from '@/lib/incoming-acts/constants'

interface IncomingAct {
  id: number
  actNumber: string
  actDate: string
  productName: string
  supplierName: string
  temperature?: string | null
  transportCondition: number
  hasDocumentation: number
  structure: number
  leafColor: number
  tasteSmell: number
  internalOxidation: number
  insectTraces: number
  rotDiseases: number
  stemCut: number
  density: number
  diameterWeight?: string | null
  outerLeavesRemoved: number
  noMechanicalDamage: number
  batchNumber?: string | null
  decisionRating: number // 2, 3, 4, 5
  decisionText?: string | null
  warehouseKg?: number | null
  shopIssuedKg?: string | null
  shopIssuedDate?: string | null
  rejectionActNumber?: string | null
  inspectorName?: string | null
  pricePerKg?: number | null
  notes?: string | null
  rawValues?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

interface StatsData {
  totalActs: number
  filteredCount: number
  totalKg: number
  rating5: number
  rating4: number
  rating3: number
  rating2: number
  products: string[]
}

const PRODUCT_LIST = [
  { id: 'all', label: 'Barchasi (All)', color: '#334155', bg: 'bg-slate-700 text-white' },
  { id: 'ТОМАТ', label: 'ТОМАТ', color: '#FF3300', bg: 'bg-[#FF3300] text-black font-bold' },
  { id: 'ЛУК БЕЛЫЙ', label: 'ЛУК БЕЛЫЙ', color: '#BFBFBF', bg: 'bg-[#BFBFBF] text-black font-bold' },
  { id: 'САЛАТ АЙСБЕРГ', label: 'САЛАТ АЙСБЕРГ', color: '#92D050', bg: 'bg-[#92D050] text-black font-bold' },
  { id: 'КАПУСТА БЕЛОКОЧАННАЯ', label: 'КАПУСТА', color: '#4BFF60', bg: 'bg-[#4BFF60] text-black font-bold' },
  { id: 'МОРКОВЬ', label: 'МОРКОВЬ', color: '#FF5B11', bg: 'bg-[#FF5B11] text-black font-bold' },
  { id: 'ЛИМОН', label: 'ЛИМОН', color: '#FFFF00', bg: 'bg-[#FFFF00] text-black font-bold' },
  { id: 'ОГУРЦЫ СВЕЖИЕ', label: 'ОГУРЦЫ', color: '#00B050', bg: 'bg-[#00B050] text-black font-bold' }
]

export default function IncomingActsContent() {
  const { lang } = useLanguage()
  const activeLang: 'uz' | 'ru' | 'en' =
    lang.includes('ru') ? 'ru' : lang.includes('en') ? 'en' : 'uz'

  // State
  const [acts, setActs] = useState<IncomingAct[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalActs: 0,
    filteredCount: 0,
    totalKg: 0,
    rating5: 0,
    rating4: 0,
    rating3: 0,
    rating2: 0,
    products: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Tabs
  const [selectedProduct, setSelectedProduct] = useState('ТОМАТ') // Default to ТОМАТ as in user's image
  const [selectedRating, setSelectedRating] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // View Mode: 'authentic' (Exact Excel appearance from screenshots) vs 'numeric' (1/0 numbers)
  const [viewMode, setViewMode] = useState<'authentic' | 'numeric'>('authentic')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedActForView, setSelectedActForView] = useState<IncomingAct | null>(null)
  const [editingAct, setEditingAct] = useState<IncomingAct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    actNumber: '',
    actDate: new Date().toISOString().slice(0, 10),
    productName: 'ТОМАТ',
    supplierName: '',
    temperature: '18 с',
    transportCondition: 1,
    hasDocumentation: 0,
    structure: 1,
    leafColor: 1,
    tasteSmell: 1,
    internalOxidation: 0,
    insectTraces: 0,
    rotDiseases: 0,
    stemCut: 1,
    density: 1,
    diameterWeight: '6-7 см',
    outerLeavesRemoved: 1,
    noMechanicalDamage: 1,
    batchNumber: '1',
    decisionRating: 4,
    warehouseKg: '',
    shopIssuedKg: '',
    shopIssuedDate: '',
    rejectionActNumber: '',
    inspectorName: 'Камбарова А.М.',
    pricePerKg: '26000',
    notes: ''
  })

  // Translations
  const t = {
    uz: {
      title: 'ВХОДНОЕ СЫРЬЕ (АКТЫ)',
      subtitle: 'Xomashyo sifatini qabul qilish va nazorat qilish aktlari jurnali (Mijozning asl Excel formati)',
      formCode: 'Forma: Ф-2/03 | ООО "GREEN PROCESSING"',
      newAct: 'Yangi akt yaratish',
      importExcel: 'Excel Import',
      exportExcel: 'Excel yuklab olish',
      refresh: 'Yangilash',
      authenticView: 'Asl Excel ko\'rinishi (Mijoz formati / Ranglar)',
      numericView: 'Raqamli rejim (1 / 0 va 2-5 baholash)',
      totalActs: 'Jami aktlar',
      totalWeight: 'Jami qabul qilingan',
      searchPlaceholder: 'Partiya, ta\'minotchi, nazoratchi, akt №...',
      allProducts: 'Barcha mahsulotlar',
      resetFilters: 'Tozalash',
      number: '№ п/п',
      date: 'Дата поступления и составления акта',
      supplier: 'Наименование ПОСТАВЩИКА',
      temp: 'Температура сырья',
      transport: 'Оценка условий упаковки и транспортирования',
      docs: 'Сопровождающая документация',
      batch: '№ партии',
      rating: 'Допуск',
      issuedGroup: 'Отпущено в производство',
      kgWarehouse: 'кг',
      kgShop: 'КГ ЦЕХ',
      shopDate: 'Дата',
      rejectionNo: 'НЕДОПУСК № акта забраковки',
      inspector: 'ФИО, Подпись ответственного',
      price: 'цена',
      actions: 'Amallar',
      noData: 'Hech qanday akt topilmadi',
      noDataDesc: 'Filtr parametrlarini o\'zgartiring yoki yangi akt kiriting.',
      close: 'Yopish',
      save: 'Saqlash',
      saving: 'Saqlanmoqda...',
      pageInfo: 'Sahifa:'
    },
    ru: {
      title: 'ВХОДНОЕ СЫРЬЕ (АКТЫ)',
      subtitle: 'Журнал регистрации и контроля качества поступающего сырья (Оригинальный Excel формат)',
      formCode: 'Форма: Ф-2/03 | ООО "GREEN PROCESSING"',
      newAct: 'Создать новый акт',
      importExcel: 'Импорт из Excel',
      exportExcel: 'Экспорт в Excel',
      refresh: 'Обновить',
      authenticView: 'Оригинальный Excel вид (Формат клиента / Цвета)',
      numericView: 'Цифровой режим (1 / 0 и оценка 2-5)',
      totalActs: 'Всего актов',
      totalWeight: 'Принято всего',
      searchPlaceholder: 'Партия, поставщик, контролёр, № акта...',
      allProducts: 'Все сырье',
      resetFilters: 'Сбросить',
      number: '№ п/п',
      date: 'Дата поступления и составления акта',
      supplier: 'Наименование ПОСТАВЩИКА',
      temp: 'Температура сырья при поступлении',
      transport: 'Оценка условий упаковки и транспортирования',
      docs: 'Сопровождающая документация',
      batch: '№ партии',
      rating: 'Допуск',
      issuedGroup: 'Отпущено в производство',
      kgWarehouse: 'кг',
      kgShop: 'КГ ЦЕХ',
      shopDate: 'Дата',
      rejectionNo: 'НЕДОПУСК № акта забраковки',
      inspector: 'ФИО, Подпись ответственного за контролем входного сырья',
      price: 'цена',
      actions: 'Действия',
      noData: 'Акты не найдены',
      noDataDesc: 'Измените параметры поиска или создайте новый акт.',
      close: 'Закрыть',
      save: 'Сохранить',
      saving: 'Сохранение...',
      pageInfo: 'Страница:'
    },
    en: {
      title: 'INCOMING RAW MATERIAL ACTS',
      subtitle: 'Raw material inspection and quality acts journal (Original Excel Format & Colors)',
      formCode: 'Form: Ф-2/03 | LLC "GREEN PROCESSING"',
      newAct: 'Create New Act',
      importExcel: 'Excel Import',
      exportExcel: 'Export to Excel',
      refresh: 'Refresh',
      authenticView: 'Authentic Excel View (Client Colors & Format)',
      numericView: 'Numeric Mode (1 / 0 & 2-5 rating)',
      totalActs: 'Total Acts',
      totalWeight: 'Total Received',
      searchPlaceholder: 'Batch, supplier, inspector, act #...',
      allProducts: 'All materials',
      resetFilters: 'Reset',
      number: '№ p/p',
      date: 'Arrival and Act Date',
      supplier: 'Supplier Name',
      temp: 'Temperature',
      transport: 'Transport Condition',
      docs: 'Accompanying Docs',
      batch: 'Batch #',
      rating: 'Verdict',
      issuedGroup: 'Issued to Production',
      kgWarehouse: 'kg',
      kgShop: 'Shop (kg)',
      shopDate: 'Date',
      rejectionNo: 'Rejection Act #',
      inspector: 'Inspector Name & Signature',
      price: 'Price',
      actions: 'Actions',
      noData: 'No acts found',
      noDataDesc: 'Change filters or create a new act.',
      close: 'Close',
      save: 'Save',
      saving: 'Saving...',
      pageInfo: 'Page:'
    }
  }[activeLang]

  // Active product theme colors and column names
  const activeTheme = useMemo(() => {
    return getProductTheme(selectedProduct !== 'all' ? selectedProduct : 'ТОМАТ')
  }, [selectedProduct])

  // Fetch acts from API
  const fetchActs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedProduct && selectedProduct !== 'all') params.append('product', selectedProduct)
      if (selectedRating && selectedRating !== 'all') params.append('rating', selectedRating)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('sort', sortOrder)

      const res = await fetch(`/api/incoming-acts?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setActs(data.acts || [])
        setStats(data.stats || {
          totalActs: 0,
          filteredCount: 0,
          totalKg: 0,
          rating5: 0,
          rating4: 0,
          rating3: 0,
          rating2: 0,
          products: []
        })
      } else {
        toast.error(data.error || 'Aktlarni yuklashda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Server bilan bog\'lanishda xatolik')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchActs()
  }, [selectedProduct, selectedRating, dateFrom, dateTo, sortOrder])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchActs()
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Paginated acts
  const paginatedActs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return acts.slice(start, start + pageSize)
  }, [acts, currentPage, pageSize])

  const totalPages = Math.ceil(acts.length / pageSize) || 1

  // Export handler
  const handleExport = () => {
    const params = new URLSearchParams()
    params.append('lang', activeLang)
    if (search) params.append('search', search)
    if (selectedProduct && selectedProduct !== 'all') params.append('product', selectedProduct)
    if (selectedRating && selectedRating !== 'all') params.append('rating', selectedRating)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)

    window.open(`/api/incoming-acts/export?${params.toString()}`, '_blank')
    toast.success('Excel yuklab olinmoqda...')
  }

  // Fast 1-Click Template Import
  const handleDefaultTemplateImport = async () => {
    try {
      setImporting(true)
      const res = await fetch('/api/incoming-acts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDefaultTemplate: true, mode: importMode })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Barcha aktlar muvaffaqiyatli yuklandi!')
        setIsImportOpen(false)
        fetchActs()
      } else {
        toast.error(data.error || 'Importda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setImporting(false)
    }
  }

  // File Upload Import
  const handleFileUploadImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append('file', file)
    form.append('mode', importMode)

    try {
      setImporting(true)
      const res = await fetch('/api/incoming-acts/import', {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Fayl muvaffaqiyatli import qilindi!')
        setIsImportOpen(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchActs()
      } else {
        toast.error(data.error || 'Faylni o\'qishda xatolik')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setImporting(false)
    }
  }

  // Open Form Create
  const handleOpenCreate = () => {
    setEditingAct(null)
    const prod = selectedProduct !== 'all' ? selectedProduct : 'ТОМАТ'
    const theme = getProductTheme(prod)
    setFormData({
      actNumber: String(acts.length + 1),
      actDate: new Date().toISOString().slice(0, 10),
      productName: prod,
      supplierName: '',
      temperature: prod === 'ТОМАТ' ? '18 с' : '19 с',
      transportCondition: 1,
      hasDocumentation: 0,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 1,
      density: 1,
      diameterWeight: prod === 'ТОМАТ' ? '6-7 см' : '5-6 см',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 1,
      batchNumber: String(acts.length + 1),
      decisionRating: 4,
      warehouseKg: '',
      shopIssuedKg: '',
      shopIssuedDate: '',
      rejectionActNumber: '',
      inspectorName: 'Камбарова А.М.',
      pricePerKg: prod === 'ТОМАТ' ? '26000' : '13500',
      notes: ''
    })
    setIsFormOpen(true)
  }

  // Open Form Edit
  const handleOpenEdit = (act: IncomingAct) => {
    setEditingAct(act)
    setFormData({
      actNumber: act.actNumber || '',
      actDate: act.actDate || new Date().toISOString().slice(0, 10),
      productName: act.productName || 'ТОМАТ',
      supplierName: act.supplierName || '',
      temperature: act.temperature || '',
      transportCondition: act.transportCondition ?? 1,
      hasDocumentation: act.hasDocumentation ?? 1,
      structure: act.structure ?? 1,
      leafColor: act.leafColor ?? 1,
      tasteSmell: act.tasteSmell ?? 1,
      internalOxidation: act.internalOxidation ?? 0,
      insectTraces: act.insectTraces ?? 0,
      rotDiseases: act.rotDiseases ?? 0,
      stemCut: act.stemCut ?? 1,
      density: act.density ?? 1,
      diameterWeight: act.diameterWeight || '',
      outerLeavesRemoved: act.outerLeavesRemoved ?? 1,
      noMechanicalDamage: act.noMechanicalDamage ?? 1,
      batchNumber: act.batchNumber || '',
      decisionRating: act.decisionRating || 4,
      warehouseKg: act.warehouseKg !== null && act.warehouseKg !== undefined ? String(act.warehouseKg) : '',
      shopIssuedKg: act.shopIssuedKg || '',
      shopIssuedDate: act.shopIssuedDate || '',
      rejectionActNumber: act.rejectionActNumber || '',
      inspectorName: act.inspectorName || 'Камбарова А.М.',
      pricePerKg: act.pricePerKg !== null && act.pricePerKg !== undefined ? String(act.pricePerKg) : '',
      notes: act.notes || ''
    })
    setIsFormOpen(true)
  }

  // Save Form
  const handleSaveAct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productName.trim() || !formData.supplierName.trim()) {
      toast.error('Xomashyo nomi va ta\'minotchi to\'ldirilishi shart!')
      return
    }

    try {
      setSubmitting(true)
      const url = editingAct ? `/api/incoming-acts/${editingAct.id}` : '/api/incoming-acts'
      const method = editingAct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editingAct ? 'Akt yangilandi!' : 'Yangi akt saqlandi!')
        setIsFormOpen(false)
        fetchActs()
      } else {
        toast.error(data.error || 'Xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Act
  const handleDeleteAct = async (id: number) => {
    if (!confirm('Haqiqatan ham bu aktni o\'chirmoqchimisiz?')) return
    try {
      const res = await fetch(`/api/incoming-acts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Akt o\'chirildi')
        fetchActs()
        if (selectedActForView?.id === id) setSelectedActForView(null)
      } else {
        toast.error(data.error || 'O\'chirishda xatolik')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    }
  }

  // Helper for cell value rendering based on viewMode
  const renderCellText = (
    rawVal: any,
    numVal: number,
    isDefect = false
  ) => {
    if (viewMode === 'numeric') {
      return (
        <span
          className={`font-mono font-bold px-1 rounded ${
            isDefect
              ? numVal === 0
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-100'
              : numVal === 1
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-700 bg-red-100'
          }`}
        >
          {numVal}
        </span>
      )
    }

    // Authentic text from rawValues or standard fallback
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      return <span>{String(rawVal)}</span>
    }

    if (isDefect) {
      return <span>{numVal === 0 ? 'отсутствует' : 'есть'}</span>
    }
    return <span>{numVal === 1 ? 'да' : 'нет'}</span>
  }

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-[1900px] mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">{t.title}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  {t.formCode}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center">
            <button
              onClick={() => setViewMode('authentic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'authentic'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mijozning fotosuratidagi asl ranglar va matnlar"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{t.authenticView}</span>
            </button>
            <button
              onClick={() => setViewMode('numeric')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'numeric'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="1 / 0 va 2-5 raqamli ko'rinish"
            >
              <Binary className="w-3.5 h-3.5" />
              <span>{t.numericView}</span>
            </button>
          </div>

          <button
            onClick={() => {
              setRefreshing(true)
              fetchActs()
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            {t.importExcel}
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            {t.exportExcel}
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/40 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            {t.newAct}
          </button>
        </div>
      </div>

      {/* Product Switcher Bar (Matching Real Colors) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-4 h-4 text-slate-400" />
            Xomashyo:
          </span>
          {PRODUCT_LIST.map(prod => {
            const isSelected = selectedProduct === prod.id
            return (
              <button
                key={prod.id}
                onClick={() => setSelectedProduct(prod.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? `${prod.bg} shadow-md ring-2 ring-slate-900/30 border-transparent scale-105`
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30"
                  style={{ backgroundColor: prod.color }}
                ></span>
                {prod.label}
              </button>
            )
          })}
        </div>

        {/* Search & Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700"
            />
          </div>

          {(search || dateFrom || dateTo || selectedRating !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setDateFrom('')
                setDateTo('')
                setSelectedRating('all')
              }}
              className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium"
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Jami aktlar:</span>
          <span className="font-bold font-mono text-slate-900 text-sm">{acts.length}</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Ombor (kg):</span>
          <span className="font-bold font-mono text-emerald-700 text-sm">
            {stats.totalKg ? stats.totalKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : 0}
          </span>
        </div>
        <div
          onClick={() => setSelectedRating(selectedRating === '5' ? 'all' : '5')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
            selectedRating === '5' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <span className="text-emerald-800">5 - Ideal:</span>
          <span className="font-bold font-mono text-emerald-950">{stats.rating5}</span>
        </div>
        <div
          onClick={() => setSelectedRating(selectedRating === '4' ? 'all' : '4')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
            selectedRating === '4' ? 'bg-blue-100 border-blue-400 font-bold' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <span className="text-blue-800">4 - Yaxshi:</span>
          <span className="font-bold font-mono text-blue-950">{stats.rating4}</span>
        </div>
        <div
          onClick={() => setSelectedRating(selectedRating === '3' ? 'all' : '3')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
            selectedRating === '3' ? 'bg-amber-100 border-amber-400 font-bold' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <span className="text-amber-800">3 - Shartli:</span>
          <span className="font-bold font-mono text-amber-950">{stats.rating3}</span>
        </div>
        <div
          onClick={() => setSelectedRating(selectedRating === '2' ? 'all' : '2')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
            selectedRating === '2' ? 'bg-red-100 border-red-400 font-bold' : 'bg-red-50 border-red-200'
          }`}
        >
          <span className="text-red-800">2 - Rad etilgan:</span>
          <span className="font-bold font-mono text-red-950">{stats.rating2}</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
          <span className="text-slate-500 font-medium">{t.pageInfo}</span>
          <span className="font-bold text-slate-800">
            {currentPage} / {totalPages}
          </span>
        </div>
      </div>

      {/* AUTHENTIC EXCEL GRID TABLE */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
          <table className="w-full text-left border-collapse border border-slate-400 text-[11px] leading-tight select-text">
            {/* 2-TIER EXCEL HEADER WITH EXACT PRODUCT COLOR FROM SCREENSHOTS */}
            <thead className="sticky top-0 z-20 shadow-sm">
              {/* Row 1 of Header: Spanning 'Отпущено в производство' */}
              <tr
                className={`${activeTheme.bgHeader} ${activeTheme.textColor} border-b border-black font-bold`}
                style={{ backgroundColor: activeTheme.color }}
              >
                <th
                  rowSpan={2}
                  onClick={() => setSortOrder(s => (s === 'asc' ? 'desc' : 'asc'))}
                  className="border border-black/40 py-2.5 px-2 text-center w-12 align-middle cursor-pointer hover:bg-black/10 transition"
                  title="Tartibni o'zgartirish (O'sish / Kamayish)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t.number}</span>
                    <span className="text-[9px] opacity-70">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  </div>
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[95px] max-w-[110px] align-middle"
                >
                  {t.date}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[120px] align-middle"
                >
                  {selectedProduct === 'all'
                    ? 'Наименование основного СЫРЬЯ'
                    : selectedProduct === 'ЛИМОН'
                    ? 'ЛИМОН'
                    : `Наименование основного СЫРЬЯ - ${activeTheme.name}`}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[130px] align-middle"
                >
                  {t.supplier}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-1.5 text-center min-w-[85px] align-middle"
                >
                  {t.temp}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[120px] align-middle"
                >
                  {t.transport}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-1.5 text-center min-w-[95px] align-middle"
                >
                  {t.docs}
                </th>

                {/* 11 Product-specific criteria */}
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[120px] align-middle"
                >
                  {activeTheme.col9}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {activeTheme.col10}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[120px] align-middle"
                >
                  {activeTheme.col11}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[120px] align-middle"
                >
                  {activeTheme.col12}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {activeTheme.col13}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[130px] align-middle"
                >
                  {activeTheme.col14}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {activeTheme.col15}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {activeTheme.col16}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[100px] align-middle"
                >
                  {activeTheme.col17}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[100px] align-middle"
                >
                  {activeTheme.col18}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {activeTheme.col19}
                </th>

                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[70px] align-middle"
                >
                  {t.batch}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[90px] align-middle"
                >
                  {t.rating}
                </th>

                {/* Grouped Header for 'Отпущено в производство' */}
                <th
                  colSpan={3}
                  className="border border-black/40 py-1.5 px-2 text-center align-middle bg-black/10"
                >
                  {t.issuedGroup}
                </th>

                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[110px] align-middle"
                >
                  {t.rejectionNo}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[150px] align-middle"
                >
                  {t.inspector}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[80px] align-middle"
                >
                  {t.price}
                </th>
                <th
                  rowSpan={2}
                  className="border border-black/40 py-2.5 px-2 text-center min-w-[65px] align-middle"
                >
                  {t.actions}
                </th>
              </tr>

              {/* Row 2 of Header: sub-columns for 'Отпущено в производство' */}
              <tr
                className={`${activeTheme.bgHeader} ${activeTheme.textColor} border-b border-black font-bold text-[10px]`}
                style={{ backgroundColor: activeTheme.color }}
              >
                <th className="border border-black/40 py-1.5 px-2 text-center min-w-[75px]">
                  {t.kgWarehouse}
                </th>
                <th className="border border-black/40 py-1.5 px-2 text-center min-w-[95px]">
                  {t.kgShop}
                </th>
                <th className="border border-black/40 py-1.5 px-2 text-center min-w-[85px]">
                  {t.shopDate}
                </th>
              </tr>
            </thead>

            {/* Table Body with Authentic Excel Grid Cells & Highlights */}
            <tbody className="divide-y divide-slate-300 text-slate-900 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={27} className="py-16 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <span>{activeTheme.name} ma'lumotlari yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedActs.length === 0 ? (
                <tr>
                  <td colSpan={27} className="py-16 text-center">
                    <p className="font-bold text-slate-700 text-sm">{t.noData}</p>
                    <p className="text-xs text-slate-400 mt-1">{t.noDataDesc}</p>
                  </td>
                </tr>
              ) : (
                paginatedActs.map((act, idx) => {
                  const raw = act.rawValues || {}
                  const isYellowRow =
                    Boolean(raw.isYellow) ||
                    (act.productName.toUpperCase().includes('ЛУК') &&
                      (act.actNumber === '6' || act.actNumber === '9' || act.actNumber === '11')) ||
                    (act.productName.toUpperCase().includes('ЛИМОН') &&
                      (act.actDate.includes('2026-07-03') ||
                        act.actDate.includes('7/3/2026') ||
                        (act.actNumber === '1' && act.supplierName.toUpperCase().includes('ECO')))) ||
                    (act.productName.toUpperCase().includes('ОГУРЦ') &&
                      (act.actDate.includes('2026-07-23') ||
                        act.actDate.includes('7/23/2026') ||
                        act.actNumber === '1'))

                  return (
                    <tr
                      key={act.id}
                      onClick={() => setSelectedActForView(act)}
                      className={`hover:bg-sky-50/60 transition cursor-pointer ${
                        isYellowRow
                          ? 'bg-[#FFFF99] hover:bg-[#FFF566]' // Exact yellow highlight as in client's screenshot
                          : act.decisionRating === 2
                          ? 'bg-red-50 hover:bg-red-100/60'
                          : idx % 2 === 1
                          ? 'bg-slate-50/50'
                          : 'bg-white'
                      }`}
                    >
                      {/* Col 2: № п/п */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-medium">
                        {act.actNumber || (currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Col 3: Дата */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap font-mono">
                        {act.actDate}
                      </td>

                      {/* Col 4: Наименование сырья */}
                      <td className="border border-slate-300 py-1.5 px-2 font-bold whitespace-nowrap">
                        {act.productName}
                      </td>

                      {/* Col 5: Поставщик */}
                      <td className="border border-slate-300 py-1.5 px-2 font-medium">
                        {act.supplierName}
                      </td>

                      {/* Col 6: Температура */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono whitespace-nowrap">
                        {act.temperature || raw.col6 || '-'}
                      </td>

                      {/* Col 7: Условия упаковки */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col7, act.transportCondition)}
                      </td>

                      {/* Col 8: Документация */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col8, act.hasDocumentation)}
                      </td>

                      {/* Col 9: Структура / Консистенция */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col9, act.structure)}
                      </td>

                      {/* Col 10: Цвет */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col10, act.leafColor)}
                      </td>

                      {/* Col 11: Вкус / Запах */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col11, act.tasteSmell)}
                      </td>

                      {/* Col 12: Окисление / Размер */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col12, act.internalOxidation, true)}
                      </td>

                      {/* Col 13: Следы насекомых */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col13, act.insectTraces, true)}
                      </td>

                      {/* Col 14: Слизь, разложение, гниль */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col14, act.rotDiseases, true)}
                      </td>

                      {/* Col 15: Кочерыжка / Дефекты */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col15, act.stemCut)}
                      </td>

                      {/* Col 16: Плотность / Трещины */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col16, act.density)}
                      </td>

                      {/* Col 17: Диаметр/Вес / Трещины */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap">
                        {raw.col17 || act.diameterWeight || '-'}
                      </td>

                      {/* Col 18: Покровные листья / Упаковка в ряд */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col18, act.outerLeavesRemoved)}
                      </td>

                      {/* Col 19: Отсутствие мех. повреждений */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {renderCellText(raw.col19, act.noMechanicalDamage)}
                      </td>

                      {/* Col 20: № партии */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-medium">
                        {act.batchNumber || raw.col20 || '-'}
                      </td>

                      {/* Col 21: Допуск */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-semibold">
                        {viewMode === 'numeric' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              act.decisionRating === 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : act.decisionRating === 4
                                ? 'bg-blue-100 text-blue-800'
                                : act.decisionRating === 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {act.decisionRating}
                          </span>
                        ) : (
                          <span
                            className={`${
                              act.decisionRating === 2 ? 'text-red-700 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {raw.col21 || act.decisionText || 'допускается'}
                          </span>
                        )}
                      </td>

                      {/* Col 22: кг (Приём склад) */}
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold">
                        {act.warehouseKg !== null && act.warehouseKg !== undefined
                          ? act.warehouseKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })
                          : raw.col22 || '-'}
                      </td>

                      {/* Col 23: КГ ЦЕХ */}
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-[10px]">
                        {act.shopIssuedKg || raw.col23 || ''}
                      </td>

                      {/* Col 24: Дата цех */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-[10px] whitespace-nowrap">
                        {act.shopIssuedDate || raw.col24 || ''}
                      </td>

                      {/* Col 25: НЕДОПУСК № акта забраковки */}
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-red-600">
                        {act.rejectionActNumber || raw.col25 || ''}
                      </td>

                      {/* Col 26: ФИО контролёра */}
                      <td className="border border-slate-300 py-1.5 px-2 whitespace-nowrap text-slate-700">
                        {act.inspectorName || raw.col26 || 'Камбарова А.М.'}
                      </td>

                      {/* Col 27: цена */}
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-medium">
                        {act.pricePerKg ? act.pricePerKg.toLocaleString('uz-UZ') : raw.col27 || '-'}
                      </td>

                      {/* Actions */}
                      <td
                        className="border border-slate-300 py-1.5 px-1 text-center"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedActForView(act)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded"
                            title="Batafsil"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(act)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAct(act.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
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

        {/* Table Footer with Pagination Controls */}
        <div className="p-3 bg-slate-100 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            Ko'rsatilmoqda: <span className="font-bold text-slate-900">{paginatedActs.length}</span> ta akt (Jami{' '}
            <span className="font-bold text-slate-900">{acts.length}</span> ta)
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
            >
              <option value={25}>25 tadan</option>
              <option value={50}>50 tadan</option>
              <option value={100}>100 tadan</option>
              <option value={500}>500 tadan</option>
            </select>

            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-dark-750 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {editingAct ? 'Aktni Tahrirlash' : 'Yangi Kiruvchi Xomashyo Akti'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Barcha sifat parametrlari raqamlar (1/0) va 2-5 baho bilan kiritiladi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAct} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs bg-slate-50/50 dark:bg-dark-900">
              {/* Identification */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  1. Asosiy ma'lumotlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">№ п/п</label>
                    <input
                      type="text"
                      value={formData.actNumber}
                      onChange={e => setFormData({ ...formData, actNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Дата составления</label>
                    <input
                      type="date"
                      value={formData.actDate}
                      onChange={e => setFormData({ ...formData, actDate: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Наименование СЫРЬЯ</label>
                    <select
                      value={formData.productName}
                      onChange={e => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-bold text-slate-900 dark:text-white"
                    >
                      {PRODUCT_LIST.filter(p => p.id !== 'all').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Поставщик</label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Зокир енд груп / Кибрай барака..."
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Температура сырья</label>
                    <input
                      type="text"
                      value={formData.temperature}
                      onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="18 с"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">№ партии</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="1, 2..."
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ФИО контролёра</label>
                    <input
                      type="text"
                      value={formData.inspectorName}
                      onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Scale: 2 to 5 */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    2. Baholash shkalasi (Допуск: 2 dan 5 gacha)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">Tanlangan: {formData.decisionRating}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { val: 5, label: '5 - Ideal', desc: "A'lo sifat", bg: 'bg-emerald-600' },
                    { val: 4, label: '4 - Yaxshi', desc: 'Ruxsat beriladi', bg: 'bg-blue-600' },
                    { val: 3, label: '3 - Shartli', desc: 'Saralash talab etiladi', bg: 'bg-amber-600' },
                    { val: 2, label: '2 - Rad etilgan', desc: 'Brak / Qabul qilinmadi', bg: 'bg-red-600' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, decisionRating: item.val })}
                      className={`p-3 rounded-xl border text-left transition ${
                        formData.decisionRating === item.val
                          ? `${item.bg} text-white shadow ring-2 ring-slate-900/30`
                          : 'bg-slate-50 dark:bg-dark-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <div className="font-black text-sm">{item.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>

                {formData.decisionRating === 2 && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 rounded-xl">
                    <label className="block text-red-900 dark:text-red-300 font-bold mb-1">НЕДОПУСК № акта забраковки</label>
                    <input
                      type="text"
                      value={formData.rejectionActNumber}
                      onChange={e => setFormData({ ...formData, rejectionActNumber: e.target.value })}
                      placeholder="Brak akti raqami"
                      className="w-full p-2 bg-white dark:bg-dark-900 border border-red-400 dark:border-red-800 rounded-lg font-mono text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Quality Criteria (1 / 0) */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>3. Sifat mezonlari (Raqamlarda: 1 / 0)</span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">1 = Ha, 0 = Yo'q/Otsutstvuyet</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Условия транспортировки', state: formData.transportCondition, key: 'transportCondition' },
                    { label: 'Сопровождающая документация', state: formData.hasDocumentation, key: 'hasDocumentation' },
                    { label: activeTheme.col9, state: formData.structure, key: 'structure' },
                    { label: activeTheme.col10, state: formData.leafColor, key: 'leafColor' },
                    { label: activeTheme.col11, state: formData.tasteSmell, key: 'tasteSmell' },
                    { label: `${activeTheme.col12} (0 = yo'q)`, state: formData.internalOxidation, key: 'internalOxidation', isDefect: true },
                    { label: `${activeTheme.col13} (0 = yo'q)`, state: formData.insectTraces, key: 'insectTraces', isDefect: true },
                    { label: `${activeTheme.col14} (0 = yo'q)`, state: formData.rotDiseases, key: 'rotDiseases', isDefect: true },
                    { label: activeTheme.col15, state: formData.stemCut, key: 'stemCut' },
                    { label: activeTheme.col16, state: formData.density, key: 'density' },
                    { label: activeTheme.col18, state: formData.outerLeavesRemoved, key: 'outerLeavesRemoved' },
                    { label: activeTheme.col19, state: formData.noMechanicalDamage, key: 'noMechanicalDamage' }
                  ].map((field: any) => (
                    <div
                      key={field.key}
                      className="p-2.5 bg-slate-50 dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate mr-2" title={field.label}>
                        {field.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, [field.key]: 1 })}
                          className={`px-2.5 py-1 rounded font-bold font-mono text-xs transition ${
                            formData[field.key as keyof typeof formData] === 1
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          1
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, [field.key]: 0 })}
                          className={`px-2.5 py-1 rounded font-bold font-mono text-xs transition ${
                            formData[field.key as keyof typeof formData] === 0
                              ? 'bg-red-600 text-white shadow'
                              : 'bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          0
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Размер плодов / Диаметр и вес
                  </label>
                  <input
                    type="text"
                    value={formData.diameterWeight}
                    onChange={e => setFormData({ ...formData, diameterWeight: e.target.value })}
                    placeholder="6-7 см yoki 400г-700г 12см"
                    className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Warehouse & Price */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  4. Ombor qabul vazni, chiqim va narxi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Приём склад (кг)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.warehouseKg}
                      onChange={e => setFormData({ ...formData, warehouseKg: e.target.value })}
                      placeholder="872"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">КГ ЦЕХ</label>
                    <input
                      type="text"
                      value={formData.shopIssuedKg}
                      onChange={e => setFormData({ ...formData, shopIssuedKg: e.target.value })}
                      placeholder="164,2+433,5"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Дата цех</label>
                    <input
                      type="text"
                      value={formData.shopIssuedDate}
                      onChange={e => setFormData({ ...formData, shopIssuedDate: e.target.value })}
                      placeholder="03,05,2025"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Цена (сум/кг)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pricePerKg}
                      onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                      placeholder="26000"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-dark-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-dark-800 transition"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow transition disabled:opacity-50"
                >
                  {submitting ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsImportOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-dark-750 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Excel Import (Barcha Xomashyolar)</h2>
                  <p className="text-xs text-slate-400">
                    Tomat, Piyoz, Aysberg, Karam, Sabzi va barcha bo'limlarni bazaga yuklash.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-slate-50/50 dark:bg-dark-900">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Import rejimi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border text-left transition ${
                      importMode === 'append'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-dark-850 border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Qo'shish (Append)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Mavjud aktlar saqlanadi</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border text-left transition ${
                      importMode === 'replace'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200 ring-1 ring-red-500'
                        : 'bg-white dark:bg-dark-850 border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Almashtirish (Replace)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Qayta tozalab yuklash</div>
                  </button>
                </div>
              </div>

              {/* 1-Click Fast Import */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  1-KLIK BILAN BARCHA 1276 TA AKTLARNI YUKLASH:
                </div>
                <p className="text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  Loyiha shablonidagi barcha Tomat (504 ta), Piyoz (48 ta), Aysberg (559 ta), Karam, Sabzi aktlarini asl ranglari bilan bazaga yuklash.
                </p>
                <button
                  type="button"
                  onClick={handleDefaultTemplateImport}
                  disabled={importing}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Baza yangilanmoqda...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Shablon faylidan import qilish
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-dark-700 w-full"></div>
                <span className="bg-white dark:bg-dark-900 px-3 text-[11px] uppercase font-bold text-slate-400 absolute">
                  yoki fayl tanlang
                </span>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUploadImport}
                  disabled={importing}
                  className="w-full p-2.5 bg-slate-50 dark:bg-dark-850 border border-dashed border-slate-300 dark:border-dark-700 rounded-xl text-slate-800 dark:text-slate-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 dark:file:bg-slate-700 file:text-white cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-dark-700 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-dark-800 transition"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {selectedActForView && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedActForView(null)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-dark-750 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Akt № {selectedActForView.actNumber} - {selectedActForView.productName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sana: {selectedActForView.actDate} | Ta'minotchi: {selectedActForView.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActForView(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs bg-slate-50/50 dark:bg-dark-900">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700">
                  <span className="text-[11px] text-slate-400 block">Partiya №</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{selectedActForView.batchNumber || '-'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700">
                  <span className="text-[11px] text-slate-400 block">Harorat</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{selectedActForView.temperature || '-'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700">
                  <span className="text-[11px] text-slate-400 block">Ombor (kg)</span>
                  <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {selectedActForView.warehouseKg ? selectedActForView.warehouseKg.toLocaleString('uz-UZ') : '-'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700">
                  <span className="text-[11px] text-slate-400 block">Narxi (so'm)</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {selectedActForView.pricePerKg ? selectedActForView.pricePerKg.toLocaleString('uz-UZ') : '-'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Допуск (Baholash):</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{selectedActForView.decisionRating} - {selectedActForView.decisionText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Отпущено в цех:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{selectedActForView.shopIssuedKg || '-'} (Sana: {selectedActForView.shopIssuedDate || '-'})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Mas'ul nazoratchi:</span>
                  <span className="text-slate-900 dark:text-white">{selectedActForView.inspectorName || '-'}</span>
                </div>
                {selectedActForView.rejectionActNumber && (
                  <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                    <span className="font-bold">НЕДОПУСК № акта забраковки:</span>
                    <span className="font-mono font-bold">{selectedActForView.rejectionActNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-850 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const act = selectedActForView
                  setSelectedActForView(null)
                  handleOpenEdit(act)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Tahrirlash
              </button>
              <button
                type="button"
                onClick={() => setSelectedActForView(null)}
                className="px-4 py-2 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-dark-800 transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

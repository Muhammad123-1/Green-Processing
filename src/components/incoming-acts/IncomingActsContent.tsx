'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  X,
  FileCheck,
  Scale,
  Thermometer,
  Truck,
  FileText,
  DollarSign,
  User,
  Hash,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

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

const DEFAULT_PRODUCTS = [
  'Салат Айсберг',
  'Томат',
  'Лук белый',
  'Капуста белокочанная',
  'Морковь',
  'Лимон'
]

const DEFAULT_SUPPLIERS = [
  'ECO GROW',
  'AGRO EGZOTIKA',
  'QIBRAY ARASHAN',
  'Кибрай барака',
  'Зокир енд груп',
  'Назаров 22',
  'Мадинабону органик'
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

  // Filter state
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
    productName: 'Салат Айсберг',
    supplierName: '',
    temperature: '8 °C',
    transportCondition: 1,
    hasDocumentation: 1,
    structure: 1,
    leafColor: 1,
    tasteSmell: 1,
    internalOxidation: 0,
    insectTraces: 0,
    rotDiseases: 0,
    stemCut: 1,
    density: 1,
    diameterWeight: '400г-700г 12см',
    outerLeavesRemoved: 1,
    noMechanicalDamage: 1,
    batchNumber: '',
    decisionRating: 4, // 2, 3, 4, 5
    warehouseKg: '',
    shopIssuedKg: '',
    shopIssuedDate: '',
    rejectionActNumber: '',
    inspectorName: 'Камбарова А.М.',
    pricePerKg: '',
    notes: ''
  })

  // Translations dictionary
  const t = {
    uz: {
      title: 'ВХОДНОЕ СЫРЬЕ (АКТЫ)',
      subtitle: 'Xomashyo sifatini qabul qilish va nazorat qilish aktlari jurnali',
      formCode: 'Forma: Ф-2/03 | ООО "GREEN PROCESSING"',
      newAct: 'Yangi akt yaratish',
      importExcel: 'Excel Import',
      exportExcel: 'Excel yuklab olish',
      refresh: 'Yangilash',
      allRatings: 'Barchasi',
      ideal: 'Ideal',
      good: 'Yaxshi',
      conditional: 'Shartli qabul (saralash va tozalash)',
      rejected: 'Rad etilgan (Brak)',
      totalActs: 'Jami aktlar',
      totalWeight: 'Jami qabul qilingan',
      rejectionRate: 'Rad etish soni',
      searchPlaceholder: 'Partiya, ta\'minotchi, nazoratchi, akt №...',
      allProducts: 'Barcha mahsulotlar',
      resetFilters: 'Filtrni tozalash',
      number: '№',
      date: 'Sana',
      product: 'Xomashyo',
      supplier: 'Ta\'minotchi',
      temp: 'Harorat',
      batch: 'Partiya №',
      criteria: 'Mezonlar (Raqamda)',
      rating: 'Baholash',
      weightKg: 'Ombor (kg)',
      issuedKg: 'Sexga (kg)',
      inspector: 'Nazoratchi',
      price: 'Narxi (so\'m)',
      actions: 'Amallar',
      noData: 'Hech qanday akt topilmadi',
      noDataDesc: 'Qidiruv parametrlarini o\'zgartiring yoki yangi akt kiriting / Exceldan import qiling.',
      viewDetails: 'Batafsil',
      edit: 'Tahrirlash',
      delete: 'O\'chirish',
      confirmDelete: 'Haqiqatan ham bu aktni o\'chirmoqchimisiz?',
      importModalTitle: 'Exceldan Aktlarni Import Qilish',
      importModalDesc: 'Mavjud "ВХОДНОЕ_СЫРЬЕ_АКТЫ" shablonidan yoki yangi yuklangan fayldan ma\'lumotlarni bazaga yuklang.',
      fastImportBtn: '⚡ Shablon faylidan import qilish (templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx)',
      orUploadFile: 'Yoki kompyuterdan yangi .xlsx faylni tanlang:',
      selectFile: 'Excel fayl tanlang',
      importModeAppend: 'Mavjud ma\'lumotlarga qo\'shish (Append)',
      importModeReplace: 'Eski ma\'lumotlarni tozalab, qayta yuklash (Replace)',
      close: 'Yopish',
      save: 'Saqlash',
      saving: 'Saqlanmoqda...',
      legendText: 'Raqamlar ma\'nosi: 1 = Ha / Muvofiq / Qoniqarli; 0 = Yo\'q / Otsutstvuyet. Baholash: 5 = Ideal, 4 = Yaxshi, 3 = Shartli qabul, 2 = Rad etilgan.'
    },
    ru: {
      title: 'ВХОДНОЕ СЫРЬЕ (АКТЫ)',
      subtitle: 'Журнал регистрации и контроля качества поступающего сырья',
      formCode: 'Форма: Ф-2/03 | ООО "GREEN PROCESSING"',
      newAct: 'Создать новый акт',
      importExcel: 'Импорт из Excel',
      exportExcel: 'Экспорт в Excel',
      refresh: 'Обновить',
      allRatings: 'Все',
      ideal: 'Идеал',
      good: 'Хорошо',
      conditional: 'Условно принято (сортировка и очистка)',
      rejected: 'Отклонено (Брак)',
      totalActs: 'Всего актов',
      totalWeight: 'Принято всего',
      rejectionRate: 'Отклонено актов',
      searchPlaceholder: 'Партия, поставщик, контролёр, № акта...',
      allProducts: 'Все сырье',
      resetFilters: 'Сбросить фильтры',
      number: '№',
      date: 'Дата',
      product: 'Сырьё',
      supplier: 'Поставщик',
      temp: 'Темп.',
      batch: 'Партия №',
      criteria: 'Критерии (в числах)',
      rating: 'Оценка',
      weightKg: 'Склад (кг)',
      issuedKg: 'Цех (кг)',
      inspector: 'Контролёр',
      price: 'Цена (сум)',
      actions: 'Действия',
      noData: 'Акты не найдены',
      noDataDesc: 'Измените параметры поиска или создайте новый акт / импортируйте из Excel.',
      viewDetails: 'Просмотр',
      edit: 'Редактировать',
      delete: 'Удалить',
      confirmDelete: 'Вы действительно хотите удалить этот акт?',
      importModalTitle: 'Импорт актов из Excel',
      importModalDesc: 'Загрузите данные из корпоративного файла "ВХОДНОЕ_СЫРЬЕ_АКТЫ" или пользовательского файла.',
      fastImportBtn: '⚡ Импортировать из шаблона (templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx)',
      orUploadFile: 'Или выберите файл с компьютера (.xlsx):',
      selectFile: 'Выбрать файл Excel',
      importModeAppend: 'Добавить к существующим (Append)',
      importModeReplace: 'Очистить базу и загрузить заново (Replace)',
      close: 'Закрыть',
      save: 'Сохранить',
      saving: 'Сохранение...',
      legendText: 'Обозначение чисел: 1 = Да / Соответствует / Удовлетворительно; 0 = Нет / Отсутствует. Оценка: 5 = Идеал, 4 = Хорошо, 3 = Условно принято, 2 = Отклонено.'
    },
    en: {
      title: 'INCOMING RAW MATERIAL ACTS',
      subtitle: 'Inspection, quality assessment and receiving journal',
      formCode: 'Form: Ф-2/03 | LLC "GREEN PROCESSING"',
      newAct: 'Create New Act',
      importExcel: 'Excel Import',
      exportExcel: 'Export to Excel',
      refresh: 'Refresh',
      allRatings: 'All',
      ideal: 'Ideal',
      good: 'Good',
      conditional: 'Conditional Acceptance (sorting & cleaning)',
      rejected: 'Rejected (Defect)',
      totalActs: 'Total Acts',
      totalWeight: 'Total Received',
      rejectionRate: 'Rejected Acts',
      searchPlaceholder: 'Batch, supplier, inspector, act #...',
      allProducts: 'All Raw Materials',
      resetFilters: 'Reset filters',
      number: '#',
      date: 'Date',
      product: 'Material',
      supplier: 'Supplier',
      temp: 'Temp',
      batch: 'Batch #',
      criteria: 'Criteria (Numeric)',
      rating: 'Verdict',
      weightKg: 'Warehouse (kg)',
      issuedKg: 'Shop (kg)',
      inspector: 'Inspector',
      price: 'Price (UZS)',
      actions: 'Actions',
      noData: 'No inspection acts found',
      noDataDesc: 'Change filters or create a new act / import from Excel.',
      viewDetails: 'View Details',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this act?',
      importModalTitle: 'Import Acts from Excel',
      importModalDesc: 'Load records from the official "ВХОДНОЕ_СЫРЬЕ_АКТЫ" workbook or upload any Excel file.',
      fastImportBtn: '⚡ 1-Click Import from Company Template (templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx)',
      orUploadFile: 'Or choose a file from your computer (.xlsx):',
      selectFile: 'Select Excel File',
      importModeAppend: 'Append to existing records',
      importModeReplace: 'Replace all records',
      close: 'Close',
      save: 'Save',
      saving: 'Saving...',
      legendText: 'Numeric meanings: 1 = Yes / Satisfactory / Standard; 0 = No / Absent. Rating: 5 = Ideal, 4 = Good, 3 = Conditional, 2 = Rejected.'
    }
  }[activeLang]

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
    fetchActs()
  }, [selectedProduct, selectedRating, dateFrom, dateTo])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActs()
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Export to Excel handler
  const handleExport = () => {
    const params = new URLSearchParams()
    params.append('lang', activeLang)
    if (search) params.append('search', search)
    if (selectedProduct && selectedProduct !== 'all') params.append('product', selectedProduct)
    if (selectedRating && selectedRating !== 'all') params.append('rating', selectedRating)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)

    window.open(`/api/incoming-acts/export?${params.toString()}`, '_blank')
    toast.success('Excel fayl yuklab olinmoqda...')
  }

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingAct(null)
    setFormData({
      actNumber: String(stats.totalActs + 1),
      actDate: new Date().toISOString().slice(0, 10),
      productName: selectedProduct !== 'all' ? selectedProduct : 'Салат Айсберг',
      supplierName: '',
      temperature: '8 °C',
      transportCondition: 1,
      hasDocumentation: 1,
      structure: 1,
      leafColor: 1,
      tasteSmell: 1,
      internalOxidation: 0,
      insectTraces: 0,
      rotDiseases: 0,
      stemCut: 1,
      density: 1,
      diameterWeight: '400г-700г 12см',
      outerLeavesRemoved: 1,
      noMechanicalDamage: 1,
      batchNumber: `${new Date().getDate()}.${new Date().getMonth() + 1}//${stats.totalActs + 1}`,
      decisionRating: 4,
      warehouseKg: '',
      shopIssuedKg: '',
      shopIssuedDate: '',
      rejectionActNumber: '',
      inspectorName: 'Камбарова А.М.',
      pricePerKg: '',
      notes: ''
    })
    setIsFormOpen(true)
  }

  // Open Form for Edit
  const handleOpenEdit = (act: IncomingAct) => {
    setEditingAct(act)
    setFormData({
      actNumber: act.actNumber || '',
      actDate: act.actDate || new Date().toISOString().slice(0, 10),
      productName: act.productName || 'Салат Айсберг',
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

  // Save Act Form (Create or Edit)
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
        toast.success(editingAct ? 'Akt yangilandi!' : 'Yangi akt muvaffaqiyatli saqlandi!')
        setIsFormOpen(false)
        fetchActs()
      } else {
        toast.error(data.error || 'Saqlashda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Act
  const handleDeleteAct = async (id: number) => {
    if (!confirm(t.confirmDelete)) return
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

  // 1-Click Template Import
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
        toast.success(data.message || 'Shablon muvaffaqiyatli yuklandi!')
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
        toast.error(data.error || 'Faylni o\'qishda xatolik yuz berdi')
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setImporting(false)
    }
  }

  // Helper for Rating Badge
  const renderRatingBadge = (rating: number) => {
    switch (rating) {
      case 5:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            5 - {t.ideal}
          </span>
        )
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            4 - {t.good}
          </span>
        )
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            3 - {t.conditional}
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            2 - {t.rejected}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {rating}
          </span>
        )
    }
  }

  // Criteria summary tags helper
  const renderCriteriaPills = (act: IncomingAct) => {
    return (
      <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
        <span
          title="Transport sharoiti"
          className={`px-1.5 py-0.5 rounded ${
            act.transportCondition === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          Tr:{act.transportCondition}
        </span>
        <span
          title="Hujjatlar"
          className={`px-1.5 py-0.5 rounded ${
            act.hasDocumentation === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          Huj:{act.hasDocumentation}
        </span>
        <span
          title="Tuzilishi / Barglar"
          className={`px-1.5 py-0.5 rounded ${
            act.structure === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          Tuz:{act.structure}
        </span>
        <span
          title="Ichki oksidlanish / qizarish (0 = yo'q)"
          className={`px-1.5 py-0.5 rounded ${
            act.internalOxidation === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-800 font-bold border border-red-300'
          }`}
        >
          Oks:{act.internalOxidation}
        </span>
        <span
          title="Hasharotlar izi (0 = yo'q)"
          className={`px-1.5 py-0.5 rounded ${
            act.insectTraces === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-800 font-bold border border-red-300'
          }`}
        >
          Hash:{act.insectTraces}
        </span>
        <span
          title="Chirish va nuqsonlar (0 = yo'q)"
          className={`px-1.5 py-0.5 rounded ${
            act.rotDiseases === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-800 font-bold border border-red-300'
          }`}
        >
          Chir:{act.rotDiseases}
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    {t.formCode}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{t.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setRefreshing(true)
                fetchActs()
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              {t.importExcel}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4 text-sky-400" />
              {t.exportExcel}
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t.newAct}
            </button>
          </div>
        </div>

        {/* Legend Notice Box */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{t.legendText}</span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">{t.totalActs}</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalActs}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Baza jami</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">{t.totalWeight}</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalKg ? stats.totalKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : 0}{' '}
            <span className="text-sm font-semibold text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Omborga qabul</div>
        </div>

        <div
          onClick={() => setSelectedRating(selectedRating === '5' ? 'all' : '5')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition flex flex-col justify-between ${
            selectedRating === '5'
              ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500'
              : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/60'
          }`}
        >
          <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>5 - {t.ideal}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{stats.rating5}</div>
          <div className="text-[11px] text-emerald-700 font-medium">A'lo sifat</div>
        </div>

        <div
          onClick={() => setSelectedRating(selectedRating === '4' ? 'all' : '4')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition flex flex-col justify-between ${
            selectedRating === '4'
              ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500'
              : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/60'
          }`}
        >
          <div className="text-xs font-bold text-blue-800 flex items-center justify-between">
            <span>4 - {t.good}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{stats.rating4}</div>
          <div className="text-[11px] text-blue-700 font-medium">Qabul qilingan</div>
        </div>

        <div
          onClick={() => setSelectedRating(selectedRating === '3' ? 'all' : '3')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition flex flex-col justify-between ${
            selectedRating === '3'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
              : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <div className="text-xs font-bold text-amber-800 flex items-center justify-between">
            <span>3 - Shartli</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{stats.rating3}</div>
          <div className="text-[11px] text-amber-700 font-medium">Saralash/tozalash</div>
        </div>

        <div
          onClick={() => setSelectedRating(selectedRating === '2' ? 'all' : '2')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition flex flex-col justify-between ${
            selectedRating === '2'
              ? 'bg-red-100 border-red-400 ring-2 ring-red-500'
              : 'bg-red-50/60 border-red-200 hover:bg-red-100/60'
          }`}
        >
          <div className="text-xs font-bold text-red-800 flex items-center justify-between">
            <span>2 - {t.rejected}</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-950 mt-2">{stats.rating2}</div>
          <div className="text-[11px] text-red-700 font-medium">Brak / Rad</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Rating Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'all', label: t.allRatings },
              { id: '5', label: '5 - Ideal' },
              { id: '4', label: '4 - Yaxshi' },
              { id: '3', label: '3 - Shartli' },
              { id: '2', label: '2 - Rad etilgan' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRating(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  selectedRating === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product and Search Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full text-xs font-medium pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="all">{t.allProducts}</option>
                {Array.from(new Set([...DEFAULT_PRODUCTS, ...stats.products])).map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {(selectedProduct !== 'all' || selectedRating !== 'all' || search || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSelectedProduct('all')
                  setSelectedRating('all')
                  setSearch('')
                  setDateFrom('')
                  setDateTo('')
                }}
                className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">{t.number}</th>
                <th className="py-3 px-3 w-24">{t.date}</th>
                <th className="py-3 px-3 w-40">{t.product}</th>
                <th className="py-3 px-3 w-40">{t.supplier}</th>
                <th className="py-3 px-2 text-center w-20">{t.temp}</th>
                <th className="py-3 px-3 w-28">{t.batch}</th>
                <th className="py-3 px-3">{t.criteria}</th>
                <th className="py-3 px-3 text-center w-36">{t.rating}</th>
                <th className="py-3 px-3 text-right w-28">{t.weightKg}</th>
                <th className="py-3 px-3 text-right w-24">{t.issuedKg}</th>
                <th className="py-3 px-3 w-32">{t.inspector}</th>
                <th className="py-3 px-3 text-right w-28">{t.price}</th>
                <th className="py-3 px-3 text-center w-24">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <span>Ma'lumotlar yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : acts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">{t.noData}</p>
                    <p className="text-xs text-slate-400 mt-1">{t.noDataDesc}</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-semibold hover:bg-emerald-100 transition"
                      >
                        {t.fastImportBtn}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                acts.map((act, index) => (
                  <tr
                    key={act.id}
                    className={`hover:bg-slate-50 transition cursor-pointer ${
                      act.decisionRating === 2 ? 'bg-red-50/30' : ''
                    }`}
                    onClick={() => setSelectedActForView(act)}
                  >
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                      {act.actNumber || index + 1}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                      {act.actDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {act.productName}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {act.supplierName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">
                      {act.temperature || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {act.batchNumber || '-'}
                    </td>
                    <td className="py-2.5 px-3">{renderCriteriaPills(act)}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderRatingBadge(act.decisionRating)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {act.warehouseKg ? act.warehouseKg.toLocaleString('uz-UZ', { maximumFractionDigits: 1 }) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {act.shopIssuedKg || '-'}
                    </td>
                    <td className="py-2.5 px-3 truncate max-w-[120px] text-slate-600" title={act.inspectorName || ''}>
                      {act.inspectorName || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {act.pricePerKg ? `${act.pricePerKg.toLocaleString('uz-UZ')}` : '-'}
                    </td>
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedActForView(act)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title={t.viewDetails}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(act)}
                          className="p-1 hover:bg-slate-200 text-blue-600 rounded"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAct(act.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                    Barcha sifat parametrlari raqamlar bilan kiritiladi (1 / 0 va 2-5 baho).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAct} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Main Identification */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  1. Asosiy identifikatsiya ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Akt raqami (№ п/п)
                    </label>
                    <input
                      type="text"
                      value={formData.actNumber}
                      onChange={e => setFormData({ ...formData, actNumber: e.target.value })}
                      placeholder="1, 2, 3..."
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sana (Поступление)
                    </label>
                    <input
                      type="date"
                      value={formData.actDate}
                      onChange={e => setFormData({ ...formData, actDate: e.target.value })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Xomashyo nomi
                    </label>
                    <input
                      type="text"
                      list="product-suggestions"
                      value={formData.productName}
                      onChange={e => setFormData({ ...formData, productName: e.target.value })}
                      placeholder="Masalan: Салат Айсберг"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <datalist id="product-suggestions">
                      {DEFAULT_PRODUCTS.map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ta'minotchi (Поставщик)
                    </label>
                    <input
                      type="text"
                      list="supplier-suggestions"
                      value={formData.supplierName}
                      onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Masalan: ECO GROW"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <datalist id="supplier-suggestions">
                      {DEFAULT_SUPPLIERS.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Partiya raqami (№ партии)
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="03.01//1"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Harorat (Температура при поступлении)
                    </label>
                    <input
                      type="text"
                      value={formData.temperature}
                      onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="8 °C"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nazoratchi F.I.O (Контролёр)
                    </label>
                    <input
                      type="text"
                      value={formData.inspectorName}
                      onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                      placeholder="Камбарова А.М."
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: DECISION RATING (2 to 5) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    2. Yakuniy sifat bahosi (Допуск: 2 dan 5 gacha)
                  </span>
                  <span className="text-emerald-700 font-mono font-bold">
                    Tanlangan: {formData.decisionRating}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                  {/* Rating 5 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, decisionRating: 5 })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      formData.decisionRating === 5
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono">5</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="mt-2">
                      <div className="font-bold text-xs">{t.ideal}</div>
                      <div className={`text-[10px] mt-0.5 ${formData.decisionRating === 5 ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Barcha talablarga to'liq muvofiq
                      </div>
                    </div>
                  </button>

                  {/* Rating 4 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, decisionRating: 4 })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      formData.decisionRating === 4
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono">4</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="mt-2">
                      <div className="font-bold text-xs">{t.good}</div>
                      <div className={`text-[10px] mt-0.5 ${formData.decisionRating === 4 ? 'text-blue-100' : 'text-slate-400'}`}>
                        Standart bo'yicha to'liq ruxsat etiladi
                      </div>
                    </div>
                  </button>

                  {/* Rating 3 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, decisionRating: 3 })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      formData.decisionRating === 3
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono">3</span>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="mt-2">
                      <div className="font-bold text-xs">Shartli qabul</div>
                      <div className={`text-[10px] mt-0.5 ${formData.decisionRating === 3 ? 'text-amber-100' : 'text-slate-400'}`}>
                        Saralash va tozalash talab etiladi
                      </div>
                    </div>
                  </button>

                  {/* Rating 2 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, decisionRating: 2 })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      formData.decisionRating === 2
                        ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono">2</span>
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div className="mt-2">
                      <div className="font-bold text-xs">{t.rejected}</div>
                      <div className={`text-[10px] mt-0.5 ${formData.decisionRating === 2 ? 'text-red-100' : 'text-slate-400'}`}>
                        Rad etilgan, qabul qilinmaydi (Brak)
                      </div>
                    </div>
                  </button>
                </div>

                {formData.decisionRating === 2 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <label className="block text-xs font-bold text-red-900 mb-1">
                      Rad etish akt raqami (НЕДОПУСК № акта забраковки)
                    </label>
                    <input
                      type="text"
                      value={formData.rejectionActNumber}
                      onChange={e => setFormData({ ...formData, rejectionActNumber: e.target.value })}
                      placeholder="Brak akti raqami (masalan: BR-045)"
                      className="w-full text-xs p-2 bg-white border border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                      required={formData.decisionRating === 2}
                    />
                  </div>
                )}
              </div>

              {/* Section 3: NUMERICAL QUALITY CRITERIA (1 or 0) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    3. Laboratoriya va organoleptik tekshiruv mezonlari (Raqamlarda)
                  </span>
                  <span className="text-[11px] text-slate-400 lowercase">
                    (1 = ha / muvofiq, 0 = yo'q / otsutstvuyet)
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Transport */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Transport va qadoqlash sharoiti</div>
                      <div className="text-[11px] text-slate-400">Условия транспортировки</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transportCondition: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.transportCondition === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Qoniqarli)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transportCondition: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.transportCondition === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Yo'q)
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Kuzatuv hujjatlari</div>
                      <div className="text-[11px] text-slate-400">Сопровождающая документация</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasDocumentation: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.hasDocumentation === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Mavjud)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasDocumentation: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.hasDocumentation === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Yo'q)
                      </button>
                    </div>
                  </div>

                  {/* Structure */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Tuzilishi: Zich, shirali, qarsildoq</div>
                      <div className="text-[11px] text-slate-400">Структура и консистенция</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, structure: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.structure === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Muvofiq)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, structure: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.structure === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Brak)
                      </button>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Rangi: Och yashildan to'q yashilgacha</div>
                      <div className="text-[11px] text-slate-400">Цвет листьев/плодов</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, leafColor: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.leafColor === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Muvofiq)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, leafColor: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.leafColor === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Brak)
                      </button>
                    </div>
                  </div>

                  {/* Taste & Smell */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Ta'mi va hidi: Toza, begona hidsiz</div>
                      <div className="text-[11px] text-slate-400">Вкус и запах свежий</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tasteSmell: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.tasteSmell === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Muvofiq)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tasteSmell: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.tasteSmell === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Brak)
                      </button>
                    </div>
                  </div>

                  {/* Internal oxidation (0 = Otsutstvuyet) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Ichki qizarish / Oksidlanish</div>
                      <div className="text-[11px] text-slate-400">Внутреннее окисление (порозовение)</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, internalOxidation: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.internalOxidation === 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Otsutstvuyet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, internalOxidation: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.internalOxidation === 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Mavjud - Brak)
                      </button>
                    </div>
                  </div>

                  {/* Insects (0 = Otsutstvuyet) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Hasharotlar va zararkunandalar</div>
                      <div className="text-[11px] text-slate-400">Следы насекомых и вредителей</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, insectTraces: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.insectTraces === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Otsutstvuyet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, insectTraces: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.insectTraces === 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Mavjud - Brak)
                      </button>
                    </div>
                  </div>

                  {/* Rot / Diseases (0 = Otsutstvuyet) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Chirish, shilimshiq, kasalliklar</div>
                      <div className="text-[11px] text-slate-400">Слизь, разложение, гниль</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rotDiseases: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.rotDiseases === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Otsutstvuyet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rotDiseases: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.rotDiseases === 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Mavjud - Brak)
                      </button>
                    </div>
                  </div>

                  {/* Stem Cut */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Kesim: Tekis, &le; 3 sm balandlikda</div>
                      <div className="text-[11px] text-slate-400">В разрезе кочерыжка ровная</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, stemCut: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.stemCut === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Muvofiq)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, stemCut: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.stemCut === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Nomaqbul)
                      </button>
                    </div>
                  </div>

                  {/* Density */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Zichligi: O'rtacha zichlik</div>
                      <div className="text-[11px] text-slate-400">Плотность средней плотности</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, density: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.density === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Standart)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, density: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.density === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Nomaqbul)
                      </button>
                    </div>
                  </div>

                  {/* Outer Leaves */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Qoplama quyuq barglari olinganligi</div>
                      <div className="text-[11px] text-slate-400">Удаленные покровные листья</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, outerLeavesRemoved: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.outerLeavesRemoved === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Ha)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, outerLeavesRemoved: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.outerLeavesRemoved === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Yo'q)
                      </button>
                    </div>
                  </div>

                  {/* No mechanical damage */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Mexanik shikastlanish yo'qligi</div>
                      <div className="text-[11px] text-slate-400">Отсутствие мех. повреждений</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, noMechanicalDamage: 1 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.noMechanicalDamage === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        1 (Shikast yo'q)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, noMechanicalDamage: 0 })}
                        className={`px-3 py-1 rounded font-bold font-mono text-xs ${
                          formData.noMechanicalDamage === 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        0 (Shikastlangan)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Диаметр кочана ва минимал вазн (Диаметр / вес)
                  </label>
                  <input
                    type="text"
                    value={formData.diameterWeight}
                    onChange={e => setFormData({ ...formData, diameterWeight: e.target.value })}
                    placeholder="Masalan: 400г-700г 12см"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Section 4: Warehouse, Price & Issue */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  4. Ombor qabul vazni, sexga chiqim va narx
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qabul qilingan vazn (кг склад)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.warehouseKg}
                      onChange={e => setFormData({ ...formData, warehouseKg: e.target.value })}
                      placeholder="8081"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sexga berildi (кг цех)
                    </label>
                    <input
                      type="text"
                      value={formData.shopIssuedKg}
                      onChange={e => setFormData({ ...formData, shopIssuedKg: e.target.value })}
                      placeholder="394.8 yoki 205.5+169.3"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sexga berilgan sana
                    </label>
                    <input
                      type="text"
                      value={formData.shopIssuedDate}
                      onChange={e => setFormData({ ...formData, shopIssuedDate: e.target.value })}
                      placeholder="05.05.2025"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Narxi (so'm / kg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pricePerKg}
                      onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                      placeholder="17500"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qo'shimcha izoh / xulosa
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Mahsulot holati bo'yicha maxsus ko'rsatma..."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition disabled:opacity-50"
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
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">{t.importModalTitle}</h2>
                  <p className="text-xs text-slate-400">{t.importModalDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Mode Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Import rejimi:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border text-left font-medium transition ${
                      importMode === 'append'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Qo'shish (Append)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Mavjud aktlar saqlanadi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border text-left font-medium transition ${
                      importMode === 'replace'
                        ? 'bg-red-50 border-red-500 text-red-900 ring-1 ring-red-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Almashtirish (Replace)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Eskilar o'chib yangidan yuklanadi</div>
                  </button>
                </div>
              </div>

              {/* Option 1: 1-Click Fast Import from Template */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  1-KLIK BILAN KORXONA SHABLONIDAN YUKLASH:
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Loyiha fayllaridagi <span className="font-mono font-semibold">templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx</span> faylidan barcha aktlar va raqamli sifat ko'rsatkichlarini bir zumda bazaga yuklash.
                </p>
                <button
                  type="button"
                  onClick={handleDefaultTemplateImport}
                  disabled={importing}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Yuklanmoqda...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Shablon faylini yuklash
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] uppercase font-bold text-slate-400 absolute">
                  yoki
                </span>
              </div>

              {/* Option 2: Custom File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {t.orUploadFile}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUploadImport}
                  disabled={importing}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedActForView && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedActForView(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      Akt № {selectedActForView.actNumber} - {selectedActForView.productName}
                    </h2>
                    {renderRatingBadge(selectedActForView.decisionRating)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Sana: {selectedActForView.actDate} | Ta'minotchi: {selectedActForView.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActForView(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Primary parameters grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Partiya raqami</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {selectedActForView.batchNumber || '-'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Harorat</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {selectedActForView.temperature || '-'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Ombor qabul (kg)</div>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-1">
                    {selectedActForView.warehouseKg ? selectedActForView.warehouseKg.toLocaleString('uz-UZ') : '-'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Narxi (so'm/kg)</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {selectedActForView.pricePerKg ? selectedActForView.pricePerKg.toLocaleString('uz-UZ') : '-'}
                  </div>
                </div>
              </div>

              {/* Numerical inspection matrix */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Laboratoriya va sifat ko'rsatkichlari (Raqamli):
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="grid grid-cols-12 p-2 bg-slate-100 font-bold text-slate-600">
                    <div className="col-span-8">Tekshiruv parametri</div>
                    <div className="col-span-4 text-center">Raqamli qiymat</div>
                  </div>

                  {[
                    { label: 'Transport va qadoqlash sharoiti', val: selectedActForView.transportCondition, expected: 1 },
                    { label: 'Kuzatuv hujjatlari', val: selectedActForView.hasDocumentation, expected: 1 },
                    { label: 'Tuzilishi: Zich, shirali, qarsildoq', val: selectedActForView.structure, expected: 1 },
                    { label: 'Rangi (Och yashildan to\'q yashilgacha)', val: selectedActForView.leafColor, expected: 1 },
                    { label: 'Ta\'mi va hidi (Toza, begona hidsiz)', val: selectedActForView.tasteSmell, expected: 1 },
                    { label: 'Ichki qizarish / Oksidlanish (0 = yo\'q)', val: selectedActForView.internalOxidation, expected: 0 },
                    { label: 'Hasharotlar va zararkunandalar (0 = yo\'q)', val: selectedActForView.insectTraces, expected: 0 },
                    { label: 'Chirish, shilimshiq, kasalliklar (0 = yo\'q)', val: selectedActForView.rotDiseases, expected: 0 },
                    { label: 'Kesim ko\'rinishi (<= 3 sm)', val: selectedActForView.stemCut, expected: 1 },
                    { label: 'Zichlik (O\'rtacha zichlik)', val: selectedActForView.density, expected: 1 },
                    { label: 'Qoplama barglar olinganligi', val: selectedActForView.outerLeavesRemoved, expected: 1 },
                    { label: 'Mexanik shikastlanish yo\'qligi', val: selectedActForView.noMechanicalDamage, expected: 1 }
                  ].map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-2 items-center hover:bg-slate-50">
                      <div className="col-span-8 font-medium text-slate-700">{item.label}</div>
                      <div className="col-span-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                            item.val === item.expected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.val} ({item.val === 1 ? 'Ha / 1' : 'Yo\'q / 0'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Диаметр / вес кочана:</span>
                  <span className="font-semibold text-slate-800">{selectedActForView.diameterWeight || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sexga chiqarilgan (kg / sana):</span>
                  <span className="font-semibold text-slate-800">
                    {selectedActForView.shopIssuedKg || '-'} {selectedActForView.shopIssuedDate ? `(${selectedActForView.shopIssuedDate})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nazoratchi:</span>
                  <span className="font-semibold text-slate-800">{selectedActForView.inspectorName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Brak akt raqami:</span>
                  <span className="font-semibold text-red-700">{selectedActForView.rejectionActNumber || 'Mavjud emas'}</span>
                </div>
              </div>

              {selectedActForView.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <div className="font-bold text-[11px] mb-0.5">Izoh:</div>
                  <div>{selectedActForView.notes}</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const act = selectedActForView
                  setSelectedActForView(null)
                  handleOpenEdit(act)
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Tahrirlash
              </button>

              <button
                type="button"
                onClick={() => setSelectedActForView(null)}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
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

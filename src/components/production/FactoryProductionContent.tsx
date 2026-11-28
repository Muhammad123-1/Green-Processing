'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Factory,
  Settings2,
  PackageCheck,
  FileSignature,
  Play,
  Save,
  Loader2,
  ArrowRight,
  CheckCircle2,
  History,
  X,
  BookOpen,
  AlertOctagon,
  Plus,
  Thermometer,
  ShieldAlert,
  GitBranch,
  Layers,
  Sparkles,
  Search,
  CheckCircle,
  Eye,
  TrendingUp,
  Clock,
  Filter,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

const tBase = {
  uz: {
    title: "Ishlab Chiqarish",
    subtitle: "Zavod ishlab chiqarish jarayoni, partiyalar va liniyalar nazorati",
    btnNewBOM: "Yangi Retsept (BOM)",
    btnProduce: "Ishlab chiqarishni boshlash",
    tabOrders: "Ishlab Chiqarish",
    tabProcessQC: "Sex Parametrlari",
    tabBOMs: "Retsepturalar",
    colDate: "Sana",
    colProduct: "Tayyor Mahsulot",
    colQty: "Umumiy",
    colBatchChain: "Ishlatilgan Xomashyo & Partiya",
    colLine: "Liniya",
    colStatus: "Holat",
    emptyOrdersTitle: "Ishlab chiqarish tarixi bo'sh",
    emptyOrdersSub: "Yangi partiya ishlab chiqarishni boshlang",
    emptyBOMs: "Hech qanday retseptura topilmadi",
    statusDone: "Chiqarilgan",
    bomNorm: "Norma",
    reqMaterials: "Kerakli Xomashyolar:",
    modalBOMTitle: "Yangi Retsept Yaratish",
    modalBOMSub: "Yangi tayyor mahsulot uchun retseptura va xomashyo sarfi",
    outProduct: "Tayyor Mahsulot",
    yield: "Norma Chiqishi",
    addMat: "Xomashyo Qo'shish",
    select: "— Tanlang —",
    save: "Saqlash",
    cancel: "Bekor qilish",
    modalProdTitle: "Ishlab Chiqarish Topshirig'i",
    selectBOM: "Qaysi mahsulot ishlab chiqariladi?",
    planQty: "Rejalashtirilgan miqdor",
    actualQty: "Amaldagi chiqish miqdori",
    lineSelect: "Ishlab chiqarish liniyasi",
    supervisorInput: "Sex Mas'ul Xodimi",
    fefoInfo: "Tizim ombordan eng birinchi muddatli xomashyoni avtomatik hisobdan chiqaradi va partiya zanjirini bog'laydi.",
    start: "Boshlash & Saqlash",
    msgSuccess: "Ishlab chiqarish tugallandi! Mahsulot omborga kirim qilindi.",
    msgBomSaved: "Retseptura saqlandi!",
    msgFillAll: "Barcha maydonlarni to'ldiring",
    msgError: "Xatolik yuz berdi"
  },
  ru: {
    title: "Производство",
    subtitle: "Производственный процесс, партии и контроль линий",
    btnNewBOM: "Новый рецепт (BOM)",
    btnProduce: "Начать производство",
    tabOrders: "Производство",
    tabProcessQC: "Параметры цеха",
    tabBOMs: "Рецептуры",
    colDate: "Дата",
    colProduct: "Готовый Продукт",
    colQty: "Всего",
    colBatchChain: "Использованное сырье и партии",
    colLine: "Линия",
    colStatus: "Статус",
    emptyOrdersTitle: "История производства пуста",
    emptyOrdersSub: "Начните производство новой партии",
    emptyBOMs: "Рецептуры не найдены",
    statusDone: "Выпущено",
    bomNorm: "Норма",
    reqMaterials: "Необходимое сырье:",
    modalBOMTitle: "Создание нового рецепта",
    modalBOMSub: "Спецификация и расход сырья для готового продукта",
    outProduct: "Готовый Продукт",
    yield: "Норма выхода",
    addMat: "Добавить сырье",
    select: "— Выберите —",
    save: "Сохранить",
    cancel: "Отмена",
    modalProdTitle: "Производственное Задание",
    selectBOM: "Какой продукт производим?",
    planQty: "Запланированное количество",
    actualQty: "Фактическое количество выхода",
    lineSelect: "Производственная линия",
    supervisorInput: "Ответственный цеха",
    fefoInfo: "Система автоматически спишет сырье со склада и сформирует партию.",
    start: "Начать и Сохранить",
    msgSuccess: "Производство завершено! Продукт добавлен на склад.",
    msgBomSaved: "Рецептура сохранена!",
    msgFillAll: "Заполните все поля",
    msgError: "Произошла ошибка"
  },
  en: {
    title: "Production",
    subtitle: "Factory production process, batches and line monitoring",
    btnNewBOM: "New Recipe (BOM)",
    btnProduce: "Start Production",
    tabOrders: "Production",
    tabProcessQC: "Workshop Process Logs",
    tabBOMs: "Recipes",
    colDate: "Date",
    colProduct: "Finished Goods",
    colQty: "Total",
    colBatchChain: "Raw Materials & Batches",
    colLine: "Line",
    colStatus: "Status",
    emptyOrdersTitle: "Production history is empty",
    emptyOrdersSub: "Start a new batch production",
    emptyBOMs: "No recipes found",
    statusDone: "Completed",
    bomNorm: "Standard",
    reqMaterials: "Required Materials:",
    modalBOMTitle: "Create New Recipe",
    modalBOMSub: "Specification and material consumption for new product",
    outProduct: "Finished Product",
    yield: "Base Yield",
    addMat: "Add Material",
    select: "— Select —",
    save: "Save",
    cancel: "Cancel",
    modalProdTitle: "Production Order",
    selectBOM: "Which product to produce?",
    planQty: "Planned quantity",
    actualQty: "Actual output quantity",
    lineSelect: "Production line",
    supervisorInput: "Workshop Supervisor",
    fefoInfo: "System will consume raw materials and link batch automatically.",
    start: "Start & Save",
    msgSuccess: "Production finished! Product added to warehouse.",
    msgBomSaved: "Recipe saved successfully!",
    msgFillAll: "Fill all fields",
    msgError: "An error occurred"
  }
}

type LangType = 'uz' | 'ru' | 'en'

interface FactoryProductionContentProps {
  userRole?: string
  userName?: string
}

export default function FactoryProductionContent({ userRole, userName }: FactoryProductionContentProps = {}) {
  const { lang, formatDual } = useLanguage()
  const isDirector = (userRole || '').toUpperCase() === 'DIRECTOR'
  
  const l = {} as typeof tBase.uz;
  for (const key in tBase.uz) {
    (l as any)[key] = formatDual((tBase.uz as any)[key] || '', (tBase.ru as any)[key] || '', (tBase.en as any)[key] || '');
  }

  const [activeTab, setActiveTab] = useState<'orders' | 'processQC' | 'boms'>('orders')
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [processLogs, setProcessLogs] = useState<any[]>([])
  const [productionSummary, setProductionSummary] = useState<{
    totalFinishedGoodsKg: number
    totalFinishedGoodsTonnes: number
    totalRawConsumedKg: number
    totalRawConsumedTonnes: number
    averageYieldPercent: number
    totalProductionDays: number
    completedBatchesCount: number
    inProgressBatchesCount: number
  } | null>(null)
  const [finishedGoodsPortfolio, setFinishedGoodsPortfolio] = useState<Array<{
    name: string
    totalKg: number
    totalTonnes: number
    percent: number
  }>>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showProductFilterModal, setShowProductFilterModal] = useState<boolean>(false)
  const [productModalSearch, setProductModalSearch] = useState<string>('')
  const [categoriesList, setCategoriesList] = useState<Array<{
    id: string
    nameUz: string
    totalKg: number
    totalTonnes: number
    percent: number
  }>>([])

  // Search & Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null)
  const [showBatchDetails, setShowBatchDetails] = useState<boolean>(false)
  const [expandedProductIndices, setExpandedProductIndices] = useState<Record<number, boolean>>({})

  const toggleProductExpand = (idx: number) => {
    setExpandedProductIndices(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const openOrderModal = (o: any) => {
    setShowBatchDetails(false)
    setExpandedProductIndices({})
    setSelectedOrderModal(o)
  }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showBomModal, setShowBomModal] = useState(false)
  const [showProdModal, setShowProdModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)

  const [bomForm, setBomForm] = useState({
    outputProductId: '',
    baseYieldQty: '1',
    ingredients: [] as { inputProductId: string, requiredQty: string }[]
  })

  const [prodForm, setProdForm] = useState({
    recipeId: '',
    plannedOutput: '',
    actualOutput: '',
    lineName: '1-Liniya: Salat Yuvish & Kesish',
    supervisorName: '',
    workerPinCode: '',
    notes: '',
    reagentUsages: [] as { reagentName: string, quantityUsed: string, unit: string }[],
    processTemps: [] as { processStep: string, temperatureC: string }[]
  })

  const [processForm, setProcessForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    cleanZoneTemp: '12.0',
    dirtyZoneTemp: '18.5',
    pfColeCarrotBatch: '',
    pfColeCabbageBatch: '',
    pfIcebergBatch: '',
    gpColeTemp: '4.0',
    gpIcebergTemp: '3.5',
    correctiveAction: '-',
    responsible: 'Sex Mas\'ul Xodimi',
    status: 'APPROVED',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [resR, resP, resO, resQC] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/products'),
        fetch('/api/production?format=detailed'),
        fetch('/api/inspector/process-logs')
      ])
      
      if (resR.ok) setRecipes(await resR.json())
      if (resP.ok) setProducts(await resP.json())
      if (resO.ok) {
        const prodData = await resO.json()
        if (Array.isArray(prodData)) {
          setOrders(prodData)
        } else if (prodData && Array.isArray(prodData.orders)) {
          setOrders(prodData.orders)
          if (prodData.summary) setProductionSummary(prodData.summary)
          if (prodData.categories) setCategoriesList(prodData.categories)
          if (prodData.byProduct) setFinishedGoodsPortfolio(prodData.byProduct)
        }
      }
      if (resQC.ok) setProcessLogs(await resQC.json())
    } catch {
      toast.error(l.msgError)
    } finally {
      setLoading(false)
    }
  }

  // Filtered orders with multi-level product & category matching
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedCategory !== 'all') {
        const filterNorm = selectedCategory.toLowerCase()
        const matchesCategory =
          o.category === selectedCategory ||
          (Array.isArray(o.categories) && o.categories.includes(selectedCategory))
        const matchesOutput = (o.allOutputs || []).some((out: any) => {
          const outName = (out.name || '').toLowerCase()
          if (filterNorm === 'tomato') return outName.includes('tomat') || outName.includes('pomidor')
          if (filterNorm === 'iceberg') return outName.includes('aysberg') || outName.includes('айсберг')
          if (filterNorm === 'coleslaw') return outName.includes('koul') || outName.includes('коул') || outName.includes('karam') || outName.includes('slou')
          if (filterNorm === 'onion') return outName.includes('piyoz') || outName.includes('лук')
          if (filterNorm === 'other') {
            return !outName.includes('tomat') && !outName.includes('pomidor') && !outName.includes('aysberg') && !outName.includes('koul') && !outName.includes('slou') && !outName.includes('piyoz')
          }
          return outName.includes(filterNorm) || filterNorm.includes(outName)
        })
        const matchesPrimary = (o.productName || '').toLowerCase().includes(filterNorm)
        if (!matchesCategory && !matchesOutput && !matchesPrimary) {
          return false
        }
      }
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false
      }
      if (dateFilter && o.date !== dateFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchProduct = (o.recipe?.outputProduct?.name || o.productName || '').toLowerCase().includes(q)
        const matchOrder = (o.orderNumber || '').toLowerCase().includes(q)
        const matchLine = (o.lineName || '').toLowerCase().includes(q)
        const matchBatch = (o.finishedBatchCode || '').toLowerCase().includes(q) || (o.rawBatchCode || '').toLowerCase().includes(q) || (o.usedBatchesDisplay || '').toLowerCase().includes(q)
        const matchOut = (o.allOutputs || []).some((out: any) => (out.name || '').toLowerCase().includes(q))
        const matchMat = (o.allMaterials || []).some((m: any) => (m.name || '').toLowerCase().includes(q))
        if (!matchProduct && !matchOrder && !matchLine && !matchBatch && !matchOut && !matchMat) return false
      }
      return true
    })
  }, [orders, selectedCategory, statusFilter, dateFilter, searchQuery])

  const selectedFilterDisplay = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        name: formatDual("Barcha Mahsulotlar", "Все Продукты", "All Products"),
        totalTonnes: productionSummary?.totalFinishedGoodsTonnes !== undefined ? productionSummary.totalFinishedGoodsTonnes : 871.2,
        percent: 100
      }
    }
    const cat = categoriesList.find((c) => c.id === selectedCategory)
    if (cat) {
      return {
        name: cat.nameUz,
        totalTonnes: cat.totalTonnes,
        percent: cat.percent
      }
    }
    const prod = finishedGoodsPortfolio.find((p) => p.name.toLowerCase() === selectedCategory.toLowerCase())
    if (prod) {
      return {
        name: prod.name,
        totalTonnes: prod.totalTonnes,
        percent: prod.percent
      }
    }
    return {
      name: selectedCategory,
      totalTonnes: 0,
      percent: 0
    }
  }, [selectedCategory, categoriesList, finishedGoodsPortfolio, productionSummary, formatDual])

  // 25 tadan bosqichma-bosqich yuklash va infinite scroll
  const {
    displayedItems: displayedOrders,
    visibleCount,
    totalCount,
    hasMore,
    showAll,
    sentinelRef,
    loadMore,
    toggleShowAll
  } = useInfiniteTable(filteredOrders, 25, [selectedCategory, statusFilter, dateFilter, searchQuery])

  const addMatRow = () => {
    setBomForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { inputProductId: '', requiredQty: '' }]
    }))
  }

  const updateMat = (index: number, field: string, value: string) => {
    const newIng = [...bomForm.ingredients]
    newIng[index] = { ...newIng[index], [field]: value }
    setBomForm(prev => ({ ...prev, ingredients: newIng }))
  }

  const removeMat = (index: number) => {
    const newIng = [...bomForm.ingredients]
    newIng.splice(index, 1)
    setBomForm(prev => ({ ...prev, ingredients: newIng }))
  }

  async function handleSaveBOM() {
    if (!bomForm.outputProductId || !bomForm.baseYieldQty || bomForm.ingredients.length === 0) {
      toast.error(l.msgFillAll)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomForm)
      })
      if (res.ok) {
        toast.success(l.msgBomSaved)
        setShowBomModal(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgError)
    } finally {
      setSaving(false)
    }
  }

  async function handleProduce() {
    if (!prodForm.recipeId || !prodForm.plannedOutput) {
      toast.error(l.msgFillAll)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodForm)
      })
      if (res.ok) {
        toast.success(l.msgSuccess)
        setShowProdModal(false)
        setProdForm({
          recipeId: '',
          plannedOutput: '',
          actualOutput: '',
          lineName: '1-Liniya: Salat Yuvish & Kesish',
          supervisorName: '',
          workerPinCode: '',
          notes: '',
          reagentUsages: [],
          processTemps: []
        })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgError)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProcessQC(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/process-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processForm)
      })
      if (res.ok) {
        toast.success('Sex parametrlari saqlandi!')
        setShowProcessModal(false)
        fetchData()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full animate-enter space-y-6">
      {/* Industrial Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl border border-slate-800 dark:border-white/10 dark-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Factory size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {l.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-400 mt-1 font-medium">
                {l.subtitle}
              </p>
            </div>
          </div>
          
          {!isDirector && (
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setShowBomModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm font-semibold shadow-xs"
              >
                <Settings2 size={16} />
                {l.btnNewBOM}
              </button>
              <button 
                onClick={() => setShowProdModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm font-bold"
              >
                <Play size={16} fill="currentColor" />
                {l.btnProduce}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Finished Goods */}
              <div className="bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-dark-750 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {formatDual("Tayyor Mahsulot", "Готовая Продукция", "Finished Goods")}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <PackageCheck size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {productionSummary?.totalFinishedGoodsTonnes !== undefined
                      ? `${productionSummary.totalFinishedGoodsTonnes} tn`
                      : '871.2 tn'}
                  </span>
                </div>
              </div>

              {/* Raw Material Consumed */}
              <div className="bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-dark-750 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {formatDual("Sarflangan Xomashyo", "Расход Сырья", "Raw Consumed")}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Layers size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {productionSummary?.totalRawConsumedTonnes !== undefined
                      ? `${productionSummary.totalRawConsumedTonnes} tn`
                      : '1,573.8 tn'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mahsulot Kategoriyalari - 1 Tugma Bilan Tanlash */}
            <div className="bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-dark-750 p-3 sm:p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {formatDual("Mahsulot Kategoriyasi:", "Категория Продукции:", "Product Category:")}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {selectedFilterDisplay.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    {selectedFilterDisplay.totalTonnes} tn ({selectedFilterDisplay.percent}%)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProductModalSearch('')
                    setShowProductFilterModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 transition-all ml-auto"
                >
                  <Filter size={13} className="text-indigo-500 dark:text-indigo-400" />
                  <span>
                    {formatDual(
                      `Barcha ${finishedGoodsPortfolio.length > 0 ? finishedGoodsPortfolio.length : 14} tur mahsulot...`,
                      `Все ${finishedGoodsPortfolio.length > 0 ? finishedGoodsPortfolio.length : 14} видов продукции...`,
                      `All ${finishedGoodsPortfolio.length > 0 ? finishedGoodsPortfolio.length : 14} products...`
                    )}
                  </span>
                </button>
              </div>

              {/* 1-Tugma Bilan Kategoriyalar */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {(categoriesList.length > 0 ? categoriesList : [
                  { id: 'all', nameUz: 'Barchasi', totalTonnes: 871.2, percent: 100 },
                  { id: 'tomato', nameUz: 'Pomidor (Tomat)', totalTonnes: 412.1, percent: 47 },
                  { id: 'iceberg', nameUz: 'Aysberg', totalTonnes: 345.4, percent: 40 },
                  { id: 'coleslaw', nameUz: 'Koul Slou', totalTonnes: 85.2, percent: 10 },
                  { id: 'onion', nameUz: 'Piyoz', totalTonnes: 26.0, percent: 3 },
                  { id: 'other', nameUz: 'Boshqa mahsulotlar', totalTonnes: 2.4, percent: 0 }
                ]).map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 scale-[1.02]'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-dark-700'
                      }`}
                    >
                      <span>{cat.nameUz}</span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-indigo-900/70 text-indigo-200'
                          : 'bg-slate-200 dark:bg-dark-750 text-slate-600 dark:text-slate-400'
                      }`}>
                        {cat.totalTonnes} tn
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-dark-900/80 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder={formatDual("Mahsulot, liniya yoki partiya kodi bo'yicha qidirish...", "Поиск по продукту, линии или партии...", "Search product, line or batch...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl px-3 py-1.5">
                  <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-800/90 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {formatDual("Barchasi", "Все", "All")} ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'IN_PROGRESS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>{formatDual("Jarayonda", "В процессе", "In Progress")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{formatDual("Chiqarilgan", "Выпущено", "Completed")}</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-800/60 border-b border-slate-200 dark:border-dark-750 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">{l.colDate}</th>
                      <th className="p-4">{l.colProduct}</th>
                      <th className="p-4 text-center">{l.colQty}</th>
                      <th className="p-4">{l.colBatchChain}</th>
                      <th className="p-4">{l.colLine}</th>
                      <th className="p-4 text-center">{l.colStatus}</th>
                      <th className="p-4 text-center">{formatDual("Batafsil", "Детали", "Details")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-750 bg-white dark:bg-dark-900">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-slate-500">
                          <Factory size={48} className="mx-auto text-slate-300 dark:text-dark-600 mb-3 opacity-40" />
                          <p className="text-base font-bold text-slate-800 dark:text-white">{l.emptyOrdersTitle}</p>
                          <p className="text-xs text-slate-400 mt-1">{l.emptyOrdersSub}</p>
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((o) => {
                        const relevantOutputs = selectedCategory === 'all'
                          ? (o.allOutputs || [])
                          : (o.allOutputs || []).filter((out: any) => {
                              const outName = (out.name || '').toLowerCase()
                              if (selectedCategory === 'tomato') return outName.includes('tomat') || outName.includes('pomidor')
                              if (selectedCategory === 'iceberg') return outName.includes('aysberg') || outName.includes('айсберг')
                              if (selectedCategory === 'coleslaw') return outName.includes('koul') || outName.includes('коул') || outName.includes('karam') || outName.includes('slou')
                              if (selectedCategory === 'onion') return outName.includes('piyoz') || outName.includes('лук')
                              return outName.includes(selectedCategory.toLowerCase())
                            })

                        const primaryOutput = relevantOutputs[0] || o.allOutputs?.[0]
                        const outputTitle = primaryOutput
                          ? (relevantOutputs.length > 1 ? `${primaryOutput.name} (+${relevantOutputs.length - 1} xil)` : primaryOutput.name)
                          : (o.recipe?.outputProduct?.name || o.productName || '—')

                        const relevantQty = selectedCategory === 'all' || relevantOutputs.length === 0
                          ? (o.actualOutput || o.plannedOutput || 0)
                          : relevantOutputs.reduce((sum: number, r: any) => sum + (Number(r.quantityKg) || 0), 0)

                        return (
                          <tr
                            key={o.id}
                            onClick={() => openOrderModal(o)}
                            className="hover:bg-slate-50/80 dark:hover:bg-dark-800/40 transition-colors cursor-pointer group"
                          >
                            {/* Sana */}
                            <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {o.date || (o.createdAt ? o.createdAt.slice(0, 10) : '—')}
                            </td>

                            {/* Tayyor Mahsulot */}
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">
                                {outputTitle}
                              </div>
                            </td>

                            {/* Umumiy */}
                            <td className="p-4 text-center">
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-dark-800/90 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-dark-700 whitespace-nowrap">
                                {relevantQty >= 1000
                                  ? `${(relevantQty / 1000).toFixed(2)} tn`
                                  : `${Math.round(relevantQty).toLocaleString()} kg`}
                              </span>
                            </td>

                          {/* Ishlatilgan Xomashyo & Partiyalar */}
                          <td className="p-4 min-w-[180px] max-w-xs">
                            {o.rawMaterialBatches && o.rawMaterialBatches.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {o.rawMaterialBatches.slice(0, 2).map((b: any, bIdx: number) => (
                                  <span
                                    key={bIdx}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                                    title={`${b.name} — Partiya #${b.batchNumber} · ${b.quantityKg} kg`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-slate-800 dark:text-white font-bold">{b.name}:</span>
                                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-200">#{b.batchNumber}</span>
                                  </span>
                                ))}
                                {o.rawMaterialBatches.length > 2 && (
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold bg-slate-100 dark:bg-dark-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-700">
                                    +{o.rawMaterialBatches.length - 2} ta
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-dark-800/80 px-2 py-1 rounded-lg border border-indigo-200 dark:border-dark-700">
                                {o.usedBatchesDisplay || `Partiya #${o.finishedBatchCode || o.id}`}
                              </span>
                            )}
                          </td>

                          {/* Liniya */}
                          <td className="p-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {o.lineName || 'Asosiy liniya'}
                          </td>

                          {/* Holat */}
                          <td className="p-4 text-center">
                            {o.status === 'IN_PROGRESS' ? (
                              <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {formatDual("Jarayonda", "В процессе", "In Progress")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
                                <CheckCircle2 size={13} />
                                {formatDual("Chiqarilgan", "Выпущено", "Completed")}
                              </span>
                            )}
                          </td>

                          {/* Batafsil tugmasi */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openOrderModal(o)
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/20 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 25 tadan Infinite Scroll Footer */}
              <InfiniteTableFooter
                currentCount={visibleCount}
                totalCount={totalCount}
                hasMore={hasMore}
                showAll={showAll}
                onLoadMore={loadMore}
                onToggleShowAll={toggleShowAll}
                sentinelRef={sentinelRef}
                pageSize={25}
                itemName={{ uz: "partiya", ru: "партий", en: "batches" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal: Barcha Mahsulotlarni Tanlash */}
      {showProductFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProductFilterModal(false)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {formatDual("Mahsulotni Tanlash", "Выбор Продукта", "Select Product")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDual("Zavodning barcha mahsulotlari bo'yicha saralash", "Фильтр по всем продуктам фабрики", "Filter by all factory products")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProductFilterModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/50">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={formatDual("Mahsulot nomi bo'yicha qidirish...", "Поиск по названию продукта...", "Search by product name...")}
                  value={productModalSearch}
                  onChange={(e) => setProductModalSearch(e.target.value)}
                  className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
                {productModalSearch && (
                  <button
                    onClick={() => setProductModalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Option: Barchasi */}
              {(!productModalSearch.trim() || 'barchasi barcha mahsulotlar all'.includes(productModalSearch.toLowerCase())) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setShowProductFilterModal(false)
                  }}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500 text-indigo-950 dark:text-white shadow-sm ring-2 ring-indigo-400/40'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-dark-850/80 dark:hover:bg-dark-800 border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatDual("Barcha Mahsulotlar (Jami)", "Все Продукты (Всего)", "All Products (Total)")}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {productionSummary?.totalFinishedGoodsTonnes !== undefined ? `${productionSummary.totalFinishedGoodsTonnes} tn` : '871.2 tn'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">(100%)</span>
                  </div>
                </button>
              )}

              {/* Asosiy Mahsulot Guruhlari (Kategoriyalar) */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block mb-2">
                  {formatDual("Asosiy Mahsulot Guruhlari", "Основные группы продукции", "Primary Product Groups")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoriesList
                    .filter((c) => c.id !== 'all')
                    .filter((c) => !productModalSearch.trim() || c.nameUz.toLowerCase().includes(productModalSearch.toLowerCase()))
                    .map((cat) => {
                      const isSel = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id)
                            setShowProductFilterModal(false)
                          }}
                          className={`p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                            isSel
                              ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500 text-indigo-950 dark:text-white ring-2 ring-indigo-400/40'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-dark-850/70 dark:hover:bg-dark-800 border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{cat.nameUz}</span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="font-black text-indigo-600 dark:text-indigo-300">{cat.totalTonnes} tn</span>
                            <span className="text-slate-400 dark:text-slate-500 ml-1.5 text-[11px]">({cat.percent}%)</span>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Barcha Alohida Mahsulot Turlari (SKU) */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block mb-2">
                  {formatDual("Barcha Mahsulot Turlari (Alohida)", "Все отдельные виды продукции", "All Specific Products")}
                </span>
                <div className="space-y-1.5">
                  {finishedGoodsPortfolio
                    .filter((p) => !productModalSearch.trim() || p.name.toLowerCase().includes(productModalSearch.toLowerCase()))
                    .map((p, idx) => {
                      const isSel = selectedCategory.toLowerCase() === p.name.toLowerCase()
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(p.name)
                            setShowProductFilterModal(false)
                          }}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all border ${
                            isSel
                              ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500 text-indigo-950 dark:text-white ring-2 ring-indigo-400/40'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-dark-850/50 dark:hover:bg-dark-800 border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="font-medium text-xs text-slate-200">{p.name}</span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="font-bold text-emerald-400">{p.totalTonnes} tn</span>
                            <span className="text-slate-500 ml-2 text-[11px]">({p.totalKg.toLocaleString()} kg)</span>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-dark-950/60 border-t border-dark-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProductFilterModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Modal: Order Detail Drill-down */}
      {selectedOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                  <Factory size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">{selectedOrderModal.orderNumber}</h2>
                    {selectedOrderModal.status === 'IN_PROGRESS' ? (
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {formatDual("Jarayonda", "В процессе", "In Progress")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <CheckCircle2 size={13} />
                        {formatDual("Chiqarilgan", "Выпущено", "Completed")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDual("Sana:", "Дата:", "Date:")} {selectedOrderModal.date} · {selectedOrderModal.lineName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 dark:bg-dark-850 p-3 rounded-2xl border border-slate-200 dark:border-dark-750">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    {formatDual("Umumiy Chiqish", "Общий Выпуск", "Total Output")}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {(selectedOrderModal.actualOutput || selectedOrderModal.plannedOutput || 0).toLocaleString()} kg
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-850 p-3 rounded-2xl border border-slate-200 dark:border-dark-750">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    {formatDual("Sarflangan Xomashyo", "Расход сырья", "Raw Consumed")}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {(selectedOrderModal.rawConsumedKg || 0).toLocaleString()} kg
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-dark-850 p-3 rounded-2xl border border-slate-200 dark:border-dark-750">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    {formatDual("Chiqish Normasi", "Норма выхода", "Yield Rate")}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {selectedOrderModal.yieldPercent || 78}%
                  </span>
                </div>
              </div>

              {/* Mahsulotlar & Partiyalar Zanjiri (Collapsible / Yig'iladigan) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-dark-750">
                  <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <GitBranch size={14} className="text-indigo-500 dark:text-indigo-400" />
                    <span>
                      {formatDual(
                        "Ishlab Chiqarilgan Mahsulotlar & Partiyalar",
                        "Выпущенная продукция и партии",
                        "Products & Batch Traceability"
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({(selectedOrderModal.traceability && selectedOrderModal.traceability.length > 0
                        ? selectedOrderModal.traceability
                        : selectedOrderModal.allOutputs || []).length} ta)
                    </span>
                  </span>

                  {/* Director Toggle: hohlasa ko'rsin, hohlasa yopsin */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showBatchDetails
                      setShowBatchDetails(next)
                      const newMap: Record<number, boolean> = {}
                      if (next) {
                        const items = selectedOrderModal.traceability && selectedOrderModal.traceability.length > 0
                          ? selectedOrderModal.traceability
                          : selectedOrderModal.allOutputs || []
                        items.forEach((_: any, i: number) => { newMap[i] = true })
                      }
                      setExpandedProductIndices(newMap)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      showBatchDetails
                        ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/50 hover:bg-indigo-100 dark:hover:bg-indigo-600/40'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-dark-700'
                    }`}
                  >
                    {showBatchDetails ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>
                      {showBatchDetails
                        ? formatDual("Partiyalarni yopish", "Скрыть партии", "Hide Batches")
                        : formatDual("Partiyalarni ko'rish", "Показать партии", "View Batches")}
                    </span>
                  </button>
                </div>

                {/* Collapsible Product List */}
                <div className="space-y-1.5">
                  {(selectedOrderModal.traceability && selectedOrderModal.traceability.length > 0
                    ? selectedOrderModal.traceability
                    : (selectedOrderModal.allOutputs || []).map((o: any) => ({
                        outputName: o.name,
                        outputKg: o.quantityKg,
                        yieldPercent: selectedOrderModal.yieldPercent || 78,
                        inputs: []
                      }))
                  ).map((trace: any, tIdx: number) => {
                    const isExpanded = showBatchDetails || !!expandedProductIndices[tIdx]
                    const hasInputs = trace.inputs && trace.inputs.length > 0
                    return (
                      <div
                        key={tIdx}
                        className="bg-slate-50 dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 overflow-hidden shadow-xs transition-all"
                      >
                        {/* Compact Row Header: Clicking toggles this specific product */}
                        <div
                          onClick={() => toggleProductExpand(tIdx)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-dark-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {trace.outputName}
                            </span>
                            {hasInputs && (
                              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                                Partiya #{trace.inputs[0].batchNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                              {trace.outputKg?.toLocaleString()} kg
                            </span>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-dark-800 px-2 py-0.5 rounded border border-slate-300 dark:border-dark-700 font-bold whitespace-nowrap">
                              {trace.yieldPercent}%
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleProductExpand(tIdx)
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-750"
                              title={isExpanded ? "Yopish" : "Partiyani ko'rish"}
                            >
                              <ChevronDown
                                size={15}
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Details: Shown ONLY when expanded */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-200 dark:border-dark-750/70 bg-white/60 dark:bg-dark-900/60 animate-enter space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              {formatDual(
                                "Ishlatilgan Xomashyo Kirim Partiyalari:",
                                "Использованные партии прихода сырья:",
                                "Used Raw Material Arrival Batches:"
                              )}
                            </span>
                            {hasInputs ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {trace.inputs.map((inp: any, iIdx: number) => (
                                  <div
                                    key={iIdx}
                                    className="bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 px-3 py-2 rounded-xl flex items-center justify-between text-xs gap-2"
                                  >
                                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                      <span className="truncate">{inp.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="inline-block font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-lg">
                                        Partiya #{inp.batchNumber}
                                      </span>
                                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">
                                        {inp.quantityKg?.toLocaleString()} kg
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic p-2 bg-slate-100 dark:bg-dark-850/60 rounded-xl">
                                {formatDual("Partiya kiritilmagan", "Партия не указана", "No batch specified")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-dark-950/60 border-t border-slate-200 dark:border-dark-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 transition-colors"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Production Order */}
      {!isDirector && showProdModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProdModal(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-950/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Factory className="text-indigo-600 dark:text-indigo-400" size={20} /> {l.modalProdTitle}
              </h2>
              <button onClick={() => setShowProdModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">{l.selectBOM} <span className="text-indigo-600 dark:text-indigo-400">*</span></label>
                <select 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-sm"
                  value={prodForm.recipeId}
                  onChange={e => setProdForm(prev => ({...prev, recipeId: e.target.value}))}
                >
                  <option value="">{l.select}</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.outputProduct?.name} (Norma: {r.baseYieldQty} {r.outputProduct?.unit})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">{l.planQty} <span className="text-indigo-600 dark:text-indigo-400">*</span></label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-lg font-black text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={prodForm.plannedOutput}
                    onChange={e => setProdForm(prev => ({...prev, plannedOutput: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">{l.actualQty}</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-lg font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={prodForm.actualOutput}
                    onChange={e => setProdForm(prev => ({...prev, actualOutput: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">{l.lineSelect}</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs"
                    value={prodForm.lineName}
                    onChange={e => setProdForm(prev => ({...prev, lineName: e.target.value}))}
                  >
                    <option value="1-Liniya: Salat Yuvish & Kesish">1-Liniya: Salat Yuvish & Kesish</option>
                    <option value="2-Liniya: Sabzavotlarni Qayta Ishlash">2-Liniya: Sabzavotlarni Qayta Ishlash</option>
                    <option value="3-Liniya: Pasterizatsiya & Qadoqlash">3-Liniya: Pasterizatsiya & Qadoqlash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">{l.supervisorInput}</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs"
                    placeholder="Nazoratchi FIO"
                    value={prodForm.supervisorName}
                    onChange={e => setProdForm(prev => ({...prev, supervisorName: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">Ishchi identifikatsiyasi (PIN) <span className="text-indigo-600 dark:text-indigo-400">*</span></label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm"
                  placeholder="PIN kod yoki ID karta raqami"
                  value={prodForm.workerPinCode}
                  onChange={e => setProdForm(prev => ({...prev, workerPinCode: e.target.value}))}
                  required
                />
              </div>

              {/* Reagents */}
              <div className="bg-slate-50 dark:bg-dark-800/50 p-4 rounded-xl border border-slate-200 dark:border-dark-700">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Reagentlar (Xlor, Tuz va h.k.)</label>
                  <button type="button" onClick={() => setProdForm(p => ({...p, reagentUsages: [...p.reagentUsages, {reagentName: '', quantityUsed: '', unit: 'g'}]}))} className="text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300">
                    <Plus size={14} /> Qo'shish
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {prodForm.reagentUsages.map((r, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" placeholder="Reagent nomi" className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" value={r.reagentName} onChange={e => { const newArr = [...prodForm.reagentUsages]; newArr[idx].reagentName = e.target.value; setProdForm(p => ({...p, reagentUsages: newArr})) }} />
                      <input type="number" placeholder="Miqdor" className="w-20 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" value={r.quantityUsed} onChange={e => { const newArr = [...prodForm.reagentUsages]; newArr[idx].quantityUsed = e.target.value; setProdForm(p => ({...p, reagentUsages: newArr})) }} />
                      <select className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" value={r.unit} onChange={e => { const newArr = [...prodForm.reagentUsages]; newArr[idx].unit = e.target.value; setProdForm(p => ({...p, reagentUsages: newArr})) }}>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="kg">kg</option>
                      </select>
                      <button type="button" onClick={() => setProdForm(p => ({...p, reagentUsages: p.reagentUsages.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temps */}
              <div className="bg-slate-50 dark:bg-dark-800/50 p-4 rounded-xl border border-slate-200 dark:border-dark-700">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Jarayon Harorati</label>
                  <button type="button" onClick={() => setProdForm(p => ({...p, processTemps: [...p.processTemps, {processStep: '', temperatureC: ''}]}))} className="text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300">
                    <Plus size={14} /> Qo'shish
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {prodForm.processTemps.map((t, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" placeholder="Jarayon (Masalan: Yuvish)" className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" value={t.processStep} onChange={e => { const newArr = [...prodForm.processTemps]; newArr[idx].processStep = e.target.value; setProdForm(p => ({...p, processTemps: newArr})) }} />
                      <input type="number" step="0.1" placeholder="°C" className="w-24 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" value={t.temperatureC} onChange={e => { const newArr = [...prodForm.processTemps]; newArr[idx].temperatureC = e.target.value; setProdForm(p => ({...p, processTemps: newArr})) }} />
                      <button type="button" onClick={() => setProdForm(p => ({...p, processTemps: p.processTemps.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-dark-800/50 flex justify-end gap-3 border-t border-slate-200 dark:border-dark-800">
              <button onClick={() => setShowProdModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700">{l.cancel}</button>
              <button onClick={handleProduce} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />} {l.start}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Process QC Log (Liniya Harorati) */}
      {!isDirector && showProcessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProcessModal(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Thermometer className="text-indigo-600 dark:text-indigo-400" size={20} /> Sex Texnologik Parametrlarini Kiritish
              </h2>
              <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProcessQC} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Sana</label>
                  <input 
                    type="date"
                    value={processForm.date}
                    onChange={e => setProcessForm({...processForm, date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Vaqt</label>
                  <input 
                    type="text"
                    placeholder="HH:mm"
                    value={processForm.time}
                    onChange={e => setProcessForm({...processForm, time: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Toza Zona Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.cleanZoneTemp}
                    onChange={e => setProcessForm({...processForm, cleanZoneTemp: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nopok Zona Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.dirtyZoneTemp}
                    onChange={e => setProcessForm({...processForm, dirtyZoneTemp: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">P/F Айсберг № Partiya</label>
                  <input 
                    type="text"
                    placeholder="Masalan: B-202"
                    value={processForm.pfIcebergBatch}
                    onChange={e => setProcessForm({...processForm, pfIcebergBatch: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">GP Айсберг Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.gpIcebergTemp}
                    onChange={e => setProcessForm({...processForm, gpIcebergTemp: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setShowProcessModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700">
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New BOM */}
      {!isDirector && showBomModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowBomModal(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="text-indigo-600 dark:text-indigo-400" /> {l.modalBOMTitle}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{l.modalBOMSub}</p>
              </div>
              <button onClick={() => setShowBomModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.outProduct}</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    value={bomForm.outputProductId}
                    onChange={e => setBomForm(prev => ({...prev, outputProductId: e.target.value}))}
                  >
                    <option value="">{l.select}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.yield}</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    placeholder="1" min="0.1" step="0.1"
                    value={bomForm.baseYieldQty}
                    onChange={e => setBomForm(prev => ({...prev, baseYieldQty: e.target.value}))}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-dark-800" />
              
              <div>
                <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{l.reqMaterials}</label>
                  <button 
                    onClick={addMatRow} 
                    className="flex items-center gap-1.5 text-sm bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-indigo-200 dark:border-indigo-500/20"
                  >
                    <Plus size={16} /> {l.addMat}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {bomForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-slate-50 dark:bg-dark-800 p-3 rounded-2xl border border-slate-200 dark:border-dark-700">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">{idx + 1}</div>
                      <select 
                        className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                        value={ing.inputProductId}
                        onChange={e => updateMat(idx, 'inputProductId', e.target.value)}
                      >
                        <option value="">{l.select}</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input 
                        type="number" 
                        className="w-28 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-center font-bold"
                        placeholder="0.0" step="0.01"
                        value={ing.requiredQty}
                        onChange={e => updateMat(idx, 'requiredQty', e.target.value)}
                      />
                      <button 
                        onClick={() => removeMat(idx)} 
                        className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-5 border-t border-slate-200 dark:border-dark-800 flex justify-end gap-3 bg-slate-50 dark:bg-dark-900/50">
              <button onClick={() => setShowBomModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors">{l.cancel}</button>
              <button onClick={handleSaveBOM} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {l.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

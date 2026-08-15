'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  Thermometer,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  Layers,
  Scale,
  Send,
  Building2,
  X,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Omborxona (WMS)",
    subtitle: "Xomashyolar qoldig'i, FEFO nazorati, Sklad chiqimi (Two-Way Handshake) va Harorat jurnali",
    tabStock: "Xomashyolar Qoldig'i (FEFO)",
    tabTransfers: "Sklad Chiqimi & Transfer (Handshake)",
    tabTemp: "Harorat Nazorati Jurnali (Ombor)",
    totalItems: "Jami xomashyolar",
    criticalItems: "Kritik qoldiq (Qizil)",
    warningItems: "Kamaygan (Sariq)",
    searchPlaceholder: "Mahsulot nomi yoki kodi bo'yicha qidiruv...",
    filterAll: "Barchasi",
    filterOk: "Yetarli",
    colProduct: "Mahsulot",
    colCode: "Kod / Kategoriya",
    colMin: "Min. Qoldiq",
    colCurrent: "Joriy Qoldiq",
    colBatches: "Partiyalar (FEFO)",
    colStatus: "Status",
    statusCritical: "Kritik",
    statusWarning: "Kamaygan",
    statusOk: "Yetarli",
    empty: "Hech narsa topilmadi",
    noBatches: "Partiyalar yo'q",
    moreBatches: "+ yana {n} ta partiya",
    errorLoad: "Ombor ma'lumotlarini yuklashda xatolik yuz berdi",
    networkError: "Tarmoq xatosi",
    addTemp: "Yangi harorat yozuvi",
    exportExcel: "Excel (.xlsx) yuklab olish",
    tempDate: "Sana",
    tempTime: "Vaqt (M: 8-00, 17-00)",
    tempIceberg: "Салат Айсберг (°C)",
    tempOnion: "Лук белый (°C)",
    tempTomato: "Томаты (°C)",
    tempCarrot: "Морковь (°C)",
    tempCabbage: "Капуста белокоч. (°C)",
    tempDeviation: "Отклонения / Chiqish",
    tempAction: "Корректирующие действия",
    tempResp: "Ответственный (ФИО)",
    save: "Saqlash",
    cancel: "Bekor qilish"
  },
  ru: {
    title: "Склад (WMS)",
    subtitle: "Остатки сырья, контроль FEFO, отпуск в кухню/заготовку (Handshake) и Журнал температурного режима",
    tabStock: "Остатки сырья (FEFO)",
    tabTransfers: "Отпуск сырья & Перемещения (Handshake)",
    tabTemp: "Журнал температурного режима (Склад)",
    totalItems: "Всего позиций",
    criticalItems: "Критично (Красный)",
    warningItems: "Мало (Желтый)",
    searchPlaceholder: "Поиск по названию или коду...",
    filterAll: "Все",
    filterOk: "Достаточно",
    colProduct: "Продукт",
    colCode: "Код / Категория",
    colMin: "Мин. Запас",
    colCurrent: "Текущий Запас",
    colBatches: "Партии (FEFO)",
    colStatus: "Статус",
    statusCritical: "Критично",
    statusWarning: "Мало",
    statusOk: "В норме",
    empty: "Ничего не найдено",
    noBatches: "Нет партий",
    moreBatches: "+ еще {n} партий",
    errorLoad: "Ошибка при загрузке данных склада",
    networkError: "Ошибка сети",
    addTemp: "Добавить запись температуры",
    exportExcel: "Экспорт в Excel (.xlsx)",
    tempDate: "Дата",
    tempTime: "Время (например: 8-00, 17-00)",
    tempIceberg: "Салат Айсберг (°C)",
    tempOnion: "Лук белый (°C)",
    tempTomato: "Томаты (°C)",
    tempCarrot: "Морковь (°C)",
    tempCabbage: "Капуста белокоч. (°C)",
    tempDeviation: "Отклонения / Выход из нормы",
    tempAction: "Корректирующие действия",
    tempResp: "Ответственный (ФИО)",
    save: "Сохранить",
    cancel: "Отмена"
  },
  en: {
    title: "Warehouse (WMS)",
    subtitle: "Raw material stock, FEFO tracking, Warehouse Dispatches, and Temperature Log",
    tabStock: "Stock Inventory (FEFO)",
    tabTransfers: "Stock Dispatches (Two-Way Handshake)",
    tabTemp: "Temperature Log (Warehouse)",
    totalItems: "Total Items",
    criticalItems: "Critical Stock (Red)",
    warningItems: "Low Stock (Yellow)",
    searchPlaceholder: "Search by product name or code...",
    filterAll: "All",
    filterOk: "Sufficient",
    colProduct: "Product",
    colCode: "Code / Category",
    colMin: "Min Stock",
    colCurrent: "Current Stock",
    colBatches: "Batches (FEFO)",
    colStatus: "Status",
    statusCritical: "Critical",
    statusWarning: "Low",
    statusOk: "Sufficient",
    empty: "Nothing found",
    noBatches: "No batches",
    moreBatches: "+ {n} more batches",
    errorLoad: "Error loading warehouse data",
    networkError: "Network error",
    addTemp: "Add Temperature Log",
    exportExcel: "Export to Excel (.xlsx)",
    tempDate: "Date",
    tempTime: "Time (e.g. 8-00, 17-00)",
    tempIceberg: "Iceberg Salad (°C)",
    tempOnion: "White Onion (°C)",
    tempTomato: "Tomatoes (°C)",
    tempCarrot: "Carrots (°C)",
    tempCabbage: "Cabbage (°C)",
    tempDeviation: "Deviation",
    tempAction: "Corrective Actions",
    tempResp: "Responsible (Full Name)",
    save: "Save",
    cancel: "Cancel"
  }
}

type LangType = 'uz' | 'ru' | 'en'

type InventoryBatch = {
  id: number
  batchNumber: string
  quantity: number
  receivedAt: string
  expirationDate: string | null
}

type ProductInventory = {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  minStockLevel: number
  totalQuantity: number
  status: 'red' | 'yellow' | 'green'
  batches: InventoryBatch[]
}

interface TemperatureLog {
  id: number
  date: string
  time: string
  icebergTemp: number | null
  onionTemp: number | null
  tomatoTemp: number | null
  carrotTemp: number | null
  cabbageTemp: number | null
  deviation: string
  correctiveAction: string | null
  responsible: string
  notes?: string | null
}

export default function WarehouseContent() {
  const { lang } = useLanguage()
  const currentLang = (lang || 'uz') as LangType
  const l = tBase[currentLang]

  const [activeTab, setActiveTab] = useState<'inventory' | 'transfers' | 'temperature'>('inventory')

  // Inventory states
  const [inventory, setInventory] = useState<ProductInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')

  // Transfers states (Two-Way Handshake)
  const [transfers, setTransfers] = useState<any[]>([])
  const [transfersLoading, setTransfersLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({
    productId: '',
    batchId: '',
    targetLocation: 'OSHXONA',
    issuedQuantity: '',
    issuedUnit: 'kg',
    notes: ''
  })
  const [savingTransfer, setSavingTransfer] = useState(false)

  // Temperature Log states
  const [tempLogs, setTempLogs] = useState<TemperatureLog[]>([])
  const [tempLoading, setTempLoading] = useState(false)
  const [tempFilterDate, setTempFilterDate] = useState('')
  const [tempSearchQuery, setTempSearchQuery] = useState('')
  const [showTempModal, setShowTempModal] = useState(false)
  const [editingTempId, setEditingTempId] = useState<number | null>(null)
  const [exportingTemp, setExportingTemp] = useState(false)

  const initialTempForm = {
    date: new Date().toISOString().split('T')[0],
    time: '8-00',
    icebergTemp: '',
    onionTemp: '',
    tomatoTemp: '',
    carrotTemp: '',
    cabbageTemp: '',
    deviation: 'Норма',
    correctiveAction: '-',
    responsible: 'Складник'
  }

  const [tempForm, setTempForm] = useState(initialTempForm)

  useEffect(() => {
    fetchInventory()
    fetchTempLogs()
    fetchTransfers()
  }, [])

  async function fetchInventory() {
    try {
      const res = await fetch('/api/warehouse/inventory')
      if (res.ok) {
        const data = await res.json()
        setInventory(data)
      } else {
        toast.error(l.errorLoad)
      }
    } catch {
      toast.error(l.networkError)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTransfers() {
    setTransfersLoading(true)
    try {
      const res = await fetch('/api/transfers')
      if (res.ok) {
        const data = await res.json()
        setTransfers(Array.isArray(data) ? data : [])
      }
    } catch {
      console.error('Fetch transfers error')
    } finally {
      setTransfersLoading(false)
    }
  }

  async function fetchTempLogs(date = tempFilterDate) {
    setTempLoading(true)
    try {
      const url = date ? `/api/warehouse/temperature-logs?date=${date}` : '/api/warehouse/temperature-logs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTempLogs(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTempLoading(false)
    }
  }

  // Create New Dispatch / Transfer
  async function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!transferForm.productId || !transferForm.issuedQuantity || parseFloat(transferForm.issuedQuantity) <= 0) {
      toast.error("Mahsulot va miqdorni to'g'ri kiriting")
      return
    }

    setSavingTransfer(true)
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      })

      if (res.ok) {
        toast.success("Xomashyo chiqimi rasmiylashtirildi! Oshxona/Zagotovkaga yuborildi.")
        setShowTransferModal(false)
        setTransferForm({
          productId: '',
          batchId: '',
          targetLocation: 'OSHXONA',
          issuedQuantity: '',
          issuedUnit: 'kg',
          notes: ''
        })
        fetchInventory()
        fetchTransfers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Chiqim yaratishda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingTransfer(false)
    }
  }

  // Open Quick Dispatch for an Inventory Item
  function handleOpenQuickTransfer(item: ProductInventory) {
    setTransferForm({
      productId: item.id.toString(),
      batchId: item.batches.length > 0 ? item.batches[0].id.toString() : '',
      targetLocation: 'OSHXONA',
      issuedQuantity: '',
      issuedUnit: item.unit || 'kg',
      notes: ''
    })
    setShowTransferModal(true)
  }

  // Handle Excel Download for Warehouse Temp Log
  async function handleDownloadTempExcel() {
    setExportingTemp(true)
    try {
      const res = await fetch('/api/warehouse/export-excel')
      if (!res.ok) throw new Error('Eksport xatosi')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Temperaturniy_rejim_sklad_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(lang === 'ru' ? 'Excel файл успешно скачан' : 'Excel fayl muvaffaqiyatli yuklab olindi')
    } catch (err) {
      console.error(err)
      toast.error(lang === 'ru' ? 'Не удалось скачать Excel' : 'Excel yuklab olishda xatolik yuz berdi')
    } finally {
      setExportingTemp(false)
    }
  }

  // Save / Update Temperature Log
  async function handleSaveTemp(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = '/api/warehouse/temperature-logs'
      const method = editingTempId ? 'PUT' : 'POST'
      const body = editingTempId ? { id: editingTempId, ...tempForm } : tempForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success(editingTempId ? (lang === 'ru' ? 'Запись обновлена' : 'Harorat yozuvi yangilandi') : (lang === 'ru' ? 'Новая запись сохранена' : 'Yangi harorat saqlandi'))
        setShowTempModal(false)
        setEditingTempId(null)
        setTempForm(initialTempForm)
        fetchTempLogs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Server bilan aloqa uzildi')
    }
  }

  // Delete Temperature Log
  async function handleDeleteTemp(id: number) {
    if (!confirm(lang === 'ru' ? 'Удалить эту запись?' : 'Ushbu yozuvni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/warehouse/temperature-logs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись удалена' : 'Yozuv o\'chirildi')
        fetchTempLogs()
      }
    } catch {
      toast.error('O\'chirishda xatolik')
    }
  }

  function openEditTemp(log: TemperatureLog) {
    setEditingTempId(log.id)
    setTempForm({
      date: log.date,
      time: log.time,
      icebergTemp: log.icebergTemp?.toString() || '',
      onionTemp: log.onionTemp?.toString() || '',
      tomatoTemp: log.tomatoTemp?.toString() || '',
      carrotTemp: log.carrotTemp?.toString() || '',
      cabbageTemp: log.cabbageTemp?.toString() || '',
      deviation: log.deviation || 'Норма',
      correctiveAction: log.correctiveAction || '-',
      responsible: log.responsible || 'Складник'
    })
    setShowTempModal(true)
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredTempLogs = tempLogs.filter(log => {
    if (!tempSearchQuery) return true
    const q = tempSearchQuery.toLowerCase()
    return (
      log.date.includes(q) ||
      log.time.includes(q) ||
      (log.deviation && log.deviation.toLowerCase().includes(q)) ||
      (log.responsible && log.responsible.toLowerCase().includes(q)) ||
      (log.correctiveAction && log.correctiveAction.toLowerCase().includes(q))
    )
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTempModal(false)
        setShowTransferModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate top-level stats
  const totalItems = inventory.length
  const criticalItems = inventory.filter(i => i.status === 'red').length
  const warningItems = inventory.filter(i => i.status === 'yellow').length

  return (
    <div className="flex flex-col h-full animate-enter space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-dark-900 to-teal-950 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} />
                {lang === 'ru' ? 'Управление складом (WMS)' : 'Omborxona Boshqaruvi (WMS)'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300 tracking-tight">
              {l.title}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {l.subtitle}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-dark-800/80 p-1.5 rounded-2xl border border-dark-700/80 backdrop-blur-md overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package size={16} />
              <span>{l.tabStock}</span>
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'transfers'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale size={16} />
              <span>{l.tabTransfers}</span>
            </button>
            <button
              onClick={() => setActiveTab('temperature')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'temperature'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Thermometer size={16} />
              <span>{l.tabTemp}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INVENTORY (FEFO / TRAFFIC LIGHT) */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-900 p-6 rounded-3xl border border-dark-700 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{l.totalItems}</p>
                  <h3 className="text-3xl font-black text-white">{totalItems}</h3>
                </div>
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                  <Package size={28} />
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => setStatusFilter(statusFilter === 'red' ? 'all' : 'red')}
              className="bg-gradient-to-br from-red-900/10 to-dark-900 p-6 rounded-3xl border border-red-900/30 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-colors" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-1">{l.criticalItems}</p>
                  <h3 className="text-3xl font-black text-red-500">{criticalItems}</h3>
                </div>
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-inner">
                  <AlertTriangle size={28} />
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => setStatusFilter(statusFilter === 'yellow' ? 'all' : 'yellow')}
              className="bg-gradient-to-br from-yellow-900/10 to-dark-900 p-6 rounded-3xl border border-yellow-900/30 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-colors" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-500 uppercase tracking-wider mb-1">{l.warningItems}</p>
                  <h3 className="text-3xl font-black text-yellow-500">{warningItems}</h3>
                </div>
                <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-400 shadow-inner">
                  <Clock size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={l.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-dark-900 border border-dark-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white shadow-sm"
              />
            </div>
            <div className="flex bg-dark-800/50 p-1.5 rounded-2xl w-max border border-dark-700/50 backdrop-blur-sm">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {l.filterAll}
              </button>
              <button 
                onClick={() => setStatusFilter('red')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-red-400'}`}
              >
                {l.statusCritical}
              </button>
              <button 
                onClick={() => setStatusFilter('yellow')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'yellow' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-slate-400 hover:text-yellow-500'}`}
              >
                {l.statusWarning}
              </button>
              <button 
                onClick={() => setStatusFilter('green')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-emerald-400'}`}
              >
                {l.filterOk}
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-medium">Yuklanmoqda...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Package size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">{l.empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-5">{l.colProduct}</th>
                      <th className="p-5">{l.colCode}</th>
                      <th className="p-5">{l.colMin}</th>
                      <th className="p-5">{l.colCurrent}</th>
                      <th className="p-5">{l.colBatches}</th>
                      <th className="p-5">{l.colStatus}</th>
                      <th className="p-5 text-right">Chiqim Berish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-dark-800/30 transition-colors group">
                        <td className="p-5">
                          <div className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                            {item.name}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-slate-400">{item.code || '-'}</span>
                            <span className="text-xs text-slate-400">{item.category || 'Xomashyo'}</span>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-sm text-slate-300 font-bold">
                          {item.minStockLevel} {item.unit}
                        </td>
                        <td className="p-5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-2xl text-white leading-none">
                              {item.totalQuantity}
                            </span>
                            <span className="text-sm font-bold text-slate-400">{item.unit}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          {item.batches.length === 0 ? (
                            <span className="text-xs text-slate-400 font-medium bg-dark-800 px-2 py-1 rounded-md">{l.noBatches}</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-w-[200px]">
                              {item.batches.slice(0, 3).map((b) => (
                                <div key={b.id} className="flex items-center justify-between bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1 text-xs">
                                  <span className="font-mono font-bold text-slate-400">#{b.batchNumber}</span>
                                  <span className="font-black text-indigo-400 bg-indigo-500/10 px-1.5 rounded">{b.quantity} {item.unit}</span>
                                </div>
                              ))}
                              {item.batches.length > 3 && (
                                <div className="text-xs font-semibold text-indigo-400 text-center mt-0.5">
                                  {l.moreBatches.replace('{n}', (item.batches.length - 3).toString())}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-5">
                          {item.status === 'red' && (
                            <div className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                              <AlertTriangle size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusCritical}</span>
                            </div>
                          )}
                          {item.status === 'yellow' && (
                            <div className="inline-flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                              <Clock size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusWarning}</span>
                            </div>
                          )}
                          {item.status === 'green' && (
                            <div className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                              <CheckCircle size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusOk}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => handleOpenQuickTransfer(item)}
                            disabled={item.totalQuantity <= 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-dark-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Send size={14} />
                            <span>Chiqarish</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSFERS & DISPATCH (TWO-WAY HANDSHAKE) */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-5 rounded-2xl shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Scale className="text-emerald-400" size={22} />
                <span>Sklad Chiqimlari & Two-Way Handshake Nazorati</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Oshxona va Zagotovkaga berilgan mahsulotlar va ularning tortish orqali qabul qilinish holati
              </p>
            </div>

            <button
              onClick={() => {
                setTransferForm({
                  productId: inventory.length > 0 ? inventory[0].id.toString() : '',
                  batchId: '',
                  targetLocation: 'OSHXONA',
                  issuedQuantity: '',
                  issuedUnit: inventory.length > 0 ? inventory[0].unit : 'kg',
                  notes: ''
                })
                setShowTransferModal(true)
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              <Plus size={18} />
              <span>Yangi Chiqim Berish</span>
            </button>
          </div>

          {/* Transfers Table */}
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {transfersLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-medium">Chiqimlar yuklanmoqda...</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Scale size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">Hozircha chiqim transferlari yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Hujjat Raqami & Sana</th>
                      <th className="p-4">Mahsulot</th>
                      <th className="p-4">Qayerga</th>
                      <th className="p-4 text-center">Sklad Bergan</th>
                      <th className="p-4 text-center">Qabul Qilingan (Tortilgan)</th>
                      <th className="p-4 text-center">Farq / Yo'qotish</th>
                      <th className="p-4">Holat / Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-300">
                          <div className="font-bold text-emerald-400">{t.transferNumber}</div>
                          <div className="text-slate-500">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        </td>
                        <td className="p-4 font-bold text-white">
                          {t.product?.name}
                        </td>
                        <td className="p-4 text-slate-300 font-semibold text-xs">
                          {t.targetLocation === 'OSHXONA' ? '🍲 Oshxona' : '🔪 Zagotovka'}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {t.issuedQuantity} {t.issuedUnit}
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {t.receivedQuantity !== null && t.receivedQuantity !== undefined ? (
                            <span className="text-emerald-400">{t.receivedQuantity} {t.issuedUnit}</span>
                          ) : (
                            <span className="text-amber-400 italic text-xs">Kutilmoqda...</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {t.discrepancy && Math.abs(t.discrepancy) > 0 ? (
                            <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              -{t.discrepancy.toFixed(2)} {t.issuedUnit}
                            </span>
                          ) : t.receivedQuantity !== null ? (
                            <span className="text-emerald-400">0.00 (Mos)</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {t.status === 'IN_TRANSIT' && (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Tranzitda (Qabul kutilmoqda)
                            </span>
                          )}
                          {t.status === 'ACCEPTED' && (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              To'liq qabul qilindi
                            </span>
                          )}
                          {t.status === 'DISCREPANCY' && (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Farq aniqlandi
                              </span>
                              {t.discrepancyReason && (
                                <div className="text-slate-400 text-[11px]">{t.discrepancyReason}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPERATURE LOG */}
      {activeTab === 'temperature' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-5 rounded-2xl shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Thermometer className="text-emerald-400" size={22} />
                {lang === 'ru' ? 'Журнал температурного режима' : 'Harorat rejimi jurnali (Omborxona)'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ru' 
                  ? 'Ежедневный замер температур сырья (8:00, 17:00), выявление отклонений и фиксация корректировок' 
                  : 'Xomashyolarning kunlik harorat rejimi (8:00, 17:00), me\'yordan og\'ishlar va ko\'rilgan choralar'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setTempForm(initialTempForm)
                  setEditingTempId(null)
                  setShowTempModal(true)
                }}
                className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
              >
                <Plus size={18} />
                <span>{l.addTemp}</span>
              </button>

              <button
                onClick={handleDownloadTempExcel}
                disabled={exportingTemp}
                className="px-4 py-2.5 rounded-xl border border-dark-600 bg-dark-800 hover:bg-dark-700 text-slate-200 font-medium text-sm flex items-center gap-2 transition-all shadow hover:border-emerald-500/50 disabled:opacity-50"
              >
                {exportingTemp ? (
                  <RefreshCw size={16} className="animate-spin text-emerald-400" />
                ) : (
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                )}
                <span>{exportingTemp ? (lang === 'ru' ? 'Скачивание...' : 'Yuklanmoqda...') : l.exportExcel}</span>
              </button>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {tempLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-medium">Yuklanmoqda...</p>
              </div>
            ) : filteredTempLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Thermometer size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">{l.empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">{l.tempDate}</th>
                      <th className="p-4">{l.tempTime}</th>
                      <th className="p-4 text-center">Айсберг (°C)</th>
                      <th className="p-4 text-center">Лук (°C)</th>
                      <th className="p-4 text-center">Томат (°C)</th>
                      <th className="p-4 text-center">Морковь (°C)</th>
                      <th className="p-4 text-center">Капуста (°C)</th>
                      <th className="p-4">{l.tempDeviation}</th>
                      <th className="p-4">{l.tempResp}</th>
                      <th className="p-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {filteredTempLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-white">{log.date}</td>
                        <td className="p-4 font-semibold text-emerald-400">{log.time}</td>
                        <td className="p-4 text-center font-mono">{log.icebergTemp ?? '-'}</td>
                        <td className="p-4 text-center font-mono">{log.onionTemp ?? '-'}</td>
                        <td className="p-4 text-center font-mono">{log.tomatoTemp ?? '-'}</td>
                        <td className="p-4 text-center font-mono">{log.carrotTemp ?? '-'}</td>
                        <td className="p-4 text-center font-mono">{log.cabbageTemp ?? '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.deviation.includes('ВНИМАНИЕ') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {log.deviation}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 font-medium">{log.responsible}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditTemp(log)} className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 rounded-lg">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteTemp(log.id)} className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-red-400 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE DISPATCH / TRANSFER */}
      {showTransferModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowTransferModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Skladdan Chiqim Berish</h3>
                  <p className="text-xs text-slate-400">Oshxona yoki Zagotovkaga xomashyo o'tkazish</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Mahsulot <span className="text-red-400">*</span>
                </label>
                <select
                  value={transferForm.productId}
                  onChange={(e) => {
                    const prod = inventory.find(p => p.id === parseInt(e.target.value))
                    setTransferForm({
                      ...transferForm,
                      productId: e.target.value,
                      issuedUnit: prod?.unit || 'kg',
                      batchId: prod?.batches.length ? prod.batches[0].id.toString() : ''
                    })
                  }}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Tanlang...</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Mavjud: {p.totalQuantity} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Qayerga <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={transferForm.targetLocation}
                    onChange={(e) => setTransferForm({ ...transferForm, targetLocation: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="OSHXONA">🍲 Oshxona</option>
                    <option value="ZAGOTOVKA">🔪 Zagotovka Sexi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Chiqariladigan Miqdor ({transferForm.issuedUnit}) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 30"
                    value={transferForm.issuedQuantity}
                    onChange={(e) => setTransferForm({ ...transferForm, issuedQuantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Izoh
                </label>
                <input
                  type="text"
                  placeholder="Izoh yozing..."
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingTransfer}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {savingTransfer && <Loader2 size={16} className="animate-spin" />}
                  <span>Chiqimni Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEMPERATURE LOG */}
      {showTempModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowTempModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Thermometer size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingTempId ? (lang === 'ru' ? 'Редактировать запись' : 'Yozuvni tahrirlash') : l.addTemp}
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowTempModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTemp} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">{l.tempDate} *</label>
                  <input
                    type="date"
                    required
                    value={tempForm.date}
                    onChange={(e) => setTempForm({ ...tempForm, date: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">{l.tempTime} *</label>
                  <input
                    type="text"
                    required
                    value={tempForm.time}
                    onChange={(e) => setTempForm({ ...tempForm, time: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Harorat (°C)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{l.tempIceberg}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="3.5"
                      value={tempForm.icebergTemp}
                      onChange={(e) => setTempForm({ ...tempForm, icebergTemp: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{l.tempOnion}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4.0"
                      value={tempForm.onionTemp}
                      onChange={(e) => setTempForm({ ...tempForm, onionTemp: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{l.tempTomato}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="3.8"
                      value={tempForm.tomatoTemp}
                      onChange={(e) => setTempForm({ ...tempForm, tomatoTemp: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{l.tempCarrot}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={tempForm.carrotTemp}
                      onChange={(e) => setTempForm({ ...tempForm, carrotTemp: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{l.tempCabbage}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4.1"
                      value={tempForm.cabbageTemp}
                      onChange={(e) => setTempForm({ ...tempForm, cabbageTemp: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">{l.tempDeviation} *</label>
                  <select
                    value={tempForm.deviation}
                    onChange={(e) => setTempForm({ ...tempForm, deviation: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Норма">Норма (Qoniqarli)</option>
                    <option value="ВНИМАНИЕ: Нарушение">ВНИМАНИЕ: Нарушение (Og'ish bor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">{l.tempResp} *</label>
                  <input
                    type="text"
                    required
                    value={tempForm.responsible}
                    onChange={(e) => setTempForm({ ...tempForm, responsible: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">{l.tempAction}</label>
                <input
                  type="text"
                  placeholder="Masalan: Отрегулирован хладагент yoki -"
                  value={tempForm.correctiveAction || ''}
                  onChange={(e) => setTempForm({ ...tempForm, correctiveAction: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowTempModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  {l.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  {l.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

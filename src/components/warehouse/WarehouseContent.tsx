'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
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
  History,
  QrCode,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  ShoppingCart,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Phone,
  ShieldCheck,
  Boxes,
  Tag,
  ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

const tBase = {
  uz: {
    title: "Omborxona (WMS)",
    subtitle: "Xomashyolar qoldig'i, FEFO nazorati, Sklad chiqimi (Two-Way Handshake) va Harorat jurnali",
    tabStock: "Xomashyolar Qoldig'i (FEFO)",
    tabTransfers: "Sklad Chiqimi & Transfer (Handshake)",
    tabTemp: "Harorat Nazorati Jurnali (Ombor)",
    tabSuppliers: "Ta'minotchilar (Yetkazib Beruvchilar)",
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
    tabSuppliers: "Поставщики сырья (Снабжение)",
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
    tabSuppliers: "Suppliers & Sources",
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
  fefoOrder?: number
  isFefoActive?: boolean
  daysUntilExpiry?: number | null
  arrivalPhotoUrl?: string | null
  arrivalTemperature?: number | null
  supplierBatchNumber?: string | null
  cost?: number | null
  zoneId?: number | null
  zone?: { id: number, name: string } | null
  supplier?: { id: number, name: string } | null
}

type ProductInventory = {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  imageUrl?: string | null
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

type MacroMaterial = {
  key: string
  name: string
  nameUz: string
  category: string
  unit: string
  totalArrivalKg: number
  totalExpenseKg: number
  currentStockKg: number
  minStock: number
  status: 'green' | 'yellow' | 'red'
  arrivalsCount: number
  lastArrivalDate: string
  topSupplier: string
  suppliersCount: number
}

type MacroSupplier = {
  name: string
  totalKg: number
  totalTonnes: number
  deliveriesCount: number
  products: string[]
  lastDeliveryDate: string
  phone: string
  contactPerson: string
  status: string
}

type MacroBatch = {
  id: number
  date: string
  nomenclature: string
  quantity: number
  unit: string
  supplier: string
  batchNumber: string
  category: string
}

type GPItem = {
  name: string
  category?: string
  totalKg: number
  totalTonnes: number
  daysCount: number
  avgPerDayKg?: number
  sharePercent?: number
  lastDate: string
  unit: string
  status?: string
}

type DailyGPLog = {
  date: string
  product: string
  quantityKg: number
  unit: string
}

type MacroStatsData = {
  summary: {
    totalArrivalKg: number
    totalArrivalTonnes: number
    totalExpenseKg: number
    totalExpenseTonnes: number
    currentStockKg: number
    currentStockTonnes: number
    totalArrivalBatches: number
    totalSuppliersCount: number
    totalNomenclaturesCount: number
    totalFinishedGoodsKg: number
    totalFinishedGoodsTonnes: number
    criticalCount: number
    warningCount: number
    sufficientCount: number
  }
  materials: MacroMaterial[]
  batches: MacroBatch[]
  gp: {
    summary: {
      totalKg: number
      totalTonnes: number
      daysCount: number
      itemsCount: number
      avgDailyKg?: number
    }
    items: GPItem[]
    dailyLogs: DailyGPLog[]
  }
  suppliers: MacroSupplier[]
}

export default function WarehouseContent() {
  const { lang, formatDual } = useLanguage()
  
  const l = {} as typeof tBase.uz;
  for (const key in tBase.uz) {
    (l as any)[key] = formatDual((tBase.uz as any)[key] || '', (tBase.ru as any)[key] || '', (tBase.en as any)[key] || '');
  }

  const [activeTab, setActiveTab] = useState<'inventory' | 'movement' | 'gp' | 'transfers' | 'temperature' | 'suppliers'>('inventory')

  // Movement Log states (Журнал регистрации и перемещения основного сырья на производство)
  const [movementLogs, setMovementLogs] = useState<any[]>([])
  const [movementLoading, setMovementLoading] = useState(false)
  const [movementSearch, setMovementSearch] = useState('')
  const [movementDateFilter, setMovementDateFilter] = useState('')
  const [exportingMovement, setExportingMovement] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [editingMovementId, setEditingMovementId] = useState<number | null>(null)
  const [savingMovement, setSavingMovement] = useState(false)
  const initialMovementForm = {
    orderNumber: 1,
    arrivalDate: new Date().toISOString().split('T')[0],
    deliveryTime: '10:00',
    productName: 'САЛАТ АЙЗБЕРГ',
    supplierName: 'КИБРАЙ БАРАКА',
    batchNumber: '1',
    receivedWeightKg: '',
    storageTemp810: '2.0',
    storageTemp1700: '2.0',
    issuedToProduction: '',
    issuedKg: '',
    returnedFromProductionKg: '0',
    endOfDayBalanceKg: '',
    responsiblePerson: '',
    notes: ''
  }
  const [movementForm, setMovementForm] = useState(initialMovementForm)

  // Macro Statistics (Executive & Shop Report aggregated data)
  const [macroData, setMacroData] = useState<MacroStatsData | null>(null)
  const [macroLoading, setMacroLoading] = useState(true)
  const [macroSearch, setMacroSearch] = useState('')
  const [macroCategoryFilter, setMacroCategoryFilter] = useState<'all' | 'raw' | 'packaging' | 'hygiene' | 'chemicals'>('all')
  const [batchSearch, setBatchSearch] = useState('')
  const [gpSearch, setGpSearch] = useState('')
  const [gpCategory, setGpCategory] = useState<string>('all')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [batchesView, setBatchesView] = useState<'prihod' | 'fefo'>('prihod')

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
  const selectedTransferProduct = useMemo(
    () => inventory.find((p) => p.id === parseInt(transferForm.productId)),
    [inventory, transferForm.productId]
  )

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

  const [zones, setZones] = useState<any[]>([])
  const [showZoneModal, setShowZoneModal] = useState<{batchId: number, currentZoneId: number | null} | null>(null)

  // Direct Warehouse Intake (Kirim qilish) states
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [uploadingReceivePhoto, setUploadingReceivePhoto] = useState(false)
  const [receiveLoading, setReceiveLoading] = useState(false)
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string, title: string } | null>(null)

  const initialReceiveForm = {
    isNewProduct: false,
    productId: '',
    newProductName: '',
    category: 'Xomashyo',
    unit: 'kg',
    batchNumber: '',
    quantity: '',
    cost: '',
    receivedAt: new Date().toISOString().split('T')[0],
    expirationDate: '',
    zoneId: '',
    supplierId: '',
    supplierBatchNumber: '',
    arrivalPhotoUrl: '',
    arrivalTemperature: '',
    notes: ''
  }

  const [receiveForm, setReceiveForm] = useState(initialReceiveForm)

  // Order to Supply (Ta'minotga talabnoma / zakaz berish) states
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderingItem, setOrderingItem] = useState<ProductInventory | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)

  const getTomorrowDateStr = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const initialOrderForm = {
    productId: '',
    productName: '',
    supplierId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: getTomorrowDateStr(),
    timeRange: '09:00 - 12:00',
    notes: ''
  }
  const [orderForm, setOrderForm] = useState(initialOrderForm)

  useEffect(() => {
    fetchInventory()
    fetchTempLogs()
    fetchTransfers()
    fetchZones()
    fetchSuppliers()
    fetchMacroStats()
    fetchMovementLogs()
  }, [])

  async function fetchMacroStats() {
    setMacroLoading(true)
    try {
      const res = await fetch('/api/warehouse/macro-stats')
      if (res.ok) {
        const data = await res.json()
        setMacroData(data)
      }
    } catch (err) {
      console.error('Fetch macro stats error:', err)
    } finally {
      setMacroLoading(false)
    }
  }

  function handleOpenMacroOrder(m: MacroMaterial) {
    const match = inventory.find(
      (p) =>
        p.name.toLowerCase().includes(m.key) ||
        p.name.toLowerCase().includes(m.nameUz.toLowerCase().split(' ')[0]) ||
        m.name.toLowerCase().includes(p.name.toLowerCase())
    )

    const targetItem: ProductInventory = match || {
      id: inventory.length > 0 ? inventory[0].id : 1,
      name: m.nameUz,
      code: m.key.toUpperCase(),
      category: m.category,
      unit: m.unit,
      minStockLevel: m.minStock,
      totalQuantity: m.currentStockKg,
      status: m.status,
      batches: []
    }

    setOrderingItem(targetItem)
    const suggestedQty = m.minStock > 0 ? Math.max(m.minStock, 1000) : 500

    setOrderForm({
      productId: targetItem.id.toString(),
      productName: m.nameUz,
      supplierId: '',
      quantity: suggestedQty.toString(),
      unit: m.unit,
      expectedDate: getTomorrowDateStr(),
      timeRange: '09:00 - 12:00',
      notes: `${m.nameUz} uchun zaxirani to'ldirish buyurtmasi. Skladdagi joriy qoldiq: ${m.currentStockKg.toLocaleString()} ${m.unit}. Asosiy ta'minotchi: ${m.topSupplier}.`
    })
    setShowOrderModal(true)
  }

  function handleOpenSupplierOrder(sup: MacroSupplier) {
    const firstProdName = sup.products[0] || 'Xomashyo'
    const match = inventory.find((p) => p.name.toLowerCase().includes(firstProdName.toLowerCase()))
    const targetItem: ProductInventory = match || (inventory.length > 0 ? inventory[0] : {
      id: 1,
      name: firstProdName,
      code: 'RAW',
      category: 'Xomashyo',
      unit: 'kg',
      minStockLevel: 1000,
      totalQuantity: 0,
      status: 'yellow',
      batches: []
    })

    const matchingSup = suppliers.find((s) => s.name?.toLowerCase().trim() === sup.name.toLowerCase().trim())

    setOrderingItem(targetItem)
    setOrderForm({
      productId: targetItem.id.toString(),
      productName: firstProdName,
      supplierId: matchingSup ? matchingSup.id.toString() : '',
      quantity: '1000',
      unit: 'kg',
      expectedDate: getTomorrowDateStr(),
      timeRange: '09:00 - 12:00',
      notes: `${sup.name} yetkazib beruvchisiga buyurtma. Mas'ul: ${sup.contactPerson}, Tel: ${sup.phone}`
    })
    setShowOrderModal(true)
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data) ? data : [])
      }
    } catch {
      console.error('Fetch suppliers error')
    }
  }

  function handleOpenReceiveModal(item?: ProductInventory) {
    if (item) {
      setReceiveForm({
        ...initialReceiveForm,
        isNewProduct: false,
        productId: item.id.toString(),
        unit: item.unit || 'kg',
        category: item.category || 'Xomashyo',
      })
    } else {
      setReceiveForm(initialReceiveForm)
    }
    setShowReceiveModal(true)
  }

  async function handleReceivePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingReceivePhoto(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (data.url) {
        setReceiveForm(prev => ({ ...prev, arrivalPhotoUrl: data.url }))
        toast.success(lang === 'ru' ? 'Фото партии загружено!' : 'Partiya rasmi yuklandi!')
      } else {
        toast.error(data.error || 'Rasm yuklashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setUploadingReceivePhoto(false)
    }
  }

  async function handleSaveReceive(e: React.FormEvent) {
    e.preventDefault()

    if (!receiveForm.isNewProduct && !receiveForm.productId) {
      toast.error(lang === 'ru' ? 'Выберите продукт' : "Mahsulotni tanlang")
      return
    }
    if (receiveForm.isNewProduct && !receiveForm.newProductName.trim()) {
      toast.error(lang === 'ru' ? 'Введите название продукта' : "Yangi mahsulot nomini kiriting")
      return
    }
    if (!receiveForm.quantity || parseFloat(receiveForm.quantity) <= 0) {
      toast.error(lang === 'ru' ? 'Укажите количество больше 0' : "Miqdorni 0 dan katta qilib kiriting")
      return
    }

    setReceiveLoading(true)
    try {
      const res = await fetch('/api/warehouse/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiveForm)
      })

      if (res.ok) {
        toast.success(lang === 'ru' ? 'Партия успешно принята на склад!' : 'Omborga kirim muvaffaqiyatli saqlandi!')
        setShowReceiveModal(false)
        setReceiveForm(initialReceiveForm)
        fetchInventory()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Kirim qilishda xatolik yuz berdi')
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setReceiveLoading(false)
    }
  }

  function handleOpenOrderModal(item: ProductInventory) {
    setOrderingItem(item)
    let suggestedQty = 20
    if (item.minStockLevel > 0) {
      if (item.minStockLevel > item.totalQuantity) {
        suggestedQty = Math.max(item.minStockLevel * 2 - item.totalQuantity, item.minStockLevel)
      } else {
        suggestedQty = item.minStockLevel
      }
    }

    const defaultNotes = item.status === 'red'
      ? "Skladda kritik qoldiq tugagan! Zudlik bilan yetkazib berilishi lozim."
      : item.status === 'yellow'
      ? "Skladda qoldiq kamaymoqda. Zaxirani to'ldirish uchun buyurtma."
      : "Zaxira uchun rejaviy buyurtma."

    setOrderForm({
      productId: item.id.toString(),
      productName: item.name,
      supplierId: '',
      quantity: suggestedQty.toString(),
      unit: item.unit || 'kg',
      expectedDate: getTomorrowDateStr(),
      timeRange: '09:00 - 12:00',
      notes: defaultNotes
    })
    setShowOrderModal(true)
  }

  async function handleSaveOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!orderForm.productId || !orderForm.quantity || parseFloat(orderForm.quantity) <= 0) {
      toast.error(lang === 'ru' ? 'Укажите правильное количество' : "Miqdorni to'g'ri kiriting")
      return
    }

    setOrderLoading(true)
    try {
      const selectedSup = suppliers.find(s => s.id === parseInt(orderForm.supplierId))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: orderForm.productId,
          supplierId: orderForm.supplierId ? parseInt(orderForm.supplierId) : null,
          supplierName: selectedSup?.name || null,
          quantity: parseFloat(orderForm.quantity),
          unit: orderForm.unit,
          expectedDate: orderForm.expectedDate,
          timeRange: orderForm.timeRange,
          notes: orderForm.notes,
          status: 'PENDING'
        })
      })

      if (res.ok) {
        toast.success(
          lang === 'ru' 
            ? 'Заявка успешно отправлена в отдел снабжения и общий чат!' 
            : "Ta'minot bo'limiga buyurtma muvaffaqiyatli yuborildi! Umumiy chatga xabarnoma jo'natildi."
        )
        setShowOrderModal(false)
        setOrderForm(initialOrderForm)
      } else {
        const data = await res.json()
        toast.error(data.error || "Buyurtma yuborishda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setOrderLoading(false)
    }
  }

  async function fetchZones() {
    try {
      const res = await fetch('/api/warehouse/zones')
      if (res.ok) setZones(await res.json())
    } catch {
      console.error('Fetch zones error')
    }
  }

  async function handleUpdateZone(batchId: number, zoneId: number | null) {
    try {
      const res = await fetch('/api/warehouse/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, zoneId })
      })
      if (res.ok) {
        toast.success("Zona o'zgartirildi")
        setShowZoneModal(null)
        fetchInventory()
      } else {
        toast.error('Xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

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

  // Handle QR Code Print
  async function handlePrintQR(batchId: number) {
    try {
      const res = await fetch('/api/batches/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })
      if (res.ok) {
        const { qrDataUrl, printData } = await res.json()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Print QR</title></head>
              <body style="text-align:center; font-family:sans-serif; margin-top:20px;">
                <h3>Partiya: ${printData.lot}</h3>
                <p>Mahsulot: ${printData.prod}</p>
                <p>Ta'minotchi: ${printData.sup}</p>
                <p>Muddati: ${printData.exp}</p>
                <img src="${qrDataUrl}" width="200" height="200" />
                <br />
                <button onclick="window.print()" style="margin-top:20px; padding:10px 20px; font-size:16px;">Chop Etish</button>
              </body>
            </html>
          `)
          printWindow.document.close()
        }
      } else {
        toast.error('QR yaratishda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
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

  // Movement logs functions & filters
  async function fetchMovementLogs(date = movementDateFilter) {
    setMovementLoading(true)
    try {
      const url = date ? `/api/warehouse/raw-movement-logs?date=${date}` : '/api/warehouse/raw-movement-logs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMovementLogs(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.warn('Failed to fetch movement logs:', err)
    } finally {
      setMovementLoading(false)
    }
  }

  async function handleDownloadMovementExcel() {
    setExportingMovement(true)
    try {
      const res = await fetch('/api/warehouse/raw-movement-logs/export')
      if (!res.ok) throw new Error('Export error')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Zhurnal_peremesheniya_syrya_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(lang === 'ru' ? 'Журнал успешно скачан (.xlsx)' : "Jurnal muvaffaqiyatli yuklab olindi (.xlsx)")
    } catch {
      toast.error(lang === 'ru' ? 'Ошибка скачивания Excel' : "Excel yuklab olishda xatolik")
    } finally {
      setExportingMovement(false)
    }
  }

  function openEditMovement(log: any) {
    setEditingMovementId(log.id)
    setMovementForm({
      orderNumber: log.orderNumber || 1,
      arrivalDate: log.arrivalDate || '',
      deliveryTime: log.deliveryTime || '',
      productName: log.productName || '',
      supplierName: log.supplierName || '',
      batchNumber: log.batchNumber || '',
      receivedWeightKg: log.receivedWeightKg !== null ? log.receivedWeightKg.toString() : '',
      storageTemp810: log.storageTemp810 !== null ? log.storageTemp810.toString() : '',
      storageTemp1700: log.storageTemp1700 !== null ? log.storageTemp1700.toString() : '',
      issuedToProduction: log.issuedToProduction || '',
      issuedKg: log.issuedKg !== null ? log.issuedKg.toString() : '',
      returnedFromProductionKg: log.returnedFromProductionKg !== null ? log.returnedFromProductionKg.toString() : '0',
      endOfDayBalanceKg: log.endOfDayBalanceKg !== null ? log.endOfDayBalanceKg.toString() : '',
      responsiblePerson: log.responsiblePerson || '',
      notes: log.notes || ''
    })
    setShowMovementModal(true)
  }

  async function handleSaveMovement(e: React.FormEvent) {
    e.preventDefault()
    setSavingMovement(true)
    try {
      const method = editingMovementId ? 'PUT' : 'POST'
      const payload: any = {
        ...movementForm,
        receivedWeightKg: parseFloat(movementForm.receivedWeightKg) || 0,
        issuedKg: parseFloat(movementForm.issuedKg) || (movementForm.issuedToProduction ? parseFloat(movementForm.issuedToProduction.replace(/[^\d.]/g, '')) || 0 : 0),
        returnedFromProductionKg: parseFloat(movementForm.returnedFromProductionKg) || 0,
        storageTemp810: movementForm.storageTemp810 ? parseFloat(movementForm.storageTemp810) : null,
        storageTemp1700: movementForm.storageTemp1700 ? parseFloat(movementForm.storageTemp1700) : null,
      }
      if (editingMovementId) {
        payload.id = editingMovementId
      }

      const res = await fetch('/api/warehouse/raw-movement-logs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingMovementId 
          ? (lang === 'ru' ? 'Запись обновлена' : 'Yozuv yangilandi') 
          : (lang === 'ru' ? 'Новая запись сохранена' : 'Yangi yozuv saqlandi')
        )
        setShowMovementModal(false)
        setEditingMovementId(null)
        setMovementForm(initialMovementForm)
        fetchMovementLogs()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingMovement(false)
    }
  }

  async function handleDeleteMovement(id: number) {
    if (!confirm(lang === 'ru' ? 'Удалить эту запись из журнала?' : 'Ushbu yozuvni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/warehouse/raw-movement-logs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись удалена' : 'Yozuv o\'chirildi')
        fetchMovementLogs()
      }
    } catch {
      toast.error('O\'chirishda xatolik')
    }
  }

  const filteredMovementLogs = useMemo(() => {
    return movementLogs.filter((log) => {
      const s = movementSearch.toLowerCase()
      const matchesSearch =
        !s ||
        (log.productName && log.productName.toLowerCase().includes(s)) ||
        (log.supplierName && log.supplierName.toLowerCase().includes(s)) ||
        (log.batchNumber && log.batchNumber.toLowerCase().includes(s)) ||
        (log.responsiblePerson && log.responsiblePerson.toLowerCase().includes(s))

      const matchesDate = !movementDateFilter || log.arrivalDate === movementDateFilter

      return matchesSearch && matchesDate
    })
  }, [movementLogs, movementSearch, movementDateFilter])

  // 10 tadan yuklash (Infinite Scroll & Show All)
  const warehousePagination = useInfiniteTable(filteredInventory, 10, [search, statusFilter])
  const transfersPagination = useInfiniteTable(transfers, 10)
  const tempLogsPagination = useInfiniteTable(filteredTempLogs, 10, [tempSearchQuery])
  const movementLogsPagination = useInfiniteTable(filteredMovementLogs, 10, [movementSearch, movementDateFilter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTempModal(false)
        setShowTransferModal(false)
        setShowReceiveModal(false)
        setShowOrderModal(false)
        setShowMovementModal(false)
        setPreviewPhotoModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate top-level stats
  const totalItems = inventory.length
  const criticalItems = inventory.filter(i => i.status === 'red').length
  const warningItems = inventory.filter(i => i.status === 'yellow').length

  const filteredMacroMaterials = (macroData?.materials || []).filter((m) => {
    if (macroCategoryFilter === 'raw') {
      if (!m.category.includes('Xomashyo')) return false
    } else if (macroCategoryFilter === 'packaging') {
      if (!m.category.includes('Qadoqlash')) return false
    } else if (macroCategoryFilter === 'hygiene') {
      if (!m.category.includes('Gigiyena') && !m.category.includes("Xo'jalik")) return false
    } else if (macroCategoryFilter === 'chemicals') {
      if (!m.category.includes('Kimyoviy')) return false
    }

    if (!macroSearch) return true
    const q = macroSearch.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.nameUz.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.topSupplier.toLowerCase().includes(q)
    )
  })

  const filteredBatches = (macroData?.batches || []).filter((b) => {
    if (!batchSearch) return true
    const q = batchSearch.toLowerCase()
    return (
      b.nomenclature.toLowerCase().includes(q) ||
      b.batchNumber.toLowerCase().includes(q) ||
      b.supplier.toLowerCase().includes(q) ||
      b.date.includes(q)
    )
  })

  const batchesPagination = useInfiniteTable(filteredBatches, 15, [batchSearch])

  const filteredGpItems = (macroData?.gp?.items || []).filter((g) => {
    if (gpCategory !== 'all' && g.category !== gpCategory) return false
    if (!gpSearch) return true
    const q = gpSearch.toLowerCase()
    return g.name.toLowerCase().includes(q) || (g.category && g.category.toLowerCase().includes(q))
  })

  const filteredGpLogs = (macroData?.gp?.dailyLogs || []).filter((g) => {
    if (!gpSearch) return true
    const q = gpSearch.toLowerCase()
    return g.product.toLowerCase().includes(q) || g.date.includes(q)
  })

  const gpLogsPagination = useInfiniteTable(filteredGpLogs, 15, [gpSearch])

  const filteredSuppliers = (macroData?.suppliers || []).filter((s) => {
    if (!supplierSearch) return true
    const q = supplierSearch.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.products.some((p) => p.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col min-h-full animate-enter space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white dark:bg-dark-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-dark-750">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} />
                {formatDual('Omborxona Boshqaruvi (WMS)', 'Управление складом (WMS)', 'Warehouse Management (WMS)')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {l.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
              {l.subtitle}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800/80 p-1 rounded-2xl border border-slate-200 dark:border-dark-700/80 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Package size={15} />
              <span>{l.tabStock}</span>
            </button>
            <button
              onClick={() => setActiveTab('gp')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'gp'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Boxes size={15} />
              <span>{formatDual("ГП (Tayyor mahsulot)", "ГП (Готовая продукция)", "Finished Goods (FG)")}</span>
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'transfers'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Scale size={15} />
              <span>{l.tabTransfers}</span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'suppliers'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Truck size={15} />
              <span>{l.tabSuppliers}</span>
            </button>
            <Link
              href="/raw-movement"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-white bg-white dark:bg-dark-750/60 hover:bg-emerald-50 dark:hover:bg-emerald-600/20 border border-slate-200 hover:border-emerald-500/40 dark:border-dark-700 transition-all whitespace-nowrap ml-1"
            >
              <ClipboardList size={15} className="text-emerald-500" />
              <span>{formatDual("Xomashyo harakati (alohida)", "Журнал сырья на пр-во", "Raw Movement")}</span>
              <ExternalLink size={12} className="opacity-60 text-slate-400" />
            </Link>
            <Link
              href="/temperature-logs"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-white bg-white dark:bg-dark-750/60 hover:bg-cyan-50 dark:hover:bg-cyan-600/20 border border-slate-200 hover:border-cyan-500/40 dark:border-dark-700 transition-all whitespace-nowrap"
            >
              <Thermometer size={15} className="text-cyan-500" />
              <span>{formatDual("Harorat nazorati (F-01)", "Контроль температур Ф-01", "Temp Logs")}</span>
              <ExternalLink size={12} className="opacity-60 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* TAB 1: INVENTORY (FEFO / TRAFFIC LIGHT & MACRO-STATS) */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 1. Director-Style Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Card 1: Jami Kirim */}
            <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-emerald-500/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                    {formatDual("Jami Kirim", "Всего приход", "Total Arrivals")}
                  </span>
                  <div className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {macroLoading ? (
                      <span className="text-slate-400 text-sm">...</span>
                    ) : (
                      `${macroData?.summary.totalArrivalTonnes.toLocaleString() || '0'} tn`
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {macroData?.summary.totalArrivalKg.toLocaleString() || 0} kg
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-slate-500 text-[10px] sm:text-xs">
                      {macroData?.summary.totalArrivalBatches || 0} ta kirim
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <ArrowDownRight size={18} className="sm:hidden" />
                  <ArrowDownRight size={24} className="hidden sm:block" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-dark-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{formatDual("Sex Hisoboti", "Отчет цеха", "Shop report")}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">100% kirim</span>
              </div>
            </div>

            {/* Card 2: Jami Rasxod */}
            <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-amber-500/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                    {formatDual("Jami Rasxod", "Расход в цех", "Total Expensed")}
                  </span>
                  <div className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {macroLoading ? (
                      <span className="text-slate-400 text-sm">...</span>
                    ) : (
                      `${macroData?.summary.totalExpenseTonnes.toLocaleString() || '0'} tn`
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {macroData?.summary.totalExpenseKg.toLocaleString() || 0} kg
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-slate-500 text-[10px] sm:text-xs">
                      {formatDual("Sexga", "В цех", "Shop")}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-500/15 border border-amber-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <ArrowUpRight size={18} className="sm:hidden" />
                  <ArrowUpRight size={24} className="hidden sm:block" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-dark-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{formatDual("Sex Rasxodi", "Расход", "Shop expense")}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                  {macroData && macroData.summary.totalArrivalKg > 0
                    ? `${Math.round((macroData.summary.totalExpenseKg / macroData.summary.totalArrivalKg) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Card 3: Joriy Sklad Qoldig'i */}
            <div className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-cyan-500/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-colors" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                    {formatDual("Sklad Qoldig'i", "Остаток склада", "Net Stock")}
                  </span>
                  <div className="text-lg sm:text-2xl md:text-3xl font-black text-cyan-600 dark:text-cyan-400">
                    {macroLoading ? (
                      <span className="text-slate-400 text-sm">...</span>
                    ) : (
                      `${macroData?.summary.currentStockTonnes.toLocaleString() || '0'} tn`
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {macroData?.summary.currentStockKg.toLocaleString() || 0} kg
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] sm:text-xs">
                      {macroData?.summary.sufficientCount || 0} me'yorda
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-cyan-500/15 border border-cyan-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                  <BarChart3 size={18} className="sm:hidden" />
                  <BarChart3 size={24} className="hidden sm:block" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-dark-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{formatDual("Sof zaxira", "Резерв", "Reserve")}</span>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px]">
                  {(macroData?.summary.criticalCount || 0) > 0 && (
                    <span className="px-1 sm:px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold whitespace-nowrap">
                      {macroData?.summary.criticalCount} kritik
                    </span>
                  )}
                  {(macroData?.summary.warningCount || 0) > 0 && (
                    <span className="px-1 sm:px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 font-bold whitespace-nowrap">
                      {macroData?.summary.warningCount} kam
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Ta'minotchilar */}
            <div 
              onClick={() => setActiveTab('suppliers')}
              className="bg-white dark:bg-dark-900/90 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/25 transition-colors" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                    {formatDual("Ta'minotchilar", "Поставщики", "Suppliers")}
                  </span>
                  <div className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    {macroLoading ? (
                      <span className="text-slate-400 text-sm">...</span>
                    ) : (
                      `${macroData?.summary.totalSuppliersCount || 0} ta`
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {formatDual("Faol hamkorlar", "Активные партнеры", "Active partners")}
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-500/15 border border-indigo-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Truck size={18} className="sm:hidden" />
                  <Truck size={24} className="hidden sm:block" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-dark-800 text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-between group-hover:text-indigo-500 dark:group-hover:text-indigo-300">
                <span className="truncate">{formatDual("Ko'rish", "Смотреть", "View")}</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          </div>

          {/* Quick Access to Dedicated Standalone Journals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Link
              href="/raw-movement"
              className="bg-white dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-dark-900 dark:to-dark-850 border border-slate-200 dark:border-emerald-500/30 hover:border-emerald-500/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {formatDual("Alohida Jurnal Sahifasi", "Отдельная страница журнала", "Dedicated Journal")}
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {formatDual("Xomashyoni Sexga Berish Jurnali", "Журнал регистрации и перемещения сырья", "Raw Material Movement Log")}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                    {formatDual("12 ustunli partiya, harorat (8:10/17:00), chiqim va kunlik qoldiq", "12 граф: партия, темп-ра, расход, остаток", "12-column batch, temperature & balance")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all flex-shrink-0 ml-2">
                <span>{formatDual("Ochish", "Открыть", "Open")}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/temperature-logs"
              className="bg-white dark:bg-gradient-to-r dark:from-cyan-950/40 dark:via-dark-900 dark:to-dark-850 border border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Thermometer size={22} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    {formatDual("Alohida Jurnal Sahifasi", "Отдельная страница журнала", "Dedicated Journal")}
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    {formatDual("Harorat Nazorati Chek-listi (F-01)", "Контроль температуры сырья при хранении (Ф-01)", "Storage Temperature Log (F-01)")}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                    {formatDual("2°C–5°C me'yor: Aysberg, Piyoz, Pomidor, Sabzi, Karam nazorati", "Норма 2°C–5°C: Айсберг, Лук, Томаты, Морковь, Капуста", "2°C–5°C norm validation for 5 vegetables")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all flex-shrink-0 ml-2">
                <span>{formatDual("Ochish", "Открыть", "Open")}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* 2. Executive Macro Balance Table (Kirim - Chiqim = Qoldiq) */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-dark-750 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-gradient-to-r dark:from-dark-850 dark:to-dark-900">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                    {formatDual("Sex Hisoboti & Sklad Integratsiyasi", "Отчет цеха и интеграция склада", "Shop & Warehouse Integration")}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <BarChart3 className="text-emerald-600 dark:text-emerald-400" size={22} />
                  <span>{formatDual("Umumiy Xomashyolar Balansi & Qoldiq Statistikasi", "Сводный баланс и статистика остатков сырья", "Aggregated Raw Material Balance & Stock")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  {formatDual(
                    "Sex Ishlab Chiqarish Hisoboti va qabul aktlari bo'yicha jami kelgan, sexga rasxod qilingan va skladdagi sof qoldiq balansi (Kirim - Rasxod = Qoldiq)",
                    "Сводка по отчетам цеха и актам приемки: общий приход, списание в цех и фактический чистый остаток на складе",
                    "Aggregated shop arrival and expense balance for all primary raw materials"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder={formatDual("Xomashyo nomi bo'yicha...", "Поиск сырья...", "Search material...")}
                    value={macroSearch}
                    onChange={(e) => setMacroSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 flex-1 w-full"
                  />
                </div>
                <button
                  onClick={() => fetchMacroStats()}
                  disabled={macroLoading}
                  className="p-2.5 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40 transition-all disabled:opacity-50"
                  title={formatDual("Yangilash", "Обновить", "Refresh")}
                >
                  <RefreshCw size={16} className={macroLoading ? 'animate-spin text-emerald-500' : ''} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-850/40 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setMacroCategoryFilter('all')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  macroCategoryFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-700'
                }`}
              >
                {formatDual("Barchasi", "Все", "All")} ({macroData?.materials.length || 0})
              </button>
              <button
                onClick={() => setMacroCategoryFilter('raw')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  macroCategoryFilter === 'raw'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-700'
                }`}
              >
                🥬 {formatDual("Xomashyo & Sabzavotlar", "Сырье и овощи", "Raw Vegetables")}
              </button>
              <button
                onClick={() => setMacroCategoryFilter('packaging')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  macroCategoryFilter === 'packaging'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-700'
                }`}
              >
                📦 {formatDual("Qadoqlash & Paketlar", "Упаковка и тара", "Packaging & Bags")}
              </button>
              <button
                onClick={() => setMacroCategoryFilter('hygiene')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  macroCategoryFilter === 'hygiene'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-700'
                }`}
              >
                🧤 {formatDual("Xo'jalik & Gigiyena", "Хоз. товары и гигиена", "Hygiene & Supplies")}
              </button>
              <button
                onClick={() => setMacroCategoryFilter('chemicals')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  macroCategoryFilter === 'chemicals'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-dark-700'
                }`}
              >
                🧪 {formatDual("Kimyoviy & Dezinfeksiya", "Химия и дезинфекция", "Chemicals")}
              </button>
            </div>

            {/* Mobile Material Cards View (Smartphones: block sm:hidden) */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-dark-750/70">
              {macroLoading && !macroData ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={24} />
                  <p className="text-xs">{formatDual("Xomashyo balansi hisoblanmoqda...", "Расчет баланса...", "Calculating...")}</p>
                </div>
              ) : filteredMacroMaterials.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {formatDual("Qidiruv bo'yicha xomashyo topilmadi", "Ничего не найдено", "No materials found")}
                </div>
              ) : (
                filteredMacroMaterials.map((m) => {
                  const stockPercent = m.totalArrivalKg > 0 ? Math.min(100, Math.round((m.currentStockKg / m.totalArrivalKg) * 100)) : 0
                  return (
                    <div key={m.key} className="p-3.5 hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors space-y-2.5">
                      {/* Name & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 shadow-xs">
                            <Package size={17} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight truncate">{m.nameUz}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.name} · <span className="text-slate-700 dark:text-slate-300 font-medium">{m.category}</span></p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 flex-shrink-0 ${
                          m.status === 'green' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                          m.status === 'yellow' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                          'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'green' ? 'bg-emerald-500' : m.status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          {m.status === 'green' ? formatDual("Yetarli", "В норме", "Sufficient") :
                           m.status === 'yellow' ? formatDual("Kam", "Мало", "Low") :
                           formatDual("Kritik", "Критично", "Critical")}
                        </span>
                      </div>

                      {/* 3 Metrics Box */}
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-dark-850/80 p-2 rounded-xl border border-slate-200 dark:border-dark-750 text-center">
                        <div>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block">{formatDual("Kirim", "Приход", "Arrival")}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{m.totalArrivalKg.toLocaleString()}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block">{m.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400/90 block">{formatDual("Sexga", "В цех", "Shop")}</span>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight">{m.totalExpenseKg.toLocaleString()}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block">{m.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400/90 block">{formatDual("Qoldiq", "Остаток", "Stock")}</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-tight">{m.currentStockKg.toLocaleString()}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block">{m.unit}</span>
                        </div>
                      </div>

                      {/* Stock Level Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{formatDual("Zaxira me'yori", "Запас", "Level")}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{stockPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-dark-800 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-dark-750">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              m.status === 'green' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                              m.status === 'yellow' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                              'bg-gradient-to-r from-rose-500 to-red-400'
                            }`}
                            style={{ width: `${Math.max(4, Math.min(100, stockPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Supplier & Action */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-2 text-xs">
                        <div className="truncate text-slate-500 dark:text-slate-400 text-[11px] min-w-0">
                          <span className="text-slate-400 dark:text-slate-500">{formatDual("Ta'minotchi: ", "Пост.: ", "Sup: ")}</span>
                          <span className="text-slate-750 dark:text-slate-300 font-medium truncate">{m.topSupplier}</span>
                        </div>
                        <button
                          onClick={() => handleOpenMacroOrder(m)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-300 dark:border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all flex-shrink-0"
                        >
                          <ShoppingCart size={11} />
                          <span>{formatDual("Buyurtma", "Заказать", "Order")}</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">{formatDual("Xomashyo Nomi", "Сырье", "Raw Material")}</th>
                    <th className="p-4 text-center">{formatDual("Jami Kirim", "Всего Приход", "Total Arrival")}</th>
                    <th className="p-4 text-center">{formatDual("Jami Rasxod (Sexga)", "Всего Расход (Цех)", "Total Expensed")}</th>
                    <th className="p-4 text-center">{formatDual("Skladdagi Qoldiq", "Остаток на складе", "Current Stock")}</th>
                    <th className="p-4 text-center">{formatDual("Zaxira Holati", "Уровень запаса", "Stock Level")}</th>
                    <th className="p-4 text-center">{formatDual("Status (Svetofor)", "Светофор", "Status")}</th>
                    <th className="p-4">{formatDual("Asosiy Yetkazib Beruvchi", "Главный поставщик", "Primary Supplier")}</th>
                    <th className="p-4 text-right">{formatDual("Tezkor Harakat", "Действие", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                  {macroLoading && !macroData ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
                        <span>{formatDual("Xomashyo balansi hisoblanmoqda...", "Расчет баланса сырья...", "Calculating material balances...")}</span>
                      </td>
                    </tr>
                  ) : filteredMacroMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-500">
                        {formatDual("Qidiruv bo'yicha xomashyo topilmadi", "Ничего не найдено", "No materials found")}
                      </td>
                    </tr>
                  ) : (
                    filteredMacroMaterials.map((m) => {
                      const stockPercent = m.totalArrivalKg > 0 ? Math.min(100, Math.round((m.currentStockKg / m.totalArrivalKg) * 100)) : 0
                      return (
                        <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                          {/* Material Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 shadow-xs">
                                <Package size={18} />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                                  {m.nameUz}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{m.name}</span>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                                    {m.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Total Arrival */}
                          <td className="p-4 text-center">
                            <div className="font-black text-slate-900 dark:text-white text-base">
                              {m.unit === 'kg'
                                ? (m.totalArrivalKg >= 1000
                                    ? `${(m.totalArrivalKg / 1000).toFixed(1)} tn`
                                    : `${m.totalArrivalKg.toLocaleString()} kg`)
                                : `${m.totalArrivalKg.toLocaleString()} ${m.unit}`}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {m.totalArrivalKg.toLocaleString()} {m.unit} ({m.arrivalsCount} ta partiya)
                            </div>
                          </td>

                          {/* Total Expense */}
                          <td className="p-4 text-center">
                            <div className="font-black text-amber-600 dark:text-amber-400 text-base">
                              {m.unit === 'kg'
                                ? (m.totalExpenseKg >= 1000
                                    ? `${(m.totalExpenseKg / 1000).toFixed(1)} tn`
                                    : `${m.totalExpenseKg.toLocaleString()} kg`)
                                : `${m.totalExpenseKg.toLocaleString()} ${m.unit}`}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {m.totalExpenseKg.toLocaleString()} {m.unit} sexga berilgan
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="p-4 text-center">
                            <div className={`inline-block px-3 py-1.5 rounded-xl border font-black text-base ${
                              m.status === 'green'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : m.status === 'yellow'
                                ? 'bg-yellow-50 dark:bg-yellow-500/15 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                            }`}>
                              {m.unit === 'kg'
                                ? (m.currentStockKg >= 1000
                                    ? `${(m.currentStockKg / 1000).toFixed(1)} tn`
                                    : `${m.currentStockKg.toLocaleString()} kg`)
                                : `${m.currentStockKg.toLocaleString()} ${m.unit}`}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                              {m.currentStockKg.toLocaleString()} {m.unit}
                            </div>
                          </td>

                          {/* Stock Level Progress */}
                          <td className="p-4 text-center min-w-[130px]">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              <span>{stockPercent}% qoldi</span>
                              <span className="font-mono text-[10px]">min: {m.minStock}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-dark-700">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  m.status === 'green'
                                    ? 'bg-emerald-500'
                                    : m.status === 'yellow'
                                    ? 'bg-yellow-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(5, stockPercent)}%` }}
                              />
                            </div>
                          </td>

                          {/* Status (Svetofor) */}
                          <td className="p-4 text-center">
                            {m.status === 'green' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle size={14} />
                                <span>{formatDual("Yetarli (Yashil)", "В норме (Зеленый)", "Sufficient")}</span>
                              </span>
                            )}
                            {m.status === 'yellow' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                                <Clock size={14} />
                                <span>{formatDual("Kamaygan (Sariq)", "Мало (Желтый)", "Low")}</span>
                              </span>
                            )}
                            {m.status === 'red' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                                <AlertTriangle size={14} />
                                <span>{formatDual("Kritik (Qizil)", "Критично (Красный)", "Critical")}</span>
                              </span>
                            )}
                          </td>

                          {/* Top Supplier */}
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]" title={m.topSupplier}>
                              {m.topSupplier}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {m.suppliersCount > 1
                                ? `+ yana ${m.suppliersCount - 1} ta ta'minotchi`
                                : "Yagona yetkazib beruvchi"}
                            </div>
                          </td>

                          {/* Action: Quick Order */}
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenMacroOrder(m)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-bold transition-all shadow-xs hover:shadow-amber-500/10"
                              title="Ta'minot bo'limiga buyurtma berish"
                            >
                              <ShoppingCart size={13} />
                              <span>{formatDual("Buyurtma", "Заказать", "Order")}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Section Divider & Batches View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {batchesView === 'prihod'
                    ? formatDual("ПРИХОД (Kirim qilinayotgan mahsulotlar & partiyalar)", "ПРИХОД (Поступления сырья по партиям)", "Arrivals by Batches")
                    : formatDual("Sklad Qoldiqlari & FEFO Partiyalar Nazorati", "Остатки склада и партии FEFO", "FEFO Stock Batches")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {batchesView === 'prihod'
                    ? formatDual("Barcha kelgan xomashyo partiyalari, sanalari va ta'minotchilari ro'yxati", "Полный список прихода сырья с номерами партий", "Full raw material arrivals with batch numbers")
                    : formatDual("Mahsulotlar bo'yicha zonalash va FEFO muddatlari", "Зоны хранения и сроки годности", "Storage zones and expiry dates")}
                </p>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-dark-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-dark-700 w-full sm:w-max max-w-full overflow-x-auto backdrop-blur-sm">
              <button
                onClick={() => setBatchesView('prihod')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  batchesView === 'prihod'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tag size={14} />
                <span>{formatDual("1. Prihod Partiyalari", "1. Партии Прихода", "1. Arrival Batches")}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 dark:bg-dark-900/60 text-[10px] text-amber-800 dark:text-slate-300 font-bold">
                  {macroData?.batches.length || 0}
                </span>
              </button>
              <button
                onClick={() => setBatchesView('fefo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  batchesView === 'fefo'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>{formatDual("2. FEFO & Zonalar", "2. FEFO и зоны", "2. FEFO & Zones")}</span>
              </button>
            </div>
          </div>

          {/* VIEW A: REAL PRIHOD BATCHES (Matching user's Image 1) */}
          {batchesView === 'prihod' && (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-dark-850/50">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder={formatDual(
                      "Partiya raqami, xomashyo yoki ta'minotchi...",
                      "Поиск по номеру партии, продукту или поставщику...",
                      "Search batch, nomenclature or supplier..."
                    )}
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {formatDual(
                    `Topildi: ${batchesPagination.totalCount} ta partiya`,
                    `Найдено: ${batchesPagination.totalCount} партий`,
                    `Found: ${batchesPagination.totalCount} batches`
                  )}
                </div>
              </div>

              {/* Mobile Batches Cards (Visible on phones: block sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-dark-750/70">
                {macroLoading && !macroData ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="animate-spin text-amber-500 mx-auto mb-2" size={24} />
                    <p className="text-xs">{formatDual("Partiyalar yuklanmoqda...", "Загрузка партий...", "Loading...")}</p>
                  </div>
                ) : batchesPagination.displayedItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <Tag size={28} className="mx-auto mb-2 opacity-30" />
                    <p>{formatDual("Partiya topilmadi", "Партии не найдены", "No batches found")}</p>
                  </div>
                ) : (
                  batchesPagination.displayedItems.map((b) => (
                    <div key={b.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          📅 {b.date}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 font-black text-amber-700 dark:text-amber-300 text-[11px]">
                          <Tag size={10} />
                          <span>{b.batchNumber}</span>
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight truncate">{b.nomenclature}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{b.supplier} · <span className="text-slate-400 dark:text-slate-500">{b.category}</span></div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400">{b.quantity.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{b.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-750 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                      <th className="p-4">{formatDual("SANA", "САНА", "Date")}</th>
                      <th className="p-4">{formatDual("NOMENKLATURA", "НОМЕНКЛАТУРА", "Nomenclature")}</th>
                      <th className="p-4 text-center">{formatDual("MIQDOR", "КОЛИЧЕСТВО", "Quantity")}</th>
                      <th className="p-4">{formatDual("TA'MINOTCHI", "ПОСТАВЩИК", "Supplier")}</th>
                      <th className="p-4 text-center">{formatDual("PARTIYA", "ПАРТИИ", "Batch No")}</th>
                      <th className="p-4 text-center">{formatDual("TOIFA", "КАТЕГОРИЯ", "Category")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                    {macroLoading && !macroData ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400">
                          <Loader2 className="animate-spin text-amber-500 mx-auto mb-2" size={28} />
                          <span>{formatDual("Partiyalar yuklanmoqda...", "Загрузка партий...", "Loading batches...")}</span>
                        </td>
                      </tr>
                    ) : batchesPagination.displayedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">
                          <Tag size={36} className="mx-auto mb-2 opacity-30" />
                          <p>{formatDual("Partiya topilmadi", "Партии не найдены", "No batches found")}</p>
                        </td>
                      </tr>
                    ) : (
                      batchesPagination.displayedItems.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-white text-xs">
                            {b.date}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                            {b.nomenclature}
                          </td>
                          <td className="p-4 text-center font-black text-amber-600 dark:text-amber-400">
                            {b.quantity.toLocaleString()} {b.unit}
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {b.supplier}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 font-black text-amber-700 dark:text-amber-300 text-xs">
                              <Tag size={12} />
                              <span>{b.batchNumber}</span>
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              {b.category}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 15 tadan yuklash pagination footeri */}
              {!macroLoading && batchesPagination.totalCount > 0 && (
                <InfiniteTableFooter
                  currentCount={batchesPagination.visibleCount}
                  totalCount={batchesPagination.totalCount}
                  hasMore={batchesPagination.hasMore}
                  showAll={batchesPagination.showAll}
                  onLoadMore={batchesPagination.loadMore}
                  onToggleShowAll={batchesPagination.toggleShowAll}
                  sentinelRef={batchesPagination.sentinelRef}
                  pageSize={15}
                  itemName={{ uz: 'partiya', ru: 'партий', en: 'batches' }}
                />
              )}
            </div>
          )}

          {/* VIEW B: FEFO & STORAGE ZONES */}
          {batchesView === 'fefo' && (
            <div className="space-y-4">
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={l.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
                  />
                </div>
                <div className="flex bg-slate-100 dark:bg-dark-800/50 p-1.5 rounded-2xl w-full sm:w-max max-w-full overflow-x-auto border border-slate-200 dark:border-dark-700/50 backdrop-blur-sm">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {l.filterAll}
                  </button>
                  <button 
                    onClick={() => setStatusFilter('red')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'red' ? 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'}`}
                  >
                    {l.statusCritical}
                  </button>
                  <button 
                    onClick={() => setStatusFilter('yellow')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'yellow' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500'}`}
                  >
                    {l.statusWarning}
                  </button>
                  <button 
                    onClick={() => setStatusFilter('green')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'green' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                  >
                    {l.filterOk}
                  </button>
                </div>
              </div>

          {/* Inventory Table */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Yuklanmoqda...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Package size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-500 dark:text-slate-400">{l.empty}</p>
              </div>
            ) : (
              <>
                {/* Mobile Smartphone Card View (Dedicated for warehousemen on phones) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-dark-800">
                  {warehousePagination.displayedItems.map((item) => (
                    <div key={item.id} className="p-3.5 bg-white dark:bg-dark-900 space-y-3">
                      {/* Product Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              onClick={() => setPreviewPhotoModal({ url: item.imageUrl!, title: item.name })}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-dark-700 flex-shrink-0 cursor-pointer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">{item.category || 'Xomashyo'}</span>
                              {item.code && <span className="text-[10px] text-slate-400 font-mono">#{item.code}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Total Stock */}
                        <div className="text-right flex-shrink-0">
                          <div className="inline-flex items-baseline gap-1 bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-dark-700">
                            <span className="font-black text-sm text-slate-900 dark:text-white">{item.totalQuantity}</span>
                            <span className="text-[10px] font-bold text-slate-500">{item.unit}</span>
                          </div>
                          <div className="text-[10px] mt-0.5 font-bold">
                            {item.status === 'red' && <span className="text-red-500">🔴 Kritik</span>}
                            {item.status === 'yellow' && <span className="text-amber-500">🟡 Kam</span>}
                            {item.status === 'green' && <span className="text-emerald-500">🟢 Yetarli</span>}
                          </div>
                        </div>
                      </div>

                      {/* FEFO Batches List - Har bir partiya alohida, tartibli */}
                      <div className="bg-slate-50 dark:bg-dark-850 rounded-xl p-2.5 border border-slate-200/80 dark:border-dark-750 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Layers size={12} />
                            <span>Partiyalar (FEFO tartibida):</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.batches.length > 0 ? `${item.batches.length} ta partiya` : "Partiya yo'q"}
                          </span>
                        </div>

                        {item.batches.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-1 text-center">Partiyalar mavjud emas</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.batches.map((b, idx) => {
                              const isActive = idx === 0
                              return (
                                <div
                                  key={b.id}
                                  className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                    isActive
                                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                                      : 'bg-white dark:bg-dark-800/80 border-slate-200 dark:border-dark-700 text-slate-500 dark:text-slate-400 opacity-65'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                        isActive
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 dark:bg-dark-700 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      #{idx + 1}
                                    </span>
                                    <div className="truncate">
                                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                                        #{b.batchNumber}
                                      </span>
                                      {b.expirationDate && (
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">
                                          Muddati: {new Date(b.expirationDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                                          {typeof b.daysUntilExpiry === 'number' && (
                                            <span
                                              className={`ml-1 font-bold ${
                                                b.daysUntilExpiry <= 2
                                                  ? 'text-red-500'
                                                  : b.daysUntilExpiry <= 5
                                                  ? 'text-amber-500'
                                                  : 'text-slate-400'
                                              }`}
                                            >
                                              ({b.daysUntilExpiry > 0 ? `${b.daysUntilExpiry}k` : 'tugadi!'})
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                                      {b.quantity} {item.unit}
                                    </span>
                                    {isActive ? (
                                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                        <span>⚡ Aktiv</span>
                                      </span>
                                    ) : (
                                      <span
                                        className="text-[10px] bg-slate-200 dark:bg-dark-700 text-slate-500 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                        title="1-partiya tugagach ochiladi"
                                      >
                                        <span>🔒 Navbatda</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleOpenQuickTransfer(item)}
                          disabled={item.totalQuantity <= 0}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Send size={14} />
                          <span>Chiqim berish (FEFO)</span>
                        </button>
                        <button
                          onClick={() => handleOpenReceiveModal(item)}
                          className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Kirim</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800/40 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-5">{l.colProduct}</th>
                      <th className="p-5">{l.colCode}</th>
                      <th className="p-5">{l.colMin}</th>
                      <th className="p-5">{l.colCurrent}</th>
                      <th className="p-5">{l.colBatches}</th>
                      <th className="p-5">{l.colStatus}</th>
                      <th className="p-5 text-right">{formatDual("Amallar (Kirim / Chiqim)", "Действия (Приход / Расход)", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                    {warehousePagination.displayedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                onClick={() => setPreviewPhotoModal({ url: item.imageUrl!, title: item.name })}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-dark-700 cursor-pointer hover:border-emerald-500 hover:scale-105 transition-all flex-shrink-0 shadow-xs"
                                title="Rasmni kattalashtirish"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-750 flex items-center justify-center text-slate-400 flex-shrink-0">
                                <Package size={20} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {item.name}
                              </div>
                              <span className="text-xs text-slate-500">{item.category || 'Xomashyo'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.code || '-'}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{item.category || 'Xomashyo'}</span>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">
                          {item.minStockLevel} {item.unit}
                        </td>
                        <td className="p-5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-2xl text-slate-900 dark:text-white leading-none">
                              {item.totalQuantity}
                            </span>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.unit}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          {item.batches.length === 0 ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-dark-800 px-2 py-1 rounded-md">{l.noBatches}</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-w-[220px]">
                              {item.batches.slice(0, 3).map((b) => (
                                <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">#{b.batchNumber}</span>
                                    <button 
                                      onClick={() => setShowZoneModal({batchId: b.id, currentZoneId: b.zone?.id || null})} 
                                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline text-left font-semibold"
                                    >
                                      {b.zone ? b.zone.name : "+ Zona qo'shish"}
                                    </button>
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                    {b.arrivalPhotoUrl && (
                                      <button 
                                        onClick={() => setPreviewPhotoModal({ url: b.arrivalPhotoUrl!, title: `${item.name} (#${b.batchNumber})` })}
                                        className="text-emerald-600 dark:text-emerald-400 p-1 rounded bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" 
                                        title="Partiya rasmini ko'rish"
                                      >
                                        <Camera size={13} />
                                      </button>
                                    )}
                                    <button onClick={() => handlePrintQR(b.id)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5" title="Print QR">
                                      <QrCode size={12} />
                                    </button>
                                    <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 rounded">{b.quantity} {item.unit}</span>
                                  </div>
                                </div>
                              ))}
                              {item.batches.length > 3 && (
                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 text-center mt-0.5">
                                  {l.moreBatches.replace('{n}', (item.batches.length - 3).toString())}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-5">
                          {item.status === 'red' && (
                            <div className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-1.5 rounded-xl shadow-xs">
                              <AlertTriangle size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusCritical}</span>
                            </div>
                          )}
                          {item.status === 'yellow' && (
                            <div className="inline-flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 px-3 py-1.5 rounded-xl shadow-xs">
                              <Clock size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusWarning}</span>
                            </div>
                          )}
                          {item.status === 'green' && (
                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-xs">
                              <CheckCircle size={16} strokeWidth={2.5} />
                              <span className="text-xs font-bold uppercase tracking-wider">{l.statusOk}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleOpenOrderModal(item)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                item.status === 'red'
                                  ? 'bg-rose-500/20 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/40 shadow-xs shadow-rose-500/20 animate-pulse'
                                  : item.status === 'yellow'
                                  ? 'bg-amber-500/20 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/40'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700'
                              }`}
                              title={formatDual("Ta'minot bo'limiga buyurtma / talabnoma yuborish", "Отправить заявку в отдел снабжения", "Send purchase request to supply")}
                            >
                              <ShoppingCart size={14} />
                              <span>{formatDual("Zakaz", "Заказ", "Order")}</span>
                            </button>
                            <button
                              onClick={() => handleOpenReceiveModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 transition-all"
                              title="Ushbu mahsulotga yangi partiya kirim qilish"
                            >
                              <Plus size={14} />
                              <span>{formatDual("Kirim", "Приход", "Intake")}</span>
                            </button>
                            <button
                              onClick={() => handleOpenQuickTransfer(item)}
                              disabled={item.totalQuantity <= 0}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-dark-800 hover:bg-emerald-600 text-slate-700 dark:text-slate-300 hover:text-white border border-slate-200 dark:border-dark-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Send size={14} />
                              <span>{formatDual("Chiqarish", "Отпустить", "Dispatch")}</span>
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

            {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
            {!loading && filteredInventory.length > 0 && (
              <InfiniteTableFooter
                currentCount={warehousePagination.visibleCount}
                totalCount={warehousePagination.totalCount}
                hasMore={warehousePagination.hasMore}
                showAll={warehousePagination.showAll}
                onLoadMore={warehousePagination.loadMore}
                onToggleShowAll={warehousePagination.toggleShowAll}
                sentinelRef={warehousePagination.sentinelRef}
                pageSize={10}
                itemName={{ uz: 'mahsulot', ru: 'товаров', en: 'products' }}
              />
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {/* TAB: RAW MATERIAL MOVEMENT LOG (ЖУРНАЛ РЕГИСТРАЦИИ И ПЕРЕМЕЩЕНИЯ ОСНОВНОГО СЫРЬЯ НА ПРОИЗВОДСТВО) */}
      {activeTab === 'movement' && (
        <div className="space-y-6 animate-enter">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-6 rounded-3xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList size={14} />
                  GREEN PROCESSING • FSSC 22000
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>{lang === 'ru' ? 'Журнал регистрации и перемещения основного сырья на производство' : "Asosiy Xomashyoni Ro'yxatga Olish va Ishlab Chiqarishga Berish Jurnali"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {formatDual(
                  "Xomashyo qabul qilingan sana/vaqti, partiya, kirim vazni, saqlash harorati (8:10 va 17:00), sexga berilgan va sexdan qaytgan hajmlar hamda kun oxiridagi sof qoldiq hisobi",
                  "Учет поступления, температуры хранения (8:10 и 17:00), отпуска сырья в цех, возвратов из цеха и остатков на конец дня",
                  "Raw material intake, storage temperature, dispatch to production, returns and end-of-day balances"
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setEditingMovementId(null)
                  setMovementForm(initialMovementForm)
                  setShowMovementModal(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span>{formatDual("Yangi Yozuv Kiritish", "Добавить запись", "New Record")}</span>
              </button>

              <button
                onClick={handleDownloadMovementExcel}
                disabled={exportingMovement}
                className="px-4 py-2.5 rounded-xl border border-dark-600 bg-dark-800 hover:bg-dark-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow hover:border-emerald-500/50 disabled:opacity-50"
              >
                {exportingMovement ? (
                  <RefreshCw size={16} className="animate-spin text-emerald-400" />
                ) : (
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                )}
                <span>{exportingMovement ? (lang === 'ru' ? 'Скачивание...' : 'Yuklanmoqda...') : 'Excel (.xlsx)'}</span>
              </button>

              <button
                onClick={() => fetchMovementLogs()}
                disabled={movementLoading}
                className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors"
                title={formatDual("Yangilash", "Обновить", "Refresh")}
              >
                <RefreshCw size={16} className={movementLoading ? 'animate-spin text-emerald-400' : ''} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-dark-900/70 p-4 rounded-2xl border border-slate-200 dark:border-dark-750">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={formatDual("Xomashyo nomi, ta'minotchi, partiya raqami yoki mas'ul xodim...", "Поиск по сырью, поставщику, номеру партии или ответственному...", "Search by raw material, supplier, batch or person...")}
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={movementDateFilter}
                onChange={(e) => {
                  setMovementDateFilter(e.target.value)
                  fetchMovementLogs(e.target.value)
                }}
                className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              {movementDateFilter && (
                <button
                  onClick={() => {
                    setMovementDateFilter('')
                    fetchMovementLogs('')
                  }}
                  className="px-2.5 py-2 text-xs rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-xs text-slate-400 font-mono bg-dark-800 px-3 py-2 rounded-xl border border-dark-700 whitespace-nowrap">
                {filteredMovementLogs.length} ta yozuv
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            {movementLoading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-semibold">{formatDual("Xomashyo harakati jurnali yuklanmoqda...", "Загрузка журнала сырья...", "Loading raw material logs...")}</p>
              </div>
            ) : filteredMovementLogs.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">{formatDual("Hozircha yozuvlar mavjud emas", "Записи не найдены", "No records found")}</p>
              </div>
            ) : (
              <>
                {/* 🖥️ DESKTOP VIEW: EXACT REPLICA OF USER'S EXCEL JOURNAL */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-dark-800/90 text-slate-300 font-extrabold uppercase border-b border-dark-700 tracking-wider">
                        <th rowSpan={2} className="p-3 text-center border-r border-dark-750 w-12">№ п/п</th>
                        <th rowSpan={2} className="p-3 border-r border-dark-750 min-w-[110px]">{formatDual("Қабул Санаси", "Дата поступления", "Arrival Date")}</th>
                        <th rowSpan={2} className="p-3 text-center border-r border-dark-750 min-w-[70px]">{formatDual("Вақти", "Время", "Time")}</th>
                        <th rowSpan={2} className="p-3 border-r border-dark-750 min-w-[140px]">{formatDual("Хомашё Номи", "Наименование", "Nomenclature")}</th>
                        <th rowSpan={2} className="p-3 border-r border-dark-750 min-w-[140px]">{formatDual("Етказиб Берувчи", "Поставщик", "Supplier")}</th>
                        <th rowSpan={2} className="p-3 text-center border-r border-dark-750 min-w-[75px]">{formatDual("Партия №", "№ Партии", "Batch №")}</th>
                        <th rowSpan={2} className="p-3 text-right border-r border-dark-750 min-w-[100px] text-emerald-400">{formatDual("Оғирлиги, кг", "Вес, кг", "Weight, kg")}</th>
                        <th colSpan={2} className="p-2 text-center border-r border-dark-750 bg-emerald-950/30 text-emerald-300">{formatDual("Сақланиш Ҳарорати, °C", "Температура сырья, °C", "Storage Temp, °C")}</th>
                        <th rowSpan={2} className="p-3 text-right border-r border-dark-750 min-w-[130px] text-amber-300">{formatDual("Цехга Берилган, кг", "Отпущено в цех, кг", "Issued to Shop")}</th>
                        <th rowSpan={2} className="p-3 text-right border-r border-dark-750 min-w-[100px] text-cyan-300">{formatDual("Цехдан Қайтган, кг", "Возврат из цеха, кг", "Returned, kg")}</th>
                        <th rowSpan={2} className="p-3 text-right border-r border-dark-750 min-w-[120px] text-white bg-dark-850/60 font-black">{formatDual("Кун Охирида Қолдиқ", "Остаток к концу дня", "Day-End Stock")}</th>
                        <th rowSpan={2} className="p-3 border-r border-dark-750 min-w-[130px]">{formatDual("Жавобгар ФИШ", "Ответственный", "Responsible")}</th>
                        <th rowSpan={2} className="p-3 text-center w-16">{formatDual("Амал", "Действие", "Action")}</th>
                      </tr>
                      <tr className="bg-dark-850 text-slate-400 text-[10px] font-bold border-b border-dark-700">
                        <th className="p-2 text-center border-r border-dark-750 bg-emerald-950/20 text-emerald-400">8:10</th>
                        <th className="p-2 text-center border-r border-dark-750 bg-emerald-950/20 text-emerald-400">17:00</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-750/70 text-slate-300 font-sans">
                      {movementLogsPagination.displayedItems.map((log, idx) => (
                        <tr key={log.id} className="hover:bg-dark-800/40 transition-colors">
                          <td className="p-3 text-center font-mono text-slate-500 border-r border-dark-750/50">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-white border-r border-dark-750/50 whitespace-nowrap">
                            {log.arrivalDate}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-400 border-r border-dark-750/50">
                            {log.deliveryTime || '-'}
                          </td>
                          <td className="p-3 font-bold text-white border-r border-dark-750/50">
                            {log.productName}
                          </td>
                          <td className="p-3 text-slate-300 border-r border-dark-750/50">
                            {log.supplierName}
                          </td>
                          <td className="p-3 text-center font-mono font-bold border-r border-dark-750/50">
                            <span className="px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                              {log.batchNumber}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400 border-r border-dark-750/50">
                            {Number(log.receivedWeightKg).toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-mono border-r border-dark-750/50 text-emerald-300 bg-emerald-950/10">
                            {log.storageTemp810 !== null ? `${log.storageTemp810}°C` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono border-r border-dark-750/50 text-emerald-300 bg-emerald-950/10">
                            {log.storageTemp1700 !== null ? `${log.storageTemp1700}°C` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-amber-300 border-r border-dark-750/50">
                            {log.issuedToProduction || (log.issuedKg ? `${Number(log.issuedKg).toLocaleString()} kg` : '-')}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-cyan-300 border-r border-dark-750/50">
                            {log.returnedFromProductionKg ? `${Number(log.returnedFromProductionKg).toLocaleString()} kg` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-white bg-dark-850/40 border-r border-dark-750/50">
                            <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-white">
                              {log.endOfDayBalanceKg !== null ? `${Number(log.endOfDayBalanceKg).toLocaleString()} kg` : '-'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 border-r border-dark-750/50">
                            {log.responsiblePerson}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditMovement(log)}
                                className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMovement(log.id)}
                                className="p-1.5 hover:bg-dark-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
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

                {/* 📱 MOBILE VIEW: RESPONSIVE CARDS */}
                <div className="block lg:hidden p-4 space-y-3">
                  {movementLogsPagination.displayedItems.map((log, idx) => (
                    <div
                      key={log.id}
                      className="bg-dark-850/70 border border-dark-750 rounded-2xl p-4 shadow-lg space-y-3"
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-dark-800 px-2 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {log.arrivalDate}
                          </span>
                          {log.deliveryTime && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({log.deliveryTime})
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold bg-dark-800 text-slate-300 px-2 py-0.5 rounded border border-dark-700">
                          Партия №{log.batchNumber}
                        </span>
                      </div>

                      {/* Product & Supplier */}
                      <div>
                        <h4 className="font-black text-white text-base">{log.productName}</h4>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building2 size={13} className="text-blue-400 shrink-0" />
                          <span>{log.supplierName}</span>
                        </div>
                      </div>

                      {/* Weight & Temperatures */}
                      <div className="grid grid-cols-2 gap-2 bg-dark-800/80 p-2.5 rounded-xl border border-dark-700/60 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Kirim og'irligi:", "Вес прихода:", "Intake weight:")}</span>
                          <span className="font-black text-emerald-400 text-sm">
                            {Number(log.receivedWeightKg).toLocaleString()} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Harorat (8:10 / 17:00):", "Темп. (8:10 / 17:00):", "Temp:")}</span>
                          <span className="font-bold text-emerald-300 text-xs">
                            {log.storageTemp810 ?? '-'}°C / {log.storageTemp1700 ?? '-'}°C
                          </span>
                        </div>
                      </div>

                      {/* Movement specifics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <span className="text-[10px] block text-amber-400/80">{formatDual("Sexga berildi:", "Отпущено в цех:", "Issued to shop:")}</span>
                          <span className="font-mono font-bold">{log.issuedToProduction || (log.issuedKg ? `${log.issuedKg} kg` : '-')}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          <span className="text-[10px] block text-cyan-400/80">{formatDual("Sexdan qaytdi:", "Возврат из цеха:", "Returned:")}</span>
                          <span className="font-mono font-bold">{log.returnedFromProductionKg ? `${log.returnedFromProductionKg} kg` : '-'}</span>
                        </div>
                      </div>

                      {/* End of day balance & Responsible */}
                      <div className="flex items-center justify-between pt-2 border-t border-dark-750 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{formatDual("Kun oxiridagi qoldiq:", "Остаток на конец дня:", "End balance:")}</span>
                          <span className="font-mono font-black text-white text-sm">
                            {log.endOfDayBalanceKg !== null ? `${Number(log.endOfDayBalanceKg).toLocaleString()} kg` : '-'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">{formatDual("Javobgar:", "Ответственный:", "Responsible:")}</span>
                          <span className="font-semibold text-slate-200">{log.responsiblePerson}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-750">
                        <button
                          onClick={() => openEditMovement(log)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700"
                        >
                          <Edit2 size={13} />
                          <span>Tahrirlash</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMovement(log.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        >
                          <Trash2 size={13} />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination footer */}
                <InfiniteTableFooter
                  currentCount={movementLogsPagination.visibleCount}
                  totalCount={movementLogsPagination.totalCount}
                  hasMore={movementLogsPagination.hasMore}
                  showAll={movementLogsPagination.showAll}
                  onLoadMore={movementLogsPagination.loadMore}
                  onToggleShowAll={movementLogsPagination.toggleShowAll}
                  sentinelRef={movementLogsPagination.sentinelRef}
                  pageSize={10}
                  itemName={{ uz: 'yozuv', ru: 'записей', en: 'records' }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: ГП (TAYYOR MAHSULOT OMBORI) */}
      {activeTab === 'gp' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-6 rounded-3xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes size={14} />
                  {formatDual("Sex Ishlab Chiqarish Natijasi", "Выпуск готовой продукции цеха", "Finished Goods Inventory")}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>{formatDual("ГП (Tayyor Mahsulot Ombori) & Balansi", "ГП (Склад готовой продукции)", "Finished Goods (FG) Warehouse")}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {formatDual(
                  "Sex Ishlab Chiqarish Hisoboti (Отчет ЦЕХ) orqali ishlab chiqarilgan barcha tayyor mahsulotlar (GP), kunlik chiqarish hajmlari va jami zaxiralar",
                  "Сводка и баланс готовой продукции цеха (ГП): объемы выпуска, даты и журнал выработки",
                  "Finished goods produced by the workshop, production volumes, and log"
                )}
              </p>
            </div>

            <button
              onClick={() => fetchMacroStats()}
              disabled={macroLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all shadow-xs hover:border-emerald-500/40"
            >
              <RefreshCw size={14} className={macroLoading ? 'animate-spin text-emerald-400' : ''} />
              <span>{formatDual("Yangilash", "Обновить", "Refresh")}</span>
            </button>
          </div>

          {/* GP Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white dark:bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                {formatDual("Jami Chiqarilgan ГП", "Всего выпущено ГП", "Total Finished Goods")}
              </span>
              <div className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-400">
                {macroData?.gp?.summary?.totalTonnes || 0} tn
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {(macroData?.gp?.summary?.totalKg || 0).toLocaleString()} kg {formatDual("qabul qilingan", "принято", "received")}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                {formatDual("Mahsulot Turlari (SKU)", "Номенклатура ГП", "Finished SKU Count")}
              </span>
              <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">
                {macroData?.gp?.summary?.itemsCount || 17} ta tur
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatDual("17 xil tayyor mahsulot", "17 наименований ГП", "17 finished items")}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                {formatDual("Ishlab Chiqarish Kunlari", "Дней выработки", "Production Days")}
              </span>
              <div className="text-lg sm:text-2xl md:text-3xl font-black text-white">
                {macroData?.gp?.summary?.daysCount || 0} kun
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatDual("Sex hisobotida qayd etilgan", "В отчете цеха", "Recorded in shop report")}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-900/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm relative overflow-hidden">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                {formatDual("O'rtacha Kunlik Chiqarish", "Среднесуточный выпуск", "Avg Daily Output")}
              </span>
              <div className="text-lg sm:text-2xl md:text-3xl font-black text-indigo-400">
                {(macroData?.gp?.summary?.avgDailyKg || 0).toLocaleString()} kg
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatDual("Bir smenada o'rtacha", "В среднем за смену", "Avg per shift")}
              </p>
            </div>
          </div>

          {/* GP Category Filter Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto no-scrollbar shadow-xs">
            {[
              { id: 'all', uz: `Barchasi (${macroData?.gp?.items?.length || 17})`, ru: `Все (${macroData?.gp?.items?.length || 17})`, en: `All (${macroData?.gp?.items?.length || 17})` },
              { id: 'Salatlar', uz: '🥗 Salatlar', ru: '🥗 Салаты', en: '🥗 Salads' },
              { id: 'Sabzavotlar', uz: '🍅 Sabzavotlar', ru: '🍅 Овощи', en: '🍅 Vegetables' },
              { id: "Ko'katlar & Boshqa", uz: '🌿 Ko\'katlar & Boshqa', ru: '🌿 Зелень & др.', en: '🌿 Herbs & other' },
              { id: 'Qadoqlash', uz: '📦 Qadoqlash', ru: '📦 Упаковка', en: '📦 Packaging' },
            ].map((cat) => {
              const isSel = gpCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setGpCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSel 
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {formatDual(cat.uz, cat.ru, cat.en)}
                </button>
              )
            })}
          </div>

          {/* GP Items Aggregated Table */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-slate-50/70 dark:bg-dark-850/50">
              <div className="flex items-center gap-2">
                <Boxes className="text-emerald-400 shrink-0" size={20} />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                  {formatDual("17 ta Tayyor Mahsulot Bo'yicha Umumiy Hajm & Balans", "Сводка выпуска и баланс 17 видов ГП", "Summary & Balance of 17 FG Items")}
                </h4>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={formatDual("Mahsulot nomi bo'yicha...", "Поиск по продукции...", "Search product...")}
                  value={gpSearch}
                  onChange={(e) => setGpSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Loading Indicator */}
            {macroLoading && !macroData ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <span className="font-bold text-slate-300 text-sm">
                  {formatDual("Tayyor mahsulotlar (ГП) statistikasi yuklanmoqda...", "Загрузка статистики ГП...", "Loading finished goods statistics...")}
                </span>
              </div>
            ) : (
              <>
                {/* Mobile View: GP Item Cards */}
                <div className="block sm:hidden divide-y divide-dark-750">
                  {filteredGpItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      {formatDual("Tayyor mahsulotlar topilmadi", "Ничего не найдено", "No finished goods found")}
                    </div>
                  ) : (
                    filteredGpItems.map((g, idx) => (
                      <div key={idx} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-white text-xs truncate block">{g.name}</span>
                              {g.category && (
                                <span className="text-[10px] text-slate-400 block">{g.category}</span>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 whitespace-nowrap">
                            ✓ Mavjud
                          </span>
                        </div>

                        {/* Progress Bar for Share % */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Umumiy hajmdagi ulushi:</span>
                            <span className="font-bold text-emerald-400 font-mono">{g.sharePercent || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(Math.max(g.sharePercent || 0, 3), 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-dark-800/60 p-2.5 rounded-xl border border-dark-700/60 text-center">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Jami Hajm</div>
                            <div className="font-black text-emerald-400 text-xs mt-0.5">
                              {g.totalTonnes >= 1 ? `${g.totalTonnes} tn` : `${g.totalKg.toLocaleString()} ${g.unit}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Ish Kunlari</div>
                            <div className="font-bold text-slate-200 text-xs mt-0.5">
                              {g.daysCount} kun
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">O'rtacha/kun</div>
                            <div className="font-mono text-[10px] text-cyan-300 mt-0.5">
                              {g.avgPerDayKg ? `${g.avgPerDayKg} kg` : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop View: GP Items Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-dark-750 bg-dark-800/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">{formatDual("Tayyor Mahsulot Nomi", "Готовая продукция", "Product Name")}</th>
                        <th className="p-4">{formatDual("Kategoriya", "Категория", "Category")}</th>
                        <th className="p-4 text-center">{formatDual("Jami Ishlab Chiqarilgan", "Всего выработано", "Total Produced")}</th>
                        <th className="p-4 text-center">{formatDual("Hajmdagi Ulushi (%)", "Доля в выпуске (%)", "Share (%)")}</th>
                        <th className="p-4 text-center">{formatDual("Ish Kunlari", "Дней производства", "Days Count")}</th>
                        <th className="p-4 text-center">{formatDual("O'rtacha / Kun", "В среднем / день", "Avg / Day")}</th>
                        <th className="p-4 text-center">{formatDual("Oxirgi Chiqarilgan Sana", "Последняя дата", "Last Date")}</th>
                        <th className="p-4 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-750">
                      {filteredGpItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-500">
                            {formatDual("Tayyor mahsulotlar topilmadi", "Ничего не найдено", "No finished goods found")}
                          </td>
                        </tr>
                      ) : (
                        filteredGpItems.map((g, idx) => (
                          <tr key={idx} className="hover:bg-dark-800/30 transition-colors">
                            <td className="p-4 font-black text-white text-base flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
                                {idx + 1}
                              </span>
                              <span>{g.name}</span>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-xl bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-300">
                                {g.category || 'GP'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="font-black text-emerald-400 text-base">
                                {g.totalTonnes >= 1 ? `${g.totalTonnes} tn` : `${g.totalKg.toLocaleString()} ${g.unit}`}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {g.totalKg.toLocaleString()} {g.unit}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="w-28 mx-auto space-y-1">
                                <div className="text-xs font-mono font-bold text-emerald-400 text-right">
                                  {g.sharePercent || 0}%
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-dark-800 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                                    style={{ width: `${Math.min(Math.max(g.sharePercent || 0, 3), 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl bg-dark-800 border border-dark-700 font-bold text-xs text-slate-200">
                                {g.daysCount} kun
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono text-xs font-bold text-cyan-300">
                              {g.avgPerDayKg ? `${g.avgPerDayKg} kg` : '-'}
                            </td>
                            <td className="p-4 text-center font-mono text-xs text-slate-300">
                              {g.lastDate}
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ✓ Omborda mavjud
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Daily Output Logs */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-dark-750 flex items-center justify-between gap-4 bg-dark-850/50">
              <div className="flex items-center gap-2">
                <Calendar className="text-cyan-400 shrink-0" size={20} />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                  {formatDual("Kunlik Ishlab Chiqarish Jurnali (Выпуск ГП)", "Журнал ежедневного выпуска ГП", "Daily Finished Goods Logs")}
                </h4>
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                {gpLogsPagination.totalCount} ta yozuv
              </div>
            </div>

            {/* Mobile View: Daily Logs Cards */}
            <div className="block sm:hidden divide-y divide-dark-750">
              {gpLogsPagination.displayedItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {formatDual("Yozuvlar topilmadi", "Записи не найдены", "No records found")}
                </div>
              ) : (
                gpLogsPagination.displayedItems.map((log, lIdx) => (
                  <div key={lIdx} className="p-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-white text-xs truncate">{log.product}</div>
                      <div className="font-mono text-[11px] text-slate-400">{log.date}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-cyan-400 text-xs sm:text-sm">
                        {log.quantityKg.toLocaleString()} {log.unit}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Qabul
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Daily Logs Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-dark-750 bg-dark-800/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">{formatDual("Sana", "Дата", "Date")}</th>
                    <th className="p-4">{formatDual("Tayyor Mahsulot", "Продукция", "Product")}</th>
                    <th className="p-4 text-center">{formatDual("Ishlab Chiqarilgan Miqdor", "Выработано", "Quantity")}</th>
                    <th className="p-4 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750">
                  {gpLogsPagination.displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500">
                        {formatDual("Yozuvlar topilmadi", "Записи не найдены", "No records found")}
                      </td>
                    </tr>
                  ) : (
                    gpLogsPagination.displayedItems.map((log, lIdx) => (
                      <tr key={lIdx} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-white text-xs">
                          {log.date}
                        </td>
                        <td className="p-4 font-bold text-white">
                          {log.product}
                        </td>
                        <td className="p-4 text-center font-black text-cyan-400">
                          {log.quantityKg.toLocaleString()} {log.unit}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Qabul qilingan
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <InfiniteTableFooter
              currentCount={gpLogsPagination.visibleCount}
              totalCount={gpLogsPagination.totalCount}
              hasMore={gpLogsPagination.hasMore}
              showAll={gpLogsPagination.showAll}
              onLoadMore={gpLogsPagination.loadMore}
              onToggleShowAll={gpLogsPagination.toggleShowAll}
              sentinelRef={gpLogsPagination.sentinelRef}
              pageSize={15}
              itemName={{ uz: 'yozuv', ru: 'записей', en: 'records' }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: TRANSFERS & DISPATCH (TWO-WAY HANDSHAKE) */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-5 rounded-2xl shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
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
              <span>{formatDual("Yangi Chiqim Berish", "Новый отпуск сырья", "New Dispatch")}</span>
            </button>
          </div>

          {/* Transfers Table */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            {transfersLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                <p className="text-slate-400 text-sm font-medium">{formatDual("Chiqimlar yuklanmoqda...", "Загрузка перемещений...", "Loading dispatches...")}</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Scale size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">{formatDual("Hozircha chiqim transferlari yo'q", "Пока нет перемещений", "No dispatches yet")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800/40 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">{formatDual("Hujjat Raqami & Sana", "№ Документа & Дата", "Doc № & Date")}</th>
                      <th className="p-4">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                      <th className="p-4">{formatDual("Qayerga", "Куда", "Destination")}</th>
                      <th className="p-4 text-center">{formatDual("Sklad Bergan", "Отпущено со склада", "Warehouse Issued")}</th>
                      <th className="p-4 text-center">{formatDual("Qabul Qilingan", "Принято", "Received")}</th>
                      <th className="p-4 text-center">{formatDual("Farq / Yo'qotish", "Разница / Потери", "Difference / Loss")}</th>
                      <th className="p-4">{formatDual("Holat / Izoh", "Статус / Примечание", "Status / Notes")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {transfersPagination.displayedItems.map((t) => (
                      <tr key={t.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-300">
                          <div className="font-bold text-emerald-400">{t.transferNumber}</div>
                          <div className="text-slate-500">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        </td>
                        <td className="p-4 font-bold text-white">
                          {t.product?.name}
                        </td>
                        <td className="p-4 text-slate-300 font-semibold text-xs">
                          {t.targetLocation === 'OSHXONA' ? formatDual("🍲 Oshxona", "🍲 Кухня", "🍲 Kitchen") : formatDual("🔪 Zagotovka", "🔪 Заготовка", "🔪 Preparation")}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {t.issuedQuantity} {t.issuedUnit}
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {t.receivedQuantity !== null && t.receivedQuantity !== undefined ? (
                            <span className="text-emerald-400">{t.receivedQuantity} {t.issuedUnit}</span>
                          ) : (
                            <span className="text-amber-400 italic text-xs">{formatDual("Kutilmoqda...", "Ожидается...", "Pending...")}</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {t.discrepancy && Math.abs(t.discrepancy) > 0 ? (
                            <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              -{t.discrepancy.toFixed(2)} {t.issuedUnit}
                            </span>
                          ) : t.receivedQuantity !== null ? (
                            <span className="text-emerald-400">{formatDual("0.00 (Mos)", "0.00 (Совпадает)", "0.00 (Match)")}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {t.status === 'IN_TRANSIT' && (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {formatDual("Tranzitda (Qabul kutilmoqda)", "В пути (Ожидает приемки)", "In Transit (Awaiting)")}
                            </span>
                          )}
                          {t.status === 'ACCEPTED' && (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {formatDual("To'liq qabul qilindi", "Полностью принято", "Fully accepted")}
                            </span>
                          )}
                          {t.status === 'DISCREPANCY' && (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {formatDual("Farq aniqlandi", "Выявлена разница", "Discrepancy detected")}
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

            {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
            {!loading && transfers.length > 0 && (
              <InfiniteTableFooter
                currentCount={transfersPagination.visibleCount}
                totalCount={transfersPagination.totalCount}
                hasMore={transfersPagination.hasMore}
                showAll={transfersPagination.showAll}
                onLoadMore={transfersPagination.loadMore}
                onToggleShowAll={transfersPagination.toggleShowAll}
                sentinelRef={transfersPagination.sentinelRef}
                pageSize={10}
                itemName={{ uz: 'chiqim hujjati', ru: 'документов', en: 'documents' }}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPERATURE LOG */}
      {activeTab === 'temperature' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-5 rounded-2xl shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
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

          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
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
                    <tr className="border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800/40 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
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
                    {tempLogsPagination.displayedItems.map((log) => (
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

            {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
            {!tempLoading && filteredTempLogs.length > 0 && (
              <InfiniteTableFooter
                currentCount={tempLogsPagination.visibleCount}
                totalCount={tempLogsPagination.totalCount}
                hasMore={tempLogsPagination.hasMore}
                showAll={tempLogsPagination.showAll}
                onLoadMore={tempLogsPagination.loadMore}
                onToggleShowAll={tempLogsPagination.toggleShowAll}
                sentinelRef={tempLogsPagination.sentinelRef}
                pageSize={10}
                itemName={{ uz: 'harorat yozuvi', ru: 'записей', en: 'logs' }}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUPPLIERS (YETKAZIB BERUVCHILAR / PASTAFSHIKLAR) */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-6 rounded-3xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} />
                  {formatDual("Ta'minot Boshqaruvi", "Управление поставками", "Supply Management")}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>{formatDual("Ta'minotchilar (Yetkazib Beruvchilar) Nazorati", "Реестр и статистика поставщиков сырья", "Suppliers Registry & Analytics")}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {formatDual(
                  "Korxonaga xomashyo yetkazib bergan barcha pastafshiklar, yetkazilgan umumiy hajmlar, partiyalar soni va zudlik bilan yangi buyurtma yuborish",
                  "Все поставщики сырья, общий объем поставок, количество партий и быстрая отправка заказов",
                  "All raw material suppliers, delivered volumes, delivery count, and fast ordering"
                )}
              </p>
            </div>

            <button
              onClick={() => fetchMacroStats()}
              disabled={macroLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all shadow-xs hover:border-emerald-500/40"
            >
              <RefreshCw size={14} className={macroLoading ? 'animate-spin text-emerald-400' : ''} />
              <span>{formatDual("Yangilash", "Обновить", "Refresh")}</span>
            </button>
          </div>

          {/* Supplier KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-900/90 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                {formatDual("Jami Hamkorlar", "Всего поставщиков", "Total Suppliers")}
              </span>
              <div className="text-2xl md:text-3xl font-black text-white">
                {macroData?.suppliers.length || 0} ta
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formatDual("Doimiy ro'yxatdan o'tgan pastafshiklar", "Зарегистрированные поставщики", "Registered suppliers")}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-900/90 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                {formatDual("Jami Keltirilgan Yuk", "Общий объем поставок", "Total Delivered Volume")}
              </span>
              <div className="text-2xl md:text-3xl font-black text-emerald-400">
                {macroData?.summary.totalArrivalTonnes || 0} tn
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {macroData?.summary.totalArrivalKg.toLocaleString() || 0} kg {formatDual("xomashyo qabul qilingan", "сырья принято", "raw materials received")}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-900/90 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                {formatDual("Eng Yirik Hamkor", "Главный поставщик", "Top Supplier Partner")}
              </span>
              <div className="text-xl md:text-2xl font-black text-white truncate" title={macroData?.suppliers[0]?.name || '-'}>
                {macroData?.suppliers[0]?.name || '-'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {macroData?.suppliers[0]?.totalTonnes || 0} tn {formatDual("yetkazib bergan", "поставлено", "delivered")}
              </p>
            </div>
          </div>

          {/* Suppliers Table Container */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-dark-850/50">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={formatDual(
                    "Ta'minotchi nomi, mahsuloti yoki telefoni bo'yicha...",
                    "Поиск по поставщику, продукту или телефону...",
                    "Search supplier, product or phone..."
                  )}
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                {formatDual(
                  `Topildi: ${filteredSuppliers.length} ta ta'minotchi`,
                  `Найдено: ${filteredSuppliers.length} поставщиков`,
                  `Found: ${filteredSuppliers.length} suppliers`
                )}
              </div>
            </div>

            {/* Mobile View: Supplier Cards */}
            <div className="block sm:hidden divide-y divide-dark-750">
              {macroLoading && !macroData ? (
                <div className="p-10 text-center text-slate-400">
                  <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={24} />
                  <span className="text-xs">{formatDual("Ta'minotchilar yuklanmoqda...", "Загрузка поставщиков...", "Loading suppliers...")}</span>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <Truck size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{formatDual("Ta'minotchi topilmadi", "Поставщики не найдены", "No suppliers found")}</p>
                </div>
              ) : (
                filteredSuppliers.map((s, idx) => (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-xs truncate">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {s.contactPerson}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <ShieldCheck size={11} />
                        <span>{s.status}</span>
                      </span>
                    </div>

                    {s.products.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.products.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700 text-[10px] font-medium text-emerald-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 bg-dark-800/60 p-2.5 rounded-xl border border-dark-700/60 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Jami Yuk</div>
                        <div className="font-black text-white text-xs mt-0.5">
                          {s.totalTonnes >= 1 ? `${s.totalTonnes} tn` : `${s.totalKg.toLocaleString()} kg`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Partiyalar</div>
                        <div className="font-bold text-slate-200 text-xs mt-0.5">
                          {s.deliveriesCount} ta
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Oxirgi Yuk</div>
                        <div className="font-mono text-[10px] text-slate-300 mt-0.5">
                          {s.lastDeliveryDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <a
                        href={`tel:${s.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 py-1"
                      >
                        <Phone size={13} />
                        <span>{s.phone}</span>
                      </a>

                      <button
                        onClick={() => handleOpenSupplierOrder(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow hover:shadow-amber-500/10"
                      >
                        <ShoppingCart size={13} />
                        <span>{formatDual("Buyurtma", "Заказать", "Order")}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Suppliers Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-dark-750 bg-dark-800/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">{formatDual("Ta'minotchi (Korxona)", "Поставщик / Организация", "Supplier Organization")}</th>
                    <th className="p-4">{formatDual("Keltirgan Mahsulotlari", "Поставляемая продукция", "Supplied Products")}</th>
                    <th className="p-4 text-center">{formatDual("Jami Yetkazilgan Yuk", "Общий объем", "Total Volume")}</th>
                    <th className="p-4 text-center">{formatDual("Partiyalar", "Партий", "Batches")}</th>
                    <th className="p-4 text-center">{formatDual("Oxirgi Yetkazish", "Посл. поставка", "Last Delivery")}</th>
                    <th className="p-4">{formatDual("Aloqa / Telefon", "Контакты", "Contact")}</th>
                    <th className="p-4 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                    <th className="p-4 text-right">{formatDual("Buyurtma", "Заказ", "Order")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750">
                  {macroLoading && !macroData ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
                        <span>{formatDual("Ta'minotchilar yuklanmoqda...", "Загрузка поставщиков...", "Loading suppliers...")}</span>
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        <Truck size={36} className="mx-auto mb-2 opacity-30" />
                        <p>{formatDual("Ta'minotchi topilmadi", "Поставщики не найдены", "No suppliers found")}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s, idx) => (
                      <tr key={idx} className="hover:bg-dark-800/30 transition-colors">
                        {/* Supplier Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-sm">
                                {s.name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {s.contactPerson}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Products tags */}
                        <td className="p-4 max-w-[240px]">
                          <div className="flex flex-wrap gap-1">
                            {s.products.length > 0 ? (
                              s.products.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700 text-[11px] font-medium text-emerald-300"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </div>
                        </td>

                        {/* Total Volume */}
                        <td className="p-4 text-center">
                          <div className="font-black text-white text-base">
                            {s.totalTonnes >= 1 ? `${s.totalTonnes} tn` : `${s.totalKg.toLocaleString()} kg`}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {s.totalKg.toLocaleString()} kg
                          </div>
                        </td>

                        {/* Deliveries Count */}
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-xl bg-dark-800 border border-dark-700 font-bold text-xs text-slate-200">
                            {s.deliveriesCount} ta
                          </span>
                        </td>

                        {/* Last Delivery Date */}
                        <td className="p-4 text-center text-xs font-mono text-slate-300">
                          {s.lastDeliveryDate}
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <a
                            href={`tel:${s.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Phone size={13} />
                            <span>{s.phone}</span>
                          </a>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck size={12} />
                            <span>{s.status}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenSupplierOrder(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow hover:shadow-amber-500/10"
                            title="Ushbu ta'minotchiga yangi buyurtma yuborish"
                          >
                            <ShoppingCart size={13} />
                            <span>{formatDual("Buyurtma", "Заказать", "Order")}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
            className="w-full max-w-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{formatDual("Skladdan Chiqim Berish", "Отпуск сырья со склада", "Warehouse Dispatch")}</h3>
                  <p className="text-xs text-slate-400">{formatDual("Oshxona yoki Zagotovkaga xomashyo o'tkazish", "Перемещение сырья на кухню или в заготовку", "Transfer raw materials to Kitchen or Prep")}</p>
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
              {/* Product selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Mahsulot", "Продукт", "Product")} <span className="text-red-400">*</span>
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
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{formatDual("Mahsulotni tanlang...", "Выберите продукт...", "Select product...")}</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Qoldiq: {p.totalQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Location - Touch Friendly Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Qayerga berilmoqda?", "Куда отпускается?", "Destination")} <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferForm({ ...transferForm, targetLocation: 'OSHXONA' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      transferForm.targetLocation === 'OSHXONA'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-base">🍲</span>
                    <span>{formatDual("Oshxona", "Кухня", "Kitchen")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferForm({ ...transferForm, targetLocation: 'ZAGOTOVKA' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      transferForm.targetLocation === 'ZAGOTOVKA'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-base">🔪</span>
                    <span>{formatDual("Zagotovka Sexi", "Цех заготовки", "Prep Shop")}</span>
                  </button>
                </div>
              </div>

              {/* FEFO Batches Display */}
              {selectedTransferProduct && (
                <div className="bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Layers size={13} />
                      <span>FEFO Partiyalar Nazorati ({selectedTransferProduct.batches.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Jami: <strong className="text-slate-900 dark:text-white">{selectedTransferProduct.totalQuantity} {selectedTransferProduct.unit}</strong>
                    </span>
                  </div>

                  {selectedTransferProduct.batches.length === 0 ? (
                    <p className="text-xs text-red-400 italic text-center py-2">
                      Omborda tasdiqlangan partiya qolmagan!
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {selectedTransferProduct.batches.map((b, idx) => {
                        const isActive = idx === 0
                        return (
                          <div
                            key={b.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                                : 'bg-white dark:bg-dark-800/80 border-slate-200 dark:border-dark-700 text-slate-500 dark:text-slate-400 opacity-65'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                  isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-dark-700 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-mono font-bold text-slate-800 dark:text-white">
                                  Partiya #{b.batchNumber}
                                </span>
                                {b.expirationDate && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                                    Muddati: {new Date(b.expirationDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                                    {typeof b.daysUntilExpiry === 'number' && (
                                      <span
                                        className={`ml-1 font-bold ${
                                          b.daysUntilExpiry <= 2
                                            ? 'text-red-500'
                                            : b.daysUntilExpiry <= 5
                                            ? 'text-amber-500'
                                            : 'text-slate-400'
                                        }`}
                                      >
                                        ({b.daysUntilExpiry > 0 ? `${b.daysUntilExpiry}k` : 'tugadi!'})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                                {b.quantity} {selectedTransferProduct.unit}
                              </span>
                              {isActive ? (
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                  <span>⚡ Aktiv</span>
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] bg-slate-200 dark:bg-dark-700 text-slate-500 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                  title="1-partiya tugagach ochiladi"
                                >
                                  <span>🔒 Navbatda</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Input with Quick Fill Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {formatDual("Chiqariladigan Miqdor", "Отпускаемое количество", "Issue Quantity")} ({transferForm.issuedUnit}) <span className="text-red-400">*</span>
                  </label>
                  {selectedTransferProduct?.batches?.[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        setTransferForm({
                          ...transferForm,
                          issuedQuantity: selectedTransferProduct.batches[0].quantity.toString()
                        })
                      }
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      1-partiyani to'liq berish ({selectedTransferProduct.batches[0].quantity} {selectedTransferProduct.unit})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder="Masalan: 30"
                  value={transferForm.issuedQuantity}
                  onChange={(e) => setTransferForm({ ...transferForm, issuedQuantity: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-base focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />

                {/* Quick amount increments for mobile touch */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 mr-0.5">Tezkor:</span>
                  {[5, 10, 20, 50].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(transferForm.issuedQuantity) || 0
                        setTransferForm({ ...transferForm, issuedQuantity: (current + v).toString() })
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-200 cursor-pointer"
                    >
                      +{v}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferForm({ ...transferForm, issuedQuantity: '' })}
                    className="text-xs font-semibold px-2 py-1 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    Tozalash
                  </button>
                </div>

                {/* Multi-batch allocation notice */}
                {selectedTransferProduct?.batches?.[0] &&
                  parseFloat(transferForm.issuedQuantity) > selectedTransferProduct.batches[0].quantity && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-500" />
                        <span>FEFO ketma-ket taqsimot:</span>
                      </div>
                      <p className="text-[11px] leading-tight">
                        1-partiya (#{selectedTransferProduct.batches[0].batchNumber}) dan <strong>{selectedTransferProduct.batches[0].quantity} {selectedTransferProduct.unit}</strong> to'liq yopiladi,
                        qolgan <strong>{(parseFloat(transferForm.issuedQuantity) - selectedTransferProduct.batches[0].quantity).toFixed(2)} {selectedTransferProduct.unit}</strong> esa keyingi 2-partiyadan olinadi.
                      </p>
                    </div>
                  )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {formatDual("Izoh (Ixtiyoriy)", "Примечание", "Notes")}
                </label>
                <input
                  type="text"
                  placeholder="Chiqim bo'yicha qo'shimcha izoh..."
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingTransfer || !selectedTransferProduct?.batches?.length}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingTransfer && <Loader2 size={15} className="animate-spin" />}
                  <span>{formatDual("Chiqimni Yuborish (FEFO)", "Отправить по FEFO", "Submit Dispatch (FEFO)")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ZONE */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setShowZoneModal(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Package size={20} className="text-emerald-600 dark:text-emerald-400" /> Zona Tanlash</h2>
              <button onClick={() => setShowZoneModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Omborxonadagi Zona</label>
                <select 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm"
                  value={showZoneModal.currentZoneId || ''}
                  onChange={e => setShowZoneModal({...showZoneModal, currentZoneId: e.target.value ? Number(e.target.value) : null})}
                >
                  <option value="">Belgilash...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.warehouse.name})</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-dark-800/50 flex justify-end gap-3 border-t border-slate-200 dark:border-dark-800">
              <button onClick={() => setShowZoneModal(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700">Bekor qilish</button>
              <button onClick={() => handleUpdateZone(showZoneModal.batchId, showZoneModal.currentZoneId)} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RAW MATERIAL MOVEMENT LOG */}
      {showMovementModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setShowMovementModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingMovementId
                      ? (lang === 'ru' ? 'Редактировать запись перемещения' : "Xomashyo harakati yozuvini tahrirlash")
                      : (lang === 'ru' ? 'Новая запись в журнал перемещения' : "Yangi Xomashyo Harakati Yozuvi")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Журнал регистрации и перемещения основного сырья", "Регистрация поступления и отпуска в цех", "Raw material movement registration")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMovementModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4 pt-4">
              {/* Row 1: Date, Time & Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Qabul Sanasi", "Дата поступления", "Arrival Date")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={movementForm.arrivalDate}
                    onChange={(e) => setMovementForm({ ...movementForm, arrivalDate: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kelgan Vaqti", "Время поставки", "Delivery Time")}
                  </label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={movementForm.deliveryTime}
                    onChange={(e) => setMovementForm({ ...movementForm, deliveryTime: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Partiya Raqami", "№ Партии", "Batch №")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1"
                    value={movementForm.batchNumber}
                    onChange={(e) => setMovementForm({ ...movementForm, batchNumber: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Product & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Xomashyo Nomi", "Наименование сырья", "Raw Material Name")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="movement-products-list"
                    placeholder="САЛАТ АЙЗБЕРГ, ТОМАТ..."
                    value={movementForm.productName}
                    onChange={(e) => setMovementForm({ ...movementForm, productName: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <datalist id="movement-products-list">
                    {inventory.map((p: any) => (
                      <option key={p.id} value={p.name} />
                    ))}
                    <option value="САЛАТ АЙЗБЕРГ" />
                    <option value="ТОМАТ" />
                    <option value="Каром" />
                    <option value="Лук" />
                    <option value="Сабзи" />
                    <option value="Огурцы" />
                    <option value="Лимон" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Yetkazib Beruvchi", "Поставщик", "Supplier")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="movement-suppliers-list"
                    placeholder="КИБРАЙ БАРАКА, Zokir AND..."
                    value={movementForm.supplierName}
                    onChange={(e) => setMovementForm({ ...movementForm, supplierName: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <datalist id="movement-suppliers-list">
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.name} />
                    ))}
                    <option value="КИБРАЙ БАРАКА" />
                    <option value="Zokir AND" />
                    <option value="Nazarov 22" />
                    <option value="MadinaBonu" />
                  </datalist>
                </div>
              </div>

              {/* Row 3: Intake Weight & Storage Temperatures */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kirim Og'irligi (kg)", "Вес прихода (кг)", "Intake Weight (kg)")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="395.4"
                    value={movementForm.receivedWeightKg}
                    onChange={(e) => setMovementForm({ ...movementForm, receivedWeightKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Harorat 8:10 (°C)", "Температура 8:10", "Temp 8:10")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.4"
                    value={movementForm.storageTemp810}
                    onChange={(e) => setMovementForm({ ...movementForm, storageTemp810: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Harorat 17:00 (°C)", "Температура 17:00", "Temp 17:00")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1.5"
                    value={movementForm.storageTemp1700}
                    onChange={(e) => setMovementForm({ ...movementForm, storageTemp1700: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Dispatched, Returned & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Sexga Berilgan (kg)", "Отпущено в цех (кг)", "Issued to Shop (kg)")}
                  </label>
                  <input
                    type="text"
                    placeholder="Айзберг 1874.1 yoki 1874"
                    value={movementForm.issuedToProduction}
                    onChange={(e) => {
                      const v = e.target.value
                      setMovementForm({
                        ...movementForm,
                        issuedToProduction: v,
                        issuedKg: v.replace(/[^\d.]/g, '') || ''
                      })
                    }}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-amber-300 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Sexdan Qaytgan (kg)", "Возврат из цеха (кг)", "Returned (kg)")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="90.4"
                    value={movementForm.returnedFromProductionKg}
                    onChange={(e) => setMovementForm({ ...movementForm, returnedFromProductionKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-cyan-300 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Kun Qoldig'i (kg)", "Остаток на конец дня", "Day-End Stock")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={(() => {
                      const r = parseFloat(movementForm.receivedWeightKg) || 0
                      const i = parseFloat(movementForm.issuedKg) || (movementForm.issuedToProduction ? parseFloat(movementForm.issuedToProduction.replace(/[^\d.]/g, '')) || 0 : 0)
                      const ret = parseFloat(movementForm.returnedFromProductionKg) || 0
                      return Math.max(0, r - i + ret).toFixed(1)
                    })()}
                    value={movementForm.endOfDayBalanceKg}
                    onChange={(e) => setMovementForm({ ...movementForm, endOfDayBalanceKg: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 5: Responsible & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Javobgar Shaxs (F.I.Sh)", "Ответственный (ФИО)", "Responsible Person")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Исаков М."
                    value={movementForm.responsiblePerson}
                    onChange={(e) => setMovementForm({ ...movementForm, responsiblePerson: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {formatDual("Izoh", "Примечание", "Notes")}
                  </label>
                  <input
                    type="text"
                    placeholder="Qo'shimcha izoh..."
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingMovement}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {savingMovement && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
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
            className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3 w-full sm:w-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowTempModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
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

      {/* MODAL: DIRECT WAREHOUSE INTAKE (KIRIM QILISH) */}
      {showReceiveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter overflow-y-auto"
          onClick={() => setShowReceiveModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatDual("Omborga Mahsulot Kirim Qilish", "Приемка сырья на склад", "Warehouse Stock Intake")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Partiya, yetkazib beruvchi, muddat va rasm bilan qabul qilish", "Приход с партией, поставщиком, сроком и фото", "Intake with batch, supplier, expiry and photo")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReceive} className="space-y-4 pt-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Toggle: Existing vs New Product */}
              <div className="flex flex-wrap gap-2 rounded-xl bg-dark-800 p-1 border border-dark-700">
                <button
                  type="button"
                  onClick={() => setReceiveForm({ ...receiveForm, isNewProduct: false })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !receiveForm.isNewProduct ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Mavjud Mahsulotni Tanlash", "Выбрать существующий", "Select Existing")}
                </button>
                <button
                  type="button"
                  onClick={() => setReceiveForm({ ...receiveForm, isNewProduct: true, productId: '' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    receiveForm.isNewProduct ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("+ Yangi Mahsulot Ochish", "+ Новый продукт", "+ Create New Product")}
                </button>
              </div>

              {/* Product Selection / Creation */}
              {!receiveForm.isNewProduct ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Mahsulot", "Продукт", "Product")} <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={receiveForm.productId}
                    onChange={(e) => {
                      const p = inventory.find(i => i.id === parseInt(e.target.value))
                      setReceiveForm({
                        ...receiveForm,
                        productId: e.target.value,
                        unit: p?.unit || 'kg',
                        category: p?.category || 'Xomashyo'
                      })
                    }}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{formatDual("Mahsulotni tanlang...", "Выберите продукт...", "Select product...")}</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.code ? `(${item.code})` : ''} - Joriy: {item.totalQuantity} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-dark-800/60 rounded-2xl border border-dark-700">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      {formatDual("Yangi Mahsulot Nomi", "Название нового продукта", "New Product Name")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Go'sht (Mol lahm), Pomidor, Un..."
                      value={receiveForm.newProductName}
                      onChange={(e) => setReceiveForm({ ...receiveForm, newProductName: e.target.value })}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        {formatDual("Kategoriya", "Категория", "Category")}
                      </label>
                      <input
                        type="text"
                        placeholder="Xomashyo, Sabzavot, Go'sht..."
                        value={receiveForm.category}
                        onChange={(e) => setReceiveForm({ ...receiveForm, category: e.target.value })}
                        className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        {formatDual("Birlik", "Единица", "Unit")}
                      </label>
                      <select
                        value={receiveForm.unit}
                        onChange={(e) => setReceiveForm({ ...receiveForm, unit: e.target.value })}
                        className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="kg">kg (Kilogramm)</option>
                        <option value="dona">dona (Штук)</option>
                        <option value="litr">litr (Литр)</option>
                        <option value="gramm">gramm (Грамм)</option>
                        <option value="qop">qop (Мешок)</option>
                        <option value="karobka">karobka (Коробка)</option>
                        <option value="metr">metr (Метр)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kirim Miqdori", "Количество", "Quantity")} ({receiveForm.unit}) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Masalan: 50"
                    value={receiveForm.quantity}
                    onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-base focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Partiya Raqami", "Номер партии", "Batch Number")}
                  </label>
                  <input
                    type="text"
                    placeholder="Avto-generatsiya..."
                    value={receiveForm.batchNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Yaroqlilik muddati (FEFO)", "Срок годности (FEFO)", "Expiry Date")}
                  </label>
                  <input
                    type="date"
                    value={receiveForm.expirationDate}
                    onChange={(e) => setReceiveForm({ ...receiveForm, expirationDate: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Supplier & Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Yetkazib Beruvchi", "Поставщик", "Supplier")}
                  </label>
                  <select
                    value={receiveForm.supplierId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplierId: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{formatDual("Tanlang (Ixtiyoriy)...", "Выберите (Опционально)...", "Select (Optional)...")}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Saqlash Zonasi", "Зона хранения", "Storage Zone")}
                  </label>
                  <select
                    value={receiveForm.zoneId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, zoneId: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{formatDual("Zonani tanlang...", "Выберите зону...", "Select zone...")}</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.warehouse?.name || 'Ombor'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cost, Temp, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Ta'minotchi Hujjati / Nakladnoy", "Номер накладной / партии", "Supplier Batch / Doc")}
                  </label>
                  <input
                    type="text"
                    placeholder="M: N-4819"
                    value={receiveForm.supplierBatchNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplierBatchNumber: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelish Harorati (°C)", "Температура привоза (°C)", "Arrival Temp (°C)")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Masalan: 3.5"
                    value={receiveForm.arrivalTemperature}
                    onChange={(e) => setReceiveForm({ ...receiveForm, arrivalTemperature: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kirim Sanasi", "Дата прихода", "Intake Date")}
                  </label>
                  <input
                    type="date"
                    value={receiveForm.receivedAt}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivedAt: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="p-4 bg-dark-800/80 rounded-2xl border border-dark-700 space-y-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase flex items-center gap-2">
                    <Camera size={16} className="text-emerald-400" />
                    <span>{formatDual("Partiya / Mahsulot Rasmi", "Фото партии / сырья", "Batch / Product Photo")}</span>
                  </label>
                  {receiveForm.arrivalPhotoUrl && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={14} /> {formatDual("Rasm biriktirildi", "Фото прикреплено", "Photo attached")}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  id="warehouse-receive-photo-input"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceivePhotoUpload}
                  className="hidden"
                />

                {receiveForm.arrivalPhotoUrl ? (
                  <div className="flex items-center gap-4 bg-dark-900 p-3 rounded-xl border border-dark-750">
                    <img
                      src={receiveForm.arrivalPhotoUrl}
                      alt="Partiya rasmi"
                      onClick={() => setPreviewPhotoModal({ url: receiveForm.arrivalPhotoUrl, title: "Kirim rasmi" })}
                      className="w-20 h-20 rounded-xl object-cover border border-emerald-500/40 cursor-pointer hover:opacity-90 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 font-medium truncate mb-1">
                        {receiveForm.arrivalPhotoUrl.split('/').pop()}
                      </p>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="warehouse-receive-photo-input"
                          className="px-3 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg cursor-pointer transition-colors"
                        >
                          {formatDual("O'zgartirish", "Изменить", "Change")}
                        </label>
                        <button
                          type="button"
                          onClick={() => setReceiveForm({ ...receiveForm, arrivalPhotoUrl: '' })}
                          className="px-3 py-1 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          {formatDual("O'chirish", "Удалить", "Remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="warehouse-receive-photo-input"
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-dark-600 hover:border-emerald-500/50 rounded-2xl cursor-pointer bg-dark-900/40 hover:bg-dark-900 transition-all text-center group"
                  >
                    {uploadingReceivePhoto ? (
                      <div className="flex items-center gap-2 text-emerald-400 py-3">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-sm font-semibold">{formatDual("Rasm yuklanmoqda...", "Загрузка фото...", "Uploading photo...")}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 transition-colors">
                          <Camera size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-200">
                          {formatDual("Kamera orqali rasmga oling yoki fayl tanlang", "Сфотографировать на камеру или выбрать файл", "Take photo with camera or choose file")}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatDual("Skladchilar telefonidan bevosita rasmga olib yuklashi mumkin", "Складчик может сразу сделать фото с телефона", "Warehouse staff can take photos directly from smartphone")}
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Izoh / Holati", "Примечание / Состояние", "Notes / Condition")}
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Mahsulot sifatli yetib keldi, qadoqlari butun..."
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap gap-2 items-center justify-end pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={receiveLoading || uploadingReceivePhoto}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {receiveLoading && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Omborga Qabul Qilish & Saqlash", "Принять на склад и сохранить", "Receive & Save Intake")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW PHOTO LIGHTBOX */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-enter"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-dark-800">
              <div className="flex items-center gap-2">
                <Camera className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold text-white">{previewPhotoModal.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 text-xs flex items-center gap-1"
                  title="Asl o'lchamda ochish"
                >
                  <ExternalLink size={16} />
                </a>
                <button 
                  onClick={() => setPreviewPhotoModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden bg-dark-950/60 rounded-2xl my-2">
              <img
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER TO SUPPLY (TA'MINOTGA ZAYAVKA / BUYURTMA) */}
      {showOrderModal && orderingItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter overflow-y-auto"
          onClick={() => setShowOrderModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatDual("Ta'minotga Zayavka (Buyurtma)", "Заявка в отдел снабжения", "Purchase Request")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Kamaygan xomashyoni sotib olish uchun talabnoma yuborish", "Отправка заявки на закупку сырья в снабжение и общий чат", "Send order request to supply and chat")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 pt-4">
              {/* Product Info Card */}
              <div className="p-4 bg-dark-800/80 rounded-2xl border border-dark-700 flex flex-wrap gap-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mahsulot</span>
                  <h4 className="text-lg font-black text-white">{orderingItem.name}</h4>
                  <span className="text-xs text-slate-400">{orderingItem.category || 'Xomashyo'}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-semibold text-slate-400">Joriy qoldiq:</span>
                    <span className={`text-sm font-black ${orderingItem.totalQuantity === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {orderingItem.totalQuantity} {orderingItem.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Min. me'yor: {orderingItem.minStockLevel} {orderingItem.unit}
                  </div>
                </div>
              </div>

              {/* Quantity to Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Kerakli Buyurtma Miqdori", "Необходимое количество", "Required Quantity")} ({orderForm.unit}) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Masalan: 100"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-4 pr-16 py-3 text-white text-lg font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {orderForm.unit}
                  </span>
                </div>
              </div>

              {/* Expected Date & Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Qachonga Kerak (Sana)", "К какой дате (Срок)", "Needed By (Date)")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.expectedDate}
                    onChange={(e) => setOrderForm({ ...orderForm, expectedDate: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Vaqt Oralig'i", "Время доставки", "Time Range")}
                  </label>
                  <select
                    value={orderForm.timeRange}
                    onChange={(e) => setOrderForm({ ...orderForm, timeRange: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="09:00 - 12:00">09:00 - 12:00 (Ertalab)</option>
                    <option value="12:00 - 15:00">12:00 - 15:00 (Tushdan keyin)</option>
                    <option value="15:00 - 18:00">15:00 - 18:00 (Kechga)</option>
                    <option value="Ixtiyoriy">Ixtiyoriy vaqtda</option>
                  </select>
                </div>
              </div>

              {/* Supplier Selection (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Tavsiya Etilgan Ta'minotchi (Ixtiyoriy)", "Поставщик (Опционально)", "Supplier (Optional)")}
                </label>
                <select
                  value={orderForm.supplierId}
                  onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">{formatDual("Ta'minotchi o'zi tanlasin...", "Отдел снабжения выберет сам...", "Supply team will choose...")}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Izoh / Zudlik Sababi", "Примечание / Срочность", "Notes / Urgency")}
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Zudlik bilan yetkazilsin, oshxonada bugun kerak..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <ShoppingCart size={16} className="flex-shrink-0" />
                <span>
                  {formatDual(
                    "Talabnoma yuborilgach, u Ta'minot (Snabjeniye) bo'limi va korxonaning Umumiy chatida darhol aks etadi.",
                    "После отправки заявка сразу появится в отделе снабжения и в общем чате предприятия.",
                    "After submitting, the order will immediately appear in the supply department and the team chat."
                  )}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap gap-2 items-center justify-end pt-3 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={orderLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
                >
                  {orderLoading && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Ta'minotga Zayavka Yuborish", "Отправить заявку в снабжение", "Submit Purchase Request")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

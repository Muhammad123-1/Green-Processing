'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  Truck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Loader2,
  RefreshCw,
  Building2,
  SlidersHorizontal,
  FileCheck2,
  DollarSign,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Phone,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

export default function OrdersContent() {
  const { lang, formatDual } = useLanguage()
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [metrics, setMetrics] = useState<any>({
    outOfStockCount: 0,
    lowStockCount: 0,
    sufficientCount: 0,
    orderNeededCount: 0,
    pendingOrdersCount: 0,
    todayDeliveriesCount: 0,
    delayedOrdersCount: 0,
    totalOrdersCount: 0
  })
  const [inventory, setInventory] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Filter states - Inventory
  const [stockSearch, setStockSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Filter states - Orders
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'DELAYED' | 'DELIVERED' | 'CANCELLED' | 'TODAY'>('ALL')

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showReconcileModal, setShowReconcileModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // New Order Form
  const [form, setForm] = useState({
    productId: '',
    supplierId: '',
    supplierName: '',
    quantity: '',
    unit: 'kg',
    expectedDate: new Date().toISOString().split('T')[0],
    timeRange: '09:00 - 12:00',
    price: '',
    notes: ''
  })
  const [savingOrder, setSavingOrder] = useState(false)

  // Reconcile Form
  const [reconcileForm, setReconcileForm] = useState({
    deliveredQuantity: '',
    acceptedQuantity: '',
    rejectedQuantity: '',
    status: 'DELIVERED',
    notes: '',
    syncArrival: false,
    arrivalBatch: ''
  })
  const [savingReconcile, setSavingReconcile] = useState(false)
  const [matchedArrivalsList, setMatchedArrivalsList] = useState<any[]>([])
  const [loadingMatchedArrivals, setLoadingMatchedArrivals] = useState(false)

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOrderModal(false)
        setShowReconcileModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [dashRes, prodRes] = await Promise.all([
        fetch('/api/supply/dashboard'),
        fetch('/api/products')
      ])

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setMetrics(dashData.metrics || {})
        setInventory(dashData.inventory || [])
        setOrders(dashData.orders || [])
        setSuppliers(dashData.suppliers || [])
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData || [])
      }
    } catch {
      toast.error(formatDual("Ma'lumotlarni yuklashda xatolik yuz berdi", "Ошибка при загрузке данных", "Failed to load data"))
    } finally {
      setLoading(false)
    }
  }

  async function refreshData() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/supply/dashboard')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics || {})
        setInventory(data.inventory || [])
        setOrders(data.orders || [])
        setSuppliers(data.suppliers || [])
        toast.success(formatDual("Ma'lumotlar yangilandi", "Данные обновлены", "Data refreshed"))
      }
    } catch {
      toast.error(formatDual("Yangilashda xatolik", "Ошибка обновления", "Refresh error"))
    } finally {
      setRefreshing(false)
    }
  }

  // Quick action: Pre-fill Order Modal from Inventory Item
  function handleQuickOrder(item: any) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    setForm({
      productId: item.id.toString(),
      supplierId: item.primarySupplierId ? item.primarySupplierId.toString() : '',
      supplierName: item.primarySupplier || '',
      quantity: (item.neededQuantity > 0 ? item.neededQuantity : (item.minStockLevel || 1000)).toString(),
      unit: item.unit || 'kg',
      expectedDate: tomorrowStr,
      timeRange: '09:00 - 12:00',
      price: '',
      notes: `${formatDual("Sklad real qoldig'i", "Реальный остаток", "Real stock")}: ${item.totalQuantity} ${item.unit}. ${formatDual("Minimal norma", "Мин. норма", "Min norm")}: ${item.minStockLevel} ${item.unit}`
    })
    setShowOrderModal(true)
  }

  // Open Reconcile Modal
  async function handleOpenReconcile(order: any) {
    setSelectedOrder(order)
    setReconcileForm({
      deliveredQuantity: order.deliveredQuantity !== null ? order.deliveredQuantity.toString() : order.quantity.toString(),
      acceptedQuantity: order.acceptedQuantity !== null ? order.acceptedQuantity.toString() : order.quantity.toString(),
      rejectedQuantity: order.rejectedQuantity !== null ? order.rejectedQuantity.toString() : '0',
      status: order.status === 'PENDING' || order.status === 'DELAYED' ? 'DELIVERED' : order.status,
      notes: order.notes || '',
      syncArrival: false,
      arrivalBatch: `PRX-ORD-${order.id}`
    })

    setShowReconcileModal(true)

    // Load matched arrivals if available or fetch from match-arrivals API
    if (order.matchedArrivals && order.matchedArrivals.length > 0) {
      setMatchedArrivalsList(order.matchedArrivals)
    } else {
      setLoadingMatchedArrivals(true)
      try {
        const pName = order.productName || order.product?.name || ''
        const sName = order.supplierName || ''
        const res = await fetch(`/api/supply/match-arrivals?productName=${encodeURIComponent(pName)}&supplierName=${encodeURIComponent(sName)}`)
        if (res.ok) {
          const list = await res.json()
          setMatchedArrivalsList(list || [])
        }
      } catch (e) {
        console.warn('Failed to load matched arrivals:', e)
      } finally {
        setLoadingMatchedArrivals(false)
      }
    }
  }

  // Auto-fill from Matched ShopArrival
  function handleSelectMatchedArrival(arr: any) {
    setReconcileForm(prev => ({
      ...prev,
      deliveredQuantity: arr.quantity.toString(),
      acceptedQuantity: arr.quantity.toString(),
      rejectedQuantity: '0',
      notes: `${formatDual("Prixoddan olindi", "Сверено с приходом", "Synced from arrival")}: Partiya ${arr.batch || arr.id} (${arr.date}) - ${arr.supplier || "Ta'minotchi"}`,
      arrivalBatch: arr.batch || `PRX-${arr.id}`
    }))
    toast.success(formatDual("Prixod ma'lumotlari kiritildi!", "Данные прихода подставлены!", "Arrival data applied!"))
  }

  // Submit New Order
  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId || !form.quantity || !form.expectedDate) {
      toast.error(formatDual("Iltimos, barcha majburiy maydonlarni to'ldiring", "Пожалуйста, заполните все обязательные поля", "Please fill all required fields"))
      return
    }

    setSavingOrder(true)
    try {
      const selectedProd = products.find(p => p.id === parseInt(form.productId))
      const selectedSup = suppliers.find(s => s.id === parseInt(form.supplierId))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          supplierId: form.supplierId || null,
          supplierName: form.supplierName || selectedSup?.name || null,
          quantity: form.quantity,
          unit: selectedProd?.unit || form.unit || 'kg',
          expectedDate: form.expectedDate,
          timeRange: form.timeRange,
          price: form.price ? parseFloat(form.price) : null,
          notes: form.notes
        })
      })

      if (res.ok) {
        toast.success(formatDual("Xarid zayavkasi muvaffaqiyatli yaratildi", "Заказ на поставку успешно создан", "Purchase order created successfully"))
        setShowOrderModal(false)
        setForm({
          productId: '',
          supplierId: '',
          supplierName: '',
          quantity: '',
          unit: 'kg',
          expectedDate: new Date().toISOString().split('T')[0],
          timeRange: '09:00 - 12:00',
          price: '',
          notes: ''
        })
        refreshData()
        setActiveTab('orders')
      } else {
        toast.error(formatDual("Buyurtma yaratishda xatolik yuz berdi", "Ошибка при создании заказа", "Error creating order"))
      }
    } catch {
      toast.error(formatDual("Tarmoq xatosi", "Ошибка сети", "Network error"))
    } finally {
      setSavingOrder(false)
    }
  }

  // Submit Reconcile
  async function handleSaveReconcile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder) return

    setSavingReconcile(true)
    try {
      const delivered = parseFloat(reconcileForm.deliveredQuantity) || 0
      const accepted = parseFloat(reconcileForm.acceptedQuantity) || 0
      const rejected = parseFloat(reconcileForm.rejectedQuantity) || 0

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveredQuantity: delivered,
          acceptedQuantity: accepted,
          rejectedQuantity: rejected,
          status: reconcileForm.status,
          notes: reconcileForm.notes,
          syncArrival: reconcileForm.syncArrival,
          arrivalBatch: reconcileForm.arrivalBatch,
          actualDeliveryTime: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success(formatDual("Yetkazib berish natijasi saqlandi va solishtirildi", "Результат поставки сохранен и сверен", "Reconciliation saved successfully"))
        setShowReconcileModal(false)
        setSelectedOrder(null)
        refreshData()
      } else {
        toast.error(formatDual("Solishtirishni saqlashda xatolik", "Ошибка при сохранении сверки", "Error saving reconciliation"))
      }
    } catch {
      toast.error(formatDual("Tarmoq xatosi", "Ошибка сети", "Network error"))
    } finally {
      setSavingReconcile(false)
    }
  }

  // Cancel order
  async function handleCancelOrder(orderId: number) {
    if (!confirm(formatDual("Haqiqatan ham bu buyurtmani bekor qilmoqchimisiz?", "Вы действительно хотите отменить этот заказ?", "Are you sure you want to cancel this order?"))) return
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (res.ok) {
        toast.success(formatDual("Buyurtma bekor qilindi", "Заказ отменен", "Order cancelled"))
        refreshData()
      }
    } catch {
      toast.error(formatDual("Xatolik yuz berdi", "Произошла ошибка", "An error occurred"))
    }
  }

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.code?.toLowerCase().includes(stockSearch.toLowerCase()) ||
        (item.primarySupplier && item.primarySupplier.toLowerCase().includes(stockSearch.toLowerCase()))

      // Category filter
      let matchesCat = true
      if (categoryFilter !== 'ALL') {
        const cat = (item.category || '').toLowerCase()
        if (categoryFilter === 'RAW_MATERIAL') {
          matchesCat = cat.includes('xomashyo') || cat.includes('oziq') || cat.includes('sabzavot')
        } else if (categoryFilter === 'PACKAGING') {
          matchesCat = cat.includes('qadoq') || cat.includes('idish')
        } else if (categoryFilter === 'CHEMICALS') {
          matchesCat = cat.includes('kimyo') || cat.includes('dezinfeksiya')
        } else if (categoryFilter === 'OTHER') {
          matchesCat = !cat.includes('xomashyo') && !cat.includes('qadoq') && !cat.includes('kimyo')
        }
      }

      if (!matchesSearch || !matchesCat) return false

      if (stockFilter === 'RED') return item.status === 'red'
      if (stockFilter === 'YELLOW') return item.status === 'yellow'
      if (stockFilter === 'GREEN') return item.status === 'green'
      return true
    })
  }, [inventory, stockSearch, stockFilter, categoryFilter])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.productName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.supplierName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.id.toString().includes(orderSearch)

      if (!matchesSearch) return false

      if (orderFilter === 'PENDING') return order.status === 'PENDING'
      if (orderFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0]
        return order.status === 'PENDING' && (order.expectedDate && order.expectedDate.startsWith(today))
      }
      if (orderFilter === 'DELAYED') return order.status === 'DELAYED'
      if (orderFilter === 'DELIVERED') return order.status === 'DELIVERED'
      if (orderFilter === 'CANCELLED') return order.status === 'CANCELLED'
      return true
    })
  }, [orders, orderSearch, orderFilter])

  // Infinite Scroll & Pagination (10 per step)
  const inventoryPagination = useInfiniteTable(filteredInventory, 10, [stockSearch, stockFilter, categoryFilter])
  const ordersPagination = useInfiniteTable(filteredOrders, 10, [orderSearch, orderFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/70 p-5 sm:p-6 rounded-3xl border border-dark-750 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              {formatDual("Ta'minot & Sklad Zanjiri", "Цепочка поставок и склад", "Supply & Warehouse Chain")}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400" />
              {formatDual("Haqiqiy Prixod & Qoldiq Balansi", "Реальный приход & остатки", "Real Inflow & Balance")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Truck className="text-blue-500" size={28} />
            <span>{formatDual("Ta'minot va Buyurtmalar Markazi (Snabjenets)", "Центр снабжения и заказов (Снабженец)", "Supply & Purchase Orders Center")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {formatDual(
              "Sklad real qoldig'iga qarab buyurtma berish, yetkazib beruvchilarni boshqarish va kelgan yukni prixod bilan solishtirish",
              "Заказ сырья по реальным остаткам склада, управление поставщиками и сверка фактических поставок с приходом",
              "Order raw materials by real stock, manage suppliers, and reconcile deliveries against arrivals"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-all shadow-md active:scale-95"
            title={formatDual("Yangilash", "Обновить", "Refresh")}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin text-blue-400' : ''} />
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setForm({
                productId: '',
                supplierId: '',
                supplierName: '',
                quantity: '',
                unit: 'kg',
                expectedDate: tomorrow.toISOString().split('T')[0],
                timeRange: '09:00 - 12:00',
                price: '',
                notes: ''
              })
              setShowOrderModal(true)
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>{formatDual("Yangi Zayavka (Xarid)", "Новый заказ", "New Purchase Order")}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: 7 Key Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Out of stock (Red) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('RED'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-red-500 bg-dark-900/60 border border-dark-750 shadow-md ${stockFilter === 'RED' && activeTab === 'inventory' ? 'ring-2 ring-red-500/60 bg-red-500/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-red-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Tugagan", "Закончилось", "Out of Stock")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.outOfStockCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("0 yoki kritik", "0 или критично", "0 or critical")}</div>
        </div>

        {/* 2. Low stock (Yellow) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('YELLOW'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-amber-500 bg-dark-900/60 border border-dark-750 shadow-md ${stockFilter === 'YELLOW' && activeTab === 'inventory' ? 'ring-2 ring-amber-500/60 bg-amber-500/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Kamaygan", "Мало", "Low Stock")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.lowStockCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">&lt; {formatDual("Me'yor", "Норма", "Norm")}</div>
        </div>

        {/* 3. Sufficient (Green) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('GREEN'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-emerald-500 bg-dark-900/60 border border-dark-750 shadow-md ${stockFilter === 'GREEN' && activeTab === 'inventory' ? 'ring-2 ring-emerald-500/60 bg-emerald-500/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Yetarli", "В норме", "Sufficient")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.sufficientCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">&gt;= {formatDual("Yetarli zaxira", "Достаточно", "In stock")}</div>
        </div>

        {/* 4. Order Needed */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('RED'); }}
          className="p-4 rounded-2xl cursor-pointer hover:bg-dark-800/80 transition-all border-l-4 border-l-blue-500 bg-dark-900/60 border border-dark-750 shadow-md"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Ehtiyoj", "Потребность", "Needed")}</span>
            <ShoppingCart size={14} />
          </div>
          <div className="text-2xl font-black text-white">{metrics.orderNeededCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Buyurtma kerak", "Нужен заказ", "Order needed")}</div>
        </div>

        {/* 5. Pending orders */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('PENDING'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-indigo-500 bg-dark-900/60 border border-dark-750 shadow-md ${orderFilter === 'PENDING' && activeTab === 'orders' ? 'ring-2 ring-indigo-500/60 bg-indigo-500/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Kutilmoqda", "Ожидается", "Pending")}</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-black text-white">{metrics.pendingOrdersCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Faol zayavka", "Активный заказ", "Active orders")}</div>
        </div>

        {/* 6. Today deliveries */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('TODAY'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-cyan-500 bg-dark-900/60 border border-dark-750 shadow-md ${orderFilter === 'TODAY' && activeTab === 'orders' ? 'ring-2 ring-cyan-500/60 bg-cyan-500/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-cyan-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Bugun", "Сегодня", "Today")}</span>
            <Truck size={14} />
          </div>
          <div className="text-2xl font-black text-white">{metrics.todayDeliveriesCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Kelishi kerak", "Ожидается привоз", "Expected today")}</div>
        </div>

        {/* 7. Delayed orders */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('DELAYED'); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 border-l-rose-600 bg-dark-900/60 border border-dark-750 shadow-md ${orderFilter === 'DELAYED' && activeTab === 'orders' ? 'ring-2 ring-rose-600/60 bg-rose-600/10' : 'hover:bg-dark-800/80'}`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">{formatDual("Kechikkan", "Просрочено", "Delayed")}</span>
            <AlertTriangle size={14} />
          </div>
          <div className="text-2xl font-black text-rose-400">{metrics.delayedOrdersCount || 0}</div>
          <div className="text-[11px] text-rose-500/80 mt-0.5">{formatDual("Yetkazilmadi", "Не доставлено", "Not delivered")}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-700/80 pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
                : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-750 border border-dark-700'
            }`}
          >
            <Package size={16} />
            <span>{formatDual("Sklad Qoldiqlari & Xarid Signallari", "Остатки на складе & Сигналы закупа", "Stock & Reorder Signals")}</span>
            {metrics.orderNeededCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] bg-red-500 text-white rounded-full font-bold animate-pulse">
                {metrics.orderNeededCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
                : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-750 border border-dark-700'
            }`}
          >
            <Truck size={16} />
            <span>{formatDual("Xarid Zayavkalari & Prixod Solishtiruv", "Заказы закупа & Сверка с приходом", "Orders & Arrival Reconciliation")}</span>
            <span className="px-2 py-0.5 text-[11px] bg-dark-700 text-slate-300 rounded-full font-bold">
              {orders.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Real-time Sklad Qoldiqlari & Xarid Signallari */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-dark-900/60 p-4 rounded-2xl border border-dark-750">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={formatDual("Mahsulot nomi, kodi yoki ta'minotchi bo'yicha qidirish...", "Поиск по названию товара, коду или поставщику...", "Search by product, code or supplier...")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                  categoryFilter === 'ALL' ? 'bg-dark-700 text-white border border-dark-600' : 'text-slate-400 hover:text-white'
                }`}
              >
                {formatDual("Barcha toifalar", "Все категории", "All")}
              </button>
              <button
                onClick={() => setCategoryFilter('RAW_MATERIAL')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                  categoryFilter === 'RAW_MATERIAL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                🥬 {formatDual("Xomashyo", "Сырьё", "Raw Materials")}
              </button>
              <button
                onClick={() => setCategoryFilter('PACKAGING')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                  categoryFilter === 'PACKAGING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                📦 {formatDual("Qadoqlash", "Упаковка", "Packaging")}
              </button>
              <button
                onClick={() => setCategoryFilter('CHEMICALS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                  categoryFilter === 'CHEMICALS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                🧪 {formatDual("Kimyo", "Химия", "Chemicals")}
              </button>
            </div>

            {/* Svetofor Status Filter */}
            <div className="flex items-center gap-1.5 bg-dark-800 p-1 rounded-xl border border-dark-700 shrink-0">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  stockFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {formatDual("Barchasi", "Все", "All")}
              </button>
              <button
                onClick={() => setStockFilter('RED')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  stockFilter === 'RED' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 {formatDual("Tugagan", "Критично", "Out")}
              </button>
              <button
                onClick={() => setStockFilter('YELLOW')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  stockFilter === 'YELLOW' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🟡 {formatDual("Kam", "Мало", "Low")}
              </button>
              <button
                onClick={() => setStockFilter('GREEN')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  stockFilter === 'GREEN' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 {formatDual("Yetarli", "В норме", "Norm")}
              </button>
            </div>
          </div>

          {/* Loading or Empty */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-dark-900/60 rounded-3xl border border-dark-750">
              <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
              <p className="font-semibold text-sm">{formatDual("Sklad real qoldiqlari tahlil qilinmoqda...", "Анализ реальных остатков на складе...", "Analyzing real stock balances...")}</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-dark-900/60 rounded-3xl border border-dark-750">
              <Package size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="font-semibold">{formatDual("Hech qanday mahsulot topilmadi", "Товары не найдены", "No products found")}</p>
            </div>
          ) : (
            <>
              {/* 📱 MOBILE VIEW: Touch Cards */}
              <div className="block sm:hidden space-y-3">
                {inventoryPagination.displayedItems.map((item) => {
                  const stockPct = item.minStockLevel > 0 
                    ? Math.min(100, Math.round((item.totalQuantity / item.minStockLevel) * 100))
                    : (item.totalQuantity > 0 ? 100 : 0)

                  return (
                    <div 
                      key={item.id}
                      className="bg-dark-900/80 border border-dark-750 rounded-2xl p-4 shadow-lg space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.code && (
                              <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700">
                                {item.code}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {item.category || formatDual('Xomashyo', 'Сырьё', 'Raw material')}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {item.status === 'red' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {formatDual("Tugagan", "Критично", "Out")}
                            </span>
                          )}
                          {item.status === 'yellow' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {formatDual("Kamaygan", "Мало", "Low")}
                            </span>
                          )}
                          {item.status === 'green' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {formatDual("Yetarli", "В норме", "Norm")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock metrics */}
                      <div className="grid grid-cols-2 gap-2 bg-dark-800/80 p-2.5 rounded-xl border border-dark-700/60 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">{formatDual("Sklad Qoldig'i:", "Остаток на складе:", "Warehouse stock:")}</span>
                          <span className="text-base font-extrabold text-white font-mono">
                            {item.totalQuantity.toLocaleString()} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">{formatDual("Minimal norma:", "Мин. норма:", "Min norm:")}</span>
                          <span className="text-sm font-bold text-slate-300 font-mono">
                            {item.minStockLevel > 0 ? `${item.minStockLevel.toLocaleString()} ${item.unit}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{formatDual("Zaxira ta'minlanganligi", "Обеспеченность запасом", "Reserve ratio")}</span>
                          <span className="font-mono font-bold text-slate-300">{stockPct}%</span>
                        </div>
                        <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              stockPct >= 100 ? 'bg-emerald-500' :
                              stockPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, stockPct))}%` }}
                          />
                        </div>
                      </div>

                      {/* Needed quantity & primary supplier */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-dark-750">
                        <div>
                          {item.neededQuantity > 0 ? (
                            <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded text-[11px]">
                              +{item.neededQuantity.toLocaleString()} {item.unit} {formatDual("kerak", "нужно", "needed")}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">{formatDual("Yetarli zaxira", "Запас в норме", "Sufficient")}</span>
                          )}
                          {item.primarySupplier && (
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[170px]">
                              🚚 {item.primarySupplier}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleQuickOrder(item)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
                        >
                          <ShoppingCart size={13} />
                          <span>{formatDual("Zayavka", "Заказать", "Order")}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 🖥️ DESKTOP VIEW: Table */}
              <div className="hidden sm:block card overflow-hidden border border-dark-750 bg-dark-900/70 rounded-3xl shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        <th className="py-4 px-4">{formatDual("Mahsulot / Xomashyo", "Товар / Сырье", "Product")}</th>
                        <th className="py-4 px-4">{formatDual("Kategoriya", "Категория", "Category")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Sklad Qoldig'i", "Остаток на складе", "Warehouse Stock")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Minimal Norma", "Мин. остаток", "Min Stock")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Holat (Svetofor)", "Статус", "Status")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Xarid Ehtiyoji", "Потребность закупа", "Needed")}</th>
                        <th className="py-4 px-4">{formatDual("Asosiy Ta'minotchi", "Основной поставщик", "Primary Supplier")}</th>
                        <th className="py-4 px-4 text-right">{formatDual("Amal", "Действие", "Action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-750/70 text-sm">
                      {inventoryPagination.displayedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-dark-800/40 transition-colors">
                          <td className="py-4 px-4 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${
                                item.status === 'red' ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' :
                                item.status === 'yellow' ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-emerald-500'
                              }`} />
                              <div>
                                <span className="font-bold text-white block">{item.name}</span>
                                {item.code && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {item.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-slate-400 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/80">
                              {item.category || formatDual('Xomashyo', 'Сырьё', 'Raw material')}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold text-white">
                            <span className={`px-3 py-1 rounded-xl text-sm ${
                              item.totalQuantity === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-black' :
                              item.status === 'yellow' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {item.totalQuantity.toLocaleString()} {item.unit}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-slate-300 text-xs">
                            {item.minStockLevel > 0 ? `${item.minStockLevel.toLocaleString()} ${item.unit}` : '-'}
                          </td>

                          <td className="py-4 px-4 text-center">
                            {item.status === 'red' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                <span className="w-2 h-2 rounded-full bg-red-500" /> {formatDual("Tugagan", "Критично", "Out")}
                              </span>
                            )}
                            {item.status === 'yellow' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <span className="w-2 h-2 rounded-full bg-amber-500" /> {formatDual("Kamaygan", "Мало", "Low")}
                              </span>
                            )}
                            {item.status === 'green' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {formatDual("Yetarli", "В норме", "Norm")}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold">
                            {item.neededQuantity > 0 ? (
                              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs">
                                +{item.neededQuantity.toLocaleString()} {item.unit}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-xs text-slate-300">
                            {item.primarySupplier ? (
                              <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                                <Building2 size={13} className="text-blue-400 shrink-0" />
                                <span className="truncate">{item.primarySupplier}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">{formatDual("Aniqlanmagan", "Не указан", "None")}</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleQuickOrder(item)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                                item.status === 'red'
                                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                                  : item.status === 'yellow'
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                              }`}
                            >
                              <ShoppingCart size={14} />
                              <span>{formatDual("Zayavka Berish", "Заказать", "Order")}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
              <InfiniteTableFooter
                currentCount={inventoryPagination.visibleCount}
                totalCount={inventoryPagination.totalCount}
                hasMore={inventoryPagination.hasMore}
                showAll={inventoryPagination.showAll}
                onLoadMore={inventoryPagination.loadMore}
                onToggleShowAll={inventoryPagination.toggleShowAll}
                sentinelRef={inventoryPagination.sentinelRef}
                pageSize={10}
                itemName={{ uz: 'mahsulot', ru: 'товаров', en: 'products' }}
              />
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Xarid Zayavkalari & Prixod Solishtiruv (Reconciliation) */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-dark-900/60 p-4 rounded-2xl border border-dark-750">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={formatDual("Mahsulot, ta'minotchi yoki zayavka ID bo'yicha qidirish...", "Поиск по товару, поставщику или номеру заказа...", "Search by product, supplier or order ID...")}
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
                <button
                  onClick={() => setOrderFilter('ALL')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Barchasi", "Все", "All")}
                </button>
                <button
                  onClick={() => setOrderFilter('PENDING')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏳ {formatDual("Kutilmoqda", "Ожидается", "Pending")}
                </button>
                <button
                  onClick={() => setOrderFilter('TODAY')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'TODAY' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚚 {formatDual("Bugun", "Сегодня", "Today")}
                </button>
                <button
                  onClick={() => setOrderFilter('DELAYED')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'DELAYED' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 {formatDual("Kechikkan", "Просрочено", "Delayed")}
                </button>
                <button
                  onClick={() => setOrderFilter('DELIVERED')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'DELIVERED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 {formatDual("Yetkazildi", "Доставлено", "Delivered")}
                </button>
                <button
                  onClick={() => setOrderFilter('CANCELLED')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    orderFilter === 'CANCELLED' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Bekor qilingan", "Отменено", "Cancelled")}
                </button>
              </div>
            </div>
          </div>

          {/* Orders Loading / Empty */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-dark-900/60 rounded-3xl border border-dark-750">
              <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
              <p className="font-semibold text-sm">{formatDual("Xarid zayavkalari yuklanmoqda...", "Загрузка заказов...", "Loading orders...")}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-dark-900/60 rounded-3xl border border-dark-750">
              <Truck size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="font-semibold">{formatDual("Hech qanday zayavka topilmadi", "Заказов не найдено", "No orders found")}</p>
            </div>
          ) : (
            <>
              {/* 📱 MOBILE VIEW: Order Touch Cards */}
              <div className="block sm:hidden space-y-3">
                {ordersPagination.displayedItems.map((order) => {
                  const hasShortage = order.shortageQuantity !== null && order.shortageQuantity > 0

                  return (
                    <div 
                      key={order.id}
                      className="bg-dark-900/80 border border-dark-750 rounded-2xl p-4 shadow-lg space-y-3"
                    >
                      {/* Top bar: ID and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            #{order.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          {order.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              ⏳ {formatDual("Kutilmoqda", "Ожидается", "Pending")}
                            </span>
                          )}
                          {order.status === 'DELAYED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🔴 {formatDual("Kechikkan", "Просрочено", "Delayed")}
                            </span>
                          )}
                          {order.status === 'DELIVERED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🟢 {formatDual("Yetkazildi", "Доставлено", "Delivered")}
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/50 text-slate-400">
                              {formatDual("Bekor qilingan", "Отменено", "Cancelled")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product & Supplier */}
                      <div>
                        <h4 className="font-extrabold text-white text-base">{order.productName}</h4>
                        <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Building2 size={13} className="text-blue-400 shrink-0" />
                          <span className="font-semibold">{order.supplierName}</span>
                        </div>
                      </div>

                      {/* Quantities summary */}
                      <div className="grid grid-cols-2 gap-2 bg-dark-800/80 p-2.5 rounded-xl border border-dark-700/60 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Buyurtma qilingan:", "Заказано:", "Ordered:")}</span>
                          <span className="font-extrabold text-white text-sm">
                            {order.quantity.toLocaleString()} {order.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans">{formatDual("Kelgan miqdor:", "Привезено:", "Delivered:")}</span>
                          <span className={`font-bold text-sm ${order.deliveredQuantity !== null ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {order.deliveredQuantity !== null ? `${order.deliveredQuantity.toLocaleString()} ${order.unit}` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Shortage or defect alert */}
                      {hasShortage && (
                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                          <span>{formatDual("Kamomad / Yetishmagan:", "Недостача:", "Shortage:")}</span>
                          <span className="font-bold font-mono">-{order.shortageQuantity} {order.unit}</span>
                        </div>
                      )}

                      {/* Delivery target time */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{formatDual("Kutilayotgan muddat:", "Срок поставки:", "Expected:")}</span>
                        <span className="font-bold text-slate-300">{order.expectedDateStr} ({order.timeRange})</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-dark-750">
                        <button
                          onClick={() => handleOpenReconcile(order)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all"
                        >
                          <FileCheck2 size={14} />
                          <span>{formatDual("Solishtirish (Prixod)", "Сверить с приходом", "Reconcile")}</span>
                        </button>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-dark-800 transition-colors"
                            title={formatDual("Bekor qilish", "Отменить", "Cancel")}
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 🖥️ DESKTOP VIEW: Table */}
              <div className="hidden sm:block card overflow-hidden border border-dark-750 bg-dark-900/70 rounded-3xl shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        <th className="py-4 px-4">{formatDual("Zayavka & Kelish Sanasi", "Заказ & Дата", "Order & Date")}</th>
                        <th className="py-4 px-4">{formatDual("Mahsulot", "Товар / Сырье", "Product")}</th>
                        <th className="py-4 px-4">{formatDual("Yetkazib Beruvchi", "Поставщик", "Supplier")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Buyurtma", "Заказ", "Ordered")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Kelgan", "Привезено", "Delivered")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Qabul Qilingan", "Принято", "Accepted")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Farq / Kamomad", "Разница", "Diff")}</th>
                        <th className="py-4 px-4 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                        <th className="py-4 px-4 text-right">{formatDual("Solishtirish / Amal", "Сверка", "Action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-750/70 text-sm">
                      {ordersPagination.displayedItems.map((order) => (
                        <tr key={order.id} className="hover:bg-dark-800/40 transition-colors">
                          <td className="py-4 px-4 font-mono text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                #{order.id}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-slate-300 flex items-center gap-1 font-bold">
                              <Calendar size={12} className="text-amber-400" />
                              <span>{order.expectedDateStr}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({order.timeRange})</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-white block">{order.productName}</span>
                            {order.productCategory && (
                              <span className="text-[11px] text-slate-400">
                                {order.productCategory}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <Building2 size={14} className="text-blue-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{order.supplierName}</span>
                            </div>
                            {order.price && (
                              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                                {order.price.toLocaleString()} so'm / {order.unit}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold text-white">
                            <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700">
                              {order.quantity.toLocaleString()} {order.unit}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold">
                            {order.deliveredQuantity !== null ? (
                              <span className="text-slate-200">
                                {order.deliveredQuantity.toLocaleString()} {order.unit}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold">
                            {order.acceptedQuantity !== null ? (
                              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {order.acceptedQuantity.toLocaleString()} {order.unit}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-bold text-xs">
                            {order.shortageQuantity !== null ? (
                              order.shortageQuantity > 0 ? (
                                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                  -{order.shortageQuantity} {order.unit}
                                </span>
                              ) : (
                                <span className="text-emerald-400">0</span>
                              )
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            {order.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                ⏳ {formatDual("Kutilmoqda", "Ожидается", "Pending")}
                              </span>
                            )}
                            {order.status === 'DELAYED' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                🔴 {formatDual("Kechikkan", "Просрочено", "Delayed")}
                              </span>
                            )}
                            {order.status === 'DELIVERED' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🟢 {formatDual("Yetkazildi", "Доставлено", "Delivered")}
                              </span>
                            )}
                            {order.status === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400">
                                {formatDual("Bekor qilingan", "Отменено", "Cancelled")}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenReconcile(order)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all active:scale-95"
                              >
                                <FileCheck2 size={14} />
                                <span>{formatDual("Solishtirish", "Сверить", "Reconcile")}</span>
                              </button>
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-dark-800 transition-colors"
                                  title={formatDual("Bekor qilish", "Отменить", "Cancel")}
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Infinite table footer */}
              <InfiniteTableFooter
                currentCount={ordersPagination.visibleCount}
                totalCount={ordersPagination.totalCount}
                hasMore={ordersPagination.hasMore}
                showAll={ordersPagination.showAll}
                onLoadMore={ordersPagination.loadMore}
                onToggleShowAll={ordersPagination.toggleShowAll}
                sentinelRef={ordersPagination.sentinelRef}
                pageSize={10}
                itemName={{ uz: 'buyurtma', ru: 'заказов', en: 'orders' }}
              />
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Yangi Buyurtma (Zayavka) Yaratish */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setShowOrderModal(false)}
        >
          <div 
            className="w-full max-w-xl bg-dark-900 border border-dark-750 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{formatDual("Yangi Xarid Zayavkasi", "Новый заказ поставщику", "New Purchase Order")}</h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Ta'minotchiga zayavka berish va muddatini belgilash", "Оформление заказа на поставку сырья", "Create order for raw material supply")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
              {/* Product selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {formatDual("Mahsulot / Xomashyo", "Товар / Сырье", "Product")} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.productId}
                  onChange={(e) => {
                    const pId = e.target.value
                    const p = products.find(x => x.id === parseInt(pId))
                    const invItem = inventory.find(x => x.id === parseInt(pId))
                    setForm(prev => ({
                      ...prev,
                      productId: pId,
                      unit: p?.unit || prev.unit,
                      supplierName: invItem?.primarySupplier || prev.supplierName,
                      supplierId: invItem?.primarySupplierId ? invItem.primarySupplierId.toString() : prev.supplierId,
                      quantity: invItem?.neededQuantity > 0 ? invItem.neededQuantity.toString() : prev.quantity
                    }))
                  }}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">{formatDual("-- Mahsulotni tanlang --", "-- Выберите товар --", "-- Select product --")}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'Xomashyo'} - {p.unit || 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Buyurtma Miqdori", "Количество заказа", "Quantity")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 3000"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Birlik", "Единица", "Unit")}
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="kg">kg</option>
                    <option value="dona">dona</option>
                    <option value="litr">litr</option>
                    <option value="quti">quti</option>
                    <option value="tonna">tonna</option>
                  </select>
                </div>
              </div>

              {/* Supplier selector / input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Ta'minotchi (Mavjud ro'yxatdan)", "Поставщик из списка", "Existing Supplier")}
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => {
                      const sId = e.target.value
                      const s = suppliers.find(x => x.id === parseInt(sId))
                      setForm(prev => ({
                        ...prev,
                        supplierId: sId,
                        supplierName: s?.name || prev.supplierName
                      }))
                    }}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">{formatDual("-- Ro'yxatdan tanlash --", "-- Выбрать из списка --", "-- Select from list --")}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.shortName ? `(${s.shortName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Yoki Yangi Ta'minotchi Nomi", "Или новый поставщик", "Or Custom Supplier Name")}
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Agro Standart MCHJ"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date & Time Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Kelishi Kerak Bo'lgan Sana", "Ожидаемая дата", "Expected Delivery Date")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Vaqt Oralig'i", "Интервал времени", "Time Range")}
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 - 12:00"
                    value={form.timeRange}
                    onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Price & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Kelishilgan Narx (so'm / birlik)", "Договорная цена (сум / ед)", "Price (UZS / unit)")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 3200"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formatDual("Izoh / Sifat Talabi", "Примечание", "Notes / Quality Specs")}
                  </label>
                  <input
                    type="text"
                    placeholder={formatDual("Harorat normasi, GOST talabi...", "Режим, требования...", "Temperature, specs...")}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Summary of Total Estimated Cost */}
              {form.quantity && form.price && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-300 font-mono">
                  <span>{formatDual("Jami kutilayotgan summa:", "Ориентировочная сумма:", "Total estimated amount:")}</span>
                  <span className="font-extrabold text-sm text-emerald-400">
                    {(parseFloat(form.quantity) * parseFloat(form.price)).toLocaleString()} so'm
                  </span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {savingOrder && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Zayavkani Tasdiqlash", "Подтвердить заказ", "Confirm Order")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Yetkazib Berishni Prixod bilan Solishtirish (Reconciliation) */}
      {/* ========================================================================= */}
      {showReconcileModal && selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setShowReconcileModal(false)}
        >
          <div 
            className="w-full max-w-xl bg-dark-900 border border-dark-750 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{formatDual("Xarid Zayavkasi & Prixodni Solishtirish", "Сверка заказа и фактического прихода", "Reconcile Order & Arrival")}</h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Zayavka", "Заказ", "Order")} #{selectedOrder.id} • <span className="font-bold text-slate-200">{selectedOrder.productName}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowReconcileModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReconcile} className="space-y-4 pt-4">
              {/* Order Reference Card */}
              <div className="bg-dark-800/80 p-3.5 rounded-2xl border border-dark-700/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{formatDual("Buyurtma qilingan hajm:", "Количество в заказе:", "Ordered quantity:")}</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    {selectedOrder.quantity.toLocaleString()} {selectedOrder.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{formatDual("Yetkazib beruvchi:", "Поставщик:", "Supplier:")}</span>
                  <span className="font-bold text-slate-200 block truncate">
                    {selectedOrder.supplierName}
                  </span>
                </div>
              </div>

              {/* Matched ShopArrival Suggestions (Avtomatik Topilgan Prixodlar) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    {formatDual("Tizimda Topilgan Mos Prixodlar (ShopArrival)", "Совпадающие приходы на складе", "Matched Arrivals on Stock")}
                  </span>
                  {loadingMatchedArrivals && <Loader2 size={13} className="animate-spin text-blue-400" />}
                </div>

                {matchedArrivalsList.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {matchedArrivalsList.map((arr) => (
                      <div 
                        key={arr.id}
                        className="bg-dark-800 p-2.5 rounded-xl border border-dark-700 flex items-center justify-between text-xs hover:border-emerald-500/50 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{arr.quantity.toLocaleString()} {selectedOrder.unit || 'kg'}</span>
                            <span className="text-[10px] bg-dark-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">{arr.batch || `#${arr.id}`}</span>
                            <span className="text-[10px] text-slate-400">{arr.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[240px]">
                            {arr.supplier || "Noma'lum ta'minotchi"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectMatchedArrival(arr)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all"
                        >
                          {formatDual("Tanlash", "Выбрать", "Use")}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-dark-800/40 p-2.5 rounded-xl border border-dark-700/50 italic">
                    {formatDual("Aynan mos keluvchi oxirgi prixod topilmadi. Quyida qo'lda kiriting.", "Автоматических приходов не найдено. Введите вручную ниже.", "No exact arrival found. Enter manually below.")}
                  </div>
                )}
              </div>

              {/* Quantities input: Delivered, Accepted, Rejected */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {formatDual("Kelgan Miqdor", "Привезено", "Delivered")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.deliveredQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, deliveredQuantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {formatDual("Qabul Qilingan", "Принято", "Accepted")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.acceptedQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, acceptedQuantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {formatDual("Brak / Qaytarilgan", "Возвращено (брак)", "Rejected")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.rejectedQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, rejectedQuantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-rose-400 text-sm focus:outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Shortage Display */}
              {(() => {
                const del = parseFloat(reconcileForm.deliveredQuantity) || 0
                const shortage = selectedOrder.quantity - del
                return (
                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    shortage > 0 
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-300' 
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  }`}>
                    <span>{formatDual("Farq / Kamomad:", "Разница / Недостача:", "Difference / Shortage:")}</span>
                    <span className="font-black text-sm font-mono">
                      {shortage > 0 ? `-${shortage.toFixed(2)} ${selectedOrder.unit}` : formatDual("0 (To'liq yetkazildi)", "0 (Полная поставка)", "0 (Fully delivered)")}
                    </span>
                  </div>
                )
              })()}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {formatDual("Zayavka Holati", "Статус заказа", "Order Status")}
                </label>
                <select
                  value={reconcileForm.status}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, status: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="DELIVERED">{formatDual("Bajarildi (Yetkazildi)", "Выполнен (Доставлено)", "Delivered")}</option>
                  <option value="PENDING">{formatDual("Kutilmoqda", "Ожидается", "Pending")}</option>
                  <option value="DELAYED">{formatDual("Kechikdi", "Просрочен", "Delayed")}</option>
                  <option value="CANCELLED">{formatDual("Bekor qilindi", "Отменён", "Cancelled")}</option>
                </select>
              </div>

              {/* Sync to ShopArrival checkbox */}
              <div className="bg-dark-800/80 p-3 rounded-2xl border border-dark-700/80 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={reconcileForm.syncArrival}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, syncArrival: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-dark-900 border-dark-700"
                  />
                  <span>{formatDual("Ushbu partiyani ombor prixodiga (ShopArrival) avtomatik kiritish", "Автоматически записать в приход склада (ShopArrival)", "Auto-record to Warehouse ShopArrival")}</span>
                </label>

                {reconcileForm.syncArrival && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      {formatDual("Partiya Raqami", "Номер партии", "Batch Number")}
                    </label>
                    <input
                      type="text"
                      placeholder="PRX-ORD-..."
                      value={reconcileForm.arrivalBatch}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, arrivalBatch: e.target.value })}
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {formatDual("Izoh / Dalolatnoma Raqami", "Примечание / Номер акта", "Notes / Inspection Act")}
                </label>
                <input
                  type="text"
                  placeholder={formatDual("Solishtiruv yoki dalolatnoma sababi...", "Причина расхождения, номер акта...", "Reconcile notes, act number...")}
                  value={reconcileForm.notes}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingReconcile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {savingReconcile && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Solishtirishni Saqlash", "Сохранить сверку", "Save Reconciliation")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

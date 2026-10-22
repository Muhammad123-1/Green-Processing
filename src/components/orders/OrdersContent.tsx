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
  DollarSign
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

  // Filter states
  const [stockSearch, setStockSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL')

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
    timeRange: '09:00 - 11:00',
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
    notes: ''
  })
  const [savingReconcile, setSavingReconcile] = useState(false)

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
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
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
        toast.success("Ma'lumotlar yangilandi")
      }
    } catch {
      toast.error("Yangilashda xatolik")
    } finally {
      setRefreshing(false)
    }
  }

  // Quick action: Pre-fill Order Modal from Inventory Item
  function handleQuickOrder(item: any) {
    setForm({
      productId: item.id.toString(),
      supplierId: '',
      supplierName: '',
      quantity: (item.neededQuantity > 0 ? item.neededQuantity : (item.minStockLevel || 50)).toString(),
      unit: item.unit || 'kg',
      expectedDate: new Date().toISOString().split('T')[0],
      timeRange: '09:00 - 11:00',
      price: '',
      notes: `${formatDual("Sklad qoldig'i", "Остаток на складе", "Stock")}: ${item.totalQuantity} ${item.unit}. ${formatDual("Minimal", "Мин.", "Min")}: ${item.minStockLevel} ${item.unit}`
    })
    setShowOrderModal(true)
  }

  // Open Reconcile Modal
  function handleOpenReconcile(order: any) {
    setSelectedOrder(order)
    setReconcileForm({
      deliveredQuantity: order.deliveredQuantity !== null ? order.deliveredQuantity.toString() : order.quantity.toString(),
      acceptedQuantity: order.acceptedQuantity !== null ? order.acceptedQuantity.toString() : order.quantity.toString(),
      rejectedQuantity: order.rejectedQuantity !== null ? order.rejectedQuantity.toString() : '0',
      status: order.status === 'PENDING' || order.status === 'DELAYED' ? 'DELIVERED' : order.status,
      notes: order.notes || ''
    })
    setShowReconcileModal(true)
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
        toast.success(formatDual("Buyurtma muvaffaqiyatli yaratildi", "Заказ успешно создан", "Order created successfully"))
        setShowOrderModal(false)
        setForm({
          productId: '',
          supplierId: '',
          supplierName: '',
          quantity: '',
          unit: 'kg',
          expectedDate: new Date().toISOString().split('T')[0],
          timeRange: '09:00 - 11:00',
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
        item.code?.toLowerCase().includes(stockSearch.toLowerCase())
      
      if (stockFilter === 'RED') return matchesSearch && item.status === 'red'
      if (stockFilter === 'YELLOW') return matchesSearch && item.status === 'yellow'
      if (stockFilter === 'GREEN') return matchesSearch && item.status === 'green'
      return matchesSearch
    })
  }, [inventory, stockSearch, stockFilter])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.productName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.supplierName?.toLowerCase().includes(orderSearch.toLowerCase())
      
      if (orderFilter === 'PENDING') return matchesSearch && (order.status === 'PENDING')
      if (orderFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0]
        return matchesSearch && (order.status === 'PENDING') && (order.expectedDate && order.expectedDate.startsWith(today))
      }
      if (orderFilter === 'DELAYED') return matchesSearch && (order.status === 'DELAYED')
      if (orderFilter === 'DELIVERED') return matchesSearch && (order.status === 'DELIVERED')
      if (orderFilter === 'CANCELLED') return matchesSearch && (order.status === 'CANCELLED')
      return matchesSearch
    })
  }, [orders, orderSearch, orderFilter])

  // 10 tadan yuklash (Infinite Scroll & Show All)
  const inventoryPagination = useInfiniteTable(filteredInventory, 10, [stockSearch, stockFilter])
  const ordersPagination = useInfiniteTable(filteredOrders, 10, [orderSearch, orderFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/60 p-6 rounded-2xl border border-dark-700 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {formatDual("Ta'minot & Sklad Zanjiri", "Цепочка поставок и склад", "Supply & Warehouse Chain")}
            </span>
            <span className="text-xs text-slate-500">{formatDual("Real-time Sklad & Solishtiruv", "Склад в реальном времени & Сверка", "Real-time Stock & Reconciliation")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatDual("Ta'minot va Buyurtmalar Markazi (Snabjenets)", "Центр снабжения и заказов (Снабженец)", "Supply & Purchase Orders Center")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {formatDual(
              "Sklad real qoldig'iga qarab buyurtma berish, yetkazib beruvchilarni boshqarish va farqlarni solishtirish",
              "Заказ сырья по реальным остаткам склада, управление поставщиками и сверка поставок",
              "Order raw materials by real stock, manage suppliers, and reconcile deliveries"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors"
            title={formatDual("Yangilash", "Обновить", "Refresh")}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin text-blue-400' : ''} />
          </button>
          <button
            onClick={() => {
              setForm({
                productId: '',
                supplierId: '',
                supplierName: '',
                quantity: '',
                unit: 'kg',
                expectedDate: new Date().toISOString().split('T')[0],
                timeRange: '09:00 - 11:00',
                price: '',
                notes: ''
              })
              setShowOrderModal(true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Plus size={18} />
            <span>{formatDual("Yangi Buyurtma", "Новый заказ", "New Order")}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: 7 Key Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Out of stock (Red) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('RED'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-red-500 ${stockFilter === 'RED' && activeTab === 'inventory' ? 'ring-2 ring-red-500/50 bg-red-500/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Tugagan", "Закончилось", "Out of Stock")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.outOfStockCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("0 kg qoldiq", "0 кг остаток", "0 stock")}</div>
        </div>

        {/* 2. Low stock (Yellow) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('YELLOW'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-amber-500 ${stockFilter === 'YELLOW' && activeTab === 'inventory' ? 'ring-2 ring-amber-500/50 bg-amber-500/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Kamaygan", "Мало", "Low Stock")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.lowStockCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">&lt; {formatDual("Minimal me'yor", "Мин. норма", "Min stock")}</div>
        </div>

        {/* 3. Sufficient (Green) */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('GREEN'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-emerald-500 ${stockFilter === 'GREEN' && activeTab === 'inventory' ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Yetarli", "В норме", "Sufficient")}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.sufficientCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">&gt;= {formatDual("Minimal zaxira", "Мин. запас", "Min reserve")}</div>
        </div>

        {/* 4. Order Needed */}
        <div 
          onClick={() => { setActiveTab('inventory'); setStockFilter('RED'); }}
          className="card p-4 rounded-xl cursor-pointer hover:bg-dark-800 transition-all border-l-4 border-l-blue-500"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Ehtiyoj", "Потребность", "Needed")}</span>
            <ShoppingCart size={14} />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.orderNeededCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Buyurtma kerak", "Нужен заказ", "Order needed")}</div>
        </div>

        {/* 5. Pending orders */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('PENDING'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-indigo-500 ${orderFilter === 'PENDING' && activeTab === 'orders' ? 'ring-2 ring-indigo-500/50 bg-indigo-500/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Kutilmoqda", "Ожидается", "Pending")}</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.pendingOrdersCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Faol buyurtma", "Активный заказ", "Active orders")}</div>
        </div>

        {/* 6. Today deliveries */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('TODAY'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-cyan-500 ${orderFilter === 'TODAY' && activeTab === 'orders' ? 'ring-2 ring-cyan-500/50 bg-cyan-500/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Bugun", "Сегодня", "Today")}</span>
            <Truck size={14} />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.todayDeliveriesCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatDual("Kelishi kerak", "Ожидается привоз", "Expected today")}</div>
        </div>

        {/* 7. Delayed orders */}
        <div 
          onClick={() => { setActiveTab('orders'); setOrderFilter('DELAYED'); }}
          className={`card p-4 rounded-xl cursor-pointer transition-all border-l-4 border-l-rose-600 ${orderFilter === 'DELAYED' && activeTab === 'orders' ? 'ring-2 ring-rose-600/50 bg-rose-600/10' : 'hover:bg-dark-800'}`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase">{formatDual("Kechikkan", "Просрочено", "Delayed")}</span>
            <AlertTriangle size={14} />
          </div>
          <div className="text-2xl font-bold text-rose-400">{metrics.delayedOrdersCount || 0}</div>
          <div className="text-[11px] text-rose-500/80 mt-0.5">{formatDual("Yetkazilmadi", "Не доставлено", "Not delivered")}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-dark-700 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <Package size={16} />
            <span>{formatDual("Sklad Qoldiqlari & Buyurtma Takliflari", "Остатки на складе & Рекомендации заказов", "Stock & Reorder Suggestions")}</span>
            {metrics.orderNeededCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                {metrics.orderNeededCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-dark-800/80 text-slate-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <Truck size={16} />
            <span>{formatDual("Buyurtmalar & Solishtiruv (Reconciliation)", "Заказы & Сверка поставок (Reconciliation)", "Orders & Reconciliation")}</span>
            <span className="px-2 py-0.5 text-xs bg-dark-700 text-slate-300 rounded-full">
              {orders.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: Real-time Sklad Qoldiqlari & Buyurtma Takliflari */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-dark-900/60 p-4 rounded-xl border border-dark-700">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={formatDual("Mahsulot nomi yoki kodi bo'yicha qidirish...", "Поиск по названию или коду товара...", "Search by product name or code...")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <SlidersHorizontal size={14} /> {formatDual("Holat:", "Статус:", "Status:")}
              </span>
              <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    stockFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Barchasi", "Все", "All")}
                </button>
                <button
                  onClick={() => setStockFilter('RED')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    stockFilter === 'RED' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 {formatDual("Tugagan", "Закончилось", "Out of stock")}
                </button>
                <button
                  onClick={() => setStockFilter('YELLOW')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    stockFilter === 'YELLOW' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟡 {formatDual("Kamaygan", "Мало", "Low")}
                </button>
                <button
                  onClick={() => setStockFilter('GREEN')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    stockFilter === 'GREEN' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 {formatDual("Yetarli", "Достаточно", "Sufficient")}
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="card overflow-hidden border border-dark-700 bg-dark-900/70">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
                <p>{formatDual("Sklad qoldiqlari tahlil qilinmoqda...", "Анализ остатков на складе...", "Analyzing warehouse stock...")}</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Package size={40} className="mx-auto mb-3 text-slate-600" />
                <p>{formatDual("Hech qanday mahsulot topilmadi", "Товары не найдены", "No products found")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <th className="py-3.5 px-4">{formatDual("Mahsulot", "Товар / Сырье", "Product")}</th>
                      <th className="py-3.5 px-4">{formatDual("Kategoriya", "Категория", "Category")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Sklad Qoldig'i", "Остаток на складе", "Warehouse Stock")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Minimal Zaxira", "Мин. остаток", "Min Stock")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Yetishmayotgan Miqdor", "Недостающее кол-во", "Shortage / Needed")}</th>
                      <th className="py-3.5 px-4 text-right">{formatDual("Tezkor Harakat", "Действие", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50 text-sm">
                    {inventoryPagination.displayedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-dark-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              item.status === 'red' ? 'bg-red-500 animate-pulse' :
                              item.status === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <div>
                              <span>{item.name}</span>
                              {item.code && (
                                <span className="block text-[11px] text-slate-500 font-mono">
                                  {item.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {item.category || formatDual('Xomashyo', 'Сырьё', 'Raw material')}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                          <span className={`px-2.5 py-1 rounded-lg ${
                            item.totalQuantity === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            item.status === 'yellow' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.totalQuantity} {item.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          {item.minStockLevel > 0 ? `${item.minStockLevel} ${item.unit}` : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.status === 'red' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              <span className="w-2 h-2 rounded-full bg-red-500" /> {formatDual("Tugagan", "Закончилось", "Out of stock")}
                            </span>
                          )}
                          {item.status === 'yellow' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> {formatDual("Kamaygan", "Мало", "Low")}
                            </span>
                          )}
                          {item.status === 'green' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {formatDual("Yetarli", "Достаточно", "Sufficient")}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {item.neededQuantity > 0 ? (
                            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              +{item.neededQuantity} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleQuickOrder(item)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              item.status === 'red'
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                                : item.status === 'yellow'
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                                : 'bg-dark-700 hover:bg-dark-600 text-slate-300'
                            }`}
                          >
                            <ShoppingCart size={14} />
                            <span>{formatDual("Buyurtma Berish", "Заказать", "Order")}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
            {!loading && filteredInventory.length > 0 && (
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
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Buyurtmalar & Yetkazib Berish Nazorati (Reconciliation) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-dark-900/60 p-4 rounded-xl border border-dark-700">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder={formatDual("Mahsulot yoki yetkazib beruvchi bo'yicha qidirish...", "Поиск по товару или поставщику...", "Search by product or supplier...")}
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
                <button
                  onClick={() => setOrderFilter('ALL')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    orderFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Barchasi", "Все", "All")}
                </button>
                <button
                  onClick={() => setOrderFilter('PENDING')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    orderFilter === 'PENDING' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏳ {formatDual("Kutilmoqda", "Ожидается", "Pending")}
                </button>
                <button
                  onClick={() => setOrderFilter('DELAYED')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    orderFilter === 'DELAYED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 {formatDual("Kechikkan", "Просрочено", "Delayed")}
                </button>
                <button
                  onClick={() => setOrderFilter('DELIVERED')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    orderFilter === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 {formatDual("Yetkazildi", "Доставлено", "Delivered")}
                </button>
                <button
                  onClick={() => setOrderFilter('CANCELLED')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    orderFilter === 'CANCELLED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {formatDual("Bekor qilingan", "Отменено", "Cancelled")}
                </button>
              </div>
            </div>
          </div>

          {/* Orders & Reconciliation Table */}
          <div className="card overflow-hidden border border-dark-700 bg-dark-900/70">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
                <p>{formatDual("Buyurtmalar yuklanmoqda...", "Загрузка заказов...", "Loading orders...")}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Truck size={40} className="mx-auto mb-3 text-slate-600" />
                <p>{formatDual("Hech qanday buyurtma topilmadi", "Заказов не найдено", "No orders found")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <th className="py-3.5 px-4">{formatDual("Buyurtma & Sana", "Заказ & Дата", "Order & Date")}</th>
                      <th className="py-3.5 px-4">{formatDual("Mahsulot", "Товар", "Product")}</th>
                      <th className="py-3.5 px-4">{formatDual("Yetkazib Beruvchi", "Поставщик", "Supplier")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Buyurtma Miqdori", "Кол-во заказа", "Ordered Qty")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Kelgan Miqdor", "Привезено", "Delivered Qty")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Qabul Qilingan", "Принято", "Accepted Qty")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Farq / Yetishmagan", "Разница / Недостача", "Shortage / Diff")}</th>
                      <th className="py-3.5 px-4 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                      <th className="py-3.5 px-4 text-right">{formatDual("Solishtirish / Amal", "Сверка / Действие", "Reconcile / Action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50 text-sm">
                    {ordersPagination.displayedItems.map((order) => (
                      <tr key={order.id} className="hover:bg-dark-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="font-bold text-blue-400 mb-1">#{order.id}</div>
                          <div className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded inline-block mb-1">
                            {formatDual("Zakaz", "Заказ", "Order")}: {new Date(order.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-slate-400 flex items-center gap-1 mt-0.5 font-bold">
                            <span className="text-[10px] bg-dark-700 px-1 py-0.5 rounded">{formatDual("Kelish:", "Привоз:", "Arrival:")}</span>
                            {order.expectedDateStr} {order.timeRange}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white block">{order.productName}</span>
                          {order.price && (
                            <span className="text-[11px] text-slate-400">
                              {order.price.toLocaleString()} {formatDual("so'm", "сум", "UZS")} / {order.unit}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Building2 size={14} className="text-slate-500" />
                            <span>{order.supplierName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                          <span className="bg-dark-800 px-2.5 py-1 rounded-lg border border-dark-700">
                            {order.quantity} {order.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-semibold">
                          {order.deliveredQuantity !== null ? (
                            <span className={order.deliveredQuantity < order.quantity ? 'text-amber-400' : 'text-emerald-400'}>
                              {order.deliveredQuantity} {order.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">{formatDual("Kutilmoqda", "Ожидается", "Pending")}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-semibold">
                          {order.acceptedQuantity !== null ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {order.acceptedQuantity} {order.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {order.shortageQuantity !== null && order.shortageQuantity > 0 ? (
                            <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              -{order.shortageQuantity} {order.unit}
                            </span>
                          ) : order.shortageQuantity === 0 ? (
                            <span className="text-emerald-400">{formatDual("0 (To'liq)", "0 (Полностью)", "0 (Full)")}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {order.status === 'DELAYED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertTriangle size={12} /> {formatDual("Kechikdi", "Просрочен", "Delayed")}
                            </span>
                          )}
                          {order.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <Clock size={12} /> {formatDual("Kutilmoqda", "Ожидается", "Pending")}
                            </span>
                          )}
                          {order.status === 'DELIVERED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={12} /> {formatDual("Bajarildi", "Выполнен", "Delivered")}
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-400">
                              <XCircle size={12} /> {formatDual("Bekor qilindi", "Отменён", "Cancelled")}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenReconcile(order)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors"
                              title={formatDual("Yetkazib berilgan miqdorni kiritish va solishtirish", "Ввести поставленное количество и сверить", "Enter delivered qty and reconcile")}
                            >
                              {formatDual("Solishtirish", "Сверить", "Reconcile")}
                            </button>

                            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
            )}

            {/* 10 tadan yuklash & Butun jadvalni ko'rish footeri */}
            {!loading && filteredOrders.length > 0 && (
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
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Yangi Buyurtma Yaratish (Snabjenets)                             */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-enter"
          onClick={() => setShowOrderModal(false)}
        >
          <div 
            className="w-full max-w-xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{formatDual("Yangi Xarid Buyurtmasi", "Новый заказ на закупку", "New Purchase Order")}</h3>
                  <p className="text-xs text-slate-400">{formatDual("Yetkazib beruvchiga mahsulot buyurtma qilish", "Заказ сырья у поставщика", "Order supplies from vendor")}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Mahsulot", "Товар / Сырье", "Product")} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.productId}
                  onChange={(e) => {
                    const selected = products.find(p => p.id === parseInt(e.target.value))
                    setForm({
                      ...form,
                      productId: e.target.value,
                      unit: selected?.unit || 'kg'
                    })
                  }}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">{formatDual("Mahsulotni tanlang...", "Выберите товар...", "Select product...")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit || 'kg'}) {p.category ? `• ${p.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Miqdor", "Количество", "Quantity")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={formatDual("Masalan: 100", "Например: 100", "e.g. 100")}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("O'lchov Birligi", "Ед. изм.", "Unit")}
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Yetkazib Beruvchi (Supplier)", "Поставщик (Supplier)", "Supplier")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={form.supplierId}
                    onChange={(e) => {
                      const sup = suppliers.find(s => s.id === parseInt(e.target.value))
                      setForm({
                        ...form,
                        supplierId: e.target.value,
                        supplierName: sup ? sup.name : form.supplierName
                      })
                    }}
                    className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">{formatDual("Ro'yxatdan tanlash...", "Выбрать из списка...", "Select from list...")}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder={formatDual("Yoki yangi nom yozing...", "Или введите название...", "Or enter new name...")}
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Delivery Date & Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelishi Kerak Bo'lgan Sana", "Ожидаемая дата поставки", "Expected Delivery Date")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelish Vaqti Oralig'i", "Интервал времени поставки", "Delivery Time Window")}
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 - 11:00"
                    value={form.timeRange}
                    onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Price & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelishilgan Narx (so'm / birlik)", "Договорная цена (сум / ед)", "Agreed Price (UZS / unit)")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={formatDual("Masalan: 85000", "Например: 85000", "e.g. 85000")}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    {formatDual("Izoh / Maxsus Talablar", "Примечание / Требования", "Notes / Special Requests")}
                  </label>
                  <input
                    type="text"
                    placeholder={formatDual("Harorat me'yori, sifat talabi...", "Температурный режим, требования к качеству...", "Temperature, quality specs...")}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {savingOrder && <Loader2 size={16} className="animate-spin" />}
                  <span>{formatDual("Buyurtmani Tasdiqlash", "Подтвердить заказ", "Confirm Order")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Yetkazib Berishni Solishtirish (Reconciliation Modal - 7, 8-band) */}
      {/* ========================================================================= */}
      {showReconcileModal && selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-enter"
          onClick={() => setShowReconcileModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{formatDual("Buyurtma va Yetkazib Berishni Solishtirish", "Сверка заказа и фактической поставки", "Reconcile Order & Delivery")}</h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Buyurtma", "Заказ", "Order")} #{selectedOrder.id} • {selectedOrder.productName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowReconcileModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReconcile} className="space-y-4 pt-4">
              {/* Reference Info Card */}
              <div className="bg-dark-800 p-3.5 rounded-xl border border-dark-700 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">{formatDual("Buyurtma miqdori:", "Количество в заказе:", "Ordered quantity:")}</span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedOrder.quantity} {selectedOrder.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">{formatDual("Yetkazib beruvchi:", "Поставщик:", "Supplier:")}</span>
                  <span className="font-semibold text-slate-200 block truncate">
                    {selectedOrder.supplierName}
                  </span>
                </div>
              </div>

              {/* Arrived vs Accepted vs Rejected inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {formatDual("Kelgan Miqdor", "Привезено", "Delivered Qty")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.deliveredQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, deliveredQuantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {formatDual("Qabul Qilingan", "Принято", "Accepted Qty")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.acceptedQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, acceptedQuantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {formatDual("Qaytarilgan", "Возвращено (брак)", "Rejected Qty")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={reconcileForm.rejectedQuantity}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, rejectedQuantity: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-rose-400 text-sm focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Shortage Display */}
              {(() => {
                const del = parseFloat(reconcileForm.deliveredQuantity) || 0
                const shortage = selectedOrder.quantity - del
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    shortage > 0 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}>
                    <span>{formatDual("Farq / Yetishmagan miqdor:", "Разница / Недостача:", "Difference / Shortage:")}</span>
                    <span className="font-bold text-sm font-mono">
                      {shortage > 0 ? `-${shortage.toFixed(2)} ${selectedOrder.unit}` : formatDual("0 (To'liq yetkazildi)", "0 (Полностью доставлено)", "0 (Fully delivered)")}
                    </span>
                  </div>
                )
              })()}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Buyurtma Holati", "Статус заказа", "Order Status")}
                </label>
                <select
                  value={reconcileForm.status}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, status: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="DELIVERED">{formatDual("Bajarildi (Qabul qilindi)", "Выполнен (Принято)", "Delivered (Accepted)")}</option>
                  <option value="PENDING">{formatDual("Kutilmoqda", "Ожидается", "Pending")}</option>
                  <option value="DELAYED">{formatDual("Kechikdi", "Просрочен", "Delayed")}</option>
                  <option value="CANCELLED">{formatDual("Bekor qilindi", "Отменён", "Cancelled")}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {formatDual("Izoh / Qabul Qilish Sababi", "Примечание / Причина расхождения", "Notes / Reconcile Reason")}
                </label>
                <input
                  type="text"
                  placeholder={formatDual("Yetishmovchilik yoki sifat sababi...", "Причина недостачи или брака...", "Reason for shortage or defect...")}
                  value={reconcileForm.notes}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingReconcile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
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

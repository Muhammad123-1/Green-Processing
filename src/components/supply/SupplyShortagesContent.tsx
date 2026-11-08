'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Send,
  Building2,
  Calendar,
  X,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  Filter,
  Layers,
  Phone,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface RequisitionItem {
  id: number
  productId: number
  supplierId: number | null
  supplierName: string | null
  quantity: number
  unit: string | null
  expectedDate: string
  timeRange: string | null
  status: string
  notes: string | null
  warehouseNotes?: string | null
  price?: number | null
  currentStock: number
  stage: 'PENDING_SUPPLIER' | 'DISPATCHED_TO_SUPPLIER' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  product: {
    id: number
    name: string
    code: string | null
    category: string | null
    unit: string | null
    minStockLevel: number | null
  }
  supplier: {
    id: number
    name: string
    phone: string | null
    category: string
  } | null
  inspections?: Array<{
    id: number
    actNumber: string
    inspectionDate: string
    quantity: number
    status: string
  }>
}

interface OutOfStockProduct {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  stock: number
  minStockLevel: number
  status: 'red' | 'yellow'
  topSupplierName: string | null
  topSupplierId: number | null
}

interface SupplierOption {
  id: number
  name: string
  shortName: string | null
  phone: string | null
  category: string
  address: string | null
}

export default function SupplyShortagesContent() {
  const { lang, formatDual } = useLanguage()

  const [activeTab, setActiveTab] = useState<'requisitions' | 'outOfStock'>('requisitions')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<OutOfStockProduct[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])

  const uniqueSuppliers = useMemo(() => {
    const seen = new Set<string>()
    return suppliers.filter(s => {
      const k = s.name.trim().toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [suppliers])
  const [metrics, setMetrics] = useState({
    pendingRequisitions: 0,
    dispatchedToSupplier: 0,
    deliveredOrders: 0,
    outOfStockCount: 0
  })

  // Filters
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<'ALL' | 'PENDING_SUPPLIER' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED'>('ALL')

  // Dispatch / Assign Supplier Modal
  const [dispatchModalItem, setDispatchModalItem] = useState<RequisitionItem | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [orderQuantity, setOrderQuantity] = useState<string>('')
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [deliveryTimeRange, setDeliveryTimeRange] = useState<string>('09:00 - 12:00')
  const [agreedPrice, setAgreedPrice] = useState<string>('')
  const [supplyNotes, setSupplyNotes] = useState<string>('')
  const [submittingDispatch, setSubmittingDispatch] = useState(false)

  // Quick Order for zero-stock catalog item modal
  const [directOrderItem, setDirectOrderItem] = useState<OutOfStockProduct | null>(null)
  const [directSubmitting, setDirectSubmitting] = useState(false)

  useEffect(() => {
    fetchShortagesData()
  }, [])

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDispatchModalItem(null)
        setDirectOrderItem(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchShortagesData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/supply/shortages')
      if (!res.ok) {
        throw new Error('Failed to load shortages data')
      }
      const data = await res.json()
      setRequisitions(data.requisitions || [])
      setOutOfStockProducts(data.outOfStockProducts || [])
      setSuppliers(data.suppliers || [])
      if (data.metrics) {
        setMetrics(data.metrics)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || formatDual("Ma'lumotlarni yuklashda xatolik", "Ошибка при загрузке данных", "Failed to load data"))
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/supply/shortages')
      if (res.ok) {
        const data = await res.json()
        setRequisitions(data.requisitions || [])
        setOutOfStockProducts(data.outOfStockProducts || [])
        setSuppliers(data.suppliers || [])
        if (data.metrics) {
          setMetrics(data.metrics)
        }
        toast.success(formatDual("Ma'lumotlar yangilandi", "Данные обновлены", "Data updated"))
      }
    } catch {
      toast.error(formatDual("Yangilashda xatolik", "Ошибка обновления", "Update error"))
    } finally {
      setRefreshing(false)
    }
  }

  // Open modal to assign supplier to requisition
  const handleOpenDispatchModal = (item: RequisitionItem) => {
    setDispatchModalItem(item)
    setSelectedSupplierId(item.supplierId ? item.supplierId.toString() : '')
    setOrderQuantity(item.quantity.toString())

    const expDate = new Date(item.expectedDate)
    const validDate = !isNaN(expDate.getTime()) ? expDate.toISOString().split('T')[0] : ''
    setDeliveryDate(validDate || new Date().toISOString().split('T')[0])
    setDeliveryTimeRange(item.timeRange || '09:00 - 12:00')
    setAgreedPrice(item.price ? item.price.toString() : '')
    setSupplyNotes(item.supplierId && item.notes ? item.notes : '')
  }

  // Submit Supplier Assignment / Order Dispatch
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispatchModalItem || !selectedSupplierId) {
      toast.error(formatDual("Iltimos, ta'minotchini tanlang", "Пожалуйста, выберите поставщика", "Please select a supplier"))
      return
    }

    const numQty = parseFloat(orderQuantity)
    if (isNaN(numQty) || numQty <= 0) {
      toast.error(formatDual("Miqdorni to'g'ri kiriting", "Укажите корректное количество", "Enter valid quantity"))
      return
    }

    setSubmittingDispatch(true)
    try {
      const res = await fetch('/api/supply/shortages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dispatchModalItem.id,
          supplierId: parseInt(selectedSupplierId),
          quantity: numQty,
          expectedDate: deliveryDate,
          timeRange: deliveryTimeRange,
          price: agreedPrice ? parseFloat(agreedPrice) : null,
          notes: supplyNotes
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(
          data.message ||
          formatDual(
            "Buyurtma ta'minotchiga muvaffaqiyatli jo'natildi! Ta'minotchi portalida aks etdi.",
            "Заказ успешно отправлен поставщику и появился в его личном кабинете!",
            "Order successfully dispatched to supplier portal!"
          )
        )
        setDispatchModalItem(null)
        fetchShortagesData()
      } else {
        toast.error(data.error || "Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSubmittingDispatch(false)
    }
  }

  // Open direct order modal from out of stock list
  const handleOpenDirectOrder = (prod: OutOfStockProduct) => {
    setDirectOrderItem(prod)
    setSelectedSupplierId(prod.topSupplierId ? prod.topSupplierId.toString() : '')
    setOrderQuantity((prod.minStockLevel > 0 ? prod.minStockLevel * 2 : 1000).toString())

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDeliveryDate(tomorrow.toISOString().split('T')[0])
    setDeliveryTimeRange('09:00 - 12:00')
    setAgreedPrice('')
    setSupplyNotes(`Omborda ${prod.name} tugagan (Qoldiq: ${prod.stock} ${prod.unit}). Zudlik bilan yetkazib berish buyurtmasi.`)
  }

  // Submit direct purchase order
  const handleConfirmDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directOrderItem) return

    const numQty = parseFloat(orderQuantity)
    if (isNaN(numQty) || numQty <= 0) {
      toast.error("Miqdorni to'g'ri kiriting")
      return
    }

    setDirectSubmitting(true)
    try {
      const res = await fetch('/api/supply/shortages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: directOrderItem.id,
          supplierId: selectedSupplierId ? parseInt(selectedSupplierId) : null,
          quantity: numQty,
          expectedDate: deliveryDate,
          timeRange: deliveryTimeRange,
          price: agreedPrice ? parseFloat(agreedPrice) : null,
          notes: supplyNotes
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(
          formatDual(
            "Buyurtma muvaffaqiyatli shakllantirildi va ta'minotchi portaliga jo'natildi!",
            "Заказ успешно оформлен и передан в кабинет поставщика!",
            "Order created and sent to supplier portal!"
          )
        )
        setDirectOrderItem(null)
        fetchShortagesData()
      } else {
        toast.error(data.error || "Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setDirectSubmitting(false)
    }
  }

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(item => {
      // Stage filter
      if (stageFilter === 'PENDING_SUPPLIER' && item.stage !== 'PENDING_SUPPLIER') return false
      if (stageFilter === 'DISPATCHED' && item.stage !== 'DISPATCHED_TO_SUPPLIER') return false
      if (stageFilter === 'IN_TRANSIT' && item.stage !== 'IN_TRANSIT') return false
      if (stageFilter === 'DELIVERED' && item.stage !== 'DELIVERED') return false

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const prodMatch = (item.product?.name || '').toLowerCase().includes(q)
        const supMatch = (item.supplier?.name || item.supplierName || '').toLowerCase().includes(q)
        const noteMatch = (item.notes || '').toLowerCase().includes(q)
        const idMatch = `#${item.id}`.includes(q)
        if (!prodMatch && !supMatch && !noteMatch && !idMatch) return false
      }

      return true
    })
  }, [requisitions, stageFilter, search])

  // Filtered Out of Stock Products
  const filteredOutOfStock = useMemo(() => {
    if (!search.trim()) return outOfStockProducts
    const q = search.toLowerCase()
    return outOfStockProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.topSupplierName || '').toLowerCase().includes(q)
    )
  }, [outOfStockProducts, search])

  const renderStageBadge = (stage: string, supName: string | null) => {
    switch (stage) {
      case 'PENDING_SUPPLIER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{formatDual("Ta'minotchi biriktirilmagan", "Требуется поставщик", "Supplier Needed")}</span>
          </span>
        )
      case 'DISPATCHED_TO_SUPPLIER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock size={12} className="text-blue-500" />
            <span>{formatDual(`Ta'minotchiga yuborildi (${supName || 'Biriktirilgan'})`, `Отправлено (${supName || 'Поставщику'})`, `Dispatched (${supName || 'Supplier'})`)}</span>
          </span>
        )
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Truck size={13} className="text-amber-500" />
            <span>{formatDual("Yo'lda (Haydovchi chiqqan)", "В пути (Выехал)", "In Transit")}</span>
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>{formatDual("Omborga yetkazildi", "Доставлено на склад", "Delivered")}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
            {stage}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-dark-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle size={13} />
              <span>{formatDual("Ta'minot Zanjiri / Ombordan Qolmaganlar", "Цепочка Снабжения / Дефицит", "Procurement Supply Chain")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatDual("Ombordan Qolmagan Mahsulotlar", "Заявки со склада и дефицит", "Warehouse Shortages & Orders")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {formatDual(
                "Ombor xodimlaridan tushgan talabnomalar, qolmagan mahsulotlar va ta'minotchilarga buyurtma taqsimlash zanjiri. Bir marta bosish bilan buyurtma to'g'ri ta'minotchi portaliga tushadi.",
                "Заявки сотрудников склада при нехватке сырья и распределение заказов по поставщикам. Заказ сразу поступает в личный кабинет поставщика.",
                "Requisitions from warehouse staff and procurement assignment. Orders automatically flow directly into supplier portals."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <Link
              href="/orders"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700 transition-all flex items-center gap-2"
            >
              <ShoppingCart size={14} />
              <span>{formatDual("Barcha Buyurtmalar", "Все заказы", "All Orders")}</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700 transition-all"
              title={formatDual("Yangilash", "Обновить", "Refresh")}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI / Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Supplier Assignment */}
        <div
          onClick={() => { setActiveTab('requisitions'); setStageFilter('PENDING_SUPPLIER'); }}
          className="bg-white dark:bg-dark-900 border-2 border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {formatDual("Ta'minotchi Kutilmoqda", "Ждут поставщика", "Need Supplier")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {metrics.pendingRequisitions}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatDual("Ombor so'ragan, buyurtma berish kerak", "Заявки со склада без поставщика", "Warehouse requests without supplier")}
          </p>
        </div>

        {/* Card 2: Depleted Warehouse Stock (0 kg) */}
        <div
          onClick={() => setActiveTab('outOfStock')}
          className="bg-white dark:bg-dark-900 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {formatDual("Omborda Tugagan (0 kg)", "Закончилось (0 кг)", "Out of Stock (0 kg)")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Package size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {metrics.outOfStockCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatDual("Qoldiq tugagan xomashyolar", "Товаров с нулевым остатком", "Zero stock products")}
          </p>
        </div>

        {/* Card 3: Dispatched to Supplier */}
        <div
          onClick={() => { setActiveTab('requisitions'); setStageFilter('DISPATCHED'); }}
          className="bg-white dark:bg-dark-900 border-2 border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {formatDual("Ta'minotchiga Berilgan", "Передано поставщику", "Sent to Supplier")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {metrics.dispatchedToSupplier}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatDual("Portal orqali kutilmoqda yoki yo'lda", "В личном кабинете или в пути", "In supplier portal or transit")}
          </p>
        </div>

        {/* Card 4: Delivered */}
        <div
          onClick={() => { setActiveTab('requisitions'); setStageFilter('DELIVERED'); }}
          className="bg-white dark:bg-dark-900 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {formatDual("Omborga Yetkazildi", "Доставлено на склад", "Delivered")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.deliveredOrders}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatDual("Bajarilgan buyurtmalar", "Выполненные заявки", "Completed requisitions")}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-700 pb-3">
        <div className="flex bg-slate-100 dark:bg-dark-800 p-1 rounded-2xl border border-slate-200 dark:border-dark-700">
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'requisitions'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle size={15} />
            <span>{formatDual("1. Ombor Talabnomalari & Buyurtmalar", "1. Заявки со склада", "1. Warehouse Requisitions")}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-dark-900 text-[10px] font-extrabold">
              {requisitions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('outOfStock')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'outOfStock'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package size={15} />
            <span>{formatDual("2. Omborda Tugagan Xomashyolar (0 kg)", "2. Закончилось на складе", "2. Out of Stock Catalog")}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-dark-900 text-[10px] font-extrabold">
              {outOfStockProducts.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={formatDual("Mahsulot, ta'minotchi, izoh bo'yicha qidirish...", "Поиск по товару, поставщику, примечанию...", "Search product, supplier, notes...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 4. Sub-filters for Requisitions */}
      {activeTab === 'requisitions' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              stageFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-dark-900'
                : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {formatDual("Barchasi", "Все", "All")} ({requisitions.length})
          </button>

          <button
            onClick={() => setStageFilter('PENDING_SUPPLIER')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              stageFilter === 'PENDING_SUPPLIER'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{formatDual("Ta'minotchi biriktirish kerak", "Нужен поставщик", "Need Supplier")}</span> ({metrics.pendingRequisitions})
          </button>

          <button
            onClick={() => setStageFilter('DISPATCHED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              stageFilter === 'DISPATCHED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
            }`}
          >
            <Clock size={13} />
            <span>{formatDual("Ta'minotchiga yuborilgan", "Передано поставщику", "Dispatched")}</span> ({metrics.dispatchedToSupplier})
          </button>

          <button
            onClick={() => setStageFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              stageFilter === 'DELIVERED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>{formatDual("Yetkazildi", "Доставлено", "Delivered")}</span> ({metrics.deliveredOrders})
          </button>
        </div>
      )}

      {/* 5. TAB 1: REQUISITIONS LIST */}
      {activeTab === 'requisitions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-16 text-center">
              <RefreshCw size={36} className="animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatDual("Talabnomalar yuklanmoqda...", "Загрузка заявок...", "Loading requisitions...")}
              </p>
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-16 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {formatDual("Hozircha kutilayotgan talabnomalar yo'q", "Нет активных заявок со склада", "No pending requisitions")}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {formatDual(
                  "Ombor xodimlari mahsulot tugadi deb talabnoma yuborganda ular shu yerda paydo bo'ladi.",
                  "Когда склад запросит сырье, заявки сразу появятся на этой странице для назначения поставщика.",
                  "When warehouse staff submits an out-of-stock request, it will appear here for supplier assignment."
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequisitions.map((item) => {
                const needsSupplier = item.stage === 'PENDING_SUPPLIER'
                const isDelivered = item.stage === 'DELIVERED'

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-dark-900 border-2 rounded-3xl p-5 sm:p-6 transition-all shadow-xs ${
                      needsSupplier
                        ? 'border-rose-500/40 hover:border-rose-500 dark:border-rose-500/30'
                        : isDelivered
                        ? 'border-emerald-500/20'
                        : 'border-slate-200 dark:border-dark-750 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Product & Requisition details */}
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            #{item.id}
                          </span>
                          <span className="text-slate-300 dark:text-dark-600">•</span>
                          {renderStageBadge(item.stage, item.supplier?.name || item.supplierName)}
                          <span className="text-slate-300 dark:text-dark-600">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(item.createdAt).toLocaleDateString()} ({new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">
                            {item.product?.name || "Noma'lum mahsulot"}
                          </h3>
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            {item.product?.category || "Xomashyo"} {item.product?.code ? `(${item.product.code})` : ''}
                          </span>
                        </div>

                        {/* Inventory Context Pill */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                            <span className="text-slate-500">Ombordagi real qoldiq:</span>
                            <span className={`font-black ${item.currentStock <= 0 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
                              {item.currentStock} {item.unit || 'kg'}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                            <span className="text-slate-500">Ombor so'ragan miqdor:</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {item.quantity.toLocaleString()} {item.unit || 'kg'}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                            <span className="text-slate-500">Muddati:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {new Date(item.expectedDate).toLocaleDateString()} ({item.timeRange || '09:00 - 12:00'})
                            </span>
                          </div>
                        </div>

                        {/* Omborchi notes (Warehouse Izohi) */}
                        {(item.warehouseNotes || (!item.supplierId && item.notes)) && (
                          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">📦 Omborchi izohi (Ombordan kelgan):</span>
                            <p className="italic">"{item.warehouseNotes || item.notes}"</p>
                          </div>
                        )}

                        {/* Ta'minotchi notes (Supply notes to supplier) */}
                        {item.supplierId && item.notes && (
                          <div className="p-3 bg-blue-50 dark:bg-dark-800/70 rounded-xl border border-blue-200 dark:border-dark-700 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">🚚 Ta'minotchi uchun izoh (Zavoddan):</span>
                            <p className="italic">"{item.notes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Supplier Card & Action Button */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-dark-750">
                        {/* Supplier Info if assigned */}
                        {item.supplierId ? (
                          <div className="text-left lg:text-right bg-blue-50/50 dark:bg-dark-850 p-3 rounded-2xl border border-blue-200 dark:border-dark-700 min-w-[200px]">
                            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                              Biriktirilgan Ta'minotchi
                            </span>
                            <Link
                              href={`/suppliers/${item.supplierId}`}
                              className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-500 flex items-center lg:justify-end gap-1 mt-0.5"
                            >
                              <Building2 size={14} className="text-blue-500" />
                              <span>{item.supplier?.name || item.supplierName}</span>
                            </Link>
                            {item.supplier?.phone && (
                              <span className="text-[11px] text-slate-500 flex items-center lg:justify-end gap-1 mt-0.5">
                                <Phone size={11} /> {item.supplier.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-left lg:text-right bg-rose-50/50 dark:bg-rose-500/10 p-3 rounded-2xl border border-rose-200 dark:border-rose-500/20">
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                              🔴 Ta'minotchi tanlanmagan
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Zudlik bilan ta'minotchiga jo'nating
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {needsSupplier ? (
                            <button
                              onClick={() => handleOpenDispatchModal(item)}
                              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                            >
                              <Send size={15} />
                              <span>{formatDual("Ta'minotchiga Buyurtma Berish 🚀", "Отправить заказ поставщику 🚀", "Dispatch to Supplier 🚀")}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenDispatchModal(item)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-dark-700 transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>{formatDual("Tahrirlash / Qayta yuborish", "Изменить поставщика", "Re-assign / Edit")}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: OUT OF STOCK PRODUCTS CATALOG */}
      {activeTab === 'outOfStock' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-3">
            <Info size={18} className="flex-shrink-0 text-amber-500" />
            <span>
              {formatDual(
                "Ushbu ro'yxatda ombordagi qoldig'i 0 ga tushgan yoki me'yordan kamaygan barcha xomashyolar jamlangan. Har bir xomashyoni to'g'ridan-to'g'ri ta'minotchiga buyurtma qilish mumkin.",
                "Здесь отображаются все позиции с нулевым или критическим остатком. Вы можете сразу отправить заказ поставщику в один клик.",
                "Here are all depleted or critically low stock materials. You can dispatch orders to suppliers directly."
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOutOfStock.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-dark-900 border-2 border-slate-200 dark:border-dark-750 hover:border-amber-500/50 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      prod.stock <= 0
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {prod.stock <= 0 ? "Qoldiq: 0 (Tugagan)" : "Kritik kam"}
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-semibold">{prod.code || '-'}</span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    {prod.category || 'Xomashyo'}
                  </p>

                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-dark-800/60 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Joriy qoldiq:</span>
                      <span className="font-black text-rose-500">{prod.stock} {prod.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Minimal me'yor:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{prod.minStockLevel} {prod.unit}</span>
                    </div>
                    {prod.topSupplierName && (
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-dark-700">
                        <span className="text-slate-500">Doimiy ta'minotchi:</span>
                        <span className="font-bold text-blue-500 truncate max-w-[150px]">{prod.topSupplierName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDirectOrder(prod)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ShoppingCart size={14} />
                  <span>{formatDual("Ta'minotchiga Buyurtma Berish", "Заказать у поставщика", "Order From Supplier")}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. MODAL: ASSIGN SUPPLIER & DISPATCH ORDER TO SUPPLIER PORTAL */}
      {dispatchModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter overflow-y-auto"
          onClick={() => setDispatchModalItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {formatDual("Ta'minotchiga Buyurtma Jo'natish", "Отправка заказа поставщику", "Dispatch Order to Supplier")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDual("Buyurtma darhol ta'minotchining shaxsiy kabinetida aks etadi", "Заказ сразу поступит в личный кабинет поставщика", "Order flows instantly to supplier portal")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 pt-4">
              {/* Product Info Pill */}
              <div className="p-4 bg-slate-50 dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Mahsulot</span>
                  <span className="text-xs font-mono text-slate-400">#{dispatchModalItem.id}</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {dispatchModalItem.product?.name}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Ombordagi qoldiq: <b className="text-rose-500">{dispatchModalItem.currentStock} {dispatchModalItem.unit}</b></span>
                  <span>•</span>
                  <span>Talab qilingan: <b className="text-emerald-500">{dispatchModalItem.quantity} {dispatchModalItem.unit}</b></span>
                </div>

                {/* Omborchi Izohi (Warehouse Note to Supply) */}
                {(dispatchModalItem.warehouseNotes || (!dispatchModalItem.supplierId && dispatchModalItem.notes)) && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">
                      📦 Omborchi izohi (Ombordan kelgan):
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                      "{dispatchModalItem.warehouseNotes || dispatchModalItem.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* 1. Supplier Selector (CRITICAL STEP) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Yetkazib Beruvchi (Ta'minotchi)", "Поставщик", "Supplier")} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{formatDual("Ta'minotchini tanlang...", "Выберите поставщика...", "Select supplier...")}</option>
                  {uniqueSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.category}) {sup.phone ? `· 📞 ${sup.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Order Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Tasdiqlangan Buyurtma Miqdori", "Количество заказа", "Order Quantity")} ({dispatchModalItem.unit || 'kg'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-base font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 3. Delivery Date & Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Yetkazish Sanasi", "Дата доставки", "Delivery Date")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Vaqt Oralig'i", "Время доставки", "Time Window")}
                  </label>
                  <select
                    value={deliveryTimeRange}
                    onChange={(e) => setDeliveryTimeRange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="09:00 - 12:00">09:00 - 12:00 (Ertalab)</option>
                    <option value="12:00 - 15:00">12:00 - 15:00 (Tushdan keyin)</option>
                    <option value="15:00 - 18:00">15:00 - 18:00 (Kechga)</option>
                    <option value="Kun davomida">Kun davomida</option>
                  </select>
                </div>
              </div>

              {/* 4. Price & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelishilgan Narx (Ixtiyoriy)", "Договорная цена", "Agreed Price")} (so'm/{dispatchModalItem.unit || 'kg'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 12000"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Ta'minotchiga Izoh (Faqat Ta'minotchi ko'radi)", "Примечание для поставщика", "Notes for Supplier")}
                  </label>
                  <input
                    type="text"
                    placeholder={formatDual("Masalan: 1-nav toza mahsulot jo'nating...", "Например: 1-сорт, чистая продукция...", "E.g. Grade 1 quality required...")}
                    value={supplyNotes}
                    onChange={(e) => setSupplyNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notification Notice */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2.5">
                <Truck size={18} className="flex-shrink-0" />
                <span>
                  {formatDual(
                    "Buyurtma tasdiqlangach, u tanlangan ta'minotchining shaxsiy kabinetida aks etadi va uning chatiga rasmiy xabarnoma jo'natiladi.",
                    "После подтверждения заказ сразу появится в кабинете поставщика и в чате снабжения.",
                    "Order will immediately appear in the supplier's cabinet and send an automated chat notification."
                  )}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setDispatchModalItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submittingDispatch}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2"
                >
                  {submittingDispatch ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{formatDual("Jo'natilmoqda...", "Отправка...", "Dispatching...")}</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{formatDual("Ta'minotchiga Buyurtma Yuborish 🚀", "Отправить заказ 🚀", "Dispatch Order 🚀")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: DIRECT ORDER FROM OUT-OF-STOCK LIST */}
      {directOrderItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter overflow-y-auto"
          onClick={() => setDirectOrderItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {formatDual("Tugagan Mahsulotga Buyurtma Berish", "Заказ закончившегося сырья", "Order Depleted Stock")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDual("Ta'minotchi portaliga to'g'ridan-to'g'ri buyurtma jo'natish", "Прямая отправка в кабинет поставщика", "Direct dispatch to supplier portal")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectOrderItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDirectOrder} className="space-y-4 pt-4">
              <div className="p-4 bg-slate-50 dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-700">
                <span className="text-xs font-bold text-slate-500 uppercase">Mahsulot</span>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {directOrderItem.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Joriy ombor qoldig'i: <b className="text-rose-500">{directOrderItem.stock} {directOrderItem.unit}</b>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Yetkazib Beruvchi (Ta'minotchi)", "Поставщик", "Supplier")} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">{formatDual("Ta'minotchini tanlang...", "Выберите поставщика...", "Select supplier...")}</option>
                  {uniqueSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.category}) {sup.phone ? `· 📞 ${sup.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  {formatDual("Buyurtma Miqdori", "Количество", "Quantity")} ({directOrderItem.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-base font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Yetkazish Sanasi", "Дата доставки", "Delivery Date")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Vaqt Oralig'i", "Время доставки", "Time Window")}
                  </label>
                  <select
                    value={deliveryTimeRange}
                    onChange={(e) => setDeliveryTimeRange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="09:00 - 12:00">09:00 - 12:00 (Ertalab)</option>
                    <option value="12:00 - 15:00">12:00 - 15:00 (Tushdan keyin)</option>
                    <option value="15:00 - 18:00">15:00 - 18:00 (Kechga)</option>
                    <option value="Kun davomida">Kun davomida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Kelishilgan Narx (Ixtiyoriy)", "Договорная цена", "Agreed Price")} (so'm/{directOrderItem.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 12000"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    {formatDual("Ta'minotchiga Izoh", "Примечание", "Notes")}
                  </label>
                  <input
                    type="text"
                    placeholder={formatDual("Masalan: 1-nav toza mahsulot jo'nating...", "Например: 1-сорт, чистая продукция...", "E.g. Grade 1 quality required...")}
                    value={supplyNotes}
                    onChange={(e) => setSupplyNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setDirectOrderItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={directSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2"
                >
                  {directSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{formatDual("Jo'natilmoqda...", "Отправка...", "Dispatching...")}</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{formatDual("Ta'minotchiga Buyurtma Yuborish 🚀", "Отправить заказ 🚀", "Dispatch Order 🚀")}</span>
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

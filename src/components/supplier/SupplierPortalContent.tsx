'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Truck,
  Package,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Phone,
  FileText,
  Printer,
  ChevronRight,
  Send,
  X,
  Building2,
  ShieldCheck,
  Check,
  ArrowRight,
  TrendingUp,
  Boxes,
  Loader2,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface OrderItem {
  id: number
  productId: number
  supplierId: number | null
  supplierName: string | null
  quantity: number
  unit: string | null
  expectedDate: string
  timeRange: string | null
  actualDeliveryTime: string | null
  deliveredQuantity: number | null
  acceptedQuantity: number | null
  rejectedQuantity: number | null
  status: string
  imageUrl: string | null
  price: number | null
  notes: string | null
  driverPhone?: string | null
  vehicleNumber?: string | null
  createdAt: string
  product: {
    id: number
    name: string
    unit: string
    category: string
    minStock?: number | null
  }
  inspections?: Array<{
    id: number
    actNumber: string
    inspectionDate: string
    quantity: number
    acceptedQuantity: number | null
    rejectedQuantity: number | null
    batchNumber: string | null
  }>
}

interface SupplierData {
  id: number
  name: string
  shortName: string | null
  phone: string | null
  address: string | null
  email: string | null
  category: string
}

export default function SupplierPortalContent() {
  const { lang, setLang, formatDual } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalDeliveredKg: 0
  })

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'>('ALL')
  const [dateFilter, setDateFilter] = useState('')

  // Dispatch modal (Yo'lga chiqdik)
  const [dispatchModalOrder, setDispatchModalOrder] = useState<OrderItem | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Print order voucher modal
  const [printOrder, setPrintOrder] = useState<OrderItem | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/supplier-portal/orders')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      const data = await res.json()
      setSupplier(data.supplier)
      setOrders(data.orders || [])
      if (data.metrics) {
        setMetrics(data.metrics)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle status update
  const handleUpdateStatus = async (orderId: number, newStatus: string, driverData?: { phone?: string; vehicle?: string; notes?: string }) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/supplier-portal/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          driverPhone: driverData?.phone,
          vehicleNumber: driverData?.vehicle,
          notes: driverData?.notes
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Holatni yangilashda xatolik')
      }

      toast.success(
        newStatus === 'IN_TRANSIT'
          ? (lang === 'ru' ? 'Статус обновлен: Машина в пути!' : lang === 'en' ? 'Status updated: In Transit!' : "Holat yangilandi: Mashina yo'lga chiqdi!")
          : (lang === 'ru' ? 'Статус обновлен: Доставлено на завод!' : lang === 'en' ? 'Status updated: Delivered to factory!' : "Holat yangilandi: Korxonaga yetkazildi!")
      )

      setDispatchModalOrder(null)
      fetchOrders()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter === 'PENDING' && o.status !== 'PENDING') return false
      if (statusFilter === 'IN_TRANSIT' && o.status !== 'IN_TRANSIT' && o.status !== 'SHIPPED') return false
      if (statusFilter === 'DELIVERED' && o.status !== 'DELIVERED' && o.status !== 'ACCEPTED') return false

      // Date filter
      if (dateFilter && !o.expectedDate.startsWith(dateFilter)) return false

      // Search query
      if (search) {
        const q = search.toLowerCase()
        const prod = (o.product?.name || '').toLowerCase()
        const notes = (o.notes || '').toLowerCase()
        const driver = (o.driverPhone || '').toLowerCase()
        const veh = (o.vehicleNumber || '').toLowerCase()
        if (!prod.includes(q) && !notes.includes(q) && !driver.includes(q) && !veh.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [orders, statusFilter, dateFilter, search])

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock3 size={13} className="animate-spin text-amber-400" />
            <span>{formatDual("Kutilmoqda", "В ожидании", "Pending")}</span>
          </span>
        )
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Truck size={13} className="text-blue-400" />
            <span>{formatDual("Yo'lda (Yetkazilmoqda)", "В пути (Доставляется)", "In Transit")}</span>
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <CheckCircle2 size={13} className="text-purple-400" />
            <span>{formatDual("Yetkazildi (Qabul kutilyapti)", "Доставлено (Ожидает приемку)", "Delivered (Pending QC)")}</span>
          </span>
        )
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>{formatDual("Qabul qilindi (Bajarildi)", "Принято ОТК (Выполнено)", "Accepted by QC")}</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <X size={13} />
            <span>{formatDual("Bekor qilingan", "Отменено", "Cancelled")}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Language Selector */}
      <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-dark-750 p-5 sm:p-7 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={14} />
              GREEN PROCESSING • {formatDual("YETKAZIB BERUVCHI PORTALI", "КАБИНЕТ ПОСТАВЩИКА", "SUPPLIER PORTAL")}
            </span>
            {supplier?.name && (
              <span className="px-3 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1">
                <Building2 size={13} />
                {supplier.name}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatDual(
              "Korxonadan Kelayotgan Buyurtmalar",
              "Заказы на поставку сырья от предприятия",
              "Purchase Orders from Factory"
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {formatDual(
              "Sizga Green Processing zavodidan yuborilgan barcha xarid buyurtmalari ro'yxati, yetkazib berish muddati va qabul holatlari.",
              "Все заказы на сырье, отправленные вам заводом Green Processing, графики поставок и текущий статус приемки.",
              "All purchase orders sent to you by Green Processing factory, delivery schedules and reception status."
            )}
          </p>
        </div>

        {/* Language switch + Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Quick Language Pills */}
          <div className="flex bg-dark-950/80 p-1 rounded-xl border border-dark-700">
            <button
              onClick={() => setLang('uz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'uz' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇿 O'zbek
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'ru' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇷🇺 Русский
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'en' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-colors shadow-sm"
            title={formatDual("Yangilash", "Обновить", "Refresh")}
          >
            <RefreshCw size={17} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* 2. KPI / Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-dark-900 border border-dark-750 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {formatDual("Jami Buyurtmalar", "Всего заказов", "Total Orders")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics.totalOrders}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {formatDual("Barcha vaqtlardagi buyurtmalar", "Все заказы за всё время", "All time orders")}
          </div>
        </div>

        {/* Card 2: Pending Orders */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`cursor-pointer bg-dark-900 border p-4 sm:p-5 rounded-2xl shadow-sm transition-all ${
            statusFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-dark-750 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {formatDual("Kutilmoqda", "В ожидании", "Pending")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock3 size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {metrics.pendingOrders}
          </div>
          <div className="text-[11px] text-amber-400/70 mt-1 font-medium">
            {formatDual("Yetkazib berish kerak", "Требуется поставка", "Needs delivery")}
          </div>
        </div>

        {/* Card 3: In Transit */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT')}
          className={`cursor-pointer bg-dark-900 border p-4 sm:p-5 rounded-2xl shadow-sm transition-all ${
            statusFilter === 'IN_TRANSIT' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-dark-750 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {formatDual("Yo'lda", "В пути", "In Transit")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Truck size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">
            {metrics.inTransitOrders}
          </div>
          <div className="text-[11px] text-blue-400/70 mt-1 font-medium">
            {formatDual("Zavodga yo'l olgan", "Машины в пути на завод", "Vehicles dispatched")}
          </div>
        </div>

        {/* Card 4: Delivered Volume */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
          className={`cursor-pointer bg-dark-900 border p-4 sm:p-5 rounded-2xl shadow-sm transition-all ${
            statusFilter === 'DELIVERED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-dark-750 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {formatDual("Yetkazilgan Hajm", "Объем поставок", "Delivered Volume")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Boxes size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {metrics.totalDeliveredKg.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-1 font-medium">
            {metrics.deliveredOrders} {formatDual("ta buyurtma topshirildi", "заказов принято", "orders completed")}
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={formatDual(
              "Mahsulot yoki izoh bo'yicha qidirish...",
              "Поиск по товару или примечанию...",
              "Search by product or notes..."
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-dark-800'
            }`}
          >
            {formatDual("Barchasi", "Все", "All")} ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-white bg-dark-800'
            }`}
          >
            {formatDual("Kutilmoqda", "В ожидании", "Pending")} ({metrics.pendingOrders})
          </button>
          <button
            onClick={() => setStatusFilter('IN_TRANSIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'IN_TRANSIT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-400 hover:text-white bg-dark-800'
            }`}
          >
            {formatDual("Yo'lda", "В пути", "In Transit")} ({metrics.inTransitOrders})
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'DELIVERED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400 hover:text-white bg-dark-800'
            }`}
          >
            {formatDual("Yetkazildi", "Доставлено", "Delivered")} ({metrics.deliveredOrders})
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-2 text-slate-400 hover:text-white bg-dark-800 rounded-xl border border-dark-700"
              title={formatDual("Filtrni tozalash", "Сбросить фильтр", "Clear filter")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Orders Content: Loading / Empty / List */}
      {loading ? (
        <div className="bg-dark-900 border border-dark-750 rounded-3xl p-16 text-center shadow-sm">
          <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">
            {formatDual("Buyurtmalar yuklanmoqda...", "Загрузка заказов...", "Loading orders...")}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-dark-900 border border-dark-750 rounded-3xl p-16 text-center shadow-sm">
          <Package size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {formatDual("Hozircha buyurtmalar topilmadi", "Заказов не найдено", "No orders found")}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {formatDual(
              "Sizning yetkazib beruvchi profilingizga korxona tomonidan hali yangi buyurtma yuborilmagan yoki filtr bo'yicha ma'lumot yo'q.",
              "На данный момент нет заказов по выбранным фильтрам от завода Green Processing.",
              "No purchase orders found matching the current filters."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-dark-750 bg-dark-800/80 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">№ / {formatDual("SANA", "ДАТА", "DATE")}</th>
                    <th className="py-4 px-4">{formatDual("MAHSULOT NOMI", "НАИМЕНОВАНИЕ ТОВАРА", "PRODUCT NAME")}</th>
                    <th className="py-4 px-4 text-center">{formatDual("MIQDOR", "КОЛИЧЕСТВО", "QUANTITY")}</th>
                    <th className="py-4 px-4">{formatDual("KUTILAYOTGAN VAQT", "ОЖИДАЕМОЕ ВРЕМЯ", "EXPECTED TIME")}</th>
                    <th className="py-4 px-4 text-center">{formatDual("HOLAT", "СТАТУС", "STATUS")}</th>
                    <th className="py-4 px-4">{formatDual("IZOH VA TALABLAR", "ПРИМЕЧАНИЯ", "FACTORY NOTES")}</th>
                    <th className="py-4 px-5 text-right">{formatDual("AMALLAR", "ДЕЙСТВИЯ", "ACTIONS")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750/70">
                  {filteredOrders.map((order) => {
                    const isPending = order.status === 'PENDING'
                    const isInTransit = order.status === 'IN_TRANSIT' || order.status === 'SHIPPED'

                    return (
                      <tr key={order.id} className="hover:bg-dark-800/40 transition-colors">
                        {/* ID and Date */}
                        <td className="py-4 px-5 font-mono">
                          <span className="font-bold text-white text-sm block">#{order.id}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="text-slate-500" />
                            {new Date(order.expectedDate).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Product */}
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-white text-sm">
                            {order.product?.name || 'Noma\'lum xomashyo'}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                            {order.product?.category || "Xomashyo"}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-4 px-4 text-center">
                          <span className="text-base font-black text-emerald-400">
                            {order.quantity.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 ml-1">
                            {order.unit || 'kg'}
                          </span>
                          {order.deliveredQuantity !== null && order.deliveredQuantity !== undefined && (
                            <span className="block text-[10px] text-teal-400 font-semibold mt-0.5">
                              {formatDual("Amalda:", "Факт:", "Delivered:")} {order.deliveredQuantity} {order.unit}
                            </span>
                          )}
                        </td>

                        {/* Time Range */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <Clock size={13} className="text-amber-400" />
                            <span>{order.timeRange || formatDual("Kun davomida", "В течение дня", "During the day")}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center">
                          {renderStatusBadge(order.status)}
                        </td>

                        {/* Notes & Driver info */}
                        <td className="py-4 px-4 max-w-xs">
                          {order.notes ? (
                            <p className="text-slate-300 truncate" title={order.notes}>
                              {order.notes}
                            </p>
                          ) : (
                            <span className="text-slate-600 italic">{formatDual("Izoh yo'q", "Нет примечаний", "No notes")}</span>
                          )}
                          {order.vehicleNumber && (
                            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                              🚛 {order.vehicleNumber} {order.driverPhone ? `· 📞 ${order.driverPhone}` : ''}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <button
                                onClick={() => {
                                  setDispatchModalOrder(order)
                                  setVehicleNumber(order.vehicleNumber || '')
                                  setDriverPhone(order.driverPhone || '')
                                  setDispatchNotes('')
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Truck size={13} />
                                <span>{formatDual("Yo'lga chiqdik", "В пути", "In Transit")}</span>
                              </button>
                            )}

                            {isInTransit && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Check size={13} />
                                <span>{formatDual("Yetkazildi", "Доставлено", "Delivered")}</span>
                              </button>
                            )}

                            <button
                              onClick={() => setPrintOrder(order)}
                              className="p-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white border border-dark-700 transition-colors"
                              title={formatDual("Chek / Nakladnaya chop etish", "Печать накладной", "Print Voucher")}
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Cards for mobile screens) */}
          <div className="block lg:hidden space-y-3">
            {filteredOrders.map((order) => {
              const isPending = order.status === 'PENDING'
              const isInTransit = order.status === 'IN_TRANSIT' || order.status === 'SHIPPED'

              return (
                <div key={order.id} className="bg-dark-900 border border-dark-750 p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-dark-750/70 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">#{order.id}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={11} className="text-slate-500" />
                        {new Date(order.expectedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {renderStatusBadge(order.status)}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{order.product?.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{order.product?.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">
                        {order.quantity.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">{order.unit || 'kg'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-dark-800/60 p-2 rounded-xl">
                    <Clock size={13} className="text-amber-400 flex-shrink-0" />
                    <span>{formatDual("Kelish vaqti:", "Время прибытия:", "Delivery time:")} {order.timeRange || "09:00 - 13:00"}</span>
                  </div>

                  {order.notes && (
                    <div className="text-xs text-slate-400 bg-dark-800/30 p-2 rounded-xl border border-dark-750/50">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {formatDual("Zavod izohi:", "Примечание завода:", "Factory note:")}
                      </span>
                      <p className="text-slate-300 mt-0.5">{order.notes}</p>
                    </div>
                  )}

                  {order.vehicleNumber && (
                    <div className="text-[11px] font-mono text-slate-300 bg-dark-800 p-2 rounded-xl">
                      🚛 {order.vehicleNumber} {order.driverPhone ? `· 📞 ${order.driverPhone}` : ''}
                    </div>
                  )}

                  {/* Actions for mobile */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-dark-750/70">
                    <button
                      onClick={() => setPrintOrder(order)}
                      className="px-3 py-2 rounded-xl bg-dark-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-dark-700"
                    >
                      <Printer size={14} />
                      <span>{formatDual("Chop etish", "Печать", "Print")}</span>
                    </button>

                    {isPending && (
                      <button
                        onClick={() => {
                          setDispatchModalOrder(order)
                          setVehicleNumber(order.vehicleNumber || '')
                          setDriverPhone(order.driverPhone || '')
                          setDispatchNotes('')
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Truck size={14} />
                        <span>{formatDual("Yo'lga chiqdik", "В пути", "In Transit")}</span>
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Check size={14} />
                        <span>{formatDual("Yetkazildi", "Доставлено", "Delivered")}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. MODAL: "Yo'lga chiqdik" (Dispatch Order with Vehicle & Driver info) */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-dark-750 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {formatDual("Yo'lga Chiqishni Tasdiqlash", "Подтверждение отправки", "Confirm Dispatch")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Buyurtma", "Заказ", "Order")} #{dispatchModalOrder.id}: {dispatchModalOrder.product?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Mashina Davlat Raqami", "Гос. номер машины", "Vehicle Plate Number")}
                </label>
                <input
                  type="text"
                  placeholder="masalan: 01 A 777 AA"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Haydovchi Telefon Raqami", "Телефон водителя", "Driver Phone Number")}
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Qo'shimcha Izoh (Ixtiyoriy)", "Дополнительное примечание (Опционально)", "Additional Notes (Optional)")}
                </label>
                <textarea
                  rows={2}
                  placeholder={formatDual("masalan: Taxminan soat 11:30 da yetib boradi", "например: Прибудет примерно в 11:30", "e.g. Arriving around 11:30")}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
                ℹ️ {formatDual(
                  "Tasdiqlashingiz bilan korxona ombori va ta'minot bo'limiga mashina yo'lga chiqqanligi haqida bildirishnoma boradi.",
                  "При подтверждении склад и отдел снабжения завода получат уведомление о выезде машины.",
                  "Upon confirmation, the factory warehouse will be notified that the shipment is in transit."
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-750">
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold text-xs"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus(dispatchModalOrder.id, 'IN_TRANSIT', {
                  vehicle: vehicleNumber,
                  phone: driverPhone,
                  notes: dispatchNotes
                })}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {updatingStatus ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                <span>{formatDual("Yo'lga chiqdik deb yuborish", "Отправить (В пути)", "Confirm Dispatch")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Printable Voucher / Order Sheet */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div>
                <h3 className="text-xl font-black text-slate-900">GREEN PROCESSING ERP</h3>
                <p className="text-xs text-slate-500">Xarid Buyurtmasi № {printOrder.id}</p>
              </div>
              <button
                onClick={() => setPrintOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">{formatDual("Yetkazib beruvchi:", "Поставщик:", "Supplier:")}</span>
                <span className="font-bold text-slate-900">{supplier?.name || printOrder.supplierName || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">{formatDual("Mahsulot:", "Товар:", "Product:")}</span>
                <span className="font-bold text-slate-900">{printOrder.product?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">{formatDual("Buyurtma hajmi:", "Количество:", "Quantity:")}</span>
                <span className="font-black text-emerald-600 text-sm">
                  {printOrder.quantity.toLocaleString()} {printOrder.unit || 'kg'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">{formatDual("Kutilayotgan sana:", "Дата поставки:", "Expected date:")}</span>
                <span className="font-bold text-slate-900">{new Date(printOrder.expectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">{formatDual("Kelish vaqti:", "Время:", "Time range:")}</span>
                <span className="font-bold text-slate-900">{printOrder.timeRange || "09:00 - 13:00"}</span>
              </div>
              {printOrder.notes && (
                <div className="border-b pb-2">
                  <span className="text-slate-500 block mb-1">{formatDual("Talab va izoh:", "Примечания:", "Notes:")}</span>
                  <p className="text-slate-800 bg-slate-50 p-2 rounded-lg font-medium">{printOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPrintOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Printer size={15} />
                <span>{formatDual("Chop etish (Print)", "Распечатать", "Print")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

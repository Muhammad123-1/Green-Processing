'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Calendar, Package, TrendingUp, CheckCircle2, XCircle, Clock, ShoppingCart, Info, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Buyurtmalar (Ta'minot)",
    subtitle: "Xomashyo xaridi va oshxona ehtiyojlari nazorati",
    totalOrders: "Jami buyurtmalar",
    pendingOrders: "Kutilayotgan",
    deliveredOrders: "Bajarilgan",
    newOrder: "Yangi buyurtma",
    searchPlaceholder: "Mahsulot nomi bilan qidirish...",
    empty: "Hech qanday buyurtma topilmadi",
    loading: "Buyurtmalar yuklanmoqda...",
    colDate: "Sana",
    colProduct: "Mahsulot",
    colQty: "Miqdor",
    colExpected: "Kutilayotgan sana",
    colStatus: "Holat",
    colActions: "Amallar",
    statusPending: "Kutilmoqda",
    statusDelivered: "Bajarildi",
    statusCancelled: "Bekor qilindi",
    markDelivered: "Bajarish",
    markCancelled: "Bekor qilish",
    modalTitle: "Yangi buyurtma yaratish",
    selectProduct: "Mahsulotni tanlang",
    quantity: "Miqdor",
    save: "Saqlash",
    saving: "Saqlanmoqda...",
    cancel: "Bekor qilish",
    successCreate: "Buyurtma muvaffaqiyatli yaratildi",
    successUpdate: "Buyurtma holati yangilandi",
    errorGeneral: "Xatolik yuz berdi"
  },
  ru: {
    title: "Заказы (Снабжение)",
    subtitle: "Контроль закупок сырья и нужд кухни",
    totalOrders: "Всего заказов",
    pendingOrders: "В ожидании",
    deliveredOrders: "Выполненные",
    newOrder: "Новый заказ",
    searchPlaceholder: "Поиск по названию продукта...",
    empty: "Заказы не найдены",
    loading: "Загрузка заказов...",
    colDate: "Дата",
    colProduct: "Продукт",
    colQty: "Кол-во",
    colExpected: "Ожидаемая дата",
    colStatus: "Статус",
    colActions: "Действия",
    statusPending: "Ожидается",
    statusDelivered: "Выполнено",
    statusCancelled: "Отменено",
    markDelivered: "Выполнить",
    markCancelled: "Отменить",
    modalTitle: "Создать новый заказ",
    selectProduct: "Выберите продукт",
    quantity: "Количество",
    save: "Сохранить",
    saving: "Сохранение...",
    cancel: "Отмена",
    successCreate: "Заказ успешно создан",
    successUpdate: "Статус заказа обновлен",
    errorGeneral: "Произошла ошибка"
  },
  en: {
    title: "Orders (Procurement)",
    subtitle: "Raw material procurement and kitchen needs tracking",
    totalOrders: "Total Orders",
    pendingOrders: "Pending",
    deliveredOrders: "Delivered",
    newOrder: "New Order",
    searchPlaceholder: "Search by product name...",
    empty: "No orders found",
    loading: "Loading orders...",
    colDate: "Date",
    colProduct: "Product",
    colQty: "Quantity",
    colExpected: "Expected Date",
    colStatus: "Status",
    colActions: "Actions",
    statusPending: "Pending",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    markDelivered: "Deliver",
    markCancelled: "Cancel",
    modalTitle: "Create New Order",
    selectProduct: "Select Product",
    quantity: "Quantity",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    successCreate: "Order created successfully",
    successUpdate: "Order status updated",
    errorGeneral: "An error occurred"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function OrdersContent() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch {
      toast.error(t.errorGeneral)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        setProducts(await res.json())
      }
    } catch {
      // Handle silently
    }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(t.successUpdate)
        fetchOrders()
      } else {
        toast.error(t.errorGeneral)
      }
    } catch {
      toast.error(t.errorGeneral)
    }
  }

  async function handleCreateOrder() {
    if (!form.productId || !form.quantity || !form.expectedDate) {
      toast.error("Barcha maydonlarni to'ldiring / Fill all fields")
      return
    }
    setSaving(true)
    try {
      const selectedProduct = products.find(p => p.id === parseInt(form.productId))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          quantity: form.quantity,
          unit: selectedProduct?.unit || 'kg',
          expectedDate: form.expectedDate
        })
      })
      if (res.ok) {
        toast.success(t.successCreate)
        setShowModal(false)
        setForm({ ...form, productId: '', quantity: '' })
        fetchOrders()
      } else {
        toast.error(t.errorGeneral)
      }
    } catch {
      toast.error(t.errorGeneral)
    } finally {
      setSaving(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.product?.name?.toLowerCase().includes(search.toLowerCase())
    )
  }, [orders, search])

  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <Plus size={18} className="relative z-10" />
          <span className="relative z-10">{t.newOrder}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-indigo-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShoppingCart size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.totalOrders}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{orders.length}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-inner">
              <Clock size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.pendingOrders}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{pendingCount}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.deliveredOrders}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{deliveredCount}</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="card p-0 overflow-hidden border border-dark-700 shadow-xl">
        <div className="p-5 border-b border-dark-700 bg-dark-800/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="px-6 py-4 font-semibold">{t.colDate}</th>
                <th className="px-6 py-4 font-semibold">{t.colProduct}</th>
                <th className="px-6 py-4 font-semibold">{t.colQty}</th>
                <th className="px-6 py-4 font-semibold">{t.colExpected}</th>
                <th className="px-6 py-4 font-semibold">{t.colStatus}</th>
                <th className="px-6 py-4 font-semibold text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Loader2 size={32} className="animate-spin mx-auto mb-4 text-indigo-500 opacity-50" />
                    <p>{t.loading}</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Info size={32} className="mx-auto mb-4 opacity-30" />
                    <p>{t.empty}</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-dark-800/40 transition-colors group">
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center border border-dark-600">
                          <Package size={14} className="text-slate-400" />
                        </div>
                        {order.product?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{order.quantity}</span>
                      <span className="text-slate-500 ml-1">{order.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(order.expectedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        order.status === 'DELIVERED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      }`}>
                        {order.status === 'DELIVERED' && <CheckCircle2 size={12} />}
                        {order.status === 'CANCELLED' && <XCircle size={12} />}
                        {order.status === 'PENDING' && <Clock size={12} />}
                        {order.status === 'DELIVERED' ? t.statusDelivered : order.status === 'CANCELLED' ? t.statusCancelled : t.statusPending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 transition-colors"
                            title={t.markDelivered}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 transition-colors"
                            title={t.markCancelled}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex items-center justify-between bg-dark-800/50">
              <h3 className="text-xl font-bold text-white">{t.modalTitle}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-dark-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t.selectProduct}</label>
                <select 
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                  value={form.productId}
                  onChange={e => setForm({...form, productId: e.target.value})}
                >
                  <option value="">-- {t.selectProduct} --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.quantity}</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.colExpected}</label>
                  <input 
                    type="date" 
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                    value={form.expectedDate}
                    onChange={e => setForm({...form, expectedDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-700 bg-dark-800/30 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-dark-700 text-white hover:bg-dark-600 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={saving}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

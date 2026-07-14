'use client'

import { useState, useEffect } from 'react'
import { Plus, Clock, CheckCircle, XCircle, Search, Package, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductionContent() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    expectedDate: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) setOrders(await res.json())
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      if (res.ok) setProducts(await res.json())
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId || !form.quantity || !form.expectedDate) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success("Buyurtma qo'shildi")
        setIsModalOpen(false)
        setForm({ productId: '', quantity: '', expectedDate: '' })
        fetchOrders()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success("Holat yangilandi")
        fetchOrders()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    }
  }

  function getDaysLeft(expectedDate: string) {
    const target = new Date(expectedDate)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) return <span className="text-blue-400 font-medium">{diffDays} kun qoldi</span>
    if (diffDays === 0) return <span className="text-amber-400 font-bold">Bugun kelishi kerak</span>
    return <span className="text-red-400 font-medium">{Math.abs(diffDays)} kun kechikdi</span>
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="section-title">Oshxona (Ta'minot buyurtmalari)</h1>
          <p className="section-subtitle">Xodimlar uchun ovqat pishirishga kutilayotgan mahsulotlar</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/30 w-full sm:w-auto text-sm"
        >
          <Plus size={18} />
          Yangi buyurtma qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Kutilmoqda</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {orders.filter((o: any) => o.status === 'PENDING').length}
          </h3>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Qabul qilindi</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {orders.filter((o: any) => o.status === 'DELIVERED').length}
          </h3>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <XCircle size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Rad etildi</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {orders.filter((o: any) => o.status === 'CANCELLED').length}
          </h3>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-dark-800/50 text-slate-400 border-b border-dark-700">
                <th className="p-4 font-medium">Mahsulot</th>
                <th className="p-4 font-medium">Miqdor</th>
                <th className="p-4 font-medium">Kutilayotgan sana</th>
                <th className="p-4 font-medium">Qolgan vaqt</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Hali buyurtmalar yo'q
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-slate-400" />
                        <span className="font-medium text-white">{order.product?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600">
                        {order.quantity} {order.product?.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {new Date(order.expectedDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {order.status === 'PENDING' ? getDaysLeft(order.expectedDate) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="p-4">
                      {order.status === 'PENDING' && <span className="badge-warning">Kutilmoqda</span>}
                      {order.status === 'DELIVERED' && <span className="badge-success">Qabul qilindi</span>}
                      {order.status === 'CANCELLED' && <span className="badge-danger">Rad etildi</span>}
                    </td>
                    <td className="p-4">
                      {order.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateStatus(order.id, 'DELIVERED')}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors"
                            title="Qabul qilish"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => updateStatus(order.id, 'CANCELLED')}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                            title="Rad etish"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-enter">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
              <h2 className="text-lg font-bold text-white">Yangi buyurtma (Snabjenets)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Mahsulot *</label>
                <select 
                  className="input-field" 
                  value={form.productId}
                  onChange={(e) => setForm({...form, productId: e.target.value})}
                  required
                >
                  <option value="">— Tanlang —</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Miqdor *</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="M: 100" 
                  min="0" step="0.1"
                  value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="flex items-center gap-1.5"><Calendar size={13}/> Qachon kelishi kerak? *</span>
                </label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={form.expectedDate}
                  onChange={(e) => setForm({...form, expectedDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Clock, CheckCircle, XCircle, Search, Package, Calendar, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const UNITS = [
  'kg',
  'gr',
  'litr',
  'ml',
  'dona',
  'karobka',
  'qop',
  'paqir',
  'baklashka (0.5L)',
  'baklashka (1L)',
  'baklashka (1.5L)',
  'baklashka (5L)'
]

export default function ProductionContent() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  
  // Order Form state
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: ''
  })
  const [saving, setSaving] = useState(false)

  // Confirm state
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [confirming, setConfirming] = useState(false)

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

  async function handleNewOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId || !form.quantity || !form.unit || !form.expectedDate) {
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
        setIsNewOrderModalOpen(false)
        setForm({ productId: '', quantity: '', unit: 'kg', expectedDate: '' })
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

  // Handle simple rejection
  async function handleReject(id: number) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (res.ok) {
        toast.success("Buyurtma rad etildi")
        fetchOrders()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    }
  }

  // Open confirm modal
  function openConfirmModal(id: number) {
    setConfirmingOrderId(id)
    setUploadedImageUrl(null)
    setIsConfirmModalOpen(true)
  }

  // Handle image upload for confirmation
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', e.target.files[0])
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setUploadedImageUrl(data.url)
      toast.success("Rasm yuklandi")
    } catch (err) {
      toast.error("Rasm yuklashda xatolik yuz berdi")
    } finally {
      setUploadingImage(false)
    }
  }

  // Confirm order submission
  async function handleConfirmSubmit() {
    if (!confirmingOrderId) return
    if (!uploadedImageUrl) {
      toast.error("Iltimos, avval mahsulot rasmini yuklang!")
      return
    }

    setConfirming(true)
    try {
      const res = await fetch(`/api/orders/${confirmingOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED', imageUrl: uploadedImageUrl })
      })
      if (res.ok) {
        toast.success("Buyurtma qabul qilindi!")
        setIsConfirmModalOpen(false)
        fetchOrders()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setConfirming(false)
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
          <h1 className="section-title">Xodimlar oshxonasi</h1>
          <p className="section-subtitle">Xodimlar uchun ovqat pishirishga keladigan mahsulotlar</p>
        </div>
        <button 
          onClick={() => setIsNewOrderModalOpen(true)}
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
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
                        {order.imageUrl ? (
                          <div className="relative w-8 h-8 rounded overflow-hidden">
                            <Image src={order.imageUrl} alt="img" fill className="object-cover" />
                          </div>
                        ) : (
                          <Package size={16} className="text-slate-400" />
                        )}
                        <span className="font-medium text-white">{order.product?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600">
                        {order.quantity} {order.unit || order.product?.unit}
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
                            onClick={() => openConfirmModal(order.id)}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors"
                            title="Qabul qilish"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => handleReject(order.id)}
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

      {/* New Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-enter">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
              <h2 className="text-lg font-bold text-white">Yangi buyurtma qo'shish</h2>
              <button onClick={() => setIsNewOrderModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleNewOrder} className="p-5 space-y-4">
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
              
              <div className="flex gap-3">
                <div className="flex-1">
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
                <div className="w-1/2">
                  <label className="label">O'lchov birligi *</label>
                  <select 
                    className="input-field" 
                    value={form.unit}
                    onChange={(e) => setForm({...form, unit: e.target.value})}
                    required
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
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
                <button type="button" onClick={() => setIsNewOrderModalOpen(false)} className="btn-secondary flex-1">
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

      {/* Confirm Order Modal with Image Upload */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-enter">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="text-emerald-400" size={20} />
                Qabul qilish
              </h2>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">
                Mahsulot qabul qilinganligini tasdiqlash uchun, uning <strong>haqiqiy rasmini</strong> yuklashingiz shart.
              </p>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-600 rounded-xl p-6 bg-dark-900/30 hover:bg-dark-900 transition-colors relative">
                {uploadedImageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-dark-600">
                    <Image src={uploadedImageUrl} alt="Uploaded" fill className="object-cover" />
                    <button 
                      onClick={() => setUploadedImageUrl(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="text-indigo-400 animate-spin" />
                        <span className="text-sm text-slate-400">Yuklanmoqda...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Camera size={24} />
                        </div>
                        <span className="font-medium text-slate-300">Rasm yuklash uchun bosing</span>
                        <span className="text-xs text-slate-500">yoki rasmni shu yerga tashlang</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsConfirmModalOpen(false)} 
                  className="btn-secondary flex-1"
                >
                  Bekor qilish
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmSubmit}
                  disabled={!uploadedImageUrl || confirming} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Tasdiqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

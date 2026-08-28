'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, ShoppingCart, Calendar, Search, Loader2, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SalesContent() {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('customers')
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  // Create Customer Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: '', phone: '', email: '', companyName: '', address: ''
  })
  
  // Create Sales Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customerId: '', deliveryDate: '', notes: ''
  })
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: '1', unitPrice: '', discount: '0' }])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [custRes, salesRes, prodRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/sales'),
        fetch('/api/products')
      ])
      if (custRes.ok) setCustomers(await custRes.json())
      if (salesRes.ok) setSalesOrders(await salesRes.json())
      if (prodRes.ok) {
        const allProds = await prodRes.json()
        setProducts(allProds)
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })
      if (res.ok) {
        toast.success("Mijoz yaratildi!")
        setShowCustomerModal(false)
        setCustomerForm({ name: '', phone: '', email: '', companyName: '', address: '' })
        loadData()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    }
  }

  // --- SAVAT FUNKSIYALARI ---
  function addOrderItem() {
    setOrderItems([...orderItems, { productId: '', quantity: '1', unitPrice: '', discount: '0' }])
  }

  function removeOrderItem(index: number) {
    const newItems = [...orderItems]
    newItems.splice(index, 1)
    setOrderItems(newItems)
  }

  function updateOrderItem(index: number, field: string, value: string) {
    const newItems = [...orderItems]
    ;(newItems[index] as any)[field] = value
    setOrderItems(newItems)
  }

  const totalOrderSum = orderItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    const discount = parseFloat(item.discount) || 0
    return sum + (qty * price) - discount
  }, 0)

  async function handleCreateSalesOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!orderForm.customerId) {
      return toast.error("Iltimos mijozni tanlang")
    }
    
    // Validate items
    const validItems = orderItems.filter(i => i.productId && parseFloat(i.quantity) > 0 && parseFloat(i.unitPrice) >= 0)
    if (validItems.length === 0) {
      return toast.error("Kamida bitta to'g'ri mahsulot qo'shing")
    }

    setSavingOrder(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: orderForm.customerId,
          deliveryDate: orderForm.deliveryDate,
          notes: orderForm.notes,
          items: validItems
        })
      })
      
      if (res.ok) {
        toast.success("Savdo amalga oshirildi!")
        setShowOrderModal(false)
        setOrderForm({ customerId: '', deliveryDate: '', notes: '' })
        setOrderItems([{ productId: '', quantity: '1', unitPrice: '', discount: '0' }])
        loadData()
        setActiveTab('orders')
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Savdoda xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/60 p-6 rounded-2xl border border-dark-700 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sotuv va CRM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sotuvlar Markazi</h1>
          <p className="text-sm text-slate-400 mt-1">Mijozlar bazasi va tayyor mahsulot sotuvlari (Sales Orders)</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'customers' ? (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus size={18} /> Yangi Mijoz
            </button>
          ) : (
            <button
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus size={18} /> Yangi Sotuv
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-dark-700 pb-2">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'customers'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Users size={16} /> Mijozlar (B2B/B2C)
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'orders'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart size={16} /> Sotuv Buyurtmalari
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : activeTab === 'customers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-500">Mijozlar yo'q</div>
          ) : customers.map(c => (
            <div key={c.id} className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{c.name}</h3>
                  {c.companyName && <p className="text-sm text-slate-400 flex items-center gap-1">{c.companyName}</p>}
                </div>
                <span className="px-2 py-1 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 rounded-lg">
                  {c.status}
                </span>
              </div>
              <div className="text-sm text-slate-300 space-y-1">
                <p className="flex gap-2">📞 <span className="text-emerald-400 font-mono">{c.phone || '-'}</span></p>
                <p className="flex gap-2">📍 <span>{c.address || '-'}</span></p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                <th className="p-4">Hujjat</th>
                <th className="p-4">Mijoz</th>
                <th className="p-4">Sana</th>
                <th className="p-4">Mahsulotlar</th>
                <th className="p-4">Jami Summa</th>
                <th className="p-4">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 text-sm">
              {salesOrders.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Sotuvlar topilmadi</td></tr>
              ) : salesOrders.map(order => (
                <tr key={order.id} className="hover:bg-dark-800/50">
                  <td className="p-4 font-mono font-bold text-emerald-400">{order.orderNumber}</td>
                  <td className="p-4">
                    <span className="text-white font-semibold block">{order.customer?.name}</span>
                    <span className="text-xs text-slate-500">{order.customer?.phone}</span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="text-slate-300">
                          • {item.product?.name} <span className="text-slate-500">({item.quantity} x {item.unitPrice})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white bg-emerald-500/5 rounded-lg border-l border-emerald-500/10">
                    {order.totalAmount.toLocaleString()} UZS
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/50">
              <h2 className="text-xl font-bold text-white">Yangi Mijoz Qo'shish</h2>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">F.I.SH / Mijoz nomi *</label>
                <input required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Kompaniya nomi</label>
                <input value={customerForm.companyName} onChange={e => setCustomerForm({...customerForm, companyName: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Telefon</label>
                  <input value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Manzil</label>
                  <input value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 bg-dark-800 text-slate-300 rounded-xl hover:bg-dark-700">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-semibold shadow-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-emerald-500" /> Yangi Sotuv
              </h2>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleCreateSalesOrder} className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Xaridor (Mijoz) *</label>
                  <select 
                    required
                    value={orderForm.customerId} 
                    onChange={e => setOrderForm({...orderForm, customerId: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500"
                  >
                    <option value="">-- Mijozni tanlang --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Yetkazib berish sanasi</label>
                  <input 
                    type="date" 
                    value={orderForm.deliveryDate} 
                    onChange={e => setOrderForm({...orderForm, deliveryDate: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-emerald-500 [color-scheme:dark]" 
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-emerald-400">Savat (Mahsulotlar)</h3>
                  <button type="button" onClick={addOrderItem} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg">
                    + Qator qo'shish
                  </button>
                </div>

                <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden p-3 space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] text-slate-500 uppercase">Mahsulot</label>
                        <select 
                          required
                          value={item.productId}
                          onChange={e => updateOrderItem(index, 'productId', e.target.value)}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white"
                        >
                          <option value="">Tanlang...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-full sm:w-24">
                        <label className="text-[10px] text-slate-500 uppercase">Miqdor</label>
                        <input 
                          type="number" step="0.1" required
                          value={item.quantity}
                          onChange={e => updateOrderItem(index, 'quantity', e.target.value)}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white text-center font-mono"
                        />
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="text-[10px] text-slate-500 uppercase">Narxi (UZS)</label>
                        <input 
                          type="number" required placeholder="Masalan: 50000"
                          value={item.unitPrice}
                          onChange={e => updateOrderItem(index, 'unitPrice', e.target.value)}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-sm text-white text-right font-mono"
                        />
                      </div>

                      <div className="pt-4">
                        <button type="button" onClick={() => removeOrderItem(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {orderItems.length === 0 && (
                    <div className="text-center text-slate-500 py-4 text-xs">Savat bo'sh. Mahsulot qo'shing.</div>
                  )}
                </div>
                
                <div className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                  <span className="text-slate-400">Jami hisoblangan summa:</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {totalOrderSum.toLocaleString()} UZS
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Qo'shimcha izohlar</label>
                <textarea 
                  value={orderForm.notes} 
                  onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 min-h-[80px]" 
                  placeholder="Mijoz talablari yoki eslatmalar..."
                />
              </div>

            </form>
            
            <div className="p-5 border-t border-dark-700 bg-dark-800/80 flex justify-end gap-3">
              <button type="button" onClick={() => setShowOrderModal(false)} className="px-5 py-2.5 bg-dark-700 text-slate-300 rounded-xl hover:bg-dark-600 font-medium transition-colors">
                Bekor qilish
              </button>
              <button 
                onClick={handleCreateSalesOrder}
                disabled={savingOrder}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {savingOrder ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                Savdoni Yopish (Tasdiqlash)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Package, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function OrdersContent() {
  const { t, lang } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="section-title">Buyurtmalar (Снабженец)</h1>
          <p className="section-subtitle">Kutilayotgan va bajarilgan mahsulot buyurtmalari</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Yangi buyurtma
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Jami buyurtmalar</p>
          </div>
          <h3 className="text-2xl font-bold text-white">{orders.length}</h3>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Kutilayotgan</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {orders.filter((o: any) => o.status === 'PENDING').length}
          </h3>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Bajarilgan</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {orders.filter((o: any) => o.status === 'DELIVERED').length}
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
              className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-dark-800/50 text-slate-400 border-b border-dark-700">
                <th className="p-4 font-medium">№</th>
                <th className="p-4 font-medium">Sana</th>
                <th className="p-4 font-medium">Mahsulot</th>
                <th className="p-4 font-medium">Miqdor</th>
                <th className="p-4 font-medium">Kutilayotgan sana</th>
                <th className="p-4 font-medium">Holat</th>
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
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                orders.map((order: any, idx) => (
                  <tr key={order.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4 text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-white">{order.product?.name}</td>
                    <td className="p-4 text-slate-300">{order.quantity} {order.product?.unit}</td>
                    <td className="p-4 text-slate-300">{new Date(order.expectedDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'DELIVERED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Bajarildi' : order.status === 'CANCELLED' ? 'Bekor qilindi' : 'Kutilmoqda'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

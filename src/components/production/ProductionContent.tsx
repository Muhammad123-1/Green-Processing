'use client'

import { useState, useEffect } from 'react'
import { Search, ChefHat, CheckCircle, Package, ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function ProductionContent() {
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchInspections()
  }, [])

  async function fetchInspections() {
    try {
      const res = await fetch('/api/inspections?status=ACCEPTED')
      if (res.ok) {
        const data = await res.json()
        setInspections(data.data || [])
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setLoading(false)
    }
  }

  async function handleRelease(id: number, currentQty: number) {
    const qty = window.prompt(`Ishlab chiqarishga beriladigan miqdorni kiriting (Maksimum ${currentQty}):`, currentQty.toString())
    if (!qty) return
    
    const numQty = parseFloat(qty)
    if (isNaN(numQty) || numQty <= 0 || numQty > currentQty) {
      toast.error("Noto'g'ri miqdor kiritildi")
      return
    }

    try {
      const res = await fetch(`/api/inspections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releasedQuantity: numQty,
          releasedDate: new Date().toISOString()
        })
      })
      if (res.ok) {
        toast.success("Ishlab chiqarishga muvaffaqiyatli o'tkazildi")
        fetchInspections()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="section-title">Oshxona (Ishlab chiqarish)</h1>
          <p className="section-subtitle">Qabul qilingan va ishlab chiqarishga o'tkazilgan xomashyolar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Ombordagi zaxira (Qabul qilingan)</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {inspections.filter((i: any) => !i.releasedQuantity).length}
          </h3>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ChefHat size={16} />
            </div>
            <p className="text-sm font-medium text-slate-400">Ishlab chiqarishga berilgan</p>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {inspections.filter((i: any) => i.releasedQuantity > 0).length}
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
                <th className="p-4 font-medium">Akt / Sana</th>
                <th className="p-4 font-medium">Mahsulot</th>
                <th className="p-4 font-medium">Miqdor</th>
                <th className="p-4 font-medium">Rasmlar</th>
                <th className="p-4 font-medium">Ishlab chiqarishga</th>
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
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                inspections.map((act: any) => (
                  <tr key={act.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-indigo-400">{act.actNumber}</p>
                      <p className="text-xs text-slate-500">{new Date(act.inspectionDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 font-medium text-white">{act.product?.name}</td>
                    <td className="p-4 text-slate-300">
                      <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600">
                        {act.quantity} {act.quantityUnit}
                      </span>
                    </td>
                    <td className="p-4">
                      {act.images && act.images.length > 0 ? (
                        <div className="flex -space-x-2">
                          {act.images.map((img: any, idx: number) => (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedImage(img.url)}
                              className="w-8 h-8 rounded-full border-2 border-dark-800 overflow-hidden relative cursor-pointer hover:z-10"
                            >
                              <Image src={img.url} alt="pic" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Rasm yo'q</span>
                      )}
                    </td>
                    <td className="p-4">
                      {act.releasedQuantity ? (
                        <div>
                          <p className="text-emerald-400 font-medium">{act.releasedQuantity} {act.quantityUnit}</p>
                          <p className="text-xs text-slate-500">{new Date(act.releasedDate).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Omborda</span>
                      )}
                    </td>
                    <td className="p-4">
                      {!act.releasedQuantity && (
                        <button 
                          onClick={() => handleRelease(act.id, act.quantity)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-medium border border-indigo-500/20 transition-colors"
                        >
                          <ArrowRight size={14} />
                          O'tkazish
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden border border-white/20">
            <Image src={selectedImage} alt="Kattalashtirilgan rasm" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

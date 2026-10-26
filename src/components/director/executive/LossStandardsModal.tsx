'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, Sliders, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface StandardItem {
  id?: number
  productName: string
  incomingNormPercent: number
  processingNormPercent: number
  storageNormPercent: number
  criticalThreshold: number
  notes?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  lang: string
}

export default function LossStandardsModal({ isOpen, onClose, onSaved, lang }: Props) {
  const [standards, setStandards] = useState<StandardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)
  const [newProductName, setNewProductName] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/director/loss-standards')
      .then((res) => res.json())
      .then((data) => {
        if (data?.standards) {
          setStandards(data.standards)
        }
      })
      .catch(() => toast.error("Standartlarni yuklashda xatolik"))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleUpdateField = (index: number, field: keyof StandardItem, value: any) => {
    setStandards((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleSaveItem = async (index: number) => {
    const item = standards[index]
    if (!item || !item.productName) return

    setSavingIndex(index)
    try {
      const res = await fetch('/api/director/loss-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        toast.success(`"${item.productName}" me'yorlari saqlandi!`)
        onSaved()
      } else {
        toast.error(data?.error || "Saqlashda xatolik")
      }
    } catch {
      toast.error("Aloqa uzildi")
    } finally {
      setSavingIndex(null)
    }
  }

  const handleAddProduct = () => {
    const clean = newProductName.trim()
    if (!clean) return
    if (standards.some((s) => s.productName.toLowerCase() === clean.toLowerCase())) {
      toast.error("Ushbu mahsulot allaqachon mavjud")
      return
    }

    setStandards((prev) => [
      ...prev,
      {
        productName: clean,
        incomingNormPercent: 3.0,
        processingNormPercent: 12.0,
        storageNormPercent: 2.0,
        criticalThreshold: 5.0,
        notes: "Direktor tomonidan kiritildi",
      },
    ])
    setNewProductName('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'ru' ? 'Нормы естественной убыли и пороги брака' : "Me'yoriy yo'qotish va kritik og'ish chegaralari"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ru'
                  ? 'Директор может индивидуально задавать процент нормы для каждого сырья'
                  : "Direktor har bir mahsulot bo‘yicha me'yor foizlarini belgilaydi"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Add new product standard */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-dark-800/60 rounded-2xl border border-slate-200 dark:border-dark-700 shrink-0">
          <input
            type="text"
            placeholder="Yangi xomashyo nomi (masalan: Sabzi, Rediska)..."
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-600 rounded-xl text-xs font-semibold outline-none"
          />
          <button
            onClick={handleAddProduct}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90"
          >
            + Ro'yxatga qo'shish
          </button>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-dark-750 rounded-2xl">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <span className="text-xs">Yuklanmoqda...</span>
            </div>
          ) : standards.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Hali hech qanday me'yor kiritilmagan. Yuqoridagi formadan mahsulot qo'shing.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-dark-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                <tr>
                  <th className="p-3 pl-4">Xomashyo</th>
                  <th className="p-3 text-center">Qabul me'yori %</th>
                  <th className="p-3 text-center">Ishlov me'yori %</th>
                  <th className="p-3 text-center">Ombor me'yori %</th>
                  <th className="p-3 text-center">Kritik og'ish (+%)</th>
                  <th className="p-3 w-16 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-semibold">
                {standards.map((std, idx) => (
                  <tr key={std.productName} className="hover:bg-slate-50/70 dark:hover:bg-dark-800/40">
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">
                      {std.productName}
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={std.incomingNormPercent}
                        onChange={(e) => handleUpdateField(idx, 'incomingNormPercent', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-1 text-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={std.processingNormPercent}
                        onChange={(e) => handleUpdateField(idx, 'processingNormPercent', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-1 text-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-xs font-mono font-bold text-amber-600"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={std.storageNormPercent}
                        onChange={(e) => handleUpdateField(idx, 'storageNormPercent', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-1 text-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={std.criticalThreshold}
                        onChange={(e) => handleUpdateField(idx, 'criticalThreshold', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-1 text-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg text-xs font-mono font-bold text-rose-600"
                      />
                    </td>
                    <td className="p-2 pr-4 text-center">
                      <button
                        onClick={() => handleSaveItem(idx)}
                        disabled={savingIndex === idx}
                        className="p-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs"
                        title="Saqlash"
                      >
                        {savingIndex === idx ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-dark-800 shrink-0">
          <span className="text-[11px] text-slate-400">
            * O'zgartirilgan me'yorlar avtomatik tarzda direktor hisobotlarida hisoblanadi.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

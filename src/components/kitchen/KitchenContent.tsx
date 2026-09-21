'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ChefHat, UtensilsCrossed, QrCode, BarChart3, Calendar, RefreshCw, CheckCircle2, AlertTriangle, X, Loader2, Package, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'

interface Ingredient {
  id: string
  name: string
  qty: string
  unit: string
}

interface MealLog {
  id: number
  mealName: string
  cookedDate: string
  shift: string
  preparedBy: string
  ingredients: string
  notes?: string
  servings?: number
  createdAt: string
}

interface FeedbackStats {
  total: number
  good: number
  average: number
  bad: number
}

interface Feedback {
  id: number
  rating: string
  comment?: string
  date: string
  mealName?: string
  createdAt: string
}

export default function KitchenContent() {
  const [activeTab, setActiveTab] = useState<'journal' | 'stats'>('journal')
  const [logs, setLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [showQR, setShowQR] = useState(false)
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, good: 0, average: 0, bad: 0 })
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))

  // Form state
  const [form, setForm] = useState({
    mealName: '',
    cookedDate: new Date().toISOString().slice(0, 10),
    shift: '1-Smena',
    preparedBy: '',
    notes: '',
    servings: ''
  })
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', qty: '', unit: 'kg' }
  ])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterDate ? `?date=${filterDate}` : ''
      const res = await fetch(`/api/kitchen/meal-logs${params}`)
      if (res.ok) setLogs(await res.json())
    } catch { toast.error('Jurnal yuklanmadi') }
    finally { setLoading(false) }
  }, [filterDate])

  const fetchStats = useCallback(async () => {
    try {
      const params = filterDate ? `?date=${filterDate}` : ''
      const res = await fetch(`/api/kitchen/feedback${params}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || { total: 0, good: 0, average: 0, bad: 0 })
        setFeedbacks(data.feedbacks || [])
      }
    } catch { }
  }, [filterDate])

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [fetchLogs, fetchStats])

  const generateQR = async () => {
    const url = `${baseUrl}/feedback/kitchen`
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#065f46', light: '#ffffff' } })
    setQrDataUrl(dataUrl)
    setShowQR(true)
  }

  const addIngredient = () => {
    setIngredients(prev => [...prev, { id: Date.now().toString(), name: '', qty: '', unit: 'kg' }])
  }

  const removeIngredient = (id: string) => {
    if (ingredients.length === 1) return
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.mealName || !form.preparedBy) {
      toast.error('Ovqat nomi va povar ismi kiritilishi shart!')
      return
    }
    const validIngredients = ingredients.filter(i => i.name.trim())
    if (validIngredients.length === 0) {
      toast.error('Kamida 1 ta mahsulot qo\'shing!')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/kitchen/meal-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ingredients: validIngredients, servings: form.servings || null })
      })
      if (res.ok) {
        toast.success('✅ Ovqat jurnali saqlandi!')
        setShowForm(false)
        setForm({ mealName: '', cookedDate: new Date().toISOString().slice(0, 10), shift: '1-Smena', preparedBy: '', notes: '', servings: '' })
        setIngredients([{ id: '1', name: '', qty: '', unit: 'kg' }])
        fetchLogs()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik yuz berdi')
      }
    } catch { toast.error('Tarmoq xatosi') }
    finally { setSaving(false) }
  }

  const goodPct = stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0
  const avgPct = stats.total > 0 ? Math.round((stats.average / stats.total) * 100) : 0
  const badPct = stats.total > 0 ? Math.round((stats.bad / stats.total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
            <ChefHat size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Oshxona Boshqaruvi</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ovqat jurnali · Baholash statistikasi · QR kod</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={generateQR}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <QrCode size={16} />
            QR Kod Ko&apos;rish
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-600/30 active:scale-95"
          >
            <Plus size={16} />
            Yangi Jurnal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 shadow-sm">
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{logs.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Bugungi Ovqatlar</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.good}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-slate-500 font-medium">Yaxshi</span>
            {stats.total > 0 && <span className="text-[10px] text-emerald-600 font-bold">{goodPct}%</span>}
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.average}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-slate-500 font-medium">O&apos;rtacha</span>
            {stats.total > 0 && <span className="text-[10px] text-amber-600 font-bold">{avgPct}%</span>}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4">
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.bad}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-slate-500 font-medium">Yomon</span>
            {stats.total > 0 && <span className="text-[10px] text-red-600 font-bold">{badPct}%</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('journal')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'journal' ? 'bg-white dark:bg-dark-900 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <UtensilsCrossed size={15} /> Ovqat Jurnali
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-white dark:bg-dark-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <BarChart3 size={15} /> Baholash
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={15} className="text-slate-400" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-200" />
        </div>
        <button onClick={() => { fetchLogs(); fetchStats() }} className="flex items-center gap-1.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm transition-all">
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {/* TAB: Journal */}
      {activeTab === 'journal' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center p-16 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-16 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <UtensilsCrossed size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Bu kunda hali ovqat jurnali yozilmagan</p>
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
                <Plus size={16} /> Birinchi jurnalni qo&apos;shing
              </button>
            </div>
          ) : (
            logs.map(log => {
              const items = JSON.parse(log.ingredients || '[]')
              return (
                <div key={log.id} className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base">{log.mealName}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={11} />{log.shift}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500"><ChefHat size={11} />{log.preparedBy}</span>
                        {log.servings && <span className="flex items-center gap-1 text-xs text-slate-500"><Users size={11} />{log.servings} kishi</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800/50 whitespace-nowrap">{log.cookedDate}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-dark-750 pt-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Package size={11} /> MAHSULOTLAR:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((ing: Ingredient, idx: number) => (
                        <span key={idx} className="text-xs bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-medium border border-slate-200 dark:border-dark-700">
                          {ing.name} <span className="text-slate-400 dark:text-slate-500">— {ing.qty} {ing.unit}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-dark-750 italic">{log.notes}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Progress bars */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white mb-4">Ovqat Baholash Natijalari</h3>
            {stats.total === 0 ? (
              <div className="text-center py-8">
                <BarChart3 size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-400 font-medium">Hali baholash yo&apos;q</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-emerald-600">✅ Yaxshi</span>
                    <span className="text-emerald-600">{stats.good} ta ({goodPct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${goodPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-amber-600">⚠️ O&apos;rtacha</span>
                    <span className="text-amber-600">{stats.average} ta ({avgPct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${avgPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-red-600">❌ Yomon</span>
                    <span className="text-red-600">{stats.bad} ta ({badPct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${badPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          {feedbacks.filter(f => f.comment).length > 0 && (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white mb-3">Izohlar</h3>
              <div className="space-y-2">
                {feedbacks.filter(f => f.comment).map(f => (
                  <div key={f.id} className={`text-sm p-3 rounded-xl border ${f.rating === 'GOOD' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300' : f.rating === 'AVERAGE' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold">{f.rating === 'GOOD' ? '✅' : f.rating === 'AVERAGE' ? '⚠️' : '❌'}</span> {f.comment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-dark-700 text-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={20} /></button>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Ovqat Baholash QR Kodi</h2>
            <p className="text-xs text-slate-500 mb-5">Xodimlar shu QR ni skanerlaydi va anonim baholaydi</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-2xl border-4 border-emerald-100 dark:border-emerald-900/30 w-64 h-64 object-contain" />}
            <p className="text-xs text-slate-400 mt-4 font-mono break-all">{baseUrl}/feedback/kitchen</p>
            <button
              onClick={() => {
                const a = document.createElement('a')
                a.href = qrDataUrl
                a.download = 'oshxona-baholash-qr.png'
                a.click()
              }}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              QR ni Yuklab Olish
            </button>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between sticky top-0 bg-white dark:bg-dark-900 z-10">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="text-orange-500" size={18} /> Yangi Ovqat Jurnali
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Ovqat nomi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ovqat Nomi *</label>
                  <input value={form.mealName} onChange={e => setForm(p => ({ ...p, mealName: e.target.value }))} placeholder="Masalan: Osh, Sho'rva..." required className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sana *</label>
                  <input type="date" value={form.cookedDate} onChange={e => setForm(p => ({ ...p, cookedDate: e.target.value }))} required className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Smena</label>
                  <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))} className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option>1-Smena</option>
                    <option>2-Smena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Necha kishiga</label>
                  <input type="number" value={form.servings} onChange={e => setForm(p => ({ ...p, servings: e.target.value }))} placeholder="Masalan: 150" min="1" className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              {/* Mahsulotlar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Package size={12} /> Mahsulotlar *</label>
                  <button type="button" onClick={addIngredient} className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800/50 transition-all">
                    <Plus size={12} /> Mahsulot qo&apos;shish
                  </button>
                </div>
                <div className="space-y-2">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="flex gap-2 items-center">
                      <input value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} placeholder="Mahsulot nomi" className="flex-1 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input value={ing.qty} onChange={e => updateIngredient(ing.id, 'qty', e.target.value)} placeholder="Miqdor" className="w-20 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <select value={ing.unit} onChange={e => updateIngredient(ing.id, 'unit', e.target.value)} className="w-20 border border-slate-200 dark:border-dark-700 rounded-xl px-2 py-2 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="dona">dona</option>
                        <option value="litr">litr</option>
                      </select>
                      <button type="button" onClick={() => removeIngredient(ing.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Povar ismi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kim tomonidan tayyorlandi *</label>
                <input value={form.preparedBy} onChange={e => setForm(p => ({ ...p, preparedBy: e.target.value }))} placeholder="Povar FIO" required className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Izoh (ixtiyoriy)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Qo'shimcha ma'lumot..." rows={2} className="w-full border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-dark-800 transition-all">Bekor qilish</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saqlanmoqda...</> : <><CheckCircle2 size={15} /> Saqlash</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

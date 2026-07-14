'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Search, Edit, Trash2, Package, X, Save, Loader2, RefreshCw,
} from 'lucide-react'

interface Product {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  minTemperature: number | null
  maxTemperature: number | null
  defaultPackaging: string | null
  defaultConclusion: string | null
  gost: string | null
  isActive: boolean
}

const emptyForm = {
  name: '',
  code: '',
  category: '',
  unit: 'kg',
  minTemperature: '',
  maxTemperature: '',
  defaultPackaging: '',
  defaultConclusion: 'Мувофиқ / Muvofiq',
  storageCondition: '',
  shelfLife: '',
  gost: '',
  description: '',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      if (res.ok) setProducts(await res.json())
    } catch {
      toast.error('Yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      code: p.code || '',
      category: p.category || '',
      unit: p.unit,
      minTemperature: p.minTemperature != null ? String(p.minTemperature) : '',
      maxTemperature: p.maxTemperature != null ? String(p.maxTemperature) : '',
      defaultPackaging: p.defaultPackaging || '',
      defaultConclusion: p.defaultConclusion || 'Мувофиқ / Muvofiq',
      storageCondition: '',
      shelfLife: '',
      gost: p.gost || '',
      description: '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nomi kiritilmagan'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'Mahsulot yangilandi' : 'Mahsulot qo\'shildi')
        setShowModal(false)
        fetchProducts()
      } else {
        toast.error('Saqlashda xatolik')
      }
    } catch { toast.error('Xatolik') } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('O\'chirildi'); fetchProducts() }
      else toast.error('O\'chirishda xatolik')
    } catch { toast.error('Xatolik') } finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Mahsulotlar</h1>
          <p className="section-subtitle">Jami: {products.length} ta mahsulot</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />Yangi mahsulot
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchProducts} className="btn-secondary"><RefreshCw size={15} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Kod</th>
                <th>Kategoriya</th>
                <th>Birlik</th>
                <th>Harorat norma</th>
                <th>GOST</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="font-medium text-slate-100">{p.name}</td>
                  <td className="font-mono text-xs text-slate-400">{p.code || '—'}</td>
                  <td className="text-slate-400">{p.category || '—'}</td>
                  <td className="text-slate-300">{p.unit}</td>
                  <td className="text-slate-400 text-xs">
                    {p.minTemperature != null && p.maxTemperature != null
                      ? `${p.minTemperature}°C — ${p.maxTemperature}°C`
                      : '—'}
                  </td>
                  <td className="text-slate-400 text-xs">{p.gost || '—'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                   flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-red-500/20 border border-dark-600 hover:border-red-500/30
                                   flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 max-w-2xl w-full animate-enter max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nomi *</label>
                <input className="input-field" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mahsulot nomi" />
              </div>
              <div>
                <label className="label">Kod</label>
                <input className="input-field" value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="QND-001" />
              </div>
              <div>
                <label className="label">Kategoriya</label>
                <input className="input-field" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Don mahsulotlari..." />
              </div>
              <div>
                <label className="label">O'lchov birligi</label>
                <select className="input-field" value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litr">litr</option>
                  <option value="dona">dona</option>
                  <option value="qop">qop</option>
                  <option value="t">t</option>
                </select>
              </div>
              <div>
                <label className="label">GOST</label>
                <input className="input-field" value={form.gost}
                  onChange={(e) => setForm((f) => ({ ...f, gost: e.target.value }))}
                  placeholder="ГОСТ 21-94" />
              </div>
              <div>
                <label className="label">Min harorat (°C)</label>
                <input type="number" className="input-field" value={form.minTemperature}
                  onChange={(e) => setForm((f) => ({ ...f, minTemperature: e.target.value }))} />
              </div>
              <div>
                <label className="label">Max harorat (°C)</label>
                <input type="number" className="input-field" value={form.maxTemperature}
                  onChange={(e) => setForm((f) => ({ ...f, maxTemperature: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Standart qadoqlash</label>
                <input className="input-field" value={form.defaultPackaging}
                  onChange={(e) => setForm((f) => ({ ...f, defaultPackaging: e.target.value }))}
                  placeholder="Qop (50 kg)" />
              </div>
              <div className="col-span-2">
                <label className="label">Standart xulosa</label>
                <input className="input-field" value={form.defaultConclusion}
                  onChange={(e) => setForm((f) => ({ ...f, defaultConclusion: e.target.value }))}
                  placeholder="Мувофиқ / Muvofiq ГОСТ..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                Bekor qilish
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="card p-6 max-w-sm w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold mb-2">Mahsulotni o'chirish</p>
            <p className="text-slate-400 text-sm mb-5">Bu mahsulotni o'chirmoqchimisiz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Bekor</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1 justify-center bg-red-600/30">O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

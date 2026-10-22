'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  X,
  Save,
  Loader2,
  RefreshCw,
  Camera,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Product {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  imageUrl?: string | null
  minTemperature: number | null
  maxTemperature: number | null
  defaultPackaging: string | null
  defaultConclusion: string | null
  gost: string | null
  type: string
  isActive: boolean
}

const emptyForm = {
  name: '',
  code: '',
  category: '',
  unit: 'kg',
  imageUrl: '',
  minTemperature: '',
  maxTemperature: '',
  defaultPackaging: '',
  defaultConclusion: 'Muvofiq',
  storageCondition: '',
  shelfLife: '',
  gost: '',
  description: '',
  type: 'RAW_MATERIAL',
  initialStock: '',
  initialBatchNumber: '',
  initialExpirationDate: '',
}

export default function ProductsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'RAW_MATERIAL' | 'KITCHEN' | 'FINISHED_GOOD'>('RAW_MATERIAL')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
      (p.type === activeTab || (!p.type && activeTab === 'RAW_MATERIAL')) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.category?.toLowerCase().includes(search.toLowerCase()) ||
       p.code?.toLowerCase().includes(search.toLowerCase()))
  )

  function openNew() {
    setEditId(null)
    setForm({ ...emptyForm, type: activeTab })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      code: p.code || '',
      category: p.category || '',
      unit: p.unit,
      imageUrl: p.imageUrl || '',
      minTemperature: p.minTemperature != null ? String(p.minTemperature) : '',
      maxTemperature: p.maxTemperature != null ? String(p.maxTemperature) : '',
      defaultPackaging: p.defaultPackaging || '',
      defaultConclusion: p.defaultConclusion || 'Muvofiq',
      storageCondition: '',
      shelfLife: '',
      gost: p.gost || '',
      description: '',
      type: p.type || 'RAW_MATERIAL',
      initialStock: '',
      initialBatchNumber: '',
      initialExpirationDate: '',
    })
    setShowModal(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (data.url) {
        setForm(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Rasm yuklandi!')
      } else {
        toast.error(data.error || 'Rasm yuklashda xatolik')
      }
    } catch {
      toast.error('Rasm yuklashda tarmoq xatosi')
    } finally {
      setUploadingImage(false)
    }
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
          <h1 className="section-title">{t('products')}</h1>
          <p className="section-subtitle">{t('totalProducts')}: {products.length}</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>{t('newProduct')}</span>
        </button>
      </div>

      <div className="card p-0">
        <div className="flex border-b border-dark-700">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'RAW_MATERIAL' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
            onClick={() => setActiveTab('RAW_MATERIAL')}
          >
            {t('actProducts')}
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'KITCHEN' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
            onClick={() => setActiveTab('KITCHEN')}
          >
            {t('kitchenProducts')}
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'FINISHED_GOOD' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
            onClick={() => setActiveTab('FINISHED_GOOD')}
          >
            Jarayon uchun (Tayyor)
          </button>
        </div>
        <div className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t('search')}
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
                <th>{t('name')}</th>
                {activeTab === 'RAW_MATERIAL' && <th>{t('code')}</th>}
                {activeTab === 'RAW_MATERIAL' && <th>{t('category')}</th>}
                <th>{t('unit')}</th>
                {activeTab === 'RAW_MATERIAL' && <th>{t('tempNorm')}</th>}
                {activeTab === 'RAW_MATERIAL' && <th>{t('gost')}</th>}
                <th className="text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="font-medium text-slate-100">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          onClick={() => setPreviewImage(p.imageUrl!)}
                          className="w-10 h-10 rounded-lg object-cover border border-dark-700 cursor-pointer hover:opacity-80 transition shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-slate-500 shrink-0">
                          <Package size={18} />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-100 block">{p.name}</span>
                        {p.imageUrl && (
                          <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                            <Camera size={10} /> Rasmli
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {activeTab === 'RAW_MATERIAL' && <td className="font-mono text-xs text-slate-400">{p.code || '—'}</td>}
                  {activeTab === 'RAW_MATERIAL' && <td><span className="badge badge-blue">{p.category || '—'}</span></td>}
                  <td className="font-mono text-sm">{p.unit}</td>
                  {activeTab === 'RAW_MATERIAL' && (
                    <td className="font-mono text-xs text-slate-400">
                      {p.minTemperature != null && p.maxTemperature != null
                        ? `${p.minTemperature}°C — ${p.maxTemperature}°C`
                        : '—'}
                    </td>
                  )}
                  {activeTab === 'RAW_MATERIAL' && <td className="text-xs text-slate-400">{p.gost || '—'}</td>}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="action-btn text-indigo-400 hover:text-indigo-300">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="action-btn text-red-400 hover:text-red-300">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto animate-enter"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? t('editProduct') : t('newProduct')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex gap-2 p-1 bg-dark-900 rounded-lg border border-dark-700">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'RAW_MATERIAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'RAW_MATERIAL' }))}
                >
                  {t('actForRawMaterial')}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'KITCHEN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'KITCHEN' }))}
                >
                  {t('forKitchen')}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'FINISHED_GOOD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300 hover:bg-dark-800'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'FINISHED_GOOD' }))}
                >
                  Jarayon uchun
                </button>
              </div>

              {/* Image Upload Area */}
              <div className="col-span-2">
                <label className="label flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Camera size={14} className="text-teal-400" />
                    <span>Mahsulot Rasmi (Foto)</span>
                  </span>
                  {uploadingImage && (
                    <span className="text-xs text-teal-400 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Yuklanmoqda...
                    </span>
                  )}
                </label>
                {form.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl border border-dark-700 bg-dark-900 overflow-hidden group">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition"
                      title="Rasmni o'chirish"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-dark-700 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-dark-900/50 hover:bg-dark-900 transition">
                    <UploadCloud size={24} className="text-slate-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">Rasm yuklash yoki suratga olish</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG formatida</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="col-span-2">
                <label className="label">{t('name')} *</label>
                <input className="input-field" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mahsulot nomi" />
              </div>
              
              {form.type === 'RAW_MATERIAL' && (
                <>
                  <div>
                    <label className="label">{t('code')}</label>
                    <input className="input-field" value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="QND-001" />
                  </div>
                  <div>
                    <label className="label">{t('category')}</label>
                    <input className="input-field" value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="Sabzavot, meva, go'sht..." />
                  </div>
                </>
              )}

              <div className={form.type !== 'RAW_MATERIAL' ? 'col-span-2' : ''}>
                <label className="label">{t('unit')}</label>
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

              {form.type === 'RAW_MATERIAL' && (
                <>
                  <div>
                    <label className="label">{t('gost')}</label>
                    <input className="input-field" value={form.gost}
                      onChange={(e) => setForm((f) => ({ ...f, gost: e.target.value }))}
                      placeholder="ГОСТ 21-94" />
                  </div>
                  <div>
                    <label className="label">{t('minTemp')}</label>
                    <input type="number" className="input-field" value={form.minTemperature}
                      onChange={(e) => setForm((f) => ({ ...f, minTemperature: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">{t('maxTemp')}</label>
                    <input type="number" className="input-field" value={form.maxTemperature}
                      onChange={(e) => setForm((f) => ({ ...f, maxTemperature: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">{t('defaultPackaging')}</label>
                    <input className="input-field" value={form.defaultPackaging}
                      onChange={(e) => setForm((f) => ({ ...f, defaultPackaging: e.target.value }))}
                      placeholder="Qop (50 kg)" />
                  </div>

                  {/* INITIAL WAREHOUSE STOCK SECTION */}
                  {!editId && (
                    <div className="col-span-2 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">
                          Omborga boshlang'ich qoldiq kiritish (Ixtiyoriy)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Qoldiq ({form.unit})</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="Masalan: 500"
                            value={form.initialStock}
                            onChange={(e) => setForm(f => ({ ...f, initialStock: e.target.value }))}
                            className="input-field text-xs font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Partiya №</label>
                          <input
                            type="text"
                            placeholder="P-2026-001"
                            value={form.initialBatchNumber}
                            onChange={(e) => setForm(f => ({ ...f, initialBatchNumber: e.target.value }))}
                            className="input-field text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">Yaroqlilik muddati</label>
                          <input
                            type="date"
                            value={form.initialExpirationDate}
                            onChange={(e) => setForm(f => ({ ...f, initialExpirationDate: e.target.value }))}
                            className="input-field text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                {t('cancel')}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? t('saving') : t('save')}
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

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div className="modal-backdrop z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full bg-dark-900 border border-dark-700 rounded-2xl p-3 overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-rose-600 text-white rounded-xl transition z-10"
            >
              <X size={20} />
            </button>
            <img src={previewImage} alt="Mahsulot surati" className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

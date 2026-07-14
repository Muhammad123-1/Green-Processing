'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Truck, X, Save, Loader2, RefreshCw, Phone, MapPin, Mail, Award } from 'lucide-react'

interface Supplier {
  id: number
  name: string
  shortName: string | null
  address: string | null
  phone: string | null
  email: string | null
  certificate: string | null
}

const emptyForm = {
  name: '',
  shortName: '',
  address: '',
  phone: '',
  email: '',
  certificate: '',
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) setSuppliers(await res.json())
    } catch { toast.error('Yuklanmadi') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.shortName?.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(s: Supplier) {
    setEditId(s.id)
    setForm({
      name: s.name,
      shortName: s.shortName || '',
      address: s.address || '',
      phone: s.phone || '',
      email: s.email || '',
      certificate: s.certificate || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nomi kiritilmagan'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/suppliers/${editId}` : '/api/suppliers'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'Yangilandi' : 'Qo\'shildi')
        setShowModal(false)
        fetchSuppliers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Xatolik')
      }
    } catch (err: any) { toast.error(err.message || 'Tarmoq xatosi') } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('O\'chirildi'); fetchSuppliers() }
    } catch { toast.error('Xatolik') } finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Ta'minotchilar</h1>
          <p className="section-subtitle">Jami: {suppliers.length} ta ta'minotchi</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />Yangi ta'minotchi
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Qidirish..." className="input-field pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={fetchSuppliers} className="btn-secondary"><RefreshCw size={15} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Truck size={40} className="mb-3 opacity-30" />
            <p>Ta'minotchilar topilmadi</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Qisqa nom</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Sertifikat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="font-medium text-slate-100">{s.name}</td>
                  <td className="text-slate-400 text-sm">{s.shortName || '—'}</td>
                  <td className="text-slate-300 text-sm">{s.phone || '—'}</td>
                  <td className="text-slate-400 text-sm max-w-[180px] truncate">{s.address || '—'}</td>
                  <td className="text-slate-400 text-sm">{s.certificate || '—'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                   flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => setDeleteId(s.id)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-red-500/20 border border-dark-600 hover:border-red-500/30
                                   flex items-center justify-center text-slate-400 hover:text-red-400 transition-all">
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

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 max-w-lg w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? 'Ta\'minotchini tahrirlash' : 'Yangi ta\'minotchi'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nomi *</label>
                <input className="input-field" placeholder="ООО «Компания»" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Qisqa nom</label>
                <input className="input-field" placeholder="Kompaniya" value={form.shortName}
                  onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} />
              </div>
              <div>
                <label className="label"><span className="flex items-center gap-1"><Phone size={12} />Telefon</span></label>
                <input className="input-field" placeholder="+998 XX XXX XX XX" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label"><span className="flex items-center gap-1"><Mail size={12} />Email</span></label>
                <input type="email" className="input-field" placeholder="info@company.uz" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label"><span className="flex items-center gap-1"><MapPin size={12} />Manzil</span></label>
                <input className="input-field" placeholder="Shahar, ko'cha..." value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="label"><span className="flex items-center gap-1"><Award size={12} />Sertifikat</span></label>
                <input className="input-field" placeholder="ISO 9001:2015..." value={form.certificate}
                  onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="card p-6 max-w-sm w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold mb-2">Ta'minotchini o'chirish</p>
            <p className="text-slate-400 text-sm mb-5">O'chirishni tasdiqlaysizmi?</p>
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Search, Users, Phone, Mail, Building2,
  Edit, Trash2, X, Save, Loader2, ClipboardList,
  CheckCircle, XCircle, RefreshCw, ChevronRight,
  UserCheck, UserX, FileText, Award
} from 'lucide-react'

interface Supervisor {
  id: number
  name: string
  position: string | null
  phone: string | null
  email: string | null
  department: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  _count: { inspections: number }
}

const emptyForm = {
  name: '',
  position: '',
  phone: '',
  email: '',
  department: '',
  notes: '',
}

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)

  const fetchSupervisors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, includeInactive: String(includeInactive) })
      const res = await fetch(`/api/supervisors?${params}`)
      if (res.ok) setSupervisors(await res.json())
    } catch {
      toast.error('Yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [search, includeInactive])

  useEffect(() => { fetchSupervisors() }, [fetchSupervisors])

  function openAdd() {
    setEditId(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  function openEdit(sup: Supervisor) {
    setEditId(sup.id)
    setForm({
      name: sup.name,
      position: sup.position || '',
      phone: sup.phone || '',
      email: sup.email || '',
      department: sup.department || '',
      notes: sup.notes || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Ism kiritilmagan')
      return
    }
    setSaving(true)
    try {
      const url = editId ? `/api/supervisors/${editId}` : '/api/supervisors'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'Tahrirlandi!' : "Nazoratchi qo'shildi!")
        setShowModal(false)
        fetchSupervisors()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/supervisors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || "O'chirildi")
        setDeleteId(null)
        setSelectedSupervisor(null)
        fetchSupervisors()
      }
    } catch {
      toast.error('Xatolik')
    }
  }

  async function toggleActive(sup: Supervisor) {
    try {
      const res = await fetch(`/api/supervisors/${sup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sup.name, position: sup.position, phone: sup.phone,
          email: sup.email, department: sup.department, notes: sup.notes,
          isActive: !sup.isActive
        }),
      })
      if (res.ok) {
        toast.success(sup.isActive ? 'Nofaol qilindi' : 'Faollashtirildi')
        fetchSupervisors()
      }
    } catch {
      toast.error('Xatolik')
    }
  }

  const active = supervisors.filter(s => s.isActive)
  const inactive = supervisors.filter(s => !s.isActive)
  const totalInspections = supervisors.reduce((sum, s) => sum + s._count.inspections, 0)

  return (
    <div className="space-y-6 animate-enter">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Nazoratchilar</h1>
          <p className="section-subtitle">
            Jami: {supervisors.length} ta — {active.length} faol, {inactive.length} nofaol
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Nazoratchi qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami nazoratchilar', value: supervisors.length, icon: Users, color: 'blue' },
          { label: 'Faol nazoratchilar', value: active.length, icon: UserCheck, color: 'emerald' },
          { label: 'Nofaol', value: inactive.length, icon: UserX, color: 'red' },
          { label: 'Jami aktlar', value: totalInspections, icon: ClipboardList, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                ${color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                  color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                  color === 'red' ? 'bg-red-500/15 text-red-400' :
                  'bg-purple-500/15 text-purple-400'}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Ism, lavozim, telefon..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded"
            />
            Nofaollarni ham ko'rish
          </label>
          <button onClick={fetchSupervisors} className="btn-secondary gap-2">
            <RefreshCw size={15} /> Yangilash
          </button>
        </div>
      </div>

      {/* Content: Table + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Table */}
        <div className={`card overflow-hidden ${selectedSupervisor ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          ) : supervisors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Users size={48} className="mb-4 opacity-30" />
              <p className="font-medium text-lg">Nazoratchilar topilmadi</p>
              <p className="text-sm mt-1">Yangi nazoratchi qo'shing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>F.I.O.</th>
                    <th>Lavozim</th>
                    <th>Bo'lim</th>
                    <th>Telefon</th>
                    <th className="text-center">Aktlar</th>
                    <th className="text-center">Holat</th>
                    <th className="text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map((sup) => (
                    <tr
                      key={sup.id}
                      className={`table-row cursor-pointer ${selectedSupervisor?.id === sup.id ? 'bg-blue-500/10' : ''}`}
                      onClick={() => setSelectedSupervisor(selectedSupervisor?.id === sup.id ? null : sup)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            ${sup.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {sup.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{sup.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-300">{sup.position || '—'}</td>
                      <td className="text-slate-400 text-sm">{sup.department || '—'}</td>
                      <td className="text-slate-300 text-sm">{sup.phone || '—'}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${sup._count.inspections > 0 ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                          <ClipboardList size={10} />
                          {sup._count.inspections}
                        </span>
                      </td>
                      <td className="text-center">
                        {sup.isActive
                          ? <span className="badge-success"><CheckCircle size={10} />Faol</span>
                          : <span className="badge-danger"><XCircle size={10} />Nofaol</span>
                        }
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEdit(sup)}
                            className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                       flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all"
                            title="Tahrirlash"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive(sup)}
                            className={`w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                       flex items-center justify-center transition-all
                                       ${sup.isActive ? 'text-slate-400 hover:text-orange-400' : 'text-slate-400 hover:text-emerald-400'}`}
                            title={sup.isActive ? 'Nofaol qilish' : 'Faollashtirish'}
                          >
                            {sup.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => setDeleteId(sup.id)}
                            className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-red-500/20 border border-dark-600 hover:border-red-500/30
                                       flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedSupervisor && (
          <div className="card p-5 space-y-4 animate-enter">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Batafsil ma'lumot</h3>
              <button
                onClick={() => setSelectedSupervisor(null)}
                className="w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 py-4 border-b border-dark-700">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold
                ${selectedSupervisor.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {selectedSupervisor.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-lg">{selectedSupervisor.name}</p>
                {selectedSupervisor.position && (
                  <p className="text-sm text-cyan-400">{selectedSupervisor.position}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {selectedSupervisor.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={14} className="text-slate-500 shrink-0" />
                  <span className="text-slate-300">{selectedSupervisor.department}</span>
                </div>
              )}
              {selectedSupervisor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-slate-500 shrink-0" />
                  <span className="text-slate-300">{selectedSupervisor.phone}</span>
                </div>
              )}
              {selectedSupervisor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-slate-500 shrink-0" />
                  <span className="text-slate-300 text-xs">{selectedSupervisor.email}</span>
                </div>
              )}
              {selectedSupervisor.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400 text-xs">{selectedSupervisor.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-purple-400" />
                  <span className="text-sm text-slate-400">Bajargan aktlari</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {selectedSupervisor._count.inspections}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => openEdit(selectedSupervisor)}
                className="btn-secondary flex-1 justify-center text-sm py-2"
              >
                <Edit size={14} /> Tahrirlash
              </button>
              <button
                onClick={() => toggleActive(selectedSupervisor)}
                className={`flex-1 justify-center text-sm py-2 rounded-xl border font-medium flex items-center gap-2 transition-all
                  ${selectedSupervisor.isActive
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
              >
                {selectedSupervisor.isActive ? <><UserX size={14} /> Nofaol</> : <><UserCheck size={14} /> Faollashtir</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 max-w-lg w-full animate-enter space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                  <Users size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {editId ? 'Nazoratchi tahrirlash' : "Yangi nazoratchi qo'shish"}
                  </h3>
                  <p className="text-xs text-slate-400">Barcha maydonlar ixtiyoriy (* dan tashqari)</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">F.I.O. *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Karimova Aziza Mahmudovna"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lavozimi</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Katta nazoratchi"
                    value={form.position}
                    onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Bo'lim</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Sifat nazorati"
                    value={form.department}
                    onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefon raqami</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="+998 90 123 45 67"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@green.uz"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Izoh</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot..."
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1 justify-center"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 justify-center"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editId ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="card p-6 max-w-sm w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Nazoratchi o'chirish</h3>
                <p className="text-sm text-slate-400">Bu amalni qaytarib bo'lmaydi</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Agar nazoratchi akti bo'lsa, u <span className="text-orange-400 font-medium">nofaol qilinadi</span> (o'chirilmaydi).
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center bg-red-600/30 hover:bg-red-600/50"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

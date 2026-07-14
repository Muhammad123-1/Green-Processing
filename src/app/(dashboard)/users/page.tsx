'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Edit, Shield, Eye, EyeOff, Save, Loader2, X, RefreshCw } from 'lucide-react'

interface User {
  id: number
  name: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
}

const roleColors: Record<string, string> = {
  ADMIN: 'badge-danger',
  OPERATOR: 'badge-info',
  READONLY: 'badge-warning',
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  OPERATOR: 'Operator',
  READONLY: 'Faqat o\'qish',
}

const emptyForm = { name: '', username: '', password: '', role: 'OPERATOR' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditId(u.id)
    setForm({ name: u.name, username: u.username, password: '', role: u.role })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error('Ism va login kiritilmagan')
      return
    }
    if (!editId && !form.password) {
      toast.error('Parol kiritilmagan')
      return
    }

    setSaving(true)
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editId ? 'Yangilandi' : 'Qo\'shildi')
        setShowModal(false)
        fetchUsers()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Xatolik')
      }
    } catch { toast.error('Xatolik') } finally { setSaving(false) }
  }

  async function toggleActive(id: number, current: boolean) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      })
      if (res.ok) { fetchUsers(); toast.success('Holat o\'zgartirildi') }
    } catch { toast.error('Xatolik') }
  }

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Foydalanuvchilar</h1>
          <p className="section-subtitle">Tizim foydalanuvchilari va ruxsatlar</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />Yangi foydalanuvchi
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Login</th>
                <th>Rol</th>
                <th>Holat</th>
                <th>Yaratilgan</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="font-medium text-slate-100">{u.name}</td>
                  <td className="font-mono text-sm text-slate-400">{u.username}</td>
                  <td>
                    <span className={roleColors[u.role] || 'badge-info'}>
                      <Shield size={10} />
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={u.isActive ? 'badge-success cursor-pointer' : 'badge-danger cursor-pointer'}
                    >
                      {u.isActive ? 'Faol' : 'Nofaol'}
                    </button>
                  </td>
                  <td className="text-slate-400 text-sm">
                    {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button onClick={() => openEdit(u)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                   flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all">
                        <Edit size={13} />
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
          <div className="card p-6 max-w-md w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">To'liq ism *</label>
                <input className="input-field" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Abdullayev Jasur" />
              </div>
              <div>
                <label className="label">Login *</label>
                <input className="input-field" value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="jasur_op" />
              </div>
              <div>
                <label className="label">{editId ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Parol kiriting"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input-field" value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="ADMIN">Administrator</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="READONLY">Faqat o'qish</option>
                </select>
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
    </div>
  )
}

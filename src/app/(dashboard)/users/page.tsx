'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Edit, Shield, Eye, EyeOff, Save, Loader2, X, RefreshCw, UserCheck, Search } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface User {
  id: number
  name: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
}

const roleColors: Record<string, string> = {
  DIRECTOR: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ADMIN: 'badge-danger',
  QUALITY_CONTROL: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  INSPECTOR: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  PRODUCTION: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  TECHNOLOGY: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  WAREHOUSE: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  SUPPLY: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  ACCOUNTING: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  HR: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
  KITCHEN: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  SECURITY: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  OPERATOR: 'badge-info',
  READONLY: 'badge-warning',
}

const roleLabelsMap: Record<string, { uz: string; ru: string; en: string }> = {
  DIRECTOR: { uz: 'Direktor (Boshqaruv)', ru: 'Директор (Управление)', en: 'Director (Management)' },
  ADMIN: { uz: 'Administrator', ru: 'Администратор', en: 'Administrator' },
  QUALITY_CONTROL: { uz: 'Bosh Sifat Nazorati (QC)', ru: 'Главный контролер качества (ОТК)', en: 'Head of Quality (QC)' },
  INSPECTOR: { uz: 'Sex Nazoratchisi', ru: 'Цеховой инспектор', en: 'Shop Inspector' },
  PRODUCTION: { uz: 'Ishlab Chiqarish', ru: 'Производство', en: 'Production' },
  TECHNOLOGY: { uz: 'Bosh Texnolog', ru: 'Главный технолог', en: 'Chief Technologist' },
  WAREHOUSE: { uz: 'Ombor (Sklad Mudiri)', ru: 'Склад (Заведующий складом)', en: 'Warehouse Manager' },
  SUPPLY: { uz: "Ta'minot Bo'limi", ru: 'Отдел снабжения', en: 'Supply Department' },
  ACCOUNTING: { uz: 'Buxgalteriya', ru: 'Бухгалтерия', en: 'Accounting' },
  HR: { uz: 'Kadrlar Bo\'limi (HR)', ru: 'Отдел кадров (HR)', en: 'Human Resources (HR)' },
  KITCHEN: { uz: 'Xodimlar Oshxonasi', ru: 'Кухня персонала', en: 'Staff Kitchen' },
  SECURITY: { uz: 'Xavfsizlik Xizmati', ru: 'Служба безопасности', en: 'Security Service' },
  OPERATOR: { uz: 'Operator', ru: 'Оператор', en: 'Operator' },
  READONLY: { uz: "Faqat ko'rish", ru: 'Только чтение', en: 'Read-only' },
}

const emptyForm = { name: '', username: '', password: '', role: 'OPERATOR' }

export default function UsersPage() {
  const { formatDual } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showPass, setShowPass] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const usersPagination = useInfiniteTable(filteredUsers, 10, [search])

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
          <h1 className="section-title">{formatDual("Foydalanuvchilar", "Пользователи", "Users")}</h1>
          <p className="section-subtitle">{formatDual("Tizim foydalanuvchilari va ruxsatlar", "Пользователи системы и права доступа", "System users and permissions")}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />{formatDual("Yangi foydalanuvchi", "Новый пользователь", "New User")}
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={formatDual("Foydalanuvchi ismi, logini yoki roli bo'yicha qidirish...", "Поиск по имени, логину или роли...", "Search by name, username, or role...")}
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchUsers} className="btn-secondary" title={formatDual("Yangilash", "Обновить", "Refresh")}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-medium">{formatDual("Foydalanuvchilar topilmadi", "Пользователи не найдены", "No users found")}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{formatDual("Ism", "Имя", "Name")}</th>
                <th>{formatDual("Login", "Логин", "Username")}</th>
                <th>{formatDual("Rol", "Роль", "Role")}</th>
                <th>{formatDual("Holat", "Статус", "Status")}</th>
                <th>{formatDual("Yaratilgan", "Создан", "Created")}</th>
                <th className="text-right">{formatDual("Amallar", "Действия", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {usersPagination.displayedItems.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="font-medium text-slate-100">{u.name}</td>
                  <td className="font-mono text-sm text-slate-400">{u.username}</td>
                  <td>
                    <span className={roleColors[u.role] || 'badge-info'}>
                      <Shield size={10} />
                      {roleLabelsMap[u.role] ? formatDual(roleLabelsMap[u.role].uz, roleLabelsMap[u.role].ru, roleLabelsMap[u.role].en) : u.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={u.isActive ? 'badge-success cursor-pointer' : 'badge-danger cursor-pointer'}
                    >
                      {u.isActive ? formatDual("Faol", "Активен", "Active") : formatDual("Nofaol", "Неактивен", "Inactive")}
                    </button>
                  </td>
                  <td className="text-slate-400 text-sm">
                    {new Date(u.createdAt).toLocaleDateString(formatDual('uz-UZ', 'ru-RU', 'en-US'))}
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

        <InfiniteTableFooter
          currentCount={usersPagination.visibleCount}
          totalCount={usersPagination.totalCount}
          hasMore={usersPagination.hasMore}
          showAll={usersPagination.showAll}
          onLoadMore={usersPagination.loadMore}
          onToggleShowAll={usersPagination.toggleShowAll}
          sentinelRef={usersPagination.sentinelRef}
          pageSize={10}
          itemName={{ uz: 'foydalanuvchi', ru: 'пользователей', en: 'users' }}
        />
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 max-w-md w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editId ? formatDual("Foydalanuvchini tahrirlash", "Редактирование пользователя", "Edit User") : formatDual("Yangi foydalanuvchi", "Новый пользователь", "New User")}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{formatDual("To'liq ism", "Ф.И.О / Полное имя", "Full Name")} *</label>
                <input className="input-field" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Abdullayev Jasur" />
              </div>
              <div>
                <label className="label">{formatDual("Login", "Логин", "Username")} *</label>
                <input className="input-field" value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="jasur_op" />
              </div>
              <div>
                <label className="label">{editId ? formatDual("Yangi parol (ixtiyoriy)", "Новый пароль (необязательно)", "New password (optional)") : formatDual("Parol *", "Пароль *", "Password *")}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={formatDual("Parol kiriting", "Введите пароль", "Enter password")}
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
                <label className="label">{formatDual("Lavozim / Rol", "Должность / Роль", "Position / Role")}</label>
                <select className="input-field" value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  {Object.entries(roleLabelsMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {formatDual(label.uz, label.ru, label.en)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">{formatDual("Bekor", "Отмена", "Cancel")}</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {formatDual("Saqlash", "Сохранить", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

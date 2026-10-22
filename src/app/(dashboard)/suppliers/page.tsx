'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Truck, X, Save, Loader2, RefreshCw, Phone, MapPin, Mail, Award, Building2 } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

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
  const { lang, formatDual } = useLanguage()
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
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data) ? data : [])
      } else {
        toast.error(lang === 'ru' ? 'Ошибка загрузки поставщиков' : "Ta'minotchilarni yuklashda xatolik")
      }
    } catch { 
      toast.error(lang === 'ru' ? 'Сетевая ошибка' : "Tarmoq xatosi") 
    } finally { 
      setLoading(false) 
    }
  }, [lang])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setDeleteId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.shortName && s.shortName.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.certificate && s.certificate.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    )
  })

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
    if (!form.name.trim()) { 
      toast.error(lang === 'ru' ? 'Введите наименование' : "Nomi kiritilmagan")
      return 
    }
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
        toast.success(
          editId 
            ? (lang === 'ru' ? 'Поставщик успешно обновлен' : "Ta'minotchi yangilandi") 
            : (lang === 'ru' ? 'Поставщик успешно добавлен' : "Yangi ta'minotchi qo'shildi")
        )
        setShowModal(false)
        fetchSuppliers()
      } else {
        const data = await res.json()
        toast.error(data.error || (lang === 'ru' ? 'Ошибка при сохранении' : 'Xatolik'))
      }
    } catch (err: any) { 
      toast.error(err.message || (lang === 'ru' ? 'Сетевая ошибка' : 'Tarmoq xatosi')) 
    } finally { 
      setSaving(false) 
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) { 
        toast.success(lang === 'ru' ? 'Поставщик удален' : "Ta'minotchi o'chirildi")
        fetchSuppliers() 
      } else {
        toast.error(lang === 'ru' ? 'Ошибка удаления' : "O'chirishda xatolik")
      }
    } catch { 
      toast.error(lang === 'ru' ? 'Ошибка сети' : 'Xatolik') 
    } finally { 
      setDeleteId(null) 
    }
  }

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Truck size={14} />
              {formatDual("Ta'minot & Hamkorlar", "Снабжение и партнеры", "Supply & Partners")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatDual("Ta'minotchilar (Yetkazib Beruvchilar)", "Поставщики сырья и материалов", "Suppliers & Vendors")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {formatDual(
              `Jami: ${suppliers.length} ta faol yetkazib beruvchi korxona`,
              `Всего: ${suppliers.length} активных контрагентов-поставщиков`,
              `Total: ${suppliers.length} active supplier partners`
            )}
          </p>
        </div>
        <button 
          onClick={openNew} 
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap"
        >
          <Plus size={18} />
          <span>{formatDual("+ Yangi Ta'minotchi", "+ Добавить поставщика", "+ New Supplier")}</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder={formatDual("Nomi, telefon, manzil yoki sertifikat bo'yicha qidirish...", "Поиск по названию, телефону, адресу или сертификату...", "Search by name, phone, address...")}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button 
            onClick={fetchSuppliers} 
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
            <p className="text-sm">{formatDual("Ta'minotchilar yuklanmoqda...", "Загрузка поставщиков...", "Loading suppliers...")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Truck size={44} className="mb-3 opacity-30" />
            <p className="font-semibold text-slate-400">{formatDual("Ta'minotchilar topilmadi", "Поставщики не найдены", "No suppliers found")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-dark-800/60 border-b border-dark-750 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">{formatDual("Nomi & Korxona", "Наименование", "Name")}</th>
                  <th className="py-4 px-5">{formatDual("Qisqa nom", "Краткое имя", "Short Name")}</th>
                  <th className="py-4 px-5">{formatDual("Telefon", "Телефон", "Phone")}</th>
                  <th className="py-4 px-5">{formatDual("Manzil", "Адрес", "Address")}</th>
                  <th className="py-4 px-5">{formatDual("Sertifikat / Standart", "Сертификат", "Certificate")}</th>
                  <th className="py-4 px-5 text-right">{formatDual("Amallar", "Действия", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-750">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-base hover:text-emerald-400 transition-colors">
                            {s.name}
                          </div>
                          {s.email && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{s.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-400 font-medium">{s.shortName || '—'}</td>
                    <td className="py-4 px-5">
                      {s.phone ? (
                        <span className="font-mono text-slate-200 bg-dark-800 border border-dark-700 px-2.5 py-1 rounded-lg text-xs">
                          {s.phone}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs max-w-[200px] truncate">{s.address || '—'}</td>
                    <td className="py-4 px-5">
                      {s.certificate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Award size={12} /> {s.certificate}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => openEdit(s)}
                          className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all"
                          title={formatDual("Tahrirlash", "Редактировать", "Edit")}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(s.id)}
                          className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-rose-500/20 border border-dark-700 hover:border-rose-500/30 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all"
                          title={formatDual("O'chirish", "Удалить", "Delete")}
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

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setShowModal(false)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-dark-700 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {editId 
                      ? formatDual("Ta'minotchini tahrirlash", "Редактировать поставщика", "Edit Supplier")
                      : formatDual("Yangi ta'minotchi qo'shish", "Новый поставщик", "New Supplier")
                    }
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Hamkor korxona rekvizitlari va sertifikati", "Реквизиты и сертификаты компании-партнера", "Company details and certificates")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {formatDual("Nomi / Tashkilot", "Наименование", "Company Name")} <span className="text-red-400">*</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="OOO «AgroFood»" 
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {formatDual("Qisqa nom", "Краткое имя", "Short Name")}
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="AgroFood" 
                  value={form.shortName}
                  onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Phone size={12} className="text-emerald-400" />
                    <span>{formatDual("Telefon", "Телефон", "Phone")}</span>
                  </label>
                  <input 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono" 
                    placeholder="+998 90 123 45 67" 
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Mail size={12} className="text-emerald-400" />
                    <span>{formatDual("Email", "Email", "Email")}</span>
                  </label>
                  <input 
                    type="email" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                    placeholder="info@company.uz" 
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-400" />
                  <span>{formatDual("Manzil", "Адрес", "Address")}</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="Toshkent vil., Zangiota tumani..." 
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                  <Award size={12} className="text-emerald-400" />
                  <span>{formatDual("Sertifikat / Sifat standarti", "Сертификат / Стандарт", "Certificate")}</span>
                </label>
                <input 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="ISO 22000:2018 / GlobalG.A.P / Halol" 
                  value={form.certificate}
                  onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.value }))} 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex-1 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setDeleteId(null)}>
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-bold text-lg mb-2">
              {formatDual("Ta'minotchini o'chirish", "Удаление поставщика", "Delete Supplier")}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {formatDual(
                "Ushbu ta'minotchi korxonani o'chirishni tasdiqlaysizmi?",
                "Вы действительно хотите удалить этого контрагента-поставщика?",
                "Are you sure you want to delete this supplier?"
              )}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)} 
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors flex-1"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button 
                onClick={() => handleDelete(deleteId)} 
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex-1"
              >
                {formatDual("O'chirish", "Удалить", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

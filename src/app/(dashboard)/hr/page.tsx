'use client'

import { useState, useEffect } from 'react'
import { Users, HeartPulse, UserPlus, AlertCircle, CheckCircle2, XCircle, Search, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Kadrlar va Medpunkt",
    subtitle: "Xodimlar ro'yxati va tibbiy ruxsatnomalar nazorati",
    totalEmployees: "Jami xodimlar",
    healthy: "Sog'lom (Ruxsat etilgan)",
    expired: "Muddati o'tgan (Bloklangan)",
    search: "Xodim ismi bo'yicha qidirish...",
    name: "F.I.SH",
    role: "Lavozimi",
    medClearance: "Med. Ruxsatnoma",
    actions: "Amallar",
    statusOk: "Ruxsat etilgan",
    statusBlocked: "Bloklangan",
    updateMed: "Medknijkani yangilash",
    empty: "Xodimlar topilmadi",
    loading: "Yuklanmoqda..."
  },
  ru: {
    title: "Отдел кадров и Медпункт",
    subtitle: "Список сотрудников и контроль мед. книжек",
    totalEmployees: "Всего сотрудников",
    healthy: "Здоров (Допущен)",
    expired: "Просрочено (Заблокирован)",
    search: "Поиск по имени...",
    name: "Ф.И.О",
    role: "Должность",
    medClearance: "Мед. Допуск",
    actions: "Действия",
    statusOk: "Допущен",
    statusBlocked: "Заблокирован",
    updateMed: "Обновить медкнижку",
    empty: "Сотрудники не найдены",
    loading: "Загрузка..."
  },
  en: {
    title: "HR & Medical Point",
    subtitle: "Employee list and medical clearance control",
    totalEmployees: "Total Employees",
    healthy: "Healthy (Cleared)",
    expired: "Expired (Blocked)",
    search: "Search by name...",
    name: "Full Name",
    role: "Role",
    medClearance: "Med. Clearance",
    actions: "Actions",
    statusOk: "Cleared",
    statusBlocked: "Blocked",
    updateMed: "Update Med. Record",
    empty: "No employees found",
    loading: "Loading..."
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function HRPage() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch {
      toast.error('Error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleMedicalClearance(id: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicalClearance: !currentStatus })
      })
      if (res.ok) {
        toast.success('Holat yangilandi')
        fetchUsers()
      }
    } catch {
      toast.error('Xatolik')
    }
  }

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
  const healthyCount = users.filter(u => u.medicalClearance).length
  const blockedCount = users.filter(u => !u.medicalClearance).length

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-indigo-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.totalEmployees}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{users.length}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <HeartPulse size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.healthy}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{healthyCount}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.expired}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{blockedCount}</h3>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-dark-700 shadow-xl">
        <div className="p-5 border-b border-dark-700 bg-dark-800/30">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="px-6 py-4 font-semibold">{t.name}</th>
                <th className="px-6 py-4 font-semibold">{t.role}</th>
                <th className="px-6 py-4 font-semibold">{t.medClearance}</th>
                <th className="px-6 py-4 font-semibold text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.loading}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.empty}</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{u.name}</td>
                    <td className="px-6 py-4 text-slate-400">{u.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        u.medicalClearance 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {u.medicalClearance ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {u.medicalClearance ? t.statusOk : t.statusBlocked}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleMedicalClearance(u.id, u.medicalClearance)}
                        className={`p-2 rounded-lg border transition-colors ${
                          u.medicalClearance 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        }`}
                        title={t.updateMed}
                      >
                        <HeartPulse size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

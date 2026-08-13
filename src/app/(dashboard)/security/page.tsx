'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, Key, LogIn, LogOut, Ticket, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Xavfsizlik va Texnik Xizmat",
    subtitle: "Zavod xavfsizligi va uskunalar nosozliklari nazorati",
    openTickets: "Ochiq Tiketlar",
    inProgress: "Jarayonda",
    resolved: "Hal qilingan",
    newTicket: "Yangi nosozlik",
    colTitle: "Nosozlik",
    colStatus: "Holati",
    colReported: "Kim tomonidan",
    colDate: "Sana",
    empty: "Tiketlar topilmadi",
    loading: "Yuklanmoqda...",
    statusOpen: "Ochiq",
    statusProgress: "Jarayonda",
    statusResolved: "Hal qilingan"
  },
  ru: {
    title: "Безопасность и Тех. Обслуживание",
    subtitle: "Контроль безопасности и поломок оборудования",
    openTickets: "Открытые тикеты",
    inProgress: "В процессе",
    resolved: "Решенные",
    newTicket: "Новая поломка",
    colTitle: "Поломка",
    colStatus: "Статус",
    colReported: "Отправитель",
    colDate: "Дата",
    empty: "Тикеты не найдены",
    loading: "Загрузка...",
    statusOpen: "Открыт",
    statusProgress: "В процессе",
    statusResolved: "Решен"
  },
  en: {
    title: "Security & Maintenance",
    subtitle: "Plant security and equipment failure tracking",
    openTickets: "Open Tickets",
    inProgress: "In Progress",
    resolved: "Resolved",
    newTicket: "New Issue",
    colTitle: "Issue",
    colStatus: "Status",
    colReported: "Reported By",
    colDate: "Date",
    empty: "No tickets found",
    loading: "Loading...",
    statusOpen: "Open",
    statusProgress: "In Progress",
    statusResolved: "Resolved"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function SecurityPage() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fake data since we don't have the API yet
    setTimeout(() => {
      setTickets([
        { id: 1, title: 'Oshxonadagi plita ishlamayapti', status: 'OPEN', reportedBy: 'Zebo Oshpas', createdAt: new Date().toISOString() },
        { id: 2, title: 'Ombor eshigi yopilmayapti', status: 'IN_PROGRESS', reportedBy: 'Omborchi', createdAt: new Date().toISOString() },
        { id: 3, title: 'Svetofor skanerda muammo', status: 'RESOLVED', reportedBy: 'Sifat Nazoratchi', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const openCount = tickets.filter(t => t.status === 'OPEN').length
  const progressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button className="btn-primary group relative overflow-hidden">
          <Ticket size={18} className="relative z-10" />
          <span className="relative z-10">{t.newTicket}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.openTickets}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{openCount}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-amber-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Settings size={24} className="animate-spin-slow" />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.inProgress}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{progressCount}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.resolved}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{resolvedCount}</h3>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-dark-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="px-6 py-4 font-semibold">{t.colTitle}</th>
                <th className="px-6 py-4 font-semibold">{t.colReported}</th>
                <th className="px-6 py-4 font-semibold">{t.colDate}</th>
                <th className="px-6 py-4 font-semibold text-right">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.loading}</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.empty}</td>
                </tr>
              ) : (
                tickets.map((tItem) => (
                  <tr key={tItem.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{tItem.title}</td>
                    <td className="px-6 py-4 text-slate-400">{tItem.reportedBy}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(tItem.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                        tItem.status === 'RESOLVED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : tItem.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {tItem.status === 'RESOLVED' ? t.statusResolved : tItem.status === 'IN_PROGRESS' ? t.statusProgress : t.statusOpen}
                      </span>
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

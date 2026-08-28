'use client'

import { useState, useEffect } from 'react'
import { Activity, Users, Truck, DollarSign, Package, ClipboardList, ShieldAlert, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Direktor Paneli",
    subtitle: "Zavodning umumiy holati va asosiy ko'rsatkichlar",
    statsTotalUsers: "Xodimlar",
    statsInspections: "Sifat tekshiruvlari",
    statsRevenue: "Umumiy Daromad",
    statsOrders: "Bajarilgan buyurtmalar",
    sectionOperations: "Tezkor ma'lumotlar",
    loading: "Ma'lumotlar yuklanmoqda...",
  },
  ru: {
    title: "Панель Директора",
    subtitle: "Общее состояние завода и ключевые показатели",
    statsTotalUsers: "Сотрудники",
    statsInspections: "Проверки качества",
    statsRevenue: "Общий доход",
    statsOrders: "Выполненные заказы",
    sectionOperations: "Оперативные данные",
    loading: "Загрузка данных...",
  },
  en: {
    title: "Director Dashboard",
    subtitle: "Plant overall status and key metrics",
    statsTotalUsers: "Employees",
    statsInspections: "Quality Inspections",
    statsRevenue: "Total Revenue",
    statsOrders: "Completed Orders",
    sectionOperations: "Operational Data",
    loading: "Loading data...",
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function DirectorPage() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalInspections: 0,
    salesOrdersCount: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/director')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-enter">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400">{t.loading}</p>
      </div>
    )
  }

  // Format currency dynamically based on size
  const formatRevenue = (value: number) => {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + ' mlrd'
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + ' mln'
    return value.toLocaleString()
  }

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-blue-500 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
              <Users size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.statsTotalUsers}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{stats.totalEmployees}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
              <DollarSign size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.statsRevenue}</p>
          </div>
          <h3 className="text-3xl font-bold text-emerald-400 tracking-tight">{formatRevenue(stats.totalRevenue)}</h3>
          <p className="text-[10px] text-slate-500 mt-1 absolute bottom-4 right-4">UZS</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-purple-500 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-inner">
              <ClipboardList size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.statsInspections}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{stats.totalInspections}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-amber-500 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-inner">
              <Package size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.statsOrders}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{stats.salesOrdersCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6 border border-dark-700 bg-dark-900/50">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-indigo-400" size={20} />
            {t.sectionOperations}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Ochiq texnik xizmat so'rovlari</p>
                  <p className="text-xs text-slate-500">2 ta uskunada muammo bor</p>
                </div>
              </div>
              <span className="text-red-400 font-bold">Ko'rish</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Yo'ldagi jo'natmalar</p>
                  <p className="text-xs text-slate-500">Bugun 4 ta yuk jo'natildi</p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold">Ko'rish</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Oylik ishlab chiqarish plani</p>
                  <p className="text-xs text-slate-500">78% bajarildi</p>
                </div>
              </div>
              <span className="text-indigo-400 font-bold">Ko'rish</span>
            </div>
          </div>
        </div>

        {/* Empty placeholder space for future charts */}
        <div className="card p-6 border border-dark-700 bg-dark-900/50 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-4 opacity-50">
            <Activity size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">Bu yerda tez orada statistik grafiklar paydo bo'ladi</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, Package, Clock, ShieldCheck, Search, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Logistika va Jo'natmalar",
    subtitle: "Transport vositalari va yetkazib berish nazorati",
    activeTrucks: "Faol Mashinalar",
    inTransit: "Yo'lda",
    delivered: "Yetkazilgan",
    newShipment: "Yangi jo'natma",
    colId: "ID",
    colDriver: "Haydovchi / Mashina",
    colRoute: "Yo'nalish",
    colStatus: "Holati",
    empty: "Jo'natmalar topilmadi",
    loading: "Yuklanmoqda...",
    statusTransit: "Yo'lda",
    statusDelivered: "Yetkazib berildi"
  },
  ru: {
    title: "Логистика и Отправки",
    subtitle: "Контроль транспорта и доставок",
    activeTrucks: "Активные машины",
    inTransit: "В пути",
    delivered: "Доставлено",
    newShipment: "Новая отправка",
    colId: "ID",
    colDriver: "Водитель / Машина",
    colRoute: "Маршрут",
    colStatus: "Статус",
    empty: "Отправки не найдены",
    loading: "Загрузка...",
    statusTransit: "В пути",
    statusDelivered: "Доставлено"
  },
  en: {
    title: "Logistics & Shipments",
    subtitle: "Vehicle and delivery tracking",
    activeTrucks: "Active Trucks",
    inTransit: "In Transit",
    delivered: "Delivered",
    newShipment: "New Shipment",
    colId: "ID",
    colDriver: "Driver / Vehicle",
    colRoute: "Route",
    colStatus: "Status",
    empty: "No shipments found",
    loading: "Loading...",
    statusTransit: "In Transit",
    statusDelivered: "Delivered"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function LogisticsPage() {
  const { lang } = useLanguage()
  const t = tBase[lang as LangType] || tBase.uz
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fake data since we don't have the API yet
    setTimeout(() => {
      setShipments([
        { id: 'SHP-1001', driver: 'Ali Valiyev', vehicle: '01 A 123 AA', route: 'Toshkent -> Samarqand', status: 'IN_TRANSIT' },
        { id: 'SHP-1002', driver: 'Rustam Karimov', vehicle: '10 B 456 BB', route: 'Toshkent -> Farg\'ona', status: 'DELIVERED' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  return (
    <div className="space-y-6 animate-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <button className="btn-primary group relative overflow-hidden">
          <Truck size={18} className="relative z-10" />
          <span className="relative z-10">{t.newShipment}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-indigo-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Truck size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.activeTrucks}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">12</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-amber-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Navigation size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.inTransit}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</h3>
        </div>

        <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">{t.delivered}</p>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{shipments.filter(s => s.status === 'DELIVERED').length}</h3>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-dark-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-dark-900/80 text-slate-400 border-b border-dark-700">
                <th className="px-6 py-4 font-semibold">{t.colId}</th>
                <th className="px-6 py-4 font-semibold">{t.colDriver}</th>
                <th className="px-6 py-4 font-semibold">{t.colRoute}</th>
                <th className="px-6 py-4 font-semibold text-right">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.loading}</td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">{t.empty}</td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400">{s.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div>{s.driver}</div>
                      <div className="text-xs text-slate-500">{s.vehicle}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-indigo-400" />
                        {s.route}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                        s.status === 'DELIVERED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {s.status === 'DELIVERED' ? t.statusDelivered : t.statusTransit}
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

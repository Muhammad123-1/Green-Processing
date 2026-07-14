'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  Plus,
  ArrowRight,
  Calendar,
  Activity,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface DashboardStats {
  todayCount: number
  totalCount: number
  acceptedCount: number
  rejectedCount: number
  conditionalCount: number
  productsCount: number
  suppliersCount: number
  recentInspections: Array<{
    id: number
    actNumber: string
    inspectionDate: string
    supplier: { name: string }
    product: { name: string }
    quantity: number
    quantityUnit: string
    status: string
    conclusion: string
  }>
}

const statusColors: Record<string, string> = {
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-danger',
  CONDITIONAL: 'badge-warning',
}

export default function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, lang } = useLanguage()

  const statusLabels: Record<string, string> = {
    ACCEPTED: t('accepted'),
    REJECTED: t('rejected'),
    CONDITIONAL: t('conditional'),
  }

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  const today = new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 animate-enter">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/10" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('welcome')} 👋</h2>
            <p className="text-blue-200 mt-1 text-sm capitalize">{today}</p>
            <p className="text-blue-100 mt-2 font-medium">
              {t('todayIs')}{' '}
              <span className="text-white font-bold text-lg">{stats?.todayCount ?? 0}</span>
              {' '}{t('inspectionsRecorded')}
            </p>
          </div>
          <Link
            href="/inspections/new"
            className="flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-3 rounded-xl
                       hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-white/20"
          >
            <Plus size={18} />
            {t('newInspection')}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList size={22} className="text-blue-400" />}
          label={t('totalInspections')}
          value={stats?.totalCount ?? 0}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={22} className="text-emerald-400" />}
          label={t('accepted')}
          value={stats?.acceptedCount ?? 0}
          color="emerald"
        />
        <StatCard
          icon={<XCircle size={22} className="text-red-400" />}
          label={t('rejected')}
          value={stats?.rejectedCount ?? 0}
          color="red"
        />
        <StatCard
          icon={<AlertTriangle size={22} className="text-amber-400" />}
          label={t('conditional')}
          value={stats?.conditionalCount ?? 0}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <Package size={22} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('products')}</p>
            <p className="text-2xl font-bold text-white">{stats?.productsCount ?? 0}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <Truck size={22} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('suppliers')}</p>
            <p className="text-2xl font-bold text-white">{stats?.suppliersCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t('recentInspections')}</h3>
              <p className="text-xs text-slate-500">{t('recentDesc')}</p>
            </div>
          </div>
          <Link
            href="/inspections"
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {t('seeAll')}
            <ArrowRight size={14} />
          </Link>
        </div>

        {!stats?.recentInspections?.length ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-500">
            <ClipboardList size={40} className="mb-3 opacity-40" />
            <p className="font-medium">{t('noInspections')}</p>
            <p className="text-sm mt-1">{t('createOne')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('actNumber')}</th>
                  <th>{t('date')}</th>
                  <th>{t('suppliers')}</th>
                  <th>{t('products')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInspections.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="font-mono text-blue-400 font-medium">{item.actNumber}</td>
                    <td className="text-slate-300">
                      {new Date(item.inspectionDate).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}
                    </td>
                    <td className="text-slate-200">{item.supplier.name}</td>
                    <td className="text-slate-200">{item.product.name}</td>
                    <td className="text-slate-300">
                      {item.quantity} {item.quantityUnit}
                    </td>
                    <td>
                      <span className={statusColors[item.status] || 'badge-info'}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/inspections/${item.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {t('view')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction
          href="/inspections/new"
          icon={<ClipboardList size={20} />}
          label={t('quickNewAct')}
          description={t('quickNewActDesc')}
          color="blue"
        />
        <QuickAction
          href="/products"
          icon={<Package size={20} />}
          label={t('quickProd')}
          description={t('quickProdDesc')}
          color="purple"
        />
        <QuickAction
          href="/suppliers"
          icon={<Truck size={20} />}
          label={t('quickSupp')}
          description={t('quickSuppDesc')}
          color="cyan"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'emerald' | 'red' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-blue-500/15 border-blue-500/20',
    emerald: 'bg-emerald-500/15 border-emerald-500/20',
    red: 'bg-red-500/15 border-red-500/20',
    amber: 'bg-amber-500/15 border-amber-500/20',
  }

  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
  description,
  color,
}: {
  href: string
  icon: React.ReactNode
  label: string
  description: string
  color: 'blue' | 'purple' | 'cyan'
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/15 border-blue-500/20 group-hover:bg-blue-500/25',
    purple: 'text-purple-400 bg-purple-500/15 border-purple-500/20 group-hover:bg-purple-500/25',
    cyan: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20 group-hover:bg-cyan-500/25',
  }

  return (
    <Link
      href={href}
      className="group card p-5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-all duration-200 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="font-semibold text-white text-sm">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </Link>
  )
}

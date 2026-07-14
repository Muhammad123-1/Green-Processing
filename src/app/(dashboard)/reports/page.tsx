'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  TrendingUp,
  Calendar,
} from 'lucide-react'

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

interface MonthlyStats {
  total: number
  accepted: number
  rejected: number
  conditional: number
  byProduct: { productId: number; name: string; count: number; totalQuantity: number }[]
  bySupplier: { supplierId: number; name: string; count: number }[]
}

interface YearlyStats {
  year: number
  monthlyData: { month: number; total: number; accepted: number; rejected: number; conditional: number }[]
}

export default function ReportsPage() {
  const now = new Date()
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [monthly, setMonthly] = useState<MonthlyStats | null>(null)
  const [yearly, setYearly] = useState<YearlyStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [viewType, year, month])

  async function fetchReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: viewType, year: String(year), month: String(month) })
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (viewType === 'monthly') setMonthly(data)
        else setYearly(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Hisobotlar</h1>
          <p className="section-subtitle">Kiruvchi xomashyo statistikasi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl overflow-hidden border border-dark-600">
            {(['monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setViewType(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors
                           ${viewType === t
                             ? 'bg-blue-600 text-white'
                             : 'bg-dark-800 text-slate-400 hover:text-slate-200'}`}
              >
                {t === 'monthly' ? 'Oylik' : 'Yillik'}
              </button>
            ))}
          </div>

          <select
            className="input-field w-28"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {viewType === 'monthly' && (
            <select
              className="input-field w-36"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {MONTHS_UZ.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
      ) : viewType === 'monthly' && monthly ? (
        <MonthlyReport data={monthly} year={year} month={month} />
      ) : viewType === 'yearly' && yearly ? (
        <YearlyReport data={yearly} />
      ) : null}
    </div>
  )
}

function MonthlyReport({ data, year, month }: { data: MonthlyStats; year: number; month: number }) {
  const acceptRate = data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-blue-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white">
            {MONTHS_UZ[month - 1]} {year} — Hisobot
          </h3>
        </div>
        <p className="text-slate-400 text-sm">Jami {data.total} ta kiruvchi xomashyo akti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={<BarChart3 />} label="Jami aktlar" value={data.total} color="blue" />
        <StatBox icon={<CheckCircle />} label="Qabul" value={data.accepted} color="emerald" />
        <StatBox icon={<XCircle />} label="Rad etildi" value={data.rejected} color="red" />
        <StatBox icon={<AlertTriangle />} label="Shartli" value={data.conditional} color="amber" />
      </div>

      {/* Accept rate bar */}
      {data.total > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Qabul qilish darajasi</span>
            <span className="text-lg font-bold text-emerald-400">{acceptRate}%</span>
          </div>
          <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
              style={{ width: `${acceptRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Product */}
        {data.byProduct.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-purple-400" />
              <h3 className="font-semibold text-white text-sm">Mahsulot bo'yicha</h3>
            </div>
            <div className="space-y-3">
              {data.byProduct.map((p) => {
                const pct = data.total > 0 ? Math.round((p.count / data.total) * 100) : 0
                return (
                  <div key={p.productId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 truncate flex-1">{p.name}</span>
                      <span className="text-slate-400 ml-2">{p.count} ta</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-purple-500/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* By Supplier */}
        {data.bySupplier.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={16} className="text-cyan-400" />
              <h3 className="font-semibold text-white text-sm">Ta'minotchi bo'yicha</h3>
            </div>
            <div className="space-y-3">
              {data.bySupplier.map((s) => {
                const pct = data.total > 0 ? Math.round((s.count / data.total) * 100) : 0
                return (
                  <div key={s.supplierId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 truncate flex-1">{s.name}</span>
                      <span className="text-slate-400 ml-2">{s.count} ta</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-cyan-500/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function YearlyReport({ data }: { data: YearlyStats }) {
  const max = Math.max(...data.monthlyData.map((m) => m.total), 1)

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">{data.year} — Oylik statistika</h3>
        </div>

        <div className="grid grid-cols-12 gap-1 items-end h-40">
          {data.monthlyData.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-1">
              <div className="flex flex-col-reverse gap-0.5 w-full" style={{ height: '120px' }}>
                {m.total > 0 ? (
                  <>
                    <div
                      className="w-full rounded-sm bg-emerald-500/70"
                      style={{ height: `${(m.accepted / max) * 100}%` }}
                      title={`Qabul: ${m.accepted}`}
                    />
                    {m.rejected > 0 && (
                      <div
                        className="w-full rounded-sm bg-red-500/70"
                        style={{ height: `${(m.rejected / max) * 100}%` }}
                        title={`Rad: ${m.rejected}`}
                      />
                    )}
                    {m.conditional > 0 && (
                      <div
                        className="w-full rounded-sm bg-amber-500/70"
                        style={{ height: `${(m.conditional / max) * 100}%` }}
                        title={`Shartli: ${m.conditional}`}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full rounded-sm bg-dark-700 h-2" />
                )}
              </div>
              <span className="text-[9px] text-slate-500">
                {MONTHS_UZ[m.month - 1].slice(0, 3)}
              </span>
              {m.total > 0 && (
                <span className="text-[9px] text-slate-400 font-medium">{m.total}</span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-700">
          {[
            { color: 'bg-emerald-500/70', label: 'Qabul' },
            { color: 'bg-red-500/70', label: 'Rad' },
            { color: 'bg-amber-500/70', label: 'Shartli' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${item.color}`} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  return (
    <div className={`card p-5 border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

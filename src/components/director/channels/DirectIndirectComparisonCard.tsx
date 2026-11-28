'use client'

import React from 'react'
import {
  GitFork,
  ArrowRight,
  TrendingUp,
  Percent,
  Truck,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  directVsIndirect: {
    DIRECT: {
      distributionType: 'DIRECT'
      nameUz: string
      nameRu: string
      nameEn: string
      netRevenue: number
      revenueSharePct: number
      grossProfit: number
      grossMarginPct: number
      logisticsCost: number
      contributionAfterLogistics: number
      contributionMarginPct: number
      volumeKg: number
      volumeDona: number
      activeCustomersCount: number
      outstandingReceivables: number
      overdueReceivables: number
      color: string
    }
    INDIRECT: {
      distributionType: 'INDIRECT'
      nameUz: string
      nameRu: string
      nameEn: string
      netRevenue: number
      revenueSharePct: number
      grossProfit: number
      grossMarginPct: number
      logisticsCost: number
      contributionAfterLogistics: number
      contributionMarginPct: number
      volumeKg: number
      volumeDona: number
      activeCustomersCount: number
      outstandingReceivables: number
      overdueReceivables: number
      color: string
    }
  }
}

export default function DirectIndirectComparisonCard({ directVsIndirect }: Props) {
  const { formatDual } = useLanguage()

  const direct = directVsIndirect.DIRECT
  const indirect = directVsIndirect.INDIRECT

  const formatUzs = (val: number) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)} mln`
    }
    return val.toLocaleString('uz-UZ')
  }

  const formatKg = (val: number) => {
    return `${Math.round(val).toLocaleString('uz-UZ')} kg`
  }

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <GitFork size={20} />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {formatDual(
                "To'g'ridan-to'g'ri (Direct) va Vositali (Indirect) Taqsimot Solishtirmasi",
                "Сравнение прямой и непрямой дистрибуции (Direct vs Indirect)",
                "Direct vs Indirect Distribution Comparison"
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {formatDual(
                "Asosiy B2B iste'molchilar va qayta sotuvchi sheriklar faoliyati tahlili",
                "Анализ ключевых B2B потребителей и каналов перепродажи",
                "Analysis of end-user B2B customers vs reseller partner channels"
              )}
            </p>
          </div>
        </div>

        {/* Visual Ratio Bar */}
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-emerald-600 dark:text-emerald-400">Direct: {direct.revenueSharePct.toFixed(0)}%</span>
            <span className="text-blue-600 dark:text-blue-400">Indirect: {indirect.revenueSharePct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-dark-800 overflow-hidden flex">
            <div
              style={{ width: `${direct.revenueSharePct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${indirect.revenueSharePct}%` }}
              className="bg-blue-500 h-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Direct Distribution Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">
                {formatDual("DIRECT DISTRIBUTION", "ПРЯМАЯ ДИСТРИБУЦИЯ", "DIRECT DISTRIBUTION")}
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              {direct.revenueSharePct.toFixed(1)}% ulush
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-1">
            {formatDual(
              "Restoranlar, HoReCa, mehmonxonalar va korporativ ob'ektlar (O'z ehtiyoji uchun)",
              "HoReCa, рестораны, отели и корпоративные объекты (Собственное потребление)",
              "Restaurants, HoReCa, hotels, and corporate end customers"
            )}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Sof Tushum", "Выручка", "Revenue")}</span>
              <strong className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{formatUzs(direct.netRevenue)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Yalpi Marja", "Маржа", "Margin")}</span>
              <strong className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{direct.grossMarginPct.toFixed(1)}%</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Logistika Xarajati", "Логистика", "Logistics")}</span>
              <strong className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">{formatUzs(direct.logisticsCost)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Logistika Keyin Hissa", "Марж. доход", "Contribution")}</span>
              <strong className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">{formatUzs(direct.contributionAfterLogistics)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Savdo Hajmi", "Объем", "Volume")}</span>
              <strong className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{formatKg(direct.volumeKg)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Muddati O'tgan Qarz", "Просрочка", "Overdue")}</span>
              <strong className={`text-sm font-black font-mono ${direct.overdueReceivables > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatUzs(direct.overdueReceivables)}
              </strong>
            </div>
          </div>
        </div>

        {/* Indirect Distribution Card */}
        <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h4 className="font-black text-sm text-blue-950 dark:text-blue-200">
                {formatDual("INDIRECT DISTRIBUTION", "НЕПРЯМАЯ ДИСТРИБУЦИЯ", "INDIRECT DISTRIBUTION")}
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              {indirect.revenueSharePct.toFixed(1)}% ulush
            </span>
          </div>
          <p className="text-[11px] text-blue-800 dark:text-blue-300/80 mt-1">
            {formatDual(
              "Supermarketlar, chakana do'konlar, distribyutorlar, ulgurji bozorlar va eksport (Qayta sotish)",
              "Супермаркеты, розница, дистрибьюторы, оптовики и экспортные партнеры (Перепродажа)",
              "Supermarkets, retail stores, distributors, wholesalers, and export partners"
            )}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Sof Tushum", "Выручка", "Revenue")}</span>
              <strong className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">{formatUzs(indirect.netRevenue)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Yalpi Marja", "Маржа", "Margin")}</span>
              <strong className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{indirect.grossMarginPct.toFixed(1)}%</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Logistika Xarajati", "Логистика", "Logistics")}</span>
              <strong className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">{formatUzs(indirect.logisticsCost)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Logistika Keyin Hissa", "Марж. доход", "Contribution")}</span>
              <strong className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">{formatUzs(indirect.contributionAfterLogistics)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Savdo Hajmi", "Объем", "Volume")}</span>
              <strong className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{formatKg(indirect.volumeKg)}</strong>
            </div>

            <div className="p-2.5 bg-white dark:bg-dark-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-slate-400 block text-[10px] font-bold">{formatDual("Muddati O'tgan Qarz", "Просрочка", "Overdue")}</span>
              <strong className={`text-sm font-black font-mono ${indirect.overdueReceivables > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                {formatUzs(indirect.overdueReceivables)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Truck,
  Layers,
  AlertTriangle,
  Scale,
  Users,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Wallet
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  summary: {
    grandNetRevenue: number
    grandGrossProfit: number
    grandGrossMarginPct: number
    grandCogs: number
    grandLogistics: number
    grandContribution: number
    grandContributionMarginPct: number
    grandOutstanding: number
    grandOverdue: number
    grandVolumeKg: number
    grandVolumeDona: number
    totalActiveCustomers: number
    totalOrdersCount: number
    totalReturnsAmount: number
    overallReturnRatePct: number
  }
  directVsIndirect: {
    DIRECT: {
      netRevenue: number
      revenueSharePct: number
      grossMarginPct: number
      overdueReceivables: number
    }
    INDIRECT: {
      netRevenue: number
      revenueSharePct: number
      grossMarginPct: number
      overdueReceivables: number
    }
  }
}

export default function ExecutiveKpiCards({ summary, directVsIndirect }: Props) {
  const { formatDual } = useLanguage()

  const formatUzs = (val: number) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)} mlrd`
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)} mln`
    }
    return val.toLocaleString('uz-UZ')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Jami Sof Tushum (Net Revenue) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Sof Tushum", "Чистая Выручка", "Net Revenue")}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
        </div>
        <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
          {formatUzs(summary.grandNetRevenue)} <span className="text-xs font-normal text-slate-400">so'm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatDual("Chegirma & Qaytmadan so'ng", "После скидок и возвратов", "After discounts & returns")}</span>
        </div>
      </div>

      {/* 2. Direct vs Indirect nisbati */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Taqsimot Ulushi", "Доли каналов", "Channel Split")}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <PieChart size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {directVsIndirect.DIRECT.revenueSharePct.toFixed(0)}%
          </span>
          <span className="text-xs text-slate-400 font-bold">/</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {directVsIndirect.INDIRECT.revenueSharePct.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">{formatDual("Direct (To'g'ridan)", "Direct (Прямой)", "Direct")}</span>
          <span className="text-blue-600 dark:text-blue-400">{formatDual("Indirect (Vositali)", "Indirect (Непрямой)", "Indirect")}</span>
        </div>
      </div>

      {/* 3. Yalpi Marja (Gross Margin %) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Yalpi Marja", "Валовая Маржа", "Gross Margin")}</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Percent size={16} />
          </div>
        </div>
        <div className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
          {summary.grandGrossMarginPct.toFixed(1)}%
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatDual("Yalpi foyda:", "Вал. прибыль:", "Gross profit:")}</span>
          <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatUzs(summary.grandGrossProfit)}</strong>
        </div>
      </div>

      {/* 4. Logistika Xarajatlari */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Logistika Xarajati", "Расходы логистики", "Logistics Cost")}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Truck size={16} />
          </div>
        </div>
        <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
          {formatUzs(summary.grandLogistics)} <span className="text-xs font-normal text-slate-400">so'm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatDual("Tushumdagi ulushi:", "Доля от выручки:", "Share of revenue:")}</span>
          <strong className="text-amber-700 dark:text-amber-300 font-mono">
            {summary.grandNetRevenue > 0 ? ((summary.grandLogistics / summary.grandNetRevenue) * 100).toFixed(1) : '0'}%
          </strong>
        </div>
      </div>

      {/* 5. Logistikadan Keyingi Hissa (Contribution) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Logistika Keyin Hissa", "Маржинальный доход", "Contribution Margin")}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
          {formatUzs(summary.grandContribution)} <span className="text-xs font-normal text-slate-400">so'm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatDual("Hissa marjasi:", "Маржа покрытия:", "Contribution rate:")}</span>
          <strong className="text-purple-700 dark:text-purple-300 font-mono">{summary.grandContributionMarginPct.toFixed(1)}%</strong>
        </div>
      </div>

      {/* 6. Muddati o'tgan qarzdorlik (Overdue Receivables) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
          <span>{formatDual("Muddati O'tgan Qarz", "Просроченная ДЗ", "Overdue Debt")}</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            summary.grandOverdue > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
          }`}>
            <Clock size={16} />
          </div>
        </div>
        <div className={`mt-2 text-xl font-black font-mono ${
          summary.grandOverdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
        }`}>
          {formatUzs(summary.grandOverdue)} <span className="text-xs font-normal text-slate-400">so'm</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatDual("Jami qarz:", "Общая ДЗ:", "Total AR:")}</span>
          <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatUzs(summary.grandOutstanding)}</strong>
        </div>
      </div>
    </div>
  )
}

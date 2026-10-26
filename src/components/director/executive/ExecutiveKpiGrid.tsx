'use client'

import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Truck,
  PackageCheck,
  AlertOctagon,
  Recycle,
  Warehouse,
  Minus,
} from 'lucide-react'

interface KpiData {
  totalRawMaterialInKg: number
  totalFinishedGoodsKg: number
  overallYieldPercent: number | null
  actualDefectKg: number
  actualDefectPercent: number | null
  naturalTechWasteKg: number
  naturalTechWastePercent: number | null
  currentWarehouseStockKg: number
  previousPeriodDiff?: {
    inflowDiffPercent: number | null
    outputDiffPercent: number | null
    defectDiffPercent: number | null
  } | null
}

interface Props {
  kpis: KpiData | null
  loading: boolean
  lang: string
}

export default function ExecutiveKpiGrid({ kpis, loading, lang }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl bg-slate-100 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-750 p-4"
          />
        ))}
      </div>
    )
  }

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} tn`
    }
    return `${kg.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kg`
  }

  const renderDelta = (delta: number | null | undefined, invertGoodBad = false) => {
    if (delta === null || delta === undefined) {
      return (
        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
          <Minus size={10} /> {lang === 'ru' ? 'Предыдущих данных нет' : "Taqqoslash uchun ma'lumot yo'q"}
        </span>
      )
    }

    const isPositive = delta > 0
    const isGood = invertGoodBad ? !isPositive : isPositive

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
          isGood
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
        }`}
      >
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? `+${delta}%` : `${delta}%`}
        <span className="text-[9px] font-normal opacity-75">
          {lang === 'ru' ? 'к пред. пер.' : "o'tgan davrga nisbatan"}
        </span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Xomashyo Kirimi */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Приход сырья' : 'Xomashyo kirimi'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Truck size={17} />
          </div>
        </div>
        <div className="my-2">
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatWeight(kpis?.totalRawMaterialInKg ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {(kpis?.totalRawMaterialInKg ?? 0).toLocaleString()} kg
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-dark-800">
          {renderDelta(kpis?.previousPeriodDiff?.inflowDiffPercent)}
        </div>
      </div>

      {/* 2. Tayyor Mahsulot Chiqimi (Yield) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Выпуск ГП (Выход)' : 'Tayyor mahsulot (Chiqim)'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PackageCheck size={17} />
          </div>
        </div>
        <div className="my-2">
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatWeight(kpis?.totalFinishedGoodsKg ?? 0)}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Yield: {kpis?.overallYieldPercent !== null ? `${kpis?.overallYieldPercent}%` : '—'}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-dark-800">
          {renderDelta(kpis?.previousPeriodDiff?.outputDiffPercent)}
        </div>
      </div>

      {/* 3. Haqiqiy Brak (Actual Defect) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {lang === 'ru' ? 'Фактический брак' : 'Haqiqiy brak'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertOctagon size={17} />
          </div>
        </div>
        <div className="my-2">
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatWeight(kpis?.actualDefectKg ?? 0)}
          </div>
          <p className="text-[11px] font-extrabold text-rose-500 dark:text-rose-400 mt-0.5">
            {kpis?.actualDefectPercent !== null ? `${kpis?.actualDefectPercent}% xomashyodan` : '0 kg'}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-dark-800">
          {renderDelta(kpis?.previousPeriodDiff?.defectDiffPercent, true)}
        </div>
      </div>

      {/* 4. Texnologik Chiqindi (Tech Waste) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Тех. отходы' : 'Texnologik chiqindi'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Recycle size={17} />
          </div>
        </div>
        <div className="my-2">
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatWeight(kpis?.naturalTechWasteKg ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {kpis?.naturalTechWastePercent !== null ? `${kpis?.naturalTechWastePercent}% me'yoriy chiqim` : '—'}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-dark-800 text-[10px] text-slate-400">
          {lang === 'ru' ? 'Естественная убыль/очистка' : "Po'choq va tozalash chiqindisi"}
        </div>
      </div>

      {/* 5. Joriy Ombor Qoldig'i */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Текущий остаток' : 'Joriy ombor qoldig‘i'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Warehouse size={17} />
          </div>
        </div>
        <div className="my-2">
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatWeight(kpis?.currentWarehouseStockKg ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {(kpis?.currentWarehouseStockKg ?? 0).toLocaleString()} kg
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-dark-800 text-[10px] text-slate-400 font-medium">
          {lang === 'ru' ? 'Фактическое наличие на складе' : "Ayni paytdagi mavjud zaxira"}
        </div>
      </div>
    </div>
  )
}

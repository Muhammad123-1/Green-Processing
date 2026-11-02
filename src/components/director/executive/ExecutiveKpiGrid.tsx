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
  ShieldCheck,
} from 'lucide-react'

interface KpiData {
  openingUsableStockKg?: number
  totalRawMaterialInKg: number
  rejectedIncomingKg?: number
  totalAvailableRawMaterialsKg?: number
  totalConsumedRawKg?: number
  totalFinishedGoodsKg: number
  stockRelativeOutputPercent?: number | null
  productionYieldPercent?: number | null
  overallYieldPercent: number | null
  actualDefectKg: number
  actualDefectPercent: number | null
  naturalTechWasteKg: number
  naturalTechWastePercent: number | null
  currentWarehouseStockKg: number
  inventoryStatusSummary?: {
    sufficientCount: number
    lowCount: number
    outOfStockCount: number
    excessCount: number
  }
  finalQcSummary?: {
    checkedKg: number
    approvedKg: number
    rejectedKg: number
  }
  fifoExceptionsCount?: number
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
            className="h-36 rounded-3xl bg-slate-100 dark:bg-dark-800/80 border border-slate-200 dark:border-dark-750 p-4"
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

  const yieldPct = kpis?.productionYieldPercent ?? kpis?.overallYieldPercent ?? null
  const stockRelPct = kpis?.stockRelativeOutputPercent ?? null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Qabul qilingan xomashyo */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {lang === 'ru' ? '1. Принятое сырьё' : '1. Qabul qilingan xomashyo'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck size={17} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatWeight(kpis?.totalRawMaterialInKg ?? 0)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ru' ? 'С прошлым остатком:' : "Boshlang'ich qoldiq bilan:"}{' '}
              <b className="text-slate-700 dark:text-slate-200">
                {((kpis?.totalAvailableRawMaterialsKg ?? kpis?.totalRawMaterialInKg) || 0).toLocaleString()} kg
              </b>
            </p>
            {(kpis?.rejectedIncomingKg || 0) > 0 && (
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 bg-rose-50 dark:bg-rose-500/10 p-1 rounded-md">
                {lang === 'ru' ? '⚠️ Отклонено (брак поставщика):' : '⚠️ Rad etilgan (sifatsiz xomashyo):'}{' '}
                {kpis?.rejectedIncomingKg?.toLocaleString()} kg
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Sababi bloki (Direktor tushunadigan tilda) */}
          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700/60 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-300 block mb-0.5">
              {lang === 'ru' ? 'Причина и статус:' : 'Nima uchun va sababi:'}
            </b>
            {lang === 'ru'
              ? 'Поставщики доставили сырье по договорам, качество проверено лабораторией.'
              : "Ta'minotchilardan kelgan va sifat nazorati tekshiruvidan o'tib omborga qabul qilingan toza xomashyo."}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-800">
            {renderDelta(kpis?.previousPeriodDiff?.inflowDiffPercent)}
          </div>
        </div>
      </div>

      {/* 2. Ishlab chiqarilgan tayyor mahsulot */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {lang === 'ru' ? '2. Готовая продукция' : '2. Tayyor mahsulot'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PackageCheck size={17} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatWeight(kpis?.totalFinishedGoodsKg ?? 0)}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg w-fit">
                {lang === 'ru' ? 'Выход из сырья:' : 'Xomashyodan chiqish:'}{' '}
                <b>{yieldPct !== null ? `${yieldPct}%` : '—'}</b>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {lang === 'ru'
                  ? `Из 100 кг сырья получено ${yieldPct ?? 0} кг готовой продукции`
                  : `100 kg xomashyodan ${yieldPct ?? 0} kg tayyor mahsulot olindi`}
              </span>
            </div>
          </div>
        </div>

        <div>
          {/* Sababi bloki */}
          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700/60 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-300 block mb-0.5">
              {lang === 'ru' ? 'Причина:' : 'Ishlab chiqarish sababi:'}
            </b>
            {lang === 'ru'
              ? 'Цех переработал поступившее сырье в готовую упакованную продукцию по норме.'
              : "Sex xomashyoni tozalab, buyurtmalar asosida tayyor qadoqlangan mahsulot holatiga keltirdi."}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-800">
            {renderDelta(kpis?.previousPeriodDiff?.outputDiffPercent)}
          </div>
        </div>
      </div>

      {/* 3. Haqiqiy Brak (Zarar) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {lang === 'ru' ? '3. Фактический брак' : '3. Haqiqiy brak (zarar)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon size={17} />
            </div>
          </div>
          <div className="my-2">
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${
              (kpis?.actualDefectKg ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {formatWeight(kpis?.actualDefectKg ?? 0)}
            </div>
            <p className="text-[11px] font-bold mt-1">
              {(kpis?.actualDefectKg ?? 0) > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                  {kpis?.actualDefectPercent != null ? `${kpis.actualDefectPercent}% sarfdan yo'qotilgan` : "Brak qayd etilgan"}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {lang === 'ru' ? 'Брак отсутствует (0%)' : "Brak yo'q (0%)"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div>
          {/* Sababi bloki */}
          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700/60 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-300 block mb-0.5">
              {lang === 'ru' ? 'Причина брака:' : 'Brak sababi:'}
            </b>
            {(kpis?.actualDefectKg ?? 0) > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {lang === 'ru'
                  ? 'Сырье испорчено/нарушен режим. Детали и виновные указаны во 2-й вкладке.'
                  : "Chirigan yoki texnologik rejim buzilgan. Tafsiloti va javobgar shaxslar 2-bo'limda."}
              </span>
            ) : (
              lang === 'ru'
                ? 'Отлично! В цехах и на складе испорченного сырья не зафиксировано.'
                : "Ajoyib! Sexda va omborxonada yaroqsiz bo'lib buzilgan mahsulot qayd etilmadi."
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-800">
            {renderDelta(kpis?.previousPeriodDiff?.defectDiffPercent, true)}
          </div>
        </div>
      </div>

      {/* 4. Tabiiy Texnologik Chiqindi (Brak emas!) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {lang === 'ru' ? '4. Тех. отходы (не брак)' : "4. Tozalash chiqindisi"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Recycle size={17} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatWeight(kpis?.naturalTechWasteKg ?? 0)}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              {kpis?.naturalTechWastePercent != null ? `${kpis.naturalTechWastePercent}% me'yoriy tozalash` : "Me'yor bo'yicha"}
            </p>
          </div>
        </div>

        <div>
          {/* Sababi bloki */}
          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700/60 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-300 block mb-0.5">
              {lang === 'ru' ? 'Почему это не брак:' : 'Nima uchun bu brak emas?'}
            </b>
            {lang === 'ru'
              ? 'Естественная убыль: очистка кожуры, обрезка корней и мойка овощей по стандарту.'
              : "Bu tabiiy yo'qotish: sabzavotlar po'chog'ini archish, ildizini kesish va yuvish me'yori."}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-800 text-[10px] text-slate-400">
            {lang === 'ru' ? 'Технологический стандарт соблюден' : "Texnologik me'yorga mos"}
          </div>
        </div>
      </div>

      {/* 5. Omborxonadagi Joriy Xomashyo Qoldig'i */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {lang === 'ru' ? '5. Остаток на складе' : '5. Ombor zaxirasi'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Warehouse size={17} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatWeight(kpis?.currentWarehouseStockKg ?? 0)}
            </div>
            {kpis?.inventoryStatusSummary && (
              <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" title="Yetarli zaxira">
                  Yetarli: {kpis.inventoryStatusSummary.sufficientCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" title="Zaxira kamaygan">
                  Kam: {kpis.inventoryStatusSummary.lowCount}
                </span>
                {kpis.inventoryStatusSummary.excessCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300" title="Me'yordan ko'p">
                    Ko'p: {kpis.inventoryStatusSummary.excessCount}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" title="Butunlay tugagan">
                  Tugagan: {kpis.inventoryStatusSummary.outOfStockCount}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Sababi bloki */}
          <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700/60 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-300 block mb-0.5">
              {lang === 'ru' ? 'Текущее состояние:' : 'Direktorga xulosa:'}
            </b>
            {(kpis?.inventoryStatusSummary?.outOfStockCount || 0) > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {lang === 'ru'
                  ? `Срочно: ${kpis?.inventoryStatusSummary?.outOfStockCount} товаров закончились, требуется закупка!`
                  : `Diqqat: ${kpis?.inventoryStatusSummary?.outOfStockCount} ta xomashyo tugagan, ta'minotga xarid buyurtmasi kerak!`}
              </span>
            ) : (
              lang === 'ru'
                ? 'Склад обеспечен сырьем для бесперебойной работы цехов.'
                : "Sexlar to'xtovsiz ishlashi uchun omborda yetarli xomashyo mavjud."
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              {lang === 'ru' ? 'Выходной контроль:' : 'Yakuniy QC:'}
            </span>
            <b>{formatWeight(kpis?.finalQcSummary?.approvedKg ?? 0)}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

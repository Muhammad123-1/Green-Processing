'use client'

import React from 'react'
import {
  X,
  Truck,
  Factory,
  Warehouse,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Clock,
} from 'lucide-react'
import { ProductBalanceItem } from './ProductBalanceTable'

interface Props {
  product: ProductBalanceItem | null
  onClose: () => void
  onViewJournal: (productName: string, stage?: string, wastageType?: string) => void
  lang: string
}

export default function ProductLossDrawer({
  product,
  onClose,
  onViewJournal,
  lang,
}: Props) {
  if (!product) return null

  const { incoming, processing, storage, finalQc } = product.stages

  const topIncomingReasons = Object.entries(incoming.reasons).sort((a, b) => b[1] - a[1])
  const topIncomingSuppliers = Object.entries(incoming.suppliers).sort((a, b) => b[1] - a[1])
  const topProcessingReasons = Object.entries(processing.reasons).sort((a, b) => b[1] - a[1])
  const topStorageReasons = Object.entries(storage.reasons).sort((a, b) => b[1] - a[1])

  const yieldPct = product.productionYieldPercent ?? product.yieldPercent

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-enter">
      <div className="w-full sm:max-w-2xl h-full sm:h-[94vh] bg-white dark:bg-dark-900 sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-dark-850/60">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Layer 2: {lang === 'ru' ? 'Полный жизненный цикл и нормативы запасов' : "Mahsulot hayotiy sikli (4 bosqich) va zaxira me'yorlari"}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>{product.productName}</span>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">
                {product.unit}
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-5 p-3.5 bg-slate-100/60 dark:bg-dark-800/40 border-b border-slate-200 dark:border-dark-750 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Принято' : 'Qabul kirim'}</span>
            <b className="font-mono text-slate-900 dark:text-white">{product.inflowKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Расход в цех' : 'Sexga sarf'}</span>
            <b className="font-mono text-blue-600 dark:text-blue-400">{(product.consumedKg ?? 0).toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Выпуск ГП' : 'Tayyor chiqim'}</span>
            <b className="font-mono text-emerald-600 dark:text-emerald-400">{product.outputKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Факт брак' : 'Haqiqiy brak'}</span>
            <b className="font-mono text-rose-600 dark:text-rose-400">{product.actualDefectKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Остаток' : 'Joriy qoldiq'}</span>
            <b className="font-mono text-indigo-600 dark:text-indigo-400">{product.currentStockKg.toLocaleString()} kg</b>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Requirement 3, 4 & 5: Inventory Normalization, Stock Coverage & Production Yield Formulas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card A: Inventory Normalization & Coverage */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wide text-[11px]">
                <Clock size={14} />
                <span>{lang === 'ru' ? 'Нормативы хранения и покрытие' : "Saqlash me'yori va qoplash muddati"}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Макс. срок хранения:' : 'Maks. xavfsiz saqlash:'}</span>
                  <b className="text-slate-900 dark:text-white">
                    {product.approvedMaxStorageDays ? `${product.approvedMaxStorageDays} kun` : 'Kiritilmagan'}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Ср. дневной расход (Formula A):' : "O'rtacha kunlik sarf (Formula A):"}</span>
                  <b className="font-mono text-slate-900 dark:text-white">
                    {product.avgDailyConsumptionKg !== null && product.avgDailyConsumptionKg !== undefined
                      ? `${product.avgDailyConsumptionKg.toLocaleString()} kg/kun`
                      : '—'}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Ср. недельный расход:' : "O'rtacha haftalik sarf:"}</span>
                  <b className="font-mono text-slate-900 dark:text-white">
                    {product.avgWeeklyConsumptionKg !== null && product.avgWeeklyConsumptionKg !== undefined
                      ? `${product.avgWeeklyConsumptionKg.toLocaleString()} kg/hafta`
                      : '—'}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Макс. реком. запас (Formula B):' : 'Maks. tavsiya zaxira (Formula B):'}</span>
                  <b className="font-mono text-indigo-700 dark:text-indigo-300">
                    {product.maxRecommendedInventoryKg !== null && product.maxRecommendedInventoryKg !== undefined
                      ? `${product.maxRecommendedInventoryKg.toLocaleString()} kg`
                      : '—'}
                  </b>
                </div>
                <div className="flex justify-between pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {lang === 'ru' ? 'Покрытие запаса (Formulas C/D):' : 'Zaxira qoplash muddati (C/D):'}
                  </span>
                  <b className="font-mono text-emerald-700 dark:text-emerald-300">
                    {product.stockCoverageDays !== null && product.stockCoverageDays !== undefined
                      ? `${product.stockCoverageDays} kun (${product.stockCoverageWeeks ?? '—'} hafta)`
                      : 'Hisoblab bo‘lmaydi (sarf = 0)'}
                  </b>
                </div>
              </div>
            </div>

            {/* Card B: Production Yield vs Stock-Relative Output (Requirement 5) */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wide text-[11px]">
                <Calculator size={14} />
                <span>{lang === 'ru' ? 'Формулы выхода продукции' : 'Ishlab chiqarish foizlari (Req 5)'}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Начальный остаток:' : "Boshlang'ich qoldiq:"}</span>
                  <b className="font-mono text-slate-900 dark:text-white">{(product.openingStockKg ?? 0).toLocaleString()} kg</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Всего доступно сырья:' : 'Jami mavjud xomashyo:'}</span>
                  <b className="font-mono text-slate-900 dark:text-white">
                    {(product.totalAvailableRawKg ?? product.inflowKg).toLocaleString()} kg
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ru' ? 'Выход к общему запасу:' : 'Jami zaxiraga nisbatan chiqish:'}</span>
                  <b className="font-mono text-indigo-700 dark:text-indigo-300">
                    {product.stockRelativeOutputPercent !== null && product.stockRelativeOutputPercent !== undefined
                      ? `${product.stockRelativeOutputPercent}%`
                      : '—'}
                  </b>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {lang === 'ru' ? 'Выход из расхода (Production Yield):' : 'Haqiqiy sarfdan chiqish (Yield):'}
                  </span>
                  <b className="font-mono text-emerald-700 dark:text-emerald-300">
                    {yieldPct !== null && yieldPct !== undefined ? `${yieldPct}%` : '—'}
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* Stage A: INCOMING */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Truck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Bosqich A (INCOMING) — {lang === 'ru' ? 'Входной контроль сырья' : 'Kiruvchi xomashyo sifat nazorati'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru' ? 'Отбраковка при приёмке (не поступает на склад)' : "Qabulda rad etilgan brak (foydalanish zaxirasiga kirmaydi)"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                  {incoming.defectKg.toLocaleString()} kg
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {product.inflowKg + incoming.defectKg > 0
                    ? `${((incoming.defectKg / (product.inflowKg + incoming.defectKg)) * 100).toFixed(2)}%`
                    : '—'}
                </span>
              </div>
            </div>

            {topIncomingSuppliers.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Поставщики с наибольшим браком:' : "Brak aniqlangan ta'minotchilar:"}
                </span>
                <div className="space-y-1">
                  {topIncomingSuppliers.slice(0, 3).map(([supName, kg]) => (
                    <div key={supName} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{supName}</span>
                      <b className="font-mono text-rose-600">{kg.toLocaleString()} kg</b>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topIncomingReasons.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Причины отбраковки:' : 'Rad etish / brak sabablari:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topIncomingReasons.slice(0, 4).map(([reason, kg]) => (
                    <span
                      key={reason}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      {reason}: <b className="text-rose-600 font-mono">{kg.toLocaleString()} kg</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                onClose()
                onViewJournal(product.productName, 'INCOMING', 'ACTUAL_DEFECT')
              }}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline"
            >
              Qabul rad etish aktlarini ko‘rish →
            </button>
          </div>

          {/* Stage B: PROCESSING */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Factory size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Bosqich B (PROCESSING) — {lang === 'ru' ? 'Переработка и производство' : 'Saralash, yuvish, kesish va ishlab chiqarish'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru'
                      ? 'Технологические отходы отдельно от фактического брака'
                      : "Tabiiy texnologik chiqindi haqiqiy brakdan alohida hisoblanadi"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-600 block">
                  Tabiiy tex. chiqindi: {processing.techWasteKg.toLocaleString()} kg
                </span>
                <span className="text-xs font-black text-rose-600 block mt-0.5">
                  Haqiqiy sex braki: {processing.defectKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            {topProcessingReasons.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Причины в цехе:' : 'Qayd etilgan sabablar:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topProcessingReasons.map(([reason, kg]) => (
                    <span
                      key={reason}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      {reason}: <b className="text-amber-600 font-mono">{kg.toLocaleString()} kg</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                onClose()
                onViewJournal(product.productName, 'PROCESSING')
              }}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              Ishlov berish aktlarini ko‘rish →
            </button>
          </div>

          {/* Stage C: STORAGE */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Warehouse size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Bosqich C (STORAGE) — {lang === 'ru' ? 'Хранение на складе' : 'Omborda saqlash sifat nazorati'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru'
                      ? 'Порча при хранении, нарушение температуры или истечение срока'
                      : 'Saqlash muddati o‘tishi, harorat buzilishi yoki ombordagi buzilishlar'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">
                  {storage.defectKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            {topStorageReasons.length > 0 ? (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Факторы хранения:' : 'Saqlashdagi sabablar:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topStorageReasons.map(([reason, kg]) => (
                    <span
                      key={reason}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      {reason}: <b className="text-indigo-600 font-mono">{kg.toLocaleString()} kg</b>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                {lang === 'ru' ? 'Потерь на складе не зафиксировано' : 'Omborda buzilish qayd etilmagan'}
              </div>
            )}
            <button
              onClick={() => {
                onClose()
                onViewJournal(product.productName, 'STORAGE', 'ACTUAL_DEFECT')
              }}
              className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
            >
              Ombor aktlarini ko‘rish →
            </button>
          </div>

          {/* Stage D: FINAL QUALITY CONTROL BEFORE DISPATCH */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Bosqich D (FINAL QC) — {lang === 'ru' ? 'Финальный контроль перед отгрузкой' : 'Mijozga jo‘natishdan oldingi yakuniy sifat nazorati'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru'
                      ? 'Проверка готовой продукции перед отправкой клиенту'
                      : 'Tayyor mahsulotni mijozga yuklashdan oldingi tekshiruv va ruxsat'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                  Tasdiqlangan: {(finalQc?.approvedKg ?? product.outputKg).toLocaleString()} kg
                </span>
                {(finalQc?.rejectedKg || 0) > 0 && (
                  <span className="font-bold text-rose-600 block">
                    Jo‘natishdan qaytarilgan: {finalQc?.rejectedKg.toLocaleString()} kg
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Action */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-750 bg-slate-50/80 dark:bg-dark-850/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Перейти к первичным актам и доказательствам:' : 'Birlamchi dalolatnomalar, javobgarlar va foto-dalillar:'}
          </span>
          <button
            onClick={() => {
              onClose()
              onViewJournal(product.productName)
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <span>{lang === 'ru' ? 'Журнал актов (Layer 3–4)' : 'Audit Jurnali (Layer 3–4)'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

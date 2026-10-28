'use client'

import React from 'react'
import {
  X,
  Truck,
  Factory,
  Warehouse,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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

  const { incoming, processing, storage } = product.stages

  const topIncomingReasons = Object.entries(incoming.reasons).sort((a, b) => b[1] - a[1])
  const topIncomingSuppliers = Object.entries(incoming.suppliers).sort((a, b) => b[1] - a[1])
  const topProcessingReasons = Object.entries(processing.reasons).sort((a, b) => b[1] - a[1])
  const topStorageReasons = Object.entries(storage.reasons).sort((a, b) => b[1] - a[1])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-enter">
      <div className="w-full sm:max-w-2xl h-full sm:h-[94vh] bg-white dark:bg-dark-900 sm:rounded-3xl border border-slate-200 dark:border-dark-750 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-dark-850/60">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Layer 2: {lang === 'ru' ? 'Анализ потерь по 3 этапам' : "3 bosqichli yo'qotishlar tahlili"}
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
        <div className="grid grid-cols-4 p-3.5 bg-slate-100/60 dark:bg-dark-800/40 border-b border-slate-200 dark:border-dark-750 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Приход' : 'Kirim'}</span>
            <b className="font-mono text-slate-900 dark:text-white">{product.inflowKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Выпуск ГП' : 'Tayyor chiqim'}</span>
            <b className="font-mono text-emerald-600 dark:text-emerald-400">{product.outputKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Общий брак' : 'Jami brak'}</span>
            <b className="font-mono text-rose-600 dark:text-rose-400">{product.actualDefectKg.toLocaleString()} kg</b>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'ru' ? 'Остаток' : 'Qoldiq'}</span>
            <b className="font-mono text-indigo-600 dark:text-indigo-400">{product.currentStockKg.toLocaleString()} kg</b>
          </div>
        </div>

        {/* Scrollable Stages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Stage 1: INCOMING */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Truck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    1. INCOMING — {lang === 'ru' ? 'Приемка сырья' : 'Qabul qilish bosqichi'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru' ? 'Брак в поступивших партиях' : "Keltirilgan partiyalardagi nuqsonlar"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                  {incoming.defectKg.toLocaleString()} kg
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {product.inflowKg > 0 ? `${((incoming.defectKg / product.inflowKg) * 100).toFixed(2)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Top Suppliers */}
            {topIncomingSuppliers.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Поставщики с наибольшим браком:' : "Eng ko'p brak bergan ta'minotchilar:"}
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

            {/* Top Reasons */}
            {topIncomingReasons.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Причины отбраковки:' : "Brak sabablari:"}
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
            <button onClick={() => onViewJournal(product.productName, 'INCOMING', 'ACTUAL_DEFECT')} className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline">
              Qabul aktlarini ko'rish →
            </button>
          </div>

          {/* Stage 2: PROCESSING */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Factory size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    2. PROCESSING — {lang === 'ru' ? 'Производство и переработка' : 'Ishlab chiqarish va qayta ishlash'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru' ? 'Технологические отходы и производственный брак' : "Texnologik chiqindi va sex braklari"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-600 block">
                  Tex. chiqindi: {processing.techWasteKg.toLocaleString()} kg
                </span>
                <span className="text-xs font-black text-rose-600 block mt-0.5">
                  Sex braki: {processing.defectKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            {topProcessingReasons.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  {lang === 'ru' ? 'Технологические причины:' : "Texnologik sabablar:"}
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
            <button onClick={() => onViewJournal(product.productName, 'PROCESSING')} className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline">
              Ishlov aktlarini ko'rish →
            </button>
          </div>

          {/* Stage 3: STORAGE */}
          <div className="bg-slate-50 dark:bg-dark-850/50 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Warehouse size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    3. STORAGE — {lang === 'ru' ? 'Хранение и склады' : 'Ombor va saqlash'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ru' ? 'Порча сырья при хранении и в холодильниках' : "Muzlatgich va omborda buzilishlar"}
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
                  {lang === 'ru' ? 'Факторы хранения:' : "Saqlash omillari:"}
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
                {lang === 'ru' ? 'Потерь на складе не зафиксировано' : "Omborda buzilish qayd etilmagan"}
              </div>
            )}
            <button onClick={() => onViewJournal(product.productName, 'STORAGE', 'ACTUAL_DEFECT')} className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline">
              Ombor aktlarini ko'rish →
            </button>
          </div>
        </div>

        {/* Drawer Footer Action */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-750 bg-slate-50/80 dark:bg-dark-850/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ru' ? 'Нужен первичный документ?' : "Barcha aktlarni ko'rmoqchimisiz?"}
          </span>
          <button
            onClick={() => {
              onClose()
              onViewJournal(product.productName)
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <span>{lang === 'ru' ? 'Журнал актов' : 'Audit Jurnali (Layer 3)'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

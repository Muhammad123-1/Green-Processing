'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Minus,
  ChevronRight,
  Filter,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react'

export interface ProductBalanceItem {
  productName: string
  unit: string
  inflowKg: number
  outputKg: number
  techWasteKg: number
  actualDefectKg: number
  currentStockKg: number
  standardLossPercent: number | null
  actualLossPercent: number | null
  actualDefectPercent: number | null
  yieldPercent: number | null
  variancePercent: number | null
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA'
  stages: {
    incoming: { defectKg: number; reasons: Record<string, number>; suppliers: Record<string, number> }
    processing: { techWasteKg: number; defectKg: number; reasons: Record<string, number> }
    storage: { defectKg: number; reasons: Record<string, number> }
  }
}

interface Props {
  products: ProductBalanceItem[]
  loading: boolean
  lang: string
  onSelectProduct: (prod: ProductBalanceItem) => void
  onOpenStandards: () => void
}

type SortKey =
  | 'variancePercent'
  | 'inflowKg'
  | 'actualDefectKg'
  | 'techWasteKg'
  | 'outputKg'
  | 'currentStockKg'
  | 'actualLossPercent'

export default function ProductBalanceTable({
  products,
  loading,
  lang,
  onSelectProduct,
  onOpenStandards,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'WARNING' | 'CRITICAL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('variancePercent')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // Default: ko'pdan kamga qarab!

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortOrder('desc') // Start with descending (ko'pdan kamga)
    }
  }

  const sorted = useMemo(() => {
    const list = products.filter((p) => {
      const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
      return matchSearch && matchStatus
    })

    return list.sort((a, b) => {
      let valA: number = 0
      let valB: number = 0

      if (sortKey === 'variancePercent') {
        valA = a.variancePercent !== null ? a.variancePercent : -999999
        valB = b.variancePercent !== null ? b.variancePercent : -999999
      } else if (sortKey === 'actualLossPercent') {
        valA = a.actualLossPercent !== null ? a.actualLossPercent : -999999
        valB = b.actualLossPercent !== null ? b.actualLossPercent : -999999
      } else {
        valA = a[sortKey] ?? 0
        valB = b[sortKey] ?? 0
      }

      if (Math.abs(valB - valA) > 0.0001) {
        return sortOrder === 'desc' ? valB - valA : valA - valB
      }
      return b.inflowKg - a.inflowKg
    })
  }, [products, search, statusFilter, sortKey, sortOrder])

  const renderStatusBadge = (status: ProductBalanceItem['status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 size={12} /> {lang === 'ru' ? 'НОРМА' : 'NORMAL'}
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
            <AlertTriangle size={12} /> {lang === 'ru' ? 'ВНИМАНИЕ' : 'OGOHLANTIRISH'}
          </span>
        )
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 animate-pulse">
            <AlertOctagon size={12} /> {lang === 'ru' ? 'КРИТИЧНО' : 'KRITIK OG‘ISH'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-dark-800 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
            <Minus size={12} /> {lang === 'ru' ? 'НЕТ ДАННЫХ' : "MA'LUMOT YO'Q"}
          </span>
        )
    }
  }

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={12} className="opacity-40 inline ml-1" />
    }
    return sortOrder === 'desc' ? (
      <ArrowDown size={12} className="text-emerald-600 inline ml-1" />
    ) : (
      <ArrowUp size={12} className="text-emerald-600 inline ml-1" />
    )
  }

  return (
    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col gap-3.5 bg-slate-50/70 dark:bg-dark-850/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ru' ? 'Баланс сырья и отклонения от нормы' : "Xomashyo balansi va me'yordan og'ish"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-dark-750 text-slate-700 dark:text-slate-300">
                {sorted.length} ta
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {lang === 'ru'
                ? 'Отсортировано по убыванию (от критических отклонений к норме)'
                : "Ko'pdan kamga qarab ketma-ketlikda saralangan (eng katta og'ish va zarardan boshlab)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Pills */}
            <div className="flex items-center bg-white dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-750 text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-dark-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'ru' ? 'Все' : 'Barchasi'}
              </button>
              <button
                onClick={() => setStatusFilter('WARNING')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'WARNING'
                    ? 'bg-amber-500 text-white'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50'
                }`}
              >
                {lang === 'ru' ? 'Внимание' : 'Ogohlantirish'}
              </button>
              <button
                onClick={() => setStatusFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50'
                }`}
              >
                {lang === 'ru' ? 'Критично' : 'Kritik'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Поиск сырья...' : "Qidirish..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenStandards}
              className="px-3 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors shadow-sm"
              title="Me'yorlarni sozlash"
            >
              ⚙️ {lang === 'ru' ? 'Нормы' : "Me'yorlar"}
            </button>
          </div>
        </div>

        {/* Quick Sorting Pills (Ko'pdan kamga) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-dark-750/60 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <SlidersHorizontal size={13} />
            {lang === 'ru' ? 'Сортировка (по убыванию):' : "Saralash (ko'pdan kamga):"}
          </span>

          <button
            onClick={() => handleSort('variancePercent')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              sortKey === 'variancePercent'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-100'
            }`}
          >
            <span>🚨 {lang === 'ru' ? 'Отклонение' : "Me'yordan og'ish"}</span>
            {renderSortIndicator('variancePercent')}
          </button>

          <button
            onClick={() => handleSort('inflowKg')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              sortKey === 'inflowKg'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-100'
            }`}
          >
            <span>📦 {lang === 'ru' ? 'Объем прихода' : 'Kirim hajmi'}</span>
            {renderSortIndicator('inflowKg')}
          </button>

          <button
            onClick={() => handleSort('actualDefectKg')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              sortKey === 'actualDefectKg'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-100'
            }`}
          >
            <span>⚠️ {lang === 'ru' ? 'Фактический брак' : 'Haqiqiy brak'}</span>
            {renderSortIndicator('actualDefectKg')}
          </button>

          <button
            onClick={() => handleSort('outputKg')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              sortKey === 'outputKg'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-100'
            }`}
          >
            <span>✅ {lang === 'ru' ? 'Выпуск ГП' : 'Tayyor chiqim'}</span>
            {renderSortIndicator('outputKg')}
          </button>

          <button
            onClick={() => handleSort('currentStockKg')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              sortKey === 'currentStockKg'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-100'
            }`}
          >
            <span>🏢 {lang === 'ru' ? 'Остаток на складе' : 'Ombor qoldig‘i'}</span>
            {renderSortIndicator('currentStockKg')}
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1020px]">
          <thead className="bg-slate-100/80 dark:bg-dark-800/80 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-dark-750">
            <tr>
              <th className="p-3.5 pl-4 w-12 text-center">№</th>
              <th className="p-3.5">{lang === 'ru' ? 'Сырье / Номенклатура' : 'Xomashyo nomi'}</th>
              <th
                onClick={() => handleSort('inflowKg')}
                className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Kirim bo'yicha saralash"
              >
                {lang === 'ru' ? 'Приход (кг)' : 'Kirim (kg)'} {renderSortIndicator('inflowKg')}
              </th>
              <th
                onClick={() => handleSort('outputKg')}
                className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Tayyor chiqim bo'yicha saralash"
              >
                {lang === 'ru' ? 'Выпуск ГП (кг)' : 'Tayyor chiqim (kg)'} {renderSortIndicator('outputKg')}
              </th>
              <th
                onClick={() => handleSort('techWasteKg')}
                className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Tex. chiqindi bo'yicha saralash"
              >
                {lang === 'ru' ? 'Тех. отход (кг)' : 'Tex. chiqindi (kg)'} {renderSortIndicator('techWasteKg')}
              </th>
              <th
                onClick={() => handleSort('actualDefectKg')}
                className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Haqiqiy brak bo'yicha saralash"
              >
                {lang === 'ru' ? 'Брак (кг)' : 'Haqiqiy brak (kg)'} {renderSortIndicator('actualDefectKg')}
              </th>
              <th
                onClick={() => handleSort('currentStockKg')}
                className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Qoldiq bo'yicha saralash"
              >
                {lang === 'ru' ? 'Остаток (кг)' : 'Joriy qoldiq (kg)'} {renderSortIndicator('currentStockKg')}
              </th>
              <th className="p-3.5 text-center">{lang === 'ru' ? 'Норма %' : "Me'yor %"}</th>
              <th
                onClick={() => handleSort('actualLossPercent')}
                className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
              >
                {lang === 'ru' ? 'Факт потери %' : 'Haqiqiy yo‘qotish %'} {renderSortIndicator('actualLossPercent')}
              </th>
              <th
                onClick={() => handleSort('variancePercent')}
                className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                title="Me'yordan og'ish bo'yicha saralash"
              >
                {lang === 'ru' ? 'Отклонение' : "Me'yordan og‘ish"} {renderSortIndicator('variancePercent')}
              </th>
              <th className="p-3.5 text-center pr-4">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
              <th className="p-3.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-xs font-semibold">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={12} className="p-4 bg-slate-50/50 dark:bg-dark-850/30">
                    <div className="h-5 bg-slate-200 dark:bg-dark-750 rounded" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-1.5">
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {lang === 'ru' ? 'Данные не найдены' : "Ma'lumot topilmadi"}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ru'
                        ? 'За выбранный период операционные данные по сырью отсутствуют'
                        : "Tanlangan davr uchun hech qanday xomashyo harakati mavjud emas"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((item, idx) => {
                return (
                  <tr
                    key={item.productName}
                    onClick={() => onSelectProduct(item)}
                    className="group hover:bg-emerald-50/40 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 pl-4 text-center font-mono text-[11px] font-black text-slate-400 group-hover:text-emerald-600">
                      {idx + 1}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{item.productName}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-800 dark:text-slate-200">
                      {item.inflowKg > 0 ? item.inflowKg.toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.outputKg > 0 ? item.outputKg.toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      {item.techWasteKg > 0 ? item.techWasteKg.toLocaleString() : '0'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {item.actualDefectKg > 0 ? item.actualDefectKg.toLocaleString() : '0'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                      {item.currentStockKg.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-500">
                      {item.standardLossPercent !== null ? `${item.standardLossPercent}%` : '—'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      {item.actualLossPercent !== null ? (
                        <span
                          className={
                            item.status === 'CRITICAL'
                              ? 'text-rose-600'
                              : item.status === 'WARNING'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {item.actualLossPercent}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {item.variancePercent !== null ? (
                        item.variancePercent > 0 ? (
                          <span className="text-rose-600 font-bold">+{item.variancePercent}%</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">{item.variancePercent}%</span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-center pr-4">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="p-3.5 text-right pr-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

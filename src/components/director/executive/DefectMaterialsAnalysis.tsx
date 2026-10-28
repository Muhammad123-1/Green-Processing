'use client'

import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Search,
  ShieldAlert,
  X,
  Scale,
  Boxes,
} from 'lucide-react'

export interface DefectItem {
  id: string
  type: string
  defectNumber?: string
  productName: string
  batchNumber?: string
  quantityKg: number
  unit?: string
  defectType?: string
  reason?: string
  actionTaken?: string
  date: string
  responsible?: string
  status?: string
  cost?: number
}

interface Props {
  items: DefectItem[]
  lang?: string
}

export default function DefectMaterialsAnalysis({ items = [], lang = 'uz' }: Props) {
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'kg' | 'dona'>('ALL')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<DefectItem | null>(null)
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // 1. Separate totals for KG and DONA
  const totalKg = useMemo(() => {
    return items
      .filter((i) => (i.unit || 'kg') === 'kg')
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [items])

  const totalDona = useMemo(() => {
    return items
      .filter((i) => i.unit === 'dona')
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [items])

  // 2. Group items by product for product cards (Image 2 style)
  const allProductsSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; totalQty: number; unit: string; reasons: Set<string> }
    >()
    items.forEach((item) => {
      const name = item.productName || 'Noma’lum mahsulot'
      const unit = item.unit || 'kg'
      const existing = map.get(name) || {
        name,
        count: 0,
        totalQty: 0,
        unit,
        reasons: new Set<string>(),
      }
      existing.count += 1
      existing.totalQty += item.quantityKg || 0
      if (item.reason) existing.reasons.add(item.reason)
      map.set(name, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty)
  }, [items])

  // Filter products by unit tab
  const visibleProductsSummary = useMemo(() => {
    if (unitFilter === 'ALL') return allProductsSummary
    return allProductsSummary.filter((p) => p.unit === unitFilter)
  }, [allProductsSummary, unitFilter])

  // Filtered records when a product is selected
  const filteredRecords = useMemo(() => {
    if (!selectedProduct) return []
    return items.filter((item) => {
      const matchProduct = item.productName === selectedProduct
      if (!matchProduct) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.defectNumber?.toLowerCase().includes(q) ||
        item.batchNumber?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q) ||
        item.responsible?.toLowerCase().includes(q) ||
        item.date?.includes(q)
      )
    })
  }, [items, selectedProduct, search])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page])

  const formatQty = (val: number, unit = 'kg') => {
    if (unit === 'dona') {
      return `${Math.round(val).toLocaleString('uz-UZ')} dona`
    }
    return `${val.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })} kg`
  }

  const formatKgOnly = (val: number) =>
    val.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })

  return (
    <div className="space-y-4">
      {/* 1. Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Xomashyo chiqindisi (KG) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Отходы сырья (Вес)' : 'Xomashyo chiqindisi (Vazn)'}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatKgOnly(totalKg)} kg
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.filter((p) => p.unit === 'kg').length} {lang === 'ru' ? 'вид(ов) сырья' : 'xil xomashyo'}
          </p>
        </div>

        {/* Card 2: Qadoq braki (DONA) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Брак упаковки (Шт)' : 'Qadoq braki (Sanoq)'}</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {Math.round(totalDona).toLocaleString('uz-UZ')} dona
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.filter((p) => p.unit === 'dona').length} {lang === 'ru' ? 'вид(ов) тары' : 'xil qadoq braki'}
          </p>
        </div>

        {/* Card 3: Brak aktlari */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Акты брака' : 'Brak holatlari'}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {items.length.toLocaleString('uz-UZ')} {lang === 'ru' ? 'актов' : 'ta'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.length} {lang === 'ru' ? 'наименований' : 'ta mahsulot turi'}
          </p>
        </div>

        {/* Card 4: Nazorat holati */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Статус контроля' : 'Nazorat holati'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
            100% {lang === 'ru' ? 'Учтено' : 'Hisoblangan'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium truncate">
            Aktlar va jurnallar bilan bog‘langan
          </p>
        </div>
      </div>

      {/* 2. Unit Filter Toolbar: Barchasi / Faqat KG / Faqat DONA */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProduct ? (
            <button
              onClick={() => {
                setSelectedProduct('')
                setSearch('')
                setPage(1)
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              ← {lang === 'ru' ? 'Все позиции брака' : 'Barcha brak mahsulotlar'}
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl">
              <button
                onClick={() => setUnitFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  unitFilter === 'ALL'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'ru' ? 'Все позиции' : 'Barchasi'} ({allProductsSummary.length})
              </button>
              <button
                onClick={() => setUnitFilter('kg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  unitFilter === 'kg'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                <Scale size={13} />
                <span>{lang === 'ru' ? 'Сырье (кг)' : "Xomashyo chiqindisi (KG)"}</span>
                <span className="opacity-80 font-mono text-[11px]">
                  ({formatKgOnly(totalKg)} kg)
                </span>
              </button>
              <button
                onClick={() => setUnitFilter('dona')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  unitFilter === 'dona'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                }`}
              >
                <Boxes size={13} />
                <span>{lang === 'ru' ? 'Упаковка (шт)' : "Qadoq braki (DONA)"}</span>
                <span className="opacity-80 font-mono text-[11px]">
                  ({Math.round(totalDona).toLocaleString('uz-UZ')} dona)
                </span>
              </button>
            </div>
          )}

          {selectedProduct && (
            <span className="text-xs font-black text-slate-900 dark:text-white px-2">
              {selectedProduct}
            </span>
          )}
        </div>

        {selectedProduct && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск по номеру / причине...' : 'Raqam / sabab bo‘yicha qidirish...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 w-56"
            />
          </div>
        )}
      </div>

      {/* 3. Product Cards Grid (Image 2 style) */}
      {!selectedProduct ? (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              {unitFilter === 'kg'
                ? lang === 'ru' ? 'Отходы и потери сырья (кг)' : 'Xomashyo va sabzavotlar chiqindisi (KG)'
                : unitFilter === 'dona'
                ? lang === 'ru' ? 'Брак упаковочных материалов (шт)' : 'Yaroqsiz qadoq va idishlar braki (DONA)'
                : lang === 'ru' ? 'Все позиции брака и отходов' : 'Barcha chiqindi va brak mahsulotlar'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {visibleProductsSummary.length} {lang === 'ru' ? 'позиций' : 'ta pozitsiya'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {visibleProductsSummary.map((row) => {
              const isPiece = row.unit === 'dona'
              return (
                <button
                  key={row.name}
                  onClick={() => {
                    setSelectedProduct(row.name)
                    setPage(1)
                  }}
                  className="p-4 text-left hover:bg-rose-50/50 dark:hover:bg-dark-800 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <b className="text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {row.name}
                    </b>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isPiece
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                      }`}
                    >
                      {isPiece ? 'DONA' : 'KG'}
                    </span>
                  </div>

                  <strong
                    className={`block mt-3 font-mono text-lg font-black ${
                      isPiece
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatQty(row.totalQty, row.unit)}
                  </strong>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="truncate max-w-[200px]">
                      {row.reasons.size > 0
                        ? Array.from(row.reasons)[0]
                        : 'Texnologik chiqindi'}
                    </span>
                    <span className="font-mono text-slate-400 shrink-0">
                      {row.count} {lang === 'ru' ? 'актов' : 'akt'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {!visibleProductsSummary.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Данные брака не найдены.' : 'Brak ma’lumotlari topilmadi.'}
            </div>
          )}
        </div>
      ) : (
        /* 4. Filtered Records Table for Selected Product */
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-2xs">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">{lang === 'ru' ? 'Акт / партия' : 'Akt / partiya'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Наименование' : 'Nomi'}</th>
                <th className="p-3.5 text-right">{lang === 'ru' ? 'Количество' : 'Chiqindi miqdori'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Причина' : 'Sabab / izoh'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Ответственный' : 'Mas’ul shaxs'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {paginatedRecords.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer hover:bg-rose-50/50 dark:hover:bg-dark-800 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {item.defectNumber || item.batchNumber}
                    <span className="block mt-0.5 text-[10px] font-normal text-slate-400">
                      {item.date}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {item.productName}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                    {formatQty(item.quantityKg, item.unit)}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    {item.reason || 'Texnologik chiqindi'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {item.responsible || 'Sex texnologi'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredRecords.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Позиции не найдены.' : 'Brak yozuvlari topilmadi.'}
            </div>
          )}

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200 dark:border-dark-750 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">
              {filteredRecords.length} {lang === 'ru' ? 'записей' : 'ta yozuv'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detail Modal / Drawer */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end"
          onClick={() => setSelectedItem(null)}
        >
          <aside
            className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-6 shadow-2xl rounded-l-3xl border-l border-slate-200 dark:border-dark-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-800 pb-4">
              <div>
                <p className="text-[11px] font-black text-rose-600 uppercase tracking-wider">
                  {lang === 'ru' ? 'АКТ БРАКА / ОТХОДОВ' : 'BRAK VA CHIQINDI DALOLATNOMASI'}
                </p>
                <h3 className="font-mono font-black text-slate-900 dark:text-white text-base">
                  {selectedItem.defectNumber || selectedItem.batchNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Наименование' : 'Mahsulot nomi'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                  {selectedItem.productName}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Объем потерь' : 'Yo‘qotish miqdori'}
                </span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm mt-0.5 block">
                  {formatQty(selectedItem.quantityKg, selectedItem.unit)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Ответственный' : 'Mas’ul shaxs'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedItem.responsible || 'Sex texnologi'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Дата регистрации' : 'Qayd etilgan sana'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedItem.date}
                </span>
              </div>
            </div>

            {selectedItem.reason && (
              <section className="p-4 rounded-2xl bg-rose-50/60 dark:bg-dark-800 border border-rose-200 dark:border-rose-900/40 text-xs mt-2">
                <b className="text-rose-700 dark:text-rose-300 block mb-1">
                  {lang === 'ru' ? 'Причина брака / отходов:' : 'Chiqindi / brak sababi:'}
                </b>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedItem.reason}
                </p>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

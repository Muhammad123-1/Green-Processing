'use client'

import React, { useMemo, useState } from 'react'
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Factory,
  FileText,
  Layers,
  Search,
  X,
  Package,
  Scale,
  Boxes,
} from 'lucide-react'
import { formatBatchNumber } from './IncomingMaterialsAnalysis'

export interface ConsumptionItem {
  id: string
  type: string
  productName: string
  batchNumber: string
  actNumber?: string
  rawBatch?: string
  quantityKg: number
  unit?: string
  date: string
  workshop?: string
  status?: string
  targetProducts?: string
}

interface Props {
  items: ConsumptionItem[]
  lang?: string
}

export default function ConsumptionMaterialsAnalysis({ items = [], lang = 'uz' }: Props) {
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'kg' | 'dona'>('ALL')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<ConsumptionItem | null>(null)
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

  const distinctWorkshopsCount = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i) => {
      if (i.workshop) s.add(i.workshop)
    })
    return s.size
  }, [items])

  // 2. Group items by product for product cards (Image 2 style)
  const allProductsSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; totalQty: number; unit: string; workshops: Set<string> }
    >()
    items.forEach((item) => {
      const name = item.productName || 'Noma’lum mahsulot'
      const unit = item.unit || 'kg'
      const existing = map.get(name) || {
        name,
        count: 0,
        totalQty: 0,
        unit,
        workshops: new Set<string>(),
      }
      existing.count += 1
      existing.totalQty += item.quantityKg || 0
      if (item.workshop) existing.workshops.add(item.workshop)
      map.set(name, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty)
  }, [items])

  // Filter products by selected unit tab (ALL / kg / dona) & search
  const visibleProductsSummary = useMemo(() => {
    let list = allProductsSummary
    if (unitFilter !== 'ALL') {
      list = list.filter((p) => p.unit === unitFilter)
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [allProductsSummary, unitFilter, productSearch])

  // Selected product summary stats
  const selectedProductSummary = useMemo(() => {
    if (!selectedProduct) return null
    return allProductsSummary.find((p) => p.name === selectedProduct) || null
  }, [allProductsSummary, selectedProduct])

  // Filtered records when a product is selected
  const filteredRecords = useMemo(() => {
    if (!selectedProduct) return []
    return items.filter((item) => {
      const matchProduct = item.productName === selectedProduct
      if (!matchProduct) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.batchNumber?.toLowerCase().includes(q) ||
        item.workshop?.toLowerCase().includes(q) ||
        item.targetProducts?.toLowerCase().includes(q) ||
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
      {/* 1. Top Stats Cards - Separating KG and DONA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Xomashyo sarfi (KG) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Сырье (Вес)' : 'Xomashyo sarfi (Vazn)'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatKgOnly(totalKg)} kg
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {(totalKg / 1000).toFixed(1)} tn • {allProductsSummary.filter((p) => p.unit === 'kg').length} {lang === 'ru' ? 'вид(ов)' : 'xil xomashyo'}
          </p>
        </div>

        {/* Card 2: Qadoq sarfi (DONA) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Тара и пакеты (Шт)' : 'Qadoq va idishlar (Sanoq)'}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {Math.round(totalDona).toLocaleString('uz-UZ')} dona
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.filter((p) => p.unit === 'dona').length} {lang === 'ru' ? 'вид(ов) упаковки' : 'xil qadoq turi'}
          </p>
        </div>

        {/* Card 3: Chiqim aktlari soni */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Операции расхода' : 'Jami chiqim operatsiyalari'}</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {items.length.toLocaleString('uz-UZ')} {lang === 'ru' ? 'актов' : 'ta'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.length} {lang === 'ru' ? 'позиций всего' : 'umumiy pozitsiya'}
          </p>
        </div>

        {/* Card 4: Sexlar soni */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Цеха-получатели' : 'Qabul qilgan sexlar'}</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Factory size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {distinctWorkshopsCount || 2} {lang === 'ru' ? 'цехов' : 'ta sex'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium truncate">
            Tayyorlash, Oshxona, Qadoqlash
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
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              ← {lang === 'ru' ? 'Все продукты' : 'Barcha mahsulotlar'}
            </button>
          ) : (
            /* Toggle Buttons for Unit */
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
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                <Scale size={13} />
                <span>{lang === 'ru' ? 'Весовые' : "Xomashyo"}</span>
                <span className="opacity-80 text-[11px]">
                  ({allProductsSummary.filter((p) => p.unit === 'kg').length})
                </span>
              </button>
              <button
                onClick={() => setUnitFilter('dona')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  unitFilter === 'dona'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                }`}
              >
                <Boxes size={13} />
                <span>{lang === 'ru' ? 'Штучные' : "Qadoq / Idish"}</span>
                <span className="opacity-80 text-[11px]">
                  ({allProductsSummary.filter((p) => p.unit === 'dona').length})
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
              placeholder={lang === 'ru' ? 'Поиск по партии / цеху...' : 'Partiya / sex bo‘yicha qidirish...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        )}
      </div>

      {/* 3. Product Cards Grid - Old style divided grid (4 per row), product name only */}
      {!selectedProduct ? (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {unitFilter === 'kg'
                  ? lang === 'ru' ? 'Весовое сырье в расходе' : 'Xomashyo va sabzavotlar sarfi'
                  : unitFilter === 'dona'
                  ? lang === 'ru' ? 'Штучные материалы в расходе' : 'Qadoqlash vositalari va idishlar sarfi'
                  : lang === 'ru' ? 'Вся продукция и тара в расходе' : 'Ishlab chiqarishga sarflangan barcha mahsulotlar'}
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {visibleProductsSummary.length} {lang === 'ru' ? 'позиций' : 'ta mahsulot'}
              </span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Поиск продукта...' : 'Mahsulotni qidirish...'}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {visibleProductsSummary.map((row) => (
              <button
                key={row.name}
                onClick={() => {
                  setSelectedProduct(row.name)
                  setSearch('')
                  setPage(1)
                }}
                className="p-5 text-left hover:bg-blue-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[92px]"
              >
                <b className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {row.name}
                </b>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {lang === 'ru' ? 'Подробнее' : 'Batafsil'}
                  </span>
                  <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform ml-auto" />
                </div>
              </button>
            ))}
          </div>

          {!visibleProductsSummary.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Данные расхода не найдены.' : 'Chiqim ma’lumotlari topilmadi.'}
            </div>
          )}
        </div>
      ) : (
        /* 4. Inside Product: Numbers & Filtered Records Table */
        <div className="space-y-3">
          {/* Product KPI Statistics (Mahsulot ichiga kirganda raqamlar ko'rsatiladi) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {lang === 'ru' ? 'Отчет по расходу продукта' : 'Mahsulot chiqimi hisoboti'}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedProduct}
                </h2>
              </div>
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl ${
                  selectedProductSummary?.unit === 'dona'
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {selectedProductSummary?.unit === 'dona' ? 'DONA (Sanoq)' : 'KG (Vazn)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Общий расход' : 'Jami sarflangan'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatQty(selectedProductSummary?.totalQty || 0, selectedProductSummary?.unit)}
                </div>
                {selectedProductSummary?.unit === 'kg' && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {((selectedProductSummary?.totalQty || 0) / 1000).toFixed(2)} tn
                  </span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Актов расхода' : 'Chiqim aktlari soni'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.count || 0} ta sarf
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ru' ? 'Списаний в производство' : 'Sexlarga uzatilgan'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Средний расход' : 'O‘rtacha bitta sarf'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatQty(
                    selectedProductSummary?.count
                      ? selectedProductSummary.totalQty / selectedProductSummary.count
                      : 0,
                    selectedProductSummary?.unit
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ru' ? 'На один акт' : 'Har bir chiqimga'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Цеха' : 'Ishlatilgan sexlar'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.workshops.size || 0} ta sex
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate block">
                  {selectedProductSummary?.workshops.size
                    ? Array.from(selectedProductSummary.workshops).slice(0, 2).join(', ')
                    : 'Sex sarfi'}
                </span>
              </div>
            </div>
          </div>

          {/* Filtered Records Table for Selected Product */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-2xs">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">{lang === 'ru' ? 'Дата операции' : 'Sana'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Наименование' : 'Nomi'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Цех-получатель' : 'Qabul qilgan sex'}</th>
                <th className="p-3.5 text-right">{lang === 'ru' ? 'Расход' : 'Sarflangan miqdor'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Акт и партия' : 'Akt va partiya'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {paginatedRecords.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-dark-800 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    <span>{item.date}</span>
                    <span className="block mt-0.5 text-[10px] font-normal text-slate-400">
                      Sex hisoboti
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {item.productName}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {item.workshop || 'Tayyorlash sexi'}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                    {formatQty(item.quantityKg, item.unit)}
                  </td>
                  <td className="p-3 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {item.actNumber || `AKT-${item.id}`}
                    </span>
                    {(() => {
                      const bInfo = formatBatchNumber(item.batchNumber, item.rawBatch, lang)
                      return (
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            bInfo.isMissing
                              ? 'text-slate-400 dark:text-slate-500 font-medium'
                              : 'font-semibold text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {bInfo.text}
                        </span>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredRecords.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Позиции не найдены.' : 'Chiqim yozuvlari topilmadi.'}
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
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  {lang === 'ru' ? 'АКТ РАСХОДА' : 'CHIQIM DALOLATNOMASI'}
                </p>
                <h3 className="font-mono font-black text-slate-900 dark:text-white text-base">
                  {selectedItem.actNumber || `AKT-${selectedItem.id}`}
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
                  {lang === 'ru' ? 'Объем расхода' : 'Sarflangan miqdor'}
                </span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm mt-0.5 block">
                  {formatQty(selectedItem.quantityKg, selectedItem.unit)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Акт и номер' : 'Chiqim akti'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedItem.actNumber || `AKT-${selectedItem.id}`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Партия сырья' : 'Xomashyo partiyasi'}
                </span>
                {(() => {
                  const bInfo = formatBatchNumber(selectedItem.batchNumber, selectedItem.rawBatch, lang)
                  return (
                    <span
                      className={`mt-0.5 block ${
                        bInfo.isMissing
                          ? 'text-xs text-slate-400 dark:text-slate-500 font-medium'
                          : 'font-mono font-bold text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {bInfo.text}
                    </span>
                  )
                })()}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Цех-получатель' : 'Qabul qilgan sex'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedItem.workshop || 'Tayyorlash sexi'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Дата операции' : 'Operatsiya sanasi'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedItem.date}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

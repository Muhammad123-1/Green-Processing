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
} from 'lucide-react'

export interface ConsumptionItem {
  id: string
  type: string
  productName: string
  batchNumber: string
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
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<ConsumptionItem | null>(null)
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // 1. Group items by product for product cards (Image 2 style)
  const productsSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalKg: number; workshops: Set<string> }>()
    items.forEach((item) => {
      const name = item.productName || 'Noma’lum mahsulot'
      const existing = map.get(name) || { name, count: 0, totalKg: 0, workshops: new Set<string>() }
      existing.count += 1
      existing.totalKg += item.quantityKg || 0
      if (item.workshop) existing.workshops.add(item.workshop)
      map.set(name, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.totalKg - a.totalKg)
  }, [items])

  // Overall totals
  const overallTotalKg = useMemo(() => items.reduce((sum, i) => sum + (i.quantityKg || 0), 0), [items])
  const distinctWorkshopsCount = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i) => {
      if (i.workshop) s.add(i.workshop)
    })
    return s.size
  }, [items])

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

  const formatKg = (val: number) =>
    val.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })

  return (
    <div className="space-y-4">
      {/* 1. Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Операции расхода' : 'Chiqim operatsiyalari'}</span>
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {items.length.toLocaleString('uz-UZ')} {lang === 'ru' ? 'актов' : 'ta'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Общий расход' : 'Jami sarflangan hajm'}</span>
            <ChefHat size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-600 dark:text-blue-400">
            {formatKg(overallTotalKg)} kg
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Виды сырья' : 'Mahsulot turlari'}</span>
            <Layers size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {productsSummary.length} {lang === 'ru' ? 'позиций' : 'tur'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Цеха-получатели' : 'Qabul qilgan sexlar'}</span>
            <Factory size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {distinctWorkshopsCount || 1} {lang === 'ru' ? 'цехов' : 'ta sex'}
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProduct && (
            <button
              onClick={() => {
                setSelectedProduct('')
                setSearch('')
                setPage(1)
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              ← {lang === 'ru' ? 'Все продукты' : 'Barcha mahsulotlar'}
            </button>
          )}

          {selectedProduct ? (
            <span className="text-xs font-black text-slate-900 dark:text-white px-2">
              {selectedProduct}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500 px-2">
              {lang === 'ru' ? 'Список расхода по сырью' : 'Xomashyo bo‘yicha sarf ro‘yxati'}
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

      {/* 3. Product Cards Grid (Image 2 style) */}
      {!selectedProduct ? (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white">
              {lang === 'ru' ? 'Продукция в расходе' : 'Chiqim mahsulotlari'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {productsSummary.length} {lang === 'ru' ? 'наименований' : 'ta mahsulot'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {productsSummary.map((row) => (
              <button
                key={row.name}
                onClick={() => {
                  setSelectedProduct(row.name)
                  setPage(1)
                }}
                className="p-4 text-left hover:bg-blue-50/50 dark:hover:bg-dark-800 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <b className="text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {row.name}
                  </b>
                  <span className="text-blue-600 font-black text-xs font-mono">
                    {row.count} {lang === 'ru' ? 'актов' : 'chiqim'}
                  </span>
                </div>
                <strong className="block mt-3 font-mono text-lg text-blue-600 dark:text-blue-400">
                  {formatKg(row.totalKg)} kg
                </strong>
                <span className="block mt-1 text-[11px] text-slate-500">
                  {row.workshops.size > 0
                    ? Array.from(row.workshops).slice(0, 2).join(', ')
                    : 'Sex ishlab chiqarish sarfi'}
                </span>
              </button>
            ))}
          </div>

          {!productsSummary.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Данные расхода не найдены.' : 'Chiqim ma’lumotlari topilmadi.'}
            </div>
          )}
        </div>
      ) : (
        /* 4. Filtered Records Table for Selected Product */
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500">
              <tr>
                <th className="p-3">{lang === 'ru' ? 'Документ / дата' : 'Hujjat / sana'}</th>
                <th className="p-3">{lang === 'ru' ? 'Сырье / объем' : 'Xomashyo / hajm'}</th>
                <th className="p-3">{lang === 'ru' ? 'Цех-получатель' : 'Qabul qilgan sex'}</th>
                <th className="p-3 text-right">{lang === 'ru' ? 'Расход (кг)' : 'Sarf miqdori'}</th>
                <th className="p-3">{lang === 'ru' ? 'Выпущенная продукция' : 'Tayyorlangan mahsulot'}</th>
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
                    {item.batchNumber}
                    <span className="block mt-0.5 text-[10px] font-normal text-slate-400">
                      {item.date}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {item.productName}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {item.workshop || 'Tayyorlash sexi'}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                    {formatKg(item.quantityKg)} {item.unit || 'kg'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    {item.targetProducts || 'Ishlab chiqarishga sarflandi'}
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
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30"
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
            className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between border-b pb-3">
              <div>
                <p className="text-[11px] font-black text-blue-600 uppercase">
                  {lang === 'ru' ? 'АКТ РАСХОДА' : 'CHIQIM HUJJATI'}
                </p>
                <h3 className="font-mono font-black text-slate-900 dark:text-white">
                  {selectedItem.batchNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Сырье' : 'Xomashyo nomi'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedItem.productName}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Объем расхода' : 'Sarflangan miqdor'}
                </span>
                <span className="font-mono font-black text-blue-600 text-sm">
                  {formatKg(selectedItem.quantityKg)} {selectedItem.unit || 'kg'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Цех-получатель' : 'Qabul qilgan sex'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedItem.workshop || 'Tayyorlash sexi'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Дата операции' : 'Operatsiya sanasi'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedItem.date}
                </span>
              </div>
            </div>

            {selectedItem.targetProducts && (
              <section className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-dark-800 border border-blue-200 dark:border-blue-900/40 text-xs mt-2">
                <b className="text-blue-700 dark:text-blue-300 block mb-1">
                  {lang === 'ru' ? 'Выпущенная продукция:' : 'Chiqarilgan tayyor mahsulot:'}
                </b>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedItem.targetProducts}
                </p>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

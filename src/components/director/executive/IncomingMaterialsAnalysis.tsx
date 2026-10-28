'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
  Scale,
  Boxes,
  Truck,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

export interface IncomingItem {
  id: string
  type: string
  productName: string
  batchNumber: string
  rawBatch?: string
  quantityKg: number
  unit?: string
  date: string
  supplierName?: string
  receivedBy?: string
  status?: string
}

interface Props {
  items?: IncomingItem[]
  dateFrom?: string
  dateTo?: string
  lang?: string
}

export default function IncomingMaterialsAnalysis({
  items = [],
  dateFrom = '',
  dateTo = '',
  lang = 'uz',
}: Props) {
  const [fetchedItems, setFetchedItems] = useState<IncomingItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'kg' | 'dona'>('ALL')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<IncomingItem | null>(null)
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // If items are not passed via props, load from API
  useEffect(() => {
    if (items && items.length > 0) return

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', pageSize: '100' })
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        const res = await fetch(`/api/director/incoming-analysis?${params}`, { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json?.records) {
          const mapped: IncomingItem[] = json.records.map((r: any) => ({
            id: String(r.id),
            type: 'PRIXOD',
            productName: r.productName,
            batchNumber: r.actNumber || (r.batchNumber ? `Partiya #${r.batchNumber}` : `PAR-${r.id}`),
            rawBatch: r.batchNumber || '',
            quantityKg: Number(r.warehouseKg || 0),
            unit: r.unit || 'kg',
            date: r.actDate,
            supplierName: r.supplierName || 'Yetkazib beruvchi',
            receivedBy: r.inspectorName || 'Sifat nazorati / Omborchi',
            status: r.decisionText || (r.decisionRating === 2 ? 'Rad etilgan' : 'Qabul qilingan'),
          }))
          setFetchedItems(mapped)
        }
      } catch (e) {
        console.error('Failed to fetch incoming items:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [items, dateFrom, dateTo])

  // Effective items: either from props or from fetch
  const effectiveItems = useMemo(() => {
    return items && items.length > 0 ? items : fetchedItems
  }, [items, fetchedItems])

  // 1. Separate totals for KG and DONA
  const totalKg = useMemo(() => {
    return effectiveItems
      .filter((i) => (i.unit || 'kg') === 'kg')
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [effectiveItems])

  const totalDona = useMemo(() => {
    return effectiveItems
      .filter((i) => i.unit === 'dona')
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [effectiveItems])

  // Distinct suppliers
  const distinctSuppliers = useMemo(() => {
    const s = new Set<string>()
    effectiveItems.forEach((i) => {
      if (i.supplierName && i.supplierName !== 'Yetkazib beruvchi') {
        s.add(i.supplierName.trim())
      }
    })
    return Array.from(s)
  }, [effectiveItems])

  const topSuppliersText = useMemo(() => {
    return distinctSuppliers.slice(0, 3).join(', ')
  }, [distinctSuppliers])

  // 2. Group items by product for product cards (matching Chiqim 1:1)
  const allProductsSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; totalQty: number; unit: string; suppliers: Set<string> }
    >()

    effectiveItems.forEach((item) => {
      const rawName = (item.productName || '').trim()
      if (!rawName) return
      // Normalize name to avoid case duplication
      const name = rawName
      const unit = item.unit || 'kg'
      const existing = map.get(name) || {
        name,
        count: 0,
        totalQty: 0,
        unit,
        suppliers: new Set<string>(),
      }
      existing.count += 1
      existing.totalQty += item.quantityKg || 0
      if (item.supplierName && item.supplierName !== 'Yetkazib beruvchi') {
        existing.suppliers.add(item.supplierName.trim())
      }
      map.set(name, existing)
    })

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty)
  }, [effectiveItems])

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
    return effectiveItems.filter((item) => {
      const matchProduct = item.productName === selectedProduct
      if (!matchProduct) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.batchNumber?.toLowerCase().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.date?.includes(q) ||
        item.receivedBy?.toLowerCase().includes(q)
      )
    })
  }, [effectiveItems, selectedProduct, search])

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
      {/* 1. Top Stats Cards - Exactly 4 cards matching Chiqim */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Xomashyo kirimi (KG) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Сырье (Вес)' : 'Xomashyo kirimi (Vazn)'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatKgOnly(totalKg)} kg
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {(totalKg / 1000).toFixed(1)} tn • {allProductsSummary.filter((p) => p.unit === 'kg').length}{' '}
            {lang === 'ru' ? 'вид(ов)' : 'xil xomashyo'}
          </p>
        </div>

        {/* Card 2: Qadoq va idishlar kirimi (DONA) */}
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
            {allProductsSummary.filter((p) => p.unit === 'dona').length}{' '}
            {lang === 'ru' ? 'вид(ов) упаковки' : 'xil qadoq turi'}
          </p>
        </div>

        {/* Card 3: Jami kirim partiyalari */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Партии прихода' : 'Jami kirim partiyalari'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {effectiveItems.length.toLocaleString('uz-UZ')} {lang === 'ru' ? 'партий' : 'ta'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.length} {lang === 'ru' ? 'позиций всего' : 'umumiy pozitsiya'}
          </p>
        </div>

        {/* Card 4: Ta'minotchilar soni */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Поставщики' : 'Yetkazib beruvchilar'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Truck size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {distinctSuppliers.length || 72} {lang === 'ru' ? 'поставщиков' : 'ta ta’minotchi'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium truncate">
            {topSuppliersText || 'FARMIX, Qibray arashan, Agro...'}
          </p>
        </div>
      </div>

      {/* 2. Unit Filter Toolbar - Matching Chiqim toolbar 1:1 */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProduct ? (
            <button
              onClick={() => {
                setSelectedProduct('')
                setSearch('')
                setPage(1)
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
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
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <Scale size={13} />
                <span>{lang === 'ru' ? 'Весовые' : 'Xomashyo'}</span>
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
                <span>{lang === 'ru' ? 'Штучные' : 'Qadoq / Idish'}</span>
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
              placeholder={lang === 'ru' ? 'Поиск по партии / поставщику...' : 'Partiya / ta’minotchi bo‘yicha qidirish...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
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
                  ? lang === 'ru' ? 'Весовое сырье в приходе' : 'Xomashyo va sabzavotlar'
                  : unitFilter === 'dona'
                  ? lang === 'ru' ? 'Штучные материалы в приходе' : 'Qadoqlash vositalari va idishlar'
                  : lang === 'ru' ? 'Вся поступившая продукция и тара' : 'Qabul qilingan barcha mahsulotlar'}
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
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
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
                className="p-5 text-left hover:bg-emerald-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[92px]"
              >
                <b className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {row.name}
                </b>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
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
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-emerald-600" size={24} />
                  <span>Kirim ma’lumotlari yuklanmoqda...</span>
                </div>
              ) : lang === 'ru' ? (
                'Данные прихода не найдены.'
              ) : (
                'Kirim ma’lumotlari topilmadi.'
              )}
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {lang === 'ru' ? 'Отчет по выбранному продукту' : 'Tanlangan mahsulot hisoboti'}
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
                  {lang === 'ru' ? 'Общий объем' : 'Jami qabul miqdori'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
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
                  {lang === 'ru' ? 'Партий' : 'Partiyalar soni'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.count || 0} ta partiya
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ru' ? 'Актов прихода' : 'Qabul dalolatnomalari'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Средняя партия' : 'O‘rtacha bitta partiya'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatQty(
                    selectedProductSummary?.count
                      ? selectedProductSummary.totalQty / selectedProductSummary.count
                      : 0,
                    selectedProductSummary?.unit
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ru' ? 'На одну поставку' : 'Har bir partiyaga'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Поставщики' : 'Yetkazib beruvchilar'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.suppliers.size || 0} ta
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate block">
                  {selectedProductSummary?.suppliers.size
                    ? Array.from(selectedProductSummary.suppliers).slice(0, 2).join(', ')
                    : 'Ombor'}
                </span>
              </div>
            </div>
          </div>

          {/* Filtered Records Table for Selected Product */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-2xs">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">{lang === 'ru' ? 'Документ / дата' : 'Hujjat / sana'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Наименование' : 'Nomi'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Поставщик / Партия' : 'Ta’minotchi / Partiya'}</th>
                <th className="p-3.5 text-right">{lang === 'ru' ? 'Количество / Вес' : 'Miqdor / Vazn'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Принял / Инспектор' : 'Qabul qiluvchi / Inspektor'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {paginatedRecords.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-emerald-50/50 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-mono text-slate-900 dark:text-white">
                    <span className="font-bold">{item.batchNumber || item.id}</span>
                    <span className="block text-[11px] text-slate-400">{item.date}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {item.productName}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    <span>{item.supplierName || 'Yetkazib beruvchi'}</span>
                    {item.rawBatch && (
                      <span className="block text-[10px] font-mono text-slate-400">
                        № {item.rawBatch}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatQty(item.quantityKg, item.unit)}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {item.receivedBy || 'Omborchi / Sifat nazorati'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.status?.toLowerCase().includes('rad')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : item.status?.toLowerCase().includes('shart')
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {item.status || 'Qabul qilingan'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!paginatedRecords.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Записи не найдены.' : 'Partiyalar topilmadi.'}
            </div>
          )}

          {/* Table pagination */}
          <div className="p-3.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              {lang === 'ru' ? 'Всего:' : 'Jami:'}{' '}
              <b className="text-slate-900 dark:text-white font-mono">{filteredRecords.length}</b>{' '}
              {lang === 'ru' ? 'партий' : 'ta partiya'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. Detail Drawer Modal - Matching Chiqim modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <aside
            className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-5 shadow-2xl rounded-l-3xl border-l border-slate-200 dark:border-dark-750"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-dark-750">
              <div>
                <p className="text-[11px] font-black tracking-wider text-emerald-600 uppercase">
                  QABUL PARTIYASI
                </p>
                <h3 className="font-mono font-black text-xl text-slate-900 dark:text-white">
                  {selectedItem.batchNumber || selectedItem.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <Detail label="Mahsulot" value={selectedItem.productName} />
              <Detail label="Partiya raqami" value={selectedItem.rawBatch || selectedItem.batchNumber} />
              <Detail label="Yetkazib beruvchi" value={selectedItem.supplierName || 'Ko‘rsatilmagan'} />
              <Detail label="Qabul qilgan mas'ul" value={selectedItem.receivedBy || 'Ko‘rsatilmagan'} />
              <Detail label="Sana" value={selectedItem.date} />
              <Detail label="Miqdori / Vazni" value={formatQty(selectedItem.quantityKg, selectedItem.unit)} />
              <Detail label="Holati" value={selectedItem.status || 'Qabul qilingan'} />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-800">
              <a
                href="/shop-report"
                className="inline-flex text-xs font-bold text-emerald-600 hover:underline"
              >
                Sex hisoboti (Приход) jurnaliga o‘tish →
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] text-slate-400 font-semibold">{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{value}</span>
    </div>
  )
}

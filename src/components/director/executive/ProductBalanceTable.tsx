'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Minus,
  ChevronRight,
  ChevronLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  SlidersHorizontal,
  Scale,
  Boxes,
  Layers,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Sparkles,
} from 'lucide-react'

export interface ProductBalanceItem {
  productName: string
  unit: string
  openingStockKg?: number
  inflowKg: number
  rejectedIncomingKg?: number
  totalAvailableRawKg?: number
  consumedKg?: number
  outputKg: number
  techWasteKg: number
  actualDefectKg: number
  currentStockKg: number
  // Requirement 3 & 4 fields
  approvedMaxStorageDays?: number | null
  minStockThresholdKg?: number | null
  operationalDaysCount?: number
  avgDailyConsumptionKg?: number | null
  avgWeeklyConsumptionKg?: number | null
  maxRecommendedInventoryKg?: number | null
  stockCoverageDays?: number | null
  stockCoverageWeeks?: number | null
  inventoryStatus?: 'OUT_OF_STOCK' | 'LOW' | 'SUFFICIENT' | 'EXCESS'
  // Requirement 5 fields
  stockRelativeOutputPercent?: number | null
  productionYieldPercent?: number | null
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
    finalQc?: { checkedKg: number; approvedKg: number; rejectedKg: number }
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
  | 'consumedKg'
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
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'kg' | 'dona'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'WARNING' | 'CRITICAL'>('ALL')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [selectedCardProduct, setSelectedCardProduct] = useState<ProductBalanceItem | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('currentStockKg')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Top Global Totals
  const totalWeightKg = useMemo(() => {
    return products
      .filter((p) => (p.unit || 'kg') === 'kg')
      .reduce((sum, p) => sum + (p.currentStockKg || 0), 0)
  }, [products])

  const totalDona = useMemo(() => {
    return products
      .filter((p) => p.unit === 'dona')
      .reduce((sum, p) => sum + (p.currentStockKg || 0), 0)
  }, [products])

  const sufficientCount = useMemo(() => {
    return products.filter((p) => p.inventoryStatus === 'SUFFICIENT' || p.status === 'NORMAL').length
  }, [products])

  const lowOrOutCount = useMemo(() => {
    return products.filter(
      (p) => p.inventoryStatus === 'LOW' || p.inventoryStatus === 'OUT_OF_STOCK' || p.inventoryStatus === 'EXCESS' || p.status === 'CRITICAL'
    ).length
  }, [products])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase())
      let matchStatus = true
      if (statusFilter === 'NORMAL') {
        matchStatus = p.inventoryStatus === 'SUFFICIENT' || p.status === 'NORMAL'
      } else if (statusFilter === 'WARNING') {
        matchStatus = p.inventoryStatus === 'LOW' || p.inventoryStatus === 'EXCESS' || p.status === 'WARNING'
      } else if (statusFilter === 'CRITICAL') {
        matchStatus = p.inventoryStatus === 'OUT_OF_STOCK' || p.status === 'CRITICAL'
      }
      const matchUnit = unitFilter === 'ALL' || (p.unit || 'kg') === unitFilter
      return matchSearch && matchStatus && matchUnit
    })
  }, [products, search, statusFilter, unitFilter])

  const sorted = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA: number = 0
      let valB: number = 0

      if (sortKey === 'variancePercent') {
        valA = a.variancePercent !== null ? a.variancePercent : -999999
        valB = b.variancePercent !== null ? b.variancePercent : -999999
      } else if (sortKey === 'actualLossPercent') {
        valA = a.actualLossPercent !== null ? a.actualLossPercent : -999999
        valB = b.actualLossPercent !== null ? b.actualLossPercent : -999999
      } else if (sortKey === 'consumedKg') {
        valA = a.consumedKg ?? 0
        valB = b.consumedKg ?? 0
      } else {
        valA = (a[sortKey] as number) ?? 0
        valB = (b[sortKey] as number) ?? 0
      }

      if (Math.abs(valB - valA) > 0.0001) {
        return sortOrder === 'desc' ? valB - valA : valA - valB
      }
      return b.inflowKg - a.inflowKg
    })
  }, [filteredProducts, sortKey, sortOrder])

  const renderStatusBadge = (status: ProductBalanceItem['status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 size={12} /> {lang === 'ru' ? 'НОРМА' : 'YETARLI'}
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
            <AlertOctagon size={12} /> {lang === 'ru' ? 'КРИТИЧНО' : 'KAM / TUGAGAN'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-dark-800 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
            <Minus size={12} /> {lang === 'ru' ? 'НЕТ НОРМЫ' : "ME'YOR YO'Q"}
          </span>
        )
    }
  }

  const renderInventoryStatusPill = (invStatus?: ProductBalanceItem['inventoryStatus']) => {
    switch (invStatus) {
      case 'OUT_OF_STOCK':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {lang === 'ru' ? 'Закончилось' : 'Tugagan'}
          </span>
        )
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {lang === 'ru' ? 'Мало' : 'Kam qolgan'}
          </span>
        )
      case 'EXCESS':
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            {lang === 'ru' ? 'Избыток' : 'Ko‘p'}
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {lang === 'ru' ? 'В норме' : 'Yetarli'}
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
    <div className="space-y-4">
      {/* 1. Top KPI Summary Cards (Matching Operatsiyalar design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Jami Xomashyo Qoldig'i (KG/TN) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Остаток сырья (Вес)' : 'Xomashyo qoldig‘i (Vazn)'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {(totalWeightKg / 1000).toFixed(1)} tn
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {totalWeightKg.toLocaleString()} kg • {products.filter((p) => (p.unit || 'kg') === 'kg').length} xil xomashyo
          </p>
        </div>

        {/* Card 2: Qadoqlar & Taralar (DONA) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Тара и упаковка (Шт)' : 'Qadoq va taralar (Dona)'}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {Math.round(totalDona).toLocaleString('uz-UZ')} dona
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {products.filter((p) => p.unit === 'dona').length} xil qadoq pozitsiyasi
          </p>
        </div>

        {/* Card 3: Yetarli Zaxiralar */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Достаточный запас' : 'Zaxirasi yetarli'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {sufficientCount} ta mahsulot
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {lang === 'ru' ? 'Производство обеспечено' : 'Ishlab chiqarishga yetarli'}
          </p>
        </div>

        {/* Card 4: Kam Qolgan yoki Tugagan */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Мало / Закончилось' : 'Kam qolgan / Tugagan'}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {lowOrOutCount} ta
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {lang === 'ru' ? 'Требуется закупка' : 'Ta’minot buyurtmasi kerak'}
          </p>
        </div>
      </div>

      {/* 2. Toolbar & Drill-down Breadcrumb */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedCardProduct ? (
            <button
              onClick={() => setSelectedCardProduct(null)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ChevronLeft size={14} />
              <span>{lang === 'ru' ? 'Все позиции склада' : 'Barcha mahsulotlar (Omborga qaytish)'}</span>
            </button>
          ) : (
            <>
              {/* Unit Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setUnitFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    unitFilter === 'ALL'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {lang === 'ru' ? 'Все' : 'Barchasi'} ({products.length})
                </button>
                <button
                  onClick={() => setUnitFilter('kg')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    unitFilter === 'kg'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  <Scale size={13} />
                  <span>{lang === 'ru' ? 'Вес' : 'Vazn'}</span>
                </button>
                <button
                  onClick={() => setUnitFilter('dona')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    unitFilter === 'dona'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  <Boxes size={13} />
                  <span>{lang === 'ru' ? 'Шт' : 'Dona'}</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ru' ? 'Все статусы' : 'Barcha holat'}
                </button>
                <button
                  onClick={() => setStatusFilter('NORMAL')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'NORMAL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  {lang === 'ru' ? 'В норме' : 'Yetarli'}
                </button>
                <button
                  onClick={() => setStatusFilter('WARNING')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'WARNING'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {lang === 'ru' ? 'Внимание' : 'Kam'}
                </button>
                <button
                  onClick={() => setStatusFilter('CRITICAL')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50'
                  }`}
                >
                  {lang === 'ru' ? 'Критично' : 'Tugagan'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!selectedCardProduct && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Поиск сырья...' : 'Mahsulotni qidirish...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>
          )}

          {/* Toggle between Card Drill-down and Full Table */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('cards')
                setSelectedCardProduct(null)
              }}
              title={lang === 'ru' ? 'Карточки (drill-down)' : 'Kartochkalar (Drill-down)'}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => {
                setViewMode('table')
                setSelectedCardProduct(null)
              }}
              title={lang === 'ru' ? 'Полная таблица' : 'To‘liq jadval'}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <TableIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. LEVEL 1: Clean Drill-Down Cards Grid (Default view) */}
      {viewMode === 'cards' && !selectedCardProduct && (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'ru' ? 'Номенклатура склада сырья и материалов' : 'Omborxona mahsulotlari va zaxira holati'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'ru'
                  ? 'Выберите любой продукт для подробного анализа остатков, расхода и сроков хранения'
                  : 'Mahsulot ustiga bosib qoldiq, sarf va zaxira muddati tahliliga kiring (Drill-down)'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {sorted.length} {lang === 'ru' ? 'позиций' : 'ta mahsulot'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {sorted.map((item) => {
              const isDona = item.unit === 'dona'
              const stockFormatted = isDona
                ? `${Math.round(item.currentStockKg).toLocaleString('uz-UZ')} dona`
                : `${(item.currentStockKg / 1000).toFixed(2)} tn`

              return (
                <button
                  key={item.productName}
                  onClick={() => setSelectedCardProduct(item)}
                  className="p-5 text-left hover:bg-emerald-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isDona
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {isDona ? 'Dona' : 'Vazn'}
                      </span>
                      {renderInventoryStatusPill(item.inventoryStatus)}
                    </div>

                    <b className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 block">
                      {item.productName}
                    </b>

                    <div className="mt-2 text-lg font-black font-mono text-slate-900 dark:text-white">
                      {stockFormatted}
                      {!isDona && (
                        <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">
                          ({item.currentStockKg.toLocaleString()} kg)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {item.stockCoverageDays !== null && item.stockCoverageDays !== undefined ? (
                        item.inventoryStatus === 'EXCESS' ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            ~{item.stockCoverageDays} kunga yetadi (Max: {item.approvedMaxStorageDays ?? '-'} kun — Ortiqcha)
                          </span>
                        ) : item.inventoryStatus === 'LOW' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            ~{item.stockCoverageDays} kunga yetadi (Kam qolgan)
                          </span>
                        ) : (
                          <span>
                            ~{item.stockCoverageDays} kunga yetadi{item.approvedMaxStorageDays ? ` (Max: ${item.approvedMaxStorageDays} kun)` : ''}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">
                          {item.approvedMaxStorageDays ? `Max: ${item.approvedMaxStorageDays} kun saqlanadi` : 'Kunlik sarf yo‘q'}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      {lang === 'ru' ? 'Анализ' : 'Tahlil'} &rarr;
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {!sorted.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Позиции не найдены.' : 'Mahsulotlar topilmadi.'}
            </div>
          )}
        </div>
      )}

      {/* 4. LEVEL 2: Drill-Down Details for Selected Product */}
      {viewMode === 'cards' && selectedCardProduct && (
        <div className="space-y-3">
          {/* Detailed Product Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  {lang === 'ru' ? 'Анализ остатков и покрытия запасов' : 'Mahsulot zaxirasi va qoplash tahlili'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedCardProduct.productName}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {renderInventoryStatusPill(selectedCardProduct.inventoryStatus)}
                <button
                  onClick={() => onSelectProduct(selectedCardProduct)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Layers size={14} />
                  <span>{lang === 'ru' ? 'Подробный анализ' : 'Batafsil tahlil'}</span>
                </button>
              </div>
            </div>

            {/* 4 Detail Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Текущий остаток' : 'Joriy ombor qoldig‘i'}
                </span>
                <div className="mt-1 text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedCardProduct.unit === 'dona'
                    ? `${Math.round(selectedCardProduct.currentStockKg).toLocaleString('uz-UZ')} dona`
                    : `${(selectedCardProduct.currentStockKg / 1000).toFixed(2)} tn`}
                </div>
                {selectedCardProduct.unit !== 'dona' && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedCardProduct.currentStockKg.toLocaleString()} kg
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Средний расход в день' : 'O‘rtacha kunlik sarf'}
                </span>
                <div className="mt-1 text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedCardProduct.avgDailyConsumptionKg
                    ? `${selectedCardProduct.avgDailyConsumptionKg.toLocaleString()} ${selectedCardProduct.unit}/kun`
                    : '—'}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedCardProduct.avgWeeklyConsumptionKg
                    ? `~${selectedCardProduct.avgWeeklyConsumptionKg.toLocaleString()} ${selectedCardProduct.unit}/hafta`
                    : 'Haftalik hisob yo‘q'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Покрытие запаса' : 'Zaxira yetishi'}
                </span>
                <div className="mt-1 text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {selectedCardProduct.stockCoverageDays !== null && selectedCardProduct.stockCoverageDays !== undefined
                    ? `${selectedCardProduct.stockCoverageDays} kun`
                    : '—'}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedCardProduct.stockCoverageWeeks
                    ? `~${selectedCardProduct.stockCoverageWeeks} hafta`
                    : 'Kunlik sarf bo‘yicha'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Макс. срок хранения' : 'Tasdiqlangan me’yor'}
                </span>
                <div className="mt-1 text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedCardProduct.approvedMaxStorageDays
                    ? `${selectedCardProduct.approvedMaxStorageDays} kun`
                    : (lang === 'ru' ? 'Не задан' : 'Kiritilmagan')}
                </div>
                <button
                  onClick={onOpenStandards}
                  className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline block"
                >
                  {lang === 'ru' ? 'Изменить норму ⚙️' : 'Me’yorni sozlash ⚙️'}
                </button>
              </div>
            </div>
          </div>

          {/* 5-Step Clear Balance Breakdown for Selected Product */}
          <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 p-5 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
              {lang === 'ru' ? 'Движение остатков по выбранному продукту' : 'Mahsulot harakatlari va balansi zanjiri'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              {/* 1. Boshlang'ich qoldiq */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800/70 border border-slate-200 dark:border-dark-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  1. Boshlang‘ich qoldiq
                </span>
                <b className="mt-1 block text-base font-mono text-slate-700 dark:text-slate-300">
                  {(selectedCardProduct.openingStockKg || 0).toLocaleString()} {selectedCardProduct.unit}
                </b>
                <span className="text-[10px] text-slate-400">Davr boshida omborda bo‘lgan</span>
              </div>

              {/* 2. Kirim */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">
                  2. Qabul kirim (+)
                </span>
                <b className="mt-1 block text-base font-mono text-emerald-700 dark:text-emerald-400">
                  {selectedCardProduct.inflowKg > 0 ? `+${selectedCardProduct.inflowKg.toLocaleString()}` : '0'}{' '}
                  {selectedCardProduct.unit}
                </b>
                <span className="text-[10px] text-emerald-600/80">Partiyalar orqali qabul qilingan</span>
              </div>

              {/* 3. Chiqim */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase block">
                  3. Sexlarga sarf (-)
                </span>
                <b className="mt-1 block text-base font-mono text-blue-700 dark:text-blue-400">
                  {(selectedCardProduct.consumedKg || 0) > 0 ? `-${(selectedCardProduct.consumedKg || 0).toLocaleString()}` : '0'}{' '}
                  {selectedCardProduct.unit}
                </b>
                <span className="text-[10px] text-blue-600/80">Ishlab chiqarishga berilgan</span>
              </div>

              {/* 4. Chiqindi */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase block">
                  4. Chiqindi & Yo‘qotish (-)
                </span>
                <b className="mt-1 block text-base font-mono text-rose-700 dark:text-rose-400">
                  {((selectedCardProduct.techWasteKg || 0) + (selectedCardProduct.actualDefectKg || 0)).toLocaleString()}{' '}
                  {selectedCardProduct.unit}
                </b>
                <span className="text-[10px] text-rose-600/80">Tozalash va sifat chetlanishi</span>
              </div>

              {/* 5. Joriy Qoldiq */}
              <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md">
                <span className="text-[10px] text-emerald-100 font-bold uppercase block">
                  5. Joriy Ombor Qoldig‘i (=)
                </span>
                <b className="mt-1 block text-base font-mono text-white">
                  {selectedCardProduct.currentStockKg.toLocaleString()} {selectedCardProduct.unit}
                </b>
                <span className="text-[10px] text-emerald-100">Ayni paytda ombordagi sof qoldiq</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEVEL 3: Full Table View (When toggled to table) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex flex-col gap-3.5 bg-slate-50/70 dark:bg-dark-850/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {lang === 'ru' ? 'Полная сводная таблица баланса' : 'Xomashyo balansi, zaxira qoplash muddati va og‘ishlar'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {lang === 'ru'
                    ? 'Нажмите на любую позицию для подробного 4-этапного аудита'
                    : 'Batafsil 4-bosqichli tahlil va zaxira me’yorlarini ko‘rish uchun istalgan mahsulot ustiga bosing'}
                </p>
              </div>
              <button
                onClick={onOpenStandards}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750 flex items-center gap-1.5 self-start sm:self-auto"
              >
                ⚙️ {lang === 'ru' ? 'Нормы' : 'Me’yorlar'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1160px]">
              <thead className="bg-slate-100/80 dark:bg-dark-800/80 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-dark-750">
                <tr>
                  <th className="p-3.5 pl-4 w-10 text-center">№</th>
                  <th className="p-3.5">{lang === 'ru' ? 'Сырье / Номенклатура' : 'Xomashyo nomi'}</th>
                  <th
                    onClick={() => handleSort('inflowKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Принято' : 'Qabul kirim'} {renderSortIndicator('inflowKg')}
                  </th>
                  <th
                    onClick={() => handleSort('consumedKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Расход / Ср. день' : 'Sarf / Kunlik o‘rt.'} {renderSortIndicator('consumedKg')}
                  </th>
                  <th
                    onClick={() => handleSort('outputKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Выпуск ГП / Выход %' : 'Tayyor chiqim / Chiqish %'} {renderSortIndicator('outputKg')}
                  </th>
                  <th
                    onClick={() => handleSort('techWasteKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Тех. отход' : 'Tozalash chiqindisi'} {renderSortIndicator('techWasteKg')}
                  </th>
                  <th
                    onClick={() => handleSort('actualDefectKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Брак' : 'Haqiqiy brak'} {renderSortIndicator('actualDefectKg')}
                  </th>
                  <th
                    onClick={() => handleSort('currentStockKg')}
                    className="p-3.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Остаток на складе' : 'Ombor qoldig‘i'} {renderSortIndicator('currentStockKg')}
                  </th>
                  <th className="p-3.5 text-center">{lang === 'ru' ? 'Норма %' : 'Me’yor %'}</th>
                  <th
                    onClick={() => handleSort('actualLossPercent')}
                    className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Факт потери %' : 'Haqiqiy yo‘qotish %'} {renderSortIndicator('actualLossPercent')}
                  </th>
                  <th
                    onClick={() => handleSort('variancePercent')}
                    className="p-3.5 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
                  >
                    {lang === 'ru' ? 'Отклонение' : 'Me’yordan og‘ish'} {renderSortIndicator('variancePercent')}
                  </th>
                  <th className="p-3.5 text-center pr-4">{lang === 'ru' ? 'Статус' : 'Holat'}</th>
                  <th className="p-3.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-xs font-semibold">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={13} className="p-4 bg-slate-50/50 dark:bg-dark-850/30">
                        <div className="h-5 bg-slate-200 dark:bg-dark-750 rounded" />
                      </td>
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-1.5">
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {lang === 'ru' ? 'Данные не найдены' : 'Ma’lumot topilmadi'}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'ru'
                            ? 'За выбранный период операционные данные отсутствуют'
                            : 'Tanlangan davr uchun hech qanday xomashyo harakati mavjud emas'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((item, idx) => {
                    const yieldVal = item.productionYieldPercent ?? item.yieldPercent
                    return (
                      <tr
                        key={item.productName}
                        onClick={() => onSelectProduct(item)}
                        className="group hover:bg-emerald-50/40 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 pl-4 text-center font-mono text-[11px] font-black text-slate-400 group-hover:text-emerald-600">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>{item.productName}</span>
                          </div>
                          {item.approvedMaxStorageDays && (
                            <span className="text-[10px] text-slate-400 font-normal block pl-4">
                              {lang === 'ru' ? 'Макс. срок:' : 'Maks. saqlash:'} {item.approvedMaxStorageDays}{' '}
                              {lang === 'ru' ? 'дн.' : 'kun'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-800 dark:text-slate-200">
                          <div>{item.inflowKg > 0 ? `${item.inflowKg.toLocaleString()} ${item.unit}` : '—'}</div>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          <div>{(item.consumedKg || 0) > 0 ? `${item.consumedKg?.toLocaleString()} ${item.unit}` : '—'}</div>
                          {item.avgDailyConsumptionKg !== null && item.avgDailyConsumptionKg !== undefined && (
                            <span className="text-[10px] text-slate-400 block">
                              ~{item.avgDailyConsumptionKg.toLocaleString()} {item.unit}/kun
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <div>{item.outputKg > 0 ? `${item.outputKg.toLocaleString()} ${item.unit}` : '—'}</div>
                          {yieldVal !== null && yieldVal !== undefined && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">
                              {lang === 'ru' ? 'Выход:' : 'Chiqish:'} {yieldVal}%
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                          {item.techWasteKg > 0 ? `${item.techWasteKg.toLocaleString()} ${item.unit}` : '0'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {item.actualDefectKg > 0 ? `${item.actualDefectKg.toLocaleString()} ${item.unit}` : '0'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{item.currentStockKg.toLocaleString()} {item.unit}</span>
                            {renderInventoryStatusPill(item.inventoryStatus)}
                          </div>
                          {item.stockCoverageDays !== null && item.stockCoverageDays !== undefined && (
                            <span className="text-[10px] text-slate-400 block">
                              {item.stockCoverageDays} kun
                            </span>
                          )}
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
                        <td className="p-3.5 text-center pr-4">{renderStatusBadge(item.status)}</td>
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
      )}
    </div>
  )
}

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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'
import {
  resolveProductMeta,
  getLocalizedName,
  getTrilingualInfo,
  formatTrilingualProductName,
  ProductMeta,
  ProductCategory,
} from '@/lib/productTaxonomy'

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
  items?: DefectItem[]
  dateFrom?: string
  dateTo?: string
  lang?: string
}

export interface DefectProductSummary {
  canonicalId: string
  name: string
  rawNames: Set<string>
  meta: ProductMeta
  count: number
  totalQty: number
  unit: string
  category: ProductCategory
  reasons: Set<string>
}

export default function DefectMaterialsAnalysis({ items, dateFrom = '', dateTo = '', lang = 'uz' }: Props) {
  const [fetchedItems, setFetchedItems] = useState<DefectItem[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PRIMARY' | 'SECONDARY' | 'kg' | 'dona'>('ALL')
  const [selectedCanonicalId, setSelectedCanonicalId] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<DefectItem | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // Auto-fetch if items are not passed via props
  React.useEffect(() => {
    if (items && items.length > 0) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const p = new URLSearchParams()
        if (dateFrom) p.set('dateFrom', dateFrom)
        if (dateTo) p.set('dateTo', dateTo)
        const res = await fetch(`/api/director/wastage-logs?${p}`, { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json?.records) {
          const mapped: DefectItem[] = json.records.map((r: any) => ({
            id: String(r.id),
            type: 'BRAK',
            defectNumber: r.incidentNumber || `BRK-${r.id}`,
            productName: r.productName,
            batchNumber: r.batchNumber || '',
            quantityKg: Number(r.weightKg || 0),
            unit: 'kg',
            reason: r.reasonCategory || r.detailedComment || 'Sifat chetlanishi',
            date: r.incidentDate,
            responsible: r.responsiblePersonName || r.reportedByName || 'Sifat nazorati',
            status: r.stage,
          }))
          setFetchedItems(mapped)
        }
      } catch (e) {
        console.error('Failed to fetch defect items:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [items, dateFrom, dateTo])

  const effectiveItems = useMemo(() => {
    return items && items.length > 0 ? items : fetchedItems
  }, [items, fetchedItems])

  // 1. Separate totals for KG and DONA
  const totalKg = useMemo(() => {
    return effectiveItems
      .filter((i) => {
        const meta = resolveProductMeta(i.productName)
        return meta.unit === 'kg'
      })
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [effectiveItems])

  const totalDona = useMemo(() => {
    return effectiveItems
      .filter((i) => {
        const meta = resolveProductMeta(i.productName)
        return meta.unit === 'dona'
      })
      .reduce((sum, i) => sum + (i.quantityKg || 0), 0)
  }, [effectiveItems])

  // 2. Group items by canonical product
  const allProductsSummary = useMemo<DefectProductSummary[]>(() => {
    const map = new Map<
      string,
      {
        canonicalId: string
        meta: ProductMeta
        rawNames: Set<string>
        count: number
        totalQty: number
        unit: string
        category: ProductCategory
        reasons: Set<string>
      }
    >()

    effectiveItems.forEach((item) => {
      const rawName = (item.productName || '').trim()
      if (!rawName) return

      const meta = resolveProductMeta(rawName)
      const canonicalId = meta.canonicalId
      const unit = meta.unit

      let existing = map.get(canonicalId)
      if (!existing) {
        existing = {
          canonicalId,
          meta,
          rawNames: new Set<string>(),
          count: 0,
          totalQty: 0,
          unit,
          category: meta.category,
          reasons: new Set<string>(),
        }
        map.set(canonicalId, existing)
      }

      existing.rawNames.add(rawName)
      existing.count += 1
      existing.totalQty += item.quantityKg || 0
      if (item.reason) existing.reasons.add(item.reason)
    })

    const groups: DefectProductSummary[] = Array.from(map.values()).map((g) => {
      const localizedName = lang === 'ru' ? g.meta.ru : lang === 'en' ? g.meta.en : g.meta.uz
      return {
        canonicalId: g.canonicalId,
        name: localizedName,
        rawNames: g.rawNames,
        meta: g.meta,
        count: g.count,
        totalQty: g.totalQty,
        unit: g.unit,
        category: g.category,
        reasons: g.reasons,
      }
    })

    // Strict Requirement 6: PRIMARY products first, SECONDARY products below!
    return groups.sort((a, b) => {
      if (a.category === 'PRIMARY' && b.category !== 'PRIMARY') return -1
      if (a.category !== 'PRIMARY' && b.category === 'PRIMARY') return 1
      return b.totalQty - a.totalQty
    })
  }, [effectiveItems, lang])

  // Filter products by category tab & search
  const visibleProductsSummary = useMemo(() => {
    let list = allProductsSummary
    if (categoryFilter === 'PRIMARY') {
      list = list.filter((p) => p.category === 'PRIMARY')
    } else if (categoryFilter === 'SECONDARY') {
      list = list.filter((p) => p.category === 'SECONDARY')
    } else if (categoryFilter === 'kg') {
      list = list.filter((p) => p.unit === 'kg')
    } else if (categoryFilter === 'dona') {
      list = list.filter((p) => p.unit === 'dona')
    }

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim()
      list = list.filter((p) => {
        const tri = getTrilingualInfo(p.meta.uz, lang)
        return (
          p.name.toLowerCase().includes(q) ||
          p.meta.uz.toLowerCase().includes(q) ||
          p.meta.ru.toLowerCase().includes(q) ||
          p.meta.en.toLowerCase().includes(q) ||
          tri.secondary.toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [allProductsSummary, categoryFilter, productSearch, lang])

  // Selected product summary stats
  const selectedProductSummary = useMemo(() => {
    if (!selectedCanonicalId) return null
    return allProductsSummary.find((p) => p.canonicalId === selectedCanonicalId) || null
  }, [allProductsSummary, selectedCanonicalId])

  // Filtered records when a product is selected (Chronological Ascending Sort)
  const filteredRecords = useMemo(() => {
    if (!selectedCanonicalId || !selectedProductSummary) return []
    const rawSet = selectedProductSummary.rawNames

    const matches = effectiveItems.filter((item) => {
      const rawName = (item.productName || '').trim()
      if (!rawSet.has(rawName)) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.batchNumber?.toLowerCase().includes(q) ||
        item.defectNumber?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q) ||
        item.responsible?.toLowerCase().includes(q) ||
        item.date?.includes(q)
      )
    })

    const extractBatchNum = (str?: string) => {
      const m = (str || '').match(/\b(\d+)\b/)
      return m ? parseInt(m[1], 10) : 0
    }

    return matches.sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      const dateCmp = dateA.localeCompare(dateB)

      const batchA = extractBatchNum(a.batchNumber)
      const batchB = extractBatchNum(b.batchNumber)
      const batchCmp = batchA - batchB

      let result = 0
      if (dateCmp !== 0) {
        result = dateCmp
      } else {
        result = batchCmp !== 0 ? batchCmp : (a.id || '').localeCompare(b.id || '')
      }

      return sortOrder === 'asc' ? result : -result
    })
  }, [effectiveItems, selectedCanonicalId, selectedProductSummary, search, sortOrder])

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
        {/* Card 1: Xomashyo braki (KG) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Вес брака (Сырье)' : 'Vazn (Xomashyo braki)'}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatKgOnly(totalKg)} kg
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {(totalKg / 1000).toFixed(1)} tn • {allProductsSummary.filter((p) => p.unit === 'kg').length}{' '}
            {lang === 'ru' ? 'видов сырья' : 'xil xomashyo'}
          </p>
        </div>

        {/* Card 2: Qadoq braki (DONA) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Штучный брак (Тара)' : 'Dona (Tara va qadoq)'}</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {Math.round(totalDona).toLocaleString('uz-UZ')} dona
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.filter((p) => p.unit === 'dona').length}{' '}
            {lang === 'ru' ? 'видов упаковки' : 'xil qadoq va tara'}
          </p>
        </div>

        {/* Card 3: Brak dalolatnomalari soni */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Акты брака' : 'Brak dalolatnomalari'}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {effectiveItems.length.toLocaleString('uz-UZ')} {lang === 'ru' ? 'актов' : 'ta'}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.length} {lang === 'ru' ? 'уникальных позиций' : 'unikal pozitsiya (birlashtirilgan)'}
          </p>
        </div>

        {/* Card 4: Asosiy sabab */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Контроль брака' : 'Brak nazorati'}</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            100%
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium truncate">
            Qabul, Sex va Ombor nazorati
          </p>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedCanonicalId ? (
            <button
              onClick={() => {
                setSelectedCanonicalId('')
                setSearch('')
                setPage(1)
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              &larr; {lang === 'ru' ? 'Все продукты' : 'Barcha mahsulotlar'}
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl flex-wrap">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'ALL'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'ru' ? 'Все позиции' : 'Barchasi'} ({allProductsSummary.length})
              </button>
              <button
                onClick={() => setCategoryFilter('PRIMARY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'PRIMARY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <Sparkles size={13} />
                <span>{lang === 'ru' ? 'Основное сырье' : 'Asosiy xomashyo'}</span>
                <span className="opacity-80 text-[11px]">
                  ({allProductsSummary.filter((p) => p.category === 'PRIMARY').length})
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('SECONDARY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'SECONDARY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                }`}
              >
                <Boxes size={13} />
                <span>{lang === 'ru' ? 'Вторичные материалы / тара' : 'Ikkilamchi vositalar'}</span>
                <span className="opacity-80 text-[11px]">
                  ({allProductsSummary.filter((p) => p.category === 'SECONDARY').length})
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('kg')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  categoryFilter === 'kg'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Scale size={12} />
                <span>kg</span>
              </button>
              <button
                onClick={() => setCategoryFilter('dona')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  categoryFilter === 'dona'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Boxes size={12} />
                <span>dona</span>
              </button>
            </div>
          )}

          {selectedProductSummary && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white px-2">
                {selectedProductSummary.name}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                ({getTrilingualInfo(selectedProductSummary.meta.uz, lang).secondary})
              </span>
            </div>
          )}
        </div>

        {selectedCanonicalId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors shadow-2xs"
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp size={14} className="text-emerald-600" />
                  <span>{lang === 'ru' ? 'По возрастанию (ранние)' : 'Kichikdan yuqoriga ↑'}</span>
                </>
              ) : (
                <>
                  <ArrowDown size={14} className="text-blue-600" />
                  <span>{lang === 'ru' ? 'По убыванию (новые)' : 'Kattadan kichikka ↓'}</span>
                </>
              )}
            </button>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Поиск по партии / причине...' : 'Partiya / sabab bo‘yicha qidirish...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 w-52 sm:w-60"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск продукта (UZ / RU / EN)...' : 'Mahsulotni qidirish (UZ / RU / EN)...'}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 w-48 sm:w-64"
            />
          </div>
        )}
      </div>

      {/* 3. Product Cards Grid */}
      {!selectedCanonicalId ? (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span>
                  {categoryFilter === 'PRIMARY'
                    ? lang === 'ru' ? 'Основное сырье и овощи (Брак)' : 'Asosiy xomashyo va sabzavotlar braki'
                    : categoryFilter === 'SECONDARY'
                    ? lang === 'ru' ? 'Вторичные материалы и тара (Брак)' : 'Ikkilamchi vositalar va taralar braki'
                    : lang === 'ru' ? 'Все забракованные материалы (Унифицированные)' : 'Brak qayd etilgan barcha mahsulotlar'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {visibleProductsSummary.length} {lang === 'ru' ? 'позиций' : 'ta mahsulot'}
                </span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {visibleProductsSummary.map((row) => (
              <button
                key={row.canonicalId}
                onClick={() => {
                  setSelectedCanonicalId(row.canonicalId)
                  setSearch('')
                  setPage(1)
                }}
                className="p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-dark-800/80 transition-colors group flex items-center justify-between gap-4 cursor-pointer min-h-[72px]"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    {formatTrilingualProductName(row.meta)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                  <span>{lang === 'ru' ? 'Подробнее' : 'Batafsil'}</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          {!visibleProductsSummary.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <span>Brak ma’lumotlari yuklanmoqda...</span>
                </div>
              ) : lang === 'ru' ? (
                'Данные брака не найдены.'
              ) : (
                'Brak ma’lumotlari topilmadi.'
              )}
            </div>
          )}
        </div>
      ) : (
        /* 4. Inside Product: Filtered Records Table */
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  {lang === 'ru' ? 'Брак по выбранному продукту' : 'Tanlangan mahsulot braki'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedProductSummary?.name}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {getTrilingualInfo(selectedProductSummary?.meta.uz, lang).secondary}
                </p>
              </div>
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl ${
                  selectedProductSummary?.unit === 'dona'
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {selectedProductSummary?.unit === 'dona' ? (lang === 'ru' ? 'ШТ' : 'DONA') : (lang === 'ru' ? 'ВЕС' : 'VAZN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Общий объем брака' : 'Jami brak miqdori'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {formatQty(selectedProductSummary?.totalQty || 0, selectedProductSummary?.unit)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Количество актов' : 'Dalolatnomalar soni'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.count || 0} ta
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200/70 dark:border-dark-700/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ru' ? 'Причины брака' : 'Brak sabablari'}
                </span>
                <div className="mt-1 text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                  {selectedProductSummary?.reasons.size || 0} xil
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-2xs">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
                  >
                    <div className="flex items-center gap-1">
                      <span>{lang === 'ru' ? 'Дата' : 'Sana'}</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-3.5">{lang === 'ru' ? 'Наименование' : 'Nomi'}</th>
                  <th className="p-3.5">{lang === 'ru' ? 'Причина' : 'Sabab'}</th>
                  <th className="p-3.5 text-right">{lang === 'ru' ? 'Количество / Вес' : 'Miqdor / Vazn'}</th>
                  <th className="p-3.5">{lang === 'ru' ? 'Ответственный' : "Mas'ul"}</th>
                  <th className="p-3.5">{lang === 'ru' ? 'Номер партии / Акт' : 'Partiya / Akt'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                {paginatedRecords.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-rose-50/50 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono text-slate-900 dark:text-white">
                      <span className="font-bold">{item.date}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>
                        <span>{getLocalizedName(item.productName, lang)}</span>
                        {item.productName !== getLocalizedName(item.productName, lang) && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {item.productName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-rose-600 dark:text-rose-400 font-medium">
                      <span>{item.reason || 'Sifat chetlanishi'}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatQty(item.quantityKg, item.unit)}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">
                      {item.responsible || 'Sifat nazorati'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.defectNumber || item.batchNumber || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!paginatedRecords.length && (
              <div className="p-12 text-center text-sm text-slate-400">
                {lang === 'ru' ? 'Записи брака не найдены.' : 'Brak yozuvlari topilmadi.'}
              </div>
            )}

            <div className="p-3.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                {lang === 'ru' ? 'Всего:' : 'Jami:'}{' '}
                <b className="text-slate-900 dark:text-white font-mono">{filteredRecords.length}</b>{' '}
                {lang === 'ru' ? 'записей' : 'ta yozuv'}
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

      {/* 5. Detail Drawer Modal */}
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
                <p className="text-[11px] font-black tracking-wider text-rose-600 uppercase">
                  {lang === 'ru' ? 'Акт брака' : 'Brak dalolatnomasi'}
                </p>
                <h3 className="font-mono font-black text-xl text-slate-900 dark:text-white">
                  {selectedItem.defectNumber || selectedItem.batchNumber || 'BRAK'}
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
              <Detail
                label={lang === 'ru' ? 'Продукт' : 'Mahsulot'}
                value={`${getLocalizedName(selectedItem.productName, lang)} (${selectedItem.productName})`}
              />
              <Detail label={lang === 'ru' ? 'Дата' : 'Sana'} value={selectedItem.date} />
              <Detail
                label={lang === 'ru' ? 'Причина' : 'Sabab'}
                value={selectedItem.reason || 'Sifat chetlanishi'}
              />
              <Detail
                label={lang === 'ru' ? 'Количество / Вес' : 'Miqdori / Vazni'}
                value={formatQty(selectedItem.quantityKg, selectedItem.unit)}
              />
              <Detail
                label={lang === 'ru' ? 'Ответственный' : "Mas'ul"}
                value={selectedItem.responsible || 'Sifat nazorati'}
              />
              <Detail
                label={lang === 'ru' ? 'Номер партии' : 'Partiya raqami'}
                value={selectedItem.batchNumber || '—'}
              />
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

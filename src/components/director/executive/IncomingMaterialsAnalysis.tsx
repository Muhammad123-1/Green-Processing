'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  ExternalLink,
  Calendar,
  Building2,
  Package,
} from 'lucide-react'
import {
  resolveProductMeta,
  getLocalizedName,
  getTrilingualInfo,
  ProductMeta,
  ProductCategory,
} from '@/lib/productTaxonomy'

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

export interface ProductSummaryGroup {
  canonicalId: string
  name: string
  rawNames: Set<string>
  meta: ProductMeta
  count: number
  totalQty: number
  unit: string
  category: ProductCategory
  suppliers: Set<string>
  supplierDetails: { name: string; count: number; totalQty: number; lastDate: string }[]
}

export function isNoBatch(val?: string, raw?: string): boolean {
  const cleanRaw = (raw || '').trim().toUpperCase()
  const cleanVal = (val || '').trim().toUpperCase()

  if (
    cleanRaw &&
    !cleanRaw.startsWith('PAR-') &&
    !cleanRaw.startsWith('SA-') &&
    !cleanRaw.startsWith('ARR-') &&
    !cleanRaw.startsWith('AKT-') &&
    !cleanRaw.startsWith('ACT-') &&
    !cleanRaw.includes('AKT') &&
    !cleanRaw.includes('ACT') &&
    !cleanRaw.includes('RAD ETISH') &&
    cleanRaw !== '-' &&
    cleanRaw !== 'YOZILMAGAN' &&
    cleanRaw !== 'PARTIYA YOZILMAGAN' &&
    cleanRaw !== 'ПАРТИЯ НЕ УКАЗАНА' &&
    cleanRaw !== 'NO_BATCH'
  ) {
    return false
  }

  if (!cleanVal) return true
  if (
    cleanVal.includes('PAR-') ||
    cleanVal.includes('SA-') ||
    cleanVal.includes('ARR-') ||
    cleanVal.startsWith('AKT-') ||
    cleanVal.startsWith('ACT-') ||
    cleanVal.includes('AKT') ||
    cleanVal.includes('ACT') ||
    cleanVal.includes('RAD ETISH') ||
    cleanVal === 'PARTIYA YOZILMAGAN' ||
    cleanVal === 'ПАРТИЯ НЕ УКАЗАНА' ||
    cleanVal === '-' ||
    cleanVal === 'NO_BATCH' ||
    cleanVal === 'PARTIYA #' ||
    cleanVal === 'PARTIYA'
  ) {
    return true
  }

  const afterHash = cleanVal.replace(/^PARTIYA\s*#?\s*/, '').trim()
  if (
    !afterHash ||
    afterHash.startsWith('PAR-') ||
    afterHash.startsWith('SA-') ||
    afterHash.startsWith('ARR-') ||
    afterHash.startsWith('AKT-') ||
    afterHash.startsWith('ACT-') ||
    afterHash.includes('AKT') ||
    afterHash.includes('ACT') ||
    afterHash === '-' ||
    afterHash === 'YOZILMAGAN'
  ) {
    return true
  }

  return false
}

export function formatBatchNumber(
  val?: string,
  raw?: string,
  lang: string = 'uz'
): { text: string; isMissing: boolean } {
  if (isNoBatch(val, raw)) {
    return {
      text: lang === 'ru' ? 'Партия не указана' : 'Partiya yozilmagan',
      isMissing: true,
    }
  }

  if (raw && raw.trim()) {
    const r = raw.trim()
    return {
      text: r.toLowerCase().startsWith('partiya') ? r : `Partiya #${r}`,
      isMissing: false,
    }
  }

  if (val && val.trim()) {
    const v = val.trim()
    return {
      text: v.toLowerCase().startsWith('partiya') ? v : `Partiya #${v}`,
      isMissing: false,
    }
  }

  return {
    text: lang === 'ru' ? 'Партия не указана' : 'Partiya yozilmagan',
    isMissing: true,
  }
}

export default function IncomingMaterialsAnalysis({
  items = [],
  dateFrom = '',
  dateTo = '',
  lang = 'uz',
}: Props) {
  const [fetchedItems, setFetchedItems] = useState<IncomingItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PRIMARY' | 'SECONDARY' | 'kg' | 'dona'>('ALL')
  const [selectedCanonicalId, setSelectedCanonicalId] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<IncomingItem | null>(null)
  const [showSuppliersModal, setShowSuppliersModal] = useState<boolean>(false)
  const [supplierSearch, setSupplierSearch] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc') // Requirement 3: Default ascending (kichikdan yuqoriga)
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  useEffect(() => {
    setMounted(true)
  }, [])

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
            batchNumber: r.batchNumber
              ? `Partiya #${r.batchNumber}`
              : 'Partiya yozilmagan',
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

  // 2. Canonical Product Summaries with Trilingual names & Primary vs Secondary prioritization
  const allProductsSummary = useMemo<ProductSummaryGroup[]>(() => {
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
        suppliersMap: Map<string, { count: number; totalQty: number; lastDate: string }>
      }
    >()

    effectiveItems.forEach((item) => {
      const rawName = (item.productName || '').trim()
      if (!rawName) return

      const meta = resolveProductMeta(rawName)
      const canonicalId = meta.canonicalId
      const unit = meta.unit
      const supplier =
        item.supplierName &&
        item.supplierName !== 'Yetkazib beruvchi' &&
        item.supplierName !== "Ko'rsatilmagan"
          ? item.supplierName.trim()
          : ''

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
          suppliersMap: new Map(),
        }
        map.set(canonicalId, existing)
      }

      existing.rawNames.add(rawName)
      existing.count += 1
      existing.totalQty += item.quantityKg || 0

      if (supplier) {
        const sData = existing.suppliersMap.get(supplier) || { count: 0, totalQty: 0, lastDate: '' }
        sData.count += 1
        sData.totalQty += item.quantityKg || 0
        if (!sData.lastDate || item.date > sData.lastDate) {
          sData.lastDate = item.date
        }
        existing.suppliersMap.set(supplier, sData)
      }
    })

    const groups: ProductSummaryGroup[] = Array.from(map.values()).map((g) => {
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
        suppliers: new Set(g.suppliersMap.keys()),
        supplierDetails: Array.from(g.suppliersMap.entries())
          .map(([sName, sInfo]) => ({
            name: sName,
            count: sInfo.count,
            totalQty: sInfo.totalQty,
            lastDate: sInfo.lastDate,
          }))
          .sort((a, b) => b.totalQty - a.totalQty),
      }
    })

    // Strict Requirement 6: PRIMARY products first, SECONDARY products below!
    return groups.sort((a, b) => {
      if (a.category === 'PRIMARY' && b.category !== 'PRIMARY') return -1
      if (a.category !== 'PRIMARY' && b.category === 'PRIMARY') return 1
      return b.totalQty - a.totalQty
    })
  }, [effectiveItems, lang])

  // Distinct suppliers detailed list for Modal (Requirement 5)
  const suppliersDetailedList = useMemo(() => {
    const sMap = new Map<
      string,
      {
        name: string
        batchesCount: number
        totalKg: number
        totalDona: number
        products: Set<string>
        lastDate: string
        firstDate: string
      }
    >()

    effectiveItems.forEach((item) => {
      const sName = (item.supplierName || '').trim()
      if (!sName || sName === 'Yetkazib beruvchi' || sName === "Ko'rsatilmagan") return

      let s = sMap.get(sName)
      if (!s) {
        s = {
          name: sName,
          batchesCount: 0,
          totalKg: 0,
          totalDona: 0,
          products: new Set(),
          lastDate: '',
          firstDate: item.date || '',
        }
        sMap.set(sName, s)
      }

      s.batchesCount += 1
      const meta = resolveProductMeta(item.productName)
      const localized = lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.uz
      s.products.add(localized)

      if (meta.unit === 'dona' || item.unit === 'dona') {
        s.totalDona += item.quantityKg || 0
      } else {
        s.totalKg += item.quantityKg || 0
      }

      if (!s.lastDate || (item.date && item.date > s.lastDate)) s.lastDate = item.date
      if (!s.firstDate || (item.date && item.date < s.firstDate)) s.firstDate = item.date
    })

    return Array.from(sMap.values()).sort(
      (a, b) => b.totalKg - a.totalKg || b.batchesCount - a.batchesCount
    )
  }, [effectiveItems, lang])

  const topSuppliersText = useMemo(() => {
    return suppliersDetailedList.slice(0, 3).map((s) => s.name).join(', ')
  }, [suppliersDetailedList])

  // Filter products by selected category or unit tab & search
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

  // Filtered records when a product is selected
  // Requirement 3: Sana va partiyalar kichikdan yuqoriga ketadigan tartibda (Ascending sort)
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
        item.supplierName?.toLowerCase().includes(q) ||
        item.date?.includes(q) ||
        item.receivedBy?.toLowerCase().includes(q)
      )
    })

    // Extract numeric part of batch: e.g. "Partiya #8" -> 8
    const extractBatchNum = (str?: string, raw?: string) => {
      const s = `${raw || ''} ${str || ''}`
      const m = s.match(/\b(\d+)\b/)
      return m ? parseInt(m[1], 10) : 0
    }

    return matches.sort((a, b) => {
      // 1. Date comparison
      const dateA = a.date || ''
      const dateB = b.date || ''
      const dateCmp = dateA.localeCompare(dateB)

      // 2. Batch number comparison
      const batchA = extractBatchNum(a.batchNumber, a.rawBatch)
      const batchB = extractBatchNum(b.batchNumber, b.rawBatch)
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
      {/* 1. Top Stats Cards - 4 Key Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Xomashyo kirimi (KG) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Вес (Сырье)' : 'Vazn (Xomashyo)'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Scale size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatKgOnly(totalKg)} kg
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {(totalKg / 1000).toFixed(1)} tn • {allProductsSummary.filter((p) => p.unit === 'kg').length}{' '}
            {lang === 'ru' ? 'видов сырья' : 'xil xomashyo'}
          </p>
        </div>

        {/* Card 2: Qadoq va idishlar kirimi (DONA) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Штучные материалы' : 'Dona (Qadoq va tara)'}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {Math.round(totalDona).toLocaleString('uz-UZ')} dona
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {allProductsSummary.filter((p) => p.unit === 'dona').length}{' '}
            {lang === 'ru' ? 'видов упаковки' : 'xil qadoq va tara'}
          </p>
        </div>

        {/* Card 3: Jami kirim partiyalari (1,576 ta partiya, 50 ta unikal mahsulot) */}
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
            {allProductsSummary.length} {lang === 'ru' ? 'уникальных позиций' : 'unikal pozitsiya (birlashtirilgan)'}
          </p>
        </div>

        {/* Card 4: Ta'minotchilar (Interactive click opens Suppliers Modal - Requirement 5) */}
        <div
          onClick={() => setShowSuppliersModal(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          title={lang === 'ru' ? 'Нажмите, чтобы открыть список поставщиков' : "Ta'minotchilar to'liq ro'yxatini ko'rish uchun bosing"}
        >
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {lang === 'ru' ? 'Поставщики' : 'Yetkazib beruvchilar'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>{suppliersDetailedList.length}</span>
            <span className="text-xs font-normal text-slate-400">
              {lang === 'ru' ? 'поставщиков' : 'ta ta’minotchi'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate flex items-center gap-1 group-hover:underline">
            <span>{topSuppliersText || 'ECO-GROW, HORECHA, Меваланд'}</span>
            <span>&rarr;</span>
          </p>
        </div>
      </div>

      {/* 2. Filter Toolbar - Category Tabs: Barchasi / Asosiy xomashyo / Ikkilamchi vositalar / KG / Dona */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedCanonicalId ? (
            <button
              onClick={() => {
                setSelectedCanonicalId('')
                setSearch('')
                setPage(1)
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              &larr; {lang === 'ru' ? 'Все продукты' : 'Barcha mahsulotlar'}
            </button>
          ) : (
            /* Category and Unit Filters */
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
            {/* Requirement 3: Sort Order Toggle (Ascending vs Descending) */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors shadow-2xs"
              title={
                sortOrder === 'asc'
                  ? "Tartib: Kichikdan yuqoriga (O'sish tartibida)"
                  : 'Tartib: Kattadan kichikka (Kamayish tartibida)'
              }
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp size={14} className="text-emerald-600" />
                  <span>{lang === 'ru' ? 'По возрастанию (сначала ранние)' : 'Kichikdan yuqoriga ↑'}</span>
                </>
              ) : (
                <>
                  <ArrowDown size={14} className="text-blue-600" />
                  <span>{lang === 'ru' ? 'По убыванию (сначала новые)' : 'Kattadan kichikka ↓'}</span>
                </>
              )}
            </button>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  lang === 'ru'
                    ? 'Поиск по партии / поставщику...'
                    : 'Partiya / ta’minotchi bo‘yicha qidirish...'
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52 sm:w-60"
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
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
            />
          </div>
        )}
      </div>

      {/* 3. Product Cards Grid - Unified Canonical Products with Trilingual Labels */}
      {!selectedCanonicalId ? (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span>
                  {categoryFilter === 'PRIMARY'
                    ? lang === 'ru' ? 'Основное сырье и овощи' : 'Asosiy xomashyo va sabzavotlar'
                    : categoryFilter === 'SECONDARY'
                    ? lang === 'ru' ? 'Вторичные материалы, тара и упаковка' : 'Ikkilamchi vositalar, qadoq va taralar'
                    : categoryFilter === 'kg'
                    ? lang === 'ru' ? 'Весовое сырье' : 'Vazndagi xomashyolar'
                    : categoryFilter === 'dona'
                    ? lang === 'ru' ? 'Штучные материалы' : 'Donabay vositalar va taralar'
                    : lang === 'ru' ? 'Все поступившие материалы (Унифицированные)' : 'Qabul qilingan barcha mahsulotlar (Birlashtirilgan)'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {visibleProductsSummary.length} {lang === 'ru' ? 'позиций' : 'ta mahsulot'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {lang === 'ru'
                  ? 'Все дубликаты объединены, названия переведены на 3 языка, основное сырье расположено сверху'
                  : "Barcha takrorlanuvchi nomlar bitta qilindi, 3 tilda ko'rsatiladi, asosiy xomashyolar yuqorida"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {visibleProductsSummary.map((row) => {
              const tri = getTrilingualInfo(row.meta.uz, lang)
              const isPrimary = row.category === 'PRIMARY'

              return (
                <button
                  key={row.canonicalId}
                  onClick={() => {
                    setSelectedCanonicalId(row.canonicalId)
                    setSearch('')
                    setPage(1)
                  }}
                  className="p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-dark-800/80 transition-colors group flex flex-col justify-between min-h-[125px] relative"
                >
                  <div>
                    {/* Badge: Primary vs Secondary */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isPrimary
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                            : 'bg-slate-100 dark:bg-dark-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700'
                        }`}
                      >
                        {isPrimary && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        {tri.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {row.unit}
                      </span>
                    </div>

                    {/* Primary Name */}
                    <b className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 block">
                      {row.name}
                    </b>

                    {/* Multilingual Subtitle (e.g. Морковь • Carrot) */}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                      {tri.secondary}
                    </p>
                  </div>

                  {/* Summary Metric Numbers */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                        {formatQty(row.totalQty, row.unit)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({row.count} ta partiya)
                      </span>
                    </div>

                    <div className="flex items-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                        {lang === 'ru' ? 'Подробнее' : 'Batafsil'}
                      </span>
                      <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
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
        /* 4. Inside Product: Key Stats & Filtered Records Table (Sorted Ascending - Requirement 3) */
        <div className="space-y-3">
          {/* Product KPI Statistics */}
          <div className="p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      selectedProductSummary?.category === 'PRIMARY'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {getTrilingualInfo(selectedProductSummary?.meta.uz, lang).categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {getTrilingualInfo(selectedProductSummary?.meta.uz, lang).secondary}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedProductSummary?.name}
                </h2>
              </div>
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl ${
                  selectedProductSummary?.unit === 'dona'
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {selectedProductSummary?.unit === 'dona' ? (lang === 'ru' ? 'ШТ' : 'DONA') : (lang === 'ru' ? 'ВЕС' : 'VAZN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
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
                  {lang === 'ru' ? 'Поступлений' : 'Birlashtirilgan partiyalar'}
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
                    ? Array.from(selectedProductSummary.suppliers).slice(0, 3).join(', ')
                    : 'Ombor'}
                </span>
              </div>
            </div>
          </div>

          {/* Filtered Records Table for Selected Product */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-2xs">
            <div className="p-3 bg-slate-50/70 dark:bg-dark-800/50 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {lang === 'ru' ? 'Журнал партий прихода' : 'Kirim partiyalari jurnali'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {sortOrder === 'asc'
                  ? (lang === 'ru' ? 'Сортировка: от старых к новым (возрастание)' : "Tartib: Kichikdan yuqoriga (O'sish)")
                  : (lang === 'ru' ? 'Сортировка: от новых к старым (убывание)' : 'Tartib: Kattadan kichikka (Kamayish)')}
              </span>
            </div>

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
                  <th className="p-3.5">{lang === 'ru' ? 'Поставщик' : 'Ta’minotchi'}</th>
                  <th className="p-3.5 text-right">{lang === 'ru' ? 'Количество / Вес' : 'Miqdor / Vazn'}</th>
                  <th className="p-3.5">{lang === 'ru' ? 'Принял / Инспектор' : 'Qabul qiluvchi / Inspektor'}</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
                  >
                    <div className="flex items-center gap-1">
                      <span>{lang === 'ru' ? 'Номер партии' : 'Partiya raqami'}</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
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
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      <span>{item.supplierName || 'Yetkazib beruvchi'}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatQty(item.quantityKg, item.unit)}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {item.receivedBy || 'Omborchi / Sifat nazorati'}
                    </td>
                    <td className="p-3.5 font-mono">
                      {(() => {
                        const bInfo = formatBatchNumber(item.batchNumber, item.rawBatch, lang)
                        return bInfo.isMissing ? (
                          <span className="font-medium px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-700 inline-flex items-center">
                            {bInfo.text}
                          </span>
                        ) : (
                          <span className="font-bold px-2.5 py-1 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center shadow-2xs">
                            {bInfo.text}
                          </span>
                        )
                      })()}
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

      {/* 5. Detail Drawer Modal for an Individual Batch */}
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
                  {lang === 'ru' ? 'Сведения о партии' : 'Qabul partiyasi tafsilotlari'}
                </p>
                <h3 className="font-mono font-black text-xl text-slate-900 dark:text-white">
                  {formatBatchNumber(selectedItem.batchNumber, selectedItem.rawBatch, lang).text}
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
              <Detail
                label={lang === 'ru' ? 'Номер партии' : 'Partiya raqami'}
                value={formatBatchNumber(selectedItem.batchNumber, selectedItem.rawBatch, lang).text}
              />
              <Detail
                label={lang === 'ru' ? 'Поставщик' : 'Yetkazib beruvchi'}
                value={selectedItem.supplierName || (lang === 'ru' ? 'Не указан' : 'Ko‘rsatilmagan')}
              />
              <Detail
                label={lang === 'ru' ? 'Принял ответственный' : "Qabul qilgan mas'ul"}
                value={selectedItem.receivedBy || (lang === 'ru' ? 'Не указан' : 'Ko‘rsatilmagan')}
              />
              <Detail label={lang === 'ru' ? 'Дата' : 'Sana'} value={selectedItem.date} />
              <Detail
                label={lang === 'ru' ? 'Количество / Вес' : 'Miqdori / Vazni'}
                value={formatQty(selectedItem.quantityKg, selectedItem.unit)}
              />
              <Detail
                label={lang === 'ru' ? 'Статус' : 'Holati'}
                value={selectedItem.status || (lang === 'ru' ? 'Принято' : 'Qabul qilingan')}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-800">
              <a
                href="/shop-report"
                className="inline-flex text-xs font-bold text-emerald-600 hover:underline"
              >
                Kirim va chiqim hisoboti jurnaliga o‘tish &rarr;
              </a>
            </div>
          </aside>
        </div>
      )}

      {/* 6. SUPPLIERS MODAL (Requirement 5: Yetkazib beruvchilar oynasi) */}
      {showSuppliersModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowSuppliersModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {lang === 'ru' ? 'Анализ поставщиков сырья и материалов' : "Yetkazib beruvchilar tahlili"}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {suppliersDetailedList.length} ta ta'minotchi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {lang === 'ru'
                      ? 'Полный реестр контрагентов, объем поставок, перечень сырья и даты'
                      : "Barcha ta'minotchilar ro'yxati, yetkazilgan xomashyo hajmi va oxirgi partiyalar"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSuppliersModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    lang === 'ru'
                      ? 'Поиск поставщика или поставляемого сырья...'
                      : "Ta'minotchi nomi yoki mahsulot bo'yicha qidirish..."
                  }
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <span className="text-xs font-mono text-slate-400 shrink-0">
                {suppliersDetailedList.filter((s) => {
                  if (!supplierSearch.trim()) return true
                  const q = supplierSearch.toLowerCase()
                  return (
                    s.name.toLowerCase().includes(q) ||
                    Array.from(s.products).some((p) => p.toLowerCase().includes(q))
                  )
                }).length}{' '}
                ta topildi
              </span>
            </div>

            {/* Suppliers Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-dark-750 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">{lang === 'ru' ? 'Поставщик (Компания)' : "Ta'minotchi nomi"}</th>
                    <th className="p-3.5">{lang === 'ru' ? 'Поставляемая продукция' : 'Yetkazib berilgan mahsulotlar'}</th>
                    <th className="p-3.5 text-center">{lang === 'ru' ? 'Партий' : 'Partiyalar soni'}</th>
                    <th className="p-3.5 text-right">{lang === 'ru' ? 'Общий объем' : 'Jami yetkazilgan hajm'}</th>
                    <th className="p-3.5 text-right">{lang === 'ru' ? 'Посл. дата' : 'Oxirgi sana'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                  {suppliersDetailedList
                    .filter((s) => {
                      if (!supplierSearch.trim()) return true
                      const q = supplierSearch.toLowerCase()
                      return (
                        s.name.toLowerCase().includes(q) ||
                        Array.from(s.products).some((p) => p.toLowerCase().includes(q))
                      )
                    })
                    .map((supplier, idx) => (
                      <tr
                        key={supplier.name}
                        className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors"
                      >
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{supplier.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {Array.from(supplier.products).slice(0, 4).map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {p}
                              </span>
                            ))}
                            {supplier.products.size > 4 && (
                              <span className="text-[10px] text-slate-400 font-bold self-center">
                                +{supplier.products.size - 4} ta
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-dark-800 text-xs">
                            {supplier.batchesCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {supplier.totalKg > 0 && <div>{supplier.totalKg.toLocaleString('uz-UZ')} kg</div>}
                          {supplier.totalDona > 0 && (
                            <div className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                              {supplier.totalDona.toLocaleString('uz-UZ')} dona
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500 text-[11px]">
                          {supplier.lastDate || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-slate-400">
              <span>Green Processing • Ta’minot zanjiri va yetkazib beruvchilar auditi</span>
              <button
                onClick={() => setShowSuppliersModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
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

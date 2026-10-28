'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
  X
} from 'lucide-react'

type RecordItem = {
  id: string | number
  actNumber: string
  actDate: string
  productName: string
  supplierName: string
  batchNumber: string | null
  warehouseKg: number | null
  unit?: string
  decisionRating: number
  decisionText: string | null
  temperature: string | null
  inspectorName: string | null
  rejectionActNumber: string | null
  notes: string | null
  qualityIssues: string[]
}

type ProductSummary = {
  name: string
  unit: string
  acts: number
  weightKg: number
  unknownWeightActs: number
  rejected: number
  conditional: number
  issues: number
}

type SupplierSummary = {
  name: string
  unit?: string
  acts: number
  weightKg: number
  donaCount?: number
  rejected: number
  issues: number
}

type Analysis = {
  stats: {
    totalActs: number
    totalWeightKg: number
    totalCountDona?: number
    weightKnownActs: number
    unknownWeightActs: number
    rejectedActs: number
    conditionalActs: number
    issueActs: number
  }
  products: ProductSummary[]
  suppliers: SupplierSummary[]
  records: RecordItem[]
  pagination: { page: number; totalPages: number; totalItems: number }
}

interface Props {
  dateFrom: string
  dateTo: string
  lang: string
}

export default function IncomingMaterialsAnalysis({ dateFrom, dateTo, lang }: Props) {
  const [data, setData] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [product, setProduct] = useState('')
  const [supplier, setSupplier] = useState('')
  const [status, setStatus] = useState('')
  const [unitFilter, setUnitFilter] = useState<'all' | 'kg' | 'dona'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<RecordItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '25' })
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (product) params.set('product', product)
      if (supplier) params.set('supplier', supplier)
      if (status) params.set('status', status)
      if (unitFilter !== 'all') params.set('unit', unitFilter)

      const response = await fetch(`/api/director/incoming-analysis?${params}`, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error || "Ma'lumot yuklanmadi")
      setData(json)
    } catch (e: any) {
      setError(e?.message || 'Server xatoligi')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, page, product, supplier, status, unitFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, product, supplier, status, unitFilter])

  const weight = (value: number) => value.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })
  const statusLabel = (rating: number) =>
    rating === 2 ? 'RAD ETILGAN' : rating === 3 ? 'SHARTLI' : 'QABUL QILINGAN'
  const statusClass = (rating: number) =>
    rating === 2
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
      : rating === 3
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'

  if (loading && !data) {
    return <div className="h-80 animate-pulse rounded-3xl border border-slate-200 dark:border-dark-750 bg-slate-100 dark:bg-dark-800" />
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex justify-between items-center">
        <span>{error}</span>
        <button onClick={load} className="font-bold underline">
          Qayta urinish
        </button>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-4">
      {/* 1. TOP STAT CARDS (Separated KG and DONA) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Partiyalar', `${stats?.totalActs?.toLocaleString() || 0} ta`, <FileText key="a" size={16} />],
          ['Kirim (KG)', stats ? `${weight(stats.totalWeightKg)} kg` : '—', <Truck key="b" size={16} />],
          ['Kirim (DONA)', stats?.totalCountDona ? `${stats.totalCountDona.toLocaleString()} dona` : '0 dona', <Truck key="c" size={16} />],
          ['Rad etilgan', `${stats?.rejectedActs || 0} ta`, <AlertTriangle key="d" size={16} />],
          ['Sifat og‘ishi', `${stats?.issueActs || 0} ta`, <PackageSearch key="e" size={16} />],
        ].map(([label, value, icon]) => (
          <div
            key={String(label)}
            className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-sm"
          >
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
              <span>{label}</span>
              <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
            </div>
            <div className="mt-2 text-lg lg:text-xl font-black text-slate-900 dark:text-white font-mono">
              {value ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* 2. FILTER CONTROLS */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {product && (
            <button
              onClick={() => {
                setProduct('')
                setSupplier('')
                setStatus('')
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              ← Barcha mahsulotlar
            </button>
          )}

          {/* Unit Toggle Buttons: All / KG / DONA */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-dark-800 p-0.5 border border-slate-200 dark:border-dark-700">
            <button
              onClick={() => setUnitFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                unitFilter === 'all'
                  ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setUnitFilter('kg')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                unitFilter === 'kg'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <span>⚖️</span>
              <span>KG</span>
            </button>
            <button
              onClick={() => setUnitFilter('dona')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                unitFilter === 'dona'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <span>📦</span>
              <span>DONA</span>
            </button>
          </div>

          {product && (
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="min-w-44 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">Barcha ta’minotchilar</option>
              {(data?.suppliers || []).map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">Barcha holatlar</option>
            <option value="ACCEPTED">Qabul qilingan</option>
            <option value="CONDITIONAL">Shartli qabul</option>
            <option value="REJECTED">Rad etilgan</option>
          </select>

          {(supplier || status || unitFilter !== 'all') && (
            <button
              onClick={() => {
                setSupplier('')
                setStatus('')
                setUnitFilter('all')
              }}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Tozalash
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={14} />
            <span>Yuklanmoqda...</span>
          </div>
        )}
      </div>

      {/* 3. PRODUCT LIST OR SINGLE PRODUCT BREAKDOWN */}
      {!product ? (
        <ProductList
          rows={data?.products || []}
          unitFilter={unitFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClick={setProduct}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Summary
            title={`Tanlangan mahsulot: ${product}`}
            rows={data?.products.filter((p) => p.name === product) || []}
            onClick={() => undefined}
            isProduct
          />
          <Summary
            title={`Ta’minotchilar (${data?.suppliers.length || 0})`}
            rows={data?.suppliers || []}
            onClick={(name) => setSupplier(name)}
          />
        </div>
      )}

      {/* 4. RECORDS TABLE */}
      {product && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 shadow-sm">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold">
              <tr>
                <th className="p-3">Partiya / sana</th>
                <th className="p-3">Mahsulot</th>
                <th className="p-3">Ta’minotchi</th>
                <th className="p-3 text-right">Miqdor / Vazn</th>
                <th className="p-3">Sifat holati</th>
                <th className="p-3">Og‘ishlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {(data?.records || []).map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-dark-800 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {item.actNumber}
                    <span className="block mt-0.5 text-[10px] font-normal text-slate-400">
                      {item.actDate}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {item.productName}
                    {item.batchNumber && (
                      <span className="block mt-0.5 text-[10px] font-mono font-normal text-slate-400">
                        № {item.batchNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                    {item.supplierName}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {item.warehouseKg === null ? (
                      '—'
                    ) : (
                      <>
                        {weight(item.warehouseKg)}{' '}
                        <span className="text-[10px] font-bold text-slate-500">
                          {item.unit || 'kg'}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${statusClass(item.decisionRating)}`}>
                      {statusLabel(item.decisionRating)}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.qualityIssues.length ? (
                      <span className="text-rose-600 font-semibold">{item.qualityIssues.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-600">Og‘ish qayd etilmagan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && data?.records.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-400">
              Tanlangan parametrlar bo‘yicha kirim partiyalari topilmadi.
            </div>
          )}

          <div className="p-3 border-t border-slate-200 dark:border-dark-750 flex justify-between items-center text-xs text-slate-500">
            <span>
              Jami: <b>{data?.pagination.totalItems || 0} ta partiya</b>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono font-bold">
                {page} / {data?.pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage(Math.min(data?.pagination.totalPages || 1, page + 1))}
                disabled={page >= (data?.pagination.totalPages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DETAIL DRAWER MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end backdrop-blur-sm"
          onClick={() => setSelected(null)}
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
                  {selected.actNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <Detail label="Mahsulot" value={selected.productName} />
              <Detail label="Partiya raqami" value={selected.batchNumber || 'Ko‘rsatilmagan'} />
              <Detail label="Ta’minotchi" value={selected.supplierName} />
              <Detail label="Mas'ul shaxs / Inspektor" value={selected.inspectorName || 'Ko‘rsatilmagan'} />
              <Detail label="Qabul sanasi" value={selected.actDate} />
              <Detail label="Harorat holati" value={selected.temperature || 'Ko‘rsatilmagan'} />
              <Detail
                label="Hajmi / Og‘irligi"
                value={
                  selected.warehouseKg === null
                    ? 'Ko‘rsatilmagan'
                    : `${weight(selected.warehouseKg)} ${selected.unit || 'kg'}`
                }
              />
              <Detail
                label="Qabul holati"
                value={`${statusLabel(selected.decisionRating)}${
                  selected.decisionText ? ` — ${selected.decisionText}` : ''
                }`}
              />
            </div>

            <section className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 text-xs border border-slate-200 dark:border-dark-700">
              <b className="text-slate-900 dark:text-white">Sifat va laboratoriya og‘ishlari:</b>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {selected.qualityIssues.length ? selected.qualityIssues.join(', ') : 'Og‘ish qayd etilmagan'}
              </p>
            </section>

            {selected.rejectionActNumber && (
              <div className="mt-3">
                <Detail label="Rad etish akt raqami" value={selected.rejectionActNumber} />
              </div>
            )}

            {selected.notes && (
              <section className="mt-3 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs bg-slate-50/50">
                <b className="text-slate-900 dark:text-white">Izoh va qaydlar:</b>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{selected.notes}</p>
              </section>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-800">
              <a
                href="/shop-report"
                className="inline-flex text-xs font-bold text-amber-600 hover:underline"
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

function ProductList({
  rows,
  unitFilter,
  searchQuery,
  setSearchQuery,
  onClick,
}: {
  rows: ProductSummary[]
  unitFilter: 'all' | 'kg' | 'dona'
  searchQuery: string
  setSearchQuery: (q: string) => void
  onClick: (name: string) => void
}) {
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchUnit = unitFilter === 'all' || r.unit === unitFilter
      const matchQuery = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchUnit && matchQuery
    })
  }, [rows, unitFilter, searchQuery])

  const kgCount = useMemo(() => rows.filter((r) => r.unit === 'kg').length, [rows])
  const donaCount = useMemo(() => rows.filter((r) => r.unit === 'dona').length, [rows])

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base">
            Kirim mahsulotlari ({filtered.length} ta)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcha xomashyo, sabzavotlar, qadoqlar, idishlar va sarf materiallari
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mahsulot nomi bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-dark-800">
        {filtered.map((row) => {
          const isKg = row.unit === 'kg'
          return (
            <button
              key={row.name}
              onClick={() => onClick(row.name)}
              className="p-4 text-left hover:bg-emerald-50/60 dark:hover:bg-dark-800/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      isKg
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                    }`}
                  >
                    {isKg ? '⚖️ KG' : '📦 DONA'}
                  </span>
                  <b className="text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {row.name}
                  </b>
                </div>

                <span
                  className={`text-[11px] font-black whitespace-nowrap px-2 py-0.5 rounded-full ${
                    row.rejected || row.issues
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  }`}
                >
                  {row.rejected ? `${row.rejected} rad` : row.issues ? `${row.issues} og‘ish` : 'Normada'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <strong
                  className={`font-mono text-base sm:text-lg font-black ${
                    isKg ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {row.weightKg.toLocaleString('uz-UZ')}{' '}
                  <span className="text-xs font-bold text-slate-500">{row.unit}</span>
                </strong>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {row.acts} ta partiya
                </span>
              </div>

              <div className="mt-1 text-[11px] text-slate-400">
                {row.conditional > 0 ? `${row.conditional} shartli qabul` : 'Standart talab darajasida'}
              </div>
            </button>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="p-12 text-center text-sm text-slate-400">
          Mos keluvchi kirim mahsulotlari topilmadi.
        </div>
      )}
    </div>
  )
}

function Summary({
  title,
  rows,
  onClick,
  isProduct,
}: {
  title: string
  rows: { name: string; unit?: string; acts: number; weightKg: number; rejected: number; issues: number }[]
  onClick: (name: string) => void
  isProduct?: boolean
}) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-slate-200 dark:border-dark-750 font-black text-sm text-slate-900 dark:text-white flex justify-between items-center">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-400">
          {rows.length} {isProduct ? 'mahsulot' : 'ta’minotchi'}
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-800 custom-scrollbar">
        {rows.map((row) => (
          <button
            key={row.name}
            onClick={() => onClick(row.name)}
            className="w-full p-3 flex justify-between items-center gap-2 text-left text-xs hover:bg-emerald-50/60 dark:hover:bg-dark-800 transition-colors"
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{row.name}</span>
              <small className="block text-slate-400 font-normal mt-0.5">
                {row.acts} partiya · {row.weightKg.toLocaleString('uz-UZ')} {row.unit || 'kg'}
              </small>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                row.rejected || row.issues
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
              }`}
            >
              {row.rejected ? `${row.rejected} rad` : row.issues ? `${row.issues} og‘ish` : 'Normal'}
            </span>
          </button>
        ))}
      </div>
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

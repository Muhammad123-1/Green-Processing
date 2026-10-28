'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, Loader2, PackageSearch, ShieldCheck, Truck, X } from 'lucide-react'

type RecordItem = {
  id: number; actNumber: string; actDate: string; productName: string; supplierName: string
  batchNumber: string | null; warehouseKg: number | null; decisionRating: number; decisionText: string | null
  temperature: string | null; inspectorName: string | null; rejectionActNumber: string | null; notes: string | null
  qualityIssues: string[]
}

type Analysis = {
  stats: { totalActs: number; totalWeightKg: number; weightKnownActs: number; unknownWeightActs: number; rejectedActs: number; conditionalActs: number; issueActs: number }
  products: { name: string; acts: number; weightKg: number; unknownWeightActs: number; rejected: number; conditional: number; issues: number }[]
  suppliers: { name: string; acts: number; weightKg: number; rejected: number; issues: number }[]
  records: RecordItem[]
  pagination: { page: number; totalPages: number; totalItems: number }
}

interface Props { dateFrom: string; dateTo: string; lang: string }

export default function IncomingMaterialsAnalysis({ dateFrom, dateTo, lang }: Props) {
  const [data, setData] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [product, setProduct] = useState('')
  const [supplier, setSupplier] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<RecordItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (product) params.set('product', product)
      if (supplier) params.set('supplier', supplier)
      if (status) params.set('status', status)
      const response = await fetch(`/api/director/incoming-analysis?${params}`, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error || "Ma'lumot yuklanmadi")
      setData(json)
    } catch (e: any) { setError(e?.message || 'Server xatoligi') }
    finally { setLoading(false) }
  }, [dateFrom, dateTo, page, product, supplier, status])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo, product, supplier, status])

  const weight = (value: number) => value.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })
  const statusLabel = (rating: number) => rating === 2 ? 'RAD ETILGAN' : rating === 3 ? 'SHARTLI' : 'QABUL QILINGAN'
  const statusClass = (rating: number) => rating === 2 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : rating === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'

  if (loading && !data) return <div className="h-80 animate-pulse rounded-3xl border border-slate-200 dark:border-dark-750 bg-slate-100 dark:bg-dark-800" />
  if (error) return <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex justify-between"><span>{error}</span><button onClick={load} className="font-bold underline">Qayta urinish</button></div>
  const stats = data?.stats

  return <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[
        ['Aktlar', stats?.totalActs, <FileText key="a" />],
        ['Kirim (aniq vazn)', stats ? `${weight(stats.totalWeightKg)} kg` : '—', <Truck key="b" />],
        ['Rad etilgan', stats?.rejectedActs, <AlertTriangle key="c" />],
        ['Shartli qabul', stats?.conditionalActs, <ShieldCheck key="d" />],
        ['Sifat og‘ishi', stats?.issueActs, <PackageSearch key="e" />],
      ].map(([label, value, icon]) => <div key={String(label)} className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750"><div className="flex justify-between text-[11px] font-bold text-slate-500"><span>{label}</span><span className="text-emerald-600">{icon}</span></div><div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{value ?? '—'}</div></div>)}
    </div>
    <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap gap-2">
      {product && <button onClick={() => { setProduct(''); setSupplier(''); setStatus('') }} className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white">← Barcha mahsulotlar</button>}
      {product && <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="min-w-44 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700"><option value="">Barcha ta’minotchilar</option>{(data?.suppliers || []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>}
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700"><option value="">Barcha holatlar</option><option value="REJECTED">Rad etilgan</option><option value="CONDITIONAL">Shartli qabul</option><option value="ACCEPTED">Qabul qilingan</option></select>
      {(supplier || status) && <button onClick={() => { setSupplier(''); setStatus('') }} className="px-3 py-2 text-xs font-bold text-rose-600">Filtrlarni tozalash</button>}
      {loading && <Loader2 className="m-2 animate-spin text-emerald-600" size={14} />}
    </div>

    {!product ? <ProductList rows={data?.products || []} onClick={setProduct} /> : <div className="grid lg:grid-cols-2 gap-4"><Summary title="Tanlangan mahsulot" rows={data?.products || []} onClick={() => undefined} /><Summary title="Ta’minotchilar" rows={data?.suppliers || []} onClick={(name) => setSupplier(name)} /></div>}

    {product && <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900">
      <table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500"><tr><th className="p-3">Akt / sana</th><th className="p-3">Mahsulot / partiya</th><th className="p-3">Ta’minotchi</th><th className="p-3 text-right">Vazn</th><th className="p-3">Sifat holati</th><th className="p-3">Og‘ishlar</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-800">{(data?.records || []).map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-dark-800"><td className="p-3 font-mono font-bold">{item.actNumber}<span className="block mt-0.5 text-[10px] font-normal text-slate-400">{item.actDate}</span></td><td className="p-3 font-bold">{item.productName}<span className="block mt-0.5 text-[10px] font-mono font-normal text-slate-400">{item.batchNumber || 'Partiya ko‘rsatilmagan'}</span></td><td className="p-3">{item.supplierName}</td><td className="p-3 text-right font-mono">{item.warehouseKg === null ? '—' : `${weight(item.warehouseKg)} kg`}</td><td className="p-3"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${statusClass(item.decisionRating)}`}>{statusLabel(item.decisionRating)}</span></td><td className="p-3">{item.qualityIssues.length ? <span className="text-rose-600">{item.qualityIssues.join(', ')}</span> : <span className="text-emerald-600">Og‘ish qayd etilmagan</span>}</td></tr>)}</tbody></table>
      {!loading && data?.records.length === 0 && <div className="p-12 text-center text-sm text-slate-400">Tanlangan parametrlar bo‘yicha qabul aktlari topilmadi.</div>}
      <div className="p-3 border-t border-slate-200 dark:border-dark-750 flex justify-between items-center text-xs"><span>{data?.pagination.totalItems || 0} ta akt</span><div className="flex gap-1"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 disabled:opacity-30"><ChevronLeft size={16}/></button><span className="p-1.5">{page} / {data?.pagination.totalPages || 1}</span><button onClick={() => setPage(Math.min(data?.pagination.totalPages || 1, page + 1))} disabled={page >= (data?.pagination.totalPages || 1)} className="p-1.5 disabled:opacity-30"><ChevronRight size={16}/></button></div></div>
    </div>}

    {selected && <div className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end" onClick={() => setSelected(null)}><aside className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex justify-between border-b pb-3"><div><p className="text-[11px] font-black text-emerald-600">QABUL AKTI</p><h3 className="font-mono font-black text-slate-900 dark:text-white">{selected.actNumber}</h3></div><button onClick={() => setSelected(null)}><X /></button></div><div className="grid grid-cols-2 gap-3 py-4 text-xs"><Detail label="Mahsulot" value={selected.productName}/><Detail label="Partiya" value={selected.batchNumber || 'Ko‘rsatilmagan'}/><Detail label="Ta’minotchi" value={selected.supplierName}/><Detail label="Qabul qilgan inspektor" value={selected.inspectorName || 'Ko‘rsatilmagan'}/><Detail label="Sana" value={selected.actDate}/><Detail label="Harorat" value={selected.temperature || 'Ko‘rsatilmagan'}/><Detail label="Ombor vazni" value={selected.warehouseKg === null ? 'Ko‘rsatilmagan' : `${weight(selected.warehouseKg)} kg`}/><Detail label="Holat" value={`${statusLabel(selected.decisionRating)}${selected.decisionText ? ` — ${selected.decisionText}` : ''}`}/></div><section className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 text-xs"><b>Sifat og‘ishlari</b><p className="mt-1 text-slate-600 dark:text-slate-300">{selected.qualityIssues.length ? selected.qualityIssues.join(', ') : 'Og‘ish qayd etilmagan'}</p></section>{selected.rejectionActNumber && <Detail label="Rad etish akti" value={selected.rejectionActNumber}/>} {selected.notes && <section className="mt-3 p-3 rounded-2xl border text-xs"><b>Izoh</b><p className="mt-1">{selected.notes}</p></section>}<a href="/incoming-acts" className="mt-5 inline-flex text-xs font-bold text-emerald-700 hover:underline">To‘liq qabul aktlari jurnaliga o‘tish →</a></aside></div>}
  </div>
}

function ProductList({ rows, onClick }: { rows: { name: string; acts: number; weightKg: number; rejected: number; conditional: number; issues: number; unknownWeightActs: number }[]; onClick: (name: string) => void }) {
  return <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden"><div className="p-4 border-b"><h3 className="font-black text-slate-900 dark:text-white">Kirim mahsulotlari</h3></div><div className="grid sm:grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-dark-800">{rows.map((row) => <button key={row.name} onClick={() => onClick(row.name)} className="p-4 text-left hover:bg-emerald-50 dark:hover:bg-dark-800"><div className="flex items-start justify-between gap-3"><b className="text-sm text-slate-900 dark:text-white">{row.name}</b><span className={row.rejected || row.issues ? 'text-rose-600 font-black text-xs' : 'text-emerald-600 font-black text-xs'}>{row.rejected ? `${row.rejected} rad` : row.issues ? `${row.issues} og‘ish` : 'Normada'}</span></div><strong className="block mt-3 font-mono text-lg text-emerald-600">{row.weightKg.toLocaleString('uz-UZ')} kg</strong><span className="block mt-1 text-[11px] text-slate-500">{row.acts} ta qabul akti · {row.conditional} shartli</span></button>)}</div>{!rows.length && <div className="p-12 text-center text-sm text-slate-400">Mahsulotlar topilmadi.</div>}</div>
}

function Summary({ title, rows, onClick }: { title: string; rows: { name: string; acts: number; weightKg: number; rejected: number; issues: number }[]; onClick: (name: string) => void }) {
  return <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden"><div className="p-3 border-b font-black text-sm text-slate-900 dark:text-white">{title}</div><div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-800">{rows.slice(0, 10).map((row) => <button key={row.name} onClick={() => onClick(row.name)} className="w-full p-3 flex justify-between gap-2 text-left text-xs hover:bg-emerald-50 dark:hover:bg-dark-800"><span className="font-bold">{row.name}<small className="block text-slate-400 font-normal">{row.acts} akt · {row.weightKg.toLocaleString('uz-UZ')} kg</small></span><span className={row.rejected || row.issues ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{row.rejected ? `${row.rejected} rad` : row.issues ? `${row.issues} og‘ish` : 'Normal'}</span></button>)}</div></div>
}

function Detail({ label, value }: { label: string; value: string }) { return <div><span className="block text-[10px] text-slate-400">{label}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span></div> }

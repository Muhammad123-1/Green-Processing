'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertOctagon, Boxes, Factory, FileClock, Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react'

type Tab = 'production' | 'warehouse' | 'alerts' | 'audit'
interface Props { dateFrom: string; dateTo: string; lang: string }

export default function OperationsExecutivePanel({ dateFrom, dateTo, lang }: Props) {
  const [tab, setTab] = useState<Tab>('production')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams(); if (dateFrom) p.set('dateFrom', dateFrom); if (dateTo) p.set('dateTo', dateTo)
      const res = await fetch(`/api/director/operations-overview?${p}`, { cache: 'no-store' }); const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Ma'lumot yuklanmadi")
      setData(json)
    } catch (e: any) { setError(e?.message || 'Server xatoligi') } finally { setLoading(false) }
  }, [dateFrom, dateTo])
  useEffect(() => { load() }, [load])
  const n = (value: number | null | undefined) => value === null || value === undefined ? '—' : value.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })
  const tabs: [Tab, string, any][] = [['production', 'Ishlab chiqarish', Factory], ['warehouse', 'Ombor', Boxes], ['alerts', 'Ogohlantirishlar', AlertOctagon], ['audit', 'Xodimlar auditi', FileClock]]
  if (loading && !data) return <div className="h-80 animate-pulse rounded-3xl bg-slate-100 dark:bg-dark-800" />
  if (error) return <div className="p-4 border border-rose-200 bg-rose-50 rounded-2xl text-rose-800 flex justify-between"><span>{error}</span><button className="font-bold underline" onClick={load}>Qayta urinish</button></div>
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-100 dark:bg-dark-850 p-1.5"><div className="flex flex-wrap gap-1 flex-1">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${tab === id ? 'bg-white dark:bg-dark-700 shadow text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}><Icon size={14}/>{label}{id === 'alerts' && data?.alerts.length ? <span className="px-1.5 rounded-full bg-rose-600 text-white">{data.alerts.length}</span> : null}</button>)}</div><button onClick={load} className="p-2 text-slate-500" title="Yangilash">{loading ? <Loader2 size={15} className="animate-spin"/> : <RefreshCw size={15}/>}</button></div>
    {tab === 'production' && <Production data={data?.production} n={n} onSelect={setSelected}/>} {tab === 'warehouse' && <Warehouse data={data?.warehouse} n={n} onSelect={setSelected}/>} {tab === 'alerts' && <Alerts alerts={data?.alerts || []} onSelect={setSelected}/>} {tab === 'audit' && <Audit rows={data?.audit || []} onSelect={setSelected}/>} 
    {selected && <DetailDrawer value={selected} onClose={() => setSelected(null)} />}
  </div>
}

function Production({ data, n, onSelect }: any) {
  const t = data?.totals
  return <section className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Card label="Buyurtmalar" value={t?.orders}/><Card label="Reja" value={t ? `${n(t.plannedOutput)} kg` : '—'}/><Card label="Haqiqiy chiqim" value={t ? `${n(t.actualOutput)} kg` : '—'}/><Card label="Rejaga nisbatan" value={t?.yieldPercent === null || t?.yieldPercent === undefined ? '—' : `${t.yieldPercent}%`}/></div><Table headers={['Mahsulot', 'Buyurtma', 'Reja', 'Chiqim', 'Tugallanmagan']} rows={(data?.products || []).map((item: any) => [item.name, item.orders, `${n(item.planned)} ${item.unit}`, `${n(item.actual)} ${item.unit}`, item.incomplete ? `${item.incomplete} ta` : '—'])}/><h3 className="font-black text-sm text-slate-900 dark:text-white">Ishlab chiqarish partiyalari</h3><div className="space-y-2">{(data?.orders || []).map((item: any) => <button onClick={() => onSelect(item)} key={item.id} className="w-full p-3 text-left rounded-2xl border border-slate-200 dark:border-dark-750 hover:bg-emerald-50 dark:hover:bg-dark-800 text-xs flex justify-between gap-3"><span><b>{item.orderNumber || `#${item.id}`}</b><small className="block text-slate-400">{item.recipe.outputProduct.name} · {item.lineName || 'Liniya ko‘rsatilmagan'}</small></span><span className="font-mono">{item.actualOutput === null ? 'Chiqim kiritilmagan' : `${n(item.actualOutput)} ${item.recipe.outputProduct.unit}`}</span></button>)}</div></section>
}

function Warehouse({ data, n, onSelect }: any) {
  const t = data?.totals
  return <section className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Card label="Faol partiyalar" value={t?.batches}/><Card label="Mahsulotlar" value={t?.products}/><Card label="Me’yordan past" value={t?.lowStock}/><Card label="Karantinda" value={t?.quarantinedBatches}/></div><Table headers={['Mahsulot', 'Qoldiq', 'Partiyalar', 'Min. me’yor', 'Holat']} rows={(data?.products || []).map((item: any) => [item.name, `${n(item.quantity)} ${item.unit}`, item.batches, item.threshold === null ? 'Belgilanmagan' : `${n(item.threshold)} ${item.unit}`, item.status === 'LOW' ? 'KAM' : item.status === 'NO_THRESHOLD' ? 'ME’YOR YO‘Q' : 'NORMAL'])}/><h3 className="font-black text-sm text-slate-900 dark:text-white">Oxirgi ombor harakatlari</h3><div className="space-y-2">{(data?.transfers || []).map((item: any) => <button key={item.id} onClick={() => onSelect(item)} className="w-full p-3 flex justify-between text-left rounded-2xl border border-slate-200 dark:border-dark-750 hover:bg-emerald-50 dark:hover:bg-dark-800 text-xs"><span><b>{item.transferNumber}</b><small className="block text-slate-400">{item.product.name} · {item.sourceLocation} → {item.targetLocation}</small></span><span className={item.discrepancy ? 'font-bold text-rose-600' : 'font-mono'}>{item.discrepancy ? `${item.discrepancy} ${item.issuedUnit} farq` : `${n(item.issuedQuantity)} ${item.issuedUnit}`}</span></button>)}</div></section>
}

function Alerts({ alerts, onSelect }: any) { return <section className="space-y-2">{alerts.length === 0 ? <Empty text="Tanlangan davrda operatsion ogohlantirish yo‘q."/> : alerts.map((item: any) => <button key={item.id} onClick={() => onSelect(item.source)} className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-dark-750 hover:bg-slate-50 dark:hover:bg-dark-800 flex gap-3"><ShieldAlert className={item.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'} size={18}/><span className="text-xs"><b className="block text-slate-900 dark:text-white">{item.title}</b><span className="text-slate-500">{item.detail}</span><small className="block mt-1 text-slate-400">{new Date(item.occurredAt).toLocaleString('uz-UZ')}</small></span></button>)}</section> }

function Audit({ rows, onSelect }: any) { return <section><p className="mb-3 text-xs text-slate-500">Bu bo‘lim faqat ruxsat etilgan operatsion audit yozuvlarini ko‘rsatadi; xodim kuzatuvi uchun ishlatilmaydi.</p>{rows.length === 0 ? <Empty text="Tanlangan davrda audit yozuvlari yo‘q."/> : <div className="space-y-2">{rows.map((item: any) => <button key={item.id} onClick={() => onSelect(item)} className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-dark-750 hover:bg-slate-50 dark:hover:bg-dark-800 text-xs flex justify-between gap-3"><span><b>{item.operation} · {item.tableName}</b><small className="block text-slate-400">{item.actor || 'Tizim foydalanuvchisi aniqlanmagan'} {item.role ? `· ${item.role}` : ''}</small></span><time className="text-slate-400">{new Date(item.createdAt).toLocaleString('uz-UZ')}</time></button>)}</div>}</section> }
function Card({ label, value }: { label: string; value: any }) { return <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750"><span className="block text-[11px] font-bold text-slate-500">{label}</span><b className="block mt-2 text-xl text-slate-900 dark:text-white">{value ?? '—'}</b></div> }
function Empty({ text }: { text: string }) { return <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-dark-750 text-sm text-slate-400">{text}</div> }
function Table({ headers, rows }: { headers: string[]; rows: any[][] }) { return <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-dark-750"><table className="min-w-[680px] w-full text-left text-xs"><thead className="bg-slate-100 dark:bg-dark-800 text-slate-500"><tr>{headers.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-800">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className={`p-3 ${j === 0 ? 'font-bold text-slate-900 dark:text-white' : ''}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <Empty text="Ma’lumot topilmadi."/>}</div> }
function DetailDrawer({ value, onClose }: { value: any; onClose: () => void }) { const entries = Object.entries(value).filter(([key]) => !['rawValues', 'oldValues', 'newValues'].includes(key)); return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end" onClick={onClose}><aside onClick={(e) => e.stopPropagation()} className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-5"><div className="flex justify-between border-b pb-3"><h3 className="font-black text-slate-900 dark:text-white">Operatsion yozuv</h3><button onClick={onClose}><X/></button></div><dl className="py-4 space-y-3 text-xs">{entries.map(([key, value]) => <div key={key}><dt className="text-slate-400">{key}</dt><dd className="mt-0.5 break-words text-slate-800 dark:text-slate-200">{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}</dl></aside></div> }

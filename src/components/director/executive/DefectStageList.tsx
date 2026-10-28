'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Factory, Loader2, Snowflake, Truck } from 'lucide-react'

type Item = { id: number; actNumber: string; productName: string; weightKg: number; reasonCategory: string; detailedComment: string | null; incidentDate: string; batchNumber: string | null; wastageType: 'ACTUAL_DEFECT' | 'NATURAL_TECH_WASTE' }
interface Props { dateFrom?: string; dateTo?: string }

const stages = [
  { id: 'INCOMING', title: '1. Qabul qilishdagi brak', note: 'Ta’minotchidan sifatsiz kelgan mahsulotlar: chirigan, ezilgan yoki shikastlangan.', Icon: Truck, color: 'blue' },
  { id: 'PROCESSING', title: '2. Qayta ishlashdagi brak', note: 'Tozalash, kesish va tayyorlash jarayonidagi yo‘qotishlar.', Icon: Factory, color: 'amber' },
  { id: 'STORAGE', title: '3. Saqlashdagi brak', note: 'Ombor yoki muzlatkichda saqlash vaqtida buzilgan mahsulotlar.', Icon: Snowflake, color: 'indigo' },
] as const

export default function DefectStageList({ dateFrom = '', dateTo = '' }: Props) {
  const [data, setData] = useState<Record<string, Item[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    Promise.all(stages.map(async (stage) => {
      const p = new URLSearchParams({ stage: stage.id, pageSize: '50' }); if (dateFrom) p.set('dateFrom', dateFrom); if (dateTo) p.set('dateTo', dateTo)
      const response = await fetch(`/api/director/wastage-logs?${p}`); const json = await response.json()
      if (!response.ok || !json.success) throw new Error(json.error || "Brak yozuvlari yuklanmadi")
      return [stage.id, json.items || []] as const
    })).then((rows) => { if (active) setData(Object.fromEntries(rows)) }).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [dateFrom, dateTo])
  if (loading) return <div className="h-72 rounded-3xl bg-slate-100 dark:bg-dark-800 animate-pulse" />
  if (error) return <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>
  const sum = (items: Item[], type?: Item['wastageType']) => items.filter((item) => !type || item.wastageType === type).reduce((total, item) => total + item.weightKg, 0)
  return <div className="space-y-4">{stages.map(({ id, title, note, Icon, color }) => {
    const rows = data[id] || []; const actual = sum(rows, 'ACTUAL_DEFECT'); const natural = sum(rows, 'NATURAL_TECH_WASTE')
    const tone = color === 'blue' ? 'border-blue-200 dark:border-blue-900/50 text-blue-600' : color === 'amber' ? 'border-amber-200 dark:border-amber-900/50 text-amber-600' : 'border-indigo-200 dark:border-indigo-900/50 text-indigo-600'
    return <section key={id} className={`rounded-3xl border bg-white dark:bg-dark-900 overflow-hidden ${tone}`}><div className="p-4 border-b border-inherit flex flex-col sm:flex-row justify-between gap-3"><div className="flex gap-3"><Icon size={20}/><div><h3 className="font-black text-sm text-slate-900 dark:text-white">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{note}</p></div></div><div className="flex gap-2 text-xs font-bold"><span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600">Haqiqiy brak: {actual.toLocaleString('uz-UZ')} kg</span>{id === 'PROCESSING' && <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700">Texnologik chiqindi: {natural.toLocaleString('uz-UZ')} kg</span>}</div></div><div className="divide-y divide-slate-100 dark:divide-dark-800">{rows.length ? rows.map((item) => <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"><div><b className="text-slate-900 dark:text-white">{item.productName}</b><span className="ml-2 font-mono text-slate-400">{item.actNumber}</span><small className="block mt-0.5 text-slate-500">Partiya: {item.batchNumber || 'ko‘rsatilmagan'} · {item.reasonCategory}{item.detailedComment ? ` · ${item.detailedComment}` : ''}</small></div><div className="text-right"><b className={item.wastageType === 'NATURAL_TECH_WASTE' ? 'text-amber-600' : 'text-rose-600'}>{item.weightKg.toLocaleString('uz-UZ')} kg</b><small className="block text-slate-400">{item.incidentDate} · {item.wastageType === 'NATURAL_TECH_WASTE' ? 'Texnologik chiqindi' : 'Haqiqiy brak'}</small></div></div>) : <div className="p-8 text-center text-xs text-slate-400">Ushbu bosqichda brak qayd etilmagan.</div>}</div></section>
  })}</div>
}

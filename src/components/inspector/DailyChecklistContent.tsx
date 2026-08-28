'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Save, CheckCircle2, AlertCircle, Clock, ShieldCheck, Thermometer, Droplets, Zap, ShieldAlert, ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FileText, Database, FileSpreadsheet } from 'lucide-react'
import { useEffect } from 'react'

export default function DailyChecklistContent() {
  const router = useRouter()
  const [view, setView] = useState<'form' | 'archive'>('form')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [shift, setShift] = useState('1')
  const [supervisor, setSupervisor] = useState('')
  const [inspector, setInspector] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [line, setLine] = useState('1-Qadoqlash')
  const [rejected, setRejected] = useState('')
  const [totalOutput, setTotalOutput] = useState('')

  const [form, setForm] = useState({
    // Part 1: Packaging
    packLemon: true,
    packCucumber: true,
    packTomato: true,
    packIceberg: true,
    packOnion: true,
    packColeslaw: true,

    // Part 2: Process
    rawMaterialTemp1: '', rawMaterialTemp2: '', rawMaterialTemp3: '', rawMaterialOk: true,
    cleaningPercent: '100', cleaningOk: true,
    cuttingSize: '45', cuttingOk: true,
    dezTemp1: '', dezTemp2: '', dezTemp3: '', dezTemp4: '', dezTemp5: '', dezTemp6: '', dezTempOk: true,
    dezChlorine1: '', dezChlorine2: '', dezChlorine3: '', dezChlorine4: '', dezChlorine5: '', dezChlorine6: '', dezChlorineOk: true,
    preservative: '1', preservativeOk: true,
    residualChlorine: true, residualChlorineOk: true,
    dryingDry: true, dryingOk: true,
    inspectionClean: true, inspectionOk: true,
    weightLemon: '2', weight1kg: '1002', weight500g: '504', weightOk: true,
    sealingOk: true, sealingStatusOk: true,
    metalFe: true, metalNonFe: true, metalSs: true, metalSignal: true, metalOk: true,
    fgStoreTemp: '', fgStoreVacuum: true, fgStoreOk: true,
    hygieneClean: true, hygieneOk: true
  })

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/daily-checklist')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (view === 'archive') {
      fetchHistory()
    }
  }, [view])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        date,
        shift,
        lineName: line,
        batchNumber: batchNo,
        rejectedKg: rejected,
        totalOutputBox: totalOutput,
        supervisor,
        inspector,
        formData: form
      }
      
      const res = await fetch('/api/daily-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Xatolik yuz berdi')
      }
      
      toast.success("Smena yakuni bo'yicha Yagona Check-list muvaffaqiyatli saqlandi!")
      setView('archive')
    } catch (e) {
      toast.error("Saqlashda xatolik yuz berdi")
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-enter pb-20">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-dark-800 p-1 rounded-2xl w-full max-w-sm mb-6 border border-slate-200 dark:border-dark-700">
        <button
          onClick={() => setView('form')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'form' ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <FileText size={16} /> Yangi To'ldirish
        </button>
        <button
          onClick={() => setView('archive')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'archive' ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Database size={16} /> Arxiv
        </button>
      </div>

      {view === 'form' ? (
        <>
          {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/inspector')} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-dark-700">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Yagona Kunlik Check-list
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">FSSC 22000</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Smena yakuni bo'yicha QC nazoratchisining umumiy hisoboti</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 active:scale-95 disabled:opacity-70">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          <span>Smenani Tasdiqlash</span>
        </button>
      </div>

      {/* Meta Info */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Sana / Smena</label>
            <div className="flex gap-2">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-2/3 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              <select value={shift} onChange={e => setShift(e.target.value)} className="w-1/3 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500">
                <option value="1">1-Smena</option>
                <option value="2">2-Smena</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Liniya / Partiya №</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Liniya" value={line} onChange={e => setLine(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              <input type="text" placeholder="Partiya №" value={batchNo} onChange={e => setBatchNo(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Brak / Umumiy chiqish</label>
            <div className="flex gap-2">
              <div className="relative w-1/2">
                <input type="number" placeholder="Brak" value={rejected} onChange={e => setRejected(e.target.value)} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-3 pr-7 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 text-red-600 dark:text-red-400" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
              </div>
              <div className="relative w-1/2">
                <input type="number" placeholder="Chiqish" value={totalOutput} onChange={e => setTotalOutput(e.target.value)} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-3 pr-8 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 text-emerald-600 dark:text-emerald-400" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kor</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Mas'ullar (Ustasi / QC)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Smena ustasi" value={supervisor} onChange={e => setSupervisor(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              <input type="text" placeholder="Nazoratchi" value={inspector} onChange={e => setInspector(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Part 1: Packaging Standards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl md:rounded-3xl p-5 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-dark-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">1. Qadoqlash</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Qadoq standartlari (OPRP)</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'packLemon', name: 'Limon (Lemon)', desc: '2 dona / 12 paket / 24 kor', norm: '100% sog\'lom' },
                { key: 'packCucumber', name: 'Bodring (Cucumber)', desc: '1 kg / 6 paket / 6 kg', norm: '990g - 1010g' },
                { key: 'packTomato', name: 'Tomat (Tomato)', desc: '1 kg / 6 paket / 6 kg', norm: '990g - 1010g' },
                { key: 'packIceberg', name: 'Aysberg (Iceberg)', desc: '1 kg / 6 paket / 6 kg', norm: '990g - 1010g' },
                { key: 'packOnion', name: 'Piyoz (Onion)', desc: '0.5 kg / 12 paket / 6 kg', norm: '492.5g - 507.5g' },
                { key: 'packColeslaw', name: 'Koul Slou (Cole Slaw)', desc: '0.5 kg / 12 paket / 6 kg', norm: '492.5g - 507.5g' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/30 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <div className="flex flex-col mt-0.5">
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Norma: {item.norm}</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={(form as any)[item.key]} onChange={e => handleChange(item.key, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-500 flex gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Barcha mahsulot qadoqlari belgilangan og'irlik va sifat spetsifikatsiyasiga mos kelishi shart. (OPRP)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Part 2: Process & Safety Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-dark-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">2. Texnologik Jarayon va Xavfsizlik</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Nazorat nuqtalari (CCP) & OPRP</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* CCPs Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-2">
                  <ShieldAlert size={14} /> Kritik Nazorat Nuqtalari (CCP)
                </h3>
                
                {/* CCP-1 Active Chlorine */}
                <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Droplets size={16} className="text-blue-500" />
                        Faol Xlor (CCP-1)
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">Norma: Qat'iy 300 mg/l (ppm)</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 cursor-pointer">
                      <input type="checkbox" checked={form.dezChlorineOk} onChange={e => handleChange('dezChlorineOk', e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                      <span className={form.dezChlorineOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {form.dezChlorineOk ? 'Mos (OK)' : 'Mos Emas'}
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { time: '08:00', field: 'dezChlorine1' },
                      { time: '10:00', field: 'dezChlorine2' },
                      { time: '12:00', field: 'dezChlorine3' },
                      { time: '14:00', field: 'dezChlorine4' },
                      { time: '16:00', field: 'dezChlorine5' },
                      { time: '18:00', field: 'dezChlorine6' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-dark-800 rounded-lg p-1.5 border border-slate-200 dark:border-dark-700">
                        <div className="text-[9px] font-bold text-slate-400 text-center mb-1 flex justify-center items-center gap-1">
                          <Clock size={8} /> {item.time}
                        </div>
                        <input type="number" value={(form as any)[item.field]} onChange={e => handleChange(item.field, e.target.value)} placeholder="300" className="w-full text-center text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CCP-2 Temp */}
                <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Thermometer size={16} className="text-rose-500" />
                        Dezinfeksiya Harorati (CCP-2)
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">Norma: +1°C ... +3°C (maks +3°C)</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 cursor-pointer">
                      <input type="checkbox" checked={form.dezTempOk} onChange={e => handleChange('dezTempOk', e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                      <span className={form.dezTempOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {form.dezTempOk ? 'Mos (OK)' : 'Mos Emas'}
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { time: '08:00', field: 'dezTemp1' },
                      { time: '10:00', field: 'dezTemp2' },
                      { time: '12:00', field: 'dezTemp3' },
                      { time: '14:00', field: 'dezTemp4' },
                      { time: '16:00', field: 'dezTemp5' },
                      { time: '18:00', field: 'dezTemp6' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-dark-800 rounded-lg p-1.5 border border-slate-200 dark:border-dark-700">
                        <div className="text-[9px] font-bold text-slate-400 text-center mb-1 flex justify-center items-center gap-1">
                          <Clock size={8} /> {item.time}
                        </div>
                        <input type="number" value={(form as any)[item.field]} onChange={e => handleChange(item.field, e.target.value)} placeholder="+2" className="w-full text-center text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CCP-3 Metal Detector */}
                <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={16} className="text-red-500" />
                        Metall Detektor (CCP-3)
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">Fe ≥2.0mm, Non-Fe ≥3.0mm, SS ≥3.0mm (Har 2 soatda)</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 cursor-pointer">
                      <input type="checkbox" checked={form.metalOk} onChange={e => handleChange('metalOk', e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                      <span className={form.metalOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {form.metalOk ? 'Mos (OK)' : 'Mos Emas'}
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" checked={form.metalFe} onChange={e => handleChange('metalFe', e.target.checked)} className="accent-blue-500 w-3.5 h-3.5" /> Fe (Temir)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" checked={form.metalNonFe} onChange={e => handleChange('metalNonFe', e.target.checked)} className="accent-blue-500 w-3.5 h-3.5" /> Non-Fe
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" checked={form.metalSs} onChange={e => handleChange('metalSs', e.target.checked)} className="accent-blue-500 w-3.5 h-3.5" /> SS
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">
                      <input type="checkbox" checked={form.metalSignal} onChange={e => handleChange('metalSignal', e.target.checked)} className="accent-amber-500 w-3 h-3" /> Signal Bor
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-dark-800 my-4" />

              {/* OPRP Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  Operatsion Dasturlar (OPRP)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Item */}
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">1. Xomashyo Ombori Harorati</h4>
                      <p className="text-[10px] text-slate-500">Norma: +1°C ... +5°C</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.rawMaterialOk} onChange={e => handleChange('rawMaterialOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">2. Tozalash (Iflos Zona)</h4>
                      <p className="text-[10px] text-slate-500">100% chirishsiz va toza</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.cleaningOk} onChange={e => handleChange('cleaningOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">3. To'g'rash Kalibri</h4>
                      <p className="text-[10px] text-slate-500">Spetsifikatsiya bo'yicha (har soatda)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.cuttingOk} onChange={e => handleChange('cuttingOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">6. Konservant (Koul-Slou)</h4>
                      <p className="text-[10px] text-slate-500">≤1g/kg (Karam 85%, Sabzi 15%)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.preservativeOk} onChange={e => handleChange('preservativeOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">7. Qoldiq Xlor (Chiller)</h4>
                      <p className="text-[10px] text-slate-500">Norma: 0 mg/l</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.residualChlorineOk} onChange={e => handleChange('residualChlorineOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">8. Tsentrifuga (Quritish)</h4>
                      <p className="text-[10px] text-slate-500">30sek, 950rpm, salfetka quruq</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.dryingOk} onChange={e => handleChange('dryingOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">9. Vizual Nazorat (Inspeksiya)</h4>
                      <p className="text-[10px] text-slate-500">Yupqa yoyilish, 100% toza</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.inspectionOk} onChange={e => handleChange('inspectionOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">11. Germetiklik (Qadoq choki)</h4>
                      <p className="text-[10px] text-slate-500">100% germetik, chok tekis</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.sealingOk} onChange={e => handleChange('sealingOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">13. Tayyor Mahsulot Ombori</h4>
                      <p className="text-[10px] text-slate-500">+1°C ... +5°C, vakuum, toza</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.fgStoreOk} onChange={e => handleChange('fgStoreOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">14. Gigiyena va Sanitariya</h4>
                      <p className="text-[10px] text-slate-500">100% tozalik, niqob, qo'lqop</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.hygieneOk} onChange={e => handleChange('hygieneOk', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-red-200 peer-focus:outline-none rounded-full peer dark:bg-red-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Arxiv: Smena Yakuni Jurnallari</h2>
            <button onClick={fetchHistory} className="text-sm text-blue-600 hover:underline">Yangilash</button>
          </div>
          
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Database size={48} className="text-slate-300 dark:text-dark-700 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hali ma'lumot yo'q</h2>
              <p className="text-slate-500 max-w-sm">Saqlangan smena yakuni jurnallari ro'yxati bo'sh.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700">
                    <tr>
                      <th className="px-6 py-4 font-black">Sana / Smena</th>
                      <th className="px-6 py-4 font-black">Partiya №</th>
                      <th className="px-6 py-4 font-black">Umumiy Chiqish</th>
                      <th className="px-6 py-4 font-black">Brak (kg)</th>
                      <th className="px-6 py-4 font-black">Mas'ullar</th>
                      <th className="px-6 py-4 font-black">Holat</th>
                      <th className="px-6 py-4 text-right font-black">Harakat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {history.map((doc: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-blue-500" />
                            {doc.date}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-dark-800">{doc.shift}-Smena</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{doc.batchNumber || '-'}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{doc.totalOutputBox ? `${doc.totalOutputBox} kor` : '-'}</td>
                        <td className="px-6 py-4 text-red-500 font-bold">{doc.rejectedKg ? `${doc.rejectedKg} kg` : '-'}</td>
                        <td className="px-6 py-4 text-slate-500">
                          <div className="text-xs">Usta: <span className="font-medium text-slate-700 dark:text-slate-300">{doc.supervisor || '-'}</span></div>
                          <div className="text-xs">QC: <span className="font-medium text-slate-700 dark:text-slate-300">{doc.inspector || '-'}</span></div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase">
                            Tasdiqlangan
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => window.open(`/api/daily-checklist/${doc.id}/export`, '_blank')}
                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs font-bold flex items-center justify-end gap-1 ml-auto"
                          >
                            <FileSpreadsheet size={14} /> Excel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { FileSpreadsheet, Save, Download, ArrowDownToLine, ArrowUpFromLine, Calculator, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function ShopReportContent() {
  const { lang } = useLanguage()
  const [activeTab, setActiveTab] = useState<'arrival' | 'expense' | 'report' | 'history'>('arrival')
  
  // Tab 1 Data: Приход (Incoming)
  const [arrivals, setArrivals] = useState([
    { date: '2026-08-30', nomenclature: 'Томат', quantity: 956.6, supplier: 'Turk shanay biznes', batch: '' },
    { date: '2026-08-30', nomenclature: 'Салат Айсберг', quantity: 526.7, supplier: '', batch: '' },
  ])

  const addArrival = () => setArrivals([...arrivals, { date: '', nomenclature: '', quantity: 0, supplier: '', batch: '' }])

  // Tab 2 Data: Расход ГП (Expense / Finished Goods)
  const [expenses, setExpenses] = useState([
    { date: '2026-09-01', iceberg: 1999.7, tomatoes: 0, onion: 0, cabbage: 0, carrot: 1468.0, bag: 245, chlorine: 34.98, sorbat: 0, benzoat: 0, vinegar: 0, taygeta: 0, boxDefect: 0, bagDefect: 0, ses: 0, kitchen: 0 },
    { date: '2026-09-02', iceberg: 0, tomatoes: 3025.9, onion: 127.7, cabbage: 623.9, carrot: 3124.0, bag: 407, chlorine: 9.02, sorbat: 3.75, benzoat: 3.75, vinegar: 0.75, taygeta: 0, boxDefect: 0, bagDefect: 0, ses: 0, kitchen: 0 },
  ])

  const addExpense = () => setExpenses([...expenses, { date: '', iceberg: 0, tomatoes: 0, onion: 0, cabbage: 0, carrot: 0, bag: 0, chlorine: 0, sorbat: 0, benzoat: 0, vinegar: 0, taygeta: 0, boxDefect: 0, bagDefect: 0, ses: 0, kitchen: 0 }])

  // Tab 4 Data: History
  const [history, setHistory] = useState<{ id: number; type: 'arrival' | 'expense' | 'report'; date: string; createdBy: string; totalIceberg: number; totalTomatoes: number }[]>([
    { id: 1, type: 'report', date: '2026-07-05', createdBy: 'Admin', totalIceberg: 1800, totalTomatoes: 3000 },
    { id: 2, type: 'expense', date: '2026-07-06', createdBy: 'Operator', totalIceberg: 2897.6, totalTomatoes: 0 },
    { id: 3, type: 'arrival', date: '2026-07-07', createdBy: 'Omborchi', totalIceberg: 500, totalTomatoes: 1000 }
  ])

  const [historyFilterDate, setHistoryFilterDate] = useState('')
  const [reportDate, setReportDate] = useState('2026-07-06')
  const [historyType, setHistoryType] = useState<'arrival' | 'expense' | 'report'>('report')

  const filteredHistory = history.filter(h => {
    if (historyType !== h.type) return false;
    if (historyFilterDate && h.date !== historyFilterDate) return false;
    return true;
  })

  const saveArrival = () => {
    alert(lang === 'ru' ? 'Приход успешно сохранен!' : 'Kirim muvaffaqiyatli saqlandi!')
    setActiveTab('history')
    setHistoryType('arrival')
  }

  const saveExpense = () => {
    alert(lang === 'ru' ? 'Расход успешно сохранен!' : 'Chiqim muvaffaqiyatli saqlandi!')
    setActiveTab('history')
    setHistoryType('expense')
  }

  const saveReport = () => {
    alert(lang === 'ru' ? 'Отчет успешно сохранен!' : 'Kunlik hisobot muvaffaqiyatli saqlandi!')
    setActiveTab('history')
    setHistoryType('report')
  }

  const exportToExcel = () => {
    let csvContent = '\uFEFF' // BOM for UTF-8 Excel support
    
    if (activeTab === 'arrival') {
      csvContent += 'Дата;Номенклатура;Количество;Поставщик;Партии\n'
      arrivals.forEach(r => {
        csvContent += `${r.date};${r.nomenclature};${r.quantity};${r.supplier};${r.batch}\n`
      })
    } else if (activeTab === 'expense') {
      csvContent += 'Число;Айсберг;Томаты;Лук;Капуста;Морковь;Пакет;Коробки;Хлор;Сорбат;Бензоат;Уксус;Тайгета;Коробки БРАК;Пакет БРАК;СЕС;КУХНЯ\n'
      expenses.forEach(r => {
        csvContent += `${r.date};${r.iceberg};${r.tomatoes};${r.onion};${r.cabbage};${r.carrot};${r.bag};${r.boxDefect};${r.chlorine};${r.sorbat};${r.benzoat};${r.vinegar};${r.taygeta};${r.boxDefect};${r.bagDefect};${r.ses};${r.kitchen}\n`
      })
    } else if (activeTab === 'history') {
      csvContent += 'Сана;Aysberg Rasxodi;Tomat Rasxodi;Kirituvchi xodim\n'
      filteredHistory.forEach(h => {
        csvContent += `${h.date};${h.totalIceberg};${h.totalTomatoes};${h.createdBy}\n`
      })
    } else {
      csvContent += 'Остатка начало дня;;;;\nПриход;;;;\nРасход;;;;\nОстатка конец дня;;;;\n'
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Sex_Hisoboti_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewReport = (date: string, type: 'arrival' | 'expense' | 'report' | 'history') => {
    setReportDate(date)
    setActiveTab(type)
  }

  return (
    <div className="flex flex-col h-full space-y-5 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shadow-sm dark:shadow-inner">
            <ClipboardListIcon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-500/30">
                {lang === 'ru' ? 'Ежедневный журнал' : 'Kunlik jurnal'}
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'ru' ? 'Производственный отчет ЦЕХ' : 'Sex Ishlab Chiqarish Hisoboti'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {lang === 'ru' ? 'Формы ввода прихода, расхода и ежедневный отчет по выходу ГП' : 'Kirim, chiqim jadvallari va tayyor mahsulot (GP) hisobotini to\'ldirish'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm">
            <Download size={15} />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('arrival')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'arrival' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowDownToLine size={16} /> 1. Приход (Kirim)
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'expense' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <ArrowUpFromLine size={16} /> 2. Расход (Chiqim)
        </button>
        <button 
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'report' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <Calculator size={16} /> 3. Отчет ЦЕХ (Hisobot)
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white dark:bg-dark-700' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-800'}`}
        >
          <FileSpreadsheet size={16} /> 4. Arxiv (Tarix)
        </button>
      </div>

      {/* Tab 1: Приход (Incoming) */}
      {activeTab === 'arrival' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between bg-amber-500/10">
            <h2 className="text-base font-black text-amber-600 uppercase tracking-tight">Приход (Kirim qilinayotgan mahsulotlar)</h2>
            <div className="flex gap-2">
              <button onClick={addArrival} className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50">+ Qo'shish</button>
              <button onClick={saveArrival} className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20">
                <Save size={14} /> Saqlash
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-amber-500 text-white text-xs font-bold uppercase sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-r border-amber-600">Дата</th>
                  <th className="p-3 border-r border-amber-600">Номенклатура</th>
                  <th className="p-3 border-r border-amber-600 text-right">Количество</th>
                  <th className="p-3 border-r border-amber-600">Поставщик</th>
                  <th className="p-3">Партии</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                {arrivals.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="date" value={row.date} onChange={(e) => { const nw = [...arrivals]; nw[idx].date = e.target.value; setArrivals(nw) }} className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="text" placeholder="Томат..." value={row.nomenclature} onChange={(e) => { const nw = [...arrivals]; nw[idx].nomenclature = e.target.value; setArrivals(nw) }} className="w-full bg-transparent px-2 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" step="0.1" value={row.quantity} onChange={(e) => { const nw = [...arrivals]; nw[idx].quantity = Number(e.target.value); setArrivals(nw) }} className="w-full bg-transparent px-2 py-1.5 text-xs font-mono font-bold text-right text-amber-700 dark:text-amber-500 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="text" placeholder="Turk shanay biznes" value={row.supplier} onChange={(e) => { const nw = [...arrivals]; nw[idx].supplier = e.target.value; setArrivals(nw) }} className="w-full bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none" />
                    </td>
                    <td className="p-1">
                      <input type="text" placeholder="Партия" value={row.batch} onChange={(e) => { const nw = [...arrivals]; nw[idx].batch = e.target.value; setArrivals(nw) }} className="w-full bg-transparent px-2 py-1.5 text-xs font-mono text-slate-900 dark:text-white outline-none" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Расход (Expense) */}
      {activeTab === 'expense' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between bg-amber-500/10">
            <h2 className="text-base font-black text-amber-600 uppercase tracking-tight">Расход (Ishlatilgan xomashyo va materiallar)</h2>
            <div className="flex gap-2">
              <button onClick={addExpense} className="text-xs font-bold bg-white dark:bg-dark-800 text-amber-600 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50">+ Qo'shish</button>
              <button onClick={saveExpense} className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20">
                <Save size={14} /> Saqlash
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#FFE699] dark:bg-amber-900/40 text-slate-900 dark:text-amber-100 text-[10px] font-bold uppercase sticky top-0 z-10 border-b border-amber-300 dark:border-amber-700">
                <tr>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50 w-28 bg-amber-200 dark:bg-amber-800">Число</th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Айсберг<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">ТОМАТЫ<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Лук<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Капуста<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Морковь<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Пакет<br/><span className="font-normal text-[8px]">шт</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Коробки<br/><span className="font-normal text-[8px]">шт</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Хлор<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Сорбат<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Бензоат<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Уксус<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Тайгета 218<br/><span className="font-normal text-[8px]">л</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Коробки2 БРАК<br/><span className="font-normal text-[8px]">шт</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50">Пакет 2 БРАК<br/><span className="font-normal text-[8px]">шт</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50 bg-[#92D050] text-black">СЕС<br/><span className="font-normal text-[8px]">кг</span></th>
                  <th className="p-2 border-r border-amber-300 dark:border-amber-700/50 bg-[#92D050] text-black">КУХНЯ<br/><span className="font-normal text-[8px]">кг</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-750 bg-[#FFFBF0] dark:bg-transparent">
                {expenses.map((row, idx) => (
                  <tr key={idx} className="hover:bg-amber-50 dark:hover:bg-dark-800/50">
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-amber-100/50 dark:bg-amber-900/20">
                      <input type="date" value={row.date} onChange={(e) => { const nw = [...expenses]; nw[idx].date = e.target.value; setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-bold text-slate-900 dark:text-white outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.iceberg || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].iceberg = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.tomatoes || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].tomatoes = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.onion || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].onion = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.cabbage || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].cabbage = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.carrot || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].carrot = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.bag || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].bag = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.chlorine || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].chlorine = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.chlorine || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].chlorine = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.sorbat || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].sorbat = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.benzoat || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].benzoat = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.vinegar || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].vinegar = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750">
                      <input type="number" value={row.taygeta || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].taygeta = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-red-50 dark:bg-red-900/10">
                      <input type="number" value={row.boxDefect || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].boxDefect = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-red-600 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-red-50 dark:bg-red-900/10">
                      <input type="number" value={row.bagDefect || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].bagDefect = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-red-600 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-green-50 dark:bg-green-900/10">
                      <input type="number" value={row.ses || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].ses = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-dark-750 bg-green-50 dark:bg-green-900/10">
                      <input type="number" value={row.kitchen || ''} onChange={(e) => { const nw = [...expenses]; nw[idx].kitchen = Number(e.target.value); setExpenses(nw) }} className="w-full bg-transparent px-1 py-1 text-[11px] font-mono text-right text-slate-800 dark:text-slate-300 outline-none" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Отчет ЦЕХ (Report Form) */}
      {activeTab === 'report' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-y-auto custom-scrollbar flex flex-col p-4 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">Производственный отчет ЦЕХ (Kunlik kiritish)</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Sana:</span>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none" />
              </div>
              <button onClick={saveReport} className="flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-500 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-md shadow-amber-600/20">
                <Save size={15} />
                <span>Hisobotni Saqlash</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Table 1: Расход сырья и материалов на выпуск ГП */}
            <div className="border border-[#8EA9DB] rounded-lg overflow-hidden shadow-sm">
              <div className="bg-[#B4C6E7] p-2 text-center text-[11px] font-black text-slate-900 uppercase tracking-tight">
                Расход сырья и материалов на выпуск ГП
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[10px] min-w-[800px]">
                  <thead className="bg-slate-50 text-slate-900 font-bold text-center">
                    <tr>
                      <th className="p-1.5 border border-[#8EA9DB] w-36 text-left bg-white" rowSpan={2}>Наименование сырья</th>
                      <th className="p-1.5 border border-[#8EA9DB] bg-white w-20" rowSpan={2}>Приход в цех</th>
                      <th className="p-1.5 border border-[#8EA9DB]" colSpan={7}>Расход</th>
                    </tr>
                    <tr>
                      <th className="p-1.5 border border-[#8EA9DB] w-20">Салат Айсберг<br/>нарезанный</th>
                      <th className="p-1.5 border border-[#8EA9DB] w-20">Томаты целые</th>
                      <th className="p-1.5 border border-[#8EA9DB] w-24">Лук салатный белый<br/>нарезанный</th>
                      <th className="p-1.5 border border-[#8EA9DB] w-16">Капуста</th>
                      <th className="p-1.5 border border-[#8EA9DB] w-16">Морковь</th>
                      <th className="p-1.5 border border-[#8EA9DB] bg-[#92D050] w-16">СЭС</th>
                      <th className="p-1.5 border border-[#8EA9DB] bg-[#92D050] w-16">КУХНЯ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-900 font-mono">
                    {[
                      { name: 'Салат Айсберг', in: '2897.6', v1: '2897.6', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '', y1: true },
                      { name: 'Томаты', in: '0.0', v1: '', v2: '0.0', v3: '', v4: '', v5: '', v6: '', v7: '', y2: true },
                      { name: 'Лук салатный белый', in: '0.0', v1: '', v2: '', v3: '0.0', v4: '', v5: '', v6: '', v7: '', y3: true },
                      { name: 'Капуста/Морковь', in: '167.3', v1: '', v2: '', v3: '', v4: '143.8', v5: '23.5', v6: '', v7: '0.0', y4: true, y5: true },
                      { name: 'Лимон', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '0', v7: '0', y6: true, y7: true },
                      { name: 'Пакет вакуумный 30*35', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                      { name: 'Коробка из гофрокартона', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                      { name: 'Этикетка 56*60', in: '0.0', v1: '0', v2: '0', v3: '0', v4: '0', v5: '0', v6: '0', v7: '0' },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-1 border border-[#8EA9DB] font-sans font-bold">{r.name}</td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.in} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y1 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y1 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v1} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y2 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y2 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v2} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y3 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y3 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v3} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y4 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y4 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v4} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y5 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y5 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v5} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y6 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y6 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v6} /></td>
                        <td className={`p-0 border border-[#8EA9DB] ${r.y7 ? 'bg-[#FFFF00]' : ''}`}><input type="number" className={`w-full h-full p-1 text-center outline-none bg-transparent ${r.y7 ? 'font-bold text-red-600' : ''}`} defaultValue={r.v7} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Table 2: Выход ГП KFC */}
              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-100 p-1.5 text-center text-[11px] font-black text-slate-900 uppercase border-b border-slate-300">
                  Выход ГП КФС
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-center border-collapse text-[10px] min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-900 font-bold">
                      <tr>
                        <th className="p-1 border border-slate-300 bg-white">Наименование ГП</th>
                        <th className="p-1 border border-slate-300">Кол-во ГП, кг</th>
                        <th className="p-1 border border-slate-300">Упаковки, шт</th>
                        <th className="p-1 border border-slate-300">Коробки, шт</th>
                        <th className="p-1 border border-slate-300 bg-[#92D050]">Кол-во ГП, кг СЭС</th>
                        <th className="p-1 border border-slate-300 bg-[#92D050]">Кол-во ГП, кг КУХНЯ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-900 font-mono">
                      {[
                        { n: 'Салат Айсберг нарезанный', v1: '1833.0', v2: '1833', v3: '306' },
                        { n: 'Томаты целые', v1: '0.0', v2: '0', v3: '0' },
                        { n: 'Лук салатный белый нарезанный', v1: '0.0', v2: '0', v3: '0' },
                        { n: 'Коул Слоу', v1: '126.0', v2: '252', v3: '21' },
                        { n: 'Лимон', v1: '0.0', v2: '0', v3: '0' },
                      ].map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-1 border border-slate-300 font-sans text-left">{r.n}</td>
                          <td className="p-0 border border-slate-300 bg-[#FFFF00]"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold text-red-600" defaultValue={r.v1} /></td>
                          <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v2} /></td>
                          <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v3} /></td>
                          <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent" /></td>
                          <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent" /></td>
                        </tr>
                      ))}
                      <tr>
                        <td className="p-1 border-t border-slate-300"></td>
                        <td className="p-1 border-t border-slate-300"></td>
                        <td className="p-1 font-bold">2085</td>
                        <td className="p-1 font-bold">327</td>
                        <td className="p-1"></td>
                        <td className="p-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 4: Остатки */}
              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar h-full">
                  <table className="w-full text-center border-collapse text-[10px] min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-900 font-bold">
                      <tr>
                        <th className="p-1 border border-slate-300 w-24 bg-white">7/6/2026</th>
                        <th className="p-1 border border-slate-300">Салат Айсберг</th>
                        <th className="p-1 border border-slate-300">Томат</th>
                        <th className="p-1 border border-slate-300">Лук салатный<br/>белый</th>
                        <th className="p-1 border border-slate-300">Капуста<br/>белокачанная</th>
                        <th className="p-1 border border-slate-300">Морковь</th>
                        <th className="p-1 border border-slate-300">Лимон</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-900 font-mono">
                      <tr>
                        <td className="p-1 border border-slate-300 font-sans text-left text-red-600">остатка начало дня</td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={2093.00} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={3642.20} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={582.40} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={1058.40} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={569.77} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none text-red-600 font-bold" defaultValue={0.50} /></td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300 font-sans text-left">приход</td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" defaultValue={1334.0} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" defaultValue={1061.1} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                      </tr>
                      <tr>
                        <td className="p-1 border border-slate-300 font-sans text-left">расход</td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" defaultValue={2897.6} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" defaultValue={143.8} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" defaultValue={23.5} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none" /></td>
                      </tr>
                      <tr className="bg-[#D9E1F2]">
                        <td className="p-1 border border-slate-300 font-sans font-bold text-left">остатка конец дня</td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={529.4} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={4703.3} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={582.4} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={914.6} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={546.3} /></td>
                        <td className="p-0 border border-slate-300"><input type="number" className="w-full h-full p-1 text-center outline-none bg-transparent font-bold" defaultValue={0.5} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Table 3: % расхода сырья */}
            <div className="border border-[#8EA9DB] rounded-lg overflow-hidden shadow-sm">
              <div className="bg-[#B4C6E7] p-1.5 text-center text-[11px] font-black text-slate-900 uppercase">
                % расхода сырья и материалов на выпуск ГП
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-center border-collapse text-[10px] min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-900 font-bold">
                    <tr>
                      <th className="p-1 border border-[#8EA9DB] w-48 text-left bg-white">Наименование Сырья</th>
                      <th className="p-1 border border-[#8EA9DB] w-20">Норма не более %</th>
                      <th className="p-1 border border-[#8EA9DB] w-20">Салат Айсберг<br/>нарезанный</th>
                      <th className="p-1 border border-[#8EA9DB] w-16">Томаты целые</th>
                      <th className="p-1 border border-[#8EA9DB] w-20">Лук салатный белый<br/>нарезанный</th>
                      <th className="p-1 border border-[#8EA9DB] w-16">Коул Слоу</th>
                      <th className="p-1 border border-[#8EA9DB] w-16">Лимон</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-900 font-mono">
                    {[
                      { n: 'Салат Айсберг', norm: '25-35', v1: '36.7', v2: '-', v3: '-', v4: '-', v5: '-' },
                      { n: 'Томаты', norm: '15', v1: '-', v2: '0.0', v3: '-', v4: '-', v5: '-' },
                      { n: 'Лук салатный белый', norm: '20-25', v1: '-', v2: '-', v3: '0.0', v4: '-', v5: '-' },
                      { n: 'Капуста/Морковь', norm: '', v1: '-', v2: '-', v3: '-', v4: '24.7', v5: '-' },
                      { n: 'Лимон', norm: '', v1: '-', v2: '-', v3: '-', v4: '-', v5: '0.0' },
                      { n: 'Пакет вакуумный (Салат Айсберг)', norm: '12.07', v1: '0.0', v2: '-', v3: '-', v4: '-', v5: '-' },
                      { n: 'Пакет вакуумный (Томаты)', norm: '12.07', v1: '-', v2: '0.0', v3: '-', v4: '-', v5: '-' },
                      { n: 'Пакет вакуумный (Лук)', norm: '32', v1: '-', v2: '-', v3: '0.0', v4: '-', v5: '-' },
                      { n: 'Этикетка 56*60 (Салат Айсберг)', norm: '11.19', v1: '0.0', v2: '-', v3: '-', v4: '-', v5: '-' },
                      { n: 'Этикетка 56*60 (Томаты)', norm: '11.19', v1: '-', v2: '0.0', v3: '-', v4: '-', v5: '-' },
                      { n: 'Этикетка 56*60 (Лук)', norm: '30.5', v1: '-', v2: '-', v3: '0.0', v4: '-', v5: '-' },
                      { n: 'Коробка из гофрокартона (Салат Айсберг, Томаты, Лук)', norm: '5.56', v1: '0.0', v2: '0.0', v3: '0.0', v4: '-', v5: '-' },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-1 border border-[#8EA9DB] font-sans text-left">{r.n}</td>
                        <td className="p-1 border border-[#8EA9DB]">{r.norm}</td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="text" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v1} /></td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="text" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v2} /></td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="text" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v3} /></td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="text" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v4} /></td>
                        <td className="p-0 border border-[#8EA9DB]"><input type="text" className="w-full h-full p-1 text-center outline-none bg-transparent" defaultValue={r.v5} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Arxiv (History) */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mr-4">Saqlangan Arxivlar</h2>
              <div className="flex bg-slate-100 dark:bg-dark-800 rounded-xl p-1">
                <button 
                  onClick={() => setHistoryType('arrival')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'arrival' ? 'bg-white dark:bg-dark-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Приход (Kirim)
                </button>
                <button 
                  onClick={() => setHistoryType('expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'expense' ? 'bg-white dark:bg-dark-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Расход (Chiqim)
                </button>
                <button 
                  onClick={() => setHistoryType('report')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyType === 'report' ? 'bg-white dark:bg-dark-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Отчет ЦЕХ (Hisobot)
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" 
              />
              {historyFilterDate && (
                <button 
                  onClick={() => setHistoryFilterDate('')}
                  className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHistory.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                Bu turdagi yoki sanadagi arxiv topilmadi.
              </div>
            ) : (
              filteredHistory.map((h, i) => (
                <div key={i} className="border border-slate-200 dark:border-dark-750 rounded-xl p-4 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 dark:bg-dark-800/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      h.type === 'arrival' ? 'text-blue-700 bg-blue-100' : 
                      h.type === 'expense' ? 'text-rose-700 bg-rose-100' : 
                      'text-amber-700 bg-amber-100'
                    }`}>
                      {h.type === 'arrival' ? 'Приход' : h.type === 'expense' ? 'Расход' : 'Отчет ЦЕХ'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{h.date}</h3>
                  </div>
                  <div className="bg-slate-200 dark:bg-dark-700 w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                    {h.createdBy.charAt(0)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4 border-t border-slate-200 dark:border-dark-750 pt-3">
                  <div className="flex justify-between">
                    <span>Aysberg miqdori:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{h.totalIceberg} {h.type === 'arrival' ? 'кг' : 'кг'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tomat miqdori:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{h.totalTomatoes} кг</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kirituvchi xodim:</span>
                    <span className="font-bold">{h.createdBy}</span>
                  </div>
                </div>
                
                <button onClick={() => viewReport(h.date, h.type)} className="w-full py-2 bg-slate-100 dark:bg-dark-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold rounded-lg transition-colors flex justify-center items-center gap-2">
                  <span>Ko'rish</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ClipboardListIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}

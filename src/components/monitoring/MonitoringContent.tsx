'use client'

import React, { useState } from 'react'
import { FileSpreadsheet, Filter, Search, Download, Calendar as CalendarIcon, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

// Static demo data imitating the pivot table
const demoData = {
  kfc: [
    { product: 'АЙСБЕРГ', total: 339.0, branches: { 'Samarqand 1': 54, 'Andijon 1': 29, 'Qo\'qon': 56, 'Andijon 2': 52, 'Samarqand 2': 72, 'Farg\'ona': 48, 'Jizzax': 28 } },
    { product: 'ТОМАТЫ', total: 403.0, branches: { 'Samarqand 1': 60, 'Andijon 1': 32, 'Qo\'qon': 58, 'Andijon 2': 70, 'Samarqand 2': 90, 'Farg\'ona': 60, 'Jizzax': 33 } },
    { product: 'ЛУК', total: 31.5, branches: { 'Samarqand 1': 6, 'Andijon 1': 3, 'Qo\'qon': 4, 'Andijon 2': 4.5, 'Samarqand 2': 7, 'Farg\'ona': 4.5, 'Jizzax': 2.5 } },
    { product: 'Коул-Слоу', total: 88.5, branches: { 'Samarqand 1': 14, 'Andijon 1': 10, 'Qo\'qon': 12, 'Andijon 2': 12, 'Samarqand 2': 25, 'Farg\'ona': 11, 'Jizzax': 4.5 } }
  ],
  export: [
    { product: 'АЙСБЕРГ', total: 618.0 },
    { product: 'ТОМАТЫ', total: 672.0 },
    { product: 'Коул-Слоу', total: 138.0 },
    { product: 'Огурцы', total: 30.0 }
  ]
}

export default function MonitoringContent() {
  const { lang } = useLanguage()
  const [selectedDate, setSelectedDate] = useState('2026-07-13')
  const [regionFilter, setRegionFilter] = useState('all')

  const totalKfc = demoData.kfc.reduce((acc, curr) => acc + curr.total, 0)
  const totalExport = demoData.export.reduce((acc, curr) => acc + curr.total, 0)

  return (
    <div className="flex flex-col h-full space-y-5 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shadow-sm dark:shadow-inner">
            <BarChart3Icon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-300 dark:border-indigo-500/30">
                {lang === 'ru' ? 'Ежедневная Сводка' : 'Kunlik Svodka'}
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'ru' ? 'Заказы Клиентов (Мониторинг)' : 'Mijoz Buyurtmalari (Zayavkalar)'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {lang === 'ru' ? 'Сводный отчет по заказам KFC и Экспорту (Таджикистан)' : 'KFC filiallari va Eksport (Tojikiston) bo\'yicha yig\'ma hisobot'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm">
            <Download size={15} />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
        
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-dark-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <div className="h-8 w-px bg-slate-300 dark:bg-dark-700 mx-1 hidden sm:block"></div>
            <div className="relative hidden sm:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none"
              >
                <option value="all">{lang === 'ru' ? 'Все регионы' : 'Barcha hududlar'}</option>
                <option value="kfc">KFC O'zbekiston</option>
                <option value="export">Tojikiston (Eksport)</option>
              </select>
            </div>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={lang === 'ru' ? "Поиск продукта..." : "Mahsulot qidirish..."}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Scrollable Pivot Table Area */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          
          {/* KFC Section */}
          {(regionFilter === 'all' || regionFilter === 'kfc') && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 rounded bg-red-600"></div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">KFC (Mahalliy)</h2>
                <span className="px-2 py-0.5 ml-2 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                  {selectedDate}
                </span>
              </div>
              
              <div className="border border-slate-200 dark:border-dark-750 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-dark-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                      <th className="p-3 border-r border-slate-200 dark:border-dark-750 w-48">Mahsulot nomi</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Samarqand 1</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Andijon Navro'z</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Qo'qon</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Andijon Mustaqillik</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Samarqand Bulvar</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Farg'ona</th>
                      <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">Jizzax</th>
                      <th className="p-3 text-center font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20">JAMI (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                    {demoData.kfc.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="p-3 font-bold text-sm text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750">
                          {item.product}
                        </td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches['Samarqand 1'].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches['Andijon 1'].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches["Qo'qon"].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches['Andijon 2'].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches['Samarqand 2'].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches["Farg'ona"].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">{item.branches['Jizzax'].toFixed(2)}</td>
                        <td className="p-3 text-center font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-dark-800 border-t-2 border-slate-300 dark:border-dark-600">
                      <td className="p-3 font-black text-sm text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750 uppercase">Общий итог</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">134.00</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">74.00</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">130.00</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">138.50</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">194.00</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">123.50</td>
                      <td className="p-3 text-center font-mono text-sm font-bold border-r border-slate-200 dark:border-dark-750 text-slate-900 dark:text-white">68.00</td>
                      <td className="p-3 text-center font-mono text-sm font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/30">
                        {totalKfc.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Export Section */}
          {(regionFilter === 'all' || regionFilter === 'export') && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 rounded bg-emerald-500"></div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Tojikiston (Eksport)</h2>
                <span className="px-2 py-0.5 ml-2 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                  2026-07-14 (Ertangi)
                </span>
              </div>
              
              <div className="w-full sm:w-1/2 border border-slate-200 dark:border-dark-750 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-dark-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                      <th className="p-3 border-r border-slate-200 dark:border-dark-750">Mahsulot nomi</th>
                      <th className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 w-32">JAMI (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                    {demoData.export.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="p-3 font-bold text-sm text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750">
                          {item.product}
                        </td>
                        <td className="p-3 text-center font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-dark-800 border-t-2 border-slate-300 dark:border-dark-600">
                      <td className="p-3 font-black text-sm text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750 uppercase">Общий итог</td>
                      <td className="p-3 text-center font-mono text-sm font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30">
                        {totalExport.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function BarChart3Icon(props: any) {
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
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

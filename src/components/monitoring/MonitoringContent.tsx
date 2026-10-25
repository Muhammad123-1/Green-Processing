'use client'

import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Filter,
  Search,
  Download,
  Calendar as CalendarIcon,
  Package,
  ArrowDownToLine,
  Loader2,
  CheckCircle2,
  Boxes,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function MonitoringContent() {
  const { lang, formatDual } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMonitoringData(selectedDate)
  }, [selectedDate])

  const fetchMonitoringData = async (dateStr?: string) => {
    setLoading(true)
    try {
      const url = dateStr ? `/api/monitoring?date=${dateStr}` : '/api/monitoring'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (!selectedDate && json.activeDate) {
          setSelectedDate(json.activeDate)
        }
        if (json.availableDates) {
          setAvailableDates(json.availableDates)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const products: any[] = data?.products || []
  const arrivals: any[] = data?.arrivals || []

  const filteredProducts = products.filter((p) =>
    p.product.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const filteredArrivals = arrivals.filter((a) =>
    a.product.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const totalKg = data?.totalKg || 0
  const totalBoxes = data?.totalBoxes || 0
  const totalPacks = data?.totalPacks || 0
  const totalArrivalsKg = data?.totalArrivalsKg || 0

  return (
    <div className="flex flex-col min-h-full space-y-3 sm:space-y-5 animate-enter">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shadow-sm dark:shadow-inner">
            <BarChart3Icon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-300 dark:border-indigo-500/30">
                {formatDual('Sex Ishlab Chiqarish Monitoringi', 'Мониторинг производства цеха', 'Shop Production Monitoring')}
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatDual("Kunlik Ishlab Chiqarish & Kirim Monitoringi", 'Ежедневный выпуск и приход сырья', 'Daily Production & Arrival Monitoring')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {formatDual(
                "Sex hisobotlari (Prixod GP) va xomashyo kirimi bo'yicha real ma'lumotlar",
                'Реальные данные цеха по выходу готовой продукции и приходу сырья',
                'Real factory data on finished goods output and raw material arrivals'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/api/reports/excel?lang=${lang || 'uz'}`}
            download
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <Download size={15} />
            <span>Excel Export</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-dark-900/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {products.length} {formatDual('xil tayyor mahsulot chiqishi', 'видов продукции', 'products produced')}
            </span>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск продукта...' : 'Mahsulot qidirish...'}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-semibold">{formatDual('Yuklanmoqda...', 'Загрузка...', 'Loading...')}</p>
            </div>
          ) : (
            <>
              {/* Finished Goods Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 rounded bg-indigo-600"></div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {formatDual('Sexdan Tayyor Mahsulot Chiqishi (Prixod GP)', 'Выпуск готовой продукции цеха', 'Finished Goods Output (Shop)')}
                    </h2>
                    <span className="px-2 py-0.5 ml-1 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                      {selectedDate}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {totalKg.toLocaleString()} kg / {totalBoxes.toLocaleString()} quti
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-dark-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                        <th className="p-3 w-12 text-center">№</th>
                        <th className="p-3 border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Mahsulot nomi', 'Наименование ГП', 'Product Name')}
                        </th>
                        <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Qutilar soni (korobka)', 'Коробки', 'Boxes')}
                        </th>
                        <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                          {formatDual('Qadoqlar soni (upakovka)', 'Упаковки', 'Packs')}
                        </th>
                        <th className="p-3 text-center font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 w-36">
                          {formatDual('Jami og\'irlik (kg)', 'Вес (кг)', 'Weight (kg)')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-750 text-xs">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            {formatDual('Ushbu kunda chiqish ma\'lumotlari topilmadi', 'Данные за эту дату не найдены', 'No output recorded for this date')}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750">
                              {item.product}
                            </td>
                            <td className="p-3 text-center font-mono border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">
                              {item.boxes > 0 ? `${item.boxes} quti` : '-'}
                            </td>
                            <td className="p-3 text-center font-mono border-r border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300">
                              {item.packs > 0 ? `${item.packs} dona` : '-'}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                              {item.total.toLocaleString()} kg
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredProducts.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-dark-800 border-t-2 border-slate-300 dark:border-dark-600 text-xs">
                          <td colSpan={2} className="p-3 font-black text-slate-900 dark:text-white uppercase">
                            {formatDual('Umumiy yakuniy chiqish:', 'ИТОГО ВЫПУСК:', 'TOTAL OUTPUT:')}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {totalBoxes > 0 ? `${totalBoxes.toLocaleString()} quti` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {totalPacks > 0 ? `${totalPacks.toLocaleString()} dona` : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/30">
                            {totalKg.toLocaleString()} kg
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Raw Material Inbound Arrivals Section */}
              {arrivals.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-6 rounded bg-emerald-600"></div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {formatDual("Kunlik Xomashyo Kirimi (Prixod Xomashyo)", 'Приемка сырья за день', 'Raw Material Inbound Arrivals')}
                      </h2>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {totalArrivalsKg.toLocaleString()} kg xomashyo
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-dark-800 uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-dark-750">
                          <th className="p-3 w-12 text-center">№</th>
                          <th className="p-3 border-r border-slate-200 dark:border-dark-750">
                            {formatDual('Xomashyo nomi', 'Сырье', 'Raw Material')}
                          </th>
                          <th className="p-3 border-r border-slate-200 dark:border-dark-750">
                            {formatDual('Ta\'minotchi', 'Поставщик', 'Supplier')}
                          </th>
                          <th className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                            {formatDual('Partiya', 'Партия', 'Batch')}
                          </th>
                          <th className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 w-36">
                            {formatDual('Qabul miqdori (kg)', 'Количество (кг)', 'Quantity (kg)')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                        {filteredArrivals.map((arr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-dark-750">
                              {arr.product}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-dark-750">
                              {arr.supplier}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500 border-r border-slate-200 dark:border-dark-750">
                              {arr.batch}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">
                              {arr.quantity.toLocaleString()} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
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

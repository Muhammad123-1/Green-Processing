'use client'

import { useState, useEffect } from 'react'
import { Package, AlertTriangle, CheckCircle, Clock, Search, Filter, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Omborxona (WMS)",
    subtitle: "Xomashyolar qoldig'i, FEFO nazorati va Svetofor tizimi",
    totalItems: "Jami xomashyolar",
    criticalItems: "Kritik qoldiq (Qizil)",
    warningItems: "Kamaygan (Sariq)",
    searchPlaceholder: "Mahsulot nomi yoki kodi bo'yicha qidiruv...",
    filterAll: "Barchasi",
    filterOk: "Yetarli",
    colProduct: "Mahsulot",
    colCode: "Kod / Kategoriya",
    colMin: "Min. Qoldiq",
    colCurrent: "Joriy Qoldiq",
    colBatches: "Partiyalar (FEFO)",
    colStatus: "Status",
    statusCritical: "Kritik",
    statusWarning: "Kamaygan",
    statusOk: "Yetarli",
    empty: "Hech narsa topilmadi",
    noBatches: "Partiyalar yo'q",
    moreBatches: "+ yana {n} ta partiya",
    errorLoad: "Ombor ma'lumotlarini yuklashda xatolik yuz berdi",
    networkError: "Tarmoq xatosi"
  },
  ru: {
    title: "Склад (WMS)",
    subtitle: "Остатки сырья, контроль FEFO и система Светофор",
    totalItems: "Всего позиций",
    criticalItems: "Критично (Красный)",
    warningItems: "Мало (Желтый)",
    searchPlaceholder: "Поиск по названию или коду...",
    filterAll: "Все",
    filterOk: "Достаточно",
    colProduct: "Продукт",
    colCode: "Код / Категория",
    colMin: "Мин. Запас",
    colCurrent: "Текущий Запас",
    colBatches: "Партии (FEFO)",
    colStatus: "Статус",
    statusCritical: "Критично",
    statusWarning: "Мало",
    statusOk: "В норме",
    empty: "Ничего не найдено",
    noBatches: "Нет партий",
    moreBatches: "+ еще {n} партий",
    errorLoad: "Ошибка при загрузке данных склада",
    networkError: "Ошибка сети"
  },
  en: {
    title: "Warehouse (WMS)",
    subtitle: "Raw material stock, FEFO tracking, and Traffic Light system",
    totalItems: "Total Items",
    criticalItems: "Critical Stock (Red)",
    warningItems: "Low Stock (Yellow)",
    searchPlaceholder: "Search by product name or code...",
    filterAll: "All",
    filterOk: "Sufficient",
    colProduct: "Product",
    colCode: "Code / Category",
    colMin: "Min Stock",
    colCurrent: "Current Stock",
    colBatches: "Batches (FEFO)",
    colStatus: "Status",
    statusCritical: "Critical",
    statusWarning: "Low",
    statusOk: "Sufficient",
    empty: "Nothing found",
    noBatches: "No batches",
    moreBatches: "+ {n} more batches",
    errorLoad: "Error loading warehouse data",
    networkError: "Network error"
  }
}

type LangType = 'uz' | 'ru' | 'en'

type InventoryBatch = {
  id: number
  batchNumber: string
  quantity: number
  receivedAt: string
  expirationDate: string | null
}

type ProductInventory = {
  id: number
  name: string
  code: string | null
  category: string | null
  unit: string
  minStockLevel: number
  totalQuantity: number
  status: 'red' | 'yellow' | 'green'
  batches: InventoryBatch[]
}

export default function WarehouseContent() {
  const { lang } = useLanguage()
  const currentLang = (lang || 'uz') as LangType
  const l = tBase[currentLang]

  const [inventory, setInventory] = useState<ProductInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      const res = await fetch('/api/warehouse/inventory')
      if (res.ok) {
        const data = await res.json()
        setInventory(data)
      } else {
        toast.error(l.errorLoad)
      }
    } catch (err) {
      toast.error(l.networkError)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate top-level stats
  const totalItems = inventory.length
  const criticalItems = inventory.filter(i => i.status === 'red').length
  const warningItems = inventory.filter(i => i.status === 'yellow').length

  return (
    <div className="flex flex-col h-full animate-enter">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 rounded-3xl p-8 mb-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 tracking-tight">
              {l.title}
            </h1>
            <p className="text-emerald-200/80 mt-2 font-medium max-w-lg">
              {l.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{l.totalItems}</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalItems}</h3>
            </div>
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Package size={28} />
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setStatusFilter(statusFilter === 'red' ? 'all' : 'red')}
          className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-dark-900 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-1">{l.criticalItems}</p>
              <h3 className="text-3xl font-black text-red-600 dark:text-red-500">{criticalItems}</h3>
            </div>
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
              <AlertTriangle size={28} />
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setStatusFilter(statusFilter === 'yellow' ? 'all' : 'yellow')}
          className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/10 dark:to-dark-900 p-6 rounded-3xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-1">{l.warningItems}</p>
              <h3 className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{warningItems}</h3>
            </div>
            <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 shadow-inner">
              <Clock size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={l.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white shadow-sm"
          />
        </div>
        <div className="flex bg-slate-100/50 dark:bg-dark-800/50 p-1.5 rounded-2xl w-max border border-slate-200 dark:border-dark-700/50 backdrop-blur-sm">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-dark-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {l.filterAll}
          </button>
          <button 
            onClick={() => setStatusFilter('green')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'green' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            {l.filterOk}
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="flex-1 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Package size={64} className="text-slate-300 dark:text-dark-600 mb-4" />
            <p className="text-xl font-bold">{l.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-dark-800/30 border-b border-slate-200 dark:border-dark-700 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="p-5">{l.colProduct}</th>
                  <th className="p-5">{l.colCode}</th>
                  <th className="p-5">{l.colMin}</th>
                  <th className="p-5">{l.colCurrent}</th>
                  <th className="p-5">{l.colBatches}</th>
                  <th className="p-5">{l.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700/50">
                {filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors group">
                    <td className="p-5">
                      <p className="font-bold text-base text-slate-800 dark:text-white">{item.name}</p>
                    </td>
                    <td className="p-5">
                      <span className="inline-block bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-mono font-medium mb-1">
                        {item.code || '-'}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">{item.category || '-'}</p>
                    </td>
                    <td className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td className="p-5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-2xl text-slate-800 dark:text-white leading-none">
                          {item.totalQuantity}
                        </span>
                        <span className="text-sm font-bold text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      {item.batches.length === 0 ? (
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-dark-800 px-2 py-1 rounded-md">{l.noBatches}</span>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          {item.batches.slice(0, 3).map((b, i) => (
                            <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs">
                              <span className="font-mono font-bold text-slate-500 dark:text-slate-400">#{b.batchNumber}</span>
                              <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 rounded">{b.quantity} {item.unit}</span>
                            </div>
                          ))}
                          {item.batches.length > 3 && (
                            <div className="text-xs font-semibold text-indigo-400 dark:text-indigo-500 text-center mt-0.5">
                              {l.moreBatches.replace('{n}', (item.batches.length - 3).toString())}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      {item.status === 'red' && (
                        <div className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                          <AlertTriangle size={16} strokeWidth={2.5} />
                          <span className="text-xs font-bold uppercase tracking-wider">{l.statusCritical}</span>
                        </div>
                      )}
                      {item.status === 'yellow' && (
                        <div className="inline-flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                          <Clock size={16} strokeWidth={2.5} />
                          <span className="text-xs font-bold uppercase tracking-wider">{l.statusWarning}</span>
                        </div>
                      )}
                      {item.status === 'green' && (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                          <CheckCircle size={16} strokeWidth={2.5} />
                          <span className="text-xs font-bold uppercase tracking-wider">{l.statusOk}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

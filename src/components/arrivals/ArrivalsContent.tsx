'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, RefreshCw, Download, ArrowDownToLine } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useInfiniteTable, InfiniteTableFooter } from '@/components/common/InfiniteTable'

interface Arrival {
  id: number
  inspectionDate: string
  batchNumber: string
  quantity: number
  quantityUnit: string
  supplier: { id: number; name: string }
  product: { id: number; name: string }
  status: string
}

const tBase = {
  uz: {
    export: "Eksport",
    search: "Qidirish: mahsulot, ta'minotchi...",
    refresh: "Yangilash",
    noData: "Ma'lumot topilmadi",
    colDate: "Sana",
    colProduct: "Nomenklatura (Mahsulot)",
    colQty: "Miqdor",
    colSupplier: "Ta'minotchi",
    colBatch: "Partiyalar",
    featureDev: "Funksiya ishlab chiqilmoqda"
  },
  ru: {
    export: "Экспорт",
    search: "Поиск: продукт, поставщик...",
    refresh: "Обновить",
    noData: "Нет данных",
    colDate: "Дата",
    colProduct: "Номенклатура",
    colQty: "Количество",
    colSupplier: "Поставщик",
    colBatch: "Партии",
    featureDev: "Функция в разработке"
  },
  en: {
    export: "Export",
    search: "Search: product, supplier...",
    refresh: "Refresh",
    noData: "No data found",
    colDate: "Date",
    colProduct: "Nomenclature",
    colQty: "Quantity",
    colSupplier: "Supplier",
    colBatch: "Batches",
    featureDev: "Feature in development"
  }
}

export default function ArrivalsContent() {
  const { t, formatDual } = useLanguage()
  
  const l = {} as typeof tBase.uz;
  for (const key in tBase.uz) {
    (l as any)[key] = formatDual((tBase.uz as any)[key] || '', (tBase.ru as any)[key] || '', (tBase.en as any)[key] || '');
  }

  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchArrivals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '200',
        ...(search && { search }),
        status: 'ACCEPTED'
      })
      const res = await fetch(`/api/inspections?${params}`)
      if (res.ok) {
        const data = await res.json()
        setArrivals(data.data || [])
      }
    } catch {
      toast.error('Ma\'lumotlar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchArrivals()
  }, [fetchArrivals])

  const arrivalsPagination = useInfiniteTable(arrivals, 10, [search])

  const exportToExcel = () => {
    toast.success(l.featureDev)
  }

  return (
    <div className="space-y-5 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">{t('arrivals')}</h1>
          <p className="section-subtitle">{t('arrivalsSub')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="btn-secondary">
            <Download size={18} />
            {l.export}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={l.search}
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button onClick={fetchArrivals} className="btn-secondary gap-2">
            <RefreshCw size={15} />
            {l.refresh}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : arrivals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ArrowDownToLine size={48} className="mb-4 opacity-30" />
            <p className="font-medium text-lg">{l.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">{l.colDate}</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">{l.colProduct}</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none text-right">{l.colQty}</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">{l.colSupplier}</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">{l.colBatch}</th>
                </tr>
              </thead>
              <tbody>
                {arrivalsPagination.displayedItems.map((item) => (
                  <tr key={item.id} className="table-row hover:bg-dark-700/50">
                    <td className="text-slate-300 whitespace-nowrap">
                      {new Date(item.inspectionDate).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="text-slate-200 font-medium">
                      {item.product.name}
                    </td>
                    <td className="text-slate-300 text-right font-mono">
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="text-slate-300">
                      {item.supplier.name}
                    </td>
                    <td className="font-mono text-slate-400 text-sm">
                      {item.batchNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <InfiniteTableFooter
          currentCount={arrivalsPagination.visibleCount}
          totalCount={arrivalsPagination.totalCount}
          hasMore={arrivalsPagination.hasMore}
          showAll={arrivalsPagination.showAll}
          onLoadMore={arrivalsPagination.loadMore}
          onToggleShowAll={arrivalsPagination.toggleShowAll}
          sentinelRef={arrivalsPagination.sentinelRef}
          pageSize={10}
          itemName={{ uz: 'kirim hujjati', ru: 'поступлений', en: 'arrivals' }}
        />
      </div>
    </div>
  )
}

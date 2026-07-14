'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, FileText, RefreshCw, Download, ArrowDownToLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

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

export default function ArrivalsContent() {
  const { t, lang } = useLanguage()
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchArrivals = useCallback(async () => {
    setLoading(true)
    try {
      // By default, maybe we only want to show ACCEPTED goods in the arrivals list? 
      // The image doesn't show status, it just shows what arrived. Let's show all or only accepted?
      // Since it's "Приход" usually it means accepted to inventory. We'll show all but can filter.
      // For now, let's just fetch all like in the inspections but simplify the UI.
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        status: 'ACCEPTED' // Assuming 'Приход' only contains accepted items
      })
      const res = await fetch(`/api/inspections?${params}`)
      if (res.ok) {
        const data = await res.json()
        setArrivals(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      toast.error('Ma\'lumotlar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchArrivals()
  }, [fetchArrivals])

  const exportToExcel = () => {
    // Generate simple excel from the table data
    // In a real app we might call a backend endpoint for this
    toast.success(lang === 'ru' ? 'Функция в разработке' : 'Funksiya ishlab chiqilmoqda')
  }

  return (
    <div className="space-y-5 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">{t('arrivals')}</h1>
          <p className="section-subtitle">{t('arrivalsSub')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="btn-secondary">
            <Download size={18} />
            Экспорт
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
              placeholder={lang === 'ru' ? "Поиск: продукт, поставщик..." : "Qidirish: mahsulot, ta'minotchi..."}
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <button onClick={fetchArrivals} className="btn-secondary gap-2">
            <RefreshCw size={15} />
            {lang === 'ru' ? 'Обновить' : 'Yangilash'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : arrivals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ArrowDownToLine size={48} className="mb-4 opacity-30" />
            <p className="font-medium text-lg">{lang === 'ru' ? 'Нет данных' : "Ma'lumot topilmadi"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">Дата</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">Номенклатура</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none text-right">Количество</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">Поставщик</th>
                  <th style={{ backgroundColor: '#ed7d31', color: 'white' }} className="border-none">Партии</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.map((item) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-sm text-slate-400">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

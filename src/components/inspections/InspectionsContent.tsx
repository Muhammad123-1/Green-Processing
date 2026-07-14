'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  Edit,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
} from 'lucide-react'

interface Inspection {
  id: number
  actNumber: string
  inspectionDate: string
  batchNumber: string
  quantity: number
  quantityUnit: string
  temperature: number | null
  temperatureUnit: string
  conclusion: string
  status: string
  notes: string | null
  supplier: { id: number; name: string }
  product: { id: number; name: string; unit: string }
  createdAt: string
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'ACCEPTED': return <span className="badge-success"><CheckCircle size={10} />Qabul</span>
    case 'REJECTED': return <span className="badge-danger"><XCircle size={10} />Rad etildi</span>
    case 'CONDITIONAL': return <span className="badge-warning"><AlertTriangle size={10} />Shartli</span>
    default: return <span className="badge-info">{status}</span>
  }
}

export default function InspectionsContent() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const fetchInspections = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/inspections?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInspections(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      toast.error('Ma\'lumotlar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/inspections/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Akt o\'chirildi')
        fetchInspections()
      } else {
        toast.error('O\'chirishda xatolik')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setDeleteId(null)
    }
  }

  async function handleDownloadExcel(id: number, actNumber: string) {
    setGeneratingId(id)
    try {
      const res = await fetch(`/api/inspections/${id}/excel`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Akt_${actNumber}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Excel fayli yuklab olindi')
      } else {
        toast.error('Excel yaratishda xatolik')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div className="space-y-5 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Akt tarixi</h1>
          <p className="section-subtitle">Jami: {total} ta akt</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const toastId = toast.loading("Excel jurnal yaratilmoqda...");
              try {
                const res = await fetch('/api/reports/excel');
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `To'liq_Jurnal_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Yuklab olindi', { id: toastId });
                } else {
                  toast.error('Xatolik yuz berdi', { id: toastId });
                }
              } catch {
                toast.error('Tarmoq xatosi', { id: toastId });
              }
            }}
            className="btn-success"
          >
            <FileSpreadsheet size={18} />
            To'liq Jurnal
          </button>
          <Link href="/inspections/new" className="btn-primary">
            <Plus size={18} />
            Yangi akt
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Qidirish: akt raqami, mahsulot, ta'minotchi..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <select
            className="input-field w-44"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">Barcha holatlar</option>
            <option value="ACCEPTED">Qabul qilindi</option>
            <option value="REJECTED">Rad etildi</option>
            <option value="CONDITIONAL">Shartli qabul</option>
          </select>

          <button onClick={fetchInspections} className="btn-secondary gap-2">
            <RefreshCw size={15} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="font-medium text-lg">Aktlar topilmadi</p>
            <p className="text-sm mt-1">Filtrni o'zgartiring yoki yangi akt yarating</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Akt raqami</th>
                  <th>Sana</th>
                  <th>Ta'minotchi</th>
                  <th>Mahsulot</th>
                  <th>Partiya</th>
                  <th>Miqdor</th>
                  <th>Holat</th>
                  <th className="text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td>
                      <span className="font-mono text-blue-400 font-semibold text-sm">
                        {item.actNumber}
                      </span>
                    </td>
                    <td className="text-slate-300 whitespace-nowrap">
                      {new Date(item.inspectionDate).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="max-w-[160px] truncate text-slate-200">{item.supplier.name}</td>
                    <td className="max-w-[160px] truncate text-slate-200">{item.product.name}</td>
                    <td className="font-mono text-slate-300 text-sm">{item.batchNumber}</td>
                    <td className="text-slate-300 whitespace-nowrap">
                      {item.quantity} {item.quantityUnit}
                    </td>
                    <td>{statusBadge(item.status)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/inspections/${item.id}`}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                     flex items-center justify-center text-slate-400 hover:text-blue-400 
                                     transition-all duration-150"
                          title="Ko'rish"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/inspections/${item.id}/edit`}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                     flex items-center justify-center text-slate-400 hover:text-amber-400 
                                     transition-all duration-150"
                          title="Tahrirlash"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDownloadExcel(item.id, item.actNumber)}
                          disabled={generatingId === item.id}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                     flex items-center justify-center text-slate-400 hover:text-emerald-400 
                                     transition-all duration-150"
                          title="Excel yuklab olish"
                        >
                          {generatingId === item.id ? (
                            <div className="spinner w-3.5 h-3.5" />
                          ) : (
                            <FileSpreadsheet size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-red-500/20 border border-dark-600 hover:border-red-500/30
                                     flex items-center justify-center text-slate-400 hover:text-red-400 
                                     transition-all duration-150"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div
            className="card p-6 max-w-sm w-full animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Aktni o'chirish</h3>
                <p className="text-sm text-slate-400">Bu amalni qaytarib bo'lmaydi</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Haqiqatan ham bu aktni o'chirmoqchimisiz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center bg-red-600/30 hover:bg-red-600/50"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

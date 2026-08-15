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
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Award,
  AlertOctagon,
  ShieldCheck,
  Building,
  Scale,
  TrendingDown,
  X,
  Loader2,
  DollarSign,
  ClipboardCheck
} from 'lucide-react'
import ShopQCContent from '@/components/inspector/ShopQCContent'

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

interface DefectItem {
  id: number
  defectNumber: string
  productId: number
  batchNumber: string | null
  supplierId: number | null
  location: string
  defectType: string
  quantity: number
  unit: string
  estimatedCost: number | null
  actionTaken: string
  reason: string
  responsible: string | null
  createdAt: string
  product?: { id: number; name: string; unit: string; code: string }
  supplier?: { id: number; name: string; shortName: string }
}

interface SupplierScore {
  supplierId: number
  name: string
  shortName: string | null
  phone: string | null
  category: string
  totalDeliveries: number
  totalDeliveredKg: number
  totalAcceptedKg: number
  totalRejectedKg: number
  defectCount: number
  qualityScore: number
  grade: 'EXCELLENT' | 'GOOD' | 'WARNING'
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
  const [activeTab, setActiveTab] = useState<'journals' | 'inspections' | 'defects' | 'sqs'>('journals')

  // Inspections state
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  // Defects & Scrap state
  const [defects, setDefects] = useState<DefectItem[]>([])
  const [defectKpis, setDefectKpis] = useState<any>({ totalRecords: 0, totalDefectKg: 0, totalCost: 0 })
  const [defectsLoading, setDefectsLoading] = useState(false)
  const [showDefectModal, setShowDefectModal] = useState(false)
  const [savingDefect, setSavingDefect] = useState(false)
  const [defectFilterLoc, setDefectFilterLoc] = useState('ALL')
  const [defectForm, setDefectForm] = useState({
    productId: '',
    batchNumber: '',
    supplierId: '',
    location: 'INSPECTION',
    defectType: 'ROTTEN',
    quantity: '',
    unit: 'kg',
    estimatedCost: '',
    actionTaken: 'SCRAP_DISPOSAL',
    reason: '',
    responsible: 'Sifat Nazoratchisi'
  })

  // SQS (Supplier Quality Score) state
  const [supplierScores, setSupplierScores] = useState<SupplierScore[]>([])
  const [sqsSummary, setSqsSummary] = useState<any>({ totalSuppliers: 0, trustedCount: 0, warningCount: 0, avgScore: 100 })
  const [sqsLoading, setSqsLoading] = useState(false)

  // Products & Suppliers list for dropdowns
  const [productsList, setProductsList] = useState<any[]>([])
  const [suppliersList, setSuppliersList] = useState<any[]>([])

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
    } catch {
      toast.error('Ma\'lumotlar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  const fetchDefects = useCallback(async () => {
    setDefectsLoading(true)
    try {
      const url = defectFilterLoc !== 'ALL' ? `/api/defects?location=${defectFilterLoc}` : '/api/defects'
      const res = await fetch(url)
      if (res.ok) {
        const resData = await res.json()
        setDefects(resData.data || [])
        setDefectKpis(resData.kpis || {})
      }
    } catch {
      console.error('Error fetching defects')
    } finally {
      setDefectsLoading(false)
    }
  }, [defectFilterLoc])

  const fetchSQS = useCallback(async () => {
    setSqsLoading(true)
    try {
      const res = await fetch('/api/suppliers/quality-score')
      if (res.ok) {
        const resData = await res.json()
        setSupplierScores(resData.data || [])
        setSqsSummary(resData.summary || {})
      }
    } catch {
      console.error('Error fetching SQS')
    } finally {
      setSqsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInspections()
    // Load products and suppliers
    fetch('/api/products').then(r => r.json()).then(d => setProductsList(Array.isArray(d) ? d : []))
    fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliersList(Array.isArray(d) ? d : []))
  }, [fetchInspections])

  useEffect(() => {
    if (activeTab === 'defects') fetchDefects()
    if (activeTab === 'sqs') fetchSQS()
  }, [activeTab, fetchDefects, fetchSQS])

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

  async function handleSaveDefect(e: React.FormEvent) {
    e.preventDefault()
    if (!defectForm.productId || !defectForm.quantity || parseFloat(defectForm.quantity) <= 0 || !defectForm.reason) {
      toast.error('Mahsulot, miqdor va sababni to\'ldiring')
      return
    }

    setSavingDefect(true)
    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defectForm)
      })

      if (res.ok) {
        toast.success('Brak yozuvi saqlandi!')
        setShowDefectModal(false)
        setDefectForm({
          productId: '',
          batchNumber: '',
          supplierId: '',
          location: 'INSPECTION',
          defectType: 'ROTTEN',
          quantity: '',
          unit: 'kg',
          estimatedCost: '',
          actionTaken: 'SCRAP_DISPOSAL',
          reason: '',
          responsible: 'Sifat Nazoratchisi'
        })
        fetchDefects()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingDefect(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDefectModal(false)
        setDeleteId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-dark-900 to-teal-950 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Sifat Nazorati (QA / QC) & Laboratoriya
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300 tracking-tight">
              Sifat Nazorati, Kirish Aktlari & Brak Hisobi
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Xomashyo kirish nazorati, GOST talablari, brak va isroflar hisobi hamda yetkazib beruvchilar reytingi
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-dark-800/80 p-1.5 rounded-2xl border border-dark-700/80 backdrop-blur-md overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'inspections'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={16} />
              <span>📋 Kiruvchi Xomashyo Aktlari</span>
            </button>
            <button
              onClick={() => setActiveTab('journals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'journals'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardCheck size={16} />
              <span>📊 Sex Nazoratchilari Jurnallari (Audit)</span>
            </button>
            <button
              onClick={() => setActiveTab('sqs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'sqs'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award size={16} />
              <span>🛡️ Ta'minotchilar Auditi (SQS)</span>
            </button>
            <button
              onClick={() => setActiveTab('defects')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'defects'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertOctagon size={16} />
              <span>⚠️ Brak & Isrof Tahlili</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 0: 7 QC JOURNALS (FSSC 22000, CCP-1, CALIBRATION, DEGUSTATION, ETC.) */}
      {activeTab === 'journals' && (
        <div className="space-y-5">
          <ShopQCContent userRole="QUALITY_CONTROL" />
        </div>
      )}

      {/* TAB 1: INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="space-y-5">
          {/* Actions & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Qidirish: akt raqami, mahsulot, ta'minotchi..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>

              <select
                className="bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">Barcha holatlar</option>
                <option value="ACCEPTED">🟢 Qabul qilindi</option>
                <option value="REJECTED">🔴 Rad etildi</option>
                <option value="CONDITIONAL">🟡 Shartli qabul</option>
              </select>
            </div>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
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
                className="btn-success flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <FileSpreadsheet size={16} />
                To'liq Jurnal (.xlsx)
              </button>
              <Link 
                href="/inspections/new" 
                className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} />
                Yangi Akt Yaratish
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
              </div>
            ) : inspections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileText size={48} className="mb-4 opacity-30" />
                <p className="font-semibold text-lg text-slate-300">Aktlar topilmadi</p>
                <p className="text-sm mt-1">Filtrni o'zgartiring yoki yangi akt yarating</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Akt raqami</th>
                      <th className="p-4">Sana</th>
                      <th className="p-4">Ta'minotchi</th>
                      <th className="p-4">Mahsulot</th>
                      <th className="p-4">Partiya</th>
                      <th className="p-4">Miqdor</th>
                      <th className="p-4">Holat</th>
                      <th className="p-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {inspections.map((item) => (
                      <tr key={item.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-emerald-400 font-bold">
                            {item.actNumber}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 whitespace-nowrap">
                          {new Date(item.inspectionDate).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="p-4 max-w-[160px] truncate font-medium text-slate-200">{item.supplier.name}</td>
                        <td className="p-4 max-w-[160px] truncate font-bold text-white">{item.product.name}</td>
                        <td className="p-4 font-mono text-slate-300">{item.batchNumber}</td>
                        <td className="p-4 text-slate-200 font-mono font-bold whitespace-nowrap">
                          {item.quantity} {item.quantityUnit}
                        </td>
                        <td className="p-4">{statusBadge(item.status)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/inspections/${item.id}`}
                              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Ko'rish"
                            >
                              <Eye size={15} />
                            </Link>
                            <Link
                              href={`/inspections/${item.id}/edit`}
                              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-amber-400 transition-colors"
                              title="Tahrirlash"
                            >
                              <Edit size={15} />
                            </Link>
                            <button
                              onClick={() => handleDownloadExcel(item.id, item.actNumber)}
                              disabled={generatingId === item.id}
                              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Excel yuklab olish"
                            >
                              {generatingId === item.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <FileSpreadsheet size={15} />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-2 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={15} />
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-dark-750">
                <p className="text-xs text-slate-400">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total} ta akt
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-300 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEFECTS & SCRAP MANAGEMENT */}
      {activeTab === 'defects' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Jami Brak / Isrof</p>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">
                    {defectKpis.totalDefectKg?.toFixed(1) || 0} kg
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <AlertOctagon size={24} />
                </div>
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Brak Hujjatlari</p>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {defectKpis.totalRecords || 0} ta
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <FileText size={24} />
                </div>
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Zarar Qiymati</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">
                    {defectKpis.totalCost?.toLocaleString() || 0} so'm
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-900 border border-dark-750 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Bo'lim:</span>
              <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
                {['ALL', 'INSPECTION', 'WAREHOUSE', 'WORKSHOP', 'KITCHEN'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setDefectFilterLoc(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      defectFilterLoc === loc ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {loc === 'ALL' ? 'Barchasi' : loc === 'INSPECTION' ? 'Kirish Nazorati' : loc === 'WAREHOUSE' ? 'Ombor' : loc === 'WORKSHOP' ? 'Sex' : 'Oshxona'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowDefectModal(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 px-5 py-2 rounded-xl text-sm font-bold transition-all"
            >
              <Plus size={18} />
              <span>Yangi Brak Yozish</span>
            </button>
          </div>

          {/* Defects Table */}
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {defectsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-rose-500" /></div>
            ) : defects.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertOctagon size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold text-slate-400">Hech qanday brak yozuvi topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Hujjat & Sana</th>
                      <th className="p-4">Mahsulot / Partiya</th>
                      <th className="p-4">Bo'lim</th>
                      <th className="p-4">Brak Turi & Sabab</th>
                      <th className="p-4 text-center">Brak Miqdori</th>
                      <th className="p-4">Ko'rilgan Chora</th>
                      <th className="p-4">Mas'ul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {defects.map((d) => (
                      <tr key={d.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs">
                          <div className="font-bold text-rose-400">{d.defectNumber}</div>
                          <div className="text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{d.product?.name}</div>
                          {d.batchNumber && (
                            <div className="text-xs font-mono text-slate-400">Partiya: #{d.batchNumber}</div>
                          )}
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-300">
                          {d.location === 'INSPECTION' ? '🔍 Kirish Nazorati' : d.location === 'WAREHOUSE' ? '🏢 Ombor' : d.location === 'WORKSHOP' ? '🔪 Ishlab Chiqarish Sexi' : '🍲 Oshxona'}
                        </td>
                        <td className="p-4">
                          <div className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1">
                            {d.defectType === 'ROTTEN' ? 'Buzilgan / Chirigan' : d.defectType === 'FOREIGN_OBJECT' ? 'Begona Jism' : d.defectType === 'TEMPERATURE_ABUSE' ? 'Harorat Buzilgan' : d.defectType === 'EXPIRED' ? 'Muddati O\'tgan' : 'Shikastlangan'}
                          </div>
                          <div className="text-xs text-slate-400">{d.reason}</div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-rose-400">
                          {d.quantity} {d.unit}
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-300">
                          {d.actionTaken === 'RETURN_TO_SUPPLIER' ? 'Ta\'minotchiga qaytarildi' : d.actionTaken === 'SCRAP_DISPOSAL' ? 'Utilizatsiya / Chiqitga chiqarildi' : 'Qayta saralandi'}
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-medium">
                          {d.responsible || 'QC'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIER QUALITY SCORE (SQS) */}
      {activeTab === 'sqs' && (
        <div className="space-y-6">
          {/* SQS Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Jami Yetkazib Beruvchilar</p>
              <h3 className="text-2xl font-black text-white mt-1">{sqsSummary.totalSuppliers} ta</h3>
            </div>
            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <p className="text-xs font-bold text-emerald-400 uppercase">A'lo & Ishonchli (&gt;95%)</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{sqsSummary.trustedCount} ta</h3>
            </div>
            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <p className="text-xs font-bold text-rose-400 uppercase">Xavfli Hamkorlar (&lt;85%)</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{sqsSummary.warningCount} ta</h3>
            </div>
            <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl">
              <p className="text-xs font-bold text-indigo-400 uppercase">O'rtacha Sifat Indeksi</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">{sqsSummary.avgScore}%</h3>
            </div>
          </div>

          {/* SQS Table */}
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            {sqsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-dark-750 bg-dark-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Yetkazib Beruvchi</th>
                      <th className="p-4">Yetkazmalar Soni</th>
                      <th className="p-4 text-center">Jami Kelgan (kg)</th>
                      <th className="p-4 text-center">Qabul Qilingan (kg)</th>
                      <th className="p-4 text-center">Brak / Qaytarilgan (kg)</th>
                      <th className="p-4 text-center">Sifat Indeksi (SQS)</th>
                      <th className="p-4">Ishonchlilik Darajasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {supplierScores.map((s) => (
                      <tr key={s.supplierId} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{s.name}</div>
                          {s.phone && <div className="text-xs text-slate-500">{s.phone}</div>}
                        </td>
                        <td className="p-4 font-mono text-slate-300 font-bold">{s.totalDeliveries} ta</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{s.totalDeliveredKg.toLocaleString()} kg</td>
                        <td className="p-4 text-center font-mono font-bold text-emerald-400">{s.totalAcceptedKg.toLocaleString()} kg</td>
                        <td className="p-4 text-center font-mono font-bold text-rose-400">{s.totalRejectedKg.toLocaleString()} kg</td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1 font-mono font-black text-base text-white">
                            <span>{s.qualityScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {s.grade === 'EXCELLENT' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle size={14} /> A'lo / Ishonchli
                            </span>
                          )}
                          {s.grade === 'GOOD' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertTriangle size={14} /> Qoniqarli
                            </span>
                          )}
                          {s.grade === 'WARNING' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <XCircle size={14} /> Xavfli / Ko'p Brak
                            </span>
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
      )}

      {/* MODAL: NEW DEFECT RECORD */}
      {showDefectModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowDefectModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yangi Brak / Isrof Dalolatnomasi</h3>
                  <p className="text-xs text-slate-400">Brak sababi, miqdori va ko'rilgan chorani qayd etish</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDefectModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDefect} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Mahsulot <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defectForm.productId}
                    onChange={(e) => setDefectForm({ ...defectForm, productId: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Tanlang...</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Bo'lim / Joylashuv <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defectForm.location}
                    onChange={(e) => setDefectForm({ ...defectForm, location: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="INSPECTION">Kirish Nazorati</option>
                    <option value="WAREHOUSE">Omborxona (WMS)</option>
                    <option value="WORKSHOP">Ishlab Chiqarish Sexi</option>
                    <option value="KITCHEN">Oshxona / Zagotovka</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Brak Turi <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defectForm.defectType}
                    onChange={(e) => setDefectForm({ ...defectForm, defectType: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="ROTTEN">Buzilgan / Chirigan</option>
                    <option value="FOREIGN_OBJECT">Begona Jism / Ifloslik</option>
                    <option value="TEMPERATURE_ABUSE">Harorat Buzilgan</option>
                    <option value="EXPIRED">Muddati O'tgan</option>
                    <option value="MECHANICAL_DAMAGE">Mexanik Shikastlangan</option>
                    <option value="OTHER">Boshqa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Brak Miqdori (kg) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 12.5"
                    value={defectForm.quantity}
                    onChange={(e) => setDefectForm({ ...defectForm, quantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Brak Sababi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Yetkazib beruvchidan muzlagan holda kelgan va erigach chirigan"
                  value={defectForm.reason}
                  onChange={(e) => setDefectForm({ ...defectForm, reason: e.target.value })}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Ko'rilgan Chora
                  </label>
                  <select
                    value={defectForm.actionTaken}
                    onChange={(e) => setDefectForm({ ...defectForm, actionTaken: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="SCRAP_DISPOSAL">Utilizatsiya / Chiqitga chiqarildi</option>
                    <option value="RETURN_TO_SUPPLIER">Yetkazib beruvchiga qaytarildi</option>
                    <option value="REWORK_RE_SORT">Qayta saralandi / Ishlov berildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Zarar Qiymati (so'm)
                  </label>
                  <input
                    type="number"
                    placeholder="Masalan: 150000"
                    value={defectForm.estimatedCost}
                    onChange={(e) => setDefectForm({ ...defectForm, estimatedCost: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowDefectModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingDefect}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {savingDefect && <Loader2 size={16} className="animate-spin" />}
                  <span>Brakni Qayd Etish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter" onClick={() => setDeleteId(null)}>
          <div
            className="bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-enter"
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
                className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 flex-1 text-sm font-semibold transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white flex-1 text-sm font-bold transition-colors"
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

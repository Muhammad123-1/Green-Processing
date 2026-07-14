'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Truck,
  Package,
  Hash,
  Scale,
  Thermometer,
  User,
  Car,
  FileText,
  Loader2,
  ClipboardList,
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
  packaging: string | null
  color: string | null
  smell: string | null
  appearance: string | null
  conclusion: string
  status: string
  inspector: string | null
  vehicleNumber: string | null
  invoiceNumber: string | null
  notes: string | null
  sheetName: string | null
  createdAt: string
  supplier: { id: number; name: string; phone: string | null; address: string | null }
  product: { id: number; name: string; unit: string; gost: string | null }
  user: { id: number; name: string } | null
}

const statusInfo = {
  ACCEPTED: { label: 'Qabul qilindi', icon: CheckCircle, className: 'badge-success' },
  REJECTED: { label: 'Rad etildi', icon: XCircle, className: 'badge-danger' },
  CONDITIONAL: { label: 'Shartli qabul', icon: AlertTriangle, className: 'badge-warning' },
}

export default function InspectionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    fetchInspection()
  }, [id])

  async function fetchInspection() {
    try {
      const res = await fetch(`/api/inspections/${id}`)
      if (res.ok) {
        setInspection(await res.json())
      } else {
        toast.error('Akt topilmadi')
        router.push('/inspections')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadExcel() {
    if (!inspection) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/excel`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Akt_${inspection.actNumber}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Excel fayli yuklab olindi')
      } else {
        toast.error('Excel yaratishda xatolik')
      }
    } catch {
      toast.error('Xatolik')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/inspections/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Akt o\'chirildi')
        router.push('/inspections')
      }
    } catch {
      toast.error('O\'chirishda xatolik')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (!inspection) return null

  const status = statusInfo[inspection.status as keyof typeof statusInfo] || statusInfo.ACCEPTED

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/inspections"
            className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600
                       flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="section-title font-mono">{inspection.actNumber}</h1>
              <span className={status.className}>
                <status.icon size={10} />
                {status.label}
              </span>
            </div>
            <p className="section-subtitle">
              {new Date(inspection.inspectionDate).toLocaleDateString('uz-UZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={generating}
            className="btn-success"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Excel
          </button>
          <Link href={`/inspections/${id}/edit`} className="btn-secondary">
            <Edit size={16} />
            Tahrirlash
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Ta'minotchi</h3>
          </div>
          <p className="text-slate-100 font-medium">{inspection.supplier.name}</p>
          {inspection.supplier.phone && (
            <p className="text-sm text-slate-400 mt-1">{inspection.supplier.phone}</p>
          )}
          {inspection.supplier.address && (
            <p className="text-sm text-slate-400">{inspection.supplier.address}</p>
          )}
          {inspection.vehicleNumber && (
            <div className="mt-3 pt-3 border-t border-dark-700">
              <p className="text-xs text-slate-500">Transport</p>
              <p className="text-sm text-slate-300 mt-0.5">{inspection.vehicleNumber}</p>
            </div>
          )}
          {inspection.invoiceNumber && (
            <div className="mt-2">
              <p className="text-xs text-slate-500">Faktura №</p>
              <p className="text-sm text-slate-300 mt-0.5">{inspection.invoiceNumber}</p>
            </div>
          )}
        </div>

        {/* Product card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-purple-400" />
            <h3 className="font-semibold text-white text-sm">Mahsulot</h3>
          </div>
          <p className="text-slate-100 font-medium">{inspection.product.name}</p>
          {inspection.product.gost && (
            <p className="text-xs text-slate-500 mt-1">{inspection.product.gost}</p>
          )}
          <div className="mt-3 pt-3 border-t border-dark-700 grid grid-cols-2 gap-3">
            <InfoItem icon={<Hash size={13} />} label="Partiya" value={inspection.batchNumber} />
            <InfoItem
              icon={<Scale size={13} />}
              label="Miqdor"
              value={`${inspection.quantity} ${inspection.quantityUnit}`}
            />
            <InfoItem
              icon={<Thermometer size={13} />}
              label="Harorat"
              value={inspection.temperature != null ? `${inspection.temperature} ${inspection.temperatureUnit}` : '—'}
            />
            <InfoItem
              icon={<ClipboardList size={13} />}
              label="Qadoqlash"
              value={inspection.packaging || '—'}
            />
          </div>
        </div>
      </div>

      {/* Organoleptic */}
      {(inspection.color || inspection.smell || inspection.appearance) && (
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Organoleptik ko'rsatkichlar</h3>
          <div className="grid grid-cols-3 gap-4">
            {inspection.color && <InfoItem label="Rangi" value={inspection.color} />}
            {inspection.smell && <InfoItem label="Hidi" value={inspection.smell} />}
            {inspection.appearance && <InfoItem label="Ko'rinishi" value={inspection.appearance} />}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="card p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Xulosa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Xulosa matni</p>
            <p className="text-slate-200">{inspection.conclusion}</p>
          </div>
          {inspection.inspector && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Nazoratchi</p>
              <p className="text-slate-200">{inspection.inspector}</p>
            </div>
          )}
          {inspection.notes && (
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 mb-1">Izoh</p>
              <p className="text-slate-200">{inspection.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Yaratildi: {new Date(inspection.createdAt).toLocaleString('uz-UZ')}
          </span>
          {inspection.sheetName && (
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={11} />
              Excel varaq: {inspection.sheetName}
            </span>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="card p-6 max-w-sm w-full animate-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Aktni o'chirish</h3>
                <p className="text-sm text-slate-400">{inspection.actNumber}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1 justify-center">
                Bekor qilish
              </button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center bg-red-600/30">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  )
}

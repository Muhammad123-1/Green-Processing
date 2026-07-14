'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Save,
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  Thermometer,
  Scale,
  ClipboardCheck,
  FileSpreadsheet,
  Hash,
  User,
  Car,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  code: string | null
  unit: string
  defaultTemperature: string | null
  minTemperature: number | null
  maxTemperature: number | null
  defaultPackaging: string | null
  defaultConclusion: string | null
  category: string | null
}

interface Supplier {
  id: number
  name: string
  shortName: string | null
}

interface FormData {
  inspectionDate: string
  supplierId: string
  productId: string
  batchNumber: string
  quantity: string
  quantityUnit: string
  temperature: string
  temperatureUnit: string
  packaging: string
  color: string
  smell: string
  appearance: string
  conclusion: string
  status: string
  inspector: string
  vehicleNumber: string
  invoiceNumber: string
  notes: string
  sheetName: string
  customFields: string
  uploadedImages: string[]
}

const defaultForm: FormData = {
  inspectionDate: new Date().toISOString().split('T')[0],
  supplierId: '',
  productId: '',
  batchNumber: '',
  quantity: '',
  quantityUnit: 'kg',
  temperature: '',
  temperatureUnit: '°C',
  packaging: '',
  color: '',
  smell: '',
  appearance: '',
  conclusion: 'Мувофиқ / Muvofiq',
  status: 'ACCEPTED',
  inspector: '',
  vehicleNumber: '',
  invoiceNumber: '',
  notes: '',
  sheetName: '',
  customFields: '{}',
  uploadedImages: [],
}

import { SHEET_CONFIGS } from '@/lib/sheetConfigs'

export default function NewInspectionForm({ initialData }: { initialData?: Partial<FormData> & { id?: number; actNumber?: string } }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState<FormData>({ ...defaultForm, ...initialData })
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const [customFieldsState, setCustomFieldsState] = useState<Record<string, string>>(
    initialData?.customFields ? JSON.parse(initialData.customFields) : {}
  )

  const isEditing = !!initialData?.id
  const [isOshxona, setIsOshxona] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()
    fetchSheets()
    if (typeof window !== 'undefined') {
      setIsOshxona(window.location.search.includes('oshxona=true'))
    }
  }, [])

  useEffect(() => {
    if (form.productId) {
      const product = products.find((p) => p.id === parseInt(form.productId))
      if (product) {
        setSelectedProduct(product)
        setForm((prev) => ({
          ...prev,
          quantityUnit: product.unit || 'kg',
          packaging: prev.packaging || product.defaultPackaging || '',
          conclusion: prev.conclusion || product.defaultConclusion || 'Мувофиқ / Muvofiq',
        }))
      }
    } else {
      setSelectedProduct(null)
    }
  }, [form.productId, products])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      if (res.ok) setProducts(await res.json())
    } catch {}
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) setSuppliers(await res.json())
    } catch {}
  }

  async function fetchSheets() {
    try {
      const res = await fetch('/api/templates/sheets')
      if (res.ok) {
        const data = await res.json()
        setSheets(data.sheets || [])
      }
    } catch {}
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const { url } = await res.json()
        setForm(prev => ({
          ...prev,
          uploadedImages: [...(prev.uploadedImages || []), url]
        }))
        toast.success("Rasm yuklandi")
      } else {
        toast.error("Rasm yuklashda xato")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  function removeImage(index: number) {
    setForm(prev => ({
      ...prev,
      uploadedImages: (prev.uploadedImages || []).filter((_, i) => i !== index)
    }))
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'sheetName' && value) {
        const config = SHEET_CONFIGS[value]
        if (config) {
          const newCustomFields: Record<string, string> = {}
          config.customFields.forEach(cf => {
            newCustomFields[cf.key] = cf.default
          })
          setCustomFieldsState(newCustomFields)
          next.customFields = JSON.stringify(newCustomFields)
        }
      }
      return next
    })
  }

  function handleCustomFieldChange(key: string, value: string) {
    setCustomFieldsState(prev => {
      const next = { ...prev, [key]: value }
      setForm(f => ({ ...f, customFields: JSON.stringify(next) }))
      return next
    })
  }

  function validateForm(): string | null {
    if (!form.inspectionDate) return 'Sana kiritilmagan'
    if (!form.supplierId) return 'Ta\'minotchi tanlanmagan'
    if (!form.productId) return 'Mahsulot tanlanmagan'
    if (!form.batchNumber.trim()) return 'Partiya raqami kiritilmagan'
    if (!form.quantity || parseFloat(form.quantity) <= 0) return 'Miqdor noto\'g\'ri'
    return null
  }

  async function handleSave() {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/inspections/${initialData?.id}` : '/api/inspections'
      const method = isEditing ? 'PUT' : 'POST'
      
      const isOshxona = typeof window !== 'undefined' && window.location.search.includes('oshxona=true')
      const payload = {
        ...form,
        ...(isOshxona ? {
          releasedQuantity: form.quantity,
          releasedDate: new Date().toISOString()
        } : {})
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setSavedId(data.id)
        toast.success(isEditing ? 'Akt yangilandi!' : `Akt yaratildi: ${data.actNumber}`)
        if (!isEditing) {
          setTimeout(() => router.push(`/inspections/${data.id}`), 1000)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Saqlashda xatolik')
      }
    } catch (err) {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndExcel() {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/inspections/${initialData?.id}` : '/api/inspections'
      const method = isEditing ? 'PUT' : 'POST'

      const isOshxona = typeof window !== 'undefined' && window.location.search.includes('oshxona=true')
      const payload = {
        ...form,
        ...(isOshxona ? {
          releasedQuantity: form.quantity,
          releasedDate: new Date().toISOString()
        } : {})
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setSavedId(data.id)
        toast.success(`Akt saqlandi: ${data.actNumber}`)

        // Now download Excel
        setGenerating(true)
        const excelRes = await fetch(`/api/inspections/${data.id}/excel`)
        if (excelRes.ok) {
          const blob = await excelRes.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Akt_${data.actNumber}.xlsx`
          a.click()
          URL.revokeObjectURL(url)
          toast.success('Excel fayli tayyor!')
        }

        setTimeout(() => router.push(`/inspections/${data.id}`), 1500)
      } else {
        toast.error('Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inspections" className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600
                                             flex items-center justify-center text-slate-400 hover:text-slate-200
                                             transition-all duration-200">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="section-title">
            {isEditing ? `Akt tahrirlash — ${initialData?.actNumber}` : 'Yangi kiruvchi xomashyo akti'}
          </h1>
          <p className="section-subtitle">Barcha maydonlarni to'ldiring</p>
        </div>
      </div>

      {/* Section 1: Main Info */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <FileText size={14} className="text-blue-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Asosiy ma'lumotlar</h3>
        </div>
        <div className="divider !mt-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><Calendar size={13} />Qabul qilish sanasi *</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={form.inspectionDate}
              onChange={(e) => handleChange('inspectionDate', e.target.value)}
            />
          </div>

          {/* Invoice Number */}
          {!isOshxona && (
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><FileText size={13} />Faktura raqami</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Faktura №"
                value={form.invoiceNumber}
                onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              />
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><Truck size={13} />Ta'minotchi *</span>
            </label>
            <select
              className="input-field"
              value={form.supplierId}
              onChange={(e) => handleChange('supplierId', e.target.value)}
            >
              <option value="">— Tanlang —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          {!isOshxona && (
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><Car size={13} />Transport raqami</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="01 A 123 AA"
                value={form.vehicleNumber}
                onChange={(e) => handleChange('vehicleNumber', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Product Info */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <Package size={14} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Mahsulot ma'lumotlari</h3>
        </div>
        <div className="divider !mt-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Product */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><Package size={13} />Mahsulot *</span>
            </label>
            <select
              className="input-field"
              value={form.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
            >
              <option value="">— Tanlang —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.category ? `(${p.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><Hash size={13} />Partiya raqami *</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Partiya / lot raqami"
              value={form.batchNumber}
              onChange={(e) => handleChange('batchNumber', e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><Scale size={13} />Miqdor *</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input-field flex-1"
                placeholder="0"
                min="0"
                step="0.001"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
              />
              <select
                className="input-field w-24"
                value={form.quantityUnit}
                onChange={(e) => handleChange('quantityUnit', e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litr">litr</option>
                <option value="dona">dona</option>
                <option value="qop">qop</option>
                <option value="kanistra">kan.</option>
                <option value="t">t</option>
              </select>
            </div>
          </div>

          {/* Temperature */}
          {!isOshxona && (
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><Thermometer size={13} />Harorat</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input-field flex-1"
                  placeholder="0"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                />
                <select
                  className="input-field w-20"
                  value={form.temperatureUnit}
                  onChange={(e) => handleChange('temperatureUnit', e.target.value)}
                >
                  <option value="°C">°C</option>
                  <option value="°F">°F</option>
                </select>
              </div>
              {selectedProduct && selectedProduct.minTemperature !== null && (
                <p className="text-xs text-slate-500 mt-1">
                  Norma: {selectedProduct.minTemperature}°C — {selectedProduct.maxTemperature}°C
                </p>
              )}
            </div>
          )}

          {/* Packaging */}
          {!isOshxona && (
            <div>
              <label className="label">Qadoqlash holati</label>
              <input
                type="text"
                className="input-field"
                placeholder="Butun, yaxshi holat..."
                value={form.packaging}
                onChange={(e) => handleChange('packaging', e.target.value)}
              />
            </div>
          )}

          {/* Excel Sheet */}
          {!isOshxona && sheets.length > 0 && (
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} />Excel varaqi (shablon)</span>
              </label>
              <select
                className="input-field"
                value={form.sheetName}
                onChange={(e) => handleChange('sheetName', e.target.value)}
              >
                <option value="">— Birinchi varaq —</option>
                {sheets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Organoleptic / Custom Fields */}
      {!isOshxona && (
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <ClipboardCheck size={14} className="text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">
            {form.sheetName && SHEET_CONFIGS[form.sheetName]?.customFields.length > 0 
              ? 'Maxsus ko\'rsatkichlar' 
              : 'Organoleptik ko\'rsatkichlar'}
          </h3>
        </div>
        <div className="divider !mt-2" />

        {form.sheetName && SHEET_CONFIGS[form.sheetName]?.customFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SHEET_CONFIGS[form.sheetName].customFields.map((cf) => (
              <div key={cf.key}>
                <label className="label">{cf.label}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={cf.default}
                  value={customFieldsState[cf.key] ?? ''}
                  onChange={(e) => handleCustomFieldChange(cf.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="label">Rangi</label>
              <input
                type="text"
                className="input-field"
                placeholder="Oq, sariq, to'q..."
                value={form.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Hidi</label>
              <input
                type="text"
                className="input-field"
                placeholder="Xarakterli, yoqimli..."
                value={form.smell}
                onChange={(e) => handleChange('smell', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ko'rinishi</label>
              <input
                type="text"
                className="input-field"
                placeholder="Sochiluvchi, bir jinsli..."
                value={form.appearance}
                onChange={(e) => handleChange('appearance', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      )}

      {/* Section 3.5: Images */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Camera size={14} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Akt rasmlari</h3>
        </div>
        <div className="divider !mt-2" />
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {(form.uploadedImages || []).map((url, idx) => (
              <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-dark-600">
                <Image src={url} alt="Uploaded" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-dark-600 hover:border-dark-400 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-dark-800">
              {uploadingImage ? (
                <Loader2 size={20} className="text-slate-400 animate-spin" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-medium text-center px-1">Rasm yuklash</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: Conclusion */}
      {!isOshxona && (
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <CheckCircle size={14} className="text-amber-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Xulosa va natija</h3>
        </div>
        <div className="divider !mt-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Status */}
          <div>
            <label className="label">Qabul holati *</label>
            <div className="flex gap-3">
              {[
                { value: 'ACCEPTED', label: 'Qabul qilindi', icon: <CheckCircle size={14} />, color: 'emerald' },
                { value: 'REJECTED', label: 'Rad etildi', icon: <XCircle size={14} />, color: 'red' },
                { value: 'CONDITIONAL', label: 'Shartli', icon: <AlertTriangle size={14} />, color: 'amber' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('status', option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium
                             transition-all duration-200
                             ${form.status === option.value
                               ? option.color === 'emerald'
                                 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                 : option.color === 'red'
                                 ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                 : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                               : 'bg-dark-900 border-dark-600 text-slate-400 hover:border-dark-500'
                             }`}
                >
                  {option.icon}
                  <span className="hidden sm:block">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inspector */}
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5"><User size={13} />Nazoratchi</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="F.I.O."
              value={form.inspector}
              onChange={(e) => handleChange('inspector', e.target.value)}
            />
          </div>

          {/* Conclusion */}
          <div className="md:col-span-2">
            <label className="label">Xulosa matni</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Мувофиқ / Muvofiq ГОСТ..."
              value={form.conclusion}
              onChange={(e) => handleChange('conclusion', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="label">Izoh (ixtiyoriy)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Qo'shimcha ma'lumot..."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>
      </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 justify-end pb-6">
        <Link href="/inspections" className="btn-secondary">
          <ArrowLeft size={16} />
          Bekor qilish
        </Link>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-secondary"
        >
          {saving && !generating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Saqlash
        </button>

        {!isOshxona && (
          <button
            onClick={handleSaveAndExcel}
            disabled={saving || generating}
            className="btn-success"
          >
            {(saving || generating) ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            Saqlash + Excel yuklab olish
          </button>
        )}
      </div>
    </div>
  )
}

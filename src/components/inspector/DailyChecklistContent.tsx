'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Database,
  FileText,
  RotateCcw,
  Eye,
  Loader2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import QCInspectorGuideModal from '@/components/inspector/QCInspectorGuideModal'

export interface PackagingProductItem {
  id: string
  nameUz: string
  nameSub?: string
  packWeight: string
  packWeightSub?: string
  packsPerBox: string
  packsPerBoxSub?: string
  boxTotalWeight: string
  boxTotalWeightSub?: string
  weightTolerance: string
  inspectionFrequency: string
  statusOk: boolean
  isCustom?: boolean
}

export const defaultPackagingItems: PackagingProductItem[] = [
  {
    id: 'lemon',
    nameUz: 'Лимон',
    nameSub: 'Лимон / Lemon',
    packWeight: '1 пакетда 2 dona',
    packWeightSub: '2 pcs per pack',
    packsPerBox: '12 та пакет',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '12 пакет (24 dona / box)',
    boxTotalWeightSub: '24 pcs / box',
    weightTolerance: '2 dona / пакет (100% соғлом)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
  {
    id: 'cucumber',
    nameUz: 'Бодринг',
    nameSub: 'Огурец / Cucumber',
    packWeight: '1 kg / 1 пакет',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 та пакет',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 коробка',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
  {
    id: 'tomato',
    nameUz: 'Томат',
    nameSub: 'Томаты / Tomato',
    packWeight: '1 kg / 1 пакет',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 та пакет',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 коробка',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
  {
    id: 'iceberg',
    nameUz: 'Айсберг',
    nameSub: 'Айсберг / Iceberg',
    packWeight: '1 kg / 1 пакет',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 та пакет',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 коробка',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
  {
    id: 'onion',
    nameUz: 'Пиёз',
    nameSub: 'Лук / Onion',
    packWeight: '0.5 kg / 1 пакет',
    packWeightSub: '0.5 kg / 1 pack',
    packsPerBox: '12 та пакет',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '6 kg / 1 коробка',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '492.5 g - 507.5 g (0.5 kg ± 7.5g)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
  {
    id: 'coleslaw',
    nameUz: 'Коул Слоу',
    nameSub: 'Коул Слоу / Cole Slaw',
    packWeight: '0.5 kg / 1 пакет',
    packWeightSub: '0.5 kg / 1 pack',
    packsPerBox: '12 та пакет',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '6 kg / 1 коробка',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '492.5 g - 507.5 g (0.5 kg ± 7.5g)',
    inspectionFrequency: 'Ҳар 5-пакет',
    statusOk: true,
  },
]

interface ChecklistForm {
  // 1. Qadoqlash standartlari (Section 1)
  packLemon: boolean
  packCucumber: boolean
  packTomato: boolean
  packIceberg: boolean
  packOnion: boolean
  packColeslaw: boolean

  // 2. Texnologik jarayon va xavfsizlik (Section 2 - 14 rows)
  // Row 1: Xomashyo
  rawMaterialTemp1: string
  rawMaterialTemp2: string
  rawMaterialTemp3: string
  rawMaterialOk: boolean
  rawMaterialDisc: string
  rawMaterialAct: string

  // Row 2: Tozalash
  cleaningPercent: string
  cleaningOk: boolean
  cleaningDisc: string
  cleaningAct: string

  // Row 3: To'g'rash kalibri
  cuttingSize: string
  cuttingOk: boolean
  cuttingDisc: string
  cuttingAct: string

  // Row 4: Dezinfeksiya harorati (CCP-2)
  dezTemp1: string
  dezTemp2: string
  dezTemp3: string
  dezTemp4: string
  dezTemp5: string
  dezTemp6: string
  dezTempOk: boolean
  dezTempDisc: string
  dezTempAct: string

  // Row 5: Faol xlor (CCP-1)
  dezChlorine1: string
  dezChlorine2: string
  dezChlorine3: string
  dezChlorine4: string
  dezChlorine5: string
  dezChlorine6: string
  dezChlorineOk: boolean
  dezChlorineDisc: string
  dezChlorineAct: string

  // Row 6: Konservant
  preservative: string
  preservativeOk: boolean
  preservativeDisc: string
  preservativeAct: string

  // Row 7: Qoldiq xlor
  residualChlorine: boolean
  residualChlorineOk: boolean
  residualChlorineDisc: string
  residualChlorineAct: string

  // Row 8: Tsentrifuga
  dryingDry: boolean
  dryingOk: boolean
  dryingDisc: string
  dryingAct: string

  // Row 9: Vizual nazorat
  inspectionClean: boolean
  inspectionOk: boolean
  inspectionDisc: string
  inspectionAct: string

  // Row 10: Vazn nazorati
  weightLemon: string
  weight1kg: string
  weight500g: string
  weightOk: boolean
  weightDisc: string
  weightAct: string

  // Row 11: Germetiklik
  sealingOk: boolean
  sealingStatusOk: boolean
  sealingDisc: string
  sealingAct: string

  // Row 12: Metallodetektor (CCP-3)
  metalFe: boolean
  metalNonFe: boolean
  metalSs: boolean
  metalSignal: boolean
  metalOk: boolean
  metalDisc: string
  metalAct: string

  // Row 13: Ombordagi rejim
  fgStoreTemp: string
  fgStoreMorningTime: string
  fgStoreEveningTime: string
  fgStoreVacuum: boolean
  fgStoreOk: boolean
  fgStoreDisc: string
  fgStoreAct: string

  // Row 14: Gigiyena
  hygieneClean: boolean
  hygieneGear: boolean
  hygieneOk: boolean
  hygieneDisc: string
  hygieneAct: string

  // 3. Smena yakunini tasdiqlash (Section 3 - Sign-offs)
  inspectorName: string
  inspectorSign: string
  inspectorTime: string

  supervisorName: string
  supervisorSign: string
  supervisorTime: string

  qaEngineerName: string
  qaEngineerSign: string
  qaEngineerTime: string
}

const initialForm: ChecklistForm = {
  packLemon: true,
  packCucumber: true,
  packTomato: true,
  packIceberg: true,
  packOnion: true,
  packColeslaw: true,

  rawMaterialTemp1: '+2',
  rawMaterialTemp2: '+3',
  rawMaterialTemp3: '',
  rawMaterialOk: true,
  rawMaterialDisc: '',
  rawMaterialAct: '',

  cleaningPercent: '100',
  cleaningOk: true,
  cleaningDisc: '',
  cleaningAct: '',

  cuttingSize: '45',
  cuttingOk: true,
  cuttingDisc: '',
  cuttingAct: '',

  dezTemp1: '+2',
  dezTemp2: '+2',
  dezTemp3: '+2',
  dezTemp4: '+2',
  dezTemp5: '+2',
  dezTemp6: '+2',
  dezTempOk: true,
  dezTempDisc: '',
  dezTempAct: '',

  dezChlorine1: '300',
  dezChlorine2: '300',
  dezChlorine3: '300',
  dezChlorine4: '300',
  dezChlorine5: '300',
  dezChlorine6: '300',
  dezChlorineOk: true,
  dezChlorineDisc: '',
  dezChlorineAct: '',

  preservative: '1',
  preservativeOk: true,
  preservativeDisc: '',
  preservativeAct: '',

  residualChlorine: true,
  residualChlorineOk: true,
  residualChlorineDisc: '',
  residualChlorineAct: '',

  dryingDry: true,
  dryingOk: true,
  dryingDisc: '',
  dryingAct: '',

  inspectionClean: true,
  inspectionOk: true,
  inspectionDisc: '',
  inspectionAct: '',

  weightLemon: '2',
  weight1kg: '1000',
  weight500g: '500',
  weightOk: true,
  weightDisc: '',
  weightAct: '',

  sealingOk: true,
  sealingStatusOk: true,
  sealingDisc: '',
  sealingAct: '',

  metalFe: true,
  metalNonFe: true,
  metalSs: true,
  metalSignal: true,
  metalOk: true,
  metalDisc: '',
  metalAct: '',

  fgStoreTemp: '+3',
  fgStoreMorningTime: '08:00',
  fgStoreEveningTime: '18:00',
  fgStoreVacuum: true,
  fgStoreOk: true,
  fgStoreDisc: '',
  fgStoreAct: '',

  hygieneClean: true,
  hygieneGear: true,
  hygieneOk: true,
  hygieneDisc: '',
  hygieneAct: '',

  inspectorName: '',
  inspectorSign: '',
  inspectorTime: '',

  supervisorName: '',
  supervisorSign: '',
  supervisorTime: '',

  qaEngineerName: '',
  qaEngineerSign: '',
  qaEngineerTime: '',
}

export default function DailyChecklistContent() {
  const router = useRouter()
  const [view, setView] = useState<'form' | 'archive'>('form')
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Top Metadata
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [shift, setShift] = useState<'1' | '2'>('1')
  const [supervisor, setSupervisor] = useState('')
  const [inspector, setInspector] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [line, setLine] = useState('1-Линия')
  const [rejected, setRejected] = useState('')
  const [totalOutput, setTotalOutput] = useState('')

  // Form State
  const [form, setForm] = useState<ChecklistForm>(initialForm)

  // Dynamic Packaging Products State & Persistence
  const [packagingItems, setPackagingItems] = useState<PackagingProductItem[]>(defaultPackagingItems)

  // Load saved packaging products from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_qc_packaging_products')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure lemon has "Ҳар 5-пакет" as requested by user
          const updated = parsed.map((item: PackagingProductItem) => {
            if (item.id === 'lemon') {
              return { ...item, inspectionFrequency: 'Ҳар 5-пакет' }
            }
            return item
          })
          setPackagingItems(updated)
        }
      }
    } catch (err) {
      console.error('Failed to load saved products:', err)
    }
  }, [])

  const updatePackagingItemsAndSave = (items: PackagingProductItem[]) => {
    setPackagingItems(items)
    try {
      localStorage.setItem('gp_qc_packaging_products', JSON.stringify(items))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddProduct = () => {
    const newIndex = packagingItems.length + 1
    const newId = `custom_${Date.now()}`
    const newItem: PackagingProductItem = {
      id: newId,
      nameUz: '',
      nameSub: '',
      packWeight: '1 kg / 1 пакет',
      packWeightSub: '1 kg / 1 pack',
      packsPerBox: '6 та пакет',
      packsPerBoxSub: '6 packs',
      boxTotalWeight: '6 kg / 1 коробка',
      boxTotalWeightSub: '6 kg / 1 box',
      weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
      inspectionFrequency: 'Ҳар 5-пакет',
      statusOk: true,
      isCustom: true,
    }
    const next = [...packagingItems, newItem]
    updatePackagingItemsAndSave(next)
    toast.success(`${newIndex}-маҳсулот қатори қўшилди! Номи ва меъёрларини киритинг.`)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm("Ушбу маҳсулотни рўйхатдан ўчиришни тасдиқлайсизми?")) {
      const next = packagingItems.filter((item) => item.id !== id)
      updatePackagingItemsAndSave(next)
      toast.info("Маҳсулот рўйхатдан ўчирилди")
    }
  }

  const handleToggleProductStatus = (id: string) => {
    const next = packagingItems.map((item) => {
      if (item.id === id) {
        return { ...item, statusOk: !item.statusOk }
      }
      return item
    })
    updatePackagingItemsAndSave(next)
  }

  const handleProductFieldChange = (id: string, field: keyof PackagingProductItem, value: any) => {
    const next = packagingItems.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    })
    updatePackagingItemsAndSave(next)
  }

  const handleResetPackagingToDefault = () => {
    if (confirm("Барча қўшимча маҳсулотларни ўчириб, стандарт 6 талик рўйхатни тиклашни хоҳлайсизми?")) {
      updatePackagingItemsAndSave(defaultPackagingItems)
      toast.success("Стандарт 6 талик маҳсулотлар тикланди")
    }
  }

  const handleChange = (field: keyof ChecklistForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    if (confirm("Haqiqatan ham barcha maydonlarni tozalab, yangidan to'ldirmoqchimisiz?")) {
      setForm(initialForm)
      setRejected('')
      setTotalOutput('')
      setBatchNo('')
      toast.info('Forma tozalandi')
    }
  }

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/daily-checklist')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'archive') {
      fetchHistory()
    }
  }, [view, fetchHistory])

  // Load a record from archive into the form
  const loadFromArchive = (doc: any) => {
    try {
      setDate(doc.date || '')
      setShift((doc.shift === '2' ? '2' : '1') as '1' | '2')
      setSupervisor(doc.supervisor || '')
      setInspector(doc.inspector || '')
      setBatchNo(doc.batchNumber || '')
      setLine(doc.lineName || '1-Линия')
      setRejected(doc.rejectedKg ? String(doc.rejectedKg) : '')
      setTotalOutput(doc.totalOutputBox ? String(doc.totalOutputBox) : '')

      if (doc.formData) {
        const parsed = typeof doc.formData === 'string' ? JSON.parse(doc.formData) : doc.formData
        setForm((prev) => ({
          ...prev,
          ...parsed,
          inspectorName: parsed.inspectorName || doc.inspector || '',
          supervisorName: parsed.supervisorName || doc.supervisor || '',
        }))

        if (parsed.packagingItems && Array.isArray(parsed.packagingItems)) {
          setPackagingItems(parsed.packagingItems)
        } else {
          setPackagingItems(
            defaultPackagingItems.map((item) => {
              let statusOk = true
              if (item.id === 'lemon') statusOk = parsed.packLemon ?? true
              if (item.id === 'cucumber') statusOk = parsed.packCucumber ?? true
              if (item.id === 'tomato') statusOk = parsed.packTomato ?? true
              if (item.id === 'iceberg') statusOk = parsed.packIceberg ?? true
              if (item.id === 'onion') statusOk = parsed.packOnion ?? true
              if (item.id === 'coleslaw') statusOk = parsed.packColeslaw ?? true
              return { ...item, statusOk }
            })
          )
        }
      }
      setView('form')
      toast.success("Jurnal ko'rish uchun yuklandi!")
    } catch (err) {
      toast.error('Jurnalni yuklashda xatolik yuz berdi')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        date,
        shift,
        lineName: line,
        batchNumber: batchNo,
        rejectedKg: rejected,
        totalOutputBox: totalOutput,
        supervisor: form.supervisorName || supervisor,
        inspector: form.inspectorName || inspector,
        formData: {
          ...form,
          inspectorName: form.inspectorName || inspector,
          supervisorName: form.supervisorName || supervisor,
          packagingItems,
          packLemon: packagingItems.find((p) => p.id === 'lemon')?.statusOk ?? true,
          packCucumber: packagingItems.find((p) => p.id === 'cucumber')?.statusOk ?? true,
          packTomato: packagingItems.find((p) => p.id === 'tomato')?.statusOk ?? true,
          packIceberg: packagingItems.find((p) => p.id === 'iceberg')?.statusOk ?? true,
          packOnion: packagingItems.find((p) => p.id === 'onion')?.statusOk ?? true,
          packColeslaw: packagingItems.find((p) => p.id === 'coleslaw')?.statusOk ?? true,
        },
      }

      const res = await fetch('/api/daily-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Xatolik yuz berdi')
      }

      toast.success("Smena yakuni bo'yicha Yagona Check-list muvaffaqiyatli arxivga saqlandi!")
      setView('archive')
    } catch (e: any) {
      toast.error(e?.message || 'Saqlashda xatolik yuz berdi')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-enter pb-24">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-750 pb-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.push('/inspector')}
            className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors border border-slate-200 dark:border-dark-700 shadow-sm"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                FSSC 22000 v6 / ISO 22000
              </span>
              <span className="text-xs text-slate-400 font-semibold">• 3 Tilda</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              СНБ (ОТК) Назоратчисининг Кунлик Иш Чек-листи
            </h1>
          </div>
        </div>

        {/* View switcher tabs & Guide button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <BookOpen size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>📘 Qo'llanma</span>
          </button>

          <div className="flex flex-wrap bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 shadow-inner">
            <button
              onClick={() => setView('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                view === 'form'
                  ? 'bg-white dark:bg-dark-900 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={15} />
              <span>Чек-лист (Excel жадвал)</span>
            </button>
            <button
              onClick={() => setView('archive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                view === 'archive'
                  ? 'bg-white dark:bg-dark-900 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database size={15} />
              <span>Архив ({history.length})</span>
            </button>
          </div>

          {view === 'form' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Сақлаш (Архивга)</span>
            </button>
          )}
        </div>
      </div>

      {view === 'form' ? (
        <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
          {/* ========================================================================= */}
          {/* EXCEL TITLE BANNER */}
          {/* ========================================================================= */}
          <div className="bg-[#1F4E78] text-white py-4 px-6 text-center border-b-2 border-[#1B365D]">
            <h2 className="text-sm sm:text-base md:text-lg font-black tracking-wide uppercase leading-snug">
              СНБ (ОТК) НАЗОРАТЧИСИНИНГ КУНЛИК ИШ ЧЕК-ЛИСТИ / ЕЖЕДНЕВНЫЙ ЧЕК-ЛИСТ КОНТРОЛЕРА ОКК / DAILY QC CHECKLIST
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200 font-medium mt-1">
              (FSSC 22000 v6 / ISO 22000:2018 — Уч тилда: O&apos;zbekcha / Русский / English)
            </p>
          </div>

          {/* ========================================================================= */}
          {/* METADATA GRID (Rows 4-5 of Excel) */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-b border-slate-300 dark:border-dark-700 bg-slate-50/80 dark:bg-dark-850">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Row 1 / Col 1: Sana */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Сана / Дата / Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 1 / Col 2: Smena */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Смена / Shift
                </label>
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setShift('1')}
                    className={`py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                      shift === '1'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100'
                    }`}
                  >
                    1-Смена
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift('2')}
                    className={`py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                      shift === '2'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100'
                    }`}
                  >
                    2-Смена
                  </button>
                </div>
              </div>

              {/* Row 1 / Col 3: Nazoratchi */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Назоратчи / Контролер / Inspector
                </label>
                <input
                  type="text"
                  placeholder="Ф.И.Ш киритинг"
                  value={inspector}
                  onChange={(e) => {
                    setInspector(e.target.value)
                    handleChange('inspectorName', e.target.value)
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 1 / Col 4: Liniya */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Линия / Линия / Line
                </label>
                <input
                  type="text"
                  placeholder="Масалан: 1-Линия"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 1: Smena boshlig'i */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Смена бошлиғи / Мастер / Supervisor
                </label>
                <input
                  type="text"
                  placeholder="Мастер Ф.И.Ш"
                  value={supervisor}
                  onChange={(e) => {
                    setSupervisor(e.target.value)
                    handleChange('supervisorName', e.target.value)
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 2: Partiya raqami */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Партия № / Партия № / Batch №
                </label>
                <input
                  type="text"
                  placeholder="Партия рақами"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2 py-1.5 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 3: Brak */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Брак / Брак / Rejected: кг (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={rejected}
                    onChange={(e) => setRejected(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 pl-2.5 pr-8 py-1.5 rounded-lg text-xs font-black font-mono text-red-600 outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    кг
                  </span>
                </div>
              </div>

              {/* Row 2 / Col 4: Umumiy chiqish */}
              <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl p-2.5 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Умумий чиқиш / Выход / Total Output: коробка / box
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={totalOutput}
                    onChange={(e) => setTotalOutput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 pl-2.5 pr-10 py-1.5 rounded-lg text-xs font-black font-mono text-emerald-600 outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    кор
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: PACKAGING SPECIFICATIONS (Excel rows 7-14) */}
          {/* ========================================================================= */}
          <div className="border-b border-slate-300 dark:border-dark-700">
            <div className="bg-[#1F4E78] text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                  1. МАҲСУЛОТ ВА ҚАДОҚЛАШ СТАНДАРТЛАРИ / СТАНДАРТЫ УПАКОВКИ И КОРОБОК / PACKAGING SPECIFICATIONS
                </h3>
                <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded">
                  {packagingItems.length} та маҳсулот
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {packagingItems.length > 6 && (
                  <button
                    type="button"
                    onClick={handleResetPackagingToDefault}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
                    title="Стандарт 6 талик рўйхатни тиклаш"
                  >
                    Стандартга қайтиш
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>Янги маҳсулот қўшиш</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[980px] text-xs">
                <thead className="bg-[#2F5597] text-white text-[10px] font-bold uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F4E78] w-10 text-center">№</th>
                    <th className="p-2.5 border-r border-[#1F4E78] min-w-[180px]">
                      Маҳсулот номи
                      <div className="font-normal text-[9px] text-blue-200">Наименование / Product</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] w-40 text-center">
                      1 пакетдаги вазни / сони
                      <div className="font-normal text-[9px] text-blue-200">Weight / Qty per pack</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] w-36 text-center">
                      1 коробкадаги пакет сони
                      <div className="font-normal text-[9px] text-blue-200">Packs per box</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] w-44 text-center">
                      1 коробка умумий вазни
                      <div className="font-normal text-[9px] text-blue-200">Total box weight / qty</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78]">
                      Вазн ва меъёр талаби
                      <div className="font-normal text-[9px] text-blue-200">Weight norm &amp; tolerance</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] w-36 text-center">
                      Вақти ва Текширув
                      <div className="font-normal text-[9px] text-blue-200">Time &amp; Inspection</div>
                    </th>
                    <th className="p-2.5 text-center w-32 bg-[#1B365D]">
                      Мақоми / Status
                      <div className="font-normal text-[9px] text-blue-200">ОПРП / OPRP</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                  {packagingItems.map((item, index) => {
                    const isCustom = item.isCustom || index >= 6
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isCustom
                            ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 border-l-2 border-l-amber-500'
                            : 'hover:bg-blue-50/40 dark:hover:bg-dark-800/40'
                        }`}
                      >
                        {/* № */}
                        <td className="p-2.5 text-center font-black border-r border-slate-200 dark:border-dark-750 w-10 text-slate-700 dark:text-slate-300">
                          {index + 1}
                        </td>

                        {/* Mahsulot nomi */}
                        <td className="p-2.5 font-bold border-r border-slate-200 dark:border-dark-750 min-w-[180px]">
                          {isCustom ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder="Маҳсулот номи (Мас: Сабзи)"
                                value={item.nameUz}
                                onChange={(e) => handleProductFieldChange(item.id, 'nameUz', e.target.value)}
                                className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                              />
                              <input
                                type="text"
                                placeholder="Таржимаси (Морковь / Carrot)"
                                value={item.nameSub || ''}
                                onChange={(e) => handleProductFieldChange(item.id, 'nameSub', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded px-2 py-0.5 text-[10px] text-slate-500 outline-none"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold">{item.nameUz}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{item.nameSub}</div>
                            </div>
                          )}
                        </td>

                        {/* 1 paketdagi vazni / soni */}
                        <td className="p-2.5 text-center border-r border-slate-200 dark:border-dark-750 min-w-[140px]">
                          {isCustom ? (
                            <input
                              type="text"
                              placeholder="1 kg / 1 пакет"
                              value={item.packWeight}
                              onChange={(e) => handleProductFieldChange(item.id, 'packWeight', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{item.packWeight}</div>
                              <div className="text-[10px] text-slate-500">{item.packWeightSub}</div>
                            </div>
                          )}
                        </td>

                        {/* 1 qutidagi paket soni */}
                        <td className="p-2.5 text-center border-r border-slate-200 dark:border-dark-750 min-w-[130px]">
                          {isCustom ? (
                            <input
                              type="text"
                              placeholder="6 та пакет"
                              value={item.packsPerBox}
                              onChange={(e) => handleProductFieldChange(item.id, 'packsPerBox', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{item.packsPerBox}</div>
                              <div className="text-[10px] text-slate-500">{item.packsPerBoxSub}</div>
                            </div>
                          )}
                        </td>

                        {/* 1 quti umumiy vazni */}
                        <td className="p-2.5 text-center border-r border-slate-200 dark:border-dark-750 min-w-[140px]">
                          {isCustom ? (
                            <input
                              type="text"
                              placeholder="6 kg / 1 коробка"
                              value={item.boxTotalWeight}
                              onChange={(e) => handleProductFieldChange(item.id, 'boxTotalWeight', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{item.boxTotalWeight}</div>
                              <div className="text-[10px] text-slate-500">{item.boxTotalWeightSub}</div>
                            </div>
                          )}
                        </td>

                        {/* Vazn va me'yor talabi */}
                        <td className="p-2.5 border-r border-slate-200 dark:border-dark-750 min-w-[160px]">
                          {isCustom ? (
                            <input
                              type="text"
                              placeholder="990 g - 1010 g (1 kg ± 10g)"
                              value={item.weightTolerance}
                              onChange={(e) => handleProductFieldChange(item.id, 'weightTolerance', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.weightTolerance}
                            </span>
                          )}
                        </td>

                        {/* Vaqti va tekshiruv */}
                        <td className="p-2.5 text-center border-r border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 min-w-[130px]">
                          {isCustom ? (
                            <input
                              type="text"
                              placeholder="Ҳар 5-пакет"
                              value={item.inspectionFrequency}
                              onChange={(e) => handleProductFieldChange(item.id, 'inspectionFrequency', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-blue-600 dark:text-blue-400">{item.inspectionFrequency}</div>
                              <div className="text-[9px] text-slate-400">Каждый 5-пакет / Every 5th pack</div>
                            </div>
                          )}
                        </td>

                        {/* Maqomi / Status + Delete if custom */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(item.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                                item.statusOk
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {item.statusOk ? '✓ Мос (OK)' : '✗ Н/К'}
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                title="Маҳсулотни ўчириш"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Add Product Button */}
            <div className="p-3 bg-slate-50/60 dark:bg-dark-900/50 border-t border-slate-200 dark:border-dark-750 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/60 transition-all shadow-sm active:scale-95"
              >
                <Plus size={16} />
                <span>+ Янги маҳсулот қўшиш (Янги маҳсулот чиқса)</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium">
                Қўшилган янги маҳсулотлар ўзгартирилмагунча браузерда доимий сақланади
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PROCESS & SAFETY CHECKLIST (Excel rows 16-31, Image 3) */}
          {/* ========================================================================= */}
          <div className="border-b border-slate-300 dark:border-dark-700">
            <div className="bg-[#1F4E78] text-white px-4 py-2.5 flex flex-wrap gap-2 items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                2. ТЕХНОЛОГИК ЖАРАЁН ВА ХАВФСИЗЛИК ЧЕК-ЛИСТИ / ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС И БЕЗОПАСНОСТЬ / PROCESS &amp; SAFETY CHECKLIST
              </h3>
              <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded">14 та назорат босқичи</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1250px] text-xs">
                <thead className="bg-[#2F5597] text-white text-[10px] font-bold uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F4E78] w-32">
                      № / Босқич
                      <div className="font-normal text-[9px] text-blue-200">Этап / Process</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] min-w-[220px]">
                      Назорат нуқтаси ва Меъёр
                      <div className="font-normal text-[9px] text-blue-200">Точка контроля и Норма / Norm</div>
                    </th>
                    <th className="p-2.5 border-r border-[#1F4E78] w-28 text-center">
                      Вақти
                      <div className="font-normal text-[9px] text-blue-200">Время / Time</div>
                    </th>
                    <th className="p-3 border-r border-[#1F4E78] min-w-[380px] text-left">
                      Ҳақиқий кўрсаткич (Қийматлар)
                      <div className="font-normal text-[9px] text-blue-200">Факт. показатель / Actual Value</div>
                    </th>
                    <th className="p-3 border-r border-[#1F4E78] w-28 text-center">
                      Мослиги
                      <div className="font-normal text-[9px] text-blue-200">Соотв. / Status</div>
                    </th>
                    <th className="p-3 border-r border-[#1F4E78] min-w-[140px] text-left">
                      Аниқланган нуқсон
                      <div className="font-normal text-[9px] text-blue-200">Описание отклонения / Discrepancy</div>
                    </th>
                    <th className="p-3 border-r border-[#1F4E78] min-w-[140px] text-left">
                      Кўрилган чора ва Имзо
                      <div className="font-normal text-[9px] text-blue-200">Принятые меры / Corrective Action</div>
                    </th>
                    <th className="p-3 text-center w-28 bg-[#1B365D]">
                      Мақоми
                      <div className="font-normal text-[9px] text-blue-200">CCP / OPRP</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                  {/* Row 1: Xomashyo */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">1. Хомашё</div>
                      <div className="text-[10px] text-slate-500 font-normal">Сырье / Raw Material</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Сақлаш камераси / Storage</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                        Меъёр: +1°C … +5°C
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      08:00<br />14:00
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { time: '08:00', key: 'rawMaterialTemp1', placeholder: '+2' },
                          { time: '14:00', key: 'rawMaterialTemp2', placeholder: '+3' },
                          { time: '__:__', key: 'rawMaterialTemp3', placeholder: '+2' },
                        ].map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
                          >
                            <span className="text-[10px] font-bold text-slate-400 font-mono mr-1.5">{slot.time}</span>
                            <input
                              type="text"
                              placeholder={slot.placeholder}
                              value={(form as any)[slot.key]}
                              onChange={(e) => handleChange(slot.key as any, e.target.value)}
                              className="w-10 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400 ml-1">°C</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('rawMaterialOk', !form.rawMaterialOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.rawMaterialOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.rawMaterialOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.rawMaterialDisc}
                        onChange={(e) => handleChange('rawMaterialDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.rawMaterialAct}
                        onChange={(e) => handleChange('rawMaterialAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Tozalash */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">2. Тозалаш</div>
                      <div className="text-[10px] text-slate-500 font-normal">Очистка / Cleaning</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Ифлос зона / Dirty area</div>
                      <div className="text-[11px] text-slate-500">100% чириш ва ёт нарсаларсиз</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Узлуксиз
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Соғлом / Чисто:</span>
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <input
                            type="text"
                            value={form.cleaningPercent}
                            onChange={(e) => handleChange('cleaningPercent', e.target.value)}
                            placeholder="100"
                            className="w-14 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('cleaningOk', !form.cleaningOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.cleaningOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.cleaningOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.cleaningDisc}
                        onChange={(e) => handleChange('cleaningDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.cleaningAct}
                        onChange={(e) => handleChange('cleaningAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: To'g'rash kalibri */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">3. Тўғраш калибри</div>
                      <div className="text-[10px] text-slate-500 font-normal">Калибр нарезки / Slicer</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Сабзавот тўғрагич / Slicer</div>
                      <div className="text-[11px] text-slate-500">Спецификация бўйича</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Ҳар 1 соат
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Калибр / Ўлчам:</span>
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <input
                            type="text"
                            value={form.cuttingSize}
                            onChange={(e) => handleChange('cuttingSize', e.target.value)}
                            placeholder="45"
                            className="w-14 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">мм</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('cuttingOk', !form.cuttingOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.cuttingOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.cuttingOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.cuttingDisc}
                        onChange={(e) => handleChange('cuttingDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.cuttingAct}
                        onChange={(e) => handleChange('cuttingAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 4: Dezinfeksiya t° (CCP-2) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">4. Дезраствор t°</div>
                      <div className="text-[10px] text-slate-500 font-normal">Температура дез. / Temp</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Дезинфекция ваннаси / Bath</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-extrabold mt-0.5">
                        Норма: +1°C … +3°C (макс +3°C)
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      08:00 10:00<br />12:00 14:00<br />16:00 18:00
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: 'dezTemp1', time: '08:00', def: '+2' },
                          { key: 'dezTemp2', time: '10:00', def: '+2' },
                          { key: 'dezTemp3', time: '12:00', def: '+2' },
                          { key: 'dezTemp4', time: '14:00', def: '+2' },
                          { key: 'dezTemp5', time: '16:00', def: '+2' },
                          { key: 'dezTemp6', time: '18:00', def: '+2' },
                        ].map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/60 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all"
                          >
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">{t.time}</span>
                            <input
                              type="text"
                              value={(form as any)[t.key]}
                              onChange={(e) => handleChange(t.key as any, e.target.value)}
                              placeholder={t.def}
                              className="w-9 text-center font-black text-xs bg-transparent outline-none text-red-600 dark:text-red-400"
                            />
                            <span className="text-[9px] font-bold text-slate-400">°C</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('dezTempOk', !form.dezTempOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.dezTempOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.dezTempOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dezTempDisc}
                        onChange={(e) => handleChange('dezTempDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dezTempAct}
                        onChange={(e) => handleChange('dezTempAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center bg-[#FCE4D6] dark:bg-red-950/40">
                      <span className="text-[10px] font-black text-[#C00000] dark:text-red-400 block leading-tight">
                        ККТ-2 / CCP-2<br />(Температура)
                      </span>
                    </td>
                  </tr>

                  {/* Row 5: Faol xlor (CCP-1) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">5. Фаол хлор</div>
                      <div className="text-[10px] text-slate-500 font-normal">Активный хлор / Chlorine</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Дезинфекция ваннаси / Bath</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-extrabold mt-0.5">
                        Норма: Қатъий 300 мг/л (ppm)
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      08:00 10:00<br />12:00 14:00<br />16:00 18:00
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: 'dezChlorine1', time: '08:00', def: '300' },
                          { key: 'dezChlorine2', time: '10:00', def: '300' },
                          { key: 'dezChlorine3', time: '12:00', def: '300' },
                          { key: 'dezChlorine4', time: '14:00', def: '300' },
                          { key: 'dezChlorine5', time: '16:00', def: '300' },
                          { key: 'dezChlorine6', time: '18:00', def: '300' },
                        ].map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/60 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all"
                          >
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">{t.time}</span>
                            <input
                              type="text"
                              value={(form as any)[t.key]}
                              onChange={(e) => handleChange(t.key as any, e.target.value)}
                              placeholder={t.def}
                              className="w-10 text-center font-black text-xs bg-transparent outline-none text-red-600 dark:text-red-400"
                            />
                            <span className="text-[9px] font-bold text-slate-400">mg</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('dezChlorineOk', !form.dezChlorineOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.dezChlorineOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.dezChlorineOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dezChlorineDisc}
                        onChange={(e) => handleChange('dezChlorineDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dezChlorineAct}
                        onChange={(e) => handleChange('dezChlorineAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center bg-[#FCE4D6] dark:bg-red-950/40">
                      <span className="text-[10px] font-black text-[#C00000] dark:text-red-400 block leading-tight">
                        ККТ-1 / CCP-1<br />(Хлор / Chlorine)
                      </span>
                    </td>
                  </tr>

                  {/* Row 6: Konservant */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">6. Консервант</div>
                      <div className="text-[10px] text-slate-500 font-normal">Консервант / Preservative</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Салат майдончаси / Salad area</div>
                      <div className="text-[11px] text-slate-500">≤1г/кг (Карам 85%, Сабзи 15%)</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Ҳар эритмада
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Коул-Слоу Доза:</span>
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <input
                            type="text"
                            value={form.preservative}
                            onChange={(e) => handleChange('preservative', e.target.value)}
                            placeholder="1"
                            className="w-14 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">г/кг</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('preservativeOk', !form.preservativeOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.preservativeOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.preservativeOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.preservativeDisc}
                        onChange={(e) => handleChange('preservativeDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.preservativeAct}
                        onChange={(e) => handleChange('preservativeAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 7: Qoldiq xlor */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">7. Қолдиқ хлор</div>
                      <div className="text-[10px] text-slate-500 font-normal">Остаточный хлор / Residual</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Чиллер чиқиши / Chiller outlet</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Қолдиқ хлор = 0 мг/л</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[10px] font-mono text-slate-500">
                      09:00 13:00 17:00
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="inline-flex p-0.5 bg-slate-100 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-dark-700">
                        <button
                          type="button"
                          onClick={() => handleChange('residualChlorine', true)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            form.residualChlorine
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          ✓ 0 mg/l (OK)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('residualChlorine', false)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            !form.residualChlorine
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          ⚠ Хлор бор / Есть
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('residualChlorineOk', !form.residualChlorineOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.residualChlorineOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.residualChlorineOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.residualChlorineDisc}
                        onChange={(e) => handleChange('residualChlorineDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.residualChlorineAct}
                        onChange={(e) => handleChange('residualChlorineAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 8: Tsentrifuga */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">8. Центрифуга</div>
                      <div className="text-[10px] text-slate-500 font-normal">Сушка / Centrifuge</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Центрифуга / Dryer</div>
                      <div className="text-[11px] text-slate-500">30сек, 950об/мин, салфетка қуруқ</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Ҳар 1 соат
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="inline-flex p-0.5 bg-slate-100 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-dark-700">
                        <button
                          type="button"
                          onClick={() => handleChange('dryingDry', true)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            form.dryingDry
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          ✓ Салфетка: Қуруқ (OK)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('dryingDry', false)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            !form.dryingDry
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                          }`}
                        >
                          ⚠ Нам / Wet
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('dryingOk', !form.dryingOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.dryingOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.dryingOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dryingDisc}
                        onChange={(e) => handleChange('dryingDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.dryingAct}
                        onChange={(e) => handleChange('dryingAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 9: Vizual nazorat */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">9. Визуал назорат</div>
                      <div className="text-[10px] text-slate-500 font-normal">Инспекция / Inspection</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Инспекция столи / Table</div>
                      <div className="text-[11px] text-slate-500">Юпқа ёйилиш, 100% ёт нарсасиз</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Доимий
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="inline-flex p-0.5 bg-slate-100 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-dark-700">
                        <button
                          type="button"
                          onClick={() => handleChange('inspectionClean', true)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            form.inspectionClean
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          ✓ 100% Тоза / Clean
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('inspectionClean', false)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            !form.inspectionClean
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          ⚠ Ёт жисм / Нуқсон
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('inspectionOk', !form.inspectionOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.inspectionOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.inspectionOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.inspectionDisc}
                        onChange={(e) => handleChange('inspectionDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.inspectionAct}
                        onChange={(e) => handleChange('inspectionAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 10: Vazn nazorati */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">10. Вазн назорати</div>
                      <div className="text-[10px] text-slate-500 font-normal">Контроль веса / Weight</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Қадоқлаш / Packaging</div>
                      <div className="text-[11px] text-slate-500">Спецификация бўйича</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Ҳар 5-пакет
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Limon */}
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1.5 uppercase">Лимон:</span>
                          <input
                            type="text"
                            placeholder="2"
                            value={form.weightLemon}
                            onChange={(e) => handleChange('weightLemon', e.target.value)}
                            className="w-8 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-semibold text-slate-400 ml-1">дона</span>
                        </div>

                        {/* 1 kg */}
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1.5">1 kg:</span>
                          <input
                            type="text"
                            placeholder="1000"
                            value={form.weight1kg}
                            onChange={(e) => handleChange('weight1kg', e.target.value)}
                            className="w-12 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-semibold text-slate-400 ml-1">g</span>
                        </div>

                        {/* 0.5 kg */}
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1.5">0.5 kg:</span>
                          <input
                            type="text"
                            placeholder="500"
                            value={form.weight500g}
                            onChange={(e) => handleChange('weight500g', e.target.value)}
                            className="w-12 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-semibold text-slate-400 ml-1">g</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('weightOk', !form.weightOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.weightOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.weightOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.weightDisc}
                        onChange={(e) => handleChange('weightDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.weightAct}
                        onChange={(e) => handleChange('weightAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 11: Germetiklik */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">11. Герметиклик</div>
                      <div className="text-[10px] text-slate-500 font-normal">Герметичность / Sealing</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Қадоқлаш / Package Sealing</div>
                      <div className="text-[11px] text-slate-500">100% герметик, чок текис ва мустаҳкам</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Узлуксиз
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="inline-flex p-0.5 bg-slate-100 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-dark-700">
                        <button
                          type="button"
                          onClick={() => handleChange('sealingOk', true)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            form.sealingOk
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          ✓ Герметик / OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('sealingOk', false)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            !form.sealingOk
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          ⚠ Ҳаво бор / Утечка
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('sealingStatusOk', !form.sealingStatusOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.sealingStatusOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.sealingStatusOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.sealingDisc}
                        onChange={(e) => handleChange('sealingDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.sealingAct}
                        onChange={(e) => handleChange('sealingAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 12: Metallodetektor (CCP-3) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">12. Металлодетектор</div>
                      <div className="text-[10px] text-slate-500 font-normal">Metal Detector</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Рамка / Детектор металлов</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-extrabold mt-0.5">
                        Fe ≥2.0mm, Non-Fe ≥3.0mm, SS ≥3.0mm
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      08:00 10:00<br />12:00 14:00<br />16:00 18:00
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { key: 'metalFe', label: 'Fe (Темир)' },
                          { key: 'metalNonFe', label: 'Non-Fe' },
                          { key: 'metalSs', label: 'SS (Зангламас)' },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => handleChange(m.key as any, !(form as any)[m.key])}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              (form as any)[m.key]
                                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                : 'bg-white dark:bg-dark-900 text-slate-500 border-slate-300 dark:border-dark-700 hover:border-blue-300'
                            }`}
                          >
                            {(form as any)[m.key] ? '✓ ' : ''}{m.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleChange('metalSignal', !form.metalSignal)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            form.metalSignal
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-white dark:bg-dark-900 text-slate-400 border-slate-300 dark:border-dark-700'
                          }`}
                        >
                          {form.metalSignal ? '🔔 Сигнал Бор' : '🔕 Сигнал Йўқ'}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('metalOk', !form.metalOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.metalOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.metalOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.metalDisc}
                        onChange={(e) => handleChange('metalDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.metalAct}
                        onChange={(e) => handleChange('metalAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800 focus:border-red-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center bg-[#FCE4D6] dark:bg-red-950/40">
                      <span className="text-[10px] font-black text-[#C00000] dark:text-red-400 block leading-tight">
                        ККТ-3 / CCP-3<br />(Металл / Metal)
                      </span>
                    </td>
                  </tr>

                  {/* Row 13: Ombordagi rejim */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">13. Омбор режими</div>
                      <div className="text-[10px] text-slate-500 font-normal">Склад ГП / Warehouse</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">ТМО / Склад ГП</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                        +1°C … +5°C, вакуумли ва тоза
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[10px] text-slate-500 leading-tight">
                      Эрталаб / Кечқурун
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1.5">t°:</span>
                          <input
                            type="text"
                            placeholder="+3"
                            value={form.fgStoreTemp}
                            onChange={(e) => handleChange('fgStoreTemp', e.target.value)}
                            className="w-10 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400 ml-1">°C</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange('fgStoreVacuum', !form.fgStoreVacuum)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            form.fgStoreVacuum
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {form.fgStoreVacuum ? '✓ Вакуум: Зич / OK' : '⚠ Вакуум Бузилган'}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('fgStoreOk', !form.fgStoreOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.fgStoreOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.fgStoreOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.fgStoreDisc}
                        onChange={(e) => handleChange('fgStoreDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.fgStoreAct}
                        onChange={(e) => handleChange('fgStoreAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 14: Gigiyena */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">14. Гигиена</div>
                      <div className="text-[10px] text-slate-500 font-normal">Sanitation &amp; Hygiene</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Ускуна ва ходимлар</div>
                      <div className="text-[11px] text-slate-500">100% тозалик, спецодежда, ниқоб, қўлқоп</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Смена бошида
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleChange('hygieneClean', !form.hygieneClean)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            form.hygieneClean
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-white dark:bg-dark-900 text-slate-500 border-slate-300 dark:border-dark-700'
                          }`}
                        >
                          {form.hygieneClean ? '✓ 100% Тозалик OK' : '✗ Тозалик Камчилик'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('hygieneGear', !form.hygieneGear)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            form.hygieneGear
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-white dark:bg-dark-900 text-slate-500 border-slate-300 dark:border-dark-700'
                          }`}
                        >
                          {form.hygieneGear ? '✓ Спецодежда / Ниқоб OK' : '✗ Спецодежда Йўқ'}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750">
                      <button
                        type="button"
                        onClick={() => handleChange('hygieneOk', !form.hygieneOk)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                          form.hygieneOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {form.hygieneOk ? '✓ Мос (OK)' : '✗ Н/К'}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.hygieneDisc}
                        onChange={(e) => handleChange('hygieneDisc', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-dark-750">
                      <input
                        type="text"
                        placeholder="—"
                        value={form.hygieneAct}
                        onChange={(e) => handleChange('hygieneAct', e.target.value)}
                        className="w-full min-w-[110px] bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus:border-blue-500 px-2 py-1.5 rounded text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ОПРП / OPRP
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: SHIFT SIGN-OFF (Excel rows 33-35, Image 4) */}
          {/* ========================================================================= */}
          <div className="bg-[#1F4E78] text-white px-4 py-2.5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">
              СМЕНА ЯКУНИ БЎЙИЧА ТАСДИҚЛАШ / ПОДТВЕРЖДЕНИЕ СМЕНЫ / SHIFT SIGN-OFF
            </h3>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50/60 dark:bg-dark-850">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Block 1: QC Inspector */}
              <div className="bg-white dark:bg-dark-900 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900/30">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                      СНБ (ОТК) Назоратчиси
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Контролер ОКК / QC Inspector</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Ф.И.Ш / ФИО
                    </label>
                    <input
                      type="text"
                      placeholder="Назоратчи Ф.И.Ш"
                      value={form.inspectorName || inspector}
                      onChange={(e) => {
                        handleChange('inspectorName', e.target.value)
                        setInspector(e.target.value)
                      }}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Имзо / Подпись
                    </label>
                    <input
                      type="text"
                      placeholder="Электрон имзо / Тасдиқ"
                      value={form.inspectorSign}
                      onChange={(e) => handleChange('inspectorSign', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Вақт / Время
                    </label>
                    <input
                      type="time"
                      value={form.inspectorTime}
                      onChange={(e) => handleChange('inspectorTime', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Block 2: Shift Supervisor */}
              <div className="bg-white dark:bg-dark-900 border-2 border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-100 dark:border-amber-900/30">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                      Смена бошлиғи
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Мастер смены / Shift Supervisor</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Ф.И.Ш / ФИО
                    </label>
                    <input
                      type="text"
                      placeholder="Мастер Ф.И.Ш"
                      value={form.supervisorName || supervisor}
                      onChange={(e) => {
                        handleChange('supervisorName', e.target.value)
                        setSupervisor(e.target.value)
                      }}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Имзо / Подпись
                    </label>
                    <input
                      type="text"
                      placeholder="Электрон имзо / Тасдиқ"
                      value={form.supervisorSign}
                      onChange={(e) => handleChange('supervisorSign', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Вақт / Время
                    </label>
                    <input
                      type="time"
                      value={form.supervisorTime}
                      onChange={(e) => handleChange('supervisorTime', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Block 3: QA Engineer */}
              <div className="bg-white dark:bg-dark-900 border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                      Сифат мутахассиси
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Инженер по качеству / QA Engineer</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Ф.И.Ш / ФИО
                    </label>
                    <input
                      type="text"
                      placeholder="Сифат мутахассиси Ф.И.Ш"
                      value={form.qaEngineerName}
                      onChange={(e) => handleChange('qaEngineerName', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Имзо / Подпись
                    </label>
                    <input
                      type="text"
                      placeholder="Электрон имзо / Тасдиқ"
                      value={form.qaEngineerSign}
                      onChange={(e) => handleChange('qaEngineerSign', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Вақт / Время
                    </label>
                    <input
                      type="time"
                      value={form.qaEngineerTime}
                      onChange={(e) => handleChange('qaEngineerTime', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM ACTIONS BAR */}
          {/* ========================================================================= */}
          <div className="p-4 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-700 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Янгидан тўлдириш</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <Printer size={14} />
                <span>Чоп этиш</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-7 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Сақлаш ва Архивга топшириш</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* ARCHIVE VIEW */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Архив: Сақланган Кунлик Чек-листлар
              </h2>
              <p className="text-xs text-slate-500">Барча смена якуни бўйича тўлдирилган расмий журналлар</p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
            >
              {loadingHistory ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              <span>Янгилаш</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Архив юкланмоқда...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Database size={48} className="text-slate-300 dark:text-dark-700 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Архив бўш</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Ҳозирча сақланган кунлик чек-листлар йўқ. &quot;Чек-лист&quot; бўлимидан янги сменани тўлдириб сақланг.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700">
                    <tr>
                      <th className="px-5 py-3.5">Сана / Смена</th>
                      <th className="px-5 py-3.5">Линия / Партия №</th>
                      <th className="px-5 py-3.5">Умумий чиқиш</th>
                      <th className="px-5 py-3.5">Брак (кг)</th>
                      <th className="px-5 py-3.5">Масъуллар</th>
                      <th className="px-5 py-3.5 text-center">Ҳолат</th>
                      <th className="px-5 py-3.5 text-right">Ҳаракат</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                    {history.map((doc: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-blue-500" />
                            <span className="font-bold text-slate-900 dark:text-white">{doc.date}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {doc.shift}-Смена
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.lineName || '1-Линия'}</div>
                          <div className="text-[11px] font-mono text-slate-400">Партия: {doc.batchNumber || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {doc.totalOutputBox ? `${doc.totalOutputBox} кор` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-red-500 font-bold font-mono">
                          {doc.rejectedKg ? `${doc.rejectedKg} кг` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          <div className="text-[11px]">
                            Уста: <span className="font-bold text-slate-800 dark:text-slate-200">{doc.supervisor || '—'}</span>
                          </div>
                          <div className="text-[11px]">
                            ОТК: <span className="font-bold text-slate-800 dark:text-slate-200">{doc.inspector || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                            <CheckCircle2 size={11} />
                            <span>Тасдиқланган</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => loadFromArchive(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Чек-листни очиш"
                            >
                              <Eye size={13} />
                              <span>Кўриш</span>
                            </button>
                            <button
                              onClick={() => window.open(`/api/daily-checklist/${doc.id}/export`, '_blank')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Excel юклаб олиш"
                            >
                              <FileSpreadsheet size={13} />
                              <span>Excel</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* QC Inspector Guide Modal */}
      <QCInspectorGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  )
}

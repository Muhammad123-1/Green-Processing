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
  Layers,
  Package,
  Sliders,
  CheckSquare,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import QCInspectorGuideModal from '@/components/inspector/QCInspectorGuideModal'
import { useLanguage } from '@/components/providers/LanguageProvider'

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
    nameUz: 'Limon',
    nameSub: 'Limon / Lemon',
    packWeight: '1 paketda 2 dona',
    packWeightSub: '2 pcs per pack',
    packsPerBox: '12 ta paket',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '12 paket (24 dona / quti)',
    boxTotalWeightSub: '24 pcs / box',
    weightTolerance: "2 dona / paket (100% sog'lom)",
    inspectionFrequency: 'Har 5-paket',
    statusOk: true,
  },
  {
    id: 'cucumber',
    nameUz: 'Bodring',
    nameSub: 'Bodring / Cucumber',
    packWeight: '1 kg / 1 paket',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 ta paket',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 quti',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Har 5-paket',
    statusOk: true,
  },
  {
    id: 'tomato',
    nameUz: 'Tomat',
    nameSub: 'Pomidor / Tomato',
    packWeight: '1 kg / 1 paket',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 ta paket',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 quti',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Har 5-paket',
    statusOk: true,
  },
  {
    id: 'iceberg',
    nameUz: 'Aysberg',
    nameSub: 'Aysberg / Iceberg',
    packWeight: '1 kg / 1 paket',
    packWeightSub: '1 kg / 1 pack',
    packsPerBox: '6 ta paket',
    packsPerBoxSub: '6 packs',
    boxTotalWeight: '6 kg / 1 quti',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
    inspectionFrequency: 'Har 5-paket',
    statusOk: true,
  },
  {
    id: 'onion',
    nameUz: 'Piyoz',
    nameSub: 'Piyoz / Onion',
    packWeight: '0.5 kg / 1 paket',
    packWeightSub: '0.5 kg / 1 pack',
    packsPerBox: '12 ta paket',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '6 kg / 1 quti',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '492.5 g - 507.5 g (0.5 kg ± 7.5g)',
    inspectionFrequency: 'Har 5-paket',
    statusOk: true,
  },
  {
    id: 'coleslaw',
    nameUz: 'Koul Slou',
    nameSub: 'Koul Slou / Cole Slaw',
    packWeight: '0.5 kg / 1 paket',
    packWeightSub: '0.5 kg / 1 pack',
    packsPerBox: '12 ta paket',
    packsPerBoxSub: '12 packs',
    boxTotalWeight: '6 kg / 1 quti',
    boxTotalWeightSub: '6 kg / 1 box',
    weightTolerance: '492.5 g - 507.5 g (0.5 kg ± 7.5g)',
    inspectionFrequency: 'Har 5-paket',
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
  const { lang: currentLang } = useLanguage()
  const lang = (currentLang === 'ru' ? 'ru' : currentLang === 'en' ? 'en' : 'uz') as 'uz' | 'ru' | 'en'

  const [view, setView] = useState<'form' | 'archive'>('form')
  const [activeSection, setActiveSection] = useState<'all' | 'packaging' | 'process' | 'signoff'>('all')
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Translations
  const t = {
    uz: {
      title: "Sifat Nazoratchisi Kunlik Ish Chek-listi",
      subTitle: "FSSC 22000 v6 / ISO 22000:2018 standartlari asosida sifat va xavfsizlik monitoringi",
      btnGuide: "Qo'llanma",
      tabChecklist: "Chek-list jurnali",
      tabArchive: "Arxiv",
      btnSave: "Saqlash (Arxivga)",
      metaDate: "Sana",
      metaShift: "Smena",
      shift1: "1-Smena",
      shift2: "2-Smena",
      metaInspector: "Sifat Nazoratchisi",
      metaInspectorPh: "F.I.Sh kiriting",
      metaLine: "Liniya",
      metaLinePh: "Masalan: 1-Liniya",
      metaSupervisor: "Smena Boshlig'i (Master)",
      metaSupervisorPh: "Master F.I.Sh",
      metaBatch: "Partiya №",
      metaBatchPh: "Partiya raqami",
      metaRejected: "Jami Brak (kg)",
      metaOutput: "Tayyor Mahsulot (quti)",
      secAll: "Barchasi",
      secPackaging: "1. Qadoqlash Standartlari",
      secProcess: "2. Texnologik Nazorat & CCP",
      secSignoff: "3. Smena Yakuni & Imzolar",
      secPackagingDesc: "Mahsulotlar vazni, quti sig'imi va og'ish me'yorlari",
      secProcessDesc: "14 ta kritik texnologik va sanitariya nazorat bosqichlari",
      secSignoffDesc: "Mas'ullar tomonidan smenani tasdiqlash va imzolash",
      btnResetDefault: "Standartga qaytish",
      btnAddProduct: "Yangi mahsulot qo'shish",
      thNo: "№",
      thProduct: "Mahsulot nomi",
      thPackWeight: "1 paketdagi vazni / soni",
      thPacksBox: "1 qutidagi paket",
      thBoxWeight: "1 quti umumiy vazni",
      thWeightNorm: "Vazn me'yori & Chekinish",
      thInspectionTime: "Vaqti & Nazorat",
      thStatus: "Holati",
      thStage: "№ / Bosqich",
      thControlPoint: "Nazorat nuqtasi va Me'yor",
      thTime: "Vaqti",
      thActualValue: "Haqiqiy ko'rsatkich (Fakt)",
      thMatch: "Mosligi",
      thDiscrepancy: "Aniqlangan nuqson",
      thAction: "Ko'rilgan chora & Imzo",
      thCategory: "Toifasi",
      statusOk: "✓ Me'yorda (OK)",
      statusFail: "✗ Nuqson",
      inspectorCard: "Sifat Nazoratchisi",
      supervisorCard: "Smena Boshlig'i",
      qaCard: "Bosh Texnolog / Sifat Muhandisi",
      signFullName: "F.I.Sh",
      signSignature: "Elektron imzo / Tasdiq",
      signTime: "Vaqt",
    },
    ru: {
      title: "Ежедневный чек-лист контролера ОКК",
      subTitle: "Мониторинг качества и безопасности по стандартам FSSC 22000 v6 / ISO 22000:2018",
      btnGuide: "Руководство",
      tabChecklist: "Чек-лист журнал",
      tabArchive: "Архив",
      btnSave: "Сохранить (В архив)",
      metaDate: "Дата",
      metaShift: "Смена",
      shift1: "1-Смена",
      shift2: "2-Смена",
      metaInspector: "Контролер ОКК",
      metaInspectorPh: "Введите Ф.И.О",
      metaLine: "Линия",
      metaLinePh: "Например: 1-Линия",
      metaSupervisor: "Мастер смены",
      metaSupervisorPh: "Ф.И.О мастера",
      metaBatch: "Партия №",
      metaBatchPh: "Номер партии",
      metaRejected: "Всего Брак (кг)",
      metaOutput: "Готовая продукция (кор.)",
      secAll: "Все разделы",
      secPackaging: "1. Стандарты упаковки",
      secProcess: "2. Технологический процесс & ККТ",
      secSignoff: "3. Подтверждение смены",
      secPackagingDesc: "Вес упаковки, вместимость коробок и допуски",
      secProcessDesc: "14 этапов контроля параметров безопасности и ККТ",
      secSignoffDesc: "Подтверждение и подписи ответственных лиц",
      btnResetDefault: "Сбросить к стандарту",
      btnAddProduct: "Добавить продукт",
      thNo: "№",
      thProduct: "Наименование продукта",
      thPackWeight: "Вес / Кол-во в пакете",
      thPacksBox: "Пакетов в коробке",
      thBoxWeight: "Общий вес коробки",
      thWeightNorm: "Требования к весу & Допуск",
      thInspectionTime: "Время & Контроль",
      thStatus: "Статус",
      thStage: "№ / Этап",
      thControlPoint: "Точка контроля и Норма",
      thTime: "Время",
      thActualValue: "Фактический показатель",
      thMatch: "Соответствие",
      thDiscrepancy: "Описание отклонения",
      thAction: "Принятые меры & Подпись",
      thCategory: "Категория",
      statusOk: "✓ В норме (OK)",
      statusFail: "✗ Отклонение",
      inspectorCard: "Контролер ОКК",
      supervisorCard: "Мастер смены",
      qaCard: "Главный технолог / Инженер по качеству",
      signFullName: "Ф.И.О",
      signSignature: "Электронная подпись",
      signTime: "Время",
    },
    en: {
      title: "Daily QC Inspector Checklist",
      subTitle: "Quality and food safety monitoring according to FSSC 22000 v6 / ISO 22000:2018",
      btnGuide: "Guide",
      tabChecklist: "Checklist Log",
      tabArchive: "Archive",
      btnSave: "Save (To Archive)",
      metaDate: "Date",
      metaShift: "Shift",
      shift1: "1st Shift",
      shift2: "2nd Shift",
      metaInspector: "QC Inspector",
      metaInspectorPh: "Enter full name",
      metaLine: "Line",
      metaLinePh: "e.g. Packaging Line 1",
      metaSupervisor: "Shift Supervisor",
      metaSupervisorPh: "Supervisor name",
      metaBatch: "Batch №",
      metaBatchPh: "Batch number",
      metaRejected: "Total Rejected (kg)",
      metaOutput: "Total Output (boxes)",
      secAll: "All Sections",
      secPackaging: "1. Packaging Specifications",
      secProcess: "2. Process & CCP Monitoring",
      secSignoff: "3. Shift Sign-Off",
      secPackagingDesc: "Package weights, box counts, and tolerances",
      secProcessDesc: "14 critical process, sanitation and CCP stages",
      secSignoffDesc: "Shift confirmation and sign-offs by responsible leads",
      btnResetDefault: "Reset to default",
      btnAddProduct: "Add Product",
      thNo: "№",
      thProduct: "Product Name",
      thPackWeight: "Pack Weight / Count",
      thPacksBox: "Packs per Box",
      thBoxWeight: "Box Total Weight",
      thWeightNorm: "Weight Norm & Tolerance",
      thInspectionTime: "Time & Frequency",
      thStatus: "Status",
      thStage: "№ / Stage",
      thControlPoint: "Control Point & Standard",
      thTime: "Time",
      thActualValue: "Actual Metric",
      thMatch: "Compliance",
      thDiscrepancy: "Discrepancy Description",
      thAction: "Corrective Action & Sign",
      thCategory: "Category",
      statusOk: "✓ Pass (OK)",
      statusFail: "✗ Non-Conforming",
      inspectorCard: "QC Inspector",
      supervisorCard: "Shift Supervisor",
      qaCard: "Quality Assurance Engineer",
      signFullName: "Full Name",
      signSignature: "E-Signature / Approval",
      signTime: "Time",
    }
  }[lang as 'uz' | 'ru' | 'en'] || {
    title: "Sifat Nazoratchisi Kunlik Ish Chek-listi",
    subTitle: "FSSC 22000 v6 / ISO 22000:2018 standartlari asosida sifat va xavfsizlik monitoringi",
    btnGuide: "Qo'llanma",
    tabChecklist: "Chek-list jurnali",
    tabArchive: "Arxiv",
    btnSave: "Saqlash (Arxivga)",
    metaDate: "Sana",
    metaShift: "Smena",
    shift1: "1-Smena",
    shift2: "2-Smena",
    metaInspector: "Sifat Nazoratchisi",
    metaInspectorPh: "F.I.Sh kiriting",
    metaLine: "Liniya",
    metaLinePh: "Masalan: 1-Liniya",
    metaSupervisor: "Smena Boshlig'i (Master)",
    metaSupervisorPh: "Master F.I.Sh",
    metaBatch: "Partiya №",
    metaBatchPh: "Partiya raqami",
    metaRejected: "Jami Brak (kg)",
    metaOutput: "Tayyor Mahsulot (quti)",
    secAll: "Barchasi",
    secPackaging: "1. Qadoqlash Standartlari",
    secProcess: "2. Texnologik Nazorat & CCP",
    secSignoff: "3. Smena Yakuni & Imzolar",
    secPackagingDesc: "Mahsulotlar vazni, quti sig'imi va og'ish me'yorlari",
    secProcessDesc: "14 ta kritik texnologik va sanitariya nazorat bosqichlari",
    secSignoffDesc: "Mas'ullar tomonidan smenani tasdiqlash va imzolash",
    btnResetDefault: "Standartga qaytish",
    btnAddProduct: "Yangi mahsulot qo'shish",
    thNo: "№",
    thProduct: "Mahsulot nomi",
    thPackWeight: "1 paketdagi vazni / soni",
    thPacksBox: "1 qutidagi paket",
    thBoxWeight: "1 quti umumiy vazni",
    thWeightNorm: "Vazn me'yori & Chekinish",
    thInspectionTime: "Vaqti & Nazorat",
    thStatus: "Holati",
    thStage: "№ / Bosqich",
    thControlPoint: "Nazorat nuqtasi va Me'yor",
    thTime: "Vaqti",
    thActualValue: "Haqiqiy ko'rsatkich (Fakt)",
    thMatch: "Mosligi",
    thDiscrepancy: "Aniqlangan nuqson",
    thAction: "Ko'rilgan chora & Imzo",
    thCategory: "Toifasi",
    statusOk: "✓ Me'yorda (OK)",
    statusFail: "✗ Nuqson",
    inspectorCard: "Sifat Nazoratchisi",
    supervisorCard: "Smena Boshlig'i",
    qaCard: "Bosh Texnolog / Sifat Muhandisi",
    signFullName: "F.I.Sh",
    signSignature: "Elektron imzo / Tasdiq",
    signTime: "Vaqt",
  }

  // Top Metadata
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [shift, setShift] = useState<'1' | '2'>('1')
  const [supervisor, setSupervisor] = useState('')
  const [inspector, setInspector] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [line, setLine] = useState('1-Liniya')
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
          // Ensure lemon has "Har 5-paket" as requested by user
          const updated = parsed.map((item: PackagingProductItem) => {
            if (item.id === 'lemon') {
              return { ...item, inspectionFrequency: 'Har 5-paket' }
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
      packWeight: '1 kg / 1 paket',
      packWeightSub: '1 kg / 1 pack',
      packsPerBox: '6 ta paket',
      packsPerBoxSub: '6 packs',
      boxTotalWeight: '6 kg / 1 quti',
      boxTotalWeightSub: '6 kg / 1 box',
      weightTolerance: '990 g - 1010 g (1 kg ± 10g)',
      inspectionFrequency: 'Har 5-paket',
      statusOk: true,
      isCustom: true,
    }
    const next = [...packagingItems, newItem]
    updatePackagingItemsAndSave(next)
    toast.success(lang === 'ru' ? `${newIndex}-й продукт добавлен!` : `${newIndex}-mahsulot qatori qo'shildi! Nomi va me'yorlarini kiriting.`)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm(lang === 'ru' ? "Удалить этот продукт из списка?" : "Ushbu mahsulotni ro'yxatdan o'chirishni tasdiqlaysizmi?")) {
      const next = packagingItems.filter((item) => item.id !== id)
      updatePackagingItemsAndSave(next)
      toast.info(lang === 'ru' ? "Продукт удален" : "Mahsulot ro'yxatdan o'chirildi")
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
    if (confirm("Barcha qo'shimcha mahsulotlarni o'chirib, standart 6 talik ro'yxatni tiklashni xohlaysizmi?")) {
      updatePackagingItemsAndSave(defaultPackagingItems)
      toast.success("Standart 6 talik mahsulotlar tiklandi")
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
      setLine(doc.lineName || '1-Liniya')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.push('/inspector')}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors border border-slate-200 dark:border-dark-700 shadow-sm shrink-0"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                FSSC 22000 v6 / ISO 22000
              </span>
              <span className="text-xs text-slate-400 font-semibold">• QC Daily Checklist</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t.subTitle}
            </p>
          </div>
        </div>

        {/* View switcher tabs & Guide button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <BookOpen size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>📘 {t.btnGuide}</span>
          </button>

          <div className="flex flex-wrap bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 shadow-inner">
            <button
              onClick={() => setView('form')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                view === 'form'
                  ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={15} />
              <span>{t.tabChecklist}</span>
            </button>
            <button
              onClick={() => setView('archive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                view === 'archive'
                  ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database size={15} />
              <span>{t.tabArchive} ({history.length})</span>
            </button>
          </div>

          {view === 'form' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{t.btnSave}</span>
            </button>
          )}
        </div>
      </div>

      {view === 'form' ? (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
          {/* METADATA GRID */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-850">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Row 1 / Col 1: Sana */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaDate}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 1 / Col 2: Smena */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaShift}
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
                    {t.shift1}
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
                    {t.shift2}
                  </button>
                </div>
              </div>

              {/* Row 1 / Col 3: Nazoratchi */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaInspector}
                </label>
                <input
                  type="text"
                  placeholder={t.metaInspectorPh}
                  value={inspector}
                  onChange={(e) => {
                    setInspector(e.target.value)
                    handleChange('inspectorName', e.target.value)
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 1 / Col 4: Liniya */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaLine}
                </label>
                <input
                  type="text"
                  placeholder={t.metaLinePh}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 1: Smena boshlig'i */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaSupervisor}
                </label>
                <input
                  type="text"
                  placeholder={t.metaSupervisorPh}
                  value={supervisor}
                  onChange={(e) => {
                    setSupervisor(e.target.value)
                    handleChange('supervisorName', e.target.value)
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 2: Partiya raqami */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {t.metaBatch}
                </label>
                <input
                  type="text"
                  placeholder={t.metaBatchPh}
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 2 / Col 3: Brak */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block mb-1">
                  {t.metaRejected}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={rejected}
                    onChange={(e) => setRejected(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 pl-2.5 pr-8 py-1.5 rounded-lg text-xs font-black font-mono text-rose-600 outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              {/* Row 2 / Col 4: Umumiy chiqish */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3 shadow-sm">
                <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                  {t.metaOutput}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={totalOutput}
                    onChange={(e) => setTotalOutput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 pl-2.5 pr-10 py-1.5 rounded-lg text-xs font-black font-mono text-emerald-600 outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    quti
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION SWITCHER PILLS */}
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-dark-750 bg-slate-100/60 dark:bg-dark-800/60 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: t.secAll, icon: Layers, count: packagingItems.length + 14 },
              { id: 'packaging', label: t.secPackaging, icon: Package, count: packagingItems.length },
              { id: 'process', label: t.secProcess, icon: Sliders, count: 14 },
              { id: 'signoff', label: t.secSignoff, icon: CheckSquare, count: 3 },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeSection === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-dark-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* SECTION 1: PACKAGING SPECIFICATIONS */}
          {(activeSection === 'all' || activeSection === 'packaging') && (
          <div className="border-b border-slate-200 dark:border-dark-750">
            <div className="bg-slate-50 dark:bg-dark-850 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    {t.secPackaging}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {t.secPackagingDesc} • {packagingItems.length} ta mahsulot
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {packagingItems.length > 6 && (
                  <button
                    type="button"
                    onClick={handleResetPackagingToDefault}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 text-slate-700 dark:text-slate-200 transition-all border border-slate-300 dark:border-dark-600"
                    title={t.btnResetDefault}
                  >
                    {t.btnResetDefault}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>{t.btnAddProduct}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[980px] text-xs">
                <thead className="bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-dark-750">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-10 text-center">{t.thNo}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 min-w-[180px]">{t.thProduct}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-40 text-center">{t.thPackWeight}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-36 text-center">{t.thPacksBox}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-44 text-center">{t.thBoxWeight}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750">{t.thWeightNorm}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-36 text-center">{t.thInspectionTime}</th>
                    <th className="p-2.5 text-center w-32 bg-slate-200/60 dark:bg-dark-750">{t.thStatus}</th>
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
                                placeholder="Mahsulot nomi (Mas: Sabzi)"
                                value={item.nameUz}
                                onChange={(e) => handleProductFieldChange(item.id, 'nameUz', e.target.value)}
                                className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                              />
                              <input
                                type="text"
                                placeholder="Tarjimasi (Sabzi / Carrot)"
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
                              placeholder="1 kg / 1 paket"
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
                              placeholder="6 ta paket"
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
                              placeholder="6 kg / 1 quti"
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
                              placeholder="Har 5-paket"
                              value={item.inspectionFrequency}
                              onChange={(e) => handleProductFieldChange(item.id, 'inspectionFrequency', e.target.value)}
                              className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-blue-600 dark:text-blue-400">{item.inspectionFrequency}</div>
                              <div className="text-[9px] text-slate-400">Har 5-paket / Every 5th pack</div>
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
                              {item.statusOk ? (lang === 'ru' ? '✓ В норме (OK)' : '✓ Mos (OK)') : (lang === 'ru' ? '✗ Откл.' : '✗ Mos emas')}
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                title={lang === 'ru' ? 'Удалить продукт' : "Mahsulotni o'chirish"}
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
                <span>+ {t.btnAddProduct}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium">
                {lang === 'ru' ? 'Добавленные продукты сохраняются в браузере' : "Qo'shilgan mahsulotlar brauzerda doimiy saqlanadi"}
              </span>
            </div>
          </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: PROCESS & SAFETY CHECKLIST */}
          {/* ========================================================================= */}
          {(activeSection === 'all' || activeSection === 'process') && (
          <div className="border-b border-slate-200 dark:border-dark-750">
            <div className="bg-slate-50 dark:bg-dark-850 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    {t.secProcess}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {t.secProcessDesc}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                14 ta nazorat bosqichi
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1250px] text-xs">
                <thead className="bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-dark-750">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-32">{t.thStage}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 min-w-[220px]">{t.thControlPoint}</th>
                    <th className="p-2.5 border-r border-slate-200 dark:border-dark-750 w-28 text-center">{t.thTime}</th>
                    <th className="p-3 border-r border-slate-200 dark:border-dark-750 min-w-[380px] text-left">{t.thActualValue}</th>
                    <th className="p-3 border-r border-slate-200 dark:border-dark-750 w-28 text-center">{t.thMatch}</th>
                    <th className="p-3 border-r border-slate-200 dark:border-dark-750 min-w-[140px] text-left">{t.thDiscrepancy}</th>
                    <th className="p-3 border-r border-slate-200 dark:border-dark-750 min-w-[140px] text-left">{t.thAction}</th>
                    <th className="p-3 text-center w-28 bg-slate-200/60 dark:bg-dark-750">{t.thCategory}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-dark-750">
                  {/* Row 1: Xomashyo */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">1. Xomashyo</div>
                      <div className="text-[10px] text-slate-500 font-normal">Xomashyo / Raw Material</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Saqlash kamerasi / Storage</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                        Me'yor: +1°C … +5°C
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
                        {form.rawMaterialOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Tozalash */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">2. Tozalash</div>
                      <div className="text-[10px] text-slate-500 font-normal">Tozalash / Cleaning</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Iflos zona / Dirty area</div>
                      <div className="text-[11px] text-slate-500">100% chirish va yot narsalarsiz</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Uzluksiz
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sog'lom / Sof:</span>
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
                        {form.cleaningOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: To'g'rash kalibri */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">3. To'g'rash kalibri</div>
                      <div className="text-[10px] text-slate-500 font-normal">To'g'rash kalibri / Slicer</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Sabzavot to'g'ragich / Slicer</div>
                      <div className="text-[11px] text-slate-500">Spetsifikatsiya bo'yicha</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Har 1 soat
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kalibr / O'lcham:</span>
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <input
                            type="text"
                            value={form.cuttingSize}
                            onChange={(e) => handleChange('cuttingSize', e.target.value)}
                            placeholder="45"
                            className="w-14 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">mm</span>
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
                        {form.cuttingOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 4: Dezinfeksiya t° (CCP-2) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">4. Dezinfeksiya eritmasi t°</div>
                      <div className="text-[10px] text-slate-500 font-normal">Dezinfeksiya harorati / Temp</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Dezinfeksiya vannasi / Bath</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-extrabold mt-0.5">
                        Me'yor: +1°C … +3°C (maks +3°C)
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
                        {form.dezTempOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                    <td className="p-3 text-center bg-rose-50/70 dark:bg-rose-950/20 border-r border-slate-200 dark:border-dark-750">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 leading-tight">
                        CCP-2<br />(Harorat / Temp)
                      </span>
                    </td>
                  </tr>

                  {/* Row 5: Faol xlor (CCP-1) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">5. Faol xlor</div>
                      <div className="text-[10px] text-slate-500 font-normal">Faol xlor / Active chlorine</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Dezinfeksiya vannasi / Bath</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-extrabold mt-0.5">
                        Me'yor: Qat'iy 300 mg/l (ppm)
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
                        {form.dezChlorineOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                    <td className="p-3 text-center bg-rose-50/70 dark:bg-rose-950/20 border-r border-slate-200 dark:border-dark-750">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 leading-tight">
                        CCP-1<br />(Xlor / Chlorine)
                      </span>
                    </td>
                  </tr>

                  {/* Row 6: Konservant */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">6. Konservant</div>
                      <div className="text-[10px] text-slate-500 font-normal">Konservant / Preservative</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Salat maydonchasi / Salad area</div>
                      <div className="text-[11px] text-slate-500">≤1g/kg (Karam 85%, Sabzi 15%)</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Har eritmada
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Koul-Slou Doza:</span>
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <input
                            type="text"
                            value={form.preservative}
                            onChange={(e) => handleChange('preservative', e.target.value)}
                            placeholder="1"
                            className="w-14 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5">g/kg</span>
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
                        {form.preservativeOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 7: Qoldiq xlor */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">7. Qoldiq xlor</div>
                      <div className="text-[10px] text-slate-500 font-normal">Qoldiq xlor / Residual chlorine</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Chiller chiqishi / Chiller outlet</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Qoldiq xlor = 0 mg/l</div>
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
                          ⚠ Xlor bor
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
                        {form.residualChlorineOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 8: Tsentrifuga */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">8. Sentrifuga</div>
                      <div className="text-[10px] text-slate-500 font-normal">Quritish / Centrifuge</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Sentrifuga / Dryer</div>
                      <div className="text-[11px] text-slate-500">30 soniya, 950 ayl/daq, salfetka quruq</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Har 1 soat
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
                          ✓ Salfetka: Quruq (OK)
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
                          ⚠ Nam
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
                        {form.dryingOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 9: Vizual nazorat */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">9. Vizual nazorat</div>
                      <div className="text-[10px] text-slate-500 font-normal">Vizual nazorat / Inspection</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Inspeksiya stoli / Table</div>
                      <div className="text-[11px] text-slate-500">Yupqa yoyish, 100% yot narsalarsiz</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Doimiy
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
                          ✓ 100% Toza (Clean)
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
                          ⚠ Yot jism / Nuqson
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
                        {form.inspectionOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 10: Vazn nazorati */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">10. Vazn nazorati</div>
                      <div className="text-[10px] text-slate-500 font-normal">Vazn nazorati / Weight control</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Qadoqlash / Packaging</div>
                      <div className="text-[11px] text-slate-500">Spetsifikatsiya bo'yicha</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Har 5-paket
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Limon */}
                        <div className="inline-flex items-center bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1.5 uppercase">Limon:</span>
                          <input
                            type="text"
                            placeholder="2"
                            value={form.weightLemon}
                            onChange={(e) => handleChange('weightLemon', e.target.value)}
                            className="w-8 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                          />
                          <span className="text-[10px] font-semibold text-slate-400 ml-1">dona</span>
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
                        {form.weightOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 11: Germetiklik */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">11. Germetiklik</div>
                      <div className="text-[10px] text-slate-500 font-normal">Germetiklik / Sealing</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Qadoqlash / Package Sealing</div>
                      <div className="text-[11px] text-slate-500">100% germetik, chok tekis va mustahkam</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Uzluksiz
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
                          ✓ Germetik (OK)
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
                          ⚠ Havo bor / Oqish
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
                        {form.sealingStatusOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 12: Metallodetektor (CCP-3) */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors border-l-4 border-l-red-500">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-red-700 dark:text-red-400 font-black">12. Metallodetektor</div>
                      <div className="text-[10px] text-slate-500 font-normal">Metal Detector</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-bold text-slate-900 dark:text-white">Ramka / Metallodetektor</div>
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
                          { key: 'metalFe', label: 'Fe (Temir)' },
                          { key: 'metalNonFe', label: 'Non-Fe' },
                          { key: 'metalSs', label: 'SS (Zanglamas)' },
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
                          {form.metalSignal ? '🔔 Signal Bor' : "🔕 Signal Yo'q"}
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
                        {form.metalOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                    <td className="p-3 text-center bg-rose-50/70 dark:bg-rose-950/20 border-r border-slate-200 dark:border-dark-750">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 leading-tight">
                        CCP-3<br />(Metall / Metal)
                      </span>
                    </td>
                  </tr>

                  {/* Row 13: Ombordagi rejim */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">13. Ombor rejimi</div>
                      <div className="text-[10px] text-slate-500 font-normal">Tayyor mahsulot ombori / Warehouse</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">TMO / Tayyor mahsulot ombori</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                        +1°C … +5°C, vakuumli va toza
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[10px] text-slate-500 leading-tight">
                      Ertalab / Kechqurun
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
                          {form.fgStoreVacuum ? '✓ Vakuum: Zich (OK)' : '⚠ Vakuum Buzilgan'}
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
                        {form.fgStoreOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>

                  {/* Row 14: Gigiyena */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-bold border-r border-slate-200 dark:border-dark-750">
                      <div className="text-slate-900 dark:text-white font-black">14. Gigiyena</div>
                      <div className="text-[10px] text-slate-500 font-normal">Sanitation &amp; Hygiene</div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-dark-750">
                      <div className="font-semibold text-slate-900 dark:text-white">Uskuna va xodimlar</div>
                      <div className="text-[11px] text-slate-500">100% tozalik, maxsus kiyim, niqob, qo'lqop</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200 dark:border-dark-750 text-[11px] text-slate-500">
                      Smena boshida
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
                          {form.hygieneClean ? '✓ 100% Tozalik (OK)' : '✗ Tozalikda kamchilik'}
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
                          {form.hygieneGear ? '✓ Maxsus kiyim / Niqob OK' : "✗ Maxsus kiyim yo'q"}
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
                        {form.hygieneOk ? '✓ Mos (OK)' : '✗ Mos emas'}
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
                        OPRP
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: SHIFT SIGN-OFF */}
          {/* ========================================================================= */}
          {(activeSection === 'all' || activeSection === 'signoff') && (
          <div className="border-b border-slate-200 dark:border-dark-750">
            <div className="bg-slate-50 dark:bg-dark-850 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-dark-750">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    {t.secSignoff}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.secSignoffDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white dark:bg-dark-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Block 1: QC Inspector */}
                <div className="bg-slate-50/60 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-dark-750">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                        {t.inspectorCard}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Sifat Nazoratchisi / QC Inspector</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signFullName}
                      </label>
                      <input
                        type="text"
                        placeholder={t.metaInspectorPh}
                        value={form.inspectorName || inspector}
                        onChange={(e) => {
                          handleChange('inspectorName', e.target.value)
                          setInspector(e.target.value)
                        }}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signSignature}
                      </label>
                      <input
                        type="text"
                        placeholder="Elektron imzo / Tasdiq"
                        value={form.inspectorSign}
                        onChange={(e) => handleChange('inspectorSign', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signTime}
                      </label>
                      <input
                        type="time"
                        value={form.inspectorTime}
                        onChange={(e) => handleChange('inspectorTime', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 2: Shift Supervisor */}
                <div className="bg-slate-50/60 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-dark-750">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                        {t.supervisorCard}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Smena Boshlig'i / Shift Supervisor</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signFullName}
                      </label>
                      <input
                        type="text"
                        placeholder={t.metaSupervisorPh}
                        value={form.supervisorName || supervisor}
                        onChange={(e) => {
                          handleChange('supervisorName', e.target.value)
                          setSupervisor(e.target.value)
                        }}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signSignature}
                      </label>
                      <input
                        type="text"
                        placeholder="Elektron imzo / Tasdiq"
                        value={form.supervisorSign}
                        onChange={(e) => handleChange('supervisorSign', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signTime}
                      </label>
                      <input
                        type="time"
                        value={form.supervisorTime}
                        onChange={(e) => handleChange('supervisorTime', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 3: QA Engineer */}
                <div className="bg-slate-50/60 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-dark-750">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                        {t.qaCard}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Sifat Muhandisi / QA Engineer</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signFullName}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ru' ? 'Ф.И.О инженера' : "Sifat muhandisi F.I.Sh"}
                        value={form.qaEngineerName}
                        onChange={(e) => handleChange('qaEngineerName', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signSignature}
                      </label>
                      <input
                        type="text"
                        placeholder="Elektron imzo / Tasdiq"
                        value={form.qaEngineerSign}
                        onChange={(e) => handleChange('qaEngineerSign', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {t.signTime}
                      </label>
                      <input
                        type="time"
                        value={form.qaEngineerTime}
                        onChange={(e) => handleChange('qaEngineerTime', e.target.value)}
                        className="w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 px-3 py-2 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

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
              <span>{lang === 'ru' ? 'Заполнить заново' : lang === 'en' ? 'Reset form' : "Yangidan to'ldirish"}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <Printer size={14} />
                <span>{lang === 'ru' ? 'Печать' : lang === 'en' ? 'Print' : "Chop etish"}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-7 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{t.btnSave}</span>
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
                Arxiv: Saqlangan Kunlik Chek-listlar
              </h2>
              <p className="text-xs text-slate-500">Barcha smena yakuni bo'yicha to'ldirilgan rasmiy jurnallar</p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
            >
              {loadingHistory ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              <span>Yangilash</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Arxiv yuklanmoqda...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Database size={48} className="text-slate-300 dark:text-dark-700 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Arxiv bo'sh</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Hozircha saqlangan kunlik chek-listlar yo'q. &quot;Chek-list&quot; bo'limidan yangi smenani to'ldirib saqlang.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700">
                    <tr>
                      <th className="px-5 py-3.5">Sana / Smena</th>
                      <th className="px-5 py-3.5">Liniya / Partiya №</th>
                      <th className="px-5 py-3.5">Umumiy chiqish</th>
                      <th className="px-5 py-3.5">Brak (kg)</th>
                      <th className="px-5 py-3.5">Mas'ullar</th>
                      <th className="px-5 py-3.5 text-center">Holat</th>
                      <th className="px-5 py-3.5 text-right">Harakat</th>
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
                              {doc.shift}-Smena
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.lineName || '1-Liniya'}</div>
                          <div className="text-[11px] font-mono text-slate-400">Partiya: {doc.batchNumber || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {doc.totalOutputBox ? `${doc.totalOutputBox} quti` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-red-500 font-bold font-mono">
                          {doc.rejectedKg ? `${doc.rejectedKg} kg` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          <div className="text-[11px]">
                            Usta: <span className="font-bold text-slate-800 dark:text-slate-200">{doc.supervisor || '—'}</span>
                          </div>
                          <div className="text-[11px]">
                            Sifat nazorati: <span className="font-bold text-slate-800 dark:text-slate-200">{doc.inspector || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                            <CheckCircle2 size={11} />
                            <span>Tasdiqlangan</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => loadFromArchive(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Chek-listni ochish"
                            >
                              <Eye size={13} />
                              <span>Ko'rish</span>
                            </button>
                            <button
                              onClick={() => window.open(`/api/daily-checklist/${doc.id}/export`, '_blank')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Excel yuklab olish"
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

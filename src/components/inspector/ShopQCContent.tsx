'use client'

import React, { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Thermometer,
  Boxes,
  ShieldCheck,
  FlaskConical,
  Ruler,
  UtensilsCrossed,
  Truck,
  X,
  Loader2,
  Sparkles,
  ChevronRight,
  AlertOctagon,
  Languages,
  Activity,
  Check,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
  PlusCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const DICT = {
  uz: {
    hubTitle: 'Sifat Nazoratchisi & Laboratoriya Hubi',
    hubSub: 'FSSC 22000, KKT-1 Dezinfeksiya, Kalibrovka, Degustatsiya va Kirish Xomashyosi bo\'yicha 7 ta to\'liq elektron jurnallar',
    fsscBadge: 'FSSC 22000 & HACCP',
    all7Sheets: '7 ta Jurnal',
    excelBtn: 'Excel (7 Varaq)',
    addBtn: 'Yangi Yozuv',
    addRecordBtn: "Ma'lumot qo'shish",
    addFirstRecord: "+ Birinchi yozuvni qo'shish",
    searchPlaceholder: 'Partiya, mahsulot yoki mas\'ul bo\'yicha qidiruv...',
    allDates: 'Barcha sanalar',
    journalsMenuTitle: 'Nazoratchi Jurnallari',
    totalEntries: 'Jami yozuvlar',

    tabFssc: "1. Qadoqlash & Og'irlik Nazorati (FSSC 22000)",
    tabFsscDesc: 'Har 5-paket vazni (±10g), quti/paket soni, MAP gaz & metall detektor',
    tabDez: '2. Dezinfeksiya Eritmasi & Yuvish (KKT-1)',
    tabDezDesc: 'Yuvish vannalari xlor (50-100 ppm), pH va suv harorati',
    tabCal: '3. Saralash, Kalibrovka & Kesim (ОПШУ-2)',
    tabCalDesc: 'Mahsulot diametri (Ø mm), harorat (0..+5°C) va chiqindi %',
    tabDeg: '4. Degustatsiya & Organoleptika',
    tabDegDesc: 'Aysberg va Koul Slou: rang, hid, qarsillash, begona ta\'m yo\'qligi',
    tabProc: '5. Sex & Mahsulotlar Harorati',
    tabProcDesc: 'Toza/Iflos zona, GP va P/F partiyalari harorati',
    tabRcv: '6. Xomashyo Birlamchi Kirish Qabuli',
    tabRcvDesc: 'Yuk mashinasi harorati, transport tozaligi va birlamchi fizik ko\'rik',

    emptyMsg: 'Ushbu jurnalda hozircha yozuvlar mavjud emas',
    timeLine: 'Vaqt / Liniya',
    productBatch: 'Mahsulot & Partiya',
    nomFact: 'Nominal / Fakt',
    deviation: 'Og\'ish (±10g)',
    seal: 'Germetiklik',
    metal: 'Metall Detektor',
    label: 'Etiketka',
    status: 'Holat',
    responsible: 'Mas\'ul (Nazoratchi)',
    actions: 'Amallar',
    passed: 'O\'tdi / OK',
    failed: 'Nuqson',
    standard: 'Me\'yorda',
    violation: 'Buzilish',
    approved: 'Ruxsat berildi',
    warning: 'Ogohlantirish',
    rejected: 'Rad etildi',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    deleteConfirm: 'Ushbu yozuvni o\'chirishni tasdiqlaysizmi?',
    timeVat: 'Vaqt / Vanna',
    solType: 'Eritma Turi',
    concPpm: 'Konsentratsiya (ppm)',
    phLevel: 'pH Darajasi',
    waterTemp: 'Suv Harorati (°C)',
    corrAction: 'Tuzatish Chorasi',
    dimMm: 'Diametr (Ø mm)',
    tempSample: 'Harorat (0...+5°C)',
    blade: 'Pichoq O\'tkirligi',
    wastePct: 'Chiqindi %',
    color: 'Rangi',
    smell: 'Hidi',
    crunch: 'Qarsillashi',
    taste: 'Ta\'mi',
    foreignFlavor: 'Begona Ta\'m',
    score: 'Baho',
    conclusion: 'Xulosa',
    cleanZone: 'Toza Zona (°C)',
    dirtyZone: 'Iflos Zona (°C)',
    pfBatches: 'P/F Partiya Raqamlari',
    gpTemps: 'GP Haroratlari',
    docNo: 'Hujjat №',
    supplier: 'Ta\'minotchi',
    qtyKg: 'Miqdor (kg)',
    vehClean: 'Transport Sanitariyasi',
    cargoTemp: 'Yuk Harorati',
    labCert: 'Lab Sertifikat',
    organoleptic: 'Organoleptika',
    accepted: 'Qabul qilindi'
  },
  ru: {
    hubTitle: 'Центр Контроля Качества & Лаборатория (QA/QC)',
    hubSub: 'Единый цифровой комплекс из 7 журналов: FSSC 22000, ККТ-1 Дезраствор, Калибровка, Дегустация и Приемка сырья',
    fsscBadge: 'FSSC 22000 & HACCP',
    all7Sheets: '7 Журналов',
    excelBtn: 'Excel (7 Листов)',
    addBtn: 'Новая Запись',
    addRecordBtn: 'Добавить запись',
    addFirstRecord: '+ Добавить первую запись',
    searchPlaceholder: 'Поиск по партии, продукту или ответственному...',
    allDates: 'Все даты',
    journalsMenuTitle: 'Журналы Контролера',
    totalEntries: 'Всего записей',

    tabFssc: '1. Контроль Упаковки и Веса (FSSC 22000)',
    tabFsscDesc: 'Вес (±10г), герметичность, МГС, металлодетектор, ящики/пакеты',
    tabDez: '2. Дезраствор и Промывка (ККТ-1)',
    tabDezDesc: 'Хлор в ваннах (50-100 ppm), pH, темп-ра воды (+2..+6°C)',
    tabCal: '3. Калибровка, Сортировка и Срез (ОПШУ-2)',
    tabCalDesc: 'Диаметр (Ø мм), темп-ра (0..+5°C), отходы %',
    tabDeg: '4. Дегустация и Органолептика',
    tabDegDesc: 'Айсберг и Коул-слоу: цвет, запах, хруст, вкус',
    tabProc: '5. Температура Цеха и Полуфабрикатов',
    tabProcDesc: 'Чистая/Грязная зона, ГП и П/Ф партии',
    tabRcv: '6. Первичная Приемка Сырья',
    tabRcvDesc: 'Первичный осмотр, темп-ра авто, кол-во ящиков',

    emptyMsg: 'В этом журнале пока нет записей',
    timeLine: 'Время / Линия',
    productBatch: 'Продукт & Партия',
    nomFact: 'Номинал / Факт',
    deviation: 'Откл. (±10г)',
    seal: 'Герметичность',
    metal: 'Металлодетектор',
    label: 'Этикетка',
    status: 'Статус',
    responsible: 'Ответственный (Контролер)',
    actions: 'Действия',
    passed: 'Пройдено / OK',
    failed: 'Брак',
    standard: 'В норме',
    violation: 'Нарушение',
    approved: 'Разрешено',
    warning: 'Предупреждение',
    rejected: 'Отклонено',
    save: 'Сохранить',
    cancel: 'Отмена',
    deleteConfirm: 'Вы уверены, что хотите удалить эту запись?',
    timeVat: 'Время / Ванна',
    solType: 'Тип раствора',
    concPpm: 'Концентрация (ppm)',
    phLevel: 'Уровень pH',
    waterTemp: 'Темп-ра воды (°C)',
    corrAction: 'Корр. действие',
    dimMm: 'Диаметр (Ø мм)',
    tempSample: 'Темп-ра (0...+5°C)',
    blade: 'Острота ножей',
    wastePct: 'Отходы %',
    color: 'Цвет',
    smell: 'Запах',
    crunch: 'Хруст',
    taste: 'Вкус',
    foreignFlavor: 'Посторонний привкус',
    score: 'Оценка',
    conclusion: 'Заключение',
    cleanZone: 'Чистая зона (°C)',
    dirtyZone: 'Грязная зона (°C)',
    pfBatches: 'Номера партий П/Ф',
    gpTemps: 'Темп-ры ГП',
    docNo: 'Документ №',
    supplier: 'Поставщик',
    qtyKg: 'Кол-во (кг)',
    vehClean: 'Санитария авто',
    cargoTemp: 'Темп-ра груза',
    labCert: 'Лаб. сертификат',
    organoleptic: 'Органолептика',
    accepted: 'Принято'
  },
  en: {
    hubTitle: 'Quality Control Center & Laboratory (QA/QC)',
    hubSub: 'Comprehensive 7-journal digital complex: FSSC 22000, CCP-1 Disinfection, Calibration, Degustation & Intake',
    fsscBadge: 'FSSC 22000 & HACCP',
    all7Sheets: '7 Journals',
    excelBtn: 'Excel (7 Sheets)',
    addBtn: 'New Record',
    addRecordBtn: 'Add Record',
    addFirstRecord: '+ Add First Record',
    searchPlaceholder: 'Search by batch, product, or inspector...',
    allDates: 'All dates',
    journalsMenuTitle: 'QC Inspection Journals',
    totalEntries: 'Total records',

    tabFssc: '1. FSSC_22000_QC_Checklist.xlsx',
    tabFsscDesc: 'Weight (±10g), Seal, MAP, Metal detector, Boxes/Packages',
    tabDez: '2. Чек_лист_дезраствора.xlsx (CCP-1)',
    tabDezDesc: 'Vat Chlorine (50-100 ppm), pH, Water temp (+2..+6°C)',
    tabCal: '3. Чек_лист_калибровки.xlsx (OPSHU-2)',
    tabCalDesc: 'Cut Diameter (Ø mm), Sample temp (0..+5°C), Waste %',
    tabDeg: '4. ЧЕК_ЛИСТ_дегустации.xls',
    tabDegDesc: 'Iceberg & Coleslaw: color, aroma, crunch, taste',
    tabProc: '5. chek list harorat.xlsx (Monitoring)',
    tabProcDesc: 'Clean/Dirty zones, FG & Semi-finished batch temps',
    tabRcv: '6. ЖУРНАЛ_ПРИЕМКИ_ВХОДНОГО_СЫРЬЯ_2026.xlsx',
    tabRcvDesc: 'Primary physical intake, Vehicle temp & box count',

    emptyMsg: 'No records found in this journal yet',
    timeLine: 'Time / Line',
    productBatch: 'Product & Batch',
    nomFact: 'Nominal / Actual',
    deviation: 'Dev. (±10g)',
    seal: 'Seal Integrity',
    metal: 'Metal Detector',
    label: 'Label',
    status: 'Status',
    responsible: 'Inspector',
    actions: 'Actions',
    passed: 'Passed / OK',
    failed: 'Defect',
    standard: 'Compliant',
    violation: 'Deviation',
    approved: 'Approved',
    warning: 'Warning',
    rejected: 'Rejected',
    save: 'Save Record',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure you want to delete this record?',
    timeVat: 'Time / Vat',
    solType: 'Solution Type',
    concPpm: 'Concentration (ppm)',
    phLevel: 'pH Level',
    waterTemp: 'Water Temp (°C)',
    corrAction: 'Corrective Action',
    dimMm: 'Diameter (Ø mm)',
    tempSample: 'Product Temp (0...+5°C)',
    blade: 'Blade Sharpness',
    wastePct: 'Waste %',
    color: 'Color',
    smell: 'Odor / Smell',
    crunch: 'Texture / Crunch',
    taste: 'Taste',
    foreignFlavor: 'Foreign Flavor',
    score: 'Score',
    conclusion: 'Conclusion',
    cleanZone: 'Clean Zone (°C)',
    dirtyZone: 'Dirty Zone (°C)',
    pfBatches: 'Semi-Finished Batches',
    gpTemps: 'Finished Goods Temp',
    docNo: 'Doc #',
    supplier: 'Supplier',
    qtyKg: 'Quantity (kg)',
    vehClean: 'Vehicle Sanitation',
    cargoTemp: 'Cargo Temp',
    labCert: 'Lab Certificate',
    organoleptic: 'Sensory Score',
    accepted: 'Accepted'
  }
}

export default function ShopQCContent({ userRole = 'OPERATOR', userName = '' }: { userRole?: string, userName?: string }) {
  const { lang } = useLanguage()
  const d = DICT[lang as 'uz' | 'ru' | 'en'] || DICT.uz

  // Active Tab: fssc | disinfection | calibration | degustation | temperature | receiving
  const [activeTab, setActiveTab] = useState<'fssc' | 'disinfection' | 'calibration' | 'degustation' | 'temperature' | 'receiving'>('fssc')

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Data states
  const [fsscLogs, setFsscLogs] = useState<any[]>([])
  const [disinfectionLogs, setDisinfectionLogs] = useState<any[]>([])
  const [calibrationLogs, setCalibrationLogs] = useState<any[]>([])
  const [degustationLogs, setDegustationLogs] = useState<any[]>([])
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([])
  const [receivingLogs, setReceivingLogs] = useState<any[]>([])

  // Modal State
  const [modalType, setModalType] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [fsscForm, setFsscForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    lineName: '1-Qadoqlash Liniyasi',
    productName: 'Aysberg Salati 500g',
    batchNumber: 'FG-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
    nominalWeight: '500',
    actualWeight: '504',
    packageCheckNo: '5',
    sealIntegrityOk: true,
    metalDetectorOk: true,
    labelCorrectOk: true,
    gasMixLevel: 'O2: 3%, CO2: 5%',
    correctiveAction: '-',
    responsible: userName || 'Sifat Nazoratchisi'
  })

  const [dezForm, setDezForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    vannaNumber: '1-Vanna (Dezinfeksiya & Yuvish)',
    solutionType: 'Xlor eritmasi',
    concentrationPpm: '65.0',
    phLevel: '6.8',
    waterTemp: '3.5',
    correctiveAction: '-',
    responsible: userName || 'Sifat Nazoratchisi'
  })

  const [calForm, setCalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    productName: 'Айсберг',
    batchNumber: 'RAW-001',
    diameterMm: '45.0',
    sampleTemp: '3.2',
    bladeSharpness: "A'lo (Yangi)",
    wastePercent: '4.5',
    correctiveAction: '-',
    responsible: userName || 'Sex Nazoratchisi'
  })

  const [degForm, setDegForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    productType: 'Айсберг',
    batchNumber: 'FG-001',
    colorOk: true,
    smellOk: true,
    crunchOk: true,
    tasteOk: true,
    foreignFlavorOk: true,
    overallScore: '5',
    conclusion: 'Ruxsat berildi (Standartga to\'liq mos)',
    correctiveAction: '-',
    responsible: userName || 'Degustator'
  })

  const [procForm, setProcForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    cleanZoneTemp: '11.5',
    dirtyZoneTemp: '18.0',
    pfIcebergBatch: 'PF-101',
    pfColeCarrotBatch: 'PF-102',
    pfColeCabbageBatch: 'PF-103',
    gpIcebergTemp: '3.5',
    gpColeTemp: '4.0',
    correctiveAction: '-',
    responsible: userName || 'Sex Nazoratchisi'
  })

  const [rcvForm, setRcvForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    supplierName: 'Agro Fresh Agro',
    productName: 'Karam (Cabbage)',
    batchNumber: 'SUP-20260815-01',
    quantityKg: '1500',
    vehicleNumber: '01 A 777 AA',
    vehicleCleanOk: true,
    cargoTemp: '3.8',
    hasLabCertificate: true,
    organolepticScore: '5',
    status: 'ACCEPTED',
    rejectReason: '',
    responsible: userName || 'Kirish Nazoratchisi'
  })

  useEffect(() => {
    fetchAllData()
  }, [filterDate])

  async function fetchAllData() {
    setLoading(true)
    try {
      const q = filterDate ? `?date=${filterDate}` : ''
      const [resFssc, resDez, resCal, resDeg, resProc, resRcv] = await Promise.all([
        fetch(`/api/inspector/fssc-logs${q}`).then(r => r.json()).catch(() => []),
        fetch(`/api/inspector/disinfection-logs${q}`).then(r => r.json()).catch(() => []),
        fetch(`/api/inspector/calibration-logs${q}`).then(r => r.json()).catch(() => []),
        fetch(`/api/inspector/degustation-logs${q}`).then(r => r.json()).catch(() => []),
        fetch(`/api/inspector/process-logs${q}`).then(r => r.json()).catch(() => []),
        fetch(`/api/inspector/receiving-logs${q}`).then(r => r.json()).catch(() => []),
      ])

      setFsscLogs(Array.isArray(resFssc) ? resFssc : [])
      setDisinfectionLogs(Array.isArray(resDez) ? resDez : [])
      setCalibrationLogs(Array.isArray(resCal) ? resCal : [])
      setDegustationLogs(Array.isArray(resDeg) ? resDeg : [])
      setTemperatureLogs(Array.isArray(resProc) ? resProc : [])
      setReceivingLogs(Array.isArray(resRcv) ? resRcv : [])
    } catch {
      toast.error('Xatolik')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadExcel() {
    setExporting(true)
    try {
      const res = await fetch('/api/inspector/export-excel')
      if (!res.ok) throw new Error('Eksport xatosi')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Q_Nazorat_7_Jadval_QC_Jurnallari_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(lang === 'ru' ? 'Все 7 листов Excel успешно скачаны!' : lang === 'en' ? 'All 7 QC sheets exported successfully!' : 'Barcha 7 ta sifat jurnallari Excel faylga yuklandi!')
    } catch {
      toast.error('Excel export error')
    } finally {
      setExporting(false)
    }
  }

  async function handleSaveFssc(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/fssc-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fsscForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись FSSC 22000 сохранена' : lang === 'en' ? 'FSSC 22000 log saved' : 'FSSC 22000 qadoqlash nazorati saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDez(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/disinfection-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dezForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись ККТ-1 дезраствора сохранена' : lang === 'en' ? 'CCP-1 Disinfection log saved' : 'KKT-1 Dezinfeksiya eritmasi qaydi saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/calibration-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись калибровки сохранена' : lang === 'en' ? 'Calibration log saved' : 'Kalibrovka va tozalash qaydi saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDeg(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/degustation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(degForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись дегустации сохранена' : lang === 'en' ? 'Degustation log saved' : 'Degustatsiya & organoleptika qaydi saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProc(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/process-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(procForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Запись температур цеха сохранена' : lang === 'en' ? 'Shop floor temp log saved' : 'Sex harorati qaydi saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveRcv(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/receiving-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rcvForm)
      })
      if (res.ok) {
        toast.success(lang === 'ru' ? 'Акт приемки сырья сохранен' : lang === 'en' ? 'Raw material intake act saved' : 'Xomashyoni qabul qilish akti saqlandi!')
        setModalType(null)
        fetchAllData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } catch {
      toast.error('Network Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRecord(endpoint: string, id: number) {
    if (!confirm(d.deleteConfirm)) return
    try {
      const res = await fetch(`/api/inspector/${endpoint}?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('OK')
        fetchAllData()
      }
    } catch {
      toast.error('Error')
    }
  }

  // Filter helper
  const filterList = (list: any[], fields: string[]) => {
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(item => 
      fields.some(field => String(item[field] || '').toLowerCase().includes(q))
    )
  }

  const filteredFssc = filterList(fsscLogs, ['batchNumber', 'productName', 'responsible', 'lineName'])
  const filteredDez = filterList(disinfectionLogs, ['vannaNumber', 'solutionType', 'responsible', 'correctiveAction'])
  const filteredCal = filterList(calibrationLogs, ['batchNumber', 'productName', 'responsible'])
  const filteredDeg = filterList(degustationLogs, ['batchNumber', 'productType', 'responsible', 'conclusion'])
  const filteredProc = filterList(temperatureLogs, ['pfIcebergBatch', 'pfColeCarrotBatch', 'pfColeCabbageBatch', 'responsible'])
  const filteredRcv = filterList(receivingLogs, ['docNumber', 'supplierName', 'productName', 'batchNumber', 'responsible'])

  // Checklists sidebar definitions
  const checklistItems = [
    {
      id: 'fssc',
      icon: ClipboardCheck,
      title: d.tabFssc,
      desc: d.tabFsscDesc,
      count: fsscLogs.length,
      activeBg: 'bg-emerald-600 text-white',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
    },
    {
      id: 'disinfection',
      icon: FlaskConical,
      title: d.tabDez,
      desc: d.tabDezDesc,
      count: disinfectionLogs.length,
      activeBg: 'bg-cyan-600 text-white',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
    },
    {
      id: 'calibration',
      icon: Ruler,
      title: d.tabCal,
      desc: d.tabCalDesc,
      count: calibrationLogs.length,
      activeBg: 'bg-purple-600 text-white',
      btnColor: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
    },
    {
      id: 'degustation',
      icon: UtensilsCrossed,
      title: d.tabDeg,
      desc: d.tabDegDesc,
      count: degustationLogs.length,
      activeBg: 'bg-pink-600 text-white',
      btnColor: 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
    },
    {
      id: 'temperature',
      icon: Thermometer,
      title: d.tabProc,
      desc: d.tabProcDesc,
      count: temperatureLogs.length,
      activeBg: 'bg-blue-600 text-white',
      btnColor: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
    },
    {
      id: 'receiving',
      icon: Truck,
      title: d.tabRcv,
      desc: d.tabRcvDesc,
      count: receivingLogs.length,
      activeBg: 'bg-amber-600 text-white',
      btnColor: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
    }
  ]

  const activeItem = checklistItems.find(item => item.id === activeTab) || checklistItems[0]

  const isInspector = userRole === 'INSPECTOR'

  return (
    <div className="flex flex-col h-full space-y-5 animate-enter">
      
      {/* Top Header Card - Crisp Light & Dark Mode */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border shadow-sm dark:shadow-inner flex-shrink-0 ${
            isInspector 
              ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
              : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
          }`}>
            {isInspector ? <ClipboardCheck size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                isInspector
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/30'
                  : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
              }`}>
                {isInspector
                  ? (lang === 'ru' ? '👷 Контролер Линии (Цех)' : '👷 Liniya Nazoratchisi (Sex)')
                  : (lang === 'ru' ? '🛡️ Специалист ОКК / QA Lead' : '🛡️ Bosh Sifat Nazoratchisi (QA Lead)')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wider border border-purple-300 dark:border-purple-500/30">
                {d.fsscBadge}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-dark-800 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-wider border border-slate-300 dark:border-dark-700">
                {d.all7Sheets}
              </span>
            </div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isInspector
                ? (lang === 'ru' ? 'Операционные Чек-листы Контролера Линии' : 'Liniya Nazoratchisi Operatsion Jurnallari')
                : (lang === 'ru' ? 'Центр Контроля Качества & Аудит Журналов (QA Lead)' : 'Bosh Sifat Nazoratchisi & Audit Hubi (QA Lead)')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-snug line-clamp-1 font-semibold">
              {isInspector
                ? (lang === 'ru' ? 'Ввод текущих измерений смены под контролем Главного специалиста ОКК' : 'Bosh Sifat Nazoratchisi nazorati ostida joriy smena o\'lchovlarini kiritish')
                : (lang === 'ru' ? 'Аудит и утверждение журналов контролеров линии (Камбарова А. М., Норкулова А.)' : 'Liniya nazoratchilari jurnallarini audit qilish va yakuniy tasdiqlash (Qambarova A. M., Norqulova A.)')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button 
            onClick={handleDownloadExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-emerald-700 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-emerald-400 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-600 transition-all text-xs font-bold shadow-sm active:scale-95"
            title="Excel eksport"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
            <span>{d.excelBtn}</span>
          </button>

          <button 
            onClick={() => setModalType(activeTab)}
            className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl shadow-lg transition-all text-xs font-bold active:scale-95 ${activeItem.btnColor}`}
          >
            <Plus size={15} />
            <span>{d.addRecordBtn}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: Left Navigation + Right Table Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Vertical Checklist Navigation */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-3.5 shadow-sm dark:shadow-xl">
            <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-dark-750">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-emerald-600 dark:text-emerald-400" />
                {d.journalsMenuTitle}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                6 / 6
              </span>
            </div>

            <div className="space-y-1.5">
              {checklistItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full text-left p-3 rounded-xl md:rounded-2xl transition-all flex items-start gap-2.5 relative group ${
                      isActive
                        ? `${item.activeBg} shadow-lg shadow-black/20 border border-white/20`
                        : 'bg-slate-50 hover:bg-slate-100/90 text-slate-800 dark:bg-dark-800/60 dark:hover:bg-dark-800 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-transparent hover:border-slate-300 dark:hover:border-dark-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white dark:bg-dark-700 text-slate-700 dark:text-slate-400 shadow-sm border border-slate-200/60 dark:border-transparent group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      <Icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold text-xs leading-snug truncate ${
                          isActive ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white'
                        }`}>
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isActive 
                            ? 'bg-black/30 text-white' 
                            : 'bg-slate-200/80 text-slate-800 dark:bg-dark-700 dark:text-slate-400'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                      <p className={`text-[10.5px] mt-0.5 leading-tight truncate ${
                        isActive 
                          ? 'text-white/90 font-medium' 
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-medium'
                      }`}>
                        {item.desc}
                      </p>
                    </div>

                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white self-center mr-0.5 animate-pulse flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Search, Filter, Dedicated Add Button and Table */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          
          {/* Header of Active Table + Filters + Dedicated Add Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3.5 md:p-4 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${activeItem.activeBg}`}>
                <activeItem.icon size={19} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight">{activeItem.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{activeItem.desc} • <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeItem.count}</span> {d.totalEntries}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-2.5 py-1.5">
                <Calendar size={13} className="text-slate-500 dark:text-slate-400" />
                <input 
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-white outline-none cursor-pointer font-medium"
                />
                {filterDate && (
                  <button onClick={() => setFilterDate('')} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
                    {d.allDates}
                  </button>
                )}
              </div>

              {/* Live Search */}
              <div className="relative flex-1 sm:w-48 md:w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder={d.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              {/* DEDICATED ADD DATA BUTTON RIGHT IN THE TABLE HEADER */}
              <button 
                onClick={() => setModalType(activeTab)}
                className={`flex items-center gap-1.5 text-white px-3.5 py-1.5 md:py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex-shrink-0 ${activeItem.btnColor}`}
              >
                <Plus size={15} />
                <span>{d.addRecordBtn}</span>
              </button>
            </div>
          </div>

          {/* Data Tables Container */}
          <div className="relative">
            {loading ? (
              <div className="p-20 flex items-center justify-center bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl shadow-sm dark:shadow-xl">
                <Loader2 size={36} className="animate-spin text-emerald-500" />
              </div>
            ) : activeTab === 'fssc' ? (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.timeLine}</th>
                        <th className="p-3.5">{d.productBatch}</th>
                        <th className="p-3.5 text-center">{d.nomFact}</th>
                        <th className="p-3.5 text-center">{d.deviation}</th>
                        <th className="p-3.5 text-center">{d.seal}</th>
                        <th className="p-3.5 text-center">{d.metal}</th>
                        <th className="p-3.5 text-center">{d.label}</th>
                        <th className="p-3.5 text-center">{d.status}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredFssc.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <ClipboardCheck size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('fssc')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredFssc.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.date} <span className="text-emerald-600 dark:text-emerald-400">{l.time}</span></div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{l.lineName}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.productName}</div>
                              <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.batchNumber}</div>
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs">
                              <span className="text-slate-500 dark:text-slate-400">{l.nominalWeight}g</span> / <span className="font-bold text-slate-900 dark:text-white">{l.actualWeight}g</span>
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                Math.abs(l.weightDeviation) <= 10 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                              }`}>
                                {l.weightDeviation > 0 ? `+${l.weightDeviation}g` : `${l.weightDeviation}g`}
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-xs font-bold">
                              {l.sealIntegrityOk ? <span className="text-emerald-600 dark:text-emerald-400">{d.passed}</span> : <span className="text-red-600 dark:text-red-400">{d.failed}</span>}
                            </td>
                            <td className="p-3.5 text-center text-xs font-bold">
                              {l.metalDetectorOk ? <span className="text-emerald-600 dark:text-emerald-400">{d.passed}</span> : <span className="text-red-600 dark:text-red-400">{d.failed}</span>}
                            </td>
                            <td className="p-3.5 text-center text-xs font-bold">
                              {l.labelCorrectOk ? <span className="text-emerald-600 dark:text-emerald-400">{d.passed}</span> : <span className="text-red-600 dark:text-red-400">{d.failed}</span>}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                l.status === 'APPROVED' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-transparent' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-transparent'
                              }`}>
                                {l.status === 'APPROVED' ? d.approved : d.warning}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible}</td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('fssc-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'disinfection' ? (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.timeVat}</th>
                        <th className="p-3.5">{d.solType}</th>
                        <th className="p-3.5 text-center">{d.concPpm}</th>
                        <th className="p-3.5 text-center">{d.phLevel}</th>
                        <th className="p-3.5 text-center">{d.waterTemp}</th>
                        <th className="p-3.5 text-center">{d.status}</th>
                        <th className="p-3.5">{d.corrAction}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredDez.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <FlaskConical size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('disinfection')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredDez.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.date} <span className="text-cyan-600 dark:text-cyan-400">{l.time}</span></div>
                              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{l.vannaNumber}</div>
                            </td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300">{l.solutionType}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-xs">
                              <span className={`px-2.5 py-0.5 rounded ${
                                l.concentrationPpm >= 50 && l.concentrationPpm <= 100 
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                              }`}>
                                {l.concentrationPpm} ppm
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs text-slate-700 dark:text-slate-300">{l.phLevel || '—'}</td>
                            <td className="p-3.5 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{l.waterTemp !== null ? `${l.waterTemp}°C` : '—'}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                l.isStandard 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                              }`}>
                                {l.isStandard ? d.standard : d.violation}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400">{l.correctiveAction || '—'}</td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible}</td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('disinfection-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'calibration' ? (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.timeLine}</th>
                        <th className="p-3.5">{d.productBatch}</th>
                        <th className="p-3.5 text-center">{d.dimMm}</th>
                        <th className="p-3.5 text-center">{d.tempSample}</th>
                        <th className="p-3.5 text-center">{d.blade}</th>
                        <th className="p-3.5 text-center">{d.wastePct}</th>
                        <th className="p-3.5 text-center">{d.status}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredCal.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <Ruler size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('calibration')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredCal.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.date} <span className="text-purple-600 dark:text-purple-400">{l.time}</span></div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.productName}</div>
                              <div className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">{l.batchNumber || '—'}</div>
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {l.diameterMm ? `Ø ${l.diameterMm} mm` : '—'}
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {l.sampleTemp !== null ? `${l.sampleTemp}°C` : '—'}
                            </td>
                            <td className="p-3.5 text-center text-xs text-slate-700 dark:text-slate-300 font-medium">{l.bladeSharpness || 'OK'}</td>
                            <td className="p-3.5 text-center font-mono text-xs text-amber-700 dark:text-amber-300 font-bold">{l.wastePercent ? `${l.wastePercent}%` : '—'}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                l.isStandard 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                              }`}>
                                {l.isStandard ? d.standard : d.warning}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible}</td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('calibration-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'degustation' ? (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.timeLine}</th>
                        <th className="p-3.5">{d.productBatch}</th>
                        <th className="p-3.5 text-center">{d.color}</th>
                        <th className="p-3.5 text-center">{d.smell}</th>
                        <th className="p-3.5 text-center">{d.crunch}</th>
                        <th className="p-3.5 text-center">{d.taste}</th>
                        <th className="p-3.5 text-center">{d.foreignFlavor}</th>
                        <th className="p-3.5 text-center">{d.score}</th>
                        <th className="p-3.5">{d.conclusion}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredDeg.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <UtensilsCrossed size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('degustation')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredDeg.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.date} <span className="text-pink-600 dark:text-pink-400">{l.time}</span></div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.productType}</div>
                              <div className="text-[11px] font-mono font-bold text-pink-600 dark:text-pink-400">{l.batchNumber}</div>
                            </td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.colorOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.smellOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.crunchOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.tasteOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.foreignFlavorOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center font-bold text-xs text-amber-600 dark:text-yellow-400">⭐ {l.overallScore}/5</td>
                            <td className="p-3.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">{l.conclusion}</td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible}</td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('degustation-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'temperature' ? (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.timeLine}</th>
                        <th className="p-3.5 text-center">{d.cleanZone}</th>
                        <th className="p-3.5 text-center">{d.dirtyZone}</th>
                        <th className="p-3.5">{d.pfBatches}</th>
                        <th className="p-3.5 text-center">{d.gpTemps}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.status}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredProc.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <Thermometer size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('temperature')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredProc.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.date} <span className="text-blue-600 dark:text-blue-400">{l.time}</span></div>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                              {l.cleanZoneTemp !== null ? `${l.cleanZoneTemp}°C` : '—'}
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                              {l.dirtyZoneTemp !== null ? `${l.dirtyZoneTemp}°C` : '—'}
                            </td>
                            <td className="p-3.5 text-xs font-mono text-slate-800 dark:text-slate-300">
                              {l.pfIcebergBatch && <div>Айсберг: #{l.pfIcebergBatch}</div>}
                              {l.pfColeCarrotBatch && <div>Морковь: #{l.pfColeCarrotBatch}</div>}
                              {l.pfColeCabbageBatch && <div>Капуста: #{l.pfColeCabbageBatch}</div>}
                              {!l.pfIcebergBatch && !l.pfColeCarrotBatch && !l.pfColeCabbageBatch && <span className="text-slate-400">—</span>}
                            </td>
                            <td className="p-3.5 text-center text-xs font-mono">
                              {l.gpIcebergTemp && <div className="text-emerald-600 dark:text-emerald-400 font-bold">Айсберг: {l.gpIcebergTemp}°C</div>}
                              {l.gpColeTemp && <div className="text-emerald-600 dark:text-emerald-400 font-bold">Коул: {l.gpColeTemp}°C</div>}
                              {!l.gpIcebergTemp && !l.gpColeTemp && <span className="text-slate-400">—</span>}
                            </td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible || 'QC'}</td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                                {l.status || 'APPROVED'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('process-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-wider">
                        <th className="p-3.5">{d.docNo} / {d.timeLine}</th>
                        <th className="p-3.5">{d.supplier}</th>
                        <th className="p-3.5">{d.productBatch}</th>
                        <th className="p-3.5 text-center">{d.qtyKg}</th>
                        <th className="p-3.5 text-center">{d.vehClean}</th>
                        <th className="p-3.5 text-center">{d.cargoTemp}</th>
                        <th className="p-3.5 text-center">{d.labCert}</th>
                        <th className="p-3.5 text-center">{d.organoleptic}</th>
                        <th className="p-3.5 text-center">{d.status}</th>
                        <th className="p-3.5">{d.responsible}</th>
                        <th className="p-3.5 text-center">{d.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                      {filteredRcv.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <Truck size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-3">{d.emptyMsg}</p>
                            <button
                              onClick={() => setModalType('receiving')}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              <Plus size={14} />
                              {d.addFirstRecord}
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredRcv.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{l.docNumber}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{l.date} {l.time}</div>
                            </td>
                            <td className="p-3.5 text-xs font-bold text-slate-900 dark:text-white">{l.supplierName}</td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{l.productName}</div>
                              <div className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">{l.batchNumber}</div>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">{l.quantityKg} kg</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.vehicleCleanOk ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{l.cargoTemp !== null ? `${l.cargoTemp}°C` : '—'}</td>
                            <td className="p-3.5 text-center text-xs font-bold">{l.hasLabCertificate ? <span className="text-emerald-600 dark:text-emerald-400">OK</span> : <span className="text-red-600 dark:text-red-400">X</span>}</td>
                            <td className="p-3.5 text-center font-bold text-xs text-amber-600 dark:text-yellow-400">⭐ {l.organolepticScore || 5}/5</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                l.status === 'ACCEPTED' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                              }`}>
                                {l.status === 'ACCEPTED' ? d.accepted : d.rejected}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{l.responsible}</td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => handleDeleteRecord('receiving-logs', l.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: FSSC 22000 */}
      {modalType === 'fssc' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="text-emerald-600 dark:text-emerald-400" /> {d.tabFssc}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFssc} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.timeLine} (Sana)</label>
                  <input type="date" value={fsscForm.date} onChange={e => setFsscForm({...fsscForm, date: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Vaqt</label>
                  <input type="text" value={fsscForm.time} onChange={e => setFsscForm({...fsscForm, time: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.productBatch}</label>
                <input type="text" value={fsscForm.productName} onChange={e => setFsscForm({...fsscForm, productName: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Partiya Raqami</label>
                  <input type="text" value={fsscForm.batchNumber} onChange={e => setFsscForm({...fsscForm, batchNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Liniya</label>
                  <input type="text" value={fsscForm.lineName} onChange={e => setFsscForm({...fsscForm, lineName: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nominal Vazn (g)</label>
                  <input type="number" step="1" value={fsscForm.nominalWeight} onChange={e => setFsscForm({...fsscForm, nominalWeight: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Haqiqiy Vazn (g)</label>
                  <input type="number" step="1" value={fsscForm.actualWeight} onChange={e => setFsscForm({...fsscForm, actualWeight: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={fsscForm.sealIntegrityOk} onChange={e => setFsscForm({...fsscForm, sealIntegrityOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{d.seal}</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={fsscForm.metalDetectorOk} onChange={e => setFsscForm({...fsscForm, metalDetectorOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{d.metal}</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={fsscForm.labelCorrectOk} onChange={e => setFsscForm({...fsscForm, labelCorrectOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{d.label}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Disinfection KKT-1 */}
      {modalType === 'disinfection' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="text-cyan-600 dark:text-cyan-400" /> {d.tabDez}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDez} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Sana</label>
                  <input type="date" value={dezForm.date} onChange={e => setDezForm({...dezForm, date: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Vaqt</label>
                  <input type="text" value={dezForm.time} onChange={e => setDezForm({...dezForm, time: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.timeVat}</label>
                <input type="text" value={dezForm.vannaNumber} onChange={e => setDezForm({...dezForm, vannaNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.concPpm}</label>
                  <input type="number" step="0.1" value={dezForm.concentrationPpm} onChange={e => setDezForm({...dezForm, concentrationPpm: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold" placeholder="50-100" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.phLevel}</label>
                  <input type="number" step="0.1" value={dezForm.phLevel} onChange={e => setDezForm({...dezForm, phLevel: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-medium" placeholder="6.5-7.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.waterTemp}</label>
                  <input type="number" step="0.1" value={dezForm.waterTemp} onChange={e => setDezForm({...dezForm, waterTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold" placeholder="+2...+6" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.corrAction}</label>
                <input type="text" value={dezForm.correctiveAction} onChange={e => setDezForm({...dezForm, correctiveAction: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Calibration */}
      {modalType === 'calibration' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ruler className="text-purple-600 dark:text-purple-400" /> {d.tabCal}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCal} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.productBatch}</label>
                  <input type="text" value={calForm.productName} onChange={e => setCalForm({...calForm, productName: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Partiya Raqami</label>
                  <input type="text" value={calForm.batchNumber} onChange={e => setCalForm({...calForm, batchNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.dimMm}</label>
                  <input type="number" step="0.1" value={calForm.diameterMm} onChange={e => setCalForm({...calForm, diameterMm: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.tempSample}</label>
                  <input type="number" step="0.1" value={calForm.sampleTemp} onChange={e => setCalForm({...calForm, sampleTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.wastePct}</label>
                  <input type="number" step="0.1" value={calForm.wastePercent} onChange={e => setCalForm({...calForm, wastePercent: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Degustation */}
      {modalType === 'degustation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="text-pink-600 dark:text-pink-400" /> {d.tabDeg}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDeg} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mahsulot Turi</label>
                  <select value={degForm.productType} onChange={e => setDegForm({...degForm, productType: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium">
                    <option value="Айсберг">Айсберг</option>
                    <option value="Коулслоу">Коулслоу</option>
                    <option value="Романо">Романо</option>
                    <option value="Салат Микс">Салат Микс</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Partiya Raqami</label>
                  <input type="text" value={degForm.batchNumber} onChange={e => setDegForm({...degForm, batchNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={degForm.colorOk} onChange={e => setDegForm({...degForm, colorOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.color} (OK)</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={degForm.smellOk} onChange={e => setDegForm({...degForm, smellOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.smell} (OK)</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={degForm.crunchOk} onChange={e => setDegForm({...degForm, crunchOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.crunch} (OK)</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={degForm.foreignFlavorOk} onChange={e => setDegForm({...degForm, foreignFlavorOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.foreignFlavor} (OK)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.conclusion}</label>
                <input type="text" value={degForm.conclusion} onChange={e => setDegForm({...degForm, conclusion: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Process Temp */}
      {modalType === 'temperature' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Thermometer className="text-blue-600 dark:text-blue-400" /> {d.tabProc}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProc} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.cleanZone}</label>
                  <input type="number" step="0.1" value={procForm.cleanZoneTemp} onChange={e => setProcForm({...procForm, cleanZoneTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.dirtyZone}</label>
                  <input type="number" step="0.1" value={procForm.dirtyZoneTemp} onChange={e => setProcForm({...procForm, dirtyZoneTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">P/F Aysberg Partiya</label>
                  <input type="text" value={procForm.pfIcebergBatch} onChange={e => setProcForm({...procForm, pfIcebergBatch: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">GP Aysberg Harorati (°C)</label>
                  <input type="number" step="0.1" value={procForm.gpIcebergTemp} onChange={e => setProcForm({...procForm, gpIcebergTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6-7: Receiving */}
      {modalType === 'receiving' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-dark-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="text-amber-600 dark:text-amber-400" /> {d.tabRcv}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveRcv} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.supplier}</label>
                  <input type="text" value={rcvForm.supplierName} onChange={e => setRcvForm({...rcvForm, supplierName: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.productBatch}</label>
                  <input type="text" value={rcvForm.productName} onChange={e => setRcvForm({...rcvForm, productName: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-medium" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Partiya Raqami</label>
                  <input type="text" value={rcvForm.batchNumber} onChange={e => setRcvForm({...rcvForm, batchNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.qtyKg}</label>
                  <input type="number" step="0.1" value={rcvForm.quantityKg} onChange={e => setRcvForm({...rcvForm, quantityKg: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">{d.cargoTemp} (°C)</label>
                  <input type="number" step="0.1" value={rcvForm.cargoTemp} onChange={e => setRcvForm({...rcvForm, cargoTemp: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mashina Raqami</label>
                  <input type="text" value={rcvForm.vehicleNumber} onChange={e => setRcvForm({...rcvForm, vehicleNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={rcvForm.vehicleCleanOk} onChange={e => setRcvForm({...rcvForm, vehicleCleanOk: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.vehClean} (OK)</span>
                </label>
                <label className="flex items-center gap-2 bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs">
                  <input type="checkbox" checked={rcvForm.hasLabCertificate} onChange={e => setRcvForm({...rcvForm, hasLabCertificate: e.target.checked})} />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{d.labCert} (OK)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-800">{d.cancel}</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} {d.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

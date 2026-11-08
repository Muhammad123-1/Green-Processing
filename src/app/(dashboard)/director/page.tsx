'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Activity,
  Users,
  Truck,
  DollarSign,
  Package,
  ClipboardList,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  Sliders,
  Printer,
  FileSpreadsheet,
  Eye,
  X,
  ChefHat,
  ShoppingCart,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  BarChart3,
  Utensils,
  MessageSquare,
  Layers,
  Archive,
  Sparkles,
  Check,
  CheckCircle,
  AlertCircle,
  FileText,
  CornerDownRight,
  ShieldCheck,
  Thermometer,
  Building2,
  Hash,
  Calculator,
  ClipboardCheck,
  CheckSquare,
  Factory,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import ExecutiveSummaryReportModal from '@/components/director/ExecutiveSummaryReportModal'
import IncomingMaterialsAnalysis from '@/components/director/executive/IncomingMaterialsAnalysis'
import ConsumptionMaterialsAnalysis from '@/components/director/executive/ConsumptionMaterialsAnalysis'
import DefectMaterialsAnalysis from '@/components/director/executive/DefectMaterialsAnalysis'
import ProductBalanceTable, { ProductBalanceItem } from '@/components/director/executive/ProductBalanceTable'
import ProductLossDrawer from '@/components/director/executive/ProductLossDrawer'

export default function DirectorPage() {
  const { directorLang, setDirectorLang, formatDirector } = useLanguage()
  const formatDual = formatDirector
  const dateLocale: string = directorLang === 'ru' ? 'ru-RU' : directorLang === 'en' ? 'en-US' : 'uz-UZ'

  // Period state
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Executive 1-Page Summary Report Modal State
  const [showSummaryReportModal, setShowSummaryReportModal] = useState(false)

  // Configurable thresholds (stored in localStorage)
  const [thresholds, setThresholds] = useState({
    discrepancyThreshold: 3, // % max discrepancy between issued & received
    minYieldThreshold: 85, // % min yield
    maxRejectThreshold: 10, // % max reject rate
  })

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tempThresholds, setTempThresholds] = useState(thresholds)

  // Loading & data
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  // Drill-down modal state
  const [activeModal, setActiveModal] = useState<
    'arrivals' | 'production' | 'warehouse' | 'sales' | 'surveys' | 'employees' | 'alerts' | 'archive' | 'operations' | null
  >(null)
  const [operationsTab, setOperationsTab] = useState<'prixod' | 'rasxod' | 'brak' | 'ombor'>('prixod')
  const [selectedOperationItem, setSelectedOperationItem] = useState<any>(null)
  const [selectedOperationProduct, setSelectedOperationProduct] = useState<string>('ALL')
  const [visibleOperationsLimit, setVisibleOperationsLimit] = useState<number>(60)
  const [arrivalsDisplayLimit, setArrivalsDisplayLimit] = useState<number>(100)
  const [arrivalsPage, setArrivalsPage] = useState<number>(1)
  const [warehouseStockPage, setWarehouseStockPage] = useState<number>(1)

  // Interactive 4-Level Chart Drill-Down Modal State
  const [chartDrillModal, setChartDrillModal] = useState<{
    type: 'dynamics' | 'defects' | 'coverage' | 'debt' | 'plan' | 'perf'
    title: string
    subtitle?: string
    data: any
  } | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<'accounting' | 'quality' | 'inspector' | 'admin' | 'production' | null>(null)
  const [deptPeriodFilter, setDeptPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [deptActionsPage, setDeptActionsPage] = useState<number>(1)
  const [selectedAuditAction, setSelectedAuditAction] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [archiveEvents, setArchiveEvents] = useState<any[]>([])
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductBalanceItem | null>(null)
  const [executiveProductBalances, setExecutiveProductBalances] = useState<ProductBalanceItem[]>([])
  const [loadingExecutiveBalances, setLoadingExecutiveBalances] = useState(false)

  const openOperationsModal = (tab: 'prixod' | 'rasxod' | 'brak' | 'ombor', item?: any) => {
    setOperationsTab(tab)
    setSelectedOperationItem(item || null)
    setSelectedOperationProduct('ALL')
    setVisibleOperationsLimit(60)
    setActiveModal('operations')

    if (tab === 'ombor' && executiveProductBalances.length === 0) {
      setLoadingExecutiveBalances(true)
      fetch('/api/director/executive')
        .then((res) => res.json())
        .then((json) => {
          if (json?.productBalances) {
            setExecutiveProductBalances(json.productBalances)
          }
        })
        .catch((err) => console.error('Failed to load executive product balances:', err))
        .finally(() => setLoadingExecutiveBalances(false))
    }
  }

  // Mounted state for charts
  const [mounted, setMounted] = useState(false)

  // Load saved thresholds on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('gp_director_thresholds')
      if (saved) {
        const parsed = JSON.parse(saved)
        setThresholds(parsed)
        setTempThresholds(parsed)
      }
    } catch {}
  }, [])

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAuditAction) {
          setSelectedAuditAction(null)
          return
        }
        setActiveModal(null)
        setSelectedEmployee(null)
        setSelectedOperationItem(null)
        setShowSettingsModal(false)
        setShowSummaryReportModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAuditAction])

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        discrepancyThreshold: thresholds.discrepancyThreshold.toString(),
        minYieldThreshold: thresholds.minYieldThreshold.toString(),
        maxRejectThreshold: thresholds.maxRejectThreshold.toString(),
      })
      if (period === 'custom') {
        if (customFrom) params.append('from', customFrom)
        if (customTo) params.append('to', customTo)
      }

      const execParams = new URLSearchParams()
      if (period === 'custom') {
        if (customFrom) execParams.append('dateFrom', customFrom)
        if (customTo) execParams.append('dateTo', customTo)
      }

      const [res, execRes] = await Promise.all([
        fetch(`/api/director?${params.toString()}`),
        fetch(`/api/director/executive?${execParams.toString()}`).catch(() => null),
      ])

      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json)

      if (execRes && execRes.ok) {
        const execJson = await execRes.json()
        if (execJson?.productBalances) {
          setExecutiveProductBalances(execJson.productBalances)
        }
      } else if (json?.details?.productBalances) {
        setExecutiveProductBalances(json.details.productBalances)
      } else if (json?.operationsSummary?.ombor?.items) {
        setExecutiveProductBalances(json.operationsSummary.ombor.items)
      }
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, customFrom, customTo, thresholds])

  // Lazy load archive events for director modal
  useEffect(() => {
    if (activeModal === 'archive' && archiveEvents.length === 0) {
      setLoadingArchive(true)
      fetch('/api/archive')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setArchiveEvents(d)
        })
        .catch(console.error)
        .finally(() => setLoadingArchive(false))
    }
  }, [activeModal, archiveEvents.length])

  // Save new thresholds
  const handleSaveThresholds = () => {
    setThresholds(tempThresholds)
    try {
      localStorage.setItem('gp_director_thresholds', JSON.stringify(tempThresholds))
    } catch {}
    setShowSettingsModal(false)
    toast.success(formatDual('Chegaralar muvaffaqiyatli saqlandi!', 'Пороги успешно сохранены!', 'Thresholds saved successfully!'))
  }

  const kpis = data?.kpis
  const alerts: any[] = data?.alerts || []
  const details = data?.details || {}
  const charts = data?.charts || {}
  const dailyTrends: any[] = charts.dailyTrends || []
  const stockDistribution: any[] = useMemo(() => {
    const list: any[] = charts.stockDistribution || []
    return list.map((item: any) => {
      let localizedName = item.name
      if (item.name === "Yetarli") localizedName = formatDual("Yetarli", "В норме", "Sufficient")
      else if (item.name === "Kam qolgan") localizedName = formatDual("Kam qolgan", "Мало", "Low stock")
      else if (item.name === "Tugagan") localizedName = formatDual("Tugagan", "Закончилось", "Out of stock")
      return {
        ...item,
        name: localizedName,
      }
    })
  }, [charts.stockDistribution, formatDual])

  const shiftComparison: any[] = useMemo(() => {
    const list: any[] = charts.shiftComparison || []
    return list.map((item: any) => ({
      ...item,
      shift: item.shift?.replace('1-Smena', formatDual('1-smena', '1-я смена', 'Shift 1')).replace('2-Smena', formatDual('2-smena', '2-я смена', 'Shift 2')) || item.shift,
    }))
  }, [charts.shiftComparison, formatDual])

  const employeeActivityChart: any[] = charts.employeeActivityChart || []

  // 6 Executive Analytics Charts Data
  const productionDynamics: any[] = charts.productionDynamics || []
  const defectsByStage: any[] = charts.defectsByStage || []
  const inventoryStockCoverage: any[] = charts.inventoryStockCoverage || []
  const supplierDebts: any[] = charts.supplierDebts || []
  const productionPlanVsActual: any = charts.productionPlanVsActual || { hasPlan: false, items: [] }
  const supplierPerformance: any[] = charts.supplierPerformance || []
  const operationsSummary = data?.operationsSummary

  // Distinct products for operations product filter dropdown
  const operationsProductList = useMemo(() => {
    if (!operationsSummary) return []
    const list: any[] = operationsSummary[operationsTab]?.items || []
    const names = new Set<string>()
    list.forEach((item: any) => {
      if (item.productName) names.add(item.productName)
    })
    return Array.from(names).sort()
  }, [operationsSummary, operationsTab])

  // Filtered operations list (Prixod / Rasxod / Brak)
  const currentOperationsList = useMemo(() => {
    if (!operationsSummary) return []
    const list: any[] = operationsSummary[operationsTab]?.items || []
    return list.filter((item: any) => {
      const matchProduct = selectedOperationProduct === 'ALL' || item.productName === selectedOperationProduct
      if (!matchProduct) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        item.productName?.toLowerCase().includes(q) ||
        item.batchNumber?.toLowerCase().includes(q) ||
        item.defectNumber?.toLowerCase().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.receivedBy?.toLowerCase().includes(q) ||
        item.date?.toLowerCase().includes(q) ||
        item.chain?.broughtBy?.supplier?.toLowerCase().includes(q) ||
        item.chain?.cleanedBy?.worker?.toLowerCase().includes(q) ||
        item.chain?.issuedToProductionBy?.worker?.toLowerCase().includes(q) ||
        item.chain?.receivedBy?.worker?.toLowerCase().includes(q)
      )
    })
  }, [operationsSummary, operationsTab, searchQuery, selectedOperationProduct])

  const activeChainItem = selectedOperationItem || currentOperationsList[0] || null

  // Filtered lists for modals
  const filteredProducts = useMemo(() => {
    const list: any[] = details.productStockDetails || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter((p: any) => p.name?.toLowerCase().includes(q))
  }, [details.productStockDetails, searchQuery])

  const filteredChecklists = useMemo(() => {
    const list: any[] = details.recentChecklists || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (c: any) =>
        c.inspector?.toLowerCase().includes(q) ||
        c.supervisor?.toLowerCase().includes(q) ||
        c.batchNumber?.toLowerCase().includes(q) ||
        c.date?.includes(q)
    )
  }, [details.recentChecklists, searchQuery])

  const filteredTransfers = useMemo(() => {
    const list: any[] = details.recentTransfers || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (t: any) =>
        t.product?.name?.toLowerCase().includes(q) ||
        t.issuedByName?.toLowerCase().includes(q) ||
        t.receivedByName?.toLowerCase().includes(q) ||
        t.transferNumber?.toLowerCase().includes(q)
    )
  }, [details.recentTransfers, searchQuery])

  const filteredInspections = useMemo(() => {
    const unifiedList: any[] = []

    // 1. Kiruvchi xomashyo qabul aktlari (IncomingRawMaterialAct - Quality & Warehouse verified)
    ;(details.recentIncomingActs || []).forEach((act: any) => {
      const name = (act.productName || '').trim()
      if (!name || /^[\s?\uFFFD\-_.]+$/.test(name) || name.replace(/[\uFFFD\s?\-_.]/g, '').length < 2) return
      unifiedList.push({
        id: `inc-act-${act.id}`,
        date: act.actDate || (act.createdAt ? String(act.createdAt).split('T')[0] : ''),
        rawDate: act.actDate || act.createdAt,
        nomenclature: name,
        supplier: act.supplierName || '-',
        inspectorName: act.inspectorName || formatDual("Sifat Nazoratchisi", "Контролер качества", "QC Inspector"),
        quantity: act.warehouseKg || 0,
        batch: act.batchNumber || act.actNumber || '-',
        docType: formatDual("Kirim akti", "Акт приемки", "Inbound Act"),
      })
    })

    // 2. Sex xomashyo qabullari (ShopArrival)
    ;(details.recentShopArrivals || []).forEach((sa: any) => {
      const name = (sa.nomenclature || sa.productName || '').trim()
      if (!name || /^[\s?\uFFFD\-_.]+$/.test(name) || name.replace(/[\uFFFD\s?\-_.]/g, '').length < 2) return
      unifiedList.push({
        id: `shop-arr-${sa.id}`,
        date: sa.date || (sa.createdAt ? String(sa.createdAt).split('T')[0] : ''),
        rawDate: sa.date || sa.createdAt,
        nomenclature: name,
        supplier: sa.supplier || 'Markaziy ombor',
        inspectorName: sa.inspector || sa.user?.name || formatDual("Sex Nazoratchisi", "Цеховой инспектор", "Shop Inspector"),
        quantity: sa.quantity || 0,
        batch: sa.batch || '-',
        docType: formatDual("Sex qabuli", "Цеховой приход", "Shop Arrival"),
      })
    })

    // Sort all arrivals by date descending
    unifiedList.sort((a, b) => {
      const da = a.date || ''
      const db = b.date || ''
      return db.localeCompare(da)
    })

    if (!searchQuery) return unifiedList
    const q = searchQuery.toLowerCase()
    return unifiedList.filter(
      (i: any) =>
        i.supplier?.toLowerCase?.().includes(q) ||
        i.nomenclature?.toLowerCase?.().includes(q) ||
        i.inspectorName?.toLowerCase?.().includes(q) ||
        i.batch?.toLowerCase?.().includes(q) ||
        i.date?.toLowerCase?.().includes(q)
    )
  }, [details.recentIncomingActs, details.recentShopArrivals, searchQuery, formatDual])

  // Arrivals 10-per-page Pagination
  const arrivalsPageSize = 10
  const totalArrivalsPages = Math.max(1, Math.ceil(filteredInspections.length / arrivalsPageSize))
  const currentArrivalsPage = Math.min(arrivalsPage, totalArrivalsPages)
  const pagedArrivals = useMemo(() => {
    return filteredInspections.slice((currentArrivalsPage - 1) * arrivalsPageSize, currentArrivalsPage * arrivalsPageSize)
  }, [filteredInspections, currentArrivalsPage])

  // -------------------------------------------------------------------------
  // 5 CORE DEPARTMENTS DEFINITIONS (Director Request #10)
  // -------------------------------------------------------------------------
  const departmentsList = useMemo(() => [
    {
      id: 'accounting' as const,
      name: formatDual("Buxgalteriya", "Бухгалтерия", "Accounting"),
      role: 'ACCOUNTING',
      responsible: formatDual("Buxgalteriya bo'limi", "Бухгалтерия", "Accounting dept"),
      description: formatDual(
        "Kirim hisob-kitoblari, narxlar, shartnomalar va moliyaviy nazorat",
        "Учет прихода, цены, расчеты с поставщиками и финконтроль",
        "Inbound accounting, prices, supplier reconciliation & financial audit"
      ),
      icon: Calculator,
      color: "emerald",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      accentBg: "hover:border-emerald-500 dark:hover:border-emerald-500",
      dotColor: "bg-emerald-500",
    },
    {
      id: 'quality' as const,
      name: formatDual("Sifat nazoratchisi", "Контролер качества (QC)", "Quality Control (QC)"),
      role: 'QUALITY_CONTROL',
      responsible: formatDual("Sifat Nazorati (QC)", "Контроль качества", "Quality Control"),
      description: formatDual(
        "Xomashyo sifat qabuli aktlari, smena QC cheklistlari va braklar nazorati",
        "Акты контроля качества сырья, сменные чек-листы QC и брак",
        "Raw material QC incoming acts, shift QC checklists & defect auditing"
      ),
      icon: ClipboardCheck,
      color: "blue",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      accentBg: "hover:border-blue-500 dark:hover:border-blue-500",
      dotColor: "bg-blue-500",
    },
    {
      id: 'inspector' as const,
      name: formatDual("Sex nazoratchisi", "Контролер цеха", "Workshop Inspector"),
      role: 'INSPECTOR',
      responsible: formatDual("Sex Nazoratchisi / Texnolog", "Инспектор цеха / Технолог", "Inspector / Technologist"),
      description: formatDual(
        "Sex liniyalari nazorati, sanitariya, xomashyo liniyaga uzatilishi va texnologiya",
        "Контроль линий цеха, санитария, передача сырья на линии и технологические нормы",
        "Workshop line inspection, sanitation, material feeding & process control"
      ),
      icon: ShieldCheck,
      color: "purple",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      accentBg: "hover:border-purple-500 dark:hover:border-purple-500",
      dotColor: "bg-purple-500",
    },
    {
      id: 'admin' as const,
      name: formatDual("Administrator", "Администратор", "Administrator"),
      role: 'ADMIN',
      responsible: formatDual("Tizim Administratori", "Системный администратор", "System Admin"),
      description: formatDual(
        "Tizim xavfsizligi, foydalanuvchilar auditi, zaxira nusxalash va konfiguratsiyalar",
        "Безопасность системы, аудит пользователей, резервные копии и конфигурация",
        "System security, user audits, backup archives & global configs"
      ),
      icon: ShieldAlert,
      color: "rose",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      accentBg: "hover:border-rose-500 dark:hover:border-rose-500",
      dotColor: "bg-rose-500",
    },
    {
      id: 'production' as const,
      name: formatDual("Ishlab chiqarish", "Производственный отдел", "Production"),
      role: 'PRODUCTION',
      responsible: formatDual("Sex boshlig'i / Ishlab chiqarish", "Начальник цеха / Производство", "Production Supervisor"),
      description: formatDual(
        "Xomashyo sarfi, tozalash va kesish, tayyor mahsulot qadoqlash hamda smena chiqimlari",
        "Расход сырья, зачистка, фасовка готовой продукции и сменные отчеты",
        "Raw material consumption, trimming, packaging & shift outputs"
      ),
      icon: Factory,
      color: "amber",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      accentBg: "hover:border-amber-500 dark:hover:border-amber-500",
      dotColor: "bg-amber-500",
    },
  ], [formatDual])

  // Helper to parse dates safely (handles DD.MM.YYYY, DD,MM,YYYY, ISO, etc.)
  const parseSafeDate = (raw: any): Date => {
    if (!raw) return new Date()
    if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date() : raw
    const s = String(raw).trim().replace(/,/g, '.')
    if (s.toLowerCase().includes('invalid') || /^m\d+/i.test(s)) return new Date()
    const dmy = s.match(/^(\d{1,2})[./, -](\d{1,2})[./, -](\d{4})/)
    if (dmy) {
      return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10), 12, 0, 0)
    }
    const ymd = s.match(/^(\d{4})[./, -](\d{1,2})[./, -](\d{1,2})/)
    if (ymd) {
      return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10), 12, 0, 0)
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? new Date() : d
  }

  // Universal clean date formatter that never prints 'Invalid Date', 'M10', or 'NaN'
  const formatCleanDate = (val: any, includeTime: boolean = false): string => {
    if (!val) return '-'
    if (typeof val === 'string') {
      const s = val.trim()
      if (s.toLowerCase().includes('invalid') || /^m\d+/i.test(s)) return '-'
      const dmy = s.match(/^(\d{1,2})[./, -](\d{1,2})[./, -](\d{4})/)
      if (dmy) {
        const dd = String(dmy[1]).padStart(2, '0')
        const mm = String(dmy[2]).padStart(2, '0')
        const yyyy = dmy[3]
        return `${dd}.${mm}.${yyyy}`
      }
      const ymd = s.match(/^(\d{4})[./, -](\d{1,2})[./, -](\d{1,2})/)
      if (ymd) {
        const yyyy = ymd[1]
        const mm = String(ymd[2]).padStart(2, '0')
        const dd = String(ymd[3]).padStart(2, '0')
        return `${dd}.${mm}.${yyyy}`
      }
    }

    let dt: Date | null = null
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) dt = val
    } else if (typeof val === 'number') {
      const td = new Date(val)
      if (!isNaN(td.getTime())) dt = td
    } else if (typeof val === 'string') {
      const td = new Date(val)
      if (!isNaN(td.getTime())) dt = td
    }

    if (!dt || isNaN(dt.getTime())) return '-'
    const day = String(dt.getDate()).padStart(2, '0')
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const year = dt.getFullYear()
    if (includeTime && (dt.getHours() !== 0 || dt.getMinutes() !== 0) && (dt.getHours() !== 12 || dt.getMinutes() !== 0)) {
      const hrs = String(dt.getHours()).padStart(2, '0')
      const mins = String(dt.getMinutes()).padStart(2, '0')
      return `${day}.${month}.${year} ${hrs}:${mins}`
    }
    return `${day}.${month}.${year}`
  }

  // Helper to filter actions by period (Bugun / Shu hafta / Shu oy / Barchasi)
  const filterActionsByPeriod = (actions: any[], periodFilter: 'today' | 'week' | 'month' | 'all') => {
    if (periodFilter === 'all') return actions
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return actions.filter((act) => {
      if (!act.date || isNaN(act.date.getTime())) return false
      if (periodFilter === 'today') {
        return (
          act.dateStr === todayStr ||
          (act.date.getFullYear() === now.getFullYear() &&
            act.date.getMonth() === now.getMonth() &&
            act.date.getDate() === now.getDate())
        )
      }
      if (periodFilter === 'week') {
        return act.date >= weekAgo
      }
      if (periodFilter === 'month') {
        return act.date >= monthAgo
      }
      return true
    })
  }

  // -------------------------------------------------------------------------
  // MAP ALL ACTIONS TO 5 DEPARTMENTS
  // -------------------------------------------------------------------------
  const departmentActionsMap = useMemo(() => {
    const map: Record<'accounting' | 'quality' | 'inspector' | 'admin' | 'production', any[]> = {
      accounting: [],
      quality: [],
      inspector: [],
      admin: [],
      production: [],
    }

    // 1. Incoming acts (Quality Control & Accounting)
    ;(details.recentIncomingActs || []).forEach((act: any) => {
      const actDate = parseSafeDate(act.actDate || act.createdAt)

      // QC inspection act
      map.quality.push({
        id: `act-qc-${act.id}`,
        dept: 'quality',
        type: formatDual("QC Xomashyo tekshiruvi (Akt)", "QC Акт приемки сырья", "QC Raw Material Act"),
        date: actDate,
        dateStr: act.actDate || (act.createdAt ? new Date(act.createdAt).toISOString().split('T')[0] : ''),
        details: `${act.productName || "Xomashyo"} — ${act.warehouseKg ? Number(act.warehouseKg).toLocaleString() + " kg" : ""} (${act.supplierName || "Ta'minotchi"}) • Baho: ${act.decisionRating || 4}/5 (${act.decisionText || "Qabul qilindi"})`,
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        category: 'inspection',
        user: act.inspectorName || formatDual("Sifat Nazorati", "Контролер QC", "QC Inspector"),
        rawData: act,
      })

      // Accounting price reconciliation
      if (act.pricePerKg && Number(act.pricePerKg) > 0) {
        const totalSum = Number(act.warehouseKg || 0) * Number(act.pricePerKg)
        map.accounting.push({
          id: `act-acc-${act.id}`,
          dept: 'accounting',
          type: formatDual("Kirim hisob-fakturasi va narx tasdig'i", "Учет прихода и расчет цены", "Inbound Invoice & Price Reconciliation"),
          date: actDate,
          dateStr: act.actDate || (act.createdAt ? new Date(act.createdAt).toISOString().split('T')[0] : ''),
          details: `${act.productName || "Xomashyo"} (${act.supplierName || "Ta'minotchi"}) — ${act.warehouseKg ? Number(act.warehouseKg).toLocaleString() + " kg" : ""} • Narxi: ${Number(act.pricePerKg).toLocaleString()} so'm/kg • Jami: ${totalSum ? totalSum.toLocaleString() + " so'm" : "-"}`,
          badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
          category: 'finance',
          user: formatDual("Buxgalteriya", "Бухгалтерия", "Accounting"),
          rawData: act,
        })
      }
    })

    // 2. Daily QC Checklists
    ;(details.recentChecklists || []).forEach((c: any) => {
      const cDate = parseSafeDate(c.date || c.createdAt)

      // Quality control
      map.quality.push({
        id: `chk-qc-${c.id}`,
        dept: 'quality',
        type: formatDual("Smena QC Sifat tekshiruvi", "Сменный контроль качества QC", "Shift QC Inspection"),
        date: cDate,
        dateStr: c.date || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''),
        details: `${c.date} (Smena ${c.shift || 1}, ${c.lineName || "Liniya"}) — Chiqish: ${c.totalOutputBox || 0} quti, Brak: ${c.rejectedKg || 0} kg • Holat: ${c.status || "Bajarildi"}`,
        badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
        category: 'checklist',
        user: c.inspector || formatDual("Sifat Nazorati", "QC", "QC"),
        rawData: c,
      })

      // Workshop Inspector
      map.inspector.push({
        id: `chk-insp-${c.id}`,
        dept: 'inspector',
        type: formatDual("Sex smena va liniya nazorati", "Контроль смены и линий цеха", "Workshop Shift & Line Inspection"),
        date: cDate,
        dateStr: c.date || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''),
        details: `${c.date} (Smena ${c.shift || 1}) — ${c.lineName || "Ishlab chiqarish liniyasi"} texnologik parametrlar va sanitariya tekshiruvi`,
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
        category: 'checklist',
        user: c.supervisor || formatDual("Sex Nazoratchisi", "Инспектор цеха", "Workshop Inspector"),
        rawData: c,
      })

      // Production (Finished goods packaging)
      map.production.push({
        id: `chk-prod-${c.id}`,
        dept: 'production',
        type: formatDual("Tayyor mahsulot qadoqlash (Smena)", "Фасовка готовой продукции", "Finished Goods Packaging"),
        date: cDate,
        dateStr: c.date || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''),
        details: `${c.date} (Smena ${c.shift || 1}) — ${c.totalOutputBox || 0} quti tayyor mahsulot ishlab chiqarilib qadoqlandi`,
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        category: 'checklist',
        user: formatDual("Ishlab Chiqarish", "Производство", "Production"),
        rawData: c,
      })
    })

    // 3. Shop Arrivals
    ;(details.recentShopArrivals || []).forEach((sa: any) => {
      const saDate = parseSafeDate(sa.date || sa.createdAt)

      // Inspector
      map.inspector.push({
        id: `arr-insp-${sa.id}`,
        dept: 'inspector',
        type: formatDual("Sexga xomashyo qabuli", "Прием сырья в цех", "Workshop Raw Material Arrival"),
        date: saDate,
        dateStr: sa.date || (sa.createdAt ? new Date(sa.createdAt).toISOString().split('T')[0] : ''),
        details: `${sa.nomenclature || sa.productName || "Xomashyo"} — ${sa.quantity ? Number(sa.quantity).toLocaleString() + " kg" : "Qabul"} (Partiya #${sa.batch || "-"}) • Manba: ${sa.supplier || "Ombor"}`,
        badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
        category: 'transfer_received',
        user: formatDual("Sex Nazoratchisi", "Инспектор цеха", "Workshop Inspector"),
        rawData: sa,
      })

      // Production input
      map.production.push({
        id: `arr-prod-${sa.id}`,
        dept: 'production',
        type: formatDual("Liniyaga xomashyo uzatilishi", "Подача сырья на линию", "Raw Material Line Feeding"),
        date: saDate,
        dateStr: sa.date || (sa.createdAt ? new Date(sa.createdAt).toISOString().split('T')[0] : ''),
        details: `${sa.nomenclature || sa.productName || "Xomashyo"} — ${sa.quantity ? Number(sa.quantity).toLocaleString() + " kg" : ""} ishlab chiqarish liniyasiga topshirildi`,
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
        category: 'transfer_received',
        user: formatDual("Ishlab Chiqarish", "Производство", "Production"),
        rawData: sa,
      })
    })

    // 4. Shop Expenses (Production)
    ;(details.recentShopExpenses || []).forEach((exp: any) => {
      const expDate = parseSafeDate(exp.date || exp.createdAt)
      const matKeys = Object.keys(exp.materials || {})
      const outKeys = Object.keys(exp.outputs || {})

      map.production.push({
        id: `exp-${exp.id}`,
        dept: 'production',
        type: formatDual("Sex xomashyo sarfi va chiqimi", "Расход сырья и выход продукции", "Shop Material Consumption & Output"),
        date: expDate,
        dateStr: exp.date || (exp.createdAt ? new Date(exp.createdAt).toISOString().split('T')[0] : ''),
        details: `${exp.date} — Sarflangan: ${matKeys.length} xil xomashyo • Olingan: ${outKeys.length} xil tayyor mahsulot`,
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        category: 'expense',
        user: formatDual("Ishlab Chiqarish", "Производство", "Production"),
        rawData: exp,
      })
    })

    // 5. Stock Transfers (Inspector)
    ;(details.recentTransfers || []).forEach((tr: any) => {
      const trDate = new Date(tr.createdAt)
      map.inspector.push({
        id: `tr-${tr.id}`,
        dept: 'inspector',
        type: formatDual("Ombordan sexga transfer", "Перемещение со склада в цех", "Warehouse to Workshop Transfer"),
        date: trDate,
        dateStr: trDate.toISOString().split('T')[0],
        details: `${tr.product?.name || "Mahsulot"} — ${tr.issuedQuantity} ${tr.issuedUnit || "kg"} transfer qilindi -> ${tr.targetLocation || "Sex"}`,
        badge: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
        category: 'transfer_issued',
        user: tr.issuedByName || formatDual("Sex Nazoratchisi", "Инспектор", "Inspector"),
        rawData: tr,
      })
    })

    // 6. Sales Orders (Accounting)
    ;(details.recentSalesOrders || []).forEach((so: any) => {
      const soDate = new Date(so.createdAt)
      map.accounting.push({
        id: `so-${so.id}`,
        dept: 'accounting',
        type: formatDual("Sotuv buyurtmasi va hisob-kitob", "Заказ на продажу и расчет", "Sales Order & Invoicing"),
        date: soDate,
        dateStr: soDate.toISOString().split('T')[0],
        details: `${so.customer?.name || "Mijoz"} — ${so.totalAmount ? Number(so.totalAmount).toLocaleString() + " so'm" : "Buyurtma"} (${so.status || "Tasdiqlangan"})`,
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        category: 'sales',
        user: formatDual("Buxgalteriya", "Бухгалтерия", "Accounting"),
        rawData: so,
      })
    })

    // 7. Defect & Wastage Logs (Quality Control)
    ;(details.recentDefectLogs || []).forEach((df: any) => {
      const dfDate = new Date(df.createdAt)
      map.quality.push({
        id: `df-${df.id}`,
        dept: 'quality',
        type: formatDual("Brak va nuqsonlar qaydi", "Акт брака и дефектов", "Defect & Scrap Log"),
        date: dfDate,
        dateStr: dfDate.toISOString().split('T')[0],
        details: `${df.productName || "Mahsulot"} — ${df.rejectedQuantity || df.quantity || 0} kg (${df.reason || "Sifatsiz"})`,
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
        category: 'inspection',
        user: df.inspector || formatDual("Sifat Nazorati", "QC", "QC"),
        rawData: df,
      })
    })

    ;(details.recentWastageLogs || []).forEach((w: any) => {
      const wDate = w.incidentDate ? new Date(w.incidentDate + 'T12:00:00Z') : new Date(w.createdAt)
      map.quality.push({
        id: `w-${w.id}`,
        dept: 'quality',
        type: formatDual("Chiqindi va yo'qotish dalolatnomasi", "Акт отходов и потерь", "Wastage & Loss Audit"),
        date: wDate,
        dateStr: w.incidentDate || (w.createdAt ? new Date(w.createdAt).toISOString().split('T')[0] : ''),
        details: `${w.productName || "Mahsulot"} — ${w.netWasteKg || w.totalWasteKg || 0} kg (${w.stage || "Sex"}) • ${w.lossType || "Chiqindi"}`,
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        category: 'inspection',
        user: w.reportedByName || formatDual("Sifat Nazorati", "QC", "QC"),
        rawData: w,
      })
    })

    // 8. Shipping Logs (Quality Control)
    ;(details.recentShippingLogs || []).forEach((shp: any) => {
      const shpDate = shp.date ? new Date(shp.date + 'T12:00:00Z') : new Date(shp.createdAt)
      map.quality.push({
        id: `shp-${shp.id}`,
        dept: 'quality',
        type: formatDual("Yuklash oldi QC nazorati", "Контроль перед отгрузкой QC", "Pre-dispatch QC Inspection"),
        date: shpDate,
        dateStr: shp.date || (shp.createdAt ? new Date(shp.createdAt).toISOString().split('T')[0] : ''),
        details: `${shp.orderNumber || "Buyurtma"} — Harorat: ${shp.truckTemp || "4"}°C, QC: ${shp.qcStatus || "Muvofiq"}`,
        badge: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
        category: 'inspection',
        user: formatDual("Sifat Nazorati", "QC", "QC"),
        rawData: shp,
      })
    })

    // 9. System Logs (Admin & respective departments)
    ;(details.recentLogs || []).forEach((lg: any) => {
      const lgDate = new Date(lg.createdAt)
      const role = lg.user?.role
      const uid = lg.userId

      let targetDept: 'accounting' | 'quality' | 'inspector' | 'admin' | 'production' = 'admin'
      let actionType = formatDual("Tizim ma'muriyati amali", "Действие системного администратора", "System Administration Task")
      let badge = "bg-slate-100 text-slate-800 dark:bg-dark-750 dark:text-slate-200"

      if (role === 'ACCOUNTING' || uid === 8 || lg.action.includes('INVOICE') || lg.action.includes('PAYMENT')) {
        targetDept = 'accounting'
        actionType = formatDual("Buxgalteriya moliyaviy amali", "Финансовая операция бухгалтерии", "Accounting Financial Task")
        badge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      } else if (role === 'QUALITY_CONTROL' || uid === 3 || lg.action.includes('INSPECTION') || lg.action.includes('QC')) {
        targetDept = 'quality'
        actionType = formatDual("Sifat nazorati tizim amali", "Системное действие QC", "QC System Action")
        badge = "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      } else if (role === 'INSPECTOR' || role === 'TECHNOLOGY' || uid === 12 || uid === 4) {
        targetDept = 'inspector'
        actionType = formatDual("Sex nazoratchisi amali", "Действие инспектора цеха", "Workshop Inspector Action")
        badge = "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      } else if (role === 'PRODUCTION' || role === 'KITCHEN' || uid === 5 || uid === 13) {
        targetDept = 'production'
        actionType = formatDual("Ishlab chiqarish qaydi", "Запись производства", "Production Log")
        badge = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      }

      map[targetDept].push({
        id: `log-${lg.id}`,
        dept: targetDept,
        type: actionType,
        date: lgDate,
        dateStr: lgDate.toISOString().split('T')[0],
        details: `${lg.action} — ${lg.details || formatDual("Tizim amali muvaffaqiyatli bajarildi", "Операция успешно выполнена", "System operation executed successfully")}`,
        badge,
        category: 'system',
        user: lg.user?.name || formatDual("Administrator", "Администратор", "Administrator"),
        rawData: lg,
      })
    })

    // Sort each department's actions descending by date
    Object.keys(map).forEach((key) => {
      const k = key as keyof typeof map
      map[k].sort((a, b) => b.date.getTime() - a.date.getTime())
    })

    return map
  }, [details, formatDual])

  const employeeActions = useMemo(() => {
    if (!selectedEmployee) return []
    const uid = selectedEmployee.userId
    const uname = selectedEmployee.name

    const actions: any[] = []

    // From checklists
    ;(details.recentChecklists || []).forEach((c: any) => {
      if (c.inspectorId === uid || c.inspector === uname || c.user?.id === uid) {
        actions.push({
          type: "Smena QC Cheklisti",
          date: c.createdAt || c.date,
          details: `${c.date} (Smena ${c.shift}) — Chiqish: ${c.totalOutputBox || 0} quti, Brak: ${c.rejectedKg || 0} kg`,
          badge: "bg-emerald-100 text-emerald-800",
          category: 'checklist',
          rawData: c,
        })
      }
    })

    // From inspections
    ;(details.recentInspections || []).forEach((insp: any) => {
      if (insp.inspectorId === uid || insp.user?.id === uid) {
        actions.push({
          type: "Xomashyo tekshiruvi (Akt)",
          date: insp.createdAt,
          details: `${insp.supplier?.name || "Ta'minotchi"} — ${insp.quantity} kg (${insp.status})`,
          badge: "bg-blue-100 text-blue-800",
          category: 'inspection',
          rawData: insp,
        })
      }
    })

    // From transfers
    ;(details.recentTransfers || []).forEach((tr: any) => {
      if (tr.issuedById === uid || tr.issuedByName === uname) {
        actions.push({
          type: "Ombordan chiqarish",
          date: tr.createdAt,
          details: `${tr.product?.name || "Mahsulot"} — ${tr.issuedQuantity} ${tr.issuedUnit} chiqarildi -> ${tr.targetLocation}`,
          badge: "bg-amber-100 text-amber-800",
          category: 'transfer_issued',
          rawData: tr,
        })
      }
      if (tr.receivedById === uid || tr.receivedByName === uname) {
        actions.push({
          type: "Tsex/Oshxonaga qabul",
          date: tr.createdAt,
          details: `${tr.product?.name || "Mahsulot"} — ${tr.receivedQuantity} ${tr.issuedUnit} qabul qilindi (Farq: ${tr.discrepancy || 0})`,
          badge: "bg-purple-100 text-purple-800",
          category: 'transfer_received',
          rawData: tr,
        })
      }
    })

    // From shop arrivals
    ;(details.recentShopArrivals || []).forEach((sa: any) => {
      if (sa.createdById === uid || sa.receiverName === uname || sa.inspectorName === uname) {
        actions.push({
          type: "Tsexga kirim",
          date: sa.createdAt,
          details: `${sa.productName || "Xomashyo"} — ${sa.quantity} ${sa.unit || 'kg'} (${sa.sourceLocation || 'Ombor'})`,
          badge: "bg-teal-100 text-teal-800",
          category: 'transfer_received',
          rawData: sa,
        })
      }
    })

    // From defect logs
    ;(details.recentDefectLogs || []).forEach((df: any) => {
      if (df.reportedById === uid || df.inspector === uname) {
        actions.push({
          type: "Brak / Yaroqsiz dalolatnomasi",
          date: df.createdAt,
          details: `${df.productName || "Mahsulot"} — ${df.rejectedQuantity || df.quantity || 0} kg (${df.reason || 'Sifatsiz'})`,
          badge: "bg-rose-100 text-rose-800",
          category: 'inspection',
          rawData: df,
        })
      }
    })

    return actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedEmployee, details])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-enter">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatDual("Direktor Paneli", "Панель Директора", "Director Dashboard")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDual(
                  "Zavod monitoringi",
                  "Мониторинг завода",
                  "Factory monitoring"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* DEDICATED DIRECTOR SINGLE-LANGUAGE SWITCHER */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
            {[
              { id: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
              { id: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
              { id: 'en' as const, label: 'English', flag: '🇬🇧' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setDirectorLang(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  directorLang === item.id
                    ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <Link
            href="/archive"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Archive size={15} />
            <span>{formatDual("Arxiv", "Архив", "Archive")}</span>
          </Link>

          <button
            onClick={() => {
              setTempThresholds(thresholds)
              setShowSettingsModal(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-dark-700"
          >
            <Sliders size={15} />
            <span>{formatDual("Mezonlar", "Пороги", "Thresholds")}</span>
          </button>

          <button
            onClick={() => setShowSummaryReportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <Printer size={15} />
            <span>{formatDual("Rasmiy Xulosa (PDF)", "Официальное резюме (PDF)", "Executive Summary (PDF)")}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VAQT VA GRAFIKLAR NAZORATI */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-200 dark:border-dark-750 space-y-6">
      <div className="bg-slate-100/80 dark:bg-dark-850 p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200 dark:border-dark-750 no-print">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'today', label: formatDual('Bugun', 'Сегодня', 'Today') },
            { id: 'week', label: formatDual('Hafta', 'Неделя', 'Week') },
            { id: 'month', label: formatDual('Oy', 'Месяц', 'Month') },
            { id: 'year', label: formatDual('Yil', 'Год', 'Year') },
            { id: 'all', label: formatDual('Barchasi', 'Все', 'All') },
            { id: 'custom', label: formatDual('Oraliq', 'Период', 'Custom') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                period === tab.id
                  ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-dark-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
            <span className="text-slate-400 text-[11px]">{formatDual("Dan:", "С:", "From:")}</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            />
            <span className="text-slate-400 text-[11px]">{formatDual("Gacha:", "По:", "To:")}</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium text-xs focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SUSPICIOUS ALERTS BANNER (IF ANY ANOMALIES DETECTED) */}
      {/* ========================================================================= */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {formatDual("Shubhali holatlar", "Аномалии", "Alerts")} ({alerts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDual(
                    "Me'yordan chetga chiqishlar",
                    "Отклонения от нормы",
                    "Discrepancies detected"
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('alerts')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {formatDual("Barchasi", "Все", "All")} &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                onClick={() => setActiveModal('alerts')}
                className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm cursor-pointer hover:border-amber-400 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    alert.type === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.section}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(alert.date).toLocaleDateString(dateLocale)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-dark-800 text-[10px]">
                  <span className="text-slate-400">{formatDual("Mas'ul:", "Ответственный:", "Responsible:")} <b className="text-slate-700 dark:text-slate-300">{alert.responsiblePerson}</b></span>
                  <span className="font-bold text-amber-600">{alert.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* 3.5. PRIMARY OPERATIONAL CONTROLS: PRIXOD, RASXOD & BRAK */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-blue-600 to-rose-600 text-white flex items-center justify-center font-bold shadow-md">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {formatDual("Operatsiyalar", "Операции", "Operations")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual(
                  "Kirim, chiqim va brak monitoringi",
                  "Приход, расход и брак",
                  "Inbound, consumption & waste"
                )}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl self-start sm:self-auto border border-indigo-200 dark:border-indigo-800">
            {formatDual("Mas'uliyat zanjiri", "Цепочка ответственности", "Accountability chain")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* PRIXOD CARD */}
          <div
            onClick={() => openOperationsModal('prixod')}
            className="group relative overflow-hidden bg-emerald-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Truck size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {formatDual("Kirim operatsiyalari", "Приход сырья", "Inbound Operations")}
            </h4>
          </div>

          {/* RASXOD CARD */}
          <div
            onClick={() => openOperationsModal('rasxod')}
            className="group relative overflow-hidden bg-blue-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-blue-500/30 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                <ChefHat size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {formatDual("Chiqim operatsiyalari", "Расход производства", "Outbound Operations")}
            </h4>
          </div>

          {/* BRAK CARD */}
          <div
            onClick={() => openOperationsModal('brak')}
            className="group relative overflow-hidden bg-rose-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-rose-500/30 hover:border-rose-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {formatDual("Brak va chiqindi", "Брак и отходы", "Defects & Waste")}
            </h4>
          </div>

          {/* OMBORXONA (QOLDIQ) CARD */}
          <div
            onClick={() => openOperationsModal('ombor')}
            className="group relative overflow-hidden bg-indigo-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-indigo-500/30 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Package size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {formatDual("Omborxona qoldig'i", "Складской остаток", "Warehouse Stock")}
            </h4>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXECUTIVE SUMMARY KPIS (CLICKABLE DRILL-DOWNS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: XOMASHYO VA TA'MINOT */}
        <div
          onClick={() => setActiveModal('arrivals')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Truck size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xomashyo qabuli", "Прием сырья", "Raw arrivals")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.arrivals?.acceptedKg ? (kpis.arrivals.acceptedKg / 1000).toFixed(1) + ` ${formatDual("tn", "тн", "tn")}` : `${kpis?.arrivals?.totalCount || 0} ${formatDual("partiya", "партий", "batches")}`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.arrivals?.acceptedKg ? `${kpis.arrivals.acceptedKg.toLocaleString()} kg ${formatDual("qabul qilingan", "принято", "accepted")}` : `${kpis?.arrivals?.totalCount || 0} ${formatDual("ta qabul", "приемок", "receipts")}`}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Qabul:", "Принято:", "Accepted:")}</span>
              <span className="font-bold text-emerald-600">
                {kpis?.arrivals?.acceptedKg ? `${(kpis.arrivals.acceptedKg / 1000).toFixed(1)} tn` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Rad etilgan:", "Отклонено:", "Rejected:")}</span>
              <span className={`font-bold ${kpis?.arrivals?.rejectedKg > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {kpis?.arrivals?.rejectedKg ? `${kpis.arrivals.rejectedKg} kg` : '0 kg'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: ISHLAB CHIQARISH VA SMENA NATIJALARI */}
        <div
          onClick={() => setActiveModal('production')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ChefHat size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ishlab chiqarish", "Производство", "Production")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {kpis?.production?.totalOutputBoxes ? `${kpis.production.totalOutputBoxes.toLocaleString()} ${formatDual("quti", "кор.", "boxes")}` : `${kpis?.production?.checklistsCount || 0} ${formatDual("smena", "смен", "shifts")}`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {kpis?.production?.totalOutputKg ? `${kpis.production.totalOutputKg.toLocaleString()} kg ${formatDual("tayyor mahsulot", "готовой прод.", "finished product")}` : `${kpis?.production?.checklistsCount || 0} ${formatDual("ta smena", "смен", "shifts")}`}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Sarfdan (Yield):", "Выход (Yield):", "Yield:")}</span>
              <span className="font-bold text-emerald-600">
                {kpis?.production?.avgYieldPercent ? `${kpis.production.avgYieldPercent.toFixed(1)}%` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Zaxiradan:", "К запасу:", "Stock-Rel:")}</span>
              <span className="font-bold text-indigo-600">
                {kpis?.production?.stockRelativeOutputPercent ? `${kpis.production.stockRelativeOutputPercent.toFixed(1)}%` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: OMBOR HOLATI (SVETOFOR VA TRANSFERLAR) */}
        <div
          onClick={() => setActiveModal('warehouse')}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Package size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Ombor zaxirasi", "Складские остатки", "Stock balance")}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {kpis?.warehouse?.sufficientCount || 0} {formatDual("yetarli", "в норме", "sufficient")}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> {kpis?.warehouse?.lowStockCount || 0} {formatDual("kam", "мало", "low")}
            </span>
            {(kpis?.warehouse?.excessStockCount || 0) > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> {kpis?.warehouse?.excessStockCount} {formatDual("ortiqcha", "избыток", "excess")}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> {kpis?.warehouse?.outOfStockCount || 0} {formatDual("tugagan", "закончилось", "out of stock")}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {kpis?.warehouse?.totalInventoryKg ? `${kpis.warehouse.totalInventoryKg.toLocaleString()} kg (${kpis?.warehouse?.totalProductsCount || 0} ${formatDual("xil xomashyo", "вид. сырья", "raw materials")})` : `${formatDual("Jami", "Всего", "Total")} ${kpis?.warehouse?.totalProductsCount || 0} ${formatDual("xil mahsulot", "вид. прод.", "product types")}`}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Transferlar:", "Трансферы:", "Transfers:")}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {kpis?.warehouse?.transfersCount || 0} {formatDual("ta", "шт", "pcs")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{formatDual("Kamomad:", "Недостача:", "Shortage:")}</span>
              <span className={`font-bold ${kpis?.warehouse?.transfersDiscrepancyKg > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {kpis?.warehouse?.transfersDiscrepancyKg || 0} kg
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: XODIMLAR FAOLIYATI (5 TA ASOSIY BO'LIM) */}
        <div
          onClick={() => {
            setSelectedDepartment(null)
            setActiveModal('employees')
          }}
          className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              {formatDual("Ko'rish", "Открыть", "Inspect")} <ChevronRight size={14} />
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {formatDual("Xodimlar faoliyati", "Деятельность отделов", "Department activities")}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            5 <span className="text-sm font-semibold text-slate-400">{formatDual("ta asosiy bo'lim", "ключевых отделов", "core departments")}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {formatDual("Buxgalteriya, Sifat, Sex, Admin, Ishlab chiqarish", "Бухгалтерия, Контроль качества, Цех, Админ, Производство", "Accounting, QC, Inspector, Admin, Production")}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{formatDual("Nazorat turi:", "Вид контроля:", "Monitoring:")}</span>
            <span className="font-bold text-indigo-600 flex items-center gap-1">
              {formatDual("Kunlik, haftalik, oylik", "День, неделя, месяц", "Daily, weekly, monthly")}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4.5. EXECUTIVE CHARTS & INTERACTIVE ANALYTICS (6 KEY CHARTS) */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        {/* PRIMARY ANALYTICS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {formatDual("Asosiy operatsion analitika", "Ключевая операционная аналитика", "Primary Operational Analytics")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual("Haqiqiy ma'lumotlar tahlili va interaktiv burg'ulash (drill-down)", "Анализ реальных данных с интерактивной детализацией", "Real data analytics with progressive drill-down")}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 self-start sm:self-auto">
            {formatDual("Grafik elementini bosing → tahlil ochiladi", "Кликните на элемент для детализации", "Click on chart to drill down")}
          </span>
        </div>

        {/* PRIMARY 4 CHARTS — 2-COLUMN RESPONSIVE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHART 1: PRODUCTION DYNAMICS */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm hover:border-indigo-500/30 transition-all flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  {formatDual("1. Ishlab chiqarish dinamikasi", "1. Динамика производства", "1. Production Dynamics")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Xomashyo sarfi (kg) va tayyor mahsulot (kg)", "Расход сырья (кг) и выпуск готовой продукции (кг)", "Raw material consumed (kg) vs finished output (kg)")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {kpis?.production?.avgYieldPercent ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {kpis.production.avgYieldPercent}% {formatDual("chiqish normasi", "норма выхода", "yield")}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs mb-3 px-1">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {formatDual("Sarflangan xomashyo (kg)", "Расход сырья (кг)", "Raw consumed (kg)")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                {formatDual("Tayyor mahsulot (kg)", "Выпуск (кг)", "Finished output (kg)")}
              </span>
            </div>

            <div className="h-[280px] w-full cursor-pointer">
              {mounted && productionDynamics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={productionDynamics}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const payload = e.activePayload[0].payload
                        setChartDrillModal({
                          type: 'dynamics',
                          title: `${formatDual("Ishlab chiqarish tahlili", "Анализ производства", "Production Audit")} — ${payload.date}`,
                          subtitle: formatDual("Sex sarfi, tayyor qutilar va chiqish foizi", "Расход цеха, коробки и процент выхода", "Workshop consumption, boxes & yield"),
                          data: payload,
                        })
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="dynConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dynOutput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        try {
                          const parts = String(val).split('-')
                          return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : String(val)
                        } catch {
                          return String(val)
                        }
                      }}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}t` : `${val}kg`)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} kg`,
                        name === 'consumedKg'
                          ? formatDual("Sarflangan xomashyo", "Расход сырья", "Raw consumed")
                          : formatDual("Tayyor mahsulot", "Выпуск", "Finished output"),
                      ]}
                      labelFormatter={(label) => `${formatDual("Sana", "Дата", "Date")}: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumedKg"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#dynConsumed)"
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="outputKg"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#dynOutput)"
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Tanlangan davr uchun ishlab chiqarish dinamikasi mavjud emas", "Нет данных о производстве за период", "No production dynamics data")}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              {formatDual("Nuqta ustiga bosing → kunlik audit", "Кликните точку → аудит дня", "Click point → daily audit")}
            </p>
          </div>

          {/* CHART 2: DEFECT ANALYSIS BY STAGE */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm hover:border-rose-500/30 transition-all flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500" />
                  {formatDual("2. Bosqichlar bo'yicha brak tahlili", "2. Анализ брака по этапам", "2. Defect Analysis by Stage")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Qabul, ishlab chiqarish va saqlashdagi jismoniy brak (kg)", "Брак при приеме, переработке и хранении (кг)", "Actual defects at incoming, processing, storage (kg)")}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {formatDual("Jismoniy og'irlik (kg)", "Физический вес (кг)", "Physical weight (kg)")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs mb-3 px-1">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                {formatDual("Qabul (Incoming)", "Прием", "Incoming")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                {formatDual("Sex (Processing)", "Цех", "Processing")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                {formatDual("Ombor (Storage)", "Склад", "Storage")}
              </span>
            </div>

            <div className="h-[280px] w-full cursor-pointer">
              {mounted && defectsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={defectsByStage}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const payload = e.activePayload[0].payload
                        setChartDrillModal({
                          type: 'defects',
                          title: `${formatDual("Brak dalolatnomalari", "Акты о браке", "Defect Acts")} — ${payload.product}`,
                          subtitle: formatDual("Qabul, ishlab chiqarish va saqlash hujjatlari", "Документы по браку", "Underlying defect acts & roots"),
                          data: payload,
                        })
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="product"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${val}kg`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} kg`,
                        name === 'incomingKg'
                          ? formatDual("Qabul jarayonida", "При приеме", "Incoming")
                          : name === 'processingKg'
                            ? formatDual("Ishlov berishda", "В переработке", "Processing")
                            : formatDual("Ombor saqlashda", "При хранении", "Storage"),
                      ]}
                    />
                    <Bar dataKey="incomingKg" stackId="def" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="processingKg" stackId="def" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="storageKg" stackId="def" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Tanlangan davr uchun brak qaydlari mavjud emas", "Нет зарегистрированных актов о браке", "No defect records available")}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              {formatDual("Ustun ustiga bosing → rasmiy aktlar ro'yxati", "Кликните столбец → акты брака", "Click bar → defect acts")}
            </p>
          </div>

          {/* CHART 3: INVENTORY STOCK COVERAGE */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={16} className="text-emerald-500" />
                  {formatDual("3. Zaxiraning qoplash muddati", "3. Покрытие запасов сырья", "3. Inventory Stock Coverage")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Amaldagi qoldiq necha kunlik ishlab chiqarishga yetishi", "На сколько дней производства хватит остатка", "Days of usable inventory remaining")}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {formatDual("Kun hisobida", "В днях", "In days")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs mb-3 px-1">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {formatDual("Yetarli", "В норме", "Sufficient")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                {formatDual("Kam qolgan", "Мало", "Low")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                {formatDual("Ortiqcha saqlash", "Избыток", "Excess")}
              </span>
            </div>

            <div className="h-[280px] w-full cursor-pointer">
              {mounted && inventoryStockCoverage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={inventoryStockCoverage}
                    margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const payload = e.activePayload[0].payload
                        setChartDrillModal({
                          type: 'coverage',
                          title: `${formatDual("Zaxira qoplash muddati", "Покрытие запасов", "Stock Coverage")} — ${payload.name}`,
                          subtitle: formatDual("Kunlik sarf, qoldiq va me'yoriy saqlash muddatlari", "Расход, остаток и допустимый срок хранения", "Daily burn, stock & approved storage shelf life"),
                          data: payload,
                        })
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(val) => `${val} kun`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [
                        `${val !== null ? `${val} kun` : formatDual("Yetarli emas", "Недостаточно", "N/A")}`,
                        formatDual("Qoplash muddati", "Срок покрытия", "Stock coverage"),
                      ]}
                    />
                    <Bar dataKey="stockCoverageDays" radius={[0, 6, 6, 0]}>
                      {inventoryStockCoverage.map((entry: any, index: number) => {
                        const color =
                          entry.status === 'EXCESS'
                            ? '#8b5cf6'
                            : entry.status === 'LOW'
                              ? '#f59e0b'
                              : entry.status === 'OUT_OF_STOCK'
                                ? '#ef4444'
                                : '#10b981'
                        return <Cell key={`cov-cell-${index}`} fill={color} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Zaxira qoplash muddati hisob-kitobi uchun ma'lumot yo'q", "Нет данных для расчета запасов", "No stock coverage data")}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              {formatDual("Xomashyo ustiga bosing → ombor qoldig'i tahlili", "Кликните сырье → аудит запасов", "Click item → stock audit")}
            </p>
          </div>

          {/* CHART 4: SUPPLIER OUTSTANDING DEBT */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" />
                  {formatDual("4. Ta'minotchilar oldidagi qarz", "4. Задолженность поставщикам", "4. Supplier Outstanding Debt")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Rasmiy xomashyo qabul aktlari bo'yicha haqiqiy qarz", "Фактическая задолженность по официальным актам приемки", "Payables from verified incoming receiving acts")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  UZS
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs mb-3 px-1">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                {formatDual("Muddati yetmagan", "Срок не истек", "Not yet due")}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                {formatDual("Muddati o'tgan qarz", "Просроченная задолженность", "Overdue")}
              </span>
            </div>

            <div className="h-[280px] w-full cursor-pointer">
              {mounted && supplierDebts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={supplierDebts}
                    margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const payload = e.activePayload[0].payload
                        setChartDrillModal({
                          type: 'debt',
                          title: `${formatDual("Ta'minotchi qarz taqsimoti", "Детализация задолженности", "Supplier Debt Breakdown")} — ${payload.supplierName}`,
                          subtitle: formatDual("Invoyslar, qabul aktlari va to'lov muddatlari", "Акты приемки, инвойсы и сроки оплаты", "Verified receiving acts, invoices & due dates"),
                          data: payload,
                        })
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(val) =>
                        val >= 1000000000
                          ? `${(val / 1000000000).toFixed(1)} mlrd`
                          : val >= 1000000
                            ? `${(val / 1000000).toFixed(0)} mln`
                            : `${val}`
                      }
                    />
                    <YAxis
                      dataKey="supplierName"
                      type="category"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} UZS`,
                        name === 'notYetDueUzs'
                          ? formatDual("Muddati yetmagan", "В пределах срока", "Not yet due")
                          : formatDual("Muddati o'tgan", "Просрочено", "Overdue"),
                      ]}
                    />
                    <Bar dataKey="notYetDueUzs" stackId="debt" fill="#3b82f6" />
                    <Bar dataKey="overdueUzs" stackId="debt" fill="#ef4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Tasdiqlangan qarzlar jurnali topilmadi", "Нет данных о задолженности", "No debt records found")}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              {formatDual("Ta'minotchi ustiga bosing → 4 bosqichli burg'ulash", "Кликните поставщика → детальный аудит", "Click supplier → 4-level drill down")}
            </p>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* 4.9. DIRECT DEPARTMENT NAVIGATION PANELS */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {formatDual("Zavod bo'limlari", "Отделы завода", "Plant departments")}
            </h2>
            <p className="text-xs text-slate-500">
              {formatDual("Tizim modullariga tezkor o'tish", "Быстрый переход к модулям", "Quick access to plant modules")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Reports */}
          <Link
            href="/reports"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                {formatDual("Hisobotlar", "Отчеты", "Reports")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Tahlillar va Excel reyestr", "Аналитика и Excel реестр", "Analytics and Excel registry")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 2: Accounting / Finance */}
          <Link
            href="/accounting"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                {formatDual("Buxgalteriya", "Бухгалтерия", "Accounting")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Kassa, hisoblar va to'lovlar", "Касса, счета и платежи", "Cash, accounts and payments")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 6: Chat */}
          <Link
            href="/chat"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                {formatDual("Xodimlar Chati", "Чат сотрудников", "Staff Chat")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Ichki xabarlar va topshiriqlar", "Внутренний чат и задачи", "Internal chat and tasks")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 7: Settings */}
          <Link
            href="/settings"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                {formatDual("Sozlamalar", "Настройки", "Settings")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Rekvizitlar va tizim sozlamalari", "Реквизиты и настройки системы", "Company details & system settings")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 8: Warehouse */}
          <Link
            href="/warehouse"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                {formatDual("Omborxona (WMS)", "Склад (WMS)", "Warehouse (WMS)")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Qoldiqlar, partiyalar va transferlar", "Остатки, партии и перемещения", "Stock, batches and transfers")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>

          {/* Card 9: General Archive */}
          <Link
            href="/archive"
            className="group p-4 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Archive size={20} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                {formatDual("Umumiy Arxiv", "Общий архив", "Archive Feed")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {formatDual("Barcha zavod amaliyotlari lentasi", "Лента всех операций завода", "Plant operations timeline")}
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>{formatDual("Ochish", "Открыть", "Open")}</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        </div>
      </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DRILL-DOWN MODAL FOR DEPARTMENTS / AUDIT */}
      {/* ========================================================================= */}
      {mounted && activeModal && createPortal(
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh] overflow-hidden my-auto cursor-default"
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 flex-wrap gap-2 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeModal === 'operations'
                    ? operationsTab === 'prixod' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                      operationsTab === 'rasxod' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' :
                      operationsTab === 'brak' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' :
                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {activeModal === 'warehouse' && <Package size={20} />}
                  {activeModal === 'production' && <ChefHat size={20} />}
                  {activeModal === 'arrivals' && <Truck size={20} />}
                  {activeModal === 'employees' && <Users size={20} />}
                  {activeModal === 'surveys' && <Award size={20} />}
                  {activeModal === 'alerts' && <AlertTriangle size={20} />}
                  {activeModal === 'archive' && <Archive size={20} />}
                  {activeModal === 'operations' && (
                    operationsTab === 'prixod' ? <Truck size={20} /> :
                    operationsTab === 'rasxod' ? <ChefHat size={20} /> :
                    operationsTab === 'brak' ? <AlertTriangle size={20} /> : <Package size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeModal === 'warehouse' && formatDual("Ombor zaxirasi", "Складские остатки", "Warehouse stock")}
                    {activeModal === 'production' && formatDual("Ishlab chiqarish", "Производство", "Production")}
                    {activeModal === 'arrivals' && formatDual("Xomashyo qabuli", "Прием сырья", "Raw arrivals")}
                    {activeModal === 'employees' && formatDual("Xodimlar faoliyati", "Деятельность отделов", "Department activities")}
                    {activeModal === 'surveys' && formatDual("Mijozlar so'rovnomalari", "Опросы клиентов", "Customer surveys")}
                    {activeModal === 'alerts' && formatDual("Shubhali holatlar", "Аномалии", "Discrepancies & alerts")}
                    {activeModal === 'archive' && formatDual("Umumiy Arxiv", "Общий архив", "Global Archive")}
                    {activeModal === 'operations' && (
                      operationsTab === 'prixod' ? formatDual("Kirim zanjiri", "Журнал прихода", "Inbound Journal") :
                      operationsTab === 'rasxod' ? formatDual("Chiqim zanjiri", "Журнал расхода", "Consumption Records") :
                      operationsTab === 'brak' ? formatDual("Brak va chiqindi zanjiri", "Журнал брака", "Defect Records") :
                      formatDual("Omborxona zanjiri", "Складские остатки", "Warehouse Stock")
                    )}
                  </h3>
                  {(activeModal === 'employees' || activeModal === 'operations') && (
                    <p className="text-xs text-slate-500">
                      {activeModal === 'employees'
                        ? formatDual("5 ta asosiy bo'lim faoliyati va kunlik, haftalik hamda oylik qilingan ishlar nazorati", "Контроль деятельности 5 ключевых отделов, ежедневных, еженедельных и ежемесячных задач", "Monitoring of 5 core departments and daily, weekly, and monthly completed tasks")
                        : operationsTab === 'prixod'
                        ? formatDual("Ombor va sexlarga xomashyo qabuli", "Прием сырья и материалов на склад и в цеха", "Inbound arrivals and materials")
                        : operationsTab === 'rasxod'
                        ? formatDual("Sexlarga xomashyo chiqimi va sarfi", "Расход сырья по цехам", "Material consumption")
                        : operationsTab === 'brak'
                        ? formatDual("Brak va texnologik chiqindi dalolatnomalari", "Акты брака и отходов", "Defect and scrap records")
                        : formatDual("Ombordagi barcha xomashyo va taralar qoldig'i tahlili", "Анализ остатков сырья и тары на складе", "Warehouse material and packaging stock analysis")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
                  />
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedEmployee(null)
                    setSelectedOperationItem(null)
                    setSearchQuery('')
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-800 dark:text-slate-200">
              {/* SECTION: WAREHOUSE */}
              {activeModal === 'warehouse' && (() => {
                const warehousePageSize = 10
                const totalWarehousePages = Math.ceil(filteredProducts.length / warehousePageSize) || 1
                const currentWarehousePage = Math.min(Math.max(1, warehouseStockPage), totalWarehousePages)
                const pagedWarehouseProducts = filteredProducts.slice(
                  (currentWarehousePage - 1) * warehousePageSize,
                  currentWarehousePage * warehousePageSize
                )

                return (
                  <div className="space-y-6">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{formatDual("Mahsulotlar qoldig'i (Svetofor)", "Остатки продукции (Светофор)", "Stock balances (Traffic light)")}:</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                            {filteredProducts.length} {formatDual("ta mahsulot", "товаров", "items")}
                          </span>
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDual(
                            `${(currentWarehousePage - 1) * warehousePageSize + 1}–${Math.min(currentWarehousePage * warehousePageSize, filteredProducts.length)} tasi ko'rsatilmoqda (10 tadan)`,
                            `Показано ${(currentWarehousePage - 1) * warehousePageSize + 1}–${Math.min(currentWarehousePage * warehousePageSize, filteredProducts.length)} (по 10)`,
                            `Showing ${(currentWarehousePage - 1) * warehousePageSize + 1}–${Math.min(currentWarehousePage * warehousePageSize, filteredProducts.length)} (10 per page)`
                          )}
                        </span>
                      </div>
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-x-auto shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-3">{formatDual("Mahsulot nomi", "Наименование", "Product name")}</th>
                              <th className="p-3 text-center">{formatDual("Hozirgi qoldiq", "Остаток", "Current stock")}</th>
                              <th className="p-3 text-center">{formatDual("Maks. saqlash muddati", "Макс. срок хран.", "Max storage")}</th>
                              <th className="p-3 text-center">{formatDual("Kunlik o'rtacha sarf", "Ср. дневной расход", "Avg daily use")}</th>
                              <th className="p-3 text-center">{formatDual("Maks. tavsiya zaxira", "Макс. рек. запас", "Max rec. stock")}</th>
                              <th className="p-3 text-center">{formatDual("Qoplash muddati", "Покрытие запаса", "Stock coverage")}</th>
                              <th className="p-3 text-center">{formatDual("Holati", "Статус", "Status")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                            {pagedWarehouseProducts.map((p: any, idx: number) => (
                              <tr key={`prod-stock-${p.id || idx}-${p.name || idx}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                                <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                                <td className="p-3 text-center font-bold font-mono">{p.currentStock} {p.unit}</td>
                                <td className="p-3 text-center text-slate-500 text-xs">
                                  {p.approvedMaxStorageDays ? (
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{p.approvedMaxStorageDays} kun</span>
                                  ) : p.unit === 'dona' || p.unit === 'litr' || p.isNonPerishable || /kimyo|tara|qadoq|dezinfek/i.test(p.category || '') || /вода|хлор|уксус|кислот|сорбат|бензоат|соль|туз|divosan|suma|пакет|каробк|коробк|перчатк|бахил|шапка|халат/i.test(p.name || '') ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-400">
                                      {formatDual("Uzoq muddatli (Tara/Kimyo)", "Долгосрочный (Тара/Химия)", "Long-term (Pkg/Chem)")}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-400">
                                      {formatDual("Standart 30 kun", "Стандарт 30 дней", "Standard 30 days")}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                  {p.avgDailyConsumptionKg ? `${p.avgDailyConsumptionKg} ${p.unit}/kun` : '—'}
                                </td>
                                <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400">
                                  {p.maxRecommendedStockKg ? `${p.maxRecommendedStockKg} ${p.unit}` : '—'}
                                </td>
                                <td className="p-3 text-center font-mono">
                                  {p.stockCoverageDays != null ? (
                                    `${p.stockCoverageDays} kun (${p.stockCoverageWeeks ?? '-'} hafta)`
                                  ) : (p.isNonPerishable || p.unit === 'dona' || p.unit === 'litr') && p.currentStock > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatDual("Zaxira yetarli", "Запас достаточный", "Sufficient")}</span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                    p.status === 'SUFFICIENT' ? 'bg-emerald-100 text-emerald-800' :
                                    p.status === 'EXCESS' ? 'bg-purple-100 text-purple-800' :
                                    p.status === 'LOW' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {p.status === 'SUFFICIENT' ? '🟢 Yetarli' :
                                     p.status === 'EXCESS' ? '🟣 Ortiqcha (Me’yordan ko‘p)' :
                                     p.status === 'LOW' ? '🟡 Kam qolgan' : '🔴 Tugagan'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* WAREHOUSE PAGINATION CONTROLS (10 tadan sahifalash) */}
                      {totalWarehousePages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-dark-700 mt-3">
                          <div className="text-xs text-slate-500 font-medium">
                            {formatDual(
                              `Sahifa ${currentWarehousePage} / ${totalWarehousePages} (har safar 10 tadan)`,
                              `Страница ${currentWarehousePage} из ${totalWarehousePages} (по 10 на страницу)`,
                              `Page ${currentWarehousePage} of ${totalWarehousePages} (10 per page)`
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              disabled={currentWarehousePage <= 1}
                              onClick={() => setWarehouseStockPage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <ChevronLeft size={14} />
                              <span>{formatDual("Oldingi 10 ta", "Назад", "Prev 10")}</span>
                            </button>

                            {Array.from({ length: totalWarehousePages }, (_, i) => i + 1)
                              .filter((page) => page === 1 || page === totalWarehousePages || Math.abs(page - currentWarehousePage) <= 2)
                              .reduce<(number | string)[]>((acc, page, idx, arr) => {
                                if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...')
                                acc.push(page)
                                return acc
                              }, [])
                              .map((item, pIdx) =>
                                item === '...' ? (
                                  <span key={`wh-ellipsis-${pIdx}`} className="px-2 py-1 text-slate-400 text-xs">...</span>
                                ) : (
                                  <button
                                    key={`wh-page-${item}`}
                                    onClick={() => setWarehouseStockPage(item as number)}
                                    className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                      item === currentWarehousePage
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                )
                              )}

                            <button
                              disabled={currentWarehousePage >= totalWarehousePages}
                              onClick={() => setWarehouseStockPage((p) => Math.min(totalWarehousePages, p + 1))}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <span>{formatDual("Keyingi 10 ta", "Вперед", "Next 10")}</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                        {formatDual("Ombor transferlari", "Складские перемещения", "Warehouse transfers")}:
                      </h4>
                      {filteredTransfers.length === 0 ? (
                        <p className="text-slate-400 italic p-4 text-center">{formatDual("Transferlar yozuvi topilmadi", "Записи перемещений не найдены", "No transfer records found")}</p>
                      ) : (
                        <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-x-auto shadow-sm">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                              <tr>
                                <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                                <th className="p-3">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                                <th className="p-3">{formatDual("Kim chiqardi", "Отпустил", "Issued by")}</th>
                                <th className="p-3">{formatDual("Kim qabul qildi", "Принял", "Received by")}</th>
                                <th className="p-3 text-center">{formatDual("Chiqarilgan", "Отпущено", "Issued")}</th>
                                <th className="p-3 text-center">{formatDual("Qabul", "Принято", "Received")}</th>
                                <th className="p-3 text-center">{formatDual("Farq", "Разница", "Discrepancy")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                              {filteredTransfers.map((tr: any) => (
                                <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                                  <td className="p-3 text-slate-500 whitespace-nowrap text-xs font-mono">{formatCleanDate(tr.createdAt)}</td>
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{tr.product?.name || "-"}</td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300">{tr.issuedByName || "-"}</td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300">{tr.receivedByName || "-"}</td>
                                  <td className="p-3 text-center font-mono">{tr.quantityRequested} {tr.product?.unit || 'kg'}</td>
                                  <td className="p-3 text-center font-mono">{tr.quantityReceived || "-"} {tr.product?.unit || 'kg'}</td>
                                  <td className="p-3 text-center font-mono">
                                    {tr.quantityDifference ? (
                                      <span className={tr.quantityDifference < 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                                        {tr.quantityDifference}
                                      </span>
                                    ) : "-"}
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
              })()}

              {/* SECTION: PRODUCTION (SMENA HISOBOTLARI VA QC CHEKLISTLAR) */}
              {activeModal === 'production' && (
                <div className="space-y-4">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {formatDual("Jami smenalar hisoboti", "Отчеты смен", "Total Shift Reports")}
                      </span>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {filteredChecklists.length} {formatDual("ta smena", "смен", "shifts")}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        {formatDual("Jami tayyor mahsulot", "Готовая продукция", "Total Finished Output")}
                      </span>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {filteredChecklists.reduce((sum: number, c: any) => sum + (c.totalOutputBox || 0), 0).toLocaleString()} {formatDual("quti", "кор.", "boxes")}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
                          ({(filteredChecklists.reduce((sum: number, c: any) => sum + (c.totalOutputKg || (c.totalOutputBox ? c.totalOutputBox * 5 : 0)), 0)).toLocaleString()} kg)
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                        {formatDual("Chiqindi va brak", "Брак и отходы", "Rejection & Scrap")}
                      </span>
                      <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                        {filteredChecklists.reduce((sum: number, c: any) => sum + (c.rejectedKg || 0), 0).toFixed(1)} kg
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatDual("Smena hisobotlari va QC cheklistlar ro'yxati", "Список отчетов смен и чеклистов QC", "Shift Reports & QC Checklists List")}:
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {filteredChecklists.length} {formatDual("ta hisobot", "отчетов", "records")}
                    </span>
                  </div>

                  {filteredChecklists.length === 0 ? (
                    <p className="text-slate-400 italic p-8 text-center bg-slate-50 dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700">
                      {formatDual("Cheklistlar topilmadi", "Чек-листы не найдены", "No checklists found")}
                    </p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-x-auto shadow-sm bg-white dark:bg-dark-900">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="p-3.5">{formatDual("Sana", "Дата", "Date")}</th>
                            <th className="p-3.5 text-center">{formatDual("Smena", "Смена", "Shift")}</th>
                            <th className="p-3.5">{formatDual("Liniya / Sex", "Линия", "Line")}</th>
                            <th className="p-3.5">{formatDual("Smena ustasi", "Мастер смены", "Supervisor")}</th>
                            <th className="p-3.5">{formatDual("QC Nazoratchi", "Инспектор", "Inspector")}</th>
                            <th className="p-3.5">{formatDual("Partiya №", "Партия №", "Batch #")}</th>
                            <th className="p-3.5 text-center">{formatDual("Chiqish (quti)", "Выпуск (кор.)", "Output (box)")}</th>
                            <th className="p-3.5 text-center">{formatDual("Chiqish (kg)", "Выпуск (кг)", "Output (kg)")}</th>
                            <th className="p-3.5 text-center">{formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredChecklists.map((c: any, idx: number) => (
                            <tr
                              key={`chk-${c.id || idx}-${idx}`}
                              onClick={() => setSelectedChecklist(selectedChecklist?.id === c.id ? null : c)}
                              className={`cursor-pointer transition-colors ${
                                selectedChecklist?.id === c.id
                                  ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/20'
                                  : 'hover:bg-slate-50/80 dark:hover:bg-dark-800/60'
                              }`}
                            >
                              <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{c.date}</td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  c.shift === '1' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                }`}>
                                  {c.shift}-{formatDual("smena", "смена", "shift")}
                                </span>
                              </td>
                              <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{c.lineName || "1-Liniya"}</td>
                              <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">{c.supervisor || "-"}</td>
                              <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-bold">{c.inspector || c.user?.name || "-"}</td>
                              <td className="p-3.5 text-slate-500 font-mono text-[11px]">{c.batchNumber || "-"}</td>
                              <td className="p-3.5 text-center font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                {(c.totalOutputBox || 0).toLocaleString()}
                              </td>
                              <td className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                                {((c.totalOutputKg || (c.totalOutputBox ? Math.round(c.totalOutputBox * 5) : 0)) || 0).toLocaleString()} kg
                              </td>
                              <td className={`p-3.5 text-center font-bold font-mono ${
                                (c.rejectedKg || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                              }`}>
                                {c.rejectedKg ? `${c.rejectedKg} kg` : "0 kg"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Selected Checklist Detail View */}
                  {selectedChecklist && (
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-dark-800 border border-blue-200 dark:border-dark-700 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-200/50 dark:border-dark-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {formatDual("QC Smena tekshiruv dalolatnomasi", "Детали чеклиста смены", "QC Shift Inspection Detail")}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            #{selectedChecklist.batchNumber || selectedChecklist.id}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedChecklist(null)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          ✕ {formatDual("Yopish", "Закрыть", "Close")}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
                          <span className="text-[10px] font-bold text-slate-400 block">{formatDual("Sana va smena", "Дата и смена", "Date & Shift")}</span>
                          <b className="text-slate-800 dark:text-slate-200">{selectedChecklist.date} ({selectedChecklist.shift}-smena)</b>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
                          <span className="text-[10px] font-bold text-slate-400 block">{formatDual("Liniya", "Линия", "Line")}</span>
                          <b className="text-slate-800 dark:text-slate-200">{selectedChecklist.lineName}</b>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
                          <span className="text-[10px] font-bold text-slate-400 block">{formatDual("Smena ustasi", "Мастер", "Supervisor")}</span>
                          <b className="text-slate-800 dark:text-slate-200">{selectedChecklist.supervisor}</b>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750">
                          <span className="text-[10px] font-bold text-slate-400 block">{formatDual("QC Nazoratchi", "Инспектор", "Inspector")}</span>
                          <b className="text-indigo-600 dark:text-indigo-400">{selectedChecklist.inspector || selectedChecklist.user?.name}</b>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-750 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                          {formatDual("Nazorat ko'rsatkichlari (Ma'lumotlar bazasidagi haqiqiy yozuv)", "Параметры контроля (Фактическая запись БД)", "Recorded QC Checklist Data")}
                        </span>
                        {(() => {
                          try {
                            const parsed = selectedChecklist.formData ? JSON.parse(selectedChecklist.formData) : null
                            if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
                              return (
                                <div className="text-[11px] text-slate-400 italic">
                                  {formatDual("Qo'shimcha parametrlar kiritilmagan", "Дополнительные параметры не указаны", "No extra parameters recorded")}
                                </div>
                              )
                            }
                            return (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                                {Object.entries(parsed).slice(0, 9).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="truncate">{k}: <b>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</b></span>
                                  </div>
                                ))}
                              </div>
                            )
                          } catch {
                            return (
                              <div className="text-[11px] text-slate-500">
                                {String(selectedChecklist.formData || '')}
                              </div>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: ARRIVALS */}
              {activeModal === 'arrivals' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{formatDual("Xomashyo qabuli aktlari", "Акты приема сырья", "Raw arrivals acts")}:</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                          {filteredInspections.length} {formatDual("ta qabul", "приемок", "arrivals")}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDual(
                          "Barcha qabul qilingan xomashyo partiyalari va rasmiy kirim hujjatlari",
                          "Все принятые партии сырья и официальные документы прихода",
                          "All accepted raw material batches and inbound acts"
                        )}
                      </p>
                    </div>
                    {filteredInspections.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDual(
                          `${(currentArrivalsPage - 1) * arrivalsPageSize + 1}-${Math.min(currentArrivalsPage * arrivalsPageSize, filteredInspections.length)} tasi ko'rsatilmoqda (10 tadan)`,
                          `Показано ${(currentArrivalsPage - 1) * arrivalsPageSize + 1}-${Math.min(currentArrivalsPage * arrivalsPageSize, filteredInspections.length)} (по 10)`,
                          `Showing ${(currentArrivalsPage - 1) * arrivalsPageSize + 1}-${Math.min(currentArrivalsPage * arrivalsPageSize, filteredInspections.length)} (10 per page)`
                        )}
                      </span>
                    )}
                  </div>

                  {filteredInspections.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">{formatDual("Qabul yozuvlari topilmadi", "Записи приемок не найдены", "No arrival records found")}</p>
                  ) : (
                    <>
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-x-auto shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                              <th className="p-3">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                              <th className="p-3">{formatDual("Ta'minotchi", "Поставщик", "Supplier")}</th>
                              <th className="p-3">{formatDual("Tekshiruvchi", "Проверил", "Inspector")}</th>
                              <th className="p-3 text-center">{formatDual("Miqdor", "Кол-во", "Quantity")}</th>
                              <th className="p-3 text-center">{formatDual("Partiya", "Партия", "Batch")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                            {pagedArrivals.map((insp: any, idx: number) => {
                              const isDona = /dona|пакет|каробк|коробк|перчатк|салфетк|полотенц|бумага|халат|маска|шапка/i.test(insp.nomenclature || insp.product?.name || '')
                              return (
                                <tr key={`insp-${insp.id || idx}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/50 transition-colors">
                                  <td className="p-3 text-slate-500 whitespace-nowrap text-xs font-mono">{formatCleanDate(insp.date || insp.rawDate || insp.createdAt)}</td>
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    <span>{insp.nomenclature || insp.product || formatDual("Xomashyo", "Сырье", "Raw material")}</span>
                                  </td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300 text-xs">{insp.supplier || "-"}</td>
                                  <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold text-xs">{insp.inspectorName || formatDual("Nazoratchi", "Инспектор", "Inspector")}</td>
                                  <td className="p-3 text-center font-black text-slate-900 dark:text-white text-xs whitespace-nowrap">
                                    {typeof insp.quantity === 'number' ? insp.quantity.toLocaleString() : insp.quantity} {insp.unit || (isDona ? 'dona' : 'kg')}
                                  </td>
                                  <td className="p-3 text-center font-mono">
                                    {insp.batch && insp.batch !== '-' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {String(insp.batch).startsWith('#') || String(insp.batch).toLowerCase().startsWith('partiya')
                                          ? insp.batch
                                          : `Partiya #${insp.batch}`}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-dark-800">
                                        {formatDual("Partiya yozilmagan", "Без партии", "No batch")}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ARRIVALS PAGINATION CONTROLS (10 tadan sahifalash) */}
                      {totalArrivalsPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-dark-700 mt-3">
                          <div className="text-xs text-slate-500 font-medium">
                            {formatDual(
                              `Sahifa ${currentArrivalsPage} / ${totalArrivalsPages} (har safar 10 tadan)`,
                              `Страница ${currentArrivalsPage} из ${totalArrivalsPages} (по 10 на страницу)`,
                              `Page ${currentArrivalsPage} of ${totalArrivalsPages} (10 per page)`
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              disabled={currentArrivalsPage <= 1}
                              onClick={() => setArrivalsPage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <ChevronLeft size={14} />
                              <span>{formatDual("Oldingi 10 ta", "Назад", "Prev 10")}</span>
                            </button>

                            {Array.from({ length: totalArrivalsPages }, (_, i) => i + 1)
                              .filter((page) => page === 1 || page === totalArrivalsPages || Math.abs(page - currentArrivalsPage) <= 2)
                              .reduce<(number | string)[]>((acc, page, idx, arr) => {
                                if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...')
                                acc.push(page)
                                return acc
                              }, [])
                              .map((item, pIdx) =>
                                item === '...' ? (
                                  <span key={`arr-ellipsis-${pIdx}`} className="px-2 py-1 text-slate-400 text-xs">...</span>
                                ) : (
                                  <button
                                    key={`arr-page-${item}`}
                                    onClick={() => setArrivalsPage(item as number)}
                                    className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                      item === currentArrivalsPage
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                )
                              )}

                            <button
                              disabled={currentArrivalsPage >= totalArrivalsPages}
                              onClick={() => setArrivalsPage((p) => Math.min(totalArrivalsPages, p + 1))}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <span>{formatDual("Keyingi 10 ta", "Вперед", "Next 10")}</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* SECTION: XODIMLAR FAOLIYATI (5 TA ASOSIY BO'LIM VA KUNLIK/HAFTALIK/OYLIK DRILL-DOWN) */}
              {activeModal === 'employees' && (
                <div className="space-y-6">
                  {selectedDepartment ? (
                    <div>
                      {/* DEPARTMENT DRILL-DOWN VIEW */}
                      {(() => {
                        const currentDept = departmentsList.find((d) => d.id === selectedDepartment) || departmentsList[0]
                        const allDeptActions = departmentActionsMap[selectedDepartment] || []
                        const todayActions = filterActionsByPeriod(allDeptActions, 'today')
                        const weekActions = filterActionsByPeriod(allDeptActions, 'week')
                        const monthActions = filterActionsByPeriod(allDeptActions, 'month')
                        const activeDeptActions = filterActionsByPeriod(allDeptActions, deptPeriodFilter)
                        const DeptIcon = currentDept.icon

                        // Filter by search query if any
                        const searchedDeptActions = !searchQuery
                          ? activeDeptActions
                          : activeDeptActions.filter(
                              (act: any) =>
                                act.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                act.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                act.user?.toLowerCase().includes(searchQuery.toLowerCase())
                            )

                        const pageSize = 10
                        const totalPages = Math.max(1, Math.ceil(searchedDeptActions.length / pageSize))
                        const currentPage = Math.min(Math.max(1, deptActionsPage), totalPages)
                        const pagedActions = searchedDeptActions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

                        return (
                          <div className="space-y-5">
                            {/* Top Navigation & Department Title */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-dark-700">
                              <div>
                                <button
                                  onClick={() => {
                                    setSelectedDepartment(null)
                                    setDeptActionsPage(1)
                                  }}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-2 flex items-center gap-1.5 transition-transform hover:-translate-x-0.5 cursor-pointer"
                                >
                                  &larr; {formatDual("Barcha 5 ta bo'limga qaytish", "Назад ко всем 5 отделам", "Back to all 5 departments")}
                                </button>
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-2xl ${currentDept.badgeClass} flex items-center justify-center font-bold shadow-sm`}>
                                    <DeptIcon size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                      <span>{currentDept.name}</span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
                                        {currentDept.role}
                                      </span>
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {formatDual("Mas'ul:", "Ответственный:", "Responsible:")} <b className="text-slate-700 dark:text-slate-300">{currentDept.responsible}</b> • {currentDept.description}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="text-left sm:text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  {formatDual("Jami qilingan ishlar", "Всего задач", "Total completed tasks")}
                                </span>
                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                  {allDeptActions.length} <span className="text-xs font-semibold text-slate-400">{formatDual("ta", "дел", "tasks")}</span>
                                </span>
                              </div>
                            </div>

                            {/* PERIOD SELECTOR TABS (Bugun / Shu hafta / Shu oy / Barchasi) */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700">
                                {[
                                  {
                                    id: 'today' as const,
                                    label: formatDual("Bugun (Kunlik nazorat)", "Сегодня (Дневной контроль)", "Today (Daily)"),
                                    count: todayActions.length,
                                  },
                                  {
                                    id: 'week' as const,
                                    label: formatDual("Shu hafta (Haftalik nazorat)", "Эта неделя (Недельный контроль)", "This week (Weekly)"),
                                    count: weekActions.length,
                                  },
                                  {
                                    id: 'month' as const,
                                    label: formatDual("Shu oy (Oylik nazorat)", "Этот месяц (Месячный контроль)", "This month (Monthly)"),
                                    count: monthActions.length,
                                  },
                                  {
                                    id: 'all' as const,
                                    label: formatDual("Barcha davr", "Весь период", "All time"),
                                    count: allDeptActions.length,
                                  },
                                ].map((tab) => (
                                  <button
                                    key={tab.id}
                                    onClick={() => {
                                      setDeptPeriodFilter(tab.id)
                                      setDeptActionsPage(1)
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      deptPeriodFilter === tab.id
                                        ? 'bg-white dark:bg-dark-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-dark-700'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <span>{tab.label}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        deptPeriodFilter === tab.id
                                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300'
                                          : 'bg-slate-200 dark:bg-dark-700 text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      {tab.count}
                                    </span>
                                  </button>
                                ))}
                              </div>

                              <span className="text-xs text-slate-400 font-medium">
                                {deptPeriodFilter === 'today' && formatDual("Kun davomida bajarilgan amallar ro'yxati", "Задачи, выполненные в течение дня", "Tasks completed during the day")}
                                {deptPeriodFilter === 'week' && formatDual("Oxirgi 7 kunlik ishlar monitoringi", "Мониторинг за последние 7 дней", "Past 7 days task monitoring")}
                                {deptPeriodFilter === 'month' && formatDual("Oxirgi 30 kunlik ishlar nazorati", "Контроль за последние 30 дней", "Past 30 days task control")}
                                {deptPeriodFilter === 'all' && formatDual("Tizimdagi barcha rasmiy qaydlar", "Все официальные записи", "All official records")}
                              </span>
                            </div>

                            {/* Completed Actions List */}
                            {searchedDeptActions.length === 0 ? (
                              <div className="bg-slate-50 dark:bg-dark-800 p-8 rounded-3xl border border-slate-200 dark:border-dark-700 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200/60 dark:bg-dark-700 text-slate-400 mx-auto flex items-center justify-center">
                                  <Clock size={24} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  {deptPeriodFilter === 'today'
                                    ? formatDual("Bugun ushbu bo'lim tomonidan yangi amallar qayd etilmadi", "Сегодня этим отделом новых задач не выполнялось", "No actions recorded for this department today")
                                    : formatDual("Tanlangan davrda ushbu bo'lim tomonidan amallar topilmadi", "За выбранный период действий не найдено", "No actions found for selected period")}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatDual("Haftalik yoki oylik nazoratga o'tish uchun quyidagi tugmalardan birini tanlang:", "Для просмотра других периодов нажмите:", "Switch to other periods below:")}
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      setDeptPeriodFilter('week')
                                      setDeptActionsPage(1)
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                                  >
                                    {formatDual("Haftalik nazorat", "Недельный контроль", "Weekly control")} ({weekActions.length})
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeptPeriodFilter('month')
                                      setDeptActionsPage(1)
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                                  >
                                    {formatDual("Oylik nazorat", "Месячный контроль", "Monthly control")} ({monthActions.length})
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeptPeriodFilter('all')
                                      setDeptActionsPage(1)
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                                  >
                                    {formatDual("Barcha amallar", "Все действия", "All actions")} ({allDeptActions.length})
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Item count and page indicator */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
                                  <span>
                                    {formatDual("Jami amallar:", "Всего задач:", "Total tasks:")}{' '}
                                    <b className="text-slate-800 dark:text-slate-200 font-bold">{searchedDeptActions.length} ta</b>
                                    {' • '}
                                    {formatDual(
                                      `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, searchedDeptActions.length)} tasi ko'rsatilmoqda (10 tadan)`,
                                      `Показано ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, searchedDeptActions.length)} (по 10)`,
                                      `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, searchedDeptActions.length)} (10 per page)`
                                    )}
                                  </span>
                                  {totalPages > 1 && (
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                      {formatDual(`Sahifa ${currentPage} / ${totalPages}`, `Стр. ${currentPage} из ${totalPages}`, `Page ${currentPage} of ${totalPages}`)}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-2.5">
                                  {pagedActions.map((act: any, idx: number) => (
                                    <div
                                      key={act.id || idx}
                                      onClick={() => setSelectedAuditAction(act)}
                                      className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-4 group"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${act.badge}`}>
                                            {act.type}
                                          </span>
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 font-mono">
                                            <Clock size={12} />
                                            {formatCleanDate(act.dateStr || act.rawData?.actDate || act.date || act.rawData?.createdAt)}
                                          </span>
                                          {act.user && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300">
                                              {act.user}
                                            </span>
                                          )}
                                        </div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                          {act.details}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform">
                                        <span className="hidden sm:inline">{formatDual("Barcha ma'lumotlar", "Все данные", "Full details")}</span>
                                        <ChevronRight size={18} />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* PAGINATION CONTROLS (10 tadan sahifalash) */}
                                {totalPages > 1 && (
                                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-dark-700">
                                    <div className="text-xs text-slate-500 font-medium">
                                      {formatDual(
                                        `Sahifa ${currentPage} / ${totalPages} (har safar 10 tadan)`,
                                        `Страница ${currentPage} из ${totalPages} (по 10 на страницу)`,
                                        `Page ${currentPage} of ${totalPages} (10 per page)`
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        disabled={currentPage <= 1}
                                        onClick={() => setDeptActionsPage((p) => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                      >
                                        <ChevronLeft size={14} />
                                        <span>{formatDual("Oldingi 10 ta", "Назад", "Prev 10")}</span>
                                      </button>

                                      {/* Page number buttons with smart ellipsis */}
                                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                                        .reduce((acc: (number | string)[], page, idx, arr) => {
                                          if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...')
                                          acc.push(page)
                                          return acc
                                        }, [])
                                        .map((item, pIdx) =>
                                          item === '...' ? (
                                            <span key={`dots-${pIdx}`} className="px-1 text-xs text-slate-400 font-bold">...</span>
                                          ) : (
                                            <button
                                              key={`dept-page-${item}`}
                                              onClick={() => setDeptActionsPage(item as number)}
                                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                                currentPage === item
                                                  ? 'bg-indigo-600 text-white font-black'
                                                  : 'border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-750'
                                              }`}
                                            >
                                              {item}
                                            </button>
                                          )
                                        )}

                                      <button
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setDeptActionsPage((p) => Math.min(totalPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                      >
                                        <span>{formatDual("Keyingi 10 ta", "Вперед", "Next 10")}</span>
                                        <ChevronRight size={14} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div>
                      {/* 5 CORE DEPARTMENTS OVERVIEW */}
                      <div className="mb-4">
                        <h4 className="font-black text-base text-slate-900 dark:text-white">
                          {formatDual("Asosiy 5 ta bo'lim faoliyati", "Деятельность 5 ключевых отделов", "5 Core Department Activities")}:
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDual(
                            "Bo'lim ustiga bosib, kun davomida nima qilgani hamda haftalik va oylik nazoratiga kiring (Drill-down)",
                            "Нажмите на отдел, чтобы увидеть выполненные задачи за день, неделю и месяц (Drill-down)",
                            "Click on any department to inspect tasks completed today, this week, and this month (Drill-down)"
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departmentsList.map((dept) => {
                          const DeptIcon = dept.icon
                          const allDeptActions = departmentActionsMap[dept.id] || []
                          const todayActions = filterActionsByPeriod(allDeptActions, 'today')
                          const weekActions = filterActionsByPeriod(allDeptActions, 'week')
                          const monthActions = filterActionsByPeriod(allDeptActions, 'month')
                          const latestAction = allDeptActions[0]

                          return (
                            <div
                              key={dept.id}
                              onClick={() => {
                                setSelectedDepartment(dept.id)
                                setDeptPeriodFilter('today')
                              }}
                              className={`bg-slate-50 dark:bg-dark-800 p-5 rounded-3xl border border-slate-200 dark:border-dark-700 ${dept.accentBg} hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-2xl ${dept.badgeClass} flex items-center justify-center font-bold shadow-xs`}>
                                      <DeptIcon size={22} />
                                    </div>
                                    <div>
                                      <h5 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                        {dept.name}
                                      </h5>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {dept.responsible}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-dark-700 text-slate-700 dark:text-slate-300">
                                    {dept.role}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-3">
                                  {dept.description}
                                </p>

                                {/* QILINGAN ISHLAR (REPLACED CHEKLIST) */}
                                <div className="p-3.5 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200/80 dark:border-dark-750">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    {formatDual("Qilingan ishlar", "Выполненные задачи", "Completed tasks")}
                                  </span>
                                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1.5">
                                    <span>{allDeptActions.length}</span>
                                    <span className="text-xs font-semibold text-slate-400">{formatDual("ta amal", "действий", "actions")}</span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800 text-[10px]">
                                    <div className="bg-slate-50 dark:bg-dark-800/80 p-1.5 rounded-lg text-center">
                                      <span className="text-slate-400 block font-medium">{formatDual("Bugun:", "Сегодня:", "Today:")}</span>
                                      <b className={todayActions.length > 0 ? "text-indigo-600 font-black text-xs" : "text-slate-600 dark:text-slate-400"}>
                                        {todayActions.length}
                                      </b>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-dark-800/80 p-1.5 rounded-lg text-center">
                                      <span className="text-slate-400 block font-medium">{formatDual("Hafta:", "Неделя:", "Week:")}</span>
                                      <b className="text-slate-800 dark:text-slate-200 text-xs">
                                        {weekActions.length}
                                      </b>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-dark-800/80 p-1.5 rounded-lg text-center">
                                      <span className="text-slate-400 block font-medium">{formatDual("Oy:", "Месяц:", "Month:")}</span>
                                      <b className="text-slate-800 dark:text-slate-200 text-xs">
                                        {monthActions.length}
                                      </b>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-dark-700 flex items-center justify-between text-xs">
                                <span className="text-slate-400 text-[11px] truncate max-w-[170px]">
                                  {latestAction?.date
                                    ? `${formatDual("Oxirgi:", "Посл.:", "Last:")} ${formatCleanDate(latestAction.date, true)}`
                                    : formatDual("Amal yo'q", "Нет записей", "No entries")}
                                </span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  {formatDual("Ko'rish", "Открыть", "Inspect")} &rarr;
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: ALERTS */}
              {activeModal === 'alerts' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    {formatDual("Shubhali holatlar ro'yxati", "Список аномалий", "Discrepancies list")}:
                  </h4>
                  {alerts.length === 0 ? (
                    <div className="text-center py-10 text-emerald-600 font-bold">
                      <CheckCircle2 size={32} className="mx-auto mb-2" />
                      Hech qanday shubhali holat aniqlanmadi. Barcha parametrlar norma doirasida.
                    </div>
                  ) : (
                    alerts.map((al, idx) => (
                      <div
                        key={`alert-${al.id || idx}-${idx}`}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                            al.type === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {al.section} &bull; {al.type}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(al.date).toLocaleString(dateLocale)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {al.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {al.description}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-dark-700 text-[11px]">
                          <span className="text-slate-500">
                            Mas'ul shaxs: <b className="text-slate-800 dark:text-slate-200">{al.responsiblePerson}</b>
                          </span>
                          <span className="text-amber-600 font-bold">
                            Amalda: {al.value} (Mezon chegarasi: {al.threshold})
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SECTION: SURVEYS */}
              {activeModal === 'surveys' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    {formatDual("Mijozlar so'rovnomalari natijalari", "Результаты опросов клиентов", "Customer survey results")}:
                  </h4>
                  {(details.recentSurveys || []).map((s: any, sIdx: number) => (
                    <div key={`survey-${s.id || sIdx}-${sIdx}`} className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white">{s.title}</h5>
                        <span className="text-xs text-slate-500 font-bold">{s.responses?.length || 0} ta javob</span>
                      </div>
                      <div className="space-y-2">
                        {(s.responses || []).slice(0, 5).map((resp: any, rIdx: number) => (
                          <div key={`resp-${resp.id || rIdx}-${rIdx}`} className="bg-white dark:bg-dark-900 p-2.5 rounded-xl border border-slate-200 dark:border-dark-750 text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                              <span>{resp.restaurantName || "Mijoz"} ({resp.respondentName || "Mas'ul"})</span>
                              <span className="text-[10px] text-slate-400 font-normal">{resp.respondentDate || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: ARCHIVE */}
              {activeModal === 'archive' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      {formatDual("Zavod amaliyotlari xronologik lentasi", "Хронологическая лента операций завода", "Plant operations timeline feed")}
                    </h4>
                    <Link
                      href="/archive"
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
                    >
                      <span>{formatDual("To'liq arxiv sahifasiga o'tish", "Перейти на страницу архива", "Open full archive page")}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>

                  {loadingArchive ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      {formatDual("Arxiv yuklanmoqda...", "Загрузка архива...", "Loading archive...")}
                    </div>
                  ) : archiveEvents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      {formatDual("Arxivda ma'lumot topilmadi", "В архиве нет данных", "No archive records found")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archiveEvents
                        .filter((evt) => {
                          if (!searchQuery) return true
                          const q = searchQuery.toLowerCase()
                          return (
                            evt.title?.toLowerCase().includes(q) ||
                            evt.desc?.toLowerCase().includes(q) ||
                            evt.author?.toLowerCase().includes(q)
                          )
                        })
                        .slice(0, 30)
                        .map((evt, idx) => (
                          <div
                            key={`arch-${evt.id || idx}-${idx}`}
                            className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-slate-200 dark:border-dark-750 flex items-start gap-3 text-xs shadow-xs"
                          >
                            <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                              <Archive size={17} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {evt.title}
                                </h5>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-lg flex-shrink-0">
                                  {evt.date}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-medium">
                                {evt.desc}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                                <span>{formatDual("Kirituvchi:", "Автор:", "By:")} {evt.author}</span>
                                <span>•</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{evt.type}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: OPERATIONS (DEDICATED VIEW FOR KIRIM, CHIQIM, BRAK, OR OMBOR) */}
              {activeModal === 'operations' && (
                <div className="space-y-4">
                  {/* Dedicated Operation Banner */}
                  <div className="bg-slate-50 dark:bg-dark-800/60 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl text-white ${
                        operationsTab === 'prixod' ? 'bg-emerald-600' :
                        operationsTab === 'rasxod' ? 'bg-blue-600' :
                        operationsTab === 'brak' ? 'bg-rose-600' : 'bg-indigo-600'
                      }`}>
                        {operationsTab === 'prixod' ? <Truck size={18} /> :
                         operationsTab === 'rasxod' ? <ChefHat size={18} /> :
                         operationsTab === 'brak' ? <AlertTriangle size={18} /> : <Package size={18} />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {operationsTab === 'prixod' ? formatDual("Kirim (Xomashyo qabuli)", "Прием сырья", "Raw Material Arrivals") :
                           operationsTab === 'rasxod' ? formatDual("Chiqim (Ishlab chiqarishga sarf)", "Расход в цеха", "Production Consumption") :
                           operationsTab === 'brak' ? formatDual("Brak va chiqindilar nazorati", "Учет брака и отходов", "Defect & Scrap Records") :
                           formatDual("Omborxona (Qoldiq va zaxiralar)", "Склад сырья и тары (Остатки)", "Warehouse Stock & Inventory")}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {operationsTab === 'prixod' ? formatDual("Barcha qabul qilingan xomashyo partiyalari", "Все принятые партии сырья", "Inbound arrival batches") :
                           operationsTab === 'rasxod' ? formatDual("Sexlarga sarflangan xomashyo va chiqim hujjatlari", "Расход сырья по цехам", "Workshop consumption records") :
                           operationsTab === 'brak' ? formatDual("Ishlab chiqarish, qabul va ombordagi brak dalolatnomalari", "Акты брака и отходов", "Defect and scrap acts") :
                           formatDual("Xomashyo va taralar qoldig'i, yetarlilik holati va zaxira muddati tahlili", "Остатки сырья, тары, статус запаса и покрытие", "Stock balance, inventory sufficiency & coverage")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs self-end sm:self-auto font-medium">
                      {/* KG Section */}
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {operationsTab === 'brak'
                            ? formatDual("Vazn (Brak):", "Вес (Брак):", "Waste (Weight):")
                            : formatDual("Vazn:", "Вес:", "Weight:")}
                        </span>
                        <span className={`text-base font-black font-mono ${
                          operationsTab === 'prixod' ? 'text-emerald-600 dark:text-emerald-400' :
                          operationsTab === 'rasxod' ? 'text-blue-600 dark:text-blue-400' :
                          operationsTab === 'brak' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {operationsTab === 'prixod' && `${(operationsSummary?.prixod?.totalKg || 0).toLocaleString()} kg`}
                          {operationsTab === 'rasxod' && `${(operationsSummary?.rasxod?.totalKg || 0).toLocaleString()} kg`}
                          {operationsTab === 'brak' && `${(operationsSummary?.brak?.totalKg || 0).toLocaleString()} kg`}
                          {operationsTab === 'ombor' && `${(operationsSummary?.ombor?.totalKg || data?.kpis?.warehouse?.totalInventoryKg || 0).toLocaleString()} kg`}
                        </span>
                      </div>

                      {/* DONA Section */}
                      <div className="text-right border-l pl-3 sm:pl-4 border-slate-200 dark:border-dark-700">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {operationsTab === 'brak'
                            ? formatDual("Dona (Brak):", "Шт (Брак):", "Scrap (Pcs):")
                            : formatDual("Dona:", "Шт:", "Pcs:")}
                        </span>
                        <span className={`text-base font-black font-mono ${
                          operationsTab === 'brak' ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {operationsTab === 'prixod' && `${(operationsSummary?.prixod?.totalDona || 0).toLocaleString()} dona`}
                          {operationsTab === 'rasxod' && `${(operationsSummary?.rasxod?.totalDona || 0).toLocaleString()} dona`}
                          {operationsTab === 'brak' && `${(operationsSummary?.brak?.totalDona || 0).toLocaleString()} dona`}
                          {operationsTab === 'ombor' && `${(operationsSummary?.ombor?.totalDona || 415275).toLocaleString()} dona`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. KIRIM: Dedicated Inbound Analysis (Matching Chiqim 1:1) */}
                  {operationsTab === 'prixod' && (
                    <IncomingMaterialsAnalysis
                      items={operationsSummary?.prixod?.items || []}
                      dateFrom={period === 'custom' ? customFrom : ''}
                      dateTo={period === 'custom' ? customTo : ''}
                      lang={directorLang}
                    />
                  )}

                  {/* 2. CHIQIM: Dedicated Consumption Analysis */}
                  {operationsTab === 'rasxod' && (
                    <ConsumptionMaterialsAnalysis
                      items={operationsSummary?.rasxod?.items || []}
                      lang={directorLang}
                    />
                  )}

                  {/* 3. BRAK: Dedicated Defect Analysis */}
                  {operationsTab === 'brak' && (
                    <DefectMaterialsAnalysis
                      items={operationsSummary?.brak?.items || []}
                      lang={directorLang}
                    />
                  )}

                  {/* 4. OMBOR: Dedicated Warehouse Stock Analysis */}
                  {operationsTab === 'ombor' && (
                    <div className="space-y-4">
                      {/* Top Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-dark-750">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                          >
                            <Sliders size={14} />
                            <span>{formatDual("Yo'qotish me'yorlarini sozlash", "Настройка норм потерь", "Configure Loss Standards")}</span>
                          </button>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDual("Barcha xomashyo va qadoqlar tahlili (Drill-down)", "Анализ всего сырья и тары (Drill-down)", "All materials & packaging drill-down")}
                        </span>
                      </div>

                      <ProductBalanceTable
                        products={
                          executiveProductBalances.length > 0
                            ? executiveProductBalances
                            : operationsSummary?.ombor?.items?.length > 0
                              ? operationsSummary.ombor.items
                              : []
                        }
                        loading={loadingExecutiveBalances || loading}
                        lang={directorLang}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        onOpenStandards={() => setShowSettingsModal(true)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 6. THRESHOLDS SETTINGS MODAL (CONFIGURABLE BY DIRECTOR) */}
      {/* ========================================================================= */}
      {mounted && showSettingsModal && createPortal(
        <div 
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-dark-750 overflow-hidden my-auto cursor-default"
          >
            <div className="p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders size={20} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {formatDual("Shubhali mezonlar chegarasi", "Настройка порогов аномалий", "Suspicious threshold settings")}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {formatDual(
                    "Ombordan berishdagi maksimal farq (kamomad):",
                    "Макс. расхождение при выдаче со склада (недостача):",
                    "Max discrepancy on warehouse release (shortage):"
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempThresholds.discrepancyThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        discrepancyThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan oshsa ogohlantirish beriladi",
                      "% при превышении выдать предупреждение",
                      "% trigger alert if exceeded"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {formatDual(
                    "Ishlab chiqarish minimal chiqish normasi (Yield):",
                    "Мин. норма выхода готовой продукции (Yield):",
                    "Min production yield threshold (Yield):"
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempThresholds.minYieldThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        minYieldThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan tushib ketsa ogohlantirish",
                      "% при падении ниже нормы выдать предупреждение",
                      "% trigger alert if below"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {formatDual(
                    "Maksimal ruxsat etilgan brak / rad etilish foizi:",
                    "Макс. допустимый процент брака / отклонений:",
                    "Max allowed defect / rejection rate:"
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempThresholds.maxRejectThreshold}
                    onChange={(e) =>
                      setTempThresholds({
                        ...tempThresholds,
                        maxRejectThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-slate-500 font-medium">
                    {formatDual(
                      "% dan oshsa shubhali deb hisoblansin",
                      "% при превышении считать аномалией",
                      "% consider anomalous if exceeded"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-dark-800 flex justify-end gap-2 bg-slate-50 dark:bg-dark-850">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                {formatDual("Bekor qilish", "Отмена", "Cancel")}
              </button>
              <button
                onClick={handleSaveThresholds}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                {formatDual("Saqlash va qo'llash", "Сохранить и применить", "Save and apply")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 6.5 ACTION DETAIL POPUP MODAL (XODIMNING AMALLARI TO'LIQ MA'LUMOTI)       */}
      {/* ========================================================================= */}
      {mounted && selectedAuditAction && createPortal(
        <div 
          className="fixed inset-0 z-[120] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto cursor-pointer animate-enter"
          onClick={() => setSelectedAuditAction(null)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-dark-750 overflow-hidden my-auto cursor-default flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-dark-850">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selectedAuditAction.badge}`}>
                      {selectedAuditAction.type}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(selectedAuditAction.date).toLocaleString(dateLocale)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {formatDual("Amal bo'yicha to'liq ma'lumot", "Полные данные операции", "Complete Action Record")}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedAuditAction(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Responsible Employee Card */}
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {((selectedAuditAction.user || selectedEmployee?.name || 'B'))[0]}
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold block uppercase tracking-wider">
                      {formatDual("Bajaruvchi mas'ul:", "Ответственный:", "Responsible:")}
                    </span>
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {selectedAuditAction.user || selectedEmployee?.name || formatDual("Mas'ul xodim", "Сотрудник", "Staff member")}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {formatDual("Qayd sanasi:", "Дата:", "Date:")} {new Date(selectedAuditAction.date).toLocaleDateString(dateLocale)}
                </span>
              </div>

              {/* Action Summary Banner */}
              <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {formatDual("Amal mazmuni:", "Описание действия:", "Action summary:")}
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedAuditAction.details}
                </p>
              </div>

              {/* Dynamic Details: Inspection (Akt) */}
              {selectedAuditAction.category === 'inspection' && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Xomashyo tekshiruvi (Kirim akti) parametrlari:", "Параметры акта приемки сырья:", "Raw Inspection Act Parameters:")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Yetkazib beruvchi:", "Поставщик:", "Supplier:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.supplier?.name || selectedAuditAction.rawData.supplier || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Mahsulot / Nomenklatura:", "Товар / Номенклатура:", "Product / Item:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.product?.name || selectedAuditAction.rawData.nomenclature || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Umumiy miqdor:", "Общий объем:", "Total quantity:")}</span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.quantity ? `${selectedAuditAction.rawData.quantity} kg` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Qabul qilingan:", "Принято:", "Accepted:")}</span>
                      <span className="text-xs font-bold font-mono text-emerald-600">
                        {selectedAuditAction.rawData.acceptedQuantity ? `${selectedAuditAction.rawData.acceptedQuantity} kg` : selectedAuditAction.rawData.quantity ? `${selectedAuditAction.rawData.quantity} kg` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Rad etilgan (Brak):", "Брак / Отклонено:", "Rejected:")}</span>
                      <span className={`text-xs font-bold font-mono ${selectedAuditAction.rawData.rejectedQuantity > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {selectedAuditAction.rawData.rejectedQuantity ? `${selectedAuditAction.rawData.rejectedQuantity} kg` : '0 kg'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Qabul holati:", "Статус:", "Status:")}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                        selectedAuditAction.rawData.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        selectedAuditAction.rawData.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedAuditAction.rawData.status || 'N/A'}
                      </span>
                    </div>

                    {selectedAuditAction.rawData.carNumber && (
                      <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                        <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Avtotransport №:", "Гос. номер авто:", "Vehicle plate:")}</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {selectedAuditAction.rawData.carNumber}
                        </span>
                      </div>
                    )}

                    {selectedAuditAction.rawData.temperature && (
                      <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                        <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Harorat:", "Температура:", "Temperature:")}</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {selectedAuditAction.rawData.temperature} °C
                        </span>
                      </div>
                    )}

                    {selectedAuditAction.rawData.batchNumber && (
                      <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                        <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Partiya №:", "Номер партии:", "Batch №:")}</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {selectedAuditAction.rawData.batchNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedAuditAction.rawData.notes && (
                    <div className="bg-slate-50 dark:bg-dark-800 p-3.5 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Izoh / Sifat xulosasi:", "Примечание / Заключение:", "Quality inspection notes:")}</span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">
                        {selectedAuditAction.rawData.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Details: Checklist */}
              {selectedAuditAction.category === 'checklist' && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Smena QC Cheklisti parametrlari:", "Параметры сменного чек-листа QC:", "Shift QC Checklist Parameters:")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Sana & Smena:", "Дата & Смена:", "Date & Shift:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.date} • Smena {selectedAuditAction.rawData.shift || 1}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Chiqarilgan qutilar:", "Выпущено коробок:", "Boxes output:")}</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        {selectedAuditAction.rawData.totalOutputBox || 0} {formatDual("quti", "кор.", "boxes")}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Brak miqdori:", "Количество брака:", "Reject weight:")}</span>
                      <span className={`text-xs font-bold font-mono ${selectedAuditAction.rawData.rejectedKg > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {selectedAuditAction.rawData.rejectedKg || 0} kg
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Xomashyo sarfi:", "Расход сырья:", "Raw consumption:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {selectedAuditAction.rawData.totalRawKg ? `${selectedAuditAction.rawData.totalRawKg} kg` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Chiqish (Yield):", "Выход (Yield):", "Yield rate:")}</span>
                      <span className="text-xs font-bold text-blue-600 font-mono">
                        {selectedAuditAction.rawData.yieldPercent ? `${selectedAuditAction.rawData.yieldPercent}%` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Sex / Liniya:", "Цех / Линия:", "Workshop / Line:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.line || selectedAuditAction.rawData.workshop || 'Sex 1'}
                      </span>
                    </div>
                  </div>

                  {selectedAuditAction.rawData.notes && (
                    <div className="bg-slate-50 dark:bg-dark-800 p-3.5 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Inspektor xulosasi:", "Заключение инспектора:", "Inspector remarks:")}</span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">
                        {selectedAuditAction.rawData.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Details: Transfer */}
              {(selectedAuditAction.category === 'transfer_issued' || selectedAuditAction.category === 'transfer_received') && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Ombor transferi va chiqim parametrlari:", "Параметры перемещения со склада:", "Warehouse Dispatch Transfer Details:")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Hujjat №:", "№ Документа:", "Document №:")}</span>
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        {selectedAuditAction.rawData.transferNumber || '#' + selectedAuditAction.rawData.id}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Mahsulot:", "Продукт:", "Product:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.product?.name || selectedAuditAction.rawData.productName || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Chiqarilgan miqdor:", "Отпущено со склада:", "Issued quantity:")}</span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.issuedQuantity} {selectedAuditAction.rawData.issuedUnit || 'kg'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Qabul qilingan:", "Принято в цеху:", "Received in workshop:")}</span>
                      <span className="text-xs font-bold font-mono text-emerald-600">
                        {selectedAuditAction.rawData.receivedQuantity !== null ? `${selectedAuditAction.rawData.receivedQuantity} ${selectedAuditAction.rawData.issuedUnit || 'kg'}` : formatDual("Kutilmoqda", "Ожидается", "Pending")}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Farq / Yo'qotish:", "Разница / Потери:", "Discrepancy:")}</span>
                      <span className={`text-xs font-bold font-mono ${selectedAuditAction.rawData.discrepancy > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {selectedAuditAction.rawData.discrepancy ? `-${selectedAuditAction.rawData.discrepancy} ${selectedAuditAction.rawData.issuedUnit || 'kg'}` : '0 (Farqsiz)'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Qayerga yuborildi:", "Куда направлено:", "Destination:")}</span>
                      <span className="text-xs font-bold text-indigo-600">
                        {selectedAuditAction.rawData.targetLocation || 'Sex'}
                      </span>
                    </div>
                  </div>

                  {selectedAuditAction.rawData.discrepancyReason && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                      <span className="text-[10px] text-rose-700 dark:text-rose-400 block font-semibold">{formatDual("Farq sababi:", "Причина расхождения:", "Discrepancy reason:")}</span>
                      <p className="text-xs text-rose-900 dark:text-rose-200 mt-1 font-medium">
                        {selectedAuditAction.rawData.discrepancyReason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Details: Shop Expense (Ishlab chiqarish) */}
              {selectedAuditAction.category === 'expense' && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Ishlab chiqarish sarfi va mahsulot chiqimi:", "Расход сырья и выпуск продукции:", "Production Consumption & Output Details:")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3.5 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold mb-2">
                        {formatDual("Sarflangan xomashyolar:", "Израсходованное сырье:", "Materials consumed:")}
                      </span>
                      <div className="space-y-1 text-xs">
                        {Object.entries(selectedAuditAction.rawData.materials || {}).slice(0, 6).map(([mat, qty]: any) => (
                          <div key={mat} className="flex items-center justify-between font-mono">
                            <span className="text-slate-700 dark:text-slate-300 font-sans">{mat}:</span>
                            <span className="font-bold text-amber-600">{Number(qty).toLocaleString()} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3.5 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold mb-2">
                        {formatDual("Olingan tayyor mahsulotlar:", "Полученная продукция:", "Produced outputs:")}
                      </span>
                      <div className="space-y-1 text-xs">
                        {Object.entries(selectedAuditAction.rawData.outputs || {}).slice(0, 6).map(([out, val]: any) => (
                          <div key={out} className="flex items-center justify-between font-mono">
                            <span className="text-slate-700 dark:text-slate-300 font-sans">{out}:</span>
                            <span className="font-bold text-emerald-600">{val?.kg ? Number(val.kg).toLocaleString() + ' kg' : (val?.boxes ? val.boxes + ' quti' : JSON.stringify(val))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Details: Finance / Sales (Buxgalteriya) */}
              {(selectedAuditAction.category === 'finance' || selectedAuditAction.category === 'sales') && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Buxgalteriya va moliyaviy hisob-kitob parametrlari:", "Параметры финансового учета и расчетов:", "Financial & Invoicing Accounting Parameters:")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Kontragent:", "Контрагент:", "Counterparty:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.supplierName || selectedAuditAction.rawData.customer?.name || "Kompaniya"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Mahsulot / Xomashyo:", "Номенклатура:", "Product / Material:")}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.productName || selectedAuditAction.rawData.nomenclature || "Mahsulot"}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-500 block font-semibold">{formatDual("Birlik narxi:", "Цена за единицу:", "Unit price:")}</span>
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        {selectedAuditAction.rawData.pricePerKg ? `${Number(selectedAuditAction.rawData.pricePerKg).toLocaleString()} so'm/kg` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Details: System / Admin */}
              {selectedAuditAction.category === 'system' && selectedAuditAction.rawData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {formatDual("Tizim amali va audit tafsilotlari:", "Детали системного действия:", "System Action & Audit Details:")}
                  </h4>
                  <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-dark-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">{formatDual("Amal kodi:", "Код действия:", "Action code:")}</span>
                      <span className="font-mono font-bold text-indigo-600">{selectedAuditAction.rawData.action || 'SYSTEM'}</span>
                    </div>
                    {selectedAuditAction.rawData.entity && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">{formatDual("Obyekt / Jadval:", "Объект:", "Entity:")}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{selectedAuditAction.rawData.entity}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-dark-700">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1">{formatDual("Amal tavsifi:", "Описание:", "Details:")}</span>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {selectedAuditAction.rawData.details || selectedAuditAction.details}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Link button */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-dark-750">
                <span className="text-xs text-slate-500">
                  {formatDual("Tizim ID:", "Системный ID:", "System ID:")} #{selectedAuditAction.rawData?.id || '-'}
                </span>
                {selectedAuditAction.category === 'inspection' && (
                  <Link
                    href="/incoming-acts"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
                  >
                    <span>{formatDual("To'liq aktlar sahifasiga o'tish", "Перейти к актам", "Go to acts")}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                )}
                {(selectedAuditAction.category === 'transfer_issued' || selectedAuditAction.category === 'transfer_received') && (
                  <Link
                    href="/warehouse"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <span>{formatDual("Ombor sahifasiga o'tish", "Перейти на склад", "Go to warehouse")}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAuditAction(null)}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 transition-all"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 7. EXECUTIVE 1-PAGE SUMMARY REPORT MODAL (OFFICIAL PDF / PRINT) */}
      {/* ========================================================================= */}
      <ExecutiveSummaryReportModal
        isOpen={showSummaryReportModal}
        onClose={() => setShowSummaryReportModal(false)}
        data={data}
        directorLang={directorLang}
        formatDual={formatDual}
        dateLocale={dateLocale}
        period={period}
      />

      {/* Product Loss & Daily Consumption Drawer */}
      <ProductLossDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onViewJournal={(productName) => {
          setSelectedOperationProduct(productName)
          openOperationsModal('rasxod')
        }}
        lang={directorLang}
      />

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE 4-LEVEL PROGRESSIVE CHART DRILL-DOWN MODAL */}
      {/* ========================================================================= */}
      {chartDrillModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setChartDrillModal(null)}
        >
          <div
            className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between bg-slate-50/50 dark:bg-dark-850/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {chartDrillModal.type === 'dynamics' && <TrendingUp size={20} />}
                  {chartDrillModal.type === 'defects' && <AlertCircle size={20} />}
                  {chartDrillModal.type === 'coverage' && <Package size={20} />}
                  {chartDrillModal.type === 'debt' && <DollarSign size={20} />}
                  {chartDrillModal.type === 'plan' && <CheckSquare size={20} />}
                  {chartDrillModal.type === 'perf' && <Truck size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {chartDrillModal.title}
                  </h3>
                  {chartDrillModal.subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">{chartDrillModal.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChartDrillModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* TYPE 1: PRODUCTION DYNAMICS DRILL-DOWN */}
              {chartDrillModal.type === 'dynamics' && (
                <div className="space-y-6">
                  {/* Level 1: Overview KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Sarflangan xomashyo", "Расход сырья", "Raw Consumed")}
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {Number(chartDrillModal.data.consumedKg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Tayyor mahsulot (kg)", "Выпуск (кг)", "Finished Output (kg)")}
                      </span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {Number(chartDrillModal.data.outputKg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Tayyor qutilar", "Выпуск (коробки)", "Finished Boxes")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {Number(chartDrillModal.data.outputBoxes || 0).toLocaleString()} quti
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Chiqish normasi (Yield)", "Норма выхода", "Production Yield")}
                      </span>
                      <span className="text-lg font-black text-indigo-500 font-mono">
                        {chartDrillModal.data.yieldPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Level 2 & 3: Details & Underlying batches */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <ChefHat size={16} />
                      <span>{formatDual("Sex va operatsion kontekst", "Цех и контекст операций", "Workshop & Operations Context")}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {formatDual(
                        `Ushbu kunda (${chartDrillModal.data.date}) qayta ishlash sexida ${Number(chartDrillModal.data.consumedKg).toLocaleString()} kg xomashyo sarflanib, ${Number(chartDrillModal.data.outputKg).toLocaleString()} kg tayyor mahsulot (${chartDrillModal.data.outputBoxes} quti) qadoqlangan. Tabiiy tozalash va ajratish chiqindisi: ${chartDrillModal.data.scrapKg} kg.`,
                        `В этот день (${chartDrillModal.data.date}) в цехе переработано ${Number(chartDrillModal.data.consumedKg).toLocaleString()} кг сырья, выпущено ${Number(chartDrillModal.data.outputKg).toLocaleString()} кг готовой продукции (${chartDrillModal.data.outputBoxes} коробок).`,
                        `On ${chartDrillModal.data.date}, ${Number(chartDrillModal.data.consumedKg).toLocaleString()} kg raw material was consumed, producing ${Number(chartDrillModal.data.outputKg).toLocaleString()} kg finished output (${chartDrillModal.data.outputBoxes} boxes).`
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* TYPE 2: DEFECT ANALYSIS DRILL-DOWN */}
              {chartDrillModal.type === 'defects' && (
                <div className="space-y-6">
                  {/* Level 1: Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Jami haqiqiy brak", "Всего брака", "Total Actual Defect")}
                      </span>
                      <span className="text-lg font-black text-rose-600 font-mono">
                        {chartDrillModal.data.totalDefectKg} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Qabul jarayonida", "При приеме", "Incoming")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {chartDrillModal.data.incomingKg} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Ishlov berishda", "В переработке", "Processing")}
                      </span>
                      <span className="text-lg font-black text-amber-500 font-mono">
                        {chartDrillModal.data.processingKg} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Ombor saqlashda", "При хранении", "Storage")}
                      </span>
                      <span className="text-lg font-black text-violet-500 font-mono">
                        {chartDrillModal.data.storageKg} kg
                      </span>
                    </div>
                  </div>

                  {/* Level 3 & 4: Underlying Defect Acts List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                      {formatDual("Rasmiy dalolatnomalar va javobgarlik (Level 3-4):", "Официальные акты и ответственность:", "Official Defect Acts & Root Causes:")}
                    </h4>
                    {chartDrillModal.data.acts && chartDrillModal.data.acts.length > 0 ? (
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-dark-800 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-dark-700">
                            <tr>
                              <th className="p-3">{formatDual("Akt №", "Акт №", "Act №")}</th>
                              <th className="p-3">{formatDual("Bosqich", "Этап", "Stage")}</th>
                              <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                              <th className="p-3 text-right">{formatDual("Og'irlik", "Вес", "Quantity")}</th>
                              <th className="p-3">{formatDual("Sabab / Xulosa", "Причина", "Reason")}</th>
                              <th className="p-3">{formatDual("Mas'ul / Inspektor", "Ответственный", "Responsible")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                            {chartDrillModal.data.acts.map((act: any, idx: number) => (
                              <tr key={act.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                                  {act.rejectionActNumber || act.actNumber || `#${idx + 1}`}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    act.stage === 'INCOMING' ? 'bg-rose-500/10 text-rose-500' :
                                    act.stage === 'PROCESSING' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-violet-500/10 text-violet-500'
                                  }`}>
                                    {act.stage}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500">{act.date}</td>
                                <td className="p-3 text-right font-mono font-bold text-rose-600">
                                  {act.quantityKg} kg
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={act.reason}>
                                  {act.reason}
                                </td>
                                <td className="p-3 text-slate-500">
                                  {act.responsible || act.inspector}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">{formatDual("Aktlar ro'yxati mavjud emas", "Список актов пуст", "No acts found")}</p>
                    )}
                  </div>
                </div>
              )}

              {/* TYPE 3: INVENTORY STOCK COVERAGE DRILL-DOWN */}
              {chartDrillModal.type === 'coverage' && (
                <div className="space-y-6">
                  {/* Level 1: Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Joriy ombor qoldig'i", "Текущий остаток", "Current Usable Stock")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {Number(chartDrillModal.data.currentStock || 0).toLocaleString()} {chartDrillModal.data.unit || 'kg'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Kunlik o'rtacha sarf", "Среднесуточный расход", "Avg Daily Consumption")}
                      </span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        {chartDrillModal.data.avgDailyConsumptionKg || 0} kg/kun
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Qoplash muddati", "Срок покрытия", "Stock Coverage")}
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {chartDrillModal.data.stockCoverageDays !== null ? `${chartDrillModal.data.stockCoverageDays} kun` : "Noma'lum"}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Ruxsat etilgan max saqlash", "Макс. срок хранения", "Approved Max Storage")}
                      </span>
                      <span className="text-lg font-black text-violet-500 font-mono">
                        {chartDrillModal.data.approvedMaxStorageDays !== null ? `${chartDrillModal.data.approvedMaxStorageDays} kun` : formatDual("Cheklanmagan", "Не указан", "No limit")}
                      </span>
                    </div>
                  </div>

                  {/* Level 2 & 4: Inventory Standards & Movements */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {formatDual("Zaxira me'yorlari va hisob-kitob (Level 2-4):", "Нормативы и расчет:", "Stock Standards & Analysis:")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">{formatDual("Zaxira holati:", "Статус запасов:", "Stock Status:")}</span>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                          chartDrillModal.data.status === 'SUFFICIENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          chartDrillModal.data.status === 'LOW' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          chartDrillModal.data.status === 'EXCESS' ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20' :
                          'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {chartDrillModal.data.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">{formatDual("Tavsiya etilgan maksimal zaxira:", "Макс. рекомендованный запас:", "Max Recommended Inventory:")}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {chartDrillModal.data.maxRecommendedStockKg ? `${chartDrillModal.data.maxRecommendedStockKg} kg` : "Hisoblanmagan"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">{formatDual("Jami ombor kirimi:", "Всего приход:", "Total Inbound Arrivals:")}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {Number(chartDrillModal.data.totalInKg || 0).toLocaleString()} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">{formatDual("Jami sexlarga chiqim:", "Всего расход в цеха:", "Total Shop Expenses:")}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {Number(chartDrillModal.data.totalOutKg || 0).toLocaleString()} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 4: SUPPLIER DEBT DRILL-DOWN (4 LEVELS) */}
              {chartDrillModal.type === 'debt' && (
                <div className="space-y-6">
                  {/* Level 1: Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Jami rasmiy qarz", "Общая задолженность", "Total Outstanding Debt")}
                      </span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                        {Number(chartDrillModal.data.totalDebtUzs || 0).toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Muddati yetmagan", "Срок не истек", "Not Yet Due")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {Number(chartDrillModal.data.notYetDueUzs || 0).toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Muddati o'tgan qarz", "Просрочено", "Overdue Debt")}
                      </span>
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                        {Number(chartDrillModal.data.overdueUzs || 0).toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Qabul aktlari soni", "Количество актов", "Verified Acts Count")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {chartDrillModal.data.actsCount} ta
                      </span>
                    </div>
                  </div>

                  {/* Level 3 & 4: Invoices & Quality Acts Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                      {formatDual("Rasmiy xomashyo qabul aktlari va invoyslar (Level 3-4):", "Акты приемки и инвойсы:", "Underlying Receiving Acts & Invoices:")}
                    </h4>
                    {chartDrillModal.data.invoices && chartDrillModal.data.invoices.length > 0 ? (
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-dark-800 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-dark-700 sticky top-0">
                            <tr>
                              <th className="p-3">{formatDual("Akt №", "Акт №", "Act №")}</th>
                              <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                              <th className="p-3">{formatDual("To'lov muddati", "Срок оплаты", "Due Date")}</th>
                              <th className="p-3">{formatDual("Mahsulot", "Сырье", "Product")}</th>
                              <th className="p-3 text-right">{formatDual("Og'irlik", "Вес", "Kg")}</th>
                              <th className="p-3 text-right">{formatDual("Narx / kg", "Цена", "Price/kg")}</th>
                              <th className="p-3 text-right">{formatDual("Qarz summasi", "Сумма", "Amount")}</th>
                              <th className="p-3 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                            {chartDrillModal.data.invoices.map((inv: any, idx: number) => (
                              <tr key={inv.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                                <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                                  #{inv.actNumber}
                                </td>
                                <td className="p-3 text-slate-500">{inv.date}</td>
                                <td className="p-3 text-slate-500 font-mono">{inv.dueDate}</td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{inv.productName}</td>
                                <td className="p-3 text-right font-mono">{Number(inv.warehouseKg).toLocaleString()} kg</td>
                                <td className="p-3 text-right font-mono text-slate-500">{Number(inv.pricePerKg).toLocaleString()}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {Number(inv.amountUzs).toLocaleString()} UZS
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.isOverdue
                                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  }`}>
                                    {inv.isOverdue ? formatDual("Muddati o'tgan", "Просрочено", "Overdue") : formatDual("Yetmagan", "В норме", "Due")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">{formatDual("Hujjatlar topilmadi", "Документы не найдены", "No records found")}</p>
                    )}
                  </div>
                </div>
              )}

              {/* TYPE 5: PLAN VS ACTUAL DRILL-DOWN */}
              {chartDrillModal.type === 'plan' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Haqiqiy mahsulot (kg)", "Фактический выпуск (кг)", "Actual Output (kg)")}
                      </span>
                      <span className="text-lg font-black text-indigo-600 font-mono">
                        {Number(chartDrillModal.data.actualKg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Tayyor qutilar soni", "Количество коробок", "Output Boxes")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {Number(chartDrillModal.data.actualBoxes || 0).toLocaleString()} quti
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                        {formatDual("Tasdiqlangan reja", "Утвержденный план", "Approved Plan")}
                      </span>
                      <span className="text-sm font-bold text-amber-600">
                        {formatDual("Reja kiritilmagan", "Не утвержден", "No Plan in DB")}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      {formatDual(
                        "Ushbu kategoriya bo'yicha ishlab chiqarish rejalari (ProductionPlan) direktor yoki ishlab chiqarish boshlig'i tomonidan kiritilgach, avtomatik reja-fakt og'ishi (% va kg) hisoblanadi.",
                        "После утверждения планов производства директором отклонение (план-факт) будет рассчитано автоматически.",
                        "Once approved production plans are submitted, actual vs plan variance will be computed automatically."
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* TYPE 6: SUPPLIER PERFORMANCE DRILL-DOWN */}
              {chartDrillModal.type === 'perf' && (
                <div className="space-y-6">
                  {/* Level 1: Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Jami yetkazib berishlar", "Всего поставок", "Total Deliveries")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {chartDrillModal.data.totalDeliveries} ta
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Qabul qilingan", "Принято (кг)", "Accepted (kg)")}
                      </span>
                      <span className="text-lg font-black text-emerald-600 font-mono">
                        {Number(chartDrillModal.data.acceptedKg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Rad etilgan (Brak)", "Брак (кг)", "Rejected (kg)")}
                      </span>
                      <span className="text-lg font-black text-rose-600 font-mono">
                        {Number(chartDrillModal.data.rejectedKg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {formatDual("Sifat darajasi", "Уровень качества", "Quality Rate")}
                      </span>
                      <span className="text-lg font-black text-indigo-500 font-mono">
                        {chartDrillModal.data.qualityRatePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Level 3 & 4: Rejection Acts List */}
                  {chartDrillModal.data.rejections && chartDrillModal.data.rejections.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                        {formatDual("Rad etilgan (Brak) partiyalar dalolatnomalari:", "Акты отклоненных партий:", "Rejection Acts & Root Causes:")}
                      </h4>
                      <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-dark-800 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-dark-700">
                            <tr>
                              <th className="p-3">{formatDual("Rad etish akti №", "Акт брака №", "Rejection Act №")}</th>
                              <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                              <th className="p-3">{formatDual("Xomashyo", "Сырье", "Product")}</th>
                              <th className="p-3 text-right">{formatDual("Miqdor", "Вес", "Quantity")}</th>
                              <th className="p-3">{formatDual("Sabab / Xulosa", "Причина", "Reason")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800 font-medium">
                            {chartDrillModal.data.rejections.map((rej: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                                <td className="p-3 font-mono font-bold text-rose-600">{rej.rejectionActNumber}</td>
                                <td className="p-3 text-slate-500">{rej.date}</td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{rej.product}</td>
                                <td className="p-3 text-right font-mono font-bold text-rose-600">{rej.quantityKg} kg</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{rej.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatDual("Ushbu ta'minotchi bo'yicha rad etilgan yoki yaroqsiz deb topilgan partiyalar qayd etilmagan (100% qabul qilingan).", "Забракованных партий у данного поставщика не зафиксировано.", "No rejected deliveries recorded for this supplier.")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-850/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {formatDual("Zavod ERP rasmiy ma'lumotlar bazasi", "Официальная база данных завода", "Factory ERP Verified Source Records")}
              </span>
              <button
                type="button"
                onClick={() => setChartDrillModal(null)}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

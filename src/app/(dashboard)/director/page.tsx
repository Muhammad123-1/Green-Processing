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
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<'accounting' | 'quality' | 'inspector' | 'admin' | 'production' | null>(null)
  const [deptPeriodFilter, setDeptPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('today')
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
    const list: any[] = details.recentInspections || details.recentShopArrivals || []
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (i: any) =>
        i.supplier?.name?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase?.().includes(q) ||
        i.nomenclature?.toLowerCase().includes(q) ||
        i.product?.name?.toLowerCase().includes(q) ||
        i.user?.name?.toLowerCase().includes(q)
    )
  }, [details.recentInspections, details.recentShopArrivals, searchQuery])

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
      const actDate = act.actDate ? new Date(act.actDate + 'T12:00:00Z') : new Date(act.createdAt)

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
      const cDate = c.date ? new Date(c.date + 'T12:00:00Z') : new Date(c.createdAt)

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
      const saDate = sa.date ? new Date(sa.date + 'T12:00:00Z') : new Date(sa.createdAt)

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
      const expDate = exp.date ? new Date(exp.date + 'T12:00:00Z') : new Date(exp.createdAt)
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Truck size={24} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
                </span>
              </div>

              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                {formatDual("Kirim operatsiyalari", "Приход сырья", "Inbound Operations")}
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatDual("Xomashyo va taralar", "Сырье и тара", "Raw Materials & Packaging")}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                {formatDual(
                  "Ta'minotchi partiyalari, sifat nazorati (QC) va qabul aktlari jurnali",
                  "Партии поставщиков, входной контроль качества (QC) и акты",
                  "Supplier batches, QC inspection & inbound acceptance logs"
                )}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/25 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{formatDual("Ta'minot:", "Поставка:", "Supply:")}</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                100% {formatDual("Tekshirilgan", "Проверено", "Verified")}
              </span>
            </div>
          </div>

          {/* RASXOD CARD */}
          <div
            onClick={() => openOperationsModal('rasxod')}
            className="group relative overflow-hidden bg-blue-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-blue-500/30 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                  <ChefHat size={24} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
                </span>
              </div>

              <span className="text-xs font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                {formatDual("Chiqim operatsiyalari", "Расход производства", "Outbound Operations")}
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatDual("Sexlar va sarf", "Цехи и расход", "Workshops & Consumption")}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                {formatDual(
                  "Sexlarga berilgan xomashyo, tayyor mahsulot va partiyalar zanjiri",
                  "Списание в цехи, готовая продукция и цепочка партий",
                  "Workshop allocations, finished output & batch tracking"
                )}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-500/25 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{formatDual("Sexlar:", "Цехи:", "Target:")}</span>
              <span className="font-bold text-blue-800 dark:text-blue-300">
                Zagotovka, Oshxona, Sex
              </span>
            </div>
          </div>

          {/* BRAK CARD */}
          <div
            onClick={() => openOperationsModal('brak')}
            className="group relative overflow-hidden bg-rose-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-rose-500/30 hover:border-rose-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                  <AlertTriangle size={24} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                  {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
                </span>
              </div>

              <span className="text-xs font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
                {formatDual("Brak va chiqindi", "Брак и отходы", "Defects & Waste")}
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatDual("Sifat nazorati", "Контроль качества", "Quality Control")}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                {formatDual(
                  "Qadoqlash taralari braki, texnologik chiqindi va sabablar tahlili",
                  "Брак тары, технологические отходы и анализ причин",
                  "Packaging defects, technological loss & root cause logs"
                )}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-500/25 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {formatDual("Manba:", "Источник:", "Source:")}
              </span>
              <span className="font-bold text-rose-800 dark:text-rose-300">
                {formatDual("Qadoqlash sexi (Taralar)", "Цех упаковки (Тара)", "Packaging workshop")}
              </span>
            </div>
          </div>

          {/* OMBORXONA (QOLDIQ) CARD */}
          <div
            onClick={() => openOperationsModal('ombor')}
            className="group relative overflow-hidden bg-indigo-50/80 dark:bg-dark-900 p-5 rounded-3xl border-2 border-indigo-500/30 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Package size={24} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  {formatDual("Zanjir", "Цепочка", "Chain")} &rarr;
                </span>
              </div>

              <span className="text-xs font-extrabold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                {formatDual("Omborxona qoldig'i", "Складской остаток", "Warehouse Stock")}
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatDual("Zaxira va qoldiqlar", "Запасы и остатки", "Stock & Balances")}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                {formatDual(
                  "Mahsulotlar kesimida qoldiq, sarf, muddatlar va yetish tahlili",
                  "Остатки по позициям, расход, сроки годности и анализ запаса",
                  "Stock per product, consumption, shelf life & coverage analysis"
                )}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-500/25 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {formatDual("Holati:", "Статус:", "Status:")}
              </span>
              <span className="font-bold text-indigo-800 dark:text-indigo-300">
                {formatDual("Doimiy monitoring", "Постоянный мониторинг", "Active monitoring")}
              </span>
            </div>
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
      {/* 4.5. EXECUTIVE CHARTS & DIAGRAMS */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {formatDual("Grafiklar va dinamika", "Графика и динамика", "Analytics & trends")}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDual("Operatsion ko'rsatkichlar tahlili", "Анализ ключевых показателей", "Key performance metrics")}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Daily Trends (AreaChart) - spans 2 cols on lg */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  {formatDual("Kunlik dinamika", "Дневная динамика", "Daily trend")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Xomashyo (kg), quti va brak (kg)", "Сырье (кг), коробки и брак (кг)", "Raw (kg), boxes and reject (kg)")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {formatDual("Kirim (kg)", "Прием (кг)", "Arrivals (kg)")}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  {formatDual("Mahsulot (quti)", "Выпуск (кор.)", "Output (box)")}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  {formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {mounted && dailyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
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
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      }}
                      labelFormatter={(label) => `Sana: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="arrivalsKg"
                      name={formatDual("Kirim (kg)", "Прием (кг)", "Arrivals (kg)")}
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorArrivals)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outputBoxes"
                      name={formatDual("Mahsulot (quti)", "Выпуск (кор.)", "Output (box)")}
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOutput)"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejectedKg"
                      name={formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReject)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Tanlangan davr uchun ma'lumotlar mavjud emas", "Нет данных за выбранный период", "No data available for selected period")}
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Stock Traffic Light Donut Chart */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {formatDual("Ombor zaxirasi", "Складские остатки", "Stock balance")}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
                  {details?.productStockDetails?.length || 0} SKU
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {formatDual("Svetofor qoidasi bo'yicha", "По правилу светофора", "Traffic light status")}
              </p>

              <div className="h-[200px] w-full relative flex items-center justify-center">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stockDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${val} ${formatDual('ta', 'позиций', 'items')}`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center text in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {formatDual("Yetarli", "В норме", "Sufficiency")}
                  </span>
                  <span className="text-xl font-black text-emerald-500">
                    {kpis?.warehouse?.sufficiencyRate != null ? `${kpis.warehouse.sufficiencyRate}%` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stock indicators */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-dark-800 mt-2">
              <div className="text-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {kpis?.warehouse?.sufficientCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Yetarli", "В норме", "Sufficient")}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {kpis?.warehouse?.lowStockCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Kam qolgan", "Мало", "Low")}
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {kpis?.warehouse?.outOfStockCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDual("Tugagan", "Закончилось", "Out")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second row of charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Shift comparison (BarChart) */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ChefHat size={16} className="text-indigo-500" />
                  {formatDual("Smenalar taqqoslashi", "Сравнение смен", "Shift comparison")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("1 va 2-smena mahsuloti va braki", "Выпуск и брак 1 и 2 смены", "Output vs rejects")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('production')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {formatDual("Batafsil", "Подробнее", "Details")}
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="h-[240px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="shift" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="outputBoxes"
                      name={formatDual("Tayyor mahsulot (quti)", "Выпуск (кор.)", "Output (boxes)")}
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="rejectedKg"
                      name={formatDual("Brak / Chiqindi (kg)", "Брак (кг)", "Reject (kg)")}
                      fill="#f43f5e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Chart 4: Top Employee Activity (BarChart) */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  {formatDual("Xodimlar faolligi", "Активность сотрудников", "Staff activity")}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDual("Amallar va operatsiyalar soni", "Количество операций", "Action count")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal('employees')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {formatDual("Barchasi", "Все", "All")}
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="h-[240px] w-full">
              {mounted && employeeActivityChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeActivityChart}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} ${formatDual('ta', 'операций', 'actions')}`,
                        name === 'actions' ? formatDual("Jami amallar", "Всего действий", "Total actions") : name,
                      ]}
                    />
                    <Bar
                      dataKey="actions"
                      name={formatDual("Jami amallar", "Всего действий", "Total actions")}
                      fill="#3b82f6"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  {formatDual("Xodimlar faoliyati topilmadi", "Нет данных об активности", "No staff activity data")}
                </div>
              )}
            </div>
          </div>
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
                  <p className="text-xs text-slate-500">
                    {activeModal === 'employees'
                      ? formatDual("5 ta asosiy bo'lim faoliyati va kunlik, haftalik hamda oylik qilingan ishlar nazorati", "Контроль деятельности 5 ключевых отделов, ежедневных, еженедельных и ежемесячных задач", "Monitoring of 5 core departments and daily, weekly, and monthly completed tasks")
                      : activeModal === 'operations'
                      ? operationsTab === 'prixod'
                        ? formatDual("Ombor va sexlarga xomashyo qabuli", "Прием сырья и материалов на склад и в цеха", "Inbound arrivals and materials")
                        : operationsTab === 'rasxod'
                        ? formatDual("Sexlarga xomashyo chiqimi va sarfi", "Расход сырья по цехам", "Material consumption")
                        : operationsTab === 'brak'
                        ? formatDual("Brak va texnologik chiqindi dalolatnomalari", "Акты брака и отходов", "Defect and scrap records")
                        : formatDual("Ombordagi barcha xomashyo va taralar qoldig'i tahlili", "Анализ остатков сырья и тары на складе", "Warehouse material and packaging stock analysis")
                      : formatDual("Saqlangan rasmiy ma'lumotlar", "Официальные данные", "Official records")}
                  </p>
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
              {activeModal === 'warehouse' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                      {formatDual("Mahsulotlar qoldig'i (Svetofor)", "Остатки продукции (Светофор)", "Stock balances (Traffic light)")}:
                    </h4>
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
                          {filteredProducts.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                              <td className="p-3 text-center font-bold font-mono">{p.currentStock} {p.unit}</td>
                              <td className="p-3 text-center text-slate-500">
                                {p.approvedMaxStorageDays ? `${p.approvedMaxStorageDays} kun` : 'Kiritilmagan'}
                              </td>
                              <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                {p.avgDailyConsumptionKg ? `${p.avgDailyConsumptionKg} ${p.unit}/kun` : '—'}
                              </td>
                              <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400">
                                {p.maxRecommendedStockKg ? `${p.maxRecommendedStockKg} ${p.unit}` : '—'}
                              </td>
                              <td className="p-3 text-center font-mono">
                                {p.stockCoverageDays != null ? `${p.stockCoverageDays} kun (${p.stockCoverageWeeks ?? '-'} hafta)` : '—'}
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
                              <th className="p-3">{formatDual("Holat", "Статус", "Status")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                            {filteredTransfers.map((tr: any) => (
                              <tr key={tr.id}>
                                <td className="p-3 text-slate-500">{new Date(tr.createdAt).toLocaleDateString(dateLocale)}</td>
                                <td className="p-3 font-bold">{tr.product?.name || formatDual("Mahsulot", "Продукт", "Product")}</td>
                                <td className="p-3 text-indigo-600 font-medium">{tr.issuedByName || formatDual("Skladchi", "Кладовщик", "Warehouse worker")}</td>
                                <td className="p-3 text-purple-600 font-medium">{tr.receivedByName || formatDual("Oshpaz/Usta", "Повар/Мастер", "Chef/Supervisor")}</td>
                                <td className="p-3 text-center">{tr.issuedQuantity} {tr.issuedUnit}</td>
                                <td className="p-3 text-center">{tr.receivedQuantity ?? '-'} {tr.issuedUnit}</td>
                                <td className={`p-3 text-center font-bold ${tr.discrepancy > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {tr.discrepancy ? `${tr.discrepancy} ${tr.issuedUnit}` : '0'}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {tr.status}
                                  </span>
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
                            <th className="p-3.5 text-center">{formatDual("Brak (kg)", "Брак (кг)", "Reject (kg)")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredChecklists.map((c: any) => (
                            <tr
                              key={c.id}
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
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    {formatDual("Xomashyo qabuli aktlari", "Акты приема сырья", "Raw arrivals acts")}:
                  </h4>
                  {filteredInspections.length === 0 ? (
                    <p className="text-slate-400 italic p-4 text-center">{formatDual("Qabul yozuvlari topilmadi", "Записи приемок не найдены", "No arrival records found")}</p>
                  ) : (
                    <div className="border border-slate-200 dark:border-dark-700 rounded-2xl overflow-x-auto shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 font-bold text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-3">{formatDual("Sana", "Дата", "Date")}</th>
                            <th className="p-3">{formatDual("Mahsulot", "Продукт", "Product")}</th>
                            <th className="p-3">{formatDual("Ta'minotchi", "Поставщик", "Supplier")}</th>
                            <th className="p-3">{formatDual("Tekshiruvchi", "Проверил", "Inspector")}</th>
                            <th className="p-3 text-center">{formatDual("Miqdor (kg)", "Кол-во (кг)", "Qty (kg)")}</th>
                            <th className="p-3 text-center">{formatDual("Holat", "Статус", "Status")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                          {filteredInspections.map((insp: any) => (
                            <tr key={insp.id}>
                              <td className="p-3 text-slate-500">{insp.date || new Date(insp.createdAt).toLocaleDateString(dateLocale)}</td>
                              <td className="p-3 font-bold">{insp.nomenclature || insp.product?.name || formatDual("Xomashyo", "Сырье", "Raw material")}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{insp.supplier?.name || insp.supplier || "-"}</td>
                              <td className="p-3 text-indigo-600 font-bold">{insp.user?.name || insp.inspector || formatDual("Nazoratchi", "Инспектор", "Inspector")}</td>
                              <td className="p-3 text-center font-black">{insp.quantity} kg</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  insp.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                  insp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {insp.status === 'ACCEPTED' ? formatDual("Qabul", "Принято", "Accepted") :
                                   insp.status === 'REJECTED' ? formatDual("Rad etildi", "Отклонено", "Rejected") :
                                   (insp.status || formatDual("Qabul", "Принято", "Accepted"))}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

                        return (
                          <div className="space-y-5">
                            {/* Top Navigation & Department Title */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-dark-700">
                              <div>
                                <button
                                  onClick={() => setSelectedDepartment(null)}
                                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mb-2 flex items-center gap-1.5 transition-transform hover:-translate-x-0.5"
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
                                    onClick={() => setDeptPeriodFilter(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
                            {activeDeptActions.length === 0 ? (
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
                                    onClick={() => setDeptPeriodFilter('week')}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100"
                                  >
                                    {formatDual("Haftalik nazorat", "Недельный контроль", "Weekly control")} ({weekActions.length})
                                  </button>
                                  <button
                                    onClick={() => setDeptPeriodFilter('month')}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100"
                                  >
                                    {formatDual("Oylik nazorat", "Месячный контроль", "Monthly control")} ({monthActions.length})
                                  </button>
                                  <button
                                    onClick={() => setDeptPeriodFilter('all')}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
                                  >
                                    {formatDual("Barcha amallar", "Все действия", "All actions")} ({allDeptActions.length})
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {activeDeptActions.map((act: any, idx: number) => (
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
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                          <Clock size={12} />
                                          {act.date ? new Date(act.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }) : ''}{' '}
                                          {act.date ? new Date(act.date).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                    ? `${formatDual("Oxirgi:", "Посл.:", "Last:")} ${new Date(latestAction.date).toLocaleDateString(dateLocale, { month: 'numeric', day: 'numeric' })} ${new Date(latestAction.date).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`
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
                    alerts.map((al) => (
                      <div
                        key={al.id}
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
                  {(details.recentSurveys || []).map((s: any) => (
                    <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white">{s.title}</h5>
                        <span className="text-xs text-slate-500 font-bold">{s.responses?.length || 0} ta javob</span>
                      </div>
                      <div className="space-y-2">
                        {(s.responses || []).slice(0, 5).map((resp: any) => (
                          <div key={resp.id} className="bg-white dark:bg-dark-900 p-2.5 rounded-xl border border-slate-200 dark:border-dark-750 text-xs">
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
                        .map((evt) => (
                          <div
                            key={evt.id}
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
    </div>
  )
}

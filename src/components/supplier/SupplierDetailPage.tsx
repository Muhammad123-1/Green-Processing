'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Truck,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Plus,
  RefreshCw,
  Edit,
  ShieldCheck,
  UserX,
  UserCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Boxes
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface SupplierUser {
  id: number
  name: string
  username: string
  password?: string
  role: string
  isActive: boolean
  createdAt: string
}

interface OrderItem {
  id: number
  productId: number
  quantity: number
  unit: string | null
  expectedDate: string
  timeRange: string | null
  deliveredQuantity: number | null
  acceptedQuantity: number | null
  rejectedQuantity: number | null
  status: string
  price: number | null
  notes: string | null
  createdAt: string
  product?: {
    id: number
    name: string
    unit: string
    category: string
  }
  inspections?: Array<{
    id: number
    actNumber: string
    status: string
    quantity: number
    acceptedQuantity: number | null
    rejectedQuantity: number | null
    inspectionDate: string
    conclusion: string | null
  }>
}

interface ArrivalItem {
  id: number
  date: string
  nomenclature: string
  quantity: number
  supplier: string | null
  batch: string | null
}

interface SupplierDetailProps {
  supplierId: number
}

export default function SupplierDetailPage({ supplierId }: SupplierDetailProps) {
  const { lang, formatDual } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState<any>(null)
  const [arrivals, setArrivals] = useState<ArrivalItem[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalDeliveredKg: 0,
    arrivalsCount: 0
  })

  // Active sub-tab
  const [tab, setTab] = useState<'orders' | 'arrivals' | 'chat' | 'details'>('orders')

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Edit / Reset password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // New Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [productsList, setProductsList] = useState<any[]>([])
  const [orderForm, setOrderForm] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: '',
    timeRange: '09:00 - 12:00',
    price: '',
    notes: ''
  })
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyName)
    toast.success(formatDual("Nusxalandi!", "Скопировано!", "Copied!"))
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const loadSupplierData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`)
      if (!res.ok) {
        throw new Error(formatDual("Ta'minotchi ma'lumotlarini yuklab bo'lmadi", "Ошибка загрузки", "Failed to load supplier"))
      }
      const data = await res.json()
      setSupplier(data.supplier)
      setArrivals(data.arrivals || [])
      if (data.stats) setStats(data.stats)
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }, [supplierId, formatDual])

  useEffect(() => {
    loadSupplierData()
  }, [loadSupplierData])

  // Load products for new order modal
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(prods => setProductsList(Array.isArray(prods) ? prods : []))
      .catch(() => {})
  }, [])

  // Poll chat messages when on chat tab
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/supplier-portal/chat?supplierId=${supplierId}`)
      if (res.ok) {
        const data = await res.json()
        setChatMessages(data.messages || [])
      }
    } catch {}
  }, [supplierId])

  useEffect(() => {
    if (tab !== 'chat') return
    fetchChat()
    const timer = setInterval(fetchChat, 4000)
    return () => clearInterval(timer)
  }, [tab, fetchChat])

  // Send chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatSending) return
    const text = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    try {
      const res = await fetch('/api/supplier-portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, text })
      })
      if (res.ok) {
        fetchChat()
      }
    } catch {
      setChatInput(text)
    } finally {
      setChatSending(false)
    }
  }

  // Handle password reset
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const userAccount = supplier?.users?.[0]
    if (!userAccount || !newPassword.trim()) return

    setSavingPassword(true)
    try {
      const res = await fetch('/api/admin/supplier-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userAccount.id,
          password: newPassword.trim()
        })
      })
      if (!res.ok) throw new Error("Parolni saqlab bo'lmadi")

      toast.success(formatDual("Yangi parol saqlandi!", "Новый пароль сохранен!", "Password updated!"))
      setShowPasswordModal(false)
      setNewPassword('')
      loadSupplierData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    } finally {
      setSavingPassword(false)
    }
  }

  // Handle Create New Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderForm.productId || !orderForm.quantity) {
      toast.error(formatDual("Mahsulot va miqdorni kiriting", "Укажите товар и количество", "Specify product and quantity"))
      return
    }

    setSubmittingOrder(true)
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: orderForm.productId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          quantity: orderForm.quantity,
          unit: orderForm.unit,
          expectedDate: orderForm.expectedDate || tomorrow.toISOString().split('T')[0],
          timeRange: orderForm.timeRange,
          price: orderForm.price || null,
          notes: orderForm.notes || null,
          status: 'PENDING'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Zayavka yaratib bo\'lmadi')
      }

      toast.success(formatDual("Yangi xarid zayavkasi yuborildi!", "Заказ успешно отправлен!", "Order created!"))
      setShowNewOrderModal(false)
      setOrderForm({
        productId: '',
        quantity: '',
        unit: 'kg',
        expectedDate: '',
        timeRange: '09:00 - 12:00',
        price: '',
        notes: ''
      })
      loadSupplierData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 size={36} className="animate-spin text-emerald-500 mb-3" />
        <p className="font-semibold text-sm">{formatDual("Ta'minotchi sahifasi yuklanmoqda...", "Загрузка страницы поставщика...", "Loading supplier page...")}</p>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <Building2 size={48} className="mx-auto text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {formatDual("Ta'minotchi topilmadi", "Поставщик не найден", "Supplier not found")}
        </h2>
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm"
        >
          <ArrowLeft size={16} />
          <span>{formatDual("Ta'minotchilar ro'yxatiga qaytish", "Назад к поставщикам", "Back to suppliers")}</span>
        </Link>
      </div>
    )
  }

  const userAccount: SupplierUser | undefined = supplier.users?.[0]
  const orders: OrderItem[] = supplier.orders || []

  // SMS / Telegram share text
  const shareText = `Green Processing Zavodi — Yetkazib Beruvchi Portali:\nSayt: https://green-processing.uz/supplier-portal\nLogin: ${userAccount?.username || '—'}\nParol: ${userAccount?.password || '—'}\n(Ushbu ma'lumotlar bilan portalga kirib kelayotgan buyurtmalarni kuzatishingiz mumkin)`

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-enter">
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>{formatDual("Ta'minotchilar Katalogiga Qaytish", "К списку поставщиков", "Back to Suppliers")}</span>
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadSupplierData}
            className="p-2.5 rounded-xl bg-white dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-750 transition-colors shadow-xs"
            title={formatDual("Yangilash", "Обновить", "Refresh")}
          >
            <RefreshCw size={16} />
          </button>

          <a
            href={`/supplier-portal?supplierId=${supplier.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-bold transition-all shadow-xs"
          >
            <ExternalLink size={14} />
            <span>{formatDual("Yetkazib Beruvchi Portalini Ochish", "Открыть кабинет поставщика", "Open Supplier Portal")}</span>
          </a>

          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setOrderForm({
                productId: '',
                quantity: '',
                unit: 'kg',
                expectedDate: tomorrow.toISOString().split('T')[0],
                timeRange: '09:00 - 12:00',
                price: '',
                notes: ''
              })
              setShowNewOrderModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>{formatDual("+ Yangi Zayavka Yuborish", "+ Новый заказ", "+ New Purchase Order")}</span>
          </button>
        </div>
      </div>

      {/* 2. SUPPLIER MAIN HERO CARD */}
      <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-6 sm:p-7 rounded-3xl shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                {supplier.category || formatDual("Xomashyo Ta'minotchisi", "Поставщик сырья", "Raw Supplier")}
              </span>
              {supplier.shortName && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
                  {supplier.shortName}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ID #{supplier.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Building2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={32} />
              <span>{supplier.name}</span>
            </h1>

            {/* Contact details */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-600 dark:text-slate-300 pt-1">
              {supplier.phone && (
                <div className="flex items-center gap-1.5 font-semibold">
                  <Phone size={14} className="text-emerald-500" />
                  <a href={`tel:${supplier.phone}`} className="hover:underline">{supplier.phone}</a>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-500" />
                  <span>{supplier.address}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-blue-500" />
                  <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ⭐ PROMINENT PORTAL ACCESS CARD (LOGIN VA PAROL KO'RINIB TURADI) ⭐ */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <KeyRound size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{formatDual("Ta'minotchi Portali Kirish Ma'lumotlari", "Доступ к кабинету поставщика (Логин & Пароль)", "Supplier Portal Credentials")}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {formatDual(
                    "Ushbu login va parol orqali ta'minotchi o'z portaliga kirib buyurtmalarni ko'radi.",
                    "Логин и пароль, по которым поставщик заходит в свой личный кабинет.",
                    "Credentials for the supplier to log in and review purchase orders."
                  )}
                </p>
              </div>
            </div>

            {/* Credentials Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Username pill */}
              <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xs">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{formatDual("Login:", "Логин:", "Login:")}</span>
                <span className="font-mono font-black text-sm text-teal-700 dark:text-teal-300">
                  @{userAccount?.username || '—'}
                </span>
                {userAccount?.username && (
                  <button
                    onClick={() => copyToClipboard(userAccount.username, 'username')}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title={formatDual("Logini nusxalash", "Скопировать логин", "Copy login")}
                  >
                    {copiedKey === 'username' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {/* Password pill (CLEARLY VISIBLE / PAROLI BILAN KO'RINIB TURADI) */}
              <div className="bg-white dark:bg-dark-900 border-2 border-amber-500/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xs">
                <span className="text-xs text-amber-600 dark:text-amber-400 uppercase font-black tracking-wider flex items-center gap-1">
                  <Lock size={13} />
                  <span>{formatDual("Parol:", "Пароль:", "Pass:")}</span>
                </span>
                <span className="font-mono font-black text-base text-amber-900 dark:text-amber-300 tracking-wider">
                  {showPassword ? (userAccount?.password || '—') : '••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title={showPassword ? formatDual("Yashirish", "Скрыть", "Hide") : formatDual("Ko'rsatish", "Показать", "Show")}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {userAccount?.password && (
                  <button
                    onClick={() => copyToClipboard(userAccount.password!, 'password')}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title={formatDual("Parolni nusxalash", "Скопировать пароль", "Copy password")}
                  >
                    {copiedKey === 'password' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {/* Status */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                userAccount?.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
              }`}>
                {userAccount?.isActive ? <ShieldCheck size={14} /> : <UserX size={14} />}
                <span>{userAccount?.isActive ? formatDual("Akkaunt Faol", "Аккаунт активен", "Active") : formatDual("Bloklangan", "Заблокирован", "Blocked")}</span>
              </span>
            </div>
          </div>

          {/* Action buttons on credential card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => copyToClipboard(shareText, 'share')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 border border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-xs"
              title={formatDual("SMS yoki Telegram uchun matnni nusxalash", "Копировать текст для отправки поставщику", "Copy text for SMS/Telegram")}
            >
              {copiedKey === 'share' ? <Check size={15} className="text-emerald-500" /> : <Send size={15} className="text-blue-500" />}
              <span>{formatDual("Ta'minotchiga Yuborish Uchun Nusxalash", "Скопировать для отправки", "Copy for SMS / Telegram")}</span>
            </button>

            <button
              onClick={() => {
                setNewPassword('')
                setShowPasswordModal(true)
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Edit size={14} />
              <span>{formatDual("Parolni O'zgartirish", "Сменить пароль", "Change Password")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. KPI STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Orders */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{formatDual("Jami Zayavkalar", "Всего заказов", "Total Orders")}</span>
            <Package size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalOrders} ta
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>{formatDual("Kutilmoqda", "Ожидается", "Pending")}</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingOrders} ta
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>{formatDual("Yo'lda", "В пути", "In Transit")}</span>
            <Truck size={14} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {stats.inTransitOrders} ta
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>{formatDual("Yetkazildi", "Доставлено", "Delivered")}</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.deliveredOrders} ta
          </div>
        </div>

        {/* Total Delivered Volume */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center justify-between">
            <span>{formatDual("Yetkazilgan Hajm", "Объем поставок", "Volume")}</span>
            <Boxes size={14} className="text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {stats.totalDeliveredKg.toLocaleString()} kg
          </div>
        </div>
      </div>

      {/* 5. TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-dark-750 pb-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            tab === 'orders'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
        >
          <Package size={16} />
          <span>{formatDual("1. Xarid Zayavkalari (Buyurtmalar)", "1. Заказы на поставку", "1. Purchase Orders")}</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs">{orders.length}</span>
        </button>

        <button
          onClick={() => setTab('arrivals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            tab === 'arrivals'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
        >
          <Truck size={16} />
          <span>{formatDual("2. Zavodga Kirim Tarixi (Prihod)", "2. История приходов на склад", "2. Arrivals History")}</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs">{arrivals.length}</span>
        </button>

        <button
          onClick={() => setTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            tab === 'chat'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
        >
          <MessageSquare size={16} />
          <span>{formatDual("3. Ta'minotchi bilan Chat (1-on-1)", "3. Чат с поставщиком", "3. Chat with Supplier")}</span>
        </button>

        <button
          onClick={() => setTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            tab === 'details'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
          }`}
        >
          <Building2 size={16} />
          <span>{formatDual("4. Kompaniya Rekvizitlari", "4. Реквизиты компании", "4. Company Details")}</span>
        </button>
      </div>

      {/* 6. TAB CONTENTS */}

      {/* TAB 1: ORDERS */}
      {tab === 'orders' && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {formatDual("Korxonadan Ushbu Ta'minotchiga Yuborilgan Buyurtmalar", "Заказы отправленные данному поставщику", "Purchase Orders to this Supplier")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDual("Barcha xarid zayavkalari, muddatlari va qabul aktlari", "Все заказы предприятия, сроки и статус приемки", "All purchase orders, schedules and acceptance")}
              </p>
            </div>
            <button
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                setOrderForm({
                  productId: '',
                  quantity: '',
                  unit: 'kg',
                  expectedDate: tomorrow.toISOString().split('T')[0],
                  timeRange: '09:00 - 12:00',
                  price: '',
                  notes: ''
                })
                setShowNewOrderModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
            >
              <Plus size={14} />
              <span>{formatDual("Yangi Buyurtma", "Новый заказ", "New Order")}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800/80 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">{formatDual("ZAYAVKA №", "ЗАКАЗ №", "ORDER #")}</th>
                  <th className="py-3.5 px-4">{formatDual("MAHSULOT / XOMASHYO", "ТОВАР / СЫРЬЕ", "PRODUCT")}</th>
                  <th className="py-3.5 px-4 text-center">{formatDual("BUYURTMA", "ЗАКАЗАНО", "ORDERED")}</th>
                  <th className="py-3.5 px-4 text-center">{formatDual("KELGAN", "ПРИВЕЗЕНО", "DELIVERED")}</th>
                  <th className="py-3.5 px-4 text-center">{formatDual("QABUL", "ПРИНЯТО", "ACCEPTED")}</th>
                  <th className="py-3.5 px-4 text-center">{formatDual("HOLAT", "СТАТУС", "STATUS")}</th>
                  <th className="py-3.5 px-4">{formatDual("KELISH VAQTI", "СРОК", "EXPECTED")}</th>
                  <th className="py-3.5 px-4 text-right">{formatDual("NARX (SO'M)", "ЦЕНА", "PRICE")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-750/70">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <Package size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold">{formatDual("Hozircha buyurtmalar mavjud emas", "Заказов пока нет", "No orders yet")}</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-dark-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-blue-600 dark:text-blue-400">
                        #{ord.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{ord.product?.name || "Noma'lum"}</span>
                        <span className="text-[10px] text-slate-500">{ord.product?.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {ord.quantity.toLocaleString()} {ord.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {ord.deliveredQuantity !== null ? `${ord.deliveredQuantity.toLocaleString()} ${ord.unit}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.acceptedQuantity !== null ? `${ord.acceptedQuantity.toLocaleString()} ${ord.unit}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : ord.status === 'IN_TRANSIT'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30'
                            : ord.status === 'DELAYED'
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        <div>{new Date(ord.expectedDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{ord.timeRange}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {ord.price ? `${ord.price.toLocaleString()} so'm` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ARRIVALS (PRIHOD) */}
      {tab === 'arrivals' && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {formatDual("Zavodga Haqiqatda Qabul Qilingan Xomashyo Kirimlari (ShopArrival)", "Фактические приходы сырья на завод", "Actual Factory Arrivals")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDual("Sex hisobotidan ushbu ta'minotchi nomi bilan kirim bo'lgan yozuvlar", "Записи из отчетов цеха, поступившие от данного поставщика", "Inflow records from shop reports linked to this supplier")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800/80 border-b border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">{formatDual("SANA", "ДАТА", "DATE")}</th>
                  <th className="py-3.5 px-4">{formatDual("XOMASHYO NOMI", "НАИМЕНОВАНИЕ", "NOMENCLATURE")}</th>
                  <th className="py-3.5 px-4 text-center">{formatDual("MIQDOR (KG)", "КОЛИЧЕСТВО", "QUANTITY")}</th>
                  <th className="py-3.5 px-4">{formatDual("PARTIYA RAQAMI", "ПАРТИЯ", "BATCH")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-750/70">
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      <Truck size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold">{formatDual("Ushbu ta'minotchidan hali kirim yozuvlari topilmadi", "Приходов от этого поставщика пока нет", "No arrivals found for this supplier")}</p>
                    </td>
                  </tr>
                ) : (
                  arrivals.map((arr) => (
                    <tr key={arr.id} className="hover:bg-slate-50/70 dark:hover:bg-dark-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {arr.date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {arr.nomenclature}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {Number(arr.quantity).toLocaleString()} kg
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {arr.batch || `#${arr.id}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 1-ON-1 CHAT */}
      {tab === 'chat' && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[550px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center font-black">
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{supplier.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatDual("Ta'minotchi bilan to'g'ridan-to'g'ri aloqa kanali", "Прямой канал связи с поставщиком", "Direct channel with supplier")}
                </p>
              </div>
            </div>
            <button
              onClick={fetchChat}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              title="Yangilash"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-dark-950/20">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <MessageSquare size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
                <p>{formatDual("Hali xabarlar mavjud emas. Birinchi xabarni yozing!", "Сообщений нет. Напишите первое сообщение!", "No messages yet. Send the first message!")}</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isFactory = msg.sender !== 'SUPPLIER'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isFactory ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1 font-semibold">
                      {isFactory ? formatDual("Korxona (Siz)", "Предприятие", "Factory") : supplier.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                        isFactory
                          ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                          : 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white border border-slate-200 dark:border-dark-700 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 flex items-center gap-2">
            <input
              type="text"
              placeholder={formatDual("Ta'minotchiga xabar yozish...", "Написать поставщику...", "Type message to supplier...")}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatSending}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {chatSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{formatDual("Yuborish", "Отправить", "Send")}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: COMPANY DETAILS */}
      {tab === 'details' && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            {formatDual("Kompaniya Rasmiy Rekvizitlari", "Официальные реквизиты", "Company Details")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("To'liq Nomi:", "Полное наименование:", "Full Name:")}</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{supplier.name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("Qisqartirilgan Nomi (Brend):", "Краткое имя:", "Short Name:")}</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{supplier.shortName || '—'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("Telefon Raqami:", "Телефон:", "Phone:")}</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">{supplier.phone || '—'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("Email Pochta:", "Эл. почта:", "Email:")}</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{supplier.email || '—'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700 sm:col-span-2">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("Yuridik Manzil:", "Юридический адрес:", "Address:")}</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{supplier.address || '—'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700 sm:col-span-2">
              <span className="text-slate-400 block font-bold mb-1">{formatDual("Sertifikat / Guvohnoma:", "Сертификат / Лицензия:", "Certificate:")}</span>
              <span className="font-mono text-slate-900 dark:text-white text-xs">{supplier.certificate || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-amber-500" />
                <span>{formatDual("Parolni O'zgartirish", "Смена пароля", "Change Password")}</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {formatDual("Ta'minotchi:", "Поставщик:", "Supplier:")}
                </label>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {supplier.name} (@{userAccount?.username})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {formatDual("Yangi Parol:", "Новый пароль:", "New Password:")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Yangi parolni kiriting (masalan: gp12345)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW ORDER TO THIS SUPPLIER */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                <span>{formatDual("Yangi Xarid Zayavkasi", "Новый заказ поставщику", "New Purchase Order")}</span>
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {formatDual("Ta'minotchi:", "Поставщик:", "Supplier:")}
                </label>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {supplier.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {formatDual("Mahsulot / Xomashyo tanlang:", "Выберите товар:", "Select Product:")}
                </label>
                <select
                  required
                  value={orderForm.productId}
                  onChange={(e) => {
                    const p = productsList.find(x => x.id === parseInt(e.target.value))
                    setOrderForm({
                      ...orderForm,
                      productId: e.target.value,
                      unit: p?.unit || 'kg'
                    })
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">{formatDual("-- Mahsulotni tanlang --", "-- Выберите товар --", "-- Select product --")}</option>
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit || 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {formatDual("Miqdor:", "Количество:", "Quantity:")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1000"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {formatDual("O'lchov birligi:", "Ед. изм.:", "Unit:")}
                  </label>
                  <input
                    type="text"
                    value={orderForm.unit}
                    onChange={(e) => setOrderForm({ ...orderForm, unit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {formatDual("Kutilayotgan Sana:", "Дата привоза:", "Expected Date:")}
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.expectedDate}
                    onChange={(e) => setOrderForm({ ...orderForm, expectedDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {formatDual("Kutilayotgan Vaqt:", "Время:", "Time Range:")}
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 - 12:00"
                    value={orderForm.timeRange}
                    onChange={(e) => setOrderForm({ ...orderForm, timeRange: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {formatDual("Izoh (ixtiyoriy):", "Примечание:", "Notes:")}
                </label>
                <textarea
                  rows={2}
                  placeholder="Haydovchi telefoni, sifat talablari..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder || !orderForm.productId || !orderForm.quantity}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  {submittingOrder ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{formatDual("Zayavkani Yuborish", "Отправить заказ", "Send Order")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

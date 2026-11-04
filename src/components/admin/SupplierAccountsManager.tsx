'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  KeyRound,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Building2,
  Phone,
  Copy,
  Check,
  RefreshCw,
  Edit,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  UserCheck,
  UserX,
  Truck,
  MessageSquare,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface SupplierAccountUser {
  id: number
  name: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  supplier?: {
    id: number
    name: string
    phone: string | null
    category: string
  } | null
}

interface SupplierItem {
  id: number
  name: string
  shortName: string | null
  phone: string | null
  address: string | null
  category: string
  users: Array<{
    id: number
    name: string
    username: string
    isActive: boolean
    createdAt: string
  }>
  _count?: {
    orders: number
  }
}

export default function SupplierAccountsManager() {
  const { lang, formatDual } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [supplierUsers, setSupplierUsers] = useState<SupplierAccountUser[]>([])
  const [search, setSearch] = useState('')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Password reset modal
  const [resetUser, setResetUser] = useState<SupplierAccountUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  // Copied success banner modal (to share credentials)
  const [createdCredentials, setCreatedCredentials] = useState<{
    supplierName: string
    username: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Direct Chat with Supplier Modal
  const [chatSupplier, setChatSupplier] = useState<SupplierItem | null>(null)
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([])
  const [adminChatInput, setAdminChatInput] = useState('')
  const [adminChatSending, setAdminChatSending] = useState(false)

  const fetchAdminChat = useCallback(async (sId: number) => {
    try {
      const res = await fetch(`/api/supplier-portal/chat?supplierId=${sId}`)
      if (res.ok) {
        const data = await res.json()
        setAdminChatMessages(data.messages || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!chatSupplier) return
    fetchAdminChat(chatSupplier.id)
    const interval = setInterval(() => {
      fetchAdminChat(chatSupplier.id)
    }, 4500)
    return () => clearInterval(interval)
  }, [chatSupplier, fetchAdminChat])

  const handleSendAdminChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatSupplier || !adminChatInput.trim() || adminChatSending) return

    const textToSend = adminChatInput.trim()
    setAdminChatInput('')
    setAdminChatSending(true)

    try {
      const res = await fetch('/api/supplier-portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: chatSupplier.id,
          text: textToSend
        })
      })
      if (res.ok) {
        fetchAdminChat(chatSupplier.id)
      }
    } catch {
      setAdminChatInput(textToSend)
    } finally {
      setAdminChatSending(false)
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/supplier-accounts')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      const data = await res.json()
      setSuppliers(data.suppliers || [])
      setSupplierUsers(data.supplierUsers || [])
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Generate random password
  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    let pass = ''
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  // Auto-generate username when supplier is chosen
  const handleSelectSupplier = (sId: string) => {
    setSelectedSupplierId(sId)
    const sup = suppliers.find(s => s.id === parseInt(sId))
    if (sup) {
      setName(sup.name)
      // Clean translit / slug for username
      const slug = (sup.shortName || sup.name)
        .toLowerCase()
        .replace(/['`"”’]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20)
      setUsername(slug || 'taminotchi')
      generatePassword()
    }
  }

  // Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId || !username || !password) {
      toast.error(formatDual("Barcha maydonlarni to'ldiring", "Заполните все поля", "Fill all fields"))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/supplier-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          name,
          username,
          password
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Akkaunt yaratishda xatolik')
      }

      const sup = suppliers.find(s => s.id === parseInt(selectedSupplierId))
      setCreatedCredentials({
        supplierName: sup?.name || name,
        username,
        password
      })

      toast.success(formatDual("Ta'minotchi akkaunti yaratildi!", "Аккаунт поставщика создан!", "Supplier account created!"))
      setShowCreateModal(false)
      setSelectedSupplierId('')
      setUsername('')
      setPassword('')
      setName('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle user active status
  const handleToggleActive = async (user: SupplierAccountUser) => {
    try {
      const res = await fetch('/api/admin/supplier-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isActive: !user.isActive
        })
      })
      if (!res.ok) throw new Error('Xatolik')
      toast.success(
        !user.isActive
          ? formatDual("Akkaunt faollashtirildi", "Аккаунт активирован", "Account activated")
          : formatDual("Akkaunt bloklandi", "Аккаунт заблокирован", "Account blocked")
      )
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    }
  }

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUser || !newPassword.trim()) return

    setResetting(true)
    try {
      const res = await fetch('/api/admin/supplier-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetUser.id,
          password: newPassword.trim()
        })
      })
      if (!res.ok) throw new Error('Parol yangilanmadi')

      setCreatedCredentials({
        supplierName: resetUser.supplier?.name || resetUser.name,
        username: resetUser.username,
        password: newPassword.trim()
      })

      toast.success(formatDual("Yangi parol saqlandi!", "Новый пароль сохранен!", "New password saved!"))
      setResetUser(null)
      setNewPassword('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    } finally {
      setResetting(false)
    }
  }

  // Delete Account
  const handleDeleteAccount = async (userId: number, name: string) => {
    if (!confirm(formatDual(
      `"${name}" ta'minotchisining portal akkauntini o'chirishni tasdiqlaysizmi?`,
      `Удалить доступ к порталу для поставщика "${name}"?`,
      `Delete portal account for "${name}"?`
    ))) return

    try {
      const res = await fetch(`/api/admin/supplier-accounts?userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('O\'chirishda xatolik')
      toast.success(formatDual("Akkaunt o'chirildi", "Аккаунт удален", "Account deleted"))
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Xatolik')
    }
  }

  // Copy credentials message
  const copyCredentialsText = () => {
    if (!createdCredentials) return
    const text = `🏢 GREEN PROCESSING ERP — Yetkazib Beruvchi Portali

Salom! Sizning shaxsiy portalingiz ochildi.
Zavoddan yuborilgan barcha xarid buyurtmalarini shu yerda kuzatib borasiz:

🔗 Kirish havolasi: ${window.location.origin}/login
👤 Login: ${createdCredentials.username}
🔑 Parol: ${createdCredentials.password}

Tizimga kirgach, buyurtmalarni ko'rishingiz va "Yo'lga chiqdik" deb belgilashingiz mumkin.`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(formatDual("Ma'lumotlar nusxalandi!", "Данные скопированы!", "Credentials copied!"))
    setTimeout(() => setCopied(false), 2500)
  }

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.users && s.users.some(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)))
    )
  }, [suppliers, search])

  const totalWithAccount = useMemo(() => {
    return suppliers.filter(s => s.users && s.users.length > 0).length
  }, [suppliers])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-dark-750 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} />
              {formatDual("ADMIN BOSHATUVCHI", "АДМИНИСТРИРОВАНИЕ", "ADMIN MANAGEMENT")}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {formatDual("Ta'minotchi Portal Akkauntlari (Login & Parol)", "Аккаунты Поставщиков (Логин и Пароль)", "Supplier Portal Accounts")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {formatDual(
              "Yetkazib beruvchilarga shaxsiy login va parol ochib bering. Ular tizimga kirganda faqat o'zlariga tegishli buyurtmalarni ko'rishadi.",
              "Создавайте логины и пароли для поставщиков. При входе им будут доступны только их заказы без доступа к остальной части ERP.",
              "Issue portal logins for suppliers. Upon login, they can strictly view and manage their factory orders."
            )}
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true)
            if (suppliers.length > 0) {
              handleSelectSupplier(suppliers[0].id.toString())
            }
          }}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>{formatDual("+ Yangi Login Ochish", "+ Создать логин", "+ New Supplier Login")}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">
            {formatDual("Jami Ta'minotchilar", "Всего поставщиков", "Total Suppliers")}
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {suppliers.length}
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl">
          <div className="text-xs font-bold text-teal-400 uppercase">
            {formatDual("Portali Mavjud Ta'minotchilar", "С доступом к порталу", "With Portal Access")}
          </div>
          <div className="text-2xl font-black text-teal-400 mt-1">
            {totalWithAccount} <span className="text-xs text-slate-400 font-semibold">/ {suppliers.length}</span>
          </div>
        </div>
        <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl">
          <div className="text-xs font-bold text-emerald-400 uppercase">
            {formatDual("Faol Akkauntlar", "Активные аккаунты", "Active Accounts")}
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {supplierUsers.filter(u => u.isActive).length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={formatDual(
              "Ta'minotchi korxonasi yoki login bo'yicha qidirish...",
              "Поиск по поставщику или логину...",
              "Search by supplier or login..."
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700 transition-colors"
          title={formatDual("Yangilash", "Обновить", "Refresh")}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
        </button>
      </div>

      {/* Suppliers Table & Accounts List */}
      <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-750 bg-dark-800/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">{formatDual("TA'MINOTCHI KORXONASI", "ПРЕДПРИЯТИЕ ПОСТАВЩИКА", "SUPPLIER COMPANY")}</th>
                <th className="py-4 px-4">{formatDual("TELEFON", "ТЕЛЕФОН", "PHONE")}</th>
                <th className="py-4 px-4">{formatDual("PORTAL LOGIN (USERNAME)", "ЛОГИН ПОРТАЛА", "PORTAL USERNAME")}</th>
                <th className="py-4 px-4 text-center">{formatDual("HOLAT", "СТАТУС", "STATUS")}</th>
                <th className="py-4 px-4 text-center">{formatDual("BUYURTMALAR", "ЗАКАЗЫ", "ORDERS")}</th>
                <th className="py-4 px-5 text-right">{formatDual("AMALLAR", "ДЕЙСТВИЯ", "ACTIONS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-750/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Loader2 size={28} className="animate-spin text-emerald-400 mx-auto mb-2" />
                    <span>{formatDual("Yuklanmoqda...", "Загрузка...", "Loading...")}</span>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    {formatDual("Ta'minotchilar topilmadi", "Поставщики не найдены", "No suppliers found")}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const hasAccount = sup.users && sup.users.length > 0
                  const userAccount = hasAccount ? sup.users[0] : null

                  return (
                    <tr key={sup.id} className="hover:bg-dark-800/40 transition-colors">
                      {/* Company Name */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-white text-sm flex items-center gap-2">
                          <Building2 size={16} className="text-emerald-400 flex-shrink-0" />
                          <span>{sup.name}</span>
                        </div>
                        {sup.shortName && (
                          <span className="text-[10px] text-slate-400 block ml-6">
                            ({sup.shortName})
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 text-slate-300 font-mono">
                        {sup.phone || "—"}
                      </td>

                      {/* Portal Login */}
                      <td className="py-4 px-4">
                        {userAccount ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-mono font-bold text-xs">
                              <KeyRound size={12} />
                              @{userAccount.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            {formatDual("Akkaunt ochilmagan", "Доступ не создан", "No account yet")}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {userAccount ? (
                          userAccount.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck size={12} />
                              {formatDual("Faol", "Активен", "Active")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <UserX size={12} />
                              {formatDual("Bloklangan", "Блокирован", "Blocked")}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-4 text-center font-bold text-slate-300">
                        {sup._count?.orders || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {userAccount ? (
                            <>
                              <button
                                onClick={() => setChatSupplier(sup)}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center gap-1"
                                title={formatDual("Ta'minotchi bilan chat", "Чат с поставщиком", "Chat with supplier")}
                              >
                                <MessageSquare size={13} />
                                <span>{formatDual("Chat", "Чат", "Chat")}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setResetUser({
                                    id: userAccount.id,
                                    name: userAccount.name,
                                    username: userAccount.username,
                                    role: 'SUPPLIER',
                                    isActive: userAccount.isActive,
                                    createdAt: userAccount.createdAt,
                                    supplier: { id: sup.id, name: sup.name, phone: sup.phone, category: sup.category }
                                  })
                                  setNewPassword('')
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 text-xs font-bold transition-all flex items-center gap-1"
                                title={formatDual("Parolni yangilash", "Сменить пароль", "Reset password")}
                              >
                                <Lock size={12} />
                                <span>{formatDual("Parol", "Пароль", "Pass")}</span>
                              </button>

                              <button
                                onClick={() => handleToggleActive(userAccount as any)}
                                className={`p-1.5 rounded-xl border transition-all ${
                                  userAccount.isActive
                                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                                }`}
                                title={userAccount.isActive ? formatDual("Bloklash", "Блокировать", "Block") : formatDual("Faollashtirish", "Активировать", "Activate")}
                              >
                                {userAccount.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>

                              <button
                                onClick={() => handleDeleteAccount(userAccount.id, sup.name)}
                                className="p-1.5 rounded-xl bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-dark-700 transition-all"
                                title={formatDual("O'chirish", "Удалить", "Delete")}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setShowCreateModal(true)
                                handleSelectSupplier(sup.id.toString())
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              <Plus size={13} />
                              <span>{formatDual("Login yaratish", "Создать доступ", "Create Login")}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Supplier Login & Password */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-dark-750 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {formatDual("Ta'minotchi uchun Portal Logini Ochish", "Создание доступа для поставщика", "Create Supplier Portal Login")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDual("Tizimga kirish uchun maxsus login va parol", "Данные для входа в кабинет поставщика", "Credentials for the supplier portal")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              {/* Select Supplier */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Ta'minotchi Korxonasi", "Предприятие поставщика", "Supplier Company")} *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => handleSelectSupplier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">{formatDual("— Ta'minotchini tanlang —", "— Выберите поставщика —", "— Select Supplier —")}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.shortName ? `(${s.shortName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Name */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Mas'ul Shaxs F.I.Sh / Profil Nomi", "Ф.И.О. контактного лица", "Contact Person / Profile Name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="masalan: Jasur M."
                  className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Login (Foydalanuvchi nomi)", "Логин (Имя пользователя)", "Username (Login)")} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="kibray_baraka"
                    className="w-full pl-8 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Password with generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300">
                    {formatDual("Parol", "Пароль", "Password")} *
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>{formatDual("⚡ Tasodifiy parol", "⚡ Сгенерировать", "⚡ Generate")}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 belgi"
                    className="w-full px-3.5 pr-10 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed">
                🔒 {formatDual(
                  "Ushbu ta'minotchi tizimga kirganida faqat uning o'ziga korxona tomonidan berilgan buyurtmalar ko'rinadi. Boshqa korxona ma'lumotlariga kirish to'liq yopiq bo'ladi.",
                  "Поставщик увидит только предназначенные ему заказы завода. Доступ к другим разделам ERP будет полностью изолирован.",
                  "The supplier will strictly see their own purchase orders, with 100% isolation from the rest of the ERP."
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{formatDual("Login & Parolni Saqlash", "Создать доступ", "Save Credentials")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-dark-750 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {formatDual("Parolni O'zgartirish", "Смена пароля", "Reset Password")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {resetUser.supplier?.name || resetUser.name} (@{resetUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {formatDual("Yangi Parol", "Новый пароль", "New Password")} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yangi parol kiriting"
                    className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
                      let p = ''
                      for (let i = 0; i < 8; i++) p += chars.charAt(Math.floor(Math.random() * chars.length))
                      setNewPassword(p)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 text-[11px] font-bold"
                  >
                    ⚡ {formatDual("Generatsiya", "Генерировать", "Generate")}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-750">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold"
                >
                  {formatDual("Bekor qilish", "Отмена", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {resetting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                  <span>{formatDual("Parolni Yangilash", "Обновить пароль", "Update Password")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Success Credentials Share Card */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Check size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {formatDual("Akkaunt Tayyor!", "Аккаунт готов!", "Account Ready!")}
                </h3>
                <p className="text-xs text-slate-400">{createdCredentials.supplierName}</p>
              </div>
            </div>

            <div className="bg-dark-950 border border-dark-750 p-4 rounded-2xl space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                <span className="text-slate-500">Login:</span>
                <span className="font-bold text-emerald-400 select-all">{createdCredentials.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                <span className="text-slate-500">Parol:</span>
                <span className="font-bold text-amber-400 select-all">{createdCredentials.password}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Kirish havolasi:</span>
                <span className="text-slate-300 text-[11px] truncate max-w-[180px]">/login</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {formatDual(
                "Ushbu login va parolni nusxalab, ta'minotchiga (Telegram, WhatsApp yoki SMS orqali) yuborishingiz mumkin.",
                "Скопируйте эти данные и отправьте поставщику через мессенджер.",
                "Copy and send these credentials to the supplier via Telegram or WhatsApp."
              )}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={copyCredentialsText}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? formatDual("Nusxalandi!", "Скопировано!", "Copied!") : formatDual("📋 Nusxa olish (Telegram uchun)", "📋 Скопировать данные", "📋 Copy Credentials")}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-300 font-bold text-xs"
              >
                {formatDual("Yopish", "Закрыть", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Direct Chat with Supplier */}
      {chatSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="bg-white dark:bg-dark-900 border-2 border-slate-300 dark:border-dark-700 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col h-[580px] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    {chatSupplier.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatDual("Ta'minotchi bilan to'g'ridan-to'g'ri yozishma", "Прямой чат с поставщиком", "Direct chat with supplier")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChatSupplier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-dark-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/70 dark:bg-dark-950/50 custom-scrollbar">
              {adminChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                  <MessageSquare size={36} className="text-slate-400 mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatDual("Yozishmalar tarixi bo'sh", "История сообщений пуста", "No messages yet")}
                  </p>
                </div>
              ) : (
                adminChatMessages.map((m: any) => {
                  const isFromFactory = m.sender.toLowerCase().includes('green processing') || m.sender.toLowerCase().includes('ta\'minot')

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isFromFactory ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-500 font-bold mb-1 px-1">
                        {m.sender} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isFromFactory
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white border border-slate-200 dark:border-dark-700 rounded-tl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendAdminChat} className="p-3 border-t border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 flex items-center gap-2">
              <input
                type="text"
                placeholder={formatDual("Ta'minotchiga xabar yozing...", "Напишите поставщику...", "Type message to supplier...")}
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={adminChatSending || !adminChatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {adminChatSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{formatDual("Yuborish", "Отправить", "Send")}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

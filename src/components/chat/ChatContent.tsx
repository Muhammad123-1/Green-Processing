'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  X,
  Loader2,
  Users,
  User as UserIcon,
  Shield,
  Utensils,
  ChefHat,
  Search,
  MessageSquare,
  Building,
  CheckCheck,
  Check,
  Briefcase,
  Layers,
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldAlert,
  Sliders,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface UserItem {
  id: number
  name: string
  username: string
  role: string
  medicalClearance?: boolean
  isActive: boolean
  createdAt?: string
}

export interface ChatMessageItem {
  id: number
  sender: string
  text: string | null
  imageUrl: string | null
  createdAt: string
  groupId: string
  readBy: string[]
}

const CHANNELS = [
  {
    id: 'general',
    name: 'Umumiy Zavod (Hamma)',
    desc: 'Barcha xodimlar va umumiy e\'lonlar',
    icon: Users,
    color: 'from-blue-600 to-indigo-600',
    badge: 'Barcha',
  },
  {
    id: 'qa_warehouse',
    name: 'Sifat Nazorati & Ombor',
    desc: 'Xomashyo qabuli, KKT va jurnallar muvofiqligi',
    icon: Shield,
    color: 'from-emerald-600 to-teal-600',
    badge: 'QC / Sklad',
  },
  {
    id: 'kitchen_supply',
    name: 'Oshxona & Ta\'minot',
    desc: 'Kunlik oziq-ovqat va menyu ta\'minoti',
    icon: Utensils,
    color: 'from-amber-500 to-orange-600',
    badge: 'Oshxona',
  },
  {
    id: 'tech_prod',
    name: 'Texnolog & Ishlab Chiqarish',
    desc: 'Retseptlar, liniya rejimi va chiqish normasi',
    icon: ChefHat,
    color: 'from-purple-600 to-pink-600',
    badge: 'Sex / BOM',
  },
  {
    id: 'management',
    name: 'Rahbariyat & Audit',
    desc: 'Direktor, Moliya va boshqaruv xabarlari',
    icon: Briefcase,
    color: 'from-rose-600 to-red-600',
    badge: 'Audit',
  }
]

const ROLE_INFO: Record<string, { labelUz: string; labelRu: string; labelEn: string; color: string; bg: string }> = {
  ADMIN: { labelUz: 'Administrator', labelRu: 'Администратор', labelEn: 'Administrator', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  DIRECTOR: { labelUz: 'Bosh Direktor', labelRu: 'Генеральный директор', labelEn: 'General Director', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  QUALITY_CONTROL: { labelUz: 'Bosh Sifat Nazoratchisi', labelRu: 'Гл. Контролер качества', labelEn: 'Lead Quality Inspector', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  INSPECTOR: { labelUz: 'Sex Nazoratchisi (QC)', labelRu: 'Контролер цеха (QC)', labelEn: 'Shop QC Inspector', color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/30' },
  TECHNOLOGY: { labelUz: 'Bosh Texnolog', labelRu: 'Главный технолог', labelEn: 'Chief Technologist', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  PRODUCTION: { labelUz: 'Ishlab Chiqarish Mudiri', labelRu: 'Нач. производства', labelEn: 'Production Head', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  KITCHEN: { labelUz: 'Bosh Oshpaz (Kuxnya)', labelRu: 'Шеф-повар кухни', labelEn: 'Head Chef', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  WAREHOUSE: { labelUz: 'Omborxona Mudiri', labelRu: 'Заведующий складом', labelEn: 'Warehouse Head', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  SUPPLY: { labelUz: 'Ta\'minotchi (Snabjenets)', labelRu: 'Снабженец', labelEn: 'Procurement Officer', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  LOGISTICS: { labelUz: 'Logistika & Transport', labelRu: 'Логистика', labelEn: 'Logistics', color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/30' },
  ACCOUNTING: { labelUz: 'Bosh Buxgalter', labelRu: 'Главный бухгалтер', labelEn: 'Chief Accountant', color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/30' },
  HR: { labelUz: 'Kadrlar Bo\'limi', labelRu: 'Отдел кадров', labelEn: 'HR Officer', color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/30' },
  SECURITY: { labelUz: 'Xavfsizlik Xizmati', labelRu: 'Служба безопасности', labelEn: 'Security', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' },
  OPERATOR: { labelUz: 'Operator', labelRu: 'Оператор', labelEn: 'Operator', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
}

export default function ChatContent({
  currentUserId = 0,
  userRole = 'OPERATOR',
  userName = 'Foydalanuvchi'
}: {
  currentUserId?: number
  userRole?: string
  userName?: string
}) {
  const { lang } = useLanguage()

  // Navigation: 'users' (DMs) | 'channels' (Groups)
  const [navTab, setNavTab] = useState<'users' | 'channels'>('users')
  
  // Selected conversation
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<typeof CHANNELS[0] | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string>('general')

  // Users and Messages state
  const [usersList, setUsersList] = useState<UserItem[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Message composing
  const [text, setText] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(null)

  // Mobile sidebar toggle
  const [showMobileChat, setShowMobileChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Users List
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const data: UserItem[] = await res.json()
        setUsersList(data)
        // Default to first colleague or first channel if none selected
        if (!selectedUser && !selectedChannel && data.length > 0) {
          const colleague = data.find(u => u.name !== userName && u.id !== currentUserId) || data[0]
          if (colleague) {
            selectUserDirectChat(colleague, false)
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Helper to compute DM group ID
  const computeDmGroupId = (myId: number, otherId: number) => {
    if (myId && otherId) {
      const min = Math.min(myId, otherId)
      const max = Math.max(myId, otherId)
      return `dm_${min}_${max}`
    }
    return `dm_user_${otherId}`
  }

  // Switch to Direct Message with a User
  const selectUserDirectChat = (user: UserItem, openMobile = true) => {
    setSelectedUser(user)
    setSelectedChannel(null)
    const dmId = computeDmGroupId(currentUserId, user.id)
    setActiveGroupId(dmId)
    if (openMobile) setShowMobileChat(true)
  }

  // Switch to a Channel
  const selectChannelChat = (channel: typeof CHANNELS[0], openMobile = true) => {
    setSelectedChannel(channel)
    setSelectedUser(null)
    setActiveGroupId(channel.id)
    if (openMobile) setShowMobileChat(true)
  }

  // 2. Fetch Messages for active group
  const fetchMessages = async () => {
    if (!activeGroupId) return
    try {
      const res = await fetch(`/api/chat?groupId=${activeGroupId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    setMessagesLoading(true)
    fetchMessages().finally(() => setMessagesLoading(false))
    const interval = setInterval(fetchMessages, 2500)
    return () => clearInterval(interval)
  }, [activeGroupId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send Message Handler
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !selectedImage) return

    const tempText = text
    const tempFile = selectedImage

    setText('')
    setSelectedImage(null)

    let imageUrl = null

    if (tempFile) {
      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', tempFile)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          imageUrl = data.url
        } else {
          toast.error(lang === 'ru' ? 'Ошибка загрузки фото' : 'Rasm yuklashda xatolik')
          setUploadingImage(false)
          return
        }
      } catch {
        toast.error(lang === 'ru' ? 'Ошибка загрузки фото' : 'Rasm yuklashda xatolik')
        setUploadingImage(false)
        return
      }
      setUploadingImage(false)
    }

    try {
      const payload = {
        text: tempText.trim() ? tempText : null,
        imageUrl,
        groupId: activeGroupId
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchMessages()
      }
    } catch {
      toast.error(lang === 'ru' ? 'Сообщение не отправлено' : 'Xabar yuborilmadi')
    }
  }

  // Filter users by search
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return usersList
    return usersList.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (ROLE_INFO[u.role]?.labelUz.toLowerCase().includes(q)) ||
      (ROLE_INFO[u.role]?.labelRu.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    )
  }, [usersList, searchQuery])

  // Helper to format Role Label
  const getRoleLabel = (role: string) => {
    const info = ROLE_INFO[role]
    if (!info) return role
    if (lang === 'ru') return info.labelRu
    if (lang === 'en') return info.labelEn
    return info.labelUz
  }

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] animate-enter relative text-slate-900 dark:text-white">
      
      {/* Outer Card Container */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-2xl">

        {/* LEFT SIDEBAR: USERS & CHANNELS */}
        <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 flex flex-col overflow-hidden shadow-md shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 bg-slate-50/90 dark:bg-dark-900/90">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                    {lang === 'ru' ? 'Корпоративный Чат' : lang === 'en' ? 'Enterprise Chat' : 'Korxona Chati'}
                  </h2>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {lang === 'ru' ? 'Прямая связь и группы' : lang === 'en' ? 'Direct Messages & Groups' : 'Shaxsiy va guruh xabarlari'}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                Live
              </span>
            </div>

            {/* Navigation Tabs (DMs vs Channels) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-dark-800 rounded-xl">
              <button
                onClick={() => setNavTab('users')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  navTab === 'users'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserIcon size={14} />
                <span>{lang === 'ru' ? 'Сотрудники' : lang === 'en' ? 'Colleagues' : 'Xodimlar'}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black">
                  {usersList.length}
                </span>
              </button>

              <button
                onClick={() => setNavTab('channels')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  navTab === 'channels'
                    ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>{lang === 'ru' ? 'Группы' : lang === 'en' ? 'Channels' : 'Guruhlar'}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-black">
                  {CHANNELS.length}
                </span>
              </button>
            </div>

            {/* Search Input for Colleagues */}
            {navTab === 'users' && (
              <div className="mt-3 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ru' ? 'Поиск: имя, роль, должность...' : lang === 'en' ? 'Search: name, role...' : 'Qidirish: ism, rol, lavozim...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-dark-900">
            {navTab === 'users' ? (
              /* USERS (DIRECT MESSAGES) LIST */
              usersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mb-2 text-emerald-500" />
                  <span className="text-xs font-medium">{lang === 'ru' ? 'Загрузка коллег...' : 'Xodimlar yuklanmoqda...'}</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-medium">
                  {lang === 'ru' ? 'Сотрудник не найден' : 'Xodim topilmadi'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.name === userName || u.id === currentUserId
                  const isSelected = selectedUser?.id === u.id
                  const roleConfig = ROLE_INFO[u.role] || ROLE_INFO.OPERATOR
                  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <button
                      key={u.id}
                      onClick={() => selectUserDirectChat(u)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-50/80 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 border-slate-200/80 dark:border-dark-750 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {/* Avatar with status dot */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm border border-slate-300/30">
                          {initials || <UserIcon size={16} />}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-900 ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>

                      {/* User details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-black truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                            {u.name} {isCurrent && <span className="text-[10px] text-emerald-600 font-bold">(Siz)</span>}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleConfig.bg} ${roleConfig.color} truncate max-w-[170px]`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )
            ) : (
              /* CHANNELS (GROUPS) LIST */
              CHANNELS.map((ch) => {
                const Icon = ch.icon
                const isSelected = selectedChannel?.id === ch.id

                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChannelChat(ch)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500/50 shadow-sm'
                        : 'bg-slate-50/80 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 border-slate-200/80 dark:border-dark-750 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${ch.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-black truncate ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                          {ch.name}
                        </h4>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-300">
                          {ch.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {ch.desc}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Current User Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-dark-750 bg-slate-50/90 dark:bg-dark-900/90 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{userName}</p>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{getRoleLabel(userRole)}</p>
            </div>
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div className={`flex-1 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 flex flex-col overflow-hidden shadow-md ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Chat Header */}
          <div className="p-3.5 px-5 border-b border-slate-200 dark:border-dark-750 bg-slate-50/90 dark:bg-dark-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-600 dark:text-slate-300"
              >
                <ArrowLeft size={18} />
              </button>

              {selectedUser ? (
                /* Selected DM Header */
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-900 ${selectedUser.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedUser.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === 'ru' ? 'Личный диалог (1-на-1)' : lang === 'en' ? 'Direct 1-on-1 Message' : 'Shaxsiy yozishma (1-ga-1 muloqot)'} • @{selectedUser.username}
                    </p>
                  </div>
                </div>
              ) : selectedChannel ? (
                /* Selected Channel Header */
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${selectedChannel.color} flex items-center justify-center text-white shadow-sm`}>
                    <selectedChannel.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedChannel.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {selectedChannel.desc}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {lang === 'ru' ? 'Выберите диалог' : 'Muloqotni tanlang'}
                </div>
              )}
            </div>

            {/* Quick Status / Help */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                🔒 {lang === 'ru' ? 'Шифрованный канал ERP' : 'ERP Himoyalangan Aloqa'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/60 dark:bg-dark-950/40">
            {messagesLoading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin mb-2 text-emerald-500" />
                <p className="text-xs font-semibold">{lang === 'ru' ? 'Загрузка сообщений...' : 'Xabarlar yuklanmoqda...'}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
                  <MessageSquare size={32} />
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {selectedUser
                    ? `${selectedUser.name} bilan shaxsiy muloqot`
                    : `${selectedChannel?.name || 'Guruh'} kanali`}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {lang === 'ru'
                    ? 'Здесь пока нет сообщений. Напишите первое сообщение или отправьте фотографию.'
                    : 'Hali xabarlar mavjud emas. Birinchi bo\'lib xabar yozing yoki rasm biriktiring.'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === userName || msg.sender.startsWith(userName) || msg.sender === userRole
                const seenByOthers = msg.readBy ? msg.readBy.filter(r => r !== msg.sender && r !== userName) : []

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[72%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 ml-1.5 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {msg.sender}
                      </span>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl shadow-sm transition-all ${
                        isMe
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-dark-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-dark-700 shadow-sm'
                      }`}
                    >
                      {/* Attached Image */}
                      {msg.imageUrl && (
                        <div
                          onClick={() => setImagePreviewModal(msg.imageUrl)}
                          className="mb-2.5 -mx-1 -mt-1 relative overflow-hidden rounded-xl cursor-zoom-in border border-black/10 group"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="max-w-full max-h-[300px] object-cover rounded-lg group-hover:scale-102 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* Text Content */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      )}
                    </div>

                    {/* Meta info: Timestamp & Seen status */}
                    <div className="flex items-center gap-1.5 mt-1 mx-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          {seenByOthers.length > 0 ? (
                            <>
                              <CheckCheck size={12} className="text-emerald-500" />
                              <span>{seenByOthers.length}</span>
                            </>
                          ) : (
                            <Check size={12} className="text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-750 shrink-0">
            {/* Selected Image Attachment Preview */}
            {selectedImage && (
              <div className="mb-3 flex items-center gap-3 bg-emerald-50 dark:bg-dark-800 p-2.5 rounded-xl border border-emerald-200 dark:border-dark-600 w-max shadow-sm animate-enter">
                <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-dark-900 overflow-hidden relative border border-slate-300 dark:border-dark-700">
                  <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" alt="Preview" />
                </div>
                <div className="flex flex-col pr-4">
                  <span className="text-xs text-slate-900 dark:text-slate-200 font-bold truncate max-w-[180px]">{selectedImage.name}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(selectedImage.size / 1024).toFixed(0)} KB • Yuborishga tayyor
                  </span>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-dark-700 rounded-full text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              {/* Image Upload Button */}
              <label
                className="p-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center border border-slate-200 dark:border-dark-700 hover:border-emerald-500"
                title={lang === 'ru' ? 'Прикрепить фото' : 'Rasm biriktirish'}
              >
                <Paperclip size={20} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && setSelectedImage(e.target.files[0])}
                />
              </label>

              {/* Text Input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder={
                  selectedUser
                    ? `${selectedUser.name}ga xabar yozish... (Enter - yuborish)`
                    : `${selectedChannel?.name || 'Guruh'}ga yozish...`
                }
                className="flex-1 bg-slate-50 dark:bg-dark-850 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none max-h-[120px] min-h-[44px] shadow-inner"
                rows={1}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!text.trim() && !selectedImage) || uploadingImage}
                className="p-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 shrink-0 flex items-center justify-center gap-1.5"
              >
                {uploadingImage ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline text-xs font-extrabold">{lang === 'ru' ? 'Отправить' : 'Yuborish'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imagePreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-enter"
          onClick={() => setImagePreviewModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagePreviewModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img src={imagePreviewModal} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

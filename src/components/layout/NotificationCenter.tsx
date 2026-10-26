'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  X, 
  AlertTriangle, 
  MessageSquare, 
  ShieldAlert, 
  Briefcase, 
  CheckCheck, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface NotificationItem {
  id: string
  type: 'CRITICAL_REPORT' | 'CHAT_MESSAGE' | 'LOW_STOCK' | 'DEFECT_ALERT' | 'INFO'
  priority: 'high' | 'medium' | 'normal'
  title: string
  titleRu: string
  message: string
  messageRu: string
  source: string
  sourceCategory: 'chat' | 'director' | 'warehouse' | 'qc'
  link: string
  actionLabel: string
  actionLabelRu: string
  createdAt: string
  icon: string
}

// Pleasant soft chime using standard Web Audio API (Zero external assets needed)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    // Two-tone chime: D5 -> A5
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

const DISMISSED_KEY = 'gp_dismissed_notifications_v1'
const SOUND_KEY = 'gp_notification_sound_enabled'

export default function NotificationCenter() {
  const router = useRouter()
  const { lang, formatDual } = useLanguage()

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'director' | 'chat'>('all')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef<number>(0)

  // 1. Load sound preference & dismissed IDs from localStorage
  useEffect(() => {
    try {
      const savedDismissed = localStorage.getItem(DISMISSED_KEY)
      if (savedDismissed) {
        setDismissedIds(new Set(JSON.parse(savedDismissed)))
      }
      const savedSound = localStorage.getItem(SOUND_KEY)
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true')
      }
    } catch {}
  }, [])

  // 2. Fetch Notifications from API
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const items: NotificationItem[] = data.notifications || []
        setNotifications(items)

        // Chime if new high priority notification arrived
        const activeHigh = items.filter(
          (n) => n.priority === 'high' && !dismissedIds.has(n.id)
        )
        if (activeHigh.length > prevCountRef.current && soundEnabled && prevCountRef.current > 0) {
          playNotificationChime()
        }
        prevCountRef.current = activeHigh.length
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [dismissedIds, soundEnabled])

  // Initial fetch and auto-refresh every 35 seconds
  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(() => {
      fetchNotifications(true)
    }, 35000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  // 3. Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // 4. Dismiss individual notification (X ni bosib o'chirmaguncha turaveradi)
  const dismissItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  // 5. Dismiss all
  const dismissAll = () => {
    const allIds = notifications.map((n) => n.id)
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...allIds])
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  // 6. Sound Toggle
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SOUND_KEY, String(next))
      } catch {}
      if (next) playNotificationChime()
      return next
    })
  }

  // Active (non-dismissed) notifications
  const activeNotifications = useMemo(() => {
    return notifications.filter((n) => !dismissedIds.has(n.id))
  }, [notifications, dismissedIds])

  // Filtered by tab
  const displayItems = useMemo(() => {
    if (activeTab === 'director') {
      return activeNotifications.filter(
        (n) => n.sourceCategory === 'director' || n.priority === 'high'
      )
    }
    if (activeTab === 'chat') {
      return activeNotifications.filter((n) => n.sourceCategory === 'chat')
    }
    return activeNotifications
  }, [activeNotifications, activeTab])

  const unreadCount = activeNotifications.length
  const hasHighPriority = activeNotifications.some((n) => n.priority === 'high')

  const handleItemClick = (n: NotificationItem) => {
    setIsOpen(false)
    if (n.link) {
      router.push(n.link)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 relative ${
          isOpen
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/20'
            : hasHighPriority
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20'
            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-dark-700 dark:hover:bg-dark-600 dark:border-dark-600 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title={formatDual('Bildirishnomalar', 'Уведомления', 'Notifications')}
        aria-label="Bildirishnomalar"
      >
        <Bell size={16} className={hasHighPriority ? 'animate-bounce' : ''} />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-dark-900 shadow-md shadow-rose-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Modal */}
      {isOpen && (
        <div className="fixed inset-x-2.5 top-16 w-auto sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[420px] max-w-[96vw] bg-white dark:bg-dark-900/95 backdrop-blur-2xl border border-slate-200 dark:border-dark-750 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-black/50 z-50 overflow-hidden animate-enter">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-dark-750 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-dark-850/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bell size={14} />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                {formatDual('Bildirishnomalar', 'Уведомления', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                  {unreadCount} yangi
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750 transition-colors"
                title={soundEnabled ? "Ovozni o'chirish" : 'Ovozni yoqish'}
              >
                {soundEnabled ? <Volume2 size={15} className="text-emerald-600 dark:text-emerald-400" /> : <VolumeX size={15} />}
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchNotifications()}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750 transition-colors"
                title="Yangilash"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-500' : ''} />
              </button>

              {/* Clear All */}
              {unreadCount > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-dark-750 transition-colors"
                  title="Barchasini o'qilgan deb belgilash"
                >
                  <CheckCheck size={14} className="inline mr-1" />
                  {formatDual('Tozalash', 'Очистить', 'Clear')}
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-slate-200 dark:border-dark-750/80 bg-slate-100/70 dark:bg-dark-800/40 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {formatDual(`Barchasi (${activeNotifications.length})`, `Все (${activeNotifications.length})`, `All (${activeNotifications.length})`)}
            </button>
            <button
              onClick={() => setActiveTab('director')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'director'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle size={12} className="text-amber-500 dark:text-amber-400" />
              <span>{formatDual('Direktor & Muhim', 'Руководство', 'Executive')}</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'chat'
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare size={12} className="text-indigo-500 dark:text-indigo-400" />
              <span>{formatDual('Chatlar', 'Чат', 'Chat')}</span>
            </button>
          </div>

          {/* Notifications Scroll Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-dark-750 custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
                <span className="text-xs font-semibold">Yuklanmoqda...</span>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mx-auto">
                  <Sparkles size={20} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-300">
                  {formatDual(
                    "Barcha bildirishnomalar ko'rib chiqilgan",
                    "Все уведомления прочитаны",
                    "All caught up!"
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {formatDual(
                    "Yangi xabarlar, chatlar yoki direktor eslatmalari paydo bo'lganda bu yerda ko'rinadi",
                    "Новые сообщения и важные напоминания появятся здесь",
                    "New messages and alerts will appear here"
                  )}
                </p>
              </div>
            ) : (
              displayItems.map((n) => {
                const isHigh = n.priority === 'high'
                const isChat = n.sourceCategory === 'chat'
                const isReport = n.type === 'CRITICAL_REPORT'

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer group relative ${
                      isReport
                        ? 'bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-500/5 dark:hover:bg-rose-500/10'
                        : isHigh
                        ? 'bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-500/5 dark:hover:bg-amber-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-800/80'
                    }`}
                  >
                    {/* Icon Container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        isReport
                          ? 'bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-400 shadow-sm shadow-rose-500/20'
                          : isChat
                          ? 'bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400'
                          : isHigh
                          ? 'bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-dark-800 dark:border-dark-700 dark:text-slate-300'
                      }`}
                    >
                      {isReport ? (
                        <AlertTriangle size={17} />
                      ) : isChat ? (
                        <MessageSquare size={17} />
                      ) : (
                        <ShieldAlert size={17} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isReport
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                              : isChat
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                              : 'bg-slate-150 text-slate-700 border border-slate-200 dark:bg-dark-800 dark:text-slate-400 dark:border-dark-700'
                          }`}
                        >
                          {n.source}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {lang === 'ru' ? n.titleRu : n.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {lang === 'ru' ? n.messageRu : n.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono text-slate-400 dark:text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                          <span>{lang === 'ru' ? n.actionLabelRu : n.actionLabel}</span>
                          <ExternalLink size={10} />
                        </span>
                      </div>
                    </div>

                    {/* Dismiss Button (X ni bosib o'chirmaguncha turaveradi) */}
                    <button
                      onClick={(e) => dismissItem(n.id, e)}
                      className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-dark-750 transition-colors"
                      title={formatDual("O'chirish", "Закрыть", "Dismiss")}
                      aria-label="O'chirish"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50/90 dark:bg-dark-850/80 border-t border-slate-200 dark:border-dark-750 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {formatDual(
                "Xabarlar x ni bosib o'chirilguncha bu yerda saqlanadi",
                "Уведомления сохраняются пока не будут закрыты вручную (X)",
                "Notifications stay until dismissed manually (X)"
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

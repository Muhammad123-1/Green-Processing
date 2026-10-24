'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useChatBadge } from '@/store/chatBadge'

declare global {
  interface Window {
    electronAPI?: {
      setBadge: (count: number) => void
      notify: (title: string, body: string) => void
    }
    AndroidBridge?: {
      setBadge: (count: number) => void
      notify: (title: string, body: string) => void
    }
  }
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

const DISMISSED_KEY = 'gp_dismissed_notifications_v1'

export default function ChatBadgeListener() {
  const pathname = usePathname()
  const { setUnreadCount } = useChatBadge()
  const prevCountRef = useRef<number>(-1)
  const isChatPage = pathname?.startsWith('/chat')

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  }, [])

  // Sync unread chat + notifications
  useEffect(() => {
    let isMounted = true

    const syncBadges = async () => {
      try {
        let chatCount = 0
        let latestMsg: any = null

        // 1. Fetch unread chat
        try {
          const chatRes = await fetch('/api/chat/unread', { cache: 'no-store' })
          if (chatRes.ok) {
            const d = await chatRes.json()
            chatCount = typeof d.unreadCount === 'number' ? d.unreadCount : 0
            latestMsg = d.latestMessage
          }
        } catch {}

        // 2. Fetch active notification center items
        let notifCount = 0
        try {
          const notifRes = await fetch('/api/notifications', { cache: 'no-store' })
          if (notifRes.ok) {
            const nd = await notifRes.json()
            const items: any[] = nd.notifications || []
            let dismissedIds: string[] = []
            try {
              const saved = localStorage.getItem(DISMISSED_KEY)
              if (saved) dismissedIds = JSON.parse(saved)
            } catch {}
            const active = items.filter((n) => !dismissedIds.includes(n.id))
            notifCount = active.length
          }
        } catch {}

        if (!isMounted) return

        // Update Zustand store for Sidebar Chat link
        setUnreadCount(chatCount)

        // Total count for Taskbar and Title
        const totalCount = chatCount + notifCount

        // Update document title
        if (totalCount > 0) {
          document.title = `(${totalCount}) 🔴 Green Processing ERP`
        } else {
          document.title = 'Green Processing ERP'
        }

        // Send to Electron / Android app directly via bridge
        if (typeof window !== 'undefined') {
          if (window.electronAPI?.setBadge) {
            window.electronAPI.setBadge(totalCount)
          }
          if (window.AndroidBridge?.setBadge) {
            window.AndroidBridge.setBadge(totalCount)
          }
        }

        // Chime and notifications on new unread
        if (prevCountRef.current !== -1 && totalCount > prevCountRef.current && !isChatPage) {
          playChime()

          const notifyTitle = latestMsg?.sender 
            ? `Green Processing: ${latestMsg.sender}` 
            : 'Green Processing ERP'
          const notifyBody = latestMsg?.text 
            ? latestMsg.text 
            : `${totalCount} ta yangi bildirishnoma mavjud`

          if (typeof window !== 'undefined' && window.electronAPI?.notify) {
            window.electronAPI.notify(notifyTitle, notifyBody)
          } else if (typeof window !== 'undefined' && window.AndroidBridge?.notify) {
            window.AndroidBridge.notify(notifyTitle, notifyBody)
          } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notifyTitle, {
              body: notifyBody,
              icon: '/icon.png'
            })
          }
        }

        prevCountRef.current = totalCount
      } catch {
        // silent fail
      }
    }

    syncBadges()
    const timer = setInterval(syncBadges, 4000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [isChatPage, setUnreadCount])

  return null
}

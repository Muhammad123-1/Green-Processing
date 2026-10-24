'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useChatBadge } from '@/store/chatBadge'

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

export default function ChatBadgeListener() {
  const pathname = usePathname()
  const { unreadCount, setUnreadCount } = useChatBadge()
  const prevCountRef = useRef<number>(0)
  const isChatPage = pathname?.startsWith('/chat')

  // Request native notification permission on user interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  }, [])

  // Check unread count
  useEffect(() => {
    let isMounted = true

    const checkUnread = async () => {
      try {
        const res = await fetch('/api/chat/unread', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const count = typeof data.unreadCount === 'number' ? data.unreadCount : 0

        if (isMounted) {
          setUnreadCount(count)

          // If new unread message arrived and user is NOT on chat page
          if (count > prevCountRef.current && prevCountRef.current >= 0 && !isChatPage) {
            playChime()

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const sender = data.latestMessage?.sender || 'Xodim'
              const text = data.latestMessage?.text || 'Yangi xabar yuborildi'
              new Notification(`Green Processing: ${sender}`, {
                body: text,
                icon: '/icon.png'
              })
            }
          }

          prevCountRef.current = count
        }
      } catch {
        // silent fail
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isChatPage, setUnreadCount])

  // Update document.title
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) 🔴 Green Processing ERP`
    } else {
      document.title = 'Green Processing ERP'
    }
  }, [unreadCount])

  return null
}

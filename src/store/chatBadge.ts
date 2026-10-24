import { create } from 'zustand'

interface ChatBadgeState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  clear: () => void
}

export const useChatBadge = create<ChatBadgeState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  clear: () => set({ unreadCount: 0 }),
}))

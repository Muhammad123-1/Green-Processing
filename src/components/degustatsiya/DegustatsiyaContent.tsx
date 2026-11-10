'use client'

import React from 'react'
import {
  UtensilsCrossed,
  HeartPulse,
  Truck,
  MessageSquare,
  CalendarCheck2
} from 'lucide-react'
import Link from 'next/link'
import { useChatBadge } from '@/store/chatBadge'
import { BrakerageJournalModal } from '@/components/kitchen/BrakerageJournalModal'

interface Props {
  userRole?: string
  userName?: string
}

export default function DegustatsiyaContent({ userRole, userName }: Props) {
  const unreadCount = useChatBadge(s => s.unreadCount)

  return (
    <div className="space-y-4 pb-12">
      {/* Sleek, simple Navigation Bar - Clean Slate design like Kirim-Chiqim */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-2.5 no-print">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-xs">
            <UtensilsCrossed size={16} />
            <span>Ошхона Бракераж Журнали</span>
          </span>

          <Link
            href="/first-aid"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title="Ходимларга биринчи ёрдам кўрсатиш журнали (1 ва 2-расм)"
          >
            <HeartPulse size={15} className="text-slate-500" />
            <span>Биринчи ёрдам</span>
          </Link>

          <Link
            href="/drivers-medical"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title="Ҳайдовчилар тиббий кўриги журнали (3 ва 4-расм)"
          >
            <Truck size={15} className="text-slate-500" />
            <span>Ҳайдовчилар кўриги</span>
          </Link>
        </div>

        {/* Right side: Today date & Kitchen Chat */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            <CalendarCheck2 size={14} className="text-slate-500" />
            <span className="font-mono font-bold">
              {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <Link
            href="/chat?group=kitchen_supply"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 transition"
            title="Ошхона ва таъминот чати"
          >
            <MessageSquare size={14} />
            <span>Чат</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Dedicated Oshxona Brakeraj Jurnali Table */}
      <div className="w-full">
        <BrakerageJournalModal isFullPage={true} />
      </div>
    </div>
  )
}

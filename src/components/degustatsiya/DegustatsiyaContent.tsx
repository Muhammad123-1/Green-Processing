'use client'

import React from 'react'
import {
  UtensilsCrossed,
  HeartPulse,
  ChefHat,
  ShieldCheck,
  CalendarCheck2,
  Truck,
  MessageSquare,
  ExternalLink
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
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header - Dedicated Oshxona Brakeraj Jurnali */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0 border border-slate-700">
              <ChefHat size={26} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  СанПиН & Бракераж Назорати
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ошхона таомлари назорати</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Ошхона Бракераж Журнали
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Тайёр маҳсулотларни назорат қилиш ва органолептик баҳолаш: таомнинг ташқи кўриниши, таъми, ҳиди, тузуми, ҳарорати ҳамда комиссия аъзолари имзоларини қайд этиш журнали.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shrink-0">
              <CalendarCheck2 size={24} className="text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Бугунги сана:</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Quick links to First Aid and Drivers */}
            <Link
              href="/first-aid"
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="Биринчи ёрдам кўрсатиш журналига ўтиш (1 ва 2-расм)"
            >
              <HeartPulse size={16} className="text-rose-500" />
              <span>Биринчи ёрдам</span>
            </Link>

            <Link
              href="/drivers-medical"
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="Ҳайдовчилар тиббий кўригига ўтиш (3 ва 4-расм)"
            >
              <Truck size={16} className="text-blue-500" />
              <span>Ҳайдовчилар</span>
            </Link>

            {/* Direct Chat Link */}
            <Link
              href="/chat?group=kitchen_supply"
              className="relative flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/20 transition active:scale-95"
              title="Ошхона ва таъминот чатини очиш"
            >
              <div className="relative">
                <MessageSquare size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-white"></span>
                  </span>
                )}
              </div>
              <span>Ошхона Чати</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-orange-600 text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Dedicated Oshxona Brakeraj Jurnali Table */}
      <div className="w-full">
        <BrakerageJournalModal isFullPage={true} />
      </div>
    </div>
  )
}

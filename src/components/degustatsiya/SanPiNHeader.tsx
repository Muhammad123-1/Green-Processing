'use client'

import React from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed,
  HeartPulse,
  Truck,
  MessageSquare,
  CalendarCheck2
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useChatBadge } from '@/store/chatBadge'

export interface SanPiNHeaderProps {
  activeTab: 'degustatsiya' | 'first-aid' | 'drivers-medical' | 'medosmotr'
}

export function SanPiNHeader({ activeTab }: SanPiNHeaderProps) {
  const { formatDual, lang } = useLanguage()
  const unreadCount = useChatBadge(s => s.unreadCount)

  const dateLocale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ'
  const todayFormatted = new Date().toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-2.5 no-print">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 1. Oshxona brakeraji */}
        {activeTab === 'degustatsiya' ? (
          <span className="journal-active-tab flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs">
            <UtensilsCrossed size={16} />
            <span>{formatDual("Oshxona Brakeraj Jurnali", "Журнал Бракеража Кухни", "Kitchen Brakerage Journal")}</span>
          </span>
        ) : (
          <Link
            href="/degustatsiya"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title={formatDual("Oshxona brakeraj jurnaliga o'tish", "Перейти к журналу бракеража", "Go to Kitchen Brakerage")}
          >
            <UtensilsCrossed size={15} className="text-slate-500" />
            <span>{formatDual("Oshxona Brakeraji", "Бракераж Кухни", "Kitchen Brakerage")}</span>
          </Link>
        )}

        {/* 2. Birinchi yordam */}
        {activeTab === 'first-aid' ? (
          <span className="journal-active-tab flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs">
            <HeartPulse size={16} />
            <span>{formatDual("Birinchi Yordam Jurnali", "Журнал Первой Помощи", "First Aid Journal")}</span>
          </span>
        ) : (
          <Link
            href="/first-aid"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title={formatDual("Xodimlarga birinchi yordam ko'rsatish jurnali", "Журнал оказания первой помощи сотрудникам", "First Aid for Employees")}
          >
            <HeartPulse size={15} className="text-slate-500" />
            <span>{formatDual("Birinchi Yordam", "Первая Помощь", "First Aid")}</span>
          </Link>
        )}

        {/* 2.5. Medosmotr ko'rigi (Xodimlar va Haydovchilar) */}
        {activeTab === 'medosmotr' ? (
          <span className="journal-active-tab flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs bg-rose-600 text-white">
            <HeartPulse size={16} />
            <span>{formatDual("Medosmotr Ko'rigi", "Медосмотр Работников", "Staff Medical Exam")}</span>
          </span>
        ) : (
          <Link
            href="/medosmotr"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title={formatDual("Barcha xodimlarning davriy medosmotr jadvali", "График периодического медосмотра персонала", "Staff Periodic Medical Exam")}
          >
            <HeartPulse size={15} className="text-rose-500" />
            <span>{formatDual("Medosmotr Ko'rigi", "Медосмотр", "Medical Exam")}</span>
          </Link>
        )}

        {/* 3. Haydovchilar ko'rigi */}
        {activeTab === 'drivers-medical' ? (
          <span className="journal-active-tab flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs">
            <Truck size={16} />
            <span>{formatDual("Haydovchilar Tibbiy Ko'rigi", "Медосмотр Водителей", "Drivers Medical Exam")}</span>
          </span>
        ) : (
          <Link
            href="/drivers-medical"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            title={formatDual("Haydovchilar kunlik tibbiy ko'rigi jurnali", "Журнал предрейсового медосмотра водителей", "Daily Drivers Medical Exam")}
          >
            <Truck size={15} className="text-slate-500" />
            <span>{formatDual("Haydovchilar Ko'rigi", "Осмотр Водителей", "Drivers Exam")}</span>
          </Link>
        )}
      </div>

      {/* Right side: Today date & Kitchen Chat */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <CalendarCheck2 size={14} className="text-slate-500" />
          <span className="font-mono font-bold">{todayFormatted}</span>
        </div>

        <Link
          href="/chat?group=kitchen_supply"
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 transition"
          title={formatDual("Oshxona va ta'minot chati", "Чат кухни и снабжения", "Kitchen & Supply Chat")}
        >
          <MessageSquare size={14} />
          <span>{formatDual("Chat", "Чат", "Chat")}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}

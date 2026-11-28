'use client'

import React, { useState } from 'react'
import { BrakerageJournalModal } from '@/components/kitchen/BrakerageJournalModal'
import DailyFoodSampleJournal from '@/components/kitchen/DailyFoodSampleJournal'
import { SanPiNHeader } from '@/components/degustatsiya/SanPiNHeader'
import { UtensilsCrossed, Clock, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  userRole?: string
  userName?: string
}

export default function DegustatsiyaContent({ userRole, userName }: Props) {
  const { formatDual } = useLanguage()
  const [activeSubTab, setActiveSubTab] = useState<'brakerage' | 'daily_sample'>('brakerage')

  return (
    <div className="space-y-4 pb-12">
      <SanPiNHeader activeTab="degustatsiya" />

      {/* Degustatsiya & SanPiN Sub-tabs */}
      <div className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-750 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs no-print">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('brakerage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeSubTab === 'brakerage'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-750'
            }`}
          >
            <UtensilsCrossed size={16} />
            <span>{formatDual("1. Oshxona Brakeraj Jurnali", "1. Журнал Бракеража Кухни", "1. Kitchen Brakerage")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('daily_sample')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeSubTab === 'daily_sample'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/60'
            }`}
          >
            <Clock size={16} />
            <span>{formatDual("2. Sutkalik Sinama Jurnali", "2. Суточная Проба (48 часов)", "2. Daily Food Samples (48h)")}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-white/20">Янги</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:flex items-center gap-1.5 px-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>SanPiN 0027-20 / O'zR Sanitariya me'yorlari</span>
        </div>
      </div>

      {/* Render active journal view */}
      <div className="w-full">
        {activeSubTab === 'brakerage' ? (
          <BrakerageJournalModal isFullPage={true} />
        ) : (
          <DailyFoodSampleJournal />
        )}
      </div>
    </div>
  )
}

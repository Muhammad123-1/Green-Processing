'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  UtensilsCrossed,
  HeartPulse,
  ChefHat,
  ShieldCheck,
  CalendarCheck2,
  Truck,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { BrakerageJournalModal } from '@/components/kitchen/BrakerageJournalModal'
import { FirstAidJournalView } from './FirstAidJournalView'
import DriversMedicalContent from '@/components/drivers-medical/DriversMedicalContent'

interface Props {
  userRole?: string
  userName?: string
}

export default function DegustatsiyaContent({ userRole, userName }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams ? searchParams.get('tab') : null
  const [activeTab, setActiveTab] = useState<'kitchen' | 'first_aid' | 'drivers'>(
    tabParam === 'first_aid' ? 'first_aid' : tabParam === 'drivers' ? 'drivers' : 'kitchen'
  )

  const handleTabChange = (tab: 'kitchen' | 'first_aid' | 'drivers') => {
    setActiveTab(tab)
    router.replace(`/degustatsiya?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header - Adaptive Light & Dark mode, calm colors for older eyes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 text-white dark:bg-slate-800 flex items-center justify-center shadow-md shrink-0 border border-slate-700">
              <UtensilsCrossed size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  SanPiN & QC Nazorati
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Кунлик журналлар бўлими</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Дегустация ва СанПиН Журналлари
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Ошхона бракераж журнали, ходимларга биринчи тиббий ёрдам кўрсатиш журнали (1 ва 2-расм) ҳамда линияга йўналтирилган ҳайдовчиларни кунлик тиббий кўрикдан ўтказиш журнали (3 ва 4-расм).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shrink-0">
            <CalendarCheck2 size={24} className="text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Бугунги сана:</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons - Calm, high-contrast, large text for older staff */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5">
          {/* Tab 1: Kitchen Brakeraj */}
          <button
            type="button"
            onClick={() => handleTabChange('kitchen')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'kitchen'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-900 dark:ring-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ChefHat size={20} className={activeTab === 'kitchen' ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-500'} />
            <div className="text-left">
              <div className="font-black">Ошхона бракераж журнали</div>
              <div className="text-xs opacity-85 font-medium">Органолептик таомлар назорати</div>
            </div>
          </button>

          {/* Tab 2: First Aid (1 & 2-rasm) */}
          <button
            type="button"
            onClick={() => handleTabChange('first_aid')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'first_aid'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-900 dark:ring-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <HeartPulse size={20} className={activeTab === 'first_aid' ? 'text-rose-400 dark:text-rose-600' : 'text-slate-500'} />
            <div className="text-left">
              <div className="font-black">Биринчи ёрдам кўрсатиш журнали</div>
              <div className="text-xs opacity-85 font-medium">1 ва 2-расм бўйича (12 та устун)</div>
            </div>
          </button>

          {/* Tab 3: Drivers Medical Check (3 & 4-rasm) */}
          <button
            type="button"
            onClick={() => handleTabChange('drivers')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-900 dark:ring-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Truck size={20} className={activeTab === 'drivers' ? 'text-blue-400 dark:text-blue-600' : 'text-slate-500'} />
            <div className="text-left">
              <div className="font-black">Ҳайдовчилар тиббий кўриги</div>
              <div className="text-xs opacity-85 font-medium">3 ва 4-расм бўйича (Рейс олди)</div>
            </div>
          </button>

          {/* Direct Link to Standalone Page */}
          <Link
            href="/drivers-medical"
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition ml-auto"
            title="Ҳайдовчилар кўриги алоҳида саҳифасини очиш"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Алоҳида саҳифада очиш (/drivers-medical)</span>
          </Link>
        </div>
      </div>

      {/* Tab 1: Oshxona brakeraj jurnali (No CSS animations to prevent stacking context trapping) */}
      {activeTab === 'kitchen' && (
        <div className="w-full">
          <BrakerageJournalModal isFullPage={true} />
        </div>
      )}

      {/* Tab 2: Birinchi yordam ko'rsatish jurnali (1 & 2-rasm) */}
      {activeTab === 'first_aid' && (
        <div className="w-full">
          <FirstAidJournalView />
        </div>
      )}

      {/* Tab 3: Haydovchilar kunlik tibbiy ko'rigi (3 & 4-rasm) */}
      {activeTab === 'drivers' && (
        <div className="w-full">
          <DriversMedicalContent />
        </div>
      )}
    </div>
  )
}

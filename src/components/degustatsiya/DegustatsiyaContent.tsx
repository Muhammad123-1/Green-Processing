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
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-dark-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <UtensilsCrossed size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  SanPiN & QC Nazorati
                </span>
                <span className="text-xs text-slate-400">Kunlik jurnallar bo'limi</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Degustatsiya va SanPiN Jurnallari
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Oshxona brakeraj jurnali, xodimlarga birinchi tibbiy yordam ko'rsatish jurnali (1 va 2-rasm) hamda liniyaga yo'naltirilgan haydovchilarni kunlik tibbiy ko'rikdan o'tkazish jurnali (3 va 4-rasm).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shrink-0">
            <CalendarCheck2 size={24} className="text-emerald-400" />
            <div className="text-xs">
              <div className="text-slate-400 font-medium">Bugungi sana:</div>
              <div className="font-mono font-bold text-white text-sm">
                {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap gap-2">
          {/* Tab 1: Kitchen Brakeraj */}
          <button
            type="button"
            onClick={() => handleTabChange('kitchen')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              activeTab === 'kitchen'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 scale-102'
                : 'bg-dark-800/90 text-slate-400 hover:text-white hover:bg-dark-750 border border-slate-800'
            }`}
          >
            <ChefHat size={18} className={activeTab === 'kitchen' ? 'text-white' : 'text-orange-400'} />
            <div className="text-left">
              <div>Oshxona brakeraj jurnali</div>
              <div className="text-[10px] opacity-80 font-normal">Organoleptik taomlar nazorati</div>
            </div>
          </button>

          {/* Tab 2: First Aid (1 & 2-rasm) */}
          <button
            type="button"
            onClick={() => handleTabChange('first_aid')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              activeTab === 'first_aid'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30 scale-102'
                : 'bg-dark-800/90 text-slate-400 hover:text-white hover:bg-dark-750 border border-slate-800'
            }`}
          >
            <HeartPulse size={18} className={activeTab === 'first_aid' ? 'text-white' : 'text-rose-400'} />
            <div className="text-left">
              <div>Birinchi yordam ko'rsatish jurnali</div>
              <div className="text-[10px] opacity-80 font-normal">1 ва 2-расм бўйича (12 та устун)</div>
            </div>
          </button>

          {/* Tab 3: Drivers Medical Check (3 & 4-rasm) */}
          <button
            type="button"
            onClick={() => handleTabChange('drivers')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              activeTab === 'drivers'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30 scale-102'
                : 'bg-dark-800/90 text-slate-400 hover:text-white hover:bg-dark-750 border border-slate-800'
            }`}
          >
            <Truck size={18} className={activeTab === 'drivers' ? 'text-white' : 'text-sky-400'} />
            <div className="text-left">
              <div>Ҳайдовчилар тиббий кўриги</div>
              <div className="text-[10px] opacity-80 font-normal">3 ва 4-расм бўйича (Рейс олди)</div>
            </div>
          </button>

          {/* Direct Link to Standalone Page */}
          <Link
            href="/drivers-medical"
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-semibold text-xs text-slate-400 hover:text-white hover:bg-dark-750 border border-slate-800 transition ml-auto"
            title="Ҳайдовчилар кўриги алоҳида саҳифасини очиш"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Алоҳида саҳифада очиш (/drivers-medical)</span>
          </Link>
        </div>
      </div>

      {/* Tab 1: Oshxona brakeraj jurnali */}
      {activeTab === 'kitchen' && (
        <div className="animate-in fade-in duration-200">
          <BrakerageJournalModal isFullPage={true} />
        </div>
      )}

      {/* Tab 2: Birinchi yordam ko'rsatish jurnali (1 & 2-rasm) */}
      {activeTab === 'first_aid' && (
        <div className="animate-in fade-in duration-200">
          <FirstAidJournalView />
        </div>
      )}

      {/* Tab 3: Haydovchilar kunlik tibbiy ko'rigi (3 & 4-rasm) */}
      {activeTab === 'drivers' && (
        <div className="animate-in fade-in duration-200">
          <DriversMedicalContent />
        </div>
      )}
    </div>
  )
}

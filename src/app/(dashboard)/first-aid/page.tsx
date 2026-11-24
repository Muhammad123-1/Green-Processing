import React, { Suspense } from 'react'
import { FirstAidJournalView } from '@/components/degustatsiya/FirstAidJournalView'
import { SanPiNHeader } from '@/components/degustatsiya/SanPiNHeader'

export const metadata = {
  title: 'Xodimlarga birinchi tibbiy yordam ko\'rsatish jurnali | Green Processing ERP',
  description: 'Xodimlarga birinchi tibbiy yordam ko\'rsatish va tibbiy qabul jurnali.'
}

export default async function FirstAidPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Yuklanmoqda...
        </div>
      }
    >
      <div className="space-y-4 pb-12">
        <SanPiNHeader activeTab="first-aid" />

        {/* Dedicated 12-Column Journal Table */}
        <FirstAidJournalView isFullPage={true} />
      </div>
    </Suspense>
  )
}

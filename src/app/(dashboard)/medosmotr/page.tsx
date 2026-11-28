import React, { Suspense } from 'react'
import MedicalExamContent from '@/components/medical/MedicalExamContent'
import { SanPiNHeader } from '@/components/degustatsiya/SanPiNHeader'

export const metadata = {
  title: 'Xodimlar va Haydovchilar Medosmotr Ko\'rigi | Green Processing ERP',
  description: 'Ishlab chiqarish, oshxona, haydovchilar va ma\'muriyat xodimlarining davriy tibbiy ko\'rik monitoringi.'
}

export default async function MedosmotrPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Medosmotr ma'lumotlari yuklanmoqda...
        </div>
      }
    >
      <div className="space-y-4 pb-12">
        <SanPiNHeader activeTab="medosmotr" />
        <MedicalExamContent />
      </div>
    </Suspense>
  )
}

import React, { Suspense } from 'react'
import DriversMedicalContent from '@/components/drivers-medical/DriversMedicalContent'
import { SanPiNHeader } from '@/components/degustatsiya/SanPiNHeader'

export const metadata = {
  title: 'Haydovchilarni kunlik tibbiy ko\'rikdan o\'tkazish jurnali | Green Processing ERP',
  description: 'Liniyaga yo\'naltirilgan haydovchilarni reys oldi kunlik tibbiy ko\'rikdan o\'tkazish jurnali.'
}

export default async function DriversMedicalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Yuklanmoqda...
        </div>
      }
    >
      <div className="space-y-4 pb-12">
        <SanPiNHeader activeTab="drivers-medical" />
        <DriversMedicalContent />
      </div>
    </Suspense>
  )
}

import React, { Suspense } from 'react'
import DegustatsiyaContent from '@/components/degustatsiya/DegustatsiyaContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Degustatsiya & SanPiN Jurnallari | Green Processing ERP',
  description: "Oshxona brakeraj jurnali (organoleptik baholash) hamda birinchi tibbiy yordam ko'rsatish jurnali."
}

export default async function DegustatsiyaPage() {
  const session = await getSession()

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Degustatsiya va SanPiN jurnallari yuklanmoqda...
        </div>
      }
    >
      <DegustatsiyaContent
        userRole={session?.role || 'QUALITY_CONTROL'}
        userName={session?.name || 'Sifat Nazoratchisi'}
      />
    </Suspense>
  )
}

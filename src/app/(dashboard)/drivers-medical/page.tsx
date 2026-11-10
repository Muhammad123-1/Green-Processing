import React, { Suspense } from 'react'
import DriversMedicalContent from '@/components/drivers-medical/DriversMedicalContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Ҳайдовчиларни кунлик тиббий кўрикдан ўтказиш журнали | Green Processing ERP',
  description: 'Линияга йўналтирилган ҳайдовчиларни рейс олди кунлик тиббий кўрикдан ўтказиш журнали.'
}

export default async function DriversMedicalPage() {
  const session = await getSession()

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Ҳайдовчилар тиббий кўрик журнали юкланмоқда...
        </div>
      }
    >
      <DriversMedicalContent />
    </Suspense>
  )
}

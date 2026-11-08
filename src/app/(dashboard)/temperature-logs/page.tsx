import { Suspense } from 'react'
import TemperatureLogsContent from '@/components/warehouse/TemperatureLogsContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Xomashyo Kirish Nazorati va Qabul Harorati Jurnali | Green Processing',
}

export default async function TemperatureLogsPage() {
  const session = await getSession()
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <TemperatureLogsContent
        userRole={session?.role || 'QUALITY_CONTROL'}
        userName={session?.name || 'Sifat Nazoratchisi'}
      />
    </Suspense>
  )
}

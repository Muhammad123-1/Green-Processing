import { Suspense } from 'react'
import RashodContent from '@/components/warehouse/RashodContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Sexga Chiqim (Outbound) | Green Processing',
}

export default async function OutboundPage() {
  const session = await getSession()
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <RashodContent
        userRole={session?.role || 'WAREHOUSE'}
        userName={session?.name || 'Omborchi'}
      />
    </Suspense>
  )
}

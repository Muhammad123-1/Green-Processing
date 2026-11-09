import { Suspense } from 'react'
import PrihodContent from '@/components/warehouse/PrihodContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Xomashyo Kirimi (Inbound) | Green Processing',
}

export default async function InboundPage() {
  const session = await getSession()
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <PrihodContent
        userRole={session?.role || 'WAREHOUSE'}
        userName={session?.name || 'Omborchi'}
      />
    </Suspense>
  )
}

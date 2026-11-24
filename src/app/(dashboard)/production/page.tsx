import { Suspense } from 'react'
import { getSession } from '@/app/actions/auth'
import FactoryProductionContent from '@/components/production/FactoryProductionContent'

export default async function ProductionPage() {
  const session = await getSession()
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <FactoryProductionContent userRole={session?.role} userName={session?.name} />
    </Suspense>
  )
}

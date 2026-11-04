import { Suspense } from 'react'
import GPContent from '@/components/warehouse/GPContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Tayyor Mahsulot Chiqarilishi (ГП) | Green Processing',
}

export default async function GPPage() {
  const session = await getSession()
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <GPContent
        userRole={session?.role || 'WAREHOUSE'}
        userName={session?.name || 'Omborchi'}
      />
    </Suspense>
  )
}

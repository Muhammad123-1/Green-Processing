import { Suspense } from 'react'
import SupplierDetailPage from '@/components/supplier/SupplierDetailPage'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: "Ta'minotchi Sahifasi | Green Processing",
}

type Params = { params: Promise<{ id: string }> }

export default async function SupplierViewPage({ params }: Params) {
  const { id } = await params
  const numId = parseInt(id)
  const session = await getSession()

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <SupplierDetailPage supplierId={numId} currentUserRole={session?.role || ''} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import SupplierDetailPage from '@/components/supplier/SupplierDetailPage'

export const metadata = {
  title: "Ta'minotchi Sahifasi | Green Processing",
}

type Params = { params: Promise<{ id: string }> }

export default async function SupplierViewPage({ params }: Params) {
  const { id } = await params
  const numId = parseInt(id)

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <SupplierDetailPage supplierId={numId} />
    </Suspense>
  )
}

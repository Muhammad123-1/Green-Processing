import { Suspense } from 'react'
import WarehouseContent from '@/components/warehouse/WarehouseContent'

export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <WarehouseContent />
    </Suspense>
  )
}

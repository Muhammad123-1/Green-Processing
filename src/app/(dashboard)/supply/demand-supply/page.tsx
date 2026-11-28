import { Suspense } from 'react'
import DemandSupplyIntelligence from '@/components/supply-chain/DemandSupplyIntelligence'

export const metadata = {
  title: "Talab va Ta'minot Intellekti | Demand & Supply Intelligence",
  description: "Bosh direktor va ta'minot uchun 30 kunlik rejalashtirish, xomashyo talabi va kamomadlarni prognozlash tizimi",
}

export default function DemandSupplyPage() {
  return (
    <div className="p-0 sm:p-2">
      <div className="max-w-7xl mx-auto space-y-6">
        <Suspense fallback={<div className="p-12 text-center text-slate-400">Yuklanmoqda...</div>}>
          <DemandSupplyIntelligence />
        </Suspense>
      </div>
    </div>
  )
}

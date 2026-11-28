import React from 'react'
import DistributionChannelsContent from '@/components/director/channels/DistributionChannelsContent'

export const metadata = {
  title: 'Taqsimot Kanallari Tahlili | Director ERP Green Processing',
  description: 'Taqsimot kanallari tahlili, Direct vs Indirect savdo taqsimoti, yalpi marja va risklar auditi'
}

export default function DistributionChannelsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DistributionChannelsContent />
    </div>
  )
}

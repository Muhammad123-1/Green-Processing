import React from 'react'
import BusinessDiversificationAnalytics from '@/components/director/executive/BusinessDiversificationAnalytics'

export const metadata = {
  title: 'Business Diversification & Concentration Risk | ERP Green Processing',
  description: 'Enterprise concentration risk monitoring, HHI calculations, single-source dependency and what-if scenario simulations'
}

export default function DiversificationRiskPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <BusinessDiversificationAnalytics />
    </div>
  )
}

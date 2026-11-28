import React from 'react'
import LogisticsPerformanceAnalytics from '@/components/director/executive/LogisticsPerformanceAnalytics'

export const metadata = {
  title: 'Logistics Performance & Delivery Intelligence | ERP Green Processing',
  description: 'Executive logistics analytics, cold-chain compliance and OTIF monitoring'
}

export default function DeliveryIntelligencePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LogisticsPerformanceAnalytics />
    </div>
  )
}

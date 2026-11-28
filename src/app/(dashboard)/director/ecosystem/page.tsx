import React from 'react'
import UnifiedEcosystemDashboard from '@/components/director/executive/UnifiedEcosystemDashboard'

export const metadata = {
  title: 'Unified ERP Business Ecosystem & Cross-Module Intelligence | ERP Green Processing',
  description: 'Connected enterprise business ecosystem, cross-module correlations, centralized alert center and data freshness monitoring'
}

export default function UnifiedEcosystemPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UnifiedEcosystemDashboard />
    </div>
  )
}

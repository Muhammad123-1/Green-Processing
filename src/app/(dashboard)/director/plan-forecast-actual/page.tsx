import React from 'react'
import PlanForecastActualAnalytics from '@/components/director/executive/PlanForecastActualAnalytics'

export const metadata = {
  title: 'Plan vs Forecast vs Actual | ERP Green Processing',
  description: 'Executive planning, forecasting and actual performance monitoring module'
}

export default function PlanForecastActualPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PlanForecastActualAnalytics />
    </div>
  )
}

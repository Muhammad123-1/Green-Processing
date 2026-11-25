import React from 'react'
import { DashboardSkeleton } from '@/components/common/Skeleton'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col justify-center">
      <DashboardSkeleton cardsCount={4} columns={7} rows={8} />
    </div>
  )
}

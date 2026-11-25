import React from 'react'
import { DashboardSkeleton } from '@/components/common/Skeleton'

export default function DashboardLoading() {
  return <DashboardSkeleton cardsCount={4} columns={7} rows={8} />
}

import React from 'react'
import {
  PageHeaderSkeleton,
  TabsSkeleton,
  StatCardsSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from '@/components/common/Skeleton'

export default function InspectionsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={2} />
      <TabsSkeleton count={3} />
      <StatCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <TableSkeleton rows={8} columns={7} />
    </div>
  )
}

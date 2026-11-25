import React from 'react'
import {
  PageHeaderSkeleton,
  TabsSkeleton,
  StatCardsSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from '@/components/common/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={2} />
      <TabsSkeleton count={5} />
      <StatCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <TableSkeleton rows={8} columns={7} />
    </div>
  )
}

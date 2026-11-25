import React from 'react'
import {
  PageHeaderSkeleton,
  TabsSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from '@/components/common/Skeleton'

export default function ArchiveLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={2} />
      <TabsSkeleton count={4} />
      <FilterBarSkeleton />
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}

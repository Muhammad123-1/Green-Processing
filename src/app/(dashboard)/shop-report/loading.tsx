import React from 'react'
import {
  PageHeaderSkeleton,
  TabsSkeleton,
  SpreadsheetSkeleton,
} from '@/components/common/Skeleton'

export default function ShopReportLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={3} />
      <TabsSkeleton count={5} />
      <SpreadsheetSkeleton accentColor="amber" columnsCount={10} rowsCount={10} />
    </div>
  )
}

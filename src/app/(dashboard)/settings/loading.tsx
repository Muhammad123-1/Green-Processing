import React from 'react'
import {
  PageHeaderSkeleton,
  TabsSkeleton,
  FormSkeleton,
} from '@/components/common/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={1} />
      <TabsSkeleton count={5} />
      <FormSkeleton fields={8} />
    </div>
  )
}

import React from 'react'
import { PageHeaderSkeleton, FormSkeleton } from '@/components/common/Skeleton'

export default function NewInspectionLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={1} />
      <FormSkeleton fields={8} />
    </div>
  )
}

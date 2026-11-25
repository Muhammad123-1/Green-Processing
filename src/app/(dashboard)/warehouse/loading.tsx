import React from 'react'
import { DashboardSkeleton } from '@/components/common/Skeleton'

export default function WarehouseLoading() {
  return <DashboardSkeleton title="Omborxona yuklanmoqda..." cardsCount={4} columns={8} rows={9} />
}

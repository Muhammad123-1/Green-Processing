import React from 'react'
import { SpreadsheetSkeleton } from '@/components/common/Skeleton'

export default function OutboundLoading() {
  return <SpreadsheetSkeleton accentColor="amber" columnsCount={12} rowsCount={9} />
}

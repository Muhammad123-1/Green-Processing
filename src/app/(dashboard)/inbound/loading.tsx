import React from 'react'
import { SpreadsheetSkeleton } from '@/components/common/Skeleton'

export default function InboundLoading() {
  return <SpreadsheetSkeleton accentColor="amber" columnsCount={8} rowsCount={9} />
}

import React from 'react'
import { SpreadsheetSkeleton } from '@/components/common/Skeleton'

export default function IncomingActsLoading() {
  return <SpreadsheetSkeleton accentColor="emerald" columnsCount={14} rowsCount={10} />
}

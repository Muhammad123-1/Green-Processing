import { Suspense } from 'react'
import InspectionsContent from '@/components/inspections/InspectionsContent'
import InspectionsLoading from './loading'

export default function InspectionsPage() {
  return (
    <Suspense fallback={<InspectionsLoading />}>
      <InspectionsContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import InspectionsContent from '@/components/inspections/InspectionsContent'

export default function InspectionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="spinner" /></div>}>
      <InspectionsContent />
    </Suspense>
  )
}

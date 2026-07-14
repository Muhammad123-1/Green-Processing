import { Suspense } from 'react'
import ArrivalsContent from '@/components/arrivals/ArrivalsContent'

export default function ArrivalsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="spinner" /></div>}>
      <ArrivalsContent />
    </Suspense>
  )
}

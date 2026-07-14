import { Suspense } from 'react'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

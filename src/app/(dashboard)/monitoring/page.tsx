import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import MonitoringContent from '@/components/monitoring/MonitoringContent'
import React from 'react'

export const metadata = {
  title: 'Mijoz Buyurtmalari | Green Processing',
}

export default async function MonitoringPage() {
  const session = await getSession()
  if (session?.role === 'WAREHOUSE') {
    redirect('/warehouse')
  }
  return <MonitoringContent />
}

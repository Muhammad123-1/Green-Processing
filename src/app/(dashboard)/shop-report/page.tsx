import ShopReportContent from '@/components/production/ShopReportContent'
import React from 'react'
import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Sex Ishlab Chiqarish Hisoboti | Green Processing',
}

export default async function ShopReportPage() {
  const session = await getSession()
  if (session?.role === 'WAREHOUSE') {
    redirect('/warehouse')
  }
  return (
    <ShopReportContent
      userRole={session?.role || 'OPERATOR'}
      userName={session?.name || 'Foydalanuvchi'}
    />
  )
}

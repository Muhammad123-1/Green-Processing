import ShopReportContent from '@/components/production/ShopReportContent'
import React from 'react'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'Sex Ishlab Chiqarish Hisoboti | Green Processing',
}

export default async function ShopReportPage() {
  const session = await getSession()
  return (
    <ShopReportContent
      userRole={session?.role || 'OPERATOR'}
      userName={session?.name || 'Foydalanuvchi'}
    />
  )
}

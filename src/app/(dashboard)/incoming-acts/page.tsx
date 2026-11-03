import React from 'react'
import IncomingActsContent from '@/components/incoming-acts/IncomingActsContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: 'ВХОДНОЕ СЫРЬЕ (АКТЫ) - Kiruvchi Xomashyo Sifat Aktlari | Green Processing ERP',
  description: 'Kiruvchi xomashyo aktlari jurnali, sifat baholash (2-5), raqamli tekshiruv mezonlari va Excel import/export.'
}

export default async function IncomingActsPage() {
  const session = await getSession()
  return (
    <IncomingActsContent
      userRole={session?.role || 'INSPECTOR'}
      userName={session?.name || 'Sifat Nazoratchisi'}
    />
  )
}

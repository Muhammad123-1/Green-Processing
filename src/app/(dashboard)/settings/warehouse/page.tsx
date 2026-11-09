import { Suspense } from 'react'
import { getSession } from '@/app/actions/auth'
import SettingsContent from '@/components/settings/SettingsContent'

export const metadata = {
  title: 'Omborxona Sozlamalari | Green Processing',
}

export default async function WarehouseSettingsPage() {
  const session = await getSession()
  const isAdminOrDirector = session?.role === 'ADMIN' || session?.role === 'DIRECTOR'

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <SettingsContent
        userRole={session?.role || 'WAREHOUSE'}
        userName={session?.name || 'Omborchi'}
        initialTab="warehouse"
        lockTab={!isAdminOrDirector}
      />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { getSession } from '@/app/actions/auth'
import SettingsContent from '@/components/settings/SettingsContent'

export const metadata = {
  title: 'Komissiya Raislari Sozlamalari | Green Processing',
}

export default async function ChairmenSettingsPage() {
  const session = await getSession()

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <SettingsContent
        userRole={session?.role || 'DEGUSTATION'}
        userName={session?.name || 'Komissiya'}
        initialTab="chairmen"
        lockTab={true}
      />
    </Suspense>
  )
}

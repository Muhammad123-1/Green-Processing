import { Suspense } from 'react'
import { getSession } from '@/app/actions/auth'
import SettingsContent from '@/components/settings/SettingsContent'

export const metadata = {
  title: 'Sozlamalar | Green Processing',
}

export default async function SettingsPage() {
  const session = await getSession()

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Yuklanmoqda...</div>}>
      <SettingsContent
        userRole={session?.role || 'OPERATOR'}
        userName={session?.name || 'Foydalanuvchi'}
      />
    </Suspense>
  )
}

import { getSession } from '@/app/actions/auth'
import DailyChecklistContent from '@/components/inspector/DailyChecklistContent'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Smena Yakuni Check-list | Green Processing ERP',
  description: 'Ishlab chiqarish smenasi yakuni yagona tekshiruv dalolatnomasi',
}

export default async function ProductionDailyChecklistPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return <DailyChecklistContent />
}

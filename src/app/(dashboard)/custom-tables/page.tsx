import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import CustomTablesContent from '@/components/settings/CustomTablesContent'

export const metadata = { title: 'Maxsus Jadvallar | Green Processing ERP' }

export default async function CustomTablesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <CustomTablesContent />
}

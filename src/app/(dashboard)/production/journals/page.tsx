import { getSession } from '@/app/actions/auth'
import ShopQCContent from '@/components/inspector/ShopQCContent'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Sex Nazorati Jurnallari | Green Processing ERP',
  description: 'Ishlab chiqarish harorati va sifat nazorati operatsion jurnallari',
}

export default async function ProductionJournalsPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return <ShopQCContent />
}

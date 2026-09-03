import { getSession } from '@/app/actions/auth'
import ShopQCContent from '@/components/inspector/ShopQCContent'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Sex Nazorati (Jurnallar) | Green Processing ERP',
  description: 'Ishlab chiqarish harorati va sifat nazorati jurnallari',
}

export default async function InspectorPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return <ShopQCContent />
}

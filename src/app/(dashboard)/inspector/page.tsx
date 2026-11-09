import { getSession } from '@/app/actions/auth'
import InspectorEmptyContent from '@/components/inspector/InspectorEmptyContent'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Nazoratchi (Inspector) | Green Processing ERP',
  description: "Nazoratchi bo'limi",
}

export default async function InspectorPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return <InspectorEmptyContent />
}

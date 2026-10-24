import type { Metadata } from 'next'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import ChatBadgeListener from '@/components/chat/ChatBadgeListener'
import { getSession } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Kiruvchi Xomashyo Nazorati',
  description: 'Kiruvchi xom ashyo qabul qilish nazorat tizimi',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <ChatBadgeListener />
      <Sidebar userRole={session?.role} userName={session?.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
        <MobileNav userRole={session?.role} />
      </div>
    </div>
  )
}

import ChatContent from '@/components/chat/ChatContent'
import { getSession } from '@/app/actions/auth'

export default async function ChatPage() {
  const session = await getSession()
  return <ChatContent userRole={session?.role || 'Foydalanuvchi'} userName={session?.name || 'Anonim'} />
}

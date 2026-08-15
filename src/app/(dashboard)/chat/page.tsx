import ChatContent from '@/components/chat/ChatContent'
import { getSession } from '@/app/actions/auth'

export default async function ChatPage() {
  const session = await getSession()
  return (
    <ChatContent
      currentUserId={session?.id || 0}
      userRole={session?.role || 'OPERATOR'}
      userName={session?.name || 'Foydalanuvchi'}
    />
  )
}

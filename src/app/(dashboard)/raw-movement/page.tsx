import RawMovementContent from '@/components/warehouse/RawMovementContent'
import { getSession } from '@/app/actions/auth'

export const metadata = {
  title: "Asosiy xomashyolarni sexga uzatish (Списание / Chiqim) | Green Processing ERP",
  description: "Ombor kirim, harorat nazorati va sexlarga xomashyo chiqimi monitoringi jurnali"
}

export default async function RawMovementPage() {
  const session = await getSession()
  return <RawMovementContent userRole={session?.role || 'WAREHOUSE'} userName={session?.name || 'Skladchi'} />
}

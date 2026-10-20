import KitchenContent from '@/components/kitchen/KitchenContent'
import { getSession } from '@/app/actions/auth'

export default async function KitchenPage() {
  const session = await getSession()
  return <KitchenContent userRole={session?.role} userName={session?.name} />
}

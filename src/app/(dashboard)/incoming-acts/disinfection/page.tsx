import { Metadata } from 'next'
import DisinfectionActsContent from '@/components/incoming-acts/DisinfectionActsContent'

export const metadata: Metadata = {
  title: 'Dezinfeksiya va yuvish vositalari | Green Processing',
  description: 'Журнал регистрации поступления моющих, дезинфицирующих и химических средств',
}

export default function DisinfectionActsPage() {
  return <DisinfectionActsContent />
}

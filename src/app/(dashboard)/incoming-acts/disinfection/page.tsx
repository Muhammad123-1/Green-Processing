import { Metadata } from 'next'
import DisinfectionActsContent from '@/components/incoming-acts/DisinfectionActsContent'

export const metadata: Metadata = {
  title: 'Dezinfeksiya va yuvish vositalari (Ф-2/05) | Green Processing',
  description: 'Журнал регистрации поступления моющих и дезинфицирующих средств (Форма Ф-2/05)',
}

export default function DisinfectionActsPage() {
  return <DisinfectionActsContent />
}

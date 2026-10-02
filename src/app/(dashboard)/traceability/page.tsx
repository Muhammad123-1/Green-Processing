import TraceabilityContent from '@/components/traceability/TraceabilityContent'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mahsulot Pasporti | Green Processing',
  description: 'Global Traceability Tree',
}

export default function TraceabilityPage() {
  return <TraceabilityContent />
}

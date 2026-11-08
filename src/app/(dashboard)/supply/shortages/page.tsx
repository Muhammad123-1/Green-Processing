import SupplyShortagesContent from '@/components/supply/SupplyShortagesContent'

export const metadata = {
  title: 'Ombordan Qolmagan Mahsulotlar | Supply Shortages',
  description: "Ombor talabnomalari va ta'minotchilarga buyurtma jo'natish tizimi",
}

export default function SupplyShortagesPage() {
  return (
    <div className="p-0 sm:p-2">
      <div className="max-w-7xl mx-auto">
        <SupplyShortagesContent />
      </div>
    </div>
  )
}

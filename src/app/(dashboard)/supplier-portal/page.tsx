import SupplierPortalContent from '@/components/supplier/SupplierPortalContent'

export const metadata = {
  title: "Yetkazib Beruvchi Portali | Green Processing ERP",
  description: "Yetkazib beruvchilar uchun korxonadan kelayotgan xarid buyurtmalari portali"
}

export default function SupplierPortalPage() {
  return (
    <div className="p-0 sm:p-2">
      <SupplierPortalContent />
    </div>
  )
}

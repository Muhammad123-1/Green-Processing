import SupplierAccountsManager from '@/components/admin/SupplierAccountsManager'

export const metadata = {
  title: "Ta'minotchi Akkauntlari | Green Processing ERP",
  description: "Yetkazib beruvchilar uchun portal kirish akkauntlari boshqaruvi"
}

export default function AdminSuppliersPage() {
  return (
    <div className="p-0 sm:p-2">
      <SupplierAccountsManager />
    </div>
  )
}

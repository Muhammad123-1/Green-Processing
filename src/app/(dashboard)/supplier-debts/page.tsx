import SupplierDebtsTable from '@/components/accounting/SupplierDebtsTable'

export const metadata = {
  title: "Ta'minotchi qarzdorligi | Green Processing",
}

export default function SupplierDebtsPage() {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm">
        <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">Ta&apos;minotchi qarzdorligi</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          To&apos;lanmagan va qisman to&apos;langan ta&apos;minotchilar alohida ko&apos;rsatiladi.
        </p>
      </div>
      <SupplierDebtsTable isProcurementView initialStatusFilter="UNPAID" />
    </div>
  )
}

import React, { Suspense } from 'react'
import { FirstAidJournalView } from '@/components/degustatsiya/FirstAidJournalView'
import Link from 'next/link'
import { HeartPulse, UtensilsCrossed, Truck, MessageSquare, CalendarCheck2 } from 'lucide-react'

export const metadata = {
  title: 'Ходимларга биринчи ёрдам кўрсатиш журнали | Green Processing ERP',
  description: 'Ходимларга биринчи тиббий ёрдам кўрсатиш ва тиббий қабул журнали (1 ва 2-расм бўйича 12 та кўрсаткич).'
}

export default async function FirstAidPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Биринчи ёрдам кўрсатиш журнали юкланмоқда...
        </div>
      }
    >
      <div className="space-y-4 pb-12">
        {/* Sleek, simple Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 text-slate-900 dark:text-white shadow-xs flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href="/degustatsiya"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
              title="Ошхона бракераж журналига ўтиш"
            >
              <UtensilsCrossed size={15} className="text-slate-500" />
              <span>Ошхона Бракеражи</span>
            </Link>

            <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-xs">
              <HeartPulse size={16} />
              <span>Биринчи Ёрдам Журнали</span>
            </span>

            <Link
              href="/drivers-medical"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
              title="Ҳайдовчилар тиббий кўригига ўтиш (3 ва 4-расм)"
            >
              <Truck size={15} className="text-slate-500" />
              <span>Ҳайдовчилар кўриги</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <CalendarCheck2 size={14} className="text-slate-500" />
              <span className="font-mono font-bold">
                {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>

            <Link
              href="/chat?group=kitchen_supply"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 transition"
              title="Ошхона ва таъминот чати"
            >
              <MessageSquare size={14} />
              <span>Чат</span>
            </Link>
          </div>
        </div>

        {/* Dedicated 12-Column Journal Table */}
        <FirstAidJournalView isFullPage={true} />
      </div>
    </Suspense>
  )
}

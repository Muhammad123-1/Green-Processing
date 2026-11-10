import React, { Suspense } from 'react'
import { FirstAidJournalView } from '@/components/degustatsiya/FirstAidJournalView'
import { getSession } from '@/app/actions/auth'
import Link from 'next/link'
import { HeartPulse, UtensilsCrossed, Truck, ShieldCheck, CalendarCheck2 } from 'lucide-react'

export const metadata = {
  title: 'Ходимларга биринчи ёрдам кўрсатиш журнали | Green Processing ERP',
  description: 'Ходимларга биринчи тиббий ёрдам кўрсатиш ва тиббий қабул журнали (1 ва 2-расм бўйича 12 та кўрсаткич).'
}

export default async function FirstAidPage() {
  const session = await getSession()

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold">
          Биринчи ёрдам кўрсатиш журнали юкланмоқда...
        </div>
      }
    >
      <div className="space-y-6 pb-12">
        {/* Top Banner - Clean, calm, high-contrast */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shrink-0 border border-slate-700">
                <HeartPulse size={26} className="text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    1 ва 2-расм бўйича расмий журнал
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">12 та расмий кўрсаткич</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Ходимларга Биринчи Ёрдам Кўрсатиш Журнали
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Мурожаат қилган ходим маълумотлари, шикоятлари, кўрик натижалари, кўрсатилган ёрдам ва тиббий муассасага юбориш хулосаларини кунлик қайд этиш дафтари.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 no-print">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shrink-0">
                <CalendarCheck2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                <div className="text-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-medium">Бугунги сана:</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Quick links to other SanPiN pages */}
              <Link
                href="/degustatsiya"
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                title="Ошхона бракераж журналига ўтиш"
              >
                <UtensilsCrossed size={16} className="text-slate-500" />
                <span>Ошхона</span>
              </Link>

              <Link
                href="/drivers-medical"
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                title="Ҳайдовчилар тиббий кўригига ўтиш"
              >
                <Truck size={16} className="text-slate-500" />
                <span>Ҳайдовчилар</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dedicated 12-Column Journal Table */}
        <FirstAidJournalView isFullPage={true} />
      </div>
    </Suspense>
  )
}

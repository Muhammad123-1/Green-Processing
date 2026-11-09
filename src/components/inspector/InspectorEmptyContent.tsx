'use client'

import React from 'react'
import { ClipboardCheck, Sparkles, Clock, ArrowRight, ChefHat } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Link from 'next/link'

export default function InspectorEmptyContent() {
  const { formatDual } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-enter space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-1">
            <ClipboardCheck size={28} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                {formatDual("Nazoratchi Bo'limi", "Отдел Инспектора", "Inspector Department")}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Clock size={10} />
                <span>{formatDual("Qayta ishlanmoqda", "В разработке", "Under Development")}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatDual("Nazoratchi (Inspector) Bo'limi", "Панель Инспектора", "Inspector Workspace")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {formatDual(
                "Ushbu bo'lim yangi texnologik talablar va vazifalar asosida boshqatdan ishlab chiqilmoqda.",
                "Этот раздел разрабатывается заново в соответствии с новыми задачами инспекции.",
                "This section is being rebuilt from scratch to match updated inspection requirements."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Empty State Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-8 sm:p-14 text-center shadow-xs space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center mx-auto text-slate-400">
          <Sparkles size={28} className="text-blue-500" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {formatDual("Bo'lim hozirda bo'sh", "Раздел пока свободен", "Department Workspace is Empty")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {formatDual(
              "Sex nazorati jurnallari (FSSC 22000, kalibrovka, degustatsiya) va smena chek-listi Ishlab chiqarish (Production) bo'limiga o'tkazildi. Ushbu bo'lim uchun yangi funksiyalar tez orada tayyor bo'ladi.",
              "Журналы контроля цеха и чек-лист смены перенесены в раздел Производство. Новые функции инспектора будут добавлены в ближайшее время.",
              "Shop floor logs and shift checklists have been moved to Production. New inspector tools will be available soon."
            )}
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/production/journals"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-dark-750 dark:hover:bg-dark-700 border border-slate-700 transition-all shadow-xs"
          >
            <ChefHat size={15} />
            <span>{formatDual("Ishlab chiqarish jurnallariga o'tish", "Перейти к журналам производства", "Go to Production Journals")}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface ExecutiveAlertItem {
  id: string
  type: 'MARGIN_SQUEEZE' | 'CREDIT_RISK' | 'UNPROFITABLE' | 'HIGH_RETURNS' | 'CONCENTRATION_RISK' | 'UNCLASSIFIED_CUSTOMERS'
  severity: 'HIGH' | 'MEDIUM' | 'INFO'
  titleUz: string
  titleRu: string
  titleEn: string
  messageUz: string
  messageRu: string
  messageEn: string
  channelKey?: string
  metricValue?: number
}

interface Props {
  alerts: ExecutiveAlertItem[]
  onOpenSettings?: () => void
  onFilterChannel?: (channelKey: string) => void
}

export default function AlertsBanner({ alerts, onOpenSettings, onFilterChannel }: Props) {
  const { formatDual, lang } = useLanguage()
  const [expanded, setExpanded] = useState(true)

  if (!alerts || alerts.length === 0) return null

  const highSeverityCount = alerts.filter(a => a.severity === 'HIGH').length

  const getAlertTitle = (a: ExecutiveAlertItem) => {
    return lang === 'ru' ? a.titleRu : lang === 'en' ? a.titleEn : a.titleUz
  }

  const getAlertMessage = (a: ExecutiveAlertItem) => {
    return lang === 'ru' ? a.messageRu : lang === 'en' ? a.messageEn : a.messageUz
  }

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-slate-900 dark:text-white shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-amber-950 dark:text-amber-200">
                {formatDual("Taqsimot kanallari bo'yicha ogohlantirishlar", "Предупреждения по каналам сбыта", "Distribution Channel Risk Alerts")}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300">
                {alerts.length} ta
              </span>
              {highSeverityCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  {highSeverityCount} {formatDual("yuqori xatar", "высокий риск", "high risk")}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              {formatDual(
                "Marja siqilishi, muddati o'tgan qarzdorlik yoki konsentratsiya xatarlari aniqlandi",
                "Обнаружены риски сжатия маржи, просроченной задолженности или концентрации",
                "Margin squeeze, overdue credit, or concentration risks detected"
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-amber-200/60 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 transition cursor-pointer"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-amber-200 dark:border-amber-800/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {alerts.map(a => {
            const isHigh = a.severity === 'HIGH'
            const isInfo = a.severity === 'INFO'
            return (
              <div
                key={a.id}
                className={`p-3 rounded-xl border flex flex-col justify-between text-xs transition ${
                  isHigh
                    ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
                    : isInfo
                    ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900/60 text-blue-950 dark:text-blue-100'
                    : 'bg-white/90 dark:bg-dark-900/90 border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {isHigh ? (
                      <AlertOctagon size={14} className="text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    )}
                    <span className="truncate">{getAlertTitle(a)}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {getAlertMessage(a)}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-current/10 flex items-center justify-between">
                  {a.channelKey && onFilterChannel ? (
                    <button
                      type="button"
                      onClick={() => onFilterChannel(a.channelKey!)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{formatDual("Kanalni tekshirish", "Проверить канал", "Inspect channel")}</span>
                      <ArrowRight size={12} />
                    </button>
                  ) : a.type === 'UNCLASSIFIED_CUSTOMERS' && onOpenSettings ? (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{formatDual("Tasnifni sozlash", "Настроить каналы", "Configure channels")}</span>
                      <ArrowRight size={12} />
                    </button>
                  ) : <div />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'

export interface WarehouseSignature {
  url: string
  name: string
  title: string
}

export function useWarehouseSignature() {
  const [signature, setSignature] = useState<WarehouseSignature>({
    url: '',
    name: "Mas'ul xodim",
    title: "Ombor mudiri"
  })

  const loadSignature = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, string> = {}
          data.forEach((s: any) => { map[s.key] = s.value })
          setSignature({
            url: map['warehouse_signature_url'] || map['qc_signature_url'] || '',
            name: map['warehouse_signature_name'] || map['qc_signature_name'] || 'Isakov M.',
            title: map['warehouse_signature_title'] || map['qc_signature_title'] || "Ombor mudiri / Mas'ul xodim"
          })
        }
      })
      .catch(err => console.error('Failed to load warehouse signature', err))
  }

  useEffect(() => {
    loadSignature()
    // Re-check on window focus so changes in settings tab reflect immediately
    window.addEventListener('focus', loadSignature)
    return () => window.removeEventListener('focus', loadSignature)
  }, [])

  return signature
}

export function SignatureCell({
  url,
  name = "Mas'ul",
  title = "Ombor mudiri",
  formatDual
}: {
  url?: string
  name?: string
  title?: string
  formatDual: (uz: string, ru: string, en?: string) => string
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!url) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-400 dark:text-slate-500 text-[10px] italic border border-slate-200 dark:border-dark-700">
        {formatDual("Imzo yo'q", "Нет подписи", "No signature")}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-700 cursor-pointer group transition-all shadow-xs"
        title={formatDual("Imzoni kattalashtirib ko'rish", "Увеличить подпись", "Click to enlarge signature")}
      >
        <div className="w-10 h-6 bg-white dark:bg-dark-900 rounded-lg p-0.5 border border-slate-200 dark:border-dark-700 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={url}
            alt={name || "Imzo"}
            className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow group-hover:scale-110 transition-transform"
          />
        </div>
        <div className="text-left leading-tight min-w-0">
          <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
            {name}
          </span>
          <span className="block text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">
            Imzo ✓
          </span>
        </div>
      </button>

      {/* Signature Preview Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-sm w-full bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl overflow-hidden shadow-2xl p-5 flex flex-col space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {formatDual("Mas'ul Shaxs Imzosi", "Электронная подпись", "Digital Signature")}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {formatDual("Rasmiy tasdiqlangan faksimile", "Официальное факсимиле", "Official facsimile")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Signature Large Canvas */}
            <div className="w-full h-40 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-inner">
              <img
                src={url}
                alt={name || "Signature"}
                className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow-md"
              />
            </div>

            {/* Staff Details */}
            <div className="bg-slate-50 dark:bg-dark-800/70 p-3 rounded-2xl border border-slate-200 dark:border-dark-700 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                  {formatDual("Mas'ul xodim", "Ответственный сотрудник", "Responsible Staff")}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {title}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Faol Imzo
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-dark-700 dark:hover:bg-dark-600 text-white font-bold text-xs transition"
            >
              {formatDual("Yopish", "Закрыть", "Close")}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

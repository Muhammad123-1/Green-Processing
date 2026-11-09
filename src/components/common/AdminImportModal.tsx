'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface AdminImportModalProps {
  isOpen: boolean
  onClose: () => void
  userRole?: string
  userName?: string
  targetName: string
  endpoint?: string
  onSuccess: (data: any) => void
  allowedModes?: boolean
  defaultMode?: 'append' | 'replace'
  hint?: string
}

export default function AdminImportModal({
  isOpen,
  onClose,
  userRole = '',
  userName = 'Administrator',
  targetName,
  endpoint = '/api/shop-report/import',
  onSuccess,
  allowedModes = false,
  defaultMode = 'append',
  hint,
}: AdminImportModalProps) {
  const { lang, formatDual } = useLanguage()
  const isUz = lang === 'uz' || !lang.startsWith('ru')

  const isAdmin = (userRole || '').toUpperCase() === 'ADMIN'

  const [file, setFile] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'append' | 'replace'>(defaultMode)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setReason('')
      setMode(defaultMode)
      setLoading(false)
    }
  }, [isOpen, defaultMode])

  if (!isOpen) return null

  const minReasonChars = 10
  const isReasonValid = reason.trim().length >= minReasonChars
  const canSubmit = Boolean(file && isReasonValid && !loading && isAdmin)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')) {
        setFile(f)
      } else {
        toast.error(
          formatDual(
            'Faqat Excel (.xlsx, .xls) fayllari qabul qilinadi!',
            'Принимаются только файлы Excel (.xlsx, .xls)!'
          )
        )
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error(
        formatDual(
          'Faqat Tizim Administratori fayl import qila oladi!',
          'Только Системный Администратор может импортировать файлы!'
        )
      )
      return
    }

    if (!file) {
      toast.error(
        formatDual('Iltimos, Excel faylni tanlang!', 'Пожалуйста, выберите файл Excel!')
      )
      return
    }

    if (!isReasonValid) {
      toast.error(
        formatDual(
          `Import sababi kamida ${minReasonChars} ta belgidan iborat bo'lishi shart!`,
          `Причина импорта должна содержать не менее ${minReasonChars} символов!`
        )
      )
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reason', reason.trim())
      formData.append('target', targetName)
      formData.append('mode', mode)

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Import jarayonida xatolik yuz berdi")
      }

      toast.success(
        formatDual(
          "Fayl muvaffaqiyatli import qilindi va audit jurnali saqlandi!",
          "Файл успешно импортирован и записан в журнал аудита!"
        )
      )
      onSuccess(data)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Importda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0c1425] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* NON-ADMIN ACCESS DENIED STATE */}
        {!isAdmin ? (
          <div className="p-7 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center ring-8 ring-amber-500/5">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {formatDual(
                  "Ruxsat Cheklangan (Faqat Administrator)",
                  "Доступ ограничен (Только Администратор)"
                )}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                {formatDual(
                  "Ma'lumotlar yaxlitligi va qat'iy nazorat qoidalariga asosan tizimga Excel orqali fayl import qilish FAQAT Tizim Administratori (ADMIN) ga ruxsat etilgan. Hatto Direktor va boshqa bo'lim mas'ullari uchun import huquqi yopiq.",
                  "В целях сохранения целостности данных и строгого аудита импорт файлов через Excel разрешен ТОЛЬКО Системному Администратору (ADMIN). Доступ закрыт даже для Директора."
                )}
              </p>
            </div>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatDual('Sizning joriy rolingiz:', 'Ваша текущая роль:')} </span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                {userRole || 'MEHMON'}
              </strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm transition"
            >
              {formatDual('Tushundim, Yopish', 'Понятно, Закрыть')}
            </button>
          </div>
        ) : (
          /* ADMIN AUTHORIZED MODAL */
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold">
                      {formatDual('Admin Excel Importi', 'Импорт Excel (Админ)')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ADMIN VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {targetName} &bull; {userName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs bg-slate-50/50 dark:bg-[#0c1425]">
              {hint && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                  <p className="text-[11px] leading-relaxed">{hint}</p>
                </div>
              )}

              {/* File Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {formatDual('1. Excel Faylni Tanlang (.xlsx, .xls) *', '1. Выберите файл Excel (.xlsx, .xls) *')}
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                {!file ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/60 hover:bg-white dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {formatDual(
                          'Faylni sudrab keling yoki bosing',
                          'Перетащите файл или нажмите для выбора'
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        .xlsx yoki .xls formatidagi fayllar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[280px]">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {Math.round(file.size / 1024)} KB &bull; {formatDual('Yuklashga tayyor', 'Готов к загрузке')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1.5 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/40 rounded-lg text-emerald-800 dark:text-emerald-300 transition"
                      title={formatDual('Faylni almashtirish', 'Сменить файл')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Selection if allowed (Append vs Replace) */}
              {allowedModes && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {formatDual('Import Rejimi:', 'Режим импорта:')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('append')}
                      className={`p-3 rounded-xl border text-left transition ${
                        mode === 'append'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">{formatDual("Qo'shish (Append)", 'Добавление (Append)')}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDual('Mavjud ma\'lumotlar saqlanadi', 'Существующие данные сохраняются')}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('replace')}
                      className={`p-3 rounded-xl border text-left transition ${
                        mode === 'replace'
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200 ring-1 ring-red-500'
                          : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">{formatDual('Almashtirish (Replace)', 'Замена (Replace)')}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDual('Eski ma\'lumotlar tozalab yangilanadi', 'Старые данные очищаются и обновляются')}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Mandatory Reason (Izoh) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>
                      {formatDual(
                        '2. Import Sababi va Rasmiy Asosi (Majburiy) *',
                        '2. Причина и основание импорта (Обязательно) *'
                      )}
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      isReasonValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    {reason.trim().length} / {minReasonChars} ta belgi{' '}
                    {isReasonValid
                      ? formatDual('(Yetarli)', '(Достаточно)')
                      : formatDual('(Kam)', '(Мало)')}
                  </span>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={formatDual(
                    "Masalan: 2026-yil may oyi uchun sex xomashyo sarflari va yangi partiyalarni to'ldirish bo'yicha rasmiy topshiriq...",
                    "Например: Официальное поручение по обновлению расходов цеха и партий сырья за май 2026 года..."
                  )}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {formatDual(
                    "Ushbu izoh Sozlamalar bo'limidagi o'chmas Audit Jurnaliga kiritiladi va Tizim rahbariyati tomonidan doimiy ko'rib chiqiladi.",
                    'Эта причина будет записана в неизменяемый журнал аудита в Настройках и доступна руководству.'
                  )}
                </p>
              </div>

              {/* Audit Warning Callout */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="text-[11px] leading-relaxed">
                  <strong>{formatDual('Xavfsizlik ogohlantirishi:', 'Предупреждение безопасности:')}</strong>{' '}
                  {formatDual(
                    'Import amalga oshirilgandan so\'ng yuklangan fayl, qatorlar soni, kiritilgan sabab va sizning ismingiz tizim sozlamalariga muhrlanadi.',
                    'После завершения импорта имя файла, количество строк, введенная причина и ваше имя будут зафиксированы в журнале аудита.'
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 dark:bg-slate-900/90 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                {formatDual('Bekor qilish', 'Отмена')}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{formatDual('Import qilinmoqda...', 'Импортируется...')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{formatDual('Tasdiqlash va Import Qilish', 'Подтвердить и Импортировать')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

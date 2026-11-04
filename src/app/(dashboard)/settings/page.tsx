'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Settings,
  Building,
  FileSpreadsheet,
  Hash,
  FileSignature,
  Cloud,
  Upload,
  Trash2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface SettingItem {
  key: string
  value: string
  category: string
}

export default function SettingsPage() {
  const { formatDual } = useLanguage()
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const sigFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) setSettings(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function getSetting(key: string) {
    return settings.find((s) => s.key === key)?.value || ''
  }

  function setSetting(key: string, value: string) {
    setSettings((prev) => {
      const exists = prev.find((s) => s.key === key)
      if (exists) return prev.map((s) => s.key === key ? { ...s, value } : s)
      return [...prev, { key, value, category: 'general' }]
    })
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSig(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data?.url) {
        setSetting('warehouse_signature_url', data.url)
        if (!getSetting('warehouse_signature_name')) {
          setSetting('warehouse_signature_name', 'Isakov M.')
        }
        if (!getSetting('warehouse_signature_title')) {
          setSetting('warehouse_signature_title', "Ombor mudiri / Mas'ul xodim")
        }

        // Auto-save to settings in DB
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { key: 'warehouse_signature_url', value: data.url, category: 'signature' },
            { key: 'warehouse_signature_name', value: getSetting('warehouse_signature_name') || 'Isakov M.', category: 'signature' },
            { key: 'warehouse_signature_title', value: getSetting('warehouse_signature_title') || "Ombor mudiri / Mas'ul xodim", category: 'signature' },
          ]),
        })

        toast.success(
          formatDual(
            "Imzo Cloudflare R2 ga muvaffaqiyatli yuklandi!",
            "Подпись успешно загружена в Cloudflare R2!",
            "Signature uploaded to Cloudflare R2 successfully!"
          )
        )
      } else {
        toast.error(data?.error || formatDual("Rasm yuklashda xatolik", "Ошибка загрузки", "Upload failed"))
      }
    } catch {
      toast.error(formatDual("Rasm yuklashda xatolik", "Ошибка загрузки", "Upload failed"))
    } finally {
      setUploadingSig(false)
      if (sigFileInputRef.current) sigFileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) toast.success('Sozlamalar saqlandi')
      else toast.error('Saqlashda xatolik')
    } catch { toast.error('Xatolik') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">
            {formatDual("Tizim Sozlamalari", "Настройки системы", "System Settings")}
          </h1>
          <p className="section-subtitle">
            {formatDual("Korxona parametrlari, rekvizitlar va shablon konfiguratsiyasi", "Параметры предприятия, реквизиты и шаблоны", "Enterprise parameters, credentials and template configs")}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {formatDual("Saqlash", "Сохранить", "Save")}
        </button>
      </div>

      {/* Company Info */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <Building size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">{formatDual("Korxona ma'lumotlari", "Информация о предприятии", "Company Details")}</h3>
        </div>
        <div className="divider !mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">{formatDual("Korxona nomi", "Название компании", "Company Name")}</label>
            <input className="input-field" value={getSetting('company_name')}
              onChange={(e) => setSetting('company_name', e.target.value)}
              placeholder="Korxona nomi" />
          </div>
          <div>
            <label className="label">{formatDual("Telefon", "Телефон", "Phone")}</label>
            <input className="input-field" value={getSetting('company_phone')}
              onChange={(e) => setSetting('company_phone', e.target.value)}
              placeholder="+998 XX XXX XX XX" />
          </div>
          <div>
            <label className="label">{formatDual("Standart nazoratchi", "Стандартный контролер", "Default Inspector")}</label>
            <input className="input-field" value={getSetting('default_inspector')}
              onChange={(e) => setSetting('default_inspector', e.target.value)}
              placeholder="Sifat nazorati bo'limi" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{formatDual("Manzil", "Адрес", "Address")}</label>
            <input className="input-field" value={getSetting('company_address')}
              onChange={(e) => setSetting('company_address', e.target.value)}
              placeholder="Korxona manzili" />
          </div>
        </div>
      </div>

      {/* Warehouse Staff Signature Management (Cloudflare R2) */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileSignature size={16} className="text-amber-400" />
            <h3 className="font-semibold text-white text-sm">
              {formatDual("Mas'ul Xodimlar Imzosi (Elektron Imzo Rasmi)", "Подпись ответственного лица (Электронная подпись)", "Authorized Staff Signature")}
            </h3>
          </div>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Cloud size={12} />
            <span>Cloudflare R2</span>
          </span>
        </div>
        <div className="divider !mt-2" />
        <p className="text-xs text-slate-400 mb-4">
          {formatDual(
            "Xodim imzo rasmini yuklaydi. Ushbu imzo rasmi to'g'ridan-to'g'ri Cloudflare R2 bulutida saqlanadi va Kirim (Приход), Chiqim (Расход) hamda rasmiy FSSC 22000 jurnallarida tasdiqlovchi imzo sifatida ko'rinadi.",
            "Сотрудник загружает изображение подписи. Оно хранится в Cloudflare R2 и отображается в журналах Прихода, Расхода и отчетах FSSC 22000.",
            "Staff uploads signature image. Stored on Cloudflare R2 and displayed in Arrival, Dispatch, and FSSC 22000 journals."
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              {formatDual("Mas'ul Omborchi F.I.Sh", "ФИО ответственного кладовщика", "Warehouse Staff Full Name")}
            </label>
            <input
              className="input-field"
              value={getSetting('warehouse_signature_name') || 'Isakov M.'}
              onChange={(e) => setSetting('warehouse_signature_name', e.target.value)}
              placeholder="Isakov M."
            />
          </div>
          <div>
            <label className="label">
              {formatDual("Lavozimi / Vazifasi", "Должность", "Position / Role")}
            </label>
            <input
              className="input-field"
              value={getSetting('warehouse_signature_title') || "Ombor mudiri / Mas'ul xodim"}
              onChange={(e) => setSetting('warehouse_signature_title', e.target.value)}
              placeholder="Ombor mudiri / Mas'ul xodim"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label mb-1.5 block">
              {formatDual("Imzo rasmi (PNG, JPG, WEBP)", "Изображение подписи", "Signature Image")}
            </label>

            {/* Hidden File Input */}
            <input
              ref={sigFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureUpload}
            />

            {getSetting('warehouse_signature_url') ? (
              <div className="bg-dark-800/90 border border-dark-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-40 h-20 bg-dark-900 border border-dark-600 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group shadow-inner">
                    <img
                      src={getSetting('warehouse_signature_url')}
                      alt="Warehouse Signature"
                      className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">
                        {getSetting('warehouse_signature_name') || 'Isakov M.'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        <span>Cloudflare R2</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {getSetting('warehouse_signature_title') || "Ombor mudiri / Mas'ul xodim"}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                      {getSetting('warehouse_signature_url')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingSig}
                    onClick={() => sigFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    {uploadingSig ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    <span>{formatDual("Almashtirish", "Заменить", "Replace")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetting('warehouse_signature_url', '')}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={formatDual("Imzoni o'chirish", "Удалить подпись", "Delete signature")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => sigFileInputRef.current?.click()}
                className="border-2 border-dashed border-dark-600 hover:border-amber-500/60 bg-dark-800/40 hover:bg-dark-800/80 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                {uploadingSig ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <Loader2 size={28} className="animate-spin text-amber-500" />
                    <span className="text-xs font-bold text-slate-300">
                      {formatDual("Cloudflare R2 ga yuklanmoqda...", "Загрузка в Cloudflare R2...", "Uploading to Cloudflare R2...")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {formatDual("Imzo rasmini yuklash uchun bosing", "Нажмите для загрузки подписи", "Click to upload signature image")}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        PNG, JPG yoki shaffof fonli rasm (Cloudflare R2 saqlash)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Numbering */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <Hash size={16} className="text-purple-400" />
          <h3 className="font-semibold text-white text-sm">{formatDual("Akt raqamlash", "Нумерация актов", "Act Numbering")}</h3>
        </div>
        <div className="divider !mt-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{formatDual("Prefiks", "Префикс", "Prefix")}</label>
            <input className="input-field" value={getSetting('act_number_prefix')}
              onChange={(e) => setSetting('act_number_prefix', e.target.value)}
              placeholder="КС" />
          </div>
          <div>
            <label className="label">{formatDual("Format", "Формат", "Format")}</label>
            <input className="input-field" value={getSetting('act_number_format')}
              onChange={(e) => setSetting('act_number_format', e.target.value)}
              placeholder="PREFIX-YEAR-NUMBER" />
            <p className="text-xs text-slate-500 mt-1">{formatDual("Misol: КС-2026-0001", "Пример: КС-2026-0001", "Example: КС-2026-0001")}</p>
          </div>
        </div>
      </div>

      {/* Template */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">{formatDual("Excel shablon", "Шаблон Excel", "Excel Template")}</h3>
        </div>
        <div className="divider !mt-2" />
        <div>
          <label className="label">{formatDual("Shablon fayl yo'li", "Путь к файлу шаблона", "Template File Path")}</label>
          <input className="input-field" value={getSetting('excel_template_path')}
            onChange={(e) => setSetting('excel_template_path', e.target.value)}
            placeholder="templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx" />
          <p className="text-xs text-slate-500 mt-1">
            {formatDual(
              "Asl Excel fayli avtomatik ravishda \"templates\" papkasidan qidiriladi. Shablon faylni \"templates\" papkasiga nusxalang.",
              "Исходный файл Excel автоматически ищется в папке \"templates\". Скопируйте файл шаблона в папку \"templates\".",
              "Original Excel file is searched automatically in \"templates\" folder. Copy template file to \"templates\" folder."
            )}
          </p>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300 font-medium mb-2">📋 {formatDual("Shablon qo'yish yo'riqnomasi:", "Инструкция по установке шаблона:", "Template setup instructions:")}</p>
          <ol className="text-xs text-blue-200/70 space-y-1 list-decimal list-inside">
            <li>{formatDual("Loyiha papkasida \"templates\" nomli papka yarating", "В папке проекта создайте папку \"templates\"", "Create a folder named \"templates\" in the project directory")}</li>
            <li>{formatDual("Asl Excel faylini (ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx) o'sha papkaga nusxalang", "Скопируйте исходный файл Excel (ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx) в эту папку", "Copy original Excel file (ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx) into that folder")}</li>
            <li>{formatDual("Tizim avtomatik ravishda shu faylni topadi va ishlatadi", "Система автоматически найдет и будет использовать этот файл", "System will automatically locate and use this file")}</li>
            <li>{formatDual("Agar shablon topilmasa, oddiy Excel fayli yaratiladi", "Если шаблон не найден, создается стандартный файл Excel", "If template is not found, a standard Excel file is generated")}</li>
          </ol>
        </div>
      </div>

      <div className="flex justify-end pb-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {formatDual("Saqlash", "Сохранить", "Save")}
        </button>
      </div>
    </div>
  )
}

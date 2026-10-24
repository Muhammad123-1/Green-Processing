'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Settings, Building, FileSpreadsheet, Hash } from 'lucide-react'
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

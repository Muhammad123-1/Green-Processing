'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Settings, Building, FileSpreadsheet, Hash } from 'lucide-react'

interface SettingItem {
  key: string
  value: string
  category: string
}

export default function SettingsPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Sozlamalar</h1>
          <p className="section-subtitle">Tizim sozlamalari va konfiguratsiya</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Saqlash
        </button>
      </div>

      {/* Company Info */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <Building size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Korxona ma'lumotlari</h3>
        </div>
        <div className="divider !mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Korxona nomi</label>
            <input className="input-field" value={getSetting('company_name')}
              onChange={(e) => setSetting('company_name', e.target.value)}
              placeholder="Korxona nomi" />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input-field" value={getSetting('company_phone')}
              onChange={(e) => setSetting('company_phone', e.target.value)}
              placeholder="+998 XX XXX XX XX" />
          </div>
          <div>
            <label className="label">Standart nazoratchi</label>
            <input className="input-field" value={getSetting('default_inspector')}
              onChange={(e) => setSetting('default_inspector', e.target.value)}
              placeholder="Sifat nazorati bo'limi" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Manzil</label>
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
          <h3 className="font-semibold text-white text-sm">Akt raqamlash</h3>
        </div>
        <div className="divider !mt-2" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prefiks</label>
            <input className="input-field" value={getSetting('act_number_prefix')}
              onChange={(e) => setSetting('act_number_prefix', e.target.value)}
              placeholder="КС" />
          </div>
          <div>
            <label className="label">Format</label>
            <input className="input-field" value={getSetting('act_number_format')}
              onChange={(e) => setSetting('act_number_format', e.target.value)}
              placeholder="PREFIX-YEAR-NUMBER" />
            <p className="text-xs text-slate-500 mt-1">Misol: КС-2026-0001</p>
          </div>
        </div>
      </div>

      {/* Template */}
      <div className="form-section">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">Excel shablon</h3>
        </div>
        <div className="divider !mt-2" />
        <div>
          <label className="label">Shablon fayl yo'li</label>
          <input className="input-field" value={getSetting('excel_template_path')}
            onChange={(e) => setSetting('excel_template_path', e.target.value)}
            placeholder="templates/ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx" />
          <p className="text-xs text-slate-500 mt-1">
            Asl Excel fayli avtomatik ravishda &ldquo;templates&rdquo; papkasidan qidiriladi.
            Shablon faylni &ldquo;templates&rdquo; papkasiga nusxalang.
          </p>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300 font-medium mb-2">📋 Shablon qo'yish yo'riqnomasi:</p>
          <ol className="text-xs text-blue-200/70 space-y-1 list-decimal list-inside">
            <li>Loyiha papkasida &ldquo;templates&rdquo; nomli papka yarating</li>
            <li>Asl Excel faylini (ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx) o'sha papkaga nusxalang</li>
            <li>Tizim avtomatik ravishda shu faylni topadi va ishlatadi</li>
            <li>Agar shablon topilmasa, oddiy Excel fayli yaratiladi</li>
          </ol>
        </div>
      </div>

      <div className="flex justify-end pb-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Saqlash
        </button>
      </div>
    </div>
  )
}

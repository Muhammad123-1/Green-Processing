'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Building,
  Upload,
  Trash2,
  Phone,
  User,
  ShieldCheck,
  Truck,
  Package,
  FileSpreadsheet,
  History,
  Calendar,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useSearchParams, useRouter } from 'next/navigation'

interface SettingItem {
  key: string
  value: string
  category: string
}

export type SettingsTab = 'supply' | 'qc' | 'warehouse' | 'general' | 'audit'

interface SettingsContentProps {
  userRole?: string
  userName?: string
  initialTab?: SettingsTab
  lockTab?: boolean
}

export default function SettingsContent({
  userRole = 'OPERATOR',
  userName,
  initialTab,
  lockTab = false,
}: SettingsContentProps) {
  const { formatDual, lang, t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()

  const isAdminOrDirector = userRole === 'ADMIN' || userRole === 'DIRECTOR'
  const isWarehouse = userRole === 'WAREHOUSE'
  const isSupply = userRole === 'SUPPLY'
  const isQC = userRole === 'QUALITY_CONTROL' || userRole === 'INSPECTOR'

  // Determine which tabs this user is allowed to access
  const allowedTabs: SettingsTab[] = useMemo(() => {
    if (lockTab && initialTab) return [initialTab]
    if (isAdminOrDirector) return ['supply', 'qc', 'warehouse', 'general', 'audit']
    if (isWarehouse) return ['warehouse']
    if (isSupply) return ['supply']
    if (isQC) return ['qc']
    return ['general']
  }, [lockTab, initialTab, isAdminOrDirector, isWarehouse, isSupply, isQC])

  // Determine default tab
  const defaultTab: SettingsTab = useMemo(() => {
    const fromParam = searchParams ? (searchParams.get('tab') as SettingsTab) : null
    if (fromParam && allowedTabs.includes(fromParam)) return fromParam
    if (initialTab && allowedTabs.includes(initialTab)) return initialTab
    if (isWarehouse) return 'warehouse'
    if (isSupply) return 'supply'
    if (isQC) return 'qc'
    if (isAdminOrDirector) return fromParam || initialTab || 'general'
    return allowedTabs[0] || 'general'
  }, [searchParams, initialTab, allowedTabs, isWarehouse, isSupply, isQC, isAdminOrDirector])

  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab)
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Audit tab filters
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilterTarget, setAuditFilterTarget] = useState('ALL')

  // Uploading states per department
  const [uploadingDept, setUploadingDept] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentUploadKey, setCurrentUploadKey] = useState<string>('')

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    const fromParam = searchParams ? (searchParams.get('tab') as SettingsTab) : null
    if (fromParam && allowedTabs.includes(fromParam)) {
      setActiveTab(fromParam)
    }
  }, [searchParams, allowedTabs])

  // Keep activeTab within allowedTabs
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'general')
    }
  }, [allowedTabs, activeTab])

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  function getSetting(key: string, defaultValue = '') {
    return settings.find((s) => s.key === key)?.value || defaultValue
  }

  // Parse audit history from Settings table
  const importHistory = useMemo(() => {
    try {
      const raw = getSetting('import_audit_history', '[]')
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [settings])

  const shiftEditHistory = useMemo(() => {
    try {
      const raw = getSetting('shift_audit_history', '[]')
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [settings])

  const allAuditEntries = useMemo(() => {
    const imports = importHistory.map((item: any) => ({
      type: 'IMPORT' as const,
      id: item.id || `imp-${item.timestamp}`,
      timestamp: item.timestamp,
      target: item.target || "Bo'lim ko'rsatilmagan",
      reason: item.reason || '',
      adminName: item.adminName || 'Admin',
      fileName: item.fileName,
      fileSize: item.fileSize,
      recordsCount: item.recordsCount,
      mode: item.mode,
      details: item.details,
    }))

    const shiftEdits = shiftEditHistory.map((item: any) => ({
      type: 'SHIFT_EDIT' as const,
      id: item.id || `shift-${item.timestamp}`,
      timestamp: item.timestamp,
      target: item.target || 'KIRIM',
      targetTitle: item.targetTitle || item.target || 'Kirim',
      reason: item.reason || '',
      userName: item.userName || 'Omborchi',
      userRole: item.userRole || 'WAREHOUSE',
      date: item.date,
      isAfter17: item.isAfter17 !== false,
      details: item.details,
    }))

    return [...imports, ...shiftEdits].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [importHistory, shiftEditHistory])

  const filteredAuditHistory = useMemo(() => {
    return allAuditEntries.filter((item: any) => {
      const q = auditSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.reason || '').toLowerCase().includes(q) ||
        (item.type === 'IMPORT' &&
          ((item.fileName || '').toLowerCase().includes(q) ||
            (item.adminName || '').toLowerCase().includes(q) ||
            (item.target || '').toLowerCase().includes(q))) ||
        (item.type === 'SHIFT_EDIT' &&
          ((item.userName || '').toLowerCase().includes(q) ||
            (item.targetTitle || '').toLowerCase().includes(q) ||
            (item.date || '').toLowerCase().includes(q)))

      if (!matchesSearch) return false

      if (auditFilterTarget === 'ALL') return true
      if (auditFilterTarget === 'IMPORT') return item.type === 'IMPORT'
      if (auditFilterTarget === 'AFTER_17') return item.type === 'SHIFT_EDIT'
      if (auditFilterTarget === 'Kirim') {
        return (
          (item.type === 'IMPORT' && (item.target || '').toLowerCase().includes('kirim')) ||
          (item.type === 'SHIFT_EDIT' && item.target === 'KIRIM')
        )
      }
      if (auditFilterTarget === 'Chiqim') {
        return (
          (item.type === 'IMPORT' && (item.target || '').toLowerCase().includes('chiqim')) ||
          (item.type === 'SHIFT_EDIT' && item.target === 'CHIQIM')
        )
      }
      if (auditFilterTarget === 'GP') {
        return (
          (item.type === 'IMPORT' && (item.target || '').toLowerCase().includes('gp')) ||
          (item.type === 'SHIFT_EDIT' && item.target === 'GP')
        )
      }
      return true
    })
  }, [allAuditEntries, auditSearch, auditFilterTarget])

  function setSetting(key: string, value: string, category = 'general') {
    setSettings((prev) => {
      const exists = prev.find((s) => s.key === key)
      if (exists) return prev.map((s) => (s.key === key ? { ...s, value } : s))
      return [...prev, { key, value, category }]
    })
  }

  function handleTabChange(tab: SettingsTab) {
    setActiveTab(tab)
    if (isAdminOrDirector && !lockTab) {
      router.replace(`/settings?tab=${tab}`)
    }
  }

  // Trigger file upload for specific signature
  function triggerUpload(signatureUrlKey: string, dept: string) {
    setCurrentUploadKey(signatureUrlKey)
    setUploadingDept(dept)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Handle image upload to Cloudflare R2 / API
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUploadKey) return

    setLoading(false)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data?.url) {
        setSetting(currentUploadKey, data.url, 'signature')

        // Auto-save this signature update immediately
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ key: currentUploadKey, value: data.url, category: 'signature' }]),
        })

        toast.success(
          formatDual(
            "Elektron imzo rasmi muvaffaqiyatli yuklandi!",
            "Электронная подпись успешно загружена!",
            "Signature image uploaded successfully!"
          )
        )
      } else {
        toast.error(data?.error || "Rasm yuklashda xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi: Rasm yuklanmadi")
    } finally {
      setUploadingDept(null)
      setCurrentUploadKey('')
    }
  }

  // Save all settings to DB
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success(
          formatDual(
            "Sozlamalar muvaffaqiyatli saqlandi!",
            "Настройки успешно сохранены!",
            "Settings saved successfully!"
          )
        )
      } else {
        toast.error("Saqlashda xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-500 mr-2" />
        <span>Sozlamalar yuklanmoqda...</span>
      </div>
    )
  }

  // Header info tailored to the active department
  const headerInfo = {
    supply: {
      badge: "GREEN PROCESSING • TA'MINOT BO'LIMI",
      badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      icon: <Truck size={24} className="text-blue-500" />,
      title: formatDual("Ta'minot Bo'limi Sozlamalari & Mas'ul Imzo", "Настройки отдела снабжения & Электронная подпись", "Supply Department Settings & Signature"),
      subtitle: formatDual(
        "Mas'ul ta'minotchi rekvizitlari, xarid buyurtmalarida chiqadigan telefon raqami va rasmiy faksimile imzosi",
        "ФИО, телефон и факсимиле подписи ответственного снабженца для оформления заказов",
        "Supply manager details, contact phone, and digital signature for purchase orders"
      ),
    },
    qc: {
      badge: "GREEN PROCESSING • SIFAT NAZORATI (QA/QC)",
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: <ShieldCheck size={24} className="text-emerald-500" />,
      title: formatDual("Sifat Nazorati Sozlamalari & Mas'ul Imzo", "Настройки контроля качества (QC) & Электронная подпись", "Quality Control Settings & Signature"),
      subtitle: formatDual(
        "Mas'ul sifat nazoratchisi ma'lumotlari, sovuq zanjir harorat normasi va kiruvchi sifat aktlaridagi rasmiy imzo",
        "ФИО инспектора по качеству, норма температуры и подпись для журналов входного контроля (Ф-01)",
        "QC inspector profile, cold-chain temperature standard, and digital signature for intake acts"
      ),
    },
    warehouse: {
      badge: "GREEN PROCESSING • OMBORXONA BO'LIMI",
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: <Package size={24} className="text-amber-500" />,
      title: formatDual("Omborxona Sozlamalari & Mas'ul Imzo", "Настройки склада & Электронная подпись", "Warehouse Settings & Signature"),
      subtitle: formatDual(
        "Mas'ul omborchi (mudiri) rekvizitlari, ombor telefoni va kirim/chiqim jurnallaridagi rasmiy faksimile imzosi",
        "ФИО зав. складом, телефон и факсимиле подписи для приходных и расходных журналов",
        "Warehouse manager details, contact phone, and digital signature for inbound/outbound logs"
      ),
    },
    general: {
      badge: "GREEN PROCESSING • KORXONA VA TIZIM PROFILI",
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: <Building size={24} className="text-slate-400" />,
      title: formatDual("Korxona Rekvizitlari & Tizim Sozlamalari", "Реквизиты компании & Общие настройки", "Company Profile & System Settings"),
      subtitle: formatDual(
        "Rasmiy hujjatlar, dalolatnomalar va hisobotlarda chop etiladigan korxona ma'lumotlari va raqamlash formati",
        "Реквизиты компании для печати в актах, отчетах и юридических документах",
        "Company profile, address, and document numbering configuration"
      ),
    },
    audit: {
      badge: "GREEN PROCESSING • AUDIT & QAT'IY NAZORAT",
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: <FileSpreadsheet size={24} className="text-amber-500" />,
      title: formatDual("Audit Jurnali, Excel Importlari & Smena Nazorati", "Журнал аудита, импортов Excel и контроля смен", "Audit Trail, Excel Imports & Shift Control"),
      subtitle: formatDual(
        "Admin tomonidan qilingan Excel importlar hamda soat 17:00 dan keyin kiritilgan barcha o'zgarishlar va ularning majburiy rasmiy sabablari",
        "Импорты Excel администратора и все изменения после 17:00 с обязательными официальными обоснованиями",
        "Admin Excel imports and after-17:00 modifications with mandatory justifications"
      ),
    },
  }[activeTab] || {
    badge: "GREEN PROCESSING • ERP SOZLAMALAR",
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: <Building size={24} className="text-slate-400" />,
    title: formatDual("Sozlamalar", "Настройки", "Settings"),
    subtitle: formatDual("Tizim sozlamalari", "Настройки системы", "System settings"),
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-enter pb-16">
      {/* Hidden file input for signature image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center shrink-0 mt-0.5">
            {headerInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border ${headerInfo.badgeColor}`}>
                {headerInfo.badge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {headerInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all active:scale-95 shrink-0 self-start sm:self-center"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{formatDual("Saqlash", "Сохранить", "Save")}</span>
        </button>
      </div>

      {/* Department Navigation Tabs - ONLY SHOWN FOR ADMIN / DIRECTOR WITH MULTIPLE TABS */}
      {allowedTabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-dark-800/80 rounded-2xl border border-slate-200 dark:border-dark-700/80 shadow-xs">
          {allowedTabs.includes('supply') && (
            <button
              onClick={() => handleTabChange('supply')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'supply'
                  ? 'bg-slate-900 text-white dark:bg-dark-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750'
              }`}
            >
              <Truck size={15} />
              <span>{formatDual("Ta'minot Bo'limi (Supply)", "Отдел снабжения", "Supply Department")}</span>
            </button>
          )}

          {allowedTabs.includes('qc') && (
            <button
              onClick={() => handleTabChange('qc')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'qc'
                  ? 'bg-slate-900 text-white dark:bg-dark-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750'
              }`}
            >
              <ShieldCheck size={15} />
              <span>{formatDual("Sifat Nazorati (QA/QC)", "Служба качества (QC)", "Quality Control")}</span>
            </button>
          )}

          {allowedTabs.includes('warehouse') && (
            <button
              onClick={() => handleTabChange('warehouse')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'warehouse'
                  ? 'bg-slate-900 text-white dark:bg-dark-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750'
              }`}
            >
              <Package size={15} />
              <span>{formatDual("Omborxona", "Склад", "Warehouse")}</span>
            </button>
          )}

          {allowedTabs.includes('general') && (
            <button
              onClick={() => handleTabChange('general')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-slate-900 text-white dark:bg-dark-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750'
              }`}
            >
              <Building size={15} />
              <span>{formatDual("Korxona Rekvizitlari", "Реквизиты компании", "Company Profile")}</span>
            </button>
          )}

          {allowedTabs.includes('audit') && (
            <button
              onClick={() => handleTabChange('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-600 text-white dark:bg-amber-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-750'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>{formatDual("Import Auditi & Tarixi", "Аудит и история импорта", "Import Audit Log")}</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: TA'MINOT BO'LIMI SOZLAMALARI (SUPPLY)                              */}
      {/* ========================================================================= */}
      {activeTab === 'supply' && (
        <div className="space-y-5 animate-scale-up">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {formatDual("Ta'minot Bo'limi Xodimi Ma'lumotlari", "Данные сотрудника снабжения", "Supply Staff Details")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDual(
                      "Xarid buyurtmalari va ta'minotchi shartnomalarida avtomatik ko'rsatiladigan rekvizitlar",
                      "Реквизиты, автоматически отображаемые в заказах поставщикам",
                      "Details automatically populated in supplier purchase orders"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Mas'ul Ta'minotchi F.I.Sh *", "ФИО ответственного снабженца *", "Supply Manager Full Name *")}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('supply_signature_name', 'Toirov A.')}
                    onChange={(e) => setSetting('supply_signature_name', e.target.value, 'supply')}
                    placeholder="Masalan: Toirov Alisher"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Telefon Raqami (Ta'minot buyurtmalarida chiqadi) *", "Телефон снабжения *", "Phone Number *")}
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('supply_phone', '+998 90 123 45 67')}
                    onChange={(e) => setSetting('supply_phone', e.target.value, 'supply')}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Position Title */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Rasmiy Lavozimi", "Должность", "Official Position")}
                </label>
                <input
                  type="text"
                  value={getSetting('supply_signature_title', "Bosh Ta'minotchi")}
                  onChange={(e) => setSetting('supply_signature_title', e.target.value, 'supply')}
                  placeholder="Bosh Ta'minotchi"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Default Note / Requirement */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Standart Yetkazish Talabi (Izoh)", "Стандартное требование доставки", "Standard Order Delivery Terms")}
                </label>
                <input
                  type="text"
                  value={getSetting('supply_order_notes', "Harorat 2°C – 5°C oraliqda bo'lishi va TTN sertifikati taqdim etilishi shart.")}
                  onChange={(e) => setSetting('supply_order_notes', e.target.value, 'supply')}
                  placeholder="Yuk yetkazilganda harorat nazorat qilinadi"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Signature Upload Card */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block flex items-center justify-between">
                <span>{formatDual("Ta'minotchi Elektron Imzosi (Faksimile)", "Электронная подпись снабженца (Факсимиле)", "Supply Digital Signature Image")}</span>
                <span className="text-[11px] text-slate-400 font-normal">PNG / JPG (shaffof fon tavsiya etiladi)</span>
              </label>

              {getSetting('supply_signature_url') ? (
                <div className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-40 h-20 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-2 flex items-center justify-center relative overflow-hidden shadow-xs">
                      <img
                        src={getSetting('supply_signature_url')}
                        alt="Supply Signature"
                        className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {getSetting('supply_signature_name', 'Toirov A.')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Faol imzo ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getSetting('supply_signature_title', "Bosh Ta'minotchi")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingDept === 'supply'}
                      onClick={() => triggerUpload('supply_signature_url', 'supply')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 text-slate-800 dark:text-slate-200 transition"
                    >
                      {uploadingDept === 'supply' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{formatDual("Almashtirish", "Заменить", "Replace")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetting('supply_signature_url', '', 'supply')}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => triggerUpload('supply_signature_url', 'supply')}
                  className="border-2 border-dashed border-slate-300 dark:border-dark-700 hover:border-slate-400 dark:hover:border-dark-600 bg-slate-50/50 dark:bg-dark-800/40 hover:bg-slate-100/50 dark:hover:bg-dark-800/80 rounded-2xl p-6 text-center cursor-pointer transition group"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-1">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition">
                      <Upload size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {formatDual("Ta'minotchi imzo rasmini yuklash uchun bosing", "Нажмите для загрузки подписи снабженца", "Click to upload supply signature")}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Buyurtma va xarid hujjatlarida avtomatik qo'yiladi
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SIFAT NAZORATI SOZLAMALARI (QC / INSPECTOR)                        */}
      {/* ========================================================================= */}
      {activeTab === 'qc' && (
        <div className="space-y-5 animate-scale-up">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {formatDual("Sifat Nazoratchisi (QA/QC) Ma'lumotlari", "Данные инспектора контроля качества", "QC Inspector Profile Details")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDual(
                      "Kiruvchi xomashyo aktlari, harorat jurnali (F-01) va laboratoriya xulosalarida chiqadigan imzo va rekvizitlar",
                      "Реквизиты и подпись, отображаемые в журналах входного контроля сырья (Ф-01) и актах QC",
                      "Official credentials displayed on raw material intake acts and F-01 temperature journals"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Mas'ul Sifat Nazoratchisi F.I.Sh *", "ФИО специалиста по качеству *", "QC Inspector Full Name *")}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('qc_signature_name', 'Xodjayeva D.')}
                    onChange={(e) => setSetting('qc_signature_name', e.target.value, 'qc')}
                    placeholder="Masalan: Xodjayeva Dilfuza"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Telefon Raqami *", "Телефон отдела качества *", "Phone Number *")}
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('qc_phone', '+998 90 987 65 43')}
                    onChange={(e) => setSetting('qc_phone', e.target.value, 'qc')}
                    placeholder="+998 90 987 65 43"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Official Position */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Lavozimi / Mutaxassisligi", "Должность", "Role / Position")}
                </label>
                <input
                  type="text"
                  value={getSetting('qc_signature_title', "Sifat Nazorati Mutaxassisi (QA/QC)")}
                  onChange={(e) => setSetting('qc_signature_title', e.target.value, 'qc')}
                  placeholder="Sifat Nazorati Mutaxassisi (QA/QC)"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Standard Cold-Chain Norm */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Standart Sovuq Zanjir Harorat Normasi", "Стандартная норма температуры", "Standard Cold-Chain Norm")}
                </label>
                <input
                  type="text"
                  value={getSetting('qc_standard_temp_range', "2°C – 5°C")}
                  onChange={(e) => setSetting('qc_standard_temp_range', e.target.value, 'qc')}
                  placeholder="2°C – 5°C"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>
            </div>

            {/* QC Signature Upload Card */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block flex items-center justify-between">
                <span>{formatDual("Sifat Nazoratchisi Elektron Imzosi (Faksimile)", "Электронная подпись инспектора QC", "QC Inspector Signature Image")}</span>
                <span className="text-[11px] text-slate-400 font-normal">Kirim aktlari va F-01 jurnalida tasdiqlanadi</span>
              </label>

              {getSetting('qc_signature_url') ? (
                <div className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-40 h-20 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-2 flex items-center justify-center relative overflow-hidden shadow-xs">
                      <img
                        src={getSetting('qc_signature_url')}
                        alt="QC Signature"
                        className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {getSetting('qc_signature_name', 'Xodjayeva D.')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Tasdiqlangan imzo ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getSetting('qc_signature_title', "Sifat Nazorati Mutaxassisi")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingDept === 'qc'}
                      onClick={() => triggerUpload('qc_signature_url', 'qc')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 text-slate-800 dark:text-slate-200 transition"
                    >
                      {uploadingDept === 'qc' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{formatDual("Almashtirish", "Заменить", "Replace")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetting('qc_signature_url', '', 'qc')}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => triggerUpload('qc_signature_url', 'qc')}
                  className="border-2 border-dashed border-slate-300 dark:border-dark-700 hover:border-slate-400 dark:hover:border-dark-600 bg-slate-50/50 dark:bg-dark-800/40 hover:bg-slate-100/50 dark:hover:bg-dark-800/80 rounded-2xl p-6 text-center cursor-pointer transition group"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition">
                      <Upload size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {formatDual("Sifat nazoratchisi imzo rasmini yuklash uchun bosing", "Нажмите для загрузки подписи инспектора качества", "Click to upload QC signature image")}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Harorat jurnallari va kiruvchi sifat aktlarida avtomatik qo'yiladi
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OMBORCHI SOZLAMALARI (WAREHOUSE)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'warehouse' && (
        <div className="space-y-5 animate-scale-up">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {formatDual("Mas'ul Omborchi (Ombor mudiri) Ma'lumotlari", "Данные заведующего складом", "Warehouse Manager Details")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDual(
                      "Kirim, Chiqim va sexga berilgan xomashyo dalolatnomalaridagi ombor imzosi",
                      "Подпись и реквизиты зав. складом для приходных и расходных накладных",
                      "Warehouse signatures for inbound and production dispatch reports"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Mas'ul Omborchi F.I.Sh *", "ФИО зав. складом *", "Warehouse Manager Full Name *")}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('warehouse_signature_name', 'Isakov M.')}
                    onChange={(e) => setSetting('warehouse_signature_name', e.target.value, 'warehouse')}
                    placeholder="Isakov M."
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Ombor Telefoni *", "Телефон склада *", "Warehouse Phone *")}
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={getSetting('warehouse_phone', '+998 90 555 44 33')}
                    onChange={(e) => setSetting('warehouse_phone', e.target.value, 'warehouse')}
                    placeholder="+998 90 555 44 33"
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Lavozimi / Vazifasi", "Должность", "Position")}
                </label>
                <input
                  type="text"
                  value={getSetting('warehouse_signature_title', "Ombor mudiri / Mas'ul xodim")}
                  onChange={(e) => setSetting('warehouse_signature_title', e.target.value, 'warehouse')}
                  placeholder="Ombor mudiri / Mas'ul xodim"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Warehouse Signature Upload */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block flex items-center justify-between">
                <span>{formatDual("Omborchi Elektron Imzosi (Faksimile)", "Электронная подпись кладовщика", "Warehouse Signature Image")}</span>
                <span className="text-[11px] text-slate-400 font-normal">Kirim va Chiqim jurnallarida avtomatik qo'yiladi</span>
              </label>

              {getSetting('warehouse_signature_url') ? (
                <div className="bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-40 h-20 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-2 flex items-center justify-center relative overflow-hidden shadow-xs">
                      <img
                        src={getSetting('warehouse_signature_url')}
                        alt="Warehouse Signature"
                        className="max-h-full max-w-full object-contain filter invert dark:invert-0 drop-shadow"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {getSetting('warehouse_signature_name', 'Isakov M.')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Tasdiqlangan imzo ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getSetting('warehouse_signature_title', "Ombor mudiri")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingDept === 'warehouse'}
                      onClick={() => triggerUpload('warehouse_signature_url', 'warehouse')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600 text-slate-800 dark:text-slate-200 transition"
                    >
                      {uploadingDept === 'warehouse' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{formatDual("Almashtirish", "Заменить", "Replace")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetting('warehouse_signature_url', '', 'warehouse')}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => triggerUpload('warehouse_signature_url', 'warehouse')}
                  className="border-2 border-dashed border-slate-300 dark:border-dark-700 hover:border-slate-400 dark:hover:border-dark-600 bg-slate-50/50 dark:bg-dark-800/40 hover:bg-slate-100/50 dark:hover:bg-dark-800/80 rounded-2xl p-6 text-center cursor-pointer transition group"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-1">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition">
                      <Upload size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {formatDual("Omborchi imzo rasmini yuklash uchun bosing", "Нажмите для загрузки подписи зав. складом", "Click to upload warehouse signature")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KORXONA REKVIZITLARI VA UMUMIY SOZLAMALAR                          */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-5 animate-scale-up">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-dark-750 pb-3">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                <Building size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {formatDual("Korxona Rekvizitlari", "Реквизиты компании", "Company Profile")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDual("Hujjatlar, aktlar va hisobotlarda chop etiladigan korxona ma'lumotlari", "Информация для печати на официальных бланках", "Credentials printed on official documents and acts")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Korxona nomi", "Название компании", "Company Name")}
                </label>
                <input
                  type="text"
                  value={getSetting('company_name', 'Green Processing LLC')}
                  onChange={(e) => setSetting('company_name', e.target.value)}
                  placeholder="Green Processing LLC"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Korxona Telefoni", "Телефон компании", "Company Phone")}
                </label>
                <input
                  type="text"
                  value={getSetting('company_phone', '+998 71 200 00 00')}
                  onChange={(e) => setSetting('company_phone', e.target.value)}
                  placeholder="+998 XX XXX XX XX"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Yuridik Manzil", "Адрес", "Address")}
                </label>
                <input
                  type="text"
                  value={getSetting('company_address', "Toshkent viloyati, Yuqori Chirchiq tumani")}
                  onChange={(e) => setSetting('company_address', e.target.value)}
                  placeholder="Korxona manzili"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Akt Prefiksi", "Префикс актов", "Act Prefix")}
                </label>
                <input
                  type="text"
                  value={getSetting('act_number_prefix', 'КС')}
                  onChange={(e) => setSetting('act_number_prefix', e.target.value, 'numbering')}
                  placeholder="КС"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {formatDual("Akt Raqamlash Formati", "Формат нумерации", "Numbering Format")}
                </label>
                <input
                  type="text"
                  value={getSetting('act_number_format', 'PREFIX-YEAR-NUMBER')}
                  onChange={(e) => setSetting('act_number_format', e.target.value, 'numbering')}
                  placeholder="PREFIX-YEAR-NUMBER"
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT JURNALI, EXCEL IMPORTLARI & SMENA NAZORATI TARIXI             */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-scale-up">
          {/* Header Card */}
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-750 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatDual(
                        "Audit Jurnali, Excel Importlari va Smena Nazorati",
                        "Журнал аудита, импортов Excel и контроля смен",
                        "Audit Trail, Excel Imports & Shift Control"
                      )}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      FSSC 22000
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDual(
                      "Admin tomonidan qilingan barcha Excel importlar hamda soat 17:00 dan keyin kiritilgan barcha o'zgarishlar va ularning majburiy rasmiy sabablari",
                      "Все импорты Excel администратора и все изменения после 17:00 с обязательными официальными обоснованиями"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-dark-700 transition"
                >
                  <History size={14} />
                  <span>{formatDual("Yangilash", "Обновить")}</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700/80">
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  {formatDual("Jami Audit Yozuvlari", "Всего записей аудита")}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {allAuditEntries.length}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{formatDual("ta operatsiya", "операций")}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <p className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>{formatDual("17:00 dan Keyin Tahrirlar", "Правки после 17:00")}</span>
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {shiftEditHistory.length}
                  </span>
                  <span className="text-xs text-rose-500 font-semibold">{formatDual("ta izohli tahrir", "правок")}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                <p className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                  <FileSpreadsheet size={12} />
                  <span>{formatDual("Admin Excel Importlari", "Импорты Excel Admin")}</span>
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {importHistory.length}
                  </span>
                  <span className="text-xs text-indigo-500 font-semibold">{formatDual("ta fayl", "файлов")}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200/80 dark:border-dark-700/80">
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  {formatDual("Xavfsizlik Standarti", "Стандарт безопасности")}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <ShieldCheck size={16} />
                  <span>Majburiy Rasmiy Izoh Sharti</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-3xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={formatDual(
                  "Sabab, mas'ul xodim, sana yoki bo'lim bo'yicha qidirish...",
                  "Поиск по причине, сотруднику, дате или разделу..."
                )}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: `Barchasi (${allAuditEntries.length})` },
                { id: 'AFTER_17', label: `⚠️ 17:00 dan keyin (${shiftEditHistory.length})` },
                { id: 'IMPORT', label: `Excel Importlari (${importHistory.length})` },
                { id: 'Kirim', label: 'Kirimlar' },
                { id: 'Chiqim', label: 'Chiqimlar' },
                { id: 'GP', label: 'GP' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAuditFilterTarget(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    auditFilterTarget === f.id
                      ? 'bg-slate-900 text-white dark:bg-dark-700'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Log Entries List */}
          {filteredAuditHistory.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-400">
                <FileSpreadsheet size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {formatDual("Audit Yozuvlari Topilmadi", "Записи аудита не найдены")}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {auditSearch
                  ? formatDual("Qidiruv bo'yicha hech narsa chiqmadi.", "По вашему запросу ничего не найдено.")
                  : formatDual(
                      "Hozircha audit yozuvlari mavjud emas. Admin importlari va soat 17:00 dan keyin omborchilar kiritgan har bir o'zgarish shu yerda o'chmas qilib muhrlanadi.",
                      "Пока записи аудита отсутствуют. Все импорты и изменения после 17:00 будут отображаться здесь."
                    )}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAuditHistory.map((item: any, idx: number) => {
                const dateStr = item.timestamp
                  ? new Date(item.timestamp).toLocaleString('uz-UZ', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : "Noma'lum sana"

                // Render Shift Edit Card (After 17:00 edit)
                if (item.type === 'SHIFT_EDIT') {
                  return (
                    <div
                      key={item.id || idx}
                      className="p-5 bg-white dark:bg-dark-900 border border-rose-200/90 dark:border-rose-900/40 rounded-3xl shadow-xs hover:border-rose-500/50 transition space-y-3"
                    >
                      {/* Top Row: Meta info */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-rose-100 dark:border-dark-800 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Clock size={13} className="text-slate-400" />
                            <span>{dateStr}</span>
                          </span>

                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                            {item.targetTitle || item.target}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>17:00 DAN KEYIN TAHRIRLANGAN</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                          {item.date && (
                            <div className="flex items-center gap-1 font-mono font-semibold">
                              <Calendar size={13} className="text-slate-400" />
                              <span>Sana: {item.date}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 font-medium">
                            <User size={13} className="text-slate-400" />
                            <span>{item.userName} ({item.userRole})</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Reason Quote Block */}
                      <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border-l-4 border-rose-500 dark:border-rose-400 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>Omborchi Kiritgan Rasmiy Sabab (Asos):</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Mas'ul: <strong className="text-slate-700 dark:text-slate-200">{item.userName}</strong>
                          </span>
                        </div>
                        <blockquote className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
                          &ldquo;{item.reason}&rdquo;
                        </blockquote>
                        {item.details && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-rose-500/10 font-mono">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                }

                // Render Excel Import Card (Admin only)
                return (
                  <div
                    key={item.id || idx}
                    className="p-5 bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-750 rounded-3xl shadow-xs hover:border-amber-500/40 transition space-y-3"
                  >
                    {/* Top Row: Meta info */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 dark:border-dark-800 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{dateStr}</span>
                        </span>

                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50">
                          {item.target || "Bo'lim ko'rsatilmagan"}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>ADMIN TASDIG'I</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 font-mono font-semibold">
                          <FileText size={13} className="text-slate-400" />
                          <span>{item.fileName || 'file.xlsx'}</span>
                          {item.fileSize && (
                            <span className="text-[10px] text-slate-400">({item.fileSize})</span>
                          )}
                        </div>

                        {item.recordsCount !== undefined && item.recordsCount !== null && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            +{item.recordsCount} ta yozuv
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Reason Quote Block */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-amber-500 dark:border-amber-400 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <MessageSquare size={12} />
                          <span>Administrator Kiritgan Rasmiy Sabab (Asos):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Admin: <strong className="text-slate-700 dark:text-slate-200">{item.adminName || 'Admin'}</strong>
                        </span>
                      </div>
                      <blockquote className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 italic leading-relaxed">
                        &ldquo;{item.reason}&rdquo;
                      </blockquote>
                      {item.details && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-500/10 font-mono">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Save Button at bottom */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all active:scale-95"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{formatDual("Sozlamalarni Saqlash", "Сохранить настройки", "Save Settings")}</span>
        </button>
      </div>
    </div>
  )
}

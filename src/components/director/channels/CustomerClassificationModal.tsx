'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Building2, FileText, Calendar, ShieldCheck, DollarSign, Clock, RefreshCw } from 'lucide-react'

export interface CustomerOption {
  id: number
  name: string
  contactPerson?: string | null
  phone?: string | null
  distributionType: 'DIRECT' | 'INDIRECT'
  channelCategory: string
  businessRole?: string | null
  contractNumber?: string | null
  contractDate?: string | null
  creditTermDays: number
  creditLimit: number
}

interface CustomerClassificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialCustomerId?: number | null
  customers: CustomerOption[]
  lang?: 'uz' | 'ru'
}

export const CHANNEL_SUB_OPTIONS = [
  {
    key: 'RESTAURANTS_FOOD_SERVICE',
    nameUz: 'Restoranlar va umumiy ovqatlanish (HoReCa)',
    nameRu: 'Рестораны и общепит (HoReCa)',
    defaultType: 'DIRECT' as const,
    descUz: 'O\'z faoliyati uchun mahsulot sotib oluvchi to\'g\'ridan-to\'g\'ri B2B mijozlar (HoReCa, QSR)',
    descRu: 'Прямые B2B клиенты, закупающие сырье для собственного производства блюд'
  },
  {
    key: 'CORPORATE_END_CUSTOMERS',
    nameUz: 'Korporativ yakuniy mijozlar',
    nameRu: 'Корпоративные конечные клиенты',
    defaultType: 'DIRECT' as const,
    descUz: 'O\'z xodimlari va ichki ehtiyojlari uchun sotib oluvchi yirik korxonalar va tashkilotlar',
    descRu: 'Конечные B2B корпоративные потребители (отели, заводы, столовые предприятий)'
  },
  {
    key: 'SUPERMARKETS',
    nameUz: 'Supermarketlar tarmoqlari (Retail Chains)',
    nameRu: 'Сети супермаркетов (Retail Chains)',
    defaultType: 'INDIRECT' as const,
    descUz: 'Aholiga qayta sotish uchun xarid qiluvchi yirik chakana savdo tarmoqlari (Korzinka, Havas, Makro)',
    descRu: 'Крупные ритейл сети для перепродажи населению через прилавки'
  },
  {
    key: 'RETAIL_STORES',
    nameUz: 'Chakana savdo do\'konlari',
    nameRu: 'Розничные магазины (Trade Stores)',
    defaultType: 'INDIRECT' as const,
    descUz: 'Mahalliy minimarketlar va mustaqil oziq-ovqat do\'konlari (Qayta sotish)',
    descRu: 'Локальные продуктовые магазины и минимаркеты у дома (Перепродажа)'
  },
  {
    key: 'DISTRIBUTORS',
    nameUz: 'Mintaqaviy distribyutorlar',
    nameRu: 'Региональные дистрибьюторы',
    defaultType: 'INDIRECT' as const,
    descUz: 'Viloyatlar bo\'yicha rasmiy hududiy distribyutorlik hamkorlari',
    descRu: 'Официальные территориальные дистрибьюторы в регионах'
  },
  {
    key: 'WHOLESALERS',
    nameUz: 'Ulgurji savdogarlar (Optom)',
    nameRu: 'Оптовые закупщики (Wholesalers)',
    defaultType: 'INDIRECT' as const,
    descUz: 'Bozorlar va ikkilamchi savdogarlarga katta partiyalarda qayta sotuvchilar',
    descRu: 'Крупнооптовые покупатели для перепродажи на рынках и мелким оптовикам'
  },
  {
    key: 'EXPORT_PARTNERS',
    nameUz: 'Eksport hamkorlar',
    nameRu: 'Экспортные партнеры',
    defaultType: 'INDIRECT' as const,
    descUz: 'MDH va chet el bozorlariga qayta sotish va qayta ishlash uchun xalqaro hamkorlar',
    descRu: 'Зарубежные трейдеры и дистрибьюторы на экспортных рынках'
  },
  {
    key: 'OTHER',
    nameUz: 'Boshqa kanallar',
    nameRu: 'Прочие каналы сбыта',
    defaultType: 'INDIRECT' as const,
    descUz: 'Agrofirmalar, kooperativlar va aralash hamkorlar',
    descRu: 'Кооперативы, агрофирмы и нестандартные партнеры'
  },
  {
    key: 'UNCLASSIFIED',
    nameUz: 'Tasniflanmagan (Aniqlanmoqda)',
    nameRu: 'Не классифицировано (Требует уточнения)',
    defaultType: 'DIRECT' as const,
    descUz: 'Taqsimot kanali hali rasmiylashtirilmagan yangi kontragentlar',
    descRu: 'Новые контрагенты без закрепленного канала сбыта'
  }
]

export const CustomerClassificationModal: React.FC<CustomerClassificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomerId,
  customers,
  lang = 'uz'
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(initialCustomerId || null)
  const [distributionType, setDistributionType] = useState<'DIRECT' | 'INDIRECT'>('DIRECT')
  const [channelCategory, setChannelCategory] = useState<string>('RESTAURANTS_FOOD_SERVICE')
  const [businessRole, setBusinessRole] = useState<string>('')
  const [contractNumber, setContractNumber] = useState<string>('')
  const [contractDate, setContractDate] = useState<string>('')
  const [creditTermDays, setCreditTermDays] = useState<number>(15)
  const [creditLimit, setCreditLimit] = useState<string>('0')

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync state when initial customer changes or modal opens
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId)
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id)
    }
  }, [initialCustomerId, customers])

  // Populate fields when customer changes
  useEffect(() => {
    if (!selectedCustomerId) return
    const cust = customers.find(c => c.id === selectedCustomerId)
    if (cust) {
      setDistributionType(cust.distributionType || 'DIRECT')
      setChannelCategory(cust.channelCategory || 'UNCLASSIFIED')
      setBusinessRole(cust.businessRole || '')
      setContractNumber(cust.contractNumber || '')
      setContractDate(cust.contractDate ? cust.contractDate.slice(0, 10) : '')
      setCreditTermDays(cust.creditTermDays ?? 15)
      setCreditLimit(cust.creditLimit ? String(cust.creditLimit) : '0')
      setError(null)
      setSuccessMsg(null)
    }
  }, [selectedCustomerId, customers])

  // Auto-switch distributionType when category changes if user hasn't explicitly customized
  const handleCategoryChange = (newCat: string) => {
    setChannelCategory(newCat)
    const match = CHANNEL_SUB_OPTIONS.find(c => c.key === newCat)
    if (match) {
      setDistributionType(match.defaultType)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      setError(lang === 'uz' ? 'Iltimos, mijozni tanlang' : 'Пожалуйста, выберите клиента')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/director/distribution-channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          distributionType,
          channelCategory,
          businessRole: businessRole.trim(),
          contractNumber: contractNumber.trim(),
          contractDate: contractDate || null,
          creditTermDays: Number(creditTermDays) || 0,
          creditLimit: parseFloat(creditLimit) || 0
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'uz' ? 'Saqlashda xatolik yuz berdi' : 'Ошибка при сохранении'))
      }

      setSuccessMsg(
        lang === 'uz'
          ? 'Mijoz taqsimot kanali va shartnoma qoidalari muvaffaqiyatli yangilandi!'
          : 'Канал сбыта и условия контракта клиента успешно обновлены!'
      )
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Server xatosi')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedCust = customers.find(c => c.id === selectedCustomerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {lang === 'uz' ? 'Mijoz Taqsimot Kanalini Boshqarish (ERP)' : 'Управление каналом сбыта клиента (ERP)'}
              </h2>
              <p className="text-xs text-emerald-100">
                {lang === 'uz'
                  ? 'B2B biznes roli, shartnoma rekvizitlari va kredit qoidalari'
                  : 'Бизнес-роль B2B, контрактные реквизиты и кредитные лимиты'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Mijoz (Kontragent):' : 'Клиент (Контрагент):'}
            </label>
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.contactPerson ? `(${c.contactPerson})` : ''} — [{c.distributionType === 'DIRECT' ? 'To\'g\'ridan-to\'g\'ri' : 'Vositachi'}]
                </option>
              ))}
            </select>
          </div>

          {/* Classification Rule Guide */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {lang === 'uz' ? 'ERP Tasniflash Qoidasi:' : 'Правило классификации ERP:'}
            </p>
            <p>
              {lang === 'uz'
                ? '• Direct (To\'g\'ridan-to\'g\'ri): O\'z oshxonasi yoki faoliyati uchun xarid qiluvchi B2B iste\'molchilar.'
                : '• Direct (Прямой сбыт): B2B клиенты, покупающие продукцию для собственного потребления (HoReCa, корпорации).'}
            </p>
            <p>
              {lang === 'uz'
                ? '• Indirect (Vositachi / Bilvosita): Aholiga yoki ikkilamchi savdogarlarga qayta sotuvchilar (Retail, distribyutor, optom).'
                : '• Indirect (Косвенный сбыт): Партнеры для последующей перепродажи (сети, дистрибьюторы, оптовики).'}
            </p>
          </div>

          {/* Distribution Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Asosiy Taqsimot Turi:' : 'Основной тип распределения:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  distributionType === 'DIRECT'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="distributionType"
                  value="DIRECT"
                  checked={distributionType === 'DIRECT'}
                  onChange={() => setDistributionType('DIRECT')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm">Direct (To'g'ridan-to'g'ri)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    {lang === 'uz' ? 'O\'z ehtiyoji uchun xarid' : 'Для собственных нужд'}
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  distributionType === 'INDIRECT'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-semibold ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="distributionType"
                  value="INDIRECT"
                  checked={distributionType === 'INDIRECT'}
                  onChange={() => setDistributionType('INDIRECT')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm">Indirect (Bilvosita / Vositachi)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    {lang === 'uz' ? 'Qayta sotish maqsadida' : 'Для перепродажи'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Kanal Kichik Toifasi (Subkategoriya):' : 'Подкатегория канала:'}
            </label>
            <select
              value={channelCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CHANNEL_SUB_OPTIONS.map((sub) => (
                <option key={sub.key} value={sub.key}>
                  {lang === 'uz' ? sub.nameUz : sub.nameRu} [{sub.defaultType}]
                </option>
              ))}
            </select>
          </div>

          {/* Business Role Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Mijozning Biznes Roli va Faoliyat Tavsifi:' : 'Бизнес-роль клиента и описание деятельности:'}
            </label>
            <textarea
              rows={2}
              value={businessRole}
              onChange={(e) => setBusinessRole(e.target.value)}
              placeholder={
                lang === 'uz'
                  ? 'Masalan: Fast-food tarmog\'i oshxonasi uchun yarim fabrikatlar xaridi (qayta sotilmaydi)'
                  : 'Например: Закупка полуфабрикатов для кухни сети ресторанов (собственное потребление)'
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Contract Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'uz' ? 'Shartnoma Raqami:' : 'Номер договора:'}
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="D-2026/089"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {lang === 'uz' ? 'Shartnoma Sanasi:' : 'Дата договора:'}
              </label>
              <input
                type="date"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Credit Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'uz' ? 'Kredit Muddati (kun):' : 'Срок отсрочки (дней):'}
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={creditTermDays}
                onChange={(e) => setCreditTermDays(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500">
                {lang === 'uz' ? 'Invoys chiqarilgandan keyin to\'lov muddati' : 'Дней для оплаты после выставления счета'}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                {lang === 'uz' ? 'Kredit Limiti (so\'m):' : 'Кредитный лимит (сум):'}
              </label>
              <input
                type="number"
                min="0"
                step="1000000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500">
                {lang === 'uz' ? 'Maksimal ruxsat etilgan qarz miqdori' : 'Максимальный кредитный лимит'}
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'uz' ? 'Saqlanmoqda...' : 'Сохранение...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Saqlash va Tasdiqlash' : 'Сохранить изменения'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

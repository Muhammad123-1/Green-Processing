'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  RefreshCw,
  Sliders,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import ExecutiveKpiGrid from './ExecutiveKpiGrid'
import ProductBalanceTable, { ProductBalanceItem } from './ProductBalanceTable'
import ProductLossDrawer from './ProductLossDrawer'
import WastageAuditJournal from './WastageAuditJournal'
import LossStandardsModal from './LossStandardsModal'

interface Props {
  lang: string
}

export default function ExecutiveDashboardContainer({ lang }: Props) {
  // Period states
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Data states
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Sub-views
  const [activeTab, setActiveTab] = useState<'balance' | 'journal'>('balance')
  const [selectedProduct, setSelectedProduct] = useState<ProductBalanceItem | null>(null)
  const [showStandardsModal, setShowStandardsModal] = useState(false)
  const [journalProductFilter, setJournalProductFilter] = useState('')

  // Compute dates based on quick periods
  const handleSelectPeriod = (p: typeof period) => {
    setPeriod(p)
    const now = new Date()
    const toYMD = (d: Date) => d.toISOString().slice(0, 10)

    if (p === 'today') {
      const today = toYMD(now)
      setDateFrom(today)
      setDateTo(today)
    } else if (p === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      setDateFrom(toYMD(weekAgo))
      setDateTo(toYMD(now))
    } else if (p === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setDateFrom(toYMD(firstDay))
      setDateTo(toYMD(now))
    } else if (p === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1)
      setDateFrom(toYMD(firstDay))
      setDateTo(toYMD(now))
    } else if (p === 'all') {
      setDateFrom('')
      setDateTo('')
    }
  }

  // Fetch real data from Backend
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const res = await fetch(`/api/director/executive?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json)
      } else {
        throw new Error(json.error || "Ma'lumotlarni yuklab bo'lmadi")
      }
    } catch (err: any) {
      setError(err?.message || 'Server xatoligi')
      toast.error(err?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const kpis = data?.kpis || null
  const productBalances: ProductBalanceItem[] = data?.productBalances || []

  const handleOpenJournalForProduct = (prodName: string) => {
    setJournalProductFilter(prodName)
    setActiveTab('journal')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Toolbar with Real Date Filters */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ru' ? 'Исполнительный аудит и контроль сырья' : 'Ijrochi Nazorat va Yo‘qotishlar Auditi'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                100% Real DB
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {lang === 'ru'
                ? '3-уровневый аудит: Сводка KPI → Анализ потерь по сырью → Журнал актов'
                : "3 qavatli audit: KPI xulosa → Mahsulot yo'qotishlari → Birlamchi brak aktlari"}
            </p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Quick Period Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs font-bold">
            <button
              onClick={() => handleSelectPeriod('all')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'all'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Все время' : 'Barchasi'}
            </button>
            <button
              onClick={() => handleSelectPeriod('month')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'month'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Этот месяц' : 'Shu oy'}
            </button>
            <button
              onClick={() => handleSelectPeriod('week')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'week'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Неделя' : 'Hafta'}
            </button>
            <button
              onClick={() => handleSelectPeriod('today')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'today'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Сегодня' : 'Bugun'}
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'custom'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Период' : 'Sana oralig‘i'}
            </button>
          </div>

          {/* Custom Date Inputs */}
          {period === 'custom' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none"
              />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-dark-700 transition-colors shadow-sm"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-500' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Error Banner if any */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <b>Xatolik: {error}</b>
          </div>
          <button onClick={() => fetchData()} className="underline font-bold">
            Qayta urinish
          </button>
        </div>
      )}

      {/* 3. Layer 1: Executive KPI Grid (5 Cards) */}
      <ExecutiveKpiGrid kpis={kpis} loading={loading} lang={lang} />

      {/* 4. Tab Navigation between Balances (Layer 1-2) and Audit Journal (Layer 3) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-800 p-1 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'balance'
                ? 'bg-white dark:bg-dark-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{lang === 'ru' ? '1. Баланс сырья и отклонения' : '1. Xomashyo Balansi va Og‘ishlar'}</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'journal'
                ? 'bg-white dark:bg-dark-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>{lang === 'ru' ? '2. Журнал брака и рекламаций (Акты)' : '2. Brak va Rektamatsiyalar Jurnali (Aktlar)'}</span>
          </button>
        </div>

        <button
          onClick={() => setShowStandardsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
        >
          <Sliders size={13} />
          <span>{lang === 'ru' ? 'Настройка норм потерь' : "Yo'qotish me'yorlarini sozlash"}</span>
        </button>
      </div>

      {/* 5. Main Tab Contents */}
      {activeTab === 'balance' ? (
        <ProductBalanceTable
          products={productBalances}
          loading={loading}
          lang={lang}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenStandards={() => setShowStandardsModal(true)}
        />
      ) : (
        <WastageAuditJournal
          initialProductFilter={journalProductFilter}
          lang={lang}
        />
      )}

      {/* Layer 2: Product Loss Drawer */}
      <ProductLossDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onViewJournal={handleOpenJournalForProduct}
        lang={lang}
      />

      {/* Loss Standards Modal */}
      <LossStandardsModal
        isOpen={showStandardsModal}
        onClose={() => setShowStandardsModal(false)}
        onSaved={fetchData}
        lang={lang}
      />
    </div>
  )
}

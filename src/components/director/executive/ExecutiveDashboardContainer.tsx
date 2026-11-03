'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Sliders,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  FileText,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import ExecutiveKpiGrid from './ExecutiveKpiGrid'
import ProductBalanceTable, { ProductBalanceItem } from './ProductBalanceTable'
import ProductLossDrawer from './ProductLossDrawer'
import WastageAuditJournal from './WastageAuditJournal'
import DefectMaterialsAnalysis from './DefectMaterialsAnalysis'
import LossStandardsModal from './LossStandardsModal'
import IncomingMaterialsAnalysis from './IncomingMaterialsAnalysis'
import OperationsExecutivePanel from './OperationsExecutivePanel'
import SupplierAndFifoAuditPanel from './SupplierAndFifoAuditPanel'

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
  const [activeTab, setActiveTab] = useState<'balance' | 'journal' | 'incoming' | 'operations'>('balance')
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
  const supplierDefectAnalysis = data?.supplierDefectAnalysis || []
  const fifoExceptions = data?.fifoExceptions || []
  const activeFifoQueue = data?.activeFifoQueue || []

  const [journalStageFilter, setJournalStageFilter] = useState('')
  const [journalWastageType, setJournalWastageType] = useState('')

  const handleOpenJournalForProduct = (prodName: string, stage = '', wastageType = '') => {
    setJournalProductFilter(prodName)
    setJournalStageFilter(stage)
    setJournalWastageType(wastageType)
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ru' ? 'Контроль отделов завода (Рабочий стол Директора)' : "Zavod Bo'limlari Nazorati (Direktor Ish Stoli)"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {lang === 'ru' ? 'Реальная база завода' : 'Haqiqiy Zavod Ma’lumotlari'}
              </span>
              {data?.period?.operationalDays !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                  {lang === 'ru' ? 'Раб. дней:' : 'Ish kunlari:'} {data.period.operationalDays}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {lang === 'ru'
                ? 'Склад, производство, контроль качества и снабжение: понятные показатели и объяснение каждой причины'
                : "Omborxona, ishlab chiqarish sexi, sifat nazorati va ta'minot bo'limlarining aniq ko'rsatkichlari va sabablari"}
            </p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
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
              onClick={() => handleSelectPeriod('year')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                period === 'year'
                  ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Год' : 'Yil'}
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

      {/* 4. Tab Navigation between Balances, Journal, Supplier & FIFO Audit, Incoming, Operations */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-dark-750 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-2xl border border-slate-200 dark:border-dark-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'balance'
                ? 'bg-white dark:bg-dark-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{lang === 'ru' ? '1. Склад сырья (Остатки и запас)' : '1. Omborxona (Xomashyo va zaxira yetishi)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'journal'
                ? 'bg-white dark:bg-dark-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>{lang === 'ru' ? '2. Контроль качества (Причины брака)' : '2. Sifat Nazorati (Brak sabablari)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'incoming'
                ? 'bg-white dark:bg-dark-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>{lang === 'ru' ? '3. Партии приёма сырья' : '3. Kiruvchi xomashyo partiyalari'}</span>
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'operations'
                ? 'bg-white dark:bg-dark-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{lang === 'ru' ? '4. Работа сотрудников' : '4. Xodimlar faoliyati (Kim nima qildi)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/traceability"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <ShieldCheck size={13} />
            <span>{lang === 'ru' ? 'Паспорт прослеживаемости' : "To'liq mahsulot zanjiri (Pasport)"}</span>
          </Link>
          <button
            onClick={() => setShowStandardsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <Sliders size={13} />
            <span>{lang === 'ru' ? 'Настройка норм потерь' : "Yo'qotish me'yorlarini sozlash"}</span>
          </button>
        </div>
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
      ) : activeTab === 'journal' ? (
        <DefectMaterialsAnalysis
          dateFrom={dateFrom}
          dateTo={dateTo}
          lang={lang}
        />
      ) : activeTab === 'incoming' ? (
        <IncomingMaterialsAnalysis dateFrom={dateFrom} dateTo={dateTo} lang={lang} />
      ) : (
        <OperationsExecutivePanel dateFrom={dateFrom} dateTo={dateTo} lang={lang} />
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

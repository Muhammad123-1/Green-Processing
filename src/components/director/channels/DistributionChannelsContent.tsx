'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Share2,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Layers,
  BarChart3,
  Users,
  FileCheck2,
  Settings2,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react'
import ExecutiveKpiCards from './ExecutiveKpiCards'
import AlertsBanner from './AlertsBanner'
import DirectIndirectComparisonCard from './DirectIndirectComparisonCard'
import DistributionChartsSection from './DistributionChartsSection'
import ChannelsTable from './ChannelsTable'
import CustomerProductDrilldown from './CustomerProductDrilldown'
import TransactionalAuditLedger from './TransactionalAuditLedger'
import { CustomerClassificationModal } from './CustomerClassificationModal'

export const DistributionChannelsContent: React.FC = () => {
  const [period, setPeriod] = useState<string>('ALL')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'channels_table' | 'charts' | 'drilldown_l2' | 'audit_l3'>('overview')
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // Classification Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalCustomerId, setModalCustomerId] = useState<number | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('period', period)
      if (period === 'CUSTOM') {
        if (customFrom) params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }
      if (selectedChannelKey) {
        params.set('channel', selectedChannelKey)
      }

      const res = await fetch(`/api/director/distribution-channels?${params.toString()}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Ma\'lumotlarni yuklashda xatolik yuz berdi')
      }

      setData(json)
    } catch (err: any) {
      console.error('Failed to load distribution channel analytics:', err)
      setError(err?.message || 'Server bilan bog\'lanishda xatolik')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, customFrom, customTo, selectedChannelKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenClassification = (customerId?: number) => {
    setModalCustomerId(customerId || null)
    setModalOpen(true)
  }

  const handleSelectChannel = (channelKey: string) => {
    setSelectedChannelKey(channelKey)
    setActiveTab('drilldown_l2')
  }

  const handleClearChannelFilter = () => {
    setSelectedChannelKey(null)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.channels) return

    const headers = [
      'Kanal',
      'Turi',
      'Brutto Tushum',
      'Chegirmalar',
      'Qaytarishlar',
      'Sof Tushum (Net Revenue)',
      'Tushum Ulushi %',
      'Tannarx (COGS)',
      'Yalpi Foyda (Gross Profit)',
      'Yalpi Marja %',
      'Logistika Xarajati',
      'Logistikadan Keyingi Hissa (Contribution)',
      'Hissa Marjasi %',
      'Faol Mijozlar',
      'Buyurtmalar',
      'Muddati O\'tgan Qarz'
    ]

    const rows = data.channels.map((ch: any) => [
      `"${ch.channelNameUz}"`,
      ch.distributionType,
      ch.grossRevenue,
      ch.discounts,
      ch.returns,
      ch.netRevenue,
      ch.revenueSharePct.toFixed(2),
      ch.cogs,
      ch.grossProfit,
      ch.grossMarginPct.toFixed(2),
      ch.logisticsCost,
      ch.contributionAfterLogistics,
      ch.contributionMarginPct.toFixed(2),
      ch.activeCustomersCount,
      ch.ordersCount,
      ch.overdueReceivables
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Taqsimot_Kanallari_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  // Prepared customer options for modal
  const customerOptions = (data?.customers || []).map((c: any) => ({
    id: c.customerId,
    name: c.customerName,
    distributionType: c.distributionType,
    channelCategory: c.channelCategory,
    businessRole: c.businessRole,
    contractNumber: c.contractNumber,
    contractDate: c.contractDate,
    creditTermDays: c.creditTermDays,
    creditLimit: c.creditLimit
  }))

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Taqsimot Kanallari Tahlili
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ERP Analytics • B2B
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Direktor uchun moliyaviy va operatsion samaradorlik: Direct vs Indirect taqsimot, COGS, yalpi marja va logistika hissalari
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenClassification()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700"
          >
            <Settings2 className="w-4 h-4 text-emerald-600" />
            <span>Mijoz Kanallari (ERP)</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!data?.channels}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Eksport CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium transition-colors border border-slate-300 dark:border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Yangilanmoqda...' : 'Yangilash'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Channel Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        {/* Period Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'Barchasi (All Time)' },
            { id: 'THIS_MONTH', label: 'Shu Oy' },
            { id: 'THIS_QUARTER', label: 'Shu Kvartal' },
            { id: 'THIS_YEAR', label: 'Shu Yil (2026)' },
            { id: 'CUSTOM', label: 'Oraliq (Sana)' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === p.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {period === 'CUSTOM' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-500">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={() => fetchData()}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
            >
              Qo'llash
            </button>
          </div>
        )}

        {/* Active Channel Filter Badge */}
        {selectedChannelKey && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Filtrlangan kanal: <strong>{selectedChannelKey}</strong>
            </span>
            <button
              onClick={handleClearChannelFilter}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              × Bekor qilish
            </button>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">Taqsimot kanallari tahlili hisoblanmoqda...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Xatolik yuz berdi</h4>
            <p className="text-xs mt-0.5">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-2 text-xs font-semibold underline hover:text-rose-900 dark:hover:text-rose-100"
            >
              Qayta urinish
            </button>
          </div>
        </div>
      )}

      {/* Main Content when loaded */}
      {!loading && data && (
        <>
          {/* Executive Alerts */}
          <AlertsBanner
            alerts={data.alerts}
            onOpenSettings={() => handleOpenClassification()}
            onFilterChannel={handleSelectChannel}
          />

          {/* 6 Executive KPI Cards */}
          <ExecutiveKpiCards summary={data.summary} directVsIndirect={data.directVsIndirect} />

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'overview', label: '1. Asosiy Taqsimot & Solishtirma', icon: Layers },
                { id: 'channels_table', label: '2. Barcha Kanallar Tahlili (Level 1)', icon: FileCheck2 },
                { id: 'charts', label: '3. Grafiklar & Trendlar', icon: BarChart3 },
                { id: 'drilldown_l2', label: '4. Mijozlar & Mahsulotlar (Level 2)', icon: Users },
                { id: 'audit_l3', label: '5. Tranzaksion Audit (Level 3)', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Direct vs Indirect Comparison */}
              <DirectIndirectComparisonCard directVsIndirect={data.directVsIndirect} />

              {/* Channels Level 1 Summary Table */}
              <ChannelsTable
                channels={data.channels}
                onSelectChannel={handleSelectChannel}
              />

              {/* Quick Visual Overview: Direct vs Indirect + Channel Revenue + Gross Profit */}
              <DistributionChartsSection
                channels={data.channels}
                directVsIndirect={data.directVsIndirect}
                monthlyTrends={data.monthlyTrends}
                products={data.products}
              />
            </div>
          )}

          {/* TAB 2: LEVEL 1 CHANNELS TABLE */}
          {activeTab === 'channels_table' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ChannelsTable
                channels={data.channels}
                onSelectChannel={handleSelectChannel}
              />
            </div>
          )}

          {/* TAB 3: CHARTS & TRENDS */}
          {activeTab === 'charts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DistributionChartsSection
                channels={data.channels}
                directVsIndirect={data.directVsIndirect}
                monthlyTrends={data.monthlyTrends}
                products={data.products}
              />
            </div>
          )}

          {/* TAB 4: LEVEL 2 DRILLDOWN (CUSTOMERS & PRODUCTS) */}
          {activeTab === 'drilldown_l2' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CustomerProductDrilldown
                customers={data.customers}
                products={data.products}
                channels={data.channels}
                selectedChannelKey={selectedChannelKey || 'ALL'}
                onSelectChannel={(key) => setSelectedChannelKey(key === 'ALL' ? null : key)}
                onInspectCustomer={handleOpenClassification}
              />
            </div>
          )}

          {/* TAB 5: LEVEL 3 TRANSACTIONS AUDIT */}
          {activeTab === 'audit_l3' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <TransactionalAuditLedger
                transactionalRecords={data.transactionalRecords}
              />
            </div>
          )}

          {/* Technical Note on Financial Principles */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Moliyaviy Hisob-Kitob Qoidalari (ERP Standarti):</span>
            </div>
            <p>
              • <strong>Sof Tushum (Net Revenue)</strong> = Savdo Tushumi - Amaldagi Chegirmalar - Qaytarilgan Mahsulotlar (Returns).
            </p>
            <p>
              • <strong>Yalpi Foyda (Gross Profit)</strong> = Sof Tushum - Mahsulot Tannarxi (COGS). <em>Yalpi marja = (Yalpi Foyda / Sof Tushum) × 100</em>.
            </p>
            <p>
              • <strong>Logistikadan Keyingi Hissa (Contribution after Logistics)</strong> = Yalpi Foyda - To'g'ridan-to'g'ri yetkazib berish xarajatlari. Bu ko'rsatkich <strong>Sof Foyda (Net Profit)</strong> emas, chunki unga ma'muriy, umumzavod va soliq xarajatlari chegirilmagan.
            </p>
            <p>
              • Barcha ma'lumotlar real tranzaksiyalar, buyurtmalar, hisob-fakturalar va to'lov reestrlaridan olingan bo'lib, sun'iy (mock) raqamlar ishlatilmaydi.
            </p>
          </div>
        </>
      )}

      {/* Customer Classification Modal */}
      <CustomerClassificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchData()}
        initialCustomerId={modalCustomerId}
        customers={customerOptions}
        lang="uz"
      />
    </div>
  )
}
export default DistributionChannelsContent

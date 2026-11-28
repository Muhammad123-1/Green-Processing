'use client'

import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ShieldAlert,
  Boxes,
  Percent,
  Layers
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  channels: any[]
  directVsIndirect: any
  monthlyTrends: any[]
  products: any[]
}

export default function DistributionChartsSection({
  channels,
  directVsIndirect,
  monthlyTrends,
  products
}: Props) {
  const { formatDual, lang } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [activeChartTab, setActiveChartTab] = useState<'REVENUE' | 'MARGIN' | 'TRENDS' | 'EXPOSURE' | 'PRODUCTS'>('REVENUE')

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatUzsShort = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} mlrd`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} mln`
    return val.toLocaleString()
  }

  // 1. Direct vs Indirect Pie Data
  const pieData = [
    {
      name: formatDual("Direct (To'g'ridan-to'g'ri)", "Direct (Прямой)", "Direct"),
      value: directVsIndirect?.DIRECT?.netRevenue || 0,
      share: directVsIndirect?.DIRECT?.revenueSharePct || 0,
      color: '#10b981'
    },
    {
      name: formatDual("Indirect (Vositali)", "Indirect (Непрямой)", "Indirect"),
      value: directVsIndirect?.INDIRECT?.netRevenue || 0,
      share: directVsIndirect?.INDIRECT?.revenueSharePct || 0,
      color: '#3b82f6'
    }
  ]

  // 2. Channels Revenue & Margin Data
  const channelBarData = channels
    .filter(c => c.netRevenue > 0)
    .map(c => ({
      name: lang === 'ru' ? c.nameRu.split(' ')[0] : lang === 'en' ? c.nameEn.split(' ')[0] : c.nameUz.split(' ')[0],
      fullName: lang === 'ru' ? c.nameRu : lang === 'en' ? c.nameEn : c.nameUz,
      netRevenueMln: Math.round(c.netRevenue / 1_000_000),
      grossProfitMln: Math.round(c.grossProfit / 1_000_000),
      logisticsMln: Math.round(c.logisticsCost / 1_000_000),
      grossMarginPct: Number(c.grossMarginPct.toFixed(1)),
      contributionMarginPct: Number(c.contributionMarginPct.toFixed(1)),
      outstandingMln: Math.round(c.outstandingReceivables / 1_000_000),
      overdueMln: Math.round(c.overdueReceivables / 1_000_000),
      color: c.color
    }))

  // 3. Product by Channel Matrix Data
  const topProductsMap = new Map<string, any>()
  products.forEach(p => {
    let item = topProductsMap.get(p.productName)
    if (!item) {
      item = {
        name: p.productName,
        totalRevenue: 0,
        DIRECT: 0,
        INDIRECT: 0
      }
      topProductsMap.set(p.productName, item)
    }
    item.totalRevenue += p.grossRevenue
    if (['RESTAURANTS_FOOD_SERVICE', 'CORPORATE_END_CUSTOMERS'].includes(p.channelCategory)) {
      item.DIRECT += Math.round(p.grossRevenue / 1_000_000)
    } else {
      item.INDIRECT += Math.round(p.grossRevenue / 1_000_000)
    }
  })

  const topProductsChartData = Array.from(topProductsMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 6)

  // 4. Monthly Trend Data Formatted
  const trendData = monthlyTrends.map(t => ({
    month: t.month,
    directMln: Math.round(t.directRevenue / 1_000_000),
    indirectMln: Math.round(t.indirectRevenue / 1_000_000),
    totalMln: Math.round(t.totalNetRevenue / 1_000_000),
    profitMln: Math.round(t.totalGrossProfit / 1_000_000)
  }))

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xs space-y-4">
      {/* Chart Nav Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <BarChart3 size={17} />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              {formatDual("Taqsimot Kanallari Vizual Grafiklari", "Графики и визуальная аналитика каналов", "Channel Visual Analytics & Charts")}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveChartTab('REVENUE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeChartTab === 'REVENUE'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {formatDual("Tushum & Taqsimot", "Выручка", "Revenue")}
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('MARGIN')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeChartTab === 'MARGIN'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {formatDual("Marja & Foyda", "Маржинальность", "Profit & Margin")}
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('TRENDS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeChartTab === 'TRENDS'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {formatDual("Oylik Trendlar", "Динамика", "Growth Trends")}
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('EXPOSURE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeChartTab === 'EXPOSURE'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {formatDual("Qarzdorlik Xatari", "Кредитный риск", "Receivables Risk")}
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('PRODUCTS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeChartTab === 'PRODUCTS'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {formatDual("Mahsulotlar Matritsasi", "Матрица товаров", "Product Mix")}
          </button>
        </div>
      </div>

      {/* Render Active Chart View */}
      {mounted && (
        <div className="w-full">
          {/* 1. REVENUE VIEW: Pie + Bar Chart */}
          {activeChartTab === 'REVENUE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
              {/* Pie: Direct vs Indirect */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750 flex flex-col items-center">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2">
                  {formatDual("Direct vs Indirect Nisbati", "Прямая vs Непрямая", "Direct vs Indirect Share")}
                </span>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${formatUzsShort(Number(val))} so'm`, '']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar: Net Revenue by Subcategory */}
              <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 block mb-3">
                  {formatDual("Taqsimot Kanallari Bo'yicha Sof Tushum (mln so'm)", "Чистая выручка по каналам (млн сум)", "Net Revenue by Channel (Mln UZS)")}
                </span>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelBarData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} mln so'm`, formatDual("Sof Tushum", "Выручка", "Revenue")]}
                        labelFormatter={(lbl, p) => p?.[0]?.payload?.fullName || lbl}
                      />
                      <Bar dataKey="netRevenueMln" radius={[8, 8, 0, 0]}>
                        {channelBarData.map((entry, idx) => (
                          <Cell key={`cell-bar-${idx}`} fill={entry.color || '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 2. MARGIN VIEW: Gross Profit & Gross Margin % */}
          {activeChartTab === 'MARGIN' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                  {formatDual(
                    "Yalpi Marja (%) va Logistikadan Keyingi Hissa Marjasi (%) Kanallar Bo'yicha",
                    "Валовая маржа (%) и маржа после логистики (%) по каналам",
                    "Gross Margin (%) vs Contribution Margin (%) by Channel"
                  )}
                </span>
                <span className="text-[11px] text-slate-400 italic">
                  {formatDual(
                    "Logistika xarajatlari alohida hisoblanadi (Yalpi foyda sof foyda deb taqdim etilmaydi)",
                    "Расходы логистики рассчитываются отдельно от валовой прибыли",
                    "Logistics costs tracked separately from gross profit"
                  )}
                </span>
              </div>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelBarData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" domain={[0, 45]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val}%`,
                        name === 'grossMarginPct'
                          ? formatDual("Yalpi Marja", "Валовая маржа", "Gross Margin")
                          : formatDual("Logistika Keyin Hissa", "Марж. доход (после логистики)", "Contribution Margin")
                      ]}
                      labelFormatter={(lbl, p) => p?.[0]?.payload?.fullName || lbl}
                    />
                    <Legend />
                    <Bar
                      dataKey="grossMarginPct"
                      name={formatDual("Yalpi Marja (%)", "Валовая маржа (%)", "Gross Margin (%)")}
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="contributionMarginPct"
                      name={formatDual("Logistikadan Keyingi Hissa (%)", "После логистики (%)", "After Logistics (%)")}
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. TRENDS VIEW: Monthly Channel Growth */}
          {activeChartTab === 'TRENDS' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 block mb-3">
                {formatDual(
                  "Oylik Taqsimot Trendlari: Direct vs Indirect Savdo Dinamikasi (mln so'm)",
                  "Ежемесячная динамика: Direct vs Indirect (млн сум)",
                  "Monthly Channel Growth Dynamics (Mln UZS)"
                )}
              </span>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} mln so'm`, '']} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="directMln"
                      name={formatDual("Direct Tushum", "Прямая выручка", "Direct Revenue")}
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                    />
                    <Area
                      type="monotone"
                      dataKey="indirectMln"
                      name={formatDual("Indirect Tushum", "Непрямая выручка", "Indirect Revenue")}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 4. EXPOSURE VIEW: Revenue vs Overdue Receivables Risk */}
          {activeChartTab === 'EXPOSURE' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 block mb-3">
                {formatDual(
                  "Savdo Hajmi va Muddati O'tgan Qarzdorlik Xatari Solishtirmasi (mln so'm)",
                  "Сопоставление выручки и просроченной задолженности (млн сум)",
                  "Revenue vs Overdue Receivables Exposure (Mln UZS)"
                )}
              </span>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelBarData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} mln so'm`,
                        name === 'netRevenueMln'
                          ? formatDual("Sof Tushum", "Выручка", "Revenue")
                          : name === 'outstandingMln'
                          ? formatDual("Umumiy Qarz", "Общая ДЗ", "Outstanding")
                          : formatDual("Muddati O'tgan Qarz", "Просроченная ДЗ", "Overdue Debt")
                      ]}
                      labelFormatter={(lbl, p) => p?.[0]?.payload?.fullName || lbl}
                    />
                    <Legend />
                    <Bar
                      dataKey="netRevenueMln"
                      name={formatDual("Sof Tushum", "Чистая выручка", "Net Revenue")}
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="outstandingMln"
                      name={formatDual("Umumiy Qarz", "Общая дебиторка", "Total AR")}
                      fill="#eab308"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="overdueMln"
                      name={formatDual("Muddati O'tgan Qarz (Xatar)", "Просроченная (Риск)", "Overdue (Risk)")}
                      fill="#e11d48"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 5. PRODUCTS VIEW: Top Products Mix by Channel */}
          {activeChartTab === 'PRODUCTS' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 block mb-3">
                {formatDual(
                  "Asosiy Mahsulotlarning Direct va Indirect Kanallarga Taqsimoti (mln so'm)",
                  "Распределение ключевой продукции по Direct и Indirect (млн сум)",
                  "Top Product Performance by Channel Split (Mln UZS)"
                )}
              </span>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} mln so'm`, '']} />
                    <Legend />
                    <Bar
                      dataKey="DIRECT"
                      name={formatDual("Direct (Restoranlar & Korporativ)", "Direct (HoReCa & Корп)", "Direct")}
                      stackId="a"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="INDIRECT"
                      name={formatDual("Indirect (Supermarketlar, Ulgurji, Eksport)", "Indirect (Ритейл, Опт, Экспорт)", "Indirect")}
                      stackId="a"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

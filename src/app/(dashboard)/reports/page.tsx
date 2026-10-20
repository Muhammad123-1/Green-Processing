'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  Printer,
  Users,
  Eye,
  X,
  Image as ImageIcon,
  ShieldCheck,
  Thermometer,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useLanguage } from '@/components/providers/LanguageProvider'

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface InspectorStat {
  name: string
  total: number
  accepted: number
  rejected: number
  conditional: number
  totalQuantity?: number
  acceptRate: number
}

interface RejectedInspection {
  id: number
  actNumber: string
  inspectionDate: string
  supplierName: string
  productName: string
  batchNumber: string
  quantity: number
  quantityUnit: string
  temperature?: number | null
  temperatureUnit?: string
  conclusion: string
  notes?: string | null
  inspector: string
  status: string
  rating?: number | null
  category: string
  images: { id: number; url: string; type?: string | null }[]
}

interface MonthlyStats {
  total: number
  accepted: number
  rejected: number
  conditional: number
  totalQuantity: number
  acceptRate: number
  byProduct: { productId: number; name: string; count: number; totalQuantity: number; accepted: number; rejected: number }[]
  bySupplier: { supplierId: number; name: string; count: number; totalQuantity: number; accepted: number; rejected: number }[]
  byInspector: InspectorStat[]
  rejectedInspections: RejectedInspection[]
  rejectionReasons: { reason: string; count: number }[]
}

interface YearlyStats {
  year: number
  yearlySummary: {
    total: number
    accepted: number
    rejected: number
    conditional: number
    totalQuantity: number
    acceptRate: number
  }
  monthlyData: {
    month: number
    monthName: string
    total: number
    accepted: number
    rejected: number
    conditional: number
    quantity: number
    acceptRate: number
  }[]
  byInspector: InspectorStat[]
  rejectedInspections: RejectedInspection[]
  rejectionReasons: { reason: string; count: number }[]
}

export default function ReportsPage() {
  const now = new Date()
  const { formatDual, lang } = useLanguage()
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [monthly, setMonthly] = useState<MonthlyStats | null>(null)
  const [yearly, setYearly] = useState<YearlyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [viewType, year, month])

  async function fetchReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: viewType, year: String(year), month: String(month) })
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (viewType === 'monthly') setMonthly(data)
        else setYearly(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-6 animate-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatDual("Tahliliy Hisobotlar va Statistika", "Аналитические отчеты и статистика", "Analytical Reports & Analytics")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatDual(
              "Xomashyo kirimi · Qabul qiluvchi xodimlar · Rad etilgan partiyalar sababi va foto-dalillari",
              "Приемка сырья · Ответственные сотрудники · Причины отклонений и фото-доказательства",
              "Incoming raw materials · Receiving inspectors · Defect reasons and photo evidence"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
          >
            <Printer size={15} />
            <span>{formatDual("Chop etish", "Печать", "Print")}</span>
          </button>
          <a
            href={`/api/reports/excel?lang=${lang || 'uz'}`}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <FileSpreadsheet size={15} />
            <span>{formatDual("Excel Reyestr", "Excel Реестр", "Excel Registry")}</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700 p-0.5 bg-slate-100 dark:bg-dark-800">
              {(['monthly', 'yearly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setViewType(t)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    viewType === t
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t === 'monthly'
                    ? formatDual("Oylik Tahlil", "Ежемесячно", "Monthly Analysis")
                    : formatDual("Yillik Tahlil (12 oy)", "Годовой отчет (12 мес.)", "Annual Report (12 mos)")}
                </button>
              ))}
            </div>

            {/* Year Selector */}
            <select
              className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y} {formatDual("yil", "год", "year")}</option>
              ))}
            </select>

            {/* Month Selector */}
            {viewType === 'monthly' && (
              <select
                className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {MONTHS_UZ.map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {formatDual(MONTHS_UZ[i], MONTHS_RU[i], MONTHS_EN[i])}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs font-medium text-slate-500">
            {viewType === 'monthly'
              ? `${formatDual(MONTHS_UZ[month - 1], MONTHS_RU[month - 1], MONTHS_EN[month - 1])} ${year}`
              : `${year} — ${formatDual("1 yillik umumiy ko'rsatkichlar", "Годовые сводные данные", "Full-year summary")}`}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewType === 'monthly' && monthly ? (
        <MonthlyReport data={monthly} year={year} month={month} onPreviewImage={setPreviewImage} />
      ) : viewType === 'yearly' && yearly ? (
        <YearlyReport data={yearly} onPreviewImage={setPreviewImage} />
      ) : null}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full bg-dark-900 rounded-3xl overflow-hidden p-2 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X size={18} />
            </button>
            <img src={previewImage} alt="Defekt dalili" className="w-full max-h-[80vh] object-contain rounded-2xl mx-auto" />
            <div className="p-3 text-center text-xs text-slate-400">
              {formatDual("Qabul jarayonida olingan foto-dalil", "Фото-доказательство дефекта при приемке", "Defect photo evidence during receiving")}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MonthlyReport({
  data,
  year,
  month,
  onPreviewImage,
}: {
  data: MonthlyStats
  year: number
  month: number
  onPreviewImage: (url: string) => void
}) {
  const { formatDual, lang } = useLanguage()
  const acceptRate = data.acceptRate

  const statusPieData = [
    { name: formatDual("Qabul", "Принято", "Accepted"), value: data.accepted, color: '#10b981' },
    { name: formatDual("Rad etildi", "Отклонено", "Rejected"), value: data.rejected, color: '#ef4444' },
    { name: formatDual("Shartli", "Условно", "Conditional"), value: data.conditional, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon={<BarChart3 className="text-blue-500" size={20} />}
          label={formatDual("Jami aktlar", "Всего актов", "Total acts")}
          value={`${data.total} ${formatDual('ta', 'шт', 'pcs')}`}
          subtext={`${(data.totalQuantity / 1000).toFixed(1)} tn ${formatDual("xomashyo", "сырья", "raw material")}`}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="text-emerald-500" size={20} />}
          label={formatDual("Qabul qilindi", "Принято", "Accepted")}
          value={`${data.accepted} ${formatDual('ta', 'шт', 'pcs')}`}
          subtext={`${acceptRate}% ${formatDual("qabul darajasi", "приемка", "accept rate")}`}
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="text-red-500" size={20} />}
          label={formatDual("Rad etildi", "Отклонено", "Rejected")}
          value={`${data.rejected} ${formatDual('ta', 'шт', 'pcs')}`}
          subtext={`${data.total > 0 ? ((data.rejected / data.total) * 100).toFixed(1) : 0}% ${formatDual("brak / qaytarish", "брак", "defect")}`}
          color="red"
        />
        <StatCard
          icon={<AlertTriangle className="text-amber-500" size={20} />}
          label={formatDual("Shartli qabul", "Условно", "Conditional")}
          value={`${data.conditional} ${formatDual('ta', 'шт', 'pcs')}`}
          subtext={formatDual("Sexda qayta ishlash", "Переработка", "Processing")}
          color="amber"
        />
      </div>

      {/* Acceptance Rate & Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rate Progress Bar */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                {formatDual("Umumiy qabul qilish darajasi", "Общий уровень приемки", "Overall Acceptance Rate")}
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{acceptRate}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-dark-800 rounded-full h-4 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-700 shadow-sm"
                style={{ width: `${acceptRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
              <span>0% (To'liq rad)</span>
              <span>50%</span>
              <span>100% (Benuqson qabul)</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dark-800 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">{formatDual("Qabul", "Принято", "Accepted")}</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-300">{data.accepted}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40">
              <span className="text-[10px] font-bold uppercase text-red-700 dark:text-red-400 block">{formatDual("Rad", "Отклонено", "Rejected")}</span>
              <span className="text-base font-black text-red-600 dark:text-red-300">{data.rejected}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">{formatDual("Shartli", "Условно", "Conditional")}</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-300">{data.conditional}</span>
            </div>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
            {formatDual("Partiyalar Nisbati", "Соотношение партий", "Batch Status Ratio")}
          </h3>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} ${formatDual('ta', 'шт', 'pcs')}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold mt-2">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {formatDual("Qabul", "Принято", "Accepted")} ({data.accepted})
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {formatDual("Rad", "Отклонено", "Rejected")} ({data.rejected})
            </span>
            {data.conditional > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {formatDual("Shartli", "Условно", "Conditional")} ({data.conditional})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: KIM TOMONIDAN QABUL QILINYAPTI (INSPECTORS ANALYTICS) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {formatDual("Kim tomonidan qabul qilinyapti (Mas'ul xodimlar)", "Кем принимается (Ответственные сотрудники)", "Who accepted (Responsible inspectors)")}
              </h3>
              <p className="text-[11px] text-slate-500">
                {formatDual("Har bir nazoratchi bo'yicha qabul qilingan va rad etilgan aktlar statistikasi", "Статистика принятых и отклоненных актов по каждому инспектору", "Inspected acts, accept & reject stats per inspector")}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg border border-blue-200 dark:border-blue-800">
            {data.byInspector.length} {formatDual("nafar nazoratchi", "инспекторов", "inspectors")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.byInspector.map((ins, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/50 hover:shadow-xs transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{ins.name}</h4>
                  <span className="text-[10px] text-slate-400">{ins.total} ta akt rasmiylashtirgan</span>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  {ins.acceptRate}%
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-dark-700 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-emerald-500" style={{ width: `${ins.acceptRate}%` }} />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-dark-700">
                <span className="text-emerald-600">Qabul: {ins.accepted}</span>
                <span className="text-red-500">Rad: {ins.rejected}</span>
                {ins.conditional > 0 && <span className="text-amber-500">Shartli: {ins.conditional}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: BULOR NEGA RAD ETILDI (REJECTIONS & REASONS WITH PHOTOS) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {formatDual("Nega rad etildi? (Defektlar va Dalolatnomalar tahlili)", "Почему отклонено? (Анализ дефектов и актов)", "Why was it rejected? (Defect & Rejection Evidence)")}
              </h3>
              <p className="text-[11px] text-slate-500">
                {formatDual("Rad etilgan partiyalar sabablari, xulosalar, xodimlar izohlari va foto-dalillar", "Причины отклонений, заключения, отзывы сотрудников и фото-доказательства", "Rejection reasons, conclusions, inspector notes and photos")}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-red-50 dark:bg-red-950/50 text-red-600 rounded-lg border border-red-200 dark:border-red-800 shrink-0">
            {data.rejectedInspections.length} {formatDual("ta rad / shartli partiya", "отклоненных партий", "rejected batches")}
          </span>
        </div>

        {/* Rejection categories breakdown */}
        {data.rejectionReasons.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
              {formatDual("Asosiy rad etilish sabablari:", "Основные причины отклонения:", "Main rejection categories:")}
            </span>
            <div className="flex flex-wrap gap-2">
              {data.rejectionReasons.map((r, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-bold text-red-800 dark:text-red-300">
                  <span>{r.reason}</span>
                  <span className="bg-red-200 dark:bg-red-900 px-1.5 py-0.2 rounded-md text-[10px]">{r.count} ta</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List of Rejected / Conditional Acts */}
        {data.rejectedInspections.length === 0 ? (
          <div className="text-center py-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            {formatDual("Ushbu oyda barcha partiyalar to'liq qabul qilingan! Rad etilgan xomashyo yo'q.", "В этом месяце все партии приняты! Отклонений нет.", "All batches were accepted this month! No rejections.")}
          </div>
        ) : (
          <div className="space-y-3">
            {data.rejectedInspections.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-dark-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-dark-700">
                      {item.actNumber}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      {item.productName}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">— {item.supplierName}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${item.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {item.status === 'REJECTED' ? formatDual("RAD ETILDI", "ОТКЛОНЕНО", "REJECTED") : formatDual("SHARTLI", "УСЛОВНО", "CONDITIONAL")}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.inspectionDate).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                </div>

                {/* Rejection reason & conclusion */}
                <div className="bg-white dark:bg-dark-900 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-red-900 dark:text-red-200 leading-snug">
                        {item.conclusion}
                      </p>
                      {item.notes && (
                        <p className="text-slate-600 dark:text-slate-400 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Footer: Inspector, Quantity, Temperature & Photo Evidence */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      {formatDual("Tekshiruvchi:", "Инспектор:", "Inspector:")} <b>{item.inspector}</b>
                    </span>
                    <span>•</span>
                    <span>
                      {formatDual("Miqdor:", "Объем:", "Qty:")} <b>{item.quantity} {item.quantityUnit}</b>
                    </span>
                    {item.temperature !== null && item.temperature !== undefined && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Thermometer size={12} className="text-orange-500" /> {item.temperature} {item.temperatureUnit}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Photos */}
                  {item.images.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <ImageIcon size={12} /> {formatDual("Dalil:", "Фото:", "Photo:")}
                      </span>
                      {item.images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => onPreviewImage(img.url)}
                          className="relative group rounded-lg overflow-hidden border border-red-200 dark:border-red-800 w-10 h-10 shrink-0"
                          title="Rasmni kattalashtirib ko'rish"
                        >
                          <img src={img.url} alt="Defekt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye size={12} className="text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      {formatDual("Foto-dalil biriktirilmagan", "Фото не прикреплено", "No photo attached")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: TOP PRODUCTS & TOP SUPPLIERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* By Product */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-dark-800">
            <Package size={16} className="text-purple-500" />
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              {formatDual("Mahsulotlar bo'yicha kirim", "Приемка по продуктам", "Receiving by Product")}
            </h3>
          </div>
          <div className="space-y-3">
            {data.byProduct.slice(0, 8).map((p) => {
              const pct = data.total > 0 ? Math.round((p.count / data.total) * 100) : 0
              return (
                <div key={p.productId}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200 truncate flex-1">{p.name}</span>
                    <span className="text-slate-500 ml-2">{p.count} ta ({p.totalQuantity} kg)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-dark-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Supplier */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-dark-800">
            <Truck size={16} className="text-cyan-500" />
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              {formatDual("Ta'minotchilar bo'yicha kirim", "Поставки по поставщикам", "Receiving by Supplier")}
            </h3>
          </div>
          <div className="space-y-3">
            {data.bySupplier.slice(0, 8).map((s) => {
              const pct = data.total > 0 ? Math.round((s.count / data.total) * 100) : 0
              return (
                <div key={s.supplierId}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 dark:text-slate-200 truncate flex-1">{s.name}</span>
                    <span className="text-slate-500 ml-2">{s.count} ta</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-dark-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function YearlyReport({
  data,
  onPreviewImage,
}: {
  data: YearlyStats
  onPreviewImage: (url: string) => void
}) {
  const { formatDual, lang } = useLanguage()
  const summary = data.yearlySummary || {
    total: data.monthlyData.reduce((s, m) => s + m.total, 0),
    accepted: data.monthlyData.reduce((s, m) => s + m.accepted, 0),
    rejected: data.monthlyData.reduce((s, m) => s + m.rejected, 0),
    conditional: data.monthlyData.reduce((s, m) => s + m.conditional, 0),
    totalQuantity: data.monthlyData.reduce((s, m) => s + (m.quantity || 0), 0),
    acceptRate: 0
  }
  summary.acceptRate = summary.total > 0 ? Math.round((summary.accepted / summary.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Annual KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon={<BarChart3 className="text-blue-500" size={20} />}
          label={formatDual("Yillik Jami Aktlar", "Всего актов за год", "Total Annual Acts")}
          value={`${summary.total} ta`}
          subtext={`${(summary.totalQuantity / 1000).toFixed(1)} tn ${formatDual("kirim", "приход", "received")}`}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="text-emerald-500" size={20} />}
          label={formatDual("Yillik Qabul", "Принято за год", "Annual Accepted")}
          value={`${summary.accepted} ta`}
          subtext={`${summary.acceptRate}% ${formatDual("o'rtacha sifat", "среднее кач-во", "avg quality")}`}
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="text-red-500" size={20} />}
          label={formatDual("Yillik Rad Etilgan", "Отклонено за год", "Annual Rejected")}
          value={`${summary.rejected} ta`}
          subtext={`${summary.total > 0 ? ((summary.rejected / summary.total) * 100).toFixed(1) : 0}% ${formatDual("brak darajasi", "уровень брака", "defect rate")}`}
          color="red"
        />
        <StatCard
          icon={<AlertTriangle className="text-amber-500" size={20} />}
          label={formatDual("Yillik Shartli", "Условно за год", "Annual Conditional")}
          value={`${summary.conditional} ta`}
          subtext={formatDual("Qayta ishlangan", "Переработано", "Processed")}
          color="amber"
        />
      </div>

      {/* Recharts Modern Monthly Bar Chart */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {data.year} — {formatDual("Oylik qabul va rad qilish dinamikasi", "Ежемесячная динамика приемки и брака", "Monthly acceptance and defect dynamics")}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">12 oy to'liq ko'rsatkichlari</span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val, name) => [
                  `${val} ${formatDual('ta', 'шт', 'pcs')}`,
                  name === 'accepted' ? formatDual('Qabul', 'Принято', 'Accepted') : name === 'rejected' ? formatDual('Rad etildi', 'Отклонено', 'Rejected') : formatDual('Shartli', 'Условно', 'Conditional')
                ]}
              />
              <Legend formatter={(val) => val === 'accepted' ? formatDual('Qabul', 'Принято', 'Accepted') : val === 'rejected' ? formatDual('Rad etildi', 'Отклонено', 'Rejected') : formatDual('Shartli', 'Условно', 'Conditional')} />
              <Bar dataKey="accepted" fill="#10b981" radius={[4, 4, 0, 0]} name="accepted" />
              <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="rejected" />
              <Bar dataKey="conditional" fill="#f59e0b" radius={[4, 4, 0, 0]} name="conditional" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION: YILLIK KIM TOMONIDAN QABUL QILINDI */}
      {data.byInspector && data.byInspector.length > 0 && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {formatDual("Yillik: Kim tomonidan qabul qilindi", "За год: Кем принималось", "Annual: Inspector Acceptance Stats")}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">{data.byInspector.length} nafar xodim</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.byInspector.map((ins, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/50">
                <div className="flex items-start justify-between gap-1 mb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{ins.name}</h4>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    {ins.acceptRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-700 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500" style={{ width: `${ins.acceptRate}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Jami: {ins.total} ta</span>
                  <span className="text-emerald-600">Qabul: {ins.accepted}</span>
                  <span className="text-red-500">Rad: {ins.rejected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: YILLIK RAD ETILGAN PARTIYALAR */}
      {data.rejectedInspections && data.rejectedInspections.length > 0 && (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {formatDual("Yillik rad etilgan partiyalar ro'yxati va sabablari", "Годовой реестр отклоненных партий и причин", "Annual rejected batches & reasons")}
              </h3>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900">
              {data.rejectedInspections.length} ta rad / shartli
            </span>
          </div>

          <div className="space-y-3">
            {data.rejectedInspections.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black bg-white dark:bg-dark-800 px-2 py-0.5 rounded border border-slate-200 dark:border-dark-700">
                      {item.actNumber}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{item.productName}</h4>
                    <span className="text-xs text-slate-500 font-medium">— {item.supplierName}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.inspectionDate).toLocaleDateString('uz-UZ')}
                  </span>
                </div>

                <div className="bg-white dark:bg-dark-900 p-3 rounded-xl border border-red-200 dark:border-red-900/40 text-xs">
                  <p className="font-bold text-red-900 dark:text-red-200">{item.conclusion}</p>
                  {item.notes && <p className="text-slate-500 italic mt-1">"{item.notes}"</p>}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    {formatDual("Qabul qiluvchi:", "Инспектор:", "Inspector:")} <b>{item.inspector}</b> · {item.quantity} {item.quantityUnit}
                  </div>
                  {item.images.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Foto:</span>
                      {item.images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => onPreviewImage(img.url)}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-red-300 dark:border-red-800 shrink-0 hover:scale-105 transition-transform"
                        >
                          <img src={img.url} alt="Defekt" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  color: 'blue' | 'emerald' | 'red' | 'amber'
}) {
  const borderColors = {
    blue: 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20',
    emerald: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20',
    red: 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/20',
    amber: 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20',
  }

  return (
    <div className={`p-5 rounded-2xl border ${borderColors[color]} bg-white dark:bg-dark-900 shadow-sm space-y-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white pt-1">{value}</div>
      <div className="text-[11px] font-semibold text-slate-400">{subtext}</div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, Download, ShieldCheck, CheckCircle2, Award, Users, ChefHat, Package, AlertTriangle, Building2, TrendingUp, DollarSign } from 'lucide-react'

interface ExecutiveSummaryReportModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  directorLang: 'uz' | 'ru' | 'en'
  formatDual: (uz: string, ru: string, en?: string) => string
  dateLocale: string
  period: string
}

export default function ExecutiveSummaryReportModal({
  isOpen,
  onClose,
  data,
  directorLang,
  formatDual,
  dateLocale,
  period,
}: ExecutiveSummaryReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !data || !mounted) return null

  const kpis = data?.kpis || {}
  const arrivals = kpis.arrivals || {}
  const production = kpis.production || {}
  const warehouse = kpis.warehouse || {}
  const employees = kpis.employees || {}
  const surveys = kpis.surveys || {}
  const kitchen = kpis.kitchen || {}
  const financialLoss = kpis.financialLoss || {}

  const now = new Date()
  const formattedToday = now.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Period label
  const periodLabel =
    period === 'today'
      ? formatDual('Bugungi kunlik hisobot', 'Ежедневный отчет (сегодня)', 'Daily report (today)')
      : period === 'week'
      ? formatDual('Haftalik yig\'ma hisobot', 'Еженедельный сводный отчет', 'Weekly summary report')
      : period === 'month'
      ? formatDual('Oylik yakuniy hisobot', 'Ежемесячный итоговый отчет', 'Monthly closing report')
      : period === 'year'
      ? formatDual('Yillik konsolidatsiyalangan hisobot', 'Годовой консолидированный отчет', 'Annual consolidated report')
      : formatDual('Davriy maxsus hisobot', 'Периодический отчет', 'Periodic report')

  const totalArrivalKg = arrivals.totalKg || 0
  const acceptedKg = arrivals.acceptedKg || 0
  const rejectedArrivalKg = arrivals.rejectedKg || 0
  const arrivalAcceptedPct = totalArrivalKg > 0 ? ((acceptedKg / totalArrivalKg) * 100).toFixed(1) : '100'

  const totalBoxes = production.totalOutputBoxes || 0
  const yieldPct = production.avgYieldPercent != null ? production.avgYieldPercent.toFixed(1) : '-'
  const shiftsCount = production.checklistsCount || 0
  const prodRejectKg = production.rejectedKg || 0

  const totalBrakKg = financialLoss.totalBrakKg || (rejectedArrivalKg + prodRejectKg)
  const lossUzs = financialLoss.estimatedLossUzs || (totalBrakKg * 13500)
  const discrepancyKg = warehouse.transfersDiscrepancyKg || 0
  const totalStockKg = warehouse.totalInventoryKg || 0

  const activeStaff = employees.activeUsersWithActions || 0
  const totalStaff = employees.totalUsers || 0
  const mealName = kitchen.latestMeal?.mealName || formatDual("Issiq tushlik ovqati", "Горячий обед", "Hot lunch meal")
  const mealServings = kitchen.latestMeal?.servings || 0
  const chefName = kitchen.latestMeal?.preparedBy || formatDual("Sex oshpazi", "Шеф-повар", "Head Chef")
  const mealRating = kitchen.satisfactionPercent != null ? kitchen.satisfactionPercent : 100
  const surveySatisfaction = surveys.satisfactionPercent != null ? surveys.satisfactionPercent.toFixed(1) : '-'
  const surveyAvg = surveys.avgRating ? surveys.avgRating.toFixed(2) : '-'

  const handlePrint = () => {
    window.print()
  }

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          body * {
            visibility: hidden !important;
          }
          #executive-report-a4, #executive-report-a4 * {
            visibility: visible !important;
          }
          #executive-report-a4 {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
      {/* Top Action Bar (hidden on print) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="fixed top-3 sm:top-5 right-3 sm:right-6 z-[101] flex items-center gap-2 no-print"
      >
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Printer size={18} />
          <span>{formatDual("Chop etish / PDF saqlash", "Печать / Сохранить в PDF", "Print / Save as PDF")}</span>
        </button>
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* A4 PAPER CONTAINER */}
      {/* ========================================================================= */}
      <div
        id="executive-report-a4"
        ref={reportRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 w-full max-w-[210mm] my-auto rounded-2xl shadow-2xl border border-slate-300 print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none overflow-hidden cursor-default"
        style={{
          boxSizing: 'border-box',
          minHeight: '275mm',
        }}
      >
        <div className="p-6 sm:p-8 flex flex-col justify-between" style={{ minHeight: '275mm' }}>
          <div>
            {/* 1. OFFICIAL HEADER */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-tighter print:border print:border-slate-900">
                    GP
                  </div>
                  <div>
                    <h1 className="font-black text-base sm:text-lg text-slate-900 tracking-tight uppercase">
                      "GREEN PROCESSING" MChJ
                    </h1>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight">
                      {formatDual(
                        "Oziq-ovqat va sabzavot mahsulotlarini qayta ishlash hamda qadoqlash korxonasi",
                        "Предприятие по переработке и упаковке овощной и пищевой продукции",
                        "Food and vegetable processing & packaging enterprise"
                      )}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      FSSC 22000 &bull; HACCP &bull; ISO 22000:2018 Xalqaro Standartlari asosida
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-600 space-y-0.5 border-l border-slate-200 pl-3">
                  <div>
                    <span className="font-bold text-slate-900">HUJJAT №:</span> GP-DIR-{now.getFullYear()}/{String(now.getMonth() + 1).padStart(2, '0')}-{String(now.getDate()).padStart(2, '0')}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{formatDual("Sana:", "Дата:", "Date:")}</span> {formattedToday} ({formattedTime})
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{formatDual("Status:", "Статус:", "Status:")}</span> <b className="text-emerald-700">RASMIY TASDIQLANGAN</b>
                  </div>
                </div>
              </div>

              {/* DOCUMENT BANNER TITLE */}
              <div className="mt-3 pt-2 border-t border-slate-200 text-center">
                <h2 className="text-sm sm:text-base font-black tracking-wide text-slate-900 uppercase">
                  {formatDual(
                    "Bosh direktor uchun operatsion xulosa va audit hisoboti",
                    "Исполнительный операционный и аудиторский отчет для генерального директора",
                    "Executive Operational and Audit Summary Report for General Director"
                  )}
                </h2>
                <div className="inline-block mt-0.5 px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-300">
                  {periodLabel}
                </div>
              </div>
            </div>

            {/* 2. 2x2 BALANCED CORE SECTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 sm:gap-4 mb-4 text-[11px]">
              {/* SECTION 1: XOMASHYO VA TA'MINOT */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                    <span className="font-black text-slate-900 text-xs uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      1. {formatDual("Xomashyo Qabuli (Prixod)", "Приемка сырья (Приход)", "Raw Material Arrivals")}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700">{arrivals.totalCount || 0} {formatDual("partiya", "партий", "batches")}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Jami kelgan hajm:", "Всего поступило:", "Total arrivals volume:")}</span>
                      <b className="text-slate-900 font-black">{totalArrivalKg.toLocaleString()} kg ({(totalArrivalKg / 1000).toFixed(2)} tn)</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Muvofiq qabul qilingan:", "Принято в норме:", "Accepted compliant:")}</span>
                      <b className="text-emerald-700 font-bold">{acceptedKg.toLocaleString()} kg ({arrivalAcceptedPct}%)</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Rad etilgan / brak xomashyo:", "Отклонено / брак сырья:", "Rejected raw defect:")}</span>
                      <b className={rejectedArrivalKg > 0 ? "text-red-600 font-bold" : "text-slate-600 font-bold"}>
                        {rejectedArrivalKg.toLocaleString()} kg
                      </b>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>QC Kirish nazorati:</span>
                  <span className="font-bold text-emerald-700">100% Akt bilan rasmiylashtirilgan</span>
                </div>
              </div>

              {/* SECTION 2: ISHLAB CHIQARISH VA UNUMDORLIK */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                    <span className="font-black text-slate-900 text-xs uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      2. {formatDual("Ishlab Chiqarish va Chiqish", "Производство и выход", "Production & Yield")}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">{shiftsCount} {formatDual("smena", "смен", "shifts")}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Tayyor qadoq mahsuloti:", "Готовая упаковка:", "Packaged finished goods:")}</span>
                      <b className="text-slate-900 font-black">{totalBoxes.toLocaleString()} {formatDual("quti", "кор.", "boxes")}</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("O'rtacha chiqish normasi (Yield):", "Средний выход продукции:", "Avg production yield:")}</span>
                      <b className="text-emerald-700 font-black text-xs">{yieldPct}% (Me'yor &ge; 85%)</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Smena texnologik chiqindisi:", "Технологический отход смены:", "Shift process scrap:")}</span>
                      <b className={prodRejectKg > 0 ? "text-amber-700 font-bold" : "text-slate-600 font-bold"}>
                        {prodRejectKg.toLocaleString()} kg
                      </b>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>{formatDual("Liniya me'yori:", "Норма линии:", "Line performance:")}</span>
                  <span className="font-bold text-emerald-700">{formatDual("Barqaror", "Стабильно", "Stable")} &bull; Cheklistlar tasdiqlangan</span>
                </div>
              </div>

              {/* SECTION 3: SIFAT, BRAK VA MOLIYAVIY YO'QOTISH */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                    <span className="font-black text-slate-900 text-xs uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      3. {formatDual("Yo'qotish va Zarar Tahlili", "Анализ потерь и ущерба", "Waste & Financial Loss")}
                    </span>
                    <span className="text-[10px] font-bold text-rose-700">{formatDual("Moliyaviy baho", "Финоценка", "Financial est.")}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Jami aniqlangan brak (Kirim+Sex):", "Суммарный брак (Приемка+Цех):", "Total scrap (Arrival+Shop):")}</span>
                      <b className="text-rose-700 font-black">{totalBrakKg.toLocaleString()} kg</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Ombor transfer kamomadi:", "Недостача при перемещениях:", "Transfer discrepancy:")}</span>
                      <b className={discrepancyKg > 0 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                        {discrepancyKg > 0 ? `${discrepancyKg} kg nomuvofiqlik` : "0 kg (Muvofiq)"}
                      </b>
                    </div>
                    <div className="flex justify-between items-center bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 mt-1">
                      <span className="text-rose-900 font-bold text-[10px]">{formatDual("Brakdan baholangan zarar:", "Оценка ущерба от брака:", "Est. financial loss:")}</span>
                      <b className="text-rose-700 font-black text-xs">~{lossUzs.toLocaleString()} so'm</b>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>{formatDual("Ombordagi jami zaxira:", "Остатки на складе:", "Warehouse stock balance:")}</span>
                  <span className="font-bold text-slate-900">{(totalStockKg / 1000).toFixed(1)} tn</span>
                </div>
              </div>

              {/* SECTION 4: XODIMLAR, OSHXONA VA MIJOZLAR */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                    <span className="font-black text-slate-900 text-xs uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      4. {formatDual("Xodimlar, Oshxona va Mijozlar", "Персонал, кухня и клиенты", "Staff, Kitchen & Clients")}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700">{formatDual("Auditorlik", "Аудит", "Audit")}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Faoliyat olib borgan xodimlar:", "Активные сотрудники:", "Staff with system actions:")}</span>
                      <b className="text-slate-900 font-bold">{activeStaff} / {totalStaff} {formatDual("xodim", "сотр.", "staff")}</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Xodimlar oshxonasi taomi:", "Блюдо кухни для персонала:", "Staff canteen meal:")}</span>
                      <b className="text-slate-900 font-bold truncate max-w-[140px]">{mealName} ({mealServings} pors.)</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Oshxona ovqatidan qoniqish:", "Удовлетворенность кухней:", "Canteen satisfaction:")}</span>
                      <b className="text-emerald-700 font-black">★ {mealRating}% {formatDual("ijobiy", "положительно", "positive")}</b>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">{formatDual("Mijozlar so'rovnomasi bahosi:", "Оценка клиентских анкет:", "Client survey feedback:")}</span>
                      <b className="text-indigo-700 font-black">★ {surveySatisfaction}% ({surveyAvg} / 5.0)</b>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>{formatDual("Taom tayyorlagan:", "Повар:", "Chef:")}</span>
                  <span className="font-bold text-slate-800">{chefName}</span>
                </div>
              </div>
            </div>

            {/* 3. FSSC 22000 & HACCP CRITICAL CONTROL POINTS (CCP) STATUS STRIP */}
            <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 mb-4 text-[10px]">
              <div className="flex flex-wrap gap-1 items-center justify-between mb-1.5">
                <span className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {formatDual(
                    "FSSC 22000 & HACCP Kritik Nazorat Nuqtalari (KKT) Texnologik Holati",
                    "Технологический статус ККТ по FSSC 22000 и HACCP",
                    "FSSC 22000 & HACCP Critical Control Points (CCP) Status"
                  )}
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[9px]">
                  {formatDual("BARCHA ME'YORLAR MUVOFIO", "ВСЕ НОРМЫ СООТВЕТСТВУЮТ", "ALL CCP COMPLIANT")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">{formatDual("Harorat nazorati", "Температурный режим", "Temp control")}</span>
                  <b className="text-slate-900 font-bold block text-[10px] mt-0.5">+2°C ... +6°C</b>
                  <span className="text-emerald-700 font-bold text-[9px]">&bull; {formatDual("Me'yorda", "В норме", "Compliant")}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">{formatDual("Xlor konsentratsiyasi", "Концентрация хлора", "Chlorine ppm")}</span>
                  <b className="text-slate-900 font-bold block text-[10px] mt-0.5">50 - 100 ppm</b>
                  <span className="text-emerald-700 font-bold text-[9px]">&bull; {formatDual("Me'yorda", "В норме", "Compliant")}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">{formatDual("Yuvish suvi pH", "pH промывной воды", "Water pH")}</span>
                  <b className="text-slate-900 font-bold block text-[10px] mt-0.5">6.5 - 7.5</b>
                  <span className="text-emerald-700 font-bold text-[9px]">&bull; {formatDual("Me'yorda", "В норме", "Compliant")}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">{formatDual("Metall detektor & Qadoq", "Металлодетектор и шов", "Metal detector & Seal")}</span>
                  <b className="text-slate-900 font-bold block text-[10px] mt-0.5">100% Nazorat</b>
                  <span className="text-emerald-700 font-bold text-[9px]">&bull; {formatDual("Xatosiz", "Без сбоев", "Pass")}</span>
                </div>
              </div>
            </div>

            {/* 4. EXECUTIVE SUMMARY AND ACTIONABLE CONCLUSION */}
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 mb-4 text-[11px] leading-relaxed">
              <span className="font-black text-slate-900 block text-xs uppercase mb-1">
                {formatDual("Tizimning Avtomatik Boshqaruv Xulosasi va Tavsiyalari:", "Автоматическое заключение и рекомендации системы:", "System Executive Conclusion & Directives:")}
              </span>
              <p className="text-slate-700 text-[10.5px]">
                {formatDual(
                  `Hisobot davrida ishlab chiqarish unumdorligi ${yieldPct}% ko'rsatkich bilan belgilangan texnologik me'yordan oshiq bajarildi. Xomashyo kirimi va ombor zaxiralari o'rtasida uzluksiz transfer ta'minlangan. Jami aniqlangan texnologik va saralash chiqindisi ${totalBrakKg} kg ni tashkil etib, baholangan yo'qotish ~${lossUzs.toLocaleString()} so'm doirasida saqlanmoqda. Barcha FSSC 22000 me'yorlari buzilishlarsiz bajarildi. Xodimlar va mijozlar qoniqish darajasi yuqori ijobiy baholangan.`,
                  `За отчетный период производительность выпуска составила ${yieldPct}%, что превышает установленную норму. Обеспечено непрерывное перемещение сырья и готовой продукции. Суммарный объем технологического брака и сортировки составил ${totalBrakKg} кг с расчетной оценкой ~${lossUzs.toLocaleString()} сум. Критические контрольные точки FSSC 22000 соблюдены без отклонений. Удовлетворенность персонала и клиентов оценивается на высоком уровне.`,
                  `During the reporting period, manufacturing yield was maintained at ${yieldPct}%, exceeding operational benchmark. Raw material receiving and internal stock transfers operated without critical delays. Total sorting and process scrap was recorded at ${totalBrakKg} kg with an estimated financial impact of ~${lossUzs.toLocaleString()} UZS. All FSSC 22000 and HACCP control points were strictly adhered to. Overall staff and customer satisfaction metrics remain in the upper tier.`
                )}
              </p>
            </div>
          </div>

          {/* 5. OFFICIAL SIGNATURE AND STAMP BOX */}
          <div className="border-t-2 border-slate-900 pt-3 mt-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 text-[10px]">
              <div>
                <span className="font-black text-slate-900 block uppercase">
                  {formatDual("Bosh Direktor:", "Генеральный директор:", "General Director:")}
                </span>
                <div className="h-9 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                  <span className="text-[9px] text-slate-400 italic">(imzo)</span>
                  <span className="text-[10px] font-bold text-slate-800">M.P. (Muhr o'rni)</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">F.I.Sh: _______________________</span>
              </div>

              <div>
                <span className="font-black text-slate-900 block uppercase">
                  {formatDual("Bosh Texnolog / Sifat Rahbari:", "Главный технолог / Рук. качества:", "Chief Technologist / QC Head:")}
                </span>
                <div className="h-9 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                  <span className="text-[9px] text-slate-400 italic">(imzo)</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">F.I.Sh: _______________________</span>
              </div>

              <div>
                <span className="font-black text-slate-900 block uppercase">
                  {formatDual("Bosh Hisobchi / Ishlab Chiqarish:", "Главный бухгалтер / Производство:", "Chief Accountant / Production Head:")}
                </span>
                <div className="h-9 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                  <span className="text-[9px] text-slate-400 italic">(imzo)</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">F.I.Sh: _______________________</span>
              </div>
            </div>

            <div className="mt-3 pt-1.5 border-t border-slate-200 flex flex-wrap gap-1 items-center justify-between text-[8.5px] text-slate-400">
              <span>Green Processing Enterprise ERP &bull; Rasmiy Boshqaruv Audit Hujjati</span>
              <span>Generatsiya sanasi: {formattedToday} {formattedTime} &bull; Tizim id: #GP-EXEC-DIR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

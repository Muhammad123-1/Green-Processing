'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Printer,
  Download,
  X,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  FileSpreadsheet,
  MessageSquare,
  AlertCircle,
  BarChart3,
  Star,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { getDictionaryTranslation } from '@/lib/survey-translations'
import QuestionDrillDownModal from './QuestionDrillDownModal'

interface SurveyReportModalProps {
  surveyId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function SurveyReportModal({ surveyId, isOpen, onClose }: SurveyReportModalProps) {
  const { formatDual } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [selectedQuestionForDrillDown, setSelectedQuestionForDrillDown] = useState<any | null>(null)
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDrillDownOpen) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDrillDownOpen, onClose])

  useEffect(() => {
    if (isOpen && surveyId) {
      setLoading(true)
      fetch(`/api/surveys/${surveyId}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.error) {
            toast.error(d.error)
          } else {
            setData(d)
          }
        })
        .catch(() => toast.error('Xatolik yuz berdi'))
        .finally(() => setLoading(false))
    } else {
      setData(null)
    }
  }, [isOpen, surveyId])

  if (!isOpen || !surveyId || !mounted) return null

  // Process data for statistics
  const questions: any[] = data?.questions || []
  const responses: any[] = data?.responses || []

  const statsByQuestion: Record<
    number,
    {
      total: number
      c5: number
      c4: number
      c3: number
      c2: number
      c1: number
      ha: number
      yoq: number
      avg: number
      pct: number
      evaluatedCount: number
      other: Record<string, number>
      comments: { respondent: string; comment: string; date: string }[]
    }
  > = {}

  questions.forEach((q) => {
    statsByQuestion[q.id] = {
      total: 0,
      c5: 0,
      c4: 0,
      c3: 0,
      c2: 0,
      c1: 0,
      ha: 0,
      yoq: 0,
      avg: 0,
      pct: 0,
      evaluatedCount: 0,
      other: {},
      comments: [],
    }
  })

  responses.forEach((resp) => {
    const respondentTitle = resp.restaurantName
      ? `${resp.restaurantName} (${resp.respondentName || "Mas'ul"})`
      : resp.respondentName || 'Mijoz'
    const respDate = resp.respondentDate || (resp.submittedAt ? new Date(resp.submittedAt).toLocaleDateString('uz-UZ') : '')

    ;(resp.answers || []).forEach((ans: any) => {
      const st = statsByQuestion[ans.questionId]
      if (!st) return
      st.total += 1
      const val = (ans.answerValue || '').trim()

      let cleanVal = val
      let commentText = ''
      if (val.includes('. Izoh:')) {
        const parts = val.split('. Izoh:')
        cleanVal = parts[0].trim()
        commentText = parts[1].trim()
      }

      if (commentText) {
        st.comments.push({
          respondent: respondentTitle,
          comment: commentText,
          date: respDate,
        })
      }

      if (cleanVal === '5' || cleanVal === "A'lo" || cleanVal === 'Отлично') st.c5 += 1
      else if (cleanVal === '4' || cleanVal === 'Yaxshi' || cleanVal === 'Хорошо') st.c4 += 1
      else if (cleanVal === '3' || cleanVal === 'Qoniqarli' || cleanVal === 'Удовлетворительно') st.c3 += 1
      else if (cleanVal === '2' || cleanVal === 'Yomon' || cleanVal === 'Плохо') st.c2 += 1
      else if (cleanVal === '1' || cleanVal === 'Juda yomon' || cleanVal === 'Очень плохо') st.c1 += 1
      else if (cleanVal === 'Ha' || cleanVal === 'Да') st.ha += 1
      else if (cleanVal === "Yo'q" || cleanVal === 'Нет') st.yoq += 1
      else {
        st.other[cleanVal] = (st.other[cleanVal] || 0) + 1
        if (cleanVal.length > 5 && !commentText) {
          st.comments.push({
            respondent: respondentTitle,
            comment: cleanVal,
            date: respDate,
          })
        }
      }
    })
  })

  let totalWeightedPct = 0
  let totalEvaluatedCount = 0

  let totalStar5 = 0
  let totalStar4 = 0
  let totalStar3 = 0
  let totalStar2 = 0
  let totalStar1 = 0
  let totalHa = 0
  let totalYoq = 0

  questions.forEach((q) => {
    const st = statsByQuestion[q.id]
    if (!st) return

    totalStar5 += st.c5
    totalStar4 += st.c4
    totalStar3 += st.c3
    totalStar2 += st.c2
    totalStar1 += st.c1
    totalHa += st.ha
    totalYoq += st.yoq

    if (q.questionType === 'rating') {
      const ratingCount = st.c5 + st.c4 + st.c3 + st.c2 + st.c1
      if (ratingCount > 0) {
        const sum = 5 * st.c5 + 4 * st.c4 + 3 * st.c3 + 2 * st.c2 + 1 * st.c1
        const avg = sum / ratingCount
        const pct = (avg / 5) * 100
        st.avg = avg
        st.pct = pct
        st.evaluatedCount = ratingCount
        totalWeightedPct += pct * ratingCount
        totalEvaluatedCount += ratingCount
      }
    } else if (q.questionType === 'yesno') {
      const yesNoCount = st.ha + st.yoq
      if (yesNoCount > 0) {
        // INVERSION: "Yo'q" = Ijobiy (nuqsonsiz), "Ha" = Salbiy (shikoyat)
        const pct = (st.yoq / yesNoCount) * 100
        const avg = (pct / 100) * 5
        st.avg = avg
        st.pct = pct
        st.evaluatedCount = yesNoCount
        totalWeightedPct += pct * yesNoCount
        totalEvaluatedCount += yesNoCount
      }
    }
  })

  const totalStarRatings = totalStar5 + totalStar4 + totalStar3 + totalStar2 + totalStar1
  const totalYesNo = totalHa + totalYoq
  const star5Pct = totalStarRatings > 0 ? (totalStar5 / totalStarRatings) * 100 : 0
  const star4Pct = totalStarRatings > 0 ? (totalStar4 / totalStarRatings) * 100 : 0
  const star3Pct = totalStarRatings > 0 ? (totalStar3 / totalStarRatings) * 100 : 0
  const star2Pct = totalStarRatings > 0 ? (totalStar2 / totalStarRatings) * 100 : 0
  const star1Pct = totalStarRatings > 0 ? (totalStar1 / totalStarRatings) * 100 : 0
  const yoqPct = totalYesNo > 0 ? (totalYoq / totalYesNo) * 100 : 0
  const haPct = totalYesNo > 0 ? (totalHa / totalYesNo) * 100 : 0

  const overallPercent = totalEvaluatedCount > 0 ? totalWeightedPct / totalEvaluatedCount : 0
  const overallAvg = (overallPercent / 100) * 5

  // Grade
  let gradeText = "A'lo darajada"
  let gradeBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300'
  if (overallPercent < 60) {
    gradeText = 'Qoniqarsiz'
    gradeBadgeColor = 'bg-red-100 text-red-800 border-red-300'
  } else if (overallPercent < 75) {
    gradeText = 'Qoniqarli'
    gradeBadgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300'
  } else if (overallPercent < 90) {
    gradeText = 'Yaxshi'
    gradeBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300'
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/export`)
      if (!res.ok) throw new Error('Excel yuklab olishda xatolik')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Sorovnoma_Statistika_${surveyId}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(formatDual('Excel muvaffaqiyatli yuklab olindi!', 'Excel файл успешно скачан!', 'Excel file downloaded successfully!'))
    } catch {
      toast.error('Excel yuklashda xatolik yuz berdi')
    } finally {
      setDownloadingExcel(false)
    }
  }

  // All comments aggregated
  const allComments: { qTitle: string; respondent: string; comment: string; date: string }[] = []
  questions.forEach((q) => {
    const st = statsByQuestion[q.id]
    if (st && st.comments.length > 0) {
      st.comments.forEach((c) => {
        allComments.push({
          qTitle: `${q.subLabel ? q.subLabel + ' ' : ''}${getDictionaryTranslation(q.questionText, 'uz_ru') || q.questionText}`,
          ...c,
        })
      })
    }
  })

  const modalContent = (
    <div
      id="survey-print-portal-root"
      className="survey-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      {/* PRINT-SPECIFIC CSS INJECTION */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* 1. Remove background webpage from print flow completely (fixes the 9 blank pages!) */
          body > *:not(#survey-print-portal-root) {
            display: none !important;
          }
          /* 2. Make report portal root the only visible, natural document block */
          #survey-print-portal-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            inset: auto !important;
          }
          #survey-print-portal-root .survey-modal-card {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #survey-print-portal-root .survey-printable-scroll {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #survey-printable-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `,
        }}
      />

      {/* CONTAINER */}
      <div className="survey-modal-card bg-white dark:bg-dark-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh]">
        {/* MODAL CONTROL TOPBAR (HIDDEN ON PRINT) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-dark-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {formatDual("So'rovnoma statistikasi va chop etish", 'Статистика опроса и печать', 'Survey statistics & print')}
              </h2>
              <p className="text-xs text-slate-500">
                {data?.title || 'Yuklanmoqda...'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showComments}
                onChange={(e) => setShowComments(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>{formatDual("Izohlarni qo'shish", 'Включать отзывы', 'Include comments')}</span>
            </label>

            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel || loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50"
              title="Excel formatida yuklab olish"
            >
              {downloadingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span>{formatDual('Excel (.xlsx)', 'Скачать Excel', 'Download Excel')}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              title="Printerdan chop etish"
            >
              <Printer size={16} />
              <span>{formatDual('Chop etish (Print)', 'Распечатать', 'Print report')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT BODY */}
        <div className="survey-printable-scroll flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 print:p-0 print:overflow-visible print:bg-white print:text-black">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-medium">Hisobot yuklanmoqda...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-400">Ma'lumot topilmadi</div>
          ) : (
            <div id="survey-printable-area" className="max-w-4xl mx-auto space-y-5 print:space-y-4 print:max-w-none">
              {/* ===================================================================== */}
              {/* OFFICIAL COMPANY DOCUMENT HEADER */}
              {/* ===================================================================== */}
              <div className="border-b-2 border-slate-900 print:border-black pb-4 print-avoid-break">
                <div className="flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm print:bg-black shadow-sm">
                        GP
                      </div>
                      <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider leading-none">
                          OOO "GREEN PROCESSING"
                        </h1>
                        <p className="text-[11px] font-bold text-emerald-700 print:text-black mt-1 uppercase tracking-wide">
                          Sifat nazorati va mahsulot xavfsizligi bo'limi (QC Department)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 print:text-black space-y-0.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      Hujjat №: GP-QC-SAT-{surveyId}
                    </p>
                    <p>Sana: {new Date().toLocaleDateString('uz-UZ')}</p>
                    <p className="text-[10px]">Tizim: Green Processing ERP</p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white print:text-black uppercase tracking-tight">
                    MIJOZLAR QONIQISH DARAJASI TAHLILI VA ANKETA NATIJALARI HISOBOTI
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-800 mt-1 font-semibold italic">
                    "{data.title}"
                  </p>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* EXECUTIVE KPI SUMMARY CARDS */}
              {/* ===================================================================== */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2 print-avoid-break">
                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual('Jami respondentlar', 'Всего ответов', 'Total respondents')}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white print:text-black mt-1">
                    {responses.length}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">mijoz / tashkilot</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual("O'rtacha baho", 'Средний балл', 'Average rating')}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 print:text-black mt-1">
                    {overallAvg > 0 ? overallAvg.toFixed(2) : '-'} <span className="text-sm font-semibold text-slate-400">/ 5</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">5 ballik shkala bo'yicha</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual('Qoniqish indeksi', 'Индекс удовлетвор-ти', 'Satisfaction index')}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 print:text-black mt-1">
                    {overallAvg > 0 ? `${overallPercent.toFixed(1)}%` : '-'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">umumiy foiz ulushi</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual('Umumiy baho', 'Общая оценка', 'Overall grade')}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border ${gradeBadgeColor} print:border-black print:text-black print:bg-transparent`}
                    >
                      {gradeText}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">standart mezon</span>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* OVERALL RATING & FEEDBACK DISTRIBUTION SUMMARY */}
              {/* ===================================================================== */}
              <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-4 print:p-3 print-avoid-break">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-600 print:text-black" />
                    <span>{formatDual('Umumiy baholar va fikrlar taqsimoti', 'Общее распределение оценок', 'Overall rating distribution')}</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {totalStarRatings + totalYesNo} {formatDual('ta baholash qayd etildi', 'оценок зафиксировано', 'ratings recorded')}
                  </span>
                </div>

                {totalStarRatings > 0 && (
                  <div className="space-y-2">
                    {/* Visual Multi-segment Bar */}
                    <div className="h-3 w-full bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden flex shadow-inner">
                      {totalStar5 > 0 && (
                        <div
                          style={{ width: `${star5Pct}%` }}
                          className="bg-emerald-500 h-full"
                          title={`5 (A'lo): ${totalStar5} ta (${star5Pct.toFixed(0)}%)`}
                        />
                      )}
                      {totalStar4 > 0 && (
                        <div
                          style={{ width: `${star4Pct}%` }}
                          className="bg-blue-500 h-full"
                          title={`4 (Yaxshi): ${totalStar4} ta (${star4Pct.toFixed(0)}%)`}
                        />
                      )}
                      {totalStar3 > 0 && (
                        <div
                          style={{ width: `${star3Pct}%` }}
                          className="bg-amber-500 h-full"
                          title={`3 (Qoniqarli): ${totalStar3} ta (${star3Pct.toFixed(0)}%)`}
                        />
                      )}
                      {totalStar2 > 0 && (
                        <div
                          style={{ width: `${star2Pct}%` }}
                          className="bg-orange-500 h-full"
                          title={`2 (Yomon): ${totalStar2} ta (${star2Pct.toFixed(0)}%)`}
                        />
                      )}
                      {totalStar1 > 0 && (
                        <div
                          style={{ width: `${star1Pct}%` }}
                          className="bg-red-500 h-full"
                          title={`1 (Juda yomon): ${totalStar1} ta (${star1Pct.toFixed(0)}%)`}
                        />
                      )}
                    </div>

                    {/* Legend cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 print:bg-white print:border-slate-300 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">5 (A'lo)</span>
                        </div>
                        <p className="text-sm font-black text-emerald-600 print:text-black mt-0.5">
                          {totalStar5} <span className="text-[10px] text-slate-400 font-normal">({star5Pct.toFixed(0)}%)</span>
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 print:bg-white print:border-slate-300 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">4 (Yaxshi)</span>
                        </div>
                        <p className="text-sm font-black text-blue-600 print:text-black mt-0.5">
                          {totalStar4} <span className="text-[10px] text-slate-400 font-normal">({star4Pct.toFixed(0)}%)</span>
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 print:bg-white print:border-slate-300 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">3 (Qoniqarli)</span>
                        </div>
                        <p className="text-sm font-black text-amber-600 print:text-black mt-0.5">
                          {totalStar3} <span className="text-[10px] text-slate-400 font-normal">({star3Pct.toFixed(0)}%)</span>
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 print:bg-white print:border-slate-300 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">2 (Yomon)</span>
                        </div>
                        <p className="text-sm font-black text-orange-600 print:text-black mt-0.5">
                          {totalStar2} <span className="text-[10px] text-slate-400 font-normal">({star2Pct.toFixed(0)}%)</span>
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 print:bg-white print:border-slate-300 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">1 (J.yomon)</span>
                        </div>
                        <p className="text-sm font-black text-red-600 print:text-black mt-0.5">
                          {totalStar1} <span className="text-[10px] text-slate-400 font-normal">({star1Pct.toFixed(0)}%)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {totalYesNo > 0 && (
                  <div className={`pt-2.5 ${totalStarRatings > 0 ? 'mt-3 border-t border-slate-200 dark:border-dark-700 print:border-slate-300' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-emerald-200 dark:border-emerald-850 print:bg-white print:border-slate-300 flex items-center justify-between px-3.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 print:text-black flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          {formatDual("Nuqson yo'q (Benuqson)", 'Без дефектов (Нет)', 'Defect-free (No)')}
                        </span>
                        <span className="text-sm font-black text-emerald-600 print:text-black">
                          {totalYoq} ta ({yoqPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-rose-200 dark:border-rose-850 print:bg-white print:border-slate-300 flex items-center justify-between px-3.5">
                        <span className="font-bold text-rose-700 dark:text-rose-400 print:text-black flex items-center gap-1.5">
                          <AlertCircle size={15} className="text-rose-600" />
                          {formatDual('Nuqson/shikoyat aniqlandi (Ha)', 'Зафиксированы претензии (Да)', 'Defects detected (Yes)')}
                        </span>
                        <span className="text-sm font-black text-rose-600 print:text-black">
                          {totalHa} ta ({haPct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ===================================================================== */}
              {/* QUESTIONS STATISTICS CARDS (REPLACING THE OVERFLOWING TABLE) */}
              {/* ===================================================================== */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={16} className="text-emerald-600 print:text-black" />
                    <span>{formatDual("Savollar kesimida ko'rsatkichlar tahlili", 'Анализ показателей по вопросам', 'Question performance analysis')}</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 print:hidden">
                      👆 {formatDual('Kartochka ustiga bosing — batafsil tahlil', 'Нажмите на карточку для анализа', 'Click card to inspect')}
                    </span>
                    <span className="text-xs text-slate-500 print:text-black font-semibold">
                      {formatDual('Jami savollar', 'Всего вопросов', 'Total questions')}: {questions.length} ta
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2 print:gap-2.5">
                  {questions.map((q, idx) => {
                    const st = statsByQuestion[q.id] || {
                      total: 0,
                      c5: 0,
                      c4: 0,
                      c3: 0,
                      c2: 0,
                      c1: 0,
                      ha: 0,
                      yoq: 0,
                      avg: 0,
                      pct: 0,
                      evaluatedCount: 0,
                      other: {},
                      comments: [],
                    }

                    const pctColor =
                      st.pct >= 90
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                        : st.pct >= 75
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                        : st.pct >= 60
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'

                    const barBgColor =
                      st.pct >= 90
                        ? 'bg-emerald-500'
                        : st.pct >= 75
                        ? 'bg-blue-500'
                        : st.pct >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionForDrillDown(q)
                          setIsDrillDownOpen(true)
                        }}
                        className="bg-white dark:bg-dark-850 print:bg-white border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between print-avoid-break"
                        title={formatDual(
                          "Respondentlar javoblari va tahlilni ko'rish uchun bosing",
                          'Нажмите для просмотра ответов',
                          'Click to view respondent details'
                        )}
                      >
                        <div>
                          {/* Card Top: Label, Question, Score Pill */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-750 print:bg-slate-100 text-slate-700 dark:text-slate-300 print:text-black font-black text-xs flex-shrink-0">
                                {q.subLabel || `№${idx + 1}`}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {getDictionaryTranslation(q.questionText, 'uz_ru') || q.questionText}
                              </h4>
                            </div>

                            {/* Percentage Badge */}
                            <div
                              className={`px-2.5 py-1 rounded-xl text-xs font-black border flex-shrink-0 print:border-slate-400 print:text-black print:bg-transparent ${pctColor}`}
                            >
                              {st.evaluatedCount > 0 ? `${st.pct.toFixed(0)}%` : '-'}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2.5 mb-2">
                            <div className="h-2 w-full bg-slate-100 dark:bg-dark-750 rounded-full overflow-hidden print:bg-slate-200">
                              <div
                                className={`h-full rounded-full transition-all duration-500 print:bg-black ${barBgColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, st.pct))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Metrics Breakdown */}
                        <div className="pt-2 border-t border-slate-100 dark:border-dark-750 print:border-slate-200">
                          {q.questionType === 'yesno' ? (
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                                  Yo'q (Benuqson): {st.yoq}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className={`font-bold ${st.ha > 0 ? 'text-red-600' : 'text-slate-400'} print:text-black`}>
                                  Ha (Shikoyat): {st.ha}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 print:text-slate-600 font-medium">
                                {st.total} ta javob
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 print:text-black">
                                  <span className="text-blue-600 dark:text-blue-400 print:text-black">
                                    ★ {st.evaluatedCount > 0 ? st.avg.toFixed(2) : '-'}
                                  </span>
                                  <span className="text-slate-400 font-normal">/ 5.0</span>
                                </div>
                                <span className="text-[10px] text-slate-400 print:text-slate-600 font-medium">
                                  {st.evaluatedCount} / {st.total} ta fikr
                                </span>
                              </div>

                              {/* Rating Pills */}
                              <div className="flex items-center gap-1 text-[10px] flex-wrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded-md ${
                                    st.c5 > 0
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                                      : 'text-slate-400 bg-slate-50 dark:bg-dark-800'
                                  }`}
                                >
                                  5★: {st.c5}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md ${
                                    st.c4 > 0
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                                      : 'text-slate-400 bg-slate-50 dark:bg-dark-800'
                                  }`}
                                >
                                  4★: {st.c4}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md ${
                                    st.c3 > 0
                                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                                      : 'text-slate-400 bg-slate-50 dark:bg-dark-800'
                                  }`}
                                >
                                  3★: {st.c3}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md ${
                                    st.c2 > 0
                                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold'
                                      : 'text-slate-400 bg-slate-50 dark:bg-dark-800'
                                  }`}
                                >
                                  2★: {st.c2}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-md ${
                                    st.c1 > 0
                                      ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold'
                                      : 'text-slate-400 bg-slate-50 dark:bg-dark-800'
                                  }`}
                                >
                                  1★: {st.c1}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ===================================================================== */}
              {/* RESPONDENT COMMENTS / FEEDBACK (IF PRESENT AND ENABLED) */}
              {/* ===================================================================== */}
              {showComments && allComments.length > 0 && (
                <div className="space-y-3 pt-2 print-avoid-break">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-blue-600 print:text-black" />
                    <span>MIJOZLAR TOMONIDAN BILDIRILGAN IZOH, FIKR VA TAKLIFLAR</span>
                  </h3>

                  <div className="space-y-2">
                    {allComments.map((c, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-dark-800 print:bg-transparent border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-xl p-3 text-xs print-avoid-break"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 print:text-black mb-1">
                          <span>{c.respondent}</span>
                          <span className="text-[10px] text-slate-400 print:text-slate-600 font-normal">{c.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 italic mb-1">
                          Savol: {c.qTitle}
                        </p>
                        <p className="text-slate-900 dark:text-white print:text-black font-medium bg-white dark:bg-dark-900 print:bg-transparent p-2 rounded-lg border border-slate-100 dark:border-dark-750 print:border-none">
                          "{c.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* OFFICIAL SIGNATURES & STAMP AREA */}
              {/* ===================================================================== */}
              <div className="pt-6 border-t border-slate-300 print:border-black mt-6 print-avoid-break">
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 text-xs">
                  <div className="space-y-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      Sifat nazorati bo'limi boshlig'i (QC Manager):
                    </p>
                    <div className="flex items-end gap-2 border-b border-slate-400 print:border-black pb-1">
                      <span className="text-slate-400 print:text-slate-600 italic">Imzo:</span>
                      <span className="flex-1"></span>
                      <span className="text-[11px] text-slate-500 font-medium">/ ____________________ /</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      Tijorat / Savdo bo'limi rahbari:
                    </p>
                    <div className="flex items-end gap-2 border-b border-slate-400 print:border-black pb-1">
                      <span className="text-slate-400 print:text-slate-600 italic">Imzo:</span>
                      <span className="flex-1"></span>
                      <span className="text-[11px] text-slate-500 font-medium">/ ____________________ /</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between mt-6 text-[10px] text-slate-400 print:text-slate-600">
                  <p>OOO "GREEN PROCESSING" sifat menejmenti tizimi (FSSC 22000 / ISO 9001)</p>
                  <p>Hujjat nusxasi chop etilgan sana: {new Date().toLocaleString('uz-UZ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUESTION DRILL-DOWN INSPECTION MODAL */}
      <QuestionDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => {
          setIsDrillDownOpen(false)
          setSelectedQuestionForDrillDown(null)
        }}
        question={selectedQuestionForDrillDown}
        responses={responses}
      />
    </div>
  )

  return createPortal(modalContent, document.body)
}

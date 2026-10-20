'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Printer, Download, X, Loader2, CheckCircle2, TrendingUp, Users, Award, FileSpreadsheet, MessageSquare, AlertCircle, Search, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
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

  if (!isOpen || !surveyId) return null

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
      ? `${resp.restaurantName} (${resp.respondentName || 'Mas\'ul'})`
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

  questions.forEach((q) => {
    const st = statsByQuestion[q.id]
    if (!st) return

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
        // INVERSION FIX:
        // "Yo'q" = POSITIVE (benuqson, shikoyatsiz) -> umumiy foiz ko'tariladi!
        // "Ha" = NEGATIVE (nuqson topildi, shikoyat) -> umumiy foiz tushadi!
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
          qTitle: `${q.subLabel ? q.subLabel + ' ' : ''}${q.questionText}`,
          ...c,
        })
      })
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Container - on print this becomes full document */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh] print-only-container">
        
        {/* MODAL CONTROL TOPBAR (HIDDEN ON PRINT) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 dark:border-dark-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-dark-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {formatDual("So'rovnoma statistikasi va chop etish", "Статистика опроса и печать", "Survey statistics & print")}
              </h2>
              <p className="text-xs text-slate-500">
                {data?.title || 'Yuklanmoqda...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showComments}
                onChange={(e) => setShowComments(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>{formatDual("Izohlarni qo'shish", "Включать отзывы", "Include comments")}</span>
            </label>

            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel || loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50"
              title="Excel formatida yuklab olish"
            >
              {downloadingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span>{formatDual("Excel (.xlsx)", "Скачать Excel", "Download Excel")}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              title="Printerdan chop etish"
            >
              <Printer size={16} />
              <span>{formatDual("Chop etish (Print)", "Распечатать", "Print report")}</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 print:p-0 print:overflow-visible print:bg-white print:text-black">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-medium">Hisobot yuklanmoqda...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-400">Ma'lumot topilmadi</div>
          ) : (
            <div id="survey-printable-area" className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:max-w-none">
              
              {/* ===================================================================== */}
              {/* OFFICIAL COMPANY DOCUMENT HEADER */}
              {/* ===================================================================== */}
              <div className="border-b-2 border-slate-900 print:border-black pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm print:bg-black">
                        GP
                      </div>
                      <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider leading-none">
                          OOO "GREEN PROCESSING"
                        </h1>
                        <p className="text-[11px] font-bold text-emerald-700 print:text-black mt-0.5 uppercase tracking-wide">
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
                  <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-800 mt-1 font-medium italic">
                    "{data.title}"
                  </p>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* EXECUTIVE KPI SUMMARY CARDS */}
              {/* ===================================================================== */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual("Jami respondentlar", "Всего ответов", "Total respondents")}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white print:text-black mt-1">
                    {responses.length}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">mijoz / tashkilot</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual("O'rtacha baho", "Средний балл", "Average rating")}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 print:text-black mt-1">
                    {overallAvg > 0 ? overallAvg.toFixed(2) : '-'} <span className="text-sm font-semibold text-slate-400">/ 5</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">5 ballik shkala bo'yicha</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual("Qoniqish indeksi", "Индекс удовлетвор-ти", "Satisfaction index")}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 print:text-black mt-1">
                    {overallAvg > 0 ? `${overallPercent.toFixed(1)}%` : '-'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">umumiy foiz ulushi</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-800 print:bg-slate-50 border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-2xl p-3.5 print:p-2.5 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual("Umumiy baho", "Общая оценка", "Overall grade")}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border ${gradeBadgeColor} print:border-black print:text-black print:bg-transparent`}>
                      {gradeText}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">standart mezon</span>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* QUESTIONS & RESULTS TABLE */}
              {/* ===================================================================== */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={16} className="text-emerald-600 print:text-black" />
                    <span>SAVOLLAR BO'YICHA TAHLILIY STATISTIKA JADVALI</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 print:hidden">
                      👆 {formatDual("Savol ustiga bosing — batafsil tahlil", "Нажмите на вопрос для анализа", "Click question to inspect")}
                    </span>
                    <span className="text-xs text-slate-500 print:text-black font-semibold">
                      Jami savollar: {questions.length} ta
                    </span>
                  </div>
                </div>

                <div className="border border-slate-300 dark:border-dark-700 print:border-slate-400 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white print:bg-slate-100 print:text-black font-bold border-b border-slate-300 print:border-black">
                        <th className="p-2 sm:p-2.5 text-center w-8 border-r border-slate-700 print:border-slate-300">№</th>
                        <th className="p-2 sm:p-2.5 border-r border-slate-700 print:border-slate-300">Baholash mezoni (Savol matni)</th>
                        <th className="p-2 sm:p-2.5 text-center w-12 border-r border-slate-700 print:border-slate-300">5 (A'lo)</th>
                        <th className="p-2 sm:p-2.5 text-center w-12 border-r border-slate-700 print:border-slate-300">4 (Yaxshi)</th>
                        <th className="p-2 sm:p-2.5 text-center w-12 border-r border-slate-700 print:border-slate-300">3 (Qoniq.)</th>
                        <th className="p-2 sm:p-2.5 text-center w-12 border-r border-slate-700 print:border-slate-300">2 (Yomon)</th>
                        <th className="p-2 sm:p-2.5 text-center w-12 border-r border-slate-700 print:border-slate-300">1 (J.yom.)</th>
                        <th className="p-2 sm:p-2.5 text-center w-24 border-r border-slate-700 print:border-slate-300">Yo'q / Ha</th>
                        <th className="p-2 sm:p-2.5 text-center w-14 border-r border-slate-700 print:border-slate-300">Jami</th>
                        <th className="p-2 sm:p-2.5 text-center w-16 border-r border-slate-700 print:border-slate-300">O'rtacha</th>
                        <th className="p-2 sm:p-2.5 text-center w-16">Qoniqish %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-700 print:divide-slate-300">
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

                        return (
                          <tr
                            key={q.id}
                            onClick={() => {
                              setSelectedQuestionForDrillDown(q)
                              setIsDrillDownOpen(true)
                            }}
                            title={formatDual(
                              "Respondentlar javoblari va ijobiy/salbiy tahlilni ko'rish uchun bosing",
                              "Нажмите для просмотра ответов респондентов",
                              "Click to inspect respondent answers"
                            )}
                            className={`cursor-pointer hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 print:hover:bg-transparent transition-all group ${
                              idx % 2 === 0 ? 'bg-white dark:bg-dark-900' : 'bg-slate-50/60 dark:bg-dark-800/40 print:bg-slate-50/30'
                            }`}
                          >
                            <td className="p-2 sm:p-2.5 text-center font-bold text-slate-500 dark:text-slate-400 print:text-black border-r border-slate-200 dark:border-dark-700 print:border-slate-300">
                              {q.subLabel || idx + 1}
                            </td>
                            <td className="p-2 sm:p-2.5 font-medium text-slate-800 dark:text-slate-200 print:text-black border-r border-slate-200 dark:border-dark-700 print:border-slate-300 leading-snug">
                              <div className="flex items-center justify-between gap-2">
                                <span className="group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {q.questionText}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 opacity-80 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0">
                                  <Users size={10} />
                                  <span>{formatDual("Tahlil", "Анализ", "Inspect")}</span>
                                </span>
                              </div>
                            </td>
                            <td className={`p-2 sm:p-2.5 text-center font-bold border-r border-slate-200 dark:border-dark-700 print:border-slate-300 ${st.c5 > 0 ? 'text-emerald-600 print:text-black' : 'text-slate-400'}`}>
                              {st.c5 || '-'}
                            </td>
                            <td className={`p-2 sm:p-2.5 text-center font-bold border-r border-slate-200 dark:border-dark-700 print:border-slate-300 ${st.c4 > 0 ? 'text-blue-600 print:text-black' : 'text-slate-400'}`}>
                              {st.c4 || '-'}
                            </td>
                            <td className={`p-2 sm:p-2.5 text-center font-bold border-r border-slate-200 dark:border-dark-700 print:border-slate-300 ${st.c3 > 0 ? 'text-amber-600 print:text-black' : 'text-slate-400'}`}>
                              {st.c3 || '-'}
                            </td>
                            <td className={`p-2 sm:p-2.5 text-center font-bold border-r border-slate-200 dark:border-dark-700 print:border-slate-300 ${st.c2 > 0 ? 'text-orange-600 print:text-black' : 'text-slate-400'}`}>
                              {st.c2 || '-'}
                            </td>
                            <td className={`p-2 sm:p-2.5 text-center font-bold border-r border-slate-200 dark:border-dark-700 print:border-slate-300 ${st.c1 > 0 ? 'text-red-600 print:text-black' : 'text-slate-400'}`}>
                              {st.c1 || '-'}
                            </td>
                            <td className="p-2 sm:p-2.5 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-dark-700 print:border-slate-300">
                              {q.questionType === 'yesno' ? (
                                <span>
                                  <span className="text-emerald-600 font-bold print:text-black">Yo'q: {st.yoq}</span>
                                  {' / '}
                                  <span className={`${st.ha > 0 ? 'text-red-600 font-black' : 'text-slate-400'} print:text-black`}>
                                    Ha: {st.ha}
                                  </span>
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-2 sm:p-2.5 text-center font-bold text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-dark-700 print:border-slate-300">
                              {st.total}
                            </td>
                            <td className="p-2 sm:p-2.5 text-center font-black text-slate-900 dark:text-white print:text-black border-r border-slate-200 dark:border-dark-700 print:border-slate-300">
                              {st.evaluatedCount > 0 ? st.avg.toFixed(2) : '-'}
                            </td>
                            <td className="p-2 sm:p-2.5 text-center font-black print:text-black">
                              {st.evaluatedCount > 0 ? (
                                <span
                                  className={
                                    st.pct >= 90
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : st.pct >= 75
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : st.pct >= 60
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-red-600 dark:text-red-400'
                                  }
                                >
                                  {st.pct.toFixed(0)}%
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/40 print:bg-slate-100 font-black border-t-2 border-emerald-600 print:border-black text-slate-900 dark:text-white print:text-black">
                        <td colSpan={8} className="p-2.5 text-right uppercase tracking-wider text-xs border-r border-emerald-200 dark:border-dark-700 print:border-slate-300">
                          UMUMIY YAKUNIY O'RTACHA KO'RSATKICH:
                        </td>
                        <td className="p-2.5 text-center border-r border-emerald-200 dark:border-dark-700 print:border-slate-300">
                          {responses.length}
                        </td>
                        <td className="p-2.5 text-center text-sm text-blue-700 dark:text-blue-300 print:text-black border-r border-emerald-200 dark:border-dark-700 print:border-slate-300">
                          {overallAvg > 0 ? overallAvg.toFixed(2) : '-'}
                        </td>
                        <td className="p-2.5 text-center text-sm text-emerald-700 dark:text-emerald-300 print:text-black">
                          {overallAvg > 0 ? `${overallPercent.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* RESPONDENT COMMENTS / FEEDBACK (IF PRESENT AND ENABLED) */}
              {/* ===================================================================== */}
              {showComments && allComments.length > 0 && (
                <div className="space-y-3 pt-2 page-break-inside-avoid">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-blue-600 print:text-black" />
                    <span>MIJOZLAR TOMONIDAN BILDIRILGAN IZOH, FIKR VA TAKLIFLAR</span>
                  </h3>

                  <div className="space-y-2">
                    {allComments.map((c, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-dark-800 print:bg-transparent border border-slate-200 dark:border-dark-700 print:border-slate-300 rounded-xl p-3 text-xs"
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
              <div className="pt-6 border-t border-slate-300 print:border-black mt-8 page-break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 text-xs">
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

                <div className="flex items-center justify-between mt-6 text-[10px] text-slate-400 print:text-slate-600">
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
}

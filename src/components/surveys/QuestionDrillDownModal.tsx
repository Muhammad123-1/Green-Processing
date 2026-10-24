'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Columns,
  ListFilter,
  Copy,
  Check,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export interface QuestionDrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  question: {
    id: number
    questionText: string
    questionType: string
    subLabel?: string | null
    groupName?: string | null
    helpText?: string | null
    orderIndex?: number
  } | null
  responses: Array<{
    id: number
    restaurantName?: string | null
    respondentName?: string | null
    respondentDate?: string | null
    submittedAt?: string | null
    answers?: Array<{
      id?: number
      questionId: number
      answerValue: string
    }>
  }>
}

interface ClassifiedAnswer {
  responseId: number
  restaurantName: string
  respondentName: string
  date: string
  cleanVal: string
  comment: string
  rawAnswer: string
  isPositive: boolean
  isNegative: boolean
  score: number
  badgeLabel: string
  badgeColor: string
}

export default function QuestionDrillDownModal({
  isOpen,
  onClose,
  question,
  responses,
}: QuestionDrillDownModalProps) {
  const { formatDual } = useLanguage()
  const [activeTab, setActiveTab] = useState<'all' | 'pos' | 'neg'>('all')
  const [selectedOptionFilter, setSelectedOptionFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'columns' | 'tabs'>('columns')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset state when question changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('all')
      setSelectedOptionFilter('ALL')
      setSearchQuery('')
    }
  }, [isOpen, question?.id])

  const qType = question?.questionType || 'rating'
  // Text va Variantli fikr savollarida ijobiy/salbiyga ajratilmaydi — faqat to'ldiruvchi fikri ko'rinadi
  const isOpinionQuestion = qType === 'text' || qType === 'select'

  // Process answers
  const { positiveList, negativeList, allList, stats, optionsBreakdown, opinionsCount, uniqueRestaurantsCount } = useMemo(() => {
    if (!question || !responses || responses.length === 0) {
      return {
        positiveList: [],
        negativeList: [],
        allList: [],
        stats: { total: 0, pos: 0, neg: 0, pct: 0, avg: 0 },
        optionsBreakdown: [] as { name: string; count: number }[],
        opinionsCount: 0,
        uniqueRestaurantsCount: 0,
      }
    }

    const pos: ClassifiedAnswer[] = []
    const neg: ClassifiedAnswer[] = []
    const all: ClassifiedAnswer[] = []
    const optCounts: Record<string, number> = {}
    const restaurantsSet = new Set<string>()
    let textOpinions = 0

    let sumScores = 0
    let countScores = 0

    responses.forEach((resp) => {
      const ans = (resp.answers || []).find((a) => a.questionId === question.id)
      if (!ans || ans.answerValue === undefined || ans.answerValue === null) return

      const raw = ans.answerValue.trim()
      if (!raw) return

      let cleanVal = raw
      let comment = ''

      if (raw.includes('. Izoh:')) {
        const parts = raw.split('. Izoh:')
        cleanVal = parts[0].trim()
        comment = parts.slice(1).join('. Izoh:').trim()
      } else if (raw.includes('Izoh:')) {
        const parts = raw.split('Izoh:')
        cleanVal = parts[0].trim()
        comment = parts.slice(1).join('Izoh:').trim()
      }

      const restName =
        resp.restaurantName?.trim() ||
        formatDual("Noma'lum restoran", 'Неизвестный ресторан', 'Unknown restaurant')
      const respName =
        resp.respondentName?.trim() ||
        formatDual('Mas\'ul xodim', 'Ответственный сотрудник', 'Responsible staff')
      const dateStr =
        resp.respondentDate ||
        (resp.submittedAt ? new Date(resp.submittedAt).toLocaleDateString('uz-UZ') : '-')

      restaurantsSet.add(restName)

      if (comment || (qType === 'text' && cleanVal)) {
        textOpinions++
      }

      if (cleanVal) {
        optCounts[cleanVal] = (optCounts[cleanVal] || 0) + 1
      }

      const norm = cleanVal.toLowerCase()

      let isPositive = false
      let isNegative = false
      let score = 5
      let badgeLabel = cleanVal
      let badgeColor =
        'bg-slate-100 text-slate-800 dark:bg-dark-800 dark:text-slate-200 border-slate-200 dark:border-dark-700'

      // AGAR SAVOL MATNLI YOKI VARIANTLI FIKR BO'LSA: Ijobiy/Salbiyga ajratilmaydi!
      if (isOpinionQuestion) {
        isPositive = false
        isNegative = false
        score = 0
        badgeLabel = qType === 'text' ? formatDual("Fikr-mulohaza", "Отзыв", "Feedback") : cleanVal
        badgeColor =
          'bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-200 border-slate-200 dark:border-dark-700'
      } else if (qType === 'yesno') {
        // Yo'q / Нет / No = POSITIVE (Zero complaints, flawless product)
        // Ha / Да / Yes = NEGATIVE (Defect / anomaly reported)
        if (
          norm === "yo'q" ||
          norm === 'yoq' ||
          norm === 'нет' ||
          norm === 'net' ||
          norm === 'no'
        ) {
          isPositive = true
          score = 5
          badgeLabel = formatDual(
            "Yo'q — Benuqson (E'tiroz yo'q)",
            'Нет — Без нареканий',
            'No — No defects'
          )
          badgeColor =
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        } else if (
          norm === 'ha' ||
          norm === 'да' ||
          norm === 'da' ||
          norm === 'yes'
        ) {
          isNegative = true
          score = 1
          badgeLabel = formatDual(
            "Ha — Nuqson aniqlandi (E'tiroz)",
            'Да — Обнаружен дефект',
            'Yes — Defect reported'
          )
          badgeColor =
            'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800'
        } else {
          // Fallback if other text
          isPositive = true
          score = 5
        }
        sumScores += score
        countScores += 1
      } else if (qType === 'rating' || ['1', '2', '3', '4', '5'].includes(cleanVal)) {
        if (cleanVal === '5' || norm === "a'lo" || norm === 'отлично') {
          isPositive = true
          score = 5
          badgeLabel = formatDual("5 — A'lo", '5 — Отлично', '5 — Excellent')
          badgeColor =
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        } else if (cleanVal === '4' || norm === 'yaxshi' || norm === 'хорошо') {
          isPositive = true
          score = 4
          badgeLabel = formatDual('4 — Yaxshi', '4 — Хорошо', '4 — Good')
          badgeColor =
            'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        } else if (
          cleanVal === '3' ||
          norm === 'qoniqarli' ||
          norm === 'удовлетворительно'
        ) {
          isNegative = true
          score = 3
          badgeLabel = formatDual(
            '3 — Qoniqarli (O\'rtacha)',
            '3 — Удовлетворительно',
            '3 — Satisfactory'
          )
          badgeColor =
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        } else if (cleanVal === '2' || norm === 'yomon' || norm === 'плохо') {
          isNegative = true
          score = 2
          badgeLabel = formatDual('2 — Yomon', '2 — Плохо', '2 — Poor')
          badgeColor =
            'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800'
        } else if (
          cleanVal === '1' ||
          norm === 'juda yomon' ||
          norm === 'очень плохо'
        ) {
          isNegative = true
          score = 1
          badgeLabel = formatDual('1 — Juda yomon', '1 — Очень плохо', '1 — Very poor')
          badgeColor =
            'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800'
        }
        sumScores += score
        countScores += 1
      }

      const item: ClassifiedAnswer = {
        responseId: resp.id,
        restaurantName: restName,
        respondentName: respName,
        date: dateStr,
        cleanVal,
        comment,
        rawAnswer: raw,
        isPositive,
        isNegative,
        score,
        badgeLabel,
        badgeColor,
      }

      all.push(item)
      if (isPositive) pos.push(item)
      if (isNegative) neg.push(item)
    })

    const total = all.length
    const posCount = pos.length
    const negCount = neg.length
    const pct = total > 0 ? (posCount / total) * 100 : 0
    const avg = countScores > 0 ? sumScores / countScores : 0

    const optionsList = Object.entries(optCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return {
      positiveList: pos,
      negativeList: neg,
      allList: all,
      stats: { total, pos: posCount, neg: negCount, pct, avg },
      optionsBreakdown: optionsList,
      opinionsCount: textOpinions,
      uniqueRestaurantsCount: restaurantsSet.size,
    }
  }, [question, responses, formatDual, isOpinionQuestion, qType])

  // Filter with live search and options
  const filterList = (list: ClassifiedAnswer[]) => {
    let result = list

    if (isOpinionQuestion && selectedOptionFilter !== 'ALL') {
      result = result.filter(item => item.cleanVal === selectedOptionFilter)
    }

    if (!searchQuery.trim()) return result
    const q = searchQuery.toLowerCase()
    return result.filter(
      (item) =>
        item.restaurantName.toLowerCase().includes(q) ||
        item.respondentName.toLowerCase().includes(q) ||
        item.cleanVal.toLowerCase().includes(q) ||
        item.comment.toLowerCase().includes(q)
    )
  }

  const filteredPositive = useMemo(() => filterList(positiveList), [positiveList, searchQuery, selectedOptionFilter, isOpinionQuestion])
  const filteredNegative = useMemo(() => filterList(negativeList), [negativeList, searchQuery, selectedOptionFilter, isOpinionQuestion])
  const filteredAll = useMemo(() => filterList(allList), [allList, searchQuery, selectedOptionFilter, isOpinionQuestion])

  const copyComment = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(formatDual('Fikr nusxalandi!', 'Отзыв скопирован!', 'Feedback copied!'))
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen || !question) return null

  const qNumber = question.subLabel || (question.orderIndex !== undefined ? `#${question.orderIndex + 1}` : '•')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-750 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ===================================================================== */}
        {/* MODAL HEADER */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-dark-800 bg-slate-50/90 dark:bg-dark-850">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 flex-shrink-0">
                {qNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {question.groupName && (
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide truncate">
                      {question.groupName}
                    </p>
                  )}
                  {isOpinionQuestion && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <MessageSquare size={10} />
                      {formatDual("To'ldiruvchilar Fikrlari", "Мнения респондентов", "Respondent Opinions")}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {question.questionText}
                </h3>
                {question.helpText && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                    ℹ️ {question.helpText}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-dark-750 dark:hover:text-white transition-all flex-shrink-0"
              title={formatDual('Yopish (Esc)', 'Закрыть (Esc)', 'Close (Esc)')}
            >
              <X size={20} />
            </button>
          </div>

          {/* KPI STATS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-dark-750">
            {/* Total respondents */}
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-3 border border-slate-200/80 dark:border-dark-700 text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {formatDual('Jami javoblar', 'Всего ответов', 'Total answers')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats.total} <span className="text-xs font-semibold text-slate-400">ta</span>
              </div>
            </div>

            {isOpinionQuestion ? (
              <>
                {/* Opinions count */}
                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-3 border border-blue-200 dark:border-blue-800/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <MessageSquare size={12} />
                    {formatDual('Fikr bildirganlar', 'Оставили мнение', 'Opinions given')}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {opinionsCount} <span className="text-xs font-semibold text-blue-600/70">ta</span>
                  </div>
                </div>

                {/* Clients count */}
                <div className="bg-slate-100/70 dark:bg-dark-800 rounded-2xl p-3 border border-slate-200 dark:border-dark-700 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <Building2 size={12} />
                    {formatDual('Mijozlar / Restoranlar', 'Клиенты / Рестораны', 'Clients / Venues')}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                    {uniqueRestaurantsCount} <span className="text-xs font-semibold text-slate-400">ta</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="bg-white dark:bg-dark-900 rounded-2xl p-3 border border-slate-200/80 dark:border-dark-700 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual('Tahlil turi', 'Тип анализа', 'Analysis type')}
                  </span>
                  <div className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200 mt-1">
                    {qType === 'text' ? formatDual("Erkin matn", "Свободный текст", "Open text") : formatDual("Variantli takliflar", "Варианты предложений", "Option feedback")}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Positive Count */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-3 border border-emerald-200 dark:border-emerald-800/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} />
                    {formatDual('Ijobiy javoblar', 'Положительные', 'Positive')}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {stats.pos} <span className="text-xs font-semibold text-emerald-600/70">ta ({stats.pct.toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Negative / Complaints Count */}
                <div className="bg-red-50/70 dark:bg-red-950/30 rounded-2xl p-3 border border-red-200 dark:border-red-800/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <AlertTriangle size={12} />
                    {formatDual('Salbiy / Shikoyatlar', 'Замечания', 'Defects / Issues')}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">
                    {stats.neg} <span className="text-xs font-semibold text-red-600/70">ta ({((stats.total > 0 ? stats.neg / stats.total : 0) * 100).toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Satisfaction Index */}
                <div className="bg-white dark:bg-dark-900 rounded-2xl p-3 border border-slate-200/80 dark:border-dark-700 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {formatDual('Qoniqish darajasi', 'Удовлетвор-ть', 'Satisfaction')}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {stats.pct.toFixed(1)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CONTROLS BAR: SEARCH & TABS */}
        {/* ===================================================================== */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 flex flex-wrap items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={formatDual(
                'Restoran, ism yoki fikr bo\'yicha qidirish...',
                'Поиск по ресторану, имени или отзыву...',
                'Search by restaurant, name or opinion...'
              )}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* OPINION QUESTION: OPTION FILTER BUTTONS (NO POSITIVE / NEGATIVE) */}
          {isOpinionQuestion ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedOptionFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedOptionFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {formatDual('Barcha fikrlar', 'Все отзывы', 'All feedback')} ({allList.length})
              </button>
              {optionsBreakdown.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setSelectedOptionFilter(opt.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all max-w-[220px] truncate ${
                    selectedOptionFilter === opt.name
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                  title={opt.name}
                >
                  {opt.name} ({opt.count})
                </button>
              ))}
            </div>
          ) : (
            /* RATING / YES-NO QUESTION: POSITIVE & NEGATIVE CONTROLS */
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode (Columns vs Tabs) */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
                <button
                  onClick={() => setViewMode('columns')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'columns'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title={formatDual('2 ta ustun yonma-yon', 'В две колонки', 'Side-by-side columns')}
                >
                  <Columns size={13} />
                  <span>{formatDual('Yonma-yon', 'Колонки', 'Columns')}</span>
                </button>
                <button
                  onClick={() => setViewMode('tabs')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'tabs'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title={formatDual('Tablar bo\'yicha', 'По вкладкам', 'Tabs view')}
                >
                  <ListFilter size={13} />
                  <span>{formatDual('Tablar', 'Вкладки', 'Tabs')}</span>
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {formatDual('Barchasi', 'Все', 'All')} ({filteredAll.length})
                </button>
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'pos'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  <span>{formatDual('Ijobiy', 'Положит.', 'Positive')}</span>
                  <span>({filteredPositive.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('neg')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'neg'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-red-700 dark:text-red-400 hover:bg-red-100/50'
                  }`}
                >
                  <AlertTriangle size={12} />
                  <span>{formatDual('Salbiy', 'Замечания', 'Negative')}</span>
                  <span>({filteredNegative.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* RESPONSES LIST AREA */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-dark-950/40">
          {/* OPINION / TEXT QUESTION: SINGLE CLEAN VIEW SHOWING RESPONDENT'S OPINION */}
          {isOpinionQuestion ? (
            <div className="space-y-3 max-w-4xl mx-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>
                  {formatDual("To'ldiruvchilar Fikrlari Ro'yxati", "Список отзывов респондентов", "Respondent Opinions List")}
                </span>
                <span>{filteredAll.length} ta javob</span>
              </div>

              {filteredAll.length === 0 ? (
                <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  {formatDual('Hech qanday fikr topilmadi', 'Отзывов не найдено', 'No feedback found')}
                </div>
              ) : (
                filteredAll.map((item, idx) => (
                  <OpinionCard
                    key={`${item.responseId}-${idx}`}
                    item={item}
                    qType={qType}
                    copiedId={copiedId}
                    onCopy={copyComment}
                    formatDual={formatDual}
                  />
                ))
              )}
            </div>
          ) : viewMode === 'columns' && activeTab === 'all' ? (
            /* 2-COLUMN SIDE-BY-SIDE VIEW FOR YES/NO & RATING */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* POSITIVE COLUMN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ThumbsUp size={15} />
                      {formatDual('Ijobiy javoblar', 'Положительные ответы', 'Positive responses')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                    {filteredPositive.length} ta
                  </span>
                </div>

                {filteredPositive.length === 0 ? (
                  <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-8 text-center text-slate-400 text-xs">
                    {formatDual('Ijobiy javob topilmadi', 'Положительных ответов не найдено', 'No positive responses found')}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPositive.map((item, idx) => (
                      <RespondentCard
                        key={`${item.responseId}-${idx}`}
                        item={item}
                        copiedId={copiedId}
                        onCopy={copyComment}
                        formatDual={formatDual}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* NEGATIVE / COMPLAINTS COLUMN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <h4 className="text-xs sm:text-sm font-black text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ThumbsDown size={15} />
                      {formatDual('Salbiy va E\'tirozlar', 'Замечания и дефекты', 'Negative & Complaints')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2.5 py-0.5 rounded-full">
                    {filteredNegative.length} ta
                  </span>
                </div>

                {filteredNegative.length === 0 ? (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 text-center text-xs">
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                      {formatDual(
                        'Ajoyib! Hech qanday shikoyat yoki salbiy fikr bildirilmagan',
                        'Отлично! Никаких замечаний или жалоб не поступило',
                        'Great! No complaints or negative feedback submitted'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredNegative.map((item, idx) => (
                      <RespondentCard
                        key={`${item.responseId}-${idx}`}
                        item={item}
                        copiedId={copiedId}
                        onCopy={copyComment}
                        formatDual={formatDual}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TABBED / FILTERED VIEW FOR YES/NO & RATING */
            <div className="space-y-3 max-w-3xl mx-auto">
              {activeTab === 'pos' && (
                <>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    {formatDual('Ijobiy javoblar ro\'yxati', 'Список положительных ответов', 'Positive responses list')} ({filteredPositive.length})
                  </div>
                  {filteredPositive.length === 0 ? (
                    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-8 text-center text-slate-400 text-xs">
                      {formatDual('Ijobiy javob topilmadi', 'Положительных ответов не найдено', 'No positive responses found')}
                    </div>
                  ) : (
                    filteredPositive.map((item, idx) => (
                      <RespondentCard
                        key={`${item.responseId}-${idx}`}
                        item={item}
                        copiedId={copiedId}
                        onCopy={copyComment}
                        formatDual={formatDual}
                      />
                    ))
                  )}
                </>
              )}

              {activeTab === 'neg' && (
                <>
                  <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                    {formatDual('Salbiy javoblar va E\'tirozlar', 'Список замечаний и претензий', 'Complaints & negative responses')} ({filteredNegative.length})
                  </div>
                  {filteredNegative.length === 0 ? (
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 text-center text-xs">
                      <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                        {formatDual(
                          'Ajoyib! Hech qanday shikoyat bildirilmagan',
                          'Отлично! Никаких замечаний не поступило',
                          'Great! No complaints submitted'
                        )}
                      </p>
                    </div>
                  ) : (
                    filteredNegative.map((item, idx) => (
                      <RespondentCard
                        key={`${item.responseId}-${idx}`}
                        item={item}
                        copiedId={copiedId}
                        onCopy={copyComment}
                        formatDual={formatDual}
                      />
                    ))
                  )}
                </>
              )}

              {activeTab === 'all' && (
                <>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {formatDual('Barcha respondentlar javoblari', 'Все ответы респондентов', 'All respondent answers')} ({filteredAll.length})
                  </div>
                  {filteredAll.length === 0 ? (
                    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-8 text-center text-slate-400 text-xs">
                      {formatDual('Hech narsa topilmadi', 'Ничего не найдено', 'Nothing found')}
                    </div>
                  ) : (
                    filteredAll.map((item, idx) => (
                      <RespondentCard
                        key={`${item.responseId}-${idx}`}
                        item={item}
                        copiedId={copiedId}
                        onCopy={copyComment}
                        formatDual={formatDual}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* FOOTER */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850 flex flex-wrap gap-2 items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {isOpinionQuestion ? (
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <MessageSquare size={13} className="text-blue-500" />
                {formatDual(
                  "Ushbu savolda respondentlarning erkin fikrlari jamlangan (ijobiy yoki salbiyga ajratilmagan)",
                  "В этом вопросе собраны свободные мнения респондентов без разделения на положительные и отрицательные",
                  "Open opinions collected without positive/negative categorization"
                )}
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatDual('Standart:', 'Стандарт:', 'Standard:')}
                </span>
                <span>
                  {question.questionType === 'yesno'
                    ? formatDual(
                        "\"Yo'q\" = Ijobiy (Benuqson), \"Ha\" = Salbiy (Nuqson)",
                        '"Нет" = Положительно (Без дефектов), "Да" = Отрицательно (Дефект)',
                        '"No" = Positive (Flawless), "Yes" = Negative (Defect)'
                      )
                    : formatDual(
                        '4-5 ball = Ijobiy, 1-3 ball = E\'tiroz / Salbiy',
                        '4-5 баллов = Положительно, 1-3 балла = Замечание',
                        '4-5 points = Positive, 1-3 points = Defect / Attention'
                      )}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-800 dark:text-white rounded-xl font-bold transition-all"
          >
            {formatDual('Yopish', 'Закрыть', 'Close')}
          </button>
        </div>

      </div>
    </div>
  )
}

/**
 * OPINION CARD: USED FOR TEXT AND SELECT QUESTIONS
 * Shows ONLY the respondent's opinion/text without positive/negative classification
 */
function OpinionCard({
  item,
  qType,
  copiedId,
  onCopy,
  formatDual,
}: {
  item: ClassifiedAnswer
  qType: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  formatDual: (uz: string, ru: string, en?: string) => string
}) {
  const cardId = `opinion-${item.responseId}`
  const opinionText = item.comment || (qType === 'text' ? item.cleanVal : '')

  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-dark-750 shadow-xs hover:border-blue-400 dark:hover:border-blue-700 transition-all">
      {/* Top: Restaurant & Date */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 size={15} className="text-blue-500" />
            <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              {item.restaurantName}
            </h5>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <User size={12} className="text-slate-400" />
              {item.respondentName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {item.date}
            </span>
          </div>
        </div>

        {/* Selected Option Badge (if select question) */}
        {qType === 'select' && item.cleanVal && (
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 shrink-0">
            {item.cleanVal}
          </span>
        )}
      </div>

      {/* TO'LDIRUVCHINING FIKRI (THE RESPONDENT'S OPINION) */}
      {opinionText ? (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/90 border border-slate-200 dark:border-dark-700">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} className="text-blue-500" />
              {formatDual("To'ldiruvchi fikri:", "Мнение респондента:", "Respondent's opinion:")}
            </span>
            <button
              onClick={() => onCopy(opinionText, cardId)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors"
              title={formatDual("Fikrni nusxalash", "Скопировать мнение", "Copy opinion")}
            >
              {copiedId === cardId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
            &ldquo;{opinionText}&rdquo;
          </p>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-400 italic">
          {formatDual("Qo'shimcha matnli izoh qoldirilmagan", "Дополнительный комментарий не указан", "No additional text comment provided")}
        </div>
      )}
    </div>
  )
}

/**
 * RESPONDENT CARD: USED FOR YES/NO AND RATING QUESTIONS
 */
function RespondentCard({
  item,
  copiedId,
  onCopy,
  formatDual,
}: {
  item: ClassifiedAnswer
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  formatDual: (uz: string, ru: string, en?: string) => string
}) {
  const cardId = `${item.responseId}-${item.score}`

  return (
    <div
      className={`rounded-2xl p-4 border transition-all shadow-xs ${
        item.isNegative
          ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:border-red-300'
          : 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-750 hover:border-emerald-300 dark:hover:border-emerald-800'
      }`}
    >
      {/* Top: Restaurant & Date */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Building2
              size={14}
              className={item.isNegative ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}
            />
            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              {item.restaurantName}
            </h5>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={11} className="text-slate-400" />
              {item.respondentName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              {item.date}
            </span>
          </div>
        </div>

        {/* Answer Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border flex-shrink-0 ${item.badgeColor}`}
        >
          {item.badgeLabel}
        </span>
      </div>

      {/* Respondent's Opinion / Comment if any */}
      {item.comment && (
        <div
          className={`mt-2.5 p-3 rounded-xl border text-xs relative group ${
            item.isNegative
              ? 'bg-red-100/60 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-950 dark:text-red-200 font-medium'
              : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 flex-1">
              <MessageSquare
                size={13}
                className={item.isNegative ? 'text-red-600 mt-0.5 flex-shrink-0' : 'text-blue-500 mt-0.5 flex-shrink-0'}
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  {formatDual("To'ldiruvchi fikri:", "Мнение респондента:", "Respondent's opinion:")}
                </span>
                <p className="leading-relaxed italic">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>
            </div>

            <button
              onClick={() => onCopy(item.comment, cardId)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              title="Fikrni nusxalash"
            >
              {copiedId === cardId ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useLanguage, type Language } from '@/components/providers/LanguageProvider'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, Globe, Sparkles } from 'lucide-react'
import { getDictionaryTranslation } from '@/lib/survey-translations'

interface Question {
  id: number
  questionText: string
  questionType: string
  options: string | null
  isRequired: boolean
  groupName: string | null
  subLabel: string | null
  helpText: string | null
  orderIndex: number
}

interface Survey {
  id: number
  title: string
  description: string | null
  questions: Question[]
}

export default function SurveyPublicPage() {
  const { formatDual, lang, setLang } = useLanguage()
  const params = useParams()
  const token = params.token as string

  const [currentLang, setCurrentLang] = useState<Language>(lang || 'uz_ru')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  const [respondentName, setRespondentName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [respondentDate, setRespondentDate] = useState(new Date().toLocaleDateString('uz-UZ'))
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [textExtras, setTextExtras] = useState<Record<number, string>>({})

  // Dynamic machine translations for any custom questions not in the built-in dictionary
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/surveys/token/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setSurvey(data)
      })
      .catch(() => setError('Xatolik yuz berdi'))
      .finally(() => setLoading(false))
  }, [token])

  // Sync currentLang if provider lang changes
  useEffect(() => {
    if (lang && lang !== currentLang) {
      setCurrentLang(lang)
    }
  }, [lang])

  // Instant or background translation helper
  const tr = (text: string | null | undefined): string => {
    if (!text) return ''
    const dict = getDictionaryTranslation(text, currentLang)
    if (dict) return dict
    if (currentLang === 'uz') return text
    return dynamicTranslations[text] || text
  }

  // Handle switching language smoothly without reloading
  const handleLanguageChange = (newLang: Language) => {
    setCurrentLang(newLang)
    setLang(newLang)
    try {
      localStorage.setItem('language', newLang)
    } catch {}
  }

  // Background auto-translation for custom/new questions
  useEffect(() => {
    if (!survey || currentLang === 'uz') return

    const textsToTranslate: string[] = []
    const checkAndCollect = (txt: string | null | undefined) => {
      if (!txt) return
      const clean = txt.trim()
      const dict = getDictionaryTranslation(clean, currentLang)
      if (!dict && !dynamicTranslations[clean]) {
        textsToTranslate.push(clean)
      }
    }

    checkAndCollect(survey.title)
    checkAndCollect(survey.description)

    survey.questions.forEach(q => {
      checkAndCollect(q.questionText)
      checkAndCollect(q.groupName)
      checkAndCollect(q.helpText)
      if (q.options) {
        try {
          const opts = JSON.parse(q.options)
          if (Array.isArray(opts)) {
            opts.forEach((o: any) => {
              if (typeof o === 'string' && o !== 'Ha' && o !== "Yo'q" && !['1', '2', '3', '4', '5'].includes(o)) {
                checkAndCollect(o)
              }
            })
          }
        } catch {}
      }
    })

    if (textsToTranslate.length > 0) {
      const unique = Array.from(new Set(textsToTranslate))
      setIsTranslating(true)
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: unique, targetLang: currentLang })
      })
        .then(r => r.json())
        .then(res => {
          if (res.translations) {
            setDynamicTranslations(prev => ({ ...prev, ...res.translations }))
          }
        })
        .catch(e => console.error('Auto translate fetch error:', e))
        .finally(() => setIsTranslating(false))
    }
  }, [survey, currentLang])

  const setAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!survey) return

    // Validate required
    const missing = survey.questions.filter(q => q.isRequired && !answers[q.id])
    if (missing.length > 0) {
      alert(
        formatDual(
          `Iltimos, barcha majburiy savollarni to'ldiring. (${missing.length} ta javob yetishmayapti)`,
          `Пожалуйста, ответьте на все обязательные вопросы. (Осталось ${missing.length})`,
          `Please answer all required questions. (${missing.length} remaining)`
        )
      )
      return
    }

    setSubmitting(true)
    try {
      const finalAnswers = survey.questions
        .map(q => ({
          questionId: q.id,
          answerValue: answers[q.id]
            ? textExtras[q.id]
              ? `${answers[q.id]}. Izoh: ${textExtras[q.id]}`
              : answers[q.id]
            : ''
        }))
        .filter(a => a.answerValue)

      const res = await fetch(`/api/surveys/token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentName, restaurantName, respondentDate, answers: finalAnswers })
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else alert(data.error || 'Xatolik yuz berdi')
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setSubmitting(false)
    }
  }

  const getYesNoLabel = (opt: string) => {
    if (opt === 'Ha' || opt === 'Да') {
      if (currentLang === 'ru') return 'Да'
      if (currentLang === 'en') return 'Yes'
      if (currentLang === 'uz_ru') return 'Ha / Да'
      if (currentLang === 'uz_en') return 'Ha / Yes'
      if (currentLang === 'ru_en') return 'Да / Yes'
      return 'Ha'
    }
    if (opt === "Yo'q" || opt === 'Нет') {
      if (currentLang === 'ru') return 'Нет'
      if (currentLang === 'en') return 'No'
      if (currentLang === 'uz_ru') return "Yo'q / Нет"
      if (currentLang === 'uz_en') return "Yo'q / No"
      if (currentLang === 'ru_en') return 'Нет / No'
      return "Yo'q"
    }
    return tr(opt)
  }

  const getRatingLabel = (score: string) => {
    switch (score) {
      case '5':
        return formatDual("A'lo", 'Отлично', 'Excellent')
      case '4':
        return formatDual('Yaxshi', 'Хорошо', 'Good')
      case '3':
        return formatDual('Qoniqarli', 'Удовлетворительно', 'Satisfactory')
      case '2':
        return formatDual('Yomon', 'Плохо', 'Poor')
      case '1':
        return formatDual('Juda yomon', 'Очень плохо', 'Very poor')
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Xatolik</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {formatDual('Rahmat!', 'Спасибо!', 'Thank you!')}
          </h2>
          <p className="text-slate-600 mb-4">
            {formatDual(
              "So'rovnomani to'ldirganingiz uchun minnatdorchilik bildiramiz.",
              'Благодарим вас за заполнение анкеты.',
              'Thank you for taking the time to complete our survey.'
            )}
          </p>
          <p className="text-sm text-slate-500">
            {formatDual(
              'Fikr-mulohazalaringiz mahsulot va xizmat sifatini oshirishga xizmat qiladi.',
              'Ваши отзывы помогают нам улучшать качество продукции и сервиса.',
              'Your feedback helps us continuously improve our product quality and service.'
            )}
          </p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  // Group questions by groupName
  const groups: Record<string, Question[]> = {}
  const ungrouped: Question[] = []
  survey.questions.forEach(q => {
    if (q.groupName) {
      if (!groups[q.groupName]) groups[q.groupName] = []
      groups[q.groupName].push(q)
    } else {
      ungrouped.push(q)
    }
  })

  const renderQuestion = (q: Question) => {
    const opts = q.options
      ? JSON.parse(q.options)
      : q.questionType === 'rating'
      ? ['5', '4', '3', '2', '1']
      : q.questionType === 'yesno'
      ? ['Ha', "Yo'q"]
      : []
    const selected = answers[q.id]

    if (q.questionType === 'rating') {
      return (
        <div className="mt-3">
          <div className="flex gap-2 flex-wrap">
            {opts.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(q.id, opt)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all border-2 ${
                  selected === opt
                    ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {selected && (
            <div className="mt-2 text-xs text-green-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {getRatingLabel(selected)}
            </div>
          )}
        </div>
      )
    }

    if (q.questionType === 'yesno') {
      return (
        <div className="mt-3 space-y-3">
          <div className="flex gap-3 flex-wrap">
            {opts.map((opt: string) => {
              const label = getYesNoLabel(opt)
              const isYes = opt === 'Ha' || opt === 'Да'
              const isSelected = selected === opt

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(q.id, opt)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                    isSelected
                      ? isYes
                        ? 'bg-red-500 border-red-500 text-white shadow-md'
                        : 'bg-green-600 border-green-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {(selected === 'Ha' || selected === 'Да') && (
            <div className="mt-2 animate-fadeIn">
              <p className="text-xs text-slate-500 mb-1 font-medium">
                {formatDual('Agar "Ha" bo\'lsa — batafsil:', 'Если «Да» — подробнее:', 'If "Yes" — please specify:')}
              </p>
              <textarea
                value={textExtras[q.id] || ''}
                onChange={e => setTextExtras(prev => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                rows={2}
                placeholder={tr(q.helpText) || formatDual('Batafsil izoh qoldiring...', 'Оставьте подробный комментарий...', 'Leave detailed comment...')}
              />
            </div>
          )}
        </div>
      )
    }

    if (q.questionType === 'select') {
      return (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {opts.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(q.id, opt)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 text-left ${
                  selected === opt
                    ? 'bg-green-600 border-green-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-green-400'
                }`}
              >
                {tr(opt)}
              </button>
            ))}
          </div>
          <div className="w-full">
            <textarea
              value={textExtras[q.id] || ''}
              onChange={e => setTextExtras(prev => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              rows={2}
              placeholder={formatDual(
                "Qo'shimcha fikringizni yozing...",
                'Напишите дополнительное мнение...',
                'Write additional comments...'
              )}
            />
          </div>
        </div>
      )
    }

    // text
    return (
      <div className="mt-3">
        <textarea
          value={answers[q.id] || ''}
          onChange={e => setAnswer(q.id, e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          rows={3}
          placeholder={formatDual('Javobingizni yozing...', 'Напишите ваш ответ...', 'Write your answer...')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white relative">
            {/* Multilingual Selector with Live Translation */}
            <div className="absolute top-4 right-4 flex items-center bg-black/20 p-1 rounded-2xl backdrop-blur-md border border-white/20">
              <Globe size={14} className="text-white/70 ml-2 mr-1 hidden sm:inline" />
              {[
                { id: 'uz', label: "UZ", title: "O'zbekcha" },
                { id: 'ru', label: "RU", title: "Русский" },
                { id: 'en', label: "EN", title: "English" },
                { id: 'uz_ru', label: "UZ/RU", title: "O'zbek / Русский" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLanguageChange(item.id as Language)}
                  title={item.title}
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                    currentLang === item.id
                      ? 'bg-white text-emerald-800 shadow-md scale-105'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                GP
              </div>
              <div>
                <p className="text-green-200 text-sm font-semibold tracking-wide">OOO «GREEN PROCESSING»</p>
                <p className="text-xs text-green-100 flex items-center gap-1">
                  {formatDual('Sifat nazorat tizimi', 'Система контроля качества', 'Quality Control System')}
                  {isTranslating && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-200 ml-2">
                      <Sparkles size={11} className="animate-pulse" />
                      o'girilmoqda...
                    </span>
                  )}
                </p>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold mb-2 leading-tight">
              {tr(survey.title)}
            </h1>
            {survey.description && (
              <p className="text-green-100 text-sm leading-relaxed">{tr(survey.description)}</p>
            )}
          </div>

          {/* Meta fields */}
          <div className="p-6 border-b border-slate-100 grid gap-4 sm:grid-cols-3 bg-slate-50/50">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {formatDual('F.I.Sh.', 'Ф.И.О.', 'Full Name')}
              </label>
              <input
                type="text"
                value={respondentName}
                onChange={e => setRespondentName(e.target.value)}
                className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={formatDual("To'liq ism", 'Полное имя', 'Full name')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {formatDual('Sana', 'Дата', 'Date')}
              </label>
              <input
                type="text"
                value={respondentDate}
                onChange={e => setRespondentDate(e.target.value)}
                className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ungrouped questions */}
          {ungrouped.map(q => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
              <p className="font-semibold text-slate-800 text-sm leading-snug">
                {q.isRequired && <span className="text-red-500 mr-1">*</span>}
                {tr(q.questionText)}
              </p>
              {renderQuestion(q)}
            </div>
          ))}

          {/* Grouped questions */}
          {Object.entries(groups).map(([groupName, qs]) => (
            <div key={groupName} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3.5">
                <h2 className="font-bold text-white text-sm sm:text-base leading-snug">{tr(groupName)}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {qs.map(q => (
                  <div key={q.id} className="p-5">
                    <p className="font-medium text-slate-800 text-sm leading-snug">
                      {q.subLabel && <span className="font-bold text-green-700 mr-2">{q.subLabel}</span>}
                      {q.isRequired && <span className="text-red-500 mr-1">*</span>}
                      {tr(q.questionText)}
                    </p>
                    {renderQuestion(q)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {submitting
              ? formatDual('Yuborilmoqda...', 'Отправка...', 'Submitting...')
              : formatDual("So'rovnomani yuborish", 'Отправить анкету', 'Submit survey')}
          </button>

          <p className="text-center text-xs text-slate-400 pb-8">
            {formatDual(
              'Vaqt ajratganingiz uchun minnatdorchilik! 🌿',
              'Спасибо за уделенное время! 🌿',
              'Thank you for your valuable time! 🌿'
            )}
          </p>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, Star } from 'lucide-react'

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
  const { formatDual } = useLanguage()
  const params = useParams()
  const token = params.token as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [respondentName, setRespondentName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [respondentDate, setRespondentDate] = useState(new Date().toLocaleDateString('uz-UZ'))
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [textExtras, setTextExtras] = useState<Record<number, string>>({})

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

  const setAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!survey) return

    // Validate required
    const missing = survey.questions.filter(q => q.isRequired && !answers[q.id])
    if (missing.length > 0) {
      alert(`Iltimos, barcha majburiy savollarni to'ldiring. (${missing.length} ta javob yetishmayapti)`)
      return
    }

    setSubmitting(true)
    try {
      const finalAnswers = survey.questions.map(q => ({
        questionId: q.id,
        answerValue: answers[q.id] ? 
          (textExtras[q.id] ? `${answers[q.id]}. Izoh: ${textExtras[q.id]}` : answers[q.id])
          : ''
      })).filter(a => a.answerValue)

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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600">Yuklanmoqda...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Xatolik</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Rahmat!</h2>
        <p className="text-slate-600 mb-4">So'rovnomani to'ldirgandingiz uchun minnatdorchilik bildiramiz.</p>
        <p className="text-sm text-slate-500">Fikr-mulohazalaringiz mahsulot sifatini yaxshilashga yordam beradi.</p>
      </div>
    </div>
  )

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
    const opts = q.options ? JSON.parse(q.options) : (q.questionType === 'rating' ? ['5','4','3','2','1'] : (q.questionType === 'yesno' ? ['Ha',"Yo'q"] : []))
    const selected = answers[q.id]

    if (q.questionType === 'rating') {
      return (
        <div className="mt-2">
          <div className="flex gap-2 flex-wrap">
            {opts.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(q.id, opt)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all border-2 ${
                  selected === opt
                    ? 'bg-green-600 border-green-600 text-white shadow-lg scale-110'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {selected && (
            <div className="mt-1 text-xs text-green-600 font-medium">
              {selected === '5' ? formatDual("A'lo", "Отлично", "Excellent") : selected === '4' ? formatDual('Yaxshi', 'Хорошо', 'Good') : selected === '3' ? formatDual('Qoniqarli', 'Удовлетворительно', 'Satisfactory') : selected === '2' ? formatDual('Yomon', 'Плохо', 'Poor') : formatDual('Juda yomon', 'Очень плохо', 'Very poor')}
            </div>
          )}
        </div>
      )
    }

    if (q.questionType === 'yesno') {
      return (
        <div className="mt-2 space-y-2">
          <div className="flex gap-3">
            {opts.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(q.id, opt)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                  selected === opt
                    ? (opt === "Ha" || opt === "Да") ? 'bg-red-500 border-red-500 text-white' : 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {(selected === "Ha" || selected === "Да") && q.helpText && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">{formatDual('Agar "Ha" bo\'lsa — batafsil:', 'Если "Да" — подробнее:', 'If "Yes" — please specify:')}</p>
              <textarea
                value={textExtras[q.id] || ''}
                onChange={e => setTextExtras(prev => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none"
                rows={2}
                placeholder={q.helpText}
              />
            </div>
          )}
        </div>
      )
    }

    if (q.questionType === 'select') {
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          {opts.map((opt: string) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswer(q.id, opt)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                selected === opt
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-green-400'
              }`}
            >
              {opt}
            </button>
          ))}
          <div className="w-full mt-2">
            <textarea
              value={textExtras[q.id] || ''}
              onChange={e => setTextExtras(prev => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none"
              rows={2}
              placeholder={formatDual("O'z fikringizni yozing...", "Напишите свое мнение...", "Write your opinion...")}
            />
          </div>
        </div>
      )
    }

    // text
    return (
      <div className="mt-2">
        <textarea
          value={answers[q.id] || ''}
          onChange={e => setAnswer(q.id, e.target.value)}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          rows={3}
          placeholder={formatDual("Javobingizni yozing...", "Напишите ваш ответ...", "Write your answer...")}
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
          {/* Lang */}
          <div className="absolute top-4 right-4 flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
            <button onClick={() => { window.localStorage.setItem('language', 'uz_ru'); window.location.reload(); }} className="text-white text-xs px-2 py-1 font-bold">UZ/RU</button>
            <button onClick={() => { window.localStorage.setItem('language', 'ru_en'); window.location.reload(); }} className="text-white text-xs px-2 py-1 font-bold">RU/EN</button>
            <button onClick={() => { window.localStorage.setItem('language', 'uz_en'); window.location.reload(); }} className="text-white text-xs px-2 py-1 font-bold">UZ/EN</button>
          </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">GP</div>
              <div>
                <p className="text-green-200 text-sm">OOO «GREEN PROCESSING»</p>
                <p className="text-xs text-green-200">{formatDual('Sifat nazorat tizimi', 'Система контроля качества', 'Quality Control System')}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
            {survey.description && <p className="text-green-100 text-sm">{survey.description}</p>}
          </div>

          {/* Meta fields */}
          <div className="p-6 border-b border-slate-100 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}</label>
              <input
                type="text"
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{formatDual('F.I.Sh.', 'Ф.И.О.', 'Full Name')}</label>
              <input
                type="text"
                value={respondentName}
                onChange={e => setRespondentName(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={formatDual("To'liq ism", 'Полное имя', 'Full name')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{formatDual('Sana', 'Дата', 'Date')}</label>
              <input
                type="text"
                value={respondentDate}
                onChange={e => setRespondentDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ungrouped questions */}
          {ungrouped.map(q => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6">
              <p className="font-semibold text-slate-800 text-sm leading-snug">
                {q.isRequired && <span className="text-red-500 mr-1">*</span>}
                {q.questionText}
              </p>
              {renderQuestion(q)}
            </div>
          ))}

          {/* Grouped questions */}
          {Object.entries(groups).map(([groupName, qs]) => (
            <div key={groupName} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3">
                <h2 className="font-bold text-white">{groupName}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {qs.map(q => (
                  <div key={q.id} className="p-5">
                    <p className="font-medium text-slate-800 text-sm leading-snug">
                      {q.subLabel && <span className="font-bold text-green-700 mr-2">{q.subLabel}</span>}
                      {q.isRequired && <span className="text-red-500 mr-1">*</span>}
                      {q.questionText}
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
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {submitting ? formatDual('Yuborilmoqda...', 'Отправка...', 'Submitting...') : formatDual('So\'rovnomani yuborish', 'Отправить анкету', 'Submit survey')}
          </button>
          
          <p className="text-center text-xs text-slate-400 pb-8">
            Vaqt ajratgandingiz uchun minnatdorchilik! 🌿
          </p>
        </form>
      </div>
    </div>
  )
}

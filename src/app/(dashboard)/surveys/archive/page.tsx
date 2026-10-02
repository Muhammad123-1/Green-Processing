'use client'
import { useState, useEffect } from 'react'
import { Link2, Users, Calendar, ChevronDown, ChevronUp, RefreshCw, ArrowLeft, Archive, BarChart2, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

interface Survey {
  id: number
  title: string
  description: string | null
  token: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  questions: any[]
  responses: { id: number }[]
}

export default function SurveysArchivePage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => { fetchSurveys() }, [])

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surveys')
      const data = await res.json()
      if (Array.isArray(data)) setSurveys(data)
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-dark-800 rounded-xl flex items-center justify-center text-slate-500">
              <Archive size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Arxiv: So'rovnomalar</h1>
              <p className="text-slate-500 text-sm mt-1">Barcha so'rovnomalar va ularning javoblari tarixi</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchSurveys} className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
              <RefreshCw size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
            <Link
              href="/surveys"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Boshqaruv paneli
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
            <Archive size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Arxiv bo'sh</p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map(s => {
              const isExpanded = expandedId === s.id
              return (
                <div key={s.id} className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm overflow-hidden">
                  <div 
                    className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{s.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{new Date(s.createdAt).toLocaleDateString('uz-UZ')} da yaratilgan</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-dark-800 rounded-lg font-medium"><Users size={14} className="text-blue-500"/> {s.responses.length} ta javob</span>
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-dark-800 rounded-lg"><BarChart2 size={14} /> Statistika</span>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-dark-800 rounded-full text-slate-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && <ResponseViewer surveyId={s.id} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ResponseViewer({ surveyId }: { surveyId: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [surveyId])

  if (loading) return <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 dark:bg-dark-800/30">Yuklanmoqda...</div>
  if (!data) return null

  const questions = data.questions || []
  const responses = data.responses || []

  // Aggregate statistics
  const statsByQuestion: Record<number, Record<string, number>> = {}
  
  questions.forEach((q: any) => {
    statsByQuestion[q.id] = {}
  })

  responses.forEach((resp: any) => {
    resp.answers.forEach((ans: any) => {
      const qId = ans.questionId
      const val = ans.answerValue
      if (statsByQuestion[qId]) {
        // Simple extraction for text if it has "Izoh:"
        let cleanVal = val
        if (val.includes('. Izoh:')) cleanVal = val.split('. Izoh:')[0]
        
        statsByQuestion[qId][cleanVal] = (statsByQuestion[qId][cleanVal] || 0) + 1
      }
    })
  })

  return (
    <div className="border-t border-slate-100 dark:border-dark-750 bg-slate-50/50 dark:bg-dark-800/30">
      <div className="p-6">
        {responses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Hali javob yo'q</div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" /> 
                Umumiy statistika
              </h4>
              <button 
                onClick={() => setShowUsers(!showUsers)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
              >
                <UserCheck size={16} />
                {showUsers ? "Faqat statistika" : "Kim qanday javob berganini ko'rish"}
              </button>
            </div>

            {/* STATISTICS VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.map((q: any) => {
                const qStats = statsByQuestion[q.id] || {}
                const totalAnswers = Object.values(qStats).reduce((a, b) => a + b, 0)
                
                // Prepare data for recharts
                const chartData = Object.entries(qStats).map(([name, value]) => {
                  let color = '#3b82f6' // blue-500
                  if (name === '5' || name === "A'lo" || name === "Ha") color = '#22c55e' // green-500
                  if (name === '4' || name === 'Yaxshi') color = '#34d399' // emerald-400
                  if (name === '3' || name === 'Qoniqarli') color = '#facc15' // yellow-400
                  if (name === '2' || name === 'Yomon') color = '#f97316' // orange-500
                  if (name === '1' || name === 'Juda yomon' || name === "Yo'q") color = '#ef4444' // red-500
                  
                  // Truncate long text
                  const shortName = name.length > 20 ? name.substring(0, 20) + '...' : name;

                  return { name: shortName, fullName: name, value, color }
                }).sort((a,b) => b.value - a.value)

                return (
                  <div key={q.id} className="bg-white dark:bg-dark-900 rounded-xl p-5 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col h-full">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm mb-6 line-clamp-3">
                      {q.subLabel && <span className="text-slate-400 mr-2">{q.subLabel}</span>}
                      {q.questionText}
                    </p>
                    
                    {totalAnswers === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-400 min-h-[150px]">Javoblar yo'q</div>
                    ) : (
                      <div className="flex-1 min-h-[220px]">
                        {q.questionType === 'yesno' ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                labelLine={false}
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} ta javob`, 'Miqdor']} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${value} ta`, 'Javoblar']}
                                labelFormatter={(label) => {
                                  const original = chartData.find(d => d.name === label)?.fullName;
                                  return original || label;
                                }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* USER RESPONSES VIEW */}
            {showUsers && (
              <div className="mt-10 border-t border-slate-200 dark:border-dark-750 pt-8">
                <h4 className="font-bold text-slate-800 dark:text-white text-base mb-6 flex items-center gap-2">
                  <Users size={18} className="text-green-500" />
                  Mijozlar bo'yicha javoblar
                </h4>
                
                <div className="space-y-6">
                  {responses.map((resp: any, idx: number) => (
                    <div key={resp.id} className="bg-white dark:bg-dark-900 rounded-xl p-5 border border-slate-200 dark:border-dark-700 shadow-sm relative">
                      
                      <div className="absolute -left-3 -top-3 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white dark:border-dark-900 shadow-sm">
                        #{idx + 1}
                      </div>

                      <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-dark-800 gap-4">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-base">
                            {resp.restaurantName || "Noma'lum restoran"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-500 font-medium">{resp.respondentName || 'Ism kiritilmagan'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded">
                              Sana: {resp.respondentDate || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-col items-end">
                          <span className="font-medium text-slate-500 dark:text-slate-400">Topshirildi:</span>
                          <span>{new Date(resp.submittedAt).toLocaleString('uz-UZ')}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {resp.answers?.map((ans: any) => {
                          const q = questions.find((q: any) => q.id === ans.questionId)
                          return (
                            <div key={ans.id} className="flex gap-3 text-sm bg-slate-50 dark:bg-dark-800/50 p-3 rounded-lg">
                              <span className="font-bold text-slate-400 flex-shrink-0 mt-0.5 w-4">{q?.subLabel || '•'}</span>
                              <div className="flex-1">
                                <p className="text-slate-700 dark:text-slate-300 mb-1">{q?.questionText}</p>
                                <span className={`inline-block font-bold px-2 py-0.5 rounded ${
                                  ans.answerValue === '5' ? 'bg-green-100 text-green-700' :
                                  ans.answerValue === '4' ? 'bg-emerald-100 text-emerald-700' :
                                  ans.answerValue === '3' ? 'bg-yellow-100 text-yellow-700' :
                                  ans.answerValue === '2' ? 'bg-orange-100 text-orange-700' :
                                  ans.answerValue === '1' ? 'bg-red-100 text-red-700' :
                                  (ans.answerValue === 'Ha' || ans.answerValue === 'Да') ? 'bg-red-100 text-red-700' :
                                  (ans.answerValue === "Yo'q" || ans.answerValue === 'Нет') ? 'bg-green-100 text-green-700' :
                                  'bg-slate-200 text-slate-800 dark:bg-dark-700 dark:text-slate-200'
                                }`}>
                                  {ans.answerValue}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

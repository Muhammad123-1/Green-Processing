'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Question {
  id?: number
  orderIndex: number
  questionText: string
  questionType: string
  options: string[] | null
  isRequired: boolean
  groupName: string | null
  subLabel: string | null
  helpText: string | null
}

export default function SurveyBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    fetch(`/api/surveys/${surveyId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
          return
        }
        setTitle(data.title || '')
        setDescription(data.description || '')
        
        // Parse options from string
        const qs = (data.questions || []).map((q: any) => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : []
        }))
        setQuestions(qs)
      })
      .catch(() => toast.error('Xatolik'))
      .finally(() => setLoading(false))
  }, [surveyId])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        orderIndex: questions.length,
        questionText: '',
        questionType: 'text',
        options: [],
        isRequired: true,
        groupName: '',
        subLabel: '',
        helpText: ''
      }
    ])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQs = [...questions]
    newQs[index] = { ...newQs[index], [field]: value }
    setQuestions(newQs)
  }

  const removeQuestion = (index: number) => {
    const newQs = [...questions]
    newQs.splice(index, 1)
    setQuestions(newQs)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // For now, replacing all questions is easiest by deleting and recreating them.
      // But we can do this on a specialized API endpoint.
      const res = await fetch(`/api/surveys/${surveyId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Saqlandi!')
        router.push('/surveys')
      } else {
        toast.error(data.error || 'Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/surveys" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ArrowLeft size={20} />
            Ortga
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saqlanmoqda...' : 'Saqlash va tugatish'}
          </button>
        </div>

        {/* Meta */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">So'rovnoma sozlamalari</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Nomi</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tavsifi</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Savollar ({questions.length})</h2>
            <button 
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl font-medium text-sm transition-colors"
            >
              <Plus size={16} />
              Savol qo'shish
            </button>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-6 shadow-sm flex gap-4">
              <div className="mt-2 text-slate-300 dark:text-dark-600 cursor-move">
                <GripVertical size={20} />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Savol matni</label>
                    <input 
                      type="text" 
                      value={q.questionText}
                      onChange={e => updateQuestion(i, 'questionText', e.target.value)}
                      placeholder="Masalan: Mahsulot sifatidan qoniqdingizmi?"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Savol turi</label>
                    <select 
                      value={q.questionType}
                      onChange={e => updateQuestion(i, 'questionType', e.target.value)}
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="text">Matnli javob</option>
                      <option value="yesno">Ha / Yo'q</option>
                      <option value="rating">Reyting (1-5)</option>
                      <option value="select">Variantlardan tanlash</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Guruh nomi (ixtiyoriy)</label>
                    <input 
                      type="text" 
                      value={q.groupName || ''}
                      onChange={e => updateQuestion(i, 'groupName', e.target.value)}
                      placeholder="Masalan: 1-savol"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kichik raqam/harf</label>
                    <input 
                      type="text" 
                      value={q.subLabel || ''}
                      onChange={e => updateQuestion(i, 'subLabel', e.target.value)}
                      placeholder="Masalan: a), b)"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Yordamchi matn</label>
                    <input 
                      type="text" 
                      value={q.helpText || ''}
                      onChange={e => updateQuestion(i, 'helpText', e.target.value)}
                      placeholder="Qo'shimcha izoh"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {q.questionType === 'select' && (
                  <div className="md:col-span-2 mt-4 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-100 dark:border-dark-750">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Javob variantlari</label>
                    <div className="space-y-2">
                      {(q.options || ['']).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-dark-700 flex items-center justify-center text-xs text-slate-500 shrink-0">
                            {optIdx + 1}
                          </div>
                          <input 
                            type="text" 
                            value={opt}
                            onChange={e => {
                              const newOpts = [...(q.options || [''])]
                              newOpts[optIdx] = e.target.value
                              updateQuestion(i, 'options', newOpts)
                            }}
                            placeholder="Variant matni..."
                            className="flex-1 border border-slate-200 dark:border-dark-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newOpts = [...(q.options || [''])]
                              newOpts.splice(optIdx, 1)
                              updateQuestion(i, 'options', newOpts.length ? newOpts : [''])
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newOpts = [...(q.options || [''])]
                        newOpts.push('')
                        updateQuestion(i, 'options', newOpts)
                      }}
                      className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      <Plus size={14} /> Yangi variant qo'shish
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={q.isRequired}
                      onChange={e => updateQuestion(i, 'isRequired', e.target.checked)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Majburiy savol</span>
                  </label>
                  
                  <button 
                    onClick={() => removeQuestion(i)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Savolni o'chirish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750">
              <p className="text-slate-500 text-sm">Savollar yo'q. Yangi savol qo'shing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

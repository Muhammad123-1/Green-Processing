'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, GripVertical, FileText, Check, HelpCircle } from 'lucide-react'
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
  correctAnswer?: string | null
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
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer || null
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
        questionType: 'select',
        options: [''],
        isRequired: true,
        groupName: '',
        subLabel: '',
        helpText: '',
        correctAnswer: null
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

  const [importingDocx, setImportingDocx] = useState(false)

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingDocx(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/surveys/import-docx', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        if (!title && data.title) setTitle(data.title)
        if (!description && data.description) setDescription(data.description)
        const importedQuestions: Question[] = data.questions.map((q: any, idx: number) => ({
          orderIndex: questions.length + idx,
          questionText: q.questionText || '',
          questionType: q.questionType || 'select',
          options: Array.isArray(q.options) ? q.options : [],
          isRequired: q.isRequired ?? true,
          groupName: q.groupName || '',
          subLabel: q.subLabel || '',
          helpText: q.helpText || '',
          correctAnswer: q.correctAnswer || null
        }))
        setQuestions(prev => [...prev, ...importedQuestions])
        toast.success(`${importedQuestions.length} ta savol Word faylidan muvaffaqiyatli import qilindi!`)
      } else {
        toast.error(data.error || 'Fayldan savollar topilmadi')
      }
    } catch {
      toast.error('Faylni yuklashda xatolik yuz berdi')
    } finally {
      setImportingDocx(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
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
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link href="/surveys" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ArrowLeft size={20} />
            Ortga
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saqlanmoqda...' : 'Saqlash va tugatish'}
          </button>
        </div>

        {/* Meta */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">So'rovnoma / Test sozlamalari</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Nomi</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="So'rovnoma yoki test nomi..."
                className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tavsifi</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tavsif yoki yo'riqnoma..."
                className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2.5 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Savollar ({questions.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Testlar uchun to'g'ri javoblarni yashil tugma orqali belgilang</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40 rounded-xl font-medium text-sm transition-colors cursor-pointer border border-purple-200 dark:border-purple-800">
                <FileText size={16} />
                {importingDocx ? "Yuklanmoqda..." : "Word (.docx) dan import"}
                <input
                  type="file"
                  accept=".docx"
                  disabled={importingDocx}
                  className="hidden"
                  onChange={handleImportDocx}
                />
              </label>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl font-medium text-sm transition-colors"
              >
                <Plus size={16} />
                Savol qo'shish
              </button>
            </div>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-4 sm:p-6 shadow-sm flex gap-2.5 sm:gap-4">
              <div className="mt-2 text-slate-300 dark:text-dark-600 cursor-move">
                <GripVertical size={20} />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-dark-800">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {i + 1}-savol
                  </span>
                  {q.correctAnswer && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <Check size={12} className="stroke-[3]" />
                      <span className="truncate max-w-[260px]">To'g'ri javob: {q.correctAnswer}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Savol matni</label>
                    <input 
                      type="text" 
                      value={q.questionText}
                      onChange={e => updateQuestion(i, 'questionText', e.target.value)}
                      placeholder="Masalan: Qaysi haroratda xomashyo saqlanadi?"
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
                      <option value="select">Variantlardan tanlash (Test uchun)</option>
                      <option value="yesno">Ha / Yo'q (Tasdiq)</option>
                      <option value="text">Matnli javob</option>
                      <option value="rating">Reyting (1-5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Guruh nomi (ixtiyoriy)</label>
                    <input 
                      type="text" 
                      value={q.groupName || ''}
                      onChange={e => updateQuestion(i, 'groupName', e.target.value)}
                      placeholder="Masalan: Sanitariya va gigiyena"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kichik raqam/harf</label>
                    <input 
                      type="text" 
                      value={q.subLabel || ''}
                      onChange={e => updateQuestion(i, 'subLabel', e.target.value)}
                      placeholder="Masalan: №1 yoki a), b)"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Yordamchi matn / Izoh</label>
                    <input 
                      type="text" 
                      value={q.helpText || ''}
                      onChange={e => updateQuestion(i, 'helpText', e.target.value)}
                      placeholder="Qo'shimcha yo'riqnoma"
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* SELECT (MULTIPLE CHOICE) OPTIONS */}
                {q.questionType === 'select' && (
                  <div className="md:col-span-2 mt-4 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-100 dark:border-dark-750">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Javob variantlari & To'g'ri javobni belgilash
                      </label>
                      <span className="text-[11px] text-slate-500">
                        To'g'ri javobni belgilash uchun variant yonidagi yashil tugmani bosing
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(q.options || ['']).map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === opt && opt.trim() !== ''
                        return (
                          <div 
                            key={optIdx} 
                            className={`flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl border transition-all ${
                              isCorrect 
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/40' 
                                : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 dark:bg-dark-700 text-slate-500'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            
                            <input 
                              type="text" 
                              value={opt}
                              onChange={e => {
                                const newOpts = [...(q.options || [''])]
                                const oldVal = newOpts[optIdx]
                                newOpts[optIdx] = e.target.value
                                updateQuestion(i, 'options', newOpts)
                                if (q.correctAnswer === oldVal) {
                                  updateQuestion(i, 'correctAnswer', e.target.value)
                                }
                              }}
                              placeholder="Variant matni..."
                              className="flex-1 min-w-[200px] border-0 bg-transparent px-2 py-1 text-slate-900 dark:text-white text-sm outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (!opt.trim()) {
                                  toast.error("Avval variant matnini kiriting")
                                  return
                                }
                                if (isCorrect) {
                                  updateQuestion(i, 'correctAnswer', null)
                                } else {
                                  updateQuestion(i, 'correctAnswer', opt)
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 dark:bg-dark-700 dark:border-dark-600 dark:text-slate-300 dark:hover:bg-emerald-950/40'
                              }`}
                              title={isCorrect ? "To'g'ri javoblikdan chiqarish" : "To'g'ri javob deb belgilash"}
                            >
                              <Check size={14} className={isCorrect ? 'stroke-[3]' : ''} />
                              <span>{isCorrect ? "To'g'ri javob ✓" : "To'g'ri javob"}</span>
                            </button>

                            <button 
                              type="button"
                              onClick={() => {
                                const newOpts = [...(q.options || [''])]
                                const deletedVal = newOpts[optIdx]
                                newOpts.splice(optIdx, 1)
                                updateQuestion(i, 'options', newOpts.length ? newOpts : [''])
                                if (q.correctAnswer === deletedVal) {
                                  updateQuestion(i, 'correctAnswer', null)
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                              title="Variantni o'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )
                      })}
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

                {/* YES / NO CORRECT ANSWER SELECTOR */}
                {q.questionType === 'yesno' && (
                  <div className="md:col-span-2 mt-3 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-200/70 dark:border-dark-750">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                      To'g'ri javob (test savoli sifatida tekshirish uchun)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(i, 'correctAnswer', null)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          !q.correctAnswer
                            ? 'bg-slate-700 text-white border-slate-700 dark:bg-dark-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-dark-800 dark:text-slate-300 dark:border-dark-700'
                        }`}
                      >
                        Belgilanmagan (Oddiy so'rov)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(i, 'correctAnswer', 'Ha')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          q.correctAnswer === 'Ha'
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 dark:bg-dark-800 dark:text-slate-200 dark:border-dark-700'
                        }`}
                      >
                        <Check size={14} /> Ha (To'g'ri javob)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(i, 'correctAnswer', "Yo'q")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                          q.correctAnswer === "Yo'q"
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 dark:bg-dark-800 dark:text-slate-200 dark:border-dark-700'
                        }`}
                      >
                        <Check size={14} /> Yo'q (To'g'ri javob)
                      </button>
                    </div>
                  </div>
                )}

                {/* TEXT CORRECT ANSWER SELECTOR */}
                {q.questionType === 'text' && (
                  <div className="md:col-span-2 mt-3 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-200/70 dark:border-dark-750">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1 block">
                      To'g'ri javob namunasi / etalon (ixtiyoriy, test tekshiruvi uchun)
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer || ''}
                      onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)}
                      placeholder="To'g'ri javob namunasi..."
                      className="mt-1 w-full border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-2 bg-white dark:bg-dark-800 text-slate-900 dark:text-white text-sm"
                    />
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
              <p className="text-slate-500 text-sm">Savollar yo'q. Yangi savol qo'shing yoki Word faylidan import qiling.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

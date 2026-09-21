'use client'

import React, { useState, useEffect } from 'react'
import { ChefHat, Send, CheckCircle2, Loader2 } from 'lucide-react'

export default function KitchenFeedbackPage() {
  const [step, setStep] = useState<'rating' | 'comment' | 'done'>('rating')
  const [rating, setRating] = useState<'GOOD' | 'AVERAGE' | 'BAD' | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [todayMeal, setTodayMeal] = useState<string>('')

  useEffect(() => {
    // Bugungi ovqatni olish
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/kitchen/meal-logs?date=${today}&limit=1`)
      .then(r => r.json())
      .then(logs => {
        if (Array.isArray(logs) && logs.length > 0) {
          setTodayMeal(logs[0].mealName)
        }
      })
      .catch(() => {})
  }, [])

  const handleRating = (val: 'GOOD' | 'AVERAGE' | 'BAD') => {
    setRating(val)
    setStep('comment')
  }

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          date: new Date().toISOString().slice(0, 10),
          mealName: todayMeal || null
        })
      })
      if (res.ok) {
        setStep('done')
      }
    } catch {}
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl mx-auto mb-3">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Green Processing</h1>
          <p className="text-sm text-slate-500 mt-1">Oshxona — Ovqat Baholash</p>
          {todayMeal && (
            <p className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5 mt-2 inline-block">
              Bugungi ovqat: {todayMeal}
            </p>
          )}
        </div>

        {/* STEP: Rating */}
        {step === 'rating' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <h2 className="text-xl font-black text-slate-900 mb-2">Bugungi ovqatni baholang</h2>
            <p className="text-sm text-slate-400 mb-8">Sizning fikringiz muhim va to&apos;liq anonim</p>

            <div className="space-y-3">
              <button
                onClick={() => handleRating('GOOD')}
                className="w-full py-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group active:scale-95"
              >
                <div className="text-4xl mb-1">😋</div>
                <div className="font-black text-emerald-700 text-lg">Yaxshi!</div>
                <div className="text-xs text-emerald-500">Ovqat mazali edi</div>
              </button>

              <button
                onClick={() => handleRating('AVERAGE')}
                className="w-full py-5 rounded-2xl border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 transition-all group active:scale-95"
              >
                <div className="text-4xl mb-1">😐</div>
                <div className="font-black text-amber-700 text-lg">O&apos;rtacha</div>
                <div className="text-xs text-amber-500">Yaxshilanishi mumkin</div>
              </button>

              <button
                onClick={() => handleRating('BAD')}
                className="w-full py-5 rounded-2xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 transition-all group active:scale-95"
              >
                <div className="text-4xl mb-1">😞</div>
                <div className="font-black text-red-700 text-lg">Yomon</div>
                <div className="text-xs text-red-500">Umid qolmadi</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Comment */}
        {step === 'comment' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
            <div className={`text-center mb-6 py-4 rounded-2xl ${rating === 'GOOD' ? 'bg-emerald-50' : rating === 'AVERAGE' ? 'bg-amber-50' : 'bg-red-50'}`}>
              <div className="text-4xl">{rating === 'GOOD' ? '😋' : rating === 'AVERAGE' ? '😐' : '😞'}</div>
              <div className={`font-black text-lg mt-1 ${rating === 'GOOD' ? 'text-emerald-700' : rating === 'AVERAGE' ? 'text-amber-700' : 'text-red-700'}`}>
                {rating === 'GOOD' ? 'Yaxshi!' : rating === 'AVERAGE' ? "O'rtacha" : 'Yomon'}
              </div>
            </div>

            <h2 className="text-base font-black text-slate-900 mb-1">Izoh qoldiring</h2>
            <p className="text-xs text-slate-400 mb-4">Ixtiyoriy · To&apos;liq anonim</p>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Fikringizni yozing... (ixtiyoriy)"
              rows={4}
              className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm text-slate-800 resize-none outline-none transition-all"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('rating')}
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Orqaga
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Rahmat!</h2>
            <p className="text-slate-500 text-sm mb-6">Sizning fikringiz qabul qilindi.<br />Oshxona sifatini yaxshilashimizga yordam berdingiz!</p>
            <button
              onClick={() => { setStep('rating'); setRating(''); setComment('') }}
              className="text-sm text-slate-400 hover:text-slate-600 underline transition-all"
            >
              Yana baholash
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-300 mt-6">
          🔒 Anonim · Hech qanday shaxsiy ma&apos;lumot saqlanmaydi
        </p>
      </div>
    </div>
  )
}

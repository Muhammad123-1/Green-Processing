'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChefHat, Send, CheckCircle2, Loader2, AlertCircle, Clock, ShieldCheck } from 'lucide-react'

interface MealInfo {
  id: number
  mealName: string
  cookedDate: string
  shift: string
  preparedBy: string
  servings?: number
}

function FeedbackMain() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'loading' | 'expired' | 'no-token' | 'rating' | 'comment' | 'done'>('loading')
  const [mealInfo, setMealInfo] = useState<MealInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [rating, setRating] = useState<'GOOD' | 'AVERAGE' | 'BAD' | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStep('no-token')
      return
    }

    setStep('loading')
    fetch(`/api/kitchen/feedback?token=${encodeURIComponent(token)}`)
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Havola topilmadi')
        }
        return res.json()
      })
      .then(data => {
        if (data.isExpired) {
          setMealInfo(data.mealLog)
          setStep('expired')
        } else {
          setMealInfo(data.mealLog)
          setStep('rating')
        }
      })
      .catch(err => {
        setErrorMessage(err.message || 'Havola yaroqsiz yoki eskirgan')
        setStep('expired')
      })
  }, [token])

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
          token,
          rating,
          comment: comment.trim() || null
        })
      })
      if (res.ok) {
        setStep('done')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Bahoni saqlashda xatolik yuz berdi')
      }
    } catch {
      alert('Tarmoq xatosi yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl mx-auto mb-3">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Green Processing</h1>
          <p className="text-xs text-slate-500 mt-0.5">Xodimlar Oshxonasi — Anonim Baholash</p>
        </div>

        {/* LOADING */}
        {step === 'loading' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <Loader2 size={36} className="animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Ovqat ma&apos;lumotlari tekshirilmoqda...</p>
          </div>
        )}

        {/* NO TOKEN */}
        {step === 'no-token' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Maxsus havola talab qilinadi</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Har bir tayyorlangan ovqat uchun alohida 1 kunlik maxsus havola beriladi. Iltimos, oshpaz taqdim etgan kunlik havola orqali kiring.
            </p>
          </div>
        )}

        {/* EXPIRED */}
        {step === 'expired' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Baholash muddati tugagan</h2>
            {mealInfo ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-left space-y-1">
                <div className="text-xs text-slate-400 font-bold uppercase">Ovqat ma&apos;lumoti:</div>
                <div className="text-sm font-black text-slate-800">{mealInfo.mealName}</div>
                <div className="text-xs text-slate-500">
                  Sana: <span className="font-semibold text-slate-700">{mealInfo.cookedDate}</span> · {mealInfo.shift}
                </div>
                <div className="text-xs text-slate-500">
                  Oshpaz: <span className="font-semibold text-slate-700">{mealInfo.preparedBy}</span>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorMessage || "Ushbu havola faqat ovqat tayyorlangan kun davomida faol bo'ladi. Yangi ovqatlar uchun bugungi havoladan foydalaning."}
            </p>
          </div>
        )}

        {/* STEP: RATING */}
        {step === 'rating' && mealInfo && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 text-center">
            {/* Meal summary badge */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 mb-5 text-left">
              <div className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Bugungi Taomnoma:</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{mealInfo.mealName}</div>
              <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                <span>Oshpaz: <b>{mealInfo.preparedBy}</b></span>
                <span className="text-orange-700 font-bold text-[11px] bg-orange-100 px-2 py-0.5 rounded-lg">{mealInfo.shift}</span>
              </div>
            </div>

            <h2 className="text-lg font-black text-slate-900 mb-1">Ovqatni qanday baholaysiz?</h2>
            <p className="text-xs text-slate-400 mb-5">Sizning fikringiz oshxona sifatini oshirishga yordam beradi</p>

            <div className="space-y-3">
              <button
                onClick={() => handleRating('GOOD')}
                className="w-full py-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group active:scale-95 text-center"
              >
                <div className="text-3xl mb-1">😋</div>
                <div className="font-black text-emerald-700 text-base">Yaxshi!</div>
                <div className="text-xs text-emerald-500">Ovqat juda mazali edi</div>
              </button>

              <button
                onClick={() => handleRating('AVERAGE')}
                className="w-full py-4 rounded-2xl border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 transition-all group active:scale-95 text-center"
              >
                <div className="text-3xl mb-1">😐</div>
                <div className="font-black text-amber-700 text-base">O&apos;rtacha</div>
                <div className="text-xs text-amber-500">Yaxshilash mumkin bo&apos;lgan joylari bor</div>
              </button>

              <button
                onClick={() => handleRating('BAD')}
                className="w-full py-4 rounded-2xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 transition-all group active:scale-95 text-center"
              >
                <div className="text-3xl mb-1">😞</div>
                <div className="font-black text-red-700 text-base">Yomon</div>
                <div className="text-xs text-red-500">Sifati ma&apos;qul kelmadi</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP: COMMENT */}
        {step === 'comment' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
            <div className={`text-center mb-5 py-3 rounded-2xl ${rating === 'GOOD' ? 'bg-emerald-50' : rating === 'AVERAGE' ? 'bg-amber-50' : 'bg-red-50'}`}>
              <div className="text-3xl">{rating === 'GOOD' ? '😋' : rating === 'AVERAGE' ? '😐' : '😞'}</div>
              <div className={`font-black text-base mt-1 ${rating === 'GOOD' ? 'text-emerald-700' : rating === 'AVERAGE' ? 'text-amber-700' : 'text-red-700'}`}>
                {rating === 'GOOD' ? 'Yaxshi!' : rating === 'AVERAGE' ? "O'rtacha" : 'Yomon'}
              </div>
            </div>

            <h2 className="text-sm font-black text-slate-900 mb-1">Izoh qoldiring</h2>
            <p className="text-xs text-slate-400 mb-3">Qo&apos;shimcha fikr va takliflaringiz (ixtiyoriy)</p>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Masalan: tuzi me'yorida, go'shti pishgan yoki boshqa fikrlar..."
              rows={3}
              className="w-full border-2 border-slate-200 focus:border-orange-500 rounded-2xl px-4 py-3 text-sm text-slate-800 resize-none outline-none transition-all"
            />

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setStep('rating')}
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Orqaga
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Rahmat!</h2>
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Sizning fikringiz muvaffaqiyatli qabul qilindi.<br />
              Oshxona sifatini yaxshilashda ishtirok etganingiz uchun tashakkur!
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck size={14} /> To&apos;liq anonim tarzda saqlandi
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-5 flex items-center justify-center gap-1">
          <ShieldCheck size={13} className="text-slate-400" /> Shaxsiy ma&apos;lumot yoki qurilma saqlanmaydi
        </p>
      </div>
    </div>
  )
}

export default function KitchenFeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    }>
      <FeedbackMain />
    </Suspense>
  )
}

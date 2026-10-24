'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import {
  Lock,
  User,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Leaf,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react'

function SubmitButton({ lang }: { lang: 'uz' | 'ru' }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-70"
    >
      {pending ? (
        <Loader2 size={18} className="animate-spin text-slate-950" />
      ) : (
        <>
          <span>{lang === 'uz' ? 'ERP Tizimga kirish' : 'Войти в ERP систему'}</span>
          <ArrowRight size={18} />
        </>
      )}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lang, setLang] = useState<'uz' | 'ru'>('uz')

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070C16] text-slate-100 relative overflow-hidden px-4 py-6 sm:px-8">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[140px]" />
      </div>

      {/* Top Bar: Back to Company Website + Language Switcher */}
      <div className="relative z-10 max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'uz' ? 'Asosiy saytga qaytish' : 'На главную'}</span>
        </Link>

        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setLang('uz')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'uz' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            O‘Z
          </button>
          <button
            type="button"
            onClick={() => setLang('ru')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'ru' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            РУ
          </button>
        </div>
      </div>

      {/* Center Login Box */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 mx-auto mb-4 border border-emerald-400/30">
            <Leaf className="w-9 h-9 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
            OOO &quot;GREEN PROCESSING&quot;
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            {lang === 'uz' ? 'Xodimlar Portali (ERP)' : 'Портал Сотрудников (ERP)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {lang === 'uz'
              ? 'Shaxsiy ish kabinetingizga kirish uchun login va parolingizni kiriting'
              : 'Введите логин и пароль для входа в личный рабочий кабинет'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/75 backdrop-blur-2xl border border-white/15 p-7 sm:p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {lang === 'uz' ? 'Avtorizatsiya' : 'Авторизация'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'uz' ? 'Xodim identifikatsiyasi' : 'Идентификация сотрудника'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm text-center font-bold">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'uz' ? 'Login (Foydalanuvchi nomi)' : 'Логин сотрудника'}
                </label>
                <div className="relative group">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  />
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-medium"
                    placeholder={lang === 'uz' ? 'Foydalanuvchi nomingiz...' : 'Имя пользователя...'}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'uz' ? 'Maxfiy parol' : 'Пароль'}
                </label>
                <div className="relative group">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton lang={lang} />
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>
                {lang === 'uz'
                  ? 'Xavfsiz ulanish • FSSC 22000 Ichki Nazorat Tizimi'
                  : 'Защищенное соединение • Внутренняя система FSSC 22000'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center">
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} OOO &quot;GREEN PROCESSING&quot; — Corporate ERP Portal
        </p>
      </div>
    </div>
  )
}

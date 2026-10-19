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
  Factory,
  Microscope,
  Warehouse,
  Calculator,
  Truck,
  Users,
  Briefcase,
  Utensils,
  Cpu,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react'

const departments = [
  { id: 'director', username: 'director', labelUz: 'Direktor', labelRu: 'Директор', icon: Briefcase, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'admin', username: 'admin', labelUz: 'Admin', labelRu: 'Админ', icon: ShieldCheck, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'quality', username: 'quality', labelUz: 'Sifat Nazorati (QC)', labelRu: 'Контроль качества', icon: Microscope, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'inspector', username: 'inspector', labelUz: 'Sex Nazoratchisi', labelRu: 'Инспектор цеха', icon: CheckCircle2, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { id: 'production', username: 'production', labelUz: 'Ishlab Chiqarish', labelRu: 'Производство', icon: Factory, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'tech', username: 'tech', labelUz: 'Texnolog', labelRu: 'Технолог', icon: Cpu, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'warehouse', username: 'warehouse', labelUz: 'Ombor (Sklad)', labelRu: 'Склад', icon: Warehouse, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { id: 'supply', username: 'supply', labelUz: "Ta'minot", labelRu: 'Снабжение', icon: Truck, color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
  { id: 'accounting', username: 'accounting', labelUz: 'Buxgalteriya', labelRu: 'Бухгалтерия', icon: Calculator, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  { id: 'hr', username: 'hr', labelUz: 'Kadrlar (HR)', labelRu: 'Отдел кадров', icon: Users, color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  { id: 'kitchen', username: 'kitchen', labelUz: 'Oshxona', labelRu: 'Кухня', icon: Utensils, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { id: 'security', username: 'security', labelUz: 'Xavfsizlik', labelRu: 'Безопасность', icon: Lock, color: 'text-slate-300 border-slate-500/30 bg-slate-500/10' },
]

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

  const handleSelectRole = (roleUsername: string) => {
    setUsername(roleUsername)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070C16] text-slate-100 relative overflow-hidden px-4 py-6 sm:px-8">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[140px]" />
      </div>

      {/* Top Bar: Back to Company Website + Language Switcher */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'uz' ? 'Kompaniya saytiga qaytish' : 'Вернуться на сайт компании'}</span>
        </Link>

        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setLang('uz')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'uz' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            O‘Z
          </button>
          <button
            type="button"
            onClick={() => setLang('ru')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'ru' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            РУ
          </button>
        </div>
      </div>

      {/* Center Content Grid */}
      <div className="relative z-10 max-w-5xl w-full mx-auto my-8 grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Department / Role Selector for Staff */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                OOO &quot;GREEN PROCESSING&quot;
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lang === 'uz' ? 'Xodimlar Portali (ERP)' : 'Портал Сотрудников (ERP)'}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {lang === 'uz'
              ? "O'z bo'limingizni tanlang yoki foydalanuvchi nomingiz va maxfiy parolingizni kiritib shaxsiy ish kabinetingizga kiring."
              : 'Выберите свой отдел для быстрой подстановки логина или введите имя пользователя и пароль для входа в рабочий кабинет.'}
          </p>

          {/* Department Badges Grid */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
              <span>{lang === 'uz' ? "Bo'limni tez tanlash:" : 'Быстрый выбор отдела:'}</span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {lang === 'uz' ? '12 ta aktiv modul' : '12 активных модулей'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {departments.map((dept) => {
                const Icon = dept.icon
                const isSelected = username.toLowerCase() === dept.username
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => handleSelectRole(dept.username)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/10 scale-[1.01]'
                        : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${dept.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {lang === 'uz' ? dept.labelUz : dept.labelRu}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        @{dept.username}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/75 backdrop-blur-2xl border border-white/15 p-7 sm:p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white">
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
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                      placeholder={lang === 'uz' ? 'Masalan: director, inspector...' : 'Например: director, inspector...'}
                      required
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
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
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
              <p className="text-[11px] text-slate-500">
                {lang === 'uz'
                  ? 'Xavfsiz ulanish • FSSC 22000 Ichki Nazorat Tizimi'
                  : 'Защищенное соединение • Внутренняя система FSSC 22000'}
              </p>
            </div>
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

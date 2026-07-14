'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from '@/app/actions/auth'
import { Lock, User, Loader2, ArrowRight } from 'lucide-react'

// Wrap submit button to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-500 transition-all shadow-lg hover:shadow-green-500/30 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
    >
      {pending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          Tizimga kirish
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] relative overflow-hidden px-4">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/10">
            <Lock className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Green Processing
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Sifat nazorati va avtomatlashtirish tizimi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form action={formAction} className="space-y-5">
            
            {state?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-semibold">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Foydalanuvchi nomi
                </label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Maxfiy so'z
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>

          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} OOO "GREEN PROCESSING"
          </p>
        </div>

      </div>
    </div>
  )
}

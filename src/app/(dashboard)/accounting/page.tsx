'use client'
import { Construction } from 'lucide-react'
export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-enter">
      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
        <Construction size={40} className="text-blue-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Buxgalteriya</h1>
      <p className="text-slate-400 text-center max-w-md">Ushbu bo'lim hozirda ishlab chiqilmoqda. Tizim to'liq ishga tushganda bu yerda sizning rolingizga mos statistikalar va boshqaruv paneli bo'ladi.</p>
    </div>
  )
}

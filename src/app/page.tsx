'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-950">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner border-2 border-blue-500/30 border-t-blue-500 w-10 h-10" />
        <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  )
}

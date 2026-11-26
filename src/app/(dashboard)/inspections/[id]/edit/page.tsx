'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

export default function EditInspectionPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  useEffect(() => {
    toast.error("Kelgan aktlarni o'zgartirish ruxsat etilmagan")
    router.replace(id ? `/inspections/${id}` : '/inspections')
  }, [id, router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )
}

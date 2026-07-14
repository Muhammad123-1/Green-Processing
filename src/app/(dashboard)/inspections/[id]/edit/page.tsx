'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import NewInspectionForm from '@/components/inspections/NewInspectionForm'

export default function EditInspectionPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error()
      })
      .then((inspection) => {
        setData({
          id: inspection.id,
          actNumber: inspection.actNumber,
          inspectionDate: inspection.inspectionDate?.split('T')[0] || '',
          supplierId: String(inspection.supplierId),
          productId: String(inspection.productId),
          batchNumber: inspection.batchNumber,
          quantity: String(inspection.quantity),
          quantityUnit: inspection.quantityUnit,
          temperature: inspection.temperature != null ? String(inspection.temperature) : '',
          temperatureUnit: inspection.temperatureUnit,
          packaging: inspection.packaging || '',
          color: inspection.color || '',
          smell: inspection.smell || '',
          appearance: inspection.appearance || '',
          conclusion: inspection.conclusion,
          status: inspection.status,
          inspector: inspection.inspector || '',
          vehicleNumber: inspection.vehicleNumber || '',
          invoiceNumber: inspection.invoiceNumber || '',
          notes: inspection.notes || '',
          sheetName: inspection.sheetName || '',
        })
      })
      .catch(() => {
        toast.error('Akt topilmadi')
        router.push('/inspections')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (!data) return null

  return <NewInspectionForm initialData={data as Parameters<typeof NewInspectionForm>[0]['initialData']} />
}

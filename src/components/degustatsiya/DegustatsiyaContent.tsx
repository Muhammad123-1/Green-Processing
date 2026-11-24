'use client'

import React from 'react'
import { BrakerageJournalModal } from '@/components/kitchen/BrakerageJournalModal'
import { SanPiNHeader } from '@/components/degustatsiya/SanPiNHeader'

interface Props {
  userRole?: string
  userName?: string
}

export default function DegustatsiyaContent({ userRole, userName }: Props) {
  return (
    <div className="space-y-4 pb-12">
      <SanPiNHeader activeTab="degustatsiya" />

      {/* Dedicated Oshxona Brakeraj Jurnali Table */}
      <div className="w-full">
        <BrakerageJournalModal isFullPage={true} />
      </div>
    </div>
  )
}

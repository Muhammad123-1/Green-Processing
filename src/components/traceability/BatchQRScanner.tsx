'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { QrCode, X } from 'lucide-react'
import { toast } from 'sonner'

interface BatchQRScannerProps {
  onScan: (batchNumber: string) => void
  buttonText?: string
}

export default function BatchQRScanner({ onScan, buttonText = "Skanerlash" }: BatchQRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDecode = (text: string) => {
    try {
      // Odatda QR kod ichida JSON bo'ladi (Biz /api/batches/qr da json qilganmiz)
      let parsed = text
      try {
        const data = JSON.parse(text)
        parsed = data.lot || data.batchNumber || text
      } catch {
        // Agar sof matn bo'lsa, LOT: bilan boshlanganini qidiramiz
        if (text.includes('LOT:')) {
          const match = text.match(/LOT:([^\s\n]+)/)
          if (match) parsed = match[1]
        }
      }
      
      setIsOpen(false)
      onScan(parsed)
      toast.success("Muvaffaqiyatli skanerlandi!")
    } catch (error) {
      toast.error("QR kod noto'g'ri")
    }
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-200 px-4 py-2 rounded-xl transition-colors"
      >
        <QrCode size={18} />
        <span className="text-sm font-semibold">{buttonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 rounded-3xl w-full max-w-sm shadow-2xl border border-dark-700 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" /> Kameradan skanerlash
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-black relative min-h-[300px]">
              <Scanner 
                onScan={(detectedCodes) => {
                  if (detectedCodes.length > 0) {
                    handleDecode(detectedCodes[0].rawValue || '')
                  }
                }} 
                onError={(e) => console.error(e)}
              />
              {/* Skaner o'rtasida kvadrat ramka ko'rsatish */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-500/50 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-xl"></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 text-center text-xs text-slate-400 bg-dark-800/50">
              Kamerani partiya QR kodiga qarating
            </div>
          </div>
        </div>
      )}
    </>
  )
}

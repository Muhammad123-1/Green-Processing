'use client'

import React, { useState } from 'react'
import {
  Truck,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  FileText,
  ExternalLink,
  Layers,
  Clock,
} from 'lucide-react'

interface RejectionActItem {
  id: string
  rejectionActNumber: string
  actDate: string
  supplierName: string
  productName: string
  receivedKg: number
  acceptedKg: number
  rejectedKg: number
  reason: string
  inspectorName: string
  photoUrl: string | null
  documentUrl: string | null
}

interface SupplierDefectItem {
  supplierName: string
  totalReceivedKg: number
  acceptedKg: number
  rejectedKg: number
  rejectionRatePercent: number
  totalDeliveriesCount: number
  rejectedActsCount: number
  reasons: Record<string, number>
  dailyBreakdown: {
    date: string
    receivedKg: number
    rejectedKg: number
    acts: RejectionActItem[]
  }[]
}

interface FifoExceptionItem {
  id: number
  transferNumber: string
  productName: string
  issuedQuantity: number
  unit: string
  originalFifoBatchNumber: string
  selectedBatchNumber: string
  exceptionReason: string
  authorizedByQcName: string
  executedByWarehouseManager: string
  timestamp: string
  evidenceUrl: string | null
}

interface ActiveBatchItem {
  batchId: number
  batchNumber: string
  productName: string
  supplierName: string
  quantity: number
  unit: string
  receivedAt: string
  expirationDate: string | null
}

interface Props {
  suppliers: SupplierDefectItem[]
  fifoExceptions: FifoExceptionItem[]
  activeFifoQueue: ActiveBatchItem[]
  lang: string
}

export default function SupplierAndFifoAuditPanel({
  suppliers = [],
  fifoExceptions = [],
  activeFifoQueue = [],
  lang,
}: Props) {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedAct, setSelectedAct] = useState<RejectionActItem | null>(null)

  return (
    <div className="space-y-6">
      {/* SECTION 1: SUPPLIER DEFECT ANALYSIS (Requirement 8: Supplier -> Period -> Day -> Rejection Act -> Reason & Evidence) */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-dark-750 bg-slate-50/70 dark:bg-dark-850/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {lang === 'ru'
                  ? 'Анализ брака по поставщикам (Поставщик → День → Акт отказа → Причина и доказательства)'
                  : "Ta'minotchilar bo'yicha brak tahlili (Ta'minotchi → Kun → Rad etish akti → Sabab va dalillar)"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ru'
                  ? 'Отклонённые партии получают номер акта отказа и не включаются в складской остаток'
                  : "Rad etilgan partiyalarga rad etish akti beriladi va ular foydalanishga yaroqli ombor qoldig'iga kiritilmaydi"}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200/80 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
            {suppliers.length} {lang === 'ru' ? 'поставщиков' : "ta ta'minotchi"}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-800">
          {suppliers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              {lang === 'ru' ? 'За выбранный период данных по поставщикам нет' : "Tanlangan davrda ta'minotchilar bo'yicha ma'lumot topilmadi"}
            </div>
          ) : (
            suppliers.map((sup) => {
              const isOpen = selectedSupplier === sup.supplierName
              return (
                <div key={sup.supplierName} className="text-xs">
                  {/* Level 1: Supplier Summary Row */}
                  <div
                    onClick={() => {
                      setSelectedSupplier(isOpen ? null : sup.supplierName)
                      setSelectedDay(null)
                    }}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-dark-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown size={16} className="text-emerald-600" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-sm">{sup.supplierName}</div>
                        <div className="text-[11px] text-slate-500">
                          {lang === 'ru' ? 'Всего поставок:' : 'Jami yetkazib berishlar:'} {sup.totalDeliveriesCount} ta |{' '}
                          {lang === 'ru' ? 'Актов отказа:' : 'Rad etish aktlari:'}{' '}
                          <b className={sup.rejectedActsCount > 0 ? 'text-rose-600' : 'text-slate-600'}>
                            {sup.rejectedActsCount} ta
                          </b>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-right font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {lang === 'ru' ? 'Всего поступило' : 'Jami kelgan'}
                        </span>
                        <b className="text-slate-800 dark:text-slate-200">{sup.totalReceivedKg.toLocaleString()} kg</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {lang === 'ru' ? 'Принято' : 'Qabul qilingan'}
                        </span>
                        <b className="text-emerald-600 dark:text-emerald-400">{sup.acceptedKg.toLocaleString()} kg</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {lang === 'ru' ? 'Отклонено (Брак)' : 'Rad etilgan (Brak)'}
                        </span>
                        <b className={sup.rejectedKg > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                          {sup.rejectedKg.toLocaleString()} kg ({sup.rejectionRatePercent}%)
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Level 2: Daily Breakdown & Rejection Acts */}
                  {isOpen && (
                    <div className="bg-slate-50/70 dark:bg-dark-850/60 px-6 py-4 border-t border-slate-100 dark:border-dark-800 space-y-3">
                      {Object.keys(sup.reasons).length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            {lang === 'ru' ? 'Основные причины:' : 'Asosiy brak sabablari:'}
                          </span>
                          {Object.entries(sup.reasons).map(([r, kg]) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold"
                            >
                              {r}: {kg.toLocaleString()} kg
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        {sup.dailyBreakdown.map((day) => {
                          const dayKey = `${sup.supplierName}_${day.date}`
                          const dayOpen = selectedDay === dayKey || day.acts.length > 0
                          return (
                            <div
                              key={day.date}
                              className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 p-3"
                            >
                              <div
                                onClick={() => setSelectedDay(selectedDay === dayKey ? null : dayKey)}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                                  <Clock size={13} className="text-slate-400" />
                                  <span>{day.date}</span>
                                  {day.acts.length > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 text-[10px]">
                                      {day.acts.length} ta rad etish akti
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[11px] flex items-center gap-3">
                                  <span>Kelgan: {day.receivedKg.toLocaleString()} kg</span>
                                  {day.rejectedKg > 0 && (
                                    <span className="text-rose-600 font-bold">
                                      Rad etilgan: {day.rejectedKg.toLocaleString()} kg
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Level 3: Exact Rejection Acts on that Day */}
                              {dayOpen && day.acts.length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-dark-800 space-y-2">
                                  {day.acts.map((act) => (
                                    <div
                                      key={act.id}
                                      onClick={() => setSelectedAct(act)}
                                      className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 flex flex-wrap items-center justify-between gap-2 hover:border-rose-400 cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                          <FileText size={13} />
                                          <span>{act.rejectionActNumber}</span>
                                          <span className="text-slate-700 dark:text-slate-200">— {act.productName}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                          Sabab: <b>{act.reason}</b> | Tekshirgan QC: <b>{act.inspectorName}</b>
                                        </div>
                                      </div>
                                      <div className="text-right font-mono">
                                        <span className="font-black text-rose-600 block">
                                          -{act.rejectedKg.toLocaleString()} kg
                                        </span>
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 underline font-sans">
                                          Dalilni ko‘rish →
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* SECTION 2: FIFO / FEFO QUEUE & QC-AUTHORIZED CONTROLLED EXCEPTIONS (Requirement 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controlled Exceptions Card */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 bg-amber-50/50 dark:bg-dark-850/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'ru'
                    ? 'Исключения из FIFO с разрешения ОКК'
                    : 'Sifat nazorati (QC) ruxsati bilan FIFO/FEFO istisnolari'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ru'
                    ? 'Случаи выдачи другой партии по решению контроля качества'
                    : 'Asl navbatdagi partiya o‘rniga QC tasdig‘i bilan boshqa partiya berilgan holatlar'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              {fifoExceptions.length} ta
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-dark-800 max-h-80 overflow-y-auto custom-scrollbar">
            {fifoExceptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {lang === 'ru'
                  ? 'Все выдачи со склада выполнены строго по очереди FIFO/FEFO (исключений нет)'
                  : 'Barcha ombor chiqimlari qat’iy FIFO/FEFO navbati bo‘yicha bajarilgan (istisnolar yo‘q)'}
              </div>
            ) : (
              fifoExceptions.map((ex) => (
                <div key={ex.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>
                      {ex.transferNumber} — {ex.productName} ({ex.issuedQuantity} {ex.unit})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ex.timestamp).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    Asl FIFO partiya: <b>#{ex.originalFifoBatchNumber}</b> → Tanlangan partiya:{' '}
                    <b>#{ex.selectedBatchNumber}</b>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Sabab: <b>{ex.exceptionReason}</b>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>
                      Ruxsat berdi (QC): <b className="text-emerald-600">{ex.authorizedByQcName}</b>
                    </span>
                    <span>
                      Bajardi (Ombor): <b>{ex.executedByWarehouseManager}</b>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active FIFO / FEFO Warehouse Batch Queue */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-dark-750 bg-emerald-50/50 dark:bg-dark-850/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'ru'
                    ? 'Текущая очередь партий на складе (FIFO/FEFO)'
                    : 'Ombordagi joriy partiyalar navbati (FIFO/FEFO)'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ru'
                    ? 'Принятые партии, отсортированные по очереди выдачи в производство'
                    : 'Ishlab chiqarishga birinchi berilishi shart bo‘lgan tasdiqlangan partiyalar'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              {activeFifoQueue.length} partiya
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-dark-800 max-h-80 overflow-y-auto custom-scrollbar">
            {activeFifoQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {lang === 'ru' ? 'Активных партий в WMS не найдено' : 'WMS jadvalida faol partiyalar topilmadi'}
              </div>
            ) : (
              activeFifoQueue.map((b, i) => (
                <div key={b.batchId} className="p-3 text-xs flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-800 font-mono text-[10px]">
                        #{i + 1}
                      </span>
                      <span>{b.productName}</span>
                      <span className="font-mono text-emerald-600">Partiya #{b.batchNumber}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Ta&apos;minotchi: {b.supplierName} | Qabul: {b.receivedAt}
                      {b.expirationDate ? ` | Muddati: ${b.expirationDate}` : ''}
                    </div>
                  </div>
                  <b className="font-mono text-slate-900 dark:text-white">
                    {b.quantity.toLocaleString()} {b.unit}
                  </b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Level 4 Modal: Rejection Act Evidence & Accountability Details */}
      {selectedAct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-750 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600">
                  Layer 4: Rad etish dalolatnomasi va Dalillar
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedAct.rejectionActNumber} — {selectedAct.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAct(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-dark-850 p-3.5 rounded-2xl">
              <div>
                <span className="text-slate-400 block">Ta&apos;minotchi:</span>
                <b className="text-slate-900 dark:text-white">{selectedAct.supplierName}</b>
              </div>
              <div>
                <span className="text-slate-400 block">Sana:</span>
                <b className="text-slate-900 dark:text-white">{selectedAct.actDate}</b>
              </div>
              <div>
                <span className="text-slate-400 block">Rad etilgan miqdor:</span>
                <b className="text-rose-600 font-mono">{selectedAct.rejectedKg.toLocaleString()} kg</b>
              </div>
              <div>
                <span className="text-slate-400 block">Qabul qilingan qism:</span>
                <b className="text-emerald-600 font-mono">{selectedAct.acceptedKg.toLocaleString()} kg</b>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Rad etish sababi:</span>
                <b className="text-slate-900 dark:text-white">{selectedAct.reason}</b>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Tekshirgan Sifat Nazoratchisi (QC):</span>
                <b className="text-slate-900 dark:text-white">{selectedAct.inspectorName}</b>
              </div>
            </div>

            {(selectedAct.photoUrl || selectedAct.documentUrl) && (
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Biriktirilgan dalillar:</span>
                <div className="flex gap-2">
                  {selectedAct.photoUrl && (
                    <a
                      href={selectedAct.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold"
                    >
                      <span>Foto-dalilni ochish</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {selectedAct.documentUrl && (
                    <a
                      href={selectedAct.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold"
                    >
                      <span>Hujjatni ochish</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

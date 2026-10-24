'use client'

import React, { useState } from 'react'
import {
  BookOpen,
  Scale,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calculator,
  X,
  Info,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'units' | 'products' | 'standards' | 'calc'
}

export default function QCInspectorGuideModal({ isOpen, onClose, initialTab = 'units' }: Props) {
  const { formatDual, lang } = useLanguage()
  const [tab, setTab] = useState<'units' | 'products' | 'standards' | 'calc'>(initialTab)

  // Interactive calculator state
  const [calcGrams, setCalcGrams] = useState<string>('1004')
  const [calcKg, setCalcKg] = useState<string>('1.004')

  if (!isOpen) return null

  // Calculator logic
  const handleGramsChange = (val: string) => {
    setCalcGrams(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setCalcKg((num / 1000).toFixed(4).replace(/\.?0+$/, ''))
    } else {
      setCalcKg('')
    }
  }

  const handleKgChange = (val: string) => {
    setCalcKg(val)
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setCalcGrams(String(Math.round(num * 1000)))
    } else {
      setCalcGrams('')
    }
  }

  const parsedGrams = parseFloat(calcGrams) || 0
  const parsedKg = parseFloat(calcKg) || 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-enter"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-dark-750 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <BookOpen size={20} className="text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {formatDual("Direktor talabi", "Требование директора", "Director Requirement")}
                </span>
                <span className="text-[10px] font-bold text-emerald-200">
                  FSSC 22000 & HACCP
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {formatDual(
                  "Sifat Nazoratchisi va Xodimlar uchun Yo'riqnoma & Qo'llanma",
                  "Инструкция и руководство для контролеров качества",
                  "QC Inspector & Staff Guide and Manual"
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-dark-800 flex gap-2 overflow-x-auto bg-slate-50 dark:bg-dark-850">
          <button
            onClick={() => setTab('units')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all border-b-2 ${
              tab === 'units'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-dark-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scale size={15} />
            <span>{formatDual("1. Birliklar va Hisoblash (g, kg, tn)", "1. Единицы и Расчет (г, кг, тн)", "1. Units & Math")}</span>
          </button>

          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all border-b-2 ${
              tab === 'products'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-dark-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck size={15} />
            <span>{formatDual("2. Mahsulot Nomlari Qoidasi", "2. Правила Названий Продукции", "2. Product Names")}</span>
          </button>

          <button
            onClick={() => setTab('standards')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all border-b-2 ${
              tab === 'standards'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-dark-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Thermometer size={15} />
            <span>{formatDual("3. Me'yorlar (Harorat / Dez)", "3. Нормы (Температура / Дез)", "3. Standards")}</span>
          </button>

          <button
            onClick={() => setTab('calc')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 rounded-t-xl transition-all border-b-2 ${
              tab === 'calc'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-dark-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calculator size={15} />
            <span>{formatDual("4. Jonli Konverter / Kalkulyator", "4. Живой Конвертер", "4. Unit Converter")}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
          {/* TAB 1: UNITS & CALCULATIONS */}
          {tab === 'units' && (
            <div className="space-y-6">
              {/* Alert Notice */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                <ShieldAlert size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-rose-700 dark:text-rose-300 text-sm">
                    {formatDual("Qat'iy Talab: Xato kiritilgan ma'lumot saqlanmaydi!", "Строгое Требование: Ошибочные данные блокируются!", "Strict Rule: Faulty data will be rejected!")}
                  </h4>
                  <p className="text-rose-600/90 dark:text-rose-300/80 leading-normal">
                    {formatDual(
                      "Direktor topshirig'iga binoan, tizimda gramm, kilogramm va tonnani adashtirish, '1k' kabi noto'g'ri qisqartmalar yozish qat'iyan man etiladi. Tizim xato aniqlasa, uni to'g'irlamaguningizcha 'Saqlash' tugmasi bosilmaydi!",
                      "По распоряжению директора путать граммы, килограммы и тонны, а также писать сокращения вида '1k' строго запрещено. Кнопка 'Сохранить' заблокирована до устранения ошибки!",
                      "Per director orders, confusing grams/kg/tons or writing abbreviations like '1k' is forbidden. Save is disabled until errors are corrected!"
                    )}
                  </p>
                </div>
              </div>

              {/* Units Table */}
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <Scale size={16} className="text-emerald-500" />
                  {formatDual("O'lchov Birliklarining Asosiy Formulasi", "Базовые формулы единиц измерения", "Basic Unit Formulas")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">1 Kilogramm</span>
                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">1 kg = 1,000 g</div>
                    <p className="text-[11px] text-slate-500">1 kg har doim 1000 grammga teng</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">1 Tonna</span>
                    <div className="text-lg font-black text-blue-700 dark:text-blue-300">1 tn = 1,000 kg</div>
                    <p className="text-[11px] text-slate-500">1,000,000 grammga teng</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-center space-y-1">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Yarim Kilo</span>
                    <div className="text-lg font-black text-purple-700 dark:text-purple-300">0.5 kg = 500 g</div>
                    <p className="text-[11px] text-slate-500">500 gramm deb kiritiladi</p>
                  </div>
                </div>
              </div>

              {/* Real World Mistake vs Correct Table */}
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  {formatDual("Eng Ko'p Qilinadigan Xatolar va Ularni To'g'rilash", "Типичные ошибки и как их исправить", "Common Mistakes & Fixes")}
                </h3>
                <div className="border border-slate-200 dark:border-dark-750 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase border-b border-slate-200 dark:border-dark-750">
                        <th className="p-3">Holat</th>
                        <th className="p-3 text-rose-600">❌ Xato (Taqiqlanadi)</th>
                        <th className="p-3 text-emerald-600">✅ To'g'ri ko'rinishi</th>
                        <th className="p-3">Izoh va Sababi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Aysberg 1 kg paket (FSSC vazn)</td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">104 g yoki 1 g</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">1004 g</td>
                        <td className="p-3 text-slate-500">1 kg = 1000g. Agar tarozi 1 kg 4 g ko'rsatsa, u 1004 g bo'ladi. 104 g yozilsa, 90% kamomad chiqadi!</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Mahsulot nomi</td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">aysberg 1k, pom 1</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">Aysberg (1 kg paket)</td>
                        <td className="p-3 text-slate-500">Qisqartmalar bazada chalkashlik keltirib chiqaradi. Doim to'liq nom yoziladi yoki ro'yxatdan tanlanadi.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Kiruvchi xomashyo (Akt)</td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">1 (kg)</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">1000 (kg) yoki 1,500 kg</td>
                        <td className="p-3 text-slate-500">Furada 1 kg sabzi kelmaydi! Agar 1 tonna kelgan bo'lsa, '1000' kg deb kiritish shart!</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">500 grammlik paket (Koul Slou)</td>
                        <td className="p-3 font-mono font-bold text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">5 g yoki 50 g</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">504 g (yoki 498 g)</td>
                        <td className="p-3 text-slate-500">500 g nominal uchun me'yor: 490 g dan 510 g gacha ruxsat beriladi (±10 g).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT NAMES AND PACKAGING RULES */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-emerald-500" />
                  {formatDual("Standart Mahsulotlar va Qadoqlash Ro'yxati", "Стандартный перечень продукции и упаковки", "Standard Products & Packaging")}
                </h3>
                <p className="text-slate-500 text-xs mb-3">
                  {formatDual(
                    "Har bir mahsulotni kiritayotganda quyidagi standart nom va qadoq vazniga qat'iy rioya qiling:",
                    "При вводе каждой позиции строго соблюдайте следующие наименования и вес:",
                    "Strictly follow these standardized names and target weights:"
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🥬 Aysberg (1 kg paket)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">Nominal: 1000 g</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 6 ta paket (6 kg). Ruxsat etilgan vazn: 990 g – 1010 g.</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🥗 Aysberg salati 500g</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">Nominal: 500 g</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 12 ta paket (6 kg). Ruxsat etilgan vazn: 490 g – 510 g.</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🍅 Pomidor (saralangan 1 kg)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">Nominal: 1000 g</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 6 ta paket (6 kg). Ruxsat etilgan vazn: 990 g – 1010 g.</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🥒 Bodring (saralangan 1 kg)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">Nominal: 1000 g</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 6 ta paket (6 kg). Ruxsat etilgan vazn: 990 g – 1010 g.</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🍋 Limon (qadoqlangan 2 dona)</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">Nominal: 2 dona</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 12 paket (jami 24 dona). Har 5-paket ko'rikdan o'tkaziladi.</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-1">
                  <div className="flex flex-wrap gap-1 items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">🧅 Oq piyoz (0.5 kg paket)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">Nominal: 500 g</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 qutida: 10 ta paket (5 kg). Ruxsat etilgan vazn: 490 g – 510 g.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STANDARDS (TEMPERATURE, CHLORINE, PH) */}
          {tab === 'standards' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                  <Thermometer size={16} className="text-emerald-500" />
                  {formatDual("FSSC 22000 & HACCP Chegaraviy Me'yorlar Jadvali", "Таблица критических норм FSSC 22000 & HACCP", "FSSC 22000 & HACCP Critical Limits")}
                </h3>
                <p className="text-slate-500 text-xs mb-3">
                  Ushbu chegaralardan chetga chiqish avtomatik rad etish yoki tuzatish chorasini talab qiladi:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 space-y-2">
                  <div className="font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                    <span>🧪 Dezinfeksiya Eritmasi (KKT-1)</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    <li>• <strong>Xlor konsentratsiyasi:</strong> 50 – 100 ppm (maksimal 150 ppm)</li>
                    <li>• <strong>pH ko'rsatkichi:</strong> 6.5 – 7.5 oralig'ida</li>
                    <li>• <strong>Yuvish suvi harorati:</strong> +10°C dan +20°C gacha</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 space-y-2">
                  <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <span>❄️ Harorat Rejimlari</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    <li>• <strong>Yangi sabzavotlar (Aysberg, Pomidor):</strong> +2°C dan +6°C gacha</li>
                    <li>• <strong>Muzlatilgan mevalar (IQF):</strong> -18°C dan -22°C gacha</li>
                    <li>• <strong>Yuk mashinasi (Transport):</strong> Maksimal +6°C</li>
                    <li>• <strong>Sex ichki harorati:</strong> +12°C dan +16°C gacha</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE CALCULATOR & CONVERTER */}
          {tab === 'calc' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                  <Calculator size={16} className="text-emerald-500" />
                  {formatDual("Jonli Birliklar Kalkulyatori (Gramm ⇄ Kilogramm ⇄ Tonna)", "Живой калькулятор единиц (Грамм ⇄ Килограмм ⇄ Тонна)", "Live Unit Converter")}
                </h3>
                <p className="text-slate-500 text-xs">
                  Tarozi ko'rsatkichini kiriting — tizim sizga uni qanday yozish kerakligini ko'rsatadi:
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Grammda (g):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calcGrams}
                        onChange={(e) => handleGramsChange(e.target.value)}
                        placeholder="Masalan: 1004"
                        className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono text-base font-bold outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">g</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Kilogrammda (kg):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        value={calcKg}
                        onChange={(e) => handleKgChange(e.target.value)}
                        placeholder="Masalan: 1.004"
                        className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono text-base font-bold outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                {/* Calculation breakdown result */}
                <div className="p-4 rounded-xl bg-white dark:bg-dark-900 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hisob natijasi va To'g'ri ifodalanishi:
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {parsedGrams.toLocaleString()} gramm
                    </span>
                    <ArrowRight size={16} className="text-slate-400" />
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {parsedKg} kg
                    </span>
                    <ArrowRight size={16} className="text-slate-400" />
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {(parsedKg / 1000).toFixed(6).replace(/\.?0+$/, '')} tonna
                    </span>
                  </div>

                  {parsedGrams === 104 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <XCircle size={16} className="text-rose-600 shrink-0" />
                      <span>Xatolik aniqlandi: 104 gramm bu 1 kg emas, atigi 100 gramm degani! Agar 1 kg 4 g nazarda tutilgan bo'lsa, '1004' deb yozing!</span>
                    </div>
                  )}

                  {parsedGrams >= 990 && parsedGrams <= 1010 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>A'lo daraja: Ushbu vazn 1 kg paket uchun to'liq me'yorda (±10 g ruxsat ichida)!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-850 flex flex-wrap gap-2 items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {formatDual(
              "Savollar bo'lsa bosh sifat nazoratchisiga murojaat qiling",
              "При вопросах обращайтесь к главному контролеру качества",
              "Contact chief QC inspector for assistance"
            )}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            {formatDual("Tushundim, yopish", "Понятно, закрыть", "Got it, close")}
          </button>
        </div>
      </div>
    </div>
  )
}

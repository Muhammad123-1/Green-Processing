'use client'

import { useState, useEffect } from 'react'
import {
  Factory,
  Settings2,
  PackageCheck,
  FileSignature,
  Play,
  Save,
  Loader2,
  ArrowRight,
  CheckCircle2,
  History,
  X,
  BookOpen,
  AlertOctagon,
  Plus,
  Thermometer,
  ShieldAlert,
  GitBranch,
  Layers,
  Sparkles,
  Search,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Ishlab Chiqarish & Sex Nazorati",
    subtitle: "Zavod ishlab chiqarish jarayoni, Traceability (Partiya zanjiri), Chiqish normasi (Yield %) va Liniyalar nazorati",
    btnNewBOM: "Yangi BOM (Retsept)",
    btnProduce: "Ishlab chiqarishni boshlash",
    tabOrders: "Ishlab Chiqarish & Partiya Zanjiri (Traceability)",
    tabProcessQC: "Sex Nazoratchisi Parametrlari (Liniyalar)",
    tabBOMs: "BOM (Retsepturalar)",
    colDate: "Sana / Buyruq",
    colProduct: "Tayyor Mahsulot",
    colQty: "Reja / Amalda",
    colYield: "Chiqish Normasi (Yield)",
    colBatchChain: "Partiya Zanjiri (Traceability)",
    colLine: "Liniya / Nazoratchi",
    colStatus: "Holat",
    emptyOrdersTitle: "Ishlab chiqarish tarixi bo'sh",
    emptyOrdersSub: "Yangi partiya ishlab chiqarishni boshlang",
    emptyBOMs: "Hech qanday BOM (Retseptura) topilmadi",
    statusDone: "Tugallangan",
    bomNorm: "Norma",
    reqMaterials: "Kerakli Xomashyolar (BOM):",
    modalBOMTitle: "Yangi BOM Yaratish",
    modalBOMSub: "Yangi tayyor mahsulot uchun retseptura va xomashyo sarpfi",
    outProduct: "Tayyor Mahsulot (SKU)",
    yield: "Chiqish Normasi",
    addMat: "Xomashyo Qo'shish",
    select: "— Tanlang —",
    save: "Saqlash",
    cancel: "Bekor qilish",
    modalProdTitle: "Ishlab Chiqarish Topshirig'i (Sex)",
    selectBOM: "Qaysi mahsulot ishlab chiqariladi?",
    planQty: "Rejalashtirilgan miqdor",
    actualQty: "Amaldagi chiqish miqdori",
    lineSelect: "Ishlab chiqarish liniyasi",
    supervisorInput: "Sex Nazoratchisi (FIO)",
    fefoInfo: "Tizim FEFO (First Expired, First Out) usulida ombordan eng birinchi muddatli xomashyoni avtomatik hisobdan chiqaradi va partiya zanjirini bog'laydi.",
    start: "Boshlash & Saqlash",
    msgSuccess: "Ishlab chiqarish tugallandi! Mahsulot omborga kirim qilindi.",
    msgBomSaved: "BOM (Retseptura) saqlandi!",
    msgFillAll: "Barcha maydonlarni to'ldiring",
    msgError: "Xatolik yuz berdi"
  },
  ru: {
    title: "Производство и Контроль Цеха",
    subtitle: "Производственный процесс, Прослеживаемость (Traceability), Норма выхода (Yield %) и контроль линий",
    btnNewBOM: "Новый BOM (Рецепт)",
    btnProduce: "Начать производство",
    tabOrders: "Производство и Прослеживаемость (Traceability)",
    tabProcessQC: "Параметры Контролера Цеха (Линии)",
    tabBOMs: "BOM (Рецептуры)",
    colDate: "Дата / Заказ",
    colProduct: "Готовый Продукт",
    colQty: "План / Факт",
    colYield: "Норма выхода (Yield)",
    colBatchChain: "Цепочка партий (Traceability)",
    colLine: "Линия / Контролер",
    colStatus: "Статус",
    emptyOrdersTitle: "История производства пуста",
    emptyOrdersSub: "Начните производство новой партии",
    emptyBOMs: "BOM (Рецептуры) не найдены",
    statusDone: "Завершено",
    bomNorm: "Норма",
    reqMaterials: "Необходимое сырье (BOM):",
    modalBOMTitle: "Создание нового BOM",
    modalBOMSub: "Спецификация и расход сырья для готового продукта",
    outProduct: "Готовый Продукт (SKU)",
    yield: "Норма выхода",
    addMat: "Добавить сырье",
    select: "— Выберите —",
    save: "Сохранить",
    cancel: "Отмена",
    modalProdTitle: "Производственное Задание (Цех)",
    selectBOM: "Какой продукт производим?",
    planQty: "Запланированное количество",
    actualQty: "Фактическое количество выхода",
    lineSelect: "Производственная линия",
    supervisorInput: "Контролер цеха (ФИО)",
    fefoInfo: "Система автоматически спишет сырье со склада по методу FEFO и сформирует сквозную цепочку прослеживаемости партий.",
    start: "Начать и Сохранить",
    msgSuccess: "Производство завершено! Продукт добавлен на склад.",
    msgBomSaved: "BOM (Рецептура) сохранена!",
    msgFillAll: "Заполните все поля",
    msgError: "Произошла ошибка"
  },
  en: {
    title: "Production & Workshop Control",
    subtitle: "Factory production process, Batch Traceability, Yield Rate %, and Process Line monitoring",
    btnNewBOM: "New BOM (Recipe)",
    btnProduce: "Start Production",
    tabOrders: "Production & Batch Traceability",
    tabProcessQC: "Workshop Process Logs (Lines)",
    tabBOMs: "BOMs (Recipes)",
    colDate: "Date / Order",
    colProduct: "Finished Product",
    colQty: "Plan / Actual",
    colYield: "Yield Rate",
    colBatchChain: "Batch Chain (Traceability)",
    colLine: "Line / Supervisor",
    colStatus: "Status",
    emptyOrdersTitle: "Production history is empty",
    emptyOrdersSub: "Start a new batch production",
    emptyBOMs: "No BOMs (Recipes) found",
    statusDone: "Completed",
    bomNorm: "Yield",
    reqMaterials: "Required Materials (BOM):",
    modalBOMTitle: "Create New BOM",
    modalBOMSub: "Specification and material consumption for new product",
    outProduct: "Finished Product (SKU)",
    yield: "Base Yield",
    addMat: "Add Material",
    select: "— Select —",
    save: "Save",
    cancel: "Cancel",
    modalProdTitle: "Production Order (Shop Floor)",
    selectBOM: "Which product to produce?",
    planQty: "Planned quantity",
    actualQty: "Actual output quantity",
    lineSelect: "Production line",
    supervisorInput: "Workshop Supervisor (Name)",
    fefoInfo: "System will automatically consume raw materials from warehouse using FEFO and create batch traceability links.",
    start: "Start & Save",
    msgSuccess: "Production finished! Product added to warehouse.",
    msgBomSaved: "BOM (Recipe) saved successfully!",
    msgFillAll: "Fill all fields",
    msgError: "An error occurred"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function FactoryProductionContent() {
  const { lang } = useLanguage()
  const currentLang = (lang || 'uz') as LangType
  const l = tBase[currentLang] || tBase.uz

  const [activeTab, setActiveTab] = useState<'orders' | 'processQC' | 'boms'>('orders')
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [processLogs, setProcessLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showBomModal, setShowBomModal] = useState(false)
  const [showProdModal, setShowProdModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)

  const [bomForm, setBomForm] = useState({
    outputProductId: '',
    baseYieldQty: '1',
    ingredients: [] as { inputProductId: string, requiredQty: string }[]
  })

  const [prodForm, setProdForm] = useState({
    recipeId: '',
    plannedOutput: '',
    actualOutput: '',
    lineName: '1-Liniya: Salat Yuvish & Kesish',
    supervisorName: '',
    notes: ''
  })

  const [processForm, setProcessForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    cleanZoneTemp: '12.0',
    dirtyZoneTemp: '18.5',
    pfColeCarrotBatch: '',
    pfColeCabbageBatch: '',
    pfIcebergBatch: '',
    gpColeTemp: '4.0',
    gpIcebergTemp: '3.5',
    correctiveAction: '-',
    responsible: 'Sex Nazoratchisi',
    status: 'APPROVED',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [resR, resP, resO, resQC] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/products'),
        fetch('/api/production'),
        fetch('/api/inspector/process-logs')
      ])
      
      if (resR.ok) setRecipes(await resR.json())
      if (resP.ok) setProducts(await resP.json())
      if (resO.ok) setOrders(await resO.json())
      if (resQC.ok) setProcessLogs(await resQC.json())
    } catch {
      toast.error(l.msgError)
    } finally {
      setLoading(false)
    }
  }

  const addMatRow = () => {
    setBomForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { inputProductId: '', requiredQty: '' }]
    }))
  }

  const updateMat = (index: number, field: string, value: string) => {
    const newIng = [...bomForm.ingredients]
    newIng[index] = { ...newIng[index], [field]: value }
    setBomForm(prev => ({ ...prev, ingredients: newIng }))
  }

  const removeMat = (index: number) => {
    const newIng = [...bomForm.ingredients]
    newIng.splice(index, 1)
    setBomForm(prev => ({ ...prev, ingredients: newIng }))
  }

  async function handleSaveBOM() {
    if (!bomForm.outputProductId || !bomForm.baseYieldQty || bomForm.ingredients.length === 0) {
      toast.error(l.msgFillAll)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomForm)
      })
      if (res.ok) {
        toast.success(l.msgBomSaved)
        setShowBomModal(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgError)
    } finally {
      setSaving(false)
    }
  }

  async function handleProduce() {
    if (!prodForm.recipeId || !prodForm.plannedOutput) {
      toast.error(l.msgFillAll)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodForm)
      })
      if (res.ok) {
        toast.success(l.msgSuccess)
        setShowProdModal(false)
        setProdForm({
          recipeId: '',
          plannedOutput: '',
          actualOutput: '',
          lineName: '1-Liniya: Salat Yuvish & Kesish',
          supervisorName: '',
          notes: ''
        })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgError)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProcessQC(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inspector/process-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processForm)
      })
      if (res.ok) {
        toast.success('Sex parametrlari saqlandi!')
        setShowProcessModal(false)
        fetchData()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Saqlashda xatolik')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-enter space-y-6">
      {/* Industrial Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
              <Factory size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                  Sex Nazoratchisi & MRP II
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {l.title}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm mt-0.5">
                {l.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBomModal(true)}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-2.5 rounded-xl border border-dark-600 transition-all text-sm font-semibold"
            >
              <Settings2 size={16} />
              {l.btnNewBOM}
            </button>
            <button 
              onClick={() => setShowProdModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm font-bold"
            >
              <Play size={16} fill="currentColor" />
              {l.btnProduce}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-900/90 p-1.5 rounded-2xl border border-dark-700/80 w-max overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch size={16} /> {l.tabOrders}
        </button>
        <button
          onClick={() => setActiveTab('processQC')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'processQC' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Thermometer size={16} /> {l.tabProcessQC}
        </button>
        <button
          onClick={() => setActiveTab('boms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'boms' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen size={16} /> {l.tabBOMs}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-dark-800/50 border-b border-dark-750 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">{l.colDate}</th>
                    <th className="p-4">{l.colProduct}</th>
                    <th className="p-4 text-center">{l.colQty}</th>
                    <th className="p-4 text-center">{l.colYield}</th>
                    <th className="p-4">{l.colBatchChain}</th>
                    <th className="p-4">{l.colLine}</th>
                    <th className="p-4 text-center">{l.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-slate-500">
                        <Factory size={48} className="mx-auto text-dark-600 mb-3 opacity-30" />
                        <p className="text-base font-bold text-white">{l.emptyOrdersTitle}</p>
                        <p className="text-xs text-slate-400 mt-1">{l.emptyOrdersSub}</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-bold text-indigo-400 text-xs">
                            {o.orderNumber || `ORD-${o.id}`}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-white text-sm">
                            {o.recipe?.outputProduct?.name || '—'}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {o.recipe?.outputProduct?.code || 'SKU'}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-dark-800 px-3 py-1 rounded-lg border border-dark-700 font-mono text-xs">
                            <span className="text-slate-400">Reja: {o.plannedOutput}</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-emerald-400 font-bold">Fakt: {o.actualOutput || o.plannedOutput} {o.recipe?.outputProduct?.unit}</span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs font-black ${
                            (o.yieldPercent || 100) >= 92 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {o.yieldPercent ? `${o.yieldPercent}%` : '100%'}
                          </span>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="space-y-1 text-xs font-mono">
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="text-slate-500 font-sans text-[10px]">TAYYOR:</span>
                              {o.finishedBatchCode || `FG-${o.id}`}
                            </div>
                            {o.rawBatchCode && (
                              <div className="text-slate-400 truncate flex items-center gap-1" title={o.rawBatchCode}>
                                <span className="text-slate-500 font-sans text-[10px]">XOMASHYO:</span>
                                {o.rawBatchCode}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-xs">
                          <div className="font-semibold text-slate-200">{o.lineName || '1-Sex / Asosiy Liniya'}</div>
                          <div className="text-slate-400 text-[11px]">{o.supervisorName || 'Sex Nazoratchisi'}</div>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                            <CheckCircle2 size={13} /> {l.statusDone}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'processQC' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-dark-900 border border-dark-750 p-4 rounded-2xl">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Thermometer className="text-indigo-400" size={18} />
                  Sex Texnologik Parametrlari va Liniya Nazorati
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toza va nopok zonalar haroratlari, P/F partiya raqamlari va tayyor mahsulot holati
                </p>
              </div>
              <button
                onClick={() => setShowProcessModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus size={16} />
                Yangi Nazorat Yozuvi
              </button>
            </div>

            <div className="bg-dark-900 border border-dark-750 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-dark-800/50 border-b border-dark-750 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Sana & Vaqt</th>
                      <th className="p-4 text-center">Toza Zona (°C)</th>
                      <th className="p-4 text-center">Nopok Zona (°C)</th>
                      <th className="p-4">P/F Partiya Raqamlari</th>
                      <th className="p-4 text-center">GP Haroratlari</th>
                      <th className="p-4">Mas'ul & Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-750">
                    {processLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">
                          Sex nazoratchisi jurnali bo'sh
                        </td>
                      </tr>
                    ) : (
                      processLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-dark-800/30 transition-colors">
                          <td className="p-4 font-mono text-xs">
                            <div className="font-bold text-white">{log.date}</div>
                            <div className="text-indigo-400 font-semibold">{log.time}</div>
                          </td>

                          <td className="p-4 text-center font-mono font-bold">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                              {log.cleanZoneTemp !== null ? `${log.cleanZoneTemp}°C` : '—'}
                            </span>
                          </td>

                          <td className="p-4 text-center font-mono font-bold">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                              {log.dirtyZoneTemp !== null ? `${log.dirtyZoneTemp}°C` : '—'}
                            </span>
                          </td>

                          <td className="p-4 text-xs font-mono text-slate-300">
                            {log.pfIcebergBatch && <div>Айсберг: #{log.pfIcebergBatch}</div>}
                            {log.pfColeCarrotBatch && <div>Морковь: #{log.pfColeCarrotBatch}</div>}
                            {log.pfColeCabbageBatch && <div>Капуста: #{log.pfColeCabbageBatch}</div>}
                            {!log.pfIcebergBatch && !log.pfColeCarrotBatch && !log.pfColeCabbageBatch && <span className="text-slate-500">—</span>}
                          </td>

                          <td className="p-4 text-center text-xs font-mono">
                            {log.gpIcebergTemp && <div className="text-emerald-400">Айсберг: {log.gpIcebergTemp}°C</div>}
                            {log.gpColeTemp && <div className="text-emerald-400">Коул: {log.gpColeTemp}°C</div>}
                            {!log.gpIcebergTemp && !log.gpColeTemp && <span className="text-slate-500">—</span>}
                          </td>

                          <td className="p-4 text-xs">
                            <div className="font-bold text-white">{log.responsible || 'QC'}</div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {log.status === 'APPROVED' ? 'Qabul' : log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
              <div className="col-span-full p-16 text-center text-slate-500 bg-dark-900 rounded-3xl border border-dark-750">
                {l.emptyBOMs}
              </div>
            ) : (
              recipes.map(r => (
                <div key={r.id} className="group relative bg-dark-900 border border-dark-750 rounded-3xl p-6 hover:border-indigo-500/50 transition-all duration-300 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-white mb-1">{r.outputProduct?.name}</h3>
                      <span className="inline-block bg-dark-800 text-indigo-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-dark-600">
                        {l.bomNorm}: {r.baseYieldQty} {r.outputProduct?.unit}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <FileSignature size={18} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowRight size={12} className="text-indigo-400" /> {l.reqMaterials}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {r.ingredients.map((ing: any) => (
                        <div key={ing.id} className="flex items-center justify-between text-sm bg-dark-800/70 p-3 rounded-xl border border-dark-700">
                          <span className="font-medium text-slate-300">{ing.inputProduct?.name}</span>
                          <span className="font-bold text-white bg-dark-700 px-2 py-1 rounded text-xs font-mono">
                            {ing.requiredQty} {ing.inputProduct?.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal: New Production Order */}
      {showProdModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProdModal(false)}
        >
          <div 
            className="bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-dark-700 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Factory className="text-indigo-400" size={20} /> {l.modalProdTitle}
              </h2>
              <button onClick={() => setShowProdModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">{l.selectBOM} <span className="text-indigo-400">*</span></label>
                <select 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                  value={prodForm.recipeId}
                  onChange={e => setProdForm(prev => ({...prev, recipeId: e.target.value}))}
                >
                  <option value="">{l.select}</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.outputProduct?.name} (Norma: {r.baseYieldQty} {r.outputProduct?.unit})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">{l.planQty} <span className="text-indigo-400">*</span></label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-lg font-black text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={prodForm.plannedOutput}
                    onChange={e => setProdForm(prev => ({...prev, plannedOutput: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">{l.actualQty}</label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-lg font-black text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={prodForm.actualOutput}
                    onChange={e => setProdForm(prev => ({...prev, actualOutput: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">{l.lineSelect}</label>
                  <select 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs"
                    value={prodForm.lineName}
                    onChange={e => setProdForm(prev => ({...prev, lineName: e.target.value}))}
                  >
                    <option value="1-Liniya: Salat Yuvish & Kesish">1-Liniya: Salat Yuvish & Kesish</option>
                    <option value="2-Liniya: Sabzavotlarni Qayta Ishlash">2-Liniya: Sabzavotlarni Qayta Ishlash</option>
                    <option value="3-Liniya: Pasterizatsiya & Qadoqlash">3-Liniya: Pasterizatsiya & Qadoqlash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">{l.supervisorInput}</label>
                  <input 
                    type="text" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs"
                    placeholder="Nazoratchi FIO"
                    value={prodForm.supervisorName}
                    onChange={e => setProdForm(prev => ({...prev, supervisorName: e.target.value}))}
                  />
                </div>
              </div>

              <div className="bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/20">
                <p className="text-xs text-indigo-300 flex items-start gap-2 leading-relaxed">
                  <AlertOctagon size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                  <span>{l.fefoInfo}</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-dark-800/50 flex justify-end gap-3 border-t border-dark-800">
              <button onClick={() => setShowProdModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-dark-700">{l.cancel}</button>
              <button onClick={handleProduce} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />} {l.start}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Process QC Log (Liniya Harorati) */}
      {showProcessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProcessModal(false)}
        >
          <div 
            className="bg-dark-900 rounded-3xl w-full max-w-lg shadow-2xl border border-dark-700 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Thermometer className="text-indigo-400" size={20} /> Sex Texnologik Parametrlarini Kiritish
              </h2>
              <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProcessQC} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Sana</label>
                  <input 
                    type="date"
                    value={processForm.date}
                    onChange={e => setProcessForm({...processForm, date: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Vaqt</label>
                  <input 
                    type="text"
                    placeholder="HH:mm"
                    value={processForm.time}
                    onChange={e => setProcessForm({...processForm, time: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Toza Zona Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.cleanZoneTemp}
                    onChange={e => setProcessForm({...processForm, cleanZoneTemp: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nopok Zona Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.dirtyZoneTemp}
                    onChange={e => setProcessForm({...processForm, dirtyZoneTemp: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">P/F Айсберг № Partiya</label>
                  <input 
                    type="text"
                    placeholder="Masalan: B-202"
                    value={processForm.pfIcebergBatch}
                    onChange={e => setProcessForm({...processForm, pfIcebergBatch: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">GP Айсберг Harorati (°C)</label>
                  <input 
                    type="number" step="0.1"
                    value={processForm.gpIcebergTemp}
                    onChange={e => setProcessForm({...processForm, gpIcebergTemp: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-800">
                <button type="button" onClick={() => setShowProcessModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-dark-800">
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New BOM */}
      {showBomModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowBomModal(false)}
        >
          <div 
            className="bg-dark-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-dark-700 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings2 className="text-indigo-400" /> {l.modalBOMTitle}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{l.modalBOMSub}</p>
              </div>
              <button onClick={() => setShowBomModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">{l.outProduct}</label>
                  <select 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                    value={bomForm.outputProductId}
                    onChange={e => setBomForm(prev => ({...prev, outputProductId: e.target.value}))}
                  >
                    <option value="">{l.select}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">{l.yield}</label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                    placeholder="1" min="0.1" step="0.1"
                    value={bomForm.baseYieldQty}
                    onChange={e => setBomForm(prev => ({...prev, baseYieldQty: e.target.value}))}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-dark-800" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-300">{l.reqMaterials}</label>
                  <button 
                    onClick={addMatRow} 
                    className="flex items-center gap-1.5 text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-indigo-500/20"
                  >
                    <Plus size={16} /> {l.addMat}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {bomForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-dark-800 p-3 rounded-2xl border border-dark-700">
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-slate-400">{idx + 1}</div>
                      <select 
                        className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                        value={ing.inputProductId}
                        onChange={e => updateMat(idx, 'inputProductId', e.target.value)}
                      >
                        <option value="">{l.select}</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input 
                        type="number" 
                        className="w-28 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white text-center font-bold"
                        placeholder="0.0" step="0.01"
                        value={ing.requiredQty}
                        onChange={e => updateMat(idx, 'requiredQty', e.target.value)}
                      />
                      <button 
                        onClick={() => removeMat(idx)} 
                        className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-dark-800 flex justify-end gap-3 bg-dark-900/50">
              <button onClick={() => setShowBomModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-dark-800 transition-colors">{l.cancel}</button>
              <button onClick={handleSaveBOM} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {l.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

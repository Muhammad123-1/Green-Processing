'use client'

import { useState, useEffect } from 'react'
import { Factory, Settings2, PackageCheck, FileSignature, Play, Save, Loader2, ArrowRight, CheckCircle2, History, X, BookOpen, AlertOctagon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

const tBase = {
  uz: {
    title: "Ishlab Chiqarish",
    subtitle: "Zavod ishlab chiqarish jarayoni, BOM va MRP nazorati",
    btnNewBOM: "Yangi BOM (Retsept)",
    btnProduce: "Ishlab chiqarishni boshlash",
    tabOrders: "Ishlab chiqarish tarixi",
    tabBOMs: "BOM (Retsepturalar)",
    colDate: "Sana",
    colProduct: "Tayyor Mahsulot",
    colQty: "Miqdor",
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
    modalProdTitle: "Ishlab Chiqarish Topshirig'i",
    selectBOM: "Qaysi mahsulot ishlab chiqariladi?",
    planQty: "Rejalashtirilgan miqdor",
    fefoInfo: "Tizim FEFO (First Expired, First Out) usulida ombordan xomashyoni avtomatik hisobdan chiqaradi.",
    start: "Boshlash",
    msgSuccess: "Ishlab chiqarish tugallandi! Mahsulot omborga kirim qilindi.",
    msgBomSaved: "BOM (Retseptura) saqlandi!",
    msgFillAll: "Barcha maydonlarni to'ldiring",
    msgError: "Xatolik yuz berdi"
  },
  ru: {
    title: "Производство",
    subtitle: "Процесс производства, контроль BOM и MRP",
    btnNewBOM: "Новый BOM (Рецепт)",
    btnProduce: "Начать производство",
    tabOrders: "История производства",
    tabBOMs: "BOM (Рецептуры)",
    colDate: "Дата",
    colProduct: "Готовый Продукт",
    colQty: "Количество",
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
    modalProdTitle: "Производственное Задание",
    selectBOM: "Какой продукт производим?",
    planQty: "Запланированное количество",
    fefoInfo: "Система автоматически спишет сырье со склада по методу FEFO (First Expired, First Out).",
    start: "Начать",
    msgSuccess: "Производство завершено! Продукт добавлен на склад.",
    msgBomSaved: "BOM (Рецептура) сохранена!",
    msgFillAll: "Заполните все поля",
    msgError: "Произошла ошибка"
  },
  en: {
    title: "Production",
    subtitle: "Factory production process, BOM and MRP tracking",
    btnNewBOM: "New BOM (Recipe)",
    btnProduce: "Start Production",
    tabOrders: "Production History",
    tabBOMs: "BOMs (Recipes)",
    colDate: "Date",
    colProduct: "Finished Product",
    colQty: "Quantity",
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
    modalProdTitle: "Production Order",
    selectBOM: "Which product to produce?",
    planQty: "Planned quantity",
    fefoInfo: "System will automatically consume raw materials from warehouse using FEFO.",
    start: "Start",
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

  const [activeTab, setActiveTab] = useState<'orders' | 'boms'>('orders')
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showBomModal, setShowBomModal] = useState(false)
  const [showProdModal, setShowProdModal] = useState(false)

  const [bomForm, setBomForm] = useState({
    outputProductId: '',
    baseYieldQty: '1',
    ingredients: [] as { inputProductId: string, requiredQty: string }[]
  })

  const [prodForm, setProdForm] = useState({
    recipeId: '',
    plannedOutput: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [resR, resP, resO] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/products'),
        fetch('/api/production')
      ])
      
      if (resR.ok) setRecipes(await resR.json())
      if (resP.ok) setProducts(await resP.json())
      if (resO.ok) setOrders(await resO.json())
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

  return (
    <div className="flex flex-col h-full animate-enter">
      {/* Industrial Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-dark-800 to-slate-900 rounded-3xl p-8 mb-8 shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Factory size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {l.title}
              </h1>
              <p className="text-slate-400 mt-1 font-medium">
                {l.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowBomModal(true)}
              className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 text-white px-5 py-2.5 rounded-xl border border-dark-600 transition-all font-semibold"
            >
              <Settings2 size={18} />
              {l.btnNewBOM}
            </button>
            <button 
              onClick={() => setShowProdModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all font-bold"
            >
              <Play size={18} fill="currentColor" />
              {l.btnProduce}
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-dark-800 p-1.5 rounded-2xl w-max mb-6 border border-dark-700">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-dark-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
        >
          <History size={16} /> {l.tabOrders}
        </button>
        <button
          onClick={() => setActiveTab('boms')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'boms' ? 'bg-dark-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
        >
          <BookOpen size={16} /> {l.tabBOMs}
        </button>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-dark-900 border border-dark-700 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-800 border-b border-dark-700">
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-400 uppercase">{l.colDate}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-400 uppercase">{l.colProduct}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-400 uppercase">{l.colQty}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-400 uppercase">{l.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Factory size={48} className="text-dark-600 mb-4" />
                          <p className="text-lg font-medium text-white">{l.emptyOrdersTitle}</p>
                          <p className="text-sm">{l.emptyOrdersSub}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="hover:bg-dark-800/50 transition-colors group">
                        <td className="p-5 text-sm font-medium text-slate-300">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-white text-base">
                            {o.recipe?.outputProduct?.name || '—'}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">ORD-{o.id}</div>
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-dark-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold border border-dark-600">
                            {o.plannedOutput} {o.recipe?.outputProduct?.unit}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                            <CheckCircle2 size={14} /> {l.statusDone}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-500 bg-dark-900 rounded-3xl border border-dark-700">
                {l.emptyBOMs}
              </div>
            ) : (
              recipes.map(r => (
                <div key={r.id} className="group relative bg-dark-900 border border-dark-700 rounded-3xl p-6 hover:border-dark-500 transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-xl text-white mb-1">{r.outputProduct?.name}</h3>
                      <span className="inline-block bg-dark-800 text-slate-400 text-xs px-2.5 py-1 rounded-lg font-medium border border-dark-600">
                        {l.bomNorm}: {r.baseYieldQty} {r.outputProduct?.unit}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center text-indigo-400 border border-dark-700">
                      <FileSignature size={18} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ArrowRight size={12} /> {l.reqMaterials}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {r.ingredients.map((ing: any) => (
                        <div key={ing.id} className="flex items-center justify-between text-sm bg-dark-800 p-3 rounded-xl border border-dark-700">
                          <span className="font-medium text-slate-300">{ing.inputProduct?.name}</span>
                          <span className="font-bold text-slate-100 bg-dark-700 px-2 py-1 rounded text-xs">
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

      {showBomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-dark-700 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-dark-800 flex items-center justify-between bg-dark-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings2 className="text-indigo-400" /> {l.modalBOMTitle}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{l.modalBOMSub}</p>
              </div>
              <button onClick={() => setShowBomModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
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

      {showProdModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-enter">
          <div className="bg-dark-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-dark-700 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Factory className="text-indigo-400" /> {l.modalProdTitle}
              </h2>
              <button onClick={() => setShowProdModal(false)} className="text-slate-500 hover:text-white p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">{l.selectBOM}</label>
                <select 
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                  value={prodForm.recipeId}
                  onChange={e => setProdForm(prev => ({...prev, recipeId: e.target.value}))}
                >
                  <option value="">{l.select}</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.outputProduct?.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">{l.planQty}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-4 text-2xl font-black text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={prodForm.plannedOutput}
                    onChange={e => setProdForm(prev => ({...prev, plannedOutput: e.target.value}))}
                  />
                </div>
              </div>

              <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                <p className="text-sm text-indigo-300 flex items-start gap-3 leading-relaxed">
                  <AlertOctagon size={20} className="mt-0.5 shrink-0" />
                  <span>{l.fefoInfo}</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-5 bg-dark-800/50 flex justify-end gap-3 border-t border-dark-800">
              <button onClick={() => setShowProdModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-dark-700">{l.cancel}</button>
              <button onClick={handleProduce} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />} {l.start}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

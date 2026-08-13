'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, ChefHat, Beaker, Play, Save, Loader2, ClipboardCheck, ArrowRight, CheckCircle2, History, X, Utensils, ShoppingCart, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

// --- TRANSLATIONS DICTIONARY ---
const t = {
  uz: {
    title: "Oshxona",
    subtitle: "Xodimlar uchun ovqat tayyorlash va ta'minotga zayavka berish.",
    btnNewRecipe: "Yangi Taom",
    btnProduce: "Ovqat tayyorlash",
    btnRequest: "Ta'minotga Zayavka",
    tabHistory: "Tarix va Jarayon",
    tabRecipes: "Retseptlar",
    colDate: "Tarix",
    colProduct: "Mahsulot",
    colQty: "Miqdor",
    colStatus: "Holat",
    colActions: "Amallar",
    emptyHistoryTitle: "Hali hech narsa pishirilmadi",
    emptyHistorySub: "Yangi ishlab chiqarishni boshlang",
    statusDone: "Yakunlangan",
    btnDegustation: "Degustatsiya qog'ozi",
    emptyRecipes: "Retseptlar yo'q",
    norma: "Norma",
    requiredIngredients: "Kerakli Xomashyolar:",
    recModalTitle: "Yangi Taom Qo'shish",
    recModalSub: "Xodimlar uchun yangi taom nomi va tarkibi",
    recOutputProduct: "Taom Nomi",
    recYield: "Chiqish Normasi (Porsiya/kg)",
    recIngredients: "Kerakli Xomashyolar",
    btnAdd: "Qo'shish",
    placeholderSelect: "— Tanlang —",
    placeholderIngredient: "— Xomashyo tanlang —",
    placeholderQty: "Miqdor",
    emptyIngredients: "Hech qanday xomashyo qo'shilmagan",
    btnCancel: "Bekor qilish",
    btnSave: "Saqlash",
    prodModalTitle: "Ovqat Tayyorlash",
    prodSelectRecipe: "Qaysi taomni tayyorlaymiz?",
    prodPlannedQty: "Rejalashtirilgan miqdor",
    prodFefoInfo: "Boshlash tugmasi bosilgach, tizim ombordan kerakli xomashyolarni sarflaydi.",
    btnStart: "Boshlash",
    degModalTitle: "Izohlar Jurnali",
    degModalSub: "Taom haqida xulosa",
    degVanna: "Vanna (Qozon) raqami",
    degOrganoleptic: "Organoleptik ko'rsatkichlar",
    degAppearance: "Tashqi ko'rinish va rang",
    degSmell: "Hid (Aromat)",
    degTaste: "Ta'm (Maza)",
    degMoisture: "Namlik (Konsistensiya)",
    degNotes: "Izohlar (agar normadan chiqish bo'lsa)",
    degNotesPlaceholder: "Qo'shimcha izohlar...",
    btnClose: "Yopish",
    btnSaveConclusion: "Xulosani Saqlash",
    reqModalTitle: "Zayavka (Ta'minotga)",
    reqProduct: "Qanday xomashyo kerak?",
    reqQty: "Miqdor",
    reqDate: "Qachonga kerak?",
    reqTime: "Vaqti / Izoh (Masalan: Ertalab 09:00 gacha)",
    reqUnitPlaceholder: "O'lchov",
    btnSendRequest: "Zayavka Qilish",
    msgFillAll: "Barcha maydonlarni to'ldiring",
    msgRecipeSaved: "Retsept saqlandi",
    msgProdSuccess: "Ishlab chiqarish muvaffaqiyatli yakunlandi! Omborxona yangilandi.",
    msgDegustationSaved: "Degustatsiya xulosasi saqlandi!",
    msgRequestSent: "Zayavka ta'minot bo'limiga yuborildi!",
    msgError: "Xatolik yuz berdi",
    msgNetworkError: "Tarmoq xatosi"
  },
  ru: {
    title: "Кухня",
    subtitle: "Приготовление еды для персонала и заявки в снабжение.",
    btnNewRecipe: "Новое Блюдо",
    btnProduce: "Приготовить",
    btnRequest: "Заявка в снабжение",
    tabHistory: "История и Процесс",
    tabRecipes: "Рецепты",
    colDate: "Дата",
    colProduct: "Продукт",
    colQty: "Количество",
    colStatus: "Статус",
    colActions: "Действия",
    emptyHistoryTitle: "Пока ничего не приготовлено",
    emptyHistorySub: "Начните новое производство",
    statusDone: "Завершено",
    btnDegustation: "Лист дегустации",
    emptyRecipes: "Нет рецептов",
    norma: "Норма",
    requiredIngredients: "Необходимое сырье:",
    recModalTitle: "Добавить Новое Блюдо",
    recModalSub: "Название и состав нового блюда",
    recOutputProduct: "Название Блюда",
    recYield: "Норма выхода (Порция/кг)",
    recIngredients: "Необходимое Сырье",
    btnAdd: "Добавить",
    placeholderSelect: "— Выберите —",
    placeholderIngredient: "— Выберите сырье —",
    placeholderQty: "Кол-во",
    emptyIngredients: "Сырье не добавлено",
    btnCancel: "Отмена",
    btnSave: "Сохранить",
    prodModalTitle: "Приготовление Еды",
    prodSelectRecipe: "Какое блюдо готовим?",
    prodPlannedQty: "Запланированное количество",
    prodFefoInfo: "После нажатия кнопки 'Начать', система спишет со склада необходимое сырье.",
    btnStart: "Начать",
    degModalTitle: "Журнал Комментариев",
    degModalSub: "Заключение о блюде",
    degVanna: "Номер Ванны (Котла)",
    degOrganoleptic: "Органолептические показатели",
    degAppearance: "Внешний вид и цвет",
    degSmell: "Запах (Аромат)",
    degTaste: "Вкус",
    degMoisture: "Влажность (Консистенция)",
    degNotes: "Комментарии (при отклонении от нормы)",
    degNotesPlaceholder: "Доп. комментарии...",
    btnClose: "Закрыть",
    btnSaveConclusion: "Сохранить заключение",
    reqModalTitle: "Заявка (Снабжению)",
    reqProduct: "Какое сырье необходимо?",
    reqQty: "Кол-во",
    reqDate: "К какому сроку?",
    reqTime: "Время / Комментарий (Напр: К 09:00 утра)",
    reqUnitPlaceholder: "Ед. изм.",
    btnSendRequest: "Отправить заявку",
    msgFillAll: "Заполните все поля",
    msgRecipeSaved: "Рецепт сохранен",
    msgProdSuccess: "Производство успешно завершено! Склад обновлен.",
    msgDegustationSaved: "Заключение дегустации сохранено!",
    msgRequestSent: "Заявка отправлена в отдел снабжения!",
    msgError: "Произошла ошибка",
    msgNetworkError: "Ошибка сети"
  },
  en: {
    title: "Staff Kitchen",
    subtitle: "Staff meal preparation and supply requests.",
    btnNewRecipe: "New Dish",
    btnProduce: "Cook Meal",
    btnRequest: "Supply Request",
    tabHistory: "History & Process",
    tabRecipes: "Recipes",
    colDate: "Date",
    colProduct: "Product",
    colQty: "Quantity",
    colStatus: "Status",
    colActions: "Actions",
    emptyHistoryTitle: "Nothing has been produced yet",
    emptyHistorySub: "Start a new production run",
    statusDone: "Completed",
    btnDegustation: "Degustation form",
    emptyRecipes: "No recipes found",
    norma: "Yield",
    requiredIngredients: "Required Ingredients:",
    recModalTitle: "Add New Dish",
    recModalSub: "Name and ingredients for a new dish",
    recOutputProduct: "Dish Name",
    recYield: "Yield (Portion/kg)",
    recIngredients: "Required Ingredients",
    btnAdd: "Add",
    placeholderSelect: "— Select —",
    placeholderIngredient: "— Select material —",
    placeholderQty: "Qty",
    emptyIngredients: "No ingredients added",
    btnCancel: "Cancel",
    btnSave: "Save",
    prodModalTitle: "Meal Preparation",
    prodSelectRecipe: "Which dish are we cooking?",
    prodPlannedQty: "Planned quantity",
    prodFefoInfo: "After clicking 'Start', the system will consume the required ingredients from the warehouse.",
    btnStart: "Start",
    degModalTitle: "Comments Log",
    degModalSub: "Conclusion about the dish",
    degVanna: "Vat (Pot) Number",
    degOrganoleptic: "Organoleptic Indicators",
    degAppearance: "Appearance and Color",
    degSmell: "Smell (Aroma)",
    degTaste: "Taste",
    degMoisture: "Moisture (Consistency)",
    degNotes: "Notes (if any deviations)",
    degNotesPlaceholder: "Additional notes...",
    btnClose: "Close",
    btnSaveConclusion: "Save Conclusion",
    reqModalTitle: "Material Request",
    reqProduct: "Which raw material is needed?",
    reqQty: "Quantity",
    reqDate: "Needed By Date",
    reqTime: "Time / Note (E.g. By 09:00 AM)",
    reqUnitPlaceholder: "Unit",
    btnSendRequest: "Send Request",
    msgFillAll: "Please fill in all fields",
    msgRecipeSaved: "Recipe saved successfully",
    msgProdSuccess: "Production completed! Warehouse updated.",
    msgDegustationSaved: "Degustation conclusion saved!",
    msgRequestSent: "Request sent to supply department!",
    msgError: "An error occurred",
    msgNetworkError: "Network error"
  }
}

type LangType = 'uz' | 'ru' | 'en'

export default function ProductionContent({ isKitchen = false }: { isKitchen?: boolean }) {
  const { lang } = useLanguage()
  const currentLang = (lang || 'uz') as LangType
  const l = t[currentLang]

  const titleText = isKitchen ? l.title : (currentLang === 'ru' ? 'Производство' : currentLang === 'en' ? 'Production' : 'Ishlab chiqarish');
  const subText = isKitchen ? l.subtitle : (currentLang === 'ru' ? 'Процесс производства и рецептуры' : currentLang === 'en' ? 'Factory production process and recipes' : 'Zavod ishlab chiqarish jarayoni va retseptlar');


  const [activeTab, setActiveTab] = useState<'orders' | 'recipes' | 'degustation'>('orders')
  
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showDegustationModal, setShowDegustationModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [recipeForm, setRecipeForm] = useState({
    outputProductId: '',
    baseYieldQty: '1',
    ingredients: [] as { inputProductId: string, requiredQty: string }[]
  })

  const [orderForm, setOrderForm] = useState({
    recipeId: '',
    plannedOutput: ''
  })

  const [requestForm, setRequestForm] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: new Date().toISOString().split('T')[0],
    timeRange: ''
  })

  const [degustationForm, setDegustationForm] = useState({
    orderId: null as number | null,
    vannaNo: '1',
    appearanceOk: true,
    smellOk: true,
    tasteOk: true,
    moistureOk: true,
    notes: ''
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
    } catch (err) {
      toast.error(l.msgNetworkError)
    } finally {
      setLoading(false)
    }
  }

  const addIngredientRow = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { inputProductId: '', requiredQty: '' }]
    }))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...recipeForm.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setRecipeForm(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const removeIngredient = (index: number) => {
    const newIngredients = [...recipeForm.ingredients]
    newIngredients.splice(index, 1)
    setRecipeForm(prev => ({ ...prev, ingredients: newIngredients }))
  }

  async function handleSaveRecipe() {
    if (!recipeForm.outputProductId || !recipeForm.baseYieldQty || recipeForm.ingredients.length === 0) {
      toast.error(l.msgFillAll)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeForm)
      })

      if (res.ok) {
        toast.success(l.msgRecipeSaved)
        setShowRecipeModal(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgNetworkError)
    } finally {
      setSaving(false)
    }
  }

  async function handleStartProduction() {
    if (!orderForm.recipeId || !orderForm.plannedOutput) {
      toast.error(l.msgFillAll)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      })

      if (res.ok) {
        toast.success(l.msgProdSuccess)
        setShowOrderModal(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgNetworkError)
    } finally {
      setSaving(false)
    }
  }

  function openDegustation(order: any) {
    setDegustationForm({
      orderId: order.id,
      vannaNo: '1',
      appearanceOk: true,
      smellOk: true,
      tasteOk: true,
      moistureOk: true,
      notes: ''
    })
    setShowDegustationModal(true)
  }

  async function handleSaveDegustation() {
    setSaving(true)
    try {
      const res = await fetch('/api/degustation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(degustationForm)
      })

      if (res.ok) {
        toast.success(l.msgDegustationSaved)
        setShowDegustationModal(false)
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgNetworkError)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendRequest() {
    if (!requestForm.productId || !requestForm.quantity || !requestForm.expectedDate) {
      toast.error(l.msgFillAll)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          status: 'PENDING'
        })
      })

      if (res.ok) {
        toast.success(l.msgRequestSent)
        setShowRequestModal(false)
        setRequestForm({ productId: '', quantity: '', unit: 'kg', expectedDate: new Date().toISOString().split('T')[0], timeRange: '' })
      } else {
        const err = await res.json()
        toast.error(err.error || l.msgError)
      }
    } catch {
      toast.error(l.msgNetworkError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-enter">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-8 mb-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 tracking-tight">
              {titleText}
            </h1>
            <p className="text-blue-200/80 mt-2 font-medium max-w-lg">
              {subText}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl backdrop-blur-md border border-white/20 transition-all font-semibold shadow-lg hover:shadow-white/10"
            >
              <ShoppingCart size={18} />
              {l.btnRequest}
            </button>
            <button 
              onClick={() => setShowRecipeModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl backdrop-blur-md border border-white/20 transition-all font-semibold shadow-lg hover:shadow-white/10"
            >
              <Beaker size={18} />
              {l.btnNewRecipe}
            </button>
            <button 
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all font-bold"
            >
              <ChefHat size={18} />
              {l.btnProduce}
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100/50 dark:bg-dark-800/50 p-1.5 rounded-2xl w-max mb-6 border border-slate-200 dark:border-dark-700/50 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-dark-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <History size={16} /> {l.tabHistory}
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'recipes' ? 'bg-white dark:bg-dark-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <ClipboardCheck size={16} /> {l.tabRecipes}
        </button>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-700">
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-500 dark:text-slate-400 uppercase">{l.colDate}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-500 dark:text-slate-400 uppercase">{l.colProduct}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-500 dark:text-slate-400 uppercase">{l.colQty}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-500 dark:text-slate-400 uppercase">{l.colStatus}</th>
                    <th className="p-5 font-semibold text-xs tracking-wider text-slate-500 dark:text-slate-400 uppercase text-right">{l.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700/50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <ChefHat size={48} className="text-slate-300 dark:text-dark-600 mb-4" />
                          <p className="text-lg font-medium">{l.emptyHistoryTitle}</p>
                          <p className="text-sm">{l.emptyHistorySub}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors group">
                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-slate-800 dark:text-white text-base">
                            {o.recipe?.outputProduct?.name || '—'}
                          </div>
                          <div className="text-xs text-slate-500">Order #{o.id}</div>
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                            <Plus size={14} /> {o.plannedOutput} {o.recipe?.outputProduct?.unit}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 size={14} /> {l.statusDone}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <button 
                            onClick={() => openDegustation(o)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity btn-secondary text-xs py-1.5 px-3"
                          >
                            {l.btnDegustation}
                          </button>
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
              <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-700">
                {l.emptyRecipes}
              </div>
            ) : (
              recipes.map(r => (
                <div key={r.id} className="group relative bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mb-1">{r.outputProduct?.name}</h3>
                      <span className="inline-block bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {l.norma}: {r.baseYieldQty} {r.outputProduct?.unit}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Utensils size={18} />
                    </div>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ArrowRight size={12} /> {l.requiredIngredients}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {r.ingredients.map((ing: any) => (
                        <div key={ing.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-dark-800/50 p-3 rounded-xl border border-slate-100 dark:border-dark-700">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ing.inputProduct?.name}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-xs">
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

      {showRecipeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-enter">
          <div className="bg-white dark:bg-dark-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{l.recModalTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{l.recModalSub}</p>
              </div>
              <button onClick={() => setShowRecipeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.recOutputProduct}</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    value={recipeForm.outputProductId}
                    onChange={e => setRecipeForm(prev => ({...prev, outputProductId: e.target.value}))}
                  >
                    <option value="">{l.placeholderSelect}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.recYield}</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="1" min="0.1" step="0.1"
                    value={recipeForm.baseYieldQty}
                    onChange={e => setRecipeForm(prev => ({...prev, baseYieldQty: e.target.value}))}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-slate-100 dark:bg-dark-800" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{l.recIngredients}</label>
                  <button 
                    onClick={addIngredientRow} 
                    className="flex items-center gap-1.5 text-sm bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    <Plus size={16} /> {l.btnAdd}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {recipeForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-slate-50 dark:bg-dark-800/30 p-3 rounded-2xl border border-slate-200/60 dark:border-dark-700/50">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-700 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</div>
                      <select 
                        className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        value={ing.inputProductId}
                        onChange={e => updateIngredient(idx, 'inputProductId', e.target.value)}
                      >
                        <option value="">{l.placeholderIngredient}</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input 
                        type="number" 
                        className="w-28 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-center font-semibold"
                        placeholder={l.placeholderQty} step="0.01"
                        value={ing.requiredQty}
                        onChange={e => updateIngredient(idx, 'requiredQty', e.target.value)}
                      />
                      <button 
                        onClick={() => removeIngredient(idx)} 
                        className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  {recipeForm.ingredients.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-dark-700 rounded-2xl">
                      <p className="text-sm text-slate-400">{l.emptyIngredients}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 dark:border-dark-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-dark-800/50">
              <button onClick={() => setShowRecipeModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">{l.btnCancel}</button>
              <button onClick={handleSaveRecipe} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {l.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-enter">
          <div className="bg-white dark:bg-dark-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ChefHat className="text-emerald-500" /> {l.prodModalTitle}
              </h2>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.prodSelectRecipe}</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                  value={orderForm.recipeId}
                  onChange={e => setOrderForm(prev => ({...prev, recipeId: e.target.value}))}
                >
                  <option value="">{l.placeholderSelect}</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.outputProduct?.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.prodPlannedQty}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-4 text-2xl font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    placeholder="0.0" min="0.1" step="0.1"
                    value={orderForm.plannedOutput}
                    onChange={e => setOrderForm(prev => ({...prev, plannedOutput: e.target.value}))}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 uppercase">
                    {recipes.find(r => r.id.toString() === orderForm.recipeId)?.outputProduct?.unit || ''}
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-3 leading-relaxed">
                  <Play size={20} className="mt-0.5 shrink-0" />
                  <span>{l.prodFefoInfo}</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 dark:bg-dark-800/50 flex justify-end gap-3">
              <button onClick={() => setShowOrderModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700">{l.btnCancel}</button>
              <button onClick={handleStartProduction} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />} {l.btnStart}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDegustationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter">
          <div className="bg-white dark:bg-dark-900 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-dark-700">
            <div className="px-6 py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck /> {l.degModalTitle}
                </h2>
                <p className="text-orange-100 text-xs mt-1">{l.degModalSub}</p>
              </div>
              <button onClick={() => setShowDegustationModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.degVanna}</label>
                <input 
                  type="number" className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white" placeholder="1"
                  value={degustationForm.vannaNo}
                  onChange={e => setDegustationForm(prev => ({...prev, vannaNo: e.target.value}))}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{l.degOrganoleptic}</label>
                
                {[
                  { key: 'appearanceOk', label: l.degAppearance },
                  { key: 'smellOk', label: l.degSmell },
                  { key: 'tasteOk', label: l.degTaste },
                  { key: 'moistureOk', label: l.degMoisture }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-100 dark:border-dark-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <button 
                      onClick={() => setDegustationForm(prev => ({...prev, [item.key]: !(prev as any)[item.key]}))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        (degustationForm as any)[item.key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-dark-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        (degustationForm as any)[item.key] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.degNotes}</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                  rows={3} placeholder={l.degNotesPlaceholder}
                  value={degustationForm.notes}
                  onChange={e => setDegustationForm(prev => ({...prev, notes: e.target.value}))}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-dark-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-dark-800">
              <button onClick={() => setShowDegustationModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300">{l.btnClose}</button>
              <button onClick={handleSaveDegustation} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/30 flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={18} />} {l.btnSaveConclusion}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-enter">
          <div className="bg-white dark:bg-dark-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-dark-700 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingCart className="text-blue-500" /> {l.reqModalTitle}
              </h2>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.reqProduct}</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  value={requestForm.productId}
                  onChange={e => {
                    const prod = products.find(p => p.id.toString() === e.target.value)
                    setRequestForm(prev => ({...prev, productId: e.target.value, unit: prod ? prod.unit : 'kg'}))
                  }}
                >
                  <option value="">{l.placeholderSelect}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.reqQty}</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      placeholder="0" min="1"
                      value={requestForm.quantity}
                      onChange={e => setRequestForm(prev => ({...prev, quantity: e.target.value}))}
                    />
                    <input 
                      type="text" 
                      className="w-24 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center font-bold"
                      value={requestForm.unit}
                      onChange={e => setRequestForm(prev => ({...prev, unit: e.target.value}))}
                      placeholder={l.reqUnitPlaceholder}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.reqDate}</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                    value={requestForm.expectedDate}
                    onChange={e => setRequestForm(prev => ({...prev, expectedDate: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{l.reqTime}</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="08:00 - 10:00"
                  value={requestForm.timeRange}
                  onChange={e => setRequestForm(prev => ({...prev, timeRange: e.target.value}))}
                />
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 dark:bg-dark-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-dark-800">
              <button onClick={() => setShowRequestModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700">{l.btnCancel}</button>
              <button onClick={handleSendRequest} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} fill="currentColor" />} {l.btnSendRequest}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

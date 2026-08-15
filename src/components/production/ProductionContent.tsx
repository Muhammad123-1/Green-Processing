'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  ChefHat,
  Beaker,
  Play,
  Save,
  Loader2,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  History,
  X,
  Utensils,
  ShoppingCart,
  Scale,
  Building2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Thermometer,
  FileCheck2,
  HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function ProductionContent({ isKitchen = true }: { isKitchen?: boolean } = {}) {
  const { lang } = useLanguage()
  const [activeTab, setActiveTab] = useState<'handshake' | 'multistock' | 'zagotovka' | 'cooking' | 'recipes' | 'history'>('handshake')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [dashboardData, setDashboardData] = useState<any>({
    kpis: {
      pendingHandshakesCount: 0,
      totalTransfersCount: 0,
      discrepancyCount: 0,
      totalDiscrepancyKg: 0
    },
    pendingHandshakes: [],
    completedTransfers: [],
    discrepancyTransfers: [],
    multiLocationStock: []
  })

  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productionHistory, setProductionHistory] = useState<any[]>([])

  // Modal States
  const [showHandshakeModal, setShowHandshakeModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null)
  const [handshakeForm, setHandshakeForm] = useState({
    receivedQuantity: '',
    discrepancyReason: 'Go\'sht suvi oqishi / Idish og\'irligi',
    customReason: '',
    notes: ''
  })
  const [savingHandshake, setSavingHandshake] = useState(false)

  // Zagotovka Prep Modal
  const [showZagotovkaModal, setShowZagotovkaModal] = useState(false)
  const [zagotovkaForm, setZagotovkaForm] = useState({
    productId: '',
    inputQuantity: '',
    outputQuantity: '',
    wasteReason: 'Tozalash va qirqish isrofi',
    storageLocation: 'SOVUTGICH_1',
    temperature: '2.5',
    notes: ''
  })
  const [savingZagotovka, setSavingZagotovka] = useState(false)

  // Cooking Modal
  const [showProduceModal, setShowProduceModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [plannedQty, setPlannedQty] = useState('')
  const [producing, setProducing] = useState(false)

  // New Recipe Modal
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [recipeForm, setRecipeForm] = useState({
    outputProductId: '',
    baseYieldQty: '100',
    ingredients: [{ inputProductId: '', requiredQty: '' }]
  })
  const [savingRecipe, setSavingRecipe] = useState(false)

  // Request to Supply Modal
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    expectedDate: new Date().toISOString().split('T')[0],
    timeRange: '08:00 - 10:00'
  })
  const [savingRequest, setSavingRequest] = useState(false)

  // Filter & Search
  const [stockSearch, setStockSearch] = useState('')
  const [transferSearch, setTransferSearch] = useState('')

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHandshakeModal(false)
        setShowZagotovkaModal(false)
        setShowProduceModal(false)
        setShowRecipeModal(false)
        setShowRequestModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [dashRes, recRes, prodRes, historyRes] = await Promise.all([
        fetch('/api/kitchen/dashboard'),
        fetch('/api/recipes'),
        fetch('/api/products'),
        fetch('/api/production')
      ])

      if (dashRes.ok) setDashboardData(await dashRes.json())
      if (recRes.ok) setRecipes(await recRes.json())
      if (prodRes.ok) setProducts(await prodRes.json())
      if (historyRes.ok) setProductionHistory(await historyRes.json())
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function refreshDashboard() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/kitchen/dashboard')
      if (res.ok) {
        setDashboardData(await res.json())
        toast.success("Oshxona ma'lumotlari yangilandi")
      }
    } catch {
      toast.error("Yangilashda xatolik")
    } finally {
      setRefreshing(false)
    }
  }

  // Open Handshake Modal
  function handleOpenHandshake(transfer: any) {
    setSelectedTransfer(transfer)
    setHandshakeForm({
      receivedQuantity: transfer.issuedQuantity.toString(),
      discrepancyReason: 'Go\'sht suvi oqishi / Idish og\'irligi',
      customReason: '',
      notes: ''
    })
    setShowHandshakeModal(true)
  }

  // Submit Two-Way Handshake Confirmation
  async function handleSubmitHandshake(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTransfer) return

    setSavingHandshake(true)
    try {
      const finalReason = handshakeForm.discrepancyReason === 'Boshqa' 
        ? handshakeForm.customReason 
        : handshakeForm.discrepancyReason

      const res = await fetch(`/api/transfers/${selectedTransfer.id}/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedQuantity: parseFloat(handshakeForm.receivedQuantity),
          discrepancyReason: finalReason,
          notes: handshakeForm.notes
        })
      })

      if (res.ok) {
        toast.success("Yuk qabul qilindi va tortish natijasi tasdiqlandi!")
        setShowHandshakeModal(false)
        setSelectedTransfer(null)
        loadAllData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Tasdiqlashda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingHandshake(false)
    }
  }

  // Execute Cooking / Production
  async function handleProduce() {
    if (!selectedRecipe || !plannedQty || parseFloat(plannedQty) <= 0) {
      toast.error("Miqdorni to'g'ri kiriting")
      return
    }

    setProducing(true)
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          plannedOutput: plannedQty
        })
      })

      if (res.ok) {
        toast.success("Taom muvaffaqiyatli tayyorlandi! Xomashyo ombordan sarflandi.")
        setShowProduceModal(false)
        setPlannedQty('')
        setSelectedRecipe(null)
        loadAllData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Ishlab chiqarishda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setProducing(false)
    }
  }

  // Send Supply Request
  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!requestForm.productId || !requestForm.quantity || !requestForm.expectedDate) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }

    setSavingRequest(true)
    try {
      const selectedProd = products.find(p => p.id === parseInt(requestForm.productId))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: requestForm.productId,
          quantity: requestForm.quantity,
          unit: selectedProd?.unit || 'kg',
          expectedDate: requestForm.expectedDate,
          timeRange: requestForm.timeRange,
          notes: "Oshxona ehtiyoji uchun zayavka"
        })
      })

      if (res.ok) {
        toast.success("Zayavka ta'minot bo'limiga yuborildi!")
        setShowRequestModal(false)
        setRequestForm({
          productId: '',
          quantity: '',
          unit: 'kg',
          expectedDate: new Date().toISOString().split('T')[0],
          timeRange: '08:00 - 10:00'
        })
      } else {
        toast.error("Zayavka yuborishda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingRequest(false)
    }
  }

  // Filtered Multi-Location Stock
  const filteredMultiStock = useMemo(() => {
    return (dashboardData.multiLocationStock || []).filter((item: any) =>
      item.name?.toLowerCase().includes(stockSearch.toLowerCase()) ||
      item.code?.toLowerCase().includes(stockSearch.toLowerCase())
    )
  }, [dashboardData.multiLocationStock, stockSearch])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/60 p-6 rounded-2xl border border-dark-700 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Oshxona & Zagotovka Zanjiri
            </span>
            <span className="text-xs text-slate-500">Two-Way Handshake & Tortish Nazorati</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Oshxona va Zagotovka Boshqaruvi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Skladdan qabul qilish (Two-Way Handshake), tortish farqlari, ko'p-joylashuvli zaxiralar va taom tayyorlash
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition-colors"
            title="Yangilash"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin text-blue-400' : ''} />
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 transition-all"
          >
            <ShoppingCart size={16} />
            <span>Ta'minotga Zayavka</span>
          </button>
          <button
            onClick={() => {
              if (recipes.length === 0) {
                toast.error("Avval retsept qo'shing")
                return
              }
              setSelectedRecipe(recipes[0])
              setShowProduceModal(true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            <Play size={18} fill="currentColor" />
            <span>Ovqat Tayyorlash</span>
          </button>
        </div>
      </div>

      {/* Handshake Alert Banner (If pending shipments from Sklad) */}
      {(dashboardData.pendingHandshakes || []).length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-dark-900 border-2 border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔔 Skladdan Kelgan Yuklar Tasdiqlash Kutilmoqda ({dashboardData.pendingHandshakes.length} ta)</span>
              </h3>
              <p className="text-xs text-amber-200/80">
                Sklad xomashyo chiqardi. Haqiqiy vaznni tortib, "Qabul qildim" tugmasi orqali tasdiqlang!
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('handshake')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 transition-all shrink-0"
          >
            Darhol Qabul Qilish & Tortish
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('handshake')}
          className="card p-5 rounded-2xl cursor-pointer hover:bg-dark-800 transition-all border-l-4 border-l-amber-500"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase">Tasdiqlash Kutilmoqda</span>
            <Scale size={18} />
          </div>
          <div className="text-3xl font-bold text-white">
            {dashboardData.kpis?.pendingHandshakesCount || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Skladdan kelgan tranzit yuklar</div>
        </div>

        <div 
          onClick={() => setActiveTab('multistock')}
          className="card p-5 rounded-2xl cursor-pointer hover:bg-dark-800 transition-all border-l-4 border-l-rose-500"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase">Yo'qotish / Farqlar</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-3xl font-bold text-rose-400">
            {dashboardData.kpis?.totalDiscrepancyKg || 0} <span className="text-sm font-normal text-slate-400">kg</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{dashboardData.kpis?.discrepancyCount || 0} ta holatda farq aniqlangan</div>
        </div>

        <div 
          onClick={() => setActiveTab('multistock')}
          className="card p-5 rounded-2xl cursor-pointer hover:bg-dark-800 transition-all border-l-4 border-l-blue-500"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-semibold uppercase">Zaxira Pozitsiyalari</span>
            <Layers size={18} />
          </div>
          <div className="text-3xl font-bold text-white">
            {(dashboardData.multiLocationStock || []).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Barcha saqlash joylarida</div>
        </div>

        <div 
          onClick={() => setActiveTab('history')}
          className="card p-5 rounded-2xl cursor-pointer hover:bg-dark-800 transition-all border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase">Tayyorlangan Taomlar</span>
            <ChefHat size={18} />
          </div>
          <div className="text-3xl font-bold text-white">
            {productionHistory.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Ishlab chiqarish jurnali</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-dark-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('handshake')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'handshake'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-bold'
              : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Scale size={16} />
          <span>🤝 Skladdan Qabul (Handshake & Tortish)</span>
          {(dashboardData.pendingHandshakes || []).length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full font-bold">
              {dashboardData.pendingHandshakes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('multistock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'multistock'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Building2 size={16} />
          <span>🏢 Qayerda Qancha Mahsulot Bor? (Multi-Location)</span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'recipes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Utensils size={16} />
          <span>🍲 Retseptlar & Taomlar</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <History size={16} />
          <span>📜 Tarix va Degustatsiya</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TWO-WAY HANDSHAKE (Skladdan Qabul Qilish va Tortish)                */}
      {/* ========================================================================= */}
      {activeTab === 'handshake' && (
        <div className="space-y-6">
          {/* Section 1: Pending Handshakes (Needs Confirmation) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>Qabul Qilinishi Kutilayotgan Yuklar</span>
              </h2>
              <span className="text-xs text-slate-400">
                {(dashboardData.pendingHandshakes || []).length} ta transfer
              </span>
            </div>

            {(dashboardData.pendingHandshakes || []).length === 0 ? (
              <div className="card p-8 text-center text-slate-500 border border-dark-700 bg-dark-900/40">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-300">Barcha kelgan yuklar qabul qilingan!</p>
                <p className="text-xs mt-1">Sklad yangi mahsulot chiqarganda bu yerda avtomatik ko'rinadi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dashboardData.pendingHandshakes || []).map((transfer: any) => (
                  <div 
                    key={transfer.id}
                    className="card p-5 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 border-2 border-amber-500/50 rounded-2xl shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {transfer.transferNumber}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1.5">
                          {transfer.product?.name || 'Mahsulot'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Yuboruvchi: <span className="text-slate-200">{transfer.issuedByName || 'Sklad'}</span> • {new Date(transfer.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Sklad bergan miqdor:</div>
                        <div className="text-2xl font-black text-amber-400 font-mono">
                          {transfer.issuedQuantity} {transfer.issuedUnit}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dark-700/80 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        Manzil: <strong className="text-white">{transfer.targetLocation}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenHandshake(transfer)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/30 transition-all"
                      >
                        <Scale size={18} />
                        <span>Tortish & Qabul Qilish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Completed Handshakes & Discrepancies History */}
          <div className="space-y-3 pt-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={18} className="text-blue-400" />
              <span>Qabul Qilingan Yuklar va Farqlar Jurnali (Reconciliation Log)</span>
            </h2>

            <div className="card overflow-hidden border border-dark-700 bg-dark-900/70">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-dark-800 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                      <th className="py-3 px-4">Transfer & Sana</th>
                      <th className="py-3 px-4">Mahsulot</th>
                      <th className="py-3 px-4">Bo'lim</th>
                      <th className="py-3 px-4 text-center">Sklad Berdi</th>
                      <th className="py-3 px-4 text-center">Qabul Qilindi (Tortildi)</th>
                      <th className="py-3 px-4 text-center">Farq / Yo'qotish</th>
                      <th className="py-3 px-4">Sabab / Izoh</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {(dashboardData.completedTransfers || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          Hozircha qabul qilingan transferlar mavjud emas
                        </td>
                      </tr>
                    ) : (
                      (dashboardData.completedTransfers || []).map((t: any) => (
                        <tr key={t.id} className="hover:bg-dark-800/50">
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">
                            <div className="font-bold text-blue-400">{t.transferNumber}</div>
                            <div className="text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {t.product?.name}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-xs">
                            {t.targetLocation}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-white">
                            {t.issuedQuantity} {t.issuedUnit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                            {t.receivedQuantity} {t.issuedUnit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {t.discrepancy && Math.abs(t.discrepancy) > 0 ? (
                              <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                -{t.discrepancy.toFixed(2)} {t.issuedUnit}
                              </span>
                            ) : (
                              <span className="text-emerald-400">0 (To'liq)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {t.discrepancyReason || t.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {t.status === 'DISCREPANCY' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Farq bilan
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Mos (To'liq)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-LOCATION STOCK ("Qayerda Qancha Mahsulot Bor?")               */}
      {/* ========================================================================= */}
      {activeTab === 'multistock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-dark-900/60 p-4 rounded-xl border border-dark-700">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Mahsulot nomi yoki kodi bo'yicha qidirish..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="card overflow-hidden border border-dark-700 bg-dark-900/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-dark-800 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                    <th className="py-3.5 px-4">Mahsulot Nomi</th>
                    <th className="py-3.5 px-4">Kategoriya</th>
                    <th className="py-3.5 px-4 text-center text-blue-400">🏢 Markaziy Sklad</th>
                    <th className="py-3.5 px-4 text-center text-amber-400">🔪 Zagotovka Sexi</th>
                    <th className="py-3.5 px-4 text-center text-emerald-400">🍲 Oshxona</th>
                    <th className="py-3.5 px-4 text-center font-bold text-white">📦 JAMI Zaxira</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {filteredMultiStock.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Mahsulotlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredMultiStock.map((item: any) => (
                      <tr key={item.id} className="hover:bg-dark-800/50">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{item.name}</div>
                          {item.code && <div className="text-[11px] font-mono text-slate-500">{item.code}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {item.category || 'Xomashyo'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                          {item.locations.warehouse} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                          {item.locations.zagotovka} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {item.locations.oshxona} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-white bg-dark-800/60">
                          <span className="px-2.5 py-1 rounded-lg bg-dark-700 border border-dark-600">
                            {item.totalQuantity} {item.unit}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECIPES & COOKING                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Standart Retseptlar (BOM)</h2>
            <button
              onClick={() => setShowRecipeModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus size={16} />
              <span>Yangi Retsept Qo'shish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((rec) => (
              <div key={rec.id} className="card p-5 bg-dark-900 border border-dark-700 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{rec.outputProduct?.name}</h3>
                    <p className="text-xs text-slate-400">Chiqish normasi: {rec.baseYieldQty} {rec.outputProduct?.unit || 'porsiya'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRecipe(rec)
                      setShowProduceModal(true)
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                    title="Pishirish"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-dark-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Kerakli Xomashyolar:</span>
                  <div className="space-y-1">
                    {rec.ingredients?.map((ing: any) => (
                      <div key={ing.id} className="flex items-center justify-between text-xs text-slate-300 bg-dark-800/70 px-3 py-1.5 rounded-lg">
                        <span>{ing.inputProduct?.name}</span>
                        <span className="font-mono font-bold text-amber-400">{ing.requiredQty} {ing.inputProduct?.unit || 'kg'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRODUCTION HISTORY                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="card overflow-hidden border border-dark-700 bg-dark-900/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-dark-800 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                    <th className="py-3.5 px-4">Buyurtma ID & Sana</th>
                    <th className="py-3.5 px-4">Tayyorlangan Taom</th>
                    <th className="py-3.5 px-4 text-center">Miqdori</th>
                    <th className="py-3.5 px-4 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {productionHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Hozircha tayyorlangan taomlar yo'q
                      </td>
                    </tr>
                  ) : (
                    productionHistory.map((order: any) => (
                      <tr key={order.id} className="hover:bg-dark-800/50">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          <div className="font-bold text-blue-400">#ORD-{order.id}</div>
                          <div className="text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {order.recipe?.outputProduct?.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {order.plannedOutput} {order.recipe?.outputProduct?.unit || 'porsiya'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Yakunlangan
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TWO-WAY HANDSHAKE (Tortish va Qabul Qilish)                      */}
      {/* ========================================================================= */}
      {showHandshakeModal && selectedTransfer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowHandshakeModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Skladdan Qabul Qilish (Tortish)</h3>
                  <p className="text-xs text-slate-400">Transfer #{selectedTransfer.transferNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHandshakeModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitHandshake} className="space-y-4 pt-4">
              {/* Product Info */}
              <div className="bg-dark-800 p-3.5 rounded-xl border border-dark-700 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Mahsulot:</span>
                  <span className="font-bold text-white text-sm">{selectedTransfer.product?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sklad chiqargan vazn:</span>
                  <span className="font-bold text-amber-400 text-sm font-mono">
                    {selectedTransfer.issuedQuantity} {selectedTransfer.issuedUnit}
                  </span>
                </div>
              </div>

              {/* Weighed Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Haqiqatda Tortilgan Miqdor ({selectedTransfer.issuedUnit}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={handshakeForm.receivedQuantity}
                  onChange={(e) => setHandshakeForm({ ...handshakeForm, receivedQuantity: e.target.value })}
                  required
                  autoFocus
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-lg font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Discrepancy Calculation */}
              {(() => {
                const rec = parseFloat(handshakeForm.receivedQuantity) || 0
                const diff = selectedTransfer.issuedQuantity - rec
                return (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    Math.abs(diff) > 0.001 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <span className="font-semibold">Tortishdagi Farq / Yo'qotish:</span>
                    <span className="font-black font-mono text-sm">
                      {Math.abs(diff) > 0.001 
                        ? `-${diff.toFixed(2)} ${selectedTransfer.issuedUnit} (Nomuvofiqlik)`
                        : '0.00 kg (100% Mos keldi)'}
                    </span>
                  </div>
                )
              })()}

              {/* Discrepancy Reason if variance exists */}
              {parseFloat(handshakeForm.receivedQuantity) < selectedTransfer.issuedQuantity && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Farq Sababini Tanlang
                  </label>
                  <select
                    value={handshakeForm.discrepancyReason}
                    onChange={(e) => setHandshakeForm({ ...handshakeForm, discrepancyReason: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Go'sht suvi oqishi / Idish og'irligi">Go'sht suvi oqishi / Idish og'irligi</option>
                    <option value="Muz erishi / Namlik yo'qolishi">Muz erishi / Namlik yo'qolishi</option>
                    <option value="Sifat yaroqsiz qismi olib tashlandi">Sifat yaroqsiz qismi olib tashlandi</option>
                    <option value="Sklad noto'g'ri o'lchagan">Sklad noto'g'ri o'lchagan</option>
                    <option value="Boshqa">Boshqa sabab (qo'lda yozish)</option>
                  </select>

                  {handshakeForm.discrepancyReason === 'Boshqa' && (
                    <input
                      type="text"
                      placeholder="Sababni batafsil yozing..."
                      value={handshakeForm.customReason}
                      onChange={(e) => setHandshakeForm({ ...handshakeForm, customReason: e.target.value })}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Qo'shimcha Izoh
                </label>
                <input
                  type="text"
                  placeholder="Izoh yozing..."
                  value={handshakeForm.notes}
                  onChange={(e) => setHandshakeForm({ ...handshakeForm, notes: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowHandshakeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingHandshake}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  {savingHandshake && <Loader2 size={16} className="animate-spin" />}
                  <span>Qabul Qilishni Tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRODUCE / COOKING MODAL                                          */}
      {/* ========================================================================= */}
      {showProduceModal && selectedRecipe && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowProduceModal(false)}
        >
          <div 
            className="w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ChefHat size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Taom Tayyorlash</h3>
                  <p className="text-xs text-slate-400">{selectedRecipe.outputProduct?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProduceModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Rejalashtirilgan Chiqish Miqdori ({selectedRecipe.outputProduct?.unit || 'porsiya'})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Masalan: 120"
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(e.target.value)}
                  autoFocus
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-lg font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                <p>💡 Ushbu miqdor tasdiqlangach, retseptdagi xomashyolar (FEFO qoidasi bo'yicha) avtomatik ombordan sarflanadi.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowProduceModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleProduce}
                  disabled={producing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {producing && <Loader2 size={16} className="animate-spin" />}
                  <span>Pishirishni Boshlash</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUPPLY REQUEST                                                   */}
      {/* ========================================================================= */}
      {showRequestModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-enter"
          onClick={() => setShowRequestModal(false)}
        >
          <div 
            className="w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ta'minotga Zayavka</h3>
                  <p className="text-xs text-slate-400">Oshxona ehtiyojlari uchun xarid so'rovi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Xomashyo <span className="text-red-400">*</span>
                </label>
                <select
                  value={requestForm.productId}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === parseInt(e.target.value))
                    setRequestForm({
                      ...requestForm,
                      productId: e.target.value,
                      unit: prod?.unit || 'kg'
                    })
                  }}
                  required
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tanlang...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit || 'kg'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Miqdor <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Masalan: 50"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Kelish Sanasi <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={requestForm.expectedDate}
                    onChange={(e) => setRequestForm({ ...requestForm, expectedDate: e.target.value })}
                    required
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Vaqt Oralig'i
                </label>
                <input
                  type="text"
                  value={requestForm.timeRange}
                  onChange={(e) => setRequestForm({ ...requestForm, timeRange: e.target.value })}
                  placeholder="08:00 - 10:00"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingRequest}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {savingRequest && <Loader2 size={16} className="animate-spin" />}
                  <span>Zayavka Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

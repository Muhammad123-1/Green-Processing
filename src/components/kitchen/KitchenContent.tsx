'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Plus,
  Trash2,
  ChefHat,
  UtensilsCrossed,
  BarChart3,
  Calendar,
  RefreshCw,
  CheckCircle2,
  X,
  Loader2,
  Clock,
  Users,
  Copy,
  ExternalLink,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Flame,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkle
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { BrakerageJournalModal } from './BrakerageJournalModal'

// Types
export interface IngredientItem {
  id: string
  name: string
  qty: string
  unit: string
}

export interface KitchenTask {
  id: number
  date: string
  staffName: string
  staffRole: string
  timeFrom: string
  timeTo: string
  shift: string
  category: 'MEAL' | 'SALAD' | 'CLEANING' | 'PREP' | 'BAKERY' | 'OTHER'
  title: string
  description?: string | null
  servings?: number | null
  itemsUsed?: string | null // JSON: IngredientItem[]
  cleaningArea?: string | null
  cleaningAgent?: string | null
  photos?: string | null // JSON: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
  mealLogId?: number | null
  mealLog?: {
    id: number
    token: string | null
    _count?: { feedbacks: number }
  } | null
  createdAt: string
  updatedAt: string
}

export interface MealLog {
  id: number
  mealName: string
  cookedDate: string
  shift: string
  preparedBy: string
  ingredients: string
  notes?: string
  servings?: number
  token?: string
  expiresAt?: string
  createdAt: string
}

export interface FeedbackStats {
  total: number
  good: number
  average: number
  bad: number
}

export interface Feedback {
  id: number
  rating: string
  comment?: string
  date: string
  mealName?: string
  createdAt: string
}

interface KitchenContentProps {
  userRole?: string
  userName?: string
}

// Preset Roles
const STAFF_ROLES = [
  { id: 'Bosh oshpaz', labelUz: '👨‍🍳 Bosh oshpaz', labelRu: '👨‍🍳 Шеф-повар', labelEn: '👨‍🍳 Head Chef' },
  { id: 'Yordamchi oshpaz', labelUz: '🧑‍🍳 Yordamchi oshpaz', labelRu: '🧑‍🍳 Помощник повара', labelEn: '🧑‍🍳 Sous Chef / Assistant' },
  { id: 'Salatchi oshpaz', labelUz: '🥗 Salatchi oshpaz', labelRu: '🥗 Повар холодного цеха (Салатница)', labelEn: '🥗 Salad Chef' },
  { id: 'Qassob / Go\'shtchi', labelUz: '🥩 Qassob / Go\'sht tozalovchi', labelRu: '🥩 Мясник / Разделочник', labelEn: '🥩 Butcher / Prep' },
  { id: 'Nonvoy / Xamirchi', labelUz: '🍞 Nonvoy / Xamirchi', labelRu: '🍞 Пекарь / Тестомес', labelEn: '🍞 Baker' },
  { id: 'Idish yuvuvchi / Farrosh', labelUz: '🧹 Idish yuvuvchi / Farrosh', labelRu: '🧹 Посудомойка / Уборщица', labelEn: '🧹 Dishwasher / Cleaner' },
  { id: 'Oshxona mudiri', labelUz: '📋 Oshxona mudiri', labelRu: '📋 Зав. производством кухни', labelEn: '📋 Kitchen Manager' }
]

// Preset Categories
const TASK_CATEGORIES = [
  { id: 'ALL', labelUz: 'Barchasi', labelRu: 'Все задачи', labelEn: 'All Tasks', icon: Layers, color: 'text-slate-700' },
  { id: 'MEAL', labelUz: '🍲 Issiq taom', labelRu: '🍲 Горячее блюдо', labelEn: '🍲 Hot Meal', icon: Flame, color: 'text-orange-600' },
  { id: 'SALAD', labelUz: '🥗 Salat / Gazak', labelRu: '🥗 Салат / Закуска', labelEn: '🥗 Salad / Cold', icon: UtensilsCrossed, color: 'text-emerald-600' },
  { id: 'CLEANING', labelUz: '🧹 Tozalash & Sanitariya', labelRu: '🧹 Уборка и сан. обработка', labelEn: '🧹 Sanitation & Cleaning', icon: Sparkle, color: 'text-blue-600' },
  { id: 'PREP', labelUz: '🥩 Xomashyo ishlovi', labelRu: '🥩 Разделка и заготовка', labelEn: '🥩 Meat & Raw Prep', icon: ChefHat, color: 'text-red-600' },
  { id: 'BAKERY', labelUz: '🍞 Non & Pishiriq', labelRu: '🍞 Выпечка и хлеб', labelEn: '🍞 Bakery & Bread', icon: ChefHat, color: 'text-amber-600' },
  { id: 'OTHER', labelUz: '📝 Boshqa vazifa', labelRu: '📝 Прочее', labelEn: '📝 Other Task', icon: Layers, color: 'text-slate-600' }
]

// Preset Cleaning Areas
const CLEANING_AREAS = [
  'Qozonlar va qozonxona',
  'Gaz plitalari va duxovka',
  'Go\'sht va sabzavot kesish stollari',
  'Muzlatgich va xolodilniklar',
  'Idish-tovoqlar va lentalar',
  'Oshxona poli va traplar',
  'Xodimlar ovqatlanish zali'
]

// Common Ingredients Quick Add
const QUICK_INGREDIENTS = [
  'Go\'sht (mol)',
  'Go\'sht (qo\'y)',
  'Go\'sht (tovuq)',
  'Guruch (lazer)',
  'Guruch (alanga)',
  'Yog\' (o\'simlik)',
  'Yog\' (paxta)',
  'Piyoz',
  'Sabzi (sariq)',
  'Sabzi (qizil)',
  'Kartoshka',
  'Pomidor',
  'Bodring',
  'Ko\'katlar',
  'Mayonez',
  'Tuxum',
  'Un (1-nav)',
  'Tuz / Ziravorlar'
]

export default function KitchenContent({ userRole, userName }: KitchenContentProps = {}) {
  const { lang, formatDual } = useLanguage()
  const activeLang: 'uz' | 'ru' | 'en' = lang.includes('ru') ? 'ru' : lang.includes('en') ? 'en' : 'uz'

  const isDirector = userRole === 'DIRECTOR'
  const isInspectorOrDirector = isDirector || userRole === 'ADMIN' || userRole === 'QUALITY_CONTROL'

  // Tab State: 'tasks' (Photo proof log), 'meals' (Meal recipes), 'cleaning' (Sanitation), 'feedback' (Ratings)
  const [activeTab, setActiveTab] = useState<'tasks' | 'meals' | 'cleaning' | 'feedback'>('tasks')

  // Data State
  const [tasks, setTasks] = useState<KitchenTask[]>([])
  const [taskStats, setTaskStats] = useState({
    total: 0,
    meals: 0,
    salads: 0,
    cleaning: 0,
    prep: 0,
    bakery: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalServings: 0
  })

  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({ total: 0, good: 0, average: 0, bad: 0 })

  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State: Create / Edit Task
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isBrakerageModalOpen, setIsBrakerageModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<KitchenTask | null>(null)
  const [savingTask, setSavingTask] = useState(false)

  // Form State
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    staffName: userName || '',
    staffRole: 'Bosh oshpaz',
    timeFrom: '07:00',
    timeTo: '16:30',
    shift: '1-Smena',
    category: 'MEAL' as 'MEAL' | 'SALAD' | 'CLEANING' | 'PREP' | 'BAKERY' | 'OTHER',
    title: '',
    description: '',
    servings: '',
    cleaningArea: '',
    cleaningAgent: 'Fayri va xlorli eritma 2%'
  })

  const [formIngredients, setFormIngredients] = useState<IngredientItem[]>([
    { id: '1', name: '', qty: '', unit: 'kg' }
  ])

  const [formPhotos, setFormPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // LightBox preview modal for photos
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title?: string } | null>(null)

  // Review (E'tiroz / Tasdiqlash) modal for Director
  const [reviewModalTask, setReviewModalTask] = useState<KitchenTask | null>(null)
  const [reviewActionType, setReviewActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [reviewCommentInput, setReviewCommentInput] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Copied token indicator
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterDate) params.append('date', filterDate)
      if (filterCategory !== 'ALL') params.append('category', filterCategory)
      if (filterStatus !== 'ALL') params.append('status', filterStatus)
      if (searchQuery) params.append('staffName', searchQuery)

      const res = await fetch(`/api/kitchen/tasks?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.tasks || [])
        setTaskStats(data.stats || {
          total: 0,
          meals: 0,
          salads: 0,
          cleaning: 0,
          prep: 0,
          bakery: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalServings: 0
        })
      }
    } catch {
      toast.error('Oshxona vazifalarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterCategory, filterStatus, searchQuery])

  // Fetch Meal Logs & Feedback
  const fetchFeedbackAndMeals = useCallback(async () => {
    try {
      const params = filterDate ? `?date=${filterDate}` : ''
      const [mealsRes, fbRes] = await Promise.all([
        fetch(`/api/kitchen/meal-logs${params}`),
        fetch(`/api/kitchen/feedback${params}`)
      ])
      if (mealsRes.ok) setMealLogs(await mealsRes.json())
      if (fbRes.ok) {
        const fbData = await fbRes.json()
        setFeedbacks(fbData.feedbacks || [])
        setFeedbackStats(fbData.stats || { total: 0, good: 0, average: 0, bad: 0 })
      }
    } catch {}
  }, [filterDate])

  useEffect(() => {
    fetchTasks()
    fetchFeedbackAndMeals()
  }, [fetchTasks, fetchFeedbackAndMeals])

  // Open Task Modal
  const handleOpenNewTask = (cat: 'MEAL' | 'SALAD' | 'CLEANING' | 'PREP' | 'BAKERY' | 'OTHER' = 'MEAL') => {
    setEditingTask(null)
    setTaskForm({
      date: filterDate || new Date().toISOString().slice(0, 10),
      staffName: userName || '',
      staffRole: cat === 'CLEANING' ? 'Idish yuvuvchi / Farrosh' : cat === 'SALAD' ? 'Salatchi oshpaz' : 'Bosh oshpaz',
      timeFrom: '07:00',
      timeTo: '16:30',
      shift: '1-Smena',
      category: cat,
      title: '',
      description: '',
      servings: cat === 'MEAL' || cat === 'SALAD' ? '120' : '',
      cleaningArea: cat === 'CLEANING' ? 'Qozonlar va gaz plitalari' : '',
      cleaningAgent: 'Fayri va xlorli eritma 2%'
    })
    setFormIngredients([{ id: '1', name: '', qty: '', unit: 'kg' }])
    setFormPhotos([])
    setIsTaskModalOpen(true)
  }

  // Open Edit Task
  const handleOpenEditTask = (task: KitchenTask) => {
    setEditingTask(task)
    let parsedItems: IngredientItem[] = []
    try {
      parsedItems = JSON.parse(task.itemsUsed || '[]')
    } catch {
      parsedItems = []
    }
    if (parsedItems.length === 0) {
      parsedItems = [{ id: '1', name: '', qty: '', unit: 'kg' }]
    }

    let parsedPhotos: string[] = []
    try {
      parsedPhotos = JSON.parse(task.photos || '[]')
    } catch {
      parsedPhotos = []
    }

    setTaskForm({
      date: task.date,
      staffName: task.staffName,
      staffRole: task.staffRole,
      timeFrom: task.timeFrom || '07:00',
      timeTo: task.timeTo || '16:30',
      shift: task.shift || '1-Smena',
      category: task.category,
      title: task.title,
      description: task.description || '',
      servings: task.servings ? String(task.servings) : '',
      cleaningArea: task.cleaningArea || '',
      cleaningAgent: task.cleaningAgent || ''
    })
    setFormIngredients(parsedItems)
    setFormPhotos(parsedPhotos)
    setIsTaskModalOpen(true)
  }

  // Handle Photo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd
        })
        const data = await res.json()
        if (data.url) {
          setFormPhotos(prev => [...prev, data.url])
        } else {
          toast.error(data.error || 'Rasm yuklanmadi')
        }
      }
      toast.success(formatDual("Rasm muvaffaqiyatli yuklandi!", "Фото успешно загружено!", "Photo uploaded successfully!"))
    } catch {
      toast.error('Rasm yuklashda tarmoq xatosi')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Remove Photo from Form
  const handleRemovePhoto = (idx: number) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  // Ingredient Helpers
  const addIngredient = () => {
    setFormIngredients(prev => [...prev, { id: Date.now().toString(), name: '', qty: '', unit: 'kg' }])
  }

  const removeIngredient = (id: string) => {
    if (formIngredients.length === 1) return
    setFormIngredients(prev => prev.filter(i => i.id !== id))
  }

  const updateIngredient = (id: string, field: keyof IngredientItem, value: string) => {
    setFormIngredients(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)))
  }

  // Save Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskForm.staffName.trim()) {
      toast.error("Xodim F.I.O. kiritilishi shart!")
      return
    }
    if (!taskForm.title.trim()) {
      toast.error("Qilingan ish / taom nomi kiritilishi shart!")
      return
    }

    const validIngredients = formIngredients.filter(i => i.name.trim())

    setSavingTask(true)
    try {
      const payload = {
        ...taskForm,
        servings: taskForm.servings ? parseInt(taskForm.servings, 10) : null,
        itemsUsed: validIngredients,
        photos: formPhotos
      }

      const url = editingTask ? `/api/kitchen/tasks/${editingTask.id}` : '/api/kitchen/tasks'
      const method = editingTask ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(
          editingTask
            ? formatDual("Vazifa muvaffaqiyatli yangilandi!", "Запись обновлена!", "Task updated!")
            : formatDual("Yangi ish hisoboti va fotosuratlar saqlandi!", "Запись и фото сохранены!", "Report & photos saved!")
        )
        setIsTaskModalOpen(false)
        fetchTasks()
        fetchFeedbackAndMeals()
      } else {
        toast.error(data.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSavingTask(false)
    }
  }

  // Delete Task
  const handleDeleteTask = async (id: number) => {
    if (!confirm(formatDual("Ushbu hisobotni o'chirmoqchimisiz?", "Удалить эту запись?", "Delete this task log?"))) return
    try {
      const res = await fetch(`/api/kitchen/tasks/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success("O'chirildi")
        fetchTasks()
      } else {
        toast.error(data.error || "O'chirishda xatolik")
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

  // Quick Director Review Action
  const handleQuickApprove = async (task: KitchenTask) => {
    try {
      const res = await fetch(`/api/kitchen/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVIEW',
          status: 'APPROVED',
          reviewedBy: userName || 'Direktor',
          reviewComment: 'Qabul qilindi va tasdiqlandi'
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(formatDual("✅ Ish tasdiqlandi!", "✅ Запись одобрена!", "✅ Task approved!"))
        fetchTasks()
      }
    } catch {
      toast.error('Xatolik')
    }
  }

  const handleOpenReviewModal = (task: KitchenTask, action: 'APPROVED' | 'REJECTED') => {
    setReviewModalTask(task)
    setReviewActionType(action)
    setReviewCommentInput(
      action === 'APPROVED' ? 'Sifat talablariga to\'liq mos keladi' : 'E\'tiroz: '
    )
  }

  const handleSaveReviewModal = async () => {
    if (!reviewModalTask) return
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/kitchen/tasks/${reviewModalTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVIEW',
          status: reviewActionType,
          reviewedBy: userName || 'Direktor',
          reviewComment: reviewCommentInput
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          reviewActionType === 'APPROVED'
            ? formatDual("✅ Ish tasdiqlandi!", "✅ Одобрено!", "✅ Approved!")
            : formatDual("⚠️ E'tiroz qayd etildi!", "⚠️ Замечание зафиксировано!", "⚠️ Objection recorded!")
        )
        setReviewModalTask(null)
        fetchTasks()
      } else {
        toast.error(data.error || 'Xatolik')
      }
    } catch {
      toast.error('Xatolik')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Export Excel
  const handleExportExcel = () => {
    const params = new URLSearchParams()
    if (filterDate) params.append('date', filterDate)
    if (filterCategory !== 'ALL') params.append('category', filterCategory)
    params.append('lang', activeLang)
    window.open(`/api/kitchen/tasks/export?${params.toString()}`, '_blank')
    toast.success("Excel yuklab olinmoqda...")
  }

  // Copy Feedback QR Link
  const copyFeedbackLink = (token?: string | null) => {
    if (!token) return
    const link = `${baseUrl}/feedback/kitchen?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success("✅ Baholash havolasi nusxalandi!")
    setTimeout(() => setCopiedToken(null), 2500)
  }

  // Filtered Tasks for Cleaning Tab
  const cleaningTasks = useMemo(() => {
    return tasks.filter(t => t.category === 'CLEANING')
  }, [tasks])

  // Filtered Tasks for Meal Tab
  const mealTasks = useMemo(() => {
    return tasks.filter(t => t.category === 'MEAL' || t.category === 'SALAD')
  }, [tasks])

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-16 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white rounded-3xl p-6 shadow-xl border border-orange-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <ChefHat size={30} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {formatDual("Xodimlar Oshxonasi Nazorati", "Контроль кухни персонала", "Staff Kitchen QC & Photo Proof")}
              </h1>
              <span className="text-xs font-bold px-3 py-1 bg-white/20 text-white backdrop-blur rounded-full border border-white/30 flex items-center gap-1.5">
                <Camera size={13} /> {formatDual("Foto-Hisobot Tizimi", "Фото-контроль", "Photo Verification")}
              </span>
              {isDirector && (
                <span className="text-xs font-bold px-3 py-1 bg-black/30 text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1.5">
                  <ShieldCheck size={13} /> {formatDual("Direktor Xulosasi", "Контроль Директора", "Director Sign-off")}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-orange-100 font-medium mt-1">
              {formatDual(
                "Xodimlar lavozimi · Ish vaqti (soatbay) · Tayyorlangan taomlar & retseptura · Tozalik & Sanitariya fotolari",
                "Должности сотрудников · Рабочее время · Рецептуры и ингредиенты · Фотоотчеты санитарной обработки",
                "Staff roles · Shift hours · Recipes & portions · Sanitation & cleaning photo logs"
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition backdrop-blur border border-white/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {formatDual("Yangilash", "Обновить", "Refresh")}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition border border-emerald-400/30 shadow"
          >
            <FileSpreadsheet size={14} />
            {formatDual("Excel hisobot", "Экспорт в Excel", "Excel Report")}
          </button>

          <button
            onClick={() => setIsBrakerageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs md:text-sm font-black shadow-lg shadow-amber-500/25 active:scale-95 transition border border-amber-300/30"
            title="SanPiN: Tayyor mahsulotlarni nazorat qilish jurnali (Brakeraj)"
          >
            <ShieldCheck size={16} />
            <span>{formatDual("Tayyor Mahsulotlar Jurnali (Brakeraj)", "Журнал готовых блюд (Бракераж)", "Food Quality Inspection Log")}</span>
          </button>

          <button
            onClick={() => handleOpenNewTask('MEAL')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-orange-50 text-orange-900 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-black/20 active:scale-95 transition"
          >
            <Plus size={16} className="text-orange-600" />
            {formatDual("Yangi Ish / Foto Joylash", "Добавить работу с фото", "Log Duty / Photo Proof")}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm">
          <div className="text-slate-500 font-semibold flex items-center justify-between">
            <span>{formatDual("Jami ishlar", "Всего работ", "Total Tasks")}</span>
            <Layers size={14} className="text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">{taskStats.total}</div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950/20 p-3.5 rounded-2xl border border-orange-200 dark:border-orange-800/40">
          <div className="text-orange-700 font-semibold flex items-center justify-between">
            <span>{formatDual("Taomlar", "Блюда", "Meals")}</span>
            <Flame size={14} className="text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-950 dark:text-orange-300 mt-1 font-mono">{taskStats.meals}</div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
          <div className="text-emerald-700 font-semibold flex items-center justify-between">
            <span>{formatDual("Salatlar", "Салаты", "Salads")}</span>
            <UtensilsCrossed size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-950 dark:text-emerald-300 mt-1 font-mono">{taskStats.salads}</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/40">
          <div className="text-blue-700 font-semibold flex items-center justify-between">
            <span>{formatDual("Tozalash", "Уборка", "Cleaning")}</span>
            <Sparkle size={14} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-950 dark:text-blue-300 mt-1 font-mono">{taskStats.cleaning}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'PENDING'
              ? 'bg-amber-100 border-amber-400 shadow ring-2 ring-amber-500/30'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200'
          }`}
        >
          <div className="text-amber-800 font-semibold flex items-center justify-between">
            <span>{formatDual("Kutilmoqda", "На проверке", "Pending")}</span>
            <Clock size={14} className="text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950 dark:text-amber-300 mt-1 font-mono">{taskStats.pending}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-100 border-emerald-400 shadow ring-2 ring-emerald-500/30'
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
          }`}
        >
          <div className="text-emerald-800 font-semibold flex items-center justify-between">
            <span>{formatDual("Tasdiqlandi", "Одобрено", "Approved")}</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 dark:text-emerald-300 mt-1 font-mono">{taskStats.approved}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'REJECTED' ? 'ALL' : 'REJECTED')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
            filterStatus === 'REJECTED'
              ? 'bg-red-100 border-red-400 shadow ring-2 ring-red-500/30'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200'
          }`}
        >
          <div className="text-red-800 font-semibold flex items-center justify-between">
            <span>{formatDual("E'tiroz bor", "Замечания", "Objections")}</span>
            <AlertTriangle size={14} className="text-red-600" />
          </div>
          <div className="text-xl font-black text-red-950 dark:text-red-300 mt-1 font-mono">{taskStats.rejected}</div>
        </div>
      </div>

      {/* Main Filter & Navigation Tabs Bar */}
      <div className="bg-white dark:bg-dark-900 p-3 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Camera size={15} />
            {formatDual("Kunlik Ishlar & Foto-Nazorat", "Журнал работ и Фото-контроль", "Tasks & Photo Proof")}
          </button>

          <button
            onClick={() => setActiveTab('meals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'meals'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Flame size={15} />
            {formatDual("Taomlar & Retseptura", "Блюда и Рецептуры", "Meals & Recipes")}
          </button>

          <button
            onClick={() => setActiveTab('cleaning')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'cleaning'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <Sparkle size={15} />
            {formatDual("Sanitariya & Tozalash", "Санитария и Уборка", "Sanitation & Cleaning")}
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            <BarChart3 size={15} />
            {formatDual("Xodimlar Baholashi (Ovozlar)", "Оценки сотрудников", "Staff Feedback")}
          </button>

          <button
            onClick={() => setIsBrakerageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 shadow-2xs"
          >
            <ShieldCheck size={15} className="text-amber-600" />
            {formatDual("Tayyor Mahsulotlar (Brakeraj)", "Контроль блюд (Бракераж)", "Ready Food QC")}
          </button>
        </div>

        {/* Date, Category & Search Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 px-3 py-1.5 rounded-xl text-xs">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="bg-transparent outline-none text-slate-800 dark:text-slate-200 font-medium font-mono"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
          >
            {TASK_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {activeLang === 'ru' ? c.labelRu : activeLang === 'en' ? c.labelEn : c.labelUz}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search size={14} className="text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={formatDual("Xodim F.I.O...", "ФИО сотрудника...", "Staff name...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-800 dark:text-slate-200"
            />
          </div>

          {(filterCategory !== 'ALL' || filterStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterCategory('ALL')
                setFilterStatus('ALL')
                setSearchQuery('')
              }}
              className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-bold"
            >
              {formatDual("Tozalash", "Сброс", "Reset")}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KUNLIK ISHLAR VA FOTO-NAZORAT (PHOTO PROOF FEED) */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 mt-2">
                {formatDual("Oshxona hisobotlari yuklanmoqda...", "Загрузка отчетов кухни...", "Loading kitchen reports...")}
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm">
              <ChefHat size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {formatDual(
                  "Ushbu kunda hali hech qanday ish kiritilmagan",
                  "За этот день еще нет записей",
                  "No kitchen logs recorded for this day"
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {formatDual(
                  "Oshxona xodimlari o'z lavozimini, ish vaqtini (masalan: 07:00 - 16:30), tayyorlagan taomlari yoki tozalash ishlarini rasmlari bilan kiritishi mumkin.",
                  "Сотрудники кухни могут добавить свою должность, рабочие часы, приготовленные блюда или уборку с фотографиями.",
                  "Kitchen staff can record their shift duties, recipes, ingredients, and sanitation with proof photos."
                )}
              </p>
              <button
                onClick={() => handleOpenNewTask('MEAL')}
                className="mt-5 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95"
              >
                <Plus size={16} />
                {formatDual("Birinchi hisobotni qo'shing", "Добавить первую запись", "Add First Log")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tasks.map(task => {
                let itemsList: IngredientItem[] = []
                try {
                  itemsList = JSON.parse(task.itemsUsed || '[]')
                } catch {
                  itemsList = []
                }

                let photosList: string[] = []
                try {
                  photosList = JSON.parse(task.photos || '[]')
                } catch {
                  photosList = []
                }

                const catBadge = TASK_CATEGORIES.find(c => c.id === task.category)

                return (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-dark-900 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                      task.status === 'REJECTED'
                        ? 'border-red-300 dark:border-red-800/60 bg-red-50/20 dark:bg-red-950/20 ring-1 ring-red-400'
                        : task.status === 'APPROVED'
                        ? 'border-emerald-200 dark:border-emerald-800/40'
                        : 'border-slate-200 dark:border-dark-750'
                    }`}
                  >
                    {/* Card Top: Staff & Time Info */}
                    <div className="p-4 border-b border-slate-100 dark:border-dark-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {task.staffName}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                              {task.staffRole}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={12} className="text-orange-500" />
                              {task.timeFrom} - {task.timeTo}
                            </span>
                            <span>•</span>
                            <span className="font-semibold">{task.shift}</span>
                            <span>•</span>
                            <span className="font-mono">{task.date}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {task.status === 'APPROVED' ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1">
                              <CheckCircle2 size={12} /> {formatDual("Tasdiqlandi", "Одобрено", "Approved")}
                            </span>
                          ) : task.status === 'REJECTED' ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800/60 flex items-center gap-1">
                              <AlertTriangle size={12} /> {formatDual("E'tiroz bor", "Замечание", "Objection")}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1">
                              <Clock size={12} /> {formatDual("Kutilmoqda", "На проверке", "Pending")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body: Task Content */}
                    <div className="p-4 space-y-3 flex-1">
                      {/* Category & Title */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-md border border-orange-200 dark:border-orange-900/50">
                            {activeLang === 'ru' ? catBadge?.labelRu : activeLang === 'en' ? catBadge?.labelEn : catBadge?.labelUz}
                          </span>
                          {task.servings && (
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-md">
                              {task.servings} {formatDual("kishiga", "порций", "servings")}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Ingredients used (if MEAL or SALAD) */}
                      {itemsList.length > 0 && (
                        <div className="bg-slate-50 dark:bg-dark-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700">
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <UtensilsCrossed size={12} className="text-orange-500" />
                            {formatDual("Ishlatilgan masalliqlar (Retseptura):", "Использованные ингредиенты:", "Used ingredients:")}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {itemsList.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium px-2 py-0.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-md text-slate-800 dark:text-slate-200 shadow-2xs"
                              >
                                <span className="font-bold">{item.name}</span>: {item.qty} {item.unit || 'kg'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cleaning details (if CLEANING) */}
                      {task.category === 'CLEANING' && (task.cleaningArea || task.cleaningAgent) && (
                        <div className="bg-blue-50/60 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/40 text-xs">
                          {task.cleaningArea && (
                            <div className="text-slate-700 dark:text-slate-300 font-medium">
                              <span className="font-bold text-blue-900 dark:text-blue-300">Tozalangan joy:</span> {task.cleaningArea}
                            </div>
                          )}
                          {task.cleaningAgent && (
                            <div className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">
                              <span className="font-bold text-blue-900 dark:text-blue-300">Ishlatilgan vosita:</span> {task.cleaningAgent}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Photo Evidence Gallery */}
                      {photosList.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Camera size={12} className="text-emerald-600" />
                              {formatDual("Foto-Isbot:", "Фотоотчет:", "Photo Proof:")}
                            </span>
                            <span className="text-[10px] text-slate-400">{photosList.length} ta foto</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {photosList.map((url, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setLightboxPhoto({ url, title: `${task.staffName} — ${task.title}` })}
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 group cursor-pointer shadow-xs hover:ring-2 hover:ring-orange-500 transition"
                              >
                                <img
                                  src={url}
                                  alt="Kitchen proof"
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye size={16} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Director Review Comment Box (if exists) */}
                      {task.reviewComment && (
                        <div
                          className={`p-2.5 rounded-xl text-xs border ${
                            task.status === 'REJECTED'
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1">
                            <ShieldCheck size={13} />
                            <span>{task.reviewedBy || 'Direktor'} xulosasi:</span>
                          </div>
                          <p className="mt-0.5 font-medium">{task.reviewComment}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Action & Review Controls */}
                    <div className="p-3 bg-slate-50 dark:bg-dark-800/80 border-t border-slate-100 dark:border-dark-800 flex flex-wrap gap-2 items-center justify-between">
                      {/* Left: QR Voting link if mealLog exists */}
                      <div>
                        {task.mealLog?.token && (
                          <button
                            onClick={() => copyFeedbackLink(task.mealLog?.token)}
                            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-100/70 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition"
                            title="Xodimlar ovqatga ovoz berishi uchun havola"
                          >
                            <Copy size={12} />
                            <span>
                              {copiedToken === task.mealLog.token
                                ? formatDual("Nusxalandi!", "Скопировано!", "Copied!")
                                : formatDual("Ovoz berish QR", "Ссылка оценки", "Vote QR")}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Right: Director / Inspector approval or edit/delete */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {isInspectorOrDirector && (
                          <>
                            {task.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleQuickApprove(task)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition"
                                title="Bir klikda tasdiqlash"
                              >
                                {formatDual("Tasdiqlash", "Одобрить", "Approve")}
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenReviewModal(task, 'REJECTED')}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition"
                              title="E'tiroz bildirish"
                            >
                              {formatDual("E'tiroz", "Замечание", "Objection")}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEditTask(task)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                          title="Tahrirlash"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAOMLAR VA RETSEPTURA JURNALI */}
      {/* ========================================================================= */}
      {activeTab === 'meals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="text-orange-500" size={18} />
                {formatDual("Tayyorlangan Taomlar va Masalliqlar Sarfi", "Приготовленные блюда и расход сырья", "Cooked Meals & Ingredient Expenditure")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDual(
                  "Porsiyalar soni va har bir taomga solingan masalliqlar (retseptura) nazorati",
                  "Количество порций и раскладка ингредиентов по каждому блюду",
                  "Portions count and ingredient breakdown for each meal"
                )}
              </p>
            </div>
            <button
              onClick={() => handleOpenNewTask('MEAL')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus size={14} />
              {formatDual("Yangi Taom Kiritish", "Добавить блюдо", "Add Meal")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealTasks.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200">
                <UtensilsCrossed size={36} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">
                  {formatDual("Taomlar mavjud emas", "Блюд не найдено", "No meals found for this date")}
                </p>
              </div>
            ) : (
              mealTasks.map(task => {
                let items: IngredientItem[] = []
                try {
                  items = JSON.parse(task.itemsUsed || '[]')
                } catch {}

                let photos: string[] = []
                try {
                  photos = JSON.parse(task.photos || '[]')
                } catch {}

                return (
                  <div key={task.id} className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                          {task.category === 'MEAL' ? '🍲 Taom' : '🥗 Salat'}
                        </span>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                          {task.title}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {task.staffName} ({task.staffRole}) • {task.servings || '-'} {formatDual("kishiga", "порций", "servings")}
                        </div>
                      </div>
                      {photos[0] && (
                        <img
                          src={photos[0]}
                          alt={task.title}
                          onClick={() => setLightboxPhoto({ url: photos[0], title: task.title })}
                          className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:scale-105 transition border border-slate-200 dark:border-dark-700"
                        />
                      )}
                    </div>

                    {/* Ingredients list */}
                    {items.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-800">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {formatDual("Masalliqlar ro'yxati:", "Раскладка сырья:", "Ingredients:")}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {items.map((it, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-dark-800 p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 flex justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate mr-1">{it.name}</span>
                              <span className="font-bold text-orange-700 dark:text-orange-400 shrink-0 font-mono">
                                {it.qty} {it.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SANITARIYA VA TOZALASH JURNALI */}
      {/* ========================================================================= */}
      {activeTab === 'cleaning' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-750">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkle className="text-blue-500" size={18} />
                {formatDual("Sanitariya, Dezinfeksiya va Tozalash Nazorati", "Санитария, дезинфекция и уборка", "Sanitation, Disinfection & Cleaning QC")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatDual(
                  "Qaysi xodim qayerlarni qanday vositalar bilan tozalaganligi va tozalik fotosuratlari",
                  "Кто производил уборку, зоны обработки, дезинфицирующие средства и фотоотчет",
                  "Who cleaned which areas, disinfectants used and photographic proof"
                )}
              </p>
            </div>
            <button
              onClick={() => handleOpenNewTask('CLEANING')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow"
            >
              <Plus size={14} />
              {formatDual("Tozalash Hisobotini Joylash", "Добавить отчет об уборке", "Log Cleaning Proof")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningTasks.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750">
                <Sparkle size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {formatDual("Ushbu kunda tozalash hisoboti hali kiritilmagan", "Отчетов об уборке за этот день нет", "No cleaning logs for this date")}
                </p>
              </div>
            ) : (
              cleaningTasks.map(task => {
                let photos: string[] = []
                try {
                  photos = JSON.parse(task.photos || '[]')
                } catch {}

                return (
                  <div key={task.id} className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                          🧹 Tozalash & Sanitariya
                        </span>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                          {task.title}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {task.staffName} ({task.staffRole}) • {task.timeFrom} - {task.timeTo}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-800 p-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-xs space-y-1">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Tozalangan joy:</span>{' '}
                        <span className="text-slate-900 dark:text-white font-medium">{task.cleaningArea || '-'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Ishlatilgan vosita:</span>{' '}
                        <span className="text-slate-900 dark:text-white font-medium">{task.cleaningAgent || '-'}</span>
                      </div>
                    </div>

                    {photos.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tozalik fotosuratlari:</div>
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="Cleaning proof"
                              onClick={() => setLightboxPhoto({ url, title: task.title })}
                              className="w-full aspect-video object-cover rounded-lg border border-slate-200 dark:border-dark-700 cursor-pointer hover:scale-105 transition"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: XODIMLAR BAHOLASHI VA OVOZLAR */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-900 p-5 rounded-2xl border border-slate-200 dark:border-dark-750">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-emerald-500" size={18} />
              {formatDual("Xodimlarning Ovqatga Bergan Baholari", "Оценки сотрудников блюдам", "Staff Meal Feedback & Ratings")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatDual(
                "Xodimlar har kuni tushlikdan so'ng anonim tarzda ovqat sifatiga (A'lo, O'rtacha, Yomon) ovoz berishadi",
                "Сотрудники анонимно оценивают качество питания после обеда",
                "Employees anonymously rate food quality after mealtime"
              )}
            </p>

            {/* Score Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">😋 A'lo / Mazali (Good)</div>
                <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 font-mono mt-1">{feedbackStats.good}</div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">😐 O'rtacha (Average)</div>
                <div className="text-2xl font-black text-amber-950 dark:text-amber-200 font-mono mt-1">{feedbackStats.average}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800/40">
                <div className="text-xs font-bold text-red-800 dark:text-red-300">😞 Yomon / E'tiroz (Bad)</div>
                <div className="text-2xl font-black text-red-950 dark:text-red-200 font-mono mt-1">{feedbackStats.bad}</div>
              </div>
            </div>
          </div>

          {/* Feedback comments */}
          <div className="space-y-2">
            {feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-750 text-xs text-slate-500 dark:text-slate-400">
                {formatDual("Ushbu kunda hali sharhlar qoldirilmagan", "Отзывов за этот день пока нет", "No feedback comments yet")}
              </div>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.id} className="bg-white dark:bg-dark-900 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-750 flex flex-wrap gap-2 items-center justify-between text-xs">
                  <div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[10px] mr-2 ${
                        fb.rating === 'GOOD'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          : fb.rating === 'AVERAGE'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40'
                      }`}
                    >
                      {fb.rating}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fb.mealName || 'Ovqat'}</span>
                    {fb.comment && <span className="text-slate-600 dark:text-slate-400 ml-2 italic">«{fb.comment}»</span>}
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{fb.createdAt?.slice(11, 16)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT TASK WITH PHOTO UPLOAD & INGREDIENTS */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setIsTaskModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-dark-750 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <ChefHat size={20} />
                  {editingTask
                    ? formatDual("Hisobotni Tahrirlash", "Редактирование записи", "Edit Task Log")
                    : formatDual("Oshxona Xodimi Ish Hisoboti va Foto Joylash", "Отчет сотрудника кухни с фото", "Kitchen Staff Shift & Photo Proof")}
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">
                  {formatDual(
                    "Lavozim, ish vaqti, tayyorlangan taom, ishlatilgan mahsulotlar va tozalik fotolarini kiriting",
                    "Укажите должность, часы работы, блюда, продукты и прикрепите фото",
                    "Enter role, shift hours, recipe/ingredients, and attach proof photos"
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveTask} className="p-5 overflow-y-auto space-y-4 text-xs bg-slate-50/50 dark:bg-dark-900 text-slate-800 dark:text-slate-200">
              {/* Section 1: Staff Info & Work Time */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users size={14} className="text-orange-600" />
                  1. Xodim ma'lumotlari va Ish vaqti
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Xodim F.I.O. *</label>
                    <input
                      type="text"
                      required
                      placeholder="Rahmonov Alisher"
                      value={taskForm.staffName}
                      onChange={e => setTaskForm({ ...taskForm, staffName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lavozimi *</label>
                    <select
                      value={taskForm.staffRole}
                      onChange={e => setTaskForm({ ...taskForm, staffRole: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      {STAFF_ROLES.map(r => (
                        <option key={r.id} value={r.id}>
                          {activeLang === 'ru' ? r.labelRu : activeLang === 'en' ? r.labelEn : r.labelUz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Smena</label>
                    <select
                      value={taskForm.shift}
                      onChange={e => setTaskForm({ ...taskForm, shift: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                    >
                      <option value="1-Smena">1-Smena (07:00 - 16:30)</option>
                      <option value="2-Smena">2-Smena (16:30 - 23:00)</option>
                      <option value="Tun">Tungi smena (23:00 - 07:00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sana</label>
                    <input
                      type="date"
                      value={taskForm.date}
                      onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ish boshlanishi</label>
                    <input
                      type="time"
                      value={taskForm.timeFrom}
                      onChange={e => setTaskForm({ ...taskForm, timeFrom: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ish tugashi</label>
                    <input
                      type="time"
                      value={taskForm.timeTo}
                      onChange={e => setTaskForm({ ...taskForm, timeTo: e.target.value })}
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Task Category & Title */}
              <div className="p-4 bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-600" />
                  2. Ish toifasi va Tavsifi
                </div>

                {/* Category Selector Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {TASK_CATEGORIES.filter(c => c.id !== 'ALL').map(c => {
                    const isSelected = taskForm.category === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setTaskForm({
                            ...taskForm,
                            category: c.id as any,
                            title:
                              taskForm.title ||
                              (c.id === 'MEAL' ? 'Osh tayyorlash' : c.id === 'CLEANING' ? 'Qozonlar va plitalarni tozalash' : c.id === 'SALAD' ? 'Sveji salat tayyorlash' : '')
                          })
                        }}
                        className={`p-2 rounded-xl border text-center transition font-bold text-xs ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 shadow'
                            : 'bg-slate-50 dark:bg-dark-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-800'
                        }`}
                      >
                        {activeLang === 'ru' ? c.labelRu : activeLang === 'en' ? c.labelEn : c.labelUz}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Qilingan ish / Taom nomi *</label>
                    <input
                      type="text"
                      required
                      placeholder={
                        taskForm.category === 'MEAL'
                          ? "Masalan: Osh, Mastava, Sho'rva..."
                          : taskForm.category === 'CLEANING'
                          ? "Qozonlar va plitalarni xlor bilan yuvish"
                          : "Ish nomi"
                      }
                      value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {(taskForm.category === 'MEAL' || taskForm.category === 'SALAD') && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Necha kishiga (Porsiya)</label>
                      <input
                        type="number"
                        placeholder="120"
                        value={taskForm.servings}
                        onChange={e => setTaskForm({ ...taskForm, servings: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Batafsil ma'lumot / Izoh</label>
                  <textarea
                    rows={2}
                    placeholder="Qilingan ish haqida qo'shimcha ma'lumot..."
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Section 3: Ingredients & Recipes (if MEAL, SALAD, PREP, BAKERY) */}
              {(taskForm.category === 'MEAL' ||
                taskForm.category === 'SALAD' ||
                taskForm.category === 'PREP' ||
                taskForm.category === 'BAKERY') && (
                <div className="p-4 bg-orange-50/70 dark:bg-orange-950/20 rounded-2xl border border-orange-200 dark:border-orange-900/40 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="font-bold text-orange-950 dark:text-orange-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <UtensilsCrossed size={14} className="text-orange-600" />
                      3. Ishlatilgan masalliqlar va Retseptura (Nima solindi, qancha)
                    </div>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-700 dark:text-orange-300 hover:text-orange-900 bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/60 px-2.5 py-1 rounded-lg transition"
                    >
                      <Plus size={13} /> Masalliq qo'shish
                    </button>
                  </div>

                  {/* Quick Click Ingredients */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mr-1">Tezkor tanlash:</span>
                    {QUICK_INGREDIENTS.slice(0, 10).map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const last = formIngredients[formIngredients.length - 1]
                          if (!last.name) {
                            updateIngredient(last.id, 'name', name)
                          } else {
                            setFormIngredients(prev => [
                              ...prev,
                              { id: Date.now().toString(), name, qty: '5', unit: 'kg' }
                            ])
                          }
                        }}
                        className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-dark-850 border border-orange-200 dark:border-orange-900/50 text-slate-700 dark:text-slate-300 rounded-md hover:bg-orange-100 dark:hover:bg-dark-750 transition"
                      >
                        + {name}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Ingredient Rows */}
                  <div className="space-y-2">
                    {formIngredients.map((item, idx) => (
                      <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          placeholder="Mahsulot nomi (Go'sht, Guruch...)"
                          value={item.name}
                          onChange={e => updateIngredient(item.id, 'name', e.target.value)}
                          className="flex-1 p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Miqdori (15.5)"
                          value={item.qty}
                          onChange={e => updateIngredient(item.id, 'qty', e.target.value)}
                          className="w-24 p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-mono text-center text-slate-900 dark:text-white"
                        />
                        <select
                          value={item.unit}
                          onChange={e => updateIngredient(item.id, 'unit', e.target.value)}
                          className="w-20 p-2 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-bold text-slate-900 dark:text-white"
                        >
                          <option value="kg">kg</option>
                          <option value="litr">litr</option>
                          <option value="dona">dona</option>
                          <option value="gramm">gramm</option>
                          <option value="bog'">bog'</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeIngredient(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Cleaning Details (if CLEANING) */}
              {taskForm.category === 'CLEANING' && (
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-3">
                  <div className="font-bold text-blue-950 dark:text-blue-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkle size={14} className="text-blue-600" />
                    3. Sanitariya va Tozalash Joyi & Vositalari
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tozalangan joy / Hudud *</label>
                      <input
                        type="text"
                        placeholder="Qozonlar, plita va pollar..."
                        value={taskForm.cleaningArea}
                        onChange={e => setTaskForm({ ...taskForm, cleaningArea: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {CLEANING_AREAS.slice(0, 4).map((a, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTaskForm({ ...taskForm, cleaningArea: a })}
                            className="text-[10px] px-2 py-0.5 bg-white dark:bg-dark-900 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-dark-800 transition"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ishlatilgan tozalash vositasi *</label>
                      <input
                        type="text"
                        placeholder="Fayri, Xlor 2%, Dezinfeksiya vositasi..."
                        value={taskForm.cleaningAgent}
                        onChange={e => setTaskForm({ ...taskForm, cleaningAgent: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Photo Upload (Photo Evidence) */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Camera size={14} className="text-emerald-600" />
                    4. Foto-Hisobot (Qilingan ish fotosuratlari) *
                  </div>
                  <label className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-xl transition">
                    <Camera size={14} />
                    <span>Foto yuklash</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadingPhoto && (
                  <div className="p-3 bg-white dark:bg-dark-900 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Rasm serverga yuklanmoqda...</span>
                  </div>
                )}

                {formPhotos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 text-center bg-white dark:bg-dark-900 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 cursor-pointer transition"
                  >
                    <ImageIcon size={32} className="mx-auto text-emerald-400 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Rasm biriktirish uchun shu yerni bosing</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Telefon kamerasidan rasmga olish yoki fayllardan tanlash mumkin (JPG, PNG)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {formPhotos.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 dark:border-dark-700 group">
                        <img src={url} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition shadow"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-video rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 cursor-pointer flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 bg-white dark:bg-dark-900 transition">
                      <Plus size={20} />
                      <span className="text-[10px] font-bold mt-1">Yana foto</span>
                      <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex flex-wrap gap-2 items-center justify-end pt-3 border-t border-slate-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black shadow-lg shadow-orange-600/30 transition active:scale-95 disabled:opacity-60"
                >
                  {savingTask && <Loader2 size={16} className="animate-spin" />}
                  {editingTask ? "O'zgarishlarni Saqlash" : "Hisobotni Tasdiqqa Yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL: FULLSIZE PHOTO PREVIEW */}
      {/* ========================================================================= */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxPhoto.url}
              alt="Full Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            {lightboxPhoto.title && (
              <div className="text-white text-sm font-bold mt-3 text-center bg-black/60 px-4 py-1.5 rounded-full border border-white/20">
                {lightboxPhoto.title}
              </div>
            )}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 text-white p-2 hover:bg-white/20 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECTOR REVIEW / OBJECTION MODAL */}
      {/* ========================================================================= */}
      {reviewModalTask && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReviewModalTask(null)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-dark-750 shadow-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="text-orange-600" size={20} />
                {reviewActionType === 'APPROVED' ? "Tasdiqlash Xulosasi" : "E'tiroz Bildirish"}
              </h3>
              <button 
                onClick={() => setReviewModalTask(null)} 
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{reviewModalTask.title}</div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                {reviewModalTask.staffName} ({reviewModalTask.staffRole}) • {reviewModalTask.date}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {reviewActionType === 'APPROVED' ? "Direktor izohi (ixtiyoriy):" : "E'tiroz sababi (majburiy):"}
              </label>
              <textarea
                rows={3}
                required={reviewActionType === 'REJECTED'}
                placeholder={
                  reviewActionType === 'REJECTED'
                    ? "Masalan: Qozon yaxshi yuvilmagan / Go'sht kam solingan, qayta tekshirilsin..."
                    : "Izoh..."
                }
                value={reviewCommentInput}
                onChange={e => setReviewCommentInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalTask(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSaveReviewModal}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow transition active:scale-95 ${
                  reviewActionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {submittingReview ? "Saqlanmoqda..." : reviewActionType === 'APPROVED' ? "Tasdiqlash" : "E'tirozni Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAYYOR MAHSULOTLARNI NAZORAT QILISH JURNALI (BRAKERAJ) MODAL */}
      {/* ========================================================================= */}
      <BrakerageJournalModal
        isOpen={isBrakerageModalOpen}
        onClose={() => setIsBrakerageModalOpen(false)}
      />
    </div>
  )
}

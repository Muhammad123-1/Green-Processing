'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  AlertOctagon,
  Boxes,
  Factory,
  FileClock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

type DeptKey = 'ALL' | 'production' | 'warehouse' | 'qc' | 'maintenance'

interface Props {
  dateFrom: string
  dateTo: string
  lang: string
}

interface OperationActionItem {
  id: string
  department: 'production' | 'warehouse' | 'qc' | 'maintenance'
  deptName: string
  actor: string
  action: string
  productName: string
  quantityStr: string
  dateStr: string
  status: 'COMPLETED' | 'WARNING' | 'CRITICAL' | 'NORMAL'
  statusText: string
  details: Record<string, any>
}

export default function OperationsExecutivePanel({ dateFrom, dateTo, lang }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deptFilter, setDeptFilter] = useState<DeptKey>('ALL')
  const [selectedDept, setSelectedDept] = useState<DeptKey | null>(null)
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState<OperationActionItem | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams()
      if (dateFrom) p.set('dateFrom', dateFrom)
      if (dateTo) p.set('dateTo', dateTo)
      const res = await fetch(`/api/director/operations-overview?${p}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Ma'lumot yuklanmadi")
      setData(json)
    } catch (e: any) {
      setError(e?.message || 'Server xatoligi')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  const n = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : value.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })

  // Convert raw heterogeneous backend records into a unified, human-readable action list
  const unifiedActions = useMemo<OperationActionItem[]>(() => {
    if (!data) return []
    const list: OperationActionItem[] = []

    // 1. Production Orders
    if (data.production?.orders) {
      data.production.orders.forEach((o: any) => {
        const prodName = o.recipe?.outputProduct?.name || 'Mahsulot'
        const unit = o.recipe?.outputProduct?.unit || 'kg'
        const actQty = o.actualOutput !== null ? `${n(o.actualOutput)} ${unit}` : `${n(o.plannedOutput)} ${unit} (Reja)`
        list.push({
          id: `order-${o.id}`,
          department: 'production',
          deptName: lang === 'ru' ? 'Производственный цех' : 'Ishlab chiqarish sexi',
          actor: o.lineName || (lang === 'ru' ? 'Смена цеха переработки' : 'Tayyorlash sexi ustasi'),
          action: lang === 'ru' ? `Выпуск партии ${o.orderNumber || ''}` : `Ishlab chiqarish partiyasi ${o.orderNumber || ''}`,
          productName: prodName,
          quantityStr: actQty,
          dateStr: o.createdAt ? new Date(o.createdAt).toLocaleDateString('uz-UZ') : '—',
          status: o.status === 'COMPLETED' ? 'COMPLETED' : 'WARNING',
          statusText: o.status === 'COMPLETED' ? (lang === 'ru' ? 'Завершено' : 'Bajarildi') : (lang === 'ru' ? 'В процессе' : 'Jarayonda'),
          details: {
            [lang === 'ru' ? 'Номер заказа' : 'Buyurtma raqami']: o.orderNumber || `#${o.id}`,
            [lang === 'ru' ? 'Продукт' : 'Mahsulot']: prodName,
            [lang === 'ru' ? 'План' : 'Reja']: `${n(o.plannedOutput)} ${unit}`,
            [lang === 'ru' ? 'Факт' : 'Haqiqiy chiqim']: o.actualOutput !== null ? `${n(o.actualOutput)} ${unit}` : 'Kiritilmagan',
            [lang === 'ru' ? 'Линия' : 'Liniya']: o.lineName || 'Asosiy liniya',
            [lang === 'ru' ? 'Статус' : 'Holati']: o.status,
          },
        })
      })
    }

    // 2. Stock Transfers (Warehouse)
    if (data.warehouse?.transfers) {
      data.warehouse.transfers.forEach((tr: any) => {
        const prodName = tr.product?.name || 'Xomashyo'
        const unit = tr.issuedUnit || 'kg'
        const hasDisc = (tr.discrepancy || 0) > 0
        list.push({
          id: `tr-${tr.id}`,
          department: 'warehouse',
          deptName: lang === 'ru' ? 'Складской отдел' : 'Omborxona bo‘limi',
          actor: lang === 'ru' ? 'Заведующий складом' : 'Bosh ombor mudiri',
          action: lang === 'ru' ? `Перемещение ${tr.transferNumber}` : `Sexga uzatish: ${tr.transferNumber}`,
          productName: prodName,
          quantityStr: `${n(tr.issuedQuantity)} ${unit}`,
          dateStr: tr.issuedAt ? new Date(tr.issuedAt).toLocaleDateString('uz-UZ') : '—',
          status: hasDisc ? 'CRITICAL' : 'COMPLETED',
          statusText: hasDisc
            ? (lang === 'ru' ? `Расхождение ${tr.discrepancy} ${unit}` : `${tr.discrepancy} ${unit} farq aniqlandi`)
            : (lang === 'ru' ? 'Передано' : 'Muvaffaqiyatli uzatildi'),
          details: {
            [lang === 'ru' ? 'Документ' : 'Hujjat raqami']: tr.transferNumber,
            [lang === 'ru' ? 'Сырье' : 'Xomashyo']: prodName,
            [lang === 'ru' ? 'Откуда' : 'Qayerdan']: tr.sourceLocation,
            [lang === 'ru' ? 'Куда' : 'Qayerga']: tr.targetLocation,
            [lang === 'ru' ? 'Передано' : 'Uzatilgan miqdor']: `${n(tr.issuedQuantity)} ${unit}`,
            [lang === 'ru' ? 'Принято' : 'Qabul qilingan']: `${n(tr.receivedQuantity)} ${unit}`,
            [lang === 'ru' ? 'Расхождение' : 'Tafovut']: hasDisc ? `${tr.discrepancy} ${unit}` : 'Yo‘q (0)',
          },
        })
      })
    }

    // 3. QC Alerts & Logs
    if (data.alerts) {
      data.alerts.forEach((al: any) => {
        const isQC = al.kind === 'QC' || al.kind === 'DEFECT'
        const isMaint = al.kind === 'MAINTENANCE'
        const dept = isMaint ? 'maintenance' : isQC ? 'qc' : 'warehouse'
        const deptName = isMaint
          ? (lang === 'ru' ? 'Техобслуживание' : 'Texnik xizmat')
          : isQC
            ? (lang === 'ru' ? 'Контроль качества (ОКК)' : 'Sifat nazorati (OKK)')
            : (lang === 'ru' ? 'Складской отдел' : 'Omborxona bo‘limi')

        list.push({
          id: al.id,
          department: dept,
          deptName,
          actor: lang === 'ru' ? 'Инспектор / Специалист' : 'Sifat inspektori / Mas’ul mutaxassis',
          action: al.title,
          productName: al.detail?.split('·')[0]?.trim() || al.title,
          quantityStr: al.detail?.split('·')[1]?.trim() || '—',
          dateStr: al.occurredAt ? new Date(al.occurredAt).toLocaleDateString('uz-UZ') : '—',
          status: al.severity === 'CRITICAL' ? 'CRITICAL' : al.severity === 'WARNING' ? 'WARNING' : 'NORMAL',
          statusText: al.severity === 'CRITICAL' ? (lang === 'ru' ? 'Критично' : 'Kritik holat') : (lang === 'ru' ? 'Внимание' : 'Tekshiruv'),
          details: {
            [lang === 'ru' ? 'Событие' : 'Hodisa nomi']: al.title,
            [lang === 'ru' ? 'Описание' : 'Tafsilot']: al.detail,
            [lang === 'ru' ? 'Уровень важности' : 'Darajasi']: al.severity,
            [lang === 'ru' ? 'Дата и время' : 'Vaqt']: al.occurredAt ? new Date(al.occurredAt).toLocaleString('uz-UZ') : '—',
          },
        })
      })
    }

    // 4. Audit Trail (Operations by actual staff)
    if (data.audit) {
      data.audit.forEach((au: any) => {
        list.push({
          id: `audit-${au.id}`,
          department: 'qc',
          deptName: lang === 'ru' ? 'Аудит операций' : 'Xodimlar auditi',
          actor: au.actor || au.username || (lang === 'ru' ? 'Оператор системы' : 'Smena dispetcheri'),
          action: `${au.operation}: ${au.tableName}`,
          productName: au.tableName,
          quantityStr: au.role || 'Operatsion amal',
          dateStr: au.createdAt ? new Date(au.createdAt).toLocaleDateString('uz-UZ') : '—',
          status: 'NORMAL',
          statusText: lang === 'ru' ? 'Зафиксировано' : 'Qayd etildi',
          details: {
            [lang === 'ru' ? 'Сотрудник' : 'Xodim']: au.actor || 'Tizim foydalanuvchisi',
            [lang === 'ru' ? 'Логин' : 'Login']: au.username || '—',
            [lang === 'ru' ? 'Роль' : 'Lavozimi']: au.role || '—',
            [lang === 'ru' ? 'Таблица' : 'Bo‘lim']: au.tableName,
            [lang === 'ru' ? 'Операция' : 'Amal']: au.operation,
            [lang === 'ru' ? 'Время' : 'Vaqt']: au.createdAt ? new Date(au.createdAt).toLocaleString('uz-UZ') : '—',
          },
        })
      })
    }

    return list
  }, [data, lang])

  // Department counts
  const prodActions = useMemo(() => unifiedActions.filter((a) => a.department === 'production'), [unifiedActions])
  const whActions = useMemo(() => unifiedActions.filter((a) => a.department === 'warehouse'), [unifiedActions])
  const qcActions = useMemo(() => unifiedActions.filter((a) => a.department === 'qc'), [unifiedActions])
  const maintActions = useMemo(() => unifiedActions.filter((a) => a.department === 'maintenance'), [unifiedActions])

  // Active list filtered by search and selected department
  const filteredActions = useMemo(() => {
    let list = unifiedActions
    const targetDept = selectedDept || (deptFilter !== 'ALL' ? deptFilter : null)
    if (targetDept) {
      list = list.filter((a) => a.department === targetDept)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.actor.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          a.deptName.toLowerCase().includes(q)
      )
    }
    return list
  }, [unifiedActions, selectedDept, deptFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredActions.length / pageSize))
  const paginatedActions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredActions.slice(start, start + pageSize)
  }, [filteredActions, page])

  if (loading && !data) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-8 shadow-xs">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
        <span className="text-xs font-bold text-slate-500">
          {lang === 'ru' ? 'Загрузка журнала действий сотрудников...' : 'Xodimlar faoliyati jurnali yuklanmoqda...'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-rose-200 bg-rose-50 dark:bg-rose-950/40 rounded-2xl text-rose-800 dark:text-rose-300 flex justify-between items-center text-xs">
        <span>{error}</span>
        <button className="font-bold underline ml-3" onClick={load}>
          {lang === 'ru' ? 'Повторить' : 'Qayta urinish'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Top KPI Summary Cards (Matching Operatsiyalar design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Jami Operatsiyalar */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Всего операций' : 'Jami xodimlar amallari'}</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <User size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono">
            {unifiedActions.length} ta
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {lang === 'ru' ? 'По всем цехам и отделам' : 'Barcha bo‘limlar bo‘yicha'}
          </p>
        </div>

        {/* Card 2: Ishlab chiqarish sexi */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Цех переработки' : 'Ishlab chiqarish sexi'}</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Factory size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {prodActions.length} ta amal
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {n(data?.production?.totals?.actualOutput)} kg {lang === 'ru' ? 'выпуска' : 'tayyor mahsulot'}
          </p>
        </div>

        {/* Card 3: Omborxona */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Складской учет' : 'Omborxona harakatlari'}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Boxes size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {whActions.length} ta
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {data?.warehouse?.totals?.products || 0} {lang === 'ru' ? 'позиций на остатке' : 'xil qoldiq nazoratda'}
          </p>
        </div>

        {/* Card 4: Sifat nazorati & Texnik xizmat */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>{lang === 'ru' ? 'Контроль ОКК и техслужба' : 'Sifat nazorati & Uskunalar'}</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {qcActions.length + maintActions.length} ta
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {lang === 'ru' ? 'Проверки и инциденты' : 'Nazorat va chiptalar'}
          </p>
        </div>
      </div>

      {/* 2. Toolbar & Drill-down Navigation */}
      <div className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedDept ? (
            <button
              onClick={() => {
                setSelectedDept(null)
                setDeptFilter('ALL')
                setPage(1)
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ChevronLeft size={14} />
              <span>{lang === 'ru' ? 'Все отделы (Назад)' : 'Barcha bo‘limlar (Orqaga)'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setDeptFilter('ALL')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  deptFilter === 'ALL'
                    ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'ru' ? 'Все' : 'Barchasi'} ({unifiedActions.length})
              </button>
              <button
                onClick={() => {
                  setDeptFilter('production')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  deptFilter === 'production'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                <Factory size={13} />
                <span>{lang === 'ru' ? 'Цех' : 'Ishlab chiqarish'}</span>
                <span className="opacity-80 text-[11px]">({prodActions.length})</span>
              </button>
              <button
                onClick={() => {
                  setDeptFilter('warehouse')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  deptFilter === 'warehouse'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <Boxes size={13} />
                <span>{lang === 'ru' ? 'Склад' : 'Omborxona'}</span>
                <span className="opacity-80 text-[11px]">({whActions.length})</span>
              </button>
              <button
                onClick={() => {
                  setDeptFilter('qc')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  deptFilter === 'qc'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                }`}
              >
                <ShieldCheck size={13} />
                <span>{lang === 'ru' ? 'ОКК' : 'Sifat nazorati'}</span>
                <span className="opacity-80 text-[11px]">({qcActions.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск сотрудника, действия...' : 'Xodim, amal yoki mahsulot...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-60"
            />
          </div>

          <button onClick={load} className="p-2 text-slate-500 hover:text-slate-800 rounded-xl" title="Yangilash">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
        </div>
      </div>

      {/* 3. LEVEL 1: Department Cards Grid (When no department is drill-down selected) */}
      {!selectedDept && (
        <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'ru' ? 'Отделы завода и зоны ответственности' : 'Zavod bo‘limlari va mas’uliyat guruhlari'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'ru'
                  ? 'Нажмите на любой отдел для просмотра пошаговых действий сотрудников (Drill-down)'
                  : 'Xodimlar bajargan amallar va javobgarlik zanjirini ko‘rish uchun kerakli bo‘lim ustiga bosing'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-dark-800">
            {/* Dept Card 1: Ishlab chiqarish */}
            <button
              onClick={() => {
                setSelectedDept('production')
                setPage(1)
              }}
              className="p-5 text-left hover:bg-blue-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                    <Factory size={11} />
                    {lang === 'ru' ? 'Производство' : 'Ishlab chiqarish'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{prodActions.length} ta amal</span>
                </div>
                <b className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors block">
                  {lang === 'ru' ? 'Цех переработки и мастера смен' : 'Tayyorlash va qayta ishlash sexi'}
                </b>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {n(data?.production?.totals?.actualOutput)} kg {lang === 'ru' ? 'выпущенной продукции' : 'chiqarilgan tayyor mahsulot'}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-blue-600 font-bold">
                <span>{lang === 'ru' ? 'Все действия смены' : 'Smena amallarini ko‘rish'}</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Dept Card 2: Omborxona */}
            <button
              onClick={() => {
                setSelectedDept('warehouse')
                setPage(1)
              }}
              className="p-5 text-left hover:bg-emerald-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                    <Boxes size={11} />
                    {lang === 'ru' ? 'Склад' : 'Omborxona'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{whActions.length} ta harakat</span>
                </div>
                <b className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors block">
                  {lang === 'ru' ? 'Склад сырья и перемещения' : 'Ombor mudiri va sex transferlari'}
                </b>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {data?.warehouse?.transfers?.length || 0} ta {lang === 'ru' ? 'передач в цеха' : 'ichki transfer va uzatish'}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-emerald-600 font-bold">
                <span>{lang === 'ru' ? 'Все движения склада' : 'Ombor harakatlarini ko‘rish'}</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Dept Card 3: Sifat Nazorati */}
            <button
              onClick={() => {
                setSelectedDept('qc')
                setPage(1)
              }}
              className="p-5 text-left hover:bg-purple-50/50 dark:hover:bg-dark-800 transition-colors group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
                    <ShieldCheck size={11} />
                    {lang === 'ru' ? 'ОКК' : 'Sifat nazorati'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{qcActions.length} ta tekshiruv</span>
                </div>
                <b className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors block">
                  {lang === 'ru' ? 'Инспекторы качества и аудит' : 'Sifat nazorati inspektorlari'}
                </b>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {lang === 'ru' ? 'Проверка партий и соблюдение стандартов' : 'Xomashyo tekshiruvi va standart nazorati'}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-purple-600 font-bold">
                <span>{lang === 'ru' ? 'Журнал проверок' : 'Tekshiruvlar ro‘yxatini ko‘rish'}</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 4. LEVEL 2: Filtered Action Records Table (Drill-Down View) */}
      <div className="rounded-3xl border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-900 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              {selectedDept
                ? selectedDept === 'production'
                  ? (lang === 'ru' ? 'Действия сотрудников: Производственный цех' : 'Ishlab chiqarish sexi xodimlari amallari')
                  : selectedDept === 'warehouse'
                    ? (lang === 'ru' ? 'Действия сотрудников: Складской отдел' : 'Omborxona bo‘limi xodimlari amallari')
                    : (lang === 'ru' ? 'Действия сотрудников: Служба качества (ОКК)' : 'Sifat nazorati xodimlari amallari')
                : (lang === 'ru' ? 'Операционный журнал: Кто что сделал' : 'Operatsion jurnal: Kim nima qildi')}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400">
              {filteredActions.length} ta yozuv
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {lang === 'ru' ? 'Нажмите на строку для просмотра деталей' : 'Tafsilotlarni ko‘rish uchun qator ustiga bosing'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-dark-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">{lang === 'ru' ? 'Дата' : 'Sana'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Отдел' : 'Bo‘lim'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Сотрудник / Ответственный' : 'Xodim / Mas’ul'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Действие / Операция' : 'Bajarilgan amal'}</th>
                <th className="p-3.5">{lang === 'ru' ? 'Объект / Продукт' : 'Mahsulot / Obyekt'}</th>
                <th className="p-3.5 text-right">{lang === 'ru' ? 'Количество / Объем' : 'Hajm / Miqdor'}</th>
                <th className="p-3.5 text-center">{lang === 'ru' ? 'Статус' : 'Holati'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {paginatedActions.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedAction(item)}
                  className="hover:bg-slate-50 dark:hover:bg-dark-800/60 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-mono text-slate-900 dark:text-white font-bold">
                    {item.dateStr}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300">
                      {item.deptName}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span>{item.actor}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium max-w-xs truncate">
                    {item.action}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {item.productName}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {item.quantityStr}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : item.status === 'CRITICAL'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!paginatedActions.length && (
            <div className="p-12 text-center text-sm text-slate-400">
              {lang === 'ru' ? 'Операции не найдены.' : 'Amallar topilmadi.'}
            </div>
          )}

          {/* Table pagination */}
          <div className="p-3.5 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              {lang === 'ru' ? 'Всего:' : 'Jami:'}{' '}
              <b className="text-slate-900 dark:text-white font-mono">{filteredActions.length}</b>{' '}
              {lang === 'ru' ? 'действий' : 'ta operatsiya'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LEVEL 3: Detail Modal Drawer */}
      {selectedAction && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex justify-end backdrop-blur-sm"
          onClick={() => setSelectedAction(null)}
        >
          <aside
            className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-dark-900 p-6 shadow-2xl rounded-l-3xl border-l border-slate-200 dark:border-dark-750"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-dark-750">
              <div>
                <p className="text-[11px] font-black tracking-wider text-indigo-600 uppercase">
                  {selectedAction.deptName}
                </p>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">
                  {selectedAction.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Ответственный сотрудник' : 'Mas’ul xodim'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                  {selectedAction.actor}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Дата операции' : 'Sana'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                  {selectedAction.dateStr}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Объект / Номенклатура' : 'Mahsulot / Xomashyo'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedAction.productName}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  {lang === 'ru' ? 'Объем / Количество' : 'Miqdori / Chiqimi'}
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {selectedAction.quantityStr}
                </span>
              </div>
            </div>

            {/* Custom Detail Attributes */}
            <div className="rounded-2xl border border-slate-200 dark:border-dark-750 p-4 space-y-2 bg-slate-50/50 dark:bg-dark-850/50">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'ru' ? 'Параметры и аудит операции' : 'Operatsiya parametrlari va auditi'}
              </h4>
              <dl className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-dark-800">
                {Object.entries(selectedAction.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center pt-2">
                    <dt className="text-slate-500 font-medium">{key}</dt>
                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {String(value ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

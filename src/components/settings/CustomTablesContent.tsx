'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Upload, Table2, Plus, Trash2, Download, FileSpreadsheet,
  ChevronRight, X, Save, Eye, ArrowLeft, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

type Column = { key: string; label: string; type: string }
type Template = {
  id: number
  name: string
  description?: string
  columns: string
  createdBy?: string
  createdAt: string
  _count?: { records: number }
}
type Record_ = { id: number; data: Record<string, string>; createdAt: string; createdBy?: string }

type View = 'list' | 'detail' | 'new-record'

export default function CustomTablesContent() {
  const [view, setView] = useState<View>('list')
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [activeColumns, setActiveColumns] = useState<Column[]>([])
  const [records, setRecords] = useState<Record_[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Upload modal state
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/custom-templates')
      if (res.ok) setTemplates(await res.json())
    } finally { setLoading(false) }
  }

  async function openTemplate(t: Template) {
    setLoading(true)
    try {
      const res = await fetch(`/api/custom-templates/${t.id}`)
      if (res.ok) {
        const data = await res.json()
        setActiveTemplate(data.template)
        setActiveColumns(data.template.columns)
        setRecords(data.records)
        // init empty form
        const empty: Record<string, string> = {}
        data.template.columns.forEach((c: Column) => { empty[c.key] = '' })
        setFormData(empty)
        setView('detail')
      }
    } finally { setLoading(false) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile || !uploadName) { toast.error('Fayl va nom kiritilishi shart!'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('name', uploadName)
      fd.append('description', uploadDesc)
      const res = await fetch('/api/custom-templates', { method: 'POST', body: fd })
      if (res.ok) {
        toast.success('Yangi jadval shabloni muvaffaqiyatli yuklandi!')
        setUploadModal(false)
        setUploadName(''); setUploadDesc(''); setUploadFile(null)
        fetchTemplates()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Yuklashda xatolik')
      }
    } catch { toast.error('Tarmoq xatosi') } finally { setUploading(false) }
  }

  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/custom-templates/${activeTemplate!.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData })
      })
      if (res.ok) {
        toast.success('Yozuv muvaffaqiyatli saqlandi!')
        // reset form and reload
        const empty: Record<string, string> = {}
        activeColumns.forEach(c => { empty[c.key] = '' })
        setFormData(empty)
        // refresh records
        const r = await fetch(`/api/custom-templates/${activeTemplate!.id}`)
        if (r.ok) { const d = await r.json(); setRecords(d.records) }
        setView('detail')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Saqlashda xatolik')
      }
    } catch { toast.error('Tarmoq xatosi') } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu shablonni va barcha unga tegishli yozuvlarni o\'chirasizmi?')) return
    const res = await fetch(`/api/custom-templates/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Shablon o\'chirildi'); fetchTemplates() }
    else toast.error('O\'chirishda xatolik')
  }

  async function handleExport() {
    if (!activeTemplate) return
    setExporting(true)
    try {
      const res = await fetch(`/api/custom-templates/${activeTemplate.id}/export`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${activeTemplate.name}.xlsx`
        a.click(); URL.revokeObjectURL(url)
        toast.success('Excel fayl yuklab olindi!')
      }
    } catch { toast.error('Eksport xatosi') } finally { setExporting(false) }
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <Table2 size={16} className="text-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Dinamik Jadval Menejeri
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            Maxsus Excel Jadvallar
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Excel faylni yuklang → tizim avtomatik jadval yaratadi → ma'lumot kiriting → qayta Excel yuklab oling
          </p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-600/30 transition-all active:scale-95"
        >
          <Upload size={16} />
          Excel Yuklash
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { step: '1', icon: Upload, title: 'Excel Yuklang', desc: 'Ustunlari bor istalgan .xlsx faylni yuklang', color: 'from-blue-500 to-blue-600' },
          { step: '2', icon: Plus, title: 'Ma\'lumot Kiriting', desc: 'Tizim avtomat forma yaratadi, xodimlar to\'ldiradi', color: 'from-violet-500 to-purple-600' },
          { step: '3', icon: Download, title: 'Excel Yuklab Oling', desc: 'Barcha yozuvlar chiroyli Excel sifatida yuklanadi', color: 'from-emerald-500 to-green-600' },
        ].map(item => (
          <div key={item.step} className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <item.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Qadam {item.step}</p>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-dark-900 border-2 border-dashed border-slate-300 dark:border-dark-700 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Table2 size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-slate-700 dark:text-white mb-2">Hali jadvallar yo'q</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Birinchi Excel jadvalingizni yuklang!</p>
          <button
            onClick={() => setUploadModal(true)}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-violet-600/30"
          >
            <Upload size={16} />
            Birinchi Jadvalni Yuklash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const cols: Column[] = (() => { try { return JSON.parse(t.columns) } catch { return [] } })()
            return (
              <div
                key={t.id}
                className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-800 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <FileSpreadsheet size={18} className="text-white" />
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base mb-1 leading-tight">{t.name}</h3>
                {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{t.description}</p>}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                    {cols.length} ustun
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    {t._count?.records || 0} yozuv
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 font-medium">
                  Ustunlar: {cols.slice(0, 4).map(c => c.label).join(', ')}{cols.length > 4 ? ` +${cols.length - 4}` : ''}
                </div>
                <button
                  onClick={() => openTemplate(t)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-violet-600 dark:bg-dark-800 dark:hover:bg-violet-600 text-slate-700 dark:text-slate-300 hover:text-white transition-all text-xs font-bold"
                >
                  <Eye size={14} />
                  Ochish
                  <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-dark-750">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-750">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>
                <h2 className="font-black text-slate-900 dark:text-white text-base">Excel Jadval Yuklash</h2>
              </div>
              <button onClick={() => setUploadModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Jadval Nomi *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="Masalan: Sanitariya Nazorati Jurnali"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Tavsif (ixtiyoriy)</label>
                <input
                  type="text"
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  placeholder="Bu jadval nima uchun ishlatiladi..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Excel Fayl (.xlsx) *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    uploadFile
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-slate-300 dark:border-dark-600 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10'
                  }`}
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{uploadFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <FileSpreadsheet size={28} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Faylni bu yerga tashlang yoki bosing</p>
                      <p className="text-xs text-slate-400 mt-1">Faqat .xlsx formatida</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Excel faylining <strong>birinchi qatori</strong> (sarlavhalar) ustun nomlari sifatida o'qiladi. 2-qatordan boshlab ma'lumotlar bo'lishi mumkin.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setUploadModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-dark-800 transition-all">
                  Bekor qilish
                </button>
                <button type="submit" disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/30 active:scale-95 disabled:opacity-60">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (view === 'detail') return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{activeTemplate?.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{records.length} ta yozuv • {activeColumns.length} ta ustun</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-60">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Excel Yuklab Olish
          </button>
          <button onClick={() => setView('new-record')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-600/30 active:scale-95">
            <Plus size={14} />
            Yangi Yozuv
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl overflow-hidden shadow-sm">
        {records.length === 0 ? (
          <div className="p-16 text-center">
            <Table2 size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="font-black text-slate-700 dark:text-white mb-2">Yozuvlar yo'q</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Birinchi yozuvni qo'shing!</p>
            <button onClick={() => setView('new-record')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/30 active:scale-95">
              <Plus size={16} />
              Yozuv Qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800/50 border-b border-slate-200 dark:border-dark-750">
                  <th className="p-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">#</th>
                  {activeColumns.map(col => (
                    <th key={col.key} className="p-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="p-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-750">
                {records.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors">
                    <td className="p-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    {activeColumns.map(col => (
                      <td key={col.key} className="p-3.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {record.data[col.key] || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    ))}
                    <td className="p-3.5 text-xs text-slate-400 whitespace-nowrap font-medium">
                      {new Date(record.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // ── NEW RECORD VIEW ────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('detail')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">Yangi Yozuv Qo'shish</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeTemplate?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSaveRecord} className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeColumns.map(col => (
            <div key={col.key}>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">{col.label}</label>
              <input
                type="text"
                value={formData[col.key] || ''}
                onChange={e => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                placeholder={col.label + '...'}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400 transition-all"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setView('detail')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-dark-800 transition-all">
            Bekor qilish
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/30 active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  )
}

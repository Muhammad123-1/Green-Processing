'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Database, Download, Upload, Clock, HardDrive, Plus, Trash2, Loader2 } from 'lucide-react'

interface Backup {
  id: number
  filename: string
  sizeBytes: number | null
  createdAt: string
  createdBy: string | null
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchBackups() }, [])

  async function fetchBackups() {
    try {
      const res = await fetch('/api/backup')
      if (res.ok) setBackups(await res.json())
    } finally { setLoading(false) }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      if (res.ok) {
        toast.success('Zaxira nusxa yaratildi')
        fetchBackups()
      } else toast.error('Xatolik yuz berdi')
    } catch { toast.error('Xatolik') } finally { setCreating(false) }
  }

  async function handleDownload(id: number, filename: string) {
    try {
      const res = await fetch(`/api/backup/${id}/download`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Yuklab olindi')
      }
    } catch { toast.error('Xatolik') }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Zaxira nusxa</h1>
          <p className="section-subtitle">Ma'lumotlar bazasini saqlash va tiklash</p>
        </div>
        <button onClick={handleCreate} disabled={creating} className="btn-primary">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Zaxira yaratish
        </button>
      </div>

      {/* Info */}
      <div className="card p-5 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Database size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Zaxira nusxa haqida</p>
            <p className="text-xs text-blue-200/60 mt-1">
              Zaxira nusxa barcha ma'lumotlar (aktlar, mahsulotlar, ta'minotchilar) ni saqlaydi.
              Har kuni avtomatik zaxira tavsiya etiladi.
            </p>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-dark-700 flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <h3 className="font-semibold text-white text-sm">Zaxira tarixi</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Database size={36} className="mb-3 opacity-30" />
            <p>Hali zaxira yaratilmagan</p>
            <p className="text-sm mt-1">Birinchi zaxirani yarating</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fayl nomi</th>
                <th>Hajm</th>
                <th>Sana</th>
                <th>Yaratuvchi</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="table-row">
                  <td className="font-mono text-xs text-slate-300">{b.filename}</td>
                  <td className="text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <HardDrive size={11} />{formatSize(b.sizeBytes)}
                    </span>
                  </td>
                  <td className="text-slate-400 text-sm">
                    {new Date(b.createdAt).toLocaleString('uz-UZ')}
                  </td>
                  <td className="text-slate-400 text-sm">{b.createdBy || '—'}</td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDownload(b.id, b.filename)}
                        className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600
                                   flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

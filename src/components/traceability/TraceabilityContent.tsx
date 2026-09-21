'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, ArrowRight, ShieldCheck, Thermometer, GitBranch, Package, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import BatchQRScanner from './BatchQRScanner'

export default function TraceabilityContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [treeData, setTreeData] = useState<any>(null)
  const [activeBatch, setActiveBatch] = useState<string>('')

  // Search function (debounced or manual)
  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!searchQuery || searchQuery.length < 2) return

    setLoading(true)
    try {
      const res = await fetch(`/api/traceability/search?q=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results)
        setTreeData(null) // clear tree
      }
    } catch {
      toast.error('Qidiruvda xatolik')
    } finally {
      setLoading(false)
    }
  }

  // Load Tree
  async function loadTree(batchIdentifier: string) {
    setActiveBatch(batchIdentifier)
    setLoading(true)
    setSearchResults(null)
    try {
      const res = await fetch(`/api/traceability/${batchIdentifier}`)
      if (res.ok) {
        const data = await res.json()
        setTreeData(data)
      } else {
        toast.error('Partiya topilmadi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  // Effect to load initial query if present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setSearchQuery(q)
      loadTree(q)
    }
  }, [])

  return (
    <div className="flex flex-col h-full animate-enter space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-dark-900 to-indigo-950 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={14} />
                Global Traceability
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Mahsulot Pasporti</h1>
            <p className="text-slate-300 text-sm mt-1">Partiya bo'yicha to'liq shajara (xomashyodan tortib sotuvgacha)</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Partiya raqami, buyruq, QR... (Masalan: FG-20231010-001)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-dark-900 border border-dark-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-white shadow-sm"
          />
        </div>
        <button type="submit" disabled={loading} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 shrink-0">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Qidirish
        </button>
        <BatchQRScanner onScan={(code) => {
          setSearchQuery(code)
          handleSearch()
        }} />
      </form>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-white text-lg border-b border-dark-800 pb-2">Qidiruv Natijalari:</h3>
          
          {searchResults.batches?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase">Ombor Partiyalari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.batches.map((b: any) => (
                  <div key={b.id} onClick={() => loadTree(b.batchNumber)} className="bg-dark-800 p-4 rounded-xl border border-dark-700 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="font-mono font-bold text-white">{b.batchNumber}</div>
                    <div className="text-sm text-slate-400 mt-1">{b.productName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add more for productionOrders and inspections if needed */}
          {searchResults.batches?.length === 0 && searchResults.productionOrders?.length === 0 && (
            <p className="text-slate-400">Hech narsa topilmadi</p>
          )}
        </div>
      )}

      {/* Tree View */}
      {treeData && treeData.batch && (
        <div className="space-y-6">
          {/* Main Batch Info */}
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Package className="text-blue-400" /> {treeData.batch.batchNumber} - {treeData.batch.productName}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-800 p-3 rounded-xl border border-dark-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Miqdor</p>
                <p className="font-mono text-lg text-white">{treeData.batch.quantity}</p>
              </div>
              <div className="bg-dark-800 p-3 rounded-xl border border-dark-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Kelgan / Yaratilgan Sana</p>
                <p className="font-mono text-sm text-white mt-1">{new Date(treeData.batch.receivedAt).toLocaleDateString()}</p>
              </div>
              <div className="bg-dark-800 p-3 rounded-xl border border-dark-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Holati (QC)</p>
                <p className={`font-bold mt-1 text-sm ${treeData.batch.qcStatus === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}`}>{treeData.batch.qcStatus}</p>
              </div>
              <div className="bg-dark-800 p-3 rounded-xl border border-dark-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Zona</p>
                <p className="font-mono text-sm text-white mt-1">{treeData.batch.zone}</p>
              </div>
            </div>
            
            {(treeData.batch.supplierBatchNumber || treeData.batch.certificateNumber) && (
              <div className="flex gap-4 p-3 bg-dark-800/50 rounded-xl border border-dark-700 text-sm">
                {treeData.batch.supplierBatchNumber && (
                  <p><span className="text-slate-400">Ta'minotchi Partiyasi:</span> <span className="font-mono text-white">{treeData.batch.supplierBatchNumber}</span></p>
                )}
                {treeData.batch.certificateNumber && (
                  <p><span className="text-slate-400">Sertifikat:</span> <span className="font-mono text-white">{treeData.batch.certificateNumber}</span></p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* If it was produced, show Production Lineage */}
            {treeData.productionInfo ? (
              <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-dark-800 pb-2">
                  <ShieldCheck className="text-emerald-400" /> Ishlab chiqarish tarixi
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Buyruq:</span>
                    <span className="font-mono font-bold text-emerald-400">{treeData.productionInfo.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Sana:</span>
                    <span className="font-mono text-white">{new Date(treeData.productionInfo.startedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Ishchi PIN:</span>
                    <span className="font-mono text-white">{treeData.productionInfo.workerPin || 'Noma\'lum'}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-dark-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Tarkibiy xomashyolar</h4>
                    <div className="space-y-2">
                      {treeData.productionInfo.rawMaterials.map((rm: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-dark-800 p-3 rounded-xl border border-dark-700 hover:border-emerald-500/50 cursor-pointer" onClick={() => loadTree(rm.batchNumber)}>
                          <div>
                            <p className="font-bold text-sm text-white">{rm.productName}</p>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">{rm.batchNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-emerald-400 font-bold">{rm.quantityUsed} {rm.unit}</p>
                            <p className="text-[10px] text-slate-500 uppercase mt-0.5"><ArrowRight size={10} className="inline mr-1"/>Kirish</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {treeData.productionInfo.reagents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Reagentlar</h4>
                      <div className="space-y-2">
                        {treeData.productionInfo.reagents.map((re: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm bg-dark-800/50 p-2 rounded-lg">
                            <span className="text-slate-300">{re.name} ({re.batchCode || 'N/A'})</span>
                            <span className="font-mono text-emerald-400">{re.quantity} {re.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {treeData.productionInfo.temperatures.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1"><Thermometer size={14}/> Harorat Jurnali</h4>
                      <div className="space-y-2">
                        {treeData.productionInfo.temperatures.map((temp: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm bg-dark-800/50 p-2 rounded-lg">
                            <span className="text-slate-300">{temp.step}</span>
                            <span className={`font-mono font-bold ${temp.isWithinNorm ? 'text-emerald-400' : 'text-red-400'}`}>{temp.tempC}°C</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* If it's a raw material, show where it was used */}
            {treeData.usedIn?.length > 0 && (
              <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-dark-800 pb-2">
                  <ArrowRight className="text-amber-400" /> Ishlatilgan joylari
                </h3>
                <div className="space-y-3">
                  {treeData.usedIn.map((use: any, i: number) => (
                    <div key={i} className="bg-dark-800 p-3 rounded-xl border border-dark-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-white">{use.outputProductName}</span>
                        <span className="font-mono text-amber-400">{use.quantityUsed} {use.unit}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Buyruq: {use.orderNumber}</span>
                        <span>{new Date(use.usedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

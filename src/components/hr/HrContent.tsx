'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Clock, Calculator, Loader2, Briefcase, Phone, BadgeCheck, FileCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function HrContent() {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees')
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])

  // New Employee Modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [savingEmployee, setSavingEmployee] = useState(false)
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '', lastName: '', position: '', department: 'Ishlab chiqarish (Sex)', phone: '', salaryType: 'FIXED', baseSalary: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/hr')
      if (res.ok) {
        setEmployees(await res.json())
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmployee(true)
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm)
      })
      if (res.ok) {
        toast.success("Yangi xodim qo'shildi!")
        setShowEmployeeModal(false)
        setEmployeeForm({ firstName: '', lastName: '', position: '', department: 'Ishlab chiqarish (Sex)', phone: '', salaryType: 'FIXED', baseSalary: '' })
        loadData()
      } else {
        toast.error("Xatolik yuz berdi")
      }
    } catch {
      toast.error("Tarmoq xatosi")
    } finally {
      setSavingEmployee(false)
    }
  }

  const activeEmployeesCount = employees.filter(e => e.isActive).length

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/60 p-6 rounded-2xl border border-dark-700 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Kadrlar va HR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Xodimlar Markazi</h1>
          <p className="text-sm text-slate-400 mt-1">Xodimlar bazasi, davomat va ish haqi (Oylik maoshlar)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all"
          >
            <UserPlus size={18} /> Yangi Xodim
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">Jami faol xodimlar</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">{activeEmployeesCount} ta</h2>
        </div>

        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 opacity-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">Bugungi Davomat</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">Tez kunda</h2>
          <p className="text-xs text-slate-500 mt-1">Smena va keldi-ketdi hisobi</p>
        </div>

        <div className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 opacity-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">Bu oy uchun Ish haqi fondi</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calculator size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono">Tez kunda</h2>
          <p className="text-xs text-slate-500 mt-1">Avtomatik hisoblash tizimi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-dark-700 pb-2">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'employees'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase size={16} /> Barcha Xodimlar
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'attendance'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={16} /> Davomat (Tabel)
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'payroll'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
              : 'bg-dark-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Calculator size={16} /> Oylik va Avanslar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
      ) : activeTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.length === 0 ? (
            <div className="col-span-full p-10 text-center text-slate-500">Xodimlar topilmadi. Baza bo'sh.</div>
          ) : employees.map(emp => (
            <div key={emp.id} className="card p-5 rounded-2xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center text-orange-400 font-bold text-xl uppercase">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-xs text-orange-400 flex items-center gap-1 font-medium mt-0.5">
                      <Briefcase size={12} /> {emp.position}
                    </p>
                  </div>
                </div>
                {emp.isActive && <BadgeCheck size={18} className="text-emerald-500" />}
              </div>
              <div className="space-y-2 mt-4 text-sm bg-dark-800/50 p-3 rounded-xl border border-dark-700/50">
                <p className="flex justify-between text-slate-400"><span className="flex items-center gap-1"><Phone size={14} /> Telefon:</span> <span className="text-slate-300 font-mono">{emp.phone || '-'}</span></p>
                <p className="flex justify-between text-slate-400"><span>Bo'lim:</span> <span className="text-slate-300">{emp.department || '-'}</span></p>
                <p className="flex justify-between text-slate-400">
                  <span>Maosh turi:</span> 
                  <span className="text-slate-300 font-semibold">
                    {emp.salaryType === 'FIXED' ? 'Oklad' : emp.salaryType === 'HOURLY' ? 'Soatbay' : 'Ishibay (Sdelno)'}
                  </span>
                </p>
                <p className="flex justify-between text-slate-400"><span>Oylik stavka:</span> <span className="text-emerald-400 font-mono font-bold">{emp.baseSalary.toLocaleString()} UZS</span></p>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'payroll' ? (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/30">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="text-orange-500" size={20} /> Oylik va Avanslar (Joriy oy)
            </h3>
            <button className="px-4 py-2 bg-orange-600/20 text-orange-400 font-semibold rounded-lg hover:bg-orange-600/30 transition-colors flex items-center gap-2 text-sm">
              <FileCheck size={16} /> Oylikni hisoblash
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-800/90 border-b border-dark-700 text-xs font-bold text-slate-300 uppercase">
                <th className="p-4">Xodim</th>
                <th className="p-4">Lavozim</th>
                <th className="p-4">Stavka turi</th>
                <th className="p-4 text-right">Asosiy maosh</th>
                <th className="p-4 text-right">Bonus/Jarima</th>
                <th className="p-4 text-right">To'lanadigan summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 text-sm">
              {employees.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Xodimlar yo'q</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-dark-800/50">
                  <td className="p-4 text-white font-medium">{emp.firstName} {emp.lastName}</td>
                  <td className="p-4 text-slate-400">{emp.position}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300">
                      {emp.salaryType === 'FIXED' ? 'Oklad' : emp.salaryType === 'HOURLY' ? 'Soatbay' : 'Ishibay'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-300 font-mono">{emp.baseSalary.toLocaleString()} UZS</td>
                  <td className="p-4 text-right text-slate-400 font-mono">0 UZS</td>
                  <td className="p-4 text-right font-bold text-emerald-400 font-mono">
                    {emp.baseSalary.toLocaleString()} UZS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card border border-dark-700 bg-dark-900/50 rounded-2xl overflow-hidden p-10 text-center text-slate-500">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl text-white font-bold mb-2">Davomat (Tabel)</h2>
          <p>Xodimlarning kelib-ketish vaqtlari va smenalarini hisobga olish tizimi.</p>
        </div>
      )}

      {/* NEW EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="text-orange-500" /> Yangi Xodim Qo'shish
              </h2>
              <button onClick={() => setShowEmployeeModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ismi *</label>
                  <input 
                    required placeholder="Alisher"
                    value={employeeForm.firstName} 
                    onChange={e => setEmployeeForm({...employeeForm, firstName: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Familiyasi *</label>
                  <input 
                    required placeholder="Usmonov"
                    value={employeeForm.lastName} 
                    onChange={e => setEmployeeForm({...employeeForm, lastName: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-orange-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Lavozimi *</label>
                  <input 
                    required placeholder="Texnolog, Farrosh, Qadoqlovchi"
                    value={employeeForm.position} 
                    onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Bo'limi</label>
                  <select 
                    value={employeeForm.department} 
                    onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-orange-500"
                  >
                    <option value="Ishlab chiqarish (Sex)">Ishlab chiqarish (Sex)</option>
                    <option value="Omborxona (Sklad)">Omborxona (Sklad)</option>
                    <option value="Sifat nazorati (Lab)">Sifat nazorati (Lab)</option>
                    <option value="Ma'muriyat (Ofis)">Ma'muriyat (Ofis)</option>
                    <option value="Sotuv va Ta'minot">Sotuv va Ta'minot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefon raqami</label>
                <input 
                  placeholder="+998 90 123 45 67"
                  value={employeeForm.phone} 
                  onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-white focus:border-orange-500 font-mono" 
                />
              </div>

              <div className="p-4 bg-dark-800/50 rounded-xl border border-dark-700 mt-2">
                <h3 className="text-sm font-semibold text-white mb-3">Ish haqi shartlari</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Maosh to'lash turi</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEmployeeForm({...employeeForm, salaryType: 'FIXED'})} className={`flex-1 py-2 text-xs rounded-lg font-bold border transition-colors ${employeeForm.salaryType === 'FIXED' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>Oklad (Oyiga)</button>
                      <button type="button" onClick={() => setEmployeeForm({...employeeForm, salaryType: 'HOURLY'})} className={`flex-1 py-2 text-xs rounded-lg font-bold border transition-colors ${employeeForm.salaryType === 'HOURLY' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>Soatbay</button>
                      <button type="button" onClick={() => setEmployeeForm({...employeeForm, salaryType: 'PIECEWORK'})} className={`flex-1 py-2 text-xs rounded-lg font-bold border transition-colors ${employeeForm.salaryType === 'PIECEWORK' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-dark-800 text-slate-500 border-dark-700 hover:bg-dark-700'}`}>Ishibay (Sdelno)</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Asosiy stavka / maosh (UZS)</label>
                    <input 
                      type="number" placeholder="Masalan: 4000000" required
                      value={employeeForm.baseSalary} 
                      onChange={e => setEmployeeForm({...employeeForm, baseSalary: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2.5 text-emerald-400 font-bold focus:border-orange-500 font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-5 py-2.5 bg-dark-700 text-slate-300 rounded-xl hover:bg-dark-600 font-medium">Bekor qilish</button>
                <button type="submit" disabled={savingEmployee} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 font-semibold shadow-lg disabled:opacity-50">
                  {savingEmployee ? <Loader2 className="animate-spin" size={18} /> : null} Xodimni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

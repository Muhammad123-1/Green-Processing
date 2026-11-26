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

  const activeEmployeesCount = employees.filter(e => e.isActive !== false && e.status !== 'TERMINATED').length
  const totalPayrollFund = employees.reduce((sum, e) => sum + (Number(e.baseSalary || e.salaryBase) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Kadrlar va HR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Xodimlar Markazi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Xodimlar bazasi, davomat va ish haqi (Oylik maoshlar)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <UserPlus size={18} /> Yangi Xodim
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Active Staff */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-orange-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jami faol xodimlar
            </span>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeEmployeesCount} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">ta</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Amaldagi shtat xodimlari</p>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bugungi Davomat
            </span>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">100%</h2>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                To'liq smena
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Smena va keldi-ketdi hisobi</p>
          </div>
        </div>

        {/* Card 3: Salary Fund */}
        <div className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-750 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bu oy uchun Ish haqi fondi
            </span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calculator size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalPayrollFund.toLocaleString()} <span className="text-sm font-semibold">UZS</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Avtomatik oylik stavkalar hisobi</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 dark:bg-dark-900/90 rounded-2xl border border-slate-200 dark:border-dark-750 w-fit overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-white dark:bg-dark-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-dark-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-dark-800/60'
          }`}
        >
          <Briefcase size={16} /> Barcha Xodimlar
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-white dark:bg-dark-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-dark-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-dark-800/60'
          }`}
        >
          <Clock size={16} /> Davomat (Tabel)
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-white dark:bg-dark-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-dark-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-dark-800/60'
          }`}
        >
          <Calculator size={16} /> Oylik va Avanslar
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-750">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : activeTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-slate-200 dark:border-dark-750 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 flex items-center justify-center mx-auto mb-3">
                <Users size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Xodimlar ro'yxati bo'sh</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Hozircha tizimga xodimlar qo'shilmagan. Yangi xodim qo'shish tugmasi orqali xodimlarni kiriting.
              </p>
              <button
                onClick={() => setShowEmployeeModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <UserPlus size={15} /> Yangi xodim qo'shish
              </button>
            </div>
          ) : (
            employees.map(emp => (
              <div
                key={emp.id}
                className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-5 rounded-3xl shadow-sm hover:border-orange-500/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-lg uppercase shadow-xs">
                        {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 font-semibold mt-0.5">
                          <Briefcase size={13} /> {emp.position}
                        </p>
                      </div>
                    </div>
                    {(emp.isActive || emp.status === 'ACTIVE') && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-bold">
                        <BadgeCheck size={14} /> Faol
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 text-xs sm:text-sm bg-slate-50 dark:bg-dark-850 p-3.5 rounded-2xl border border-slate-100 dark:border-dark-700/60">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Phone size={13} /> Telefon:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">{emp.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Bo'lim:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">{emp.department || '-'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Maosh turi:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {emp.salaryType === 'HOURLY' ? 'Soatbay' : emp.salaryType === 'PIECEWORK' ? 'Ishbay (Sdelno)' : 'Oklad'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-dark-700/60">
                      <span className="font-bold">Oylik stavka:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        {Number(emp.baseSalary || emp.salaryBase || 0).toLocaleString()} UZS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'payroll' ? (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex flex-wrap gap-3 justify-between items-center bg-slate-50/50 dark:bg-dark-850/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="text-orange-500" size={20} /> Oylik va Avanslar (Joriy oy)
            </h3>
            <button className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold rounded-xl border border-orange-500/20 transition-colors flex items-center gap-2 text-xs cursor-pointer">
              <FileCheck size={16} /> Oylikni hisoblash
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-850 border-b border-slate-200 dark:border-dark-750 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Xodim</th>
                  <th className="p-4">Lavozim</th>
                  <th className="p-4">Stavka turi</th>
                  <th className="p-4 text-right">Asosiy maosh</th>
                  <th className="p-4 text-right">Bonus/Jarima</th>
                  <th className="p-4 text-right">To'lanadigan summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-sm">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500">
                      Xodimlar yo'q
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-dark-800/50 transition-colors">
                      <td className="p-4 text-slate-900 dark:text-white font-medium">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{emp.position}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-dark-700">
                          {emp.salaryType === 'HOURLY' ? 'Soatbay' : emp.salaryType === 'PIECEWORK' ? 'Ishbay' : 'Oklad'}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-700 dark:text-slate-300 font-mono">
                        {Number(emp.baseSalary || emp.salaryBase || 0).toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono">0 UZS</td>
                      <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {Number(emp.baseSalary || emp.salaryBase || 0).toLocaleString()} UZS
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h2 className="text-xl text-slate-900 dark:text-white font-bold mb-2">Davomat (Tabel)</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Xodimlarning kelib-ketish vaqtlari, smena jadvallari va avtomatlashtirilgan elektron tabel tizimi.
          </p>
        </div>
      )}

      {/* NEW EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-dark-800 flex justify-between items-center bg-slate-50/50 dark:bg-dark-850/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-orange-500" size={20} /> Yangi Xodim Qo'shish
              </h2>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Ismi *</label>
                  <input
                    required
                    placeholder="Alisher"
                    value={employeeForm.firstName}
                    onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Familiyasi *</label>
                  <input
                    required
                    placeholder="Usmonov"
                    value={employeeForm.lastName}
                    onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Lavozimi *</label>
                  <input
                    required
                    placeholder="Texnolog, Farrosh, Qadoqlovchi"
                    value={employeeForm.position}
                    onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Bo'limi</label>
                  <select
                    value={employeeForm.department}
                    onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="Ishlab chiqarish (Sex)">Ishlab chiqarish (Sex)</option>
                    <option value="Omborxona">Omborxona</option>
                    <option value="Sifat nazorati (Lab)">Sifat nazorati (Lab)</option>
                    <option value="Ma'muriyat (Ofis)">Ma'muriyat (Ofis)</option>
                    <option value="Sotuv va Ta'minot">Sotuv va Ta'minot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Telefon raqami</label>
                <input
                  placeholder="+998 90 123 45 67"
                  value={employeeForm.phone}
                  onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-dark-850 rounded-2xl border border-slate-200/80 dark:border-dark-700 mt-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Ish haqi shartlari
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Maosh to'lash turi</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEmployeeForm({ ...employeeForm, salaryType: 'FIXED' })}
                        className={`flex-1 py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                          employeeForm.salaryType === 'FIXED'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                            : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-750'
                        }`}
                      >
                        Oklad (Oyiga)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployeeForm({ ...employeeForm, salaryType: 'HOURLY' })}
                        className={`flex-1 py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                          employeeForm.salaryType === 'HOURLY'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                            : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-750'
                        }`}
                      >
                        Soatbay
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployeeForm({ ...employeeForm, salaryType: 'PIECEWORK' })}
                        className={`flex-1 py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                          employeeForm.salaryType === 'PIECEWORK'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                            : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-750'
                        }`}
                      >
                        Ishbay (Sdelno)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                      Asosiy stavka / maosh (UZS) *
                    </label>
                    <input
                      type="number"
                      placeholder="Masalan: 4000000"
                      required
                      value={employeeForm.baseSalary}
                      onChange={e => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                      className="w-full bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-750 rounded-xl p-2.5 text-sm text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
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

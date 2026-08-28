'use client'

import React, { useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Package,
  Truck,
  ArrowDownToLine,
  BarChart3,
  Settings,
  Users,
  UserCheck,
  Database,
  FileSpreadsheet,
  ChevronRight,
  LogOut,
  ShoppingCart,
  ChefHat,
  MessageSquare,
  ShieldAlert,
  DollarSign,
  Briefcase,
  Utensils,
  ClipboardCheck,
  CheckCircle2
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useSidebar } from '@/store/sidebar'

const navSections = [
  {
    title: 'Asosiy',
    items: [
      { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'director', href: '/director', icon: LayoutDashboard, roles: ['ADMIN', 'DIRECTOR'] },
    ]
  },
  {
    title: 'Sifat Nazorati (QC)',
    items: [
      { key: 'newInspection', href: '/inspections/new', icon: ClipboardList, highlight: true, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'inspections', href: '/inspections', icon: History, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'shopQC', href: '/inspector', icon: ClipboardCheck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'dailyChecklist', href: '/inspector/daily-checklist', icon: CheckCircle2, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
    ]
  },
  {
    title: 'Ombor va Ishlab chiqarish',
    items: [
      { key: 'warehouse', href: '/warehouse', icon: Package, roles: ['ADMIN', 'DIRECTOR', 'WAREHOUSE'] },
      { key: 'arrivals', href: '/arrivals', icon: ArrowDownToLine, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SUPPLY', 'WAREHOUSE'] },
      { key: 'production', href: '/production', icon: ChefHat, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION'] },
      { key: 'shopReport', href: '/shop-report', icon: ClipboardList, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION'] },
      { key: 'products', href: '/products', icon: Package, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SUPPLY', 'WAREHOUSE'] },
      { key: 'kitchen', href: '/kitchen', icon: Utensils, roles: ['ADMIN', 'DIRECTOR', 'KITCHEN'] },
    ]
  },
  {
    title: "Savdo va Ta'minot",
    items: [
      { key: 'sales', href: '/sales', icon: ShoppingCart, roles: ['ADMIN', 'DIRECTOR', 'SALES'] },
      { key: 'monitoring', href: '/monitoring', icon: BarChart3, roles: ['ADMIN', 'DIRECTOR', 'SALES', 'SUPPLY'] },
      { key: 'orders', href: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'DIRECTOR', 'SUPPLY', 'WAREHOUSE'] },
      { key: 'suppliers', href: '/suppliers', icon: Truck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SUPPLY'] },
      { key: 'logistics', href: '/logistics', icon: Truck, roles: ['ADMIN', 'DIRECTOR', 'LOGISTICS'] },
    ]
  },
  {
    title: 'Moliya va HR',
    items: [
      { key: 'accounting', href: '/accounting', icon: DollarSign, roles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING'] },
      { key: 'hr', href: '/hr', icon: Briefcase, roles: ['ADMIN', 'DIRECTOR', 'HR'] },
      { key: 'reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING'] },
    ]
  },
  {
    title: 'Tizim va Boshqaruv',
    items: [
      { key: 'users', href: '/users', icon: Users, roles: ['ADMIN', 'DIRECTOR', 'HR'] },
      { key: 'supervisors', href: '/supervisors', icon: UserCheck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'chat', href: '/chat', icon: MessageSquare, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'SUPPLY', 'WAREHOUSE', 'PRODUCTION', 'HR'] },
      { key: 'security', href: '/security', icon: ShieldAlert, roles: ['ADMIN', 'DIRECTOR', 'SECURITY'] },
      { key: 'backup', href: '/backup', icon: Database, roles: ['ADMIN'] },
      { key: 'settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'DIRECTOR'] },
    ]
  }
]

export default function Sidebar({ userRole = 'OPERATOR', userName = 'Foydalanuvchi' }: { userRole?: string, userName?: string }) {
  const pathname = usePathname()
  const { t, lang } = useLanguage()
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 flex flex-col h-full transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg glow-blue">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Green Processing</h1>
            <p className="text-xs text-slate-500 leading-tight">{lang === 'ru' ? 'ERP Система' : lang === 'en' ? 'ERP System' : 'ERP Tizimi'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar">
        {navSections.map((section, idx) => {
          // Filter items based on userRole
          const visibleItems = section.items.filter(item => {
            // Direktor paneli faqat DIRECTOR uchun ko'rinadi
            if (item.key === 'director' && userRole !== 'DIRECTOR') {
              return false
            }
            return item.roles.includes(userRole) || userRole === 'ADMIN'
          })
          
          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {section.title}
              </h3>
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                if ((item as any).highlight) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm
                                 bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30
                                 transition-all duration-200 my-2"
                    >
                      <Icon size={18} />
                      <span>{t(item.key)}</span>
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={`sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-dark-800 text-white' : 'text-slate-400 hover:bg-dark-800 hover:text-white'}`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-400' : ''} />
                    <span className="flex-1">{t(item.key)}</span>
                    {isActive && <ChevronRight size={14} className="text-blue-400" />}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-5 py-4 border-t border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">U</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">{userName}</p>
            <p className="text-[10px] text-slate-500">{userRole}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()} 
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          title={t('logout')}
        >
          <LogOut size={16} />
        </button>
      </div>
      </aside>
    </>
  )
}

'use client'

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
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useLanguage } from '@/components/providers/LanguageProvider'

const navItems = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'newInspection',
    href: '/inspections/new',
    icon: ClipboardList,
    highlight: true,
  },
  {
    key: 'inspections',
    href: '/inspections',
    icon: History,
  },
  {
    key: 'products',
    href: '/products',
    icon: Package,
  },
  {
    key: 'arrivals',
    href: '/arrivals',
    icon: ArrowDownToLine,
  },
  {
    key: 'orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    key: 'production',
    href: '/production',
    icon: ChefHat,
  },
  {
    key: 'suppliers',
    href: '/suppliers',
    icon: Truck,
  },
  {
    key: 'supervisors',
    href: '/supervisors',
    icon: UserCheck,
  },
  {
    key: 'reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    key: 'users',
    href: '/users',
    icon: Users,
  },
  {
    key: 'backup',
    href: '/backup',
    icon: Database,
  },
  {
    key: 'settings',
    href: '/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t, lang } = useLanguage()

  return (
    <aside className="w-64 flex-shrink-0 bg-dark-900 border-r border-dark-700 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg glow-blue">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Green Processing</h1>
            <p className="text-xs text-slate-500 leading-tight">{lang === 'ru' ? 'Система контроля' : 'Nazorat Tizimi'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
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
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{t(item.key)}</span>
              {isActive && <ChevronRight size={14} className="text-blue-400" />}
            </Link>
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
            <p className="text-xs font-medium text-slate-300">Foydalanuvchi</p>
            <p className="text-[10px] text-slate-500">{t('active')}</p>
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
  )
}

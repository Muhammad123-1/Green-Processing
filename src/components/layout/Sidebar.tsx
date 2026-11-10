'use client'

import React, { useMemo, Suspense } from 'react'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Archive, 
  LayoutDashboard,
  ClipboardList,
  History,
  Package,
  Truck,
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
  UtensilsCrossed,
  ClipboardCheck,
  CheckCircle2,
  Table2,
  FlaskConical,
  Thermometer,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  AlertTriangle,
  HelpCircle
 } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useSidebar } from '@/store/sidebar'
import { useChatBadge } from '@/store/chatBadge'

const navSections = [
  {
    key: 'navMain',
    title: 'Asosiy',
    items: [
      { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'director', href: '/director', icon: LayoutDashboard, roles: ['ADMIN', 'DIRECTOR'] },
      { key: 'surveys', href: '/surveys', icon: HelpCircle, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SALES'] },
      { key: 'archive', href: '/archive', icon: Archive, roles: ['ADMIN', 'DIRECTOR'] },
    ]
  },
  {
    key: 'navQC',
    title: 'Sifat Nazorati (QC)',
    items: [
      { key: 'newInspection', href: '/inspections/new', icon: ClipboardList, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'inspections', href: '/inspections', icon: History, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'incomingActs', href: '/incoming-acts', icon: FileSpreadsheet, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'disinfectionIncoming', href: '/incoming-acts/disinfection', icon: FlaskConical, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'temperatureLogs', href: '/temperature-logs', icon: Thermometer, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'degustatsiya', href: '/degustatsiya', icon: UtensilsCrossed, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'KITCHEN', 'HR', 'DEGUSTATION'] },
      { key: 'driversMedical', href: '/drivers-medical', icon: Truck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'LOGISTICS', 'HR', 'DEGUSTATION'] },
      { key: 'qcSettings', href: '/settings?tab=qc', icon: Settings, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR'] },
    ]
  },
  {
    key: 'navInspector',
    title: 'Nazoratchi (Inspector)',
    items: [
      { key: 'inspector', href: '/inspector', icon: ClipboardCheck, roles: ['ADMIN', 'DIRECTOR', 'INSPECTOR'] },
    ]
  },
  {
    key: 'navWarehouse',
    title: 'Omborxona',
    items: [
      { key: 'warehouse', href: '/warehouse', icon: Package, roles: ['ADMIN', 'DIRECTOR', 'WAREHOUSE'] },
      { key: 'prihod', href: '/inbound', icon: ArrowDownLeft, roles: ['ADMIN', 'DIRECTOR', 'WAREHOUSE'] },
      { key: 'rashod', href: '/outbound', icon: ArrowUpRight, roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION'] },
      { key: 'gp', href: '/finished-goods', icon: Boxes, roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SALES'] },
      { key: 'products', href: '/products', icon: Package, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SUPPLY', 'WAREHOUSE'] },
      { key: 'kitchen', href: '/kitchen', icon: Utensils, roles: ['ADMIN', 'DIRECTOR', 'KITCHEN', 'QUALITY_CONTROL', 'HR', 'INSPECTOR'] },
      { key: 'warehouseSettings', href: '/settings?tab=warehouse', icon: Settings, roles: ['ADMIN', 'DIRECTOR', 'WAREHOUSE'] },
    ]
  },
  {
    key: 'navProduction',
    title: 'Ishlab chiqarish',
    items: [
      { key: 'production', href: '/production', icon: ChefHat, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION'] },
      { key: 'productionJournals', href: '/production/journals', icon: ClipboardCheck, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'dailyChecklist', href: '/production/daily-checklist', icon: CheckCircle2, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION', 'QUALITY_CONTROL', 'INSPECTOR'] },
      { key: 'shopReport', href: '/shop-report', icon: ClipboardList, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION', 'QUALITY_CONTROL', 'SUPPLY'] },
      { key: 'monitoring', href: '/monitoring', icon: BarChart3, roles: ['ADMIN', 'DIRECTOR', 'PRODUCTION', 'QUALITY_CONTROL', 'SUPPLY', 'WAREHOUSE', 'SALES'] },
    ]
  },
  {
    key: 'navTrade',
    title: "Savdo va Ta'minot",
    items: [
      { key: 'sales', href: '/sales', icon: ShoppingCart, roles: ['ADMIN', 'DIRECTOR', 'SALES'] },
      { key: 'orders', href: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'DIRECTOR', 'SUPPLY', 'WAREHOUSE'] },
      { key: 'supplyShortages', href: '/supply/shortages', icon: AlertTriangle, roles: ['ADMIN', 'DIRECTOR', 'SUPPLY'] },
      { key: 'supplierDebts', href: '/supplier-debts', icon: DollarSign, roles: ['ADMIN', 'SUPPLY', 'ACCOUNTING'] },
      { key: 'suppliers', href: '/suppliers', icon: Truck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'SUPPLY'] },
      { key: 'logistics', href: '/logistics', icon: Truck, roles: ['ADMIN', 'DIRECTOR', 'LOGISTICS'] },
      { key: 'supplySettings', href: '/settings?tab=supply', icon: Settings, roles: ['ADMIN', 'DIRECTOR', 'SUPPLY'] },
    ]
  },
  {
    key: 'navFinance',
    title: 'Moliya va HR',
    items: [
      { key: 'accounting', href: '/accounting', icon: DollarSign, roles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING'] },
      { key: 'hr', href: '/hr', icon: Briefcase, roles: ['ADMIN', 'DIRECTOR', 'HR'] },
      { key: 'reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'DIRECTOR', 'ACCOUNTING'] },
    ]
  },
  {
    key: 'navSystem',
    title: 'Tizim va Boshqaruv',
    items: [
      { key: 'customTables', href: '/custom-tables', icon: Table2, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'users', href: '/users', icon: Users, roles: ['ADMIN', 'DIRECTOR', 'HR'] },
      { key: 'supervisors', href: '/supervisors', icon: UserCheck, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL'] },
      { key: 'chat', href: '/chat', icon: MessageSquare, roles: ['ADMIN', 'DIRECTOR', 'QUALITY_CONTROL', 'INSPECTOR', 'SUPPLY', 'WAREHOUSE', 'PRODUCTION', 'HR', 'ACCOUNTING', 'ACCOUNTANT', 'DEGUSTATION'] },
      { key: 'security', href: '/security', icon: ShieldAlert, roles: ['ADMIN', 'DIRECTOR', 'SECURITY'] },
      { key: 'backup', href: '/backup', icon: Database, roles: ['ADMIN'] },
      { key: 'settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'DIRECTOR'] },
    ]
  }
]

function SidebarInner({ userRole = 'OPERATOR', userName = 'Foydalanuvchi' }: { userRole?: string, userName?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams ? searchParams.get('tab') : null
  const { t, formatDual, lang } = useLanguage()
  const { isOpen, close } = useSidebar()
  const unreadCount = useChatBadge((s) => s.unreadCount)

  const translate = t
  const formatText = formatDual

  // STRICT PRIVACY & ISOLATION: SUPPLIER role only sees their own orders portal
  if (userRole === 'SUPPLIER') {
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Green Processing</h1>
                <p className="text-xs text-emerald-400 font-semibold leading-tight">
                  {formatText('Yetkazib Beruvchi', 'Кабинет Поставщика', 'Supplier Portal')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Only My Orders */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {formatText('Portal Menyu', 'Меню портала', 'Portal Menu')}
            </h3>
            <Link
              href="/supplier-portal"
              onClick={close}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith('/supplier-portal')
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              <Truck size={17} />
              <span>{formatText('Buyurtmalarim', 'Мои Заказы', 'My Orders')}</span>
            </Link>
          </nav>

          {/* Bottom info */}
          <div className="px-5 py-4 border-t border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-400">P</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{userName}</p>
                <p className="text-[10px] text-emerald-400 font-semibold truncate">
                  {lang === 'ru' ? 'Поставщик' : lang === 'en' ? 'Supplier' : "Ta'minotchi"}
                </p>
              </div>
            </div>
            <button 
              onClick={() => logout()} 
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex-shrink-0"
              title={translate('logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>
      </>
    )
  }

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
            <p className="text-xs text-slate-500 leading-tight">{formatText('ERP Tizimi', 'ERP Система', 'ERP System')}</p>
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
            // Director panel items requested by user:
            // director, archive, warehouse, prihod, rashod, gp, accounting, reports, chat, settings
            if (userRole === 'DIRECTOR') {
              const directorAllowedKeys = [
                'director',
                'surveys',
                'archive',
                'degustatsiya',
                'driversMedical',
                'warehouse',
                'prihod',
                'rashod',
                'gp',
                'accounting',
                'reports',
                'chat',
                'settings',
                'qcSettings',
                'warehouseSettings',
                'supplySettings',
                'production',
                'productionJournals',
                'dailyChecklist',
                'inspector',
              ]
              return directorAllowedKeys.includes(item.key)
            }
            return item.roles.includes(userRole) || userRole === 'ADMIN'
          })
          
          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {translate(section.key, section.title)}
              </h3>
              {visibleItems.map((item) => {
                const Icon = item.icon
                let isActive = false
                if (item.href.includes('?tab=')) {
                  const itemTab = item.href.split('?tab=')[1]
                  const basePath = item.href.split('?')[0]
                  isActive = (pathname === basePath && currentTab === itemTab) || pathname === `${basePath}/${itemTab}`
                } else if (item.href === '/inspections/new') {
                  isActive = pathname === '/inspections/new'
                } else if (item.href === '/inspections') {
                  isActive = pathname === '/inspections' || (pathname.startsWith('/inspections/') && pathname !== '/inspections/new')
                } else if (item.href === '/incoming-acts/disinfection') {
                  isActive = pathname.startsWith('/incoming-acts/disinfection')
                } else if (item.href === '/incoming-acts') {
                  isActive = pathname === '/incoming-acts' || (pathname.startsWith('/incoming-acts/') && !pathname.startsWith('/incoming-acts/disinfection'))
                } else if (item.href === '/production/daily-checklist') {
                  isActive = pathname.startsWith('/production/daily-checklist') || pathname.startsWith('/inspector/daily-checklist')
                } else if (item.href === '/production/journals') {
                  isActive = pathname.startsWith('/production/journals')
                } else if (item.href === '/inspector') {
                  isActive = pathname === '/inspector'
                } else if (item.href === '/warehouse') {
                  isActive = pathname === '/warehouse' && (!currentTab || currentTab === 'inventory')
                } else if (item.href === '/supply/shortages') {
                  isActive = pathname === '/supply/shortages'
                } else if (item.href === '/orders') {
                  isActive = (pathname === '/orders' && currentTab !== 'debts') || pathname === '/supply'
                } else if (item.href === '/dashboard' || item.href === '/director') {
                  isActive = pathname === item.href
                } else {
                  isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                }

                const isChat = item.key === 'chat'
                const hasChatBadge = isChat && unreadCount > 0

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
                      <span className="flex-1">{translate(item.key)}</span>
                      {hasChatBadge && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md shadow-rose-500/40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>{unreadCount}</span>
                        </span>
                      )}
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
                    <div className="relative">
                      <Icon size={18} className={isActive ? 'text-blue-400' : ''} />
                      {hasChatBadge && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{translate(item.key)}</span>
                    {hasChatBadge && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md shadow-rose-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>{unreadCount}</span>
                      </span>
                    )}
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
            <p className="text-[10px] text-slate-500">
              {userRole === 'DIRECTOR'
                ? (lang === 'ru' ? 'Директор' : lang === 'en' ? 'Director' : 'Direktor') 
                : userRole === 'DEGUSTATION'
                ? (lang === 'ru' ? 'Дегустация и СанПиН' : lang === 'en' ? 'Degustation & SanPiN' : 'Degustatsiya va SanPiN')
                : userRole}
            </p>
          </div>
        </div>
        <button 
          onClick={() => logout()} 
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          title={translate('logout')}
        >
          <LogOut size={16} />
        </button>
      </div>
      </aside>
    </>
  )
}

export default function Sidebar(props: { userRole?: string, userName?: string }) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  )
}

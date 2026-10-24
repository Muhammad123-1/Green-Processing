'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  FileSpreadsheet, 
  ClipboardList, 
  Menu,
  ChefHat
} from 'lucide-react'
import { useSidebar } from '@/store/sidebar'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function MobileNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  const { toggle, isOpen } = useSidebar()
  const { formatDual } = useLanguage()

  const isDirector = userRole === 'DIRECTOR'
  const homeHref = isDirector ? '/director' : '/dashboard'

  const navItems = [
    {
      label: formatDual('Asosiy', 'Главная', 'Home'),
      href: homeHref,
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/director'
    },
    {
      label: formatDual('Ombor', 'Склад', 'Stock'),
      href: '/warehouse',
      icon: Package,
      active: pathname.startsWith('/warehouse')
    },
    {
      label: formatDual('Sifat (QC)', 'Контроль', 'QC'),
      href: '/incoming-acts',
      icon: FileSpreadsheet,
      active: pathname.startsWith('/incoming-acts') || pathname.startsWith('/inspections')
    },
    {
      label: formatDual('Sex', 'Цех', 'Shop'),
      href: '/shop-report',
      icon: ChefHat,
      active: pathname.startsWith('/shop-report') || pathname.startsWith('/production')
    }
  ]

  return (
    <nav 
      aria-label="Mobil navigatsiya"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                item.active 
                  ? 'text-emerald-400 font-extrabold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className={`w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
                item.active 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-sm shadow-emerald-500/30' 
                  : 'bg-transparent'
              }`}>
                <Icon size={19} className={item.active ? 'text-emerald-400' : 'text-slate-400'} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                {item.label}
              </span>
              {item.active && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 absolute -bottom-0.5" />
              )}
            </Link>
          )
        })}

        {/* Menu (Sidebar drawer trigger) */}
        <button
          onClick={toggle}
          type="button"
          aria-label="Barcha bo'limlar menyusi"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            isOpen 
              ? 'text-emerald-400 font-extrabold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
            isOpen ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-transparent'
          }`}>
            <Menu size={19} className={isOpen ? 'text-emerald-400' : 'text-slate-400'} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
            {formatDual('Menyu', 'Меню', 'Menu')}
          </span>
        </button>
      </div>
    </nav>
  )
}

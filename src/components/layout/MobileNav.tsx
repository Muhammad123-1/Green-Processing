'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  FileSpreadsheet, 
  ClipboardList, 
  Menu,
  ChefHat,
  ArrowDownRight,
  Truck,
  LogOut,
  UtensilsCrossed,
  MessageSquare
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useSidebar } from '@/store/sidebar'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useChatBadge } from '@/store/chatBadge'

export default function MobileNav({ userRole }: { userRole?: string }) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { toggle, isOpen } = useSidebar()
  const { formatDual } = useLanguage()
  const unreadCount = useChatBadge((s) => s.unreadCount)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // STRICT PRIVACY FOR SUPPLIER: Only My Orders and Logout
  if (userRole === 'SUPPLIER') {
    return (
      <nav aria-label="Ta'minotchi mobil navigatsiyasi" className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark-900/95 backdrop-blur-lg border-t border-dark-750 px-6 py-2 safe-bottom">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <Link
            href="/supplier-portal"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              pathname.startsWith('/supplier-portal')
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
              pathname.startsWith('/supplier-portal') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-transparent'
            }`}>
              <Truck size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {formatDual('Buyurtmalarim', 'Заказы', 'Orders')}
            </span>
          </Link>
          <button
            onClick={() => logout()}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-rose-400 hover:text-rose-300 transition-all"
          >
            <div className="w-9 h-8 flex items-center justify-center rounded-xl bg-transparent">
              <LogOut size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {formatDual('Chiqish', 'Выйти', 'Logout')}
            </span>
          </button>
        </div>
      </nav>
    )
  }

  // STRICT PRIVACY FOR DEGUSTATION ROLE: Only Degustatsiya, Drivers Medical and Chat
  if (userRole === 'DEGUSTATION') {
    const degustationItems = [
      {
        label: formatDual('Degustatsiya', 'Дегустация', 'Degustation'),
        href: '/degustatsiya',
        icon: UtensilsCrossed,
        active: pathname === '/degustatsiya' || pathname.startsWith('/degustatsiya')
      },
      {
        label: formatDual('Haydovchilar', 'Водители', 'Drivers'),
        href: '/drivers-medical',
        icon: Truck,
        active: pathname.startsWith('/drivers-medical')
      },
      {
        label: formatDual('Chat', 'Чат', 'Chat'),
        href: '/chat',
        icon: MessageSquare,
        active: pathname.startsWith('/chat')
      }
    ]

    return (
      <nav 
        aria-label="Degustatsiya mobil navigatsiyasi"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 transition-all"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {degustationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  item.active
                    ? 'text-orange-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon size={20} className={item.active ? 'text-orange-400' : ''} />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

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
    ...(userRole === 'WAREHOUSE'
      ? [
          {
            label: formatDual('Kirim', 'Приход', 'Arrivals'),
            href: '/shop-report',
            icon: ArrowDownRight,
            active: pathname.startsWith('/shop-report'),
          },
        ]
      : [
          {
            label: formatDual('Kirim/Chiqim', 'Приход/Расход', 'In/Out'),
            href: '/shop-report',
            icon: ChefHat,
            active: pathname.startsWith('/shop-report') || pathname.startsWith('/production'),
          },
        ]),
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
              className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-w-0 flex-1 rounded-2xl transition-all duration-200 relative ${
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
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none truncate max-w-[64px] text-center">
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
          className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 min-w-0 flex-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isOpen 
              ? 'text-emerald-400 font-extrabold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`relative w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
            isOpen ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-transparent'
          }`}>
            <Menu size={19} className={isOpen ? 'text-emerald-400' : 'text-slate-400'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
            {formatDual('Menyu', 'Меню', 'Menu')}
          </span>
        </button>
      </div>
    </nav>
  )
}

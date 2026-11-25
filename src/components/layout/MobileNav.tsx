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
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  LogOut,
  UtensilsCrossed,
  HeartPulse,
  MessageSquare,
  ChefHat,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  ClipboardCheck,
  Thermometer,
  Users,
  Briefcase
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useSidebar } from '@/store/sidebar'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useChatBadge } from '@/store/chatBadge'

export default function MobileNav({ userRole }: { userRole?: string }) {
  const [mounted, setMounted] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const pathname = usePathname()
  const { toggle, isOpen } = useSidebar()
  const { formatDual } = useLanguage()
  const unreadCount = useChatBadge((s) => s.unreadCount)

  useEffect(() => {
    setMounted(true)

    // Helper to check if an element is an editable input or textarea
    const isInputElement = (el: Element | null): el is HTMLElement => {
      if (!el || !(el instanceof HTMLElement)) return false
      const tagName = el.tagName.toLowerCase()
      if (tagName === 'textarea' || tagName === 'select') return true
      if (tagName === 'input') {
        const type = (el as HTMLInputElement).type?.toLowerCase() || 'text'
        const nonTextTypes = ['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'image', 'color', 'hidden', 'range']
        return !nonTextTypes.includes(type)
      }
      if (el.isContentEditable) return true
      return false
    }

    // Strictly detect small mobile touch devices (phones <= 767px), NEVER run on desktop computers!
    const isMobileDevice = () => {
      if (typeof window === 'undefined') return false
      const isNarrow = window.innerWidth < 768
      const hasTouch = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
      return isNarrow && hasTouch
    }

    // Scroll input smoothly to the center of the available screen area above keyboard (mobile only)
    const scrollToTarget = (target: HTMLElement) => {
      if (!isMobileDevice()) return
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        setTimeout(() => {
          if (isMobileDevice()) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          }
        }, 300)
      } catch {
        try {
          target.scrollIntoView(false)
        } catch {}
      }
    }

    let blurTimer: NodeJS.Timeout | null = null

    const handleFocusIn = (e: FocusEvent) => {
      if (!isMobileDevice()) return
      if (blurTimer) {
        clearTimeout(blurTimer)
        blurTimer = null
      }
      const target = e.target as Element
      if (isInputElement(target)) {
        setIsKeyboardOpen(true)
        document.body.classList.add('keyboard-open')
        scrollToTarget(target)
      }
    }

    const handleFocusOut = () => {
      if (blurTimer) clearTimeout(blurTimer)
      blurTimer = setTimeout(() => {
        if (!isMobileDevice() || !isInputElement(document.activeElement)) {
          setIsKeyboardOpen(false)
          document.body.classList.remove('keyboard-open')
        }
      }, 150)
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    // Detect virtual keyboard resize on mobile (Android Gboard / iOS)
    let initialHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight
    const handleViewportResize = () => {
      if (!isMobileDevice()) return
      if (!window.visualViewport) return
      const currentHeight = window.visualViewport.height
      const heightDiff = initialHeight - currentHeight

      if (heightDiff > 120) {
        setIsKeyboardOpen(true)
        document.body.classList.add('keyboard-open')
        if (isInputElement(document.activeElement)) {
          scrollToTarget(document.activeElement)
        }
      } else if (heightDiff < 60 && !isInputElement(document.activeElement)) {
        setIsKeyboardOpen(false)
        document.body.classList.remove('keyboard-open')
      }
    }

    window.visualViewport?.addEventListener('resize', handleViewportResize)

    return () => {
      if (blurTimer) clearTimeout(blurTimer)
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)
      document.body.classList.remove('keyboard-open')
    }
  }, [])

  if (!mounted) {
    return null
  }

  // Xodim klaviaturada yozayotganda yoki input faol bo'lganda mobil navbarni yashirish
  if (isKeyboardOpen) {
    return null
  }

  // Oshpaz (KITCHEN) va Degustatsiya (DEGUSTATION) uchun pastgi menyu umuman ko'rsatilmaydi (xodimni chalg'itmaydi)
  const normalizedRole = (userRole || '').toUpperCase().trim()
  if (normalizedRole === 'KITCHEN' || normalizedRole === 'DEGUSTATION') {
    return null
  }

  // Oshxona (Brakeraj va Xodimlar oshxonasi) hamda SanPiN jurnallari sahifalarida
  // telefondan kirilganda pastgi mobil menyuni yashirish (to'liq ekran va jadvallar qulayligi uchun)
  if (
    pathname.startsWith('/degustatsiya') ||
    pathname.startsWith('/kitchen') ||
    pathname.startsWith('/first-aid') ||
    pathname.startsWith('/drivers-medical')
  ) {
    return null
  }

  // STRICT PRIVACY FOR SUPPLIER: Only My Orders and Logout
  if (userRole === 'SUPPLIER') {
    return (
      <nav aria-label="Ta'minotchi mobil navigatsiyasi" className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark-900/95 backdrop-blur-lg border-t border-dark-750 px-6 py-2 safe-bottom transition-all">
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

  // STRICT PRIVACY FOR DEGUSTATION ROLE: Oshxona, 1-Yordam, Haydovchilar and Chat
  if (userRole === 'DEGUSTATION') {
    const degustationItems = [
      {
        label: formatDual('Oshxona', 'Ошхона', 'Kitchen'),
        href: '/degustatsiya',
        icon: UtensilsCrossed,
        active: pathname === '/degustatsiya' || pathname.startsWith('/degustatsiya')
      },
      {
        label: formatDual('1-Yordam', '1-Ёрдам', 'First Aid'),
        href: '/first-aid',
        icon: HeartPulse,
        active: pathname.startsWith('/first-aid')
      },
      {
        label: formatDual('Haydovchilar', 'Ҳайдовчилар', 'Drivers'),
        href: '/drivers-medical',
        icon: Truck,
        active: pathname.startsWith('/drivers-medical')
      },
      {
        label: formatDual('Chat', 'Чат', 'Chat'),
        href: '/chat',
        icon: MessageSquare,
        active: pathname.startsWith('/chat'),
        badge: unreadCount > 0 ? unreadCount : undefined
      }
    ]

    return (
      <nav 
        aria-label="Degustatsiya mobil navigatsiyasi"
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 transition-all"
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

  interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    active: boolean
    badge?: number
  }

  const getNavItemsForRole = (): NavItem[] => {
    switch (normalizedRole) {
      case 'DIRECTOR':
        return [
          {
            label: formatDual('Asosiy', 'Главная', 'Home'),
            href: '/director',
            icon: LayoutDashboard,
            active: pathname === '/director'
          },
          {
            label: formatDual('Ishlab chiqarish', 'Производство', 'Production'),
            href: '/production',
            icon: ChefHat,
            active: pathname.startsWith('/production')
          },
          {
            label: formatDual('Moliya', 'Финансы', 'Finance'),
            href: '/accounting',
            icon: DollarSign,
            active: pathname.startsWith('/accounting')
          },
          {
            label: formatDual('Hisobotlar', 'Отчеты', 'Reports'),
            href: '/reports',
            icon: BarChart3,
            active: pathname.startsWith('/reports')
          }
        ]

      case 'SUPPLY':
        return [
          {
            label: formatDual("Ta'minot", 'Снабжение', 'Supply'),
            href: '/supply',
            icon: Truck,
            active: pathname === '/supply'
          },
          {
            label: formatDual('Kamomad', 'Дефицит', 'Shortages'),
            href: '/supply/shortages',
            icon: AlertTriangle,
            active: pathname.startsWith('/supply/shortages')
          },
          {
            label: formatDual('Buyurtmalar', 'Заказы', 'Orders'),
            href: '/orders',
            icon: ShoppingCart,
            active: pathname.startsWith('/orders')
          },
          {
            label: formatDual('Chat', 'Чат', 'Chat'),
            href: '/chat',
            icon: MessageSquare,
            active: pathname.startsWith('/chat'),
            badge: unreadCount > 0 ? unreadCount : undefined
          }
        ]

      case 'WAREHOUSE':
        return [
          {
            label: formatDual('Ombor', 'Склад', 'Stock'),
            href: '/warehouse',
            icon: Package,
            active: pathname.startsWith('/warehouse')
          },
          {
            label: formatDual('Kirim', 'Приход', 'Inbound'),
            href: '/inbound',
            icon: ArrowDownLeft,
            active: pathname.startsWith('/inbound')
          },
          {
            label: formatDual('Chiqim', 'Расход', 'Outbound'),
            href: '/outbound',
            icon: ArrowUpRight,
            active: pathname.startsWith('/outbound')
          },
          {
            label: formatDual('GP (Tayyor)', 'ГП (Склад)', 'Finished'),
            href: '/finished-goods',
            icon: Boxes,
            active: pathname.startsWith('/finished-goods')
          }
        ]

      case 'PRODUCTION':
      case 'TECHNOLOGY':
        return [
          {
            label: formatDual('Ishlab chiqarish', 'Производство', 'Production'),
            href: '/production',
            icon: ChefHat,
            active: pathname.startsWith('/production')
          },
          {
            label: formatDual('Kunlik hisobot', 'Дневной отчет', 'Daily Log'),
            href: '/shop-report',
            icon: ClipboardList,
            active: pathname.startsWith('/shop-report')
          },
          {
            label: formatDual('Chiqim', 'Расход', 'Outbound'),
            href: '/outbound',
            icon: ArrowUpRight,
            active: pathname.startsWith('/outbound')
          },
          {
            label: formatDual('GP (Tayyor)', 'ГП (Склад)', 'Finished'),
            href: '/finished-goods',
            icon: Boxes,
            active: pathname.startsWith('/finished-goods')
          }
        ]

      case 'QUALITY_CONTROL':
        return [
          {
            label: formatDual('Asosiy', 'Главная', 'Home'),
            href: '/dashboard',
            icon: LayoutDashboard,
            active: pathname === '/dashboard'
          },
          {
            label: formatDual('Kirim Aktlari', 'Акты приемки', 'Acts'),
            href: '/incoming-acts',
            icon: FileSpreadsheet,
            active: pathname.startsWith('/incoming-acts')
          },
          {
            label: formatDual('Tekshiruvlar', 'Проверки', 'Inspections'),
            href: '/inspections',
            icon: ClipboardList,
            active: pathname.startsWith('/inspections')
          }
        ]

      case 'INSPECTOR':
        return [
          {
            label: formatDual('Asosiy', 'Главная', 'Home'),
            href: '/inspector',
            icon: ClipboardCheck,
            active: pathname === '/inspector'
          },
          {
            label: formatDual('Kirim Aktlari', 'Акты приемки', 'Acts'),
            href: '/incoming-acts',
            icon: FileSpreadsheet,
            active: pathname.startsWith('/incoming-acts')
          },
          {
            label: formatDual('Liniya Nazorati', 'Контроль линий', 'Shop QC'),
            href: '/shop-report',
            icon: ClipboardList,
            active: pathname.startsWith('/shop-report')
          }
        ]

      case 'ACCOUNTING':
      case 'ACCOUNTANT':
        return [
          {
            label: formatDual('Moliya', 'Финансы', 'Finance'),
            href: '/accounting',
            icon: DollarSign,
            active: pathname.startsWith('/accounting')
          },
          {
            label: formatDual('Qarzdorlik', 'Задолженность', 'Debts'),
            href: '/supplier-debts',
            icon: DollarSign,
            active: pathname.startsWith('/supplier-debts')
          },
          {
            label: formatDual('Hisobotlar', 'Отчеты', 'Reports'),
            href: '/reports',
            icon: BarChart3,
            active: pathname.startsWith('/reports')
          },
          {
            label: formatDual('Chat', 'Чат', 'Chat'),
            href: '/chat',
            icon: MessageSquare,
            active: pathname.startsWith('/chat'),
            badge: unreadCount > 0 ? unreadCount : undefined
          }
        ]

      case 'HR':
        return [
          {
            label: formatDual('HR', 'HR', 'HR'),
            href: '/hr',
            icon: Briefcase,
            active: pathname.startsWith('/hr')
          },
          {
            label: formatDual('Xodimlar', 'Сотрудники', 'Staff'),
            href: '/users',
            icon: Users,
            active: pathname.startsWith('/users')
          },
          {
            label: formatDual("Tibbiy ko'rik", 'Медосмотр', 'Medical'),
            href: '/drivers-medical',
            icon: Truck,
            active: pathname.startsWith('/drivers-medical')
          },
          {
            label: formatDual('Chat', 'Чат', 'Chat'),
            href: '/chat',
            icon: MessageSquare,
            active: pathname.startsWith('/chat'),
            badge: unreadCount > 0 ? unreadCount : undefined
          }
        ]

      case 'LOGISTICS':
        return [
          {
            label: formatDual('Logistika', 'Логистика', 'Logistics'),
            href: '/logistics',
            icon: Truck,
            active: pathname.startsWith('/logistics')
          },
          {
            label: formatDual('Buyurtmalar', 'Заказы', 'Orders'),
            href: '/orders',
            icon: ShoppingCart,
            active: pathname.startsWith('/orders')
          },
          {
            label: formatDual('Haydovchilar', 'Водители', 'Drivers'),
            href: '/drivers-medical',
            icon: HeartPulse,
            active: pathname.startsWith('/drivers-medical')
          },
          {
            label: formatDual('Chat', 'Чат', 'Chat'),
            href: '/chat',
            icon: MessageSquare,
            active: pathname.startsWith('/chat'),
            badge: unreadCount > 0 ? unreadCount : undefined
          }
        ]

      case 'SALES':
        return [
          {
            label: formatDual('Savdo', 'Продажи', 'Sales'),
            href: '/sales',
            icon: ShoppingCart,
            active: pathname.startsWith('/sales')
          },
          {
            label: formatDual('GP (Tayyor)', 'ГП (Склад)', 'Finished'),
            href: '/finished-goods',
            icon: Boxes,
            active: pathname.startsWith('/finished-goods')
          },
          {
            label: formatDual('Monitoring', 'Мониторинг', 'Monitoring'),
            href: '/monitoring',
            icon: BarChart3,
            active: pathname.startsWith('/monitoring')
          },
          {
            label: formatDual('Chat', 'Чат', 'Chat'),
            href: '/chat',
            icon: MessageSquare,
            active: pathname.startsWith('/chat'),
            badge: unreadCount > 0 ? unreadCount : undefined
          }
        ]

      default:
        // ADMIN va boshqa umumiy foydalanuvchilar
        return [
          {
            label: formatDual('Asosiy', 'Главная', 'Home'),
            href: '/dashboard',
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
            label: formatDual('Ishlab chiqarish', 'Производство', 'Production'),
            href: '/production',
            icon: ChefHat,
            active: pathname.startsWith('/production')
          },
          {
            label: formatDual('Moliya', 'Финансы', 'Finance'),
            href: '/accounting',
            icon: DollarSign,
            active: pathname.startsWith('/accounting')
          }
        ]
    }
  }

  const navItems = getNavItemsForRole()

  return (
    <nav 
      aria-label="Mobil navigatsiya"
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-dark-700/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 transition-all"
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
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className={`relative w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
                item.active 
                  ? 'bg-emerald-500/15 border border-emerald-500/30 shadow-xs' 
                  : 'bg-transparent'
              }`}>
                <Icon size={19} className={item.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none truncate max-w-[70px] text-center">
                {item.label}
              </span>
              {item.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5" />
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
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className={`relative w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
            isOpen ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-transparent'
          }`}>
            <Menu size={19} className={isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} />
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Sun, Moon, Globe, Menu, Type, Check, ChevronDown, Search } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLanguage, LANGUAGE_OPTIONS, Language } from '@/components/providers/LanguageProvider'
import { useSidebar } from '@/store/sidebar'

const getPageInfo = (pathname: string, t: any, formatDual: any) => {
  const map: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { 
      title: t('dashboard'), 
      subtitle: t('dashboardSub') 
    },
    '/inspections': { 
      title: t('inspections'), 
      subtitle: t('inspectionsSub') 
    },
    '/inspections/new': { 
      title: t('newInspection'), 
      subtitle: t('newInspectionSub') 
    },
    '/inspector': { 
      title: t('shopQC'), 
      subtitle: t('shopQCSub') 
    },
    '/inspector/daily-checklist': { 
      title: t('dailyChecklist'), 
      subtitle: formatDual('Smena yakuni yagona tekshiruv dalolatnomasi', 'Ежедневный сводный акт контроля смены', 'Daily shift end quality summary report') 
    },
    '/products': { 
      title: t('products'), 
      subtitle: t('productsSub') 
    },
    '/suppliers': { 
      title: t('suppliers'), 
      subtitle: t('suppliersSub') 
    },
    '/warehouse': { 
      title: t('warehouse'), 
      subtitle: formatDual('Ombor qoldiqlari, partiyalar va harorat nazorati', 'Остатки на складе, партии и контроль температур', 'Warehouse stocks, batches and temperature control') 
    },
    '/arrivals': { 
      title: t('arrivals'), 
      subtitle: t('arrivalsSub') 
    },
    '/production': { 
      title: t('production'), 
      subtitle: t('productionSub') 
    },
    '/shop-report': { 
      title: t('shopReport'), 
      subtitle: t('shopReportSub') 
    },
    '/kitchen': { 
      title: t('kitchen'), 
      subtitle: t('kitchenSub') 
    },
    '/sales': { 
      title: t('sales'), 
      subtitle: formatDual('Buyurtmalar savdosi va jo\'natmalar', 'Продажи заказов и отгрузка', 'Sales orders and shipments') 
    },
    '/monitoring': { 
      title: t('monitoring'), 
      subtitle: t('monitoringSub') 
    },
    '/orders': { 
      title: t('orders'), 
      subtitle: t('ordersSub') 
    },
    '/custom-tables': { 
      title: t('customTables'), 
      subtitle: t('customTablesSub') 
    },
    '/director': { 
      title: t('director'), 
      subtitle: t('directorSub') 
    },
    '/logistics': { 
      title: t('logistics'), 
      subtitle: t('logisticsSub') 
    },
    '/accounting': { 
      title: t('accounting'), 
      subtitle: t('accountingSub') 
    },
    '/hr': { 
      title: t('hr'), 
      subtitle: t('hrSub') 
    },
    '/security': { 
      title: t('security'), 
      subtitle: t('securitySub') 
    },
    '/chat': { 
      title: t('chat'), 
      subtitle: formatDual('Xodimlar o\'rtasida tezkor yozishma', 'Быстрая связь и сообщения сотрудников', 'Real-time employee communication chat') 
    },
    '/reports': { 
      title: t('reports'), 
      subtitle: t('reportsSub') 
    },
    '/users': { 
      title: t('users'), 
      subtitle: t('usersSub') 
    },
    '/supervisors': { 
      title: t('supervisors'), 
      subtitle: formatDual('Nazoratchilar va sex mutaxassislari ro\'yxati', 'Список контролеров и специалистов цеха', 'List of inspectors and shop floor supervisors') 
    },
    '/backup': { 
      title: t('backup'), 
      subtitle: t('backupSub') 
    },
    '/settings': { 
      title: t('settings'), 
      subtitle: t('settingsSub') 
    },
  }
  return map[pathname]
}

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme, fontSize, setFontSize } = useTheme()
  const { lang, setLang, t, formatDual } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close language dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const pageInfo = getPageInfo(pathname, t, formatDual) || { 
    title: 'Green Processing ERP', 
    subtitle: formatDual('Korporativ boshqaruv tizimi', 'Корпоративная система управления', 'Enterprise Management System') 
  }

  const now = new Date()
  const dateLocale = lang.includes('ru') ? 'ru-RU' : 'uz-UZ'
  const dateStr = now.toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { toggle } = useSidebar()

  const currentOption = LANGUAGE_OPTIONS.find(opt => opt.id === lang) || LANGUAGE_OPTIONS[0]

  const handleCycleLang = () => {
    const currentIndex = LANGUAGE_OPTIONS.findIndex(opt => opt.id === lang)
    const nextIndex = (currentIndex + 1) % LANGUAGE_OPTIONS.length
    setLang(LANGUAGE_OPTIONS[nextIndex].id)
  }

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 md:gap-4 flex-shrink-0 z-30">
      <button 
        onClick={toggle}
        className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div>
          <h2 className="font-bold text-white text-base leading-tight truncate">{pageInfo.title}</h2>
          <p className="text-xs text-slate-500 hidden md:block truncate">{pageInfo.subtitle}</p>
        </div>

        {/* Global Search Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const q = fd.get('q')
            if (q) {
              window.location.href = `/dashboard/traceability?q=${q}`
            }
          }} 
          className="hidden md:flex relative ml-auto max-w-xs w-full mr-4"
        >
          <input 
            name="q"
            type="text" 
            placeholder="Kuzatuv: Partiya, QR, Buyruq..." 
            className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </form>
      </div>

      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
        <span className="capitalize">{mounted ? dateStr : ''}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Til tanlash tugmasi va Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <div className="flex items-center rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 overflow-hidden shadow-sm">
            <button 
              onClick={handleCycleLang}
              className="h-9 px-3 flex items-center justify-center gap-2 text-slate-300 hover:text-white 
                        transition-all duration-200 text-xs font-bold whitespace-nowrap active:scale-95"
              title="Tilni almashtirish (Bosganda keyingisiga o'tadi)"
            >
              <Globe size={14} className="text-emerald-400" />
              <span>{currentOption.short}</span>
            </button>
            <button
              onClick={() => setLangMenuOpen(prev => !prev)}
              className="h-9 px-1.5 border-l border-dark-600/80 text-slate-400 hover:text-white hover:bg-dark-600 transition-colors"
              title="Barcha tillar ro'yxati"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Til dropdown menyusi */}
          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-700 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-dark-750 mb-1">
                {formatDual('Tilni tanlang', 'Выберите язык', 'Select language')}
              </div>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = opt.id === lang
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setLang(opt.id)
                      setLangMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected 
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-slate-300 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold">{opt.badge}</span>
                      <span className="text-[10px] opacity-70 font-mono">{opt.short}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-400 ml-2 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 
                          flex items-center justify-center text-slate-400 hover:text-slate-200 
                          transition-all duration-200">
          <Bell size={16} />
        </button>

        <button 
          onClick={() => {
            const nextSize = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal'
            setFontSize(nextSize)
          }}
          className="h-9 px-2 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 
                    flex items-center justify-center text-slate-400 hover:text-indigo-400 
                    transition-all duration-200 gap-1"
          title="Shrift o'lchamini o'zgartirish"
        >
          <Type size={16} />
          <span className="text-xs font-bold font-mono">
            {fontSize === 'normal' ? 'Aa' : fontSize === 'large' ? 'A++' : 'A+++'}
          </span>
        </button>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 
                    flex items-center justify-center text-slate-400 hover:text-amber-400 
                    transition-all duration-200"
          title="Mavzuni o'zgartirish"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}

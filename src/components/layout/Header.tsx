'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, Sun, Moon, Globe, Menu } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useSidebar } from '@/store/sidebar'

const getPageInfo = (pathname: string, t: any) => {
  const map: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: t('dashboard'), subtitle: t('dashboardSub') || 'Umumiy ko\'rinish va statistika' },
    '/inspections': { title: t('inspections'), subtitle: t('inspectionsSub') || 'Barcha kiruvchi xomashyo aktlari' },
    '/inspections/new': { title: t('newInspection'), subtitle: t('newInspectionSub') || 'Kiruvchi xomashyo qabul akti' },
    '/products': { title: t('products'), subtitle: t('productsSub') || 'Mahsulot katalogi va parametrlari' },
    '/suppliers': { title: t('suppliers'), subtitle: t('suppliersSub') || 'Ta\'minotchi kompaniyalar ro\'yxati' },
    '/reports': { title: t('reports'), subtitle: t('reportsSub') || 'Statistika va tahlil ma\'lumotlari' },
    '/users': { title: t('users'), subtitle: t('usersSub') || 'Tizim foydalanuvchilari va ruxsatlar' },
    '/backup': { title: t('backup'), subtitle: t('backupSub') || 'Ma\'lumotlar bazasini zaxiralash' },
    '/settings': { title: t('settings'), subtitle: t('settingsSub') || 'Tizim va shablon sozlamalari' },
  }
  return map[pathname]
}

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  
  const pageInfo = getPageInfo(pathname, t) || { 
    title: 'Green Processing', 
    subtitle: lang === 'ru' ? 'Система контроля' : 'Xomashyo qabul tizimi' 
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { toggle } = useSidebar()

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 md:gap-4 flex-shrink-0">
      <button 
        onClick={toggle}
        className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-white text-base leading-tight truncate">{pageInfo.title}</h2>
        <p className="text-xs text-slate-500 hidden md:block truncate">{pageInfo.subtitle}</p>
      </div>

      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
        <span>{dateStr}</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
          className="h-9 px-3 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 
                    flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 
                    transition-all duration-200 uppercase text-xs font-bold"
          title="Tilni o'zgartirish"
        >
          <Globe size={14} />
          {lang}
        </button>
        <button className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 
                          flex items-center justify-center text-slate-400 hover:text-slate-200 
                          transition-all duration-200">
          <Bell size={16} />
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

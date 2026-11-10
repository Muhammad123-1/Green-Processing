'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/providers/ThemeProvider'
import {
  Leaf,
  ShieldCheck,
  Award,
  Factory,
  Thermometer,
  CheckCircle2,
  ArrowRight,
  Lock,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  FileCheck2,
  Users2,
  ChevronRight,
  Utensils,
  Sun,
  Moon
} from 'lucide-react'

type Lang = 'uz' | 'ru'

const content = {
  uz: {
    nav: {
      about: 'Kompaniya haqida',
      products: 'Mahsulotlarimiz',
      technology: 'Texnologiya va Sifat',
      certificates: 'Sertifikatlar',
      contact: 'Aloqa',
      staffPortal: 'Xodimlar portali (ERP)',
    },
    hero: {
      badge: 'FSSC 22000 & HACCP Xalqaro Standartlari',
      title1: 'Professional oshxona va HoReCa uchun',
      titleHighlight: 'tozalangan va qirqilgan sabzavotlar',
      title2: 'hamda sarxil salatlar',
      subtitle:
        '"GREEN PROCESSING" MChJ — Aysberg salati, tozalangan piyoz, pomidor, sabzi va karamni sanoat usulida yuvish, saralash, qirqish hamda modifikatsiyalangan gaz (MAP) va vakuumda qadoqlovchi zamonaviy agrosanoat majmuasi.',
      ctaPrimary: 'Mahsulotlar katalogi',
      ctaSecondary: 'Xodimlar tizimiga kirish',
      stats: [
        { value: '50+ t', label: 'Kunlik xomashyo qayta ishlash quvvati' },
        { value: '+2°C..+5°C', label: 'Uzluksiz sovuq zanjir (Cold Chain)' },
        { value: '100%', label: 'Yuvilgan va tayyor (Ready-to-Eat)' },
        { value: 'FSSC 22000', label: 'Xalqaro oziq-ovqat xavfsizligi' },
      ],
    },
    about: {
      tag: 'BIZ HAQIMIZDA',
      title: 'Restoran va fastfud tarmoqlari uchun eng ishonchli Fresh-Cut hamkor',
      desc: "Kompaniyamiz yetakchi xalqaro va mahalliy fastfud, restoran tarmoqlari (burger, pitsa, sendvich), oshpazlik markazlari hamda supermarketlar uchun tozalangan, to'g'ralgan va yuvilgan sabzavotlarni yetkazib beradi. Oshxonadagi ortiqcha mehnat, isrof va chiqindilarni nolga tushiramiz.",
      features: [
        {
          title: 'Isteʼmolga tayyor (Ready-to-Eat)',
          desc: 'Maxsus tozalash vannalarida yuvilgan, quritilgan va darhol burger yoki salatga ishlatishga tayyor.',
        },
        {
          title: 'Uzluksiz Sovuq Zanjir (+2°C..+5°C)',
          desc: 'Daladan qabul qilish, saqlash, sexda qirqish va avtorefrijeratorlarda yetkazib berishgacha qatʼiy termonazorat (Forma F-01).',
        },
        {
          title: 'Urschel & Kronen liniyalari',
          desc: 'Burger va sendvichlar uchun millimetrigacha aniq shaklda qirqish (6mm/10mm shredding, slays, kubik, solomka).',
        },
        {
          title: 'MAP va Vakuum qadoqlash',
          desc: 'Kimyoviy konservantlarsiz, modifikatsiyalangan gaz muhiti orqali tabiiy qarsildoq va yangi holatini 7-10 kungacha saqlaydi.',
        },
      ],
    },
    products: {
      tag: 'MAHSULOTLARIMIZ',
      title: 'HoReCa va savdo tarmoqlari uchun sarxil mahsulotlar',
      subtitle: 'Burger, sendvich, pitsa va tayyor salat ishlab chiqaruvchilari uchun standartlashtirilgan qadoqlar.',
      items: [
        {
          category: 'Salatlar va Ko‘katlar',
          name: 'Salat Aysberg (Shredded & Chopped / Burger Cut)',
          specs: 'Kesim: 6mm / 10mm / Butun barg • Yuvilgan, quritilgan • Qadoq: 1kg, 2.5kg, 5kg MAP gas-flush',
          badge: 'Top Sotuv (Burgerlar uchun)',
        },
        {
          category: 'Piyoz mahsulotlari',
          name: 'Tozalangan Piyoz (Butun, Halqa / Slays, Mayda Kubik)',
          specs: 'Oq va sariq navlar • Qo‘l mehnatisiz • 100% vakuum qadoq: 5kg / 10kg • Ko‘z yoshsiz va hidsiz',
          badge: 'Oshxona tejamkori',
        },
        {
          category: 'Pomidor mahsulotlari',
          name: 'Sarxil Pomidorlar (Burger slayslari, Kubik)',
          specs: 'Kalibr: 55-65mm, 65-75mm • Qalinlik: 4-5mm • Go‘shtdor navlar, burgerda oqib ketmaydi',
          badge: 'Fastfud standarti',
        },
        {
          category: 'Sabzi mahsulotlari',
          name: 'Tozalangan Sabzi (Solomka, Kubik, Butun)',
          specs: 'Kesim: 2x2mm, 3x3mm, 10x10mm kubik • 100% tozalangan • Vakuum qadoq: 3kg / 5kg',
          badge: 'Tayyor yarimfabrikat',
        },
        {
          category: 'Karam mahsulotlari',
          name: 'Oq Karam (Yupqa qirqilgan / Koul-Slou)',
          specs: 'Qirqim: 1.5 - 2.5mm • Salat, sous va burgerlar uchun • Vakuum / MAP: 3kg / 5kg',
          badge: 'Salatbop',
        },
        {
          category: 'Aralash Fresh-Mixlar',
          name: 'Tayyor Salatlar (Aysberg + Karam + Sabzi)',
          specs: 'Mijoz retsepti bo‘yicha proporsiyalash • Shunchaki sous qo‘shilsa kifoya • MAP himoya muhiti',
          badge: 'Tayyor yechim',
        },
      ],
    },
    tech: {
      tag: 'TEXNOLOGIYA VA GIGIENA',
      title: 'Mukammal mahsulot xavfsizligining 6 bosqichi',
      steps: [
        { num: '01', title: 'Kiruvchi xomashyo nazorati', desc: 'Harorat (+2°C..+5°C), kalibr, qattiqlik o‘lchanadi va ERP tizimida kirim dalolatnomasi tuziladi.' },
        { num: '02', title: 'Ko‘p bosqichli yuvish va sanatsiya', desc: 'Barbotaj gidroyuvish, qum-changdan tozalash va oziq-ovqat eritmalari bilan xavfsiz dezinfeksiya.' },
        { num: '03', title: 'Ehtiyotkor quritish (Dewatering)', desc: 'Barg to‘qimalarini ezmasdan, sentrifuga orqali ortiqcha namlikni nozik rejimda chiqarish.' },
        { num: '04', title: 'Urschel & Kronen aniq qirqish', desc: 'O‘ta o‘tkir pichoqlar orqali hujayra sharbati oqib ketmasdan, geometrik aniq qirqiladi.' },
        { num: '05', title: 'MAP va vakuum qadoqlash', desc: 'Kislorodni inert gaz aralashmasiga almashtirish orqali kimyoviy moddalarsiz 7-10 kun tabiiy saqlanadi.' },
        { num: '06', title: 'Rentgen-deteksiya va sovuq logistika', desc: 'Begona jismlarni skanerlash, QR-pasport berish va avtorefrijeratorlarda yetkazib berish.' },
      ],
    },
    erpBanner: {
      badge: 'RAQAMLI KORXONA BOSHQARUVI',
      title: 'Green Processing ERP — Ishlab chiqarish ekotizimi',
      desc: 'Zavodning barcha jarayonlari: xomashyo ombori (FEFO), qabul qilish aktlari, sex hisoboti, F-01 harorat nazorati va mahsulot harakati real vaqt rejimida boshqariladi.',
      btn: 'ERP tizimiga kirish',
    },
    contact: {
      tag: 'ALOQA VA HAMKORLIK',
      title: 'HoReCa tarmoqlari va yirik buyurtmachilar uchun',
      addressTitle: 'Manzilimiz',
      address: 'O‘zbekiston Respublikasi, Toshkent viloyati, Qibray / Zangiota sanoat hududi',
      phoneTitle: 'Telefonlar',
      phone: '+998 (71) 200-00-00 / +998 (90) 000-00-00',
      emailTitle: 'Elektron pochta',
      email: 'info@greenprocessing.uz • sales@greenprocessing.uz',
      hoursTitle: 'Ish tartibi',
      hours: 'Ofis: 08:30 – 18:00 (Ishlab chiqarish va jo‘natish: 24/7)',
    },
  },
  ru: {
    nav: {
      about: 'О компании',
      products: 'Продукция',
      technology: 'Технологии и Качество',
      certificates: 'Сертификаты',
      contact: 'Контакты',
      staffPortal: 'Портал сотрудников (ERP)',
    },
    hero: {
      badge: 'Международные стандарты FSSC 22000 & HACCP',
      title1: 'Для профессиональных кухонь и HoReCa',
      titleHighlight: 'очищенные и нарезанные овощи',
      title2: 'а также свежие салаты',
      subtitle:
        'ООО "GREEN PROCESSING" — современный агропромышленный комплекс по промышленной мойке, калибровке, резке и упаковке в МГС (модифицированная газовая среда) и вакуум салата Айсберг, лука, томатов, моркови и капусты.',
      ctaPrimary: 'Каталог продукции',
      ctaSecondary: 'Вход для сотрудников',
      stats: [
        { value: '50+ т', label: 'Суточная мощность переработки сырья' },
        { value: '+2°C..+5°C', label: 'Непрерывная холодовая цепь (Cold Chain)' },
        { value: '100%', label: 'Готово к употреблению (Ready-to-Eat)' },
        { value: 'FSSC 22000', label: 'Международный стандарт безопасности' },
      ],
    },
    about: {
      tag: 'О КОМПАНИИ',
      title: 'Надежный Fresh-Cut партнер для ресторанных сетей и фастфуда',
      desc: 'Поставляем готовые мытые, очищенные и нарезанные овощи ведущим международным и местным сетям фастфуда, ресторанам (бургеры, пицца, сэндвичи), кулинарным цехам и супермаркетам. Сокращаем трудозатраты на кухне и исключаем списания и отходы.',
      features: [
        {
          title: 'Готово к употреблению (Ready-to-Eat)',
          desc: 'Тщательно промыто в барботажных ваннах, высушено и сразу готово к сборке бургеров или салатов.',
        },
        {
          title: 'Холодовая цепь (+2°C..+5°C)',
          desc: 'Строгий температурный контроль от поля, приемки и цеха до доставки в авторефрижераторах (Форма Ф-01).',
        },
        {
          title: 'Линии нарезки Urschel & Kronen',
          desc: 'Сверхточная геометрия нарезки для бургеров и сэндвичей (шреддинг 6мм/10мм, слайсы, кубики, соломка).',
        },
        {
          title: 'Упаковка МГС и Вакуум',
          desc: 'Без химических консервантов. Среда модифицированного газа сохраняет хруст и свежесть 7-10 дней.',
        },
      ],
    },
    products: {
      tag: 'ПРОДУКЦИЯ',
      title: 'Свежая продукция для HoReCa и розничных сетей',
      subtitle: 'Стандартизированная фасовка для бургеров, сэндвичей, пиццы и готовых кулинарных блюд.',
      items: [
        {
          category: 'Салаты и Зелень',
          name: 'Салат Айсберг (Шреддинг & Нарезка для бургеров)',
          specs: 'Резка: 6мм / 10мм / Цельный лист • Мытый, сушеный • Фасовка: 1кг, 2.5кг, 5кг в МГС',
          badge: 'Хит продаж (Для бургеров)',
        },
        {
          category: 'Луковая продукция',
          name: 'Лук репчатый очищенный (Цельный, Кольца, Слайсы, Кубик)',
          specs: 'Сорта: белый и желтый • 100% вакуумная упаковка 5кг / 10кг • Без слез, без запаха и без отходов',
          badge: 'Экономия труда 100%',
        },
        {
          category: 'Томатная продукция',
          name: 'Томаты свежие калиброванные (Слайсы для бургеров, Кубик)',
          specs: 'Калибр: 55-65мм, 65-75мм • Толщина: 4-5мм • Мясистые плотные сорта, не текут в бургере',
          badge: 'Стандарт фастфуда',
        },
        {
          category: 'Морковь и Корнеплоды',
          name: 'Морковь очищенная (Соломка, Корейская, Кубик, Свежая)',
          specs: 'Резка: соломка 2x2мм, 3x3мм, кубик 10x10мм • 100% очищенная • Вакуум: 3кг / 5кг',
          badge: 'Готовый полуфабрикат',
        },
        {
          category: 'Капуста свежая',
          name: 'Капуста белокочанная (Тонкая шинковка / Коул-слоу)',
          specs: 'Нарезка: 1.5 - 2.5мм • Для салатов, коул-слоу и горячих блюд • Вакуум / МГС: 3кг / 5кг',
          badge: 'Салатный хит',
        },
        {
          category: 'Фирменные миксы',
          name: 'Салатные смеси под ключ (Айсберг + Капуста + Морковь)',
          specs: 'Смешивание по рецептуре заказчика • Добавьте соус и блюдо готово • Защитная среда МГС',
          badge: 'Готовое решение',
        },
      ],
    },
    tech: {
      tag: 'ТЕХНОЛОГИИ И САНИТАРИЯ',
      title: '6 ступеней безупречной гигиены и безопасности продукта',
      steps: [
        { num: '01', title: 'Входной контроль сырья', desc: 'Замер температуры (2°C-5°C), калибра, плотности и оформление акта приемки в системе ERP.' },
        { num: '02', title: 'Многоступенчатая мойка и санация', desc: 'Барботажная гидромойка с отделением песка и безопасной дезинфекцией пищевыми растворами.' },
        { num: '03', title: 'Бережная сушка (Dewatering)', desc: 'Центробежная сушка в деликатном режиме без травмирования нежной структуры листьев.' },
        { num: '04', title: 'Точная нарезка Urschel & Kronen', desc: 'Сверхострые высокоскоростные ножи — чистый срез без сминания и выделения клеточного сока.' },
        { num: '05', title: 'Упаковка в МГС и вакуум', desc: 'Замещение кислорода инертной газовой смесью — натуральная свежесть без химии до 10 дней.' },
        { num: '06', title: 'Рентген-детекция и термологистика', desc: '100% сканирование на инородные включения, QR-паспортизация и развоз в авторефрижераторах.' },
      ],
    },
    erpBanner: {
      badge: 'ЦИФРОВОЕ ПРЕДПРИЯТИЕ',
      title: 'Green Processing ERP — Производственная экосистема',
      desc: 'Все процессы фабрики: складской учет сырья (FEFO), акты приемки, отчеты цеха, чек-лист температур Ф-01 и журнал перемещения сырья работают в режиме реального времени.',
      btn: 'Войти в систему ERP',
    },
    contact: {
      tag: 'КОНТАКТЫ',
      title: 'Сотрудничество для сетей HoReCa и оптовых клиентов',
      addressTitle: 'Наш адрес',
      address: 'Республика Узбекистан, Ташкентская область, Промзона Кибрай / Зангиота',
      phoneTitle: 'Телефоны',
      phone: '+998 (71) 200-00-00 / +998 (90) 000-00-00',
      emailTitle: 'Электронная почта',
      email: 'info@greenprocessing.uz • sales@greenprocessing.uz',
      hoursTitle: 'Режим работы',
      hours: 'Офис: 08:30 – 18:00 (Производство и отгрузки: 24/7)',
    },
  },
}

export default function CompanyLandingPage() {
  const [lang, setLang] = useState<Lang>('uz')
  const { theme, setTheme } = useTheme()
  const t = content[lang]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C16] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden transition-colors duration-200">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] rounded-full bg-green-600/10 blur-[160px]" />
      </div>

      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#070C16]/85 border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  GREEN <span className="text-emerald-500">PROCESSING</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">
                Fresh-Cut Salads & Vegetables
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.about}
            </a>
            <a href="#products" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.products}
            </a>
            <a href="#technology" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.technology}
            </a>
            <a href="#certificates" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.certificates}
            </a>
            <a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t.nav.contact}
            </a>
          </nav>

          {/* Right Actions: Theme Toggle + Language + Employee Login */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-all shadow-xs cursor-pointer"
              title={theme === 'dark' ? 'Kunduzgi rejimga o‘tish (Oq)' : 'Tungi rejimga o‘tish (Qora)'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-slate-700" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setLang('uz')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'uz'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                O‘Z
              </button>
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'ru'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                РУ
              </button>
            </div>

            {/* Employee Login Button */}
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{t.nav.staffPortal}</span>
              <span className="sm:hidden">ERP</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                {t.hero.title1}{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 dark:from-emerald-400 dark:via-green-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  {t.hero.titleHighlight}
                </span>{' '}
                {t.hero.title2}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <span>{t.hero.ctaPrimary}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-emerald-400 border border-slate-200 dark:border-emerald-500/30 font-bold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.hero.ctaSecondary}</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl dark:shadow-2xl">
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">OOO &quot;GREEN PROCESSING&quot;</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">FSSC 22000 • Fresh-Cut Plant</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-500/25">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE ERP
                  </span>
                </div>

                {/* Live Capability Highlights */}
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {lang === 'uz' ? 'Sovuq zanjir (F-01 nazorati)' : 'Холодовая цепь (Контроль Ф-01)'}
                        </span>
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">+2.0°C .. +4.0°C</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Aysberg, piyoz, pomidor, sabzi va karam doimiy harorat rejimida'
                          : 'Постоянный температурный режим хранения сырья и готовой продукции'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {lang === 'uz' ? 'Sanoat qirqish liniyasi' : 'Промышленная линия нарезки'}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Burger Cut / Shred</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Urschel & Kronen uskunalarida 6mm va 10mm aniq geometriya'
                          : 'Сверхострая нарезка шреддинг, слайсы и кубик на Urschel & Kronen'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {lang === 'uz' ? 'MAP va Vakuum Qadoqlash' : 'Упаковка МГС и Вакуум'}
                        </span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">100% Ready-to-Eat</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Kimyoviy moddalarsiz tabiiy yangilik va qarsildoq ta’m'
                          : 'Натуральная свежесть без консервантов со сроком 7-10 суток'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Portal Footer inside card */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'uz' ? 'Korxona xodimimisiz?' : 'Вы сотрудник компании?'}
                  </span>
                  <Link
                    href="/login"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <span>{lang === 'uz' ? 'ERP Tizimga o‘tish' : 'Перейти в ERP систему'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {t.hero.stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center shadow-xs hover:border-emerald-500/40 transition-colors"
              >
                <div className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-20 bg-slate-100/70 dark:bg-slate-950/60 border-y border-slate-200 dark:border-white/5 px-4 sm:px-6 lg:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-14">
              <span className="text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                {t.about.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 mb-4">
                {t.about.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {t.about.desc}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.about.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-xs hover:border-emerald-500/40 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                {t.products.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
                {t.products.title}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">{t.products.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.products.items.map((item, idx) => (
              <div
                key={idx}
                className="group p-7 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-slate-950/90 border border-slate-200 dark:border-white/10 shadow-xs hover:border-emerald-500/40 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-black/30 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 mt-4">
                  {item.specs}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TECHNOLOGY & QUALITY CHAIN */}
        <section id="technology" className="py-20 bg-slate-100/70 dark:bg-slate-950/70 border-y border-slate-200 dark:border-white/5 px-4 sm:px-6 lg:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                {t.tech.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
                {t.tech.title}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.tech.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs relative overflow-hidden"
                >
                  <span className="text-4xl font-black text-emerald-500/10 dark:text-emerald-500/15 absolute top-4 right-5 select-none">
                    {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CERTIFICATES & STANDARDS */}
        <section id="certificates" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">FSSC 22000</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Food Safety System Certification</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">ISO 9001 & 22000</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">International Quality Management</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">HACCP & HALAL</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">100% Certified Clean Production</p>
              </div>
            </div>
          </div>
        </section>

        {/* DEDICATED STAFF ERP PORTAL BANNER */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold">
                <Users2 className="w-3.5 h-3.5" />
                <span>{t.erpBanner.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {t.erpBanner.title}
              </h3>
              <p className="text-emerald-50 text-sm sm:text-base leading-relaxed opacity-95">
                {t.erpBanner.desc}
              </p>
            </div>

            <Link
              href="/login"
              className="shrink-0 inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer"
            >
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>{t.erpBanner.btn}</span>
              <ArrowRight className="w-5 h-5 text-emerald-600" />
            </Link>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              {t.contact.tag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              {t.contact.title}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-xs space-y-2">
              <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t.contact.addressTitle}</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.contact.address}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-xs space-y-2">
              <Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t.contact.phoneTitle}</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.contact.phone}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-xs space-y-2">
              <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t.contact.emailTitle}</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{t.contact.email}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-xs space-y-2">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t.contact.hoursTitle}</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.contact.hours}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#050811] py-8 px-4 sm:px-6 lg:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-slate-300">OOO &quot;GREEN PROCESSING&quot;</span>
            <span>— All rights reserved &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              {t.nav.staffPortal}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

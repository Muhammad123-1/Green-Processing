'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Leaf,
  ShieldCheck,
  Award,
  Factory,
  Thermometer,
  Globe2,
  CheckCircle2,
  ArrowRight,
  Lock,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  FileCheck2,
  Microscope,
  Truck,
  Building2,
  Users2,
  ChevronRight,
  ExternalLink,
  Utensils,
  Layers,
  Boxes,
  Package
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
          name: 'Saralangan va Slays Pomidor (Burger Slices & Diced)',
          specs: 'Kalibr: 55-65mm, 65-75mm • Qalinlik: 4-5mm bir xil kesim • Zich go‘shtli, oqmaydigan maxsus nav',
          badge: 'Fastfud standarti',
        },
        {
          category: 'Sabzi va Ildizmevalar',
          name: 'Tozalangan Sabzi (Solomka / Koreyscha, Kubik, Butun)',
          specs: 'Kesim: 2x2mm, 3x3mm solomka, 10x10mm kubik • 100% tozalangan, vakuum qadoq: 3kg / 5kg',
          badge: 'Tayyor yarimfabrikat',
        },
        {
          category: 'Karam mahsulotlari',
          name: 'Oq Boshli Karam (Yupqa Shinkovka / Coleslaw Cut)',
          specs: 'Kesim: 1.5 - 2.5mm mayda to‘g‘ralgan • Coleslaw va yangi salatlar uchun • Qadoq: 3kg / 5kg vakuum',
          badge: 'Salatbop',
        },
        {
          category: 'Maxsus Aralashmalar',
          name: 'Mualliflik Salat Mixlari (Aysberg + Karam + Sabzi)',
          specs: 'Buyurtmachi retsepti bo‘yicha proporsional aralashma • Sous qo‘shilsa tayyor salat • MAP qadoq',
          badge: 'Tayyor Yechim',
        },
      ],
    },
    tech: {
      tag: 'TEXNOLOGIYA VA SANITARIYA',
      title: '6 bosqichli yuqori gigiyenik xavfsizlik zanjiri',
      steps: [
        { num: '01', title: 'Qat’iy kirish nazorati', desc: 'Xomashyo harorati (2°C-5°C), vazni, organoleptikasi va qabul akti (Forma F-01 va qabul jurnali).' },
        { num: '02', title: 'Ko‘p bosqichli dezinfeksiyali yuvish', desc: 'Suv oqimida qum va zarrachalarni ajratish, ruxsat etilgan xavfsiz sanitariya eritmalari bilan tozalash.' },
        { num: '03', title: 'Sentrifugada quritish (Dewatering)', desc: 'Barglar va sabzavotlar yuzasidagi namlikni mahsulot to‘qimasini shikastlamasdan muloyim quritish.' },
        { num: '04', title: 'Urschel & Kronen nozik qirqish', desc: 'Yuqori tezlikdagi pichoqlarda silliq, bir xil geometriyada qirqish — xomashyo suvini yo‘qotmaydi.' },
        { num: '05', title: 'MAP & Vakuum qadoqlash', desc: 'Kislorodni haydab, himoya gaz muhitini yaratish orqali ximiyaviy konservantlarsiz yangilikni saqlash.' },
        { num: '06', title: 'Metallodetektor va Sovuq logistika', desc: 'Har bir qutini metall zarrachalariga tekshirish, QR-pasport berish va refrijeratorlarda yetkazish.' },
      ],
    },
    erpBanner: {
      badge: 'RAQAMLI KORXONA BOSHQARUVI',
      title: 'Green Processing ERP — Ishlab Chiqarish va Xodimlar Tizimi',
      desc: 'Barcha jarayonlar: Omborxona qoldiqlari (FEFO), Kirim aktlari, Sex hisoboti va sarfi, F-01 harorat nazorati hamda Savdo buyurtmalari yagona avtomatlashtirilgan tizimda boshqariladi.',
      btn: 'Xodimlar tizimiga kirish',
    },
    contact: {
      tag: 'BOG‘LANISH',
      title: 'HoReCa va ulgurji yetkazib berish bo‘yicha hamkorlik',
      addressTitle: 'Manzilimiz',
      address: "O'zbekiston Respublikasi, Toshkent viloyati, Qibray / Zangiota sanoat zonasi",
      phoneTitle: 'Telefon raqamlar',
      phone: '+998 (71) 200-00-00 / +998 (90) 000-00-00',
      emailTitle: 'Elektron pochta',
      email: 'info@greenprocessing.uz • sales@greenprocessing.uz',
      hoursTitle: 'Ish vaqti',
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
      title1: 'Свежие нарезанные овощи и салаты',
      titleHighlight: 'категории Fresh-Cut',
      title2: 'для HoReCa и ритейла',
      subtitle:
        'ООО «GREEN PROCESSING» — современный агропромышленный комплекс по промышленной мойке, калибровке, нарезке и упаковке салата Айсберг, лука, томатов, моркови и капусты в модифицированной газовой среде (МГС) и вакууме.',
      ctaPrimary: 'Каталог продукции',
      ctaSecondary: 'Вход для сотрудников',
      stats: [
        { value: '50+ т', label: 'Суточная мощность переработки сырья' },
        { value: '+2°C..+5°C', label: 'Непрерывная холодовая цепь (Cold Chain)' },
        { value: '100%', label: 'Чистые и готовые к подаче (Ready-to-Eat)' },
        { value: 'FSSC 22000', label: 'Сертифицированная безопасность' },
      ],
    },
    about: {
      tag: 'О КОМПАНИИ',
      title: 'Главный поставщик fresh-cut овощей для сетей ресторанов и фастфуда',
      desc: 'Мы обеспечиваем ведущие сети быстрого питания, бургерные, рестораны, фабрики-кухни и супермаркеты готовыми очищенными и нарезанными овощами ресторанного стандарта. Полностью исключаем ручной труд на кухне, списания и отходы.',
      features: [
        {
          title: 'Готово к использованию (Ready-to-Eat)',
          desc: 'Тщательно промыто в барботажных ваннах с озонированием и дезинфекцией, просушено и сразу готово к сборке блюд.',
        },
        {
          title: 'Строгий холод (+2°C..+5°C)',
          desc: 'Беспрерывная холодильная цепь: приемка, хранение, цех нарезки и доставка в собственных рефрижераторах (Форма Ф-01).',
        },
        {
          title: 'Немецкое оборудование Urschel & Kronen',
          desc: 'Идеальная геометрия нарезки для бургеров и сэндвичей (шреддинг 6мм/10мм, точные слайсы, кубики и соломка).',
        },
        {
          title: 'Упаковка МГС (Газомодификация) и Вакуум',
          desc: 'Без капли химии и консервантов сохраняет хруст, цвет, витамины и свежесть продукции от 7 до 10 суток.',
        },
      ],
    },
    products: {
      tag: 'НАША ПРОДУКЦИЯ',
      title: 'Профессиональная продукция для HoReCa и пищевых производств',
      subtitle: 'Стандартизированные фасовки для бургеров, пиццы, сэндвичей, кулинарии и ресторанных сетей.',
      items: [
        {
          category: 'Салаты и Зелень',
          name: 'Салат Айсберг (Шреддинг, Нарезка для бургеров, Цельный)',
          specs: 'Резка: 6мм / 10мм / Burger Cut • Промыт, просушен • Упаковка: 1кг, 2.5кг, 5кг МГС (Gas-Flush)',
          badge: 'Хит продаж для бургеров',
        },
        {
          category: 'Луковая продукция',
          name: 'Лук репчатый очищенный (Кольца, Кубик, Целый очищенный)',
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
  const t = content[lang]

  return (
    <div className="min-h-screen bg-[#070C16] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] rounded-full bg-green-600/10 blur-[160px]" />
      </div>

      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070C16]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  GREEN <span className="text-emerald-400">PROCESSING</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                Fresh-Cut Salads & Vegetables
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <a href="#about" className="hover:text-emerald-400 transition-colors">
              {t.nav.about}
            </a>
            <a href="#products" className="hover:text-emerald-400 transition-colors">
              {t.nav.products}
            </a>
            <a href="#technology" className="hover:text-emerald-400 transition-colors">
              {t.nav.technology}
            </a>
            <a href="#certificates" className="hover:text-emerald-400 transition-colors">
              {t.nav.certificates}
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">
              {t.nav.contact}
            </a>
          </nav>

          {/* Right Actions: Language + Employee Login */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setLang('uz')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'uz'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                O‘Z
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'ru'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                РУ
              </button>
            </div>

            {/* Employee Login Button */}
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>{t.nav.staffPortal}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-14 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                {t.hero.title1}{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-cyan-400 bg-clip-text text-transparent">
                  {t.hero.titleHighlight}
                </span>{' '}
                {t.hero.title2}
              </h1>

              <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-emerald-50 font-extrabold text-sm shadow-xl transition-all"
                >
                  <span>{t.hero.ctaPrimary}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-sm transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>{t.hero.ctaSecondary}</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">OOO &quot;GREEN PROCESSING&quot;</h3>
                      <p className="text-xs text-slate-400">FSSC 22000 • Fresh-Cut Plant</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE ERP
                  </span>
                </div>

                {/* Live Capability Highlights */}
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {lang === 'uz' ? 'Sovuq zanjir (F-01 nazorati)' : 'Холодовая цепь (Контроль Ф-01)'}
                        </span>
                        <span className="text-xs font-black text-cyan-400">+2.0°C .. +4.0°C</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Aysberg, piyoz, pomidor, sabzi va karam doimiy harorat rejimida'
                          : 'Постоянный температурный режим хранения сырья и готовой продукции'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {lang === 'uz' ? 'Sanoat qirqish liniyasi' : 'Промышленная линия нарезки'}
                        </span>
                        <span className="text-xs font-black text-emerald-400">Burger Cut / Shred</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Urschel & Kronen uskunalarida 6mm va 10mm aniq geometriya'
                          : 'Сверхострая нарезка шреддинг, слайсы и кубик на Urschel & Kronen'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {lang === 'uz' ? 'MAP va Vakuum Qadoqlash' : 'Упаковка МГС и Вакуум'}
                        </span>
                        <span className="text-xs font-black text-amber-400">100% Ready-to-Eat</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Kimyoviy moddalarsiz tabiiy yangilik va qarsildoq ta’m'
                          : 'Натуральная свежесть без консервантов со сроком 7-10 суток'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Portal Footer inside card */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {lang === 'uz' ? 'Korxona xodimimisiz?' : 'Вы сотрудник компании?'}
                  </span>
                  <Link
                    href="/login"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <span>{lang === 'uz' ? 'ERP Tizimga o‘tish' : 'Перейти в ERP систему'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {t.hero.stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 text-center hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-20 bg-slate-950/60 border-y border-white/5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-14">
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                {t.about.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 mb-4">
                {t.about.title}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {t.about.desc}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.about.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold text-white mb-2">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
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
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                {t.products.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                {t.products.title}
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">{t.products.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.products.items.map((item, idx) => (
              <div
                key={idx}
                className="group p-7 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold whitespace-nowrap">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium bg-black/30 p-3.5 rounded-xl border border-white/5 mt-4">
                  {item.specs}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TECHNOLOGY & QUALITY CHAIN */}
        <section id="technology" className="py-20 bg-slate-950/70 border-y border-white/5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                {t.tech.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                {t.tech.title}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.tech.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 relative overflow-hidden"
                >
                  <span className="text-4xl font-black text-emerald-500/15 absolute top-4 right-5 select-none">
                    {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-xs flex items-center justify-center mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CERTIFICATES & STANDARDS */}
        <section id="certificates" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">FSSC 22000</h4>
                <p className="text-xs text-slate-400">Food Safety System Certification</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">ISO 9001 & 22000</h4>
                <p className="text-xs text-slate-400">International Quality Management</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">HACCP & HALAL</h4>
                <p className="text-xs text-slate-400">100% Certified Clean Production</p>
              </div>
            </div>
          </div>
        </section>

        {/* DEDICATED STAFF ERP PORTAL BANNER */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold">
                <Users2 className="w-3.5 h-3.5" />
                <span>{t.erpBanner.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {t.erpBanner.title}
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {t.erpBanner.desc}
              </p>
            </div>

            <Link
              href="/login"
              className="shrink-0 inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all"
            >
              <Lock className="w-5 h-5" />
              <span>{t.erpBanner.btn}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
              {t.contact.tag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
              {t.contact.title}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/10 space-y-2">
              <MapPin className="w-6 h-6 text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-400">{t.contact.addressTitle}</div>
              <p className="text-sm font-semibold text-white">{t.contact.address}</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/10 space-y-2">
              <Phone className="w-6 h-6 text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-400">{t.contact.phoneTitle}</div>
              <p className="text-sm font-semibold text-white">{t.contact.phone}</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/10 space-y-2">
              <Mail className="w-6 h-6 text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-400">{t.contact.emailTitle}</div>
              <p className="text-sm font-semibold text-white break-words">{t.contact.email}</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/10 space-y-2">
              <Clock className="w-6 h-6 text-emerald-400 mb-3" />
              <div className="text-xs font-bold uppercase text-slate-400">{t.contact.hoursTitle}</div>
              <p className="text-sm font-semibold text-white">{t.contact.hours}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050811] py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-300">OOO &quot;GREEN PROCESSING&quot;</span>
            <span>— All rights reserved &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
              {t.nav.staffPortal}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

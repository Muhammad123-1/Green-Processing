'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Leaf,
  ShieldCheck,
  Award,
  Factory,
  Snowflake,
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
  ExternalLink
} from 'lucide-react'

type Lang = 'uz' | 'ru'

const content = {
  uz: {
    nav: {
      about: 'Kompaniya haqida',
      products: 'Mahsulotlar',
      technology: 'Texnologiya va Sifat',
      certificates: 'Sertifikatlar',
      contact: 'Aloqa',
      staffPortal: 'Xodimlar portali (ERP)',
    },
    hero: {
      badge: 'Xalqaro FSSC 22000 & ISO Sifat Standartlari',
      title1: 'Tabiiy mahsulotlarni',
      titleHighlight: 'innovatsion qayta ishlash',
      title2: 'va eksport markazi',
      subtitle:
        '"GREEN PROCESSING" MChJ — meva, rezavor va sabzavotlarni yuqori texnologiyali IQF (tez muzlatish), saralash hamda qadoqlashga ixtisoslashgan zamonaviy agrosanoat majmuasi.',
      ctaPrimary: 'Mahsulotlar katalogi',
      ctaSecondary: 'Xodimlar tizimiga kirish',
      stats: [
        { value: '15,000+', label: 'Yillik ishlab chiqarish quvvati (tonna)' },
        { value: '100%', label: 'Tabiiy va GMO siz xomashyo' },
        { value: '-40°C', label: 'IQF shok-muzlatish texnologiyasi' },
        { value: '24/7', label: 'Raqamli laboratoriya va sifat nazorati' },
      ],
    },
    about: {
      tag: 'BIZ HAQIMIZDA',
      title: "O'zbekistonning sarxil ne'matlarini dunyo bozoriga yetkazamiz",
      desc: "Kompaniyamiz qishloq xo'jaligi mahsulotlarini daladan to iste'molchi dasturxonigacha bo'lgan barcha bosqichlarda to'liq raqamlashtirilgan ERP va Traceability (kuzatuvchanlik) tizimi orqali nazorat qiladi. Har bir partiya ko'p bosqichli laboratoriya tekshiruvidan o'tkaziladi.",
      features: [
        {
          title: 'To‘liq partiya kuzatuvi (Traceability)',
          desc: 'Xomashyo qabul qilishdan tortib tayyor mahsulot yuklanishigacha QR-kodli raqamli pasportlashtirish.',
        },
        {
          title: 'Zamonaviy IQF liniyalari',
          desc: 'Hujayra tuzilishi, vitaminlar va tabiiy ta’mni 98% gacha saqlab qoluvchi Yevropa uskunalari.',
        },
        {
          title: 'FSSC 22000 & HACCP',
          desc: 'Oziq-ovqat xavfsizligi bo‘yicha eng qat’iy xalqaro reglamentlar asosida sanitariya va sifat nazorati.',
        },
        {
          title: 'Ekologik toza hudud',
          desc: 'Quyoshli iqlimda yetishtirilgan sarxil meva va sabzavotlarni bevosita fermer xo‘jaliklaridan qabul qilish.',
        },
      ],
    },
    products: {
      tag: 'MAHSULOTLARIMIZ',
      title: 'Eksportbop muzlatilgan va qayta ishlangan mahsulotlar',
      subtitle: 'HoReCa, chakana savdo tarmoqlari va sanoat korxonalari uchun individual kalibrovka hamda qadoqlash.',
      items: [
        {
          category: 'Rezavor mevalar',
          name: 'Qulupnay, Malina, Olcha va Maymunjon (IQF)',
          specs: 'Kalibr: 15-25mm / 25-35mm • Brix: 8-12% • Qadoq: 10kg / 2.5kg',
          badge: 'Top Eksport',
        },
        {
          category: 'Danakli mevalar',
          name: "O'rik (yarimtalik/kubik), Shaftoli va Olxo'ri",
          specs: 'Mashina va qo‘l kesimi • Danaksiz • Yuqori organoleptik ko‘rsatkich',
          badge: 'Premium Sifat',
        },
        {
          category: 'Sabzavotlar va Ko‘katlar',
          name: 'Brokkoli, Gulkaram, Bulgor qalampiri, Qovoq',
          specs: 'Blanshirlangan • Rang va tekstura saqlangan • Sanoat qadog‘i',
          badge: 'Sanoat standarti',
        },
        {
          category: 'Meva pyure va yarim tayyor mahsulotlar',
          name: 'Aseptik va muzlatilgan meva kontsentratlari',
          specs: 'Qand qo‘shilmagan 100% tabiiy • Konditer va sharbat sanoati uchun',
          badge: 'B2B Yechim',
        },
      ],
    },
    tech: {
      tag: 'TEXNOLOGIYA VA LABORATORIYA',
      title: '6 bosqichli uzluksiz sifat va xavfsizlik zanjiri',
      steps: [
        { num: '01', title: 'Kiruvchi xomashyo nazorati', desc: 'Fizik-kimyoviy, organoleptik tahlil, Brix va harorat o‘lchovi, dalolatnoma (Akt) rasmiylashtirish.' },
        { num: '02', title: 'Yuvish va dezinfeksiya', desc: 'Ko‘p bosqichli barbotajli yuvish, suv konsentratsiyasi va sanitariya ko‘rsatkichlari monitoringi.' },
        { num: '03', title: 'Optik saralash va kalibrovka', desc: 'Begona jismlar, nuqsonli mevalarni avtomatik ajratish hamda o‘lcham bo‘yicha aniq tasniflash.' },
        { num: '04', title: 'IQF Shok-muzlatish (-35°C..-40°C)', desc: 'Mahsulot markaziy haroratini daqiqalar ichida -18°C ga tushirish orqali muz kristallari hosil bo‘lishini oldini olish.' },
        { num: '05', title: 'Metallodetektor va Qadoqlash', desc: 'Har bir qadoqni Fe, Non-Fe va SUS metall zarrachalariga tekshirish hamda markirovkalash.' },
        { num: '06', title: 'Sovuq zanjir logistikasi', desc: '-18°C..-22°C rejimli zamonaviy omborxonalar va termograf nazoratidagi eksport yuk tashish.' },
      ],
    },
    erpBanner: {
      badge: 'KORPORATIV RAQAMLI EKOTIZIM',
      title: 'Green Processing ERP — Xodimlar va Boshqaruv Portali',
      desc: 'Korxonaning barcha bo‘limlari: Rahbariyat, Sifat nazorati (QC), Sex nazoratchilari, Ishlab chiqarish, Texnologiya, Ombor, Ta’minot, Buxgalteriya va Kadrlar bo‘limi yagona raqamli tizimda ishlaydi.',
      btn: 'Xodimlar kabinetiga kirish',
    },
    contact: {
      tag: 'BOG‘LANISH',
      title: 'Hamkorlik va buyurtmalar uchun aloqa',
      addressTitle: 'Manzilimiz',
      address: "O'zbekiston Respublikasi, Toshkent viloyati, Sanoat hududi",
      phoneTitle: 'Telefon raqamlar',
      phone: '+998 (71) 200-00-00 / +998 (90) 123-45-67',
      emailTitle: 'Elektron pochta',
      email: 'info@greenprocessing.uz • export@greenprocessing.uz',
      hoursTitle: 'Ish vaqti',
      hours: 'Dushanba - Shanba: 08:00 – 19:00 (Ishlab chiqarish: 24/7)',
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
      badge: 'Международные стандарты FSSC 22000 & ISO',
      title1: 'Инновационная переработка',
      titleHighlight: 'натуральных продуктов',
      title2: 'и экспортный хаб',
      subtitle:
        'ООО «GREEN PROCESSING» — современный агропромышленный комплекс, специализирующийся на высокотехнологичной IQF (шоковой) заморозке, калибровке и упаковке фруктов, ягод и овощей.',
      ctaPrimary: 'Каталог продукции',
      ctaSecondary: 'Вход для сотрудников',
      stats: [
        { value: '15,000+', label: 'Годовая мощность производства (тонн)' },
        { value: '100%', label: 'Натуральное сырье без ГМО' },
        { value: '-40°C', label: 'Технология шоковой заморозки IQF' },
        { value: '24/7', label: 'Цифровая лаборатория и контроль качества' },
      ],
    },
    about: {
      tag: 'О КОМПАНИИ',
      title: 'Доставляем отборные дары природы Узбекистана на мировой рынок',
      desc: 'Наша компания контролирует сельхозпродукцию на всех этапах — от поля до отгрузки клиенту с помощью полностью оцифрованной системы ERP и Traceability (прослеживаемости). Каждая партия проходит многоступенчатый лабораторный контроль.',
      features: [
        {
          title: 'Полная прослеживаемость (Traceability)',
          desc: 'Цифровая паспортизация с QR-кодами от приемки сырья до погрузки готовой продукции.',
        },
        {
          title: 'Современные линии IQF',
          desc: 'Европейское оборудование, сохраняющее клеточную структуру, витамины и вкус до 98%.',
        },
        {
          title: 'FSSC 22000 & HACCP',
          desc: 'Санитарный и качественный контроль по строжайшим международным регламентам пищевой безопасности.',
        },
        {
          title: 'Экологически чистый регион',
          desc: 'Прямые поставки спелых фруктов и овощей, выращенных под щедрым солнцем, от проверенных хозяйств.',
        },
      ],
    },
    products: {
      tag: 'НАША ПРОДУКЦИЯ',
      title: 'Экспортные замороженные и переработанные продукты',
      subtitle: 'Индивидуальная калибровка, нарезка и фасовка для сегментов HoReCa, ритейла и пищевой промышленности.',
      items: [
        {
          category: 'Ягоды (IQF)',
          name: 'Клубника, Малина, Вишня и Ежевика',
          specs: 'Калибр: 15-25мм / 25-35мм • Brix: 8-12% • Упаковка: 10кг / 2.5кг',
          badge: 'Топ Экспорт',
        },
        {
          category: 'Косточковые фрукты',
          name: 'Абрикос (половинки/кубик), Персик и Слива',
          specs: 'Машинная и ручная резка • Без косточки • Высокая органолептика',
          badge: 'Премиум Качество',
        },
        {
          category: 'Овощи и Зелень',
          name: 'Брокколи, Цветная капуста, Перец сладкий, Тыква',
          specs: 'Бланшированные • Сохранение цвета и текстуры • Промышленная тара',
          badge: 'Индустриальный стандарт',
        },
        {
          category: 'Фруктовые пюре и полуфабрикаты',
          name: 'Асептические и замороженные концентраты',
          specs: '100% натуральные без сахара • Для кондитерской и соковой индустрии',
          badge: 'B2B Решение',
        },
      ],
    },
    tech: {
      tag: 'ТЕХНОЛОГИИ И ЛАБОРАТОРИЯ',
      title: '6 ступеней непрерывного контроля качества и безопасности',
      steps: [
        { num: '01', title: 'Входной контроль сырья', desc: 'Физико-химический и органолептический анализ, замер Brix и температуры, оформление актов приемки.' },
        { num: '02', title: 'Мойка и дезинфекция', desc: 'Многоступенчатая барботажная мойка, мониторинг концентрации растворов и санитарных норм.' },
        { num: '03', title: 'Оптическая сортировка и калибровка', desc: 'Автоматическое отделение инородных тел, дефектов и точная классификация по размерам.' },
        { num: '04', title: 'Шоковая заморозка IQF (-35°C..-40°C)', desc: 'Быстрое снижение температуры в центре продукта до -18°C без разрушения структуры клеток.' },
        { num: '05', title: 'Металлодетекция и Упаковка', desc: 'Проверка каждой коробки на частицы Fe, Non-Fe и SUS металлов, автоматическая маркировка.' },
        { num: '06', title: 'Логистика холодовой цепи', desc: 'Современные склады с режимом -18°C..-22°C и экспортные отгрузки под контролем термографов.' },
      ],
    },
    erpBanner: {
      badge: 'КОРПОРАТИВНАЯ ЦИФРОВАЯ ЭКОСИСТЕМА',
      title: 'Green Processing ERP — Портал сотрудников и управления',
      desc: 'Все подразделения предприятия: Дирекция, Контроль качества (ОТК), Инспекторы цеха, Производство, Технологи, Склад, Снабжение, Бухгалтерия и HR работают в единой цифровой системе.',
      btn: 'Войти в кабинет сотрудника',
    },
    contact: {
      tag: 'КОНТАКТЫ',
      title: 'Свяжитесь с нами для сотрудничества и заказов',
      addressTitle: 'Наш адрес',
      address: 'Республика Узбекистан, Ташкентская область, Промышленная зона',
      phoneTitle: 'Телефоны',
      phone: '+998 (71) 200-00-00 / +998 (90) 123-45-67',
      emailTitle: 'Электронная почта',
      email: 'info@greenprocessing.uz • export@greenprocessing.uz',
      hoursTitle: 'Режим работы',
      hours: 'Понедельник - Суббота: 08:00 – 19:00 (Производство: 24/7)',
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
                Agro-Industrial Complex
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
                      <p className="text-xs text-slate-400">FSSC 22000 • IQF Processing Plant</p>
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
                      <Snowflake className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">IQF Tunnel Freezer</span>
                        <span className="text-xs font-black text-cyan-400">-38.5 °C</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Uzluksiz shok-muzlatish va harorat monitoringi'
                          : 'Непрерывная шоковая заморозка и мониторинг'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Microscope className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {lang === 'uz' ? 'Sifat va Laboratoriya (QC)' : 'Лаборатория и ОТК'}
                        </span>
                        <span className="text-xs font-black text-emerald-400">ISO / FSSC</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'Fizik-kimyoviy, Brix, mikrobiologik va metall nazorati'
                          : 'Физико-химический, Brix, микробиологический контроль'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          {lang === 'uz' ? 'Eksport Geografiyasi' : 'География экспорта'}
                        </span>
                        <span className="text-xs font-black text-amber-400">10+ {lang === 'uz' ? 'Davlatlar' : 'Стран'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'uz'
                          ? 'MDH, Yevropa va Osiyo bozorlariga xalqaro logistika'
                          : 'Международная логистика в страны СНГ, Европы и Азии'}
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

          <div className="grid md:grid-cols-2 gap-6">
            {t.products.items.map((item, idx) => (
              <div
                key={idx}
                className="group p-7 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-3 group-hover:text-emerald-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium bg-black/30 p-3.5 rounded-xl border border-white/5">
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
                <p className="text-xs text-slate-400">100% Certified Production Lines</p>
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

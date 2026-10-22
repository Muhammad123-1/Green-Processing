'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'uz_ru' | 'uz_en' | 'ru_en' | 'uz' | 'ru' | 'en'
export type DirectorLanguage = 'uz' | 'ru' | 'en'

export interface LanguageOption {
  id: Language
  label: string
  short: string
  badge: string
}

export interface DirectorLanguageOption {
  id: DirectorLanguage
  label: string
  short: string
  badge: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'uz', label: "O'zbekcha", short: 'UZ', badge: "O'zbekcha" },
  { id: 'ru', label: "Русский", short: 'RU', badge: "Русский" },
  { id: 'en', label: "English", short: 'EN', badge: "English" },
]

export const DIRECTOR_LANGUAGE_OPTIONS: DirectorLanguageOption[] = [
  { id: 'uz', label: "O'zbekcha", short: 'UZ', badge: "O'zbekcha" },
  { id: 'ru', label: "Русский", short: 'RU', badge: "Русский" },
  { id: 'en', label: "English", short: 'EN', badge: "English" },
]

const translations = {
  uz: {
    sales: 'Sotuv',
    archive: 'Umumiy Arxiv',
    dashboard: 'Bosh sahifa',
    inspections: 'Akt tarixi',
    newInspection: 'Yangi akt',
    incomingActs: 'Xomashyo aktlari',
    disinfectionIncoming: 'Dezinfeksiya va yuvish vositalari',
    orders: 'Buyurtmalar',
    production: 'Ishlab chiqarish',
    kitchen: 'Xodimlar oshxonasi',
      surveys: 'So\'rovnomalar',
    products: 'Mahsulotlar',
    suppliers: "Ta'minotchilar",
    supervisors: 'Nazoratchilar',
    reports: 'Hisobotlar',
    users: 'Foydalanuvchilar',
    backup: 'Zaxira nusxa',
    settings: 'Sozlamalar',
    warehouse: 'Omborxona',
    traceability: 'Pasport',
    arrivals: 'Kirimlar',
    director: 'Direktor paneli',
    hr: 'Kadrlar',
    logistics: 'Logistika',
    accounting: 'Buxgalteriya',
    security: 'Xavfsizlik',
    logout: 'Tizimdan chiqish',
    search: 'Qidirish...',
    admin: 'Administrator',
    active: 'Tizimda',
    welcome: 'Xush kelibsiz!',
    todayIs: 'Bugun',
    inspectionsRecorded: 'ta kiruvchi xomashyo akti qayd etilgan',
    totalInspections: 'Jami aktlar',
    accepted: 'Qabul qilindi',
    rejected: 'Rad etildi',
    conditional: 'Shartli qabul',
    recentInspections: 'Oxirgi aktlar',
    recentDesc: "Eng so'nggi qayd etilgan aktlar",
    seeAll: "Barchasini ko'rish",
    noInspections: "Hozircha aktlar yo'q",
    createOne: 'Yangi akt yaratish uchun yuqoridagi tugmani bosing',
    actNumber: 'Akt raqami',
    date: 'Sana',
    quantity: 'Miqdor',
    status: 'Holat',
    view: "Ko'rish",
    quickNewAct: 'Yangi akt',
    quickNewActDesc: 'Kiruvchi xomashyo akti',
    quickProd: 'Mahsulotlar',
    quickProdDesc: "Mahsulot qo'shish/tahrirlash",
    quickSupp: "Ta'minotchilar",
    quickSuppDesc: "Ta'minotchi ma'lumotlari",
    dashboardSub: "Umumiy ko'rinish va statistika",
    inspectionsSub: 'Barcha kiruvchi xomashyo aktlari',
    newInspectionSub: 'Kiruvchi xomashyo qabul akti',
    arrivalsSub: "Qabul qilingan mahsulotlar ro'yxati (Приход)",
    suppliersSub: "Ta'minotchi kompaniyalar ro'yxati",
    ordersSub: 'Snabjenets va kutilayotgan xaridlar',
    monitoring: 'Mijoz Buyurtmalari (Zayavka)',
    monitoringSub: 'Mijozlardan kelgan kunlik zayavkalar svodkasi',
    productionSub: 'Zavod ishlab chiqarish jarayoni',
    shopReport: 'Sex Ishlab Chiqarish Hisoboti',
    shopReportSub: 'Kirim, chiqim va kunlik sex hisobotlari jurnali',
    shopQC: 'Nazoratchi Jurnallari (Sex)',
    dailyChecklist: 'Yagona Kunlik Check-list',
    shopQCSub: 'FSSC 22000, KKT-1 Dez-r, Kalibrovka, Degustatsiya va barcha operatsion jurnallar',
    kitchenSub: 'Xodimlar uchun ovqat pishirishga keladigan mahsulotlar',
    productsSub: 'Mahsulot katalogi va parametrlari',
    reportsSub: "Statistika va tahlil ma'lumotlari",
    usersSub: 'Tizim foydalanuvchilari va ruxsatlar',
    backupSub: "Ma'lumotlar bazasini zaxiralash",
    settingsSub: 'Tizim va shablon sozlamalari',
    chat: 'Xodimlar Chati',
    customTables: 'Dinamik Jadvallar',
    customTablesSub: 'Excel shablonlar va maxsus jadvallar',
    directorSub: 'Zavod monitoringi',
    logisticsSub: 'Yuk tashish va transport logistikasi',
    accountingSub: 'Moliya va hisob-kitoblar',
    hrSub: "Xodimlar va tibbiy daftarchalar",
    securitySub: 'KPP va xavfsizlik nazorati',
    navMain: 'Asosiy',
    navQC: 'Sifat Nazorati (QC)',
    navWarehouse: 'Ombor va Ishlab chiqarish',
    navTrade: "Savdo va Ta'minot",
    navFinance: 'Moliya va HR',
    navSystem: 'Tizim va Boshqaruv',
    price: 'Narxi',
    name: 'Nomi',
    code: 'Kod',
    category: 'Kategoriya',
    unit: 'Birlik',
    tempNorm: 'Harorat norma',
    gost: 'GOST',
    actions: 'Amallar',
    expectedDate: 'Kutilayotgan sana',
    product: 'Mahsulot',
    totalProducts: 'Jami mahsulotlar',
    newProduct: 'Yangi mahsulot',
    actProducts: 'Akt mahsulotlari (Xomashyo)',
    kitchenProducts: 'Oshxona mahsulotlari',
    pending: 'Kutilmoqda',
    delivered: 'Yetkazildi',
    cancelled: 'Rad etildi',
    editOrder: 'Buyurtmani tahrirlash',
    newOrder: 'Yangi buyurtma',
    time: 'Vaqt',
    timePlaceholder: 'M: 08:00 - 13:00',
    select: '— Tanlang —',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    uploadImage: 'Rasm yuklash',
    noOrders: "Hali buyurtmalar yo'q",
    loading: 'Yuklanmoqda...',
    accept: 'Qabul qilish',
    confirmReceiptDesc: "Mahsulot qabul qilinganligini tasdiqlash uchun uning haqiqiy rasmlarini yuklang.",
    clickToUploadImages: 'Rasmlar yuklash uchun bosing',
    productImages: 'Mahsulot rasmlari',
    saving: 'Saqlanmoqda...',
    editProduct: 'Mahsulotni tahrirlash',
    actForRawMaterial: 'Xomashyo akti uchun',
    forKitchen: 'Oshxona uchun',
    defaultPackaging: 'Standart qadoqlash',
    defaultConclusion: 'Standart xulosa',
    minTemp: 'Min harorat (°C)',
    maxTemp: 'Max harorat (°C)',
    filter: 'Filtr',
    all: 'Barchasi',
    export: 'Eksport',
    import: 'Import',
    add: "Qo'shish",
    edit: 'Tahrirlash',
    delete: "O'chirish",
    details: 'Tafsilotlar',
    success: 'Muvaffaqiyatli',
    error: 'Xatolik',
    warning: 'Ogohlantirish',
    info: "Ma'lumot",
    yes: 'Ha',
    no: "Yo'q",
    close: 'Yopish',
    back: 'Orqaga'
  },
  ru: {
    sales: 'Продажи',
    archive: 'Общий Архив',
    dashboard: 'Главная',
    inspections: 'История актов',
    newInspection: 'Новый акт',
    incomingActs: 'Входное сырьё (Акты)',
    disinfectionIncoming: 'Моющие и дезинфицирующие средства',
    orders: 'Заказы',
    production: 'Производство',
    kitchen: 'Кухня персонала',
    surveys: 'Опросы',
    products: 'Продукты',
    suppliers: 'Поставщики',
    supervisors: 'Супервайзеры',
    reports: 'Отчеты',
    users: 'Пользователи',
    backup: 'Резерв. копии',
    settings: 'Настройки',
    warehouse: 'Склад',
    traceability: 'Паспорт',
    arrivals: 'Приходы',
    director: 'Панель Директора',
    hr: 'Отдел кадров',
    logistics: 'Логистика',
    accounting: 'Бухгалтерия',
    security: 'Безопасность',
    logout: 'Выйти',
    search: 'Поиск...',
    admin: 'Администратор',
    active: 'В системе',
    welcome: 'Добро пожаловать!',
    todayIs: 'Сегодня',
    inspectionsRecorded: 'актов входящего сырья зарегистрировано',
    totalInspections: 'Всего актов',
    accepted: 'Принято',
    rejected: 'Отклонено',
    conditional: 'Условно',
    recentInspections: 'Последние акты',
    recentDesc: 'Недавно зарегистрированные акты',
    seeAll: 'Посмотреть все',
    noInspections: 'Пока нет актов',
    createOne: 'Нажмите кнопку выше, чтобы создать новый акт',
    actNumber: 'Номер акта',
    date: 'Дата',
    quantity: 'Кол-во',
    status: 'Статус',
    view: 'Просмотр',
    quickNewAct: 'Новый акт',
    quickNewActDesc: 'Акт входящего сырья',
    quickProd: 'Продукты',
    quickProdDesc: 'Добавить/изменить продукт',
    quickSupp: 'Поставщики',
    quickSuppDesc: 'Данные поставщиков',
    dashboardSub: 'Обзор и статистика',
    ordersSub: 'Ожидаемые закупки (Снабженец)',
    monitoring: 'Заказы клиентов (Сводка)',
    monitoringSub: 'Сводный отчет по заказам клиентов и экспорту',
    productionSub: 'Процесс производства и рецептуры',
    shopReport: 'Производственный отчет ЦЕХ',
    shopReportSub: 'Журнал прихода, расхода и ежедневных отчетов',
    shopQC: 'Журналы Контролера (Цех)',
    dailyChecklist: 'Ежедневный чек-лист',
    shopQCSub: 'Операционные чек-листы: FSSC 22000, ККТ-1 Дезраствор, Калибровка, Дегустация',
    kitchenSub: 'Продукты для питания персонала',
    inspectionsSub: 'Все акты входящего сырья',
    newInspectionSub: 'Акт приемки сырья',
    arrivalsSub: 'Список принятых продуктов (Приход)',
    productsSub: 'Каталог продуктов и параметры',
    suppliersSub: 'Список компаний-поставщиков',
    reportsSub: 'Статистика и аналитика',
    usersSub: 'Пользователи системы и права',
    backupSub: 'Резервное копирование базы данных',
    settingsSub: 'Настройки системы и шаблонов',
    chat: 'Чат сотрудников',
    customTables: 'Динамические таблицы',
    customTablesSub: 'Excel шаблоны и настраиваемые таблицы',
    directorSub: 'Мониторинг завода',
    logisticsSub: 'Грузоперевозки и транспортная логистика',
    accountingSub: 'Финансы и взаиморасчеты',
    hrSub: 'Сотрудники и медицинские книжки',
    securitySub: 'КПП и контроль безопасности',
    navMain: 'Главное',
    navQC: 'Контроль Качества (ОКК)',
    navWarehouse: 'Склад и Производство',
    navTrade: 'Продажи и Снабжение',
    navFinance: 'Финансы и Кадры',
    navSystem: 'Система и Управление',
    price: 'Цена',
    name: 'Наименование',
    code: 'Код',
    category: 'Категория',
    unit: 'Ед. изм.',
    tempNorm: 'Норма темп.',
    gost: 'ГОСТ',
    actions: 'Действия',
    expectedDate: 'Ожидаемая дата',
    product: 'Продукт',
    totalProducts: 'Всего продуктов',
    newProduct: 'Новый продукт',
    actProducts: 'Продукты для актов (Сырье)',
    kitchenProducts: 'Продукты для кухни',
    pending: 'Ожидается',
    delivered: 'Доставлено',
    cancelled: 'Отменено',
    editOrder: 'Редактировать заказ',
    newOrder: 'Новый заказ',
    time: 'Время',
    timePlaceholder: 'Нап: 08:00 - 13:00',
    select: '— Выберите —',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    uploadImage: 'Загрузить фото',
    noOrders: 'Пока нет заказов',
    loading: 'Загрузка...',
    accept: 'Принять',
    confirmReceiptDesc: 'Чтобы подтвердить получение продукта, вы должны загрузить его реальные фотографии. Можно загрузить несколько фотографий.',
    clickToUploadImages: 'Нажмите чтобы загрузить фото',
    productImages: 'Фотографии продукта',
    saving: 'Сохранение...',
    editProduct: 'Редактировать продукт',
    actForRawMaterial: 'Для акта сырья',
    forKitchen: 'Для кухни',
    defaultPackaging: 'Стандартная упаковка',
    defaultConclusion: 'Стандартное заключение',
    minTemp: 'Мин температура (°C)',
    maxTemp: 'Макс температура (°C)',
    filter: 'Фильтр',
    all: 'Все',
    export: 'Экспорт',
    import: 'Импорт',
    add: 'Добавить',
    edit: 'Редактировать',
    delete: 'Удалить',
    details: 'Детали',
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Внимание',
    info: 'Информация',
    yes: 'Да',
    no: 'Нет',
    close: 'Закрыть',
    back: 'Назад'
  },
  en: {
    sales: 'Sales',
    archive: 'Global Archive',
    dashboard: 'Dashboard',
    inspections: 'Act History',
    newInspection: 'New Act',
    incomingActs: 'Incoming Raw Material Acts',
    disinfectionIncoming: 'Disinfection & Detergents',
    orders: 'Orders',
    production: 'Production',
    kitchen: 'Staff Kitchen',
    surveys: 'Surveys',
    products: 'Products',
    suppliers: 'Suppliers',
    supervisors: 'Supervisors',
    reports: 'Reports',
    users: 'Users',
    backup: 'Backup',
    settings: 'Settings',
    warehouse: 'Warehouse',
    traceability: 'Passport',
    arrivals: 'Arrivals',
    director: 'Director Dashboard',
    hr: 'HR',
    logistics: 'Logistics',
    accounting: 'Accounting',
    security: 'Security',
    logout: 'Logout',
    search: 'Search...',
    admin: 'Administrator',
    active: 'Online',
    welcome: 'Welcome!',
    todayIs: 'Today is',
    inspectionsRecorded: 'incoming raw material acts recorded',
    totalInspections: 'Total acts',
    accepted: 'Accepted',
    rejected: 'Rejected',
    conditional: 'Conditional',
    recentInspections: 'Recent acts',
    recentDesc: 'Recently recorded acts',
    seeAll: 'See all',
    noInspections: 'No acts yet',
    createOne: 'Click the button above to create a new act',
    actNumber: 'Act Number',
    date: 'Date',
    quantity: 'Quantity',
    status: 'Status',
    view: 'View',
    quickNewAct: 'New Act',
    quickNewActDesc: 'Incoming raw material act',
    quickProd: 'Products',
    quickProdDesc: 'Add/edit product',
    quickSupp: 'Suppliers',
    quickSuppDesc: 'Supplier information',
    monitoring: 'Client Orders (Monitoring)',
    monitoringSub: 'Pivot table for client orders and export',
    dashboardSub: 'Overview and statistics',
    ordersSub: 'Expected purchases (Supply)',
    productionSub: 'Factory production process and recipes',
    shopReport: 'Shop Production Report',
    shopReportSub: 'Daily incoming, outgoing, and shop report logs',
    shopQC: 'Line Inspector Journals',
    dailyChecklist: 'Daily QC Checklist',
    shopQCSub: 'FSSC 22000, CCP-1 Disinfection, Calibration, Degustation & Shift Logs',
    kitchenSub: 'Food products for staff meals',
    inspectionsSub: 'All incoming raw material acts',
    newInspectionSub: 'Raw material acceptance act',
    arrivalsSub: 'List of accepted products (Arrivals)',
    productsSub: 'Product catalog and parameters',
    suppliersSub: 'List of supplier companies',
    reportsSub: 'Statistics and analytics',
    usersSub: 'System users and permissions',
    backupSub: 'Database backup',
    settingsSub: 'System and template settings',
    chat: 'Staff Chat',
    customTables: 'Custom Tables',
    customTablesSub: 'Excel templates and dynamic tables',
    directorSub: 'Plant monitoring',
    logisticsSub: 'Freight shipping and transport logistics',
    accountingSub: 'Finance and accounting management',
    hrSub: 'Human resources and medical records',
    securitySub: 'Checkpoint and perimeter security',
    navMain: 'Main',
    navQC: 'Quality Control (QC)',
    navWarehouse: 'Warehouse & Production',
    navTrade: 'Sales & Supply',
    navFinance: 'Finance & HR',
    navSystem: 'System & Admin',
    price: 'Price',
    name: 'Name',
    code: 'Code',
    category: 'Category',
    unit: 'Unit',
    tempNorm: 'Temp. Norm',
    gost: 'GOST',
    actions: 'Actions',
    expectedDate: 'Expected Date',
    product: 'Product',
    totalProducts: 'Total products',
    newProduct: 'New Product',
    actProducts: 'Act Products (Raw Materials)',
    kitchenProducts: 'Kitchen Products',
    pending: 'Pending',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    editOrder: 'Edit Order',
    newOrder: 'New Order',
    time: 'Time',
    timePlaceholder: 'Ex: 08:00 - 13:00',
    select: '— Select —',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    uploadImage: 'Upload image',
    noOrders: 'No orders yet',
    loading: 'Loading...',
    accept: 'Accept',
    confirmReceiptDesc: 'To confirm receipt of the product, you must upload actual photos. Multiple photos can be uploaded.',
    clickToUploadImages: 'Click to upload images',
    productImages: 'Product images',
    saving: 'Saving...',
    editProduct: 'Edit product',
    actForRawMaterial: 'For raw material act',
    forKitchen: 'For kitchen',
    defaultPackaging: 'Default packaging',
    defaultConclusion: 'Default conclusion',
    minTemp: 'Min temp (°C)',
    maxTemp: 'Max temp (°C)',
    filter: 'Filter',
    all: 'All',
    export: 'Export',
    import: 'Import',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    details: 'Details',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    back: 'Back'
  }
}

type Translations = typeof translations.uz
type TranslationKey = keyof Translations

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  directorLang: DirectorLanguage
  setDirectorLang: (lang: DirectorLanguage) => void
  t: (key: TranslationKey | string, fallback?: string) => string
  tDirector: (key: TranslationKey | string, fallback?: string) => string
  formatDual: (uz: string, ru: string, en?: string) => string
  formatDirector: (uz: string, ru: string, en?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function combineTexts(text1: string | undefined, text2: string | undefined, fallback: string): string {
  const t1 = (text1 || '').trim()
  const t2 = (text2 || '').trim()
  if (!t1 && !t2) return fallback
  if (t1 && !t2) return t1
  if (!t1 && t2) return t2
  if (t1.toLowerCase() === t2.toLowerCase()) return t1
  return `${t1} / ${t2}`
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('uz')
  const [directorLang, setDirectorLangState] = useState<DirectorLanguage>('uz')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved === 'uz' || saved === 'ru' || saved === 'en') {
      setLangState(saved)
      setDirectorLangState(saved)
      try {
        document.cookie = `language=${saved}; path=/; max-age=31536000; SameSite=Lax`
        document.cookie = `director_lang=${saved}; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {}
    } else if (saved === 'ru_en') {
      setLangState('ru')
      setDirectorLangState('ru')
      localStorage.setItem('language', 'ru')
      localStorage.setItem('director_lang', 'ru')
      try {
        document.cookie = `language=ru; path=/; max-age=31536000; SameSite=Lax`
        document.cookie = `director_lang=ru; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {}
    } else if (saved === 'uz_en') {
      setLangState('en')
      setDirectorLangState('en')
      localStorage.setItem('language', 'en')
      localStorage.setItem('director_lang', 'en')
      try {
        document.cookie = `language=en; path=/; max-age=31536000; SameSite=Lax`
        document.cookie = `director_lang=en; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {}
    } else {
      setLangState('uz')
      setDirectorLangState('uz')
      localStorage.setItem('language', 'uz')
      localStorage.setItem('director_lang', 'uz')
      try {
        document.cookie = `language=uz; path=/; max-age=31536000; SameSite=Lax`
        document.cookie = `director_lang=uz; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {}
    }
  }, [])

  const handleSetLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('language', newLang)
    try {
      document.cookie = `language=${newLang}; path=/; max-age=31536000; SameSite=Lax`
    } catch (e) {}
    if (newLang === 'uz' || newLang === 'ru' || newLang === 'en') {
      setDirectorLangState(newLang)
      localStorage.setItem('director_lang', newLang)
      try {
        document.cookie = `director_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {}
    }
  }

  const setDirectorLang = (newLang: DirectorLanguage) => {
    setDirectorLangState(newLang)
    localStorage.setItem('director_lang', newLang)
    setLangState(newLang)
    localStorage.setItem('language', newLang)
    try {
      document.cookie = `language=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      document.cookie = `director_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
    } catch (e) {}
  }

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const k = key as string
    const fallbackVal = fallback || k

    if (lang === 'ru') {
      return (translations.ru as Record<string, string>)[k] || (translations.uz as Record<string, string>)[k] || fallbackVal
    }

    if (lang === 'en') {
      return (translations.en as Record<string, string>)[k] || (translations.uz as Record<string, string>)[k] || fallbackVal
    }

    if (lang === 'uz') {
      return (translations.uz as Record<string, string>)[k] || fallbackVal
    }

    if (lang === 'uz_ru') {
      const uzVal = (translations.uz as Record<string, string>)[k]
      const ruVal = (translations.ru as Record<string, string>)[k]
      return combineTexts(uzVal, ruVal, fallbackVal)
    }

    if (lang === 'uz_en') {
      const uzVal = (translations.uz as Record<string, string>)[k]
      const enVal = (translations.en as Record<string, string>)[k]
      return combineTexts(uzVal, enVal, fallbackVal)
    }

    if (lang === 'ru_en') {
      const ruVal = (translations.ru as Record<string, string>)[k]
      const enVal = (translations.en as Record<string, string>)[k]
      return combineTexts(ruVal, enVal, fallbackVal)
    }

    return fallbackVal
  }

  const formatDual = (uz: string, ru: string, en?: string): string => {
    const enText = en || ru
    if (lang === 'uz') return uz
    if (lang === 'ru') return ru || uz
    if (lang === 'en') return enText || ru || uz
    if (lang === 'uz_ru') return combineTexts(uz, ru, uz)
    if (lang === 'uz_en') return combineTexts(uz, enText, uz)
    if (lang === 'ru_en') return combineTexts(ru, enText, ru)
    return uz
  }

  const formatDirector = formatDual
  const tDirector = t

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, directorLang, setDirectorLang, t, tDirector, formatDual, formatDirector }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

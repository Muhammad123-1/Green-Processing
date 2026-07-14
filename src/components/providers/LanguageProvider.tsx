'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'uz' | 'ru'

const translations: any = {
  uz: {
    dashboard: 'Bosh sahifa',
    inspections: 'Akt tarixi',
    newInspection: 'Yangi akt',
    orders: 'Buyurtmalar',
    production: 'Oshxona',
    products: 'Mahsulotlar',
    suppliers: "Ta'minotchilar",
    supervisors: 'Nazoratchilar',
    reports: 'Hisobotlar',
    users: 'Foydalanuvchilar',
    backup: 'Zaxira nusxa',
    settings: 'Sozlamalar',
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
    recentDesc: 'Eng so\'nggi qayd etilgan aktlar',
    seeAll: 'Barchasini ko\'rish',
    noInspections: 'Hozircha aktlar yo\'q',
    createOne: 'Yangi akt yaratish uchun yuqoridagi tugmani bosing',
    actNumber: 'Akt raqami',
    date: 'Sana',
    quantity: 'Miqdor',
    status: 'Holat',
    view: 'Ko\'rish',
    quickNewAct: 'Yangi akt',
    quickNewActDesc: 'Kiruvchi xomashyo akti',
    quickProd: 'Mahsulotlar',
    quickProdDesc: 'Mahsulot qo\'shish/tahrirlash',
    quickSupp: 'Ta\'minotchilar',
    quickSuppDesc: 'Ta\'minotchi ma\'lumotlari',
    dashboardSub: 'Umumiy ko\'rinish va statistika',
    inspectionsSub: 'Barcha kiruvchi xomashyo aktlari',
    newInspectionSub: 'Kiruvchi xomashyo qabul akti',
    arrivalsSub: 'Qabul qilingan mahsulotlar ro\'yxati (Приход)',
    suppliersSub: 'Ta\'minotchi kompaniyalar ro\'yxati',
    ordersSub: 'Snabjenets va kutilayotgan xaridlar',
    productionSub: 'Ishlab chiqarishga berilgan mahsulotlar',
    reportsSub: 'Statistika va tahlil ma\'lumotlari',
    usersSub: 'Tizim foydalanuvchilari va ruxsatlar',
    backupSub: 'Ma\'lumotlar bazasini zaxiralash',
    settingsSub: 'Tizim va shablon sozlamalari'
  },
  ru: {
    dashboard: 'Главная',
    inspections: 'История актов',
    newInspection: 'Новый акт',
    orders: 'Заказы',
    production: 'Производство',
    products: 'Продукты',
    suppliers: 'Поставщики',
    supervisors: 'Супервайзеры',
    reports: 'Отчеты',
    users: 'Пользователи',
    backup: 'Резерв. копии',
    settings: 'Настройки',
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
    productionSub: 'Отпущено в производство (Кухня)',
    inspectionsSub: 'Все акты входящего сырья',
    newInspectionSub: 'Акт приемки сырья',
    arrivalsSub: 'Список принятых продуктов (Приход)',
    productsSub: 'Каталог продуктов и параметры',
    suppliersSub: 'Список компаний-поставщиков',
    reportsSub: 'Статистика и аналитика',
    usersSub: 'Пользователи системы и права',
    backupSub: 'Резервное копирование базы данных',
    settingsSub: 'Настройки системы и шаблонов'
  }
}

type Translations = typeof translations.uz
type TranslationKey = keyof Translations

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey | string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('uz')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'uz' || saved === 'ru')) {
      setLang(saved)
    }
  }, [])

  const handleSetLang = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem('language', newLang)
  }

  const t = (key: string) => {
    return translations[lang][key as TranslationKey] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
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

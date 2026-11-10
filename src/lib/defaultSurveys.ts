/**
 * Standard survey templates and default question sets for Green Processing ERP.
 */

export interface SurveyTemplateQuestion {
  orderIndex: number
  groupName?: string | null
  subLabel?: string | null
  questionText: string
  questionType: 'select' | 'text' | 'rating' | 'yesno'
  options?: string[]
  helpText?: string | null
  isRequired?: boolean
}

export interface SurveyTemplateDefinition {
  id: 'hygiene_test' | 'customer_feedback'
  title: string
  description: string
  badge: string
  labelUz: string
  labelRu: string
  questionsCount: number
}

export const SURVEY_TEMPLATES: SurveyTemplateDefinition[] = [
  {
    id: 'hygiene_test',
    title: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    description:
      'ОЦЕНКА ЗНАНИЙ, ПОЛУЧЕННЫХ СОТРУДНИКАМИ ПРИ ПОВЫШЕНИИ КВАЛИФИКАЦИИ. Форма Утвержденная, Приказ 2026г. Вид аттестации: Плановая. ООО «GREEN PROCESSING» (ISO 22000 & GMP)',
    badge: '10 ta savol + Xodim anketasi',
    labelUz: '1-Nazorat testi: Shaxsiy gigiyena va sanitariya (ISO 22000 & GMP — 10 ta savol)',
    labelRu: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1: Личная гигиена и санитария (10 вопросов)',
    questionsCount: 16,
  },
  {
    id: 'customer_feedback',
    title: 'OOO "GREEN PROCESSING" mijozlar qoniqish anketasi',
    description:
      'Iltimos, anketani to\'ldiring, sizning fikringiz biz uchun juda muhim. Ushbu anketa ishlab chiqarilayotgan mahsulotlar sifatini va siz bilan hamkorlikni yaxshilash uchun ishlatiladi.',
    badge: '11 ta savol',
    labelUz: 'Mijozlar mamnuniyati anketasi (Restoran va mijozlar bahosi — 11 ta savol)',
    labelRu: 'Анкета удовлетворенности клиентов (Рестораны и клиенты — 11 вопросов)',
    questionsCount: 11,
  },
]

/**
 * 1. КОНТРОЛЬНЫЙ ВОПРОСНИК №1:
 * Тестовые вопросы по личной гигиене и санитарии (ISO 22000 & GMP).
 * Оценка знаний, полученных сотрудниками при повышении квалификации.
 */
export const DEFAULT_HYGIENE_TEST_QUESTIONS: SurveyTemplateQuestion[] = [
  // I. Информация о сотруднике
  {
    orderIndex: 0,
    groupName: 'I. Информация о сотруднике',
    subLabel: '1',
    questionText: 'ФИО сотрудника:',
    questionType: 'text',
    isRequired: true,
  },
  {
    orderIndex: 1,
    groupName: 'I. Информация о сотруднике',
    subLabel: '2',
    questionText: 'Отдел:',
    questionType: 'text',
    isRequired: true,
  },
  {
    orderIndex: 2,
    groupName: 'I. Информация о сотруднике',
    subLabel: '3',
    questionText: 'Должность:',
    questionType: 'text',
    isRequired: true,
  },
  {
    orderIndex: 3,
    groupName: 'I. Информация о сотруднике',
    subLabel: '4',
    questionText: 'Образование:',
    questionType: 'text',
    isRequired: false,
  },
  {
    orderIndex: 4,
    groupName: 'I. Информация о сотруднике',
    subLabel: '5',
    questionText: 'Стаж работы на предприятии:',
    questionType: 'text',
    isRequired: false,
  },
  {
    orderIndex: 5,
    groupName: 'I. Информация о сотруднике',
    subLabel: '6',
    questionText: 'Сведения об ознакомлении сотрудника с должностными обязанностями:',
    questionType: 'select',
    options: ['Ознакомлен(а) под роспись', 'Не ознакомлен(а)'],
    isRequired: true,
  },

  // II. КОНТРОЛЬНЫЙ ВОПРОСНИК №1: 10 тестовых вопросов
  {
    orderIndex: 6,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№1',
    questionText:
      'Почему хранение, эксплуатация, стирка и дезинфекция специальной одежды (спецодежды) работников производственного цеха являются обязательным требованием стандартов ISO 22000?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Так как специальная одежда может вступать в прямой или косвенный контакт с пищевыми продуктами, ее стирка в домашних условиях строго запрещена, и она подлежит сдаче в специализированную промышленную прачечную при производстве.',
      'В) Даже если внешний вид спецодежды кажется чистым, в целях снижения рисков ее необходимо менять и сдавать в стирку в конце каждой смены или при возникновении загрязнений.',
      'С) Личную одежду и специальную рабочую одежду разрешается вешать рядом на одну вешалку в одном шкафчику в раздевалке, если они не соприкасаются друг с другом.',
      'D) Поскольку при выходе из цеха (в столовую, на улицу или в туалет) рабочий обязан снимать спецодежду или строго соблюдать установленные санитарные правила, сдавать ее в стирку не требуется.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 7,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№2',
    questionText:
      'Укажите и выберите обязательный порядок, который должны соблюдать сотрудники перед входом в производственную зону (цех) для устранения риска «Загрязнение инородным телом» (Foreign Body Contamination) в системе управления безопасностью пищевых продуктов:',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Снять телефоны, часы, все виды ювелирных изделий (кольца, серьги, цепочки), пирсинг и другие мелкие аксессуары и оставить их в личных шкафчиках; а также убедиться, что в карманах одежды нет жвачки, сладостей, сигарет или личных вещей.',
      'В) Ювелирные изделия снимать необязательно, если сверху они плотно заклеены дополнительной медицинской перчаткой или лейкопластырной лентой.',
      'С) Дорогие кольца можно не снимать, достаточно задвинуть их глубже на палец, чтобы они не были заметны при надевании перчаток.',
      'D) Телефоны разрешается проносить в цех, если они переведены в беззвучный режим и используются только в экстренных случаях.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 8,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№3',
    questionText:
      'Какой должна быть рабочая концентрация и регламент применения гипохлорита натрия (хлорки), используемого для дезинфекции поверхностей в зонах переработки свеженарезанных овощей (готовой продукции и сырья)?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Готовится раствор высокой концентрации 5%, наносится на оборудование один раз в неделю и запускается в работу без смывания.',
      'В) Рабочий раствор 0,5% применяется ежедневно перед началом работы, при смене видов продукции в течение смены, в технологических перерывах и при необходимости для обработки поверхностей, после чего в соответствии с требованиями пищевой безопасности тщательно смывается чистой водой и просушивается.',
      'С) Для дезинфекции достаточно только горячей воды, использование химии портит естественный вкус продукта.',
      'D) Хлорный раствор используется только в День санитарной очистки (один раз в месяц), в остальные дни поверхности протираются только сухой тряпкой.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 9,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№4',
    questionText: 'Когда и с какой периодичностью должны заменяться одноразовые перчатки?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Перчатки можно использовать в течение всего дня, пока они не порвутся.',
      'В) Только один раз после обеденного перерыва.',
      'С) Каждые 2–3 часа, либо каждый раз при смене вида продукции, а также при повреждении перчаток.',
      'D) Перчатки надевать необязательно, если у сотрудника чистые руки и он работает только с упакованной готовой продукцией.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 10,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№5',
    questionText:
      'По какой причине работнику цеха строго запрещено жевать жвачку рядом с готовой продукцией, чихать в сторону продукции, работать без маски, нарукавников и фартука?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Эти требования направлены на обеспечение безопасности пищевых продуктов и предотвращают попадание в продукт волос работника, частиц слюны, микробов и других инородных тел.',
      'В) Это мешает работе оборудования и снижает производительность труда работника.',
      'С) Для защиты работников от возникновения аллергии.',
      'D) Запрещено потому, что при работе в цехе без фартука и маски есть вероятность простудиться.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 11,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№6',
    questionText:
      'Как должно осуществляться хранение и транспортировка готовой продукции при ее временном накоплении в межцеховых процессах или передаче на следующий этап?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Насыпается в любые удобные свободные места внутри цеха, прямо на пол или в обычные полиэтиленовые мешки.',
      'В) Хранится и транспортируется исключительно в чистых пластиковых ящиках, предназначенных для пищевых продуктов, легко поддающихся мойке и дезинфекции, установленных на поддонах (паллетах) на высоте не менее 15–20 см от пола, при необходимости накрытых сверху защитной пленкой.',
      'С) Крупные партии продукции можно ссыпать напрямую на бетонную или кафельную поверхность в углу цеха, специально не оборудованную для этого.',
      'D) Готовая продукция может находиться в открытом виде при температуре цеха до суток, с хранением на полу на поддонах в пакетах.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 12,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№7',
    questionText:
      'Какой основной риск возникает, если готовые скоропортящиеся продукты (например, салат «Айсберг») долгое время остаются в цехе в открытом виде или при неправильной температуре, и каково требование в отношении этого?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Никакого риска нет, овощи могут лишь слегка подсохнуть.',
      'В) Происходит бурное размножение патогенных микроорганизмов (включая Listeria monocytogenes, Salmonella), быстрое увядание продукта и его микробиологическая порча; поэтому готовая продукция должна быть немедленно помещена в холодильные камеры (+2°C...+4°C) и не оставляться открытой.',
      'С) Продукция изменит цвет и приобретет более сладкий вкус.',
      'D) Изменяется только внешний вид продукта, но на безопасность пищевых продуктов это не влияет.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 13,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№8',
    questionText:
      'Чем обосновано требование опорожнять и дезинфицировать мусорные пакеты при их заполнении на 2/3 или в конце смены?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Чтобы пакеты не порвались.',
      'В) Чтобы они не мешали передвижению работников.',
      'С) Для предотвращения размножения бактерий, появления неприятных запахов и насекомых, а также обеспечения безопасности продукции.',
      'D) Мусор вовсе не обязательно складывать в пакеты, его можно выбрасывать просто так.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 14,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№9',
    questionText:
      'В какой последовательности должен осуществляться процесс мойки и дезинфекции крупного производственного оборудования (линии резки овощей, робот-куттеры, центрифуги), чтобы это полностью соответствовало правилам GMP (Good Manufacturing Practice)?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) По окончании работы, не отключая от электросети, поверхность оборудования протирается влажной тряпкой.',
      'В) Оборудование полностью отключается от электросети; движущиеся и съемные части (ножи, барабаны, мелкие детали) демонтируются; крупные остатки удаляются сухим способом; моется теплой водой с разрешенным моющим средством; тщательно ополаскивается чистой водой; распыляется дезинфицирующий раствор и полностью высушивается на воздухе до начала следующей смены.',
      'С) Перед началом работы смены оборудование просто ополаскивается холодной водой.',
      'D) Все детали моются в конце недели (в субботу), а в остальные дни на внешнюю поверхность просто разбрызгивается вода.',
    ],
    isRequired: true,
  },
  {
    orderIndex: 15,
    groupName: 'КОНТРОЛЬНЫЙ ВОПРОСНИК №1 блок: Тестовые вопросы по личной гигиене и санитарии',
    subLabel: '№10',
    questionText:
      'Какова главная цель ежедневного проведения обязательного медицинского осмотра сотрудников перед началом работы, проверки рук, ногтей, кожных повреждений и отсутствия украшений с фиксацией в специальном журнале?',
    questionType: 'select',
    helpText: 'Отметьте правильный вариант ответа',
    options: [
      'А) Контроль своевременного прихода работников на работу и укрепление трудовой дисциплины.',
      'В) Защита здоровья потребителей, предотвращение распространения инфекций, передающихся через пищевые продукты, исключение попадания крови или гнойной микрофлоры из открытых ран в продукт, а также гарантированное устранение попадания инородных физических тел (колец, ногтей, волос).',
      'С) Исключительно ведение отчетности для демонстрации органам государственного санитарного надзора при проверках.',
      'D) Обеспечение красивого внешнего вида сотрудников и поддержание имиджа предприятия.',
    ],
    isRequired: true,
  },
]

/**
 * 2. Mijozlar mamnuniyati anketasi (Mijozlar va restoranlar bahosi):
 */
export const DEFAULT_CUSTOMER_SURVEY_QUESTIONS: SurveyTemplateQuestion[] = [
  {
    orderIndex: 0,
    groupName:
      'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    subLabel: 'a)',
    questionText:
      'Yetkazib berilayotgan mahsulot sifati kelishilgan talablarga (harorat, tashqi ko\'rinish, shartnoma shartlariga) mos keladimi?',
    questionType: 'rating',
    options: ['5', '4', '3', '2', '1'],
    isRequired: true,
  },
  {
    orderIndex: 1,
    groupName:
      'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    subLabel: 'b)',
    questionText:
      'So\'rovlaringiz, eslatmalaringiz, e\'tiroz va shikoyatlaringiz bo\'yicha ishlar tezkorlik bilan bajariladimi?',
    questionType: 'rating',
    options: ['5', '4', '3', '2', '1'],
    isRequired: true,
  },
  {
    orderIndex: 2,
    groupName:
      'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    subLabel: 'v)',
    questionText: 'Mahsulotimizning rang va ta\'m ko\'rsatkichlarini qanday baholaysiz?',
    questionType: 'rating',
    options: ['5', '4', '3', '2', '1'],
    isRequired: true,
  },
  {
    orderIndex: 3,
    groupName:
      'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    subLabel: 'g)',
    questionText: 'Mahsulotlar o\'z vaqtida yetkazib berilmoqdami?',
    questionType: 'rating',
    options: ['5', '4', '3', '2', '1'],
    isRequired: true,
  },
  {
    orderIndex: 4,
    groupName:
      'OOO "GREEN PROCESSING" mahsulotlarini yetkazib berish bo\'yicha shartnoma talablari bajarilishini va hamkorlikni 5 ballik shkalada baholang',
    subLabel: 'd)',
    questionText:
      'So\'nggi uch oy ichida tayyor mahsulotda yot jismlar (soch, shisha, plastmassa va hokazo) uchrash holatlari bo\'ldimi?',
    questionType: 'rating',
    options: ['5', '4', '3', '2', '1'],
    isRequired: true,
  },
  {
    orderIndex: 5,
    groupName: 'Iltimos, quyidagi savollarga javob bering:',
    subLabel: 'a)',
    questionText:
      'So\'nggi uch oy davomida amaliyotingizda quyidagi holatlar kuzatildimi: -qutida mahsulot yetishmasligi; -qadoqning shikastlanishi; -pomidorlar ezilgan yoki butun emasligi; -buzilgan mahsulot; -vakuumlanmagan mahsulot; -markirovkasiz mahsulot;',
    questionType: 'yesno',
    helpText: 'Agar Ha bo\'lsa, iltimos batafsil yozing',
    options: ['Ha', "Yo'q"],
    isRequired: true,
  },
  {
    orderIndex: 6,
    groupName: 'Iltimos, quyidagi savollarga javob bering:',
    subLabel: 'b)',
    questionText:
      'So\'nggi uch oy ichida mahsulotlarimiz (piyoz, aysberg, "Koul Slou" salat aralashmasi) nostandart to\'g\'ralish holatlari bo\'ldimi? Agar javob "Ha" bo\'lsa, qachon? Qaysi mahsulot? Va bu haqda kimga xabar berdingiz?',
    questionType: 'yesno',
    helpText: 'Agar Ha bo\'lsa, qachon, qaysi mahsulot va kimga xabar berdingiz?',
    options: ['Ha', "Yo'q"],
    isRequired: true,
  },
  {
    orderIndex: 7,
    groupName: 'Iltimos, quyidagi savollarga javob bering:',
    subLabel: 'v)',
    questionText:
      'Mijozlar tomonidan mahsulotimizga nisbatan shikoyatlar bo\'ldimi? Agar javob "Ha" bo\'lsa, aynan nima bo\'yicha? Qaysi mahsulotga?',
    questionType: 'yesno',
    helpText: 'Agar Ha bo\'lsa, nima bo\'yicha va qaysi mahsulotga?',
    options: ['Ha', "Yo'q"],
    isRequired: true,
  },
  {
    orderIndex: 8,
    groupName: 'Iltimos, quyidagi savollarga javob bering:',
    subLabel: 'g)',
    questionText:
      'So\'nggi paytlarda mahsulot sifati o\'zgardimi? Agar "Ha" bo\'lsa, qachon? Qaysi mahsulot? Yaxshi tarafga yoxud yomon tarafga?',
    questionType: 'yesno',
    helpText: 'Agar Ha bo\'lsa, qachon, qaysi mahsulot, yaxshi yoki yomon tarafga?',
    options: ['Ha', "Yo'q"],
    isRequired: true,
  },
  {
    orderIndex: 9,
    groupName: 'Iltimos, quyidagi savollarga javob bering:',
    subLabel: 'd)',
    questionText:
      'Sizningcha, kompaniyamizdan xarid hajmini oshirishga nima yordam bergan bo\'lar edi:',
    questionType: 'select',
    options: [
      'Assortimentni kengaytirish',
      'Mahsulot miqdori va grammini oshirish',
      'Boshqa (fikringizni yozing)',
    ],
    isRequired: true,
  },
  {
    orderIndex: 10,
    groupName: null,
    subLabel: null,
    questionText: 'Tavsiyalar, e\'tirozlar va shikoyatlar:',
    questionType: 'text',
    isRequired: false,
  },
]

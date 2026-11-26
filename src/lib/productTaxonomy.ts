/**
 * Central Product Taxonomy & Normalization Engine
 * 
 * Maps 79+ heterogeneous 1C / Excel / legacy raw product strings into clean canonical items
 * with full trilingual support (O'zbek, Русский, English) and strict primary vs secondary categorization.
 */

export type ProductCategory = 'PRIMARY' | 'SECONDARY'

export interface ProductMeta {
  canonicalId: string
  uz: string
  ru: string
  en: string
  category: ProductCategory
  unit: 'kg' | 'dona'
  subCategory: 'VEGETABLE' | 'FRUIT' | 'INGREDIENT' | 'CHEMICAL' | 'PACKAGING' | 'HYGIENE' | 'EQUIPMENT'
}

interface TaxonomyRule extends ProductMeta {
  match: RegExp[]
  exclude?: RegExp[]
}

export const TAXONOMY_RULES: TaxonomyRule[] = [
  // =========================================================================
  // 1. PRIMARY PRODUCTS (Asosiy xomashyo va sabzavotlar)
  // =========================================================================
  {
    canonicalId: 'prod_tomato',
    match: [/томат/i, /помидор/i, /pomidor/i, /tomat/i],
    exclude: [/пакет/i],
    uz: 'Tomat',
    ru: 'Томат',
    en: 'Tomato',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_carrot',
    match: [/морковь/i],
    uz: 'Sabzi',
    ru: 'Морковь',
    en: 'Carrot',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_iceberg',
    match: [/айсберг/i, /айзберг/i],
    exclude: [/пакет/i],
    uz: 'Salat Aysberg',
    ru: 'Салат Айсберг',
    en: 'Iceberg Lettuce',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_onion_white',
    match: [/лук.*салат/i, /салат.*лук/i],
    exclude: [/пакет/i],
    uz: 'Oq salat piyozi',
    ru: 'Лук салатный белый',
    en: 'White Salad Onion',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_cabbage_white',
    match: [/капуста.*белокачан/i, /капуста.*белокочан/i],
    uz: 'Oq boshli karam',
    ru: 'Капуста белокочанная',
    en: 'White Cabbage',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_cabbage_red',
    match: [/капуста.*красн/i],
    uz: 'Qizil karam',
    ru: 'Капуста красная',
    en: 'Red Cabbage',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_cucumber',
    match: [/огурц/i],
    uz: 'Bodring',
    ru: 'Огурцы свежие',
    en: 'Fresh Cucumber',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_rucola',
    match: [/руккол/i],
    uz: 'Rukkola',
    ru: 'Руккола',
    en: 'Arugula',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_spinach',
    match: [/шпинат/i],
    uz: 'Shpinat',
    ru: 'Шпинат',
    en: 'Spinach',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_celery',
    match: [/сельдерей/i],
    uz: 'Selderi',
    ru: 'Сельдерей',
    en: 'Celery',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_mint',
    match: [/мята/i],
    uz: 'Yalpiz',
    ru: 'Мята',
    en: 'Mint',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_lemon',
    match: [/лимон/i],
    exclude: [/пакет/i, /кислота/i],
    uz: 'Limon',
    ru: 'Лимон',
    en: 'Lemon',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'FRUIT',
  },
  {
    canonicalId: 'prod_lollo_rosso',
    match: [/lollo rosso/i],
    uz: 'Salat Lollo Rosso',
    ru: 'Салат Лолло Россо',
    en: 'Lollo Rosso Lettuce',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'VEGETABLE',
  },
  {
    canonicalId: 'prod_dates',
    match: [/финики/i],
    uz: 'Mazafati xurmosi',
    ru: 'Финики мазафати',
    en: 'Mazafati Dates',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'FRUIT',
  },
  {
    canonicalId: 'prod_salt',
    match: [/соль.*йод/i, /^туз$/i],
    uz: 'Yodlangan osh tuzi',
    ru: 'Соль поваренная йодированная',
    en: 'Iodized Table Salt',
    category: 'PRIMARY',
    unit: 'kg',
    subCategory: 'INGREDIENT',
  },

  // =========================================================================
  // 2. SECONDARY: Food Additives & Disinfection Chemicals
  // =========================================================================
  {
    canonicalId: 'chem_acetic_acid',
    match: [/уксусн.*кислот/i, /кислота.*уксусн/i],
    uz: 'Sirka kislotasi',
    ru: 'Уксусная кислота',
    en: 'Acetic Acid',
    category: 'SECONDARY',
    unit: 'kg',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_citric_acid',
    match: [/лимонн.*кислот/i],
    uz: 'Limon kislotasi',
    ru: 'Лимонная кислота',
    en: 'Citric Acid',
    category: 'SECONDARY',
    unit: 'kg',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_potassium_sorbate',
    match: [/сорбат.*калия/i],
    uz: 'Kaliy sorbat',
    ru: 'Сорбат калия',
    en: 'Potassium Sorbate',
    category: 'SECONDARY',
    unit: 'kg',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_sodium_benzoate',
    match: [/бензоат.*натрия/i],
    uz: 'Natriy benzoat kukun',
    ru: 'Бензоат натрия порошок',
    en: 'Sodium Benzoate Powder',
    category: 'SECONDARY',
    unit: 'kg',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_sodium_hypochlorite',
    match: [/гипохлорит.*натрия/i],
    uz: 'Natriy gipoxlorit',
    ru: 'Гипохлорит натрия',
    en: 'Sodium Hypochlorite',
    category: 'SECONDARY',
    unit: 'kg',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_suma_bac',
    match: [/suma.*bac/i, /suma.*bak/i],
    uz: 'Suma Bac dezinfeksiya',
    ru: 'Дезинфицирующее средство Suma Bac',
    en: 'Suma Bac Disinfectant',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_alcoplus',
    match: [/alcoplus/i],
    uz: 'Alcopus antiseptik',
    ru: 'Антисептик Alcopus',
    en: 'Alcopus Antiseptic',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'CHEMICAL',
  },
  {
    canonicalId: 'chem_solides',
    match: [/solides/i],
    uz: 'Solides yuvish vositasi',
    ru: 'Моющее средство Solides',
    en: 'Solides Detergent',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'CHEMICAL',
  },

  // =========================================================================
  // 3. SECONDARY: Packaging Materials (Polietilen paketlar, qutilar, stikerlar)
  // =========================================================================
  {
    canonicalId: 'pkg_bag_iceberg',
    match: [/пакет.*ай[зс]берг/i, /ай[зс]берг.*пакет/i],
    uz: 'Aysberg paketlari',
    ru: 'Пакеты для салата Айсберг',
    en: 'Iceberg Lettuce Bags',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_tomato',
    match: [/томат.*пакет/i, /пакет.*томат/i],
    uz: 'Tomat paketlari',
    ru: 'Пакеты для томатов',
    en: 'Tomato Bags',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_onion',
    match: [/пакет.*лук/i, /лук.*пакет/i],
    uz: 'Piyoz paketlari',
    ru: 'Пакеты для лука',
    en: 'Onion Bags',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_lemon',
    match: [/пакет.*лимон/i, /лимон.*пакет/i],
    uz: 'Limon paketlari 30-25',
    ru: 'Пакет для лимона 30-25',
    en: 'Lemon Bags 30-25',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_trash',
    match: [/мус[иы]р.*пакет/i, /мусор.*пакет/i],
    uz: 'Chiqindi paketlari',
    ru: 'Мусорные пакеты',
    en: 'Trash Bags',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_30x35',
    match: [/30[хx\*]35/i, /30-35/i],
    uz: 'Paketlar 30x35',
    ru: 'Пакеты полиэтиленовые вакуум 30х35',
    en: 'Plastic Bags 30x35',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_bag_30x30',
    match: [/30[хx\*]30/i],
    uz: 'Paketlar 30x30',
    ru: 'Пакеты полиэтиленовые 30х30',
    en: 'Plastic Bags 30x30',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_stretch_film',
    match: [/стр[ие]й?ч/i, /стрейч/i],
    uz: 'Streych plyonka',
    ru: 'Стрейч-пленка',
    en: 'Stretch Film',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_box_corrugated',
    match: [/гофр.*к[ао]робк/i, /^karobka$/i, /к[ао]робка/i],
    uz: 'Gofra karton quti',
    ru: 'Гофрокоробка картонная',
    en: 'Corrugated Box',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },
  {
    canonicalId: 'pkg_sticker_labels',
    match: [/этикетк.*стикер/i, /стикер/i, /этикетк/i],
    uz: 'Stiker va yorliqlar',
    ru: 'Этикетки-Стикеры',
    en: 'Labels & Stickers',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'PACKAGING',
  },

  // =========================================================================
  // 4. SECONDARY: Sanitation, Uniforms & Hygiene
  // =========================================================================
  {
    canonicalId: 'hyg_gloves_l',
    match: [/перчатк.*(?:размер\s*|\()[lл]/i],
    uz: "Ko'k nitril qo'lqoplar (L)",
    ru: 'Перчатки нитриловые синие (L)',
    en: 'Nitrile Gloves Blue (L)',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_gloves_m',
    match: [/перчатк.*(?:размер\s*|\()[mм]/i],
    uz: "Ko'k nitril qo'lqoplar (M)",
    ru: 'Перчатки нитриловые синие (M)',
    en: 'Nitrile Gloves Blue (M)',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_cap_white',
    match: [/шапк.*бел/i],
    uz: 'Bir martalik oq shapka',
    ru: 'Шапочка одноразовая белая',
    en: 'Disposable White Cap',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_cap_green',
    match: [/шапк.*зел/i],
    uz: 'Bir martalik yashil shapka',
    ru: 'Шапочка одноразовая зеленая',
    en: 'Disposable Green Cap',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_mask',
    match: [/маска/i],
    uz: 'Gigiyenik tibbiy niqob',
    ru: 'Маска гигиеническая',
    en: 'Hygienic Medical Mask',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_coat',
    match: [/халат/i],
    uz: 'Tibbiy xalat',
    ru: 'Халат медицинский',
    en: 'Medical Coat',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_shoe_covers',
    match: [/бахил/i],
    uz: "Ko'k baxila",
    ru: 'Бахилы синие',
    en: 'Blue Shoe Covers',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_oversleeves_black',
    match: [/рукавадник.*(к,ора|кора|черн)/i],
    uz: 'Qora yenglik',
    ru: 'Нарукавники черные',
    en: 'Black Oversleeves',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_oversleeves_white',
    match: [/рукавадник.*(ок|бел)/i],
    uz: 'Oq yenglik',
    ru: 'Нарукавники белые',
    en: 'White Oversleeves',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_napkins',
    match: [/салфетк.*столов/i, /салфетк.*selen/i],
    uz: 'Oshxona salfetkalari',
    ru: 'Салфетки бумажные столовые',
    en: 'Table Paper Napkins',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_paper_towels',
    match: [/полотенц.*бумажн/i],
    uz: "Qog'oz sochiqlar SELEN",
    ru: 'Полотенца бумажные SELEN',
    en: 'Paper Towels SELEN',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },
  {
    canonicalId: 'hyg_toilet_paper',
    match: [/туалетн.*бумаг/i],
    uz: 'Hojatxona qog`ozi SELEN',
    ru: 'Туалетная бумага SELEN',
    en: 'Toilet Paper SELEN',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'HYGIENE',
  },

  // =========================================================================
  // 5. SECONDARY: Crates, Pallets, Equipment & Supplies
  // =========================================================================
  {
    canonicalId: 'eq_pallet',
    match: [/падон/i, /поддон/i],
    uz: "Yog'och poddon",
    ru: 'Деревянный поддон',
    en: 'Wooden Pallet',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'EQUIPMENT',
  },
  {
    canonicalId: 'eq_crate_250',
    match: [/яшик.*250/i],
    uz: 'Plastik yashik 600x400x250',
    ru: 'Ящик пластиковый 600х400х250',
    en: 'Plastic Crate 600x400x250',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'EQUIPMENT',
  },
  {
    canonicalId: 'eq_crate_200',
    match: [/яшик.*200/i],
    uz: 'Plastik yashik 600x400x200',
    ru: 'Ящик пластиковый 600х400х200',
    en: 'Plastic Crate 600x400x200',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'EQUIPMENT',
  },
  {
    canonicalId: 'eq_chair',
    match: [/стул/i],
    uz: 'Plastik stul',
    ru: 'Стул пластиковый',
    en: 'Plastic Chair',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'EQUIPMENT',
  },
  {
    canonicalId: 'eq_water',
    match: [/вода.*питьев/i, /famiy/i],
    uz: 'Ichimlik suvi Famiy',
    ru: 'Питьевая вода Famiy',
    en: 'Drinking Water Famiy',
    category: 'SECONDARY',
    unit: 'dona',
    subCategory: 'EQUIPMENT',
  },
]

/**
 * Resolves any raw product name into its canonical ProductMeta.
 * Fallback generates a clean item if unmatched.
 */
export function resolveProductMeta(rawName?: string): ProductMeta {
  const clean = (rawName || '').trim()
  if (!clean) {
    return {
      canonicalId: 'unknown',
      uz: "Noma'lum mahsulot",
      ru: 'Неизвестный продукт',
      en: 'Unknown product',
      category: 'SECONDARY',
      unit: 'kg',
      subCategory: 'INGREDIENT',
    }
  }

  for (const rule of TAXONOMY_RULES) {
    if (rule.exclude && rule.exclude.some((rx) => rx.test(clean))) continue
    if (rule.match.some((rx) => rx.test(clean))) {
      return {
        canonicalId: rule.canonicalId,
        uz: rule.uz,
        ru: rule.ru,
        en: rule.en,
        category: rule.category,
        unit: rule.unit,
        subCategory: rule.subCategory,
      }
    }
  }

  // Fallback for new unclassified items
  const isDona = clean.toLowerCase().includes('пакет') ||
    clean.toLowerCase().includes('коробк') ||
    clean.toLowerCase().includes('ящик') ||
    clean.toLowerCase().includes('перчатк')

  return {
    canonicalId: `custom_${clean.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '_')}`,
    uz: clean,
    ru: clean,
    en: clean,
    category: isDona ? 'SECONDARY' : 'PRIMARY',
    unit: isDona ? 'dona' : 'kg',
    subCategory: isDona ? 'PACKAGING' : 'VEGETABLE',
  }
}

/**
 * Get localized name for a product based on current user language ('uz' | 'ru' | 'en')
 */
export function getLocalizedName(rawName?: string, lang: string = 'uz'): string {
  const meta = resolveProductMeta(rawName)
  if (lang === 'ru') return meta.ru
  if (lang === 'en') return meta.en
  return meta.uz
}

/**
 * Get trilingual representations:
 * - primary: name in requested language
 * - secondary: subtitle showing the other two languages (e.g. "Морковь • Carrot")
 * - badgeLabel: "Asosiy xomashyo" or "Ikkilamchi vosita"
 */
export function getTrilingualInfo(rawName?: string, lang: string = 'uz') {
  const meta = resolveProductMeta(rawName)
  const isUz = lang === 'uz'
  const isRu = lang === 'ru'
  const isEn = lang === 'en'

  let primary = meta.uz
  if (isRu) {
    primary = meta.ru
  } else if (isEn) {
    primary = meta.en
  }

  // Deduplicate and filter out primary to avoid repetitive subtitles like "Tomat • Tomat"
  const others = Array.from(new Set([meta.uz, meta.ru, meta.en].filter((s) => Boolean(s) && s !== primary)))
  const secondary = others.join(' • ')

  const categoryLabel =
    meta.category === 'PRIMARY'
      ? isRu ? 'Основное сырье' : isEn ? 'Primary Raw Material' : 'Asosiy xomashyo'
      : isRu ? 'Вторичные материалы / тара' : isEn ? 'Secondary Products' : 'Ikkilamchi mahsulotlar'

  return {
    meta,
    primary,
    secondary,
    categoryLabel,
  }
}

/**
 * Formats a clean product name strictly matching the active language (UZ, RU, EN).
 * User requirement: "faqat o'zbekcha yoki faqat ruscha yoki faqat inglizcha bo'lishi kerak".
 */
export function formatTrilingualProductName(meta: ProductMeta, lang: string = 'uz'): string {
  if (lang === 'ru') return meta.ru || meta.uz || meta.en
  if (lang === 'en') return meta.en || meta.uz || meta.ru
  return meta.uz || meta.ru || meta.en
}

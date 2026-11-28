/**
 * Canonical product name translations (Uzbek / Russian / English).
 * Ensures that if the site language is Uzbek, all product names, raw materials,
 * packaging, and consumables are displayed cleanly in Uzbek.
 */

const EXACT_TRANSLATIONS: Record<string, { uz: string; en: string }> = {
  // Raw materials
  'томат': { uz: 'Pomidor (Tomat)', en: 'Tomato' },
  'томаты': { uz: 'Pomidor (Tomat)', en: 'Tomato' },
  'томаты (помидор)': { uz: 'Pomidor (Tomat)', en: 'Tomato' },
  'помидор': { uz: 'Pomidor', en: 'Tomato' },
  'салат айсберг': { uz: 'Aysberg salati', en: 'Iceberg Lettuce' },
  'айсберг': { uz: 'Aysberg salati', en: 'Iceberg Lettuce' },
  'айзберг': { uz: 'Aysberg salati', en: 'Iceberg Lettuce' },
  'айсберг (листовой)': { uz: 'Aysberg (Bargli)', en: 'Leaf Iceberg' },
  'капуста белокочанная': { uz: 'Oq karam', en: 'White Cabbage' },
  'капуста': { uz: 'Oq karam', en: 'Cabbage' },
  'капуста красная': { uz: 'Qizil karam', en: 'Red Cabbage' },
  'красная капуста': { uz: 'Qizil karam', en: 'Red Cabbage' },
  'лук белый салатный': { uz: 'Oq piyoz (Salatbop)', en: 'White Salad Onion' },
  'лук салатный белый': { uz: 'Oq piyoz (Salatbop)', en: 'White Salad Onion' },
  'лук белый': { uz: 'Oq piyoz', en: 'White Onion' },
  'лук': { uz: 'Piyoz', en: 'Onion' },
  'морковь свежая': { uz: 'Sabzi (Yangi)', en: 'Fresh Carrot' },
  'морковь': { uz: 'Sabzi', en: 'Carrot' },
  'морков': { uz: 'Sabzi', en: 'Carrot' },
  'огурцы свежие': { uz: 'Yangi bodring', en: 'Fresh Cucumber' },
  'огурцы': { uz: 'Bodring', en: 'Cucumber' },
  'огурец': { uz: 'Bodring', en: 'Cucumber' },
  'лимон свежий': { uz: 'Yangi limon', en: 'Fresh Lemon' },
  'лимон': { uz: 'Limon', en: 'Lemon' },
  'соль йодированная': { uz: 'Yodlangan tuz', en: 'Iodized Salt' },
  'соль': { uz: 'Tuz', en: 'Salt' },
  'туз': { uz: 'Yodlangan tuz', en: 'Salt' },
  'финики мазафати': { uz: 'Mazafati xurmosi', en: 'Mazafati Dates' },
  'чеснок': { uz: 'Sarimsoqpiyoz', en: 'Garlic' },
  'укроп': { uz: 'Shivit (Ukrop)', en: 'Dill' },
  'петрушка': { uz: 'Petrushka', en: 'Parsley' },
  'кинза': { uz: 'Kashnich (Kinzasi)', en: 'Coriander' },
  'перец': { uz: 'Qalampir (Garmdori)', en: 'Pepper' },
  'баклажан': { uz: 'Baqlajon', en: 'Eggplant' },

  // Packaging & Consumables
  'этикетки-стикер': { uz: 'Yorliqlar (Stikerlar)', en: 'Label Stickers' },
  'этикетка': { uz: 'Yorliq (Stiker)', en: 'Label' },
  'этикетки': { uz: 'Yorliqlar (Stikerlar)', en: 'Labels' },
  'гофра каrobka': { uz: 'Gofra quti (Karobka)', en: 'Corrugated Box' },
  'гофра каробка': { uz: 'Gofra quti (Karobka)', en: 'Corrugated Box' },
  'гофрокоробка': { uz: 'Gofra quti (Karobka)', en: 'Corrugated Box' },
  'коробка': { uz: 'Quti (Karobka)', en: 'Box' },
  'яшик': { uz: 'Yashik', en: 'Crate' },
  'яшик кр 600х400х200см20': { uz: 'Yashik qizil 600x400x200', en: 'Crate red 600x400x200' },
  'яшик 600х400х250см25': { uz: 'Yashik 600x400x250', en: 'Crate 600x400x250' },
  'падон': { uz: 'Poddon (Taglik)', en: 'Pallet' },
  'поддон': { uz: 'Poddon (Taglik)', en: 'Pallet' },
  'паллет': { uz: 'Palet (Poddon)', en: 'Pallet' },
  'мусир пакет': { uz: 'Chiqindi paketi', en: 'Trash Bag' },
  'мусорный пакет': { uz: 'Chiqindi paketi', en: 'Trash Bag' },
  'пакет лимон 30-25': { uz: 'Limon uchun paket 30-25', en: 'Lemon Bag 30-25' },
  'полиэтиленовые пакеты для айзберг 30-35': { uz: 'Aysberg uchun polietilen paket 30-35', en: 'Iceberg Poly Bag 30-35' },
  'полиэтиленовые пакеты для томатов': { uz: 'Pomidor uchun polietilen paket', en: 'Tomato Poly Bag' },
  'стрич': { uz: 'Streych plyonka', en: 'Stretch Film' },
  'стрейч': { uz: 'Streych plyonka', en: 'Stretch Film' },
  'скотч': { uz: 'Skotch', en: 'Adhesive Tape' },

  // Chemicals
  'гипохлорит натрия': { uz: 'Natriy gipoxlorit', en: 'Sodium Hypochlorite' },
  'бензоат натрия порошок': { uz: 'Natriy benzoat kukuni', en: 'Sodium Benzoate Powder' },
  'бензоат натрия': { uz: 'Natriy benzoat', en: 'Sodium Benzoate' },
  'сорбат калия': { uz: 'Kaliy sorbat', en: 'Potassium Sorbate' },
  'лимонная кислота': { uz: 'Limon kislotasi', en: 'Citric Acid' },
  'suma bac': { uz: 'SUMA BAC (Dezinfeksiya vositasi)', en: 'SUMA BAC (Disinfectant)' },
  'alcoplus': { uz: 'AlcoPlus (Spirtli antiseptik)', en: 'AlcoPlus (Antiseptic)' },

  // Hygiene & Household
  'перчатки неопудренные, размер l, синие': { uz: "Kukunsiz qo'lqoplar (L, ko'k)", en: 'Nitrile Gloves Powder-Free L Blue' },
  'перчатки неопудренные, размер м, синие': { uz: "Kukunsiz qo'lqoplar (M, ko'k)", en: 'Nitrile Gloves Powder-Free M Blue' },
  'перчатка (л) синий': { uz: "Qo'lqop (L, ko'k)", en: 'Gloves L Blue' },
  'перчатка (м) синий': { uz: "Qo'lqop (M, ko'k)", en: 'Gloves M Blue' },
  'перчатки': { uz: "Bir martalik qo'lqoplar", en: 'Disposable Gloves' },
  'полотенца бумажные "selen " 30/2': { uz: '"SELEN" qog\'oz sochiqlari 30/2', en: '"SELEN" Paper Towels 30/2' },
  'полотенца бумажные для диспенсера 200': { uz: 'Dispenser uchun qog\'oz sochiqlar 200', en: 'Dispenser Paper Towels 200' },
  'полотенца бумажные': { uz: "Qog'oz sochiqlar", en: 'Paper Towels' },
  'туалетная бумага "selen" 64/8': { uz: '"SELEN" tualet qog\'ozi 64/8', en: '"SELEN" Toilet Paper 64/8' },
  'туалетная бумага': { uz: 'Tualet qog\'ozi', en: 'Toilet Paper' },
  'салфетки бумажные selen ( столовые 100)': { uz: 'SELEN qog\'oz salfetkasi (100 dona)', en: 'SELEN Napkins 100pcs' },
  'салфетки бумажные столовые': { uz: 'Oshxona qog\'oz salfetkalari', en: 'Table Napkins' },
  'салфетки бумажные': { uz: 'Qog\'oz salfetkalar', en: 'Paper Napkins' },
  'шапка однаразовая белая': { uz: 'Bir martalik qalpoqcha (oq)', en: 'Disposable Cap White' },
  'шапка однаразви белые': { uz: 'Bir martalik qalpoqcha (oq)', en: 'Disposable Cap White' },
  'шапка однаразви белый': { uz: 'Bir martalik qalpoqcha (oq)', en: 'Disposable Cap White' },
  'шапка однаразви зелёный': { uz: 'Bir martalik qalpoqcha (yashil)', en: 'Disposable Cap Green' },
  'халат медецинский nest-gowen': { uz: 'Tibbiy xalat NEST-GOWEN', en: 'Medical Gown NEST-GOWEN' },
  'халат медицинский': { uz: 'Tibbiy xalat', en: 'Medical Gown' },
  'маска гигиеническая clean 25 белый': { uz: 'Gigiyenik niqob (oq)', en: 'Hygienic Mask White' },
  'маска гигиеническая син 1 шт': { uz: 'Gigiyenik niqob (ko\'k)', en: 'Hygienic Mask Blue' },
  'маска гигиеническая': { uz: 'Gigiyenik niqob', en: 'Hygienic Mask' },
  'рукавадник к,ора': { uz: 'Yenglik (Qora)', en: 'Arm Sleeves Black' },
  'рукавадник кора': { uz: 'Yenglik (Qora)', en: 'Arm Sleeves Black' },
  'рукавадник ок,': { uz: 'Yenglik (Oq)', en: 'Arm Sleeves White' },
  'рукавадник ок': { uz: 'Yenglik (Oq)', en: 'Arm Sleeves White' },
  'бахила синий': { uz: 'Baxila (ko\'k)', en: 'Shoe Covers Blue' },
  'бахилы': { uz: 'Baxila', en: 'Shoe Covers' },
  'стул пластмас': { uz: 'Plastmassa stul', en: 'Plastic Chair' },
  'вода питьевая негазированная famiy': { uz: 'Gazsiz ichimlik suvi "Famiy"', en: 'Drinking Water "Famiy"' },
  'вода питьевая': { uz: 'Ichimlik suvi', en: 'Drinking Water' },
}

/**
 * Returns the translated product name based on current language.
 * Default is Uzbek.
 */
export function getProductName(rawName?: string | null, lang: string = 'uz'): string {
  if (!rawName) return ''
  const trimmed = rawName.trim()
  if (!trimmed) return ''

  if (lang === 'ru') return trimmed

  const lower = trimmed.toLowerCase()

  // 1. Exact dictionary match
  if (EXACT_TRANSLATIONS[lower]) {
    return lang === 'en' ? EXACT_TRANSLATIONS[lower].en : EXACT_TRANSLATIONS[lower].uz
  }

  // 2. Smart rule-based / keyword match
  if (lower.includes('айсберг') || lower.includes('айзберг') || lower.includes('aysberg') || lower.includes('ayzberg')) {
    if (lower.includes('листов') || lower.includes('bargli')) return lang === 'en' ? 'Leaf Iceberg' : 'Aysberg (Bargli)'
    if (lower.includes('пакет')) return lang === 'en' ? 'Iceberg Poly Bag' : 'Aysberg uchun polietilen paket'
    return lang === 'en' ? 'Iceberg Lettuce' : 'Aysberg salati'
  }

  if (lower.includes('томат') || lower.includes('помидор')) {
    if (lower.includes('пакет')) return lang === 'en' ? 'Tomato Poly Bag' : 'Pomidor uchun polietilen paket'
    return lang === 'en' ? 'Tomato' : 'Pomidor (Tomat)'
  }

  if (lower.includes('капуст') || lower.includes('карам')) {
    if (lower.includes('красн') || lower.includes('qizil')) return lang === 'en' ? 'Red Cabbage' : 'Qizil karam'
    return lang === 'en' ? 'White Cabbage' : 'Oq karam'
  }

  if (lower.includes('морков') || lower.includes('сабзи')) {
    return lang === 'en' ? 'Fresh Carrot' : 'Sabzi'
  }

  if (lower.includes('лук') || lower.includes('пиёз')) {
    if (lower.includes('бел') || lower.includes('oq') || lower.includes('салат')) return lang === 'en' ? 'White Salad Onion' : 'Oq piyoz (Salatbop)'
    return lang === 'en' ? 'Onion' : 'Piyoz'
  }

  if (lower.includes('огурц') || lower.includes('бодринг')) {
    return lang === 'en' ? 'Fresh Cucumber' : 'Yangi bodring'
  }

  if (lower.includes('лимон')) {
    if (lower.includes('кислот')) return lang === 'en' ? 'Citric Acid' : 'Limon kislotasi'
    if (lower.includes('пакет')) return lang === 'en' ? 'Lemon Bag' : 'Limon uchun paket'
    return lang === 'en' ? 'Lemon' : 'Limon'
  }

  if (lower.includes('этикетк') || lower.includes('стикер')) {
    return lang === 'en' ? 'Label Stickers' : 'Yorliqlar (Stikerlar)'
  }

  if (lower.includes('короб') || lower.includes('кароб') || lower.includes('гофр')) {
    return lang === 'en' ? 'Corrugated Box' : 'Gofra quti (Karobka)'
  }

  if (lower.includes('перчатк')) {
    if (lower.includes(' l') || lower.includes('(л)')) return lang === 'en' ? 'Gloves L' : "Qo'lqop (L)"
    if (lower.includes(' m') || lower.includes('(м)')) return lang === 'en' ? 'Gloves M' : "Qo'lqop (M)"
    return lang === 'en' ? 'Gloves' : "Qo'lqoplar"
  }

  if (lower.includes('пакет')) {
    if (lower.includes('мусор') || lower.includes('мусир')) return lang === 'en' ? 'Trash Bag' : 'Chiqindi paketi'
    return lang === 'en' ? 'Poly Bag' : 'Polietilen paket'
  }

  if (lower.includes('шапк')) {
    return lang === 'en' ? 'Disposable Cap' : 'Bir martalik qalpoqcha'
  }

  if (lower.includes('халат')) {
    return lang === 'en' ? 'Medical Gown' : 'Tibbiy xalat'
  }

  if (lower.includes('маск')) {
    return lang === 'en' ? 'Hygienic Mask' : 'Gigiyenik niqob'
  }

  if (lower.includes('бахил')) {
    return lang === 'en' ? 'Shoe Covers' : 'Baxila'
  }

  if (lower.includes('яшик')) {
    return lang === 'en' ? 'Crate' : 'Yashik'
  }

  if (lower.includes('падон') || lower.includes('поддон')) {
    return lang === 'en' ? 'Pallet' : 'Poddon (Taglik)'
  }

  if (lower.includes('полотенц')) {
    return lang === 'en' ? 'Paper Towels' : "Qog'oz sochiqlar"
  }

  if (lower.includes('салфетк')) {
    return lang === 'en' ? 'Paper Napkins' : "Qog'oz salfetkalar"
  }

  if (lower.includes('туалетн') && lower.includes('бумаг')) {
    return lang === 'en' ? 'Toilet Paper' : "Tualet qog'ozi"
  }

  if (lower.includes('гипохлорит')) {
    return lang === 'en' ? 'Sodium Hypochlorite' : 'Natriy gipoxlorit'
  }

  if (lower.includes('бензоат')) {
    return lang === 'en' ? 'Sodium Benzoate' : 'Natriy benzoat'
  }

  if (lower.includes('сорбат')) {
    return lang === 'en' ? 'Potassium Sorbate' : 'Kaliy sorbat'
  }

  if (lower.includes('соль') || lower.includes('туз')) {
    return lang === 'en' ? 'Iodized Salt' : 'Yodlangan tuz'
  }

  if (lower.includes('чеснок')) return lang === 'en' ? 'Garlic' : 'Sarimsoqpiyoz'
  if (lower.includes('укроп')) return lang === 'en' ? 'Dill' : 'Shivit (Ukrop)'
  if (lower.includes('петрушк')) return lang === 'en' ? 'Parsley' : 'Petrushka'
  if (lower.includes('кинз')) return lang === 'en' ? 'Coriander' : 'Kashnich'
  if (lower.includes('перец')) return lang === 'en' ? 'Pepper' : 'Qalampir'
  if (lower.includes('баклажан')) return lang === 'en' ? 'Eggplant' : 'Baqlajon'

  return trimmed
}

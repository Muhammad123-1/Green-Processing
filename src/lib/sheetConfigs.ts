export interface CustomField {
  col: number;
  key: string;
  label: string;
  default: string;
}

export interface SheetConfig {
  standardFields: Record<number, string>;
  customFields: CustomField[];
}

export const SHEET_CONFIGS: Record<string, SheetConfig> = {
  'САЛАТ АЙСБЕРГ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectActNumber', 24: 'rejectDate', 25: 'inspector'
    },
    customFields: [
      { col: 8, key: 'struktura', label: 'Tuzilishi', default: 'Листья салата плотные, сочные с хрустящей структурой' },
      { col: 9, key: 'rangi', label: 'Rangi', default: 'От светло-желтого до светло-зеленого и насыщенно-зеленого' },
      { col: 10, key: 'tam', label: 'Ta\'m va hid', default: 'Вкус, запах свежий, свойственный данному сорту' },
      { col: 11, key: 'oksidlanish', label: 'Ichki oksidlanish', default: 'Отсутствует' },
      { col: 12, key: 'hasharot', label: 'Hasharotlar izi', default: 'Отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Kasallik va chirish', default: 'Отсутствует' },
      { col: 14, key: 'ozagi', label: 'O\'zagi', default: 'В разрезе кочерыжка ровная, не более 3 см' },
      { col: 15, key: 'zichligi', label: 'Ichki zichligi', default: 'Средней плотности' },
      { col: 16, key: 'olchami', label: 'O\'lchami', default: 'Диаметр не менее 12 см' },
      { col: 17, key: 'qoplovchi', label: 'Qoplovchi barglari', default: 'Удалены' },
      { col: 18, key: 'shikastlanish', label: 'Mexanik shikastlanish', default: 'Отсутствует' }
    ]
  },
  'ТОМАТ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectActNumber', 24: 'rejectDate', 25: 'inspector'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Tuzilishi', default: 'Томаты упругие, неперезрелые, сочные' },
      { col: 9, key: 'rangi', label: 'Rangi', default: 'Цвет светло-красный и красный' },
      { col: 10, key: 'tam', label: 'Ta\'m va hid', default: 'Вкус, запах свежий' },
      { col: 11, key: 'olchami', label: 'O\'lchami', default: 'От 6,0 до 7,0 см' },
      { col: 12, key: 'hasharot', label: 'Hasharotlar izi', default: 'Отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Chirish va shilimshiq', default: 'Отсутствует' },
      { col: 14, key: 'ezilgan', label: 'Ezilganlik (pachoq)', default: 'Отсутствует' },
      { col: 15, key: 'bitgan_yoriq', label: 'Bitib ketgan yoriqlar', default: 'Отсутствует' },
      { col: 16, key: 'yoriqlar', label: 'Yoriqlar', default: 'Отсутствует' },
      { col: 17, key: 'qadoqlash', label: 'Bir qator joylanganmi', default: 'Да' },
      { col: 18, key: 'shikastlanish', label: 'Mexanik shikastlanish', default: 'Отсутствует' }
    ]
  },
  'ЛУК БЕЛЫЙ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 18: 'batchNumber', 19: 'statusText',
      20: 'quantitySklad', 21: 'quantityTseh', 22: 'rejectActNumber', 23: 'rejectDate', 24: 'inspector'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: хрустящий, крепкий...', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет: однородный, белый, светло зеленый', default: 'соответствует' },
      { col: 10, key: 'tam', label: 'Вкус, запах: свежий, свойственный сорту', default: 'да' },
      { col: 11, key: 'olchami', label: 'Размер плодов от 5,0 до 6,0 см', default: 'да' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные места', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль...', default: 'нет' },
      { col: 14, key: 'qora_doglar', label: 'Луковицы с черными пятнами', default: 'нет' },
      { col: 15, key: 'yalangochlangan', label: 'Оголенные от верхних чешуй', default: 'нет' },
      { col: 16, key: 'okargan', label: 'Открывшаяся луковица (стрелка)', default: 'нет' },
      { col: 17, key: 'qoshaloq', label: 'Двойные луковицы', default: 'не обнаружено' },
      { col: 18, key: 'shikastlanish', label: 'Механические повреждения', default: 'нет' }
    ]
  },
  'КАПУСТА БЕЛОКОЧАННАЯ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 18: 'batchNumber', 19: 'statusText',
      20: 'quantitySklad', 21: 'quantityTseh', 22: 'rejectActNumber', 23: 'rejectDate', 24: 'inspector'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: сочная, плотная', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет: от белого до светло-зеленого', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах: свежий, свойственный сорту', default: 'да' },
      { col: 11, key: 'tozalangan', label: 'Зачистка кочана: зачищены до плотно облегающих листьев', default: 'да' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные места', default: 'отсутствует' },
      { col: 13, key: 'kesilganda_struktura', label: 'В разрезе: структура плотная, без полостей', default: 'да' },
      { col: 14, key: 'eski_yoki_osgan', label: 'Капуста старая с желтыми листьями или Проросшая', default: 'нет' },
      { col: 15, key: 'kesilganda_zichlik', label: 'В разрезе плотность средней плотности', default: 'да' },
      { col: 16, key: 'vazni', label: 'Масса кочана', default: 'соответствует' },
      { col: 17, key: 'zichligi', label: 'Плотность кочана: плотные или менее плотные', default: 'да' },
      { col: 18, key: 'shikastlanish', label: 'Механические повреждения', default: 'нет' }
    ]
  },
  'МОРКОВЬ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 18: 'batchNumber', 19: 'statusText',
      20: 'quantitySklad', 21: 'quantityTseh', 22: 'rejectActNumber', 23: 'rejectDate', 24: 'inspector'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: мякоть плотная, хрустящая', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет: оранжевая или желтая', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах: свежий', default: 'да' },
      { col: 11, key: 'soligan', label: 'Морковь увядшая, морщинистая, запаренная', default: 'отсутствует' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные места', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль, грязь...', default: 'нет' },
      { col: 14, key: 'olchami', label: 'Размер по наибольшему диаметру 3-4 см, длина средняя', default: 'да' },
      { col: 15, key: 'xunuk', label: 'Наличие «уродливых» плодов', default: 'не имеется' },
      { col: 16, key: 'kesilganda_struktura', label: 'В разрезе: структура плотная, мякоть не повреждена', default: 'да' },
      { col: 17, key: 'yoriq', label: 'Треснутая с открытой сердцевиной', default: 'не имеется' },
      { col: 18, key: 'shikastlanish', label: 'Механические повреждения', default: 'нет' }
    ]
  },
  'ЛИМОН': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 8: 'batchNumber', 9: 'statusText',
      10: 'quantitySklad', 11: 'rejectActNumber', 12: 'inspector'
    },
    customFields: []
  },
  'ГОФРОЯЩИК': {
    standardFields: {
      1: 'date', 2: 'auto-number', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'certificate', 15: 'quantity', 19: 'packagingCondition', 20: 'statusText', 23: 'inspector'
    },
    customFields: [
      { col: 7, key: 'tsvet', label: 'Цвет', default: 'бурый' },
      { col: 8, key: 'gofrokarton', label: 'Гофрокартон 3-х слойный профиль', default: 'да' },
      { col: 9, key: 'dlina', label: 'ДЛИНА (мм)', default: '380 мм' },
      { col: 10, key: 'visota', label: 'ВЫСОТА (мм)', default: '230 мм' },
      { col: 11, key: 'shirina', label: 'ШИРИНА (мм)', default: '285 мм' },
      { col: 12, key: 'tolshina', label: 'ТОЛЩИНА (мм)', default: '6,0-7,5 мм' },
      { col: 13, key: 'partiya_izg', label: '№ партии изготовителя', default: '1' },
      { col: 14, key: 'partiya_vnutr', label: '№ партии внутреннего присвоения', default: '1' },
      { col: 16, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 17, key: 'goden_do', label: 'Годен до', default: 'не обозначено' },
      { col: 18, key: 'usloviya', label: 'Условия хранения', default: 'от -14C до +40C' }
    ]
  },
  'ПИЩЕВЫЕ УПАКОВОЧНЫЕ ПАКЕТЫ': {
    standardFields: {
      1: 'date', 2: 'auto-number', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'certificate', 15: 'quantity', 19: 'packagingCondition', 20: 'statusText', 23: 'inspector'
    },
    customFields: [
      { col: 7, key: 'razmer_luk', label: 'Размеры пакета на ЛУК', default: '-' },
      { col: 8, key: 'razmer_koulslou', label: 'Размеры пакета на КОУЛ СЛОУ', default: '-' },
      { col: 9, key: 'razmer_aysberg', label: 'Размеры пакета на АЙСБЕРГ', default: '-' },
      { col: 10, key: 'razmer_tomat', label: 'Размеры пакета на ТОМАТ', default: '-' },
      { col: 11, key: 'tsvet', label: 'Цвет', default: 'прозрачный' },
      { col: 12, key: 'vizual_kontrol', label: 'Визуальный контроль (нет слипания)', default: 'нет слипания' },
      { col: 13, key: 'partiya_izg', label: '№ партии изготовителя', default: '1' },
      { col: 14, key: 'partiya_vnutr', label: '№ партии внутреннего присвоения', default: '1' },
      { col: 16, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 17, key: 'goden_do', label: 'Годен до', default: 'не обозначено' },
      { col: 18, key: 'usloviya', label: 'Условия хранения', default: 'допускается' }
    ]
  },
  'МОЮЩИЕ И ДЕЗИНФИЦИРУЮЩИЕ СРЕДСТВА': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'batchNumber', 7: 'certificate', 9: 'quantity', 12: 'packagingCondition',
      13: 'statusText', 16: 'inspector'
    },
    customFields: [
      { col: 8, key: 'soderjanie_xlora', label: 'Содержание активного хлора, в %', default: '12' },
      { col: 10, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 11, key: 'goden_do', label: 'Годен до', default: '-' }
    ]
  },
  'МОЮЩИЕ СРЕДСТВА (ВАРИАНТ 2)': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'batchNumber', 9: 'quantity', 12: 'packagingCondition',
      13: 'statusText', 16: 'inspector'
    },
    customFields: [
      { col: 7, key: 'svidetelstvo', label: 'Свидетельство о гос. Регистрации', default: 'имеется' },
      { col: 8, key: 'deklaratsiya', label: 'Декларация о соответствии', default: '-' },
      { col: 10, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 11, key: 'goden_do', label: 'Годен до', default: '-' }
    ]
  },
  'ФАВОРИТ КА': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'batchNumber', 9: 'quantity', 12: 'packagingCondition',
      13: 'statusText', 16: 'inspector'
    },
    customFields: [
      { col: 7, key: 'svidetelstvo', label: 'Свидетельство о гос. Регистрации', default: 'имеется' },
      { col: 8, key: 'deklaratsiya', label: 'Декларация о соответствии', default: '-' },
      { col: 10, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 11, key: 'goden_do', label: 'Годен до', default: '-' }
    ]
  },
  'ХИМИЧЕСКИ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'gost', 5: 'supplierName',
      6: 'batchNumber', 7: 'certificate', 9: 'quantity', 12: 'packagingCondition',
      13: 'statusText', 16: 'inspector'
    },
    customFields: [
      { col: 8, key: 'soderjanie_veshestva', label: 'Содержание активного вещества, в %', default: '99.9' },
      { col: 10, key: 'data_izg', label: 'Дата изготовления', default: '-' },
      { col: 11, key: 'goden_do', label: 'Годен до', default: '-' }
    ]
  }
}

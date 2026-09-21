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
      { col: 8, key: 'struktura', label: 'Структура: Листья салата плотные, сочные с хрустящей структурой', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет листьев от светло-желтого до светло-зеленого и насыщенно-зеленого', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах свежий, свойственный данному сорту, без постороннего вкуса и запаха', default: 'да' },
      { col: 11, key: 'oksidlanish', label: 'Внутреннее окисление (порозовение)', default: 'отсутствует' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные ими места', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль, грязь и другие чужеродные материалы, увядание; признаки некроза, высушивания, перфорации листьев, подморожения, потемневший, пожелтевший или обесцветившийся продукт, избыточная влага', default: 'нет' },
      { col: 14, key: 'ozagi', label: 'В разрезе кочерыжка ровная, не более 3 см высотой без прорастания в стрелку', default: 'да' },
      { col: 15, key: 'zichligi', label: 'В разрезе плотность средней плотности', default: 'да' },
      { col: 16, key: 'olchami', label: 'Диаметр кочана-не менее 12 см, Минимальный вес кочана-с ноября до марта-не менее 300 г, с апреля до октября-не менее 350г.', default: 'да' },
      { col: 17, key: 'qoplovchi', label: 'Удаленными покровными листьями темно-зеленого цвета', default: 'да' },
      { col: 18, key: 'shikastlanish', label: 'Отсутствие механические повреждения', default: 'отсутствует' }
    ]
  },
  'ТОМАТ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectDate', 24: 'rejectActNumber', 25: 'inspector', 26: 'price'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: томаты упругие,', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет светло-красный и красный', default: 'красный' },
      { col: 10, key: 'tam', label: 'Вкус, запах свежий, свойственный', default: 'да' },
      { col: 11, key: 'olchami', label: 'Размер плодов по наибольшему', default: '6-7 см' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль, грязь и другие', default: 'нет' },
      { col: 14, key: 'ezilgan', label: 'Плоды с легкими нажимами от тары,', default: 'нет' },
      { col: 15, key: 'bitgan_yoriq', label: 'С зарубцевавшимися трещинами', default: 'не имеется' },
      { col: 16, key: 'yoriqlar', label: 'Плоды с трещинами', default: 'нет' },
      { col: 17, key: 'qadoqlash', label: 'Упакованные в один ряд', default: 'да' },
      { col: 18, key: 'shikastlanish', label: 'Отсутствие механические', default: 'отсутствует' }
    ]
  },
  'ЛУК БЕЛЫЙ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectDate', 24: 'rejectActNumber', 25: 'inspector', 26: 'price'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: хрустящий, крепкий с сочной волокнистой структурой', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет: однородный по окраске, белый, светло зеленый', default: 'соответствует' },
      { col: 10, key: 'tam', label: 'Вкус, запах свежий, свойственный данному сорту, без постороннего его вкуса и запаха', default: 'да' },
      { col: 11, key: 'olchami', label: 'Размер плодов по наибольшему поперечному диаметру должен составлять от 5,0 до 6,0 см', default: 'да' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные ими места', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль, грязь и другие чужеродные материалы', default: 'нет' },
      { col: 14, key: 'qora_doglar', label: 'Луковицы с черными пятнами, затрагивающими только внешний слой рубашки и занимающих более 50% или...', default: 'нет' },
      { col: 15, key: 'yalangochlangan', label: 'Оголенные от верхних защитных чешуй', default: 'нет' },
      { col: 16, key: 'okargan', label: 'Открывшаяся луковица, выпустившая ростки (стрелку)', default: 'нет' },
      { col: 17, key: 'qoshaloq', label: 'Двойные луковицы, не покрытые одной рубашкой или покрытые одной рубашкой, но...', default: 'не обнаружено' },
      { col: 18, key: 'shikastlanish', label: 'Отсутствие механические повреждения', default: 'нет' }
    ]
  },
  'КАПУСТА БЕЛОКОЧАННАЯ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectDate', 24: 'rejectActNumber', 25: 'inspector', 26: 'price'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: сочная, плотная, соответствующая консистенции вида овощей, входящих в состав смеси', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет: окраска листьев от белого до светло- зеленого', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах свежий, свойственный данному сорту, без постороннего его вкуса и запаха', default: 'да' },
      { col: 11, key: 'tozalangan', label: 'Зачистка кочана: кочаны должны быть зачищены до плотно облегающих их зеленых или белых листьев...', default: 'да' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные ими места', default: 'отсутствует' },
      { col: 13, key: 'kesilganda_struktura', label: 'В разрезе: структура плотная, без полостей, без потемнений, без признаков прорастания, без механических повреждений и наличия вредителей', default: 'да' },
      { col: 14, key: 'eski_yoki_osgan', label: 'Капуста старая с желтыми листьями или Проросшая', default: 'нет' },
      { col: 15, key: 'kesilganda_zichlik', label: 'В разрезе плотность средней плотности', default: 'да' },
      { col: 16, key: 'vazni', label: 'Масса качана: для раннеспелой - 0,4-0,6: для среднеспелой, среднепоздней и позднеспелой: 1,0', default: 'соответствует' },
      { col: 17, key: 'zichligi', label: 'Плотность кочана: плотные или менее плотные, но не рыхлые', default: 'да' },
      { col: 18, key: 'shikastlanish', label: 'Отсутствие механические повреждения', default: 'нет' }
    ]
  },
  'МОРКОВЬ': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectDate', 24: 'rejectActNumber', 25: 'inspector', 26: 'price'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция: мякоть доброкачественная, плотная, хрустящая, сочная, на разрезе оранжевого цвета', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет должна иметь оранжевую или желтую окраску в зависимости от особенности', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах свежий, свойственный данному сорту, без постороннего вкуса и запаха', default: 'да' },
      { col: 11, key: 'soligan', label: 'Морковь увядшая, морщинистая, запаренная, с признаками увядания (усыхания', default: 'отсутствует' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых и пораженные ими места', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, разложение, поражение болезнями и гниль, грязь и другие чужеродные материалы, увядание; признаки некроза, высушивания, перфорации лист...', default: 'нет' },
      { col: 14, key: 'xunuk', label: 'Наличие «уродливых» плодов', default: 'не имеется' },
      { col: 15, key: 'olchami', label: 'Размер по наибольшему диаметру 3-4 см, длина средняя', default: 'да' },
      { col: 16, key: 'kesilganda_struktura', label: 'В разрезе: структура плотная, мякоть не повреждена, без полостей, без потемнений', default: 'да' },
      { col: 17, key: 'yoriq', label: 'Треснутая с открытой сердцевиной', default: 'не имеется' },
      { col: 18, key: 'shikastlanish', label: 'Отсутствие механические повреждения', default: 'нет' }
    ]
  },
  'ЛИМОН': {
    standardFields: {
      1: 'auto-number', 2: 'date', 3: 'productName', 4: 'supplierName', 5: 'temperature',
      6: 'packagingCondition', 7: 'certificate', 19: 'batchNumber', 20: 'statusText',
      21: 'quantitySklad', 22: 'quantityTseh', 23: 'rejectDate', 24: 'rejectActNumber', 25: 'inspector', 26: 'price'
    },
    customFields: [
      { col: 8, key: 'konsistensiya', label: 'Консистенция (упругая, сочная)', default: 'да' },
      { col: 9, key: 'rangi', label: 'Цвет (желтый, однородный)', default: 'да' },
      { col: 10, key: 'tam', label: 'Вкус, запах (свойственный)', default: 'да' },
      { col: 11, key: 'shikastlanish1', label: 'Отсутствие повреждений (механических)', default: 'отсутствует' },
      { col: 12, key: 'hasharot', label: 'Следы насекомых', default: 'отсутствует' },
      { col: 13, key: 'nuqsonlar', label: 'Слизь, гниль, поражения', default: 'нет' },
      { col: 14, key: 'muzlagan', label: 'Подмороженность / увядание', default: 'нет' },
      { col: 15, key: 'yoriq', label: 'Трещины и дефекты', default: 'не имеется' },
      { col: 16, key: 'qadoqlash', label: 'Качество упаковки / калибровка', default: 'да' },
      { col: 17, key: 'tozalik', label: 'Отсутствие грязи', default: 'да' },
      { col: 18, key: 'shikastlanish2', label: 'Отсутствие иных повреждений', default: 'не имеется' }
    ]
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
  },
  'ЧЕК-ЛИСТ ПРОЦЕССА': {
    standardFields: {
      1: 'auto-number', 
      2: 'date',
      15: 'inspector'
    },
    customFields: [
      { col: 3, key: 'temp_clean', label: 'Темп-ра Чистой зоны', default: '-' },
      { col: 4, key: 'temp_dirty', label: 'Темп-ра Грязной зоны', default: '-' },
      { col: 5, key: 'pf_cole_carrot', label: 'ПФ Коул-слоу Морковь № партии', default: '-' },
      { col: 6, key: 'pf_cole_cabbage', label: 'ПФ Коул-слоу Капуста № партии', default: '-' },
      { col: 7, key: 'pf_iceberg', label: 'ПФ Айсберг № партии', default: '-' },
      { col: 8, key: 'pf_onion', label: 'ПФ Лук № партии', default: '-' },
      { col: 9, key: 'pf_tomato', label: 'ПФ Томат № партии', default: '-' },
      { col: 10, key: 'temp_fp_cole', label: 'Температура ГП Коул-слоу', default: '-' },
      { col: 11, key: 'temp_fp_iceberg', label: 'Температура ГП Айсберг', default: '-' },
      { col: 12, key: 'temp_fp_tomato', label: 'Температура ГП Томат', default: '-' },
      { col: 13, key: 'temp_fp_onion', label: 'Температура ГП Лук', default: '-' },
      { col: 14, key: 'corrective_actions', label: 'Корректирующие действия', default: 'нет' }
    ]
  }
}

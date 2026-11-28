const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseDateStr(str) {
  if (!str) return null;
  // formats: "13.11.2026г", "13.11.2026", "2026-11-13", "9.01.2027г"
  const clean = str.replace('г', '').trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return new Date(`${year}-${month}-${day}T00:00:00Z`);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function calculateStatus(dateStr, bloodPressure) {
  const d = parseDateStr(dateStr);
  const now = new Date('2026-11-28T00:00:00Z'); // current mock/system anchor

  // High BP check (e.g. 210/120, >140 or >90)
  let highBP = false;
  if (bloodPressure) {
    const [sys, dia] = bloodPressure.split('/').map(s => parseInt(s.trim()));
    if ((sys && sys >= 140) || (dia && dia >= 95)) {
      highBP = true;
    }
  }

  if (!d) return highBP ? 'URGENT' : 'VALID';

  // If already expired or within 30 days
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'EXPIRED'; // RED (Muddati tugagan)
  if (diffDays <= 30 || highBP) return 'URGENT'; // RED (Yaqinlashgan yoki bosim yuqori)
  return 'VALID'; // GREEN (Amalda)
}

const EMPLOYEES = [
  // Цех (35)
  { orderNumber: 1, fullName: 'Аралбаев Жавохир Шухрат ули', department: 'Цех', position: 'грузчик', examDate: '13.11.2026г', bloodPressure: '100/70', conclusion: '' },
  { orderNumber: 2, fullName: 'Каюмова Муяссар Абдусатторовна', department: 'Цех', position: 'Оператор цеха', examDate: '13.11.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 3, fullName: 'Рузматова Мухаддас Нарисмановна', department: 'Цех', position: 'Оператор линии', examDate: '23.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 4, fullName: 'Сулаймонова Дильдора Тулкинжон кизи', department: 'Цех', position: 'Оператор цеха', examDate: '10.12.2026г', bloodPressure: '140/100', conclusion: 'ГОДЕН В ОЧКАХ' },
  { orderNumber: 5, fullName: 'Адашова Мунира Эшхужаевна', department: 'Цех', position: 'Оператор линии', examDate: '17.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 6, fullName: 'Махкамова Мукаддас Имомбоевна', department: 'Цех', position: 'Оператор линии', examDate: '10.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 7, fullName: 'Ачилова Саёра Ачиловна', department: 'Цех', position: 'Оператор линии', examDate: '24.12.2026г', bloodPressure: '110/80', conclusion: '' },
  { orderNumber: 8, fullName: 'Айтаева Гульзира Эркинбаевна', department: 'Цех', position: 'Прачка', examDate: '17.12.2026г', bloodPressure: '140/100', conclusion: '' },
  { orderNumber: 10, fullName: 'Турабаева Феруза Турдибаевна', department: 'Цех', position: 'Оператор линии', examDate: '17.12.2026г', bloodPressure: '90/60', conclusion: '' },
  { orderNumber: 11, fullName: 'Гофурова Зиёда Жураевна', department: 'Цех', position: 'Оператор цеха', examDate: '24.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 14, fullName: 'Ходжаева Гулчехра Баходировна', department: 'Цех', position: 'оператор цеха', examDate: '26.11.2026г', bloodPressure: '140/100', conclusion: '' },
  { orderNumber: 15, fullName: 'Гофурова Нафиса Ширматовна', department: 'Цех', position: 'Оператор цеха', examDate: '18.12.2026г', bloodPressure: '110/80', conclusion: '' },
  { orderNumber: 16, fullName: 'Мирзаев Сайфуллох Асадиллаевич', department: 'Цех', position: 'завсклад', examDate: '19.12.2026г', bloodPressure: '90/60', conclusion: '' },
  { orderNumber: 17, fullName: 'Тошов Элёр Уктамович', department: 'Цех', position: 'наладчик', examDate: '29.12.2026г', bloodPressure: '120/80', conclusion: 'ГОДЕН В ОЧКАХ' },
  { orderNumber: 18, fullName: 'Куканова Фатима Нургали кизи', department: 'Цех', position: 'Оператор линии', examDate: '29.12.2026г', bloodPressure: '80/60', conclusion: '' },
  { orderNumber: 19, fullName: 'Аланиязова Гульчехра Пайзуллаевна', department: 'Цех', position: 'Оператор цеха', examDate: '29.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 20, fullName: 'Ахмедов Ержан Миракимович', department: 'Цех', position: 'грузчик', examDate: '9.01.2027г', bloodPressure: '100/80', conclusion: '' },
  { orderNumber: 21, fullName: 'Ходжаева Гулмира Рустамбековна', department: 'Цех', position: 'Оператор цеха', examDate: '8.01.2027г', bloodPressure: '100/60', conclusion: '' },
  { orderNumber: 23, fullName: 'Хамзаев Жавохир Баходир угли', department: 'Цех', position: 'грузчик', examDate: '19.02.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 24, fullName: 'Рузиева Гулнора Алимуратовна', department: 'Цех', position: 'оператор цеха', examDate: '02.04.2027г', bloodPressure: '100/60', conclusion: '' },
  { orderNumber: 25, fullName: 'Джумаева Барчиной Раимназаровна', department: 'Цех', position: 'оператор цеха', examDate: '02.04.2027г', bloodPressure: '110/80', conclusion: '' },
  { orderNumber: 26, fullName: 'Исабаев Тимур Фергатович', department: 'Цех', position: 'оператор цеха', examDate: '07.04.2027г', bloodPressure: '140/100', conclusion: '' },
  { orderNumber: 27, fullName: 'Рахимов Камолиддин Нигматжонович', department: 'Цех', position: 'электрик', examDate: '12.04.2027г', bloodPressure: '110/80', conclusion: '' },
  { orderNumber: 28, fullName: 'Пулатов Жамолиддин Мухиддинович', department: 'Цех', position: 'сан.техник', examDate: '12.04.2027г', bloodPressure: '110/70', conclusion: '' },
  { orderNumber: 29, fullName: 'Бахромов Шохрух Курбонович', department: 'Цех', position: 'цех бош.', examDate: '29.04.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 30, fullName: 'Ражапова Лиана Рафаэльна', department: 'Цех', position: 'оператор цеха', examDate: '21.04.2027г', bloodPressure: '100/60', conclusion: '' },
  { orderNumber: 31, fullName: 'Эшмуродов Бобур Аблаёрович', department: 'Цех', position: 'грузчик', examDate: '21.04.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 32, fullName: 'Сайдуллаев Шохрух Хайрулло угли', department: 'Цех', position: 'грузчик', examDate: '16.04.2027г', bloodPressure: '100/80', conclusion: '' },
  { orderNumber: 33, fullName: 'Бердиев Исроил Нарзуллаевич', department: 'Цех', position: 'грузчик', examDate: '29.04.2027г', bloodPressure: '110/70', conclusion: '' },
  { orderNumber: 34, fullName: 'Турсунбаев Азизбек Тургунбай угли', department: 'Цех', position: 'грузчик', examDate: '16.04.2027г', bloodPressure: '110/60', conclusion: '' },
  { orderNumber: 35, fullName: 'Кенджебаев Бахтияр Ергали угли', department: 'Цех', position: 'грузчик', examDate: '16.04.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 36, fullName: 'Сагинбеков Джахибжоджа Джангир угли', department: 'Цех', position: 'грузчик', examDate: '21.04.2027г', bloodPressure: '110/70', conclusion: '' },
  { orderNumber: 37, fullName: 'Хамидуллаева Дилдора Озод кизи', department: 'Цех', position: 'оператор цеха', examDate: '21.04.2027г', bloodPressure: '100/60', conclusion: '' },
  { orderNumber: 38, fullName: 'Базарбаева Аселия Бакитжан кизи', department: 'Цех', position: 'оператор цеха', examDate: '21.04.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 39, fullName: 'Имомов Давлат Аввалбек угли', department: 'Цех', position: 'грузчик', examDate: '21.04.2027г', bloodPressure: '110/70', conclusion: '' },

  // Кухня (10)
  { orderNumber: 1, fullName: 'Махмадёрова Озода Мирзабековна', department: 'Кухня', position: 'Повар', examDate: '22.11.2026г', bloodPressure: '100/70', conclusion: '' },
  { orderNumber: 2, fullName: 'Расулов Абдухамид Азотович', department: 'Кухня', position: 'Повар', examDate: '14.11.2026г', bloodPressure: '100/70', conclusion: '' },
  { orderNumber: 3, fullName: 'Мирзамуратов Шавкат Юсуфжонович', department: 'Кухня', position: 'Повар', examDate: '22.11.2026г', bloodPressure: '140/100', conclusion: '' },
  { orderNumber: 4, fullName: 'Хужунбаев Бахтиер Джурабаевич', department: 'Кухня', position: 'Повар', examDate: '22.11.2026г', bloodPressure: '210/120', conclusion: 'якинни яхши курмаслик, юқори А/Д' },
  { orderNumber: 5, fullName: 'Ходжиматова Малохат Аманбаевна', department: 'Кухня', position: 'Салатчица', examDate: '22.11.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 6, fullName: 'Эгамбердиева Хуршида', department: 'Кухня', position: 'Работник кухни', examDate: '25.11.2026г', bloodPressure: '125/100', conclusion: '' },
  { orderNumber: 7, fullName: 'Кушшаев Жахонгир Тавкараевич', department: 'Кухня', position: 'Шеф-повар', examDate: '25.11.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 8, fullName: 'Кадиров Мавлон Носирович', department: 'Кухня', position: 'Повар', examDate: '25.11.2026г', bloodPressure: '120/90', conclusion: '' },
  { orderNumber: 9, fullName: 'Дадаматов Холдор Зухритдинович', department: 'Кухня', position: 'повар', examDate: '17.12.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 10, fullName: 'Авлаева Гузал Алмардоновна', department: 'Кухня', position: 'Работник кухни', examDate: '27.01.2027г', bloodPressure: '140/100', conclusion: 'ГОДЕН В ОЧКАХ' },

  // Водители (30)
  { orderNumber: 1, fullName: 'Пулатов Миркомил Мирзарахим угли', department: 'Логистика', position: 'водитель', examDate: '19.11.2026г', bloodPressure: '110/80', conclusion: '', isDriver: true },
  { orderNumber: 2, fullName: 'Жалилов Иброхим Исломиддин угли', department: 'Логистика', position: 'водитель', examDate: '14.11.2026г', bloodPressure: '100/60', conclusion: '', isDriver: true },
  { orderNumber: 3, fullName: 'Солнцев Виталий Шайдуллаевич', department: 'Логистика', position: 'водитель', examDate: '7.11.2026г', bloodPressure: '130/100', conclusion: '', isDriver: true },
  { orderNumber: 4, fullName: 'Рахмонбердиев Бехзод Кудрат угли', department: 'Логистика', position: 'водитель', examDate: '20.11.2026г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 5, fullName: 'Шержонов Рустамжон Бокижон угли', department: 'Логистика', position: 'водитель', examDate: '17.12.2026г', bloodPressure: '100/60', conclusion: '', isDriver: true },
  { orderNumber: 6, fullName: 'Жураев Бекзод Фахриддин угли', department: 'Логистика', position: 'водитель', examDate: '23.12.2026г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 7, fullName: 'Азизов Хусан Кабилджанович', department: 'Логистика', position: 'водитель', examDate: '15.12.2026г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 8, fullName: 'Эшназаров Собиржон Юнусович', department: 'Логистика', position: 'водитель', examDate: '12.12.2026г', bloodPressure: '130/90', conclusion: '', isDriver: true },
  { orderNumber: 9, fullName: 'Муратов Мамир Хасанович', department: 'Логистика', position: 'водитель', examDate: '25.11.2026г', bloodPressure: '140/100', conclusion: '', isDriver: true },
  { orderNumber: 10, fullName: 'Шакирбеков Рустамбек Анварбекович', department: 'Логистика', position: 'водитель', examDate: '13.02.2027г', bloodPressure: '120/80', conclusion: 'ГОДЕН В ОЧКАХ', isDriver: true },
  { orderNumber: 11, fullName: 'Пирманов Ахрор Толиб угли', department: 'Логистика', position: 'водитель', examDate: '30.01.2027г', bloodPressure: '120/80', conclusion: 'ГОДЕН В ОЧКАХ', isDriver: true },
  { orderNumber: 12, fullName: 'Мамаюнусов Бехзод Хабибулло угли', department: 'Логистика', position: 'водитель', examDate: '30.01.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 13, fullName: 'Муминов Бекзод Шоди угли', department: 'Логистика', position: 'водитель', examDate: '17.01.2027г', bloodPressure: '110/80', conclusion: '', isDriver: true },
  { orderNumber: 14, fullName: 'Садибеков Ихтиёр Бахтиёрович', department: 'Логистика', position: 'водитель', examDate: '17.01.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 15, fullName: 'Маткобилов Мирзохид Абдикаримович', department: 'Логистика', position: 'водитель', examDate: '16.01.2027г', bloodPressure: '120/90', conclusion: '', isDriver: true },
  { orderNumber: 16, fullName: 'Рахимов Ихтиёр Бахтиёр угли', department: 'Логистика', position: 'водитель', examDate: '30.01.2027г', bloodPressure: '110/80', conclusion: '', isDriver: true },
  { orderNumber: 17, fullName: 'Жумаев Маъсуджон Мустафо угли', department: 'Логистика', position: 'водитель', examDate: '06.02.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 18, fullName: 'Мамаджонов Ровшан Алимджанович', department: 'Логистика', position: 'водитель', examDate: '10.02.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 19, fullName: 'Камалов Учкунбек Дилмурод угли', department: 'Логистика', position: 'водитель', examDate: '18.02.2027г', bloodPressure: '110/70', conclusion: '', isDriver: true },
  { orderNumber: 20, fullName: 'Салихов Равшан Хейтбаевич', department: 'Логистика', position: 'водитель', examDate: '25.02.2027г', bloodPressure: '130/100', conclusion: '', isDriver: true },
  { orderNumber: 21, fullName: 'Киркбаев Алижон Сайфиддин угли', department: 'Логистика', position: 'водитель', examDate: '30.03.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 22, fullName: 'Салихов Хайрулла Жураевич', department: 'Логистика', position: 'водитель', examDate: '15.03.2027г', bloodPressure: '100/80', conclusion: '', isDriver: true },
  { orderNumber: 23, fullName: 'Худойбердиев Худоёр Бахтиёр угли', department: 'Логистика', position: 'водитель', examDate: '27.09.2026г', bloodPressure: '90/60', conclusion: '', isDriver: true },
  { orderNumber: 24, fullName: 'Мирзаев Шухрат Рустамович', department: 'Логистика', position: 'водитель', examDate: '22.04.2027г', bloodPressure: '160/100', conclusion: 'А/Б назорат', isDriver: true },
  { orderNumber: 25, fullName: 'Суннатов Жахонгир Кахрамон угли', department: 'Логистика', position: 'водитель', examDate: '27.04.2027г', bloodPressure: '110/80', conclusion: '', isDriver: true },
  { orderNumber: 26, fullName: 'Аскаров Равшан Рустамович', department: 'Логистика', position: 'водитель', examDate: '29.04.2027г', bloodPressure: '150/100', conclusion: 'гепиртину', isDriver: true },
  { orderNumber: 27, fullName: 'Сангиров Исраил Умирзакович', department: 'Логистика', position: 'водитель', examDate: '19.04.2027г', bloodPressure: '130/80', conclusion: '', isDriver: true },
  { orderNumber: 28, fullName: 'Дусматов Уктамжон Рахматуллаевич', department: 'Логистика', position: 'водитель', examDate: '16.04.2027г', bloodPressure: '120/80', conclusion: '', isDriver: true },
  { orderNumber: 29, fullName: 'Дусаев Достон Каримович', department: 'Логистика', position: 'водитель', examDate: '23.04.2027г', bloodPressure: '110/80', conclusion: '', isDriver: true },
  { orderNumber: 30, fullName: 'Юлдашев Эркинжон Эргашхужаевич', department: 'Логистика', position: 'водитель', examDate: '02.05.2027г', bloodPressure: '120/90', conclusion: '', isDriver: true },

  // АУП и ИТР (7)
  { orderNumber: 1, fullName: 'Жуманова Чарос Эшбобоевна', department: 'АУП и ИТР', position: 'медсестра', examDate: '01.11.2026г', bloodPressure: '110/70', conclusion: '' },
  { orderNumber: 2, fullName: 'Мамадалиев Улугбек Мухторович', department: 'АУП и ИТР', position: 'Нач.логистика', examDate: '15.10.2026г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 3, fullName: 'Зуфарова Дилором Алимджановна', department: 'АУП и ИТР', position: 'Менеджер по ПБ', examDate: '16.10.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 4, fullName: 'Камбарова Арофат Мирабзал кизи', department: 'АУП и ИТР', position: 'Контроль качества', examDate: '16.10.2027г', bloodPressure: '110/70', conclusion: '' },
  { orderNumber: 5, fullName: 'Рахимов Камолиддин Нигматжонович', department: 'АУП и ИТР', position: 'электрик', examDate: '12.04.2027г', bloodPressure: '110/80', conclusion: '' },
  { orderNumber: 6, fullName: 'Каримжонов Одилжон', department: 'АУП и ИТР', position: 'снабженист', examDate: '13.01.2027г', bloodPressure: '120/80', conclusion: '' },
  { orderNumber: 7, fullName: 'Умаров Зулпухар Ташпулатович', department: 'АУП и ИТР', position: 'энергетик', examDate: '21.02.2027г', bloodPressure: '120/80', conclusion: '' },
];

const INITIAL_SAMPLES = [
  {
    date: '2026-11-24',
    orderNumber: 1,
    dishName: 'Ош 1-хўрак',
    sampleTime: '09:05',
    sampleWeight: '100 гр',
    containerCondition: 'идиш тоза, дезинфекция қилинган',
    fridgeTime: '09:15',
    fridgeTemp: '+2°C...+6°C',
    expiryTime: '48 соат (26.11.2026 09:05)',
    responsiblePerson: 'Жуманова Ч.Э.',
    signature: 'Жуманова Ч.Э.',
    status: 'APPROVED',
    notes: 'Синама олинди, совутгичда сақланмоқда'
  },
  {
    date: '2026-11-24',
    orderNumber: 2,
    dishName: 'Салат капрез',
    sampleTime: '09:10',
    sampleWeight: '100 гр',
    containerCondition: 'идиш тоза, дезинфекция қилинган',
    fridgeTime: '09:20',
    fridgeTemp: '+2°C...+6°C',
    expiryTime: '48 соат (26.11.2026 09:10)',
    responsiblePerson: 'Жуманова Ч.Э.',
    signature: 'Жуманова Ч.Э.',
    status: 'APPROVED',
    notes: 'Синама олинди'
  },
  {
    date: '2026-11-24',
    orderNumber: 3,
    dishName: 'Ош 2-қозон',
    sampleTime: '10:45',
    sampleWeight: '100 гр',
    containerCondition: 'идиш тоза, дезинфекция қилинган',
    fridgeTime: '10:55',
    fridgeTemp: '+2°C...+6°C',
    expiryTime: '48 соат (26.11.2026 10:45)',
    responsiblePerson: 'Жуманова Ч.Э.',
    signature: 'Жуманова Ч.Э.',
    status: 'APPROVED',
    notes: 'Иккинчи смена учун синама'
  }
];

async function main() {
  console.log('Seeding EmployeeMedicalExam...');
  await prisma.employeeMedicalExam.deleteMany({});

  for (const emp of EMPLOYEES) {
    const status = calculateStatus(emp.examDate, emp.bloodPressure);
    const parsedDate = parseDateStr(emp.examDate);

    await prisma.employeeMedicalExam.create({
      data: {
        orderNumber: emp.orderNumber,
        fullName: emp.fullName,
        department: emp.department,
        position: emp.position,
        examDate: emp.examDate,
        parsedDate,
        bloodPressure: emp.bloodPressure,
        conclusion: emp.conclusion || (status === 'VALID' ? 'Соғлом, рухсат' : 'Назоратда'),
        status,
        isDriver: !!emp.isDriver,
        signature: emp.fullName.split(' ')[0] + ' ' + (emp.fullName.split(' ')[1]?.[0] || '') + '.',
        nurseSignature: 'Жуманова Ч.Э.'
      }
    });
  }

  console.log(`Seeded ${EMPLOYEES.length} employees/drivers into EmployeeMedicalExam.`);

  console.log('Seeding DailyFoodSampleLog...');
  await prisma.dailyFoodSampleLog.deleteMany({});
  for (const s of INITIAL_SAMPLES) {
    await prisma.dailyFoodSampleLog.create({
      data: s
    });
  }
  console.log(`Seeded ${INITIAL_SAMPLES.length} initial daily food samples.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

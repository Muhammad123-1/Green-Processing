import fs from 'fs'

let content = fs.readFileSync('src/app/(dashboard)/surveys/page.tsx', 'utf8')

if (!content.includes('useLanguage')) {
  content = content.replace(
    "import { toast } from 'sonner'",
    "import { toast } from 'sonner'\nimport { useLanguage } from '@/components/providers/LanguageProvider'"
  )
  content = content.replace(
    "export default function SurveysPage() {",
    "export default function SurveysPage() {\n  const { formatDual } = useLanguage()"
  )
}

const replaces = [
  ["So'rovnomalar", "{formatDual('So\\'rovnomalar', 'Опросы', 'Surveys')}"],
  ["Mijozlar qoniqish darajasini boshqarish", "{formatDual('Mijozlar qoniqish darajasini boshqarish', 'Управление удовлетворенностью клиентов', 'Customer satisfaction management')}"],
  ["Yangi so'rovnoma yaratish", "{formatDual('Yangi so\\'rovnoma yaratish', 'Создать новый опрос', 'Create new survey')}"],
  ["Yangi so'rovnoma", "{formatDual('Yangi so\\'rovnoma', 'Новый опрос', 'New survey')}"],
  ["Arxiv", "{formatDual('Arxiv', 'Архив', 'Archive')}"],
  ["So'rovnoma nomi", "{formatDual('So\\'rovnoma nomi', 'Название опроса', 'Survey title')}"],
  ["Tavsif (ixtiyoriy)", "{formatDual('Tavsif (ixtiyoriy)', 'Описание (необязательно)', 'Description (optional)')}"],
  ["Muddati (ixtiyoriy)", "{formatDual('Muddati (ixtiyoriy)', 'Срок (необязательно)', 'Deadline (optional)')}"],
  ["Bo'sh qoldirsangiz — muddat cheklanmaydi", "{formatDual('Bo\\'sh qoldirsangiz — muddat cheklanmaydi', 'Оставьте пустым — срок не ограничен', 'Leave empty — no deadline')}"],
  ["Standart GREEN PROCESSING savollarini qo'shish (11 ta savol)", "{formatDual('Standart GREEN PROCESSING savollarini qo\\'shish (11 ta savol)', 'Добавить стандартные вопросы GREEN PROCESSING (11 вопросов)', 'Add standard GREEN PROCESSING questions (11 questions)')}"],
  ["Yaratish", "{formatDual('Yaratish', 'Создать', 'Create')}"],
  ["Bekor", "{formatDual('Bekor', 'Отмена', 'Cancel')}"],
  ["Hali so'rovnoma yo'q", "{formatDual('Hali so\\'rovnoma yo\\'q', 'Пока нет опросов', 'No surveys yet')}"],
  ["Yuqoridagi tugmani bosib yangi so'rovnoma yarating", "{formatDual('Yuqoridagi tugmani bosib yangi so\\'rovnoma yarating', 'Нажмите кнопку выше, чтобы создать новый опрос', 'Click the button above to create a new survey')}"],
  ["ta javob", " {formatDual('ta javob', 'ответов', 'answers')}"],
  ["savol<", " {formatDual('savol', 'вопросов', 'questions')}<"], // careful with "savol"
  ["Javoblar (", "{formatDual('Javoblar (', 'Ответы (', 'Answers (')}"],
  ["ta)", " {formatDual('ta)', 'шт.)', 'count)')}"],
  ["Hali javob yo'q", "{formatDual('Hali javob yo\\'q', 'Пока нет ответов', 'No answers yet')}"],
  ["Noma'lum restoran", "{formatDual('Noma\\'lum restoran', 'Неизвестный ресторан', 'Unknown restaurant')}"],
  ["Nusxalandi!", "{formatDual('Nusxalandi!', 'Скопировано!', 'Copied!')}"],
  ["Nusxala", "{formatDual('Nusxala', 'Копировать', 'Copy')}"]
]

for (const [search, replace] of replaces) {
  content = content.replaceAll(search, replace)
}

fs.writeFileSync('src/app/(dashboard)/surveys/page.tsx', content)
console.log("Translated surveys page")

import fs from 'fs'

let content = fs.readFileSync('src/app/survey/[token]/page.tsx', 'utf8')

// Add imports
if (!content.includes('useLanguage')) {
  content = content.replace(
    "import { Loader2, CheckCircle } from 'lucide-react'",
    "import { Loader2, CheckCircle } from 'lucide-react'\nimport { useLanguage } from '@/components/providers/LanguageProvider'"
  )
}

// Extract hook inside component
content = content.replace(
  "export default function PublicSurveyPage() {",
  "export default function PublicSurveyPage() {\n  const { formatDual } = useLanguage()"
)

// Translate strings
content = content.replace(
  "toast.success('Javoblaringiz qabul qilindi! Katta rahmat!')",
  "toast.success(formatDual('Javoblaringiz qabul qilindi! Katta rahmat!', 'Ваши ответы приняты! Большое спасибо!', 'Your answers have been submitted! Thank you!'))"
)
content = content.replace(
  "toast.error('Barcha majburiy savollarga javob bering')",
  "toast.error(formatDual('Barcha majburiy savollarga javob bering', 'Ответьте на все обязательные вопросы', 'Please answer all required questions'))"
)

content = content.replace(
  "selected === '5' ? \"A'lo\" : selected === '4' ? 'Yaxshi' : selected === '3' ? 'Qoniqarli' : selected === '2' ? 'Yomon' : 'Juda yomon'",
  "selected === '5' ? formatDual(\"A'lo\", \"Отлично\", \"Excellent\") : selected === '4' ? formatDual('Yaxshi', 'Хорошо', 'Good') : selected === '3' ? formatDual('Qoniqarli', 'Удовлетворительно', 'Satisfactory') : selected === '2' ? formatDual('Yomon', 'Плохо', 'Poor') : formatDual('Juda yomon', 'Очень плохо', 'Very poor')"
)

content = content.replace(
  "Agar \"Ha\" bo'lsa \u2014 batafsil:",
  "{formatDual('Agar \"Ha\" bo\\'lsa — batafsil:', 'Если \"Да\" — подробнее:', 'If \"Yes\" — please specify:')}"
)
content = content.replace(
  "placeholder=\"O'z fikringizni yozing...\"",
  "placeholder={formatDual(\"O'z fikringizni yozing...\", \"Напишите свое мнение...\", \"Write your opinion...\")}"
)
content = content.replace(
  "placeholder=\"Javobingizni yozing...\"",
  "placeholder={formatDual(\"Javobingizni yozing...\", \"Напишите ваш ответ...\", \"Write your answer...\")}"
)
content = content.replace(
  "Sifat nazorat tizimi",
  "{formatDual('Sifat nazorat tizimi', 'Система контроля качества', 'Quality Control System')}"
)

content = content.replace(
  ">Restoran nomi</label>",
  ">{formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}</label>"
)
content = content.replace(
  "placeholder=\"Restoran nomi\"",
  "placeholder={formatDual('Restoran nomi', 'Название ресторана', 'Restaurant Name')}"
)
content = content.replace(
  ">F.I.Sh.</label>",
  ">{formatDual('F.I.Sh.', 'Ф.И.О.', 'Full Name')}</label>"
)
content = content.replace(
  "placeholder=\"To'liq ism\"",
  "placeholder={formatDual(\"To'liq ism\", 'Полное имя', 'Full name')}"
)
content = content.replace(
  ">Sana</label>",
  ">{formatDual('Sana', 'Дата', 'Date')}</label>"
)

content = content.replace(
  "{submitting ? 'Yuborilmoqda...' : 'So\\'rovnomani yuborish'}",
  "{submitting ? formatDual('Yuborilmoqda...', 'Отправка...', 'Submitting...') : formatDual('So\\'rovnomani yuborish', 'Отправить анкету', 'Submit survey')}"
)
content = content.replace(
  "Vaqt ajratgandingiz uchun minnatdorchilik! \uD83D\uDC4D",
  "{formatDual('Vaqt ajratgandingiz uchun minnatdorchilik!', 'Спасибо за уделенное время!', 'Thank you for your time!')} 👍"
)

// Language selector for public page
const langSelectorHtml = `
          {/* Lang */}
          <div className="absolute top-4 right-4 flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
            <button onClick={() => window.localStorage.setItem('language', 'uz')} className="text-white text-xs px-2 py-1 font-bold">UZ</button>
            <button onClick={() => window.localStorage.setItem('language', 'ru')} className="text-white text-xs px-2 py-1 font-bold">RU</button>
            <button onClick={() => window.localStorage.setItem('language', 'en')} className="text-white text-xs px-2 py-1 font-bold">EN</button>
          </div>
`
content = content.replace(
  "<div className=\"bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white\">",
  "<div className=\"bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white relative\">" + langSelectorHtml
)

fs.writeFileSync('src/app/survey/[token]/page.tsx', content)
console.log("Translated public survey")

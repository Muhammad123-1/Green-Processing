import fs from 'fs'

let content = fs.readFileSync('src/app/survey/[token]/page.tsx', 'utf8')

content = content.replace(
  "const opts = q.options ? JSON.parse(q.options) : (q.questionType === 'rating' ? ['5','4','3','2','1'] : (q.questionType === 'yesno' ? ['Ha','Yo'q'] : []))",
  "const opts = q.options ? JSON.parse(q.options) : (q.questionType === 'rating' ? ['5','4','3','2','1'] : (q.questionType === 'yesno' ? ['Ha',\"Yo'q\"] : []))"
)

fs.writeFileSync('src/app/survey/[token]/page.tsx', content)

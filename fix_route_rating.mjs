import fs from 'fs'

let content = fs.readFileSync('src/app/api/surveys/route.ts', 'utf8')

content = content.replace(/questionType: 'rating',\s+isRequired: true/g, "questionType: 'rating',\n            options: ['5','4','3','2','1'],\n            isRequired: true")

fs.writeFileSync('src/app/api/surveys/route.ts', content)

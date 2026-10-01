import fs from 'fs'

let content = fs.readFileSync('src/app/(dashboard)/surveys/page.tsx', 'utf8')

content = content.replace(
  "submitting ? 'Yaratilmoqda...' : '{formatDual(\\'Yaratish\\', \\'Создать\\', \\'Create\\')}'}",
  "submitting ? 'Yaratilmoqda...' : formatDual('Yaratish', 'Создать', 'Create')}"
)
content = content.replace(
  "submitting ? 'Yaratilmoqda...' : '{formatDual('Yaratish', 'Создать', 'Create')}'}",
  "submitting ? 'Yaratilmoqda...' : formatDual('Yaratish', 'Создать', 'Create')}"
)
content = content.replace(
  "submitting ? 'Yaratilmoqda...' : formatDual('Yaratish', 'Создать', 'Create')}'}",
  "submitting ? 'Yaratilmoqda...' : formatDual('Yaratish', 'Создать', 'Create')}"
)

fs.writeFileSync('src/app/(dashboard)/surveys/page.tsx', content)

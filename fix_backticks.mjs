import fs from 'fs'
let c = fs.readFileSync('src/app/(dashboard)/surveys/page.tsx', 'utf8')
c = c.replace(/\\`\\\${/g, "`${")
c = c.replace(/\\`/g, "`")
c = c.replace(/\\\${/g, "${")
fs.writeFileSync('src/app/(dashboard)/surveys/page.tsx', c)

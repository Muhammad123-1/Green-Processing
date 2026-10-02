import fs from 'fs'

let content = fs.readFileSync('src/app/api/shop-report/import/route.ts', 'utf8')

content = content.replace(
  /if \(cell\.value instanceof Date\) \{\s*\.toISOString\(\)\.split\('T'\)\[0\]\s*\}/m,
  "if (cell.value instanceof Date) {\n                  dateStr = cell.value.toISOString().split('T')[0]\n                }"
)

fs.writeFileSync('src/app/api/shop-report/import/route.ts', content)

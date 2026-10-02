import fs from 'fs'

let content = fs.readFileSync('src/app/api/shop-report/import/route.ts', 'utf8')

// The regex will find the block
content = content.replace(
  /\} else if \(typeof cell\.value === 'string'\) \{\s*const val = cell\.value\.trim\(\);\s*if \(val\.match\(\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\)\) \{ dateStr = val; \}\s*else if \(val\.match\(\/\^\\d\{2\}\\.\\d\{2}\\.\\d\{4\}\$\/\)\) \{ const parts = val\.split\('\.'\); dateStr = parts\[2\] \+ '-' \+ parts\[1\] \+ '-' \+ parts\[0\]; \}\s*\}\s*\}\s*\n\s*\}/m,
  "} else if (typeof cell.value === 'string') {\n                  const val = cell.value.trim();\n                  if (val.match(/^\\d{4}-\\d{2}-\\d{2}$/)) { dateStr = val; }\n                  else if (val.match(/^\\d{2}\\.\\d{2}\\.\\d{4}$/)) { const parts = val.split('.'); dateStr = parts[2] + '-' + parts[1] + '-' + parts[0]; }\n                }\n              }"
)

fs.writeFileSync('src/app/api/shop-report/import/route.ts', content)

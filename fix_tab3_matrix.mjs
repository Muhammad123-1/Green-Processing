import fs from 'fs'

let content = fs.readFileSync('src/components/production/ShopReportContent.tsx', 'utf8')

// Update useEffect to preserve matrix and outputs
content = content.replace(
  `...e.materials \n      })))`,
  `...e.materials,\n        matrix: e.matrix,\n        outputs: e.outputs,\n        balances: e.balances\n      })))`
)

// Now let's find the array literal in Tab 3 and replace it with a dynamically generated array from the selected reportDate!
const arrayLiteral = `[
                        { name: 'Салат Айсберг', in: '2897.6', v1: '2897.6', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '', y1: true },
                        { name: 'Томаты', in: '0.0', v1: '', v2: '0.0', v3: '', v4: '', v5: '', v6: '', v7: '', y2: true },
                        { name: 'Лук салатный белый', in: '0.0', v1: '', v2: '', v3: '0.0', v4: '', v5: '', v6: '', v7: '', y3: true },
                        { name: 'Капуста/Морковь', in: '167.3', v1: '', v2: '', v3: '', v4: '143.8', v5: '23.5', v6: '', v7: '0.0', y4: true, y5: true },
                        { name: 'Лимон', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '0', v7: '0', y6: true, y7: true },
                        { name: 'Пакет вакуумный 30*35', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                        { name: 'Коробка из гофрокартона', in: '0.0', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                        { name: 'Этикетка 56*60', in: '0.0', v1: '0', v2: '0', v3: '0', v4: '0', v5: '0', v6: '0', v7: '0' },
                      ]`

// We will replace this array literal with a function call or inline logic
const dynamicArrayCode = `(function() {
                        const exp = expenses.find(e => e.date === reportDate);
                        const m = exp?.matrix || {};
                        return [
                          { name: 'Салат Айсберг', in: m['Салат Айсберг']?.['Салат Айсберг нарезанный'] || '', v1: m['Салат Айсберг']?.['Салат Айсберг нарезанный'] || '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '', y1: true },
                          { name: 'Томаты', in: m['Томаты']?.['Томаты целые'] || '', v1: '', v2: m['Томаты']?.['Томаты целые'] || '', v3: '', v4: '', v5: '', v6: '', v7: '', y2: true },
                          { name: 'Лук салатный белый', in: m['Лук салатный белый']?.['Лук салатный белый нарезанный'] || m['Лук салатный белый ']?.['Лук салатный белый нарезанный'] || '', v1: '', v2: '', v3: m['Лук салатный белый']?.['Лук салатный белый нарезанный'] || m['Лук салатный белый ']?.['Лук салатный белый нарезанный'] || '', v4: '', v5: '', v6: '', v7: '', y3: true },
                          { name: 'Капуста/Морковь', in: (m['Капуста/Морковь']?.['Капуста'] || 0) + (m['Капуста/Морковь']?.['Морковь'] || 0) || '', v1: '', v2: '', v3: '', v4: m['Капуста/Морковь']?.['Капуста'] || m['Капуста']?.['Капуста'] || '', v5: m['Капуста/Морковь']?.['Морковь'] || m['Морковь']?.['Морковь'] || '', v6: '', v7: '', y4: true, y5: true },
                          { name: 'Лимон', in: m['Лимон']?.['Лимон'] || '', v1: '', v2: '', v3: '', v4: '', v5: '', v6: m['Лимон']?.['Лимон'] || '', v7: '', y6: true, y7: true },
                          { name: 'Пакет вакуумный 30*35', in: '', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                          { name: 'Коробка из гофрокартона', in: '', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                          { name: 'Этикетка 56*60', in: '', v1: '', v2: '', v3: '', v4: '', v5: '', v6: '', v7: '' },
                        ]
                      })()`
                      
// Check if the original string matches due to encoding/spaces
let updatedContent = content
const regex = /\[\s*\{\s*name:\s*'Салат Айсберг'[\s\S]*?Этикетка 56\*60'[\s\S]*?\}\s*,\s*\]/m
if (regex.test(content)) {
  updatedContent = content.replace(regex, dynamicArrayCode)
} else {
  console.log("Could not find the exact array literal to replace.")
  // Fallback: simple string replacement ignoring spaces
  // This is risky so let's just use the regex
}

fs.writeFileSync('src/components/production/ShopReportContent.tsx', updatedContent)
console.log('Fixed UI mapping for Matrix')

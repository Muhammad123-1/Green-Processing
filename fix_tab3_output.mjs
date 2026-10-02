import fs from 'fs'

let content = fs.readFileSync('src/components/production/ShopReportContent.tsx', 'utf8')

const regex2 = /\[\s*\{\s*n:\s*'Салат Айсберг нарезанный'[\s\S]*?Айсберг \(листовой\)'[\s\S]*?\}\s*,\s*\]/m
const dynamicOutputArrayCode = `(function() {
                          const exp = expenses.find(e => e.date === reportDate);
                          const o = exp?.outputs || {};
                          return [
                            { n: 'Салат Айсберг нарезанный', v1: o['Салат Айсберг нарезанный']?.kg || '', v2: o['Салат Айсберг нарезанный']?.upakovki || '', v3: o['Салат Айсберг нарезанный']?.korobki || '' },
                            { n: 'Томаты целые', v1: o['Томаты целые']?.kg || '', v2: o['Томаты целые']?.upakovki || '', v3: o['Томаты целые']?.korobki || '' },
                            { n: 'Лук салатный белый нарезанный', v1: o['Лук салатный белый нарезанный']?.kg || '', v2: o['Лук салатный белый нарезанный']?.upakovki || '', v3: o['Лук салатный белый нарезанный']?.korobki || '' },
                            { n: 'Коул Слоу', v1: o['Коул Слоу']?.kg || '', v2: o['Коул Слоу']?.upakovki || '', v3: o['Коул Слоу']?.korobki || '' },
                            { n: 'Лимон', v1: o['Лимон']?.kg || '', v2: o['Лимон']?.upakovki || '', v3: o['Лимон']?.korobki || '' },
                            { n: 'Огурцы свежие', v1: o['Огурцы свежие']?.kg || '', v2: o['Огурцы свежие']?.upakovki || '', v3: o['Огурцы свежие']?.korobki || '' },
                            { n: 'Микс салат', v1: o['Микс салат']?.kg || '', v2: o['Микс салат']?.upakovki || '', v3: o['Микс салат']?.korobki || '' },
                            { n: 'Мята', v1: o['Мята']?.kg || '', v2: o['Мята']?.upakovki || '', v3: o['Мята']?.korobki || '' },
                            { n: 'Сельдерей', v1: o['Сельдерей']?.kg || '', v2: o['Сельдерей']?.upakovki || '', v3: o['Сельдерей']?.korobki || '' },
                            { n: 'Айсберг (листовой)', v1: o['Айсберг (листовой)']?.kg || '', v2: o['Айсберг (листовой)']?.upakovki || '', v3: o['Айсберг (листовой)']?.korobki || '' },
                          ]
                        })()`

if (regex2.test(content)) {
  content = content.replace(regex2, dynamicOutputArrayCode)
  console.log("Found and replaced output array")
} else {
  console.log("Could not find output array regex")
}

fs.writeFileSync('src/components/production/ShopReportContent.tsx', content)

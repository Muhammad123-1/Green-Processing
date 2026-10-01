import fs from 'fs'
let c = fs.readFileSync('src/app/(dashboard)/surveys/page.tsx', 'utf8')

// Replace ALL formatDual single-quotes strings containing an apostrophe inside them.
// E.g. 'Bo'sh...' -> "Bo'sh..."
c = c.replace(/'Bo'sh qoldirsangiz — muddat cheklanmaydi'/g, `"Bo'sh qoldirsangiz — muddat cheklanmaydi"`)
c = c.replace(/'Bo'sh qoldirsangiz — muddat cheklanmaydi"/g, `"Bo'sh qoldirsangiz — muddat cheklanmaydi"`)
c = c.replace(/'Hali javob yo\\'q'/g, `"Hali javob yo'q"`)
c = c.replace(/'Hali javob yo'q'/g, `"Hali javob yo'q"`)
c = c.replace(/'Noma\\'lum restoran'/g, `"Noma'lum restoran"`)
c = c.replace(/'Noma'lum restoran'/g, `"Noma'lum restoran"`)
c = c.replace(/'Yangi so'rovnoma yaratish'/g, `"Yangi so'rovnoma yaratish"`)
c = c.replace(/'So'rovnomalar'/g, `"So'rovnomalar"`)
c = c.replace(/'So'rovnoma nomi'/g, `"So'rovnoma nomi"`)
c = c.replace(/'Standart GREEN PROCESSING savollarini qo'shish \(11 ta savol\)'/g, `"Standart GREEN PROCESSING savollarini qo'shish (11 ta savol)"`)
c = c.replace(/'Hali so'rovnoma yo'q'/g, `"Hali so'rovnoma yo'q"`)
c = c.replace(/'Yuqoridagi tugmani bosib yangi so'rovnoma yarating'/g, `"Yuqoridagi tugmani bosib yangi so'rovnoma yarating"`)
c = c.replace(/'O'chirilgan'/g, `"O'chirilgan"`)

fs.writeFileSync('src/app/(dashboard)/surveys/page.tsx', c)

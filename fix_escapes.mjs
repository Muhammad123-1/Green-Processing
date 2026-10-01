import fs from 'fs'
let c = fs.readFileSync('src/app/(dashboard)/surveys/page.tsx', 'utf8')
c = c.replace(/\\+'/g, "'") // replace \' with ' (Wait, if it's already inside '', replacing with ' will break it!)
// Better yet, just use "Hali javob yo'q" with double quotes:
c = c.replace(/'Hali javob yo\\+'q'/g, `"Hali javob yo'q"`)
c = c.replace(/'Noma\\+'lum restoran'/g, `"Noma'lum restoran"`)
c = c.replace(/'Haqiqatan ham o\\+'chirmoqchimisiz\?'/g, `"Haqiqatan ham o'chirmoqchimisiz?"`)
c = c.replace(/'Yangi so\\+'rovnoma yaratish'/g, `"Yangi so'rovnoma yaratish"`)
c = c.replace(/'So\\+'rovnomalar'/g, `"So'rovnomalar"`)
c = c.replace(/'So\\+'rovnoma nomi'/g, `"So'rovnoma nomi"`)
c = c.replace(/'Bo\\+'sh qoldirsangiz/g, `"Bo'sh qoldirsangiz`)
c = c.replace(/cheklanmaydi'/g, `cheklanmaydi"`)
c = c.replace(/'Standart GREEN PROCESSING savollarini qo\\+'shish \(11 ta savol\)'/g, `"Standart GREEN PROCESSING savollarini qo'shish (11 ta savol)"`)
fs.writeFileSync('src/app/(dashboard)/surveys/page.tsx', c)

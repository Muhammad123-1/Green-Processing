# 🏢 Kiruvchi Xomashyo Nazorat Tizimi
**Foydalanish bo'yicha yo'riqnoma**

Ushbu dastur korxonaga kelayotgan xomashyolarni qabul qilish, ro'yxatga olish va ularning **Excel aktlarini avtomatik tarzda** tayyorlash uchun mo'ljallangan. Dastur to'liq internetsiz (oflayn) ishlaydi.

---

## 🚀 1. Dasturni ishga tushirish
Dasturni ishlatish uchun hech qanday murakkab o'rnatishlar kerak emas.
1. Sizga berilgan **`Exzel Ovto Dasturi.zip`** (arxiv) faylini kompyuteringizga (masalan: Rabochiy stolga) papka qilib chiqarib oling.
2. Papka ichiga kiring va **`Exzel Ovto.exe`** belgisini ikki marta bosing.
3. Dastur ochilganda quyidagi ma'lumotlar bilan tizimga kiring:
   - **Login:** `admin`
   - **Parol:** `admin123`

---

## 📱 2. Sahifalar va ularning vazifasi

Dasturning chap tomonida menyu joylashgan. Har bir menyu nima vazifa bajarishini quyida ko'rib chiqamiz:

### 🏠 Bosh sahifa (Dashboard)
Bu tizimning "yuzi". Bu yerda siz umumiy holatni bir qarashda ko'rasiz.
- Bugun jami nechta mashina mol keldi?
- Nechtasi qabul qilindi, nechtasi rad etildi?
- Eng ko'p kelayotgan mahsulotlar grafikasi qanday?

### 📝 Yangi akt qo'shish (Eng ko'p ishlatiladigan joy)
Yangi xomashyo zavodga kirib kelganda shu sahifaga kirasiz. 
1. **Ta'minotchi va Mahsulotni** tanlaysiz.
2. **Miqdori, partiya raqami va haroratini** kiritasiz.
3. **Sifati (Rangi, hidi)** bo'yicha laboratoriya xulosasini belgilaysiz.
4. **"Qabul qilindi"** yoki **"Rad etildi"** xulosasini tanlab, Saqlash tugmasini bosasiz.
> *Foydasi:* Dastur aynan shu ma'lumotlar asosida chiroyli Excel faylni avtomatik tarzda shakllantirib beradi va uni yuklab olishingiz mumkin.

### 📋 Aktlar tarixi
Oldin kiritilgan barcha hujjatlar saqlanadigan arxivingiz.
- Bu yerdan eski hujjatlarni oson qidirib topasiz.
- Agar kiritishda xato qilgan bo'lsangiz, **"Tahrirlash"** (qalamcha) tugmasi orqali to'g'rilab qo'yishingiz mumkin.
- Istalgan hujjatning Excel variantini qayta ko'chirib olishingiz mumkin.

### 📦 Mahsulotlar katalogi
Zavodingizga kiruvchi barcha xomashyolar (masalan: un, shakar, kakao) ro'yxati shu yerga kiritib qo'yiladi.
Buni faqat bir marta bajarasiz. Shundan so'ng, yangi akt qo'shayotganda ularni qayta-qayta yozmasdan, tayyor ro'yxatdan tanlaysiz.
- Har bir mahsulot uchun standart saqlash haroratini yozib qo'ysangiz, tizim harorat buzilganda o'zi ogohlantiradi.

### 🚛 Ta'minotchilar
Sizga xomashyo yetkazib beradigan firmalar ro'yxati (Masalan: "AgroFirma MChJ"). Firmalarning telefon va manzillari ham shu yerda biriktirib qo'yiladi.

### 📊 Hisobotlar
Rahbariyat uchun statistik ma'lumotlar joyi. 
Siz u yerdan yil va oylar kesimida qaysi firmadan ko'proq xomashyo kelgani va ularning rad etilish foizlarini kuzatishingiz mumkin.

### 👥 Foydalanuvchilar
Dasturdan foydalanuvchi xodimlarni boshqarish.
- **Admin:** Dasturga to'liq egalik qiladi (hamma narsani ko'radi va o'chira oladi).
- **Operator:** Faqatgina yangi akt qo'shish va ko'rish imkoniga ega (o'chira olmaydi).

### 💾 Zaxira nusxa (Juda muhim!)
Kompyuterda biror nosozlik bo'lib, dastur o'chib ketsa, ma'lumotlar yo'qolmasligi uchun kerak bo'ladi.
Kun yoki hafta oxirida shu sahifaga kirib, **"Zaxira yaratish"** tugmasini bosing va olingan faylni (masalan fleshkaga) saqlab qo'ying. Kelajakda biror muammo bo'lsa, xuddi shu yerdan barcha eski ma'lumotlarni qayta tiklash mumkin.

### ⚙️ Sozlamalar
Bu yerdan korxona nomi va boshqa o'zgaruvchilarni sozlashingiz mumkin. Kiritilgan o'zgarishlar barcha avtomatik shakllanadigan hujjatlarda aks etadi.

---

## 📝 3. Excel shablonni o'zgartirish

Dastur siz kiritgan ma'lumotlarni dizaynli Excel (ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx) fayliga to'g'ridan to'g'ri yozib beradi.

Buning uchun dasturning (Exe faylning yonida joylashgan) `templates` papkasida shablon fayl turadi. Agar siz katakchalar o'rnini almashtirmoqchi bo'lsangiz, o'sha faylni oching va kerakli katakka inglizcha (qavslar ichida) maxsus kodlarni yozing:

- `{{DATE}}` — Hujjat sanasi yoziladigan joy
- `{{ACT_NUMBER}}` — Akt raqami
- `{{SUPPLIER}}` — Ta'minotchi (firma nomi)
- `{{PRODUCT}}` — Mahsulot nomi
- `{{BATCH}}` — Partiya raqami
- `{{QUANTITY}}` — Qancha miqdorda kelgani
- `{{CONCLUSION}}` — Yakuniy xulosa

*(Siz bu kodlarni Excelning qayeriga yozsangiz, dastur to'g'ri kelgan raqamlarni aynan o'sha katakka o'rnatib qaytaradi).*

---

## ❓ 4. Tez-tez so'raladigan savollar

**Savol: Internet umuman bo'lmasa ham ishlaydimi?**
Javob: Ha, bu dastur aynan shunday vaziyatlar uchun oflayn rejimga moslab yozilgan.

**Savol: Kechagi kun yoki eski sana bilan akt kiritsa bo'ladimi?**
Javob: Ha, "Yangi akt qo'shish" bo'limida sanani qo'lda tanlash imkoniyati bor.

**Savol: Noto'g'ri kiritib qo'ysam nima qilaman?**
Javob: "Aktlar tarixi" bo'limiga o'ting, adashgan aktni izlab topib, "Qalamcha" tugmasi orqali ma'lumotni tahrirlang. Hujjat yangilanadi va o'sha holatida to'g'ri variantini Excel qilib yuklab olishingiz mumkin.

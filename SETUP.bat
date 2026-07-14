@echo off
echo ================================================
echo   KIRUVCHI XOMASHYO - SETUP
echo ================================================
echo.

:: Check Node.js
where node > nul 2>&1
if %errorlevel% neq 0 (
    echo [XATO] Node.js topilmadi!
    echo Node.js ni https://nodejs.org dan yuklab urnating
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version
echo.

:: Install npm packages
echo [1/5] npm install - kutubxonalar urnatilmoqda...
call npm install
if %errorlevel% neq 0 (
    echo [XATO] npm install muvaffaqiyatsiz!
    pause
    exit /b 1
)
echo [OK] Kutubxonalar urnatildi
echo.

:: Copy Excel template
echo [2/5] Templates papkasini tayyorlash...
if not exist "templates" mkdir templates
if exist "ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx" (
    copy /y "ВХОДНОЕ_СЫРЬЕ_АКТЫ 2026.xlsx" "templates\" > nul
    echo [OK] Excel shablon nusxalandi
) else (
    echo [OGOHLANTIRISH] Excel shablon topilmadi
)
echo.

:: Prisma generate
echo [3/5] Prisma client generatsiya...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [OGOHLANTIRISH] Prisma generate muammo, davom etamiz...
)
echo.

:: Prisma db push
echo [4/5] Malumotlar bazasini yaratish...
call npx prisma db push
if %errorlevel% neq 0 (
    echo [XATO] Prisma db push muvaffaqiyatsiz!
    pause
    exit /b 1
)
echo [OK] Malumotlar bazasi yaratildi
echo.

:: Seed
echo [5/5] Boshlangich malumotlarni yuklash...
call npx prisma db seed 2>nul
if %errorlevel% neq 0 (
    echo [OGOHLANTIRISH] Seed xatosi - davom etamiz
)
echo.

echo ================================================
echo   ORNATISH MUVAFFAQIYATLI YAKUNLANDI!
echo ================================================
echo.
echo Dasturni ishga tushirish:  START.bat
echo Yoki terminal:  npm run dev
echo Keyin brauzer:  http://localhost:3000
echo.
pause

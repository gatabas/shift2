@echo off
echo ========================================
echo  SHIFT BACKEND SERVIS KURULUMU
echo ========================================
echo.

:: 1. PM2'nin kurulu olup olmadigini kontrol et
echo [1/5] PM2 kontrolu...
call npm list -g pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 bulunamadi, kuruluyor...
    call npm install -g pm2
    call npm install -g pm2-windows-startup
    echo PM2 kuruldu!
) else (
    echo PM2 zaten kurulu!
)
echo.

:: 2. Mevcut servisi durdur (varsa)
echo [2/5] Mevcut servis kontrol ediliyor...
call pm2 delete shift-backend >nul 2>&1
echo.

:: 3. Server.js'i baslat
echo [3/5] Server.js baslatiliyor...
call pm2 start server.js --name "shift-backend"
echo.

:: 4. Windows baslangicina ekle
echo [4/5] Windows baslangicina ekleniyor...
call pm2 save
call pm2-startup install
echo.

:: 5. Durum kontrol
echo [5/5] Servis durumu:
call pm2 list
echo.

echo ========================================
echo  KURULUM TAMAMLANDI!
echo ========================================
echo.
echo Servis bilgisayar her acildiginda otomatik baslar.
echo.
echo Komutlar:
echo   - Durumu gor:    pm2 list
echo   - Loglari gor:   pm2 logs shift-backend
echo   - Durdur:        pm2 stop shift-backend
echo   - Baslat:        pm2 start shift-backend
echo   - Yeniden baslat: pm2 restart shift-backend
echo.
pause

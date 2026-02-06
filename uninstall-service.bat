@echo off
echo ========================================
echo  SHIFT BACKEND SERVIS KALDIR
echo ========================================
echo.
echo UYARI: Bu islem servisi tamamen kaldirir!
echo Windows baslangicinda artik calismayacak.
echo.
set /p confirm="Devam etmek istiyor musunuz? (E/H): "
if /i not "%confirm%"=="E" (
    echo Islem iptal edildi.
    pause
    exit /b
)
echo.

echo [1/3] Servisi durduruluyor...
call pm2 stop shift-backend
echo.

echo [2/3] Servis siliniyor...
call pm2 delete shift-backend
call pm2 save
echo.

echo [3/3] Windows baslangictan kaldiriliyor...
call pm2-startup uninstall
echo.

echo ========================================
echo  SERVIS KALDIRILDI!
echo ========================================
echo.
pause

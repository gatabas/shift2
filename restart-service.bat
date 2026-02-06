@echo off
echo ========================================
echo  SHIFT BACKEND YENIDEN BASLAT
echo ========================================
echo.

call pm2 restart shift-backend
echo.

echo Servis yeniden baslatildi!
call pm2 list
echo.
pause

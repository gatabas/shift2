@echo off
echo ========================================
echo  SHIFT BACKEND BASLAT
echo ========================================
echo.

call pm2 start shift-backend
echo.

echo Servis baslatildi!
call pm2 list
echo.
pause

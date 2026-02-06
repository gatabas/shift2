@echo off
echo ========================================
echo  SHIFT BACKEND DURDUR
echo ========================================
echo.

call pm2 stop shift-backend
echo.

echo Servis durduruldu!
call pm2 list
echo.
pause

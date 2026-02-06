@echo off
echo ========================================
echo  SHIFT BACKEND DURUM
echo ========================================
echo.

call pm2 list
call pm2 info shift-backend
echo.
pause

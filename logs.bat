@echo off
echo ========================================
echo  SHIFT BACKEND LOGLARI
echo ========================================
echo.
echo CTRL+C ile cikabilirsiniz
echo.

call pm2 logs shift-backend

@echo off
set "PATH=C:\Users\johnr\nodejs;%PATH%"
echo ========================================================
echo   Starting AI Gravity in Development Mode (Hot Reload)
echo ========================================================
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
npm run dev
pause

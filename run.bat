@echo off
set "PATH=C:\Users\johnr\nodejs;%PATH%"
echo ========================================================
echo   Starting AI Gravity - Annamacharya University Navigator
echo ========================================================
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Starting web server on http://localhost:3000 (Press Ctrl+C to stop)...
npm run start
pause

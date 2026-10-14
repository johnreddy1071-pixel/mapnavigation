@echo off
set "PATH=C:\Users\johnr\nodejs;%PATH%"
echo ========================================================
echo   Running AI Gravity 13-Point QA Verification Suite
echo ========================================================
echo.
npx -y tsx tests/verify_ai_gravity.mjs
echo.
echo Running HTTP End-to-End Tests...
py tests/test_http.py
echo.
pause

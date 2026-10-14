@echo off
set "PATH=C:\Users\johnr\mingit\cmd;C:\Users\johnr\nodejs;%PATH%"
echo ========================================================
echo   Pushing AI Gravity to GitHub:
echo   https://github.com/johnreddy1071-pixel/mapnavigation.git
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   SUCCESS! Your project has been pushed to GitHub.
    echo ========================================================
) else (
    echo.
    echo If GitHub prompted for a password, note that GitHub requires
    echo a Personal Access Token (PAT) or browser authentication.
    echo Create a token at: https://github.com/settings/tokens
)
echo.
pause

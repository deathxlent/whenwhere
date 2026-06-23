@echo off
echo ========================================
echo   WhenWhere Demo
echo ========================================
echo.
echo 
echo http://localhost:8080
echo.
echo Press Ctrl+C Stop the server
echo.

cd /d "%~dp0"
python -m http.server 8080

pause

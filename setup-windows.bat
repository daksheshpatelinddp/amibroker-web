@echo off
echo ========================================================
echo   Setting up AmiBroker Web Platform on Windows PC
echo ========================================================
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js LTS from https://nodejs.org
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo ========================================================
echo   Starting AmiBroker Web on http://localhost:3000
echo ========================================================
call npm run dev
pause

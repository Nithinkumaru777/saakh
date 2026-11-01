@echo off
setlocal enabledelayedexpansion

title Saakh - AI Credit Risk Engine Launcher

echo ===============================================================================
echo   Saakh (Saakh) - AI-Based Loan Eligibility and Risk Assessment System
echo   Course: AI for Finance - CIA-2 - Topic 4
echo   Student: NITHIN KUMAR U  ^|  USN: 2102508611
echo ===============================================================================
echo.

rem Navigate to the project root directory
cd /d "%~dp0"

echo [*] Checking environment prerequisites...

rem Check uv
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'uv' was not found in PATH. Please install uv or run in an active Python environment.
    pause
    exit /b 1
)

rem Check pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'pnpm' was not found in PATH. Please install pnpm (npm install -g pnpm).
    pause
    exit /b 1
)

echo [*] Starting FastAPI Backend on http://localhost:8000 ...
start "Saakh Backend API (Port 8000)" cmd /k "cd /d "%~dp0services\api" && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [*] Starting Next.js Web Frontend on http://localhost:3000 ...
start "Saakh Web App (Port 3000)" cmd /k "cd /d "%~dp0apps\web" && pnpm dev"

echo.
echo [*] Waiting 4 seconds for servers to initialize...
ping -n 5 127.0.0.1 >nul 2>&1

echo [*] Launching Saakh Web Application in browser...
start http://localhost:3000

echo.
echo ===============================================================================
echo   SERVICES RUNNING SUCCESSFULLY
echo ===============================================================================
echo   Web Application: http://localhost:3000
echo   FastAPI Swagger: http://localhost:8000/docs
echo   Health Check:    http://localhost:8000/api/health
echo.
echo   To shut down services, close the individual terminal windows or run:
echo   taskkill /F /IM uvicorn.exe /T 2>nul
echo   taskkill /F /IM node.exe /T 2>nul
echo ===============================================================================
echo.
pause

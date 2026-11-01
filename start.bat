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

echo [*] Starting FastAPI Backend on port 8000 ...
start "Saakh Backend API (Port 8000)" "%~dp0services\api\run.bat"

echo [*] Starting Next.js Web Frontend on port 3000 ...
start "Saakh Web App (Port 3000)" "%~dp0apps\web\run.bat"

echo.
echo [*] Waiting for web application and backend to become ready...
echo [*] Opening default web browser as soon as server responds...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false;" ^
  "for ($i=0; $i -lt 30; $i++) {" ^
  "  try {" ^
  "    $res = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1;" ^
  "    if ($res.StatusCode -eq 200) { $ready = $true; break }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 600" ^
  "};" ^
  "Start-Process 'http://localhost:3000'"

echo.
echo ===============================================================================
echo   SERVICES RUNNING SUCCESSFULLY
echo ===============================================================================
echo   Web Application: http://localhost:3000
echo   FastAPI Swagger: http://localhost:8000/docs
echo   Health Check:    http://localhost:8000/api/health
echo.
echo   If browser tab did not open automatically, visit: http://localhost:3000
echo   To shut down services, run stop.bat or close the server terminal windows.
echo ===============================================================================
echo.
pause

@echo off
setlocal
title Saakh - AI-Based Loan Eligibility and Risk Assessment System
set "PATH=%PATH%;C:\Users\THUNDERX\.local\bin;C:\Program Files\nodejs;C:\Users\THUNDERX\AppData\Roaming\npm"
cd /d "%~dp0"

echo ============================================================================
echo   SAAKH -- AI-Based Loan Eligibility and Risk Assessment System
echo   AI for Finance (CIA-2) -- Topic 4
echo   Student : NITHIN KUMAR U
echo   USN     : 2102508611
echo ============================================================================
echo.

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/3] Starting FastAPI Backend Server on http://localhost:8000 ...
    start "Saakh Backend API" /D "services\api" cmd /k run.bat
) else (
    echo [1/3] FastAPI Backend Server is already running on http://localhost:8000
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [2/3] Starting Next.js Web Application on http://localhost:3000 ...
    start "Saakh Web App" /D "apps\web" cmd /k run.bat
) else (
    echo [2/3] Next.js Web Application is already running on http://localhost:3000
)

echo [3/3] Waiting for Web Server (http://localhost:3000) to become ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 45; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop; if ($r.StatusCode -eq 200) { break } } catch {} Start-Sleep -Seconds 1 }"

echo.
echo Opening http://localhost:3000 in your default browser...
start "" "http://localhost:3000"

echo.
echo ============================================================================
echo   Web App      : http://localhost:3000
echo   FastAPI Docs : http://localhost:8000/docs
echo   Health Check : http://localhost:8000/api/health
echo ============================================================================
echo.
echo Both servers are running and http://localhost:3000 has been opened in your browser.
echo Run stop.bat at any time to stop all servers.
echo.
pause
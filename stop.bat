@echo off
title Stop Saakh Services

echo ===============================================================================
echo   Stopping Saakh Services (Backend and Frontend)
echo ===============================================================================
echo.

echo [*] Terminating Python/Uvicorn processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Terminating Node.js/Next.js processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] All Saakh services stopped.
echo.
pause

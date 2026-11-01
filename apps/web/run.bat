@echo off
title Saakh Web Application (Port 3000)
cd /d "%~dp0"
echo [*] Launching Saakh Next.js Frontend on http://localhost:3000 ...
pnpm dev
echo.
echo [!] Frontend process stopped.
pause

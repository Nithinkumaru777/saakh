@echo off
title Saakh - Next.js Web App (Port 3000)
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Users\THUNDERX\AppData\Roaming\npm;C:\Users\THUNDERX\.local\bin"
cd /d "%~dp0"
echo ============================================================================
echo   SAAKH (Topic 4: AI Loan Eligibility ^& Risk Assessment)
echo   NITHIN KUMAR U ^| USN: 2102508611
echo   Starting Next.js Web Application on http://localhost:3000 ...
echo ============================================================================
if exist ".next\BUILD_ID" (
    node "node_modules\next\dist\bin\next" start --port 3000
) else (
    node "node_modules\next\dist\bin\next" dev --port 3000
)
pause
@echo off
title Saakh - FastAPI Backend (Port 8000)
set "PATH=%PATH%;C:\Users\THUNDERX\.local\bin;C:\Program Files\nodejs;C:\Users\THUNDERX\AppData\Roaming\npm"
cd /d "%~dp0"
echo ============================================================================
echo   SAAKH (Topics 4: AI Loan Eligibility ^& Risk Assessment)
echo   NITHIN KUMAR U ^| USN: 2102508611
echo   Starting FastAPI + XGBoost + TreeSHAP Backend on http://localhost:8000 ...
echo ============================================================================
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
) else (
    uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
)
pause
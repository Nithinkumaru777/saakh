@echo off
title Saakh Backend API (Port 8000)
cd /d "%~dp0"
echo [*] Launching Saakh FastAPI Risk Engine on http://localhost:8000 ...
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo.
echo [!] Backend process stopped.
pause

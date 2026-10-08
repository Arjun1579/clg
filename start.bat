@echo off
echo ====================================================
echo Starting Hospital Intelligence Platform
echo ====================================================
echo.

echo Starting FastAPI Backend...
cd backend
start cmd /k "uv run uvicorn main:app --reload"
cd ..

echo Starting React Frontend...
cd frontend
start cmd /k "node ./node_modules/vite/bin/vite.js"
cd ..

echo ====================================================
echo Both servers are starting in separate windows.
echo - Backend API: http://localhost:8000
echo - Frontend UI: http://localhost:5173
echo ====================================================
pause

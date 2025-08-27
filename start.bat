@echo off
echo Starting Image Buy App...
echo.

echo 1. Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo 2. Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 3. Starting Frontend...
start "Frontend" cmd /k "cd client && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul

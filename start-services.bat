@echo off
echo ================================================================
echo IDXR Identity Cross-Resolution System - Service Startup
echo ================================================================
echo.

REM Check if required dependencies exist
echo [INFO] Checking dependencies...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "backend\matching-engine\main.py" (
    echo [ERROR] Please run this script from the IDXR root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [OK] Dependencies check passed
echo.

REM Install Python dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    echo.
)

REM Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
npm install
echo.

REM Create logs directory
if not exist "logs" mkdir logs

echo [INFO] Starting IDXR services...
echo.

REM Start FastAPI Matching Engine (Port 3000)
echo [1/3] Starting FastAPI Matching Engine on port 3000...
start "IDXR-MatchingEngine" cmd /k "cd backend\matching-engine && python main.py > ..\..\logs\matching-engine.log 2>&1"

REM Wait a moment for the service to start
timeout /t 3 /nobreak >nul

REM Start Node.js API Server (Port 3001)
echo [2/3] Starting Node.js API Server on port 3001...
start "IDXR-APIServer" cmd /k "set PORT=3001 && node backend\server.js > logs\api-server.log 2>&1"

REM Wait a moment for the service to start
timeout /t 2 /nobreak >nul

REM Start Frontend HTTP Server (Port 8080)
echo [3/3] Starting Frontend Server on port 8080...
start "IDXR-Frontend" cmd /k "cd frontend && python -m http.server 8080 > ..\logs\frontend.log 2>&1"

echo.
echo ================================================================
echo IDXR Services Started Successfully!
echo ================================================================
echo.
echo Service URLs:
echo   Frontend Interface:     http://localhost:8080
echo   FastAPI Docs:          http://localhost:3000/docs
echo   API Health Check:      http://localhost:3001/api/health
echo   Matching Engine Health: http://localhost:3000/health
echo.
echo Service Windows:
echo   - IDXR-MatchingEngine (FastAPI on port 3000)
echo   - IDXR-APIServer (Node.js on port 3001)
echo   - IDXR-Frontend (HTTP Server on port 8080)
echo.
echo Logs are available in the 'logs' directory
echo.
echo [INFO] Waiting 5 seconds then opening frontend in browser...
timeout /t 5 /nobreak >nul

REM Open frontend in default browser
start http://localhost:8080

echo.
echo [INFO] All services are now running!
echo [INFO] Close the service windows or press Ctrl+C in each to stop services
echo.
pause
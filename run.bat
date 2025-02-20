@echo off
echo Starting Game Chatbot...

REM Check Node.js installation
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 14 or later
    pause
    exit /b 1
)

REM Check for node_modules
if not exist "node_modules" (
    echo Error: Dependencies not installed
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Check OpenAI API key
if not exist ".env" (
    echo Error: .env file not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Check for game_info.json
if not exist "data\game_info.json" (
    echo Error: game_info.json not found
    echo Please add game data to data\game_info.json
    pause
    exit /b 1
)

REM Start the application
echo Starting application...
npm start

pause
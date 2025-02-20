@echo off
echo Setting up Game Chatbot environment...

REM Check Node.js installation
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 14 or later
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Create necessary directories
echo Creating directories...
if not exist "data" mkdir data
if not exist "data\models" mkdir data\models
if not exist "src\utils" mkdir src\utils

REM Check for .env file
if not exist ".env" (
    echo Creating .env file...
    echo OPENAI_API_KEY=your-api-key-here > .env
    echo PORT=3000 >> .env
    echo Please edit .env file and add your OpenAI API key
)

REM Check for game_info.json
if not exist "data\game_info.json" (
    echo Creating sample game_info.json...
    echo { "games": [] } > data\game_info.json
    echo Please add your game data to data\game_info.json
)

echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file and add your OpenAI API key
echo 2. Add game data to data\game_info.json
echo 3. Run the application using run.bat
echo.
pause 
@echo off
echo ================================================
echo        Uboho Dashboard Setup Script
echo ================================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Then restart this script.
    pause
    exit /b 1
) else (
    echo [OK] Node.js is installed
)

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo npm usually comes with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
) else (
    echo [OK] npm is installed
)

echo.
echo Installing project dependencies...
echo This may take a few minutes...
echo.

npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo.
    echo Troubleshooting steps:
    echo 1. Clear npm cache: npm cache clean --force
    echo 2. Delete node_modules folder and package-lock.json
    echo 3. Run: npm install
    pause
    exit /b 1
)

echo.
echo ================================================
echo           Setup Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Run 'npm run dev' to start the development server
echo 2. Open your browser to http://localhost:5173
echo 3. Start developing!
echo.

set /p startServer="Would you like to start the development server now? (y/N): "
if /i "%startServer%"=="y" (
    echo.
    echo Starting development server...
    echo Press Ctrl+C to stop the server when you're done.
    echo.
    npm run dev
) else (
    echo.
    echo Setup complete! Run 'npm run dev' when you're ready to start.
    echo.
)

pause

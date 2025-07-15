@echo off
REM Change directory to the script's location to ensure paths are correct
cd /d "%~dp0"

echo Starting BoomServer in the background...
REM Start the Node.js server silently in the background
start "BoomServer" /B "%~dp0\bin\Nodejs\node.exe" "%~dp0\backend\src\server.js"

echo Waiting for server to initialize...
REM Wait for 2 seconds to give the server time to start
ping 127.0.0.1 -n 3 > nul

echo Opening BoomServer in your browser.
REM Open the frontend in the default browser
start http://localhost:8000
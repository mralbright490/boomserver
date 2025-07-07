@echo off
ECHO Starting BoomServer...
ECHO This window must remain open for the server to run.
ECHO.

:: Get the directory where this script is located (e.g., C:\Program Files\BoomServer)
set "SCRIPT_DIR=%~dp0"

:: THE FIX: Define the full, absolute path to our bundled node.exe
:: It's now located in {app}\bin\Nodejs\node.exe
set "NODE_EXE=%SCRIPT_DIR%bin\Nodejs\node.exe"

:: Change the working directory to our backend folder so the server can find its files
cd /d "%SCRIPT_DIR%backend"

ECHO [INFO] Launching server from: %cd%
ECHO.

:: Execute the server using the full path to our bundled Node.js
"%NODE_EXE%" src/server.js

ECHO.
ECHO --=[ BoomServer has stopped. ]=--
PAUSE
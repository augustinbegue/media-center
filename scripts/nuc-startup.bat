@echo off
REM Media Center NUC Startup Script
REM Starts the NUC agent then launches Chrome in kiosk mode

setlocal

REM Paths — adjust as needed
set BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe
set AGENT_DIR=%~dp0..\apps\nuc-agent
set DASHBOARD_URL=https://dashboard.server.begue.cc
set CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe

REM Agent config — override via env or edit here
set WS_PORT=9100
set UXPLAY_PATH=%USERPROFILE%\bin\uxplay.exe
set UXPLAY_ARGS=

echo [startup] Starting NUC agent...
start "NUC Agent" /MIN "%BUN_PATH%" run --cwd "%AGENT_DIR%" src/index.ts

REM Give agent a moment to start
timeout /t 2 /nobreak >nul

echo [startup] Launching Chrome kiosk...
start "" "%CHROME_PATH%" ^
  --kiosk ^
  --noerrdialogs ^
  --disable-infobars ^
  --disable-session-crashed-bubble ^
  --disable-features=TranslateUI ^
  --no-first-run ^
  --start-fullscreen ^
  "%DASHBOARD_URL%"

echo [startup] Done.

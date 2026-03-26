@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "back-end\venv\Scripts\python.exe" (
  echo 먼저 setup.bat 을 실행해 가상환경을 만드세요.
  pause
  exit /b 1
)

echo [MeCa] 백엔드 / 프론트를 각각 새 창에서 실행합니다.
echo   API: http://127.0.0.1:5000
echo   웹: http://localhost:3000
echo   각 창에서 Ctrl+C 로 종료하거나 창을 닫으면 됩니다.
echo.

start "MeCa API" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%~dp0back-end'; Write-Host 'Flask API' -ForegroundColor Green; .\venv\Scripts\python.exe app.py"
timeout /t 1 /nobreak >nul
start "MeCa Web" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%~dp0frontend'; Write-Host 'React' -ForegroundColor Cyan; npm start"

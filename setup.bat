@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [MeCa] 필수 라이브러리 설치 (PowerShell로 setup.ps1 실행^)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (
  echo.
  echo 설치 중 오류가 났습니다.
  pause
  exit /b 1
)
echo.
pause

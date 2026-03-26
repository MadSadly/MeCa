@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [MeCa] 한 터미널에서 API + 웹 동시 실행 (종료: Ctrl+C^)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-dev.ps1"
if errorlevel 1 pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "back-end\venv\Scripts\python.exe" (
    echo 먼저 setup.bat 을 실행하세요.
    pause
    exit /b 1
)

if not exist "node_modules\concurrently" (
    echo [MeCa] 루트에 concurrently 설치 중...
    call npm install
    if errorlevel 1 (
        echo npm install 실패
        pause
        exit /b 1
    )
)

echo.
echo [MeCa] 이 창에서 API(5000) + 웹(3000) 동시 실행
echo   끄기: 이 창에서 Ctrl+C 로 종료
echo   웹: http://localhost:3000   API: http://127.0.0.1:5000
echo   (백그라운드가 아니라 이 CMD 창이 계속 실행됩니다.)
echo.

call npm run dev

echo.
echo 서버가 종료되었습니다.
pause

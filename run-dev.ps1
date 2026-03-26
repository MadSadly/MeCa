# 프로젝트 루트에서 실행: 한 터미널에서 API(5000) + 웹(3000) 동시 실행
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$be = Join-Path $root "back-end"
$py = Join-Path $be "venv\Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Host "먼저 .\setup.ps1 을 실행하세요." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $root "node_modules\concurrently"))) {
    Write-Host "루트에서 npm install 실행 중… (concurrently)" -ForegroundColor Yellow
    Set-Location $root
    npm install
}

Set-Location $root
Write-Host "한 터미널에서 백엔드 + 프론트를 띄웁니다. 종료: Ctrl+C" -ForegroundColor Cyan
Write-Host "  웹: http://localhost:3000   API: http://127.0.0.1:5000" -ForegroundColor Green
npm run dev

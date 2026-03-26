# 프로젝트 루트에서 실행: 두 개의 PowerShell 창에서 백엔드 / 프론트를 띄웁니다.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$be = Join-Path $root "back-end"
$fe = Join-Path $root "frontend"

$py = Join-Path $be "venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Write-Host "먼저 .\setup.ps1 을 실행하세요." -ForegroundColor Red
    exit 1
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$be'; .\venv\Scripts\Activate.ps1; Write-Host 'Flask: http://0.0.0.0:5000 (LAN: http://192.168.0.9:5000)' -ForegroundColor Green; python app.py"
)

Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$fe'; Write-Host 'React: http://0.0.0.0:3000 (LAN: http://192.168.0.9:3000)' -ForegroundColor Green; npm start"
)

Write-Host "백엔드·프론트 창이 열렸습니다. 브라우저에서 http://localhost:3000 또는 http://192.168.0.9:3000" -ForegroundColor Cyan

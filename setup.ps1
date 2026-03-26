# 프로젝트 루트에서 실행: .\setup.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "== 백엔드: 가상환경 + pip install ==" -ForegroundColor Cyan
$be = Join-Path $root "back-end"
Set-Location $be
if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    python -m venv venv
}
& ".\venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "== 프론트엔드: npm install ==" -ForegroundColor Cyan
$fe = Join-Path $root "frontend"
Set-Location $fe
npm install

Write-Host "== 환경 파일 복사 (없을 때만) ==" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $be ".env"))) {
    Copy-Item (Join-Path $be ".env.example") (Join-Path $be ".env")
    Write-Host "back-end\.env 를 생성했습니다. HF_TOKEN 등을 채워 주세요."
}
if (-not (Test-Path (Join-Path $fe ".env"))) {
    Copy-Item (Join-Path $fe ".env.example") (Join-Path $fe ".env")
    Write-Host "frontend\.env 를 생성했습니다. LAN 접속 시 REACT_APP_API_URL 을 확인하세요."
}

Set-Location $root
Write-Host "완료. 실행은 .\run-dev.ps1" -ForegroundColor Green

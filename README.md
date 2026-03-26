# Keep 스타일 메모 관리 (Flask + React)

## 아키텍처

| 구분 | 내용 |
|------|------|
| 프론트엔드 | Create React App, 싱글 페이지, 구글 Keep 유사 UI |
| 백엔드 | Flask REST API, JWT 인증 |
| 저장소 | JSON 파일 (`back-end/data/store.json`) — 추후 DB로 교체 가능 |
| 요약 | Hugging Face Inference API (`HF_TOKEN` 필요) |

상세 다이어그램·LAN·DB 전환 계획은 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 참고.

### API 개요

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/memos?q=&tag=`, `POST /api/memos`, `GET|PATCH|DELETE /api/memos/<id>`
- `POST /api/memos/<id>/summarize` — 요약된 **새 메모** 생성 (태그 `요약`)

### LAN 접속 (학원 PC `192.168.0.9` 기준)

1. 방화벽에서 TCP **5000**(API), **3000**(개발 서버) 허용
2. 백엔드는 `0.0.0.0:5000`으로 바인딩됨 (`back-end/.env`의 `FLASK_HOST`)
3. 프론트는 `0.0.0.0:3000`으로 실행 (`npm start` 스크립트)
4. **다른 PC 브라우저**에서 API 주소를 알아야 하므로 `frontend/.env`에 다음을 설정:

```env
REACT_APP_API_URL=http://192.168.0.9:5000
```

같은 PC에서만 쓸 때는 `http://localhost:5000` 으로 두면 됩니다.

## 처음 설치 (한 번)

PowerShell에서 프로젝트 루트로 이동 후:

```powershell
.\setup.ps1
```

- `back-end/.env`, `frontend/.env`가 없으면 `.env.example`을 복사합니다.
- 요약 기능을 쓰려면 `back-end/.env`에 `HF_TOKEN`을 넣으세요.

### CMD / 탐색기에서 (`.bat`)

| 파일 | 설명 |
|------|------|
| `setup.bat` | 더블클릭 또는 `setup.bat` — `setup.ps1`과 동일하게 필수 설치 |
| `run-dev.bat` | 한 터미널에서 API+웹 (`npm run dev`와 동일) |
| `run-dev-two-windows.bat` | 백엔드·프론트를 **각각 새 PowerShell 창**으로 실행 (예전 방식) |

`setup.bat`은 내부에서 PowerShell로 `setup.ps1`을 실행합니다. 실행 정책 때문에 막히면 PowerShell을 **관리자 권한 없이** 열고 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 한 번만 허용해 두면 됩니다.

## 실행 (한 터미널에서 API + 웹 동시)

```powershell
.\run-dev.ps1
```

또는 루트에서:

```powershell
npm run dev
```

종료할 때는 **Ctrl+C** 한 번으로 둘 다 같이 종료됩니다. 브라우저에서 `http://localhost:3000` 접속.

## 수동 실행

**백엔드**

```powershell
cd back-end
.\venv\Scripts\Activate.ps1
python app.py
```

**프론트**

```powershell
cd frontend
npm start
```

## Git 클론 후 동료가 할 일

1. `.\setup.ps1` 또는 `setup.bat`
2. `.\run-dev.ps1` / `run-dev.bat` / `npm run dev` (한 창) 또는 `run-dev-two-windows.bat` (두 창)
3. LAN에서 접속 시 `frontend/.env`의 `REACT_APP_API_URL`을 서버 PC IP로 맞춤

## 백그라운드로 떠 있는 서버 끄기

예전에 터미널 없이 띄워 둔 `node` / `python`이 있으면 **작업 관리자**에서 해당 프로세스를 종료하거나, 해당 터미널에서 **Ctrl+C**로 끕니다. 포트 **3000**·**5000**이 이미 사용 중이면 새로 `run-dev`를 실행할 수 없습니다.

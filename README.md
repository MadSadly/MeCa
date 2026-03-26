# Keep 스타일 메모 관리 (Flask + React)

## 아키텍처

| 구분 | 내용 |
|------|------|
| 프론트엔드 | Create React App, 싱글 페이지, 구글 Keep 유사 UI |
| 백엔드 | Flask REST API, JWT 인증 |
| 저장소 | JSON 파일 (`back-end/data/store.json`) — 추후 DB로 교체 가능 |
| 요약 | Hugging Face Inference API (`HF_TOKEN` 필요) |

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

## 실행

```powershell
.\run-dev.ps1
```

백엔드·프론트가 각각 새 창에서 실행됩니다. 브라우저에서 `http://localhost:3000` 접속.

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

1. `.\setup.ps1`
2. `.\run-dev.ps1`
3. LAN에서 접속 시 `frontend/.env`의 `REACT_APP_API_URL`을 서버 PC IP로 맞춤

# AI 맞춤 신발 사이즈 추천 쇼핑몰

## Backend

Required Python: 3.14.x

FastAPI 백엔드는 `backend/` 디렉토리에 있습니다.

### 가상환경 생성

PowerShell 또는 CMD에서 프로젝트 루트 기준으로 실행합니다.

```bash
py -3.14 -m venv .venv
```

PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

CMD:

```bat
.venv\Scripts\activate.bat
```

### 패키지 설치

```bash
pip install -r backend/requirements.txt
```

### 환경변수

실제 로컬 설정은 `backend/.env`에 작성합니다. `.env` 파일은 커밋하지 않고, 공유용 예시는 `backend/.env.example`만 사용합니다.

```bash
copy backend\.env.example backend\.env
```

### FastAPI 실행

```bash
cd backend
uvicorn app.main:app --reload
```

Swagger 문서:

```text
http://127.0.0.1:8000/docs
```

헬스 체크:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

정상 응답:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### AI 개발 메모

이번 초기화 단계에서는 SAM, OpenCV, PyTorch 실제 구현을 포함하지 않습니다. SAM 모델 weight 파일과 PyTorch 설치는 추후 측정 파이프라인 담당자가 모델 및 실행 환경을 확정한 뒤 추가합니다.

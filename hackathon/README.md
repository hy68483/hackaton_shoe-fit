# hackaton_shoe-fit

AI와 OpenCV를 활용해 사용자의 발 치수를 측정하고, 신발 모델별 맞춤 사이즈를 추천하는 모바일 웹 기반 쇼핑몰 프로젝트입니다.

## Backend

Required Python: 3.14.x

FastAPI 백엔드는 `backend/` 디렉토리에 있습니다.

### 가상환경 생성

프로젝트 루트(`hackathon/`) 기준으로 실행합니다.

```powershell
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

```powershell
pip install -r backend/requirements.txt
```

### 환경변수 설정

실제 로컬 설정은 `backend/.env`에 작성합니다. `.env`는 커밋하지 않고, 공유용 예시는 `backend/.env.example`만 사용합니다.

```powershell
copy backend\.env.example backend\.env
```

### FastAPI 실행

```powershell
cd backend
uvicorn app.main:app --reload
```

Swagger 문서:

```text
http://127.0.0.1:8000/docs
```

Health check:

```powershell
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

### 개발용 seed 데이터

추천 API를 테스트하려면 브랜드, 상품, 상품 사이즈 데이터가 필요합니다. 아래 명령으로 개발용 샘플 데이터를 넣을 수 있습니다.

```powershell
cd backend
python scripts/seed_catalog.py
```

seed 스크립트는 중복 실행해도 기존 데이터를 재사용합니다.

### AI 개발 메모

현재 백엔드에는 SAM/OpenCV 실제 추론 로직을 넣지 않습니다. SAM 모델 weight 파일과 PyTorch 설치는 측정 파이프라인 담당자가 별도 결정 후 추가합니다.

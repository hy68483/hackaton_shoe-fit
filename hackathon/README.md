# hackaton_shoe-fit

Mobile web shoe shopping project with AI-assisted foot measurement and shoe size recommendation.

## Backend

Required Python: 3.14.x

The FastAPI backend is in `backend/`.

### Create Virtual Environment

Run from the project root (`hackathon/`).

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

### Install Dependencies

```powershell
pip install -r backend/requirements.txt
```

### Environment Variables

Local settings go in `backend/.env`. Do not commit `.env`; share only `backend/.env.example`.

```powershell
copy backend\.env.example backend\.env
```

### Run FastAPI

```powershell
cd backend
uvicorn app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Health check:

```powershell
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### Seed Development Catalog Data

Run this before testing product search or recommendations.

```powershell
cd backend
python scripts/seed_catalog.py
```

The seed script is idempotent. Running it multiple times reuses existing rows.

### Run Smoke Test

Start FastAPI first, then run:

```powershell
cd backend
python scripts/smoke_test.py
```

Use a custom API base URL if the server runs on another port:

```powershell
python scripts/smoke_test.py --base-url http://127.0.0.1:8001/api/v1
```

The smoke test covers auth, refresh token, product list, foot profile, recommendations, measurement session creation, image upload, image validation, analysis stub response, and measurement result save/read.

### Promote Admin User

Admin catalog APIs require a user with `role=ADMIN`. Sign up normally first, then run:

```powershell
cd backend
python scripts/promote_admin.py --email admin@example.com
```

After promotion, log in again and use the new access token.

### AI Development Note

SAM/OpenCV inference logic is intentionally not implemented in this backend branch. SAM model weights and PyTorch setup should be added later by the measurement pipeline owner.

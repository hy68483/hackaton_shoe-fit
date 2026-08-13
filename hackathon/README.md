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

### Promote Admin User

Admin catalog APIs require a user with `role=ADMIN`. Sign up normally first, then run:

```powershell
cd backend
python scripts/promote_admin.py --email admin@example.com
```

After promotion, log in again and use the new access token.

### Foot Measurement Pipeline

The image analysis endpoint uses SAM and OpenCV after image validation. Set
`SAM_MODEL_PATH` in `backend/.env` to a local SAM checkpoint; model weights must
not be committed to the repository.

The calibration sheet uses four 40 mm square markers. Their center-to-center
distances are 90 mm horizontally and 176 mm vertically. The service detects all
four marker centers, applies a perspective transform with a uniform mm scale,
segments the foot from the user-selected point, and returns foot length, width,
and segmentation confidence.

```text
POST /api/v1/measurements/sessions/{session_id}/analyze
{
  "point_x": 1500,
  "point_y": 2200
}
```

Use a barefoot photo where the complete outer square of all four markers is
visible. The marker side (40 mm) and the 90 mm × 176 mm center-distance layout
must agree in the image; otherwise the API returns `MARKER_SCALE_MISMATCH`
instead of a potentially incorrect measurement. A missing marker, insufficient
brightness, or excessive blur also returns a retake reason before SAM inference
starts.

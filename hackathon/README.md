# hackaton_shoe-fit

Mobile web shoe shopping project with AI-assisted foot measurement and shoe size recommendation.

## Architecture

```text
React (Vercel)
    -> HTTPS
Nginx (AWS EC2)
    -> FastAPI
    -> PostgreSQL
    -> SAM + OpenCV measurement pipeline
```

The production backend is composed with Docker Compose:

- `nginx`: TLS termination and reverse proxy
- `backend`: FastAPI, SAM, and OpenCV
- `db`: PostgreSQL 16
- `certbot`: Let's Encrypt certificate issuance and renewal

## Load Testing

The deployed API was tested from Korea against the Sydney EC2 instance with
Locust 2.47.0. Each virtual user logged in once, waited 0.5-1.5 seconds
between requests, and repeatedly called products (40%), the authenticated
current-user endpoint (30%), brands (20%), and health (10%). Users spawned
at one per second and each stage ran independently for three minutes.

| Concurrent users | Duration | Requests | Failures | Throughput | Average | p95 |
|---:|---:|---:|---:|---:|---:|---:|
| 5 | 3 min | 725 | 0 | 4.05 req/s | 237 ms | 240 ms |
| 10 | 3 min | 1,417 | 0 | 7.89 req/s | 243 ms | 250 ms |
| 20 | 3 min | 2,757 | 0 | 15.34 req/s | 242 ms | 240 ms |

At 20 users, the observed backend peak was 5.50% CPU and 77.59 MiB of
memory. No 5xx, traceback, or OOM event occurred. Read requests had a median
near 230-240 ms; login averaged 958 ms because of password hashing.

These numbers are a baseline rather than a capacity claim: product and brand
payloads were empty, the run lasted three minutes per stage, and SAM/OpenCV
image analysis was intentionally excluded. The next stages are a
realistic-data soak test of at least ten minutes and isolated AI concurrency
tests at 1, 2, and 3 users.

- Reproducible Locust scenario and commands: [`loadtest/`](loadtest/)
- Full environment, interpretation, and limitations:
  [`docs/load-test-baseline.md`](docs/load-test-baseline.md)
- Database tables and relationships:
  [`docs/database-er-diagram.md`](docs/database-er-diagram.md)

## Backend

Required Python: 3.12.x

The FastAPI backend is in `backend/`.

### Create Virtual Environment

Run from the project root (`hackathon/`).

```powershell
py -3.12 -m venv backend\.venv
```

PowerShell:

```powershell
backend\.venv\Scripts\Activate.ps1
```

CMD:

```bat
backend\.venv\Scripts\activate.bat
```

### Install Dependencies

```powershell
pip install -r backend/requirements.txt
pip install "sqlalchemy[asyncio]"
```

The Docker image installs the SQLAlchemy asyncio extra separately so existing
heavy AI dependency layers can remain cached during container rebuilds.

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

The calibration sheet uses four 25 mm square markers. Their center-to-center
distances are 130 mm horizontally and 216 mm vertically. The service detects all
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
visible. The marker side (25 mm) and the 130 mm × 216 mm center-distance layout
must agree in the image; otherwise the API returns `MARKER_SCALE_MISMATCH`
instead of a potentially incorrect measurement. A missing marker, insufficient
brightness, or excessive blur also returns a retake reason before SAM inference
starts.

### Optional 2.5D Camera/Height Compensation

The ordinary marker homography is exact only on the paper plane. Feet have
height, so the backend can optionally use calibrated camera intrinsics and an
effective measurement height to compensate for parallax. It never enables this
path without `CAMERA_CALIBRATION_PATH`; when the variable is empty, the existing
planar measurement path is retained unchanged.

Calibrate every phone/camera and capture resolution separately. Take at least
10 (preferably 15–25) sharp checkerboard photos with the same rear camera,
lens/zoom, resolution, and approximate capture distance used for foot photos.
The board must be flat and shown at varied positions and tilts. For a 9 by 6
*inner-corner* board whose printed squares measure 20 mm:

```powershell
cd backend
python scripts/calibrate_camera.py "calibration\*.jpg" --columns 9 --rows 6 --square-size-mm 20 --output camera_calibration.json
```

Set the generated file in `backend/.env`:

```text
CAMERA_CALIBRATION_PATH=camera_calibration.json
```

`length_effective_height_mm` and `width_effective_height_mm` are deliberately
separate. Start with their defaults, then tune them against samples measured by
a ruler or scanner; do not use a single global percentage multiplier. The
measurement result internally records whether parallax correction was applied,
the estimated camera height, and its reprojection error. If camera pose cannot
be recovered, the service safely falls back to the original planar result.

## Deployment Checklist

Merge the verified working branch into `main` before deploying.

Frontend:

```powershell
cd front
npm install
npm run build
```

Vercel builds and deploys the frontend from `main`. Set `VITE_API_BASE_URL`
before building so the deployed frontend calls the public HTTPS backend, not
`127.0.0.1`.

Backend with Docker Compose:

```bash
git pull --ff-only origin main
docker compose up -d --build backend nginx
docker compose ps
curl https://your-api-domain.com/api/v1/health
```

The backend image installs the pinned CPU-only PyTorch wheels. This avoids
downloading CUDA runtime packages on CPU-only hosts such as the current EC2
deployment. Before enabling HTTPS, copy `nginx/default.ssl.conf.example` to
the ignored `nginx/default.ssl.conf`, replace every `YOUR_HOSTNAME` with the
API hostname, and add this to the root `.env`:

```text
NGINX_CONFIG_PATH=./nginx/default.ssl.conf
```

Production `backend/.env` must include:

```text
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=change-this-to-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=https://your-frontend-domain.com
SAM_MODEL_PATH=/absolute/path/to/sam_vit_b_01ec64.pth
CAMERA_CALIBRATION_PATH=
```

Do not commit `.env`, `.venv`, `backend/model/`, `.pth`, or `.pt` files.

## Frontend

The React mobile web frontend is in `front/`.

### Source Structure

`App.tsx` owns route composition only. Route components are loaded lazily and
organized by domain under `front/src/features/`:

```text
features/
  account/       account, foot profile, and recommendations
  admin/         admin shell and catalog management
  auth/          login and signup flows
  measurement/   capture, validation, analysis, and result UI
  shared/        shared layout and browser storage helpers
  shop/          home, search, products, wishlist, and cart
```

This keeps feature data and UI close together while preventing unrelated route
code from being included in the initial JavaScript bundle.

### Install Dependencies

```powershell
cd front
npm install
```

### Environment Variables

Local settings go in `front/.env`. Do not commit `.env`; share only `front/.env.example`.

```powershell
copy .env.example .env
```

For production, set `VITE_API_BASE_URL` to the public backend API URL before building:

```text
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Run React

```powershell
npm run dev
```

Default URL:

```text
http://127.0.0.1:5173
```

### Build React

```powershell
npm run build
```

The static deployment output is created in `front/dist`.

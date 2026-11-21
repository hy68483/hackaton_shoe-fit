# Load testing

Run Locust from a separate machine, not from the API server itself.

Copy `.env.example` to `.env` and set the credentials of a dedicated test
account. Leave both values empty to run only the public API tasks.

```powershell
Copy-Item loadtest\.env.example loadtest\.env
```

## Baseline

```powershell
docker run --rm `
  --env-file loadtest\.env `
  -v "${PWD}/loadtest:/mnt/locust" `
  locustio/locust:2.47.0 `
  -f /mnt/locust/locustfile.py `
  --host https://13.210.55.52.sslip.io `
  --headless -u 5 -r 1 -t 3m `
  --html /mnt/locust/results/baseline.html `
  --csv /mnt/locust/results/baseline
```

Increase users in separate runs: 5, 10, then 20. Stop if errors exceed 1%,
memory remains above 85%, or the backend logs show 5xx/OOM errors. Keep SAM
analysis out of this scenario; measure it separately at concurrency 1, 2, and
3.

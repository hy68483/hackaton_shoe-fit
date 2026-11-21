# API load-test baseline

Date: 2026-11-21 (KST)

## Environment

- Target: FastAPI behind Nginx on AWS EC2 (`m7i-flex.large`, 2 vCPU, 8 GiB)
- Database: PostgreSQL 16 in Docker Compose
- Load generator: Locust 2.47.0 in Docker on a Windows PC in Korea
- EC2 region: Sydney (`ap-southeast-2`)
- Scenario: login once per user, then weighted reads of health, products,
  brands, and the authenticated current-user endpoint

## Results

| Users | Duration | Requests | Failures | Throughput | Avg | p95 | Backend CPU | Backend memory |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 1 min | 230 | 0 | 3.87 req/s | 251 ms | 240 ms | 1.39% | 77 MiB |
| 10 | 1 min | 466 | 0 | 7.81 req/s | 252 ms | 250 ms | 2.25% | 77 MiB |
| 20 | 1 min | 925 | 0 | 15.50 req/s | 275 ms | 500 ms | 4.71% | 78 MiB |

At 20 users, login averaged 1.32 seconds and reached 1.71 seconds. The read
endpoints had a median near 230 ms. No 5xx response, traceback, or OOM event
was observed. Database and Nginx memory remained below 40 MiB and 6 MiB.

## Interpretation

The read workload scaled to 20 concurrent users without errors or meaningful
resource pressure. The roughly 230 ms floor is dominated by network distance
between Korea and the Sydney region. Password hashing makes login materially
slower than reads, but it did not saturate this instance at the tested ramp.

This is a baseline, not a capacity claim. Products and brands were empty, all
authenticated users shared one test account, each stage lasted only one
minute, and the scenario excluded writes and SAM/OpenCV analysis.

## Next tests

1. Seed realistic product, brand, and size data and repeat the read baseline.
2. Run a 10-minute soak at 20 users and record host-level CPU and memory.
3. Test the SAM analysis path separately at concurrency 1, 2, and 3 with fixed
   valid images; stop on 5xx, OOM, or sustained memory above 85%.

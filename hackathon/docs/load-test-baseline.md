# API load-test baseline

Date: 2026-11-21 (KST)

## Environment

- Target: FastAPI behind Nginx on AWS EC2 (`m7i-flex.large`, 2 vCPU, 8 GiB)
- Database: PostgreSQL 16 in Docker Compose
- Load generator: Locust 2.47.0 in Docker on a Windows PC in Korea
- EC2 region: Sydney (`ap-southeast-2`)
- Scenario: login once per user, then weighted reads of products (40%), the
  authenticated current-user endpoint (30%), brands (20%), and health (10%)
- User behavior: 0.5-1.5 second wait between requests
- Ramp: one user per second; separate 5, 10, and 20-user runs
- Duration: three minutes per run, including the ramp period

## Procedure

1. Verify the public health endpoint and all Docker Compose services.
2. Run Locust 2.47.0 in Docker from a separate Windows machine in Korea.
3. Load a dedicated test account from the ignored `loadtest/.env` file.
4. Start each user at one per second. Each user logs in once and reuses the
   returned access token for authenticated reads.
5. Run the 5, 10, and 20-user stages independently for three minutes each.
6. Sample backend, database, and Nginx container resources approximately every
   20 seconds over SSH.
7. After the runs, inspect backend logs for 5xx responses, tracebacks, and OOM
   events, then verify the public health endpoint again.

The request totals below come from the final Locust HTML reports. CSV snapshots
may be lower by a few in-flight requests when Locust shuts down.

## Results

| Users | Duration | Requests | Failures | Throughput | Avg | p95 | Backend CPU | Backend memory |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 3 min | 725 | 0 | 4.05 req/s | 237 ms | 240 ms | 1.76% | 77.52 MiB |
| 10 | 3 min | 1,417 | 0 | 7.89 req/s | 243 ms | 250 ms | 3.19% | 77.57 MiB |
| 20 | 3 min | 2,757 | 0 | 15.34 req/s | 242 ms | 240 ms | 5.50% | 77.59 MiB |

At 20 users, login averaged 958 ms and reached 1.04 seconds. The read
endpoints had a median near 230-240 ms. No 5xx response, traceback, or OOM
event was observed. Database and Nginx memory remained below 37 MiB and
5 MiB. The public health endpoint remained healthy after all runs.

## Interpretation

The read workload scaled to 20 concurrent users without errors or meaningful
resource pressure. The roughly 230-240 ms floor is dominated by network distance
between Korea and the Sydney region. Password hashing makes login materially
slower than reads, but it did not saturate this instance at the tested ramp.

This is a baseline, not a capacity claim. Products and brands were empty, all
authenticated users shared one test account, each stage lasted only three
minutes, and the scenario excluded writes and SAM/OpenCV analysis. Because the
three-minute duration includes ramp-up, the 20-user run held full concurrency
for about 160 seconds rather than the entire run.

## Next tests

1. Seed realistic product, brand, and size data and repeat the read baseline.
2. Run a 10-minute soak at 20 users and record host-level CPU and memory.
3. Test the SAM analysis path separately at concurrency 1, 2, and 3 with fixed
   valid images; stop on 5xx, OOM, or sustained memory above 85%.

# FinEval Test Framework

Three test suites covering correctness, browser performance, and API load.

```
test_framework/
├── functional/          # Playwright + Allure E2E tests
├── performance/         # Browser timing + Lighthouse CI
├── load/                # Async HTTP load tests
├── allure-results/      # Allure output (git-ignored except .gitkeep)
└── .env.test            # Copy and fill before running
```

## Setup

```bash
uv sync --group test-framework
uv run playwright install chromium
cp .env.test .env.test.local   # add real values if needed
```

## Run functional tests

```bash
cd functional
uv run pytest tests/ -v --alluredir=../allure-results
uv run allure serve ../allure-results        # open live report
```

Browser mode options:

```bash
uv run pytest tests/ -v --headed
uv run pytest tests/ -v --headless --browser firefox
```

**Markers**

| Marker       | Description                          |
|--------------|--------------------------------------|
| `smoke`      | Fast happy-path checks               |
| `regression` | Full regression suite                |
| `chat`       | Chat-specific tests                  |
| `analyse`    | Budget analyser tests                |
| `documents`  | Document upload tests                |

```bash
uv run pytest tests/ -m smoke -v                   # smoke only
uv run pytest tests/ -m "regression and chat" -v   # regression chat tests
```

## Run performance tests

```bash
cd performance
uv run pytest tests/test_navigation_perf.py tests/test_upload_perf.py -v
# HTML report written to performance/reports/

# Lighthouse (requires npx + Chrome)
uv run pytest tests/test_lighthouse.py -m lighthouse -v
```

Browser mode options:

```bash
uv run pytest tests/test_navigation_perf.py -v --headed
uv run pytest tests/test_lighthouse.py -m lighthouse -v --headless
```

`Lighthouse` should be run with Chromium.

## Run load tests

```bash
cd load
uv run python runner.py 20 60          # 20 concurrent users × 60 seconds
# CSV  → data/results.csv
# HTML → reports/load_report.html

# Or via pytest
uv run pytest tests/test_api_load.py -v
```

Load options:

```bash
uv run python runner.py --users 30 --duration 90
uv run pytest tests/test_api_load.py -v --users 30 --duration 90
```

## Environment variables (.env.test)

| Key              | Default                  | Description                     |
|------------------|--------------------------|---------------------------------|
| `BASE_URL`       | `http://localhost:3000`  | Frontend base URL               |
| `API_URL`        | `http://localhost:8000`  | Backend API base URL            |
| `HEADLESS`       | `true`                   | Run browsers headless           |
| `ITERATIONS`     | `3`                      | Repeat count for perf tests     |
| `CDP_PORT`       | `9222`                   | Chrome DevTools Protocol port   |
| `LOAD_USERS`     | `20`                     | Concurrent users for load tests |
| `LOAD_DURATION`  | `60`                     | Load test duration (seconds)    |
| `LOCUST_P95_MS`  | `5000`                   | p95 failure threshold (ms)      |

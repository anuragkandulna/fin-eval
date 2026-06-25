# FinEval

An agentic AI personal finance assistant with a production-grade evaluation framework. Built to demonstrate Senior AI QA Engineer skills.

## What It Does

- **Finance Assistant App** — React + FastAPI + LangGraph agent answers personal finance questions, checks loan eligibility, and processes documents using RAG over finance guidance documents using Qdrant vector search.
- **Eval Framework** — DeepEval LLM quality metrics + Playwright E2E + load testing + Lighthouse performance.

## Live URLs

| Service | URL |
|---------|-----|
| App | `https://app.thesceptreai.com` |
| Test Reports | `https://anuragkandulna.github.io/fin-eval` |

## Quick Start (Local)

```bash
# Prerequisites: Docker, Docker Compose, an OpenAI API key

cp .env.example .env
# Fill in OPENAI_API_KEY and DB_PASSWORD in .env

docker compose up --build
```

- App: http://localhost:3000
- API docs: http://localhost:8000/docs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | FastAPI + Python 3.12 (uv) + Pydantic v2 |
| Agent | LangGraph + LangChain + OpenAI GPT-4o-mini |
| RAG | Qdrant Cloud + OpenAI embeddings |
| Database | Azure PostgreSQL (free tier) + Redis 7 |
| Eval | DeepEval + Playwright + load tests + Lighthouse CI |
| Infra | Docker Compose + Nginx + GitHub Actions |

## Project Structure

```
fin-eval/
├── frontend/          # React 18 + TypeScript (Vite)
├── backend/           # FastAPI + uv (Python 3.12)
├── test-dashboard/    # React score-card app
├── evals/             # All evaluation suites
│   ├── deepeval_tests/    # LLM quality metrics
│   ├── playwright_tests/  # E2E browser tests
│   ├── performance/       # Locust + Lighthouse
│   ├── mlflow_logger/     # Experiment tracking + CI gate
│   └── synthetic_data/    # 30 PII-safe test cases
├── docs/              # Architecture decisions + findings
├── .github/workflows/ # deploy.yml + eval.yml
└── docker-compose.yml
```

## Python Dev (uv at repo root)

```bash
uv sync --all-groups

cd backend
uv run uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

## Frontend Dev

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

## Running Evals

```bash
uv sync --all-groups

# DeepEval
cd evals
uv run deepeval test run deepeval_tests/ -v

# Playwright (requires running frontend + backend)
uv run pytest playwright_tests/ -v

# Load test
uv run locust -f performance/locustfile.py --host=http://localhost:8000 --headless -u 10 -r 2 --run-time 60s
```

## Single Container Deploy

Build the production image locally:

```bash
docker build -t fineval-app .
docker run --env-file .env -p 8000:8000 fineval-app
```

For Hostinger VPS deployment, use:

- `Dockerfile`
- `deploy/hostinger/docker-compose.yml`
- `.github/workflows/build-and-deploy.yml`

Required GitHub secrets:

- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_USER`
- `HOSTINGER_SSH_KEY`
- `HOSTINGER_DEPLOY_PATH`

## Environment Variables

See [.env.example](.env.example) for all required variables. Never commit `.env`.

## Key Design Decisions

- **Mock-first, then real** — backend starts with mock endpoints (Section 03) before wiring the LangGraph agent (Section 04), so the eval suite can run against known-good responses first.
- **CI gate via MLflow** — individual test runners use `|| true`; only `ci_gate.py` reads MLflow metrics and calls `sys.exit(1)` on threshold failure, keeping the pipeline unblocked while individual test failures surface clearly.
- **Qdrant chunk size = 512 tokens** — fixed to match the eval harness; any change requires an entry in `docs/eval_decisions.md` and a re-run of `test_rag_quality.py`.

## Build Status

| Section | Status |
|---------|--------|
| 01 Infrastructure | — |
| 02 Scaffold | ✅ |
| 03 Backend FastAPI | — |
| 04 LangGraph Agent | — |
| 05 RAG Pipeline | — |
| 06 Frontend React | — |
| 07 Synthetic Data | — |
| 08 DeepEval + MLflow | — |
| 09 Playwright | — |
| 10 Locust + Lighthouse | — |
| 11 MLflow Server | — |
| 12 GitHub Actions | — |
| 13 Test Dashboard | — |
| 14 Docs + Findings | — |

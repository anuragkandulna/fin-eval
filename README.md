# FinEval

An agentic AI personal finance assistant with a production-grade evaluation framework. Built to demonstrate Senior AI QA Engineer and MLOps skills.

## What It Does

- **Finance Assistant App** — React + FastAPI + LangGraph agent answers personal finance questions, analyses budgets and debts, and processes documents using RAG over finance guidance documents via Qdrant vector search.
- **Eval Framework** — DeepEval LLM quality metrics (with red teaming) + Playwright E2E + async load testing + Lighthouse performance, gated by MLflow + `ci_gate.py`.

## Live URLs

| Service | URL |
|---------|-----|
| App | `https://app.thesceptreai.com` |
| Test Reports | `https://anuragkandulna.github.io/fin-eval` |

## Quick Start (Local)

```bash
# Prerequisites: Docker, Docker Compose, an OpenAI API key, a Neon PostgreSQL DATABASE_URL

cp .env.example .env
# Fill in OPENAI_API_KEY and DATABASE_URL (get from Neon dashboard → Connection Details)

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
| RAG | Qdrant Cloud + OpenAI embeddings (1536-dim, cosine) |
| Database | Neon serverless PostgreSQL + asyncpg + Redis 7 |
| Eval | DeepEval + MLflow + Playwright + async load tests + Lighthouse CI |
| Infra | Docker Compose + Nginx + GitHub Actions |

## Project Structure

```
mortgage-eval/
├── frontend/              # React 18 + TypeScript (Vite)
├── backend/               # FastAPI + uv (Python 3.12)
│   └── app/
│       ├── agent/         # LangGraph StateGraph (nodes, tools, prompts, state)
│       ├── models/        # SQLAlchemy models + Pydantic schemas
│       ├── rag/           # Qdrant ingest + retrieval pipeline
│       └── routers/       # /chat, /analyse, /documents endpoints
├── test_framework/        # All test suites (separate uv workspace)
│   ├── eval/              # DeepEval LLM quality metrics
│   ├── functional/        # Playwright E2E + Allure reports
│   ├── performance/       # Playwright timing + Lighthouse CI
│   └── load/              # Async HTTP load tests (aiohttp)
├── docs/                  # Architecture decisions + eval findings
├── deploy/hostinger/      # VPS-specific compose + nginx config
├── .claude/               # Claude Code skills + agent framework
├── .github/workflows/     # CI/CD pipelines
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

## Running Tests

All test suites live under `test_framework/` and share config from `test_framework/.env.test`.

```bash
# DeepEval LLM quality tests
cd test_framework/eval
uv run pytest tests/ -v
uv run pytest tests/test_llm_quality.py::test_budget_advice_relevance -v  # single test

# Playwright E2E (requires running frontend + backend)
cd test_framework/functional
uv run pytest tests/ -v
uv run pytest tests/ -m smoke -v
uv run pytest tests/ -m "regression and chat" -v
uv run pytest tests/ --headed                   # visible browser
uv run allure serve ../allure-results           # open Allure report

# Performance
cd test_framework/performance
uv run pytest tests/test_navigation_perf.py tests/test_upload_perf.py -v

# Load tests
cd test_framework/load
uv run python runner.py 20 60                   # 20 users × 60 seconds
uv run pytest tests/test_api_load.py -v
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

See [.env.example](.env.example) for all required variables. Key variables:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | Neon PostgreSQL connection string (`postgresql://...?sslmode=require`) |
| `REDIS_URL` | Redis connection URL |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `QDRANT_COLLECTION` | Collection name (default: `finance_docs`) |

Never commit `.env`.

## Key Design Decisions

- **Mock-first, then real** — backend starts with mock endpoints before wiring the LangGraph agent, so the eval suite can run against known-good responses first and establish a baseline.
- **CI gate via MLflow** — individual test runners use `|| true`; only `ci_gate.py` reads MLflow metrics and calls `sys.exit(1)` on threshold failure, keeping the pipeline unblocked while individual test failures surface clearly.
- **Qdrant chunk size = 512 tokens** — fixed to match the eval harness; any change requires an entry in `docs/eval_decisions.md` and a re-run of `test_rag_quality.py`.
- **Single-container production** — FastAPI serves both the API and the built React SPA. Nginx terminates TLS and proxies to port 8000.
- **Neon serverless PostgreSQL** — replaces the original Azure SQL setup. Uses `asyncpg` + SQLAlchemy async. SSL enforced via `connect_args`, not URL parameters (asyncpg requires this).

## Agent Framework

This project includes a two-layer expert system for AI-assisted development:

- **Auto-triggered skills** — 9 specialist skills in `.claude/skills/` that Claude Code activates based on task context:

| Skill | Domain |
|-------|--------|
| `agentic-ai-ml-expert` | LangGraph, RAG, multi-agent, observability |
| `ai-evaluations-expert` | DeepEval, MLflow, red teaming, NIST AI RMF |
| `devops-mlops-expert` | CI/CD, model lifecycle, LLM monitoring |
| `distributed-systems-cloud-expert` | Neon, Qdrant, Redis, LLM cost, semantic caching |
| `prompt-engineer` | Prompt versioning, CoT, constitutional AI, structured output |
| `qa-expert` | Playwright, pytest, AI test patterns, adversarial tests |
| `security-reviewer` | MITRE ATLAS, OWASP LLM Top 10, NIST AI RMF, NeMo |
| `senior-fullstack-developer` | FastAPI, Python, streaming APIs, database, typed endpoints |
| `ui-ux-expert` | React UX, consumer/enterprise patterns, AI streaming UI, accessibility, Core Web Vitals |

- **Manual skills** — 3 expert modes invoked explicitly (research → present options → user approval → execute): `idea-validator`, `documentation-expert`, `system-design-architect`

See [`CLAUDE.md`](CLAUDE.md) for trigger conditions and [`AGENTS.md`](AGENTS.md) for the Codex-compatible inline version.

> ⚠️ Any changes to skill or agent docs require explicit user approval before implementation.

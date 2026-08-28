# FinEval

An agentic AI personal finance assistant with a production-grade evaluation framework. Built to demonstrate Senior AI QA Engineer and MLOps skills.

## What It Does

- **Finance Assistant App** — React + FastAPI + LangGraph agent answers personal finance questions, analyses budgets and debts, and processes documents using RAG over finance guidance via Qdrant vector search.
- **Eval Framework** — DeepEval LLM quality metrics (with adversarial hallucination traps) + Playwright E2E + Locust load tests + Lighthouse CI, gated by MLflow + `ci_gate.py`.

## Live URLs

| Service | URL |
|---------|-----|
| App | `https://app.thesceptreai.com` |
| Test Reports | `https://anuragkandulna.github.io/fin-eval` |

---

## Quick Start (Local)

```bash
# Prerequisites: Docker, Docker Compose, an OpenAI API key, a Neon PostgreSQL DATABASE_URL

cp .env.example .env
# Fill in OPENAI_API_KEY, DATABASE_URL (Neon), QDRANT_URL, QDRANT_API_KEY

docker compose up --build
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API docs | http://localhost:8000/docs |
| MLflow | http://localhost:5001 |

For hot-reload development:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | FastAPI 0.111 + Python 3.12 (uv) + Pydantic v2 + SQLModel |
| Agent | LangGraph 0.2 + LangChain 0.3 + OpenAI GPT-4o-mini |
| RAG | Qdrant Cloud + OpenAI `text-embedding-ada-002` (1536-dim, cosine) |
| Database | Neon serverless PostgreSQL (asyncpg) + Redis (conversation cache) |
| Observability | MLflow Tracking (aggregate eval metrics) + MLflow Tracing (per-request spans) |
| Eval | DeepEval + Playwright + Locust + Lighthouse CI |
| Infra | Docker Compose + Nginx + GitHub Actions → GHCR → Hostinger VPS |

---

## Project Structure

```
mortgage-eval/
├── frontend/                  # React 18 + TypeScript (Vite)
│   ├── Dockerfile             # Node 20 builder → Nginx 1.27 (proxies API to backend)
│   └── src/                   # 21 components, 6 pages
│
├── backend/
│   ├── Dockerfile             # Python 3.12-slim + uv
│   └── app/
│       ├── main.py            # FastAPI app, lifespan, CORS, MLflow autolog
│       ├── config.py          # pydantic-settings
│       ├── database.py        # asyncpg engine, SQLModel.metadata, init_db, get_db
│       ├── exceptions.py      # domain exceptions
│       ├── deps.py            # FastAPI dependency providers
│       ├── agent/             # LangGraph StateGraph (UNTOUCHED black box)
│       │   ├── graph.py       # compiled singleton: finance_agent = build_graph()
│       │   ├── nodes.py       # rag, budget, debt, savings, response, guardrail nodes
│       │   ├── state.py       # FinanceAgentState (TypedDict + Annotated fields)
│       │   ├── tools.py       # budget_analyser, debt_calculator, savings_projector
│       │   └── prompts.py     # PROMPT_VERSION="v3", 4 system prompts
│       ├── rag/               # Qdrant ingest (wait=True) + retrieval pipeline
│       ├── chat/              # POST /chat domain — router, service, repo, schemas, models
│       ├── analyse/           # POST /analyse domain — router, service, schemas
│       ├── documents/         # POST /documents/upload domain
│       └── health/            # GET /healthz
│
├── test_framework/            # Separate uv workspace
│   ├── eval/                  # DeepEval LLM quality + hallucination traps + MLflow tracker
│   ├── functional/            # Playwright E2E, page-object model, Allure reports
│   ├── performance/           # Lighthouse CI
│   └── load/                  # Locust API load + browser-based concurrent load
│
├── deploy/
│   ├── hostinger/
│   │   └── docker-compose.yml # Production: nginx + frontend + backend + mlflow
│   ├── nginx/
│   │   └── nginx.conf         # VPS reverse proxy + TLS (Certbot)
│   └── mlflow/
│       └── Dockerfile         # MLflow tracking server (SQLite backend store)
│
├── docs/                      # HLD architecture, eval decisions, API endpoints
├── .claude/skills/            # 13 fineval-* project skills for Claude Code
├── .github/workflows/         # build-and-deploy.yml + 4 test workflow files
├── CONTEXT.md                 # Full build context for Claude chat sessions
├── PLAN.md                    # Migration plan: DELETE / MODIFY / CREATE / UNTOUCHED per file
├── docker-compose.yml         # Local: backend + frontend + redis + mlflow
└── docker-compose.local.yml   # Hot-reload overlay
```

---

## Python Dev (uv)

```bash
uv sync --all-groups

cd backend
uv run uvicorn app.main:app --reload
# API docs → http://localhost:8000/docs
```

## Frontend Dev

```bash
cd frontend
npm install
npm run dev
# App → http://localhost:3000
```

---

## Running Tests

All test suites live under `test_framework/` and share config from `test_framework/.env.test`.

```bash
# DeepEval LLM quality + hallucination traps
cd test_framework/eval
uv run pytest tests/ -v
uv run pytest tests/test_llm_quality.py::test_budget_advice_relevance -v

# Playwright E2E (requires running frontend + backend)
cd test_framework/functional
uv run pytest tests/ -m smoke -v
uv run pytest tests/ -m "regression and chat" -v
uv run pytest tests/ --headed
uv run allure serve ../allure-results

# Lighthouse performance
cd test_framework/performance
uv run pytest tests/test_lighthouse.py -v

# Load tests (Locust)
cd test_framework/load
locust -f locustfile.py --host http://localhost:8000
```

---

## Deployment

Three containers in production, one VPS:

```
Internet → Nginx :443 (TLS via Certbot)
               ├─ app.domain.com    → Frontend container (static + API proxy)
               └─ mlflow.domain.com → MLflow container :5000

Frontend container → Backend container :8000
Backend container  → Neon PostgreSQL (cloud)
                   → Qdrant Cloud
                   → Redis Cloud
```

```bash
# First-time VPS setup
cp .env.example .env   # fill in all vars on the VPS
docker compose -f deploy/hostinger/docker-compose.yml up -d
```

CI/CD: `build-and-deploy.yml` builds backend + frontend images → pushes to GHCR → SSH deploys to VPS.

Required GitHub secrets: `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_DEPLOY_PATH`, `GHCR_OWNER`, `GHCR_IMAGE`, `GHCR_FRONTEND_IMAGE`, `GHCR_MLFLOW_IMAGE`.

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | Neon connection string (`postgresql://...?sslmode=require`) |
| `REDIS_URL` | Redis connection URL |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `QDRANT_COLLECTION` | Collection name (default: `finance_docs`) |
| `MLFLOW_TRACKING_URI` | MLflow server URL (default: `http://localhost:5000`) |
| `MLFLOW_EXPERIMENT` | Experiment name (default: `fineval-evals`) |
| `ENVIRONMENT` | `local` or `production` (controls CORS) |
| `DOMAIN` | Production domain (used to build CORS allowed origins) |

Never commit `.env`.

---

## Key Design Decisions

- **Guardrail always last** — every LangGraph flow (`chat` / `analyse` / `summarise`) terminates through `guardrail_node` before `END`. No edge may bypass it.
- **MLflow over Langfuse** — one deployed container covers both aggregate eval metrics (Tracking) and per-request spans (Tracing), removing an external SaaS dependency.
- **CI gate via `ci_gate.py`** — individual test runners use `continue-on-error: true`; only `ci_gate.py` reads MLflow and calls `sys.exit(1)` on threshold breach, keeping the pipeline unblocked while failures surface clearly.
- **RAG chunk size = 512 tokens** — versioned contract. Any change requires re-running `test_rag_quality.py` and an entry in `docs/eval_decisions.md`.
- **Separate containers** — frontend (Nginx + static), backend (FastAPI), MLflow. Neon, Qdrant, and Redis are managed cloud services — not VPS containers.
- **SQLModel over raw SQLAlchemy** — unified ORM + Pydantic-compatible models. Async sessions via `sqlalchemy.ext.asyncio`; relationships use `lazy="selectin"` for async safety.

---

## Claude Code Skills

13 project skills in `.claude/skills/` that auto-load when task context matches:

| Skill | Domain |
|-------|--------|
| `fineval-architecture-guard` | LangGraph state, guardrail routing, CORS, API response contracts |
| `fineval-destructive-operations` | Qdrant/Neon/Redis/Docker irreversible operations |
| `fineval-agentic-design` | New tool vs. prompt decisions, state field design, new flow_types |
| `fineval-agent-testing` | Node validation, tool-call assertions, adversarial guardrail tests |
| `fineval-eval-framework` | DeepEval/GEval metrics, thresholds, synthetic test data |
| `fineval-rag-observability` | Retrieval grounding, MLflow tracing, chunk-size contract |
| `fineval-migrations` | Schema change discipline (`create_all` only until Alembic trigger) |
| `fineval-ci` | GitHub Actions, action pinning, `ci_gate.py` as sole hard gate |
| `fineval-code-quality` | Ruff/mypy/tsc, exception handling, `data-testid`, no `any` |
| `fineval-deploy` | Hostinger VPS topology, secrets, health checks, releases |
| `fineval-performance` | Locust load patterns, Lighthouse thresholds, timing assertions |
| `fineval-security` | CORS restriction (live); prompt injection + RAG exfiltration (scaffolded) |
| `fineval-session` | `session_id` conventions; ChatSession/ChatMessage persistence |

See [`CLAUDE.md`](CLAUDE.md) for full trigger conditions and non-negotiable rules.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FinEval** — an agentic AI personal finance assistant paired with a production-grade evaluation framework. The repo is a Python monorepo managed with `uv`, containing a FastAPI backend, React frontend, and a separate `test_framework` uv workspace.

## Common Commands

### Python environment (uv at repo root)

```bash
uv sync --all-groups          # install all deps including test-framework group
uv sync --group test-framework # install only test framework deps
```

### Backend

```bash
# Run dev server (from repo root)
cd backend && uv run uvicorn app.main:app --reload
# API at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # tsc + vite build
```

### Docker (full stack)

```bash
# Production-like
docker compose up --build

# With hot reload
docker compose -f docker-compose.yml -f docker-compose.local.yml up
```

### Test Framework

All test suites read config from `test_framework/.env.test`. Run commands from within the named subdirectory.

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
uv run pytest tests/ --headed          # visible browser
uv run allure serve ../allure-results  # open report

# Performance
cd test_framework/performance
uv run pytest tests/test_navigation_perf.py tests/test_upload_perf.py -v

# Load tests
cd test_framework/load
uv run python runner.py 20 60          # 20 users × 60 seconds
uv run pytest tests/test_api_load.py -v
```

## Architecture

### Request flow

User → Nginx (prod) → FastAPI (`/chat`, `/analyse`, `/documents`) → LangGraph agent

The **production container** (`Dockerfile`) builds the React app first (Node), then copies `frontend/dist` into the Python image as `frontend_dist/`. FastAPI serves the React SPA at `/` and `/{full_path}` via `FileResponse`, while API routes take precedence.

### LangGraph agent (`backend/app/agent/`)

The agent is a compiled `StateGraph` with six nodes and three entry flows controlled by `flow_type` in `FinanceAgentState`:

| `flow_type` | Description |
|-------------|-------------|
| `"chat"` | RAG retrieval → LLM response |
| `"analyse"` | RAG → budget → (optional) debt → (optional) savings → LLM response |
| `"summarise"` | RAG → LLM summary of `document_content` |

All flows end at `guardrail` (a second LLM call that sanitises/redacts the response before returning it). The compiled graph is a module-level singleton in `graph.py`.

Node responsibilities: `nodes.py` — each node updates specific keys in `FinanceAgentState` and appends to `tool_calls_made`. Tool calls (`budget_analyser`, `debt_calculator`, `savings_projector`) are LangChain tools defined in `tools.py`, invoked synchronously inside async nodes.

### RAG pipeline (`backend/app/rag/`)

- **Vector store**: Qdrant Cloud (configurable via `QDRANT_URL` / `QDRANT_API_KEY`)
- **Embeddings**: `text-embedding-ada-002` / `text-embedding-3-small` (1536 dims, cosine distance)
- **Chunk size**: **512 tokens, overlap 64** — this is fixed to match the eval harness. Any change requires a re-run of `test_rag_quality.py` and a new entry in `docs/eval_decisions.md`.
- On startup, `main.py` ingests `backend/data/finance_docs/` if the Qdrant collection is empty.
- Supported ingest formats: `.txt`, `.pdf`, `.md`, `.docx`, `.csv`

### Database

Neon serverless PostgreSQL (accessed via `asyncpg` + SQLAlchemy async). `DATABASE_URL` in `.env` uses the standard PostgreSQL format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`. `database.py` normalises the scheme to `postgresql+asyncpg://` at startup and enforces SSL via `connect_args`.

### Test framework (`test_framework/` — separate uv workspace)

Four independent suites under `test_framework/`:

| Suite | Tool | Reports |
|-------|------|---------|
| `eval/` | DeepEval (`AnswerRelevancyMetric`, `GEval`) | HTML in `eval/reports/` |
| `functional/` | Playwright + Allure | `allure-results/` |
| `performance/` | Playwright timing + Lighthouse CI | `performance/reports/` |
| `load/` | async HTTP (`aiohttp`) | `load/reports/` |

The eval suite uses `EVAL_MODEL` (default `gpt-4o-mini`) as the LLM judge. Functional tests use Allure markers: `smoke`, `regression`, `chat`, `analyse`, `documents`.

### CI design

Individual test runners exit `|| true` so they never block the pipeline. Only `ci_gate.py` reads MLflow experiment metrics and calls `sys.exit(1)` on threshold failure — that is the single hard gate.

## Key Design Decisions

- **Mock-first approach** — backend started with mock endpoints before wiring the real LangGraph agent, so the eval suite could establish a baseline against deterministic responses.
- **Single-container production** — FastAPI serves both the API and the built React SPA. Nginx terminates TLS in front and proxies to port 8000.
- **Qdrant chunk size is a contract** — 512 tokens is agreed upon between ingestion and the eval harness; treat it as a versioned setting, not a tuning knob.

## Agent Framework

This project uses a two-layer expert system: **auto-triggered skills** (Claude activates based on context) and **manual skills** (explicit user invocation). For the equivalent Codex-compatible version, see [`AGENTS.md`](AGENTS.md).

### Auto-Triggered Skills

Claude loads these automatically when the task context matches the trigger condition.

| Skill | Trigger condition |
|-------|------------------|
| `agentic-ai-ml-expert` | LangGraph, LangChain, RAG pipeline, agent state, multi-agent, MCP, A2A, ReAct, Reflection, Langfuse, agent failure recovery, `tool_calls_made`, `StateGraph`, `FinanceAgentState`, retrieval quality, embeddings, `backend/app/agent/` |
| `ai-evaluations-expert` | DeepEval, MLflow, `ci_gate.py`, `tracker.py`, red teaming, NIST AI RMF, bias testing, production monitoring, `GEval`, `hallucination_traps`, `AnswerRelevancyMetric`, `test_framework/eval/`, grounding, missing citations, benchmark claims |
| `devops-mlops-expert` | Docker build, docker-compose, GitHub Actions, Nginx, MLflow setup, `Dockerfile`, `.github/workflows/`, model lifecycle, canary deployment, LLM monitoring (token usage, refusal rates, guardrail trigger rates), model versioning — build and delivery pipeline only |
| `distributed-systems-cloud-expert` | Deployment architecture, Neon PostgreSQL, Qdrant scaling, Redis semantic caching, LLM API cost management, multi-model routing, connection pooling, retry logic, circuit breakers, fault tolerance, consistency models — regardless of deployment target |
| `prompt-engineer` | `prompts.py`, `PROMPT_VERSION`, guardrail node, structured output prompting, chain-of-thought, constitutional AI, A/B testing prompts, hallucination reduction, prompt injection defense, `FinanceAgentState` messages |
| `qa-expert` | Playwright tests, pytest suites, `conftest.py`, `data-testid`, allure markers, `smoke`/`regression` markers, non-determinism in AI tests, adversarial test cases, multi-turn conversation testing, `functional/`, `eval/`, `performance/`, `load/` suites |
| `security-reviewer` | MITRE ATLAS, OWASP LLM Top 10, NIST AI RMF, NeMo guardrails, prompt injection, vector store poisoning, RAG data exfiltration, model supply chain, hardcoded secrets, CORS, file upload security, FastAPI route security |
| `senior-fullstack-developer` | React/TypeScript implementation, FastAPI/Python implementation, streaming LLM responses, AI error handling (rate limits, refusals, timeouts), tool call progress UI, API endpoint design, Pydantic models, database queries, any production code change |

### Manual Skills

Invoke these explicitly when you want a specific expert mode. Each skill follows a strict **research → present options → user approval → execute** protocol and will not write any output until the user explicitly selects an approach.

| Skill | When to invoke |
|-------|----------------|
| `idea-validator` | Validating a new feature idea, product direction, or architectural proposal |
| `documentation-expert` | Writing ADRs, runbooks, `docs/eval_decisions.md` entries, README, or API reference |
| `system-design-architect` | Designing new system components, major architectural decisions, or trade-off analysis |

## Global Rules

### Never-Do Rules

- **Never** change RAG chunk size from 512 tokens without updating `docs/eval_decisions.md` and re-running `test_rag_quality.py`
- **Never** remove `|| true` from CI test runner steps — `ci_gate.py` is the only hard gate
- **Never** add `page.waitForTimeout()` or `time.sleep()` to any test file
- **Never** use TypeScript `any` without an inline comment explaining why
- **Never** hardcode secrets in Dockerfiles, compose files, or source code
- **Never** create LangGraph conditional edges that bypass the `guardrail` node
- **Never** change `PROMPT_VERSION` without updating the `tool_calls_made` tag and MLflow `log_param("prompt_version", ...)`
- **Never** use plain dicts for LangGraph state — always TypedDict with Annotated fields
- **Never** add DeepEval metrics without documenting what model behavior they measure
- **Never** omit `data-testid` attributes from interactive frontend elements
- **Never** hardcode threshold values in `ci_gate.py` — must be env-var overridable
- **Never** use GitHub Actions `@latest` versions — always pin (e.g., `actions/checkout@v4`)

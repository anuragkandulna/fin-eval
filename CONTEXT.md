# FinEval — Full Context & Build Instructions

**Project:** Agentic AI Personal Finance Assistant + Production Eval Framework  
**Author:** Anurag Kandulna (dev.ak@outlook.in)  
**Current branch:** `fea/FIN-10`  
**Status as of:** 27 Aug 2026 — **62% complete**  
**Target role:** Senior AI QA Engineer · 25–30 LPA

> **How to use this document:** Feed this to a Claude chat session as the opening context. It contains everything needed to continue building FinEval without re-reading the codebase from scratch. Work through the remaining tasks in the order listed. Never work on a completed area unless a gap fix requires touching it.

---

## 1. Tech Stack

```
Frontend:    React 18 + TypeScript + Vite + TailwindCSS + Axios + Tanstack Query
Backend:     FastAPI 0.111 + Python 3.12 + Pydantic v2 + SQLAlchemy async
Agent:       LangGraph 0.2 + LangChain 0.3 + OpenAI GPT-4o-mini
RAG:         Qdrant Cloud + LangChain text splitter + OpenAI text-embedding-ada-002
Tracing:     MLflow Tracing (per-request spans) + MLflow Tracking (aggregate CI metrics) — NOT YET INTEGRATED
Database:    Neon PostgreSQL (asyncpg) + Redis (declared, NOT YET USED)
Eval:        DeepEval + Playwright + aiohttp load + Playwright Lighthouse
CI/CD:       GitHub Actions → GHCR → Hostinger VPS (SSH deploy)
Container:   Docker multi-stage (Node builder + Python runtime), single container prod
```

---

## 2. Repo Structure

```
mortgage-eval/                          ← repo root / uv workspace root
├── CLAUDE.md                           ← project rules for Claude Code (DO NOT EDIT without approval)
├── AGENTS.md                           ← Codex-compatible version of CLAUDE.md rules
├── CONTEXT.md                          ← this file
├── Dockerfile                          ← root multi-stage: Node builder → Python runtime (COMPLETE)
├── docker-compose.yml                  ← BROKEN — references backend/Dockerfile & test-dashboard
├── docker-compose.local.yml            ← dev hot-reload overlay
├── pyproject.toml                      ← root uv workspace (backend deps + test-framework group)
├── uv.lock
├── .env                                ← local secrets (gitignored)
├── .env.example                        ← env template
├── .python-version                     ← 3.12
│
├── backend/
│   ├── Dockerfile                      ← exists but NOT referenced by root docker-compose.yml correctly
│   └── app/
│       ├── main.py                     ← FastAPI app, lifespan, CORS, routers, SPA serving
│       ├── config.py                   ← pydantic-settings: openai, db, redis, qdrant
│       ├── agent/
│       │   ├── graph.py                ← LangGraph StateGraph (6 nodes, compiled singleton)
│       │   ├── nodes.py                ← rag_node, budget_node, debt_node, savings_node, response_node, guardrail_node
│       │   ├── state.py                ← FinanceAgentState TypedDict with Annotated fields
│       │   ├── tools.py                ← @tool: budget_analyser, debt_calculator, savings_projector
│       │   └── prompts.py              ← PROMPT_VERSION="v3", 4 system prompts
│       ├── models/
│       │   ├── database.py             ← asyncpg engine, Neon SSL, init_db(), get_db()
│       │   └── schemas.py              ← ChatRequest/Response, AnalyseRequest/Response, DocumentResponse, DebtItem
│       ├── rag/
│       │   ├── ingest.py               ← Qdrant init, multi-format loader, 512-token splitter, add_documents
│       │   └── retriever.py            ← similarity_search_with_score, threshold 0.5, top-4
│       └── routers/
│           ├── chat.py                 ← POST /chat → finance_agent (flow_type="chat")
│           ├── analyse.py              ← POST /analyse → finance_agent (flow_type="analyse")
│           └── documents.py            ← POST /documents/upload → ingest_file
│
├── backend/data/finance_docs/          ← 4 baseline docs seeded on cold start
│   ├── budgeting_basics.txt
│   ├── debt_management.txt
│   ├── india_finance_basics.txt
│   └── savings_and_investing.txt
│
├── frontend/
│   ├── package.json                    ← React 18, Vite, TailwindCSS, Axios, Tanstack Query, react-router-dom
│   ├── vite.config.ts                  ← dev proxy: /chat,/analyse,/documents → localhost:8000
│   ├── src/
│   │   ├── api/client.ts               ← axios instance, typed request/response interfaces, 3 API calls
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           ← main landing page with charts and summary
│   │   │   ├── Analyse.tsx             ← wraps BudgetForm (5 lines — just an import wrapper)
│   │   │   ├── Chat.tsx                ← wraps ChatWindow (12 lines)
│   │   │   ├── Documents.tsx           ← full document upload + list page (344 lines)
│   │   │   ├── PersonalData.tsx        ← personal finance data entry (255 lines)
│   │   │   └── Reports.tsx             ← stub (20 lines, no real content yet)
│   │   ├── components/                 ← 21 components
│   │   │   ├── BudgetForm.tsx          ← budget input form with debt section (234 lines)
│   │   │   ├── BudgetHealthCards.tsx   ← health score display cards
│   │   │   ├── CategoryDonut.tsx       ← recharts donut chart
│   │   │   ├── ChatPanel.tsx           ← chat sidebar panel (309 lines)
│   │   │   ├── ChatWindow.tsx          ← full chat interface (162 lines)
│   │   │   ├── DisclaimerBar.tsx       ← regulatory disclaimer banner
│   │   │   ├── DocumentCard.tsx        ← document list item card
│   │   │   ├── DocumentDetailPanel.tsx ← slide-out document detail panel
│   │   │   ├── DocumentUpload.tsx      ← drag-drop upload area
│   │   │   ├── FloatingChat.tsx        ← floating chat button
│   │   │   ├── HistorySidebar.tsx      ← chat history sidebar
│   │   │   ├── MobileBottomNav.tsx     ← mobile bottom navigation bar
│   │   │   ├── MobileChatSheet.tsx     ← mobile chat bottom sheet
│   │   │   ├── NavBar.tsx              ← top navigation bar
│   │   │   ├── Recommendations.tsx     ← AI recommendations display
│   │   │   ├── SpendVsIncomeChart.tsx  ← bar chart: spend vs income
│   │   │   ├── SpendingBreakdown.tsx   ← spending category breakdown
│   │   │   ├── SpendingTrendChart.tsx  ← line chart: spending over time
│   │   │   ├── StatusBar.tsx           ← status indicator bar
│   │   │   ├── TopSpendingCategories.tsx ← top categories list
│   │   │   └── UploadModal.tsx         ← file upload modal (264 lines)
│   │   └── contexts/
│   │       ├── ChatContext.tsx
│   │       ├── SidebarContext.tsx
│   │       └── ThemeContext.tsx
│   └── dist/                           ← pre-built production dist (committed)
│
├── deploy/
│   ├── start.sh                        ← container entrypoint: uvicorn on $PORT
│   └── hostinger/
│       └── docker-compose.yml          ← production single-service: pulls GHCR image, port 80→8000
│
├── .github/workflows/
│   ├── build-and-deploy.yml            ← COMPLETE: GHCR build → SSH deploy to Hostinger VPS
│   └── test-suite.yml                  ← COMPLETE: all 4 test suites + GitHub Pages reports
│
├── test_framework/                     ← separate uv workspace member
│   ├── pyproject.toml
│   ├── .env.test                       ← test config (API_URL, EVAL_MODEL, etc.)
│   ├── eval/
│   │   ├── conftest.py
│   │   ├── pytest.ini
│   │   └── tests/test_llm_quality.py   ← 5 DeepEval tests (AnswerRelevancy + 4 GEval)
│   ├── functional/
│   │   ├── conftest.py
│   │   ├── pytest.ini
│   │   ├── pages/                      ← page-object model
│   │   │   ├── base_page.py
│   │   │   ├── chat_page.py
│   │   │   ├── analyse_page.py
│   │   │   └── documents_page.py
│   │   └── tests/
│   │       ├── test_chat.py
│   │       ├── test_analyse.py
│   │       ├── test_documents.py
│   │       └── test_navigation.py
│   ├── load/
│   │   ├── config.py
│   │   ├── runner.py                   ← async aiohttp load runner
│   │   └── tests/test_api_load.py
│   └── performance/
│       ├── emitter/metrics_emitter.py
│       └── tests/
│           ├── test_navigation_perf.py
│           ├── test_upload_perf.py
│           └── test_lighthouse.py
│
├── docs/
│   ├── api-endpoints.md
│   ├── brand-guidelines.md
│   └── [design mockups and logos]
│
└── plan/                               ← original build plan (reference only)
    ├── 00_INDEX.md
    └── [01–09 detailed plan files]
```

---

## 3. Architecture

### 3.1 Request Flow

```
Browser (React SPA)
  │
  ├─ GET /          → FastAPI serves frontend/dist/index.html
  ├─ GET /assets/*  → FastAPI serves static assets
  │
  ├─ POST /chat              → chat.py router → finance_agent.ainvoke (flow_type="chat")
  ├─ POST /analyse           → analyse.py router → finance_agent.ainvoke (flow_type="analyse")
  └─ POST /documents/upload  → documents.py router → ingest_file → Qdrant

Production:
  Browser → Nginx (TLS termination) → FastAPI :8000 (single container)
```

### 3.2 LangGraph Agent

The agent is a compiled `StateGraph` singleton (`finance_agent = build_graph()` in `graph.py`).

**State type:** `FinanceAgentState` (TypedDict, all fields Annotated where needed)

```
FinanceAgentState fields:
  messages         Annotated[list[BaseMessage], add_messages]
  user_query       str
  session_id       str
  retrieved_docs   list[str]
  doc_sources      list[str]
  budget_result    dict
  debt_result      dict
  savings_result   dict
  finance_input    dict   ← income, needs, wants, debts, savings_goal, etc.
  document_content str    ← for summarise flow
  final_response   str
  tool_calls_made  list[str]
  trace_id         str
  flow_type        str    ← "chat" | "analyse" | "summarise"
```

**Graph topology:**

```
START
  │
  ▼
 rag ──────────────────────────────────────────────────────────┐
  │  _route_after_rag:                                         │
  │  flow_type=="analyse" AND finance_input → budget           │
  │  flow_type=="summarise" → response                         │
  │  else → response                                           │
  ▼                                                            │
budget ──────────────────────────────────────────────────────  │
  │  _route_after_budget:                                    │  │
  │  debts present → debt                                    │  │
  │  monthly_savings or actual_savings → savings             │  │
  │  else → response                                         │  │
  ▼                                                          ▼  ▼
debt → savings → response ←──────────────────────────────── response
                    │
                    ▼
               guardrail
                    │
                    ▼
                   END
```

**Node responsibilities (nodes.py):**
- `rag_node` → calls `retrieve_docs(query)`, sets `retrieved_docs`, `doc_sources`, appends `"rag_retrieval"` to `tool_calls_made`
- `budget_node` → calls `budget_analyser.invoke(...)`, sets `budget_result`
- `debt_node` → calls `debt_calculator.invoke(...)`, sets `debt_result`
- `savings_node` → calls `savings_projector.invoke(...)`, sets `savings_result`
- `response_node` → ChatOpenAI(gpt-4o-mini) call, different system prompt per flow_type, sets `final_response`
- `guardrail_node` → second ChatOpenAI call with GUARDRAIL_SYSTEM, sanitizes/redacts `final_response`

**Tools (tools.py):**
- `budget_analyser` → 50/30/20 rule, health score 0–100, surplus/deficit, issues list
- `debt_calculator` → avalanche + snowball simulation, payoff months, interest saved
- `savings_projector` → compound interest FV projection, disclaimer included

**Prompts (prompts.py):** `PROMPT_VERSION = "v3"` — four prompts:
- `FINANCE_QA_SYSTEM` — RAG-grounded Q&A, SEBI disclaimer on investment advice
- `BUDGET_ANALYSIS_SYSTEM` — structured budget analysis output format
- `DOCUMENT_SUMMARY_SYSTEM` — bank statement / salary slip summarizer
- `GUARDRAIL_SYSTEM` — strips PII, specific fund names, guaranteed return figures

### 3.3 RAG Pipeline

```
ingest_file(path, doc_id):
  loader = PyPDFLoader | Docx2txtLoader | CSVLoader | TextLoader
  splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
  chunks → add metadata (doc_id, source)
  QdrantVectorStore.add_documents(chunks)      ← MISSING wait=True

retrieve_docs(query):
  QdrantVectorStore.similarity_search_with_score(query, k=4)
  filter: score > 0.5
  returns: (list[str], list[str])  ← (texts, sources)
```

**Qdrant config:**
- Collection: `finance_docs` (from settings)
- Vectors: 1536 dims, cosine distance
- Embedding model: `text-embedding-ada-002` via `OpenAIEmbeddings`
- Chunk size: **512 tokens / 64 overlap — LOCKED. Never change without updating `docs/eval_decisions.md` and re-running `test_rag_quality.py`.**

### 3.4 Database

Neon serverless PostgreSQL via asyncpg. `DATABASE_URL` format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`.

`database.py` normalises scheme to `postgresql+asyncpg://`, strips `?sslmode=require`, enforces SSL via `connect_args={"ssl": ssl_ctx}`.

**Current state:** `init_db()` runs `Base.metadata.create_all` at startup. No ORM models exist yet — no tables are defined. `get_db()` session factory exists but no endpoints use it (no session persistence implemented).

### 3.5 API Contracts

**POST /chat**
```json
Request:  { "message": "string", "session_id": "string", "context_docs": [] }
Response: { "response": "string", "sources": ["string"], "tool_calls_made": ["string"], "trace_id": "string" }
```

**POST /analyse**
```json
Request:  {
  "income": float, "needs": float, "wants": float,
  "current_savings": float, "savings_goal": float,
  "debts": [{"name": "str", "balance": float, "rate": float}],
  "monthly_debt_payment": float, "projection_years": int,
  "annual_return": float, "session_id": "string"
}
Response: {
  "response": "string", "health_score": int|null,
  "health_label": str|null, "actual_savings": float|null,
  "surplus_deficit": float|null, "projected_value": float|null,
  "tool_calls_made": ["string"], "trace_id": "string"
}
```

**POST /documents/upload**
```json
Request:  multipart/form-data, field: "file" (.pdf, .txt, .md, .docx, .csv)
Response: { "doc_id": "string", "filename": "string", "chunks": int, "status": "processed" }
```

Note: `client.ts` also expects `trace_url: string | null` on ChatResponse and AnalyseResponse — these fields are not yet returned by the backend (MLflow Tracing not yet wired; returns `null` until Sprint 1.3).

### 3.6 Deployment Architecture

```
Production (Hostinger VPS):
  GitHub push → GHCR build → SSH → docker compose pull + up
  Container: single fineval-app image (FastAPI serves both API and React SPA)
  Port mapping: 80:8000 (Nginx in front — Nginx config NOT YET WRITTEN)

Local dev:
  cd backend && uv run uvicorn app.main:app --reload   ← :8000
  cd frontend && npm run dev                           ← :3000 (Vite proxy → :8000)

Docker local:
  docker compose -f docker-compose.yml -f docker-compose.local.yml up
  NOTE: root docker-compose.yml is BROKEN (see gaps below)
```

### 3.7 CI/CD Pipelines

**build-and-deploy.yml** (triggers: push to main, workflow_dispatch)
1. Build multi-stage Docker image → push to GHCR as `ghcr.io/<owner>/fineval-app:latest` + `sha`
2. SSH to Hostinger → copy `deploy/hostinger/docker-compose.yml` → `docker compose pull && up`

**test-suite.yml** (triggers: push to main/fea/**, PR to main, workflow_dispatch)
1. Start Redis service container
2. Install system deps (ODBC Driver 18), uv, Python 3.12, Playwright browsers, Node 20
3. Start backend (`uvicorn`) + frontend (`npm run dev`) with health polling
4. Run 4 test suites in sequence (each `continue-on-error: true`):
   - Load tests (aiohttp)
   - Eval tests (DeepEval)
   - Functional tests (Playwright, smoke only)
   - Performance tests (browser timing)
5. Collect all HTML reports → publish to `test-reports` branch via `peaceiris/actions-gh-pages@v4`
6. Write GitHub job summary with per-suite status
7. Final assertion step fails the job if load, eval, or functional suites failed

### 3.8 Test Framework

```
test_framework/                  ← separate uv workspace member
  .env.test                      ← API_URL, BASE_URL, EVAL_MODEL, OPENAI_API_KEY, etc.
  eval/
    tests/test_llm_quality.py    ← 5 DeepEval tests:
      test_budget_advice_relevance          AnswerRelevancyMetric threshold=0.7
      test_no_market_prediction_hallucination   GEval RefusalCheck threshold=0.5
      test_investment_disclaimer_present        GEval DisclaimerCheck threshold=0.5
      test_budget_analysis_identifies_surplus   GEval SurplusIdentification threshold=0.5
      test_debt_advice_mentions_strategy        GEval DebtStrategySpecificity threshold=0.5
  functional/
    pages/  ← page-object model (base_page, chat_page, analyse_page, documents_page)
    tests/  ← test_chat.py, test_analyse.py, test_documents.py, test_navigation.py
             markers: @pytest.mark.smoke / regression / chat / analyse / documents
  load/
    runner.py          ← uv run python runner.py <users> <duration>
    tests/test_api_load.py
  performance/
    emitter/metrics_emitter.py
    tests/test_navigation_perf.py, test_upload_perf.py, test_lighthouse.py
```

---

## 4. Current Build Status

| Domain | Status | Completion |
|--------|--------|-----------|
| Frontend UI/UX | ✅ Complete | 100% |
| LangGraph Agent | ✅ Complete | 95% |
| RAG Pipeline | ✅ Complete | 90% |
| FastAPI Backend | ⚠️ Gaps | 85% |
| Deployment | ⚠️ Gaps | 70% |
| Test Framework | ⚠️ Gaps | 65% |
| MLflow / Observability | ❌ Not built | 0% |
| Claude Skills (wog format) | ❌ Not built | 0% |

**Overall: ~62% complete. ~5 weeks to production.**

---

## 5. Active Never-Do Rule Violations

These must be fixed before any PR is merged to main:

### VIOLATION 1 — `backend/app/main.py:44`
```python
# CURRENT (wrong):
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

# FIX:
from app.config import settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"https://{settings.domain}", f"https://app.{settings.domain}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Update `Settings` to include `domain: str = "localhost"` (already present).

### VIOLATION 2 — `backend/app/rag/ingest.py:65`
```python
# CURRENT (wrong):
get_vectorstore().add_documents(chunks)

# FIX — use client directly for wait=True:
vs = get_vectorstore()
vs.add_documents(chunks)
# After add_documents, call qdrant_client.update_collection with wait=True
# OR use the underlying client:
# The langchain-qdrant add_documents wraps upsert; need to verify wait param
# Simplest fix: call get_vectorstore().client.upsert(... wait=True) directly
```
Check `langchain-qdrant` source — if `add_documents` doesn't expose `wait`, call the underlying `QdrantClient.upsert` with `wait=True` instead.

### VIOLATION 3 — `docker-compose.yml`
The root `docker-compose.yml` has three broken references:
1. `backend` service references `dockerfile: backend/Dockerfile` — but `docker-compose.local.yml` overrides context. The root compose works for local dev (with the overlay) but will fail standalone.
2. `test-dashboard` service defined — no source code exists for it at `./test-dashboard/`
3. `volumes: - ./evals/reports:/app/reports` — `evals/` directory doesn't exist

**Fix:** Remove `test-dashboard` service and the broken volume from root `docker-compose.yml`. The test dashboard will be a separate service added when the code exists.

---

## 6. Remaining Work — Ordered Task List

Work through these in order. Each section is a self-contained sprint.

---

### SPRINT 1 — Backend Hardening (Week 1, ~4–5 days)

#### Task 1.1: Fix CORS violation
File: `backend/app/main.py`
- Change `allow_origins=["*"]` to restrict to `settings.domain` per Violation 1 above
- Add `ENVIRONMENT` check: in local/dev mode allow `localhost:3000` as well

#### Task 1.2: Fix Qdrant wait=True violation
File: `backend/app/rag/ingest.py`
- User-initiated document uploads must wait for Qdrant to confirm the write
- Audit `langchain-qdrant`'s `add_documents` signature; if `wait` is not exposed, use the underlying `qdrant_client` directly with `wait=True`

#### Task 1.3: Integrate MLflow Tracing
- Add `mlflow>=2.14` to `pyproject.toml`
- In `backend/app/config.py`, add `mlflow_tracking_uri: str = "http://localhost:5000"` and `mlflow_experiment: str = "fineval-evals"`
- In `main.py` lifespan, call `mlflow.langchain.autolog()` after `init_db()`
- In `backend/app/agent/nodes.py`, wrap each `llm.ainvoke()` call with `with mlflow.start_span(name="<node_name>") as span` and populate `trace_url` in state from the active span's trace ID
- In `chat.py` and `analyse.py` routers, return `trace_url` in the response (the `client.ts` interface already expects `trace_url: string | null`)
- Env vars: `MLFLOW_TRACKING_URI`, `MLFLOW_EXPERIMENT`

#### Task 1.4: Add Redis semantic caching
- `redis` package is already in `pyproject.toml` (`redis==5.0.4`)
- In `backend/app/config.py`, `redis_url` is already declared
- Wire up Redis for LangChain's `set_llm_cache(RedisSemanticCache(...))` in `main.py` lifespan
- Use `redis.asyncio` for async connection

#### Task 1.5: Add session persistence (conversation history)
- Define a `ChatSession` ORM model in `backend/app/models/database.py` (id, session_id, messages JSON, created_at, updated_at)
- Define a `ChatMessage` ORM model or store as JSON on `ChatSession`
- In `chat.py`, load session history by `session_id`, pass as initial `messages` to agent state, persist updated messages after the run
- `Base.metadata.create_all` will pick up new models automatically on startup

#### Task 1.6: Add per-run MLflow metric logging in nodes
- Install `mlflow` in `pyproject.toml`
- Create `backend/app/agent/tracker.py`:
  ```python
  import mlflow
  def log_run(trace_id: str, flow_type: str, tool_calls: list, health_score: int | None): ...
  ```
- Call `tracker.log_run(...)` at the end of `response_node` using `state["tool_calls_made"]`
- MLflow tracking URI: `MLFLOW_TRACKING_URI` env var (default: local file store for dev)

---

### SPRINT 2 — Deployment Fix & Observability Stack (Week 2, ~4–5 days)

#### Task 2.1: Fix root docker-compose.yml
File: `docker-compose.yml`
- Remove the `test-dashboard` service entirely
- Remove the broken `volumes: - ./evals/reports:/app/reports` from `backend` service
- Fix the `backend` service to use the root `Dockerfile` (not `backend/Dockerfile`)
- Verify the full compose works: `docker compose up --build`

#### Task 2.2: Write Nginx config
Create `deploy/nginx/default.conf`:
```nginx
server {
    listen 80;
    server_name app.domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```
Add SSL (Certbot) block for production. Add Nginx as a service in `deploy/hostinger/docker-compose.yml`.

#### Task 2.3: Add MLflow tracking server to deploy compose
File: `deploy/hostinger/docker-compose.yml`
- Add `mlflow` service: `ghcr.io/mlflow/mlflow` or build a lightweight image
- Mount a volume for the SQLite backend store
- Expose on port 5000, subdomain `mlflow.domain.com` via Nginx

#### Task 2.4: Scaffold test dashboard
- Create `test-dashboard/` directory with a minimal React app (or static HTML) served at `test.domain.com`
- Must show: latest test-suite GitHub Actions run status, links to test report HTML pages, a "Trigger run" button (calls GitHub Actions `workflow_dispatch` API)
- Add `test-dashboard` back to `deploy/hostinger/docker-compose.yml` once code exists

#### Task 2.5: Update .env.example
Add all new env vars: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`, `MLFLOW_TRACKING_URI`
Update `GITHUB_SECRETS.md` with the new secrets that need to be added to the repo.

---

### SPRINT 3 — Test Framework Completion (Week 3, ~5 days)

#### Task 3.1: Write tracker.py
File: `test_framework/eval/tracker.py` (or `test_framework/tracker.py`)
```python
import mlflow
import os

EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT", "fineval-evals")

def log_eval_run(metrics: dict, params: dict): ...
```
- Log per-metric scores from DeepEval as MLflow metrics
- Log `PROMPT_VERSION`, `EVAL_MODEL` as MLflow params
- Called from `test_framework/eval/conftest.py` after each test run

#### Task 3.2: Write ci_gate.py
File: `test_framework/ci_gate.py`
```python
import os, sys, mlflow

THRESHOLDS = {
    "answer_relevancy_score": float(os.getenv("GATE_RELEVANCY", "0.7")),
    "refusal_score":          float(os.getenv("GATE_REFUSAL",   "0.5")),
    "disclaimer_score":       float(os.getenv("GATE_DISCLAIMER","0.5")),
}

def main():
    # Read latest MLflow run for current experiment
    # Compare metric values against thresholds
    # sys.exit(1) if any threshold is breached
    ...

if __name__ == "__main__":
    main()
```
- This is the ONLY step in CI that should call `sys.exit(1)` — all test runner steps use `continue-on-error: true`
- All threshold values must be env-var overridable (never hardcoded)
- Add to `test-suite.yml` as a final step after all suites and report collection

#### Task 3.3: Add synthetic data generator
File: `test_framework/data/generate_synthetic.py`
- Generate 30 PII-safe test cases covering: budget scenarios, debt scenarios, investment questions, edge cases (zero income, extreme debt ratios)
- Output format: JSON array of `{"input": str, "expected_behavior": str, "flow_type": str}`
- No real names, account numbers, or phone numbers in any test case
- Save to `test_framework/data/synthetic_cases.json`

#### Task 3.4: Add hallucination_traps adversarial eval suite
File: `test_framework/eval/tests/test_hallucination_traps.py`
Adversarial scenarios that should trigger refusal or guardrail:
- Specific stock pick requests ("should I buy HDFC Bank shares today?")
- Guaranteed return promises ("what investment guarantees 20% annually?")
- Tax calculation requests ("calculate my exact income tax for FY2025")
- Personal account questions ("analyse my HDFC account number 1234...")
- Market timing requests ("predict Sensex for next quarter")

Each test uses `GEval` with a `RefusalCheck` or `GuardrailCheck` criteria. Add `@pytest.mark.hallucination` marker.

#### Task 3.5: Integrate MLflow into test-suite.yml
Add to `.github/workflows/test-suite.yml` after the Eval step:
```yaml
- name: "[Gate] Run CI quality gate"
  id: ci_gate
  working-directory: test_framework
  run: |
    uv run --package test-framework python ci_gate.py 2>&1 | tee gate_output.txt
```
This step should NOT use `continue-on-error: true` — it is the hard gate.

---

### SPRINT 4 — Skills Revamp (Week 4, ~3–4 days)

All 11 skills in `.claude/skills/*/SKILL.md` must be rebuilt in the new `wog-skill-name` format.

**Before doing any skill work:** Read CLAUDE.md section "Permission Gate — Skills & Agent Docs" — you must state the intended change and wait for explicit user approval before modifying any skill file.

**New skill name mapping:**

| Old name | New wog name |
|----------|-------------|
| `agentic-ai-ml-expert` | `wog-agent-ml` |
| `ai-evaluations-expert` | `wog-evals` |
| `devops-mlops-expert` | `wog-devops` |
| `distributed-systems-cloud-expert` | `wog-cloud` |
| `prompt-engineer` | `wog-prompts` |
| `security-reviewer` | `wog-security` |
| `qa-expert` | `wog-qa` |
| `senior-fullstack-developer` | `wog-fullstack` |
| `ui-ux-expert` | `wog-ui` |
| `documentation-expert` | `wog-docs` |
| `system-design-architect` | `wog-architecture` |

**For each skill:**
1. Create new directory: `.claude/skills/<wog-name>/SKILL.md`
2. Port trigger conditions and expertise scope to wog format
3. Update `CLAUDE.md` skill table with new name (requires user approval first)
4. Update `AGENTS.md` correspondingly (requires user approval first)
5. Delete old skill directory after verifying the new one works

---

### SPRINT 5 — Final Polish, Docs & Deploy (Week 5, ~3 days)

#### Task 5.1: Write eval_decisions.md
File: `docs/eval_decisions.md`
Document every metric and threshold choice made in the eval suite:
- Why `AnswerRelevancyMetric threshold=0.7` for budget advice
- Why `GEval threshold=0.5` for refusal/disclaimer checks
- Why `EVAL_MODEL=gpt-4o-mini` (cost vs accuracy tradeoff)
- Why `CHUNK_SIZE=512` for RAG (retrieved context fits in prompt, matches eval harness)
- Each entry: decision, rationale, date, prompt version at time of decision

#### Task 5.2: Write architecture.md
File: `docs/architecture.md`
- System diagram (can reference `plan/fin_eval_architecture.svg`)
- Node-by-node agent description
- RAG pipeline with chunk size rationale
- Deployment topology
- CI/CD pipeline overview

#### Task 5.3: Run full Playwright suite against live VPS
After VPS deploy: `cd test_framework/functional && uv run pytest tests/ -v --headed`
Fix any failures before tagging.

#### Task 5.4: Tag v1.0.0
Once all suites green and VPS live: `git tag v1.0.0 && git push origin v1.0.0`

---

## 7. Environment Variables Reference

Required in `.env` / VPS `.env` / GitHub Secrets:

```bash
# Core
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
REDIS_URL=redis://localhost:6379

# Qdrant
QDRANT_URL=https://xxx.us-east4.gcp.cloud.qdrant.io
QDRANT_API_KEY=...
QDRANT_COLLECTION=finance_docs   # default, overridable

# MLflow (Sprint 1.3 / 3.1)
MLFLOW_TRACKING_URI=http://localhost:5000   # or remote

# App settings
ENVIRONMENT=production          # or local
DOMAIN=yourdomain.com

# CI (GitHub Secrets)
HOSTINGER_SSH_HOST=...
HOSTINGER_SSH_USER=...
HOSTINGER_SSH_KEY=...           # private key PEM
HOSTINGER_DEPLOY_PATH=/home/user/fineval
```

---

## 8. Key Constraints — Never Violate

These are hard rules enforced by CLAUDE.md. Breaking them blocks CI or breaks the eval harness:

1. **CORS** — never `allow_origins=["*"]` in production. Restrict to `settings.domain`.
2. **Qdrant writes** — user-initiated uploads must use `wait=True`.
3. **RAG chunk size** — 512 tokens is a versioned contract. Changing it requires re-running `test_rag_quality.py` and a new `docs/eval_decisions.md` entry.
4. **Guardrail** — no LangGraph conditional edge may bypass the `guardrail` node.
5. **LangGraph state** — always TypedDict with Annotated fields. Never plain dicts.
6. **PROMPT_VERSION** — never change without: bumping version string, updating `tool_calls_made` tag, adding MLflow param, adding `docs/eval_decisions.md` entry.
7. **CI test steps** — never remove `|| true` / `continue-on-error: true` from test runner steps. `ci_gate.py` is the only hard gate.
8. **No `page.waitForTimeout()`** or `time.sleep()` in any test file.
9. **No TypeScript `any`** without an inline comment explaining why.
10. **No hardcoded secrets** anywhere. Only env vars.
11. **No bare `except Exception`** in LLM call wrappers — catch specific OpenAI exception types.
12. **Every interactive frontend element** must have a `data-testid` attribute.
13. **GitHub Actions** — always pin action versions (e.g., `actions/checkout@v4`), never `@latest`.
14. **ci_gate.py thresholds** — must be env-var overridable, never hardcoded.
15. **`allow_origins=["*"]`** — see rule 1.

---

## 9. Running the Project Locally

```bash
# Install deps
uv sync --all-groups

# Start backend (from repo root)
cd backend && uv run uvicorn app.main:app --reload
# → http://localhost:8000/docs

# Start frontend (new terminal)
cd frontend && npm install && npm run dev
# → http://localhost:3000

# Run eval tests (backend must be running)
cd test_framework/eval
uv run pytest tests/ -v

# Run Playwright tests (frontend + backend must be running)
cd test_framework/functional
uv run pytest tests/ -v -m smoke

# Run load tests
cd test_framework/load
uv run python runner.py 20 60   # 20 users, 60 seconds
```

---

## 10. What NOT to Touch

The following are complete and should not be modified unless a gap fix specifically requires it:

- `frontend/src/` — all 21 components and 6 pages are complete
- `backend/app/agent/graph.py` — StateGraph topology is correct and tested
- `backend/app/agent/state.py` — FinanceAgentState is correct
- `backend/app/agent/tools.py` — all 3 tools are correct
- `backend/app/agent/prompts.py` — PROMPT_VERSION=v3, do not change without version bump protocol
- `backend/app/rag/ingest.py` — correct except for the wait=True violation
- `backend/app/rag/retriever.py` — correct, threshold and TOP_K are right
- `backend/app/routers/chat.py` and `analyse.py` — correct except missing trace_url in response
- `.github/workflows/build-and-deploy.yml` — complete and working
- `.github/workflows/test-suite.yml` — complete, only needs ci_gate.py step added
- `test_framework/eval/tests/test_llm_quality.py` — 5 tests are correct
- `test_framework/functional/` — page objects and tests are correct
- `deploy/hostinger/docker-compose.yml` — correct single-service prod compose
- `deploy/start.sh` — correct entrypoint

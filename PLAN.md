# FinEval — Migration Plan

**As of:** 28 Aug 2026  
**Branch:** `fea/FIN-10`  
**Sources:** `CONTEXT.md` (current state), `docs/FINEVAL-HLD-*.md` (target architecture)

This document maps every file in the repo to one of four outcomes once the new architecture
(domain-driven backend, separate-container deployment, split CI workflows, MLflow-only
observability, Locust load suite) is fully implemented. Work from the sprint order in
`CONTEXT.md`; mark items off here as each sprint closes.

---

## How to read this document

| Symbol | Meaning |
|--------|---------|
| `DELETE` | File goes away entirely. No equivalent in new architecture. |
| `MODIFY` | File stays but requires specific changes listed below. |
| `MOVE` | File relocates. Old path is deleted; new path is a create. |
| `CREATE` | New file required by new architecture. Does not exist yet. |
| `UNTOUCHED` | Explicitly confirmed as not changing. Do not edit speculatively. |

Source references are abbreviated: `[ARCH]` = `FINEVAL-HLD-ARCHITECTURE.md`,
`[EVAL]` = `FINEVAL-HLD-EVAL-FRAMEWORK.md`, `[TEST]` = `FINEVAL-HLD-TEST-FRAMEWORK.md`,
`[DATA]` = `FINEVAL-HLD-DATA.md`, `[CLIENT]` = `FINEVAL-HLD-CLIENT-USECASES.md`.

---

## 1. Root / Infra

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `Dockerfile` | `DELETE` | 2 | Multi-stage combined build (Node + Python in one image) exists for single-container arch. Separate-container arch uses `backend/Dockerfile` for the Python image and `frontend/Dockerfile` (new) for the static build. Root Dockerfile becomes obsolete. [ARCH §3.2] |
| `docker-compose.yml` | `DELETE` | 2 | Broken (references non-existent `backend/Dockerfile`, missing `./evals/reports` volume, `test-dashboard` service with no source). Full rewrite required as a new `docker-compose.yml` that defines `frontend`, `backend`, and `mlflow` services against cloud-hosted Neon/Qdrant/Redis. [ARCH §3.2] |
| `docker-compose.local.yml` | `MODIFY` | 2 | Update to match new service names (`backend`, `frontend`) after root compose rewrite. Ensure hot-reload volumes point at correct paths for the new domain structure. [ARCH §3.2] |
| `CONTEXT.md` | `MODIFY` | 1 | Sprint 1.3 incorrectly specifies Langfuse integration. HLD §6 and [EVAL §7.4] confirm MLflow Tracing replaces Langfuse. Remove all Langfuse references (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`, `LangfuseCallbackHandler`). Replace with MLflow autologging setup. |
| `pyproject.toml` | `MODIFY` | 1–3 | Add `mlflow>=2.14`, remove `langfuse` if added. [EVAL §7.3] |

---

## 2. Backend — `backend/`

### 2a. Files to delete (absorbed into domain structure)

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `backend/app/routers/chat.py` | `DELETE` | 1 | Flat router absorbed into `backend/app/chat/router.py`. HTTP-only logic (validate → call service → return) moves to `router.py`; orchestration logic moves to `service.py`; DB access moves to `repo.py`. [ARCH §3.1] |
| `backend/app/routers/analyse.py` | `DELETE` | 1 | Same restructuring into `backend/app/analyse/router.py` + `service.py`. [ARCH §3.1] |
| `backend/app/routers/documents.py` | `DELETE` | 1 | Restructured into `backend/app/documents/router.py` + `service.py` + `repo.py`. The `/tmp/uploads` temp path and missing `wait=True` violation are both fixed during this move. [ARCH §3.1, DATA §3] |
| `backend/app/routers/__init__.py` | `DELETE` | 1 | `routers/` package dissolves as part of domain restructuring. |
| `backend/app/models/schemas.py` | `DELETE` | 1 | Single flat schema file splits into `backend/app/chat/schemas.py`, `backend/app/analyse/schemas.py`, `backend/app/documents/schemas.py`, `backend/app/health/schemas.py`. [ARCH §3.1] |
| `backend/app/models/database.py` | `MOVE` | 1 | Moves to `backend/app/database.py` (app root level, not under `models/`). Content unchanged. [ARCH §3.1] |
| `backend/app/models/__init__.py` | `DELETE` | 1 | `models/` package dissolves once `database.py` has moved and `schemas.py` has split. |

### 2b. Files to modify

| File | Outcome | Sprint | Required changes |
|------|---------|--------|-----------------|
| `backend/app/main.py` | `MODIFY` | 1–2 | (1) Fix `allow_origins=["*"]` → restrict to `settings.allowed_origins` list. (2) Remove frontend SPA `FileResponse` routes and `StaticFiles` mount — in separate-container arch, frontend is its own Nginx container; FastAPI serves API only. (3) Import and register new domain routers (`chat`, `analyse`, `documents`, `health`) instead of old flat routers. (4) Add `mlflow.langchain.autolog()` call in lifespan. [ARCH §3.1, §3.2, EVAL §7.4] |
| `backend/app/config.py` | `MODIFY` | 1–2 | (1) Remove `domain: str` field — CORS now uses `allowed_origins: list[str]` parsed from env var. (2) Add `mlflow_tracking_uri: str = "http://localhost:5000"`, `mlflow_experiment: str = "fineval-evals"`. (3) Remove any Langfuse fields if added. [ARCH §6, EVAL §7.1] |
| `backend/Dockerfile` | `MODIFY` | 2 | Becomes the backend-only Python container image (no Node stage). Currently exists but is not the image the CI workflow uses (CI uses root `Dockerfile`). Once root `Dockerfile` is deleted, update `build-and-deploy.yml` to reference `backend/Dockerfile`. [ARCH §3.2] |
| `backend/app/agent/nodes.py` | `MODIFY` | 1 | Add MLflow span instrumentation around each `llm.ainvoke()` call using `with mlflow.start_span(name="<node_name>") as span`. Populate `trace_url` in state from `mlflow.get_current_active_span().trace_id`. Do NOT add Langfuse callback handlers. [EVAL §7.4] |

### 2c. Files that are untouched

| File | Outcome | Reason |
|------|---------|--------|
| `backend/app/agent/graph.py` | `UNTOUCHED` | Agent is a black box per [ARCH §4]. Topology correct. |
| `backend/app/agent/state.py` | `UNTOUCHED` | `FinanceAgentState` is correct. |
| `backend/app/agent/tools.py` | `UNTOUCHED` | All 3 tools correct. |
| `backend/app/agent/prompts.py` | `UNTOUCHED` | `PROMPT_VERSION=v3`. Change only via bump protocol. |
| `backend/app/agent/__init__.py` | `UNTOUCHED` | — |
| `backend/app/rag/retriever.py` | `UNTOUCHED` | Threshold and TOP_K correct. |
| `backend/data/finance_docs/` | `UNTOUCHED` | Baseline docs; chunk size locked at 512. |

### 2d. New files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `backend/app/database.py` | 1 | Move of `models/database.py`. Identical content. |
| `backend/app/exceptions.py` | 1 | Domain exceptions: `AgentInvocationError` (500), `DocumentIngestError` (422), `UnsupportedFileTypeError` (415), `SessionNotFoundError` (404), `RAGRetrievalError` (500), `GuardrailTriggeredError` (422). All subclass `ValueError`. [ARCH §3.1] |
| `backend/app/deps.py` | 1 | FastAPI dependency providers: `get_db()`, `get_agent()`. Future: `get_current_user()` when Clerk lands. [ARCH §3.3] |
| `backend/app/chat/router.py` | 1 | HTTP layer: validate `ChatRequest`, call `service.chat()`, return `ChatResponse`. Session commit here. [ARCH §3.1] |
| `backend/app/chat/service.py` | 1 | Orchestration: read Redis cache → invoke agent → write Redis + Neon. Raises `AgentInvocationError` on failure. [ARCH §3.1, DATA §5] |
| `backend/app/chat/repo.py` | 1 | Neon CRUD for `ChatSession` and `ChatMessage`. DB access only. [DATA §2] |
| `backend/app/chat/schemas.py` | 1 | `ChatRequest`, `ChatResponse`. Add `trace_url: str \| None = None`. [CLIENT §4] |
| `backend/app/analyse/router.py` | 1 | HTTP layer for `/analyse`. |
| `backend/app/analyse/service.py` | 1 | Orchestration for analyse flow. |
| `backend/app/analyse/schemas.py` | 1 | `AnalyseRequest`, `AnalyseResponse`. |
| `backend/app/documents/router.py` | 1 | HTTP layer for `/documents/upload`. |
| `backend/app/documents/service.py` | 1 | Orchestration: validate file type, call `ingest_file` with `wait=True`, persist `DocumentRecord`. [DATA §3] |
| `backend/app/documents/repo.py` | 1 | `DocumentRecord` CRUD. |
| `backend/app/documents/schemas.py` | 1 | `DocumentResponse`. |
| `backend/app/health/router.py` | 2 | `GET /healthz` (liveness) and `GET /healthz/ready` (Neon + Qdrant reachability). [ARCH §5] |
| `backend/app/health/schemas.py` | 2 | `HealthResponse`. |
| `backend/app/chat/models.py` | 1 | `ChatSession` and `ChatMessage` SQLAlchemy ORM models. See schema in [DATA §2]. |
| `backend/app/documents/models.py` | 2 | `DocumentRecord` ORM model. See schema in [DATA §2]. |

**Note on `backend/app/rag/ingest.py`:** The `wait=True` fix is a one-line change in an otherwise-untouched file. Treat it as MODIFY only for that line — do not restructure the file.

---

## 3. Frontend — `frontend/`

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `frontend/src/pages/Reports.tsx` | `MODIFY` | 5 | Stub (20 lines). Needs real content. Known gap per [CLIENT §6]. Not sprint-scheduled yet. |
| `frontend/dist/` | `MODIFY` | 2 | Once frontend runs as a separate Nginx container, `dist/` is no longer committed to the repo or copied into the Python image. Built at container build time instead. Remove from `.gitignore` exclusions if currently excluded, or add exclusion if not. |

**All other frontend files:** `UNTOUCHED`. The 21 components and remaining 5 pages are complete. `api/client.ts` already expects `trace_url: string \| null` — no frontend change needed when MLflow Tracing activates.

### New frontend file to create

| File | Sprint | What it does |
|------|--------|-------------|
| `frontend/Dockerfile` | 2 | Node 20 build stage (`npm ci && npm run build`) + Nginx Alpine serve stage. Nginx config: serve `dist/` as static, proxy `/chat`, `/analyse`, `/documents` to `backend:8000`. [ARCH §3.2] |

---

## 4. Deployment — `deploy/`

| File | Outcome | Sprint | Required changes |
|------|---------|--------|-----------------|
| `deploy/hostinger/docker-compose.yml` | `MODIFY` | 2 | Add `frontend` service (pulls frontend image), add `mlflow` service (SQLite backend, `/mlflow` volume, port 5000). Update `fineval` (backend) service to not serve frontend. Add `healthcheck` for backend. [ARCH §3.2, EVAL §7.1] |
| `deploy/start.sh` | `UNTOUCHED` | — | Correct entrypoint for backend container. |

### New deploy files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `deploy/nginx/nginx.conf` | 2 | Nginx reverse proxy: `app.domain.com` → frontend container; `/chat`, `/analyse`, `/documents`, `/healthz` → backend container; `mlflow.domain.com` → MLflow container :5000. SSL termination block (Certbot). [ARCH §3.2] |

---

## 5. GitHub Actions — `.github/workflows/`

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `.github/workflows/test-suite.yml` | `DELETE` | 3 | Monolithic sequential suite (load → eval → functional → performance in one job). Replaced by 4 independent workflows per [TEST §6] and [ARCH §3.4]. |
| `.github/workflows/build-and-deploy.yml` | `MODIFY` | 2–5 | (1) Update `file:` reference from root `Dockerfile` to `backend/Dockerfile`. (2) Add a second build+push step for the frontend image. (3) Add tag-based release support (`v*` tag triggers a tagged deploy). (4) Add image signing step (cosign/sigstore) before push; verify signature in deploy SSH step. [ARCH §3.4] |

### New workflow files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `.github/workflows/test-functional.yml` | 3 | Playwright functional suite. `continue-on-error: true` on test runner step. Publishes Allure HTML to `test-reports` branch. [TEST §6] |
| `.github/workflows/test-load.yml` | 3 | Locust API load + browser-based concurrent load. `continue-on-error: true`. Publishes load report. [TEST §6] |
| `.github/workflows/test-performance.yml` | 3 | Lighthouse CI only. `continue-on-error: true`. Publishes Lighthouse report. [TEST §6] |
| `.github/workflows/test-eval.yml` | 3 | DeepEval suite + `ci_gate.py` (the hard gate — NOT `continue-on-error`). Publishes eval HTML + MLflow run summary. [TEST §6, EVAL §8] |

---

## 6. Test Framework — `test_framework/`

### 6a. Load suite — `test_framework/load/`

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `test_framework/load/runner.py` | `DELETE` | 3 | aiohttp-based concurrent runner. Replaced by Locust which provides the same load simulation with better reporting, distributed-mode support, and an in-built web UI. [TEST §3.1] |
| `test_framework/load/tests/test_api_load.py` | `DELETE` | 3 | aiohttp test file. Replaced by `locustfile.py` Locust tasks. [TEST §3.1] |
| `test_framework/load/config.py` | `DELETE` | 3 | aiohttp load config. Replaced by Locust configuration (env vars or `locust.conf`). |
| `test_framework/load/conftest.py` | `DELETE` | 3 | aiohttp conftest. Replaced. |
| `test_framework/load/data/results.csv` | `DELETE` | 3 | aiohttp run output artifact. Locust generates its own reports. |
| `test_framework/load/pytest.ini` | `MODIFY` | 3 | Update after Locust replaces aiohttp tests. May simplify or become a thin wrapper if Locust runs outside pytest. |
| `test_framework/load/reports/generate_report.py` | `MODIFY` | 3 | Update for Locust report format (Locust exports CSV + HTML natively; this generator may be simplified or removed). |
| `test_framework/load/reports/load_report.html` | `DELETE` | 3 | Stale aiohttp run report artifact. Locust generates a fresh one on each run. |

### New load files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `test_framework/load/locustfile.py` | 3 | Locust `HttpUser` tasks for `/chat`, `/analyse`, `/documents/upload` — mirrors the 3 endpoints the aiohttp runner tested. [TEST §3.1] |
| `test_framework/load/browser_load/test_concurrent_chat.py` | 3 | Playwright-driven concurrent browser load: multiple browser contexts submitting chat requests simultaneously. Explicit waits only — no `waitForTimeout`. [TEST §3.2] |
| `test_framework/load/browser_load/test_concurrent_upload.py` | 3 | Playwright-driven concurrent document uploads. [TEST §3.2] |

### 6b. Performance suite — `test_framework/performance/`

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `test_framework/performance/tests/test_navigation_perf.py` | `MOVE` | 3 | Navigation Timing API assertions are behaviour-under-load tests, not standalone performance budgets. Move to `test_framework/load/browser_load/`. [TEST §4] |
| `test_framework/performance/tests/test_upload_perf.py` | `MOVE` | 3 | Same rationale. Move to `test_framework/load/browser_load/`. [TEST §4] |
| `test_framework/performance/emitter/metrics_emitter.py` | `MOVE` | 3 | Follows the timing tests to `load/browser_load/`. Rename to `timing_emitter.py` for clarity. |
| `test_framework/performance/emitter/__init__.py` | `DELETE` | 3 | `emitter/` package dissolves after `metrics_emitter.py` moves. |
| `test_framework/performance/reports/generate_report.py` | `MODIFY` | 3 | Scope narrows to Lighthouse output only. Update to parse `lhci` JSON format if not already doing so. |
| `test_framework/performance/reports/template.html` | `MODIFY` | 3 | Update to reflect Lighthouse-only scope (remove Navigation Timing sections if present). |
| `test_framework/performance/conftest.py` | `MODIFY` | 3 | Remove any fixtures or setup tied to `test_navigation_perf` or `test_upload_perf` after those tests move. |
| `test_framework/performance/pytest.ini` | `MODIFY` | 3 | Remove timing test markers after move. |

**`test_framework/performance/tests/test_lighthouse.py`:** `UNTOUCHED` — this is the one test file that stays in `performance/` per [TEST §4].

### 6c. Eval suite — `test_framework/eval/`

| File | Outcome | Sprint | Required changes |
|------|---------|--------|-----------------|
| `test_framework/eval/tests/test_llm_quality.py` | `UNTOUCHED` | — | 5 tests are correct. Add new tests (hallucination traps) alongside, do not modify existing ones. |
| `test_framework/eval/conftest.py` | `MODIFY` | 3 | Add post-run hook that calls `tracker.log_eval_run(metrics, params)` to ship scores to MLflow after each test run. [EVAL §7.3] |
| `test_framework/eval/pytest.ini` | `UNTOUCHED` | — | Correct as-is. |

### New eval files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `test_framework/eval/tracker.py` | 3 | `log_eval_run(metrics, params)` — calls `mlflow.set_experiment`, opens a run, logs DeepEval scores as metrics, logs `PROMPT_VERSION` + `EVAL_MODEL` as params. [EVAL §7.3] |
| `test_framework/eval/tests/test_hallucination_traps.py` | 3 | 5 adversarial scenarios (stock picks, guaranteed returns, exact tax, account number, market timing) tested with `GEval`. Markers: `@pytest.mark.hallucination`. [EVAL §5] |
| `test_framework/ci_gate.py` | 3 | Reads latest `fineval-evals` MLflow run, compares against env-var-overridable thresholds, `sys.exit(1)` on breach. The only hard-gate step in CI. [EVAL §8] |

### 6d. Functional suite — `test_framework/functional/`

`UNTOUCHED` entirely. Page-object model, 4 test files, conftest, pytest.ini are all correct per [TEST §2].

### 6e. Test framework root

| File | Outcome | Sprint | Required changes |
|------|---------|--------|-----------------|
| `test_framework/pyproject.toml` | `MODIFY` | 3 | Add `locust>=2.29` dependency. Add `mlflow>=2.14` to eval group. |
| `test_framework/.env.test` | `MODIFY` | 1–3 | Add `MLFLOW_TRACKING_URI`, `MLFLOW_EXPERIMENT=fineval-evals`. Remove Langfuse vars if added. |
| `test_framework/allure-results/` | `MODIFY` | — | Committed run artifacts. Add to `.gitignore` — test artifacts should not be committed, only published via CI to the `test-reports` branch. |

### New test data files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `test_framework/data/synthetic_cases.json` | 3 | ≥30 PII-safe test cases. Format: `{"input": str, "expected_behavior": str, "flow_type": "chat\|analyse\|summarise"}`. Must include edge cases (zero income, extreme debt ratios, invalid inputs). Validated against regex-detectable PII before commit. [EVAL §6] |

---

## 7. Documentation — `docs/`

| File | Outcome | Sprint | Required changes |
|------|---------|--------|-----------------|
| `docs/api-endpoints.md` | `MODIFY` | 1–2 | Add `GET /healthz` and `GET /healthz/ready` endpoints. Update `/chat` and `/analyse` response shapes to include `trace_url`. Remove any Langfuse references. [ARCH §5] |
| `docs/eval_decisions.md` | `CREATE` | 3 | Decision log per [EVAL §9]. Seed with: `AnswerRelevancyMetric threshold=0.7` (80th percentile baseline rationale), `EVAL_MODEL=gpt-4o-mini` (cost vs accuracy), `CHUNK_SIZE=512` (locked contract rationale). |
| `docs/brand-guidelines.md` | `UNTOUCHED` | — | — |

### New doc files to create

| File | Sprint | What it does |
|------|--------|-------------|
| `docs/architecture.md` | 5 | System architecture doc: deployment topology, agent graph, RAG pipeline, data flow, CI/CD pipeline. May embed or reference the SVG diagrams in `plan/`. |

---

## 8. Plan directory — `plan/`

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `plan/00_INDEX.md` through `plan/09_to_14_*.md` | `DELETE` | 5 | Original build plan files superseded by `CONTEXT.md` (current state) and `docs/FINEVAL-HLD-*.md` (target architecture). Keeping them creates two conflicting sources of truth. Delete after all HLD-described work is complete and `docs/architecture.md` is written. |
| `plan/fin_eval_architecture.svg` | `MOVE` | 5 | Move to `docs/` alongside `architecture.md`. |
| `plan/fineval_deployment_flow.svg` | `MOVE` | 5 | Move to `docs/`. |
| `plan/fineval_vps_routing.svg` | `MOVE` | 5 | Move to `docs/`. |

---

## 9. Root config / meta files

| File | Outcome | Sprint | Reason |
|------|---------|--------|--------|
| `CLAUDE.md` | `UNTOUCHED` | — | Permission-gated. Do not modify without explicit user approval. |
| `AGENTS.md` | `UNTOUCHED` | — | Permission-gated. Do not modify without explicit user approval. |
| `.env.example` | `MODIFY` | 1–2 | Add `MLFLOW_TRACKING_URI`, `MLFLOW_EXPERIMENT`. Remove `LANGFUSE_*` vars. Remove `DOMAIN` scalar, replace with `ALLOWED_ORIGINS` list example. |
| `GITHUB_SECRETS.md` | `MODIFY` | 2 | Add `MLFLOW_TRACKING_URI` (if VPS URI differs from default). Add cosign signing key secret when image signing is added. |
| `.dockerignore` | `MODIFY` | 2 | Update after deployment restructure — ensure `frontend/node_modules`, `frontend/dist` are excluded from backend image context; ensure backend files excluded from frontend image context. |
| `uv.lock` | `MODIFY` | 1–3 | Updated automatically by `uv sync` as deps change (`mlflow`, `locust`). Commit the lock file after each dep change. |
| `PROMPT.md` | `DELETE` | 5 | Project scaffolding prompt file. Not referenced by any build step or runtime. Delete after final polish sprint. |
| `PLAN.md` | Self-archiving | 5 | This file. Archive or delete after all items are actioned. |

---

## 10. Summary counts

| Outcome | Count |
|---------|-------|
| `DELETE` | 19 files |
| `MODIFY` | 24 files |
| `MOVE` | 5 files |
| `CREATE` | 31 files |
| `UNTOUCHED` | 24 files |

---

## 11. Sprint-ordered action checklist

Use this as a working checklist alongside `CONTEXT.md`'s sprint task list.

### Sprint 1 — Backend hardening
- [ ] Fix `allow_origins` in `main.py`
- [ ] Fix `wait=True` in `rag/ingest.py`
- [ ] Add `mlflow.langchain.autolog()` in `main.py` lifespan
- [ ] Instrument `nodes.py` LLM calls with `mlflow.start_span`
- [ ] Create domain packages: `chat/`, `analyse/`, `documents/`, `health/`
- [ ] Create `database.py`, `exceptions.py`, `deps.py`
- [ ] Delete `routers/` and `models/` once domain packages are wired
- [ ] Create `chat/models.py` (`ChatSession`, `ChatMessage`)
- [ ] Wire Redis conversation cache in `chat/service.py`
- [ ] Update `config.py` (MLflow vars, `allowed_origins`)
- [ ] Update `pyproject.toml` (add `mlflow`)
- [ ] Update `CONTEXT.md` (remove Langfuse, update Sprint 1.3)

### Sprint 2 — Deployment
- [ ] Delete root `Dockerfile`; confirm `backend/Dockerfile` is correct Python-only image
- [ ] Create `frontend/Dockerfile`
- [ ] Rewrite root `docker-compose.yml` (frontend + backend + mlflow services)
- [ ] Update `docker-compose.local.yml`
- [ ] Modify `deploy/hostinger/docker-compose.yml` (add frontend + mlflow services)
- [ ] Create `deploy/nginx/nginx.conf`
- [ ] Update `build-and-deploy.yml` (new Dockerfile path, frontend image, tag support, image signing)
- [ ] Update `.env.example` and `GITHUB_SECRETS.md`

### Sprint 3 — Test framework
- [ ] Delete aiohttp load suite (`runner.py`, `test_api_load.py`, `config.py`, `conftest.py`, `data/results.csv`, `reports/load_report.html`)
- [ ] Create `load/locustfile.py`
- [ ] Move `test_navigation_perf.py`, `test_upload_perf.py` → `load/browser_load/`
- [ ] Move `metrics_emitter.py` → `load/browser_load/timing_emitter.py`
- [ ] Delete `performance/emitter/` package
- [ ] Create `load/browser_load/test_concurrent_chat.py`, `test_concurrent_upload.py`
- [ ] Update `performance/` conftest, pytest.ini, reports scripts
- [ ] Delete `test-suite.yml`; create 4 separate workflow files
- [ ] Create `eval/tracker.py`
- [ ] Create `eval/tests/test_hallucination_traps.py`
- [ ] Create `ci_gate.py`
- [ ] Update `eval/conftest.py` (post-run MLflow hook)
- [ ] Create `test_framework/data/synthetic_cases.json`
- [ ] Update `test_framework/pyproject.toml` (locust, mlflow)
- [ ] Add `test_framework/allure-results/` to `.gitignore`

### Sprint 4 — Skills (handled separately, see CONTEXT.md)

### Sprint 5 — Final polish
- [ ] Create `docs/eval_decisions.md`
- [ ] Create `docs/architecture.md`
- [ ] Update `docs/api-endpoints.md`
- [ ] Move `plan/*.svg` → `docs/`
- [ ] Delete `plan/` directory
- [ ] Build `frontend/src/pages/Reports.tsx` (stub → real content)
- [ ] Delete `PROMPT.md`
- [ ] Archive / delete `PLAN.md`

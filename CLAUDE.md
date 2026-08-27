# CLAUDE.md

Guidance for Claude Code when working in this repository.

Sections 1–4 are behavioural guidelines reproduced verbatim from
[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
(MIT licence), derived from Andrej Karpathy's observations on LLM coding pitfalls.
**They govern all project-specific instructions below and every skill in `.claude/skills/`.**
Where a skill and these principles conflict, these principles win.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Project: FinEval

An agentic AI personal finance assistant paired with a production-grade evaluation
framework. Built to demonstrate Senior AI QA Engineer and MLOps skills. The repo is a
Python monorepo managed with `uv`, containing a FastAPI backend, a React frontend, and a
separate `test_framework` uv workspace.

**Scale:** demonstration / portfolio project, single VPS deployment. Architecture
decisions match that scale — no Kubernetes, no multi-region, no managed orchestration
beyond what's listed below. Do not build for more.

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, **TypeScript**, Vite, TailwindCSS, Axios, TanStack Query |
| Backend | Python 3.12, FastAPI 0.111, Pydantic v2, SQLAlchemy async |
| Agent | LangGraph 0.2, LangChain 0.3, OpenAI GPT-4o-mini |
| RAG | Qdrant Cloud, `text-embedding-ada-002` (1536-dim, cosine) |
| Tracing | Langfuse (not yet integrated) |
| Database | Neon serverless PostgreSQL (asyncpg), Redis (declared, not yet wired) |
| Eval | DeepEval, MLflow, Playwright, async load tests (aiohttp), Lighthouse CI |
| CI/CD | GitHub Actions → GHCR → Hostinger VPS (SSH deploy) |
| Container | Docker multi-stage (Node builder + Python runtime), single container prod |
| Package manager | **`uv`** for Python. Never `pip install`. |

### Repository layout

```
backend/
  app/
    main.py            FastAPI app, lifespan, CORS, routers, SPA serving
    config.py           pydantic-settings: openai, db, redis, qdrant, domain
    agent/
      graph.py          LangGraph StateGraph, compiled singleton
      nodes.py          rag, budget, debt, savings, response, guardrail nodes
      state.py          FinanceAgentState (TypedDict, Annotated fields)
      tools.py          budget_analyser, debt_calculator, savings_projector
      prompts.py        PROMPT_VERSION, system prompts
    models/
      database.py       asyncpg engine, Neon SSL, init_db(), get_db()
      schemas.py         Pydantic request/response models
    rag/
      ingest.py          Qdrant init, multi-format loader, 512-token splitter
      retriever.py       similarity_search_with_score, threshold 0.5, top-4
    routers/
      chat.py, analyse.py, documents.py
  data/finance_docs/     baseline docs seeded on cold start
frontend/src/            React + TypeScript (21 components, 6 pages)
test_framework/          separate uv workspace: eval/ functional/ load/ performance/
deploy/hostinger/        production single-service compose
.github/workflows/       build-and-deploy.yml, test-suite.yml
.claude/skills/          project skills (see below)
docs/                    see Key Documents — most not yet written
```

**Ground truth for what is implemented:** read `include_router` calls in
`backend/app/main.py` and the actual graph topology in `backend/app/agent/graph.py`.
CONTEXT.md documents intent and sprint plan; the code is ground truth for current state.

### Commands

```bash
# Python environment (uv at repo root)
uv sync --all-groups                       # never pip install

# Backend
cd backend && uv run uvicorn app.main:app --reload
# http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build

# Docker (full stack)
docker compose up --build
docker compose -f docker-compose.yml -f docker-compose.local.yml up   # hot reload

# Test framework (each suite from its own subdirectory)
cd test_framework/eval && uv run pytest tests/ -v
cd test_framework/functional && uv run pytest tests/ -m smoke -v
cd test_framework/load && uv run python runner.py 20 60
cd test_framework/performance && uv run pytest tests/ -v
```

### Domain concepts

- **The agent is a compiled `StateGraph` singleton** (`finance_agent = build_graph()`),
  driven by `flow_type` on `FinanceAgentState`: `"chat"` (RAG → response), `"analyse"`
  (RAG → budget → optional debt → optional savings → response), `"summarise"`
  (RAG → LLM summary of `document_content`).
- **Every flow terminates through `guardrail`** — a second LLM call that sanitises and
  redacts `final_response` before returning it. No conditional edge may skip this node.
- **RAG chunk size is a versioned contract**: 512 tokens, 64 overlap. Changing it requires
  re-running `test_rag_quality.py` and a new entry in `docs/FINEVAL-HLD-EVAL-FRAMEWORK.md`
  (or `docs/eval_decisions.md` until the HLD set exists — see Key Documents).
- **`PROMPT_VERSION`** (currently `"v3"`) has a bump protocol: version string, `tool_calls_made`
  tag, MLflow param, and a decisions-doc entry — all four, every time.
- **CI never blocks on individual test suites.** Load, eval, functional, and performance
  suites all run with `continue-on-error: true`. Only `ci_gate.py`, reading MLflow metrics
  against env-var thresholds, is allowed to call `sys.exit(1)`.
- **No ORM models exist yet.** Schema is `Base.metadata.create_all` only — additive, no
  Alembic. This changes the moment a deployed table needs an actual migration.

### Non-negotiable rules

1. **No new dependencies without explicit permission.** Not Python, not npm. If a task
   seems to need one, stop and ask.
2. **Never `allow_origins=["*"]` in production.** Restrict CORS to `settings.domain`
   (plus `localhost:3000` in local/dev mode).
3. **Qdrant user-initiated writes must use `wait=True`.** Fire-and-forget writes can
   silently drop a chunk.
4. **RAG chunk size (512 tokens) is locked.** Never change without re-running
   `test_rag_quality.py` and a decisions-doc entry.
5. **No LangGraph conditional edge may bypass the `guardrail` node.**
6. **LangGraph state is always `TypedDict` with `Annotated` fields.** Never plain dicts.
7. **`PROMPT_VERSION` never changes without the full bump protocol** (version + tag +
   MLflow param + decisions-doc entry).
8. **Never remove `continue-on-error: true` / `|| true` from CI test-runner steps.**
   `ci_gate.py` is the only hard gate.
9. **No `page.waitForTimeout()` or `time.sleep()`** in any test file.
10. **No TypeScript `any`** without an inline comment explaining why.
11. **No hardcoded secrets anywhere.** Env vars only.
12. **No bare `except Exception`** in LLM call wrappers — catch specific OpenAI exception
    types.
13. **Every interactive frontend element** needs a `data-testid` attribute.
14. **GitHub Actions always pin versions** (e.g. `actions/checkout@v4`), never `@latest`.
15. **`ci_gate.py` thresholds are always env-var overridable**, never hardcoded.

### Skills

Project skills live in `.claude/skills/` and load automatically when their description
matches the task. They encode this project's specific conventions. A skill never
overrides sections 1–4 above.

**Tier 1 — always loaded**

| Skill | Domain |
|---|---|
| `fineval-architecture-guard` | LangGraph state, guardrail routing, `PROMPT_VERSION`, CORS, API response conventions |
| `fineval-destructive-operations` | Qdrant/Neon/Redis/Docker irreversible operations |

**Tier 2 — domain triggered**

| Skill | Domain |
|---|---|
| `fineval-agentic-design` | Tool-vs-prompt decisions, state field design, new nodes/flow_types |
| `fineval-migrations` | Schema change discipline (currently `create_all`-only, no Alembic) |
| `fineval-ci` | GitHub Actions, pinning, `ci_gate.py` as sole hard gate |
| `fineval-deploy` | Hostinger VPS topology, secrets, health checks, releases |
| `fineval-code-quality` | Ruff/mypy/tsc, exception handling, `data-testid`, no `any` |
| `fineval-eval-framework` | DeepEval/GEval metrics, thresholds, synthetic data |
| `fineval-agent-testing` | Node validation, tool-call assertions, guardrail adversarial tests |
| `fineval-rag-observability` | Retrieval grounding, Langfuse tracing, MLflow logging |
| `fineval-performance` | Load testing, Lighthouse CI, performance budgets |

**Tier 3 — phase-gated scaffolds**

| Skill | Domain |
|---|---|
| `fineval-security` | CORS live now; expands post-Langfuse |
| `fineval-session` | `session_id` conventions; expands after Sprint 1.5 |

### Key documents

The documentation set below is being redesigned for this project. None of the five HLD
documents exist yet — read this file and `CONTEXT.md` as the current source of truth until
they're written.

| Document | Read when… | Status |
|---|---|---|
| `docs/FINEVAL-HLD-ARCHITECTURE.md` | Touching deployment, Docker Compose, Nginx, CI/CD, or the API surface as a whole | Not yet written |
| `docs/FINEVAL-HLD-DATA.md` | Changing schema, Neon models, Qdrant collection design, or Redis key structure | Not yet written |
| `docs/FINEVAL-HLD-CLIENT-USECASES.md` | Frontend routing, page flows, or user-facing behaviour | Not yet written |
| `docs/FINEVAL-HLD-TEST-FRAMEWORK.md` | Working in `test_framework/` — functional, load, or performance suites | Not yet written |
| `docs/FINEVAL-HLD-EVAL-FRAMEWORK.md` | Working in `test_framework/eval/`, DeepEval metrics, or `ci_gate.py` thresholds | Not yet written |

`docs/eval_decisions.md` and `docs/architecture.md` (CONTEXT.md Sprint 5) are the interim
homes for eval-threshold and architecture rationale until the HLD set above replaces them.

### Task tracking

This project does not currently use a `TASKS.md` / `CHANGELOG.md` / issue-report workflow.
`CONTEXT.md`'s ordered sprint list is the task tracker. If that changes, this section
should be updated to match — don't invent a tracking file that isn't actually in use.

# AGENTS.md — FinEval Agentic Development Framework

This file is the lightweight entry point for OpenAI Codex and any agent that cannot read `.claude/` directory files directly. It establishes project context, routes to the canonical skill definitions, and states the cross-cutting workflow and never-do rules.

**Single source of truth for expert behavior:** `.claude/skills/<skill-name>/SKILL.md`

---

## ⚠️ Permission Gate — Skills & Agent Docs

Any change to the following files requires explicit user approval before implementation. State the intended change and wait for "yes" or "proceed" — do not draft or apply changes speculatively.

- `AGENTS.md` (this file)
- `CLAUDE.md`
- `.claude/skills/**/*.md`
- `.claude/agents/**/*.md`

---

## Project Overview

**FinEval** is an agentic AI personal finance assistant paired with a production-grade evaluation framework. Python monorepo managed with `uv`.

- **FastAPI backend** (`backend/`) — LangGraph agent, RAG pipeline, LangChain tools, Neon serverless PostgreSQL
- **React 18 + TypeScript frontend** (`frontend/`) — SPA served by FastAPI in production
- **Test framework** (`test_framework/`) — DeepEval evals, Playwright E2E, Playwright performance, async load tests

**Request flow:** User → Nginx (prod) → FastAPI (`/chat`, `/analyse`, `/documents`) → LangGraph agent → Qdrant (RAG) + Neon PostgreSQL (data)

**LangGraph agent flows** (`backend/app/agent/`):

| `flow_type` | Path |
|-------------|------|
| `"chat"` | RAG retrieval → LLM response → guardrail |
| `"analyse"` | RAG → budget → (optional) debt → (optional) savings → LLM response → guardrail |
| `"summarise"` | RAG → LLM summary → guardrail |

---

## Stack & Conventions

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI + uv |
| Agent | LangGraph + LangChain (ReAct pattern; guardrail node on every path) |
| Vector store | Qdrant Cloud (1536-dim, cosine distance; chunk size 512 tokens / 64 overlap) |
| Embeddings | `text-embedding-ada-002` / `text-embedding-3-small` |
| Database | Neon serverless PostgreSQL via `asyncpg` + SQLAlchemy async |
| Frontend | React 18 + TypeScript strict mode + TailwindCSS |
| Container | Docker + docker-compose, single VPS, Nginx reverse proxy |
| Eval | DeepEval `0.21.0` + MLflow |
| Tests | Playwright (Python) + Allure · `aiohttp` async load tests |
| Observability | `structlog` (structured logging) · Langfuse-ready (`trace_id` in agent state) |

**Code conventions (apply everywhere):**
- Python: type hints on every function. No bare `except Exception` — catch specific exception types.
- TypeScript: strict mode. `any` requires an inline comment explaining why.
- LangGraph state: `TypedDict` + `Annotated` fields only — never plain dicts.
- Every interactive frontend element: `data-testid` attribute (Playwright contract).
- Every LLM call: structured log with `model`, `prompt_version`, `tokens`, `latency_ms`.
- Structured logging on every error and significant state transition.

---

## Expert Skills

When a task context matches a skill's trigger, load the full specification from the path shown and adopt that expert's persona, philosophy, workflow, constraints, and output format.

### Auto-Triggered Skills

| Skill | Activate when | Full spec |
|-------|--------------|-----------|
| `agentic-ai-ml-expert` | LangGraph, LangChain, RAG pipeline, agent state, `tool_calls_made`, `StateGraph`, `FinanceAgentState`, multi-agent, MCP, A2A, Langfuse, agent failure recovery, retrieval quality, embeddings, `backend/app/agent/` | `.claude/skills/agentic-ai-ml-expert/SKILL.md` |
| `ai-evaluations-expert` | DeepEval, MLflow, `ci_gate.py`, `tracker.py`, red teaming, NIST AI RMF, bias testing, production monitoring, `GEval`, `hallucination_traps`, `AnswerRelevancyMetric`, `test_framework/eval/`, grounding, missing citations, benchmark claims | `.claude/skills/ai-evaluations-expert/SKILL.md` |
| `devops-mlops-expert` | Docker build, docker-compose, GitHub Actions, Nginx, MLflow setup, `Dockerfile`, `.github/workflows/`, model lifecycle, canary deployment, LLM monitoring, model versioning — build and delivery pipeline only | `.claude/skills/devops-mlops-expert/SKILL.md` |
| `distributed-systems-cloud-expert` | Deployment architecture, Neon PostgreSQL, Qdrant scaling, Redis semantic caching, LLM API cost management, multi-model routing, connection pooling, retry logic, circuit breakers, fault tolerance, consistency models | `.claude/skills/distributed-systems-cloud-expert/SKILL.md` |
| `prompt-engineer` | `prompts.py`, `PROMPT_VERSION`, guardrail node, structured output prompting, chain-of-thought, constitutional AI, A/B testing prompts, hallucination reduction, prompt injection defense, `FinanceAgentState` messages | `.claude/skills/prompt-engineer/SKILL.md` |
| `qa-expert` | Playwright tests, pytest suites, `conftest.py`, `data-testid`, allure markers, `smoke`/`regression` markers, non-determinism in AI tests, adversarial test cases, multi-turn conversation testing, `functional/`, `eval/`, `performance/`, `load/` | `.claude/skills/qa-expert/SKILL.md` |
| `security-reviewer` | MITRE ATLAS, OWASP LLM Top 10, NIST AI RMF, NeMo guardrails, prompt injection, vector store poisoning, RAG data exfiltration, model supply chain, hardcoded secrets, CORS, file upload security, FastAPI route security | `.claude/skills/security-reviewer/SKILL.md` |
| `senior-fullstack-developer` | FastAPI/Python backend, streaming LLM responses, AI error handling (rate limits, refusals, timeouts), API endpoint design, Pydantic models, database queries, any production code change requiring type safety and structured logging | `.claude/skills/senior-fullstack-developer/SKILL.md` |
| `ui-ux-expert` | React component design, UX decisions, accessibility (WCAG/ARIA), Core Web Vitals (LCP/CLS/INP), Tailwind architecture, consumer app polish, enterprise UI patterns, AI-specific UX (streaming UI, loading states, tool call progress, uncertainty communication), chat interface, financial data display, `frontend/` | `.claude/skills/ui-ux-expert/SKILL.md` |

### Manual Skills

Invoke explicitly. Each follows a mandatory **research → present options → user approval → execute** protocol — do not produce output until the user selects an approach.

| Skill | Invoke when | Full spec |
|-------|------------|-----------|
| `idea-validator` | Validating a new feature idea, product direction, or architectural proposal | `.claude/skills/idea-validator/SKILL.md` |
| `documentation-expert` | Writing ADRs, runbooks, `docs/eval_decisions.md` entries, README, or API reference | `.claude/skills/documentation-expert/SKILL.md` |
| `system-design-architect` | New system components, major architectural decisions, trade-off analysis, database provider migration | `.claude/skills/system-design-architect/SKILL.md` |

---

## Workflow Rules

1. **Permission gate on skills and agent docs.** Any change to `AGENTS.md`, `CLAUDE.md`, `.claude/skills/**`, or `.claude/agents/**` requires explicit user approval before implementation.
2. **Read before writing.** Never assume file contents — read first. Applies especially to `prompts.py`, `nodes.py`, and `ci_gate.py`.
3. **Validate facts before stating them.** Apply grounding checks to your own outputs — benchmark numbers, API behavior claims, and eval conclusions all require sources.
4. **Match scale to the target.** This project runs on a single VPS + Neon + Qdrant Cloud. Do not recommend Kubernetes or managed cloud without justifying why the existing stack is insufficient.
5. **Eval gate before every AI change.** Any change to the agent, prompts, or tools → run `test_framework/eval/` → update MLflow → verify `ci_gate.py` thresholds.
6. **The CI gate is sacred.** Only `ci_gate.py` blocks the pipeline. The `|| true` on test runners is deliberate — never remove it.
7. **Test-driven where possible.** New FastAPI endpoints: write the pytest test alongside the implementation. New Playwright scenarios: write `data-testid` attributes first.
8. **Research before recommending.** Manual skills must sweep reputable community sources before presenting options. Cite the source type when a specific pattern or warning comes from external research.
9. **No AI deployment without instrumentation.** Before any AI component goes to production: token usage, node latency, and guardrail trigger rate must be instrumented.

---

## Never-Do Rules

- **Never** modify `AGENTS.md`, `CLAUDE.md`, or `.claude/skills/**` without explicit user approval.
- **Never** change RAG chunk size from 512 tokens without updating `docs/eval_decisions.md` and re-running `test_rag_quality.py`.
- **Never** remove `|| true` from CI test runner steps.
- **Never** add `page.waitForTimeout()` or `time.sleep()` to any test file.
- **Never** use untyped TypeScript `any` without an inline comment explaining why.
- **Never** hardcode secrets in Dockerfiles, compose files, or source code.
- **Never** create LangGraph conditional edges that bypass the `guardrail` node.
- **Never** change `PROMPT_VERSION` without the full version bump protocol (version increment + `tool_calls_made` tag + MLflow param + `docs/eval_decisions.md` entry).
- **Never** use plain dicts for LangGraph state — always TypedDict with Annotated fields.
- **Never** add DeepEval metrics without documenting what model behavior they measure.
- **Never** omit `data-testid` attributes from interactive frontend elements.
- **Never** hardcode threshold values in `ci_gate.py` — must be env-var overridable.
- **Never** use GitHub Actions `@latest` versions — always pin (e.g., `actions/checkout@v4`).
- **Never** set GEval as a hard gate without noting that its variance requires 3+ run averaging.
- **Never** fabricate API signatures, method names, or library behavior you haven't verified.
- **Never** deploy a prompt or model change without a pre-deploy eval run.
- **Never** use bare `except Exception` in LLM call wrappers — catch specific OpenAI exception types.
- **Never** create an agent loop without a maximum iteration guard.
- **Never** weaken guardrail constraints to improve helpfulness or tone scores — safety takes precedence.
- **Never** use `allow_origins=["*"]` in production — restrict CORS to `settings.domain`.
- **Never** use fire-and-forget Qdrant writes for user-initiated document uploads — use `wait=True`.

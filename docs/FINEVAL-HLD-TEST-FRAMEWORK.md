# FinEval HLD — Test Framework

Read this when working in `test_framework/functional/`, `test_framework/load/`, or
`test_framework/performance/`. DeepEval/LLM-quality testing is a separate discipline — see
`FINEVAL-HLD-EVAL-FRAMEWORK.md`.

This document describes the **proposed** suite boundaries, which differ from what's
currently in the repo — see §7 for the delta.

---

## 1. Overview

`test_framework/` is a separate `uv` workspace with three non-eval suites, each with a
distinct concern:

| Suite | Concern | Tooling |
|---|---|---|
| `functional/` | Correctness — does the app behave as specified | Playwright, page-object model |
| `load/` | Throughput and behaviour under concurrent load | Locust (API) + Playwright (browser-based load actions) |
| `performance/` | UI performance budgets | Lighthouse only |

---

## 2. Functional Suite

Unchanged from current state. Page-object model (`base_page.py`, `chat_page.py`,
`analyse_page.py`, `documents_page.py`), Allure markers (`smoke`, `regression`, `chat`,
`analyse`, `documents`). No timing concern here — that's `load/` or `performance/`.

```bash
cd test_framework/functional
uv run pytest tests/ -m smoke -v
```

---

## 3. Load Suite (proposed)

Two distinct load-testing concerns live here:

### 3.1 API endpoint load — Locust

Replaces the current aiohttp-based `runner.py`. Locust drives concurrent virtual users
against `/chat`, `/analyse`, `/documents/upload` directly (no browser).

```bash
cd test_framework/load
locust -f locustfile.py --host http://localhost:8000
```

### 3.2 Browser-based load — select e2e actions

A small set of e2e actions exercised under concurrent browser load, not just API load —
these specifically need a real browser because the behaviour under test involves
client-side work (upload UX, streaming render), not just server throughput:

- **Document upload** — concurrent uploads, verifying UI state stays consistent under load
- **Agentic response** — concurrent chat sessions, verifying response rendering doesn't
  degrade under concurrent LangGraph invocations

This is Playwright-driven, using load-style concurrency (multiple browser contexts), not
the functional suite's single-session correctness checks. **No `time.sleep()` or
`page.waitForTimeout()`** — same rule as functional (`fineval-code-quality`,
`fineval-performance`); use explicit waits.

---

## 4. Performance Suite (proposed) — Lighthouse only

Scope narrows to Lighthouse CI exclusively — performance, accessibility, and
best-practices thresholds against the built `frontend/dist`, not the dev server. Browser
timing assertions (Navigation Timing API) that previously lived here move to `load/` §3.2,
since they're really about behaviour under concurrent use, not a standalone performance
budget.

```bash
cd test_framework/performance
uv run pytest tests/test_lighthouse.py -v
```

---

## 5. Shared Config

All suites read `test_framework/.env.test` (`API_URL`, `BASE_URL`, etc.). Each suite still
runs independently from its own subdirectory — no suite depends on another suite's state.

---

## 6. CI Integration — separate workflows

Each test discipline gets its own GitHub Actions workflow, replacing the single sequential
`test-suite.yml`:

| Workflow | Runs | Blocks pipeline? |
|---|---|---|
| `test-functional.yml` | Playwright functional/smoke/regression | No — `continue-on-error: true` |
| `test-load.yml` | Locust + browser-load suite | No — `continue-on-error: true` |
| `test-performance.yml` | Lighthouse | No — `continue-on-error: true` |
| `test-eval.yml` | DeepEval (see Eval HLD) | No — `continue-on-error: true`, **but `ci_gate.py` here is the hard gate** |

Each workflow publishes its own HTML/report artifact to GitHub Pages independently. See
`fineval-ci` for the pin-versions and boundary rules that apply to all four.

---

## 7. Delta from Current Repo State

CONTEXT.md documents the current single `test-suite.yml` with 4 sequential suites
(load/eval/functional/performance via aiohttp + Playwright timing + Lighthouse) and an
aiohttp-based `runner.py`. The proposed structure above replaces:

- aiohttp load runner → Locust + browser-based load actions
- Playwright timing tests (`test_navigation_perf.py`, `test_upload_perf.py`,
  `metrics_emitter.py`) → moved into `load/` §3.2, not `performance/`
- One sequential workflow → four independent workflows

This is a migration, not yet reflected in the running CI — treat this document as target
state until a sprint task moves it.

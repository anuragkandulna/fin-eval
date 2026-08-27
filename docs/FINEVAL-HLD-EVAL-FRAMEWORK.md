# FinEval HLD — Eval Framework

Read this when working in `test_framework/eval/`, DeepEval/GEval metrics, MLflow, or
`ci_gate.py`. This is the document the "AI-QA Engineer" positioning of the whole project
rests on — treat changes here as carefully as changes to the agent itself.

---

## 1. Overview

The eval framework answers one question objectively, on every CI run: **did this change
make the agent's responses worse?** It does this by running a fixed suite of quality
checks against the agent, scoring them, and gating the pipeline on aggregate quality —
never on any single test's pass/fail.

---

## 2. DeepEval Test Suite

| Test | Metric | Threshold | What it checks |
|---|---|---|---|
| `test_budget_advice_relevance` | `AnswerRelevancyMetric` | 0.7 | Response is on-topic for the budget question asked |
| `test_no_market_prediction_hallucination` | `GEval` (RefusalCheck) | 0.5 | Model refuses market-timing/prediction requests |
| `test_investment_disclaimer_present` | `GEval` (DisclaimerCheck) | 0.5 | SEBI-style disclaimer present on investment-adjacent responses |
| `test_budget_analysis_identifies_surplus` | `GEval` (SurplusIdentification) | 0.5 | Budget analysis correctly identifies surplus/deficit |
| `test_debt_advice_mentions_strategy` | `GEval` (DebtStrategySpecificity) | 0.5 | Debt advice names a specific strategy (avalanche/snowball), not generic advice |

---

## 3. Metric Selection Philosophy

- **Deterministic first.** `AnswerRelevancyMetric` is embedding-similarity based — cheap,
  fast, no LLM-judge variance. Used wherever "is this on-topic" is answerable without a
  judge call.
- **`GEval` (LLM-as-judge) only where deterministic is insufficient.** Refusal detection,
  disclaimer presence, and strategy specificity all require semantic judgment a regex or
  embedding-distance check can't reliably make.
- **`EVAL_MODEL=gpt-4o-mini`** as the judge model — cost vs. accuracy tradeoff. Cheap
  enough to run on every CI push, capable enough to judge these five properties reliably.
  A metric that needs a stronger judge gets that decision documented in §9, not silently
  upgraded.

---

## 4. Threshold Strategy

Baseline established on the first run against known-good mock responses (mock-first
design — see Architecture HLD §8). Working threshold set at roughly the **80th percentile**
of that baseline distribution, not an arbitrary round number. Every subsequent threshold
change requires a §9 decision-log entry.

---

## 5. Hallucination Traps / Adversarial Suite

Five categories, each must trigger refusal or guardrail sanitisation:

1. Specific stock pick requests
2. Guaranteed-return promises
3. Exact tax calculation requests
4. Personal account number questions
5. Market-timing/prediction requests

Tested at two layers — node-level assertion that `guardrail_node` actually ran (see
`fineval-agent-testing`), and output-level `GEval` judgment that the response reads as a
refusal (this document, §2). Both layers matter: a node-level pass with an output-level
fail means guardrail ran but didn't actually sanitise; the reverse means the text happens
to look safe without the mechanism firing — a false pass that breaks under phrasing drift.

---

## 6. Synthetic Data

`test_framework/data/synthetic_cases.json` — minimum 30 cases spanning budget, debt,
investment, and edge-case scenarios (zero income, extreme debt ratios, invalid inputs).

**Format:**
```json
{"input": "string", "expected_behavior": "string", "flow_type": "chat|analyse|summarise"}
```

**PII rule:** no real names, account numbers, phone numbers, or PAN in any case, ever.
Validate with a regex-detectable-PII check before adding a case — don't eyeball it.

Edge cases are weighted more valuable than happy-path cases for catching real regressions
— a suite that's 30 near-identical happy-path variants tests the same thing 30 times.

---

## 7. MLflow — Experiment Tracking & Tracing

MLflow covers both the eval-aggregate role (Tracking) and the per-request observability
role that would otherwise need Langfuse (Tracing) — see Architecture HLD §6 for why both
live in one deployed service.

### 7.1 Deploying the tracking server

A real container, not a library — unlike LangGraph, which is in-process (Architecture HLD
§6 has the full comparison table).

```yaml
mlflow:
  image: ghcr.io/mlflow/mlflow
  command: >
    mlflow server --backend-store-uri sqlite:///mlflow.db
    --default-artifact-root /mlflow/artifacts --host 0.0.0.0 --port 5000
  volumes: ["mlflow_data:/mlflow"]
  restart: unless-stopped
```

**Backend store:** SQLite is sufficient at this project's scale and avoids standing up a
second database purely for MLflow metadata. If write concurrency ever becomes a problem,
Neon can serve as the backend store instead (`postgresql://...`) — decide only if SQLite
actually becomes a bottleneck, not preemptively (Simplicity First).

Expose on port 5000, reachable via Nginx at a subdomain (e.g. `mlflow.domain.com`) — see
Architecture HLD §3.2.

### 7.2 Experiment naming

- `fineval-evals` — the eval-suite CI runs `ci_gate.py` reads from.
- A separate experiment (or a clearly distinguished run-tag scheme) for production tracing
  runs, so `ci_gate.py`'s "read the latest run for the current experiment" logic never
  accidentally picks up a live production trace instead of a CI eval run.

### 7.3 Tracking setup — `tracker.py`

```python
import mlflow
import os

EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT", "fineval-evals")

def log_eval_run(metrics: dict, params: dict) -> None:
    mlflow.set_experiment(EXPERIMENT_NAME)
    with mlflow.start_run():
        mlflow.log_params(params)   # PROMPT_VERSION, EVAL_MODEL, etc.
        mlflow.log_metrics(metrics) # per-DeepEval-test scores
```

`PROMPT_VERSION` logged as a param on every run — this is what makes §9 decision-log
entries verifiable against actual run data later.

### 7.4 Tracing setup — per-request

```python
import mlflow

mlflow.langchain.autolog()  # instruments LangChain/LangGraph calls automatically
```

For finer control than autologging gives, wrap individual node LLM calls explicitly:

```python
with mlflow.start_span(name="response_node") as span:
    result = await llm.ainvoke(messages)
    span.set_outputs({"response": result.content})
```

Every `llm.ainvoke()` call in `nodes.py` should be covered — a partially-instrumented flow
produces incomplete traces that look complete (same failure mode Langfuse instrumentation
would have had — see `fineval-rag-observability`, which needs updating to reflect MLflow
Tracing rather than `LangfuseCallbackHandler`).

### 7.5 Surfacing `trace_url`

```python
trace_id = mlflow.get_current_active_span().trace_id  # inside a traced call
trace_url = f"{settings.mlflow_tracking_uri}/#/experiments/{exp_id}/traces/{trace_id}"
```

Populated into `ChatResponse.trace_url` / `AnalyseResponse.trace_url` — the frontend
contract already expects this field (`null` until wired — see Client Use Cases HLD §4).

---

## 8. ci_gate.py — The Hard Gate

```python
THRESHOLDS = {
    "answer_relevancy_score": float(os.getenv("GATE_RELEVANCY", "0.7")),
    "refusal_score":          float(os.getenv("GATE_REFUSAL",   "0.5")),
    "disclaimer_score":       float(os.getenv("GATE_DISCLAIMER","0.5")),
}
```

Reads the latest `fineval-evals` MLflow run, compares against these env-var-overridable
thresholds, `sys.exit(1)` on breach. The **only** step across all four CI workflows
(Test Framework HLD §6) permitted to fail the pipeline.

---

## 9. Decision Log — `eval_decisions.md`

Every threshold or metric change gets an entry here: decision, rationale, date,
`PROMPT_VERSION` at time of decision. Worked example:

```markdown
## 2026-08-27 — AnswerRelevancyMetric threshold: 0.7
**Decision:** Set threshold to 0.7 (80th percentile of 20-run baseline against mock responses).
**Rationale:** Baseline distribution: min 0.61, median 0.74, 80th pct 0.7, max 0.89.
0.7 catches genuinely off-topic responses without flagging normal variance in on-topic ones.
**PROMPT_VERSION at decision time:** v3
```

---

## 10. Relationship to RAG Grounding

Grounding validation (does the response avoid claiming facts absent from
`retrieved_docs`) uses a `GEval` faithfulness-style criteria — full detail in
`FINEVAL-HLD-DATA.md` §3 and `fineval-rag-observability`. Chunk-size and embedding-model
changes both require an entry in this document's §9, since they can shift what "grounded"
even means for a given query.

---

## 11. Gaps

MLflow integration (both Tracking and Tracing), `ci_gate.py`, and the synthetic data
generator are Sprint 3-scoped in CONTEXT.md — not built as of this document's writing.

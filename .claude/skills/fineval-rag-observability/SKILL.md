---
name: fineval-rag-observability
description: "RAG grounding validation and Langfuse/MLflow tracing for FinEval. Use when touching Qdrant retrieval, chunk size, embedding consistency, similarity thresholds, trace_id propagation, or PROMPT_VERSION-as-MLflow-param logging. Consult before changing anything in the retrieval or observability pipeline."
---

# FinEval RAG & Observability

## RAG grounding

- `chunk_size=512`, `overlap=64` is a versioned contract — changing it requires re-running
  `test_rag_quality.py` and a new `docs/eval_decisions.md` entry (see
  `fineval-eval-framework`). Never change it as a side effect of an unrelated task.
- Similarity threshold `0.5`, top-k `4` — test boundary conditions (a query that should
  retrieve nothing, one that should retrieve exactly at the threshold).
- `wait=True` on Qdrant writes is a `fineval-destructive-operations` concern, but also a
  grounding concern: a read immediately after a fire-and-forget write can miss the chunk
  entirely, producing a false "not grounded" test failure that isn't actually a grounding bug.
- Grounding validation: the response must not claim facts absent from `retrieved_docs` — use
  `GEval` with a faithfulness-style criteria (see `fineval-eval-framework` for metric
  selection logic).
- The embedding model (`text-embedding-ada-002`) is locked — changing it silently shifts the
  entire vector space and invalidates prior similarity thresholds. Treat like a chunk-size
  change: same contract, same `eval_decisions.md` requirement.

## Observability

- `trace_id` must propagate through `FinanceAgentState` to every node that makes an LLM call
  — it's how a Langfuse trace ties back to a specific agent run.
- Every AI response returns `trace_url` — never `null` in production once Langfuse is wired;
  `null` is only acceptable pre-integration (see `fineval-architecture-guard` for the
  schema-level rule).
- `LangfuseCallbackHandler` must be passed to every `llm.ainvoke()` call in `nodes.py`, not
  just the first one in a flow — a partially-instrumented flow produces incomplete traces
  that look complete.
- `PROMPT_VERSION` is logged as an MLflow param on every eval run — this is what makes
  `eval_decisions.md` entries verifiable against actual run data later.
- MLflow experiment naming convention: `fineval-evals`. Don't create ad-hoc experiment names
  per test run — it fragments `ci_gate.py`'s "read the latest run for the current experiment"
  logic.

## eval_decisions.md vs. MLflow

Decisions (why a threshold was chosen) live in the markdown doc. Metrics (what score a run
actually produced) live in MLflow. They're complementary, not duplicates — don't put raw
scores in `eval_decisions.md` or rationale-only prose in MLflow params.

## Before finishing

- [ ] Any chunk_size/similarity-threshold/embedding-model change has a `test_rag_quality.py`
      re-run and `eval_decisions.md` entry?
- [ ] New Qdrant write path uses `wait=True` (cross-check `fineval-destructive-operations`)?
- [ ] New `llm.ainvoke()` call has the Langfuse handler attached?
- [ ] `trace_url` populated (or explicitly `null` pre-integration) on every AI response?
- [ ] `PROMPT_VERSION` logged as an MLflow param on the eval run touched?

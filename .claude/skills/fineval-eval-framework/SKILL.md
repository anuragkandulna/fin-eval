---
name: fineval-eval-framework
description: "DeepEval metric selection, threshold strategy, and synthetic test data design for FinEval. Use when touching test_framework/eval/, DeepEval/GEval metrics, docs/eval_decisions.md, ci_gate.py thresholds, or test_framework/data/synthetic_cases.json. Consult before adding or changing a metric or threshold, not after a flaky test appears."
---

# FinEval Eval Framework

## Metric selection

- `AnswerRelevancyMetric` (threshold 0.7) — embedding-similarity based, used where "is this
  on-topic" is answerable without a full LLM-judge call.
- `GEval` (threshold 0.5) — LLM-as-judge, used only where a deterministic check is
  insufficient (refusal detection, disclaimer presence, surplus identification, debt-strategy
  specificity — all require semantic judgment a regex can't do reliably).
- Prefer deterministic checks first. Reach for `GEval` only when the property being tested is
  genuinely about meaning, not presence/absence of a token.

## Threshold strategy

- Baseline on the first run against known-good mock responses (mock-first design). Set the
  working threshold at roughly the 80th percentile of that baseline run — not an arbitrary
  round number.
- `EVAL_MODEL=gpt-4o-mini` — cost vs. accuracy tradeoff: cheap enough to run on every CI push,
  capable enough to judge relevance/refusal/disclaimer reliably. Document in
  `eval_decisions.md` if a specific metric ever needs a different judge model.

## eval_decisions.md as versioned contract

Every threshold change requires a new entry: decision, rationale, date, `PROMPT_VERSION` at
time of decision. This includes `chunk_size` changes (see `fineval-rag-observability`) — the
eval harness and the RAG pipeline are coupled through this document.

## ci_gate.py

The only step that reads MLflow metrics and calls `sys.exit(1)` on breach — see `fineval-ci`
for its place in the pipeline. Thresholds always env-var overridable, never hardcoded.

## Synthetic data (test_framework/data/synthetic_cases.json)

- No real names, account numbers, phone numbers, or PAN — ever, in any test case.
- Minimum 30 cases: budget, debt, investment, and edge cases (zero income, extreme debt
  ratios, invalid inputs). Edge cases are more valuable than happy-path cases for catching
  real regressions.
- Format: `{"input": str, "expected_behavior": str, "flow_type": str}`.
- Validate no regex-detectable PII before adding any case to the suite — run the check, don't
  eyeball it.

## Before finishing

- [ ] New metric: deterministic tried first, `GEval` only if genuinely needed?
- [ ] New/changed threshold: `eval_decisions.md` entry added with rationale + date +
      `PROMPT_VERSION`?
- [ ] New `ci_gate.py` threshold: env-var overridable?
- [ ] New synthetic case: PII-checked, matches the 3-field format, saved to
      `synthetic_cases.json`?

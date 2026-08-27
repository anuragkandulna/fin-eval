---
name: fineval-performance
description: "Load testing, browser performance timing, and Lighthouse CI for FinEval. Use when touching test_framework/load/, test_framework/performance/, Locust/aiohttp load patterns, or Lighthouse thresholds. Consult before adding a timing assertion or load scenario."
---

# FinEval Performance

## No sleep, ever

No `time.sleep()` or `page.waitForTimeout()` in any performance or load test file — same rule
as `fineval-code-quality`, restated here because it's the single most common shortcut in
performance test code specifically (waiting "long enough" for a page to settle instead of
asserting a real condition). Browser timing assertions use the Navigation Timing API (or
Playwright's built-in performance APIs), not a sleep-then-measure pattern.

## Load runner

- Invocation: `uv run python runner.py <users> <duration>` — e.g. 20 users, 60 seconds.
- Load tests use `continue-on-error: true` in CI — `ci_gate.py` is still the only hard gate
  (see `fineval-ci`); a load test failure surfaces in the report, it doesn't block the
  pipeline by itself.

## Lighthouse CI

- Thresholds cover performance, accessibility, and best-practices categories — don't add a
  threshold for a category without deciding what regresses the build vs. what's advisory.
- Lighthouse runs against the built `frontend/dist`, not the dev server — a passing score in
  dev mode (unminified, unbundled) doesn't mean anything about prod.

## Performance budgets

- Set per-endpoint (`chat`, `analyse`, `documents/upload`) — these have very different
  expected latencies (`documents/upload` includes Qdrant ingestion; `chat` is a single LLM
  round-trip plus guardrail). One blanket budget across all three will be wrong for at least
  one of them.
- An LLM-backed endpoint's budget should account for the two-call pattern (`response_node` +
  `guardrail_node`) — don't set a budget calibrated to a single OpenAI call when every flow
  makes two.

## Before finishing

- [ ] No sleep/waitForTimeout introduced in any load or performance test?
- [ ] New load scenario uses the existing `runner.py <users> <duration>` pattern?
- [ ] New Lighthouse threshold: decided blocking vs. advisory?
- [ ] New performance budget: per-endpoint, accounts for the two-LLM-call pattern where
      relevant?

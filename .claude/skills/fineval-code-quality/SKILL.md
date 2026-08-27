---
name: fineval-code-quality
description: "Linting, type checking, and formatting standards for FinEval. Use when a lint or type error needs resolving, before committing, or when tempted to silence a checker with noqa, type: ignore, any, a bare except Exception, time.sleep(), or a missing data-testid. Consult to find the correct fix, not the fastest suppression."
---

# FinEval Code Quality

Read `pyproject.toml` / frontend lint config for the exact toolchain in use — this skill
states the rules that must hold regardless of which specific linter/formatter is configured.

## Never bare `except Exception` in LLM wrappers

- Catch specific OpenAI exception types (`RateLimitError`, `APITimeoutError`,
  `APIConnectionError`, etc.) around every `llm.ainvoke()` call in `agent/nodes.py`.
- A bare `except Exception` around an LLM call swallows real bugs (bad state shape, a `None`
  where a `str` is expected) alongside legitimate API failures — the log can't tell you which
  one happened.

## TypeScript `any`

- Never `any` without an inline comment explaining why. If the type is genuinely unknown, use
  `unknown` and narrow it explicitly.
- `any` is not a suppression, it's a deletion — it removes checking from that value and
  everything derived from it.

## Test files

- No `page.waitForTimeout()` or `time.sleep()` — ever, in any test file (functional,
  performance, load). Use explicit waits (Playwright's built-in waiting, polling on a real
  condition) instead.
- Every interactive frontend element needs a `data-testid` attribute — it's what the
  Playwright page objects (`base_page.py`, `chat_page.py`, etc.) select against. A missing one
  breaks the test suite silently until someone chases a selector.

## Secrets

No hardcoded secrets anywhere — API keys, connection strings, SSH keys. Env vars only. This
applies to test fixtures too: synthetic test data (`fineval-eval-framework`) must not
accidentally embed a real key copied from a working example.

## Before finishing

- [ ] Every `llm.ainvoke()` call wrapped in a specific-exception catch, not bare
      `except Exception`?
- [ ] Any new `any` has an inline comment, or was `unknown` used instead?
- [ ] No `time.sleep()`/`waitForTimeout()` introduced in any test file?
- [ ] New interactive frontend elements have `data-testid`?
- [ ] No secret literal anywhere, including test fixtures?

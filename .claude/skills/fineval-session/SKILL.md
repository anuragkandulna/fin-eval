---
name: fineval-session
description: "Session persistence conventions for FinEval. Currently scaffolded — session_id exists as a state field but ChatSession ORM model and message history persistence are not yet built. Use when working on Sprint 1.5 session persistence, or any code that reads/writes session_id today. Will expand once ChatSession exists."
---

# FinEval Session (Tier 3 — phase-gated scaffold)

## Live now

`session_id` is already a field on `FinanceAgentState` and is passed through requests
(`ChatRequest.session_id`) — but nothing persists it yet. Don't assume history exists just
because `session_id` is present in the state; the agent currently has no memory across
requests.

## Scaffolded, not yet built (Sprint 1.5)

- `ChatSession` ORM model (`id`, `session_id`, `messages` JSON, `created_at`, `updated_at`)
  will own message history — see `fineval-migrations` for how this model gets introduced
  (`create_all`, not Alembic, until the first post-deployment schema change).
- `chat.py` router will need to: load session history by `session_id` before invoking the
  agent, pass it as the initial `messages` state, and persist updated messages after the run
  completes.
- Once built: `session_id` also becomes a security question (see `fineval-security`'s
  RAG-data-exfiltration note) — a `session_id` is effectively an unauthenticated capability
  token until real auth exists. Don't let session lookup trust a client-supplied `session_id`
  for anything beyond convenience continuity until that's addressed.

## Before finishing

- [ ] If `ChatSession` now exists: does this skill still say "not yet built"? If so, it needs
      a real rewrite, not a patch.
- [ ] Any code reading `session_id` today — does it correctly treat it as non-persistent (no
      history) rather than assuming Sprint 1.5 is done?

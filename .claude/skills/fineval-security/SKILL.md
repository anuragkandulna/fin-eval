---
name: fineval-security
description: "Security constraints for FinEval. Currently scaffolded with only the CORS rule live. Use when touching CORS configuration now; will expand to cover prompt injection, RAG data exfiltration, and broader OWASP LLM Top 10 concerns after Langfuse integration and Sprint 1 completion. Consult before assuming CORS restriction is optional."
---

# FinEval Security (Tier 3 — phase-gated scaffold)

## Live now

Never `allow_origins=["*"]` in production. Restrict to `settings.domain`. Local/dev mode:
also allow `http://localhost:3000`. (Same rule as `fineval-architecture-guard`'s CORS
section — this skill is the security-framing entry point; that skill is the architectural
enforcement point. Both must stay in sync if either changes.)

## Scaffolded, not yet built

Activates after the CORS fix and Langfuse integration are complete, per CONTEXT.md.

- **Prompt injection defense** — user input reaching `rag_node`/`response_node` without
  sanitisation is an open question not yet addressed.
- **RAG data exfiltration** — whether a crafted query could retrieve document content that
  shouldn't cross a session boundary. Not currently a concern (no multi-tenant document
  isolation yet), but becomes one the moment session persistence + per-user documents exist
  (Sprint 1.5).
- **Broader OWASP LLM Top 10 / MITRE ATLAS coverage** — deferred until the above two are real.

## Before finishing

- [ ] CORS still restricted (not wildcard)?
- [ ] If this skill is being expanded: is the trigger condition (Langfuse integration done,
      Sprint 1 complete) actually met, or is this premature?

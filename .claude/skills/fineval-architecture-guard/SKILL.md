---
name: fineval-architecture-guard
description: "Enforces FinEval backend/agent/API architecture conventions. Use whenever writing or modifying LangGraph state, nodes, or edges in backend/app/agent/, any router in backend/app/routers/, CORS configuration in main.py, PROMPT_VERSION in prompts.py, or API response schemas. Consult before writing agent or router code, not after."
---

# FinEval Architecture Guard

Governed by Karpathy rules 1-4 (Think Before Coding, Simplicity First, Surgical Changes,
Goal-Driven Execution). Where this file and those conflict, the Karpathy rules win.

## LangGraph state

- Always `TypedDict` with `Annotated` fields — `FinanceAgentState` in `state.py`. Never plain dicts.
- `messages: Annotated[list[BaseMessage], add_messages]` uses a reducer because multiple
  nodes append to it. Scalar/dict fields (e.g. `budget_result`) don't need `Annotated` unless
  a new field is also written by more than one node.

## Guardrail node

- No LangGraph conditional edge may bypass `guardrail`. Every `flow_type` branch
  (`chat` / `analyse` / `summarise`) must terminate through `guardrail` before `END`.
- `guardrail_node` runs a second `ChatOpenAI` call (`GUARDRAIL_SYSTEM`) that sanitises/redacts
  `final_response`. Adding a new node or flow_type? Trace its path to `guardrail` before merging.

## PROMPT_VERSION protocol

Never change `PROMPT_VERSION` without all four steps:
1. Bump the version string in `prompts.py`
2. Tag the change in `tool_calls_made`
3. Add an MLflow param on the next eval run
4. Add a `docs/eval_decisions.md` entry

Current: `PROMPT_VERSION = "v3"`.

## CORS

- Never `allow_origins=["*"]` in production.
- Restrict to `settings.domain` (`https://{domain}`, `https://app.{domain}`).
- Local/dev mode: also allow `http://localhost:3000`.

## API conventions

- Every AI response (`ChatResponse`, `AnalyseResponse`) returns `trace_url: string | null` —
  never omit the field, even before Langfuse is wired (return `null` explicitly).
- `response_model` and `status_code` declared on every route.
- Any streaming response follows the same `trace_id` / `tool_calls_made` contract as
  non-streaming responses.

## Before finishing

- [ ] Every new/changed state field lives on `FinanceAgentState` as `TypedDict`?
- [ ] Every `flow_type` path reaches `guardrail` before `END`?
- [ ] If `PROMPT_VERSION` was touched: all 4 bump-protocol steps done?
- [ ] CORS still restricted to `settings.domain` (+ localhost in dev)?
- [ ] Every AI-response schema includes `trace_url`?
